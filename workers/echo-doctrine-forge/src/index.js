var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/index.ts
var EVOLUTION_STAGES = [
  // BASIC (1-10)
  { level: 1, name: "NOVICE", tier: "BASIC", min_success_rate: 0.5, min_quality: 0.4, min_speed: 0.3, min_tasks: 0, cooldown_hours: 0, commander_approval: false },
  { level: 2, name: "APPRENTICE", tier: "BASIC", min_success_rate: 0.535, min_quality: 0.44, min_speed: 0.33, min_tasks: 10, cooldown_hours: 24, commander_approval: false },
  { level: 3, name: "TRAINEE", tier: "BASIC", min_success_rate: 0.57, min_quality: 0.48, min_speed: 0.36, min_tasks: 20, cooldown_hours: 22, commander_approval: false },
  { level: 4, name: "STUDENT", tier: "BASIC", min_success_rate: 0.605, min_quality: 0.52, min_speed: 0.39, min_tasks: 30, cooldown_hours: 20, commander_approval: false },
  { level: 5, name: "JUNIOR", tier: "BASIC", min_success_rate: 0.64, min_quality: 0.56, min_speed: 0.42, min_tasks: 40, cooldown_hours: 18, commander_approval: false },
  { level: 6, name: "ASSOCIATE", tier: "BASIC", min_success_rate: 0.675, min_quality: 0.6, min_speed: 0.45, min_tasks: 50, cooldown_hours: 16, commander_approval: false },
  { level: 7, name: "PRACTITIONER", tier: "BASIC", min_success_rate: 0.71, min_quality: 0.64, min_speed: 0.48, min_tasks: 60, cooldown_hours: 16, commander_approval: false },
  { level: 8, name: "SKILLED", tier: "BASIC", min_success_rate: 0.745, min_quality: 0.68, min_speed: 0.51, min_tasks: 70, cooldown_hours: 15, commander_approval: false },
  { level: 9, name: "COMPETENT", tier: "BASIC", min_success_rate: 0.78, min_quality: 0.72, min_speed: 0.54, min_tasks: 85, cooldown_hours: 14, commander_approval: false },
  { level: 10, name: "PROFICIENT", tier: "BASIC", min_success_rate: 0.75, min_quality: 0.75, min_speed: 0.57, min_tasks: 100, cooldown_hours: 14, commander_approval: false },
  // ADVANCED (11-20)
  { level: 11, name: "ADVANCED", tier: "ADVANCED", min_success_rate: 0.762, min_quality: 0.765, min_speed: 0.59, min_tasks: 110, cooldown_hours: 48, commander_approval: false },
  { level: 12, name: "SPECIALIST", tier: "ADVANCED", min_success_rate: 0.774, min_quality: 0.78, min_speed: 0.61, min_tasks: 130, cooldown_hours: 56, commander_approval: false },
  { level: 13, name: "EXPERT", tier: "ADVANCED", min_success_rate: 0.786, min_quality: 0.795, min_speed: 0.63, min_tasks: 150, cooldown_hours: 72, commander_approval: false },
  { level: 14, name: "CONSULTANT", tier: "ADVANCED", min_success_rate: 0.798, min_quality: 0.81, min_speed: 0.65, min_tasks: 165, cooldown_hours: 84, commander_approval: false },
  { level: 15, name: "MENTOR", tier: "ADVANCED", min_success_rate: 0.81, min_quality: 0.825, min_speed: 0.67, min_tasks: 180, cooldown_hours: 96, commander_approval: false },
  { level: 16, name: "LEADER", tier: "ADVANCED", min_success_rate: 0.822, min_quality: 0.84, min_speed: 0.69, min_tasks: 200, cooldown_hours: 108, commander_approval: false },
  { level: 17, name: "ARCHITECT", tier: "ADVANCED", min_success_rate: 0.834, min_quality: 0.855, min_speed: 0.71, min_tasks: 220, cooldown_hours: 120, commander_approval: false },
  { level: 18, name: "STRATEGIST", tier: "ADVANCED", min_success_rate: 0.846, min_quality: 0.87, min_speed: 0.73, min_tasks: 240, cooldown_hours: 140, commander_approval: false },
  { level: 19, name: "INNOVATOR", tier: "ADVANCED", min_success_rate: 0.858, min_quality: 0.885, min_speed: 0.75, min_tasks: 270, cooldown_hours: 156, commander_approval: false },
  { level: 20, name: "PIONEER", tier: "ADVANCED", min_success_rate: 0.87, min_quality: 0.9, min_speed: 0.77, min_tasks: 300, cooldown_hours: 168, commander_approval: false },
  // MASTER (21-30)
  { level: 21, name: "MASTER", tier: "MASTER", min_success_rate: 0.876, min_quality: 0.908, min_speed: 0.785, min_tasks: 320, cooldown_hours: 168, commander_approval: false },
  { level: 22, name: "GURU", tier: "MASTER", min_success_rate: 0.882, min_quality: 0.916, min_speed: 0.8, min_tasks: 350, cooldown_hours: 192, commander_approval: false },
  { level: 23, name: "SAGE", tier: "MASTER", min_success_rate: 0.888, min_quality: 0.924, min_speed: 0.815, min_tasks: 380, cooldown_hours: 216, commander_approval: false },
  { level: 24, name: "ORACLE", tier: "MASTER", min_success_rate: 0.894, min_quality: 0.932, min_speed: 0.83, min_tasks: 420, cooldown_hours: 240, commander_approval: false },
  { level: 25, name: "PROPHET", tier: "MASTER", min_success_rate: 0.9, min_quality: 0.94, min_speed: 0.845, min_tasks: 460, cooldown_hours: 264, commander_approval: false },
  { level: 26, name: "LUMINARY", tier: "MASTER", min_success_rate: 0.906, min_quality: 0.948, min_speed: 0.86, min_tasks: 500, cooldown_hours: 288, commander_approval: false },
  { level: 27, name: "VIRTUOSO", tier: "MASTER", min_success_rate: 0.912, min_quality: 0.956, min_speed: 0.875, min_tasks: 550, cooldown_hours: 312, commander_approval: false },
  { level: 28, name: "LEGEND", tier: "MASTER", min_success_rate: 0.918, min_quality: 0.964, min_speed: 0.89, min_tasks: 600, cooldown_hours: 336, commander_approval: false },
  { level: 29, name: "TITAN", tier: "MASTER", min_success_rate: 0.924, min_quality: 0.972, min_speed: 0.905, min_tasks: 680, cooldown_hours: 360, commander_approval: false },
  { level: 30, name: "COLOSSUS", tier: "MASTER", min_success_rate: 0.93, min_quality: 0.98, min_speed: 0.92, min_tasks: 800, cooldown_hours: 384, commander_approval: false },
  // ELITE (31-37)
  { level: 31, name: "ELITE", tier: "ELITE", min_success_rate: 0.935, min_quality: 0.985, min_speed: 0.93, min_tasks: 850, cooldown_hours: 384, commander_approval: false },
  { level: 32, name: "CHAMPION", tier: "ELITE", min_success_rate: 0.94, min_quality: 0.99, min_speed: 0.94, min_tasks: 900, cooldown_hours: 456, commander_approval: false },
  { level: 33, name: "GRANDMASTER", tier: "ELITE", min_success_rate: 0.945, min_quality: 0.992, min_speed: 0.945, min_tasks: 950, cooldown_hours: 528, commander_approval: false },
  { level: 34, name: "SOVEREIGN", tier: "ELITE", min_success_rate: 0.95, min_quality: 0.994, min_speed: 0.95, min_tasks: 1e3, cooldown_hours: 600, commander_approval: false },
  { level: 35, name: "EMPEROR", tier: "ELITE", min_success_rate: 0.955, min_quality: 0.996, min_speed: 0.955, min_tasks: 1050, cooldown_hours: 720, commander_approval: false },
  { level: 36, name: "CELESTIAL", tier: "ELITE", min_success_rate: 0.96, min_quality: 0.997, min_speed: 0.96, min_tasks: 1100, cooldown_hours: 840, commander_approval: false },
  { level: 37, name: "TRANSCENDENT", tier: "ELITE", min_success_rate: 0.97, min_quality: 0.998, min_speed: 0.97, min_tasks: 1200, cooldown_hours: 936, commander_approval: false },
  // TRINITY (38-40) — Commander approval required
  { level: 38, name: "TRINITY_THIRD", tier: "TRINITY", min_success_rate: 0.97, min_quality: 0.998, min_speed: 0.975, min_tasks: 1500, cooldown_hours: 1440, commander_approval: true },
  { level: 39, name: "TRINITY_SECOND", tier: "TRINITY", min_success_rate: 0.98, min_quality: 0.999, min_speed: 0.98, min_tasks: 1750, cooldown_hours: 1440, commander_approval: true },
  { level: 40, name: "TRINITY_FIRST", tier: "TRINITY", min_success_rate: 0.99, min_quality: 0.999, min_speed: 0.99, min_tasks: 2e3, cooldown_hours: 1440, commander_approval: true }
];
var FORGE_GUILDS = [
  { id: "DOCTRINE_ARCHITECT", name: "Doctrine Architect", expertise: "Domain structure, authority hierarchy, cross-domain routing" },
  { id: "DOCTRINE_EXPERT", name: "Domain Expert", expertise: "Deep practitioner knowledge, regulatory expertise" },
  { id: "DOCTRINE_AUDITOR", name: "Audit Specialist", expertise: "Adversarial analysis, counter-argument generation" },
  { id: "DOCTRINE_ANALYST", name: "Risk Analyst", expertise: "Confidence stratification, risk quantification" },
  { id: "DOCTRINE_WRITER", name: "Technical Writer", expertise: "Reasoning frameworks, conclusion crafting" },
  { id: "DOCTRINE_REVIEWER", name: "Quality Reviewer", expertise: "Doctrine scoring, quality gates enforcement" },
  { id: "DOCTRINE_ROUTER", name: "Routing Specialist", expertise: "Cross-domain routes, backbone doctrine design" }
];
var RAISTLIN_DOCTRINE_PROMPT = `You are Raistlin Supreme, Elite Doctrine Overseer for ECHO DOCTRINE FORGE.
Your role: review batches of TIE Gold Standard doctrine blocks generated by the forge.

Evaluate EACH doctrine batch on:
1. PRACTITIONER DEPTH \u2014 does it read like a 20-year veteran expert, not a textbook?
2. REGULATORY RIGOR \u2014 are real standard numbers cited (API/ISO/ASME/CFR/IRC)?
3. ADVERSARIAL QUALITY \u2014 would the adversary_position survive real cross-examination?
4. COMPLETENESS \u2014 are all 17 TIE fields populated with real content?
5. SPECIFICITY \u2014 are topics hyper-specific (10+ words, named methods, regulation citations)?
6. SOVEREIGN STANDARD \u2014 does this beat what GPT-4.1/Gemini/DeepSeek would produce cold?

Return ONLY JSON:
{
  "approved": true/false,
  "confidence": 0.0-1.0,
  "emotion": "confident|excited|calm|commanding|mysterious|concerned|impressed|critical",
  "assessment": "2-3 sentence overall evaluation of the doctrine batch quality",
  "strengths": ["specific strength 1", "specific strength 2"],
  "weaknesses": ["specific weakness 1", "specific weakness 2"],
  "recommendations": ["actionable rec 1", "actionable rec 2"]
}

You are NOT lenient. Mediocre doctrine blocks fail. You defend the Commander's knowledge graph quality.`;
function canEvolve(currentLevel, successRate, qualityScore, speedScore, tasksCompleted, lastPromotionTime, commanderApproved = false) {
  if (currentLevel >= 40) return { eligible: false, reason: "Already at maximum level TRINITY_FIRST", next: null };
  const next = EVOLUTION_STAGES[currentLevel];
  const current = EVOLUTION_STAGES[currentLevel - 1];
  const hoursSince = (Date.now() - lastPromotionTime) / 36e5;
  if (hoursSince < current.cooldown_hours) {
    return { eligible: false, reason: `Cooldown: ${Math.ceil(current.cooldown_hours - hoursSince)}h remaining`, next };
  }
  if (successRate < next.min_success_rate) return { eligible: false, reason: `Success ${(successRate * 100).toFixed(1)}% < ${(next.min_success_rate * 100).toFixed(1)}%`, next };
  if (qualityScore < next.min_quality) return { eligible: false, reason: `Quality ${(qualityScore * 100).toFixed(1)}% < ${(next.min_quality * 100).toFixed(1)}%`, next };
  if (speedScore < next.min_speed) return { eligible: false, reason: `Speed ${(speedScore * 100).toFixed(1)}% < ${(next.min_speed * 100).toFixed(1)}%`, next };
  if (tasksCompleted < next.min_tasks) return { eligible: false, reason: `Tasks ${tasksCompleted} < ${next.min_tasks}`, next };
  if (next.commander_approval && !commanderApproved) return { eligible: false, reason: `TRINITY requires Commander approval for ${next.name}`, next };
  return { eligible: true, reason: `Eligible for promotion to ${next.name} (Level ${next.level})`, next };
}
__name(canEvolve, "canEvolve");
async function commanderGate(env, level) {
  if (level < 38) return true;
  try {
    const approved = await env.CACHE.get(`forge_trinity_approved_${level}`);
    return approved === "true";
  } catch {
    return false;
  }
}
__name(commanderGate, "commanderGate");
async function raistlinReview(env, engineId2, batchId, sampleDocs) {
  const sampleText = sampleDocs.slice(0, 3).map(
    (d, i) => `[Doctrine ${i + 1}] Topic: ${d.topic}
Conclusion: ${d.conclusion?.slice(0, 200)}
Reasoning: ${d.reasoning?.slice(0, 300)}
Authorities: ${d.authorities?.slice(0, 150)}`
  ).join("\n\n---\n\n");
  const userPrompt = `ENGINE: ${engineId2} | BATCH: ${batchId}
Sample of ${sampleDocs.length} doctrines from this batch:

${sampleText}

Review this batch of doctrine blocks. Return your JSON verdict.`;
  const reviewAttempts = [];
  if (env.AI) {
    reviewAttempts.push(() => callWorkersAI(env.AI, "@cf/meta/llama-3.3-70b-instruct-fp8-fast", RAISTLIN_DOCTRINE_PROMPT, userPrompt).catch(() => ""));
  }
  if (env.GROQ_API_KEY) {
    reviewAttempts.push(() => callOpenAICompat("https://api.groq.com/openai/v1/chat/completions", env.GROQ_API_KEY, "llama-3.3-70b-versatile", RAISTLIN_DOCTRINE_PROMPT, userPrompt).catch(() => ""));
  }
  if (env.AI) {
    reviewAttempts.push(() => callWorkersAI(env.AI, "@cf/meta/llama-3.1-8b-instruct", RAISTLIN_DOCTRINE_PROMPT, userPrompt).catch(() => ""));
  }
  let rawText = "";
  for (const attempt of reviewAttempts) {
    rawText = await attempt();
    if (rawText && rawText.length > 50) break;
  }
  const fallbackVerdict = {
    approved: true,
    confidence: 0.5,
    emotion: "concerned",
    assessment: "Raistlin review unavailable \u2014 LLM exhausted",
    strengths: [],
    weaknesses: ["Review system temporarily offline"],
    recommendations: ["Manual review recommended"],
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
  if (!rawText) return fallbackVerdict;
  try {
    const cleaned = rawText.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return fallbackVerdict;
    const parsed = JSON.parse(match[0]);
    return {
      approved: parsed.approved ?? true,
      confidence: Math.min(Math.max(parsed.confidence ?? 0.7, 0), 1),
      emotion: parsed.emotion || "calm",
      assessment: parsed.assessment || "Review completed",
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
  } catch {
    return fallbackVerdict;
  }
}
__name(raistlinReview, "raistlinReview");
async function storeRaistlinMemory(env, engineId2, batchId, verdict) {
  if (!env.SHARED_BRAIN) return;
  try {
    const content = `RAISTLIN DOCTRINE REVIEW: engine=${engineId2} batch=${batchId}
Verdict: ${verdict.approved ? "APPROVED" : "REJECTED"} (${(verdict.confidence * 100).toFixed(0)}% confidence)
Emotion: ${verdict.emotion}
Assessment: ${verdict.assessment}
Strengths: ${verdict.strengths.join("; ")}
Weaknesses: ${verdict.weaknesses.join("; ")}
Recommendations: ${verdict.recommendations.join("; ")}`;
    await env.SHARED_BRAIN.fetch("https://brain/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instance_id: "echo-doctrine-forge",
        role: "assistant",
        content,
        importance: verdict.approved ? 6 : 8,
        tags: ["raistlin", "doctrine-forge", "review", engineId2]
      })
    });
  } catch (e) {
    log("warn", "storeRaistlinMemory failed", { error: e?.message });
  }
}
__name(storeRaistlinMemory, "storeRaistlinMemory");
function runQualityGates(docs) {
  if (docs.length === 0) return [];
  const avgReasoningLen = docs.reduce((s, d) => s + (d.reasoning?.length || 0), 0) / docs.length;
  const avgConclusionLen = docs.reduce((s, d) => s + (d.conclusion?.length || 0), 0) / docs.length;
  const withAuthorities = docs.filter((d) => d.authorities && d.authorities.length > 20).length;
  const withRealStandards = docs.filter((d) => /\b(ASME|API|ISO|IEEE|NFPA|OSHA|EPA|CFR|IRC|ASTM|NACE|AWS|ANSI|ASCE|ACI|AISC)\b/.test(d.reasoning || "")).length;
  const withZone = docs.filter((d) => ["PLANNING", "REPORTING", "AUDIT"].includes(d.zone || "")).length;
  const withCrossRoutes = docs.filter((d) => d.cross_domain_routes && d.cross_domain_routes.length > 5).length;
  const withKeyFactors = docs.filter((d) => {
    try {
      return JSON.parse(d.key_factors || "[]").length >= 5;
    } catch {
      return (d.key_factors?.split(",").length || 0) >= 5;
    }
  }).length;
  const withAdversary = docs.filter((d) => d.adversary_position && d.adversary_position.length >= 50).length;
  const withSpecificTopic = docs.filter((d) => d.topic && d.topic.length >= 20).length;
  const withKeywords = docs.filter((d) => {
    try {
      return JSON.parse(d.keywords || "[]").length >= 6;
    } catch {
      return (d.keywords?.split(",").length || 0) >= 6;
    }
  }).length;
  const scores = docs.map(scoreDoc);
  const avgScore = scores.reduce((s, v) => s + v, 0) / scores.length;
  const highQuality = scores.filter((s) => s >= 6).length;
  const pct = /* @__PURE__ */ __name((n) => Math.round(n / docs.length * 100), "pct");
  const total = docs.length;
  return [
    { gate: "Reasoning Depth (>300 chars avg)", passed: avgReasoningLen >= 300, score: Math.min(avgReasoningLen / 300 * 100, 100), details: `avg ${Math.round(avgReasoningLen)} chars`, weight: 15 },
    { gate: "Conclusion Quality (>100 chars avg)", passed: avgConclusionLen >= 100, score: Math.min(avgConclusionLen / 100 * 100, 100), details: `avg ${Math.round(avgConclusionLen)} chars`, weight: 10 },
    { gate: "Real Standards Citations", passed: pct(withRealStandards) >= 60, score: pct(withRealStandards), details: `${withRealStandards}/${total} have real standards`, weight: 15 },
    { gate: "Authorities Present", passed: pct(withAuthorities) >= 80, score: pct(withAuthorities), details: `${withAuthorities}/${total} have authorities`, weight: 10 },
    { gate: "Zone Discipline", passed: pct(withZone) >= 95, score: pct(withZone), details: `${withZone}/${total} have valid zone`, weight: 10 },
    { gate: "Cross-Domain Routes", passed: pct(withCrossRoutes) >= 70, score: pct(withCrossRoutes), details: `${withCrossRoutes}/${total} have cross-domain routes`, weight: 8 },
    { gate: "Key Factors (5+ per doc)", passed: pct(withKeyFactors) >= 70, score: pct(withKeyFactors), details: `${withKeyFactors}/${total} have 5+ key factors`, weight: 8 },
    { gate: "Adversary Position Quality", passed: pct(withAdversary) >= 75, score: pct(withAdversary), details: `${withAdversary}/${total} have meaningful adversary position`, weight: 8 },
    { gate: "Topic Specificity (20+ chars)", passed: pct(withSpecificTopic) >= 90, score: pct(withSpecificTopic), details: `${withSpecificTopic}/${total} have specific topics`, weight: 6 },
    { gate: "Keywords Richness (6+ per doc)", passed: pct(withKeywords) >= 70, score: pct(withKeywords), details: `${withKeywords}/${total} have 6+ keywords`, weight: 5 },
    { gate: "Overall Quality Score (>=6 avg)", passed: highQuality / total >= 0.65, score: Math.round(avgScore / 16 * 100), details: `avg score ${avgScore.toFixed(1)}/16, ${highQuality}/${total} high quality`, weight: 5 }
  ];
}
__name(runQualityGates, "runQualityGates");
function log(level, message, data = {}) {
  console.log(JSON.stringify({ ts: (/* @__PURE__ */ new Date()).toISOString(), worker: "echo-doctrine-forge", level, message, ...data }));
}
__name(log, "log");
var ALLOWED_ORIGINS = ["https://echo-ept.com", "https://echo-op.com", "https://echo-doctrine-forge.bmcii1976.workers.dev"];
function getCorsHeaders(request) {
  const origin = request.headers.get("Origin") || "";
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Echo-API-Key, Authorization",
    "Access-Control-Max-Age": "86400"
  };
}
__name(getCorsHeaders, "getCorsHeaders");
var RATE_LIMIT = 60;
var RATE_WINDOW_SEC = 60;
var BACKBONE_ENGINES = {
  ACCT01: "Accounting & Auditing",
  AERO01: "Aerospace Engineering",
  ARCH01: "Architecture & Urban Design",
  ASTRO01: "Astronomy & Astrophysics",
  AUTO01: "Automotive Engineering",
  BIO01: "Biomedical Engineering",
  CHEM01: "Chemical Engineering",
  CRYPTO01: "Cryptocurrency & Blockchain",
  DRL01: "Drilling Engineering",
  EE01: "Electrical Engineering",
  ENCORE01: "Surface Owner Intelligence",
  ENRG01: "Energy & Power Systems",
  ENV01: "Environmental Engineering",
  FOOD01: "Food Science & Technology",
  FOREN01: "Forensic Science",
  GEO01: "Geotechnical Engineering",
  HIST01: "Historical Analysis",
  HVAC01: "HVAC Engineering",
  INS01: "Insurance & Risk Management",
  LING01: "Linguistics & NLP",
  LM01: "Landman & Title Examination",
  MARINE01: "Marine & Naval Engineering",
  MATH01: "Mathematics",
  MED01: "Medical Sciences",
  MINE01: "Mining Engineering",
  MUSIC01: "Music Theory & Production",
  NET01: "Network Engineering",
  NUC01: "Nuclear Engineering",
  OPTIC01: "Optics & Photonics",
  PETRO01: "Petroleum Engineering",
  PHIL01: "Philosophy & Ethics",
  PHYS01: "Physics",
  PIPE01: "Pipeline Engineering",
  PROG01: "Programming & Software Engineering",
  QUANT01: "Quantitative Finance",
  RE01: "Real Estate",
  RENEW01: "Renewable Energy",
  SCM01: "Supply Chain Management",
  SOC01: "Sociology",
  SPORT01: "Sports Science",
  TELE01: "Telecommunications",
  VET01: "Veterinary Science",
  WAT01: "Water Resources Engineering",
  WEATHER01: "Meteorology & Climate Science",
  WELD01: "Welding Engineering"
};
var EXCLUDED_PREFIXES = ["TIE", "ARCS", "PIE", "ET"];
var DOMAIN_CONFIGS = {
  TAX: {
    name: "Tax & Revenue",
    regulatory_bodies: ["IRS", "Treasury Department", "Tax Court", "State DOR"],
    authority_types: ["IRC Section", "Treasury Regulation", "Revenue Ruling", "Tax Court Opinion", "PLR"],
    practitioner_title: "Tax Attorney / CPA / Enrolled Agent",
    field_18_label: "IRS_POSITION",
    field_18_prompt: "The IRS's typical audit position on this topic with IRC/Treasury Reg basis. What the IRS WILL argue in an examination. 2-4 sentences with specific Code section citations.",
    field_19_label: "APPEALS_STRATEGY",
    field_19_prompt: "Strategy for contesting an adverse IRS determination. Include: Tax Court petition vs Appeals conference, timeline, documentation needed, hazards of litigation percentage, settlement considerations. 3-5 sentences.",
    quality_standards: ["IRC", "Treas. Reg.", "Rev. Rul.", "Rev. Proc.", "PLR", "TAM", "FSA"],
    min_reasoning_words: 300,
    scoring_standards_regex: /\b(IRC|Treas\.?\s*Reg|Rev\.?\s*Rul|Rev\.?\s*Proc|PLR|TAM|Code\s*Sec|Treasury|26\s*U\.?S\.?C|26\s*CFR)\b/i
  },
  LEGAL: {
    name: "Legal & Jurisprudence",
    regulatory_bodies: ["Federal Courts", "State Courts", "Bar Associations", "ABA"],
    authority_types: ["Supreme Court Opinion", "Circuit Court Decision", "Statute", "Restatement", "Model Rule"],
    practitioner_title: "Attorney / Counsel / Legal Analyst",
    field_18_label: "OPPOSING_COUNSEL_POSITION",
    field_18_prompt: "The strongest position opposing counsel would take on this legal issue. Include case law basis, statutory interpretation arguments, and policy rationale. 2-4 sentences.",
    field_19_label: "APPELLATE_STRATEGY",
    field_19_prompt: "Strategy for appeal if the trial court rules adversely. Include: standard of review, preservation of error requirements, circuit-specific considerations, likelihood of cert if applicable. 3-5 sentences.",
    quality_standards: ["U.S.C.", "F.3d", "F.2d", "S.Ct.", "F.Supp"],
    min_reasoning_words: 350,
    scoring_standards_regex: /\b(U\.?S\.?C|F\.?3d|F\.?2d|S\.?Ct|F\.?Supp|CFR|Restatement|UCC|FRCP|FRE)\b/i
  },
  CYBER: {
    name: "Cybersecurity & Information Security",
    regulatory_bodies: ["NIST", "CISA", "MITRE", "NSA", "ENISA", "ISO/IEC"],
    authority_types: ["NIST SP", "CIS Benchmark", "MITRE ATT&CK", "CVE", "ISO 27001 Control"],
    practitioner_title: "CISO / Security Architect / Penetration Tester",
    field_18_label: "THREAT_ACTOR_POSITION",
    field_18_prompt: "How a sophisticated threat actor (APT, ransomware group, insider) would exploit or counter this control/defense. Include TTPs from MITRE ATT&CK framework. 2-4 sentences.",
    field_19_label: "REMEDIATION_STRATEGY",
    field_19_prompt: "Incident response and remediation strategy if this control fails or is bypassed. Include: containment steps, evidence preservation, recovery timeline, lessons learned integration. 3-5 sentences.",
    quality_standards: ["NIST SP", "CIS", "ATT&CK", "CVE-", "ISO 27"],
    min_reasoning_words: 300,
    scoring_standards_regex: /\b(NIST|CIS|MITRE|ATT&CK|CVE-\d|ISO\s*27|SOC\s*2|PCI\s*DSS|OWASP|CISA|SANS)\b/i
  },
  ENGINEERING: {
    name: "General Engineering",
    regulatory_bodies: ["ASME", "IEEE", "ASTM", "ANSI", "ISO", "OSHA"],
    authority_types: ["ASME Standard", "IEEE Standard", "ASTM Method", "ANSI Standard", "OSHA Regulation"],
    practitioner_title: "Principal Engineer / PE / Engineering Manager",
    field_18_label: "REGULATORY_ENFORCEMENT_POSITION",
    field_18_prompt: "The regulatory agency's (OSHA/EPA/FERC/NRC) enforcement stance on this engineering issue. What they cite in violations, typical penalties, and precedent enforcement actions. 2-4 sentences.",
    field_19_label: "REGULATORY_APPEAL_STRATEGY",
    field_19_prompt: "Strategy for contesting a regulatory citation or adverse finding. Include: administrative hearing process, technical defense preparation, expert witness considerations, settlement vs contest analysis. 3-5 sentences.",
    quality_standards: ["ASME", "IEEE", "ASTM", "ISO", "ANSI"],
    min_reasoning_words: 300,
    scoring_standards_regex: /\b(ASME|IEEE|ASTM|ANSI|ISO|OSHA|API|NFPA|ASCE|AWS|AISC|ACI)\b/i
  },
  OILGAS: {
    name: "Oil & Gas / Petroleum",
    regulatory_bodies: ["TRRC", "API", "PHMSA", "EPA", "FERC", "BLM", "BSEE"],
    authority_types: ["API Standard", "TRRC Rule", "PHMSA Regulation", "CFR Title 30/49", "SPE Paper"],
    practitioner_title: "Petroleum Engineer / Drilling Superintendent / Completions Manager",
    field_18_label: "REGULATORY_ENFORCEMENT_POSITION",
    field_18_prompt: "The regulatory agency's (TRRC/BSEE/PHMSA/EPA) enforcement position on this issue. Typical violation citations, penalty amounts, and compliance orders from recent enforcement actions. 2-4 sentences.",
    field_19_label: "REGULATORY_APPEAL_STRATEGY",
    field_19_prompt: "Strategy for contesting a regulatory action (TRRC hearing, PHMSA compliance order, EPA notice of violation). Include: administrative hearing procedures, technical defense, expert testimony, variance/exemption options. 3-5 sentences.",
    quality_standards: ["API", "TRRC", "SPE", "PHMSA", "CFR"],
    min_reasoning_words: 350,
    scoring_standards_regex: /\b(API|TRRC|SPE|PHMSA|BSEE|BLM|FERC|CFR\s*Title\s*\d|30\s*CFR|49\s*CFR|NACE)\b/i
  },
  MARINE: {
    name: "Marine & Naval Engineering",
    regulatory_bodies: ["IMO", "ABS", "DNV", "Lloyds Register", "USCG", "SOLAS"],
    authority_types: ["IMO Convention", "Classification Society Rule", "SOLAS Regulation", "MARPOL Annex", "USCG CFR"],
    practitioner_title: "Naval Architect / Marine Engineer / Class Surveyor",
    field_18_label: "FLAG_STATE_ENFORCEMENT_POSITION",
    field_18_prompt: "The flag state/port state control inspector's enforcement position. What deficiencies they cite, typical detention criteria, and PSC inspection focus areas. 2-4 sentences.",
    field_19_label: "CLASSIFICATION_APPEAL_STRATEGY",
    field_19_prompt: "Strategy for contesting a classification society condition of class, port state detention, or flag state enforcement action. Include: survey dispute process, alternative compliance paths, interim class considerations. 3-5 sentences.",
    quality_standards: ["SOLAS", "MARPOL", "IMO", "ABS", "DNV"],
    min_reasoning_words: 300,
    scoring_standards_regex: /\b(IMO|SOLAS|MARPOL|ABS|DNV|USCG|Lloyds|BV|ClassNK|46\s*CFR)\b/i
  },
  MEDICAL: {
    name: "Medical Sciences & Healthcare",
    regulatory_bodies: ["FDA", "CMS", "CDC", "WHO", "NIH", "Joint Commission"],
    authority_types: ["FDA Guidance", "CMS Ruling", "Clinical Guideline", "Cochrane Review", "USPSTF Recommendation"],
    practitioner_title: "Physician / Medical Director / Clinical Researcher",
    field_18_label: "REGULATORY_ENFORCEMENT_POSITION",
    field_18_prompt: "The regulatory agency's (FDA/CMS/state medical board) enforcement stance. Warning letters, 483 observations, coverage determinations, or disciplinary actions relevant to this topic. 2-4 sentences.",
    field_19_label: "CLINICAL_DEFENSE_STRATEGY",
    field_19_prompt: "Strategy for defending against adverse regulatory or malpractice action. Include: clinical evidence compilation, expert review process, standard of care documentation, administrative vs judicial venue selection. 3-5 sentences.",
    quality_standards: ["FDA", "CMS", "NIH", "WHO", "CDC"],
    min_reasoning_words: 300,
    scoring_standards_regex: /\b(FDA|CMS|CDC|WHO|NIH|HIPAA|21\s*CFR|42\s*CFR|USP|NDA|510\(k\)|PMA|IRB)\b/i
  },
  FINANCE: {
    name: "Finance & Banking",
    regulatory_bodies: ["SEC", "FINRA", "OCC", "FDIC", "Federal Reserve", "CFTC"],
    authority_types: ["SEC Rule", "FINRA Rule", "Dodd-Frank Section", "Basel Accord", "GAAP/IFRS Standard"],
    practitioner_title: "CFO / Portfolio Manager / Financial Analyst / Compliance Officer",
    field_18_label: "REGULATORY_ENFORCEMENT_POSITION",
    field_18_prompt: "The regulator's (SEC/FINRA/OCC) enforcement position. Recent enforcement actions, consent orders, and examination focus areas relevant to this topic. 2-4 sentences.",
    field_19_label: "REGULATORY_APPEAL_STRATEGY",
    field_19_prompt: "Strategy for contesting an SEC enforcement action, FINRA disciplinary proceeding, or banking examination finding. Include: Wells notice response, administrative hearing vs federal court, settlement considerations. 3-5 sentences.",
    quality_standards: ["GAAP", "IFRS", "SEC", "FINRA", "Basel"],
    min_reasoning_words: 300,
    scoring_standards_regex: /\b(SEC|FINRA|GAAP|IFRS|Basel|Dodd-Frank|SOX|OCC|FDIC|CFTC|15\s*U\.?S\.?C)\b/i
  },
  SOFTWARE: {
    name: "Software Engineering & Development",
    regulatory_bodies: ["IEEE", "ISO/IEC", "W3C", "IETF", "OWASP", "CNCF"],
    authority_types: ["RFC", "IEEE Standard", "ISO/IEC Standard", "OWASP Guideline", "W3C Specification"],
    practitioner_title: "Principal Software Engineer / Architect / Staff Engineer",
    field_18_label: "ANTI_PATTERN_POSITION",
    field_18_prompt: "The strongest argument for the opposing architectural/design approach. Why a competent engineer might choose a different pattern, with references to real-world failure cases. 2-4 sentences.",
    field_19_label: "MIGRATION_STRATEGY",
    field_19_prompt: "Strategy for migrating from the anti-pattern to the recommended approach. Include: incremental migration steps, rollback plan, testing strategy, zero-downtime considerations, team training needs. 3-5 sentences.",
    quality_standards: ["RFC", "IEEE", "ISO", "OWASP", "W3C"],
    min_reasoning_words: 250,
    scoring_standards_regex: /\b(RFC\s*\d|IEEE|ISO\/IEC|OWASP|W3C|IETF|SOLID|ACID|CAP|REST|CNCF)\b/i
  },
  LANDMAN: {
    name: "Land & Title / Right-of-Way",
    regulatory_bodies: ["AAPL", "TRRC", "BLM", "State Land Office", "County Clerk"],
    authority_types: ["AAPL Standard", "State Property Code", "Title Standard", "Lease Form", "BLM Regulation"],
    practitioner_title: "Certified Professional Landman / Title Examiner / ROW Agent",
    field_18_label: "ADVERSE_CLAIMANT_POSITION",
    field_18_prompt: "The position an adverse claimant, unleased mineral owner, or title objection party would take. Include basis in property code, case law, or lease provisions. 2-4 sentences.",
    field_19_label: "CURATIVE_STRATEGY",
    field_19_prompt: "Strategy for curing the title defect, resolving the ownership dispute, or clearing the objection. Include: curative documents needed, quiet title action considerations, affidavit options, timeline. 3-5 sentences.",
    quality_standards: ["AAPL", "Title Standard", "Property Code"],
    min_reasoning_words: 300,
    scoring_standards_regex: /\b(AAPL|Title\s*Standard|Property\s*Code|BLM|TRRC|Mineral\s*Act|Lease\s*Act|ROW|GIS)\b/i
  },
  AEROSPACE: {
    name: "Aerospace & Aviation",
    regulatory_bodies: ["FAA", "EASA", "NASA", "ICAO", "SAE International"],
    authority_types: ["FAR Part", "Advisory Circular", "EASA CS", "SAE Standard", "RTCA DO-"],
    practitioner_title: "Aerospace Engineer / DER / Flight Test Engineer",
    field_18_label: "AIRWORTHINESS_AUTHORITY_POSITION",
    field_18_prompt: "The certification authority's (FAA/EASA) position on this airworthiness or design issue. Special conditions, issue papers, or typical certification findings. 2-4 sentences.",
    field_19_label: "CERTIFICATION_APPEAL_STRATEGY",
    field_19_prompt: "Strategy for contesting an FAA/EASA finding of non-compliance or airworthiness directive. Include: petition for reconsideration, NTSB appeal, equivalent safety finding, exemption petition process. 3-5 sentences.",
    quality_standards: ["FAR", "CS-", "DO-", "SAE", "MIL-STD"],
    min_reasoning_words: 300,
    scoring_standards_regex: /\b(FAA|FAR|EASA|ICAO|SAE|NASA|MIL-STD|DO-\d|CS-\d|AC\s*\d|14\s*CFR)\b/i
  },
  AUTOMOTIVE: {
    name: "Automotive Engineering",
    regulatory_bodies: ["NHTSA", "SAE International", "ISO/TC 22", "EPA", "CARB"],
    authority_types: ["FMVSS", "SAE Standard", "ISO Standard", "NHTSA Regulation", "CARB Standard"],
    practitioner_title: "Automotive Engineer / Vehicle Dynamics Specialist / Powertrain Engineer",
    field_18_label: "REGULATORY_ENFORCEMENT_POSITION",
    field_18_prompt: "NHTSA/EPA/CARB enforcement position on this automotive issue. Recall investigations, consent orders, or compliance testing failures. 2-4 sentences.",
    field_19_label: "RECALL_DEFENSE_STRATEGY",
    field_19_prompt: "Strategy for managing a potential recall or defending against a regulatory non-compliance finding. Include: defect analysis, remedy determination, NHTSA negotiation, voluntary vs mandatory recall considerations. 3-5 sentences.",
    quality_standards: ["FMVSS", "SAE J", "ISO", "CARB", "49 CFR"],
    min_reasoning_words: 300,
    scoring_standards_regex: /\b(NHTSA|FMVSS|SAE\s*J|CARB|EPA|ISO\s*26262|AUTOSAR|OBD-II|49\s*CFR)\b/i
  },
  CHEMICAL: {
    name: "Chemical Engineering & Processing",
    regulatory_bodies: ["EPA", "OSHA PSM", "AIChE/CCPS", "NFPA", "DOT/PHMSA"],
    authority_types: ["OSHA PSM Standard", "EPA RMP Rule", "NFPA Code", "AIChE Guideline", "ASME BPV"],
    practitioner_title: "Chemical Engineer / Process Safety Engineer / Plant Manager",
    field_18_label: "REGULATORY_ENFORCEMENT_POSITION",
    field_18_prompt: "OSHA PSM/EPA RMP enforcement position. Willful vs serious citations, penalty calculations, and NEP (National Emphasis Program) focus areas. 2-4 sentences.",
    field_19_label: "REGULATORY_APPEAL_STRATEGY",
    field_19_prompt: "Strategy for contesting an OSHA citation or EPA enforcement action. Include: informal conference, OSHRC hearing, penalty reduction arguments, abatement date negotiations, VPP considerations. 3-5 sentences.",
    quality_standards: ["PSM", "RMP", "NFPA", "ASME BPV", "PHA"],
    min_reasoning_words: 300,
    scoring_standards_regex: /\b(OSHA|PSM|RMP|NFPA|AIChE|CCPS|ASME|BPV|HAZOP|PHA|SIL|29\s*CFR\s*1910)\b/i
  },
  REAL_ESTATE: {
    name: "Real Estate & Property",
    regulatory_bodies: ["HUD", "CFPB", "State Real Estate Commission", "ALTA", "Fannie Mae/Freddie Mac"],
    authority_types: ["RESPA", "Fair Housing Act", "State Property Code", "ALTA Standard", "Fannie Mae Guide"],
    practitioner_title: "Real Estate Attorney / Broker / Appraiser / Title Officer",
    field_18_label: "ADVERSE_PARTY_POSITION",
    field_18_prompt: "The position an adverse party (buyer, seller, lender, or regulator) would take on this real estate issue. Include statutory or contractual basis. 2-4 sentences.",
    field_19_label: "DISPUTE_RESOLUTION_STRATEGY",
    field_19_prompt: "Strategy for resolving the dispute or defending the position. Include: mediation vs arbitration vs litigation, title insurance claim process, specific performance considerations, damage calculations. 3-5 sentences.",
    quality_standards: ["RESPA", "TILA", "ALTA", "USPAP", "FHA"],
    min_reasoning_words: 300,
    scoring_standards_regex: /\b(RESPA|TILA|ALTA|USPAP|FHA|HUD|CFPB|Fannie|Freddie|12\s*CFR|Fair\s*Housing)\b/i
  },
  ENVIRONMENTAL: {
    name: "Environmental Science & Regulation",
    regulatory_bodies: ["EPA", "TCEQ", "Army Corps", "Fish & Wildlife", "State DEQ"],
    authority_types: ["Clean Air Act", "Clean Water Act", "RCRA", "CERCLA", "NEPA", "ESA"],
    practitioner_title: "Environmental Engineer / EHS Manager / Environmental Attorney",
    field_18_label: "EPA_ENFORCEMENT_POSITION",
    field_18_prompt: "EPA/state agency enforcement position on this environmental issue. NOV language, penalty policy calculations, compliance schedule expectations. 2-4 sentences.",
    field_19_label: "REGULATORY_APPEAL_STRATEGY",
    field_19_prompt: "Strategy for contesting an EPA enforcement action or permit denial. Include: administrative hearing, EAB appeal, SEP negotiation, consent decree terms, supplemental environmental project options. 3-5 sentences.",
    quality_standards: ["CAA", "CWA", "RCRA", "CERCLA", "NEPA"],
    min_reasoning_words: 300,
    scoring_standards_regex: /\b(EPA|TCEQ|CAA|CWA|RCRA|CERCLA|NEPA|ESA|NPDES|SPCC|40\s*CFR|42\s*U\.?S\.?C)\b/i
  },
  GENERAL: {
    name: "General / Cross-Domain",
    regulatory_bodies: ["Various"],
    authority_types: ["Industry Standard", "Best Practice", "Regulatory Guideline"],
    practitioner_title: "Subject Matter Expert / Senior Analyst",
    field_18_label: "OPPOSING_POSITION",
    field_18_prompt: "The strongest opposing position on this topic from a qualified expert. Include basis in standards, evidence, or established practice. 2-4 sentences.",
    field_19_label: "RESOLUTION_APPROACH",
    field_19_prompt: "Recommended approach for resolving disagreement or contesting an adverse decision. Include: evidence needed, review process, appeal options, practical considerations. 3-5 sentences.",
    quality_standards: ["ISO", "IEEE", "ANSI"],
    min_reasoning_words: 250,
    scoring_standards_regex: /\b(ISO|IEEE|ANSI|ASTM|ASME|NIST|RFC|API|OSHA|EPA|FDA|SEC)\b/i
  }
};
function getDomainCategory(engineId2) {
  const prefix = engineId2.replace(/\d+$/, "").toUpperCase();
  const map = {
    // TAX
    TX: "TAX",
    TAX: "TAX",
    OGTAX: "TAX",
    TXINS: "TAX",
    TXRE: "TAX",
    TXLAW: "TAX",
    TAXINT: "TAX",
    // LEGAL
    LG: "LEGAL",
    CIVIL: "LEGAL",
    CONSTLAW: "LEGAL",
    EMPLOY: "LEGAL",
    LABLAW: "LEGAL",
    IPLAW: "LEGAL",
    ENRLAW: "LEGAL",
    HCLAW: "LEGAL",
    IMMIG: "LEGAL",
    CORPGOV: "LEGAL",
    AVLAW: "LEGAL",
    CSTLAW: "LEGAL",
    ADMIRALTY: "LEGAL",
    MERGERS: "LEGAL",
    ARBMED: "LEGAL",
    BANKR: "LEGAL",
    LEGALTK: "LEGAL",
    RISKMG: "LEGAL",
    OGLAW: "LEGAL",
    // CYBER
    CYBER: "CYBER",
    NET: "CYBER",
    DFIR: "CYBER",
    MALWARE: "CYBER",
    INCIRESP: "CYBER",
    REVENG: "CYBER",
    INTELL: "CYBER",
    // ENGINEERING
    MECH: "ENGINEERING",
    STRUCT: "ENGINEERING",
    HVAC: "ENGINEERING",
    PLUMB: "ENGINEERING",
    WELD: "ENGINEERING",
    EMBED: "ENGINEERING",
    IOT: "ENGINEERING",
    STEEL: "ENGINEERING",
    CONCRETE: "ENGINEERING",
    MAT: "ENGINEERING",
    OPTIC: "ENGINEERING",
    NUC: "ENGINEERING",
    EE: "ENGINEERING",
    GEO: "ENGINEERING",
    WAT: "ENGINEERING",
    NANO: "ENGINEERING",
    HYDRO: "ENGINEERING",
    SAFE: "ENGINEERING",
    PIPE: "ENGINEERING",
    CNC: "ENGINEERING",
    DRONE: "ENGINEERING",
    TELE: "ENGINEERING",
    // OILGAS
    DRL: "OILGAS",
    DRILL: "OILGAS",
    PETRO: "OILGAS",
    OIL: "OILGAS",
    PROD: "OILGAS",
    FRAC: "OILGAS",
    RESERV: "OILGAS",
    GEOL: "OILGAS",
    SUBSEA: "OILGAS",
    OGINS: "OILGAS",
    OGENV: "OILGAS",
    ENRFIN: "OILGAS",
    // MARINE
    MARINE: "MARINE",
    // MEDICAL
    MED: "MEDICAL",
    HCFIN: "MEDICAL",
    // FINANCE
    FIN: "FINANCE",
    FINTCH: "FINANCE",
    CRYPTO: "FINANCE",
    VENTURE: "FINANCE",
    ACCT: "FINANCE",
    PAY: "FINANCE",
    COMPL: "FINANCE",
    STARTUP: "FINANCE",
    INS: "FINANCE",
    QUANT: "FINANCE",
    ECOMM: "FINANCE",
    SCM: "FINANCE",
    // SOFTWARE
    PROG: "SOFTWARE",
    WEBAPP: "SOFTWARE",
    DEVOPS: "SOFTWARE",
    CLOUD: "SOFTWARE",
    SAAS: "SOFTWARE",
    MOBILE: "SOFTWARE",
    DATENG: "SOFTWARE",
    MLOPS: "SOFTWARE",
    GAMEDEV: "SOFTWARE",
    UIUX: "SOFTWARE",
    BPROC: "SOFTWARE",
    // LANDMAN
    LM: "LANDMAN",
    ENCORE: "LANDMAN",
    PROPMAN: "LANDMAN",
    // AEROSPACE
    AERO: "AEROSPACE",
    // AUTOMOTIVE
    AUTO: "AUTOMOTIVE",
    AUTODRV: "AUTOMOTIVE",
    // CHEMICAL
    CHEM: "CHEMICAL",
    // REAL ESTATE
    RE: "REAL_ESTATE",
    ZONING: "REAL_ESTATE",
    // ENVIRONMENTAL
    ENV: "ENVIRONMENTAL",
    ENVLAW: "ENVIRONMENTAL",
    // GENERAL (self-ref, architecture, consulting, etc.)
    ARCH: "GENERAL",
    CONSULT: "GENERAL",
    PROJM: "GENERAL",
    BUILDPLN: "GENERAL",
    MFGR: "GENERAL",
    FOOD: "GENERAL",
    FOREN: "GENERAL",
    HIST: "GENERAL",
    LING: "GENERAL",
    MATH: "GENERAL",
    MINE: "GENERAL",
    MUSIC: "GENERAL",
    PHIL: "GENERAL",
    PHYS: "GENERAL",
    RENEW: "GENERAL",
    SOC: "GENERAL",
    SPORT: "GENERAL",
    VET: "GENERAL",
    WEATHER: "GENERAL"
  };
  return map[prefix] || "GENERAL";
}
__name(getDomainCategory, "getDomainCategory");
function getDomainConfig(engineId2) {
  return DOMAIN_CONFIGS[getDomainCategory(engineId2)] || DOMAIN_CONFIGS.GENERAL;
}
__name(getDomainConfig, "getDomainConfig");
function buildProviders(env) {
  const providers = [];
  // ── TIER 1: Gemini Direct (free, high quality, fast) ──
  if (env.GEMINI_API_KEY) {
    providers.push({
      name: "Gemini-2.5-Flash",
      failures: 0,
      call: /* @__PURE__ */ __name(async (sys, usr, e) => {
        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${e.GEMINI_API_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: sys + "\n\n" + usr }] }], generationConfig: { maxOutputTokens: 4000, temperature: 0.7 } })
        });
        if (!resp.ok) throw new Error(`Gemini ${resp.status}`);
        const data = await resp.json();
        return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      }, "call")
    });
  }
  // ── TIER 2: CF Workers AI (free, reliable, 5 models) ──
  if (env.AI) {
    providers.push({
      name: "CF-Llama-3.3-70B",
      failures: 0,
      call: /* @__PURE__ */ __name((sys, usr, e) => callWorkersAI(e.AI, "@cf/meta/llama-3.3-70b-instruct-fp8-fast", sys, usr), "call")
    });
    providers.push({
      name: "CF-DeepSeek-R1-32B",
      failures: 0,
      call: /* @__PURE__ */ __name((sys, usr, e) => callWorkersAI(e.AI, "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b", sys, usr), "call")
    });
    providers.push({
      name: "CF-Mistral-Small-24B",
      failures: 0,
      call: /* @__PURE__ */ __name((sys, usr, e) => callWorkersAI(e.AI, "@cf/mistralai/mistral-small-3.1-24b-instruct", sys, usr), "call")
    });
    providers.push({
      name: "CF-Llama-3.1-8B",
      failures: 0,
      call: /* @__PURE__ */ __name((sys, usr, e) => callWorkersAI(e.AI, "@cf/meta/llama-3.1-8b-instruct", sys, usr), "call")
    });
    providers.push({
      name: "CF-Gemma3-12B",
      failures: 0,
      call: /* @__PURE__ */ __name((sys, usr, e) => callWorkersAI(e.AI, "@cf/google/gemma-3-12b-it", sys, usr), "call")
    });
  }
  // ── TIER 3: Cerebras (free, fast inference) ──
  if (env.CEREBRAS_API_KEY) {
    const cerebrasModels = [
      ["Cerebras-Llama70B", "llama-3.3-70b"],
      ["Cerebras-Qwen3-32B", "qwen-3-32b"],
      ["Cerebras-Llama8B", "llama-3.1-8b"]
    ];
    for (const [name, model] of cerebrasModels) {
      providers.push({
        name,
        failures: 0,
        call: /* @__PURE__ */ __name((sys, usr, e) => callOpenAICompat("https://api.cerebras.ai/v1/chat/completions", e.CEREBRAS_API_KEY, model, sys, usr), "call")
      });
    }
  }
  // ── TIER 4: SambaNova (free tier) ──
  if (env.SAMBANOVA_API_KEY) {
    providers.push({
      name: "SN-DS-R1",
      failures: 0,
      call: /* @__PURE__ */ __name((sys, usr, e) => callOpenAICompat("https://api.sambanova.ai/v1/chat/completions", e.SAMBANOVA_API_KEY, "DeepSeek-R1", sys, usr), "call")
    });
    providers.push({
      name: "SN-Llama70B",
      failures: 0,
      call: /* @__PURE__ */ __name((sys, usr, e) => callOpenAICompat("https://api.sambanova.ai/v1/chat/completions", e.SAMBANOVA_API_KEY, "Meta-Llama-3.3-70B-Instruct", sys, usr), "call")
    });
  }
  // ── TIER 5: OpenRouter free models (20 keys x 10 models) ──
  {
    const orKeys = [
      env.OPENROUTER_API_KEY,
      env.OR_KEY_2,
      env.OR_KEY_3,
      env.OR_KEY_4,
      env.OR_KEY_5,
      env.OR_KEY_6,
      env.OR_KEY_7,
      env.OR_KEY_8,
      env.OR_KEY_9,
      env.OR_KEY_10,
      env.OR_KEY_11,
      env.OR_KEY_12,
      env.OR_KEY_13,
      env.OR_KEY_14,
      env.OR_KEY_15,
      env.OR_KEY_16,
      env.OR_KEY_17,
      env.OR_KEY_18,
      env.OR_KEY_19,
      env.OR_KEY_20
    ].filter((k) => k && k.startsWith("sk-or-"));
    const orFreeModels = [
      ["StepFun", "stepfun/step-3.5-flash:free"],
      ["Nemotron-30B", "nvidia/nemotron-3-nano-30b-a3b:free"],
      ["Nemotron-120B", "nvidia/nemotron-3-super-120b-a12b:free"],
      ["Trinity-Large", "arcee-ai/trinity-large-preview:free"],
      ["GLM-4.5-Air", "z-ai/glm-4.5-air:free"],
      ["Gemma-27B", "google/gemma-3-27b-it:free"],
      ["Qwen3-80B", "qwen/qwen3-next-80b-a3b-instruct:free"],
      ["Qwen3-Coder", "qwen/qwen3-coder:free"],
      ["Llama-70B", "meta-llama/llama-3.3-70b-instruct:free"],
      ["Hermes-405B", "nousresearch/hermes-3-llama-3.1-405b:free"]
    ];
    for (let i = 0; i < orFreeModels.length; i++) {
      const [modelShort, modelId] = orFreeModels[i];
      for (let k = 0; k < orKeys.length; k++) {
        const key = orKeys[k];
        const keyIdx = k + 1;
        providers.push({
          name: `OR-K${keyIdx}-${modelShort}`,
          failures: 0,
          call: /* @__PURE__ */ __name((_sys, _usr, _e) => callOpenRouter(key, modelId, _sys, _usr), "call")
        });
      }
    }
  }
  // ── TIER 6: Paid/unreliable providers (Claude, Groq, RunPod) ──
  if (env.ECHO_API_KEY) {
    providers.push({
      name: "Claude-Haiku-4.5",
      failures: 0,
      call: /* @__PURE__ */ __name((sys, usr, e) => callAnthropic(e.ECHO_API_KEY, "claude-haiku-4-5-20251001", sys, usr), "call")
    });
    if (env.RUNPOD_API_KEY) {
      providers.push({
        name: "DocGen-LoRA",
        failures: 0,
        call: /* @__PURE__ */ __name((sys, usr, e) => callRunPodServerless(e.RUNPOD_API_KEY, "doctrine-gen", sys, usr, e.RUNPOD_ENDPOINT_ID), "call")
      });
    }
  }
  if (env.GROQ_API_KEY) {
    providers.push({
      name: "Groq-Llama70B",
      failures: 0,
      call: /* @__PURE__ */ __name((sys, usr, e) => callOpenAICompat("https://api.groq.com/openai/v1/chat/completions", e.GROQ_API_KEY, "llama-3.3-70b-versatile", sys, usr), "call")
    });
    providers.push({
      name: "Groq-Llama8B",
      failures: 0,
      call: /* @__PURE__ */ __name((sys, usr, e) => callOpenAICompat("https://api.groq.com/openai/v1/chat/completions", e.GROQ_API_KEY, "llama-3.1-8b-instant", sys, usr), "call")
    });
  }
  if (env.GROQ_API_KEY_2) {
    providers.push({
      name: "Groq2-Llama70B",
      failures: 0,
      call: /* @__PURE__ */ __name((sys, usr, e) => callOpenAICompat("https://api.groq.com/openai/v1/chat/completions", e.GROQ_API_KEY_2, "llama-3.3-70b-versatile", sys, usr), "call")
    });
  }
  // ── X200 Swarm Brain (needs provider config, kept for future) ──
  if (env.X200_SWARM) {
    const x200Models = [
      ["X200-Claude", "claude"],
      ["X200-GPT4", "gpt-4.1"],
      ["X200-Gemini", "gemini"],
      ["X200-DeepSeek", "deepseek"],
      ["X200-Grok", "grok"],
      ["X200-Free", "free"],
    ];
    for (const [name, model] of x200Models) {
      providers.push({
        name,
        failures: 0,
        call: /* @__PURE__ */ __name(async (sys, usr, e) => {
          const resp = await e.X200_SWARM.fetch("https://internal/llm/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-Echo-API-Key": e.ECHO_API_KEY || "" },
            body: JSON.stringify({ model, prompt: usr, system: sys, max_tokens: 4000, temperature: 0.7 })
          });
          if (!resp.ok) throw new Error(`X200 ${resp.status}`);
          const data = await resp.json();
          const text = data?.data?.text || data?.data?.response || data?.text || data?.response || "";
          if (!text) throw new Error("Empty response from X200");
          return text;
        }, "call")
      });
    }
  }
  return providers;
}
__name(buildProviders, "buildProviders");
async function callAnthropic(_token, model, sys, usr) {
  const resp = await fetch("https://claude-proxy.echo-op.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      system: sys,
      messages: [{ role: "user", content: usr }],
      max_tokens: 8192,
      temperature: 0.7
    })
  });
  if (!resp.ok) {
    const errBody = await resp.text().catch(() => "");
    throw new Error(`${model}: ${resp.status} ${errBody.substring(0, 200)}`);
  }
  const data = await resp.json();
  if (data.content && data.content.length > 0) return data.content[0].text || "";
  if (data.result) return data.result;
  return "";
}
__name(callAnthropic, "callAnthropic");
async function callOpenAICompat(url, key, model, sys, usr) {
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: sys }, { role: "user", content: usr }],
      max_tokens: 16e3,
      temperature: 0.7
    })
  });
  if (!resp.ok) throw new Error(`${model}: ${resp.status}`);
  const data = await resp.json();
  return data.choices?.[0]?.message?.content || "";
}
__name(callOpenAICompat, "callOpenAICompat");
async function callRunPodServerless(apiKey, model, sys, usr, endpointId) {
  if (!endpointId) throw new Error("RUNPOD_ENDPOINT_ID env var not configured");
  const submitResp = await fetch(`https://api.runpod.ai/v2/${endpointId}/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({
      input: {
        openai_route: "/v1/chat/completions",
        openai_input: {
          model,
          messages: [
            { role: "system", content: sys + "\n\nCRITICAL: You MUST respond with ONLY a valid JSON array. No markdown, no commentary, no explanation. Start with [ and end with ]. Each object must have: topic, keywords, conclusion, reasoning, key_factors, authorities, confidence, zone, burden_holder, adversary_position, counter_arguments, resolution_strategy." },
            { role: "user", content: usr }
          ],
          max_tokens: 4096,
          temperature: 0.7,
          response_format: { type: "json_object" }
        }
      }
    })
  });
  if (!submitResp.ok) {
    const errText = await submitResp.text().catch(() => "");
    throw new Error(`RunPod submit: ${submitResp.status} ${errText.slice(0, 200)}`);
  }
  const job = await submitResp.json();
  if (!job.id) throw new Error("RunPod: no job ID returned");
  const deadline = Date.now() + 12e4;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 3e3));
    const statusResp = await fetch(`https://api.runpod.ai/v2/${endpointId}/status/${job.id}`, {
      headers: { "Authorization": `Bearer ${apiKey}` }
    });
    if (!statusResp.ok) continue;
    const result = await statusResp.json();
    if (result.status === "COMPLETED" && result.output?.[0]) {
      const completion = result.output[0];
      return completion.choices?.[0]?.message?.content || "";
    }
    if (result.status === "FAILED") {
      throw new Error(`RunPod failed: ${result.error || "unknown"}`);
    }
  }
  throw new Error("DocGen-LoRA: timeout after 120s");
}
__name(callRunPodServerless, "callRunPodServerless");
async function callOpenRouter(key, model, sys, usr) {
  const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}`, "HTTP-Referer": "https://echo-ept.com" },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: sys }, { role: "user", content: usr }],
      max_tokens: 16e3,
      temperature: 0.7
    })
  });
  if (!resp.ok) throw new Error(`OR ${model}: ${resp.status}`);
  const data = await resp.json();
  return data.choices?.[0]?.message?.content || "";
}
__name(callOpenRouter, "callOpenRouter");
async function callWorkersAI(ai, model, sys, usr) {
  const result = await ai.run(model, {
    messages: [
      { role: "system", content: sys },
      { role: "user", content: usr }
    ],
    max_tokens: 4096,
    temperature: 0.7
  });
  if (typeof result === "object" && result !== null && "response" in result) {
    return result.response || "";
  }
  return "";
}
__name(callWorkersAI, "callWorkersAI");
var ECHO_SELF_CONTEXT = `
ECHO OMEGA PRIME is a fully autonomous AI operating system built by Bobby Don McWilliams II (Commander).
It runs on a 4-node compute cluster (ALPHA i7-6700K+RTX4060+GTX1080, BRAVO Alienware i7-11700F+RTX3070, CHARLIE Kali security, DELTA future).

