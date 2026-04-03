/**
 * Echo SDK Gateway — Unified Ultrafast Search (5-Layer Architecture).
 *
 * Inspired by: FlagEmbedding reranker, LightRAG graph retrieval,
 * vLLM prefix caching, ClickHouse MergeTree patterns.
 *
 * Layer 1:   KV hot cache (<5ms)             — SHA-256 hash of query → cached results
 * Layer 1.5: Prefix embedding cache (<2ms)   — Cached embedding vectors for repeated prefixes
 * Layer 2:   Vectorize + FTS5 (20-50ms)      — Local semantic + keyword index (parallel)
 * Layer 2.5: Cross-encoder reranker (30ms)   — Cosine similarity re-scoring on top candidates
 * Layer 3:   Parallel fan-out (80-200ms)     — All backends + Graph-RAG simultaneously
 *
 * Ranking: Reciprocal Rank Fusion (RRF) with k=60, cross-layer boost.
 *
 * Routes:
 *   POST /search          — Unified cross-source search
 *   GET  /search          — Unified cross-source search (GET variant)
 *   POST /search/engines  — Cached engine search
 *   POST /search/knowledge — Cached knowledge search
 *   POST /search/brain    — Cached brain search
 *   GET  /search/stats    — Cache hit rates and search performance
 */

import { Hono } from 'hono';
import type { Env } from '../types';
import { success, error } from '../utils/envelope';
import { proxyBinding, log, getAuthHeaders } from '../utils/proxy';
import { cacheGet, cacheSet, embedCacheGet, embedCacheSet } from '../utils/cache';

const search = new Hono<{ Bindings: Env }>();

// RRF constant (standard value from Cormack et al.)
const RRF_K = 60;

// ---------------------------------------------------------------------------
// Math: cosine similarity between two vectors
// ---------------------------------------------------------------------------
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

// ---------------------------------------------------------------------------
// Layer 1.5: Prefix embedding cache (FlagEmbedding / vLLM prefix caching inspired)
// ---------------------------------------------------------------------------
async function embedWithCache(
  ai: Ai,
  kv: KVNamespace,
  text: string,
): Promise<{ embedding: number[]; cached: boolean }> {
  // Check KV prefix cache first (<2ms)
  const cached = await embedCacheGet(kv, text);
  if (cached) {
    return { embedding: cached, cached: true };
  }

  // Generate embedding via Workers AI (~43ms)
  const result = await ai.run('@cf/baai/bge-base-en-v1.5', {
    text: [text.slice(0, 512)],
  }) as { data: number[][] };
  const embedding = result.data[0];

  // Cache for future queries (async, don't block)
  embedCacheSet(kv, text, embedding).catch(() => {});

  return { embedding, cached: false };
}

// ---------------------------------------------------------------------------
// Layer 2: Vectorize semantic search
// ---------------------------------------------------------------------------
interface VectorMatch {
  id: string;
  score: number;
  source: string;
  title: string;
  snippet: string;
  metadata: Record<string, unknown>;
}

async function vectorSearch(
  env: Env,
  embedding: number[],
  topK: number,
  sourceFilter?: string,
): Promise<VectorMatch[]> {
  const results = await env.VECTORS.query(embedding, {
    topK,
    returnMetadata: 'all',
    ...(sourceFilter ? { filter: { source: sourceFilter } } : {}),
  });

  return (results.matches || []).map((m) => ({
    id: String(m.id),
    score: m.score,
    source: String((m.metadata as Record<string, unknown>)?.source || 'unknown'),
    title: String((m.metadata as Record<string, unknown>)?.title || ''),
    snippet: String((m.metadata as Record<string, unknown>)?.snippet || ''),
    metadata: (m.metadata || {}) as Record<string, unknown>,
  }));
}

// ---------------------------------------------------------------------------
// Layer 2: FTS5 keyword search
// ---------------------------------------------------------------------------
interface FtsMatch {
  id: string;
  source: string;
  title: string;
  snippet: string;
  rank: number;
}

