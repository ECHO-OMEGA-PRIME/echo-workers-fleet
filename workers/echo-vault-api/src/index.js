/**
 * Echo Vault API v3.0.0 — HARDENED
 * Fixes: C6, C7, C8, C9, C10, H7-H13
 */

const ALLOWED_ORIGINS = [
  'https://echo-ept.com', 'https://www.echo-ept.com',
  'https://echo-op.com', 'https://www.echo-op.com',
];

// ── Security Helpers ────────────────────────────────────────────

function timingSafeEqual(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

function requireAuth(request, env) {
  const key = request.headers.get('X-Echo-API-Key');
  if (!env.API_KEY) return false; // C5-pattern: block all if key not configured
  return timingSafeEqual(key || '', env.API_KEY);
}

function getCorsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  // C10 FIX: Exact match only, no bypass for non-browser
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : '';
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Echo-API-Key, Authorization',
    'Vary': 'Origin',
  };
}

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains',
};

function json(data, status = 200, request = null) {
  const headers = { 'Content-Type': 'application/json', ...SECURITY_HEADERS };
  if (request) {
    const cors = getCorsHeaders(request);
    Object.assign(headers, cors);
  }
  return new Response(JSON.stringify(data), { status, headers });
}

function safeError(msg, status, request) {
  const ref = crypto.randomUUID().slice(0, 8);
  return json({ error: msg, reference: ref }, status, request);
}

function log(level, message, data = {}) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), level, worker: 'echo-vault-api', message, ...data }));
}

// ── Rate Limiter ────────────────────────────────────────────────

const rateBuckets = new Map();
function checkRateLimit(request, limit = 60) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const now = Date.now();
  let bucket = rateBuckets.get(ip);
  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 0, resetAt: now + 60000 };
    rateBuckets.set(ip, bucket);
  }
  bucket.count++;
  if (rateBuckets.size > 5000) {
    for (const [k, v] of rateBuckets) { if (now > v.resetAt) rateBuckets.delete(k); }
  }
  return bucket.count <= limit;
}

// ── Audit Logger ────────────────────────────────────────────────

async function auditLog(env, action, details) {
  try {
    await env.DB.prepare(
      `INSERT INTO vault_audit_log (action, details, timestamp) VALUES (?, ?, datetime('now'))`
    ).bind(action, JSON.stringify(details)).run();
  } catch { /* best effort */ }
}

// ── Main Handler ────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    const corsHeaders = getCorsHeaders(request);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Body size limit: 512KB
    if (['POST', 'PUT'].includes(request.method)) {
      const cl = parseInt(request.headers.get('Content-Length') || '0');
      if (cl > 524288) return safeError('Payload too large', 413, request);
    }

    // Rate limiting
    if (!checkRateLimit(request, 60)) {
      return json({ error: 'Rate limit exceeded' }, 429, request);
    }

    try {
      const response = await handleRequest(request, env);
      // Attach CORS + security headers to all responses
      const newResp = new Response(response.body, response);
      for (const [k, v] of Object.entries(corsHeaders)) newResp.headers.set(k, v);
      for (const [k, v] of Object.entries(SECURITY_HEADERS)) newResp.headers.set(k, v);
      return newResp;
    } catch (err) {
      const ref = crypto.randomUUID().slice(0, 8);
      log('error', 'Unhandled error', { ref, error: err?.message });
      return json({ error: 'Internal server error', reference: ref }, 500, request);
    }
  }
};

