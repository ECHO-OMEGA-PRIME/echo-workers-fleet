/**
 * Auth wrapper for Build Orchestrator — Fixes C36, C37, H51, H52
 * This wraps the original worker to add auth on ALL routes (not just POST)
 */

const ALLOWED_ORIGINS = ['https://echo-ept.com', 'https://echo-op.com'];
const AUTH_EXEMPT = new Set(['/health']);

function timingSafeEqual(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

function getCorsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : '';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,X-Authority-Level,X-Source,X-Echo-API-Key',
  };
}

function jsonResp(data, status = 200, request = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (request) Object.assign(headers, getCorsHeaders(request));
  return new Response(JSON.stringify(data, null, 2), { status, headers });
}

export function wrapWithAuth(originalHandler) {
  return {
    async scheduled(event, env, ctx) {
      return originalHandler.scheduled(event, env, ctx);
    },

    async fetch(request, env, ctx) {
      const url = new URL(request.url);
      const path = url.pathname;

      // CORS preflight
      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: getCorsHeaders(request) });
      }

      // C36 FIX: Auth on ALL routes except /health
      if (!AUTH_EXEMPT.has(path)) {
        const key = request.headers.get('X-Echo-API-Key');
        if (!env.ECHO_API_KEY) {
          return jsonResp({ error: 'Service misconfigured' }, 503, request);
        }
        if (!key || !timingSafeEqual(key, env.ECHO_API_KEY)) {
          return jsonResp({ error: 'Unauthorized' }, 401, request);
        }
      }

      // Body size limit
      if (['POST', 'PUT'].includes(request.method)) {
        const cl = parseInt(request.headers.get('Content-Length') || '0');
        if (cl > 1048576) return jsonResp({ error: 'Payload too large' }, 413, request);
      }

      // H51 FIX: Validate link-terminal URL
      if (path === '/link-terminal' && request.method === 'POST') {
        try {
          const body = await request.clone().json();
          if (body.endpoint) {
            const epUrl = new URL(body.endpoint);
            // Only allow localhost or known internal endpoints
            if (!['localhost', '127.0.0.1'].includes(epUrl.hostname) &&
                !epUrl.hostname.endsWith('.workers.dev') &&
                !epUrl.hostname.endsWith('.bmcii1976.workers.dev')) {
              return jsonResp({ error: 'Invalid terminal endpoint — must be localhost or internal' }, 400, request);
            }
          }
        } catch { /* let the original handler deal with parse errors */ }
      }

      // H52 FIX: Sanitize /build/file/ path traversal
      if (path.startsWith('/build/file/')) {
        const filePath = path.split('/build/file/')[1] || '';
        if (filePath.includes('..') || filePath.includes('//') || filePath.startsWith('/')) {
          return jsonResp({ error: 'Invalid file path' }, 400, request);
        }
      }

      // C37 FIX: Wrap with error sanitizer
      try {
        const response = await originalHandler.fetch(request, env, ctx);
        // Add CORS headers to all responses
        const newResp = new Response(response.body, response);
        const cors = getCorsHeaders(request);
        for (const [k, v] of Object.entries(cors)) newResp.headers.set(k, v);
        return newResp;
      } catch (err) {
        const ref = crypto.randomUUID().slice(0, 8);
        console.error(JSON.stringify({ ts: new Date().toISOString(), worker: 'echo-build-orchestrator', ref, error: err?.message }));
        return jsonResp({ error: 'Internal server error', reference: ref }, 500, request);
      }
    }
  };
}
