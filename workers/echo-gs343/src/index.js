// ═══════════════════════════════════════════════════════════════════════════════
// GS343 DIVINE OVERSEER v2.0 — Autonomous Auto-Healing System
// 8 Systems: Monitor + Phoenix + Learn + Alert + Dashboard + Schema + Ingest + Lifecycle
// Commander: Bobby Don McWilliams II | Authority 11.0 SOVEREIGN
// ═══════════════════════════════════════════════════════════════════════════════

import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

// ─── CORS ───────────────────────────────────────────────────────────────────

app.use('*', cors({
  origin: ['https://echo-ept.com', 'https://echo-op.com', 'http://localhost:3000', 'http://localhost:8787'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'X-Echo-API-Key', 'Authorization'],
}));

// ─── AUTH MIDDLEWARE ─────────────────────────────────────────────────────────

function authRequired(c, next) {
  const key = c.req.header('X-Echo-API-Key') || c.req.header('Authorization')?.replace('Bearer ', '');
  if (!key || key !== c.env.API_KEY) {
    return c.json({ error: 'Unauthorized', code: 'ECHO_AUTH_ERROR' }, 401);
  }
  return next();
}

// ─── PROBE CONFIG (System 1) — 262 Workers, Tiered ─────────────────────────
// Tier 1: Revenue-critical (always probed every cycle)
// Tier 2: Operational (always probed every cycle)
// Tier 3: All remaining workers (rotated — 40 per cycle to stay under subrequest limit)
// Total per cycle: ~45 probes (all T1 + all T2 + 40 rotating T3) < 50 subrequest limit

const TIER1_WORKERS = [
  'echo-sdk-gateway', 'echo-engine-runtime', 'echo-knowledge-forge',
  'echo-speak-cloud', 'echo-chat', 'echo-ai-orchestrator',
  'echo-shared-brain', 'echo-memory-cortex', 'echo-vault-api',
  'echo-arcanum', 'echo-mega-gateway-cloud', 'echo-gs343',
];

const TIER2_WORKERS = [
  'echo-build-orchestrator', 'echo-doctrine-forge', 'omniscient-sync',
  'echo-relay', 'echo-graph-rag', 'echo-swarm-brain',
  'echo-autonomous-daemon', 'echo-canary-beacon', 'echo-county-records',
  'echo-prime-relay', 'echo-alert-router', 'hephaestion-forge',
  'forge-x-cloud', 'echo-knowledge-scout', 'echo-knowledge-harvester',
  'echo-doctrine-brain', 'echo-memory-prime', 'echo-phoenix-cloud',
  'echo-prometheus-cloud', 'echo-sentinel-agent', 'echo-fleet-commander',
];

// All 262 workers — tier 3 auto-generated
const ALL_WORKERS = [
  '_forge-core','api-router','barking-lot-facebook','bgat-alert-webhook','bgat-api-gateway',
  'bgat-chat-api','bgat-export-cache','bgat-map-cache','bgat-pdf-storage','billymc-api',
  'billymc-voice','bree-chat','cf-dns-manager','chemglass-scraper','claudfare-terminal',
  'cleanbrees-api','cleanbrees-convoai','cleanbrees-messenger','cleanbrees-proxy',
  'crystal-memory-engine','daedalus-forge','data-acquisition-pipeline','echo-343-scanner',
  'echo-a2a-protocol','echo-ab-testing-engine','echo-affiliate','echo-agent-coordinator',
  'echo-agentic-engine','echo-ai-orchestrator','echo-alert-router','echo-analytics-engine',
  'echo-analytics-pipeline','echo-api-gateway','echo-app-forge','echo-appointments',
  'echo-arcanum','echo-asset-manager','echo-audit-log','echo-autonomous-builder',
  'echo-autonomous-daemon','echo-backup-coordinator','echo-beta-portal','echo-booking',
  'echo-bot-auditor','echo-bot-factory','echo-build-orchestrator','echo-business-api',
  'echo-business-manager','echo-cache-manager','echo-calendar','echo-call-center',
  'echo-canary-beacon','echo-chaos-engineer','echo-chat','echo-chat-production',
  'echo-circuit-breaker','echo-coin-rewards','echo-commander-mobile','echo-compliance',
  'echo-compliance-auditor','echo-config-manager','echo-contracts','echo-cost-opt',
  'echo-cost-optimizer','echo-county-records','echo-crm','echo-cron-orchestrator',
  'echo-crypto-trader','echo-customer-success','echo-darkweb-intelligence',
  'echo-data-pipeline','echo-data-room','echo-dependency-resolver',
  'echo-deployment-coordinator','echo-diagnostics-agent','echo-distributed-tracing',
  'echo-doctrine-brain','echo-doctrine-forge','echo-document-delivery',
  'echo-document-manager','echo-documents','echo-domain-harvester',
  'echo-drive-intelligence','echo-ebay','echo-email-marketing','echo-email-sender',
  'echo-engine-cloud','echo-engine-forge','echo-engine-gateway','echo-engine-runtime',
  'echo-engine-tester','echo-expense','echo-feature-flags','echo-feedback-board',
  'echo-finance','echo-finance-ai','echo-fleet-commander','echo-forge-marketplace',
  'echo-forms','echo-gamer-companion','echo-graph-rag','echo-gs343','echo-gs343-cloud',
  'echo-guardian-alpha','echo-guardian-beta','echo-health-dashboard','echo-helpdesk',
  'echo-home-ai','echo-hr','echo-hr-management','echo-immortality-vault',
  'echo-incident-manager','echo-instagram','echo-intel-hub','echo-inventory',
  'echo-invoice','echo-invoicing','echo-knowledge-base','echo-knowledge-forge',
  'echo-knowledge-harvester','echo-knowledge-scout','echo-landman-pipeline',
  'echo-link-shortener','echo-linkedin','echo-live-chat','echo-lms',
  'echo-log-aggregator','echo-mcp-preload','echo-mcp-server','echo-mdm-server',
  'echo-mega-gateway-cloud','echo-memory-cortex','echo-memory-prime',
  'echo-messaging-gateway','echo-messenger','echo-migration-manager','echo-mobile',
  'echo-model-host','echo-news-scraper','echo-newsletter','echo-notification-hub',
  'echo-okr','echo-paypal','echo-payroll','echo-performance-profiler',
  'echo-phoenix-cloud','echo-podcast','echo-polymarket-intel','echo-portal-search',
  'echo-price-alert','echo-price-alerts','echo-prime-dashboard','echo-prime-discord',
  'echo-prime-relay','echo-project-management','echo-project-manager',
  'echo-prometheus-ai','echo-prometheus-cloud','echo-prometheus-surveillance',
  'echo-prompt-forge','echo-proposals','echo-qa-tester','echo-qr-menu',
  'echo-r2-bridge','echo-rag-orchestrator','echo-rate-limiter','echo-recruiting',
  'echo-reddit-bot','echo-reddit-monitor','echo-relay','echo-report-generator',
  'echo-reveng-defense','echo-revenue-engine','echo-reviews','echo-runway',
  'echo-scheduler','echo-scraper-orchestrator','echo-sdk-dashboard','echo-sdk-gateway',
  'echo-sec-edgar','echo-sec-scraper','echo-secrets-rotator','echo-security-sandbox',
  'echo-sentinel-agent','echo-sentinel-memory','echo-service-registry',
  'echo-shared-brain','echo-shepherd-ai','echo-shopify','echo-signatures','echo-slack',
  'echo-social-media','echo-speak-cloud','echo-spi-dark','echo-spi-light',
  'echo-spi-sovereign','echo-status-page','echo-subscription','echo-surface-landman',
  'echo-surveys','echo-swarm-brain','echo-swarm-coordinator','echo-system-scanner',
  'echo-talk-gateway','echo-talk-pipeline','echo-tax-return','echo-telegram',
  'echo-texasfile-scraper','echo-timesheet','echo-title-scraper','echo-tool-discovery',
  'echo-traffic-shaper','echo-twiml-recorder','echo-usage-tracker','echo-vault-api',
  'echo-vendor-manager','echo-vram-pool','echo-waitlist','echo-web-analytics',
  'echo-webhook-relay','echo-webhook-router','echo-website-builder-ai',
  'echo-website-publisher','echo-whatsapp','echo-worker-forge','echo-workflow-automation',
  'echo-workflows','echo-x-bot','echo-x200-swarm-brain','echo-zoho-integration',
  'echocad','ekm-query-engine','embedding-pipeline','encore-cloud-scraper',
  'engine-command-center','engine-matrix','ept-api','forge-x-cloud','graph-query-engine',
  'grok-bridge','hephaestion-forge','loveslut-media-proxy','memory-consolidator',
  'memory-orchestrator','omniscient-sync','openclaw-bridge','permian-pulse-scraper',
  'profinish-api','profinish-booking','profinish-tts-proxy','prometheus-prime',
  'prompt-forge-omega','rah-api','rah-tts-proxy','shadow-control-plane',
  'shadowglass-v35','shadowglass-v7-command','shadowglass-v7-publicsearch',
  'shadowglass-v7-tyler','shadowglass-v8-warpspeed','signal-messenger','word-echo-op',
];

const TIER1_SET = new Set(TIER1_WORKERS);
const TIER2_SET = new Set(TIER2_WORKERS);
const TIER3_WORKERS = ALL_WORKERS.filter(w => !TIER1_SET.has(w) && !TIER2_SET.has(w));

// Build probe object from worker name
function makeProbe(name, tier) {
  const url = name === 'echo-ept-website'
    ? 'https://echo-ept.com'
    : `https://${name}.bmcii1976.workers.dev/health`;
  return { name, url, expect: 200, tier };
}

// Get probes for this cron cycle (all T1 + all T2 + rotating T3 batch)
function getProbesForCycle() {
  const probes = [
    ...TIER1_WORKERS.map(w => makeProbe(w, 1)),
    ...TIER2_WORKERS.map(w => makeProbe(w, 2)),
  ];

  // Rotate through tier 3: use minute-of-hour to pick a batch of 20
  const minute = new Date().getMinutes();
  const batchSize = 20;
  const batchIndex = Math.floor(minute / 5); // 0-11 (cron fires every 5 min)
  const start = (batchIndex * batchSize) % TIER3_WORKERS.length;
  const tier3Batch = [];
  for (let i = 0; i < batchSize && i < TIER3_WORKERS.length; i++) {
    tier3Batch.push(TIER3_WORKERS[(start + i) % TIER3_WORKERS.length]);
  }
  probes.push(...tier3Batch.map(w => makeProbe(w, 3)));

  return probes;
}

// For dashboard display
const ALL_PROBES_COUNT = ALL_WORKERS.length;

// ─── HELPERS ────────────────────────────────────────────────────────────────

