/**
 * Echo SDK Gateway — Dynamic Proxy Passthrough Routes
 *
 * Catch-all proxy routes that forward ALL requests to backend workers
 * via service bindings. This exposes the FULL API surface of each worker
 * through the SDK Gateway without hardcoding individual endpoints.
 *
 * Pattern: /prefix/* -> service binding -> /* on the worker
 *
 * This is the fix for the "SDK only exposes 89 routes out of 500+" problem.
 * Instead of manually writing route handlers for each endpoint, we proxy
 * entire path prefixes to the appropriate worker.
 */

import { Hono } from 'hono';
import type { Env } from '../types';
import { success, error } from '../utils/envelope';

// ---------------------------------------------------------------------------
// Generic passthrough proxy factory
// ---------------------------------------------------------------------------

function createPassthrough(
  prefix: string,
  getBinding: (env: Env) => Fetcher | undefined,
  workerName: string,
) {
  const router = new Hono<{ Bindings: Env }>();

  router.all('/*', async (c) => {
    const version = c.env.WORKER_VERSION || '1.0.0';
    const binding = getBinding(c.env);

    if (!binding) {
      return c.json(
        error(`Service binding for ${workerName} not available`, 'ECHO_BINDING_MISSING', version),
        503,
      );
    }

    // Strip the prefix to get the path on the target worker
    const url = new URL(c.req.url);
    const targetPath = url.pathname.replace(new RegExp(`^/${prefix}`), '') || '/';
    const fullPath = targetPath + url.search;

    const start = Date.now();
    try {
      const fetchOpts: RequestInit = {
        method: c.req.method,
        headers: {
          'Content-Type': c.req.header('content-type') || 'application/json',
          'X-Echo-API-Key': c.env.API_KEY || c.env.ECHO_API_KEY || '',
          'X-Forwarded-By': 'echo-sdk-gateway',
        },
      };

      // Forward body for non-GET requests
      if (c.req.method !== 'GET' && c.req.method !== 'HEAD') {
        try {
          const body = await c.req.text();
          if (body) fetchOpts.body = body;
        } catch { /* no body */ }
      }

      const resp = await binding.fetch(`https://internal${fullPath}`, fetchOpts);
      const latency_ms = Date.now() - start;

      // Return the response as-is (preserve the worker's response format)
      const contentType = resp.headers.get('Content-Type') || '';
      if (contentType.includes('application/json')) {
        const data = await resp.json();
        // If the worker already wraps in our envelope, return directly
        if (typeof data === 'object' && data !== null && 'success' in (data as any)) {
          return c.json(data, resp.status as any);
        }
        // Otherwise wrap in our envelope
        return c.json(
          resp.ok ? success(data, version, latency_ms) : error(String((data as any)?.error || 'Worker error'), 'ECHO_WORKER_ERROR', version, latency_ms),
          resp.status as any,
        );
      }

      // Non-JSON response (audio, binary, etc) — pass through directly
      return new Response(resp.body, {
        status: resp.status,
        headers: {
          'Content-Type': contentType,
          'X-Latency-Ms': String(latency_ms),
          'X-Proxied-By': 'echo-sdk-gateway',
          'X-Worker': workerName,
        },
      });
    } catch (e) {
      const latency_ms = Date.now() - start;
      return c.json(
        error(`Proxy to ${workerName} failed: ${String(e).slice(0, 200)}`, 'ECHO_PROXY_ERROR', version, latency_ms),
        502,
      );
    }
  });

  return router;
}

// ---------------------------------------------------------------------------
// Passthrough routes for all major workers
// ---------------------------------------------------------------------------

// Shared Brain — 50+ endpoints (search, ingest, instances, memory, facts, todos, etc.)
export const brainPassthrough = createPassthrough('brain-full', (env) => env.SHARED_BRAIN, 'echo-shared-brain');

// Swarm Brain — 137 endpoints
export const swarmPassthrough = createPassthrough('swarm', (env) => env.ECHO_SWARM_BRAIN, 'echo-swarm-brain');

// X200 Swarm Brain — 23 endpoints (Trinity Council, 13 AI providers, 200 agents)
export const x200Passthrough = createPassthrough('x200', (env) => env.ECHO_X200_SWARM, 'echo-x200-swarm-brain');

