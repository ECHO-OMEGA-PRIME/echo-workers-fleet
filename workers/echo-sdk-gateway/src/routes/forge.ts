/**
 * Echo SDK Gateway — Unified Forge routes.
 *
 * Single gateway for all 8 Echo forges: engine, app, worker, doctrine,
 * hephaestion, daedalus, prompt, and forge-x.
 *
 * Routes:
 *   POST /forge/:forgeId/build       — Proxy build request to target forge
 *   GET  /forge/:forgeId/evolution    — Proxy evolution status from target forge
 *   GET  /forge/status               — Aggregate health of all 8 forges
 *   GET  /forge/evolution/all         — Aggregate evolution state of all 8 forges
 *   POST /forge/fullstack            — Chain multiple forges sequentially
 */

import { Hono } from 'hono';
import type { Env } from '../types';
import { success, error } from '../utils/envelope';
import { proxyBinding, log } from '../utils/proxy';

// ---------------------------------------------------------------------------
// Forge registry — all 8 forges with their endpoints
// ---------------------------------------------------------------------------

interface ForgeEntry {
  url: string;
  buildPath: string;
  method: string;
  evolutionPath: string;
  healthPath: string;
}

const FORGES: Record<string, ForgeEntry> = {
  engine: {
    url: 'https://echo-engine-forge.bmcii1976.workers.dev',
    buildPath: '/forge/build',
    method: 'POST',
    evolutionPath: '/evolution',
    healthPath: '/health',
  },
  app: {
    url: 'https://echo-app-forge.bmcii1976.workers.dev',
    buildPath: '/forge/build',
    method: 'POST',
    evolutionPath: '/evolution',
    healthPath: '/health',
  },
  worker: {
    url: 'https://echo-worker-forge.bmcii1976.workers.dev',
    buildPath: '/forge/build',
    method: 'POST',
    evolutionPath: '/forge/evolution',
    healthPath: '/health',
  },
  doctrine: {
    url: 'https://echo-doctrine-forge.bmcii1976.workers.dev',
    buildPath: '/queue',
    method: 'POST',
    evolutionPath: '/evolution',
    healthPath: '/health',
  },
  hephaestion: {
    url: 'https://hephaestion-forge.bmcii1976.workers.dev',
    buildPath: '/forge',
    method: 'POST',
    evolutionPath: '/evolution',
    healthPath: '/health',
  },
  daedalus: {
    url: 'https://daedalus-forge.bmcii1976.workers.dev',
    buildPath: '/forge/build',
    method: 'POST',
    evolutionPath: '/evolution',
    healthPath: '/health',
  },
  prompt: {
    url: 'https://prompt-forge-omega.bmcii1976.workers.dev',
    buildPath: '/forge',
    method: 'POST',
    evolutionPath: '/evolution',
    healthPath: '/health',
  },
  'forge-x': {
    url: 'https://forge-x-cloud.bmcii1976.workers.dev',
    buildPath: '/build',
    method: 'POST',
    evolutionPath: '/evolution',
    healthPath: '/health',
  },
};

const FORGE_IDS = Object.keys(FORGES);

// ---------------------------------------------------------------------------
// Service binding map — prefer bindings over public URLs (avoids CF 1042)
// ---------------------------------------------------------------------------

function getForgeBinding(forgeId: string, env: Env): Fetcher | null {
  const map: Record<string, Fetcher | undefined> = {
    engine: env.FORGE_ENGINE,
    app: env.FORGE_APP,
    worker: env.FORGE_WORKER,
    doctrine: env.ECHO_DOCTRINE_FORGE, // Already bound in original config
    hephaestion: env.FORGE_HEPHAESTION,
    daedalus: env.FORGE_DAEDALUS,
    prompt: env.FORGE_PROMPT,
    'forge-x': env.FORGE_X,
  };
  return map[forgeId] ?? null;
}

// ---------------------------------------------------------------------------
// Helper — fetch a forge endpoint via service binding (preferred) or external
// ---------------------------------------------------------------------------

