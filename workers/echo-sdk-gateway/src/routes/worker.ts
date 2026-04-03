/**
 * Echo SDK Gateway — Generic Worker call route.
 *
 * Proxies requests to any Echo Worker by name.
 *
 * Cloudflare Workers cannot call other same-account Workers via public URL
 * (triggers error 1042 "Worker subrequest loop"). The fix: use service bindings
 * for known workers, fall back to external fetch for unconfigured workers.
 *
 * Routes:
 *   POST /worker/call — Call any Echo Worker endpoint
 */

import { Hono } from 'hono';
import type { Env } from '../types';
import { success, error } from '../utils/envelope';
import { proxyBinding, proxyExternal, log } from '../utils/proxy';

const worker = new Hono<{ Bindings: Env }>();

// Allowed worker domains (security: prevent SSRF to arbitrary URLs)
const ALLOWED_DOMAINS = [
  '.bmcii1976.workers.dev',
  '.echo-op.com',
];

function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_DOMAINS.some((d) => parsed.hostname.endsWith(d));
  } catch {
    return false;
  }
}

/**
 * Map worker name → service binding.
 *
 * Cloudflare blocks same-account Worker→Worker via public URL (error 1042).
 * Workers listed here are bound as services in wrangler.toml and will be
 * called via the internal binding (zero latency, no HTTP hop).
 *
 * For any worker NOT in this map, /worker/call will use external fetch,
 * which works for workers in different accounts or truly external URLs.
 */
function getBinding(workerName: string, env: Env): Fetcher | null {
  const map: Record<string, Fetcher | undefined> = {
    // Core bindings (always present)
    'echo-engine-runtime': env.ENGINE_RUNTIME,
    'echo-shared-brain': env.SHARED_BRAIN,
    'echo-knowledge-forge': env.KNOWLEDGE_FORGE,
    'echo-vault-api': env.VAULT_API,
    'echo-graph-rag': env.GRAPH_RAG,
    // Additional optional bindings
    'echo-chat': env.ECHO_CHAT,
    'echo-speak-cloud': env.ECHO_SPEAK_CLOUD,
    'echo-swarm-brain': env.ECHO_SWARM_BRAIN,
    'echo-engine-cloud': env.ECHO_ENGINE_CLOUD,
    'echo-doctrine-forge': env.ECHO_DOCTRINE_FORGE,
    'echo-ai-orchestrator': env.ECHO_AI_ORCHESTRATOR,
    'echo-x200-swarm-brain': env.ECHO_X200_SWARM,
    'echo-arcanum': env.ECHO_ARCANUM,
    'echo-mega-gateway-cloud': env.ECHO_MEGA_GATEWAY,
    'echo-memory-cortex': env.ECHO_MEMORY_CORTEX,
    'echo-fleet-commander': env.ECHO_FLEET_COMMANDER,
    'echo-tool-discovery': env.TOOL_DISCOVERY,
    'echo-forge-marketplace': env.FORGE_MARKETPLACE,
  };
  return map[workerName] ?? null;
}

// ---------------------------------------------------------------------------
// POST /worker/call — Call any Echo Worker endpoint
// ---------------------------------------------------------------------------
worker.post('/call', async (c) => {
  const version = c.env.WORKER_VERSION || '1.0.0';
  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return c.json(error('Request body must be valid JSON', 'ECHO_INVALID_INPUT', version), 400);
  }

  const workerName = String(body.worker || '').trim();
  const path = String(body.path || '/').trim();
  const method = String(body.method || 'GET').toUpperCase();

  if (!workerName) {
    return c.json(
      error("Missing 'worker' field (e.g., 'echo-chat', 'echo-speak-cloud')", 'ECHO_MISSING_FIELD', version),
      400,
    );
  }

  // Build the full URL (used for allowed-domain check and external fallback)
  let url: string;
  if (workerName.startsWith('https://')) {
    url = workerName + path;
  } else {
    url = `https://${workerName}.bmcii1976.workers.dev${path}`;
  }

  if (!isAllowedUrl(url)) {
    return c.json(error('Worker URL not in allowed domain list', 'ECHO_FORBIDDEN', version), 403);
  }

  const requestBody = body.body as Record<string, unknown> | undefined;
  const timeout = Math.min(Number(body.timeout_ms) || 15000, 30000);
  const apiKey = c.env.API_KEY || c.env.ECHO_API_KEY || '';

  log('info', 'worker.call', `Worker call: ${workerName}${path}`, { method, worker: workerName, path });

  try {
    // Prefer service binding to avoid same-account public URL error (CF 1042)
    const binding = getBinding(workerName, c.env);

    if (binding) {
      log('debug', 'worker.call', `Using service binding for ${workerName}`);
      const result = await proxyBinding(binding, path, {
        method,
        body: requestBody,
        headers: { 'X-Echo-API-Key': apiKey },
      });

      if (!result.ok) {
        const errData = result.data as Record<string, unknown>;
        return c.json(
          error(
            String(errData?.error || `Worker call to ${workerName} failed`),
            'ECHO_WORKER_ERROR',
            version,
            result.latency_ms,
          ),
          result.status as 400 | 404 | 500,
        );
      }

      return c.json(success(result.data, version, result.latency_ms));
    }

    // No service binding found — use external fetch (works for cross-account workers)
    log('debug', 'worker.call', `No service binding for ${workerName}, using external fetch`);
    const result = await proxyExternal(url, {
      method,
      body: requestBody,
      headers: { 'X-Echo-API-Key': apiKey },
      timeout_ms: timeout,
    });

    if (!result.ok) {
      const errData = result.data as Record<string, unknown>;
      return c.json(
        error(
          String(errData?.error || `Worker call to ${workerName} failed`),
          'ECHO_WORKER_ERROR',
          version,
          result.latency_ms,
        ),
        result.status as 400 | 404 | 500,
      );
    }

    return c.json(success(result.data, version, result.latency_ms));
  } catch (e) {
    const msg = String(e);
    if (msg.includes('TimeoutError') || msg.includes('aborted')) {
      log('warn', 'worker.call', `Worker call timed out: ${workerName}`, { timeout_ms: timeout });
      return c.json(error(`Worker call to ${workerName} timed out after ${timeout}ms`, 'ECHO_TIMEOUT', version), 504);
    }
    log('error', 'worker.call', `Worker call failed: ${workerName}`, { error: msg });
    return c.json(error(`Worker call failed: ${msg.slice(0, 200)}`, 'ECHO_WORKER_ERROR', version), 500);
  }
});

export default worker;
