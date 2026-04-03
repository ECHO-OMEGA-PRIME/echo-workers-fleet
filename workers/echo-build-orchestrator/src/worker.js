/**
 * Echo Build Orchestrator v2.1.0 — HARDENED
 * Fixes: C36 (auth on all routes), C37 (error sanitization),
 *        H51 (SSRF validation), H52 (path traversal)
 *
 * This is a thin wrapper that adds auth to the original handler.
 * The original logic is preserved in originalWorker below.
 */

import { wrapWithAuth } from './auth-wrapper.js';

// ═══════════════════════════════════════════════════════════════
// ORIGINAL WORKER LOGIC (preserved from deployed version)
// Auth is now handled by the wrapper — removed duplicate auth in POST handler
// ═══════════════════════════════════════════════════════════════

function trackRequest(env, { path, method, status, durationMs, error }) {
  if (!env.ANALYTICS) return;
  try {
    env.ANALYTICS.writeDataPoint({
      indexes: ['echo-build-orchestrator'],
      blobs: [path || '/', method || 'GET', String(status || 200), error || ''],
      doubles: [durationMs || 0, status || 200],
    });
  } catch (_) {}
}

const originalWorker = {
  async scheduled(event, env, ctx) {
    const start = Date.now();
    ctx.waitUntil(
      orchestrate(env).then(() => {
        trackRequest(env, { path: '/cron/orchestrate', method: 'CRON', status: 200, durationMs: Date.now() - start });
      })
    );
  },

  async fetch(request, env, ctx) {
    const start = Date.now();
    const url = new URL(request.url);
    const path = url.pathname;

    // Body size limit already handled by wrapper

    if (path === '/health') {
      const status = await getFullStatus(env);
      return json({
        status: 'ok', service: 'echo-build-orchestrator', version: '2.1.0',
        timestamp: new Date().toISOString(), phase: status.phase || '1',
        progress: status.progress || {}, engine_status: status.engine_status || {},
      });
    }

    if (path === '/' || path === '/status') return json(await getFullStatus(env));
    if (path === '/engines') return json(await getEngines(env, url.searchParams.get('tier'), url.searchParams.get('status')));
    if (path.startsWith('/engine/')) return json(await getEngineDetail(env, path.split('/engine/')[1]));
    if (path === '/build/trigger' && request.method === 'POST') return json(await orchestrate(env));

    if (path === '/build/force' && request.method === 'POST') {
      const { engine_id } = await request.json().catch(() => ({}));
      if (!engine_id) return json({ error: 'engine_id required' }, 400);
      await env.BUILD_DB.prepare("UPDATE engines SET status='PLANNED', attempts=0, updated_at=datetime('now') WHERE engine_id=?").bind(engine_id).run();
      return json(await orchestrate(env));
    }

    if (path === '/build/complete' && request.method === 'POST') return json(await handleBuildComplete(env, await request.json().catch(() => ({}))));
    if (path === '/gates/report' && request.method === 'POST') return json(await handleGateResults(env, await request.json().catch(() => ({}))));
    if (path === '/phase/advance' && request.method === 'POST') return json(await advancePhase(env));
    if (path === '/pause' && request.method === 'POST') return json(await setState(env, 'mode', 'PAUSED'));
    if (path === '/resume' && request.method === 'POST') return json(await setState(env, 'mode', 'AUTONOMOUS'));
    if (path === '/log') return json(await getBuildLog(env, url.searchParams.get('limit') || 50));

    if (path === '/seed' && request.method === 'POST') {
      return json(await seedEngines(env, (await request.json().catch(() => ({}))).engines));
    }

    if (path === '/link-terminal' && request.method === 'POST') {
      const { endpoint } = await request.json().catch(() => ({}));
      // H51: URL validation done by wrapper
      await setState(env, 'claude_code_endpoint', endpoint);
      await log(env, null, null, 'TERMINAL_LINKED', `Linked: ${endpoint}`);
      return json({ linked: true, endpoint });
    }

    if (path === '/plan/upload' && request.method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const planId = `plan_${Date.now()}`;
      const r2Key = `plans/${planId}.md`;
      await env.BUILD_PLANS.put(r2Key, body.content);
      await env.BUILD_DB.prepare(
        'INSERT INTO build_plans (plan_id,plan_name,total_engines,total_tiers,status,r2_key) VALUES (?,?,?,?,?,?)'
      ).bind(planId, body.name || 'Unnamed Plan', body.total_engines || 0, body.total_tiers || 0, 'ACTIVE', r2Key).run();
      await setState(env, 'active_plan_id', planId);
      return json({ plan_id: planId, r2_key: r2Key, engines: body.total_engines, tiers: body.total_tiers });
    }

    if (path === '/plans') return json((await env.BUILD_DB.prepare('SELECT * FROM build_plans ORDER BY uploaded_at DESC').all()).results);

    if (path === '/plan/active') {
      const state = await getState(env);
      if (!state.active_plan_id) return json({ plan: null });
      return json({ plan: await env.BUILD_DB.prepare('SELECT * FROM build_plans WHERE plan_id=?').bind(state.active_plan_id).first() });
    }

    if (path === '/gates/define' && request.method === 'POST') {
      const g = await request.json().catch(() => ({}));
      await env.BUILD_DB.prepare(
        'INSERT OR REPLACE INTO gate_definitions (gate_id,gate_name,description,criteria,required_score,is_default) VALUES (?,?,?,?,?,0)'
      ).bind(g.gate_id, g.gate_name, g.description || '', g.criteria, g.required_score || 1).run();
      return json({ created: g.gate_id });
    }

    if (path === '/gates/definitions') return json((await env.BUILD_DB.prepare('SELECT * FROM gate_definitions ORDER BY is_default DESC, gate_id').all()).results);

    if (path.startsWith('/override/') && path.endsWith('/approve') && request.method === 'POST') {
      const engineId = path.split('/override/')[1].split('/approve')[0];
      const body = await request.json().catch(() => ({}));
      await env.BUILD_DB.prepare("UPDATE engines SET status='PASSED', completed_at=datetime('now'), updated_at=datetime('now') WHERE engine_id=?").bind(engineId).run();
      await env.BUILD_DB.prepare("INSERT INTO commander_overrides (engine_id,action,reason,source) VALUES (?,'APPROVE',?,?)").bind(engineId, body.reason || 'Commander override', body.source || 'ui').run();
      return json({ engine_id: engineId, status: 'PASSED', override: 'APPROVE' });
    }

    if (path.startsWith('/override/') && path.endsWith('/reject') && request.method === 'POST') {
      const engineId = path.split('/override/')[1].split('/reject')[0];
      const body = await request.json().catch(() => ({}));
      await env.BUILD_DB.prepare("UPDATE engines SET status='FAILED', updated_at=datetime('now') WHERE engine_id=?").bind(engineId).run();
      await env.BUILD_DB.prepare("INSERT INTO commander_overrides (engine_id,action,reason,source) VALUES (?,'REJECT',?,?)").bind(engineId, body.reason || 'Commander rejection', body.source || 'ui').run();
      return json({ engine_id: engineId, status: 'FAILED', override: 'REJECT' });
    }

    if (path.startsWith('/build/cloud/') && request.method === 'POST') {
      const engineId = path.split('/build/cloud/')[1];
      const engine = await env.BUILD_DB.prepare('SELECT * FROM engines WHERE engine_id=?').bind(engineId).first();
      if (!engine) return json({ error: `Engine ${engineId} not found` }, 404);
      if (!env.ANTHROPIC_API_KEY) return json({ error: 'ANTHROPIC_API_KEY not configured' }, 500);
      const spec = generateBuildSpec(engine);
      await env.BUILD_DB.prepare("UPDATE engines SET status='BUILDING', attempts=attempts+1, started_at=datetime('now'), updated_at=datetime('now') WHERE engine_id=?").bind(engineId).run();
      ctx.waitUntil(cloudBuild(env, engine, spec).catch(async (err) => {
        await env.BUILD_DB.prepare("UPDATE engines SET status='PLANNED', error_log=? WHERE engine_id=?").bind(err.message, engineId).run();
        await log(env, engineId, null, 'CLOUD_BUILD_FAILED', err.message);
      }));
      return json({ engine_id: engineId, status: 'BUILDING', mode: 'cloud' });
    }

    if (path === '/build/mode' && request.method === 'POST') {
      const { mode } = await request.json().catch(() => ({}));
      if (!['cloud', 'terminal'].includes(mode)) return json({ error: 'Mode must be cloud or terminal' }, 400);
      await setState(env, 'build_mode', mode);
      return json({ build_mode: mode });
    }

    if (path === '/build/mode' && request.method === 'GET') {
      const state = await getState(env);
      return json({ build_mode: state.build_mode || 'cloud', api_key_set: !!env.ANTHROPIC_API_KEY });
    }

    if (path.startsWith('/build/files/')) {
      const engineId = path.split('/build/files/')[1].toLowerCase();
      const listed = await env.BUILD_PLANS.list({ prefix: `engines/${engineId}/` });
      return json({ engine_id: engineId, files: listed.objects.map(o => ({ key: o.key, size: o.size })), count: listed.objects.length });
    }

    // H52: Path traversal check done by wrapper
    if (path.startsWith('/build/file/')) {
      const filePath = path.split('/build/file/')[1];
      const obj = await env.BUILD_PLANS.get(`engines/${filePath}`);
      if (!obj) return json({ error: 'File not found' }, 404);
      return new Response(obj.body, { headers: { 'Content-Type': 'text/plain' } });
    }

    if (path === '/alert/call' && request.method === 'POST') {
      const body = await request.json().catch(() => ({}));
      await log(env, body.engine_id || null, null, 'ALERT_CALL', body.message || 'Alert triggered');
      return json({ alert: 'dispatched' });
    }

    return json({ error: 'Not found' }, 404);
  },
};