async function forgeFetch(
  forgeId: string,
  forge: ForgeEntry,
  path: string,
  opts: {
    method?: string;
    body?: unknown;
    apiKey?: string;
    timeout_ms?: number;
    env?: Env;
  } = {},
): Promise<{ ok: boolean; data: unknown; status: number; latency_ms: number }> {
  const method = opts.method || 'GET';
  const timeout = opts.timeout_ms || 15000;
  const headers: Record<string, string> = {};
  if (opts.apiKey) {
    headers['X-Echo-API-Key'] = opts.apiKey;
  }

  log('info', 'forge.fetch', `${method} ${path}`, { forge: forgeId, path });

  // Prefer service binding (zero latency, no 1042 error)
  const binding = opts.env ? getForgeBinding(forgeId, opts.env) : null;
  if (binding) {
    log('debug', 'forge.fetch', `Using service binding for ${forgeId}`);
    const result = await proxyBinding(binding, path, { method, body: opts.body, headers });
    return { ok: result.ok, data: result.data, status: result.status, latency_ms: result.latency_ms };
  }

  // Fallback to external fetch with timeout
  log('debug', 'forge.fetch', `No binding for ${forgeId}, using external fetch`);
  const start = Date.now();
  const url = `${forge.url}${path}`;

  const fetchHeaders: Record<string, string> = { 'Content-Type': 'application/json', ...headers };
  const fetchOpts: RequestInit = {
    method,
    headers: fetchHeaders,
    signal: AbortSignal.timeout(timeout),
  };
  if (opts.body && method !== 'GET') {
    fetchOpts.body = JSON.stringify(opts.body);
  }

  const resp = await fetch(url, fetchOpts);
  const latency_ms = Date.now() - start;

  let data: unknown;
  const ct = resp.headers.get('Content-Type') || '';
  if (ct.includes('application/json')) {
    data = await resp.json();
  } else {
    data = await resp.text();
  }

  return { ok: resp.ok, data, status: resp.status, latency_ms };
}

// ---------------------------------------------------------------------------
// Forge route module
// ---------------------------------------------------------------------------

const forge = new Hono<{ Bindings: Env }>();

// ---------------------------------------------------------------------------
// GET /forge/status — Aggregate health of all 8 forges
// (static route BEFORE parameterized to avoid Hono matching issues)
// ---------------------------------------------------------------------------
forge.get('/status', async (c) => {
  const version = c.env.WORKER_VERSION || '1.0.0';
  const start = Date.now();

  log('info', 'forge.status', 'Aggregating health from all 8 forges');

  const results: Record<string, unknown> = {};

  const settled = await Promise.allSettled(
    FORGE_IDS.map(async (id) => {
      const f = FORGES[id];
      try {
        const res = await forgeFetch(id, f, f.healthPath, { timeout_ms: 5000, env: c.env });
        results[id] = { status: res.ok ? 'healthy' : 'unhealthy', latency_ms: res.latency_ms, data: res.data };
      } catch (e) {
        results[id] = { status: 'unreachable', error: String(e).slice(0, 200) };
      }
    }),
  );

  const healthy = Object.values(results).filter((r: any) => r.status === 'healthy').length;
  const total_ms = Date.now() - start;

  log('info', 'forge.status', `Health check complete: ${healthy}/${FORGE_IDS.length} healthy`, { latency_ms: total_ms });

  return c.json(
    success(
      {
        forges: results,
        summary: { total: FORGE_IDS.length, healthy, unhealthy: FORGE_IDS.length - healthy },
      },
      version,
      total_ms,
    ),
  );
});

// ---------------------------------------------------------------------------
// GET /forge/evolution/all — Aggregate evolution state of all 8 forges
// (static route BEFORE parameterized)
// ---------------------------------------------------------------------------
forge.get('/evolution/all', async (c) => {
  const version = c.env.WORKER_VERSION || '1.0.0';
  const apiKey = c.env.API_KEY || c.env.ECHO_API_KEY || '';
  const start = Date.now();

  log('info', 'forge.evolution.all', 'Aggregating evolution state from all 8 forges');

  const evolutions: Record<string, unknown> = {};

  await Promise.allSettled(
    FORGE_IDS.map(async (id) => {
      const f = FORGES[id];
      try {
        const res = await forgeFetch(id, f, f.evolutionPath, { apiKey, timeout_ms: 10000, env: c.env });
        evolutions[id] = { ok: res.ok, data: res.data, latency_ms: res.latency_ms };
      } catch (e) {
        evolutions[id] = { ok: false, error: String(e).slice(0, 200) };
      }
    }),
  );

  const total_ms = Date.now() - start;

  log('info', 'forge.evolution.all', 'Evolution aggregation complete', { latency_ms: total_ms });

  return c.json(
    success(
      {
        forges: evolutions,
        timestamp: new Date().toISOString(),
        forge_count: FORGE_IDS.length,
      },
      version,
      total_ms,
    ),
  );
});

