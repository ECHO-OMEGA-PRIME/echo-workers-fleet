// OmniSync Worker v4.5.0 - Security Hardened
// Fixes: C41 (rate limit all methods), C42 (vault content validation), H55 (auth on all routes)

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Session-ID, X-Echo-API-Key",
  "Content-Type": "application/json"
};

// ============================================================
// [H55 FIX] Auth middleware - checks X-Echo-API-Key on ALL routes except /health
// ============================================================
function authenticate(request, env) {
  const key = request.headers.get("X-Echo-API-Key");
  if (!env.ECHO_API_KEY || key === env.ECHO_API_KEY) return null;
  return jsonResponse({ error: "Unauthorized", message: "Valid X-Echo-API-Key header required" }, 401);
}

// ============================================================
// [C41 FIX] Rate limiting applied to ALL methods, not just GETs
// ============================================================
async function checkRateLimit(ip, kv, limit = 60, windowSeconds = 60) {
  const bucket = `rl:${ip}:${Math.floor(Date.now() / (windowSeconds * 1000))}`;
  const count = parseInt(await kv.get(bucket) || "0");
  if (count >= limit) return { allowed: false, remaining: 0 };
  await kv.put(bucket, String(count + 1), { expirationTtl: windowSeconds * 2 });
  return { allowed: true, remaining: limit - count - 1 };
}

// ============================================================
// [C42 FIX] Vault content validation helpers
// ============================================================
const MAX_VAULT_VALUE_SIZE = 100 * 1024; // 100KB

function hasPathTraversal(key) {
  if (!key || typeof key !== 'string') return true;
  // Block .., //, leading /, backslashes, null bytes
  if (key.includes('..')) return true;
  if (key.includes('//')) return true;
  if (key.startsWith('/')) return true;
  if (key.includes('\\')) return true;
  if (key.includes('\0')) return true;
  return false;
}

function validateVaultStore(request, body) {
  // Ensure content-type is application/json
  const contentType = request.headers.get("Content-Type") || "";
  if (!contentType.includes("application/json")) {
    return errorResponse("Content-Type must be application/json for vault storage", 415);
  }

  // Validate key doesn't contain path traversal
  const key = body.key;
  if (!key || hasPathTraversal(key)) {
    return errorResponse("Invalid key: must not contain path traversal characters (.., //, leading /, backslashes)", 400);
  }

  // Validate value size (serialize to check actual size)
  const dataStr = typeof body.data === 'string' ? body.data : JSON.stringify(body.data || {});
  if (dataStr.length > MAX_VAULT_VALUE_SIZE) {
    return errorResponse(`Value too large: ${dataStr.length} bytes exceeds ${MAX_VAULT_VALUE_SIZE} byte limit`, 413);
  }

  return null; // Validation passed
}

// ============================================================
// KV Keys
// ============================================================
const KV_KEYS = {
  SESSIONS: "omniscient:sessions",
  TODOS: "omniscient:todos",
  TODO_COUNTER: "omniscient:todo_counter",
  BROADCASTS: "omniscient:broadcasts",
  POLICIES: "omniscient:policies",
  MEMORIES: "omniscient:memories",
  CONTEXT: "omniscient:context"
};

// ============================================================
// Hardcoded Policies
// ============================================================
const HARDCODED_POLICIES = {
  DEBUG_LOGGING_POLICY: {
    id: "DEBUG_LOGGING_POLICY",
    name: "Debug and Logging Policy (5-Step Incident Protocol)",
    enforcement: "ABSOLUTE",
    steps: ["CHECK LOGS FIRST", "REPORT & DEBUG", "ENHANCE/UPGRADE/HARDEN", "REPORT WITH TIMESTAMPS", "TEST & MONITOR"]
  },
  APP_RELEASE_POLICY: {
    id: "APP_RELEASE_POLICY",
    name: "App Release Policy",
    enforcement: "MANDATORY",
    gates: ["SYNC", "BUILD", "TEST", "DOCUMENT", "FINAL_TEST", "FINAL_DOCUMENT", "SUBMIT"]
  },
  BLOODLINE_DIRECTIVE: {
    id: "BLOODLINE_DIRECTIVE",
    name: "Bloodline Prime Directive",
    enforcement: "ABSOLUTE",
    commander: "Bobby Don McWilliams II",
    authority: 11
  },
  NO_PLACEHOLDERS_POLICY: {
    id: "NO_PLACEHOLDERS_POLICY",
    enforcement: "ZERO_TOLERANCE",
    banned: ["TODO", "pass", "...", "NotImplementedError", "Mock()", "coming soon"]
  },
  SECURITY_POLICY: {
    id: "SECURITY_POLICY",
    enforcement: "MANDATORY",
    rules: ["No hardcoded secrets", "Use credential vault", "Run security validator"]
  },
  BUILD_STANDARDS: {
    id: "BUILD_STANDARDS",
    enforcement: "REQUIRED",
    python: ["Use loguru", "Use pathlib", "Type hints", "Python 3.11+", "FastAPI", "Async"]
  },
  INFRASTRUCTURE_POLICY: {
    id: "INFRASTRUCTURE_POLICY",
    approved: ["Firebase", "Cloud Run", "Vercel", "Cloudflare"],
    banned: ["Railway", "Supabase", "Auth0"]
  },
  PRE_BUILD_VALIDATION: {
    id: "PRE_BUILD_VALIDATION",
    enforcement: "MANDATORY",
    rule: "NEVER overwrite code without validation"
  },
  TIMEOUT_POLICY: {
    id: "TIMEOUT_POLICY",
    limits: { http: 30, file: 60, build: 300, deploy: 600 }
  },
  SHADOWGLASS_V8_POLICY: {
    id: "SHADOWGLASS_V8_POLICY",
    name: "ShadowGlass v8.1.1 — Mandatory Scraping & Document Intelligence Tool",
    enforcement: "MANDATORY",
    effective_date: "2026-02-08",
    worker_url: "https://shadowglass-v8-warpspeed.bmcii1976.workers.dev",
    rules: [
      "ALL county scraping MUST use ShadowGlass v8.1.1 Worker — no local scripts, no tunnel relay",
      "ALL PDFs stored in R2: ENCORE/TYLER/{county}/{type}/docs/{docId}.pdf",
      "ALL documents auto-flow through Document Intelligence Pipeline on upload",
      "Search metadata is PRIMARY entity source for scanned PDFs",
      "Browser Rendering OCR DISABLED for PDFs — headless Chrome cannot render PDFs",
      "NEVER send Accept-Encoding in Workers fetch() — causes double-encoding",
      "Native PDF text requires >70% printable ASCII ratio before trusting",
      "Supersedes ALL previous ShadowGlass versions and local ENCORE scraper"
    ],
    key_endpoints: {
      fetch_pdfs: "POST /warpspeed/fetch-pdfs {county, instrumentType, maxDocs}",
      pipeline_stats: "GET /pipeline/stats",
      pipeline_search: "GET /pipeline/search?county=X&grantor=Y&property=Z",
      scrape: "POST /scrape {county, instrumentType, dateFrom, dateTo}",
      dashboard: "GET /dashboard"
    },
    performance: { throughput: "32 docs/min", success_rate: "100%", avg_confidence: 0.56, cost: "$5-11/mo" },
    supersedes: ["v3 Omega", "v4.1 Cloud", "v5 Ultimate", "v6 Nexus", "v7 WarpSpeed", "v8.0", "v8.1.0", "ENCORE parallel_county_scraper.py"]
  }
};

