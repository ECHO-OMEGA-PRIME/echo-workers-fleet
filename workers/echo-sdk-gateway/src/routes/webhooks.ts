/**
 * Echo SDK Gateway — Webhook & Event system.
 *
 * Register webhook endpoints, manage subscriptions, send test payloads,
 * and stream real-time events via SSE.
 *
 * Routes:
 *   POST   /webhooks/register   — Register a new webhook endpoint
 *   GET    /webhooks/list       — List registered webhooks
 *   DELETE /webhooks/:id        — Delete a webhook (soft-delete)
 *   POST   /webhooks/:id/test   — Send test payload to webhook
 *   GET    /events/stream       — SSE event stream (real-time)
 */

import { Hono } from 'hono';
import type { Env, WebhookRegisterRequest, WebhookRecord } from '../types';
import { success, error } from '../utils/envelope';
import { log } from '../utils/proxy';

// ---------------------------------------------------------------------------
// Supported event types
// ---------------------------------------------------------------------------

const SUPPORTED_EVENTS = [
  'forge.build.started',
  'forge.build.complete',
  'forge.build.failed',
  'forge.doctrine.generated',
  'marketplace.purchase',
  'engine.query',
  'knowledge.ingest',
  'alert.error',
] as const;

type SupportedEvent = (typeof SUPPORTED_EVENTS)[number];

// ---------------------------------------------------------------------------
// Helper — generate UUID v4
// ---------------------------------------------------------------------------

function generateId(): string {
  return crypto.randomUUID();
}

// ---------------------------------------------------------------------------
// Helper — HMAC-SHA256 signature
// ---------------------------------------------------------------------------