// ---------------------------------------------------------------------------
// POST /forge/fullstack — Chain multiple forges sequentially
// ---------------------------------------------------------------------------
forge.post('/fullstack', async (c) => {
  const version = c.env.WORKER_VERSION || '1.0.0';
  const apiKey = c.env.API_KEY || c.env.ECHO_API_KEY || '';
  const start = Date.now();

  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return c.json(error('Request body must be valid JSON', 'ECHO_INVALID_INPUT', version), 400);
  }

  const stages = body.stages as string[] | undefined;
  if (!stages || !Array.isArray(stages) || stages.length === 0) {
    return c.json(
      error(
        "Missing 'stages' array (e.g., ['engine', 'doctrine', 'hephaestion'])",
        'ECHO_MISSING_FIELD',
        version,
      ),
      400,
    );
  }

  // Validate all stages exist in registry
  for (const stageId of stages) {
    if (!FORGES[stageId]) {
      return c.json(
        error(
          `Unknown forge '${stageId}'. Valid: ${FORGE_IDS.join(', ')}`,
          'ECHO_INVALID_FORGE',
          version,
        ),
        400,
      );
    }
  }

  log('info', 'forge.fullstack', `Full-stack build: ${stages.join(' → ')}`, {
    engine_id: body.engine_id,
    stages,
  });

  const results: Array<{ stage: string; ok: boolean; data: unknown; latency_ms: number }> = [];
  let context: Record<string, unknown> = { ...body };
  delete context.stages; // Don't forward the stages array itself

  for (const stageId of stages) {
    const f = FORGES[stageId];
    try {
      // Pass accumulated context from previous stages
      const payload = { ...context, _previous_stages: results.map((r) => ({ stage: r.stage, data: r.data })) };

      const res = await forgeFetch(stageId, f, f.buildPath, {
        method: f.method,
        body: payload,
        apiKey,
        timeout_ms: 15000,
        env: c.env,
      });

      results.push({ stage: stageId, ok: res.ok, data: res.data, latency_ms: res.latency_ms });

      // Merge forge output into context for next stage
      if (res.ok && typeof res.data === 'object' && res.data !== null) {
        context = { ...context, [`${stageId}_output`]: res.data };
      }

      if (!res.ok) {
        log('warn', 'forge.fullstack', `Stage '${stageId}' failed, aborting pipeline`, {
          status: res.status,
        });
        const total_ms = Date.now() - start;
        return c.json(
          success(
            {
              pipeline: 'failed',
              failed_stage: stageId,
              completed_stages: results.filter((r) => r.ok).map((r) => r.stage),
              results,
            },
            version,
            total_ms,
          ),
        );
      }
    } catch (e) {
      const msg = String(e).slice(0, 200);
      results.push({ stage: stageId, ok: false, data: { error: msg }, latency_ms: Date.now() - start });

      log('error', 'forge.fullstack', `Stage '${stageId}' threw: ${msg}`);
      const total_ms = Date.now() - start;
      return c.json(
        success(
          {
            pipeline: 'error',
            failed_stage: stageId,
            completed_stages: results.filter((r) => r.ok).map((r) => r.stage),
            results,
          },
          version,
          total_ms,
        ),
      );
    }
  }

  const total_ms = Date.now() - start;

  log('info', 'forge.fullstack', `Full-stack build complete: ${stages.length} stages`, { latency_ms: total_ms });

  return c.json(
    success(
      {
        pipeline: 'complete',
        stages: stages,
        results,
      },
      version,
      total_ms,
    ),
  );
});

