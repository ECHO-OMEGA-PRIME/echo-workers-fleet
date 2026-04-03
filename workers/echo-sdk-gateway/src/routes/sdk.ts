/**
 * Echo SDK Gateway — SDK Catalog routes v3.2
 *
 * Full CRUD for D1-backed SDK method catalog (282+ methods across 32+ modules).
 * Lets SDK consumers discover, search, register, and manage functions.
 *
 * Routes:
 *   GET    /sdk/catalog                — List all SDK methods (paginated, filterable)
 *   GET    /sdk/catalog/modules        — List all modules with aggregated counts
 *   GET    /sdk/catalog/search         — Search methods by keyword (method, desc, class, params)
 *   GET    /sdk/catalog/method/:name   — Get a single method by exact name
 *   GET    /sdk/catalog/stats          — Catalog statistics
 *   GET    /sdk/catalog/:module        — Methods for a specific module
 *   POST   /sdk/catalog/register       — Register a single function
 *   POST   /sdk/catalog/bulk-register  — Batch register functions (up to 100)
 *   DELETE /sdk/catalog/:module        — Remove all functions for a module
 *   DELETE /sdk/catalog/:module/:method — Remove a single function
 */

import { Hono } from 'hono';
import type { Env } from '../types';
import { success, error } from '../utils/envelope';

const sdk = new Hono<{ Bindings: Env }>();

/** Safely parse params — handles JSON objects, plain strings, and nulls */
function safeParseParams(params: unknown): unknown {
  if (params === null || params === undefined) return null;
  if (typeof params !== 'string') return params;
  const trimmed = params.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try { return JSON.parse(trimmed); } catch { return trimmed; }
  }
  return trimmed;
}

/** Map a raw D1 row to a clean SDK method object */
function mapRow(row: Record<string, unknown>) {
  return { ...row, params: safeParseParams(row.params) };
}

// ---------------------------------------------------------------------------
// GET /sdk/catalog — List all SDK methods (paginated, filterable)
// ---------------------------------------------------------------------------
sdk.get('/catalog', async (c) => {
  const version = c.env.WORKER_VERSION || '1.0.0';
  const limit = Math.min(parseInt(c.req.query('limit') || '50'), 500);
  const offset = parseInt(c.req.query('offset') || '0');
  const module = c.req.query('module');
  const className = c.req.query('class_name');

  try {
    let stmt;
    if (module && className) {
      stmt = c.env.SDK_CATALOG.prepare(
        'SELECT * FROM sdk_functions WHERE module = ? AND class_name = ? ORDER BY method_name LIMIT ? OFFSET ?',
      ).bind(module, className, limit, offset);
    } else if (module) {
      stmt = c.env.SDK_CATALOG.prepare(
        'SELECT * FROM sdk_functions WHERE module = ? ORDER BY class_name, method_name LIMIT ? OFFSET ?',
      ).bind(module, limit, offset);
    } else if (className) {
      stmt = c.env.SDK_CATALOG.prepare(
        'SELECT * FROM sdk_functions WHERE class_name = ? ORDER BY module, method_name LIMIT ? OFFSET ?',
      ).bind(className, limit, offset);
    } else {
      stmt = c.env.SDK_CATALOG.prepare(
        'SELECT * FROM sdk_functions ORDER BY module, class_name, method_name LIMIT ? OFFSET ?',
      ).bind(limit, offset);
    }

    const results = await stmt.all();

    // Build count query matching filters
    let countSql = 'SELECT COUNT(*) as total FROM sdk_functions';
    const countBinds: unknown[] = [];
    const conditions: string[] = [];
    if (module) { conditions.push('module = ?'); countBinds.push(module); }
    if (className) { conditions.push('class_name = ?'); countBinds.push(className); }
    if (conditions.length) countSql += ' WHERE ' + conditions.join(' AND ');
    const countResult = await c.env.SDK_CATALOG.prepare(countSql).bind(...countBinds).first<{ total: number }>();

    const methods = results.results.map(mapRow);

    return c.json(success({
      methods,
      pagination: {
        total: countResult?.total ?? 0,
        limit,
        offset,
        has_more: offset + limit < (countResult?.total ?? 0),
      },
    }, version));
  } catch (err) {
    console.error(JSON.stringify({ ts: new Date().toISOString(), level: 'error', route: '/sdk/catalog', error: String(err) }));
    return c.json(error('Failed to query SDK catalog', 'SDK_CATALOG_ERROR', version), 500);
  }
});

