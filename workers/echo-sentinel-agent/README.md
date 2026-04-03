# Echo Sentinel Agent

Agentic AI backend powering the Sentinel product with real web search, knowledge retrieval, file access, and engine queries.

## Purpose

Echo Sentinel Agent is the backend for the Sentinel AI product on echo-ept.com. It provides a tool-augmented AI agent that can search the web via Brave Search, query the internal knowledge base and intelligence engines, read/write files on the Commander's drives, and browse web pages. It combines search results and knowledge context into a sovereign AI persona with real system awareness.

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | / | No | Service info |
| GET | /health | No | Health check |
| POST | /agent | Yes | Full agent interaction (message + tool use) |
| POST | /search | Yes | Web search via Brave Search API |
| POST | /file/read | Yes | Read a file from allowed paths |
| POST | /file/write | Yes | Write a file to allowed paths |
| POST | /browse | Yes | Fetch and extract content from a URL |

## Bindings

- **KNOWLEDGE_FORGE** (Service): echo-knowledge-forge — Knowledge retrieval
- **SHARED_BRAIN** (Service): echo-shared-brain — Memory operations
- **ENGINE_RUNTIME** (Service): echo-engine-runtime — Domain engine queries
- **ANALYTICS** (Analytics Engine): `echo_metrics` — Usage tracking

## Security

- API key auth via `X-Echo-API-Key` header (C44 security hardening)
- Timing-safe string comparison for auth
- File path validation: allowlist of drive prefixes (O:\, I:\, F:\, C:\, M:\)
- Path traversal blocking (.. and null bytes)
- URL blocklist for /browse: blocks private IPs, metadata endpoints, localhost, own CF workers (SSRF protection)
- CORS allowlist: echo-ept.com, echo-op.com, profinishusa.com, bgat.echo-op.com
- Security headers: HSTS, X-Frame-Options DENY, nosniff, CSP
