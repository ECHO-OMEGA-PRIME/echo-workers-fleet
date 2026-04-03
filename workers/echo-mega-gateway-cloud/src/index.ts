import { Hono } from 'hono';
import { cors } from 'hono/cors';

// =============================================================================
// ECHO MEGA GATEWAY CLOUD v2.0 — Universal Dynamic API Proxy
// =============================================================================
// Commander: Bobby Don McWilliams II | Authority 11.0
// Architecture: D1 schema IS the implementation. mega_execute reads server
// definitions from D1 at runtime and builds fetch() calls dynamically.
// Add a new server? Just INSERT a row. No code changes, no redeployment.
// =============================================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  ECHO_API_KEY: string;
  ENVIRONMENT: string;
  // Dynamic secret resolution — Workers secrets are accessed via env[key]
  [key: string]: unknown;
}

interface ServerRow {
  id: number;
  server_name: string;
  category: string;
  description: string | null;
  tool_count: number;
  is_cloud: number;
  cloud_url: string | null;
  status: string;
  api_base_url: string | null;
  auth_type: string | null;
  auth_key_name: string | null;
  auth_header_name: string | null;
  auth_header_prefix: string | null;
  api_pattern: string | null;
  rate_limit_rpm: number | null;
  created_at: string;
  updated_at: string;
}

interface ToolEndpointRow {
  id: number;
  server_id: number;
  tool_name: string;
  description: string | null;
  category: string | null;
  http_method: string;
  path_template: string;
  query_params_schema: string | null;
  body_schema: string | null;
  body_template: string | null;
  response_path: string | null;
  content_type: string | null;
  is_available: number;
  usage_count: number;
  last_used_at: string | null;
  created_at: string;
}

interface ExecuteRequest {
  server?: string;
  tool: string;
  params?: Record<string, unknown>;
  timeout_ms?: number;
}

interface BulkServerDef {
  server_name: string;
  category: string;
  description?: string;
  api_base_url?: string;
  auth_type?: string;
  auth_key_name?: string;
  auth_header_name?: string;
  auth_header_prefix?: string;
  api_pattern?: string;
  is_cloud?: boolean;
  cloud_url?: string;
  rate_limit_rpm?: number;
  tools?: Array<{
    tool_name: string;
    description?: string;
    http_method?: string;
    path_template?: string;
    query_params_schema?: Record<string, unknown>;
    body_schema?: Record<string, unknown>;
    body_template?: Record<string, unknown>;
    response_path?: string;
    content_type?: string;
  }>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SERVICE_NAME = 'echo-mega-gateway-cloud';
const SERVICE_VERSION = '2.0.0';
const BOOT_TIME = new Date().toISOString();

const CATEGORIES = [
  'AI_ML', 'API', 'AUTOMATION', 'CLOUD', 'COMMUNICATION', 'DATA',
  'DEVTOOLS', 'FINANCE', 'MEDIA', 'MONITORING', 'NETWORK', 'SECURITY',
  'ECHO_INTERNAL', 'IOT', 'BLOCKCHAIN',
] as const;

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  AI_ML: 'Artificial Intelligence & Machine Learning — LLM inference, embeddings, vision, training, agents',
  API: 'API management, gateway, documentation, testing, integration, and proxy tools',
  AUTOMATION: 'Workflow automation, task scheduling, CI/CD, build pipelines, orchestration',
  CLOUD: 'Cloud infrastructure — Cloudflare, AWS, Azure, GCP, DigitalOcean, Vercel',
  COMMUNICATION: 'Messaging, email, Slack, Discord, Twilio, Teams, notifications',
  DATA: 'Data processing, ETL, databases, vector stores, search, analytics, scraping',
  DEVTOOLS: 'Developer tools — git, linting, testing, debugging, code generation, CI/CD',
  FINANCE: 'Financial services — Stripe, crypto, DeFi, trading, accounting, invoicing',
  MEDIA: 'Media processing — images, audio, video, TTS, STT, OCR, streaming',
  MONITORING: 'System monitoring, alerting, logging, performance, APM, health checks',
  NETWORK: 'Network tools — DNS, proxies, VPN, tunnels, firewalls, scanning, CDN',
  SECURITY: 'Security — vulnerability scanning, credential management, encryption, SIEM',
  ECHO_INTERNAL: 'ECHO OMEGA PRIME internal workers and systems',
  IOT: 'IoT, smart home, MQTT, hardware, embedded systems',
  BLOCKCHAIN: 'Blockchain, DeFi, Web3, smart contracts, NFTs, wallets',
};

// API pattern templates for dynamic proxy
const AUTH_PATTERNS: Record<string, (key: string) => Record<string, string>> = {
  bearer: (key) => ({ Authorization: `Bearer ${key}` }),
  basic: (key) => ({ Authorization: `Basic ${key}` }),
  api_key_header: (key) => ({ 'X-API-Key': key }),
  api_key_query: (_key) => ({}), // handled in URL
  custom: (_key) => ({}), // handled per-server
  none: (_key) => ({}),
  cf_api_token: (key) => ({ Authorization: `Bearer ${key}` }),
  oauth2: (key) => ({ Authorization: `Bearer ${key}` }),
};

// ---------------------------------------------------------------------------
// Schema SQL — v2 with server definitions and tool endpoints
// ---------------------------------------------------------------------------

const SCHEMA_V2 = [
  // Original tables (backward compat)
  `CREATE TABLE IF NOT EXISTS servers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    server_name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    description TEXT,
    tool_count INTEGER DEFAULT 0,
    is_cloud INTEGER DEFAULT 0,
    cloud_url TEXT,
    status TEXT DEFAULT 'active',
    api_base_url TEXT,
    auth_type TEXT DEFAULT 'none',
    auth_key_name TEXT,
    auth_header_name TEXT DEFAULT 'Authorization',
    auth_header_prefix TEXT DEFAULT 'Bearer',
    api_pattern TEXT DEFAULT 'rest_json',
    rate_limit_rpm INTEGER DEFAULT 60,
    default_timeout_ms INTEGER DEFAULT 30000,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )`,
  `CREATE INDEX IF NOT EXISTS idx_servers_category ON servers(category)`,
  `CREATE INDEX IF NOT EXISTS idx_servers_name ON servers(server_name)`,
  `CREATE INDEX IF NOT EXISTS idx_servers_status ON servers(status)`,

  // Tool endpoints — the core of the dynamic proxy
  `CREATE TABLE IF NOT EXISTS tools (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    server_id INTEGER REFERENCES servers(id),
    tool_name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    http_method TEXT DEFAULT 'GET',
    path_template TEXT DEFAULT '/',
    query_params_schema TEXT,
    body_schema TEXT,
    body_template TEXT,
    response_path TEXT,
    content_type TEXT DEFAULT 'application/json',
    parameters TEXT,
    cloud_endpoint TEXT,
    is_available INTEGER DEFAULT 1,
    usage_count INTEGER DEFAULT 0,
    last_used_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`,
  `CREATE INDEX IF NOT EXISTS idx_tools_name ON tools(tool_name)`,
  `CREATE INDEX IF NOT EXISTS idx_tools_server ON tools(server_id)`,
  `CREATE INDEX IF NOT EXISTS idx_tools_category ON tools(category)`,

  // Usage tracking
  `CREATE TABLE IF NOT EXISTS usage_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tool_name TEXT NOT NULL,
    server_name TEXT,
    success INTEGER DEFAULT 1,
    response_time_ms INTEGER,
    error_message TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`,
  `CREATE INDEX IF NOT EXISTS idx_usage_time ON usage_log(created_at)`,

  // Rate limit tracking
  `CREATE TABLE IF NOT EXISTS rate_limits (
    server_name TEXT NOT NULL,
    window_start TEXT NOT NULL,
    request_count INTEGER DEFAULT 0,
    PRIMARY KEY (server_name, window_start)
  )`,
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function log(level: 'info' | 'warn' | 'error' | 'debug', message: string, data?: Record<string, unknown>): void {
  const entry = JSON.stringify({ ts: new Date().toISOString(), level, message, worker: SERVICE_NAME, ...data });
  if (level === 'error') console.error(entry);
  else if (level === 'warn') console.warn(entry);
  else console.log(entry);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const encoder = new TextEncoder();
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);
  let result = 0;
  for (let i = 0; i < aBytes.length; i++) {
    result |= aBytes[i] ^ bBytes[i];
  }
  return result === 0;
}

function requireAuth(c: any): boolean {
  const expected = (c.env as Env).ECHO_API_KEY || '';
  if (!expected) {
    log('error', 'ECHO_API_KEY secret not configured — blocking all authenticated requests');
    return false;
  }
  const key = c.req.header('X-Echo-API-Key') || c.req.query('api_key') || '';
  if (!key) return false;
  return timingSafeEqual(key, expected);
}