// ---------------------------------------------------------------------------
// GET /sdk/catalog/modules — List all modules with aggregated method counts
// ---------------------------------------------------------------------------
sdk.get('/catalog/modules', async (c) => {
  const version = c.env.WORKER_VERSION || '1.0.0';

  try {
    const results = await c.env.SDK_CATALOG.prepare(
      `SELECT module,
              COUNT(*) as method_count,
              COUNT(DISTINCT class_name) as class_count,
              GROUP_CONCAT(DISTINCT class_name) as classes
       FROM sdk_functions
       GROUP BY module
       ORDER BY module`,
    ).all();

    const totalFunctions = results.results.reduce(
      (sum: number, r: Record<string, unknown>) => sum + (r.method_count as number), 0,
    );

    return c.json(success({
      modules: results.results.map((r: Record<string, unknown>) => ({
        module: r.module,
        method_count: r.method_count,
        class_count: r.class_count,
        classes: (r.classes as string || '').split(',').filter(Boolean),
      })),
      total_modules: results.results.length,
      total_functions: totalFunctions,
    }, version));
  } catch (err) {
    console.error(JSON.stringify({ ts: new Date().toISOString(), level: 'error', route: '/sdk/catalog/modules', error: String(err) }));
    return c.json(error('Failed to list modules', 'SDK_CATALOG_ERROR', version), 500);
  }
});

// ---------------------------------------------------------------------------
// GET /sdk/catalog/stats — Catalog statistics
// ---------------------------------------------------------------------------
sdk.get('/catalog/stats', async (c) => {
  const version = c.env.WORKER_VERSION || '1.0.0';

  try {
    const [total, modules, classes, recent] = await Promise.all([
      c.env.SDK_CATALOG.prepare('SELECT COUNT(*) as cnt FROM sdk_functions').first<{ cnt: number }>(),
      c.env.SDK_CATALOG.prepare('SELECT COUNT(DISTINCT module) as cnt FROM sdk_functions').first<{ cnt: number }>(),
      c.env.SDK_CATALOG.prepare('SELECT COUNT(DISTINCT class_name) as cnt FROM sdk_functions').first<{ cnt: number }>(),
      c.env.SDK_CATALOG.prepare(
        'SELECT module, method_name, created_at FROM sdk_functions ORDER BY created_at DESC LIMIT 10',
      ).all(),
    ]);

    return c.json(success({
      total_functions: total?.cnt ?? 0,
      total_modules: modules?.cnt ?? 0,
      total_classes: classes?.cnt ?? 0,
      recent_additions: recent.results,
    }, version));
  } catch (err) {
    console.error(JSON.stringify({ ts: new Date().toISOString(), level: 'error', route: '/sdk/catalog/stats', error: String(err) }));
    return c.json(error('Failed to get stats', 'SDK_CATALOG_ERROR', version), 500);
  }
});

// ---------------------------------------------------------------------------
// GET /sdk/catalog/search — Search methods by keyword
// ---------------------------------------------------------------------------
sdk.get('/catalog/search', async (c) => {
  const version = c.env.WORKER_VERSION || '1.0.0';
  const q = c.req.query('q');

  if (!q || q.length < 2) {
    return c.json(error('Query parameter "q" required (min 2 chars)', 'INVALID_QUERY', version), 400);
  }

  const limit = Math.min(parseInt(c.req.query('limit') || '50'), 200);
  const module = c.req.query('module');
  const searchTerm = `%${q}%`;

  try {
    let sql = `SELECT * FROM sdk_functions
       WHERE (method_name LIKE ?1
          OR description LIKE ?1
          OR module LIKE ?1
          OR class_name LIKE ?1
          OR params LIKE ?1
          OR return_type LIKE ?1)`;

    const binds: unknown[] = [searchTerm];

    if (module) {
      sql += ' AND module = ?2';
      binds.push(module);
    }

    sql += ` ORDER BY
         CASE WHEN method_name LIKE ?1 THEN 0
              WHEN class_name LIKE ?1 THEN 1
              WHEN description LIKE ?1 THEN 2
              ELSE 3 END,
         module, method_name
       LIMIT ${limit}`;

    const results = await c.env.SDK_CATALOG.prepare(sql).bind(...binds).all();
    const methods = results.results.map(mapRow);

    return c.json(success({
      query: q,
      module_filter: module || null,
      methods,
      total: methods.length,
    }, version));
  } catch (err) {
    console.error(JSON.stringify({ ts: new Date().toISOString(), level: 'error', route: '/sdk/catalog/search', error: String(err) }));
    return c.json(error('Search failed', 'SDK_CATALOG_ERROR', version), 500);
  }
});

