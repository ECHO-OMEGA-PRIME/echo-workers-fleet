/**
 * Echo SDK Gateway — Engine Composition & Chaining routes.
 *
 * Create compound engines from multiple component engines, then query
 * them using merge, chain, or vote strategies.
 *
 * Routes:
 *   POST   /compose           — Create a compound engine
 *   GET    /compose/list      — List all compound engines
 *   GET    /compose/:id       — Get compound engine details
 *   DELETE /compose/:id       — Delete a compound engine
 *   POST   /compose/:id/query — Query a compound engine
 */

import { Hono } from 'hono';
import type { Env } from '../types';
import { success, error } from '../utils/envelope';
import { proxyBinding, log } from '../utils/proxy';

// ---------------------------------------------------------------------------
// D1 table bootstrap (idempotent)
// ---------------------------------------------------------------------------

const TABLE_SQL = `
CREATE TABLE IF NOT EXISTS compound_engines (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  engines TEXT NOT NULL,
  strategy TEXT DEFAULT 'merge',
  created_at TEXT DEFAULT (datetime('now')),
  query_count INTEGER DEFAULT 0
);
`;

// L1 FIX: Cache table initialization
let tableInitialized = false;
async function ensureTable(db: D1Database): Promise<void> {
  if (tableInitialized) return;
  try {
    await db.exec(TABLE_SQL);
    tableInitialized = true;
  } catch {
    tableInitialized = true;
  }
}

function generateId(): string {
  return crypto.randomUUID();
}

// ---------------------------------------------------------------------------
// Compose route module
// ---------------------------------------------------------------------------

const compose = new Hono<{ Bindings: Env }>();

// ---------------------------------------------------------------------------
// GET /compose/list — List all compound engines (static before parameterized)
// ---------------------------------------------------------------------------
compose.get('/list', async (c) => {
  const version = c.env.WORKER_VERSION || '1.0.0';
  const start = Date.now();

  log('info', 'compose.list', 'Listing all compound engines');

  await ensureTable(c.env.DB);

  try {
    const result = await c.env.DB.prepare(
      'SELECT id, name, description, engines, strategy, created_at, query_count FROM compound_engines ORDER BY created_at DESC',
    ).all();

    const compounds = (result.results || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      engines: JSON.parse(row.engines || '[]'),
      strategy: row.strategy,
      created_at: row.created_at,
      query_count: row.query_count,
      engine_count: JSON.parse(row.engines || '[]').length,
    }));

    const latency_ms = Date.now() - start;
    log('info', 'compose.list', `Found ${compounds.length} compound engines`, { latency_ms });

    return c.json(
      success(
        {
          compound_engines: compounds,
          total: compounds.length,
        },
        version,
        latency_ms,
      ),
    );
  } catch (e) {
    const msg = String(e).slice(0, 200);
    log('error', 'compose.list', `List failed: ${msg}`);
    return c.json(error(`List failed: ${msg}`, 'ECHO_COMPOSE_ERROR', version, Date.now() - start), 500);
  }
});

