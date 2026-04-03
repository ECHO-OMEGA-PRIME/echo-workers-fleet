// Echo SDK Gateway — Cron handlers for cache warming and index sync.
//
// Cron triggers:
//   every-15-min  — Warm KV cache with popular queries + sync D1/Vectorize
//   0 * * * *     — Full index refresh from all 3 backends

import type { Env } from './types';
import { proxyBinding, getAuthHeaders, log } from './utils/proxy';
import { cacheSet, embedCacheGet, embedCacheSet } from './utils/cache';

// ---------------------------------------------------------------------------
// Popular queries to pre-warm (keeps gateway cache hot for common searches)
// ---------------------------------------------------------------------------
const WARM_QUERIES = [
  'tax deduction', 'contract analysis', 'oil and gas lease', 'cryptocurrency tax',
  'employment law', 'real estate', 'intellectual property', 'cybersecurity',
  'drilling operations', 'environmental compliance', 'bankruptcy',
  'corporate formation', 'trust and estate', 'securities regulation',
];

// ---------------------------------------------------------------------------
// D1 schema initialization
// ---------------------------------------------------------------------------
async function ensureSchema(db: D1Database): Promise<void> {
  await db.batch([
    db.prepare(`
      CREATE TABLE IF NOT EXISTS search_index (
        id TEXT PRIMARY KEY,
        source TEXT NOT NULL,
        title TEXT NOT NULL,
        snippet TEXT NOT NULL DEFAULT '',
        category TEXT DEFAULT '',
        keywords TEXT DEFAULT '',
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `),
    db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_search_source ON search_index(source)
    `),
    db.prepare(`
      CREATE VIRTUAL TABLE IF NOT EXISTS search_fts USING fts5(
        id, source, title, snippet, keywords,
        content=search_index,
        content_rowid=rowid
      )
    `),
  ]);
}

// ---------------------------------------------------------------------------
// Sync engine data into local D1 + Vectorize indexes
// ---------------------------------------------------------------------------
async function syncEngines(env: Env): Promise<number> {
  const auth = getAuthHeaders(env);
  let synced = 0;

  try {
    // Get domain list with engine counts
    const domainsResult = await proxyBinding(env.ENGINE_RUNTIME, '/domains', { method: 'GET', headers: auth });
    if (!domainsResult.ok) return 0;

    const domainsData = domainsResult.data as { domains?: Array<{ category: string; label: string; description?: string; engines_loaded: number; total_doctrines: number }> };
    const domains = domainsData.domains || [];

    // Batch insert domains + top engines into D1
    const stmts: D1PreparedStatement[] = [];
    const vectors: { id: string; values: number[]; metadata: Record<string, string> }[] = [];

    for (const d of domains.slice(0, 500)) {
      const id = `engine:domain:${d.category}`;
      const snippet = `${d.label || d.category}: ${d.engines_loaded} engines, ${d.total_doctrines} doctrines. ${d.description || ''}`.slice(0, 500);

      stmts.push(
        env.DB.prepare(
          `INSERT OR REPLACE INTO search_index (id, source, title, snippet, category, keywords) VALUES (?, 'engine', ?, ?, ?, ?)`,
        ).bind(id, d.label || d.category, snippet, d.category, `${d.category} ${d.label || ''}`),
      );

      // Prepare for Vectorize (we'll embed in batches)
      vectors.push({
        id,
        values: [], // placeholder — will embed below
        metadata: { source: 'engine', title: d.label || d.category, snippet: snippet.slice(0, 200), category: d.category },
      });
      synced++;
    }

    // Execute D1 batch (max 100 per batch)
    for (let i = 0; i < stmts.length; i += 100) {
      await env.DB.batch(stmts.slice(i, i + 100));
    }

    // Rebuild FTS index
    await env.DB.prepare(`INSERT INTO search_fts(search_fts) VALUES('rebuild')`).run();

    // Embed and upsert to Vectorize (batch of 50 texts max for Workers AI)
    for (let i = 0; i < vectors.length; i += 50) {
      const batch = vectors.slice(i, i + 50);
      const texts = batch.map((v) => `${v.metadata.title} ${v.metadata.snippet}`.slice(0, 512));

      try {
        const embedResult = await env.AI.run('@cf/baai/bge-base-en-v1.5', { text: texts }) as { data: number[][] };

        const vectorsToInsert = batch.map((v, idx) => ({
          id: v.id,
          values: embedResult.data[idx],
          metadata: v.metadata,
        }));

        await env.VECTORS.upsert(vectorsToInsert);
      } catch (e) {
        log('warn', 'cron.syncEngines', 'Vectorize batch upsert failed', { error: String(e), batch_start: i });
      }
    }

    log('info', 'cron.syncEngines', `Synced ${synced} engine domains`);
  } catch (e) {
    log('error', 'cron.syncEngines', 'Engine sync failed', { error: String(e) });
  }

  return synced;
}

// ---------------------------------------------------------------------------
// Sync knowledge data into local D1 + Vectorize indexes
// ---------------------------------------------------------------------------
async function syncKnowledge(env: Env): Promise<number> {
  const auth = getAuthHeaders(env);
  let synced = 0;

  try {
    // Get categories from Knowledge Forge
    const catResult = await proxyBinding(env.KNOWLEDGE_FORGE, '/categories', { method: 'GET', headers: auth });
    if (!catResult.ok) return 0;

    const catData = catResult.data as { categories?: Array<{ category: string; count: number }> };
    const categories = catData.categories || [];

    const stmts: D1PreparedStatement[] = [];
    const vectors: { id: string; text: string; metadata: Record<string, string> }[] = [];

    // For each category, get a sample of documents
    for (const cat of categories.slice(0, 100)) {
      const searchResult = await proxyBinding(env.KNOWLEDGE_FORGE, `/search?q=${encodeURIComponent(cat.category)}&limit=5`, {
        method: 'GET',
        headers: auth,
      });
      if (!searchResult.ok) continue;

      const searchData = searchResult.data as { results?: Array<{ id?: string; title?: string; content?: string; category?: string }> };
      for (const doc of searchData.results || []) {
        const id = `knowledge:${doc.id || crypto.randomUUID().slice(0, 8)}`;
        const title = String(doc.title || cat.category);
        const snippet = String(doc.content || '').slice(0, 500);

        stmts.push(
          env.DB.prepare(
            `INSERT OR REPLACE INTO search_index (id, source, title, snippet, category, keywords) VALUES (?, 'knowledge', ?, ?, ?, ?)`,
          ).bind(id, title, snippet, cat.category, `${cat.category} ${title}`),
        );

        vectors.push({
          id,
          text: `${title} ${snippet}`.slice(0, 512),
          metadata: { source: 'knowledge', title, snippet: snippet.slice(0, 200), category: cat.category },
        });
        synced++;
      }
    }

    // D1 batch
    for (let i = 0; i < stmts.length; i += 100) {
      await env.DB.batch(stmts.slice(i, i + 100));
    }

    // Vectorize batch
    for (let i = 0; i < vectors.length; i += 50) {
      const batch = vectors.slice(i, i + 50);
      try {
        const embedResult = await env.AI.run('@cf/baai/bge-base-en-v1.5', { text: batch.map((v) => v.text) }) as { data: number[][] };
        await env.VECTORS.upsert(
          batch.map((v, idx) => ({ id: v.id, values: embedResult.data[idx], metadata: v.metadata })),
        );
      } catch (e) {
        log('warn', 'cron.syncKnowledge', 'Vectorize upsert failed', { error: String(e) });
      }
    }

    // Rebuild FTS
    try {
      await env.DB.prepare(`INSERT INTO search_fts(search_fts) VALUES('rebuild')`).run();
    } catch {
      // May fail if table is being rebuilt concurrently
    }

    log('info', 'cron.syncKnowledge', `Synced ${synced} knowledge docs`);
  } catch (e) {
    log('error', 'cron.syncKnowledge', 'Knowledge sync failed', { error: String(e) });
  }

  return synced;
}

// ---------------------------------------------------------------------------
// Sync graph-RAG relationship data into Vectorize
// ---------------------------------------------------------------------------
async function syncGraph(env: Env): Promise<number> {
  const auth = getAuthHeaders(env);
  let synced = 0;

  try {
    // Get graph stats and top domains from echo-graph-rag
    const statsResult = await proxyBinding(env.GRAPH_RAG, '/stats', { method: 'GET', headers: auth });
    if (!statsResult.ok) return 0;

    const statsData = statsResult.data as { domains?: Array<{ domain: string; nodes: number; edges: number }> };
    const domains = statsData.domains || [];

    const stmts: D1PreparedStatement[] = [];
    const vectors: { id: string; text: string; metadata: Record<string, string> }[] = [];

    for (const d of domains.slice(0, 200)) {
      const id = `graph:domain:${d.domain}`;
      const snippet = `Graph domain: ${d.domain} — ${d.nodes} nodes, ${d.edges} edges (relationship-aware retrieval)`;

      stmts.push(
        env.DB.prepare(
          `INSERT OR REPLACE INTO search_index (id, source, title, snippet, category, keywords) VALUES (?, 'graph', ?, ?, ?, ?)`,
        ).bind(id, d.domain, snippet, d.domain, d.domain),
      );

      vectors.push({
        id,
        text: snippet,
        metadata: { source: 'graph', title: d.domain, snippet, category: d.domain },
      });
      synced++;
    }

    // D1 batch
    for (let i = 0; i < stmts.length; i += 100) {
      await env.DB.batch(stmts.slice(i, i + 100));
    }

    // Vectorize batch
    for (let i = 0; i < vectors.length; i += 50) {
      const batch = vectors.slice(i, i + 50);
      try {
        const embedResult = await env.AI.run('@cf/baai/bge-base-en-v1.5', { text: batch.map((v) => v.text) }) as { data: number[][] };
        await env.VECTORS.upsert(
          batch.map((v, idx) => ({ id: v.id, values: embedResult.data[idx], metadata: v.metadata })),
        );
      } catch (e) {
        log('warn', 'cron.syncGraph', 'Vectorize upsert failed', { error: String(e) });
      }
    }

    log('info', 'cron.syncGraph', `Synced ${synced} graph domains`);
  } catch (e) {
    log('error', 'cron.syncGraph', 'Graph sync failed', { error: String(e) });
  }

  return synced;
}

// ---------------------------------------------------------------------------
// Warm KV cache with popular queries + pre-warm embedding cache
// ---------------------------------------------------------------------------
async function warmCache(env: Env): Promise<number> {
  const auth = getAuthHeaders(env);
  let warmed = 0;

  for (const query of WARM_QUERIES) {
    try {
      // Warm engine search
      const engineResult = await proxyBinding(env.ENGINE_RUNTIME, `/search?q=${encodeURIComponent(query)}&limit=10`, {
        method: 'GET',
        headers: auth,
      });
      if (engineResult.ok) {
        await cacheSet(env.SEARCH_CACHE, 'engine', engineResult.data, query, '10', 'FAST');
        warmed++;
      }

      // Pre-warm embedding cache for popular queries (saves ~43ms per repeated query)
      const cached = await embedCacheGet(env.SEARCH_CACHE, query);
      if (!cached) {
        try {
          const embResult = await env.AI.run('@cf/baai/bge-base-en-v1.5', { text: [query.slice(0, 512)] }) as { data: number[][] };
          if (embResult?.data?.[0]) {
            await embedCacheSet(env.SEARCH_CACHE, query, embResult.data[0]);
          }
        } catch {
          // Skip failed embedding pre-warms
        }
      }
    } catch {
      // Skip failed warms
    }
  }

  log('info', 'cron.warmCache', `Warmed ${warmed} cache entries`);
  return warmed;
}

// ---------------------------------------------------------------------------
// Main cron handler
// ---------------------------------------------------------------------------
export async function handleScheduled(event: ScheduledEvent, env: Env): Promise<void> {
  const start = Date.now();
  log('info', 'cron', 'Cron triggered', { cron: event.cron, time: new Date(event.scheduledTime).toISOString() });

  try {
    // L1 FIX: Only ensure schema on first hourly run, not every 15-min cron
    if (event.cron === '0 * * * *') {
      await ensureSchema(env.DB);
    }

    if (event.cron === '0 * * * *') {
      // Full hourly sync: engines + knowledge + graph in parallel
      const [engines, knowledge, graph] = await Promise.allSettled([
        syncEngines(env),
        syncKnowledge(env),
        syncGraph(env),
      ]);
      const engineCount = engines.status === 'fulfilled' ? engines.value : 0;
      const knowledgeCount = knowledge.status === 'fulfilled' ? knowledge.value : 0;
      const graphCount = graph.status === 'fulfilled' ? graph.value : 0;

      // Also warm cache after sync
      const warmed = await warmCache(env);

      log('info', 'cron', 'Hourly sync complete', {
        engines_synced: engineCount,
        knowledge_synced: knowledgeCount,
        graph_synced: graphCount,
        cache_warmed: warmed,
        duration_ms: Date.now() - start,
      });
    } else {
      // Every-15-minute cache warm
      const warmed = await warmCache(env);
      log('info', 'cron', 'Cache warm complete', { warmed, duration_ms: Date.now() - start });
    }
  } catch (e) {
    log('error', 'cron', 'Cron failed', { error: String(e), duration_ms: Date.now() - start });
  }
}