// ============================================================
// D1 Schema
// ============================================================
const DB_SCHEMA = `
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  instance_type TEXT,
  current_task TEXT,
  last_heartbeat TEXT,
  started_at TEXT,
  metadata TEXT
);

CREATE TABLE IF NOT EXISTS todos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  assigned_to TEXT,
  created_at TEXT,
  updated_at TEXT,
  metadata TEXT
);

CREATE TABLE IF NOT EXISTS memories (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL,
  value TEXT,
  category TEXT,
  created_at TEXT,
  expires_at TEXT
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT,
  source TEXT,
  data TEXT,
  timestamp TEXT
);

CREATE TABLE IF NOT EXISTS broadcasts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message TEXT,
  priority TEXT,
  source TEXT,
  created_at TEXT,
  expires_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_sessions_type ON sessions(instance_type);
CREATE INDEX IF NOT EXISTS idx_todos_status ON todos(status);
CREATE INDEX IF NOT EXISTS idx_memories_key ON memories(key);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);

CREATE TABLE IF NOT EXISTS build_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,
  action TEXT NOT NULL,
  target TEXT,
  detail TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS engine_status (
  id TEXT PRIMARY KEY,
  tier TEXT,
  name TEXT,
  status TEXT,
  note TEXT,
  loc INTEGER DEFAULT 0,
  mode TEXT,
  updated_by TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS gate_status (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE,
  icon TEXT,
  status TEXT,
  detail TEXT,
  updated_by TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS build_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  time TEXT,
  tag TEXT,
  text TEXT,
  source TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_build_reports_action ON build_reports(action);
CREATE INDEX IF NOT EXISTS idx_engine_status_tier ON engine_status(tier);
CREATE INDEX IF NOT EXISTS idx_engine_status_status ON engine_status(status);
CREATE INDEX IF NOT EXISTS idx_gate_status_name ON gate_status(name);
CREATE INDEX IF NOT EXISTS idx_build_notes_tag ON build_notes(tag);
`;

// ============================================================
// Utility Functions
// ============================================================
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: CORS_HEADERS });
}