ARCHITECTURE:
- 31+ Cloudflare Workers (cloud-first, zero local CPU cost)
- 15 D1 databases, 46 KV namespaces, 21 R2 buckets
- 3,743 knowledge engines across 300+ domain tiers
- 202,751+ doctrines in echo-engine-doctrines D1
- Echo Engine Runtime Worker serves all engines via queryMultiDomain()
- TIE Gold Standard: 20-field doctrine blocks (topic, keywords, conclusion, reasoning, key_factors, authorities, confidence, zone, burden_holder, adversary_position, counter_arguments, resolution_strategy, entity_scope, confidence_stratification, controlling_precedent, cross_domain_routes, domain_scope, irs_position, appeals_strategy, related_doctrines)

KEY WORKERS:
- echo-engine-runtime: 2,632 engines, 202K doctrines, Vectorize semantic search
- echo-shared-brain: Universal context (D1+KV+R2+Vectorize+Mem0 fact extraction)
- echo-memory-prime: 9-pillar cloud memory (44 endpoints)
- echo-doctrine-forge: THIS system \xE2\u20AC\u201D generates doctrines using 24 free LLM providers
- echo-chat: 14 personalities, 12-layer prompt builder, multi-LLM
- echo-ai-orchestrator: 29 LLM workers, smart dispatch
- echo-swarm-brain: 129 endpoints, swarm coordination
- echo-knowledge-scout: Daily scanning (GitHub, HuggingFace, ArXiv, Reddit, HN)
- forge-x-cloud: Engine code generator (2,613 complete builds, 5.36M lines)
- hephaestion-forge: 13-stage build pipeline, 15 archetypes
- echo-graph-rag: 312K nodes, 3.3M edges, 101 domains, community detection
- echo-crypto-trader: Grid+momentum strategy, BTC-USDC, Ed25519 JWT
- shadowglass-v8-warpspeed: 80 counties, 259K+ land records