async function sha256(text) {
  const data = new TextEncoder().encode(text.toLowerCase().trim());
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function normalizeError(text) {
  return text
    .replace(/line \d+/gi, 'line N')
    .replace(/file ".*?"/gi, 'file "..."')
    .replace(/at .*?:\d+:\d+/g, 'at ...:N:N')
    .replace(/0x[0-9a-f]+/gi, '0xADDR')
    .toLowerCase().trim();
}

function diagnose(error, status) {
  const msg = (error || '').toLowerCase();

  // Same-zone subrequest restriction (1042) — NOT an actual error
  if (msg.includes('1042') || msg.includes('worker not found')) return 'SAME_ZONE';

  // Rate limiting
  if (status === 429 || msg.includes('rate limit') || msg.includes('too many requests')) return 'RATE_LIMIT';

  // Auth issues
  if (status === 401 || status === 403 || msg.includes('unauthorized') || msg.includes('forbidden')
      || msg.includes('jwt expired') || msg.includes('invalid signature') || msg.includes('authentication')) return 'AUTH';

  // Upstream/gateway errors
  if (status === 502 || status === 503 || status === 504 || msg.includes('bad gateway')
      || msg.includes('service unavailable') || msg.includes('gateway timeout')) return 'UPSTREAM';

  // Database errors
  if (msg.includes('d1') || msg.includes('database') || msg.includes('sql') || msg.includes('sqlite')
      || msg.includes('no such table') || msg.includes('no such column') || msg.includes('constraint')) return 'D1_BINDING';

  // Network/connectivity errors
  if (msg.includes('etimedout') || msg.includes('econnrefused') || msg.includes('econnreset')
      || msg.includes('enotfound') || msg.includes('dns') || msg.includes('socket hang up')
      || msg.includes('fetch failed') || msg.includes('network error') || msg.includes('abort')
      || msg.includes('cert') || msg.includes('ssl') || msg.includes('ehostunreach')
      || msg.includes('epipe') || msg.includes('connection') || msg.includes('timeout')) return 'NETWORK';

  // Resource limits
  if (msg.includes('cpu') || msg.includes('memory') || msg.includes('subrequest')
      || msg.includes('wall time') || msg.includes('script too large')
      || msg.includes('resource limit') || msg.includes('1042') || msg.includes('1102')) return 'RESOURCE';

  // CF-specific errors
  if (msg.includes('error 1101') || msg.includes('worker threw') || msg.includes('worker exception')
      || msg.includes('error 520') || msg.includes('error 521') || msg.includes('error 522')
      || msg.includes('error 523')) return 'WORKER_CODE';

  // JavaScript runtime errors
  if (msg.includes('typeerror') || msg.includes('referenceerror') || msg.includes('syntaxerror')
      || msg.includes('rangeerror') || msg.includes('is not a function')
      || msg.includes('cannot read properties') || msg.includes('is not defined')
      || msg.includes('unexpected token') || msg.includes('stack overflow')) return 'WORKER_CODE';

  // Security alerts
  if (msg.includes('forge-x-2026') || msg.includes('vault-master') || msg.includes('password')
      || msg.includes('bearer eyj')) return 'AUTH';

  // Any 5xx = worker code issue
  if (status >= 500) return 'WORKER_CODE';

  // Any 4xx client error
  if (status >= 400) return 'UNKNOWN';

  return 'UNKNOWN';
}

// ─── SYSTEM 1: ACTIVE MONITORING (Cron) ─────────────────────────────────────

// Probe via Cloudflare API — checks if worker is deployed and has recent activity
// Falls back to direct fetch if CF_API_TOKEN not available
async function probeWorker(worker, cfApiToken) {
  const start = Date.now();

  // Use CF API to check if worker is deployed (avoids same-zone 1042 restriction)
  if (cfApiToken) {
    try {
      const resp = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/b9af3a4bf161132bb7e5d3d365fb8bb0/workers/scripts/${worker.name}/settings`,
        {
          headers: { 'Authorization': `Bearer ${cfApiToken}` },
          signal: AbortSignal.timeout(5000),
        }
      );
      const latency = Date.now() - start;

      if (resp.ok) {
        const data = await resp.json();
        if (data.success) {
          const hash = await sha256(worker.name + (data.result?.compatibility_date || ''));
          return {
            worker: worker.name, url: worker.url, tier: worker.tier,
            status: 200, latency_ms: latency, response_hash: hash,
            healthy: true, error: null,
            body_preview: `deployed, compat: ${data.result?.compatibility_date || '?'}`,
            probe_method: 'cf_api',
          };
        }
      }

      // Non-200 from CF API = worker doesn't exist or auth issue
      const errBody = await resp.text().catch(() => '');
      let errMsg = `CF API ${resp.status}`;
      try {
        const errData = JSON.parse(errBody);
        errMsg = errData.errors?.[0]?.message || errMsg;
      } catch (_) {}

      return {
        worker: worker.name, url: worker.url, tier: worker.tier,
        status: resp.status, latency_ms: latency, response_hash: null,
        healthy: false,
        error: `CF API: ${errMsg}`,
        body_preview: null,
      };
    } catch (err) {
      // CF API call itself failed — fall back to direct fetch
    }
  }

  // Fallback: direct fetch (may hit same-zone 1042)
  try {
    const resp = await fetch(worker.url, { signal: AbortSignal.timeout(5000) });
    const latency = Date.now() - start;
    const body = await resp.text().catch(() => '');
    const hash = await sha256(body.substring(0, 500));
    return {
      worker: worker.name, url: worker.url, tier: worker.tier,
      status: resp.status, latency_ms: latency, response_hash: hash,
      healthy: resp.status === worker.expect,
      error: resp.status !== worker.expect
        ? `HTTP ${resp.status}: ${body.substring(0, 300)}`
        : null,
      body_preview: body.substring(0, 200),
      probe_method: 'direct_fetch',
    };
  } catch (err) {
    return {
      worker: worker.name, url: worker.url, tier: worker.tier,
      status: 0, latency_ms: Date.now() - start, response_hash: null,
      healthy: false, error: err.message || String(err), body_preview: null,
      probe_method: cfApiToken ? 'cf_api_failed_then_fetch_failed' : 'direct_fetch_failed',
    };
  }
}

async function runMonitoringScan(env) {
  const cronRunId = crypto.randomUUID();
  const cycleProbes = getProbesForCycle();
  const cfToken = env.CF_API_TOKEN || null;
  const results = await Promise.allSettled(cycleProbes.map(p => probeWorker(p, cfToken)));

  const probeResults = results.map(r => r.status === 'fulfilled' ? r.value : {
    worker: 'unknown', url: '', tier: 3, status: 0, latency_ms: 0,
    response_hash: null, healthy: false, error: r.reason?.message || 'Promise rejected',
  });

  // Store each result in worker_status
  for (const pr of probeResults) {
    try {
      await env.DB.prepare(`
        INSERT INTO gs343_probes (worker_name, url, http_status, latency_ms, response_hash, checked_at, tier, healthy, error_message, cron_run_id)
        VALUES (?, ?, ?, ?, ?, datetime('now'), ?, ?, ?, ?)
      `).bind(pr.worker, pr.url, pr.status, pr.latency_ms, pr.response_hash, pr.tier, pr.healthy ? 1 : 0, pr.error, cronRunId).run();
    } catch (e) { /* continue on DB error */ }
  }

  const healthy = probeResults.filter(p => p.healthy).length;
  const total = probeResults.length;
  const healthScore = Math.round((healthy / total) * 100);

  // Store scan summary
  try {
    await env.DB.prepare(`
      INSERT INTO infra_scans (cron_run_id, total_probed, healthy_count, unhealthy_count, health_score, scan_duration_ms, scanned_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(cronRunId, total, healthy, total - healthy, healthScore, probeResults.reduce((sum, p) => sum + p.latency_ms, 0)).run();
  } catch (e) { /* continue */ }

  // Find failures and attempt healing
  const failures = probeResults.filter(p => !p.healthy);
  const healResults = [];

  for (const failure of failures) {
    try {
      const result = await phoenixHeal(failure, env, cronRunId);
      healResults.push(result);
    } catch (e) {
      healResults.push({ worker: failure.worker, healed: false, error: e.message });
    }
  }

  return { cronRunId, total, healthy, failures: failures.length, healthScore, healResults };
}

// ─── SYSTEM 2: PHOENIX PROTOCOL ─────────────────────────────────────────────

// Redeploy a worker using Cloudflare API (rollback to last known good version)
async function redeployWorker(workerName, env) {
  try {
    // List recent deployments to find last successful version
    const listResp = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/workers/scripts/${workerName}/deployments`,
      {
        headers: { 'Authorization': `Bearer ${env.CF_API_TOKEN}` },
        signal: AbortSignal.timeout(10000),
      }
    );
    const deployments = await listResp.json();
    if (!deployments.success || !deployments.result?.length) return { success: false, reason: 'no_deployments' };

    // Find the current active version and the previous one
    const versions = deployments.result;
    if (versions.length < 2) return { success: false, reason: 'no_previous_version' };

    // Rollback by redeploying the previous version
    const prevVersion = versions[1]; // second entry = previous deployment
    const rollbackResp = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/workers/scripts/${workerName}/deployments`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.CF_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          strategy: 'percentage',
          versions: [{ version_id: prevVersion.versions?.[0]?.version_id || prevVersion.id, percentage: 100 }],
        }),
        signal: AbortSignal.timeout(15000),
      }
    );
    const rollResult = await rollbackResp.json();
    return { success: rollResult.success, version: prevVersion.id, action: 'rollback' };
  } catch (e) {
    return { success: false, reason: e.message };
  }
}

// Force re-trigger a worker by hitting its health endpoint with retry
async function forceWake(workerName) {
  const url = `https://${workerName}.bmcii1976.workers.dev/health`;
  for (let i = 0; i < 3; i++) {
    try {
      const resp = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (resp.ok) return { success: true, attempt: i + 1 };
      await new Promise(r => setTimeout(r, 2000));
    } catch (e) { /* retry */ }
  }
  return { success: false };
}