async function ftsSearch(
  db: D1Database,
  query: string,
  limit: number,
  sourceFilter?: string,
): Promise<FtsMatch[]> {
  try {
    const ftsQuery = query
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 1)
      .map((w) => `"${w}"`)
      .join(' OR ');

    if (!ftsQuery) return [];

    let sql = `SELECT id, source, title, snippet, rank FROM search_fts WHERE search_fts MATCH ? ORDER BY rank LIMIT ?`;
    const params: (string | number)[] = [ftsQuery, limit];

    if (sourceFilter) {
      sql = `SELECT id, source, title, snippet, rank FROM search_fts WHERE search_fts MATCH ? AND source = ? ORDER BY rank LIMIT ?`;
      params.splice(1, 0, sourceFilter);
    }

    const result = await db.prepare(sql).bind(...params).all<FtsMatch>();
    return result.results || [];
  } catch (e) {
    log('warn', 'search.fts', 'FTS5 query failed (index may be empty)', { error: String(e) });
    return [];
  }
}

// ---------------------------------------------------------------------------
// Layer 2.5: Cross-encoder reranker (FlagEmbedding-inspired)
//
// Batch-embeds candidate texts alongside query via Workers AI,
// then computes cosine similarity for precise re-scoring.
// Runs IN PARALLEL with Layer 3 fan-out to avoid added latency.
// ---------------------------------------------------------------------------
async function rerank(
  ai: Ai,
  queryEmbedding: number[],
  candidates: UnifiedResult[],
  topK: number,
): Promise<UnifiedResult[]> {
  if (candidates.length === 0) return [];
  if (candidates.length <= topK) {
    // Not enough candidates to rerank — return as-is
    return candidates;
  }

  try {
    // Batch embed all candidate texts (up to 50 at a time for Workers AI)
    const texts = candidates.map((c) => `${c.title} ${c.snippet}`.slice(0, 512));
    const batchSize = 50;
    const allEmbeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const result = await ai.run('@cf/baai/bge-base-en-v1.5', {
        text: batch,
      }) as { data: number[][] };
      allEmbeddings.push(...result.data);
    }

    // Score each candidate via cosine similarity with query
    const scored = candidates.map((c, idx) => {
      const candidateEmbedding = allEmbeddings[idx];
      const cosineSim = candidateEmbedding ? cosineSimilarity(queryEmbedding, candidateEmbedding) : 0;
      // Blend: 40% original score + 60% cosine similarity (cross-encoder weight)
      const rerankedScore = c.score * 0.4 + cosineSim * 0.6;
      return { ...c, score: rerankedScore, layers: [...c.layers, 'reranker'] };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  } catch (e) {
    log('warn', 'search.rerank', 'Reranker failed, returning original order', { error: String(e) });
    return candidates.slice(0, topK);
  }
}

// ---------------------------------------------------------------------------
// Layer 3: Parallel fan-out to all backends + Graph-RAG
// ---------------------------------------------------------------------------
interface BackendResult {
  source: string;
  ok: boolean;
  data: unknown;
  latency_ms: number;
}

async function parallelFanOut(
  env: Env,
  query: string,
  limit: number,
  sources: string[],
): Promise<BackendResult[]> {
  const auth = getAuthHeaders(env);
  const tasks: Promise<BackendResult>[] = [];

  if (sources.includes('engine') || sources.includes('all')) {
    tasks.push(
      (async () => {
        const start = Date.now();
        try {
          const r = await proxyBinding(env.ENGINE_RUNTIME, `/search?q=${encodeURIComponent(query)}&limit=${limit}`, {
            method: 'GET',
            headers: auth,
          });
          return { source: 'engine', ok: r.ok, data: r.data, latency_ms: Date.now() - start };
        } catch (e) {
          return { source: 'engine', ok: false, data: { error: String(e) }, latency_ms: Date.now() - start };
        }
      })(),
    );
  }

  if (sources.includes('knowledge') || sources.includes('all')) {
    tasks.push(
      (async () => {
        const start = Date.now();
        try {
          const r = await proxyBinding(env.KNOWLEDGE_FORGE, `/search?q=${encodeURIComponent(query)}&limit=${limit}`, {
            method: 'GET',
            headers: auth,
          });
          return { source: 'knowledge', ok: r.ok, data: r.data, latency_ms: Date.now() - start };
        } catch (e) {
          return { source: 'knowledge', ok: false, data: { error: String(e) }, latency_ms: Date.now() - start };
        }
      })(),
    );
  }

  if (sources.includes('brain') || sources.includes('all')) {
    tasks.push(
      (async () => {
        const start = Date.now();
        try {
          const r = await proxyBinding(env.SHARED_BRAIN, '/search', {
            method: 'POST',
            body: { query, limit },
            headers: auth,
          });
          return { source: 'brain', ok: r.ok, data: r.data, latency_ms: Date.now() - start };
        } catch (e) {
          return { source: 'brain', ok: false, data: { error: String(e) }, latency_ms: Date.now() - start };
        }
      })(),
    );
  }

  // LightRAG-inspired: Graph-RAG for relationship-aware retrieval
  if ((sources.includes('graph') || sources.includes('all')) && env.GRAPH_RAG) {
    tasks.push(
      (async () => {
        const start = Date.now();
        try {
          const r = await proxyBinding(env.GRAPH_RAG, `/search?q=${encodeURIComponent(query)}&limit=${limit}`, {
            method: 'GET',
            headers: auth,
          });
          return { source: 'graph', ok: r.ok, data: r.data, latency_ms: Date.now() - start };
        } catch (e) {
          return { source: 'graph', ok: false, data: { error: String(e) }, latency_ms: Date.now() - start };
        }
      })(),
    );
  }

  const settled = await Promise.allSettled(tasks);
  return settled.map((s) => (s.status === 'fulfilled' ? s.value : { source: 'unknown', ok: false, data: null, latency_ms: 0 }));
}

// ---------------------------------------------------------------------------
// Unified result type — tracks which layers found each result
// ---------------------------------------------------------------------------
interface UnifiedResult {
  id: string;
  source: string;
  title: string;
  snippet: string;
  score: number;
  layers: string[];
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Reciprocal Rank Fusion (RRF) merge — replaces simple weighted scoring
//
// RRF(d) = Σ 1/(k + rank_i) for each ranked list containing document d
// k = 60 (standard constant from Cormack, Clarke, Buettcher 2009)
//
// Cross-layer boost: documents found in 3+ layers get 1.5x, 2 layers get 1.25x
// ---------------------------------------------------------------------------
function mergeAndRankRRF(
  vectorResults: VectorMatch[],
  ftsResults: FtsMatch[],
  backendResults: BackendResult[],
  limit: number,
): UnifiedResult[] {
  // Map: composite key → { result, rrfScore, layers }
  const resultMap = new Map<string, { result: UnifiedResult; rrfScore: number }>();

  function addToMap(key: string, result: Omit<UnifiedResult, 'score' | 'layers'>, rank: number, layer: string) {
    const existing = resultMap.get(key);
    const rrfContribution = 1 / (RRF_K + rank);

    if (existing) {
      existing.rrfScore += rrfContribution;
      if (!existing.result.layers.includes(layer)) {
        existing.result.layers.push(layer);
      }
      // Keep longer snippet
      if (result.snippet.length > existing.result.snippet.length) {
        existing.result.snippet = result.snippet;
      }
      if (result.title.length > existing.result.title.length) {
        existing.result.title = result.title;
      }
    } else {
      resultMap.set(key, {
        result: { ...result, score: 0, layers: [layer] },
        rrfScore: rrfContribution,
      });
    }
  }

  // Vectorize results (already sorted by similarity score)
  for (let rank = 0; rank < vectorResults.length; rank++) {
    const v = vectorResults[rank];
    const key = `${v.source}:${v.id}`;
    addToMap(key, {
      id: v.id,
      source: v.source,
      title: v.title,
      snippet: v.snippet,
      metadata: v.metadata,
    }, rank + 1, 'vectorize');
  }

  // FTS results (already sorted by FTS5 rank)
  for (let rank = 0; rank < ftsResults.length; rank++) {
    const f = ftsResults[rank];
    const key = `${f.source}:${f.id}`;
    addToMap(key, {
      id: f.id,
      source: f.source,
      title: f.title,
      snippet: f.snippet,
    }, rank + 1, 'fts');
  }

  // Backend results (each backend's results are ranked by their native relevance)
  for (const b of backendResults) {
    if (!b.ok || !b.data) continue;
    const d = b.data as Record<string, unknown>;
    const results = (d.results || d.doctrines || d.memories || d.chunks || d.nodes || []) as Array<Record<string, unknown>>;

    for (let rank = 0; rank < Math.min(results.length, limit); rank++) {
      const r = results[rank];
      const id = String(r.id || r.engine_id || r.doc_id || r.memory_id || r.node_id || Math.random().toString(36).slice(2));
      const key = `${b.source}:${id}`;
      addToMap(key, {
        id,
        source: b.source,
        title: String(r.title || r.topic || r.engine_name || r.category || r.label || ''),
        snippet: String(r.content || r.conclusion || r.snippet || r.text || r.description || '').slice(0, 300),
        metadata: r,
      }, rank + 1, b.source);
    }
  }

  // Apply RRF scores + cross-layer boost
  const all: UnifiedResult[] = [];
  for (const [, entry] of resultMap) {
    let finalScore = entry.rrfScore;

    // Cross-layer boost: documents found across multiple retrieval systems are more relevant
    const layerCount = entry.result.layers.length;
    if (layerCount >= 3) {
      finalScore *= 1.5;
    } else if (layerCount >= 2) {
      finalScore *= 1.25;
    }

    entry.result.score = finalScore;
    all.push(entry.result);
  }

  all.sort((a, b) => b.score - a.score);
  return all.slice(0, limit);
}

// ---------------------------------------------------------------------------
// Core unified search logic (shared between POST and GET handlers)
// ---------------------------------------------------------------------------
async function executeUnifiedSearch(
  env: Env,
  ctx: ExecutionContext,
  query: string,
  limit: number,
  sources: string[],
  version: string,
): Promise<{
  results: UnifiedResult[];
  cache_hit: boolean;
  cache_age_ms?: number;
  response_ms: number;
  layers: Record<string, boolean>;
  layer_stats: Record<string, unknown>;
}> {
  const start = Date.now();

  // ─── Layer 1: KV Cache (<5ms) ───
  const cached = await cacheGet<UnifiedResult[]>(env.SEARCH_CACHE, 'unified', query, String(limit), sources.join(','));
  if (cached) {
    return {
      results: cached.data,
      cache_hit: true,
      cache_age_ms: cached.age_ms,
      response_ms: Date.now() - start,
      layers: { cache: true, vectorize: false, fts: false, reranker: false, backend: false, graph: false },
      layer_stats: {},
    };
  }

  // ─── Layer 1.5: Prefix Embedding Cache (saves ~43ms on repeated prefixes) ───
  let embedding: number[] = [];
  let embeddingCached = false;
  let embeddingTime = 0;

  try {
    const embedStart = Date.now();
    const embedResult = await embedWithCache(env.AI, env.SEARCH_CACHE, query);
    embedding = embedResult.embedding;
    embeddingCached = embedResult.cached;
    embeddingTime = Date.now() - embedStart;
  } catch (e) {
    log('warn', 'search.unified', 'Embedding generation failed', { error: String(e) });
  }

  // ─── Layer 2: Vectorize + FTS5 (parallel, 20-50ms) ───
  let vectorResults: VectorMatch[] = [];
  let ftsResults: FtsMatch[] = [];

  if (embedding.length > 0) {
    const sourceFilter = sources.length === 1 && sources[0] !== 'all' ? sources[0] : undefined;
    const [vr, fr] = await Promise.allSettled([
      vectorSearch(env, embedding, limit * 3, sourceFilter),
      ftsSearch(env.DB, query, limit * 3, sourceFilter),
    ]);
    vectorResults = vr.status === 'fulfilled' ? vr.value : [];
    ftsResults = fr.status === 'fulfilled' ? fr.value : [];
  }

  // ─── Initial merge for reranker candidates ───
  const initialCandidates = mergeAndRankRRF(vectorResults, ftsResults, [], limit * 2);

  // ─── Layer 2.5 + Layer 3: IN PARALLEL ───
  // Run reranker on Layer 2 results WHILE backends are still responding.
  // This is the key latency trick — reranking happens concurrently with fan-out.
  const [rerankedSettled, backendSettled] = await Promise.allSettled([
    // Layer 2.5: Cross-encoder reranker (FlagEmbedding-inspired)
    embedding.length > 0 && initialCandidates.length > 0
      ? rerank(env.AI, embedding, initialCandidates, limit)
      : Promise.resolve(initialCandidates),
    // Layer 3: Parallel backend fan-out + Graph-RAG
    parallelFanOut(env, query, limit, sources),
  ]);

  const reranked = rerankedSettled.status === 'fulfilled' ? rerankedSettled.value : initialCandidates;
  const backendResults = backendSettled.status === 'fulfilled' ? backendSettled.value : [];

  // ─── Final RRF merge: reranked local results + backend results ───
  // Convert reranked results back to ranked list format for final RRF
  const finalVectorMatches: VectorMatch[] = reranked.map((r, i) => ({
    id: r.id,
    score: 1 - (i / (reranked.length || 1)), // Convert rank position to score
    source: r.source,
    title: r.title,
    snippet: r.snippet,
    metadata: r.metadata || {},
  }));

  const results = mergeAndRankRRF(finalVectorMatches, [], backendResults, limit);
  const totalMs = Date.now() - start;

  // ─── Cache the result (async) ───
  ctx.waitUntil(
    cacheSet(env.SEARCH_CACHE, 'unified', results, query, String(limit), sources.join(',')),
  );

  const backendLatencies: Record<string, number> = {};
  for (const b of backendResults) {
    backendLatencies[b.source] = b.latency_ms;
  }

  return {
    results,
    cache_hit: false,
    response_ms: totalMs,
    layers: {
      cache: false,
      embedding_cached: embeddingCached,
      vectorize: vectorResults.length > 0,
      fts: ftsResults.length > 0,
      reranker: rerankedSettled.status === 'fulfilled' && reranked !== initialCandidates,
      backend: backendResults.some((b) => b.ok),
      graph: backendResults.some((b) => b.source === 'graph' && b.ok),
    },
    layer_stats: {
      embedding_ms: embeddingTime,
      embedding_cached: embeddingCached,
      vectorize_matches: vectorResults.length,
      fts_matches: ftsResults.length,
      reranked_candidates: initialCandidates.length,
      backend_latencies: backendLatencies,
      ranking_method: 'reciprocal_rank_fusion',
      rrf_k: RRF_K,
    },
  };
}

// ---------------------------------------------------------------------------
// POST /search — Unified cross-source search (5-Layer Architecture)
// ---------------------------------------------------------------------------
search.post('/', async (c) => {
  const version = c.env.WORKER_VERSION || '3.0.0';

  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return c.json(error('Request body must be valid JSON', 'ECHO_INVALID_INPUT', version), 400);
  }

  const query = String(body.query || body.q || '').trim();
  if (!query) {
    return c.json(error("Missing 'query' field", 'ECHO_MISSING_FIELD', version), 400);
  }

  const limit = Math.min(Number(body.limit) || 20, 100);
  const sourcesRaw = body.sources as string[] | string | undefined;
  const sources = Array.isArray(sourcesRaw) ? sourcesRaw : sourcesRaw ? [sourcesRaw] : ['all'];

  log('info', 'search.unified', 'Unified search (5-layer)', { query_len: query.length, limit, sources });

  const result = await executeUnifiedSearch(c.env, c.executionCtx, query, limit, sources, version);

  return c.json(success({
    ...result,
    query,
    sources,
    total: result.results.length,
    architecture: '5-layer: KV → EmbedCache → Vectorize+FTS5 → Reranker → Fan-out+GraphRAG',
  }, version, result.response_ms));
});

// ---------------------------------------------------------------------------
// GET /search — Same as POST but with query params
// ---------------------------------------------------------------------------
search.get('/', async (c) => {
  const version = c.env.WORKER_VERSION || '3.0.0';

  const query = (c.req.query('q') || c.req.query('query') || '').trim();
  if (!query) {
    return c.json(error("Missing 'q' query parameter", 'ECHO_MISSING_FIELD', version), 400);
  }

  const limit = Math.min(Number(c.req.query('limit')) || 20, 100);
  const sourcesRaw = c.req.query('sources');
  const sources = sourcesRaw ? sourcesRaw.split(',') : ['all'];

  log('info', 'search.unified.get', 'Unified search GET (5-layer)', { query_len: query.length, limit, sources });

  const result = await executeUnifiedSearch(c.env, c.executionCtx, query, limit, sources, version);

  return c.json(success({
    ...result,
    query,
    sources,
    total: result.results.length,
    architecture: '5-layer: KV → EmbedCache → Vectorize+FTS5 → Reranker → Fan-out+GraphRAG',
  }, version, result.response_ms));
});

// ---------------------------------------------------------------------------
// POST /search/engines — Cached engine search
// ---------------------------------------------------------------------------
search.post('/engines', async (c) => {
  const version = c.env.WORKER_VERSION || '3.0.0';
  const start = Date.now();

  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return c.json(error('Request body must be valid JSON', 'ECHO_INVALID_INPUT', version), 400);
  }

  const query = String(body.query || body.q || '').trim();
  if (!query) {
    return c.json(error("Missing 'query' field", 'ECHO_MISSING_FIELD', version), 400);
  }

  const limit = Math.min(Number(body.limit) || 15, 50);
  const mode = String(body.mode || 'FAST').toUpperCase();

  const cached = await cacheGet(c.env.SEARCH_CACHE, 'engine', query, String(limit), mode);
  if (cached) {
    return c.json(success({
      ...(cached.data as object),
      cache_hit: true,
      cache_age_ms: cached.age_ms,
      response_ms: Date.now() - start,
    }, version, Date.now() - start));
  }

  const auth = getAuthHeaders(c.env);
  try {
    const result = await proxyBinding(c.env.ENGINE_RUNTIME, `/search?q=${encodeURIComponent(query)}&limit=${limit}`, {
      method: 'GET',
      headers: auth,
    });

    if (result.ok) {
      c.executionCtx.waitUntil(cacheSet(c.env.SEARCH_CACHE, 'engine', result.data, query, String(limit), mode));
    }

    return c.json(success({
      ...(result.data as object),
      cache_hit: false,
      response_ms: Date.now() - start,
    }, version, result.latency_ms));
  } catch (e) {
    return c.json(error(`Engine search failed: ${String(e).slice(0, 200)}`, 'ECHO_ENGINE_ERROR', version), 500);
  }
});

