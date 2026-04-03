/**
 * Echo SDK Gateway — Engine Versioning & Rollback routes.
 *
 * Snapshot engine doctrine state, list versions, diff between versions,
 * and rollback to any prior snapshot.
 *
 * Routes:
 *   GET    /engine/:id/versions         — List all versions of an engine
 *   POST   /engine/:id/snapshot         — Create a version snapshot
 *   POST   /engine/:id/rollback/:ver    — Rollback to a specific version
 *   GET    /engine/:id/diff/:v1/:v2     — Diff between two versions
 */

import { Hono } from 'hono';
import type { Env } from '../types';
import { success, error } from '../utils/envelope';
import { proxyBinding, log } from '../utils/proxy';

// ---------------------------------------------------------------------------
// D1 table bootstrap (idempotent — runs on first request)
// ---------------------------------------------------------------------------

const TABLE_SQL = `
CREATE TABLE IF NOT EXISTS engine_versions (
  id TEXT PRIMARY KEY,
  engine_id TEXT NOT NULL,
  version TEXT NOT NULL,
  doctrines_snapshot TEXT,
  doctrines_count INTEGER,
  metadata TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(engine_id, version)
);
`;

async function ensureTable(db: D1Database): Promise<void> {
  try {
    await db.exec(TABLE_SQL);
  } catch {
    // table already exists or DB not available — non-fatal
  }
}

// ---------------------------------------------------------------------------
// Semver helpers
// ---------------------------------------------------------------------------

function parseSemver(v: string): [number, number, number] {
  const parts = v.replace(/^v/, '').split('.').map(Number);
  return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
}

function bumpPatch(v: string): string {
  const [major, minor, patch] = parseSemver(v);
  return `${major}.${minor}.${patch + 1}`;
}

function generateId(): string {
  return crypto.randomUUID();
}

// ---------------------------------------------------------------------------
// Versioning route module
// ---------------------------------------------------------------------------

const versioning = new Hono<{ Bindings: Env }>();

// ---------------------------------------------------------------------------
// GET /engine/:id/versions — List all versions of an engine
// ---------------------------------------------------------------------------
versioning.get('/engine/:id/versions', async (c) => {
  const version = c.env.WORKER_VERSION || '1.0.0';
  const start = Date.now();
  const engineId = c.req.param('id');

  log('info', 'versioning.list', `Listing versions for engine ${engineId}`, { engine_id: engineId });

  await ensureTable(c.env.DB);

  try {
    const result = await c.env.DB.prepare(
      'SELECT id, engine_id, version, doctrines_count, metadata, created_at FROM engine_versions WHERE engine_id = ? ORDER BY created_at DESC',
    )
      .bind(engineId)
      .all();

    const versions = (result.results || []).map((row: any) => ({
      id: row.id,
      engine_id: row.engine_id,
      version: row.version,
      doctrines_count: row.doctrines_count,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
      created_at: row.created_at,
    }));

    const latency_ms = Date.now() - start;
    log('info', 'versioning.list', `Found ${versions.length} versions for ${engineId}`, { latency_ms });

    return c.json(
      success(
        {
          engine_id: engineId,
          versions,
          total: versions.length,
        },
        version,
        latency_ms,
      ),
    );
  } catch (e) {
    const msg = String(e).slice(0, 200);
    log('error', 'versioning.list', `Failed to list versions: ${msg}`);
    return c.json(error(`Failed to list versions: ${msg}`, 'ECHO_VERSIONING_ERROR', version, Date.now() - start), 500);
  }
});

