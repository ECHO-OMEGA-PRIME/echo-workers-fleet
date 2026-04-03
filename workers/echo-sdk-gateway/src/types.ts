/**
 * Echo SDK Gateway — Type definitions.
 *
 * Cloudflare Worker environment bindings, request/response shapes,
 * and canonical envelope types for the SDK Gateway Worker.
 */

// ---------------------------------------------------------------------------
// Worker Environment
// ---------------------------------------------------------------------------

export interface Env {
  // Service bindings (Worker-to-Worker, zero latency)
  ENGINE_RUNTIME: Fetcher;
  SHARED_BRAIN: Fetcher;
  KNOWLEDGE_FORGE: Fetcher;
  VAULT_API: Fetcher;
  GRAPH_RAG: Fetcher;

  // Additional optional service bindings used by /worker/call proxy
  // Cloudflare blocks same-account Worker→Worker via public URL (error 1042),
  // so frequently-called workers must be bound here.
  ECHO_CHAT: Fetcher;
  ECHO_SPEAK_CLOUD: Fetcher;
  ECHO_SWARM_BRAIN: Fetcher;
  ECHO_ENGINE_CLOUD: Fetcher;
  ECHO_DOCTRINE_FORGE: Fetcher;
  ECHO_AI_ORCHESTRATOR: Fetcher;

  // Forge service bindings (all 8 forges)
  FORGE_ENGINE: Fetcher;
  FORGE_APP: Fetcher;
  FORGE_WORKER: Fetcher;
  FORGE_HEPHAESTION: Fetcher;
  FORGE_DAEDALUS: Fetcher;
  FORGE_PROMPT: Fetcher;
  FORGE_X: Fetcher;

  // Tool Discovery (function catalog, 1.37M functions)
  TOOL_DISCOVERY: Fetcher;

  // Forge Marketplace
  FORGE_MARKETPLACE: Fetcher;

  // X200 Swarm Brain, Arcanum, Mega Gateway, Memory Cortex, Fleet Commander
  ECHO_X200_SWARM: Fetcher;
  ECHO_ARCANUM: Fetcher;
  ECHO_MEGA_GATEWAY: Fetcher;
  ECHO_MEMORY_CORTEX: Fetcher;
  ECHO_FLEET_COMMANDER: Fetcher;

  // KV namespaces
  RATE_LIMIT: KVNamespace;
  SEARCH_CACHE: KVNamespace;

  // D1 database for unified FTS5 search index
  DB: D1Database;

  // D1 database for SDK method catalog (221 methods, 30 modules)
  SDK_CATALOG: D1Database;

  // Vectorize for unified semantic search
  VECTORS: VectorizeIndex;

  // Workers AI for embedding generation
  AI: Ai;

  // PayPal Worker binding
  ECHO_PAYPAL: Fetcher;

  // Secrets (set via wrangler secret put)
  API_KEY: string;
  ECHO_API_KEY: string;
  VAULT_API_KEY: string;
  STRIPE_SECRET_KEY: string;

  // Vars
  WORKER_VERSION: string;
}

// ---------------------------------------------------------------------------
// Hono Context Variables (set by auth middleware, read by routes)
// ---------------------------------------------------------------------------

export interface AuthVariables {
  auth_key_id: string;
  auth_tenant_id: string;
  auth_scopes: string[];
  auth_plan: string;
  auth_type: string;
  auth_rate_limit: number;
}

// ---------------------------------------------------------------------------
// Canonical Response Envelope (CONTRACT §3)
// ---------------------------------------------------------------------------

export interface Envelope<T = unknown> {
  success: boolean;
  data: T | null;
  error: { message: string; code: string } | null;
  meta: {
    ts: string;
    version: string;
    service: string;
    latency_ms?: number;
  };
}

// ---------------------------------------------------------------------------
// Engine Runtime types
// ---------------------------------------------------------------------------

export interface EngineQueryRequest {
  query: string;
  mode?: 'FAST' | 'DEFENSE' | 'MEMO';
}

export interface DomainQueryRequest {
  query: string;
  mode?: 'FAST' | 'DEFENSE' | 'MEMO';
  cross_domain?: boolean;
}

