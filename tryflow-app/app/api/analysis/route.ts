import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { tavilySearch, hasTavilyKey, type TavilyResult } from "@/lib/tavily";
import { AGENT_IDS, computeViabilityScore, type AgentId } from "@/lib/viability";

// Per-agent search query hints. Appended to a trimmed description.
// 2026-04: 8 axes → 6. See decisions/evaluation-axes-rationale.md.
const AGENT_SEARCH_HINT: Record<AgentId, string> = {
  market_size: "market size TAM forecast industry report 2025",
  problem_urgency: "user pain workflow problem complaint frustration unmet need",
  timing: "industry trend 2025 adoption growth inflection enabler",
  product: "alternatives comparison 10x better solution differentiator vs",
  defensibility: "competitive moat network effect switching cost competitors landscape",
  business_model: "pricing revenue model benchmark ACV CAC channel go-to-market",
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

// Moat-aware product adjustment — smooth sigmoid across the entire defensibility range.
// 2026-04: applies to `product` (10x solution) instead of `technical_difficulty`.
// Principle: a 10x product claim only counts if you can keep being 10x — without a
// moat, the advantage gets copied. Discount the product score when defensibility is low.
//
//   credit = 1 / (1 + exp(-k × (def - midpoint)))
//   credit = max(credit, floor)
//   product_adjusted = product_raw × credit
//
// Parameters chosen so that:
//   def ≈ 40 → credit 0.50 (midpoint, half discount)
//   def ≥ 60 → credit ≥ 0.92 (minor discount — strong-moat 10x products untouched)
//   def ≤ 25 → credit ≤ 0.20 (heavy discount — "10x but anyone can copy" territory)
//
// Sigmoid is the standard smoothed-threshold function in ML / statistics / control theory.
const MOAT_MIDPOINT = 40;
const MOAT_STEEPNESS = 0.12;
const MOAT_CREDIT_FLOOR = 0.15;

function applyCrossAxisCaps(
  agentResults: Record<string, { score?: number } & Record<string, unknown>>
): void {
  const product = agentResults.product;
  const def = agentResults.defensibility;
  if (!product || !def) return;
  const productScore = product.score;
  const defScore = def.score;
  if (typeof productScore !== "number" || typeof defScore !== "number") return;

  const rawCredit = 1 / (1 + Math.exp(-MOAT_STEEPNESS * (defScore - MOAT_MIDPOINT)));
  const credit = Math.max(rawCredit, MOAT_CREDIT_FLOOR);
  const adjusted = Math.round(productScore * credit);

  if (adjusted !== productScore) {
    console.log(
      `[moat-credit] product ${productScore} → ${adjusted} (defensibility ${defScore}, credit ${credit.toFixed(3)})`
    );
    product.score = adjusted;
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

// 2026-04 속도 개선: prompt 파일 module-scope 캐시.
// 기존: 요청당 20-30회 readFile (agent 6개 × 3-4 파일). 디스크 I/O + 파싱.
// 새로: 파일당 최초 1회만 읽고 Map 에 저장. 워커 lifetime 동안 0 disk I/O.
// prompt 파일은 런타임에 바뀌지 않으므로 invalidation 불필요.
const PROMPT_CACHE = new Map<string, string>();

async function loadFile(filePath: string): Promise<string> {
  const cached = PROMPT_CACHE.get(filePath);
  if (cached !== undefined) return cached;
  const content = await readFile(path.join(process.cwd(), filePath), "utf-8");
  PROMPT_CACHE.set(filePath, content);
  return content;
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
  axes?: {
    market?: string | null;
    problem?: string | null;
    timing?: string | null;
    product?: string | null;
    defensibility?: string | null;
    business_model?: string | null;
  };
}): string {
  // 2026-04: Founder 가 6 axis 별로 별도 답변 — 새 submit form 에서 옴.
  // 답변 있는 axis 만 출력. 옛날 single-description 제출은 axes 누락 → 섹션 통째로 생략.
  const axes = input.axes ?? {};
  const axisLabels: Record<string, string> = {
    market: "Market — who feels the pain and how many",
    problem: "Problem — what they do today and why it's broken",
    timing: "Timing — why now",
    product: "Product — what it actually does",
    defensibility: "Defensibility — what's hard to copy",
    business_model: "Business model — who pays and why",
  };
  const filledAxes = Object.entries(axes).filter(
    ([, v]) => typeof v === "string" && v.trim().length > 0
  );
  const axisBlock =
    filledAxes.length > 0
      ? `\n\n## Founder's answers (per axis)\n${filledAxes
          .map(([key, value]) => `### ${axisLabels[key] ?? key}\n${value}`)
          .join("\n\n")}`
      : "";

  return `## Idea to Analyze
- **Category**: ${input.category}
- **Description**: ${input.description}
- **Target User**: ${input.target_user}

## Platform Stats
- Similar ideas (30d): ${input.stats.similar_count}
- Saturation: ${input.stats.saturation_level}
- Trend: ${input.stats.trend_direction}
- Last 7 days: ${input.stats.last_7_count} submissions
- Prior 7 days: ${input.stats.prev_7_count} submissions${axisBlock}`;
}

type Citation = {
  url: string;
  title: string;
  excerpt: string;
  relevance?: string;
};

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
  pass: 1 | 2,
  info: { score?: number }
) => void;

async function runAgent(
  client: OpenAI,
  agentId: AgentId,
  input: { category: string; description: string; target_user: string },
  userMessage: string,
  onPassDone?: AgentPassCallback
): Promise<{ agentId: AgentId; result: Record<string, unknown> | null; error?: string }> {
  const t0 = Date.now();
  const tlog = (label: string) =>
    console.log(`  [agent ${agentId}] +${Date.now() - t0}ms ${label}`);
  try {
    const draftSystemPrompt = await loadAgentPrompt(agentId, input.category);
    tlog("prompt loaded, firing tavily + draft");

    // 2026-04 속도 개선 #2 — Tavily + Draft 병렬화.
    // 기존: Tavily 먼저 → 그 결과를 Draft 에 전달 (sequential).
    // 새로: Tavily 는 background 로 fire, Draft 는 evidence 없이 즉시 시작.
    //       Judge 단계에서 evidence 를 최종 반영. agent 당 2-3초 단축.
    const tavilyPromise: Promise<{ results: TavilyResult[] } | null> = hasTavilyKey()
      ? tavilySearch({ query: buildAgentSearchQuery(agentId, input), maxResults: 5 }).then(
          (r) => {
            tlog(`tavily done (${r?.results?.length ?? 0} results)`);
            return r ?? null;
          }
        )
      : Promise.resolve(null);

    const draftPromise = client.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 2048,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: draftSystemPrompt },
        { role: "user", content: userMessage },
      ],
    }).then((r) => {
      tlog("draft llm done");
      return r;
    });

    const [searchRes, draftResp] = await Promise.all([tavilyPromise, draftPromise]);

    const draft = JSON.parse(draftResp.choices[0]?.message?.content ?? "{}") as Record<
      string,
      unknown
    >;

    let evidenceForLater: TavilyResult[] = [];
    let allowedUrls = new Set<string>();
    if (searchRes?.results) {
      evidenceForLater = searchRes.results;
      allowedUrls = new Set(searchRes.results.map((r) => r.url));
    }
    // Draft didn't see evidence → any citation in draft is hallucinated. Drop it;
    // Judge will build citations from the (now available) evidence.
    draft.citations = [];

    onPassDone?.(1, {
      score: typeof draft.score === "number" ? draft.score : undefined,
    });

    // 2026-04 속도 개선 #1 — Skeptic 단계 흡수.
    // 기존: Draft → Skeptic → Judge (3 LLM calls per agent).
    // 새로: Draft → Judge (2 LLM calls per agent). Judge 프롬프트가 Step 1
    //       에서 내부 회의적 비판을 수행한 뒤 Step 2 에서 최종 reconcile.
    const judgeSystemPrompt = await loadFile("prompts/agent_judge.md");
    const judgeInput = {
      idea: input,
      evidence: evidenceForLater.map((r) => ({ url: r.url, title: r.title, content: r.content })),
      draft,
    };
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
    tlog(`judge llm done (total ${Date.now() - t0}ms)`);
    const final = JSON.parse(judgeResp.choices[0]?.message?.content ?? "{}") as Record<
      string,
      unknown
    >;
    // Judge builds citations from evidence — validate against allowed URLs.
    final.citations = validateCitations(final.citations, allowedUrls);
    // Guardrail: if Judge somehow dropped score, fall back to draft score.
    if (typeof final.score !== "number" && typeof draft.score === "number") {
      final.score = draft.score;
    }
    onPassDone?.(2, {
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

// ── Analysis event stream ──────────────────────────────────────────────────────

type AnalysisEvent =
  | { event: "hard_gate_done"; pass: boolean; hints?: string[] }
  | { event: "agents_start"; ids: AgentId[] }
  | { event: "agent_pass_done"; id: AgentId; pass: 1 | 2; score?: number }
  | {
      event: "agent_done";
      id: AgentId;
      score: number | null;
      assessment: string | null;
      citations: Citation[];
    }
  | { event: "synthesizer_start" }
  | { event: "synthesizer_draft_done" }
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
  const t0 = Date.now();
  const tlog = (label: string) =>
    console.log(`[analysis ${submissionId.slice(0, 6)}] +${Date.now() - t0}ms ${label}`);
  try {
    tlog("stream start");
    if (!process.env.OPENAI_API_KEY) {
      yield { event: "failed", stage: "config", message: "OPENAI_API_KEY not configured" };
      return;
    }

    const supabase = await createClient();
    tlog("supabase client ready");

    // 2026-04 속도 개선: idea fetch + existing-analysis check 를 병렬로.
    // 이전엔 sequential 2번 왕복이었음.
    const [ideaRes, existingRes] = await Promise.all([
      supabase
        .from("idea_submissions")
        .select(
          "id, category, target_user, description, axis_market, axis_problem, axis_timing, axis_product, axis_defensibility, axis_business_model"
        )
        .eq("id", submissionId)
        .single(),
      supabase
        .from("analysis_reports")
        .select("id")
        .eq("submission_id", submissionId)
        .maybeSingle(),
    ]);
    tlog("idea + existing checked");

    const { data: idea, error: ideaErr } = ideaRes;
    if (ideaErr || !idea) {
      yield { event: "failed", stage: "fetch", message: "Submission not found" };
      return;
    }

    if (existingRes.data) {
      yield { event: "failed", stage: "already_exists", message: "Analysis already exists" };
      return;
    }

    // 1단: 하드 게이트
    const hard = runQualityGate({
      description: idea.description ?? "",
      target_user: idea.target_user ?? "",
    });
    tlog("hard gate done");
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

    // 2026-04 속도 개선: LLM quality gate 제거.
    // 기존: hard gate 통과 후 LLM 에게 "성의 있는 입력인지" 한 번 더 물음 (3-5s 블로킹).
    // 근거: hard gate (length/언어/반복 체크) 가 이미 실제 쓰레기는 다 거름.
    //       LLM gate 는 edge case 만 잡는데 비용 대비 효과가 너무 낮음.
    // 필요해지면 `agents_start` 와 병렬로 쏘고 결과 오면 abort 하는 식으로 복귀 가능.

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

    // axis_* 컬럼은 새 form 에서 옴. 옛 제출은 null → 자동으로 섹션 누락.
    type IdeaWithAxes = typeof idea & {
      axis_market?: string | null;
      axis_problem?: string | null;
      axis_timing?: string | null;
      axis_product?: string | null;
      axis_defensibility?: string | null;
      axis_business_model?: string | null;
    };
    const ideaA = idea as IdeaWithAxes;
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
      axes: {
        market: ideaA.axis_market,
        problem: ideaA.axis_problem,
        timing: ideaA.axis_timing,
        product: ideaA.axis_product,
        defensibility: ideaA.axis_defensibility,
        business_model: ideaA.axis_business_model,
      },
    };

    const userMessage = buildUserMessage(input);

    tlog("stats fetched, launching agents");
    // 8개 agent 병렬 실행, 완료되는 순서대로 이벤트 방출
    yield { event: "agents_start", ids: [...AGENT_IDS] };

    // Unified queue for both per-pass events and final agent-done events.
    type AgentQueueItem =
      | { kind: "pass"; agentId: AgentId; pass: 1 | 2; score?: number }
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

    tlog("all agents done, starting synthesizer");
    // 2026-04 속도 개선: Synthesizer critique 단계 제거.
    // 기존: draft 만들고 critique 가 revise. critique 실패 시 draft 사용 (fail-open).
    // 근거: critique 가 실제로 draft 의 의미있는 수정을 내놓는 경우 드묾.
    //       agent 결과가 이미 2-pass (Draft → Judge) 로 다듬어진 상태라 2차 critique 가
    //       중복. 15-20s 가장 큰 절약 구간.
    yield { event: "synthesizer_start" };
    const revised = await runSynthesizer(openai, input, agentResults);
    tlog("synthesizer done");
    yield { event: "synthesizer_draft_done" };

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

    tlog(`complete (total ${Date.now() - t0}ms)`);
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
        failedEvent.stage === "hard_gate"
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
            failedEvent.stage === "hard_gate"
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
