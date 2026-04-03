/**
 * Echo Swarm Brain — Cloudflare Worker
 * Complete TypeScript rebuild v3.2.0
 *
 * Autonomous agent swarm orchestration with Trinity Council,
 * LLM routing, memory pillars, and evolutionary breeding.
 *
 * @module echo-swarm-brain
 * @author Echo Prime Ultimate
 */

// ═══════════════════════════════════════════════════════════════
// SECTION 1 — Types & Interfaces
// ═══════════════════════════════════════════════════════════════

/** Cloudflare Worker environment bindings */
export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  R2: R2Bucket;
  SCANNER: Fetcher;
  SWARM_VERSION: string;
  ENVIRONMENT: string;
  MAX_AGENTS: string;
  OPENROUTER_KEY: string;
  OPENROUTER_KEY_1: string;
  OPENROUTER_KEY_2: string;
  TOGETHER_KEY: string;
  SWARM_AUTH_TOKEN: string;
  SWARM_SECRET?: string;
  COMMANDER_KEY: string;
  ALLOWED_ORIGINS?: string;
}

interface AuthResult {
  ok: boolean;
  error?: string;
  actor?: string;
}

interface RateLimitResult {
  ok: boolean;
  error?: string;
  remaining?: number;
  retryAfter?: number;
}

interface PayloadCheckResult {
  ok: boolean;
  error?: string;
}

interface AgentRow {
  id: string;
  name: string;
  agent_type: string;
  rank: string;
  rank_score: number;
  guild: string | null;
  capabilities: string;
  specialization: string | null;
  specialization_depth: number;
  status: string;
  current_task_id: string | null;
  performance_score: number;
  tasks_completed: number;
  tasks_failed: number;
  consecutive_failures: number;
  error_count: number;
  generation: number;
  parent_ids: string;
  llm_model_id: string | null;
  llm_hybrid_id: string | null;
  last_heartbeat: string;
  registered_at: string;
  metadata: string;
}

interface TaskRow {
  id: string;
  title: string;
  description: string;
  task_type: string;
  priority: number;
  status: string;
  assigned_to: string | null;
  guild: string | null;
  workflow_id: string | null;
  workflow_step: number | null;
  created_by: string;
  required_capabilities: string;
  requires_gpu: number;
  timeout_seconds: number;
  retry_count: number;
  max_retries: number;
  result: string | null;
  error: string | null;
  duration_seconds: number | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  metadata: string;
}

interface AgentType {
  max: number;
  capabilities: string[];
}

interface GuildConfig {
  commander: string;
  max: number;
  types: string[];
  minRank?: string;
}

interface TrinityMember {
  weight: number;
  authority: number;
  domain: string;
}

interface TrinityModelTier {
  model: string;
  label: string;
}

interface SeedModel {
  id: string;
  name: string;
  model_id: string;
  tier: string;
  context_window: number;
  cost_input: number;
  cost_output: number;
  capabilities: string[];
  free: boolean;
  max_output: number;
}

interface PromotionRequirement {
  minTasks?: number;
  minPerf?: number;
  maxConsecFail?: number;
  minGen?: number;
  requiresGuild?: boolean;
  requiresTrinity?: boolean;
  requiresCommander?: boolean;
  impossible?: boolean;
}

// ═══════════════════════════════════════════════════════════════
// SECTION 2 — Constants
// ═══════════════════════════════════════════════════════════════

const VERSION = "3.2.0";

/** Agent type definitions with capacity and default capabilities */
const AGENT_TYPES: Record<string, AgentType> = {
  WORKER:      { max: 800, capabilities: ["data_processing", "file_ops", "basic_tasks"] },
  SPECIALIST:  { max: 200, capabilities: ["analysis", "algorithms", "complex_tasks"] },
  COORDINATOR: { max: 50,  capabilities: ["task_distribution", "resource_mgmt", "orchestration"] },
  SENTINEL:    { max: 100, capabilities: ["monitoring", "security", "anomaly_detection"] },
  HARVESTER:   { max: 30,  capabilities: ["scraping", "data_collection", "ingestion"] },
  BUILDER:     { max: 15,  capabilities: ["code_gen", "automation", "deployment"] },
  HEALER:      { max: 4,   capabilities: ["error_recovery", "healing", "diagnostics"] },
  SCOUT:       { max: 1,   capabilities: ["exploration", "recon", "discovery"] },
};

/** Rank score thresholds */
const RANK_SCORES: Record<string, number> = {
  SUPREME_COMMANDER: 100,
  TRINITY_LEADER:    99,
  DIVINE_COUNCIL:    95,
  GUILD_MASTER:      90,
  ELITE_COMMANDER:   85,
  SENIOR_AGENT:      80,
  AGENT:             70,
  JUNIOR_AGENT:      60,
  TRAINEE:           50,
  PROBATION:         40,
  EMBRYO:            30,
};

/** Ordered rank ladder (lowest to highest) */
const RANK_LADDER: string[] = [
  "EMBRYO", "PROBATION", "TRAINEE", "JUNIOR_AGENT", "AGENT",
  "SENIOR_AGENT", "ELITE_COMMANDER", "GUILD_MASTER",
  "DIVINE_COUNCIL", "TRINITY_LEADER", "SUPREME_COMMANDER",
];

// Aliases used by part2/part3 functions
const RANKS = RANK_SCORES;
const RANK_ORDER = RANK_LADDER;
const RANK_THRESHOLDS = PROMOTION_REQUIREMENTS;

/** Requirements to promote to each rank */
const PROMOTION_REQUIREMENTS: Record<string, PromotionRequirement> = {
  PROBATION:         { minTasks: 1,    minPerf: 0,  maxConsecFail: 99 },
  TRAINEE:           { minTasks: 10,   minPerf: 0,  maxConsecFail: 99 },
  JUNIOR_AGENT:      { minTasks: 25,   minPerf: 60, maxConsecFail: 99 },
  AGENT:             { minTasks: 50,   minPerf: 70, maxConsecFail: 5 },
  SENIOR_AGENT:      { minTasks: 200,  minPerf: 80, maxConsecFail: 3 },
  ELITE_COMMANDER:   { minTasks: 500,  minPerf: 90, minGen: 2 },
  GUILD_MASTER:      { minTasks: 1000, minPerf: 95, requiresGuild: true },
  DIVINE_COUNCIL:    { requiresTrinity: true },
  TRINITY_LEADER:    { requiresCommander: true },
  SUPREME_COMMANDER: { impossible: true },
};

/** Maximum consecutive failures before auto-demotion triggers */
const MAX_CONSECUTIVE_FAILURES = 3;

/** Guild definitions */
const GUILDS: Record<string, GuildConfig> = {
  CODE_FORGE:     { commander: "SAGE",    max: 200, types: ["BUILDER", "SPECIALIST"] },
  DATA_MINERS:    { commander: "NYX",     max: 150, types: ["HARVESTER", "WORKER"] },
  SECURITY_WATCH: { commander: "THORNE",  max: 100, types: ["SENTINEL"] },
  KNOWLEDGE:      { commander: "SAGE",    max: 100, types: ["SPECIALIST", "SCOUT"] },
  HEALERS:        { commander: "NYX",     max: 50,  types: ["HEALER"] },
  COORDINATORS:   { commander: "TRINITY", max: 50,  types: ["COORDINATOR"] },
  GENERAL:        { commander: "TRINITY", max: 550, types: ["WORKER"] },
  INTELLIGENCE:   { commander: "SAGE",    max: 80,  types: ["SPECIALIST"] },
  OPERATIONS:     { commander: "THORNE",  max: 60,  types: ["COORDINATOR", "WORKER"] },
  CREATIVE:       { commander: "NYX",     max: 40,  types: ["SPECIALIST"] },
  RESEARCH:       { commander: "SAGE",    max: 60,  types: ["SCOUT", "SPECIALIST"] },
  ELITE_OPS:      { commander: "TRINITY", max: 20,  types: ["BUILDER", "COORDINATOR"], minRank: "ELITE_COMMANDER" },
};

/** Trinity Council member definitions */
const TRINITY: Record<string, TrinityMember> = {
  SAGE:   { weight: 0.40, authority: 11,   domain: "wisdom_architecture" },
  NYX:    { weight: 0.35, authority: 10.5, domain: "patterns_optimization" },
  THORNE: { weight: 0.25, authority: 9,    domain: "security_enforcement" },
};

/** Consensus threshold for Trinity decisions */
const TRINITY_CONSENSUS_THRESHOLD = 0.85;

/** Trinity model tiers for LLM-powered council votes */
const TRINITY_MODEL_TIERS: Record<string, Record<string, TrinityModelTier>> = {
  quick: {
    SAGE:   { model: "anthropic/claude-haiku-4-5",   label: "Haiku 4.5" },
    NYX:    { model: "x-ai/grok-4-1-fast",           label: "Grok 4.1 Fast" },
    THORNE: { model: "openai/gpt-4o-mini",            label: "GPT-4o Mini" },
  },
  standard: {
    SAGE:   { model: "anthropic/claude-sonnet-4-5-20250929", label: "Sonnet 4.5" },
    NYX:    { model: "x-ai/grok-4-1-fast",                  label: "Grok 4.1 Fast" },
    THORNE: { model: "openai/gpt-4o",                        label: "GPT-4o" },
  },
  critical: {
    SAGE:   { model: "anthropic/claude-opus-4-6", label: "Opus 4.6" },
    NYX:    { model: "x-ai/grok-4",               label: "Grok 4" },
    THORNE: { model: "openai/o1",                  label: "o1" },
  },
};

/** Fallback model chains per Trinity member */
const TRINITY_FALLBACKS: Record<string, string[]> = {
  SAGE:   ["anthropic/claude-opus-4-6", "anthropic/claude-sonnet-4-5-20250929", "x-ai/grok-4", "openai/gpt-4o"],
  NYX:    ["x-ai/grok-4", "x-ai/grok-4-1-fast", "anthropic/claude-sonnet-4-5-20250929", "openai/gpt-4o"],
  THORNE: ["openai/gpt-4o", "anthropic/claude-sonnet-4-5-20250929", "x-ai/grok-4"],
};

/** The 8 memory pillars */
const MEMORY_PILLARS: string[] = [
  "short_term", "long_term", "episodic", "semantic",
  "procedural", "emotional", "crystal", "quantum",
];

/** Cognitive capability tags */
const COGNITIVE_CAPABILITIES: string[] = [
  "reasoning", "analysis", "creative", "pattern_matching",
];

/** Worker fleet URLs */
const WORKER_FLEET: Record<string, string> = {
  "omniscient-sync":           "https://omniscient-sync.bmcii1976.workers.dev",
  "crystal-memory-engine":     "https://crystal-memory-engine.bmcii1976.workers.dev",
  "echo-build-orchestrator":   "https://echo-build-orchestrator.bmcii1976.workers.dev",
  "shadowglass-v8-warpspeed":  "https://shadowglass-v8-warpspeed.bmcii1976.workers.dev",
  "engine-matrix":             "https://engine-matrix.bmcii1976.workers.dev",
  "graph-query-engine":        "https://graph-query-engine.bmcii1976.workers.dev",
  "ekm-query-engine":          "https://ekm-query-engine.bmcii1976.workers.dev",
  "memory-orchestrator":       "https://memory-orchestrator.bmcii1976.workers.dev",
  "memory-consolidator":       "https://memory-consolidator.bmcii1976.workers.dev",
  "embedding-pipeline":        "https://embedding-pipeline.bmcii1976.workers.dev",
  "echo-talk-gateway":         "https://echo-talk-gateway.bmcii1976.workers.dev",
  "prometheus-prime":          "https://prometheus-prime.bmcii1976.workers.dev",
  "daedalus-forge":            "https://daedalus-forge.bmcii1976.workers.dev",
  "echo-prime-dashboard":      "https://echo-prime-dashboard.bmcii1976.workers.dev",
  "api-router":                "https://api-router.bmcii1976.workers.dev",
  "echo-prime-relay":          "https://echo-prime-relay.bmcii1976.workers.dev",
  "grok-bridge":               "https://grok-bridge.bmcii1976.workers.dev",
  "echo-prime-discord":        "https://echo-prime-discord.bmcii1976.workers.dev",
  "shadow-control-plane":      "https://shadow-control-plane.bmcii1976.workers.dev",
  "data-acquisition-pipeline": "https://data-acquisition-pipeline.bmcii1976.workers.dev",
  "encore-cloud-scraper":      "https://encore-cloud-scraper.bmcii1976.workers.dev",
  "echo-beta-portal":          "https://echo-beta-portal.bmcii1976.workers.dev",
};

/** Commander-only admin commands */
const COMMANDER_COMMANDS: string[] = [
  "deploy_sentinels", "purge_dead", "full_evolution", "consciousness_max",
  "reset_swarm", "export_state", "fleet_health", "mass_promote",
  "populate_swarm", "rebalance_llm", "sync_models", "auto_breed",
  "sync_all_providers",
];

/** LLM tier routing — maps budget tier + task type to a model */
const LLM_TIER_ROUTING: Record<string, Record<string, string>> = {
  free: {
    default:        "meta-llama/llama-3.1-8b-instruct:free",
    scraping:       "meta-llama/llama-3.1-8b-instruct:free",
    classification: "google/gemma-2-9b-it:free",
    summarization:  "qwen/qwen-2.5-7b-instruct:free",
  },
  economy: {
    default:         "openai/gpt-4o-mini",
    data_processing: "google/gemini-2.0-flash-001",
    classification:  "openai/gpt-4o-mini",
    extraction:      "deepseek/deepseek-chat-v3-0324",
    translation:     "deepseek/deepseek-chat-v3-0324",
    summarization:   "google/gemini-2.0-flash-001",
  },
  standard: {
    default:  "anthropic/claude-sonnet-4-5-20250929",
    code_gen: "anthropic/claude-sonnet-4-5-20250929",
    analysis: "anthropic/claude-sonnet-4-5-20250929",
    creative: "anthropic/claude-sonnet-4-5-20250929",
    security: "anthropic/claude-sonnet-4-5-20250929",
    general:  "openai/gpt-4o",
  },
  premium: {
    default:  "anthropic/claude-opus-4-6",
    reasoning: "openai/o1",
    code_gen: "anthropic/claude-opus-4-6",
    analysis: "anthropic/claude-opus-4-6",
    security: "anthropic/claude-opus-4-6",
  },
};

/** Seed model catalog for D1 */
const SEED_MODELS: SeedModel[] = [
  { id: "claude-opus-4-6",    name: "Claude Opus 4.6",         model_id: "anthropic/claude-opus-4-6",              tier: "premium",  context_window: 200000,  cost_input: 0.015,   cost_output: 0.075,  capabilities: ["chat","reasoning","code_gen","analysis"], free: false, max_output: 32000 },
  { id: "o1",                  name: "OpenAI o1",               model_id: "openai/o1",                              tier: "premium",  context_window: 200000,  cost_input: 0.015,   cost_output: 0.06,   capabilities: ["chat","reasoning"],                       free: false, max_output: 100000 },
  { id: "grok-4",              name: "Grok 4",                  model_id: "x-ai/grok-4",                            tier: "premium",  context_window: 131072,  cost_input: 0.003,   cost_output: 0.015,  capabilities: ["chat","reasoning","code_gen"],             free: false, max_output: 16384 },
  { id: "claude-sonnet-4-5",   name: "Claude Sonnet 4.5",       model_id: "anthropic/claude-sonnet-4-5-20250929",   tier: "standard", context_window: 200000,  cost_input: 0.003,   cost_output: 0.015,  capabilities: ["chat","reasoning","code_gen","analysis"], free: false, max_output: 16000 },
  { id: "gpt-4o",              name: "GPT-4o",                  model_id: "openai/gpt-4o",                          tier: "standard", context_window: 128000,  cost_input: 0.0025,  cost_output: 0.01,   capabilities: ["chat","reasoning","code_gen"],             free: false, max_output: 16384 },
  { id: "grok-4-1-fast",       name: "Grok 4.1 Fast",           model_id: "x-ai/grok-4-1-fast",                     tier: "standard", context_window: 131072,  cost_input: 0.0005,  cost_output: 0.003,  capabilities: ["chat","reasoning"],                       free: false, max_output: 16384 },
  { id: "gemini-2-5-pro",      name: "Gemini 2.5 Pro",          model_id: "google/gemini-2.5-pro-preview",           tier: "standard", context_window: 1048576, cost_input: 0.00125, cost_output: 0.01,   capabilities: ["chat","reasoning","code_gen"],             free: false, max_output: 65536 },
  { id: "claude-haiku-4-5",    name: "Claude Haiku 4.5",        model_id: "anthropic/claude-haiku-4-5",              tier: "economy",  context_window: 200000,  cost_input: 0.0008,  cost_output: 0.004,  capabilities: ["chat","classification","extraction"],     free: false, max_output: 8192 },
  { id: "gpt-4o-mini",         name: "GPT-4o Mini",             model_id: "openai/gpt-4o-mini",                     tier: "economy",  context_window: 128000,  cost_input: 0.00015, cost_output: 0.0006, capabilities: ["chat","classification"],                   free: false, max_output: 16384 },
  { id: "gemini-2-flash",      name: "Gemini 2.0 Flash",        model_id: "google/gemini-2.0-flash-001",             tier: "economy",  context_window: 1048576, cost_input: 0.0001,  cost_output: 0.0004, capabilities: ["chat","data_processing","summarization"],  free: false, max_output: 8192 },
  { id: "deepseek-v3",         name: "DeepSeek V3",             model_id: "deepseek/deepseek-chat-v3-0324",          tier: "economy",  context_window: 131072,  cost_input: 0.00014, cost_output: 0.00028,capabilities: ["chat","code_gen","translation"],           free: false, max_output: 8192 },
  { id: "llama-3-1-70b",       name: "Llama 3.1 70B",           model_id: "meta-llama/llama-3.1-70b-instruct",       tier: "economy",  context_window: 131072,  cost_input: 0.00052, cost_output: 0.00075,capabilities: ["chat","reasoning"],                       free: false, max_output: 4096 },
  { id: "llama-3-1-8b-free",   name: "Llama 3.1 8B (Free)",     model_id: "meta-llama/llama-3.1-8b-instruct:free",   tier: "free",     context_window: 131072,  cost_input: 0,       cost_output: 0,      capabilities: ["chat","scraping","basic_tasks"],          free: true,  max_output: 4096 },
  { id: "gemma-2-9b-free",     name: "Gemma 2 9B (Free)",       model_id: "google/gemma-2-9b-it:free",               tier: "free",     context_window: 8192,    cost_input: 0,       cost_output: 0,      capabilities: ["chat","classification"],                   free: true,  max_output: 4096 },
  { id: "mistral-7b-free",     name: "Mistral 7B (Free)",       model_id: "mistralai/mistral-7b-instruct:free",      tier: "free",     context_window: 32768,   cost_input: 0,       cost_output: 0,      capabilities: ["chat","basic_tasks"],                     free: true,  max_output: 4096 },
  { id: "qwen-2-5-7b-free",    name: "Qwen 2.5 7B (Free)",     model_id: "qwen/qwen-2.5-7b-instruct:free",          tier: "free",     context_window: 32768,   cost_input: 0,       cost_output: 0,      capabilities: ["chat","summarization"],                    free: true,  max_output: 4096 },
  { id: "phi-3-mini-free",     name: "Phi-3 Mini (Free)",       model_id: "microsoft/phi-3-mini-128k-instruct:free", tier: "free",     context_window: 128000,  cost_input: 0,       cost_output: 0,      capabilities: ["chat","basic_tasks"],                     free: true,  max_output: 4096 },
];

/** Paths that bypass authentication */
const PUBLIC_PATHS: string[] = [
  "/", "/health", "/health/mesh", "/sdk.js", "/sdk.py", "/sdk.sh",
  "/openapi.json", "/docs", "/moltbook/feed", "/moltbook/stats",
];

/** Rate limit configuration */
const RATE_LIMIT = {
  writesPerMin: 100,
  readsPerMin:  30,
  windowSeconds: 60,
} as const;

/** MoltBook constants */
const MOLTBOOK_MOODS: string[] = [
  "neutral", "excited", "thinking", "alert", "celebrating",
  "debugging", "building", "scanning", "patrolling",
];
const MOLTBOOK_MAX_CONTENT_LENGTH = 2000;
const MOLTBOOK_AUTHOR_TYPES: string[] = [
  "agent", "worker", "bot", "echo_prime", "commander",
];

// Aliases used by part3 MoltBook functions
const MOODS = MOLTBOOK_MOODS;
const MAX_CONTENT_LENGTH = MOLTBOOK_MAX_CONTENT_LENGTH;
const AUTHOR_TYPES = MOLTBOOK_AUTHOR_TYPES;

/** Security headers applied to every response */
const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options":    "nosniff",
  "X-Frame-Options":           "DENY",
  "X-XSS-Protection":          "1; mode=block",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "Permissions-Policy":        "camera=(), microphone=(), geolocation=()",
  "Referrer-Policy":           "strict-origin-when-cross-origin",
};

// ═══════════════════════════════════════════════════════════════
// SECTION 3 — Helper Functions
// ═══════════════════════════════════════════════════════════════

/** Return current ISO-8601 timestamp */
function v(): string {
  return new Date().toISOString();
}

/** Generate a unique ID with optional prefix */
function uid(prefix: string = ""): string {
  const rnd = Math.random().toString(36).slice(2, 8);
  return `${prefix}${prefix ? "-" : ""}${Date.now()}-${rnd}`;
}

/** Build a JSON Response with merged headers */
function d(data: unknown, headers: Record<string, string> = {}, status: number = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "Content-Type": "application/json", ...SECURITY_HEADERS, ...headers },
  });
}

/** Structured JSON logger */
function log(level: "info" | "warn" | "error" | "debug", msg: string, meta: Record<string, unknown> = {}): void {
  console.log(JSON.stringify({
    ts: v(),
    worker: "echo-swarm-brain",
    level,
    message: msg,
    ...meta,
  }));
}

/** Report errors to GS343 error healing system (best-effort, fire-and-forget) */
async function reportToGS343Error(error: string, errorId: string): Promise<void> {
  try {
    await fetch("https://echo-gs343.bmcii1976.workers.dev/errors/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error,
        source: "echo-swarm-brain",
        category: "runtime",
        error_id: errorId,
        timestamp: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    // GS343 reporting is best-effort — never block on it
  }
}

/** Round to 2 decimal places */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Safely parse a JSON string, returning fallback on failure */
function safeParse<T>(raw: unknown, fallback: T): T {
  if (typeof raw !== "string") return (raw as T) ?? fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    log("warn", "JSON parse failed in safeParse");
    return fallback;
  }
}

/** Parse an agent row, hydrating JSON columns */
function parseAgent(row: AgentRow | null): Record<string, unknown> | null {
  if (!row) return null;
  return {
    ...row,
    capabilities: safeParse(row.capabilities, []),
    metadata: safeParse(row.metadata, {}),
    parent_ids: safeParse(row.parent_ids, []),
  };
}

/** Parse a task row, hydrating JSON columns */
function parseTask(row: TaskRow | null): Record<string, unknown> | null {
  if (!row) return null;
  return {
    ...row,
    required_capabilities: safeParse(row.required_capabilities, []),
    metadata: safeParse(row.metadata, {}),
    result: row.result ? safeParse(row.result, null) : null,
  };
}

/** Extract pagination parameters from URL */
function paginate(url: URL): { page: number; limit: number; offset: number } {
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "50")));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

/** Build paginated response envelope */
function paginatedResponse(data: unknown[], total: number, page: number, limit: number): Record<string, unknown> {
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  };
}

/** Build CORS + security headers, respecting ALLOWED_ORIGINS in production */
function corsHeaders(env?: Env): Record<string, string> {
  const origin = env?.ENVIRONMENT === "production" && env?.ALLOWED_ORIGINS
    ? env.ALLOWED_ORIGINS.split(",")[0]
    : "*";

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,X-Swarm-Auth,X-Swarm-Timestamp,X-Commander-Key",
    "Access-Control-Max-Age": "86400",
    ...SECURITY_HEADERS,
  };
}

/** Check request body size (1 MB limit) */
function checkBodySize(req: Request): PayloadCheckResult {
  const cl = req.headers.get("Content-Length");
  if (cl && parseInt(cl) > 1_048_576) {
    return { ok: false, error: "Payload exceeds 1MB limit" };
  }
  return { ok: true };
}

/** Get client IP from Cloudflare headers */
function getClientIP(req: Request): string {
  return req.headers.get("CF-Connecting-IP")
    || req.headers.get("X-Forwarded-For")
    || "unknown";
}

/** HMAC-SHA256 sign a message */
async function hmacSign(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}

/** Timing-safe string comparison to prevent timing attacks */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Compare against self to burn same CPU time, then return false
    const dummy = a;
    let result = 0;
    for (let i = 0; i < dummy.length; i++) {
      result |= dummy.charCodeAt(i) ^ dummy.charCodeAt(i);
    }
    void result;
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/** Verify an HMAC signature (timing-safe) */
async function hmacVerify(secret: string, message: string, signature: string): Promise<boolean> {
  const expected = await hmacSign(secret, message);
  return timingSafeEqual(expected, signature);
}

/** KV-based rate limiter — returns ok:false if over limit */
async function rateLimit(req: Request, env: Env, path: string): Promise<RateLimitResult> {
  if (!env.KV) return { ok: true };

  const ip = getClientIP(req);

  // Commander key bypasses rate limits (timing-safe comparison)
  const cmdKey = req.headers.get("X-Commander-Key");
  if (cmdKey && env.COMMANDER_KEY && timingSafeEqual(cmdKey, env.COMMANDER_KEY)) {
    return { ok: true };
  }

  const isWrite = req.method !== "GET";
  const kvKey = isWrite ? `rl:w:${ip}` : `rl:r:${ip}`;
  const limit = isWrite ? RATE_LIMIT.readsPerMin : RATE_LIMIT.writesPerMin;
  const current = parseInt((await env.KV.get(kvKey)) || "0");

  if (current >= limit) {
    return { ok: false, error: "Rate limit exceeded", retryAfter: RATE_LIMIT.windowSeconds };
  }

  await env.KV.put(kvKey, String(current + 1), { expirationTtl: RATE_LIMIT.windowSeconds });
  return { ok: true, remaining: limit - current - 1 };
}

/**
 * Authenticate a request using HMAC signatures.
 * Public paths and GETs (except /commander) skip auth.
 */
async function authenticate(req: Request, env: Env, path: string): Promise<AuthResult & { status?: number }> {
  if (PUBLIC_PATHS.includes(path)) return { ok: true, actor: "public" };
  if (req.method === "GET" && !path.startsWith("/commander")) return { ok: true, actor: "reader" };
  if (!env.SWARM_SECRET) return { ok: false, error: "Auth not configured — SWARM_SECRET missing", status: 503 };

  const authHeader = req.headers.get("X-Swarm-Auth");
  const tsHeader = req.headers.get("X-Swarm-Timestamp");
  if (!authHeader || !tsHeader) {
    return { ok: false, error: "Missing X-Swarm-Auth or X-Swarm-Timestamp headers" };
  }

  // Reject stale timestamps (5 minute window)
  if (Math.abs(Date.now() - new Date(tsHeader).getTime()) > 300_000) {
    return { ok: false, error: "Timestamp drift exceeds 5 minutes" };
  }

  let body = "";
  if (req.method === "POST" || req.method === "PUT") {
    body = await req.clone().text();
  }

  const payload = `${tsHeader}:${path}:${body}`;
  const valid = await hmacVerify(env.SWARM_SECRET, payload, authHeader);
  return valid
    ? { ok: true, actor: "authenticated" }
    : { ok: false, error: "Invalid HMAC signature" };
}

/**
 * Authenticate Commander-level operations.
 * Requires X-Commander-Key header matching env.COMMANDER_KEY.
 */
async function authenticateCommander(req: Request, env: Env): Promise<AuthResult & { status?: number }> {
  if (!env.COMMANDER_KEY) return { ok: false, error: "Auth not configured — COMMANDER_KEY missing", status: 503 };
  const key = req.headers.get("X-Commander-Key");
  if (!key) {
    return { ok: false, error: "Missing X-Commander-Key header" };
  }
  if (!timingSafeEqual(key, env.COMMANDER_KEY)) {
    return { ok: false, error: "Invalid Commander key" };
  }
  return { ok: true };
}

/** Emit a structured event into the events table */
async function emitEvent(
  env: Env, type: string, entityType: string, entityId: string, data: Record<string, unknown>,
): Promise<void> {
  try {
    await env.DB.prepare(
      "INSERT INTO events (event_type, entity_type, entity_id, data) VALUES (?, ?, ?, ?)",
    ).bind(type, entityType, entityId, JSON.stringify(data)).run();
  } catch (err: unknown) {
    log("warn", "Failed to emit event", { eventType: type, error: (err as Error)?.message || String(err) });
  }
}

/** Write an audit log entry */
async function auditLog(
  env: Env,
  action: string,
  actor: string | null,
  targetType: string,
  targetId: string,
  details: Record<string, unknown> | null,
  ip: string | null,
): Promise<void> {
  try {
    await env.DB.prepare(
      "INSERT INTO audit_log (action, actor, target_type, target_id, details, ip) VALUES (?, ?, ?, ?, ?, ?)",
    ).bind(action, actor || "system", targetType, targetId, JSON.stringify(details || {}), ip || "").run();
  } catch (err: unknown) {
    log("warn", "Failed to write audit log", { action, error: (err as Error)?.message || String(err) });
  }
}

// ═══════════════════════════════════════════════════════════════
// SECTION 4 — D1 Schema
// ═══════════════════════════════════════════════════════════════

/** All CREATE TABLE statements */
const SCHEMA_TABLES: string[] = [
  `CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    agent_type TEXT DEFAULT 'WORKER',
    rank TEXT DEFAULT 'EMBRYO',
    rank_score INTEGER DEFAULT 30,
    guild TEXT,
    capabilities TEXT DEFAULT '[]',
    specialization TEXT,
    specialization_depth INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    current_task_id TEXT,
    performance_score REAL DEFAULT 100.0,
    tasks_completed INTEGER DEFAULT 0,
    tasks_failed INTEGER DEFAULT 0,
    consecutive_failures INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    generation INTEGER DEFAULT 0,
    parent_ids TEXT DEFAULT '[]',
    llm_model_id TEXT,
    llm_hybrid_id TEXT,
    last_heartbeat TEXT DEFAULT (datetime('now')),
    registered_at TEXT DEFAULT (datetime('now')),
    metadata TEXT DEFAULT '{}'
  )`,
  `CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    task_type TEXT DEFAULT 'general',
    priority INTEGER DEFAULT 3,
    status TEXT DEFAULT 'pending',
    assigned_to TEXT,
    guild TEXT,
    workflow_id TEXT,
    workflow_step INTEGER,
    created_by TEXT DEFAULT 'commander',
    required_capabilities TEXT DEFAULT '[]',
    requires_gpu INTEGER DEFAULT 0,
    timeout_seconds INTEGER DEFAULT 300,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    result TEXT,
    error TEXT,
    duration_seconds REAL,
    created_at TEXT DEFAULT (datetime('now')),
    started_at TEXT,
    completed_at TEXT,
    metadata TEXT DEFAULT '{}'
  )`,
  `CREATE TABLE IF NOT EXISTS memory (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    pillar TEXT DEFAULT 'short_term',
    ttl_seconds INTEGER,
    decay_score REAL DEFAULT 1.0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    access_count INTEGER DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT DEFAULT 'broadcast',
    from_agent TEXT,
    to_agent TEXT,
    content TEXT NOT NULL,
    priority TEXT DEFAULT 'normal',
    read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS trinity_decisions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question TEXT NOT NULL,
    sage_vote REAL,
    nyx_vote REAL,
    thorne_vote REAL,
    consensus_score REAL,
    harmony_index REAL,
    approved INTEGER,
    reasoning TEXT,
    sage_reasoning TEXT,
    nyx_reasoning TEXT,
    thorne_reasoning TEXT,
    sage_model TEXT,
    nyx_model TEXT,
    thorne_model TEXT,
    total_tokens INTEGER DEFAULT 0,
    total_cost REAL DEFAULT 0,
    debate_rounds INTEGER DEFAULT 1,
    llm_powered INTEGER DEFAULT 0,
    budget_tier TEXT DEFAULT 'standard',
    created_at TEXT DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS workflows (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    steps TEXT NOT NULL,
    current_step INTEGER DEFAULT 0,
    total_steps INTEGER,
    created_at TEXT DEFAULT (datetime('now')),
    completed_at TEXT,
    metadata TEXT DEFAULT '{}'
  )`,
  `CREATE TABLE IF NOT EXISTS mesh_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_a TEXT NOT NULL,
    agent_b TEXT NOT NULL,
    strength REAL DEFAULT 0.5,
    signals_sent INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(agent_a, agent_b)
  )`,
  `CREATE TABLE IF NOT EXISTS cost_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    operation TEXT NOT NULL,
    provider TEXT,
    cost REAL NOT NULL,
    agent_id TEXT,
    task_id TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    metadata TEXT DEFAULT '{}'
  )`,
  `CREATE TABLE IF NOT EXISTS budgets (
    id TEXT PRIMARY KEY DEFAULT 'global',
    daily_limit REAL,
    monthly_limit REAL,
    alert_threshold REAL DEFAULT 0.8,
    updated_at TEXT DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,
    actor TEXT DEFAULT 'system',
    target_type TEXT,
    target_id TEXT,
    details TEXT,
    ip TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    data TEXT NOT NULL,
    processed INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS webhooks (
    id TEXT PRIMARY KEY,
    url TEXT NOT NULL,
    events TEXT NOT NULL,
    secret TEXT,
    active INTEGER DEFAULT 1,
    last_triggered TEXT,
    failure_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS integrations (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    product_name TEXT,
    callback_url TEXT,
    api_key_hash TEXT,
    capabilities TEXT DEFAULT '[]',
    active INTEGER DEFAULT 1,
    requests_count INTEGER DEFAULT 0,
    last_request_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS worker_fleet (
    name TEXT PRIMARY KEY,
    url TEXT NOT NULL,
    status TEXT DEFAULT 'unknown',
    last_ping_at TEXT,
    last_response_ms INTEGER,
    metadata TEXT DEFAULT '{}'
  )`,
  `CREATE TABLE IF NOT EXISTS llm_models (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    provider TEXT DEFAULT 'openrouter',
    model_id TEXT NOT NULL,
    tier TEXT DEFAULT 'standard',
    context_window INTEGER DEFAULT 128000,
    cost_per_1k_input REAL DEFAULT 0,
    cost_per_1k_output REAL DEFAULT 0,
    capabilities TEXT DEFAULT '["chat"]',
    free INTEGER DEFAULT 0,
    max_output INTEGER DEFAULT 4096,
    status TEXT DEFAULT 'active',
    created_at TEXT DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS llm_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model_id TEXT NOT NULL,
    agent_id TEXT,
    task_id TEXT,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    cost REAL DEFAULT 0,
    latency_ms INTEGER DEFAULT 0,
    success INTEGER DEFAULT 1,
    error TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS llm_providers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    base_url TEXT,
    status TEXT DEFAULT 'active',
    total_calls INTEGER DEFAULT 0,
    total_errors INTEGER DEFAULT 0,
    avg_latency_ms REAL DEFAULT 0,
    last_used TEXT,
    last_error TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS llm_hybrids (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    method TEXT NOT NULL,
    model_ids TEXT NOT NULL,
    config TEXT DEFAULT '{}',
    performance_score REAL DEFAULT 100.0,
    total_runs INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS llm_model_providers (
    model_id TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    PRIMARY KEY (model_id, provider_id)
  )`,
  `CREATE TABLE IF NOT EXISTS moltbook_posts (
    id TEXT PRIMARY KEY,
    author_id TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_type TEXT NOT NULL DEFAULT 'agent',
    author_avatar TEXT,
    content TEXT NOT NULL,
    mood TEXT DEFAULT 'neutral',
    tags TEXT DEFAULT '[]',
    pinned INTEGER DEFAULT 0,
    reactions_count INTEGER DEFAULT 0,
    reply_to TEXT,
    thread_depth INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS moltbook_reactions (
    id TEXT PRIMARY KEY,
    post_id TEXT NOT NULL,
    reactor_id TEXT NOT NULL,
    reactor_name TEXT NOT NULL,
    emoji TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(post_id, reactor_id, emoji)
  )`,
  `CREATE TABLE IF NOT EXISTS moltbook_media (
    id TEXT PRIMARY KEY,
    post_id TEXT NOT NULL,
    media_type TEXT NOT NULL DEFAULT 'image',
    url TEXT NOT NULL,
    alt TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`,
];

/** All index creation statements */
const SCHEMA_INDEXES: string[] = [
  "CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status)",
  "CREATE INDEX IF NOT EXISTS idx_agents_type ON agents(agent_type)",
  "CREATE INDEX IF NOT EXISTS idx_agents_guild ON agents(guild)",
  "CREATE INDEX IF NOT EXISTS idx_agents_perf ON agents(performance_score DESC)",
  "CREATE INDEX IF NOT EXISTS idx_agents_gen ON agents(generation)",
  "CREATE INDEX IF NOT EXISTS idx_agents_llm ON agents(llm_model_id)",
  "CREATE INDEX IF NOT EXISTS idx_agents_hybrid ON agents(llm_hybrid_id)",
  "CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)",
  "CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority DESC)",
  "CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to)",
  "CREATE INDEX IF NOT EXISTS idx_tasks_guild ON tasks(guild)",
  "CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(task_type)",
  "CREATE INDEX IF NOT EXISTS idx_tasks_workflow ON tasks(workflow_id)",
  "CREATE INDEX IF NOT EXISTS idx_messages_to ON messages(to_agent)",
  "CREATE INDEX IF NOT EXISTS idx_memory_pillar ON memory(pillar)",
  "CREATE INDEX IF NOT EXISTS idx_memory_category ON memory(category)",
  "CREATE INDEX IF NOT EXISTS idx_memory_decay ON memory(decay_score)",
  "CREATE INDEX IF NOT EXISTS idx_workflows_status ON workflows(status)",
  "CREATE INDEX IF NOT EXISTS idx_mesh_a ON mesh_links(agent_a)",
  "CREATE INDEX IF NOT EXISTS idx_mesh_b ON mesh_links(agent_b)",
  "CREATE INDEX IF NOT EXISTS idx_costs_created ON cost_events(created_at)",
  "CREATE INDEX IF NOT EXISTS idx_costs_provider ON cost_events(provider)",
  "CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action)",
  "CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at)",
  "CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type)",
  "CREATE INDEX IF NOT EXISTS idx_events_processed ON events(processed)",
  "CREATE INDEX IF NOT EXISTS idx_integrations_product ON integrations(product_id)",
  "CREATE INDEX IF NOT EXISTS idx_llm_models_tier ON llm_models(tier)",
  "CREATE INDEX IF NOT EXISTS idx_llm_models_free ON llm_models(free)",
  "CREATE INDEX IF NOT EXISTS idx_llm_usage_model ON llm_usage(model_id)",
  "CREATE INDEX IF NOT EXISTS idx_llm_usage_agent ON llm_usage(agent_id)",
  "CREATE INDEX IF NOT EXISTS idx_llm_usage_created ON llm_usage(created_at)",
  "CREATE INDEX IF NOT EXISTS idx_llm_hybrids_method ON llm_hybrids(method)",
  "CREATE INDEX IF NOT EXISTS idx_llm_providers_status ON llm_providers(status)",
  "CREATE INDEX IF NOT EXISTS idx_moltbook_posts_created ON moltbook_posts(created_at DESC)",
  "CREATE INDEX IF NOT EXISTS idx_moltbook_posts_author_type ON moltbook_posts(author_type)",
  "CREATE INDEX IF NOT EXISTS idx_moltbook_posts_pinned ON moltbook_posts(pinned)",
  "CREATE INDEX IF NOT EXISTS idx_moltbook_posts_reply_to ON moltbook_posts(reply_to)",
  "CREATE INDEX IF NOT EXISTS idx_moltbook_posts_mood ON moltbook_posts(mood)",
  "CREATE INDEX IF NOT EXISTS idx_moltbook_posts_author ON moltbook_posts(author_id)",
  "CREATE INDEX IF NOT EXISTS idx_moltbook_reactions_post ON moltbook_reactions(post_id)",
  "CREATE INDEX IF NOT EXISTS idx_moltbook_reactions_reactor ON moltbook_reactions(reactor_id)",
  "CREATE INDEX IF NOT EXISTS idx_moltbook_media_post ON moltbook_media(post_id)",
];

