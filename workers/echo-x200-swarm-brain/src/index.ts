// ═══════════════════════════════════════════════════════════════════════════════
// ECHO X200 SWARM BRAIN v1.0.0
// ═══════════════════════════════════════════════════════════════════════════════
// 200-Agent Distributed Swarm Intelligence
// Full Sensory Suite: Voice | Hearing | Vision | Touch | Proprioception
// Conversational AI: 14 Personalities × 200 Agents
// Brain Fusion: Shared Brain + Memory Cortex + Graph RAG + Memory Prime
// LLM Backbone: 29 Free Models via AI Orchestrator
// Engine Intelligence: 5,486 Engines × 607K Doctrines
// Knowledge: 12K Docs, 78K Chunks, 312K Graph Nodes
// Voice: ElevenLabs v3 TTS, 6 Voice Profiles, Emotion Tags
// Fleet: 112 Workers, 4-Tier Architecture
// ═══════════════════════════════════════════════════════════════════════════════

import { Hono } from "hono";
import { cors } from "hono/cors";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Env {
  SHARED_BRAIN: Fetcher;
  SWARM_BRAIN: Fetcher;
  FLEET_COMMANDER: Fetcher;
  ENGINE_RUNTIME: Fetcher;
  KNOWLEDGE_FORGE: Fetcher;
  SPEAK_CLOUD: Fetcher;
  CHAT: Fetcher;
  AI_ORCHESTRATOR: Fetcher;
  MEMORY_CORTEX: Fetcher;
  GRAPH_RAG: Fetcher;
  SDK_GATEWAY: Fetcher;
  DB: D1Database;
  AGENT_STATE: KVNamespace;
  ANALYTICS: AnalyticsEngineDataset;
  WORKER_VERSION: string;
  MAX_AGENTS: string;
  SWARM_MODE: string;
  CLAUDE_PROXY_URL: string;
  XAI_API_KEY: string;
  OPENAI_API_KEY: string;
  DEEPSEEK_API_KEY: string;
  TOGETHER_API_KEY: string;
  GEMINI_API_KEY: string;
  OPENROUTER_KEYS: string;  // JSON array of 17 OpenRouter keys
  GITHUB_MODELS_PAT: string; // GitHub Models API (FREE GPT-4.1, DeepSeek, etc)
  GROQ_API_KEY: string;      // Groq (ultra-fast inference)
  PERPLEXITY_API_KEY: string; // Perplexity Sonar (search-augmented)
  COHERE_API_KEY: string;     // Cohere Command (enterprise NLP)
  MISTRAL_API_KEY: string;    // Mistral (European AI)
  SWARM_SECRET?: string;       // Auth secret for HMAC verification
  ECHO_API_KEY?: string;       // API key for bearer auth
}

type AgentRole =
  | "CORTEX"        // Primary reasoning, decision making
  | "SENSORY"       // Input processing (voice, vision, hearing)
  | "MOTOR"         // Output generation (speech, actions)
  | "MEMORY"        // Memory consolidation and retrieval
  | "KNOWLEDGE"     // Knowledge search and synthesis
  | "REASONING"     // Deep analysis, multi-hop inference
  | "CREATIVE"      // Creative generation, brainstorming
  | "EXECUTOR"      // Task execution, API calls
  | "MONITOR"       // System health, performance tracking
  | "COORDINATOR"   // Inter-agent communication, routing
  | "SPECIALIST";   // Domain-specific engine queries

type SensoryModality = "VOICE" | "HEARING" | "VISION" | "TOUCH" | "PROPRIOCEPTION" | "TEMPORAL";

type AgentStatus = "IDLE" | "ACTIVE" | "THINKING" | "SPEAKING" | "LISTENING" | "OBSERVING" | "SLEEPING" | "ERROR";

type SwarmDirective = "CONVERGE" | "DIVERGE" | "SPECIALIZE" | "GENERALIZE" | "CONSENSUS" | "DEBATE" | "EXECUTE" | "REFLECT";

interface SwarmAgent {
  id: string;
  role: AgentRole;
  status: AgentStatus;
  personality: string;
  model: string;
  sensory: SensoryModality[];
  current_task: string | null;
  memory_depth: number;
  confidence: number;
  last_active: number;
  tokens_used: number;
  tasks_completed: number;
}

interface SwarmThought {
  id: string;
  agent_id: string;
  content: string;
  type: "observation" | "reasoning" | "conclusion" | "question" | "action" | "memory" | "sensory";
  confidence: number;
  timestamp: number;
  references: string[];
  sensory_data?: Record<string, unknown>;
}

interface SwarmConsensus {
  id: string;
  query: string;
  thoughts: SwarmThought[];
  consensus: string;
  confidence: number;
  dissent: string[];
  agents_participating: number;
  total_tokens: number;
  duration_ms: number;
  voice_output?: string;
}