// ═══════════════════════════════════════════════════════════════
// Helper functions (same as original, with error sanitization)
// ═══════════════════════════════════════════════════════════════

async function orchestrate(env) {
  const state = await getState(env);
  if (state.mode === 'PAUSED') return { status: 'PAUSED' };
  if (!state.claude_code_endpoint || state.claude_code_endpoint === 'PENDING_LINK') {
    return { status: 'NO_TERMINAL', message: 'POST /link-terminal {endpoint}' };
  }
  await setState(env, 'last_heartbeat', new Date().toISOString());
  await env.BUILD_DB.prepare("UPDATE build_phases SET started_at=datetime('now') WHERE phase_id=? AND status='ACTIVE' AND started_at IS NULL").bind(parseInt(state.current_phase)).run();
  const stale = await env.BUILD_DB.prepare("UPDATE engines SET status='PLANNED' WHERE status='BUILDING' AND started_at < datetime('now', '-30 minutes') RETURNING engine_id").all();
  if (stale.results?.length) {
    for (const s of stale.results) await log(env, s.engine_id, null, 'STALE_RESET', 'Auto-reset from BUILDING');
  }
  const building = await env.BUILD_DB.prepare("SELECT COUNT(*) as c FROM engines WHERE status='BUILDING'").first();
  const max = parseInt(state.max_concurrent_builds) || 3;
  const slots = max - (building?.c || 0);
  if (slots <= 0) return { status: 'BUSY', building: building.c, max };
  const candidates = await findBuildable(env, slots, state.current_phase);
  if (!candidates.length) {
    const done = await checkPhaseComplete(env, state.current_phase);
    if (done) {
      await log(env, null, state.current_phase, 'PHASE_COMPLETE', `Phase ${state.current_phase} done`);
      if (state.mode === 'AUTONOMOUS' && parseInt(state.current_phase) < 4) {
        const result = await advancePhase(env);
        return { status: 'AUTO_ADVANCED', from: state.current_phase, to: result.phase };
      }
      return { status: 'PHASE_COMPLETE', phase: state.current_phase };
    }
    return { status: 'WAITING' };
  }
  const dispatched = [];
  for (const e of candidates) dispatched.push(await dispatchBuild(env, e, state.claude_code_endpoint));
  return { status: 'DISPATCHED', count: dispatched.length, engines: dispatched.map(d => d.engine_id) };
}

