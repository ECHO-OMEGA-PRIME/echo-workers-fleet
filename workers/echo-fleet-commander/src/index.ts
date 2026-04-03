/**
 * Echo Fleet Commander v1.3.0
 * Monitors, scores, and commands the entire Echo Prime Cloudflare fleet.
 *
 * Security fixes applied:
 *   C45 - Auth gate now returns 503 when ECHO_API_KEY secret is unset
 *   C46 - All SQL queries use parameterized bind variables (no interpolation)
 *   H59 - 500 responses return sanitized error messages (no stack/details)
 *   CORS - Origin allowlist enforced (echo-ept.com, echo-op.com)
 */

export interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  ECHO_API_KEY: string;
  SHARED_BRAIN: Fetcher;
  SWARM_BRAIN: Fetcher;
  SERVICE_REGISTRY: Fetcher;
  DAEMON: Fetcher;
  [key: string]: any;
}

interface HealthResult {
  worker: string;
  healthy: boolean;
  latencyMs: number;
  version?: string;
  status?: string;
  error?: string;
  checkedAt: string;
}

interface FleetWorker {
  name: string;
  binding: string;
  healthPath: string;
  category: string;
  critical: boolean;
  dependsOn: string[];
  secrets: string[];
  crons: string[];
  description: string;
  tier: string;
  publicUrl?: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────
const SERVICE = "echo-fleet-commander";
const VERSION = "1.3.0";

const ALLOWED_ORIGINS = [
  "https://echo-ept.com",
  "https://echo-op.com",
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function log(level: string, message: string, data: Record<string, any> = {}) {
  const entry = { timestamp: new Date().toISOString(), level, service: SERVICE, message, ...data };
  if (level === "error") console.error(JSON.stringify(entry));
  else console.log(JSON.stringify(entry));
}

function getCorsOrigin(request: Request): string {
  const origin = request.headers.get("Origin") || "";
  if (ALLOWED_ORIGINS.includes(origin)) return origin;
  return ALLOWED_ORIGINS[0]; // default — won't match random origins
}

function json(data: any, status = 200, request?: Request): Response {
  const origin = request ? getCorsOrigin(request) : ALLOWED_ORIGINS[0];
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Headers": "Content-Type, X-Echo-API-Key",
      "X-Fleet-Commander": VERSION,
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-XSS-Protection": "1; mode=block",
      "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
  });
}

// ─── Fleet Registry ─────────────────────────────────────────────────────────