// ---------------------------------------------------------------------------
// POST /forge/:forgeId/build — Proxy build request to target forge
// ---------------------------------------------------------------------------
forge.post('/:forgeId/build', async (c) => {
  const version = c.env.WORKER_VERSION || '1.0.0';
  const forgeId = c.req.param('forgeId');
  const apiKey = c.env.API_KEY || c.env.ECHO_API_KEY || '';

  const f = FORGES[forgeId];
  if (!f) {
    return c.json(
      error(`Unknown forge '${forgeId}'. Valid: ${FORGE_IDS.join(', ')}`, 'ECHO_INVALID_FORGE', version),
      400,
    );
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json(error('Request body must be valid JSON', 'ECHO_INVALID_INPUT', version), 400);
  }

  log('info', 'forge.build', `Build request to ${forgeId}`, { forge: forgeId });

  try {
    const res = await forgeFetch(forgeId, f, f.buildPath, {
      method: f.method,
      body,
      apiKey,
      timeout_ms: 15000,
      env: c.env,
    });

    const payload = {
      gateway: true,
      forge: forgeId,
      ...(typeof res.data === 'object' && res.data !== null ? (res.data as Record<string, unknown>) : { raw: res.data }),
    };

    if (!res.ok) {
      log('warn', 'forge.build', `Forge '${forgeId}' build returned ${res.status}`, { latency_ms: res.latency_ms });
      return c.json(error(`Forge '${forgeId}' build failed`, 'ECHO_FORGE_BUILD_ERROR', version, res.latency_ms), res.status as 400 | 500);
    }

    return c.json(success(payload, version, res.latency_ms));
  } catch (e) {
    const msg = String(e);
    if (msg.includes('TimeoutError') || msg.includes('aborted')) {
      log('warn', 'forge.build', `Forge '${forgeId}' build timed out`);
      return c.json(error(`Forge '${forgeId}' build timed out after 15s`, 'ECHO_TIMEOUT', version), 504);
    }
    log('error', 'forge.build', `Forge '${forgeId}' build error: ${msg.slice(0, 200)}`);
    return c.json(error(`Forge build error: ${msg.slice(0, 200)}`, 'ECHO_FORGE_ERROR', version), 500);
  }
});

// ---------------------------------------------------------------------------
// GET /forge/:forgeId/evolution — Proxy evolution status from target forge
// ---------------------------------------------------------------------------
forge.get('/:forgeId/evolution', async (c) => {
  const version = c.env.WORKER_VERSION || '1.0.0';
  const forgeId = c.req.param('forgeId');
  const apiKey = c.env.API_KEY || c.env.ECHO_API_KEY || '';

  const f = FORGES[forgeId];
  if (!f) {
    return c.json(
      error(`Unknown forge '${forgeId}'. Valid: ${FORGE_IDS.join(', ')}`, 'ECHO_INVALID_FORGE', version),
      400,
    );
  }

  log('info', 'forge.evolution', `Evolution query for ${forgeId}`, { forge: forgeId });

  try {
    const res = await forgeFetch(forgeId, f, f.evolutionPath, { apiKey, timeout_ms: 10000, env: c.env });

    if (!res.ok) {
      return c.json(error(`Forge '${forgeId}' evolution query failed`, 'ECHO_FORGE_ERROR', version, res.latency_ms), res.status as 400 | 500);
    }

    return c.json(success(res.data, version, res.latency_ms));
  } catch (e) {
    const msg = String(e);
    if (msg.includes('TimeoutError') || msg.includes('aborted')) {
      return c.json(error(`Forge '${forgeId}' evolution timed out`, 'ECHO_TIMEOUT', version), 504);
    }
    log('error', 'forge.evolution', `Forge '${forgeId}' evolution error: ${msg.slice(0, 200)}`);
    return c.json(error(`Forge evolution error: ${msg.slice(0, 200)}`, 'ECHO_FORGE_ERROR', version), 500);
  }
});

// ---------------------------------------------------------------------------
// GET /forge/builds — Alias for /forge/status (CLI compatibility)
// ---------------------------------------------------------------------------
forge.get('/builds', async (c) => {
  const version = c.env.WORKER_VERSION || '1.0.0';
  const apiKey = c.env.API_KEY || c.env.ECHO_API_KEY || '';
  const start = Date.now();

  const results: Record<string, unknown> = {};

  await Promise.allSettled(
    Object.entries(FORGES).map(async ([id, cfg]) => {
      try {
        const res = await forgeFetch(id, cfg, cfg.healthPath, { apiKey, timeout_ms: 5000, env: c.env });
        results[id] = { status: res.ok ? 'healthy' : 'error', data: res.data };
      } catch (e) {
        results[id] = { status: 'error', message: String(e).slice(0, 100) };
      }
    }),
  );

  return c.json(success({ forges: results, total: Object.keys(FORGES).length }, version, Date.now() - start));
});

export default forge;
