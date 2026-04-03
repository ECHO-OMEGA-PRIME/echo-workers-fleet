# Echo Chat

Multi-site conversational AI system with personality engine, memory integration, voice output, and domain-specific routing across Echo Omega Prime properties.

## Live URL

```
https://echo-chat.bmcii1976.workers.dev
```

## Purpose

Echo Chat powers the conversational AI interface across multiple Echo websites (echo-ept.com, echo-op.com, and partner sites). It features a sophisticated personality system with multiple personas (Echo Prime, customer service, domain experts), emotion-aware responses, memory cortex integration for persistent conversation history, voice output via Speak Cloud, and domain-specific routing to specialized engines (landman, tax, legal, real estate, cyber). It uses Claude as the primary LLM via a proxy, with RunPod serverless vLLM as a secondary provider hosting 7 fine-tuned LoRA adapters.

## Authentication

All endpoints except `/health` require the `X-Echo-API-Key` header:

```bash
curl -s "https://echo-chat.bmcii1976.workers.dev/health"
curl -s -X POST "https://echo-chat.bmcii1976.workers.dev/chat" \
  -H "X-Echo-API-Key: <key>" \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello","personality":"EP"}'
```

## Key Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /health | No | Health check |
| POST | /chat | Yes | Send a chat message with personality routing |
| POST | /voice | Yes | Chat with voice response via Speak Cloud |
| GET | /history | Yes | Retrieve conversation history |
| GET | /personalities | Yes | List available chat personalities |
| POST | /context | Yes | Load conversation context from memory |
| POST | /engine | Yes | Route query to a specific engine |
| GET | /quota | Yes | Check usage quota |
| POST | /relay | Yes | Relay a command through the service mesh |
| POST | /cortex | Yes | Direct cortex memory interaction |
| GET | /services | Yes | List available downstream services |
| POST | /bloodline | Yes | Bloodline-authenticated commander operations |
| POST | /tax | Yes | Tax-specific query tools |
| POST | /search | Yes | Web search via ShadowGlass |
| POST | /chunk | Yes | Chunked response management |
| POST | /emotion | Yes | Emotion-aware response generation |
| GET | /domain | Yes | Domain detection and routing info |
| POST | /memory | Yes | Store/retrieve conversation memories |
| POST | /llm | Yes | Direct LLM completion request |

## Architecture

```
User Message --> Domain Detection --> Personality Selection --> Prompt Builder
                                          |                        |
                                    Emotion Engine           Memory Cortex
                                          |                        |
                                     LLM Router -----> Claude Proxy / RunPod vLLM
                                          |
                                    Voice Output (optional)
                                          |
                                    Engine Router (specialized queries)
```

### Cloudflare Bindings

| Binding | Type | Name/ID | Purpose |
|---------|------|---------|---------|
| DB | D1 | echo-chat | Conversation history, user sessions |
| CACHE | KV | -- | Session cache, personality configs |
| ANALYTICS | Analytics Engine | echo_metrics | Chat telemetry |

### Service Bindings (14 total)

| Binding | Service | Purpose |
|---------|---------|---------|
| ENGINE_RUNTIME_SVC | echo-engine-runtime | Specialized engine queries |
| SHARED_BRAIN_SVC | echo-shared-brain | Memory and context |
| MEMORY_PRIME_SVC | echo-memory-prime | Primary memory store |
| SENTINEL_MEMORY_SVC | echo-sentinel-memory | Security memory |
| SWARM_BRAIN_SVC | echo-swarm-brain | Swarm coordination |
| BUILD_ORCHESTRATOR_SVC | echo-build-orchestrator | Build status |
| KNOWLEDGE_FORGE_SVC | echo-knowledge-forge | Knowledge retrieval |
| OMNISYNC_SVC | omniscient-sync | State sync |
| SHADOWGLASS_SVC | shadowglass-v8-warpspeed | Web search/browsing |
| FORGEX_SVC | forge-x-cloud | Forge operations |
| ECHO_RELAY_SVC | echo-relay | Event relay |
| LANDMAN_PIPELINE_SVC | echo-landman-pipeline | Landman queries |
| OPENCLAW_SVC | openclaw-bridge | Legal research |
| SPEAK_CLOUD_SVC | echo-speak-cloud | Voice synthesis |

### Personalities

| ID | Name | Description |
|----|------|-------------|
| EP | Echo Prime | Default assistant personality |
| CS | Customer Service | Customer-facing support |
| Domain-specific | Various | Auto-selected based on query domain |

### LLM Providers

- **Primary**: Claude via proxy (`claude-proxy.echo-op.com`)
- **Secondary**: RunPod Serverless vLLM with 7 LoRA adapters (titlehound, doctrine-gen, landman, taxlaw, legal, realestate, cyber)

### Cron Triggers

| Schedule | Task |
|----------|------|
| `0 6 * * *` | Daily maintenance and cleanup |

## Deployment

```bash
cd workers/echo-chat
wrangler secret put ECHO_API_KEY
wrangler deploy
```