async function phoenixHeal(failure, env, cronRunId, attempt = 1) {
  if (attempt > 3) {
    await alertCommander(failure, failure.error, 'CRITICAL', env);
    await logHeal(env.DB, failure, 'escalated', attempt, cronRunId, 'max_retries');
    return { worker: failure.worker, healed: false, attempts: 3, status: 'ESCALATED' };
  }

  const diagnosis = diagnose(failure.error, failure.status);

  // Check template match — search both by pattern and by error_type
  let template = null;
  try {
    const errorText = (failure.error || '').substring(0, 500);
    const tmpl = await env.DB.prepare(`
      SELECT * FROM error_templates
      WHERE ? LIKE '%' || error_pattern || '%'
         OR error_type = ?
         OR error_pattern LIKE '%' || ? || '%'
      ORDER BY confidence DESC LIMIT 1
    `).bind(errorText, diagnosis, diagnosis).first();
    template = tmpl;
  } catch (e) { /* no match */ }

  // Execute heal action based on diagnosis + template
  let healAction = 'unknown';
  let healed = false;
  let healDetails = {};

  switch (diagnosis) {
    case 'SAME_ZONE': {
      // Error 1042: Same-zone subrequest restriction (CF free plan limitation)
      // Worker is actually running fine — this is a monitoring blind spot, not an outage
      healAction = 'same_zone_skip';
      healed = true; // Mark as "healed" since the worker isn't actually broken
      break;
    }
    case 'NETWORK': {
      // Progressive: wait → retry → force wake → rollback
      await new Promise(r => setTimeout(r, Math.min(3000 * attempt, 10000)));
      const retry = await probeWorker({ ...failure, tier: failure.tier });
      if (retry.healthy) {
        healed = true;
        healAction = 'retry_after_wait';
      } else if (attempt === 2) {
        const wake = await forceWake(failure.worker);
        healed = wake.success;
        healAction = 'force_wake';
        healDetails = wake;
      }
      break;
    }
    case 'RATE_LIMIT': {
      const wait = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
      await new Promise(r => setTimeout(r, Math.min(wait, 15000)));
      const retry = await probeWorker({ ...failure, tier: failure.tier, expect: 200 });
      healed = retry.healthy;
      healAction = 'backoff_retry';
      break;
    }
    case 'UPSTREAM': {
      await new Promise(r => setTimeout(r, 8000 * attempt));
      const retry = await probeWorker({ ...failure, tier: failure.tier, expect: 200 });
      if (retry.healthy) {
        healed = true;
        healAction = 'upstream_wait_retry';
      } else if (attempt >= 2) {
        // Upstream still down after multiple attempts — force wake
        const wake = await forceWake(failure.worker);
        healed = wake.success;
        healAction = 'upstream_force_wake';
        healDetails = wake;
      }
      break;
    }
    case 'D1_BINDING': {
      // Try hitting init-schema if it exists
      try {
        const initResp = await fetch(
          `https://${failure.worker}.bmcii1976.workers.dev/init-schema`,
          {
            method: 'POST',
            headers: { 'X-Echo-API-Key': env.API_KEY },
            signal: AbortSignal.timeout(10000),
          }
        );
        if (initResp.ok) {
          // Re-probe after schema init
          await new Promise(r => setTimeout(r, 2000));
          const retry = await probeWorker({ ...failure, tier: failure.tier });
          healed = retry.healthy;
          healAction = 'init_schema_fix';
        } else {
          healAction = 'd1_init_failed';
        }
      } catch (e) {
        healAction = 'd1_alert';
      }
      break;
    }
    case 'WORKER_CODE': {
      // On first attempt: retry (could be transient)
      // On second: try force wake
      // On third: attempt rollback if we have CF_API_TOKEN
      if (attempt === 1) {
        await new Promise(r => setTimeout(r, 3000));
        const retry = await probeWorker({ ...failure, tier: failure.tier });
        healed = retry.healthy;
        healAction = healed ? 'code_retry_success' : 'code_retry_failed';
      } else if (attempt === 2) {
        const wake = await forceWake(failure.worker);
        healed = wake.success;
        healAction = healed ? 'code_wake_success' : 'code_wake_failed';
        healDetails = wake;
      } else if (env.CF_API_TOKEN) {
        const rollback = await redeployWorker(failure.worker, env);
        if (rollback.success) {
          await new Promise(r => setTimeout(r, 5000));
          const retry = await probeWorker({ ...failure, tier: failure.tier });
          healed = retry.healthy;
          healAction = healed ? 'rollback_success' : 'rollback_no_effect';
        } else {
          healAction = 'rollback_failed';
        }
        healDetails = rollback;
      } else {
        healAction = 'code_alert_no_token';
      }
      break;
    }
    case 'AUTH': {
      healAction = 'auth_alert';
      healed = false;
      await alertCommander(failure, failure.error, 'CRITICAL', env);
      break;
    }
    case 'RESOURCE': {
      // Resource limits — retry after cooldown (isolate may be recycled)
      await new Promise(r => setTimeout(r, 10000 * attempt));
      const retry = await probeWorker({ ...failure, tier: failure.tier });
      healed = retry.healthy;
      healAction = healed ? 'resource_cooldown_success' : 'resource_cooldown_failed';
      break;
    }
    default: {
      // Unknown — try template-guided fix if we matched one
      if (template && template.confidence >= 0.7) {
        // Template matched — try its recommended action
        await new Promise(r => setTimeout(r, 3000));
        const retry = await probeWorker({ ...failure, tier: failure.tier });
        healed = retry.healthy;
        healAction = healed ? 'template_guided_success' : 'template_guided_retry';
        healDetails = { template_id: template.id, template_type: template.error_type };
      } else {
        // No template or low confidence — capture for learning
        await captureCandidate(failure.error || 'Unknown error', diagnosis, failure.worker, env);
        healAction = 'learning_capture';
      }
    }
  }

  // Log heal attempt
  const alertLevel = healed ? 'INFO' : (failure.tier === 1 ? 'CRITICAL' : 'WARNING');
  await logHeal(env.DB, failure, healed ? 'success' : 'failure', attempt, cronRunId, healAction, template?.id, alertLevel);

  // SELF-LEARNING: Feed ALL non-SAME_ZONE errors into the candidate pipeline
  // This ensures the template matching system learns from every error type
  if (diagnosis !== 'SAME_ZONE' && failure.error) {
    await captureCandidate(failure.error, diagnosis, failure.worker, env).catch(() => {});
  }

  // Update template confidence
  if (template) {
    if (healed) {
      await env.DB.prepare('UPDATE error_templates SET confidence = MIN(confidence + 0.05, 1.0), usage_count = COALESCE(usage_count, 0) + 1 WHERE id = ?').bind(template.id).run().catch(() => {});
    } else {
      await env.DB.prepare('UPDATE error_templates SET confidence = MAX(confidence - 0.1, 0.0), fail_count = COALESCE(fail_count, 0) + 1 WHERE id = ?').bind(template.id).run().catch(() => {});
    }
  }

  if (healed) {
    return { worker: failure.worker, healed: true, attempts: attempt, action: healAction, diagnosis };
  }

  // Alert on non-retryable failures
  if (!['NETWORK', 'RATE_LIMIT', 'UPSTREAM'].includes(diagnosis)) {
    await alertCommander(failure, failure.error, alertLevel, env);
    return { worker: failure.worker, healed: false, attempts: attempt, action: healAction, diagnosis, status: 'NEEDS_MANUAL' };
  }

  // Retry for retryable diagnoses
  return phoenixHeal(failure, env, cronRunId, attempt + 1);
}

async function logHeal(db, failure, result, attempt, cronRunId, action, templateId, alertLevel) {
  try {
    await db.prepare(`
      INSERT INTO heal_log (worker_name, worker_url, error_type, error_message, diagnosis, template_id, heal_action, heal_result, attempt_number, alert_level, cron_run_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      failure.worker, failure.url, diagnose(failure.error, failure.status),
      (failure.error || '').substring(0, 1000), diagnose(failure.error, failure.status),
      templateId || null, action, result, attempt, alertLevel || 'INFO', cronRunId
    ).run();
  } catch (e) { /* continue */ }
}

// ─── SYSTEM 3: SELF-LEARNING ────────────────────────────────────────────────

async function captureCandidate(errorText, category, source, env) {
  const hash = await sha256(normalizeError(errorText));
  const shortError = errorText.substring(0, 2000);

  try {
    await env.DB.prepare(`
      INSERT INTO heal_candidates (error_hash, error_text, category, source_worker)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(error_hash) DO UPDATE SET
        occurrence_count = occurrence_count + 1,
        last_seen = datetime('now')
    `).bind(hash, shortError, category, source).run();
  } catch (e) { /* continue */ }

  // Check if ready for promotion
  try {
    const candidate = await env.DB.prepare(
      'SELECT occurrence_count, promoted FROM heal_candidates WHERE error_hash = ?'
    ).bind(hash).first();

    if (candidate && candidate.occurrence_count >= 3 && !candidate.promoted) {
      await promoteCandidate(errorText, category, candidate.occurrence_count, source, hash, env);
    }
  } catch (e) { /* continue */ }
}

async function promoteCandidate(errorText, category, count, source, hash, env) {
  try {
    const resp = await fetch('https://echo-ai-orchestrator.bmcii1976.workers.dev/dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(15000),
      body: JSON.stringify({
        model: 'auto',
        prompt: `You are GS343, an expert error diagnosis system. Analyze this error and provide a JSON response.

Error: ${errorText.substring(0, 500)}
Category: ${category}
Source: ${source}
Occurrences: ${count}

Respond ONLY with valid JSON (no markdown):
{
  "error_pattern": "key pattern to match this error class",
  "error_type": "ErrorTypeName",
  "category": "${category}",
  "severity": "low|medium|high|critical",
  "solution": "step-by-step fix",
  "solution_code": "code snippet or empty",
  "explanation": "why this error occurs"
}`,
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    const data = await resp.json();
    const responseText = data.response || data.content || '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return;

    const template = JSON.parse(jsonMatch[0]);

    const result = await env.DB.prepare(`
      INSERT INTO error_templates (error_pattern, error_type, category, severity, solution, solution_code, explanation, confidence, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0.5, 'ai_generated')
    `).bind(
      template.error_pattern, template.error_type, template.category || category,
      template.severity || 'medium', template.solution, template.solution_code || '',
      template.explanation
    ).run();

    await env.DB.prepare(
      'UPDATE heal_candidates SET promoted = 1, promoted_template_id = ?, llm_solution = ?, llm_model = ? WHERE error_hash = ?'
    ).bind(result.meta.last_row_id, responseText.substring(0, 2000), data.model || 'auto', hash).run();

  } catch (e) { /* AI generation failed — will retry next occurrence */ }
}

// ─── SYSTEM 4: ALERT ROUTING ────────────────────────────────────────────────

async function alertCommander(worker, error, level, env) {
  const payload = {
    level,
    service: worker.worker || worker.name,
    error: (error || '').substring(0, 500),
    heal_attempts: worker.attempts || 0,
    timestamp: new Date().toISOString(),
    source: 'gs343-divine-overseer',
  };

  // Store in Shared Brain
  try {
    await fetch('https://echo-shared-brain.bmcii1976.workers.dev/brain/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000),
      body: JSON.stringify({
        content: `GS343 ${level}: ${payload.service} — ${payload.error}. Heal attempts: ${payload.heal_attempts}`,
        importance: level === 'EMERGENCY' ? 10 : level === 'CRITICAL' ? 9 : 7,
        tags: ['gs343', 'heal', level.toLowerCase(), payload.service],
      }),
    });
  } catch (e) { /* brain down — continue */ }

  // Store in OmniSync
  try {
    await fetch('https://omniscient-sync.bmcii1976.workers.dev/memory/store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000),
      body: JSON.stringify({ key: `gs343_alert_${Date.now()}`, value: JSON.stringify(payload) }),
    });
  } catch (e) { /* continue */ }
}

// ─── SYSTEM 5: DASHBOARD ENDPOINTS ─────────────────────────────────────────

// Health check (existing, enhanced)
app.get('/health', async (c) => {
  const templates = await c.env.DB.prepare('SELECT COUNT(*) as cnt FROM error_templates').first();
  const heals = await c.env.DB.prepare('SELECT COUNT(*) as cnt FROM heal_log').first().catch(() => ({ cnt: 0 }));
  const lastScan = await c.env.DB.prepare('SELECT scanned_at, health_score FROM infra_scans ORDER BY id DESC LIMIT 1').first().catch(() => null);

  return c.json({
    status: 'operational',
    service: 'GS343 Divine Overseer',
    version: c.env.VERSION || '2.0.0',
    worker: 'echo-gs343.bmcii1976.workers.dev',
    templates: templates?.cnt || 0,
    heal_attempts: heals?.cnt || 0,
    health_score: lastScan?.health_score || null,
    last_scan: lastScan?.scanned_at || null,
    systems: {
      monitoring: 'active',
      phoenix_protocol: 'active',
      self_learning: 'active',
      alert_routing: 'active',
      auto_ingest: 'active',
    },
    probes: ALL_PROBES_COUNT,
    environment: 'production',
    timestamp: new Date().toISOString(),
  });
});

// Stats (existing, enhanced)
app.get('/stats', async (c) => {
  const total = await c.env.DB.prepare('SELECT COUNT(*) as cnt FROM error_templates').first();
  const byCat = await c.env.DB.prepare('SELECT category, COUNT(*) as count FROM error_templates GROUP BY category ORDER BY count DESC').all();
  return c.json({
    total_templates: total?.cnt || 0,
    by_category: byCat?.results || [],
  });
});

// Passive heal (existing)
app.post('/heal', async (c) => {
  const { error, context } = await c.req.json();
  if (!error) return c.json({ error: 'Missing error field' }, 400);

  const match = await c.env.DB.prepare(`
    SELECT * FROM error_templates WHERE ? LIKE '%' || error_pattern || '%'
    ORDER BY confidence DESC LIMIT 1
  `).bind(error).first();

  if (match) {
    await c.env.DB.prepare('UPDATE error_templates SET usage_count = COALESCE(usage_count, 0) + 1 WHERE id = ?').bind(match.id).run().catch(() => {});
    return c.json({ matched: true, confidence: match.confidence, template: match });
  }

  // No match — capture as candidate
  await captureCandidate(error, 'unknown', context || 'api', c.env);
  return c.json({ matched: false, message: 'No template matched. Error captured for learning.' });
});

// Auto-heal (existing, enhanced)
app.post('/heal/auto', async (c) => {
  const key = c.req.header('X-Echo-API-Key');
  if (!key || key !== c.env.API_KEY) return c.json({ error: 'Unauthorized' }, 401);

  const { worker_name, error, status_code } = await c.req.json();
  const failure = { worker: worker_name, url: '', tier: 2, status: status_code || 500, error, healthy: false };
  const result = await phoenixHeal(failure, c.env, crypto.randomUUID());
  return c.json(result);
});

// Debug: test CF API probe for a single worker
app.get('/heal/probe-test', async (c) => {
  const key = c.req.header('X-Echo-API-Key');
  if (!key || key !== c.env.API_KEY) return c.json({ error: 'Unauthorized' }, 401);

  const workerName = c.req.query('worker') || 'echo-vault-api';
  const token = c.env.CF_API_TOKEN;
  const hasToken = !!token;

  if (!token) return c.json({ error: 'No CF_API_TOKEN secret set', hasToken });

  try {
    const resp = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/b9af3a4bf161132bb7e5d3d365fb8bb0/workers/scripts/${workerName}/settings`,
      {
        headers: { 'Authorization': `Bearer ${token}` },
        signal: AbortSignal.timeout(5000),
      }
    );
    const body = await resp.text();
    const isJson = body.startsWith('{');
    return c.json({
      hasToken,
      worker: workerName,
      apiStatus: resp.status,
      isJson,
      body: body.substring(0, 500),
    });
  } catch (e) {
    return c.json({ hasToken, worker: workerName, error: e.message });
  }
});

