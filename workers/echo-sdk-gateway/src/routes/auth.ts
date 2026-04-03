/**
 * Echo SDK Gateway — Auth & API Key Management Routes.
 *
 * Multi-tenant API key CRUD, JWT token exchange, usage tracking.
 * Admin operations require the master API key.
 * All keys are SHA-256 hashed before storage — raw keys never persisted.
 *
 * Endpoints:
 *   POST   /auth/tenants          Create a tenant
 *   GET    /auth/tenants/:id      Get tenant details
 *   POST   /auth/keys             Create an API key for a tenant
 *   GET    /auth/keys             List keys for authenticated tenant
 *   DELETE /auth/keys/:id         Revoke a key
 *   POST   /auth/keys/:id/rotate  Rotate a key (revoke old, create new)
 *   POST   /auth/token            Exchange API key for short-lived JWT
 *   GET    /auth/whoami           Show current key/tenant identity
 *   GET    /auth/usage            Usage stats for authenticated key
 *   GET    /auth/usage/tenant     Usage stats for entire tenant (admin)
 */

import { Hono } from 'hono';
import type { Env, AuthVariables } from '../types';
import { success, error } from '../utils/envelope';

const auth = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** SHA-256 hash a string, return hex digest */
async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Generate a cryptographically random API key: echo_sk_{40 hex chars} */
function generateApiKey(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `echo_sk_${hex}`;
}

/** Generate a random UUID-like ID */
function generateId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
}

/** Check if the request is authenticated with the master key */
function isMasterKey(c: { req: { header: (name: string) => string | undefined }; env: Env }): boolean {
  const masterKey = c.env.API_KEY || c.env.ECHO_API_KEY || '';
  if (!masterKey) return false;
  const provided =
    c.req.header('X-Echo-API-Key') ||
    c.req.header('Authorization')?.replace(/^Bearer\s+/i, '') ||
    '';
  if (!provided || provided.length !== masterKey.length) return false;
  let result = 0;
  for (let i = 0; i < masterKey.length; i++) {
    result |= provided.charCodeAt(i) ^ masterKey.charCodeAt(i);
  }
  return result === 0;
}

/** Get the authenticated key context from the request (set by upgraded auth middleware) */
function getKeyContext(c: { get: (key: string) => unknown }): { keyId: string; tenantId: string; scopes: string[] } | null {
  const keyId = c.get('auth_key_id') as string | undefined;
  const tenantId = c.get('auth_tenant_id') as string | undefined;
  const scopes = c.get('auth_scopes') as string[] | undefined;
  if (!keyId || !tenantId) return null;
  return { keyId, tenantId, scopes: scopes || [] };
}

/** Create a JWT (HMAC-SHA256) */
async function createJwt(
  payload: Record<string, unknown>,
  secret: string,
  expiresInSeconds = 3600,
): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = { ...payload, iat: now, exp: now + expiresInSeconds };

  const encodedHeader = btoa(JSON.stringify(header)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  const encodedPayload = btoa(JSON.stringify(fullPayload)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signingInput));
  const encodedSig = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=+$/, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${signingInput}.${encodedSig}`;
}

const v = (c: { env: Env }) => c.env.WORKER_VERSION || '3.0.0';

// ---------------------------------------------------------------------------
// POST /auth/tenants — Create a new tenant (master key required)
// ---------------------------------------------------------------------------
auth.post('/tenants', async (c) => {
  if (!isMasterKey(c)) {
    return c.json(error('Admin access required', 'ECHO_ADMIN_REQUIRED', v(c)), 403);
  }

  const body = await c.req.json<{ name: string; email: string; plan?: string; rate_limit?: number; daily_limit?: number; monthly_limit?: number }>();
  if (!body.name || !body.email) {
    return c.json(error('name and email are required', 'ECHO_VALIDATION', v(c)), 400);
  }

  const planDefaults: Record<string, { rate: number; daily: number; monthly: number }> = {
    free: { rate: 30, daily: 500, monthly: 10000 },
    pro: { rate: 120, daily: 5000, monthly: 100000 },
    enterprise: { rate: 600, daily: 50000, monthly: 1000000 },
    internal: { rate: 10000, daily: 1000000, monthly: 99999999 },
  };

  const plan = body.plan || 'free';
  const defaults = planDefaults[plan] || planDefaults.free;
  const tenantId = generateId('tn');

  try {
    await c.env.DB.prepare(
      `INSERT INTO tenants (id, name, email, plan, rate_limit, daily_limit, monthly_limit, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
    )
      .bind(
        tenantId,
        body.name,
        body.email,
        plan,
        body.rate_limit || defaults.rate,
        body.daily_limit || defaults.daily,
        body.monthly_limit || defaults.monthly,
      )
      .run();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('UNIQUE')) {
      return c.json(error('Tenant with this email already exists', 'ECHO_DUPLICATE', v(c)), 409);
    }
    return c.json(error(`Failed to create tenant: ${msg}`, 'ECHO_DB_ERROR', v(c)), 500);
  }

  return c.json(
    success(
      {
        tenant_id: tenantId,
        name: body.name,
        email: body.email,
        plan,
        rate_limit: body.rate_limit || defaults.rate,
        daily_limit: body.daily_limit || defaults.daily,
        monthly_limit: body.monthly_limit || defaults.monthly,
      },
      v(c),
    ),
    201,
  );
});

