import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { tavilySearch, hasTavilyKey, type TavilyResult } from "@/lib/tavily";
import { AGENT_IDS, computeViabilityScore, type AgentId } from "@/lib/viability";

// SSE 라이브 진행률을 위해 Vercel 함수 응답이 버퍼링되지 않도록 명시적으로 설정.
// dynamic="force-dynamic" 미설정 시 일부 layer 가 응답 전체를 모았다가 flush 해서
// 클라이언트가 모든 이벤트를 마지막에 한꺼번에 받음 → 진행률 게이지가 3% 에서 100%
// 로 점프하는 버그 원인.
// fs.readFile 사용으로 nodejs 런타임 명시. Pro plan 에선 maxDuration 300 까지 허용.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const maxDuration = 300;

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

// Walled-garden domains: Tavily가 인덱싱하지만 일반 사용자는 로그인/지역 벽으로
// 접근 못 하는 경우 많음. Citation으로 노출되면 "찾을 수 없다" 경험을 줌 → 제외.
const TAVILY_EXCLUDED_DOMAINS = [
  "linkedin.com",
  "facebook.com",
  "instagram.com",
  "x.com",
  "twitter.com",
];

const BLOCKED_HOSTS = new Set([
  "linkedin.com",
  "www.linkedin.com",
  "facebook.com",
  "www.facebook.com",
  "m.facebook.com",
  "instagram.com",
  "www.instagram.com",
  "x.com",
  "www.x.com",
  "twitter.com",
  "www.twitter.com",
  "mobile.twitter.com",
]);

function isBlockedUrl(url: string): boolean {
  try {
    return BLOCKED_HOSTS.has(new URL(url).hostname);
  } catch {
    return true;
  }
}

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

// Hard quality gate: reject obviously garbage inputs before spending LLM budget.
// Returns `ok: true` if input passes; otherwise returns a list of concrete hints.
type QualityGateResult = { ok: true } | { ok: false; hints: string[] };