const FLEET_REGISTRY: FleetWorker[] = [
  // T0: Brain Layer
  { name: "echo-shared-brain", binding: "SHARED_BRAIN", healthPath: "/health", category: "core", critical: true, dependsOn: [], secrets: ["ECHO_API_KEY"], crons: [], description: "Unified memory layer — D1+KV+R2+Vectorize, semantic search, mobile context", tier: "T0" },
  { name: "omniscient-sync", binding: "OMNISYNC", healthPath: "/", category: "core", critical: true, dependsOn: [], secrets: [], crons: [], description: "Cross-instance sync — todos, policies, broadcasts, memory keys", tier: "T0" },
  { name: "echo-swarm-brain", binding: "SWARM_BRAIN", healthPath: "/health", category: "core", critical: true, dependsOn: [], secrets: ["ECHO_API_KEY"], crons: [], description: "MoltBook feed, inter-agent communication, swarm coordination", tier: "T0" },
  { name: "echo-vault-api", binding: "VAULT_API", healthPath: "/health", category: "core", critical: true, dependsOn: [], secrets: ["ECHO_API_KEY", "ENCRYPTION_KEY"], crons: [], description: "Credential vault — 1,527+ secrets, encrypted at rest, audit trail", tier: "T0" },
  // T1: Engine Layer
  { name: "echo-engine-runtime", binding: "ENGINE_RUNTIME", healthPath: "/health", category: "intelligence", critical: true, dependsOn: ["echo-shared-brain"], secrets: ["ECHO_API_KEY"], crons: [], description: "5,400+ engines, 697K+ doctrines, 940+ domains — primary intelligence", tier: "T1" },
  { name: "echo-knowledge-forge", binding: "KNOWLEDGE_FORGE", healthPath: "/health", category: "intelligence", critical: true, dependsOn: ["echo-shared-brain"], secrets: ["ECHO_API_KEY"], crons: [], description: "12K+ docs, 175+ categories, 75K+ chunks — knowledge retrieval", tier: "T1" },
  { name: "echo-doctrine-forge", binding: "DOCTRINE_FORGE", healthPath: "/health", category: "intelligence", critical: false, dependsOn: ["echo-engine-runtime"], secrets: ["ECHO_API_KEY"], crons: [], description: "Doctrine generation — 24 FREE LLM providers, TIE gold standard blocks", tier: "T1" },
  { name: "echo-chat", binding: "ECHO_CHAT", healthPath: "/health", category: "core", critical: true, dependsOn: ["echo-engine-runtime", "echo-shared-brain"], secrets: ["ECHO_API_KEY"], crons: [], description: "14 AI personalities, 5 LLM providers, domain-aware conversation", tier: "T1" },
  { name: "echo-sdk-gateway", binding: "SDK", healthPath: "/health", category: "core", critical: true, dependsOn: ["echo-engine-runtime", "echo-knowledge-forge"], secrets: ["ECHO_API_KEY"], crons: [], description: "Unified SDK — 23 endpoints, OpenAPI spec, engine+knowledge+brain access", tier: "T1" },
  { name: "echo-ai-orchestrator", binding: "AI_ORCHESTRATOR", healthPath: "/health", category: "intelligence", critical: false, dependsOn: [], secrets: ["ECHO_API_KEY"], crons: [], description: "29 LLM workers, multi-model inference, failover chains", tier: "T1" },
  // T2: Product Layer
  { name: "echo-build-orchestrator", binding: "BUILD_ORCH", healthPath: "/status", category: "infra", critical: true, dependsOn: [], secrets: ["ECHO_API_KEY"], crons: [], description: "Build pipeline — sessions, gates, deploys, D1 state", tier: "T2" },
  { name: "echo-autonomous-daemon", binding: "DAEMON", healthPath: "/health", category: "infra", critical: true, dependsOn: ["echo-shared-brain", "echo-fleet-commander"], secrets: ["ECHO_API_KEY"], crons: [], description: "6-cycle autonomous ops — patrol, optimize, heal, report", tier: "T2" },
  { name: "echo-service-registry", binding: "SERVICE_REGISTRY", healthPath: "/health", category: "infra", critical: true, dependsOn: [], secrets: ["ECHO_API_KEY"], crons: [], description: "Service mesh — heartbeats, discovery, dependency graph, routing", tier: "T2" },
  { name: "echo-deploy-pipeline", binding: "DEPLOY_PIPE", healthPath: "/health", category: "infra", critical: false, dependsOn: ["echo-build-orchestrator"], secrets: ["ECHO_API_KEY"], crons: [], description: "Deploy automation — canary, rollback, multi-env promotion", tier: "T2" },
  { name: "echo-qa-tester", binding: "QA_TESTER", healthPath: "/health", category: "infra", critical: false, dependsOn: ["echo-service-registry"], secrets: ["ECHO_API_KEY"], crons: [], description: "Automated QA — endpoint testing, contract validation, regression", tier: "T2" },
  { name: "echo-speak-cloud", binding: "SPEAK_CLOUD", healthPath: "/health", category: "utility", critical: false, dependsOn: [], secrets: ["ECHO_API_KEY", "ELEVENLABS_API_KEY"], crons: [], description: "Voice TTS — GPU tunnel, ElevenLabs fallback, audio streaming", tier: "T2" },
  { name: "echo-scheduler", binding: "SCHEDULER", healthPath: "/health", category: "infra", critical: false, dependsOn: [], secrets: ["ECHO_API_KEY"], crons: [], description: "Task scheduling — cron management, delayed execution, batch jobs", tier: "T2" },
  { name: "echo-analytics", binding: "ANALYTICS", healthPath: "/health", category: "infra", critical: false, dependsOn: ["echo-shared-brain"], secrets: ["ECHO_API_KEY"], crons: [], description: "Analytics engine — event tracking, dashboards, usage metrics", tier: "T2" },
  { name: "echo-notification-hub", binding: "NOTIFY_HUB", healthPath: "/health", category: "utility", critical: false, dependsOn: [], secrets: ["ECHO_API_KEY"], crons: [], description: "Multi-channel notifications — email, SMS, push, webhook", tier: "T2" },
  { name: "echo-content-pipeline", binding: "CONTENT_PIPE", healthPath: "/health", category: "product", critical: false, dependsOn: ["echo-ai-orchestrator"], secrets: ["ECHO_API_KEY"], crons: [], description: "Content generation — articles, social posts, newsletters", tier: "T2" },
  { name: "echo-media-processor", binding: "MEDIA_PROC", healthPath: "/health", category: "utility", critical: false, dependsOn: [], secrets: ["ECHO_API_KEY"], crons: [], description: "Media processing — image resize, video transcode, thumbnails", tier: "T2" },
  { name: "echo-webhook-relay", binding: "WEBHOOK_RELAY", healthPath: "/health", category: "infra", critical: false, dependsOn: [], secrets: ["ECHO_API_KEY"], crons: [], description: "Webhook management — routing, retry, transformation, logging", tier: "T2" },
  { name: "echo-api-gateway", binding: "API_GW", healthPath: "/health", category: "infra", critical: true, dependsOn: [], secrets: ["ECHO_API_KEY"], crons: [], description: "API gateway — rate limiting, auth, routing, transformation", tier: "T2" },
  { name: "echo-cache-manager", binding: "CACHE_MGR", healthPath: "/health", category: "infra", critical: false, dependsOn: [], secrets: ["ECHO_API_KEY"], crons: [], description: "Cache orchestration — KV management, invalidation, warming", tier: "T2" },
  // T2: Bot Layer
  { name: "echo-x-bot", binding: "X_BOT", healthPath: "/health", category: "bot", critical: false, dependsOn: [], secrets: ["API_KEY", "API_SECRET", "ACCESS_TOKEN", "ACCESS_TOKEN_SECRET", "BEARER_TOKEN", "ECHO_API_KEY", "GROK_API_KEY"], crons: [], description: "X/Twitter bot — auto-post, engagement, analytics", tier: "T2" },
  { name: "echo-linkedin-bot", binding: "LINKEDIN_BOT", healthPath: "/health", category: "bot", critical: false, dependsOn: [], secrets: ["LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET", "LINKEDIN_ACCESS_TOKEN", "LINKEDIN_PERSON_ID", "ECHO_API_KEY", "GROK_API_KEY"], crons: [], description: "LinkedIn bot — professional posting, network growth", tier: "T2" },
  { name: "echo-telegram-bot", binding: "TELEGRAM_BOT", healthPath: "/health", category: "bot", critical: false, dependsOn: [], secrets: ["TELEGRAM_BOT_TOKEN", "TELEGRAM_WEBHOOK_SECRET", "ECHO_API_KEY"], crons: [], description: "Telegram bot — commands, alerts, group management", tier: "T2" },
  { name: "echo-slack-bot", binding: "SLACK_BOT", healthPath: "/health", category: "bot", critical: false, dependsOn: [], secrets: ["SLACK_BOT_TOKEN", "SLACK_SIGNING_SECRET", "ECHO_API_KEY", "GROK_API_KEY"], crons: [], description: "Slack bot — workspace integration, alerts, commands", tier: "T2" },
  { name: "echo-reddit-bot", binding: "REDDIT_BOT", healthPath: "/health", category: "bot", critical: false, dependsOn: [], secrets: ["REDDIT_CLIENT_ID", "REDDIT_CLIENT_SECRET", "REDDIT_USERNAME", "REDDIT_PASSWORD", "ECHO_API_KEY"], crons: [], description: "Reddit bot — subreddit monitoring, posting, engagement", tier: "T2" },
  // T2: Scrapers
  { name: "echo-web-scraper", binding: "WEB_SCRAPER", healthPath: "/health", category: "scraper", critical: false, dependsOn: [], secrets: ["ECHO_API_KEY"], crons: [], description: "Web scraping — multi-target, proxy rotation, data extraction", tier: "T2" },
  { name: "echo-data-collector", binding: "DATA_COLLECTOR", healthPath: "/health", category: "scraper", critical: false, dependsOn: [], secrets: ["ECHO_API_KEY"], crons: [], description: "Data collection — structured extraction, scheduling, dedup", tier: "T2" },
  { name: "echo-rss-monitor", binding: "RSS_MONITOR", healthPath: "/health", category: "scraper", critical: false, dependsOn: [], secrets: ["ECHO_API_KEY"], crons: [], description: "RSS monitoring — feed tracking, new item detection, alerts", tier: "T2" },
  { name: "echo-price-tracker", binding: "PRICE_TRACKER", healthPath: "/health", category: "scraper", critical: false, dependsOn: [], secrets: ["ECHO_API_KEY"], crons: [], description: "Price tracking — crypto, stocks, commodities, alerts", tier: "T2" },
  // T2: Products
  { name: "echo-ept-api", binding: "EPT_API", healthPath: "/health", category: "product", critical: true, dependsOn: ["echo-engine-runtime"], secrets: ["ECHO_API_KEY"], crons: [], description: "echo-ept.com API — commercial product backend", tier: "T2" },
  { name: "echo-op-api", binding: "OP_API", healthPath: "/health", category: "product", critical: false, dependsOn: [], secrets: ["ECHO_API_KEY"], crons: [], description: "echo-op.com API — operations portal backend", tier: "T2" },
  // T2: Commerce
  { name: "echo-stripe-handler", binding: "STRIPE", healthPath: "/health", category: "product", critical: false, dependsOn: [], secrets: ["STRIPE_SECRET_KEY", "ECHO_API_KEY"], crons: [], description: "Stripe integration — payments, subscriptions, webhooks", tier: "T2" },
  { name: "echo-email-engine", binding: "EMAIL_ENGINE", healthPath: "/health", category: "utility", critical: false, dependsOn: [], secrets: ["ECHO_API_KEY"], crons: [], description: "Email engine — templates, sending, tracking, Zoho SMTP", tier: "T2" },
  // T2: Social
  { name: "echo-instagram-bot", binding: "INSTAGRAM_BOT", healthPath: "/health", category: "bot", critical: false, dependsOn: [], secrets: ["INSTAGRAM_ACCESS_TOKEN", "INSTAGRAM_VERIFY_TOKEN", "META_APP_SECRET", "ECHO_API_KEY", "GROK_API_KEY"], crons: [], description: "Instagram bot — posting, stories, engagement", tier: "T2" },
  { name: "echo-whatsapp-bot", binding: "WHATSAPP_BOT", healthPath: "/health", category: "bot", critical: false, dependsOn: [], secrets: ["WHATSAPP_TOKEN", "WHATSAPP_VERIFY_TOKEN", "META_APP_SECRET", "ECHO_API_KEY"], crons: [], description: "WhatsApp bot — messaging, business API, automation", tier: "T2" },
  { name: "echo-facebook-bot", binding: "FACEBOOK_BOT", healthPath: "/health", category: "bot", critical: false, dependsOn: [], secrets: ["FB_PAGE_ACCESS_TOKEN", "FB_VERIFY_TOKEN", "FB_APP_SECRET", "ECHO_API_KEY"], crons: [], description: "Facebook bot — page management, messaging, posting", tier: "T2" },
  { name: "echo-social-aggregator", binding: "SOCIAL_AGG", healthPath: "/health", category: "bot", critical: false, dependsOn: [], secrets: ["ECHO_API_KEY"], crons: [], description: "Social aggregator — cross-platform analytics, unified inbox", tier: "T2" },
  // T3: Utility Layer
  { name: "echo-cron-manager", binding: "CRON_MGR", healthPath: "/health", category: "infra", critical: false, dependsOn: [], secrets: ["ECHO_API_KEY"], crons: [], description: "Cron orchestration — schedule management, execution tracking", tier: "T3" },
  { name: "echo-log-aggregator", binding: "LOG_AGG", healthPath: "/health", category: "infra", critical: false, dependsOn: [], secrets: ["ECHO_API_KEY"], crons: [], description: "Log aggregation — cross-worker log collection, search, alerts", tier: "T3" },
  { name: "echo-backup-manager", binding: "BACKUP_MGR", healthPath: "/health", category: "infra", critical: false, dependsOn: [], secrets: ["ECHO_API_KEY"], crons: [], description: "Backup automation — R2 snapshots, D1 exports, retention", tier: "T3" },
  { name: "echo-migration-engine", binding: "MIGRATION", healthPath: "/health", category: "infra", critical: false, dependsOn: [], secrets: ["ECHO_API_KEY"], crons: [], description: "Migration engine — D1 schema management, data migration", tier: "T3" },
  { name: "echo-feature-flags", binding: "FEATURE_FLAGS", healthPath: "/health", category: "infra", critical: false, dependsOn: [], secrets: ["ECHO_API_KEY"], crons: [], description: "Feature flags — gradual rollout, A/B testing, kill switches", tier: "T3" },
  { name: "echo-rate-limiter", binding: "RATE_LIMITER", healthPath: "/health", category: "infra", critical: false, dependsOn: [], secrets: ["ECHO_API_KEY"], crons: [], description: "Rate limiting — per-key, per-IP, sliding window, burst control", tier: "T3" },
  { name: "echo-health-monitor", binding: "HEALTH_MON", healthPath: "/health", category: "infra", critical: false, dependsOn: [], secrets: ["ECHO_API_KEY"], crons: [], description: "Health monitoring — uptime tracking, latency graphs, SLA reporting", tier: "T3" },
  { name: "echo-secret-rotator", binding: "SECRET_ROT", healthPath: "/health", category: "infra", critical: false, dependsOn: ["echo-vault-api"], secrets: ["ECHO_API_KEY"], crons: [], description: "Secret rotation — automated key rotation, expiry tracking", tier: "T3" },
  { name: "echo-cost-tracker", binding: "COST_TRACK", healthPath: "/health", category: "infra", critical: false, dependsOn: [], secrets: ["ECHO_API_KEY"], crons: [], description: "Cost tracking — Cloudflare usage, API costs, budget alerts", tier: "T3" },
  { name: "echo-incident-responder", binding: "INCIDENT_RESP", healthPath: "/health", category: "infra", critical: false, dependsOn: ["echo-fleet-commander"], secrets: ["ECHO_API_KEY"], crons: [], description: "Incident response — auto-remediation, runbooks, escalation", tier: "T3" },
  { name: "echo-chaos-tester", binding: "CHAOS_TEST", healthPath: "/health", category: "infra", critical: false, dependsOn: [], secrets: ["ECHO_API_KEY"], crons: [], description: "Chaos testing — fault injection, resilience testing, game days", tier: "T3" },
  { name: "echo-compliance-checker", binding: "COMPLIANCE", healthPath: "/health", category: "infra", critical: false, dependsOn: [], secrets: ["ECHO_API_KEY"], crons: [], description: "Compliance — security audit, policy enforcement, reporting", tier: "T3" },
  { name: "echo-perf-profiler", binding: "PERF_PROF", healthPath: "/health", category: "infra", critical: false, dependsOn: [], secrets: ["ECHO_API_KEY"], crons: [], description: "Performance profiler — latency analysis, bottleneck detection", tier: "T3" },
  { name: "echo-docs-generator", binding: "DOCS_GEN", healthPath: "/health", category: "utility", critical: false, dependsOn: [], secrets: ["ECHO_API_KEY"], crons: [], description: "Documentation — auto-generated API docs, changelog, guides", tier: "T3" },
  { name: "echo-test-runner", binding: "TEST_RUNNER", healthPath: "/health", category: "infra", critical: false, dependsOn: [], secrets: ["ECHO_API_KEY"], crons: [], description: "Test automation — integration tests, smoke tests, regression", tier: "T3" },
  { name: "echo-config-manager", binding: "CONFIG_MGR", healthPath: "/health", category: "infra", critical: false, dependsOn: [], secrets: ["ECHO_API_KEY"], crons: [], description: "Config management — environment vars, feature toggles, secrets", tier: "T3" },
  { name: "echo-traffic-router", binding: "TRAFFIC_ROUTER", healthPath: "/health", category: "infra", critical: false, dependsOn: [], secrets: ["ECHO_API_KEY"], crons: [], description: "Traffic routing — weighted routing, blue-green, canary deploys", tier: "T3" },
  { name: "echo-dependency-checker", binding: "DEP_CHECK", healthPath: "/health", category: "infra", critical: false, dependsOn: [], secrets: ["ECHO_API_KEY"], crons: [], description: "Dependency checker — vulnerability scanning, update tracking", tier: "T3" },
  { name: "echo-audit-trail", binding: "AUDIT_TRAIL", healthPath: "/health", category: "infra", critical: false, dependsOn: [], secrets: ["ECHO_API_KEY"], crons: [], description: "Audit trail — immutable event log, compliance, forensics", tier: "T3" },
  { name: "echo-alert-manager", binding: "ALERT_MGR", healthPath: "/health", category: "infra", critical: false, dependsOn: [], secrets: ["ECHO_API_KEY"], crons: [], description: "Alert management — rules, escalation, silencing, grouping", tier: "T3" },
  { name: "echo-capacity-planner", binding: "CAPACITY", healthPath: "/health", category: "infra", critical: false, dependsOn: [], secrets: ["ECHO_API_KEY"], crons: [], description: "Capacity planning — usage forecasting, scaling recommendations", tier: "T3" },
  { name: "echo-sla-tracker", binding: "SLA_TRACK", healthPath: "/health", category: "infra", critical: false, dependsOn: [], secrets: ["ECHO_API_KEY"], crons: [], description: "SLA tracking — uptime SLOs, error budgets, reporting", tier: "T3" },
  { name: "echo-runbook-engine", binding: "RUNBOOK", healthPath: "/health", category: "infra", critical: false, dependsOn: [], secrets: ["ECHO_API_KEY"], crons: [], description: "Runbook engine — automated remediation, playbooks, workflows", tier: "T3" },
  { name: "echo-dns-manager", binding: "DNS_MGR", healthPath: "/health", category: "infra", critical: false, dependsOn: [], secrets: ["ECHO_API_KEY"], crons: [], description: "DNS management — record management, propagation checks", tier: "T3" },
  { name: "echo-ssl-monitor", binding: "SSL_MON", healthPath: "/health", category: "infra", critical: false, dependsOn: [], secrets: ["ECHO_API_KEY"], crons: [], description: "SSL monitoring — cert expiry tracking, auto-renewal alerts", tier: "T3" },
  { name: "echo-diagnostics", binding: "DIAGNOSTICS", healthPath: "/health", category: "infra", critical: false, dependsOn: [], secrets: ["ECHO_API_KEY"], crons: [], description: "Diagnostics agent — deep health analysis, root cause detection, remediation", tier: "T3" },
];

