/**
 * Echo SDK Gateway — AGI Autonomous Learning routes.
 *
 * Feedback collection, retrain triggers, learning-rate analytics,
 * and AGI-driven improvement suggestions.
 *
 * Routes:
 *   GET    /agi/status         — Current AGI learning state
 *   POST   /agi/feedback       — Rate engine output quality
 *   POST   /agi/retrain        — Trigger doctrine regeneration for an engine
 *   GET    /agi/learning-rate   — How fast the system improves
 *   GET    /agi/suggestions     — AGI-recommended improvements
 */

import { Hono } from 'hono';
import type { Env } from '../types';
import { success, error } from '../utils/envelope';
import { proxyBinding, log } from '../utils/proxy';

// ---------------------------------------------------------------------------
// D1 table bootstrap (idempotent)
// ---------------------------------------------------------------------------

const FEEDBACK_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS agi_feedback (
  id TEXT PRIMARY KEY,
  engine_id TEXT NOT NULL,
  query TEXT,
  quality_score REAL NOT NULL,
  feedback_text TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
`;

const RETRAINS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS agi_retrains (
  id TEXT PRIMARY KEY,
  engine_id TEXT NOT NULL,
  trigger_reason TEXT,
  old_score REAL,
  new_score REAL,
  doctrines_before INTEGER,
  doctrines_after INTEGER,
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT
);
`;

// L1 FIX: Cache table initialization
let tablesInitialized = false;
async function ensureTables(db: D1Database): Promise<void> {
  if (tablesInitialized) return;
  try {
    await db.exec(FEEDBACK_TABLE_SQL);
    await db.exec(RETRAINS_TABLE_SQL);
    tablesInitialized = true;
  } catch {
    tablesInitialized = true;
  }
}

function generateId(): string {
  return crypto.randomUUID();
}

// ---------------------------------------------------------------------------
// AGI route module
// ---------------------------------------------------------------------------

const agi = new Hono<{ Bindings: Env }>();

// ---------------------------------------------------------------------------
// GET /agi/status — Current AGI learning state
// ---------------------------------------------------------------------------
agi.get('/status', async (c) => {
  const version = c.env.WORKER_VERSION || '1.0.0';
  const start = Date.now();

  log('info', 'agi.status', 'Fetching AGI learning state');

  await ensureTables(c.env.DB);

  try {
    // Aggregate stats from agi_feedback
    const feedbackStats = await c.env.DB.prepare(
      'SELECT COUNT(*) as total_feedback, AVG(quality_score) as avg_quality, COUNT(DISTINCT engine_id) as engines_with_feedback FROM agi_feedback',
    ).first<{ total_feedback: number; avg_quality: number | null; engines_with_feedback: number }>();

    // Aggregate stats from agi_retrains
    const retrainStats = await c.env.DB.prepare(
      'SELECT COUNT(*) as total_retrains, COUNT(DISTINCT engine_id) as engines_retrained FROM agi_retrains',
    ).first<{ total_retrains: number; engines_retrained: number }>();

    // Count improved engines (retrains where new_score > old_score)
    const improvedStats = await c.env.DB.prepare(
      'SELECT COUNT(DISTINCT engine_id) as engines_improved FROM agi_retrains WHERE new_score > old_score AND status = ?',
    )
      .bind('complete')
      .first<{ engines_improved: number }>();

    // Last retrain timestamp
    const lastRetrain = await c.env.DB.prepare(
      'SELECT created_at FROM agi_retrains ORDER BY created_at DESC LIMIT 1',
    ).first<{ created_at: string }>();

    // Active retrains
    const activeRetrains = await c.env.DB.prepare(
      "SELECT COUNT(*) as active FROM agi_retrains WHERE status IN ('pending', 'running')",
    ).first<{ active: number }>();

    const latency_ms = Date.now() - start;
    log('info', 'agi.status', 'AGI status complete', { latency_ms });

    return c.json(
      success(
        {
          total_feedback: feedbackStats?.total_feedback || 0,
          avg_quality: feedbackStats?.avg_quality !== null ? Math.round((feedbackStats?.avg_quality || 0) * 1000) / 1000 : null,
          engines_with_feedback: feedbackStats?.engines_with_feedback || 0,
          total_retrains: retrainStats?.total_retrains || 0,
          engines_retrained: retrainStats?.engines_retrained || 0,
          engines_improved: improvedStats?.engines_improved || 0,
          active_retrains: activeRetrains?.active || 0,
          last_retrain: lastRetrain?.created_at || null,
        },
        version,
        latency_ms,
      ),
    );
  } catch (e) {
    const msg = String(e).slice(0, 200);
    log('error', 'agi.status', `Status query failed: ${msg}`);
    return c.json(error(`AGI status failed: ${msg}`, 'ECHO_AGI_ERROR', version, Date.now() - start), 500);
  }
});

// ---------------------------------------------------------------------------
// POST /agi/feedback — Rate engine output quality
// ---------------------------------------------------------------------------
agi.post('/feedback', async (c) => {
  const version = c.env.WORKER_VERSION || '1.0.0';
  const start = Date.now();

  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return c.json(error('Request body must be valid JSON', 'ECHO_INVALID_INPUT', version), 400);
  }

  const engineId = body.engine_id as string;
  const qualityScore = body.quality_score as number;
  const query = (body.query as string) || null;
  const feedbackText = (body.feedback_text as string) || null;

  if (!engineId) {
    return c.json(error("Missing required field 'engine_id'", 'ECHO_MISSING_FIELD', version), 400);
  }
  if (qualityScore === undefined || qualityScore === null || typeof qualityScore !== 'number') {
    return c.json(error("Missing or invalid 'quality_score' (must be number 0.0-1.0)", 'ECHO_MISSING_FIELD', version), 400);
  }
  if (qualityScore < 0 || qualityScore > 1) {
    return c.json(error("'quality_score' must be between 0.0 and 1.0", 'ECHO_INVALID_INPUT', version), 400);
  }

  log('info', 'agi.feedback', `Feedback for engine ${engineId}: score=${qualityScore}`, {
    engine_id: engineId,
    quality_score: qualityScore,
  });

  await ensureTables(c.env.DB);

  try {
    const feedbackId = generateId();

    await c.env.DB.prepare(
      'INSERT INTO agi_feedback (id, engine_id, query, quality_score, feedback_text) VALUES (?, ?, ?, ?, ?)',
    )
      .bind(feedbackId, engineId, query, qualityScore, feedbackText)
      .run();

    // Check if avg quality for this engine dropped below 0.5 — flag for retrain
    const avgRow = await c.env.DB.prepare(
      'SELECT AVG(quality_score) as avg_score, COUNT(*) as total FROM agi_feedback WHERE engine_id = ?',
    )
      .bind(engineId)
      .first<{ avg_score: number | null; total: number }>();

    let retrain_flagged = false;
    if (avgRow && avgRow.avg_score !== null && avgRow.avg_score < 0.5 && avgRow.total >= 3) {
      // Check if there's already a pending/running retrain for this engine
      const existingRetrain = await c.env.DB.prepare(
        "SELECT id FROM agi_retrains WHERE engine_id = ? AND status IN ('pending', 'running') LIMIT 1",
      )
        .bind(engineId)
        .first<{ id: string }>();

      if (!existingRetrain) {
        retrain_flagged = true;
        log('warn', 'agi.feedback', `Engine ${engineId} avg quality ${avgRow.avg_score.toFixed(3)} < 0.5 — flagged for retrain`, {
          engine_id: engineId,
          avg_score: avgRow.avg_score,
        });
      }
    }

    const latency_ms = Date.now() - start;

    return c.json(
      success(
        {
          id: feedbackId,
          engine_id: engineId,
          quality_score: qualityScore,
          avg_quality: avgRow?.avg_score !== null ? Math.round((avgRow?.avg_score || 0) * 1000) / 1000 : null,
          total_feedback_for_engine: avgRow?.total || 0,
          retrain_flagged,
        },
        version,
        latency_ms,
      ),
    );
  } catch (e) {
    const msg = String(e).slice(0, 200);
    log('error', 'agi.feedback', `Feedback insert failed: ${msg}`);
    return c.json(error(`Feedback failed: ${msg}`, 'ECHO_AGI_ERROR', version, Date.now() - start), 500);
  }
});