// ---------------------------------------------------------------------------
// GET /auth/tenants/:id — Get tenant details (master key or own tenant)
// ---------------------------------------------------------------------------
auth.get('/tenants/:id', async (c) => {
  const tenantId = c.req.param('id');
  const ctx = getKeyContext(c);
  const isAdmin = isMasterKey(c);

  if (!isAdmin && (!ctx || ctx.tenantId !== tenantId)) {
    return c.json(error('Access denied', 'ECHO_FORBIDDEN', v(c)), 403);
  }

  const tenant = await c.env.DB.prepare('SELECT * FROM tenants WHERE id = ?').bind(tenantId).first();
  if (!tenant) {
    return c.json(error('Tenant not found', 'ECHO_NOT_FOUND', v(c)), 404);
  }

  return c.json(success(tenant, v(c)));
});

// ---------------------------------------------------------------------------
// POST /auth/keys — Create a new API key (master key or own tenant)
// ---------------------------------------------------------------------------
auth.post('/keys', async (c) => {
  const body = await c.req.json<{ tenant_id: string; name: string; scopes?: string[]; expires_in_days?: number }>();
  if (!body.tenant_id || !body.name) {
    return c.json(error('tenant_id and name are required', 'ECHO_VALIDATION', v(c)), 400);
  }

  const ctx = getKeyContext(c);
  const isAdmin = isMasterKey(c);
  if (!isAdmin && (!ctx || ctx.tenantId !== body.tenant_id)) {
    return c.json(error('Cannot create keys for other tenants', 'ECHO_FORBIDDEN', v(c)), 403);
  }

  // Verify tenant exists
  const tenant = await c.env.DB.prepare('SELECT id, status FROM tenants WHERE id = ?').bind(body.tenant_id).first<{ id: string; status: string }>();
  if (!tenant || tenant.status !== 'active') {
    return c.json(error('Tenant not found or inactive', 'ECHO_NOT_FOUND', v(c)), 404);
  }

  const rawKey = generateApiKey();
  const keyHash = await sha256(rawKey);
  const keyPrefix = rawKey.slice(0, 16); // echo_sk_XXXXXXXX
  const keyId = generateId('key');
  const expiresAt = body.expires_in_days
    ? new Date(Date.now() + body.expires_in_days * 86400000).toISOString()
    : null;

  await c.env.DB.prepare(
    `INSERT INTO api_keys (id, tenant_id, name, key_hash, key_prefix, scopes, status, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, 'active', ?)`,
  )
    .bind(keyId, body.tenant_id, body.name, keyHash, keyPrefix, JSON.stringify(body.scopes || []), expiresAt)
    .run();

  return c.json(
    success(
      {
        key_id: keyId,
        api_key: rawKey, // Only returned once at creation — never stored or retrievable again
        key_prefix: keyPrefix,
        name: body.name,
        tenant_id: body.tenant_id,
        scopes: body.scopes || [],
        expires_at: expiresAt,
        warning: 'Store this API key securely. It cannot be retrieved again.',
      },
      v(c),
    ),
    201,
  );
});

// ---------------------------------------------------------------------------
// GET /auth/keys — List keys for the authenticated tenant
// ---------------------------------------------------------------------------
auth.get('/keys', async (c) => {
  const ctx = getKeyContext(c);
  const isAdmin = isMasterKey(c);
  const tenantId = (c.req.query('tenant_id') as string) || ctx?.tenantId;

  if (!isAdmin && (!ctx || (tenantId && tenantId !== ctx.tenantId))) {
    return c.json(error('Access denied', 'ECHO_FORBIDDEN', v(c)), 403);
  }

  if (!tenantId && !isAdmin) {
    return c.json(error('Not authenticated with a tenant key', 'ECHO_AUTH_ERROR', v(c)), 401);
  }

  let query: string;
  let params: string[];
  if (isAdmin && !tenantId) {
    query = `SELECT id, tenant_id, name, key_prefix, scopes, status, last_used_at, expires_at, created_at FROM api_keys ORDER BY created_at DESC LIMIT 100`;
    params = [];
  } else {
    query = `SELECT id, tenant_id, name, key_prefix, scopes, status, last_used_at, expires_at, created_at FROM api_keys WHERE tenant_id = ? ORDER BY created_at DESC`;
    params = [tenantId!];
  }

  const result = params.length
    ? await c.env.DB.prepare(query).bind(...params).all()
    : await c.env.DB.prepare(query).all();

  const keys = (result.results || []).map((k) => ({
    ...k,
    scopes: typeof k.scopes === 'string' ? JSON.parse(k.scopes as string) : k.scopes,
  }));

  return c.json(success({ keys, total: keys.length }, v(c)));
});