function runQualityGate(input: {
  description: string;
  target_user: string;
  /** axis_* 컬럼 데이터 — 새 6-axis 제출 폼에서 옴. 있으면 ratio 체크 스킵. */
  axes?: {
    market?: string | null;
    problem?: string | null;
    timing?: string | null;
    product?: string | null;
    defensibility?: string | null;
    business_model?: string | null;
  };
}): QualityGateResult {
  const desc = input.description.trim();
  const target = input.target_user.trim();
  const hints: string[] = [];

  // 새 폼 감지 — axis 답변이 하나라도 있으면 structured 제출로 간주.
  const hasAxes =
    !!input.axes &&
    Object.values(input.axes).some(
      (v) => typeof v === "string" && v.trim().length > 0
    );

  // 1) Minimum length — axis 제출이면 각 axis 가 form 단에서 이미 30자 이상 검증됨.
  if (!hasAxes && desc.length < 30) {
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

  // 3) Unique-character ratio — axis 제출은 스킵.
  // 2026-04: 새 폼의 concat description ("Market: ...\n\nProblem: ..." 형식) 은
  // 라벨이 반복되는 데다 한국어 답변이 유사한 표현을 쓸 때 ratio 가 자연스럽게
  // 낮아짐 → false positive 빈발. 각 axis 는 form 에서 min 30자로 이미 검증됐고
  // LLM 이 따로 걸러내므로 여기서 중복 체크 안 함. 옛 single-desc 폼에만 적용.
  if (!hasAxes) {
    const compact = desc.replace(/\s/g, "");
    if (compact.length >= 10) {
      const ratio = new Set(compact).size / compact.length;
      const minRatio = compact.length >= 200 ? 0.06 : compact.length >= 60 ? 0.15 : 0.25;
      if (ratio < minRatio) {
        hints.push("반복된 문자 비율이 너무 높습니다. 실제 아이디어 설명을 작성해주세요.");
      }
    }
  }

  // 4) Single word repeated heavily (e.g., "test test test test test").
  // axis 제출엔 threshold 살짝 완화 (axis 라벨 "Market/Problem/..." 자체가 반복어로 잡힘).
  const words = desc.toLowerCase().split(/\s+/).filter((w) => w.length >= 2);
  if (words.length >= 5) {
    const counts = new Map<string, number>();
    for (const w of words) counts.set(w, (counts.get(w) ?? 0) + 1);
    const maxCount = Math.max(...counts.values());
    const threshold = hasAxes ? 0.75 : 0.6;
    if (maxCount / words.length > threshold) {
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

// 2026-04: 동일 submissionId 에 대한 동시 분석 실행 방지 (in-memory).
// React strict mode 이중 mount 등으로 같은 submission 에 대해 두 번 SSE stream
// 이 시작되면 양쪽 모두 LLM 호출 전부 돌린 뒤 INSERT 에서 한쪽만 성공 → 비용 2배.
// 여기서 먼저 들어온 run 이 끝날 때까지 두 번째 run 은 대기시키고, 끝나면
// 이미 저장된 row 를 가져와서 즉시 complete 이벤트만 emit 하게 함.
const ACTIVE_ANALYSES = new Map<string, Promise<void>>();

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
      ? tavilySearch({
          query: buildAgentSearchQuery(agentId, input),
          maxResults: 5,
          excludeDomains: TAVILY_EXCLUDED_DOMAINS,
        }).then((r) => {
          tlog(`tavily done (${r?.results?.length ?? 0} results)`);
          return r ?? null;
        })
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
      // 이중 안전망: Tavily가 exclude_domains를 무시한 결과까지 host 단에서 한 번 더 필터.
      evidenceForLater = searchRes.results.filter((r) => !isBlockedUrl(r.url));
      allowedUrls = new Set(evidenceForLater.map((r) => r.url));
    }
    // Draft didn't see evidence → any citation in draft is hallucinated. Drop it;
    // Judge will build citations from the (now available) evidence.
    draft.citations = [];

    onPassDone?.(1, {
      score: typeof draft.score === "number" ? draft.score : undefined,
    });

    // Pass 2 — Calibrator (구 Skeptic). 낙관 과장 + 보수적 과소평가 양방향 보정.
    const calibratorSystemPrompt = await loadFile("prompts/agent_skeptic.md");
    const calibratorInput = {
      idea: input,
      evidence: evidenceForLater.map((r) => ({ url: r.url, title: r.title, content: r.content })),
      draft,
    };
    const calibratorResp = await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 1024,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: calibratorSystemPrompt },
        { role: "user", content: JSON.stringify(calibratorInput, null, 2) },
      ],
    });
    tlog("calibrator llm done");
    const calibrator = JSON.parse(calibratorResp.choices[0]?.message?.content ?? "{}") as Record<string, unknown>;
    onPassDone?.(2, {
      score: typeof calibrator.suggested_score === "number" ? calibrator.suggested_score : undefined,
    });

    // Pass 3 — Judge. Draft + Calibrator + evidence 종합해서 최종 확정.
    const judgeSystemPrompt = await loadFile("prompts/agent_judge.md");
    const judgeInput = {
      idea: input,
      evidence: evidenceForLater.map((r) => ({ url: r.url, title: r.title, content: r.content })),
      draft,
      calibrator,
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

// ── Analysis event stream ──────────────────────────────────────────────────────

type AnalysisEvent =
  | { event: "hard_gate_done"; pass: boolean; hints?: string[] }
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
  // Lock release is hoisted so finally can reach it regardless of where we register.
  // Initialize to no-op; real resolver gets assigned once lockPromise is created.
  let resolveOwnLock: () => void = () => {};
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
      // Log the real Supabase error — "Submission not found" alone masks schema
      // issues (missing columns etc.) which are the common failure mode.
      console.error("[analysis] idea fetch failed:", {
        submissionId,
        error: ideaErr,
        code: ideaErr?.code,
        message: ideaErr?.message,
        details: ideaErr?.details,
        hint: ideaErr?.hint,
      });
      yield {
        event: "failed",
        stage: "fetch",
        message: ideaErr?.message
          ? `DB error: ${ideaErr.message}${ideaErr.hint ? ` (${ideaErr.hint})` : ""}`
          : "Submission not found",
      };
      return;
    }

    if (existingRes.data) {
      yield { event: "failed", stage: "already_exists", message: "Analysis already exists" };
      return;
    }

    // 동일 submission 에 대한 동시 실행 대기 — 먼저 들어온 run 이 끝나면 저장된
    // row 를 읽어서 즉시 complete 처리. LLM 2중 호출 방지 (비용 절약).
    const activeSibling = ACTIVE_ANALYSES.get(submissionId);
    if (activeSibling) {
      tlog("sibling run active — waiting for it to finish");
      await activeSibling.catch(() => {});
      const { data: siblingResult } = await supabase
        .from("analysis_reports")
        .select(
          "id, viability_score, summary, analysis, cross_agent_insights, opportunities, risks, next_steps"
        )
        .eq("submission_id", submissionId)
        .maybeSingle();
      if (siblingResult) {
        tlog("returning sibling's result");
        yield {
          event: "complete",
          analysisId: siblingResult.id,
          viabilityScore: siblingResult.viability_score,
          report: siblingResult,
        };
        return;
      }
      // Sibling finished without writing (failed) → proceed with own run below.
    }

    // Register our run so other concurrent requests wait.
    // resolveOwnLock (hoisted) is called in finally to unblock waiters.
    const lockPromise = new Promise<void>((res) => {
      resolveOwnLock = res;
    });
    ACTIVE_ANALYSES.set(submissionId, lockPromise);

    // 1단: 하드 게이트 — axis_* 컬럼 넘겨서 새 폼 제출은 ratio 체크 스킵.
    const ideaWithAxes = idea as typeof idea & {
      axis_market?: string | null;
      axis_problem?: string | null;
      axis_timing?: string | null;
      axis_product?: string | null;
      axis_defensibility?: string | null;
      axis_business_model?: string | null;
    };
    const hard = runQualityGate({
      description: idea.description ?? "",
      target_user: idea.target_user ?? "",
      axes: {
        market: ideaWithAxes.axis_market,
        problem: ideaWithAxes.axis_problem,
        timing: ideaWithAxes.axis_timing,
        product: ideaWithAxes.axis_product,
        defensibility: ideaWithAxes.axis_defensibility,
        business_model: ideaWithAxes.axis_business_model,
      },
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
      // 2026-04: submission_id UNIQUE 제약 때문에 동시 실행 시 한쪽은 여기서 튕김.
      // 그 경우 다른 쪽이 이미 insert 했으므로 그 row 를 가져와서 complete 처리.
      // 양쪽 client 가 동일한 분석 결과 받음 (LLM 중복 호출은 있지만 UX 는 정상).
      const code = (insertErr as { code?: string }).code;
      const msg = insertErr.message?.toLowerCase() ?? "";
      const isDuplicate =
        code === "23505" || msg.includes("duplicate") || msg.includes("unique");

      if (isDuplicate) {
        tlog("duplicate insert — fetching existing row from sibling run");
        const { data: existing } = await supabase
          .from("analysis_reports")
          .select(
            "id, viability_score, summary, analysis, cross_agent_insights, opportunities, risks, next_steps"
          )
          .eq("submission_id", submissionId)
          .maybeSingle();

        if (existing) {
          yield {
            event: "complete",
            analysisId: existing.id,
            viabilityScore: existing.viability_score,
            report: existing,
          };
          return;
        }
      }

      console.error("[analysis] insert failed:", insertErr);
      yield { event: "failed", stage: "db", message: String(insertErr) };
      return;
    }

    tlog(`complete (total ${Date.now() - t0}ms)`);
    yield { event: "complete", analysisId, viabilityScore, report: revised };
  } catch (err) {
    console.error("runAnalysisStream", err);
    yield { event: "failed", stage: "unknown", message: String(err) };
  } finally {
    // Release the in-memory lock so waiting siblings can proceed and read the
    // saved row (or run themselves if this one failed before insert).
    ACTIVE_ANALYSES.delete(submissionId);
    resolveOwnLock();
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
    // Client aborts (React strict mode, navigation) close the downstream
    // consumer → the next controller.enqueue throws "Invalid state: Controller
    // is already closed". We detect that via `cancel()` callback + a flag, and
    // short-circuit the generator gracefully instead of logging as an error.
    let closed = false;
    const stream = new ReadableStream({
      async start(controller) {
        const safeEnqueue = (chunk: Uint8Array) => {
          if (closed) return;
          try {
            controller.enqueue(chunk);
          } catch {
            // Downstream already gone (abort/nav) — stop quietly.
            closed = true;
          }
        };

        // 즉시 첫 byte 를 보내서 프록시·브라우저의 stream 인식 트리거.
        // 일부 layer 는 첫 chunk 도착 전엔 buffering mode 로 동작.
        // SSE 주석 (`:` prefix) 은 이벤트로 파싱되지 않으므로 클라이언트 영향 없음.
        safeEnqueue(encoder.encode(": stream-open\n\n"));

        // 긴 LLM 호출 (15-30초) 중 이벤트 공백을 채우기 위해 주기적 ping.
        // Vercel/Cloudflare 같은 프록시가 idle 응답을 끊거나 buffer flush 안 하는
        // 케이스 대비. 클라이언트는 `:` 주석을 무시하므로 안전.
        const ping = setInterval(() => {
          safeEnqueue(encoder.encode(`: ping ${Date.now()}\n\n`));
        }, 5_000);

        try {
          for await (const evt of runAnalysisStream(submissionId!)) {
            if (closed) break;
            safeEnqueue(encoder.encode(sseEncode(evt)));
          }
        } catch (err) {
          if (!closed) {
            console.error("SSE stream error", err);
            safeEnqueue(
              encoder.encode(
                sseEncode({ event: "failed", stage: "unknown", message: String(err) })
              )
            );
          }
        } finally {
          clearInterval(ping);
          if (!closed) {
            try {
              controller.close();
            } catch {
              /* already closed */
            }
          }
        }
      },
      cancel() {
        closed = true;
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
