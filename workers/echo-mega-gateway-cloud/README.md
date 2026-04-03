<div align="center">

```
 _____ ____ _   _  ___    __  __ _____ ____    _       ____    _  _____ _______        ___ __   __
| ____/ ___| | | |/ _ \  |  \/  | ____/ ___|  / \     / ___|  / \|_   _| ____\ \      / / \\ \ / /
|  _|| |   | |_| | | | | | |\/| |  _|| |  _  / _ \   | |  _  / _ \ | | |  _|  \ \ /\ / / _ \\ V /
| |__| |___|  _  | |_| | | |  | | |__| |_| |/ ___ \  | |_| |/ ___ \| | | |___  \ V  V / ___ \| |
|_____\____|_| |_|\___/  |_|  |_|_____\____/_/   \_\  \____/_/   \_\_| |_____|  \_/\_/_/   \_\_|
```

### Universal Dynamic API Proxy

**1,878 Servers** -- **36,330 Tools** -- **15 Categories** -- **Zero Cold Starts**

[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?style=flat-square&logo=cloudflare&logoColor=white)](https://workers.cloudflare.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Hono](https://img.shields.io/badge/Hono-4.6-E36002?style=flat-square&logo=hono&logoColor=white)](https://hono.dev)
[![D1](https://img.shields.io/badge/Cloudflare-D1-F38020?style=flat-square&logo=cloudflare&logoColor=white)](https://developers.cloudflare.com/d1/)
[![KV](https://img.shields.io/badge/Cloudflare-KV_Cache-F38020?style=flat-square&logo=cloudflare&logoColor=white)](https://developers.cloudflare.com/kv/)
[![Version](https://img.shields.io/badge/version-2.0.0-blue?style=flat-square)](https://github.com/bobmcwilliams4/echo-mega-gateway-cloud)
[![Bundle](https://img.shields.io/badge/bundle-142_KB_(32.7_KB_gz)-green?style=flat-square)](#performance)
[![Startup](https://img.shields.io/badge/startup-16ms-brightgreen?style=flat-square)](#performance)

---

**Live:** [`https://echo-mega-gateway-cloud.bmcii1976.workers.dev`](https://echo-mega-gateway-cloud.bmcii1976.workers.dev)

</div>

---

## What Is It

ECHO MEGA Gateway is a **universal dynamic API proxy** built on Cloudflare Workers. It provides a single unified endpoint that can route requests to any of **1,878 registered API servers** and execute any of **36,330 tool endpoints** -- without hardcoded integrations.

The core innovation: **the D1 database schema IS the implementation.** Every server definition, authentication method, endpoint path, request body template, and response extraction rule lives in D1 rows. Adding a new API integration is a single `INSERT` statement. No code changes. No redeployment.

The gateway resolves authentication credentials at runtime from Workers secrets, constructs the appropriate HTTP request using path templates and body templates from the database, executes the proxied call, extracts the relevant response data, and returns a normalized result -- all in a single `POST /execute` call.

---

## Architecture Overview

```
                                ECHO MEGA GATEWAY v2.0
                         Universal Dynamic API Proxy Flow

    Client                    Gateway (Cloudflare Worker)                    Target API
    ------                    --------------------------                    ----------

  POST /execute    ------>   [1] Auth Check (API Key)
  {                           |
    server: "openai",         |-- Reject if unauthorized
    tool: "chat",        [2] D1 Lookup
    params: {...}             |-- SELECT server + tool definitions
  }                           |-- Resolve path_template, body_template
                              |-- Identify auth_type, auth_key_name
                         [3] Auth Resolution
                              |-- Read secret from env[auth_key_name]
                              |-- Build auth headers (Bearer/Basic/API Key/Custom)
                              |
                         [4] Rate Limit Check
                              |-- Check rate_limits table
                              |-- Enforce per-server RPM limits
                              |
                         [5] Request Construction
                              |-- Substitute {{params}} in path_template
                              |-- Substitute {{params}} in body_template
                              |-- Set Content-Type, method, headers
                              |
                         [6] Dynamic Fetch  -------->  Target API Server
                              |                             |
                         [7] Response Processing  <--------'
                              |-- Extract via response_path (dot notation)
                              |-- Normalize to standard envelope
                              |-- Log to usage_log + Analytics Engine
                              |
    <------  {                |
               success: true,
               data: {...},
               meta: {
                 server, tool,
                 response_time_ms
               }
             }
```

---

## Key Features

| Feature | Description |
|---|---|
| **Dynamic Proxy Engine** | Routes to 1,878 servers without hardcoded integrations. Server definitions live entirely in D1. |
| **3 Proxy Strategies** | Direct URL proxy, path-template proxy with parameter substitution, body-template proxy with JSON construction. |
| **Runtime Auth Resolution** | Reads API keys from Workers secrets at execution time. Supports Bearer, Basic, API Key Header, API Key Query, OAuth2, Cloudflare API Token, and custom auth. |
| **Body Template Substitution** | JSON body templates with `{{param_name}}` placeholders are filled from request params at runtime. |
| **Response Extraction** | Dot-notation `response_path` (e.g., `choices.0.message.content`) extracts nested values from upstream responses. |
| **Per-Server Rate Limiting** | Configurable RPM limits per server, tracked in D1 with automatic window rotation. |
| **KV Response Cache** | Frequently accessed data cached in Cloudflare KV for sub-millisecond repeated reads. |
| **Analytics Engine** | Every execution logged to Cloudflare Analytics Engine for real-time metrics and dashboards. |
| **Bulk Registration** | Register hundreds of servers and tools in a single `POST /servers/bulk` call with automatic tool count rollup. |
| **Full-Text Search** | Search across all servers and tools by name, description, or category. |
| **Zero Cold Starts** | Cloudflare Workers V8 isolate architecture -- 16ms startup, globally distributed. |
| **142 KB Bundle** | Entire gateway compiles to 142 KB (32.7 KB gzipped). Single file, zero external runtime dependencies. |

---

## Quick Start

### Health Check

```bash
curl https://echo-mega-gateway-cloud.bmcii1976.workers.dev/health
```

```json
{
  "status": "operational",
  "service": "echo-mega-gateway-cloud",
  "version": "2.0.0",
  "servers": 1878,
  "tools": 36330,
  "categories": 15
}
```

### Execute a Tool

```bash
curl -X POST https://echo-mega-gateway-cloud.bmcii1976.workers.dev/execute \
  -H "Content-Type: application/json" \
  -H "X-Echo-API-Key: YOUR_API_KEY" \
  -d '{
    "server": "openai",
    "tool": "chat_completions",
    "params": {
      "model": "gpt-4",
      "messages": [{"role": "user", "content": "Hello"}]
    }
  }'
```

### List Servers

```bash
# All servers
curl https://echo-mega-gateway-cloud.bmcii1976.workers.dev/servers

# By category
curl https://echo-mega-gateway-cloud.bmcii1976.workers.dev/servers?category=AI_ML

# Search
curl https://echo-mega-gateway-cloud.bmcii1976.workers.dev/servers?search=openai
```

### List Tools

```bash
# Tools for a specific server
curl https://echo-mega-gateway-cloud.bmcii1976.workers.dev/tools?server=openai

# Search across all tools
curl https://echo-mega-gateway-cloud.bmcii1976.workers.dev/tools?search=embeddings

# By category
curl https://echo-mega-gateway-cloud.bmcii1976.workers.dev/tools?category=AI_ML
```

### Platform Stats

```bash
curl https://echo-mega-gateway-cloud.bmcii1976.workers.dev/stats
```

```json
{
  "total_servers": 1878,
  "total_tools": 36330,
  "categories": 15,
  "category_breakdown": { "DATA": 374, "AI_ML": 247, "..." : "..." },
  "top_servers": [ "..." ],
  "active_servers": 1878,
  "uptime_since": "2026-04-01T00:00:00Z"
}
```

---

## API Reference

### Public Endpoints (No Auth Required)

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Gateway info and quick stats |
| `GET` | `/health` | Health check with server/tool counts |
| `GET` | `/stats` | Full platform statistics and category breakdown |
| `GET` | `/servers` | List all servers (supports `?category=`, `?search=`, `?status=`, `?limit=`, `?offset=`) |
| `GET` | `/servers/:name` | Get detailed server definition by name |
| `GET` | `/tools` | List tools (supports `?server=`, `?category=`, `?search=`, `?limit=`, `?offset=`) |
| `GET` | `/tools/:id` | Get tool endpoint definition by ID |
| `GET` | `/categories` | List all categories with descriptions and counts |

### Authenticated Endpoints (Require `X-Echo-API-Key` Header)

| Method | Path | Description |
|---|---|---|
| `POST` | `/execute` | Execute a tool on any registered server |
| `POST` | `/servers` | Register a new server |
| `POST` | `/servers/bulk` | Bulk register servers with their tools |
| `PUT` | `/servers/:name` | Update a server definition |
| `DELETE` | `/servers/:name` | Remove a server and its tools |
| `POST` | `/tools` | Register a new tool endpoint |
| `PUT` | `/tools/:id` | Update a tool endpoint |
| `DELETE` | `/tools/:id` | Remove a tool endpoint |
| `POST` | `/schema/init` | Initialize or migrate the D1 schema |

### Execute Request Body

```typescript
{
  server?: string;       // Server name (optional if tool name is globally unique)
  tool: string;          // Tool name to execute
  params?: {             // Parameters passed to path/body templates
    [key: string]: any;
  };
  timeout_ms?: number;   // Request timeout (default: 30000)
}
```

### Execute Response Envelope

```typescript
{
  success: boolean;
  data: any;             // Extracted response (via response_path or full body)
  meta: {
    server: string;
    tool: string;
    response_time_ms: number;
    proxy_strategy: "direct" | "path_template" | "body_template";
    cached: boolean;
  };
  error?: string;        // Present only on failure
}
```

---

## How It Works

### 1. Three Proxy Strategies

The gateway selects a proxy strategy based on the tool's configuration:

| Strategy | When Used | How It Works |
|---|---|---|
| **Direct URL** | Tool has `cloud_endpoint` set | Fetches the URL directly with auth headers. Simplest path. |
| **Path Template** | Tool has `path_template` with `{{placeholders}}` | Substitutes params into the URL path. Example: `/v1/models/{{model_id}}` becomes `/v1/models/gpt-4`. |
| **Body Template** | Tool has `body_template` with `{{placeholders}}` | Builds a JSON request body from the template, substituting param values. Used for complex POST/PUT APIs. |

### 2. Dynamic Path Resolution

Path templates use double-brace syntax. Given a tool with:

```
path_template: /v1/chat/completions
body_template: {"model": "{{model}}", "messages": {{messages}}}
```

And params `{ "model": "gpt-4", "messages": [{"role": "user", "content": "Hi"}] }`, the gateway constructs:

```
POST https://api.openai.com/v1/chat/completions
Body: {"model": "gpt-4", "messages": [{"role": "user", "content": "Hi"}]}
```

### 3. Auth Resolution

Authentication credentials are never stored in D1. Instead, each server record stores an `auth_key_name` that references a Cloudflare Workers secret. At execution time:

```
Server row:  auth_type = "bearer", auth_key_name = "OPENAI_API_KEY"
Runtime:     env["OPENAI_API_KEY"] --> "sk-abc123..."
Headers:     { "Authorization": "Bearer sk-abc123..." }
```

Supported auth types:

| Auth Type | Header Generated |
|---|---|
| `bearer` | `Authorization: Bearer <key>` |
| `basic` | `Authorization: Basic <key>` |
| `api_key_header` | `X-API-Key: <key>` |
| `api_key_query` | Appended as `?api_key=<key>` to URL |
| `cf_api_token` | `Authorization: Bearer <key>` |
| `oauth2` | `Authorization: Bearer <key>` |
| `custom` | Uses server's `auth_header_name` and `auth_header_prefix` |
| `none` | No auth headers |

### 4. Body Template Substitution

Templates support both string values and raw JSON insertion:

```json
{
  "model": "{{model}}",
  "temperature": "{{temperature}}",
  "messages": "{{messages}}"
}
```

- String params are inserted as-is: `"{{model}}"` --> `"gpt-4"`
- Array/object params are serialized: `"{{messages}}"` --> `[{"role":"user","content":"Hi"}]`

### 5. Response Extraction

The `response_path` field uses dot notation to extract nested values:

| response_path | Input | Output |
|---|---|---|
| `choices.0.message.content` | `{"choices":[{"message":{"content":"Hello"}}]}` | `"Hello"` |
| `data` | `{"data":[1,2,3]}` | `[1,2,3]` |
| `results.items` | `{"results":{"items":[...]}}` | `[...]` |
| *(empty)* | `{"full":"response"}` | `{"full":"response"}` |

---

## Architecture

### Project Structure

```
echo-mega-gateway-cloud/
|-- src/
|   |-- index.ts              # Complete gateway (single-file architecture)
|-- scripts/
|   |-- populate.ts           # D1 bulk population script
|-- wrangler.toml             # Cloudflare Workers configuration
|-- package.json              # Dependencies (hono only)
|-- tsconfig.json             # TypeScript config
|-- MEGA_GATEWAY_REGISTRY.txt # Full server registry reference
|-- README.md                 # This file
```

### Infrastructure Bindings

| Binding | Type | Purpose |
|---|---|---|
| `DB` | D1 Database | Server definitions, tool endpoints, usage logs, rate limits |
| `CACHE` | KV Namespace | Response caching for frequently accessed data |
| `ANALYTICS` | Analytics Engine | Real-time execution metrics and dashboards |
| `ECHO_API_KEY` | Secret | Gateway authentication key |
| `*` (dynamic) | Secrets | Per-server API keys resolved by `auth_key_name` at runtime |

### Performance

| Metric | Value |
|---|---|
| Bundle Size | 142 KB (32.7 KB gzipped) |
| Cold Start | 16ms |
| Warm Invocation | < 5ms + upstream latency |
| Global Distribution | 300+ Cloudflare edge locations |
| Runtime Dependencies | 1 (Hono) |

---

## D1 Schema

### `servers` Table

```sql
CREATE TABLE servers (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    server_name         TEXT NOT NULL UNIQUE,
    category            TEXT NOT NULL,
    description         TEXT,
    tool_count          INTEGER DEFAULT 0,
    is_cloud            INTEGER DEFAULT 0,
    cloud_url           TEXT,
    status              TEXT DEFAULT 'active',
    api_base_url        TEXT,
    auth_type           TEXT DEFAULT 'none',
    auth_key_name       TEXT,
    auth_header_name    TEXT DEFAULT 'Authorization',
    auth_header_prefix  TEXT DEFAULT 'Bearer',
    api_pattern         TEXT DEFAULT 'rest_json',
    rate_limit_rpm      INTEGER DEFAULT 60,
    default_timeout_ms  INTEGER DEFAULT 30000,
    created_at          TEXT DEFAULT (datetime('now')),
    updated_at          TEXT DEFAULT (datetime('now'))
);
```

### `tools` Table

```sql
CREATE TABLE tools (
    id                   INTEGER PRIMARY KEY AUTOINCREMENT,
    server_id            INTEGER REFERENCES servers(id),
    tool_name            TEXT NOT NULL,
    description          TEXT,
    category             TEXT,
    http_method          TEXT DEFAULT 'GET',
    path_template        TEXT DEFAULT '/',
    query_params_schema  TEXT,
    body_schema          TEXT,
    body_template        TEXT,
    response_path        TEXT,
    content_type         TEXT DEFAULT 'application/json',
    parameters           TEXT,
    cloud_endpoint       TEXT,
    is_available         INTEGER DEFAULT 1,
    usage_count          INTEGER DEFAULT 0,
    last_used_at         TEXT,
    created_at           TEXT DEFAULT (datetime('now'))
);
```

### Supporting Tables

```sql
-- Execution audit log
CREATE TABLE usage_log (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    tool_name       TEXT NOT NULL,
    server_name     TEXT,
    success         INTEGER DEFAULT 1,
    response_time_ms INTEGER,
    error_message   TEXT,
    created_at      TEXT DEFAULT (datetime('now'))
);

-- Per-server rate limit tracking
CREATE TABLE rate_limits (
    server_name    TEXT NOT NULL,
    window_start   TEXT NOT NULL,
    request_count  INTEGER DEFAULT 0,
    PRIMARY KEY (server_name, window_start)
);
```

---

## Category Breakdown

```
  CATEGORY          SERVERS   TOOLS    DISTRIBUTION
  ----------------------------------------------------------------
  DATA              374       7,265    ==================== 20.0%
  AI_ML             247       4,965    ============= 13.7%
  MEDIA             194       3,541    ========== 9.7%
  CLOUD             170       3,419    ========= 9.4%
  SECURITY          135       2,685    ======= 7.4%
  FINANCE           133       2,445    ======= 6.7%
  MONITORING        111       2,442    ====== 6.7%
  COMMUNICATION     118       2,222    ====== 6.1%
  DEVTOOLS          117       2,181    ====== 6.0%
  AUTOMATION         85       1,565    ===== 4.3%
  NETWORK            60       1,118    === 3.1%
  BLOCKCHAIN         52         950    === 2.6%
  API                42         797    == 2.2%
  IOT                20         375    = 1.0%
  ECHO_INTERNAL      20         360    = 1.0%
  ----------------------------------------------------------------
  TOTAL           1,878      36,330                       100.0%
```

**Category Descriptions:**

| Category | Description |
|---|---|
| `DATA` | Data processing, ETL, databases, vector stores, search, analytics, scraping |
| `AI_ML` | Artificial Intelligence and Machine Learning -- LLM inference, embeddings, vision, training, agents |
| `MEDIA` | Media processing -- images, audio, video, TTS, STT, OCR, streaming |
| `CLOUD` | Cloud infrastructure -- Cloudflare, AWS, Azure, GCP, DigitalOcean, Vercel |
| `SECURITY` | Vulnerability scanning, credential management, encryption, SIEM |
| `FINANCE` | Financial services -- Stripe, crypto, DeFi, trading, accounting, invoicing |
| `MONITORING` | System monitoring, alerting, logging, performance, APM, health checks |
| `COMMUNICATION` | Messaging, email, Slack, Discord, Twilio, Teams, notifications |
| `DEVTOOLS` | Developer tools -- git, linting, testing, debugging, code generation, CI/CD |
| `AUTOMATION` | Workflow automation, task scheduling, CI/CD, build pipelines, orchestration |
| `NETWORK` | Network tools -- DNS, proxies, VPN, tunnels, firewalls, scanning, CDN |
| `BLOCKCHAIN` | Blockchain, DeFi, Web3, smart contracts, NFTs, wallets |
| `API` | API management, gateway, documentation, testing, integration, proxy tools |
| `IOT` | IoT, smart home, MQTT, hardware, embedded systems |
| `ECHO_INTERNAL` | ECHO OMEGA PRIME internal workers and systems |

---

## Complete Server Registry

The full listing of all 1,878 registered servers and their tool counts is maintained in the companion file:

**[`MEGA_GATEWAY_REGISTRY.txt`](./MEGA_GATEWAY_REGISTRY.txt)**

You can also query the live registry at any time:

```bash
# List all servers with pagination
curl "https://echo-mega-gateway-cloud.bmcii1976.workers.dev/servers?limit=50&offset=0"

# Filter by category
curl "https://echo-mega-gateway-cloud.bmcii1976.workers.dev/servers?category=AI_ML"

# Search by name or description
curl "https://echo-mega-gateway-cloud.bmcii1976.workers.dev/servers?search=stripe"
```

---

## Deployment

### Prerequisites

- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) v3.99+
- Node.js 18+
- Cloudflare account with Workers, D1, KV, and Analytics Engine enabled

### Deploy

```bash
# Install dependencies
npm install

# Deploy to Cloudflare Workers
npm run deploy
# or
wrangler deploy

# Initialize the D1 schema (one-time, after first deploy)
curl -X POST https://echo-mega-gateway-cloud.bmcii1976.workers.dev/schema/init \
  -H "X-Echo-API-Key: YOUR_API_KEY"

# Populate the server registry
npm run populate
```

### Local Development

```bash
npm run dev
# Gateway available at http://localhost:8787
```

### View Logs

```bash
npm run tail
# or
wrangler tail echo-mega-gateway-cloud
```

---

## Environment and Secrets

### Required Secrets

Set via `wrangler secret put`:

| Secret | Purpose |
|---|---|
| `ECHO_API_KEY` | Gateway authentication key for write/execute operations |

### Dynamic Secrets

Each registered server can reference a secret by its `auth_key_name` field. These are resolved at runtime from the Workers environment. For example, if a server has `auth_key_name = "OPENAI_API_KEY"`, you must set:

```bash
wrangler secret put OPENAI_API_KEY
# Enter the API key when prompted
```

The gateway will automatically resolve `env["OPENAI_API_KEY"]` when executing tools on that server.

### Environment Variables

Configured in `wrangler.toml` under `[vars]`:

| Variable | Default | Purpose |
|---|---|---|
| `ENVIRONMENT` | `production` | Runtime environment identifier |

### Bindings

Configured in `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "echo-mega-gateway"

[[kv_namespaces]]
binding = "CACHE"

[[analytics_engine_datasets]]
binding = "ANALYTICS"
dataset = "echo_metrics"
```

---

## Technology Stack

| Layer | Technology |
|---|---|
| Runtime | Cloudflare Workers (V8 Isolates) |
| Framework | Hono 4.6 |
| Language | TypeScript 5.7 |
| Database | Cloudflare D1 (SQLite at the edge) |
| Cache | Cloudflare KV |
| Analytics | Cloudflare Analytics Engine |
| Build | Wrangler 3.99 |
| Architecture | Single-file, zero-dependency (beyond Hono) |

---

<div align="center">

**ECHO MEGA Gateway Cloud v2.0.0**

Part of the **[ECHO PRIME](https://echo-ept.com)** platform by **Echo Prime Technologies**

Built on Cloudflare Workers -- globally distributed, zero cold starts, infinite scale.

---

`1,878 servers. 36,330 tools. One endpoint.`

</div>