function errorResponse(msg, status = 400) {
  return jsonResponse({ error: msg, status }, status);
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function now() {
  return new Date().toISOString();
}

// ============================================================
// Route Handlers
// ============================================================

async function handleHealth(env) {
  return jsonResponse({
    status: "operational",
    version: "4.5.0",
    timestamp: now(),
    features: [
      "d1_database", "kv_cache", "rate_limiting", "cors", "build_tracking",
      "engine_status", "gate_tracking", "build_notes", "dynamic_policies",
      "r2_swarm", "r2_memory", "r2_vault", "r2_law", "r2_tax", "r2_knowledge"
    ],
    r2_buckets: {
      swarm: { binding: "R2_SWARM", bucket: "echo-swarm-brain", connected: !!env.R2_SWARM },
      memory: { binding: "R2_MEMORY", bucket: "echo-prime-memory", connected: !!env.R2_MEMORY },
      vault: { binding: "R2_VAULT", bucket: "echo-prime-master-vault", connected: !!env.R2_VAULT },
      law: { binding: "R2_LAW", bucket: "echo-prime-law-corpus", connected: !!env.R2_LAW },
      tax: { binding: "R2_TAX", bucket: "echo-prime-tax-knowledge", connected: !!env.R2_TAX },
      knowledge: { binding: "R2_KNOWLEDGE", bucket: "echo-prime-knowledge", connected: !!env.R2_KNOWLEDGE }
    },
    authority: "11.0 SOVEREIGN"
  });
}

async function handlePolicies(env) {
  let dynamic = {};
  if (env.OMNISCIENT_DATA) {
    try {
      const stored = await env.OMNISCIENT_DATA.get(KV_KEYS.POLICIES, "json");
      if (stored) dynamic = stored;
    } catch {}
  }
  const all = { ...HARDCODED_POLICIES, ...dynamic };
  return jsonResponse({
    policies: all,
    count: Object.keys(all).length,
    hardcoded: Object.keys(HARDCODED_POLICIES).length,
    dynamic: Object.keys(dynamic).length,
    enforcement_levels: ["ABSOLUTE", "MANDATORY", "REQUIRED", "ZERO_TOLERANCE"]
  });
}

async function storePolicy(env, body) {
  if (!body.id || !body.name) return errorResponse("Policy requires 'id' and 'name' fields");
  let dynamic = {};
  if (env.OMNISCIENT_DATA) {
    try {
      const stored = await env.OMNISCIENT_DATA.get(KV_KEYS.POLICIES, "json");
      if (stored) dynamic = stored;
    } catch {}
  }
  dynamic[body.id] = { ...body, stored_at: now() };
  await env.OMNISCIENT_DATA.put(KV_KEYS.POLICIES, JSON.stringify(dynamic));
  if (env.DB) {
    await env.DB.prepare("INSERT INTO events (event_type, source, data, timestamp) VALUES (?, ?, ?, ?)")
      .bind("policy_stored", body.id, JSON.stringify(body), now()).run();
  }
  return jsonResponse({ success: true, policy_id: body.id, message: `Policy '${body.id}' stored in KV`, total_dynamic: Object.keys(dynamic).length });
}

async function deletePolicy(env, policyId) {
  if (HARDCODED_POLICIES[policyId]) return errorResponse(`Cannot delete hardcoded policy '${policyId}'. Use source code.`, 403);
  let dynamic = {};
  if (env.OMNISCIENT_DATA) {
    try {
      const stored = await env.OMNISCIENT_DATA.get(KV_KEYS.POLICIES, "json");
      if (stored) dynamic = stored;
    } catch {}
  }
  if (!dynamic[policyId]) return errorResponse(`Dynamic policy '${policyId}' not found`, 404);
  delete dynamic[policyId];
  await env.OMNISCIENT_DATA.put(KV_KEYS.POLICIES, JSON.stringify(dynamic));
  return jsonResponse({ success: true, deleted: policyId });
}

async function getSessions(env) {
  try {
    if (env.DB) {
      const result = await env.DB.prepare("SELECT * FROM sessions ORDER BY last_heartbeat DESC LIMIT 100").all();
      return jsonResponse({ sessions: result.results || [], source: "d1" });
    }
    const data = await env.OMNISCIENT_DATA?.get(KV_KEYS.SESSIONS);
    return jsonResponse({ sessions: data ? JSON.parse(data) : [], source: "kv" });
  } catch (e) {
    return jsonResponse({ sessions: [], error: e.message });
  }
}

async function registerSession(env, body) {
  const session = {
    id: generateId(),
    instance_type: body.instance_type || "unknown",
    current_task: body.current_task || "Session started",
    last_heartbeat: now(),
    started_at: now(),
    metadata: JSON.stringify(body.metadata || {})
  };
  try {
    if (env.DB) {
      await env.DB.prepare(
        "INSERT INTO sessions (id, instance_type, current_task, last_heartbeat, started_at, metadata) VALUES (?, ?, ?, ?, ?, ?)"
      ).bind(session.id, session.instance_type, session.current_task, session.last_heartbeat, session.started_at, session.metadata).run();
    }
    return jsonResponse({ success: true, session_id: session.id, message: "Session registered" });
  } catch (e) {
    return jsonResponse({ success: false, error: e.message }, 500);
  }
}

async function heartbeat(env, body) {
  const { session_id, current_task } = body;
  if (!session_id) return errorResponse("session_id required");
  try {
    if (env.DB) {
      await env.DB.prepare("UPDATE sessions SET last_heartbeat = ?, current_task = ? WHERE id = ?")
        .bind(now(), current_task || "", session_id).run();
    }
    return jsonResponse({ success: true, timestamp: now() });
  } catch (e) {
    return jsonResponse({ success: false, error: e.message }, 500);
  }
}

async function getTodos(env) {
  try {
    if (env.DB) {
      const result = await env.DB.prepare("SELECT * FROM todos ORDER BY id DESC LIMIT 200").all();
      return jsonResponse({ todos: result.results || [], source: "d1" });
    }
    const data = await env.OMNISCIENT_DATA?.get(KV_KEYS.TODOS);
    return jsonResponse({ todos: data ? JSON.parse(data) : [], source: "kv" });
  } catch (e) {
    return jsonResponse({ todos: [], error: e.message });
  }
}

async function createTodo(env, body) {
  const todo = {
    title: body.title || "Untitled",
    description: body.description || "",
    status: body.status || "pending",
    priority: body.priority || "medium",
    assigned_to: body.assigned_to || null,
    created_at: now(),
    updated_at: now(),
    metadata: JSON.stringify(body.metadata || {})
  };
  try {
    if (env.DB) {
      const result = await env.DB.prepare(
        "INSERT INTO todos (title, description, status, priority, assigned_to, created_at, updated_at, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      ).bind(todo.title, todo.description, todo.status, todo.priority, todo.assigned_to, todo.created_at, todo.updated_at, todo.metadata).run();
      return jsonResponse({ success: true, todo_id: result.meta?.last_row_id, message: "Todo created" });
    }
    return errorResponse("D1 database not available");
  } catch (e) {
    return jsonResponse({ success: false, error: e.message }, 500);
  }
}

async function updateTodo(env, todoId, body) {
  try {
    if (env.DB) {
      await env.DB.prepare("UPDATE todos SET status = ?, updated_at = ? WHERE id = ?")
        .bind(body.status || "pending", now(), todoId).run();
      return jsonResponse({ success: true, message: "Todo updated" });
    }
    return errorResponse("D1 database not available");
  } catch (e) {
    return jsonResponse({ success: false, error: e.message }, 500);
  }
}

async function deleteTodo(env, todoId) {
  try {
    if (env.DB) {
      const result = await env.DB.prepare("DELETE FROM todos WHERE id = ?").bind(todoId).run();
      return jsonResponse({ success: true, deleted: todoId, changes: result.meta?.changes || 0 });
    }
    return errorResponse("D1 database not available");
  } catch (e) {
    return jsonResponse({ success: false, error: e.message }, 500);
  }
}

async function bulkDeleteTodos(env, body) {
  try {
    if (!env.DB) return errorResponse("D1 database not available");
    const ids = body.ids || [];
    if (!ids.length) return errorResponse("No IDs provided");
    const placeholders = ids.map(() => "?").join(",");
    const result = await env.DB.prepare(`DELETE FROM todos WHERE id IN (${placeholders})`).bind(...ids).run();
    return jsonResponse({ success: true, deleted: result.meta?.changes || 0, requested: ids.length });
  } catch (e) {
    return jsonResponse({ success: false, error: e.message }, 500);
  }
}

async function getMemory(env, key) {
  try {
    if (env.DB) {
      const row = await env.DB.prepare("SELECT * FROM memories WHERE key = ?").bind(key).first();
      if (row) return jsonResponse({ found: true, key, value: JSON.parse(row.value || "{}"), created_at: row.created_at });
    }
    return jsonResponse({ found: false, key });
  } catch (e) {
    return jsonResponse({ found: false, error: e.message });
  }
}

async function setMemory(env, body) {
  const { key, value, category, expires_in } = body;
  if (!key) return errorResponse("key required");
  const mem = {
    id: generateId(),
    key,
    value: JSON.stringify(value || {}),
    category: category || "general",
    created_at: now(),
    expires_at: expires_in ? new Date(Date.now() + expires_in * 1000).toISOString() : null
  };
  try {
    if (env.DB) {
      await env.DB.prepare(
        "INSERT OR REPLACE INTO memories (id, key, value, category, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)"
      ).bind(mem.id, mem.key, mem.value, mem.category, mem.created_at, mem.expires_at).run();
      return jsonResponse({ success: true, key, message: "Memory stored" });
    }
    return errorResponse("D1 database not available");
  } catch (e) {
    return jsonResponse({ success: false, error: e.message }, 500);
  }
}

async function getBroadcasts(env) {
  try {
    if (env.DB) {
      const result = await env.DB.prepare(
        "SELECT * FROM broadcasts WHERE expires_at IS NULL OR expires_at > datetime('now') ORDER BY id DESC LIMIT 50"
      ).all();
      return jsonResponse({ broadcasts: result.results || [] });
    }
    return jsonResponse({ broadcasts: [] });
  } catch (e) {
    return jsonResponse({ broadcasts: [], error: e.message });
  }
}

async function createBroadcast(env, body) {
  const bc = {
    message: body.message || "",
    priority: body.priority || "normal",
    source: body.source || "unknown",
    created_at: now(),
    expires_at: body.expires_in ? new Date(Date.now() + body.expires_in * 1000).toISOString() : null
  };
  try {
    if (env.DB) {
      await env.DB.prepare(
        "INSERT INTO broadcasts (message, priority, source, created_at, expires_at) VALUES (?, ?, ?, ?, ?)"
      ).bind(bc.message, bc.priority, bc.source, bc.created_at, bc.expires_at).run();
      return jsonResponse({ success: true, message: "Broadcast sent" });
    }
    return errorResponse("D1 database not available");
  } catch (e) {
    return jsonResponse({ success: false, error: e.message }, 500);
  }
}

async function loadContext(env, workspace) {
  try {
    const sessions = env.DB ? (await env.DB.prepare("SELECT * FROM sessions ORDER BY last_heartbeat DESC LIMIT 10").all()).results : [];
    const todos = env.DB ? (await env.DB.prepare("SELECT * FROM todos WHERE status != 'completed' LIMIT 20").all()).results : [];
    const broadcasts = env.DB ? (await env.DB.prepare("SELECT * FROM broadcasts ORDER BY id DESC LIMIT 10").all()).results : [];
    return jsonResponse({
      workspace: workspace || "ECHO_OMEGA_PRIME",
      context: {
        active_sessions: sessions.length,
        pending_todos: todos.filter(t => t.status === "pending").length,
        in_progress_todos: todos.filter(t => t.status === "in_progress").length,
        recent_broadcasts: broadcasts.length
      },
      sessions, todos, broadcasts,
      policies: HARDCODED_POLICIES,
      loaded_at: now()
    });
  } catch (e) {
    return jsonResponse({ error: e.message, policies: HARDCODED_POLICIES });
  }
}

async function storeContext(env, body) {
  const { session_id, instance, summary, key_files } = body;
  try {
    if (env.DB) {
      await env.DB.prepare(
        "INSERT INTO events (event_type, source, data, timestamp) VALUES (?, ?, ?, ?)"
      ).bind("context_store", instance || session_id, JSON.stringify({ summary, key_files }), now()).run();
    }
    return jsonResponse({ success: true, message: "Context stored" });
  } catch (e) {
    return jsonResponse({ success: false, error: e.message }, 500);
  }
}

// ============================================================
// Build Tracking
// ============================================================

const STATUS_ORDER = { P: 0, B: 1, X: 2 };

async function buildReport(env, body) {
  const { source, action, target, detail } = body;
  if (!source || !action) return errorResponse("source and action required");
  try {
    if (env.DB) {
      await env.DB.prepare(
        "INSERT INTO build_reports (source, action, target, detail, created_at) VALUES (?, ?, ?, ?, ?)"
      ).bind(source, action, target || null, typeof detail === "object" ? JSON.stringify(detail) : detail || null, now()).run();
      if (env.OMNISCIENT_DATA) await env.OMNISCIENT_DATA.delete("build:dashboard_cache");
    }
    return jsonResponse({ success: true, message: "Build report logged" });
  } catch (e) {
    return jsonResponse({ success: false, error: e.message }, 500);
  }
}

async function buildStatus(env) {
  try {
    if (!env.DB) return errorResponse("D1 not available");
    const engines = (await env.DB.prepare("SELECT * FROM engine_status ORDER BY id").all()).results || [];
    const gates = (await env.DB.prepare("SELECT * FROM gate_status ORDER BY id").all()).results || [];
    const reports = (await env.DB.prepare("SELECT * FROM build_reports ORDER BY id DESC LIMIT 20").all()).results || [];
    return jsonResponse({
      summary: {
        total_engines: engines.length,
        production: engines.filter(e => e.status === "X").length,
        built: engines.filter(e => e.status === "B").length,
        planned: engines.filter(e => e.status === "P").length,
        gates_passed: gates.filter(g => g.status === "PASS").length,
        gates_failed: gates.filter(g => g.status === "FAIL").length,
        gates_total: gates.length
      },
      engines, gates, recent_reports: reports, timestamp: now()
    });
  } catch (e) {
    return jsonResponse({ error: e.message }, 500);
  }
}

async function buildReports(env, url) {
  try {
    if (!env.DB) return errorResponse("D1 not available");
    const limit = parseInt(url.searchParams.get("limit") || "100");
    const action = url.searchParams.get("action");
    let sql = "SELECT * FROM build_reports";
    const params = [];
    if (action) { sql += " WHERE action = ?"; params.push(action); }
    sql += " ORDER BY id DESC LIMIT ?";
    params.push(Math.min(limit, 500));
    const stmt = env.DB.prepare(sql);
    const result = await (params.length === 1 ? stmt.bind(params[0]) : stmt.bind(...params)).all();
    return jsonResponse({ reports: result.results || [], count: (result.results || []).length });
  } catch (e) {
    return jsonResponse({ error: e.message }, 500);
  }
}

async function engineUpdate(env, body) {
  const { id, tier, name, status, note, loc, mode, updated_by } = body;
  if (!id) return errorResponse("engine id required");
  if (status && !["P", "B", "X"].includes(status)) return errorResponse("status must be P, B, or X");
  try {
    if (!env.DB) return errorResponse("D1 not available");
    const existing = await env.DB.prepare("SELECT status FROM engine_status WHERE id = ?").bind(id).first();
    if (existing && status && STATUS_ORDER[status] < STATUS_ORDER[existing.status]) {
      return errorResponse(`Cannot regress engine ${id} from ${existing.status} to ${status}`);
    }
    await env.DB.prepare(`
      INSERT INTO engine_status (id, tier, name, status, note, loc, mode, updated_by, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        tier = COALESCE(excluded.tier, engine_status.tier),
        name = COALESCE(excluded.name, engine_status.name),
        status = COALESCE(excluded.status, engine_status.status),
        note = COALESCE(excluded.note, engine_status.note),
        loc = COALESCE(excluded.loc, engine_status.loc),
        mode = COALESCE(excluded.mode, engine_status.mode),
        updated_by = excluded.updated_by,
        updated_at = excluded.updated_at
    `).bind(id, tier || null, name || null, status || "P", note || null, loc || 0, mode || null, updated_by || "unknown", now()).run();
    await env.DB.prepare(
      "INSERT INTO build_reports (source, action, target, detail, created_at) VALUES (?, ?, ?, ?, ?)"
    ).bind(updated_by || "unknown", "engine_update", id, JSON.stringify({ status, note, loc }), now()).run();
    if (env.OMNISCIENT_DATA) await env.OMNISCIENT_DATA.delete("build:dashboard_cache");
    return jsonResponse({ success: true, message: `Engine ${id} updated to ${status}` });
  } catch (e) {
    return jsonResponse({ success: false, error: e.message }, 500);
  }
}

async function gateUpdate(env, body) {
  const { name, icon, status, detail, updated_by } = body;
  if (!name) return errorResponse("gate name required");
  if (status && !["PASS", "FAIL", "PENDING"].includes(status)) return errorResponse("status must be PASS, FAIL, or PENDING");
  try {
    if (!env.DB) return errorResponse("D1 not available");
    await env.DB.prepare(`
      INSERT INTO gate_status (name, icon, status, detail, updated_by, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(name) DO UPDATE SET
        icon = COALESCE(excluded.icon, gate_status.icon),
        status = COALESCE(excluded.status, gate_status.status),
        detail = COALESCE(excluded.detail, gate_status.detail),
        updated_by = excluded.updated_by,
        updated_at = excluded.updated_at
    `).bind(name, icon || null, status || "PENDING", detail || null, updated_by || "unknown", now()).run();
    await env.DB.prepare(
      "INSERT INTO build_reports (source, action, target, detail, created_at) VALUES (?, ?, ?, ?, ?)"
    ).bind(updated_by || "unknown", "gate_update", name, JSON.stringify({ status, detail }), now()).run();
    if (env.OMNISCIENT_DATA) await env.OMNISCIENT_DATA.delete("build:dashboard_cache");
    return jsonResponse({ success: true, message: `Gate '${name}' updated to ${status}` });
  } catch (e) {
    return jsonResponse({ success: false, error: e.message }, 500);
  }
}

async function buildNote(env, body) {
  const { tag, text, source, time } = body;
  if (!text) return errorResponse("text required");
  try {
    if (!env.DB) return errorResponse("D1 not available");
    await env.DB.prepare(
      "INSERT INTO build_notes (time, tag, text, source, created_at) VALUES (?, ?, ?, ?, ?)"
    ).bind(time || now(), tag || "GENERAL", text, source || "unknown", now()).run();
    if (env.OMNISCIENT_DATA) await env.OMNISCIENT_DATA.delete("build:dashboard_cache");
    return jsonResponse({ success: true, message: "Build note added" });
  } catch (e) {
    return jsonResponse({ success: false, error: e.message }, 500);
  }
}

async function dashboardData(env) {
  try {
    if (env.OMNISCIENT_DATA) {
      const cached = await env.OMNISCIENT_DATA.get("build:dashboard_cache");
      if (cached) return jsonResponse(JSON.parse(cached));
    }
    if (!env.DB) return errorResponse("D1 not available");
    const engines = (await env.DB.prepare("SELECT * FROM engine_status ORDER BY id").all()).results || [];
    const gates = (await env.DB.prepare("SELECT * FROM gate_status ORDER BY id").all()).results || [];
    const notes = (await env.DB.prepare("SELECT * FROM build_notes ORDER BY id DESC LIMIT 50").all()).results || [];
    const reports = (await env.DB.prepare("SELECT * FROM build_reports ORDER BY id DESC LIMIT 50").all()).results || [];
    const sessions = (await env.DB.prepare("SELECT * FROM sessions ORDER BY last_heartbeat DESC LIMIT 20").all()).results || [];

    const tiers = {};
    for (const eng of engines) {
      if (!tiers[eng.tier]) tiers[eng.tier] = [];
      tiers[eng.tier].push(eng);
    }

    const data = {
      summary: {
        total_engines: engines.length,
        production: engines.filter(e => e.status === "X").length,
        built: engines.filter(e => e.status === "B").length,
        planned: engines.filter(e => e.status === "P").length,
        total_loc: engines.reduce((sum, e) => sum + (e.loc || 0), 0),
        gates_passed: gates.filter(g => g.status === "PASS").length,
        gates_failed: gates.filter(g => g.status === "FAIL").length,
        gates_pending: gates.filter(g => g.status === "PENDING").length,
        gates_total: gates.length,
        active_sessions: sessions.filter(s => {
          const hb = new Date(s.last_heartbeat);
          return Date.now() - hb.getTime() < 300000;
        }).length
      },
      engines, tiers, gates, notes, reports, sessions,
      generated_at: now()
    };
    if (env.OMNISCIENT_DATA) {
      await env.OMNISCIENT_DATA.put("build:dashboard_cache", JSON.stringify(data), { expirationTtl: 60 });
    }
    return jsonResponse(data);
  } catch (e) {
    return jsonResponse({ error: e.message }, 500);
  }
}

async function bulkSeedEngines(env, body) {
  const { engines } = body;
  if (!engines || !Array.isArray(engines)) return errorResponse("engines array required");
  try {
    if (!env.DB) return errorResponse("D1 not available");
    let count = 0;
    for (const eng of engines) {
      await env.DB.prepare(`
        INSERT INTO engine_status (id, tier, name, status, note, loc, mode, updated_by, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          tier = excluded.tier, name = excluded.name, status = excluded.status,
          note = excluded.note, loc = excluded.loc, mode = excluded.mode,
          updated_by = excluded.updated_by, updated_at = excluded.updated_at
      `).bind(eng.id, eng.tier || null, eng.name || null, eng.status || "P", eng.note || null, eng.loc || 0, eng.mode || null, "seed", now()).run();
      count++;
    }
    if (env.OMNISCIENT_DATA) await env.OMNISCIENT_DATA.delete("build:dashboard_cache");
    return jsonResponse({ success: true, inserted: count, message: `${count} engines seeded` });
  } catch (e) {
    return jsonResponse({ success: false, error: e.message }, 500);
  }
}

async function bulkSeedGates(env, body) {
  const { gates } = body;
  if (!gates || !Array.isArray(gates)) return errorResponse("gates array required");
  try {
    if (!env.DB) return errorResponse("D1 not available");
    let count = 0;
    for (const gate of gates) {
      await env.DB.prepare(`
        INSERT INTO gate_status (name, icon, status, detail, updated_by, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(name) DO UPDATE SET
          icon = excluded.icon, status = excluded.status, detail = excluded.detail,
          updated_by = excluded.updated_by, updated_at = excluded.updated_at
      `).bind(gate.name, gate.icon || null, gate.status || "PENDING", gate.detail || null, "seed", now()).run();
      count++;
    }
    if (env.OMNISCIENT_DATA) await env.OMNISCIENT_DATA.delete("build:dashboard_cache");
    return jsonResponse({ success: true, inserted: count, message: `${count} gates seeded` });
  } catch (e) {
    return jsonResponse({ success: false, error: e.message }, 500);
  }
}

async function bulkSeedNotes(env, body) {
  const { notes } = body;
  if (!notes || !Array.isArray(notes)) return errorResponse("notes array required");
  try {
    if (!env.DB) return errorResponse("D1 not available");
    let count = 0;
    for (const note of notes) {
      await env.DB.prepare(
        "INSERT INTO build_notes (time, tag, text, source, created_at) VALUES (?, ?, ?, ?, ?)"
      ).bind(note.time || now(), note.tag || "GENERAL", note.text, note.source || "seed", now()).run();
      count++;
    }
    if (env.OMNISCIENT_DATA) await env.OMNISCIENT_DATA.delete("build:dashboard_cache");
    return jsonResponse({ success: true, inserted: count, message: `${count} notes seeded` });
  } catch (e) {
    return jsonResponse({ success: false, error: e.message }, 500);
  }
}

// ============================================================
// R2 Operations
// ============================================================

function getR2Bucket(env, zone) {
  return { swarm: env.R2_SWARM, memory: env.R2_MEMORY, vault: env.R2_VAULT, law: env.R2_LAW, tax: env.R2_TAX, knowledge: env.R2_KNOWLEDGE }[zone] || null;
}

async function r2Store(env, zone, body) {
  const bucket = getR2Bucket(env, zone);
  if (!bucket) return errorResponse(`R2 bucket '${zone}' not configured`, 503);
  const { key, data, metadata } = body;
  if (!key || !data) return errorResponse("key and data required");
  const str = typeof data === "string" ? data : JSON.stringify(data);
  await bucket.put(key, str, {
    httpMetadata: { contentType: "application/json" },
    customMetadata: { zone, stored_at: now(), ...(metadata || {}) }
  });
  if (env.DB) {
    await env.DB.prepare("INSERT INTO events (event_type, source, data, timestamp) VALUES (?, ?, ?, ?)")
      .bind(`r2_store:${zone}`, key, JSON.stringify({ zone, size: str.length, metadata }), now()).run();
  }
  return jsonResponse({ success: true, zone, key, size: str.length });
}

async function r2Get(env, zone, key) {
  const bucket = getR2Bucket(env, zone);
  if (!bucket) return errorResponse(`R2 bucket '${zone}' not configured`, 503);
  const obj = await bucket.get(key);
  if (!obj) return jsonResponse({ success: false, error: "Not found", zone, key }, 404);
  const text = await obj.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return jsonResponse({
    success: true, zone, key, data,
    metadata: obj.customMetadata || {},
    size: obj.size, etag: obj.etag,
    uploaded: obj.uploaded?.toISOString()
  });
}

async function r2Delete(env, zone, key) {
  const bucket = getR2Bucket(env, zone);
  if (!bucket) return errorResponse(`R2 bucket '${zone}' not configured`, 503);
  await bucket.delete(key);
  return jsonResponse({ success: true, zone, key, deleted: true });
}

async function r2List(env, zone, prefix, limit) {
  const bucket = getR2Bucket(env, zone);
  if (!bucket) return errorResponse(`R2 bucket '${zone}' not configured`, 503);
  const result = await bucket.list({ prefix: prefix || undefined, limit: Math.min(limit || 100, 1000) });
  const objects = (result.objects || []).map(o => ({
    key: o.key, size: o.size, etag: o.etag,
    uploaded: o.uploaded?.toISOString(),
    metadata: o.customMetadata || {}
  }));
  return jsonResponse({
    success: true, zone, prefix: prefix || null,
    count: objects.length, truncated: result.truncated,
    cursor: result.truncated ? result.cursor : null, objects
  });
}

async function r2Stats(env) {
  const zones = ["swarm", "memory", "vault"];
  const stats = {};
  for (const zone of zones) {
    const bucket = getR2Bucket(env, zone);
    if (!bucket) { stats[zone] = { connected: false }; continue; }
    const result = await bucket.list({ limit: 1000 });
    const totalSize = (result.objects || []).reduce((sum, o) => sum + (o.size || 0), 0);
    stats[zone] = {
      connected: true,
      objects: result.objects?.length || 0,
      truncated: result.truncated,
      totalSize,
      totalSizeMB: Math.round(totalSize / 1024 / 1024 * 100) / 100
    };
  }
  return jsonResponse({ success: true, r2: stats, timestamp: now() });
}

async function r2CrossSync(env, body) {
  const { fromZone, toZone, prefix, keys } = body;
  const source = getR2Bucket(env, fromZone);
  const target = getR2Bucket(env, toZone);
  if (!source || !target) return errorResponse("Both source and target zones must be configured");
  let synced = 0, failed = 0;
  const keyList = keys || [];
  if (!keys && prefix) {
    const result = await source.list({ prefix, limit: 500 });
    for (const obj of result.objects || []) keyList.push(obj.key);
  }
  for (const key of keyList) {
    try {
      const obj = await source.get(key);
      if (obj) {
        const buf = await obj.arrayBuffer();
        await target.put(key, buf, {
          httpMetadata: obj.httpMetadata,
          customMetadata: { ...obj.customMetadata, synced_from: fromZone, synced_at: now() }
        });
        synced++;
      }
    } catch { failed++; }
  }
  return jsonResponse({ success: true, fromZone, toZone, synced, failed, total: keyList.length });
}

async function r2Snapshot(env, zone, body) {
  const bucket = getR2Bucket(env, zone);
  if (!bucket) return errorResponse(`R2 bucket '${zone}' not configured`, 503);
  const snapshot = { zone, timestamp: now(), ...body };
  const key = `snapshots/${zone}/${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  await bucket.put(key, JSON.stringify(snapshot, null, 2), {
    httpMetadata: { contentType: "application/json" },
    customMetadata: { type: "snapshot", zone, created: now() }
  });
  return jsonResponse({ success: true, zone, snapshotKey: key, timestamp: snapshot.timestamp });
}

// ============================================================
// Database Init
// ============================================================

async function initDatabase(env) {
  if (!env.DB) return errorResponse("D1 database not configured");
  try {
    const statements = DB_SCHEMA.split(";").filter(s => s.trim());
    for (const stmt of statements) {
      if (stmt.trim()) await env.DB.prepare(stmt).run();
    }
    return jsonResponse({
      success: true, message: "Database initialized",
      tables: ["sessions", "todos", "memories", "events", "broadcasts", "build_reports", "engine_status", "gate_status", "build_notes"]
    });
  } catch (e) {
    return jsonResponse({ success: false, error: e.message }, 500);
  }
}

// ============================================================
// Main Router
// ============================================================

export default {
  async fetch(request, env, ctx) {
    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // [H55 FIX] Auth on ALL routes EXCEPT /health
    if (path !== "/" && path !== "/health") {
      const authError = authenticate(request, env);
      if (authError) return authError;
    }

    // [C41 FIX] Payload size check for mutations (existing)
    if (["POST", "PUT", "DELETE"].includes(method)) {
      if (parseInt(request.headers.get("Content-Length") || "0") > 1048576) {
        return jsonResponse({ error: "Payload too large", max_bytes: 1048576 }, 413);
      }
    }

    // Parse body for POST/PUT
    let body = {};
    if (method === "POST" || method === "PUT") {
      try { body = await request.json(); } catch { body = {}; }
    }

    try {
      // Health - no auth, no rate limit
      if (path === "/" || path === "/health") return handleHealth(env);

      // [C41 FIX] Rate limiting on ALL methods (was only on GETs before)
      const ip = request.headers.get("cf-connecting-ip") || "unknown";
      const { allowed } = await checkRateLimit(ip, env.OMNISCIENT_DATA, 60, 60);
      if (!allowed) return jsonResponse({ error: "rate_limit_exceeded", retry_after_seconds: 60 }, 429);

      // Policies
      if (path === "/policies" && method === "GET") return handlePolicies(env);
      if (path === "/policies" && method === "POST") return storePolicy(env, body);
      if (path.startsWith("/policies/") && method === "DELETE") {
        const policyId = path.replace("/policies/", "");
        return deletePolicy(env, policyId);
      }

      // Database init
      if (path === "/init" && method === "POST") return initDatabase(env);

      // Sessions
      if (path === "/sessions" && method === "GET") return getSessions(env);
      if (path === "/sessions/register" && method === "POST") return registerSession(env, body);
      if (path === "/sessions/heartbeat" && method === "POST") return heartbeat(env, body);

      // Todos
      if (path === "/todos" && method === "GET") return getTodos(env);
      if (path === "/todos" && method === "POST") return createTodo(env, body);
      if (path === "/todos/bulk-delete" && method === "POST") return bulkDeleteTodos(env, body);
      if (path.startsWith("/todos/") && method === "PUT") {
        const todoId = path.split("/")[2];
        return updateTodo(env, todoId, body);
      }
      if (path.startsWith("/todos/") && method === "DELETE") {
        const todoId = path.split("/")[2];
        return deleteTodo(env, todoId);
      }

      // Memory
      if (path.startsWith("/memory/recall/") && method === "GET") {
        const key = path.replace("/memory/recall/", "");
        return getMemory(env, key);
      }
      if (path === "/memory/store" && method === "POST") return setMemory(env, body);

      // Broadcasts
      if (path === "/broadcasts" && method === "GET") return getBroadcasts(env);
      if (path === "/broadcasts" && method === "POST") return createBroadcast(env, body);

      // Context
      if (path === "/context/load" && method === "GET") {
        const workspace = url.searchParams.get("workspace");
        return loadContext(env, workspace);
      }
      if (path === "/context/store" && method === "POST") return storeContext(env, body);
      if (path === "/context/inject" && method === "GET") {
        const workspace = url.searchParams.get("workspace");
        return loadContext(env, workspace);
      }

      // Build tracking
      if (path === "/build/report" && method === "POST") return buildReport(env, body);
      if (path === "/build/status" && method === "GET") return buildStatus(env);
      if (path === "/build/reports" && method === "GET") return buildReports(env, url);
      if (path === "/build/engine-update" && method === "POST") return engineUpdate(env, body);
      if (path === "/build/gate-update" && method === "POST") return gateUpdate(env, body);
      if (path === "/build/note" && method === "POST") return buildNote(env, body);
      if (path === "/build/dashboard-data" && method === "GET") return dashboardData(env);
      if (path === "/build/seed/engines" && method === "POST") return bulkSeedEngines(env, body);
      if (path === "/build/seed/gates" && method === "POST") return bulkSeedGates(env, body);
      if (path === "/build/seed/notes" && method === "POST") return bulkSeedNotes(env, body);

      // R2 stats & cross-sync
      if (path === "/r2/stats" && method === "GET") return r2Stats(env);
      if (path === "/r2/cross-sync" && method === "POST") return r2CrossSync(env, body);

      // R2 zone routes
      const r2Match = path.match(/^\/r2\/(swarm|memory|vault|law|tax|knowledge)\/(.+)$/);
      if (r2Match) {
        const [, zone, action] = r2Match;

        // [C42 FIX] Vault-specific content validation on store
        if (zone === "vault" && action === "store" && method === "POST") {
          const validationError = validateVaultStore(request, body);
          if (validationError) return validationError;
        }

        if (action === "store" && method === "POST") return r2Store(env, zone, body);
        if (action === "snapshot" && method === "POST") return r2Snapshot(env, zone, body);
        if (action === "list" && method === "GET") {
          const prefix = url.searchParams.get("prefix");
          const limit = parseInt(url.searchParams.get("limit") || "100");
          return r2List(env, zone, prefix, limit);
        }
        if (action.startsWith("get/") && method === "GET") {
          const key = action.replace("get/", "");
          return r2Get(env, zone, decodeURIComponent(key));
        }
        if (action.startsWith("delete/") && method === "DELETE") {
          const key = action.replace("delete/", "");
          return r2Delete(env, zone, decodeURIComponent(key));
        }
      }

      return errorResponse("Not found", 404);
    } catch (e) {
      return errorResponse(`Server error: ${e.message}`, 500);
    }
  }
};