// ---------------------------------------------------------------------------
// POST /engine/:id/snapshot — Create a version snapshot
// ---------------------------------------------------------------------------
versioning.post('/engine/:id/snapshot', async (c) => {
  const version = c.env.WORKER_VERSION || '1.0.0';
  const start = Date.now();
  const engineId = c.req.param('id');

  log('info', 'versioning.snapshot', `Creating snapshot for engine ${engineId}`, { engine_id: engineId });

  await ensureTable(c.env.DB);

  // Parse optional body for metadata
  let body: Record<string, unknown> = {};
  try {
    body = await c.req.json();
  } catch {
    // empty body is fine
  }

  try {
    // 1. Fetch current engine doctrines from ENGINE_RUNTIME via service binding
    let doctrines: unknown[] = [];
    let fetchOk = false;

    if (c.env.ENGINE_RUNTIME) {
      log('debug', 'versioning.snapshot', `Fetching doctrines from ENGINE_RUNTIME for ${engineId}`);
      const res = await proxyBinding<any>(c.env.ENGINE_RUNTIME, `/query/${engineId}`, {
        method: 'POST',
        body: { query: '*', mode: 'FAST' },
      });

      if (res.ok && res.data) {
        const data = typeof res.data === 'object' ? res.data : {};
        doctrines = data.doctrines || data.results || [];
        fetchOk = true;
        log('info', 'versioning.snapshot', `Fetched ${doctrines.length} doctrines from ENGINE_RUNTIME`);
      } else {
        log('warn', 'versioning.snapshot', `ENGINE_RUNTIME returned non-ok for ${engineId}`, { status: res.status });
      }
    }

    if (!fetchOk) {
      return c.json(
        error(
          `Could not fetch doctrines for engine '${engineId}'. Engine may not exist or runtime unavailable.`,
          'ECHO_ENGINE_NOT_FOUND',
          version,
          Date.now() - start,
        ),
        404,
      );
    }

    // 2. Auto-increment version
    const latestRow = await c.env.DB.prepare(
      'SELECT version FROM engine_versions WHERE engine_id = ? ORDER BY created_at DESC LIMIT 1',
    )
      .bind(engineId)
      .first<{ version: string }>();

    const latestVersion = latestRow?.version || '0.0.0';
    const newVersion = bumpPatch(latestVersion);

    // 3. Build metadata
    const metadata = {
      created_by: (body.created_by as string) || 'sdk-gateway',
      reason: (body.reason as string) || 'manual snapshot',
      changes_summary: (body.changes_summary as string) || null,
      previous_version: latestVersion === '0.0.0' ? null : latestVersion,
    };

    // 4. Store snapshot in D1
    const snapshotId = generateId();

    await c.env.DB.prepare(
      'INSERT INTO engine_versions (id, engine_id, version, doctrines_snapshot, doctrines_count, metadata) VALUES (?, ?, ?, ?, ?, ?)',
    )
      .bind(
        snapshotId,
        engineId,
        newVersion,
        JSON.stringify(doctrines),
        doctrines.length,
        JSON.stringify(metadata),
      )
      .run();

    const latency_ms = Date.now() - start;
    log('info', 'versioning.snapshot', `Snapshot created: ${engineId} v${newVersion} (${doctrines.length} doctrines)`, {
      latency_ms,
    });

    return c.json(
      success(
        {
          id: snapshotId,
          engine_id: engineId,
          version: newVersion,
          doctrines_count: doctrines.length,
          metadata,
          created_at: new Date().toISOString(),
        },
        version,
        latency_ms,
      ),
    );
  } catch (e) {
    const msg = String(e).slice(0, 200);
    log('error', 'versioning.snapshot', `Snapshot failed: ${msg}`);
    return c.json(error(`Snapshot failed: ${msg}`, 'ECHO_VERSIONING_ERROR', version, Date.now() - start), 500);
  }
});

