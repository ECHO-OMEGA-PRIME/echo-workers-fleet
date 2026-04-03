# Echo Tool Discovery

Universal tool catalog indexing 24.8 million functions across the entire Echo ecosystem -- searchable, categorized, and auto-updated.

## Live URL

```
https://echo-tool-discovery.bmcii1976.workers.dev
```

## Purpose

Echo Tool Discovery maintains a comprehensive index of every tool, function, endpoint, and capability available across the Echo infrastructure. With 24.8M+ indexed functions spanning MCP servers, SDK methods, engine capabilities, worker endpoints, and third-party APIs, it enables any AI instance to discover and invoke the right tool for any task. It integrates with the SDK Gateway for method resolution and the Knowledge Forge for capability documentation.

## Authentication

All endpoints except `/health` require the `X-Echo-API-Key` header:

```bash
curl -s "https://echo-tool-discovery.bmcii1976.workers.dev/health"
curl -s "https://echo-tool-discovery.bmcii1976.workers.dev/search?q=file+read" \
  -H "X-Echo-API-Key: <key>"
```

## Key Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /health | No | Health check with index stats |
| GET | /stats | Yes | Index statistics (total functions, categories, sources) |
| GET | /search | Yes | Search tools by keyword |
| POST | /search | Yes | Advanced search with filters and facets |
| GET | /tools/:id | Yes | Get full tool definition |
| POST | /tools | Yes | Register a new tool |
| PUT | /tools/:id | Yes | Update tool metadata |
| DELETE | /tools/:id | Yes | Remove a tool from index |
| GET | /categories | Yes | List tool categories |
| GET | /categories/:name | Yes | List tools in a category |
| GET | /sources | Yes | List indexed sources (MCP servers, APIs, etc.) |
| POST | /index | Yes | Trigger reindexing of a source |
| POST | /bulk/index | Yes | Bulk index tools from a source |
| GET | /recommend | Yes | Get tool recommendations for a task description |
| POST | /resolve | Yes | Resolve a natural language tool request to specific tools |
| GET | /schema/:id | Yes | Get JSON schema for a tool's parameters |
| POST | /validate | Yes | Validate a tool invocation before execution |
| GET | /popular | Yes | Most-used tools ranking |
| GET | /recent | Yes | Recently added/updated tools |
| POST | /scan | Yes | Scan a worker/server for new tools |
| GET | /duplicates | Yes | Find duplicate or overlapping tools |

## Architecture

```
Discovery Request --> Auth --> Search Engine (D1 FTS + KV Cache)
                                    |
                              Tool Resolution
                              /      |       \
                        SDK Gateway  Engine RT  Knowledge Forge
                              |
                        Schema Validation
                              |
                        Tool Invocation Guide
```

### Cloudflare Bindings

| Binding | Type | Name/ID | Purpose |
|---------|------|---------|---------|
| DB | D1 | echo-tool-discovery | Tool index, metadata, usage stats |
| CACHE | KV | -- | Search result caching, popular tools |
| ANALYTICS | Analytics Engine | echo_metrics | Search and usage telemetry |

### Service Bindings

| Binding | Service | Purpose |
|---------|---------|---------|
| SDK_GATEWAY | echo-sdk-gateway | SDK method resolution |
| ENGINE_RUNTIME | echo-engine-runtime | Engine capability queries |
| KNOWLEDGE_FORGE | echo-knowledge-forge | Tool documentation |

### Cron Triggers

| Schedule | Task |
|----------|------|
| `0 */12 * * *` | Reindex all sources, update stats |
| `0 0 * * 1` | Weekly full scan and deduplication |

## Deployment

```bash
cd workers/echo-tool-discovery
wrangler secret put ECHO_API_KEY
wrangler deploy
```