async function findBuildable(env, limit, phase) {
  const minPriority = phase === '1' ? 80 : phase === '2' ? 60 : phase === '3' ? 40 : 0;
  const planned = await env.BUILD_DB.prepare('SELECT * FROM engines WHERE status=\'PLANNED\' AND priority >= ? ORDER BY priority DESC LIMIT 20').bind(minPriority).all();
  const buildable = [];
  for (const e of planned.results) {
    const deps = JSON.parse(e.depends_on || '[]');
    let met = true;
    for (const d of deps) {
      const dep = await env.BUILD_DB.prepare('SELECT status FROM engines WHERE engine_id=?').bind(d).first();
      if (!dep || !['PASSED', 'DEPLOYED'].includes(dep.status)) { met = false; break; }
    }
    if (met) { buildable.push(e); if (buildable.length >= limit) break; }
  }
  return buildable;
}

async function dispatchBuild(env, engine, endpoint) {
  const spec = generateBuildSpec(engine);
  await env.BUILD_DB.prepare("UPDATE engines SET status='BUILDING', build_spec=?, attempts=attempts+1, started_at=datetime('now'), updated_at=datetime('now') WHERE engine_id=?").bind(JSON.stringify(spec), engine.engine_id).run();
  await log(env, engine.engine_id, null, 'DISPATCHED', `Building ${engine.engine_id}. Attempt ${engine.attempts + 1}/${engine.max_attempts}`);
  const state = await getState(env);
  if ((state.build_mode || 'cloud') === 'cloud' && env.ANTHROPIC_API_KEY) {
    try {
      const result = await cloudBuild(env, engine, spec);
      return { engine_id: engine.engine_id, dispatched: true, mode: 'cloud', files: result.files_created };
    } catch (err) {
      await env.BUILD_DB.prepare("UPDATE engines SET status='PLANNED', error_log=? WHERE engine_id=?").bind(err.message, engine.engine_id).run();
      return { engine_id: engine.engine_id, dispatched: false, mode: 'cloud' };
    }
  } else {
    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Source': 'build-orchestrator' },
        body: JSON.stringify({ action: 'BUILD_ENGINE', engine_id: engine.engine_id, spec }),
      });
      return { engine_id: engine.engine_id, dispatched: true, mode: 'terminal' };
    } catch {
      await env.BUILD_DB.prepare("UPDATE engines SET status='PLANNED' WHERE engine_id=?").bind(engine.engine_id).run();
      return { engine_id: engine.engine_id, dispatched: false, mode: 'terminal' };
    }
  }
}