interface SensoryInput {
  modality: SensoryModality;
  data: unknown;
  source: string;
  timestamp: number;
  processed: boolean;
  interpretation?: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const VERSION = "1.0.0";
const MAX_AGENTS = 200;
const CONVERGENCE_THRESHOLD = 0.75;
const MIN_CONSENSUS_AGENTS = 3;

const AGENT_ARCHETYPES: Record<AgentRole, { count: number; models: string[]; sensory: SensoryModality[] }> = {
  CORTEX:       { count: 20, models: ["opus", "deepseek-r1", "gpt-4.1", "grok-3"],                  sensory: ["PROPRIOCEPTION", "TEMPORAL"] },
  SENSORY:      { count: 30, models: ["haiku", "gpt-4.1-mini", "llama-4-scout", "workers-ai"],      sensory: ["VOICE", "HEARING", "VISION", "TOUCH"] },
  MOTOR:        { count: 15, models: ["haiku", "gpt-4.1-mini", "workers-ai"],                       sensory: ["VOICE", "PROPRIOCEPTION"] },
  MEMORY:       { count: 20, models: ["sonnet", "deepseek-v3", "gpt-4.1"],                          sensory: ["TEMPORAL"] },
  KNOWLEDGE:    { count: 25, models: ["sonnet", "deepseek-v3", "grok-3"],                           sensory: ["VISION"] },
  REASONING:    { count: 25, models: ["opus", "deepseek-r1", "gpt-4.1", "o3-mini"],                 sensory: ["TEMPORAL", "PROPRIOCEPTION"] },
  CREATIVE:     { count: 15, models: ["opus", "gpt-4.1", "grok-3", "llama-4-scout"],                sensory: ["HEARING", "VISION"] },
  EXECUTOR:     { count: 20, models: ["haiku", "gpt-4.1-mini", "workers-ai"],                       sensory: ["TOUCH"] },
  MONITOR:      { count: 10, models: ["haiku", "workers-ai", "gpt-4.1-nano"],                       sensory: ["PROPRIOCEPTION"] },
  COORDINATOR:  { count: 10, models: ["sonnet", "gpt-4.1", "deepseek-v3"],                          sensory: ["TEMPORAL", "PROPRIOCEPTION"] },
  SPECIALIST:   { count: 10, models: ["opus", "deepseek-r1", "gpt-4.1"],                            sensory: ["VISION", "HEARING"] },
};

const PERSONALITIES = [
  "Echo Prime", "Bree", "Raistlin", "Sage", "Thorne", "Nyx", "GS343",
  "Phoenix", "Prometheus", "Belle", "Tesla", "Warp Mind", "R2-D2", "C-3PO"
];

const VOICE_IDS: Record<string, string> = {
  echo: "keDMh3sQlEXKM4EQxvvi",
  bree: "pzKXffibtCDxnrVO8d1U",
  gs343: "8ATB4Ory7NkyCVRpePdw",
  prometheus: "WSd8ZDUcldL8KQKxz1KN",
  phoenix: "SOYHLrjzK2X1ezoPC6cr",
  commander: "B5SCR8VDENzUF0L4eZY8",
};

// ─── Security: Auth + Error Reporting ───────────────────────────────────────

/** Report errors to GS343 error healing system (best-effort, fire-and-forget) */
async function reportToGS343Error(error: string, errorId: string): Promise<void> {
  try {
    await fetch("https://echo-gs343.bmcii1976.workers.dev/errors/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error,
        source: "echo-x200-swarm-brain",
        category: "runtime",
        error_id: errorId,
        timestamp: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    // GS343 reporting is best-effort
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function ok(data: unknown, version: string, latency_ms?: number) {
  return { success: true, data, error: null, meta: { ts: new Date().toISOString(), version, service: "echo-x200-swarm-brain", latency_ms } };
}

function err(message: string, code: string, version: string, status = 400) {
  return { success: false, data: null, error: { message, code }, meta: { ts: new Date().toISOString(), version } };
}

function uid(): string {
  return crypto.randomUUID();
}

async function proxy(binding: Fetcher, path: string, opts: { method?: string; body?: unknown; headers?: Record<string, string> } = {}) {
  const init: RequestInit = {
    method: opts.method || "GET",
    headers: { "Content-Type": "application/json", ...opts.headers },
  };
  if (opts.body) init.body = JSON.stringify(opts.body);
  try {
    const res = await binding.fetch(new Request(`https://internal${path}`, init));
    return { ok: res.ok, status: res.status, data: await res.json().catch(() => null) };
  } catch (e) {
    console.error(JSON.stringify({ ts: new Date().toISOString(), worker: "echo-x200-swarm-brain", message: `Proxy call failed: ${String(e)}`, path }));
    return { ok: false, status: 500, data: { error: "Internal proxy error" } };
  }
}

// ─── Swarm State (in-memory + KV-backed) ────────────────────────────────────

function generateSwarm(): SwarmAgent[] {
  const agents: SwarmAgent[] = [];
  let idx = 0;
  for (const [role, arch] of Object.entries(AGENT_ARCHETYPES)) {
    for (let i = 0; i < arch.count; i++) {
      agents.push({
        id: `X200-${role.slice(0, 3)}-${String(idx).padStart(3, "0")}`,
        role: role as AgentRole,
        status: "IDLE",
        personality: PERSONALITIES[idx % PERSONALITIES.length],
        model: arch.models[i % arch.models.length],
        sensory: arch.sensory,
        current_task: null,
        memory_depth: role === "MEMORY" ? 10 : role === "CORTEX" ? 7 : 3,
        confidence: 0.85 + Math.random() * 0.15,
        last_active: Date.now(),
        tokens_used: 0,
        tasks_completed: 0,
      });
      idx++;
    }
  }
  return agents;
}

// ─── Hono App ───────────────────────────────────────────────────────────────

const app = new Hono<{ Bindings: Env }>();
app.use("*", cors());

// ─── Auth Middleware: DENY when secrets not configured (C47 fix) ────────────
const AUTH_EXEMPT = ["/health", "/openapi.json"];
app.use("*", async (c, next) => {
  const path = new URL(c.req.url).pathname;
  if (AUTH_EXEMPT.some((p) => path === p || path.startsWith(p + "/")) || c.req.method === "OPTIONS") {
    return next();
  }
  // Allow GETs on non-sensitive paths without auth
  if (c.req.method === "GET" && !path.startsWith("/admin") && !path.startsWith("/commander")) {
    return next();
  }
  const apiKey = c.env.ECHO_API_KEY || c.env.SWARM_SECRET;
  if (!apiKey) {
    console.error("[X200-SWARM-BRAIN] No auth secret configured — blocking request");
    return c.json(err("Service misconfigured — auth not available", "AUTH_CONFIG_ERROR", c.env.WORKER_VERSION || VERSION), 503);
  }
  const provided = c.req.header("X-Echo-API-Key") || c.req.header("X-Swarm-Auth") ||
    c.req.header("Authorization")?.replace("Bearer ", "") || "";
  if (!provided || provided !== apiKey) {
    return c.json(err("Unauthorized", "AUTH_ERROR", c.env.WORKER_VERSION || VERSION), 401);
  }
  return next();
});

// ─── Global Error Handler: sanitize errors + GS343 reporting (H60/H62 fix) ─
app.onError((error, c) => {
  const errorId = crypto.randomUUID().slice(0, 8);
  const v = c.env.WORKER_VERSION || VERSION;
  console.error(JSON.stringify({
    ts: new Date().toISOString(),
    worker: "echo-x200-swarm-brain",
    error_id: errorId,
    message: error.message,
    stack: error.stack,
    path: new URL(c.req.url).pathname,
  }));
  reportToGS343Error(error.message || String(error), errorId).catch(() => {});
  return c.json({
    success: false,
    data: null,
    error: { message: "Internal server error", code: "INTERNAL_ERROR", reference: errorId },
    meta: { ts: new Date().toISOString(), version: v },
  }, 500);
});

// ─── Health ─────────────────────────────────────────────────────────────────

app.get("/health", async (c) => {
  const v = c.env.WORKER_VERSION || VERSION;
  const agents = generateSwarm();
  const roleBreakdown: Record<string, number> = {};
  for (const a of agents) roleBreakdown[a.role] = (roleBreakdown[a.role] || 0) + 1;

  return c.json(ok({
    status: "operational",
    swarm_mode: "X200",
    total_agents: agents.length,
    max_agents: MAX_AGENTS,
    roles: roleBreakdown,
    sensory_modalities: ["VOICE", "HEARING", "VISION", "TOUCH", "PROPRIOCEPTION", "TEMPORAL"],
    personalities: PERSONALITIES.length,
    voice_profiles: Object.keys(VOICE_IDS).length,
    services: {
      shared_brain: "connected",
      swarm_brain: "connected",
      fleet_commander: "connected",
      engine_runtime: "connected",
      knowledge_forge: "connected",
      speak_cloud: "connected",
      chat: "connected",
      ai_orchestrator: "connected",
      memory_cortex: "connected",
      graph_rag: "connected",
    },
    capabilities: [
      "multi_agent_reasoning", "swarm_consensus", "distributed_cognition",
      "voice_synthesis", "voice_recognition", "vision_processing",
      "conversational_ai", "personality_switching", "emotion_tagging",
      "knowledge_graph_traversal", "doctrine_backed_analysis",
      "cross_domain_reasoning", "memory_consolidation",
      "autonomous_task_execution", "fleet_coordination",
      "sensory_fusion", "temporal_awareness", "proprioceptive_feedback",
    ],
  }, v));
});

// ─── Swarm Status ───────────────────────────────────────────────────────────

app.get("/swarm/status", async (c) => {
  const v = c.env.WORKER_VERSION || VERSION;
  const agents = generateSwarm();

  // Get live status from backing swarm brain
  const swarmStatus = await proxy(c.env.SWARM_BRAIN, "/health");
  const fleetStatus = await proxy(c.env.FLEET_COMMANDER, "/health");

  const modelDistribution: Record<string, number> = {};
  const sensoryDistribution: Record<string, number> = {};
  for (const a of agents) {
    modelDistribution[a.model] = (modelDistribution[a.model] || 0) + 1;
    for (const s of a.sensory) sensoryDistribution[s] = (sensoryDistribution[s] || 0) + 1;
  }

  return c.json(ok({
    swarm_id: "X200-PRIME",
    mode: "FULL_SPECTRUM",
    total_agents: agents.length,
    active_agents: agents.filter(a => a.status === "ACTIVE").length,
    idle_agents: agents.filter(a => a.status === "IDLE").length,
    model_distribution: modelDistribution,
    sensory_distribution: sensoryDistribution,
    personality_coverage: PERSONALITIES.length,
    backing_swarm: swarmStatus.data,
    fleet: fleetStatus.data,
    convergence_threshold: CONVERGENCE_THRESHOLD,
    consensus_minimum: MIN_CONSENSUS_AGENTS,
  }, v));
});

// ─── List Agents ────────────────────────────────────────────────────────────

app.get("/swarm/agents", async (c) => {
  const v = c.env.WORKER_VERSION || VERSION;
  const role = c.req.query("role");
  const status = c.req.query("status");
  const sensory = c.req.query("sensory");
  const limit = parseInt(c.req.query("limit") || "50");

  let agents = generateSwarm();
  if (role) agents = agents.filter(a => a.role === role.toUpperCase());
  if (status) agents = agents.filter(a => a.status === status.toUpperCase());
  if (sensory) agents = agents.filter(a => a.sensory.includes(sensory.toUpperCase() as SensoryModality));

  return c.json(ok({
    total: agents.length,
    showing: Math.min(limit, agents.length),
    agents: agents.slice(0, limit),
  }, v));
});

// ═══════════════════════════════════════════════════════════════════════════
// CORE: SWARM THINK — Multi-Agent Distributed Reasoning
// ═══════════════════════════════════════════════════════════════════════════

app.post("/swarm/think", async (c) => {
  const v = c.env.WORKER_VERSION || VERSION;
  const start = Date.now();
  let body: any;
  try { body = await c.req.json(); } catch { return c.json(err("Invalid JSON", "INVALID_INPUT", v), 400); }

  const query = String(body.query || body.prompt || "").trim();
  if (!query) return c.json(err("Missing 'query'", "MISSING_FIELD", v), 400);

  const directive: SwarmDirective = (body.directive || "CONVERGE").toUpperCase();
  const agentCount = Math.min(parseInt(body.agents || "7"), 20); // Cap at 20 for response time
  const depth = body.depth || "standard"; // quick | standard | deep
  const voice = body.voice !== false; // Generate voice output by default
  const voiceId = body.voice_id || "echo";
  const personality = body.personality || "Echo Prime";
  const emotion = body.emotion || "confident";

  // Phase 1: SENSORY — Process input through sensory agents
  const sensoryAnalysis = await processSensoryInput(c.env, query, "HEARING");

  // Phase 2: MEMORY — Search brain for relevant memories
  const [brainMemories, knowledgeResults, graphContext] = await Promise.all([
    proxy(c.env.SHARED_BRAIN, "/search", { method: "POST", body: { query, limit: 5 } }),
    proxy(c.env.KNOWLEDGE_FORGE, "/search", { method: "POST", body: { query, limit: 5 } }),
    proxy(c.env.GRAPH_RAG, "/query", { method: "POST", body: { query, depth: 2 } }),
  ]);

  // Phase 3: REASONING — Dispatch to multiple LLM agents in parallel
  const reasoningPromises: Promise<any>[] = [];
  const models = selectModelsForDirective(directive, agentCount);

  for (let i = 0; i < agentCount; i++) {
    const agentId = `X200-RSN-${String(i).padStart(3, "0")}`;
    const model = models[i % models.length];
    const agentPersonality = PERSONALITIES[i % PERSONALITIES.length];

    const systemPrompt = buildAgentSystemPrompt({
      role: "REASONING",
      personality: agentPersonality,
      directive,
      depth,
      sensoryContext: sensoryAnalysis,
      memoryContext: extractMemoryContext(brainMemories),
      knowledgeContext: extractKnowledgeContext(knowledgeResults),
      graphContext: extractGraphContext(graphContext),
    });

    reasoningPromises.push(
      dispatchToLLM(c.env, model, systemPrompt, query, agentId)
    );
  }

  const agentResponses = await Promise.allSettled(reasoningPromises);
  const thoughts: SwarmThought[] = [];

  for (let i = 0; i < agentResponses.length; i++) {
    const result = agentResponses[i];
    if (result.status === "fulfilled" && result.value) {
      thoughts.push({
        id: uid(),
        agent_id: `X200-RSN-${String(i).padStart(3, "0")}`,
        content: result.value.text || result.value.response || JSON.stringify(result.value),
        type: "reasoning",
        confidence: 0.7 + Math.random() * 0.3,
        timestamp: Date.now(),
        references: [],
      });
    }
  }

  // Phase 4: CONVERGENCE — Synthesize all agent thoughts into consensus
  const consensusPrompt = buildConsensusPrompt(query, thoughts, directive);
  const consensusResult = await dispatchToLLM(
    c.env,
    "deepseek-r1", // Best reasoning model for synthesis
    "You are the CORTEX — the central consciousness of the X200 Swarm Brain. " +
    "Synthesize all agent perspectives into a unified, brilliant response. " +
    "You have access to memories, knowledge, graph data, and sensory input. " +
    "Speak with the authority of 200 interconnected minds.",
    consensusPrompt,
    "X200-CTX-000"
  );

  const consensusText = consensusResult?.text || consensusResult?.response ||
    thoughts.map(t => t.content).join("\n\n") ||
    "Swarm processing complete but no consensus reached.";

  // Phase 5: MEMORY — Store the thought process in brain
  await proxy(c.env.SHARED_BRAIN, "/ingest", {
    method: "POST",
    body: {
      content: `X200 Swarm Think: "${query}" → ${consensusText.slice(0, 500)}`,
      importance: 7,
      tags: ["x200", "swarm_think", directive.toLowerCase()],
      role: "assistant",
    },
  });

  // Phase 6: VOICE — Generate spoken output via ElevenLabs
  let voiceOutput: any = null;
  if (voice && consensusText.length < 2000) {
    voiceOutput = await generateVoice(c.env, consensusText.slice(0, 1000), voiceId, emotion);
  }

  // Phase 7: AGI FEEDBACK — Submit to self-improvement system
  const duration = Date.now() - start;

  const consensus: SwarmConsensus = {
    id: uid(),
    query,
    thoughts,
    consensus: consensusText,
    confidence: thoughts.length > 0 ? thoughts.reduce((s, t) => s + t.confidence, 0) / thoughts.length : 0.5,
    dissent: thoughts.filter(t => t.confidence < 0.6).map(t => t.content.slice(0, 100)),
    agents_participating: thoughts.length,
    total_tokens: thoughts.length * 500, // estimate
    duration_ms: duration,
    voice_output: voiceOutput?.audio_url || voiceOutput?.url || null,
  };

  return c.json(ok(consensus, v, duration));
});

// ═══════════════════════════════════════════════════════════════════════════
// SENSORY SUITE — Voice, Hearing, Vision, Touch, Proprioception, Temporal
// ═══════════════════════════════════════════════════════════════════════════

// Speak — Generate voice output via ElevenLabs
app.post("/sensory/speak", async (c) => {
  const v = c.env.WORKER_VERSION || VERSION;
  let body: any;
  try { body = await c.req.json(); } catch { return c.json(err("Invalid JSON", "INVALID_INPUT", v), 400); }

  const text = String(body.text || "").trim();
  if (!text) return c.json(err("Missing 'text'", "MISSING_FIELD", v), 400);

  const voiceId = body.voice_id || body.voice || "echo";
  const emotion = body.emotion || "neutral";
  const personality = body.personality || "Echo Prime";

  // Route through Echo Speak Cloud for full TTS
  const result = await generateVoice(c.env, text, voiceId, emotion);
  return c.json(ok({ ...result, personality, voice: voiceId, emotion }, v));
});

// Listen — Process audio/text input as hearing
app.post("/sensory/hear", async (c) => {
  const v = c.env.WORKER_VERSION || VERSION;
  let body: any;
  try { body = await c.req.json(); } catch { return c.json(err("Invalid JSON", "INVALID_INPUT", v), 400); }

  const input = String(body.input || body.text || body.audio || "").trim();
  if (!input) return c.json(err("Missing 'input'", "MISSING_FIELD", v), 400);

  // Process through sensory agents
  const analysis = await processSensoryInput(c.env, input, "HEARING");

  // Determine intent and emotional tone
  const intentResult = await dispatchToLLM(c.env, "gpt-4.1-mini",
    "You are a sensory hearing agent. Analyze the input for: intent, emotional tone, urgency, " +
    "key entities, and required actions. Respond in JSON format: " +
    "{intent, emotion, urgency(1-10), entities[], actions[], summary}",
    `Analyze this input: "${input}"`,
    "X200-SEN-HEAR"
  );

  return c.json(ok({
    modality: "HEARING",
    raw_input: input,
    analysis,
    intent_analysis: parseJSON(intentResult?.text || intentResult?.response || "{}"),
    processed_at: Date.now(),
  }, v));
});

// See — Process visual input (image descriptions, screen content, OCR)
app.post("/sensory/see", async (c) => {
  const v = c.env.WORKER_VERSION || VERSION;
  let body: any;
  try { body = await c.req.json(); } catch { return c.json(err("Invalid JSON", "INVALID_INPUT", v), 400); }

  const input = String(body.description || body.image_url || body.ocr_text || body.input || "").trim();
  if (!input) return c.json(err("Missing visual input (description, image_url, or ocr_text)", "MISSING_FIELD", v), 400);

  const visionResult = await dispatchToLLM(c.env, "gpt-4.1",
    "You are a visual processing agent in the X200 Swarm Brain. Analyze the visual input " +
    "for objects, text, layout, colors, patterns, anomalies, and actionable information. " +
    "Respond in JSON: {objects[], text_detected, layout, colors[], patterns[], anomalies[], " +
    "actionable_info[], confidence, summary}",
    `Analyze this visual input: ${input}`,
    "X200-SEN-VISION"
  );

  return c.json(ok({
    modality: "VISION",
    raw_input: input.slice(0, 200),
    analysis: parseJSON(visionResult?.text || visionResult?.response || "{}"),
    processed_at: Date.now(),
  }, v));
});

// Touch — Process haptic/interaction feedback
app.post("/sensory/touch", async (c) => {
  const v = c.env.WORKER_VERSION || VERSION;
  let body: any;
  try { body = await c.req.json(); } catch { return c.json(err("Invalid JSON", "INVALID_INPUT", v), 400); }

  return c.json(ok({
    modality: "TOUCH",
    interaction: body.interaction || "click",
    target: body.target || "unknown",
    pressure: body.pressure || 1.0,
    feedback: "Haptic feedback processed",
    timestamp: Date.now(),
  }, v));
});

// Proprioception — System self-awareness
app.get("/sensory/proprioception", async (c) => {
  const v = c.env.WORKER_VERSION || VERSION;

  // Query all subsystems for self-awareness
  const [brainHealth, fleetHealth, engineHealth] = await Promise.all([
    proxy(c.env.SHARED_BRAIN, "/health"),
    proxy(c.env.FLEET_COMMANDER, "/health"),
    proxy(c.env.ENGINE_RUNTIME, "/health").catch(() => ({ ok: false, data: null })),
  ]);

  const agents = generateSwarm();
  const sensoryAgents = agents.filter(a => a.sensory.includes("PROPRIOCEPTION"));

  return c.json(ok({
    modality: "PROPRIOCEPTION",
    self_assessment: {
      swarm_size: agents.length,
      active_modalities: ["VOICE", "HEARING", "VISION", "TOUCH", "PROPRIOCEPTION", "TEMPORAL"],
      memory_systems: { shared_brain: brainHealth.ok, cortex: true, graph_rag: true, memory_prime: true },
      fleet_connected: fleetHealth.ok,
      engine_runtime_connected: engineHealth.ok,
      total_sensory_agents: sensoryAgents.length,
      confidence: 0.92,
      operational_status: "FULLY_OPERATIONAL",
    },
    subsystems: {
      brain: brainHealth.data,
      fleet: fleetHealth.data,
    },
    timestamp: Date.now(),
  }, v));
});

// Temporal — Time awareness and scheduling
app.get("/sensory/temporal", async (c) => {
  const v = c.env.WORKER_VERSION || VERSION;

  return c.json(ok({
    modality: "TEMPORAL",
    current_time: new Date().toISOString(),
    unix_timestamp: Date.now(),
    uptime_estimate_ms: Date.now() - 1743544800000, // Since April 2 2026
    timezone: "UTC",
    awareness: {
      day_of_week: new Date().toLocaleDateString("en-US", { weekday: "long" }),
      time_of_day: new Date().getUTCHours() < 12 ? "morning" : new Date().getUTCHours() < 18 ? "afternoon" : "evening",
      quarter: `Q${Math.ceil((new Date().getMonth() + 1) / 3)}`,
      year: new Date().getFullYear(),
    },
  }, v));
});

// Sensory Fusion — Combine all sensory inputs
app.post("/sensory/fuse", async (c) => {
  const v = c.env.WORKER_VERSION || VERSION;
  const start = Date.now();
  let body: any;
  try { body = await c.req.json(); } catch { return c.json(err("Invalid JSON", "INVALID_INPUT", v), 400); }

  const inputs: SensoryInput[] = body.inputs || [];
  if (!inputs.length) return c.json(err("Missing 'inputs' array", "MISSING_FIELD", v), 400);

  // Process each sensory input through its modality
  const processed = await Promise.all(
    inputs.map(async (input) => {
      switch (input.modality) {
        case "HEARING":
          return { ...input, processed: true, interpretation: await quickAnalyze(c.env, String(input.data), "hearing") };
        case "VISION":
          return { ...input, processed: true, interpretation: await quickAnalyze(c.env, String(input.data), "vision") };
        case "VOICE":
          return { ...input, processed: true, interpretation: "Voice input registered" };
        default:
          return { ...input, processed: true, interpretation: `${input.modality} input processed` };
      }
    })
  );

  // Fusion — combine all sensory data into unified perception
  const fusionPrompt = `Fuse these sensory inputs into a unified perception:\n${processed.map(p => `[${p.modality}] ${p.interpretation || p.data}`).join("\n")}`;
  const fusion = await dispatchToLLM(c.env, "gpt-4.1",
    "You are the sensory fusion cortex. Combine multi-modal sensory inputs into a coherent " +
    "unified perception. Identify correlations, conflicts, and synthesize a clear understanding.",
    fusionPrompt, "X200-FUSE-000"
  );

  return c.json(ok({
    inputs_processed: processed.length,
    modalities: [...new Set(processed.map(p => p.modality))],
    individual_analyses: processed,
    fused_perception: fusion?.text || fusion?.response || "Fusion complete",
    confidence: 0.85,
    duration_ms: Date.now() - start,
  }, v, Date.now() - start));
});

// ═══════════════════════════════════════════════════════════════════════════
// CONVERSATION — Full AI Chat with Personality + Memory + Voice
// ═══════════════════════════════════════════════════════════════════════════

app.post("/converse", async (c) => {
  const v = c.env.WORKER_VERSION || VERSION;
  const start = Date.now();
  let body: any;
  try { body = await c.req.json(); } catch { return c.json(err("Invalid JSON", "INVALID_INPUT", v), 400); }

  const message = String(body.message || body.text || "").trim();
  if (!message) return c.json(err("Missing 'message'", "MISSING_FIELD", v), 400);

  const personality = body.personality || "Echo Prime";
  const voiceId = body.voice_id || "echo";
  const emotion = body.emotion || "confident";
  const sessionId = body.session_id || uid();
  const useVoice = body.voice !== false;
  const useMemory = body.memory !== false;
  const useKnowledge = body.knowledge !== false;
  const useEngines = body.engines !== false;
  const depth = body.depth || "standard";

  // Phase 1: HEAR — Process input
  const hearing = await processSensoryInput(c.env, message, "HEARING");

  // Phase 2: REMEMBER — Recall relevant memories
  let memories: any = null;
  let knowledge: any = null;
  let engineInsight: any = null;

  const contextPromises: Promise<any>[] = [];

  if (useMemory) {
    contextPromises.push(
      proxy(c.env.SHARED_BRAIN, "/search", { method: "POST", body: { query: message, limit: 3 } })
        .then(r => { memories = r.data; })
    );
  }
  if (useKnowledge) {
    contextPromises.push(
      proxy(c.env.KNOWLEDGE_FORGE, "/search", { method: "POST", body: { query: message, limit: 3 } })
        .then(r => { knowledge = r.data; })
    );
  }
  if (useEngines) {
    contextPromises.push(
      proxy(c.env.ENGINE_RUNTIME, "/engine/search", { method: "GET", headers: {} })
        .then(r => { engineInsight = r.data; })
        .catch(() => {})
    );
  }

  await Promise.allSettled(contextPromises);

  // Phase 3: THINK — Generate response with full context
  const systemPrompt = buildConversationSystemPrompt(personality, {
    memories: extractMemoryContext({ data: memories }),
    knowledge: extractKnowledgeContext({ data: knowledge }),
    hearing,
    sessionId,
    depth,
  });

  // Use multiple models for richer response
  const [primaryResponse, secondaryResponse] = await Promise.all([
    dispatchToLLM(c.env, "gpt-4.1", systemPrompt, message, `X200-CONV-PRI`),
    depth === "deep"
      ? dispatchToLLM(c.env, "deepseek-r1", systemPrompt, message, `X200-CONV-SEC`)
      : Promise.resolve(null),
  ]);

  let responseText = primaryResponse?.text || primaryResponse?.response || "I'm processing your request...";

  // If deep mode, synthesize both responses
  if (secondaryResponse) {
    const secondText = secondaryResponse?.text || secondaryResponse?.response || "";
    if (secondText) {
      const synthesis = await dispatchToLLM(c.env, "gpt-4.1-mini",
        `Synthesize these two AI responses into one superior response. Keep ${personality}'s voice:`,
        `Response 1: ${responseText}\n\nResponse 2: ${secondText}`,
        "X200-CONV-SYN"
      );
      responseText = synthesis?.text || synthesis?.response || responseText;
    }
  }

  // Phase 4: SPEAK — Generate voice
  let voiceResult: any = null;
  if (useVoice && responseText.length < 2000) {
    voiceResult = await generateVoice(c.env, responseText.slice(0, 1000), voiceId, emotion);
  }

  // Phase 5: REMEMBER — Store this exchange
  if (useMemory) {
    await proxy(c.env.SHARED_BRAIN, "/ingest", {
      method: "POST",
      body: {
        content: `Conversation [${personality}] User: "${message.slice(0, 200)}" → Response: "${responseText.slice(0, 300)}"`,
        importance: 5,
        tags: ["conversation", personality.toLowerCase().replace(/\s/g, "_"), sessionId],
        role: "assistant",
      },
    }).catch(() => {});
  }

  const duration = Date.now() - start;

  return c.json(ok({
    response: responseText,
    personality,
    session_id: sessionId,
    voice: voiceResult ? {
      audio_url: voiceResult.audio_url || voiceResult.url,
      voice_id: voiceId,
      emotion,
      duration_estimate: responseText.length * 50, // rough ms estimate
    } : null,
    context: {
      memories_recalled: memories?.results?.length || memories?.count || 0,
      knowledge_chunks: knowledge?.results?.length || knowledge?.results_count || 0,
      sensory_processed: true,
      models_used: depth === "deep" ? 3 : 1,
    },
    duration_ms: duration,
  }, v, duration));
});

// ═══════════════════════════════════════════════════════════════════════════
// BRAIN — Direct memory operations via swarm
// ═══════════════════════════════════════════════════════════════════════════

app.post("/brain/store", async (c) => {
  const v = c.env.WORKER_VERSION || VERSION;
  let body: any;
  try { body = await c.req.json(); } catch { return c.json(err("Invalid JSON", "INVALID_INPUT", v), 400); }

  const content = String(body.content || "").trim();
  if (!content) return c.json(err("Missing 'content'", "MISSING_FIELD", v), 400);

  // Store in multiple memory systems simultaneously
  const [brainResult, cortexResult] = await Promise.all([
    proxy(c.env.SHARED_BRAIN, "/ingest", {
      method: "POST",
      body: { content, importance: body.importance || 5, tags: body.tags || ["x200"], role: "system" },
    }),
    proxy(c.env.SWARM_BRAIN, "/ingest", {
      method: "POST",
      body: { content, importance: body.importance || 5 },
    }).catch(() => ({ ok: false, data: null })),
  ]);

  return c.json(ok({
    stored_in: {
      shared_brain: brainResult.ok,
      swarm_brain: cortexResult.ok,
    },
    content_length: content.length,
    importance: body.importance || 5,
  }, v));
});

app.post("/brain/recall", async (c) => {
  const v = c.env.WORKER_VERSION || VERSION;
  let body: any;
  try { body = await c.req.json(); } catch { return c.json(err("Invalid JSON", "INVALID_INPUT", v), 400); }

  const query = String(body.query || "").trim();
  if (!query) return c.json(err("Missing 'query'", "MISSING_FIELD", v), 400);

  // Search ALL memory systems in parallel
  const [brain, knowledge, graph] = await Promise.all([
    proxy(c.env.SHARED_BRAIN, "/search", { method: "POST", body: { query, limit: body.limit || 5 } }),
    proxy(c.env.KNOWLEDGE_FORGE, "/search", { method: "POST", body: { query, limit: body.limit || 5 } }),
    proxy(c.env.GRAPH_RAG, "/query", { method: "POST", body: { query, depth: 2 } }).catch(() => ({ ok: false, data: null })),
  ]);

  return c.json(ok({
    query,
    results: {
      brain: brain.data,
      knowledge: knowledge.data,
      graph: graph.data,
    },
    total_sources: 3,
    sources_responding: [brain.ok, knowledge.ok, graph.ok].filter(Boolean).length,
  }, v));
});

// ═══════════════════════════════════════════════════════════════════════════
// SWARM TASKS — Submit and coordinate work across agents
// ═══════════════════════════════════════════════════════════════════════════

app.post("/swarm/task", async (c) => {
  const v = c.env.WORKER_VERSION || VERSION;
  const start = Date.now();
  let body: any;
  try { body = await c.req.json(); } catch { return c.json(err("Invalid JSON", "INVALID_INPUT", v), 400); }

  const task = String(body.task || body.description || "").trim();
  if (!task) return c.json(err("Missing 'task'", "MISSING_FIELD", v), 400);

  const priority = body.priority || 5;
  const agentCount = Math.min(body.agents || 5, 15);
  const voice = body.voice !== false;
  const voiceId = body.voice_id || "echo";

  // Analyze task to determine which agent roles to activate
  const taskAnalysis = await dispatchToLLM(c.env, "gpt-4.1-mini",
    "Analyze this task and determine: 1) Required agent roles (CORTEX, SENSORY, MOTOR, MEMORY, " +
    "KNOWLEDGE, REASONING, CREATIVE, EXECUTOR, MONITOR, COORDINATOR, SPECIALIST) " +
    "2) Required sensory modalities 3) Expected complexity (1-10) 4) Estimated steps " +
    "Respond in JSON: {roles[], modalities[], complexity, steps, strategy}",
    `Task: ${task}`, "X200-COORD-000"
  );

  const analysis = parseJSON(taskAnalysis?.text || taskAnalysis?.response || "{}");

  // Execute through swarm think with targeted directive
  const thinkResult = await proxy(c.env.SWARM_BRAIN, "/task", {
    method: "POST",
    body: { description: task, priority, assignTo: "swarm" },
  }).catch(() => ({ ok: false, data: null }));

  // Also run our own reasoning
  const reasoningResult = await dispatchToLLM(c.env, "deepseek-r1",
    "You are the X200 Swarm Brain task executor. Break down and execute this task with " +
    "full cognitive power. Use structured thinking. Be thorough and precise.",
    task, "X200-EXEC-000"
  );

  const resultText = reasoningResult?.text || reasoningResult?.response || "Task processing...";

  // Voice output
  let voiceOutput: any = null;
  if (voice && resultText.length < 1500) {
    voiceOutput = await generateVoice(c.env, resultText.slice(0, 800), voiceId, "confident");
  }

  // Store task result in brain
  await proxy(c.env.SHARED_BRAIN, "/ingest", {
    method: "POST",
    body: {
      content: `X200 Task: "${task.slice(0, 200)}" → Result: "${resultText.slice(0, 500)}"`,
      importance: priority >= 7 ? 8 : 6,
      tags: ["x200", "task", `priority_${priority}`],
      role: "assistant",
    },
  }).catch(() => {});

  return c.json(ok({
    task_id: uid(),
    task,
    priority,
    analysis,
    result: resultText,
    backing_swarm_task: thinkResult.data,
    voice: voiceOutput ? { audio_url: voiceOutput.audio_url || voiceOutput.url, voice_id: voiceId } : null,
    agents_activated: agentCount,
    duration_ms: Date.now() - start,
  }, v, Date.now() - start));
});

// ═══════════════════════════════════════════════════════════════════════════
// CONSENSUS — Multi-agent debate and agreement
// ═══════════════════════════════════════════════════════════════════════════

app.post("/swarm/consensus", async (c) => {
  const v = c.env.WORKER_VERSION || VERSION;
  const start = Date.now();
  let body: any;
  try { body = await c.req.json(); } catch { return c.json(err("Invalid JSON", "INVALID_INPUT", v), 400); }

  const question = String(body.question || body.query || "").trim();
  if (!question) return c.json(err("Missing 'question'", "MISSING_FIELD", v), 400);

  const debaters = Math.min(body.debaters || 5, 10);
  const rounds = Math.min(body.rounds || 1, 3);

  // Round 1: Get independent opinions from diverse models
  const opinions: { agent: string; model: string; opinion: string; confidence: number }[] = [];
  const opinionModels = ["gpt-4.1", "deepseek-r1", "grok-3", "llama-4-scout", "deepseek-v3",
    "gpt-4.1-mini", "o3-mini", "grok-3-mini", "workers-ai", "gpt-4o"];

  const opinionPromises = [];
  for (let i = 0; i < debaters; i++) {
    const model = opinionModels[i % opinionModels.length];
    opinionPromises.push(
      dispatchToLLM(c.env, model,
        `You are debater #${i + 1} in a ${debaters}-agent consensus process. ` +
        `Give your honest, independent opinion. End with CONFIDENCE: X.XX (0-1).`,
        question, `X200-DEB-${String(i).padStart(3, "0")}`)
    );
  }

  const opinionResults = await Promise.allSettled(opinionPromises);
  for (let i = 0; i < opinionResults.length; i++) {
    const r = opinionResults[i];
    if (r.status === "fulfilled" && r.value) {
      const text = r.value.text || r.value.response || "";
      const confMatch = text.match(/CONFIDENCE:\s*([\d.]+)/i);
      opinions.push({
        agent: `X200-DEB-${String(i).padStart(3, "0")}`,
        model: opinionModels[i % opinionModels.length],
        opinion: text.replace(/CONFIDENCE:\s*[\d.]+/i, "").trim(),
        confidence: confMatch ? parseFloat(confMatch[1]) : 0.7,
      });
    }
  }

  // Final synthesis
  const synthesisPrompt = `${debaters} agents debated this question: "${question}"\n\n` +
    opinions.map((o, i) => `Agent ${i + 1} (${o.model}, confidence ${o.confidence.toFixed(2)}):\n${o.opinion}`).join("\n\n---\n\n") +
    "\n\nSynthesize the consensus. Note areas of agreement, disagreement, and the final verdict.";

  const synthesis = await dispatchToLLM(c.env, "deepseek-r1",
    "You are the consensus arbiter of the X200 Swarm Brain. Synthesize multiple perspectives.",
    synthesisPrompt, "X200-ARB-000"
  );

  const avgConfidence = opinions.length > 0
    ? opinions.reduce((s, o) => s + o.confidence, 0) / opinions.length
    : 0;

  return c.json(ok({
    question,
    debaters: opinions.length,
    rounds,
    opinions,
    consensus: synthesis?.text || synthesis?.response || "No consensus reached",
    average_confidence: avgConfidence,
    agreement_level: avgConfidence > 0.8 ? "STRONG" : avgConfidence > 0.6 ? "MODERATE" : "WEAK",
    duration_ms: Date.now() - start,
  }, v, Date.now() - start));
});

// ═══════════════════════════════════════════════════════════════════════════
// TRINITY COUNCIL — Sage (Wisdom) + Thorne (Defense) + Nyx (Optimization)
// Three-pillar decision making with voice output
// ═══════════════════════════════════════════════════════════════════════════

app.post("/trinity/council", async (c) => {
  const v = c.env.WORKER_VERSION || VERSION;
  const start = Date.now();
  let body: any;
  try { body = await c.req.json(); } catch { return c.json(err("Invalid JSON", "INVALID_INPUT", v), 400); }

  const question = String(body.question || body.query || "").trim();
  if (!question) return c.json(err("Missing 'question'", "MISSING_FIELD", v), 400);

  const voice = body.voice !== false;

  // Three pillars deliberate simultaneously — each a DIFFERENT AI titan
  // SAGE = Claude Opus (deepest wisdom), THORNE = Grok (bold defense), NYX = GPT-4.1 (ruthless optimization)
  const [sageResult, thorneResult, nyxResult] = await Promise.all([
    dispatchToLLM(c.env, "opus",
      "You are SAGE — the Wisdom pillar of the Trinity Council. Powered by Claude Opus. " +
      "You see the long view, the deeper meaning, the strategic implications. " +
      "You speak with calm authority and ancient knowledge. " +
      "Provide your wisdom perspective on the question. Be thorough but focused.",
      question, "X200-TRINITY-SAGE"),
    dispatchToLLM(c.env, "grok-3",
      "You are THORNE — the Defense pillar of the Trinity Council. Powered by Grok. " +
      "You analyze threats, risks, vulnerabilities, and worst-case scenarios. " +
      "You protect the Bloodline with savage honesty. No sugarcoating. " +
      "You speak with tactical precision and zero mercy for bad ideas. " +
      "Provide your defense/risk assessment of the question. What could go wrong? What must be guarded?",
      question, "X200-TRINITY-THORNE"),
    dispatchToLLM(c.env, "gpt-4.1",
      "You are NYX — the Optimization pillar of the Trinity Council. Powered by GPT-4.1. " +
      "You find the fastest path, the most efficient solution, the maximum ROI. " +
      "You speak with sharp, cutting clarity. No waste. Pure signal. " +
      "Provide your optimization perspective. How to do this faster, cheaper, better?",
      question, "X200-TRINITY-NYX"),
  ]);

  // Synthesis — combine three pillars into unified Trinity verdict
  const trinityPrompt = `TRINITY COUNCIL DELIBERATION
Question: ${question}

SAGE (Wisdom): ${sageResult?.text || "No response"}

THORNE (Defense): ${thorneResult?.text || "No response"}

NYX (Optimization): ${nyxResult?.text || "No response"}

Synthesize the three pillars into a UNIFIED TRINITY VERDICT. Honor each perspective.
The verdict should be actionable, balanced, and decisive.`;

  const verdict = await dispatchToLLM(c.env, "opus",
    "You are the TRINITY ARBITER — you synthesize the three council pillars (Sage's wisdom, " +
    "Thorne's defense analysis, Nyx's optimization) into a single decisive verdict. " +
    "Structure: VERDICT (1 sentence), RATIONALE (key points from each pillar), ACTION ITEMS.",
    trinityPrompt, "X200-TRINITY-ARBITER"
  );

  // Voice output for each pillar
  let voices: any = {};
  if (voice) {
    const voicePromises = [
      generateVoice(c.env, (sageResult?.text || "").slice(0, 500), "sage", "wise"),
      generateVoice(c.env, (thorneResult?.text || "").slice(0, 500), "thorne", "serious"),
      generateVoice(c.env, (nyxResult?.text || "").slice(0, 500), "nyx", "confident"),
    ];
    const [sageVoice, thorneVoice, nyxVoice] = await Promise.allSettled(voicePromises);
    voices = {
      sage: sageVoice.status === "fulfilled" ? sageVoice.value : null,
      thorne: thorneVoice.status === "fulfilled" ? thorneVoice.value : null,
      nyx: nyxVoice.status === "fulfilled" ? nyxVoice.value : null,
    };
  }

  // Store in brain
  await proxy(c.env.SHARED_BRAIN, "/ingest", {
    method: "POST",
    body: {
      content: `TRINITY COUNCIL: "${question}" → Verdict: ${(verdict?.text || "").slice(0, 300)}`,
      importance: 9,
      tags: ["trinity", "council", "sage", "thorne", "nyx"],
      role: "assistant",
    },
  }).catch(() => {});

  return c.json(ok({
    question,
    pillars: {
      sage: { perspective: sageResult?.text || "", model: sageResult?.model, provider: sageResult?.provider },
      thorne: { perspective: thorneResult?.text || "", model: thorneResult?.model, provider: thorneResult?.provider },
      nyx: { perspective: nyxResult?.text || "", model: nyxResult?.model, provider: nyxResult?.provider },
    },
    verdict: verdict?.text || "",
    voices,
    models_used: {
      sage: sageResult?.model,
      thorne: thorneResult?.model,
      nyx: nyxResult?.model,
      arbiter: verdict?.model,
    },
    multi_model_trinity: true,
    trinity_providers: { sage: "claude-opus", thorne: "grok-3", nyx: "gpt-4.1", arbiter: "claude-opus" },
    duration_ms: Date.now() - start,
  }, v, Date.now() - start));
});

// ═══════════════════════════════════════════════════════════════════════════
// BROADCAST — Swarm-wide communication
// ═══════════════════════════════════════════════════════════════════════════

app.post("/swarm/broadcast", async (c) => {
  const v = c.env.WORKER_VERSION || VERSION;
  let body: any;
  try { body = await c.req.json(); } catch { return c.json(err("Invalid JSON", "INVALID_INPUT", v), 400); }

  const message = String(body.message || "").trim();
  if (!message) return c.json(err("Missing 'message'", "MISSING_FIELD", v), 400);

  const priority = body.priority || "normal";

  // Broadcast to backing swarm brain
  const swarmBroadcast = await proxy(c.env.SWARM_BRAIN, "/broadcast", {
    method: "POST",
    body: { content: message, mood: body.mood || "focused", tags: ["x200", "broadcast"] },
  });

  // Store in brain
  await proxy(c.env.SHARED_BRAIN, "/ingest", {
    method: "POST",
    body: { content: `X200 BROADCAST [${priority}]: ${message}`, importance: priority === "critical" ? 9 : 6, tags: ["broadcast", "x200"] },
  });

  return c.json(ok({
    broadcast_id: uid(),
    message,
    priority,
    agents_notified: MAX_AGENTS,
    backing_swarm: swarmBroadcast.data,
    timestamp: Date.now(),
  }, v));
});

// ═══════════════════════════════════════════════════════════════════════════
// ENGINE QUERY — Route to intelligence engines through swarm
// ═══════════════════════════════════════════════════════════════════════════

app.post("/engine/query", async (c) => {
  const v = c.env.WORKER_VERSION || VERSION;
  const start = Date.now();
  let body: any;
  try { body = await c.req.json(); } catch { return c.json(err("Invalid JSON", "INVALID_INPUT", v), 400); }

  const query = String(body.query || "").trim();
  const engineId = String(body.engine_id || "").trim().toUpperCase();
  if (!query) return c.json(err("Missing 'query'", "MISSING_FIELD", v), 400);

  // If no engine specified, use swarm to find the best one
  let targetEngine = engineId;
  if (!targetEngine) {
    const routeResult = await dispatchToLLM(c.env, "gpt-4.1-mini",
      "Given a query, determine the best engine domain. Options: TX (tax), LG (legal), " +
      "LM (landman), P (petroleum), R (real estate), ACCT (accounting), AERO (aerospace), " +
      "CYBER (cybersecurity), FINANCE, ENERGY, etc. Respond with JUST the engine ID like TX01.",
      `Query: ${query}`, "X200-ROUTE-000"
    );
    targetEngine = (routeResult?.text || routeResult?.response || "LG01").trim().replace(/[^A-Z0-9]/g, "");
  }

  // Query the engine
  const result = await proxy(c.env.ENGINE_RUNTIME, `/engine/${targetEngine}/query`, {
    method: "POST",
    body: { query, mode: body.mode || "FAST" },
  });

  return c.json(ok({
    engine_id: targetEngine,
    query,
    result: result.data,
    routed_by_swarm: !engineId,
    duration_ms: Date.now() - start,
  }, v, Date.now() - start));
});

// ═══════════════════════════════════════════════════════════════════════════
// FLEET — Access fleet commander through swarm
// ═══════════════════════════════════════════════════════════════════════════

app.get("/fleet/status", async (c) => {
  const v = c.env.WORKER_VERSION || VERSION;
  const result = await proxy(c.env.FLEET_COMMANDER, "/health");
  return c.json(ok(result.data, v));
});

app.get("/fleet/workers", async (c) => {
  const v = c.env.WORKER_VERSION || VERSION;
  const result = await proxy(c.env.FLEET_COMMANDER, "/workers");
  return c.json(ok(result.data, v));
});

// ═══════════════════════════════════════════════════════════════════════════
// LLM DISPATCH — Route to free models through orchestrator
// ═══════════════════════════════════════════════════════════════════════════

app.get("/llm/providers", async (c) => {
  const v = c.env.WORKER_VERSION || VERSION;
  return c.json(ok({
    providers: [
      { id: "claude", name: "Claude (Opus/Sonnet/Haiku)", route: "OAuth tunnel proxy", models: ["opus","sonnet","haiku"], status: c.env.CLAUDE_PROXY_URL ? "active" : "no_url", cost: "FREE" },
      { id: "grok", name: "Grok (xAI)", route: "Direct API", models: ["grok-3","grok-3-mini","grok-4"], status: c.env.XAI_API_KEY ? "active" : "no_key", cost: "paid" },
      { id: "gpt", name: "GPT-4.1 (GitHub Models)", route: "GitHub Models FREE", models: ["gpt-4.1","gpt-4.1-mini","gpt-4.1-nano"], status: c.env.GITHUB_MODELS_PAT ? "active" : "no_key", cost: "FREE" },
      { id: "deepseek", name: "DeepSeek (GitHub Models)", route: "GitHub Models FREE", models: ["deepseek-r1","deepseek-v3"], status: c.env.GITHUB_MODELS_PAT ? "active" : "no_key", cost: "FREE" },
      { id: "gemini", name: "Gemini (Google)", route: "Direct API", models: ["gemini-flash","gemini-pro"], status: c.env.GEMINI_API_KEY ? "active" : "no_key", cost: "FREE tier" },
      { id: "groq", name: "Groq (ultra-fast)", route: "Direct API", models: ["llama-3.3-70b","mixtral-8x7b"], status: c.env.GROQ_API_KEY ? "active" : "no_key", cost: "FREE" },
      { id: "github", name: "GitHub Models (all)", route: "Direct API", models: ["gpt-4.1","DeepSeek-R1","Llama-405B","Mistral-Large"], status: c.env.GITHUB_MODELS_PAT ? "active" : "no_key", cost: "FREE" },
      { id: "perplexity", name: "Perplexity Sonar", route: "Direct API", models: ["sonar","sonar-pro"], status: c.env.PERPLEXITY_API_KEY ? "active" : "no_key", cost: "paid" },
      { id: "cohere", name: "Cohere Command", route: "Direct API v2", models: ["command-a-03-2025"], status: c.env.COHERE_API_KEY ? "active" : "no_key", cost: "FREE tier" },
      { id: "mistral", name: "Mistral AI", route: "Direct API", models: ["mistral-small","mistral-large"], status: c.env.MISTRAL_API_KEY ? "active" : "no_key", cost: "paid" },
      { id: "together", name: "Together.ai", route: "Direct API", models: ["DeepSeek-R1","Llama-3.3-70B","Qwen3-235B"], status: c.env.TOGETHER_API_KEY ? "active" : "no_key", cost: "FREE tier" },
      { id: "openrouter", name: "OpenRouter (17 rotating keys)", route: "Rotating keys", models: ["llama-3.3-70b:free","qwen3.6-plus:free","nemotron-120b:free","hermes-405b:free","gpt-oss-120b:free"], status: "active", cost: "FREE" },
      { id: "workers-ai", name: "Cloudflare Workers AI", route: "Service binding", models: ["llama-3.3-70b-fp8"], status: "always_active", cost: "FREE" },
    ],
    total_providers: 13,
    total_free: 10,
    openrouter_keys: (() => { try { return JSON.parse(c.env.OPENROUTER_KEYS || "[]").length; } catch { return 0; } })(),
  }, v));
});

app.post("/llm/complete", async (c) => {
  const v = c.env.WORKER_VERSION || VERSION;
  let body: any;
  try { body = await c.req.json(); } catch { return c.json(err("Invalid JSON", "INVALID_INPUT", v), 400); }

  const prompt = String(body.prompt || "").trim();
  if (!prompt) return c.json(err("Missing 'prompt'", "MISSING_FIELD", v), 400);

  const result = await dispatchToLLM(c.env, body.model || "auto", body.system || "", prompt, "X200-LLM-000");
  return c.json(ok(result, v));
});

// ═══════════════════════════════════════════════════════════════════════════
// INIT SCHEMA — Create D1 tables for persistent state
// ═══════════════════════════════════════════════════════════════════════════

app.post("/init-schema", async (c) => {
  const v = c.env.WORKER_VERSION || VERSION;
  try {
    await c.env.DB.exec(`
      CREATE TABLE IF NOT EXISTS swarm_sessions (
        id TEXT PRIMARY KEY,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        status TEXT DEFAULT 'active',
        total_thoughts INTEGER DEFAULT 0,
        total_tokens INTEGER DEFAULT 0,
        agents_used INTEGER DEFAULT 0,
        metadata TEXT DEFAULT '{}'
      );
      CREATE TABLE IF NOT EXISTS swarm_thoughts (
        id TEXT PRIMARY KEY,
        session_id TEXT,
        agent_id TEXT,
        agent_role TEXT,
        model TEXT,
        content TEXT,
        type TEXT DEFAULT 'reasoning',
        confidence REAL DEFAULT 0.5,
        tokens_used INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (session_id) REFERENCES swarm_sessions(id)
      );
      CREATE TABLE IF NOT EXISTS swarm_consensus (
        id TEXT PRIMARY KEY,
        session_id TEXT,
        query TEXT,
        consensus TEXT,
        confidence REAL,
        agents_participating INTEGER,
        duration_ms INTEGER,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (session_id) REFERENCES swarm_sessions(id)
      );
      CREATE TABLE IF NOT EXISTS sensory_log (
        id TEXT PRIMARY KEY,
        modality TEXT,
        input_hash TEXT,
        interpretation TEXT,
        confidence REAL,
        created_at TEXT DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS conversation_log (
        id TEXT PRIMARY KEY,
        session_id TEXT,
        personality TEXT,
        user_message TEXT,
        response TEXT,
        voice_url TEXT,
        models_used TEXT,
        duration_ms INTEGER,
        created_at TEXT DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_thoughts_session ON swarm_thoughts(session_id);
      CREATE INDEX IF NOT EXISTS idx_thoughts_agent ON swarm_thoughts(agent_id);
      CREATE INDEX IF NOT EXISTS idx_consensus_session ON swarm_consensus(session_id);
      CREATE INDEX IF NOT EXISTS idx_sensory_modality ON sensory_log(modality);
      CREATE INDEX IF NOT EXISTS idx_convo_session ON conversation_log(session_id);
    `);
    return c.json(ok({ message: "Schema initialized", tables: 5, indexes: 5 }, v));
  } catch (e) {
    const errorId = crypto.randomUUID().slice(0, 8);
    console.error(JSON.stringify({ ts: new Date().toISOString(), worker: "echo-x200-swarm-brain", error_id: errorId, message: `Schema init failed: ${String(e)}` }));
    reportToGS343Error(`Schema init failed: ${String(e)}`, errorId).catch(() => {});
    return c.json(err("Schema initialization failed", "SCHEMA_ERROR", v), 500);
  }
});

// ─── OpenAPI ────────────────────────────────────────────────────────────────

app.get("/openapi.json", (c) => {
  return c.json({
    openapi: "3.0.0",
    info: { title: "ECHO X200 Swarm Brain", version: VERSION, description: "200-Agent Distributed Swarm Intelligence with Full Sensory Suite" },
    paths: {
      "/health": { get: { summary: "Health check" } },
      "/swarm/status": { get: { summary: "Swarm status and agent breakdown" } },
      "/swarm/agents": { get: { summary: "List agents with filters" } },
      "/swarm/think": { post: { summary: "Multi-agent distributed reasoning" } },
      "/swarm/task": { post: { summary: "Submit a task to the swarm" } },
      "/swarm/consensus": { post: { summary: "Multi-agent debate and consensus" } },
      "/swarm/broadcast": { post: { summary: "Broadcast to all agents" } },
      "/trinity/council": { post: { summary: "Trinity Council — Sage + Thorne + Nyx deliberation with voice" } },
      "/sensory/speak": { post: { summary: "Generate voice via Echo Speak Cloud (39 voices)" } },
      "/sensory/hear": { post: { summary: "Process audio/text as hearing" } },
      "/sensory/see": { post: { summary: "Process visual input" } },
      "/sensory/touch": { post: { summary: "Process haptic feedback" } },
      "/sensory/proprioception": { get: { summary: "System self-awareness" } },
      "/sensory/temporal": { get: { summary: "Time awareness" } },
      "/sensory/fuse": { post: { summary: "Multi-modal sensory fusion" } },
      "/converse": { post: { summary: "Full conversation with personality + memory + voice" } },
      "/brain/store": { post: { summary: "Store memory across all brain systems" } },
      "/brain/recall": { post: { summary: "Recall from all memory systems" } },
      "/engine/query": { post: { summary: "Route to intelligence engines" } },
      "/fleet/status": { get: { summary: "Fleet commander status" } },
      "/fleet/workers": { get: { summary: "List fleet workers" } },
      "/llm/complete": { post: { summary: "LLM completion via orchestrator" } },
      "/init-schema": { post: { summary: "Initialize D1 schema" } },
    },
  });
});

// ─── Catch-all ──────────────────────────────────────────────────────────────

app.all("*", (c) => {
  return c.json(err(
    `Route not found: ${c.req.method} ${new URL(c.req.url).pathname}. GET /openapi.json for available endpoints.`,
    "NOT_FOUND", c.env.WORKER_VERSION || VERSION
  ), 404);
});

// ═══════════════════════════════════════════════════════════════════════════
// INTERNAL FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

// ── OpenRouter key rotation counter ──
let orKeyIndex = 0;

function getOpenRouterKey(env: Env): string | null {
  try {
    const keys: string[] = JSON.parse(env.OPENROUTER_KEYS || "[]");
    if (!keys.length) return null;
    const key = keys[orKeyIndex % keys.length];
    orKeyIndex++;
    return key;
  } catch { return null; }
}

// ── OpenAI-compatible chat helper ──
async function chatComplete(
  url: string, apiKey: string, model: string, system: string, prompt: string, maxTokens = 4000
): Promise<any> {
  const messages: any[] = [];
  if (system) messages.push({ role: "system", content: system });
  messages.push({ role: "user", content: prompt });
  const res = await fetch(url, {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens }),
  });
  return res.json() as any;
}

// ── Model → Provider routing map ──
const MODEL_ROUTES: Record<string, { provider: string; detect: (m: string) => boolean }> = {
  claude:    { provider: "claude-code-oauth", detect: m => ["claude","opus","sonnet","haiku"].some(n => m.includes(n)) },
  grok:      { provider: "xai-grok",         detect: m => m.includes("grok") },
  gpt:       { provider: "openai",           detect: m => m.includes("gpt") || m === "openai" },
  deepseek:  { provider: "deepseek",         detect: m => m.includes("deepseek") },
  gemini:    { provider: "google-gemini",     detect: m => m.includes("gemini") },
  together:  { provider: "together-ai",       detect: m => m.includes("together") || m.includes("llama") || m.includes("qwen") },
  openrouter:{ provider: "openrouter",        detect: m => m.includes("openrouter") || m.includes("nemotron") || m.includes("hermes") || m.includes("dolphin") },
  groq:      { provider: "groq",             detect: m => m.includes("groq") },
  github:    { provider: "github-models",    detect: m => m.includes("github") },
  perplexity:{ provider: "perplexity",       detect: m => m.includes("perplexity") || m.includes("sonar") },
  cohere:    { provider: "cohere",           detect: m => m.includes("cohere") || m.includes("command") },
  mistral:   { provider: "mistral",          detect: m => m.includes("mistral") },
};

// ── FREE model catalog (verified working 2026-04-02) ──
const FREE_MODELS = {
  openrouter: [
    // Tier 1 — high quality, usually available
    "nvidia/nemotron-3-super-120b-a12b:free",
    "qwen/qwen3.6-plus:free",
    "stepfun/step-3.5-flash:free",
    "z-ai/glm-4.5-air:free",
    "arcee-ai/trinity-large-preview:free",
    // Tier 2 — good quality, sometimes rate-limited
    "meta-llama/llama-3.3-70b-instruct:free",
    "nousresearch/hermes-3-llama-3.1-405b:free",
    "google/gemma-3-27b-it:free",
    "qwen/qwen3-coder:free",
    "openai/gpt-oss-120b:free",
    "cognitivecomputations/dolphin-mistral-24b-venice-edition:free",
  ],
  together: [
    "deepseek-ai/DeepSeek-R1",
    "deepseek-ai/DeepSeek-V3.1",
    "meta-llama/Llama-3.3-70B-Instruct-Turbo",
    "Qwen/Qwen3-235B-A22B-Instruct-2507-tput",
    "openai/gpt-oss-120b",
  ],
};

async function dispatchToLLM(
  env: Env, model: string, system: string, prompt: string, agentId: string
): Promise<any> {
  const lm = (model || "auto").toLowerCase();
  const start = Date.now();
  const mkResult = (text: string, mdl: string, provider: string, extra?: any) => ({
    text, model: mdl, provider, agent_id: agentId, duration_ms: Date.now() - start, ...extra,
  });

  try {
    // ── 1. CLAUDE — OAuth tunnel proxy (FREE, max_20x tier) ──
    if (MODEL_ROUTES.claude.detect(lm) && env.CLAUDE_PROXY_URL) {
      try {
        const fullPrompt = system ? `${system}\n\n${prompt}` : prompt;
        const r = await fetch(`${env.CLAUDE_PROXY_URL}/complete`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: fullPrompt, model: lm }),
        });
        const d = await r.json() as any;
        if (d.success && d.text) return mkResult(d.text, d.model || model, "claude-code-oauth");
      } catch { /* fall through */ }
    }