// ---------------------------------------------------------------------------
// DELETE /auth/keys/:id — Revoke a key
// ---------------------------------------------------------------------------
auth.delete('/keys/:id', async (c) => {
  const keyId = c.req.param('id');
  const ctx = getKeyContext(c);
  const isAdmin = isMasterKey(c);

  // Get the key to check ownership
  const key = await c.env.DB.prepare('SELECT tenant_id FROM api_keys WHERE id = ?').bind(keyId).first<{ tenant_id: string }>();
  if (!key) {
    return c.json(error('Key not found', 'ECHO_NOT_FOUND', v(c)), 404);
  }

  if (!isAdmin && (!ctx || ctx.tenantId !== key.tenant_id)) {
    return c.json(error('Access denied', 'ECHO_FORBIDDEN', v(c)), 403);
  }

  await c.env.DB.prepare(
    `UPDATE api_keys SET status = 'revoked', revoked_at = datetime('now') WHERE id = ?`,
  )
    .bind(keyId)
    .run();

  return c.json(success({ key_id: keyId, status: 'revoked' }, v(c)));
});

// ---------------------------------------------------------------------------
// POST /auth/keys/:id/rotate — Rotate a key (revoke old, issue new)
// ---------------------------------------------------------------------------
auth.post('/keys/:id/rotate', async (c) => {
  const keyId = c.req.param('id');
  const ctx = getKeyContext(c);
  const isAdmin = isMasterKey(c);

  const oldKey = await c.env.DB.prepare(
    'SELECT id, tenant_id, name, scopes, status FROM api_keys WHERE id = ?',
  )
    .bind(keyId)
    .first<{ id: string; tenant_id: string; name: string; scopes: string; status: string }>();

  if (!oldKey) {
    return c.json(error('Key not found', 'ECHO_NOT_FOUND', v(c)), 404);
  }
  if (!isAdmin && (!ctx || ctx.tenantId !== oldKey.tenant_id)) {
    return c.json(error('Access denied', 'ECHO_FORBIDDEN', v(c)), 403);
  }
  if (oldKey.status !== 'active') {
    return c.json(error('Can only rotate active keys', 'ECHO_VALIDATION', v(c)), 400);
  }

  // Revoke old key
  await c.env.DB.prepare(
    `UPDATE api_keys SET status = 'revoked', revoked_at = datetime('now') WHERE id = ?`,
  )
    .bind(keyId)
    .run();

  // Create new key with same tenant, name, scopes
  const rawKey = generateApiKey();
  const keyHash = await sha256(rawKey);
  const keyPrefix = rawKey.slice(0, 16);
  const newKeyId = generateId('key');

  await c.env.DB.prepare(
    `INSERT INTO api_keys (id, tenant_id, name, key_hash, key_prefix, scopes, status)
     VALUES (?, ?, ?, ?, ?, ?, 'active')`,
  )
    .bind(newKeyId, oldKey.tenant_id, `${oldKey.name} (rotated)`, keyHash, keyPrefix, oldKey.scopes)
    .run();

  return c.json(
    success(
      {
        old_key_id: keyId,
        old_status: 'revoked',
        new_key_id: newKeyId,
        api_key: rawKey,
        key_prefix: keyPrefix,
        warning: 'Store this API key securely. It cannot be retrieved again.',
      },
      v(c),
    ),
    201,
  );
});

// ---------------------------------------------------------------------------
// POST /auth/token — Exchange API key for a short-lived JWT
// ---------------------------------------------------------------------------
auth.post('/token', async (c) => {
  const body = await c.req.json<{ api_key: string; ttl_seconds?: number }>().catch(() => null);
  if (!body?.api_key) {
    return c.json(error('api_key is required', 'ECHO_VALIDATION', v(c)), 400);
  }

  const keyHash = await sha256(body.api_key);
  const keyRow = await c.env.DB.prepare(
    `SELECT k.id, k.tenant_id, k.scopes, k.status, k.expires_at,
            t.plan, t.rate_limit, t.status as tenant_status
     FROM api_keys k JOIN tenants t ON k.tenant_id = t.id
     WHERE k.key_hash = ?`,
  )
    .bind(keyHash)
    .first<{
      id: string;
      tenant_id: string;
      scopes: string;
      status: string;
      expires_at: string | null;
      plan: string;
      rate_limit: number;
      tenant_status: string;
    }>();

  if (!keyRow || keyRow.status !== 'active' || keyRow.tenant_status !== 'active') {
    return c.json(error('Invalid or inactive API key', 'ECHO_AUTH_ERROR', v(c)), 401);
  }

  if (keyRow.expires_at && new Date(keyRow.expires_at) < new Date()) {
    return c.json(error('API key has expired', 'ECHO_KEY_EXPIRED', v(c)), 401);
  }

  const ttl = Math.min(body.ttl_seconds || 3600, 86400); // Max 24h
  const jwtSecret = c.env.API_KEY || c.env.ECHO_API_KEY || 'echo-jwt-fallback-secret';

  const token = await createJwt(
    {
      sub: keyRow.tenant_id,
      key_id: keyRow.id,
      plan: keyRow.plan,
      scopes: JSON.parse(keyRow.scopes),
      rate_limit: keyRow.rate_limit,
    },
    jwtSecret,
    ttl,
  );

  return c.json(
    success(
      {
        token,
        token_type: 'Bearer',
        expires_in: ttl,
        tenant_id: keyRow.tenant_id,
        plan: keyRow.plan,
        scopes: JSON.parse(keyRow.scopes),
      },
      v(c),
    ),
  );
});