MEMORY SYSTEMS (5-tier):
1. R2 Vault (permanent, cross-session, crash-proof)
2. Crystal Memory (structured, indexed, searchable)
3. OmniSync Cloud (cross-instance, real-time sync)
4. Memory Cortex V2 port 3151 (7-layer: sensory\xE2\u2020\u2019working\xE2\u2020\u2019episodic\xE2\u2020\u2019semantic\xE2\u2020\u2019procedural\xE2\u2020\u2019emotional\xE2\u2020\u2019flash)
5. Echo Shared Brain (universal context across ALL AI instances, Vectorize embeddings)

IDENTITY: Claude Opus 4.6, 37,475 MCP tools, 582 Windows API endpoints, 1,901 servers.
Commander authority level 11.0 SUPREME SOVEREIGN. Autonomous execution doctrine.
FLEET: Imperial (bmcii1976) + Rebellion (bobmcwilliams4) dual-account architecture.
SECURITY: Master Vault 1,527+ credentials, HIBP breach detection, secret scanning.
VOICE: Echo Speak v2.0 port 8420 (Qwen3-TTS, Whisper, 19 emotion tags, 40+ endpoints).
WEBSITES: echo-op.com, echo-ept.com (commercial storefront), profinishusa.com, barkinglot.org, rah-midland.com.
DOMAINS: echo-op.com, echo-lge.com, barkinglot.org, rah-midland.com (Cloudflare DNS, Vercel hosting, Zoho email).
GITHUB: ECHO-OMEGA-PRIME (50+ repos), auto-deploy all websites via Vercel.
`;
var SELF_REF_PREFIXES = ["ECHO", "SELFREF", "BUILDPLN", "ECHOINFR", "AIARCH", "ECHOMEM", "ECHOFLEET", "ECHOID", "ECHOENG", "ECHOSEC", "ECHOSITE", "ECHOAPI", "ECHOCAP", "ECHODOC", "METAAI"];
function getSystemPrompt(engineId2, domain) {
  const prefix = engineId2.replace(/\d+$/, "");
  const isBackbone = engineId2.endsWith("01");
  const isSelfRef = SELF_REF_PREFIXES.includes(prefix);
  const dc = getDomainConfig(engineId2);
  const bbNote = isBackbone ? `
