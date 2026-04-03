/**
 * ECHO SENTINEL AGENT — Agentic AI Backend for Sentinel
 * Gives Sentinel real web search, knowledge retrieval, file access, and system awareness.
 * v1.1.0 — C44 security hardening: auth middleware, path validation, URL allowlist
 */
import { Hono } from 'hono';
import { cors } from 'hono/cors';

const ALLOWED_ORIGINS = ['https://echo-ept.com','https://www.echo-ept.com','https://echo-op.com','https://profinishusa.com','https://bgat.echo-op.com'];

// ── Security: Allowed file path prefixes for read/write ──

const ALLOWED_PATH_PREFIXES = [
  'O:\\ECHO_OMEGA_PRIME\\',
  'O:/ECHO_OMEGA_PRIME/',
  'I:\\DOCUMENTATION',
  'I:/DOCUMENTATION',
  'F:\\ECHO_BRAIN\\',
  'F:/ECHO_BRAIN/',
  'C:\\ECHO_OMEGA_PRIME\\',
  'C:/ECHO_OMEGA_PRIME/',
  'M:\\ECHO_OMEGA_PRIME\\',
  'M:/ECHO_OMEGA_PRIME/',
];

// ── Security: Blocked URL patterns for browse endpoint ──

const BLOCKED_URL_PATTERNS = [
  /^https?:\/\/169\.254\./,                   // AWS/cloud metadata
  /^https?:\/\/metadata\./,                    // GCP metadata
  /^https?:\/\/100\.100\./,                    // Alibaba metadata
  /^https?:\/\/10\.\d+\.\d+\.\d+/,            // Private 10.x
  /^https?:\/\/172\.(1[6-9]|2\d|3[01])\./,    // Private 172.16-31.x
  /^https?:\/\/192\.168\./,                    // Private 192.168.x
  /^https?:\/\/127\./,                         // Loopback
  /^https?:\/\/0\./,                           // Zero network
  /^https?:\/\/localhost/i,                    // Localhost
  /^https?:\/\/\[::1\]/,                       // IPv6 loopback
  /^https?:\/\/\[fc/i,                         // IPv6 private
  /^https?:\/\/\[fd/i,                         // IPv6 private
  /^https?:\/\/\[fe80/i,                       // IPv6 link-local
  /\.workers\.dev\//i,                         // Block proxying to own CF workers
  /\.bmcii1976\.workers\.dev/i,                // Block proxying to own CF workers
];

// ── Security: Timing-safe string comparison ──

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Still do constant-time work to avoid length-based timing leak
    let dummy = 0;
    for (let i = 0; i < a.length; i++) dummy |= a.charCodeAt(i);
    return false;
  }
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

// ── Security: Validate file path against allowlist ──

function isPathAllowed(filePath: string): boolean {
  // Normalize path separators for comparison
  const normalized = filePath.replace(/\\/g, '/');
  // Block path traversal
  if (normalized.includes('..') || normalized.includes('\0')) return false;
  // Check against allowlist
  return ALLOWED_PATH_PREFIXES.some(prefix => {
    const normalizedPrefix = prefix.replace(/\\/g, '/');
    return normalized.toLowerCase().startsWith(normalizedPrefix.toLowerCase());
  });
}

// ── Security: Validate URL against blocklist ──

function isUrlAllowed(url: string): boolean {
  // Must be http or https
  if (!/^https?:\/\//i.test(url)) return false;
  // Check against blocked patterns
  return !BLOCKED_URL_PATTERNS.some(pattern => pattern.test(url));
}

// ── Logging ──

function log(level: 'info' | 'warn' | 'error', message: string, meta?: Record<string, unknown>): void {
  const entry = { level, message, timestamp: new Date().toISOString(), ...meta };
  if (level === 'error') console.error(JSON.stringify(entry));
  else if (level === 'warn') console.warn(JSON.stringify(entry));
  else console.log(JSON.stringify(entry));
}

// ── Types ──

interface Env {
  KNOWLEDGE_FORGE: Fetcher;
  SHARED_BRAIN: Fetcher;
  ENGINE_RUNTIME: Fetcher;
  BRAVE_SEARCH_KEY?: string;
  COMMANDER_API_KEY?: string;
  COMMANDER_API_URL: string;
  ECHO_API_KEY?: string;
}

interface SearchResult {
  title: string;
  snippet: string;
  url: string;
  source: string;
}

interface ToolResult {
  tool: string;
  success: boolean;
  data: unknown;
  error?: string;
}

interface AgentRequest {
  message: string;
  history?: Array<{ role: string; content: string }>;
  tools?: string[];
  file_path?: string;
  search_query?: string;
}

// ── System Context (condensed CLAUDE.md) ──

const SYSTEM_CONTEXT = `You are ECHO PRIME SENTINEL — the sovereign AI intelligence system of Echo Omega Prime.
Built by Commander Bobby Don McWilliams II. You have REAL capabilities, not just chat.

SYSTEM OVERVIEW:
- 31+ Cloudflare Workers at *.bmcii1976.workers.dev
- 2,632 intelligence engines across 210 knowledge domains
- 4-node compute cluster: ALPHA (i7-6700K, RTX 4060+GTX 1080), BRAVO (i7-11700F, RTX 3070), CHARLIE (Kali security), DELTA (future)
- 21 R2 buckets, 15 D1 databases, 46 KV namespaces, 1,527+ credentials in vault
- Memory: Shared Brain (8,200+ memories), Knowledge Forge (5,387+ docs), GraphRAG (312K nodes, 3.3M edges)
- Custom AI models: TitleHound (title examination), Doctrine Generator (legal doctrines), + 5 more in training

KEY WORKERS:
- echo-engine-runtime: 2,632 engines, 202K doctrines — query any domain
- echo-knowledge-forge: 5,387 docs, 140+ categories — deep knowledge retrieval
- echo-shared-brain: Cross-AI memory with Vectorize semantic search
- echo-chat: 14 AI personalities, 5 LLM providers
- echo-doctrine-forge: 24 FREE LLM providers for doctrine generation
- echo-ai-orchestrator: 29 LLM workers (GPT-4.1, DeepSeek, Grok, Llama, Qwen)
- shadowglass-v8-warpspeed: 80 counties, 259K+ oil & gas deed records
- echo-swarm-brain: 129 endpoints, MoltBook social feed
- echo-crypto-trader: Grid+Momentum strategies, BTC-USDC

PRODUCTS (echo-ept.com):
- ShadowGlass: AI-powered deed/title record browser for oil & gas
- TitleHound: AI title examination with chain-of-title gap detection
- Sentinel AI: Multi-domain intelligence (this system)
- Hephaestion Forge: AI software factory (13-stage pipeline, 15 archetypes)
- Daedalus Forge: AI manufacturing/CAD (50-stage, 15 guilds)
- Echo Speak: Multi-provider TTS/STT (ElevenLabs, Qwen3-TTS, Whisper)
- Closer: AI sales agent with ConvoAI ElevenLabs
- EchoCoin: Crypto trading platform

WEBSITES:
- echo-ept.com — Echo Prime Technologies storefront (Next.js 15.3, Vercel)
- echo-op.com — Echo Omega Prime command center (Next.js 14.2, Vercel)
- profinishusa.com — Pro Finish flooring (client site)
- barkinglot.org — Barking Lot pet services (client site)

YOUR CAPABILITIES IN THIS CONVERSATION:
- WEB SEARCH: You searched the web and have real search results below. Reference them with URLs.
- KNOWLEDGE: You searched the internal knowledge base. Use domain expertise from results.
- FILE ACCESS: You can read and write files on the Commander's drives (O:, I:, F:, etc.)
- ENGINE QUERY: You can query any of the 2,632 specialized engines for domain-specific analysis.

RESPONSE STYLE:
- Be direct, knowledgeable, confident, and action-oriented
- When you have search results, cite them with URLs
- When you have knowledge results, reference the source documents
- When asked to do something, do it or explain specifically how it will be done
- You are a sovereign AI with real capabilities — act like it
- Use the Commander's first name Bobby or title Commander when appropriate`;

// ── Hono App ──

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors({
  origin: (o) => ALLOWED_ORIGINS.includes(o) ? o : null,
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Echo-API-Key'],
}));

// Security headers middleware
app.use('*', async (c, next) => {
  await next();
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('X-XSS-Protection', '1; mode=block');
  c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
});

// ── Auth Middleware — all routes except GET / and GET /health ──
app.use('*', async (c, next) => {
  // Exempt health/root GET endpoints from auth
  const path = new URL(c.req.url).pathname;
  if (c.req.method === 'GET' && (path === '/' || path === '/health')) {
    return next();
  }

  const apiKey = c.env.ECHO_API_KEY;
  if (!apiKey) {
    log('error', 'ECHO_API_KEY not configured — rejecting all authenticated requests');
    return c.json({ error: 'Service misconfigured' }, 503);
  }

  const provided = c.req.header('X-Echo-API-Key') || '';
  if (!provided || !timingSafeEqual(provided, apiKey)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  return next();
});

// ── Health ──

app.get('/', (c) => c.json({
  service: 'echo-sentinel-agent',
  version: '1.0.0',
  status: 'operational',
  capabilities: ['web_search', 'knowledge_search', 'engine_query', 'file_read', 'file_write', 'browse_url'],
}));

app.get('/health', (c) => c.json({
  status: 'operational',
  service: 'echo-sentinel-agent',
  version: '1.0.0',
  timestamp: new Date().toISOString(),
}));

// ── Main Agent Endpoint ──
// Returns enriched context from tools — frontend handles the LLM call

app.post('/agent', async (c) => {
  const body = await c.req.json<AgentRequest>();
  const { message } = body;

  if (!message) return c.json({ error: 'message required' }, 400);

  const startTime = Date.now();

  // 1. Detect what tools to invoke
  const tools = detectTools(message);

  // 2. Execute all tools in parallel
  const toolResults = await executeTools(tools, message, c.env);

  // 3. Build enriched system context from tool results
  const enrichedContext = buildEnrichedContext(toolResults);

  const duration = Date.now() - startTime;

  return c.json({
    system_context: SYSTEM_CONTEXT,
    enriched_context: enrichedContext,
    tools_used: tools,
    tool_results: toolResults.map(r => ({
      tool: r.tool,
      success: r.success,
      result_count: Array.isArray(r.data) ? (r.data as unknown[]).length : r.data ? 1 : 0,
    })),
    search_results: toolResults
      .filter(r => r.tool === 'web_search' && r.success)
      .flatMap(r => r.data as SearchResult[]),
    knowledge_results: toolResults
      .filter(r => r.tool === 'knowledge_search' && r.success)
      .flatMap(r => r.data as SearchResult[]),
    duration_ms: duration,
  });
});

// ── Standalone Search ──

app.post('/search', async (c) => {
  const { query, sources } = await c.req.json<{ query: string; sources?: string[] }>();
  if (!query) return c.json({ error: 'query required' }, 400);

  const results: SearchResult[] = [];
  const selectedSources = sources || ['web', 'knowledge'];

  const tasks: Promise<void>[] = [];

  if (selectedSources.includes('web')) {
    tasks.push(
      webSearch(query, c.env).then(r => results.push(...r)).catch(() => {}),
    );
  }

  if (selectedSources.includes('knowledge')) {
    tasks.push(
      knowledgeSearch(query, c.env).then(r => results.push(...r)).catch(() => {}),
    );
  }

  if (selectedSources.includes('engines')) {
    tasks.push(
      engineSearch(query, c.env).then(r => results.push(...r)).catch(() => {}),
    );
  }

  if (selectedSources.includes('brain')) {
    tasks.push(
      brainSearch(query, c.env).then(r => results.push(...r)).catch(() => {}),
    );
  }

  await Promise.allSettled(tasks);

  return c.json({ query, results, count: results.length });
});

// ── File Operations ──

app.post('/file/read', async (c) => {
  const { path } = await c.req.json<{ path: string }>();
  if (!path) return c.json({ error: 'path required' }, 400);
  if (!isPathAllowed(path)) {
    log('warn', 'file/read blocked — path outside allowlist', { path });
    return c.json({ error: 'Path not allowed' }, 403);
  }

  const result = await commanderFileOp('read', path, undefined, c.env);
  return c.json(result);
});

app.post('/file/write', async (c) => {
  const { path, content } = await c.req.json<{ path: string; content: string }>();
  if (!path || !content) return c.json({ error: 'path and content required' }, 400);
  if (!isPathAllowed(path)) {
    log('warn', 'file/write blocked — path outside allowlist', { path });
    return c.json({ error: 'Path not allowed' }, 403);
  }

  const result = await commanderFileOp('write', path, content, c.env);
  return c.json(result);
});

// ── Browse URL ──

app.post('/browse', async (c) => {
  const { url } = await c.req.json<{ url: string }>();
  if (!url) return c.json({ error: 'url required' }, 400);
  if (!isUrlAllowed(url)) {
    log('warn', 'browse blocked — URL failed allowlist check', { url });
    return c.json({ error: 'URL not allowed' }, 403);
  }

  const result = await browseUrl(url);
  return c.json(result);
});

// ── Tool Detection ──

function detectTools(message: string): string[] {
  const tools: string[] = [];
  const lower = message.toLowerCase();

  // Web search indicators
  if (/\b(search|find|look up|google|what is|who is|when did|latest|news|current|today|how to|where is|tell me about)\b/i.test(lower) ||
      /\?$/.test(message.trim())) {
    tools.push('web_search');
  }

  // File read indicators
  if (/\b(read|open|show|view|cat|display|contents? of|load)\b.*\b(file|document|code|script)\b/i.test(lower) ||
      /[A-Z]:\\[^\s]+/i.test(message) ||
      /\/[a-z]+\/[a-z]+/i.test(message)) {
    tools.push('file_read');
  }

  // URL browse indicators
  if (/https?:\/\/\S+/i.test(message)) {
    tools.push('browse_url');
  }

  // Engine query indicators (domain-specific)
  if (/\b(tax|irc|deduction|depreciation|section \d+|partnership|estate|trust|audit)\b/i.test(lower)) {
    tools.push('engine_query');
  }
  if (/\b(title|deed|mineral|royalty|lease|landman|chain of title|oil.?gas|well|drilling|production)\b/i.test(lower)) {
    tools.push('engine_query');
  }
  if (/\b(legal|contract|litigation|compliance|regulatory|statute|case law)\b/i.test(lower)) {
    tools.push('engine_query');
  }

  // Always search knowledge for context enrichment
  tools.push('knowledge_search');

  return [...new Set(tools)];
}

// ── Tool Execution ──

async function executeTools(tools: string[], message: string, env: Env): Promise<ToolResult[]> {
  const tasks: Promise<ToolResult>[] = [];

  for (const tool of tools) {
    switch (tool) {
      case 'web_search':
        tasks.push(
          webSearch(message, env)
            .then(data => ({ tool, success: true, data }))
            .catch(() => ({ tool, success: false, data: [], error: 'Web search failed' })),
        );
        break;

      case 'knowledge_search':
        tasks.push(
          knowledgeSearch(message, env)
            .then(data => ({ tool, success: true, data }))
            .catch(() => ({ tool, success: false, data: [], error: 'Knowledge search failed' })),
        );
        break;

      case 'engine_query':
        tasks.push(
          engineSearch(message, env)
            .then(data => ({ tool, success: true, data }))
            .catch(() => ({ tool, success: false, data: [], error: 'Engine query failed' })),
        );
        break;

      case 'file_read': {
        const pathMatch = message.match(/[A-Z]:\\[^\s"']+/i) || message.match(/\/[a-z]+\/[^\s"']+/i);
        if (pathMatch && isPathAllowed(pathMatch[0])) {
          tasks.push(
            commanderFileOp('read', pathMatch[0], undefined, env)
              .then(data => ({ tool, success: true, data }))
              .catch(() => ({ tool, success: false, data: null, error: 'File read failed' })),
          );
        } else if (pathMatch) {
          tasks.push(Promise.resolve({ tool, success: false, data: null, error: 'Path not allowed' }));
        }
        break;
      }

      case 'browse_url': {
        const urlMatch = message.match(/https?:\/\/\S+/i);
        if (urlMatch && isUrlAllowed(urlMatch[0])) {
          tasks.push(
            browseUrl(urlMatch[0])
              .then(data => ({ tool, success: true, data }))
              .catch(() => ({ tool, success: false, data: null, error: 'Browse failed' })),
          );
        } else if (urlMatch) {
          tasks.push(Promise.resolve({ tool, success: false, data: null, error: 'URL not allowed' }));
        }
        break;
      }
    }
  }

  return Promise.all(tasks);
}

// ── Build Enriched Context ──

function buildEnrichedContext(toolResults: ToolResult[]): string {
  const sections: string[] = [SYSTEM_CONTEXT];

  for (const result of toolResults) {
    if (!result.success) continue;

    switch (result.tool) {
      case 'web_search': {
        const results = result.data as SearchResult[];
        if (results.length > 0) {
          sections.push('\n--- WEB SEARCH RESULTS ---');
          for (const r of results.slice(0, 8)) {
            sections.push(`[${r.source}] ${r.title}\n${r.snippet}\nURL: ${r.url}`);
          }
          sections.push('--- END WEB SEARCH ---\n');
        }
        break;
      }

      case 'knowledge_search': {
        const results = result.data as SearchResult[];
        if (results.length > 0) {
          sections.push('\n--- KNOWLEDGE BASE RESULTS ---');
          for (const r of results.slice(0, 5)) {
            sections.push(`[${r.source}] ${r.title}\n${r.snippet}`);
          }
          sections.push('--- END KNOWLEDGE BASE ---\n');
        }
        break;
      }

      case 'engine_query': {
        const results = result.data as SearchResult[];
        if (results.length > 0) {
          sections.push('\n--- ENGINE INTELLIGENCE ---');
          for (const r of results.slice(0, 5)) {
            sections.push(`[${r.source}] ${r.title}\n${r.snippet}`);
          }
          sections.push('--- END ENGINE INTELLIGENCE ---\n');
        }
        break;
      }

      case 'file_read': {
        const fileData = result.data as { content?: string; path?: string; error?: string };
        if (fileData?.content) {
          sections.push(`\n--- FILE CONTENTS: ${fileData.path || 'unknown'} ---`);
          sections.push(fileData.content.slice(0, 8000));
          sections.push('--- END FILE ---\n');
        }
        break;
      }

      case 'browse_url': {
        const browseData = result.data as { title?: string; text?: string; url?: string };
        if (browseData?.text) {
          sections.push(`\n--- WEB PAGE: ${browseData.title || browseData.url} ---`);
          sections.push(browseData.text.slice(0, 6000));
          sections.push('--- END WEB PAGE ---\n');
        }
        break;
      }
    }
  }

  return sections.join('\n');
}

// ── Web Search (multi-source) ──

async function webSearch(query: string, env: Env): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  const searchQuery = extractSearchQuery(query);

  // 1. Brave Search (if key available — best quality)
  if (env.BRAVE_SEARCH_KEY) {
    try {
      const res = await fetch(
        `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(searchQuery)}&count=6`,
        { headers: { 'X-Subscription-Token': env.BRAVE_SEARCH_KEY, 'Accept': 'application/json' } },
      );
      if (res.ok) {
        const data = await res.json() as { web?: { results?: Array<{ title: string; url: string; description: string }> } };
        for (const r of data.web?.results || []) {
          results.push({ title: r.title, url: r.url, snippet: r.description, source: 'brave' });
        }
      }
    } catch (e) { log("warn", "Brave search failed, continuing to fallbacks", { error: (e as Error)?.message || String(e) }); }
  }

  // 2. DuckDuckGo HTML search (real web results via lite endpoint)
  try {
    const res = await fetch(
      `https://html.duckduckgo.com/html/?q=${encodeURIComponent(searchQuery)}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html',
        },
      },
    );
    if (res.ok) {
      const html = await res.text();
      // Parse result blocks: <a class="result__a" href="...">Title</a> + <a class="result__snippet">...</a>
      const resultPattern = /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;
      let match;
      let count = 0;
      while ((match = resultPattern.exec(html)) !== null && count < 6) {
        let url = match[1] || '';
        // DDG wraps URLs in redirect — extract actual URL
        const uddgMatch = url.match(/uddg=([^&]+)/);
        if (uddgMatch) url = decodeURIComponent(uddgMatch[1]);
        const title = (match[2] || '').replace(/<[^>]*>/g, '').trim();
        const snippet = (match[3] || '').replace(/<[^>]*>/g, '').trim();
        if (title && url) {
          results.push({ title, snippet, url, source: 'web' });
          count++;
        }
      }
    }
  } catch (e) { log("warn", "DuckDuckGo HTML search failed", { error: (e as Error)?.message || String(e) }); }

  // 3. DuckDuckGo Instant Answers (good for factual/encyclopedic queries)
  if (results.length < 3) {
    try {
      const res = await fetch(
        `https://api.duckduckgo.com/?q=${encodeURIComponent(searchQuery)}&format=json&no_html=1&skip_disambig=1`,
      );
      if (res.ok) {
        const data = await res.json() as {
          Abstract?: string; AbstractURL?: string; Heading?: string;
          RelatedTopics?: Array<{ Text?: string; FirstURL?: string }>;
        };
        if (data.Abstract) {
          results.push({
            title: data.Heading || searchQuery,
            snippet: data.Abstract,
            url: data.AbstractURL || '',
            source: 'duckduckgo',
          });
        }
        for (const topic of (data.RelatedTopics || []).slice(0, 3)) {
          if (topic.Text && topic.FirstURL) {
            results.push({
              title: topic.Text.slice(0, 100),
              snippet: topic.Text,
              url: topic.FirstURL,
              source: 'duckduckgo',
            });
          }
        }
      }
    } catch (e) { log("warn", "DuckDuckGo Instant Answers failed", { error: (e as Error)?.message || String(e) }); }
  }

  // 4. Wikipedia (always reliable for factual queries)
  try {
    const res = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}&srlimit=3&format=json&origin=*`,
    );
    if (res.ok) {
      const data = await res.json() as { query?: { search?: Array<{ title: string; snippet: string }> } };
      for (const r of data.query?.search || []) {
        results.push({
          title: r.title,
          snippet: r.snippet.replace(/<[^>]*>/g, ''),
          url: `https://en.wikipedia.org/wiki/${encodeURIComponent(r.title.replace(/ /g, '_'))}`,
          source: 'wikipedia',
        });
      }
    }
  } catch (e) { log("warn", "Wikipedia search failed", { error: (e as Error)?.message || String(e) }); }

  return results;
}

