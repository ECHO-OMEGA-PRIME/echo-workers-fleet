/**
 * Echo SDK Gateway — Engine Runtime routes.
 *
 * Wraps all echo-engine-runtime endpoints via service binding.
 * 2,660 engines, 510,644 doctrines, 210+ domain categories.
 *
 * Routes:
 *   POST /engine/query         — Query a specific engine by ID (e.g., LG02, TX14, AERO01)
 *   POST /engine/domain        — Query an entire domain category (e.g., ACCT, AERO, AGLAW)
 *   POST /engine/cross-domain  — Cross-domain query across ALL engines
 *   GET  /engine/search        — Search engines by keyword (hybrid keyword + semantic)
 *   GET  /engine/domains       — List all 210+ domain categories with engine counts
 *   GET  /engine/stats         — Full engine runtime statistics
 *   GET  /engine/:id           — Get a specific engine's config and doctrine count
 */

import { Hono } from 'hono';
import type { Env } from '../types';
import { success, error } from '../utils/envelope';
import { proxyBinding, extractQuery, log, getAuthHeaders } from '../utils/proxy';

const engine = new Hono<{ Bindings: Env }>();

// ---------------------------------------------------------------------------
// POST /engine/query — Query a specific engine by ID
// ---------------------------------------------------------------------------
engine.post('/query', async (c) => {
  const version = c.env.WORKER_VERSION || '1.0.0';
  const auth = getAuthHeaders(c.env);
  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return c.json(error('Request body must be valid JSON', 'ECHO_INVALID_INPUT', version), 400);
  }

  const engineId = String(body.engine_id || body.id || '').trim().toUpperCase();
  if (!engineId) {
    return c.json(error("Missing 'engine_id' field (e.g., LG02, TX14, AERO01)", 'ECHO_MISSING_FIELD', version), 400);
  }

  const query = extractQuery(body);
  if (!query) {
    return c.json(error("Missing 'query' field", 'ECHO_MISSING_FIELD', version), 400);
  }

  const mode = String(body.mode || 'FAST').toUpperCase();

  log('info', 'engine.query', `Engine query: ${engineId}`, { engine_id: engineId, mode, query_len: query.length });

  try {
    const result = await proxyBinding(c.env.ENGINE_RUNTIME, `/engine/${engineId}/query`, {
      method: 'POST',
      body: { query, mode },
      headers: auth,
    });

    if (!result.ok) {
      const errData = result.data as Record<string, unknown>;
      return c.json(
        error(String(errData?.error || `Engine ${engineId} query failed`), 'ECHO_ENGINE_ERROR', version, result.latency_ms),
        result.status as 400 | 404 | 500,
      );
    }

    return c.json(success(result.data, version, result.latency_ms));
  } catch (e) {
    log('error', 'engine.query', `Engine query failed: ${engineId}`, { error: String(e) });
    return c.json(error(`Engine query failed: ${String(e).slice(0, 200)}`, 'ECHO_ENGINE_ERROR', version), 500);
  }
});

// ---------------------------------------------------------------------------
// POST /engine/domain — Query an entire domain category
// ---------------------------------------------------------------------------
engine.post('/domain', async (c) => {
  const version = c.env.WORKER_VERSION || '1.0.0';
  const auth = getAuthHeaders(c.env);
  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return c.json(error('Request body must be valid JSON', 'ECHO_INVALID_INPUT', version), 400);
  }

  const category = String(body.domain || body.category || '').trim().toUpperCase();
  if (!category) {
    return c.json(error("Missing 'domain' field (e.g., ACCT, AERO, AGLAW, LG, TX)", 'ECHO_MISSING_FIELD', version), 400);
  }

  const query = extractQuery(body);
  if (!query) {
    return c.json(error("Missing 'query' field", 'ECHO_MISSING_FIELD', version), 400);
  }

  const mode = String(body.mode || 'FAST').toUpperCase();
  const crossDomain = body.cross_domain !== false;

  log('info', 'engine.domain', `Domain query: ${category}`, { category, mode, cross_domain: crossDomain });

  try {
    const result = await proxyBinding(c.env.ENGINE_RUNTIME, `/domain/${category}/query`, {
      method: 'POST',
      body: { query, mode, cross_domain: crossDomain },
      headers: auth,
    });

    if (!result.ok) {
      const errData = result.data as Record<string, unknown>;
      return c.json(
        error(String(errData?.error || `Domain ${category} query failed`), 'ECHO_ENGINE_ERROR', version, result.latency_ms),
        result.status as 400 | 404 | 500,
      );
    }

    return c.json(success(result.data, version, result.latency_ms));
  } catch (e) {
    log('error', 'engine.domain', `Domain query failed: ${category}`, { error: String(e) });
    return c.json(error(`Domain query failed: ${String(e).slice(0, 200)}`, 'ECHO_ENGINE_ERROR', version), 500);
  }
});