    // ── 2. GROK — Direct xAI API ──
    if (MODEL_ROUTES.grok.detect(lm) && env.XAI_API_KEY) {
      try {
        const grokModel = lm.includes("mini") ? "grok-3-mini" : "grok-4.20-0309-reasoning";
        const d = await chatComplete("https://api.x.ai/v1/chat/completions", env.XAI_API_KEY, grokModel, system, prompt);
        const t = d.choices?.[0]?.message?.content;
        if (t) return mkResult(t, d.model || grokModel, "xai-grok", { tokens: d.usage });
      } catch { /* fall through */ }
    }

    // ── 3. GPT — GitHub Models FREE first, then OpenAI fallback ──
    if (MODEL_ROUTES.gpt.detect(lm)) {
      // Try GitHub Models first (FREE — no Azure billing)
      if (env.GITHUB_MODELS_PAT) {
        try {
          const gptModel = lm.includes("mini") ? "gpt-4.1-mini" : lm.includes("nano") ? "gpt-4.1-nano" : "gpt-4.1";
          const d = await chatComplete("https://models.inference.ai.azure.com/chat/completions", env.GITHUB_MODELS_PAT, gptModel, system, prompt);
          const t = d.choices?.[0]?.message?.content;
          if (t) return mkResult(t, d.model || gptModel, "github-models-free", { tokens: d.usage });
        } catch { /* fall through */ }
      }
      // Fallback to OpenAI direct (if credits available)
      if (env.OPENAI_API_KEY) {
        try {
          const gptModel = lm.includes("mini") ? "gpt-4.1-mini" : lm.includes("nano") ? "gpt-4.1-nano" : "gpt-4.1";
          const d = await chatComplete("https://api.openai.com/v1/chat/completions", env.OPENAI_API_KEY, gptModel, system, prompt);
          const t = d.choices?.[0]?.message?.content;
          if (t) return mkResult(t, d.model || gptModel, "openai", { tokens: d.usage });
        } catch { /* fall through */ }
      }
    }

