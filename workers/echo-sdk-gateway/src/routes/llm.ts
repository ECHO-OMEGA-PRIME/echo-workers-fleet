/**
 * Echo SDK Gateway — LLM routing layer.
 *
 * Claude-first LLM gateway proxying to the AI Orchestrator worker
 * with auto-model selection, streaming support, and health checks.
 *
 * Routes:
 *   POST /llm/claude    — Route to Claude API (primary)
 *   POST /llm/complete  — Auto-route to best available LLM
 *   GET  /llm/models    — List available models
 *   GET  /llm/status    — LLM provider health
 */

import { Hono } from 'hono';
import type { Env, LLMCompleteRequest } from '../types';
import { success, error } from '../utils/envelope';
import { proxyBinding, log } from '../utils/proxy';

// ---------------------------------------------------------------------------
// Claude model registry
// ---------------------------------------------------------------------------

interface ModelEntry {
  id: string;
  name: string;
  provider: 'anthropic' | 'workers-ai';
  context_window: number;
  max_output: number;
  tier: 'fast' | 'balanced' | 'complex';
  description: string;
}

const CLAUDE_MODELS: ModelEntry[] = [
  {
    id: 'claude-haiku-4-5',
    name: 'Claude Haiku 4.5',
    provider: 'anthropic',
    context_window: 200000,
    max_output: 8192,
    tier: 'fast',
    description: 'Fastest Claude model — ideal for classification, short answers, and high-throughput tasks.',
  },
  {
    id: 'claude-sonnet-4-6',
    name: 'Claude Sonnet 4.6',
    provider: 'anthropic',
    context_window: 200000,
    max_output: 16384,
    tier: 'balanced',
    description: 'Default balanced model — strong reasoning with good speed for most tasks.',
  },
  {
    id: 'claude-opus-4-6',
    name: 'Claude Opus 4.6',
    provider: 'anthropic',
    context_window: 200000,
    max_output: 32768,
    tier: 'complex',
    description: 'Most capable Claude model — deep reasoning, complex analysis, and long-form generation.',
  },
];

// Workers AI models — FREE, unlimited, built into Cloudflare. Used as fallback.
const WORKERS_AI_MODELS: ModelEntry[] = [
  {
    id: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
    name: 'Llama 3.3 70B (Workers AI)',
    provider: 'workers-ai',
    context_window: 131072,
    max_output: 4096,
    tier: 'balanced',
    description: 'Meta Llama 3.3 70B via Cloudflare Workers AI — free, fast, no API key needed.',
  },
  {
    id: '@cf/meta/llama-3.1-8b-instruct',
    name: 'Llama 3.1 8B (Workers AI)',
    provider: 'workers-ai',
    context_window: 32768,
    max_output: 4096,
    tier: 'fast',
    description: 'Meta Llama 3.1 8B via Workers AI — ultra-fast for simple tasks.',
  },
];

const DEFAULT_MODEL = 'claude-sonnet-4-6';

// ---------------------------------------------------------------------------
// Helper — transform to OpenAI chat completions format for AI Orchestrator
// ---------------------------------------------------------------------------

function buildChatPayload(req: LLMCompleteRequest, resolvedModel: string) {
  const messages: Array<{ role: string; content: string }> = [];

  if (req.system) {
    messages.push({ role: 'system', content: req.system });
  }
  messages.push({ role: 'user', content: req.prompt });

  return {
    model: resolvedModel,
    messages,
    max_tokens: req.max_tokens ?? 4096,
    temperature: req.temperature ?? 0.7,
    stream: req.stream ?? false,
  };
}

// ---------------------------------------------------------------------------
// Helper — auto-select model based on prompt characteristics
// ---------------------------------------------------------------------------