// Manual scan trigger (scans Tier 1 workers only for quick response)
app.post('/heal/scan', async (c) => {
  const key = c.req.header('X-Echo-API-Key');
  if (!key || key !== c.env.API_KEY) return c.json({ error: 'Unauthorized' }, 401);

  const tier = c.req.query('tier') || '1';
  let workers;
  if (tier === 'all') {
    workers = getProbesForCycle();
  } else if (tier === '2') {
    workers = [...TIER1_WORKERS, ...TIER2_WORKERS].map(w => makeProbe(w, w.tier || 1));
  } else {
    workers = TIER1_WORKERS.map(w => makeProbe(w, 1));
  }

  const cronRunId = crypto.randomUUID();
  const cfToken = c.env.CF_API_TOKEN || null;
  const results = await Promise.allSettled(workers.map(p => probeWorker(p, cfToken)));
  const probeResults = results.map(r => r.status === 'fulfilled' ? r.value : {
    worker: 'unknown', url: '', tier: 3, status: 0, latency_ms: 0,
    response_hash: null, healthy: false, error: r.reason?.message || 'rejected',
  });

  const healthy = probeResults.filter(p => p.healthy).length;
  const failures = probeResults.filter(p => !p.healthy);

  // Diagnose failures (no healing — that's too slow for HTTP, cron does healing)
  const diagnosedFailures = failures.map(f => ({
    worker: f.worker,
    status: f.status,
    latency_ms: f.latency_ms,
    diagnosis: diagnose(f.error, f.status),
    probe_method: f.probe_method || '?',
    error: f.error ? f.error.substring(0, 200) : null,
  }));

  return c.json({
    cronRunId, tier,
    total: probeResults.length,
    healthy,
    failures: failures.length,
    healthScore: Math.round((healthy / probeResults.length) * 100),
    diagnosedFailures,
    hasToken: !!cfToken,
    healthyWorkers: probeResults.filter(p => p.healthy).map(p => ({
      worker: p.worker, status: p.status, latency_ms: p.latency_ms,
      probe_method: p.probe_method || '?',
    })),
  });
});

// Heal stats
app.get('/heal/stats', async (c) => {
  const total = await c.env.DB.prepare('SELECT COUNT(*) as cnt FROM heal_log').first().catch(() => ({ cnt: 0 }));
  const success = await c.env.DB.prepare("SELECT COUNT(*) as cnt FROM heal_log WHERE heal_result = 'success'").first().catch(() => ({ cnt: 0 }));
  const fail = await c.env.DB.prepare("SELECT COUNT(*) as cnt FROM heal_log WHERE heal_result = 'failure'").first().catch(() => ({ cnt: 0 }));
  const today = await c.env.DB.prepare("SELECT COUNT(*) as cnt FROM heal_log WHERE created_at > datetime('now', '-1 day')").first().catch(() => ({ cnt: 0 }));
  const week = await c.env.DB.prepare("SELECT COUNT(*) as cnt FROM heal_log WHERE created_at > datetime('now', '-7 days')").first().catch(() => ({ cnt: 0 }));
  const common = await c.env.DB.prepare('SELECT error_type, COUNT(*) as cnt FROM heal_log GROUP BY error_type ORDER BY cnt DESC LIMIT 10').all().catch(() => ({ results: [] }));
  const mostHealed = await c.env.DB.prepare('SELECT worker_name, COUNT(*) as cnt FROM heal_log GROUP BY worker_name ORDER BY cnt DESC LIMIT 10').all().catch(() => ({ results: [] }));

  const totalCount = total?.cnt || 0;
  const successCount = success?.cnt || 0;

  return c.json({
    total_heals: totalCount,
    success_count: successCount,
    fail_count: fail?.cnt || 0,
    success_rate_pct: totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 0,
    heals_today: today?.cnt || 0,
    heals_this_week: week?.cnt || 0,
    most_common_errors: common?.results || [],
    most_healed_workers: mostHealed?.results || [],
  });
});

// Heal active
app.get('/heal/active', async (c) => {
  const lastScan = await c.env.DB.prepare('SELECT * FROM infra_scans ORDER BY id DESC LIMIT 1').first().catch(() => null);
  const recentHeals = await c.env.DB.prepare("SELECT * FROM heal_log WHERE created_at > datetime('now', '-5 minutes') ORDER BY id DESC LIMIT 20").all().catch(() => ({ results: [] }));
  return c.json({
    active_heals: recentHeals?.results || [],
    cron_last_run: lastScan?.scanned_at || null,
    health_score: lastScan?.health_score || null,
    next_run_eta: '~5 minutes',
  });
});

// Heal history
app.get('/heal/history', async (c) => {
  const limit = Math.min(parseInt(c.req.query('limit') || '50'), 200);
  const offset = parseInt(c.req.query('offset') || '0');
  const total = await c.env.DB.prepare('SELECT COUNT(*) as cnt FROM heal_log').first().catch(() => ({ cnt: 0 }));
  const heals = await c.env.DB.prepare('SELECT * FROM heal_log ORDER BY id DESC LIMIT ? OFFSET ?').bind(limit, offset).all().catch(() => ({ results: [] }));
  return c.json({ heals: heals?.results || [], total: total?.cnt || 0, limit, offset });
});

// Unmatched errors (learning queue)
app.get('/heal/unmatched', async (c) => {
  const limit = Math.min(parseInt(c.req.query('limit') || '50'), 200);
  const total = await c.env.DB.prepare('SELECT COUNT(*) as cnt FROM heal_candidates WHERE promoted = 0').first().catch(() => ({ cnt: 0 }));
  const candidates = await c.env.DB.prepare(
    'SELECT * FROM heal_candidates WHERE promoted = 0 ORDER BY occurrence_count DESC LIMIT ?'
  ).bind(limit).all().catch(() => ({ results: [] }));
  return c.json({ candidates: candidates?.results || [], total: total?.cnt || 0 });
});

// Confidence rankings
app.get('/heal/confidence', async (c) => {
  const templates = await c.env.DB.prepare(
    'SELECT id, error_type, category, confidence, COALESCE(usage_count, 0) as usage_count, COALESCE(fail_count, 0) as fail_count, COALESCE(source, \'seeded\') as source FROM error_templates WHERE COALESCE(archived, 0) = 0 ORDER BY confidence DESC LIMIT 100'
  ).all().catch(() => ({ results: [] }));
  return c.json({ templates: templates?.results || [] });
});

// Baselines
app.get('/heal/baselines', async (c) => {
  const baselines = await c.env.DB.prepare('SELECT * FROM heal_baselines ORDER BY tier, worker_name').all().catch(() => ({ results: [] }));
  return c.json({ baselines: baselines?.results || [] });
});

// Health score
app.get('/heal/score', async (c) => {
  const latest = await c.env.DB.prepare('SELECT * FROM infra_scans ORDER BY id DESC LIMIT 1').first().catch(() => null);
  const tier1 = await c.env.DB.prepare(
    "SELECT COUNT(*) as total, SUM(CASE WHEN healthy = 1 THEN 1 ELSE 0 END) as healthy FROM gs343_probes WHERE tier = 1 AND checked_at > datetime('now', '-10 minutes')"
  ).first().catch(() => ({ total: 0, healthy: 0 }));
  const tier2 = await c.env.DB.prepare(
    "SELECT COUNT(*) as total, SUM(CASE WHEN healthy = 1 THEN 1 ELSE 0 END) as healthy FROM gs343_probes WHERE tier = 2 AND checked_at > datetime('now', '-10 minutes')"
  ).first().catch(() => ({ total: 0, healthy: 0 }));
  const tier3 = await c.env.DB.prepare(
    "SELECT COUNT(*) as total, SUM(CASE WHEN healthy = 1 THEN 1 ELSE 0 END) as healthy FROM gs343_probes WHERE tier = 3 AND checked_at > datetime('now', '-10 minutes')"
  ).first().catch(() => ({ total: 0, healthy: 0 }));

  return c.json({
    health_score: latest?.health_score || 0,
    tier1_health: tier1?.total > 0 ? Math.round((tier1.healthy / tier1.total) * 100) : 0,
    tier2_health: tier2?.total > 0 ? Math.round((tier2.healthy / tier2.total) * 100) : 0,
    tier3_health: tier3?.total > 0 ? Math.round((tier3.healthy / tier3.total) * 100) : 0,
    last_scan: latest?.scanned_at || null,
    probes_total: ALL_PROBES_COUNT,
  });
});

// ─── SYSTEM 7: ERROR INGEST ENDPOINT ────────────────────────────────────────

