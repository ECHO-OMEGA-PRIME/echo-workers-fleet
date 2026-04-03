/**
 * echo-graph-rag — Secured Cloudflare Worker
 * Graph RAG knowledge graph for Echo Prime doctrine system
 *
 * SECURITY FIXES (C48):
 * - Added auth middleware (X-Echo-API-Key) on ALL endpoints except /health
 * - If ECHO_API_KEY not set in env, returns 503
 * - Added rate limiting (100 req/min per IP)
 * - Sanitized all error messages (never returns err.message to clients)
 * - Replaced wildcard CORS with origin allowlist
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';

// ─── Types ───────────────────────────────────────────────────────
interface Env {
  DB: D1Database;
  DOCTRINES_DB: D1Database;
  CACHE: KVNamespace;
  ECHO_API_KEY: string;
  ENVIRONMENT: string;
}

interface GraphNode {
  id: string;
  label: string;
  type: string;
  domain: string | null;
  properties: Record<string, unknown>;
  doctrine_ids: string[];
  weight: number;
  updated_at: string;
}

interface GraphEdge {
  id: number;
  source_id: string;
  target_id: string;
  relationship: string;
  weight: number;
  properties: Record<string, unknown>;
}

interface Doctrine {
  id: number;
  engine_id: string;
  topic: string;
  keywords: string[];
  conclusion_template: string;
  reasoning_framework: string;
  key_factors: string[];
  authorities: string[];
  confidence: number;
  domain: string;
}

// ─── Constants ───────────────────────────────────────────────────
const ALLOWED_ORIGINS = ['https://echo-ept.com', 'https://echo-op.com'];
const CACHE_TTL_SECONDS = 300;
const MAX_BATCH_SIZE = 500;
const MAX_HOPS = 5;
const MAX_RESULTS = 50;
const QUERY_TIME_BUDGET_MS = 8_000;
const TRAVERSE_TIME_BUDGET_MS = 10_000;
const EXPLAIN_TIME_BUDGET_MS = 8_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 100;

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
  'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
  'may', 'might', 'shall', 'can', 'that', 'which', 'who', 'whom', 'this',
  'these', 'those', 'it', 'its', 'not', 'no', 'nor', 'as', 'if', 'then',
  'than', 'too', 'very', 'just', 'about', 'also', 'into', 'over', 'after',
  'before', 'between', 'under', 'above', 'such', 'each', 'every', 'all',
  'any', 'both', 'few', 'more', 'most', 'other', 'some', 'only', 'same',
  'so', 'what', 'how', 'when', 'where', 'why', 'while', 'during', 'through',
  'because', 'since', 'until',
]);

// ─── Rate Limiter (in-memory, per-isolate) ───────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  if (rateLimitMap.size > 1000) cleanupRateLimits();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT_MAX;
}

// Cleanup stale rate limit entries (called lazily during checkRateLimit)
function cleanupRateLimits(): void {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(ip);
  }
}

// ─── Logging ─────────────────────────────────────────────────────
function log(level: string, message: string, data?: Record<string, unknown>): void {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    worker: 'echo-graph-rag',
    message,
    ...data,
  };
  if (level === 'error') console.error(JSON.stringify(entry));
  else console.log(JSON.stringify(entry));
}

// ─── Helpers ─────────────────────────────────────────────────────
function jsonParse<T>(val: unknown, fallback: T): T {
  if (typeof val === 'string') {
    try { return JSON.parse(val) as T; } catch { return fallback; }
  }
  if (Array.isArray(val)) return val as unknown as T;
  return fallback;
}

function dbNodeToGraphNode(row: Record<string, unknown>): GraphNode {
  return {
    id: row.id as string,
    label: row.label as string,
    type: row.type as string,
    domain: (row.domain as string) || null,
    properties: jsonParse(row.properties, {}),
    doctrine_ids: jsonParse(row.doctrine_ids, []),
    weight: (row.weight as number) || 0,
    updated_at: (row.updated_at as string) || '',
  };
}

function dbEdgeToGraphEdge(row: Record<string, unknown>): GraphEdge {
  return {
    id: row.id as number,
    source_id: row.source_id as string,
    target_id: row.target_id as string,
    relationship: row.relationship as string,
    weight: (row.weight as number) || 1,
    properties: jsonParse(row.properties, {}),
  };
}

function d1RowToDoctrine(row: Record<string, unknown>): Doctrine {
  const engineId = (row.engine_id as string) || 'unknown';
  const domain = engineId.split('-')[0] || 'general';
  return {
    id: row.id as number,
    engine_id: engineId,
    topic: (row.topic as string) || '',
    keywords: jsonParse(row.keywords, []),
    conclusion_template: (row.conclusion as string) || '',
    reasoning_framework: (row.reasoning as string) || '',
    key_factors: jsonParse(row.key_factors, []),
    authorities: jsonParse(row.authorities, []),
    confidence: (row.confidence as number) || 0,
    domain,
  };
}

function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));
}

function cosineSimilarity(termsA: string[], termsB: string[]): number {
  const setA = new Set(termsA);
  const setB = new Set(termsB);
  let intersection = 0;
  for (const t of setA) { if (setB.has(t)) intersection++; }
  const denom = Math.sqrt(setA.size) * Math.sqrt(setB.size);
  return denom > 0 ? intersection / denom : 0;
}

// ─── Doctrine fetch ──────────────────────────────────────────────
async function fetchDoctrines(env: Env, offset: number, limit: number): Promise<{ doctrines: Doctrine[]; total: number }> {
  try {
    const [countRes, dataRes] = await Promise.all([
      env.DOCTRINES_DB.prepare('SELECT COUNT(*) as cnt FROM doctrines').first(),
      env.DOCTRINES_DB.prepare(
        'SELECT id, engine_id, topic, keywords, conclusion, reasoning, key_factors, authorities, confidence FROM doctrines ORDER BY id LIMIT ? OFFSET ?'
      ).bind(limit, offset).all(),
    ]);
    const total = (countRes as Record<string, number>)?.cnt || 0;
    const doctrines = (dataRes.results || []).map((row) => d1RowToDoctrine(row as Record<string, unknown>));
    return { doctrines, total };
  } catch (err) {
    log('error', 'doctrine_fetch_failed', { error: String(err) });
    return { doctrines: [], total: 0 };
  }
}

async function fetchDoctrineById(env: Env, doctrineId: string): Promise<Doctrine | null> {
  try {
    const numId = parseInt(doctrineId, 10);
    if (!isNaN(numId)) {
      const row = await env.DOCTRINES_DB.prepare(
        'SELECT id, engine_id, topic, keywords, conclusion, reasoning, key_factors, authorities, confidence FROM doctrines WHERE id = ?'
      ).bind(numId).first();
      if (row) return d1RowToDoctrine(row as Record<string, unknown>);
    }
    const row = await env.DOCTRINES_DB.prepare(
      'SELECT id, engine_id, topic, keywords, conclusion, reasoning, key_factors, authorities, confidence FROM doctrines WHERE INSTR(LOWER(topic), LOWER(?)) > 0 LIMIT 1'
    ).bind(doctrineId).first();
    if (row) return d1RowToDoctrine(row as Record<string, unknown>);
    return null;
  } catch {
    return null;
  }
}

// ─── Entity/Edge extraction ──────────────────────────────────────
interface ExtractedEntity {
  id: string;
  label: string;
  type: string;
  domain: string;
  context: string;
  source_doctrine_id: string;
}

interface ExtractedEdge {
  source_id: string;
  target_id: string;
  relationship: string;
  weight: number;
  doctrine_id: string;
}

function extractEntitiesFromDoctrine(doctrine: Doctrine): ExtractedEntity[] {
  const entities: ExtractedEntity[] = [];
  const docId = String(doctrine.id);
  const domain = doctrine.domain;

  // Topic as entity
  const topicId = `${domain}:${doctrine.topic.toLowerCase().replace(/\s+/g, '_').substring(0, 80)}`;
  entities.push({
    id: topicId,
    label: doctrine.topic,
    type: 'concept',
    domain,
    context: doctrine.conclusion_template?.substring(0, 200) || '',
    source_doctrine_id: docId,
  });

  // Keywords as entities
  for (const kw of doctrine.keywords.slice(0, 10)) {
    const kwId = `${domain}:kw:${kw.toLowerCase().replace(/\s+/g, '_').substring(0, 60)}`;
    entities.push({ id: kwId, label: kw, type: 'keyword', domain, context: '', source_doctrine_id: docId });
  }

  // Authorities as entities
  for (const auth of doctrine.authorities.slice(0, 5)) {
    const authId = `authority:${auth.toLowerCase().replace(/\s+/g, '_').substring(0, 60)}`;
    entities.push({ id: authId, label: auth, type: 'authority', domain, context: '', source_doctrine_id: docId });
  }

  // Key factors as entities
  for (const factor of doctrine.key_factors.slice(0, 5)) {
    const factorId = `${domain}:factor:${factor.toLowerCase().replace(/\s+/g, '_').substring(0, 60)}`;
    entities.push({ id: factorId, label: factor, type: 'factor', domain, context: '', source_doctrine_id: docId });
  }

  return entities;
}

function extractEdgesFromDoctrine(doctrine: Doctrine, entities: ExtractedEntity[]): ExtractedEdge[] {
  const edges: ExtractedEdge[] = [];
  const docId = String(doctrine.id);
  if (entities.length < 2) return edges;

  const topicEntity = entities.find((e) => e.type === 'concept');
  if (!topicEntity) return edges;

  for (const entity of entities) {
    if (entity.id === topicEntity.id) continue;
    let relationship = 'related_to';
    if (entity.type === 'keyword') relationship = 'has_keyword';
    else if (entity.type === 'authority') relationship = 'cited_by';
    else if (entity.type === 'factor') relationship = 'influenced_by';

    edges.push({ source_id: topicEntity.id, target_id: entity.id, relationship, weight: 1.0, doctrine_id: docId });
  }
  return edges;
}

function findCrossDoctrineEdges(
  nodeMap: Map<string, { doctrineIds: Set<string>; domains: Set<string> }>
): ExtractedEdge[] {
  const edges: ExtractedEdge[] = [];
  const nodeEntries = Array.from(nodeMap.entries());
  for (let i = 0; i < nodeEntries.length && i < 500; i++) {
    for (let j = i + 1; j < nodeEntries.length && j < 500; j++) {
      const [idA, dataA] = nodeEntries[i];
      const [idB, dataB] = nodeEntries[j];
      let shared = 0;
      for (const d of dataA.doctrineIds) { if (dataB.doctrineIds.has(d)) shared++; }
      if (shared >= 2) {
        edges.push({ source_id: idA, target_id: idB, relationship: 'co_referenced', weight: shared * 0.3, doctrine_id: 'cross' });
      }
    }
  }
  return edges;
}

// ─── Community Detection ─────────────────────────────────────────
async function detectCommunities(db: D1Database): Promise<number> {
  const edgeResult = await db.prepare(
    'SELECT source_id, target_id, weight FROM edges WHERE weight >= 0.5 ORDER BY weight DESC LIMIT 10000'
  ).all();
  if (!edgeResult.results || edgeResult.results.length === 0) return 0;

  const adjacency = new Map<string, Map<string, number>>();
  for (const row of edgeResult.results) {
    const s = row.source_id as string;
    const t = row.target_id as string;
    const w = (row.weight as number) || 1;
    if (!adjacency.has(s)) adjacency.set(s, new Map());
    if (!adjacency.has(t)) adjacency.set(t, new Map());
    adjacency.get(s)!.set(t, w);
    adjacency.get(t)!.set(s, w);
  }

  const labels = new Map<string, string>();
  for (const nodeId of adjacency.keys()) labels.set(nodeId, nodeId);

  for (let iter = 0; iter < 10; iter++) {
    let changed = false;
    for (const [nodeId, neighbors] of adjacency) {
      const labelCounts = new Map<string, number>();
      for (const [neighborId, weight] of neighbors) {
        const nLabel = labels.get(neighborId) || neighborId;
        labelCounts.set(nLabel, (labelCounts.get(nLabel) || 0) + weight);
      }
      let bestLabel = labels.get(nodeId)!;
      let bestCount = 0;
      for (const [label, count] of labelCounts) {
        if (count > bestCount) { bestCount = count; bestLabel = label; }
      }
      if (bestLabel !== labels.get(nodeId)) { labels.set(nodeId, bestLabel); changed = true; }
    }
    if (!changed) break;
  }

  const communities = new Map<string, Set<string>>();
  for (const [nodeId, label] of labels) {
    if (!communities.has(label)) communities.set(label, new Set());
    communities.get(label)!.add(nodeId);
  }

  await db.prepare('DELETE FROM communities').run();
  let communitiesFound = 0;
  const stmts: D1PreparedStatement[] = [];
  for (const [, members] of communities) {
    if (members.size < 3) continue;
    communitiesFound++;
    const memberArr = Array.from(members).slice(0, 500);
    const domains = new Set<string>();
    for (const mId of memberArr.slice(0, 20)) {
      const d = mId.split(':')[0];
      if (d) domains.add(d);
    }
    stmts.push(
      db.prepare(
        'INSERT INTO communities (name, node_ids, summary, domains, size, density) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(
        `community_${communitiesFound}`,
        JSON.stringify(memberArr),
        `Community of ${members.size} nodes`,
        JSON.stringify(Array.from(domains)),
        members.size,
        0
      )
    );
    if (stmts.length >= 80) {
      await db.batch(stmts.splice(0, stmts.length));
    }
  }
  if (stmts.length > 0) await db.batch(stmts);
  return communitiesFound;
}

// ─── App ─────────────────────────────────────────────────────────
const app = new Hono<{ Bindings: Env }>();

// CORS with origin allowlist
app.use('*', cors({
  origin: (o: string) => ALLOWED_ORIGINS.includes(o) ? o : ALLOWED_ORIGINS[0],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Echo-API-Key'],
}));

// Security headers
app.use('*', async (c, next) => {
  await next();
  c.res.headers.set('X-Content-Type-Options', 'nosniff');
  c.res.headers.set('X-Frame-Options', 'DENY');
  c.res.headers.set('X-XSS-Protection', '1; mode=block');
  c.res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  c.res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
});

// Rate limiting middleware (all routes)
app.use('*', async (c, next) => {
  const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';
  if (!checkRateLimit(ip)) {
    return c.json({ error: 'Rate limit exceeded. Try again later.' }, 429);
  }
  await next();
});

// Auth middleware — exempt only /health
app.use('*', async (c, next) => {
  const path = new URL(c.req.url).pathname;
  if (path === '/health') {
    return next();
  }

  // If ECHO_API_KEY is not configured, refuse all authenticated requests
  if (!c.env.ECHO_API_KEY) {
    log('error', 'ECHO_API_KEY not configured — refusing request', { path });
    return c.json({ error: 'Service misconfigured' }, 503);
  }

  const key = c.req.header('X-Echo-API-Key') || c.req.header('Authorization')?.replace('Bearer ', '');
  if (!key || key !== c.env.ECHO_API_KEY) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  await next();
});

// ─── Routes ──────────────────────────────────────────────────────

// Health check (no auth required)
app.get('/health', async (c) => {
  const db = c.env.DB;
  let nodeCount = 0;
  let edgeCount = 0;
  try {
    const nRes = await db.prepare('SELECT COUNT(*) as cnt FROM nodes').first() as Record<string, number> | null;
    const eRes = await db.prepare('SELECT COUNT(*) as cnt FROM edges').first() as Record<string, number> | null;
    nodeCount = nRes?.cnt || 0;
    edgeCount = eRes?.cnt || 0;
  } catch {
    log('warn', 'Health check DB count failed, tables may not exist yet');
  }
  return c.json({
    status: 'healthy',
    service: 'echo-graph-rag',
    version: '1.1.0',
    graph: { nodes: nodeCount, edges: edgeCount },
    uptime: Date.now(),
    environment: c.env.ENVIRONMENT,
  });
});

// Graph stats
app.get('/graph/stats', async (c) => {
  const db = c.env.DB;
  const cache = c.env.CACHE;
  const cached = await cache.get('graph:stats', 'json');
  if (cached) return c.json(cached);
  try {
    const [nodeCountRes, edgeCountRes, communityCountRes, nodeTypeRes, edgeRelRes, topNodesRes, crossDomainRes, domainNodeRes, lastBuildRes] = await Promise.all([
      db.prepare('SELECT COUNT(*) as cnt FROM nodes').first(),
      db.prepare('SELECT COUNT(*) as cnt FROM edges').first(),
      db.prepare('SELECT COUNT(*) as cnt FROM communities').first(),
      db.prepare('SELECT type, COUNT(*) as cnt FROM nodes GROUP BY type').all(),
      db.prepare('SELECT relationship, COUNT(*) as cnt FROM edges GROUP BY relationship').all(),
      db.prepare(`
        SELECT n.id, n.label, COUNT(e.id) as connections
        FROM nodes n LEFT JOIN edges e ON (e.source_id = n.id OR e.target_id = n.id)
        GROUP BY n.id ORDER BY connections DESC LIMIT 20
      `).all(),
      db.prepare(`
        SELECT COUNT(*) as cnt FROM edges e
        JOIN nodes n1 ON e.source_id = n1.id
        JOIN nodes n2 ON e.target_id = n2.id
        WHERE n1.domain != n2.domain AND n1.domain IS NOT NULL AND n2.domain IS NOT NULL
      `).first(),
      db.prepare('SELECT domain, COUNT(*) as cnt FROM nodes WHERE domain IS NOT NULL GROUP BY domain').all(),
      db.prepare('SELECT created_at FROM build_log ORDER BY id DESC LIMIT 1').first(),
    ]);
    const totalNodes = (nodeCountRes as any)?.cnt || 0;
    const totalEdges = (edgeCountRes as any)?.cnt || 0;
    const nodeTypeDist: Record<string, number> = {};
    for (const row of (nodeTypeRes.results || []) as any[]) nodeTypeDist[row.type] = row.cnt;
    const edgeRelDist: Record<string, number> = {};
    for (const row of (edgeRelRes.results || []) as any[]) edgeRelDist[row.relationship] = row.cnt;
    const domainDist: Record<string, { nodes: number; edges: number }> = {};
    for (const row of (domainNodeRes.results || []) as any[]) domainDist[row.domain] = { nodes: row.cnt, edges: 0 };
    const mostConnected = ((topNodesRes.results || []) as any[]).map((r) => ({ id: r.id, label: r.label, connections: r.connections }));
    const avgDegree = totalNodes > 0 ? (2 * totalEdges) / totalNodes : 0;
    const maxPossibleEdges = (totalNodes * (totalNodes - 1)) / 2;
    const density = maxPossibleEdges > 0 ? totalEdges / maxPossibleEdges : 0;
    const stats = {
      total_nodes: totalNodes,
      total_edges: totalEdges,
      total_communities: (communityCountRes as any)?.cnt || 0,
      node_type_distribution: nodeTypeDist,
      edge_relationship_distribution: edgeRelDist,
      domain_distribution: domainDist,
      most_connected_nodes: mostConnected,
      cross_domain_edge_count: (crossDomainRes as any)?.cnt || 0,
      avg_degree: Math.round(avgDegree * 100) / 100,
      density: Math.round(density * 1e4) / 1e4,
      last_build: (lastBuildRes as any)?.created_at || null,
    };
    await cache.put('graph:stats', JSON.stringify(stats), { expirationTtl: CACHE_TTL_SECONDS });
    return c.json(stats);
  } catch (err) {
    log('error', 'Failed to compute stats', { error: String(err) });
    return c.json({ error: 'Failed to compute stats' }, 500);
  }
});

// Graph domains
app.get('/graph/domains', async (c) => {
  const db = c.env.DB;
  try {
    const domainResult = await db.prepare(`
      SELECT domain, COUNT(*) as node_count FROM nodes
      WHERE domain IS NOT NULL GROUP BY domain ORDER BY node_count DESC
    `).all();
    const domains = [];
    for (const row of (domainResult.results || []) as any[]) {
      const domain = row.domain;
      const edgeRes = await db.prepare(`
        SELECT COUNT(*) as cnt FROM edges e
        JOIN nodes n ON (e.source_id = n.id OR e.target_id = n.id)
        WHERE n.domain = ?
      `).bind(domain).first() as any;
      const conceptRes = await db.prepare(`
        SELECT label FROM nodes WHERE domain = ? AND type IN ('concept', 'keyword')
        ORDER BY weight DESC LIMIT 5
      `).bind(domain).all();
      const connRes = await db.prepare(`
        SELECT DISTINCT n2.domain FROM edges e
        JOIN nodes n1 ON e.source_id = n1.id JOIN nodes n2 ON e.target_id = n2.id
        WHERE n1.domain = ? AND n2.domain != ? AND n2.domain IS NOT NULL LIMIT 10
      `).bind(domain, domain).all();
      domains.push({
        domain,
        node_count: row.node_count,
        edge_count: edgeRes?.cnt || 0,
        top_concepts: ((conceptRes.results || []) as any[]).map((r) => r.label),
        connected_domains: ((connRes.results || []) as any[]).map((r) => r.domain),
      });
    }
    return c.json({ domains, total: domains.length });
  } catch (err) {
    log('error', 'Failed to list domains', { error: String(err) });
    return c.json({ error: 'Failed to list domains' }, 500);
  }
});

// Get single node
app.get('/graph/node/:id', async (c) => {
  const db = c.env.DB;
  const nodeId = decodeURIComponent(c.req.param('id'));
  try {
    const nodeRow = await db.prepare('SELECT * FROM nodes WHERE id = ?').bind(nodeId).first();
    if (!nodeRow) return c.json({ error: 'Node not found' }, 404);
    const node = dbNodeToGraphNode(nodeRow as Record<string, unknown>);
    const edgeResult = await db.prepare(
      'SELECT * FROM edges WHERE source_id = ? OR target_id = ? ORDER BY weight DESC LIMIT 100'
    ).bind(nodeId, nodeId).all();
    const edges = ((edgeResult.results || []) as any[]).map((r) => dbEdgeToGraphEdge(r));
    const connectedIds = new Set<string>();
    for (const e of edges) {
      if (e.source_id !== nodeId) connectedIds.add(e.source_id);
      if (e.target_id !== nodeId) connectedIds.add(e.target_id);
    }
    let connectedNodes: GraphNode[] = [];
    if (connectedIds.size > 0) {
      const ids = Array.from(connectedIds).slice(0, 50);
      const placeholders = ids.map(() => '?').join(',');
      const connResult = await db.prepare(`SELECT * FROM nodes WHERE id IN (${placeholders})`).bind(...ids).all();
      connectedNodes = ((connResult.results || []) as any[]).map((r) => dbNodeToGraphNode(r));
    }
    return c.json({ node, edges, connected_nodes: connectedNodes, connection_count: edges.length });
  } catch (err) {
    log('error', 'Failed to fetch node', { error: String(err) });
    return c.json({ error: 'Failed to fetch node' }, 500);
  }
});

// Cross-domain connections
app.get('/graph/connections/:domain1/:domain2', async (c) => {
  const db = c.env.DB;
  const domain1 = decodeURIComponent(c.req.param('domain1'));
  const domain2 = decodeURIComponent(c.req.param('domain2'));
  try {
    const directEdges = await db.prepare(`
      SELECT e.*, n1.label as source_label, n1.domain as source_domain,
             n2.label as target_label, n2.domain as target_domain
      FROM edges e JOIN nodes n1 ON e.source_id = n1.id JOIN nodes n2 ON e.target_id = n2.id
      WHERE (n1.domain = ? AND n2.domain = ?) OR (n1.domain = ? AND n2.domain = ?)
      ORDER BY e.weight DESC LIMIT 50
    `).bind(domain1, domain2, domain2, domain1).all();
    const bridgingNodes = await db.prepare(`
      SELECT DISTINCT n.id, n.label, n.type, n.domain, n.weight, n.doctrine_ids
      FROM nodes n
      JOIN edges e1 ON (e1.source_id = n.id OR e1.target_id = n.id)
      JOIN nodes n1 ON (CASE WHEN e1.source_id = n.id THEN e1.target_id ELSE e1.source_id END) = n1.id
      JOIN edges e2 ON (e2.source_id = n.id OR e2.target_id = n.id)
      JOIN nodes n2 ON (CASE WHEN e2.source_id = n.id THEN e2.target_id ELSE e2.source_id END) = n2.id
      WHERE n1.domain = ? AND n2.domain = ? AND n.id != n1.id AND n.id != n2.id LIMIT 20
    `).bind(domain1, domain2).all();
    return c.json({
      from_domain: domain1,
      to_domain: domain2,
      shortest_path: ((bridgingNodes.results || []) as any[]).map((r) => dbNodeToGraphNode(r)),
      bridging_edges: ((directEdges.results || []) as any[]).map((r) => dbEdgeToGraphEdge(r)),
      bridging_doctrines: [],
      total_paths: (directEdges.results?.length || 0) + (bridgingNodes.results?.length || 0),
    });
  } catch (err) {
    log('error', 'Failed to find connections', { error: String(err) });
    return c.json({ error: 'Failed to find connections' }, 500);
  }
});

// Build graph
app.post('/graph/build', async (c) => {
  const db = c.env.DB;
  const cache = c.env.CACHE;
  const startTime = Date.now();
  let body: any = {};
  try { body = await c.req.json(); } catch { /* defaults */ }

  const forceRebuild = body.force_rebuild ?? false;
  const filterDomains = body.domains || null;
  const batchSize = Math.min(body.batch_size || MAX_BATCH_SIZE, MAX_BATCH_SIZE);
  const maxDoctrines = Math.min(body.max_doctrines || 3000, 5000);
  const startOffset = body.start_offset || 0;

  try {
    const buildLog = await db.prepare(
      "INSERT INTO build_log (action, status) VALUES (?, 'running') RETURNING id"
    ).bind(forceRebuild ? 'rebuild' : 'incremental').first() as any;
    const buildId = buildLog?.id || 0;

    if (forceRebuild && startOffset === 0) {
      await db.batch([
        db.prepare('DELETE FROM edges'),
        db.prepare('DELETE FROM nodes'),
        db.prepare('DELETE FROM communities'),
      ]);
    }

    let offset = startOffset;
    let totalDoctrines = 0;
    const allEntities: ExtractedEntity[] = [];
    const allEdges: ExtractedEdge[] = [];
    const nodeMap = new Map<string, { doctrineIds: Set<string>; domains: Set<string> }>();
    let totalFetched = 0;

    while (totalFetched < maxDoctrines) {
      const fetchLimit = Math.min(batchSize, maxDoctrines - totalFetched);
      const { doctrines, total } = await fetchDoctrines(c.env, offset, fetchLimit);
      if (totalDoctrines === 0) totalDoctrines = total;
      if (doctrines.length === 0) break;

      for (const doctrine of doctrines) {
        if (filterDomains && !filterDomains.includes(doctrine.domain)) continue;
        const entities = extractEntitiesFromDoctrine(doctrine);
        const edges = extractEdgesFromDoctrine(doctrine, entities);
        allEntities.push(...entities);
        allEdges.push(...edges);
        for (const entity of entities) {
          if (!nodeMap.has(entity.id)) nodeMap.set(entity.id, { doctrineIds: new Set(), domains: new Set() });
          nodeMap.get(entity.id)!.doctrineIds.add(entity.source_doctrine_id);
          nodeMap.get(entity.id)!.domains.add(entity.domain);
        }
      }
      totalFetched += doctrines.length;
      offset += batchSize;
    }

    if (nodeMap.size < 10_000) {
      allEdges.push(...findCrossDoctrineEdges(nodeMap));
    }

    const uniqueNodes = new Map<string, ExtractedEntity>();
    const nodeDoctrineIds = new Map<string, Set<string>>();
    for (const entity of allEntities) {
      if (!uniqueNodes.has(entity.id)) {
        uniqueNodes.set(entity.id, entity);
        nodeDoctrineIds.set(entity.id, new Set());
      }
      nodeDoctrineIds.get(entity.id)!.add(entity.source_doctrine_id);
    }

    const uniqueEdgeMap = new Map<string, ExtractedEdge>();
    for (const edge of allEdges) {
      const key = `${edge.source_id}|${edge.target_id}|${edge.relationship}`;
      const reverseKey = `${edge.target_id}|${edge.source_id}|${edge.relationship}`;
      if (!uniqueEdgeMap.has(key) && !uniqueEdgeMap.has(reverseKey)) {
        uniqueEdgeMap.set(key, edge);
      } else {
        const existing = uniqueEdgeMap.get(key) || uniqueEdgeMap.get(reverseKey);
        if (existing) existing.weight = Math.min(existing.weight + 0.1, 3);
      }
    }

    let nodesCreated = 0;
    const nodeStmts: D1PreparedStatement[] = [];
    for (const [nodeId, entity] of uniqueNodes) {
      const docIds = Array.from(nodeDoctrineIds.get(nodeId) || []);
      nodeStmts.push(
        db.prepare(`
          INSERT OR REPLACE INTO nodes (id, label, type, domain, properties, doctrine_ids, weight, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `).bind(nodeId, entity.label, entity.type, entity.domain, JSON.stringify({ context: entity.context }), JSON.stringify(docIds.slice(0, 100)), docIds.length)
      );
      nodesCreated++;
      if (nodeStmts.length >= 80) await db.batch(nodeStmts.splice(0, nodeStmts.length));
    }
    if (nodeStmts.length > 0) await db.batch(nodeStmts);

    let edgesCreated = 0;
    const edgeStmts: D1PreparedStatement[] = [];
    for (const [, edge] of uniqueEdgeMap) {
      if (!uniqueNodes.has(edge.source_id) || !uniqueNodes.has(edge.target_id)) continue;
      edgeStmts.push(
        db.prepare('INSERT INTO edges (source_id, target_id, relationship, weight, properties) VALUES (?, ?, ?, ?, ?)')
          .bind(edge.source_id, edge.target_id, edge.relationship, edge.weight, JSON.stringify({ doctrine_id: edge.doctrine_id }))
      );
      edgesCreated++;
      if (edgeStmts.length >= 80) await db.batch(edgeStmts.splice(0, edgeStmts.length));
    }
    if (edgeStmts.length > 0) await db.batch(edgeStmts);

    const communitiesFound = await detectCommunities(db);
    const domainResult = await db.prepare('SELECT DISTINCT domain FROM nodes WHERE domain IS NOT NULL ORDER BY domain').all();
    const domainsConnected = ((domainResult.results || []) as any[]).map((r) => r.domain);
    const durationMs = Date.now() - startTime;

    await db.prepare(`
      UPDATE build_log SET nodes_created = ?, edges_created = ?, communities_found = ?,
        doctrines_processed = ?, duration_ms = ?, status = 'complete' WHERE id = ?
    `).bind(nodesCreated, edgesCreated, communitiesFound, totalFetched, durationMs, buildId).run();
    await cache.delete('graph:stats');

    const nextOffset = startOffset + totalFetched;
    const hasMore = nextOffset < totalDoctrines;
    const response: Record<string, unknown> = {
      status: hasMore ? 'partial' : 'complete',
      build_id: buildId,
      nodes_created: nodesCreated,
      edges_created: edgesCreated,
      communities_found: communitiesFound,
      doctrines_processed: totalFetched,
      domains_connected: domainsConnected,
      duration_ms: durationMs,
    };
    if (hasMore) {
      response.next_offset = nextOffset;
      response.has_more = true;
      response.total_doctrines = totalDoctrines;
    }
    return c.json(response);
  } catch (err) {
    const durationMs = Date.now() - startTime;
    try {
      await db.prepare(
        "INSERT INTO build_log (action, status, error, duration_ms) VALUES ('build', 'failed', ?, ?)"
      ).bind(String(err), durationMs).run();
    } catch {
      log('warn', 'Failed to log build failure to D1');
    }
    log('error', 'Build failed', { error: String(err), duration_ms: durationMs });
    return c.json({ error: 'Build failed', duration_ms: durationMs }, 500);
  }
});