// Resolve a path template with parameters: /users/{user_id}/repos → /users/123/repos
function resolvePath(template: string, params: Record<string, unknown>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const val = params[key];
    if (val === undefined || val === null) return '';
    const str = String(val);
    // Block path traversal sequences before encoding
    if (str.includes('..') || str.includes('/') || str.includes('\\') || str.includes('\0')) {
      throw new Error(`Invalid path parameter '${key}': contains forbidden characters`);
    }
    return encodeURIComponent(str);
  });
}

// Build query string from schema + params
function buildQueryString(schema: Record<string, unknown> | null, params: Record<string, unknown>): string {
  if (!schema) return '';
  const parts: string[] = [];
  for (const key of Object.keys(schema)) {
    if (params[key] !== undefined && params[key] !== null) {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(params[key]))}`);
    }
  }
  return parts.length > 0 ? `?${parts.join('&')}` : '';
}

// Build request body from template + params
function buildBody(bodyTemplate: Record<string, unknown> | null, bodySchema: Record<string, unknown> | null, params: Record<string, unknown>): string | null {
  if (bodyTemplate) {
    // Template: replace {{param}} placeholders with actual values
    const filled: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(bodyTemplate)) {
      if (typeof val === 'string' && val.startsWith('{{') && val.endsWith('}}')) {
        const paramKey = val.slice(2, -2);
        filled[key] = params[paramKey] ?? null;
      } else {
        filled[key] = val;
      }
    }
    return JSON.stringify(filled);
  }

  if (bodySchema) {
    // Schema: pass through params that match schema keys
    const body: Record<string, unknown> = {};
    for (const key of Object.keys(bodySchema)) {
      if (params[key] !== undefined) {
        body[key] = params[key];
      }
    }
    return Object.keys(body).length > 0 ? JSON.stringify(body) : null;
  }

  // No template/schema: pass all non-path params as body
  if (Object.keys(params).length > 0) {
    return JSON.stringify(params);
  }
  return null;
}

// Extract nested response using dot-notation path: "data.items" → response.data.items
function extractResponse(data: unknown, path: string | null): unknown {
  if (!path || !data || typeof data !== 'object') return data;
  const parts = path.split('.');
  let current: any = data;
  for (const part of parts) {
    if (current === null || current === undefined) return current;
    current = current[part];
  }
  return current;
}

// Resolve auth credentials from Worker environment secrets
function resolveAuth(env: Env, server: ServerRow): Record<string, string> {
  if (!server.auth_type || server.auth_type === 'none') return {};

  const keyName = server.auth_key_name;
  if (!keyName) return {};

  // Look up secret from Worker env
  const secret = env[keyName];
  if (!secret || typeof secret !== 'string') {
    log('warn', `Secret '${keyName}' not found for server '${server.server_name}'`);
    return {};
  }

  // Custom header name/prefix
  if (server.auth_header_name && server.auth_header_prefix) {
    return { [server.auth_header_name]: `${server.auth_header_prefix} ${secret}` };
  }

  // Standard auth patterns
  const pattern = AUTH_PATTERNS[server.auth_type];
  if (pattern) return pattern(secret);

  // Default bearer
  return { Authorization: `Bearer ${secret}` };
}

// Check rate limit for a server
async function checkRateLimit(db: D1Database, serverName: string, rpm: number): Promise<boolean> {
  const now = new Date();
  const windowStart = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}T${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}`;

  try {
    const row = await db.prepare(
      'SELECT request_count FROM rate_limits WHERE server_name = ?1 AND window_start = ?2'
    ).bind(serverName, windowStart).first<{ request_count: number }>();

    if (row && row.request_count >= rpm) return false;

    await db.prepare(
      `INSERT INTO rate_limits (server_name, window_start, request_count)
       VALUES (?1, ?2, 1)
       ON CONFLICT(server_name, window_start) DO UPDATE SET request_count = request_count + 1`
    ).bind(serverName, windowStart).run();

    return true;
  } catch {
    return true; // Allow on error
  }
}

// Safe JSON parse
function safeJsonParse(str: string | null): Record<string, unknown> | null {
  if (!str) return null;
  try { return JSON.parse(str); } catch { return null; }
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

const app = new Hono<{ Bindings: Env }>();

// CORS
const ALLOWED_ORIGINS = [
  'https://echo-ept.com', 'https://www.echo-ept.com', 'https://echo-op.com',
  'https://profinishusa.com', 'https://bgat.echo-op.com', 'http://localhost:3000',
  'http://localhost:8787',
];
app.use('*', cors({
  origin: (o) => {
    if (ALLOWED_ORIGINS.includes(o)) return o;
    if (o.endsWith('.bmcii1976.workers.dev')) return o;
    if (o.endsWith('.echo-op.com')) return o;
    return ALLOWED_ORIGINS[0];
  },
}));

// Security headers
app.use('*', async (c, next) => {
  await next();
  c.res.headers.set('X-Content-Type-Options', 'nosniff');
  c.res.headers.set('X-Frame-Options', 'DENY');
  c.res.headers.set('X-XSS-Protection', '1; mode=block');
  c.res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
});

// =============================================================================
// ENDPOINTS
// =============================================================================

// ---------------------------------------------------------------------------
// GET / — Service info
// ---------------------------------------------------------------------------

app.get('/', (c) => {
  return c.json({
    service: SERVICE_NAME,
    version: SERVICE_VERSION,
    description: 'ECHO MEGA Gateway Cloud v2.0 — Universal Dynamic API Proxy. 1,873 servers, 35,817 tools. D1 schema IS the implementation.',
    boot_time: BOOT_TIME,
    environment: c.env.ENVIRONMENT,
    architecture: 'Dynamic proxy — mega_execute reads server definitions from D1, resolves auth from secrets, builds fetch() on the fly. Add a server? Just INSERT a row.',
    categories: CATEGORIES,
    endpoints: {
      'GET /': 'Service info',
      'GET /health': 'Health check with D1 + KV status',
      'GET /stats': 'Aggregate statistics — servers, tools, categories, usage',
      'GET /search?q=&category=&limit=': 'Search tools by keyword',
      'GET /servers': 'List all servers with tool counts',
      'GET /servers/:name': 'Server details + tools',
      'GET /tools': 'List tools (?page=&limit=&category=&server=)',
      'GET /tools/:name': 'Tool details + usage history',
      'GET /categories': 'Categories with counts',
      'GET /popular': 'Top 50 most-used tools',
      'POST /execute': 'DYNAMIC PROXY — Execute any tool via real API call',
      'POST /servers': 'Register a server (auth required)',
      'POST /tools': 'Register a tool (auth required)',
      'POST /tools/bulk': 'Bulk register tools (auth required)',
      'POST /import/servers': 'Bulk import server definitions with tools (auth required)',
      'POST /init-schema': 'Initialize/migrate D1 schema to v2',
      'POST /seed': 'Seed with ECHO internal workers',
      'POST /seed/full': 'Full 1,873 server seed (auth required)',
      'DELETE /rate-limits': 'Clear stale rate limit entries (auth required)',
    },
    target: { servers: 1873, tools: 35817, categories: 15 },
  });
});

// ---------------------------------------------------------------------------
// GET /health
// ---------------------------------------------------------------------------

app.get('/health', async (c) => {
  let dbOk = false;
  let dbError = '';
  let serverCount = 0;
  let toolCount = 0;

  try {
    const [check, servers, tools] = await Promise.all([
      c.env.DB.prepare('SELECT 1 AS ok').first<{ ok: number }>(),
      c.env.DB.prepare('SELECT COUNT(*) AS cnt FROM servers').first<{ cnt: number }>().catch(() => ({ cnt: 0 })),
      c.env.DB.prepare('SELECT COUNT(*) AS cnt FROM tools').first<{ cnt: number }>().catch(() => ({ cnt: 0 })),
    ]);
    dbOk = check?.ok === 1;
    serverCount = servers?.cnt ?? 0;
    toolCount = tools?.cnt ?? 0;
  } catch (e: any) {
    dbError = e.message || String(e);
  }

  let kvOk = false;
  try {
    await c.env.CACHE.put('_hc', Date.now().toString());
    kvOk = (await c.env.CACHE.get('_hc')) !== null;
  } catch {
    kvOk = false;
  }

  const healthy = dbOk && kvOk;
  return c.json({
    status: healthy ? 'healthy' : 'degraded',
    service: SERVICE_NAME,
    version: SERVICE_VERSION,
    uptime_since: BOOT_TIME,
    counts: { servers: serverCount, tools: toolCount },
    checks: { d1: dbOk ? 'ok' : `error: ${dbError}`, kv: kvOk ? 'ok' : 'error' },
  }, healthy ? 200 : 503);
});

// ---------------------------------------------------------------------------
// GET /stats
// ---------------------------------------------------------------------------

app.get('/stats', async (c) => {
  const cacheKey = 'stats_v2';
  const cached = await c.env.CACHE.get(cacheKey);
  if (cached) return c.json(JSON.parse(cached));

  const [serverCount, toolCount, catCount, usage, recent, topCats] = await Promise.all([
    c.env.DB.prepare('SELECT COUNT(*) AS cnt FROM servers').first<{ cnt: number }>(),
    c.env.DB.prepare('SELECT COUNT(*) AS cnt FROM tools').first<{ cnt: number }>(),
    c.env.DB.prepare('SELECT COUNT(DISTINCT category) AS cnt FROM servers').first<{ cnt: number }>(),
    c.env.DB.prepare(`SELECT COUNT(*) AS total, SUM(CASE WHEN success=1 THEN 1 ELSE 0 END) AS ok, SUM(CASE WHEN success=0 THEN 1 ELSE 0 END) AS fail, COALESCE(AVG(response_time_ms),0) AS avg_ms FROM usage_log`).first<{ total: number; ok: number; fail: number; avg_ms: number }>(),
    c.env.DB.prepare(`SELECT COUNT(*) AS cnt FROM usage_log WHERE created_at > datetime('now','-24 hours')`).first<{ cnt: number }>(),
    c.env.DB.prepare(`SELECT category, COUNT(*) AS servers, SUM(tool_count) AS tools FROM servers GROUP BY category ORDER BY tools DESC LIMIT 15`).all<{ category: string; servers: number; tools: number }>(),
  ]);

  const proxyCapable = await c.env.DB.prepare(`SELECT COUNT(*) AS cnt FROM servers WHERE api_base_url IS NOT NULL AND api_base_url != ''`).first<{ cnt: number }>();

  const result = {
    service: SERVICE_NAME,
    version: SERVICE_VERSION,
    servers: serverCount?.cnt ?? 0,
    tools: toolCount?.cnt ?? 0,
    categories: catCount?.cnt ?? 0,
    proxy_capable_servers: proxyCapable?.cnt ?? 0,
    usage: {
      total_executions: usage?.total ?? 0,
      successful: usage?.ok ?? 0,
      failed: usage?.fail ?? 0,
      avg_response_ms: Math.round(usage?.avg_ms ?? 0),
      last_24h: recent?.cnt ?? 0,
    },
    top_categories: topCats?.results ?? [],
  };

  await c.env.CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: 120 });
  return c.json(result);
});