function autoSelectModel(req: LLMCompleteRequest): string {
  if (req.model) {
    // Explicit model requested — honour it
    if (req.model === 'opus' || req.model === 'claude-opus-4-6') return 'claude-opus-4-6';
    if (req.model === 'haiku' || req.model === 'claude-haiku-4-5') return 'claude-haiku-4-5';
    if (req.model === 'sonnet' || req.model === 'claude-sonnet-4-6') return 'claude-sonnet-4-6';
    // Workers AI model aliases
    if (req.model === 'llama' || req.model === 'llama-70b' || req.model === 'workers-ai') return '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
    if (req.model === 'llama-8b') return '@cf/meta/llama-3.1-8b-instruct';
    // Pass through non-Claude model identifiers as-is (AI Orchestrator handles 29+ models)
    return req.model;
  }

  const promptLen = req.prompt.length;

  // Long prompts likely need deep reasoning
  if (promptLen > 2000) return 'claude-opus-4-6';

  // Short prompts are fine with the fast model
  if (promptLen < 200) return 'claude-haiku-4-5';

  // Default balanced
  return 'claude-sonnet-4-6';
}

// ---------------------------------------------------------------------------
// Helper — Workers AI fallback (free, unlimited, always available)
// ---------------------------------------------------------------------------

async function workersAiFallback(
  ai: Ai,
  messages: Array<{ role: string; content: string }>,
  model: string,
  maxTokens: number,
): Promise<{ ok: boolean; text: string; model: string; fallback: true }> {
  // Pick the best Workers AI model
  const aiModel = model.startsWith('@cf/')
    ? model
    : '@cf/meta/llama-3.3-70b-instruct-fp8-fast';

  const result = await ai.run(aiModel as BaseAiTextGenerationModels, {
    messages: messages as Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    max_tokens: maxTokens,
  });

  // Workers AI returns { response: string } for non-streaming
  const text = typeof result === 'string'
    ? result
    : (result as Record<string, unknown>).response as string || JSON.stringify(result);

  return { ok: true, text, model: aiModel, fallback: true };
}

// ---------------------------------------------------------------------------
// LLM route module
// ---------------------------------------------------------------------------

const llm = new Hono<{ Bindings: Env }>();

// ---------------------------------------------------------------------------
// GET /llm/models — List available models
// (static route BEFORE parameterized to avoid Hono matching issues)
// ---------------------------------------------------------------------------
llm.get('/models', async (c) => {
  const version = c.env.WORKER_VERSION || '1.0.0';
  const start = Date.now();

  log('info', 'llm.models', 'Listing available LLM models');

  // Attempt to fetch AI Orchestrator model list for the full catalog
  let orchestratorModels: unknown[] = [];
  try {
    const res = await proxyBinding(c.env.ECHO_AI_ORCHESTRATOR, '/v1/models', {
      method: 'GET',
      headers: { 'X-Echo-API-Key': c.env.API_KEY || c.env.ECHO_API_KEY || '' },
    });
    if (res.ok && typeof res.data === 'object' && res.data !== null) {
      const d = res.data as Record<string, unknown>;
      orchestratorModels = Array.isArray(d.data) ? d.data : Array.isArray(d.models) ? d.models : [];
    }
  } catch (e) {
    log('warn', 'llm.models', `Failed to fetch orchestrator models: ${String(e).slice(0, 200)}`);
  }

  const total_ms = Date.now() - start;

  return c.json(
    success(
      {
        claude_models: CLAUDE_MODELS,
        workers_ai_models: WORKERS_AI_MODELS,
        orchestrator_models: orchestratorModels,
        default_model: DEFAULT_MODEL,
        total_claude: CLAUDE_MODELS.length,
        total_workers_ai: WORKERS_AI_MODELS.length,
        total_orchestrator: orchestratorModels.length,
      },
      version,
      total_ms,
    ),
  );
});