// Query graph (NL)
app.post('/graph/query', async (c) => {
  const db = c.env.DB;
  let body: any;
  try { body = await c.req.json(); } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }
  if (!body.query || body.query.trim().length === 0) return c.json({ error: 'Query is required' }, 400);

  const maxHops = Math.min(body.max_hops || 2, MAX_HOPS);
  const maxResults = Math.min(body.max_results || 20, MAX_RESULTS);
  const filterDomains = body.domains || null;
  const includeDoctrines = body.include_doctrines ?? true;

  try {
    const queryKeywords = extractKeywords(body.query);
    if (queryKeywords.length === 0) return c.json({ error: 'Could not extract meaningful keywords from query' }, 400);

    const matchedNodes: GraphNode[] = [];
    const matchedNodeIds = new Set<string>();

    for (const term of queryKeywords.slice(0, 5)) {
      const safeTerm = term.replace(/'/g, "''").substring(0, 40);
      if (safeTerm.length < 3) continue;
      let sql: string;
      const binds: (string | number)[] = [safeTerm];
      if (filterDomains && filterDomains.length > 0) {
        const domainPlaceholders = filterDomains.map(() => '?').join(',');
        sql = `SELECT * FROM nodes WHERE INSTR(LOWER(label), LOWER(?)) > 0 AND (domain IN (${domainPlaceholders}) OR domain IS NULL) ORDER BY weight DESC LIMIT 10`;
        binds.push(...filterDomains);
      } else {
        sql = 'SELECT * FROM nodes WHERE INSTR(LOWER(label), LOWER(?)) > 0 ORDER BY weight DESC LIMIT 10';
      }
      try {
        const result = await db.prepare(sql).bind(...binds).all();
        for (const row of (result.results || []) as any[]) {
          const node = dbNodeToGraphNode(row);
          if (!matchedNodeIds.has(node.id)) { matchedNodeIds.add(node.id); matchedNodes.push(node); }
        }
      } catch (e) {
        log('error', 'node_search_failed', { term, error: String(e) });
      }
    }

    const traversedEdges: GraphEdge[] = [];
    const visitedNodeIds = new Set(matchedNodeIds);
    let currentFrontier = new Set(matchedNodeIds);
    let nodesSearched = matchedNodes.length;
    let edgesTraversed = 0;
    let hopsUsed = 0;
    let timedOut = false;
    const queryStartTime = Date.now();
    const hubNodeThreshold = 500;
    const hubNodeIds = new Set<string>();

    for (const nodeId of currentFrontier) {
      const degreeCheck = await db.prepare(
        'SELECT COUNT(*) as cnt FROM edges WHERE source_id = ? OR target_id = ?'
      ).bind(nodeId, nodeId).first() as any;
      if (degreeCheck && degreeCheck.cnt > hubNodeThreshold) hubNodeIds.add(nodeId);
    }

    for (let hop = 0; hop < maxHops; hop++) {
      if (currentFrontier.size === 0) break;
      if (Date.now() - queryStartTime > QUERY_TIME_BUDGET_MS) { timedOut = true; break; }
      const nextFrontier = new Set<string>();
      const frontierArray = Array.from(currentFrontier).filter((id) => !hubNodeIds.has(id)).slice(0, 10);

      for (const nodeId of frontierArray) {
        if (Date.now() - queryStartTime > QUERY_TIME_BUDGET_MS) { timedOut = true; break; }
        const edgeResult = await db.prepare(
          'SELECT * FROM edges WHERE source_id = ? OR target_id = ? ORDER BY weight DESC LIMIT 8'
        ).bind(nodeId, nodeId).all();
        for (const row of (edgeResult.results || []) as any[]) {
          const edge = dbEdgeToGraphEdge(row);
          traversedEdges.push(edge);
          edgesTraversed++;
          const neighborId = edge.source_id === nodeId ? edge.target_id : edge.source_id;
          if (!visitedNodeIds.has(neighborId)) { visitedNodeIds.add(neighborId); nextFrontier.add(neighborId); }
        }
      }
      if (timedOut) break;
      if (nextFrontier.size > 0) {
        const newIds = Array.from(nextFrontier).slice(0, 30);
        const placeholders = newIds.map(() => '?').join(',');
        const nodeResult = await db.prepare(`SELECT * FROM nodes WHERE id IN (${placeholders})`).bind(...newIds).all();
        for (const row of (nodeResult.results || []) as any[]) { matchedNodes.push(dbNodeToGraphNode(row)); nodesSearched++; }
      }
      currentFrontier = nextFrontier;
      hopsUsed = hop + 1;
    }

    const doctrineIdSet = new Set<string>();
    for (const node of matchedNodes) { for (const dId of node.doctrine_ids) doctrineIdSet.add(dId); }

    const connectedDoctrines: any[] = [];
    if (includeDoctrines && doctrineIdSet.size > 0) {
      const doctrineScores = new Map<string, number>();
      for (const node of matchedNodes) {
        const nodeRelevance = cosineSimilarity(extractKeywords(node.label), queryKeywords);
        for (const dId of node.doctrine_ids) doctrineScores.set(dId, (doctrineScores.get(dId) || 0) + nodeRelevance + node.weight * 0.1);
      }
      const doctrineLimit = Math.min(maxResults, 10);
      const sortedDoctrines = Array.from(doctrineScores.entries()).sort((a, b) => b[1] - a[1]).slice(0, doctrineLimit);
      for (const [docId, score] of sortedDoctrines) {
        if (Date.now() - queryStartTime > QUERY_TIME_BUDGET_MS) break;
        const referencingNodes = matchedNodes.filter((n) => n.doctrine_ids.includes(docId));
        const connectionPath = referencingNodes.map((n) => n.label).slice(0, 5);
        const domain = referencingNodes[0]?.domain || 'unknown';
        const fullDoctrine = await fetchDoctrineById(c.env, docId);
        connectedDoctrines.push({
          doctrine_id: docId,
          engine_id: fullDoctrine?.engine_id || docId.split(':')[0] || 'unknown',
          domain,
          topic: fullDoctrine?.topic || referencingNodes[0]?.label || docId,
          content: fullDoctrine?.conclusion_template || fullDoctrine?.reasoning_framework || '',
          relevance_score: Math.round(score * 100) / 100,
          connection_path: connectionPath,
        });
      }
    }

    const crossDomainInsights: any[] = [];
    const domainPairs = new Map<string, { concepts: Set<string>; doctrines: Set<string>; edges: number }>();
    for (const edge of traversedEdges) {
      const sourceNode = matchedNodes.find((n) => n.id === edge.source_id);
      const targetNode = matchedNodes.find((n) => n.id === edge.target_id);
      if (sourceNode && targetNode && sourceNode.domain && targetNode.domain && sourceNode.domain !== targetNode.domain) {
        const pairKey = [sourceNode.domain, targetNode.domain].sort().join('|');
        if (!domainPairs.has(pairKey)) domainPairs.set(pairKey, { concepts: new Set(), doctrines: new Set(), edges: 0 });
        const pair = domainPairs.get(pairKey)!;
        pair.concepts.add(sourceNode.label);
        pair.concepts.add(targetNode.label);
        for (const d of sourceNode.doctrine_ids) pair.doctrines.add(d);
        for (const d of targetNode.doctrine_ids) pair.doctrines.add(d);
        pair.edges++;
      }
    }
    for (const [pairKey, data] of domainPairs) {
      const [fromDomain, toDomain] = pairKey.split('|');
      crossDomainInsights.push({
        from_domain: fromDomain, to_domain: toDomain,
        bridging_concepts: Array.from(data.concepts).slice(0, 10),
        bridging_doctrines: Array.from(data.doctrines).slice(0, 10),
        relationship_type: 'cross_domain',
        strength: Math.min(data.edges * 0.2, 1),
      });
    }

    const involvedCommunities: any[] = [];
    const nodeIdList = Array.from(matchedNodeIds).slice(0, 20);
    if (nodeIdList.length > 0) {
      for (const nodeId of nodeIdList.slice(0, 5)) {
        const commResult = await db.prepare('SELECT * FROM communities WHERE INSTR(node_ids, ?) > 0 LIMIT 3').bind(nodeId).all();
        for (const row of (commResult.results || []) as any[]) {
          const comm = { id: row.id, name: row.name, node_ids: jsonParse(row.node_ids, []), summary: row.summary, domains: jsonParse(row.domains, []), size: row.size || 0, density: row.density || 0, created_at: row.created_at };
          if (!involvedCommunities.find((c2: any) => c2.id === comm.id)) involvedCommunities.push(comm);
        }
      }
    }

    const domainsCrossed = new Set<string>();
    for (const node of matchedNodes) { if (node.domain) domainsCrossed.add(node.domain); }

    const response: Record<string, unknown> = {
      query: body.query,
      matched_nodes: matchedNodes.slice(0, maxResults),
      traversed_edges: traversedEdges.slice(0, 100),
      connected_doctrines: connectedDoctrines,
      cross_domain_insights: crossDomainInsights,
      communities_involved: involvedCommunities.slice(0, 5),
      stats: { nodes_searched: nodesSearched, edges_traversed: edgesTraversed, domains_crossed: domainsCrossed.size, hops_used: hopsUsed },
    };
    if (timedOut) response.partial = true;
    response.time_ms = Date.now() - queryStartTime;
    return c.json(response);
  } catch (err) {
    log('error', 'Query failed', { error: String(err) });
    return c.json({ error: 'Query failed' }, 500);
  }
});