// ---------------------------------------------------------------------------
// GET /sdk/catalog/method/:name — Get a single method by exact name
// ---------------------------------------------------------------------------
sdk.get('/catalog/method/:name', async (c) => {
  const version = c.env.WORKER_VERSION || '1.0.0';
  const name = c.req.param('name');

  try {
    const results = await c.env.SDK_CATALOG.prepare(
      'SELECT * FROM sdk_functions WHERE method_name = ? ORDER BY module',
    ).bind(name).all();

    if (results.results.length === 0) {
      return c.json(error(`Method "${name}" not found`, 'METHOD_NOT_FOUND', version), 404);
    }

    return c.json(success({ methods: results.results.map(mapRow) }, version));
  } catch (err) {
    console.error(JSON.stringify({ ts: new Date().toISOString(), level: 'error', route: '/sdk/catalog/method', error: String(err) }));
    return c.json(error('Failed to get method', 'SDK_CATALOG_ERROR', version), 500);
  }
});

// ---------------------------------------------------------------------------
// POST /sdk/catalog/register — Register a single SDK function
// ---------------------------------------------------------------------------
sdk.post('/catalog/register', async (c) => {
  const version = c.env.WORKER_VERSION || '1.0.0';

  try {
    const body = await c.req.json<{
      module: string;
      class_name: string;
      method_name: string;
      kind?: string;
      route?: string;
      http_method?: string;
      params?: string | Record<string, unknown>;
      return_type?: string;
      description?: string;
    }>();

    if (!body.module || !body.class_name || !body.method_name) {
      return c.json(error('module, class_name, and method_name are required', 'VALIDATION_ERROR', version), 400);
    }

    const params = typeof body.params === 'object' ? JSON.stringify(body.params) : (body.params || '');

    // Upsert: delete existing + insert (no UNIQUE constraint on table)
    await c.env.SDK_CATALOG.prepare(
      'DELETE FROM sdk_functions WHERE module = ? AND class_name = ? AND method_name = ?',
    ).bind(body.module, body.class_name, body.method_name).run();

    const result = await c.env.SDK_CATALOG.prepare(
      `INSERT INTO sdk_functions (module, class_name, method_name, kind, route, http_method, params, return_type, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      body.module,
      body.class_name,
      body.method_name,
      body.kind || 'method',
      body.route || null,
      body.http_method || null,
      params,
      body.return_type || null,
      body.description || null,
    ).run();

    return c.json(success({
      registered: true,
      method: `${body.module}.${body.class_name}.${body.method_name}`,
      id: result.meta.last_row_id,
    }, version), 201);
  } catch (err) {
    console.error(JSON.stringify({ ts: new Date().toISOString(), level: 'error', route: '/sdk/catalog/register', error: String(err) }));
    return c.json(error('Failed to register function', 'SDK_CATALOG_ERROR', version), 500);
  }
});

// ---------------------------------------------------------------------------
// POST /sdk/catalog/bulk-register — Batch register up to 100 functions
// ---------------------------------------------------------------------------
sdk.post('/catalog/bulk-register', async (c) => {
  const version = c.env.WORKER_VERSION || '1.0.0';

  try {
    const body = await c.req.json<{
      module?: string;
      functions: Array<{
        module?: string;
        class_name: string;
        method_name: string;
        kind?: string;
        route?: string;
        http_method?: string;
        params?: string | Record<string, unknown>;
        return_type?: string;
        description?: string;
      }>;
    }>();

    if (!body.functions || !Array.isArray(body.functions)) {
      return c.json(error('"functions" array is required', 'VALIDATION_ERROR', version), 400);
    }

    if (body.functions.length > 100) {
      return c.json(error('Maximum 100 functions per batch', 'VALIDATION_ERROR', version), 400);
    }

    const stmts: D1PreparedStatement[] = [];

    for (const fn of body.functions) {
      const mod = fn.module || body.module;
      if (!mod || !fn.class_name || !fn.method_name) continue;
      const params = typeof fn.params === 'object' ? JSON.stringify(fn.params) : (fn.params || '');

      // Delete existing
      stmts.push(
        c.env.SDK_CATALOG.prepare(
          'DELETE FROM sdk_functions WHERE module = ? AND class_name = ? AND method_name = ?',
        ).bind(mod, fn.class_name, fn.method_name),
      );
      // Insert new
      stmts.push(
        c.env.SDK_CATALOG.prepare(
          `INSERT INTO sdk_functions (module, class_name, method_name, kind, route, http_method, params, return_type, description)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ).bind(mod, fn.class_name, fn.method_name, fn.kind || 'method', fn.route || null,
          fn.http_method || null, params, fn.return_type || null, fn.description || null),
      );
    }

    const results = await c.env.SDK_CATALOG.batch(stmts);
    const insertCount = results.filter((_, i) => i % 2 === 1).length;

    return c.json(success({
      registered: insertCount,
      total_submitted: body.functions.length,
    }, version), 201);
  } catch (err) {
    console.error(JSON.stringify({ ts: new Date().toISOString(), level: 'error', route: '/sdk/catalog/bulk-register', error: String(err) }));
    return c.json(error('Bulk registration failed', 'SDK_CATALOG_ERROR', version), 500);
  }
});