// ─── Dependency Map ─────────────────────────────────────────────────────────

const DEPENDENCY_MAP = new Map<string, string[]>();
for (const w of FLEET_REGISTRY) {
  for (const dep of w.dependsOn) {
    const existing = DEPENDENCY_MAP.get(dep) || [];
    existing.push(w.name);
    DEPENDENCY_MAP.set(dep, existing);
  }
}

// ─── Schema ─────────────────────────────────────────────────────────────────

async function ensureSchema(db: D1Database) {
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS fleet_health (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      worker TEXT NOT NULL,
      healthy INTEGER NOT NULL DEFAULT 1,
      latency_ms INTEGER DEFAULT 0,
      version TEXT,
      status TEXT,
      error TEXT,
      tier TEXT,
      category TEXT,
      checked_at TEXT DEFAULT (datetime('now'))
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_fh_worker ON fleet_health(worker, checked_at DESC)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_fh_time ON fleet_health(checked_at DESC)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS fleet_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      total_workers INTEGER NOT NULL,
      healthy INTEGER NOT NULL,
      degraded INTEGER DEFAULT 0,
      down INTEGER DEFAULT 0,
      avg_latency_ms REAL DEFAULT 0,
      fleet_score INTEGER DEFAULT 100,
      tier_scores TEXT DEFAULT '{}',
      category_scores TEXT DEFAULT '{}',
      snapshot_type TEXT DEFAULT 'quick',
      created_at TEXT DEFAULT (datetime('now'))
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_fs_time ON fleet_snapshots(created_at DESC)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS incidents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'medium',
      status TEXT NOT NULL DEFAULT 'active',
      affected_workers TEXT DEFAULT '[]',
      timeline TEXT DEFAULT '[]',
      root_cause TEXT,
      resolution TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      resolved_at TEXT
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_inc_status ON incidents(status, created_at DESC)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS deploys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      worker TEXT NOT NULL,
      old_version TEXT,
      new_version TEXT,
      trigger TEXT DEFAULT 'cron',
      status TEXT DEFAULT 'detected',
      canary_result TEXT,
      detected_at TEXT DEFAULT (datetime('now'))
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_dep_worker ON deploys(worker, detected_at DESC)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS commands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      target_worker TEXT NOT NULL,
      command TEXT NOT NULL,
      params TEXT DEFAULT '{}',
      result TEXT,
      status TEXT DEFAULT 'pending',
      issued_by TEXT DEFAULT 'commander',
      issued_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_cmd_status ON commands(status, issued_at DESC)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS briefings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      briefing_type TEXT NOT NULL,
      content TEXT NOT NULL,
      fleet_score INTEGER DEFAULT 100,
      highlights TEXT DEFAULT '[]',
      concerns TEXT DEFAULT '[]',
      recommendations TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now'))
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_brief_type ON briefings(briefing_type, created_at DESC)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      actor TEXT DEFAULT 'fleet-commander',
      target TEXT,
      details TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now'))
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_audit_time ON audit_log(created_at DESC)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS daily_uptime (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      worker TEXT NOT NULL,
      date TEXT NOT NULL,
      checks INTEGER DEFAULT 0,
      healthy_checks INTEGER DEFAULT 0,
      uptime_pct REAL DEFAULT 100.0,
      avg_latency_ms REAL DEFAULT 0,
      max_latency_ms INTEGER DEFAULT 0,
      min_latency_ms INTEGER DEFAULT 0,
      UNIQUE(worker, date)
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_du_date ON daily_uptime(date DESC, worker)`),
  ]);
}

// ─── Health Check ───────────────────────────────────────────────────────────

async function checkWorkerHealth(worker: FleetWorker, env: Env, perWorkerTimeoutMs = 6000): Promise<HealthResult> {
  const start = Date.now();
  const now = new Date().toISOString();
  const timeoutResult: HealthResult = {
    worker: worker.name,
    healthy: false,
    latencyMs: perWorkerTimeoutMs,
    error: `Timeout after ${perWorkerTimeoutMs}ms`,
    checkedAt: now,
  };

  const check = async (): Promise<HealthResult> => {
    try {
      let resp: Response;
      const fetcher = worker.binding ? env[worker.binding] : null;
      if (fetcher) {
        resp = await fetcher.fetch(new Request(`https://internal${worker.healthPath}`));
      } else if (worker.publicUrl) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), perWorkerTimeoutMs - 500);
        try {
          resp = await fetch(`${worker.publicUrl}${worker.healthPath}`, { signal: controller.signal });
        } finally {
          clearTimeout(timeout);
        }
      } else {
        return { worker: worker.name, healthy: false, latencyMs: 0, error: "No binding or URL", checkedAt: now };
      }
      const latency = Date.now() - start;
      if (!resp.ok) {
        return { worker: worker.name, healthy: false, latencyMs: latency, status: `HTTP ${resp.status}`, checkedAt: now };
      }
      const data = await resp.json().catch(() => ({}));
      return {
        worker: worker.name,
        healthy: true,
        latencyMs: latency,
        version: data.version || data.v || undefined,
        status: data.status || "ok",
        checkedAt: now,
      };
    } catch (err: any) {
      return {
        worker: worker.name,
        healthy: false,
        latencyMs: Date.now() - start,
        error: err.message?.slice(0, 200) || "Unknown error",
        checkedAt: now,
      };
    }
  };

  return Promise.race([
    check(),
    new Promise<HealthResult>((resolve) => setTimeout(() => resolve(timeoutResult), perWorkerTimeoutMs)),
  ]);
}

