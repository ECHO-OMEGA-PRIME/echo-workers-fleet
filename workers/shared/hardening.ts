/**
 * Echo Universal Hardening Middleware v1.0
 *
 * Drop-in security middleware for all Cloudflare Workers.
 * Addresses the 210+ audit findings with standardized patterns.
 *
 * Usage in any Hono worker:
 *   import { applyHardening } from '../shared/hardening';
 *   applyHardening(app, { requireAuth: true, maxBodySize: 256_000 });
 */

import { Context, Next } from 'hono';

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface HardeningOptions {
  /** Require auth on all endpoints (default: true) */
  requireAuth?: boolean;
  /** Paths that skip auth (e.g., ['/health']) */
  authExemptPaths?: string[];
  /** Max request body size in bytes (default: 256KB) */
  maxBodySize?: number;
  /** Rate limit: requests per minute per IP (default: 120) */
  rateLimit?: number;
  /** Rate limit window in seconds (default: 60) */
  rateLimitWindow?: number;
  /** Allowed CORS origins (default: none — no wildcard) */
  allowedOrigins?: string[];
  /** Worker name for error reporting */
  workerName?: string;
  /** GS343 error reporting URL */
  gs343Url?: string;
  /** Enable security headers (default: true) */
  securityHeaders?: boolean;
}

const DEFAULT_OPTIONS: Required<HardeningOptions> = {
  requireAuth: true,
  authExemptPaths: ['/health', '/openapi.json'],
  maxBodySize: 256_000,
  rateLimit: 120,
  rateLimitWindow: 60,
  allowedOrigins: [],
  workerName: 'unknown-worker',
  gs343Url: 'https://echo-gs343.bmcii1976.workers.dev',
  securityHeaders: true,
};

// ═══════════════════════════════════════════════════════════════════
// SECURITY HEADERS
// ═══════════════════════════════════════════════════════════════════

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '0',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains',
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
};

// ═══════════════════════════════════════════════════════════════════
// AUTH MIDDLEWARE — Timing-safe comparison, no silent bypass
// ═══════════════════════════════════════════════════════════════════

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const encoder = new TextEncoder();
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);
  let result = 0;
  for (let i = 0; i < aBytes.length; i++) {
    result |= aBytes[i] ^ bBytes[i];
  }
  return result === 0;
}

function authMiddleware(opts: Required<HardeningOptions>) {
  return async (c: Context, next: Next) => {
    const path = new URL(c.req.url).pathname;

    // Check exempt paths
    if (opts.authExemptPaths.some((p) => path === p || path.startsWith(p + '/'))) {
      return next();
    }

    // OPTIONS always pass (CORS preflight)
    if (c.req.method === 'OPTIONS') return next();

    if (!opts.requireAuth) return next();

    const apiKey = (c.env as Record<string, string>).ECHO_API_KEY ||
                   (c.env as Record<string, string>).API_KEY;

    // CRITICAL: Never silently allow all when key is not configured
    if (!apiKey) {
      console.error(`[HARDENING] ${opts.workerName}: No API key configured — blocking all requests`);
      return c.json({ success: false, error: { message: 'Service misconfigured', code: 'AUTH_CONFIG_ERROR' } }, 503);
    }

    const provided = c.req.header('X-Echo-API-Key') ||
                     c.req.header('Authorization')?.replace('Bearer ', '') || '';

    if (!provided || !timingSafeEqual(provided, apiKey)) {
      return c.json({ success: false, error: { message: 'Unauthorized', code: 'AUTH_ERROR' } }, 401);
    }

    return next();
  };
}

// ═══════════════════════════════════════════════════════════════════
// CORS MIDDLEWARE — No wildcard, explicit allowlist only
// ═══════════════════════════════════════════════════════════════════

function corsMiddleware(opts: Required<HardeningOptions>) {
  return async (c: Context, next: Next) => {
    const origin = c.req.header('Origin') || '';

    // Determine allowed origin
    let allowedOrigin = '';
    if (opts.allowedOrigins.length === 0) {
      // No origins configured — allow same-origin / non-browser only
      allowedOrigin = '';
    } else if (opts.allowedOrigins.includes('*')) {
      // Explicit wildcard opt-in (for public APIs only)
      allowedOrigin = '*';
    } else if (origin && opts.allowedOrigins.some((o) => origin === o)) {
      // Exact match only — no startsWith, no subdomain tricks
      allowedOrigin = origin;
    }

    if (c.req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': allowedOrigin,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-Echo-API-Key, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    await next();

    if (allowedOrigin) {
      c.header('Access-Control-Allow-Origin', allowedOrigin);
      c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      c.header('Access-Control-Allow-Headers', 'Content-Type, X-Echo-API-Key, Authorization');
    }
  };
}

// ═══════════════════════════════════════════════════════════════════
// BODY SIZE LIMITER — Prevent payload bombs
// ═══════════════════════════════════════════════════════════════════

function bodySizeLimiter(opts: Required<HardeningOptions>) {
  return async (c: Context, next: Next) => {
    if (c.req.method === 'GET' || c.req.method === 'OPTIONS' || c.req.method === 'HEAD') {
      return next();
    }

    const contentLength = parseInt(c.req.header('Content-Length') || '0');
    if (contentLength > opts.maxBodySize) {
      return c.json({
        success: false,
        error: { message: `Request body too large (max ${opts.maxBodySize} bytes)`, code: 'PAYLOAD_TOO_LARGE' },
      }, 413);
    }

    return next();
  };
}

// ═══════════════════════════════════════════════════════════════════
// SECURITY HEADERS MIDDLEWARE
// ═══════════════════════════════════════════════════════════════════

function securityHeadersMiddleware(opts: Required<HardeningOptions>) {
  return async (c: Context, next: Next) => {
    await next();
    if (opts.securityHeaders) {
      for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
        c.header(key, value);
      }
    }
  };
}

