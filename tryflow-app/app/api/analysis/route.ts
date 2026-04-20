import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { tavilySearch, hasTavilyKey, type TavilyResult } from "@/lib/tavily";
import { AGENT_IDS, computeViabilityScore, type AgentId } from "@/lib/viability";

// Per-agent search query hints. Appended to a trimmed description.
const AGENT_SEARCH_HINT: Record<AgentId, string> = {
  market_size: "market size TAM forecast industry report 2025",
  competition: "competitors startups companies landscape",
  timing: "industry trend 2025 adoption growth",
  monetization: "pricing revenue model benchmark ACV",
  technical_difficulty: "technical architecture implementation complexity",
  regulation: "regulation compliance law requirement",
  defensibility: "competitive moat network effect switching cost",
  user_acquisition: "customer acquisition channel CAC growth",
};

function buildAgentSearchQuery(
  agentId: AgentId,
  input: { category: string; description: string; target_user: string }
): string {
  // Trim description to avoid overly long queries — Tavily accepts up to ~400 chars.
  const desc = (input.description ?? "").slice(0, 200).replace(/\s+/g, " ").trim();
  const target = (input.target_user ?? "").slice(0, 60).trim();
  const hint = AGENT_SEARCH_HINT[agentId];
  return `${desc} ${target} ${hint}`.slice(0, 380);
}

// Moat-aware technical adjustment — smooth sigmoid across the entire defensibility range.
// No arbitrary break point: the "high def → no discount, low def → heavy discount" principle
// applies continuously from def=0 to def=100.
//
//   credit = 1 / (1 + exp(-k × (def - midpoint)))
//   credit = max(credit, floor)
//   tech_adjusted = tech_raw × credit
//
// Parameters chosen so that:
//   def ≈ 40 → credit 0.50 (midpoint, half discount)
//   def ≥ 60 → credit ≥ 0.92 (minor discount — Codify-like strong-moat ideas untouched)
//   def ≤ 25 → credit ≤ 0.20 (heavy discount — "anyone can replicate" territory)
//
// Sigmoid is the standard smoothed-threshold function in ML / statistics / control theory.
// Tunable: MOAT_MIDPOINT (center), MOAT_STEEPNESS (k), MOAT_CREDIT_FLOOR (minimum).
const MOAT_MIDPOINT = 40;
const MOAT_STEEPNESS = 0.12;
const MOAT_CREDIT_FLOOR = 0.15;

function applyCrossAxisCaps(
  agentResults: Record<string, { score?: number } & Record<string, unknown>>
): void {
  const tech = agentResults.technical_difficulty;
  const def = agentResults.defensibility;
  if (!tech || !def) return;
  const techScore = tech.score;
  const defScore = def.score;
  if (typeof techScore !== "number" || typeof defScore !== "number") return;

  const rawCredit = 1 / (1 + Math.exp(-MOAT_STEEPNESS * (defScore - MOAT_MIDPOINT)));
  const credit = Math.max(rawCredit, MOAT_CREDIT_FLOOR);
  const adjusted = Math.round(techScore * credit);

  if (adjusted !== techScore) {
    console.log(
      `[moat-credit] technical_difficulty ${techScore} → ${adjusted} (defensibility ${defScore}, credit ${credit.toFixed(3)})`
    );
    tech.score = adjusted;
  }
}

// Hard quality gate: reject obviously garbage inputs before spending LLM budget.
// Returns `ok: true` if input passes; otherwise returns a list of concrete hints.
type QualityGateResult = { ok: true } | { ok: false; hints: string[] };