// ---------------------------------------------------------------------------
// GET /search — Search tools
// ---------------------------------------------------------------------------

app.get('/search', async (c) => {
  const q = (c.req.query('q') || '').trim();
  const category = (c.req.query('category') || '').trim();
  const limit = Math.min(Math.max(parseInt(c.req.query('limit') || '25', 10), 1), 200);
  const server = (c.req.query('server') || '').trim();

  if (!q && !category && !server) {
    return c.json({ error: 'Provide at least q=, category=, or server= parameter' }, 400);
  }

  let sql = `SELECT t.id, t.tool_name, t.description, t.category, t.http_method, t.path_template, t.is_available, t.usage_count, s.server_name, s.api_base_url, s.cloud_url FROM tools t LEFT JOIN servers s ON t.server_id = s.id WHERE 1=1`;
  const params: string[] = [];

  if (q) {
    params.push(q.toUpperCase());
    sql += ` AND (INSTR(UPPER(t.tool_name), ?${params.length}) > 0 OR INSTR(UPPER(COALESCE(t.description,'')), ?${params.length}) > 0)`;
  }
  if (category) {
    params.push(category.toUpperCase());
    sql += ` AND UPPER(COALESCE(t.category, '')) = ?${params.length}`;
  }
  if (server) {
    params.push(server);
    sql += ` AND s.server_name = ?${params.length}`;
  }

  params.push(String(limit));
  sql += ` ORDER BY t.usage_count DESC LIMIT ?${params.length}`;

  const { results } = await c.env.DB.prepare(sql).bind(...params).all();

  return c.json({ query: q, category: category || null, server: server || null, count: results.length, results });
});

// ---------------------------------------------------------------------------
// GET /servers
// ---------------------------------------------------------------------------

app.get('/servers', async (c) => {
  const category = (c.req.query('category') || '').trim();
  const page = Math.max(parseInt(c.req.query('page') || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(c.req.query('limit') || '100', 10), 1), 500);
  const offset = (page - 1) * limit;

  let sql = `SELECT s.*, (SELECT COUNT(*) FROM tools WHERE server_id = s.id) AS live_tool_count FROM servers s WHERE 1=1`;
  const params: string[] = [];

  if (category) {
    params.push(category.toUpperCase());
    sql += ` AND UPPER(s.category) = ?${params.length}`;
  }

  sql += ` ORDER BY s.category, s.server_name LIMIT ?${params.length + 1} OFFSET ?${params.length + 2}`;
  params.push(String(limit), String(offset));

  const { results } = await c.env.DB.prepare(sql).bind(...params).all();
  const totalQuery = category
    ? c.env.DB.prepare('SELECT COUNT(*) AS cnt FROM servers WHERE UPPER(category) = ?1').bind(category.toUpperCase())
    : c.env.DB.prepare('SELECT COUNT(*) AS cnt FROM servers');
  const total = await totalQuery.first<{ cnt: number }>();

  return c.json({ page, limit, total: total?.cnt ?? 0, count: results.length, servers: results });
});

// ---------------------------------------------------------------------------
// GET /servers/:name
// ---------------------------------------------------------------------------

app.get('/servers/:name', async (c) => {
  const name = c.req.param('name');
  const server = await c.env.DB.prepare('SELECT * FROM servers WHERE server_name = ?1').bind(name).first<ServerRow>();
  if (!server) return c.json({ error: `Server '${name}' not found` }, 404);

  const { results: tools } = await c.env.DB.prepare(
    'SELECT tool_name, description, category, http_method, path_template, is_available, usage_count FROM tools WHERE server_id = ?1 ORDER BY tool_name'
  ).bind(server.id).all();

  return c.json({ server, tools, tool_count: tools.length });
});

// ---------------------------------------------------------------------------
// POST /servers — Register a server
// ---------------------------------------------------------------------------

app.post('/servers', async (c) => {
  if (!requireAuth(c)) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json<BulkServerDef>();
  if (!body.server_name || !body.category) return c.json({ error: 'server_name and category required' }, 400);

  try {
    await c.env.DB.prepare(`
      INSERT INTO servers (server_name, category, description, is_cloud, cloud_url, api_base_url, auth_type, auth_key_name, auth_header_name, auth_header_prefix, api_pattern, rate_limit_rpm)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)
    `).bind(
      body.server_name, body.category.toUpperCase(), body.description || null,
      body.is_cloud ? 1 : 0, body.cloud_url || null, body.api_base_url || null,
      body.auth_type || 'none', body.auth_key_name || null,
      body.auth_header_name || 'Authorization', body.auth_header_prefix || 'Bearer',
      body.api_pattern || 'rest_json', body.rate_limit_rpm || 60,
    ).run();

    const server = await c.env.DB.prepare('SELECT * FROM servers WHERE server_name = ?1').bind(body.server_name).first();
    await c.env.CACHE.delete('stats_v2');
    return c.json({ success: true, server }, 201);
  } catch (e: any) {
    if (String(e.message).includes('UNIQUE')) return c.json({ error: `Server '${body.server_name}' already exists` }, 409);
    log('error', 'Server registration failed', { error: e.message });
    return c.json({ error: 'Server registration failed' }, 500);
  }
});

// ---------------------------------------------------------------------------
// GET /tools — List tools with pagination
// ---------------------------------------------------------------------------

app.get('/tools', async (c) => {
  const page = Math.max(parseInt(c.req.query('page') || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(c.req.query('limit') || '50', 10), 1), 200);
  const offset = (page - 1) * limit;
  const category = (c.req.query('category') || '').trim();
  const server = (c.req.query('server') || '').trim();

  let where = 'WHERE 1=1';
  const params: string[] = [];

  if (category) {
    params.push(category.toUpperCase());
    where += ` AND UPPER(t.category) = ?${params.length}`;
  }
  if (server) {
    params.push(server);
    where += ` AND s.server_name = ?${params.length}`;
  }

  const countSql = `SELECT COUNT(*) AS cnt FROM tools t LEFT JOIN servers s ON t.server_id = s.id ${where}`;
  const dataSql = `SELECT t.*, s.server_name, s.api_base_url, s.cloud_url FROM tools t LEFT JOIN servers s ON t.server_id = s.id ${where} ORDER BY t.tool_name LIMIT ?${params.length + 1} OFFSET ?${params.length + 2}`;

  const total = await c.env.DB.prepare(countSql).bind(...params).first<{ cnt: number }>();
  const { results } = await c.env.DB.prepare(dataSql).bind(...params, String(limit), String(offset)).all();

  return c.json({ page, limit, total: total?.cnt ?? 0, total_pages: Math.ceil((total?.cnt ?? 0) / limit), count: results.length, tools: results });
});

// ---------------------------------------------------------------------------
// GET /tools/:name
// ---------------------------------------------------------------------------

