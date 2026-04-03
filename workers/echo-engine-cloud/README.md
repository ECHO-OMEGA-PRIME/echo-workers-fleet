# Echo Engine Cloud

Engine runtime platform with tiered API access, doctrine-powered queries, ShadowGlass web scraping, and multi-engine orchestration across the Echo knowledge base.

## Live URL

```
https://echo-engine-cloud.bmcii1976.workers.dev
```

## Purpose

Echo Engine Cloud is the production runtime for Echo's 78+ specialized AI engines. It provides a tiered API access system (Free/Professional/Business/Enterprise) with rate limiting per tier, doctrine-powered query processing, integration with ShadowGlass for live web data, and audit logging to R2. Engines cover domains including oil and gas, legal, tax, real estate, cybersecurity, landman operations, and more.

## Authentication

All endpoints except `/health` require the `X-Echo-API-Key` header:

```bash
curl -s "https://echo-engine-cloud.bmcii1976.workers.dev/health"
curl -s "https://echo-engine-cloud.bmcii1976.workers.dev/engines" \
  -H "X-Echo-API-Key: <key>"
```

## Key Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /health | No | Health check with engine count |
| GET | /engines | Yes | List all available engines |
| GET | /engines/:id | Yes | Get engine details and capabilities |
| POST | /query | Yes | Execute a query against a specific engine |
| POST | /query/multi | Yes | Query multiple engines simultaneously |
| POST | /query/doctrine | Yes | Doctrine-enhanced query with context |
| GET | /doctrines | Yes | List available doctrines |
| GET | /doctrines/:engine | Yes | Get doctrines for a specific engine |
| POST | /scrape | Yes | ShadowGlass-powered web scraping |
| GET | /keys | Yes | API key management |
| POST | /keys/generate | Yes | Generate new API key |
| GET | /keys/:key/usage | Yes | Usage stats for an API key |
| GET | /rate-limit | Yes | Check current rate limit status |
| GET | /audit | Yes | Query audit trail |
| POST | /schema | Yes | Initialize/migrate database schema |
| GET | /stats | Yes | Engine usage statistics |
| GET | /tiers | Yes | List API access tiers and limits |

## Architecture

```
API Request --> Auth + Tier Check --> Rate Limiter --> Engine Router
                                          |                |
                                    KV Rate Limit    Doctrine Lookup (D1)
                                                          |
                                                    Query Processor
                                                    /     |      \
                                            Engine RT  ShadowGlass  Swarm Brain
                                                          |
                                                    R2 Audit Log
```

### Cloudflare Bindings

| Binding | Type | Name/ID | Purpose |
|---------|------|---------|---------|
| DB | D1 | echo-engine-cloud | Engine configs, query logs, API keys |
| DOCTRINES | D1 | echo-engine-doctrines | Doctrine storage and lookup |
| KEYS | KV | -- | API key validation and tier mapping |
| RATE_LIMIT | KV | -- | Per-key rate limiting counters |
| AUDIT | R2 | echo-prime-vault | Audit trail storage |
| ANALYTICS | Analytics Engine | echo_metrics | Usage telemetry |

### Service Bindings

| Binding | Service | Purpose |
|---------|---------|---------|
| SHADOWGLASS | shadowglass-v8-warpspeed | Live web data scraping |
| ENCORE | encore-cloud-scraper | Cloud scraping fallback |
| SHARED_BRAIN | echo-shared-brain | Memory and context |
| SWARM_BRAIN | echo-swarm-brain | Swarm coordination |
| SCANNER | echo-343-scanner | Error scanning |
| ENGINE_RUNTIME | echo-engine-runtime | Engine execution |

### API Tiers

| Tier | Queries/Month | Description |
|------|--------------|-------------|
| Free | 3 | Trial access |
| Professional | 250 | Individual users |
| Business | 1,000 | Teams and businesses |
| Enterprise | 5,000 | Unlimited priority access |

### Cron Triggers

| Schedule | Task |
|----------|------|
| `0 */6 * * *` | Usage aggregation and cleanup |

## Deployment

```bash
cd workers/echo-engine-cloud
wrangler secret put ECHO_API_KEY
wrangler deploy
```
