/**
 * Echo SDK Gateway — Per-Tenant Secrets Vault.
 *
 * Each tenant gets their own encrypted secrets store, completely isolated.
 * Secrets are AES-256-GCM encrypted with a key derived from the master key + tenant_id.
 * No tenant can see another tenant's secrets.
 *
 * Limits by plan:
 *   free: 10 secrets | starter: 100 | pro: 1,000 | enterprise: 10,000 | internal: unlimited
 *
 * Routes:
 *   POST   /vault/store    — Store a secret
 *   POST   /vault/get      — Retrieve a secret by name (decrypted)
 *   GET    /vault/list     — List secret names (no values)
 *   POST   /vault/search   — Search secrets by name/category
 *   DELETE /vault/delete    — Delete a secret
 *   GET    /vault/stats    — Vault statistics
 *   GET    /vault/categories — List categories with counts
 */

import { Hono } from 'hono';
import type { Env, AuthVariables } from '../types';
import { success, error } from '../utils/envelope';

const vault = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

// No per-plan limits — vault is included with every SDK key
const VAULT_MAX_SECRETS = 10000;

// ---------------------------------------------------------------------------
// Crypto helpers — AES-256-GCM with tenant-scoped key derivation
// ---------------------------------------------------------------------------

async function deriveKey(masterSecret: string, tenantId: string): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(masterSecret),
    'HKDF',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new TextEncoder().encode(`echo-vault-${tenantId}`),
      info: new TextEncoder().encode('echo-tenant-secrets-v1'),
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

async function encrypt(plaintext: string, key: CryptoKey): Promise<{ ciphertext: string; iv: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plaintext),
  );
  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...iv)),
  };
}

async function decrypt(ciphertext: string, ivStr: string, key: CryptoKey): Promise<string> {
  const encrypted = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0));
  const iv = Uint8Array.from(atob(ivStr), (c) => c.charCodeAt(0));
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encrypted,
  );
  return new TextDecoder().decode(decrypted);
}