app.get('/tools/:name', async (c) => {
  const name = c.req.param('name');
  const tool = await c.env.DB.prepare(`
    SELECT t.*, s.server_name, s.api_base_url, s.cloud_url, s.auth_type, s.api_pattern
    FROM tools t LEFT JOIN servers s ON t.server_id = s.id WHERE t.tool_name = ?1
  `).bind(name).first();

  if (!tool) return c.json({ error: `Tool '${name}' not found` }, 404);

  const { results: recentUsage } = await c.env.DB.prepare(
    `SELECT success, response_time_ms, created_at FROM usage_log WHERE tool_name = ?1 ORDER BY created_at DESC LIMIT 10`
  ).bind(name).all();

  return c.json({ tool, recent_usage: recentUsage });
});

// ---------------------------------------------------------------------------
// POST /tools — Register a tool
// ---------------------------------------------------------------------------

app.post('/tools', async (c) => {
  if (!requireAuth(c)) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json<{
    tool_name: string; server_name?: string; description?: string; category?: string;
    http_method?: string; path_template?: string; parameters?: object | string;
    query_params_schema?: object; body_schema?: object; body_template?: object;
    response_path?: string; content_type?: string; cloud_endpoint?: string;
  }>();

  if (!body.tool_name) return c.json({ error: 'tool_name required' }, 400);

  let serverId: number | null = null;
  if (body.server_name) {
    const srv = await c.env.DB.prepare('SELECT id FROM servers WHERE server_name = ?1').bind(body.server_name).first<{ id: number }>();
    if (srv) serverId = srv.id;
  }

  await c.env.DB.prepare(`
    INSERT OR IGNORE INTO tools (server_id, tool_name, description, category, http_method, path_template, query_params_schema, body_schema, body_template, response_path, content_type, parameters, cloud_endpoint)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)
  `).bind(
    serverId, body.tool_name, body.description || null, body.category || null,
    body.http_method || 'GET', body.path_template || '/',
    body.query_params_schema ? JSON.stringify(body.query_params_schema) : null,
    body.body_schema ? JSON.stringify(body.body_schema) : null,
    body.body_template ? JSON.stringify(body.body_template) : null,
    body.response_path || null, body.content_type || 'application/json',
    body.parameters ? (typeof body.parameters === 'string' ? body.parameters : JSON.stringify(body.parameters)) : null,
    body.cloud_endpoint || null,
  ).run();

  if (serverId) {
    await c.env.DB.prepare(`UPDATE servers SET tool_count = (SELECT COUNT(*) FROM tools WHERE server_id = ?1), updated_at = datetime('now') WHERE id = ?1`).bind(serverId).run();
  }

  await c.env.CACHE.delete('stats_v2');
  const tool = await c.env.DB.prepare('SELECT * FROM tools WHERE tool_name = ?1').bind(body.tool_name).first();
  return c.json({ success: true, tool }, 201);
});

// ---------------------------------------------------------------------------
// POST /tools/bulk — Bulk register tools
// ---------------------------------------------------------------------------

app.post('/tools/bulk', async (c) => {
  if (!requireAuth(c)) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json<{
    server_name?: string;
    tools: Array<{
      tool_name: string; description?: string; category?: string;
      http_method?: string; path_template?: string; parameters?: object | string;
      query_params_schema?: object; body_schema?: object; body_template?: object;
      response_path?: string; content_type?: string; cloud_endpoint?: string;
    }>;
  }>();

  if (!body.tools?.length) return c.json({ error: 'tools array required' }, 400);

  let serverId: number | null = null;
  if (body.server_name) {
    const srv = await c.env.DB.prepare('SELECT id FROM servers WHERE server_name = ?1').bind(body.server_name).first<{ id: number }>();
    if (srv) serverId = srv.id;
  }

  let inserted = 0;
  let failed = 0;
  const errors: string[] = [];
  const stmts: D1PreparedStatement[] = [];

  for (const t of body.tools) {
    if (!t.tool_name) { failed++; continue; }
    stmts.push(c.env.DB.prepare(`
      INSERT OR IGNORE INTO tools (server_id, tool_name, description, category, http_method, path_template, query_params_schema, body_schema, body_template, response_path, content_type, parameters, cloud_endpoint)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)
    `).bind(
      serverId, t.tool_name, t.description || null, t.category || null,
      t.http_method || 'GET', t.path_template || '/',
      t.query_params_schema ? JSON.stringify(t.query_params_schema) : null,
      t.body_schema ? JSON.stringify(t.body_schema) : null,
      t.body_template ? JSON.stringify(t.body_template) : null,
      t.response_path || null, t.content_type || 'application/json',
      t.parameters ? (typeof t.parameters === 'string' ? t.parameters : JSON.stringify(t.parameters)) : null,
      t.cloud_endpoint || null,
    ));
    inserted++;
  }

  const CHUNK = 80;
  for (let i = 0; i < stmts.length; i += CHUNK) {
    try {
      await c.env.DB.batch(stmts.slice(i, i + CHUNK));
    } catch (e: any) {
      const chunkLen = Math.min(CHUNK, stmts.length - i);
      failed += chunkLen; inserted -= chunkLen;
      errors.push(`Batch error at ${i}: ${e.message}`);
    }
  }

  if (serverId) {
    await c.env.DB.prepare(`UPDATE servers SET tool_count = (SELECT COUNT(*) FROM tools WHERE server_id = ?1), updated_at = datetime('now') WHERE id = ?1`).bind(serverId).run();
  }

  await c.env.CACHE.delete('stats_v2');
  return c.json({ success: true, inserted, failed, errors: errors.length ? errors : undefined }, 201);
});

// ---------------------------------------------------------------------------
// GET /categories
// ---------------------------------------------------------------------------

app.get('/categories', async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT s.category, COUNT(DISTINCT s.id) AS server_count, COALESCE(SUM(s.tool_count),0) AS tool_count
    FROM servers s GROUP BY s.category ORDER BY s.category
  `).all<{ category: string; server_count: number; tool_count: number }>();

  const catMap = new Map<string, { server_count: number; tool_count: number; description: string }>();
  for (const cat of CATEGORIES) catMap.set(cat, { server_count: 0, tool_count: 0, description: CATEGORY_DESCRIPTIONS[cat] || '' });
  for (const row of results) {
    const existing = catMap.get(row.category);
    catMap.set(row.category, { server_count: row.server_count, tool_count: row.tool_count, description: existing?.description || CATEGORY_DESCRIPTIONS[row.category] || '' });
  }

  return c.json({ count: catMap.size, categories: Array.from(catMap.entries()).map(([name, data]) => ({ category: name, ...data })) });
});

// ---------------------------------------------------------------------------
// GET /popular
// ---------------------------------------------------------------------------

app.get('/popular', async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT t.tool_name, t.description, t.category, t.usage_count, t.last_used_at, s.server_name, s.api_base_url
    FROM tools t LEFT JOIN servers s ON t.server_id = s.id
    WHERE t.usage_count > 0 ORDER BY t.usage_count DESC LIMIT 50
  `).all();
  return c.json({ count: results.length, tools: results });
});

// =============================================================================
// THE CORE — POST /execute — Universal Dynamic API Proxy
// =============================================================================