// Chat — conversations, personalities
export const chatPassthrough = createPassthrough('chat', (env) => env.ECHO_CHAT, 'echo-chat');

// Voice / Speak Cloud — TTS, 39 voices
export const voicePassthrough = createPassthrough('voice', (env) => env.ECHO_SPEAK_CLOUD, 'echo-speak-cloud');

// Graph RAG — knowledge graph traversal, 312K nodes
export const graphPassthrough = createPassthrough('graph', (env) => env.GRAPH_RAG, 'echo-graph-rag');

// Arcanum — 370+ prompt templates, forge DNA
export const arcanumPassthrough = createPassthrough('arcanum', (env) => env.ECHO_ARCANUM, 'echo-arcanum');

// Memory Cortex — 7-tier cognitive memory
export const memoryPassthrough = createPassthrough('memory', (env) => env.ECHO_MEMORY_CORTEX, 'echo-memory-cortex');

// Mega Gateway — 1,878 servers, 36,330 tools
export const megaPassthrough = createPassthrough('mega', (env) => env.ECHO_MEGA_GATEWAY, 'echo-mega-gateway-cloud');

// Fleet Commander — worker fleet management
export const fleetPassthrough = createPassthrough('fleet', (env) => env.ECHO_FLEET_COMMANDER, 'echo-fleet-commander');

// AI Orchestrator — 29 LLM workers
export const orchestratorPassthrough = createPassthrough('orchestrator', (env) => env.ECHO_AI_ORCHESTRATOR, 'echo-ai-orchestrator');

// Doctrine Forge — doctrine block management
export const doctrinePassthrough = createPassthrough('doctrine', (env) => env.ECHO_DOCTRINE_FORGE, 'echo-doctrine-forge');

// Engine Cloud — engine hosting
export const engineCloudPassthrough = createPassthrough('engine-cloud', (env) => env.ECHO_ENGINE_CLOUD, 'echo-engine-cloud');

// Tool Discovery — 24.8M functions
export const toolsPassthrough = createPassthrough('tools', (env) => env.TOOL_DISCOVERY, 'echo-tool-discovery');

// Forge Marketplace
export const marketplacePassthrough = createPassthrough('marketplace', (env) => env.FORGE_MARKETPLACE, 'echo-forge-marketplace');

// ── Forge Worker Passthroughs (full API surface of each forge) ──

// Hephaestion Forge — 13-stage competitive build pipeline, 15 project types
export const hephaestionPassthrough = createPassthrough('hephaestion', (env) => env.FORGE_HEPHAESTION, 'hephaestion-forge');

// Daedalus Forge — 15 guilds, 1200 agents, manufacturing pipeline
export const daedalusPassthrough = createPassthrough('daedalus', (env) => env.FORGE_DAEDALUS, 'daedalus-forge');

// Engine Forge v2.0 — merged engine factory (15-stage pipeline + 130+ domains + build queue + 2,613 engines)
// forge-x-cloud logic has been absorbed into echo-engine-forge
export const forgeXPassthrough = createPassthrough('forge-x', (env) => env.FORGE_ENGINE, 'echo-engine-forge');
export const engineForgePassthrough = createPassthrough('engine-forge', (env) => env.FORGE_ENGINE, 'echo-engine-forge');

// App Forge — app building
export const appForgePassthrough = createPassthrough('app-forge', (env) => env.FORGE_APP, 'echo-app-forge');

// Worker Forge — worker building
export const workerForgePassthrough = createPassthrough('worker-forge', (env) => env.FORGE_WORKER, 'echo-worker-forge');

// Doctrine Forge — doctrine block management
export const doctrineForgePassthrough = createPassthrough('doctrine-forge', (env) => env.ECHO_DOCTRINE_FORGE, 'echo-doctrine-forge');

// Prompt Forge Omega — prompt engineering
export const promptForgePassthrough = createPassthrough('prompt-forge', (env) => env.FORGE_PROMPT, 'prompt-forge-omega');

// PayPal Worker — checkout/billing
export const paypalPassthrough = createPassthrough('paypal', (env) => env.ECHO_PAYPAL, 'echo-paypal');