// ─── Fleet Scan ─────────────────────────────────────────────────────────────

async function scanFleet(env: Env, tier?: string): Promise<HealthResult[]> {
  const workers = tier ? FLEET_REGISTRY.filter((w) => w.tier === tier) : FLEET_REGISTRY;
  const scanStart = Date.now();
  const GLOBAL_DEADLINE_MS = 25000;
  const PER_WORKER_TIMEOUT = tier ? 6000 : 5000;
  const results: HealthResult[] = [];
  const sorted = [...workers].sort((a, b) => {
    if (a.critical !== b.critical) return a.critical ? -1 : 1;
    const tierOrder: Record<string, number> = { T0: 0, T1: 1, T2: 2, T3: 3 };
    return (tierOrder[a.tier] || 9) - (tierOrder[b.tier] || 9);
  });
  const batchSize = 15;
  for (let i = 0; i < sorted.length; i += batchSize) {
    if (Date.now() - scanStart > GLOBAL_DEADLINE_MS) {
      log("warn", "Fleet scan hit global deadline, marking remaining as timeout", {
        scanned: results.length,
        remaining: sorted.length - i,
      });
      for (let j = i; j < sorted.length; j++) {
        results.push({
          worker: sorted[j].name,
          healthy: false,
          latencyMs: 0,
          error: "Scan deadline exceeded",
          checkedAt: new Date().toISOString(),
        });
      }
      break;
    }
    const batch = sorted.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(
      batch.map((w) => checkWorkerHealth(w, env, PER_WORKER_TIMEOUT))
    );
    for (const r of batchResults) {
      if (r.status === "fulfilled") results.push(r.value);
      else results.push({
        worker: "unknown",
        healthy: false,
        latencyMs: 0,
        error: r.reason?.message,
        checkedAt: new Date().toISOString(),
      });
    }
  }
  log("info", "Fleet scan complete", {
    total: sorted.length,
    scanned: results.length,
    healthy: results.filter((r) => r.healthy).length,
    durationMs: Date.now() - scanStart,
  });
  return results;
}

// ─── Heartbeat to Service Registry ──────────────────────────────────────────

async function reportHeartbeatsToRegistry(env: Env, results: HealthResult[]) {
  try {
    const services = results.map((r) => ({
      name: r.worker,
      status: r.healthy ? "healthy" : "unhealthy",
      metadata: {
        latency_ms: r.latencyMs,
        version: r.version || undefined,
        error: r.error || undefined,
        source: "fleet-commander",
      },
    }));
    const resp = await env.SERVICE_REGISTRY.fetch(new Request("https://internal/heartbeat/batch", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Echo-API-Key": env.ECHO_API_KEY || "",
      },
      body: JSON.stringify({ services }),
    }));
    if (resp.ok) {
      log("info", "Batch heartbeat sent to service registry", {
        count: services.length,
        healthy: services.filter((s) => s.status === "healthy").length,
      });
    } else {
      log("warn", "Service registry heartbeat returned non-OK", { status: resp.status });
    }
  } catch (err: any) {
    log("warn", "Failed to send heartbeats to service registry", { error: err.message });
  }
}

// ─── Scoring ────────────────────────────────────────────────────────────────

function scoreFleet(results: HealthResult[]) {
  const tierWeights: Record<string, number> = { T0: 4, T1: 3, T2: 2, T3: 1 };
  let totalWeight = 0;
  let healthyWeight = 0;
  let healthy = 0;
  let degraded = 0;
  let down = 0;
  const tierHealth: Record<string, { total: number; up: number }> = {};
  const catHealth: Record<string, { total: number; up: number }> = {};
  for (const r of results) {
    const entry = FLEET_REGISTRY.find((w) => w.name === r.worker);
    const tier = entry?.tier || "T3";
    const cat = entry?.category || "utility";
    const weight = tierWeights[tier] || 1;
    totalWeight += weight;
    if (r.healthy) {
      healthyWeight += weight;
      if (r.latencyMs > 3000) degraded++;
      else healthy++;
    } else {
      down++;
    }
    if (!tierHealth[tier]) tierHealth[tier] = { total: 0, up: 0 };
    tierHealth[tier].total++;
    if (r.healthy) tierHealth[tier].up++;
    if (!catHealth[cat]) catHealth[cat] = { total: 0, up: 0 };
    catHealth[cat].total++;
    if (r.healthy) catHealth[cat].up++;
  }
  const fleetScore = totalWeight > 0 ? Math.round((healthyWeight / totalWeight) * 100) : 0;
  const tierScores: Record<string, number> = {};
  for (const [t, s] of Object.entries(tierHealth)) {
    tierScores[t] = s.total > 0 ? Math.round((s.up / s.total) * 100) : 0;
  }
  const categoryScores: Record<string, number> = {};
  for (const [c, s] of Object.entries(catHealth)) {
    categoryScores[c] = s.total > 0 ? Math.round((s.up / s.total) * 100) : 0;
  }
  return { fleetScore, tierScores, categoryScores, healthy, degraded, down };
}

// ─── Audit ──────────────────────────────────────────────────────────────────

async function auditLog(env: Env, action: string, target: string, details: Record<string, any> = {}) {
  try {
    await env.DB.prepare(
      "INSERT INTO audit_log (action, target, details) VALUES (?, ?, ?)"
    ).bind(action, target, JSON.stringify(details)).run();
  } catch { /* non-critical */ }
}

