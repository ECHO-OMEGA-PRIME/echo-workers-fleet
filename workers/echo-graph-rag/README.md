# Echo Graph RAG

Graph-based Retrieval Augmented Generation knowledge graph for the Echo Prime doctrine system.

## Purpose

Echo Graph RAG builds and queries a knowledge graph derived from the Echo Prime doctrine database. It extracts entities and relationships from doctrines, enabling graph traversal, community detection, subgraph extraction, and natural language queries over interconnected knowledge. Supports cross-domain relationship discovery and explainable RAG with cosine similarity scoring.

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /health | No | Health check with graph statistics |
| GET | / | Yes | Service info |
| GET | /graph/stats | Yes | Graph statistics (nodes, edges, domains) |
| GET | /graph/domains | Yes | List all knowledge domains |
| GET | /graph/node/:id | Yes | Get a specific graph node |
| GET | /graph/connections/:domain1/:domain2 | Yes | Cross-domain connections |
| POST | /graph/build | Yes | Build/rebuild the knowledge graph from doctrines |
| POST | /graph/query | Yes | Natural language graph query |
| POST | /graph/traverse | Yes | Multi-hop graph traversal |
| POST | /graph/community | Yes | Community detection |
| GET | /graph/search | Yes | Keyword search across graph nodes |
| GET | /graph/build-history | Yes | Graph build history |
| POST | /graph/explain | Yes | Explainable RAG with reasoning chains |
| POST | /graph/subgraph | Yes | Extract a subgraph around a topic |

## Bindings

- **DB** (D1): `echo-graph-rag` — Graph nodes, edges, build history
- **DOCTRINES_DB** (D1): `echo-doctrines` — Source doctrine database
- **CACHE** (KV): Query result caching (300s TTL)

## Security

- API key auth via `X-Echo-API-Key` header (C48 fix)
- Returns 503 if ECHO_API_KEY secret not configured
- Rate limiting: 100 requests/min per IP (in-memory)
- CORS allowlist: echo-ept.com, echo-op.com
- Error sanitization — never returns raw error messages
- Query time budgets: 8s for queries, 10s for traversals

## Configuration

| Constant | Value | Description |
|----------|-------|-------------|
| MAX_BATCH_SIZE | 500 | Max doctrines per build batch |
| MAX_HOPS | 5 | Maximum traversal depth |
| MAX_RESULTS | 50 | Maximum results per query |
| CACHE_TTL_SECONDS | 300 | Cache time-to-live |