// ---------------------------------------------------------------------------
// GET /auth/whoami — Show current identity
// ---------------------------------------------------------------------------
auth.get('/whoami', async (c) => {
  if (isMasterKey(c)) {
    return c.json(
      success(
        {
          type: 'master',
          tenant_id: 'tenant_internal',
          plan: 'internal',
          scopes: ['*'],
        },
        v(c),
      ),
    );
  }

  const ctx = getKeyContext(c);
  if (!ctx) {
    return c.json(error('Not authenticated', 'ECHO_AUTH_ERROR', v(c)), 401);
  }

  const tenant = await c.env.DB.prepare(
    'SELECT name, email, plan, rate_limit, daily_limit, monthly_limit FROM tenants WHERE id = ?',
  )
    .bind(ctx.tenantId)
    .first();

  return c.json(
    success(
      {
        type: 'api_key',
        key_id: ctx.keyId,
        tenant_id: ctx.tenantId,
        scopes: ctx.scopes,
        tenant: tenant || null,
      },
      v(c),
    ),
  );
});

// ---------------------------------------------------------------------------
// GET /auth/usage — Usage stats for authenticated key
// ---------------------------------------------------------------------------
auth.get('/usage', async (c) => {
  const ctx = getKeyContext(c);
  const isAdmin = isMasterKey(c);
  const queryKeyId = c.req.query('key_id') as string | undefined;

  let keyId: string;
  if (isAdmin && queryKeyId) {
    keyId = queryKeyId;
  } else if (ctx) {
    keyId = ctx.keyId;
  } else if (isAdmin) {
    // Admin without specific key — return aggregate tenant stats
    return c.json(success({ message: 'Specify ?key_id= or use /auth/usage/tenant' }, v(c)));
  } else {
    return c.json(error('Not authenticated', 'ECHO_AUTH_ERROR', v(c)), 401);
  }

  const today = new Date().toISOString().split('T')[0];
  const month = today.slice(0, 7);

  const [daily, monthly, recent] = await Promise.all([
    c.env.DB.prepare(
      'SELECT request_count, error_count, total_latency_ms FROM usage_daily WHERE key_id = ? AND date = ?',
    )
      .bind(keyId, today)
      .first<{ request_count: number; error_count: number; total_latency_ms: number }>(),
    c.env.DB.prepare(
      'SELECT SUM(request_count) as total, SUM(error_count) as errors FROM usage_daily WHERE key_id = ? AND date LIKE ?',
    )
      .bind(keyId, `${month}%`)
      .first<{ total: number; errors: number }>(),
    c.env.DB.prepare(
      'SELECT endpoint, method, status_code, latency_ms, created_at FROM api_key_usage WHERE key_id = ? ORDER BY created_at DESC LIMIT 20',
    )
      .bind(keyId)
      .all(),
  ]);

  return c.json(
    success(
      {
        key_id: keyId,
        today: {
          requests: daily?.request_count || 0,
          errors: daily?.error_count || 0,
          avg_latency_ms: daily && daily.request_count > 0
            ? Math.round((daily.total_latency_ms / daily.request_count) * 100) / 100
            : 0,
        },
        this_month: {
          requests: monthly?.total || 0,
          errors: monthly?.errors || 0,
        },
        recent_requests: recent.results || [],
      },
      v(c),
    ),
  );
});

