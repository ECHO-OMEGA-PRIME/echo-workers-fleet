# Echo Doctrine Forge

Autonomous doctrine generation engine with 24 FREE LLM providers, 40-level evolution, and Raistlin AI oversight.

## Purpose

Echo Doctrine Forge generates TIE Gold Standard doctrine blocks for the Echo Prime intelligence engine fleet. It uses a competitive multi-provider LLM architecture (Groq, Workers AI, DeepSeek, Together, OpenRouter, xAI, and more) to produce high-quality doctrine content. Raistlin Supreme, an AI overseer, reviews each batch for practitioner depth, regulatory rigor, and adversarial quality. The forge supports a 40-level evolution system from NOVICE to TRINITY_FIRST, with 7 specialized guilds.

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | / | Yes | Service info and version |
| GET | /health | No | Health check with provider status |
| GET | /providers | Yes | List available LLM providers |
| GET | /stats | Yes | Forge statistics and progress |
| GET | /queue | Yes | View engine generation queue |
| POST | /queue/add | Yes | Add engine to generation queue |
| POST | /seed | Yes | Seed engine definitions |
| POST | /forge | Yes | Generate doctrines for an engine |
| POST | /forge-burst | Yes | Burst-generate doctrines (multiple engines) |
| POST | /reset | Yes | Reset forge state |
| POST | /purge-low | Yes | Purge low-quality doctrines |
| POST | /regenerate-gold | Yes | Regenerate gold-standard doctrines |
| GET | /gold-stats | Yes | Gold standard generation statistics |
| POST | /topup | Yes | Top up doctrines for under-filled engines |
| POST | /admin/reset-stuck | Yes | Reset stuck engines |
| POST | /seed-engines | Yes | Bulk seed engine definitions |
| GET | /evolution | Yes | View 40-level evolution status |
| POST | /evolution/check | Yes | Check evolution eligibility |
| GET | /leaderboard | Yes | Provider performance leaderboard |
| GET | /quality-gates | Yes | Quality gate results |
| POST | /raistlin/review | Yes | Trigger Raistlin AI review |
| POST | /search | Yes | Search doctrines |
| GET | /marketplace | Yes | Doctrine marketplace |
| GET | /dashboard | Yes | Forge dashboard data |
| GET | /analytics | Yes | Forge analytics |

## Bindings

- **DB** (D1): `echo-engine-doctrines` — Doctrine storage
- **FORGE_DB** (D1): `echo-doctrine-forge` — Forge state, evolution, quality gates
- **AI** (Workers AI): Local LLM inference (Llama, Qwen)
- **CACHE** (KV): Provider response caching
- **AI_ORCHESTRATOR** (Service): echo-ai-orchestrator — Multi-LLM routing
- **SCANNER** (Service): echo-343-scanner — Error scanning
- **SHARED_BRAIN** (Service): echo-shared-brain — Raistlin review memory storage
- **SWARM_BRAIN** (Service): echo-swarm-brain — Agent coordination
- **X200_SWARM** (Service): echo-x200-swarm-brain — Extended swarm

## Security

- API key auth via `X-Echo-API-Key` header
- Quality gates enforce minimum doctrine standards
- Raistlin Supreme AI oversight rejects mediocre output
- Error sanitization on all responses

## Cron Triggers

- `*/2 * * * *` — Auto-generate doctrines for queued engines (10 engines per cycle, 200 doctrines per engine)

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| DOCTRINES_PER_ENGINE | 200 | Target doctrines per engine |
| ENGINES_PER_CRON | 10 | Engines processed per cron cycle |
| MIN_MANDATORY_YIELD | 3 | Minimum doctrines required per batch |
| MIN_QUALITY_SCORE | 6 | Minimum quality score (0-10) |
