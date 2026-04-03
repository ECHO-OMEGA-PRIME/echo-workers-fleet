/**
 * Auth wrapper for echo-speak-cloud
 * Wraps the original bundled worker to enforce X-Echo-API-Key auth on all routes except /health and OPTIONS.
 * Pattern: same as echo-build-orchestrator auth-wrapper.
 */

import originalWorker, { VoiceConversation as OriginalVoiceConversation } from './original-bundle.js';

const ALLOWED_ORIGINS = ['https://echo-ept.com', 'https://echo-op.com', 'https://echo-speak-cloud.bmcii1976.workers.dev'];
const AUTH_EXEMPT = new Set(['/health', '/']);

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
    'Access-Control-Allow-Headers': 'Content-Type,X-Echo-API-Key,Authorization',
  };
}

function jsonResp(data, status = 200, request = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (request) Object.assign(headers, getCorsHeaders(request));
  return new Response(JSON.stringify(data, null, 2), { status, headers });
}

export { OriginalVoiceConversation as VoiceConversation };

export default {
  async scheduled(event, env, ctx) {
    if (originalWorker.scheduled) {
      return originalWorker.scheduled(event, env, ctx);
    }
  },

  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS preflight — always allow
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: getCorsHeaders(request) });
    }

    // Auth on ALL routes except exempt ones
    if (!AUTH_EXEMPT.has(path)) {
      const key = request.headers.get('X-Echo-API-Key') ||
                  (request.headers.get('Authorization') || '').replace('Bearer ', '');

      if (!env.ECHO_API_KEY) {
        return jsonResp({ error: 'Service misconfigured: ECHO_API_KEY not set' }, 503, request);
      }
      if (!key || !timingSafeEqual(key, env.ECHO_API_KEY)) {
        return jsonResp({ error: 'Unauthorized' }, 401, request);
      }
    }

    // Body size limit (10MB for audio uploads)
    if (['POST', 'PUT'].includes(request.method)) {
      const cl = parseInt(request.headers.get('Content-Length') || '0');
      if (cl > 10485760) {
        return jsonResp({ error: 'Payload too large (max 10MB)' }, 413, request);
      }
    }

    // Delegate to original worker with error sanitization
    try {
      const response = await originalWorker.fetch(request, env, ctx);
      const newResp = new Response(response.body, response);
      const cors = getCorsHeaders(request);
      for (const [k, v] of Object.entries(cors)) newResp.headers.set(k, v);
      return newResp;
    } catch (err) {
      const ref = crypto.randomUUID().slice(0, 8);
      console.error(JSON.stringify({
        ts: new Date().toISOString(),
        worker: 'echo-speak-cloud',
        ref,
        error: err?.message,
        stack: err?.stack?.slice(0, 500)
      }));
      return jsonResp({ error: 'Internal server error', reference: ref }, 500, request);
    }
  }
};