// ---------------------------------------------------------------------------
// GET /auth/usage/tenant — Aggregate usage for entire tenant (admin or own)
// ---------------------------------------------------------------------------
auth.get('/usage/tenant', async (c) => {
  const ctx = getKeyContext(c);
  const isAdmin = isMasterKey(c);
  const queryTenantId = c.req.query('tenant_id') as string | undefined;

  let tenantId: string;
  if (isAdmin && queryTenantId) {
    tenantId = queryTenantId;
  } else if (ctx) {
    tenantId = ctx.tenantId;
  } else {
    return c.json(error('Not authenticated', 'ECHO_AUTH_ERROR', v(c)), 401);
  }

  const month = new Date().toISOString().slice(0, 7);

  const [monthlyRow, byKey, tenant] = await Promise.all([
    c.env.DB.prepare(
      'SELECT request_count, error_count FROM usage_monthly WHERE tenant_id = ? AND date = ?',
    )
      .bind(tenantId, month)
      .first<{ request_count: number; error_count: number }>(),
    c.env.DB.prepare(
      `SELECT k.id, k.name, k.key_prefix, k.status,
              COALESCE(SUM(d.request_count), 0) as total_requests,
              COALESCE(SUM(d.error_count), 0) as total_errors
       FROM api_keys k LEFT JOIN usage_daily d ON k.id = d.key_id AND d.date LIKE ?
       WHERE k.tenant_id = ?
       GROUP BY k.id ORDER BY total_requests DESC`,
    )
      .bind(`${month}%`, tenantId)
      .all(),
    c.env.DB.prepare('SELECT name, plan, rate_limit, daily_limit, monthly_limit FROM tenants WHERE id = ?')
      .bind(tenantId)
      .first(),
  ]);

  return c.json(
    success(
      {
        tenant_id: tenantId,
        tenant: tenant || null,
        this_month: {
          requests: monthlyRow?.request_count || 0,
          errors: monthlyRow?.error_count || 0,
        },
        keys: byKey.results || [],
      },
      v(c),
    ),
  );
});

// ---------------------------------------------------------------------------
// GET /auth/plans — Public pricing info (no auth required)
// ---------------------------------------------------------------------------
auth.get('/plans', async (c) => {
  const plans = [
    {
      id: 'free',
      name: 'Free',
      price_monthly: 0,
      price_annual: 0,
      daily_limit: 500,
      monthly_limit: 10000,
      rate_limit: 30,
      features: ['10 engine domains', 'Brain (100 memories)', 'Community support', '30 req/min'],
    },
    {
      id: 'starter',
      name: 'Starter',
      price_monthly: 49,
      price_annual: 468,
      daily_limit: 2000,
      monthly_limit: 50000,
      rate_limit: 60,
      features: ['All engine domains', 'Brain (1K memories)', 'Knowledge search', 'Email support', '60 req/min'],
      stripe_price_monthly: 'price_starter_monthly',
      stripe_price_annual: 'price_starter_annual',
      paypal_plan_monthly: 'P-starter-monthly',
      paypal_plan_annual: 'P-starter-annual',
    },
    {
      id: 'pro',
      name: 'Pro',
      price_monthly: 199,
      price_annual: 1908,
      daily_limit: 10000,
      monthly_limit: 200000,
      rate_limit: 200,
      features: ['All 5,400+ engines', 'Unlimited brain', 'LLM routing (29 models)', 'Forge access', 'Webhooks', 'Priority support', '200 req/min'],
      stripe_price_monthly: 'price_pro_monthly',
      stripe_price_annual: 'price_pro_annual',
      paypal_plan_monthly: 'P-pro-monthly',
      paypal_plan_annual: 'P-pro-annual',
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price_monthly: 999,
      price_annual: 9588,
      daily_limit: 100000,
      monthly_limit: 2000000,
      rate_limit: 1000,
      features: ['Everything in Pro', 'Dedicated routing', '24/7 phone support', '99.9% SLA', 'Custom integrations', '1000 req/min'],
      stripe_price_monthly: 'price_enterprise_monthly',
      stripe_price_annual: 'price_enterprise_annual',
      paypal_plan_monthly: 'P-enterprise-monthly',
      paypal_plan_annual: 'P-enterprise-annual',
    },
  ];
  return c.json(success({ plans }, v(c)));
});

