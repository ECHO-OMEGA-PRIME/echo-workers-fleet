/**
 * Echo SDK Gateway — Unified Data Layer (F4).
 *
 * Read-only SQL proxy to any D1 database across the fleet via service bindings.
 * Exposes structured access to D1 databases with strict SELECT-only enforcement.
 *
 * Routes:
 *   GET  /data/databases        — List all queryable database domains
 *   GET  /data/:domain/tables   — List tables and column schemas in a domain
 *   POST /data/:domain/query    — Execute read-only SQL (SELECT only)
 *   GET  /data/:domain/stats    — Row counts and metadata for a domain
 */

import { Hono } from 'hono';
import type { Env } from '../types';
import { success, error } from '../utils/envelope';
import { log } from '../utils/proxy';

const data = new Hono<{ Bindings: Env }>();

// ---------------------------------------------------------------------------
// Database Registry — maps domain names to D1 bindings
// ---------------------------------------------------------------------------

interface DbRegistryEntry {
  binding: string;
  description: string;
}

const DB_REGISTRY: Record<string, DbRegistryEntry> = {
  sdk: {
    binding: 'DB',
    description: 'SDK Gateway (search index, webhooks, AGI)',
  },
  catalog: {
    binding: 'SDK_CATALOG',
    description: 'SDK method catalog (221 methods)',
  },
};

// ---------------------------------------------------------------------------
// SQL Safety — CRITICAL: only allow SELECT statements
// ---------------------------------------------------------------------------

function isSafeSQL(sql: string): boolean {
  const trimmed = sql.trim().toLowerCase();
  // Must start with SELECT
  if (!trimmed.startsWith('select')) return false;
  // Reject dangerous keywords anywhere in the query
  const dangerous =
    /\b(insert|update|delete|drop|alter|create|replace|truncate|attach|detach|pragma)\b/i;
  return !dangerous.test(trimmed);
}

// ---------------------------------------------------------------------------
// Helper: resolve a domain name to a D1 binding
// ---------------------------------------------------------------------------

function resolveDb(
  env: Env,
  domain: string,
): { db: D1Database; entry: DbRegistryEntry } | null {
  const entry = DB_REGISTRY[domain];
  if (!entry) return null;

  const db = (env as unknown as Record<string, D1Database>)[entry.binding];
  if (!db) return null;

  return { db, entry };
}

// ---------------------------------------------------------------------------
// Helper: introspect tables via sqlite_master
// ---------------------------------------------------------------------------

interface ColumnInfo {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | null;
  pk: number;
}

interface TableSchema {
  name: string;
  columns: ColumnInfo[];
  row_count?: number;
}

async function getTableSchemas(db: D1Database): Promise<TableSchema[]> {
  const tables: TableSchema[] = [];

  try {
    // Get all user tables (exclude internal SQLite and FTS shadow tables)
    const tableList = await db
      .prepare(
        `SELECT name FROM sqlite_master
         WHERE type = 'table'
           AND name NOT LIKE 'sqlite_%'
           AND name NOT LIKE '_cf_%'
           AND name NOT LIKE '%_content'
           AND name NOT LIKE '%_segments'
           AND name NOT LIKE '%_segdir'
           AND name NOT LIKE '%_docsize'
           AND name NOT LIKE '%_stat'
           AND name NOT LIKE '%_idx'
           AND name NOT LIKE '%_data'
           AND name NOT LIKE '%_config'
         ORDER BY name`,
      )
      .all<{ name: string }>();

    for (const row of tableList.results || []) {
      try {
        const colResult = await db
          .prepare(`PRAGMA table_info("${row.name}")`)
          .all<ColumnInfo>();

        tables.push({
          name: row.name,
          columns: colResult.results || [],
        });
      } catch {
        // PRAGMA might fail on virtual tables — skip
        tables.push({ name: row.name, columns: [] });
      }
    }
  } catch (e) {
    log('warn', 'data.tables', 'Failed to introspect tables', {
      error: String(e),
    });
  }

  return tables;
}

