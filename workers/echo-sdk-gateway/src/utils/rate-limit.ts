/**
 * Echo SDK Gateway — Tenant-aware rate limiter.
 *
 * H2 FIX: Uses tenant rate_limit from auth context instead of hardcoded 60/min.
 * H3 FIX: Uses D1 atomic INSERT...ON CONFLICT instead of KV read-then-write race.
 * Falls back to KV-based limiter if DB unavailable.
 */

import type { Context, Next } from 'hono';
import type { Env, AuthVariables } from '../types';
import { error } from './envelope';

const DEFAULT_MAX_REQUESTS = 60;
const WINDOW_SECONDS = 60;

export async function rateLimitMiddleware(
  c: Context<{ Bindings: Env; Variables: AuthVariables }>,
  next: Next,
): Promise<Response | void> {
  const version = c.env.WORKER_VERSION || '1.0.0';

  // H2 FIX: Use tenant-specific rate limit if set by auth middleware
  const tenantLimit = c.get('auth_rate_limit');
  const maxRequests = tenantLimit && tenantLimit > 0 ? tenantLimit : DEFAULT_MAX_REQUESTS;

  // Rate limit key: tenant-aware if authenticated, IP-based otherwise
  const tenantId = c.get('auth_tenant_id');
  const ip = c.req.header('CF-Connecting-IP') || 'unknown';
  const window = Math.floor(Date.now() / (WINDOW_SECONDS * 1000));
  const rateKey = tenantId ? `rl:${tenantId}:${window}` : `rl:ip:${ip}:${window}`;

  // H3 FIX: Try D1 atomic increment first (no race condition)
  if (c.env.DB) {
    try {
      const now = Math.floor(Date.now() / 1000);
      const windowStart = now - WINDOW_SECONDS;
      const result = await c.env.DB.prepare(
        `INSERT INTO rate_limits (key, count, window_start)
         VALUES (?1, 1, ?2)
         ON CONFLICT(key) DO UPDATE SET
           count = CASE WHEN window_start < ?3 THEN 1 ELSE count + 1 END,
           window_start = CASE WHEN window_start < ?3 THEN ?2 ELSE window_start END
         RETURNING count`,
      ).bind(rateKey, now, windowStart).first<{ count: number }>();

      const current = result?.count || 0;

      if (current > maxRequests) {
        c.header('X-RateLimit-Limit', String(maxRequests));
        c.header('X-RateLimit-Remaining', '0');
        c.header('Retry-After', String(WINDOW_SECONDS));
        return c.json(
          error(`Rate limit exceeded. Max ${maxRequests} requests per ${WINDOW_SECONDS}s.`, 'ECHO_RATE_LIMIT', version),
          429,
        );
      }

      c.header('X-RateLimit-Limit', String(maxRequests));
      c.header('X-RateLimit-Remaining', String(Math.max(0, maxRequests - current)));
      await next();
      return;
    } catch {
      // D1 failed — fall through to KV
    }
  }

  // Fallback: KV-based rate limiting (original behavior, still has race but better than nothing)
  const kv = c.env.RATE_LIMIT;
  if (!kv) { await next(); return; }

  const current = parseInt((await kv.get(rateKey)) || '0', 10);

  if (current >= maxRequests) {
    c.header('X-RateLimit-Limit', String(maxRequests));
    c.header('X-RateLimit-Remaining', '0');
    c.header('Retry-After', String(WINDOW_SECONDS));
    return c.json(
      error(`Rate limit exceeded. Max ${maxRequests} requests per ${WINDOW_SECONDS}s.`, 'ECHO_RATE_LIMIT', version),
      429,
    );
  }

  await kv.put(rateKey, String(current + 1), { expirationTtl: WINDOW_SECONDS * 2 });

  c.header('X-RateLimit-Limit', String(maxRequests));
  c.header('X-RateLimit-Remaining', String(maxRequests - current - 1));

  await next();
}