// ---------------------------------------------------------------------------
// POST /auth/signup — Public self-service signup (no auth required)
// C3 FIX: Rate-limited to 5 signups per hour per IP
// ---------------------------------------------------------------------------
const signupBuckets = new Map<string, { count: number; resetAt: number }>();
auth.post('/signup', async (c) => {
  // C3 FIX: Rate limit signups (5 per hour per IP)
  const ip = c.req.header('CF-Connecting-IP') || 'unknown';
  const now = Date.now();
  let bucket = signupBuckets.get(ip);
  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 0, resetAt: now + 3600000 }; // 1 hour window
    signupBuckets.set(ip, bucket);
  }
  bucket.count++;
  if (bucket.count > 5) {
    return c.json(error('Too many signup attempts. Please try again later.', 'ECHO_RATE_LIMITED', v(c)), 429);
  }
  // Cleanup old buckets
  if (signupBuckets.size > 5000) {
    for (const [k, v2] of signupBuckets) { if (now > v2.resetAt) signupBuckets.delete(k); }
  }

  const body = await c.req.json<{ name: string; email: string; company?: string }>().catch(() => null);
  if (!body?.name || !body?.email) {
    return c.json(error('name and email are required', 'ECHO_VALIDATION', v(c)), 400);
  }

  // Validate email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    return c.json(error('Invalid email format', 'ECHO_VALIDATION', v(c)), 400);
  }

  // Check if email already exists
  const existing = await c.env.DB.prepare('SELECT id FROM tenants WHERE email = ?').bind(body.email).first();
  if (existing) {
    return c.json(error('An account with this email already exists. Use your existing API key or contact support.', 'ECHO_DUPLICATE', v(c)), 409);
  }

  const tenantId = generateId('tn');
  const defaults = { rate: 30, daily: 500, monthly: 10000 };

  // Create tenant
  await c.env.DB.prepare(
    `INSERT INTO tenants (id, name, email, plan, rate_limit, daily_limit, monthly_limit, status)
     VALUES (?, ?, ?, 'free', ?, ?, ?, 'active')`,
  )
    .bind(tenantId, body.company || body.name, body.email, defaults.rate, defaults.daily, defaults.monthly)
    .run();

  // Create initial API key
  const rawKey = generateApiKey();
  const keyHash = await sha256(rawKey);
  const keyPrefix = rawKey.slice(0, 16);
  const keyId = generateId('key');

  await c.env.DB.prepare(
    `INSERT INTO api_keys (id, tenant_id, name, key_hash, key_prefix, scopes, status)
     VALUES (?, ?, 'default', ?, ?, '[]', 'active')`,
  )
    .bind(keyId, tenantId, keyHash, keyPrefix)
    .run();

  return c.json(
    success(
      {
        tenant_id: tenantId,
        name: body.company || body.name,
        email: body.email,
        plan: 'free',
        api_key: rawKey,
        key_prefix: keyPrefix,
        limits: { rate_limit: defaults.rate, daily: defaults.daily, monthly: defaults.monthly },
        next_steps: {
          docs: 'https://echo-ept.com/sdk/docs',
          quickstart: 'https://echo-ept.com/sdk/quickstart',
          terminal: 'npm install -g @echo-omega-prime/cli && echo login',
          upgrade: 'https://echo-ept.com/sdk/pricing',
        },
        warning: 'Store your API key securely — it cannot be retrieved again.',
      },
      v(c),
    ),
    201,
  );
});

// ---------------------------------------------------------------------------
// POST /auth/reset-key — Regenerate API key for existing account (by email)
// No auth required — user lost their key and can't authenticate.
// Revokes all existing keys, generates a fresh one.
// ---------------------------------------------------------------------------
auth.post('/reset-key', async (c) => {
  const body = await c.req.json<{ email: string; name?: string }>().catch(() => null);
  if (!body?.email) {
    return c.json(error('email is required', 'ECHO_VALIDATION', v(c)), 400);
  }

  const tenant = await c.env.DB.prepare(
    'SELECT id, name, email, plan FROM tenants WHERE email = ? AND status = \'active\'',
  )
    .bind(body.email)
    .first<{ id: string; name: string; email: string; plan: string }>();

  if (!tenant) {
    return c.json(error('No account found with this email. Please sign up first.', 'ECHO_NOT_FOUND', v(c)), 404);
  }

  // Revoke all existing active keys for this tenant
  await c.env.DB.prepare(
    `UPDATE api_keys SET status = 'revoked', revoked_at = datetime('now') WHERE tenant_id = ? AND status = 'active'`,
  )
    .bind(tenant.id)
    .run();

  // Generate fresh key
  const rawKey = generateApiKey();
  const keyHash = await sha256(rawKey);
  const keyPrefix = rawKey.slice(0, 16);
  const keyId = generateId('key');

  await c.env.DB.prepare(
    `INSERT INTO api_keys (id, tenant_id, name, key_hash, key_prefix, scopes, status)
     VALUES (?, ?, 'default (regenerated)', ?, ?, '[]', 'active')`,
  )
    .bind(keyId, tenant.id, keyHash, keyPrefix)
    .run();

  return c.json(
    success(
      {
        tenant_id: tenant.id,
        name: tenant.name,
        email: tenant.email,
        plan: tenant.plan,
        api_key: rawKey,
        key_prefix: keyPrefix,
        warning: 'Store your API key securely — it cannot be retrieved again. All previous keys have been revoked.',
      },
      v(c),
    ),
    201,
  );
});

