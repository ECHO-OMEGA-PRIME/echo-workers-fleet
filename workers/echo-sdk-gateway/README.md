# Echo SDK Gateway

Unified REST API gateway for Echo Omega Prime — 89 dedicated endpoints plus 24 passthrough proxies exposing 900+ total endpoints.

## Purpose

Echo SDK Gateway is the single authenticated entry point to the entire Echo Prime ecosystem. It provides 89 dedicated REST endpoints across 16 route modules (engine, brain, knowledge, vault, search, SDK, forge, LLM, webhooks, versioning, AGI, compose, data, functions, auth) plus 24 passthrough proxy routes that expose the full API surfaces of all connected workers. It serves as a GPT Action-compatible gateway with OpenAPI spec generation, semantic search via Vectorize, and FTS5 search indexing.

## Endpoints

### Dedicated Routes (89)

| Module | Path Prefix | Endpoints | Description |
|--------|-------------|-----------|-------------|
| Engine | /engine | 7 | Query 2,660+ intelligence engines |
| Brain | /brain | 4 | Shared Brain memory operations |
| Knowledge | /knowledge | 2 | Knowledge Forge retrieval |
| Vault | /vault | 7 | Credential vault access |
| Worker | /worker | 1 | Generic worker proxy call |
| Search | /search | 6 | Unified FTS5 + semantic search |
| Auth | /auth | 15 | Authentication and API key management |
| SDK | /sdk | 5 | SDK method catalog (221 methods) |
| Forge | /forge | 5 | Forge operations |
| LLM | /llm | 5 | Multi-model LLM inference |
| Webhooks | /webhooks | 5 | Webhook management |
| Versioning | /versioning | 4 | API versioning |
| AGI | /agi | 5 | AGI-level orchestration |
| Compose | /compose | 5 | Multi-engine composition |
| Data | /data | 4 | Data pipeline operations |
| Functions | /functions | 4 | Serverless function execution |

### Public Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /health | No | Gateway health with downstream probes |
| GET | /openapi.json | No | OpenAPI spec for GPT Actions import |

### Passthrough Proxies (24 workers)

| Path Prefix | Target Worker | Surface |
|-------------|---------------|---------|
| /brain-full | echo-shared-brain | 50+ endpoints |
| /swarm | echo-swarm-brain | 137 endpoints |
| /x200 | echo-x200-swarm-brain | 23 endpoints |
| /chat | echo-chat | All endpoints |
| /voice | echo-speak-cloud | All endpoints |
| /graph | echo-graph-rag | All endpoints |
| /arcanum | echo-arcanum | All endpoints |
| /memory | echo-memory-cortex | All endpoints |
| /mega | echo-mega-gateway-cloud | All endpoints |
| /fleet | echo-fleet-commander | All endpoints |
| /orchestrator | echo-ai-orchestrator | All endpoints |
| /doctrine | echo-doctrine-forge | All endpoints |
| /engine-cloud | echo-engine-cloud | All endpoints |
| /tools | echo-tool-discovery | All endpoints |
| /marketplace | echo-forge-marketplace | All endpoints |
| /hephaestion | hephaestion-forge | All endpoints |
| /daedalus | daedalus-forge | All endpoints |
| /forge-x | forge-x-cloud | All endpoints |
| /engine-forge | echo-engine-forge | All endpoints |
| /app-forge | echo-app-forge | All endpoints |
| /worker-forge | echo-worker-forge | All endpoints |
| /doctrine-forge | echo-doctrine-forge | All endpoints |
| /prompt-forge | prompt-forge-omega | All endpoints |
| /paypal | echo-paypal | All endpoints |

## Bindings

- **DB** (D1): `echo-sdk-gateway` — FTS5 search index
- **SDK_CATALOG** (D1): `echo-sdk-catalog` — 221 SDK methods across 30 modules
- **RATE_LIMIT** (KV): Rate limit tracking per API key
- **SEARCH_CACHE** (KV): Search result caching (<5ms reads)
- **VECTORS** (Vectorize): `sdk-gateway-vectors` — Semantic search embeddings
- **AI** (Workers AI): Embedding generation
- **ENGINE_RUNTIME** (Service): echo-engine-runtime
- **SHARED_BRAIN** (Service): echo-shared-brain
- **KNOWLEDGE_FORGE** (Service): echo-knowledge-forge
- **VAULT_API** (Service): echo-vault-api
- **GRAPH_RAG** (Service): echo-graph-rag
- Plus 20 additional service bindings for passthrough proxies

## Security

- API key auth via `X-Echo-API-Key` header (skips /health and /openapi.json)
- Per-key rate limiting via KV
- CORS: wildcard (GPT Actions compatible)
- OpenAPI spec generation for GPT Actions import

## Cron Triggers

- `*/15 * * * *` — Cache warming and index sync
- `0 * * * *` — Hourly full index rebuild