app.post('/execute', async (c) => {
  if (!requireAuth(c)) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json<ExecuteRequest>();
  if (!body.tool) return c.json({ error: 'tool is required' }, 400);

  const startTime = Date.now();
  const MAX_TIMEOUT_MS = 30000;
  const timeoutMs = Math.min(Math.max(Number(body.timeout_ms) || MAX_TIMEOUT_MS, 1000), MAX_TIMEOUT_MS);

  // 1. Look up tool + server definition from D1
  let tool: any;
  if (body.server) {
    tool = await c.env.DB.prepare(`
      SELECT t.*, s.server_name, s.api_base_url, s.cloud_url, s.auth_type, s.auth_key_name,
             s.auth_header_name, s.auth_header_prefix, s.api_pattern, s.rate_limit_rpm, s.default_timeout_ms,
             s.id AS sid
      FROM tools t JOIN servers s ON t.server_id = s.id
      WHERE t.tool_name = ?1 AND s.server_name = ?2
    `).bind(body.tool, body.server).first();
  } else {
    tool = await c.env.DB.prepare(`
      SELECT t.*, s.server_name, s.api_base_url, s.cloud_url, s.auth_type, s.auth_key_name,
             s.auth_header_name, s.auth_header_prefix, s.api_pattern, s.rate_limit_rpm, s.default_timeout_ms,
             s.id AS sid
      FROM tools t JOIN servers s ON t.server_id = s.id
      WHERE t.tool_name = ?1
      ORDER BY t.usage_count DESC LIMIT 1
    `).bind(body.tool).first();
  }

  if (!tool) {
    // Fuzzy search fallback
    const { results: suggestions } = await c.env.DB.prepare(`
      SELECT t.tool_name, s.server_name, t.description FROM tools t LEFT JOIN servers s ON t.server_id = s.id
      WHERE INSTR(UPPER(t.tool_name), UPPER(?1)) > 0 LIMIT 5
    `).bind(body.tool).all();

    return c.json({
      error: `Tool '${body.tool}' not found`,
      suggestions: suggestions.length > 0 ? suggestions : undefined,
      hint: 'Use GET /search?q=keyword to find tools',
    }, 404);
  }

  if (!tool.is_available) return c.json({ error: `Tool '${body.tool}' is unavailable` }, 503);

  const params = body.params || {};
  const serverName = tool.server_name as string;
  const apiBaseUrl = tool.api_base_url as string | null;
  const cloudUrl = tool.cloud_url as string | null;
  const cloudEndpoint = tool.cloud_endpoint as string | null;

  // 2. Determine execution strategy
  let targetUrl: string;
  let method: string;
  let headers: Record<string, string> = { 'Content-Type': tool.content_type || 'application/json' };
  let requestBody: string | null = null;

  // Strategy A: Direct cloud endpoint (pre-configured URL)
  if (cloudEndpoint) {
    targetUrl = cloudEndpoint;
    method = 'POST';
    requestBody = JSON.stringify({ tool: body.tool, parameters: params });
  }
  // Strategy B: Dynamic proxy via API definition
  else if (apiBaseUrl && tool.path_template) {
    // Resolve path template: /users/{user_id}/repos → /users/123/repos
    const resolvedPath = resolvePath(tool.path_template, params);
    method = (tool.http_method || 'GET').toUpperCase();

    // Build query string for GET requests
    const querySchema = safeJsonParse(tool.query_params_schema as string);
    const qs = method === 'GET' ? buildQueryString(querySchema, params) : '';

    targetUrl = `${apiBaseUrl.replace(/\/$/, '')}${resolvedPath}${qs}`;

    // Build body for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      const bodyTemplate = safeJsonParse(tool.body_template as string);
      const bodySchema = safeJsonParse(tool.body_schema as string);
      requestBody = buildBody(bodyTemplate, bodySchema, params);
    }

    // Resolve auth
    const server: ServerRow = {
      id: tool.sid, server_name: serverName, category: tool.category || '',
      description: null, tool_count: 0, is_cloud: 1, cloud_url: cloudUrl, status: 'active',
      api_base_url: apiBaseUrl, auth_type: tool.auth_type, auth_key_name: tool.auth_key_name,
      auth_header_name: tool.auth_header_name, auth_header_prefix: tool.auth_header_prefix,
      api_pattern: tool.api_pattern, rate_limit_rpm: tool.rate_limit_rpm,
      created_at: '', updated_at: '',
    };

    const authHeaders = resolveAuth(c.env, server);
    headers = { ...headers, ...authHeaders };

    // Rate limit check
    const rpm = tool.rate_limit_rpm || 60;
    const allowed = await checkRateLimit(c.env.DB, serverName, rpm);
    if (!allowed) {
      return c.json({ error: `Rate limit exceeded for server '${serverName}' (${rpm}/min)`, retry_after_seconds: 60 }, 429);
    }
  }
  // Strategy C: Proxy to cloud_url (ECHO workers)
  else if (cloudUrl) {
    targetUrl = cloudUrl.replace(/\/$/, '');
    // For ECHO workers, route based on tool name pattern
    const toolParts = body.tool.split('_');
    const endpoint = toolParts.length > 1 ? `/${toolParts.slice(1).join('/')}` : '/execute';
    targetUrl += endpoint;
    method = 'POST';
    requestBody = JSON.stringify({ tool: body.tool, ...params });

    // Add ECHO API key if available
    if (c.env.ECHO_API_KEY) {
      headers['X-Echo-API-Key'] = c.env.ECHO_API_KEY as string;
    }
  }
  // No endpoint configured
  else {
    await logUsage(c.env.DB, body.tool, serverName, false, 0, 'No API endpoint configured');
    return c.json({
      error: `Tool '${body.tool}' has no cloud endpoint — server '${serverName}' needs api_base_url or cloud_url`,
      server: serverName,
      fix: `POST /servers with api_base_url to enable dynamic proxy for this server`,
    }, 422);
  }

  // 3. Execute the fetch
  try {
    const controller = new AbortController();
    const effectiveTimeout = Math.min(timeoutMs, MAX_TIMEOUT_MS);
    const timer = setTimeout(() => controller.abort(), effectiveTimeout);

    const fetchOpts: RequestInit = {
      method,
      headers,
      signal: controller.signal,
    };
    if (requestBody && method !== 'GET') {
      fetchOpts.body = requestBody;
    }

    // Redact API keys/tokens from URL before logging
    const safeUrl = targetUrl.replace(/([?&](api_key|key|token|secret|access_token|auth)=)[^&]*/gi, '$1[REDACTED]');
    log('info', 'Executing tool', { tool: body.tool, server: serverName, url: safeUrl, method });

    const response = await fetch(targetUrl, fetchOpts);
    clearTimeout(timer);

    const elapsed = Date.now() - startTime;
    const responseText = await response.text();

    let parsedResponse: unknown;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch {
      parsedResponse = responseText;
    }

    // Extract nested response if response_path is configured
    const responsePath = tool.response_path as string | null;
    const extracted = extractResponse(parsedResponse, responsePath);

    const success = response.ok;
    await logUsage(c.env.DB, body.tool, serverName, success, elapsed, success ? null : `HTTP ${response.status}`);

    // Update tool usage
    await c.env.DB.prepare(`UPDATE tools SET usage_count = usage_count + 1, last_used_at = datetime('now') WHERE id = ?1`).bind(tool.id).run();

    return c.json({
      success,
      tool: body.tool,
      server: serverName,
      method,
      status: response.status,
      response_time_ms: elapsed,
      result: extracted !== undefined ? extracted : parsedResponse,
    }, success ? 200 : 502);
  } catch (e: any) {
    const elapsed = Date.now() - startTime;
    const errorMsg = e.name === 'AbortError' ? `Timeout after ${timeoutMs}ms` : (e.message || String(e));

    await logUsage(c.env.DB, body.tool, serverName, false, elapsed, errorMsg);

    return c.json({
      success: false,
      tool: body.tool,
      server: serverName,
      error: errorMsg,
      response_time_ms: elapsed,
    }, 502);
  }
});

// Helper for usage logging
async function logUsage(db: D1Database, tool: string, server: string, success: boolean, ms: number, error: string | null): Promise<void> {
  try {
    await db.prepare(`INSERT INTO usage_log (tool_name, server_name, success, response_time_ms, error_message) VALUES (?1, ?2, ?3, ?4, ?5)`)
      .bind(tool, server, success ? 1 : 0, ms, error).run();
  } catch (e) {
    log('warn', 'Failed to log usage', { error: (e as Error)?.message });
  }
}

// =============================================================================
// POST /import/servers — Bulk import server definitions WITH their tools
// =============================================================================
// This is the workhorse for populating all 1,873 servers.
// Accepts an array of server definitions, each with embedded tool definitions.
// =============================================================================

