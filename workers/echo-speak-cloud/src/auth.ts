/**
 * Authentication middleware for echo-speak-cloud.
 *
 * Enforces X-Echo-API-Key header validation on ALL routes except /health.
 * Uses timing-safe comparison to prevent timing attacks.
 * Returns 503 if ECHO_API_KEY env var is not configured (misconfiguration).
 * Returns 401 if key is missing or invalid.
 * Allows service bindings (no CF-Connecting-IP) to bypass auth.
 */

import type { Context, Next } from 'hono';

/** Paths that are exempt from authentication */
const AUTH_EXEMPT_PATHS = new Set(['/health']);

/**
 * Timing-safe string comparison to prevent timing attacks.
 * Compares every character regardless of mismatch position.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Detect if the request comes from a Cloudflare Service Binding
 * (internal worker-to-worker call). These have no CF-Connecting-IP header.
 */
function isServiceBinding(c: Context): boolean {
  return !c.req.header('CF-Connecting-IP');
}

/**
 * Validate the API key from the request against env.ECHO_API_KEY.
 * Returns null if valid, or a Response if invalid.
 */
function validateApiKey(c: Context): Response | null {
  const key =
    c.req.header('X-Echo-API-Key') ||
    c.req.header('Authorization')?.replace('Bearer ', '');

  if (!c.env.ECHO_API_KEY) {
    return c.json(
      { error: 'Service misconfigured: authentication not available' },
      503
    );
  }

  if (!key) {
    return c.json({ error: 'Unauthorized: X-Echo-API-Key header required' }, 401);
  }

  if (!timingSafeEqual(key, c.env.ECHO_API_KEY)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  return null;
}

/**
 * Global auth middleware. Must be registered with app.use('*', authMiddleware)
 * BEFORE any route handlers.
 *
 * Exempts:
 *   - /health (monitoring/uptime checks)
 *   - OPTIONS requests (CORS preflight)
 *   - Service binding calls (no CF-Connecting-IP)
 */
export async function authMiddleware(c: Context, next: Next): Promise<Response | void> {
  // Always allow CORS preflight
  if (c.req.method === 'OPTIONS') {
    return next();
  }

  // Exempt health check
  if (AUTH_EXEMPT_PATHS.has(c.req.path)) {
    return next();
  }

  // Allow service bindings (worker-to-worker)
  if (isServiceBinding(c)) {
    return next();
  }

  // Validate API key
  const authError = validateApiKey(c);
  if (authError) {
    return authError;
  }

  return next();
}

/**
 * Per-route auth check (strict - no service binding bypass).
 * Use for sensitive operations like voice cloning, cache deletion, etc.
 */
export function requireAuth(c: Context): Response | null {
  return validateApiKey(c);
}

/**
 * Per-route auth check with service binding bypass.
 * Use for standard authenticated operations.
 */
export function requireAuthOrBinding(c: Context): Response | null {
  if (isServiceBinding(c)) return null;
  return validateApiKey(c);
}