// ---------------------------------------------------------------------------
// GET /llm/status — LLM provider health
// ---------------------------------------------------------------------------
llm.get('/status', async (c) => {
  const version = c.env.WORKER_VERSION || '1.0.0';
  const start = Date.now();

  log('info', 'llm.status', 'Checking AI Orchestrator health');

  let orchestratorStatus: { healthy: boolean; data?: unknown; error?: string; latency_ms: number } = {
    healthy: false,
    latency_ms: 0,
  };

  try {
    const res = await proxyBinding(c.env.ECHO_AI_ORCHESTRATOR, '/health', {
      method: 'GET',
    });
    orchestratorStatus = {
      healthy: res.ok,
      data: res.data,
      latency_ms: res.latency_ms,
    };
  } catch (e) {
    orchestratorStatus = {
      healthy: false,
      error: String(e).slice(0, 200),
      latency_ms: Date.now() - start,
    };
  }

  const total_ms = Date.now() - start;

  return c.json(
    success(
      {
        provider: 'echo-ai-orchestrator',
        orchestrator: orchestratorStatus,
        claude_models_available: CLAUDE_MODELS.length,
        default_model: DEFAULT_MODEL,
      },
      version,
      total_ms,
    ),
  );
});

// ---------------------------------------------------------------------------
// POST /llm/claude — Route to Claude API (primary)
// ---------------------------------------------------------------------------
llm.post('/claude', async (c) => {
  const version = c.env.WORKER_VERSION || '1.0.0';
  const start = Date.now();

  let body: LLMCompleteRequest;
  try {
    body = await c.req.json<LLMCompleteRequest>();
  } catch {
    return c.json(error('Request body must be valid JSON', 'ECHO_INVALID_INPUT', version), 400);
  }

  if (!body.prompt || typeof body.prompt !== 'string' || body.prompt.trim().length === 0) {
    return c.json(error("Missing or empty 'prompt' field", 'ECHO_MISSING_FIELD', version), 400);
  }

  // Resolve model — default to sonnet, validate Claude models
  let resolvedModel = body.model || DEFAULT_MODEL;
  const validClaudeIds = CLAUDE_MODELS.map((m) => m.id);
  if (!validClaudeIds.includes(resolvedModel)) {
    // Allow short aliases
    if (resolvedModel === 'opus') resolvedModel = 'claude-opus-4-6';
    else if (resolvedModel === 'haiku') resolvedModel = 'claude-haiku-4-5';
    else if (resolvedModel === 'sonnet') resolvedModel = 'claude-sonnet-4-6';
    else {
      return c.json(
        error(
          `Invalid Claude model '${resolvedModel}'. Valid: ${validClaudeIds.join(', ')}`,
          'ECHO_INVALID_MODEL',
          version,
        ),
        400,
      );
    }
  }

  const payload = buildChatPayload(body, resolvedModel);

  log('info', 'llm.claude', `Claude request: model=${resolvedModel}, prompt_len=${body.prompt.length}, stream=${!!body.stream}`, {
    model: resolvedModel,
    prompt_length: body.prompt.length,
    stream: !!body.stream,
  });

  try {
    // Streaming response — proxy SSE directly
    if (body.stream) {
      const binding = c.env.ECHO_AI_ORCHESTRATOR;
      const resp = await binding.fetch('https://internal/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Echo-API-Key': c.env.API_KEY || c.env.ECHO_API_KEY || '',
        },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const errData = await resp.text();
        log('warn', 'llm.claude', `AI Orchestrator stream error: ${resp.status}`, { response: errData.slice(0, 500) });
        return c.json(error(`LLM stream failed: ${resp.status}`, 'ECHO_LLM_ERROR', version, Date.now() - start), resp.status as 400 | 500);
      }

      log('info', 'llm.claude', 'Streaming response initiated');

      return new Response(resp.body, {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Non-streaming — use proxyBinding for structured response
    const res = await proxyBinding(c.env.ECHO_AI_ORCHESTRATOR, '/v1/chat/completions', {
      method: 'POST',
      body: payload,
      headers: { 'X-Echo-API-Key': c.env.API_KEY || c.env.ECHO_API_KEY || '' },
    });

    const total_ms = Date.now() - start;

    if (!res.ok) {
      log('warn', 'llm.claude', `AI Orchestrator returned ${res.status}`, { latency_ms: res.latency_ms });
      return c.json(error('LLM completion failed', 'ECHO_LLM_ERROR', version, total_ms), res.status as 400 | 500);
    }

    log('info', 'llm.claude', `Claude completion complete: model=${resolvedModel}`, { latency_ms: total_ms });

    return c.json(
      success(
        {
          gateway: true,
          model: resolvedModel,
          ...(typeof res.data === 'object' && res.data !== null ? (res.data as Record<string, unknown>) : { raw: res.data }),
        },
        version,
        total_ms,
      ),
    );
  } catch (e) {
    const msg = String(e);
    if (msg.includes('TimeoutError') || msg.includes('aborted')) {
      log('warn', 'llm.claude', 'Claude request timed out');
      return c.json(error('LLM request timed out', 'ECHO_TIMEOUT', version), 504);
    }
    log('error', 'llm.claude', `Claude error: ${msg.slice(0, 200)}`);
    return c.json(error(`LLM error: ${msg.slice(0, 200)}`, 'ECHO_LLM_ERROR', version), 500);
  }
});

// ---------------------------------------------------------------------------
// POST /llm/complete — Auto-route to best available LLM
// ---------------------------------------------------------------------------
llm.post('/complete', async (c) => {
  const version = c.env.WORKER_VERSION || '1.0.0';
  const start = Date.now();

  let body: LLMCompleteRequest;
  try {
    body = await c.req.json<LLMCompleteRequest>();
  } catch {
    return c.json(error('Request body must be valid JSON', 'ECHO_INVALID_INPUT', version), 400);
  }

  if (!body.prompt || typeof body.prompt !== 'string' || body.prompt.trim().length === 0) {
    return c.json(error("Missing or empty 'prompt' field", 'ECHO_MISSING_FIELD', version), 400);
  }

  const resolvedModel = autoSelectModel(body);
  const payload = buildChatPayload(body, resolvedModel);

  log('info', 'llm.complete', `Auto-selected model: ${resolvedModel}, prompt_len=${body.prompt.length}`, {
    model: resolvedModel,
    prompt_length: body.prompt.length,
    auto_selected: !body.model,
    stream: !!body.stream,
  });

  // If the model is explicitly a Workers AI model, skip orchestrator entirely
  const isWorkersAiModel = resolvedModel.startsWith('@cf/');

  try {
    // Workers AI direct path — skip orchestrator
    if (isWorkersAiModel) {
      log('info', 'llm.complete', `Workers AI direct: model=${resolvedModel}`);
      const messages = payload.messages;
      const result = await workersAiFallback(c.env.AI, messages, resolvedModel, payload.max_tokens);
      const total_ms = Date.now() - start;
      return c.json(
        success(
          {
            gateway: true,
            model: result.model,
            provider: 'workers-ai',
            auto_selected: !body.model,
            fallback: false,
            text: result.text,
            usage: { prompt_tokens: null, completion_tokens: null },
          },
          version,
          total_ms,
        ),
      );
    }

    // Streaming — try orchestrator (no Workers AI fallback for streams)
    if (body.stream) {
      const binding = c.env.ECHO_AI_ORCHESTRATOR;
      const resp = await binding.fetch('https://internal/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Echo-API-Key': c.env.API_KEY || c.env.ECHO_API_KEY || '',
        },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const errData = await resp.text();
        log('warn', 'llm.complete', `AI Orchestrator stream error: ${resp.status}, falling back to Workers AI`, { response: errData.slice(0, 500) });
        // Fallback: non-streaming Workers AI response for failed streams
        const messages = payload.messages;
        const result = await workersAiFallback(c.env.AI, messages, resolvedModel, payload.max_tokens);
        const total_ms = Date.now() - start;
        return c.json(
          success(
            {
              gateway: true,
              model: result.model,
              provider: 'workers-ai',
              auto_selected: !body.model,
              fallback: true,
              fallback_reason: `orchestrator returned ${resp.status}`,
              text: result.text,
            },
            version,
            total_ms,
          ),
        );
      }

      return new Response(resp.body, {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Non-streaming — try orchestrator first, fallback to Workers AI
    const res = await proxyBinding(c.env.ECHO_AI_ORCHESTRATOR, '/v1/chat/completions', {
      method: 'POST',
      body: payload,
      headers: { 'X-Echo-API-Key': c.env.API_KEY || c.env.ECHO_API_KEY || '' },
    });

    if (!res.ok) {
      log('warn', 'llm.complete', `AI Orchestrator returned ${res.status}, falling back to Workers AI`, { latency_ms: res.latency_ms });

      // FALLBACK: Workers AI (free, unlimited, always available)
      const messages = payload.messages;
      const result = await workersAiFallback(c.env.AI, messages, resolvedModel, payload.max_tokens);
      const total_ms = Date.now() - start;

      log('info', 'llm.complete', `Workers AI fallback succeeded: model=${result.model}`, { latency_ms: total_ms });

      return c.json(
        success(
          {
            gateway: true,
            model: result.model,
            requested_model: resolvedModel,
            provider: 'workers-ai',
            auto_selected: !body.model,
            fallback: true,
            fallback_reason: `orchestrator returned ${res.status}`,
            text: result.text,
          },
          version,
          total_ms,
        ),
      );
    }

    const total_ms = Date.now() - start;
    log('info', 'llm.complete', `Completion done: model=${resolvedModel}`, { latency_ms: total_ms });

    return c.json(
      success(
        {
          gateway: true,
          model: resolvedModel,
          provider: 'ai-orchestrator',
          auto_selected: !body.model,
          fallback: false,
          ...(typeof res.data === 'object' && res.data !== null ? (res.data as Record<string, unknown>) : { raw: res.data }),
        },
        version,
        total_ms,
      ),
    );
  } catch (e) {
    const msg = String(e);

    // Last resort: try Workers AI even on exceptions
    try {
      log('warn', 'llm.complete', `Orchestrator exception, falling back to Workers AI: ${msg.slice(0, 200)}`);
      const messages = payload.messages;
      const result = await workersAiFallback(c.env.AI, messages, resolvedModel, payload.max_tokens);
      const total_ms = Date.now() - start;
      return c.json(
        success(
          {
            gateway: true,
            model: result.model,
            provider: 'workers-ai',
            auto_selected: !body.model,
            fallback: true,
            fallback_reason: `orchestrator error: ${msg.slice(0, 100)}`,
            text: result.text,
          },
          version,
          total_ms,
        ),
      );
    } catch (fallbackErr) {
      log('error', 'llm.complete', `Both orchestrator and Workers AI failed: ${String(fallbackErr).slice(0, 200)}`);
    }

    if (msg.includes('TimeoutError') || msg.includes('aborted')) {
      log('warn', 'llm.complete', 'LLM request timed out');
      return c.json(error('LLM request timed out', 'ECHO_TIMEOUT', version), 504);
    }
    log('error', 'llm.complete', `LLM error: ${msg.slice(0, 200)}`);
    return c.json(error(`LLM error: ${msg.slice(0, 200)}`, 'ECHO_LLM_ERROR', version), 500);
  }
});

// ---------------------------------------------------------------------------
// GET /llm/providers — Alias for /llm/models (CLI compatibility)
// ---------------------------------------------------------------------------
llm.get('/providers', async (c) => {
  // Redirect internally to /models handler
  const version = c.env.WORKER_VERSION || '1.0.0';
  const start = Date.now();

  let orchestratorModels: unknown[] = [];
  try {
    const res = await proxyBinding(c.env.ECHO_AI_ORCHESTRATOR, '/v1/models', {
      method: 'GET',
      headers: { 'X-Echo-API-Key': c.env.API_KEY || c.env.ECHO_API_KEY || '' },
    });
    if (res.ok && typeof res.data === 'object' && res.data !== null) {
      const d = res.data as Record<string, unknown>;
      orchestratorModels = Array.isArray(d.data) ? d.data : Array.isArray(d.models) ? d.models : [];
    }
  } catch { /* best effort */ }

  return c.json(success({
    providers: [
      { name: 'Anthropic Claude', models: CLAUDE_MODELS.length, default: DEFAULT_MODEL },
      { name: 'AI Orchestrator', models: orchestratorModels.length, details: '29 LLM workers' },
    ],
    claude_models: CLAUDE_MODELS,
    orchestrator_models: orchestratorModels,
    total: CLAUDE_MODELS.length + orchestratorModels.length,
  }, version, Date.now() - start));
});

export default llm;