async function handleRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // ── Health (C8 FIX: no credential count leaked) ──
  if (path === '/health') {
    return json({ status: 'ok', version: '3.0.0', service: 'echo-master-vault' });
  }

  // ── Auth required for everything else ──
  if (!requireAuth(request, env)) {
    return json({ error: 'Unauthorized' }, 401);
  }

  // ── Ensure audit table exists ──
  if (path === '/init-audit' && method === 'POST') {
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS vault_audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL,
        details TEXT,
        timestamp TEXT DEFAULT (datetime('now'))
      )
    `).run();
    return json({ ok: true, message: 'Audit table initialized' });
  }

  // ── Store ──
  if (path === '/store' && method === 'POST') {
    const body = await request.json();
    if (!body.service) return json({ error: 'service is required' }, 400);
    const strength = scorePassword(body.password || body.api_key || '');
    const tags = Array.isArray(body.tags) ? body.tags.join(',') : (body.tags || '');
    await env.DB.prepare(`
      INSERT INTO credentials (service, username, password, api_key, notes, tags, category, strength)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(service, username) DO UPDATE SET
        password = COALESCE(excluded.password, password),
        api_key = COALESCE(excluded.api_key, api_key),
        notes = COALESCE(excluded.notes, notes),
        tags = COALESCE(excluded.tags, tags),
        category = COALESCE(excluded.category, category),
        strength = excluded.strength,
        updated_at = datetime('now')
    `).bind(body.service, body.username || '', body.password || '', body.api_key || '',
            body.notes || '', tags, body.category || 'general', strength).run();
    await auditLog(env, 'store', { service: body.service });
    return json({ stored: true, service: body.service });
  }

  // ── Get (H12 FIX: explicit columns, no SELECT *) ──
  if (path === '/get' && method === 'GET') {
    const service = url.searchParams.get('service');
    const id = url.searchParams.get('id');
    if (!id && !service) return json({ error: 'Provide ?service=xxx or ?id=123' }, 400);
    const cols = 'id, service, username, password, api_key, notes, tags, category, strength, created_at, updated_at';
    let row;
    if (id) {
      row = await env.DB.prepare(`SELECT ${cols} FROM credentials WHERE id = ?`).bind(id).first();
    } else {
      row = await env.DB.prepare(`SELECT ${cols} FROM credentials WHERE LOWER(service) = LOWER(?) ORDER BY updated_at DESC LIMIT 1`).bind(service).first();
    }
    if (!row) return json({ error: 'Not found' }, 404);
    return json(row);
  }

  // ── Search ──
  if (path === '/search' && method === 'GET') {
    const q = url.searchParams.get('q') || '';
    const category = url.searchParams.get('category');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50') || 50, 200);
    let sql = 'SELECT id, service, username, api_key, notes, tags, category, strength, created_at, updated_at FROM credentials WHERE 1=1';
    const params = [];
    if (q) {
      sql += ' AND (LOWER(service) LIKE ? OR LOWER(username) LIKE ? OR LOWER(notes) LIKE ? OR LOWER(tags) LIKE ?)';
      const term = `%${q.toLowerCase().replace(/[%_\\]/g, '\\$&')}%`;
      params.push(term, term, term, term);
    }
    if (category) {
      sql += ' AND LOWER(category) = LOWER(?)';
      params.push(category);
    }
    sql += ' ORDER BY updated_at DESC LIMIT ?';
    params.push(limit);
    const { results } = await env.DB.prepare(sql).bind(...params).all();
    return json({ results, total: results.length, query: q });
  }

  // ── List ──
  if (path === '/list' && method === 'GET') {
    const category = url.searchParams.get('category');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '100') || 100, 500);
    let sql = 'SELECT id, service, username, notes, tags, category, strength, updated_at FROM credentials';
    const params = [];
    if (category) { sql += ' WHERE LOWER(category) = LOWER(?)'; params.push(category); }
    sql += ' ORDER BY service ASC LIMIT ?';
    params.push(limit);
    const { results } = await env.DB.prepare(sql).bind(...params).all();
    return json({ credentials: results, total: results.length });
  }

  // ── Services ──
  if (path === '/services' && method === 'GET') {
    const { results } = await env.DB.prepare(
      'SELECT category, COUNT(*) as count FROM credentials GROUP BY category ORDER BY count DESC'
    ).all();
    return json({ categories: results });
  }

  // ── Delete (C9 FIX: confirm row existed, audit log) ──
  if (path === '/delete' && method === 'DELETE') {
    const id = url.searchParams.get('id');
    const service = url.searchParams.get('service');
    if (!id && !service) return json({ error: 'Provide ?id=123 or ?service=xxx' }, 400);
    let result;
    if (id) {
      result = await env.DB.prepare('DELETE FROM credentials WHERE id = ?').bind(id).run();
    } else {
      result = await env.DB.prepare('DELETE FROM credentials WHERE LOWER(service) = LOWER(?)').bind(service).run();
    }
    const deleted = result?.meta?.changes > 0;
    await auditLog(env, 'delete', { id, service, rows_deleted: result?.meta?.changes || 0 });
    if (!deleted) return json({ error: 'No matching credential found' }, 404);
    return json({ deleted: true, rows_affected: result.meta.changes });
  }

  // ── Bulk (H9 FIX: cap at 100 items) ──
  if (path === '/bulk' && method === 'POST') {
    const body = await request.json();
    if (!Array.isArray(body.credentials)) return json({ error: 'credentials array required' }, 400);
    if (body.credentials.length > 100) return json({ error: 'Max 100 credentials per bulk operation' }, 400);
    let stored = 0, errors = 0;
    for (const cred of body.credentials) {
      if (!cred.service) { errors++; continue; }
      try {
        const strength = scorePassword(cred.password || cred.api_key || '');
        const tags = Array.isArray(cred.tags) ? cred.tags.join(',') : (cred.tags || '');
        await env.DB.prepare(`
          INSERT INTO credentials (service, username, password, api_key, notes, tags, category, strength)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(service, username) DO UPDATE SET
            password = COALESCE(excluded.password, password),
            api_key = COALESCE(excluded.api_key, api_key),
            notes = COALESCE(excluded.notes, notes),
            tags = COALESCE(excluded.tags, tags),
            category = COALESCE(excluded.category, category),
            strength = excluded.strength, updated_at = datetime('now')
        `).bind(cred.service, cred.username || '', cred.password || '', cred.api_key || '',
                cred.notes || '', tags, cred.category || 'general', strength).run();
        stored++;
      } catch { errors++; }
    }
    await auditLog(env, 'bulk_store', { stored, errors });
    return json({ stored, errors, total: body.credentials.length });
  }

  // ── Stats ──
  if (path === '/stats' && method === 'GET') {
    const total = await env.DB.prepare('SELECT COUNT(*) as total FROM credentials').first();
    const cats = await env.DB.prepare('SELECT category, COUNT(*) as count FROM credentials GROUP BY category ORDER BY count DESC').all();
    const weak = await env.DB.prepare('SELECT COUNT(*) as c FROM credentials WHERE strength < 30').first();
    const strong = await env.DB.prepare('SELECT COUNT(*) as c FROM credentials WHERE strength >= 70').first();
    return json({ total: total?.total || 0, categories: cats?.results || [], weak_passwords: weak?.c || 0, strong_passwords: strong?.c || 0 });
  }

  // ── Export (C6 FIX: REMOVED full plaintext dump. Use /list + /get instead) ──
  // Export is deliberately removed. Use paginated /list for service names,
  // then /get for individual credentials when needed.

  // ── Import R2 (H8 FIX: limit and validate) ──
  if (path === '/import-r2' && method === 'POST') {
    const obj = await env.VAULT.get('SECURE_VAULT/found_credentials.txt');
    if (!obj) return json({ error: 'found_credentials.txt not found in R2' }, 404);
    const text = await obj.text();
    if (text.length > 5_000_000) return json({ error: 'Import file too large' }, 400);
    const creds = parseFoundCredentials(text);
    let stored = 0;
    for (const cred of creds.slice(0, 500)) { // Cap at 500
      if (!cred.service) continue;
      try {
        const strength = scorePassword(cred.password || '');
        await env.DB.prepare(`
          INSERT INTO credentials (service, username, password, notes, category, strength)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(service, username) DO UPDATE SET
            password = COALESCE(excluded.password, password),
            strength = excluded.strength, updated_at = datetime('now')
        `).bind(cred.service, cred.username || '', cred.password || '', '', 'imported', strength).run();
        stored++;
      } catch { /* skip */ }
    }
    await auditLog(env, 'import_r2', { stored, total_found: creds.length });
    return json({ imported: stored, total_found: creds.length });
  }

  // ── Audit Log ──
  if (path === '/audit' && method === 'GET') {
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50') || 50, 200);
    try {
      const { results } = await env.DB.prepare(
        'SELECT * FROM vault_audit_log ORDER BY timestamp DESC LIMIT ?'
      ).bind(limit).all();
      return json({ audit: results });
    } catch {
      return json({ audit: [], note: 'Audit table may not exist. POST /init-audit to create.' });
    }
  }

  return json({ error: 'Not found' }, 404);
}

function scorePassword(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s += 20;
  if (pw.length >= 12) s += 10;
  if (pw.length >= 16) s += 10;
  if (pw.length >= 20) s += 10;
  if (/[a-z]/.test(pw)) s += 10;
  if (/[A-Z]/.test(pw)) s += 10;
  if (/[0-9]/.test(pw)) s += 10;
  if (/[^a-zA-Z0-9]/.test(pw)) s += 20;
  return Math.min(s, 100);
}

function parseFoundCredentials(text) {
  const creds = [];
  const lines = text.split('\n');
  let current = {};
  for (const line of lines) {
    const t = line.trim();
    if (/^(Service|URL|url|service):/i.test(t)) {
      if (current.service) creds.push({ ...current });
      current = { service: t.split(':').slice(1).join(':').trim(), username: '', password: '' };
    } else if (/^(Username|User|Email|Login):/i.test(t)) {
      current.username = t.split(':').slice(1).join(':').trim();
    } else if (/^(Password|Pass|Key|Token|Secret):/i.test(t)) {
      current.password = t.split(':').slice(1).join(':').trim();
    } else if (t === '---' || t === '===') {
      if (current.service) { creds.push({ ...current }); current = {}; }
    }
  }
  if (current.service) creds.push({ ...current });
  return creds;
}