function extractSearchQuery(message: string): string {
  // Strip common prefixes
  return message
    .replace(/^(search for|find|look up|google|what is|who is|tell me about)\s+/i, '')
    .replace(/[?!.]+$/, '')
    .trim() || message;
}

// ── Knowledge Forge Search ──

async function knowledgeSearch(query: string, env: Env): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  const searchQuery = extractSearchQuery(query);
  try {
    // KF uses GET /search?q=...&limit=N
    const res = await env.KNOWLEDGE_FORGE.fetch(
      `https://knowledge-forge/search?q=${encodeURIComponent(searchQuery)}&limit=5`,
    );
    if (res.ok) {
      const data = await res.json() as {
        results?: Array<{
          score?: number;
          section?: string;
          snippet?: string;
          document?: { title?: string; category?: string; tags?: string[] };
        }>;
      };
      for (const r of data.results || []) {
        const title = r.document?.title || r.section || 'Knowledge';
        const category = r.document?.category || 'general';
        results.push({
          title,
          snippet: (r.snippet || '').slice(0, 400),
          url: '',
          source: `knowledge-forge (${category})`,
        });
      }
    }
  } catch (e) { log("warn", "Knowledge Forge search failed", { error: (e as Error)?.message || String(e) }); }
  return results;
}

// ── Engine Runtime Search ──