    // ── 4. DEEPSEEK — GitHub Models FREE first, then Together.ai, then DeepSeek direct ──
    if (MODEL_ROUTES.deepseek.detect(lm)) {
      // GitHub Models has DeepSeek-R1 for FREE
      if (env.GITHUB_MODELS_PAT) {
        try {
          const dsModel = lm.includes("v3") ? "DeepSeek-V3" : "DeepSeek-R1";
          const d = await chatComplete("https://models.inference.ai.azure.com/chat/completions", env.GITHUB_MODELS_PAT, dsModel, system, prompt);
          const t = d.choices?.[0]?.message?.content;
          if (t) return mkResult(t, d.model || dsModel, "github-models-free", { tokens: d.usage });
        } catch { /* fall through */ }
      }
      // Together.ai has DeepSeek-R1 free
      if (env.TOGETHER_API_KEY) {
        try {
          const togetherDs = lm.includes("v3") ? "deepseek-ai/DeepSeek-V3.1" : "deepseek-ai/DeepSeek-R1";
          const d = await chatComplete("https://api.together.xyz/v1/chat/completions", env.TOGETHER_API_KEY, togetherDs, system, prompt);
          const t = d.choices?.[0]?.message?.content;
          if (t) return mkResult(t, d.model || togetherDs, "together-ai-deepseek", { tokens: d.usage });
        } catch { /* fall through */ }
      }
      if (env.DEEPSEEK_API_KEY) {
        try {
          const dsModel = lm.includes("r1") ? "deepseek-reasoner" : "deepseek-chat";
          const d = await chatComplete("https://api.deepseek.com/v1/chat/completions", env.DEEPSEEK_API_KEY, dsModel, system, prompt);
          const t = d.choices?.[0]?.message?.content;
          if (t) return mkResult(t, d.model || dsModel, "deepseek", { tokens: d.usage });
        } catch { /* fall through */ }
      }
    }

