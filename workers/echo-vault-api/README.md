# Echo Vault API

Encrypted credential vault with 1,527+ secrets, audit trail, and R2 backup — the central secret store for Echo Omega Prime.

## Purpose

Echo Vault API is the master credential vault for the entire Echo Prime ecosystem. It stores API keys, passwords, tokens, and other secrets in a D1 database with R2 backup. Supports full CRUD operations, bulk import, category-based organization, password strength scoring, search, and an immutable audit log. All AI instances and workers retrieve credentials from this vault.

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /health | No | Health check (no credential count leaked) |
| POST | /store | Yes | Store or upsert a credential |
| GET | /get | Yes | Retrieve a credential (?service=X or ?id=N) |
| GET | /search | Yes | Search credentials (?q=keyword&category=X) |
| GET | /list | Yes | List all credentials (paginated) |
| GET | /services | Yes | List unique service names |
| DELETE | /delete | Yes | Delete a credential by ID |
| POST | /bulk | Yes | Bulk store credentials |
| GET | /stats | Yes | Vault statistics (counts, categories, strength) |
| POST | /import-r2 | Yes | Import credentials from R2 backup |
| GET | /audit | Yes | View audit log |
| POST | /init-audit | Yes | Initialize audit log table |

## Bindings

- **DB** (D1): `echo-master-vault` — Credential storage, audit log
- **VAULT** (R2): `echo-prime-master-vault` — Backup storage

## Security

- API key auth via `X-Echo-API-Key` header (timing-safe comparison)
- Returns 401 if no key; blocks all requests if API_KEY secret not configured
- Rate limiting: 60 requests/min per IP (in-memory buckets)
- Body size limit: 512KB
- CORS allowlist: echo-ept.com, echo-op.com (exact match only, no bypass)
- Security headers: HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy
- Error sanitization with random reference IDs
- Audit trail on all write operations
- Explicit column selection (no SELECT *, H12 fix)
- Password strength scoring on store
