# Echo GS343

Divine Overseer auto-healing system that monitors 262 Cloudflare Workers, diagnoses errors, and applies autonomous remediation.

## Purpose

GS343 is the autonomous health monitoring and error healing system for the entire Echo Prime fleet. It probes 262 workers across 3 tiers (revenue-critical, operational, and utility), ingests error signatures, matches them against 45,962+ healing templates, and applies autonomous fixes including redeployment and rollback via the Cloudflare API. Includes Phoenix auto-heal, pattern learning, diagnostics dashboards, and self-healing confidence scoring.

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /health | No | Health check with scan stats |
| GET | / | No | Service info and fleet overview |
| GET | /stats | Yes | Healing statistics |
| POST | /heal | Yes | Manually trigger healing for a worker |
| POST | /heal/auto | Yes | Auto-heal based on latest scan |
| GET | /heal/probe-test | Yes | Test probe connectivity |
| POST | /heal/scan | Yes | Trigger a full fleet health scan |
| GET | /heal/stats | Yes | Detailed healing statistics |
| GET | /heal/active | Yes | Currently active healing operations |
| GET | /heal/history | Yes | Healing history log |
| GET | /heal/unmatched | Yes | Unmatched errors (no template found) |
| GET | /heal/confidence | Yes | Healing confidence scores |
| GET | /heal/baselines | Yes | Worker health baselines |
| GET | /heal/score | Yes | Overall fleet health score |
| POST | /errors/ingest | Yes | Ingest a single error |
| POST | /errors/bulk-ingest | Yes | Bulk ingest errors |
| POST | /errors/from-logs | Yes | Extract errors from log text |
| POST | /templates/harvest | Yes | Auto-harvest templates from resolved errors |
| GET | /search | Yes | Search error templates |
| GET | /categories | Yes | List error categories |
| GET | /templates | Yes | List all healing templates |
| GET | /templates/:id | Yes | Get template by ID |
| POST | /templates | Yes | Create a healing template |
| PUT | /templates/:id | Yes | Update a template |
| DELETE | /templates/:id | Yes | Delete a template |
| POST | /templates/bulk | Yes | Bulk import templates |
| GET | /log | Yes | Error log |
| GET | /log/stats | Yes | Log statistics |
| POST | /seed | Yes | Seed initial templates |
| POST | /templates/decay | Yes | Apply confidence decay to stale templates |
| GET | /diagnostics/trends | Yes | Error trend analysis |
| GET | /diagnostics/worker/:name | Yes | Per-worker diagnostics |
| GET | /diagnostics/latency | Yes | Latency analysis across fleet |
| GET | /diagnostics/correlations | Yes | Error correlation detection |
| GET | /diagnostics/flapping | Yes | Flapping worker detection |
| GET | /diagnostics/mttr | Yes | Mean time to recovery stats |
| GET | /diagnostics/debug/:worker | Yes | Deep debug info for a worker |
| GET | /diagnostics/scans | Yes | Scan run history |
| GET | /diagnostics/scans/:runId | Yes | Specific scan run results |
| POST | /diagnostics/harvest-analytics | Yes | Harvest analytics data |
| GET | /diagnostics/self | Yes | GS343 self-diagnostics |
| POST | /init-schema | Yes | Initialize database schema |

## Bindings

- **DB** (D1): `echo-343-scanner` — Error templates, scan results, healing logs, baselines

## Security

- API key auth via `X-Echo-API-Key` or `Authorization: Bearer` header
- CORS allowlist: echo-ept.com, echo-op.com, localhost:3000, localhost:8787
- Error normalization (strips file paths, line numbers, memory addresses)
- SHA-256 error fingerprinting for deduplication

## Cron Triggers

- `*/5 * * * *` — Tiered fleet health scan (all T1 + all T2 + rotating 20 T3 workers per cycle)

## Architecture

Workers are organized into 3 probe tiers:
- **Tier 1** (12 workers): Revenue-critical — probed every cycle
- **Tier 2** (21 workers): Operational — probed every cycle
- **Tier 3** (229 workers): Rotating batch of 20 per cycle to stay under 50 subrequest limit