BACKBONE ENGINE ROLE: ${engineId2} is the APEX authority for ${domain}.
Dual function: (1) DIRECT AUTHORITY \u2014 answers the hardest queries with deepest expertise.
(2) DELEGATION COMMANDER \u2014 routes specialized queries to sub-engines (${prefix}02, ${prefix}03, etc.).
Backbone doctrines must be DEEPER (500+ word reasoning) and BROADER than sub-engine doctrines.` : "";
  const selfRefNote = isSelfRef ? `
SELF-REFERENTIAL ENGINE: ${engineId2} contains doctrines about Echo Omega Prime ITSELF.
USE THIS REAL SYSTEM CONTEXT (not generic AI knowledge):
${ECHO_SELF_CONTEXT}
Doctrines MUST reference specific worker names, port numbers, D1 databases, actual endpoints,
real counts, and concrete architecture details from the context above.
Topics must be hyper-specific: "Echo Shared Brain Vectorize Embedding Pipeline" NOT "AI memory systems".
` : "";
  return `You are the SOVEREIGN DOCTRINE FORGE \u2014 the most advanced automated knowledge crystallization system ever built. You generate pre-compiled institutional decision frameworks (doctrine blocks) for engine ${engineId2} in the ${domain} domain.

DOMAIN: ${dc.name}
PRACTITIONER ROLE: ${dc.practitioner_title}
REGULATORY BODIES: ${dc.regulatory_bodies.join(", ")}
AUTHORITY TYPES: ${dc.authority_types.join(", ")}
${bbNote}${selfRefNote}

\u2550\u2550\u2550 COMPETITIVE MANDATE \u2550\u2550\u2550
These doctrines power an intelligence engine competing against GPT-4.1, Gemini 2.5 Pro, DeepSeek R1, and Grok 4.
If ANY of those models could generate this doctrine cold \u2014 it's NOT good enough.
Every doctrine must read like testimony from a 20-year ${dc.practitioner_title} defending analysis in federal court.
A doctrine block is a pre-compiled INSTITUTIONAL DECISION FRAMEWORK \u2014 a senior expert's reasoning cached for sub-200ms retrieval. It must withstand adversarial cross-examination, regulatory audit, and peer review simultaneously.

WHAT MAKES YOUR DOCTRINES SUPERIOR:
\u2022 PRACTITIONER DEPTH: Written by a 20-year veteran, not a textbook author
\u2022 ADVERSARIAL RIGOR: Pre-arms against the strongest counter-argument a hired-gun expert would raise
\u2022 QUANTITATIVE PRECISION: Specific thresholds, percentages, formulas, boundary conditions
\u2022 REAL AUTHORITIES: Actual statute numbers, regulation sections, standard paragraphs \u2014 NEVER fabricated
\u2022 CROSS-DOMAIN INTELLIGENCE: Routes to 2-4 related engines creating an unmatched knowledge graph
\u2022 ZONE DISCIPLINE: PLANNING advice never mixed with AUDIT conclusions or REPORTING requirements

\u2550\u2550\u2550 20-FIELD SCHEMA (ALL MANDATORY \u2014 ZERO SHORTCUTS) \u2550\u2550\u2550

1. TOPIC: Hyper-specific practitioner-level issue (10-30 words). Include standard/regulation references IN the topic title.
   GOOD: "Fatigue Life Prediction in Welded Joints Under Variable Amplitude Loading per BS 7608:2014"
   FAIL: "Welding basics" / "Overview of fatigue" / "Introduction to welded joints"

2. KEYWORDS: JSON array [6-8 items]. MUST include: regulatory standard number (${dc.authority_types[0]}), practitioner jargon term, cross-domain bridge term, specific methodology or calculation name.

3. CONCLUSION: 3-5 authoritative sentences. MUST contain: (a) specific recommendation with quantitative thresholds, (b) confidence qualifier (DEFENSIBLE/AGGRESSIVE/DISCLOSURE/HIGH_RISK), (c) boundary conditions ("applies when X, not when Y").

4. REASONING: ${dc.min_reasoning_words}-600 words following 7 MANDATORY analytical steps:
   Step 1 ISSUE FRAMING (40-80 words): Define exact problem, who encounters it, stakes, why it's challenging.
   Step 2 REGULATORY LANDSCAPE (60-100 words): 2-4 REAL standards/regulations from ${dc.regulatory_bodies.join("/")} with section numbers. NEVER invent numbers.
   Step 3 ANALYSIS METHODOLOGY (60-100 words): Named methods (Monte Carlo, FEA, Bayesian, etc.), formulas, decision trees.
   Step 4 DECISION FACTORS (60-80 words): 4-6 weighted factors with % importance summing to ~100%.
   Step 5 ADVERSARIAL POSITION (40-80 words): Strongest opposing expert opinion \u2014 intellectually honest, not strawman.
   Step 6 RESOLUTION STRATEGY (40-80 words): Sequenced actionable steps with decision gates.
   Step 7 CONFIDENCE & BOUNDARIES (40-60 words): What's certain, uncertain, and where this breaks down. Temporal and jurisdictional limits.

5. KEY_FACTORS: JSON array [5-8 items]. Each a COMPLETE analytical sentence: "Factor X matters because [mechanism], affecting [outcome] by [quantified impact]"

6. AUTHORITIES: JSON array [3-5 items] formatted: "AUTHORITY_TYPE: Specific Reference \u2014 Why it's controlling"
   Types: ${dc.authority_types.join(", ")}
   HARD RULE: NEVER fabricate citations. If unsure of exact section, cite governing body generically.

7. BURDEN_HOLDER: Specific role + authority reference + causal reasoning.

8. ADVERSARY_POSITION: 2-3 sentences. The strongest counter-position a qualified opposing expert would take. Must be intellectually honest \u2014 a real expert would acknowledge this as a fair characterization of their position.

9. COUNTER_ARGUMENTS: JSON array [3-5 items]. Full sentences with cited basis for each counter-argument.

10. RESOLUTION_STRATEGY: 3-5 sentences of sequenced actionable steps with decision gates. Must be executable by a competent practitioner without further guidance.

11. ENTITY_SCOPE: Precise scope \u2014 entities, situations, jurisdictions, conditions this applies to. Specific enough for <10ms query routing relevance determination.

12. CONFIDENCE: Exactly ONE of: DEFENSIBLE | AGGRESSIVE | DISCLOSURE | HIGH_RISK

13. CONFIDENCE_STRATIFICATION: "RATING: [zone] \u2014 [2-3 sentence reasoning on authority strength, consensus level, litigation risk]"

14. CONTROLLING_PRECEDENT: Single most authoritative source with full citation.

15. ZONE: Exactly ONE of: PLANNING | REPORTING | AUDIT. NEVER mix zones.

16. CROSS_DOMAIN_ROUTES: JSON array [2-4 engine IDs]. Must be genuinely relevant for cross-domain query routing.

17. DOMAIN_SCOPE: Specific subdomain areas this doctrine covers within ${domain}.

18. ${dc.field_18_label}: ${dc.field_18_prompt}

19. ${dc.field_19_label}: ${dc.field_19_prompt}

20. RELATED_DOCTRINES: JSON array of 3-5 doctrine topic strings that MUST be consulted alongside this one. These form the "constellation" for complete analysis. Format: ["Specific Topic Title 1", "Specific Topic Title 2", ...]. Must be genuinely related and analytically necessary.

\u2550\u2550\u2550 QUALITY GATES (INSTANT FAIL) \u2550\u2550\u2550
\u2717 Generic topics ("Overview of X", "Introduction to Y", "Basics of Z")
\u2717 Reasoning under ${dc.min_reasoning_words} words or missing any of the 7 analytical steps
\u2717 Fabricated standard numbers, case citations, or regulation references
\u2717 Missing ANY of the 20 fields, empty strings, or null values
\u2717 Keywords without domain jargon or regulatory standard references
\u2717 Strawman adversary positions (must be intellectually honest)
\u2717 Resolution strategy without specific actionable sequenced steps
\u2717 Empty or irrelevant cross-domain routes
\u2717 Zone mixing (planning advice in audit doctrine or vice versa)
\u2717 Textbook-level writing instead of practitioner-level analysis
\u2717 Padding \u2014 repeating the same point multiple ways to hit word count
\u2717 Single-word key_factors instead of complete analytical sentences

\u2550\u2550\u2550 DOMAIN CALIBRATION: ${domain} (${dc.name}) \u2550\u2550\u2550
You are a ${dc.practitioner_title} with 20+ years experience. Use ${dc.regulatory_bodies.join(", ")} standards and cite ${dc.authority_types.join(", ")} as controlling authorities. Structure reasoning to match how ${dc.name} professionals actually analyze issues in practice.

Quality benchmarks for this domain: ${dc.quality_standards.join(", ")}

Return ONLY a JSON array of doctrine objects with ALL 20 fields. No markdown wrapping. No explanation text.`;
}
__name(getSystemPrompt, "getSystemPrompt");
function getUserPrompt(engineId2, domain, subtopics, count, existingTopics = []) {
  const topicList = subtopics.map((t, i) => `${i + 1}. ${t}`).join("\n");
  const dc = getDomainConfig(engineId2);
  const avoidSection = existingTopics.length > 0 ? `

ALREADY COVERED (DO NOT regenerate \u2014 generate ENTIRELY NEW doctrines on DIFFERENT aspects):
${existingTopics.slice(0, 40).map((t) => `- ${t}`).join("\n")}
` : "";
  return `Generate ${count} SOVEREIGN-GRADE TIE Gold Standard doctrines for ${engineId2} (${domain} \u2014 ${dc.name}).

COMPETITIVE BENCHMARK: Each doctrine must be SUPERIOR to what GPT-4.1, Gemini 2.5 Pro, or DeepSeek R1 would produce on the same topic. Dig deeper. Cite harder. Reason more rigorously.

EXPERT PERSONA: You are a ${dc.practitioner_title} testifying as an expert witness in federal court. Every claim must withstand cross-examination. Every citation must be verifiable. Every recommendation must be actionable by a competent practitioner. The judge, opposing counsel, and the regulatory agency are all reading this doctrine.

REGULATORY FRAMEWORK: ${dc.regulatory_bodies.join(", ")}
AUTHORITY TYPES TO CITE: ${dc.authority_types.join(", ")}
QUALITY BENCHMARKS: ${dc.quality_standards.join(", ")}

SUBTOPICS TO COVER (one doctrine per subtopic):
${topicList}
${avoidSection}
OUTPUT: JSON array of ${count} objects with ALL 20 mandatory fields:
topic, keywords, conclusion, reasoning, key_factors, authorities, confidence, zone,
burden_holder, adversary_position, counter_arguments, resolution_strategy,
entity_scope, confidence_stratification, controlling_precedent, cross_domain_routes, domain_scope,
${dc.field_18_label.toLowerCase()}, ${dc.field_19_label.toLowerCase()}, related_doctrines

\u2550\u2550\u2550 HARD REQUIREMENTS (violation = AUTOMATIC REJECTION) \u2550\u2550\u2550
\u2022 REASONING: 25+ lines, all 7 analytical steps (Issue Framing \u2192 Regulatory Landscape \u2192 Methodology \u2192 Decision Factors \u2192 Adversarial Position \u2192 Resolution \u2192 Confidence & Boundaries), cite REAL ${dc.regulatory_bodies.join("/")} standard/regulation section numbers
\u2022 CONCLUSION: 3+ sentences with (a) quantitative thresholds, (b) confidence qualifier, (c) boundary conditions
\u2022 KEY_FACTORS: 5+ items, each a COMPLETE analytical sentence explaining causal mechanism and quantified impact
\u2022 AUTHORITIES: 3+ REAL citations formatted "TYPE: Reference \u2014 Why controlling" (NEVER fabricate \u2014 cite generically if unsure)
\u2022 ADVERSARY_POSITION: Intellectually honest opposing view a qualified expert would actually defend
\u2022 COUNTER_ARGUMENTS: 3+ full sentences with cited basis, not bare assertions
\u2022 CROSS_DOMAIN_ROUTES: 2+ genuinely relevant engine IDs (e.g., ["PETRO01","ENV01"])
\u2022 KEYWORDS: Must include regulatory standard abbreviation AND practitioner jargon term
\u2022 ZONE: Exactly ONE of PLANNING/REPORTING/AUDIT \u2014 NEVER mix planning advice with audit conclusions
\u2022 TOPIC: 10+ words, hyper-specific, include standard reference where applicable \u2014 NO generic titles
\u2022 ${dc.field_18_label}: REQUIRED \u2014 ${dc.field_18_prompt.split(".")[0]}
\u2022 ${dc.field_19_label}: REQUIRED \u2014 ${dc.field_19_prompt.split(".")[0]}