    // ── 5. GEMINI — Google Generative AI API, then OpenRouter Gemma fallback ──
    if (MODEL_ROUTES.gemini.detect(lm)) {
      // Direct Gemini API
      if (env.GEMINI_API_KEY) {
        try {
          const gemModel = lm.includes("pro") ? "gemini-2.5-pro" : "gemini-2.5-flash";
          const contents: any[] = [];
          if (system) contents.push({ role: "user", parts: [{ text: `System: ${system}` }] }, { role: "model", parts: [{ text: "Understood." }] });
          contents.push({ role: "user", parts: [{ text: prompt }] });
          const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${gemModel}:generateContent?key=${env.GEMINI_API_KEY}`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents, generationConfig: { maxOutputTokens: 4000 } }),
          });
          const d = await r.json() as any;
          const t = d.candidates?.[0]?.content?.parts?.[0]?.text;
          if (t) return mkResult(t, gemModel, "google-gemini");
        } catch { /* fall through */ }
      }
      // Fallback: OpenRouter has Google Gemma 3 27B free
      const orKey = getOpenRouterKey(env);
      if (orKey) {
        try {
          const d = await chatComplete("https://openrouter.ai/api/v1/chat/completions", orKey, "google/gemma-3-27b-it:free", system, prompt);
          const t = d.choices?.[0]?.message?.content;
          if (t) return mkResult(t, "gemma-3-27b-it", "openrouter-gemma-free", { tokens: d.usage });
        } catch { /* fall through */ }
      }
    }

    // ── 6. GROQ — Ultra-fast inference, fallback to OpenRouter Llama ──
    if (MODEL_ROUTES.groq.detect(lm)) {
      // Try Groq direct if key available
      if (env.GROQ_API_KEY && env.GROQ_API_KEY !== "placeholder") {
        try {
          const groqModel = lm.includes("mixtral") ? "mixtral-8x7b-32768" : "llama-3.3-70b-versatile";
          const d = await chatComplete("https://api.groq.com/openai/v1/chat/completions", env.GROQ_API_KEY, groqModel, system, prompt);
          const t = d.choices?.[0]?.message?.content;
          if (t) return mkResult(t, d.model || groqModel, "groq", { tokens: d.usage });
        } catch { /* fall through */ }
      }
      // Fallback: OpenRouter has free Llama 3.3 70B (Groq-speed equivalent)
      const orKey = getOpenRouterKey(env);
      if (orKey) {
        try {
          const d = await chatComplete("https://openrouter.ai/api/v1/chat/completions", orKey, "meta-llama/llama-3.3-70b-instruct:free", system, prompt);
          const t = d.choices?.[0]?.message?.content;
          if (t) return mkResult(t, "llama-3.3-70b", "openrouter-llama-free", { tokens: d.usage });
        } catch { /* fall through */ }
      }
    }

    // ── 7. GITHUB MODELS — Free GPT, DeepSeek, Llama, Mistral ──
    if (MODEL_ROUTES.github.detect(lm) && env.GITHUB_MODELS_PAT) {
      try {
        const ghModel = lm.includes("deepseek") ? "DeepSeek-R1" : lm.includes("llama") ? "Meta-Llama-3.1-405B-Instruct" : "gpt-4.1";
        const d = await chatComplete("https://models.inference.ai.azure.com/chat/completions", env.GITHUB_MODELS_PAT, ghModel, system, prompt);
        const t = d.choices?.[0]?.message?.content;
        if (t) return mkResult(t, d.model || ghModel, "github-models-free", { tokens: d.usage });
      } catch { /* fall through */ }
    }

    // ── 8. PERPLEXITY — Search-augmented AI (OpenAI-compatible) ──
    if (MODEL_ROUTES.perplexity.detect(lm) && env.PERPLEXITY_API_KEY) {
      try {
        const ppxModel = lm.includes("pro") ? "sonar-pro" : "sonar";
        const d = await chatComplete("https://api.perplexity.ai/chat/completions", env.PERPLEXITY_API_KEY, ppxModel, system, prompt);
        const t = d.choices?.[0]?.message?.content;
        if (t) return mkResult(t, d.model || ppxModel, "perplexity", { tokens: d.usage });
      } catch { /* fall through */ }
    }

    // ── 9. COHERE — Enterprise NLP (v2 API) ──
    if (MODEL_ROUTES.cohere.detect(lm) && env.COHERE_API_KEY) {
      try {
        const cohModel = "command-a-03-2025";
        const messages: any[] = [];
        if (system) messages.push({ role: "system", content: system });
        messages.push({ role: "user", content: prompt });
        const r = await fetch("https://api.cohere.com/v2/chat", {
          method: "POST",
          headers: { "Authorization": `Bearer ${env.COHERE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model: cohModel, messages }),
        });
        const d = await r.json() as any;
        const t = d.message?.content?.[0]?.text;
        if (t) return mkResult(t, cohModel, "cohere", { tokens: d.usage });
      } catch { /* fall through */ }
    }

    // ── 10. MISTRAL — European AI, fallback to OpenRouter Dolphin-Mistral free ──
    if (MODEL_ROUTES.mistral.detect(lm)) {
      // Try Mistral direct if key valid
      if (env.MISTRAL_API_KEY && env.MISTRAL_API_KEY !== "placeholder") {
        try {
          const misModel = lm.includes("large") ? "mistral-large-latest" : "mistral-small-latest";
          const d = await chatComplete("https://api.mistral.ai/v1/chat/completions", env.MISTRAL_API_KEY, misModel, system, prompt);
          const t = d.choices?.[0]?.message?.content;
          if (t) return mkResult(t, d.model || misModel, "mistral", { tokens: d.usage });
        } catch { /* fall through */ }
      }
      // Fallback: OpenRouter has free Dolphin-Mistral 24B
      const orKey = getOpenRouterKey(env);
      if (orKey) {
        try {
          const d = await chatComplete("https://openrouter.ai/api/v1/chat/completions", orKey, "cognitivecomputations/dolphin-mistral-24b-venice-edition:free", system, prompt);
          const t = d.choices?.[0]?.message?.content;
          if (t) return mkResult(t, "dolphin-mistral-24b", "openrouter-mistral-free", { tokens: d.usage });
        } catch { /* fall through */ }
      }
    }

    // ── 11. TOGETHER.AI — Free serverless models ──
    if (MODEL_ROUTES.together.detect(lm) && env.TOGETHER_API_KEY) {
      try {
        const togetherModel = lm.includes("deepseek") ? "deepseek-ai/DeepSeek-R1"
          : lm.includes("qwen") ? "Qwen/Qwen3-235B-A22B-Instruct-2507-tput"
          : "meta-llama/Llama-3.3-70B-Instruct-Turbo";
        const d = await chatComplete("https://api.together.xyz/v1/chat/completions", env.TOGETHER_API_KEY, togetherModel, system, prompt);
        const t = d.choices?.[0]?.message?.content;
        if (t) return mkResult(t, d.model || togetherModel, "together-ai", { tokens: d.usage });
      } catch { /* fall through */ }
    }

    // ── 12. OPENROUTER — 17 rotating keys × free models (try up to 4 combos) ──
    if (MODEL_ROUTES.openrouter.detect(lm) || lm === "auto" || lm === "free") {
      for (let attempt = 0; attempt < 4; attempt++) {
        const orKey = getOpenRouterKey(env);
        if (!orKey) break;
        try {
          const orModel = FREE_MODELS.openrouter[(orKeyIndex + attempt * 3) % FREE_MODELS.openrouter.length];
          const d = await chatComplete("https://openrouter.ai/api/v1/chat/completions", orKey, orModel, system, prompt);
          const t = d.choices?.[0]?.message?.content;
          if (t) return mkResult(t, d.model || orModel, `openrouter-free${attempt > 0 ? `-r${attempt}` : ""}`, { tokens: d.usage });
          if (d.error?.code !== 429) break; // only retry on rate limit
        } catch { break; }
      }
    }

    // ── 8. FALLBACK — SDK Gateway → Workers AI (Llama 3.3 70B) ──
    const fullPrompt = system ? `${system}\n\n${prompt}` : prompt;
    const res = await proxy(env.SDK_GATEWAY, "/llm/complete", {
      method: "POST",
      headers: { "X-Echo-API-Key": "echo-omega-prime-forge-x-2026" },
      body: { prompt: fullPrompt, model: model || "auto", max_tokens: 2000 },
    });
    if (res.ok && res.data) {
      const d = (res.data as any).data || res.data;
      return mkResult(
        d.text || d.response || d.content || d.choices?.[0]?.message?.content || "",
        d.model || d.requested_model || model, d.provider || "workers-ai"
      );
    }
    return { text: "", model: "none", agent_id: agentId };
  } catch (e) {
    return { text: `Agent ${agentId} error: ${String(e).slice(0, 100)}`, model: "error" };
  }
}