// ---------------------------------------------------------------------------
// POST /agi/retrain — Trigger doctrine regeneration for an engine
// ---------------------------------------------------------------------------
agi.post('/retrain', async (c) => {
  const version = c.env.WORKER_VERSION || '1.0.0';
  const start = Date.now();

  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return c.json(error('Request body must be valid JSON', 'ECHO_INVALID_INPUT', version), 400);
  }

  const engineId = body.engine_id as string;
  const reason = (body.reason as string) || 'manual retrain request';

  if (!engineId) {
    return c.json(error("Missing required field 'engine_id'", 'ECHO_MISSING_FIELD', version), 400);
  }

  log('info', 'agi.retrain', `Retrain triggered for engine ${engineId}`, { engine_id: engineId, reason });

  await ensureTables(c.env.DB);

  try {
    // 1. Check current avg quality score
    const avgRow = await c.env.DB.prepare(
      'SELECT AVG(quality_score) as avg_score, COUNT(*) as total FROM agi_feedback WHERE engine_id = ?',
    )
      .bind(engineId)
      .first<{ avg_score: number | null; total: number }>();

    const oldScore = avgRow?.avg_score !== null ? Math.round((avgRow?.avg_score || 0) * 1000) / 1000 : null;

    // 2. Get current doctrine count from ENGINE_RUNTIME
    let doctrinesBefore = 0;
    if (c.env.ENGINE_RUNTIME) {
      try {
        const statsRes = await proxyBinding<any>(c.env.ENGINE_RUNTIME, `/query/${engineId}`, {
          method: 'POST',
          body: { query: '*', mode: 'FAST' },
        });
        if (statsRes.ok && statsRes.data) {
          const d = statsRes.data;
          doctrinesBefore = d.matched_doctrines || (d.doctrines ? d.doctrines.length : 0);
        }
      } catch {
        log('warn', 'agi.retrain', 'Could not fetch current doctrine count from ENGINE_RUNTIME');
      }
    }

    // 3. Send retrain request to DOCTRINE_FORGE via service binding
    let forgeResult: any = null;
    let retrainStatus = 'pending';

    if (c.env.ECHO_DOCTRINE_FORGE) {
      log('info', 'agi.retrain', `Sending retrain request to DOCTRINE_FORGE for ${engineId}`);
      try {
        const forgeRes = await proxyBinding<any>(c.env.ECHO_DOCTRINE_FORGE, '/queue', {
          method: 'POST',
          body: {
            engine_id: engineId,
            action: 'retrain',
            reason,
            priority: 'high',
          },
        });

        forgeResult = forgeRes.data;
        retrainStatus = forgeRes.ok ? 'running' : 'failed';

        if (!forgeRes.ok) {
          log('warn', 'agi.retrain', `DOCTRINE_FORGE returned non-ok for retrain`, { status: forgeRes.status });
        }
      } catch (e) {
        log('warn', 'agi.retrain', `DOCTRINE_FORGE request failed: ${String(e).slice(0, 100)}`);
        retrainStatus = 'failed';
      }
    } else {
      log('warn', 'agi.retrain', 'ECHO_DOCTRINE_FORGE binding not available, recording as pending');
    }

    // 4. Record retrain in agi_retrains
    const retrainId = generateId();

    await c.env.DB.prepare(
      'INSERT INTO agi_retrains (id, engine_id, trigger_reason, old_score, doctrines_before, status) VALUES (?, ?, ?, ?, ?, ?)',
    )
      .bind(retrainId, engineId, reason, oldScore, doctrinesBefore, retrainStatus)
      .run();

    const latency_ms = Date.now() - start;
    log('info', 'agi.retrain', `Retrain recorded: ${engineId} status=${retrainStatus}`, { latency_ms });

    return c.json(
      success(
        {
          retrain_id: retrainId,
          engine_id: engineId,
          status: retrainStatus,
          old_score: oldScore,
          doctrines_before: doctrinesBefore,
          reason,
          forge_response: forgeResult,
        },
        version,
        latency_ms,
      ),
    );
  } catch (e) {
    const msg = String(e).slice(0, 200);
    log('error', 'agi.retrain', `Retrain failed: ${msg}`);
    return c.json(error(`Retrain failed: ${msg}`, 'ECHO_AGI_ERROR', version, Date.now() - start), 500);
  }
});