// ---------------------------------------------------------------------------
// POST /engine/:id/rollback/:ver — Rollback to a specific version
// ---------------------------------------------------------------------------
versioning.post('/engine/:id/rollback/:ver', async (c) => {
  const version = c.env.WORKER_VERSION || '1.0.0';
  const start = Date.now();
  const engineId = c.req.param('id');
  const targetVersion = c.req.param('ver');

  log('info', 'versioning.rollback', `Rolling back ${engineId} to v${targetVersion}`, {
    engine_id: engineId,
    target_version: targetVersion,
  });

  await ensureTable(c.env.DB);

  try {
    // 1. Find the target version snapshot
    const snapshot = await c.env.DB.prepare(
      'SELECT id, doctrines_snapshot, doctrines_count, metadata FROM engine_versions WHERE engine_id = ? AND version = ?',
    )
      .bind(engineId, targetVersion)
      .first<{ id: string; doctrines_snapshot: string; doctrines_count: number; metadata: string }>();

    if (!snapshot) {
      return c.json(
        error(
          `Version '${targetVersion}' not found for engine '${engineId}'`,
          'ECHO_VERSION_NOT_FOUND',
          version,
          Date.now() - start,
        ),
        404,
      );
    }

    const doctrines = JSON.parse(snapshot.doctrines_snapshot || '[]');

    // 2. POST the doctrines back to ENGINE_RUNTIME via /ingest/:engineId
    if (!c.env.ENGINE_RUNTIME) {
      return c.json(
        error('ENGINE_RUNTIME service binding unavailable', 'ECHO_BINDING_MISSING', version, Date.now() - start),
        503,
      );
    }

    const ingestRes = await proxyBinding<any>(c.env.ENGINE_RUNTIME, `/ingest/${engineId}`, {
      method: 'POST',
      body: { doctrines, replace: true },
    });

    if (!ingestRes.ok) {
      log('warn', 'versioning.rollback', `ENGINE_RUNTIME ingest failed for rollback`, {
        status: ingestRes.status,
      });
      return c.json(
        error(
          `Rollback ingest failed (ENGINE_RUNTIME returned ${ingestRes.status})`,
          'ECHO_ROLLBACK_FAILED',
          version,
          Date.now() - start,
        ),
        502,
      );
    }

    // 3. Record the rollback event as a new snapshot
    const latestRow = await c.env.DB.prepare(
      'SELECT version FROM engine_versions WHERE engine_id = ? ORDER BY created_at DESC LIMIT 1',
    )
      .bind(engineId)
      .first<{ version: string }>();

    const currentVersion = latestRow?.version || '0.0.0';
    const newVersion = bumpPatch(currentVersion);

    const rollbackMetadata = {
      created_by: 'sdk-gateway',
      reason: `rollback to v${targetVersion}`,
      changes_summary: `Rolled back from v${currentVersion} to v${targetVersion}`,
      rollback_from: currentVersion,
      rollback_to: targetVersion,
      rollback_snapshot_id: snapshot.id,
    };

    const rollbackId = generateId();
    await c.env.DB.prepare(
      'INSERT INTO engine_versions (id, engine_id, version, doctrines_snapshot, doctrines_count, metadata) VALUES (?, ?, ?, ?, ?, ?)',
    )
      .bind(
        rollbackId,
        engineId,
        newVersion,
        snapshot.doctrines_snapshot,
        snapshot.doctrines_count,
        JSON.stringify(rollbackMetadata),
      )
      .run();

    const latency_ms = Date.now() - start;
    log('info', 'versioning.rollback', `Rollback complete: ${engineId} v${currentVersion} -> v${targetVersion} (recorded as v${newVersion})`, {
      latency_ms,
    });

    return c.json(
      success(
        {
          engine_id: engineId,
          rolled_back_from: currentVersion,
          rolled_back_to: targetVersion,
          new_version: newVersion,
          doctrines_restored: snapshot.doctrines_count,
          rollback_snapshot_id: rollbackId,
          ingest_result: ingestRes.data,
        },
        version,
        latency_ms,
      ),
    );
  } catch (e) {
    const msg = String(e).slice(0, 200);
    log('error', 'versioning.rollback', `Rollback failed: ${msg}`);
    return c.json(error(`Rollback failed: ${msg}`, 'ECHO_VERSIONING_ERROR', version, Date.now() - start), 500);
  }
});