// Traverse graph
app.post('/graph/traverse', async (c) => {
  const db = c.env.DB;
  let body: any;
  try { body = await c.req.json(); } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }
  if (!body.start_node) return c.json({ error: 'start_node is required' }, 400);

  const maxDepth = Math.min(body.max_depth || 2, MAX_HOPS);
  const direction = body.direction || 'both';
  const filterDomain = body.filter_domain || null;
  const filterRelationship = body.filter_relationship || null;

  try {
    let startRow = await db.prepare('SELECT * FROM nodes WHERE id = ?').bind(body.start_node).first();
    if (!startRow) {
      const searchResult = await db.prepare(
        "SELECT * FROM nodes WHERE INSTR(LOWER(label), LOWER(?)) > 0 ORDER BY weight DESC LIMIT 1"
      ).bind(body.start_node).first();
      if (!searchResult) return c.json({ error: 'Start node not found' }, 404);
      body.start_node = (searchResult as any).id;
      startRow = searchResult;
    }
    const startNode = dbNodeToGraphNode(startRow as Record<string, unknown>);
    const visited = [startNode];
    const visitedIds = new Set([startNode.id]);
    const collectedEdges: GraphEdge[] = [];
    const paths: string[][] = [[startNode.id]];
    let frontier = new Set([startNode.id]);
    let depthReached = 0;
    let traverseTimedOut = false;
    const traverseStart = Date.now();

    for (let depth = 0; depth < maxDepth; depth++) {
      if (frontier.size === 0) break;
      if (Date.now() - traverseStart > TRAVERSE_TIME_BUDGET_MS) { traverseTimedOut = true; break; }
      const nextFrontier = new Set<string>();
      const newPaths: string[][] = [];
      const frontierSlice = Array.from(frontier).slice(0, 15);

      for (const nodeId of frontierSlice) {
        if (Date.now() - traverseStart > TRAVERSE_TIME_BUDGET_MS) { traverseTimedOut = true; break; }
        let edgeQuery: string;
        const binds: string[] = [];
        if (direction === 'outbound') { edgeQuery = 'SELECT * FROM edges WHERE source_id = ?'; binds.push(nodeId); }
        else if (direction === 'inbound') { edgeQuery = 'SELECT * FROM edges WHERE target_id = ?'; binds.push(nodeId); }
        else { edgeQuery = 'SELECT * FROM edges WHERE source_id = ? OR target_id = ?'; binds.push(nodeId, nodeId); }
        if (filterRelationship) { edgeQuery += ' AND relationship = ?'; binds.push(filterRelationship); }
        edgeQuery += ' ORDER BY weight DESC LIMIT 12';
        const edgeResult = await db.prepare(edgeQuery).bind(...binds).all();
        for (const row of (edgeResult.results || []) as any[]) {
          const edge = dbEdgeToGraphEdge(row);
          collectedEdges.push(edge);
          const neighborId = edge.source_id === nodeId ? edge.target_id : edge.source_id;
          if (!visitedIds.has(neighborId)) {
            visitedIds.add(neighborId);
            nextFrontier.add(neighborId);
            const parentPath = paths.find((p) => p[p.length - 1] === nodeId) || [nodeId];
            newPaths.push([...parentPath, neighborId]);
          }
        }
      }
      if (traverseTimedOut) break;
      if (nextFrontier.size > 0) {
        const newIds = Array.from(nextFrontier).slice(0, 40);
        const placeholders = newIds.map(() => '?').join(',');
        let nodeQuery = `SELECT * FROM nodes WHERE id IN (${placeholders})`;
        const nodeBinds: string[] = [...newIds];
        if (filterDomain) { nodeQuery += ' AND domain = ?'; nodeBinds.push(filterDomain); }
        const nodeResult = await db.prepare(nodeQuery).bind(...nodeBinds).all();
        const validIds = new Set<string>();
        for (const row of (nodeResult.results || []) as any[]) { const node = dbNodeToGraphNode(row); visited.push(node); validIds.add(node.id); }
        if (filterDomain) { for (const id of nextFrontier) { if (!validIds.has(id)) nextFrontier.delete(id); } }
      }
      paths.push(...newPaths);
      frontier = nextFrontier;
      depthReached = depth + 1;
    }
    const response: Record<string, unknown> = { start_node: startNode, visited: visited.slice(0, 200), edges: collectedEdges.slice(0, 500), depth_reached: depthReached, paths: paths.slice(0, 100) };
    if (traverseTimedOut) response.partial = true;
    response.time_ms = Date.now() - traverseStart;
    return c.json(response);
  } catch (err) {
    log('error', 'Traversal failed', { error: String(err) });
    return c.json({ error: 'Traversal failed' }, 500);
  }
});

