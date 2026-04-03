# Echo Build Orchestrator

Autonomous build pipeline for 875+ intelligence engines with phased execution, quality gates, and cloud builds via Anthropic API.

## Purpose

Echo Build Orchestrator manages the multi-phase construction pipeline for the Echo Prime engine fleet. It tracks engine states (PLANNED, BUILDING, TESTING, PASSED, DEPLOYED, FAILED), dispatches builds to Claude Code terminals or the Anthropic API for cloud builds, enforces quality gates, and supports commander overrides. The orchestrator runs autonomously via cron, auto-advancing through 4 build phases.

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /health | No | Health check with phase and progress |
| GET | / | Yes | Full orchestrator status |
| GET | /status | Yes | Full orchestrator status (alias) |
| GET | /engines | Yes | List engines (filterable by ?tier and ?status) |
| GET | /engine/:id | Yes | Engine detail with gates and logs |
| POST | /build/trigger | Yes | Trigger orchestration cycle |
| POST | /build/force | Yes | Force-rebuild a specific engine |
| POST | /build/complete | Yes | Report build completion |
| POST | /build/cloud/:engineId | Yes | Trigger cloud build via Anthropic API |
| GET | /build/mode | Yes | Get current build mode (cloud/terminal) |
| POST | /build/mode | Yes | Set build mode |
| GET | /build/files/:engineId | Yes | List R2 files for an engine |
| GET | /build/file/:path | Yes | Download a specific build file |
| POST | /gates/report | Yes | Submit quality gate results |
| POST | /gates/define | Yes | Define a custom quality gate |
| GET | /gates/definitions | Yes | List all gate definitions |
| POST | /phase/advance | Yes | Manually advance to next phase |
| POST | /pause | Yes | Pause orchestration |
| POST | /resume | Yes | Resume orchestration |
| GET | /log | Yes | Build log (filterable by ?limit) |
| POST | /seed | Yes | Seed engine definitions |
| POST | /link-terminal | Yes | Link Claude Code terminal endpoint |
| POST | /plan/upload | Yes | Upload a build plan to R2 |
| GET | /plans | Yes | List all build plans |
| GET | /plan/active | Yes | Get the active build plan |
| POST | /override/:engineId/approve | Yes | Commander override: approve engine |
| POST | /override/:engineId/reject | Yes | Commander override: reject engine |
| POST | /alert/call | Yes | Dispatch an alert |

## Bindings

- **BUILD_DB** (D1): `echo-build-orchestrator` — Engine states, phases, gates, build logs
- **BUILD_PLANS** (R2): `echo-build-plans` — Build plans and generated engine source code
- **SCANNER** (Service): echo-343-scanner — Error scanning integration
- **OMNISYNC** (Service): omniscient-sync — Cross-instance state sync
- **ANALYTICS** (Analytics Engine): `echo_metrics` — Build metrics tracking

## Security

- API key auth via `X-Echo-API-Key` header (wrapped auth on all routes except /health)
- SSRF validation on /link-terminal URLs (H51 fix)
- Path traversal protection on /build/file/ (H52 fix)
- Body size limits enforced by auth wrapper
- Error sanitization — no raw error messages to clients
- All SQL queries parameterized (no interpolation)

## Cron Triggers

- `*/10 * * * *` — Auto-orchestration cycle: dispatch builds, check stale engines, advance phases