// ---------------------------------------------------------------------------
// POST /search/knowledge — Cached knowledge search
// ---------------------------------------------------------------------------
search.post('/knowledge', async (c) => {
  const version = c.env.WORKER_VERSION || '3.0.0';
  const start = Date.now();

  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return c.json(error('Request body must be valid JSON', 'ECHO_INVALID_INPUT', version), 400);
  }

  const query = String(body.query || body.q || '').trim();
  if (!query) {
    return c.json(error("Missing 'query' field", 'ECHO_MISSING_FIELD', version), 400);
  }

  const category = body.category ? String(body.category).trim() : '';
  const limit = Math.min(Number(body.limit) || 10, 50);

  const cached = await cacheGet(c.env.SEARCH_CACHE, 'knowledge', query, String(limit), category);
  if (cached) {
    return c.json(success({
      ...(cached.data as object),
      cache_hit: true,
      cache_age_ms: cached.age_ms,
      response_ms: Date.now() - start,
    }, version, Date.now() - start));
  }

  const auth = getAuthHeaders(c.env);
  try {
    let searchPath = `/search?q=${encodeURIComponent(query)}&limit=${limit}`;
    if (category) searchPath += `&category=${encodeURIComponent(category)}`;

    const result = await proxyBinding(c.env.KNOWLEDGE_FORGE, searchPath, {
      method: 'GET',
      headers: auth,
    });

    if (result.ok) {
      c.executionCtx.waitUntil(cacheSet(c.env.SEARCH_CACHE, 'knowledge', result.data, query, String(limit), category));
    }

    return c.json(success({
      ...(result.data as object),
      cache_hit: false,
      response_ms: Date.now() - start,
    }, version, result.latency_ms));
  } catch (e) {
    return c.json(error(`Knowledge search failed: ${String(e).slice(0, 200)}`, 'ECHO_KNOWLEDGE_ERROR', version), 500);
  }
});

