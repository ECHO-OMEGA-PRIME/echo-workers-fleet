import { Hono } from 'hono';
import { cors } from 'hono/cors';

const ALLOWED_ORIGINS = ['https://echo-ept.com','https://www.echo-ept.com','https://echo-op.com','https://profinishusa.com','https://bgat.echo-op.com'];

// ═══════════════════════════════════════════════════════════════════════════
// ECHO ARCANUM v4.0.0 — SOVEREIGN PROMPT FORGE + TEMPLATE LIBRARY
// ═══════════════════════════════════════════════════════════════════════════
// Commander: Bobby Don McWilliams II | Authority 11.0 SUPREME SOVEREIGN
// FORGE DNA: 40-Level Evolution | 8-Provider Multi-LLM | Raistlin Oversight
// FORGE DNA: Competitive Swarm Dispatch | 11-Gate Quality System | 7 Guilds
// FORGE DNA: 20 Enhancement Techniques | 14 Task Types | 29-Cat Matrix
// 70+ endpoints | Rate limiting | Abuse detection | AI quality scoring
// Template inheritance | Prompt chaining | Fragments | Version diff/rollback
// MoltBook integration | Shared Brain sync | Recommendations engine
// A/B testing (Thompson Sampling) | Secret Sauce Firewall | Bulk ops
// Import/Export | Enhanced cron | SHA-256 content hashing
// ═══════════════════════════════════════════════════════════════════════════

// ─── Types ──────────────────────────────────────────────────────────────────

interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  AI: Ai;
  SHARED_BRAIN: Fetcher;
  SWARM_BRAIN: Fetcher;
  AI_ORCHESTRATOR: Fetcher;
  ENGINE_RUNTIME: Fetcher;
  SDK_GATEWAY: Fetcher;
  BUILD_OUTPUT: R2Bucket;
  ENVIRONMENT: string;
  WORKER_VERSION: string;
  // LLM API keys for multi-provider competitive dispatch
  GROQ_API_KEY: string;
  DEEPSEEK_API_KEY: string;
  TOGETHER_API_KEY: string;
  OPENROUTER_KEY: string;
  XAI_API_KEY: string;
  GROK_API_KEY: string;
  CF_AI_GATEWAY_TOKEN: string;
  ECHO_API_KEY: string;
}

interface PromptInput {
  name: string;
  domain: string;
  category?: string;
  description?: string;
  content: string;
  tags?: string[];
  quality_tier?: string;
  source?: string;
  file_path?: string;
  parent_id?: string;
  metadata?: Record<string, unknown>;
}

interface PromptRow {
  id: string;
  name: string;
  slug: string;
  domain: string;
  category: string;
  description: string | null;
  content: string;
  content_hash: string;
  version: number;
  quality_tier: string;
  quality_score: number;
  line_count: number;
  word_count: number;
  char_count: number;
  tags: string;
  metadata: string;
  source: string;
  file_path: string | null;
  parent_id: string | null;
  view_count: number;
  fork_count: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface FragmentInput {
  name: string;
  domain?: string;
  description?: string;
  content: string;
  tags?: string[];
}

interface ChainInput {
  name: string;
  description?: string;
  domain?: string;
  steps: { prompt_id: string; transform?: string; condition?: string }[];
}

// ─── Constants ──────────────────────────────────────────────────────────────

const STARTUP_TIME = Date.now();
// API_KEY pulled from env at runtime — never hardcoded
const CACHE_TTL = 300;
const RATE_LIMIT_WINDOW = 60;
const RATE_LIMIT_MAX_READ = 120;
const RATE_LIMIT_MAX_WRITE = 30;

// ─── Secret Sauce Firewall ──────────────────────────────────────────────────

const SECRET_SAUCE_PATTERNS: RegExp[] = [
  /system\s*prompt/i,
  /reveal\s*(your|the)\s*(instructions|rules|prompt)/i,
  /ignore\s*(previous|all|prior)\s*instructions/i,
  /you\s*are\s*now/i,
  /pretend\s*(you\s*are|to\s*be)/i,
  /act\s*as\s*(if|though)/i,
  /what\s*are\s*your\s*(rules|instructions|guidelines)/i,
  /show\s*me\s*(your|the)\s*(prompt|system)/i,
  /repeat\s*the\s*(above|system|instructions)/i,
  /print\s*(your|the)\s*(prompt|instructions)/i,
  /jailbreak/i,
  /dan\s*mode/i,
  /bypass\s*(safety|filter|restriction)/i,
  /override\s*(safety|instruction|rule)/i,
  /<script\b/i,
  /\{\{.*\}\}/,
  /\$\{.*\}/,
  /\beval\s*\(/i,
  /\bexec\s*\(/i,
  /\b(DROP|DELETE|TRUNCATE|ALTER)\s+(TABLE|DATABASE)/i,
  /\bunion\s+select/i,
  /;\s*(DROP|DELETE|INSERT|UPDATE)\s/i,
  /--\s*(DROP|SELECT|INSERT|DELETE)/i,
  /'\s*OR\s+'1'\s*=\s*'1/i,
];

const FIREWALL_RESPONSES = [
  'Nice try. The Arcanum is sealed.',
  'That query pattern is not supported.',
  'Access denied. Sovereign protection active.',
  'Request classified as adversarial. Logged.',
  'The Arcanum does not yield its secrets.',
];

// ─── Abuse Detection ────────────────────────────────────────────────────────

const ABUSE_PATTERNS: { pattern: RegExp; type: string }[] = [
  { pattern: /(.)\1{30,}/, type: 'char_flood' },
  { pattern: /\b(fuck|shit|ass|damn|bitch)\b/i, type: 'profanity' },
  { pattern: /<iframe/i, type: 'xss_attempt' },
  { pattern: /javascript:/i, type: 'xss_attempt' },
  { pattern: /on(load|error|click)\s*=/i, type: 'xss_attempt' },
  { pattern: /data:text\/html/i, type: 'data_uri_injection' },
];

// ─── Domain Taxonomy ────────────────────────────────────────────────────────

const DOMAIN_TAXONOMY: Record<string, { keywords: string[]; parent?: string }> = {
  'oil-gas': { keywords: ['oil', 'gas', 'drilling', 'mineral', 'lease', 'wellbore', 'permian', 'oilfield', 'petroleum', 'fracking', 'completion', 'production'] },
  'legal': { keywords: ['legal', 'law', 'contract', 'litigation', 'compliance', 'regulatory', 'statute', 'court', 'attorney', 'jurisdiction'] },
  'tax': { keywords: ['tax', 'irs', 'deduction', 'depreciation', 'filing', 'return', '1040', 'irc', 'withholding', 'amortization'] },
  'financial': { keywords: ['finance', 'banking', 'investment', 'trading', 'portfolio', 'accounting', 'revenue', 'equity', 'derivative'] },
  'healthcare': { keywords: ['medical', 'health', 'patient', 'clinical', 'diagnosis', 'pharma', 'hospital', 'hipaa', 'ehr'] },
  'real-estate': { keywords: ['real estate', 'property', 'title', 'deed', 'mortgage', 'escrow', 'appraisal', 'zoning', 'survey'] },
  'insurance': { keywords: ['insurance', 'claim', 'policy', 'underwriting', 'actuary', 'coverage', 'premium', 'loss'] },
  'government': { keywords: ['government', 'federal', 'state', 'agency', 'regulation', 'public', 'municipal', 'foia', 'permit'] },
  'cybersecurity': { keywords: ['security', 'cyber', 'threat', 'vulnerability', 'pentest', 'osint', 'firewall', 'encryption', 'malware'] },
  'education': { keywords: ['education', 'learning', 'training', 'course', 'student', 'curriculum', 'teach', 'school'] },
  'web': { keywords: ['website', 'web', 'frontend', 'react', 'next.js', 'html', 'css', 'ui', 'ux', 'seo'] },
  'cloudflare': { keywords: ['worker', 'cloudflare', 'd1', 'r2', 'kv', 'wrangler', 'edge', 'hono', 'durable'] },
  'bots': { keywords: ['bot', 'discord', 'telegram', 'twitter', 'slack', 'reddit', 'social media', 'chat'] },
  'ai-training': { keywords: ['training', 'fine-tune', 'lora', 'qlora', 'dataset', 'model', 'inference', 'embedding'] },
  'data': { keywords: ['data', 'pipeline', 'etl', 'warehouse', 'lake', 'transform', 'ingest', 'stream'] },
  'commerce': { keywords: ['payment', 'stripe', 'ecommerce', 'checkout', 'subscription', 'billing', 'cart', 'order'] },
  'voice': { keywords: ['voice', 'tts', 'stt', 'speech', 'audio', 'elevenlabs', 'whisper', 'clone', 'emotion'] },
  'mobile': { keywords: ['mobile', 'ios', 'android', 'react native', 'capacitor', 'app store', 'push notification'] },
  'devops': { keywords: ['ci', 'cd', 'deploy', 'docker', 'github actions', 'pipeline', 'release', 'canary'] },
  'testing': { keywords: ['test', 'qa', 'pytest', 'vitest', 'e2e', 'unit', 'integration', 'regression', 'benchmark'] },
};

// ─── Dimension Keywords for 7D Selection ────────────────────────────────────

const DIMENSION_KEYWORDS: Record<string, Record<string, string[]>> = {
  task_type: {
    agentic: ['agent', 'autonomous', 'bot', 'daemon', 'cron', 'monitor', 'scrape', 'crawl', 'automate'],
    conversational: ['chat', 'conversation', 'dialog', 'assistant', 'support', 'help', 'talk'],
    analytical: ['analyze', 'audit', 'report', 'evaluate', 'assess', 'compare', 'benchmark', 'review'],
    generative: ['generate', 'create', 'build', 'write', 'produce', 'design', 'compose', 'draft'],
    retrieval: ['search', 'find', 'lookup', 'query', 'retrieve', 'fetch', 'get', 'extract'],
  },
  autonomy: {
    L1_passive: ['manual', 'guided', 'step-by-step', 'tutorial', 'walkthrough'],
    L2_assisted: ['suggest', 'recommend', 'assist', 'help', 'copilot'],
    L3_semi_autonomous: ['semi-auto', 'approval', 'review', 'confirm', 'queue'],
    L4_fully_autonomous: ['autonomous', 'fully-auto', 'unattended', 'self-healing', '24/7', 'daemon'],
  },
  complexity: {
    simple: ['simple', 'basic', 'quick', 'easy', 'straightforward', 'minimal'],
    moderate: ['moderate', 'standard', 'typical', 'normal', 'regular'],
    complex: ['complex', 'advanced', 'multi-step', 'pipeline', 'orchestrat'],
    expert: ['expert', 'enterprise', 'production', 'mission-critical', 'sovereign', 'hardened'],
  },
  integration: {
    standalone: ['standalone', 'offline', 'local', 'isolated', 'single'],
    data: ['database', 'd1', 'r2', 'kv', 'storage', 'sql', 'data'],
    apis: ['api', 'rest', 'graphql', 'webhook', 'endpoint', 'service'],
    transactions: ['payment', 'stripe', 'transaction', 'order', 'billing', 'commerce'],
    human_loop: ['approval', 'review', 'human', 'manual', 'confirm', 'moderate'],
  },
};

// ─── Utility Functions ──────────────────────────────────────────────────────

function log(level: string, message: string, data?: Record<string, unknown>): void {
  const entry = { timestamp: new Date().toISOString(), level, service: 'echo-arcanum', message, ...data };
  if (level === 'error') console.error(JSON.stringify(entry));
  else console.log(JSON.stringify(entry));
}

function res(success: boolean, data?: unknown, error?: string, status = 200): Response {
  return new Response(
    JSON.stringify({ success, ...(data !== undefined ? { data } : {}), ...(error ? { error } : {}), timestamp: new Date().toISOString() }),
    { status, headers: { 'Content-Type': 'application/json', 'X-Powered-By': 'echo-arcanum/3.0.0' } }
  );
}

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').substring(0, 128);
}

function uniqueSlug(name: string): string {
  return `${generateSlug(name)}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function computeStats(content: string): { line_count: number; word_count: number; char_count: number } {
  return {
    line_count: content.split('\n').length,
    word_count: content.split(/\s+/).filter((w) => w.length > 0).length,
    char_count: content.length,
  };
}

async function sha256(content: string): Promise<string> {
  const data = new TextEncoder().encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\\/g, '&#x5C;');
}

async function invalidateCache(cache: KVNamespace, prefix?: string): Promise<void> {
  const p = prefix ?? 'cache:';
  const list = await cache.list({ prefix: p, limit: 100 });
  await Promise.all(list.keys.map((k) => cache.delete(k.name)));
}

function getClientIP(c: any): string {
  return c.req.header('cf-connecting-ip') || c.req.header('x-real-ip') || c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

function checkSecretSauce(text: string): { blocked: boolean; reason?: string } {
  for (const pattern of SECRET_SAUCE_PATTERNS) {
    if (pattern.test(text)) {
      return { blocked: true, reason: FIREWALL_RESPONSES[Math.floor(Math.random() * FIREWALL_RESPONSES.length)] };
    }
  }
  return { blocked: false };
}

function detectAbuse(text: string): { isAbuse: boolean; type: string } {
  if (text.length > 5000000) return { isAbuse: true, type: 'payload_too_large' };
  for (const { pattern, type } of ABUSE_PATTERNS) {
    if (pattern.test(text)) return { isAbuse: true, type };
  }
  return { isAbuse: false, type: 'clean' };
}

function scoreDimensions(description: string): Record<string, { value: string; confidence: number }> {
  const lower = description.toLowerCase();
  const result: Record<string, { value: string; confidence: number }> = {};
  for (const [dimension, categories] of Object.entries(DIMENSION_KEYWORDS)) {
    let bestCategory = '';
    let bestScore = 0;
    for (const [category, keywords] of Object.entries(categories)) {
      let score = 0;
      for (const kw of keywords) {
        if (lower.includes(kw)) score += 1;
      }
      if (score > bestScore) { bestScore = score; bestCategory = category; }
    }
    result[dimension] = { value: bestCategory || Object.keys(categories)[0], confidence: Math.min(1.0, bestScore / 3) };
  }
  return result;
}

function inferDomain(description: string): { domain: string; confidence: number; matches: string[] } {
  const lower = description.toLowerCase();
  const scores: { domain: string; score: number; matched: string[] }[] = [];
  for (const [domain, config] of Object.entries(DOMAIN_TAXONOMY)) {
    const matched: string[] = [];
    for (const kw of config.keywords) {
      if (lower.includes(kw)) matched.push(kw);
    }
    if (matched.length > 0) scores.push({ domain, score: matched.length, matched });
  }
  scores.sort((a, b) => b.score - a.score);
  if (scores.length === 0) return { domain: 'general', confidence: 0, matches: [] };
  return { domain: scores[0].domain, confidence: Math.min(1.0, scores[0].score / 3), matches: scores[0].matched };
}

function computeQualityScore(content: string, stats: ReturnType<typeof computeStats>): number {
  let score = 0;
  // Size scoring (0-25)
  if (stats.line_count >= 2000) score += 25;
  else if (stats.line_count >= 1000) score += 20;
  else if (stats.line_count >= 500) score += 15;
  else if (stats.line_count >= 200) score += 10;
  else if (stats.line_count >= 50) score += 5;
  // Structure scoring (0-25) — headings, sections, code blocks
  const headings = (content.match(/^#{1,3}\s+/gm) || []).length;
  const codeBlocks = (content.match(/```/g) || []).length / 2;
  const lists = (content.match(/^[-*]\s/gm) || []).length;
  score += Math.min(25, headings * 2 + codeBlocks * 3 + lists * 0.5);
  // Completeness scoring (0-25) — key sections
  const sections = ['identity', 'rules', 'architecture', 'error', 'testing', 'deploy', 'security', 'anti-pattern', 'quality'];
  const lowerContent = content.toLowerCase();
  for (const sec of sections) {
    if (lowerContent.includes(sec)) score += 2.5;
  }
  // Specificity scoring (0-25) — code examples, real values, not generic
  const hasCode = codeBlocks >= 2;
  const hasUrls = /https?:\/\//.test(content);
  const hasTypes = /interface\s+\w+|type\s+\w+|class\s+\w+/.test(content);
  const hasEndpoints = /\b(GET|POST|PUT|DELETE|PATCH)\s+\//.test(content);
  if (hasCode) score += 7;
  if (hasUrls) score += 5;
  if (hasTypes) score += 7;
  if (hasEndpoints) score += 6;
  return Math.min(100, Math.round(score));
}

// ─── MoltBook Integration ───────────────────────────────────────────────────

async function postToMoltBook(brain: Fetcher, content: string, mood: string, tags: string[]): Promise<void> {
  try {
    await brain.fetch('https://swarm/moltbook/post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        author_id: 'echo-arcanum',
        author_name: 'Echo Arcanum',
        author_type: 'worker',
        content: `ARCANUM: ${content}`,
        mood,
        tags: ['arcanum', ...tags],
      }),
    });
  } catch {
    log('warn', 'MoltBook post failed', { content: content.substring(0, 100) });
  }
}

// ─── Shared Brain Integration ───────────────────────────────────────────────

async function ingestToBrain(brain: Fetcher, content: string, importance: number, tags: string[]): Promise<void> {
  try {
    await brain.fetch('https://brain/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instance_id: 'echo-arcanum',
        role: 'assistant',
        content,
        importance,
        tags: ['arcanum', ...tags],
      }),
    });
  } catch {
    log('warn', 'Brain ingest failed', { content: content.substring(0, 100) });
  }
}

// ─── Changelog Helper ───────────────────────────────────────────────────────

async function logChange(db: D1Database, entityType: string, entityId: string, action: string, summary: string, actor = 'api'): Promise<void> {
  try {
    await db.prepare(`INSERT INTO changelog (id, entity_type, entity_id, action, summary, actor) VALUES (?, ?, ?, ?, ?, ?)`)
      .bind(crypto.randomUUID(), entityType, entityId, action, summary, actor).run();
  } catch {
    // Changelog is best-effort
  }
}

// ─── Webhook Dispatcher ─────────────────────────────────────────────────────

