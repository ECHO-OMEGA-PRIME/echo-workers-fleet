/**
 * echo-prime-relay — Secured Cloudflare Worker
 * Message relay & event bus for Echo Prime service mesh
 *
 * SECURITY FIXES:
 * - C43: Auth middleware applied to ALL routes except /health (was only on POST /execute)
 * - H56: Added rate limiting (100 req/min per IP)
 * - H57: D1 audit write failures now logged (were silently swallowed)
 * - Replaced wildcard CORS with origin allowlist
 * - Sanitized all error messages (never returns err.message to clients)
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';

// ─── Types ───────────────────────────────────────────────────────
interface Env {
  RELAY_KV: KVNamespace;
  ECHO_API_KEY: string;
  ENGINE_RUNTIME: Fetcher;
  ECHO_CHAT: Fetcher;
  SHARED_BRAIN: Fetcher;
  SWARM_BRAIN: Fetcher;
  SPEAK_CLOUD: Fetcher;
}

interface RelayEvent {
  id: string;
  type: string;
  source: string;
  target?: string | string[];
  payload: Record<string, unknown>;
  priority: string;
  timestamp: string;
  ttl?: number;
}

interface Subscription {
  id: string;
  subscriber: string;
  event_types: string[];
  endpoint?: string;
  service_binding?: string;
  created_at: string;
  active: boolean;
}

interface RelayStats {
  events_relayed: number;
  events_failed: number;
  fan_outs_total: number;
  last_event_at: string | null;
  events_by_type: Record<string, number>;
  events_by_source: Record<string, number>;
  uptime_seconds?: number;
  subscriptions_active?: number;
}

// ─── Constants ───────────────────────────────────────────────────
const ALLOWED_ORIGINS = ['https://echo-ept.com', 'https://echo-op.com'];
const VERSION = '1.1.0';
const WORKER_NAME = 'echo-prime-relay';
const START_TIME = Date.now();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 100;

const SERVICE_MAP: Record<string, string> = {
  shared_brain: 'SHARED_BRAIN',
  swarm_brain: 'SWARM_BRAIN',
  engine_runtime: 'ENGINE_RUNTIME',
  echo_chat: 'ECHO_CHAT',
  speak_cloud: 'SPEAK_CLOUD',
};

const EVENT_TYPES = [
  'engine.query', 'engine.result', 'engine.error',
  'chat.message', 'chat.response',
  'voice.request', 'voice.response',
  'brain.ingest', 'brain.search',
  'moltbook.post',
  'notification.push', 'notification.broadcast',
  'system.health', 'system.alert',
  'build.started', 'build.completed', 'build.failed',
  'scrape.job', 'scrape.result',
  'user.action', 'admin.command',
];

// ─── Rate Limiter (in-memory, per-isolate) ───────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  if (rateLimitMap.size > 1000) cleanupRateLimits();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT_MAX;
}

// Cleanup stale rate limit entries (called lazily during checkRateLimit)
function cleanupRateLimits(): void {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(ip);
  }
}

// ─── Logging ─────────────────────────────────────────────────────
function log(level: string, message: string, data?: Record<string, unknown>): void {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    worker: WORKER_NAME,
    message,
    ...data,
  };
  if (level === 'error') console.error(JSON.stringify(entry));
  else console.log(JSON.stringify(entry));
}

// ─── Helpers ─────────────────────────────────────────────────────
function generateId(): string {
  return `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

// ─── KV Data Access ──────────────────────────────────────────────
async function getStats(kv: KVNamespace): Promise<RelayStats> {
  const raw = await kv.get('relay:stats', 'json') as RelayStats | null;
  if (raw) return raw;
  return {
    events_relayed: 0,
    events_failed: 0,
    fan_outs_total: 0,
    last_event_at: null,
    events_by_type: {},
    events_by_source: {},
  };
}

async function saveStats(kv: KVNamespace, stats: RelayStats): Promise<void> {
  await kv.put('relay:stats', JSON.stringify(stats));
}

async function getSubscriptions(kv: KVNamespace): Promise<Subscription[]> {
  const raw = await kv.get('relay:subscriptions', 'json') as Subscription[] | null;
  return raw || [];
}

async function saveSubscriptions(kv: KVNamespace, subs: Subscription[]): Promise<void> {
  await kv.put('relay:subscriptions', JSON.stringify(subs));
}

async function appendEventLog(kv: KVNamespace, event: RelayEvent): Promise<void> {
  try {
    const existing = (await kv.get('relay:event_log', 'json') as RelayEvent[]) || [];
    existing.push(event);
    const trimmed = existing.slice(-500);
    await kv.put('relay:event_log', JSON.stringify(trimmed), { expirationTtl: 86400 * 7 });
  } catch (err) {
    // H57 FIX: Log audit write failures instead of silently swallowing
    log('error', 'Failed to append event log', { event_id: event.id, error: String(err) });
  }
}

async function getEventLog(kv: KVNamespace, limit: number): Promise<RelayEvent[]> {
  const raw = (await kv.get('relay:event_log', 'json') as RelayEvent[]) || [];
  return raw.slice(-limit);
}

async function addToDeadLetter(kv: KVNamespace, event: RelayEvent, error: string): Promise<void> {
  try {
    const dlq = (await kv.get('relay:dead_letter', 'json') as any[]) || [];
    dlq.push({ ...event, payload: { ...event.payload, _dlq_error: error, _dlq_at: new Date().toISOString() } });
    const trimmed = dlq.slice(-200);
    await kv.put('relay:dead_letter', JSON.stringify(trimmed), { expirationTtl: 86400 * 14 });
  } catch (err) {
    // H57 FIX: Log dead letter write failures
    log('error', 'Failed to write to dead letter queue', { event_id: event.id, error: String(err) });
  }
}

async function getDeadLetter(kv: KVNamespace): Promise<any[]> {
  const raw = await kv.get('relay:dead_letter', 'json') as any[];
  return raw || [];
}

// ─── Fan Out ─────────────────────────────────────────────────────
async function fanOut(
  env: Env,
  event: RelayEvent,
  subscriptions: Subscription[]
): Promise<{ subscriber: string; status: string; error?: string }[]> {
  const results: { subscriber: string; status: string; error?: string }[] = [];
  const targets = Array.isArray(event.target) ? event.target : event.target ? [event.target] : [];

  for (const sub of subscriptions) {
    if (!sub.active) continue;
    if (!sub.event_types.includes(event.type) && !sub.event_types.includes('*')) continue;
    if (targets.length > 0 && !targets.includes(sub.subscriber)) continue;

    try {
      if (sub.service_binding) {
        const bindingName = SERVICE_MAP[sub.service_binding];
        const binding = bindingName ? (env as any)[bindingName] : null;
        if (binding) {
          const resp = await binding.fetch('https://relay/event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event_id: event.id,
              type: event.type,
              source: event.source,
              payload: event.payload,
              priority: event.priority,
              timestamp: event.timestamp,
              instance_id: WORKER_NAME,
            }),
          });
          results.push({ subscriber: sub.subscriber, status: resp.ok ? 'delivered' : 'failed' });
        } else {
          results.push({ subscriber: sub.subscriber, status: 'skipped', error: 'binding_not_found' });
        }
      } else if (sub.endpoint) {
        const resp = await fetch(sub.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_id: event.id,
            type: event.type,
            source: event.source,
            payload: event.payload,
            priority: event.priority,
            author_id: WORKER_NAME,
          }),
        });
        results.push({ subscriber: sub.subscriber, status: resp.ok ? 'delivered' : 'failed' });
      } else {
        results.push({ subscriber: sub.subscriber, status: 'skipped', error: 'no_endpoint' });
      }
    } catch (err) {
      log('error', 'Fan out delivery failed', { subscriber: sub.subscriber, error: String(err) });
      results.push({ subscriber: sub.subscriber, status: 'failed', error: 'delivery_exception' });
    }
  }
  return results;
}

// ─── App ─────────────────────────────────────────────────────────
const app = new Hono<{ Bindings: Env }>();

// CORS with origin allowlist (replaces Access-Control-Allow-Origin: *)
app.use('*', cors({
  origin: (o: string) => ALLOWED_ORIGINS.includes(o) ? o : ALLOWED_ORIGINS[0],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Echo-API-Key'],
}));

// Security headers
app.use('*', async (c, next) => {
  await next();
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('X-XSS-Protection', '1; mode=block');
  c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
});

// H56 FIX: Rate limiting middleware (all routes)
app.use('*', async (c, next) => {
  const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';
  if (!checkRateLimit(ip)) {
    return c.json({ error: 'Rate limit exceeded. Try again later.' }, 429);
  }
  await next();
});

// C43 FIX: Auth middleware on ALL routes except /health
app.use('*', async (c, next) => {
  const path = new URL(c.req.url).pathname;
  if (path === '/health') {
    return next();
  }

  if (!c.env.ECHO_API_KEY) {
    log('error', 'ECHO_API_KEY not configured — refusing request', { path });
    return c.json({ error: 'Service misconfigured' }, 503);
  }

  const key = c.req.header('X-Echo-API-Key') || c.req.header('Authorization')?.replace('Bearer ', '');
  if (!key || key !== c.env.ECHO_API_KEY) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  await next();
});

// ─── Routes ──────────────────────────────────────────────────────

// Root — API docs
app.get('/', (c) => c.json({
  worker: WORKER_NAME,
  version: VERSION,
  description: 'Message relay & event bus for Echo Prime service mesh',
  endpoints: [
    'GET /health',
    'GET /stats',
    'POST /relay — Send an event through the relay',
    'POST /relay/batch — Send multiple events',
    'POST /relay/broadcast — Broadcast to all services',
    'GET /subscriptions — List active subscriptions',
    'POST /subscriptions — Create subscription',
    'DELETE /subscriptions/:id — Remove subscription',
    'GET /events — Recent event log',
    'GET /events/:id — Get specific event',
    'GET /dead-letter — Dead letter queue',
    'POST /dead-letter/retry — Retry dead-letter events',
    'POST /dead-letter/purge — Purge dead-letter queue',
    'GET /services — List available service targets',
    'GET /event-types — List known event types',
  ],
}));

// Health check (no auth)
app.get('/health', async (c) => {
  const stats = await getStats(c.env.RELAY_KV);
  const subs = await getSubscriptions(c.env.RELAY_KV);
  return c.json({
    status: 'ok',
    version: VERSION,
    worker: WORKER_NAME,
    uptime_seconds: Math.floor((Date.now() - START_TIME) / 1000),
    events_relayed: stats.events_relayed,
    events_failed: stats.events_failed,
    subscriptions_active: subs.filter((s) => s.active).length,
    services_available: Object.keys(SERVICE_MAP),
    timestamp: new Date().toISOString(),
  });
});

// Stats (now auth-protected per C43)
app.get('/stats', async (c) => {
  const stats = await getStats(c.env.RELAY_KV);
  stats.uptime_seconds = Math.floor((Date.now() - START_TIME) / 1000);
  const subs = await getSubscriptions(c.env.RELAY_KV);
  stats.subscriptions_active = subs.filter((s) => s.active).length;
  return c.json(stats);
});

// Relay event
app.post('/relay', async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body || !body.type || !body.source || !body.payload) {
    return c.json({ error: 'Missing required fields: type, source, payload' }, 400);
  }
  const event: RelayEvent = {
    id: body.id || generateId(),
    type: body.type,
    source: body.source,
    target: body.target,
    payload: body.payload,
    priority: body.priority || 'normal',
    timestamp: new Date().toISOString(),
    ttl: body.ttl,
  };
  log('info', 'Relaying event', { event_id: event.id, type: event.type, source: event.source, priority: event.priority });
  const subscriptions = await getSubscriptions(c.env.RELAY_KV);
  const results = await fanOut(c.env, event, subscriptions);
  const stats = await getStats(c.env.RELAY_KV);
  const delivered = results.filter((r) => r.status === 'delivered').length;
  const failed = results.filter((r) => r.status === 'failed').length;
  stats.events_relayed += 1;
  stats.fan_outs_total += results.length;
  if (failed > 0) stats.events_failed += failed;
  stats.last_event_at = event.timestamp;
  stats.events_by_type[event.type] = (stats.events_by_type[event.type] || 0) + 1;
  stats.events_by_source[event.source] = (stats.events_by_source[event.source] || 0) + 1;
  await saveStats(c.env.RELAY_KV, stats);
  await appendEventLog(c.env.RELAY_KV, event);
  for (const r of results) {
    if (r.status === 'failed') {
      await addToDeadLetter(c.env.RELAY_KV, event, r.error || 'delivery failed');
    }
  }
  return c.json({ event_id: event.id, delivered, failed, skipped: results.filter((r) => r.status === 'skipped').length, results });
});

// Batch relay
app.post('/relay/batch', async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body || !Array.isArray(body.events) || body.events.length === 0) {
    return c.json({ error: 'Missing events array' }, 400);
  }
  if (body.events.length > 50) return c.json({ error: 'Max 50 events per batch' }, 400);
  const subscriptions = await getSubscriptions(c.env.RELAY_KV);
  const batchResults = [];
  for (const raw of body.events) {
    if (!raw.type || !raw.source || !raw.payload) continue;
    const event: RelayEvent = {
      id: raw.id || generateId(),
      type: raw.type, source: raw.source, target: raw.target,
      payload: raw.payload, priority: raw.priority || 'normal',
      timestamp: new Date().toISOString(), ttl: raw.ttl,
    };
    const results = await fanOut(c.env, event, subscriptions);
    await appendEventLog(c.env.RELAY_KV, event);
    batchResults.push({
      event_id: event.id,
      delivered: results.filter((r) => r.status === 'delivered').length,
      failed: results.filter((r) => r.status === 'failed').length,
    });
  }
  const stats = await getStats(c.env.RELAY_KV);
  stats.events_relayed += batchResults.length;
  stats.fan_outs_total += batchResults.reduce((sum, r) => sum + r.delivered + r.failed, 0);
  stats.last_event_at = new Date().toISOString();
  await saveStats(c.env.RELAY_KV, stats);
  return c.json({ batch_size: batchResults.length, results: batchResults });
});

// Broadcast
app.post('/relay/broadcast', async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body || !body.type || !body.payload) {
    return c.json({ error: 'Missing required fields: type, payload' }, 400);
  }
  const event: RelayEvent = {
    id: generateId(),
    type: body.type,
    source: body.source || WORKER_NAME,
    target: Object.keys(SERVICE_MAP),
    payload: body.payload,
    priority: body.priority || 'normal',
    timestamp: new Date().toISOString(),
  };
  log('info', 'Broadcasting event to all services', { event_id: event.id, type: event.type });
  const subscriptions = await getSubscriptions(c.env.RELAY_KV);
  const results = await fanOut(c.env, event, subscriptions);
  await appendEventLog(c.env.RELAY_KV, event);
  return c.json({
    event_id: event.id,
    broadcast_targets: Object.keys(SERVICE_MAP).length,
    delivered: results.filter((r) => r.status === 'delivered').length,
    failed: results.filter((r) => r.status === 'failed').length,
    results,
  });
});

// Subscriptions
app.get('/subscriptions', async (c) => {
  const subs = await getSubscriptions(c.env.RELAY_KV);
  const activeOnly = c.req.query('active') === 'true';
  const filtered = activeOnly ? subs.filter((s) => s.active) : subs;
  return c.json({ subscriptions: filtered, total: filtered.length });
});

app.post('/subscriptions', async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body || !body.subscriber || !body.event_types || body.event_types.length === 0) {
    return c.json({ error: 'Missing required fields: subscriber, event_types' }, 400);
  }
  if (!body.endpoint && !body.service_binding) {
    return c.json({ error: 'Must provide either endpoint or service_binding' }, 400);
  }
  if (body.service_binding && !SERVICE_MAP[body.service_binding]) {
    return c.json({ error: 'Unknown service binding' }, 400);
  }
  const subs = await getSubscriptions(c.env.RELAY_KV);
  const existing = subs.find((s) => s.subscriber === body.subscriber && s.active);
  if (existing) {
    existing.event_types = body.event_types;
    existing.endpoint = body.endpoint;
    existing.service_binding = body.service_binding;
    await saveSubscriptions(c.env.RELAY_KV, subs);
    log('info', 'Updated subscription', { subscriber: body.subscriber });
    return c.json({ subscription: existing, action: 'updated' });
  }
  const sub: Subscription = {
    id: `sub_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    subscriber: body.subscriber,
    event_types: body.event_types,
    endpoint: body.endpoint,
    service_binding: body.service_binding,
    created_at: new Date().toISOString(),
    active: true,
  };
  subs.push(sub);
  await saveSubscriptions(c.env.RELAY_KV, subs);
  log('info', 'Created subscription', { sub_id: sub.id, subscriber: sub.subscriber, event_types: sub.event_types });
  return c.json({ subscription: sub, action: 'created' }, 201);
});

app.delete('/subscriptions/:id', async (c) => {
  const id = c.req.param('id');
  const subs = await getSubscriptions(c.env.RELAY_KV);
  const idx = subs.findIndex((s) => s.id === id);
  if (idx === -1) return c.json({ error: 'Subscription not found' }, 404);
  subs[idx].active = false;
  await saveSubscriptions(c.env.RELAY_KV, subs);
  log('info', 'Deactivated subscription', { sub_id: id });
  return c.json({ success: true, subscription_id: id });
});

// Events
app.get('/events', async (c) => {
  const limit = parseInt(c.req.query('limit') || '50');
  const type = c.req.query('type');
  const source = c.req.query('source');
  let events = await getEventLog(c.env.RELAY_KV, 500);
  if (type) events = events.filter((e) => e.type === type);
  if (source) events = events.filter((e) => e.source === source);
  events = events.slice(-Math.min(limit, 200));
  return c.json({ events, total: events.length });
});

app.get('/events/:id', async (c) => {
  const id = c.req.param('id');
  const events = await getEventLog(c.env.RELAY_KV, 500);
  const event = events.find((e) => e.id === id);
  if (!event) return c.json({ error: 'Event not found' }, 404);
  return c.json({ event });
});

// Dead letter queue
app.get('/dead-letter', async (c) => {
  const dlq = await getDeadLetter(c.env.RELAY_KV);
  return c.json({ events: dlq, total: dlq.length });
});

app.post('/dead-letter/retry', async (c) => {
  const dlq = await getDeadLetter(c.env.RELAY_KV);
  if (dlq.length === 0) return c.json({ message: 'Dead letter queue is empty', retried: 0 });
  const subscriptions = await getSubscriptions(c.env.RELAY_KV);
  let retried = 0;
  let succeeded = 0;
  const remaining: any[] = [];
  for (const event of dlq) {
    const cleanPayload = { ...event.payload };
    delete cleanPayload._dlq_error;
    delete cleanPayload._dlq_at;
    event.payload = cleanPayload;
    event.id = generateId();
    const results = await fanOut(c.env, event, subscriptions);
    const delivered = results.filter((r) => r.status === 'delivered').length;
    if (delivered > 0) succeeded++;
    else remaining.push(event);
    retried++;
  }
  try {
    await c.env.RELAY_KV.put('relay:dead_letter', JSON.stringify(remaining), { expirationTtl: 86400 * 14 });
  } catch (err) {
    // H57 FIX: Log KV write failures
    log('error', 'Failed to update dead letter queue after retry', { error: String(err) });
  }
  log('info', 'Retried dead letter queue', { retried, succeeded, remaining: remaining.length });
  return c.json({ retried, succeeded, remaining: remaining.length });
});

app.post('/dead-letter/purge', async (c) => {
  try {
    await c.env.RELAY_KV.delete('relay:dead_letter');
  } catch (err) {
    // H57 FIX: Log KV write failures
    log('error', 'Failed to purge dead letter queue', { error: String(err) });
    return c.json({ error: 'Failed to purge dead letter queue' }, 500);
  }
  log('info', 'Purged dead letter queue');
  return c.json({ success: true, message: 'Dead letter queue purged' });
});

// Services (now auth-protected per C43)
app.get('/services', (c) => {
  return c.json({
    services: Object.entries(SERVICE_MAP).map(([name, binding]) => ({ name, binding, available: true })),
    total: Object.keys(SERVICE_MAP).length,
  });
});

// Event types (now auth-protected per C43)
app.get('/event-types', (c) => c.json({ event_types: EVENT_TYPES }));

// Notify
app.post('/notify', async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body || !body.message) return c.json({ error: 'Missing message' }, 400);
  const event: RelayEvent = {
    id: generateId(),
    type: 'notification.push',
    source: 'api',
    target: body.targets || ['shared_brain', 'swarm_brain'],
    payload: { message: body.message },
    priority: body.priority || 'normal',
    timestamp: new Date().toISOString(),
  };
  const subscriptions = await getSubscriptions(c.env.RELAY_KV);
  const results = await fanOut(c.env, event, subscriptions);
  await appendEventLog(c.env.RELAY_KV, event);
  return c.json({
    event_id: event.id,
    delivered: results.filter((r) => r.status === 'delivered').length,
    failed: results.filter((r) => r.status === 'failed').length,
  });
});

// Alert
app.post('/alert', async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body || !body.title || !body.message) {
    return c.json({ error: 'Missing title and message' }, 400);
  }
  const priorityMap: Record<string, string> = { info: 'low', warning: 'normal', error: 'high', critical: 'critical' };
  const event: RelayEvent = {
    id: generateId(),
    type: 'system.alert',
    source: body.source || 'api',
    target: ['shared_brain', 'swarm_brain'],
    payload: { title: body.title, message: body.message, severity: body.severity || 'info' },
    priority: priorityMap[body.severity || 'info'] || 'normal',
    timestamp: new Date().toISOString(),
  };
  const subscriptions = await getSubscriptions(c.env.RELAY_KV);
  const results = await fanOut(c.env, event, subscriptions);
  await appendEventLog(c.env.RELAY_KV, event);
  log('warn', 'Alert dispatched', { title: body.title, severity: body.severity });
  return c.json({
    event_id: event.id,
    severity: body.severity,
    delivered: results.filter((r) => r.status === 'delivered').length,
  });
});

// Engine query proxy
app.post('/engine/query', async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body || !body.query) return c.json({ error: 'Missing query' }, 400);
  const start = Date.now();
  try {
    const resp = await c.env.ENGINE_RUNTIME.fetch('https://engine/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await resp.json() as Record<string, unknown>;
    const latency = Date.now() - start;
    const event: RelayEvent = {
      id: generateId(),
      type: 'engine.query',
      source: 'relay_proxy',
      payload: { query: body.query, domain: body.domain, latency_ms: latency },
      priority: 'normal',
      timestamp: new Date().toISOString(),
    };
    c.executionCtx.waitUntil(appendEventLog(c.env.RELAY_KV, event));
    return c.json({ ...data, relay_latency_ms: latency });
  } catch (err) {
    log('error', 'Engine query failed', { error: String(err) });
    return c.json({ error: 'Engine query failed' }, 502);
  }
});

// Chat generate proxy
app.post('/chat/generate', async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ error: 'Invalid body' }, 400);
  const start = Date.now();
  try {
    const resp = await c.env.ECHO_CHAT.fetch('https://chat/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await resp.json() as Record<string, unknown>;
    return c.json({ ...data, relay_latency_ms: Date.now() - start });
  } catch (err) {
    log('error', 'Chat generation failed', { error: String(err) });
    return c.json({ error: 'Chat generation failed' }, 502);
  }
});

// Error handling — sanitized (never returns err.message to clients)
app.notFound((c) => c.json({ error: 'Not found', worker: WORKER_NAME }, 404));

app.onError((err, c) => {
  log('error', 'Unhandled error', { error: err.message, stack: err.stack });
  return c.json({ error: 'Internal server error', worker: WORKER_NAME }, 500);
});

export default app;