// ---------------------------------------------------------------------------
// POST /engine/cross-domain — Cross-domain query across ALL engines
// ---------------------------------------------------------------------------
engine.post('/cross-domain', async (c) => {
  const version = c.env.WORKER_VERSION || '1.0.0';
  const auth = getAuthHeaders(c.env);
  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return c.json(error('Request body must be valid JSON', 'ECHO_INVALID_INPUT', version), 400);
  }

  const query = extractQuery(body);
  if (!query) {
    return c.json(error("Missing 'query' field", 'ECHO_MISSING_FIELD', version), 400);
  }

  const mode = String(body.mode || 'FAST').toUpperCase();
  const limit = Math.min(Number(body.limit) || 15, 50);

  log('info', 'engine.cross-domain', 'Cross-domain query', { mode, limit, query_len: query.length });

  try {
    const result = await proxyBinding(c.env.ENGINE_RUNTIME, '/cross-domain/query', {
      method: 'POST',
      body: { query, mode, limit },
      headers: auth,
    });

    if (!result.ok) {
      const errData = result.data as Record<string, unknown>;
      return c.json(
        error(String(errData?.error || 'Cross-domain query failed'), 'ECHO_ENGINE_ERROR', version, result.latency_ms),
        result.status as 400 | 500,
      );
    }

    return c.json(success(result.data, version, result.latency_ms));
  } catch (e) {
    log('error', 'engine.cross-domain', 'Cross-domain query failed', { error: String(e) });
    return c.json(error(`Cross-domain query failed: ${String(e).slice(0, 200)}`, 'ECHO_ENGINE_ERROR', version), 500);
  }
});

// ---------------------------------------------------------------------------
// GET /engine/search — Search engines by keyword (hybrid keyword + semantic)
// ---------------------------------------------------------------------------
engine.get('/search', async (c) => {
  const version = c.env.WORKER_VERSION || '1.0.0';
  const auth = getAuthHeaders(c.env);
  const q = c.req.query('q') || c.req.query('query') || '';
  if (!q) {
    return c.json(error("Missing 'q' query parameter", 'ECHO_MISSING_FIELD', version), 400);
  }

  const limit = Math.min(Number(c.req.query('limit')) || 10, 50);

  log('info', 'engine.search', 'Engine search', { query: q.slice(0, 80), limit });

  try {
    const result = await proxyBinding(c.env.ENGINE_RUNTIME, `/search?q=${encodeURIComponent(q)}&limit=${limit}`, {
      method: 'GET',
      headers: auth,
    });

    if (!result.ok) {
      const errData = result.data as Record<string, unknown>;
      return c.json(
        error(String(errData?.error || 'Search failed'), 'ECHO_ENGINE_ERROR', version, result.latency_ms),
        result.status as 400 | 500,
      );
    }

    return c.json(success(result.data, version, result.latency_ms));
  } catch (e) {
    log('error', 'engine.search', 'Engine search failed', { error: String(e) });
    return c.json(error(`Engine search failed: ${String(e).slice(0, 200)}`, 'ECHO_ENGINE_ERROR', version), 500);
  }
});