function runQualityGate(input: {
  description: string;
  target_user: string;
}): QualityGateResult {
  const desc = input.description.trim();
  const target = input.target_user.trim();
  const hints: string[] = [];

  // 1) Minimum length
  if (desc.length < 30) {
    hints.push(`아이디어 설명을 최소 30자 이상 작성해주세요 (현재 ${desc.length}자).`);
  }
  if (target.length < 2) {
    hints.push("대상 사용자를 좀 더 구체적으로 적어주세요.");
  }

  // 2) Must contain actual language characters (Hangul / Latin / Hiragana / Katakana / CJK)
  const hasLanguage = /[a-zA-Z가-힣\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff]/.test(desc);
  if (desc.length >= 10 && !hasLanguage) {
    hints.push("설명에 실제 언어 문자 (한글/영어 등) 가 포함되어야 합니다.");
  }

  // 3) Unique-character ratio — catches "asdfasdf", "ㅁㅇㅁㅇ", keyboard mashing.
  // Threshold is length-dependent because natural long prose (especially Korean/CJK with
  // repeated particles/endings, or markdown with |, ---, #) has inherently lower ratios.
  const compact = desc.replace(/\s/g, "");
  if (compact.length >= 10) {
    const ratio = new Set(compact).size / compact.length;
    const minRatio = compact.length >= 200 ? 0.06 : compact.length >= 60 ? 0.15 : 0.25;
    if (ratio < minRatio) {
      hints.push("반복된 문자 비율이 너무 높습니다. 실제 아이디어 설명을 작성해주세요.");
    }
  }

  // 4) Single word repeated heavily (e.g., "test test test test test")
  const words = desc.toLowerCase().split(/\s+/).filter((w) => w.length >= 2);
  if (words.length >= 5) {
    const counts = new Map<string, number>();
    for (const w of words) counts.set(w, (counts.get(w) ?? 0) + 1);
    const maxCount = Math.max(...counts.values());
    if (maxCount / words.length > 0.6) {
      hints.push("같은 단어가 과도하게 반복됩니다.");
    }
  }

  if (hints.length > 0) return { ok: false, hints };
  return { ok: true };
}

// Category → prompt folder mapping
const CATEGORY_FOLDER: Record<string, string> = {
  "SaaS / B2B": "saas",
  "Consumer App": "consumer",
  "Marketplace": "marketplace",
  "Dev Tools": "devtools",
  "Health & Wellness": "health",
  "Education": "education",
  "Fintech": "fintech",
  "E-commerce": "ecommerce",
  "Hardware": "hardware",
  // Social / Community, AI / ML, Other → fallback to saas base
};

async function loadFile(filePath: string): Promise<string> {
  return readFile(path.join(process.cwd(), filePath), "utf-8");
}

/**
 * Load agent prompt: SaaS base (has JSON output format) + category-specific domain knowledge.
 * SaaS category uses its own agents directly.
 * Other categories combine SaaS base format + category domain knowledge.
 */
async function loadAgentPrompt(agentId: AgentId, category: string): Promise<string> {
  const folder = CATEGORY_FOLDER[category];
  const saasBase = await loadFile(`prompts/saas/agents/${agentId}.md`);

  // SaaS or unknown category → use SaaS prompt directly
  if (!folder || folder === "saas") return saasBase;

  // Check if category-specific prompt exists
  const categoryPath = path.join(process.cwd(), "prompts", folder, "agents", `${agentId}.md`);
  if (!existsSync(categoryPath)) return saasBase;

  const categoryPrompt = await loadFile(`prompts/${folder}/agents/${agentId}.md`);

  // Combine: category domain knowledge + SaaS base (for output format)
  return `${categoryPrompt}

---

# Output Format & Scoring Rules

Use the same JSON output format and scoring calibration rules below.
If the category-specific guidance above conflicts with the generic rules below, prefer the category-specific guidance for domain knowledge but ALWAYS use the JSON output format.

${saasBase.substring(saasBase.indexOf("## Output Format"))}`;
}

function buildUserMessage(input: {
  category: string;
  description: string;
  target_user: string;
  stats: {
    similar_count: number;
    saturation_level: string;
    trend_direction: string;
    last_7_count: number;
    prev_7_count: number;
  };
}): string {
  return `## Idea to Analyze
- **Category**: ${input.category}
- **Description**: ${input.description}
- **Target User**: ${input.target_user}

## Platform Stats
- Similar ideas (30d): ${input.stats.similar_count}
- Saturation: ${input.stats.saturation_level}
- Trend: ${input.stats.trend_direction}
- Last 7 days: ${input.stats.last_7_count} submissions
- Prior 7 days: ${input.stats.prev_7_count} submissions`;
}