function generateId(): string {
  return `sec_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
}

function v(c: { env: Env }): string {
  return c.env.WORKER_VERSION || '3.1.0';
}

function getTenantContext(c: { get: (k: string) => unknown }): { tenantId: string; plan: string } | null {
  const tenantId = c.get('auth_tenant_id') as string | undefined;
  const plan = c.get('auth_plan') as string | undefined;
  if (!tenantId) return null;
  return { tenantId, plan: plan || 'free' };
}

// ---------------------------------------------------------------------------
// POST /vault/store — Store a secret
// ---------------------------------------------------------------------------
vault.post('/store', async (c) => {
  const ctx = getTenantContext(c);
  if (!ctx) return c.json(error('Authentication required', 'ECHO_AUTH_ERROR', v(c)), 401);

  const body = await c.req.json<{ name: string; value: string; description?: string; category?: string }>().catch(() => null);
  if (!body?.name || !body?.value) {
    return c.json(error('name and value are required', 'ECHO_VALIDATION', v(c)), 400);
  }

  const name = body.name.trim();
  if (name.length > 128) return c.json(error('Name must be 128 chars or less', 'ECHO_VALIDATION', v(c)), 400);
  if (body.value.length > 10000) return c.json(error('Value must be 10,000 chars or less', 'ECHO_VALIDATION', v(c)), 400);

  // Safety cap to prevent abuse
  const count = await c.env.DB.prepare('SELECT COUNT(*) as cnt FROM tenant_secrets WHERE tenant_id = ?')
    .bind(ctx.tenantId).first<{ cnt: number }>();
  if ((count?.cnt || 0) >= VAULT_MAX_SECRETS) {
    return c.json(error(`Vault limit reached (${VAULT_MAX_SECRETS}). Contact support.`, 'ECHO_LIMIT_REACHED', v(c)), 429);
  }

  // Encrypt
    // C4 FIX: Never use hardcoded fallback — fail if no encryption key configured
  const masterSecret = c.env.API_KEY || c.env.ECHO_API_KEY;
  if (!masterSecret) {
    return c.json(error('Vault encryption not configured', 'ECHO_CONFIG_ERROR', v(c)), 503);
  }
  const key = await deriveKey(masterSecret, ctx.tenantId);
  const { ciphertext, iv } = await encrypt(body.value, key);

  const id = generateId();
  const category = (body.category || 'general').trim().toLowerCase();
  const description = (body.description || '').trim();

  try {
    await c.env.DB.prepare(
      `INSERT INTO tenant_secrets (id, tenant_id, name, description, encrypted_value, iv, category)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(tenant_id, name) DO UPDATE SET
         encrypted_value = excluded.encrypted_value,
         iv = excluded.iv,
         description = excluded.description,
         category = excluded.category,
         updated_at = datetime('now')`,
    ).bind(id, ctx.tenantId, name, description, ciphertext, iv, category).run();
  } catch (e) {
    return c.json(error(`Failed to store secret: ${String(e).slice(0, 200)}`, 'ECHO_DB_ERROR', v(c)), 500);
  }

  return c.json(success({ name, category, description, stored: true }, v(c)), 201);
});

// ---------------------------------------------------------------------------
// POST /vault/get — Retrieve a secret (decrypted)
// ---------------------------------------------------------------------------
vault.post('/get', async (c) => {
  const ctx = getTenantContext(c);
  if (!ctx) return c.json(error('Authentication required', 'ECHO_AUTH_ERROR', v(c)), 401);

  const body = await c.req.json<{ name: string }>().catch(() => null);
  if (!body?.name) {
    return c.json(error('name is required', 'ECHO_VALIDATION', v(c)), 400);
  }

  const row = await c.env.DB.prepare(
    'SELECT name, description, encrypted_value, iv, category, created_at, updated_at FROM tenant_secrets WHERE tenant_id = ? AND name = ?',
  ).bind(ctx.tenantId, body.name.trim()).first<{
    name: string; description: string; encrypted_value: string; iv: string; category: string; created_at: string; updated_at: string;
  }>();

  if (!row) {
    return c.json(error(`Secret '${body.name}' not found`, 'ECHO_NOT_FOUND', v(c)), 404);
  }

    // C4 FIX: Never use hardcoded fallback — fail if no encryption key configured
  const masterSecret = c.env.API_KEY || c.env.ECHO_API_KEY;
  if (!masterSecret) {
    return c.json(error('Vault encryption not configured', 'ECHO_CONFIG_ERROR', v(c)), 503);
  }
  const key = await deriveKey(masterSecret, ctx.tenantId);

  let value: string;
  try {
    value = await decrypt(row.encrypted_value, row.iv, key);
  } catch {
    return c.json(error('Failed to decrypt secret — data may be corrupted', 'ECHO_DECRYPT_ERROR', v(c)), 500);
  }

  return c.json(success({
    name: row.name,
    value,
    description: row.description,
    category: row.category,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }, v(c)));
});

// ---------------------------------------------------------------------------
// GET /vault/list — List secret names (no values)
// ---------------------------------------------------------------------------
vault.get('/list', async (c) => {
  const ctx = getTenantContext(c);
  if (!ctx) return c.json(error('Authentication required', 'ECHO_AUTH_ERROR', v(c)), 401);

  const category = c.req.query('category') || '';
  let sql = 'SELECT name, description, category, created_at, updated_at FROM tenant_secrets WHERE tenant_id = ?';
  const params: string[] = [ctx.tenantId];

  if (category) {
    sql += ' AND category = ?';
    params.push(category.toLowerCase());
  }
  sql += ' ORDER BY name ASC';

  const rows = await c.env.DB.prepare(sql).bind(...params).all<{
    name: string; description: string; category: string; created_at: string; updated_at: string;
  }>();

  return c.json(success({
    secrets: rows.results || [],
    count: rows.results?.length || 0,
  }, v(c)));
});

// ---------------------------------------------------------------------------
// POST /vault/search — Search secrets by name or category
// ---------------------------------------------------------------------------
vault.post('/search', async (c) => {
  const ctx = getTenantContext(c);
  if (!ctx) return c.json(error('Authentication required', 'ECHO_AUTH_ERROR', v(c)), 401);

  const body = await c.req.json<{ query: string }>().catch(() => null);
  if (!body?.query) {
    return c.json(error('query is required', 'ECHO_VALIDATION', v(c)), 400);
  }

  const q = `%${body.query.trim()}%`;
  const rows = await c.env.DB.prepare(
    `SELECT name, description, category, created_at, updated_at FROM tenant_secrets
     WHERE tenant_id = ? AND (name LIKE ? OR description LIKE ? OR category LIKE ?)
     ORDER BY name ASC LIMIT 50`,
  ).bind(ctx.tenantId, q, q, q).all<{
    name: string; description: string; category: string; created_at: string; updated_at: string;
  }>();

  return c.json(success({
    results: rows.results || [],
    count: rows.results?.length || 0,
    query: body.query,
  }, v(c)));
});

// ---------------------------------------------------------------------------
// DELETE /vault/delete — Delete a secret
// ---------------------------------------------------------------------------
vault.post('/delete', async (c) => {
  const ctx = getTenantContext(c);
  if (!ctx) return c.json(error('Authentication required', 'ECHO_AUTH_ERROR', v(c)), 401);

  const body = await c.req.json<{ name: string }>().catch(() => null);
  if (!body?.name) {
    return c.json(error('name is required', 'ECHO_VALIDATION', v(c)), 400);
  }

  const result = await c.env.DB.prepare(
    'DELETE FROM tenant_secrets WHERE tenant_id = ? AND name = ?',
  ).bind(ctx.tenantId, body.name.trim()).run();

  if (!result.meta.changes) {
    return c.json(error(`Secret '${body.name}' not found`, 'ECHO_NOT_FOUND', v(c)), 404);
  }

  return c.json(success({ name: body.name, deleted: true }, v(c)));
});

// ---------------------------------------------------------------------------
// GET /vault/stats — Vault statistics for this tenant
// ---------------------------------------------------------------------------
vault.get('/stats', async (c) => {
  const ctx = getTenantContext(c);
  if (!ctx) return c.json(error('Authentication required', 'ECHO_AUTH_ERROR', v(c)), 401);

  const total = await c.env.DB.prepare(
    'SELECT COUNT(*) as cnt FROM tenant_secrets WHERE tenant_id = ?',
  ).bind(ctx.tenantId).first<{ cnt: number }>();

  const categories = await c.env.DB.prepare(
    'SELECT category, COUNT(*) as cnt FROM tenant_secrets WHERE tenant_id = ? GROUP BY category ORDER BY cnt DESC',
  ).bind(ctx.tenantId).all<{ category: string; cnt: number }>();

  return c.json(success({
    total_secrets: total?.cnt || 0,
    max_secrets: VAULT_MAX_SECRETS,
    categories: categories.results || [],
  }, v(c)));
});

// ---------------------------------------------------------------------------
// GET /vault/categories — List categories with counts
// ---------------------------------------------------------------------------
vault.get('/categories', async (c) => {
  const ctx = getTenantContext(c);
  if (!ctx) return c.json(error('Authentication required', 'ECHO_AUTH_ERROR', v(c)), 401);

  const rows = await c.env.DB.prepare(
    'SELECT category, COUNT(*) as count FROM tenant_secrets WHERE tenant_id = ? GROUP BY category ORDER BY count DESC',
  ).bind(ctx.tenantId).all<{ category: string; count: number }>();

  return c.json(success({ categories: rows.results || [] }, v(c)));
});

export default vault;
