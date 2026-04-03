/**
 * Echo SDK Gateway — Knowledge Forge routes.
 *
 * Wraps echo-knowledge-forge Worker endpoints via service binding.
 * 5,387 documents, 75K+ chunks, 140+ categories.
 *
 * Routes:
 *   GET  /knowledge/categories — List all knowledge categories with doc counts
 *   POST /knowledge/search     — Search knowledge base by query
 *   POST /knowledge/ingest     — Ingest a new document into the forge
 */

import { Hono } from 'hono';
import type { Env } from '../types';
import { success, error } from '../utils/envelope';
import { proxyBinding, log, getAuthHeaders } from '../utils/proxy';

const knowledge = new Hono<{ Bindings: Env }>();

// ---------------------------------------------------------------------------
// GET /knowledge/categories — List all categories with document counts
// ---------------------------------------------------------------------------
knowledge.get('/categories', async (c) => {
  const version = c.env.WORKER_VERSION || '1.0.0';
  const auth = getAuthHeaders(c.env);

  log('info', 'knowledge.categories', 'Knowledge categories list requested');

  try {
    const result = await proxyBinding(c.env.KNOWLEDGE_FORGE, '/categories', {
      method: 'GET',
      headers: auth,
    });

    if (!result.ok) {
      const errData = result.data as Record<string, unknown>;
      return c.json(
        error(String(errData?.error || 'Failed to fetch knowledge categories'), 'ECHO_KNOWLEDGE_ERROR', version, result.latency_ms),
        result.status as 400 | 500,
      );
    }

    return c.json(success(result.data, version, result.latency_ms));
  } catch (e) {
    log('error', 'knowledge.categories', 'Knowledge categories fetch failed', { error: String(e) });
    return c.json(error(`Knowledge categories fetch failed: ${String(e).slice(0, 200)}`, 'ECHO_KNOWLEDGE_ERROR', version), 500);
  }
});

// ---------------------------------------------------------------------------
// POST /knowledge/search — Search knowledge base
// ---------------------------------------------------------------------------
knowledge.post('/search', async (c) => {
  const version = c.env.WORKER_VERSION || '1.0.0';
  const auth = getAuthHeaders(c.env);
  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return c.json(error('Request body must be valid JSON', 'ECHO_INVALID_INPUT', version), 400);
  }

  const query = String(body.query || body.q || '').trim();
  if (!query) {
    return c.json(error("Missing 'query' field", 'ECHO_MISSING_FIELD', version), 400);
  }

  const category = body.category ? String(body.category).trim() : undefined;
  const limit = Math.min(Number(body.limit) || 10, 50);

  log('info', 'knowledge.search', 'Knowledge search', { query_len: query.length, category, limit });

  try {
    // Knowledge Forge uses GET /search?q=...&limit=...&category=...
    let searchPath = `/search?q=${encodeURIComponent(query)}&limit=${limit}`;
    if (category) searchPath += `&category=${encodeURIComponent(category)}`;

    const result = await proxyBinding(c.env.KNOWLEDGE_FORGE, searchPath, {
      method: 'GET',
      headers: auth,
    });

    if (!result.ok) {
      const errData = result.data as Record<string, unknown>;
      return c.json(
        error(String(errData?.error || 'Knowledge search failed'), 'ECHO_KNOWLEDGE_ERROR', version, result.latency_ms),
        result.status as 400 | 500,
      );
    }

    return c.json(success(result.data, version, result.latency_ms));
  } catch (e) {
    log('error', 'knowledge.search', 'Knowledge search failed', { error: String(e) });
    return c.json(error(`Knowledge search failed: ${String(e).slice(0, 200)}`, 'ECHO_KNOWLEDGE_ERROR', version), 500);
  }
});

// ---------------------------------------------------------------------------
// POST /knowledge/ingest — Ingest a document
// ---------------------------------------------------------------------------
knowledge.post('/ingest', async (c) => {
  const version = c.env.WORKER_VERSION || '1.0.0';
  const auth = getAuthHeaders(c.env);
  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return c.json(error('Request body must be valid JSON', 'ECHO_INVALID_INPUT', version), 400);
  }

  const content = String(body.content || '').trim();
  if (!content) {
    return c.json(error("Missing 'content' field", 'ECHO_MISSING_FIELD', version), 400);
  }

  const title = String(body.title || 'Untitled').trim();
  const category = String(body.category || 'general').trim();
  const source = String(body.source || 'sdk-gateway').trim();
  const tags = Array.isArray(body.tags) ? body.tags : [];

  log('info', 'knowledge.ingest', 'Knowledge ingest', { title, category, content_len: content.length });

  try {
    const result = await proxyBinding(c.env.KNOWLEDGE_FORGE, '/ingest', {
      method: 'POST',
      body: { content, title, category, source, tags },
      headers: auth,
    });

    if (!result.ok) {
      const errData = result.data as Record<string, unknown>;
      return c.json(
        error(String(errData?.error || 'Knowledge ingest failed'), 'ECHO_KNOWLEDGE_ERROR', version, result.latency_ms),
        result.status as 400 | 500,
      );
    }

    return c.json(success(result.data, version, result.latency_ms));
  } catch (e) {
    log('error', 'knowledge.ingest', 'Knowledge ingest failed', { error: String(e) });
    return c.json(error(`Knowledge ingest failed: ${String(e).slice(0, 200)}`, 'ECHO_KNOWLEDGE_ERROR', version), 500);
  }
});

export default knowledge;