async function signPayload(secret: string, payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ---------------------------------------------------------------------------
// Helper — generate a random secret
// ---------------------------------------------------------------------------

function generateSecret(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ---------------------------------------------------------------------------
// Webhook route module
// ---------------------------------------------------------------------------

const webhooks = new Hono<{ Bindings: Env }>();

// ---------------------------------------------------------------------------
// POST /webhooks/register — Register a new webhook endpoint
// ---------------------------------------------------------------------------
webhooks.post('/register', async (c) => {
  const version = c.env.WORKER_VERSION || '1.0.0';
  const start = Date.now();

  let body: WebhookRegisterRequest;
  try {
    body = await c.req.json<WebhookRegisterRequest>();
  } catch {
    return c.json(error('Request body must be valid JSON', 'ECHO_INVALID_INPUT', version), 400);
  }

  if (!body.url || typeof body.url !== 'string') {
    return c.json(error("Missing or invalid 'url' field", 'ECHO_MISSING_FIELD', version), 400);
  }

  // Validate URL format
  try {
    new URL(body.url);
  } catch {
    return c.json(error("Invalid URL format in 'url' field", 'ECHO_INVALID_INPUT', version), 400);
  }

  if (!body.events || !Array.isArray(body.events) || body.events.length === 0) {
    return c.json(
      error(
        `Missing or empty 'events' array. Supported: ${SUPPORTED_EVENTS.join(', ')}`,
        'ECHO_MISSING_FIELD',
        version,
      ),
      400,
    );
  }

  // Validate event types
  for (const evt of body.events) {
    if (!SUPPORTED_EVENTS.includes(evt as SupportedEvent)) {
      return c.json(
        error(
          `Unknown event '${evt}'. Supported: ${SUPPORTED_EVENTS.join(', ')}`,
          'ECHO_INVALID_EVENT',
          version,
        ),
        400,
      );
    }
  }

  const id = generateId();
  const secret = body.secret || generateSecret();
  const now = new Date().toISOString();
  const eventsJson = JSON.stringify(body.events);

  log('info', 'webhooks.register', `Registering webhook: ${body.url}`, {
    id,
    events: body.events,
  });

  try {
    await c.env.DB.prepare(
      `INSERT INTO webhooks (id, url, events, secret, active, created_at, last_triggered, failure_count)
       VALUES (?, ?, ?, ?, 1, ?, NULL, 0)`,
    )
      .bind(id, body.url, eventsJson, secret, now)
      .run();
  } catch (e) {
    log('error', 'webhooks.register', `D1 insert failed: ${String(e).slice(0, 200)}`);
    return c.json(error('Failed to store webhook', 'ECHO_DB_ERROR', version), 500);
  }

  const total_ms = Date.now() - start;

  log('info', 'webhooks.register', `Webhook registered: ${id}`, { latency_ms: total_ms });

  // M4 FIX: Never return the actual secret in the response — only confirm it's configured
  return c.json(
    success(
      {
        id,
        url: body.url,
        events: body.events,
        secret: body.secret ? '[CONFIGURED]' : '[GENERATED]',
        active: true,
        created_at: now,
        note: 'Secret is stored securely. It cannot be retrieved after creation.',
      },
      version,
      total_ms,
    ),
    201,
  );
});

// ---------------------------------------------------------------------------
// GET /webhooks/list — List registered webhooks
// ---------------------------------------------------------------------------
webhooks.get('/list', async (c) => {
  const version = c.env.WORKER_VERSION || '1.0.0';
  const start = Date.now();

  log('info', 'webhooks.list', 'Listing active webhooks');

  try {
    const result = await c.env.DB.prepare(
      'SELECT id, url, events, active, created_at, last_triggered, failure_count FROM webhooks WHERE active = 1 ORDER BY created_at DESC',
    ).all<Omit<WebhookRecord, 'secret'>>();

    const rows = (result.results || []).map((row) => ({
      ...row,
      events: JSON.parse(row.events as string),
    }));

    const total_ms = Date.now() - start;

    return c.json(
      success(
        {
          webhooks: rows,
          total: rows.length,
          supported_events: SUPPORTED_EVENTS,
        },
        version,
        total_ms,
      ),
    );
  } catch (e) {
    log('error', 'webhooks.list', `D1 query failed: ${String(e).slice(0, 200)}`);
    return c.json(error('Failed to list webhooks', 'ECHO_DB_ERROR', version), 500);
  }
});

// ---------------------------------------------------------------------------
// DELETE /webhooks/:id — Soft-delete a webhook
// ---------------------------------------------------------------------------
webhooks.delete('/:id', async (c) => {
  const version = c.env.WORKER_VERSION || '1.0.0';
  const id = c.req.param('id');
  const start = Date.now();

  log('info', 'webhooks.delete', `Deleting webhook: ${id}`);

  try {
    const result = await c.env.DB.prepare(
      'UPDATE webhooks SET active = 0 WHERE id = ? AND active = 1',
    )
      .bind(id)
      .run();

    const total_ms = Date.now() - start;

    if (!result.meta.changes || result.meta.changes === 0) {
      return c.json(
        error(`Webhook '${id}' not found or already deleted`, 'ECHO_NOT_FOUND', version, total_ms),
        404,
      );
    }

    log('info', 'webhooks.delete', `Webhook deleted: ${id}`, { latency_ms: total_ms });

    return c.json(
      success(
        {
          id,
          deleted: true,
        },
        version,
        total_ms,
      ),
    );
  } catch (e) {
    log('error', 'webhooks.delete', `D1 update failed: ${String(e).slice(0, 200)}`);
    return c.json(error('Failed to delete webhook', 'ECHO_DB_ERROR', version), 500);
  }
});

// ---------------------------------------------------------------------------
// POST /webhooks/:id/test — Send test payload to webhook
// ---------------------------------------------------------------------------
webhooks.post('/:id/test', async (c) => {
  const version = c.env.WORKER_VERSION || '1.0.0';
  const id = c.req.param('id');
  const start = Date.now();

  log('info', 'webhooks.test', `Testing webhook: ${id}`);

  // Fetch webhook from D1
  let webhook: WebhookRecord | null = null;
  try {
    const result = await c.env.DB.prepare(
      'SELECT id, url, events, secret, active, created_at, last_triggered, failure_count FROM webhooks WHERE id = ? AND active = 1',
    )
      .bind(id)
      .first<WebhookRecord>();

    webhook = result;
  } catch (e) {
    log('error', 'webhooks.test', `D1 query failed: ${String(e).slice(0, 200)}`);
    return c.json(error('Failed to fetch webhook', 'ECHO_DB_ERROR', version), 500);
  }

  if (!webhook) {
    return c.json(error(`Webhook '${id}' not found or inactive`, 'ECHO_NOT_FOUND', version), 404);
  }

  // Build test payload
  const testPayload = {
    event: 'webhook.test',
    webhook_id: id,
    timestamp: new Date().toISOString(),
    data: {
      message: 'This is a test payload from Echo SDK Gateway',
      source: 'echo-sdk-gateway',
    },
  };

  const payloadStr = JSON.stringify(testPayload);

  // Sign with HMAC-SHA256
  let signature = '';
  try {
    signature = await signPayload(webhook.secret, payloadStr);
  } catch (e) {
    log('error', 'webhooks.test', `HMAC signing failed: ${String(e).slice(0, 200)}`);
    return c.json(error('Failed to sign test payload', 'ECHO_CRYPTO_ERROR', version), 500);
  }

  // Send test request
  try {
    const resp = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Echo-Signature': signature,
        'X-Echo-Webhook-Id': id,
        'X-Echo-Event': 'webhook.test',
      },
      body: payloadStr,
      signal: AbortSignal.timeout(10000),
    });

    // Update last_triggered
    await c.env.DB.prepare(
      'UPDATE webhooks SET last_triggered = ? WHERE id = ?',
    )
      .bind(new Date().toISOString(), id)
      .run();

    const total_ms = Date.now() - start;

    log('info', 'webhooks.test', `Test delivered to ${webhook.url}: status=${resp.status}`, {
      latency_ms: total_ms,
    });

    return c.json(
      success(
        {
          webhook_id: id,
          url: webhook.url,
          delivered: resp.ok,
          status_code: resp.status,
          signature,
        },
        version,
        total_ms,
      ),
    );
  } catch (e) {
    const msg = String(e);

    // Increment failure count
    try {
      await c.env.DB.prepare(
        'UPDATE webhooks SET failure_count = failure_count + 1 WHERE id = ?',
      )
        .bind(id)
        .run();
    } catch {
      // Best-effort counter update
    }

    const total_ms = Date.now() - start;

    if (msg.includes('TimeoutError') || msg.includes('aborted')) {
      log('warn', 'webhooks.test', `Test delivery timed out for ${webhook.url}`);
      return c.json(
        success(
          {
            webhook_id: id,
            url: webhook.url,
            delivered: false,
            error: 'Webhook endpoint timed out after 10s',
          },
          version,
          total_ms,
        ),
      );
    }

    log('warn', 'webhooks.test', `Test delivery failed for ${webhook.url}: ${msg.slice(0, 200)}`);
    return c.json(
      success(
        {
          webhook_id: id,
          url: webhook.url,
          delivered: false,
          error: msg.slice(0, 200),
        },
        version,
        total_ms,
      ),
    );
  }
});