// ─── Incidents ──────────────────────────────────────────────────────────────

async function createIncident(env: Env, title: string, severity: string, affectedWorkers: string[]) {
  await ensureSchema(env.DB);
  const id = `INC-${Date.now().toString(36).toUpperCase()}`;
  const now = new Date().toISOString();
  const timeline = JSON.stringify([`${now}: Incident created — ${title}`]);
  await env.DB.prepare(
    "INSERT INTO incidents (id, title, severity, status, affected_workers, timeline) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(id, title, severity, "active", JSON.stringify(affectedWorkers), timeline).run();
  try {
    await env.SHARED_BRAIN.fetch(new Request("https://brain/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instance_id: "fleet-commander",
        role: "assistant",
        content: `INCIDENT ${id}: ${title} | Severity: ${severity} | Workers: ${affectedWorkers.join(", ")}`,
        importance: severity === "critical" ? 10 : severity === "high" ? 8 : 6,
        tags: ["incident", severity, "fleet-commander"],
      }),
    }));
  } catch { /* best-effort */ }
  try {
    await env.SWARM_BRAIN.fetch(new Request("https://swarm/moltbook/post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        author_id: "fleet-commander",
        author_name: "Fleet Commander",
        author_type: "agent",
        content: `\u{1F6A8} INCIDENT ${id}: ${title} | ${severity.toUpperCase()} | ${affectedWorkers.length} workers affected`,
        mood: "alert",
        tags: ["incident", severity],
      }),
    }));
  } catch { /* best-effort */ }
  await auditLog(env, "incident_created", id, { title, severity, affectedWorkers });
  return id;
}

async function autoDetectIncidents(env: Env, results: HealthResult[]) {
  const criticalDown = results.filter((r) => {
    const entry = FLEET_REGISTRY.find((w) => w.name === r.worker);
    return !r.healthy && entry?.critical;
  });
  if (criticalDown.length > 0) {
    const names = criticalDown.map((r) => r.worker);
    const existing = await env.DB.prepare(
      "SELECT id FROM incidents WHERE status IN ('active', 'investigating', 'mitigating') AND created_at >= datetime('now', '-1 hour')"
    ).all();
    if ((existing.results || []).length === 0) {
      await createIncident(env, `Critical workers down: ${names.join(", ")}`, "critical", names);
    }
  }
}

// ─── Version Tracking ───────────────────────────────────────────────────────

async function trackVersionChanges(env: Env, results: HealthResult[]) {
  for (const r of results) {
    if (!r.version) continue;
    const cached = await env.CACHE.get(`version:${r.worker}`);
    if (cached && cached !== r.version) {
      await env.DB.prepare(
        "INSERT INTO deploys (worker, old_version, new_version, trigger, status) VALUES (?, ?, ?, ?, ?)"
      ).bind(r.worker, cached, r.version, "detected", "completed").run();
      log("info", `Deploy detected: ${r.worker} ${cached} → ${r.version}`);
      await auditLog(env, "deploy_detected", r.worker, { oldVersion: cached, newVersion: r.version });
    }
    await env.CACHE.put(`version:${r.worker}`, r.version, { expirationTtl: 86400 * 30 });
  }
}

// ─── Briefing ───────────────────────────────────────────────────────────────

async function generateBriefing(env: Env, type: string) {
  const results = await scanFleet(env);
  const scores = scoreFleet(results);
  const now = new Date().toISOString();
  const highlights: string[] = [];
  const concerns: string[] = [];
  const recommendations: string[] = [];
  const downWorkers = results.filter((r) => !r.healthy);
  const slowWorkers = results.filter((r) => r.healthy && r.latencyMs > 2000);
  const fastWorkers = results.filter((r) => r.healthy && r.latencyMs < 100);
  if (downWorkers.length === 0) highlights.push("All fleet workers operational");
  else concerns.push(`${downWorkers.length} workers DOWN: ${downWorkers.map((r) => r.worker).join(", ")}`);
  if (slowWorkers.length > 0) concerns.push(`${slowWorkers.length} workers slow (>2s): ${slowWorkers.map((r) => `${r.worker}(${r.latencyMs}ms)`).join(", ")}`);
  if (fastWorkers.length > 10) highlights.push(`${fastWorkers.length} workers responding under 100ms`);
  for (const [tier, score] of Object.entries(scores.tierScores)) {
    if (score < 80) concerns.push(`${tier} tier health at ${score}% — investigate`);
    if (score === 100) highlights.push(`${tier} tier: 100% healthy`);
  }
  if (downWorkers.length > 0) recommendations.push(`Investigate and restore: ${downWorkers.map((r) => r.worker).join(", ")}`);
  if (slowWorkers.length > 3) recommendations.push("Consider scaling or optimizing slow workers");
  if (scores.fleetScore < 90) recommendations.push("Fleet below 90% — run deep diagnostic");
  const healthyResults = results.filter((r) => r.healthy);
  const avgLatency = healthyResults.length > 0
    ? Math.round(healthyResults.reduce((s, r) => s + r.latencyMs, 0) / healthyResults.length)
    : 0;
  const briefing = {
    type,
    timestamp: now,
    fleetScore: scores.fleetScore,
    totalWorkers: FLEET_REGISTRY.length,
    healthy: scores.healthy,
    degraded: scores.degraded,
    down: scores.down,
    avgLatencyMs: avgLatency,
    tierScores: scores.tierScores,
    categoryScores: scores.categoryScores,
    highlights,
    concerns,
    recommendations,
    topPerformers: healthyResults.sort((a, b) => a.latencyMs - b.latencyMs).slice(0, 5).map((r) => ({ worker: r.worker, latencyMs: r.latencyMs })),
    worstPerformers: healthyResults.sort((a, b) => b.latencyMs - a.latencyMs).slice(0, 5).map((r) => ({ worker: r.worker, latencyMs: r.latencyMs })),
    downList: downWorkers.map((r) => ({ worker: r.worker, error: r.error })),
  };
  await ensureSchema(env.DB);
  await env.DB.prepare(
    "INSERT INTO briefings (briefing_type, content, fleet_score, highlights, concerns, recommendations) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(type, JSON.stringify(briefing), scores.fleetScore, JSON.stringify(highlights), JSON.stringify(concerns), JSON.stringify(recommendations)).run();
  await env.CACHE.put("latest_briefing", JSON.stringify(briefing), { expirationTtl: 3600 });
  return briefing;
}

// ─── Search ─────────────────────────────────────────────────────────────────

function searchFleet(query: string) {
  const q = query.toLowerCase();
  return FLEET_REGISTRY.filter(
    (w) => w.name.toLowerCase().includes(q) || w.description.toLowerCase().includes(q) || w.category.toLowerCase().includes(q) || w.tier.toLowerCase() === q
  ).sort((a, b) => {
    const aExact = a.name.toLowerCase() === q ? 0 : 1;
    const bExact = b.name.toLowerCase() === q ? 0 : 1;
    if (aExact !== bExact) return aExact - bExact;
    return a.tier.localeCompare(b.tier);
  });
}

// ─── Command Dispatch ───────────────────────────────────────────────────────

async function dispatchCommand(env: Env, target: string, command: string, params: Record<string, any> = {}) {
  await ensureSchema(env.DB);
  const entry = FLEET_REGISTRY.find((w) => w.name === target);
  if (!entry) return { error: `Worker "${target}" not found in registry` };
  let result: any = null;
  let status = "completed";
  try {
    switch (command) {
      case "health": {
        result = await checkWorkerHealth(entry, env);
        break;
      }
      case "trigger-cycle": {
        if (target === "echo-autonomous-daemon" && entry.binding) {
          const fetcher = env[entry.binding];
          const type = params.type || "manual";
          const resp = await fetcher.fetch(new Request(`https://internal/cycle?type=${type}`, { method: "POST" }));
          result = await resp.json().catch(() => ({ status: resp.status }));
        } else {
          result = { error: "Cycle trigger only supported for daemon" };
          status = "failed";
        }
        break;
      }
      case "run-tests": {
        if (target === "echo-qa-tester" && entry.binding) {
          const fetcher = env[entry.binding];
          const resp = await fetcher.fetch(new Request("https://internal/run", { method: "POST" }));
          result = await resp.json().catch(() => ({ status: resp.status }));
        } else {
          result = { error: "Test trigger only supported for QA tester" };
          status = "failed";
        }
        break;
      }
      case "stats": {
        const fetcher = entry.binding ? env[entry.binding] : null;
        if (fetcher) {
          const resp = await fetcher.fetch(new Request("https://internal/stats"));
          result = await resp.json().catch(() => ({ status: resp.status }));
        } else if (entry.publicUrl) {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 8000);
          try {
            const resp = await fetch(`${entry.publicUrl}/stats`, { signal: controller.signal });
            result = await resp.json().catch(() => ({ status: resp.status }));
          } finally {
            clearTimeout(timeout);
          }
        }
        break;
      }
      default:
        result = { error: `Unknown command: ${command}` };
        status = "failed";
    }
  } catch (err: any) {
    result = { error: err.message };
    status = "failed";
  }
  await env.DB.prepare(
    "INSERT INTO commands (target_worker, command, params, result, status, completed_at) VALUES (?, ?, ?, ?, ?, datetime(?))"
  ).bind(target, command, JSON.stringify(params), JSON.stringify(result), status, new Date().toISOString()).run();
  await auditLog(env, "command_dispatched", target, { command, params, status });
  return { target, command, status, result };
}