// ---------------------------------------------------------------------------
// GET /databases — List all queryable database domains
// ---------------------------------------------------------------------------

data.get('/databases', async (c) => {
  const version = c.env.WORKER_VERSION || '3.1.0';
  const start = Date.now();

  const databases = Object.entries(DB_REGISTRY).map(([domain, entry]) => {
    // Verify the binding actually exists at runtime
    const db = (c.env as unknown as Record<string, D1Database>)[entry.binding];
    return {
      domain,
      binding: entry.binding,
      description: entry.description,
      available: !!db,
    };
  });

  log('info', 'data.databases', 'Listed database domains', {
    count: databases.length,
  });

  return c.json(
    success(
      {
        databases,
        total: databases.length,
        note: 'Use POST /data/:domain/query with { sql: "SELECT ..." } for read-only queries',
      },
      version,
      Date.now() - start,
    ),
  );
});

// ---------------------------------------------------------------------------
// GET /:domain/tables — List tables and column schemas
// ---------------------------------------------------------------------------

data.get('/:domain/tables', async (c) => {
  const version = c.env.WORKER_VERSION || '3.1.0';
  const start = Date.now();
  const domain = c.req.param('domain');

  const resolved = resolveDb(c.env, domain);
  if (!resolved) {
    return c.json(
      error(
        `Unknown database domain: "${domain}". Use GET /data/databases to list available domains.`,
        'ECHO_UNKNOWN_DOMAIN',
        version,
      ),
      404,
    );
  }

  try {
    const tables = await getTableSchemas(resolved.db);

    log('info', 'data.tables', `Introspected tables for domain "${domain}"`, {
      domain,
      table_count: tables.length,
    });

    return c.json(
      success(
        {
          domain,
          description: resolved.entry.description,
          tables: tables.map((t) => ({
            name: t.name,
            columns: t.columns.map((col) => ({
              name: col.name,
              type: col.type,
              nullable: !col.notnull,
              primary_key: col.pk > 0,
              default_value: col.dflt_value,
            })),
            column_count: t.columns.length,
          })),
          total_tables: tables.length,
        },
        version,
        Date.now() - start,
      ),
    );
  } catch (e) {
    log('error', 'data.tables', `Table introspection failed for "${domain}"`, {
      domain,
      error: String(e),
    });
    return c.json(
      error(
        `Failed to introspect tables: ${String(e).slice(0, 200)}`,
        'ECHO_DB_ERROR',
        version,
      ),
      500,
    );
  }
});

// ---------------------------------------------------------------------------
// POST /:domain/query — Execute read-only SQL (SELECT only)
// ---------------------------------------------------------------------------