// ---------------------------------------------------------------------------
// POST /compose — Create a compound engine
// ---------------------------------------------------------------------------
compose.post('/', async (c) => {
  const version = c.env.WORKER_VERSION || '1.0.0';
  const start = Date.now();

  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return c.json(error('Request body must be valid JSON', 'ECHO_INVALID_INPUT', version), 400);
  }

  const engines = body.engines as string[] | undefined;
  const name = body.name as string | undefined;
  const description = (body.description as string) || null;
  const strategy = (body.strategy as string) || 'merge';

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return c.json(error("Missing required field 'name'", 'ECHO_MISSING_FIELD', version), 400);
  }
  if (!engines || !Array.isArray(engines) || engines.length === 0) {
    return c.json(error("Missing or empty 'engines' array", 'ECHO_MISSING_FIELD', version), 400);
  }
  if (!['merge', 'chain', 'vote'].includes(strategy)) {
    return c.json(
      error("Invalid 'strategy'. Must be 'merge', 'chain', or 'vote'", 'ECHO_INVALID_INPUT', version),
      400,
    );
  }

  log('info', 'compose.create', `Creating compound engine '${name}' with ${engines.length} engines (${strategy})`, {
    name,
    engines,
    strategy,
  });

  await ensureTable(c.env.DB);

  try {
    // 1. Validate all engine_ids exist via ENGINE_RUNTIME
    const validationResults: Array<{ engine_id: string; valid: boolean }> = [];

    if (c.env.ENGINE_RUNTIME) {
      const validationPromises = engines.map(async (engineId) => {
        try {
          const res = await proxyBinding<any>(c.env.ENGINE_RUNTIME, `/query/${engineId}`, {
            method: 'POST',
            body: { query: 'test', mode: 'FAST' },
          });
          return { engine_id: engineId, valid: res.ok };
        } catch {
          return { engine_id: engineId, valid: false };
        }
      });

      const results = await Promise.all(validationPromises);
      validationResults.push(...results);

      const invalidEngines = results.filter((r) => !r.valid).map((r) => r.engine_id);
      if (invalidEngines.length > 0) {
        return c.json(
          error(
            `Engine(s) not found in ENGINE_RUNTIME: ${invalidEngines.join(', ')}`,
            'ECHO_ENGINE_NOT_FOUND',
            version,
            Date.now() - start,
          ),
          404,
        );
      }
    }

    // 2. Store in D1
    const compoundId = generateId();

    await c.env.DB.prepare(
      'INSERT INTO compound_engines (id, name, description, engines, strategy) VALUES (?, ?, ?, ?, ?)',
    )
      .bind(compoundId, name.trim(), description, JSON.stringify(engines), strategy)
      .run();

    const latency_ms = Date.now() - start;
    log('info', 'compose.create', `Compound engine created: ${name} (${compoundId})`, { latency_ms });

    return c.json(
      success(
        {
          id: compoundId,
          name: name.trim(),
          description,
          engines,
          strategy,
          engine_count: engines.length,
          query_count: 0,
          created_at: new Date().toISOString(),
        },
        version,
        latency_ms,
      ),
    );
  } catch (e) {
    const msg = String(e);
    if (msg.includes('UNIQUE constraint')) {
      return c.json(
        error(`Compound engine with name '${name}' already exists`, 'ECHO_DUPLICATE', version, Date.now() - start),
        409,
      );
    }
    log('error', 'compose.create', `Create failed: ${msg.slice(0, 200)}`);
    return c.json(error(`Create failed: ${msg.slice(0, 200)}`, 'ECHO_COMPOSE_ERROR', version, Date.now() - start), 500);
  }
});

// ---------------------------------------------------------------------------
// GET /compose/:id — Get compound engine details
// ---------------------------------------------------------------------------
compose.get('/:id', async (c) => {
  const version = c.env.WORKER_VERSION || '1.0.0';
  const start = Date.now();
  const compoundId = c.req.param('id');

  log('info', 'compose.get', `Fetching compound engine ${compoundId}`);

  await ensureTable(c.env.DB);

  try {
    const row = await c.env.DB.prepare(
      'SELECT id, name, description, engines, strategy, created_at, query_count FROM compound_engines WHERE id = ?',
    )
      .bind(compoundId)
      .first<{ id: string; name: string; description: string | null; engines: string; strategy: string; created_at: string; query_count: number }>();

    if (!row) {
      return c.json(
        error(`Compound engine '${compoundId}' not found`, 'ECHO_NOT_FOUND', version, Date.now() - start),
        404,
      );
    }

    const engineIds: string[] = JSON.parse(row.engines || '[]');

    // Fetch component stats from ENGINE_RUNTIME if available
    const componentStats: Array<{ engine_id: string; doctrines: number | null; status: string }> = [];

    if (c.env.ENGINE_RUNTIME) {
      const statsPromises = engineIds.map(async (engineId) => {
        try {
          const res = await proxyBinding<any>(c.env.ENGINE_RUNTIME, `/query/${engineId}`, {
            method: 'POST',
            body: { query: '*', mode: 'FAST' },
          });
          if (res.ok && res.data) {
            const d = res.data;
            return {
              engine_id: engineId,
              doctrines: d.matched_doctrines || (d.doctrines ? d.doctrines.length : 0),
              status: 'available',
            };
          }
          return { engine_id: engineId, doctrines: null, status: 'unavailable' };
        } catch {
          return { engine_id: engineId, doctrines: null, status: 'error' };
        }
      });

      componentStats.push(...(await Promise.all(statsPromises)));
    } else {
      for (const eid of engineIds) {
        componentStats.push({ engine_id: eid, doctrines: null, status: 'unknown' });
      }
    }

    const latency_ms = Date.now() - start;

    return c.json(
      success(
        {
          id: row.id,
          name: row.name,
          description: row.description,
          engines: engineIds,
          strategy: row.strategy,
          engine_count: engineIds.length,
          query_count: row.query_count,
          created_at: row.created_at,
          components: componentStats,
        },
        version,
        latency_ms,
      ),
    );
  } catch (e) {
    const msg = String(e).slice(0, 200);
    log('error', 'compose.get', `Get failed: ${msg}`);
    return c.json(error(`Get failed: ${msg}`, 'ECHO_COMPOSE_ERROR', version, Date.now() - start), 500);
  }
});