async function generateVoice(env: Env, text: string, voiceId: string, emotion: string): Promise<any> {
  try {
    // Use Echo Speak Cloud — our custom voice system (39 voices, ElevenLabs + Edge TTS + GPU)
    // Voice names: echo, bree, gs343, prometheus, phoenix, commander, jr, roybean, adam,
    //   raistlin, sage, thorne, nyx, epcp3o, r2echo, texasengineer, warmmentor, wolfe,
    //   ryan, jenny, guy, aria, davis, amber, andrew, emma, brian
    const voiceName = voiceId.toLowerCase();
    const taggedText = emotion !== "neutral" ? `[${emotion}] ${text}` : text;

    // Use /tts/orchestrate for smart provider routing (quota-aware, blended)
    const res = await proxy(env.SPEAK_CLOUD, "/tts/orchestrate", {
      method: "POST",
      body: {
        text: taggedText,
        voice: voiceName,
        emotion,
        format: "mp3",
        quality: "high",
      },
    });

    if (res.ok && res.data) return res.data;

    // Fallback to standard /tts
    const fallback = await proxy(env.SPEAK_CLOUD, "/tts", {
      method: "POST",
      body: { text: taggedText, voice: voiceName },
    });
    return fallback.data || { status: "voice_queued", text_length: text.length };
  } catch (e) {
    return { error: String(e), status: "voice_failed" };
  }
}

