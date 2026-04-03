/**
 * Echo SDK Gateway — Authentication middleware (Multi-Tenant).
 *
 * Three auth modes (checked in order):
 *   1. Master key — static key from env (full admin access)
 *   2. Tenant API key — hashed lookup in D1 api_keys table
 *   3. JWT Bearer token — HMAC-SHA256 signed token from /auth/token
 *
 * Exempt paths: /health, /openapi.json (public).
 * On success, sets context variables: auth_key_id, auth_tenant_id, auth_scopes, auth_plan.
 */

import type { Context, Next } from 'hono';
import type { Env, AuthVariables } from '../types';

import { error } from './envelope';

// C2 FIX: Removed /auth/reset-key from exemptions — requires auth now
// /auth/billing/webhook handles its own verification (Stripe signature)
const EXEMPT_PATHS = new Set(['/health', '/openapi.json', '/auth/signup', '/auth/plans', '/auth/billing/webhook']);

/** L5 FIX: Timing-safe string comparison — pad to same length to prevent length oracle. */
function timingSafeEqual(a: string, b: string): boolean {
  // Pad shorter string to prevent length-based timing leak
  const maxLen = Math.max(a.length, b.length, 1);
  const paddedA = a.padEnd(maxLen, '\0');
  const paddedB = b.padEnd(maxLen, '\0');
  let result = a.length ^ b.length; // length mismatch = fail, but constant time
  for (let i = 0; i < maxLen; i++) {
    result |= paddedA.charCodeAt(i) ^ paddedB.charCodeAt(i);
  }
  return result === 0;
}

/** SHA-256 hash a string, return hex digest */
async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Verify and decode a JWT (HMAC-SHA256) */
async function verifyJwt(token: string, secret: string): Promise<Record<string, unknown> | null> {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [header, payload, signature] = parts;
  const signingInput = `${header}.${payload}`;

  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    );

    // Decode signature from base64url
    const sigBytes = Uint8Array.from(
      atob(signature.replace(/-/g, '+').replace(/_/g, '/')),
      (c) => c.charCodeAt(0),
    );

    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(signingInput));
    if (!valid) return null;

    // Decode payload
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));

    // Check expiry
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }

    return decoded;
  } catch {
    return null;
  }
}

