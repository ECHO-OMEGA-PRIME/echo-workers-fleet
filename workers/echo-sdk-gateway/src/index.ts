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

  const data = {
    status: 'ok',
    service: 'echo-sdk-gateway',
    version,
    timestamp: new Date().toISOString(),
    gateway: 'echo-sdk-gateway',
    services,
    endpoints: {
      engines: 7, brain: 4, knowledge: 2, search: 6, vault: 7,
      worker: 1, sdk: 5, forge: 5, llm: 5, webhooks: 5,
      versioning: 4, agi: 5, compose: 5, data: 4, functions: 4,
      auth: 15, system: 2,
      dedicated_routes: 89,
      passthrough_proxies: {
        'brain-full': '50+ (echo-shared-brain)',
        swarm: '137 (echo-swarm-brain)',
        x200: '23 (echo-x200-swarm-brain)',
        chat: 'all (echo-chat)',
        voice: 'all (echo-speak-cloud)',
        graph: 'all (echo-graph-rag)',
        arcanum: 'all (echo-arcanum)',
        memory: 'all (echo-memory-cortex)',
        mega: 'all (echo-mega-gateway-cloud)',
        fleet: 'all (echo-fleet-commander)',
        orchestrator: 'all (echo-ai-orchestrator)',
        doctrine: 'all (echo-doctrine-forge)',
        'engine-cloud': 'all (echo-engine-cloud)',
        tools: 'all (echo-tool-discovery)',
        marketplace: 'all (echo-forge-marketplace)',
        hephaestion: 'all (hephaestion-forge) — 13-stage competitive pipeline',
        daedalus: 'all (daedalus-forge) — 15 guilds, 1200 agents',
        'forge-x': 'all (forge-x-cloud) — engine factory, 2613 engines',
        'engine-forge': 'all (echo-engine-forge)',
        'app-forge': 'all (echo-app-forge)',
        'worker-forge': 'all (echo-worker-forge)',
        'doctrine-forge': 'all (echo-doctrine-forge)',
        'prompt-forge': 'all (prompt-forge-omega)',
        paypal: 'all (echo-paypal)',
      },
      total_dedicated: 89,
      total_passthrough_workers: 24,
      total_proxied: '800+',
      total_accessible: '900+',
    },
  };

  return c.json(success(data, version));
});

// GET /openapi.json — Self-hosted OpenAPI spec for GPT Actions import
app.get('/openapi.json', (c) => {
  const version = c.env.WORKER_VERSION || '1.0.0';
  const spec = getOpenApiSpec(version);
  return c.json(spec);
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
app.onError((err, c) => {
  const version = c.env.WORKER_VERSION || '1.0.0';
  console.error(
    JSON.stringify({
      ts: new Date().toISOString(),
      level: 'error',
      component: 'gateway',
      message: `Unhandled error: ${err.message}`,
      stack: err.stack?.slice(0, 500),
    }),
  );
  return c.json(
    {
      success: false,
      data: null,
      error: {
        message: 'Internal server error',
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