data.post('/:domain/query', async (c) => {
  const version = c.env.WORKER_VERSION || '3.1.0';
  const start = Date.now();
  const domain = c.req.param('domain');

  // Parse body
  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return c.json(
      error('Request body must be valid JSON', 'ECHO_INVALID_INPUT', version),
      400,
    );
  }

  const sql = String(body.sql || '').trim();
  if (!sql) {
    return c.json(
      error(
        "Missing 'sql' field. Provide a SELECT statement.",
        'ECHO_MISSING_FIELD',
        version,
      ),
      400,
    );
  }

  // SQL Safety — CRITICAL
  if (!isSafeSQL(sql)) {
    log('warn', 'data.query', 'Rejected unsafe SQL', {
      domain,
      sql_preview: sql.slice(0, 100),
    });
    return c.json(
      error(
        'Only SELECT statements are allowed. INSERT, UPDATE, DELETE, DROP, ALTER, CREATE, REPLACE, TRUNCATE, ATTACH, DETACH, and PRAGMA are forbidden.',
        'ECHO_SQL_FORBIDDEN',
        version,
      ),
      403,
    );
  }

  // Resolve domain
  const resolved = resolveDb(c.env, domain);
  if (!resolved) {
    return c.json(
      error(
        `Unknown database domain: "${domain}". Use GET /data/databases to list available domains.`,
        'ECHO_UNKNOWN_DOMAIN',
        version,
      ),
      404,
    );
  }

  // Parse params
  const params = Array.isArray(body.params) ? body.params : [];

  // Execute the query
  try {
    let stmt = resolved.db.prepare(sql);
    if (params.length > 0) {
      stmt = stmt.bind(...params);
    }

    const result = await stmt.all();
    const latency = Date.now() - start;

    log('info', 'data.query', `Executed query on "${domain}"`, {
      domain,
      sql_preview: sql.slice(0, 80),
      row_count: result.results?.length || 0,
      latency_ms: latency,
    });

    return c.json(
      success(
        {
          domain,
          sql,
          params,
          rows: result.results || [],
          row_count: result.results?.length || 0,
          meta: {
            changes: 0, // Always 0 for SELECT
            duration_ms: result.meta?.duration || 0,
            last_row_id: 0,
            served_by: result.meta?.served_by || 'unknown',
          },
        },
        version,
        latency,
      ),
    );
  } catch (e) {
    const errMsg = String(e);
    log('error', 'data.query', `Query failed on "${domain}"`, {
      domain,
      sql_preview: sql.slice(0, 80),
      error: errMsg.slice(0, 300),
    });

    // Determine if it's a SQL syntax error vs internal error
    const isSyntaxError =
      errMsg.includes('SQLITE_ERROR') ||
      errMsg.includes('no such table') ||
      errMsg.includes('no such column') ||
      errMsg.includes('near "');

    return c.json(
      error(
        `Query failed: ${errMsg.slice(0, 300)}`,
        isSyntaxError ? 'ECHO_SQL_SYNTAX_ERROR' : 'ECHO_DB_ERROR',
        version,
      ),
      isSyntaxError ? 400 : 500,
    );
  }
});

// ---------------------------------------------------------------------------
// GET /:domain/stats — Row counts, table sizes, database metadata
// ---------------------------------------------------------------------------

data.get('/:domain/stats', async (c) => {
  const version = c.env.WORKER_VERSION || '3.1.0';
  const start = Date.now();
  const domain = c.req.param('domain');

  const resolved = resolveDb(c.env, domain);
  if (!resolved) {
    return c.json(
      error(
        `Unknown database domain: "${domain}". Use GET /data/databases to list available domains.`,
        'ECHO_UNKNOWN_DOMAIN',
        version,
      ),
      404,
    );
  }

  try {
    // Get table list
    const tables = await getTableSchemas(resolved.db);

    // Get row counts for each table (parallel)
    const countPromises = tables.map(async (t) => {
      try {
        const result = await resolved.db
          .prepare(`SELECT COUNT(*) as count FROM "${t.name}"`)
          .first<{ count: number }>();
        return { name: t.name, row_count: result?.count || 0 };
      } catch {
        return { name: t.name, row_count: -1 }; // -1 indicates count failed (e.g., virtual table)
      }
    });

    const tableCounts = await Promise.all(countPromises);
    const totalRows = tableCounts.reduce(
      (sum, t) => sum + (t.row_count > 0 ? t.row_count : 0),
      0,
    );

    log('info', 'data.stats', `Stats for domain "${domain}"`, {
      domain,
      table_count: tables.length,
      total_rows: totalRows,
    });

    return c.json(
      success(
        {
          domain,
          description: resolved.entry.description,
          tables: tableCounts,
          total_tables: tables.length,
          total_rows: totalRows,
          timestamp: new Date().toISOString(),
        },
        version,
        Date.now() - start,
      ),
    );
  } catch (e) {
    log('error', 'data.stats', `Stats failed for "${domain}"`, {
      domain,
      error: String(e),
    });
    return c.json(
      error(
        `Failed to get stats: ${String(e).slice(0, 200)}`,
        'ECHO_DB_ERROR',
        version,
      ),
      500,
    );
  }
});

export default data;