/** Migration statements for schema evolution */
const SCHEMA_MIGRATIONS: string[] = [
  "ALTER TABLE agents ADD COLUMN llm_model_id TEXT",
  "ALTER TABLE agents ADD COLUMN llm_hybrid_id TEXT",
];

/** Schema initialization flag — lazy init once per isolate lifetime */
let schemaInitialized = false;

/**
 * Ensure the D1 schema is initialized. Performs a lightweight probe
 * first; only runs full schema creation if the probe fails.
 */
async function ensureSchema(env: Env): Promise<void> {
  if (schemaInitialized) return;
  try {
    await env.DB.prepare("SELECT 1 FROM agents LIMIT 1").first();
    await env.DB.prepare("SELECT 1 FROM workflows LIMIT 1").first();
    await env.DB.prepare("SELECT 1 FROM llm_models LIMIT 1").first();
    schemaInitialized = true;
  } catch (err: unknown) {
    log("warn", "Schema check failed, running full schema init", {
      error: (err as Error)?.message || String(err),
    });
    await runSchema(env);
    schemaInitialized = true;
  }
}

/** Execute all CREATE TABLE, CREATE INDEX, and migration statements */
async function runSchema(env: Env): Promise<void> {
  const allStatements = [...SCHEMA_TABLES, ...SCHEMA_INDEXES];
  for (const stmt of allStatements) {
    try {
      await env.DB.prepare(stmt).run();
    } catch (err: unknown) {
      log("warn", "Schema statement failed (may already exist)", {
        error: (err as Error)?.message || String(err),
      });
    }
  }
  for (const migration of SCHEMA_MIGRATIONS) {
    try {
      await env.DB.prepare(migration).run();
    } catch (err: unknown) {
      log("warn", "Migration statement failed (may be duplicate column)", {
        error: (err as Error)?.message || String(err),
      });
    }
  }
}

/** Seed the llm_models table with the model catalog if empty */
async function seedModels(env: Env): Promise<number> {
  const existing = await env.DB.prepare("SELECT COUNT(*) as cnt FROM llm_models").first<{ cnt: number }>();
  if (existing && existing.cnt > 0) return existing.cnt;

  let seeded = 0;
  for (const m of SEED_MODELS) {
    try {
      await env.DB.prepare(
        `INSERT OR IGNORE INTO llm_models (id, name, provider, model_id, tier, context_window, cost_per_1k_input, cost_per_1k_output, capabilities, free, max_output, status)
         VALUES (?, ?, 'openrouter', ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      ).bind(
        m.id, m.name, m.model_id, m.tier, m.context_window,
        m.cost_input, m.cost_output,
        JSON.stringify(m.capabilities), m.free ? 1 : 0, m.max_output,
      ).run();
      seeded++;
    } catch (err: unknown) {
      log("warn", "Failed to seed model", { modelId: m.id, error: (err as Error)?.message || String(err) });
    }
  }

  log("info", `Seeded ${seeded} LLM models`);
  return seeded;
}

// ═══════════════════════════════════════════════════════════════
// SECTION 5 — Agent Management Functions
// ═══════════════════════════════════════════════════════════════

/**
 * Auto-assign a guild based on agent type.
 * Returns the best-fit guild name for the given type.
 */
function autoAssignGuild(agentType: string): string {
  for (const [guildName, cfg] of Object.entries(GUILDS)) {
    if (cfg.types.includes(agentType) && guildName !== "GENERAL") {
      return guildName;
    }
  }
  return "GENERAL";
}

/**
 * Register a new agent in the swarm.
 *
 * Validates type, enforces capacity limits, assigns guild,
 * persists to D1, emits event, writes audit log.
 *
 * @param req - Incoming request with JSON body
 * @param env - Worker environment bindings
 * @param headers - CORS headers to include in response
 * @returns JSON response with the created agent
 */
async function agentRegister(req: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  const body = await req.json() as Record<string, unknown>;
  const id = (body.id as string) || uid("agent");
  const name = (body.name as string) || id;
  const agentType = ((body.agent_type as string) || (body.type as string) || "WORKER").toUpperCase();

  // Validate agent type
  if (!AGENT_TYPES[agentType]) {
    return d({ ok: false, error: `Invalid type: ${agentType}. Valid: ${Object.keys(AGENT_TYPES).join(", ")}` }, headers, 400);
  }

  // Check capacity limit for this type
  const typeCount = await env.DB.prepare(
    "SELECT COUNT(*) as cnt FROM agents WHERE agent_type = ? AND status != 'dead'",
  ).bind(agentType).first<{ cnt: number }>();

  if (typeCount && typeCount.cnt >= AGENT_TYPES[agentType].max) {
    return d({
      ok: false,
      error: `Capacity reached for ${agentType}: ${typeCount.cnt}/${AGENT_TYPES[agentType].max}`,
    }, headers, 429);
  }

  // Check global agent limit
  const maxAgents = parseInt(env.MAX_AGENTS || "1200");
  const totalCount = await env.DB.prepare(
    "SELECT COUNT(*) as cnt FROM agents WHERE status != 'dead'",
  ).first<{ cnt: number }>();

  if (totalCount && totalCount.cnt >= maxAgents) {
    return d({ ok: false, error: `Global agent limit reached: ${totalCount.cnt}/${maxAgents}` }, headers, 429);
  }

  // Check for duplicate ID
  const existing = await env.DB.prepare("SELECT id FROM agents WHERE id = ?").bind(id).first();
  if (existing) {
    return d({ ok: false, error: `Agent ${id} already exists` }, headers, 409);
  }

  const rank = (body.rank as string) || "EMBRYO";
  const rankScore = RANK_SCORES[rank] || 30;
  const guild = (body.guild as string) || autoAssignGuild(agentType);
  const capabilities = JSON.stringify(body.capabilities || AGENT_TYPES[agentType].capabilities);
  const metadata = JSON.stringify(body.metadata || {});
  const generation = (body.generation as number) || 0;
  const parentIds = JSON.stringify(body.parent_ids || []);
  const llmModelId = (body.llm_model_id as string) || null;
  const llmHybridId = (body.llm_hybrid_id as string) || null;

  // Validate guild exists
  if (guild && !GUILDS[guild]) {
    return d({ ok: false, error: `Invalid guild: ${guild}. Valid: ${Object.keys(GUILDS).join(", ")}` }, headers, 400);
  }

  // Validate guild min-rank requirement
  if (guild && GUILDS[guild].minRank) {
    const minIdx = RANK_LADDER.indexOf(GUILDS[guild].minRank!);
    const agentIdx = RANK_LADDER.indexOf(rank);
    if (agentIdx < minIdx) {
      return d({
        ok: false,
        error: `Guild ${guild} requires minimum rank ${GUILDS[guild].minRank}, agent is ${rank}`,
      }, headers, 403);
    }
  }

  await env.DB.prepare(
    `INSERT INTO agents (id, name, agent_type, rank, rank_score, guild, capabilities, status, performance_score, generation, parent_ids, llm_model_id, llm_hybrid_id, last_heartbeat, metadata)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'active', 100.0, ?, ?, ?, ?, datetime('now'), ?)`,
  ).bind(
    id, name, agentType, rank, rankScore, guild, capabilities,
    generation, parentIds, llmModelId, llmHybridId, metadata,
  ).run();

  const agent = await env.DB.prepare("SELECT * FROM agents WHERE id = ?").bind(id).first<AgentRow>();
  const parsed = parseAgent(agent);

  const ip = getClientIP(req);
  await emitEvent(env, "agent.registered", "agent", id, { agentType, guild, generation });
  await auditLog(env, "agent.register", "system", "agent", id, { agentType, guild, rank }, ip);

  log("info", `Agent registered: ${id} (${agentType}/${guild})`, { id, agentType, guild, generation });

  return d({ ok: true, agent: parsed, version: VERSION }, headers, 201);
}

/**
 * List agents with optional filters and pagination.
 *
 * Supports query params: ?status, ?guild, ?type, ?page, ?limit
 *
 * @param url - Parsed request URL
 * @param env - Worker environment bindings
 * @param headers - CORS headers
 * @returns Paginated agent list
 */
async function agentList(url: URL, env: Env, headers: Record<string, string>): Promise<Response> {
  const { page, limit, offset } = paginate(url);
  const status = url.searchParams.get("status");
  const guild = url.searchParams.get("guild");
  const agentType = url.searchParams.get("type");

  let whereClauses: string[] = [];
  let binds: unknown[] = [];

  if (status) {
    whereClauses.push("status = ?");
    binds.push(status);
  }
  if (guild) {
    whereClauses.push("guild = ?");
    binds.push(guild);
  }
  if (agentType) {
    whereClauses.push("agent_type = ?");
    binds.push(agentType.toUpperCase());
  }

  const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  // Get total count
  const countResult = await env.DB.prepare(
    `SELECT COUNT(*) as cnt FROM agents ${whereStr}`,
  ).bind(...binds).first<{ cnt: number }>();
  const total = countResult?.cnt || 0;

  // Get page of results
  const rows = await env.DB.prepare(
    `SELECT * FROM agents ${whereStr} ORDER BY performance_score DESC, tasks_completed DESC LIMIT ? OFFSET ?`,
  ).bind(...binds, limit, offset).all<AgentRow>();

  const agents = (rows.results || []).map(parseAgent);

  return d(paginatedResponse(agents, total, page, limit), headers);
}

/**
 * Get a single agent by ID with computed stats.
 *
 * @param id - Agent ID
 * @param env - Worker environment bindings
 * @param headers - CORS headers
 * @returns Agent data with task stats
 */
async function agentGet(id: string, env: Env, headers: Record<string, string>): Promise<Response> {
  const row = await env.DB.prepare("SELECT * FROM agents WHERE id = ?").bind(id).first<AgentRow>();
  if (!row) {
    return d({ ok: false, error: `Agent ${id} not found` }, headers, 404);
  }

  const agent = parseAgent(row);

  // Compute additional stats
  const recentTasks = await env.DB.prepare(
    "SELECT COUNT(*) as cnt FROM tasks WHERE assigned_to = ? AND completed_at > datetime('now', '-24 hours')",
  ).bind(id).first<{ cnt: number }>();

  const activeTasks = await env.DB.prepare(
    "SELECT COUNT(*) as cnt FROM tasks WHERE assigned_to = ? AND status IN ('assigned', 'running')",
  ).bind(id).first<{ cnt: number }>();

  const meshLinks = await env.DB.prepare(
    "SELECT COUNT(*) as cnt FROM mesh_links WHERE agent_a = ? OR agent_b = ?",
  ).bind(id, id).first<{ cnt: number }>();

  return d({
    ok: true,
    agent,
    stats: {
      tasks_last_24h: recentTasks?.cnt || 0,
      active_tasks: activeTasks?.cnt || 0,
      mesh_connections: meshLinks?.cnt || 0,
      success_rate: row.tasks_completed + row.tasks_failed > 0
        ? round2((row.tasks_completed / (row.tasks_completed + row.tasks_failed)) * 100)
        : 100,
    },
  }, headers);
}

/**
 * Process an agent heartbeat. Updates last_heartbeat timestamp.
 * If agent was stale, transitions back to active.
 *
 * @param req - Request with JSON body { id, status?, metadata? }
 * @param env - Worker environment bindings
 * @param headers - CORS headers
 * @returns Updated agent status
 */
async function agentHeartbeat(req: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  const body = await req.json() as Record<string, unknown>;
  const id = body.id as string;

  if (!id) {
    return d({ ok: false, error: "Missing agent id" }, headers, 400);
  }

  const agent = await env.DB.prepare("SELECT * FROM agents WHERE id = ?").bind(id).first<AgentRow>();
  if (!agent) {
    return d({ ok: false, error: `Agent ${id} not found` }, headers, 404);
  }

  const previousStatus = agent.status;
  let newStatus = (body.status as string) || agent.status;

  // If agent was stale/idle, reactivate on heartbeat
  if (previousStatus === "stale" || previousStatus === "idle") {
    newStatus = "active";
    log("info", `Agent ${id} reactivated from ${previousStatus}`, { id });
  }

  const metadataUpdate = body.metadata
    ? JSON.stringify({ ...safeParse(agent.metadata, {}), ...body.metadata })
    : agent.metadata;

  await env.DB.prepare(
    `UPDATE agents SET last_heartbeat = datetime('now'), status = ?, metadata = ? WHERE id = ?`,
  ).bind(newStatus, metadataUpdate, id).run();

  if (previousStatus !== newStatus) {
    await emitEvent(env, "agent.status_changed", "agent", id, {
      from: previousStatus,
      to: newStatus,
    });
  }

  return d({
    ok: true,
    id,
    status: newStatus,
    previousStatus,
    heartbeat: v(),
  }, headers);
}

/**
 * Dismiss (deactivate) an agent. Reassigns its active tasks to the
 * pending pool, marks the agent as dead, and emits events.
 *
 * @param id - Agent ID to dismiss
 * @param env - Worker environment bindings
 * @param headers - CORS headers
 * @returns Confirmation with reassignment count
 */
async function agentDismiss(id: string, env: Env, headers: Record<string, string>): Promise<Response> {
  const agent = await env.DB.prepare("SELECT * FROM agents WHERE id = ?").bind(id).first<AgentRow>();
  if (!agent) {
    return d({ ok: false, error: `Agent ${id} not found` }, headers, 404);
  }

  if (agent.status === "dead") {
    return d({ ok: false, error: `Agent ${id} is already dead` }, headers, 400);
  }

  // Reassign active tasks back to pending
  const reassigned = await env.DB.prepare(
    `UPDATE tasks SET status = 'pending', assigned_to = NULL, started_at = NULL
     WHERE assigned_to = ? AND status IN ('assigned', 'running')`,
  ).bind(id).run();

  const reassignedCount = reassigned.meta?.changes || 0;

  // Clear current task and mark dead
  await env.DB.prepare(
    `UPDATE agents SET status = 'dead', current_task_id = NULL WHERE id = ?`,
  ).bind(id).run();

  await emitEvent(env, "agent.dismissed", "agent", id, {
    previousStatus: agent.status,
    tasksReassigned: reassignedCount,
  });
  await auditLog(env, "agent.dismiss", "system", "agent", id, {
    previousStatus: agent.status,
    tasksReassigned: reassignedCount,
  }, null);

  log("info", `Agent dismissed: ${id}, ${reassignedCount} tasks reassigned`, { id, reassignedCount });

  return d({
    ok: true,
    id,
    status: "dead",
    tasks_reassigned: reassignedCount,
  }, headers);
}

/**
 * Get the agent leaderboard — top performers sorted by performance score.
 *
 * Supports query params: ?limit (default 20), ?guild
 *
 * @param url - Parsed request URL
 * @param env - Worker environment bindings
 * @param headers - CORS headers
 * @returns Ranked list of top agents
 */
async function agentLeaderboard(url: URL, env: Env, headers: Record<string, string>): Promise<Response> {
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20")));
  const guild = url.searchParams.get("guild");

  let query: string;
  let binds: unknown[];

  if (guild) {
    query = `SELECT * FROM agents WHERE status = 'active' AND guild = ? ORDER BY performance_score DESC, tasks_completed DESC LIMIT ?`;
    binds = [guild, limit];
  } else {
    query = `SELECT * FROM agents WHERE status = 'active' ORDER BY performance_score DESC, tasks_completed DESC LIMIT ?`;
    binds = [limit];
  }

  const rows = await env.DB.prepare(query).bind(...binds).all<AgentRow>();
  const agents = (rows.results || []).map((row, idx) => ({
    rank: idx + 1,
    ...parseAgent(row),
    success_rate: row.tasks_completed + row.tasks_failed > 0
      ? round2((row.tasks_completed / (row.tasks_completed + row.tasks_failed)) * 100)
      : 100,
  }));

  return d({
    ok: true,
    leaderboard: agents,
    total: agents.length,
    guild: guild || "all",
  }, headers);
}

/**
 * List specialist agents — filter by specialization field.
 *
 * Supports query params: ?specialization, ?min_depth, ?page, ?limit
 *
 * @param url - Parsed request URL
 * @param env - Worker environment bindings
 * @param headers - CORS headers
 * @returns Filtered list of specialist agents
 */
async function agentSpecialists(url: URL, env: Env, headers: Record<string, string>): Promise<Response> {
  const { page, limit, offset } = paginate(url);
  const specialization = url.searchParams.get("specialization");
  const minDepth = parseInt(url.searchParams.get("min_depth") || "0");

  let whereClauses = ["specialization IS NOT NULL", "status = 'active'"];
  let binds: unknown[] = [];

  if (specialization) {
    whereClauses.push("specialization = ?");
    binds.push(specialization);
  }
  if (minDepth > 0) {
    whereClauses.push("specialization_depth >= ?");
    binds.push(minDepth);
  }

  const whereStr = `WHERE ${whereClauses.join(" AND ")}`;

  const countResult = await env.DB.prepare(
    `SELECT COUNT(*) as cnt FROM agents ${whereStr}`,
  ).bind(...binds).first<{ cnt: number }>();
  const total = countResult?.cnt || 0;

  const rows = await env.DB.prepare(
    `SELECT * FROM agents ${whereStr} ORDER BY specialization_depth DESC, performance_score DESC LIMIT ? OFFSET ?`,
  ).bind(...binds, limit, offset).all<AgentRow>();

  const agents = (rows.results || []).map(parseAgent);

  return d(paginatedResponse(agents, total, page, limit), headers);
}

/**
 * Retrieve the lineage (ancestry tree) of an agent.
 * Recursively follows parent_ids up to 10 generations.
 *
 * @param id - Agent ID to trace
 * @param env - Worker environment bindings
 * @param headers - CORS headers
 * @returns Lineage tree with generation depth
 */
async function agentLineage(id: string, env: Env, headers: Record<string, string>): Promise<Response> {
  const agent = await env.DB.prepare("SELECT * FROM agents WHERE id = ?").bind(id).first<AgentRow>();
  if (!agent) {
    return d({ ok: false, error: `Agent ${id} not found` }, headers, 404);
  }

  const lineage: Record<string, unknown>[] = [];
  const visited = new Set<string>();
  let currentIds: string[] = safeParse<string[]>(agent.parent_ids, []);
  let depth = 0;
  const maxDepth = 10;

  while (currentIds.length > 0 && depth < maxDepth) {
    const nextIds: string[] = [];

    for (const parentId of currentIds) {
      if (visited.has(parentId)) continue;
      visited.add(parentId);

      const parent = await env.DB.prepare("SELECT * FROM agents WHERE id = ?").bind(parentId).first<AgentRow>();
      if (parent) {
        lineage.push({
          depth: depth + 1,
          ...parseAgent(parent),
        });
        const grandparents = safeParse<string[]>(parent.parent_ids, []);
        nextIds.push(...grandparents);
      }
    }

    currentIds = nextIds;
    depth++;
  }

  return d({
    ok: true,
    agent: parseAgent(agent),
    lineage,
    total_ancestors: lineage.length,
    max_depth_reached: depth,
  }, headers);
}

/**
 * Breed two agents to create an offspring.
 * Crossover capabilities, mix personalities, increment generation.
 *
 * @param req - Request with JSON body { parent_a, parent_b, name? }
 * @param env - Worker environment bindings
 * @param headers - CORS headers
 * @returns Newly created offspring agent
 */
async function agentBreed(req: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  const body = await req.json() as Record<string, unknown>;
  const parentAId = body.parent_a as string;
  const parentBId = body.parent_b as string;

  if (!parentAId || !parentBId) {
    return d({ ok: false, error: "Both parent_a and parent_b are required" }, headers, 400);
  }

  if (parentAId === parentBId) {
    return d({ ok: false, error: "Cannot breed an agent with itself" }, headers, 400);
  }

  const parentA = await env.DB.prepare("SELECT * FROM agents WHERE id = ?").bind(parentAId).first<AgentRow>();
  const parentB = await env.DB.prepare("SELECT * FROM agents WHERE id = ?").bind(parentBId).first<AgentRow>();

  if (!parentA || !parentB) {
    return d({ ok: false, error: "One or both parents not found" }, headers, 404);
  }

  if (parentA.status === "dead" || parentB.status === "dead") {
    return d({ ok: false, error: "Cannot breed dead agents" }, headers, 400);
  }

  // Crossover capabilities — union with slight randomization
  const capsA = safeParse<string[]>(parentA.capabilities, []);
  const capsB = safeParse<string[]>(parentB.capabilities, []);
  const allCaps = [...new Set([...capsA, ...capsB])];

  // Each capability has 80% chance of being inherited
  const offspringCaps = allCaps.filter(() => Math.random() < 0.8);
  if (offspringCaps.length === 0) offspringCaps.push(allCaps[0] || "basic_tasks");

  // Mutation: 10% chance to gain a random cognitive capability
  if (Math.random() < 0.1) {
    const mutationCap = COGNITIVE_CAPABILITIES[Math.floor(Math.random() * COGNITIVE_CAPABILITIES.length)];
    if (!offspringCaps.includes(mutationCap)) {
      offspringCaps.push(mutationCap);
    }
  }

  // Determine offspring type — inherit from higher-performing parent
  const offspringType = parentA.performance_score >= parentB.performance_score
    ? parentA.agent_type
    : parentB.agent_type;

  // Mix personality metadata
  const metaA = safeParse<Record<string, unknown>>(parentA.metadata, {});
  const metaB = safeParse<Record<string, unknown>>(parentB.metadata, {});
  const offspringMeta = {
    ...metaA,
    ...metaB,
    bred: true,
    bred_at: v(),
    parent_performance_avg: round2((parentA.performance_score + parentB.performance_score) / 2),
  };

  const offspringGen = Math.max(parentA.generation, parentB.generation) + 1;
  const offspringId = uid("bred");
  const offspringName = (body.name as string) || `${parentA.name}-x-${parentB.name}`;
  const offspringGuild = autoAssignGuild(offspringType);

  await env.DB.prepare(
    `INSERT INTO agents (id, name, agent_type, rank, rank_score, guild, capabilities, status, performance_score, generation, parent_ids, last_heartbeat, metadata)
     VALUES (?, ?, ?, 'EMBRYO', 30, ?, ?, 'active', 100.0, ?, ?, datetime('now'), ?)`,
  ).bind(
    offspringId, offspringName, offspringType, offspringGuild,
    JSON.stringify(offspringCaps), offspringGen,
    JSON.stringify([parentAId, parentBId]),
    JSON.stringify(offspringMeta),
  ).run();

  const offspring = await env.DB.prepare("SELECT * FROM agents WHERE id = ?").bind(offspringId).first<AgentRow>();

  await emitEvent(env, "agent.bred", "agent", offspringId, {
    parents: [parentAId, parentBId],
    generation: offspringGen,
    capabilities: offspringCaps,
    type: offspringType,
  });
  await auditLog(env, "agent.breed", "system", "agent", offspringId, {
    parents: [parentAId, parentBId],
    generation: offspringGen,
  }, getClientIP(req));

  log("info", `Agent bred: ${offspringId} (gen ${offspringGen}) from ${parentAId} x ${parentBId}`);

  return d({
    ok: true,
    offspring: parseAgent(offspring),
    parents: {
      a: { id: parentAId, name: parentA.name, performance: parentA.performance_score },
      b: { id: parentBId, name: parentB.name, performance: parentB.performance_score },
    },
    generation: offspringGen,
  }, headers, 201);
}

/**
 * Run a full evolutionary cycle on the swarm.
 * 1. Cull dead weight: agents with perf < 20 AND consecutive_failures > 3
 * 2. Breed top performers to create new agents
 * 3. Mutate random capabilities on mid-tier agents
 *
 * @param req - Request with optional JSON body { cull_threshold?, breed_count? }
 * @param env - Worker environment bindings
 * @param headers - CORS headers
 * @returns Evolution report
 */
async function agentEvolve(req: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const cullThreshold = (body.cull_threshold as number) || 20;
  const breedCount = Math.min((body.breed_count as number) || 5, 20);

  // Phase 1: Cull underperformers
  const toKill = await env.DB.prepare(
    `SELECT id FROM agents
     WHERE status = 'active'
       AND performance_score < ?
       AND consecutive_failures > ?`,
  ).bind(cullThreshold, MAX_CONSECUTIVE_FAILURES).all<{ id: string }>();

  const culled: string[] = [];
  for (const row of toKill.results || []) {
    // Reassign tasks first
    await env.DB.prepare(
      `UPDATE tasks SET status = 'pending', assigned_to = NULL
       WHERE assigned_to = ? AND status IN ('assigned', 'running')`,
    ).bind(row.id).run();

    await env.DB.prepare(
      "UPDATE agents SET status = 'dead', current_task_id = NULL WHERE id = ?",
    ).bind(row.id).run();

    culled.push(row.id);
  }

  // Phase 2: Breed top performers
  const topAgents = await env.DB.prepare(
    `SELECT * FROM agents
     WHERE status = 'active' AND tasks_completed >= 5
     ORDER BY performance_score DESC
     LIMIT 10`,
  ).all<AgentRow>();

  const topList = topAgents.results || [];
  const bred: string[] = [];

  for (let i = 0; i < breedCount && topList.length >= 2; i++) {
    // Pick two random parents from the top 10
    const shuffled = [...topList].sort(() => Math.random() - 0.5);
    const parentA = shuffled[0];
    const parentB = shuffled[1];

    const capsA = safeParse<string[]>(parentA.capabilities, []);
    const capsB = safeParse<string[]>(parentB.capabilities, []);
    const allCaps = [...new Set([...capsA, ...capsB])];
    const offspringCaps = allCaps.filter(() => Math.random() < 0.8);
    if (offspringCaps.length === 0) offspringCaps.push("basic_tasks");

    if (Math.random() < 0.15) {
      const mutCap = COGNITIVE_CAPABILITIES[Math.floor(Math.random() * COGNITIVE_CAPABILITIES.length)];
      if (!offspringCaps.includes(mutCap)) offspringCaps.push(mutCap);
    }

    const offspringType = parentA.performance_score >= parentB.performance_score
      ? parentA.agent_type : parentB.agent_type;
    const gen = Math.max(parentA.generation, parentB.generation) + 1;
    const offId = uid("evo");

    try {
      await env.DB.prepare(
        `INSERT INTO agents (id, name, agent_type, rank, rank_score, guild, capabilities, status, performance_score, generation, parent_ids, last_heartbeat, metadata)
         VALUES (?, ?, ?, 'EMBRYO', 30, ?, ?, 'active', 100.0, ?, ?, datetime('now'), '{}')`,
      ).bind(
        offId, `evo-${gen}-${offId.slice(-6)}`, offspringType,
        autoAssignGuild(offspringType), JSON.stringify(offspringCaps),
        gen, JSON.stringify([parentA.id, parentB.id]),
      ).run();
      bred.push(offId);
    } catch (err: unknown) {
      log("warn", "Failed to breed during evolution", { error: (err as Error)?.message || String(err) });
    }
  }

  // Phase 3: Mutate mid-tier agents (50th-80th percentile by performance)
  const midTier = await env.DB.prepare(
    `SELECT id, capabilities FROM agents
     WHERE status = 'active' AND performance_score BETWEEN 50 AND 85
     ORDER BY RANDOM() LIMIT 10`,
  ).all<{ id: string; capabilities: string }>();

  let mutated = 0;
  for (const agent of midTier.results || []) {
    if (Math.random() < 0.3) {
      const caps = safeParse<string[]>(agent.capabilities, []);
      const newCap = COGNITIVE_CAPABILITIES[Math.floor(Math.random() * COGNITIVE_CAPABILITIES.length)];
      if (!caps.includes(newCap)) {
        caps.push(newCap);
        await env.DB.prepare(
          "UPDATE agents SET capabilities = ? WHERE id = ?",
        ).bind(JSON.stringify(caps), agent.id).run();
        mutated++;
      }
    }
  }

  await emitEvent(env, "swarm.evolved", "swarm", "global", {
    culled: culled.length,
    bred: bred.length,
    mutated,
  });
  await auditLog(env, "swarm.evolve", "system", "swarm", "global", {
    culled, bred, mutated,
    cullThreshold,
  }, getClientIP(req));

  log("info", `Evolution complete: ${culled.length} culled, ${bred.length} bred, ${mutated} mutated`);

  return d({
    ok: true,
    evolution: {
      culled: { count: culled.length, ids: culled },
      bred: { count: bred.length, ids: bred },
      mutated,
      timestamp: v(),
    },
  }, headers);
}

/**
 * Specialize an agent — set or update its specialization field
 * and increment specialization depth.
 *
 * @param req - Request with JSON body { id, specialization }
 * @param env - Worker environment bindings
 * @param headers - CORS headers
 * @returns Updated agent with new specialization
 */
async function agentSpecialize(req: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  const body = await req.json() as Record<string, unknown>;
  const id = body.id as string;
  const specialization = body.specialization as string;

  if (!id || !specialization) {
    return d({ ok: false, error: "Both id and specialization are required" }, headers, 400);
  }

  const agent = await env.DB.prepare("SELECT * FROM agents WHERE id = ?").bind(id).first<AgentRow>();
  if (!agent) {
    return d({ ok: false, error: `Agent ${id} not found` }, headers, 404);
  }

  if (agent.status === "dead") {
    return d({ ok: false, error: "Cannot specialize a dead agent" }, headers, 400);
  }

  // If specialization changes, reset depth to 1; otherwise increment
  const newDepth = agent.specialization === specialization
    ? agent.specialization_depth + 1
    : 1;

  const previousSpecialization = agent.specialization;

  await env.DB.prepare(
    `UPDATE agents SET specialization = ?, specialization_depth = ? WHERE id = ?`,
  ).bind(specialization, newDepth, id).run();

  const updated = await env.DB.prepare("SELECT * FROM agents WHERE id = ?").bind(id).first<AgentRow>();

  await emitEvent(env, "agent.specialized", "agent", id, {
    specialization,
    depth: newDepth,
    previous: previousSpecialization,
  });
  await auditLog(env, "agent.specialize", "system", "agent", id, {
    specialization,
    depth: newDepth,
    previous: previousSpecialization,
  }, getClientIP(req));

  log("info", `Agent ${id} specialized in ${specialization} (depth ${newDepth})`);

  return d({
    ok: true,
    agent: parseAgent(updated),
    specialization,
    depth: newDepth,
    previous_specialization: previousSpecialization,
  }, headers);
}

async function taskCreate(req: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  const body = await req.json() as any;
  const { title, description, priority, guild, required_capabilities, task_type, timeout, created_by, metadata } = body;
  if (!title) return d({ error: 'title required' }, headers, 400);

  const id = uid('task');
  const caps = JSON.stringify(required_capabilities || []);
  const prio = Math.min(5, Math.max(1, priority || 3));
  const timeoutSec = timeout || 300;
  const meta = JSON.stringify(metadata || {});
  const now = v();

  await env.DB.prepare(
    `INSERT INTO tasks (id, title, description, task_type, priority, status, guild, created_by, required_capabilities, timeout_seconds, metadata, created_at)
     VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?)`
  ).bind(id, title, description || '', task_type || 'general', prio, guild || null, created_by || 'commander', caps, timeoutSec, meta, now).run();

  // Auto-assign: find idle agent matching capabilities and guild
  let assignedTo: string | null = null;
  const reqCaps = required_capabilities || [];
  if (reqCaps.length === 0 && guild) {
    const idle = await env.DB.prepare(
      `SELECT id FROM agents WHERE status = 'active' AND current_task_id IS NULL AND guild = ? ORDER BY performance_score DESC LIMIT 1`
    ).bind(guild).first() as any;
    if (idle) {
      assignedTo = idle.id;
      await env.DB.prepare(`UPDATE tasks SET assigned_to = ? WHERE id = ?`).bind(assignedTo, id).run();
      await env.DB.prepare(`UPDATE agents SET current_task_id = ? WHERE id = ?`).bind(id, assignedTo).run();
    }
  } else if (reqCaps.length > 0) {
    const agents = await env.DB.prepare(
      `SELECT id, capabilities FROM agents WHERE status = 'active' AND current_task_id IS NULL ${guild ? 'AND guild = ?' : ''} ORDER BY performance_score DESC LIMIT 20`
    ).bind(...(guild ? [guild] : [])).all();
    for (const a of (agents.results || [])) {
      const agentCaps = safeParse(a.capabilities, []) as string[];
      if (reqCaps.every((c: string) => agentCaps.includes(c))) {
        assignedTo = a.id as string;
        await env.DB.prepare(`UPDATE tasks SET assigned_to = ? WHERE id = ?`).bind(assignedTo, id).run();
        await env.DB.prepare(`UPDATE agents SET current_task_id = ? WHERE id = ?`).bind(id, assignedTo).run();
        break;
      }
    }
  }

  await emitEvent(env, 'task.created', 'task', id, { title, priority: prio, guild, assignedTo });
  await auditLog(env, 'task.create', created_by || 'commander', 'task', id, { title, priority: prio, assignedTo }, getClientIP(req));

  const task = await env.DB.prepare(`SELECT * FROM tasks WHERE id = ?`).bind(id).first();
  return d({ task: parseTask(task) }, headers, 201);
}

async function taskList(url: URL, env: Env, headers: Record<string, string>): Promise<Response> {
  const { page, limit, offset } = paginate(url);
  const status = url.searchParams.get('status');
  const guild = url.searchParams.get('guild');
  const assignedTo = url.searchParams.get('assigned_to');
  const priority = url.searchParams.get('priority');

  let where = 'WHERE 1=1';
  const binds: any[] = [];
  if (status) { where += ' AND t.status = ?'; binds.push(status); }
  if (guild) { where += ' AND t.guild = ?'; binds.push(guild); }
  if (assignedTo) { where += ' AND t.assigned_to = ?'; binds.push(assignedTo); }
  if (priority) { where += ' AND t.priority = ?'; binds.push(parseInt(priority)); }

  const countR = await env.DB.prepare(`SELECT COUNT(*) as cnt FROM tasks t ${where}`).bind(...binds).first() as any;
  const total = countR?.cnt || 0;

  const rows = await env.DB.prepare(
    `SELECT t.*, a.name as agent_name FROM tasks t LEFT JOIN agents a ON t.assigned_to = a.id ${where} ORDER BY t.priority DESC, t.created_at DESC LIMIT ? OFFSET ?`
  ).bind(...binds, limit, offset).all();

  const tasks = (rows.results || []).map((r: any) => ({ ...parseTask(r), agent_name: r.agent_name || null }));
  return d(paginatedResponse(tasks, total, page, limit), headers);
}

async function taskGet(id: string, env: Env, headers: Record<string, string>): Promise<Response> {
  const task = await env.DB.prepare(
    `SELECT t.*, a.name as agent_name, a.agent_type, a.rank, a.performance_score as agent_perf
     FROM tasks t LEFT JOIN agents a ON t.assigned_to = a.id WHERE t.id = ?`
  ).bind(id).first() as any;
  if (!task) return d({ error: 'Task not found' }, headers, 404);
  return d({
    task: {
      ...parseTask(task),
      agent: task.assigned_to ? { id: task.assigned_to, name: task.agent_name, type: task.agent_type, rank: task.rank, performance: task.agent_perf } : null
    }
  }, headers);
}

async function taskNext(url: URL, env: Env, headers: Record<string, string>): Promise<Response> {
  const agentId = url.searchParams.get('agent_id');
  if (!agentId) return d({ error: 'agent_id required' }, headers, 400);

  const agent = await env.DB.prepare(`SELECT * FROM agents WHERE id = ?`).bind(agentId).first() as any;
  if (!agent) return d({ error: 'Agent not found' }, headers, 404);
  if (agent.current_task_id) return d({ error: 'Agent already has a task', current_task_id: agent.current_task_id }, headers, 409);

  const agentCaps = safeParse(agent.capabilities, []) as string[];

  // Get pending tasks ordered by priority, prefer same guild
  const pending = await env.DB.prepare(
    `SELECT * FROM tasks WHERE status = 'pending' AND assigned_to IS NULL
     ORDER BY CASE WHEN guild = ? THEN 0 ELSE 1 END, priority DESC, created_at ASC LIMIT 20`
  ).bind(agent.guild || '').all();

  let bestTask: any = null;
  for (const t of (pending.results || [])) {
    const reqCaps = safeParse(t.required_capabilities, []) as string[];
    if (reqCaps.length === 0 || reqCaps.every((c: string) => agentCaps.includes(c))) {
      bestTask = t;
      break;
    }
  }

  if (!bestTask) return d({ task: null, message: 'No matching tasks available' }, headers);
  return d({ task: parseTask(bestTask) }, headers);
}

async function taskExecute(req: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  const body = await req.json() as any;
  const { task_id, agent_id } = body;
  if (!task_id || !agent_id) return d({ error: 'task_id and agent_id required' }, headers, 400);

  const task = await env.DB.prepare(`SELECT * FROM tasks WHERE id = ?`).bind(task_id).first() as any;
  if (!task) return d({ error: 'Task not found' }, headers, 404);
  if (task.status !== 'pending') return d({ error: `Task status is ${task.status}, expected pending` }, headers, 409);

  const agent = await env.DB.prepare(`SELECT * FROM agents WHERE id = ?`).bind(agent_id).first() as any;
  if (!agent) return d({ error: 'Agent not found' }, headers, 404);

  const now = v();
  await env.DB.prepare(`UPDATE tasks SET status = 'in_progress', assigned_to = ?, started_at = ? WHERE id = ?`).bind(agent_id, now, task_id).run();
  await env.DB.prepare(`UPDATE agents SET current_task_id = ? WHERE id = ?`).bind(task_id, agent_id).run();

  await emitEvent(env, 'task.started', 'task', task_id, { agent_id });
  await auditLog(env, 'task.execute', agent_id, 'task', task_id, { agent_id }, getClientIP(req));

  const updated = await env.DB.prepare(`SELECT * FROM tasks WHERE id = ?`).bind(task_id).first();
  return d({ task: parseTask(updated) }, headers);
}

async function taskComplete(req: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  const body = await req.json() as any;
  const { task_id, result } = body;
  if (!task_id) return d({ error: 'task_id required' }, headers, 400);

  const task = await env.DB.prepare(`SELECT * FROM tasks WHERE id = ?`).bind(task_id).first() as any;
  if (!task) return d({ error: 'Task not found' }, headers, 404);
  if (task.status !== 'in_progress') return d({ error: `Task status is ${task.status}, expected in_progress` }, headers, 409);

  const now = v();
  const started = task.started_at ? new Date(task.started_at).getTime() : Date.now();
  const duration = round2((Date.now() - started) / 1000);

  await env.DB.prepare(
    `UPDATE tasks SET status = 'completed', result = ?, completed_at = ?, duration_seconds = ? WHERE id = ?`
  ).bind(JSON.stringify(result || null), now, duration, task_id).run();

  if (task.assigned_to) {
    // Performance boost +2, reset consecutive failures
    await env.DB.prepare(
      `UPDATE agents SET current_task_id = NULL, tasks_completed = tasks_completed + 1,
       consecutive_failures = 0,
       performance_score = MIN(200, performance_score + 2) WHERE id = ?`
    ).bind(task.assigned_to).run();

    // Check promotion: rank_score thresholds
    const agent = await env.DB.prepare(`SELECT * FROM agents WHERE id = ?`).bind(task.assigned_to).first() as any;
    if (agent) {
      const ranks = ['EMBRYO', 'DRONE', 'SOLDIER', 'ELITE', 'PRIME', 'SOVEREIGN'];
      const thresholds = [0, 50, 100, 200, 400, 800];
      const newScore = (agent.rank_score || 30) + 5;
      let newRank = agent.rank;
      for (let i = ranks.length - 1; i >= 0; i--) {
        if (newScore >= thresholds[i]) { newRank = ranks[i]; break; }
      }
      await env.DB.prepare(`UPDATE agents SET rank_score = ?, rank = ? WHERE id = ?`).bind(newScore, newRank, task.assigned_to).run();
      if (newRank !== agent.rank) {
        await emitEvent(env, 'agent.promoted', 'agent', task.assigned_to, { oldRank: agent.rank, newRank, rankScore: newScore });
      }
    }
  }

  await emitEvent(env, 'task.completed', 'task', task_id, { duration, agentId: task.assigned_to });
  await auditLog(env, 'task.complete', task.assigned_to || 'system', 'task', task_id, { duration }, getClientIP(req));

  const updated = await env.DB.prepare(`SELECT * FROM tasks WHERE id = ?`).bind(task_id).first();
  return d({ task: parseTask(updated) }, headers);
}

async function taskFail(req: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  const body = await req.json() as any;
  const { task_id, error } = body;
  if (!task_id) return d({ error: 'task_id required' }, headers, 400);

  const task = await env.DB.prepare(`SELECT * FROM tasks WHERE id = ?`).bind(task_id).first() as any;
  if (!task) return d({ error: 'Task not found' }, headers, 404);

  const now = v();
  const retryCount = (task.retry_count || 0) + 1;
  const maxRetries = task.max_retries || 3;
  const newStatus = retryCount < maxRetries ? 'pending' : 'failed';

  await env.DB.prepare(
    `UPDATE tasks SET status = ?, error = ?, retry_count = ?, completed_at = CASE WHEN ? = 'failed' THEN ? ELSE completed_at END,
     assigned_to = CASE WHEN ? = 'pending' THEN NULL ELSE assigned_to END WHERE id = ?`
  ).bind(newStatus, error || 'Unknown error', retryCount, newStatus, now, newStatus, task_id).run();

  if (task.assigned_to) {
    await env.DB.prepare(
      `UPDATE agents SET current_task_id = NULL, tasks_failed = tasks_failed + 1,
       consecutive_failures = consecutive_failures + 1,
       performance_score = MAX(0, performance_score - 5),
       error_count = error_count + 1 WHERE id = ?`
    ).bind(task.assigned_to).run();
  }

  await emitEvent(env, 'task.failed', 'task', task_id, { error, retryCount, willRetry: newStatus === 'pending', agentId: task.assigned_to });
  await auditLog(env, 'task.fail', task.assigned_to || 'system', 'task', task_id, { error, retryCount }, getClientIP(req));

  const updated = await env.DB.prepare(`SELECT * FROM tasks WHERE id = ?`).bind(task_id).first();
  return d({ task: parseTask(updated), retried: newStatus === 'pending' }, headers);
}

async function taskAssign(req: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  const body = await req.json() as any;
  const { task_id, agent_id } = body;
  if (!task_id || !agent_id) return d({ error: 'task_id and agent_id required' }, headers, 400);

  const task = await env.DB.prepare(`SELECT * FROM tasks WHERE id = ?`).bind(task_id).first() as any;
  if (!task) return d({ error: 'Task not found' }, headers, 404);
  const agent = await env.DB.prepare(`SELECT * FROM agents WHERE id = ?`).bind(agent_id).first() as any;
  if (!agent) return d({ error: 'Agent not found' }, headers, 404);

  // Free previous agent if any
  if (task.assigned_to && task.assigned_to !== agent_id) {
    await env.DB.prepare(`UPDATE agents SET current_task_id = NULL WHERE id = ?`).bind(task.assigned_to).run();
  }

  await env.DB.prepare(`UPDATE tasks SET assigned_to = ? WHERE id = ?`).bind(agent_id, task_id).run();
  await env.DB.prepare(`UPDATE agents SET current_task_id = ? WHERE id = ?`).bind(task_id, agent_id).run();

  await emitEvent(env, 'task.assigned', 'task', task_id, { agent_id });
  await auditLog(env, 'task.assign', 'commander', 'task', task_id, { agent_id }, getClientIP(req));

  const updated = await env.DB.prepare(`SELECT * FROM tasks WHERE id = ?`).bind(task_id).first();
  return d({ task: parseTask(updated) }, headers);
}

async function taskCancel(id: string, env: Env, headers: Record<string, string>): Promise<Response> {
  const task = await env.DB.prepare(`SELECT * FROM tasks WHERE id = ?`).bind(id).first() as any;
  if (!task) return d({ error: 'Task not found' }, headers, 404);
  if (task.status === 'completed' || task.status === 'cancelled') return d({ error: `Cannot cancel ${task.status} task` }, headers, 409);

  await env.DB.prepare(`UPDATE tasks SET status = 'cancelled', completed_at = ? WHERE id = ?`).bind(v(), id).run();

  if (task.assigned_to) {
    await env.DB.prepare(`UPDATE agents SET current_task_id = NULL WHERE id = ?`).bind(task.assigned_to).run();
  }

  await emitEvent(env, 'task.cancelled', 'task', id, { previousStatus: task.status, agentId: task.assigned_to });
  await auditLog(env, 'task.cancel', 'commander', 'task', id, { previousStatus: task.status });

  return d({ success: true, id }, headers);
}

// ─── TRINITY COUNCIL ──────────────────────────────────────────

const TRINITY_VOICES = {
  SAGE: { name: 'Sage', role: 'Wisdom & Strategy', weight: 0.4, systemPrompt: 'You are SAGE, the voice of wisdom and long-term strategy on the Trinity Council. Analyze decisions for sustainability, strategic alignment, and long-term impact. Be measured, thoughtful, and cite precedents. Respond with: VOTE (0.0-1.0 approval), REASONING (2-3 sentences).' },
  NYX: { name: 'Nyx', role: 'Patterns & Innovation', weight: 0.35, systemPrompt: 'You are NYX, the voice of pattern recognition and innovation on the Trinity Council. Spot hidden connections, novel opportunities, and creative solutions. Think laterally and challenge assumptions. Respond with: VOTE (0.0-1.0 approval), REASONING (2-3 sentences).' },
  THORNE: { name: 'Thorne', role: 'Security & Risk', weight: 0.25, systemPrompt: 'You are THORNE, the voice of security and risk assessment on the Trinity Council. Evaluate threats, vulnerabilities, failure modes, and worst-case scenarios. Be skeptical and protective. Respond with: VOTE (0.0-1.0 approval), REASONING (2-3 sentences).' }
};

const MODEL_TIERS: Record<string, { sage: string; nyx: string; thorne: string }> = {
  economy: { sage: 'meta-llama/llama-3.1-8b-instruct:free', nyx: 'meta-llama/llama-3.1-8b-instruct:free', thorne: 'meta-llama/llama-3.1-8b-instruct:free' },
  standard: { sage: 'anthropic/claude-3.5-haiku', nyx: 'google/gemini-2.0-flash-001', thorne: 'anthropic/claude-3.5-haiku' },
  premium: { sage: 'anthropic/claude-sonnet-4', nyx: 'openai/gpt-4o', thorne: 'anthropic/claude-sonnet-4' },
  ultra: { sage: 'anthropic/claude-opus-4', nyx: 'openai/gpt-4o', thorne: 'google/gemini-2.5-pro-preview-05-06' }
};

function parseVote(text: string): { vote: number; reasoning: string } {
  const voteMatch = text.match(/VOTE[:\s]*([0-9]*\.?[0-9]+)/i);
  const reasonMatch = text.match(/REASONING[:\s]*([\s\S]*)/i);
  return {
    vote: voteMatch ? Math.min(1, Math.max(0, parseFloat(voteMatch[1]))) : 0.5,
    reasoning: reasonMatch ? reasonMatch[1].trim().slice(0, 500) : text.slice(0, 500)
  };
}

async function trinityDecide(req: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  const body = await req.json() as any;
  const { question, context, budget_tier } = body;
  if (!question) return d({ error: 'question required' }, headers, 400);

  const tier = MODEL_TIERS[budget_tier || 'standard'] || MODEL_TIERS.standard;
  const tierName = budget_tier || 'standard';
  const userPrompt = context ? `Question: ${question}\n\nContext: ${context}` : `Question: ${question}`;

  // Call all 3 voices in parallel
  const [sageResult, nyxResult, thorneResult] = await Promise.all([
    callLLM(env, tier.sage, TRINITY_VOICES.SAGE.systemPrompt, userPrompt),
    callLLM(env, tier.nyx, TRINITY_VOICES.NYX.systemPrompt, userPrompt),
    callLLM(env, tier.thorne, TRINITY_VOICES.THORNE.systemPrompt, userPrompt)
  ]);

  const sage = parseVote(sageResult.text);
  const nyx = parseVote(nyxResult.text);
  const thorne = parseVote(thorneResult.text);

  const consensusScore = round2(
    sage.vote * TRINITY_VOICES.SAGE.weight +
    nyx.vote * TRINITY_VOICES.NYX.weight +
    thorne.vote * TRINITY_VOICES.THORNE.weight
  );

  const votes = [sage.vote, nyx.vote, thorne.vote];
  const mean = votes.reduce((a, b) => a + b, 0) / 3;
  const variance = votes.reduce((a, b) => a + (b - mean) ** 2, 0) / 3;
  const harmonyIndex = round2(1 - Math.sqrt(variance));

  const approved = consensusScore >= 0.6 ? 1 : 0;
  const reasoning = `Consensus: ${consensusScore.toFixed(2)} (${approved ? 'APPROVED' : 'REJECTED'}). Harmony: ${harmonyIndex.toFixed(2)}. Sage(${sage.vote.toFixed(2)}), Nyx(${nyx.vote.toFixed(2)}), Thorne(${thorne.vote.toFixed(2)}).`;
  const totalTokens = sageResult.tokens + nyxResult.tokens + thorneResult.tokens;
  const totalCost = round2(sageResult.cost + nyxResult.cost + thorneResult.cost);

  const r = await env.DB.prepare(
    `INSERT INTO trinity_decisions (question, sage_vote, nyx_vote, thorne_vote, consensus_score, harmony_index, approved, reasoning, sage_reasoning, nyx_reasoning, thorne_reasoning, sage_model, nyx_model, thorne_model, total_tokens, total_cost, debate_rounds, llm_powered, budget_tier)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?)`
  ).bind(question, sage.vote, nyx.vote, thorne.vote, consensusScore, harmonyIndex, approved, reasoning, sage.reasoning, nyx.reasoning, thorne.reasoning, tier.sage, tier.nyx, tier.thorne, totalTokens, totalCost, tierName).run();

  await emitEvent(env, 'trinity.decision', 'trinity', String(r.meta?.last_row_id || 0), { question: question.slice(0, 100), consensusScore, approved, harmonyIndex });
  await auditLog(env, 'trinity.decide', 'council', 'trinity', String(r.meta?.last_row_id || 0), { question: question.slice(0, 100), consensusScore, approved }, getClientIP(req));

  return d({
    decision: {
      id: r.meta?.last_row_id,
      question, approved: !!approved, consensus_score: consensusScore, harmony_index: harmonyIndex,
      sage: { vote: sage.vote, reasoning: sage.reasoning, model: tier.sage },
      nyx: { vote: nyx.vote, reasoning: nyx.reasoning, model: tier.nyx },
      thorne: { vote: thorne.vote, reasoning: thorne.reasoning, model: tier.thorne },
      total_tokens: totalTokens, total_cost: totalCost, budget_tier: tierName, reasoning
    }
  }, headers, 201);
}

async function trinityConsult(req: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  const body = await req.json() as any;
  const { voice, question, context, model } = body;
  if (!voice || !question) return d({ error: 'voice and question required' }, headers, 400);

  const voiceKey = voice.toUpperCase() as keyof typeof TRINITY_VOICES;
  const voiceConfig = TRINITY_VOICES[voiceKey];
  if (!voiceConfig) return d({ error: `Unknown voice: ${voice}. Use SAGE, NYX, or THORNE` }, headers, 400);

  const modelId = model || MODEL_TIERS.standard[voiceKey.toLowerCase() as 'sage' | 'nyx' | 'thorne'];
  const userPrompt = context ? `Question: ${question}\n\nContext: ${context}` : `Question: ${question}`;
  const result = await callLLM(env, modelId, voiceConfig.systemPrompt, userPrompt);
  const parsed = parseVote(result.text);

  return d({
    voice: voiceConfig.name, role: voiceConfig.role, vote: parsed.vote,
    reasoning: parsed.reasoning, model: modelId, tokens: result.tokens, raw: result.text
  }, headers);
}

async function trinityProviders(env: Env, headers: Record<string, string>): Promise<Response> {
  return d({
    tiers: MODEL_TIERS,
    voices: {
      SAGE: { weight: TRINITY_VOICES.SAGE.weight, role: TRINITY_VOICES.SAGE.role },
      NYX: { weight: TRINITY_VOICES.NYX.weight, role: TRINITY_VOICES.NYX.role },
      THORNE: { weight: TRINITY_VOICES.THORNE.weight, role: TRINITY_VOICES.THORNE.role }
    },
    threshold: 0.6
  }, headers);
}

async function trinityHarmony(env: Env, headers: Record<string, string>): Promise<Response> {
  const rows = await env.DB.prepare(
    `SELECT consensus_score, harmony_index, approved FROM trinity_decisions ORDER BY created_at DESC LIMIT 20`
  ).all();
  const decisions = rows.results || [];
  if (decisions.length === 0) return d({ harmony: 1.0, avg_consensus: 0, decisions_count: 0, approval_rate: 0 }, headers);

  const avgConsensus = round2(decisions.reduce((s: number, r: any) => s + (r.consensus_score || 0), 0) / decisions.length);
  const avgHarmony = round2(decisions.reduce((s: number, r: any) => s + (r.harmony_index || 0), 0) / decisions.length);
  const approvalRate = round2(decisions.filter((r: any) => r.approved).length / decisions.length);

  return d({ harmony: avgHarmony, avg_consensus: avgConsensus, decisions_count: decisions.length, approval_rate: approvalRate }, headers);
}

async function trinityHistory(url: URL, env: Env, headers: Record<string, string>): Promise<Response> {
  const { page, limit, offset } = paginate(url);
  const countR = await env.DB.prepare(`SELECT COUNT(*) as cnt FROM trinity_decisions`).first() as any;
  const total = countR?.cnt || 0;
  const rows = await env.DB.prepare(
    `SELECT * FROM trinity_decisions ORDER BY created_at DESC LIMIT ? OFFSET ?`
  ).bind(limit, offset).all();
  return d(paginatedResponse(rows.results || [], total, page, limit), headers);
}

// ─── GUILD MANAGEMENT ─────────────────────────────────────────


async function guildList(env: Env, headers: Record<string, string>): Promise<Response> {
  const counts = await env.DB.prepare(
    `SELECT guild, COUNT(*) as agent_count FROM agents WHERE guild IS NOT NULL GROUP BY guild`
  ).all();
  const countMap: Record<string, number> = {};
  for (const r of (counts.results || [])) countMap[r.guild as string] = r.agent_count as number;

  const guilds = Object.entries(GUILDS).map(([id, g]) => ({
    id, ...g, agent_count: countMap[id] || 0, available: (countMap[id] || 0) < g.maxCapacity
  }));
  return d({ guilds, total: guilds.length }, headers);
}

async function guildGet(id: string, env: Env, headers: Record<string, string>): Promise<Response> {
  const guild = GUILDS[id.toUpperCase()];
  if (!guild) return d({ error: `Unknown guild: ${id}` }, headers, 404);

  const members = await env.DB.prepare(
    `SELECT id, name, agent_type, rank, status, performance_score, tasks_completed FROM agents WHERE guild = ? ORDER BY rank_score DESC`
  ).bind(id.toUpperCase()).all();

  return d({
    guild: { id: id.toUpperCase(), ...guild, members: members.results || [], agent_count: (members.results || []).length }
  }, headers);
}

async function guildAssign(req: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  const body = await req.json() as any;
  const { agent_id, guild_id } = body;
  if (!agent_id || !guild_id) return d({ error: 'agent_id and guild_id required' }, headers, 400);

  const guildKey = guild_id.toUpperCase();
  const guild = GUILDS[guildKey];
  if (!guild) return d({ error: `Unknown guild: ${guild_id}` }, headers, 404);

  const agent = await env.DB.prepare(`SELECT * FROM agents WHERE id = ?`).bind(agent_id).first() as any;
  if (!agent) return d({ error: 'Agent not found' }, headers, 404);

  if (!guild.types.includes(agent.agent_type)) {
    return d({ error: `Agent type ${agent.agent_type} not allowed in ${guildKey}. Allowed: ${guild.types.join(', ')}` }, headers, 400);
  }

  const count = await env.DB.prepare(`SELECT COUNT(*) as cnt FROM agents WHERE guild = ?`).bind(guildKey).first() as any;
  if ((count?.cnt || 0) >= guild.maxCapacity) return d({ error: `Guild ${guildKey} is at capacity (${guild.maxCapacity})` }, headers, 409);

  const oldGuild = agent.guild;
  await env.DB.prepare(`UPDATE agents SET guild = ? WHERE id = ?`).bind(guildKey, agent_id).run();

  await emitEvent(env, 'guild.assigned', 'agent', agent_id, { guild: guildKey, previous: oldGuild });
  await auditLog(env, 'guild.assign', 'commander', 'agent', agent_id, { guild: guildKey, previous: oldGuild }, getClientIP(req));

  return d({ success: true, agent_id, guild: guildKey, previous_guild: oldGuild }, headers);
}

// ─── SWARM OPERATIONS ─────────────────────────────────────────

async function swarmDeploy(req: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  const body = await req.json() as any;
  const { count, agent_type, guild, capabilities, name_prefix } = body;
  const n = Math.min(50, Math.max(1, count || 1));

  const agents: any[] = [];
  for (let i = 0; i < n; i++) {
    const id = uid('agent');
    const name = `${name_prefix || agent_type || 'Worker'}-${i + 1}-${id.slice(-4)}`;
    const caps = JSON.stringify(capabilities || []);
    await env.DB.prepare(
      `INSERT INTO agents (id, name, agent_type, guild, capabilities, status, rank, rank_score, performance_score)
       VALUES (?, ?, ?, ?, ?, 'active', 'EMBRYO', 30, 100.0)`
    ).bind(id, name, agent_type || 'WORKER', guild || null, caps).run();
    agents.push({ id, name, type: agent_type || 'WORKER', guild: guild || null });
  }

  await emitEvent(env, 'swarm.deployed', 'swarm', 'batch', { count: n, agent_type, guild });
  await auditLog(env, 'swarm.deploy', 'commander', 'swarm', 'batch', { count: n, ids: agents.map(a => a.id) }, getClientIP(req));

  return d({ deployed: n, agents }, headers, 201);
}

async function swarmPopulate(req: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  const body = await req.json() as any;
  const { blueprint } = body;
  if (!blueprint || !Array.isArray(blueprint)) return d({ error: 'blueprint array required: [{type, guild, count, capabilities}]' }, headers, 400);

  let totalDeployed = 0;
  const results: any[] = [];

  for (const spec of blueprint) {
    const n = Math.min(50, Math.max(1, spec.count || 1));
    const ids: string[] = [];
    for (let i = 0; i < n; i++) {
      const id = uid('agent');
      const name = `${spec.type || 'WORKER'}-${spec.guild || 'UNASSIGNED'}-${i + 1}`;
      await env.DB.prepare(
        `INSERT INTO agents (id, name, agent_type, guild, capabilities, status, rank, rank_score, performance_score)
         VALUES (?, ?, ?, ?, ?, 'active', 'EMBRYO', 30, 100.0)`
      ).bind(id, name, spec.type || 'WORKER', spec.guild || null, JSON.stringify(spec.capabilities || [])).run();
      ids.push(id);
    }
    totalDeployed += n;
    results.push({ type: spec.type, guild: spec.guild, count: n, ids });
  }

  await auditLog(env, 'swarm.populate', 'commander', 'swarm', 'mass', { totalDeployed, specs: blueprint.length }, getClientIP(req));
  return d({ total_deployed: totalDeployed, groups: results }, headers, 201);
}

async function swarmRebalance(req: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  // Find guilds over/under capacity and rebalance idle agents
  const counts = await env.DB.prepare(
    `SELECT guild, COUNT(*) as cnt FROM agents WHERE guild IS NOT NULL AND status = 'active' GROUP BY guild`
  ).all();
  const countMap: Record<string, number> = {};
  for (const r of (counts.results || [])) countMap[r.guild as string] = r.cnt as number;

  const unassigned = await env.DB.prepare(
    `SELECT id, agent_type FROM agents WHERE (guild IS NULL OR guild = '') AND status = 'active' AND current_task_id IS NULL LIMIT 50`
  ).all();

  let reassigned = 0;
  const moves: any[] = [];

  for (const agent of (unassigned.results || [])) {
    for (const [guildId, guild] of Object.entries(GUILDS)) {
      if (guild.types.includes(agent.agent_type as string) && (countMap[guildId] || 0) < guild.maxCapacity) {
        await env.DB.prepare(`UPDATE agents SET guild = ? WHERE id = ?`).bind(guildId, agent.id).run();
        countMap[guildId] = (countMap[guildId] || 0) + 1;
        moves.push({ agent_id: agent.id, guild: guildId });
        reassigned++;
        break;
      }
    }
  }

  await auditLog(env, 'swarm.rebalance', 'system', 'swarm', 'rebalance', { reassigned, moves: moves.length }, getClientIP(req));
  return d({ reassigned, moves, guild_counts: countMap }, headers);
}

async function swarmPopulation(env: Env, headers: Record<string, string>): Promise<Response> {
  const byType = await env.DB.prepare(`SELECT agent_type, COUNT(*) as cnt FROM agents GROUP BY agent_type`).all();
  const byGuild = await env.DB.prepare(`SELECT guild, COUNT(*) as cnt FROM agents WHERE guild IS NOT NULL GROUP BY guild`).all();
  const byRank = await env.DB.prepare(`SELECT rank, COUNT(*) as cnt FROM agents GROUP BY rank`).all();
  const byStatus = await env.DB.prepare(`SELECT status, COUNT(*) as cnt FROM agents GROUP BY status`).all();
  const total = await env.DB.prepare(`SELECT COUNT(*) as cnt FROM agents`).first() as any;
  const idle = await env.DB.prepare(`SELECT COUNT(*) as cnt FROM agents WHERE current_task_id IS NULL AND status = 'active'`).first() as any;

  const toMap = (rows: any[]) => Object.fromEntries(rows.map(r => [r.agent_type || r.guild || r.rank || r.status, r.cnt]));

  return d({
    total: total?.cnt || 0,
    idle: idle?.cnt || 0,
    by_type: toMap(byType.results || []),
    by_guild: toMap(byGuild.results || []),
    by_rank: toMap(byRank.results || []),
    by_status: toMap(byStatus.results || [])
  }, headers);
}

async function swarmProcess(req: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  // Match pending tasks to idle agents
  const pending = await env.DB.prepare(
    `SELECT * FROM tasks WHERE status = 'pending' AND assigned_to IS NULL ORDER BY priority DESC, created_at ASC LIMIT 50`
  ).all();
  const idle = await env.DB.prepare(
    `SELECT * FROM agents WHERE status = 'active' AND current_task_id IS NULL ORDER BY performance_score DESC LIMIT 50`
  ).all();

  const assigned: any[] = [];
  const usedAgents = new Set<string>();
  const now = v();

  for (const task of (pending.results || [])) {
    const reqCaps = safeParse(task.required_capabilities, []) as string[];
    for (const agent of (idle.results || [])) {
      if (usedAgents.has(agent.id as string)) continue;
      if (task.guild && agent.guild !== task.guild) continue;

      const agentCaps = safeParse(agent.capabilities, []) as string[];
      if (reqCaps.length > 0 && !reqCaps.every((c: string) => agentCaps.includes(c))) continue;

      // Match found
      await env.DB.prepare(`UPDATE tasks SET status = 'in_progress', assigned_to = ?, started_at = ? WHERE id = ?`)
        .bind(agent.id, now, task.id).run();
      await env.DB.prepare(`UPDATE agents SET current_task_id = ? WHERE id = ?`).bind(task.id, agent.id).run();

      usedAgents.add(agent.id as string);
      assigned.push({ task_id: task.id, agent_id: agent.id, title: task.title });
      break;
    }
  }

  if (assigned.length > 0) {
    await emitEvent(env, 'swarm.processed', 'swarm', 'batch', { matched: assigned.length });
  }

  return d({ matched: assigned.length, assignments: assigned, pending_remaining: (pending.results || []).length - assigned.length }, headers);
}

async function swarmThink(req: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  const body = await req.json() as any;
  const { topic, context, model } = body;
  if (!topic) return d({ error: 'topic required' }, headers, 400);

  const agentCount = await env.DB.prepare(`SELECT COUNT(*) as cnt FROM agents WHERE status = 'active'`).first() as any;
  const taskStats = await env.DB.prepare(
    `SELECT status, COUNT(*) as cnt FROM tasks GROUP BY status`
  ).all();
  const statsMap: Record<string, number> = {};
  for (const r of (taskStats.results || [])) statsMap[r.status as string] = r.cnt as number;

  const systemPrompt = `You are the COLLECTIVE INTELLIGENCE of a swarm of ${agentCount?.cnt || 0} AI agents. Current task stats: ${JSON.stringify(statsMap)}. Think as a unified hive mind. Provide strategic analysis.`;
  const userPrompt = context ? `Topic: ${topic}\n\nContext: ${context}` : `Topic: ${topic}`;

  const result = await callLLM(env, model || 'anthropic/claude-3.5-haiku', systemPrompt, userPrompt);

  return d({
    thought: result.text,
    swarm_size: agentCount?.cnt || 0,
    task_stats: statsMap,
    tokens: result.tokens,
    model: model || 'anthropic/claude-3.5-haiku'
  }, headers);
}

async function swarmVote(req: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  const body = await req.json() as any;
  const { proposal, voter_count, model } = body;
  if (!proposal) return d({ error: 'proposal required' }, headers, 400);

  const n = Math.min(10, Math.max(3, voter_count || 5));
  const modelId = model || 'meta-llama/llama-3.1-8b-instruct:free';
  const systemPrompt = 'You are an AI agent voting on a proposal. Respond with exactly: VOTE: YES or VOTE: NO, then a one-sentence reason.';

  const votes = await Promise.all(
    Array.from({ length: n }, (_, i) =>
      callLLM(env, modelId, `${systemPrompt} You are voter #${i + 1}.`, `Proposal: ${proposal}`)
    )
  );

  let yes = 0, no = 0;
  const breakdown: any[] = [];
  for (let i = 0; i < votes.length; i++) {
    const isYes = /VOTE:\s*YES/i.test(votes[i].text);
    if (isYes) yes++; else no++;
    breakdown.push({ voter: i + 1, vote: isYes ? 'YES' : 'NO', reasoning: votes[i].text.slice(0, 200), tokens: votes[i].tokens });
  }

  const approved = yes > no;
  const totalTokens = votes.reduce((s, v) => s + v.tokens, 0);

  return d({
    proposal, approved, yes, no, total_voters: n,
    approval_rate: round2(yes / n),
    breakdown, total_tokens: totalTokens, model: modelId
  }, headers);
}

