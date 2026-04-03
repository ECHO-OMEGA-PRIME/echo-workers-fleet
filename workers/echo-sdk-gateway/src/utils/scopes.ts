/**
 * Echo SDK Gateway — Scope enforcement middleware.
 *
 * H4 FIX: Routes check required scopes against auth_scopes from auth middleware.
 * Master keys have ['*'] which passes all checks.
 */

import type { Context, Next } from 'hono';
import type { Env, AuthVariables } from '../types';
import { error } from './envelope';

// Route prefix → required scope mapping
const ROUTE_SCOPES: Record<string, string> = {
  '/engine': 'engine:read',
  '/brain': 'brain:read',
  '/knowledge': 'knowledge:read',
  '/vault': 'vault:read',
  '/worker': 'worker:call',
  '/search': 'search:read',
  '/sdk': 'sdk:read',
  '/forge': 'forge:read',
  '/llm': 'llm:call',
  '/webhooks': 'webhooks:manage',
  '/events': 'webhooks:manage',
  '/versioning': 'versioning:read',
  '/agi': 'agi:call',
  '/compose': 'compose:call',
  '/data': 'data:read',
  '/functions': 'functions:call',
  '/services': 'services:call',
  '/auth': 'auth:manage',
};

// Write operations need elevated scope
const WRITE_METHODS = new Set(['POST', 'PUT', 'DELETE', 'PATCH']);

export function hasScope(scopes: string[], required: string): boolean {
  if (scopes.includes('*')) return true;
  if (scopes.includes(required)) return true;
  // Check wildcard prefix: 'engine:*' matches 'engine:read'
  const [domain] = required.split(':');
  if (scopes.includes(`${domain}:*`)) return true;
  return false;
}

export async function scopeMiddleware(
  c: Context<{ Bindings: Env; Variables: AuthVariables }>,
  next: Next,
): Promise<Response | void> {
  const path = new URL(c.req.url).pathname;
  const version = c.env.WORKER_VERSION || '1.0.0';

  // Find matching route prefix
  const prefix = Object.keys(ROUTE_SCOPES).find((p) => path.startsWith(p));
  if (!prefix) {
    // No scope requirement for this path (health, openapi, etc.)
    await next();
    return;
  }

  const scopes = c.get('auth_scopes');
  if (!scopes) {
    // No auth context — should have been caught by authMiddleware
    await next();
    return;
  }

  let requiredScope = ROUTE_SCOPES[prefix];

  // For write methods, require :write instead of :read
  if (WRITE_METHODS.has(c.req.method) && requiredScope.endsWith(':read')) {
    requiredScope = requiredScope.replace(':read', ':write');
  }

  if (!hasScope(scopes, requiredScope)) {
    return c.json(
      error(
        `Insufficient scope. Required: ${requiredScope}. Your scopes: ${scopes.join(', ')}`,
        'ECHO_FORBIDDEN',
        version,
      ),
      403,
    );
  }

  await next();
}
