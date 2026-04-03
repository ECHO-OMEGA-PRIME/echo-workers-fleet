# Echo Mega Gateway Cloud

Universal dynamic API proxy — D1-driven server and tool registry with runtime execution, no redeployment needed.

## Purpose

Echo Mega Gateway Cloud is a universal API proxy that reads server definitions and tool endpoints from D1 at runtime. Adding a new API integration is as simple as inserting a row — no code changes or redeployment required. It supports 15 categories of APIs (AI/ML, Finance, Security, etc.), dynamic auth resolution, rate limiting per server, and usage tracking. The gateway manages 1,878+ server definitions and 36,330+ tool endpoints.

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | / | Yes | Service info with stats summary |
| GET | /health | No | Health check with DB stats |
| GET | /stats | Yes | Full gateway statistics |
| GET | /search | Yes | Search tools and servers by keyword |
| GET | /servers | Yes | List all registered API servers |
| GET | /servers/:name | Yes | Get server detail by name |
| POST | /servers | Yes | Register a new API server |
| GET | /tools | Yes | List all tool endpoints |
| GET | /tools/:name | Yes | Get tool endpoint detail |
| POST | /tools | Yes | Register a new tool endpoint |
| POST | /tools/bulk | Yes | Bulk register tool endpoints |
| GET | /categories | Yes | List all 15 API categories |
| GET | /popular | Yes | Most-used tools |
| POST | /execute | Yes | Execute a tool (dynamic API proxy) |
| POST | /import/servers | Yes | Bulk import server definitions with tools |
| POST | /init-schema | Yes | Initialize D1 schema |
| POST | /seed | Yes | Seed default server definitions |
| DELETE | /rate-limits | Yes | Clear rate limit counters |

## Bindings

- **DB** (D1): `echo-mega-gateway` — Server definitions, tool endpoints, usage logs, rate limits
- **CACHE** (KV): Response caching and rate limit tracking
- **ANALYTICS** (Analytics Engine): `echo_metrics` — Execution metrics

## Security

- API key auth via `X-Echo-API-Key` header
- Dynamic auth resolution: bearer, basic, api_key_header, api_key_query, OAuth2, CF API token
- Per-server rate limiting (configurable RPM per server)
- Error sanitization on all responses
- CORS allowlist enforcement

## Categories

AI_ML, API, AUTOMATION, CLOUD, COMMUNICATION, DATA, DEVTOOLS, FINANCE, MEDIA, MONITORING, NETWORK, SECURITY, ECHO_INTERNAL, IOT, BLOCKCHAIN