// ---------------------------------------------------------------------------
// POST /auth/checkout — Create a Stripe or PayPal checkout session
// ---------------------------------------------------------------------------
auth.post('/checkout', async (c) => {
  const body = await c.req.json<{
    tenant_id?: string;
    email?: string;
    plan: string;
    interval: 'monthly' | 'annual';
    provider: 'stripe' | 'paypal';
    success_url?: string;
    cancel_url?: string;
  }>().catch(() => null);

  if (!body?.plan || !body?.interval || !body?.provider) {
    return c.json(error('plan, interval, and provider are required', 'ECHO_VALIDATION', v(c)), 400);
  }

  // Look up tenant by ID or email
  let tenant: { id: string; email: string; name: string; plan: string } | null = null;
  if (body.tenant_id) {
    tenant = await c.env.DB.prepare('SELECT id, email, name, plan FROM tenants WHERE id = ?')
      .bind(body.tenant_id).first();
  } else if (body.email) {
    tenant = await c.env.DB.prepare('SELECT id, email, name, plan FROM tenants WHERE email = ?')
      .bind(body.email).first();
  }

  if (!tenant) {
    return c.json(error('Tenant not found. Sign up first at /auth/signup', 'ECHO_NOT_FOUND', v(c)), 404);
  }

  const priceMap: Record<string, Record<string, number>> = {
    starter: { monthly: 4900, annual: 46800 },
    pro: { monthly: 19900, annual: 190800 },
    enterprise: { monthly: 99900, annual: 958800 },
  };

  if (!priceMap[body.plan]) {
    return c.json(error('Invalid plan. Options: starter, pro, enterprise', 'ECHO_VALIDATION', v(c)), 400);
  }

  const amountCents = priceMap[body.plan][body.interval];
  const successUrl = body.success_url || 'https://echo-ept.com/sdk/dashboard?checkout=success';
  const cancelUrl = body.cancel_url || 'https://echo-ept.com/sdk/pricing?checkout=cancelled';

  if (body.provider === 'stripe') {
    // Create Stripe Checkout Session via API
    const stripeKey = c.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return c.json(error('Stripe not configured', 'ECHO_CONFIG_ERROR', v(c)), 500);
    }

    const params = new URLSearchParams({
      'mode': body.interval === 'annual' ? 'subscription' : 'subscription',
      'customer_email': tenant.email,
      'success_url': successUrl,
      'cancel_url': cancelUrl,
      'line_items[0][price_data][currency]': 'usd',
      'line_items[0][price_data][product_data][name]': `Echo SDK ${body.plan.charAt(0).toUpperCase() + body.plan.slice(1)} Plan`,
      'line_items[0][price_data][product_data][description]': `Echo Prime Technologies SDK — ${body.plan} tier`,
      'line_items[0][price_data][unit_amount]': String(body.interval === 'annual' ? Math.round(amountCents / 12) : amountCents),
      'line_items[0][price_data][recurring][interval]': 'month',
      'line_items[0][quantity]': '1',
      'metadata[tenant_id]': tenant.id,
      'metadata[plan]': body.plan,
      'metadata[source]': 'echo-sdk-gateway',
    });

    const resp = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const session = await resp.json() as { id: string; url: string; error?: { message: string } };
    if (!resp.ok) {
      return c.json(error(`Stripe error: ${session.error?.message || 'Unknown'}`, 'ECHO_STRIPE_ERROR', v(c)), 502);
    }

    return c.json(success({
      provider: 'stripe',
      checkout_url: session.url,
      session_id: session.id,
      plan: body.plan,
      interval: body.interval,
      amount_cents: amountCents,
    }, v(c)));
  }

  if (body.provider === 'paypal') {
    // Create PayPal order via echo-paypal worker
    try {
      const orderResp = await c.env.ECHO_PAYPAL?.fetch?.('https://echo-paypal/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Echo-API-Key': c.env.ECHO_API_KEY || '' },
        body: JSON.stringify({
          amount: (amountCents / 100).toFixed(2),
          currency: 'USD',
          description: `Echo SDK ${body.plan} Plan (${body.interval})`,
          return_url: successUrl,
          cancel_url: cancelUrl,
          custom_id: `${tenant.id}|${body.plan}|${body.interval}`,
        }),
      });

      if (orderResp && orderResp.ok) {
        const orderData = await orderResp.json() as { data?: { order_id: string; approval_url: string } };
        return c.json(success({
          provider: 'paypal',
          checkout_url: orderData.data?.approval_url,
          order_id: orderData.data?.order_id,
          plan: body.plan,
          interval: body.interval,
          amount_cents: amountCents,
        }, v(c)));
      }
    } catch {
      // Fall through to public URL attempt
    }

    // Fallback: direct PayPal API
    return c.json(error('PayPal checkout unavailable — use Stripe', 'ECHO_PAYPAL_ERROR', v(c)), 502);
  }

  return c.json(error('Invalid provider. Options: stripe, paypal', 'ECHO_VALIDATION', v(c)), 400);
});