// Community detection / list
app.post('/graph/community', async (c) => {
  const db = c.env.DB;
  let body: any = {};
  try { body = await c.req.json(); } catch { /* defaults */ }
  try {
    if (body.refresh) {
      const communitiesFound = await detectCommunities(db);
      return c.json({ status: 'complete', communities_found: communitiesFound, message: `Detected ${communitiesFound} communities via label propagation` });
    }
    const minSize = body.min_size || 3;
    const result = await db.prepare('SELECT * FROM communities WHERE size >= ? ORDER BY size DESC LIMIT 100').bind(minSize).all();
    const communities = ((result.results || []) as any[]).map((row) => ({
      id: row.id, name: row.name, node_ids: jsonParse(row.node_ids, []), summary: row.summary,
      domains: jsonParse(row.domains, []), size: row.size || 0, density: row.density || 0, created_at: row.created_at,
    }));
    return c.json({ communities, total: communities.length, min_size_filter: minSize });
  } catch (err) {
    log('error', 'Community detection failed', { error: String(err) });
    return c.json({ error: 'Community detection failed' }, 500);
  }
});

// Search nodes
app.get('/graph/search', async (c) => {
  const db = c.env.DB;
  const q = c.req.query('q') || '';
  const type = c.req.query('type') || null;
  const domain = c.req.query('domain') || null;
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);
  if (!q) return c.json({ error: 'Query parameter q is required' }, 400);
  try {
    let query = 'SELECT * FROM nodes WHERE INSTR(LOWER(label), LOWER(?)) > 0';
    const binds: (string | number)[] = [q];
    if (type) { query += ' AND type = ?'; binds.push(type); }
    if (domain) { query += ' AND domain = ?'; binds.push(domain); }
    query += ' ORDER BY weight DESC LIMIT ?';
    binds.push(limit);
    const result = await db.prepare(query).bind(...binds).all();
    const nodes = ((result.results || []) as any[]).map((r) => dbNodeToGraphNode(r));
    return c.json({ nodes, total: nodes.length, query: q });
  } catch (err) {
    log('error', 'Search failed', { error: String(err) });
    return c.json({ error: 'Search failed' }, 500);
  }
});

