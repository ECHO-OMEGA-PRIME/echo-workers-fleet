/**
 * Echo SDK Gateway — KV Search Cache (Layer 1: <5ms reads).
 *
 * SHA-256 hash of normalized query → cached JSON result.
 * TTL varies by source: engine queries 5min, knowledge 15min, brain 2min.
 */

import { log } from './proxy';

const TTL_MAP: Record<string, number> = {
  engine: 300,      // 5 min — doctrines change rarely
  knowledge: 900,   // 15 min — knowledge base is semi-static
  brain: 120,       // 2 min — brain is more dynamic
  unified: 300,     // 5 min — cross-source unified search
  domains: 3600,    // 1 hour — domain list barely changes
  stats: 300,       // 5 min — stats are aggregate
};

/**
 * Generate SHA-256 cache key from normalized query params.
 */
async function hashKey(parts: string[]): Promise<string> {
  const raw = parts.map((p) => p.trim().toLowerCase()).join('|');
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  const hex = Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `sc:${hex.slice(0, 32)}`;
}

/**
 * Try to get a cached result. Returns null on miss.
 */
export async function cacheGet<T>(
  kv: KVNamespace,
  source: string,
  ...keyParts: string[]
): Promise<{ data: T; age_ms: number } | null> {
  const key = await hashKey([source, ...keyParts]);
  const raw = await kv.get(key, 'json') as { data: T; ts: number } | null;
  if (!raw) return null;
  const age_ms = Date.now() - raw.ts;
  log('debug', 'cache', 'Cache HIT', { source, key: key.slice(0, 16), age_ms });
  return { data: raw.data, age_ms };
}

/**
 * Store a result in cache with source-appropriate TTL.
 */
export async function cacheSet<T>(
  kv: KVNamespace,
  source: string,
  data: T,
  ...keyParts: string[]
): Promise<void> {
  const key = await hashKey([source, ...keyParts]);
  const ttl = TTL_MAP[source] || 300;
  await kv.put(key, JSON.stringify({ data, ts: Date.now() }), { expirationTtl: ttl });
  log('debug', 'cache', 'Cache SET', { source, key: key.slice(0, 16), ttl });
}

/**
 * Get cached embedding vector for a query prefix.
 * Saves ~43ms per repeated query by skipping Workers AI embedding generation.
 * Inspired by vLLM prefix caching / FlagEmbedding cache patterns.
 */
export async function embedCacheGet(
  kv: KVNamespace,
  text: string,
): Promise<number[] | null> {
  const prefix = text.trim().toLowerCase().slice(0, 128);
  const key = await hashKey(['emb', prefix]);
  const raw = await kv.get(key, 'json') as number[] | null;
  if (raw) log('debug', 'cache', 'Embedding cache HIT', { prefix_len: prefix.length });
  return raw;
}

/**
 * Cache an embedding vector keyed by normalized query prefix (1 hour TTL).
 */
export async function embedCacheSet(
  kv: KVNamespace,
  text: string,
  embedding: number[],
): Promise<void> {
  const prefix = text.trim().toLowerCase().slice(0, 128);
  const key = await hashKey(['emb', prefix]);
  await kv.put(key, JSON.stringify(embedding), { expirationTtl: 3600 });
  log('debug', 'cache', 'Embedding cache SET', { prefix_len: prefix.length });
}

export { TTL_MAP };