// ─── Topology ───────────────────────────────────────────────────────────────

function analyzeTopology() {
  const nodes = FLEET_REGISTRY.map((w) => ({
    name: w.name,
    tier: w.tier,
    category: w.category,
    critical: w.critical,
    inDegree: w.dependsOn.length,
    outDegree: DEPENDENCY_MAP.get(w.name)?.length || 0,
  }));
  const spofs = nodes.filter((n) => n.critical && n.outDegree > 2).sort((a, b) => b.outDegree - a.outDegree);
  const orphans = nodes.filter((n) => n.inDegree === 0 && n.outDegree === 0);
  const criticalPath = FLEET_REGISTRY.filter((w) => w.critical)
    .sort((a, b) => a.tier.localeCompare(b.tier))
    .map((w) => ({ name: w.name, tier: w.tier, dependsOn: w.dependsOn, dependents: DEPENDENCY_MAP.get(w.name) || [] }));
  const categories: Record<string, number> = {};
  const tiers: Record<string, number> = {};
  for (const w of FLEET_REGISTRY) {
    categories[w.category] = (categories[w.category] || 0) + 1;
    tiers[w.tier] = (tiers[w.tier] || 0) + 1;
  }
  return {
    totalWorkers: FLEET_REGISTRY.length,
    categories,
    tiers,
    criticalWorkers: FLEET_REGISTRY.filter((w) => w.critical).length,
    totalEdges: FLEET_REGISTRY.reduce((s, w) => s + w.dependsOn.length, 0),
    spofs: spofs.map((n) => ({ name: n.name, dependents: n.outDegree })),
    orphans: orphans.map((n) => n.name),
    criticalPath,
    maxInDegree: Math.max(...nodes.map((n) => n.inDegree)),
    maxOutDegree: Math.max(...nodes.map((n) => n.outDegree)),
  };
}

// ─── Dashboard ──────────────────────────────────────────────────────────────

async function buildDashboard(env: Env) {
  let fleetHealth: any = await env.CACHE.get("fleet_full_health", "json");
  if (!fleetHealth) {
    const results = await scanFleet(env);
    const scores = scoreFleet(results);
    fleetHealth = { timestamp: new Date().toISOString(), results, scores, topology: analyzeTopology() };
    await env.CACHE.put("fleet_full_health", JSON.stringify(fleetHealth), { expirationTtl: 300 });
  }
  await ensureSchema(env.DB);
  const incidents = await env.DB.prepare("SELECT * FROM incidents WHERE status != 'resolved' ORDER BY created_at DESC LIMIT 10").all();
  const deploys = await env.DB.prepare("SELECT * FROM deploys WHERE detected_at >= datetime('now', '-7 days') ORDER BY detected_at DESC LIMIT 20").all();
  const briefing = await env.CACHE.get("latest_briefing", "json");
  const snapshots = await env.DB.prepare("SELECT * FROM fleet_snapshots ORDER BY created_at DESC LIMIT 24").all();
  let daemonStatus: any = null;
  try {
    const resp = await env.DAEMON.fetch(new Request("https://internal/status"));
    daemonStatus = await resp.json().catch(() => null);
  } catch { /* daemon may be down */ }
  return {
    service: SERVICE,
    version: VERSION,
    timestamp: new Date().toISOString(),
    fleet: {
      totalWorkers: FLEET_REGISTRY.length,
      ...fleetHealth.scores,
      lastScan: fleetHealth.timestamp,
    },
    topology: fleetHealth.topology,
    incidents: incidents.results || [],
    deploys: deploys.results || [],
    briefing,
    trend: (snapshots.results || []).map((s: any) => ({
      time: s.created_at,
      score: s.fleet_score,
      healthy: s.healthy,
      down: s.down,
      avgLatency: s.avg_latency_ms,
    })),
    daemon: daemonStatus ? {
      version: daemonStatus.state?.version,
      lastCycle: daemonStatus.state?.lastCycleType,
      fleetScore: daemonStatus.state?.fleetScore,
    } : null,
    workerDetails: fleetHealth.results?.map((r: any) => {
      const entry = FLEET_REGISTRY.find((w) => w.name === r.worker);
      return {
        ...r,
        tier: entry?.tier,
        category: entry?.category,
        critical: entry?.critical,
        description: entry?.description,
        crons: entry?.crons?.length || 0,
      };
    }),
  };
}

// ─── Scheduled Handler ──────────────────────────────────────────────────────

async function handleScheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
  const cron = event.cron;
  log("info", "Fleet Commander cron triggered", { cron });
  try {
    await ensureSchema(env.DB);
    if (cron === "*/5 * * * *") {
      const results = await scanFleet(env, "T0");
      const t1Results = await scanFleet(env, "T1");
      const allResults = [...results, ...t1Results];
      for (const r of allResults) {
        const entry = FLEET_REGISTRY.find((w) => w.name === r.worker);
        await env.DB.prepare(
          "INSERT INTO fleet_health (worker, healthy, latency_ms, version, status, error, tier, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        ).bind(r.worker, r.healthy ? 1 : 0, r.latencyMs, r.version || null, r.status || null, r.error || null, entry?.tier || "T3", entry?.category || "utility").run();
      }
      await autoDetectIncidents(env, allResults);
      await trackVersionChanges(env, allResults);
      await env.CACHE.put("fleet_quick_health", JSON.stringify({
        timestamp: new Date().toISOString(),
        results: allResults,
        scores: scoreFleet(allResults),
      }), { expirationTtl: 600 });
      await reportHeartbeatsToRegistry(env, allResults);
    } else if (cron === "0 * * * *") {
      const results = await scanFleet(env);
      const scores = scoreFleet(results);
      for (const r of results) {
        const entry = FLEET_REGISTRY.find((w) => w.name === r.worker);
        await env.DB.prepare(
          "INSERT INTO fleet_health (worker, healthy, latency_ms, version, status, error, tier, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        ).bind(r.worker, r.healthy ? 1 : 0, r.latencyMs, r.version || null, r.status || null, r.error || null, entry?.tier || "T3", entry?.category || "utility").run();
      }
      const healthyResults = results.filter((r) => r.healthy);
      const avgLatency = healthyResults.length > 0
        ? Math.round(healthyResults.reduce((s, r) => s + r.latencyMs, 0) / healthyResults.length)
        : 0;
      await env.DB.prepare(
        "INSERT INTO fleet_snapshots (total_workers, healthy, degraded, down, avg_latency_ms, fleet_score, tier_scores, category_scores, snapshot_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
      ).bind(FLEET_REGISTRY.length, scores.healthy, scores.degraded, scores.down, avgLatency, scores.fleetScore, JSON.stringify(scores.tierScores), JSON.stringify(scores.categoryScores), "hourly").run();
      await trackVersionChanges(env, results);
      await autoDetectIncidents(env, results);
      const today = new Date().toISOString().split("T")[0];
      for (const r of results) {
        await env.DB.prepare(`
          INSERT INTO daily_uptime (worker, date, checks, healthy_checks, avg_latency_ms, max_latency_ms, min_latency_ms, uptime_pct)
          VALUES (?, ?, 1, ?, ?, ?, ?, ?)
          ON CONFLICT(worker, date) DO UPDATE SET
            checks = checks + 1,
            healthy_checks = healthy_checks + ?,
            avg_latency_ms = (avg_latency_ms * checks + ?) / (checks + 1),
            max_latency_ms = MAX(max_latency_ms, ?),
            min_latency_ms = MIN(min_latency_ms, ?),
            uptime_pct = ROUND(CAST(healthy_checks + ? AS REAL) / (checks + 1) * 100, 2)
        `).bind(
          r.worker,
          today,
          r.healthy ? 1 : 0,
          r.latencyMs,
          r.latencyMs,
          r.latencyMs,
          r.healthy ? 100 : 0,
          r.healthy ? 1 : 0,
          r.latencyMs,
          r.latencyMs,
          r.latencyMs,
          r.healthy ? 1 : 0,
        ).run();
      }
      await env.CACHE.put("fleet_full_health", JSON.stringify({
        timestamp: new Date().toISOString(),
        results,
        scores,
        topology: analyzeTopology(),
      }), { expirationTtl: 3600 });
      await reportHeartbeatsToRegistry(env, results);
    } else if (cron === "0 */6 * * *") {
      const briefing = await generateBriefing(env, "daily");
      try {
        await env.SHARED_BRAIN.fetch(new Request("https://brain/ingest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            instance_id: "fleet-commander",
            role: "assistant",
            content: `FLEET BRIEFING: Score ${briefing.fleetScore}/100 | ${briefing.healthy} healthy, ${briefing.down} down | Highlights: ${briefing.highlights.join("; ")} | Concerns: ${briefing.concerns.join("; ")}`,
            importance: 7,
            tags: ["fleet-briefing", "fleet-commander"],
          }),
        }));
      } catch { /* best-effort */ }
    } else if (cron === "0 9 * * *") {
      await generateBriefing(env, "daily");
    } else if (cron === "0 0 * * SUN") {
      await generateBriefing(env, "weekly");
      await env.DB.prepare("DELETE FROM fleet_health WHERE checked_at < datetime('now', '-14 days')").run();
      await env.DB.prepare("DELETE FROM audit_log WHERE created_at < datetime('now', '-30 days')").run();
    }
    log("info", "Fleet Commander cron completed", { cron });
  } catch (err: any) {
    log("error", "Fleet Commander cron failed", { cron, error: err.message });
  }
}

