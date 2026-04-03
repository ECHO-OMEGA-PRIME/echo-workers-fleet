# Omniscient Sync

Cross-instance synchronization hub — todos, policies, sessions, broadcasts, memory, builds, and R2 data across all AI instances.

## Purpose

Omniscient Sync is the cross-instance state synchronization layer for Echo Omega Prime. It manages the shared operational state that all AI instances (Claude, GPT, workers) need: todo lists, hardcoded policies, session registration, broadcasts, memory key-value store, build reports, and R2 bucket cross-sync. It uses both KV (for fast access) and D1 (for persistence and queries) as dual storage backends.

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | / | No | Health check |
| GET | /health | No | Health check (alias) |
| GET | /policies | Yes | List all policies (hardcoded + custom) |
| POST | /policies | Yes | Store a custom policy |
| POST | /init | Yes | Initialize D1 database schema |
| GET | /sessions | Yes | List active sessions |
| POST | /sessions/register | Yes | Register an AI session |
| POST | /sessions/heartbeat | Yes | Session heartbeat |
| GET | /todos | Yes | List all todos |
| POST | /todos | Yes | Create a todo |
| POST | /todos/bulk-delete | Yes | Bulk delete todos |
| POST | /memory/store | Yes | Store a memory key-value pair |
| GET | /broadcasts | Yes | List broadcasts |
| POST | /broadcasts | Yes | Create a broadcast |
| GET | /context/load | Yes | Load context for an instance |
| POST | /context/store | Yes | Store context |
| GET | /context/inject | Yes | Inject context for an instance |
| POST | /build/report | Yes | Submit a build report |
| GET | /build/status | Yes | Build pipeline status |
| GET | /build/reports | Yes | List build reports |
| POST | /build/engine-update | Yes | Update engine build status |
| POST | /build/gate-update | Yes | Update quality gate result |
| POST | /build/note | Yes | Add build note |
| GET | /build/dashboard-data | Yes | Build dashboard data |
| POST | /build/seed/engines | Yes | Bulk seed engine definitions |
| POST | /build/seed/gates | Yes | Bulk seed quality gates |
| POST | /build/seed/notes | Yes | Bulk seed build notes |
| GET | /r2/stats | Yes | R2 bucket statistics |
| POST | /r2/cross-sync | Yes | Cross-sync data between R2 buckets |

## Bindings

- **OMNISCIENT_DATA** (KV): Fast key-value state storage
- **DB** (D1): `omniscient-sync` — Sessions, todos, memories, events, build data
- **R2_SWARM** (R2): `echo-swarm-brain`
- **R2_MEMORY** (R2): `echo-prime-memory`
- **R2_VAULT** (R2): `echo-prime-master-vault`
- **R2_LAW** (R2): `echo-prime-law-corpus`
- **R2_TAX** (R2): `echo-prime-tax-knowledge`
- **R2_KNOWLEDGE** (R2): `echo-prime-knowledge`

## Security

- API key auth via `X-Echo-API-Key` header (H55 fix: all routes except /health)
- Rate limiting: 60 requests/min per IP on ALL methods (C41 fix)
- Vault content validation: Content-Type enforcement, path traversal blocking, 100KB size limit (C42 fix)
- CORS: wildcard (cross-instance compatibility)

## Hardcoded Policies

The following policies are always returned regardless of D1 state:
- BLOODLINE_DIRECTIVE — Commander authority 11.0
- NO_PLACEHOLDERS_POLICY — Zero tolerance for TODO/pass/stubs
- SECURITY_POLICY — No hardcoded secrets
- BUILD_STANDARDS — loguru, pathlib, type hints, FastAPI
- INFRASTRUCTURE_POLICY — Approved: Firebase, Cloud Run, Vercel, Cloudflare
- PRE_BUILD_VALIDATION — Never overwrite without validation
- TIMEOUT_POLICY — HTTP 30s, file 60s, build 300s, deploy 600s
- SHADOWGLASS_V8_POLICY — Mandatory ShadowGlass v8.1.1 usage
- DEBUG_LOGGING_POLICY — 5-step incident protocol
- APP_RELEASE_POLICY — 7-gate release approval