// ---------------------------------------------------------------------------
// DELETE /compose/:id — Delete a compound engine
// ---------------------------------------------------------------------------
compose.delete('/:id', async (c) => {
  const version = c.env.WORKER_VERSION || '1.0.0';
  const start = Date.now();
  const compoundId = c.req.param('id');

  log('info', 'compose.delete', `Deleting compound engine ${compoundId}`);

  await ensureTable(c.env.DB);

  try {
    // Verify it exists first
    const existing = await c.env.DB.prepare('SELECT id, name FROM compound_engines WHERE id = ?')
      .bind(compoundId)
      .first<{ id: string; name: string }>();

    if (!existing) {
      return c.json(
        error(`Compound engine '${compoundId}' not found`, 'ECHO_NOT_FOUND', version, Date.now() - start),
        404,
      );
    }

    await c.env.DB.prepare('DELETE FROM compound_engines WHERE id = ?').bind(compoundId).run();

    const latency_ms = Date.now() - start;
    log('info', 'compose.delete', `Deleted compound engine ${existing.name} (${compoundId})`, { latency_ms });

    return c.json(
      success(
        {
          deleted: true,
          id: compoundId,
          name: existing.name,
        },
        version,
        latency_ms,
      ),
    );
  } catch (e) {
    const msg = String(e).slice(0, 200);
    log('error', 'compose.delete', `Delete failed: ${msg}`);
    return c.json(error(`Delete failed: ${msg}`, 'ECHO_COMPOSE_ERROR', version, Date.now() - start), 500);
  }
});