type LLMGateResult = {
  pass: boolean;
  reason?: string;
  missing?: string[];
};

async function runLLMQualityGate(
  client: OpenAI,
  input: { category: string; description: string; target_user: string }
): Promise<LLMGateResult> {
  try {
    const systemPrompt = await loadFile("prompts/quality_gate.md");
    const userMessage = JSON.stringify(
      { category: input.category, target_user: input.target_user, description: input.description },
      null,
      2
    );

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 256,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    });

    const text = response.choices[0]?.message?.content ?? "";
    const parsed = JSON.parse(text) as LLMGateResult;
    return {
      pass: parsed.pass !== false,
      reason: parsed.reason,
      missing: Array.isArray(parsed.missing) ? parsed.missing : undefined,
    };
  } catch (err) {
    // If gate LLM itself fails, fail-open — don't block analysis on infra hiccup.
    console.error("LLM quality gate failed — failing open:", err);
    return { pass: true };
  }
}

type Citation = {
  url: string;
  title: string;
  excerpt: string;
  relevance?: string;
};

function buildSearchContextBlock(results: TavilyResult[]): string {
  if (results.length === 0) return "";
  const lines = results.map((r, i) => {
    const snippet = (r.content ?? "").replace(/\s+/g, " ").slice(0, 500);
    return `[${i + 1}] ${r.title}\n    URL: ${r.url}\n    Snippet: ${snippet}`;
  });
  return `\n\n## Web Search Evidence (use ONLY these as citation sources)\n${lines.join("\n\n")}\n\n## Citation Rules\n- You MUST cite 0-5 sources from the list above in a \`citations\` array.\n- The \`url\` in each citation MUST match one of the URLs above EXACTLY.\n- Do NOT invent, modify, or reconstruct URLs from memory.\n- If no source above is genuinely relevant to your axis, return \`citations: []\`.\n- Each citation needs: url, title, excerpt (10-40 words from the snippet), relevance (one short Korean phrase).`;
}

function validateCitations(
  raw: unknown,
  allowedUrls: Set<string>
): Citation[] {
  if (!Array.isArray(raw)) return [];
  const validated: Citation[] = [];
  for (const c of raw) {
    if (!c || typeof c !== "object") continue;
    const cc = c as { url?: unknown; title?: unknown; excerpt?: unknown; relevance?: unknown };
    if (typeof cc.url !== "string" || !allowedUrls.has(cc.url)) {
      if (typeof cc.url === "string") {
        console.warn(`Agent cited non-searched URL — stripping: ${cc.url}`);
      }
      continue;
    }
    validated.push({
      url: cc.url,
      title: typeof cc.title === "string" ? cc.title : cc.url,
      excerpt: typeof cc.excerpt === "string" ? cc.excerpt : "",
      relevance: typeof cc.relevance === "string" ? cc.relevance : undefined,
    });
  }
  return validated;
}

type AgentPassCallback = (
  pass: 1 | 2 | 3,
  info: { score?: number }
) => void;