// ---------------------------------------------------------------------------
// GET /events/stream — SSE event stream (real-time)
// ---------------------------------------------------------------------------
webhooks.get('/events/stream', async (c) => {
  const version = c.env.WORKER_VERSION || '1.0.0';

  // M6 FIX: Scope SSE stream to authenticated tenant
  const tenantId = (c.get as any)('auth_tenant_id') || 'unknown';
  log('info', 'events.stream', `SSE stream opened for tenant: ${tenantId}`);

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  // Helper to write SSE formatted data
  const writeSSE = async (event: string, data: unknown) => {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    await writer.write(encoder.encode(payload));
  };

  // Start the stream in the background
  const streamTask = (async () => {
    try {
      // M6 FIX: Send tenant-scoped initial connection event
      await writeSSE('connected', {
        message: 'Echo SDK Gateway SSE stream connected',
        version,
        tenant_id: tenantId,
        timestamp: new Date().toISOString(),
        supported_events: SUPPORTED_EVENTS,
      });

      // Keep-alive loop — send ping every 15 seconds
      // Cloudflare Workers have a max execution time, so this will naturally terminate
      let pingCount = 0;
      const maxPings = 240; // ~60 minutes of keep-alive

      while (pingCount < maxPings) {
        await new Promise<void>((resolve) => setTimeout(resolve, 15000));
        pingCount++;
        await writeSSE('ping', {
          seq: pingCount,
          timestamp: new Date().toISOString(),
        });
      }

      await writer.close();
    } catch {
      // Client disconnected — clean up silently
      try {
        await writer.close();
      } catch {
        // Already closed
      }
    }
  })();

  // Don't await streamTask — let it run in the background
  c.executionCtx.waitUntil(streamTask);

  return new Response(readable, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Echo-Version': version,
    },
  });
});

export default webhooks;