// ---------------------------------------------------------------------------
// POST /compose/:id/query — Query a compound engine
// ---------------------------------------------------------------------------
compose.post('/:id/query', async (c) => {
  const version = c.env.WORKER_VERSION || '1.0.0';
  const start = Date.now();
  const compoundId = c.req.param('id');

  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return c.json(error('Request body must be valid JSON', 'ECHO_INVALID_INPUT', version), 400);
  }

  const query = (body.query as string || '').trim();
  const mode = (body.mode as string) || 'FAST';

  if (!query) {
    return c.json(error("Missing required field 'query'", 'ECHO_MISSING_FIELD', version), 400);
  }

  log('info', 'compose.query', `Querying compound engine ${compoundId}`, { query: query.slice(0, 100) });

  await ensureTable(c.env.DB);

  try {
    // Fetch compound engine definition
    const row = await c.env.DB.prepare(
      'SELECT id, name, engines, strategy, query_count FROM compound_engines WHERE id = ?',
    )
      .bind(compoundId)
      .first<{ id: string; name: string; engines: string; strategy: string; query_count: number }>();

    if (!row) {
      return c.json(
        error(`Compound engine '${compoundId}' not found`, 'ECHO_NOT_FOUND', version, Date.now() - start),
        404,
      );
    }

    if (!c.env.ENGINE_RUNTIME) {
      return c.json(
        error('ENGINE_RUNTIME service binding unavailable', 'ECHO_BINDING_MISSING', version, Date.now() - start),
        503,
      );
    }

    const engineIds: string[] = JSON.parse(row.engines || '[]');
    const strategy = row.strategy;

    log('info', 'compose.query', `Strategy: ${strategy}, engines: ${engineIds.length}`, { strategy, engine_count: engineIds.length });

    let result: unknown;

    if (strategy === 'merge') {
      result = await executeMerge(c.env.ENGINE_RUNTIME, engineIds, query, mode);
    } else if (strategy === 'chain') {
      result = await executeChain(c.env.ENGINE_RUNTIME, engineIds, query, mode);
    } else if (strategy === 'vote') {
      result = await executeVote(c.env.ENGINE_RUNTIME, engineIds, query, mode);
    } else {
      return c.json(error(`Unknown strategy '${strategy}'`, 'ECHO_INVALID_INPUT', version, Date.now() - start), 400);
    }

    // Increment query count
    await c.env.DB.prepare('UPDATE compound_engines SET query_count = query_count + 1 WHERE id = ?')
      .bind(compoundId)
      .run();

    const latency_ms = Date.now() - start;
    log('info', 'compose.query', `Compound query complete (${strategy})`, { latency_ms });

    return c.json(
      success(
        {
          compound_engine: row.name,
          compound_id: compoundId,
          strategy,
          query,
          engines_queried: engineIds.length,
          result,
        },
        version,
        latency_ms,
      ),
    );
  } catch (e) {
    const msg = String(e).slice(0, 200);
    log('error', 'compose.query', `Compound query failed: ${msg}`);
    return c.json(error(`Compound query failed: ${msg}`, 'ECHO_COMPOSE_ERROR', version, Date.now() - start), 500);
  }
});

// ---------------------------------------------------------------------------
// Strategy: merge — query all engines in parallel, merge doctrines, sort by score
// ---------------------------------------------------------------------------

async function executeMerge(
  binding: Fetcher,
  engineIds: string[],
  query: string,
  mode: string,
): Promise<{
  doctrines: any[];
  total_matched: number;
  engines_responded: number;
  engines_failed: string[];
}> {
  const results = await Promise.allSettled(
    engineIds.map(async (engineId) => {
      const res = await proxyBinding<any>(binding, `/query/${engineId}`, {
        method: 'POST',
        body: { query, mode },
      });
      return { engine_id: engineId, res };
    }),
  );

  const allDoctrines: any[] = [];
  const enginesFailed: string[] = [];
  let enginesResponded = 0;

  for (let i = 0; i < results.length; i++) {
    const settled = results[i];
    const engineId = engineIds[i];

    if (settled.status === 'fulfilled' && settled.value.res.ok && settled.value.res.data) {
      enginesResponded++;
      const data = settled.value.res.data;
      const doctrines = data.doctrines || data.results || [];
      for (const d of doctrines) {
        allDoctrines.push({ ...d, source_engine: engineId });
      }
    } else {
      enginesFailed.push(engineId);
    }
  }

  // Sort by score descending
  allDoctrines.sort((a, b) => (b.score || 0) - (a.score || 0));

  return {
    doctrines: allDoctrines,
    total_matched: allDoctrines.length,
    engines_responded: enginesResponded,
    engines_failed: enginesFailed,
  };
}

// ---------------------------------------------------------------------------
// Strategy: chain — query sequentially, pass each top conclusion as context
// ---------------------------------------------------------------------------