// ---------------------------------------------------------------------------
// GET /engine/:id/diff/:v1/:v2 — Diff between two versions
// ---------------------------------------------------------------------------
versioning.get('/engine/:id/diff/:v1/:v2', async (c) => {
  const version = c.env.WORKER_VERSION || '1.0.0';
  const start = Date.now();
  const engineId = c.req.param('id');
  const v1 = c.req.param('v1');
  const v2 = c.req.param('v2');

  log('info', 'versioning.diff', `Diffing ${engineId} v${v1} vs v${v2}`, {
    engine_id: engineId,
    v1,
    v2,
  });

  await ensureTable(c.env.DB);

  try {
    // 1. Load both version snapshots
    const [snap1, snap2] = await Promise.all([
      c.env.DB.prepare(
        'SELECT id, version, doctrines_snapshot, doctrines_count, created_at FROM engine_versions WHERE engine_id = ? AND version = ?',
      )
        .bind(engineId, v1)
        .first<{ id: string; version: string; doctrines_snapshot: string; doctrines_count: number; created_at: string }>(),
      c.env.DB.prepare(
        'SELECT id, version, doctrines_snapshot, doctrines_count, created_at FROM engine_versions WHERE engine_id = ? AND version = ?',
      )
        .bind(engineId, v2)
        .first<{ id: string; version: string; doctrines_snapshot: string; doctrines_count: number; created_at: string }>(),
    ]);

    if (!snap1) {
      return c.json(
        error(`Version '${v1}' not found for engine '${engineId}'`, 'ECHO_VERSION_NOT_FOUND', version, Date.now() - start),
        404,
      );
    }
    if (!snap2) {
      return c.json(
        error(`Version '${v2}' not found for engine '${engineId}'`, 'ECHO_VERSION_NOT_FOUND', version, Date.now() - start),
        404,
      );
    }

    // 2. Parse doctrines
    const doctrines1: any[] = JSON.parse(snap1.doctrines_snapshot || '[]');
    const doctrines2: any[] = JSON.parse(snap2.doctrines_snapshot || '[]');

    // Build topic maps for comparison
    const topicMap1 = new Map<string, any>();
    for (const d of doctrines1) {
      const key = d.topic || d.id || JSON.stringify(d).slice(0, 100);
      topicMap1.set(key, d);
    }

    const topicMap2 = new Map<string, any>();
    for (const d of doctrines2) {
      const key = d.topic || d.id || JSON.stringify(d).slice(0, 100);
      topicMap2.set(key, d);
    }

    // 3. Compare doctrines: added, removed, modified
    const added: any[] = [];
    const removed: any[] = [];
    const modified: any[] = [];

    // Doctrines in v2 but not in v1 = added
    // Doctrines in both but different = modified
    for (const [key, d2] of topicMap2) {
      if (!topicMap1.has(key)) {
        added.push({ topic: key, doctrine: d2 });
      } else {
        const d1 = topicMap1.get(key);
        // Compare conclusions/content
        const c1 = d1.conclusion || d1.content || '';
        const c2 = d2.conclusion || d2.content || '';
        if (c1 !== c2) {
          modified.push({
            topic: key,
            v1_conclusion: c1,
            v2_conclusion: c2,
            v1_confidence: d1.confidence,
            v2_confidence: d2.confidence,
          });
        }
      }
    }

    // Doctrines in v1 but not in v2 = removed
    for (const [key, d1] of topicMap1) {
      if (!topicMap2.has(key)) {
        removed.push({ topic: key, doctrine: d1 });
      }
    }

    const latency_ms = Date.now() - start;
    log('info', 'versioning.diff', `Diff complete: +${added.length} -${removed.length} ~${modified.length}`, {
      latency_ms,
    });

    return c.json(
      success(
        {
          engine_id: engineId,
          v1: {
            version: v1,
            doctrines_count: snap1.doctrines_count,
            created_at: snap1.created_at,
          },
          v2: {
            version: v2,
            doctrines_count: snap2.doctrines_count,
            created_at: snap2.created_at,
          },
          added,
          removed,
          modified,
          stats: {
            added: added.length,
            removed: removed.length,
            modified: modified.length,
          },
        },
        version,
        latency_ms,
      ),
    );
  } catch (e) {
    const msg = String(e).slice(0, 200);
    log('error', 'versioning.diff', `Diff failed: ${msg}`);
    return c.json(error(`Diff failed: ${msg}`, 'ECHO_VERSIONING_ERROR', version, Date.now() - start), 500);
  }
});

export default versioning;