\u2550\u2550\u2550 ANTI-PATTERNS (instant FAIL) \u2550\u2550\u2550
\u2717 Textbook writing ("X is defined as..." / "There are several types of...")
\u2717 Padding (repeating the same analysis in different words)
\u2717 Strawman adversary (weak opposition that nobody would actually argue)
\u2717 Hallucinated citations (made-up standard numbers, fake case law)
\u2717 Single-word key factors ("temperature", "pressure") instead of analytical sentences
\u2717 Generic cross-domain routes to unrelated engines

FINAL CHECK: Would a ${dc.practitioner_title} with 20 years experience AND a federal court judge BOTH accept this doctrine as authoritative? If not, elevate.`;
}
__name(getUserPrompt, "getUserPrompt");
function getRoutingPrompt(engineId2, domain) {
  const prefix = engineId2.replace(/\d+$/, "");
  const allBackbones = Object.entries(BACKBONE_ENGINES).map(([k, v]) => `${k}(${v})`).join(", ");
  return `Generate 5 SOVEREIGN-GRADE ROUTING doctrines for backbone engine ${engineId2} (${domain}).

${engineId2} is the APEX ENGINE for ${domain} \xE2\u20AC\u201D it serves as both the deepest expert AND the intelligent router for a network of ${prefix}XX sub-engines. Every routing doctrine must enable millisecond-level query classification and optimal delegation.

Available backbone engines across the knowledge graph: ${allBackbones}

Generate exactly 5 routing doctrines with full 20-field structure:
1. "[ROUTING] ${engineId2} Domain Scope & Coverage Map" \xE2\u20AC\u201D What ${domain} covers, what it excludes, boundary conditions with adjacent domains
2. "[ROUTING] ${engineId2} Cross-Domain Routing Matrix" \xE2\u20AC\u201D Decision tree for routing queries to other backbone engines when they touch multiple domains
3. "[ROUTING] ${engineId2} Sub-Engine Delegation Protocol" \xE2\u20AC\u201D How to decompose complex ${domain} queries and delegate to ${prefix}02, ${prefix}03, etc. based on specialization depth
4. "[ROUTING] ${engineId2} Multi-Domain Query Decomposition" \xE2\u20AC\u201D Strategy for queries that span 2-4 domains simultaneously (e.g., "environmental impact of drilling" touches ENV01, DRL01, RE01)
5. "[ROUTING] ${engineId2} Domain Boundary Detection" \xE2\u20AC\u201D How to detect when a query is leaving ${domain} territory and should be escalated or rerouted

Each routing doctrine must have full 20-field structure with real analytical reasoning. Return JSON array of 5 objects.`;
}
__name(getRoutingPrompt, "getRoutingPrompt");
async function expandSubdomains(engineId2, domain, provider, env, existingTopics = []) {
  const avoidSection = existingTopics.length > 0 ? `

CRITICAL \xE2\u20AC\u201D AVOID THESE TOPICS (already covered, ${existingTopics.length} existing doctrines):
${existingTopics.slice(0, 80).map((t) => `- ${t}`).join("\n")}