async function executeChain(
  binding: Fetcher,
  engineIds: string[],
  query: string,
  mode: string,
): Promise<{
  stages: Array<{ engine_id: string; matched: number; top_conclusion: string | null }>;
  final_doctrines: any[];
  chain_context: string;
}> {
  const stages: Array<{ engine_id: string; matched: number; top_conclusion: string | null }> = [];
  let currentQuery = query;
  let chainContext = '';
  let lastDoctrines: any[] = [];

  for (const engineId of engineIds) {
    const fullQuery = chainContext ? `${currentQuery}\n\nContext from previous analysis: ${chainContext}` : currentQuery;

    try {
      const res = await proxyBinding<any>(binding, `/query/${engineId}`, {
        method: 'POST',
        body: { query: fullQuery, mode },
      });

      if (res.ok && res.data) {
        const data = res.data;
        const doctrines = data.doctrines || data.results || [];
        const topDoctrine = doctrines[0];
        const topConclusion = topDoctrine?.conclusion || topDoctrine?.content || null;

        stages.push({
          engine_id: engineId,
          matched: doctrines.length,
          top_conclusion: topConclusion ? topConclusion.slice(0, 500) : null,
        });

        if (topConclusion) {
          chainContext = topConclusion.slice(0, 500);
        }

        lastDoctrines = doctrines.map((d: any) => ({ ...d, source_engine: engineId }));
      } else {
        stages.push({ engine_id: engineId, matched: 0, top_conclusion: null });
      }
    } catch {
      stages.push({ engine_id: engineId, matched: 0, top_conclusion: null });
    }
  }

  return {
    stages,
    final_doctrines: lastDoctrines,
    chain_context: chainContext,
  };
}

// ---------------------------------------------------------------------------
// Strategy: vote — query all in parallel, group by topic, return majority topics
// ---------------------------------------------------------------------------

async function executeVote(
  binding: Fetcher,
  engineIds: string[],
  query: string,
  mode: string,
): Promise<{
  topics: Array<{ topic: string; votes: number; engines: string[]; avg_score: number; representative_conclusion: string }>;
  total_engines: number;
  engines_responded: number;
  majority_threshold: number;
}> {
  // Query all engines in parallel
  const results = await Promise.allSettled(
    engineIds.map(async (engineId) => {
      const res = await proxyBinding<any>(binding, `/query/${engineId}`, {
        method: 'POST',
        body: { query, mode },
      });
      return { engine_id: engineId, res };
    }),
  );

  // Collect all doctrines grouped by topic
  const topicVotes = new Map<
    string,
    {
      engines: string[];
      scores: number[];
      conclusions: string[];
    }
  >();

  let enginesResponded = 0;

  for (let i = 0; i < results.length; i++) {
    const settled = results[i];
    const engineId = engineIds[i];

    if (settled.status === 'fulfilled' && settled.value.res.ok && settled.value.res.data) {
      enginesResponded++;
      const data = settled.value.res.data;
      const doctrines = data.doctrines || data.results || [];

      for (const d of doctrines) {
        const topic = (d.topic || '').toLowerCase().trim();
        if (!topic) continue;

        if (!topicVotes.has(topic)) {
          topicVotes.set(topic, { engines: [], scores: [], conclusions: [] });
        }
        const entry = topicVotes.get(topic)!;
        if (!entry.engines.includes(engineId)) {
          entry.engines.push(engineId);
        }
        entry.scores.push(d.score || 0);
        if (d.conclusion) {
          entry.conclusions.push(d.conclusion);
        }
      }
    }
  }

  // Majority threshold = more than half of responding engines
  const majorityThreshold = Math.ceil(enginesResponded / 2);

  // Filter to topics that appear in majority of engines, sorted by vote count
  const votedTopics: Array<{
    topic: string;
    votes: number;
    engines: string[];
    avg_score: number;
    representative_conclusion: string;
  }> = [];

  for (const [topic, data] of topicVotes) {
    if (data.engines.length >= majorityThreshold) {
      const avgScore = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
      votedTopics.push({
        topic,
        votes: data.engines.length,
        engines: data.engines,
        avg_score: Math.round(avgScore * 1000) / 1000,
        representative_conclusion: data.conclusions[0] || '',
      });
    }
  }

  // Sort by votes descending, then by avg_score
  votedTopics.sort((a, b) => b.votes - a.votes || b.avg_score - a.avg_score);

  return {
    topics: votedTopics,
    total_engines: engineIds.length,
    engines_responded: enginesResponded,
    majority_threshold: majorityThreshold,
  };
}

export default compose;