async function cloudBuild(env, engine, spec) {
  const eid = engine.engine_id;
  const eidLower = eid.toLowerCase();
  const prompt = generateCloudPrompt(engine, spec);
  await log(env, eid, null, 'CLOUD_BUILD_START', `Calling Anthropic API for ${eid}`);
  const apiResp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2025-04-14' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6', max_tokens: 64000,
      system: `You are an elite engine builder for ECHO OMEGA PRIME. Output ONLY code in fenced blocks with filenames.`,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!apiResp.ok) throw new Error(`Anthropic API ${apiResp.status}`);
  const apiData = await apiResp.json();
  const responseText = apiData.content?.map(b => b.text).join('\n') || '';
  const files = parseCodeBlocks(responseText, eidLower);
  if (!files.length) throw new Error('No code blocks in response');
  const filesCreated = [];
  for (const file of files) {
    const r2Key = `engines/${eidLower}/${file.filename}`;
    await env.BUILD_PLANS.put(r2Key, file.content);
    filesCreated.push({ filename: file.filename, r2_key: r2Key, lines: file.content.split('\n').length, bytes: file.content.length });
  }
  const totalLines = filesCreated.reduce((s, f) => s + f.lines, 0);
  const engineFile = filesCreated.find(f => f.filename.endsWith('_engine.py'));
  if (engineFile && engineFile.lines >= 500) {
    await env.BUILD_DB.prepare("UPDATE engines SET status='PASSED', build_output=?, completed_at=datetime('now'), updated_at=datetime('now') WHERE engine_id=?")
      .bind(JSON.stringify({ mode: 'cloud', files_created: filesCreated, total_lines: totalLines }), eid).run();
    const count = (await env.BUILD_DB.prepare("SELECT COUNT(*) as c FROM engines WHERE status IN ('PASSED','DEPLOYED')").first())?.c;
    await setState(env, 'engines_built', String(count || 0));
    await log(env, eid, null, 'CLOUD_BUILD_PASSED', `${eid} PASSED (${totalLines} lines). Progress: ${count}/875`);
  } else {
    await env.BUILD_DB.prepare("UPDATE engines SET status='PLANNED', build_output=? WHERE engine_id=?")
      .bind(JSON.stringify({ mode: 'cloud', files_created: filesCreated, total_lines: totalLines, reason: 'insufficient_lines' }), eid).run();
  }
  return { files_created: filesCreated, total_lines: totalLines };
}