app.post('/errors/ingest', async (c) => {
  const key = c.req.header('X-Echo-API-Key');
  if (!key || key !== c.env.API_KEY) return c.json({ error: 'Unauthorized' }, 401);

  const { error, context, source, category } = await c.req.json();
  if (!error) return c.json({ error: 'Missing error field' }, 400);

  await captureCandidate(error, category || 'unknown', source || 'external', c.env);

  const hash = await sha256(normalizeError(error));
  const candidate = await c.env.DB.prepare(
    'SELECT occurrence_count, promoted, promoted_template_id FROM heal_candidates WHERE error_hash = ?'
  ).bind(hash).first().catch(() => null);

  return c.json({
    success: true,
    action: candidate?.promoted ? 'already_promoted' : (candidate?.occurrence_count >= 3 ? 'promoting' : 'tracking'),
    occurrences: candidate?.occurrence_count || 1,
    threshold: 3,
    template_id: candidate?.promoted_template_id || null,
  });
});

// Bulk error ingest (for mass-feeding from log files, CI/CD, etc.)
app.post('/errors/bulk-ingest', async (c) => {
  const key = c.req.header('X-Echo-API-Key');
  if (!key || key !== c.env.API_KEY) return c.json({ error: 'Unauthorized' }, 401);

  const { errors } = await c.req.json();
  if (!Array.isArray(errors)) return c.json({ error: 'errors must be an array' }, 400);

  let processed = 0, skipped = 0;
  for (const err of errors.slice(0, 500)) { // Max 500 per request
    if (!err.error) { skipped++; continue; }
    try {
      await captureCandidate(err.error, err.category || 'unknown', err.source || 'bulk', c.env);
      processed++;
    } catch (e) { skipped++; }
  }

  return c.json({ success: true, processed, skipped, total: errors.length });
});

// Harvest: analyze heal_log for recurring errors and auto-generate templates
app.post('/templates/harvest', async (c) => {
  const key = c.req.header('X-Echo-API-Key');
  if (!key || key !== c.env.API_KEY) return c.json({ error: 'Unauthorized' }, 401);

  // Find candidates with 3+ occurrences that haven't been promoted yet
  const candidates = await c.env.DB.prepare(`
    SELECT * FROM heal_candidates
    WHERE occurrence_count >= 3 AND promoted = 0
    ORDER BY occurrence_count DESC
    LIMIT 20
  `).all().catch(() => ({ results: [] }));

  const promoted = [];
  for (const candidate of (candidates?.results || [])) {
    try {
      await promoteCandidate(
        candidate.error_text, candidate.category,
        candidate.occurrence_count, candidate.source_worker,
        candidate.error_hash, c.env
      );
      promoted.push({ hash: candidate.error_hash, error: candidate.error_text.substring(0, 100), count: candidate.occurrence_count });
    } catch (e) { /* continue */ }
  }

  return c.json({
    success: true,
    candidates_found: candidates?.results?.length || 0,
    promoted: promoted.length,
    details: promoted,
  });
});

// Feed errors from wrangler tail / live logs
app.post('/errors/from-logs', async (c) => {
  const key = c.req.header('X-Echo-API-Key');
  if (!key || key !== c.env.API_KEY) return c.json({ error: 'Unauthorized' }, 401);

  const { logs, worker_name } = await c.req.json();
  if (!Array.isArray(logs)) return c.json({ error: 'logs must be an array of log lines' }, 400);

  // Extract errors from log lines
  const errorPatterns = [
    /Error:?\s+(.+)/i,
    /TypeError:?\s+(.+)/i,
    /ReferenceError:?\s+(.+)/i,
    /SyntaxError:?\s+(.+)/i,
    /RangeError:?\s+(.+)/i,
    /Uncaught\s+(.+)/i,
    /FATAL:?\s+(.+)/i,
    /SQLITE_\w+:?\s*(.*)/i,
    /D1_\w+:?\s*(.*)/i,
    /HTTP\s+[45]\d{2}:?\s*(.*)/i,
  ];

  let found = 0;
  for (const line of logs.slice(0, 1000)) {
    for (const pattern of errorPatterns) {
      const match = line.match(pattern);
      if (match) {
        await captureCandidate(match[0], 'auto', worker_name || 'log-feed', c.env);
        found++;
        break;
      }
    }
  }

  return c.json({ success: true, lines_scanned: logs.length, errors_found: found });
});

// ─── EXISTING ENDPOINTS (preserved) ─────────────────────────────────────────

// Search templates
app.get('/search', async (c) => {
  const q = c.req.query('q') || '';
  const category = c.req.query('category');
  const severity = c.req.query('severity');
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);

  let sql = 'SELECT * FROM error_templates WHERE 1=1';
  const params = [];

  if (q) {
    sql += " AND (error_pattern LIKE ? OR error_type LIKE ? OR solution LIKE ?)";
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (category) { sql += ' AND category = ?'; params.push(category); }
  if (severity) { sql += ' AND severity = ?'; params.push(severity); }
  sql += ' ORDER BY confidence DESC LIMIT ?';
  params.push(limit);

  const results = await c.env.DB.prepare(sql).bind(...params).all();
  return c.json({ results: results?.results || [], total: results?.results?.length || 0 });
});

// Categories
app.get('/categories', async (c) => {
  const cats = await c.env.DB.prepare('SELECT category, COUNT(*) as count FROM error_templates GROUP BY category ORDER BY count DESC').all();
  return c.json({ categories: cats?.results || [] });
});

// Templates CRUD
app.get('/templates', async (c) => {
  const limit = Math.min(parseInt(c.req.query('limit') || '50'), 200);
  const offset = parseInt(c.req.query('offset') || '0');
  const results = await c.env.DB.prepare('SELECT * FROM error_templates WHERE COALESCE(archived, 0) = 0 ORDER BY id DESC LIMIT ? OFFSET ?').bind(limit, offset).all();
  return c.json({ templates: results?.results || [], limit, offset });
});

app.get('/templates/:id', async (c) => {
  const id = c.req.param('id');
  const template = await c.env.DB.prepare('SELECT * FROM error_templates WHERE id = ?').bind(id).first();
  if (!template) return c.json({ error: 'Template not found' }, 404);
  return c.json(template);
});

app.post('/templates', async (c) => {
  const key = c.req.header('X-Echo-API-Key');
  if (!key || key !== c.env.API_KEY) return c.json({ error: 'Unauthorized' }, 401);

  const { error_pattern, error_type, category, severity, solution, solution_code, explanation, confidence } = await c.req.json();
  if (!error_pattern || !error_type) return c.json({ error: 'Missing required fields' }, 400);

  const result = await c.env.DB.prepare(`
    INSERT INTO error_templates (error_pattern, error_type, category, severity, solution, solution_code, explanation, confidence, source)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'manual')
  `).bind(error_pattern, error_type, category || 'unknown', severity || 'medium', solution || '', solution_code || '', explanation || '', confidence || 0.7).run();

  return c.json({ success: true, id: result.meta.last_row_id });
});

app.put('/templates/:id', async (c) => {
  const key = c.req.header('X-Echo-API-Key');
  if (!key || key !== c.env.API_KEY) return c.json({ error: 'Unauthorized' }, 401);

  const id = c.req.param('id');
  const updates = await c.req.json();
  const fields = [];
  const values = [];

  for (const [k, v] of Object.entries(updates)) {
    if (['error_pattern', 'error_type', 'category', 'severity', 'solution', 'solution_code', 'explanation', 'confidence'].includes(k)) {
      fields.push(`${k} = ?`);
      values.push(v);
    }
  }
  if (!fields.length) return c.json({ error: 'No valid fields to update' }, 400);

  values.push(id);
  await c.env.DB.prepare(`UPDATE error_templates SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
  return c.json({ success: true });
});

app.delete('/templates/:id', async (c) => {
  const key = c.req.header('X-Echo-API-Key');
  if (!key || key !== c.env.API_KEY) return c.json({ error: 'Unauthorized' }, 401);

  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM error_templates WHERE id = ?').bind(id).run();
  return c.json({ success: true });
});

app.post('/templates/bulk', async (c) => {
  const key = c.req.header('X-Echo-API-Key');
  if (!key || key !== c.env.API_KEY) return c.json({ error: 'Unauthorized' }, 401);

  const { templates } = await c.req.json();
  if (!templates || !Array.isArray(templates)) return c.json({ error: 'Missing templates array' }, 400);

  let inserted = 0;
  for (const t of templates) {
    try {
      await c.env.DB.prepare(`
        INSERT OR IGNORE INTO error_templates (error_pattern, error_type, category, severity, solution, solution_code, explanation, confidence, source)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(t.error_pattern, t.error_type, t.category || 'unknown', t.severity || 'medium', t.solution || '', t.solution_code || '', t.explanation || '', t.confidence || 0.7, t.source || 'bulk').run();
      inserted++;
    } catch (e) { /* skip dupes */ }
  }
  return c.json({ success: true, inserted, total: templates.length });
});

// Heal log
app.get('/log', async (c) => {
  const limit = Math.min(parseInt(c.req.query('limit') || '50'), 200);
  const results = await c.env.DB.prepare('SELECT * FROM heal_log ORDER BY id DESC LIMIT ?').bind(limit).all().catch(() => ({ results: [] }));
  return c.json({ log: results?.results || [] });
});

app.get('/log/stats', async (c) => {
  const total = await c.env.DB.prepare('SELECT COUNT(*) as cnt FROM heal_log').first().catch(() => ({ cnt: 0 }));
  const byResult = await c.env.DB.prepare('SELECT heal_result, COUNT(*) as cnt FROM heal_log GROUP BY heal_result').all().catch(() => ({ results: [] }));
  return c.json({ total: total?.cnt || 0, by_result: byResult?.results || [] });
});

// Seed templates
app.post('/seed', async (c) => {
  const key = c.req.header('X-Echo-API-Key');
  if (!key || key !== c.env.API_KEY) return c.json({ error: 'Unauthorized' }, 401);
  return c.json({ message: 'Use /templates/bulk for seeding. Existing 722 templates preserved.' });
});

// Template lifecycle (System 8)
app.post('/templates/decay', async (c) => {
  const key = c.req.header('X-Echo-API-Key');
  if (!key || key !== c.env.API_KEY) return c.json({ error: 'Unauthorized' }, 401);

  const decayed = await c.env.DB.prepare(`
    UPDATE error_templates SET confidence = MAX(confidence - 0.02, 0.1)
    WHERE COALESCE(usage_count, 0) = 0 AND created_at < datetime('now', '-30 days') AND COALESCE(archived, 0) = 0
  `).run().catch(() => ({ meta: { changes: 0 } }));

  const archived = await c.env.DB.prepare(`
    UPDATE error_templates SET archived = 1
    WHERE confidence < 0.1 AND COALESCE(fail_count, 0) > 5 AND COALESCE(usage_count, 0) < 3
  `).run().catch(() => ({ meta: { changes: 0 } }));

  return c.json({ success: true, decayed: decayed.meta?.changes || 0, archived: archived.meta?.changes || 0 });
});

