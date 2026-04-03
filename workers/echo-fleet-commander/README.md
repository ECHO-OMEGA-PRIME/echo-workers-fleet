# Echo Fleet Commander

Monitors, scores, and commands the entire Echo Prime Cloudflare worker fleet with health scanning, incident management, and topology mapping.

## Purpose

Echo Fleet Commander is the central fleet management system for all Echo Omega Prime Cloudflare Workers (60+ registered in the fleet registry). It performs periodic health scans across all tiers (T0 brain, T1 engine, T2 product, T3 utility), maintains a health history in D1, provides fleet-wide dashboards and briefings, manages incidents, and tracks deployment history. It serves as the single pane of glass for the entire worker fleet.

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | / | No | Health check with version |
| GET | /health | No | Health check (alias) |
| GET | /dashboard | Yes | Fleet dashboard with health scores |
| GET | /scan | Yes | Trigger fleet health scan |
| GET | /fleet/scan | Yes | Trigger fleet health scan (alias) |
| GET | /briefing | Yes | Fleet status briefing |
| GET | /registry | Yes | Full fleet registry (60+ workers) |
| GET | /search | Yes | Search workers by name/category |
| GET | /topology | Yes | Fleet dependency topology map |
| GET | /incidents | Yes | List active incidents |
| POST | /incidents/create | Yes | Create an incident |
| POST | /incidents/resolve | Yes | Resolve an incident |
| POST | /command | Yes | Execute a fleet command |
| GET | /commands | Yes | List available commands |
| GET | /deploys | Yes | Deployment history |
| GET | /uptime | Yes | Worker uptime statistics |
| GET | /history | Yes | Health check history |
| GET | /snapshots | Yes | Fleet state snapshots |
| GET | /briefings | Yes | Historical briefings |
| GET | /audit | Yes | Audit log |
| GET | /worker | Yes | Individual worker detail |
| GET | /stats | Yes | Fleet-wide statistics |

## Bindings

- **DB** (D1): `echo-fleet-commander` — Fleet health records, incidents, snapshots, audit
- **CACHE** (KV): Health check result caching
- **SHARED_BRAIN** (Service): echo-shared-brain — Memory sync
- **SWARM_BRAIN** (Service): echo-swarm-brain — Agent coordination
- **SERVICE_REGISTRY** (Service): echo-service-registry — Service mesh
- **DAEMON** (Service): echo-autonomous-daemon — Auto-remediation
- **OMNISYNC** (Service): omniscient-sync — Cross-instance sync

## Security

- API key auth via `X-Echo-API-Key` header (C45: returns 503 if key not configured)
- All SQL queries use parameterized bindings (C46)
- Error sanitization — no stack traces to clients (H59)
- CORS allowlist: echo-ept.com, echo-op.com
- Security headers: HSTS, X-Frame-Options DENY, CSP, nosniff

## Cron Triggers

- `*/5 * * * *` — Quick health scan (critical workers)
- `0 * * * *` — Hourly full fleet scan
- `0 */6 * * *` — Deep health analysis with scoring
- `0 9 * * *` — Daily morning briefing
- `0 0 * * SUN` — Weekly fleet report and cleanup