// ---------------------------------------------------------------------------
// GET /agi/learning-rate — How fast the system improves
// ---------------------------------------------------------------------------
agi.get('/learning-rate', async (c) => {
  const version = c.env.WORKER_VERSION || '1.0.0';
  const start = Date.now();

  log('info', 'agi.learning-rate', 'Calculating learning rate');

  await ensureTables(c.env.DB);

  try {
    // Current avg quality (last 7 days)
    const recentAvg = await c.env.DB.prepare(
      "SELECT AVG(quality_score) as avg_score FROM agi_feedback WHERE created_at >= datetime('now', '-7 days')",
    ).first<{ avg_score: number | null }>();

    // Avg quality 30 days ago window (30-37 days ago)
    const oldAvg = await c.env.DB.prepare(
      "SELECT AVG(quality_score) as avg_score FROM agi_feedback WHERE created_at >= datetime('now', '-37 days') AND created_at < datetime('now', '-30 days')",
    ).first<{ avg_score: number | null }>();

    // Overall avg
    const overallAvg = await c.env.DB.prepare(
      'SELECT AVG(quality_score) as avg_score FROM agi_feedback',
    ).first<{ avg_score: number | null }>();

    // Calculate improvement velocity
    const currentScore = recentAvg?.avg_score ?? null;
    const baselineScore = oldAvg?.avg_score ?? null;
    let dailyImprovement: number | null = null;
    let weeklyTrend: 'up' | 'down' | 'stable' | 'insufficient_data' = 'insufficient_data';

    if (currentScore !== null && baselineScore !== null) {
      dailyImprovement = Math.round(((currentScore - baselineScore) / 30) * 10000) / 10000;
      if (dailyImprovement > 0.001) {
        weeklyTrend = 'up';
      } else if (dailyImprovement < -0.001) {
        weeklyTrend = 'down';
      } else {
        weeklyTrend = 'stable';
      }
    }

    // Top improving engines (compare recent vs older feedback per engine)
    const engineScores = await c.env.DB.prepare(`
      SELECT
        engine_id,
        AVG(CASE WHEN created_at >= datetime('now', '-7 days') THEN quality_score ELSE NULL END) as recent_avg,
        AVG(CASE WHEN created_at < datetime('now', '-7 days') THEN quality_score ELSE NULL END) as older_avg,
        COUNT(*) as total_feedback
      FROM agi_feedback
      GROUP BY engine_id
      HAVING total_feedback >= 2
      ORDER BY (recent_avg - older_avg) DESC
      LIMIT 10
    `).all();

    const topImproving: any[] = [];
    const struggling: any[] = [];

    for (const row of (engineScores.results || []) as any[]) {
      const recentScore = row.recent_avg;
      const olderScore = row.older_avg;

      if (recentScore !== null && olderScore !== null) {
        const improvement = Math.round((recentScore - olderScore) * 1000) / 1000;
        const entry = {
          engine_id: row.engine_id,
          recent_avg: Math.round(recentScore * 1000) / 1000,
          older_avg: Math.round(olderScore * 1000) / 1000,
          improvement,
          total_feedback: row.total_feedback,
        };

        if (improvement > 0) {
          topImproving.push(entry);
        } else if (improvement < -0.05) {
          struggling.push(entry);
        }
      }
    }

    // Sort struggling by worst improvement (most negative first)
    struggling.sort((a, b) => a.improvement - b.improvement);

    const latency_ms = Date.now() - start;
    log('info', 'agi.learning-rate', 'Learning rate calculated', { latency_ms });

    return c.json(
      success(
        {
          daily_improvement: dailyImprovement,
          weekly_trend: weeklyTrend,
          current_avg_quality: currentScore !== null ? Math.round(currentScore * 1000) / 1000 : null,
          overall_avg_quality: overallAvg?.avg_score !== null ? Math.round((overallAvg?.avg_score || 0) * 1000) / 1000 : null,
          top_improving_engines: topImproving,
          struggling_engines: struggling,
        },
        version,
        latency_ms,
      ),
    );
  } catch (e) {
    const msg = String(e).slice(0, 200);
    log('error', 'agi.learning-rate', `Learning rate calculation failed: ${msg}`);
    return c.json(error(`Learning rate failed: ${msg}`, 'ECHO_AGI_ERROR', version, Date.now() - start), 500);
  }
});

