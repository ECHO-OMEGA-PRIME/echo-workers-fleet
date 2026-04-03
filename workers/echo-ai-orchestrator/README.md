# Echo AI Orchestrator

Multi-model AI orchestration engine -- routes requests across 29 AI providers with automatic failover, queue-based async builds, and cost optimization.

## Live URL

```
https://echo-ai-orchestrator.bmcii1976.workers.dev
```

## Purpose

Echo AI Orchestrator is the central AI routing layer for the fleet. It manages connections to 29 AI model providers (OpenAI, Anthropic, Google, Azure, Groq, Together, Fireworks, DeepSeek, Mistral, Cohere, and more), handling provider selection, load balancing, failover chains, and cost tracking. It supports queue-based asynchronous builds via Cloudflare Queues with dead letter queues for failed jobs.

## Authentication

All endpoints except `/health` require the `X-Echo-API-Key` header:

```bash
curl -s "https://echo-ai-orchestrator.bmcii1976.workers.dev/health"
curl -s "https://echo-ai-orchestrator.bmcii1976.workers.dev/models" \
  -H "X-Echo-API-Key: <key>"
```

## Key Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /health | No | Health check and provider status |
| GET | /models | Yes | List available AI models across all providers |
| POST | /complete | Yes | Send completion request with auto-provider selection |
| POST | /chat | Yes | Chat completion with model routing |
| POST | /embed | Yes | Generate embeddings via optimal provider |
| POST | /build | Yes | Queue an async build job |
| GET | /queue/status | Yes | Check build queue depth and processing state |
| GET | /providers | Yes | List provider health and latency stats |
| POST | /providers/test | Yes | Test connectivity to a specific provider |
| GET | /costs | Yes | Cost tracking and usage analytics |

## Architecture

```
Request --> Auth --> Provider Selection --> Model Routing --> Response
                         |                      |
                    Cost Check            Failover Chain
                         |                      |
                    Queue (async)         Dead Letter Queue
```

### Cloudflare Bindings

| Binding | Type | Name/ID | Purpose |
|---------|------|---------|---------|
| DB | D1 | echo-ai-orchestrator | Provider configs, usage logs, cost tracking |
| CACHE | KV | -- | Response caching, provider health cache |
| R2 | R2 | echo-build-plans | Build plan storage for queued jobs |
| BUILD_QUEUE | Queue | ai-orchestrator-builds | Async build job processing |
| SWARM_BRAIN | Service | echo-swarm-brain | Agent coordination |
| SHARED_BRAIN | Service | echo-shared-brain | Memory and context |
| ANALYTICS | Analytics Engine | echo_metrics | Request telemetry |

### Queue Configuration

- **Queue**: `ai-orchestrator-builds`
- **Max batch size**: 1 (sequential processing)
- **Max retries**: 3
- **Dead letter queue**: `ai-orchestrator-dlq`

## Deployment

```bash
cd workers/echo-ai-orchestrator
wrangler secret put ECHO_API_KEY
wrangler deploy
```
