/**
 * Echo SDK Gateway — Unified Service Proxy Route
 *
 * Exposes the entire fleet of Cloudflare Workers through a single
 * route group: /services/{worker-name}/{path}
 *
 * Features:
 *   - Dynamic routing to any fleet worker via service bindings
 *   - Per-tenant-per-service rate limiting (KV-backed)
 *   - Full request forwarding (method, headers, body)
 *   - Automatic X-Echo-API-Key injection for outbound calls
 *   - Service catalog with GET /services
 *   - Scope-based access control per service
 *
 * Deploy: mounted at /services in index.ts
 */

import { Hono } from 'hono';
import type { Env, AuthVariables } from '../types';
import { success, error } from '../utils/envelope';

// ---------------------------------------------------------------------------
// Service registry — maps URL slug to binding accessor + metadata
// ---------------------------------------------------------------------------

interface ServiceDef {
  /** Human-readable description shown in the catalog */
  description: string;
  /** Function to resolve the Fetcher from the Worker env */
  getBinding: (env: Env) => Fetcher | undefined;
  /** Cloudflare Worker name (for logging / headers) */
  workerName: string;
  /** Required scope to access this service (checked against tenant scopes) */
  requiredScope: string;
  /** Per-tenant requests per minute (0 = use global default) */
  rateLimit: number;
  /** Whether the service is considered stable */
  status: 'stable' | 'beta' | 'experimental';
}

const SERVICE_REGISTRY: Record<string, ServiceDef> = {
  'shared-brain': {
    description: 'Universal context manager — memory, todos, policies, facts, broadcasts',
    getBinding: (env) => env.SHARED_BRAIN,
    workerName: 'echo-shared-brain',
    requiredScope: 'brain',
    rateLimit: 120,
    status: 'stable',
  },
  'fleet-commander': {
    description: 'Fleet monitoring, worker health, and command dispatch',
    getBinding: (env) => env.ECHO_FLEET_COMMANDER,
    workerName: 'echo-fleet-commander',
    requiredScope: 'fleet',
    rateLimit: 60,
    status: 'stable',
  },
  'graph-rag': {
    description: 'Knowledge graph queries — entity search, traversal, RAG retrieval',
    getBinding: (env) => env.GRAPH_RAG,
    workerName: 'echo-graph-rag',
    requiredScope: 'knowledge',
    rateLimit: 60,
    status: 'stable',
  },
  'doctrine-forge': {
    description: 'Doctrine forging engine — create, query, and manage doctrine blocks',
    getBinding: (env) => env.ECHO_DOCTRINE_FORGE,
    workerName: 'echo-doctrine-forge',
    requiredScope: 'forge',
    rateLimit: 60,
    status: 'stable',
  },
  'arcanum': {
    description: 'Prompt template library — 370+ templates, forge DNA, template search',
    getBinding: (env) => env.ECHO_ARCANUM,
    workerName: 'echo-arcanum',
    requiredScope: 'templates',
    rateLimit: 60,
    status: 'stable',
  },
  'mega-gateway': {
    description: 'Tool and MCP server gateway — 1,878 servers, 36,330+ tools',
    getBinding: (env) => env.ECHO_MEGA_GATEWAY,
    workerName: 'echo-mega-gateway-cloud',
    requiredScope: 'tools',
    rateLimit: 30,
    status: 'stable',
  },
  'speak-cloud': {
    description: 'Text-to-speech and voice synthesis — 39 voices, MP3/WAV output',
    getBinding: (env) => env.ECHO_SPEAK_CLOUD,
    workerName: 'echo-speak-cloud',
    requiredScope: 'voice',
    rateLimit: 30,
    status: 'stable',
  },
  'vault-api': {
    description: 'Credential vault — store, retrieve, search secrets securely',
    getBinding: (env) => env.VAULT_API,
    workerName: 'echo-vault-api',
    requiredScope: 'vault',
    rateLimit: 30,
    status: 'stable',
  },
  'build-orchestrator': {
    description: 'Build pipeline management — trigger, track, gate builds',
    getBinding: (env) => env.ECHO_AI_ORCHESTRATOR,
    workerName: 'echo-ai-orchestrator',
    requiredScope: 'builds',
    rateLimit: 30,
    status: 'stable',
  },
  'omniscient-sync': {
    description: 'Cross-instance synchronization — todos, memory, broadcasts, policies',
    getBinding: (env) => env.SHARED_BRAIN,
    workerName: 'echo-shared-brain',
    requiredScope: 'sync',
    rateLimit: 60,
    status: 'stable',
  },
  'relay': {
    description: 'Event bus and message relay — cross-worker pub/sub',
    getBinding: (env) => env.ECHO_SWARM_BRAIN,
    workerName: 'echo-swarm-brain',
    requiredScope: 'events',
    rateLimit: 120,
    status: 'stable',
  },
  'sentinel-agent': {
    description: 'Security agent — threat detection, audit, policy enforcement',
    getBinding: (env) => env.ECHO_SWARM_BRAIN,
    workerName: 'echo-swarm-brain',
    requiredScope: 'security',
    rateLimit: 30,
    status: 'beta',
  },
  'swarm-brain': {
    description: 'Swarm coordination — 137 endpoints, consensus, task assignment',
    getBinding: (env) => env.ECHO_SWARM_BRAIN,
    workerName: 'echo-swarm-brain',
    requiredScope: 'swarm',
    rateLimit: 60,
    status: 'stable',
  },
  'gs343': {
    description: 'Error template database — 45,962 templates, auto-healing patterns',
    getBinding: (env) => env.KNOWLEDGE_FORGE,
    workerName: 'echo-knowledge-forge',
    requiredScope: 'errors',
    rateLimit: 60,
    status: 'stable',
  },
  'engine-runtime': {
    description: 'Engine execution — query 2,660+ intelligence engines, domain search',
    getBinding: (env) => env.ENGINE_RUNTIME,
    workerName: 'echo-engine-runtime',
    requiredScope: 'engines',
    rateLimit: 120,
    status: 'stable',
  },
};