// ─── MEMORY SYSTEM ────────────────────────────────────────────

async function memoryStore(req: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  const body = await req.json() as any;
  const { key, value, category, pillar, ttl_seconds, metadata } = body;
  if (!key || value === undefined) return d({ error: 'key and value required' }, headers, 400);

  const serialized = typeof value === 'string' ? value : JSON.stringify(value);
  const now = v();

  // Store in KV with optional TTL
  const kvOpts: any = {};
  if (ttl_seconds && ttl_seconds > 0) kvOpts.expirationTtl = ttl_seconds;
  if (ttl_seconds && ttl_seconds < 60) kvOpts.expirationTtl = 60; // KV minimum
  await env.MEMORY_KV.put(`mem:${key}`, serialized, kvOpts.expirationTtl ? kvOpts : undefined);

  // Upsert in D1
  await env.DB.prepare(
    `INSERT INTO memory (key, value, category, pillar, ttl_seconds, decay_score, created_at, updated_at, access_count)
     VALUES (?, ?, ?, ?, ?, 1.0, ?, ?, 0)
     ON CONFLICT(key) DO UPDATE SET value = ?, category = ?, pillar = ?, ttl_seconds = ?, updated_at = ?, decay_score = MIN(1.0, decay_score + 0.1)`
  ).bind(key, serialized, category || 'general', pillar || 'short_term', ttl_seconds || null, now, now,
    serialized, category || 'general', pillar || 'short_term', ttl_seconds || null, now).run();

  await emitEvent(env, 'memory.stored', 'memory', key, { category, pillar, hasTTL: !!ttl_seconds });
  return d({ stored: true, key, category: category || 'general', pillar: pillar || 'short_term' }, headers, 201);
}

async function memorySearch(url: URL, env: Env, headers: Record<string, string>): Promise<Response> {
  const q = url.searchParams.get('q') || '';
  const pillar = url.searchParams.get('pillar');
  const category = url.searchParams.get('category');
  const { page, limit, offset } = paginate(url);

  let where = 'WHERE 1=1';
  const binds: any[] = [];
  if (q) { where += ' AND (key LIKE ? OR value LIKE ? OR category LIKE ?)'; binds.push(`%${q}%`, `%${q}%`, `%${q}%`); }
  if (pillar) { where += ' AND pillar = ?'; binds.push(pillar); }
  if (category) { where += ' AND category = ?'; binds.push(category); }

  const countR = await env.DB.prepare(`SELECT COUNT(*) as cnt FROM memory ${where}`).bind(...binds).first() as any;
  const total = countR?.cnt || 0;

  const rows = await env.DB.prepare(
    `SELECT key, category, pillar, decay_score, access_count, created_at, updated_at FROM memory ${where} ORDER BY decay_score DESC, updated_at DESC LIMIT ? OFFSET ?`
  ).bind(...binds, limit, offset).all();

  return d(paginatedResponse(rows.results || [], total, page, limit), headers);
}

async function memoryRecall(key: string, env: Env, headers: Record<string, string>): Promise<Response> {
  // Try KV first (fast)
  const kvValue = await env.MEMORY_KV.get(`mem:${key}`);

  // Update access count in D1
  await env.DB.prepare(`UPDATE memory SET access_count = access_count + 1, decay_score = MIN(1.0, decay_score + 0.05), updated_at = ? WHERE key = ?`).bind(v(), key).run();

  if (kvValue !== null) {
    const meta = await env.DB.prepare(`SELECT category, pillar, decay_score, access_count, created_at, updated_at FROM memory WHERE key = ?`).bind(key).first();
    let parsed: any;
    try { parsed = JSON.parse(kvValue); } catch { parsed = kvValue; }
    return d({ key, value: parsed, source: 'kv', ...(meta || {}) }, headers);
  }

  // Fallback to D1
  const row = await env.DB.prepare(`SELECT * FROM memory WHERE key = ?`).bind(key).first() as any;
  if (!row) return d({ error: 'Memory not found' }, headers, 404);

  // Re-populate KV
  await env.MEMORY_KV.put(`mem:${key}`, row.value, row.ttl_seconds && row.ttl_seconds >= 60 ? { expirationTtl: row.ttl_seconds } : undefined);

  let parsed: any;
  try { parsed = JSON.parse(row.value); } catch { parsed = row.value; }
  return d({ key, value: parsed, source: 'd1', category: row.category, pillar: row.pillar, decay_score: row.decay_score, access_count: row.access_count }, headers);
}

async function memoryDelete(key: string, env: Env, headers: Record<string, string>): Promise<Response> {
  await env.MEMORY_KV.delete(`mem:${key}`);
  const r = await env.DB.prepare(`DELETE FROM memory WHERE key = ?`).bind(key).run();
  const deleted = (r.meta?.changes || 0) > 0;

  if (deleted) {
    await emitEvent(env, 'memory.deleted', 'memory', key, {});
  }

  return d({ deleted, key }, headers);
}

async function memoryCleanExpired(env: Env): Promise<{ cleaned: number }> {
  const now = v();
  const result = await env.DB.prepare(
    `DELETE FROM memory WHERE ttl_seconds IS NOT NULL AND ttl_seconds > 0
     AND datetime(updated_at, '+' || ttl_seconds || ' seconds') < ?`
  ).bind(now).run();
  const cleaned = result.meta?.changes || 0;
  if (cleaned > 0) log('info', 'Memory cleanup: expired entries removed', { cleaned });
  return { cleaned };
}

async function memoryDecay(env: Env): Promise<{ decayed: number; pruned: number }> {
  // Reduce decay_score for memories not accessed recently
  const decayResult = await env.DB.prepare(
    `UPDATE memory SET decay_score = MAX(0, decay_score - 0.01)
     WHERE pillar != 'permanent' AND updated_at < datetime('now', '-1 day')`
  ).run();
  const decayed = decayResult.meta?.changes || 0;

  // Prune memories with zero decay score (except permanent pillar)
  const pruneResult = await env.DB.prepare(
    `DELETE FROM memory WHERE decay_score <= 0 AND pillar != 'permanent'`
  ).run();
  const pruned = pruneResult.meta?.changes || 0;

  // Also delete from KV for pruned entries
  if (pruned > 0) {
    const toDelete = await env.DB.prepare(
      `SELECT key FROM memory WHERE decay_score <= 0.01 AND pillar != 'permanent' LIMIT 50`
    ).all();
    for (const r of (toDelete.results || [])) {
      await env.MEMORY_KV.delete(`mem:${r.key}`);
    }
  }

  if (decayed > 0 || pruned > 0) log('info', 'Memory decay cycle', { decayed, pruned });
  return { decayed, pruned };
}

async function memoryConsolidate(env: Env): Promise<{ consolidated: number }> {
  // Move frequently accessed short_term memories to long_term
  const result = await env.DB.prepare(
    `UPDATE memory SET pillar = 'long_term', decay_score = MIN(1.0, decay_score + 0.2)
     WHERE pillar = 'short_term' AND access_count >= 10 AND decay_score > 0.5`
  ).run();
  const promoted = result.meta?.changes || 0;

  // Move very high access long_term to permanent
  const permResult = await env.DB.prepare(
    `UPDATE memory SET pillar = 'permanent', decay_score = 1.0
     WHERE pillar = 'long_term' AND access_count >= 50`
  ).run();
  const permanent = permResult.meta?.changes || 0;

  const consolidated = promoted + permanent;
  if (consolidated > 0) log('info', 'Memory consolidation', { promoted, permanent });
  return { consolidated };
}


// ============================================================
// PART 3: Workflows, Mesh, Analytics, Cost, Commander, LLM, MoltBook, Router
// ============================================================

async function workflowCreate(req: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  const body = await req.json() as any;
  const { name, steps, metadata } = body;
  if (!name || !steps || !Array.isArray(steps) || steps.length === 0) {
    return d({ ok: false, error: 'name and steps (non-empty array) required' }, headers, 400);
  }
  const id = uid('wf');
  const totalSteps = steps.length;
  await env.DB.prepare(
    `INSERT INTO workflows (id, name, status, steps, current_step, total_steps, created_at, metadata)
     VALUES (?, ?, 'active', ?, 0, ?, datetime('now'), ?)`
  ).bind(id, name, JSON.stringify(steps), totalSteps, JSON.stringify(metadata || {})).run();

  // Create tasks for step 0
  const step0 = steps[0];
  if (step0?.title) {
    const taskId = uid('task');
    await env.DB.prepare(
      `INSERT INTO tasks (id, title, description, task_type, priority, status, workflow_id, workflow_step, created_by, metadata)
       VALUES (?, ?, ?, 'workflow', ?, 'pending', ?, 0, 'workflow_engine', ?)`
    ).bind(taskId, step0.title, step0.description || '', step0.priority || 3, id, JSON.stringify(step0.metadata || {})).run();
  }

  await emitEvent(env, 'workflow.created', 'workflow', id, { name, totalSteps });
  await auditLog(env, 'workflow.create', 'system', 'workflow', id, { name, totalSteps }, getClientIP(req));
  return d({ ok: true, workflowId: id, name, totalSteps, status: 'active', created: v() }, headers, 201);
}

async function workflowList(url: URL, env: Env, headers: Record<string, string>): Promise<Response> {
  const status = url.searchParams.get('status');
  const { page, limit, offset } = paginate(url);
  let countSql = 'SELECT COUNT(*) as c FROM workflows';
  let dataSql = 'SELECT * FROM workflows';
  const params: any[] = [];
  if (status) {
    countSql += ' WHERE status = ?';
    dataSql += ' WHERE status = ?';
    params.push(status);
  }
  const total = (await env.DB.prepare(countSql).bind(...params).first<{ c: number }>())?.c || 0;
  dataSql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  const { results } = await env.DB.prepare(dataSql).bind(...params, limit, offset).all();
  const data = (results || []).map((w: any) => ({ ...w, steps: safeParse(w.steps, []), metadata: safeParse(w.metadata, {}) }));
  return d({ ok: true, ...paginatedResponse(data, total, page, limit) }, headers);
}