// ═══════════════════════════════════════════════════════════════════
// ERROR SANITIZER — Never leak internals to clients
// ═══════════════════════════════════════════════════════════════════

function errorSanitizer(opts: Required<HardeningOptions>) {
  return async (c: Context, next: Next) => {
    try {
      await next();
    } catch (err) {
      const errorId = crypto.randomUUID().slice(0, 8);
      const errMsg = err instanceof Error ? err.message : String(err);
      const errStack = err instanceof Error ? err.stack : undefined;

      // Log full error server-side
      console.error(JSON.stringify({
        ts: new Date().toISOString(),
        worker: opts.workerName,
        error_id: errorId,
        message: errMsg,
        stack: errStack,
        path: new URL(c.req.url).pathname,
        method: c.req.method,
      }));

      // Report to GS343
      reportToGS343(opts, errMsg, errorId).catch(() => {});

      // Return sanitized error to client
      return c.json({
        success: false,
        error: {
          message: 'Internal server error',
          code: 'INTERNAL_ERROR',
          reference: errorId,
        },
      }, 500);
    }
  };
}

// ═══════════════════════════════════════════════════════════════════
// GS343 ERROR REPORTING
// ═══════════════════════════════════════════════════════════════════

async function reportToGS343(opts: Required<HardeningOptions>, error: string, errorId: string): Promise<void> {
  try {
    await fetch(`${opts.gs343Url}/errors/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error,
        source: opts.workerName,
        category: 'runtime',
        error_id: errorId,
        timestamp: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    // GS343 reporting is best-effort
  }
}

// ═══════════════════════════════════════════════════════════════════
// RATE LIMITER — Simple IP-based, fail-closed
// ═══════════════════════════════════════════════════════════════════

function rateLimiter(opts: Required<HardeningOptions>) {
  // In-memory rate limiting (per-isolate, best-effort for Workers)
  const buckets = new Map<string, { count: number; resetAt: number }>();

  return async (c: Context, next: Next) => {
    if (c.req.method === 'OPTIONS') return next();

    const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Real-IP') || 'unknown';
    const now = Date.now();
    const windowMs = opts.rateLimitWindow * 1000;

    let bucket = buckets.get(ip);
    if (!bucket || now > bucket.resetAt) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(ip, bucket);
    }

    bucket.count++;

    if (bucket.count > opts.rateLimit) {
      c.header('Retry-After', String(Math.ceil((bucket.resetAt - now) / 1000)));
      return c.json({
        success: false,
        error: { message: 'Rate limit exceeded', code: 'RATE_LIMITED' },
      }, 429);
    }

    // Cleanup old buckets periodically
    if (buckets.size > 10000) {
      for (const [k, v] of buckets) {
        if (now > v.resetAt) buckets.delete(k);
      }
    }

    return next();
  };
}

// ═══════════════════════════════════════════════════════════════════
// SQL SAFETY — Parameterized query helpers
// ═══════════════════════════════════════════════════════════════════

/** Check if SQL is safe (SELECT only for untrusted contexts) */
export function isSafeSql(sql: string): boolean {
  const normalized = sql.trim().toUpperCase();
  const forbidden = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'CREATE', 'REPLACE', 'TRUNCATE', 'ATTACH', 'DETACH', 'PRAGMA'];
  return !forbidden.some((kw) => normalized.startsWith(kw) || normalized.includes(` ${kw} `) || normalized.includes(`;${kw}`));
}

/** Sanitize input for SQL LIKE patterns */
export function sanitizeLike(input: string): string {
  return input.replace(/[%_\\]/g, '\\$&');
}

/** Validate integer parameter */
export function safeInt(value: unknown, defaultVal: number, min: number = 0, max: number = 100000): number {
  const n = parseInt(String(value));
  if (isNaN(n) || n < min || n > max) return defaultVal;
  return n;
}

// ═══════════════════════════════════════════════════════════════════
// MAIN EXPORT — Apply all hardening to a Hono app
// ═══════════════════════════════════════════════════════════════════

export function applyHardening(app: { use: (...args: any[]) => void }, userOpts: HardeningOptions = {}): void {
  const opts: Required<HardeningOptions> = { ...DEFAULT_OPTIONS, ...userOpts };

  // Order matters: error sanitizer wraps everything, then security headers, CORS, body limit, rate limit, auth
  app.use('*', errorSanitizer(opts));
  app.use('*', securityHeadersMiddleware(opts));
  app.use('*', corsMiddleware(opts));
  app.use('*', bodySizeLimiter(opts));
  app.use('*', rateLimiter(opts));
  app.use('*', authMiddleware(opts));
}

/** Standalone GS343 error reporter for use in catch blocks */
export async function gs343Report(workerName: string, error: string, gs343Url?: string): Promise<void> {
  const url = gs343Url || DEFAULT_OPTIONS.gs343Url;
  const errorId = crypto.randomUUID().slice(0, 8);
  return reportToGS343({ ...DEFAULT_OPTIONS, workerName, gs343Url: url }, error, errorId);
}

/** Create a safe error response (use instead of returning err.message) */
export function safeError(message: string = 'Internal server error', code: string = 'INTERNAL_ERROR', status: number = 500) {
  return {
    body: { success: false, error: { message, code, reference: crypto.randomUUID().slice(0, 8) } },
    status,
  };
}