// Build history
app.get('/graph/build-history', async (c) => {
  const db = c.env.DB;
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);
  try {
    const result = await db.prepare('SELECT * FROM build_log ORDER BY id DESC LIMIT ?').bind(limit).all();
    return c.json({ builds: result.results || [], total: (result.results || []).length });
  } catch (err) {
    log('error', 'Failed to fetch build history', { error: String(err) });
    return c.json({ error: 'Failed to fetch build history' }, 500);
  }
});

// Explain connection between two concepts
app.post('/graph/explain', async (c) => {
  const db = c.env.DB;
  let body: any;
  try { body = await c.req.json(); } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }
  if (!body.concept_a || !body.concept_b) return c.json({ error: 'concept_a and concept_b are required' }, 400);
  const maxHops = Math.min(body.max_hops || 3, MAX_HOPS);
  try {
    const nodeA = await db.prepare("SELECT * FROM nodes WHERE INSTR(LOWER(label), LOWER(?)) > 0 ORDER BY weight DESC LIMIT 1").bind(body.concept_a).first() as any;
    const nodeB = await db.prepare("SELECT * FROM nodes WHERE INSTR(LOWER(label), LOWER(?)) > 0 ORDER BY weight DESC LIMIT 1").bind(body.concept_b).first() as any;
    if (!nodeA || !nodeB) return c.json({ error: 'One or both concepts not found in the graph', found_a: !!nodeA, found_b: !!nodeB }, 404);

    const startId = nodeA.id;
    const targetId = nodeB.id;
    const queue: { nodeId: string; path: string[]; edges: GraphEdge[] }[] = [{ nodeId: startId, path: [startId], edges: [] }];
    const visited = new Set([startId]);
    let foundPath: { path: string[]; edges: GraphEdge[] } | null = null;
    const explainStart = Date.now();
    const MAX_QUEUE_SIZE = 200;

    while (queue.length > 0 && !foundPath) {
      if (Date.now() - explainStart > EXPLAIN_TIME_BUDGET_MS) break;
      if (queue.length > MAX_QUEUE_SIZE) queue.splice(MAX_QUEUE_SIZE);
      const current = queue.shift()!;
      if (current.path.length > maxHops + 1) break;
      const edgeResult = await db.prepare('SELECT * FROM edges WHERE source_id = ? OR target_id = ? ORDER BY weight DESC LIMIT 15').bind(current.nodeId, current.nodeId).all();
      for (const row of (edgeResult.results || []) as any[]) {
        const edge = dbEdgeToGraphEdge(row);
        const neighborId = edge.source_id === current.nodeId ? edge.target_id : edge.source_id;
        if (neighborId === targetId) { foundPath = { path: [...current.path, neighborId], edges: [...current.edges, edge] }; break; }
        if (!visited.has(neighborId) && current.path.length < maxHops + 1) {
          visited.add(neighborId);
          queue.push({ nodeId: neighborId, path: [...current.path, neighborId], edges: [...current.edges, edge] });
        }
      }
    }

    if (!foundPath) {
      return c.json({ connected: false, concept_a: { id: nodeA.id, label: nodeA.label, domain: nodeA.domain }, concept_b: { id: nodeB.id, label: nodeB.label, domain: nodeB.domain }, message: `No path found within ${maxHops} hops` });
    }

    const pathNodes: GraphNode[] = [];
    for (const nodeId of foundPath.path) {
      const row = await db.prepare('SELECT * FROM nodes WHERE id = ?').bind(nodeId).first();
      if (row) pathNodes.push(dbNodeToGraphNode(row as Record<string, unknown>));
    }
    const pathDoctrineIds = new Set<string>();
    for (const node of pathNodes) { for (const dId of node.doctrine_ids) pathDoctrineIds.add(dId); }

    return c.json({
      connected: true,
      concept_a: { id: nodeA.id, label: nodeA.label, domain: nodeA.domain },
      concept_b: { id: nodeB.id, label: nodeB.label, domain: nodeB.domain },
      path_length: foundPath.path.length - 1,
      path_nodes: pathNodes,
      path_edges: foundPath.edges,
      doctrines_along_path: Array.from(pathDoctrineIds).slice(0, 20),
      explanation: pathNodes.map((n) => `[${n.domain}] ${n.label}`).join(' -> '),
    });
  } catch (err) {
    log('error', 'Explanation failed', { error: String(err) });
    return c.json({ error: 'Explanation failed' }, 500);
  }
});

