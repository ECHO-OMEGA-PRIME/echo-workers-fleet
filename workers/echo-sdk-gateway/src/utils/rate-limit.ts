/**
 * Echo SDK Gateway — KV-backed rate limiter.
 *
 * Per-IP sliding window (60 requests/minute default).
 * Uses Cloudflare KV with TTL-based expiry.
 */

import type { Context, Next } from 'hono';
import type { Env } from '../types';
import { error } from './envelope';

const MAX_REQUESTS = 60;
const WINDOW_SECONDS = 60;

export async function rateLimitMiddleware(c: Context<{ Bindings: Env }>, next: Next): Promise<Response | void> {
  const kv = c.env.RATE_LIMIT;
  if (!kv) { await next(); return; } // No KV bound — skip rate limiting

  const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
  const window = Math.floor(Date.now() / (WINDOW_SECONDS * 1000));
  const key = `rl:${ip}:${window}`;

  const current = parseInt((await kv.get(key)) || '0', 10);

  if (current >= MAX_REQUESTS) {
    const version = c.env.WORKER_VERSION || '1.0.0';
    return c.json(
      error(`Rate limit exceeded. Max ${MAX_REQUESTS} requests per ${WINDOW_SECONDS}s.`, 'ECHO_RATE_LIMIT', version),
      429,
    );
  }

  // Increment counter with TTL
  await kv.put(key, String(current + 1), { expirationTtl: WINDOW_SECONDS * 2 });

  // Set rate limit headers
  c.header('X-RateLimit-Limit', String(MAX_REQUESTS));
  c.header('X-RateLimit-Remaining', String(MAX_REQUESTS - current - 1));

  await next();
}