export interface CrossDomainQueryRequest {
  query: string;
  mode?: 'FAST' | 'DEFENSE' | 'MEMO';
  limit?: number;
}

export interface EngineSearchRequest {
  query: string;
  limit?: number;
}

export interface DoctrineResult {
  engine_id: string;
  category?: string;
  domain?: string;
  topic: string;
  keywords?: string[];
  conclusion: string;
  reasoning?: string;
  confidence: string;
  zone?: string;
  score: number;
  keyword_score?: number;
  semantic_score?: number;
}

export interface EngineQueryResponse {
  ok: boolean;
  engine_id: string;
  query: string;
  mode: string;
  matched_doctrines: number;
  doctrines: DoctrineResult[];
  response_ms: number;
  determinism_hash: string;
}

export interface DomainQueryResponse {
  ok: boolean;
  domain: string;
  query: string;
  mode: string;
  matched_doctrines: number;
  doctrines: DoctrineResult[];
  response_ms: number;
  determinism_hash: string;
  related_domains?: Array<{
    domain: string;
    label: string;
    relevance_signals: number;
    query_url: string;
  }>;
}

export interface CrossDomainQueryResponse {
  ok: boolean;
  query: string;
  mode: string;
  doctrines: DoctrineResult[];
  total_matches: number;
  response_ms: number;
  domains_searched: string[];
}

export interface EngineSearchResponse {
  ok: boolean;
  query: string;
  search_mode: string;
  results: DoctrineResult[];
  total_matches: number;
}

export interface DomainInfo {
  category: string;
  label: string;
  description?: string;
  master_engine?: string;
  engines_loaded: number;
  total_doctrines: number;
  query_url: string;
}

export interface DomainsListResponse {
  ok: boolean;
  domains: DomainInfo[];
  total_domains: number;
}

export interface EngineStatsResponse {
  ok: boolean;
  total_engines: number;
  total_doctrines: number;
  total_queries: number;
  categories: Array<{
    category: string;
    c: number;
    lines?: number;
    doctrines: number;
  }>;
}

export interface EngineDetailResponse {
  ok: boolean;
  category: string;
  label?: string;
  description?: string;
  engines: Array<{
    engine_id: string;
    engine_name?: string;
    category: string;
    lines?: number;
    doctrines_loaded: number;
  }>;
  total_engines: number;
}

// ---------------------------------------------------------------------------
// Shared Brain types
// ---------------------------------------------------------------------------

export interface BrainIngestRequest {
  content: string;
  instance_id?: string;
  importance?: number;
  tags?: string[];
  role?: string;
}

export interface BrainSearchRequest {
  query: string;
  limit?: number;
}

export interface BrainContextRequest {
  query: string;
  instance_id?: string;
  conversation_id?: string;
}

// ---------------------------------------------------------------------------
// Knowledge Forge types
// ---------------------------------------------------------------------------

export interface KnowledgeSearchRequest {
  query: string;
  category?: string;
  limit?: number;
}

export interface KnowledgeIngestRequest {
  title: string;
  content: string;
  category: string;
  tags?: string[];
}

// ---------------------------------------------------------------------------
// Vault types
// ---------------------------------------------------------------------------

export interface VaultGetRequest {
  key: string;
}

// ---------------------------------------------------------------------------
// Worker Call types
// ---------------------------------------------------------------------------

export interface WorkerCallRequest {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
}

// ---------------------------------------------------------------------------
// LLM types
// ---------------------------------------------------------------------------

export interface LLMCompleteRequest {
  prompt: string;
  model?: 'claude-sonnet-4-6' | 'claude-opus-4-6' | 'claude-haiku-4-5' | string;
  max_tokens?: number;
  stream?: boolean;
  system?: string;
  temperature?: number;
}

// ---------------------------------------------------------------------------
// Webhook types
// ---------------------------------------------------------------------------

export interface WebhookRegisterRequest {
  url: string;
  events: string[];
  secret?: string;
}

export interface WebhookRecord {
  id: string;
  url: string;
  events: string;
  secret: string;
  active: number;
  created_at: string;
  last_triggered: string | null;
  failure_count: number;
}
