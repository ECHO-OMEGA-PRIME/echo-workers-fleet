# Echo Arcanum

Sovereign prompt forge and template library with 70+ endpoints, multi-LLM competitive dispatch, and AI quality scoring.

## Purpose

Echo Arcanum is the central prompt management system for Echo Omega Prime. It provides a full lifecycle for prompt templates — creation, versioning, forking, A/B testing, bulk operations, and AI-powered quality scoring. The Forge subsystem offers 40-level evolution, 7 guilds, competitive swarm dispatch across 8 LLM providers, and an 11-gate quality system.

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /health | No | Health check with uptime and DB stats |
| GET | / | Yes | Service info and version |
| GET | /stats | Yes | Prompt library statistics |
| GET | /prompts | Yes | List prompts with pagination and filtering |
| GET | /prompts/dashboard | Yes | Dashboard overview of prompt library |
| GET | /prompts/search | Yes | Search prompts by query |
| GET | /prompts/domains | Yes | List all domains in taxonomy |
| GET | /prompts/categories | Yes | List prompt categories |
| POST | /prompts/categories | Yes | Create a new category |
| GET | /prompts/tags | Yes | List all tags |
| GET | /prompts/random | Yes | Get a random prompt |
| GET | /changelog | Yes | Prompt version changelog |
| GET | /taxonomy | Yes | Full domain taxonomy |
| POST | /prompts/bulk-ingest | Yes | Bulk import prompts |
| POST | /prompts | Yes | Create a new prompt |
| GET | /prompts/by-slug/:slug | Yes | Get prompt by URL slug |
| GET | /prompts/:id | Yes | Get prompt by ID |
| PUT | /prompts/:id | Yes | Update a prompt (creates new version) |
| DELETE | /prompts/:id | Yes | Delete a prompt |
| GET | /prompts/:id/versions | Yes | List all versions of a prompt |
| GET | /prompts/:id/diff | Yes | Diff between prompt versions |
| POST | /prompts/:id/rollback | Yes | Rollback prompt to a previous version |
| GET | /prompts/:id/export | Yes | Export prompt as portable JSON |
| POST | /prompts/:id/fork | Yes | Fork a prompt |
| POST | /prompts/:id/usage | Yes | Record prompt usage event |
| POST | /prompts/bulk-update | Yes | Bulk update prompts |
| POST | /prompts/bulk-archive | Yes | Bulk archive prompts |
| POST | /prompts/bulk-tag | Yes | Bulk add tags to prompts |
| POST | /select | Yes | 7-dimensional prompt selection |
| POST | /combine | Yes | Combine multiple prompts |
| POST | /generate | Yes | AI-generate a new prompt |
| GET | /prompts/:id/recommendations | Yes | Get recommended related prompts |
| POST | /validate | Yes | Validate prompt quality |
| GET | /fragments | Yes | List prompt fragments |
| POST | /fragments | Yes | Create a fragment |
| GET | /fragments/:id | Yes | Get fragment by ID |
| DELETE | /fragments/:id | Yes | Delete a fragment |
| POST | /compose | Yes | Compose prompt from fragments |
| GET | /chains | Yes | List prompt chains |
| POST | /chains | Yes | Create a chain |
| GET | /chains/:id | Yes | Get chain by ID |
| DELETE | /chains/:id | Yes | Delete a chain |
| POST | /prompts/:id/dependencies | Yes | Set prompt dependencies |
| GET | /prompts/:id/dependencies | Yes | Get prompt dependencies |
| POST | /ab-test | Yes | Create an A/B test |
| GET | /ab-test/:id | Yes | Get A/B test results |
| POST | /ab-test/:id/record | Yes | Record A/B test outcome |
| GET | /ab-tests | Yes | List all A/B tests |
| GET | /webhooks | Yes | List webhooks |
| POST | /webhooks | Yes | Register a webhook |
| DELETE | /webhooks/:id | Yes | Delete a webhook |
| GET | /export | Yes | Export entire prompt library |
| POST | /import | Yes | Import prompt library |
| GET | /marketplace | Yes | Browse prompt marketplace |
| POST | /prompts/:id/ai-score | Yes | AI quality scoring for a prompt |
| GET | /forge/evolution | Yes | Forge evolution status (40 levels) |
| GET | /forge/llm-leaderboard | Yes | LLM provider leaderboard |
| GET | /forge/projects | Yes | List forge projects |
| GET | /forge/projects/:id | Yes | Get forge project detail |
| GET | /forge/techniques | Yes | List 20 enhancement techniques |
| GET | /forge/guilds | Yes | List 7 forge guilds |
| GET | /forge/categories | Yes | Forge 29-category matrix |
| POST | /forge/detect-task | Yes | Auto-detect task type from prompt |
| POST | /forge/score | Yes | Score a prompt against quality gates |
| POST | /forge/quality-gates | Yes | Run 11-gate quality system |
| POST | /forge/analyze | Yes | Deep prompt analysis |
| POST | /forge/swarm | Yes | Competitive swarm dispatch (8 LLMs) |
| POST | /forge/build | Yes | Full forge pipeline build |
| POST | /forge/enhance | Yes | Enhance a prompt with techniques |
| POST | /forge/batch-enhance | Yes | Batch enhance multiple prompts |
| POST | /forge/review | Yes | AI review of prompt quality |
| GET | /forge/pipeline | Yes | Forge pipeline status |
| POST | /forge/evolve-check | Yes | Check evolution eligibility |
| POST | /forge/evolve | Yes | Evolve to next level |
| POST | /forge/generate | Yes | Generate prompt via forge |
| GET | /forge/stats | Yes | Forge statistics |

## Bindings

- **DB** (D1): `echo-prompt-forge` — Prompt templates, versions, A/B tests, fragments, chains
- **CACHE** (KV): Read-through cache for prompts and search results
- **AI** (Workers AI): Embedding generation and quality scoring
- **BUILD_OUTPUT** (R2): `echo-build-plans` — Exported prompt libraries and build artifacts
- **SHARED_BRAIN** (Service): echo-shared-brain — Cross-system memory sync
- **SWARM_BRAIN** (Service): echo-swarm-brain — MoltBook integration
- **AI_ORCHESTRATOR** (Service): echo-ai-orchestrator — Multi-LLM inference
- **ENGINE_RUNTIME** (Service): echo-engine-runtime — Domain engine queries
- **SDK_GATEWAY** (Service): echo-sdk-gateway — SDK access
- **ANALYTICS** (Analytics Engine): `echo_metrics` — Usage tracking

## Security

- API key auth via `X-Echo-API-Key` header (all routes except /health)
- Secret Sauce Firewall: 16 regex patterns block prompt injection, jailbreak, SQL injection, XSS
- Abuse detection: char floods, profanity, XSS attempts, data URI injection
- Rate limiting: 120 reads/min, 30 writes/min per IP
- CORS allowlist: echo-ept.com, echo-op.com, profinishusa.com, bgat.echo-op.com
- SHA-256 content hashing for deduplication
- Input validation and error sanitization

## Cron Triggers

- `0 6 * * *` — Morning prompt quality sweep
- `0 18 * * *` — Evening prompt quality sweep
- `0 0 * * SUN` — Weekly cleanup and consolidation