// ---------------------------------------------------------------------------
// DELETE /sdk/catalog/:module/:method — Remove a single function
// ---------------------------------------------------------------------------
sdk.delete('/catalog/:module/:method', async (c) => {
  const version = c.env.WORKER_VERSION || '1.0.0';
  const module = c.req.param('module');
  const method = c.req.param('method');

  try {
    const result = await c.env.SDK_CATALOG.prepare(
      'DELETE FROM sdk_functions WHERE module = ? AND method_name = ?',
    ).bind(module, method).run();

    return c.json(success({
      deleted: result.meta.changes,
      module,
      method,
    }, version));
  } catch (err) {
    console.error(JSON.stringify({ ts: new Date().toISOString(), level: 'error', route: `/sdk/catalog/${module}/${method}`, error: String(err) }));
    return c.json(error('Failed to delete function', 'SDK_CATALOG_ERROR', version), 500);
  }
});

// ---------------------------------------------------------------------------
// DELETE /sdk/catalog/:module — Remove all functions for a module
// ---------------------------------------------------------------------------
sdk.delete('/catalog/:module', async (c) => {
  const version = c.env.WORKER_VERSION || '1.0.0';
  const module = c.req.param('module');

  try {
    const countResult = await c.env.SDK_CATALOG.prepare(
      'SELECT COUNT(*) as cnt FROM sdk_functions WHERE module = ?',
    ).bind(module).first<{ cnt: number }>();

    if (!countResult?.cnt) {
      return c.json(error(`Module "${module}" not found`, 'MODULE_NOT_FOUND', version), 404);
    }

    const result = await c.env.SDK_CATALOG.prepare(
      'DELETE FROM sdk_functions WHERE module = ?',
    ).bind(module).run();

    return c.json(success({
      deleted: result.meta.changes,
      module,
    }, version));
  } catch (err) {
    console.error(JSON.stringify({ ts: new Date().toISOString(), level: 'error', route: `/sdk/catalog/${module}`, error: String(err) }));
    return c.json(error('Failed to delete module', 'SDK_CATALOG_ERROR', version), 500);
  }
});

// ---------------------------------------------------------------------------
// GET /sdk/catalog/:module — Methods for a specific module
// ---------------------------------------------------------------------------
sdk.get('/catalog/:module', async (c) => {
  const version = c.env.WORKER_VERSION || '1.0.0';
  const module = c.req.param('module');

  try {
    const results = await c.env.SDK_CATALOG.prepare(
      'SELECT * FROM sdk_functions WHERE module = ? ORDER BY class_name, method_name',
    ).bind(module).all();

    if (results.results.length === 0) {
      return c.json(error(`Module "${module}" not found`, 'MODULE_NOT_FOUND', version), 404);
    }

    const methods = results.results.map(mapRow);
    const classNames = [...new Set(methods.map((m) => m.class_name))];

    // Group by class for structured output
    const byClass: Record<string, unknown[]> = {};
    for (const m of methods) {
      const cls = m.class_name as string;
      if (!byClass[cls]) byClass[cls] = [];
      byClass[cls].push(m);
    }

    return c.json(success({
      module,
      class_names: classNames,
      class_count: classNames.length,
      methods,
      by_class: byClass,
      total: methods.length,
    }, version));
  } catch (err) {
    console.error(JSON.stringify({ ts: new Date().toISOString(), level: 'error', route: `/sdk/catalog/${module}`, error: String(err) }));
    return c.json(error('Failed to get module methods', 'SDK_CATALOG_ERROR', version), 500);
  }
});

export default sdk;
