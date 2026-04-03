/**
 * echo-speak-cloud v2.2.0
 *
 * Smart TTS cloud router for ECHO OMEGA PRIME.
 * Providers: ElevenLabs, Edge TTS, Local GPU (Qwen3-TTS).
 *
 * SECURITY FIX v2.2.0: Global auth middleware added.
 * Previously, auth was per-route and many routes were unprotected,
 * exposing ElevenLabs API quota to unauthenticated callers.
 * Now ALL routes except /health require X-Echo-API-Key.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authMiddleware, requireAuth, requireAuthOrBinding } from './auth';
import { cacheGet, cachePut, cacheStats, cacheDelete, cacheCleanup } from './cache';
import { synthesize, synthesizeStream, cloneVoice, getModels, ELEVENLABS_VOICES } from './elevenlabs';
import { synthesize as synthesizeEdge, EDGE_TTS_VOICES } from './edge-tts';
import { checkGPUHealth, forwardToGPU, getGPUOnlyOperations } from './gpu-proxy';
import {
  dispatch, dispatchFast, dispatchChunked, dispatchBatch,
  synthesizeWithProvider, buildFallbackChain, splitText
} from './tts-router';
import { transcribe } from './stt';
import {
  analyzeEmotion, detectEmotion, applyEmotionTags, EMOTION_TAGS
} from './emotion-engine';
import {
  orchestrateTTS, parseDialogue, getVoiceMapping, prepareTextForSpeech,
  postToMoltBook
} from './voice-orchestrator';
import { VoiceConversation } from './conversation-do';
import { textHash } from './types';

// Re-export Durable Object for wrangler
export { VoiceConversation };

interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  MEDIA: R2Bucket;
  VOICE_CONVERSATION: DurableObjectNamespace;
  ECHO_API_KEY: string;
  ELEVENLABS_API_KEY: string;
  VERSION: string;
}

const ALLOWED_ORIGINS = [
  'https://echo-ept.com',
  'https://www.echo-ept.com',
  'https://echo-op.com',
  'https://www.echo-op.com',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:8420',
];

function log(level: string, message: string, data?: Record<string, unknown>): void {
  const entry = {
    ts: new Date().toISOString(),
    level,
    worker: 'echo-speak-cloud',
    message,
    ...data,
  };
  if (level === 'error') console.error(JSON.stringify(entry));
  else console.log(JSON.stringify(entry));
}

const app = new Hono<{ Bindings: Env }>();

// ---------- CORS ----------
app.use(
  '*',
  cors({
    origin: (o) => (ALLOWED_ORIGINS.includes(o) ? o : ALLOWED_ORIGINS[0]),
    allowHeaders: ['Content-Type', 'Authorization', 'X-Echo-API-Key'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
);

// Manual CORS fallback headers
app.use('*', async (c, next) => {
  await next();
  const origin = c.req.header('Origin') || '';
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    c.header('Access-Control-Allow-Origin', origin);
    c.header('Vary', 'Origin');
  } else if (!origin) {
    c.header('Access-Control-Allow-Origin', ALLOWED_ORIGINS[0]);
  }
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, X-Echo-API-Key, Authorization');
});

app.options('*', (c) => c.body(null, 204));

// ---------- Security headers ----------
app.use('*', async (c, next) => {
  await next();
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('X-XSS-Protection', '1; mode=block');
  c.header('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
});

// ---------- GLOBAL AUTH MIDDLEWARE (C29 fix) ----------
// This MUST come before any route handlers.
// Exempts /health only. All other routes require valid X-Echo-API-Key.
// Service bindings (worker-to-worker) are also exempted.
app.use('*', authMiddleware);

// ---------- Rate limiting ----------
const RATE_LIMIT_MAX = 60;
const RATE_LIMIT_WINDOW = 60;

app.use('*', async (c, next) => {
  if (c.req.path === '/health' || c.req.path === '/capabilities') return next();
  const ip = c.req.header('CF-Connecting-IP') || 'unknown';
  const window = Math.floor(Date.now() / (RATE_LIMIT_WINDOW * 1000));
  const key = `rate:${ip}:${window}`;
  const current = parseInt((await c.env.CACHE.get(key)) || '0', 10);
  if (current >= RATE_LIMIT_MAX) {
    return c.json({ error: 'Rate limit exceeded', retry_after_seconds: RATE_LIMIT_WINDOW }, 429);
  }
  await c.env.CACHE.put(key, String(current + 1), { expirationTtl: RATE_LIMIT_WINDOW * 2 });
  c.header('X-RateLimit-Remaining', String(RATE_LIMIT_MAX - current - 1));
  return next();
});

// =====================================================================
// ROUTES
// =====================================================================

// --- Info routes (now protected by global auth middleware) ---
app.get('/', (c) => c.json({ service: 'echo-speak-cloud', version: '2.2.0', status: 'operational' }));

app.get('/health', async (c) => {
  const [gpu, cache, genCount] = await Promise.all([
    checkGPUHealth(),
    cacheStats(c.env),
    c.env.DB.prepare('SELECT COUNT(*) as total FROM generation_history').first(),
  ]);
  return c.json({
    status: 'ok',
    service: 'echo-speak-cloud',
    version: c.env.VERSION || '2.2.0',
    timestamp: new Date().toISOString(),
    gpu,
    cache,
    generations: genCount?.total || 0,
    providers: {
      elevenlabs: !!c.env.ELEVENLABS_API_KEY,
      edge_tts: true,
      gpu_tunnel: gpu.healthy,
    },
  });
});

app.get('/capabilities', async (c) => {
  const gpu = await checkGPUHealth();
  return c.json({
    cloud_native: [
      '/tts/fast', '/voices', '/presets', '/pronunciations', '/cache/*',
      '/stats', '/health', '/models', '/emotion-tags', '/history',
      '/metrics', '/dialogue/parse',
    ],
    smart_routed: [
      '/tts', '/tts/stream', '/tts/chunked', '/tts/batch', '/tts/ssml',
      '/voices/preview', '/voices/compare', '/dialogue',
    ],
    gpu_only: getGPUOnlyOperations(),
    gpu_status: gpu.healthy ? 'online' : 'offline',
    providers: ['elevenlabs', 'edge_tts', 'gpu'],
    emotion_tags: EMOTION_TAGS,
  });
});

app.get('/models', (c) => {
  return c.json({
    elevenlabs: getModels(),
    edge_tts: [{ id: 'edge_neural', name: 'Edge Neural', description: 'Microsoft Edge TTS (free)' }],
    gpu: [{ id: 'qwen3-tts', name: 'Qwen3-TTS-12Hz-0.6B', description: 'Local GPU model with emotion tags' }],
  });
});

app.get('/emotion-tags', (c) => {
  return c.json({ tags: EMOTION_TAGS, count: EMOTION_TAGS.length });
});

app.get('/api-info', (c) => {
  return c.json({
    service: 'echo-speak-cloud',
    version: '2.2.0',
    description: 'Smart TTS cloud router for ECHO OMEGA PRIME',
    endpoints: 49,
    dispatch_tiers: ['cache', 'elevenlabs', 'edge_tts', 'gpu_tunnel'],
    gpu_tunnel: 'https://tts.echo-op.com',
  });
});

// --- TTS routes ---
app.post('/tts', async (c) => {
  const body = await c.req.json();
  if (!body.text) return c.json({ error: 'text required' }, 400);
  const result = await dispatch(c.env, body);
  return new Response(result.audio, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'X-Provider': result.response.provider,
      'X-Voice': result.response.voice,
      'X-Duration-Ms': String(result.response.duration_ms),
      'X-Cached': String(result.response.cached),
    },
  });
});

app.post('/tts/json', async (c) => {
  const body = await c.req.json();
  if (!body.text) return c.json({ error: 'text required' }, 400);
  const result = await dispatch(c.env, body);
  const base64 = btoa(String.fromCharCode(...new Uint8Array(result.audio)));
  return c.json({ audio_base64: base64, ...result.response });
});

app.post('/tts/fast', async (c) => {
  const body = await c.req.json();
  if (!body.text) return c.json({ error: 'text required' }, 400);
  const result = await dispatchFast(c.env, body.text, body.voice);
  return new Response(result.audio, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'X-Provider': 'edge_tts',
      'X-Duration-Ms': String(result.response.duration_ms),
    },
  });
});

app.post('/tts/stream', async (c) => {
  const body = await c.req.json();
  if (!body.text) return c.json({ error: 'text required' }, 400);
  try {
    const stream = await synthesizeStream({
      text: body.text,
      voice: body.voice || 'echo',
      apiKey: c.env.ELEVENLABS_API_KEY,
    });
    return new Response(stream, {
      headers: { 'Content-Type': 'audio/mpeg', 'Transfer-Encoding': 'chunked' },
    });
  } catch (e) {
    log('warn', 'Streaming TTS failed, falling back', {
      error: e instanceof Error ? e.message : String(e),
    });
    const result = await dispatch(c.env, body);
    return new Response(result.audio, {
      headers: { 'Content-Type': 'audio/mpeg', 'X-Provider': result.response.provider },
    });
  }
});

app.post('/tts/chunked', async (c) => {
  const body = await c.req.json();
  if (!body.text) return c.json({ error: 'text required' }, 400);
  const result = await dispatchChunked(c.env, body.text, body.voice, body.chunk_size);
  return new Response(result.audio, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'X-Chunks': String(result.chunks),
      'X-Provider': result.response.provider,
    },
  });
});

app.post('/tts/batch', async (c) => {
  // Batch uses strict auth (no service binding bypass)
  const authErr = requireAuth(c);
  if (authErr) return authErr;
  const body = await c.req.json();
  if (!body.items?.length) return c.json({ error: 'items array required' }, 400);
  const results = await dispatchBatch(c.env, body.items);
  return c.json({
    total: results.length,
    succeeded: results.filter((r: { success: boolean }) => r.success).length,
    results,
  });
});

app.post('/tts/ssml', async (c) => {
  const body = await c.req.json();
  if (!body.ssml) return c.json({ error: 'ssml required' }, 400);
  const plainText = body.ssml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const result = await dispatch(c.env, { text: plainText, voice: body.voice });
  return new Response(result.audio, {
    headers: { 'Content-Type': 'audio/mpeg', 'X-Provider': result.response.provider },
  });
});

// --- Voice routes ---
app.get('/voices', async (c) => {
  const db = c.env.DB;
  const custom = await db.prepare('SELECT * FROM voices ORDER BY name').all();
  const builtIn = [
    ...Object.entries(ELEVENLABS_VOICES).map(([name, id]) => ({
      name,
      provider: 'elevenlabs',
      provider_voice_id: id,
      is_cloned: ['commander', 'jr', 'roybean', 'adam'].includes(name),
    })),
    ...Object.entries(EDGE_TTS_VOICES).map(([name, id]) => ({
      name,
      provider: 'edge_tts',
      provider_voice_id: id,
      is_cloned: false,
    })),
  ];
  return c.json({
    built_in: builtIn,
    custom: custom.results || [],
    total: builtIn.length + (custom.results?.length || 0),
    mappings: getVoiceMapping(),
  });
});

app.post('/voices/preview', async (c) => {
  const { voice, text } = await c.req.json();
  if (!voice) return c.json({ error: 'voice required' }, 400);
  const previewText = text || `Hello, I am ${voice}. This is a voice preview for Echo Omega Prime.`;
  const result = await dispatch(c.env, { text: previewText, voice, format: 'mp3' });
  return new Response(result.audio, { headers: { 'Content-Type': 'audio/mpeg' } });
});

app.post('/voices/compare', async (c) => {
  const { text, voices } = await c.req.json();
  if (!text || !voices?.length) return c.json({ error: 'text and voices required' }, 400);
  const results = [];
  for (const voice of voices.slice(0, 5)) {
    try {
      const result = await dispatch(c.env, { text, voice, format: 'mp3' });
      const hash = textHash(text, voice);
      const key = `compare/${hash}.mp3`;
      await c.env.MEDIA.put(key, result.audio, {
        httpMetadata: { contentType: 'audio/mpeg' },
      });
      results.push({
        voice,
        success: true,
        provider: result.response.provider,
        duration_ms: result.response.duration_ms,
        audio_key: key,
      });
    } catch (e) {
      results.push({
        voice,
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }
  return c.json({ text: text.substring(0, 100), voices_compared: results });
});

app.post('/voices/clone', async (c) => {
  // Clone uses strict auth (no service binding bypass)
  const authErr = requireAuth(c);
  if (authErr) return authErr;
  try {
    const body = await c.req.json();
    if (!body.name || !body.files?.length) {
      return c.json({ error: 'name and files[] required' }, 400);
    }
    if (c.env.ELEVENLABS_API_KEY) {
      const result = await cloneVoice(c.env.ELEVENLABS_API_KEY, {
        name: body.name,
        description: body.description || `Custom voice clone: ${body.name}`,
        files: body.files,
      });
      await postToMoltBook(
        c.env,
        `Voice cloned: "${body.name}" via ElevenLabs (${body.files.length} audio files). Voice ID: ${result.voice_id}`,
        'excited',
        ['voice', 'clone', 'milestone']
      );
      return c.json({
        success: true,
        voice_id: result.voice_id,
        name: result.name,
        provider: 'elevenlabs',
      });
    }
    const gpu = await checkGPUHealth();
    if (!gpu.healthy) {
      return c.json({
        error: 'No voice cloning provider available. ElevenLabs API key not set and GPU is offline.',
      }, 503);
    }
    const resp = await forwardToGPU('/voices/clone', 'POST', undefined, {
      'Content-Type': 'application/json',
    });
    return new Response(resp.body, { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return c.json({
      error: e instanceof Error ? e.message : 'Voice cloning failed',
    }, 500);
  }
});

// --- GPU proxy routes ---
app.post('/transcribe', async (c) => {
  const gpu = await checkGPUHealth();
  if (!gpu.healthy) {
    return c.json({ error: 'GPU is offline. Transcription requires local GPU (Whisper).' }, 503);
  }
  const resp = await forwardToGPU('/transcribe', 'POST');
  return new Response(resp.body, { headers: { 'Content-Type': 'application/json' } });
});

app.post('/speech-to-speech', async (c) => {
  const gpu = await checkGPUHealth();
  if (!gpu.healthy) return c.json({ error: 'GPU offline. S2S requires local GPU.' }, 503);
  const resp = await forwardToGPU('/speech-to-speech', 'POST');
  return new Response(resp.body, { headers: { 'Content-Type': 'application/json' } });
});

app.post('/audio-isolation', async (c) => {
  const gpu = await checkGPUHealth();
  if (!gpu.healthy) {
    return c.json({ error: 'GPU offline. Audio isolation requires Demucs on local GPU.' }, 503);
  }
  const resp = await forwardToGPU('/audio-isolation', 'POST');
  return new Response(resp.body, { headers: { 'Content-Type': 'application/json' } });
});

app.post('/voice-design/:action', async (c) => {
  const action = c.req.param('action');
  const gpu = await checkGPUHealth();
  if (!gpu.healthy) return c.json({ error: 'GPU offline.' }, 503);
  const body = await c.req.json();
  const resp = await forwardToGPU(`/voice-design/${action}`, 'POST', undefined, {
    'Content-Type': 'application/json',
  });
  return new Response(resp.body, { headers: { 'Content-Type': 'application/json' } });
});

app.post('/analyze', async (c) => {
  const gpu = await checkGPUHealth();
  if (!gpu.healthy) return c.json({ error: 'GPU offline.' }, 503);
  const resp = await forwardToGPU('/analyze', 'POST');
  return new Response(resp.body, { headers: { 'Content-Type': 'application/json' } });
});

app.post('/gpu/cleanup', async (c) => {
  // GPU cleanup uses strict auth
  const authErr = requireAuth(c);
  if (authErr) return authErr;
  const gpu = await checkGPUHealth();
  if (!gpu.healthy) return c.json({ error: 'GPU offline.' }, 503);
  const resp = await forwardToGPU('/cleanup', 'POST');
  return new Response(resp.body, { headers: { 'Content-Type': 'application/json' } });
});

app.get('/gpu/status', async (c) => {
  const health = await checkGPUHealth();
  return c.json({ gpu: health, tunnel: 'https://tts.echo-op.com' });
});

// --- Dialogue routes ---
app.post('/dialogue/parse', async (c) => {
  const { text } = await c.req.json();
  if (!text) return c.json({ error: 'text required' }, 400);
  const lines = parseDialogue(text);
  return c.json({ lines, count: lines.length });
});

app.post('/dialogue', async (c) => {
  const { text, default_voice } = await c.req.json();
  if (!text) return c.json({ error: 'text required' }, 400);
  const lines = parseDialogue(text);
  const audioChunks: ArrayBuffer[] = [];
  for (const line of lines) {
    const voice = line.speaker || default_voice || 'echo';
    const result = await dispatch(c.env, { text: line.text, voice, format: 'mp3' });
    audioChunks.push(result.audio);
  }
  const totalLength = audioChunks.reduce((sum, buf) => sum + buf.byteLength, 0);
  const merged = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of audioChunks) {
    merged.set(new Uint8Array(chunk), offset);
    offset += chunk.byteLength;
  }
  return new Response(merged.buffer, {
    headers: { 'Content-Type': 'audio/mpeg', 'X-Lines': String(lines.length) },
  });
});

// --- Presets ---
app.get('/presets', async (c) => {
  const r = await c.env.DB.prepare('SELECT * FROM presets ORDER BY name').all();
  return c.json({ count: r.results?.length || 0, presets: r.results || [] });
});

app.post('/presets', async (c) => {
  const authErr = requireAuth(c);
  if (authErr) return authErr;
  const body = await c.req.json();
  if (!body.name) return c.json({ error: 'name required' }, 400);
  const id = crypto.randomUUID();
  await c.env.DB.prepare(
    'INSERT INTO presets (id, name, voice, speed, pitch, emotion, settings) VALUES (?, ?, ?, ?, ?, ?, ?)'
  )
    .bind(id, body.name, body.voice || 'echo', body.speed || 1.0, body.pitch || 0, body.emotion || '', JSON.stringify(body.settings || {}))
    .run();
  return c.json({ status: 'created', id }, 201);
});

// --- Pronunciations ---
app.get('/pronunciations', async (c) => {
  const r = await c.env.DB.prepare('SELECT * FROM pronunciations ORDER BY word').all();
  return c.json({ count: r.results?.length || 0, pronunciations: r.results || [] });
});

app.post('/pronunciations', async (c) => {
  const authErr = requireAuth(c);
  if (authErr) return authErr;
  const body = await c.req.json();
  if (!body.word || !body.phonetic) return c.json({ error: 'word and phonetic required' }, 400);
  const id = crypto.randomUUID();
  await c.env.DB.prepare(
    'INSERT INTO pronunciations (id, word, phonetic, language) VALUES (?, ?, ?, ?)'
  )
    .bind(id, body.word, body.phonetic, body.language || 'en')
    .run();
  return c.json({ status: 'created', id }, 201);
});

// --- Studio ---
app.get('/studio', async (c) => {
  const r = await c.env.DB.prepare('SELECT * FROM projects ORDER BY updated_at DESC').all();
  return c.json({ count: r.results?.length || 0, projects: r.results || [] });
});

app.post('/studio', async (c) => {
  const authErr = requireAuth(c);
  if (authErr) return authErr;
  const body = await c.req.json();
  if (!body.name) return c.json({ error: 'name required' }, 400);
  const id = crypto.randomUUID();
  await c.env.DB.prepare(
    'INSERT INTO projects (id, name, description, settings, created_at, updated_at) VALUES (?, ?, ?, ?, datetime(), datetime())'
  )
    .bind(id, body.name, body.description || '', JSON.stringify(body.settings || {}))
    .run();
  return c.json({ status: 'created', id }, 201);
});

app.get('/studio/:id', async (c) => {
  const id = c.req.param('id');
  const project = await c.env.DB.prepare('SELECT * FROM projects WHERE id = ?').bind(id).first();
  if (!project) return c.json({ error: 'Project not found' }, 404);
  const chapters = await c.env.DB.prepare(
    'SELECT * FROM chapters WHERE project_id = ? ORDER BY position'
  )
    .bind(id)
    .all();
  return c.json({ project, chapters: chapters.results || [] });
});

app.post('/studio/:id/chapter', async (c) => {
  const authErr = requireAuth(c);
  if (authErr) return authErr;
  const projectId = c.req.param('id');
  const { text, title, voice } = await c.req.json();
  if (!text) return c.json({ error: 'text required' }, 400);
  const result = await dispatch(c.env, { text, voice: voice || 'echo', format: 'mp3' });
  const chapterId = crypto.randomUUID();
  const audioKey = `studio/${projectId}/${chapterId}.mp3`;
  await c.env.MEDIA.put(audioKey, result.audio, {
    httpMetadata: { contentType: 'audio/mpeg' },
  });
  const position = await c.env.DB.prepare(
    'SELECT COALESCE(MAX(position), 0) + 1 as next FROM chapters WHERE project_id = ?'
  )
    .bind(projectId)
    .first();
  await c.env.DB.prepare(
    'INSERT INTO chapters (id, project_id, title, text, voice, audio_key, position, provider, duration_ms) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  )
    .bind(
      chapterId, projectId, title || `Chapter ${position?.next || 1}`,
      text, voice || 'echo', audioKey, position?.next || 1,
      result.response.provider, result.response.duration_ms
    )
    .run();
  return c.json({
    status: 'created',
    chapter_id: chapterId,
    audio_key: audioKey,
    provider: result.response.provider,
  });
});

app.post('/studio/:id/render', async (c) => {
  const gpu = await checkGPUHealth();
  if (!gpu.healthy) {
    return c.json({ error: 'GPU offline. Full render requires local GPU.' }, 503);
  }
  const resp = await forwardToGPU(`/studio/${c.req.param('id')}/render`, 'POST');
  return new Response(resp.body, { headers: { 'Content-Type': 'application/json' } });
});

// --- Cache ---
app.get('/cache/stats', async (c) => {
  const stats = await cacheStats(c.env);
  return c.json(stats);
});

app.delete('/cache/:key', async (c) => {
  const authErr = requireAuth(c);
  if (authErr) return authErr;
  await cacheDelete(c.env, c.req.param('key'));
  return c.json({ status: 'deleted' });
});

app.post('/cache/cleanup', async (c) => {
  const authErr = requireAuth(c);
  if (authErr) return authErr;
  const result = await cacheCleanup(c.env);
  return c.json({ status: 'cleanup_complete', ...result });
});

// --- Stats / History / Metrics ---
app.get('/stats', async (c) => {
  const db = c.env.DB;
  const [totals, byProvider, byVoice, cache] = await Promise.all([
    db.prepare('SELECT COUNT(*) as total, SUM(duration_ms) as total_duration FROM generation_history').first(),
    db.prepare('SELECT provider, COUNT(*) as count FROM generation_history GROUP BY provider').all(),
    db.prepare('SELECT voice, COUNT(*) as count FROM generation_history GROUP BY voice ORDER BY count DESC LIMIT 10').all(),
    cacheStats(c.env),
  ]);
  return c.json({
    generations: totals,
    by_provider: byProvider.results,
    top_voices: byVoice.results,
    cache,
    timestamp: new Date().toISOString(),
  });
});

app.get('/history', async (c) => {
  const limit = parseInt(c.req.query('limit') || '30');
  const r = await c.env.DB.prepare(
    'SELECT * FROM generation_history ORDER BY created_at DESC LIMIT ?'
  )
    .bind(limit)
    .all();
  return c.json({ count: r.results?.length || 0, history: r.results || [] });
});

app.get('/metrics', async (c) => {
  const db = c.env.DB;
  const [today, week, providers, usage] = await Promise.all([
    db.prepare("SELECT COUNT(*) as count FROM generation_history WHERE created_at > datetime('now', '-1 day')").first(),
    db.prepare("SELECT COUNT(*) as count FROM generation_history WHERE created_at > datetime('now', '-7 days')").first(),
    db.prepare('SELECT provider, COUNT(*) as count, AVG(duration_ms) as avg_duration FROM generation_history GROUP BY provider').all(),
    db.prepare("SELECT SUM(CASE WHEN provider='elevenlabs' THEN character_count ELSE 0 END) as elevenlabs_chars FROM generation_history").first(),
  ]);
  return c.json({
    today: today?.count || 0,
    this_week: week?.count || 0,
    providers: providers.results,
    elevenlabs_usage: usage,
  });
});

// --- STT ---
app.post('/stt', async (c) => {
  const contentType = c.req.header('Content-Type') || '';
  let audio: ArrayBuffer;
  if (contentType.includes('application/json')) {
    const body = await c.req.json();
    if (!body.audio_base64) return c.json({ error: 'audio_base64 required' }, 400);
    const binary = atob(body.audio_base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    audio = bytes.buffer;
  } else {
    audio = await c.req.arrayBuffer();
  }
  const result = await transcribe(c.env, audio, {
    language: c.req.query('language') || undefined,
  });
  return c.json(result);
});

// --- Emotion ---
app.post('/emotion/analyze', async (c) => {
  const body = await c.req.json();
  if (!body.user_message) return c.json({ error: 'user_message required' }, 400);
  const analysis = analyzeEmotion(
    body.user_message,
    body.conversation_history || [],
    body.personality || 'echo'
  );
  return c.json(analysis);
});

app.post('/emotion/detect', async (c) => {
  const body = await c.req.json();
  if (!body.text) return c.json({ error: 'text required' }, 400);
  return c.json(detectEmotion(body.text));
});

app.post('/emotion/apply-tags', async (c) => {
  const body = await c.req.json();
  if (!body.text || !body.tags) return c.json({ error: 'text and tags required' }, 400);
  const tagged = applyEmotionTags(body.text, body.tags);
  return c.json({ text: body.text, tagged, tags_applied: body.tags.length });
});

// --- TTS Orchestrate ---
app.post('/tts/orchestrate', async (c) => {
  const body = await c.req.json();
  if (!body.text) return c.json({ error: 'text required' }, 400);
  const result = await orchestrateTTS(c.env, body);
  return new Response(result.audio, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'X-Provider': result.response.provider,
      'X-Latency-Ms': String(result.latency_ms),
    },
  });
});

// --- WebSocket Conversation ---
app.get('/ws/conversation', async (c) => {
  const upgradeHeader = c.req.header('Upgrade');
  if (upgradeHeader !== 'websocket') {
    return c.json({
      error: 'Expected WebSocket upgrade',
      usage: 'Connect via WebSocket to this endpoint',
    }, 426);
  }
  const id = c.env.VOICE_CONVERSATION.idFromName('default');
  const stub = c.env.VOICE_CONVERSATION.get(id);
  return stub.fetch(new Request('https://internal/ws', { headers: c.req.raw.headers }));
});

app.get('/ws/conversation/config', (c) => {
  return c.json({
    turn_eagerness_options: ['eager', 'normal', 'patient'],
    defaults: {
      turn_eagerness: 'normal',
      filler_enabled: true,
      silence_threshold_ms: 700,
    },
    version: '2.1.0',
  });
});

app.post('/tts/conversational', async (c) => {
  const body = await c.req.json();
  if (!body.text) return c.json({ error: 'text required' }, 400);
  const result = await dispatch(c.env, {
    ...body,
    model: body.model || 'eleven_turbo_v2_5',
    conversational: true,
  });
  return new Response(result.audio, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'X-Provider': result.response.provider,
      'X-Duration-Ms': String(result.response.duration_ms),
    },
  });
});

app.get('/ws/conversation/status', async (c) => {
  const sessionId = c.req.query('session_id');
  if (!sessionId) return c.json({ error: 'session_id required' }, 400);
  const id = c.env.VOICE_CONVERSATION.idFromName(sessionId);
  const stub = c.env.VOICE_CONVERSATION.get(id);
  const resp = await stub.fetch(new Request('https://internal/status'));
  return new Response(resp.body, { headers: { 'Content-Type': 'application/json' } });
});

// --- Text preparation ---
app.post('/text/prepare', async (c) => {
  const body = await c.req.json();
  if (!body.text) return c.json({ error: 'text required' }, 400);
  const prepared = prepareTextForSpeech(body.text);
  return c.json({ original_length: body.text.length, prepared_length: prepared.length, prepared });
});

// --- Schema init (admin only) ---
app.post('/init-schema', async (c) => {
  const authErr = requireAuth(c);
  if (authErr) return authErr;
  const statements = [
    `CREATE TABLE IF NOT EXISTS voices (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, provider TEXT, provider_voice_id TEXT, settings TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS generation_history (id TEXT PRIMARY KEY, text TEXT, voice TEXT, provider TEXT, duration_ms INTEGER, character_count INTEGER, cached BOOLEAN, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS presets (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, voice TEXT, speed REAL, pitch REAL, emotion TEXT, settings TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS pronunciations (id TEXT PRIMARY KEY, word TEXT NOT NULL, phonetic TEXT NOT NULL, language TEXT DEFAULT 'en', created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT, settings TEXT, created_at DATETIME, updated_at DATETIME)`,
    `CREATE TABLE IF NOT EXISTS chapters (id TEXT PRIMARY KEY, project_id TEXT, title TEXT, text TEXT, voice TEXT, audio_key TEXT, position INTEGER, provider TEXT, duration_ms INTEGER, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`,
  ];
  for (const sql of statements) {
    await c.env.DB.prepare(sql).run();
  }
  return c.json({ status: 'schema_initialized', tables: statements.length });
});

// --- Scheduled handler ---
async function handleScheduled(event: ScheduledEvent, env: Env): Promise<void> {
  try {
    await env.DB.prepare(
      "DELETE FROM generation_history WHERE created_at < datetime('now', '-90 days')"
    ).run();
    log('info', 'Scheduled cleanup complete');
    await fetch('https://echo-build-orchestrator.bmcii1976.workers.dev/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ worker: 'echo-speak-cloud', status: 'healthy' }),
    }).catch(() => {});
  } catch (e) {
    log('error', 'Scheduled handler failed', { error: String(e) });
    await fetch('https://echo-build-orchestrator.bmcii1976.workers.dev/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        worker: 'echo-speak-cloud',
        status: 'degraded',
        metrics: { error: String(e) },
      }),
    }).catch(() => {});
  }
}

// --- Error handling ---
app.onError((err, c) => {
  console.error(
    JSON.stringify({
      ts: new Date().toISOString(),
      level: 'error',
      worker: 'echo-speak-cloud',
      message: 'Unhandled route error',
      path: c.req.path,
      method: c.req.method,
      error: err.message,
    })
  );
  return c.json(
    {
      error: 'Internal server error',
      worker: 'echo-speak-cloud',
      timestamp: new Date().toISOString(),
    },
    500
  );
});

app.notFound((c) => {
  return c.json(
    {
      error: 'Not found',
      worker: 'echo-speak-cloud',
      version: '2.2.0',
      routes: [
        'GET /health - Service health + provider status',
        'GET /capabilities - Available endpoints and features',
        'GET /models - Available TTS models',
        'GET /emotion-tags - Supported emotion tags',
        'GET /api-info - API documentation',
        'GET /voices - List all voice presets',
        'POST /voices/preview - Preview a voice',
        'POST /voices/compare - Compare multiple voices',
        'POST /voices/clone - Clone a voice (ElevenLabs)',
        'POST /tts - Generate speech (smart-routed)',
        'POST /tts/fast - Generate speech (cache-first)',
        'POST /tts/stream - Streaming TTS',
        'POST /tts/chunked - Chunked long-form TTS',
        'POST /tts/batch - Batch TTS generation',
        'POST /tts/ssml - SSML-formatted TTS',
        'POST /tts/orchestrate - Quota-aware blended TTS',
        'POST /tts/conversational - Conversational TTS',
        'POST /dialogue - Multi-voice dialogue',
        'POST /stt - Cloud speech-to-text',
        'POST /emotion/analyze - 4-layer emotion analysis',
        'POST /emotion/detect - Quick emotion detection',
        'POST /emotion/apply-tags - Apply emotion tags',
        'POST /text/prepare - Prepare text for speech',
        'GET /ws/conversation - WebSocket voice conversation',
        'GET /presets - Voice presets',
        'GET /pronunciations - Custom pronunciations',
        'GET /cache/stats - Cache statistics',
        'GET /history - Generation history',
        'GET /metrics - Usage metrics',
        'GET /stats - Aggregated stats',
      ],
    },
    404
  );
});

export default {
  fetch: app.fetch,
  scheduled: handleScheduled,
};