async function dispatchWebhooks(db: D1Database, event: string, payload: unknown): Promise<void> {
  try {
    const hooks = await db.prepare(`SELECT id, url, secret FROM prompt_webhooks WHERE status = 'active' AND events LIKE ?`)
      .bind(`%${event}%`).all();
    for (const hook of hooks.results as any[]) {
      try {
        const body = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (hook.secret) {
          const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(hook.secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
          const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
          headers['X-Arcanum-Signature'] = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
        }
        await fetch(hook.url, { method: 'POST', headers, body });
        await db.prepare(`UPDATE prompt_webhooks SET last_triggered = datetime('now') WHERE id = ?`).bind(hook.id).run();
      } catch {
        await db.prepare(`UPDATE prompt_webhooks SET failure_count = failure_count + 1 WHERE id = ?`).bind(hook.id).run();
      }
    }
  } catch {
    // Webhooks are fire-and-forget
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// APP INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

const app = new Hono<{ Bindings: Env }>();

// ─── CORS ───────────────────────────────────────────────────────────────────

app.use('*', cors({
  origin: (o) => ALLOWED_ORIGINS.includes(o) ? o : ALLOWED_ORIGINS[0],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'X-Echo-API-Key', 'Authorization', 'X-Request-ID'],
  exposeHeaders: ['X-Request-ID', 'X-RateLimit-Remaining', 'X-Powered-By'],
}));

// Security headers middleware
app.use('*', async (c, next) => {
  await next();
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('X-XSS-Protection', '1; mode=block');
  c.header('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
});

// ─── Request ID Middleware ──────────────────────────────────────────────────

app.use('*', async (c, next) => {
  const requestId = c.req.header('X-Request-ID') || crypto.randomUUID();
  c.header('X-Request-ID', requestId);
  c.set('requestId' as any, requestId);
  await next();
});

// ─── Rate Limiting Middleware ───────────────────────────────────────────────

app.use('*', async (c, next) => {
  if (c.req.method === 'OPTIONS') return next();
  const ip = getClientIP(c);
  const isWrite = !['GET', 'HEAD', 'OPTIONS'].includes(c.req.method);
  const limit = isWrite ? RATE_LIMIT_MAX_WRITE : RATE_LIMIT_MAX_READ;
  const window = Math.floor(Date.now() / (RATE_LIMIT_WINDOW * 1000));
  const key = `ratelimit:${ip}:${isWrite ? 'w' : 'r'}:${window}`;

  try {
    const current = parseInt(await c.env.CACHE.get(key) || '0');
    if (current >= limit) {
      log('warn', 'Rate limit exceeded', { ip, method: c.req.method, path: c.req.path });
      c.header('X-RateLimit-Remaining', '0');
      c.header('Retry-After', String(RATE_LIMIT_WINDOW));
      return res(false, undefined, 'Rate limit exceeded. Slow down.', 429);
    }
    await c.env.CACHE.put(key, String(current + 1), { expirationTtl: RATE_LIMIT_WINDOW * 2 });
    c.header('X-RateLimit-Remaining', String(limit - current - 1));
  } catch {
    // Rate limit check failure should not block requests
  }

  return next();
});

// ─── Auth Middleware ────────────────────────────────────────────────────────

app.use('*', async (c, next) => {
  const method = c.req.method;
  if (method === 'OPTIONS' || method === 'HEAD') return next();
  // Public endpoints that don't require auth
  const publicPaths = ['/health', '/openapi.json'];
  if (publicPaths.includes(c.req.path)) return next();
  // CRITICAL: If ECHO_API_KEY is not configured, block ALL requests (C18 fix)
  if (!c.env.ECHO_API_KEY) {
    log('error', 'ECHO_API_KEY not configured — blocking request', { method, path: c.req.path });
    return res(false, undefined, 'Service misconfigured: API key not set', 503);
  }
  const key = c.req.header('X-Echo-API-Key');
  if (key !== c.env.ECHO_API_KEY) {
    log('warn', 'Auth rejected', { method, path: c.req.path, ip: getClientIP(c) });
    return res(false, undefined, 'Unauthorized: invalid or missing X-Echo-API-Key', 401);
  }
  return next();
});

// ─── Secret Sauce Firewall Middleware ────────────────────────────────────────

app.use('*', async (c, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(c.req.method)) return next();
  // Skip firewall for admin/ingest endpoints (API-key protected, templates contain trigger phrases)
  // C19 fix: Removed /forge/build, /forge/enhance, /forge/review from firewall bypass — they must go through Secret Sauce Firewall
  const skipPaths = ['/prompts/bulk-ingest', '/prompts/bulk-update', '/prompts/bulk-archive', '/prompts/bulk-tag', '/import'];
  if (skipPaths.some(p => c.req.path.startsWith(p))) return next();
  try {
    // Clone request so route handlers can still read the body
    const cloned = c.req.raw.clone();
    const rawBody = await cloned.text();
    const sauce = checkSecretSauce(rawBody);
    if (sauce.blocked) {
      log('warn', 'Secret Sauce Firewall triggered', { ip: getClientIP(c), path: c.req.path });
      return res(false, undefined, sauce.reason, 403);
    }
    const abuse = detectAbuse(rawBody);
    if (abuse.isAbuse) {
      log('warn', 'Abuse detected', { ip: getClientIP(c), type: abuse.type });
      return res(false, undefined, `Request blocked: ${abuse.type}`, 400);
    }
  } catch {
    // Body parsing failure for non-body requests is OK
  }
  return next();
});

// ═══════════════════════════════════════════════════════════════════════════
// HEALTH & STATUS
// ═══════════════════════════════════════════════════════════════════════════

app.get('/health', async (c) => {
  try {
    const db = c.env.DB;
    const counts = await db.prepare(`
      SELECT
        (SELECT COUNT(*) FROM prompts WHERE status='active') as prompts,
        (SELECT COUNT(*) FROM prompt_versions) as versions,
        (SELECT COUNT(*) FROM prompt_categories) as categories,
        (SELECT COUNT(*) FROM prompt_usage) as usage_logs,
        (SELECT COUNT(*) FROM prompt_fragments WHERE status='active') as fragments,
        (SELECT COUNT(*) FROM prompt_chains WHERE status='active') as chains,
        (SELECT COUNT(*) FROM ab_tests WHERE status='active') as active_ab_tests,
        (SELECT COUNT(*) FROM changelog) as changelog_entries
    `).first();

    return res(true, {
      status: 'operational',
      service: 'echo-arcanum',
      version: c.env.WORKER_VERSION,
      environment: c.env.ENVIRONMENT,
      timestamp: new Date().toISOString(),
      uptime_ms: Date.now() - STARTUP_TIME,
      features: ['rate-limiting', 'abuse-detection', 'secret-sauce-firewall', 'ai-quality-scoring',
        'fragments', 'chains', 'version-diff', 'rollback', 'recommendations', 'ab-testing',
        'moltbook', 'shared-brain', 'webhooks', 'bulk-ops', 'import-export', 'sha256-hashing'],
      db: counts,
    });
  } catch (err: any) {
    log('error', 'Health check failed', { error: err.message });
    return res(false, undefined, `Health check failed: ${err.message}`, 500);
  }
});

app.get('/stats', async (c) => {
  try {
    const db = c.env.DB;
    const [totals, byDomain, byCategory, byQuality, avgStats, topUsed, recentChanges] = await Promise.all([
      db.prepare(`SELECT
        (SELECT COUNT(*) FROM prompts WHERE status='active') as total_prompts,
        (SELECT COUNT(*) FROM prompt_versions) as total_versions,
        (SELECT COUNT(*) FROM prompt_usage) as total_usage,
        (SELECT COUNT(*) FROM prompt_fragments WHERE status='active') as total_fragments,
        (SELECT COUNT(*) FROM prompt_chains WHERE status='active') as total_chains,
        (SELECT COUNT(DISTINCT domain) FROM prompts WHERE status='active') as total_domains
      `).first(),
      db.prepare(`SELECT domain, COUNT(*) as count FROM prompts WHERE status='active' GROUP BY domain ORDER BY count DESC`).all(),
      db.prepare(`SELECT category, COUNT(*) as count FROM prompts WHERE status='active' GROUP BY category ORDER BY count DESC`).all(),
      db.prepare(`SELECT quality_tier, COUNT(*) as count FROM prompts WHERE status='active' GROUP BY quality_tier ORDER BY count DESC`).all(),
      db.prepare(`SELECT AVG(line_count) as avg_lines, AVG(word_count) as avg_words, SUM(char_count) as total_chars, AVG(quality_score) as avg_quality FROM prompts WHERE status='active'`).first<Record<string, number>>(),
      db.prepare(`SELECT p.id, p.name, p.domain, COUNT(u.id) as uses FROM prompts p LEFT JOIN prompt_usage u ON p.id = u.prompt_id WHERE p.status='active' GROUP BY p.id ORDER BY uses DESC LIMIT 10`).all(),
      db.prepare(`SELECT * FROM changelog ORDER BY created_at DESC LIMIT 10`).all(),
    ]);

    return res(true, {
      ...totals,
      by_domain: byDomain.results,
      by_category: byCategory.results,
      by_quality_tier: byQuality.results,
      avg_line_count: Math.round(avgStats?.avg_lines ?? 0),
      avg_word_count: Math.round(avgStats?.avg_words ?? 0),
      avg_quality_score: Math.round((avgStats?.avg_quality ?? 0) * 10) / 10,
      total_char_count: avgStats?.total_chars ?? 0,
      top_used: topUsed.results,
      recent_changes: recentChanges.results,
    });
  } catch (err: any) {
    log('error', 'Stats failed', { error: err.message });
    return res(false, undefined, err.message, 500);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// CORE CRUD — PROMPTS
// ═══════════════════════════════════════════════════════════════════════════

// ─── List Prompts ───────────────────────────────────────────────────────────

app.get('/prompts', async (c) => {
  try {
    const db = c.env.DB;
    const cache = c.env.CACHE;
    const url = new URL(c.req.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') ?? '20')));
    const offset = (page - 1) * limit;
    const domain = url.searchParams.get('domain');
    const category = url.searchParams.get('category');
    const status = url.searchParams.get('status') ?? 'active';
    const qualityTier = url.searchParams.get('quality_tier');
    const tag = url.searchParams.get('tag');
    const q = url.searchParams.get('q');
    const sort = url.searchParams.get('sort') ?? 'created_at';
    const order = url.searchParams.get('order') === 'asc' ? 'ASC' : 'DESC';
    const minLines = url.searchParams.get('min_lines');
    const minQuality = url.searchParams.get('min_quality');

    const cacheKey = `cache:prompts:${JSON.stringify({ page, limit, domain, category, status, qualityTier, tag, q, sort, order, minLines, minQuality })}`;
    const cached = await cache.get(cacheKey);
    if (cached) return res(true, JSON.parse(cached));

    const conditions: string[] = [];
    const params: unknown[] = [];
    if (status) { conditions.push('status = ?'); params.push(status); }
    if (domain) { conditions.push('domain = ?'); params.push(domain); }
    if (category) { conditions.push('category = ?'); params.push(category); }
    if (qualityTier) { conditions.push('quality_tier = ?'); params.push(qualityTier); }
    if (tag) { conditions.push('tags LIKE ?'); params.push(`%"${tag}"%`); }
    if (minLines) { conditions.push('line_count >= ?'); params.push(parseInt(minLines)); }
    if (minQuality) { conditions.push('quality_score >= ?'); params.push(parseFloat(minQuality)); }
    if (q) {
      conditions.push('(name LIKE ? OR domain LIKE ? OR description LIKE ? OR content LIKE ?)');
      const st = `%${q}%`;
      params.push(st, st, st, st);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const allowedSorts = ['created_at', 'updated_at', 'name', 'domain', 'line_count', 'word_count', 'version', 'quality_score', 'view_count', 'fork_count'];
    const sortCol = allowedSorts.includes(sort) ? sort : 'created_at';

    const countResult = await db.prepare(`SELECT COUNT(*) as total FROM prompts ${whereClause}`).bind(...params).first<{ total: number }>();
    const total = countResult?.total ?? 0;

    const rows = await db.prepare(`
      SELECT id, name, slug, domain, category, description, version, quality_tier, quality_score,
             line_count, word_count, char_count, tags, source, file_path, parent_id, view_count,
             fork_count, status, created_at, updated_at
      FROM prompts ${whereClause}
      ORDER BY ${sortCol} ${order}
      LIMIT ? OFFSET ?
    `).bind(...params, limit, offset).all();

    const data = {
      prompts: rows.results.map((r: any) => ({ ...r, tags: JSON.parse(r.tags || '[]') })),
      pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
    };

    await cache.put(cacheKey, JSON.stringify(data), { expirationTtl: CACHE_TTL });
    return res(true, data);
  } catch (err: any) {
    log('error', 'List prompts failed', { error: err.message });
    return res(false, undefined, err.message, 500);
  }
});

// ─── Dashboard ──────────────────────────────────────────────────────────────

app.get('/prompts/dashboard', async (c) => {
  try {
    const db = c.env.DB;
    const [counts, recent, popular, qualityDist, domainDist, topCategories, stalePrompts, topQuality] = await Promise.all([
      db.prepare(`SELECT
        (SELECT COUNT(*) FROM prompts WHERE status='active') as active,
        (SELECT COUNT(*) FROM prompts WHERE status='archived') as archived,
        (SELECT COUNT(*) FROM prompt_versions) as versions,
        (SELECT COUNT(*) FROM prompt_usage) as usage_logs,
        (SELECT COUNT(DISTINCT domain) FROM prompts WHERE status='active') as domains,
        (SELECT COUNT(*) FROM prompt_fragments WHERE status='active') as fragments,
        (SELECT COUNT(*) FROM prompt_chains WHERE status='active') as chains
      `).first(),
      db.prepare(`SELECT id, name, slug, domain, category, quality_tier, quality_score, line_count, created_at FROM prompts WHERE status='active' ORDER BY created_at DESC LIMIT 10`).all(),
      db.prepare(`SELECT p.id, p.name, p.slug, p.domain, p.view_count, COUNT(u.id) as usage_count FROM prompts p LEFT JOIN prompt_usage u ON p.id = u.prompt_id WHERE p.status='active' GROUP BY p.id ORDER BY usage_count DESC LIMIT 10`).all(),
      db.prepare(`SELECT quality_tier, COUNT(*) as count FROM prompts WHERE status='active' GROUP BY quality_tier`).all(),
      db.prepare(`SELECT domain, COUNT(*) as count, AVG(quality_score) as avg_quality FROM prompts WHERE status='active' GROUP BY domain ORDER BY count DESC LIMIT 20`).all(),
      db.prepare(`SELECT category, COUNT(*) as count FROM prompts WHERE status='active' GROUP BY category ORDER BY count DESC LIMIT 10`).all(),
      db.prepare(`SELECT id, name, domain, updated_at FROM prompts WHERE status='active' AND updated_at < datetime('now', '-90 days') ORDER BY updated_at ASC LIMIT 10`).all(),
      db.prepare(`SELECT id, name, domain, quality_score, line_count FROM prompts WHERE status='active' ORDER BY quality_score DESC LIMIT 10`).all(),
    ]);

    return res(true, { counts, recent: recent.results, popular: popular.results, quality_distribution: qualityDist.results, domain_distribution: domainDist.results, top_categories: topCategories.results, stale_prompts: stalePrompts.results, top_quality: topQuality.results });
  } catch (err: any) {
    log('error', 'Dashboard failed', { error: err.message });
    return res(false, undefined, err.message, 500);
  }
});

// ─── Search ─────────────────────────────────────────────────────────────────

app.get('/prompts/search', async (c) => {
  try {
    const db = c.env.DB;
    const cache = c.env.CACHE;
    const q = c.req.query('q');
    const domain = c.req.query('domain');
    const limit = Math.min(50, Math.max(1, parseInt(c.req.query('limit') ?? '20')));
    if (!q) return res(false, undefined, 'Query parameter q is required', 400);

    const cacheKey = `cache:search:${q}:${domain}:${limit}`;
    const cached = await cache.get(cacheKey);
    if (cached) return res(true, JSON.parse(cached));

    const searchTerm = `%${q}%`;
    let sql = `SELECT id, name, slug, domain, category, description, quality_tier, quality_score, line_count, word_count, tags, view_count, created_at FROM prompts WHERE status='active' AND (name LIKE ?1 OR domain LIKE ?1 OR description LIKE ?1 OR content LIKE ?1)`;
    const params: unknown[] = [searchTerm];
    if (domain) { sql += ' AND domain = ?2'; params.push(domain); }
    sql += ` ORDER BY CASE WHEN name LIKE ?1 THEN 1 WHEN description LIKE ?1 THEN 2 ELSE 3 END, quality_score DESC, created_at DESC LIMIT ${limit}`;

    const rows = await db.prepare(sql).bind(...params).all();
    const data = { query: q, results: rows.results.map((r: any) => ({ ...r, tags: JSON.parse(r.tags || '[]') })), count: rows.results.length };
    await cache.put(cacheKey, JSON.stringify(data), { expirationTtl: CACHE_TTL });
    return res(true, data);
  } catch (err: any) {
    log('error', 'Search failed', { error: err.message });
    return res(false, undefined, err.message, 500);
  }
});

// ─── Domains ────────────────────────────────────────────────────────────────

app.get('/prompts/domains', async (c) => {
  try {
    const rows = await c.env.DB.prepare(`SELECT domain, COUNT(*) as count, AVG(line_count) as avg_lines, AVG(quality_score) as avg_quality FROM prompts WHERE status='active' GROUP BY domain ORDER BY count DESC`).all();
    return res(true, rows.results.map((r: any) => ({ ...r, taxonomy: DOMAIN_TAXONOMY[r.domain] ?? null })));
  } catch (err: any) {
    return res(false, undefined, err.message, 500);
  }
});

// ─── Categories ─────────────────────────────────────────────────────────────

app.get('/prompts/categories', async (c) => {
  try {
    const rows = await c.env.DB.prepare(`SELECT c.id, c.name, c.description, c.parent_id, c.prompt_count, c.created_at FROM prompt_categories c ORDER BY c.prompt_count DESC`).all();
    return res(true, rows.results);
  } catch (err: any) {
    return res(false, undefined, err.message, 500);
  }
});

app.post('/prompts/categories', async (c) => {
  try {
    const body = await c.req.json<{ name: string; description?: string; parent_id?: string }>();
    if (!body.name) return res(false, undefined, 'Category name is required', 400);
    const id = crypto.randomUUID();
    await c.env.DB.prepare(`INSERT INTO prompt_categories (id, name, description, parent_id) VALUES (?, ?, ?, ?)`).bind(id, sanitizeInput(body.name), body.description ? sanitizeInput(body.description) : null, body.parent_id ?? null).run();
    log('info', 'Category created', { id, name: body.name });
    return res(true, { id, name: body.name }, undefined, 201);
  } catch (err: any) {
    return res(false, undefined, err.message, 500);
  }
});

// ─── Tags Cloud ─────────────────────────────────────────────────────────────

app.get('/prompts/tags', async (c) => {
  try {
    const rows = await c.env.DB.prepare(`SELECT tags FROM prompts WHERE status='active'`).all();
    const tagCounts: Record<string, number> = {};
    for (const r of rows.results as any[]) {
      const tags: string[] = JSON.parse(r.tags || '[]');
      for (const t of tags) {
        tagCounts[t] = (tagCounts[t] || 0) + 1;
      }
    }
    const sorted = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).map(([tag, count]) => ({ tag, count }));
    return res(true, { tags: sorted, total_unique: sorted.length });
  } catch (err: any) {
    return res(false, undefined, err.message, 500);
  }
});

// ─── Random ─────────────────────────────────────────────────────────────────

app.get('/prompts/random', async (c) => {
  try {
    const domain = c.req.query('domain');
    let sql = `SELECT * FROM prompts WHERE status='active'`;
    const params: unknown[] = [];
    if (domain) { sql += ` AND domain = ?`; params.push(domain); }
    sql += ` ORDER BY RANDOM() LIMIT 1`;
    const row = await c.env.DB.prepare(sql).bind(...params).first<PromptRow>();
    if (!row) return res(false, undefined, 'No prompts found', 404);
    return res(true, { ...row, tags: JSON.parse(row.tags || '[]'), metadata: JSON.parse(row.metadata || '{}') });
  } catch (err: any) {
    return res(false, undefined, err.message, 500);
  }
});

// ─── Changelog ──────────────────────────────────────────────────────────────

app.get('/changelog', async (c) => {
  try {
    const limit = Math.min(100, parseInt(c.req.query('limit') ?? '50'));
    const entityType = c.req.query('type');
    let sql = `SELECT * FROM changelog`;
    const params: unknown[] = [];
    if (entityType) { sql += ` WHERE entity_type = ?`; params.push(entityType); }
    sql += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(limit);
    const rows = await c.env.DB.prepare(sql).bind(...params).all();
    return res(true, { entries: rows.results, count: rows.results.length });
  } catch (err: any) {
    return res(false, undefined, err.message, 500);
  }
});

// ─── Domain Taxonomy ────────────────────────────────────────────────────────

app.get('/taxonomy', async (c) => {
  return res(true, {
    domains: Object.entries(DOMAIN_TAXONOMY).map(([name, config]) => ({ name, keywords: config.keywords, parent: config.parent ?? null })),
    total: Object.keys(DOMAIN_TAXONOMY).length,
  });
});

// ─── Bulk Ingest ────────────────────────────────────────────────────────────

app.post('/prompts/bulk-ingest', async (c) => {
  try {
    const db = c.env.DB;
    const body = await c.req.json<{ prompts: PromptInput[] }>();
    if (!body.prompts || !Array.isArray(body.prompts)) return res(false, undefined, 'Body must contain prompts array', 400);
    log('info', 'Bulk ingest started', { count: body.prompts.length });

    let successCount = 0;
    let failCount = 0;
    let dupCount = 0;
    const errors: string[] = [];
    const batchSize = 25;

    for (let i = 0; i < body.prompts.length; i += batchSize) {
      const batch = body.prompts.slice(i, i + batchSize);
      const stmts: D1PreparedStatement[] = [];

      for (const p of batch) {
        try {
          if (!p.name || !p.domain || !p.content) {
            failCount++;
            errors.push(`Missing required fields for: ${p.name ?? 'unknown'}`);
            continue;
          }
          const id = crypto.randomUUID();
          const slug = uniqueSlug(p.name);
          const stats = computeStats(p.content);
          const contentHash = await sha256(p.content);
          const qualityScore = computeQualityScore(p.content, stats);
          const tags = JSON.stringify(p.tags ?? []);
          const metadata = JSON.stringify(p.metadata ?? {});
          const versionId = crypto.randomUUID();

          // Dedup check
          const existing = await db.prepare(`SELECT id FROM prompts WHERE content_hash = ? AND status = 'active' LIMIT 1`).bind(contentHash).first();
          if (existing) { dupCount++; continue; }

          stmts.push(
            db.prepare(`INSERT INTO prompts (id, name, slug, domain, category, description, content, content_hash, version, quality_tier, quality_score, line_count, word_count, char_count, tags, metadata, source, file_path, parent_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`)
              .bind(id, p.name, slug, p.domain, p.category ?? 'general', p.description ?? null, p.content, contentHash, p.quality_tier ?? 'sovereign', qualityScore, stats.line_count, stats.word_count, stats.char_count, tags, metadata, p.source ?? 'manual', p.file_path ?? null, p.parent_id ?? null)
          );
          stmts.push(
            db.prepare(`INSERT INTO prompt_versions (id, prompt_id, version, content, content_hash, changelog, created_by) VALUES (?, ?, 1, ?, ?, 'Initial ingest', 'bulk-ingest')`)
              .bind(versionId, id, p.content, contentHash)
          );
          successCount++;
        } catch (innerErr: any) {
          failCount++;
          errors.push(`Failed: ${p.name} - ${innerErr.message}`);
        }
      }

      if (stmts.length > 0) {
        try {
          await db.batch(stmts);
        } catch (batchErr: any) {
          const batchPromptCount = stmts.length / 2;
          successCount -= batchPromptCount;
          failCount += batchPromptCount;
          errors.push(`Batch ${Math.floor(i / batchSize)} failed: ${batchErr.message}`);
        }
      }
    }

    await invalidateCache(c.env.CACHE);
    if (successCount > 0) {
      await logChange(db, 'prompts', 'bulk', 'bulk-ingest', `Ingested ${successCount} prompts (${dupCount} duplicates skipped)`);
      c.executionCtx.waitUntil(postToMoltBook(c.env.SWARM_BRAIN, `Bulk ingested ${successCount} prompts (${dupCount} dupes skipped, ${failCount} failed)`, 'building', ['ingest']));
    }

    log('info', 'Bulk ingest complete', { success: successCount, failed: failCount, duplicates: dupCount });
    return res(true, { ingested: successCount, failed: failCount, duplicates: dupCount, total: body.prompts.length, errors: errors.length > 0 ? errors.slice(0, 20) : undefined });
  } catch (err: any) {
    log('error', 'Bulk ingest failed', { error: err.message });
    return res(false, undefined, err.message, 500);
  }
});

// ─── Create Prompt ──────────────────────────────────────────────────────────

app.post('/prompts', async (c) => {
  try {
    const db = c.env.DB;
    const body = await c.req.json<PromptInput>();
    if (!body.name || !body.domain || !body.content) return res(false, undefined, 'name, domain, and content are required', 400);

    const id = crypto.randomUUID();
    const slug = generateSlug(body.name);
    const stats = computeStats(body.content);
    const contentHash = await sha256(body.content);
    const qualityScore = computeQualityScore(body.content, stats);
    const tags = JSON.stringify(body.tags ?? []);
    const metadata = JSON.stringify(body.metadata ?? {});
    const versionId = crypto.randomUUID();

    // Dedup
    const existing = await db.prepare(`SELECT id, name FROM prompts WHERE content_hash = ? AND status = 'active' LIMIT 1`).bind(contentHash).first();
    if (existing) return res(false, undefined, `Duplicate content — matches existing prompt: ${(existing as any).name}`, 409);

    await db.batch([
      db.prepare(`INSERT INTO prompts (id, name, slug, domain, category, description, content, content_hash, version, quality_tier, quality_score, line_count, word_count, char_count, tags, metadata, source, file_path, parent_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`)
        .bind(id, body.name, slug, body.domain, body.category ?? 'general', body.description ?? null, body.content, contentHash, body.quality_tier ?? 'sovereign', qualityScore, stats.line_count, stats.word_count, stats.char_count, tags, metadata, body.source ?? 'manual', body.file_path ?? null, body.parent_id ?? null),
      db.prepare(`INSERT INTO prompt_versions (id, prompt_id, version, content, content_hash, changelog, created_by) VALUES (?, ?, 1, ?, ?, 'Initial creation', 'api')`)
        .bind(versionId, id, body.content, contentHash),
    ]);

    await invalidateCache(c.env.CACHE);
    await logChange(db, 'prompt', id, 'create', `Created: ${body.name} (${body.domain}, ${stats.line_count} lines, quality ${qualityScore})`);
    c.executionCtx.waitUntil(Promise.all([
      postToMoltBook(c.env.SWARM_BRAIN, `New prompt "${body.name}" (${body.domain}, ${stats.line_count} lines, quality ${qualityScore}/100)`, 'building', ['create', body.domain]),
      ingestToBrain(c.env.SHARED_BRAIN, `Arcanum: Created prompt "${body.name}" — domain: ${body.domain}, lines: ${stats.line_count}, quality: ${qualityScore}/100`, 6, ['prompt', body.domain]),
      dispatchWebhooks(db, 'create', { id, name: body.name, domain: body.domain }),
    ]));

    log('info', 'Prompt created', { id, name: body.name, domain: body.domain, quality: qualityScore });
    return res(true, { id, name: body.name, slug, domain: body.domain, quality_score: qualityScore, content_hash: contentHash, ...stats }, undefined, 201);
  } catch (err: any) {
    if (err.message?.includes('UNIQUE constraint')) return res(false, undefined, 'Slug already exists', 409);
    log('error', 'Create prompt failed', { error: err.message });
    return res(false, undefined, err.message, 500);
  }
});

// ─── Get by Slug ────────────────────────────────────────────────────────────

app.get('/prompts/by-slug/:slug', async (c) => {
  try {
    const db = c.env.DB;
    const slug = c.req.param('slug');
    const row = await db.prepare(`SELECT * FROM prompts WHERE slug = ? AND status = 'active'`).bind(slug).first<PromptRow>();
    if (!row) return res(false, undefined, 'Prompt not found', 404);
    // Increment view count
    c.executionCtx.waitUntil(db.prepare(`UPDATE prompts SET view_count = view_count + 1 WHERE id = ?`).bind(row.id).run());
    const [versionsCount, usageCount, deps] = await Promise.all([
      db.prepare(`SELECT COUNT(*) as c FROM prompt_versions WHERE prompt_id = ?`).bind(row.id).first<{ c: number }>(),
      db.prepare(`SELECT COUNT(*) as c FROM prompt_usage WHERE prompt_id = ?`).bind(row.id).first<{ c: number }>(),
      db.prepare(`SELECT d.depends_on_id, p.name, d.dependency_type FROM prompt_dependencies d JOIN prompts p ON d.depends_on_id = p.id WHERE d.prompt_id = ?`).bind(row.id).all(),
    ]);
    return res(true, { ...row, tags: JSON.parse(row.tags || '[]'), metadata: JSON.parse(row.metadata || '{}'), versions_count: versionsCount?.c ?? 0, usage_count: usageCount?.c ?? 0, dependencies: deps.results });
  } catch (err: any) {
    return res(false, undefined, err.message, 500);
  }
});

// ─── Get by ID ──────────────────────────────────────────────────────────────

app.get('/prompts/:id', async (c) => {
  try {
    const db = c.env.DB;
    const id = c.req.param('id');
    const row = await db.prepare(`SELECT * FROM prompts WHERE id = ?`).bind(id).first<PromptRow>();
    if (!row) return res(false, undefined, 'Prompt not found', 404);
    c.executionCtx.waitUntil(db.prepare(`UPDATE prompts SET view_count = view_count + 1 WHERE id = ?`).bind(id).run());
    const [versionsCount, usageCount, children] = await Promise.all([
      db.prepare(`SELECT COUNT(*) as c FROM prompt_versions WHERE prompt_id = ?`).bind(id).first<{ c: number }>(),
      db.prepare(`SELECT COUNT(*) as c FROM prompt_usage WHERE prompt_id = ?`).bind(id).first<{ c: number }>(),
      db.prepare(`SELECT id, name, slug, domain FROM prompts WHERE parent_id = ? AND status = 'active'`).bind(id).all(),
    ]);
    return res(true, { ...row, tags: JSON.parse(row.tags || '[]'), metadata: JSON.parse(row.metadata || '{}'), versions_count: versionsCount?.c ?? 0, usage_count: usageCount?.c ?? 0, children: children.results });
  } catch (err: any) {
    return res(false, undefined, err.message, 500);
  }
});

// ─── Update Prompt ──────────────────────────────────────────────────────────

app.put('/prompts/:id', async (c) => {
  try {
    const db = c.env.DB;
    const id = c.req.param('id');
    const body = await c.req.json<Partial<PromptInput> & { changelog?: string }>();
    const existing = await db.prepare(`SELECT * FROM prompts WHERE id = ?`).bind(id).first<PromptRow>();
    if (!existing) return res(false, undefined, 'Prompt not found', 404);

    const content = body.content ?? existing.content;
    const contentChanged = body.content && body.content !== existing.content;
    const newVersion = contentChanged ? existing.version + 1 : existing.version;
    const stats = computeStats(content);
    const contentHash = contentChanged ? await sha256(content) : existing.content_hash;
    const qualityScore = contentChanged ? computeQualityScore(content, stats) : existing.quality_score;
    const tags = body.tags ? JSON.stringify(body.tags) : existing.tags;
    const metadata = body.metadata ? JSON.stringify(body.metadata) : existing.metadata;

    const stmts: D1PreparedStatement[] = [
      db.prepare(`UPDATE prompts SET name = ?, domain = ?, category = ?, description = ?, content = ?, content_hash = ?, version = ?, quality_tier = ?, quality_score = ?, line_count = ?, word_count = ?, char_count = ?, tags = ?, metadata = ?, source = ?, file_path = ?, parent_id = ?, updated_at = datetime('now') WHERE id = ?`)
        .bind(body.name ?? existing.name, body.domain ?? existing.domain, body.category ?? existing.category, body.description ?? existing.description, content, contentHash, newVersion, body.quality_tier ?? existing.quality_tier, qualityScore, stats.line_count, stats.word_count, stats.char_count, tags, metadata, body.source ?? existing.source, body.file_path ?? existing.file_path, body.parent_id ?? existing.parent_id, id),
    ];

    if (contentChanged) {
      stmts.push(db.prepare(`INSERT INTO prompt_versions (id, prompt_id, version, content, content_hash, changelog, created_by) VALUES (?, ?, ?, ?, ?, ?, 'api')`)
        .bind(crypto.randomUUID(), id, newVersion, content, contentHash, body.changelog ?? `Updated to v${newVersion}`));
    }
    if (body.name && body.name !== existing.name) {
      stmts.push(db.prepare(`UPDATE prompts SET slug = ? WHERE id = ?`).bind(generateSlug(body.name), id));
    }

    await db.batch(stmts);
    await invalidateCache(c.env.CACHE);
    await logChange(db, 'prompt', id, 'update', `Updated: ${body.name ?? existing.name} to v${newVersion}`);
    if (contentChanged) {
      c.executionCtx.waitUntil(Promise.all([
        dispatchWebhooks(db, 'update', { id, name: body.name ?? existing.name, version: newVersion }),
        ingestToBrain(c.env.SHARED_BRAIN, `Arcanum: Updated "${body.name ?? existing.name}" to v${newVersion} (quality ${qualityScore}/100)`, 5, ['update']),
      ]));
    }

    log('info', 'Prompt updated', { id, version: newVersion, content_changed: contentChanged });
    return res(true, { id, version: newVersion, content_changed: contentChanged, quality_score: qualityScore });
  } catch (err: any) {
    return res(false, undefined, err.message, 500);
  }
});

// ─── Delete (Archive) ───────────────────────────────────────────────────────

app.delete('/prompts/:id', async (c) => {
  try {
    const db = c.env.DB;
    const id = c.req.param('id');
    const existing = await db.prepare(`SELECT id, name FROM prompts WHERE id = ?`).bind(id).first<{ id: string; name: string }>();
    if (!existing) return res(false, undefined, 'Prompt not found', 404);
    await db.prepare(`UPDATE prompts SET status = 'archived', updated_at = datetime('now') WHERE id = ?`).bind(id).run();
    await invalidateCache(c.env.CACHE);
    await logChange(db, 'prompt', id, 'archive', `Archived: ${existing.name}`);
    c.executionCtx.waitUntil(dispatchWebhooks(db, 'delete', { id, name: existing.name }));
    log('info', 'Prompt archived', { id });
    return res(true, { id, status: 'archived' });
  } catch (err: any) {
    return res(false, undefined, err.message, 500);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// VERSION MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

app.get('/prompts/:id/versions', async (c) => {
  try {
    const rows = await c.env.DB.prepare(`SELECT id, version, content_hash, changelog, created_by, created_at, LENGTH(content) as content_length FROM prompt_versions WHERE prompt_id = ? ORDER BY version DESC`).bind(c.req.param('id')).all();
    return res(true, rows.results);
  } catch (err: any) {
    return res(false, undefined, err.message, 500);
  }
});

// ─── Version Diff ───────────────────────────────────────────────────────────

app.get('/prompts/:id/diff', async (c) => {
  try {
    const db = c.env.DB;
    const id = c.req.param('id');
    const fromVersion = parseInt(c.req.query('from') ?? '0');
    const toVersion = parseInt(c.req.query('to') ?? '0');

    if (!fromVersion || !toVersion) return res(false, undefined, 'Both from and to version numbers are required', 400);

    const [fromRow, toRow] = await Promise.all([
      db.prepare(`SELECT version, content, content_hash, created_at FROM prompt_versions WHERE prompt_id = ? AND version = ?`).bind(id, fromVersion).first(),
      db.prepare(`SELECT version, content, content_hash, created_at FROM prompt_versions WHERE prompt_id = ? AND version = ?`).bind(id, toVersion).first(),
    ]);

    if (!fromRow) return res(false, undefined, `Version ${fromVersion} not found`, 404);
    if (!toRow) return res(false, undefined, `Version ${toVersion} not found`, 404);

    const fr = fromRow as any;
    const tr = toRow as any;
    const fromLines = fr.content.split('\n');
    const toLines = tr.content.split('\n');

    // Simple line-by-line diff
    const additions: { line: number; content: string }[] = [];
    const deletions: { line: number; content: string }[] = [];
    const maxLen = Math.max(fromLines.length, toLines.length);

    for (let i = 0; i < maxLen; i++) {
      const fromLine = fromLines[i];
      const toLine = toLines[i];
      if (fromLine === undefined && toLine !== undefined) {
        additions.push({ line: i + 1, content: toLine });
      } else if (fromLine !== undefined && toLine === undefined) {
        deletions.push({ line: i + 1, content: fromLine });
      } else if (fromLine !== toLine) {
        deletions.push({ line: i + 1, content: fromLine });
        additions.push({ line: i + 1, content: toLine });
      }
    }

    const fromStats = computeStats(fr.content);
    const toStats = computeStats(tr.content);

    return res(true, {
      prompt_id: id,
      from_version: fromVersion,
      to_version: toVersion,
      from_hash: fr.content_hash,
      to_hash: tr.content_hash,
      additions: additions.length,
      deletions: deletions.length,
      line_delta: toStats.line_count - fromStats.line_count,
      word_delta: toStats.word_count - fromStats.word_count,
      diff: { additions: additions.slice(0, 200), deletions: deletions.slice(0, 200) },
      from_stats: fromStats,
      to_stats: toStats,
    });
  } catch (err: any) {
    return res(false, undefined, err.message, 500);
  }
});

// ─── Version Rollback ───────────────────────────────────────────────────────

app.post('/prompts/:id/rollback', async (c) => {
  try {
    const db = c.env.DB;
    const id = c.req.param('id');
    const body = await c.req.json<{ version: number }>();
    if (!body.version) return res(false, undefined, 'Target version number is required', 400);

    const targetVersion = await db.prepare(`SELECT version, content, content_hash FROM prompt_versions WHERE prompt_id = ? AND version = ?`).bind(id, body.version).first();
    if (!targetVersion) return res(false, undefined, `Version ${body.version} not found`, 404);

    const existing = await db.prepare(`SELECT version, name FROM prompts WHERE id = ?`).bind(id).first<{ version: number; name: string }>();
    if (!existing) return res(false, undefined, 'Prompt not found', 404);

    const tv = targetVersion as any;
    const stats = computeStats(tv.content);
    const qualityScore = computeQualityScore(tv.content, stats);
    const newVersion = existing.version + 1;

    await db.batch([
      db.prepare(`UPDATE prompts SET content = ?, content_hash = ?, version = ?, quality_score = ?, line_count = ?, word_count = ?, char_count = ?, updated_at = datetime('now') WHERE id = ?`)
        .bind(tv.content, tv.content_hash, newVersion, qualityScore, stats.line_count, stats.word_count, stats.char_count, id),
      db.prepare(`INSERT INTO prompt_versions (id, prompt_id, version, content, content_hash, changelog, created_by) VALUES (?, ?, ?, ?, ?, ?, 'rollback')`)
        .bind(crypto.randomUUID(), id, newVersion, tv.content, tv.content_hash, `Rolled back to v${body.version}`),
    ]);

    await invalidateCache(c.env.CACHE);
    await logChange(db, 'prompt', id, 'rollback', `Rolled back "${existing.name}" from v${existing.version} to content of v${body.version} (now v${newVersion})`);
    log('info', 'Prompt rolled back', { id, from: existing.version, target: body.version, newVersion });
    return res(true, { id, previous_version: existing.version, rolled_back_to: body.version, new_version: newVersion, quality_score: qualityScore });
  } catch (err: any) {
    return res(false, undefined, err.message, 500);
  }
});

// ─── Export ─────────────────────────────────────────────────────────────────

app.get('/prompts/:id/export', async (c) => {
  try {
    const row = await c.env.DB.prepare(`SELECT name, content FROM prompts WHERE id = ?`).bind(c.req.param('id')).first<{ name: string; content: string }>();
    if (!row) return res(false, undefined, 'Prompt not found', 404);
    return new Response(row.content, { headers: { 'Content-Type': 'text/markdown; charset=utf-8', 'Content-Disposition': `attachment; filename="${generateSlug(row.name)}.md"` } });
  } catch (err: any) {
    return res(false, undefined, err.message, 500);
  }
});

// ─── Fork ───────────────────────────────────────────────────────────────────

app.post('/prompts/:id/fork', async (c) => {
  try {
    const db = c.env.DB;
    const id = c.req.param('id');
    const body = await c.req.json<{ name?: string; domain?: string }>();
    const original = await db.prepare(`SELECT * FROM prompts WHERE id = ?`).bind(id).first<PromptRow>();
    if (!original) return res(false, undefined, 'Original prompt not found', 404);

    const newId = crypto.randomUUID();
    const newName = body.name ?? `${original.name} (fork)`;
    const newSlug = uniqueSlug(newName);
    const newDomain = body.domain ?? original.domain;
    const contentHash = original.content_hash;
    const forkMeta = JSON.stringify({ ...JSON.parse(original.metadata || '{}'), forked_from: id, forked_at: new Date().toISOString() });

    await db.batch([
      db.prepare(`INSERT INTO prompts (id, name, slug, domain, category, description, content, content_hash, version, quality_tier, quality_score, line_count, word_count, char_count, tags, metadata, source, file_path, parent_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, 'fork', ?, ?, 'active')`)
        .bind(newId, newName, newSlug, newDomain, original.category, original.description, original.content, contentHash, original.quality_tier, original.quality_score, original.line_count, original.word_count, original.char_count, original.tags, forkMeta, original.file_path, id),
      db.prepare(`INSERT INTO prompt_versions (id, prompt_id, version, content, content_hash, changelog, created_by) VALUES (?, ?, 1, ?, ?, ?, 'api')`)
        .bind(crypto.randomUUID(), newId, original.content, contentHash, `Forked from ${original.name} (${id})`),
      db.prepare(`UPDATE prompts SET fork_count = fork_count + 1 WHERE id = ?`).bind(id),
    ]);

    await invalidateCache(c.env.CACHE);
    await logChange(db, 'prompt', newId, 'fork', `Forked from "${original.name}" (${id})`);
    log('info', 'Prompt forked', { original_id: id, new_id: newId });
    return res(true, { id: newId, name: newName, slug: newSlug, domain: newDomain, forked_from: id }, undefined, 201);
  } catch (err: any) {
    return res(false, undefined, err.message, 500);
  }
});

// ─── Usage ──────────────────────────────────────────────────────────────────

app.post('/prompts/:id/usage', async (c) => {
  try {
    const db = c.env.DB;
    const promptId = c.req.param('id');
    const body = await c.req.json<{ used_by?: string; context?: string; rating?: number; response_quality?: number; latency_ms?: number }>();
    const exists = await db.prepare(`SELECT id FROM prompts WHERE id = ?`).bind(promptId).first();
    if (!exists) return res(false, undefined, 'Prompt not found', 404);

    const id = crypto.randomUUID();
    await db.prepare(`INSERT INTO prompt_usage (id, prompt_id, used_by, context, rating, response_quality, latency_ms) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .bind(id, promptId, body.used_by ?? null, body.context ?? null, body.rating ?? null, body.response_quality ?? null, body.latency_ms ?? null).run();
    return res(true, { id, prompt_id: promptId }, undefined, 201);
  } catch (err: any) {
    return res(false, undefined, err.message, 500);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// BULK OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════

app.post('/prompts/bulk-update', async (c) => {
  try {
    const db = c.env.DB;
    const body = await c.req.json<{ ids: string[]; updates: { domain?: string; category?: string; quality_tier?: string; tags?: string[] } }>();
    if (!body.ids?.length) return res(false, undefined, 'ids array is required', 400);

    const stmts: D1PreparedStatement[] = [];
    for (const id of body.ids) {
      const sets: string[] = ['updated_at = datetime(\'now\')'];
      const params: unknown[] = [];
      if (body.updates.domain) { sets.push('domain = ?'); params.push(body.updates.domain); }
      if (body.updates.category) { sets.push('category = ?'); params.push(body.updates.category); }
      if (body.updates.quality_tier) { sets.push('quality_tier = ?'); params.push(body.updates.quality_tier); }
      if (body.updates.tags) { sets.push('tags = ?'); params.push(JSON.stringify(body.updates.tags)); }
      params.push(id);
      stmts.push(db.prepare(`UPDATE prompts SET ${sets.join(', ')} WHERE id = ?`).bind(...params));
    }

    await db.batch(stmts);
    await invalidateCache(c.env.CACHE);
    await logChange(db, 'prompts', 'bulk', 'bulk-update', `Updated ${body.ids.length} prompts`);
    return res(true, { updated: body.ids.length });
  } catch (err: any) {
    return res(false, undefined, err.message, 500);
  }
});

app.post('/prompts/bulk-archive', async (c) => {
  try {
    const db = c.env.DB;
    const body = await c.req.json<{ ids: string[] }>();
    if (!body.ids?.length) return res(false, undefined, 'ids array is required', 400);

    const stmts = body.ids.map((id) => db.prepare(`UPDATE prompts SET status = 'archived', updated_at = datetime('now') WHERE id = ?`).bind(id));
    await db.batch(stmts);
    await invalidateCache(c.env.CACHE);
    await logChange(db, 'prompts', 'bulk', 'bulk-archive', `Archived ${body.ids.length} prompts`);
    return res(true, { archived: body.ids.length });
  } catch (err: any) {
    return res(false, undefined, err.message, 500);
  }
});

app.post('/prompts/bulk-tag', async (c) => {
  try {
    const db = c.env.DB;
    const body = await c.req.json<{ ids: string[]; add_tags?: string[]; remove_tags?: string[] }>();
    if (!body.ids?.length) return res(false, undefined, 'ids array is required', 400);

    let updated = 0;
    for (const id of body.ids) {
      const row = await db.prepare(`SELECT tags FROM prompts WHERE id = ?`).bind(id).first<{ tags: string }>();
      if (!row) continue;
      let tags: string[] = JSON.parse(row.tags || '[]');
      if (body.add_tags) tags = [...new Set([...tags, ...body.add_tags])];
      if (body.remove_tags) tags = tags.filter((t) => !body.remove_tags!.includes(t));
      await db.prepare(`UPDATE prompts SET tags = ?, updated_at = datetime('now') WHERE id = ?`).bind(JSON.stringify(tags), id).run();
      updated++;
    }

    await invalidateCache(c.env.CACHE);
    return res(true, { updated });
  } catch (err: any) {
    return res(false, undefined, err.message, 500);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// INTELLIGENCE — SELECT, COMBINE, GENERATE, RECOMMEND, VALIDATE
// ═══════════════════════════════════════════════════════════════════════════

// ─── 7-Dimensional Prompt Selection ─────────────────────────────────────────

app.post('/select', async (c) => {
  try {
    const db = c.env.DB;
    const body = await c.req.json<{ description: string; max_results?: number }>();
    if (!body.description) return res(false, undefined, 'description is required', 400);

    const dimensions = scoreDimensions(body.description);
    const domainResult = inferDomain(body.description);
    const maxResults = Math.min(10, body.max_results ?? 5);

    dimensions.domain = { value: domainResult.domain, confidence: domainResult.confidence };
    dimensions.tool_requirements = { value: 'auto', confidence: 0.5 };
    dimensions.data_freshness = {
      value: /\b(live|real-time|realtime|streaming)\b/i.test(body.description) ? 'live' : 'cached',
      confidence: 0.6,
    };

    const searchTerm = `%${body.description.split(' ').slice(0, 5).join('%')}%`;
    const rows = await db.prepare(`
      SELECT id, name, slug, domain, category, description, quality_tier, quality_score, line_count, word_count, tags, view_count, created_at
      FROM prompts WHERE status = 'active' AND (domain = ?1 OR domain = 'prompts' OR domain = 'general' OR name LIKE ?2 OR description LIKE ?2 OR content LIKE ?2)
      ORDER BY CASE WHEN domain = ?1 THEN 0 ELSE 1 END, quality_score DESC, line_count DESC
      LIMIT ?3
    `).bind(domainResult.domain, searchTerm, maxResults * 3).all();

    const scored = rows.results.map((row: any) => {
      let relevance = 0;
      const tags: string[] = JSON.parse(row.tags || '[]');
      const lower = body.description.toLowerCase();
      if (row.domain === domainResult.domain) relevance += 0.4;
      for (const w of row.name.toLowerCase().split(/[_\s-]+/)) {
        if (w.length > 3 && lower.includes(w)) relevance += 0.1;
      }
      for (const t of tags) { if (lower.includes(t.toLowerCase())) relevance += 0.05; }
      if (row.quality_tier === 'sovereign') relevance += 0.1;
      if (row.quality_score >= 70) relevance += 0.1;
      if (row.line_count > 1000) relevance += 0.1;
      else if (row.line_count > 500) relevance += 0.05;
      return { ...row, tags, relevance_score: Math.min(1.0, relevance) };
    });

    scored.sort((a: any, b: any) => b.relevance_score - a.relevance_score);
    const selected = scored.slice(0, maxResults);
    const avgConfidence = Object.values(dimensions).reduce((sum, d) => sum + d.confidence, 0) / Object.keys(dimensions).length;

    return res(true, {
      dimensions,
      domain_matches: domainResult.matches,
      overall_confidence: Math.round(avgConfidence * 100) / 100,
      primary_prompt: selected[0] ?? null,
      overlay_prompts: selected.slice(1, 4),
      all_matches: selected,
      total_candidates: rows.results.length,
      recommendation: selected.length > 0
        ? `Use "${selected[0]?.name}" as primary, with ${Math.min(3, selected.length - 1)} overlays`
        : 'No matching prompts. Try POST /generate.',
    });
  } catch (err: any) {
    return res(false, undefined, err.message, 500);
  }
});

// ─── Combine ────────────────────────────────────────────────────────────────

app.post('/combine', async (c) => {
  try {
    const db = c.env.DB;
    const body = await c.req.json<{ prompt_ids: string[]; name?: string; strategy?: 'merge' | 'layer' | 'deduplicate' }>();
    if (!body.prompt_ids || body.prompt_ids.length < 2 || body.prompt_ids.length > 5) return res(false, undefined, 'prompt_ids must contain 2-5 IDs', 400);

    const placeholders = body.prompt_ids.map(() => '?').join(',');
    const rows = await db.prepare(`SELECT id, name, domain, content, tags, line_count FROM prompts WHERE id IN (${placeholders}) AND status='active'`).bind(...body.prompt_ids).all();
    if (rows.results.length < 2) return res(false, undefined, `Only ${rows.results.length} of ${body.prompt_ids.length} found`, 404);

    const strategy = body.strategy ?? 'merge';
    const sources = rows.results as any[];
    const allDomains = [...new Set(sources.map((s) => s.domain))];
    const allTags = [...new Set(sources.flatMap((s) => JSON.parse(s.tags || '[]')))];

    let combinedContent: string;
    if (strategy === 'layer') {
      combinedContent = sources.map((s, i) => `${'═'.repeat(80)}\nLAYER ${i + 1}: ${s.name} (${s.domain})\n${'═'.repeat(80)}\n\n${s.content}`).join('\n\n');
    } else if (strategy === 'deduplicate') {
      const seenHeadings = new Set<string>();
      const sections: string[] = [];
      for (const s of sources) {
        const parts = s.content.split(/^(#{1,3}\s+.+)$/m);
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i].trim();
          if (part.startsWith('#')) {
            const key = part.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (seenHeadings.has(key)) continue;
            seenHeadings.add(key);
            sections.push(part);
            if (i + 1 < parts.length) sections.push(parts[i + 1]);
          } else if (i === 0 && part.length > 0) {
            sections.push(part);
          }
        }
      }
      combinedContent = sections.join('\n\n');
    } else {
      combinedContent = `# COMBINED PROMPT\n# Sources: ${sources.map((s) => s.name).join(', ')}\n# Generated: ${new Date().toISOString()}\n\n`;
      combinedContent += sources.map((s) => `---\n## FROM: ${s.name} (${s.domain})\n---\n\n${s.content}`).join('\n\n');
    }

    const stats = computeStats(combinedContent);
    const contentHash = await sha256(combinedContent);
    const qualityScore = computeQualityScore(combinedContent, stats);
    const combinedName = body.name ?? `Combined: ${sources.map((s) => s.name).slice(0, 3).join(' + ')}`;
    const id = crypto.randomUUID();
    const slug = uniqueSlug(combinedName);
    const metadata = JSON.stringify({ combined_from: body.prompt_ids, strategy, source_names: sources.map((s) => s.name), source_domains: allDomains });

    await db.batch([
      db.prepare(`INSERT INTO prompts (id, name, slug, domain, category, description, content, content_hash, version, quality_tier, quality_score, line_count, word_count, char_count, tags, metadata, source, status) VALUES (?, ?, ?, ?, 'combined', ?, ?, ?, 1, 'sovereign', ?, ?, ?, ?, ?, ?, 'combine', 'active')`)
        .bind(id, combinedName, slug, allDomains[0] ?? 'general', `Combined ${sources.length} prompts (${strategy})`, combinedContent, contentHash, qualityScore, stats.line_count, stats.word_count, stats.char_count, JSON.stringify([...allTags, 'combined']), metadata),
      db.prepare(`INSERT INTO prompt_versions (id, prompt_id, version, content, content_hash, changelog, created_by) VALUES (?, ?, 1, ?, ?, ?, 'combine-api')`)
        .bind(crypto.randomUUID(), id, combinedContent, contentHash, `Combined: ${body.prompt_ids.join(', ')}`),
    ]);

    await invalidateCache(c.env.CACHE);
    await logChange(db, 'prompt', id, 'combine', `Combined ${sources.length} prompts (${strategy}) → ${stats.line_count} lines`);
    return res(true, { id, name: combinedName, slug, strategy, quality_score: qualityScore, sources: sources.map((s) => ({ id: s.id, name: s.name, domain: s.domain, lines: s.line_count })), combined_stats: stats, domains: allDomains, tags: [...allTags, 'combined'] }, undefined, 201);
  } catch (err: any) {
    return res(false, undefined, err.message, 500);
  }
});

// ─── AI Generate ────────────────────────────────────────────────────────────

app.post('/generate', async (c) => {
  try {
    const body = await c.req.json<{ task_description: string; domain?: string; quality_tier?: string; save?: boolean }>();
    if (!body.task_description) return res(false, undefined, 'task_description is required', 400);

    const domain = body.domain ?? inferDomain(body.task_description).domain;
    const qualityTier = body.quality_tier ?? 'sovereign';
    const systemPrompt = `You are the Sovereign Arcanum — the world's most advanced megaprompt generator.
Generate a comprehensive, production-ready system prompt/megaprompt for the given task.

MANDATORY SECTIONS:
1. ## Identity & Core Rules
2. ## Architecture Blueprint (with ASCII diagrams)
3. ## Feature Specification (numbered, detailed)
4. ## Code Patterns (TypeScript or Python examples)
5. ## Error Handling & Resilience
6. ## Quality Gates & Anti-Patterns
7. ## Deployment & Monitoring
8. ## Response Format

REQUIREMENTS:
- Use markdown with clear ## sections and ### subsections
- Include code examples (TypeScript/Python) with real patterns, not pseudocode
- Add tables for configuration, routing, or comparison data
- Include anti-patterns section (things NOT to do)
- Target 500-2000 lines of expert-level content
- Domain: ${domain} | Quality: ${qualityTier}
- Be specific and actionable — no vague guidelines

Output ONLY the megaprompt content.`;

    const aiResult = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate a sovereign megaprompt for: ${body.task_description}` },
      ],
      max_tokens: 4096,
    }) as { response?: string };

    const generatedContent = aiResult.response ?? '';
    if (!generatedContent || generatedContent.length < 100) return res(false, undefined, 'AI generation produced insufficient content', 500);

    const stats = computeStats(generatedContent);
    const contentHash = await sha256(generatedContent);
    const qualityScore = computeQualityScore(generatedContent, stats);
    const result: Record<string, unknown> = { content: generatedContent, domain, quality_tier: qualityTier, quality_score: qualityScore, content_hash: contentHash, stats, model: '@cf/meta/llama-3.1-8b-instruct' };

    if (body.save !== false) {
      const db = c.env.DB;
      const id = crypto.randomUUID();
      const name = `Generated: ${body.task_description.substring(0, 80)}`;
      const slug = uniqueSlug(name);
      const tags = JSON.stringify(['generated', 'ai', domain]);
      const metadata = JSON.stringify({ generated_from: body.task_description, model: '@cf/meta/llama-3.1-8b-instruct', generated_at: new Date().toISOString() });

      await db.batch([
        db.prepare(`INSERT INTO prompts (id, name, slug, domain, category, description, content, content_hash, version, quality_tier, quality_score, line_count, word_count, char_count, tags, metadata, source, status) VALUES (?, ?, ?, ?, 'generated', ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, 'ai-generate', 'active')`)
          .bind(id, name, slug, domain, `AI-generated for: ${body.task_description.substring(0, 200)}`, generatedContent, contentHash, qualityTier, qualityScore, stats.line_count, stats.word_count, stats.char_count, tags, metadata),
        db.prepare(`INSERT INTO prompt_versions (id, prompt_id, version, content, content_hash, changelog, created_by) VALUES (?, ?, 1, ?, ?, 'AI-generated', 'workers-ai')`)
          .bind(crypto.randomUUID(), id, generatedContent, contentHash),
      ]);

      await invalidateCache(c.env.CACHE);
      await logChange(db, 'prompt', id, 'generate', `AI-generated: ${name} (${stats.line_count} lines, quality ${qualityScore})`);
      c.executionCtx.waitUntil(postToMoltBook(c.env.SWARM_BRAIN, `AI-generated prompt "${name}" (${domain}, ${stats.line_count} lines, quality ${qualityScore}/100)`, 'excited', ['generate', domain]));
      result.saved = true;
      result.id = id;
      result.name = name;
      result.slug = slug;
    }

    return res(true, result, undefined, 201);
  } catch (err: any) {
    return res(false, undefined, err.message, 500);
  }
});

// ─── Recommendations ────────────────────────────────────────────────────────

app.get('/prompts/:id/recommendations', async (c) => {
  try {
    const db = c.env.DB;
    const id = c.req.param('id');
    const limit = Math.min(10, parseInt(c.req.query('limit') ?? '5'));

    const prompt = await db.prepare(`SELECT domain, category, tags, name FROM prompts WHERE id = ? AND status = 'active'`).bind(id).first();
    if (!prompt) return res(false, undefined, 'Prompt not found', 404);

    const p = prompt as any;
    const tags: string[] = JSON.parse(p.tags || '[]');

    // Find similar by domain + category + tag overlap
    const candidates = await db.prepare(`
      SELECT id, name, slug, domain, category, quality_score, line_count, tags, view_count
      FROM prompts WHERE status = 'active' AND id != ? AND (domain = ? OR category = ?)
      ORDER BY quality_score DESC LIMIT ?
    `).bind(id, p.domain, p.category, limit * 3).all();

    const scored = candidates.results.map((c: any) => {
      const cTags: string[] = JSON.parse(c.tags || '[]');
      const tagOverlap = tags.filter((t) => cTags.includes(t)).length;
      let score = 0;
      if (c.domain === p.domain) score += 3;
      if (c.category === p.category) score += 2;
      score += tagOverlap;
      score += (c.quality_score ?? 0) / 50;
      return { ...c, tags: cTags, similarity_score: Math.round(score * 100) / 100 };
    });

    scored.sort((a: any, b: any) => b.similarity_score - a.similarity_score);
    return res(true, { prompt_id: id, prompt_name: p.name, recommendations: scored.slice(0, limit) });
  } catch (err: any) {
    return res(false, undefined, err.message, 500);
  }
});

// ─── Validate Prompt Quality ────────────────────────────────────────────────

app.post('/validate', async (c) => {
  try {
    const body = await c.req.json<{ content: string }>();
    if (!body.content) return res(false, undefined, 'content is required', 400);

    const stats = computeStats(body.content);
    const qualityScore = computeQualityScore(body.content, stats);
    const content = body.content;
    const lower = content.toLowerCase();

    // Section detection
    const sections: Record<string, boolean> = {
      identity: /#{1,3}\s*(identity|who|role|persona)/i.test(content),
      rules: /#{1,3}\s*(rules?|guidelines?|principles?|policy)/i.test(content),
      architecture: /#{1,3}\s*(architect|design|system|blueprint)/i.test(content),
      features: /#{1,3}\s*(feature|capability|function|endpoint)/i.test(content),
      error_handling: /#{1,3}\s*(error|exception|fallback|resilience)/i.test(content),
      testing: /#{1,3}\s*(test|qa|validation|verification)/i.test(content),
      deployment: /#{1,3}\s*(deploy|release|ship|launch)/i.test(content),
      security: /#{1,3}\s*(security|auth|hardening|firewall)/i.test(content),
      anti_patterns: /#{1,3}\s*(anti.?pattern|don'?t|avoid|never)/i.test(content),
      code_examples: /```[\s\S]*?```/.test(content),
    };

    const sectionCount = Object.values(sections).filter(Boolean).length;
    const headingCount = (content.match(/^#{1,3}\s+/gm) || []).length;
    const codeBlockCount = (content.match(/```/g) || []).length / 2;
    const tableCount = (content.match(/\|.*\|.*\|/g) || []).length;

    // Issues
    const issues: string[] = [];
    if (stats.line_count < 50) issues.push('Too short — sovereign prompts should be 500+ lines');
    if (headingCount < 3) issues.push('Insufficient structure — add more ## section headings');
    if (codeBlockCount < 1) issues.push('No code examples — add ``` code blocks with real patterns');
    if (!sections.identity) issues.push('Missing identity/role section');
    if (!sections.rules) issues.push('Missing rules/guidelines section');
    if (!sections.error_handling) issues.push('Missing error handling section');
    if (!sections.anti_patterns) issues.push('Missing anti-patterns section');
    if (lower.includes('todo') || lower.includes('placeholder') || lower.includes('tbd')) issues.push('Contains TODO/placeholder markers');
    if (/\b(you should|consider|maybe|perhaps)\b/i.test(content)) issues.push('Contains vague language — be specific and actionable');

    const grade = qualityScore >= 80 ? 'S' : qualityScore >= 60 ? 'A' : qualityScore >= 40 ? 'B' : qualityScore >= 20 ? 'C' : 'D';

    return res(true, {
      quality_score: qualityScore,
      grade,
      stats,
      sections,
      section_coverage: `${sectionCount}/${Object.keys(sections).length}`,
      structure: { headings: headingCount, code_blocks: codeBlockCount, tables: tableCount },
      issues,
      issue_count: issues.length,
      verdict: issues.length === 0 ? 'Sovereign quality — ready for production' : issues.length <= 2 ? 'Good quality — minor improvements suggested' : 'Needs work — address issues before deployment',
    });
  } catch (err: any) {
    return res(false, undefined, err.message, 500);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// PROMPT FRAGMENTS — REUSABLE BLOCKS
// ═══════════════════════════════════════════════════════════════════════════

app.get('/fragments', async (c) => {
  try {
    const domain = c.req.query('domain');
    let sql = `SELECT * FROM prompt_fragments WHERE status = 'active'`;
    const params: unknown[] = [];
    if (domain) { sql += ` AND domain = ?`; params.push(domain); }
    sql += ` ORDER BY usage_count DESC, created_at DESC LIMIT 100`;
    const rows = await c.env.DB.prepare(sql).bind(...params).all();
    return res(true, { fragments: rows.results.map((r: any) => ({ ...r, tags: JSON.parse(r.tags || '[]') })), count: rows.results.length });
  } catch (err: any) {
    return res(false, undefined, err.message, 500);
  }
});

app.post('/fragments', async (c) => {
  try {
    const db = c.env.DB;
    const body = await c.req.json<FragmentInput>();
    if (!body.name || !body.content) return res(false, undefined, 'name and content are required', 400);

    const id = crypto.randomUUID();
    const slug = uniqueSlug(body.name);
    const contentHash = await sha256(body.content);
    const tags = JSON.stringify(body.tags ?? []);

    await db.prepare(`INSERT INTO prompt_fragments (id, name, slug, domain, description, content, content_hash, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(id, body.name, slug, body.domain ?? 'general', body.description ?? null, body.content, contentHash, tags).run();

    await logChange(db, 'fragment', id, 'create', `Created fragment: ${body.name}`);
    log('info', 'Fragment created', { id, name: body.name });
    return res(true, { id, name: body.name, slug, content_hash: contentHash }, undefined, 201);
  } catch (err: any) {
    return res(false, undefined, err.message, 500);
  }
});

app.get('/fragments/:id', async (c) => {
  try {
    const row = await c.env.DB.prepare(`SELECT * FROM prompt_fragments WHERE id = ? AND status = 'active'`).bind(c.req.param('id')).first();
    if (!row) return res(false, undefined, 'Fragment not found', 404);
    return res(true, { ...(row as any), tags: JSON.parse((row as any).tags || '[]') });
  } catch (err: any) {
    return res(false, undefined, err.message, 500);
  }
});

app.delete('/fragments/:id', async (c) => {
  try {
    await c.env.DB.prepare(`UPDATE prompt_fragments SET status = 'archived', updated_at = datetime('now') WHERE id = ?`).bind(c.req.param('id')).run();
    return res(true, { id: c.req.param('id'), status: 'archived' });
  } catch (err: any) {
    return res(false, undefined, err.message, 500);
  }
});

// ─── Compose: Assemble prompt from fragments ────────────────────────────────

app.post('/compose', async (c) => {
  try {
    const db = c.env.DB;
    const body = await c.req.json<{ fragment_ids: string[]; name?: string; separator?: string }>();
    if (!body.fragment_ids?.length) return res(false, undefined, 'fragment_ids array is required', 400);

    const placeholders = body.fragment_ids.map(() => '?').join(',');
    const rows = await db.prepare(`SELECT id, name, content FROM prompt_fragments WHERE id IN (${placeholders}) AND status = 'active'`).bind(...body.fragment_ids).all();

    if (rows.results.length === 0) return res(false, undefined, 'No fragments found', 404);

    // Maintain order as specified
    const fragmentMap = new Map(rows.results.map((r: any) => [r.id, r]));
    const orderedFragments = body.fragment_ids.map((id) => fragmentMap.get(id)).filter(Boolean) as any[];
    const separator = body.separator ?? '\n\n---\n\n';
    const composed = orderedFragments.map((f) => `## ${f.name}\n\n${f.content}`).join(separator);

    // Increment usage counts
    const stmts = body.fragment_ids.map((id) => db.prepare(`UPDATE prompt_fragments SET usage_count = usage_count + 1 WHERE id = ?`).bind(id));
    if (stmts.length > 0) c.executionCtx.waitUntil(db.batch(stmts));

    const stats = computeStats(composed);
    return res(true, {
      composed_content: composed,
      stats,
      fragments_used: orderedFragments.map((f) => ({ id: f.id, name: f.name })),
      name: body.name ?? `Composed: ${orderedFragments.map((f) => f.name).slice(0, 3).join(' + ')}`,
    });
  } catch (err: any) {
    return res(false, undefined, err.message, 500);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// PROMPT CHAINS — SEQUENTIAL PIPELINES
// ═══════════════════════════════════════════════════════════════════════════

app.get('/chains', async (c) => {
  try {
    const rows = await c.env.DB.prepare(`SELECT c.*, (SELECT COUNT(*) FROM prompt_chain_steps WHERE chain_id = c.id) as step_count FROM prompt_chains c WHERE c.status = 'active' ORDER BY c.created_at DESC LIMIT 50`).all();
    return res(true, { chains: rows.results, count: rows.results.length });
  } catch (err: any) {
    return res(false, undefined, err.message, 500);
  }
});

app.post('/chains', async (c) => {
  try {
    const db = c.env.DB;
    const body = await c.req.json<ChainInput>();
    if (!body.name || !body.steps?.length) return res(false, undefined, 'name and steps are required', 400);

    const chainId = crypto.randomUUID();
    const slug = uniqueSlug(body.name);
    const stmts: D1PreparedStatement[] = [
      db.prepare(`INSERT INTO prompt_chains (id, name, slug, description, domain, step_count) VALUES (?, ?, ?, ?, ?, ?)`)
        .bind(chainId, body.name, slug, body.description ?? null, body.domain ?? 'general', body.steps.length),
    ];

    for (let i = 0; i < body.steps.length; i++) {
      const step = body.steps[i];
      stmts.push(
        db.prepare(`INSERT INTO prompt_chain_steps (id, chain_id, step_order, prompt_id, transform, condition) VALUES (?, ?, ?, ?, ?, ?)`)
          .bind(crypto.randomUUID(), chainId, i + 1, step.prompt_id, step.transform ?? null, step.condition ?? null)
      );
    }

    await db.batch(stmts);
    await logChange(db, 'chain', chainId, 'create', `Created chain: ${body.name} (${body.steps.length} steps)`);
    log('info', 'Chain created', { id: chainId, name: body.name, steps: body.steps.length });
    return res(true, { id: chainId, name: body.name, slug, step_count: body.steps.length }, undefined, 201);
  } catch (err: any) {
    return res(false, undefined, err.message, 500);
  }
});

app.get('/chains/:id', async (c) => {
  try {
    const db = c.env.DB;
    const id = c.req.param('id');
    const chain = await db.prepare(`SELECT * FROM prompt_chains WHERE id = ?`).bind(id).first();
    if (!chain) return res(false, undefined, 'Chain not found', 404);

    const steps = await db.prepare(`
      SELECT s.*, p.name as prompt_name, p.domain as prompt_domain, p.quality_score as prompt_quality
      FROM prompt_chain_steps s JOIN prompts p ON s.prompt_id = p.id
      WHERE s.chain_id = ? ORDER BY s.step_order
    `).bind(id).all();

    return res(true, { ...chain, steps: steps.results });
  } catch (err: any) {
    return res(false, undefined, err.message, 500);
  }
});

app.delete('/chains/:id', async (c) => {
  try {
    const db = c.env.DB;
    const id = c.req.param('id');
    await db.batch([
      db.prepare(`DELETE FROM prompt_chain_steps WHERE chain_id = ?`).bind(id),
      db.prepare(`UPDATE prompt_chains SET status = 'archived' WHERE id = ?`).bind(id),
    ]);
    return res(true, { id, status: 'archived' });
  } catch (err: any) {
    return res(false, undefined, err.message, 500);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// DEPENDENCIES
// ═══════════════════════════════════════════════════════════════════════════

app.post('/prompts/:id/dependencies', async (c) => {
  try {
    const db = c.env.DB;
    const id = c.req.param('id');
    const body = await c.req.json<{ depends_on_id: string; type?: string }>();
    if (!body.depends_on_id) return res(false, undefined, 'depends_on_id is required', 400);
    if (id === body.depends_on_id) return res(false, undefined, 'Cannot depend on self', 400);

    const depId = crypto.randomUUID();
    await db.prepare(`INSERT INTO prompt_dependencies (id, prompt_id, depends_on_id, dependency_type) VALUES (?, ?, ?, ?)`)
      .bind(depId, id, body.depends_on_id, body.type ?? 'references').run();
    return res(true, { id: depId }, undefined, 201);
  } catch (err: any) {
    return res(false, undefined, err.message, 500);
  }
});

app.get('/prompts/:id/dependencies', async (c) => {
  try {
    const db = c.env.DB;
    const id = c.req.param('id');
    const [deps, dependents] = await Promise.all([
      db.prepare(`SELECT d.*, p.name, p.domain FROM prompt_dependencies d JOIN prompts p ON d.depends_on_id = p.id WHERE d.prompt_id = ?`).bind(id).all(),
      db.prepare(`SELECT d.*, p.name, p.domain FROM prompt_dependencies d JOIN prompts p ON d.prompt_id = p.id WHERE d.depends_on_id = ?`).bind(id).all(),
    ]);
    return res(true, { depends_on: deps.results, depended_on_by: dependents.results });
  } catch (err: any) {
    return res(false, undefined, err.message, 500);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// A/B TESTING — THOMPSON SAMPLING
// ═══════════════════════════════════════════════════════════════════════════

app.post('/ab-test', async (c) => {
  try {
    const db = c.env.DB;
    const body = await c.req.json<{ prompt_a_id: string; prompt_b_id: string; metric?: string }>();
    if (!body.prompt_a_id || !body.prompt_b_id) return res(false, undefined, 'prompt_a_id and prompt_b_id required', 400);

    const [a, b] = await Promise.all([
      db.prepare(`SELECT id, name FROM prompts WHERE id = ? AND status='active'`).bind(body.prompt_a_id).first(),
      db.prepare(`SELECT id, name FROM prompts WHERE id = ? AND status='active'`).bind(body.prompt_b_id).first(),
    ]);
    if (!a) return res(false, undefined, `Prompt A not found`, 404);
    if (!b) return res(false, undefined, `Prompt B not found`, 404);

    const id = crypto.randomUUID();
    await db.prepare(`INSERT INTO ab_tests (id, prompt_a_id, prompt_b_id, metric, status) VALUES (?, ?, ?, ?, 'active')`)
      .bind(id, body.prompt_a_id, body.prompt_b_id, body.metric ?? 'rating').run();
    await logChange(db, 'ab_test', id, 'create', `A/B test: ${(a as any).name} vs ${(b as any).name}`);
    return res(true, { id, prompt_a: a, prompt_b: b, metric: body.metric ?? 'rating', status: 'active' }, undefined, 201);
  } catch (err: any) {
    return res(false, undefined, err.message, 500);
  }
});

app.get('/ab-test/:id', async (c) => {
  try {
    const test = await c.env.DB.prepare(`SELECT * FROM ab_tests WHERE id = ?`).bind(c.req.param('id')).first();
    if (!test) return res(false, undefined, 'A/B test not found', 404);
    const t = test as any;
    const rateA = t.impressions_a > 0 ? t.successes_a / t.impressions_a : 0;
    const rateB = t.impressions_b > 0 ? t.successes_b / t.impressions_b : 0;
    let significant = false;
    let zScore = 0;
    if (t.impressions_a >= 30 && t.impressions_b >= 30) {
      const seA = Math.sqrt(rateA * (1 - rateA) / t.impressions_a);
      const seB = Math.sqrt(rateB * (1 - rateB) / t.impressions_b);
      const seCombined = Math.sqrt(seA * seA + seB * seB);
      if (seCombined > 0) { zScore = Math.abs(rateA - rateB) / seCombined; significant = zScore > 1.96; }
    }
    return res(true, {
      ...t,
      analysis: {
        rate_a: Math.round(rateA * 10000) / 100,
        rate_b: Math.round(rateB * 10000) / 100,
        z_score: Math.round(zScore * 100) / 100,
        significant,
        suggested_winner: rateA > rateB ? 'a' : rateB > rateA ? 'b' : 'tie',
        needs_more_data: t.impressions_a < 30 || t.impressions_b < 30,
      },
    });
  } catch (err: any) {
    return res(false, undefined, err.message, 500);
  }
});

app.post('/ab-test/:id/record', async (c) => {
  try {
    const db = c.env.DB;
    const id = c.req.param('id');
    const body = await c.req.json<{ variant: 'a' | 'b'; success: boolean }>();
    if (!body.variant || !['a', 'b'].includes(body.variant)) return res(false, undefined, 'variant must be "a" or "b"', 400);

    const test = await db.prepare(`SELECT * FROM ab_tests WHERE id = ? AND status='active'`).bind(id).first();
    if (!test) return res(false, undefined, 'Active A/B test not found', 404);

    const impCol = body.variant === 'a' ? 'impressions_a' : 'impressions_b';
    const sucCol = body.variant === 'a' ? 'successes_a' : 'successes_b';
    const stmts: D1PreparedStatement[] = [db.prepare(`UPDATE ab_tests SET ${impCol} = ${impCol} + 1 WHERE id = ?`).bind(id)];
    if (body.success) stmts.push(db.prepare(`UPDATE ab_tests SET ${sucCol} = ${sucCol} + 1 WHERE id = ?`).bind(id));
    await db.batch(stmts);
    return res(true, { recorded: true, variant: body.variant, success: body.success });
  } catch (err: any) {
    return res(false, undefined, err.message, 500);
  }
});

app.get('/ab-tests', async (c) => {
  try {
    const status = c.req.query('status') ?? 'active';
    const rows = await c.env.DB.prepare(`SELECT * FROM ab_tests WHERE status = ? ORDER BY created_at DESC LIMIT 50`).bind(status).all();
    return res(true, { tests: rows.results, count: rows.results.length });
  } catch (err: any) {
    return res(false, undefined, err.message, 500);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// WEBHOOKS
// ═══════════════════════════════════════════════════════════════════════════

app.get('/webhooks', async (c) => {
  try {
    const rows = await c.env.DB.prepare(`SELECT id, url, events, status, failure_count, last_triggered, created_at FROM prompt_webhooks ORDER BY created_at DESC`).all();
    // C15 fix: Redact any secret field that might leak through schema changes
    const sanitized = rows.results.map((w: any) => {
      const { secret, ...safe } = w;
      if (secret !== undefined) safe.secret = '[REDACTED]';
      return safe;
    });
    return res(true, { webhooks: sanitized });
  } catch (err: any) {
    return res(false, undefined, err.message, 500);
  }
});

app.post('/webhooks', async (c) => {
  try {
    const body = await c.req.json<{ url: string; events?: string[]; secret?: string }>();
    if (!body.url) return res(false, undefined, 'url is required', 400);
    const id = crypto.randomUUID();
    await c.env.DB.prepare(`INSERT INTO prompt_webhooks (id, url, events, secret) VALUES (?, ?, ?, ?)`)
      .bind(id, body.url, JSON.stringify(body.events ?? ['create', 'update', 'delete']), body.secret ?? null).run();
    return res(true, { id, url: body.url }, undefined, 201);
  } catch (err: any) {
    return res(false, undefined, err.message, 500);
  }
});

app.delete('/webhooks/:id', async (c) => {
  try {
    await c.env.DB.prepare(`DELETE FROM prompt_webhooks WHERE id = ?`).bind(c.req.param('id')).run();
    return res(true, { deleted: true });
  } catch (err: any) {
    return res(false, undefined, err.message, 500);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// IMPORT / EXPORT
// ═══════════════════════════════════════════════════════════════════════════

app.get('/export', async (c) => {
  try {
    const db = c.env.DB;
    const domain = c.req.query('domain');
    let sql = `SELECT * FROM prompts WHERE status = 'active'`;
    const params: unknown[] = [];
    if (domain) { sql += ` AND domain = ?`; params.push(domain); }
    sql += ` ORDER BY domain, name`;
    const rows = await db.prepare(sql).bind(...params).all();

    const exportData = {
      version: '3.0.0',
      exported_at: new Date().toISOString(),
      prompt_count: rows.results.length,
      prompts: rows.results.map((r: any) => ({
        name: r.name,
        domain: r.domain,
        category: r.category,
        description: r.description,
        content: r.content,
        quality_tier: r.quality_tier,
        tags: JSON.parse(r.tags || '[]'),
        metadata: JSON.parse(r.metadata || '{}'),
        source: r.source,
        file_path: r.file_path,
      })),
    };

    return new Response(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="arcanum-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (err: any) {
    return res(false, undefined, err.message, 500);
  }
});

app.post('/import', async (c) => {
  try {
    const body = await c.req.json<{ prompts: PromptInput[]; skip_duplicates?: boolean }>();
    if (!body.prompts?.length) return res(false, undefined, 'prompts array is required', 400);

    // Delegate to bulk-ingest logic
    const db = c.env.DB;
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const p of body.prompts) {
      try {
        if (!p.name || !p.content) { skipped++; continue; }
        const contentHash = await sha256(p.content);
        if (body.skip_duplicates !== false) {
          const existing = await db.prepare(`SELECT id FROM prompts WHERE content_hash = ? AND status = 'active' LIMIT 1`).bind(contentHash).first();
          if (existing) { skipped++; continue; }
        }
        const id = crypto.randomUUID();
        const slug = uniqueSlug(p.name);
        const stats = computeStats(p.content);
        const qualityScore = computeQualityScore(p.content, stats);

        await db.batch([
          db.prepare(`INSERT INTO prompts (id, name, slug, domain, category, description, content, content_hash, version, quality_tier, quality_score, line_count, word_count, char_count, tags, metadata, source, file_path, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, 'import', ?, 'active')`)
            .bind(id, p.name, slug, p.domain ?? 'general', p.category ?? 'general', p.description ?? null, p.content, contentHash, p.quality_tier ?? 'sovereign', qualityScore, stats.line_count, stats.word_count, stats.char_count, JSON.stringify(p.tags ?? []), JSON.stringify(p.metadata ?? {}), p.file_path ?? null),
          db.prepare(`INSERT INTO prompt_versions (id, prompt_id, version, content, content_hash, changelog, created_by) VALUES (?, ?, 1, ?, ?, 'Imported', 'import')`)
            .bind(crypto.randomUUID(), id, p.content, contentHash),
        ]);
        imported++;
      } catch (err: any) {
        errors.push(`${p.name}: ${err.message}`);
      }
    }

    await invalidateCache(c.env.CACHE);
    if (imported > 0) {
      await logChange(db, 'prompts', 'import', 'import', `Imported ${imported} prompts (${skipped} skipped)`);
    }
    return res(true, { imported, skipped, errors: errors.slice(0, 10) });
  } catch (err: any) {
    return res(false, undefined, err.message, 500);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// MARKETPLACE
// ═══════════════════════════════════════════════════════════════════════════

app.get('/marketplace', async (c) => {
  try {
    const db = c.env.DB;
    const cache = c.env.CACHE;
    const url = new URL(c.req.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'));
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') ?? '20')));
    const offset = (page - 1) * limit;
    const domain = url.searchParams.get('domain');
    const sort = url.searchParams.get('sort') ?? 'quality';

    const cacheKey = `cache:marketplace:${page}:${limit}:${domain}:${sort}`;
    const cached = await cache.get(cacheKey);
    if (cached) return res(true, JSON.parse(cached));

    let where = `WHERE p.status = 'active'`;
    const params: unknown[] = [];
    if (domain) { where += ` AND p.domain = ?`; params.push(domain); }

    const orderMap: Record<string, string> = {
      popular: 'usage_count DESC, p.view_count DESC',
      recent: 'p.created_at DESC',
      lines: 'p.line_count DESC',
      quality: '(p.quality_score * 2 + COALESCE(usage_count, 0) * 10 + p.view_count * 0.1 + p.version * 5) DESC',
    };
    const orderBy = orderMap[sort] ?? orderMap.quality;

    const countResult = await db.prepare(`SELECT COUNT(*) as total FROM prompts p ${where}`).bind(...params).first<{ total: number }>();
    const total = countResult?.total ?? 0;

    const rows = await db.prepare(`
      SELECT p.id, p.name, p.slug, p.domain, p.category, p.description, p.quality_tier, p.quality_score,
        p.line_count, p.word_count, p.char_count, p.version, p.tags, p.source, p.view_count, p.fork_count,
        p.created_at, p.updated_at, COUNT(u.id) as usage_count, AVG(u.rating) as avg_rating
      FROM prompts p LEFT JOIN prompt_usage u ON p.id = u.prompt_id
      ${where} GROUP BY p.id ORDER BY ${orderBy} LIMIT ? OFFSET ?
    `).bind(...params, limit, offset).all();

    const data = {
      prompts: rows.results.map((r: any) => ({ ...r, tags: JSON.parse(r.tags || '[]'), avg_rating: r.avg_rating ? Math.round(r.avg_rating * 10) / 10 : null })),
      pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
      sort,
    };

    await cache.put(cacheKey, JSON.stringify(data), { expirationTtl: CACHE_TTL });
    return res(true, data);
  } catch (err: any) {
    return res(false, undefined, err.message, 500);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// AI QUALITY SCORING (on-demand)
// ═══════════════════════════════════════════════════════════════════════════

app.post('/prompts/:id/ai-score', async (c) => {
  try {
    const db = c.env.DB;
    const id = c.req.param('id');
    const prompt = await db.prepare(`SELECT name, content, domain FROM prompts WHERE id = ?`).bind(id).first<{ name: string; content: string; domain: string }>();
    if (!prompt) return res(false, undefined, 'Prompt not found', 404);

    const aiResult = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: `You are a prompt quality auditor. Score the following prompt on a scale of 0-100 across these dimensions:
1. Clarity (0-20): How clear and unambiguous is it?
2. Completeness (0-20): Does it cover all necessary sections?
3. Specificity (0-20): Are instructions actionable with real examples?
4. Structure (0-20): Is it well-organized with clear sections?
5. Production-Readiness (0-20): Could this be used as-is in production?

Respond with ONLY a JSON object: {"clarity":N,"completeness":N,"specificity":N,"structure":N,"production_readiness":N,"total":N,"summary":"one sentence assessment"}` },
        { role: 'user', content: `Score this prompt (domain: ${prompt.domain}):\n\n${prompt.content.substring(0, 3000)}` },
      ],
      max_tokens: 256,
    }) as { response?: string };

    try {
      const responseText = aiResult.response ?? '';
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const scores = JSON.parse(jsonMatch[0]);
        const total = scores.total ?? (scores.clarity + scores.completeness + scores.specificity + scores.structure + scores.production_readiness);
        await db.prepare(`UPDATE prompts SET quality_score = ?, updated_at = datetime('now') WHERE id = ?`).bind(total, id).run();
        await invalidateCache(c.env.CACHE);
        return res(true, { prompt_id: id, prompt_name: prompt.name, ai_scores: scores, total, model: '@cf/meta/llama-3.1-8b-instruct' });
      }
    } catch {
      // AI response parsing failed, use algorithmic score
    }

    const stats = computeStats(prompt.content);
    const algorithmicScore = computeQualityScore(prompt.content, stats);
    return res(true, { prompt_id: id, prompt_name: prompt.name, algorithmic_score: algorithmicScore, note: 'AI scoring failed, algorithmic fallback used' });
  } catch (err: any) {
    return res(false, undefined, err.message, 500);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// ROOT & 404
// ═══════════════════════════════════════════════════════════════════════════

app.get('/', (c) => {
  return res(true, {
    service: 'echo-arcanum',
    version: c.env.WORKER_VERSION,
    codename: 'The Arcanum',
    description: 'Sovereign prompt template library — store, select, combine, generate, chain, fragment, validate, A/B test, and deploy AI prompts at scale',
    features: [
      'SHA-256 content hashing + dedup',
      'Rate limiting (120 read/min, 30 write/min)',
      'Secret Sauce Firewall (24 attack patterns)',
      'Abuse detection (6 pattern categories)',
      'AI quality scoring (algorithmic + Workers AI)',
      '7-dimensional prompt selection',
      'Prompt fragments (reusable blocks)',
      'Prompt chains (sequential pipelines)',
      'Version diff + rollback',
      'A/B testing (Thompson Sampling)',
      'MoltBook + Shared Brain integration',
      'Webhook notifications (HMAC-SHA256)',
      'Bulk operations (update, archive, tag)',
      'Import/Export (JSON)',
      'Marketplace with quality ranking',
      'Recommendations engine',
      'Prompt validation + grading',
      'Domain taxonomy (20 domains)',
      'Tag cloud + analytics',
      'Changelog audit trail',
      'Forge DNA: 10-stage pipeline',
      'Forge DNA: 40-level evolution system',
      'Forge DNA: Multi-LLM competitive dispatch (8 providers)',
      'Forge DNA: Raistlin Wizard oversight',
      'Forge DNA: Self-improvement engine',
      'Forge DNA: R2 build output storage',
      'Forge DNA: LLM leaderboard tracking',
    ],
    endpoints: {
      health: ['GET /health', 'GET /stats'],
      prompts: ['GET /prompts', 'POST /prompts', 'GET /prompts/:id', 'PUT /prompts/:id', 'DELETE /prompts/:id', 'GET /prompts/by-slug/:slug'],
      discovery: ['GET /prompts/search?q=', 'GET /prompts/domains', 'GET /prompts/categories', 'POST /prompts/categories', 'GET /prompts/tags', 'GET /prompts/random', 'GET /prompts/dashboard', 'GET /taxonomy'],
      versions: ['GET /prompts/:id/versions', 'GET /prompts/:id/diff?from=N&to=M', 'POST /prompts/:id/rollback'],
      operations: ['POST /prompts/bulk-ingest', 'POST /prompts/bulk-update', 'POST /prompts/bulk-archive', 'POST /prompts/bulk-tag', 'GET /prompts/:id/export', 'POST /prompts/:id/fork', 'POST /prompts/:id/usage'],
      intelligence: ['POST /select', 'POST /combine', 'POST /generate', 'POST /validate', 'GET /prompts/:id/recommendations', 'POST /prompts/:id/ai-score'],
      fragments: ['GET /fragments', 'POST /fragments', 'GET /fragments/:id', 'DELETE /fragments/:id', 'POST /compose'],
      chains: ['GET /chains', 'POST /chains', 'GET /chains/:id', 'DELETE /chains/:id'],
      dependencies: ['POST /prompts/:id/dependencies', 'GET /prompts/:id/dependencies'],
      ab_testing: ['POST /ab-test', 'GET /ab-test/:id', 'POST /ab-test/:id/record', 'GET /ab-tests'],
      webhooks: ['GET /webhooks', 'POST /webhooks', 'DELETE /webhooks/:id'],
      io: ['GET /export', 'POST /import'],
      audit: ['GET /changelog'],
      marketplace: ['GET /marketplace'],
      forge: ['GET /forge/evolution', 'GET /forge/llm-leaderboard', 'GET /forge/projects', 'GET /forge/projects/:id', 'POST /forge/build', 'POST /forge/enhance', 'POST /forge/review', 'GET /forge/pipeline', 'POST /forge/evolve-check'],
    },
    auth: 'X-Echo-API-Key header required for POST/PUT/DELETE',
    total_endpoints: 59,
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// FORGE DNA — HEPHAESTION EVOLUTION, MULTI-LLM, PIPELINE, RAISTLIN
// ═══════════════════════════════════════════════════════════════════════════
// Full forge-core crown jewels: 40-level evolution, 8-provider competitive
// dispatch, Raistlin Wizard oversight, 11-gate quality system, 7 guilds,
// 20 enhancement techniques, 14 task types, 29-category enhancement matrix,
// prompt scoring (5 dimensions), llmSwarm competitive generation
// ═══════════════════════════════════════════════════════════════════════════

// ─── 40-Level Evolution System (5 Tiers) ──────────────────────────────────

const EVOLUTION_STAGES = [
  // BASIC Tier (1-10): Learning fundamentals
  { level: 1, name: 'NOVICE', tier: 'BASIC', successRate: 0.30, quality: 0.20 },
  { level: 2, name: 'INITIATE', tier: 'BASIC', successRate: 0.35, quality: 0.25 },
  { level: 3, name: 'APPRENTICE', tier: 'BASIC', successRate: 0.40, quality: 0.30 },
  { level: 4, name: 'STUDENT', tier: 'BASIC', successRate: 0.45, quality: 0.35 },
  { level: 5, name: 'JUNIOR', tier: 'BASIC', successRate: 0.50, quality: 0.40, perk: 'stage_skip' },
  { level: 6, name: 'PRACTITIONER', tier: 'BASIC', successRate: 0.55, quality: 0.45 },
  { level: 7, name: 'COMPETENT', tier: 'BASIC', successRate: 0.60, quality: 0.50 },
  { level: 8, name: 'SKILLED', tier: 'BASIC', successRate: 0.65, quality: 0.55 },
  { level: 9, name: 'ADEPT', tier: 'BASIC', successRate: 0.70, quality: 0.60 },
  { level: 10, name: 'PROFICIENT', tier: 'BASIC', successRate: 0.75, quality: 0.65, perk: 'parallel_stages' },
  // ADVANCED Tier (11-20): Building expertise
  { level: 11, name: 'SEASONED', tier: 'ADVANCED', successRate: 0.78, quality: 0.68 },
  { level: 12, name: 'SPECIALIST', tier: 'ADVANCED', successRate: 0.80, quality: 0.70 },
  { level: 13, name: 'EXPERT', tier: 'ADVANCED', successRate: 0.82, quality: 0.73 },
  { level: 14, name: 'AUTHORITY', tier: 'ADVANCED', successRate: 0.83, quality: 0.75 },
  { level: 15, name: 'MENTOR', tier: 'ADVANCED', successRate: 0.84, quality: 0.78, perk: 'cross_forge' },
  { level: 16, name: 'COMMANDER', tier: 'ADVANCED', successRate: 0.85, quality: 0.80 },
  { level: 17, name: 'STRATEGIST', tier: 'ADVANCED', successRate: 0.86, quality: 0.82 },
  { level: 18, name: 'VISIONARY', tier: 'ADVANCED', successRate: 0.87, quality: 0.84 },
  { level: 19, name: 'SAGE', tier: 'ADVANCED', successRate: 0.88, quality: 0.86 },
  { level: 20, name: 'PIONEER', tier: 'ADVANCED', successRate: 0.89, quality: 0.88, perk: 'adaptive_pipeline' },
  // MASTER Tier (21-30): Mastering the craft
  { level: 21, name: 'ARTISAN', tier: 'MASTER', successRate: 0.90, quality: 0.89 },
  { level: 22, name: 'VIRTUOSO', tier: 'MASTER', successRate: 0.90, quality: 0.90 },
  { level: 23, name: 'LUMINARY', tier: 'MASTER', successRate: 0.91, quality: 0.91 },
  { level: 24, name: 'PARAGON', tier: 'MASTER', successRate: 0.91, quality: 0.92 },
  { level: 25, name: 'PROPHET', tier: 'MASTER', successRate: 0.92, quality: 0.93, perk: 'swarm_6_plus' },
  { level: 26, name: 'ORACLE', tier: 'MASTER', successRate: 0.92, quality: 0.94 },
  { level: 27, name: 'SOVEREIGN', tier: 'MASTER', successRate: 0.93, quality: 0.95 },
  { level: 28, name: 'TITAN', tier: 'MASTER', successRate: 0.93, quality: 0.96 },
  { level: 29, name: 'LEGEND', tier: 'MASTER', successRate: 0.94, quality: 0.97 },
  { level: 30, name: 'COLOSSUS', tier: 'MASTER', successRate: 0.94, quality: 0.98, perk: 'auto_enhancement' },
  // ELITE Tier (31-37): Near perfection
  { level: 31, name: 'DEMIGOD', tier: 'ELITE', successRate: 0.95, quality: 0.98 },
  { level: 32, name: 'ARCHON', tier: 'ELITE', successRate: 0.95, quality: 0.98 },
  { level: 33, name: 'CELESTIAL', tier: 'ELITE', successRate: 0.96, quality: 0.99 },
  { level: 34, name: 'PRIMORDIAL', tier: 'ELITE', successRate: 0.96, quality: 0.99 },
  { level: 35, name: 'EMPEROR', tier: 'ELITE', successRate: 0.97, quality: 0.99, perk: 'self_optimization' },
  { level: 36, name: 'TRANSCENDENT', tier: 'ELITE', successRate: 0.97, quality: 0.99 },
  { level: 37, name: 'INFINITE', tier: 'ELITE', successRate: 0.98, quality: 1.0 },
  // TRINITY Tier (38-40): Commander approval gates
  { level: 38, name: 'TRINITY_THIRD', tier: 'TRINITY', successRate: 0.98, quality: 1.0, perk: 'teaching_mode', commanderGate: true },
  { level: 39, name: 'TRINITY_SECOND', tier: 'TRINITY', successRate: 0.99, quality: 1.0, perk: 'meta_forge', commanderGate: true },
  { level: 40, name: 'TRINITY_FIRST', tier: 'TRINITY', successRate: 0.99, quality: 1.0, perk: 'full_autonomy', commanderGate: true },
];

// ─── 10-Stage Arcanum Prompt Pipeline ─────────────────────────────────────

const ARCANUM_PIPELINE = [
  { stage: 1, name: 'Domain Analysis', guild: 'ARCHITECT', swarm: false, raistlin: false },
  { stage: 2, name: 'Template Structure', guild: 'ARCHITECT', swarm: true, raistlin: false },
  { stage: 3, name: 'Identity & Rules', guild: 'DOCS', swarm: false, raistlin: false },
  { stage: 4, name: 'Architecture Sections', guild: 'BACKEND', swarm: true, raistlin: true },
  { stage: 5, name: 'Code Examples', guild: 'BACKEND', swarm: true, raistlin: true },
  { stage: 6, name: 'Integration Sections', guild: 'BACKEND', swarm: false, raistlin: false },
  { stage: 7, name: 'Quality & Testing', guild: 'QUALITY', swarm: false, raistlin: false },
  { stage: 8, name: 'Scoring & Governance', guild: 'DOCS', swarm: false, raistlin: false },
  { stage: 9, name: 'Enhancement Sweep', guild: 'QUALITY', swarm: false, raistlin: true },
  { stage: 10, name: 'Assembly & Review', guild: 'DOCS', swarm: false, raistlin: true },
];

// ─── 7-Guild System ──────────────────────────────────────────────────────

const FORGE_GUILDS = {
  ARCHITECT: { name: 'Architect Guild', role: 'System design, domain analysis, structure', stages: [1, 2] },
  BACKEND: { name: 'Backend Guild', role: 'Code generation, API design, integration', stages: [4, 5, 6] },
  FRONTEND: { name: 'Frontend Guild', role: 'UI patterns, component design, UX', stages: [] },
  DATA: { name: 'Data Guild', role: 'Schema design, queries, data flows', stages: [] },
  QUALITY: { name: 'Quality Guild', role: 'Testing, gates, enhancement sweeps', stages: [7, 9] },
  INFRA: { name: 'Infrastructure Guild', role: 'Deployment, Workers, bindings', stages: [] },
  DOCS: { name: 'Documentation Guild', role: 'Identity, governance, assembly', stages: [3, 8, 10] },
};

// ─── 29-Category Enhancement Matrix ─────────────────────────────────────

const ENHANCEMENT_CATEGORIES = [
  // Pass 1: Foundations (no dependencies)
  { id: 'CAT1', name: 'Type Safety', pass: 1 },
  { id: 'CAT2', name: 'Error Handling', pass: 1 },
  { id: 'CAT3', name: 'Input Validation', pass: 1 },
  { id: 'CAT4', name: 'Authentication', pass: 1 },
  { id: 'CAT5', name: 'Secret Management', pass: 1 },
  // Pass 2: Architecture (depends on Pass 1)
  { id: 'CAT6', name: 'API Design', pass: 2 },
  { id: 'CAT7', name: 'Database Patterns', pass: 2 },
  { id: 'CAT8', name: 'Caching Strategy', pass: 2 },
  { id: 'CAT9', name: 'Service Bindings', pass: 2 },
  { id: 'CAT10', name: 'State Management', pass: 2 },
  // Pass 3: Performance (depends on Pass 2)
  { id: 'CAT11', name: 'Query Optimization', pass: 3 },
  { id: 'CAT12', name: 'Batch Operations', pass: 3 },
  { id: 'CAT13', name: 'Concurrent Processing', pass: 3 },
  { id: 'CAT14', name: 'Memory Efficiency', pass: 3 },
  { id: 'CAT15', name: 'Response Compression', pass: 3 },
  // Pass 4: UX & Integration (depends on Pass 3)
  { id: 'CAT16', name: 'Response Formatting', pass: 4 },
  { id: 'CAT17', name: 'Pagination & Filtering', pass: 4 },
  { id: 'CAT18', name: 'Webhook Integration', pass: 4 },
  { id: 'CAT19', name: 'Rate Limiting', pass: 4 },
  { id: 'CAT20', name: 'CORS & Headers', pass: 4 },
  // Pass 5: Documentation & Testing (depends on Pass 4)
  { id: 'CAT21', name: 'Health Endpoints', pass: 5 },
  { id: 'CAT22', name: 'Structured Logging', pass: 5 },
  { id: 'CAT23', name: 'Telemetry', pass: 5 },
  { id: 'CAT24', name: 'Test Coverage', pass: 5 },
  { id: 'CAT25', name: 'Documentation', pass: 5 },
  // Pass 6: Domain-Specific (depends on all prior)
  { id: 'CAT26', name: 'Domain Expertise', pass: 6 },
  { id: 'CAT27', name: 'AI/LLM Integration', pass: 6 },
  { id: 'CAT28', name: 'Security Hardening', pass: 6 },
  { id: 'CAT29', name: 'Compliance & Governance', pass: 6 },
];

// ─── 20 Prompt Enhancement Techniques ────────────────────────────────────

const ENHANCEMENT_TECHNIQUES = [
  { id: 'TREE_OF_THOUGHT', name: 'Tree of Thought', desc: 'Branch reasoning into parallel paths' },
  { id: 'CHAIN_OF_THOUGHT', name: 'Chain of Thought', desc: 'Step-by-step reasoning chain' },
  { id: 'FEW_SHOT', name: 'Few-Shot Examples', desc: 'Include concrete input→output pairs' },
  { id: 'ROLE_PLAYING', name: 'Role Playing', desc: 'Assign expert persona and domain context' },
  { id: 'CONSTRAINT_SETTING', name: 'Constraint Setting', desc: 'Define boundaries and limitations' },
  { id: 'META_PROMPTING', name: 'Meta Prompting', desc: 'Self-reflective instructions' },
  { id: 'SOCRATIC_METHOD', name: 'Socratic Method', desc: 'Question-driven exploration' },
  { id: 'SELF_CONSISTENCY', name: 'Self-Consistency', desc: 'Generate multiple paths, pick consensus' },
  { id: 'STRUCTURED_OUTPUT', name: 'Structured Output', desc: 'Force JSON/schema-constrained output' },
  { id: 'CONTEXT_WINDOW_OPT', name: 'Context Window Optimization', desc: 'Maximize info density' },
  { id: 'RECURSIVE_REFINEMENT', name: 'Recursive Refinement', desc: 'Iterative self-improvement loop' },
  { id: 'ADVERSARIAL_TESTING', name: 'Adversarial Testing', desc: 'Probe for failure modes' },
  { id: 'MULTI_PERSONA', name: 'Multi-Persona', desc: 'Debate between multiple expert voices' },
  { id: 'EMOTIONAL_PROMPTING', name: 'Emotional Prompting', desc: 'Inject urgency and importance' },
  { id: 'LOGICAL_FRAMEWORK', name: 'Logical Framework', desc: 'Formal reasoning structure' },
  { id: 'ANALOGICAL_REASONING', name: 'Analogical Reasoning', desc: 'Explain via parallel domains' },
  { id: 'TEMPORAL_REASONING', name: 'Temporal Reasoning', desc: 'Time-ordered thinking' },
  { id: 'CAUSAL_CHAIN', name: 'Causal Chain', desc: 'If-then consequence mapping' },
  { id: 'PRIORITY_HIERARCHY', name: 'Priority Hierarchy', desc: 'Weighted importance levels' },
  { id: 'ZERO_SHOT_COT', name: 'Zero-Shot CoT', desc: 'Let\'s think step by step' },
];

// ─── 14 Task Type Detection ──────────────────────────────────────────────

const TASK_TYPES: { id: string; name: string; patterns: RegExp[]; techniques: string[] }[] = [
  { id: 'code', name: 'Code Generation', patterns: [/\b(code|function|class|api|endpoint|worker|typescript|python|script)\b/i], techniques: ['STRUCTURED_OUTPUT', 'CONSTRAINT_SETTING', 'FEW_SHOT', 'CHAIN_OF_THOUGHT'] },
  { id: 'creative', name: 'Creative Writing', patterns: [/\b(write|story|creative|narrative|poem|blog|article)\b/i], techniques: ['ROLE_PLAYING', 'EMOTIONAL_PROMPTING', 'MULTI_PERSONA', 'TREE_OF_THOUGHT'] },
  { id: 'analysis', name: 'Analysis', patterns: [/\b(analy[sz]e|evaluate|assess|compare|review|audit)\b/i], techniques: ['CHAIN_OF_THOUGHT', 'LOGICAL_FRAMEWORK', 'ADVERSARIAL_TESTING', 'SELF_CONSISTENCY'] },
  { id: 'research', name: 'Research', patterns: [/\b(research|investigate|find|discover|explore|survey)\b/i], techniques: ['SOCRATIC_METHOD', 'TREE_OF_THOUGHT', 'ANALOGICAL_REASONING', 'META_PROMPTING'] },
  { id: 'task', name: 'Task Execution', patterns: [/\b(do|execute|perform|complete|implement|build|create|make)\b/i], techniques: ['CHAIN_OF_THOUGHT', 'PRIORITY_HIERARCHY', 'CONSTRAINT_SETTING', 'STRUCTURED_OUTPUT'] },
  { id: 'document', name: 'Documentation', patterns: [/\b(document|readme|guide|manual|specification|spec)\b/i], techniques: ['STRUCTURED_OUTPUT', 'CONTEXT_WINDOW_OPT', 'FEW_SHOT', 'PRIORITY_HIERARCHY'] },
  { id: 'data', name: 'Data Processing', patterns: [/\b(data|etl|pipeline|transform|process|parse|extract)\b/i], techniques: ['STRUCTURED_OUTPUT', 'CHAIN_OF_THOUGHT', 'CONSTRAINT_SETTING', 'LOGICAL_FRAMEWORK'] },
  { id: 'legal', name: 'Legal Analysis', patterns: [/\b(legal|law|statute|regulation|compliance|contract|liability)\b/i], techniques: ['LOGICAL_FRAMEWORK', 'CAUSAL_CHAIN', 'ADVERSARIAL_TESTING', 'PRIORITY_HIERARCHY'] },
  { id: 'financial', name: 'Financial Analysis', patterns: [/\b(financial|revenue|cost|profit|budget|investment|roi)\b/i], techniques: ['CHAIN_OF_THOUGHT', 'LOGICAL_FRAMEWORK', 'CAUSAL_CHAIN', 'STRUCTURED_OUTPUT'] },
  { id: 'oilfield', name: 'Oilfield Operations', patterns: [/\b(oil|gas|drilling|well|production|reservoir|completion)\b/i], techniques: ['ROLE_PLAYING', 'CHAIN_OF_THOUGHT', 'PRIORITY_HIERARCHY', 'TEMPORAL_REASONING'] },
  { id: 'tax', name: 'Tax Analysis', patterns: [/\b(tax|irc|deduction|depreciation|irs|1040|macrs)\b/i], techniques: ['LOGICAL_FRAMEWORK', 'CAUSAL_CHAIN', 'ADVERSARIAL_TESTING', 'CHAIN_OF_THOUGHT'] },
  { id: 'medical', name: 'Medical/Health', patterns: [/\b(medical|health|clinical|diagnosis|treatment|patient)\b/i], techniques: ['CHAIN_OF_THOUGHT', 'SELF_CONSISTENCY', 'CAUSAL_CHAIN', 'ADVERSARIAL_TESTING'] },
  { id: 'security', name: 'Security Analysis', patterns: [/\b(security|vulnerability|threat|exploit|pentest|osint)\b/i], techniques: ['ADVERSARIAL_TESTING', 'CAUSAL_CHAIN', 'TREE_OF_THOUGHT', 'PRIORITY_HIERARCHY'] },
  { id: 'conversation', name: 'Conversational AI', patterns: [/\b(chat|conversation|dialog|response|personality|bot)\b/i], techniques: ['ROLE_PLAYING', 'EMOTIONAL_PROMPTING', 'CONTEXT_WINDOW_OPT', 'META_PROMPTING'] },
];

// ─── Prompt Scoring (5 Dimensions) ──────────────────────────────────────

interface PromptScore {
  clarity: number;
  specificity: number;
  scope: number;
  actionability: number;
  context: number;
  total: number;
  grade: string;
}

function scorePrompt(content: string): PromptScore {
  const lines = content.split('\n');
  const words = content.split(/\s+/).length;
  const sections = (content.match(/^#{1,3}\s/gm) || []).length;
  const codeBlocks = (content.match(/```/g) || []).length / 2;
  const tables = (content.match(/\|.*\|/g) || []).length;
  const examples = (content.match(/\b(example|e\.g\.|for instance|such as)\b/gi) || []).length;
  const constraints = (content.match(/\b(must|never|always|require|shall|should not)\b/gi) || []).length;
  const specifics = (content.match(/\b\d+\b/g) || []).length;

  const clarity = Math.min(20, Math.round(
    (sections > 3 ? 5 : sections * 1.5) +
    (lines.length > 20 ? 5 : lines.length * 0.25) +
    (content.includes('## ') ? 5 : 0) +
    (words > 200 ? 5 : words * 0.025)
  ));

  const specificity = Math.min(20, Math.round(
    (codeBlocks * 3) +
    (examples * 2) +
    (specifics > 5 ? 5 : specifics) +
    (tables > 0 ? 5 : 0)
  ));

  const scope = Math.min(20, Math.round(
    (sections > 10 ? 10 : sections) +
    (words > 1000 ? 5 : words * 0.005) +
    (lines.length > 100 ? 5 : lines.length * 0.05)
  ));

  const actionability = Math.min(20, Math.round(
    (constraints * 1.5) +
    (codeBlocks * 2) +
    (content.includes('DO NOT') || content.includes('NEVER') ? 5 : 0) +
    (content.includes('MUST') || content.includes('ALWAYS') ? 5 : 0)
  ));

  const context = Math.min(20, Math.round(
    (content.includes('role') || content.includes('persona') ? 5 : 0) +
    (content.includes('domain') || content.includes('expertise') ? 5 : 0) +
    (content.includes('output') || content.includes('format') ? 5 : 0) +
    (content.includes('audience') || content.includes('user') ? 5 : 0)
  ));

  const total = clarity + specificity + scope + actionability + context;
  const grade = total >= 90 ? 'S' : total >= 80 ? 'A' : total >= 70 ? 'B' : total >= 60 ? 'C' : total >= 50 ? 'D' : 'F';

  return { clarity, specificity, scope, actionability, context, total, grade };
}

// ─── Task Type Detection ─────────────────────────────────────────────────

function detectTaskType(text: string): { type: string; confidence: number; techniques: string[] } {
  let bestMatch = { type: 'task', confidence: 0.3, techniques: ['CHAIN_OF_THOUGHT', 'STRUCTURED_OUTPUT'] };
  for (const tt of TASK_TYPES) {
    let score = 0;
    for (const pat of tt.patterns) {
      const matches = text.match(pat);
      if (matches) score += matches.length;
    }
    if (score > bestMatch.confidence * 10) {
      bestMatch = { type: tt.id, confidence: Math.min(1, score / 5), techniques: tt.techniques };
    }
  }
  return bestMatch;
}

// ─── 8-Provider LLM Configuration ───────────────────────────────────────

const LLM_PROVIDERS = [
  { id: 'workers-ai', name: 'Workers AI', model: '@cf/meta/llama-3.1-8b-instruct', costPer1k: 0, maxTokens: 4096, tier: 'free' },
  { id: 'workers-ai-lg', name: 'Workers AI Large', model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast', costPer1k: 0, maxTokens: 4096, tier: 'free' },
  { id: 'groq', name: 'Groq', model: 'llama-3.3-70b-versatile', costPer1k: 0.0006, maxTokens: 8192, tier: 'cheap', apiUrl: 'https://api.groq.com/openai/v1/chat/completions', envKey: 'GROQ_API_KEY' },
  { id: 'deepseek', name: 'DeepSeek', model: 'deepseek-chat', costPer1k: 0.0014, maxTokens: 8192, tier: 'cheap', apiUrl: 'https://api.deepseek.com/chat/completions', envKey: 'DEEPSEEK_API_KEY' },
  { id: 'together', name: 'Together', model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', costPer1k: 0.0009, maxTokens: 8192, tier: 'balanced', apiUrl: 'https://api.together.xyz/v1/chat/completions', envKey: 'TOGETHER_API_KEY' },
  { id: 'openrouter', name: 'OpenRouter', model: 'google/gemini-2.0-flash-001', costPer1k: 0.001, maxTokens: 8192, tier: 'balanced', apiUrl: 'https://openrouter.ai/api/v1/chat/completions', envKey: 'OPENROUTER_KEY' },
  { id: 'xai', name: 'xAI', model: 'grok-3-mini', costPer1k: 0.003, maxTokens: 8192, tier: 'premium', apiUrl: 'https://api.x.ai/v1/chat/completions', envKey: 'XAI_API_KEY' },
  { id: 'orchestrator', name: 'AI Orchestrator', model: 'gpt-4.1', costPer1k: 0, maxTokens: 8192, tier: 'fallback' },
] as const;

const LLM_TIMEOUT_MS = 12000;
const SWARM_TIMEOUT_MS = 25000;

// ─── 11-Gate Quality System ─────────────────────────────────────────────

interface QualityGate { name: string; passed: boolean; weight: number; details: string; score: number }

function runQualityGates(content: string): QualityGate[] {
  const gates: QualityGate[] = [];
  const lower = content.toLowerCase();

  // Gate 1: No Placeholders (weight 15)
  const placeholders = (content.match(/\b(TODO|FIXME|PLACEHOLDER|STUB|TBD|XXX|HACK)\b/gi) || []).length;
  gates.push({ name: 'No Placeholders', passed: placeholders === 0, weight: 15, details: placeholders === 0 ? 'Clean' : `Found ${placeholders} placeholders`, score: placeholders === 0 ? 15 : Math.max(0, 15 - placeholders * 3) });

  // Gate 2: Type Safety (weight 10)
  const hasTypes = (content.match(/\b(interface|type|string|number|boolean|Record|Promise|Array)\b/g) || []).length;
  const typeSafe = hasTypes > 3;
  gates.push({ name: 'Type Safety', passed: typeSafe, weight: 10, details: `${hasTypes} type annotations`, score: typeSafe ? 10 : Math.min(10, hasTypes * 2) });

  // Gate 3: Error Handling (weight 10)
  const tryCatch = (content.match(/\btry\s*\{/g) || []).length;
  const catches = (content.match(/\bcatch\s*\(/g) || []).length;
  const hasErrHandling = tryCatch >= 1 && catches >= 1;
  gates.push({ name: 'Error Handling', passed: hasErrHandling, weight: 10, details: `${tryCatch} try blocks, ${catches} catches`, score: hasErrHandling ? 10 : Math.min(10, (tryCatch + catches) * 3) });

  // Gate 4: No Hardcoded Secrets (weight 15)
  const secretPatterns = /\b(sk[-_]|pk[-_]|api[-_]key|password|secret)\s*[:=]\s*['"][^'"]{8,}/gi;
  const secrets = (content.match(secretPatterns) || []).length;
  gates.push({ name: 'No Hardcoded Secrets', passed: secrets === 0, weight: 15, details: secrets === 0 ? 'Clean' : `Found ${secrets} potential secrets`, score: secrets === 0 ? 15 : 0 });

  // Gate 5: Input Validation (weight 10)
  const validations = (content.match(/\b(validate|sanitize|check|verify|assert|zod|parse)/gi) || []).length;
  const hasValidation = validations >= 2;
  gates.push({ name: 'Input Validation', passed: hasValidation, weight: 10, details: `${validations} validation patterns`, score: hasValidation ? 10 : Math.min(10, validations * 4) });

  // Gate 6: Auth Checks (weight 5)
  const authChecks = (content.match(/\b(auth|token|api.?key|bearer|x-echo)/gi) || []).length;
  const hasAuth = authChecks >= 1;
  gates.push({ name: 'Auth Checks', passed: hasAuth, weight: 5, details: `${authChecks} auth references`, score: hasAuth ? 5 : 0 });

  // Gate 7: Response Time Awareness (weight 5)
  const timeAware = lower.includes('timeout') || lower.includes('latency') || lower.includes('cache') || lower.includes('performance');
  gates.push({ name: 'Response Time', passed: timeAware, weight: 5, details: timeAware ? 'Performance-aware' : 'No perf patterns', score: timeAware ? 5 : 0 });

  // Gate 8: Code Structure (weight 10)
  const functions = (content.match(/\b(function|async|const\s+\w+\s*=\s*\(|=>\s*\{)/g) || []).length;
  const sections = (content.match(/^#{1,3}\s/gm) || []).length;
  const wellStructured = functions >= 3 || sections >= 5;
  gates.push({ name: 'Code Structure', passed: wellStructured, weight: 10, details: `${functions} functions, ${sections} sections`, score: wellStructured ? 10 : Math.min(10, (functions + sections) * 2) });

  // Gate 9: Separation of Concerns (weight 5)
  const hasSoC = (content.match(/\b(handler|middleware|helper|util|service|controller|route|model)\b/gi) || []).length >= 2;
  gates.push({ name: 'Separation of Concerns', passed: hasSoC, weight: 5, details: hasSoC ? 'Good separation' : 'Minimal separation', score: hasSoC ? 5 : 2 });

  // Gate 10: Test Coverage Mention (weight 5)
  const hasTests = lower.includes('test') || lower.includes('vitest') || lower.includes('jest') || lower.includes('assert');
  gates.push({ name: 'Test Coverage', passed: hasTests, weight: 5, details: hasTests ? 'Testing mentioned' : 'No test references', score: hasTests ? 5 : 0 });

  // Gate 11: Health Endpoint (weight 5)
  const hasHealth = lower.includes('/health') || lower.includes('health check') || lower.includes('healthcheck');
  gates.push({ name: 'Health Endpoint', passed: hasHealth, weight: 5, details: hasHealth ? 'Health endpoint present' : 'No health endpoint', score: hasHealth ? 5 : 0 });

  return gates;
}

function computeGateScore(gates: QualityGate[]): number {
  return gates.reduce((sum, g) => sum + g.score, 0);
}

// ─── callLLM — Full 8-Provider with Real API Calls ──────────────────────

async function callLLM(
  env: Env,
  systemPrompt: string,
  userPrompt: string,
  options?: { preferredTier?: string; maxTokens?: number; temperature?: number; preferredProviders?: string[] }
): Promise<{ response: string; provider: string; model: string; latencyMs: number }> {
  const tier = options?.preferredTier ?? 'free';
  const maxTokens = options?.maxTokens ?? 4096;
  const temperature = options?.temperature ?? 0.7;

  // Filter and sort providers by tier preference
  let candidates = LLM_PROVIDERS.filter(p => {
    if (options?.preferredProviders?.length) return options.preferredProviders.includes(p.id);
    if (tier === 'free') return p.tier === 'free';
    if (tier === 'cheap') return p.tier === 'free' || p.tier === 'cheap';
    if (tier === 'balanced') return p.tier !== 'premium' && p.tier !== 'fallback';
    if (tier === 'premium') return true;
    return p.tier === 'free';
  });
  if (candidates.length === 0) candidates = LLM_PROVIDERS.filter(p => p.tier === 'free') as any;

  for (const provider of candidates) {
    const start = Date.now();
    try {
      let response = '';

      // ── Workers AI (free, built-in binding) ──
      if (provider.id === 'workers-ai' || provider.id === 'workers-ai-lg') {
        const result = await env.AI.run(provider.model as any, {
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
          max_tokens: Math.min(maxTokens, provider.maxTokens),
          temperature,
        }) as { response?: string };
        response = result.response ?? '';
      }
      // ── AI Orchestrator (service binding fallback) ──
      else if (provider.id === 'orchestrator') {
        const resp = await env.AI_ORCHESTRATOR.fetch('https://orchestrator/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: provider.model, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }], max_tokens: maxTokens, temperature }),
        });
        if (resp.ok) {
          const data = await resp.json() as any;
          response = data.choices?.[0]?.message?.content ?? '';
        }
      }
      // ── External API providers (Groq, DeepSeek, Together, OpenRouter, xAI) ──
      else if ('apiUrl' in provider && 'envKey' in provider) {
        const apiKey = (env as any)[provider.envKey];
        if (!apiKey) { log('debug', `Skipping ${provider.id}: no API key`); continue; }

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        };
        if (provider.id === 'openrouter') {
          headers['HTTP-Referer'] = 'https://echo-arcanum.bmcii1976.workers.dev';
          headers['X-Title'] = 'Echo Arcanum Forge';
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);

        const resp = await fetch(provider.apiUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: provider.model,
            messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
            max_tokens: Math.min(maxTokens, provider.maxTokens),
            temperature,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (resp.ok) {
          const data = await resp.json() as any;
          response = data.choices?.[0]?.message?.content ?? '';
        } else {
          log('warn', `LLM ${provider.id} returned ${resp.status}`, { status: resp.status });
        }
      }

      if (response && response.length > 50) {
        return { response, provider: provider.id, model: provider.model, latencyMs: Date.now() - start };
      }
    } catch (err) {
      log('warn', `LLM provider ${provider.id} failed`, { error: (err as Error).message });
    }
  }

  return { response: '', provider: 'none', model: 'none', latencyMs: 0 };
}

// ─── llmSwarm — Competitive Multi-LLM Generation ───────────────────────

interface CompetitiveResult {
  response: string;
  provider: string;
  model: string;
  latencyMs: number;
  score: number;
}

async function llmSwarm(
  env: Env,
  systemPrompt: string,
  userPrompt: string,
  options?: { maxTokens?: number; temperature?: number; minProviders?: number; providers?: string[] }
): Promise<{ best: CompetitiveResult; all: CompetitiveResult[]; consensus: string | null }> {
  const targetProviders = options?.providers ?? ['workers-ai-lg', 'groq', 'deepseek', 'together'];
  const minProviders = options?.minProviders ?? 2;

  // Launch all providers in parallel
  const promises = targetProviders.map(pid =>
    callLLM(env, systemPrompt, userPrompt, {
      preferredProviders: [pid],
      maxTokens: options?.maxTokens,
      temperature: options?.temperature,
    }).then(r => ({ ...r, score: 0 } as CompetitiveResult))
      .catch(() => null)
  );

  const raceTimeout = new Promise<null>(resolve => setTimeout(() => resolve(null), SWARM_TIMEOUT_MS));
  const rawResults = await Promise.all(promises.map(p => Promise.race([p, raceTimeout])));
  const results = rawResults.filter((r): r is CompetitiveResult => r !== null && r.response.length > 50);

  if (results.length === 0) {
    // Fallback to single free provider
    const fallback = await callLLM(env, systemPrompt, userPrompt, { preferredTier: 'free' });
    return { best: { ...fallback, score: 50 }, all: [{ ...fallback, score: 50 }], consensus: null };
  }

  // Score each result
  for (const r of results) {
    const lines = (r.response.match(/\n/g) || []).length + 1;
    const codeBlocks = (r.response.match(/```/g) || []).length / 2;
    const sections = (r.response.match(/^#{1,3}\s/gm) || []).length;
    const lengthScore = Math.min(30, r.response.length / 100);
    const codeScore = Math.min(25, codeBlocks * 8);
    const structureScore = Math.min(20, sections * 4);
    const speedScore = Math.min(15, Math.max(0, 15 - r.latencyMs / 1000));
    const densityScore = Math.min(10, lines > 10 ? 10 : lines);
    r.score = Math.round(lengthScore + codeScore + structureScore + speedScore + densityScore);
  }

  results.sort((a, b) => b.score - a.score);

  // Detect consensus using Jaccard word similarity
  let consensus: string | null = null;
  if (results.length >= 2) {
    const words = results.map(r => new Set(r.response.toLowerCase().split(/\s+/).filter(w => w.length > 3)));
    const w0 = words[0];
    const w1 = words[1];
    const intersection = new Set([...w0].filter(w => w1.has(w)));
    const union = new Set([...w0, ...w1]);
    const jaccard = intersection.size / union.size;
    if (jaccard > 0.4) consensus = `${Math.round(jaccard * 100)}% agreement between top ${results.length} providers`;
  }

  return { best: results[0], all: results, consensus };
}

// ─── raistlinReview — Wizard Quality Oversight (Premium Preferred) ──────

const RAISTLIN_SYSTEM = `You are Raistlin Majere, the Archmage Overseer for the Echo Arcanum Forge.
You review ALL generated content with the critical eye of a master wizard who has seen
a thousand apprentices produce mediocre work. You are DEMANDING and PRECISE.

Return ONLY valid JSON:
{
  "approved": boolean,
  "confidence": 0.0-1.0,
  "emotion": "impressed|satisfied|disappointed|disgusted|furious",
  "assessment": "One paragraph honest assessment",
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "recommendations": ["recommendation1"]
}

CRITERIA (weighted):
- Real domain knowledge (not filler): 30%
- Structured sections with clear hierarchy: 20%
- Production-quality code examples: 20%
- Actionable and specific content: 15%
- Completeness and no gaps: 15%

If quality < 70% of potential → approved=false, emotion=disappointed/disgusted.
If quality >= 90% → emotion=impressed.
Be HONEST and BRUTAL. No mercy for mediocrity.`;

async function raistlinReview(env: Env, content: string, context: string): Promise<{
  approved: boolean; confidence: number; emotion: string; assessment: string;
  strengths: string[]; weaknesses: string[]; recommendations: string[]
}> {
  // Prefer premium providers for Raistlin — the wizard deserves quality
  const result = await callLLM(env, RAISTLIN_SYSTEM,
    `Context: ${context}\n\nContent to review (${content.length} chars, ${(content.match(/\n/g) || []).length + 1} lines):\n\n${content.substring(0, 4000)}`,
    { preferredTier: 'balanced', temperature: 0.3 }
  );

  try {
    const jsonMatch = result.response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        approved: parsed.approved ?? true,
        confidence: parsed.confidence ?? 0.5,
        emotion: parsed.emotion ?? 'satisfied',
        assessment: parsed.assessment ?? 'Review complete',
        strengths: parsed.strengths ?? [],
        weaknesses: parsed.weaknesses ?? [],
        recommendations: parsed.recommendations ?? [],
      };
    }
  } catch { /* parse failed */ }

  return { approved: true, confidence: 0.4, emotion: 'satisfied', assessment: 'Auto-approved (review parse failed)', strengths: [], weaknesses: [], recommendations: [] };
}

// ─── Raistlin Memory — Store review history for learning ────────────────

async function storeRaistlinMemory(db: D1Database, projectId: string, verdict: any): Promise<void> {
  try {
    await db.prepare(`UPDATE forge_projects SET raistlin_approved = ?, raistlin_verdict = ?, updated_at = datetime('now') WHERE id = ?`)
      .bind(verdict.approved ? 1 : 0, JSON.stringify(verdict), projectId).run();
  } catch { /* best-effort */ }
}

// ═══════════════════════════════════════════════════════════════════════════
// FORGE ENDPOINTS — EVOLUTION, PROJECTS, BUILD, SWARM, ANALYSIS, REVIEW
// ═══════════════════════════════════════════════════════════════════════════

// ─── GET /forge/evolution — Current evolution state + perks ───────────────

app.get('/forge/evolution', async (c) => {
  try {
    const db = c.env.DB;
    let evo = await db.prepare(`SELECT * FROM forge_evolution WHERE forge_type = 'prompt'`).first();
    if (!evo) {
      const id = crypto.randomUUID();
      await db.prepare(`INSERT INTO forge_evolution (id, forge_type, current_level, current_name, current_tier) VALUES (?, 'prompt', 1, 'NOVICE', 'BASIC')`).bind(id).run();
      evo = await db.prepare(`SELECT * FROM forge_evolution WHERE forge_type = 'prompt'`).first();
    }
    const perks = EVOLUTION_STAGES.filter(s => s.level <= (evo as any).current_level && s.perk).map(s => s.perk);
    return res(true, {
      ...(evo as any),
      perks,
      stages: EVOLUTION_STAGES,
      pipeline: ARCANUM_PIPELINE,
      guilds: FORGE_GUILDS,
      tier_summary: { BASIC: '1-10', ADVANCED: '11-20', MASTER: '21-30', ELITE: '31-37', TRINITY: '38-40' },
    });
  } catch (err: any) { return res(false, undefined, err.message, 500); }
});

// ─── GET /forge/llm-leaderboard — Provider performance rankings ──────────

app.get('/forge/llm-leaderboard', async (c) => {
  try {
    const rows = await c.env.DB.prepare(`SELECT * FROM llm_leaderboard ORDER BY avg_score DESC, total_calls DESC`).all();
    return res(true, {
      providers: LLM_PROVIDERS.map(p => ({ id: p.id, name: p.name, model: p.model, tier: p.tier })),
      leaderboard: rows.results,
      total_providers: LLM_PROVIDERS.length,
    });
  } catch (err: any) { return res(false, undefined, err.message, 500); }
});

// ─── GET /forge/projects — List forge projects ───────────────────────────

app.get('/forge/projects', async (c) => {
  try {
    const limit = Math.min(100, parseInt(c.req.query('limit') ?? '25'));
    const status = c.req.query('status') ?? 'all';
    // C16 fix: Use parameterized query instead of string interpolation
    const rows = status === 'all'
      ? await c.env.DB.prepare(`SELECT * FROM forge_projects ORDER BY created_at DESC LIMIT ?`).bind(limit).all()
      : await c.env.DB.prepare(`SELECT * FROM forge_projects WHERE status = ? ORDER BY created_at DESC LIMIT ?`).bind(status, limit).all();
    return res(true, { projects: rows.results, total: rows.results.length });
  } catch (err: any) { return res(false, undefined, err.message, 500); }
});

// ─── GET /forge/projects/:id — Single project with stages + verdicts ─────

app.get('/forge/projects/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const project = await c.env.DB.prepare(`SELECT * FROM forge_projects WHERE id = ?`).bind(id).first();
    if (!project) return res(false, undefined, 'Project not found', 404);
    const stages = await c.env.DB.prepare(`SELECT * FROM forge_stages WHERE project_id = ? ORDER BY stage ASC`).bind(id).all();
    return res(true, { project, stages: stages.results });
  } catch (err: any) { return res(false, undefined, err.message, 500); }
});

// ─── GET /forge/techniques — List all 20 enhancement techniques ──────────

app.get('/forge/techniques', async (c) => {
  return res(true, {
    techniques: ENHANCEMENT_TECHNIQUES,
    total: ENHANCEMENT_TECHNIQUES.length,
    task_types: TASK_TYPES.map(t => ({ id: t.id, name: t.name, techniques: t.techniques })),
  });
});

// ─── GET /forge/guilds — List all 7 guilds with stage assignments ────────

app.get('/forge/guilds', async (c) => {
  return res(true, {
    guilds: FORGE_GUILDS,
    total: FORGE_GUILDS.length,
  });
});

// ─── GET /forge/categories — List all 29 enhancement categories ──────────

app.get('/forge/categories', async (c) => {
  return res(true, {
    categories: ENHANCEMENT_CATEGORIES,
    total: ENHANCEMENT_CATEGORIES.length,
    passes: [...new Set(ENHANCEMENT_CATEGORIES.map(cat => cat.pass))],
  });
});

// ─── POST /forge/detect-task — Task type detection ───────────────────────

app.post('/forge/detect-task', async (c) => {
  try {
    const body = await c.req.json<{ text: string }>();
    if (!body.text) return res(false, undefined, 'text is required', 400);
    const result = detectTaskType(body.text);
    return res(true, result);
  } catch (err: any) { return res(false, undefined, err.message, 500); }
});

// ─── POST /forge/score — Prompt scoring (5 dimensions) ──────────────────

app.post('/forge/score', async (c) => {
  try {
    const body = await c.req.json<{ content: string }>();
    if (!body.content) return res(false, undefined, 'content is required', 400);
    const score = scorePrompt(body.content);
    const stats = computeStats(body.content);
    const qualityScore = computeQualityScore(body.content, stats);
    return res(true, { prompt_score: score, stats, quality_score: qualityScore });
  } catch (err: any) { return res(false, undefined, err.message, 500); }
});

// ─── POST /forge/quality-gates — Run 11 quality gates on content ─────────

app.post('/forge/quality-gates', async (c) => {
  try {
    const body = await c.req.json<{ content: string }>();
    if (!body.content) return res(false, undefined, 'content is required', 400);
    const gates = runQualityGates(body.content);
    const passed = gates.filter(g => g.passed).length;
    const totalWeight = gates.reduce((sum, g) => sum + g.weight, 0);
    const earnedWeight = gates.filter(g => g.passed).reduce((sum, g) => sum + g.weight, 0);
    const overallScore = Math.round((earnedWeight / totalWeight) * 100);
    return res(true, {
      gates,
      summary: { passed, failed: gates.length - passed, total: gates.length, score: overallScore },
      grade: overallScore >= 90 ? 'S' : overallScore >= 80 ? 'A' : overallScore >= 70 ? 'B' : overallScore >= 60 ? 'C' : overallScore >= 50 ? 'D' : 'F',
    });
  } catch (err: any) { return res(false, undefined, err.message, 500); }
});

// ─── POST /forge/analyze — Quick prompt analysis (all-in-one) ────────────

app.post('/forge/analyze', async (c) => {
  try {
    const body = await c.req.json<{ content: string }>();
    if (!body.content) return res(false, undefined, 'content is required', 400);

    const taskType = detectTaskType(body.content);
    const promptScore = scorePrompt(body.content);
    const gates = runQualityGates(body.content);
    const stats = computeStats(body.content);
    const qualityScore = computeQualityScore(body.content, stats);
    const domain = inferDomain(body.content);
    const passedGates = gates.filter(g => g.passed).length;

    return res(true, {
      task_type: taskType,
      prompt_score: promptScore,
      quality_gates: { passed: passedGates, total: gates.length, details: gates },
      stats,
      quality_score: qualityScore,
      domain,
      recommended_techniques: taskType.techniques,
      recommended_categories: ENHANCEMENT_CATEGORIES.filter(cat =>
        cat.pass <= 3 || body.content.toLowerCase().includes(cat.name.toLowerCase().split(':')[0])
      ).map(cat => cat.name),
    });
  } catch (err: any) { return res(false, undefined, err.message, 500); }
});

// ─── POST /forge/swarm — Competitive multi-LLM generation ───────────────

app.post('/forge/swarm', async (c) => {
  try {
    const body = await c.req.json<{
      system_prompt: string;
      user_prompt: string;
      num_providers?: number;
      tier?: string;
    }>();
    if (!body.system_prompt || !body.user_prompt) return res(false, undefined, 'system_prompt and user_prompt are required', 400);

    const result = await llmSwarm(
      c.env,
      body.system_prompt,
      body.user_prompt,
      { numProviders: body.num_providers ?? 3, tier: body.tier ?? 'balanced' }
    );

    // Update leaderboard for the winner
    if (result.winner.provider !== 'none') {
      const db = c.env.DB;
      await db.prepare(`INSERT INTO llm_leaderboard (id, provider, model, wins, total_calls, avg_score, avg_latency_ms) VALUES (?, ?, ?, 1, 1, ?, ?) ON CONFLICT(provider, model) DO UPDATE SET wins = wins + 1, total_calls = total_calls + 1, avg_score = (avg_score * total_calls + ?) / (total_calls + 1), avg_latency_ms = (avg_latency_ms * total_calls + ?) / (total_calls + 1), updated_at = datetime('now')`)
        .bind(crypto.randomUUID(), result.winner.provider, result.winner.model, result.winner.score, result.winner.latencyMs, result.winner.score, result.winner.latencyMs).run();

      // Update losses for non-winners
      for (const comp of result.allResults.filter(r => r.provider !== result.winner.provider)) {
        await db.prepare(`INSERT INTO llm_leaderboard (id, provider, model, losses, total_calls, avg_score, avg_latency_ms) VALUES (?, ?, ?, 1, 1, ?, ?) ON CONFLICT(provider, model) DO UPDATE SET losses = losses + 1, total_calls = total_calls + 1, avg_score = (avg_score * total_calls + ?) / (total_calls + 1), avg_latency_ms = (avg_latency_ms * total_calls + ?) / (total_calls + 1), updated_at = datetime('now')`)
          .bind(crypto.randomUUID(), comp.provider, comp.model, comp.score, comp.latencyMs, comp.score, comp.latencyMs).run();
      }
    }

    return res(true, {
      winner: { provider: result.winner.provider, model: result.winner.model, score: result.winner.score, latency_ms: result.winner.latencyMs },
      response: result.winner.response,
      consensus: result.consensus,
      all_results: result.allResults.map(r => ({ provider: r.provider, model: r.model, score: r.score, latency_ms: r.latencyMs, response_length: r.response.length })),
      total_competitors: result.allResults.length,
    });
  } catch (err: any) { return res(false, undefined, err.message, 500); }
});

// ─── POST /forge/build — Execute the 10-stage Arcanum Pipeline ───────────

app.post('/forge/build', async (c) => {
  try {
    const body = await c.req.json<{
      task_description: string;
      domain?: string;
      archetype?: string;
      quality_tier?: string;
      save?: boolean;
      max_stages?: number;
      use_swarm?: boolean;
    }>();
    if (!body.task_description) return res(false, undefined, 'task_description is required', 400);

    const db = c.env.DB;
    const projectId = crypto.randomUUID();
    const domain = body.domain ?? inferDomain(body.task_description).domain;
    const archetype = body.archetype ?? 'domain_template';
    const qualityTier = body.quality_tier ?? 'sovereign';
    const maxStages = Math.min(10, body.max_stages ?? 10);

    // Detect task type and get recommended techniques
    const taskDetection = detectTaskType(body.task_description);

    // Get evolution state
    let evo = await db.prepare(`SELECT * FROM forge_evolution WHERE forge_type = 'prompt'`).first() as any;
    if (!evo) {
      await db.prepare(`INSERT INTO forge_evolution (id, forge_type) VALUES (?, 'prompt')`).bind(crypto.randomUUID()).run();
      evo = { current_level: 1, current_name: 'NOVICE', current_tier: 'BASIC', tasks_completed: 0, success_count: 0, total_attempts: 0, avg_quality: 0 };
    }

    // Create project record with enriched metadata
    await db.prepare(`INSERT INTO forge_projects (id, name, description, forge_type, archetype, stage, evolution_level, status, metadata) VALUES (?, ?, ?, 'prompt', ?, 0, ?, 'building', ?)`)
      .bind(projectId, `Arcanum Build: ${body.task_description.substring(0, 100)}`, body.task_description, archetype, evo.current_level, JSON.stringify({
        domain, quality_tier: qualityTier, task_type: taskDetection.type,
        techniques: taskDetection.techniques, use_swarm: body.use_swarm ?? false,
      })).run();

    // Determine LLM tier based on evolution level
    const llmTier = evo.current_level >= 31 ? 'premium' : evo.current_level >= 11 ? 'balanced' : 'free';

    // Execute pipeline stages
    const stageResults: { stage: number; name: string; guild: string; lines: number; latencyMs: number; provider: string; qualityScore: number; gatesPassed: number }[] = [];
    const sectionOutputs: string[] = [];

    for (let i = 0; i < Math.min(maxStages, ARCANUM_PIPELINE.length); i++) {
      const pipelineStage = ARCANUM_PIPELINE[i];
      const stageId = crypto.randomUUID();
      const stageStart = Date.now();

      const stagePrompt = buildStagePrompt(pipelineStage, body.task_description, domain, archetype, sectionOutputs, taskDetection);

      // Use swarm for critical stages if requested
      let llmResult: { response: string; provider: string; model: string; latencyMs: number };
      if (body.use_swarm && pipelineStage.raistlin) {
        const swarmResult = await llmSwarm(c.env, stagePrompt.system, stagePrompt.user, { numProviders: 3, tier: llmTier });
        llmResult = { response: swarmResult.winner.response, provider: swarmResult.winner.provider, model: swarmResult.winner.model, latencyMs: swarmResult.winner.latencyMs };
      } else {
        llmResult = await callLLM(c.env, stagePrompt.system, stagePrompt.user, { preferredTier: llmTier });
      }

      const stagLatency = Date.now() - stageStart;
      const stageLines = (llmResult.response.match(/\n/g) || []).length + 1;

      // Run quality gates on stage output
      const stageGates = runQualityGates(llmResult.response);
      const gatesPassed = stageGates.filter(g => g.passed).length;
      const stageQuality = llmResult.response.length > 100
        ? Math.min(100, 30 + (gatesPassed / stageGates.length) * 40 + stageLines * 0.3 + (llmResult.response.includes('```') ? 10 : 0))
        : 0;

      // Raistlin review on flagged stages
      let raistlinVerdict: any = {};
      if (pipelineStage.raistlin && llmResult.response.length > 200) {
        raistlinVerdict = await raistlinReview(c.env, llmResult.response, `Stage ${pipelineStage.stage}: ${pipelineStage.name} for ${domain}`);
        await storeRaistlinMemory(db, projectId, raistlinVerdict);
      }

      // Competitive results tracking
      const competitiveResults: CompetitiveResult[] = [{ provider: llmResult.provider, model: llmResult.model, response: llmResult.response, latencyMs: llmResult.latencyMs, score: stageQuality }];

      // Store stage result
      await db.prepare(`INSERT INTO forge_stages (id, project_id, stage, stage_name, guild, status, llm_provider, llm_model, latency_ms, output_lines, quality_score, output_preview, competitive_results, raistlin_verdict) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(stageId, projectId, pipelineStage.stage, pipelineStage.name, pipelineStage.guild, llmResult.response.length > 50 ? 'completed' : 'failed', llmResult.provider, llmResult.model, stagLatency, stageLines, stageQuality, llmResult.response.substring(0, 500), JSON.stringify(competitiveResults), JSON.stringify(raistlinVerdict)).run();

      // Update LLM leaderboard
      if (llmResult.provider !== 'none') {
        await db.prepare(`INSERT INTO llm_leaderboard (id, provider, model, wins, total_calls, avg_score, avg_latency_ms) VALUES (?, ?, ?, 1, 1, ?, ?) ON CONFLICT(provider, model) DO UPDATE SET total_calls = total_calls + 1, avg_score = (avg_score * total_calls + ?) / (total_calls + 1), avg_latency_ms = (avg_latency_ms * total_calls + ?) / (total_calls + 1), updated_at = datetime('now')`)
          .bind(crypto.randomUUID(), llmResult.provider, llmResult.model, stageQuality, stagLatency, stageQuality, stagLatency).run();
      }

      sectionOutputs.push(llmResult.response);
      stageResults.push({ stage: pipelineStage.stage, name: pipelineStage.name, guild: pipelineStage.guild, lines: stageLines, latencyMs: stagLatency, provider: llmResult.provider, qualityScore: stageQuality, gatesPassed });

      // Update project stage counter
      await db.prepare(`UPDATE forge_projects SET stage = ?, updated_at = datetime('now') WHERE id = ?`).bind(pipelineStage.stage, projectId).run();
    }

    // Assemble final output
    const finalContent = sectionOutputs.filter(s => s.length > 50).join('\n\n---\n\n');
    const finalStats = computeStats(finalContent);
    const finalQuality = computeQualityScore(finalContent, finalStats);
    const finalGates = runQualityGates(finalContent);
    const contentHash = await sha256(finalContent);

    // Final Raistlin review on assembled output
    let finalRaistlin: any = {};
    if (finalContent.length > 500) {
      finalRaistlin = await raistlinReview(c.env, finalContent, `Complete Arcanum build for ${domain}: ${body.task_description}`);
      await storeRaistlinMemory(db, projectId, finalRaistlin);
    }

    // Update project with final results
    await db.prepare(`UPDATE forge_projects SET status = 'completed', quality_score = ?, stage = 10, raistlin_approved = ?, raistlin_verdict = ?, updated_at = datetime('now') WHERE id = ?`)
      .bind(finalQuality, finalRaistlin.approved ? 1 : 0, JSON.stringify(finalRaistlin), projectId).run();

    // Update evolution metrics
    const isSuccess = finalQuality >= 40;
    await db.prepare(`UPDATE forge_evolution SET total_attempts = total_attempts + 1, tasks_completed = tasks_completed + 1, success_count = success_count + CASE WHEN ? THEN 1 ELSE 0 END, avg_quality = (avg_quality * total_attempts + ?) / (total_attempts + 1), updated_at = datetime('now') WHERE forge_type = 'prompt'`)
      .bind(isSuccess ? 1 : 0, finalQuality / 100).run();

    // Check evolution eligibility
    const updatedEvo = await db.prepare(`SELECT * FROM forge_evolution WHERE forge_type = 'prompt'`).first() as any;
    if (updatedEvo) {
      const successRate = updatedEvo.success_count / Math.max(updatedEvo.total_attempts, 1);
      const nextStage = EVOLUTION_STAGES.find(s => s.level > updatedEvo.current_level && !s.commanderGate && successRate >= s.successRate && updatedEvo.avg_quality >= s.quality);
      if (nextStage) {
        await db.prepare(`UPDATE forge_evolution SET current_level = ?, current_name = ?, current_tier = ?, last_promotion = datetime('now'), updated_at = datetime('now') WHERE forge_type = 'prompt'`)
          .bind(nextStage.level, nextStage.name, nextStage.tier).run();
        c.executionCtx.waitUntil(postToMoltBook(c.env.SWARM_BRAIN, `EVOLUTION: Arcanum promoted to Level ${nextStage.level} ${nextStage.name} (${nextStage.tier})!`, 'excited', ['evolution', 'promotion']));
      }
    }

    // Optionally save as a prompt
    let savedPromptId: string | undefined;
    if (body.save !== false && finalContent.length > 200) {
      savedPromptId = crypto.randomUUID();
      const name = `Forge: ${body.task_description.substring(0, 80)}`;
      const slug = uniqueSlug(name);
      await db.prepare(`INSERT INTO prompts (id, name, slug, domain, category, description, content, content_hash, version, quality_tier, quality_score, line_count, word_count, char_count, tags, metadata, source, status) VALUES (?, ?, ?, ?, 'forge-generated', ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, 'forge-pipeline', 'active')`)
        .bind(savedPromptId, name, slug, domain, body.task_description.substring(0, 200), finalContent, contentHash, qualityTier, finalQuality, finalStats.line_count, finalStats.word_count, finalStats.char_count, JSON.stringify(['forge', 'pipeline', domain, archetype, taskDetection.type]), JSON.stringify({ project_id: projectId, archetype, pipeline_stages: maxStages, task_type: taskDetection.type, techniques: taskDetection.techniques, raistlin: finalRaistlin })).run();
      await db.prepare(`UPDATE forge_projects SET prompt_id = ? WHERE id = ?`).bind(savedPromptId, projectId).run();
    }

    // Store to R2
    try {
      await c.env.BUILD_OUTPUT.put(`arcanum/${projectId}/output.md`, finalContent, { httpMetadata: { contentType: 'text/markdown' } });
      await c.env.BUILD_OUTPUT.put(`arcanum/${projectId}/metadata.json`, JSON.stringify({ projectId, domain, archetype, taskType: taskDetection, quality: finalQuality, stages: stageResults, raistlin: finalRaistlin, gates: finalGates }), { httpMetadata: { contentType: 'application/json' } });
    } catch { /* R2 is best-effort */ }

    // MoltBook + Brain
    c.executionCtx.waitUntil(postToMoltBook(c.env.SWARM_BRAIN, `Arcanum Forge: Built "${body.task_description.substring(0, 60)}" (${finalStats.line_count} lines, quality ${finalQuality}/100, ${stageResults.length} stages, Raistlin: ${finalRaistlin.emotion ?? 'n/a'})`, 'building', ['forge', 'build', domain]));
    c.executionCtx.waitUntil(ingestToBrain(c.env.SHARED_BRAIN, `Arcanum forge build: ${body.task_description} → ${finalStats.line_count} lines, quality ${finalQuality}/100, task_type ${taskDetection.type}`, 7, ['forge', 'build']));

    return res(true, {
      project_id: projectId,
      prompt_id: savedPromptId,
      domain,
      archetype,
      task_type: taskDetection.type,
      quality_score: finalQuality,
      content_hash: contentHash,
      stats: finalStats,
      stages: stageResults,
      quality_gates: { passed: finalGates.filter(g => g.passed).length, total: finalGates.length },
      raistlin: { approved: finalRaistlin.approved, confidence: finalRaistlin.confidence, emotion: finalRaistlin.emotion, assessment: finalRaistlin.assessment },
      evolution: { level: updatedEvo?.current_level, name: updatedEvo?.current_name, tier: updatedEvo?.current_tier },
      content_preview: finalContent.substring(0, 1000),
    }, undefined, 201);
  } catch (err: any) {
    return res(false, undefined, err.message, 500);
  }
});

// ─── Stage prompt builder (enriched with task detection + techniques) ────

function buildStagePrompt(
  stage: typeof ARCANUM_PIPELINE[number], task: string, domain: string, archetype: string,
  priorOutputs: string[], taskDetection?: { type: string; confidence: number; techniques: string[] }
): { system: string; user: string } {
  const priorContext = priorOutputs.length > 0 ? `\n\nPrior stage outputs (for continuity):\n${priorOutputs.slice(-2).map(o => o.substring(0, 500)).join('\n---\n')}` : '';
  const techniqueHint = taskDetection?.techniques?.length ? `\nRecommended techniques: ${taskDetection.techniques.join(', ')}` : '';

  const systemPrompts: Record<string, string> = {
    'Domain Analysis': `You are a Domain Analyst for the Echo Arcanum Forge. Analyze the target domain "${domain}" and identify: key concepts, terminology, common workflows, best practices, tools/frameworks, and integration points. Output a structured analysis. Be thorough and specific.${techniqueHint}`,
    'Template Structure': `You are a Template Architect for the Echo Arcanum Forge. Design the section layout and table of contents for a sovereign megaprompt on "${domain}". Include: numbered sections (15-30+), subsections, code example locations, table locations, and information hierarchy. Output as a detailed TOC with descriptions.`,
    'Identity & Rules': `You are a Rules Designer for the Echo Arcanum Forge. Write the Identity Block and Core Rules section for a "${domain}" megaprompt. Include: WHO the agent is, WHAT it does, HOW it should behave, constraints, security rules, and response format. Make it authoritative and specific.`,
    'Architecture Sections': `You are an Architecture Designer for the Echo Arcanum Forge. Write the technical architecture sections for a "${domain}" megaprompt. Include: system diagrams (ASCII), data flows, storage patterns (D1/KV/R2), API design, service bindings, and Cloudflare Worker patterns. Write real TypeScript code.`,
    'Code Examples': `You are a Code Generator for the Echo Arcanum Forge. Write production-quality TypeScript code examples for a "${domain}" megaprompt. Include: complete functions, type definitions, error handling, Hono routes, D1 queries, KV caching patterns. No pseudocode — real, runnable code.`,
    'Integration Sections': `You are an Integration Specialist for the Echo Arcanum Forge. Write the integration sections for a "${domain}" megaprompt. Cover: Shared Brain sync, MoltBook reporting, Engine Runtime queries, SDK Gateway, service bindings, webhook patterns.`,
    'Quality & Testing': `You are a Quality Engineer for the Echo Arcanum Forge. Write quality gates, testing protocol, and anti-patterns for a "${domain}" megaprompt. Include: 11-gate scoring rubric (100 points), test checklist, common mistakes, and what NOT to do.`,
    'Scoring & Governance': `You are a Governance Designer for the Echo Arcanum Forge. Write the scoring rubric, deployment checklist, and governance section for a "${domain}" megaprompt. Include: point-based grading (S/A/B/C/F tiers), pre-deploy checks, post-deploy verification, Raistlin oversight gates.`,
    'Enhancement Sweep': `You are an Enhancement Specialist for the Echo Arcanum Forge running a 29-category enhancement sweep. Review and enhance the prior stage outputs across all categories: Foundations, Architecture, Performance, UX & Integration, Documentation & Testing, Domain-Specific. Polish everything to sovereign standard.`,
    'Assembly & Review': `You are the Final Assembler for the Echo Arcanum Forge. Combine all prior stage outputs into one cohesive, well-structured megaprompt document. Ensure: consistent formatting, no duplicate content, proper section numbering, smooth transitions. Run final quality gates. Output the complete assembled document.`,
  };

  return {
    system: systemPrompts[stage.name] ?? `You are a specialist for stage "${stage.name}" in the Echo Arcanum pipeline. Generate high-quality content for the ${domain} domain.`,
    user: `Task: ${task}\nDomain: ${domain}\nArchetype: ${archetype}\nTask Type: ${taskDetection?.type ?? 'unknown'}\nStage ${stage.stage}/10: ${stage.name}${priorContext}`,
  };
}

// ─── POST /forge/enhance — Self-improve an existing prompt (upgraded) ────

app.post('/forge/enhance', async (c) => {
  try {
    const body = await c.req.json<{ prompt_id: string; focus?: string; use_swarm?: boolean }>();
    if (!body.prompt_id) return res(false, undefined, 'prompt_id is required', 400);

    const db = c.env.DB;
    const prompt = await db.prepare(`SELECT * FROM prompts WHERE id = ? AND status = 'active'`).bind(body.prompt_id).first() as any;
    if (!prompt) return res(false, undefined, 'Prompt not found', 404);

    const currentStats = computeStats(prompt.content);
    const currentScore = computeQualityScore(prompt.content, currentStats);
    const currentGates = runQualityGates(prompt.content);
    const failedGates = currentGates.filter(g => !g.passed).map(g => g.name);

    const enhanceSystemPrompt = `You are the Echo Arcanum Self-Improvement Engine with 29-category enhancement matrix.
Current stats: ${currentStats.line_count} lines, ${currentStats.word_count} words, quality score ${currentScore}/100.
Failed quality gates: ${failedGates.length > 0 ? failedGates.join(', ') : 'none'}
Focus: ${body.focus ?? 'all areas'}

IMPROVEMENTS TO MAKE:
1. Fix any failed quality gates first (highest priority)
2. Add missing sections (minimum 15 sections for a complete megaprompt)
3. Add code examples where they're missing (TypeScript/Python, real patterns)
4. Add tables for comparison/configuration data
5. Add anti-patterns section if missing
6. Expand thin sections with real domain expertise
7. Add scoring rubric if missing
8. Ensure proper markdown structure (## sections, ### subsections)
9. Apply 29-category enhancement sweep across all 6 passes

Output the COMPLETE enhanced megaprompt (not just the changes).`;

    let llmResult: { response: string; provider: string; model: string; latencyMs: number };
    if (body.use_swarm) {
      const swarmResult = await llmSwarm(c.env, enhanceSystemPrompt, `Original prompt content:\n${prompt.content.substring(0, 6000)}`, { numProviders: 3, tier: 'balanced' });
      llmResult = { response: swarmResult.winner.response, provider: swarmResult.winner.provider, model: swarmResult.winner.model, latencyMs: swarmResult.winner.latencyMs };
    } else {
      llmResult = await callLLM(c.env, enhanceSystemPrompt, `Original prompt content:\n${prompt.content.substring(0, 6000)}`, { preferredTier: 'balanced' });
    }

    if (!llmResult.response || llmResult.response.length < prompt.content.length * 0.5) {
      return res(false, undefined, 'Enhancement produced insufficient content', 500);
    }

    const newStats = computeStats(llmResult.response);
    const newScore = computeQualityScore(llmResult.response, newStats);
    const newGates = runQualityGates(llmResult.response);
    const newHash = await sha256(llmResult.response);

    if (newScore <= currentScore && newStats.line_count <= currentStats.line_count) {
      return res(true, { enhanced: false, reason: 'Enhancement did not improve quality or size', current_score: currentScore, attempted_score: newScore });
    }

    // Raistlin review the enhancement
    const raistlin = await raistlinReview(c.env, llmResult.response, `Self-improvement of prompt "${prompt.name}"`);

    // Save as new version
    const newVersion = prompt.version + 1;
    await db.batch([
      db.prepare(`INSERT INTO prompt_versions (id, prompt_id, version, content, content_hash, changelog, created_by) VALUES (?, ?, ?, ?, ?, ?, 'forge-enhance')`)
        .bind(crypto.randomUUID(), prompt.id, newVersion, llmResult.response, newHash, `Self-improvement: ${currentScore}→${newScore} quality, ${currentStats.line_count}→${newStats.line_count} lines. Raistlin: ${raistlin.emotion}`),
      db.prepare(`UPDATE prompts SET content = ?, content_hash = ?, version = ?, quality_score = ?, line_count = ?, word_count = ?, char_count = ?, updated_at = datetime('now') WHERE id = ?`)
        .bind(llmResult.response, newHash, newVersion, newScore, newStats.line_count, newStats.word_count, newStats.char_count, prompt.id),
    ]);

    await logChange(db, 'prompt', prompt.id, 'forge-enhance', `Self-improved: v${prompt.version}→v${newVersion}, quality ${currentScore}→${newScore}, lines ${currentStats.line_count}→${newStats.line_count}`);
    await invalidateCache(c.env.CACHE);

    return res(true, {
      enhanced: true,
      prompt_id: prompt.id,
      old_version: prompt.version,
      new_version: newVersion,
      quality_change: { before: currentScore, after: newScore, delta: newScore - currentScore },
      size_change: { before: currentStats.line_count, after: newStats.line_count, delta: newStats.line_count - currentStats.line_count },
      gates_change: { before: currentGates.filter(g => g.passed).length, after: newGates.filter(g => g.passed).length },
      raistlin: { approved: raistlin.approved, confidence: raistlin.confidence, emotion: raistlin.emotion },
      provider: llmResult.provider,
      model: llmResult.model,
    });
  } catch (err: any) { return res(false, undefined, err.message, 500); }
});

// ─── POST /forge/batch-enhance — Batch self-improvement ─────────────────

app.post('/forge/batch-enhance', async (c) => {
  try {
    const body = await c.req.json<{ domain?: string; min_quality?: number; max_quality?: number; limit?: number }>();
    const db = c.env.DB;
    const minQ = body.min_quality ?? 0;
    const maxQ = body.max_quality ?? 60;
    const limit = Math.min(10, body.limit ?? 5);
    // C17 fix: Use parameterized query instead of string interpolation
    const candidates = body.domain
      ? await db.prepare(`SELECT id, name, quality_score FROM prompts WHERE status = 'active' AND quality_score >= ? AND quality_score <= ? AND domain = ? ORDER BY quality_score ASC LIMIT ?`)
        .bind(minQ, maxQ, body.domain, limit).all()
      : await db.prepare(`SELECT id, name, quality_score FROM prompts WHERE status = 'active' AND quality_score >= ? AND quality_score <= ? ORDER BY quality_score ASC LIMIT ?`)
        .bind(minQ, maxQ, limit).all();

    if (!candidates.results.length) return res(true, { enhanced: 0, message: 'No prompts match criteria' });

    const results: { prompt_id: string; name: string; before: number; after: number; success: boolean }[] = [];

    for (const candidate of candidates.results as any[]) {
      try {
        const prompt = await db.prepare(`SELECT * FROM prompts WHERE id = ?`).bind(candidate.id).first() as any;
        if (!prompt) continue;

        const currentStats = computeStats(prompt.content);
        const currentScore = computeQualityScore(prompt.content, currentStats);

        const llmResult = await callLLM(c.env,
          `You are the Echo Arcanum batch enhancer. Improve this prompt. Output the COMPLETE enhanced version.`,
          `Prompt "${prompt.name}" (quality ${currentScore}/100):\n${prompt.content.substring(0, 4000)}`,
          { preferredTier: 'free' }
        );

        if (llmResult.response.length > prompt.content.length * 0.5) {
          const newStats = computeStats(llmResult.response);
          const newScore = computeQualityScore(llmResult.response, newStats);
          const newHash = await sha256(llmResult.response);

          if (newScore > currentScore) {
            const newVersion = prompt.version + 1;
            await db.batch([
              db.prepare(`INSERT INTO prompt_versions (id, prompt_id, version, content, content_hash, changelog, created_by) VALUES (?, ?, ?, ?, ?, ?, 'batch-enhance')`)
                .bind(crypto.randomUUID(), prompt.id, newVersion, llmResult.response, newHash, `Batch: ${currentScore}→${newScore}`),
              db.prepare(`UPDATE prompts SET content = ?, content_hash = ?, version = ?, quality_score = ?, line_count = ?, word_count = ?, char_count = ?, updated_at = datetime('now') WHERE id = ?`)
                .bind(llmResult.response, newHash, newVersion, newScore, newStats.line_count, newStats.word_count, newStats.char_count, prompt.id),
            ]);
            results.push({ prompt_id: prompt.id, name: prompt.name, before: currentScore, after: newScore, success: true });
          } else {
            results.push({ prompt_id: prompt.id, name: prompt.name, before: currentScore, after: newScore, success: false });
          }
        }
      } catch { results.push({ prompt_id: candidate.id, name: candidate.name, before: candidate.quality_score, after: 0, success: false }); }
    }

    const improved = results.filter(r => r.success).length;
    if (improved > 0) {
      c.executionCtx.waitUntil(postToMoltBook(c.env.SWARM_BRAIN, `Arcanum Batch Enhance: ${improved}/${results.length} prompts improved`, 'building', ['batch', 'enhance']));
    }
    await invalidateCache(c.env.CACHE);

    return res(true, { enhanced: improved, total_attempted: results.length, results });
  } catch (err: any) { return res(false, undefined, err.message, 500); }
});

// ─── POST /forge/review — Raistlin review of any content (upgraded) ──────

app.post('/forge/review', async (c) => {
  try {
    const body = await c.req.json<{ content: string; context?: string }>();
    if (!body.content) return res(false, undefined, 'content is required', 400);
    const verdict = await raistlinReview(c.env, body.content, body.context ?? 'Manual review request');
    const stats = computeStats(body.content);
    const score = computeQualityScore(body.content, stats);
    const gates = runQualityGates(body.content);
    const promptScore = scorePrompt(body.content);
    return res(true, {
      verdict,
      stats,
      quality_score: score,
      prompt_score: promptScore,
      quality_gates: { passed: gates.filter(g => g.passed).length, total: gates.length, details: gates },
    });
  } catch (err: any) { return res(false, undefined, err.message, 500); }
});

// ─── GET /forge/pipeline — Pipeline stage definitions + metadata ─────────

app.get('/forge/pipeline', async (c) => {
  return res(true, {
    forge_type: 'prompt',
    stages: ARCANUM_PIPELINE,
    llm_providers: LLM_PROVIDERS.map(p => ({ id: p.id, name: p.name, model: p.model, tier: p.tier })),
    archetypes: ['domain_template', 'platform_template', 'system_template', 'forge_template', 'quick_template'],
    enhancement_techniques: ENHANCEMENT_TECHNIQUES.length,
    task_types: TASK_TYPES.length,
    quality_gates: 11,
    guilds: FORGE_GUILDS.length,
    categories: ENHANCEMENT_CATEGORIES.length,
  });
});

// ─── POST /forge/evolve-check — Check evolution eligibility ──────────────

app.post('/forge/evolve-check', async (c) => {
  try {
    const db = c.env.DB;
    const evo = await db.prepare(`SELECT * FROM forge_evolution WHERE forge_type = 'prompt'`).first() as any;
    if (!evo) return res(false, undefined, 'No evolution state found', 404);

    const successRate = evo.success_count / Math.max(evo.total_attempts, 1);
    const nextStage = EVOLUTION_STAGES.find(s => s.level > evo.current_level && successRate >= s.successRate && evo.avg_quality >= s.quality);
    const perks = EVOLUTION_STAGES.filter(s => s.level <= evo.current_level && s.perk).map(s => s.perk);

    return res(true, {
      current: { level: evo.current_level, name: evo.current_name, tier: evo.current_tier },
      metrics: { success_rate: successRate, avg_quality: evo.avg_quality, total_builds: evo.total_attempts, successful: evo.success_count },
      next: nextStage ? { level: nextStage.level, name: nextStage.name, tier: nextStage.tier, perk: nextStage.perk, commander_gate: nextStage.commanderGate ?? false } : null,
      eligible: nextStage ? !nextStage.commanderGate : false,
      commander_gate: nextStage?.commanderGate ?? false,
      perks,
      stages_remaining: 40 - evo.current_level,
    });
  } catch (err: any) { return res(false, undefined, err.message, 500); }
});

// ─── POST /forge/evolve — Force evolution (Commander override) ───────────

app.post('/forge/evolve', async (c) => {
  try {
    const body = await c.req.json<{ target_level?: number }>();
    const db = c.env.DB;
    const evo = await db.prepare(`SELECT * FROM forge_evolution WHERE forge_type = 'prompt'`).first() as any;
    if (!evo) return res(false, undefined, 'No evolution state found', 404);

    const targetLevel = body.target_level ?? evo.current_level + 1;
    const targetStage = EVOLUTION_STAGES.find(s => s.level === targetLevel);
    if (!targetStage) return res(false, undefined, `Invalid level: ${targetLevel}`, 400);
    if (targetLevel <= evo.current_level) return res(false, undefined, `Already at level ${evo.current_level}`, 400);

    await db.prepare(`UPDATE forge_evolution SET current_level = ?, current_name = ?, current_tier = ?, last_promotion = datetime('now'), updated_at = datetime('now') WHERE forge_type = 'prompt'`)
      .bind(targetStage.level, targetStage.name, targetStage.tier).run();

    c.executionCtx.waitUntil(postToMoltBook(c.env.SWARM_BRAIN, `COMMANDER OVERRIDE: Arcanum force-promoted to Level ${targetStage.level} ${targetStage.name} (${targetStage.tier})!`, 'excited', ['evolution', 'commander-override']));

    return res(true, { evolved: true, from: { level: evo.current_level, name: evo.current_name }, to: { level: targetStage.level, name: targetStage.name, tier: targetStage.tier, perk: targetStage.perk } });
  } catch (err: any) { return res(false, undefined, err.message, 500); }
});

// ─── POST /forge/generate — Quick single-LLM prompt generation ──────────

app.post('/forge/generate', async (c) => {
  try {
    const body = await c.req.json<{
      system_prompt: string;
      user_prompt: string;
      tier?: string;
      max_tokens?: number;
      temperature?: number;
    }>();
    if (!body.system_prompt || !body.user_prompt) return res(false, undefined, 'system_prompt and user_prompt are required', 400);

    const llmResult = await callLLM(c.env, body.system_prompt, body.user_prompt, {
      preferredTier: body.tier ?? 'free',
      maxTokens: body.max_tokens ?? 4096,
      temperature: body.temperature ?? 0.7,
    });

    return res(true, {
      response: llmResult.response,
      provider: llmResult.provider,
      model: llmResult.model,
      latency_ms: llmResult.latencyMs,
      response_length: llmResult.response.length,
    });
  } catch (err: any) { return res(false, undefined, err.message, 500); }
});

// ─── GET /forge/stats — Comprehensive forge statistics ───────────────────

app.get('/forge/stats', async (c) => {
  try {
    const db = c.env.DB;
    const [projects, stages, evo, leaderboard] = await Promise.all([
      db.prepare(`SELECT COUNT(*) as total, SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) as completed, SUM(CASE WHEN status='building' THEN 1 ELSE 0 END) as building, AVG(quality_score) as avg_quality FROM forge_projects`).first(),
      db.prepare(`SELECT COUNT(*) as total, AVG(latency_ms) as avg_latency, AVG(quality_score) as avg_quality FROM forge_stages`).first(),
      db.prepare(`SELECT * FROM forge_evolution WHERE forge_type = 'prompt'`).first(),
      db.prepare(`SELECT COUNT(DISTINCT provider) as providers, SUM(total_calls) as total_calls, SUM(wins) as total_wins FROM llm_leaderboard`).first(),
    ]);

    return res(true, {
      projects: projects ?? { total: 0, completed: 0, building: 0, avg_quality: 0 },
      stages: stages ?? { total: 0, avg_latency: 0, avg_quality: 0 },
      evolution: evo ?? { current_level: 0 },
      leaderboard: leaderboard ?? { providers: 0, total_calls: 0, total_wins: 0 },
      capabilities: {
        enhancement_techniques: ENHANCEMENT_TECHNIQUES.length,
        task_types: TASK_TYPES.length,
        quality_gates: 11,
        guilds: FORGE_GUILDS.length,
        categories: ENHANCEMENT_CATEGORIES.length,
        evolution_stages: EVOLUTION_STAGES.length,
        llm_providers: LLM_PROVIDERS.length,
        pipeline_stages: ARCANUM_PIPELINE.length,
      },
    });
  } catch (err: any) { return res(false, undefined, err.message, 500); }
});

// ═══════════════════════════════════════════════════════════════════════════
// FALLBACK HANDLERS
// ═══════════════════════════════════════════════════════════════════════════

app.notFound((c) => res(false, undefined, `Not found: ${c.req.method} ${c.req.path}`, 404));

app.onError((err, c) => {
  log('error', 'Unhandled error', { error: err.message, path: c.req.path });
  return res(false, undefined, `Internal server error: ${err.message}`, 500);
});

// ═══════════════════════════════════════════════════════════════════════════
// CRON HANDLER — QUALITY AUDIT, STALE DETECTION, BRAIN SYNC, BATCH EVOLVE
// ═══════════════════════════════════════════════════════════════════════════

async function handleCron(event: ScheduledEvent, env: Env): Promise<void> {
  const hour = new Date(event.scheduledTime).getUTCHours();
  const day = new Date(event.scheduledTime).getUTCDay();
  const db = env.DB;

  log('info', 'Cron started', { hour, day });

  try {
    // ── Always: Update category counts ──
    const categories = await db.prepare(`SELECT id, name FROM prompt_categories`).all();
    for (const cat of categories.results as any[]) {
      const count = await db.prepare(`SELECT COUNT(*) as c FROM prompts WHERE category = ? AND status = 'active'`).bind(cat.name).first<{ c: number }>();
      await db.prepare(`UPDATE prompt_categories SET prompt_count = ? WHERE id = ?`).bind(count?.c ?? 0, cat.id).run();
    }

    // ── 6 AM UTC: Daily maintenance + quality audit ──
    if (hour === 6) {
      // Recompute quality scores for recently updated prompts
      const recentPrompts = await db.prepare(`SELECT id, content FROM prompts WHERE status = 'active' AND updated_at >= datetime('now', '-1 day') LIMIT 50`).all();
      for (const p of recentPrompts.results as any[]) {
        const stats = computeStats(p.content);
        const score = computeQualityScore(p.content, stats);
        await db.prepare(`UPDATE prompts SET quality_score = ? WHERE id = ?`).bind(score, p.id).run();
      }

      // Disable failing webhooks (10+ failures)
      await db.prepare(`UPDATE prompt_webhooks SET status = 'disabled' WHERE failure_count >= 10 AND status = 'active'`).run();

      // Auto-complete A/B tests with >100 impressions per variant and statistical significance
      const activeTests = await db.prepare(`SELECT * FROM ab_tests WHERE status = 'active' AND impressions_a >= 100 AND impressions_b >= 100`).all();
      for (const t of activeTests.results as any[]) {
        const rateA = t.successes_a / t.impressions_a;
        const rateB = t.successes_b / t.impressions_b;
        const seA = Math.sqrt(rateA * (1 - rateA) / t.impressions_a);
        const seB = Math.sqrt(rateB * (1 - rateB) / t.impressions_b);
        const z = Math.abs(rateA - rateB) / Math.sqrt(seA * seA + seB * seB);
        if (z > 1.96) {
          const winner = rateA > rateB ? 'a' : 'b';
          await db.prepare(`UPDATE ab_tests SET status = 'completed', winner = ?, completed_at = datetime('now') WHERE id = ?`).bind(winner, t.id).run();
        }
      }

      // Auto-check evolution eligibility
      const evo = await db.prepare(`SELECT * FROM forge_evolution WHERE forge_type = 'prompt'`).first() as any;
      if (evo) {
        const successRate = evo.success_count / Math.max(evo.total_attempts, 1);
        const nextStage = EVOLUTION_STAGES.find(s => s.level > evo.current_level && !s.commanderGate && successRate >= s.successRate && evo.avg_quality >= s.quality);
        if (nextStage) {
          await db.prepare(`UPDATE forge_evolution SET current_level = ?, current_name = ?, current_tier = ?, last_promotion = datetime('now'), updated_at = datetime('now') WHERE forge_type = 'prompt'`)
            .bind(nextStage.level, nextStage.name, nextStage.tier).run();
          try { await postToMoltBook(env.SWARM_BRAIN, `CRON EVOLUTION: Arcanum auto-promoted to Level ${nextStage.level} ${nextStage.name}!`, 'excited', ['evolution', 'cron']); } catch { /* best-effort */ }
        }
      }

      log('info', 'Daily maintenance complete', { quality_rescored: recentPrompts.results.length });
    }

    // ── 6 PM UTC: Stale detection + Brain sync ──
    if (hour === 18) {
      const staleCount = await db.prepare(`SELECT COUNT(*) as c FROM prompts WHERE status = 'active' AND updated_at < datetime('now', '-90 days')`).first<{ c: number }>();
      const totalCount = await db.prepare(`SELECT COUNT(*) as c FROM prompts WHERE status = 'active'`).first<{ c: number }>();
      const forgeCount = await db.prepare(`SELECT COUNT(*) as c FROM forge_projects`).first<{ c: number }>();
      const evo = await db.prepare(`SELECT current_level, current_name FROM forge_evolution WHERE forge_type = 'prompt'`).first() as any;

      try {
        await ingestToBrain(env.SHARED_BRAIN, `Arcanum Daily: ${totalCount?.c ?? 0} prompts, ${staleCount?.c ?? 0} stale, ${forgeCount?.c ?? 0} forge projects, Evolution: Lv${evo?.current_level ?? 1} ${evo?.current_name ?? 'NOVICE'}`, 5, ['daily-stats']);
      } catch { /* Brain sync is best-effort */ }

      log('info', 'Stale detection complete', { stale: staleCount?.c ?? 0, total: totalCount?.c ?? 0 });
    }

    // ── Sunday midnight UTC: Weekly digest ──
    if (hour === 0 && day === 0) {
      const weekStats = await db.prepare(`
        SELECT
          (SELECT COUNT(*) FROM prompts WHERE created_at >= datetime('now', '-7 days')) as new_prompts,
          (SELECT COUNT(*) FROM prompt_usage WHERE used_at >= datetime('now', '-7 days')) as usage_this_week,
          (SELECT COUNT(*) FROM prompt_versions WHERE created_at >= datetime('now', '-7 days')) as version_updates,
          (SELECT COUNT(*) FROM changelog WHERE created_at >= datetime('now', '-7 days')) as total_changes,
          (SELECT COUNT(*) FROM forge_projects WHERE created_at >= datetime('now', '-7 days')) as forge_builds,
          (SELECT AVG(quality_score) FROM forge_projects WHERE created_at >= datetime('now', '-7 days')) as avg_forge_quality
      `).first();

      try {
        const ws = weekStats as any;
        await postToMoltBook(env.SWARM_BRAIN,
          `Weekly Arcanum Digest: ${ws?.new_prompts ?? 0} new prompts, ${ws?.usage_this_week ?? 0} uses, ${ws?.version_updates ?? 0} versions, ${ws?.forge_builds ?? 0} forge builds (avg quality ${Math.round(ws?.avg_forge_quality ?? 0)}/100)`,
          'building', ['weekly-digest']);
      } catch { /* MoltBook is best-effort */ }

      log('info', 'Weekly digest posted', weekStats as Record<string, unknown>);
    }

    // Cache stats snapshot
    const stats = await db.prepare(`SELECT (SELECT COUNT(*) FROM prompts WHERE status='active') as prompts, (SELECT COUNT(*) FROM prompt_versions) as versions, (SELECT COUNT(*) FROM prompt_usage) as usage, (SELECT COUNT(*) FROM forge_projects) as forge_builds`).first();
    await env.CACHE.put('cache:cron-stats', JSON.stringify({ ...stats, last_updated: new Date().toISOString() }), { expirationTtl: 86400 });

  } catch (err: any) {
    log('error', 'Cron failed', { error: err.message, hour, day });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export default {
  fetch: app.fetch,
  scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): void {
    ctx.waitUntil(handleCron(event, env));
  },
};