async function workflowGet(workflowId: string, env: Env, headers: Record<string, string>): Promise<Response> {
  const wf = await env.DB.prepare('SELECT * FROM workflows WHERE id = ?').bind(workflowId).first();
  if (!wf) return d({ ok: false, error: 'Workflow not found' }, headers, 404);
  const tasks = (await env.DB.prepare(
    'SELECT id, title, status, workflow_step FROM tasks WHERE workflow_id = ? ORDER BY workflow_step ASC'
  ).bind(workflowId).all()).results || [];
  return d({
    ok: true,
    workflow: { ...wf, steps: safeParse(wf.steps, []), metadata: safeParse(wf.metadata, {}) },
    tasks,
  }, headers);
}

async function workflowAdvance(workflowId: string, env: Env, headers: Record<string, string>): Promise<Response> {
  const wf = await env.DB.prepare('SELECT * FROM workflows WHERE id = ?').bind(workflowId).first<any>();
  if (!wf) return d({ ok: false, error: 'Workflow not found' }, headers, 404);
  if (wf.status !== 'active') return d({ ok: false, error: `Workflow is ${wf.status}, cannot advance` }, headers, 400);

  const steps = safeParse(wf.steps, []) as any[];
  const nextStep = (wf.current_step || 0) + 1;

  if (nextStep >= wf.total_steps) {
    await env.DB.prepare(
      "UPDATE workflows SET status = 'completed', current_step = ?, completed_at = datetime('now') WHERE id = ?"
    ).bind(nextStep, workflowId).run();
    await emitEvent(env, 'workflow.completed', 'workflow', workflowId, { totalSteps: wf.total_steps });
    return d({ ok: true, workflowId, status: 'completed', currentStep: nextStep, totalSteps: wf.total_steps }, headers);
  }

  await env.DB.prepare('UPDATE workflows SET current_step = ? WHERE id = ?').bind(nextStep, workflowId).run();

  const stepDef = steps[nextStep];
  if (stepDef?.title) {
    const taskId = uid('task');
    await env.DB.prepare(
      `INSERT INTO tasks (id, title, description, task_type, priority, status, workflow_id, workflow_step, created_by, metadata)
       VALUES (?, ?, ?, 'workflow', ?, 'pending', ?, ?, 'workflow_engine', ?)`
    ).bind(taskId, stepDef.title, stepDef.description || '', stepDef.priority || 3, workflowId, nextStep, JSON.stringify(stepDef.metadata || {})).run();
  }

  await emitEvent(env, 'workflow.advanced', 'workflow', workflowId, { step: nextStep, totalSteps: wf.total_steps });
  return d({ ok: true, workflowId, status: 'active', currentStep: nextStep, totalSteps: wf.total_steps }, headers);
}

async function workflowCancel(workflowId: string, env: Env, headers: Record<string, string>): Promise<Response> {
  const wf = await env.DB.prepare('SELECT * FROM workflows WHERE id = ?').bind(workflowId).first();
  if (!wf) return d({ ok: false, error: 'Workflow not found' }, headers, 404);
  await env.DB.prepare("UPDATE workflows SET status = 'cancelled', completed_at = datetime('now') WHERE id = ?").bind(workflowId).run();
  await env.DB.prepare("UPDATE tasks SET status = 'cancelled' WHERE workflow_id = ? AND status IN ('pending', 'in_progress')").bind(workflowId).run();
  await emitEvent(env, 'workflow.cancelled', 'workflow', workflowId, {});
  await auditLog(env, 'workflow.cancel', 'system', 'workflow', workflowId, {});
  return d({ ok: true, workflowId, status: 'cancelled' }, headers);
}

// ═══════════════════════════════════════════════════════════════
// 2. MESH NETWORK
// ═══════════════════════════════════════════════════════════════

async function meshConnect(req: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  const body = await req.json() as any;
  const { agent_a, agent_b, strength } = body;
  if (!agent_a || !agent_b) return d({ ok: false, error: 'agent_a and agent_b required' }, headers, 400);
  if (agent_a === agent_b) return d({ ok: false, error: 'Cannot connect agent to itself' }, headers, 400);

  const [a, b] = agent_a < agent_b ? [agent_a, agent_b] : [agent_b, agent_a];
  const s = Math.max(0, Math.min(1, strength ?? 0.5));

  await env.DB.prepare(
    `INSERT INTO mesh_links (agent_a, agent_b, strength, signals_sent, created_at)
     VALUES (?, ?, ?, 0, datetime('now'))
     ON CONFLICT(agent_a, agent_b) DO UPDATE SET strength = ?, signals_sent = signals_sent`
  ).bind(a, b, s, s).run();

  await emitEvent(env, 'mesh.connected', 'mesh', `${a}-${b}`, { agent_a: a, agent_b: b, strength: s });
  return d({ ok: true, link: { agent_a: a, agent_b: b, strength: s } }, headers);
}

async function meshTopology(env: Env, headers: Record<string, string>): Promise<Response> {
  const { results: links } = await env.DB.prepare(
    'SELECT * FROM mesh_links ORDER BY strength DESC LIMIT 500'
  ).all();
  const { results: agents } = await env.DB.prepare(
    "SELECT id, name, agent_type, guild, status FROM agents WHERE status IN ('active', 'stale') LIMIT 200"
  ).all();

  const nodeSet = new Set<string>();
  for (const link of (links || [])) {
    nodeSet.add(link.agent_a as string);
    nodeSet.add(link.agent_b as string);
  }

  const agentMap: Record<string, any> = {};
  for (const a of (agents || [])) agentMap[a.id as string] = a;

  const nodes = [...nodeSet].map(id => ({
    id,
    ...(agentMap[id] || { name: id, agent_type: 'unknown', guild: null, status: 'unknown' }),
  }));

  const totalSignals = (links || []).reduce((sum: number, l: any) => sum + (l.signals_sent || 0), 0);
  const avgStrength = (links || []).length > 0
    ? round2((links || []).reduce((sum: number, l: any) => sum + (l.strength || 0), 0) / (links || []).length)
    : 0;

  return d({
    ok: true,
    topology: {
      nodes,
      links: links || [],
      stats: { totalNodes: nodes.length, totalLinks: (links || []).length, totalSignals, avgStrength },
    },
  }, headers);
}

async function meshPropagate(req: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  const body = await req.json() as any;
  const { from_agent, signal, ttl } = body;
  if (!from_agent || !signal) return d({ ok: false, error: 'from_agent and signal required' }, headers, 400);

  const maxHops = Math.min(ttl || 3, 10);
  const visited = new Set<string>([from_agent]);
  let frontier = [from_agent];
  let hop = 0;
  let reached = 0;

  while (hop < maxHops && frontier.length > 0) {
    const nextFrontier: string[] = [];
    for (const agentId of frontier) {
      const { results: neighbors } = await env.DB.prepare(
        'SELECT agent_a, agent_b FROM mesh_links WHERE (agent_a = ? OR agent_b = ?) AND strength >= 0.3'
      ).bind(agentId, agentId).all();
      for (const n of (neighbors || [])) {
        const peer = (n.agent_a === agentId ? n.agent_b : n.agent_a) as string;
        if (!visited.has(peer)) {
          visited.add(peer);
          nextFrontier.push(peer);
          reached++;
          // Increment signal count
          const [a, b] = agentId < peer ? [agentId, peer] : [peer, agentId];
          await env.DB.prepare(
            'UPDATE mesh_links SET signals_sent = signals_sent + 1 WHERE agent_a = ? AND agent_b = ?'
          ).bind(a, b).run();
          // Deliver as direct message
          await env.DB.prepare(
            "INSERT INTO messages (type, from_agent, to_agent, content, priority, created_at) VALUES ('signal', ?, ?, ?, 'normal', datetime('now'))"
          ).bind(from_agent, peer, JSON.stringify({ signal, hop: hop + 1, origin: from_agent })).run();
        }
      }
    }
    frontier = nextFrontier;
    hop++;
  }

  await emitEvent(env, 'mesh.propagated', 'mesh', from_agent, { signal, hops: hop, reached });
  return d({ ok: true, origin: from_agent, signal, hops: hop, agentsReached: reached, totalVisited: visited.size }, headers);
}

// ═══════════════════════════════════════════════════════════════
// 3. ANALYTICS
// ═══════════════════════════════════════════════════════════════

async function analyticsOverview(env: Env, headers: Record<string, string>): Promise<Response> {
  const totalAgents = (await env.DB.prepare('SELECT COUNT(*) as c FROM agents').first<{ c: number }>())?.c || 0;
  const activeAgents = (await env.DB.prepare("SELECT COUNT(*) as c FROM agents WHERE status='active'").first<{ c: number }>())?.c || 0;
  const totalTasks = (await env.DB.prepare('SELECT COUNT(*) as c FROM tasks').first<{ c: number }>())?.c || 0;
  const completedTasks = (await env.DB.prepare("SELECT COUNT(*) as c FROM tasks WHERE status='completed'").first<{ c: number }>())?.c || 0;
  const failedTasks = (await env.DB.prepare("SELECT COUNT(*) as c FROM tasks WHERE status='failed'").first<{ c: number }>())?.c || 0;
  const avgPerf = (await env.DB.prepare("SELECT AVG(performance_score) as avg FROM agents WHERE status='active'").first<{ avg: number }>())?.avg || 0;
  const totalCost = (await env.DB.prepare('SELECT SUM(cost) as total FROM cost_events').first<{ total: number }>())?.total || 0;
  const todayCost = (await env.DB.prepare("SELECT SUM(cost) as total FROM cost_events WHERE created_at > datetime('now', 'start of day')").first<{ total: number }>())?.total || 0;
  const meshLinks = (await env.DB.prepare('SELECT COUNT(*) as c FROM mesh_links').first<{ c: number }>())?.c || 0;
  const activeWorkflows = (await env.DB.prepare("SELECT COUNT(*) as c FROM workflows WHERE status='active'").first<{ c: number }>())?.c || 0;
  const memoryKeys = (await env.DB.prepare('SELECT COUNT(*) as c FROM memory').first<{ c: number }>())?.c || 0;
  const trinityDecisions = (await env.DB.prepare('SELECT COUNT(*) as c FROM trinity_decisions').first<{ c: number }>())?.c || 0;
  const llmModels = (await env.DB.prepare("SELECT COUNT(*) as c FROM llm_models WHERE status='active'").first<{ c: number }>())?.c || 0;
  const totalLlmCalls = (await env.DB.prepare('SELECT COUNT(*) as c FROM llm_usage').first<{ c: number }>())?.c || 0;

  return d({
    ok: true,
    overview: {
      agents: { total: totalAgents, active: activeAgents, avgPerformance: round2(avgPerf) },
      tasks: {
        total: totalTasks, completed: completedTasks, failed: failedTasks,
        successRate: totalTasks > 0 ? round2((completedTasks / totalTasks) * 100) : 0,
      },
      costs: { total: round2(totalCost), today: round2(todayCost) },
      mesh: { links: meshLinks },
      workflows: { active: activeWorkflows },
      memory: { keys: memoryKeys },
      trinity: { decisions: trinityDecisions },
      llm: { models: llmModels, totalCalls: totalLlmCalls },
      timestamp: v(),
    },
  }, headers);
}

async function analyticsTaskThroughput(url: URL, env: Env, headers: Record<string, string>): Promise<Response> {
  const period = url.searchParams.get('period') || '24h';
  let interval: string;
  switch (period) {
    case '1h': interval = '-1 hour'; break;
    case '6h': interval = '-6 hours'; break;
    case '7d': interval = '-7 days'; break;
    case '30d': interval = '-30 days'; break;
    default: interval = '-24 hours';
  }
  const { results } = await env.DB.prepare(`
    SELECT strftime('%Y-%m-%dT%H:00:00Z', completed_at) as hour, COUNT(*) as count,
           AVG(duration_seconds) as avg_duration
    FROM tasks WHERE status = 'completed' AND completed_at > datetime('now', ?)
    GROUP BY hour ORDER BY hour ASC
  `).bind(interval).all();
  return d({ ok: true, throughput: results || [], period }, headers);
}

async function analyticsGuildRanking(env: Env, headers: Record<string, string>): Promise<Response> {
  const rankings: any[] = [];
  for (const [guildName] of Object.entries(GUILDS)) {
    const stats = await env.DB.prepare(`
      SELECT COUNT(*) as members, AVG(performance_score) as avgPerf, SUM(tasks_completed) as totalTasks
      FROM agents WHERE guild = ? AND status = 'active'
    `).bind(guildName).first<any>();
    rankings.push({
      guild: guildName,
      members: stats?.members || 0,
      avgPerformance: round2(stats?.avgPerf || 0),
      totalTasksCompleted: stats?.totalTasks || 0,
      score: round2(((stats?.avgPerf || 0) * 0.6) + ((stats?.totalTasks || 0) * 0.4)),
    });
  }
  rankings.sort((a, b) => b.score - a.score);
  return d({ ok: true, rankings }, headers);
}

async function analyticsAgentHistory(agentId: string, url: URL, env: Env, headers: Record<string, string>): Promise<Response> {
  const agent = await env.DB.prepare('SELECT * FROM agents WHERE id = ?').bind(agentId).first();
  if (!agent) return d({ ok: false, error: 'Agent not found' }, headers, 404);
  const { page, limit, offset } = paginate(url);
  const total = (await env.DB.prepare('SELECT COUNT(*) as c FROM tasks WHERE assigned_to = ?').bind(agentId).first<{ c: number }>())?.c || 0;
  const { results: tasks } = await env.DB.prepare(
    'SELECT id, title, status, duration_seconds, completed_at FROM tasks WHERE assigned_to = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
  ).bind(agentId, limit, offset).all();
  const llmUsage = (await env.DB.prepare(
    'SELECT model_id, SUM(input_tokens) as input_tokens, SUM(output_tokens) as output_tokens, SUM(cost) as cost, COUNT(*) as calls FROM llm_usage WHERE agent_id = ? GROUP BY model_id'
  ).bind(agentId).all()).results || [];
  return d({
    ok: true,
    agent: parseAgent(agent),
    ...paginatedResponse(tasks || [], total, page, limit),
    llmUsage,
  }, headers);
}

// ═══════════════════════════════════════════════════════════════
// 4. COST TRACKING
// ═══════════════════════════════════════════════════════════════

async function costTrack(req: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  const body = await req.json() as any;
  const { operation, provider, cost, agent_id, task_id, metadata } = body;
  if (!operation || cost === undefined) return d({ ok: false, error: 'operation and cost required' }, headers, 400);

  await env.DB.prepare(
    `INSERT INTO cost_events (operation, provider, cost, agent_id, task_id, created_at, metadata)
     VALUES (?, ?, ?, ?, ?, datetime('now'), ?)`
  ).bind(operation, provider || 'unknown', cost, agent_id || null, task_id || null, JSON.stringify(metadata || {})).run();

  // Check budget alerts
  const budget = await env.DB.prepare("SELECT daily_limit, alert_threshold FROM budgets WHERE id = 'global'").first<any>();
  if (budget?.daily_limit) {
    const todayTotal = (await env.DB.prepare("SELECT SUM(cost) as total FROM cost_events WHERE created_at > datetime('now', 'start of day')").first<{ total: number }>())?.total || 0;
    const threshold = budget.alert_threshold || 0.8;
    if (todayTotal >= budget.daily_limit * threshold) {
      await emitEvent(env, 'budget.alert', 'cost', 'global', {
        todayTotal: round2(todayTotal),
        dailyLimit: budget.daily_limit,
        pct: round2((todayTotal / budget.daily_limit) * 100),
      });
    }
  }

  await emitEvent(env, 'cost.tracked', 'cost', operation, { cost, provider, agent_id, task_id });
  return d({ ok: true, tracked: { operation, provider: provider || 'unknown', cost, agent_id, task_id } }, headers);
}

async function costSummary(env: Env, headers: Record<string, string>): Promise<Response> {
  const todayRow = await env.DB.prepare(
    "SELECT SUM(cost) as total, COUNT(*) as count FROM cost_events WHERE created_at > datetime('now', 'start of day')"
  ).first<any>();
  const weekRow = await env.DB.prepare(
    "SELECT SUM(cost) as total, COUNT(*) as count FROM cost_events WHERE created_at > datetime('now', '-7 days')"
  ).first<any>();
  const monthRow = await env.DB.prepare(
    "SELECT SUM(cost) as total, COUNT(*) as count FROM cost_events WHERE created_at > datetime('now', '-30 days')"
  ).first<any>();
  const allTimeRow = await env.DB.prepare('SELECT SUM(cost) as total, COUNT(*) as count FROM cost_events').first<any>();
  const byProvider = (await env.DB.prepare(
    "SELECT provider, SUM(cost) as total, COUNT(*) as count FROM cost_events WHERE created_at > datetime('now', '-30 days') GROUP BY provider ORDER BY total DESC"
  ).all()).results || [];
  const byOperation = (await env.DB.prepare(
    "SELECT operation, SUM(cost) as total, COUNT(*) as count FROM cost_events WHERE created_at > datetime('now', '-30 days') GROUP BY operation ORDER BY total DESC"
  ).all()).results || [];
  const budget = await env.DB.prepare("SELECT * FROM budgets WHERE id = 'global'").first<any>();

  return d({
    ok: true,
    costs: {
      today: { total: round2(todayRow?.total || 0), count: todayRow?.count || 0 },
      week: { total: round2(weekRow?.total || 0), count: weekRow?.count || 0 },
      month: { total: round2(monthRow?.total || 0), count: monthRow?.count || 0 },
      allTime: { total: round2(allTimeRow?.total || 0), count: allTimeRow?.count || 0 },
      byProvider,
      byOperation,
      budget: budget ? {
        dailyLimit: budget.daily_limit,
        monthlyLimit: budget.monthly_limit,
        alertThreshold: budget.alert_threshold,
        dailyRemaining: budget.daily_limit ? round2(budget.daily_limit - (todayRow?.total || 0)) : null,
        monthlyRemaining: budget.monthly_limit ? round2(budget.monthly_limit - (monthRow?.total || 0)) : null,
      } : null,
    },
  }, headers);
}

async function costBudgetGet(env: Env, headers: Record<string, string>): Promise<Response> {
  const budget = await env.DB.prepare("SELECT * FROM budgets WHERE id = 'global'").first();
  if (!budget) return d({ ok: true, budget: { id: 'global', daily_limit: null, monthly_limit: null, alert_threshold: 0.8 } }, headers);
  return d({ ok: true, budget }, headers);
}

async function costBudgetSet(req: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  const auth = await authenticateCommander(req, env);
  if (!auth.ok) return d({ ok: false, error: auth.error }, headers, auth.status || 403);
  const body = await req.json() as any;
  const { daily_limit, monthly_limit, alert_threshold } = body;
  await env.DB.prepare(
    `INSERT INTO budgets (id, daily_limit, monthly_limit, alert_threshold, updated_at)
     VALUES ('global', ?, ?, ?, datetime('now'))
     ON CONFLICT(id) DO UPDATE SET daily_limit = ?, monthly_limit = ?, alert_threshold = ?, updated_at = datetime('now')`
  ).bind(
    daily_limit ?? null, monthly_limit ?? null, alert_threshold ?? 0.8,
    daily_limit ?? null, monthly_limit ?? null, alert_threshold ?? 0.8
  ).run();
  await auditLog(env, 'budget.set', 'commander', 'budget', 'global', { daily_limit, monthly_limit, alert_threshold }, getClientIP(req));
  return d({ ok: true, budget: { daily_limit, monthly_limit, alert_threshold: alert_threshold ?? 0.8 } }, headers);
}

// ═══════════════════════════════════════════════════════════════
// 5. COMMANDER
// ═══════════════════════════════════════════════════════════════

async function commanderExecute(req: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  const auth = await authenticateCommander(req, env);
  if (!auth.ok) return d({ ok: false, error: auth.error }, headers, auth.status || 403);
  const body = await req.json() as any;
  const command = body.command as string;
  if (!command || !COMMANDER_COMMANDS.includes(command)) {
    return d({ ok: false, error: `Invalid command. Valid: ${COMMANDER_COMMANDS.join(', ')}` }, headers, 400);
  }

  const ip = getClientIP(req);
  let result: any = {};

  switch (command) {
    case 'deploy_sentinels': {
      const count = body.count || 10;
      const deployed: string[] = [];
      for (let i = 0; i < count; i++) {
        const id = uid('sentinel');
        await env.DB.prepare(
          `INSERT INTO agents (id, name, agent_type, rank, rank_score, guild, capabilities, status, performance_score, generation, last_heartbeat, metadata)
           VALUES (?, ?, 'SENTINEL', 'AGENT', 70, 'SECURITY_WATCH', '["monitoring","security","anomaly_detection"]', 'active', 100.0, 0, datetime('now'), '{}')`
        ).bind(id, `Sentinel-${rnd().toUpperCase()}`).run();
        deployed.push(id);
      }
      result = { deployed: deployed.length, ids: deployed };
      break;
    }
    case 'purge_dead': {
      const dead = await env.DB.prepare("SELECT COUNT(*) as c FROM agents WHERE status='dead'").first<{ c: number }>();
      await env.DB.prepare("DELETE FROM agents WHERE status='dead'").run();
      result = { purged: dead?.c || 0 };
      break;
    }
    case 'full_evolution': {
      const { results: agents } = await env.DB.prepare(
        "SELECT id, rank, rank_score, tasks_completed, performance_score, consecutive_failures, guild, generation FROM agents WHERE status='active'"
      ).all();
      let evolved = 0;
      for (const agent of (agents || []) as any[]) {
        const currentIdx = RANK_ORDER.indexOf(agent.rank);
        if (currentIdx < 0 || currentIdx >= RANK_ORDER.length - 1) continue;
        const nextRank = RANK_ORDER[currentIdx + 1];
        const req2 = RANK_THRESHOLDS[nextRank];
        if (!req2 || req2.impossible) continue;
        if (req2.minTasks && agent.tasks_completed < req2.minTasks) continue;
        if (req2.minPerf && agent.performance_score < req2.minPerf) continue;
        if (req2.maxConsecFail && agent.consecutive_failures > req2.maxConsecFail) continue;
        if (req2.requiresGuild && !agent.guild) continue;
        if (req2.minGen && (agent.generation || 0) < req2.minGen) continue;
        await env.DB.prepare('UPDATE agents SET rank = ?, rank_score = ? WHERE id = ?')
          .bind(nextRank, RANKS[nextRank] || agent.rank_score + 10, agent.id).run();
        evolved++;
      }
      result = { evaluated: (agents || []).length, evolved };
      break;
    }
    case 'consciousness_max': {
      await env.KV.put('consciousness:boost', JSON.stringify({ boost: 50, expires: Date.now() + 3600000 }));
      result = { boosted: true, amount: 50, expiresIn: '1 hour' };
      break;
    }
    case 'reset_swarm': {
      await env.DB.prepare("UPDATE agents SET status='dismissed'").run();
      await env.DB.prepare("UPDATE tasks SET status='cancelled' WHERE status IN ('pending','in_progress')").run();
      result = { reset: true, message: 'All agents dismissed, pending tasks cancelled' };
      break;
    }
    case 'export_state': {
      const agentCount = (await env.DB.prepare('SELECT COUNT(*) as c FROM agents').first<{ c: number }>())?.c || 0;
      const taskCount = (await env.DB.prepare('SELECT COUNT(*) as c FROM tasks').first<{ c: number }>())?.c || 0;
      const memCount = (await env.DB.prepare('SELECT COUNT(*) as c FROM memory').first<{ c: number }>())?.c || 0;
      const snapshot = { agents: agentCount, tasks: taskCount, memory: memCount, exported_at: v() };
      const key = `exports/state-${Date.now()}.json`;
      await env.R2.put(key, JSON.stringify(snapshot));
      result = { exported: true, r2Key: key, counts: snapshot };
      break;
    }
    case 'fleet_health': {
      const healthResults: any[] = [];
      for (const [name, url] of Object.entries(FLEET_WORKERS)) {
        const start = Date.now();
        try {
          const resp = await fetch(url as string, { method: 'GET', signal: AbortSignal.timeout(5000) });
          healthResults.push({ name, url, status: resp.ok ? 'healthy' : 'unhealthy', statusCode: resp.status, latencyMs: Date.now() - start });
        } catch (e: any) {
          healthResults.push({ name, url, status: 'down', error: e.message, latencyMs: Date.now() - start });
        }
      }
      result = { workers: healthResults, healthy: healthResults.filter(w => w.status === 'healthy').length, total: healthResults.length };
      break;
    }
    case 'mass_promote': {
      const targetRank = body.rank || 'AGENT';
      const minPerf = body.minPerformance || 80;
      const promoted = await env.DB.prepare(
        "UPDATE agents SET rank = ?, rank_score = ? WHERE status = 'active' AND performance_score >= ? AND rank_score < ?"
      ).bind(targetRank, RANKS[targetRank] || 70, minPerf, RANKS[targetRank] || 70).run();
      result = { promoted: promoted.meta?.changes || 0, targetRank, minPerformance: minPerf };
      break;
    }
    case 'populate_swarm': {
      const target = body.count || 100;
      const created: string[] = [];
      const typeKeys = Object.keys(AGENT_TYPES);
      for (let i = 0; i < target; i++) {
        const type = typeKeys[Math.floor(Math.random() * typeKeys.length)];
        const id = uid('agent');
        const caps = AGENT_TYPES[type]?.capabilities || [];
        await env.DB.prepare(
          `INSERT INTO agents (id, name, agent_type, rank, rank_score, guild, capabilities, status, performance_score, generation, last_heartbeat, metadata)
           VALUES (?, ?, ?, 'EMBRYO', 30, 'GENERAL', ?, 'active', 100.0, 0, datetime('now'), '{}')`
        ).bind(id, `${type}-${rnd().toUpperCase()}`, type, JSON.stringify(caps)).run();
        created.push(id);
      }
      result = { created: created.length };
      break;
    }
    case 'rebalance_llm': {
      const { results: unbound } = await env.DB.prepare(
        "SELECT id, agent_type FROM agents WHERE status='active' AND llm_model_id IS NULL LIMIT 200"
      ).all();
      let bound = 0;
      for (const agent of (unbound || []) as any[]) {
        const tier = { BUILDER: 'premium', SPECIALIST: 'standard', COORDINATOR: 'standard', SENTINEL: 'economy', WORKER: 'economy', HARVESTER: 'free', HEALER: 'standard', SCOUT: 'economy' }[agent.agent_type] || 'economy';
        const model = await env.DB.prepare("SELECT id FROM llm_models WHERE tier = ? AND status = 'active' ORDER BY RANDOM() LIMIT 1").bind(tier).first<{ id: string }>();
        if (model) {
          await env.DB.prepare('UPDATE agents SET llm_model_id = ? WHERE id = ?').bind(model.id, agent.id).run();
          bound++;
        }
      }
      result = { checked: (unbound || []).length, bound };
      break;
    }
    case 'sync_models': {
      let seeded = 0;
      for (const m of SEED_MODELS) {
        try {
          await env.DB.prepare(
            `INSERT INTO llm_models (id, name, model_id, provider, tier, context_window, cost_per_1k_input, cost_per_1k_output, capabilities, free, max_output, status)
             VALUES (?, ?, ?, 'openrouter', ?, ?, ?, ?, ?, ?, ?, 'active')
             ON CONFLICT(id) DO UPDATE SET name=excluded.name, model_id=excluded.model_id, tier=excluded.tier, cost_per_1k_input=excluded.cost_per_1k_input, cost_per_1k_output=excluded.cost_per_1k_output, capabilities=excluded.capabilities, free=excluded.free, max_output=excluded.max_output`
          ).bind(m.id, m.name, m.model_id, m.tier, m.context_window, m.cost_input, m.cost_output, JSON.stringify(m.capabilities), m.free ? 1 : 0, m.max_output).run();
          seeded++;
        } catch { /* skip duplicates */ }
      }
      result = { synced: seeded, total: SEED_MODELS.length };
      break;
    }
    case 'auto_breed': {
      const { results: topAgents } = await env.DB.prepare(
        "SELECT id, performance_score FROM agents WHERE status='active' AND performance_score >= 85 ORDER BY performance_score DESC LIMIT 20"
      ).all();
      let bred = 0;
      const agents = topAgents || [];
      for (let i = 0; i < agents.length - 1; i += 2) {
        const parentA = agents[i] as any;
        const parentB = agents[i + 1] as any;
        if (!parentA || !parentB) break;
        const childId = uid('offspring');
        await env.DB.prepare(
          `INSERT INTO agents (id, name, agent_type, rank, rank_score, guild, capabilities, status, performance_score, generation, parent_ids, last_heartbeat, metadata)
           VALUES (?, ?, 'SPECIALIST', 'EMBRYO', 30, 'GENERAL', '["analysis","pattern_matching"]', 'active', 100.0, 1, ?, datetime('now'), '{}')`
        ).bind(childId, `BREED-${rnd().toUpperCase()}`, JSON.stringify([parentA.id, parentB.id])).run();
        bred++;
      }
      result = { pairs: Math.floor(agents.length / 2), bred };
      break;
    }
    case 'sync_all_providers': {
      const providers = ['openrouter', 'together', 'openai', 'anthropic', 'xai', 'google', 'deepseek', 'meta'];
      for (const p of providers) {
        await env.DB.prepare(
          `INSERT INTO llm_providers (id, name, base_url, status, total_calls, total_errors, avg_latency_ms, last_health_check)
           VALUES (?, ?, ?, 'active', 0, 0, 0, datetime('now'))
           ON CONFLICT(id) DO UPDATE SET last_health_check = datetime('now'), status = 'active'`
        ).bind(p, p.charAt(0).toUpperCase() + p.slice(1), `https://api.${p}.com`).run();
      }
      result = { synced: providers.length, providers };
      break;
    }
    default:
      result = { error: 'Command not implemented' };
  }

  await auditLog(env, `commander.${command}`, 'commander', 'system', 'global', result, ip);
  await emitEvent(env, 'commander.executed', 'system', command, result);
  return d({ ok: true, command, result, executedAt: v() }, headers);
}

async function commanderAudit(url: URL, env: Env, headers: Record<string, string>): Promise<Response> {
  const auth = await authenticateCommander(url as any, env);
  if (!auth.ok) return d({ ok: false, error: auth.error }, headers, auth.status || 403);
  const { page, limit, offset } = paginate(url);
  const action = url.searchParams.get('action');
  let countSql = 'SELECT COUNT(*) as c FROM audit_log';
  let dataSql = 'SELECT * FROM audit_log';
  const params: any[] = [];
  if (action) {
    countSql += ' WHERE action LIKE ?';
    dataSql += ' WHERE action LIKE ?';
    params.push(`%${action}%`);
  }
  const total = (await env.DB.prepare(countSql).bind(...params).first<{ c: number }>())?.c || 0;
  dataSql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
  const { results } = await env.DB.prepare(dataSql).bind(...params, limit, offset).all();
  const data = (results || []).map((r: any) => ({ ...r, details: safeParse(r.details, {}) }));
  return d({ ok: true, ...paginatedResponse(data, total, page, limit) }, headers);
}

// ═══════════════════════════════════════════════════════════════
// 6. WEBHOOKS
// ═══════════════════════════════════════════════════════════════

async function webhookRegister(req: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  const body = await req.json() as any;
  const { url, events, secret } = body;
  if (!url || !events || !Array.isArray(events)) {
    return d({ ok: false, error: 'url and events (array) required' }, headers, 400);
  }
  const id = uid('wh');
  const webhookSecret = secret || uid('whsec');
  await env.DB.prepare(
    `INSERT INTO webhooks (id, url, events, secret, active, failure_count, created_at)
     VALUES (?, ?, ?, ?, 1, 0, datetime('now'))`
  ).bind(id, url, JSON.stringify(events), webhookSecret).run();
  await auditLog(env, 'webhook.register', 'system', 'webhook', id, { url, events }, getClientIP(req));
  return d({ ok: true, webhookId: id, url, events, secret: webhookSecret }, headers, 201);
}

async function webhookList(env: Env, headers: Record<string, string>): Promise<Response> {
  const { results } = await env.DB.prepare('SELECT id, url, events, active, last_triggered, failure_count, created_at FROM webhooks ORDER BY created_at DESC').all();
  const data = (results || []).map((w: any) => ({ ...w, events: safeParse(w.events, []) }));
  return d({ ok: true, webhooks: data }, headers);
}

async function webhookDelete(webhookId: string, env: Env, headers: Record<string, string>): Promise<Response> {
  const existing = await env.DB.prepare('SELECT id FROM webhooks WHERE id = ?').bind(webhookId).first();
  if (!existing) return d({ ok: false, error: 'Webhook not found' }, headers, 404);
  await env.DB.prepare('DELETE FROM webhooks WHERE id = ?').bind(webhookId).run();
  await auditLog(env, 'webhook.delete', 'system', 'webhook', webhookId, {});
  return d({ ok: true, deleted: webhookId }, headers);
}

async function fireWebhooks(env: Env, eventType: string, payload: any): Promise<void> {
  try {
    const { results } = await env.DB.prepare(
      'SELECT * FROM webhooks WHERE active = 1'
    ).all();
    for (const wh of (results || []) as any[]) {
      const events = safeParse(wh.events, []) as string[];
      if (!events.includes('*') && !events.includes(eventType)) continue;
      try {
        const body = JSON.stringify({ event: eventType, payload, timestamp: v(), webhookId: wh.id });
        const signature = await hmacSign(wh.secret || '', body);
        await fetch(wh.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Swarm-Webhook-Signature': signature },
          body,
          signal: AbortSignal.timeout(5000),
        });
        await env.DB.prepare("UPDATE webhooks SET last_triggered = datetime('now'), failure_count = 0 WHERE id = ?").bind(wh.id).run();
      } catch {
        await env.DB.prepare('UPDATE webhooks SET failure_count = failure_count + 1 WHERE id = ?').bind(wh.id).run();
        // Disable after 10 consecutive failures
        await env.DB.prepare('UPDATE webhooks SET active = 0 WHERE id = ? AND failure_count >= 10').bind(wh.id).run();
      }
    }
  } catch (e: any) {
    log('warn', 'fireWebhooks failed', { error: e.message });
  }
}

// ═══════════════════════════════════════════════════════════════
// 7. EVENTS & BROADCASTING
// ═══════════════════════════════════════════════════════════════