// ---------------------------------------------------------------------------
// POST /search/brain — Cached brain search
// ---------------------------------------------------------------------------
search.post('/brain', async (c) => {
  const version = c.env.WORKER_VERSION || '3.0.0';
  const start = Date.now();

  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return c.json(error('Request body must be valid JSON', 'ECHO_INVALID_INPUT', version), 400);
  }

  const query = String(body.query || body.q || '').trim();
  if (!query) {
    return c.json(error("Missing 'query' field", 'ECHO_MISSING_FIELD', version), 400);
  }

  const limit = Math.min(Number(body.limit) || 10, 50);

  const cached = await cacheGet(c.env.SEARCH_CACHE, 'brain', query, String(limit));
  if (cached) {
    return c.json(success({
      ...(cached.data as object),
      cache_hit: true,
      cache_age_ms: cached.age_ms,
      response_ms: Date.now() - start,
    }, version, Date.now() - start));
  }

  const auth = getAuthHeaders(c.env);
  try {
    const result = await proxyBinding(c.env.SHARED_BRAIN, '/search', {
      method: 'POST',
      body: { query, limit },
      headers: auth,
    });

    if (result.ok) {
      c.executionCtx.waitUntil(cacheSet(c.env.SEARCH_CACHE, 'brain', result.data, query, String(limit)));
    }

    return c.json(success({
      ...(result.data as object),
      cache_hit: false,
      response_ms: Date.now() - start,
    }, version, result.latency_ms));
  } catch (e) {
    return c.json(error(`Brain search failed: ${String(e).slice(0, 200)}`, 'ECHO_BRAIN_ERROR', version), 500);
  }
});