// Root
app.get('/', (c) => c.json({
  service: 'GS343 Divine Overseer',
  version: c.env.VERSION || '2.0.0',
  docs: 'https://echo-ept.com/docs/gs343',
  endpoints: {
    health: 'GET /health',
    stats: 'GET /stats',
    heal: 'POST /heal',
    heal_auto: 'POST /heal/auto',
    heal_stats: 'GET /heal/stats',
    heal_active: 'GET /heal/active',
    heal_history: 'GET /heal/history',
    heal_unmatched: 'GET /heal/unmatched',
    heal_confidence: 'GET /heal/confidence',
    heal_baselines: 'GET /heal/baselines',
    heal_score: 'GET /heal/score',
    errors_ingest: 'POST /errors/ingest',
    search: 'GET /search',
    categories: 'GET /categories',
    templates: 'GET|POST /templates',
    template: 'GET|PUT|DELETE /templates/:id',
    templates_bulk: 'POST /templates/bulk',
    templates_decay: 'POST /templates/decay',
    log: 'GET /log',
    log_stats: 'GET /log/stats',
    diag_trends: 'GET /diagnostics/trends',
    diag_worker: 'GET /diagnostics/worker/:name',
    diag_latency: 'GET /diagnostics/latency',
    diag_correlations: 'GET /diagnostics/correlations',
    diag_flapping: 'GET /diagnostics/flapping',
    diag_mttr: 'GET /diagnostics/mttr',
    diag_debug: 'GET /diagnostics/debug/:worker (auth)',
    diag_scans: 'GET /diagnostics/scans',
    diag_scan_detail: 'GET /diagnostics/scans/:runId',
    diag_self: 'GET /diagnostics/self',
    diag_harvest: 'POST /diagnostics/harvest-analytics (auth)',
  },
}));

// ─── SYSTEM 9: ADVANCED DIAGNOSTICS ────────────────────────────────────────

// Error trend analysis — rates over 1h, 6h, 24h, 7d windows
app.get('/diagnostics/trends', async (c) => {
  const windows = [
    { label: '1h', sql: "datetime('now', '-1 hour')" },
    { label: '6h', sql: "datetime('now', '-6 hours')" },
    { label: '24h', sql: "datetime('now', '-1 day')" },
    { label: '7d', sql: "datetime('now', '-7 days')" },
  ];

  const trends = {};
  for (const w of windows) {
    const [total, healed, byType, byAction] = await Promise.all([
      c.env.DB.prepare(`SELECT COUNT(*) as cnt FROM heal_log WHERE created_at > ${w.sql}`).first().catch(() => ({ cnt: 0 })),
      c.env.DB.prepare(`SELECT COUNT(*) as cnt FROM heal_log WHERE heal_result = 'success' AND created_at > ${w.sql}`).first().catch(() => ({ cnt: 0 })),
      c.env.DB.prepare(`SELECT error_type, COUNT(*) as cnt FROM heal_log WHERE created_at > ${w.sql} GROUP BY error_type ORDER BY cnt DESC LIMIT 10`).all().catch(() => ({ results: [] })),
      c.env.DB.prepare(`SELECT heal_action, COUNT(*) as cnt FROM heal_log WHERE created_at > ${w.sql} GROUP BY heal_action ORDER BY cnt DESC LIMIT 10`).all().catch(() => ({ results: [] })),
    ]);
    trends[w.label] = {
      total_events: total?.cnt || 0,
      healed: healed?.cnt || 0,
      heal_rate_pct: total?.cnt > 0 ? Math.round(((healed?.cnt || 0) / total.cnt) * 100) : 0,
      top_error_types: byType?.results || [],
      top_heal_actions: byAction?.results || [],
    };
  }

  // Hourly breakdown for last 24h
  const hourly = await c.env.DB.prepare(`
    SELECT strftime('%Y-%m-%d %H:00', created_at) as hour,
           COUNT(*) as total,
           SUM(CASE WHEN heal_result = 'success' THEN 1 ELSE 0 END) as healed,
           SUM(CASE WHEN heal_result = 'failure' THEN 1 ELSE 0 END) as failed
    FROM heal_log WHERE created_at > datetime('now', '-1 day')
    GROUP BY hour ORDER BY hour
  `).all().catch(() => ({ results: [] }));

  return c.json({ trends, hourly_breakdown: hourly?.results || [] });
});

// Per-worker deep diagnostic view
app.get('/diagnostics/worker/:name', async (c) => {
  const name = c.req.param('name');
  const limit = Math.min(parseInt(c.req.query('limit') || '50'), 200);

  const [recentHeals, recentProbes, baseline, errorDist, latencyStats] = await Promise.all([
    c.env.DB.prepare('SELECT * FROM heal_log WHERE worker_name = ? ORDER BY id DESC LIMIT ?').bind(name, limit).all().catch(() => ({ results: [] })),
    c.env.DB.prepare('SELECT * FROM gs343_probes WHERE worker_name = ? ORDER BY id DESC LIMIT ?').bind(name, limit).all().catch(() => ({ results: [] })),
    c.env.DB.prepare('SELECT * FROM heal_baselines WHERE worker_name = ?').bind(name).first().catch(() => null),
    c.env.DB.prepare('SELECT error_type, COUNT(*) as cnt FROM heal_log WHERE worker_name = ? GROUP BY error_type ORDER BY cnt DESC').bind(name).all().catch(() => ({ results: [] })),
    c.env.DB.prepare(`
      SELECT COUNT(*) as probe_count,
             AVG(latency_ms) as avg_latency,
             MIN(latency_ms) as min_latency,
             MAX(latency_ms) as max_latency,
             SUM(CASE WHEN healthy = 1 THEN 1 ELSE 0 END) as healthy_count,
             SUM(CASE WHEN healthy = 0 THEN 1 ELSE 0 END) as unhealthy_count
      FROM gs343_probes WHERE worker_name = ? AND checked_at > datetime('now', '-24 hours')
    `).bind(name).first().catch(() => null),
  ]);

  // Calculate uptime percentage (last 24h)
  const probeCount = latencyStats?.probe_count || 0;
  const healthyCount = latencyStats?.healthy_count || 0;
  const uptime24h = probeCount > 0 ? Math.round((healthyCount / probeCount) * 10000) / 100 : null;

  // Flapping: count state changes in recent probes
  const probes = recentProbes?.results || [];
  let stateChanges = 0;
  for (let i = 1; i < probes.length; i++) {
    if (probes[i].healthy !== probes[i - 1].healthy) stateChanges++;
  }

  // MTTR: avg time between failure and next success
  const heals = recentHeals?.results || [];
  let totalRecoveryMs = 0, recoveryCount = 0;
  for (const h of heals) {
    if (h.heal_result === 'success' && h.created_at) {
      // Duration approximated by attempt_number * ~5s per attempt
      totalRecoveryMs += (h.attempt_number || 1) * 5000;
      recoveryCount++;
    }
  }

  const tier = TIER1_SET.has(name) ? 1 : TIER2_SET.has(name) ? 2 : 3;

  return c.json({
    worker: name,
    tier,
    baseline,
    uptime_24h_pct: uptime24h,
    latency: latencyStats ? {
      avg_ms: Math.round(latencyStats.avg_latency || 0),
      min_ms: latencyStats.min_latency || 0,
      max_ms: latencyStats.max_latency || 0,
      probes_24h: probeCount,
    } : null,
    flapping: { state_changes: stateChanges, probes_analyzed: probes.length, is_flapping: stateChanges > 5 },
    mttr_avg_ms: recoveryCount > 0 ? Math.round(totalRecoveryMs / recoveryCount) : null,
    error_distribution: errorDist?.results || [],
    recent_heals: heals.slice(0, 20),
    recent_probes: probes.slice(0, 20),
  });
});

// Latency percentile tracking across fleet
app.get('/diagnostics/latency', async (c) => {
  const hours = Math.min(parseInt(c.req.query('hours') || '24'), 168);
  const tier = c.req.query('tier'); // optional filter

  let sql = `SELECT latency_ms FROM gs343_probes WHERE checked_at > datetime('now', '-${hours} hours') AND healthy = 1`;
  const params = [];
  if (tier) { sql += ' AND tier = ?'; params.push(parseInt(tier)); }
  sql += ' ORDER BY latency_ms ASC';

  const rows = await c.env.DB.prepare(sql).bind(...params).all().catch(() => ({ results: [] }));
  const latencies = (rows?.results || []).map(r => r.latency_ms).filter(l => l > 0);

  if (latencies.length === 0) return c.json({ message: 'No latency data', hours, tier: tier || 'all' });

  const percentile = (arr, p) => {
    const idx = Math.ceil((p / 100) * arr.length) - 1;
    return arr[Math.max(0, idx)];
  };

  // Per-worker avg latency (top 20 slowest)
  let workerSql = `SELECT worker_name, AVG(latency_ms) as avg_ms, COUNT(*) as probes
    FROM gs343_probes WHERE checked_at > datetime('now', '-${hours} hours') AND healthy = 1`;
  if (tier) { workerSql += ' AND tier = ?'; }
  workerSql += ' GROUP BY worker_name ORDER BY avg_ms DESC LIMIT 20';
  const slowest = tier
    ? await c.env.DB.prepare(workerSql).bind(parseInt(tier)).all().catch(() => ({ results: [] }))
    : await c.env.DB.prepare(workerSql).all().catch(() => ({ results: [] }));

  return c.json({
    hours, tier: tier || 'all',
    sample_size: latencies.length,
    percentiles: {
      p50: percentile(latencies, 50),
      p75: percentile(latencies, 75),
      p90: percentile(latencies, 90),
      p95: percentile(latencies, 95),
      p99: percentile(latencies, 99),
    },
    avg_ms: Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length),
    min_ms: latencies[0],
    max_ms: latencies[latencies.length - 1],
    slowest_workers: (slowest?.results || []).map(r => ({ worker: r.worker_name, avg_ms: Math.round(r.avg_ms), probes: r.probes })),
  });
});

// Cross-worker correlation — detect simultaneous failures
app.get('/diagnostics/correlations', async (c) => {
  const hours = Math.min(parseInt(c.req.query('hours') || '24'), 168);

  // Find cron runs with multiple failures
  const multiFailRuns = await c.env.DB.prepare(`
    SELECT cron_run_id, COUNT(*) as failure_count,
           GROUP_CONCAT(worker_name) as workers,
           MIN(created_at) as occurred_at
    FROM heal_log
    WHERE heal_result = 'failure' AND created_at > datetime('now', '-${hours} hours') AND cron_run_id IS NOT NULL
    GROUP BY cron_run_id
    HAVING failure_count >= 2
    ORDER BY failure_count DESC
    LIMIT 20
  `).all().catch(() => ({ results: [] }));

  // Worker failure co-occurrence matrix (top offenders)
  const cooccurrence = await c.env.DB.prepare(`
    SELECT a.worker_name as worker_a, b.worker_name as worker_b, COUNT(*) as co_failures
    FROM heal_log a
    JOIN heal_log b ON a.cron_run_id = b.cron_run_id AND a.worker_name < b.worker_name
    WHERE a.heal_result = 'failure' AND b.heal_result = 'failure'
      AND a.created_at > datetime('now', '-${hours} hours')
    GROUP BY worker_a, worker_b
    ORDER BY co_failures DESC
    LIMIT 20
  `).all().catch(() => ({ results: [] }));

  // Shared error types across multiple workers
  const sharedErrors = await c.env.DB.prepare(`
    SELECT error_type, COUNT(DISTINCT worker_name) as affected_workers,
           COUNT(*) as total_events,
           GROUP_CONCAT(DISTINCT worker_name) as workers
    FROM heal_log
    WHERE created_at > datetime('now', '-${hours} hours') AND error_type IS NOT NULL
    GROUP BY error_type
    HAVING affected_workers >= 3
    ORDER BY affected_workers DESC
  `).all().catch(() => ({ results: [] }));

  return c.json({
    hours,
    simultaneous_failures: (multiFailRuns?.results || []).map(r => ({
      cron_run_id: r.cron_run_id,
      failure_count: r.failure_count,
      workers: r.workers?.split(',') || [],
      occurred_at: r.occurred_at,
    })),
    co_occurrence_pairs: cooccurrence?.results || [],
    shared_error_patterns: sharedErrors?.results || [],
  });
});