export async function authMiddleware(c: Context<{ Bindings: Env; Variables: AuthVariables }>, next: Next): Promise<Response | void> {
  const path = new URL(c.req.url).pathname;

  // Exempt paths — no auth required
  if (EXEMPT_PATHS.has(path)) {
    await next();
    return;
  }

  // Auth paths that handle their own authentication (/auth/token uses raw key in body)
  if (path === '/auth/token') {
    await next();
    return;
  }

  const masterKey = c.env.API_KEY || c.env.ECHO_API_KEY || '';
  const version = c.env.WORKER_VERSION || '3.0.0';

  // C5 FIX: Block all requests if no API key configured — never silently allow
  if (!masterKey) {
    return c.json(error('Service misconfigured — no auth key set', 'ECHO_CONFIG_ERROR', version), 503);
  }

  const provided =
    c.req.header('X-Echo-API-Key') ||
    c.req.header('Authorization')?.replace(/^Bearer\s+/i, '') ||
    '';

  if (!provided) {
    return c.json(error('Unauthorized — provide X-Echo-API-Key or Authorization: Bearer header', 'ECHO_AUTH_ERROR', version), 401);
  }

  // ─── Mode 1: Master key check (timing-safe) ────────────────────────────
  if (provided.length === masterKey.length && timingSafeEqual(provided, masterKey)) {
    // Master key — set internal tenant context
    c.set('auth_key_id', 'master');
    c.set('auth_tenant_id', 'tenant_internal');
    c.set('auth_scopes', ['*']);
    c.set('auth_plan', 'internal');
    c.set('auth_type', 'master');
    await next();
    return;
  }

  // ─── Mode 2: JWT token check ────────────────────────────────────────────
  if (provided.split('.').length === 3) {
    const payload = await verifyJwt(provided, masterKey);
    if (payload) {
      c.set('auth_key_id', payload.key_id as string);
      c.set('auth_tenant_id', payload.sub as string);
      c.set('auth_scopes', (payload.scopes as string[]) || []);
      c.set('auth_plan', payload.plan as string);
      c.set('auth_type', 'jwt');
      await next();
      return;
    }
    // JWT failed verification — fall through to API key check
  }

  // ─── Mode 3: Tenant API key (D1 lookup) ─────────────────────────────────
  if (provided.startsWith('echo_sk_') && c.env.DB) {
    const keyHash = await sha256(provided);

    const keyRow = await c.env.DB.prepare(
      `SELECT k.id, k.tenant_id, k.scopes, k.status, k.expires_at, k.rate_limit_override,
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
        rate_limit_override: number | null;
        plan: string;
        rate_limit: number;
        tenant_status: string;
      }>();

    if (keyRow && keyRow.status === 'active' && keyRow.tenant_status === 'active') {
      // Check expiry
      if (keyRow.expires_at && new Date(keyRow.expires_at) < new Date()) {
        return c.json(error('API key has expired', 'ECHO_KEY_EXPIRED', version), 401);
      }

      c.set('auth_key_id', keyRow.id);
      c.set('auth_tenant_id', keyRow.tenant_id);
      c.set('auth_scopes', JSON.parse(keyRow.scopes || '[]'));
      c.set('auth_plan', keyRow.plan);
      c.set('auth_type', 'api_key');
      c.set('auth_rate_limit', keyRow.rate_limit_override || keyRow.rate_limit);

      // M7 FIX: Enforce daily/monthly quotas
      const quota = await checkQuota(c.env.DB, keyRow.tenant_id);
      if (!quota.allowed) {
        return c.json(error(quota.reason || 'Quota exceeded', 'ECHO_QUOTA_EXCEEDED', version), 429);
      }

      // Fire-and-forget: update last_used_at
      const ip = c.req.header('CF-Connecting-IP') || 'unknown';
      c.executionCtx.waitUntil(
        c.env.DB.prepare('UPDATE api_keys SET last_used_at = datetime(\'now\'), last_ip = ? WHERE id = ?')
          .bind(ip, keyRow.id)
          .run()
          .catch(() => {}),
      );

      await next();

      // Fire-and-forget: log usage
      const statusCode = c.res.status;
      c.executionCtx.waitUntil(logUsage(c.env.DB, keyRow.id, keyRow.tenant_id, path, c.req.method, statusCode, ip));

      return;
    }
  }

  // All auth modes failed
  return c.json(error('Unauthorized — invalid API key or token', 'ECHO_AUTH_ERROR', version), 401);
}

/** M7 FIX: Check daily/monthly quota enforcement before processing request */
async function checkQuota(db: D1Database, tenantId: string): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const month = today.slice(0, 7);

    const [tenant, dailyUsage, monthlyUsage] = await Promise.all([
      db.prepare('SELECT daily_limit, monthly_limit FROM tenants WHERE id = ?').bind(tenantId).first<{ daily_limit: number; monthly_limit: number }>(),
      db.prepare('SELECT SUM(request_count) as total FROM usage_daily WHERE tenant_id = ? AND date = ?').bind(tenantId, today).first<{ total: number }>(),
      db.prepare('SELECT SUM(request_count) as total FROM usage_monthly WHERE tenant_id = ? AND date = ?').bind(tenantId, month).first<{ total: number }>(),
    ]);

    if (!tenant) return { allowed: true }; // No tenant record = no limits

    const dailyTotal = dailyUsage?.total || 0;
    const monthlyTotal = monthlyUsage?.total || 0;

    if (tenant.daily_limit > 0 && dailyTotal >= tenant.daily_limit) {
      return { allowed: false, reason: `Daily quota exceeded (${dailyTotal}/${tenant.daily_limit})` };
    }
    if (tenant.monthly_limit > 0 && monthlyTotal >= tenant.monthly_limit) {
      return { allowed: false, reason: `Monthly quota exceeded (${monthlyTotal}/${tenant.monthly_limit})` };
    }

    return { allowed: true };
  } catch {
    return { allowed: true }; // Quota check failure = allow (fail open)
  }
}

export { checkQuota };

/** Fire-and-forget usage logging + aggregate updates */
async function logUsage(
  db: D1Database,
  keyId: string,
  tenantId: string,
  endpoint: string,
  method: string,
  statusCode: number,
  ip: string,
): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const month = today.slice(0, 7);
  const isError = statusCode >= 400 ? 1 : 0;

  try {
    await db.batch([
      // Detailed log
      db.prepare(
        'INSERT INTO api_key_usage (key_id, tenant_id, endpoint, method, status_code, ip) VALUES (?, ?, ?, ?, ?, ?)',
      ).bind(keyId, tenantId, endpoint, method, statusCode, ip),
      // Daily aggregate
      db.prepare(
        `INSERT INTO usage_daily (tenant_id, key_id, date, request_count, error_count)
         VALUES (?, ?, ?, 1, ?)
         ON CONFLICT(tenant_id, key_id, date) DO UPDATE SET
           request_count = request_count + 1,
           error_count = error_count + ?`,
      ).bind(tenantId, keyId, today, isError, isError),
      // Monthly aggregate
      db.prepare(
        `INSERT INTO usage_monthly (tenant_id, date, request_count, error_count)
         VALUES (?, ?, 1, ?)
         ON CONFLICT(tenant_id, date) DO UPDATE SET
           request_count = request_count + 1,
           error_count = error_count + ?`,
      ).bind(tenantId, month, isError, isError),
    ]);
  } catch {
    // Usage logging is best-effort — never fail the request
  }
}