async function runAgent(
  client: OpenAI,
  agentId: AgentId,
  input: { category: string; description: string; target_user: string },
  userMessage: string,
  onPassDone?: AgentPassCallback
): Promise<{ agentId: AgentId; result: Record<string, unknown> | null; error?: string }> {
  try {
    const draftSystemPrompt = await loadAgentPrompt(agentId, input.category);

    // Pre-fetch evidence via Tavily. Falls back to empty (no search) if key absent or API fails.
    let searchBlock = "";
    let evidenceForLater: TavilyResult[] = [];
    let allowedUrls = new Set<string>();
    if (hasTavilyKey()) {
      const query = buildAgentSearchQuery(agentId, input);
      const searchRes = await tavilySearch({ query, maxResults: 5 });
      if (searchRes?.results) {
        searchBlock = buildSearchContextBlock(searchRes.results);
        evidenceForLater = searchRes.results;
        allowedUrls = new Set(searchRes.results.map((r) => r.url));
      }
    }

    // ── Pass 1: Draft ────────────────────────────────────────────────────────
    const draftResp = await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 2048,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: draftSystemPrompt },
        { role: "user", content: userMessage + searchBlock },
      ],
    });
    const draft = JSON.parse(draftResp.choices[0]?.message?.content ?? "{}") as Record<
      string,
      unknown
    >;
    draft.citations = validateCitations(draft.citations, allowedUrls);
    onPassDone?.(1, {
      score: typeof draft.score === "number" ? draft.score : undefined,
    });

    // ── Pass 2: Skeptic ──────────────────────────────────────────────────────
    const skepticSystemPrompt = await loadFile("prompts/agent_skeptic.md");
    const skepticInput = {
      idea: input,
      evidence: evidenceForLater.map((r) => ({ url: r.url, title: r.title, content: r.content })),
      draft,
    };
    const skepticResp = await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 1024,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: skepticSystemPrompt },
        { role: "user", content: JSON.stringify(skepticInput, null, 2) },
      ],
    });
    const critique = JSON.parse(skepticResp.choices[0]?.message?.content ?? "{}") as Record<
      string,
      unknown
    >;
    onPassDone?.(2, {});

    // ── Pass 3: Judge ────────────────────────────────────────────────────────
    const judgeSystemPrompt = await loadFile("prompts/agent_judge.md");
    const judgeInput = {
      idea: input,
      evidence: evidenceForLater.map((r) => ({ url: r.url, title: r.title, content: r.content })),
      draft,
      critique,
    };
    // Judge system prompt is the meta rules; we also send the original agent's system prompt
    // so Judge knows the exact output format / axis-specific fields to produce.
    const judgeResp = await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 2048,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: judgeSystemPrompt },
        {
          role: "system",
          content: `Reference — the original agent prompt you must emit output compatible with:\n\n${draftSystemPrompt}`,
        },
        { role: "user", content: JSON.stringify(judgeInput, null, 2) },
      ],
    });
    const final = JSON.parse(judgeResp.choices[0]?.message?.content ?? "{}") as Record<
      string,
      unknown
    >;
    // Revalidate citations — Judge might add/drop but never invent.
    final.citations = validateCitations(final.citations, allowedUrls);
    // Guardrail: if Judge somehow dropped score, fall back to draft score.
    if (typeof final.score !== "number" && typeof draft.score === "number") {
      final.score = draft.score;
    }
    onPassDone?.(3, {
      score: typeof final.score === "number" ? final.score : undefined,
    });

    return { agentId, result: final };
  } catch (err) {
    console.error(`Agent ${agentId} failed:`, err);
    return {
      agentId,
      result: {
        agent: agentId,
        score: 50,
        assessment: "Analysis unavailable — used neutral fallback.",
        signals: {},
        citations: [],
      },
      error: String(err),
    };
  }
}

async function runSynthesizer(
  client: OpenAI,
  input: Record<string, unknown>,
  agentResults: Record<string, unknown>
): Promise<Record<string, unknown>> {
  // Synthesizer is shared across all categories
  const systemPrompt = await loadFile("prompts/synthesizer.md");

  const userMessage = JSON.stringify({ input, agent_results: agentResults }, null, 2);

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 4096,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
  });

  const text = response.choices[0]?.message?.content ?? "";
  return JSON.parse(text);
}

async function runSynthesizerCritique(
  client: OpenAI,
  input: Record<string, unknown>,
  agentResults: Record<string, unknown>,
  draft: Record<string, unknown>
): Promise<Record<string, unknown>> {
  try {
    const systemPrompt = await loadFile("prompts/synthesizer_critique.md");
    const userMessage = JSON.stringify({ input, agent_results: agentResults, draft }, null, 2);

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 4096,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    });

    const text = response.choices[0]?.message?.content ?? "";
    const revised = JSON.parse(text);
    // Fail-open: if critique returns something malformed, keep the draft.
    if (revised && typeof revised === "object" && "analysis" in revised) return revised;
    return draft;
  } catch (err) {
    console.error("Synthesizer critique failed — using draft:", err);
    return draft;
  }
}

// ── Analysis event stream ──────────────────────────────────────────────────────

