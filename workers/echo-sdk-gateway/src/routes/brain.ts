/**
 * Echo SDK Gateway — Shared Brain routes.
 *
 * Wraps echo-shared-brain Worker endpoints via service binding.
 *
 * Routes:
 *   POST /brain/search    — Semantic search across all memory
 *   POST /brain/ingest    — Store a memory (decision, fact, event)
 *   POST /brain/context   — Get conversation context for an instance
 *   POST /brain/heartbeat — Register instance heartbeat
 */

import { Hono } from 'hono';
import type { Env } from '../types';
import { success, error } from '../utils/envelope';
import { proxyBinding, log, getAuthHeaders } from '../utils/proxy';

const brain = new Hono<{ Bindings: Env }>();

// ---------------------------------------------------------------------------
// POST /brain/search — Semantic search across all memory
// ---------------------------------------------------------------------------
brain.post('/search', async (c) => {
  const version = c.env.WORKER_VERSION || '1.0.0';
  const auth = getAuthHeaders(c.env);
  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return c.json(error('Request body must be valid JSON', 'ECHO_INVALID_INPUT', version), 400);
  }

  const query = String(body.query || '').trim();
  if (!query) {
    return c.json(error("Missing 'query' field", 'ECHO_MISSING_FIELD', version), 400);
  }

  const limit = Math.min(Number(body.limit) || 10, 50);

  log('info', 'brain.search', 'Brain search', { query_len: query.length, limit });

  try {
    const result = await proxyBinding(c.env.SHARED_BRAIN, '/search', {
      method: 'POST',
      body: { query, limit },
      headers: auth,
    });

    if (!result.ok) {
      const errData = result.data as Record<string, unknown>;
      return c.json(
        error(String(errData?.error || 'Brain search failed'), 'ECHO_BRAIN_ERROR', version, result.latency_ms),
        result.status as 400 | 500,
      );
    }

    return c.json(success(result.data, version, result.latency_ms));
  } catch (e) {
    log('error', 'brain.search', 'Brain search failed', { error: String(e) });
    return c.json(error(`Brain search failed: ${String(e).slice(0, 200)}`, 'ECHO_BRAIN_ERROR', version), 500);
  }
});

// ---------------------------------------------------------------------------
// POST /brain/ingest — Store a memory
// ---------------------------------------------------------------------------
brain.post('/ingest', async (c) => {
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

  const instanceId = String(body.instance_id || 'echo-sdk-gateway');
  const role = String(body.role || 'assistant');
  const importance = Math.min(Math.max(Number(body.importance) || 5, 1), 10);
  const tags = Array.isArray(body.tags) ? body.tags : [];

  log('info', 'brain.ingest', 'Brain ingest', { instance_id: instanceId, importance, content_len: content.length });

  try {
    const result = await proxyBinding(c.env.SHARED_BRAIN, '/ingest', {
      method: 'POST',
      body: { instance_id: instanceId, role, content, importance, tags },
      headers: auth,
    });

    if (!result.ok) {
      const errData = result.data as Record<string, unknown>;
      return c.json(
        error(String(errData?.error || 'Brain ingest failed'), 'ECHO_BRAIN_ERROR', version, result.latency_ms),
        result.status as 400 | 500,
      );
    }

    return c.json(success(result.data, version, result.latency_ms));
  } catch (e) {
    log('error', 'brain.ingest', 'Brain ingest failed', { error: String(e) });
    return c.json(error(`Brain ingest failed: ${String(e).slice(0, 200)}`, 'ECHO_BRAIN_ERROR', version), 500);
  }
});

// ---------------------------------------------------------------------------
// POST /brain/context — Get conversation context for an instance
// ---------------------------------------------------------------------------
brain.post('/context', async (c) => {
  const version = c.env.WORKER_VERSION || '1.0.0';
  const auth = getAuthHeaders(c.env);
  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return c.json(error('Request body must be valid JSON', 'ECHO_INVALID_INPUT', version), 400);
  }

  const instanceId = String(body.instance_id || '').trim();
  if (!instanceId) {
    return c.json(error("Missing 'instance_id' field", 'ECHO_MISSING_FIELD', version), 400);
  }

  const query = String(body.query || '').trim();
  const conversationId = String(body.conversation_id || '');

  log('info', 'brain.context', 'Brain context', { instance_id: instanceId, query_len: query.length });

  try {
    const result = await proxyBinding(c.env.SHARED_BRAIN, '/context', {
      method: 'POST',
      body: { instance_id: instanceId, query, conversation_id: conversationId },
      headers: auth,
    });

    if (!result.ok) {
      const errData = result.data as Record<string, unknown>;
      return c.json(
        error(String(errData?.error || 'Brain context failed'), 'ECHO_BRAIN_ERROR', version, result.latency_ms),
        result.status as 400 | 500,
      );
    }

    return c.json(success(result.data, version, result.latency_ms));
  } catch (e) {
    log('error', 'brain.context', 'Brain context failed', { error: String(e) });
    return c.json(error(`Brain context failed: ${String(e).slice(0, 200)}`, 'ECHO_BRAIN_ERROR', version), 500);
  }
});