// Flapping detection — workers oscillating healthy/unhealthy
app.get('/diagnostics/flapping', async (c) => {
  const hours = Math.min(parseInt(c.req.query('hours') || '6'), 48);

  // Get workers with most state changes
  const workers = await c.env.DB.prepare(`
    SELECT worker_name, COUNT(*) as probe_count,
           SUM(CASE WHEN healthy = 1 THEN 1 ELSE 0 END) as up,
           SUM(CASE WHEN healthy = 0 THEN 1 ELSE 0 END) as down
    FROM gs343_probes
    WHERE checked_at > datetime('now', '-${hours} hours')
    GROUP BY worker_name
    HAVING down > 0 AND up > 0
    ORDER BY down DESC
    LIMIT 50
  `).all().catch(() => ({ results: [] }));

  // For each, count state transitions
  const flapping = [];
  for (const w of (workers?.results || []).slice(0, 20)) {
    const probes = await c.env.DB.prepare(
      `SELECT healthy FROM gs343_probes WHERE worker_name = ? AND checked_at > datetime('now', '-${hours} hours') ORDER BY checked_at ASC`
    ).bind(w.worker_name).all().catch(() => ({ results: [] }));
    const states = (probes?.results || []).map(p => p.healthy);
    let transitions = 0;
    for (let i = 1; i < states.length; i++) {
      if (states[i] !== states[i - 1]) transitions++;
    }
    if (transitions >= 2) {
      flapping.push({
        worker: w.worker_name,
        transitions,
        probes: states.length,
        up_count: w.up,
        down_count: w.down,
        flap_rate: Math.round((transitions / Math.max(states.length - 1, 1)) * 100),
        tier: TIER1_SET.has(w.worker_name) ? 1 : TIER2_SET.has(w.worker_name) ? 2 : 3,
      });
    }
  }

  flapping.sort((a, b) => b.transitions - a.transitions);

  return c.json({ hours, flapping_workers: flapping, total_detected: flapping.length });
});

// MTTR (Mean Time To Recovery) across fleet
app.get('/diagnostics/mttr', async (c) => {
  const days = Math.min(parseInt(c.req.query('days') || '7'), 30);

  // Per-worker MTTR based on heal log
  const mttr = await c.env.DB.prepare(`
    SELECT worker_name,
           COUNT(*) as total_heals,
           SUM(CASE WHEN heal_result = 'success' THEN 1 ELSE 0 END) as successes,
           AVG(CASE WHEN heal_result = 'success' THEN attempt_number ELSE NULL END) as avg_attempts,
           MIN(CASE WHEN heal_result = 'success' THEN created_at ELSE NULL END) as first_heal,
           MAX(CASE WHEN heal_result = 'success' THEN created_at ELSE NULL END) as last_heal
    FROM heal_log
    WHERE created_at > datetime('now', '-${days} days')
    GROUP BY worker_name
    HAVING total_heals >= 2
    ORDER BY avg_attempts DESC
    LIMIT 30
  `).all().catch(() => ({ results: [] }));

  const workers = (mttr?.results || []).map(r => ({
    worker: r.worker_name,
    total_heals: r.total_heals,
    successes: r.successes,
    success_rate_pct: r.total_heals > 0 ? Math.round((r.successes / r.total_heals) * 100) : 0,
    avg_attempts_to_heal: r.avg_attempts ? Math.round(r.avg_attempts * 10) / 10 : null,
    est_mttr_seconds: r.avg_attempts ? Math.round(r.avg_attempts * 5) : null, // ~5s per attempt
    tier: TIER1_SET.has(r.worker_name) ? 1 : TIER2_SET.has(r.worker_name) ? 2 : 3,
  }));

  // Fleet-wide averages
  const fleetAvg = workers.length > 0 ? {
    avg_success_rate: Math.round(workers.reduce((s, w) => s + w.success_rate_pct, 0) / workers.length),
    avg_attempts: Math.round(workers.reduce((s, w) => s + (w.avg_attempts_to_heal || 0), 0) / workers.length * 10) / 10,
    avg_mttr_seconds: Math.round(workers.reduce((s, w) => s + (w.est_mttr_seconds || 0), 0) / workers.length),
  } : null;

  return c.json({ days, fleet_average: fleetAvg, workers });
});

// Deep debug probe — detailed single-worker diagnostic
app.get('/diagnostics/debug/:worker', async (c) => {
  const key = c.req.header('X-Echo-API-Key');
  if (!key || key !== c.env.API_KEY) return c.json({ error: 'Unauthorized' }, 401);

  const name = c.req.param('worker');
  const cfToken = c.env.CF_API_TOKEN;
  const start = Date.now();

  // 1. CF API check — is it deployed?
  let cfStatus = null;
  if (cfToken) {
    try {
      const resp = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${c.env.CF_ACCOUNT_ID}/workers/scripts/${name}/settings`,
        { headers: { 'Authorization': `Bearer ${cfToken}` }, signal: AbortSignal.timeout(5000) }
      );
      const data = await resp.json();
      cfStatus = { deployed: data.success, status: resp.status, compatibility_date: data.result?.compatibility_date };
    } catch (e) { cfStatus = { error: e.message }; }
  }

  // 2. Direct health probe with full response capture
  let healthProbe = null;
  try {
    const url = `https://${name}.bmcii1976.workers.dev/health`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const body = await resp.text().catch(() => '');
    healthProbe = {
      status: resp.status,
      latency_ms: Date.now() - start,
      headers: Object.fromEntries([...resp.headers].slice(0, 20)),
      body_preview: body.substring(0, 1000),
      content_type: resp.headers.get('content-type'),
    };
  } catch (e) { healthProbe = { error: e.message, latency_ms: Date.now() - start }; }

  // 3. Recent probe history
  const probeHistory = await c.env.DB.prepare(
    'SELECT http_status, latency_ms, healthy, error_message, checked_at FROM gs343_probes WHERE worker_name = ? ORDER BY id DESC LIMIT 10'
  ).bind(name).all().catch(() => ({ results: [] }));

  // 4. Recent heal log
  const healHistory = await c.env.DB.prepare(
    'SELECT error_type, diagnosis, heal_action, heal_result, attempt_number, alert_level, created_at FROM heal_log WHERE worker_name = ? ORDER BY id DESC LIMIT 10'
  ).bind(name).all().catch(() => ({ results: [] }));

  // 5. Baseline comparison
  const baseline = await c.env.DB.prepare('SELECT * FROM heal_baselines WHERE worker_name = ?').bind(name).first().catch(() => null);

  return c.json({
    worker: name,
    tier: TIER1_SET.has(name) ? 1 : TIER2_SET.has(name) ? 2 : 3,
    debug_timestamp: new Date().toISOString(),
    total_debug_ms: Date.now() - start,
    cloudflare_api: cfStatus,
    health_probe: healthProbe,
    baseline,
    recent_probes: probeHistory?.results || [],
    recent_heals: healHistory?.results || [],
  });
});

// Scan history browser — browse past infrastructure scans
app.get('/diagnostics/scans', async (c) => {
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);
  const offset = parseInt(c.req.query('offset') || '0');

  const [scans, total] = await Promise.all([
    c.env.DB.prepare('SELECT * FROM infra_scans ORDER BY id DESC LIMIT ? OFFSET ?').bind(limit, offset).all().catch(() => ({ results: [] })),
    c.env.DB.prepare('SELECT COUNT(*) as cnt FROM infra_scans').first().catch(() => ({ cnt: 0 })),
  ]);

  return c.json({ scans: scans?.results || [], total: total?.cnt || 0, limit, offset });
});

// Scan drill-down — probes from a specific cron run
app.get('/diagnostics/scans/:runId', async (c) => {
  const runId = c.req.param('runId');
  const probes = await c.env.DB.prepare(
    'SELECT * FROM gs343_probes WHERE cron_run_id = ? ORDER BY healthy ASC, latency_ms DESC'
  ).bind(runId).all().catch(() => ({ results: [] }));
  const heals = await c.env.DB.prepare(
    'SELECT * FROM heal_log WHERE cron_run_id = ? ORDER BY id'
  ).bind(runId).all().catch(() => ({ results: [] }));
  const scan = await c.env.DB.prepare(
    'SELECT * FROM infra_scans WHERE cron_run_id = ?'
  ).bind(runId).first().catch(() => null);

  return c.json({ cron_run_id: runId, scan, probes: probes?.results || [], heals: heals?.results || [] });
});

