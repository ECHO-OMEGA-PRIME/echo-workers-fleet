/**
 * /functions/* — Proxy to echo-tool-discovery for function catalog (1.37M functions)
 *
 * Routes:
 *   GET /search?q=vault&limit=20  — Search function catalog
 *   GET /stats                     — Function catalog stats
 *   GET /by-file?path=scraper      — Functions in a file
 *   GET /by-directory?dir=CORE     — Functions in a directory
 */
import { Hono } from 'hono';
import type { Env } from '../types.js';
import { success, error } from '../utils/envelope.js';
import { log } from '../utils/proxy.js';

const functions = new Hono<{ Bindings: Env }>();

// Proxy all function catalog requests to tool-discovery worker
async function proxyToToolDiscovery(c: { env: Env; req: { url: string; method: string; raw: Request } }, path: string): Promise<Response> {
  const start = Date.now();
  const url = new URL(c.req.url);
  const proxyUrl = `https://tool-discovery/functions${path}${url.search}`;

  try {
    const resp = await c.env.TOOL_DISCOVERY.fetch(proxyUrl, {
      method: c.req.method,
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await resp.json() as { success: boolean; data: unknown };
    log('info', `functions${path}`, { latency_ms: Date.now() - start });
    if (data.success) {
      return new Response(JSON.stringify(success(data.data, Date.now() - start)), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify(data), {
      status: resp.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    log('error', `functions${path} proxy failed`, { error: String(e) });
    return new Response(JSON.stringify(error('Tool Discovery unavailable', 'SERVICE_UNAVAILABLE')), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

functions.get('/search', (c) => proxyToToolDiscovery(c, '/search'));
functions.get('/stats', (c) => proxyToToolDiscovery(c, '/stats'));
functions.get('/by-file', (c) => proxyToToolDiscovery(c, '/by-file'));
functions.get('/by-directory', (c) => proxyToToolDiscovery(c, '/by-directory'));

export default functions;