// Subgraph extraction
app.post('/graph/subgraph', async (c) => {
  const db = c.env.DB;
  let body: any;
  try { body = await c.req.json(); } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }
  if (!body.topic) return c.json({ error: 'topic is required' }, 400);
  const radius = Math.min(body.radius || 2, 4);
  const maxNodes = Math.min(body.max_nodes || 100, 500);

  try {
    const seedResult = await db.prepare(
      "SELECT * FROM nodes WHERE INSTR(LOWER(label), LOWER(?)) > 0 ORDER BY weight DESC LIMIT 5"
    ).bind(body.topic).all();
    if (!seedResult.results || seedResult.results.length === 0) {
      return c.json({ error: 'No matching nodes found for topic', topic: body.topic }, 404);
    }

    const subgraphNodes = new Map<string, GraphNode>();
    const subgraphEdges: GraphEdge[] = [];
    let frontier = new Set<string>();
    for (const row of seedResult.results as any[]) {
      const node = dbNodeToGraphNode(row);
      subgraphNodes.set(node.id, node);
      frontier.add(node.id);
    }

    const subgraphStart = Date.now();
    let subgraphTimedOut = false;
    for (let r = 0; r < radius; r++) {
      if (frontier.size === 0 || subgraphNodes.size >= maxNodes) break;
      if (Date.now() - subgraphStart > QUERY_TIME_BUDGET_MS) { subgraphTimedOut = true; break; }
      const nextFrontier = new Set<string>();
      for (const nodeId of Array.from(frontier).slice(0, 20)) {
        if (subgraphNodes.size >= maxNodes) break;
        const edgeResult = await db.prepare('SELECT * FROM edges WHERE source_id = ? OR target_id = ? ORDER BY weight DESC LIMIT 10').bind(nodeId, nodeId).all();
        for (const row of (edgeResult.results || []) as any[]) {
          const edge = dbEdgeToGraphEdge(row);
          subgraphEdges.push(edge);
          const neighborId = edge.source_id === nodeId ? edge.target_id : edge.source_id;
          if (!subgraphNodes.has(neighborId)) {
            const nRow = await db.prepare('SELECT * FROM nodes WHERE id = ?').bind(neighborId).first();
            if (nRow) { const node = dbNodeToGraphNode(nRow as Record<string, unknown>); subgraphNodes.set(node.id, node); nextFrontier.add(node.id); }
          }
        }
      }
      frontier = nextFrontier;
    }

    const response: Record<string, unknown> = {
      topic: body.topic,
      nodes: Array.from(subgraphNodes.values()).slice(0, maxNodes),
      edges: subgraphEdges.slice(0, 1000),
      node_count: subgraphNodes.size,
      edge_count: subgraphEdges.length,
    };
    if (subgraphTimedOut) response.partial = true;
    return c.json(response);
  } catch (err) {
    log('error', 'Subgraph extraction failed', { error: String(err) });
    return c.json({ error: 'Subgraph extraction failed' }, 500);
  }
});