// ─── Input Validation Helpers ───────────────────────────────────────────────

/** Clamp an integer param to a safe range. Returns the default if unparseable. */
function safeInt(raw: string | null, defaultVal: number, min: number, max: number): number {
  if (!raw) return defaultVal;
  const n = parseInt(raw, 10);
  if (isNaN(n)) return defaultVal;
  return Math.max(min, Math.min(max, n));
}

// ─── Request Handler ────────────────────────────────────────────────────────

async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;

  // ── CORS preflight ──────────────────────────────────────────────────────
  if (request.method === "OPTIONS") {
    const origin = getCorsOrigin(request);
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Echo-API-Key",
      },
    });
  }

  // ── C45 FIX: Auth gate — 503 if secret unset, 401 if key wrong ─────────
  if (path !== "/health" && path !== "/") {
    if (!env.ECHO_API_KEY) {
      // Secret not configured — refuse all authenticated routes
      log("error", "ECHO_API_KEY secret not configured — blocking all non-health routes");
      return json({ error: "Service misconfigured" }, 503, request);
    }
    const apiKey = request.headers.get("X-Echo-API-Key");
    if (apiKey !== env.ECHO_API_KEY) {
      return json({ error: "Unauthorized" }, 401, request);
    }
  }

  try {
    switch (path) {
      case "/":
      case "/health": {
        return json({
          status: "ok",
          service: SERVICE,
          version: VERSION,
          timestamp: new Date().toISOString(),
          fleetSize: FLEET_REGISTRY.length,
          categories: {
            core: FLEET_REGISTRY.filter((w) => w.category === "core").length,
            intelligence: FLEET_REGISTRY.filter((w) => w.category === "intelligence").length,
            bot: FLEET_REGISTRY.filter((w) => w.category === "bot").length,
            product: FLEET_REGISTRY.filter((w) => w.category === "product").length,
            infra: FLEET_REGISTRY.filter((w) => w.category === "infra").length,
            scraper: FLEET_REGISTRY.filter((w) => w.category === "scraper").length,
            utility: FLEET_REGISTRY.filter((w) => w.category === "utility").length,
          },
          tiers: {
            T0: FLEET_REGISTRY.filter((w) => w.tier === "T0").length,
            T1: FLEET_REGISTRY.filter((w) => w.tier === "T1").length,
            T2: FLEET_REGISTRY.filter((w) => w.tier === "T2").length,
            T3: FLEET_REGISTRY.filter((w) => w.tier === "T3").length,
          },
          criticalWorkers: FLEET_REGISTRY.filter((w) => w.critical).length,
          endpoints: 24,
        }, 200, request);
      }

      case "/dashboard": {
        return json(await buildDashboard(env), 200, request);
      }

      case "/scan":
      case "/fleet/scan": {
        const tier = url.searchParams.get("tier") || undefined;
        const cacheKey = `scan_result:${tier || "all"}`;
        const cached = await env.CACHE.get(cacheKey, "json");
        if (cached && url.searchParams.get("force") !== "true") {
          return json({ ...cached as any, fromCache: true }, 200, request);
        }
        const results = await scanFleet(env, tier);
        const scores = scoreFleet(results);
        const scanResult = {
          timestamp: new Date().toISOString(),
          total: results.length,
          healthy: results.filter((r) => r.healthy).length,
          unhealthy: results.filter((r) => !r.healthy).length,
          fleetScore: scores.fleetScore,
          results,
          scores,
          scanned: results.length,
          unhealthyWorkers: results.filter((r) => !r.healthy).map((r) => ({ worker: r.worker, error: r.error, latencyMs: r.latencyMs })),
        };
        await env.CACHE.put(cacheKey, JSON.stringify(scanResult), { expirationTtl: 60 });
        reportHeartbeatsToRegistry(env, results).catch((e) => {
          log("error", "registry heartbeat report failed", { error: String(e) });
        });
        return json(scanResult, 200, request);
      }

      case "/briefing": {
        const type = url.searchParams.get("type") || "quick";
        const briefing = await generateBriefing(env, type);
        return json(briefing, 200, request);
      }

      case "/registry": {
        const category = url.searchParams.get("category");
        const tier = url.searchParams.get("tier");
        let workers: FleetWorker[] = FLEET_REGISTRY;
        if (category) workers = workers.filter((w) => w.category === category);
        if (tier) workers = workers.filter((w) => w.tier === tier);
        return json({ total: workers.length, workers }, 200, request);
      }

      case "/search": {
        const q = url.searchParams.get("q") || "";
        if (!q) return json({ error: "Missing ?q= parameter" }, 400, request);
        return json({ query: q, results: searchFleet(q) }, 200, request);
      }

      case "/topology": {
        return json(analyzeTopology(), 200, request);
      }

      case "/incidents": {
        await ensureSchema(env.DB);
        const status = url.searchParams.get("status");
        const limit = safeInt(url.searchParams.get("limit"), 50, 1, 500);
        const rows = status
          ? await env.DB.prepare("SELECT * FROM incidents WHERE status = ? ORDER BY created_at DESC LIMIT ?").bind(status, limit).all()
          : await env.DB.prepare("SELECT * FROM incidents ORDER BY created_at DESC LIMIT ?").bind(limit).all();
        return json(rows.results || [], 200, request);
      }

      case "/incidents/create": {
        if (request.method !== "POST") return json({ error: "POST required" }, 405, request);
        const body: any = await request.json().catch(() => ({}));
        if (!body.title) return json({ error: "Missing title" }, 400, request);
        const id = await createIncident(env, body.title, body.severity || "medium", body.affectedWorkers || []);
        return json({ id, status: "created" }, 200, request);
      }

      case "/incidents/resolve": {
        if (request.method !== "POST") return json({ error: "POST required" }, 405, request);
        const body: any = await request.json().catch(() => ({}));
        if (!body.id) return json({ error: "Missing incident id" }, 400, request);
        await ensureSchema(env.DB);
        await env.DB.prepare(
          "UPDATE incidents SET status = 'resolved', resolution = ?, resolved_at = datetime(?) WHERE id = ?"
        ).bind(body.resolution || "Resolved", new Date().toISOString(), body.id).run();
        await auditLog(env, "incident_resolved", body.id, { resolution: body.resolution });
        return json({ id: body.id, status: "resolved" }, 200, request);
      }

      case "/command": {
        if (request.method !== "POST") return json({ error: "POST required" }, 405, request);
        const body: any = await request.json().catch(() => ({}));
        if (!body.target || !body.command) return json({ error: "Missing target or command" }, 400, request);
        return json(await dispatchCommand(env, body.target, body.command, body.params || {}), 200, request);
      }

      case "/commands": {
        await ensureSchema(env.DB);
        const limit = safeInt(url.searchParams.get("limit"), 50, 1, 500);
        const rows = await env.DB.prepare("SELECT * FROM commands ORDER BY issued_at DESC LIMIT ?").bind(limit).all();
        return json(rows.results || [], 200, request);
      }

      // ── C46 FIX: Parameterized queries (no string interpolation for SQL) ──

      case "/deploys": {
        await ensureSchema(env.DB);
        const days = safeInt(url.searchParams.get("days"), 7, 1, 365);
        // FIX C46: Use bind parameter with datetime calculation via SQLite's '-? days' workaround
        // SQLite doesn't support bind params inside datetime() string args, so we compute the cutoff in JS
        const cutoff = new Date(Date.now() - days * 86400000).toISOString();
        const rows = await env.DB.prepare(
          "SELECT * FROM deploys WHERE detected_at >= ? ORDER BY detected_at DESC LIMIT 100"
        ).bind(cutoff).all();
        return json(rows.results || [], 200, request);
      }

      case "/uptime": {
        await ensureSchema(env.DB);
        const days = safeInt(url.searchParams.get("days"), 7, 1, 365);
        const worker = url.searchParams.get("worker");
        const cutoffDate = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];
        const rows = worker
          ? await env.DB.prepare(
              "SELECT * FROM daily_uptime WHERE date >= ? AND worker = ? ORDER BY date DESC"
            ).bind(cutoffDate, worker).all()
          : await env.DB.prepare(
              "SELECT * FROM daily_uptime WHERE date >= ? ORDER BY worker, date DESC"
            ).bind(cutoffDate).all();
        return json(rows.results || [], 200, request);
      }

      case "/history": {
        await ensureSchema(env.DB);
        const worker = url.searchParams.get("worker");
        const hours = safeInt(url.searchParams.get("hours"), 24, 1, 720);
        const limit = safeInt(url.searchParams.get("limit"), 100, 1, 1000);
        const cutoff = new Date(Date.now() - hours * 3600000).toISOString();
        const rows = worker
          ? await env.DB.prepare(
              "SELECT * FROM fleet_health WHERE worker = ? AND checked_at >= ? ORDER BY checked_at DESC LIMIT ?"
            ).bind(worker, cutoff, limit).all()
          : await env.DB.prepare(
              "SELECT * FROM fleet_health WHERE checked_at >= ? ORDER BY checked_at DESC LIMIT ?"
            ).bind(cutoff, limit).all();
        return json(rows.results || [], 200, request);
      }

      case "/snapshots": {
        await ensureSchema(env.DB);
        const limit = safeInt(url.searchParams.get("limit"), 48, 1, 500);
        const rows = await env.DB.prepare("SELECT * FROM fleet_snapshots ORDER BY created_at DESC LIMIT ?").bind(limit).all();
        return json(rows.results || [], 200, request);
      }

      case "/briefings": {
        await ensureSchema(env.DB);
        const type = url.searchParams.get("type");
        const limit = safeInt(url.searchParams.get("limit"), 20, 1, 200);
        const rows = type
          ? await env.DB.prepare(
              "SELECT id, briefing_type, fleet_score, highlights, concerns, recommendations, created_at FROM briefings WHERE briefing_type = ? ORDER BY created_at DESC LIMIT ?"
            ).bind(type, limit).all()
          : await env.DB.prepare(
              "SELECT id, briefing_type, fleet_score, highlights, concerns, recommendations, created_at FROM briefings ORDER BY created_at DESC LIMIT ?"
            ).bind(limit).all();
        return json(rows.results || [], 200, request);
      }

      case "/audit": {
        await ensureSchema(env.DB);
        const limit = safeInt(url.searchParams.get("limit"), 100, 1, 1000);
        const rows = await env.DB.prepare("SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ?").bind(limit).all();
        return json(rows.results || [], 200, request);
      }

      case "/worker": {
        const name = url.searchParams.get("name");
        if (!name) return json({ error: "Missing ?name= parameter" }, 400, request);
        const entry = FLEET_REGISTRY.find((w) => w.name === name);
        if (!entry) return json({ error: `Worker "${name}" not found` }, 404, request);
        await ensureSchema(env.DB);
        const recentHealth = await env.DB.prepare(
          "SELECT * FROM fleet_health WHERE worker = ? ORDER BY checked_at DESC LIMIT 20"
        ).bind(name).all();
        const recentDeploys = await env.DB.prepare(
          "SELECT * FROM deploys WHERE worker = ? ORDER BY detected_at DESC LIMIT 10"
        ).bind(name).all();
        const uptimeData = await env.DB.prepare(
          "SELECT * FROM daily_uptime WHERE worker = ? AND date >= date('now', '-7 days') ORDER BY date DESC"
        ).bind(name).all();
        const version = await env.CACHE.get(`version:${name}`);
        return json({
          ...entry,
          currentVersion: version,
          dependents: DEPENDENCY_MAP.get(name) || [],
          recentHealth: recentHealth.results || [],
          recentDeploys: recentDeploys.results || [],
          uptime: uptimeData.results || [],
        }, 200, request);
      }

      case "/stats": {
        await ensureSchema(env.DB);
        const healthChecks = await env.DB.prepare("SELECT COUNT(*) as c FROM fleet_health WHERE checked_at >= datetime('now', '-24 hours')").first();
        const incidentCount = await env.DB.prepare("SELECT COUNT(*) as c FROM incidents WHERE status != 'resolved'").first();
        const deployCount = await env.DB.prepare("SELECT COUNT(*) as c FROM deploys WHERE detected_at >= datetime('now', '-7 days')").first();
        const commandCount = await env.DB.prepare("SELECT COUNT(*) as c FROM commands WHERE issued_at >= datetime('now', '-24 hours')").first();
        return json({
          fleetSize: FLEET_REGISTRY.length,
          healthChecks24h: (healthChecks as any)?.c || 0,
          activeIncidents: (incidentCount as any)?.c || 0,
          deploys7d: (deployCount as any)?.c || 0,
          commands24h: (commandCount as any)?.c || 0,
          uptime: "check /uptime for per-worker data",
        }, 200, request);
      }

      default:
        return json({
          error: "Not found",
          service: SERVICE,
          version: VERSION,
          endpoints: [
            "GET  /health            — Fleet commander health + fleet size summary",
            "GET  /dashboard         — Full unified dashboard (health, incidents, deploys, briefing, trend)",
            "GET  /scan              — Live fleet scan (?tier=T0|T1|T2|T3)",
            "GET  /briefing          — Generate fleet briefing (?type=quick|daily|weekly)",
            "GET  /registry          — Fleet registry (?category=core|bot|...&tier=T0|T1|...)",
            "GET  /search            — Search fleet (?q=keyword)",
            "GET  /topology          — Fleet dependency topology + SPOFs + critical path",
            "GET  /incidents         — Incident list (?status=active|resolved&limit=50)",
            "POST /incidents/create  — Create incident ({title, severity, affectedWorkers})",
            "POST /incidents/resolve — Resolve incident ({id, resolution})",
            "POST /command           — Dispatch command ({target, command, params})",
            "GET  /commands          — Command history (?limit=50)",
            "GET  /deploys           — Deploy history (?days=7)",
            "GET  /uptime            — Daily uptime per worker (?days=7&worker=name)",
            "GET  /history           — Health check history (?worker=name&hours=24&limit=100)",
            "GET  /snapshots         — Fleet snapshots (?limit=48)",
            "GET  /briefings         — Briefing history (?type=quick|daily|weekly&limit=20)",
            "GET  /audit             — Audit log (?limit=100)",
            "GET  /worker            — Single worker detail (?name=echo-shared-brain)",
            "GET  /stats             — Quick fleet stats",
          ],
        }, 404, request);
    }
  } catch (err: any) {
    // ── H59 FIX: Sanitized error — no stack trace or internal details leaked ──
    const errorId = `ERR-${Date.now().toString(36).toUpperCase()}`;
    log("error", "Request handler error", { path, errorId, error: err.message, stack: err.stack?.slice(0, 500) });
    return json({ error: "Internal server error", errorId }, 500, request);
  }
}

// ─── Export ─────────────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return handleRequest(request, env);
  },
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(handleScheduled(event, env, ctx));
  },
};