// ---------------------------------------------------------------------------
// GET /agi/suggestions — AGI-recommended improvements
// ---------------------------------------------------------------------------
agi.get('/suggestions', async (c) => {
  const version = c.env.WORKER_VERSION || '1.0.0';
  const start = Date.now();

  log('info', 'agi.suggestions', 'Generating AGI improvement suggestions');

  await ensureTables(c.env.DB);

  try {
    const suggestions: Array<{
      engine_id: string;
      reason: string;
      current_score: number | null;
      feedback_count: number;
      recommended_action: string;
    }> = [];

    // 1. Engines with low quality scores
    const lowQuality = await c.env.DB.prepare(`
      SELECT engine_id, AVG(quality_score) as avg_score, COUNT(*) as feedback_count
      FROM agi_feedback
      GROUP BY engine_id
      HAVING avg_score < 0.5 AND feedback_count >= 3
      ORDER BY avg_score ASC
      LIMIT 20
    `).all();

    for (const row of (lowQuality.results || []) as any[]) {
      // Check if retrain already in progress
      const activeRetrain = await c.env.DB.prepare(
        "SELECT id FROM agi_retrains WHERE engine_id = ? AND status IN ('pending', 'running') LIMIT 1",
      )
        .bind(row.engine_id)
        .first<{ id: string }>();

      suggestions.push({
        engine_id: row.engine_id,
        reason: `Low average quality score (${Math.round(row.avg_score * 1000) / 1000}) across ${row.feedback_count} feedback entries`,
        current_score: Math.round(row.avg_score * 1000) / 1000,
        feedback_count: row.feedback_count,
        recommended_action: activeRetrain ? 'retrain_in_progress' : 'retrain',
      });
    }

    // 2. Engines with declining quality (recent worse than older)
    const declining = await c.env.DB.prepare(`
      SELECT
        engine_id,
        AVG(CASE WHEN created_at >= datetime('now', '-7 days') THEN quality_score ELSE NULL END) as recent_avg,
        AVG(CASE WHEN created_at < datetime('now', '-7 days') THEN quality_score ELSE NULL END) as older_avg,
        COUNT(*) as feedback_count
      FROM agi_feedback
      GROUP BY engine_id
      HAVING recent_avg IS NOT NULL AND older_avg IS NOT NULL AND recent_avg < older_avg - 0.1
      ORDER BY (recent_avg - older_avg) ASC
      LIMIT 10
    `).all();

    for (const row of (declining.results || []) as any[]) {
      const decline = Math.round((row.recent_avg - row.older_avg) * 1000) / 1000;
      // Avoid duplicates with low-quality list
      if (!suggestions.find((s) => s.engine_id === row.engine_id)) {
        suggestions.push({
          engine_id: row.engine_id,
          reason: `Quality declining: recent avg ${Math.round(row.recent_avg * 1000) / 1000} vs older avg ${Math.round(row.older_avg * 1000) / 1000} (${decline})`,
          current_score: Math.round(row.recent_avg * 1000) / 1000,
          feedback_count: row.feedback_count,
          recommended_action: 'retrain',
        });
      }
    }

    // 3. Engines with no recent feedback (potential blind spots)
    const stale = await c.env.DB.prepare(`
      SELECT engine_id, MAX(created_at) as last_feedback, COUNT(*) as feedback_count, AVG(quality_score) as avg_score
      FROM agi_feedback
      GROUP BY engine_id
      HAVING last_feedback < datetime('now', '-30 days')
      ORDER BY last_feedback ASC
      LIMIT 10
    `).all();

    for (const row of (stale.results || []) as any[]) {
      if (!suggestions.find((s) => s.engine_id === row.engine_id)) {
        suggestions.push({
          engine_id: row.engine_id,
          reason: `No feedback since ${row.last_feedback} — quality unknown`,
          current_score: row.avg_score !== null ? Math.round(row.avg_score * 1000) / 1000 : null,
          feedback_count: row.feedback_count,
          recommended_action: 'needs_evaluation',
        });
      }
    }

    // 4. Failed retrains that need attention
    const failedRetrains = await c.env.DB.prepare(
      "SELECT DISTINCT engine_id FROM agi_retrains WHERE status = 'failed' AND engine_id NOT IN (SELECT engine_id FROM agi_retrains WHERE status = 'complete' AND created_at > agi_retrains.created_at)",
    ).all();

    for (const row of (failedRetrains.results || []) as any[]) {
      if (!suggestions.find((s) => s.engine_id === row.engine_id)) {
        suggestions.push({
          engine_id: row.engine_id,
          reason: 'Previous retrain attempt failed',
          current_score: null,
          feedback_count: 0,
          recommended_action: 'retry_retrain',
        });
      }
    }

    const latency_ms = Date.now() - start;
    log('info', 'agi.suggestions', `Generated ${suggestions.length} suggestions`, { latency_ms });

    return c.json(
      success(
        {
          suggestions,
          total: suggestions.length,
          generated_at: new Date().toISOString(),
        },
        version,
        latency_ms,
      ),
    );
  } catch (e) {
    const msg = String(e).slice(0, 200);
    log('error', 'agi.suggestions', `Suggestions failed: ${msg}`);
    return c.json(error(`Suggestions failed: ${msg}`, 'ECHO_AGI_ERROR', version, Date.now() - start), 500);
  }
});

export default agi;