app.post('/import/servers', async (c) => {
  if (!requireAuth(c)) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json<{ servers: BulkServerDef[] }>();
  if (!body.servers?.length) return c.json({ error: 'servers array required' }, 400);

  let serversCreated = 0;
  let toolsCreated = 0;
  let serversSkipped = 0;
  const errors: string[] = [];

  for (const srv of body.servers) {
    if (!srv.server_name || !srv.category) {
      errors.push(`Skipped: missing server_name or category`);
      serversSkipped++;
      continue;
    }

    try {
      // Insert or update server
      await c.env.DB.prepare(`
        INSERT INTO servers (server_name, category, description, is_cloud, cloud_url, api_base_url, auth_type, auth_key_name, auth_header_name, auth_header_prefix, api_pattern, rate_limit_rpm)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)
        ON CONFLICT(server_name) DO UPDATE SET
          category = excluded.category,
          description = COALESCE(excluded.description, servers.description),
          api_base_url = COALESCE(excluded.api_base_url, servers.api_base_url),
          auth_type = COALESCE(excluded.auth_type, servers.auth_type),
          auth_key_name = COALESCE(excluded.auth_key_name, servers.auth_key_name),
          auth_header_name = COALESCE(excluded.auth_header_name, servers.auth_header_name),
          auth_header_prefix = COALESCE(excluded.auth_header_prefix, servers.auth_header_prefix),
          api_pattern = COALESCE(excluded.api_pattern, servers.api_pattern),
          rate_limit_rpm = COALESCE(excluded.rate_limit_rpm, servers.rate_limit_rpm),
          cloud_url = COALESCE(excluded.cloud_url, servers.cloud_url),
          updated_at = datetime('now')
      `).bind(
        srv.server_name, srv.category.toUpperCase(), srv.description || null,
        srv.is_cloud ? 1 : 0, srv.cloud_url || null, srv.api_base_url || null,
        srv.auth_type || 'none', srv.auth_key_name || null,
        srv.auth_header_name || 'Authorization', srv.auth_header_prefix || 'Bearer',
        srv.api_pattern || 'rest_json', srv.rate_limit_rpm || 60,
      ).run();
      serversCreated++;

      // Insert tools for this server
      if (srv.tools?.length) {
        const servRow = await c.env.DB.prepare('SELECT id FROM servers WHERE server_name = ?1').bind(srv.server_name).first<{ id: number }>();
        if (servRow) {
          const stmts: D1PreparedStatement[] = [];
          for (const t of srv.tools) {
            if (!t.tool_name) continue;
            stmts.push(c.env.DB.prepare(`
              INSERT OR IGNORE INTO tools (server_id, tool_name, description, category, http_method, path_template, query_params_schema, body_schema, body_template, response_path, content_type)
              VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)
            `).bind(
              servRow.id, t.tool_name, t.description || null, srv.category.toUpperCase(),
              t.http_method || 'GET', t.path_template || '/',
              t.query_params_schema ? JSON.stringify(t.query_params_schema) : null,
              t.body_schema ? JSON.stringify(t.body_schema) : null,
              t.body_template ? JSON.stringify(t.body_template) : null,
              t.response_path || null, t.content_type || 'application/json',
            ));
            toolsCreated++;
          }

          // Batch in chunks
          for (let i = 0; i < stmts.length; i += 80) {
            try {
              await c.env.DB.batch(stmts.slice(i, i + 80));
            } catch (e: any) {
              const chunkLen = Math.min(80, stmts.length - i);
              toolsCreated -= chunkLen;
              errors.push(`Tools batch error for ${srv.server_name} at ${i}: ${e.message}`);
            }
          }

          // Update tool count
          await c.env.DB.prepare(`UPDATE servers SET tool_count = (SELECT COUNT(*) FROM tools WHERE server_id = ?1), updated_at = datetime('now') WHERE id = ?1`).bind(servRow.id).run();
        }
      }
    } catch (e: any) {
      errors.push(`Server ${srv.server_name}: ${e.message}`);
      serversSkipped++;
    }
  }

  await c.env.CACHE.delete('stats_v2');
  return c.json({ success: true, servers_created: serversCreated, servers_skipped: serversSkipped, tools_created: toolsCreated, errors: errors.length ? errors : undefined }, 201);
});

// =============================================================================
// POST /init-schema — Initialize/migrate D1 schema to v2
// =============================================================================

app.post('/init-schema', async (c) => {
  if (!requireAuth(c)) return c.json({ error: 'Unauthorized' }, 401);

  const results: Array<{ sql: string; ok: boolean; error?: string }> = [];

  for (const sql of SCHEMA_V2) {
    try {
      await c.env.DB.prepare(sql).run();
      results.push({ sql: sql.slice(0, 80) + '...', ok: true });
    } catch (e: any) {
      results.push({ sql: sql.slice(0, 80) + '...', ok: false, error: e.message });
    }
  }

  // Migrate existing tables: add new columns if missing
  const migrations = [
    `ALTER TABLE servers ADD COLUMN api_base_url TEXT`,
    `ALTER TABLE servers ADD COLUMN auth_type TEXT DEFAULT 'none'`,
    `ALTER TABLE servers ADD COLUMN auth_key_name TEXT`,
    `ALTER TABLE servers ADD COLUMN auth_header_name TEXT DEFAULT 'Authorization'`,
    `ALTER TABLE servers ADD COLUMN auth_header_prefix TEXT DEFAULT 'Bearer'`,
    `ALTER TABLE servers ADD COLUMN api_pattern TEXT DEFAULT 'rest_json'`,
    `ALTER TABLE servers ADD COLUMN rate_limit_rpm INTEGER DEFAULT 60`,
    `ALTER TABLE servers ADD COLUMN default_timeout_ms INTEGER DEFAULT 30000`,
    `ALTER TABLE tools ADD COLUMN http_method TEXT DEFAULT 'GET'`,
    `ALTER TABLE tools ADD COLUMN path_template TEXT DEFAULT '/'`,
    `ALTER TABLE tools ADD COLUMN query_params_schema TEXT`,
    `ALTER TABLE tools ADD COLUMN body_schema TEXT`,
    `ALTER TABLE tools ADD COLUMN body_template TEXT`,
    `ALTER TABLE tools ADD COLUMN response_path TEXT`,
    `ALTER TABLE tools ADD COLUMN content_type TEXT DEFAULT 'application/json'`,
  ];

  for (const m of migrations) {
    try {
      await c.env.DB.prepare(m).run();
      results.push({ sql: m, ok: true });
    } catch (e: any) {
      // Column already exists is OK
      if (String(e.message).includes('duplicate column')) {
        results.push({ sql: m, ok: true, error: 'already exists' });
      } else {
        results.push({ sql: m, ok: false, error: e.message });
      }
    }
  }

  return c.json({ success: true, operations: results.length, details: results });
});

// =============================================================================
// POST /seed — Seed ECHO internal workers
// =============================================================================

