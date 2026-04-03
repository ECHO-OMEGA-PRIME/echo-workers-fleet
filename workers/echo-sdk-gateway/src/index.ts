/**
 * Echo SDK Gateway — Main Cloudflare Worker entry point.
 *
 * Unified REST API for Echo Omega Prime. GPT Action #7.
 * Exposes 2,660+ intelligence engines, Shared Brain, Knowledge Forge,
 * Credential Vault, and generic Worker proxy — all behind a single
 * authenticated gateway with canonical response envelopes.
 *
 * Deploy: npx wrangler deploy
 * Tail:   npx wrangler tail
 * Dev:    npx wrangler dev
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env, Envelope, AuthVariables } from './types';
import { authMiddleware } from './utils/auth';
import { rateLimitMiddleware } from './utils/rate-limit';
import { scopeMiddleware } from './utils/scopes';
import { success } from './utils/envelope';
import { getOpenApiSpec } from './openapi';
import engine from './routes/engine';
import brain from './routes/brain';
import knowledge from './routes/knowledge';
import vault from './routes/vault';
import worker from './routes/worker';
import search from './routes/search';
import auth from './routes/auth';
import sdk from './routes/sdk';
import forge from './routes/forge';
import llm from './routes/llm';
import webhooks from './routes/webhooks';
import versioning from './routes/versioning';
import agi from './routes/agi';
import compose from './routes/compose';
import data from './routes/data';
import functions from './routes/functions';
import services from './routes/services';
import { handleScheduled } from './cron';
import {
  brainPassthrough, swarmPassthrough, x200Passthrough, chatPassthrough,
  voicePassthrough, graphPassthrough, arcanumPassthrough, memoryPassthrough,
  megaPassthrough, fleetPassthrough, orchestratorPassthrough, doctrinePassthrough,
  engineCloudPassthrough, toolsPassthrough, marketplacePassthrough,
  hephaestionPassthrough, daedalusPassthrough, forgeXPassthrough,
  engineForgePassthrough, appForgePassthrough, workerForgePassthrough,
  doctrineForgePassthrough, promptForgePassthrough, paypalPassthrough,
} from './routes/proxy-passthrough';

const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

// ---------------------------------------------------------------------------
// Global middleware
// ---------------------------------------------------------------------------

// H1 FIX: CORS — allowlist trusted origins instead of wildcard
app.use(
  '*',
  cors({
    origin: (origin) => {
      const ALLOWED = ['https://echo-ept.com', 'https://echo-op.com', 'https://echo-shield.echo-ept.com'];
      // Allow exact match or *.echo-ept.com subdomains
      if (ALLOWED.includes(origin)) return origin;
      if (origin.endsWith('.echo-ept.com') && origin.startsWith('https://')) return origin;
      // Allow ChatGPT Actions (no origin header) and server-to-server (no browser)
      if (!origin) return 'https://echo-ept.com';
      return ''; // Deny
    },
    allowHeaders: ['Content-Type', 'X-Echo-API-Key', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    maxAge: 86400,
  }),
);

// Authentication (skips /health and /openapi.json)
app.use('*', authMiddleware);

// Rate limiting
app.use('*', rateLimitMiddleware);

// H4 FIX: Scope enforcement — checks auth_scopes against route requirements
app.use('*', scopeMiddleware);

// ---------------------------------------------------------------------------
// Public routes (no auth required — handled by authMiddleware exempt list)
// ---------------------------------------------------------------------------

// GET /health — Gateway health check
app.get('/health', async (c) => {
  const version = c.env.WORKER_VERSION || '1.0.0';

  // Quick service binding health probes (best-effort, don't fail health if a binding is slow)
  const services: Record<string, string> = {};
  const probes = [
    { name: 'engine_runtime', binding: c.env.ENGINE_RUNTIME, path: '/health' },
    { name: 'shared_brain', binding: c.env.SHARED_BRAIN, path: '/health' },
    { name: 'knowledge_forge', binding: c.env.KNOWLEDGE_FORGE, path: '/health' },
  ];

  await Promise.allSettled(
    probes.map(async (p) => {
      try {
        const resp = await p.binding.fetch(`https://internal${p.path}`);
        services[p.name] = resp.ok ? 'healthy' : `error:${resp.status}`;
      } catch {
        services[p.name] = 'unreachable';
      }
    }),
  );

  // L2 FIX: Health endpoint only returns status + version, no internal topology
  const allHealthy = Object.values(services).every(s => s === 'healthy');
  const anyUnreachable = Object.values(services).some(s => s === 'unreachable');

  const healthData = {
    status: allHealthy ? 'healthy' : anyUnreachable ? 'degraded' : 'partial',
    service: 'echo-sdk-gateway',
    version,
    timestamp: new Date().toISOString(),
    services_healthy: Object.values(services).filter(s => s === 'healthy').length,
    services_total: Object.keys(services).length,
  };

  // L7 FIX (partial): Return 503 if degraded
  const statusCode = healthData.status === 'healthy' ? 200 : 503;
  return c.json(success(healthData, version), statusCode);
});

// GET /openapi.json — Self-hosted OpenAPI spec for GPT Actions import
app.get('/openapi.json', (c) => {
  const version = c.env.WORKER_VERSION || '1.0.0';
  const spec = getOpenApiSpec(version);
  return c.json(spec);
});

// F2: POST /init-schema — Initialize all D1 tables (auth required)
app.post('/init-schema', async (c) => {
  const version = c.env.WORKER_VERSION || '1.0.0';
  try {
    await c.env.DB.batch([
      c.env.DB.prepare(`CREATE TABLE IF NOT EXISTS tenants (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
        plan TEXT DEFAULT 'free', rate_limit INTEGER DEFAULT 60,
        daily_limit INTEGER DEFAULT 500, monthly_limit INTEGER DEFAULT 10000,
        status TEXT DEFAULT 'active', created_at TEXT DEFAULT (datetime('now'))
      )`),
      c.env.DB.prepare(`CREATE TABLE IF NOT EXISTS api_keys (
        id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, name TEXT NOT NULL,
        key_hash TEXT UNIQUE NOT NULL, key_prefix TEXT, scopes TEXT DEFAULT '[]',
        status TEXT DEFAULT 'active', last_used_at TEXT, last_ip TEXT,
        expires_at TEXT, rate_limit_override INTEGER, created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (tenant_id) REFERENCES tenants(id)
      )`),
      c.env.DB.prepare(`CREATE TABLE IF NOT EXISTS api_key_usage (
        id INTEGER PRIMARY KEY AUTOINCREMENT, key_id TEXT, tenant_id TEXT,
        endpoint TEXT, method TEXT, status_code INTEGER, ip TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )`),
      c.env.DB.prepare(`CREATE TABLE IF NOT EXISTS usage_daily (
        tenant_id TEXT, key_id TEXT, date TEXT,
        request_count INTEGER DEFAULT 0, error_count INTEGER DEFAULT 0,
        PRIMARY KEY (tenant_id, key_id, date)
      )`),
      c.env.DB.prepare(`CREATE TABLE IF NOT EXISTS usage_monthly (
        tenant_id TEXT, date TEXT,
        request_count INTEGER DEFAULT 0, error_count INTEGER DEFAULT 0,
        PRIMARY KEY (tenant_id, date)
      )`),
      c.env.DB.prepare(`CREATE TABLE IF NOT EXISTS rate_limits (
        key TEXT PRIMARY KEY, count INTEGER DEFAULT 0, window_start INTEGER
      )`),
      c.env.DB.prepare(`CREATE TABLE IF NOT EXISTS webhooks (
        id TEXT PRIMARY KEY, url TEXT NOT NULL, events TEXT, secret TEXT,
        active INTEGER DEFAULT 1, created_at TEXT, last_triggered TEXT, failure_count INTEGER DEFAULT 0
      )`),
      c.env.DB.prepare(`CREATE TABLE IF NOT EXISTS search_index (
        id TEXT PRIMARY KEY, source TEXT NOT NULL, title TEXT NOT NULL,
        snippet TEXT NOT NULL DEFAULT '', category TEXT DEFAULT '',
        keywords TEXT DEFAULT '', updated_at TEXT DEFAULT (datetime('now'))
      )`),
    ]);
    return c.json(success({ initialized: true, tables: 8 }, version));
  } catch (e) {
    return c.json({ success: false, error: 'Schema init failed' }, 500);
  }
});

// ---------------------------------------------------------------------------
// Route modules
// ---------------------------------------------------------------------------

app.route('/engine', engine);
app.route('/brain', brain);
app.route('/knowledge', knowledge);
app.route('/vault', vault);
app.route('/worker', worker);
app.route('/search', search);
app.route('/auth', auth);
app.route('/sdk', sdk);
app.route('/forge', forge);
app.route('/llm', llm);
app.route('/webhooks', webhooks);
app.route('/events', webhooks);
app.route('/versioning', versioning);
app.route('/agi', agi);
app.route('/compose', compose);
app.route('/data', data);
app.route('/functions', functions);
app.route('/services', services);       // Unified fleet proxy (15 workers)

// ---------------------------------------------------------------------------
// Passthrough proxy routes — expose FULL API surface of all workers
// These catch-all routes proxy /prefix/* to the target worker's /*
// This exposes 500+ endpoints that were previously hidden behind /worker/call
// ---------------------------------------------------------------------------

app.route('/brain-full', brainPassthrough);   // 50+ shared brain endpoints
app.route('/swarm', swarmPassthrough);         // 137 swarm brain endpoints
app.route('/x200', x200Passthrough);           // 23 X200 endpoints (Trinity, 13 AI providers)
app.route('/chat', chatPassthrough);           // Chat/conversation endpoints
app.route('/voice', voicePassthrough);         // Voice synthesis (39 voices)
app.route('/graph', graphPassthrough);         // Graph RAG (312K nodes)
app.route('/arcanum', arcanumPassthrough);     // Prompt templates (370+)
app.route('/memory', memoryPassthrough);       // 7-tier cognitive memory
app.route('/mega', megaPassthrough);           // Mega Gateway (36K tools)
app.route('/fleet', fleetPassthrough);         // Fleet commander
app.route('/orchestrator', orchestratorPassthrough); // AI Orchestrator (29 models)
app.route('/doctrine', doctrinePassthrough);   // Doctrine forge
app.route('/engine-cloud', engineCloudPassthrough); // Engine cloud
app.route('/tools', toolsPassthrough);         // Tool discovery (24.8M functions)
app.route('/marketplace', marketplacePassthrough); // Forge marketplace

// Forge worker passthroughs — FULL API surface of each forge
app.route('/hephaestion', hephaestionPassthrough); // 13-stage competitive pipeline
app.route('/daedalus', daedalusPassthrough);       // 15 guilds, 1200 agents, manufacturing
app.route('/forge-x', forgeXPassthrough);         // Engine factory (2,613 engines)
app.route('/engine-forge', engineForgePassthrough); // Engine building
app.route('/app-forge', appForgePassthrough);     // App building
app.route('/worker-forge', workerForgePassthrough); // Worker building
app.route('/doctrine-forge', doctrineForgePassthrough); // Doctrine blocks
app.route('/prompt-forge', promptForgePassthrough); // Prompt engineering
app.route('/paypal', paypalPassthrough);           // Payment processing

// ---------------------------------------------------------------------------
// Catch-all 404
// ---------------------------------------------------------------------------
app.all('*', (c) => {
  const version = c.env.WORKER_VERSION || '1.0.0';
  return c.json(
    {
      success: false,
      data: null,
      error: {
        message: `Route not found: ${c.req.method} ${new URL(c.req.url).pathname}`,
        code: 'ECHO_NOT_FOUND',
      },
      meta: {
        ts: new Date().toISOString(),
        version,
        service: 'echo-sdk-gateway',
      },
    } satisfies Envelope<null>,
    404,
  );
});

// ---------------------------------------------------------------------------
// Global error handler
// ---------------------------------------------------------------------------
// F1 FIX: GS343 error reporting
async function reportToGS343(error: string, env: Env) {
  try {
    await fetch('https://echo-gs343.bmcii1976.workers.dev/errors/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Echo-API-Key': env.ECHO_API_KEY || env.API_KEY || '' },
      body: JSON.stringify({ error: error.slice(0, 500), source: 'echo-sdk-gateway', category: 'worker_error' }),
    });
  } catch {} // fire-and-forget
}

app.onError((err, c) => {
  const version = c.env.WORKER_VERSION || '1.0.0';
  const refId = crypto.randomUUID().slice(0, 8);
  console.error(
    JSON.stringify({
      ts: new Date().toISOString(),
      level: 'error',
      component: 'gateway',
      ref_id: refId,
      message: `Unhandled error: ${err.message}`,
      stack: err.stack?.slice(0, 500),
    }),
  );

  // F1: Report to GS343 for auto-healing
  c.executionCtx.waitUntil(reportToGS343(`[${refId}] ${err.message}`, c.env));

  return c.json(
    {
      success: false,
      data: null,
      error: {
        message: `Internal server error (ref: ${refId})`,
        code: 'ECHO_INTERNAL_ERROR',
      },
      meta: {
        ts: new Date().toISOString(),
        version,
        service: 'echo-sdk-gateway',
      },
    } satisfies Envelope<null>,
    500,
  );
});

export default {
  fetch: app.fetch,
  scheduled: handleScheduled,
};