// ---------------------------------------------------------------------------
// POST /auth/billing/webhook — Stripe/PayPal webhook handler
// Auto-upgrades tenant plan on successful payment.
// ---------------------------------------------------------------------------
auth.post('/billing/webhook', async (c) => {
  const contentType = c.req.header('content-type') || '';

  // Stripe webhook — C1 FIX: Verify stripe-signature header
  if (c.req.header('stripe-signature')) {
    const rawBody = await c.req.text();
    const sig = c.req.header('stripe-signature') || '';
    const webhookSecret = c.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error(JSON.stringify({ ts: new Date().toISOString(), level: 'error', component: 'billing', message: 'STRIPE_WEBHOOK_SECRET not configured' }));
      return c.json(error('Webhook processing unavailable', 'ECHO_CONFIG_ERROR', v(c)), 503);
    }

    // Verify Stripe signature (tolerance: 5 minutes)
    const sigParts = Object.fromEntries(sig.split(',').map((p: string) => { const [k, ...v] = p.split('='); return [k, v.join('=')]; }));
    const timestamp = sigParts['t'];
    const expectedSig = sigParts['v1'];

    if (!timestamp || !expectedSig) {
      return c.json(error('Invalid webhook signature format', 'ECHO_AUTH_ERROR', v(c)), 401);
    }

    // Check timestamp tolerance (5 minutes)
    const timestampAge = Math.abs(Date.now() / 1000 - parseInt(timestamp));
    if (timestampAge > 300) {
      return c.json(error('Webhook timestamp too old', 'ECHO_AUTH_ERROR', v(c)), 401);
    }

    // Compute expected signature
    const signedPayload = `${timestamp}.${rawBody}`;
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(webhookSecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload));
    const computedSig = Array.from(new Uint8Array(mac)).map(b => b.toString(16).padStart(2, '0')).join('');

    if (computedSig !== expectedSig) {
      console.error(JSON.stringify({ ts: new Date().toISOString(), level: 'error', component: 'billing', message: 'Stripe webhook signature mismatch' }));
      return c.json(error('Invalid webhook signature', 'ECHO_AUTH_ERROR', v(c)), 401);
    }

    let event: { type: string; data: { object: Record<string, unknown> } };

    try {
      event = JSON.parse(rawBody);
    } catch {
      return c.json(error('Invalid webhook payload', 'ECHO_VALIDATION', v(c)), 400);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const tenantId = (session.metadata as Record<string, string>)?.tenant_id;
      const plan = (session.metadata as Record<string, string>)?.plan;

      if (tenantId && plan) {
        const planDefaults: Record<string, { rate: number; daily: number; monthly: number }> = {
          starter: { rate: 60, daily: 2000, monthly: 50000 },
          pro: { rate: 200, daily: 10000, monthly: 200000 },
          enterprise: { rate: 1000, daily: 100000, monthly: 2000000 },
        };
        const limits = planDefaults[plan] || planDefaults.pro;

        await c.env.DB.prepare(
          `UPDATE tenants SET plan = ?, rate_limit = ?, daily_limit = ?, monthly_limit = ? WHERE id = ?`,
        ).bind(plan, limits.rate, limits.daily, limits.monthly, tenantId).run();

        console.log(JSON.stringify({
          ts: new Date().toISOString(),
          level: 'info',
          component: 'billing',
          event: 'plan_upgraded',
          tenant_id: tenantId,
          plan,
          stripe_session: session.id,
        }));
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object;
      const tenantId = (sub.metadata as Record<string, string>)?.tenant_id;
      if (tenantId) {
        await c.env.DB.prepare(
          `UPDATE tenants SET plan = 'free', rate_limit = 30, daily_limit = 500, monthly_limit = 10000 WHERE id = ?`,
        ).bind(tenantId).run();

        console.log(JSON.stringify({
          ts: new Date().toISOString(),
          level: 'info',
          component: 'billing',
          event: 'plan_downgraded',
          tenant_id: tenantId,
          reason: 'subscription_cancelled',
        }));
      }
    }

    return new Response('ok', { status: 200 });
  }

  // PayPal webhook
  const rawBody = await c.req.text();
  let event: { event_type: string; resource: Record<string, unknown> };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return c.json(error('Invalid webhook payload', 'ECHO_VALIDATION', v(c)), 400);
  }

  if (event.event_type === 'CHECKOUT.ORDER.APPROVED' || event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
    const customId = (event.resource.custom_id as string) || '';
    const [tenantId, plan] = customId.split('|');

    if (tenantId && plan) {
      const planDefaults: Record<string, { rate: number; daily: number; monthly: number }> = {
        starter: { rate: 60, daily: 2000, monthly: 50000 },
        pro: { rate: 200, daily: 10000, monthly: 200000 },
        enterprise: { rate: 1000, daily: 100000, monthly: 2000000 },
      };
      const limits = planDefaults[plan] || planDefaults.pro;

      await c.env.DB.prepare(
        `UPDATE tenants SET plan = ?, rate_limit = ?, daily_limit = ?, monthly_limit = ? WHERE id = ?`,
      ).bind(plan, limits.rate, limits.daily, limits.monthly, tenantId).run();
    }
  }

  return new Response('ok', { status: 200 });
});

export default auth;
