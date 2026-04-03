/**
 * Echo SDK Gateway — Service binding proxy utilities.
 *
 * Wraps Cloudflare service bindings (Worker-to-Worker fetch)
 * with structured logging, latency tracking, and error normalization.
 */

import type { Env } from '../types';

interface ProxyOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  timeout_ms?: number;
}

interface ProxyResult<T = unknown> {
  ok: boolean;
  data: T;
  latency_ms: number;
  status: number;
}

/**
 * Proxy a request to a service binding.
 *
 * Service bindings ignore AbortSignal (known CF limitation), so we use
 * wall-clock timeout detection post-hoc for logging, not cancellation.
 */
export async function proxyBinding<T = unknown>(
  binding: Fetcher,
  path: string,
  opts: ProxyOptions = {},
): Promise<ProxyResult<T>> {
  const start = Date.now();
  const method = opts.method || 'GET';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...opts.headers,
  };

  const fetchOpts: RequestInit = { method, headers };
  if (opts.body && method !== 'GET') {
    fetchOpts.body = JSON.stringify(opts.body);
  }

  // Service bindings use a dummy URL — only the path matters
  const url = `https://internal${path}`;

  const resp = await binding.fetch(url, fetchOpts);
  const latency_ms = Date.now() - start;

  let data: T;
  const contentType = resp.headers.get('Content-Type') || '';
  if (contentType.includes('application/json')) {
    data = (await resp.json()) as T;
  } else {
    data = (await resp.text()) as unknown as T;
  }

  return { ok: resp.ok, data, latency_ms, status: resp.status };
}

/**
 * Proxy a request to an external URL (not a service binding).
 * Supports AbortSignal timeout.
 */
export async function proxyExternal<T = unknown>(
  url: string,
  opts: ProxyOptions = {},
): Promise<ProxyResult<T>> {
  const start = Date.now();
  const method = opts.method || 'GET';
  const timeout = opts.timeout_ms || 30000;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...opts.headers,
  };

  const fetchOpts: RequestInit = {
    method,
    headers,
    signal: AbortSignal.timeout(timeout),
  };
  if (opts.body && method !== 'GET') {
    fetchOpts.body = JSON.stringify(opts.body);
  }

  const resp = await fetch(url, fetchOpts);
  const latency_ms = Date.now() - start;

  let data: T;
  const contentType = resp.headers.get('Content-Type') || '';
  if (contentType.includes('application/json')) {
    data = (await resp.json()) as T;
  } else {
    data = (await resp.text()) as unknown as T;
  }

  return { ok: resp.ok, data, latency_ms, status: resp.status };
}

/**
 * Build auth headers to forward to service bindings that require authentication.
 */
export function getAuthHeaders(env: { API_KEY?: string; ECHO_API_KEY?: string; VAULT_API_KEY?: string }): Record<string, string> {
  const key = env.API_KEY || env.ECHO_API_KEY || '';
  if (!key) return {};
  return { 'X-Echo-API-Key': key };
}

/**
 * Extract the query string from request body, supporting multiple field names.
 */
export function extractQuery(body: Record<string, unknown>): string {
  return String(body.query || body.q || body.question || '').trim();
}

/**
 * Structured JSON log for wrangler tail.
 */
export function log(
  level: 'debug' | 'info' | 'warn' | 'error',
  component: string,
  message: string,
  extra?: Record<string, unknown>,
): void {
  const entry = {
    ts: new Date().toISOString(),
    level,
    component,
    message,
    ...extra,
  };
  if (level === 'error') {
    console.error(JSON.stringify(entry));
  } else if (level === 'warn') {
    console.warn(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}