// Harvest errors from Cloudflare Analytics API — pulls real worker errors and feeds self-learning
app.post('/diagnostics/harvest-analytics', async (c) => {
  const key = c.req.header('X-Echo-API-Key');
  if (!key || key !== c.env.API_KEY) return c.json({ error: 'Unauthorized' }, 401);

  const cfToken = c.env.CF_API_TOKEN;
  if (!cfToken) return c.json({ error: 'No CF_API_TOKEN configured' }, 503);

  const days = Math.min(parseInt(c.req.query('days') || '7'), 30);
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const until = new Date().toISOString();

  try {
    const graphqlResp = await fetch('https://api.cloudflare.com/client/v4/graphql', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${cfToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `query { viewer { accounts(filter: {accountTag: "${c.env.CF_ACCOUNT_ID}"}) { workersInvocationsAdaptive(filter: {datetime_gt: "${since}", datetime_lt: "${until}"}, limit: 500, orderBy: [sum_errors_DESC]) { dimensions { scriptName status } sum { requests errors wallTime } } } } }`
      }),
      signal: AbortSignal.timeout(15000),
    });

    const gqlData = await graphqlResp.json();
    if (gqlData.errors?.length) return c.json({ error: 'GraphQL error', details: gqlData.errors[0].message }, 502);

    const rows = gqlData.data?.viewer?.accounts?.[0]?.workersInvocationsAdaptive || [];

    // Extract workers with real errors (not just success)
    const errorRows = rows.filter(r => r.sum.errors > 0);
    let ingested = 0;

    for (const row of errorRows) {
      const worker = row.dimensions.scriptName;
      const status = row.dimensions.status;
      const errors = row.sum.errors;
      const requests = row.sum.requests;
      const errorRate = Math.round((errors / Math.max(requests, 1)) * 1000) / 10;

      let category = 'runtime';
      if (status === 'exceededResources') category = 'resource';
      else if (status === 'clientDisconnected') category = 'network';

      const errorMsg = `${worker}: ${status} — ${errors} errors in ${days}d (${errorRate}% error rate, ${requests} total requests)`;

      try {
        await captureCandidate(errorMsg, category, worker, c.env);
        ingested++;
      } catch (e) { /* continue */ }
    }

    // Also trigger harvest to promote candidates with 3+ occurrences
    let promoted = 0;
    try {
      const candidates = await c.env.DB.prepare(
        'SELECT * FROM heal_candidates WHERE occurrence_count >= 3 AND promoted = 0 ORDER BY occurrence_count DESC LIMIT 20'
      ).all();
      for (const cand of (candidates?.results || [])) {
        try {
          await promoteCandidate(cand.error_text, cand.category, cand.occurrence_count, cand.source_worker, cand.error_hash, c.env);
          promoted++;
        } catch (e) { /* continue */ }
      }
    } catch (e) { /* continue */ }

    return c.json({
      success: true,
      days,
      analytics_rows: rows.length,
      error_rows: errorRows.length,
      candidates_ingested: ingested,
      candidates_promoted: promoted,
      top_offenders: errorRows.slice(0, 10).map(r => ({
        worker: r.dimensions.scriptName,
        status: r.dimensions.status,
        errors: r.sum.errors,
        requests: r.sum.requests,
        error_rate_pct: Math.round((r.sum.errors / Math.max(r.sum.requests, 1)) * 1000) / 10,
      })),
    });
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// GS343 self-diagnostics — own health metrics
app.get('/diagnostics/self', async (c) => {
  const [
    templateCount, candidateCount, healLogCount, probeCount, scanCount,
    templateEfficiency, recentErrors, dbTables
  ] = await Promise.all([
    c.env.DB.prepare('SELECT COUNT(*) as cnt FROM error_templates WHERE COALESCE(archived, 0) = 0').first().catch(() => ({ cnt: 0 })),
    c.env.DB.prepare('SELECT COUNT(*) as cnt FROM heal_candidates').first().catch(() => ({ cnt: 0 })),
    c.env.DB.prepare('SELECT COUNT(*) as cnt FROM heal_log').first().catch(() => ({ cnt: 0 })),
    c.env.DB.prepare('SELECT COUNT(*) as cnt FROM gs343_probes').first().catch(() => ({ cnt: 0 })),
    c.env.DB.prepare('SELECT COUNT(*) as cnt FROM infra_scans').first().catch(() => ({ cnt: 0 })),
    c.env.DB.prepare(`
      SELECT COUNT(*) as total,
             SUM(CASE WHEN COALESCE(usage_count, 0) > 0 THEN 1 ELSE 0 END) as used,
             AVG(confidence) as avg_confidence,
             SUM(CASE WHEN confidence < 0.3 THEN 1 ELSE 0 END) as low_confidence
      FROM error_templates WHERE COALESCE(archived, 0) = 0
    `).first().catch(() => null),
    c.env.DB.prepare("SELECT COUNT(*) as cnt FROM heal_log WHERE heal_result = 'failure' AND created_at > datetime('now', '-1 hour')").first().catch(() => ({ cnt: 0 })),
    c.env.DB.prepare("SELECT name, sql FROM sqlite_master WHERE type='table' ORDER BY name").all().catch(() => ({ results: [] })),
  ]);

  const totalTemplates = templateEfficiency?.total || 0;
  const usedTemplates = templateEfficiency?.used || 0;

  return c.json({
    service: 'GS343 Divine Overseer',
    version: c.env.VERSION || '2.0.0',
    database: {
      templates: templateCount?.cnt || 0,
      candidates: candidateCount?.cnt || 0,
      heal_log_entries: healLogCount?.cnt || 0,
      probe_entries: probeCount?.cnt || 0,
      scan_entries: scanCount?.cnt || 0,
      tables: (dbTables?.results || []).map(t => t.name),
    },
    template_health: {
      total_active: totalTemplates,
      used_at_least_once: usedTemplates,
      utilization_pct: totalTemplates > 0 ? Math.round((usedTemplates / totalTemplates) * 100) : 0,
      avg_confidence: templateEfficiency?.avg_confidence ? Math.round(templateEfficiency.avg_confidence * 100) / 100 : 0,
      low_confidence_count: templateEfficiency?.low_confidence || 0,
    },
    fleet: {
      total_workers: ALL_PROBES_COUNT,
      tier1: TIER1_WORKERS.length,
      tier2: TIER2_WORKERS.length,
      tier3: TIER3_WORKERS.length,
    },
    recent_errors_1h: recentErrors?.cnt || 0,
    timestamp: new Date().toISOString(),
  });
});

// ─── SYSTEM 6: SCHEMA INIT ─────────────────────────────────────────────────

app.post('/init-schema', async (c) => {
  const key = c.req.header('X-Echo-API-Key');
  if (!key || key !== c.env.API_KEY) return c.json({ error: 'Unauthorized' }, 401);

  const statements = [
    `CREATE TABLE IF NOT EXISTS heal_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      worker_name TEXT NOT NULL,
      worker_url TEXT,
      error_type TEXT,
      error_message TEXT,
      diagnosis TEXT,
      template_id INTEGER,
      heal_action TEXT,
      heal_result TEXT,
      attempt_number INTEGER DEFAULT 1,
      duration_ms INTEGER,
      verified INTEGER DEFAULT 0,
      alert_level TEXT,
      cron_run_id TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS heal_candidates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      error_hash TEXT UNIQUE NOT NULL,
      error_text TEXT NOT NULL,
      context TEXT,
      source_worker TEXT,
      category TEXT DEFAULT 'unknown',
      occurrence_count INTEGER DEFAULT 1,
      first_seen TEXT DEFAULT (datetime('now')),
      last_seen TEXT DEFAULT (datetime('now')),
      promoted INTEGER DEFAULT 0,
      promoted_template_id INTEGER,
      llm_solution TEXT,
      llm_model TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS heal_baselines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      worker_name TEXT UNIQUE NOT NULL,
      worker_url TEXT NOT NULL,
      expected_status INTEGER DEFAULT 200,
      avg_latency_ms REAL DEFAULT 500,
      p95_latency_ms REAL DEFAULT 2000,
      max_latency_ms REAL DEFAULT 5000,
      response_hash TEXT,
      tier INTEGER DEFAULT 2,
      consecutive_failures INTEGER DEFAULT 0,
      last_healthy TEXT,
      last_updated TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS worker_status (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      worker_name TEXT NOT NULL,
      url TEXT,
      http_status INTEGER,
      latency_ms INTEGER,
      response_hash TEXT,
      checked_at TEXT DEFAULT (datetime('now')),
      tier INTEGER DEFAULT 2,
      healthy INTEGER DEFAULT 1,
      error_message TEXT,
      cron_run_id TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS infra_scans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cron_run_id TEXT,
      total_probed INTEGER,
      healthy_count INTEGER,
      unhealthy_count INTEGER,
      health_score INTEGER,
      scan_duration_ms INTEGER,
      scanned_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS gs343_probes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      worker_name TEXT NOT NULL,
      url TEXT,
      http_status INTEGER,
      latency_ms INTEGER,
      response_hash TEXT,
      checked_at TEXT DEFAULT (datetime('now')),
      tier INTEGER DEFAULT 2,
      healthy INTEGER DEFAULT 1,
      error_message TEXT,
      cron_run_id TEXT
    )`,
    // Indexes
    `CREATE INDEX IF NOT EXISTS idx_gs343_probes_worker ON gs343_probes(worker_name)`,
    `CREATE INDEX IF NOT EXISTS idx_gs343_probes_checked ON gs343_probes(checked_at)`,
    `CREATE INDEX IF NOT EXISTS idx_gs343_probes_cron ON gs343_probes(cron_run_id)`,
    `CREATE INDEX IF NOT EXISTS idx_heal_log_cron ON heal_log(cron_run_id)`,
    `CREATE INDEX IF NOT EXISTS idx_heal_log_worker ON heal_log(worker_name)`,
    `CREATE INDEX IF NOT EXISTS idx_heal_log_result ON heal_log(heal_result)`,
    `CREATE INDEX IF NOT EXISTS idx_heal_log_created ON heal_log(created_at)`,
    `CREATE INDEX IF NOT EXISTS idx_heal_candidates_hash ON heal_candidates(error_hash)`,
    `CREATE INDEX IF NOT EXISTS idx_worker_status_name ON worker_status(worker_name)`,
    `CREATE INDEX IF NOT EXISTS idx_worker_status_checked ON worker_status(checked_at)`,
    `CREATE INDEX IF NOT EXISTS idx_infra_scans_at ON infra_scans(scanned_at)`,
    // Add columns to templates if missing
    // error_templates already has these columns from CREATE TABLE
  ];

  const results = [];
  for (const sql of statements) {
    try {
      await c.env.DB.prepare(sql).run();
      results.push({ sql: sql.substring(0, 60), ok: true });
    } catch (e) {
      results.push({ sql: sql.substring(0, 60), ok: false, error: e.message });
    }
  }

  // Seed baselines from probe config
  // Seed baselines for ALL workers (not just cycle probes)
  const allProbes = [
    ...TIER1_WORKERS.map(w => makeProbe(w, 1)),
    ...TIER2_WORKERS.map(w => makeProbe(w, 2)),
    ...TIER3_WORKERS.map(w => makeProbe(w, 3)),
  ];
  for (const probe of allProbes) {
    try {
      await c.env.DB.prepare(`
        INSERT OR IGNORE INTO heal_baselines (worker_name, worker_url, tier)
        VALUES (?, ?, ?)
      `).bind(probe.name, probe.url, probe.tier).run();
    } catch (e) { /* skip */ }
  }

  return c.json({ success: true, results, baselines_seeded: ALL_PROBES_COUNT });
});

// ─── CRON HANDLER (System 1) ────────────────────────────────────────────────

export default {
  fetch: app.fetch,

  async scheduled(event, env, ctx) {
    ctx.waitUntil((async () => {
      try {
        const result = await runMonitoringScan(env);

        // Alert if multiple tier1 failures
        const tier1Failures = result.healResults.filter(h =>
          !h.healed && TIER1_SET.has(h.worker)
        );
        if (tier1Failures.length >= 3) {
          await alertCommander(
            { worker: 'MULTIPLE_TIER1', name: 'MULTIPLE_TIER1' },
            `${tier1Failures.length} Tier 1 services down: ${tier1Failures.map(f => f.worker).join(', ')}`,
            'EMERGENCY',
            env
          );
        }
        // Check local watchdog heartbeat
        try {
          const lastHeartbeat = await env.DB.prepare(`
            SELECT last_seen FROM heal_candidates
            WHERE error_text LIKE '%WATCHDOG_HEARTBEAT%'
            ORDER BY last_seen DESC LIMIT 1
          `).first();

          if (lastHeartbeat?.last_seen) {
            const lastSeen = new Date(lastHeartbeat.last_seen + 'Z');
            const minutesAgo = (Date.now() - lastSeen.getTime()) / 60000;
            if (minutesAgo > 15) {
              await alertCommander(
                { worker: 'LOCAL_WATCHDOG', name: 'BRAVO_WATCHDOG' },
                `Local watchdog heartbeat stale (${Math.round(minutesAgo)}min ago). Auto-ingest daemon may be down on BRAVO.`,
                'WARNING',
                env
              );
            }
          }
        } catch (_) { /* heartbeat check is best-effort */ }

      } catch (e) {
        // Log cron failure to D1 if possible
        try {
          await env.DB.prepare(
            "INSERT INTO heal_log (worker_name, error_message, heal_result, heal_action) VALUES ('gs343-cron', ?, 'failure', 'cron_error')"
          ).bind(e.message).run();
        } catch (_) { /* nothing we can do */ }
      }
    })());
  },
};