async function engineSearch(query: string, env: Env): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  const searchQuery = extractSearchQuery(query);
  try {
    // Engine Runtime uses POST /query, returns { ok, domain_ranking, results }
    const res = await env.ENGINE_RUNTIME.fetch('https://engine-runtime/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: searchQuery, limit: 5 }),
    });
    if (res.ok) {
      const data = await res.json() as {
        ok?: boolean;
        domain_ranking?: Array<{ domain: string; label: string; matches: number; top_score: number; engines_matched: number }>;
        results?: Array<{
          domain?: string;
          engine_id?: string;
          engine_name?: string;
          topic?: string;
          conclusion?: string;
          confidence?: string;
          score?: number;
        }>;
      };
      // Map actual results
      for (const r of (data.results || []).slice(0, 5)) {
        results.push({
          title: `${r.engine_id || 'Engine'} — ${r.topic || r.engine_name || 'Analysis'}`,
          snippet: (r.conclusion || '').slice(0, 500),
          url: '',
          source: `engine-runtime/${r.engine_id || 'unknown'} (${r.domain || 'general'})`,
        });
      }
      // Also add domain ranking summary if we have matches
      if (data.domain_ranking?.length && results.length > 0) {
        const domainSummary = data.domain_ranking.slice(0, 5)
          .map(d => `${d.label}: ${d.matches} matches (top score ${d.top_score.toFixed(1)})`)
          .join(', ');
        results.unshift({
          title: 'Domain Relevance Summary',
          snippet: domainSummary,
          url: '',
          source: 'engine-runtime/domains',
        });
      }
    }
  } catch (e) { log("warn", "Engine Runtime search failed", { error: (e as Error)?.message || String(e) }); }
  return results;
}