// ---------------------------------------------------------------------------
// POST /brain/heartbeat — Register instance heartbeat
// ---------------------------------------------------------------------------
brain.post('/heartbeat', async (c) => {
  const version = c.env.WORKER_VERSION || '1.0.0';
  const auth = getAuthHeaders(c.env);
  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return c.json(error('Request body must be valid JSON', 'ECHO_INVALID_INPUT', version), 400);
  }

  const instanceId = String(body.instance_id || '').trim();
  if (!instanceId) {
    return c.json(error("Missing 'instance_id' field", 'ECHO_MISSING_FIELD', version), 400);
  }

  const currentTask = String(body.current_task || '');

  log('debug', 'brain.heartbeat', 'Brain heartbeat', { instance_id: instanceId });

  try {
    const result = await proxyBinding(c.env.SHARED_BRAIN, '/heartbeat', {
      method: 'POST',
      body: { instance_id: instanceId, current_task: currentTask },
      headers: auth,
    });

    if (!result.ok) {
      const errData = result.data as Record<string, unknown>;
      return c.json(
        error(String(errData?.error || 'Brain heartbeat failed'), 'ECHO_BRAIN_ERROR', version, result.latency_ms),
        result.status as 400 | 500,
      );
    }

    return c.json(success(result.data, version, result.latency_ms));
  } catch (e) {
    log('error', 'brain.heartbeat', 'Brain heartbeat failed', { error: String(e) });
    return c.json(error(`Brain heartbeat failed: ${String(e).slice(0, 200)}`, 'ECHO_BRAIN_ERROR', version), 500);
  }
});

// ---------------------------------------------------------------------------
// GET /brain/stats — Brain statistics (total messages, instances, conversations)
// ---------------------------------------------------------------------------
brain.get('/stats', async (c) => {
  const version = c.env.WORKER_VERSION || '1.0.0';
  const auth = getAuthHeaders(c.env);

  log('info', 'brain.stats', 'Brain stats request');

  try {
    const result = await proxyBinding(c.env.SHARED_BRAIN, '/stats', {
      method: 'GET',
      headers: auth,
    });

    if (!result.ok) {
      return c.json(error('Brain stats failed', 'ECHO_BRAIN_ERROR', version, result.latency_ms), 500);
    }

    return c.json(success(result.data, version, result.latency_ms));
  } catch (e) {
    log('error', 'brain.stats', 'Brain stats failed', { error: String(e) });
    return c.json(error(`Brain stats failed: ${String(e).slice(0, 200)}`, 'ECHO_BRAIN_ERROR', version), 500);
  }
});

// ---------------------------------------------------------------------------
// GET /brain/recall — Recall a specific memory key
// ---------------------------------------------------------------------------
brain.get('/recall', async (c) => {
  const version = c.env.WORKER_VERSION || '1.0.0';
  const auth = getAuthHeaders(c.env);
  const key = c.req.query('key') || '';

  if (!key) {
    return c.json(error("Missing 'key' query parameter", 'ECHO_MISSING_FIELD', version), 400);
  }

  try {
    const result = await proxyBinding(c.env.SHARED_BRAIN, `/recall?key=${encodeURIComponent(key)}`, {
      method: 'GET',
      headers: auth,
    });

    if (!result.ok) {
      return c.json(error('Brain recall failed', 'ECHO_BRAIN_ERROR', version, result.latency_ms), 500);
    }

    return c.json(success(result.data, version, result.latency_ms));
  } catch (e) {
    return c.json(error(`Brain recall failed: ${String(e).slice(0, 200)}`, 'ECHO_BRAIN_ERROR', version), 500);
  }
});

export default brain;