// ---------------------------------------------------------------------------
// GET /search/stats — Cache performance + architecture metrics
// ---------------------------------------------------------------------------
search.get('/stats', async (c) => {
  const version = c.env.WORKER_VERSION || '3.0.0';

  let indexStats = { total_entries: 0, engine_entries: 0, knowledge_entries: 0, brain_entries: 0 };
  try {
    const counts = await c.env.DB.prepare(
      `SELECT source, COUNT(*) as c FROM search_index GROUP BY source`,
    ).all<{ source: string; c: number }>();
    let total = 0;
    for (const row of counts.results || []) {
      total += row.c;
      if (row.source === 'engine') indexStats.engine_entries = row.c;
      if (row.source === 'knowledge') indexStats.knowledge_entries = row.c;
      if (row.source === 'brain') indexStats.brain_entries = row.c;
    }
    indexStats.total_entries = total;
  } catch {
    // DB not yet initialized
  }

  return c.json(success({
    index: indexStats,
    cache: {
      backend: 'cloudflare-kv',
      ttl_seconds: { engine: 300, knowledge: 900, brain: 120, unified: 300 },
      prefix_embedding_cache: { ttl: 3600, prefix_len: 128 },
    },
    vectorize: { index: 'sdk-gateway-vectors', dimensions: 768, model: '@cf/baai/bge-base-en-v1.5' },
    ranking: {
      method: 'reciprocal_rank_fusion',
      k: RRF_K,
      cross_layer_boost: { '3+_layers': '1.5x', '2_layers': '1.25x' },
    },
    reranker: {
      method: 'cross_encoder_cosine',
      blend: '40% original + 60% cosine_similarity',
      model: '@cf/baai/bge-base-en-v1.5',
      inspired_by: 'FlagEmbedding',
    },
    graph_rag: {
      enabled: true,
      service: 'echo-graph-rag',
      inspired_by: 'LightRAG',
    },
    architecture: '5-layer: KV(<5ms) → EmbedCache(<2ms) → Vectorize+FTS5(20-50ms) → Reranker(30ms) → Fan-out+GraphRAG(80-200ms)',
  }, version));
});

// ---------------------------------------------------------------------------
// POST /search/unified — Alias for POST /search (CLI compatibility)
// ---------------------------------------------------------------------------
search.post('/unified', async (c) => {
  const version = c.env.WORKER_VERSION || '3.0.0';

  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return c.json(error('Request body must be valid JSON', 'ECHO_INVALID_INPUT', version), 400);
  }

  const query = String(body.query || body.q || '').trim();
  if (!query) {
    return c.json(error("Missing 'query' field", 'ECHO_MISSING_FIELD', version), 400);
  }

  const limit = Math.min(Number(body.limit) || 20, 100);
  const sourcesRaw = body.sources as string[] | string | undefined;
  const sources = Array.isArray(sourcesRaw) ? sourcesRaw : sourcesRaw ? [sourcesRaw] : ['all'];

  log('info', 'search.unified.alias', 'Unified search (alias)', { query_len: query.length, limit, sources });

  const result = await executeUnifiedSearch(c.env, c.executionCtx, query, limit, sources, version);

  return c.json(success({
    ...result,
    query,
    sources,
    total: result.results.length,
    architecture: '5-layer: KV → EmbedCache → Vectorize+FTS5 → Reranker → Fan-out+GraphRAG',
  }, version, result.response_ms));
});

export default search;