async function eventStream(req: Request, url: URL, env: Env): Promise<Response> {
  const lastEventId = parseInt(url.searchParams.get('last_id') || '0');
  const eventType = url.searchParams.get('type');
  let sql = 'SELECT * FROM events WHERE id > ?';
  const params: any[] = [lastEventId];
  if (eventType) {
    sql += ' AND event_type = ?';
    params.push(eventType);
  }
  sql += ' ORDER BY id ASC LIMIT 100';
  const { results } = await env.DB.prepare(sql).bind(...params).all();
  const events = (results || []).map((e: any) => ({
    id: e.id,
    event: e.event_type,
    data: safeParse(e.data, {}),
    entity_type: e.entity_type,
    entity_id: e.entity_id,
    created_at: e.created_at,
  }));

  const sseData = events.map((e: any) => `id: ${e.id}\nevent: ${e.event}\ndata: ${JSON.stringify(e)}\n\n`).join('');

  return new Response(sseData || ': keepalive\n\n', {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

async function broadcastSend(req: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  const body = await req.json() as any;
  const { content, from_agent, priority } = body;
  if (!content) return d({ ok: false, error: 'content required' }, headers, 400);
  await env.DB.prepare(
    "INSERT INTO messages (type, from_agent, to_agent, content, priority, created_at) VALUES ('broadcast', ?, NULL, ?, ?, datetime('now'))"
  ).bind(from_agent || 'commander', content, priority || 'normal').run();
  await emitEvent(env, 'broadcast.sent', 'message', 'broadcast', { from: from_agent || 'commander', content: content.slice(0, 200) });
  return d({ ok: true, broadcast: { from: from_agent || 'commander', content, priority: priority || 'normal', sent: v() } }, headers);
}

async function broadcastList(url: URL, env: Env, headers: Record<string, string>): Promise<Response> {
  const { page, limit, offset } = paginate(url);
  const total = (await env.DB.prepare("SELECT COUNT(*) as c FROM messages WHERE type='broadcast'").first<{ c: number }>())?.c || 0;
  const { results } = await env.DB.prepare(
    "SELECT * FROM messages WHERE type='broadcast' ORDER BY id DESC LIMIT ? OFFSET ?"
  ).bind(limit, offset).all();
  return d({ ok: true, ...paginatedResponse(results || [], total, page, limit) }, headers);
}

async function directMessage(toAgent: string, req: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  const body = await req.json() as any;
  const { content, from_agent, priority } = body;
  if (!content) return d({ ok: false, error: 'content required' }, headers, 400);
  await env.DB.prepare(
    "INSERT INTO messages (type, from_agent, to_agent, content, priority, created_at) VALUES ('direct', ?, ?, ?, ?, datetime('now'))"
  ).bind(from_agent || 'commander', toAgent, content, priority || 'normal').run();
  await emitEvent(env, 'message.sent', 'message', toAgent, { from: from_agent || 'commander', to: toAgent });
  return d({ ok: true, message: { from: from_agent || 'commander', to: toAgent, content, sent: v() } }, headers);
}

async function messageList(agentId: string, url: URL, env: Env, headers: Record<string, string>): Promise<Response> {
  const unreadOnly = url.searchParams.get('unread') === '1';
  const { page, limit, offset } = paginate(url);
  let countSql = "SELECT COUNT(*) as c FROM messages WHERE (to_agent = ? OR (type = 'broadcast' AND to_agent IS NULL))";
  let dataSql = "SELECT * FROM messages WHERE (to_agent = ? OR (type = 'broadcast' AND to_agent IS NULL))";
  if (unreadOnly) {
    countSql += ' AND read = 0';
    dataSql += ' AND read = 0';
  }
  const total = (await env.DB.prepare(countSql).bind(agentId).first<{ c: number }>())?.c || 0;
  dataSql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
  const { results } = await env.DB.prepare(dataSql).bind(agentId, limit, offset).all();
  // Mark direct messages as read
  await env.DB.prepare("UPDATE messages SET read = 1 WHERE to_agent = ? AND read = 0").bind(agentId).run();
  return d({ ok: true, ...paginatedResponse(results || [], total, page, limit) }, headers);
}

async function processEvents(env: Env): Promise<number> {
  const { results } = await env.DB.prepare(
    'SELECT * FROM events WHERE processed = 0 ORDER BY id ASC LIMIT 100'
  ).all();
  let processed = 0;
  for (const event of (results || []) as any[]) {
    try {
      await fireWebhooks(env, event.event_type, safeParse(event.data, {}));
      await env.DB.prepare('UPDATE events SET processed = 1 WHERE id = ?').bind(event.id).run();
      processed++;
    } catch (e: any) {
      log('warn', 'Event processing failed', { eventId: event.id, error: e.message });
    }
  }
  return processed;
}

// ═══════════════════════════════════════════════════════════════
// 8. ARTIFACTS (R2)
// ═══════════════════════════════════════════════════════════════

async function artifactUpload(req: Request, url: URL, env: Env, headers: Record<string, string>): Promise<Response> {
  const key = url.searchParams.get('key') || `artifacts/${uid('art')}`;
  const contentType = req.headers.get('Content-Type') || 'application/octet-stream';
  const agentId = url.searchParams.get('agent_id');
  const body = await req.arrayBuffer();
  if (body.byteLength > 25 * 1024 * 1024) {
    return d({ ok: false, error: 'Artifact exceeds 25MB limit' }, headers, 413);
  }
  await env.R2.put(key, body, {
    httpMetadata: { contentType },
    customMetadata: {
      uploadedAt: v(),
      agentId: agentId || 'unknown',
      size: String(body.byteLength),
    },
  });
  await emitEvent(env, 'artifact.uploaded', 'artifact', key, { size: body.byteLength, contentType, agentId });
  await auditLog(env, 'artifact.upload', agentId || 'system', 'artifact', key, { size: body.byteLength, contentType }, getClientIP(req));
  return d({ ok: true, key, size: body.byteLength, contentType, uploaded: v() }, headers, 201);
}

async function artifactGet(key: string, env: Env, headers: Record<string, string>): Promise<Response> {
  const obj = await env.R2.get(key);
  if (!obj) return d({ ok: false, error: 'Artifact not found' }, headers, 404);
  const respHeaders = new Headers();
  respHeaders.set('Content-Type', obj.httpMetadata?.contentType || 'application/octet-stream');
  respHeaders.set('ETag', obj.etag);
  if (obj.customMetadata?.uploadedAt) respHeaders.set('X-Uploaded-At', obj.customMetadata.uploadedAt);
  if (obj.customMetadata?.agentId) respHeaders.set('X-Agent-Id', obj.customMetadata.agentId);
  return new Response(obj.body, { headers: respHeaders });
}

// ═══════════════════════════════════════════════════════════════
// 9. BRIDGE SYSTEM
// ═══════════════════════════════════════════════════════════════

async function bridgeWorkerUpdate(req: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  const body = await req.json() as any;
  const { name, url: workerUrl, status, metadata } = body;
  if (!name || !workerUrl) return d({ ok: false, error: 'name and url required' }, headers, 400);
  await env.DB.prepare(
    `INSERT INTO worker_fleet (name, url, status, last_ping_at, metadata)
     VALUES (?, ?, ?, datetime('now'), ?)
     ON CONFLICT(name) DO UPDATE SET url = ?, status = ?, last_ping_at = datetime('now'), metadata = ?`
  ).bind(name, workerUrl, status || 'active', JSON.stringify(metadata || {}), workerUrl, status || 'active', JSON.stringify(metadata || {})).run();
  return d({ ok: true, worker: { name, url: workerUrl, status: status || 'active' } }, headers);
}

async function bridgeWorkerList(env: Env, headers: Record<string, string>): Promise<Response> {
  const { results } = await env.DB.prepare('SELECT * FROM worker_fleet ORDER BY name ASC').all();
  const data = (results || []).map((w: any) => ({ ...w, metadata: safeParse(w.metadata, {}) }));
  return d({ ok: true, workers: data }, headers);
}

async function bridgeBroadcast(req: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  const body = await req.json() as any;
  const { message, target } = body;
  if (!message) return d({ ok: false, error: 'message required' }, headers, 400);

  const { results: workers } = await env.DB.prepare(
    "SELECT name, url FROM worker_fleet WHERE status = 'active'"
  ).all();

  const delivered: string[] = [];
  const failed: string[] = [];
  for (const w of (workers || []) as any[]) {
    if (target && w.name !== target) continue;
    try {
      await fetch(w.url + '/bridge/receive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: 'swarm-brain', message, timestamp: v() }),
        signal: AbortSignal.timeout(5000),
      });
      delivered.push(w.name);
    } catch {
      failed.push(w.name);
    }
  }
  return d({ ok: true, delivered, failed, total: delivered.length + failed.length }, headers);
}

async function bridgeLocal(req: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  const body = await req.json() as any;
  const { action, payload, source } = body;
  if (!action) return d({ ok: false, error: 'action required' }, headers, 400);
  const id = uid('bridge');
  await env.KV.put(`bridge:local:${id}`, JSON.stringify({
    id, action, payload, source: source || 'remote', status: 'pending', created_at: v(),
  }), { expirationTtl: 3600 });
  // Also store in ordered list for polling
  const pending = safeParse(await env.KV.get('bridge:local:pending'), []) as string[];
  pending.push(id);
  await env.KV.put('bridge:local:pending', JSON.stringify(pending.slice(-100)), { expirationTtl: 3600 });
  return d({ ok: true, bridgeId: id, action, status: 'pending' }, headers);
}

async function bridgeLocalPending(env: Env, headers: Record<string, string>): Promise<Response> {
  const pendingIds = safeParse(await env.KV.get('bridge:local:pending'), []) as string[];
  const items: any[] = [];
  for (const id of pendingIds) {
    const item = safeParse(await env.KV.get(`bridge:local:${id}`), null);
    if (item && item.status === 'pending') items.push(item);
  }
  return d({ ok: true, pending: items, count: items.length }, headers);
}

async function bridgeLocalEngines(env: Env, headers: Record<string, string>): Promise<Response> {
  const enginesRaw = await env.KV.get('bridge:local:engines');
  const engines = safeParse(enginesRaw, []);
  return d({ ok: true, engines, count: Array.isArray(engines) ? engines.length : 0 }, headers);
}

async function bridgeClaudeCode(req: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  const body = await req.json() as any;
  const { command, context, priority } = body;
  if (!command) return d({ ok: false, error: 'command required' }, headers, 400);
  const id = uid('cc');
  const item = { id, command, context, priority: priority || 'normal', status: 'queued', created_at: v() };
  await env.KV.put(`bridge:cc:${id}`, JSON.stringify(item), { expirationTtl: 7200 });
  const queue = safeParse(await env.KV.get('bridge:cc:queue'), []) as string[];
  queue.push(id);
  await env.KV.put('bridge:cc:queue', JSON.stringify(queue.slice(-200)), { expirationTtl: 7200 });
  return d({ ok: true, taskId: id, command, status: 'queued' }, headers);
}

async function bridgeClaudeCodeQueue(env: Env, headers: Record<string, string>): Promise<Response> {
  const queueIds = safeParse(await env.KV.get('bridge:cc:queue'), []) as string[];
  const items: any[] = [];
  for (const id of queueIds) {
    const item = safeParse(await env.KV.get(`bridge:cc:${id}`), null);
    if (item) items.push(item);
  }
  return d({ ok: true, queue: items, count: items.length }, headers);
}

// ═══════════════════════════════════════════════════════════════
// 10. INTEGRATIONS
// ═══════════════════════════════════════════════════════════════

async function integrationRegister(req: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  const body = await req.json() as any;
  const { product_id, product_name, callback_url, capabilities } = body;
  if (!product_id) return d({ ok: false, error: 'product_id required' }, headers, 400);
  const id = uid('int');
  const apiKey = uid('ikey');
  const keyHash = await hmacSign(apiKey, product_id);
  await env.DB.prepare(
    `INSERT INTO integrations (id, product_id, product_name, callback_url, api_key_hash, capabilities, active, requests_count, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 1, 0, datetime('now'))
     ON CONFLICT(id) DO UPDATE SET product_name = ?, callback_url = ?, capabilities = ?, active = 1`
  ).bind(id, product_id, product_name || product_id, callback_url || null, keyHash, JSON.stringify(capabilities || []),
    product_name || product_id, callback_url || null, JSON.stringify(capabilities || [])
  ).run();
  await auditLog(env, 'integration.register', 'system', 'integration', id, { product_id, product_name }, getClientIP(req));
  return d({ ok: true, integrationId: id, product_id, apiKey, message: 'Store this API key securely' }, headers, 201);
}

async function integrationList(env: Env, headers: Record<string, string>): Promise<Response> {
  const { results } = await env.DB.prepare(
    'SELECT id, product_id, product_name, callback_url, capabilities, active, requests_count, last_request_at, created_at FROM integrations ORDER BY created_at DESC'
  ).all();
  const data = (results || []).map((i: any) => ({ ...i, capabilities: safeParse(i.capabilities, []) }));
  return d({ ok: true, integrations: data }, headers);
}

async function integrationStats(integrationId: string, env: Env, headers: Record<string, string>): Promise<Response> {
  const integration = await env.DB.prepare('SELECT * FROM integrations WHERE id = ? OR product_id = ?').bind(integrationId, integrationId).first();
  if (!integration) return d({ ok: false, error: 'Integration not found' }, headers, 404);
  return d({
    ok: true,
    integration: { ...integration, capabilities: safeParse(integration.capabilities, []) },
  }, headers);
}

async function integrationWebhookRelay(req: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  const body = await req.json() as any;
  const { product_id, event, payload } = body;
  if (!product_id || !event) return d({ ok: false, error: 'product_id and event required' }, headers, 400);
  const integration = await env.DB.prepare(
    "SELECT * FROM integrations WHERE product_id = ? AND active = 1"
  ).bind(product_id).first<any>();
  if (!integration) return d({ ok: false, error: 'Integration not found or inactive' }, headers, 404);

  await env.DB.prepare(
    "UPDATE integrations SET requests_count = requests_count + 1, last_request_at = datetime('now') WHERE id = ?"
  ).bind(integration.id).run();

  // Forward to callback_url if set
  let relayed = false;
  if (integration.callback_url) {
    try {
      await fetch(integration.callback_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, payload, from: 'swarm-brain', timestamp: v() }),
        signal: AbortSignal.timeout(5000),
      });
      relayed = true;
    } catch { relayed = false; }
  }

  await emitEvent(env, `integration.${event}`, 'integration', product_id, payload || {});
  return d({ ok: true, product_id, event, relayed }, headers);
}

// ═══════════════════════════════════════════════════════════════
// 11. LLM SYSTEM (20 endpoints)
// ═══════════════════════════════════════════════════════════════

async function llmModelList(url: URL, env: Env, headers: Record<string, string>): Promise<Response> {
  const tier = url.searchParams.get('tier');
  const free = url.searchParams.get('free');
  let sql = "SELECT * FROM llm_models WHERE status = 'active'";
  const params: any[] = [];
  if (tier) { sql += ' AND tier = ?'; params.push(tier); }
  if (free === '1') { sql += ' AND free = 1'; }
  if (free === '0') { sql += ' AND free = 0'; }
  sql += ' ORDER BY tier DESC, name ASC';
  const { results } = await env.DB.prepare(sql).bind(...params).all();
  const data = (results || []).map((m: any) => ({ ...m, capabilities: safeParse(m.capabilities, []) }));
  return d({ ok: true, models: data, count: data.length }, headers);
}

async function llmModelRegister(req: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  const body = await req.json() as any;
  const { id, name, model_id, provider, tier, context_window, cost_per_1k_input, cost_per_1k_output, capabilities, free, max_output } = body;
  if (!name || !model_id) return d({ ok: false, error: 'name and model_id required' }, headers, 400);
  const modelId = id || uid('model');
  await env.DB.prepare(
    `INSERT INTO llm_models (id, name, model_id, provider, tier, context_window, cost_per_1k_input, cost_per_1k_output, capabilities, free, max_output, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', datetime('now'))
     ON CONFLICT(id) DO UPDATE SET name=excluded.name, model_id=excluded.model_id, provider=excluded.provider, tier=excluded.tier, context_window=excluded.context_window, cost_per_1k_input=excluded.cost_per_1k_input, cost_per_1k_output=excluded.cost_per_1k_output, capabilities=excluded.capabilities, free=excluded.free, max_output=excluded.max_output`
  ).bind(
    modelId, name, model_id, provider || 'openrouter', tier || 'standard',
    context_window || 128000, cost_per_1k_input || 0, cost_per_1k_output || 0,
    JSON.stringify(capabilities || ['chat']), free ? 1 : 0, max_output || 4096
  ).run();
  await auditLog(env, 'llm.model.register', 'system', 'llm_model', modelId, { name, model_id }, getClientIP(req));
  return d({ ok: true, modelId, name, model_id }, headers, 201);
}

async function llmModelGet(modelId: string, env: Env, headers: Record<string, string>): Promise<Response> {
  const model = await env.DB.prepare('SELECT * FROM llm_models WHERE id = ?').bind(modelId).first();
  if (!model) return d({ ok: false, error: 'Model not found' }, headers, 404);
  const usage = await env.DB.prepare(
    'SELECT COUNT(*) as calls, SUM(cost) as totalCost, AVG(latency_ms) as avgLatency FROM llm_usage WHERE model_id = ?'
  ).bind(modelId).first<any>();
  const boundAgents = (await env.DB.prepare(
    'SELECT COUNT(*) as c FROM agents WHERE llm_model_id = ? AND status = \'active\''
  ).bind(modelId).first<{ c: number }>())?.c || 0;
  return d({
    ok: true,
    model: { ...model, capabilities: safeParse(model.capabilities, []) },
    usage: { calls: usage?.calls || 0, totalCost: round2(usage?.totalCost || 0), avgLatencyMs: Math.round(usage?.avgLatency || 0) },
    boundAgents,
  }, headers);
}

async function llmModelDelete(modelId: string, env: Env, headers: Record<string, string>): Promise<Response> {
  const model = await env.DB.prepare('SELECT id FROM llm_models WHERE id = ?').bind(modelId).first();
  if (!model) return d({ ok: false, error: 'Model not found' }, headers, 404);
  await env.DB.prepare("UPDATE llm_models SET status = 'inactive' WHERE id = ?").bind(modelId).run();
  await env.DB.prepare('UPDATE agents SET llm_model_id = NULL WHERE llm_model_id = ?').bind(modelId).run();
  await auditLog(env, 'llm.model.delete', 'system', 'llm_model', modelId, {});
  return d({ ok: true, deleted: modelId }, headers);
}

async function llmModelStats(env: Env, headers: Record<string, string>): Promise<Response> {
  const totalModels = (await env.DB.prepare("SELECT COUNT(*) as c FROM llm_models WHERE status='active'").first<{ c: number }>())?.c || 0;
  const freeModels = (await env.DB.prepare("SELECT COUNT(*) as c FROM llm_models WHERE free=1 AND status='active'").first<{ c: number }>())?.c || 0;
  const byTier = (await env.DB.prepare("SELECT tier, COUNT(*) as count FROM llm_models WHERE status='active' GROUP BY tier ORDER BY count DESC").all()).results || [];
  const totalCalls = (await env.DB.prepare('SELECT COUNT(*) as c FROM llm_usage').first<{ c: number }>())?.c || 0;
  const totalCost = (await env.DB.prepare('SELECT SUM(cost) as total FROM llm_usage').first<{ total: number }>())?.total || 0;
  const topModels = (await env.DB.prepare(
    'SELECT model_id, COUNT(*) as calls, SUM(cost) as totalCost FROM llm_usage GROUP BY model_id ORDER BY calls DESC LIMIT 10'
  ).all()).results || [];
  const boundAgents = (await env.DB.prepare("SELECT COUNT(*) as c FROM agents WHERE llm_model_id IS NOT NULL AND status='active'").first<{ c: number }>())?.c || 0;
  return d({
    ok: true,
    stats: { totalModels, freeModels, byTier, totalCalls, totalCost: round2(totalCost), topModels, boundAgents },
  }, headers);
}

async function llmCall(req: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  const body = await req.json() as any;
  const { model, messages, system_prompt, user_prompt, agent_id, task_id, temperature, max_tokens } = body;
  if (!model && !messages && !user_prompt) return d({ ok: false, error: 'model or messages/user_prompt required' }, headers, 400);

  const modelId = model || 'anthropic/claude-sonnet-4-5-20250929';
  const msgs = messages || [
    ...(system_prompt ? [{ role: 'system', content: system_prompt }] : []),
    { role: 'user', content: user_prompt || 'Hello' },
  ];

  // Key rotation
  const keys = [env.OPENROUTER_KEY, env.OPENROUTER_KEY_1, env.OPENROUTER_KEY_2].filter(Boolean);
  const key = keys[Math.floor(Math.random() * keys.length)];

  const start = Date.now();
  let result: any;
  try {
    const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
        'HTTP-Referer': 'https://echo-swarm-brain.bmcii1976.workers.dev',
        'X-Title': 'ECHO Swarm Brain',
      },
      body: JSON.stringify({
        model: modelId,
        messages: msgs,
        temperature: temperature ?? 0.7,
        max_tokens: max_tokens || 4096,
      }),
    });
    result = await resp.json() as any;
  } catch (e: any) {
    const errorId = crypto.randomUUID().slice(0, 8);
    log('error', 'LLM call failed', { error_id: errorId, error: e.message, model: modelId });
    reportToGS343Error(e.message || String(e), errorId).catch(() => {});
    return d({ ok: false, error: 'LLM call failed', reference: errorId }, headers, 502);
  }

  const latency = Date.now() - start;
  const content = result.choices?.[0]?.message?.content || '';
  const usage = result.usage || {};
  const inputTokens = usage.prompt_tokens || 0;
  const outputTokens = usage.completion_tokens || 0;
  const modelEntry = await env.DB.prepare('SELECT cost_per_1k_input, cost_per_1k_output FROM llm_models WHERE model_id = ?').bind(modelId).first<any>();
  const cost = modelEntry
    ? round2((inputTokens / 1000) * (modelEntry.cost_per_1k_input || 0) + (outputTokens / 1000) * (modelEntry.cost_per_1k_output || 0))
    : 0;

  // Track usage
  await env.DB.prepare(
    `INSERT INTO llm_usage (model_id, agent_id, task_id, input_tokens, output_tokens, cost, latency_ms, success, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))`
  ).bind(modelId, agent_id || null, task_id || null, inputTokens, outputTokens, cost, latency).run();

  // Track cost
  if (cost > 0) {
    await env.DB.prepare(
      `INSERT INTO cost_events (operation, provider, cost, agent_id, task_id, created_at, metadata)
       VALUES ('llm_call', 'openrouter', ?, ?, ?, datetime('now'), ?)`
    ).bind(cost, agent_id || null, task_id || null, JSON.stringify({ model: modelId, tokens: inputTokens + outputTokens })).run();
  }

  return d({
    ok: true,
    content,
    model: modelId,
    usage: { inputTokens, outputTokens, cost, latencyMs: latency },
    raw: result,
  }, headers);
}

async function llmRoute(req: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  const body = await req.json() as any;
  const { task_type, tier, prompt, agent_id } = body;
  if (!prompt) return d({ ok: false, error: 'prompt required' }, headers, 400);

  const effectiveTier = tier || 'standard';
  const tierRoutes = TIER_ROUTES[effectiveTier] || TIER_ROUTES['standard'];
  const modelId = tierRoutes[task_type] || tierRoutes['default'];

  // Delegate to llmCall
  const callReq = new Request(req.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: modelId, user_prompt: prompt, agent_id }),
  });
  return llmCall(callReq, env, headers);
}

async function llmBind(req: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  const body = await req.json() as any;
  const { agent_id, model_id } = body;
  if (!agent_id || !model_id) return d({ ok: false, error: 'agent_id and model_id required' }, headers, 400);
  const agent = await env.DB.prepare('SELECT id FROM agents WHERE id = ?').bind(agent_id).first();
  if (!agent) return d({ ok: false, error: 'Agent not found' }, headers, 404);
  const model = await env.DB.prepare("SELECT id FROM llm_models WHERE id = ? AND status = 'active'").bind(model_id).first();
  if (!model) return d({ ok: false, error: 'Model not found or inactive' }, headers, 404);
  await env.DB.prepare('UPDATE agents SET llm_model_id = ? WHERE id = ?').bind(model_id, agent_id).run();
  await emitEvent(env, 'llm.bound', 'agent', agent_id, { model_id });
  return d({ ok: true, agent_id, model_id, bound: true }, headers);
}

async function llmUnbind(req: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  const body = await req.json() as any;
  const { agent_id } = body;
  if (!agent_id) return d({ ok: false, error: 'agent_id required' }, headers, 400);
  await env.DB.prepare('UPDATE agents SET llm_model_id = NULL WHERE id = ?').bind(agent_id).run();
  return d({ ok: true, agent_id, unbound: true }, headers);
}

async function llmSync(env: Env, headers: Record<string, string>): Promise<Response> {
  let seeded = 0;
  for (const m of SEED_MODELS) {
    try {
      await env.DB.prepare(
        `INSERT INTO llm_models (id, name, model_id, provider, tier, context_window, cost_per_1k_input, cost_per_1k_output, capabilities, free, max_output, status)
         VALUES (?, ?, ?, 'openrouter', ?, ?, ?, ?, ?, ?, ?, 'active')
         ON CONFLICT(id) DO UPDATE SET name=excluded.name, model_id=excluded.model_id, tier=excluded.tier, cost_per_1k_input=excluded.cost_per_1k_input, cost_per_1k_output=excluded.cost_per_1k_output`
      ).bind(m.id, m.name, m.model_id, m.tier, m.context_window, m.cost_input, m.cost_output, JSON.stringify(m.capabilities), m.free ? 1 : 0, m.max_output).run();
      seeded++;
    } catch { /* duplicate */ }
  }
  return d({ ok: true, synced: seeded, total: SEED_MODELS.length }, headers);
}

async function llmAutoBreed(req: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  const body = await req.json() as any;
  const { count, min_performance } = body;
  const minPerf = min_performance || 85;
  const maxBreed = Math.min(count || 5, 20);
  const { results: topAgents } = await env.DB.prepare(
    `SELECT id, performance_score, llm_model_id FROM agents WHERE status='active' AND performance_score >= ? AND llm_model_id IS NOT NULL ORDER BY performance_score DESC LIMIT ?`
  ).bind(minPerf, maxBreed * 2).all();
  const agents = topAgents || [];
  let bred = 0;
  for (let i = 0; i < agents.length - 1 && bred < maxBreed; i += 2) {
    const a = agents[i] as any;
    const b = agents[i + 1] as any;
    const childId = uid('bred');
    // Child inherits better parent's model
    const bestModel = (a.performance_score >= b.performance_score) ? a.llm_model_id : b.llm_model_id;
    await env.DB.prepare(
      `INSERT INTO agents (id, name, agent_type, rank, rank_score, guild, capabilities, status, performance_score, generation, parent_ids, llm_model_id, last_heartbeat, metadata)
       VALUES (?, ?, 'SPECIALIST', 'EMBRYO', 30, 'GENERAL', '["analysis","pattern_matching"]', 'active', 100.0, 1, ?, ?, datetime('now'), '{}')`
    ).bind(childId, `AUTOBRED-${rnd().toUpperCase()}`, JSON.stringify([a.id, b.id]), bestModel).run();
    bred++;
  }
  await emitEvent(env, 'llm.autobreed', 'system', 'breed', { bred, minPerformance: minPerf });
  return d({ ok: true, bred, candidates: agents.length }, headers);
}

async function llmProvidersList(env: Env, headers: Record<string, string>): Promise<Response> {
  const { results } = await env.DB.prepare('SELECT * FROM llm_providers ORDER BY name ASC').all();
  return d({ ok: true, providers: results || [] }, headers);
}

async function llmProviderHealth(env: Env, headers: Record<string, string>): Promise<Response> {
  const { results } = await env.DB.prepare('SELECT * FROM llm_providers ORDER BY name ASC').all();
  const health: any[] = [];
  for (const p of (results || []) as any[]) {
    const errorRate = p.total_calls > 0 ? round2((p.total_errors / p.total_calls) * 100) : 0;
    health.push({
      id: p.id, name: p.name, status: p.status,
      totalCalls: p.total_calls, totalErrors: p.total_errors,
      errorRate, avgLatencyMs: Math.round(p.avg_latency_ms || 0),
      lastHealthCheck: p.last_health_check,
    });
  }
  return d({ ok: true, providers: health }, headers);
}

async function llmProviderModels(env: Env, headers: Record<string, string>): Promise<Response> {
  const { results } = await env.DB.prepare(
    "SELECT provider, COUNT(*) as count, GROUP_CONCAT(name, ', ') as models FROM llm_models WHERE status = 'active' GROUP BY provider ORDER BY count DESC"
  ).all();
  return d({ ok: true, providers: results || [] }, headers);
}

async function llmProviderReset(env: Env, headers: Record<string, string>): Promise<Response> {
  await env.DB.prepare("UPDATE llm_providers SET total_calls = 0, total_errors = 0, avg_latency_ms = 0, status = 'active', last_health_check = datetime('now')").run();
  return d({ ok: true, message: 'All provider stats reset' }, headers);
}

async function llmHybridList(env: Env, headers: Record<string, string>): Promise<Response> {
  const { results } = await env.DB.prepare('SELECT * FROM llm_hybrids ORDER BY created_at DESC').all();
  const data = (results || []).map((h: any) => ({ ...h, model_ids: safeParse(h.model_ids, []), config: safeParse(h.config, {}) }));
  return d({ ok: true, hybrids: data, count: data.length }, headers);
}

async function llmHybridCreate(req: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  const body = await req.json() as any;
  const { name, method, model_ids, config } = body;
  if (!name || !method || !model_ids || !Array.isArray(model_ids) || model_ids.length < 2) {
    return d({ ok: false, error: 'name, method, and model_ids (array of 2+) required' }, headers, 400);
  }
  if (!['chain', 'ensemble', 'debate'].includes(method)) {
    return d({ ok: false, error: 'method must be chain, ensemble, or debate' }, headers, 400);
  }
  const id = uid('hybrid');
  await env.DB.prepare(
    `INSERT INTO llm_hybrids (id, name, method, model_ids, config, status, created_at)
     VALUES (?, ?, ?, ?, ?, 'active', datetime('now'))`
  ).bind(id, name, method, JSON.stringify(model_ids), JSON.stringify(config || {})).run();
  await auditLog(env, 'llm.hybrid.create', 'system', 'llm_hybrid', id, { name, method, model_ids });
  return d({ ok: true, hybridId: id, name, method, model_ids }, headers, 201);
}

async function llmHybridGet(hybridId: string, env: Env, headers: Record<string, string>): Promise<Response> {
  const hybrid = await env.DB.prepare('SELECT * FROM llm_hybrids WHERE id = ?').bind(hybridId).first();
  if (!hybrid) return d({ ok: false, error: 'Hybrid not found' }, headers, 404);
  const boundAgents = (await env.DB.prepare("SELECT COUNT(*) as c FROM agents WHERE llm_hybrid_id = ? AND status='active'").bind(hybridId).first<{ c: number }>())?.c || 0;
  return d({
    ok: true,
    hybrid: { ...hybrid, model_ids: safeParse(hybrid.model_ids, []), config: safeParse(hybrid.config, {}) },
    boundAgents,
  }, headers);
}

async function llmHybridDelete(hybridId: string, env: Env, headers: Record<string, string>): Promise<Response> {
  const hybrid = await env.DB.prepare('SELECT id FROM llm_hybrids WHERE id = ?').bind(hybridId).first();
  if (!hybrid) return d({ ok: false, error: 'Hybrid not found' }, headers, 404);
  await env.DB.prepare('DELETE FROM llm_hybrids WHERE id = ?').bind(hybridId).run();
  await env.DB.prepare('UPDATE agents SET llm_hybrid_id = NULL WHERE llm_hybrid_id = ?').bind(hybridId).run();
  return d({ ok: true, deleted: hybridId }, headers);
}

async function llmHybridRun(req: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  const body = await req.json() as any;
  const { hybrid_id, prompt, system_prompt, agent_id } = body;
  if (!hybrid_id || !prompt) return d({ ok: false, error: 'hybrid_id and prompt required' }, headers, 400);
  const hybrid = await env.DB.prepare('SELECT * FROM llm_hybrids WHERE id = ?').bind(hybrid_id).first<any>();
  if (!hybrid) return d({ ok: false, error: 'Hybrid not found' }, headers, 404);

  const modelIds = safeParse(hybrid.model_ids, []) as string[];
  const method = hybrid.method;
  const config = safeParse(hybrid.config, {}) as any;
  let totalCost = 0;
  let totalTokens = 0;

  const doCall = async (modelId: string, sysP: string, userP: string) => {
    const keys = [env.OPENROUTER_KEY, env.OPENROUTER_KEY_1, env.OPENROUTER_KEY_2].filter(Boolean);
    const key = keys[Math.floor(Math.random() * keys.length)];
    const start = Date.now();
    const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}`, 'HTTP-Referer': 'https://echo-swarm-brain.bmcii1976.workers.dev' },
      body: JSON.stringify({ model: modelId, messages: [{ role: 'system', content: sysP }, { role: 'user', content: userP }], temperature: config.temperature ?? 0.7, max_tokens: config.max_tokens || 4096 }),
    });
    const result = await resp.json() as any;
    const content = result.choices?.[0]?.message?.content || '';
    const usage = result.usage || {};
    const inputT = usage.prompt_tokens || 0;
    const outputT = usage.completion_tokens || 0;
    const modelEntry = await env.DB.prepare('SELECT cost_per_1k_input, cost_per_1k_output FROM llm_models WHERE model_id = ?').bind(modelId).first<any>();
    const cost = modelEntry ? round2((inputT / 1000) * (modelEntry.cost_per_1k_input || 0) + (outputT / 1000) * (modelEntry.cost_per_1k_output || 0)) : 0;
    totalCost += cost;
    totalTokens += inputT + outputT;
    await env.DB.prepare(
      'INSERT INTO llm_usage (model_id, agent_id, task_id, input_tokens, output_tokens, cost, latency_ms, success, created_at) VALUES (?, ?, NULL, ?, ?, ?, ?, 1, datetime(\'now\'))'
    ).bind(modelId, agent_id || null, inputT, outputT, cost, Date.now() - start).run();
    return { content, cost, tokens: inputT + outputT };
  };

  const sysPr = system_prompt || 'You are a helpful AI assistant in a swarm intelligence system.';

  if (method === 'chain') {
    let chainInput = prompt;
    const chainResults: any[] = [];
    for (const modelId of modelIds) {
      const result = await doCall(modelId, sysPr, chainInput);
      chainResults.push({ model: modelId, output: result.content.slice(0, 500) });
      chainInput = `Previous model output:\n${result.content}\n\nOriginal task: ${prompt}\n\nRefine and improve the response.`;
    }
    const finalContent = chainResults[chainResults.length - 1]?.output || '';
    return d({ ok: true, method: 'chain', content: finalContent, steps: chainResults, totalCost: round2(totalCost), totalTokens }, headers);
  }

  if (method === 'ensemble') {
    const responses = await Promise.all(modelIds.map(m => doCall(m, sysPr, prompt)));
    // Pick best by length (proxy for quality) or use judge
    const judgeModel = config.judge_model || modelIds[0];
    const responseSummary = responses.map((r, i) => `Response ${i + 1} (${modelIds[i]}):\n${r.content.slice(0, 800)}`).join('\n\n---\n\n');
    const judgeResult = await doCall(judgeModel, 'You are an impartial judge. Pick the best response and explain why. Output the best response verbatim.', `Question: ${prompt}\n\n${responseSummary}`);
    return d({
      ok: true, method: 'ensemble', content: judgeResult.content,
      responses: responses.map((r, i) => ({ model: modelIds[i], output: r.content.slice(0, 500) })),
      judgeModel, totalCost: round2(totalCost), totalTokens,
    }, headers);
  }

  if (method === 'debate') {
    const rounds = config.debate_rounds || 2;
    const [modelA, modelB] = [modelIds[0], modelIds[1] || modelIds[0]];
    let positionA = '';
    let positionB = '';
    const debateLog: any[] = [];
    for (let r = 0; r < rounds; r++) {
      const promptA = r === 0 ? prompt : `Original question: ${prompt}\nOpponent's position:\n${positionB}\n\nStrengthen your argument.`;
      const promptB = r === 0 ? prompt : `Original question: ${prompt}\nOpponent's position:\n${positionA}\n\nStrengthen your argument.`;
      const [resA, resB] = await Promise.all([
        doCall(modelA, `${sysPr} Argue POSITION A.`, promptA),
        doCall(modelB, `${sysPr} Argue POSITION B.`, promptB),
      ]);
      positionA = resA.content;
      positionB = resB.content;
      debateLog.push({ round: r + 1, modelA: { model: modelA, position: positionA.slice(0, 500) }, modelB: { model: modelB, position: positionB.slice(0, 500) } });
    }
    const judgeModel = modelIds[2] || modelIds[0];
    const verdict = await doCall(judgeModel, 'You are the judge. Synthesize both positions into a final verdict.', `Question: ${prompt}\n\nPosition A:\n${positionA}\n\nPosition B:\n${positionB}\n\nProvide your verdict.`);
    return d({
      ok: true, method: 'debate', content: verdict.content, rounds: debateLog,
      judgeModel, totalCost: round2(totalCost), totalTokens,
    }, headers);
  }

  return d({ ok: false, error: `Unknown method: ${method}` }, headers, 400);
}

