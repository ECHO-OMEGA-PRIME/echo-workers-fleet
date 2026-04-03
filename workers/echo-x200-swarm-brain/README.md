# Echo X200 Swarm Brain

Trinity multi-AI swarm coordinator managing up to 200 agents across 13 AI providers with consensus-based decision making and cross-worker orchestration.

## Live URL

```
https://echo-x200-swarm-brain.bmcii1976.workers.dev
```

## Purpose

Echo X200 Swarm Brain is a specialized swarm intelligence layer that coordinates up to 200 AI agents across 13 different providers (OpenAI, Anthropic, Google, Azure, Groq, Together, Fireworks, DeepSeek, Mistral, Cohere, Perplexity, RunPod, and local Claude proxy). It implements Trinity consensus (multiple models vote on decisions), agent lifecycle management, and deep integration with the fleet's memory, voice, and engine systems via 11 service bindings.

## Authentication

All endpoints except `/health` require the `X-Echo-API-Key` header:

```bash
curl -s "https://echo-x200-swarm-brain.bmcii1976.workers.dev/health"
curl -s "https://echo-x200-swarm-brain.bmcii1976.workers.dev/agents" \
  -H "X-Echo-API-Key: <key>"
```

## Key Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /health | No | Health check with swarm status |
| GET | /agents | Yes | List all active agents |
| POST | /agents | Yes | Spawn a new agent |
| DELETE | /agents/:id | Yes | Terminate an agent |
| POST | /task | Yes | Submit a task to the swarm |
| GET | /tasks | Yes | List task queue and status |
| POST | /trinity | Yes | Trinity consensus vote across multiple providers |
| GET | /providers | Yes | List available AI providers and health |
| POST | /providers/test | Yes | Test a specific provider |
| GET | /consensus | Yes | View consensus history |
| POST | /broadcast | Yes | Broadcast message to all agents |
| GET | /metrics | Yes | Swarm performance metrics |
| POST | /scale | Yes | Scale agent count up or down |
| GET | /state | Yes | Full swarm state snapshot |
| POST | /restore | Yes | Restore swarm from snapshot |
| GET | /topology | Yes | Agent communication topology |
| POST | /coordinate | Yes | Cross-agent coordination request |
| POST | /knowledge | Yes | Query knowledge forge via swarm |
| POST | /speak | Yes | Voice output via Speak Cloud |
| POST | /chat | Yes | Chat interaction via swarm agents |
| POST | /engine | Yes | Route to engine runtime |
| POST | /memory | Yes | Swarm memory operations |
| GET | /analytics | Yes | Swarm analytics dashboard data |

## Architecture

```
Task Submission --> Auth --> Agent Selector --> Provider Router
                                 |                   |
                           State Cache (KV)    13 AI Providers
                                 |                   |
                           Task Queue          Trinity Consensus
                                 |                   |
                           D1 Persistence      Result Aggregation
                                                     |
                                              Memory + Brain Sync
```

### Cloudflare Bindings

| Binding | Type | Name/ID | Purpose |
|---------|------|---------|---------|
| DB | D1 | echo-x200-swarm | Agent state, task history, consensus logs |
| AGENT_STATE | KV | -- | Fast agent state cache |
| ANALYTICS | Analytics Engine | echo-x200-analytics | Swarm telemetry |

### Service Bindings (11 total)

| Binding | Service | Purpose |
|---------|---------|---------|
| SHARED_BRAIN | echo-shared-brain | Memory and context |
| SWARM_BRAIN | echo-swarm-brain | Parent swarm coordination |
| FLEET_COMMANDER | echo-fleet-commander | Fleet-level orchestration |
| ENGINE_RUNTIME | echo-engine-runtime | Engine query execution |
| KNOWLEDGE_FORGE | echo-knowledge-forge | Knowledge retrieval |
| SPEAK_CLOUD | echo-speak-cloud | Voice synthesis |
| CHAT | echo-chat | Chat interface |
| AI_ORCHESTRATOR | echo-ai-orchestrator | AI model routing |
| MEMORY_CORTEX | echo-memory-cortex | Deep memory operations |
| GRAPH_RAG | echo-graph-rag | Graph knowledge queries |
| SDK_GATEWAY | echo-sdk-gateway | SDK method access |

### Configuration

| Variable | Value | Description |
|----------|-------|-------------|
| MAX_AGENTS | 200 | Maximum concurrent agents |
| SWARM_MODE | x200 | Swarm operating mode |
| WORKER_VERSION | 1.1.0 | Current deployment version |

## Deployment

```bash
cd workers/echo-x200-swarm-brain
wrangler secret put ECHO_API_KEY
wrangler deploy
```