// All valid service slugs (precomputed for fast lookup)
const VALID_SERVICES = new Set(Object.keys(SERVICE_REGISTRY));

// Default per-tenant-per-service rate limit window
const SERVICE_RL_WINDOW_SECONDS = 60;

// ---------------------------------------------------------------------------
// Per-tenant-per-service rate limiter
// ---------------------------------------------------------------------------

async function checkServiceRateLimit(
  kv: KVNamespace | undefined,
  tenantId: string,
  serviceName: string,
  limit: number,
): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  if (!kv || limit <= 0) {
    return { allowed: true, remaining: limit, limit };
  }

  const window = Math.floor(Date.now() / (SERVICE_RL_WINDOW_SECONDS * 1000));
  const key = `svc-rl:${tenantId}:${serviceName}:${window}`;

  const current = parseInt((await kv.get(key)) || '0', 10);
  if (current >= limit) {
    return { allowed: false, remaining: 0, limit };
  }

  await kv.put(key, String(current + 1), { expirationTtl: SERVICE_RL_WINDOW_SECONDS * 2 });
  return { allowed: true, remaining: limit - current - 1, limit };
}

// ---------------------------------------------------------------------------
// Scope checker
// ---------------------------------------------------------------------------

function hasScope(tenantScopes: string[], required: string): boolean {
  // Wildcard scope grants everything
  if (tenantScopes.includes('*')) return true;
  // Direct match
  if (tenantScopes.includes(required)) return true;
  // services:* grants all service scopes
  if (tenantScopes.includes('services:*')) return true;
  // services:{scope} specific
  if (tenantScopes.includes(`services:${required}`)) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Build forward headers
// ---------------------------------------------------------------------------

function buildForwardHeaders(c: { req: { header: (name: string) => string | undefined }; env: Env }): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': c.req.header('content-type') || 'application/json',
    'X-Echo-API-Key': c.env.API_KEY || c.env.ECHO_API_KEY || '',
    'X-Forwarded-By': 'echo-sdk-gateway',
    'X-Forwarded-Service': 'services-proxy',
  };

  // Forward select client headers
  const forwardable = ['Accept', 'Accept-Language', 'X-Request-ID', 'X-Correlation-ID'];
  for (const name of forwardable) {
    const val = c.req.header(name);
    if (val) headers[name] = val;
  }

  return headers;
}

// ---------------------------------------------------------------------------
// Route: GET /services — Service catalog
// ---------------------------------------------------------------------------

const services = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

services.get('/', (c) => {
  const version = c.env.WORKER_VERSION || '1.0.0';
  const tenantScopes = c.get('auth_scopes') || [];

  const catalog = Object.entries(SERVICE_REGISTRY).map(([slug, def]) => ({
    name: slug,
    description: def.description,
    worker: def.workerName,
    status: def.status,
    rate_limit: `${def.rateLimit} req/min per tenant`,
    required_scope: def.requiredScope,
    accessible: hasScope(tenantScopes, def.requiredScope),
    endpoint: `/services/${slug}/{path}`,
  }));

  return c.json(success({
    total_services: catalog.length,
    accessible: catalog.filter((s) => s.accessible).length,
    services: catalog,
  }, version));
});

// ---------------------------------------------------------------------------
// Route: GET /services/:name — Single service info + health probe
// ---------------------------------------------------------------------------

services.get('/:name', async (c) => {
  const version = c.env.WORKER_VERSION || '1.0.0';
  const name = c.req.param('name');

  if (!VALID_SERVICES.has(name)) {
    return c.json(error(
      `Unknown service: ${name}. Available: ${[...VALID_SERVICES].join(', ')}`,
      'ECHO_SERVICE_NOT_FOUND',
      version,
    ), 404);
  }

  const def = SERVICE_REGISTRY[name];
  const binding = def.getBinding(c.env);
  let health = 'unknown';

  if (binding) {
    try {
      const resp = await binding.fetch('https://internal/health', {
        headers: { 'X-Echo-API-Key': c.env.API_KEY || c.env.ECHO_API_KEY || '' },
      });
      health = resp.ok ? 'healthy' : `error:${resp.status}`;
    } catch {
      health = 'unreachable';
    }
  } else {
    health = 'no_binding';
  }

  return c.json(success({
    name,
    description: def.description,
    worker: def.workerName,
    status: def.status,
    health,
    rate_limit: `${def.rateLimit} req/min per tenant`,
    required_scope: def.requiredScope,
    endpoint: `/services/${name}/{path}`,
  }, version));
});