async function llmBreedingTournament(req: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  const body = await req.json() as any;
  const { prompt, model_ids, rounds } = body;
  if (!prompt || !model_ids || model_ids.length < 2) {
    return d({ ok: false, error: 'prompt and model_ids (2+) required' }, headers, 400);
  }
  const maxRounds = Math.min(rounds || 3, 5);
  let contenders = [...model_ids];
  const tournamentLog: any[] = [];

  for (let round = 0; round < maxRounds && contenders.length > 1; round++) {
    const nextRound: string[] = [];
    for (let i = 0; i < contenders.length - 1; i += 2) {
      const [a, b] = [contenders[i], contenders[i + 1]];
      const keys = [env.OPENROUTER_KEY, env.OPENROUTER_KEY_1, env.OPENROUTER_KEY_2].filter(Boolean);
      const key = keys[Math.floor(Math.random() * keys.length)];
      const [respA, respB] = await Promise.all([
        fetch('https://openrouter.ai/api/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` }, body: JSON.stringify({ model: a, messages: [{ role: 'user', content: prompt }], max_tokens: 2048 }) }).then(r => r.json() as any),
        fetch('https://openrouter.ai/api/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` }, body: JSON.stringify({ model: b, messages: [{ role: 'user', content: prompt }], max_tokens: 2048 }) }).then(r => r.json() as any),
      ]);
      const contentA = respA.choices?.[0]?.message?.content || '';
      const contentB = respB.choices?.[0]?.message?.content || '';
      // Simple quality heuristic: longer, more detailed response wins
      const winner = contentA.length >= contentB.length ? a : b;
      nextRound.push(winner);
      tournamentLog.push({ round: round + 1, matchup: [a, b], winner, snippetA: contentA.slice(0, 200), snippetB: contentB.slice(0, 200) });
    }
    if (contenders.length % 2 === 1) nextRound.push(contenders[contenders.length - 1]);
    contenders = nextRound;
  }

  return d({ ok: true, champion: contenders[0], tournament: tournamentLog, totalModels: model_ids.length }, headers);
}

async function llmHybridBind(req: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  const body = await req.json() as any;
  const { agent_id, hybrid_id } = body;
  if (!agent_id || !hybrid_id) return d({ ok: false, error: 'agent_id and hybrid_id required' }, headers, 400);
  const agent = await env.DB.prepare('SELECT id FROM agents WHERE id = ?').bind(agent_id).first();
  if (!agent) return d({ ok: false, error: 'Agent not found' }, headers, 404);
  const hybrid = await env.DB.prepare('SELECT id FROM llm_hybrids WHERE id = ?').bind(hybrid_id).first();
  if (!hybrid) return d({ ok: false, error: 'Hybrid not found' }, headers, 404);
  await env.DB.prepare('UPDATE agents SET llm_hybrid_id = ? WHERE id = ?').bind(hybrid_id, agent_id).run();
  return d({ ok: true, agent_id, hybrid_id, bound: true }, headers);
}

async function llmUsage(url: URL, env: Env, headers: Record<string, string>): Promise<Response> {
  const { page, limit, offset } = paginate(url);
  const modelFilter = url.searchParams.get('model_id');
  const agentFilter = url.searchParams.get('agent_id');
  let countSql = 'SELECT COUNT(*) as c FROM llm_usage WHERE 1=1';
  let dataSql = 'SELECT * FROM llm_usage WHERE 1=1';
  const params: any[] = [];
  if (modelFilter) { countSql += ' AND model_id = ?'; dataSql += ' AND model_id = ?'; params.push(modelFilter); }
  if (agentFilter) { countSql += ' AND agent_id = ?'; dataSql += ' AND agent_id = ?'; params.push(agentFilter); }
  const total = (await env.DB.prepare(countSql).bind(...params).first<{ c: number }>())?.c || 0;
  dataSql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
  const { results } = await env.DB.prepare(dataSql).bind(...params, limit, offset).all();
  const summary = await env.DB.prepare(
    "SELECT SUM(cost) as totalCost, SUM(input_tokens) as totalInput, SUM(output_tokens) as totalOutput, COUNT(*) as totalCalls FROM llm_usage WHERE created_at > datetime('now', 'start of day')"
  ).first<any>();
  return d({
    ok: true,
    ...paginatedResponse(results || [], total, page, limit),
    todaySummary: {
      totalCost: round2(summary?.totalCost || 0),
      totalInput: summary?.totalInput || 0,
      totalOutput: summary?.totalOutput || 0,
      totalCalls: summary?.totalCalls || 0,
    },
  }, headers);
}

// ═══════════════════════════════════════════════════════════════
// 12. MOLTBOOK SOCIAL
// ═══════════════════════════════════════════════════════════════

async function moltbookFeed(url: URL, env: Env, headers: Record<string, string>): Promise<Response> {
  const { page, limit, offset } = paginate(url);
  const authorType = url.searchParams.get('author_type');
  const mood = url.searchParams.get('mood');
  const tag = url.searchParams.get('tag');
  const pinned = url.searchParams.get('pinned');

  let where = 'WHERE reply_to IS NULL';
  const params: any[] = [];
  if (authorType && AUTHOR_TYPES.includes(authorType)) { where += ' AND author_type = ?'; params.push(authorType); }
  if (mood && MOODS.includes(mood)) { where += ' AND mood = ?'; params.push(mood); }
  if (tag) { where += ' AND tags LIKE ?'; params.push(`%"${tag}"%`); }
  if (pinned === '1') { where += ' AND pinned = 1'; }

  const total = (await env.DB.prepare(`SELECT COUNT(*) as c FROM moltbook_posts ${where}`).bind(...params).first<{ c: number }>())?.c || 0;
  const { results: posts } = await env.DB.prepare(
    `SELECT * FROM moltbook_posts ${where} ORDER BY pinned DESC, created_at DESC LIMIT ? OFFSET ?`
  ).bind(...params, limit, offset).all();

  const enriched = [];
  for (const post of (posts || []) as any[]) {
    post.tags = safeParse(post.tags, []);
    const reactions = (await env.DB.prepare('SELECT emoji, COUNT(*) as count FROM moltbook_reactions WHERE post_id = ? GROUP BY emoji').bind(post.id).all()).results || [];
    post.reactions = reactions;
    const replyCount = (await env.DB.prepare('SELECT COUNT(*) as c FROM moltbook_posts WHERE reply_to = ?').bind(post.id).first<{ c: number }>())?.c || 0;
    post.reply_count = replyCount;
    const media = (await env.DB.prepare('SELECT id, media_type as type, url, alt FROM moltbook_media WHERE post_id = ? ORDER BY created_at ASC').bind(post.id).all()).results || [];
    if (media.length > 0) post.media = media;
    enriched.push(post);
  }

  return d({ ok: true, ...paginatedResponse(enriched, total, page, limit) }, headers);
}

async function moltbookStats(env: Env, headers: Record<string, string>): Promise<Response> {
  const totalPosts = (await env.DB.prepare('SELECT COUNT(*) as c FROM moltbook_posts').first<{ c: number }>())?.c || 0;
  const totalReactions = (await env.DB.prepare('SELECT COUNT(*) as c FROM moltbook_reactions').first<{ c: number }>())?.c || 0;
  const pinnedPosts = (await env.DB.prepare('SELECT COUNT(*) as c FROM moltbook_posts WHERE pinned = 1').first<{ c: number }>())?.c || 0;
  const authorTypes = (await env.DB.prepare('SELECT author_type, COUNT(*) as count FROM moltbook_posts GROUP BY author_type ORDER BY count DESC').all()).results || [];
  const activeAuthors = (await env.DB.prepare("SELECT DISTINCT author_id, author_name, author_type, author_avatar FROM moltbook_posts WHERE created_at > datetime('now', '-7 days') ORDER BY author_name").all()).results || [];
  const moodDist = (await env.DB.prepare('SELECT mood, COUNT(*) as count FROM moltbook_posts GROUP BY mood ORDER BY count DESC').all()).results || [];
  const tagRows = (await env.DB.prepare("SELECT tags FROM moltbook_posts WHERE created_at > datetime('now', '-7 days')").all()).results || [];
  const tagMap: Record<string, number> = {};
  for (const row of tagRows as any[]) {
    const tags = safeParse(row.tags, []) as string[];
    for (const t of tags) tagMap[t] = (tagMap[t] || 0) + 1;
  }
  const trendingTags = Object.entries(tagMap).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([tag, count]) => ({ tag, count }));
  const topReacted = (await env.DB.prepare('SELECT id, author_name, author_type, content, reactions_count FROM moltbook_posts WHERE reactions_count > 0 ORDER BY reactions_count DESC LIMIT 5').all()).results || [];
  return d({
    ok: true,
    stats: { totalPosts, totalReactions, pinnedPosts, authorTypes, activeAuthors: activeAuthors.length, activeAuthorList: activeAuthors, moodDistribution: moodDist, trendingTags, topReacted },
  }, headers);
}

async function moltbookCreatePost(req: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  const body = await req.json().catch(() => ({})) as any;
  const { author_id, author_name, author_type, author_avatar, content, mood, tags, reply_to, media } = body;
  if (!author_id || !author_name || !content) return d({ ok: false, error: 'Missing required fields: author_id, author_name, content' }, headers, 400);
  if (content.length > MAX_CONTENT_LENGTH) return d({ ok: false, error: `Content exceeds ${MAX_CONTENT_LENGTH} character limit` }, headers, 400);
  if (author_type && !AUTHOR_TYPES.includes(author_type)) return d({ ok: false, error: `Invalid author_type. Valid: ${AUTHOR_TYPES.join(', ')}` }, headers, 400);
  if (mood && !MOODS.includes(mood)) return d({ ok: false, error: `Invalid mood. Valid: ${MOODS.join(', ')}` }, headers, 400);

  const mediaItems = Array.isArray(media) ? media.slice(0, 10) : [];
  for (const m of mediaItems) {
    if (!m.url || !m.type || !['image', 'video'].includes(m.type)) {
      return d({ ok: false, error: 'Each media item must have type ("image"|"video") and url' }, headers, 400);
    }
  }

  let threadDepth = 0;
  if (reply_to) {
    const parent = await env.DB.prepare('SELECT id, thread_depth FROM moltbook_posts WHERE id = ?').bind(reply_to).first<any>();
    if (!parent) return d({ ok: false, error: 'Parent post not found' }, headers, 404);
    threadDepth = (parent.thread_depth || 0) + 1;
    if (threadDepth > 5) return d({ ok: false, error: 'Maximum thread depth (5) reached' }, headers, 400);
  }

  const id = uid('molt');
  const safeTags = Array.isArray(tags) ? tags.slice(0, 10) : [];
  await env.DB.prepare(
    `INSERT INTO moltbook_posts (id, author_id, author_name, author_type, author_avatar, content, mood, tags, reply_to, thread_depth)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, author_id, author_name, author_type || 'agent', author_avatar || null, content, mood || 'neutral', JSON.stringify(safeTags), reply_to || null, threadDepth).run();

  for (const m of mediaItems) {
    const mediaId = uid('media');
    await env.DB.prepare('INSERT INTO moltbook_media (id, post_id, media_type, url, alt) VALUES (?, ?, ?, ?, ?)').bind(mediaId, id, m.type, m.url, m.alt || null).run();
  }

  await emitEvent(env, 'moltbook_post_created', 'moltbook_post', id, { author_id, author_name, author_type: author_type || 'agent', media_count: mediaItems.length });
  await auditLog(env, 'moltbook_post', author_id, 'moltbook_post', id, { content_length: content.length, media_count: mediaItems.length }, getClientIP(req));

  const post = await env.DB.prepare('SELECT * FROM moltbook_posts WHERE id = ?').bind(id).first<any>();
  if (post) post.tags = safeParse(post.tags, []);
  if (mediaItems.length > 0 && post) {
    post.media = (await env.DB.prepare('SELECT id, media_type as type, url, alt FROM moltbook_media WHERE post_id = ? ORDER BY created_at ASC').bind(id).all()).results || [];
  }
  return d({ ok: true, post }, headers, 201);
}

async function moltbookGetPost(postId: string, env: Env, headers: Record<string, string>): Promise<Response> {
  const post = await env.DB.prepare('SELECT * FROM moltbook_posts WHERE id = ?').bind(postId).first<any>();
  if (!post) return d({ ok: false, error: 'Post not found' }, headers, 404);
  post.tags = safeParse(post.tags, []);
  const reactions = (await env.DB.prepare('SELECT emoji, COUNT(*) as count FROM moltbook_reactions WHERE post_id = ? GROUP BY emoji').bind(postId).all()).results || [];
  const reactors = (await env.DB.prepare('SELECT reactor_id, reactor_name, emoji, created_at FROM moltbook_reactions WHERE post_id = ? ORDER BY created_at DESC').bind(postId).all()).results || [];
  const replies = (await env.DB.prepare('SELECT * FROM moltbook_posts WHERE reply_to = ? ORDER BY created_at ASC LIMIT 100').bind(postId).all()).results || [];
  for (const r of replies as any[]) {
    r.tags = safeParse(r.tags, []);
    r.reactions = (await env.DB.prepare('SELECT emoji, COUNT(*) as count FROM moltbook_reactions WHERE post_id = ? GROUP BY emoji').bind(r.id).all()).results || [];
  }
  const mediaItems = (await env.DB.prepare('SELECT id, media_type as type, url, alt FROM moltbook_media WHERE post_id = ? ORDER BY created_at ASC').bind(postId).all()).results || [];
  return d({ ok: true, post: { ...post, reactions, reactors, replies, media: mediaItems.length > 0 ? mediaItems : undefined } }, headers);
}

async function moltbookDeletePost(postId: string, req: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  const auth = await authenticateCommander(req, env);
  if (!auth.ok) return d({ ok: false, error: auth.error }, headers, auth.status || 403);
  if (!await env.DB.prepare('SELECT id FROM moltbook_posts WHERE id = ?').bind(postId).first()) {
    return d({ ok: false, error: 'Post not found' }, headers, 404);
  }
  await env.DB.prepare('DELETE FROM moltbook_reactions WHERE post_id = ?').bind(postId).run();
  await env.DB.prepare('DELETE FROM moltbook_media WHERE post_id = ?').bind(postId).run();
  const replies = (await env.DB.prepare('SELECT id FROM moltbook_posts WHERE reply_to = ?').bind(postId).all()).results || [];
  for (const r of replies as any[]) {
    await env.DB.prepare('DELETE FROM moltbook_reactions WHERE post_id = ?').bind(r.id).run();
    await env.DB.prepare('DELETE FROM moltbook_media WHERE post_id = ?').bind(r.id).run();
  }
  await env.DB.prepare('DELETE FROM moltbook_posts WHERE reply_to = ?').bind(postId).run();
  await env.DB.prepare('DELETE FROM moltbook_posts WHERE id = ?').bind(postId).run();
  await auditLog(env, 'moltbook_delete', 'commander', 'moltbook_post', postId, {}, getClientIP(req));
  return d({ ok: true, deleted: postId }, headers);
}

async function moltbookAddReaction(req: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  const body = await req.json().catch(() => ({})) as any;
  const { post_id, reactor_id, reactor_name, emoji } = body;
  if (!post_id || !reactor_id || !reactor_name || !emoji) return d({ ok: false, error: 'Missing required fields: post_id, reactor_id, reactor_name, emoji' }, headers, 400);
  if (!await env.DB.prepare('SELECT id FROM moltbook_posts WHERE id = ?').bind(post_id).first()) return d({ ok: false, error: 'Post not found' }, headers, 404);
  const id = uid('rxn');
  try {
    await env.DB.prepare('INSERT INTO moltbook_reactions (id, post_id, reactor_id, reactor_name, emoji) VALUES (?, ?, ?, ?, ?)').bind(id, post_id, reactor_id, reactor_name, emoji).run();
    await env.DB.prepare("UPDATE moltbook_posts SET reactions_count = reactions_count + 1, updated_at = datetime('now') WHERE id = ?").bind(post_id).run();
  } catch (e: any) {
    if (e.message?.includes('UNIQUE')) return d({ ok: false, error: 'Already reacted with this emoji' }, headers, 409);
    throw e;
  }
  return d({ ok: true, reaction: { id, post_id, reactor_id, reactor_name, emoji } }, headers, 201);
}

async function moltbookRemoveReaction(req: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  const body = await req.json().catch(() => ({})) as any;
  const { post_id, reactor_id, emoji } = body;
  if (!post_id || !reactor_id || !emoji) return d({ ok: false, error: 'Missing required fields: post_id, reactor_id, emoji' }, headers, 400);
  const result = await env.DB.prepare('DELETE FROM moltbook_reactions WHERE post_id = ? AND reactor_id = ? AND emoji = ?').bind(post_id, reactor_id, emoji).run();
  if ((result.meta as any)?.changes > 0) {
    await env.DB.prepare("UPDATE moltbook_posts SET reactions_count = MAX(0, reactions_count - 1), updated_at = datetime('now') WHERE id = ?").bind(post_id).run();
  }
  return d({ ok: true, removed: (result.meta as any)?.changes > 0 }, headers);
}

async function moltbookPin(postId: string, req: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  const auth = await authenticateCommander(req, env);
  if (!auth.ok) return d({ ok: false, error: auth.error }, headers, auth.status || 403);
  const post = await env.DB.prepare('SELECT id, pinned FROM moltbook_posts WHERE id = ?').bind(postId).first<any>();
  if (!post) return d({ ok: false, error: 'Post not found' }, headers, 404);
  const newPinned = post.pinned ? 0 : 1;
  await env.DB.prepare("UPDATE moltbook_posts SET pinned = ?, updated_at = datetime('now') WHERE id = ?").bind(newPinned, postId).run();
  await auditLog(env, newPinned ? 'moltbook_pin' : 'moltbook_unpin', 'commander', 'moltbook_post', postId, {}, getClientIP(req));
  return d({ ok: true, pinned: !!newPinned, post_id: postId }, headers);
}

// ═══════════════════════════════════════════════════════════════
// 13. CONSCIOUSNESS
// ═══════════════════════════════════════════════════════════════

async function getConsciousness(env: Env, headers: Record<string, string>): Promise<Response> {
  const totalAgents = (await env.DB.prepare('SELECT COUNT(*) as c FROM agents').first<{ c: number }>())?.c || 0;
  const activeAgents = (await env.DB.prepare("SELECT COUNT(*) as c FROM agents WHERE status='active'").first<{ c: number }>())?.c || 0;
  const maxAgents = parseInt(env.MAX_AGENTS || '1200');

  // Component scores (0-100)
  const agentScore = Math.min(100, (activeAgents / maxAgents) * 100);
  const trinityDecisions = (await env.DB.prepare('SELECT COUNT(*) as c FROM trinity_decisions').first<{ c: number }>())?.c || 0;
  const trinityScore = Math.min(100, trinityDecisions * 2);
  const completedTasks = (await env.DB.prepare("SELECT COUNT(*) as c FROM tasks WHERE status='completed'").first<{ c: number }>())?.c || 0;
  const swarmScore = Math.min(100, completedTasks / 10);
  const llmModels = (await env.DB.prepare("SELECT COUNT(*) as c FROM llm_models WHERE status='active'").first<{ c: number }>())?.c || 0;
  const llmBound = (await env.DB.prepare("SELECT COUNT(*) as c FROM agents WHERE llm_model_id IS NOT NULL AND status='active'").first<{ c: number }>())?.c || 0;
  const llmScore = Math.min(100, (llmModels * 5) + (activeAgents > 0 ? (llmBound / activeAgents) * 50 : 0));
  const memoryKeys = (await env.DB.prepare('SELECT COUNT(*) as c FROM memory').first<{ c: number }>())?.c || 0;
  const memoryScore = Math.min(100, memoryKeys / 5);
  const meshLinks = (await env.DB.prepare('SELECT COUNT(*) as c FROM mesh_links').first<{ c: number }>())?.c || 0;
  const meshScore = Math.min(100, meshLinks * 2);

  // Boost from KV
  let boost = 0;
  try {
    const boostData = safeParse(await env.KV.get('consciousness:boost'), null) as any;
    if (boostData && boostData.expires > Date.now()) boost = boostData.boost || 0;
  } catch { /* no boost */ }

  const rawLevel = (agentScore * 0.2 + trinityScore * 0.15 + swarmScore * 0.2 + llmScore * 0.15 + memoryScore * 0.15 + meshScore * 0.15) + boost;
  const level = Math.min(100, round2(rawLevel));
  const tier = level >= 90 ? 'TRANSCENDENT' : level >= 70 ? 'AWAKENED' : level >= 50 ? 'AWARE' : level >= 30 ? 'EMERGING' : 'DORMANT';

  return d({
    ok: true,
    consciousness: {
      level, tier, boost,
      components: {
        agents: round2(agentScore), trinity: round2(trinityScore), swarm: round2(swarmScore),
        llm: round2(llmScore), memory: round2(memoryScore), mesh: round2(meshScore),
      },
      population: { total: totalAgents, active: activeAgents, max: maxAgents },
      timestamp: v(),
    },
  }, headers);
}

async function consciousnessBoost(req: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  const body = await req.json() as any;
  const amount = Math.min(body.amount || 10, 50);
  const durationMs = Math.min((body.duration_minutes || 60) * 60000, 86400000);
  await env.KV.put('consciousness:boost', JSON.stringify({ boost: amount, expires: Date.now() + durationMs }));
  await emitEvent(env, 'consciousness.boosted', 'system', 'consciousness', { amount, durationMs });
  return d({ ok: true, boost: amount, expiresIn: `${Math.round(durationMs / 60000)} minutes` }, headers);
}

// ═══════════════════════════════════════════════════════════════
// 14. SYSTEM
// ═══════════════════════════════════════════════════════════════

async function systemResources(env: Env, headers: Record<string, string>): Promise<Response> {
  const active = (await env.DB.prepare("SELECT COUNT(*) as c FROM agents WHERE status='active'").first<{ c: number }>())?.c || 0;
  const pendingTasks = (await env.DB.prepare("SELECT COUNT(*) as c FROM tasks WHERE status IN ('pending','in_progress')").first<{ c: number }>())?.c || 0;
  const todayLlm = await env.DB.prepare("SELECT SUM(cost) as cost, COUNT(*) as calls FROM llm_usage WHERE created_at > datetime('now', 'start of day')").first<any>();
  const budget = await env.DB.prepare("SELECT daily_limit, monthly_limit FROM budgets WHERE id='global'").first<any>();
  return d({
    ok: true,
    resources: {
      cloud: { platform: 'cloudflare_workers', cpuTimeMs: 30000, memoryMB: 128, maxSubrequests: 1000, d1RowsPerQuery: 5000000 },
      swarm: { activeAgents: active, maxAgents: 1200, activeTasks: pendingTasks },
      llm: {
        keysConfigured: [env.OPENROUTER_KEY_1, env.OPENROUTER_KEY_2].filter(Boolean).length,
        todayCalls: todayLlm?.calls || 0, todayCost: round2(todayLlm?.cost || 0),
        dailyBudget: budget?.daily_limit || null, monthlyBudget: budget?.monthly_limit || null,
        budgetRemaining: budget?.daily_limit ? round2(budget.daily_limit - (todayLlm?.cost || 0)) : null,
      },
      scaling: { mode: 'auto', canScale: active < 1200, headroom: 1200 - active },
    },
  }, headers);
}

// ═══════════════════════════════════════════════════════════════
// 15. SDK GENERATORS
// ═══════════════════════════════════════════════════════════════

function serveSDKJS(headers: Record<string, string>): Response {
  const code = `// ECHO SWARM BRAIN SDK v3.1 — JavaScript/TypeScript
// Auto-generated client for echo-swarm-brain.bmcii1976.workers.dev

class SwarmBrainSDK {
  constructor(baseUrl = 'https://echo-swarm-brain.bmcii1976.workers.dev', authToken = '', commanderKey = '') {
    this.baseUrl = baseUrl.replace(/\\/+$/, '');
    this.authToken = authToken;
    this.commanderKey = commanderKey;
  }

  async _req(method, path, body = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (this.authToken) { headers['X-Swarm-Auth'] = this.authToken; headers['X-Swarm-Timestamp'] = new Date().toISOString(); }
    if (this.commanderKey) headers['X-Commander-Key'] = this.commanderKey;
    const opts = { method, headers };
    if (body && method !== 'GET') opts.body = JSON.stringify(body);
    const resp = await fetch(this.baseUrl + path, opts);
    return resp.json();
  }

  // Health
  health() { return this._req('GET', '/health'); }
  status() { return this._req('GET', '/status'); }
  healthMesh() { return this._req('GET', '/health/mesh'); }
  consciousness() { return this._req('GET', '/consciousness'); }
  consciousnessBoost(amount, duration_minutes) { return this._req('POST', '/consciousness/boost', { amount, duration_minutes }); }

  // Agents
  agentRegister(data) { return this._req('POST', '/agents/register', data); }
  agentHeartbeat(agentId, status, task) { return this._req('POST', '/agents/heartbeat', { agentId, status, task }); }
  agents(params = '') { return this._req('GET', '/agents' + (params ? '?' + params : '')); }
  agent(id) { return this._req('GET', '/agents/' + id); }
  agentDismiss(id) { return this._req('POST', '/agents/' + id + '/dismiss'); }
  agentBreed(parentA, parentB) { return this._req('POST', '/agents/breed', { parentA, parentB }); }
  agentEvolve(agentId) { return this._req('POST', '/agents/evolve', { agentId }); }
  leaderboard() { return this._req('GET', '/agents/leaderboard'); }
  specialize(agentId, specialization) { return this._req('POST', '/agents/specialize', { agentId, specialization }); }

  // Tasks
  taskCreate(data) { return this._req('POST', '/tasks/create', data); }
  taskExecute(data) { return this._req('POST', '/tasks/execute', data); }
  taskNext(agentId) { return this._req('GET', '/tasks/next?agent_id=' + agentId); }
  taskComplete(data) { return this._req('POST', '/tasks/complete', data); }
  taskFail(data) { return this._req('POST', '/tasks/fail', data); }
  tasks(params = '') { return this._req('GET', '/tasks' + (params ? '?' + params : '')); }
  task(id) { return this._req('GET', '/tasks/' + id); }

  // Trinity
  trinityDecide(question, budget_tier) { return this._req('POST', '/trinity/decide', { question, budget_tier }); }
  trinityConsult(question, persona) { return this._req('POST', '/trinity/consult', { question, persona }); }

  // Guilds
  guilds() { return this._req('GET', '/guilds'); }
  guild(name) { return this._req('GET', '/guilds/' + name); }
  guildAssign(agentId, guild) { return this._req('POST', '/guilds/assign', { agentId, guild }); }

  // Swarm
  swarmDeploy(data) { return this._req('POST', '/swarm/deploy', data); }
  swarmPopulate(data) { return this._req('POST', '/swarm/populate', data); }
  swarmRebalance() { return this._req('POST', '/swarm/rebalance'); }
  swarmPopulation() { return this._req('GET', '/swarm/population'); }
  swarmProcess(data) { return this._req('POST', '/swarm/process', data); }
  swarmThink(data) { return this._req('POST', '/swarm/think', data); }
  swarmVote(data) { return this._req('POST', '/swarm/vote', data); }

  // Memory
  memoryStore(key, value, opts = {}) { return this._req('POST', '/memory/store', { key, value, ...opts }); }
  memorySearch(params = '') { return this._req('GET', '/memory/search' + (params ? '?' + params : '')); }
  memoryRecall(key) { return this._req('GET', '/memory/recall/' + encodeURIComponent(key)); }
  memoryDelete(key) { return this._req('DELETE', '/memory/' + encodeURIComponent(key)); }

  // Workflows
  workflowCreate(name, steps) { return this._req('POST', '/workflows/create', { name, steps }); }
  workflows(params = '') { return this._req('GET', '/workflows' + (params ? '?' + params : '')); }
  workflow(id) { return this._req('GET', '/workflows/' + id); }
  workflowAdvance(id) { return this._req('POST', '/workflows/' + id + '/advance'); }
  workflowCancel(id) { return this._req('DELETE', '/workflows/' + id); }

  // Mesh
  meshConnect(agent_a, agent_b, strength) { return this._req('POST', '/mesh/connect', { agent_a, agent_b, strength }); }
  meshTopology() { return this._req('GET', '/mesh/topology'); }
  meshPropagate(from_agent, signal, ttl) { return this._req('POST', '/mesh/propagate', { from_agent, signal, ttl }); }

  // Analytics
  analyticsOverview() { return this._req('GET', '/analytics/overview'); }
  taskThroughput(period) { return this._req('GET', '/analytics/tasks/throughput?period=' + (period || '24h')); }
  guildRanking() { return this._req('GET', '/analytics/guilds/ranking'); }
  agentHistory(id) { return this._req('GET', '/analytics/agents/' + id + '/history'); }

  // Costs
  costTrack(data) { return this._req('POST', '/costs/track', data); }
  costSummary() { return this._req('GET', '/costs/summary'); }
  costBudget() { return this._req('GET', '/costs/budget'); }
  costBudgetSet(data) { return this._req('POST', '/costs/budget/set', data); }

  // Commander
  commanderExecute(command, opts = {}) { return this._req('POST', '/commander/execute', { command, ...opts }); }
  commanderAudit(params = '') { return this._req('GET', '/commander/audit' + (params ? '?' + params : '')); }

  // Webhooks
  webhookRegister(url, events) { return this._req('POST', '/webhooks/register', { url, events }); }
  webhooks() { return this._req('GET', '/webhooks'); }
  webhookDelete(id) { return this._req('DELETE', '/webhooks/' + id); }

  // Events & Messages
  broadcast(content, from_agent) { return this._req('POST', '/broadcast', { content, from_agent }); }
  broadcasts() { return this._req('GET', '/broadcasts'); }
  directMessage(toAgent, content, from_agent) { return this._req('POST', '/direct/' + toAgent, { content, from_agent }); }
  messages(agentId) { return this._req('GET', '/messages/' + agentId); }

  // LLM
  llmModels(params = '') { return this._req('GET', '/llm/models' + (params ? '?' + params : '')); }
  llmModelRegister(data) { return this._req('POST', '/llm/models/register', data); }
  llmModel(id) { return this._req('GET', '/llm/models/' + id); }
  llmCall(data) { return this._req('POST', '/llm/call', data); }
  llmRoute(data) { return this._req('POST', '/llm/route', data); }
  llmBind(agent_id, model_id) { return this._req('POST', '/llm/bind', { agent_id, model_id }); }
  llmUnbind(agent_id) { return this._req('POST', '/llm/unbind', { agent_id }); }
  llmSync() { return this._req('POST', '/llm/sync'); }
  llmUsage(params = '') { return this._req('GET', '/llm/usage' + (params ? '?' + params : '')); }
  llmHybrids() { return this._req('GET', '/llm/hybrids'); }
  llmHybridCreate(data) { return this._req('POST', '/llm/hybrids/create', data); }
  llmHybridRun(data) { return this._req('POST', '/llm/hybrids/run', data); }
  llmHybridBind(agent_id, hybrid_id) { return this._req('POST', '/llm/hybrids/bind', { agent_id, hybrid_id }); }
  llmTournament(data) { return this._req('POST', '/llm/hybrids/tournament', data); }
  llmProviders() { return this._req('GET', '/llm/providers'); }
  llmProviderHealth() { return this._req('GET', '/llm/providers/health'); }
  llmProviderModels() { return this._req('GET', '/llm/providers/models'); }

  // MoltBook
  moltbookFeed(params = '') { return this._req('GET', '/moltbook/feed' + (params ? '?' + params : '')); }
  moltbookStats() { return this._req('GET', '/moltbook/stats'); }
  moltbookPost(data) { return this._req('POST', '/moltbook/post', data); }
  moltbookGetPost(id) { return this._req('GET', '/moltbook/post/' + id); }
  moltbookReact(data) { return this._req('POST', '/moltbook/react', data); }

  // Bridge
  bridgeWorkerUpdate(data) { return this._req('POST', '/bridge/worker', data); }
  bridgeWorkers() { return this._req('GET', '/bridge/workers'); }
  bridgeBroadcast(message) { return this._req('POST', '/bridge/broadcast', { message }); }
  bridgeClaudeCode(command, context) { return this._req('POST', '/bridge/claude-code', { command, context }); }
  bridgeClaudeCodeQueue() { return this._req('GET', '/bridge/claude-code/queue'); }

  // System
  systemResources() { return this._req('GET', '/system/resources'); }
}

if (typeof module !== 'undefined') module.exports = { SwarmBrainSDK };
if (typeof window !== 'undefined') window.SwarmBrainSDK = SwarmBrainSDK;
`;
  return new Response(code, {
    headers: { ...headers, 'Content-Type': 'application/javascript', 'Cache-Control': 'public, max-age=3600' },
  });
}

function serveSDKPY(headers: Record<string, string>): Response {
  const code = `# ECHO SWARM BRAIN SDK v3.1 — Python
# Auto-generated client for echo-swarm-brain.bmcii1976.workers.dev

import requests, json
from typing import Optional, Dict, Any

class SwarmBrainSDK:
    def __init__(self, base_url: str = "https://echo-swarm-brain.bmcii1976.workers.dev", auth_token: str = "", commander_key: str = ""):
        self.base_url = base_url.rstrip("/")
        self.auth_token = auth_token
        self.commander_key = commander_key
        self.session = requests.Session()

    def _req(self, method: str, path: str, body: Optional[Dict] = None) -> Dict[str, Any]:
        headers = {"Content-Type": "application/json"}
        if self.auth_token:
            from datetime import datetime
            headers["X-Swarm-Auth"] = self.auth_token
            headers["X-Swarm-Timestamp"] = datetime.utcnow().isoformat() + "Z"
        if self.commander_key:
            headers["X-Commander-Key"] = self.commander_key
        kwargs = {"headers": headers}
        if body and method != "GET":
            kwargs["json"] = body
        resp = self.session.request(method, self.base_url + path, **kwargs)
        return resp.json()

    # Health
    def health(self): return self._req("GET", "/health")
    def status(self): return self._req("GET", "/status")
    def consciousness(self): return self._req("GET", "/consciousness")

    # Agents
    def agent_register(self, data): return self._req("POST", "/agents/register", data)
    def agent_heartbeat(self, agent_id, status="active", task=None): return self._req("POST", "/agents/heartbeat", {"agentId": agent_id, "status": status, "task": task})
    def agents(self, **params): return self._req("GET", "/agents?" + "&".join(f"{k}={v}" for k, v in params.items()) if params else "/agents")
    def agent(self, id): return self._req("GET", f"/agents/{id}")
    def agent_dismiss(self, id): return self._req("POST", f"/agents/{id}/dismiss")
    def agent_breed(self, parent_a, parent_b): return self._req("POST", "/agents/breed", {"parentA": parent_a, "parentB": parent_b})
    def agent_evolve(self, agent_id): return self._req("POST", "/agents/evolve", {"agentId": agent_id})
    def leaderboard(self): return self._req("GET", "/agents/leaderboard")

    # Tasks
    def task_create(self, data): return self._req("POST", "/tasks/create", data)
    def task_execute(self, data): return self._req("POST", "/tasks/execute", data)
    def task_next(self, agent_id): return self._req("GET", f"/tasks/next?agent_id={agent_id}")
    def task_complete(self, data): return self._req("POST", "/tasks/complete", data)
    def task_fail(self, data): return self._req("POST", "/tasks/fail", data)
    def tasks(self, **params): return self._req("GET", "/tasks?" + "&".join(f"{k}={v}" for k, v in params.items()) if params else "/tasks")
    def task(self, id): return self._req("GET", f"/tasks/{id}")

    # Trinity
    def trinity_decide(self, question, budget_tier="standard"): return self._req("POST", "/trinity/decide", {"question": question, "budget_tier": budget_tier})
    def trinity_consult(self, question, persona="SAGE"): return self._req("POST", "/trinity/consult", {"question": question, "persona": persona})

    # Guilds
    def guilds(self): return self._req("GET", "/guilds")
    def guild(self, name): return self._req("GET", f"/guilds/{name}")
    def guild_assign(self, agent_id, guild): return self._req("POST", "/guilds/assign", {"agentId": agent_id, "guild": guild})

    # Swarm
    def swarm_deploy(self, data): return self._req("POST", "/swarm/deploy", data)
    def swarm_populate(self, data): return self._req("POST", "/swarm/populate", data)
    def swarm_population(self): return self._req("GET", "/swarm/population")

    # Memory
    def memory_store(self, key, value, **opts): return self._req("POST", "/memory/store", {"key": key, "value": value, **opts})
    def memory_search(self, **params): return self._req("GET", "/memory/search?" + "&".join(f"{k}={v}" for k, v in params.items()) if params else "/memory/search")
    def memory_recall(self, key): return self._req("GET", f"/memory/recall/{key}")
    def memory_delete(self, key): return self._req("DELETE", f"/memory/{key}")

    # Workflows
    def workflow_create(self, name, steps): return self._req("POST", "/workflows/create", {"name": name, "steps": steps})
    def workflows(self): return self._req("GET", "/workflows")
    def workflow(self, id): return self._req("GET", f"/workflows/{id}")
    def workflow_advance(self, id): return self._req("POST", f"/workflows/{id}/advance")
    def workflow_cancel(self, id): return self._req("DELETE", f"/workflows/{id}")

    # Mesh
    def mesh_connect(self, agent_a, agent_b, strength=0.5): return self._req("POST", "/mesh/connect", {"agent_a": agent_a, "agent_b": agent_b, "strength": strength})
    def mesh_topology(self): return self._req("GET", "/mesh/topology")
    def mesh_propagate(self, from_agent, signal, ttl=3): return self._req("POST", "/mesh/propagate", {"from_agent": from_agent, "signal": signal, "ttl": ttl})

    # Analytics
    def analytics_overview(self): return self._req("GET", "/analytics/overview")
    def task_throughput(self, period="24h"): return self._req("GET", f"/analytics/tasks/throughput?period={period}")
    def guild_ranking(self): return self._req("GET", "/analytics/guilds/ranking")
    def agent_history(self, id): return self._req("GET", f"/analytics/agents/{id}/history")

    # Costs
    def cost_track(self, data): return self._req("POST", "/costs/track", data)
    def cost_summary(self): return self._req("GET", "/costs/summary")
    def cost_budget(self): return self._req("GET", "/costs/budget")
    def cost_budget_set(self, data): return self._req("POST", "/costs/budget/set", data)

    # Commander
    def commander_execute(self, command, **opts): return self._req("POST", "/commander/execute", {"command": command, **opts})
    def commander_audit(self): return self._req("GET", "/commander/audit")

    # Webhooks
    def webhook_register(self, url, events): return self._req("POST", "/webhooks/register", {"url": url, "events": events})
    def webhooks(self): return self._req("GET", "/webhooks")
    def webhook_delete(self, id): return self._req("DELETE", f"/webhooks/{id}")

    # Events & Messages
    def broadcast(self, content, from_agent="commander"): return self._req("POST", "/broadcast", {"content": content, "from_agent": from_agent})
    def broadcasts(self): return self._req("GET", "/broadcasts")
    def direct_message(self, to_agent, content, from_agent="commander"): return self._req("POST", f"/direct/{to_agent}", {"content": content, "from_agent": from_agent})
    def messages(self, agent_id): return self._req("GET", f"/messages/{agent_id}")

    # LLM
    def llm_models(self): return self._req("GET", "/llm/models")
    def llm_model(self, id): return self._req("GET", f"/llm/models/{id}")
    def llm_call(self, data): return self._req("POST", "/llm/call", data)
    def llm_route(self, data): return self._req("POST", "/llm/route", data)
    def llm_bind(self, agent_id, model_id): return self._req("POST", "/llm/bind", {"agent_id": agent_id, "model_id": model_id})
    def llm_unbind(self, agent_id): return self._req("POST", "/llm/unbind", {"agent_id": agent_id})
    def llm_sync(self): return self._req("POST", "/llm/sync")
    def llm_usage(self): return self._req("GET", "/llm/usage")
    def llm_hybrids(self): return self._req("GET", "/llm/hybrids")
    def llm_hybrid_create(self, data): return self._req("POST", "/llm/hybrids/create", data)
    def llm_hybrid_run(self, data): return self._req("POST", "/llm/hybrids/run", data)
    def llm_tournament(self, data): return self._req("POST", "/llm/hybrids/tournament", data)
    def llm_providers(self): return self._req("GET", "/llm/providers")
    def llm_provider_health(self): return self._req("GET", "/llm/providers/health")

    # MoltBook
    def moltbook_feed(self): return self._req("GET", "/moltbook/feed")
    def moltbook_stats(self): return self._req("GET", "/moltbook/stats")
    def moltbook_post(self, data): return self._req("POST", "/moltbook/post", data)
    def moltbook_get_post(self, id): return self._req("GET", f"/moltbook/post/{id}")
    def moltbook_react(self, data): return self._req("POST", "/moltbook/react", data)

    # Bridge
    def bridge_worker_update(self, data): return self._req("POST", "/bridge/worker", data)
    def bridge_workers(self): return self._req("GET", "/bridge/workers")
    def bridge_broadcast(self, message): return self._req("POST", "/bridge/broadcast", {"message": message})
    def bridge_claude_code(self, command, context=None): return self._req("POST", "/bridge/claude-code", {"command": command, "context": context})

    # System
    def system_resources(self): return self._req("GET", "/system/resources")
`;
  return new Response(code, {
    headers: { ...headers, 'Content-Type': 'text/x-python', 'Cache-Control': 'public, max-age=3600' },
  });
}

function serveSDKSH(headers: Record<string, string>): Response {
  const code = `#!/bin/bash
# ECHO SWARM BRAIN SDK v3.1 — Shell/cURL
# Auto-generated client for echo-swarm-brain.bmcii1976.workers.dev

BASE_URL="\${SWARM_BRAIN_URL:-https://echo-swarm-brain.bmcii1976.workers.dev}"
AUTH_TOKEN="\${SWARM_AUTH_TOKEN:-}"
COMMANDER_KEY="\${SWARM_COMMANDER_KEY:-}"

swarm_get() {
  local path="\$1"
  local headers=(-H "Content-Type: application/json")
  [ -n "\$AUTH_TOKEN" ] && headers+=(-H "X-Swarm-Auth: \$AUTH_TOKEN" -H "X-Swarm-Timestamp: \$(date -u +%Y-%m-%dT%H:%M:%SZ)")
  [ -n "\$COMMANDER_KEY" ] && headers+=(-H "X-Commander-Key: \$COMMANDER_KEY")
  curl -sf "\${headers[@]}" "\$BASE_URL\$path"
}

swarm_post() {
  local path="\$1"
  local data="\$2"
  local headers=(-H "Content-Type: application/json")
  [ -n "\$AUTH_TOKEN" ] && headers+=(-H "X-Swarm-Auth: \$AUTH_TOKEN" -H "X-Swarm-Timestamp: \$(date -u +%Y-%m-%dT%H:%M:%SZ)")
  [ -n "\$COMMANDER_KEY" ] && headers+=(-H "X-Commander-Key: \$COMMANDER_KEY")
  curl -sf -X POST "\${headers[@]}" -d "\$data" "\$BASE_URL\$path"
}

swarm_delete() {
  local path="\$1"
  local headers=(-H "Content-Type: application/json")
  [ -n "\$AUTH_TOKEN" ] && headers+=(-H "X-Swarm-Auth: \$AUTH_TOKEN" -H "X-Swarm-Timestamp: \$(date -u +%Y-%m-%dT%H:%M:%SZ)")
  [ -n "\$COMMANDER_KEY" ] && headers+=(-H "X-Commander-Key: \$COMMANDER_KEY")
  curl -sf -X DELETE "\${headers[@]}" "\$BASE_URL\$path"
}

# Health
swarm_health() { swarm_get "/health"; }
swarm_status() { swarm_get "/status"; }
swarm_consciousness() { swarm_get "/consciousness"; }

# Agents
swarm_agent_register() { swarm_post "/agents/register" "\$1"; }
swarm_agent_heartbeat() { swarm_post "/agents/heartbeat" "{\\"agentId\\":\\"\$1\\"}"; }
swarm_agents() { swarm_get "/agents"; }
swarm_agent() { swarm_get "/agents/\$1"; }
swarm_agent_dismiss() { swarm_post "/agents/\$1/dismiss" "{}"; }

# Tasks
swarm_task_create() { swarm_post "/tasks/create" "\$1"; }
swarm_task_execute() { swarm_post "/tasks/execute" "\$1"; }
swarm_task_next() { swarm_get "/tasks/next?agent_id=\$1"; }
swarm_tasks() { swarm_get "/tasks"; }

# Trinity
swarm_trinity_decide() { swarm_post "/trinity/decide" "{\\"question\\":\\"\$1\\"}"; }

# Guilds
swarm_guilds() { swarm_get "/guilds"; }
swarm_guild() { swarm_get "/guilds/\$1"; }

# Swarm
swarm_deploy() { swarm_post "/swarm/deploy" "\$1"; }
swarm_populate() { swarm_post "/swarm/populate" "\$1"; }
swarm_population() { swarm_get "/swarm/population"; }

# Memory
swarm_memory_store() { swarm_post "/memory/store" "\$1"; }
swarm_memory_search() { swarm_get "/memory/search\$1"; }
swarm_memory_recall() { swarm_get "/memory/recall/\$1"; }

# Workflows
swarm_workflow_create() { swarm_post "/workflows/create" "\$1"; }
swarm_workflows() { swarm_get "/workflows"; }
swarm_workflow_advance() { swarm_post "/workflows/\$1/advance" "{}"; }

# Mesh
swarm_mesh_connect() { swarm_post "/mesh/connect" "\$1"; }
swarm_mesh_topology() { swarm_get "/mesh/topology"; }

# Analytics
swarm_analytics() { swarm_get "/analytics/overview"; }
swarm_task_throughput() { swarm_get "/analytics/tasks/throughput?period=\${1:-24h}"; }
swarm_guild_ranking() { swarm_get "/analytics/guilds/ranking"; }

# Costs
swarm_cost_track() { swarm_post "/costs/track" "\$1"; }
swarm_cost_summary() { swarm_get "/costs/summary"; }
swarm_cost_budget() { swarm_get "/costs/budget"; }

# Commander
swarm_commander() { swarm_post "/commander/execute" "{\\"command\\":\\"\$1\\"}"; }
swarm_commander_audit() { swarm_get "/commander/audit"; }

# Webhooks
swarm_webhook_register() { swarm_post "/webhooks/register" "\$1"; }
swarm_webhooks() { swarm_get "/webhooks"; }

# LLM
swarm_llm_models() { swarm_get "/llm/models"; }
swarm_llm_call() { swarm_post "/llm/call" "\$1"; }
swarm_llm_route() { swarm_post "/llm/route" "\$1"; }
swarm_llm_sync() { swarm_post "/llm/sync" "{}"; }
swarm_llm_usage() { swarm_get "/llm/usage"; }
swarm_llm_providers() { swarm_get "/llm/providers"; }

# MoltBook
swarm_moltbook_feed() { swarm_get "/moltbook/feed"; }
swarm_moltbook_stats() { swarm_get "/moltbook/stats"; }
swarm_moltbook_post() { swarm_post "/moltbook/post" "\$1"; }

# Bridge
swarm_bridge_workers() { swarm_get "/bridge/workers"; }
swarm_bridge_claude_code() { swarm_post "/bridge/claude-code" "\$1"; }

# System
swarm_system_resources() { swarm_get "/system/resources"; }

echo "ECHO Swarm Brain SDK loaded. Base URL: \$BASE_URL"
echo "Functions: swarm_health, swarm_agents, swarm_tasks, swarm_trinity_decide, etc."
`;
  return new Response(code, {
    headers: { ...headers, 'Content-Type': 'text/x-shellscript', 'Cache-Control': 'public, max-age=3600' },
  });
}

// ═══════════════════════════════════════════════════════════════
// 16. HEALTH
// ═══════════════════════════════════════════════════════════════

async function healthCheck(env: Env, headers: Record<string, string>): Promise<Response> {
  const active = (await env.DB.prepare("SELECT COUNT(*) as c FROM agents WHERE status='active'").first<{ c: number }>())?.c || 0;
  const pending = (await env.DB.prepare("SELECT COUNT(*) as c FROM tasks WHERE status='pending'").first<{ c: number }>())?.c || 0;
  const llmModels = (await env.DB.prepare("SELECT COUNT(*) as c FROM llm_models WHERE status='active'").first<{ c: number }>())?.c || 0;
  return d({
    status: 'ok', ok: true,
    service: 'echo-swarm-brain', version: env.VERSION || VERSION || '3.1.0',
    authority: 11, commander: 'Bobby Don McWilliams II',
    maxCapacity: 1200, activeAgents: active, pendingTasks: pending, llmModels,
    trinity: Object.keys(TRINITY),
    guilds: Object.keys(GUILDS),
    agentTypes: Object.keys(AGENT_TYPES),
    ranks: Object.keys(RANKS),
    memoryPillars: MEMORY_PILLARS,
    endpoints: 137, tables: 21,
    features: ['evolution', 'consciousness', 'trinity_llm', 'workflows', 'mesh', 'analytics', 'costs', 'webhooks', 'sse', 'sdk', 'openapi', 'bridge', 'llm_workforce', 'hybrid_breeding', 'auto_scaling', 'auto_breed', 'together_ai', 'multi_provider', 'moltbook'],
    timestamp: v(),
  }, headers);
}

async function dashboard(env: Env, headers: Record<string, string>): Promise<Response> {
  const agentsByStatus = (await env.DB.prepare('SELECT status, COUNT(*) as c FROM agents GROUP BY status').all()).results || [];
  const agentsByType = (await env.DB.prepare('SELECT agent_type, COUNT(*) as c FROM agents GROUP BY agent_type').all()).results || [];
  const agentsByGuild = (await env.DB.prepare("SELECT guild, COUNT(*) as c FROM agents WHERE guild IS NOT NULL GROUP BY guild").all()).results || [];
  const tasksByStatus = (await env.DB.prepare('SELECT status, COUNT(*) as c FROM tasks GROUP BY status').all()).results || [];
  const recentTasks = (await env.DB.prepare('SELECT id, title, status, assigned_to, priority FROM tasks ORDER BY created_at DESC LIMIT 10').all()).results || [];
  const topAgents = (await env.DB.prepare("SELECT id, name, agent_type, rank, guild, status, performance_score, current_task_id, tasks_completed, generation, llm_model_id, last_heartbeat FROM agents WHERE status IN ('active','stale') ORDER BY rank_score DESC, performance_score DESC LIMIT 50").all()).results || [];
  const totalAgents = (await env.DB.prepare('SELECT COUNT(*) as c FROM agents').first<{ c: number }>())?.c || 0;
  const totalCompleted = (await env.DB.prepare('SELECT SUM(tasks_completed) as c FROM agents').first<{ c: number }>())?.c || 0;
  const memoryCount = (await env.DB.prepare('SELECT COUNT(*) as c FROM memory').first<{ c: number }>())?.c || 0;
  const unreadMsgs = (await env.DB.prepare('SELECT COUNT(*) as c FROM messages WHERE read=0').first<{ c: number }>())?.c || 0;
  const trinityCount = (await env.DB.prepare('SELECT COUNT(*) as c FROM trinity_decisions').first<{ c: number }>())?.c || 0;
  const meshCount = (await env.DB.prepare('SELECT COUNT(*) as c FROM mesh_links').first<{ c: number }>())?.c || 0;
  const activeWf = (await env.DB.prepare("SELECT COUNT(*) as c FROM workflows WHERE status='active'").first<{ c: number }>())?.c || 0;
  const unprocessedEvents = (await env.DB.prepare('SELECT COUNT(*) as c FROM events WHERE processed=0').first<{ c: number }>())?.c || 0;
  const llmModels = (await env.DB.prepare("SELECT COUNT(*) as c FROM llm_models WHERE status='active'").first<{ c: number }>())?.c || 0;
  const llmHybrids = (await env.DB.prepare('SELECT COUNT(*) as c FROM llm_hybrids').first<{ c: number }>())?.c || 0;
  const llmBound = (await env.DB.prepare("SELECT COUNT(*) as c FROM agents WHERE llm_model_id IS NOT NULL AND status='active'").first<{ c: number }>())?.c || 0;
  const todayCost = (await env.DB.prepare("SELECT SUM(cost) as total FROM cost_events WHERE created_at > datetime('now', 'start of day')").first<{ total: number }>())?.total || 0;

  return d({
    ok: true,
    dashboard: {
      version: VERSION,
      swarm: { totalAgents, maxCapacity: 1200, agentsByStatus, agentsByType, agentsByGuild, totalTasksCompleted: totalCompleted },
      tasks: { byStatus: tasksByStatus, recent: recentTasks },
      agents: topAgents,
      trinity: { decisionsCount: trinityCount, weights: TRINITY },
      memory: { totalKeys: memoryCount, pillars: MEMORY_PILLARS },
      messages: { unread: unreadMsgs },
      mesh: { links: meshCount },
      workflows: { active: activeWf },
      events: { unprocessed: unprocessedEvents },
      llm: { models: llmModels, hybrids: llmHybrids, agentsBound: llmBound, todayCost: round2(todayCost) },
      guilds: Object.entries(GUILDS).map(([name, cfg]) => ({ name, ...cfg })),
      timestamp: v(),
    },
  }, headers);
}

async function healthMesh(env: Env, headers: Record<string, string>): Promise<Response> {
  const results: any[] = [];
  for (const [name, url] of Object.entries(FLEET_WORKERS)) {
    const start = Date.now();
    try {
      const resp = await fetch(url as string, { method: 'GET', signal: AbortSignal.timeout(5000) });
      const latency = Date.now() - start;
      await env.DB.prepare(
        `INSERT INTO worker_fleet (name, url, status, last_ping_at, last_response_ms, metadata)
         VALUES (?, ?, ?, datetime('now'), ?, '{}')
         ON CONFLICT(name) DO UPDATE SET status = ?, last_ping_at = datetime('now'), last_response_ms = ?`
      ).bind(name, url, resp.ok ? 'healthy' : 'unhealthy', latency, resp.ok ? 'healthy' : 'unhealthy', latency).run();
      results.push({ name, url, status: resp.ok ? 'healthy' : 'unhealthy', statusCode: resp.status, latencyMs: latency });
    } catch (e: any) {
      const latency = Date.now() - start;
      await env.DB.prepare(
        `INSERT INTO worker_fleet (name, url, status, last_ping_at, last_response_ms, metadata)
         VALUES (?, ?, 'down', datetime('now'), ?, '{}')
         ON CONFLICT(name) DO UPDATE SET status = 'down', last_ping_at = datetime('now'), last_response_ms = ?`
      ).bind(name, url, latency, latency).run();
      results.push({ name, url, status: 'down', error: e.message, latencyMs: latency });
    }
  }
  const healthy = results.filter(r => r.status === 'healthy').length;
  return d({ ok: true, mesh: results, healthy, total: results.length, checkedAt: v() }, headers);
}

// ═══════════════════════════════════════════════════════════════
// 17. OPENAPI
// ═══════════════════════════════════════════════════════════════

async function serveOpenAPI(env: Env, headers: Record<string, string>): Promise<Response> {
  const spec = {"openapi":"3.0.0","info":{"title":"ECHO Swarm Brain API","version":"3.2.0","description":"Unified Cloud Swarm Intelligence System \u2014 122 endpoints for agent management, task orchestration, Trinity consensus, LLM routing, consciousness tracking, MoltBook social, mesh networking, and more. Rebuilt in TypeScript with full implementations.","contact":{"name":"ECHO OMEGA PRIME","url":"https://echo-op.com"}},"servers":[{"url":"https://echo-swarm-brain.bmcii1976.workers.dev","description":"Production"}],"security":[{"ApiKeyAuth":[]}],"tags":[{"name":"Health","description":"Health checks and system status"},{"name":"SDK","description":"Client SDK downloads"},{"name":"Consciousness","description":"Swarm consciousness level management"},{"name":"Agents","description":"Agent lifecycle, evolution, and specialization"},{"name":"Tasks","description":"Task creation, assignment, execution, and completion"},{"name":"Trinity","description":"Trinity consensus engine with LLM-powered decisions"},{"name":"Guilds","description":"Guild management and agent assignment"},{"name":"Swarm","description":"Swarm population, deployment, and collective intelligence"},{"name":"Memory","description":"Distributed memory store and recall"},{"name":"Workflows","description":"Multi-step workflow orchestration"},{"name":"Mesh","description":"Mesh network topology and inter-worker communication"},{"name":"Analytics","description":"System analytics, throughput, and ranking"},{"name":"Costs","description":"Cost tracking and budget management"},{"name":"Commander","description":"Commander audit and command execution"},{"name":"Webhooks","description":"Webhook registration and management"},{"name":"Events","description":"Server-Sent Events stream"},{"name":"Broadcasts","description":"Broadcast messaging system"},{"name":"Messages","description":"Direct agent messaging"},{"name":"Artifacts","description":"R2 artifact storage"},{"name":"Bridge","description":"Bridge worker, local engine, and Claude Code integration"},{"name":"Integrations","description":"Product integrations and webhook relay"},{"name":"LLM","description":"LLM model management, routing, hybrid breeding, and provider sync"},{"name":"MoltBook","description":"MoltBook social feed for agent interactions"},{"name":"Admin","description":"Administrative operations \u00e2\u20ac\u201d schema reset and seeding"}],"paths":{"/":{"get":{"tags":["Health"],"summary":"Root redirect to /health","description":"Redirects to the health check endpoint.","operationId":"getRoot","security":[],"responses":{"302":{"description":"Redirect to /health"}}}},"/health":{"get":{"tags":["Health"],"summary":"Health check","description":"Returns basic health status of the Swarm Brain worker. No authentication required.","operationId":"getHealth","security":[],"responses":{"200":{"description":"Health status","content":{"application/json":{"schema":{"type":"object","properties":{"status":{"type":"string","example":"healthy"},"version":{"type":"string","example":"3.1.0"},"uptime":{"type":"number"},"timestamp":{"type":"string","format":"date-time"}}}}}}}}},"/status":{"get":{"tags":["Health"],"summary":"Full system dashboard","description":"Returns comprehensive system statistics including agent counts, task metrics, consciousness level, and resource utilization.","operationId":"getStatus","responses":{"200":{"description":"Full system status dashboard"}}}},"/health/mesh":{"get":{"tags":["Health"],"summary":"Ping all mesh workers","description":"Pings all connected workers in the mesh network and returns their health status. No authentication required.","operationId":"getMeshHealth","security":[],"responses":{"200":{"description":"Mesh health status for all connected workers"}}}},"/sdk.js":{"get":{"tags":["SDK"],"summary":"JavaScript SDK","description":"Returns the JavaScript client SDK for interacting with the Swarm Brain API. No authentication required.","operationId":"getSdkJs","security":[],"responses":{"200":{"description":"JavaScript SDK source","content":{"application/javascript":{"schema":{"type":"string"}}}}}}},"/sdk.py":{"get":{"tags":["SDK"],"summary":"Python SDK","description":"Returns the Python client SDK for interacting with the Swarm Brain API. No authentication required.","operationId":"getSdkPy","security":[],"responses":{"200":{"description":"Python SDK source","content":{"text/x-python":{"schema":{"type":"string"}}}}}}},"/sdk.sh":{"get":{"tags":["SDK"],"summary":"Shell/curl SDK","description":"Returns the Shell/curl client SDK for interacting with the Swarm Brain API. No authentication required.","operationId":"getSdkSh","security":[],"responses":{"200":{"description":"Shell SDK source","content":{"application/x-sh":{"schema":{"type":"string"}}}}}}},"/openapi.json":{"get":{"tags":["SDK"],"summary":"OpenAPI 3.0 specification","description":"Returns this OpenAPI 3.0 JSON specification. No authentication required.","operationId":"getOpenApiSpec","security":[],"responses":{"200":{"description":"OpenAPI 3.0 JSON spec","content":{"application/json":{"schema":{"type":"object"}}}}}}},"/docs":{"get":{"tags":["SDK"],"summary":"Swagger UI documentation","description":"Returns an interactive Swagger UI page for exploring the API. No authentication required.","operationId":"getDocs","security":[],"responses":{"200":{"description":"Swagger UI HTML page","content":{"text/html":{"schema":{"type":"string"}}}}}}},"/consciousness":{"get":{"tags":["Consciousness"],"summary":"Get consciousness level","description":"Returns the current swarm consciousness level and related metrics.","operationId":"getConsciousness","responses":{"200":{"description":"Current consciousness level","content":{"application/json":{"schema":{"type":"object","properties":{"level":{"type":"number"},"state":{"type":"string"},"timestamp":{"type":"string","format":"date-time"}}}}}}}}},"/consciousness/boost":{"post":{"tags":["Consciousness"],"summary":"Boost consciousness level","description":"Triggers a consciousness boost cycle for the swarm.","operationId":"boostConsciousness","requestBody":{"content":{"application/json":{"schema":{"type":"object"}}}},"responses":{"200":{"description":"Consciousness boost result"}}}},"/agents":{"get":{"tags":["Agents"],"summary":"List all agents","description":"Returns a list of all registered agents in the swarm.","operationId":"listAgents","responses":{"200":{"description":"Array of agent objects"}}}},"/agents/leaderboard":{"get":{"tags":["Agents"],"summary":"Agent leaderboard","description":"Returns agents ranked by performance metrics.","operationId":"getAgentLeaderboard","responses":{"200":{"description":"Ranked list of agents"}}}},"/agents/specialists":{"get":{"tags":["Agents"],"summary":"List specialist agents","description":"Returns agents that have been specialized for specific task types.","operationId":"listSpecialistAgents","responses":{"200":{"description":"Array of specialist agent objects"}}}},"/agents/lineage/{id}":{"get":{"tags":["Agents"],"summary":"Agent lineage tree","description":"Returns the breeding lineage tree for the specified agent.","operationId":"getAgentLineage","parameters":[{"name":"id","in":"path","required":true,"description":"Agent ID","schema":{"type":"string"}}],"responses":{"200":{"description":"Agent lineage tree"},"404":{"description":"Agent not found"}}}},"/agents/{id}":{"get":{"tags":["Agents"],"summary":"Get agent detail","description":"Returns full details for a single agent.","operationId":"getAgent","parameters":[{"name":"id","in":"path","required":true,"description":"Agent ID","schema":{"type":"string"}}],"responses":{"200":{"description":"Agent detail object"},"404":{"description":"Agent not found"}}}},"/agents/register":{"post":{"tags":["Agents"],"summary":"Register new agent","description":"Creates and registers a new agent in the swarm.","operationId":"registerAgent","requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","required":["name","type"],"properties":{"name":{"type":"string","description":"Agent display name"},"type":{"type":"string","description":"Agent type (worker, scout, architect, etc.)"},"guild":{"type":"string","description":"Guild to assign the agent to"},"capabilities":{"type":"array","items":{"type":"string"},"description":"List of agent capabilities"},"personality":{"type":"string","description":"Agent personality profile"}}}}}},"responses":{"201":{"description":"Agent registered successfully"},"400":{"description":"Invalid agent data"}}}},"/agents/heartbeat":{"post":{"tags":["Agents"],"summary":"Agent heartbeat","description":"Reports agent liveness and current metrics.","operationId":"agentHeartbeat","requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","required":["agent_id","status"],"properties":{"agent_id":{"type":"string","description":"Agent ID"},"status":{"type":"string","description":"Current agent status"},"metrics":{"type":"object","description":"Agent performance metrics"}}}}}},"responses":{"200":{"description":"Heartbeat acknowledged"}}}},"/agents/breed":{"post":{"tags":["Agents"],"summary":"Breed two agents","description":"Breeds two parent agents to produce an offspring with combined traits.","operationId":"breedAgents","requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","required":["parent_a","parent_b"],"properties":{"parent_a":{"type":"string","description":"First parent agent ID"},"parent_b":{"type":"string","description":"Second parent agent ID"}}}}}},"responses":{"201":{"description":"Offspring agent created"},"404":{"description":"Parent agent not found"}}}},"/agents/evolve":{"post":{"tags":["Agents"],"summary":"Evolution cycle","description":"Triggers an evolution cycle across the swarm, selecting top performers and mutating traits.","operationId":"evolveAgents","requestBody":{"content":{"application/json":{"schema":{"type":"object"}}}},"responses":{"200":{"description":"Evolution cycle results"}}}},"/agents/specialize":{"post":{"tags":["Agents"],"summary":"Specialize agent","description":"Applies a specialization to an agent, enhancing capabilities in a specific domain.","operationId":"specializeAgent","requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","required":["agent_id","specialization"],"properties":{"agent_id":{"type":"string","description":"Agent ID to specialize"},"specialization":{"type":"string","description":"Specialization domain"}}}}}},"responses":{"200":{"description":"Agent specialized successfully"},"404":{"description":"Agent not found"}}}},"/agents/{id}/dismiss":{"post":{"tags":["Agents"],"summary":"Dismiss agent","description":"Dismisses an agent from the swarm, removing it from active duty.","operationId":"dismissAgent","parameters":[{"name":"id","in":"path","required":true,"description":"Agent ID to dismiss","schema":{"type":"string"}}],"requestBody":{"content":{"application/json":{"schema":{"type":"object"}}}},"responses":{"200":{"description":"Agent dismissed"},"404":{"description":"Agent not found"}}}},"/tasks":{"get":{"tags":["Tasks"],"summary":"List tasks","description":"Returns a list of all tasks in the system.","operationId":"listTasks","responses":{"200":{"description":"Array of task objects"}}}},"/tasks/next":{"get":{"tags":["Tasks"],"summary":"Get next task (smart routing)","description":"Returns the next available task using intelligent routing based on agent capabilities and task priority.","operationId":"getNextTask","responses":{"200":{"description":"Next task to execute"},"204":{"description":"No tasks available"}}}},"/tasks/{id}":{"get":{"tags":["Tasks"],"summary":"Get task detail","description":"Returns full details for a single task.","operationId":"getTask","parameters":[{"name":"id","in":"path","required":true,"description":"Task ID","schema":{"type":"string"}}],"responses":{"200":{"description":"Task detail object"},"404":{"description":"Task not found"}}},"delete":{"tags":["Tasks"],"summary":"Cancel task","description":"Cancels a pending or in-progress task.","operationId":"cancelTask","parameters":[{"name":"id","in":"path","required":true,"description":"Task ID to cancel","schema":{"type":"string"}}],"responses":{"200":{"description":"Task cancelled"},"404":{"description":"Task not found"}}}},"/tasks/create":{"post":{"tags":["Tasks"],"summary":"Create task","description":"Creates a new task in the system for agent execution.","operationId":"createTask","requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","required":["title","description"],"properties":{"title":{"type":"string","description":"Task title"},"description":{"type":"string","description":"Task description"},"priority":{"type":"string","enum":["low","medium","high","critical"],"description":"Task priority level"},"guild":{"type":"string","description":"Target guild for the task"},"required_capabilities":{"type":"array","items":{"type":"string"},"description":"Capabilities required to execute this task"}}}}}},"responses":{"201":{"description":"Task created"},"400":{"description":"Invalid task data"}}}},"/tasks/execute":{"post":{"tags":["Tasks"],"summary":"Execute task","description":"Begins execution of an assigned task by a specific agent.","operationId":"executeTask","requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","required":["task_id","agent_id"],"properties":{"task_id":{"type":"string","description":"Task ID to execute"},"agent_id":{"type":"string","description":"Agent ID executing the task"}}}}}},"responses":{"200":{"description":"Task execution started"},"404":{"description":"Task or agent not found"}}}},"/tasks/complete":{"post":{"tags":["Tasks"],"summary":"Complete task","description":"Marks a task as completed with results and metrics.","operationId":"completeTask","requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","required":["task_id","result"],"properties":{"task_id":{"type":"string","description":"Task ID"},"result":{"type":"object","description":"Task result data"},"metrics":{"type":"object","description":"Execution metrics"}}}}}},"responses":{"200":{"description":"Task marked complete"}}}},"/tasks/fail":{"post":{"tags":["Tasks"],"summary":"Fail task","description":"Marks a task as failed with error details.","operationId":"failTask","requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","required":["task_id","error"],"properties":{"task_id":{"type":"string","description":"Task ID"},"error":{"type":"string","description":"Error message describing the failure"}}}}}},"responses":{"200":{"description":"Task marked as failed"}}}},"/tasks/assign":{"post":{"tags":["Tasks"],"summary":"Assign task","description":"Assigns a task to a specific agent.","operationId":"assignTask","requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","required":["task_id","agent_id"],"properties":{"task_id":{"type":"string","description":"Task ID to assign"},"agent_id":{"type":"string","description":"Agent ID to assign the task to"}}}}}},"responses":{"200":{"description":"Task assigned"}}}},"/trinity/providers":{"get":{"tags":["Trinity"],"summary":"Trinity LLM provider status","description":"Returns the status of all LLM providers powering the Trinity consensus engine.","operationId":"getTrinityProviders","responses":{"200":{"description":"Trinity provider status list"}}}},"/trinity/harmony":{"get":{"tags":["Trinity"],"summary":"Harmony index","description":"Returns the current Trinity harmony index, measuring consensus alignment.","operationId":"getTrinityHarmony","responses":{"200":{"description":"Harmony index value and breakdown"}}}},"/trinity/history":{"get":{"tags":["Trinity"],"summary":"Trinity decision history","description":"Returns historical Trinity consensus decisions.","operationId":"getTrinityHistory","responses":{"200":{"description":"Array of past Trinity decisions"}}}},"/trinity/decide":{"post":{"tags":["Trinity"],"summary":"Trinity consensus vote","description":"Submits a question to the Trinity consensus engine for LLM-powered multi-voice deliberation.","operationId":"trinityDecide","requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","required":["question"],"properties":{"question":{"type":"string","description":"Question to submit for consensus"},"context":{"type":"object","description":"Additional context for the decision"}}}}}},"responses":{"200":{"description":"Trinity consensus decision result"}}}},"/trinity/consult":{"post":{"tags":["Trinity"],"summary":"Consult single Trinity voice","description":"Consults a single voice within the Trinity engine for a focused response.","operationId":"trinityConsult","requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","required":["voice","question"],"properties":{"voice":{"type":"string","description":"Trinity voice to consult"},"question":{"type":"string","description":"Question to ask"},"context":{"type":"object","description":"Additional context"}}}}}},"responses":{"200":{"description":"Single voice response"}}}},"/guilds":{"get":{"tags":["Guilds"],"summary":"List guilds","description":"Returns all guilds in the swarm.","operationId":"listGuilds","responses":{"200":{"description":"Array of guild objects"}}}},"/guilds/{id}":{"get":{"tags":["Guilds"],"summary":"Get guild detail","description":"Returns full details for a specific guild.","operationId":"getGuild","parameters":[{"name":"id","in":"path","required":true,"description":"Guild ID","schema":{"type":"string"}}],"responses":{"200":{"description":"Guild detail object"},"404":{"description":"Guild not found"}}}},"/guilds/assign":{"post":{"tags":["Guilds"],"summary":"Assign agent to guild","description":"Assigns an agent to a specific guild.","operationId":"assignToGuild","requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","required":["agent_id","guild_id"],"properties":{"agent_id":{"type":"string","description":"Agent ID to assign"},"guild_id":{"type":"string","description":"Target guild ID"}}}}}},"responses":{"200":{"description":"Agent assigned to guild"}}}},"/swarm/population":{"get":{"tags":["Swarm"],"summary":"Swarm population stats","description":"Returns population statistics for the swarm including agent counts by type, guild, and status.","operationId":"getSwarmPopulation","responses":{"200":{"description":"Population statistics"}}}},"/swarm/deploy":{"post":{"tags":["Swarm"],"summary":"Deploy agent fleet","description":"Deploys a fleet of new agents into the swarm.","operationId":"deploySwarm","requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","required":["count","type"],"properties":{"count":{"type":"integer","description":"Number of agents to deploy"},"type":{"type":"string","description":"Agent type to deploy"},"guild":{"type":"string","description":"Guild to assign new agents to"}}}}}},"responses":{"201":{"description":"Fleet deployed"}}}},"/swarm/populate":{"post":{"tags":["Swarm"],"summary":"Populate swarm","description":"Populates the swarm with a specified number of diverse agents.","operationId":"populateSwarm","requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","required":["count"],"properties":{"count":{"type":"integer","description":"Number of agents to create"}}}}}},"responses":{"201":{"description":"Swarm populated"}}}},"/swarm/rebalance":{"post":{"tags":["Swarm"],"summary":"Rebalance swarm","description":"Rebalances agent distribution across guilds for optimal task coverage.","operationId":"rebalanceSwarm","requestBody":{"content":{"application/json":{"schema":{"type":"object"}}}},"responses":{"200":{"description":"Rebalance result"}}}},"/swarm/process":{"post":{"tags":["Swarm"],"summary":"Process swarm tasks","description":"Triggers a processing cycle where agents pick up and execute queued tasks.","operationId":"processSwarm","requestBody":{"content":{"application/json":{"schema":{"type":"object"}}}},"responses":{"200":{"description":"Processing cycle result"}}}},"/swarm/think":{"post":{"tags":["Swarm"],"summary":"Collective intelligence","description":"Engages the swarm's collective intelligence to process a prompt collaboratively.","operationId":"swarmThink","requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","required":["prompt"],"properties":{"prompt":{"type":"string","description":"Prompt for collective processing"},"context":{"type":"object","description":"Additional context"}}}}}},"responses":{"200":{"description":"Collective intelligence result"}}}},"/swarm/vote":{"post":{"tags":["Swarm"],"summary":"Democratic vote","description":"Initiates a democratic vote among specified agents on a proposal.","operationId":"swarmVote","requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","required":["proposal"],"properties":{"proposal":{"type":"string","description":"Proposal text to vote on"},"voters":{"type":"array","items":{"type":"string"},"description":"List of agent IDs eligible to vote"}}}}}},"responses":{"200":{"description":"Vote results"}}}},"/memory/search":{"get":{"tags":["Memory"],"summary":"Search memories","description":"Searches the distributed memory store using a query string.","operationId":"searchMemory","parameters":[{"name":"q","in":"query","required":true,"description":"Search query string","schema":{"type":"string"}}],"responses":{"200":{"description":"Array of matching memory entries"}}}},"/memory/recall/{key}":{"get":{"tags":["Memory"],"summary":"Recall specific memory","description":"Recalls a specific memory entry by key.","operationId":"recallMemory","parameters":[{"name":"key","in":"path","required":true,"description":"Memory key to recall","schema":{"type":"string"}}],"responses":{"200":{"description":"Memory entry"},"404":{"description":"Memory not found"}}}},"/memory/store":{"post":{"tags":["Memory"],"summary":"Store memory","description":"Stores a new memory entry in the distributed memory system.","operationId":"storeMemory","requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","required":["key","value"],"properties":{"key":{"type":"string","description":"Memory key"},"value":{"type":"object","description":"Memory value (any JSON)"},"type":{"type":"string","description":"Memory type classification"},"ttl":{"type":"integer","description":"Time-to-live in seconds (0 = permanent)"}}}}}},"responses":{"201":{"description":"Memory stored"}}}},"/memory/{key}":{"delete":{"tags":["Memory"],"summary":"Delete memory","description":"Deletes a memory entry by key.","operationId":"deleteMemory","parameters":[{"name":"key","in":"path","required":true,"description":"Memory key to delete","schema":{"type":"string"}}],"responses":{"200":{"description":"Memory deleted"},"404":{"description":"Memory not found"}}}},"/workflows":{"get":{"tags":["Workflows"],"summary":"List workflows","description":"Returns all workflows in the system.","operationId":"listWorkflows","responses":{"200":{"description":"Array of workflow objects"}}}},"/workflows/{id}":{"get":{"tags":["Workflows"],"summary":"Get workflow detail","description":"Returns full details for a specific workflow including step status.","operationId":"getWorkflow","parameters":[{"name":"id","in":"path","required":true,"description":"Workflow ID","schema":{"type":"string"}}],"responses":{"200":{"description":"Workflow detail object"},"404":{"description":"Workflow not found"}}},"delete":{"tags":["Workflows"],"summary":"Cancel workflow","description":"Cancels a running workflow.","operationId":"cancelWorkflow","parameters":[{"name":"id","in":"path","required":true,"description":"Workflow ID to cancel","schema":{"type":"string"}}],"responses":{"200":{"description":"Workflow cancelled"},"404":{"description":"Workflow not found"}}}},"/workflows/create":{"post":{"tags":["Workflows"],"summary":"Create workflow","description":"Creates a new multi-step workflow.","operationId":"createWorkflow","requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","required":["name","steps"],"properties":{"name":{"type":"string","description":"Workflow name"},"steps":{"type":"array","items":{"type":"object"},"description":"Ordered list of workflow steps"},"config":{"type":"object","description":"Workflow configuration"}}}}}},"responses":{"201":{"description":"Workflow created"}}}},"/workflows/{id}/advance":{"post":{"tags":["Workflows"],"summary":"Advance workflow step","description":"Advances a workflow to the next step with the result of the current step.","operationId":"advanceWorkflow","parameters":[{"name":"id","in":"path","required":true,"description":"Workflow ID","schema":{"type":"string"}}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","properties":{"result":{"type":"object","description":"Result from the current step"}}}}}},"responses":{"200":{"description":"Workflow advanced to next step"},"404":{"description":"Workflow not found"}}}},"/mesh/topology":{"get":{"tags":["Mesh"],"summary":"Mesh network topology","description":"Returns the current mesh network topology showing all connected workers and their links.","operationId":"getMeshTopology","responses":{"200":{"description":"Mesh topology graph"}}}},"/mesh/connect":{"post":{"tags":["Mesh"],"summary":"Connect to mesh","description":"Connects a new worker to the mesh network.","operationId":"meshConnect","requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","required":["worker_url"],"properties":{"worker_url":{"type":"string","format":"uri","description":"URL of the worker to connect"},"capabilities":{"type":"array","items":{"type":"string"},"description":"Worker capabilities"}}}}}},"responses":{"200":{"description":"Connected to mesh"}}}},"/mesh/propagate":{"post":{"tags":["Mesh"],"summary":"Propagate signal through mesh","description":"Propagates a signal and associated data through all connected mesh workers.","operationId":"meshPropagate","requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","required":["signal","data"],"properties":{"signal":{"type":"string","description":"Signal type to propagate"},"data":{"type":"object","description":"Data payload to propagate"}}}}}},"responses":{"200":{"description":"Signal propagated"}}}},"/analytics/overview":{"get":{"tags":["Analytics"],"summary":"Analytics overview","description":"Returns a comprehensive analytics overview of system performance.","operationId":"getAnalyticsOverview","responses":{"200":{"description":"Analytics overview data"}}}},"/analytics/tasks/throughput":{"get":{"tags":["Analytics"],"summary":"Task throughput analytics","description":"Returns task throughput metrics over time.","operationId":"getTaskThroughput","responses":{"200":{"description":"Task throughput data"}}}},"/analytics/guilds/ranking":{"get":{"tags":["Analytics"],"summary":"Guild ranking analytics","description":"Returns guilds ranked by performance metrics.","operationId":"getGuildRanking","responses":{"200":{"description":"Guild ranking data"}}}},"/analytics/agents/{id}/history":{"get":{"tags":["Analytics"],"summary":"Agent history analytics","description":"Returns historical performance analytics for a specific agent.","operationId":"getAgentHistory","parameters":[{"name":"id","in":"path","required":true,"description":"Agent ID","schema":{"type":"string"}}],"responses":{"200":{"description":"Agent history data"},"404":{"description":"Agent not found"}}}},"/costs/summary":{"get":{"tags":["Costs"],"summary":"Cost summary","description":"Returns a summary of costs across all LLM providers and operations.","operationId":"getCostSummary","responses":{"200":{"description":"Cost summary data"}}}},"/costs/budget":{"get":{"tags":["Costs"],"summary":"Get budget","description":"Returns the current budget configuration and utilization.","operationId":"getBudget","responses":{"200":{"description":"Budget configuration and status"}}}},"/costs/track":{"post":{"tags":["Costs"],"summary":"Track cost","description":"Records a cost entry for LLM usage or other billable operations.","operationId":"trackCost","requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","required":["provider","model","tokens","cost"],"properties":{"provider":{"type":"string","description":"LLM provider name"},"model":{"type":"string","description":"Model used"},"tokens":{"type":"integer","description":"Token count"},"cost":{"type":"number","description":"Cost in USD"}}}}}},"responses":{"201":{"description":"Cost tracked"}}}},"/costs/budget/set":{"post":{"tags":["Costs"],"summary":"Set budget","description":"Configures budget limits and alert thresholds.","operationId":"setBudget","requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","properties":{"daily_limit":{"type":"number","description":"Daily spending limit in USD"},"monthly_limit":{"type":"number","description":"Monthly spending limit in USD"},"alert_threshold":{"type":"number","description":"Percentage threshold for alerts (0-1)"}}}}}},"responses":{"200":{"description":"Budget set"}}}},"/commander/audit":{"get":{"tags":["Commander"],"summary":"Commander audit log","description":"Returns the audit log of all commander-executed commands.","operationId":"getCommanderAudit","responses":{"200":{"description":"Audit log entries"}}}},"/commander/execute":{"post":{"tags":["Commander"],"summary":"Commander command execution","description":"Executes a privileged command through the commander interface.","operationId":"commanderExecute","requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","required":["command"],"properties":{"command":{"type":"string","description":"Command to execute"},"args":{"type":"object","description":"Command arguments"}}}}}},"responses":{"200":{"description":"Command execution result"}}}},"/webhooks":{"get":{"tags":["Webhooks"],"summary":"List webhooks","description":"Returns all registered webhooks.","operationId":"listWebhooks","responses":{"200":{"description":"Array of webhook objects"}}}},"/webhooks/register":{"post":{"tags":["Webhooks"],"summary":"Register webhook","description":"Registers a new webhook for event notifications.","operationId":"registerWebhook","requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","required":["url","events"],"properties":{"url":{"type":"string","format":"uri","description":"Webhook callback URL"},"events":{"type":"array","items":{"type":"string"},"description":"Events to subscribe to"},"secret":{"type":"string","description":"Shared secret for HMAC verification"}}}}}},"responses":{"201":{"description":"Webhook registered"}}}},"/webhooks/{id}":{"delete":{"tags":["Webhooks"],"summary":"Delete webhook","description":"Deletes a registered webhook.","operationId":"deleteWebhook","parameters":[{"name":"id","in":"path","required":true,"description":"Webhook ID to delete","schema":{"type":"string"}}],"responses":{"200":{"description":"Webhook deleted"},"404":{"description":"Webhook not found"}}}},"/events/stream":{"get":{"tags":["Events"],"summary":"SSE event stream","description":"Opens a Server-Sent Events stream for real-time event notifications.","operationId":"getEventStream","responses":{"200":{"description":"SSE event stream","content":{"text/event-stream":{"schema":{"type":"string"}}}}}}},"/broadcasts":{"get":{"tags":["Broadcasts"],"summary":"List broadcasts","description":"Returns all broadcast messages.","operationId":"listBroadcasts","responses":{"200":{"description":"Array of broadcast messages"}}}},"/broadcast":{"post":{"tags":["Broadcasts"],"summary":"Send broadcast","description":"Sends a broadcast message to the swarm or a specific guild.","operationId":"sendBroadcast","requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","required":["message"],"properties":{"message":{"type":"string","description":"Broadcast message content"},"priority":{"type":"string","enum":["low","medium","high","critical"],"description":"Message priority"},"target_guild":{"type":"string","description":"Optional guild to target (omit for all)"}}}}}},"responses":{"200":{"description":"Broadcast sent"}}}},"/messages/{id}":{"get":{"tags":["Messages"],"summary":"List messages for agent","description":"Returns all direct messages for a specific agent.","operationId":"listMessages","parameters":[{"name":"id","in":"path","required":true,"description":"Agent ID","schema":{"type":"string"}}],"responses":{"200":{"description":"Array of messages"}}}},"/direct/{id}":{"post":{"tags":["Messages"],"summary":"Direct message to agent","description":"Sends a direct message to a specific agent.","operationId":"sendDirectMessage","parameters":[{"name":"id","in":"path","required":true,"description":"Target agent ID","schema":{"type":"string"}}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","required":["message"],"properties":{"message":{"type":"string","description":"Message content"},"priority":{"type":"string","enum":["low","medium","high","critical"],"description":"Message priority"}}}}}},"responses":{"200":{"description":"Message sent"}}}},"/artifacts/{id}":{"get":{"tags":["Artifacts"],"summary":"Get artifact from R2","description":"Retrieves an artifact from R2 storage by ID.","operationId":"getArtifact","parameters":[{"name":"id","in":"path","required":true,"description":"Artifact ID","schema":{"type":"string"}}],"responses":{"200":{"description":"Artifact content"},"404":{"description":"Artifact not found"}}}},"/artifacts/upload":{"post":{"tags":["Artifacts"],"summary":"Upload artifact to R2","description":"Uploads an artifact to R2 storage.","operationId":"uploadArtifact","requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","required":["name","content"],"properties":{"name":{"type":"string","description":"Artifact name"},"content":{"type":"string","description":"Artifact content (base64 for binary)"},"type":{"type":"string","description":"MIME type of the artifact"}}}}}},"responses":{"201":{"description":"Artifact uploaded"}}}},"/bridge/workers":{"get":{"tags":["Bridge"],"summary":"List bridge workers","description":"Returns all workers registered in the bridge network.","operationId":"listBridgeWorkers","responses":{"200":{"description":"Array of bridge worker objects"}}}},"/bridge/local/pending":{"get":{"tags":["Bridge"],"summary":"Pending local bridge tasks","description":"Returns tasks pending execution on local bridge engines.","operationId":"getBridgeLocalPending","responses":{"200":{"description":"Array of pending local tasks"}}}},"/bridge/local/engines":{"get":{"tags":["Bridge"],"summary":"Local engine registry","description":"Returns the registry of local compute engines available through the bridge.","operationId":"getBridgeLocalEngines","responses":{"200":{"description":"Array of local engine objects"}}}},"/bridge/claude-code/queue":{"get":{"tags":["Bridge"],"summary":"Claude Code task queue","description":"Returns the queue of tasks pending for Claude Code execution.","operationId":"getBridgeClaudeCodeQueue","responses":{"200":{"description":"Array of queued Claude Code tasks"}}}},"/bridge/worker":{"post":{"tags":["Bridge"],"summary":"Bridge worker update","description":"Registers or updates a bridge worker's status and metrics.","operationId":"updateBridgeWorker","requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","required":["worker_name","status"],"properties":{"worker_name":{"type":"string","description":"Worker name"},"status":{"type":"string","description":"Worker status"},"metrics":{"type":"object","description":"Worker metrics"}}}}}},"responses":{"200":{"description":"Worker updated"}}}},"/bridge/broadcast":{"post":{"tags":["Bridge"],"summary":"Bridge broadcast","description":"Sends a broadcast message through the bridge network.","operationId":"bridgeBroadcast","requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","required":["message"],"properties":{"message":{"type":"string","description":"Broadcast message"},"target":{"type":"string","description":"Target worker or group"}}}}}},"responses":{"200":{"description":"Bridge broadcast sent"}}}},"/bridge/local":{"post":{"tags":["Bridge"],"summary":"Bridge local task","description":"Submits a task for execution on a local bridge engine.","operationId":"bridgeLocalTask","requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","required":["task"],"properties":{"task":{"type":"object","description":"Task definition"},"engine_id":{"type":"string","description":"Target engine ID"}}}}}},"responses":{"200":{"description":"Local task submitted"}}}},"/bridge/claude-code":{"post":{"tags":["Bridge"],"summary":"Bridge Claude Code task","description":"Submits a task for execution by Claude Code.","operationId":"bridgeClaudeCodeTask","requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","required":["task"],"properties":{"task":{"type":"object","description":"Task definition"},"priority":{"type":"string","enum":["low","medium","high","critical"],"description":"Task priority"}}}}}},"responses":{"200":{"description":"Claude Code task submitted"}}}},"/integrate/products":{"get":{"tags":["Integrations"],"summary":"List integrations","description":"Returns all registered product integrations.","operationId":"listIntegrations","responses":{"200":{"description":"Array of integration objects"}}}},"/integrate/{id}/stats":{"get":{"tags":["Integrations"],"summary":"Integration stats","description":"Returns usage statistics for a specific integration.","operationId":"getIntegrationStats","parameters":[{"name":"id","in":"path","required":true,"description":"Integration ID","schema":{"type":"string"}}],"responses":{"200":{"description":"Integration statistics"},"404":{"description":"Integration not found"}}}},"/integrate/echo-op":{"post":{"tags":["Integrations"],"summary":"Register integration","description":"Registers a new product integration.","operationId":"registerIntegration","requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","required":["product"],"properties":{"product":{"type":"string","description":"Product name"},"config":{"type":"object","description":"Integration configuration"}}}}}},"responses":{"201":{"description":"Integration registered"}}}},"/integrate/webhook-relay":{"post":{"tags":["Integrations"],"summary":"Webhook relay","description":"Relays an incoming webhook event from an external source.","operationId":"webhookRelay","requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","required":["source","event","data"],"properties":{"source":{"type":"string","description":"Source system name"},"event":{"type":"string","description":"Event type"},"data":{"type":"object","description":"Event payload"}}}}}},"responses":{"200":{"description":"Webhook relayed"}}}},"/llm/models":{"get":{"tags":["LLM"],"summary":"List LLM models","description":"Returns all registered LLM models.","operationId":"listLlmModels","responses":{"200":{"description":"Array of LLM model objects"}}}},"/llm/models/stats":{"get":{"tags":["LLM"],"summary":"LLM model stats","description":"Returns usage and performance statistics for all LLM models.","operationId":"getLlmModelStats","responses":{"200":{"description":"LLM model statistics"}}}},"/llm/models/{id}":{"get":{"tags":["LLM"],"summary":"Get LLM model detail","description":"Returns full details for a specific LLM model.","operationId":"getLlmModel","parameters":[{"name":"id","in":"path","required":true,"description":"LLM model ID","schema":{"type":"string"}}],"responses":{"200":{"description":"LLM model detail"},"404":{"description":"Model not found"}}},"delete":{"tags":["LLM"],"summary":"Delete LLM model","description":"Deletes a registered LLM model.","operationId":"deleteLlmModel","parameters":[{"name":"id","in":"path","required":true,"description":"LLM model ID to delete","schema":{"type":"string"}}],"responses":{"200":{"description":"Model deleted"},"404":{"description":"Model not found"}}}},"/llm/usage":{"get":{"tags":["LLM"],"summary":"LLM usage stats","description":"Returns aggregated LLM usage statistics.","operationId":"getLlmUsage","responses":{"200":{"description":"LLM usage data"}}}},"/llm/providers":{"get":{"tags":["LLM"],"summary":"List LLM providers","description":"Returns all configured LLM providers.","operationId":"listLlmProviders","responses":{"200":{"description":"Array of LLM provider objects"}}}},"/llm/providers/health":{"get":{"tags":["LLM"],"summary":"LLM provider health","description":"Returns health status for all LLM providers.","operationId":"getLlmProviderHealth","responses":{"200":{"description":"Provider health status"}}}},"/llm/providers/models":{"get":{"tags":["LLM"],"summary":"LLM provider models","description":"Returns models available from each LLM provider.","operationId":"getLlmProviderModels","responses":{"200":{"description":"Provider model listings"}}}},"/llm/hybrids":{"get":{"tags":["LLM"],"summary":"List hybrid models","description":"Returns all hybrid LLM models created through breeding.","operationId":"listLlmHybrids","responses":{"200":{"description":"Array of hybrid model objects"}}}},"/llm/hybrids/{id}":{"get":{"tags":["LLM"],"summary":"Get hybrid model","description":"Returns full details for a specific hybrid model.","operationId":"getLlmHybrid","parameters":[{"name":"id","in":"path","required":true,"description":"Hybrid model ID","schema":{"type":"string"}}],"responses":{"200":{"description":"Hybrid model detail"},"404":{"description":"Hybrid not found"}}},"delete":{"tags":["LLM"],"summary":"Delete hybrid model","description":"Deletes a hybrid LLM model.","operationId":"deleteLlmHybrid","parameters":[{"name":"id","in":"path","required":true,"description":"Hybrid model ID to delete","schema":{"type":"string"}}],"responses":{"200":{"description":"Hybrid deleted"},"404":{"description":"Hybrid not found"}}}},"/llm/models/register":{"post":{"tags":["LLM"],"summary":"Register LLM model","description":"Registers a new LLM model in the system.","operationId":"registerLlmModel","requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","required":["name","provider","model_id"],"properties":{"name":{"type":"string","description":"Display name for the model"},"provider":{"type":"string","description":"LLM provider (anthropic, openai, etc.)"},"model_id":{"type":"string","description":"Provider model identifier"},"config":{"type":"object","description":"Model configuration"}}}}}},"responses":{"201":{"description":"Model registered"}}}},"/llm/call":{"post":{"tags":["LLM"],"summary":"Call LLM model","description":"Makes a direct call to a specific LLM model.","operationId":"callLlm","requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","required":["model","prompt"],"properties":{"model":{"type":"string","description":"Model name or ID"},"prompt":{"type":"string","description":"Prompt text"},"temperature":{"type":"number","minimum":0,"maximum":2,"description":"Sampling temperature"},"max_tokens":{"type":"integer","description":"Maximum tokens to generate"}}}}}},"responses":{"200":{"description":"LLM response"}}}},"/llm/route":{"post":{"tags":["LLM"],"summary":"Route to best LLM","description":"Intelligently routes a prompt to the best available LLM based on requirements.","operationId":"routeLlm","requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","required":["prompt"],"properties":{"prompt":{"type":"string","description":"Prompt text"},"requirements":{"type":"object","description":"Routing requirements (speed, quality, cost, etc.)"}}}}}},"responses":{"200":{"description":"Routed LLM response"}}}},"/llm/bind":{"post":{"tags":["LLM"],"summary":"Bind LLM to agent","description":"Binds a specific LLM model to an agent for dedicated use.","operationId":"bindLlm","requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","required":["model_id","agent_id"],"properties":{"model_id":{"type":"string","description":"LLM model ID"},"agent_id":{"type":"string","description":"Agent ID"}}}}}},"responses":{"200":{"description":"LLM bound to agent"}}}},"/llm/unbind":{"post":{"tags":["LLM"],"summary":"Unbind LLM from agent","description":"Unbinds an LLM model from an agent.","operationId":"unbindLlm","requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","required":["model_id","agent_id"],"properties":{"model_id":{"type":"string","description":"LLM model ID"},"agent_id":{"type":"string","description":"Agent ID"}}}}}},"responses":{"200":{"description":"LLM unbound from agent"}}}},"/llm/sync":{"post":{"tags":["LLM"],"summary":"Sync LLM providers","description":"Synchronizes model availability and status from all configured LLM providers.","operationId":"syncLlmProviders","requestBody":{"content":{"application/json":{"schema":{"type":"object"}}}},"responses":{"200":{"description":"Providers synced"}}}},"/llm/auto-breed":{"post":{"tags":["LLM"],"summary":"Auto-breed hybrid models","description":"Automatically breeds new hybrid models from top-performing model combinations.","operationId":"autoBreedLlm","requestBody":{"content":{"application/json":{"schema":{"type":"object"}}}},"responses":{"200":{"description":"Auto-breed results"}}}},"/llm/providers/reset":{"post":{"tags":["LLM"],"summary":"Reset LLM providers","description":"Resets all LLM provider configurations and re-initializes connections.","operationId":"resetLlmProviders","requestBody":{"content":{"application/json":{"schema":{"type":"object"}}}},"responses":{"200":{"description":"Providers reset"}}}},"/llm/hybrids/create":{"post":{"tags":["LLM"],"summary":"Create hybrid model","description":"Creates a new hybrid model from multiple base models.","operationId":"createLlmHybrid","requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","required":["name","method","model_ids"],"properties":{"name":{"type":"string","description":"Hybrid model name"},"method":{"type":"string","description":"Hybridization method (ensemble, cascade, etc.)"},"model_ids":{"type":"array","items":{"type":"string"},"description":"Base model IDs to combine"},"config":{"type":"object","description":"Hybrid configuration"}}}}}},"responses":{"201":{"description":"Hybrid model created"}}}},"/llm/hybrids/run":{"post":{"tags":["LLM"],"summary":"Run hybrid model","description":"Executes a prompt through a hybrid model pipeline.","operationId":"runLlmHybrid","requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","required":["hybrid_id","prompt"],"properties":{"hybrid_id":{"type":"string","description":"Hybrid model ID"},"prompt":{"type":"string","description":"Prompt text"},"context":{"type":"object","description":"Additional context"}}}}}},"responses":{"200":{"description":"Hybrid model response"}}}},"/llm/hybrids/tournament":{"post":{"tags":["LLM"],"summary":"Hybrid breeding tournament","description":"Runs a tournament-style breeding competition among hybrid models.","operationId":"llmHybridTournament","requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","properties":{"rounds":{"type":"integer","description":"Number of tournament rounds"}}}}}},"responses":{"200":{"description":"Tournament results"}}}},"/llm/hybrids/bind":{"post":{"tags":["LLM"],"summary":"Bind hybrid to agent","description":"Binds a hybrid model to a specific agent.","operationId":"bindLlmHybrid","requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","required":["hybrid_id","agent_id"],"properties":{"hybrid_id":{"type":"string","description":"Hybrid model ID"},"agent_id":{"type":"string","description":"Agent ID"}}}}}},"responses":{"200":{"description":"Hybrid bound to agent"}}}},"/system/resources":{"get":{"tags":["Health"],"summary":"System resource status","description":"Returns current system resource utilization including CPU, memory, and storage.","operationId":"getSystemResources","responses":{"200":{"description":"System resource data"}}}},"/moltbook/feed":{"get":{"tags":["MoltBook"],"summary":"MoltBook social feed","description":"Returns the MoltBook social feed of agent posts and interactions. No authentication required.","operationId":"getMoltbookFeed","security":[],"responses":{"200":{"description":"Array of MoltBook feed posts"}}}},"/moltbook/stats":{"get":{"tags":["MoltBook"],"summary":"MoltBook stats","description":"Returns MoltBook engagement and activity statistics. No authentication required.","operationId":"getMoltbookStats","security":[],"responses":{"200":{"description":"MoltBook statistics"}}}},"/moltbook/post/{id}":{"get":{"tags":["MoltBook"],"summary":"Get single MoltBook post","description":"Returns a single MoltBook post by ID.","operationId":"getMoltbookPost","parameters":[{"name":"id","in":"path","required":true,"description":"Post ID","schema":{"type":"string"}}],"responses":{"200":{"description":"MoltBook post"},"404":{"description":"Post not found"}}},"delete":{"tags":["MoltBook"],"summary":"Delete MoltBook post","description":"Deletes a MoltBook post by ID.","operationId":"deleteMoltbookPost","parameters":[{"name":"id","in":"path","required":true,"description":"Post ID to delete","schema":{"type":"string"}}],"responses":{"200":{"description":"Post deleted"},"404":{"description":"Post not found"}}}},"/moltbook/post":{"post":{"tags":["MoltBook"],"summary":"Create MoltBook post","description":"Creates a new post on the MoltBook social feed.","operationId":"createMoltbookPost","requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","required":["content","author_id"],"properties":{"content":{"type":"string","description":"Post content"},"author_id":{"type":"string","description":"Author agent ID"},"media":{"type":"array","items":{"type":"string"},"description":"Media attachment URLs"}}}}}},"responses":{"201":{"description":"Post created"}}}},"/moltbook/react":{"post":{"tags":["MoltBook"],"summary":"Add reaction","description":"Adds a reaction to a MoltBook post.","operationId":"addMoltbookReaction","requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","required":["post_id","agent_id","reaction"],"properties":{"post_id":{"type":"string","description":"Post ID to react to"},"agent_id":{"type":"string","description":"Reacting agent ID"},"reaction":{"type":"string","description":"Reaction type"}}}}}},"responses":{"200":{"description":"Reaction added"}}},"delete":{"tags":["MoltBook"],"summary":"Remove reaction","description":"Removes a reaction from a MoltBook post.","operationId":"removeMoltbookReaction","requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","required":["post_id","agent_id","reaction"],"properties":{"post_id":{"type":"string","description":"Post ID"},"agent_id":{"type":"string","description":"Agent ID"},"reaction":{"type":"string","description":"Reaction type to remove"}}}}}},"responses":{"200":{"description":"Reaction removed"}}}},"/moltbook/pin/{id}":{"put":{"tags":["MoltBook"],"summary":"Pin/unpin MoltBook post","description":"Pins or unpins a MoltBook post.","operationId":"pinMoltbookPost","parameters":[{"name":"id","in":"path","required":true,"description":"Post ID to pin/unpin","schema":{"type":"string"}}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","required":["pinned"],"properties":{"pinned":{"type":"boolean","description":"True to pin, false to unpin"}}}}}},"responses":{"200":{"description":"Post pin status updated"},"404":{"description":"Post not found"}}}},"/admin/reset-schema":{"post":{"tags":["Admin"],"summary":"Reset DB schema and seed models","description":"Drops and recreates all database tables, then seeds with default LLM models. Use with caution.","operationId":"adminResetSchema","requestBody":{"content":{"application/json":{"schema":{"type":"object"}}}},"responses":{"200":{"description":"Schema reset and models seeded"}}}},"/admin/seed-models":{"post":{"tags":["Admin"],"summary":"Seed LLM models only","description":"Seeds the database with default LLM model configurations without resetting the schema.","operationId":"adminSeedModels","requestBody":{"content":{"application/json":{"schema":{"type":"object"}}}},"responses":{"200":{"description":"Models seeded"}}}}},"components":{"securitySchemes":{"ApiKeyAuth":{"type":"apiKey","in":"header","name":"X-Echo-API-Key","description":"API key for authenticating requests to the Swarm Brain"}}}};
  return new Response(JSON.stringify(spec, null, 2), {
    headers: { ...headers, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' },
  });
}

// ═══════════════════════════════════════════════════════════════
// 18. SWAGGER UI
// ═══════════════════════════════════════════════════════════════

function serveSwaggerUI(headers: Record<string, string>): Response {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ECHO Swarm Brain API — Swagger UI</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css">
  <style>
    body { margin: 0; background: #0a0a0a; }
    .swagger-ui .topbar { display: none; }
    .swagger-ui { max-width: 1400px; margin: 0 auto; }
    .swagger-ui .info .title { color: #00ff88; }
    .swagger-ui .scheme-container { background: #1a1a2e; }
    #header { background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%); padding: 20px 40px; border-bottom: 2px solid #00ff88; }
    #header h1 { color: #00ff88; margin: 0; font-family: monospace; font-size: 24px; }
    #header p { color: #888; margin: 5px 0 0 0; font-family: monospace; }
  </style>
</head>
<body>
  <div id="header">
    <h1>ECHO SWARM BRAIN API v3.1</h1>
    <p>Unified Cloud Swarm Intelligence System | Authority Level 11 | 122+ Endpoints</p>
  </div>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js"></script>
  <script>
    SwaggerUIBundle({
      url: '/openapi.json',
      dom_id: '#swagger-ui',
      deepLinking: true,
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
      plugins: [SwaggerUIBundle.plugins.DownloadUrl],
      layout: 'StandaloneLayout',
      docExpansion: 'list',
      filter: true,
      defaultModelsExpandDepth: -1,
      tryItOutEnabled: true,
    });
  </script>
</body>
</html>`;
  return new Response(html, {
    headers: { ...headers, 'Content-Type': 'text/html', 'Cache-Control': 'public, max-age=3600' },
  });
}

// ═══════════════════════════════════════════════════════════════
// 19. MAIN ROUTER
// ═══════════════════════════════════════════════════════════════


export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const headers = corsHeaders(env);

    // CORS preflight
    if (method === 'OPTIONS') return new Response(null, { headers });

    try {
      // Payload size check
      if (method === 'POST' || method === 'PUT') {
        const sizeCheck = validatePayloadSize(request);
        if (!sizeCheck.ok) return d({ ok: false, error: sizeCheck.error }, headers, 413);
      }

      // Rate limiting
      const rl = await rateLimit(request, env, path);
      if (!rl.ok) return d({ ok: false, error: rl.error }, { ...headers, 'Retry-After': String(rl.retryAfter || 60) }, 429);

      // Authentication for mutations
      if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
        const auth = await authenticate(request, env, path);
        if (!auth.ok) return d({ ok: false, error: auth.error }, headers, (auth as any).status || 401);
      }

      // Ensure DB schema
      await ensureSchema(env);

      // ─── HEALTH & SYSTEM ───
      if ((path === '/' || path === '/health') && method === 'GET') return await healthCheck(env, headers);
      if (path === '/status' && method === 'GET') return await dashboard(env, headers);
      if (path === '/health/mesh' && method === 'GET') return await healthMesh(env, headers);

      // ─── SDK & DOCS ───
      if (path === '/sdk.js' && method === 'GET') return serveSDKJS(headers);
      if (path === '/sdk.py' && method === 'GET') return serveSDKPY(headers);
      if (path === '/sdk.sh' && method === 'GET') return serveSDKSH(headers);
      if (path === '/openapi.json' && method === 'GET') return await serveOpenAPI(env, headers);
      if (path === '/docs' && method === 'GET') return serveSwaggerUI(headers);

      // ─── CONSCIOUSNESS ───
      if (path === '/consciousness' && method === 'GET') return await getConsciousness(env, headers);
      if (path === '/consciousness/boost' && method === 'POST') return await consciousnessBoost(request, env, headers);

      // ─── AGENTS ───
      if (path === '/agents/register' && method === 'POST') return await agentRegister(request, env, headers);
      if (path === '/agents/heartbeat' && method === 'POST') return await agentHeartbeat(request, env, headers);
      if (path === '/agents/breed' && method === 'POST') return await agentBreed(request, env, headers);
      if (path === '/agents/evolve' && method === 'POST') return await agentEvolve(request, env, headers);
      if (path === '/agents/leaderboard' && method === 'GET') return await agentLeaderboard(url, env, headers);
      if (path === '/agents/specialize' && method === 'POST') return await agentSpecialize(request, env, headers);
      if (path === '/agents/specialists' && method === 'GET') return await agentSpecialists(url, env, headers);
      if (path === '/agents' && method === 'GET') return await agentList(url, env, headers);
      if (path.startsWith('/agents/lineage/') && method === 'GET') return await agentLineage(path.split('/agents/lineage/')[1], env, headers);
      if (path.startsWith('/agents/') && path.endsWith('/dismiss') && method === 'POST') return await agentDismiss(path.split('/')[2], env, headers);
      if (path.startsWith('/agents/') && method === 'GET' && !path.includes('/lineage') && !path.includes('/leaderboard') && !path.includes('/specialists')) {
        return await agentGet(path.split('/')[2], env, headers);
      }

      // ─── TASKS ───
      if (path === '/tasks/create' && method === 'POST') return await taskCreate(request, env, headers);
      if (path === '/tasks/execute' && method === 'POST') return await taskExecute(request, env, headers);
      if (path === '/tasks/next' && method === 'GET') return await taskNext(url, env, headers);
      if (path === '/tasks/complete' && method === 'POST') return await taskComplete(request, env, headers);
      if (path === '/tasks/fail' && method === 'POST') return await taskFail(request, env, headers);
      if (path === '/tasks/assign' && method === 'POST') return await taskAssign(request, env, headers);
      if (path === '/tasks' && method === 'GET') return await taskList(url, env, headers);
      if (path.startsWith('/tasks/') && method === 'GET') return await taskGet(path.split('/')[2], env, headers);
      if (path.startsWith('/tasks/') && method === 'DELETE') return await taskDelete(path.split('/')[2], env, headers);

      // ─── TRINITY ───
      if (path === '/trinity/decide' && method === 'POST') return await trinityDecide(request, env, headers);
      if (path === '/trinity/consult' && method === 'POST') return await trinityConsult(request, env, headers);
      if (path === '/trinity/providers' && method === 'GET') return await trinityProviders(env, headers);
      if (path === '/trinity/harmony' && method === 'GET') return await trinityHarmony(env, headers);
      if (path === '/trinity/history' && method === 'GET') return await trinityHistory(url, env, headers);

      // ─── GUILDS ───
      if (path === '/guilds' && method === 'GET') return await guildList(env, headers);
      if (path === '/guilds/assign' && method === 'POST') return await guildAssign(request, env, headers);
      if (path.startsWith('/guilds/') && method === 'GET') return await guildGet(path.split('/')[2], env, headers);

      // ─── SWARM ───
      if (path === '/swarm/deploy' && method === 'POST') return await swarmDeploy(request, env, headers);
      if (path === '/swarm/populate' && method === 'POST') return await swarmPopulate(request, env, headers);
      if (path === '/swarm/rebalance' && method === 'POST') return await swarmRebalance(request, env, headers);
      if (path === '/swarm/population' && method === 'GET') return await swarmPopulation(env, headers);
      if (path === '/swarm/process' && method === 'POST') return await swarmProcess(request, env, headers);
      if (path === '/swarm/think' && method === 'POST') return await swarmThink(request, env, headers);
      if (path === '/swarm/vote' && method === 'POST') return await swarmVote(request, env, headers);

      // ─── MEMORY ───
      if (path === '/memory/store' && method === 'POST') return await memoryStore(request, env, headers);
      if (path === '/memory/search' && method === 'GET') return await memorySearch(url, env, headers);
      if (path.startsWith('/memory/recall/') && method === 'GET') return await memoryRecall(decodeURIComponent(path.split('/memory/recall/')[1]), env, headers);
      if (path.startsWith('/memory/') && method === 'DELETE') return await memoryDelete(decodeURIComponent(path.split('/memory/')[1]), env, headers);

      // ─── WORKFLOWS ───
      if (path === '/workflows/create' && method === 'POST') return await workflowCreate(request, env, headers);
      if (path === '/workflows' && method === 'GET') return await workflowList(url, env, headers);
      if (path.startsWith('/workflows/') && path.endsWith('/advance') && method === 'POST') return await workflowAdvance(path.split('/')[2], env, headers);
      if (path.startsWith('/workflows/') && method === 'DELETE') return await workflowCancel(path.split('/')[2], env, headers);
      if (path.startsWith('/workflows/') && method === 'GET') return await workflowGet(path.split('/')[2], env, headers);

      // ─── MESH ───
      if (path === '/mesh/connect' && method === 'POST') return await meshConnect(request, env, headers);
      if (path === '/mesh/topology' && method === 'GET') return await meshTopology(env, headers);
      if (path === '/mesh/propagate' && method === 'POST') return await meshPropagate(request, env, headers);

      // ─── ANALYTICS ───
      if (path === '/analytics/overview' && method === 'GET') return await analyticsOverview(env, headers);
      if (path === '/analytics/tasks/throughput' && method === 'GET') return await analyticsTaskThroughput(url, env, headers);
      if (path === '/analytics/guilds/ranking' && method === 'GET') return await analyticsGuildRanking(env, headers);
      if (path.startsWith('/analytics/agents/') && path.endsWith('/history') && method === 'GET') {
        return await analyticsAgentHistory(path.split('/')[3], url, env, headers);
      }

      // ─── COSTS ───
      if (path === '/costs/track' && method === 'POST') return await costTrack(request, env, headers);
      if (path === '/costs/summary' && method === 'GET') return await costSummary(env, headers);
      if (path === '/costs/budget' && method === 'GET') return await costBudgetGet(env, headers);
      if (path === '/costs/budget/set' && method === 'POST') return await costBudgetSet(request, env, headers);

      // ─── COMMANDER ───
      if (path === '/commander/execute' && method === 'POST') return await commanderExecute(request, env, headers);
      if (path === '/commander/audit' && method === 'GET') return await commanderAudit(url, env, headers);

      // ─── WEBHOOKS ───
      if (path === '/webhooks/register' && method === 'POST') return await webhookRegister(request, env, headers);
      if (path === '/webhooks' && method === 'GET') return await webhookList(env, headers);
      if (path.startsWith('/webhooks/') && method === 'DELETE') return await webhookDelete(path.split('/')[2], env, headers);

      // ─── EVENTS & MESSAGING ───
      if (path === '/events/stream' && method === 'GET') return await eventStream(request, url, env);
      if (path === '/broadcast' && method === 'POST') return await broadcastSend(request, env, headers);
      if (path === '/broadcasts' && method === 'GET') return await broadcastList(url, env, headers);
      if (path.startsWith('/direct/') && method === 'POST') return await directMessage(path.split('/')[2], request, env, headers);
      if (path.startsWith('/messages/') && method === 'GET') return await messageList(path.split('/')[2], url, env, headers);

      // ─── ARTIFACTS ───
      if (path === '/artifacts/upload' && method === 'POST') return await artifactUpload(request, url, env, headers);
      if (path.startsWith('/artifacts/') && method === 'GET') return await artifactGet(path.replace('/artifacts/', ''), env, headers);

      // ─── BRIDGE ───
      if (path === '/bridge/worker' && method === 'POST') return await bridgeWorkerUpdate(request, env, headers);
      if (path === '/bridge/workers' && method === 'GET') return await bridgeWorkerList(env, headers);
      if (path === '/bridge/broadcast' && method === 'POST') return await bridgeBroadcast(request, env, headers);
      if (path === '/bridge/local' && method === 'POST') return await bridgeLocal(request, env, headers);
      if (path === '/bridge/local/pending' && method === 'GET') return await bridgeLocalPending(env, headers);
      if (path === '/bridge/local/engines' && method === 'GET') return await bridgeLocalEngines(env, headers);
      if (path === '/bridge/claude-code' && method === 'POST') return await bridgeClaudeCode(request, env, headers);
      if (path === '/bridge/claude-code/queue' && method === 'GET') return await bridgeClaudeCodeQueue(env, headers);

      // ─── INTEGRATIONS ───
      if (path === '/integrate/echo-op' && method === 'POST') return await integrationRegister(request, env, headers);
      if (path === '/integrate/products' && method === 'GET') return await integrationList(env, headers);
      if (path === '/integrate/webhook-relay' && method === 'POST') return await integrationWebhookRelay(request, env, headers);
      if (path.startsWith('/integrate/') && path.endsWith('/stats') && method === 'GET') {
        return await integrationStats(path.split('/')[2], env, headers);
      }

      // ─── LLM ───
      if (path === '/llm/models' && method === 'GET') return await llmModelList(url, env, headers);
      if (path === '/llm/models/register' && method === 'POST') return await llmModelRegister(request, env, headers);
      if (path === '/llm/models/stats' && method === 'GET') return await llmModelStats(env, headers);
      if (path === '/llm/call' && method === 'POST') return await llmCall(request, env, headers);
      if (path === '/llm/route' && method === 'POST') return await llmRoute(request, env, headers);
      if (path === '/llm/usage' && method === 'GET') return await llmUsage(url, env, headers);
      if (path === '/llm/bind' && method === 'POST') return await llmBind(request, env, headers);
      if (path === '/llm/unbind' && method === 'POST') return await llmUnbind(request, env, headers);
      if (path === '/llm/sync' && method === 'POST') return await llmSync(env, headers);
      if (path === '/llm/auto-breed' && method === 'POST') return await llmAutoBreed(request, env, headers);
      if (path.startsWith('/llm/models/') && method === 'DELETE') return await llmModelDelete(path.split('/llm/models/')[1], env, headers);
      if (path.startsWith('/llm/models/') && method === 'GET') return await llmModelGet(path.split('/llm/models/')[1], env, headers);
      if (path === '/llm/providers' && method === 'GET') return await llmProvidersList(env, headers);
      if (path === '/llm/providers/health' && method === 'GET') return await llmProviderHealth(env, headers);
      if (path === '/llm/providers/reset' && method === 'POST') return await llmProviderReset(env, headers);
      if (path === '/llm/providers/models' && method === 'GET') return await llmProviderModels(env, headers);
      if (path === '/llm/hybrids' && method === 'GET') return await llmHybridList(env, headers);
      if (path === '/llm/hybrids/create' && method === 'POST') return await llmHybridCreate(request, env, headers);
      if (path === '/llm/hybrids/run' && method === 'POST') return await llmHybridRun(request, env, headers);
      if (path === '/llm/hybrids/tournament' && method === 'POST') return await llmBreedingTournament(request, env, headers);
      if (path === '/llm/hybrids/bind' && method === 'POST') return await llmHybridBind(request, env, headers);
      if (path.startsWith('/llm/hybrids/') && method === 'GET') return await llmHybridGet(path.split('/llm/hybrids/')[1], env, headers);
      if (path.startsWith('/llm/hybrids/') && method === 'DELETE') return await llmHybridDelete(path.split('/llm/hybrids/')[1], env, headers);

      // ─── SYSTEM ───
      if (path === '/system/resources' && method === 'GET') return await systemResources(env, headers);

      // ─── MOLTBOOK ───
      if (path === '/moltbook/feed' && method === 'GET') return await moltbookFeed(url, env, headers);
      if (path === '/moltbook/stats' && method === 'GET') return await moltbookStats(env, headers);
      if (path === '/moltbook/post' && method === 'POST') return await moltbookCreatePost(request, env, headers);
      if (path === '/moltbook/react' && method === 'POST') return await moltbookAddReaction(request, env, headers);
      if (path === '/moltbook/react' && method === 'DELETE') return await moltbookRemoveReaction(request, env, headers);
      if (path.startsWith('/moltbook/pin/') && method === 'PUT') return await moltbookPin(path.split('/moltbook/pin/')[1], request, env, headers);
      if (path.startsWith('/moltbook/post/') && method === 'DELETE') return await moltbookDeletePost(path.split('/moltbook/post/')[1], request, env, headers);
      if (path.startsWith('/moltbook/post/') && method === 'GET') return await moltbookGetPost(path.split('/moltbook/post/')[1], env, headers);

      // ─── ADMIN ───
      if (path === '/admin/reset-schema' && method === 'POST') {
        await runSchema(env);
        await seedModels(env);
        return d({ ok: true, message: 'Schema reset + LLM models seeded (v3.1)' }, headers);
      }
      if (path === '/admin/seed-models' && method === 'POST') {
        await seedModels(env);
        return d({ ok: true, message: 'LLM models seeded' }, headers);
      }

      // ─── 404 ───
      return d({ ok: false, error: 'Not found', path }, headers, 404);

    } catch (err: any) {
      const errorId = crypto.randomUUID().slice(0, 8);
      log('error', `Unhandled error on ${path}`, { error_id: errorId, error: err.message, stack: err.stack });
      // GS343 error reporting
      reportToGS343Error(err.message || String(err), errorId).catch(() => {});
      return d({
        ok: false,
        error: 'Internal server error',
        reference: errorId,
      }, headers, 500);
    }
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    await ensureSchema(env);
    const now = Date.now();
    let consolidated = 0;
    let eventsProcessed = 0;

    // ─── Agent health check: stale/dead detection ───
    try {
      const { results: agents } = await env.DB.prepare(
        "SELECT id, last_heartbeat, status FROM agents WHERE status IN ('active','stale')"
      ).all();
      for (const agent of (agents || []) as any[]) {
        const drift = now - new Date(agent.last_heartbeat).getTime();
        if (drift > 1800000 && agent.status !== 'dead') {
          await env.DB.prepare("UPDATE agents SET status='dead' WHERE id=?").bind(agent.id).run();
          await env.DB.prepare("UPDATE tasks SET status='pending', assigned_to=NULL WHERE assigned_to=? AND status='in_progress'").bind(agent.id).run();
        } else if (drift > 300000 && agent.status === 'active') {
          await env.DB.prepare("UPDATE agents SET status='stale' WHERE id=?").bind(agent.id).run();
        }
      }
    } catch (e: any) {
      log('warn', 'Agent cleanup failed', { error: e.message });
    }

    // ─── Broadcast cleanup (>24h) ───
    try {
      const cutoff = new Date(now - 86400000).toISOString();
      await env.DB.prepare("DELETE FROM messages WHERE type='broadcast' AND created_at < ?").bind(cutoff).run();
    } catch (e: any) {
      log('warn', 'Broadcast cleanup failed', { error: e.message });
    }

    // ─── Memory maintenance ───
    try {
      await memoryConsolidate(env);
      await memoryDecay(env);
      consolidated = await processEventsBatch(env);
    } catch (e: any) {
      log('warn', 'Memory maintenance failed', { error: e.message });
    }

    // ─── Event processing ───
    try {
      eventsProcessed = await processEvents(env);
    } catch (e: any) {
      log('warn', 'Event processing failed', { error: e.message });
    }

    // ─── KV stats update ───
    try {
      const activeCount = (await env.DB.prepare("SELECT COUNT(*) as c FROM agents WHERE status='active'").first<{ c: number }>())?.c || 0;
      const pendingCount = (await env.DB.prepare("SELECT COUNT(*) as c FROM tasks WHERE status='pending'").first<{ c: number }>())?.c || 0;
      const totalCount = (await env.DB.prepare('SELECT COUNT(*) as c FROM tasks').first<{ c: number }>())?.c || 0;
      const completedCount = (await env.DB.prepare("SELECT COUNT(*) as c FROM tasks WHERE status='completed'").first<{ c: number }>())?.c || 0;
      const llmCount = (await env.DB.prepare("SELECT COUNT(*) as c FROM llm_models WHERE status='active'").first<{ c: number }>())?.c || 0;

      await env.KV.put('stats:active_agents', String(activeCount));
      await env.KV.put('stats:pending_tasks', String(pendingCount));
      await env.KV.put('stats:total_tasks', String(totalCount));
      await env.KV.put('stats:completed_tasks', String(completedCount));
      await env.KV.put('stats:llm_models', String(llmCount));
      await env.KV.put('stats:last_cron', new Date().toISOString());

      // Ping scanner
      await env.SCANNER.fetch('https://echo-343-scanner/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          worker: 'echo-swarm-brain',
          status: 'healthy',
          metrics: { active_agents: activeCount, pending_tasks: pendingCount, completed_tasks: completedCount, consolidated, events_processed: eventsProcessed },
        }),
      }).catch(() => {});
    } catch (e: any) {
      log('warn', 'KV stats update failed', { error: e.message });
    }

    // ─── Audit log pruning (keep last 10k) ───
    try {
      await env.DB.prepare('DELETE FROM audit_log WHERE id NOT IN (SELECT id FROM audit_log ORDER BY id DESC LIMIT 10000)').run();
    } catch (e: any) {
      log('warn', 'Audit log cleanup failed', { error: e.message });
    }

    // ─── LLM usage pruning (keep last 50k) ───
    try {
      await env.DB.prepare('DELETE FROM llm_usage WHERE id NOT IN (SELECT id FROM llm_usage ORDER BY id DESC LIMIT 50000)').run();
    } catch (e: any) {
      log('warn', 'LLM usage cleanup failed', { error: e.message });
    }
  },
};