app.post('/seed', async (c) => {
  if (!requireAuth(c)) return c.json({ error: 'Unauthorized' }, 401);

  const echoWorkers: BulkServerDef[] = [
    {
      server_name: 'echo-shared-brain', category: 'ECHO_INTERNAL',
      description: 'Universal shared context — D1+KV+R2+Vectorize, Mem0 fact extraction',
      api_base_url: 'https://echo-shared-brain.bmcii1976.workers.dev', is_cloud: true,
      cloud_url: 'https://echo-shared-brain.bmcii1976.workers.dev',
      auth_type: 'api_key_header', auth_key_name: 'ECHO_API_KEY',
      tools: [
        { tool_name: 'brain_ingest', description: 'Store memory into shared brain', http_method: 'POST', path_template: '/ingest', body_schema: { instance_id: 'string', role: 'string', content: 'string', importance: 'number', tags: 'array' } },
        { tool_name: 'brain_search', description: 'Search all memory across instances', http_method: 'POST', path_template: '/search', body_schema: { query: 'string', limit: 'number' } },
        { tool_name: 'brain_heartbeat', description: 'Send instance heartbeat', http_method: 'POST', path_template: '/heartbeat', body_schema: { instance_id: 'string', current_task: 'string' } },
        { tool_name: 'brain_recall', description: 'Recall memory by key', http_method: 'GET', path_template: '/recall/{key}' },
        { tool_name: 'brain_instances', description: 'List active instances', http_method: 'GET', path_template: '/instances' },
      ],
    },
    {
      server_name: 'echo-build-orchestrator', category: 'ECHO_INTERNAL',
      description: 'Engine build pipeline — session management, quality gates, 875 engines',
      api_base_url: 'https://echo-build-orchestrator.bmcii1976.workers.dev', is_cloud: true,
      cloud_url: 'https://echo-build-orchestrator.bmcii1976.workers.dev',
      auth_type: 'none',
      tools: [
        { tool_name: 'orchestrator_status', description: 'Get orchestrator status', http_method: 'GET', path_template: '/status' },
        { tool_name: 'orchestrator_engines', description: 'List engines by status', http_method: 'GET', path_template: '/engines', query_params_schema: { status: 'string' } },
        { tool_name: 'orchestrator_trigger', description: 'Trigger next build', http_method: 'POST', path_template: '/build/trigger' },
        { tool_name: 'orchestrator_complete', description: 'Report build complete', http_method: 'POST', path_template: '/build/complete', body_schema: { engine_id: 'string', success: 'boolean', output: 'string' } },
        { tool_name: 'orchestrator_session_register', description: 'Register session', http_method: 'POST', path_template: '/session/register', body_schema: { mode: 'string', worker_id: 'string' } },
        { tool_name: 'orchestrator_session_heartbeat', description: 'Session heartbeat', http_method: 'POST', path_template: '/session/heartbeat', body_schema: { session_id: 'string', task: 'string' } },
        { tool_name: 'orchestrator_session_snapshot', description: 'Save session snapshot', http_method: 'POST', path_template: '/session/snapshot', body_schema: { session_id: 'string', accomplished: 'array', in_progress: 'object', remaining: 'array' } },
        { tool_name: 'orchestrator_gates_report', description: 'Report quality gates', http_method: 'POST', path_template: '/gates/report', body_schema: { engine_id: 'string', gates: 'array' } },
      ],
    },
    {
      server_name: 'omniscient-sync', category: 'ECHO_INTERNAL',
      description: 'Cross-instance synchronization — todos, policies, broadcasts, memory',
      api_base_url: 'https://omniscient-sync.bmcii1976.workers.dev', is_cloud: true,
      cloud_url: 'https://omniscient-sync.bmcii1976.workers.dev',
      auth_type: 'none',
      tools: [
        { tool_name: 'omnisync_todos', description: 'Get all todos', http_method: 'GET', path_template: '/todos' },
        { tool_name: 'omnisync_add_todo', description: 'Add a todo', http_method: 'POST', path_template: '/todos', body_schema: { text: 'string', status: 'string' } },
        { tool_name: 'omnisync_policies', description: 'Get all policies', http_method: 'GET', path_template: '/policies' },
        { tool_name: 'omnisync_broadcasts', description: 'Get recent broadcasts', http_method: 'GET', path_template: '/broadcasts' },
        { tool_name: 'omnisync_broadcast', description: 'Send broadcast', http_method: 'POST', path_template: '/broadcasts', body_schema: { message: 'string', priority: 'string' } },
        { tool_name: 'omnisync_memory_recall', description: 'Recall memory by key', http_method: 'GET', path_template: '/memory/recall/{key}' },
        { tool_name: 'omnisync_memory_store', description: 'Store memory', http_method: 'POST', path_template: '/memory/store', body_schema: { key: 'string', value: 'object' } },
      ],
    },
    {
      server_name: 'echo-engine-runtime', category: 'ECHO_INTERNAL',
      description: '674 engines, 30K+ doctrines, hybrid keyword+semantic search',
      api_base_url: 'https://echo-engine-runtime.bmcii1976.workers.dev', is_cloud: true,
      cloud_url: 'https://echo-engine-runtime.bmcii1976.workers.dev',
      tools: [
        { tool_name: 'engine_query', description: 'Query an engine by ID', http_method: 'POST', path_template: '/query', body_schema: { engine_id: 'string', question: 'string', mode: 'string' } },
        { tool_name: 'engine_search', description: 'Search across all engines', http_method: 'GET', path_template: '/search', query_params_schema: { q: 'string', limit: 'number' } },
        { tool_name: 'engine_list', description: 'List all engines', http_method: 'GET', path_template: '/engines' },
        { tool_name: 'engine_health', description: 'Engine runtime health', http_method: 'GET', path_template: '/health' },
      ],
    },
    {
      server_name: 'echo-knowledge-forge', category: 'ECHO_INTERNAL',
      description: 'Knowledge document store — 5,387 docs, semantic search',
      api_base_url: 'https://echo-knowledge-forge.bmcii1976.workers.dev', is_cloud: true,
      cloud_url: 'https://echo-knowledge-forge.bmcii1976.workers.dev',
      tools: [
        { tool_name: 'knowledge_search', description: 'Search knowledge docs', http_method: 'GET', path_template: '/search', query_params_schema: { q: 'string', limit: 'number' } },
        { tool_name: 'knowledge_ingest', description: 'Ingest a document', http_method: 'POST', path_template: '/ingest', body_schema: { title: 'string', content: 'string', tags: 'array' } },
        { tool_name: 'knowledge_stats', description: 'Knowledge store stats', http_method: 'GET', path_template: '/stats' },
      ],
    },
    {
      server_name: 'forge-x-cloud', category: 'ECHO_INTERNAL',
      description: 'Autonomous engine builder — cron, dual LLM, quality validation',
      api_base_url: 'https://forge-x-cloud.bmcii1976.workers.dev', is_cloud: true,
      cloud_url: 'https://forge-x-cloud.bmcii1976.workers.dev',
      tools: [
        { tool_name: 'forge_build', description: 'Trigger engine build', http_method: 'POST', path_template: '/build', body_schema: { engine_id: 'string', spec: 'object' } },
        { tool_name: 'forge_status', description: 'Get forge status', http_method: 'GET', path_template: '/status' },
        { tool_name: 'forge_queue', description: 'View build queue', http_method: 'GET', path_template: '/queue' },
      ],
    },
    {
      server_name: 'echo-chat', category: 'COMMUNICATION',
      description: '14 AI personalities, 20 endpoints, 12-layer prompt builder',
      api_base_url: 'https://echo-chat.bmcii1976.workers.dev', is_cloud: true,
      cloud_url: 'https://echo-chat.bmcii1976.workers.dev',
      tools: [
        { tool_name: 'echo_chat_send', description: 'Send chat message', http_method: 'POST', path_template: '/chat', body_schema: { message: 'string', personality: 'string', thread_id: 'string' } },
        { tool_name: 'echo_chat_personalities', description: 'List available personalities', http_method: 'GET', path_template: '/personalities' },
        { tool_name: 'echo_chat_threads', description: 'List chat threads', http_method: 'GET', path_template: '/threads' },
      ],
    },
    {
      server_name: 'echo-graph-rag', category: 'DATA',
      description: 'GraphRAG — 312K nodes, 3.3M edges, 101 domains, cross-domain search',
      api_base_url: 'https://echo-graph-rag.bmcii1976.workers.dev', is_cloud: true,
      cloud_url: 'https://echo-graph-rag.bmcii1976.workers.dev',
      tools: [
        { tool_name: 'graphrag_query', description: 'Query the knowledge graph', http_method: 'POST', path_template: '/query', body_schema: { question: 'string', domains: 'array', depth: 'number' } },
        { tool_name: 'graphrag_search', description: 'Search nodes', http_method: 'GET', path_template: '/search', query_params_schema: { q: 'string', domain: 'string' } },
        { tool_name: 'graphrag_stats', description: 'Graph statistics', http_method: 'GET', path_template: '/stats' },
      ],
    },
    {
      server_name: 'echo-ai-orchestrator', category: 'AI_ML',
      description: '29 LLM workers, smart dispatch, queue builds, 13 endpoints',
      api_base_url: 'https://echo-ai-orchestrator.bmcii1976.workers.dev', is_cloud: true,
      cloud_url: 'https://echo-ai-orchestrator.bmcii1976.workers.dev',
      tools: [
        { tool_name: 'ai_chat', description: 'Multi-LLM chat completion', http_method: 'POST', path_template: '/chat', body_schema: { model: 'string', messages: 'array', temperature: 'number' } },
        { tool_name: 'ai_models', description: 'List available models', http_method: 'GET', path_template: '/models' },
        { tool_name: 'ai_status', description: 'Orchestrator status', http_method: 'GET', path_template: '/status' },
      ],
    },
    {
      server_name: 'echo-swarm-brain', category: 'AUTOMATION',
      description: 'Swarm intelligence coordinator — 129 endpoints, agent management',
      api_base_url: 'https://echo-swarm-brain.bmcii1976.workers.dev', is_cloud: true,
      cloud_url: 'https://echo-swarm-brain.bmcii1976.workers.dev',
      tools: [
        { tool_name: 'swarm_spawn', description: 'Spawn swarm agents', http_method: 'POST', path_template: '/spawn', body_schema: { count: 'number', task: 'string' } },
        { tool_name: 'swarm_status', description: 'Swarm status', http_method: 'GET', path_template: '/status' },
        { tool_name: 'swarm_assign', description: 'Assign task to swarm', http_method: 'POST', path_template: '/assign', body_schema: { agent_id: 'string', task: 'string' } },
      ],
    },
    {
      server_name: 'echo-agent-coordinator', category: 'AUTOMATION',
      description: 'Multi-agent workflows — 5 strategies, templates, simulation',
      api_base_url: 'https://echo-agent-coordinator.bmcii1976.workers.dev', is_cloud: true,
      cloud_url: 'https://echo-agent-coordinator.bmcii1976.workers.dev',
      tools: [
        { tool_name: 'agent_workflow_create', description: 'Create agent workflow', http_method: 'POST', path_template: '/workflows', body_schema: { name: 'string', strategy: 'string', agents: 'array' } },
        { tool_name: 'agent_workflow_run', description: 'Run workflow', http_method: 'POST', path_template: '/workflows/{id}/run', body_schema: { input: 'object' } },
        { tool_name: 'agent_workflows_list', description: 'List workflows', http_method: 'GET', path_template: '/workflows' },
      ],
    },
    {
      server_name: 'echo-knowledge-scout', category: 'DATA',
      description: '7-source knowledge scanner — GitHub, HuggingFace, ArXiv, Reddit, HN, RSS, ProductHunt',
      api_base_url: 'https://echo-knowledge-scout.bmcii1976.workers.dev', is_cloud: true,
      cloud_url: 'https://echo-knowledge-scout.bmcii1976.workers.dev',
      tools: [
        { tool_name: 'scout_scan', description: 'Scan sources for knowledge', http_method: 'POST', path_template: '/scan', body_schema: { query: 'string', sources: 'array' } },
        { tool_name: 'scout_results', description: 'Get scan results', http_method: 'GET', path_template: '/results', query_params_schema: { scan_id: 'string' } },
      ],
    },
    {
      server_name: 'echo-relay', category: 'API',
      description: 'Unified MCP relay — 655 tools, windows-api + credential-vault + mega-gateway + cloud',
      api_base_url: 'https://echo-relay.bmcii1976.workers.dev', is_cloud: true,
      cloud_url: 'https://echo-relay.bmcii1976.workers.dev',
      tools: [
        { tool_name: 'relay_execute', description: 'Execute tool via relay', http_method: 'POST', path_template: '/execute', body_schema: { server: 'string', tool: 'string', params: 'object' } },
        { tool_name: 'relay_search', description: 'Search relay tools', http_method: 'GET', path_template: '/search', query_params_schema: { q: 'string' } },
        { tool_name: 'relay_servers', description: 'List relay servers', http_method: 'GET', path_template: '/servers' },
      ],
    },
    {
      server_name: 'shadowglass-v8-warpspeed', category: 'DATA',
      description: 'ShadowGlass v8.2 — 80 counties, 259K+ deed records, watermark scheduling',
      api_base_url: 'https://shadowglass-v8-warpspeed.bmcii1976.workers.dev', is_cloud: true,
      cloud_url: 'https://shadowglass-v8-warpspeed.bmcii1976.workers.dev',
      tools: [
        { tool_name: 'shadowglass_search', description: 'Search deed records', http_method: 'GET', path_template: '/search', query_params_schema: { q: 'string', county: 'string', limit: 'number' } },
        { tool_name: 'shadowglass_counties', description: 'List counties', http_method: 'GET', path_template: '/counties' },
        { tool_name: 'shadowglass_stats', description: 'Record statistics', http_method: 'GET', path_template: '/stats' },
      ],
    },
    {
      server_name: 'echo-memory-prime', category: 'ECHO_INTERNAL',
      description: '9-pillar cloud memory — 44 endpoints, infinite persistence',
      api_base_url: 'https://echo-memory-prime.bmcii1976.workers.dev', is_cloud: true,
      cloud_url: 'https://echo-memory-prime.bmcii1976.workers.dev',
      tools: [
        { tool_name: 'memory_store', description: 'Store memory', http_method: 'POST', path_template: '/store', body_schema: { key: 'string', value: 'object', tier: 'string' } },
        { tool_name: 'memory_recall', description: 'Recall memory', http_method: 'GET', path_template: '/recall/{key}' },
        { tool_name: 'memory_search', description: 'Search memories', http_method: 'POST', path_template: '/search', body_schema: { query: 'string', limit: 'number' } },
        { tool_name: 'memory_stats', description: 'Memory statistics', http_method: 'GET', path_template: '/stats' },
      ],
    },
    {
      server_name: 'echo-sentinel-memory', category: 'SECURITY',
      description: 'Security event memory and correlation engine',
      api_base_url: 'https://echo-sentinel-memory.bmcii1976.workers.dev', is_cloud: true,
      cloud_url: 'https://echo-sentinel-memory.bmcii1976.workers.dev',
      tools: [
        { tool_name: 'sentinel_events', description: 'Get security events', http_method: 'GET', path_template: '/events', query_params_schema: { severity: 'string', limit: 'number' } },
        { tool_name: 'sentinel_alert', description: 'Create security alert', http_method: 'POST', path_template: '/alerts', body_schema: { type: 'string', severity: 'string', message: 'string' } },
        { tool_name: 'sentinel_correlate', description: 'Correlate events', http_method: 'POST', path_template: '/correlate', body_schema: { event_ids: 'array' } },
      ],
    },
    {
      server_name: 'bree-chat', category: 'COMMUNICATION',
      description: 'Bree AI chat — 14 emotions, infinite memory',
      api_base_url: 'https://bree-chat.bmcii1976.workers.dev', is_cloud: true,
      cloud_url: 'https://bree-chat.bmcii1976.workers.dev',
      tools: [
        { tool_name: 'bree_chat', description: 'Chat with Bree', http_method: 'POST', path_template: '/chat', body_schema: { message: 'string', emotion: 'string' } },
        { tool_name: 'bree_memories', description: 'Get Bree memories', http_method: 'GET', path_template: '/memories' },
      ],
    },
    {
      server_name: 'echo-engine-cloud', category: 'AI_ML',
      description: '52+ domain engine cloud — domain routing, Stripe billing, report gen',
      api_base_url: 'https://echo-engine-cloud.bmcii1976.workers.dev', is_cloud: true,
      cloud_url: 'https://echo-engine-cloud.bmcii1976.workers.dev',
      tools: [
        { tool_name: 'engine_cloud_query', description: 'Query domain engine', http_method: 'POST', path_template: '/query', body_schema: { domain: 'string', question: 'string' } },
        { tool_name: 'engine_cloud_domains', description: 'List domains', http_method: 'GET', path_template: '/domains' },
      ],
    },
    {
      server_name: 'echo-a2a-protocol', category: 'API',
      description: 'Google A2A agent protocol — agent discovery and delegation',
      api_base_url: 'https://echo-a2a-protocol.bmcii1976.workers.dev', is_cloud: true,
      cloud_url: 'https://echo-a2a-protocol.bmcii1976.workers.dev',
      tools: [
        { tool_name: 'a2a_discover', description: 'Discover A2A agents', http_method: 'GET', path_template: '/.well-known/agent.json' },
        { tool_name: 'a2a_delegate', description: 'Delegate task to agent', http_method: 'POST', path_template: '/delegate', body_schema: { agent_url: 'string', task: 'object' } },
      ],
    },
    {
      server_name: 'encore-cloud-scraper', category: 'DATA',
      description: 'ENCORE county records scraper — 47 counties',
      api_base_url: 'https://encore-cloud-scraper.bmcii1976.workers.dev', is_cloud: true,
      cloud_url: 'https://encore-cloud-scraper.bmcii1976.workers.dev',
      tools: [
        { tool_name: 'encore_scrape', description: 'Scrape county records', http_method: 'POST', path_template: '/scrape', body_schema: { county: 'string', doc_type: 'string', date_range: 'object' } },
        { tool_name: 'encore_status', description: 'Scraper status', http_method: 'GET', path_template: '/status' },
        { tool_name: 'encore_counties', description: 'List supported counties', http_method: 'GET', path_template: '/counties' },
      ],
    },
  ];

  // Use the import endpoint logic
  let serversCreated = 0;
  let toolsCreated = 0;

  for (const srv of echoWorkers) {
    try {
      await c.env.DB.prepare(`
        INSERT INTO servers (server_name, category, description, is_cloud, cloud_url, api_base_url, auth_type, auth_key_name, api_pattern)
        VALUES (?1, ?2, ?3, 1, ?4, ?5, ?6, ?7, ?8)
        ON CONFLICT(server_name) DO UPDATE SET description=excluded.description, api_base_url=excluded.api_base_url, cloud_url=excluded.cloud_url, updated_at=datetime('now')
      `).bind(
        srv.server_name, srv.category, srv.description, srv.cloud_url, srv.api_base_url,
        srv.auth_type || 'none', srv.auth_key_name || null, srv.api_pattern || 'rest_json',
      ).run();
      serversCreated++;

      if (srv.tools?.length) {
        const servRow = await c.env.DB.prepare('SELECT id FROM servers WHERE server_name = ?1').bind(srv.server_name).first<{ id: number }>();
        if (servRow) {
          const stmts = srv.tools.map((t) => c.env.DB.prepare(`
            INSERT OR IGNORE INTO tools (server_id, tool_name, description, category, http_method, path_template, body_schema, query_params_schema)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
          `).bind(
            servRow.id, t.tool_name, t.description, srv.category,
            t.http_method || 'GET', t.path_template || '/',
            t.body_schema ? JSON.stringify(t.body_schema) : null,
            t.query_params_schema ? JSON.stringify(t.query_params_schema) : null,
          ));

          for (let i = 0; i < stmts.length; i += 80) {
            await c.env.DB.batch(stmts.slice(i, i + 80));
          }
          toolsCreated += srv.tools.length;

          await c.env.DB.prepare(`UPDATE servers SET tool_count = (SELECT COUNT(*) FROM tools WHERE server_id = ?1), updated_at = datetime('now') WHERE id = ?1`).bind(servRow.id).run();
        }
      }
    } catch (e: any) {
      log('warn', `Seed error for ${srv.server_name}`, { error: e.message });
    }
  }

  await c.env.CACHE.delete('stats_v2');
  return c.json({ success: true, servers_created: serversCreated, tools_created: toolsCreated });
});

// =============================================================================
// DELETE /rate-limits — Clear old rate limit entries
// =============================================================================

app.delete('/rate-limits', async (c) => {
  if (!requireAuth(c)) return c.json({ error: 'Unauthorized' }, 401);
  await c.env.DB.prepare(`DELETE FROM rate_limits WHERE window_start < datetime('now', '-1 hour')`).run();
  return c.json({ success: true });
});

// ---------------------------------------------------------------------------
// 404 + Error handler
// ---------------------------------------------------------------------------

app.notFound((c) => c.json({ error: 'Not found', service: SERVICE_NAME, hint: 'GET / for endpoints' }, 404));
app.onError((err, c) => {
  const errorId = crypto.randomUUID().slice(0, 8);
  log('error', 'Unhandled error', { error_id: errorId, error: err.message, stack: err.stack });
  return c.json({ error: 'Internal server error', reference: errorId, service: SERVICE_NAME }, 500);
});

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export default app;
