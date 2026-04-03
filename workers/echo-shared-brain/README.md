# Echo Shared Brain

Universal context manager for all AI instances — D1 + KV + R2 + Vectorize with semantic search, mobile dashboard, and todo management.

## Purpose

Echo Shared Brain is the persistent memory layer for every AI instance in Echo Omega Prime. It stores conversation history, facts, decisions, build progress, and cross-instance broadcasts. It supports semantic search via Vectorize embeddings, fact extraction and consolidation, todo/policy management, mobile dashboards, and autonomy triggers. All AI instances (Claude, GPT, Sentinel, etc.) share context through this worker.

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /health | No | Health check with DB stats |
| GET | / | No | Health check (alias) |
| GET | /protocol | No | Communication protocol spec |
| GET | /stats | Yes | Memory statistics |
| POST | /schema | Yes | Initialize/migrate D1 schema |
| POST | /ingest | Yes | Ingest a memory entry |
| POST | /context | Yes | Load context for an instance |
| POST | /register | Yes | Register an AI instance |
| GET | /instances | Yes | List registered instances |
| POST | /heartbeat | Yes | Instance heartbeat |
| POST | /search | Yes | Semantic search (Vectorize) |
| GET | /search | Yes | Keyword search (FTS) |
| GET | /history | Yes | Conversation history |
| GET | /conversations | Yes | List conversations |
| POST | /recall | Yes | Targeted memory recall |
| POST | /broadcast | Yes | Send cross-instance broadcast |
| GET | /broadcasts | Yes | List broadcasts |
| GET | /decisions | Yes | List recorded decisions |
| GET | /plans | Yes | List active plans |
| GET | /todos | Yes | List todos |
| POST | /todos | Yes | Create a todo |
| GET | /policies | Yes | List policies |
| POST | /policies | Yes | Set a policy |
| DELETE | /policies | Yes | Delete a policy |
| POST | /policies/seed | Yes | Seed default policies |
| POST | /memory/store | Yes | Store a key-value memory |
| GET | /memory/list | Yes | List stored memories |
| POST | /facts/extract | Yes | AI fact extraction from text |
| GET | /facts | Yes | List extracted facts |
| POST | /facts/consolidate | Yes | Consolidate duplicate facts |
| POST | /facts/search | Yes | Search facts |
| POST | /bulk/ingest | Yes | Bulk memory ingestion |
| POST | /bulk/migrate | Yes | Bulk migrate memories |
| GET | /mobile/dashboard | Yes | Mobile app dashboard data |
| GET | /mobile/workers | Yes | Mobile: worker status |
| GET | /mobile/engines | Yes | Mobile: engine status |
| GET | /mobile/bots | Yes | Mobile: bot status |
| GET | /mobile/builds | Yes | Mobile: build progress |
| GET | /mobile/memory | Yes | Mobile: memory stats |
| GET | /mobile/drives | Yes | Mobile: drive status |
| GET | /mobile/moltbook | Yes | Mobile: MoltBook feed |
| POST | /mobile/focus | Yes | Mobile: set focus task |
| POST | /mobile/command | Yes | Mobile: execute command |
| GET | /build-progress | Yes | Build pipeline progress |
| POST | /build-progress | Yes | Update build progress |
| GET | /mobile-context | Yes | Mobile context snapshot |
| GET | /autonomy/status | Yes | Autonomy system status |
| POST | /autonomy/trigger | Yes | Trigger autonomy action |
| GET | /worker-health | Yes | Worker health snapshot |

## Bindings

- **DB** (D1): `echo-shared-brain` — Memories, conversations, facts, todos, policies, broadcasts
- **HOT** (KV): Hot cache and rate limiting
- **ARCHIVE** (R2): `echo-prime-memory` — Long-term memory archive
- **VECTORS** (Vectorize): `shared-brain-embeddings` — Semantic search index
- **AI** (Workers AI): Embedding generation for semantic search
- **OMNISYNC** (Service): omniscient-sync — Cross-instance state sync
- **MEMORY_PRIME** (Service): echo-memory-prime — Extended memory
- **BUILD_ORCHESTRATOR** (Service): echo-build-orchestrator — Build pipeline

## Security

- API key auth via `X-Echo-API-Key` or `Authorization: Bearer` header (C30 fix)
- Returns 503 if API key not configured on server
- Timing-safe string comparison for auth
- Rate limiting: 120 requests per 60 seconds
- CORS allowlist: echo-ept.com, echo-op.com, cleanbree.com, profinishusa.com, localhost
- Security headers: HSTS, X-Frame-Options DENY, nosniff, CSP
- Authenticated outbound fetch calls (C20 fix)
- Rejects requests with no instance_id (C21 fix)

## Cron Triggers

- `*/10 * * * *` — Todo escalation and health check
- `0 */6 * * *` — Memory consolidation
- `0 4 * * *` — Daily garbage cleanup (4am UTC)