// API docs
app.get('/', (c) => {
  return c.json({
    service: 'echo-graph-rag',
    version: '1.1.0',
    description: 'Graph RAG knowledge graph for Echo Prime',
    endpoints: {
      'GET /health': 'Health check (no auth)',
      'GET /graph/stats': 'Graph statistics',
      'GET /graph/domains': 'List domains',
      'GET /graph/node/:id': 'Get node details',
      'GET /graph/connections/:d1/:d2': 'Cross-domain connections',
      'POST /graph/build': 'Build/rebuild graph from doctrines',
      'POST /graph/query': 'Natural language graph query',
      'POST /graph/traverse': 'Graph traversal from start node',
      'POST /graph/community': 'Community detection/listing',
      'GET /graph/search': 'Search nodes by label',
      'GET /graph/build-history': 'Build history',
      'POST /graph/explain': 'Explain connection between concepts',
      'POST /graph/subgraph': 'Extract subgraph around topic',
    },
  });
});

// Error handling — sanitized
app.notFound((c) => c.json({ error: 'Not found', path: c.req.path }, 404));

app.onError((err, c) => {
  log('error', 'unhandled_error', { error: err.message, stack: err.stack, path: c.req.path, method: c.req.method });
  return c.json({ error: 'Internal server error' }, 500);
});

export default app;