// ---------------------------------------------------------------------------
// Route: ALL /services/:name/* — Proxy to target worker
// ---------------------------------------------------------------------------

services.all('/:name/*', async (c) => {
  const version = c.env.WORKER_VERSION || '1.0.0';
  const name = c.req.param('name');

  // ── Validate service exists ──────────────────────────────────────────────
  if (!VALID_SERVICES.has(name)) {
    return c.json(error(
      `Unknown service: ${name}. Use GET /services for the catalog.`,
      'ECHO_SERVICE_NOT_FOUND',
      version,
    ), 404);
  }

  const def = SERVICE_REGISTRY[name];

  // ── Scope check ──────────────────────────────────────────────────────────
  const tenantScopes = c.get('auth_scopes') || [];
  if (!hasScope(tenantScopes, def.requiredScope)) {
    return c.json(error(
      `Insufficient scope for service '${name}'. Required: '${def.requiredScope}'. Your scopes: [${tenantScopes.join(', ')}]`,
      'ECHO_SCOPE_DENIED',
      version,
    ), 403);
  }

  // ── Per-tenant-per-service rate limit ────────────────────────────────────
  const tenantId = c.get('auth_tenant_id') || 'unknown';
  const rl = await checkServiceRateLimit(c.env.RATE_LIMIT, tenantId, name, def.rateLimit);

  c.header('X-Service-RateLimit-Limit', String(rl.limit));
  c.header('X-Service-RateLimit-Remaining', String(rl.remaining));
  c.header('X-Service-Name', name);

  if (!rl.allowed) {
    return c.json(error(
      `Service rate limit exceeded for '${name}'. Max ${rl.limit} requests per ${SERVICE_RL_WINDOW_SECONDS}s.`,
      'ECHO_SERVICE_RATE_LIMIT',
      version,
    ), 429);
  }

  // ── Resolve service binding ──────────────────────────────────────────────
  const binding = def.getBinding(c.env);
  if (!binding) {
    return c.json(error(
      `Service binding for '${name}' (${def.workerName}) is not available`,
      'ECHO_BINDING_MISSING',
      version,
    ), 503);
  }

  // ── Build target URL (strip /services/:name prefix) ─────────────────────
  const url = new URL(c.req.url);
  const prefixPattern = `/services/${name}`;
  const targetPath = url.pathname.slice(prefixPattern.length) || '/';
  const fullPath = targetPath + url.search;

  // ── Forward the request ──────────────────────────────────────────────────
  const start = Date.now();
  try {
    const fetchOpts: RequestInit = {
      method: c.req.method,
      headers: buildForwardHeaders(c as any),
    };

    // Forward body for non-GET/HEAD requests
    if (c.req.method !== 'GET' && c.req.method !== 'HEAD') {
      try {
        const body = await c.req.text();
        if (body) fetchOpts.body = body;
      } catch { /* no body — that's fine */ }
    }

    const resp = await binding.fetch(`https://internal${fullPath}`, fetchOpts);
    const latency_ms = Date.now() - start;

    // ── Return the response ──────────────────────────────────────────────
    const contentType = resp.headers.get('Content-Type') || '';

    if (contentType.includes('application/json')) {
      const data = await resp.json();

      // If the worker already wraps in our envelope, return directly
      if (typeof data === 'object' && data !== null && 'success' in (data as Record<string, unknown>)) {
        // Inject gateway metadata into existing envelope
        const envelope = data as Record<string, unknown>;
        if (typeof envelope.meta === 'object' && envelope.meta !== null) {
          (envelope.meta as Record<string, unknown>).gateway_latency_ms = Math.round(latency_ms * 100) / 100;
          (envelope.meta as Record<string, unknown>).proxied_service = name;
        }
        return c.json(data, resp.status as any);
      }

      // Wrap raw worker response in our envelope
      return c.json(
        resp.ok
          ? success(data, version, latency_ms)
          : error(
              String((data as Record<string, unknown>)?.error || 'Worker error'),
              'ECHO_WORKER_ERROR',
              version,
              latency_ms,
            ),
        resp.status as any,
      );
    }

    // Non-JSON response (audio, binary, images, etc) — pass through directly
    return new Response(resp.body, {
      status: resp.status,
      headers: {
        'Content-Type': contentType,
        'X-Latency-Ms': String(latency_ms),
        'X-Proxied-By': 'echo-sdk-gateway',
        'X-Service': name,
        'X-Worker': def.workerName,
      },
    });
  } catch (e) {
    const latency_ms = Date.now() - start;
    return c.json(
      error(
        `Proxy to service '${name}' (${def.workerName}) failed: ${String(e).slice(0, 200)}`,
        'ECHO_PROXY_ERROR',
        version,
        latency_ms,
      ),
      502,
    );
  }
});

export default services;