function generateCloudPrompt(engine) {
  return `Build engine ${engine.engine_id} (${engine.engine_name}) for ECHO PRIME. Tier: ${engine.tier}. Output 4 files as fenced code blocks.`;
}

function parseCodeBlocks(text, eidLower) {
  const files = [];
  const blockRegex = /```(?:python|json|javascript|yaml)[:\s]+([^\n`]+)\n([\s\S]*?)```/g;
  let match;
  while ((match = blockRegex.exec(text)) !== null) {
    if (match[1]?.trim() && match[2]?.trim().length > 50) files.push({ filename: match[1].trim(), content: match[2].trim() });
  }
  return files;
}

function generateBuildSpec(engine) {
  return { engine_id: engine.engine_id, tier: engine.tier, engine_name: engine.engine_name, mode: engine.mode };
}

async function handleBuildComplete(env, body) {
  const { engine_id, success, output, files_created } = body;
  if (success) {
    await env.BUILD_DB.prepare("UPDATE engines SET status='TESTING', build_output=?, updated_at=datetime('now') WHERE engine_id=?").bind(JSON.stringify({ output, files_created }), engine_id).run();
    return { engine_id, status: 'TESTING' };
  }
  const e = await env.BUILD_DB.prepare('SELECT attempts, max_attempts FROM engines WHERE engine_id=?').bind(engine_id).first();
  if (e && e.attempts >= e.max_attempts) {
    await env.BUILD_DB.prepare("UPDATE engines SET status='FAILED', error_log=? WHERE engine_id=?").bind(JSON.stringify(output), engine_id).run();
    return { engine_id, status: 'FAILED' };
  }
  await env.BUILD_DB.prepare("UPDATE engines SET status='PLANNED', error_log=? WHERE engine_id=?").bind(JSON.stringify(output), engine_id).run();
  return { engine_id, status: 'RETRY' };
}

async function handleGateResults(env, body) {
  const { engine_id, gates } = body;
  for (const g of gates) {
    await env.BUILD_DB.prepare("INSERT INTO quality_gates (engine_id,gate_type,status,details,score,required_score,executed_at) VALUES (?,?,?,?,?,1.0,datetime('now'))")
      .bind(engine_id, g.type, g.passed ? 'PASSED' : 'FAILED', g.details || '', g.score || (g.passed ? 1 : 0)).run();
  }
  if (gates.every(g => g.passed)) {
    await env.BUILD_DB.prepare("UPDATE engines SET status='PASSED', gate_results=?, completed_at=datetime('now') WHERE engine_id=?").bind(JSON.stringify(gates), engine_id).run();
    const count = (await env.BUILD_DB.prepare("SELECT COUNT(*) as c FROM engines WHERE status IN ('PASSED','DEPLOYED')").first())?.c;
    await setState(env, 'engines_built', String(count || 0));
    return { engine_id, status: 'PASSED' };
  }
  await env.BUILD_DB.prepare("UPDATE engines SET status='PLANNED', gate_results=? WHERE engine_id=?").bind(JSON.stringify(gates), engine_id).run();
  return { engine_id, status: 'RETRY', failed_gates: gates.filter(g => !g.passed).map(g => g.type) };
}

async function advancePhase(env) {
  const state = await getState(env);
  const next = parseInt(state.current_phase) + 1;
  if (next > 4) return { error: 'Final phase reached' };
  await setState(env, 'current_phase', String(next));
  await env.BUILD_DB.prepare("UPDATE build_phases SET status='COMPLETED', completed_at=datetime('now') WHERE phase_id=?").bind(parseInt(state.current_phase)).run();
  await env.BUILD_DB.prepare("UPDATE build_phases SET status='ACTIVE', started_at=datetime('now') WHERE phase_id=?").bind(next).run();
  return { phase: next };
}

async function checkPhaseComplete(env, phase) {
  const min = phase === '1' ? 80 : phase === '2' ? 60 : phase === '3' ? 40 : 0;
  const r = await env.BUILD_DB.prepare("SELECT COUNT(*) as c FROM engines WHERE status NOT IN ('PASSED','DEPLOYED') AND priority >= ?").bind(min).first();
  return (r?.c || 0) === 0;
}

async function seedEngines(env, engines) {
  if (!Array.isArray(engines)) return { error: 'engines array required' };
  let ins = 0;
  for (const e of engines) {
    try {
      await env.BUILD_DB.prepare("INSERT OR IGNORE INTO engines (engine_id,tier,tier_name,engine_name,mode,authority_level,port,status,priority,depends_on) VALUES (?,?,?,?,?,?,?,'PLANNED',?,?)")
        .bind(e.engine_id, e.tier, e.tier_name, e.engine_name, e.mode, e.authority_level, e.port, e.priority || 50, JSON.stringify(e.depends_on || [])).run();
      ins++;
    } catch {}
  }
  return { inserted: ins, submitted: engines.length };
}

async function getState(env) {
  const rows = (await env.BUILD_DB.prepare('SELECT key,value FROM orchestrator_state').all()).results;
  const s = {};
  for (const r of rows) s[r.key] = r.value;
  return s;
}

async function setState(env, k, v) {
  await env.BUILD_DB.prepare("INSERT OR REPLACE INTO orchestrator_state (key,value,updated_at) VALUES (?,?,datetime('now'))").bind(k, v).run();
  return { [k]: v };
}

async function log(env, eid, pid, type, msg) {
  await env.BUILD_DB.prepare('INSERT INTO build_log (engine_id,phase_id,event_type,message) VALUES (?,?,?,?)').bind(eid, pid, type, msg).run();
}

async function getFullStatus(env) {
  const state = await getState(env);
  const counts = {};
  (await env.BUILD_DB.prepare('SELECT status, COUNT(*) as c FROM engines GROUP BY status').all()).results.forEach(r => counts[r.status] = r.c);
  return {
    system: 'ECHO PRIME BUILD ORCHESTRATOR v2.1.0', version: '2.1.0',
    mode: state.mode, phase: state.current_phase,
    progress: { total: parseInt(state.engines_total) || 875, built: parseInt(state.engines_built) || 0 },
    engine_status: counts,
  };
}

async function getEngines(env, tier, status) {
  let sql = 'SELECT engine_id,tier,tier_name,engine_name,mode,status,priority,attempts FROM engines WHERE 1=1';
  const p = [];
  if (tier) { sql += ' AND tier=?'; p.push(tier); }
  if (status) { sql += ' AND status=?'; p.push(status); }
  sql += ' ORDER BY priority DESC, engine_id';
  return (p.length ? await env.BUILD_DB.prepare(sql).bind(...p).all() : await env.BUILD_DB.prepare(sql).all()).results;
}

async function getEngineDetail(env, id) {
  return {
    engine: await env.BUILD_DB.prepare('SELECT * FROM engines WHERE engine_id=?').bind(id).first(),
    gates: (await env.BUILD_DB.prepare('SELECT * FROM quality_gates WHERE engine_id=? ORDER BY executed_at DESC').bind(id).all()).results,
    logs: (await env.BUILD_DB.prepare('SELECT * FROM build_log WHERE engine_id=? ORDER BY created_at DESC LIMIT 20').bind(id).all()).results,
  };
}

async function getBuildLog(env, limit) {
  return (await env.BUILD_DB.prepare('SELECT * FROM build_log ORDER BY created_at DESC LIMIT ?').bind(parseInt(limit)).all()).results;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), { status, headers: { 'Content-Type': 'application/json' } });
}

// ═══════════════════════════════════════════════════════════════
// EXPORT: Wrapped worker with auth on ALL routes
// ═══════════════════════════════════════════════════════════════

export default wrapWithAuth(originalWorker);