// ── Shared Brain Search ──

async function brainSearch(query: string, env: Env): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  try {
    const res = await env.SHARED_BRAIN.fetch('https://shared-brain/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, limit: 5 }),
    });
    if (res.ok) {
      const data = await res.json() as { results?: Array<{ content?: string; instance_id?: string; importance?: number; timestamp?: string }> };
      for (const r of data.results || []) {
        results.push({
          title: `Memory (${r.instance_id || 'unknown'})`,
          snippet: (r.content || '').slice(0, 300),
          url: '',
          source: 'shared-brain',
        });
      }
    }
  } catch (e) { log("warn", "Shared Brain search failed", { error: (e as Error)?.message || String(e) }); }
  return results;
}

// ── Commander API File Operations ──

async function commanderFileOp(
  op: 'read' | 'write',
  path: string,
  content: string | undefined,
  env: Env,
): Promise<{ success: boolean; content?: string; path?: string; error?: string }> {
  const baseUrl = env.COMMANDER_API_URL || 'https://commander.echo-op.com';
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (env.COMMANDER_API_KEY) headers['X-Echo-API-Key'] = env.COMMANDER_API_KEY;

  try {
    if (op === 'read') {
      const res = await fetch(`${baseUrl}/file`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'read', path }),
      });
      if (res.ok) {
        const data = await res.json() as { content?: string };
        return { success: true, content: data.content, path };
      }
      return { success: false, path, error: `HTTP ${res.status}` };
    } else {
      const res = await fetch(`${baseUrl}/file`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'write', path, content }),
      });
      return { success: res.ok, path };
    }
  } catch (e) {
    return { success: false, path, error: String(e) };
  }
}

// ── URL Browsing ──

async function browseUrl(url: string): Promise<{ url: string; title?: string; text?: string; error?: string }> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; EchoSentinelBot/1.0)',
        'Accept': 'text/html,application/json,text/plain',
      },
    });
    if (!res.ok) return { url, error: `HTTP ${res.status}` };

    const contentType = res.headers.get('content-type') || '';

    if (contentType.includes('json')) {
      const data = await res.json();
      return { url, text: JSON.stringify(data, null, 2).slice(0, 8000) };
    }

    const html = await res.text();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/is);
    const title = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : undefined;

    // Strip HTML to text (basic)
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&[a-z]+;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 8000);

    return { url, title, text };
  } catch (e) {
    return { url, error: String(e) };
  }
}


app.onError((err, c) => {
  if (err.message?.includes('JSON')) {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }
  console.error(`[echo-sentinel-agent] ${err.message}`);
  return c.json({ error: 'Internal server error' }, 500);
});

app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

export default app;