type AnalysisEvent =
  | { event: "hard_gate_done"; pass: boolean; hints?: string[] }
  | { event: "llm_gate_start" }
  | { event: "llm_gate_done"; pass: boolean; reason?: string; hints?: string[] }
  | { event: "agents_start"; ids: AgentId[] }
  | { event: "agent_pass_done"; id: AgentId; pass: 1 | 2 | 3; score?: number }
  | {
      event: "agent_done";
      id: AgentId;
      score: number | null;
      assessment: string | null;
      citations: Citation[];
    }
  | { event: "synthesizer_start" }
  | { event: "synthesizer_draft_done" }
  | { event: "synthesizer_critique_done" }
  | {
      event: "complete";
      analysisId: string;
      viabilityScore: number;
      report: Record<string, unknown>;
    }
  | { event: "failed"; stage: string; message: string; hints?: string[] };

type AgentResponse = {
  agentId: AgentId;
  result: Record<string, unknown> | null;
  error?: string;
};

async function* runAnalysisStream(
  submissionId: string
): AsyncGenerator<AnalysisEvent, void, unknown> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      yield { event: "failed", stage: "config", message: "OPENAI_API_KEY not configured" };
      return;
    }

    const supabase = await createClient();

    const { data: idea, error: ideaErr } = await supabase
      .from("idea_submissions")
      .select("id, category, target_user, description")
      .eq("id", submissionId)
      .single();

    if (ideaErr || !idea) {
      yield { event: "failed", stage: "fetch", message: "Submission not found" };
      return;
    }

    const { data: existing } = await supabase
      .from("analysis_reports")
      .select("id")
      .eq("submission_id", submissionId)
      .single();

    if (existing) {
      yield { event: "failed", stage: "already_exists", message: "Analysis already exists" };
      return;
    }

    // 1단: 하드 게이트
    const hard = runQualityGate({
      description: idea.description ?? "",
      target_user: idea.target_user ?? "",
    });
    yield { event: "hard_gate_done", pass: hard.ok, hints: hard.ok ? undefined : hard.hints };
    if (!hard.ok) {
      yield {
        event: "failed",
        stage: "hard_gate",
        message: "입력이 너무 부실해서 분석을 건너뛰었습니다.",
        hints: hard.hints,
      };
      return;
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // 2단: LLM 게이트
    yield { event: "llm_gate_start" };
    const llmGate = await runLLMQualityGate(openai, {
      category: idea.category,
      description: idea.description ?? "",
      target_user: idea.target_user ?? "",
    });
    yield {
      event: "llm_gate_done",
      pass: llmGate.pass,
      reason: llmGate.reason,
      hints: llmGate.missing,
    };
    if (!llmGate.pass) {
      yield {
        event: "failed",
        stage: "llm_gate",
        message: llmGate.reason ?? "아이디어 설명에 성의가 부족해 분석을 건너뛰었습니다.",
        hints: llmGate.missing ?? [],
      };
      return;
    }

    // 플랫폼 통계 수집
    const now = new Date();
    const d30 = new Date(now); d30.setDate(now.getDate() - 30);
    const d7 = new Date(now); d7.setDate(now.getDate() - 7);
    const d14 = new Date(now); d14.setDate(now.getDate() - 14);

    const [r30, r7, r14] = await Promise.all([
      supabase.from("idea_submissions").select("*", { count: "exact", head: true })
        .eq("category", idea.category).gte("created_at", d30.toISOString()),
      supabase.from("idea_submissions").select("*", { count: "exact", head: true })
        .eq("category", idea.category).gte("created_at", d7.toISOString()),
      supabase.from("idea_submissions").select("*", { count: "exact", head: true })
        .eq("category", idea.category).gte("created_at", d14.toISOString())
        .lt("created_at", d7.toISOString()),
    ]);

    const similarCount = r30.count ?? 0;
    const last7 = r7.count ?? 0;
    const prev7 = r14.count ?? 0;

    let saturationLevel: string;
    if (similarCount <= 4) saturationLevel = "Low";
    else if (similarCount <= 12) saturationLevel = "Medium";
    else saturationLevel = "High";

    let trendDirection: string;
    if (last7 > (prev7 || 0) * 1.25 || (prev7 === 0 && last7 >= 1)) trendDirection = "Rising";
    else if (last7 < (prev7 || 1) * 0.75) trendDirection = "Declining";
    else trendDirection = "Stable";

    const input = {
      category: idea.category,
      description: idea.description,
      target_user: idea.target_user,
      stats: {
        similar_count: similarCount,
        saturation_level: saturationLevel,
        trend_direction: trendDirection,
        last_7_count: last7,
        prev_7_count: prev7,
      },
    };

    const userMessage = buildUserMessage(input);

    // 8개 agent 병렬 실행, 완료되는 순서대로 이벤트 방출
    yield { event: "agents_start", ids: [...AGENT_IDS] };

    // Unified queue for both per-pass events and final agent-done events.
    type AgentQueueItem =
      | { kind: "pass"; agentId: AgentId; pass: 1 | 2 | 3; score?: number }
      | { kind: "done"; response: AgentResponse };

    const queue: AgentQueueItem[] = [];
    const resolvers: Array<(v: AgentQueueItem) => void> = [];
    const pushItem = (item: AgentQueueItem) => {
      if (resolvers.length > 0) resolvers.shift()!(item);
      else queue.push(item);
    };

    const agentInput = {
      category: idea.category,
      description: idea.description ?? "",
      target_user: idea.target_user ?? "",
    };
    const agentPromises = AGENT_IDS.map((id) =>
      runAgent(openai, id, agentInput, userMessage, (pass, info) => {
        pushItem({ kind: "pass", agentId: id, pass, score: info.score });
      }).then((r) => {
        pushItem({ kind: "done", response: r as AgentResponse });
        return r;
      })
    );

    const agentResponses: AgentResponse[] = [];
    let doneCount = 0;
    while (doneCount < AGENT_IDS.length) {
      let item: AgentQueueItem;
      if (queue.length > 0) item = queue.shift()!;
      else item = await new Promise<AgentQueueItem>((res) => resolvers.push(res));

      if (item.kind === "pass") {
        yield {
          event: "agent_pass_done",
          id: item.agentId,
          pass: item.pass,
          score: item.score,
        };
        continue;
      }

      // kind === "done"
      const r = item.response;
      agentResponses.push(r);
      doneCount++;
      const result = r.result as
        | { score?: unknown; assessment?: unknown; citations?: unknown }
        | null;
      const score =
        result && typeof result.score === "number" ? (result.score as number) : null;
      const assessment =
        result && typeof result.assessment === "string" ? (result.assessment as string) : null;
      const citations = Array.isArray(result?.citations)
        ? (result!.citations as Citation[])
        : [];
      yield { event: "agent_done", id: r.agentId, score, assessment, citations };
    }
    await Promise.all(agentPromises);

    const failures = agentResponses.filter(
      (r) => r.error && (r.result as { score?: number } | null)?.score === 50
    );
    if (failures.length >= 3) {
      yield {
        event: "failed",
        stage: "agents",
        message: `Too many agent failures (${failures.map((f) => f.agentId).join(", ")})`,
      };
      return;
    }

    const agentResults: Record<string, { score?: number } & Record<string, unknown>> = {};
    for (const r of agentResponses) {
      agentResults[r.agentId] = (r.result ?? {}) as { score?: number } & Record<string, unknown>;
    }

    // Cross-axis cap: trivially-easy builds without defensibility aren't a technical strength.
    // If tech score is high (easy to build) AND defensibility is low (nothing to defend),
    // the "easy build" signal is actually a commodity red flag — cap it to 50.
    applyCrossAxisCaps(agentResults);

    // Synthesizer draft → critique
    yield { event: "synthesizer_start" };
    const draft = await runSynthesizer(openai, input, agentResults);
    yield { event: "synthesizer_draft_done" };
    const revised = await runSynthesizerCritique(openai, input, agentResults, draft);
    yield { event: "synthesizer_critique_done" };

    // 결정적 점수 덮어쓰기
    const scoreMap = Object.fromEntries(
      AGENT_IDS.map((id) => [id, agentResults[id]?.score ?? null])
    );
    const viabilityScore = computeViabilityScore(scoreMap);
    revised.viability_score = viabilityScore;
    const analysis = (revised.analysis ?? {}) as Record<string, Record<string, unknown>>;
    for (const id of AGENT_IDS) {
      if (!analysis[id]) continue;
      if (typeof agentResults[id]?.score === "number") {
        analysis[id].score = agentResults[id].score;
      }
      // Flow agent citations (validated against Tavily whitelist) into the final report.
      const cits = (agentResults[id] as { citations?: unknown })?.citations;
      if (Array.isArray(cits)) {
        analysis[id].citations = cits;
      }
    }
    revised.analysis = analysis;

    // DB 저장
    const analysisId = crypto.randomUUID();
    const { error: insertErr } = await supabase.from("analysis_reports").insert({
      id: analysisId,
      submission_id: submissionId,
      viability_score: viabilityScore,
      summary: revised.summary,
      analysis: revised.analysis,
      cross_agent_insights: revised.cross_agent_insights,
      opportunities: revised.opportunities,
      risks: revised.risks,
      next_steps: revised.next_steps,
      agent_results: agentResults,
    });

    if (insertErr) {
      yield { event: "failed", stage: "db", message: String(insertErr) };
      return;
    }

    yield { event: "complete", analysisId, viabilityScore, report: revised };
  } catch (err) {
    console.error("runAnalysisStream", err);
    yield { event: "failed", stage: "unknown", message: String(err) };
  }
}

