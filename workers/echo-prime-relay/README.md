# Echo Prime Relay

Message relay and event bus for the Echo Prime service mesh with fan-out delivery, subscriptions, and dead letter queues.

## Purpose

Echo Prime Relay is the event bus connecting all Echo Omega Prime workers. It accepts events, matches them against subscriptions, and fans out delivery to target services via service bindings or HTTP endpoints. Supports batch relay, broadcast, dead letter queues for failed deliveries, and service-specific proxy endpoints for engine queries, chat generation, and notifications.

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | / | Yes | Service info |
| GET | /health | No | Health check |
| GET | /stats | Yes | Relay statistics (events relayed, failed, fan-outs) |
| POST | /relay | Yes | Relay a single event |
| POST | /relay/batch | Yes | Relay multiple events |
| POST | /relay/broadcast | Yes | Broadcast event to all subscribers |
| GET | /subscriptions | Yes | List active subscriptions |
| POST | /subscriptions | Yes | Create a subscription |
| DELETE | /subscriptions/:id | Yes | Remove a subscription |
| GET | /events | Yes | Recent event log |
| GET | /events/:id | Yes | Get specific event |
| GET | /dead-letter | Yes | View dead letter queue |
| POST | /dead-letter/retry | Yes | Retry dead letter events |
| POST | /dead-letter/purge | Yes | Purge dead letter queue |
| GET | /services | Yes | List available service bindings |
| GET | /event-types | Yes | List supported event types |
| POST | /notify | Yes | Send a notification via relay |
| POST | /alert | Yes | Send an alert via relay |
| POST | /engine/query | Yes | Proxy engine query via relay |
| POST | /chat/generate | Yes | Proxy chat generation via relay |

## Bindings

- **RELAY_KV** (KV): Subscriptions, event log, dead letter queue, relay stats
- **SHARED_BRAIN** (Service): echo-shared-brain — Memory system
- **SWARM_BRAIN** (Service): echo-swarm-brain — Agent coordination
- **ENGINE_RUNTIME** (Service): echo-engine-runtime — Engine queries
- **ECHO_CHAT** (Service): echo-chat — Chat generation
- **SPEAK_CLOUD** (Service): echo-speak-cloud — Voice synthesis

## Security

- API key auth via `X-Echo-API-Key` header (C43 fix: all routes except /health)
- Rate limiting: 100 requests/min per IP (H56 fix)
- CORS allowlist: echo-ept.com, echo-op.com
- Error sanitization — never returns raw error messages
- D1 audit write failures now logged (H57 fix)

## Event Types

engine.query, engine.result, engine.error, chat.message, chat.response, voice.request, voice.response, brain.ingest, brain.search, moltbook.post, notification.push, notification.broadcast, system.health, system.alert, build.started, build.completed, build.failed, scrape.job, scrape.result, user.action, admin.command