// ---------------------------------------------------------------------------
// GET /engine/domains — List all 210+ domain categories with engine counts
// ---------------------------------------------------------------------------
engine.get('/domains', async (c) => {
  const version = c.env.WORKER_VERSION || '1.0.0';
  const auth = getAuthHeaders(c.env);

  log('info', 'engine.domains', 'Listing all domains');

  try {
    const result = await proxyBinding(c.env.ENGINE_RUNTIME, '/domains', { method: 'GET', headers: auth });

    if (!result.ok) {
      const errData = result.data as Record<string, unknown>;
      return c.json(
        error(String(errData?.error || 'Domains listing failed'), 'ECHO_ENGINE_ERROR', version, result.latency_ms),
        result.status as 500,
      );
    }

    return c.json(success(result.data, version, result.latency_ms));
  } catch (e) {
    log('error', 'engine.domains', 'Domains listing failed', { error: String(e) });
    return c.json(error(`Domains listing failed: ${String(e).slice(0, 200)}`, 'ECHO_ENGINE_ERROR', version), 500);
  }
});

// ---------------------------------------------------------------------------
// GET /engine/stats — Full engine runtime statistics
// ---------------------------------------------------------------------------
engine.get('/stats', async (c) => {
  const version = c.env.WORKER_VERSION || '1.0.0';
  const auth = getAuthHeaders(c.env);

  log('info', 'engine.stats', 'Fetching engine stats');

  try {
    const result = await proxyBinding(c.env.ENGINE_RUNTIME, '/stats', { method: 'GET', headers: auth });

    if (!result.ok) {
      const errData = result.data as Record<string, unknown>;
      return c.json(
        error(String(errData?.error || 'Stats fetch failed'), 'ECHO_ENGINE_ERROR', version, result.latency_ms),
        result.status as 500,
      );
    }

    return c.json(success(result.data, version, result.latency_ms));
  } catch (e) {
    log('error', 'engine.stats', 'Stats fetch failed', { error: String(e) });
    return c.json(error(`Stats fetch failed: ${String(e).slice(0, 200)}`, 'ECHO_ENGINE_ERROR', version), 500);
  }
});

// ---------------------------------------------------------------------------
// GET /engine/:id — Get a specific engine's config and doctrine count
// ---------------------------------------------------------------------------
engine.get('/:id', async (c) => {
  const version = c.env.WORKER_VERSION || '1.0.0';
  const auth = getAuthHeaders(c.env);
  const engineId = c.req.param('id').toUpperCase();

  log('info', 'engine.detail', `Fetching engine detail: ${engineId}`);

  try {
    const result = await proxyBinding(c.env.ENGINE_RUNTIME, `/domains/${engineId}`, { method: 'GET', headers: auth });

    if (result.ok) {
      return c.json(success(result.data, version, result.latency_ms));
    }

    // If that fails (not a domain category), try extracting the category prefix
    const category = engineId.replace(/\d+$/, '');
    if (category !== engineId) {
      const domainResult = await proxyBinding(c.env.ENGINE_RUNTIME, `/domains/${category}`, { method: 'GET', headers: auth });
      if (domainResult.ok) {
        const domainData = domainResult.data as Record<string, unknown>;
        const engines = (domainData?.engines || []) as Array<Record<string, unknown>>;
        const match = engines.find((e) => String(e.engine_id).toUpperCase() === engineId);
        if (match) {
          return c.json(success({ engine: match, domain: domainData }, version, domainResult.latency_ms));
        }
      }
    }

    return c.json(error(`Engine '${engineId}' not found`, 'ECHO_NOT_FOUND', version), 404);
  } catch (e) {
    log('error', 'engine.detail', `Engine detail failed: ${engineId}`, { error: String(e) });
    return c.json(error(`Engine detail failed: ${String(e).slice(0, 200)}`, 'ECHO_ENGINE_ERROR', version), 500);
  }
});

export default engine;