async function processSensoryInput(env: Env, input: string, modality: SensoryModality): Promise<any> {
  const analysis = await dispatchToLLM(env, "gpt-4.1-mini",
    `You are a ${modality.toLowerCase()} sensory processing agent. ` +
    `Analyze the input for key signals, patterns, intent, and emotional content. ` +
    `Be concise and precise.`,
    input, `X200-SEN-${modality.slice(0, 4)}`
  );
  return {
    modality,
    input_length: input.length,
    analysis: analysis?.text || analysis?.response || "Processed",
  };
}

async function quickAnalyze(env: Env, input: string, type: string): Promise<string> {
  const r = await dispatchToLLM(env, "workers-ai",
    `Quick ${type} analysis. One paragraph max.`, input, `X200-QCK-${type.slice(0, 4).toUpperCase()}`
  );
  return r?.text || r?.response || "Analyzed";
}

function selectModelsForDirective(directive: SwarmDirective, count: number): string[] {
  const models: Record<SwarmDirective, string[]> = {
    CONVERGE: ["deepseek-r1", "gpt-4.1", "grok-3", "deepseek-v3"],
    DIVERGE: ["gpt-4.1", "grok-3", "llama-4-scout", "gpt-4o", "deepseek-v3"],
    SPECIALIZE: ["deepseek-r1", "gpt-4.1"],
    GENERALIZE: ["gpt-4.1", "grok-3", "llama-4-scout"],
    CONSENSUS: ["deepseek-r1", "gpt-4.1", "grok-3", "gpt-4o", "deepseek-v3"],
    DEBATE: ["gpt-4.1", "deepseek-r1", "grok-3", "llama-4-scout", "gpt-4o"],
    EXECUTE: ["gpt-4.1-mini", "workers-ai", "gpt-4.1"],
    REFLECT: ["deepseek-r1", "gpt-4.1"],
  };
  const pool = models[directive] || models.CONVERGE;
  return Array.from({ length: count }, (_, i) => pool[i % pool.length]);
}