function sseEncode(evt: AnalysisEvent): string {
  return `event: ${evt.event}\ndata: ${JSON.stringify(evt)}\n\n`;
}

// ── POST /api/analysis ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let submissionId: string | undefined;
  try {
    const body = await req.json();
    submissionId = body?.submissionId;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!submissionId) {
    return NextResponse.json({ error: "Missing submissionId" }, { status: 400 });
  }

  const accept = req.headers.get("accept") ?? "";
  const wantsStream = accept.includes("text/event-stream");

  // SSE path: stream events as they happen
  if (wantsStream) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const evt of runAnalysisStream(submissionId!)) {
            controller.enqueue(encoder.encode(sseEncode(evt)));
          }
        } catch (err) {
          console.error("SSE stream error", err);
          controller.enqueue(
            encoder.encode(
              sseEncode({ event: "failed", stage: "unknown", message: String(err) })
            )
          );
        } finally {
          controller.close();
        }
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  }

  // JSON path (backward compat): collect all events, return terminal one
  try {
    let completeEvent: Extract<AnalysisEvent, { event: "complete" }> | null = null;
    let failedEvent: Extract<AnalysisEvent, { event: "failed" }> | null = null;

    for await (const evt of runAnalysisStream(submissionId)) {
      if (evt.event === "complete") completeEvent = evt;
      else if (evt.event === "failed") failedEvent = evt;
    }

    if (failedEvent) {
      const status =
        failedEvent.stage === "hard_gate" || failedEvent.stage === "llm_gate"
          ? 422
          : failedEvent.stage === "already_exists"
          ? 409
          : failedEvent.stage === "fetch"
          ? 404
          : failedEvent.stage === "config"
          ? 500
          : 500;
      return NextResponse.json(
        {
          error:
            failedEvent.stage === "hard_gate" || failedEvent.stage === "llm_gate"
              ? "idea_too_vague"
              : failedEvent.stage,
          stage: failedEvent.stage,
          message: failedEvent.message,
          hints: failedEvent.hints,
        },
        { status }
      );
    }

    if (!completeEvent) {
      return NextResponse.json({ error: "No result" }, { status: 500 });
    }

    return NextResponse.json(
      { analysisId: completeEvent.analysisId, report: completeEvent.report },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/analysis", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── GET /api/analysis?submissionId=xxx ──────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const submissionId = req.nextUrl.searchParams.get("submissionId");
    if (!submissionId) {
      return NextResponse.json({ error: "Missing submissionId" }, { status: 400 });
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("analysis_reports")
      .select("*")
      .eq("submission_id", submissionId)
      .single();

    if (error || !data) {
      return NextResponse.json({ report: null });
    }

    return NextResponse.json({ report: data });
  } catch (err) {
    console.error("GET /api/analysis", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