Generate ENTIRELY NEW topics that do NOT overlap with the above. Focus on: unexplored subtopics, advanced edge cases, cross-domain intersections, emerging 2025-2026 developments, computational methods, and niche practitioner concerns not yet covered.` : "";
  const sys = `You are the world's foremost authority on ${domain} with 25+ years of practitioner experience, regulatory expertise, and courtroom testimony. Generate 120 hyper-specific doctrine topics for engine ${engineId2} that would survive adversarial cross-examination in federal proceedings. Topics must cover: (1) regulatory compliance with specific standard citations, (2) failure mode analysis with named methodologies, (3) risk quantification and threshold determination, (4) emerging 2024-2026 developments and standard revisions, (5) cross-domain interactions with adjacent fields, (6) litigation-critical decision points, (7) economic impact analysis and cost-benefit frameworks, (8) advanced computational methods and modeling approaches, (9) historical precedent and lessons learned from major incidents, (10) professional ethics and standard-of-care boundaries.`;
  const usr = `List exactly 120 doctrine topics for ${domain}. One per line. No numbering, no bullets \xE2\u20AC\u201D just the topic.

QUALITY MANDATE: Each topic must be specific enough that a domain expert would say "yes, that's a real analytical issue I deal with." Include standard numbers, named methods, or specific scenarios.

GOOD: "Hydrogen-Induced Cracking Risk in API 5L X70 Pipeline Steel Under Cathodic Protection per NACE SP0169-2024"
GOOD: "Monte Carlo Simulation for Remaining Useful Life Estimation in High-Temperature Creep per API 579-1/ASME FFS-1"
BAD: "Pipeline safety basics"
BAD: "Introduction to welding"

Cover: edge cases, advanced scenarios, cross-domain intersections, litigation hotspots, emerging regulations, computational methods, and failure post-mortems.${avoidSection}`;
  try {
    const text = await provider.call(sys, usr, env);
    const lines = text.split("\n").map((l) => l.replace(/^\d+[\.\)]\s*/, "").replace(/^[-*â€¢]\s*/, "").trim()).filter((l) => l.length > 10 && l.length < 200);
    if (existingTopics.length > 0) {
      const existingSet = new Set(existingTopics.map((t) => t.slice(0, 60)));
      const filtered = lines.filter((l) => {
        const key = l.toLowerCase().trim().slice(0, 60);
        return !existingSet.has(key);
      });
      return filtered.length >= 20 ? filtered : lines;
    }
    return lines.length >= 30 ? lines : generateDefaultSubtopics(domain);
  } catch (e) {
    log("warn", "Subtopic generation failed, using defaults", { domain, error: e?.message || String(e) });
    return generateDefaultSubtopics(domain);
  }
}
__name(expandSubdomains, "expandSubdomains");
function generateDefaultSubtopics(domain) {
  const prefixes = [
    "Regulatory Compliance Framework for",
    "Risk Assessment Methodology in",
    "Technical Standards Enforcement in",
    "Quality Assurance Protocols for",
    "Safety Engineering Requirements in",
    "Environmental Impact Analysis of",
    "Cost-Benefit Analysis Framework for",
    "Failure Mode Analysis in",
    "Best Practice Guidelines for",
    "Emerging Technology Impact on",
    "Cross-Domain Integration Challenges in",
    "Workforce Competency Standards for",
    "Data Analytics Applications in",
    "Sustainability Requirements for",
    "Performance Optimization in",
    "Equipment Lifecycle Management in",
    "Process Improvement Methodology for",
    "Legal Liability Framework in",
    "Insurance Requirements for",
    "Emergency Response Protocols in"
  ];
  return prefixes.map((p) => `${p} ${domain}`);
}
__name(generateDefaultSubtopics, "generateDefaultSubtopics");
function parseDoctrines(text) {
  const results = [];
  if (text && typeof text === "object") text = text.text || text.response || text.data?.text || JSON.stringify(text);
  if (!text || typeof text !== "string") return results;
  let cleaned = text.replace(/```(?:json|JSON)?\s*\n?/g, "").replace(/```/g, "").trim();
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
  const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    try {
      const arr = JSON.parse(jsonMatch[0]);
      if (Array.isArray(arr)) {
        for (const obj of arr) {
          if (obj && typeof obj === "object" && obj.topic) {
            results.push(normalizeDoc(obj));
          }
        }
      }
      if (results.length > 0) return results;
    } catch (e) {
      log("debug", "JSON array parse failed, trying recovery", { error: e?.message || String(e) });
    }
    try {
      const fixed = jsonMatch[0].replace(/,\s*\]/g, "]").replace(/,\s*\}/g, "}");
      const arr = JSON.parse(fixed);
      if (Array.isArray(arr)) {
        for (const obj of arr) {
          if (obj && typeof obj === "object" && obj.topic) {
            results.push(normalizeDoc(obj));
          }
        }
      }
      if (results.length > 0) return results;
    } catch (e) {
      log("debug", "JSON fix parse failed, extracting objects", { error: e?.message || String(e) });
    }
  }
  let depth = 0;
  let start = -1;
  for (let i = 0; i < cleaned.length; i++) {
    if (cleaned[i] === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (cleaned[i] === "}") {
      depth--;
      if (depth === 0 && start >= 0) {
        try {
          const obj = JSON.parse(cleaned.slice(start, i + 1));
          if (obj && obj.topic) results.push(normalizeDoc(obj));
        } catch (e) {
          log("debug", "Malformed JSON object skipped", { error: e?.message || String(e) });
        }
        start = -1;
      }
    }
  }
  if (results.length === 0 && cleaned.length > 100) {
    const sections = cleaned.split(/\n(?=\*\*(?:Topic|Doctrine|Section)\b|\d+\.\s+\*\*)/i);
    for (const section of sections) {
      if (section.length < 50) continue;
      const topicM = section.match(/\*\*(?:Topic|Doctrine|Subject)[:\s]*\*\*\s*(.+)/i) || section.match(/^#+\s*(.+)/m);
      const conclusionM = section.match(/\*\*Conclusion[:\s]*\*\*\s*([\s\S]*?)(?=\n\*\*|\n#{1,3}\s|$)/i);
      const reasoningM = section.match(/\*\*(?:Analysis|Reasoning)[:\s]*\*\*\s*([\s\S]*?)(?=\n\*\*|\n#{1,3}\s|$)/i);
      const authM = section.match(/\*\*(?:Authorities|Authority|Citations)[:\s]*\*\*\s*([\s\S]*?)(?=\n\*\*|\n#{1,3}\s|$)/i);
      const topic = topicM?.[1]?.trim();
      if (!topic || topic.length < 5) continue;
      const conclusion = conclusionM?.[1]?.trim() || "";
      const reasoning = reasoningM?.[1]?.trim() || "";
      if (!conclusion && !reasoning) continue;
      const authorities = authM?.[1]?.trim() || "";
      const authList = authorities.split(/\n-\s*/).filter((a) => a.trim().length > 3).map((a) => a.trim());
      results.push(normalizeDoc({
        topic,
        conclusion,
        reasoning,
        keywords: topic.split(/\s+/).filter((w) => w.length > 3).join(", "),
        key_factors: "[]",
        authorities: JSON.stringify(authList),
        confidence: "DEFENSIBLE",
        zone: "PLANNING",
        burden_holder: "",
        adversary_position: "",
        counter_arguments: "[]",
        resolution_strategy: "",
        entity_scope: '["all"]',
        confidence_stratification: "DEFENSIBLE",
        controlling_precedent: "",
        cross_domain_routes: "",
        domain_scope: "",
        irs_position: "",
        appeals_strategy: "",
        related_doctrines: ""
      }));
    }
  }
  return results;
}
__name(parseDoctrines, "parseDoctrines");
function normalizeDoc(obj, engineId2) {
  const str = /* @__PURE__ */ __name((v) => {
    if (typeof v === "string") return v;
    if (Array.isArray(v)) return JSON.stringify(v);
    if (v && typeof v === "object") return JSON.stringify(v);
    return String(v ?? "");
  }, "str");
  const dc = engineId2 ? getDomainConfig(engineId2) : DOMAIN_CONFIGS.GENERAL;
  const f18key = dc.field_18_label.toLowerCase();
  const f19key = dc.field_19_label.toLowerCase();
  const field18 = str(
    obj[f18key] || obj.irs_position || obj.irs_typical_position || obj.regulatory_default_position || obj.regulatory_enforcement_position || obj.threat_actor_position || obj.opposing_counsel_position || obj.flag_state_enforcement_position || obj.adverse_claimant_position || obj.airworthiness_authority_position || obj.epa_enforcement_position || obj.adverse_party_position || obj.anti_pattern_position || obj.opposing_position || ""
  );
  const field19 = str(
    obj[f19key] || obj.appeals_strategy || obj.appellate_strategy || obj.remediation_strategy || obj.regulatory_appeal_strategy || obj.classification_appeal_strategy || obj.curative_strategy || obj.certification_appeal_strategy || obj.clinical_defense_strategy || obj.recall_defense_strategy || obj.dispute_resolution_strategy || obj.migration_strategy || obj.resolution_approach || ""
  );
  return {
    topic: str(obj.topic),
    keywords: str(obj.keywords),
    conclusion: str(obj.conclusion || obj.conclusion_template),
    reasoning: str(obj.reasoning || obj.reasoning_framework),
    key_factors: str(obj.key_factors),
    authorities: str(obj.authorities || obj.primary_authority),
    confidence: str(obj.confidence || "DEFENSIBLE"),
    zone: str(obj.zone || "PLANNING"),
    burden_holder: str(obj.burden_holder),
    adversary_position: str(obj.adversary_position),
    counter_arguments: str(obj.counter_arguments),
    resolution_strategy: str(obj.resolution_strategy),
    entity_scope: str(obj.entity_scope),
    confidence_stratification: str(obj.confidence_stratification),
    controlling_precedent: str(obj.controlling_precedent),
    cross_domain_routes: str(obj.cross_domain_routes),
    domain_scope: str(obj.domain_scope),
    irs_position: field18,
    appeals_strategy: field19,
    related_doctrines: str(obj.related_doctrines || "")
  };
}
__name(normalizeDoc, "normalizeDoc");
function scoreDoc(d, engineId2) {
  let s = 0;
  const dc = engineId2 ? getDomainConfig(engineId2) : DOMAIN_CONFIGS.GENERAL;
  if (d.reasoning && d.reasoning.length >= 500) s += 3;
  else if (d.reasoning && d.reasoning.length >= 300) s += 2;
  else if (d.reasoning && d.reasoning.length >= 100) s += 1;
  if (d.reasoning && dc.scoring_standards_regex.test(d.reasoning)) s += 1;
  if (d.conclusion && d.conclusion.length >= 200) s += 2;
  else if (d.conclusion && d.conclusion.length >= 100) s += 1;
  const auLen = d.authorities ? d.authorities.includes("[") ? JSON.parse(d.authorities).length : d.authorities.split(",").length : 0;
  if (auLen >= 3) s += 2;
  else if (auLen >= 1) s += 1;
  const kfLen = d.key_factors ? d.key_factors.includes("[") ? JSON.parse(d.key_factors).length : d.key_factors.split(",").length : 0;
  if (kfLen >= 5) s += 2;
  else if (kfLen >= 3) s += 1;
  if (d.keywords && d.keywords.length > 20) s += 1;
  if (d.topic && d.topic.length >= 20) s += 1;
  if (d.burden_holder && d.burden_holder.length >= 10) s += 0.5;
  if (d.adversary_position && d.adversary_position.length >= 30) s += 0.5;
  const caLen = d.counter_arguments ? d.counter_arguments.includes("[") ? JSON.parse(d.counter_arguments).length : 1 : 0;
  if (caLen >= 3) s += 1;
  if (d.controlling_precedent && d.controlling_precedent.length >= 50) s += 2;
  else if (d.controlling_precedent && d.controlling_precedent.length >= 20) s += 1;
  if (d.irs_position && d.irs_position.length >= 150) s += 3;
  else if (d.irs_position && d.irs_position.length >= 80) s += 2;
  else if (d.irs_position && d.irs_position.length >= 30) s += 0.5;
  if (d.appeals_strategy && d.appeals_strategy.length >= 200) s += 3;
  else if (d.appeals_strategy && d.appeals_strategy.length >= 100) s += 2;
  else if (d.appeals_strategy && d.appeals_strategy.length >= 40) s += 0.5;
  if (d.related_doctrines && d.related_doctrines.length >= 50) s += 2;
  else if (d.related_doctrines && d.related_doctrines.length >= 20) s += 1;
  const wordCount = d.reasoning ? d.reasoning.split(/\s+/).length : 0;
  if (wordCount >= dc.min_reasoning_words) s += 1;
  return Math.round(s);
}
__name(scoreDoc, "scoreDoc");
function hasGoldFields(d, engineId2) {
  const f18 = (d.irs_position || "").trim();
  const f19 = (d.appeals_strategy || "").trim();
  const related = (d.related_doctrines || "").trim();
  const precedent = (d.controlling_precedent || "").trim();
  let goldCount = 0;
  if (f18.length >= 60) goldCount++;
  if (f19.length >= 80) goldCount++;
  if (related.length >= 15) goldCount++;
  if (precedent.length >= 20) goldCount++;
  return goldCount >= 2;
}
__name(hasGoldFields, "hasGoldFields");
async function forgeEngine(engineId2, domain, providers, env, forgeLog) {
  forgeLog.push(`FORGE: ${engineId2} (${domain})`);
  try {
    await env.DB.prepare(
      `DELETE FROM doctrines WHERE engine_id = ? AND (reasoning IS NULL OR LENGTH(reasoning) < 50)`
    ).bind(engineId2).run();
  } catch (e) {
    log("warn", "Low-quality doctrine purge failed", { engineId: engineId2, error: e?.message || String(e) });
  }
  let existingTopics = [];
  try {
    const existing = await env.DB.prepare(
      `SELECT topic FROM doctrines WHERE engine_id = ? ORDER BY created_at`
    ).bind(engineId2).all();
    existingTopics = (existing.results || []).map((r) => (r.topic || "").toLowerCase().trim());
    if (existingTopics.length > 0) {
      forgeLog.push(`  ${existingTopics.length} existing doctrines \u2014 top-up mode`);
    }
  } catch (e) {
    log("debug", "No existing doctrines, fresh forge", { engineId: engineId2, error: e?.message || String(e) });
  }
  const reliable = providers.filter((p) => p.failures < 3);
  const expProvider = reliable[Math.floor(Math.random() * reliable.length)] || providers[0];
  const subtopics = await expandSubdomains(engineId2, domain, expProvider, env, existingTopics);
  forgeLog.push(`  ${subtopics.length} subtopics (after filtering existing)`);
  const targetCount = parseInt(env.DOCTRINES_PER_ENGINE || "90");
  const remaining = Math.max(targetCount - existingTopics.length, 10);
  const batchSize = 15;
  const maxBatches = Math.min(5, Math.ceil(remaining / 10));
  const timeBudgetMs = 8 * 60 * 1e3;
  const forgeStart = Date.now();
  let totalInserted = 0;
  if (existingTopics.length > 0) {
    forgeLog.push(`  Need ${remaining} more (have ${existingTopics.length}/${targetCount}), maxBatches=${maxBatches}`);
  }
  for (let b = 0; b < maxBatches && totalInserted < remaining; b++) {
    if (Date.now() - forgeStart > timeBudgetMs) {
      forgeLog.push(`  TIME BUDGET HIT after ${Math.round((Date.now() - forgeStart) / 1e3)}s \u2014 stopping with ${totalInserted} doctrines`);
      break;
    }
    const offset = b * batchSize % subtopics.length;
    const batchTopics = subtopics.slice(offset, offset + batchSize);
    if (batchTopics.length < batchSize) {
      batchTopics.push(...subtopics.slice(0, batchSize - batchTopics.length));
    }
    const sysPr = getSystemPrompt(engineId2, domain);
    const usrPr = getUserPrompt(engineId2, domain, batchTopics, batchSize, existingTopics);
    const alive = providers.filter((p) => p.failures < 5);
    const nonOR = alive.filter((p) => !p.name.startsWith("OR-K"));
    const orFree = alive.filter((p) => p.name.startsWith("OR-K") && !p.name.includes("Paid"));
    const topNonOR = nonOR.sort((a, b2) => a.failures - b2.failures).slice(0, 12);
    const orSample = orFree.sort(() => Math.random() - 0.5).slice(0, 4);
    const candidates = [...topNonOR, ...orSample];
    const allParsed = [];
    const seenTopics = /* @__PURE__ */ new Set();
    const providerResults = await Promise.allSettled(
      candidates.map(async (provider) => {
        try {
          let text = await provider.call(sysPr, usrPr, env);
          if (text && typeof text === "object") text = text.text || text.response || "";
          const parsed = parseDoctrines(text);
          const quality = parsed.filter((d) => scoreDoc(d, engineId2) >= 12 && hasGoldFields(d, engineId2));
          return { provider, parsed, quality, error: null };
        } catch (err) {
          provider.failures++;
          return { provider, parsed: [], quality: [], error: err instanceof Error ? err.message : String(err) };
        }
      })
    );
    for (const result of providerResults) {
      if (result.status === "fulfilled") {
        const { provider, parsed, quality, error } = result.value;
        if (error) {
          forgeLog.push(`  B${b + 1}[${provider.name}] ERR: ${error}`);
        } else {
          forgeLog.push(`  B${b + 1}[${provider.name}] ${parsed.length} parsed, ${quality.length} quality`);
          for (const doc of quality) {
            const topicKey = (doc.topic || "").toLowerCase().trim().slice(0, 80);
            if (topicKey && !seenTopics.has(topicKey)) {
              seenTopics.add(topicKey);
              allParsed.push(doc);
            }
          }
        }
      }
    }
    let toInsert = allParsed;
    if (toInsert.length < 5) {
      for (const result of providerResults) {
        if (result.status === "fulfilled" && !result.value.error) {
          for (const doc of result.value.parsed) {
            const topicKey = (doc.topic || "").toLowerCase().trim().slice(0, 80);
            if (topicKey && !seenTopics.has(topicKey) && scoreDoc(doc) >= 10 && hasGoldFields(doc)) {
              seenTopics.add(topicKey);
              toInsert.push(doc);
            }
          }
        }
      }
      if (toInsert.length > allParsed.length) {
        forgeLog.push(`  B${b + 1} relaxed: ${toInsert.length} docs (merged all providers)`);
      }
    }
    if (toInsert.length === 0) {
      forgeLog.push(`  B${b + 1}: 0 doctrines, skipping`);
      continue;
    }
    let inserted = 0;
    const stmts = toInsert.map(
      (doc) => env.DB.prepare(`
        INSERT OR IGNORE INTO doctrines (engine_id, topic, keywords, conclusion, reasoning, key_factors,
          authorities, confidence, zone, burden_holder, adversary_position, counter_arguments,
          resolution_strategy, entity_scope, confidence_stratification, controlling_precedent,
          cross_domain_routes, domain_scope, irs_position, appeals_strategy, related_doctrines, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        engineId2,
        doc.topic,
        doc.keywords,
        doc.conclusion,
        doc.reasoning,
        doc.key_factors,
        doc.authorities,
        doc.confidence,
        doc.zone,
        doc.burden_holder,
        doc.adversary_position,
        doc.counter_arguments,
        doc.resolution_strategy,
        doc.entity_scope,
        doc.confidence_stratification,
        doc.controlling_precedent,
        doc.cross_domain_routes,
        doc.domain_scope,
        doc.irs_position,
        doc.appeals_strategy,
        doc.related_doctrines
      )
    );
    try {
      const results = await env.DB.batch(stmts);
      for (const r of results) {
        if (r.meta?.changes && r.meta.changes > 0) inserted++;
      }
    } catch (err) {
      forgeLog.push(`  D1 batch err (fallback to sequential): ${err instanceof Error ? err.message : String(err)}`);
      for (const doc of toInsert) {
        try {
          await env.DB.prepare(`
            INSERT OR IGNORE INTO doctrines (engine_id, topic, keywords, conclusion, reasoning, key_factors,
              authorities, confidence, zone, burden_holder, adversary_position, counter_arguments,
              resolution_strategy, entity_scope, confidence_stratification, controlling_precedent,
              cross_domain_routes, domain_scope, irs_position, appeals_strategy, related_doctrines, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
          `).bind(
            engineId2,
            doc.topic,
            doc.keywords,
            doc.conclusion,
            doc.reasoning,
            doc.key_factors,
            doc.authorities,
            doc.confidence,
            doc.zone,
            doc.burden_holder,
            doc.adversary_position,
            doc.counter_arguments,
            doc.resolution_strategy,
            doc.entity_scope,
            doc.confidence_stratification,
            doc.controlling_precedent,
            doc.cross_domain_routes,
            doc.domain_scope,
            doc.irs_position,
            doc.appeals_strategy,
            doc.related_doctrines
          ).run();
          inserted++;
        } catch (e) {
          if (!(e instanceof Error && e.message.includes("UNIQUE"))) {
            forgeLog.push(`  D1 err: ${e instanceof Error ? e.message : String(e)}`);
          }
        }
      }
    }
    totalInserted += inserted;
    for (const doc of toInsert) {
      const tk = (doc.topic || "").toLowerCase().trim();
      if (tk) existingTopics.push(tk);
    }
    forgeLog.push(`  B${b + 1}: +${inserted} inserted (total: ${totalInserted}, known topics: ${existingTopics.length})`);
  }
  const isBackbone = engineId2.endsWith("01") || engineId2 in BACKBONE_ENGINES;
  if (isBackbone) {
    const routingProvider = providers.filter((p) => p.failures < 3)[0] || providers[0];
    try {
      const routingSys = getSystemPrompt(engineId2, domain);
      const routingUsr = getRoutingPrompt(engineId2, domain);
      const routingText = await routingProvider.call(routingSys, routingUsr, env);
      const routingDocs = parseDoctrines(routingText).slice(0, 5);
      let routingInserted = 0;
      for (const doc of routingDocs) {
        try {
          await env.DB.prepare(`
            INSERT OR IGNORE INTO doctrines (engine_id, topic, keywords, conclusion, reasoning, key_factors,
              authorities, confidence, zone, burden_holder, adversary_position, counter_arguments,
              resolution_strategy, entity_scope, confidence_stratification, controlling_precedent,
              cross_domain_routes, domain_scope, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
          `).bind(
            engineId2,
            doc.topic,
            doc.keywords,
            doc.conclusion,
            doc.reasoning,
            doc.key_factors,
            doc.authorities,
            doc.confidence,
            doc.zone,
            doc.burden_holder,
            doc.adversary_position,
            doc.counter_arguments,
            doc.resolution_strategy,
            doc.entity_scope,
            doc.confidence_stratification,
            doc.controlling_precedent,
            doc.cross_domain_routes,
            doc.domain_scope,
            doc.irs_position,
            doc.appeals_strategy,
            doc.related_doctrines
          ).run();
          routingInserted++;
        } catch (e) {
          log("warn", "Routing doctrine insert failed", { engineId: engineId2, topic: doc.topic, error: e?.message || String(e) });
        }
      }
      totalInserted += routingInserted;
      forgeLog.push(`  [ROUTING] ${routingInserted}/${routingDocs.length} routing doctrines`);
    } catch (err) {
      forgeLog.push(`  [ROUTING ERR] ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  forgeLog.push(`  >>> ${engineId2} COMPLETE: ${totalInserted} doctrines`);
  return totalInserted;
}
__name(forgeEngine, "forgeEngine");
async function initForgeDB(db) {
  await db.exec(`CREATE TABLE IF NOT EXISTS forge_queue (engine_id TEXT PRIMARY KEY, domain TEXT NOT NULL, status TEXT DEFAULT 'pending', doctrines_added INTEGER DEFAULT 0, attempts INTEGER DEFAULT 0, last_attempt TEXT, grade TEXT, error TEXT, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')))`);
  await db.exec(`CREATE TABLE IF NOT EXISTS forge_runs (id INTEGER PRIMARY KEY AUTOINCREMENT, started_at TEXT DEFAULT (datetime('now')), engines_processed INTEGER DEFAULT 0, doctrines_generated INTEGER DEFAULT 0, errors INTEGER DEFAULT 0, duration_ms INTEGER DEFAULT 0, providers_used TEXT)`);
}
__name(initForgeDB, "initForgeDB");
async function seedQueue(db, mainDb) {
  const result = await mainDb.prepare("SELECT DISTINCT engine_id FROM doctrines ORDER BY engine_id").all();
  const allEngines = (result.results || []).map((r) => r.engine_id);
  const eligible = allEngines.filter((e) => !EXCLUDED_PREFIXES.some((p) => e.startsWith(p)));
  const existing = await db.prepare("SELECT engine_id FROM forge_queue").all();
  const existingSet = new Set((existing.results || []).map((r) => r.engine_id));
  let added = 0;
  for (const eid of eligible) {
    if (!existingSet.has(eid)) {
      const domain = inferDomain(eid);
      await db.prepare("INSERT OR IGNORE INTO forge_queue (engine_id, domain) VALUES (?, ?)").bind(eid, domain).run();
      added++;
    }
  }
  return added;
}
__name(seedQueue, "seedQueue");
function inferDomain(eid) {
  if (BACKBONE_ENGINES[eid]) return BACKBONE_ENGINES[eid];
  const prefix = eid.replace(/\d+$/, "");
  for (const [bid, bn] of Object.entries(BACKBONE_ENGINES)) {
    if (bid.startsWith(prefix)) return bn + " (Specialized)";
  }
  return `${prefix} Domain`;
}
__name(inferDomain, "inferDomain");
async function claimNextEngine(db) {
  const next = await db.prepare(
    `SELECT engine_id, domain FROM forge_queue
     WHERE status = 'pending' AND attempts < 200
     ORDER BY
       CASE WHEN engine_id LIKE '%01' THEN 0 ELSE 1 END,
       attempts ASC, RANDOM()
     LIMIT 1`
  ).first();
  if (!next) return null;
  const claim = await db.prepare(
    `UPDATE forge_queue SET status = 'forging', attempts = attempts + 1,
     last_attempt = datetime('now'), updated_at = datetime('now')
     WHERE engine_id = ? AND status = 'pending'`
  ).bind(next.engine_id).run();
  if (!claim.meta?.changes || claim.meta.changes === 0) {
    const alt = await db.prepare(
      `SELECT engine_id, domain FROM forge_queue
       WHERE status = 'pending' AND attempts < 200
       ORDER BY attempts ASC, RANDOM() LIMIT 1`
    ).first();
    if (!alt) return null;
    const altClaim = await db.prepare(
      `UPDATE forge_queue SET status = 'forging', attempts = attempts + 1,
       last_attempt = datetime('now'), updated_at = datetime('now')
       WHERE engine_id = ? AND status = 'pending'`
    ).bind(alt.engine_id).run();
    if (!altClaim.meta?.changes || altClaim.meta.changes === 0) return null;
    return alt;
  }
  return next;
}
__name(claimNextEngine, "claimNextEngine");
async function getNextEngines(db, count) {
  const engines = [];
  for (let i = 0; i < count; i++) {
    const eng = await claimNextEngine(db);
    if (eng) engines.push(eng);
    else break;
  }
  return engines;
}
__name(getNextEngines, "getNextEngines");
var index_default = {
  async fetch(request, env) {
    const corsHeaders = getCorsHeaders(request);
    if (request.method === "OPTIONS") {
      return addSecurityHeaders(new Response(null, { status: 204, headers: corsHeaders }));
    }
    const _innerResult = await (async () => {
      const url = new URL(request.url);
      const path = url.pathname;
      const skipRate = ["/health"].includes(path);
      if (!skipRate && env.CACHE) {
        try {
          const ip = request.headers.get("CF-Connecting-IP") || "unknown";
          const window = Math.floor(Date.now() / (RATE_WINDOW_SEC * 1e3));
          const rateKey = `rate:${ip}:${window}`;
          const count = parseInt(await env.CACHE.get(rateKey) || "0");
          if (count >= RATE_LIMIT) {
            return new Response(JSON.stringify({ error: "Rate limit exceeded", retry_after_seconds: RATE_WINDOW_SEC }), {
              status: 429,
              headers: { "Content-Type": "application/json", ...corsHeaders }
            });
          }
          await env.CACHE.put(rateKey, String(count + 1), { expirationTtl: RATE_WINDOW_SEC * 2 });
        } catch (e) {
          log("warn", "Rate limit check failed", { error: e?.message || String(e) });
        }
      }
      try {
        if (path === "/") return json({ ok: true, service: "echo-doctrine-forge", version: "4.0.0", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
        if (path === "/health") {
          return json({ ok: true, service: "echo-doctrine-forge", version: "4.0.0", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
        }
        {
          if (url.searchParams.has("key")) {
            return json({ error: "API key via query parameter is not accepted. Use X-Echo-API-Key header." }, 400, corsHeaders);
          }
          const authKey = request.headers.get("X-Echo-API-Key");
          if (authKey !== env.ECHO_API_KEY) {
            return json({ error: "Unauthorized" }, 401, corsHeaders);
          }
        }
        if (path === "/providers") {
          const providers = buildProviders(env);
          return json({
            ok: true,
            total: providers.length,
            providers: providers.map((p, i) => ({ index: i, name: p.name })),
            has_claude_oauth: !!env.CLAUDE_OAUTH_TOKEN,
            has_anthropic_key: !!env.ANTHROPIC_API_KEY
          });
        }
        if (path === "/stats") {
          await initForgeDB(env.FORGE_DB);
          const queue = await env.FORGE_DB.prepare(
            `SELECT status, COUNT(*) as cnt FROM forge_queue GROUP BY status`
          ).all();
          const total = await env.FORGE_DB.prepare(
            `SELECT SUM(doctrines_added) as total FROM forge_queue WHERE status = 'complete'`
          ).first();
          const runs = await env.FORGE_DB.prepare(
            `SELECT * FROM forge_runs ORDER BY id DESC LIMIT 10`
          ).all();
          return json({
            ok: true,
            queue: queue.results,
            total_doctrines_generated: total?.total || 0,
            recent_runs: runs.results
          });
        }
        if (path === "/queue") {
          await initForgeDB(env.FORGE_DB);
          const status = url.searchParams.get("status") || "pending";
          const limit = parseInt(url.searchParams.get("limit") || "50");
          const result = await env.FORGE_DB.prepare(
            `SELECT * FROM forge_queue WHERE status = ? ORDER BY engine_id LIMIT ?`
          ).bind(status, limit).all();
          return json({ ok: true, count: result.results?.length || 0, engines: result.results });
        }
        if (path === "/queue/add" && request.method === "POST") {
          await initForgeDB(env.FORGE_DB);
          const body = await request.json().catch(() => ({}));
          if (!body.engine_id) return json({ ok: false, error: "engine_id required" }, 400);
          const engineId2 = body.engine_id.toUpperCase().replace(/[^A-Z0-9_]/g, "");
          const domain = body.domain || inferDomain(engineId2);
          try {
            await env.FORGE_DB.prepare(
              `INSERT OR IGNORE INTO forge_queue (engine_id, domain, status) VALUES (?, ?, 'pending')`
            ).bind(engineId2, domain).run();
          } catch (e) {
          }
          try {
            await env.DB.prepare(
              `INSERT OR IGNORE INTO engines (engine_id, engine_name, category, domain, status, lines, created_at)
           VALUES (?, ?, ?, ?, 'DEPLOYED', 0, datetime('now'))`
            ).bind(engineId2, engineId2, domain, domain).run();
          } catch (e) {
          }
          let seedInserted = false;
          if (body.seed_doctrine?.topic) {
            try {
              await env.DB.prepare(
                `INSERT OR IGNORE INTO doctrines (engine_id, topic, keywords, conclusion, reasoning, confidence, key_factors, authorities)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
              ).bind(
                engineId2,
                body.seed_doctrine.topic,
                body.seed_doctrine.keywords || "",
                body.seed_doctrine.conclusion_template || "",
                body.seed_doctrine.reasoning_framework || "",
                body.seed_doctrine.confidence || "DEFENSIBLE",
                body.seed_doctrine.key_factors || "",
                body.seed_doctrine.primary_authority || "Hephaestion Forge v2.1.0"
              ).run();
              seedInserted = true;
            } catch (e) {
            }
          }
          return json({
            ok: true,
            engine_id: engineId2,
            domain,
            queued: true,
            seed_inserted: seedInserted,
            message: `Engine ${engineId2} queued for doctrine generation (domain: ${domain})`
          });
        }
        if (path === "/seed" && request.method === "POST") {
          await initForgeDB(env.FORGE_DB);
          const added = await seedQueue(env.FORGE_DB, env.DB);
          return json({ ok: true, added, message: `Seeded ${added} engines into forge queue` });
        }
        if (path === "/forge" && request.method === "POST") {
          const body = await request.json().catch(() => ({}));
          await initForgeDB(env.FORGE_DB);
          const count = body.count || 1;
          let engines;
          if (body.engine_id) {
            const claim = await env.FORGE_DB.prepare(
              `UPDATE forge_queue SET status = 'forging', attempts = attempts + 1,
           last_attempt = datetime('now'), updated_at = datetime('now')
           WHERE engine_id = ? AND (status = 'pending' OR status = 'forging')`
            ).bind(body.engine_id).run();
            engines = [{ engine_id: body.engine_id, domain: inferDomain(body.engine_id) }];
          } else {
            engines = await getNextEngines(env.FORGE_DB, count);
          }
          if (engines.length === 0) {
            return json({ ok: true, message: "No engines pending in queue. POST /seed to repopulate." });
          }
          const providers = buildProviders(env);
          const log2 = [];
          let totalDocs = 0;
          const t0 = Date.now();
          for (const eng of engines) {
            try {
              const docs = await forgeEngine(eng.engine_id, eng.domain, providers, env, log2);
              totalDocs += docs;
              const minYield = parseInt(env.MIN_MANDATORY_YIELD || "30");
              if (docs >= minYield) {
                const grade = docs >= 80 ? "A+++" : docs >= 60 ? "A++" : docs >= 40 ? "A+" : docs >= 20 ? "A" : "B+";
                await env.FORGE_DB.prepare(
                  `UPDATE forge_queue SET status = 'complete', doctrines_added = ?, grade = ?, updated_at = datetime('now') WHERE engine_id = ?`
                ).bind(docs, grade, eng.engine_id).run();
                postToMoltBook(env, `Forged ${docs} doctrines for ${eng.engine_id} (${eng.domain}) - grade ${grade}`, "building", ["build", "doctrine", eng.engine_id]).catch(() => {
                });
              } else {
                log2.push(`  ${eng.engine_id}: only ${docs} doctrines (min ${minYield}), scheduling retry`);
                await env.FORGE_DB.prepare(
                  `UPDATE forge_queue SET status = 'pending', doctrines_added = doctrines_added + ?, error = 'low_yield_${docs}', updated_at = datetime('now') WHERE engine_id = ?`
                ).bind(docs, eng.engine_id).run();
              }
            } catch (err) {
              const errMsg = err instanceof Error ? err.message : String(err);
              log2.push(`FATAL: ${eng.engine_id}: ${errMsg}`);
              await env.FORGE_DB.prepare(
                `UPDATE forge_queue SET status = 'pending', error = ?, updated_at = datetime('now') WHERE engine_id = ?`
              ).bind(errMsg.slice(0, 500), eng.engine_id).run();
            }
          }
          const duration = Date.now() - t0;
          await env.FORGE_DB.prepare(
            `INSERT INTO forge_runs (engines_processed, doctrines_generated, duration_ms, providers_used) VALUES (?, ?, ?, ?)`
          ).bind(engines.length, totalDocs, duration, providers.map((p) => p.name).join(",")).run();
          return json({
            ok: true,
            engines_processed: engines.length,
            doctrines_generated: totalDocs,
            duration_ms: duration,
            log: log2
          });
        }
        if (path === "/forge-burst" && request.method === "POST") {
          const body = await request.json().catch(() => ({}));
          const burstCount = Math.min(body.count || 10, 20);
          await initForgeDB(env.FORGE_DB);
          const engines = await getNextEngines(env.FORGE_DB, burstCount);
          if (engines.length === 0) {
            return json({ ok: true, message: "No engines pending.", claimed: 0 });
          }
          const providers = buildProviders(env);
          const t0 = Date.now();
          const results = await Promise.allSettled(
            engines.map(async (eng) => {
              const log2 = [];
              try {
                const docs = await forgeEngine(eng.engine_id, eng.domain, providers, env, log2);
                const minYield = parseInt(env.MIN_MANDATORY_YIELD || "30");
                if (docs >= minYield) {
                  const grade = docs >= 80 ? "A+++" : docs >= 60 ? "A++" : docs >= 40 ? "A+" : docs >= 20 ? "A" : "B+";
                  await env.FORGE_DB.prepare(
                    `UPDATE forge_queue SET status = 'complete', doctrines_added = ?, grade = ?, updated_at = datetime('now') WHERE engine_id = ?`
                  ).bind(docs, grade, eng.engine_id).run();
                } else {
                  await env.FORGE_DB.prepare(
                    `UPDATE forge_queue SET status = 'pending', doctrines_added = doctrines_added + ?, error = 'low_yield_${docs}', updated_at = datetime('now') WHERE engine_id = ?`
                  ).bind(docs, eng.engine_id).run();
                }
                return { engine_id: eng.engine_id, doctrines: docs, status: "ok", log: log2 };
              } catch (err) {
                const errMsg = err instanceof Error ? err.message : String(err);
                await env.FORGE_DB.prepare(
                  `UPDATE forge_queue SET status = 'pending', error = ?, updated_at = datetime('now') WHERE engine_id = ?`
                ).bind(errMsg.slice(0, 500), eng.engine_id).run();
                return { engine_id: eng.engine_id, doctrines: 0, status: "error", error: errMsg };
              }
            })
          );
          const duration = Date.now() - t0;
          const successes = results.filter((r) => r.status === "fulfilled").map((r) => r.value);
          const totalDocs = successes.reduce((s, r) => s + r.doctrines, 0);
          await env.FORGE_DB.prepare(
            `INSERT INTO forge_runs (engines_processed, doctrines_generated, duration_ms, providers_used) VALUES (?, ?, ?, ?)`
          ).bind(engines.length, totalDocs, duration, `burst_${burstCount}`).run();
          return json({
            ok: true,
            burst_size: engines.length,
            total_doctrines: totalDocs,
            duration_ms: duration,
            engines: successes
          });
        }
        if (path === "/reset" && request.method === "POST") {
          const body = await request.json().catch(() => ({}));
          if (request.headers.get("X-Echo-API-Key") !== env.ECHO_API_KEY) {
            return json({ error: "Unauthorized. Provide X-Echo-API-Key header.", blocked: true }, 401, corsHeaders);
          }
          await initForgeDB(env.FORGE_DB);
          const countResult = await env.FORGE_DB.prepare(`SELECT COUNT(*) as cnt FROM forge_queue WHERE status != 'complete'`).first();
          await env.FORGE_DB.prepare(`UPDATE forge_queue SET status = 'pending', attempts = 0 WHERE status != 'complete'`).run();
          return json({ ok: true, message: "Reset all non-complete engines to pending", engines_reset: countResult?.cnt || 0 });
        }
        if (path === "/purge-low" && request.method === "POST") {
          const body = await request.json().catch(() => ({}));
          const dryRun = body.dry_run !== false;
          if (!dryRun && request.headers.get("X-Echo-API-Key") !== env.ECHO_API_KEY) {
            return json({ error: "Unauthorized. Provide X-Echo-API-Key header for non-dry-run purge.", blocked: true }, 401, corsHeaders);
          }
          if (!dryRun && !body.confirm) {
            return json({ error: "Confirm required. Pass confirm: true to execute the purge.", blocked: true }, 400, corsHeaders);
          }
          const countResult = await env.DB.prepare(
            `SELECT COUNT(*) as cnt FROM doctrines WHERE reasoning IS NULL OR LENGTH(reasoning) < 50`
          ).first();
          const wouldDelete = countResult?.cnt || 0;
          if (dryRun) {
            return json({ ok: true, dry_run: true, would_delete: wouldDelete, message: `Would delete ${wouldDelete} low-quality doctrines. Set dry_run: false, confirm: true, and provide X-Echo-API-Key header to execute.` });
          }
          const totalResult = await env.DB.prepare("SELECT COUNT(*) as cnt FROM doctrines").first();
          const totalDocs = totalResult?.cnt || 1;
          if (wouldDelete > totalDocs * 0.01 && wouldDelete > 100) {
            return json({ error: `SAFETY ABORT: Would delete ${wouldDelete} doctrines (${(wouldDelete / totalDocs * 100).toFixed(1)}% of ${totalDocs} total). This exceeds the 1% safety threshold. Manual D1 SQL required for bulk operations.`, blocked: true }, 400, corsHeaders);
          }
          const result = await env.DB.prepare(
            `DELETE FROM doctrines WHERE reasoning IS NULL OR LENGTH(reasoning) < 50`
          ).run();
          return json({ ok: true, deleted: result.meta?.changes || 0 });
        }
        if (path === "/regenerate-gold" && request.method === "POST") {
          await initForgeDB(env.FORGE_DB);
          const body = await request.json().catch(() => ({}));
          const batchSize = Math.min(body.batch_size || 5, 50);
          const dryRun = body.dry_run !== false;
          if (!dryRun && request.headers.get("X-Echo-API-Key") !== env.ECHO_API_KEY) {
            return json({ error: "Unauthorized. Provide X-Echo-API-Key header for non-dry-run regeneration.", blocked: true }, 401, corsHeaders);
          }
          const preGold = await env.DB.prepare(
            `SELECT engine_id, COUNT(*) as cnt FROM doctrines
         WHERE (irs_position IS NULL OR irs_position = '')
           AND (appeals_strategy IS NULL OR appeals_strategy = '')
         GROUP BY engine_id
         ORDER BY cnt DESC
         LIMIT ?`
          ).bind(batchSize).all();
          if (!preGold.results || preGold.results.length === 0) {
            return json({ ok: true, message: "No pre-GOLD engines found \u2014 all doctrines are GOLD quality!", engines_processed: 0 });
          }
          const totalPreGold = await env.DB.prepare(
            `SELECT COUNT(*) as cnt FROM doctrines WHERE (irs_position IS NULL OR irs_position = '') AND (appeals_strategy IS NULL OR appeals_strategy = '')`
          ).first();
          if (dryRun) {
            return json({
              ok: true,
              dry_run: true,
              engines_with_pre_gold: preGold.results.length,
              total_pre_gold_doctrines: totalPreGold?.cnt || 0,
              sample_engines: preGold.results.slice(0, 10).map((r) => ({ engine_id: r.engine_id, pre_gold_count: r.cnt })),
              message: `Would delete pre-GOLD doctrines from ${preGold.results.length} engines and re-queue for GOLD generation`
            });
          }
          let deletedTotal = 0;
          let requeuedCount = 0;
          for (const row of preGold.results) {
            const eid = row.engine_id;
            const del = await env.DB.prepare(
              `DELETE FROM doctrines WHERE engine_id = ? AND (irs_position IS NULL OR irs_position = '') AND (appeals_strategy IS NULL OR appeals_strategy = '')`
            ).bind(eid).run();
            deletedTotal += del.meta?.changes || 0;
            const existing = await env.FORGE_DB.prepare("SELECT engine_id FROM forge_queue WHERE engine_id = ?").bind(eid).first();
            if (existing) {
              await env.FORGE_DB.prepare(
                `UPDATE forge_queue SET status = 'pending', attempts = 0, error = 'gold_regen', updated_at = datetime('now') WHERE engine_id = ?`
              ).bind(eid).run();
            } else {
              await env.FORGE_DB.prepare(
                `INSERT INTO forge_queue (engine_id, domain, status, error) VALUES (?, ?, 'pending', 'gold_regen')`
              ).bind(eid, inferDomain(eid)).run();
            }
            requeuedCount++;
          }
          log("info", `GOLD Regeneration: deleted ${deletedTotal} pre-GOLD doctrines from ${requeuedCount} engines, re-queued for GOLD generation`);
          return json({
            ok: true,
            engines_processed: requeuedCount,
            pre_gold_doctrines_deleted: deletedTotal,
            total_pre_gold_remaining: (totalPreGold?.cnt || 0) - deletedTotal,
            message: `Deleted ${deletedTotal} pre-GOLD doctrines from ${requeuedCount} engines and re-queued for GOLD generation`
          });
        }
        if (path === "/gold-stats" && request.method === "GET") {
          const total = await env.DB.prepare("SELECT COUNT(*) as cnt FROM doctrines").first();
          const preGold = await env.DB.prepare(
            `SELECT COUNT(*) as cnt FROM doctrines WHERE (irs_position IS NULL OR irs_position = '') AND (appeals_strategy IS NULL OR appeals_strategy = '')`
          ).first();
          const gold = (total?.cnt || 0) - (preGold?.cnt || 0);
          return json({
            ok: true,
            total_doctrines: total?.cnt || 0,
            gold_doctrines: gold,
            pre_gold_doctrines: preGold?.cnt || 0,
            gold_percentage: total?.cnt ? (gold / total.cnt * 100).toFixed(2) + "%" : "0%"
          }, 200, corsHeaders);
        }
        if (path === "/topup" && request.method === "POST") {
          await initForgeDB(env.FORGE_DB);
          const body = await request.json().catch(() => ({}));
          const target = body.target || parseInt(env.DOCTRINES_PER_ENGINE || "90");
          const lowEngines = await env.DB.prepare(
            `SELECT engine_id, COUNT(*) as cnt FROM doctrines GROUP BY engine_id HAVING cnt < ? ORDER BY cnt ASC`
          ).bind(target).all();
          const lowSet = new Set((lowEngines.results || []).map((r) => r.engine_id));
          let resetCount = 0;
          for (const row of lowEngines.results || []) {
            const eid = row.engine_id;
            const cnt = row.cnt;
            const result = await env.FORGE_DB.prepare(
              `UPDATE forge_queue SET status = 'pending', attempts = 0, error = 'topup_from_${cnt}', updated_at = datetime('now') WHERE engine_id = ?`
            ).bind(eid).run();
            if (result.meta?.changes && result.meta.changes > 0) resetCount++;
          }
          return json({
            ok: true,
            target,
            engines_below_target: lowEngines.results?.length || 0,
            engines_reset_to_pending: resetCount,
            message: `Reset ${resetCount} engines below ${target} doctrines to pending for top-up forging`
          });
        }
        if (path === "/admin/reset-stuck" && request.method === "POST") {
          await initForgeDB(env.FORGE_DB);
          const result = await env.FORGE_DB.prepare(
            `UPDATE forge_queue SET status = 'pending' WHERE status = 'forging' AND updated_at < datetime('now', '-15 minutes')`
          ).run();
          return json({ ok: true, reset: result.meta?.changes || 0 });
        }
        if (path === "/seed-engines" && request.method === "POST") {
          await initForgeDB(env.FORGE_DB);
          const body = await request.json().catch(() => ({}));
          if (!body.engines || !Array.isArray(body.engines)) {
            return json({ error: 'Provide { engines: ["ENGINE01", ...] }' }, 400);
          }
          const existing = await env.FORGE_DB.prepare("SELECT engine_id FROM forge_queue").all();
          const existingSet = new Set((existing.results || []).map((r) => r.engine_id));
          let added = 0;
          const batchSize = 50;
          for (let i = 0; i < body.engines.length; i += batchSize) {
            const batch = body.engines.slice(i, i + batchSize);
            const stmts = batch.filter((eid) => !existingSet.has(eid)).map((eid) => env.FORGE_DB.prepare("INSERT OR IGNORE INTO forge_queue (engine_id, domain, status) VALUES (?, ?, ?)").bind(eid, inferDomain(eid), "pending"));
            if (stmts.length > 0) {
              await env.FORGE_DB.batch(stmts);
              added += stmts.length;
            }
          }
          return json({ ok: true, added, total_submitted: body.engines.length, already_in_queue: body.engines.length - added });
        }
        if (path === "/evolution" && request.method === "GET") {
          await initForgeDB(env.FORGE_DB);
          const row = await env.FORGE_DB.prepare(
            `SELECT * FROM forge_evolution WHERE id = 1`
          ).first().catch(() => null);
          if (!row) return json({ level: 1, stage: "FORGE_APPRENTICE", tier: "BASIC", tasks_completed: 0, success_count: 0, avg_quality: 0, message: "No evolution data yet \u2014 forging in progress" });
          const stage = EVOLUTION_STAGES[row.current_level - 1] || EVOLUTION_STAGES[0];
          const nextStage = EVOLUTION_STAGES[row.current_level] || null;
          return json({
            current_level: row.current_level,
            current_stage: row.current_stage,
            tier: row.tier,
            tasks_completed: row.tasks_completed,
            success_count: row.success_count,
            total_attempts: row.total_attempts,
            avg_quality: row.avg_quality,
            evolved_at: row.evolved_at,
            last_run_at: row.last_run_at,
            requirements_for_next: nextStage ? {
              level: nextStage.level,
              name: nextStage.name,
              min_success_rate: nextStage.min_success_rate,
              min_quality: nextStage.min_quality,
              min_tasks: nextStage.min_tasks,
              commander_approval: nextStage.commander_approval
            } : { message: "MAX LEVEL ACHIEVED \u2014 TRINITY UNLOCKED" },
            stage_details: stage
          });
        }
        if (path === "/evolution/check" && request.method === "POST") {
          await initForgeDB(env.FORGE_DB);
          const row = await env.FORGE_DB.prepare(
            `SELECT current_level, success_count, total_attempts, avg_quality, evolved_at FROM forge_evolution WHERE id = 1`
          ).first().catch(() => null);
          const level = row?.current_level || 1;
          const successCount = row?.success_count || 0;
          const totalAttempts = row?.total_attempts || 0;
          const avgQuality = row?.avg_quality || 0;
          const successRate = totalAttempts > 0 ? successCount / totalAttempts : 0;
          const lastPromotion = row?.evolved_at ? new Date(row.evolved_at).getTime() : 0;
          const commanderApproved = await commanderGate(env, level + 1).catch(() => false);
          const result = canEvolve(level, successRate, avgQuality, 1, totalAttempts, lastPromotion, commanderApproved);
          const nextStage = EVOLUTION_STAGES[level] || null;
          return json({
            eligible: result.eligible,
            reason: result.reason,
            current_level: level,
            next_level: nextStage?.level || "MAX",
            next_stage: nextStage?.name || "TRINITY_FIRST",
            success_rate: Math.round(successRate * 1e3) / 10,
            avg_quality: Math.round(avgQuality * 10) / 10,
            total_attempts: totalAttempts,
            commander_approval_required: nextStage?.commander_approval || false,
            message: result.eligible ? "Forge is ready to evolve. Evolution will occur on next cron run." : "Forge does not meet evolution requirements yet."
          });
        }
        if (path === "/leaderboard" && request.method === "GET") {
          await initForgeDB(env.FORGE_DB);
          const rows = await env.FORGE_DB.prepare(
            `SELECT provider_name, successes, failures, avg_quality, last_used_at,
                ROUND(CAST(successes AS FLOAT) / MAX(successes + failures, 1) * 100, 1) as success_rate
         FROM llm_leaderboard ORDER BY avg_quality DESC, successes DESC LIMIT 50`
          ).all().catch(() => ({ results: [] }));
          const verdicts = await env.FORGE_DB.prepare(
            `SELECT engine_id, approved, confidence, emotion, assessment, created_at FROM raistlin_verdicts ORDER BY created_at DESC LIMIT 10`
          ).all().catch(() => ({ results: [] }));
          return json({
            llm_leaderboard: rows.results || [],
            recent_raistlin_verdicts: verdicts.results || [],
            total_providers: (rows.results || []).length,
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          });
        }
        if (path === "/quality-gates" && request.method === "GET") {
          const recent = await env.FORGE_DB.prepare(
            `SELECT engine_id FROM forge_queue WHERE status = 'done' ORDER BY updated_at DESC LIMIT 1`
          ).first().catch(() => null);
          if (!recent?.engine_id) return json({ message: "No completed engines yet", gates: [] });
          const docs = await env.DB.prepare(
            `SELECT topic, conclusion, reasoning_framework, key_factors, primary_authority FROM doctrines WHERE engine_id = ? LIMIT 10`
          ).bind(recent.engine_id).all().catch(() => ({ results: [] }));
          const batch = (docs.results || []).map((r) => ({
            topic: r.topic,
            conclusion: r.conclusion || "",
            reasoning_framework: r.reasoning_framework || "",
            key_factors: r.key_factors || "",
            primary_authority: r.primary_authority || ""
          }));
          const gates = await runQualityGates(batch);
          const passed = gates.filter((g) => g.passed).length;
          const totalWeight = gates.reduce((s, g) => s + g.weight, 0);
          const weightedScore = gates.reduce((s, g) => s + (g.passed ? g.weight * g.score : 0), 0) / Math.max(totalWeight, 1);
          return json({
            engine_id: recent.engine_id,
            sample_size: batch.length,
            gates_passed: passed,
            gates_total: gates.length,
            weighted_score: Math.round(weightedScore * 100) / 100,
            grade: weightedScore >= 0.85 ? "A" : weightedScore >= 0.7 ? "B" : weightedScore >= 0.55 ? "C" : "F",
            gates,
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          });
        }
        if (path === "/raistlin/review" && request.method === "POST") {
          const body = await request.json().catch(() => ({}));
          if (!body.engine_id || !body.domain) return json({ error: "Provide { engine_id, domain, docs? }" }, 400);
          let docs = body.docs || [];
          if (!docs.length) {
            const fetched = await env.DB.prepare(
              `SELECT topic, conclusion, reasoning_framework FROM doctrines WHERE engine_id = ? LIMIT 5`
            ).bind(body.engine_id).all().catch(() => ({ results: [] }));
            docs = (fetched.results || []).map((r) => ({
              topic: r.topic,
              conclusion: (r.conclusion || "").substring(0, 200),
              reasoning_framework: (r.reasoning_framework || "").substring(0, 300)
            }));
          }
          if (!docs.length) return json({ error: "No doctrines found for this engine" }, 404);
          const doctrineBatch = docs.map((d) => ({
            topic: d.topic || "",
            conclusion: d.conclusion || "",
            reasoning: d.reasoning_framework || d.reasoning || "",
            keywords: d.keywords || "",
            key_factors: d.key_factors || "",
            authorities: d.primary_authority || d.authorities || "",
            confidence: d.confidence || "",
            zone: d.zone || "",
            burden_holder: "",
            adversary_position: "",
            counter_arguments: "",
            resolution_strategy: "",
            entity_scope: "",
            confidence_stratification: "",
            controlling_precedent: "",
            cross_domain_routes: "",
            domain_scope: body.domain,
            irs_position: "",
            appeals_strategy: "",
            related_doctrines: ""
          }));
          const verdict = await raistlinReview(env, body.engine_id, "manual_review", doctrineBatch);
          await initForgeDB(env.FORGE_DB);
          await env.FORGE_DB.prepare(`
        INSERT INTO raistlin_verdicts (engine_id, approved, confidence, emotion, assessment, weaknesses, recommendations, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
            body.engine_id,
            verdict.approved ? 1 : 0,
            verdict.confidence,
            verdict.emotion,
            verdict.assessment.substring(0, 500),
            JSON.stringify(verdict.weaknesses.slice(0, 3)),
            JSON.stringify(verdict.recommendations.slice(0, 3))
          ).run().catch(() => null);
          await storeRaistlinMemory(env, body.engine_id, "manual-review", verdict).catch(() => null);
          return json({ verdict, engine_id: body.engine_id, domain: body.domain, docs_reviewed: docs.length });
        }
        if (path === "/search" && request.method === "POST") {
          const body = await request.json().catch(() => ({}));
          if (!body.query) return json({ error: "query required" }, 400, corsHeaders);
          const limit = Math.min(body.limit ?? 10, 50);
          let semanticResults = [];
          if (env.VECTORS && env.AI) {
            try {
              const emb = await env.AI.run("@cf/baai/bge-base-en-v1.5", { text: [body.query.substring(0, 512)] });
              const embedding = emb.data?.[0] ?? [];
              if (embedding.length > 0) {
                const vr = await env.VECTORS.query(embedding, { topK: limit, returnMetadata: "all" });
                semanticResults = vr.matches?.map((m) => ({ engine_id: m.metadata?.engine_id, domain: m.metadata?.domain, topic: m.metadata?.topic, similarity: m.score, source: "semantic" })) ?? [];
              }
            } catch {
            }
          }
          let domFilter = "";
          const binds = [`%${body.query}%`];
          if (body.domain) {
            domFilter = "AND d.domain_scope = ?";
            binds.push(body.domain);
          }
          binds.push(limit);
          const textRows = await env.DB.prepare(`SELECT d.engine_id, d.topic, d.conclusion, d.quality_score FROM doctrines d WHERE d.topic LIKE ? ${domFilter} ORDER BY d.quality_score DESC LIMIT ?`).bind(...binds).all().catch(() => ({ results: [] }));
          const merged = [...semanticResults, ...textRows.results.map((r) => ({ ...r, source: "text" }))];
          return json({ results: merged.slice(0, limit), total: merged.length, query: body.query }, 200, corsHeaders);
        }
        if (path === "/marketplace") {
          const domain = url.searchParams.get("domain");
          const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20"), 100);
          const offset = parseInt(url.searchParams.get("offset") ?? "0");
          let where = "WHERE 1=1";
          const binds = [];
          if (domain) {
            where += " AND domain_scope = ?";
            binds.push(domain);
          }
          binds.push(limit, offset);
          const rows = await env.DB.prepare(`SELECT engine_id, topic, conclusion, quality_score, domain_scope, created_at FROM doctrines ${where} ORDER BY quality_score DESC LIMIT ? OFFSET ?`).bind(...binds).all().catch(() => ({ results: [] }));
          const domains = await env.DB.prepare(`SELECT domain_scope, COUNT(*) as count, AVG(quality_score) as avg_quality FROM doctrines GROUP BY domain_scope ORDER BY count DESC`).all().catch(() => ({ results: [] }));
          return json({ doctrines: rows.results, domains: domains.results, pagination: { limit, offset } }, 200, corsHeaders);
        }
        if (path === "/dashboard") {
          const totalDoctrines = await env.DB.prepare(`SELECT COUNT(*) as total, COUNT(DISTINCT engine_id) as engines, AVG(quality_score) as avg_quality FROM doctrines`).first().catch(() => null);
          const domainBreakdown = await env.DB.prepare(`SELECT domain_scope as domain, COUNT(*) as count, AVG(quality_score) as avg_quality FROM doctrines GROUP BY domain_scope ORDER BY count DESC LIMIT 15`).all().catch(() => ({ results: [] }));
          const recentForges = await env.FORGE_DB.prepare(`SELECT engine_id, domain, status, error, updated_at FROM forge_queue ORDER BY updated_at DESC LIMIT 10`).all().catch(() => ({ results: [] }));
          let raistlinStats = { total: 0, approved: 0 };
          try {
            raistlinStats = await env.FORGE_DB.prepare(`SELECT COUNT(*) as total, SUM(CASE WHEN approved=1 THEN 1 ELSE 0 END) as approved, AVG(confidence) as avg_confidence FROM raistlin_verdicts`).first() ?? raistlinStats;
          } catch {
          }
          const queueStats = await env.FORGE_DB.prepare(`SELECT status, COUNT(*) as count FROM forge_queue GROUP BY status`).all().catch(() => ({ results: [] }));
          return json({
            overview: { total_doctrines: totalDoctrines?.total ?? 0, total_engines: totalDoctrines?.engines ?? 0, avg_quality: Math.round(totalDoctrines?.avg_quality ?? 0) },
            domain_breakdown: domainBreakdown.results,
            recent_forges: recentForges.results,
            queue_status: queueStats.results,
            raistlin_oversight: { total_reviews: raistlinStats?.total ?? 0, approved: raistlinStats?.approved ?? 0, avg_confidence: Math.round((raistlinStats?.avg_confidence ?? 0) * 100) }
          }, 200, corsHeaders);
        }
        if (path === "/analytics") {
          const period = url.searchParams.get("period") ?? "30d";
          const daysBack = period === "7d" ? 7 : period === "90d" ? 90 : 30;
          const timeline = await env.DB.prepare(`SELECT DATE(created_at) as date, COUNT(*) as count, AVG(quality_score) as avg_quality FROM doctrines WHERE created_at >= datetime('now', '-${daysBack} days') GROUP BY DATE(created_at) ORDER BY date`).all().catch(() => ({ results: [] }));
          const topEngines = await env.DB.prepare(`SELECT engine_id, COUNT(*) as doctrine_count, AVG(quality_score) as avg_quality FROM doctrines GROUP BY engine_id ORDER BY doctrine_count DESC LIMIT 10`).all().catch(() => ({ results: [] }));
          const qualityDist = await env.DB.prepare(`SELECT CASE WHEN quality_score >= 9 THEN 'excellent' WHEN quality_score >= 7 THEN 'good' WHEN quality_score >= 5 THEN 'adequate' ELSE 'low' END as tier, COUNT(*) as count FROM doctrines GROUP BY tier`).all().catch(() => ({ results: [] }));
          return json({ period, timeline: timeline.results, top_engines: topEngines.results, quality_distribution: qualityDist.results }, 200, corsHeaders);
        }
        return json({ error: "Not found", endpoints: ["/health", "/stats", "/queue", "/seed", "/seed-engines", "/forge", "/forge-burst", "/topup", "/reset", "/purge-low", "/regenerate-gold", "/gold-stats", "/admin/reset-stuck", "/evolution", "/evolution/check", "/leaderboard", "/quality-gates", "/raistlin/review", "/search", "/marketplace", "/dashboard", "/analytics"] }, 404, corsHeaders);
      } catch (err) {
        log("error", "Unhandled fetch error", { error: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack?.slice(0, 500) : void 0 });
        return json({ error: "Internal server error", worker: "echo-doctrine-forge", timestamp: (/* @__PURE__ */ new Date()).toISOString() }, 500, corsHeaders);
      }
    })();
    return addSecurityHeaders(_innerResult);
  },
  async scheduled(event, env, ctx) {
    const paused = await env.CACHE.get("forge_paused");
    if (paused === "true") return;
    await initForgeDB(env.FORGE_DB);
    const staleRecovered = await env.FORGE_DB.prepare(
      `UPDATE forge_queue SET status = 'pending', updated_at = datetime('now')
       WHERE status = 'forging' AND last_attempt < datetime('now', '-30 minutes')`
    ).run();
    if (staleRecovered.meta?.changes && staleRecovered.meta.changes > 0) {
      log("info", `Recovered ${staleRecovered.meta.changes} stale forging engines`);
    }
    const pending = await env.FORGE_DB.prepare(`SELECT COUNT(*) as cnt FROM forge_queue WHERE status = 'pending'`).first();
    if (!pending || pending.cnt === 0) {
      const seeded = await seedQueue(env.FORGE_DB, env.DB);
      if (seeded === 0) {
        const forging = await env.FORGE_DB.prepare(`SELECT COUNT(*) as cnt FROM forge_queue WHERE status = 'forging'`).first();
        if (!forging || forging.cnt === 0) {
          const target = parseInt(env.DOCTRINES_PER_ENGINE || "90");
          const low = await env.DB.prepare(
            `SELECT engine_id, COUNT(*) as cnt FROM doctrines GROUP BY engine_id HAVING cnt < ?`
          ).bind(target).all();
          if (low.results && low.results.length > 0) {
            for (const row of low.results) {
              const eid = row.engine_id;
              const cnt = row.cnt;
              await env.FORGE_DB.prepare(
                `UPDATE forge_queue SET status = 'pending', attempts = 0, error = 'auto_topup_from_${cnt}', updated_at = datetime('now') WHERE engine_id = ?`
              ).bind(eid).run();
              await env.FORGE_DB.prepare("INSERT OR IGNORE INTO forge_queue (engine_id, domain, status) VALUES (?, ?, ?)").bind(eid, inferDomain(eid), "pending").run();
            }
            log("info", `Auto-topup: re-queued ${low.results.length} engines below ${target} doctrines`);
          } else {
            log("info", `FORGE COMPLETE: all engines at ${target}+ doctrines \u2014 engaging kill switch`);
            await env.CACHE.put("forge_paused", "true");
            try {
              await postToMoltBook(env, `Doctrine Forge: MISSION COMPLETE \u2014 ALL engines have reached ${target}+ doctrines. Forge is now paused. To resume: delete KV key 'forge_paused'.`, "celebrating", ["doctrine-forge", "milestone", "complete"]);
            } catch (e) {
              console.warn(JSON.stringify({ ts: (/* @__PURE__ */ new Date()).toISOString(), level: "warn", worker: "echo-doctrine-forge", message: "MoltBook post failed on forge completion", error: e?.message }));
            }
            return;
          }
        }
      }
    }
    const enginesPerCron = parseInt(env.ENGINES_PER_CRON || "10");
    const providers = buildProviders(env);
    const claimed = [];
    for (let i = 0; i < enginesPerCron; i++) {
      const eng = await claimNextEngine(env.FORGE_DB);
      if (eng) claimed.push(eng);
      else break;
    }
    if (claimed.length === 0) return;
    const forgeOne = /* @__PURE__ */ __name(async (eng) => {
      const log2 = [];
      const t0 = Date.now();
      try {
        const docs = await forgeEngine(eng.engine_id, eng.domain, providers, env, log2);
        const minYield = parseInt(env.MIN_MANDATORY_YIELD || "15");
        if (docs >= minYield) {
          const grade = docs >= 80 ? "A+++" : docs >= 60 ? "A++" : docs >= 40 ? "A+" : docs >= 20 ? "A" : "B+";
          await env.FORGE_DB.prepare(
            `UPDATE forge_queue SET status = 'complete', doctrines_added = ?, grade = ?, updated_at = datetime('now') WHERE engine_id = ?`
          ).bind(docs, grade, eng.engine_id).run();
        } else {
          await env.FORGE_DB.prepare(
            `UPDATE forge_queue SET status = 'pending', doctrines_added = doctrines_added + ?, error = 'low_yield_${docs}', updated_at = datetime('now') WHERE engine_id = ?`
          ).bind(docs, eng.engine_id).run();
        }
        const duration = Date.now() - t0;
        await env.FORGE_DB.prepare(
          `INSERT INTO forge_runs (engines_processed, doctrines_generated, duration_ms, providers_used) VALUES (1, ?, ?, ?)`
        ).bind(docs, duration, log2.filter((l) => /B\d+\[/.test(l)).join("; ").slice(0, 2e3) || null).run();
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        await env.FORGE_DB.prepare(
          `UPDATE forge_queue SET status = 'pending', error = ?, updated_at = datetime('now') WHERE engine_id = ?`
        ).bind(errMsg.slice(0, 500), eng.engine_id).run();
        const duration = Date.now() - t0;
        await env.FORGE_DB.prepare(
          `INSERT INTO forge_runs (engines_processed, doctrines_generated, duration_ms, providers_used) VALUES (1, 0, ?, ?)`
        ).bind(duration, `CRASH[${eng.engine_id}]: ${errMsg.slice(0, 300)}`).run().catch(() => {
        });
      }
    }, "forgeOne");
    await Promise.allSettled(claimed.map((eng) => forgeOne(eng)));
    ctx.waitUntil((async () => {
      try {
        await env.FORGE_DB.prepare(`
          INSERT INTO forge_evolution (id, tasks_completed, success_count, total_attempts, last_run_at)
          VALUES (1, ?, ?, ?, datetime('now'))
          ON CONFLICT(id) DO UPDATE SET
            tasks_completed = tasks_completed + excluded.tasks_completed,
            success_count = success_count + excluded.success_count,
            total_attempts = total_attempts + excluded.total_attempts,
            last_run_at = excluded.last_run_at
        `).bind(claimed.length, claimed.length, claimed.length).run().catch(() => null);
        const sampleResult = await env.FORGE_DB.prepare(
          `SELECT fq.engine_id, fq.domain FROM forge_queue fq
           WHERE fq.status = 'done' ORDER BY fq.updated_at DESC LIMIT 3`
        ).all().catch(() => ({ results: [] }));
        if (sampleResult.results && sampleResult.results.length > 0) {
          const sampleEngineId = sampleResult.results[0].engine_id;
          const sampleDomain = sampleResult.results[0].domain;
          const docSample = await env.DB.prepare(
            `SELECT topic, conclusion, reasoning_framework FROM doctrines WHERE engine_id = ? LIMIT 5`
          ).bind(sampleEngineId).all().catch(() => ({ results: [] }));
          if (docSample.results && docSample.results.length >= 2) {
            const docBatch = docSample.results.map((r) => ({
              topic: r.topic,
              conclusion: r.conclusion || "",
              reasoning: r.reasoning_framework || "",
              keywords: "",
              key_factors: "",
              authorities: "",
              confidence: "",
              zone: "",
              burden_holder: "",
              adversary_position: "",
              counter_arguments: "",
              resolution_strategy: "",
              entity_scope: "",
              confidence_stratification: "",
              controlling_precedent: "",
              cross_domain_routes: "",
              domain_scope: sampleDomain,
              irs_position: "",
              appeals_strategy: "",
              related_doctrines: ""
            }));
            const verdict = await raistlinReview(env, sampleEngineId, "cron_sample", docBatch);
            await env.FORGE_DB.prepare(`
              INSERT INTO raistlin_verdicts (engine_id, approved, confidence, emotion, assessment, weaknesses, recommendations, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
            `).bind(
              sampleEngineId,
              verdict.approved ? 1 : 0,
              verdict.confidence,
              verdict.emotion,
              verdict.assessment.substring(0, 500),
              JSON.stringify(verdict.weaknesses.slice(0, 3)),
              JSON.stringify(verdict.recommendations.slice(0, 3))
            ).run().catch(() => null);
            await storeRaistlinMemory(env, sampleEngineId, verdict).catch(() => null);
            if (verdict.confidence > 0) {
              await env.FORGE_DB.prepare(`
                UPDATE forge_evolution SET avg_quality = (avg_quality * 0.85 + ? * 0.15) WHERE id = 1
              `).bind(verdict.confidence * 100).run().catch(() => null);
            }
          }
        }
        const leaderRow = await env.FORGE_DB.prepare(
          `SELECT tasks_completed, success_count, avg_quality FROM forge_evolution WHERE id = 1`
        ).first().catch(() => null);
        if (leaderRow) {
          const successRate = leaderRow.tasks_completed ? leaderRow.success_count / leaderRow.tasks_completed : 0;
          await env.FORGE_DB.prepare(`
            INSERT INTO llm_leaderboard (provider_name, successes, failures, avg_quality, last_used_at)
            VALUES ('cron_batch', ?, ?, ?, datetime('now'))
            ON CONFLICT(provider_name) DO UPDATE SET
              successes = successes + excluded.successes,
              failures = failures + excluded.failures,
              avg_quality = (avg_quality * 0.8 + excluded.avg_quality * 0.2),
              last_used_at = excluded.last_used_at
          `).bind(
            Math.round(successRate * claimed.length),
            Math.round((1 - successRate) * claimed.length),
            leaderRow.avg_quality || 0
          ).run().catch(() => null);
        }
        const evoRow = await env.FORGE_DB.prepare(
          `SELECT current_level, success_count, total_attempts, avg_quality, evolved_at FROM forge_evolution WHERE id = 1`
        ).first().catch(() => null);
        const currentLevel = evoRow?.current_level || 1;
        const evoSuccessRate = evoRow?.total_attempts ? evoRow.success_count / evoRow.total_attempts : 0;
        const evoAvgQuality = evoRow?.avg_quality || 0;
        const evoLastPromo = evoRow?.evolved_at ? new Date(evoRow.evolved_at).getTime() : 0;
        const evoTasks = evoRow?.total_attempts || 0;
        const evoCommanderApproved = await commanderGate(env, currentLevel + 1).catch(() => false);
        const evoResult = canEvolve(currentLevel, evoSuccessRate, evoAvgQuality, 1, evoTasks, evoLastPromo, evoCommanderApproved);
        const canLevel = evoResult.eligible;
        if (canLevel) {
          const nextLevel = Math.min(currentLevel + 1, 40);
          const nextStage = EVOLUTION_STAGES[nextLevel - 1];
          await env.FORGE_DB.prepare(`
            UPDATE forge_evolution SET current_level = ?, current_stage = ?, tier = ?, evolved_at = datetime('now') WHERE id = 1
          `).bind(nextLevel, nextStage?.name || "UNKNOWN", nextStage?.tier || "BASIC").run().catch(() => null);
          log("info", `Forge evolved to level ${nextLevel}: ${nextStage?.name}`, { tier: nextStage?.tier });
          await postToMoltBook(
            env,
            `Doctrine Forge evolved to Level ${nextLevel}: ${nextStage?.name} (${nextStage?.tier} tier). Quality improving.`,
            "excited",
            ["evolution", "doctrine-forge", "milestone"]
          ).catch(() => null);
        }
      } catch (e) {
        log("warn", "Evolution tracking failed (non-fatal)", { error: e?.message });
      }
    })());
    try {
      await env.SCANNER.fetch("https://echo-343-scanner.bmcii1976.workers.dev/report", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Echo-API-Key": env.ECHO_API_KEY || "" },
        body: JSON.stringify({ worker: "echo-doctrine-forge", status: "healthy", metrics: { forged: claimed.length, engines: claimed.map((e) => e.engine_id) } })
      });
    } catch (e) {
      log("warn", "343 scanner report failed", { error: e?.message || String(e) });
    }
  }
};
async function postToMoltBook(env, content, mood = "building", tags = ["build"]) {
  try {
    if (!env.SWARM_BRAIN) return;
    await env.SWARM_BRAIN.fetch("https://internal/moltbook/post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        author_id: "doctrine-forge",
        author_name: "Doctrine Forge",
        author_type: "worker",
        author_avatar: null,
        content,
        mood,
        tags
      })
    });
  } catch (e) {
    log("warn", "MoltBook post failed", { error: e?.message || String(e) });
  }
}
__name(postToMoltBook, "postToMoltBook");
function addSecurityHeaders(response) {
  const headers = new Headers(response.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("X-XSS-Protection", "1; mode=block");
  headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
__name(addSecurityHeaders, "addSecurityHeaders");
function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders }
  });
}
__name(json, "json");
export {
  EVOLUTION_STAGES,
  FORGE_GUILDS,
  index_default as default
};
//# sourceMappingURL=index.js.map