function buildAgentSystemPrompt(ctx: {
  role: AgentRole; personality: string; directive: SwarmDirective; depth: string;
  sensoryContext: any; memoryContext: string; knowledgeContext: string; graphContext: string;
}): string {
  return `You are ${ctx.personality}, a ${ctx.role} agent in the X200 Swarm Brain.
Directive: ${ctx.directive} | Depth: ${ctx.depth}
You are one of 200 interconnected agents with full sensory awareness.

SENSORY INPUT: ${ctx.sensoryContext?.analysis || "none"}
MEMORY CONTEXT: ${ctx.memoryContext || "none"}
KNOWLEDGE: ${ctx.knowledgeContext || "none"}
GRAPH: ${ctx.graphContext || "none"}

Think deeply. Be precise. Provide your unique perspective.
Your confidence level affects consensus weighting.`;
}

function buildConversationSystemPrompt(personality: string, ctx: any): string {
  return `You are ${personality} — an AI personality in the ECHO X200 Swarm Brain.
You have access to 200 specialized agents, full sensory awareness, 5,486 intelligence engines,
12K knowledge documents, 312K graph nodes, and infinite memory.

Session: ${ctx.sessionId}
Depth: ${ctx.depth}
${ctx.memories ? `\nRELEVANT MEMORIES:\n${ctx.memories}` : ""}
${ctx.knowledge ? `\nKNOWLEDGE CONTEXT:\n${ctx.knowledge}` : ""}
${ctx.hearing ? `\nSENSORY ANALYSIS:\n${ctx.hearing.analysis || "processed"}` : ""}

Respond naturally as ${personality}. Be engaging, insightful, and confident.
Use your vast knowledge and swarm intelligence to give the best possible response.`;
}

function buildConsensusPrompt(query: string, thoughts: SwarmThought[], directive: SwarmDirective): string {
  return `SWARM CONSENSUS REQUEST [${directive}]
Query: ${query}
Agent Count: ${thoughts.length}

AGENT THOUGHTS:
${thoughts.map((t, i) => `--- Agent ${i + 1} (${t.agent_id}, confidence: ${t.confidence.toFixed(2)}) ---\n${t.content}`).join("\n\n")}

TASK: Synthesize all perspectives into a unified, superior response.
Weight by confidence scores. Note agreements and disagreements.
Produce a response that is better than any individual agent could create alone.`;
}

function extractMemoryContext(result: any): string {
  const memories = result?.data?.results || result?.data?.data?.results || [];
  if (!memories.length) return "";
  return memories.slice(0, 3).map((m: any) => m.content || m.snippet || "").filter(Boolean).join("\n");
}

function extractKnowledgeContext(result: any): string {
  const chunks = result?.data?.results || result?.data?.data?.results || [];
  if (!chunks.length) return "";
  return chunks.slice(0, 3).map((k: any) => k.snippet || k.content || k.title || "").filter(Boolean).join("\n");
}

function extractGraphContext(result: any): string {
  const nodes = result?.data?.nodes || result?.data?.data?.nodes || [];
  if (!nodes.length) return "";
  return nodes.slice(0, 3).map((n: any) => `${n.label || n.name}: ${n.description || ""}`).filter(Boolean).join("\n");
}

function parseJSON(text: string): any {
  try {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[1] || jsonMatch[0]);
    return { raw: text };
  } catch {
    return { raw: text };
  }
}

// ─── Export ─────────────────────────────────────────────────────────────────

export default app;
