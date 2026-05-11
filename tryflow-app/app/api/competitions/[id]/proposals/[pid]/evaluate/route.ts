// Fastlane 제안서 AI 채점 — 4-Stage 파이프라인 (2026-05 v2).
//
// 기존 TryFlow ideas 의 3-pass 패턴을 Fastlane 동적 축에 이식.
//
// Stage 0 — Hard Quality Gate (no LLM)
//   summary 텍스트 코드 룰 검증. 길이/반복/심볼/단어 다양성. 불통과 시 즉시 fail.
//
// Stage 1 — Per-axis 3-Pass Scoring
//   각 축마다 병렬로 (선택적 Tavily 웹검색 →) Draft → Skeptic → Judge.
//   Draft: 낙관 초안, rubric 그대로 적용.
//   Skeptic: rubric Calibration Anchor 대비 양방향 보정.
//   Judge: base = draft × 0.4 + skeptic.suggested × 0.6, rubric anchor 로 검증 후 확정.
//   대회의 모든 축이 같은 패턴 → 같은 잣대.
//
// Stage 2 — Per-axis Deep Analysis (proposal_axis_analyzer.md)
//   Judge 결과 + 점수 분산 정보로 한국어 markdown 진단서 작성.
//
// Stage 3 — Synthesizer (proposal_synthesizer.md)
//   모든 축 분석을 통합 markdown 리포트로.

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { readFile } from "fs/promises";
import path from "path";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasTavilyKey, tavilySearch, type TavilyResult } from "@/lib/tavily";
import type { CompetitionRow, ProposalRow } from "@/lib/fastlane/db";
import { rowToCompetition, rowToProposal } from "@/lib/fastlane/db";
import type {
  AxisScore,
  Competition,
  Criterion,
  Proposal,
  ProposalScore,
} from "@/lib/fastlane/types";
import { STDDEV_REVIEW_THRESHOLD } from "@/lib/fastlane/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const SCORING_MODEL = "gpt-4o-mini";
const ANALYSIS_MODEL = "gpt-4o-mini";
const SYNTH_MODEL = "gpt-4o-mini";

type AxisReports = Record<string, { markdown: string; generatedAt: string }>;

// ── Stage 0: Hard Quality Gate ────────────────────────────────
//
// LLM 없이 코드 룰로 명백한 쓰레기 컷. 비용 0.
// 통과 시 { ok: true }, 실패 시 { ok: false, reason }.

interface HardGateResult {
  ok: boolean;
  reason?: string;
}

function hardQualityGate(proposal: Proposal): HardGateResult {
  const text = `${proposal.title}\n${proposal.summary}`.trim();

  if (text.length < 30) {
    return { ok: false, reason: "본문이 너무 짧습니다. (최소 30자)" };
  }

  // 단어(공백 분리) 3개 미만.
  const tokens = text.split(/\s+/).filter((t) => t.length > 0);
  if (tokens.length < 3) {
    return { ok: false, reason: "내용이 부족합니다. 3개 이상의 단어로 작성해주세요." };
  }

  // 문자 다양성 — 40~200자 범위에서 0.10 미만 = 키보드 mashing.
  // (영문은 알파벳 26자라 다양성 0.11-0.12가 자연스러움 → 너무 박하게 잡지 않음)
  const nonSpace = text.replace(/\s/g, "");
  const uniqueChars = new Set(nonSpace.toLowerCase());
  const diversity = uniqueChars.size / Math.max(1, nonSpace.length);
  if (nonSpace.length >= 40 && nonSpace.length < 200 && diversity < 0.1) {
    return { ok: false, reason: "문자 다양성이 매우 낮습니다. 의미 있는 문장으로 작성해주세요." };
  }

  // 심볼/구두점 비율 30% 초과 = 비정상.
  const symbols = text.match(/[!@#$%^&*()_+\-=[\]{};:'"\\|,.<>/?~`ㅣㅡㅏㅓㅗㅜㅑㅕㅛㅠ]/g);
  const symbolRatio = (symbols?.length ?? 0) / Math.max(1, nonSpace.length);
  if (symbolRatio > 0.3) {
    return { ok: false, reason: "특수문자 비율이 너무 높습니다." };
  }

  // 동일 단어 3번 이상 반복 (예: "test test test test").
  const wordCount = new Map<string, number>();
  for (const t of tokens) {
    const k = t.toLowerCase();
    wordCount.set(k, (wordCount.get(k) ?? 0) + 1);
  }
  const maxRepeat = Math.max(...Array.from(wordCount.values()));
  if (tokens.length >= 6 && maxRepeat / tokens.length > 0.5) {
    return { ok: false, reason: "동일 단어 반복이 너무 많습니다." };
  }

  return { ok: true };
}

// ── 메인 핸들러 ────────────────────────────────────────────────

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; pid: string }> }
) {
  const { id, pid } = await params;
  let supabase;
  try {
    supabase = createAdminClient();
  } catch (err) {
    console.error("[evaluate] admin client unavailable", err);
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY 가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  // 대회 + 제안서 로드.
  const { data: compRow, error: compErr } = await supabase
    .from("competitions")
    .select("*")
    .eq("id", id)
    .single();
  if (compErr || !compRow) {
    return NextResponse.json({ error: "대회를 찾을 수 없습니다." }, { status: 404 });
  }
  const competition = rowToCompetition(compRow as CompetitionRow);

  const { data: propRow, error: propErr } = await supabase
    .from("proposals")
    .select("*")
    .eq("id", pid)
    .eq("competition_id", id)
    .single();
  if (propErr || !propRow) {
    return NextResponse.json({ error: "제안서를 찾을 수 없습니다." }, { status: 404 });
  }
  const proposal = rowToProposal(propRow as ProposalRow);

  // ── Stage 0: Hard Gate ─────────────────────────────────────
  const gate = hardQualityGate(proposal);
  if (!gate.ok) {
    await supabase
      .from("proposals")
      .update({
        evaluation_status: "failed",
        evaluation_error: `[Hard Gate] ${gate.reason ?? "거부됨"}`,
      })
      .eq("id", pid);
    return NextResponse.json(
      { error: gate.reason, code: "hard_gate_failed" },
      { status: 400 }
    );
  }

  // 평가 시작 표시.
  await supabase
    .from("proposals")
    .update({ evaluation_status: "running", evaluation_error: null })
    .eq("id", pid);

  if (!process.env.OPENAI_API_KEY) {
    await supabase
      .from("proposals")
      .update({
        evaluation_status: "failed",
        evaluation_error: "OPENAI_API_KEY 가 설정되지 않았습니다.",
      })
      .eq("id", pid);
    return NextResponse.json(
      { error: "OPENAI_API_KEY 가 설정되지 않았습니다." },
      { status: 500 }
    );
  }
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    // 프롬프트 로드.
    const [skepticPrompt, judgePrompt, axisAnalyzerSystem, synthSystem] =
      await Promise.all([
        loadPrompt("agent_skeptic.md"),
        loadPrompt("agent_judge.md"),
        loadPrompt("proposal_axis_analyzer.md"),
        loadPrompt("proposal_synthesizer.md"),
      ]);

    // ── Stage 1: 항목별 3-Pass (Draft → Skeptic → Judge) ────
    const perAxisResults = await Promise.all(
      competition.template.criteria.map(async (c) => {
        const result = await scoreAxisThreePass(
          openai,
          competition,
          proposal,
          c,
          skepticPrompt,
          judgePrompt
        );
        return { criterion: c, result };
      })
    );

    // 항목별 통계 산출 — mean = judge.score, stddev = draft↔skeptic 분기점.
    const axes: AxisScore[] = perAxisResults.map(({ criterion, result }) => {
      if (!result) {
        return {
          criterionId: criterion.id,
          mean: 0,
          stddev: 0,
          needsReview: false,
          reasoning: "(채점 실패)",
        };
      }
      // 세 점수 [draft, skeptic.suggested, judge] 의 표준편차로 calibration 분산 측정.
      const scores = [result.draft.score, result.skeptic.suggested_score, result.judge.score];
      const mean = scores.reduce((s, x) => s + x, 0) / scores.length;
      const variance =
        scores.reduce((s, x) => s + (x - mean) ** 2, 0) / scores.length;
      const stddev = Math.sqrt(variance);
      return {
        criterionId: criterion.id,
        // 최종 점수는 Judge — mean 필드명은 schema 호환 위해 유지.
        mean: Math.round(result.judge.score * 10) / 10,
        stddev: Math.round(stddev * 10) / 10,
        needsReview: stddev > STDDEV_REVIEW_THRESHOLD,
        // Judge 의 한 줄 assessment 전체 — UI 가 자체적으로 표시·접기 제어.
        reasoning: result.judge.assessment ?? "",
      };
    });

    const composite = competition.template.criteria.reduce((sum, c) => {
      const axis = axes.find((a) => a.criterionId === c.id);
      return sum + (axis?.mean ?? 0) * c.weight;
    }, 0);

    const score: ProposalScore = {
      proposalId: pid,
      composite: Math.round(composite),
      runs: 3, // 3-pass per axis
      axes,
    };

    // 1차 저장 — Stage 2/3 실패해도 점수는 남음.
    await supabase.from("proposals").update({ score }).eq("id", pid);

    // ── Stage 2: 항목별 심층 분석 markdown ─────────────────
    const axisReports: AxisReports = {};
    const axisAnalyses = await Promise.all(
      perAxisResults.map(async ({ criterion, result }) => {
        const axis = axes.find((a) => a.criterionId === criterion.id);
        if (!axis || !result) return { criterion, markdown: "" };
        // 3-pass 결과를 "scoring_runs" 형태로 펴서 axis_analyzer 가 받아먹게.
        const runsForAnalyzer = [
          { score: result.draft.score, reasoning: result.draft.reasoning },
          {
            score: result.skeptic.suggested_score,
            reasoning: result.skeptic.calibration,
          },
          { score: result.judge.score, reasoning: result.judge.reasoning },
        ];
        const markdown = await runAxisAnalysis(
          openai,
          axisAnalyzerSystem,
          competition,
          proposal,
          criterion,
          runsForAnalyzer,
          axis
        );
        axisReports[criterion.id] = {
          markdown,
          generatedAt: new Date().toISOString(),
        };
        return { criterion, markdown };
      })
    );

    // ── Stage 3: Synthesizer ───────────────────────────────
    const reportMd = await runSynthesizer(
      openai,
      synthSystem,
      competition,
      proposal,
      score,
      axisAnalyses
    );

    const { error: updErr } = await supabase
      .from("proposals")
      .update({
        score,
        axis_reports: axisReports,
        evaluation_report_md: reportMd,
        evaluation_status: "done",
        evaluation_error: null,
      })
      .eq("id", pid);
    if (updErr) throw updErr;

    return NextResponse.json({ score, hasReport: !!reportMd });
  } catch (err) {
    console.error("[evaluate] failed", err);
    const message = err instanceof Error ? err.message : "평가 실패";
    await supabase
      .from("proposals")
      .update({
        evaluation_status: "failed",
        evaluation_error: message.slice(0, 500),
      })
      .eq("id", pid);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── Stage 1: 축당 3-Pass ──────────────────────────────────────

interface DraftResult {
  score: number;
  assessment: string;
  reasoning: string;
}

interface SkepticResult {
  calibration: string;
  overstated: string[];
  understated: string[];
  suggested_score: number;
  score_direction: "lower" | "higher" | "unchanged";
}

interface JudgeResult {
  score: number;
  assessment: string;
  reasoning: string;
  citations: { url: string; title: string; excerpt: string }[];
}

interface AxisThreePassResult {
  draft: DraftResult;
  skeptic: SkepticResult;
  judge: JudgeResult;
  evidence: TavilyResult[];
}

async function scoreAxisThreePass(
  openai: OpenAI,
  competition: Competition,
  proposal: Proposal,
  criterion: Criterion,
  skepticPrompt: string,
  judgePrompt: string
): Promise<AxisThreePassResult | null> {
  try {
    // 0) Tavily 웹 검색 (선택적, 키 없으면 빈 배열).
    const evidence = await fetchEvidence(competition, proposal, criterion);

    // 1) Draft — 낙관 초안.
    const draft = await runDraft(openai, competition, proposal, criterion, evidence);
    if (!draft) return null;

    // 2) Skeptic — 양방향 보정.
    const skeptic = await runSkeptic(
      openai,
      skepticPrompt,
      competition,
      proposal,
      criterion,
      evidence,
      draft
    );
    if (!skeptic) return null;

    // 3) Judge — 최종 결정.
    const judge = await runJudge(
      openai,
      judgePrompt,
      competition,
      proposal,
      criterion,
      evidence,
      draft,
      skeptic
    );
    if (!judge) return null;

    return { draft, skeptic, judge, evidence };
  } catch (err) {
    console.error(`[scoreAxisThreePass ${criterion.id}]`, err);
    return null;
  }
}

// ── Tavily evidence ───────────────────────────────────────────

async function fetchEvidence(
  competition: Competition,
  proposal: Proposal,
  criterion: Criterion
): Promise<TavilyResult[]> {
  if (!hasTavilyKey()) return [];
  try {
    // 도메인 + 축 이름 + 제안서 핵심 키워드로 검색 쿼리 구성.
    const desc = proposal.summary.slice(0, 200).replace(/\s+/g, " ").trim();
    const query = `${competition.theme} ${criterion.name} ${desc}`.slice(0, 380);
    const res = await tavilySearch({
      query,
      maxResults: 4,
      searchDepth: "basic",
      excludeDomains: ["linkedin.com", "facebook.com", "instagram.com", "x.com", "twitter.com"],
    });
    return res?.results ?? [];
  } catch (err) {
    console.warn(`[evidence ${criterion.id}]`, err);
    return [];
  }
}

// ── Pass 1: Draft ─────────────────────────────────────────────

async function runDraft(
  openai: OpenAI,
  competition: Competition,
  proposal: Proposal,
  criterion: Criterion,
  evidence: TavilyResult[]
): Promise<DraftResult | null> {
  // rubric 이 있으면 그걸 system prompt, 없으면 fallback.
  const rubric = criterion.rubricMd;
  const systemPrompt = rubric
    ? `${rubric}\n\n---\n\n# Draft (Pass 1/3) 채점 지시\n\n너는 이 축의 **엄격한 1차 평가자** 다. 위 rubric 의 Calibration Anchors 와 점수 가이드를 **글자 그대로** 적용한다.\n\n## 한국 평가 문화 — 채점 분포 기준\n\n실제 한국 공모전·경진대회의 점수 분포는 평균이 좌측 편향이다. 다음을 절대 기준으로:\n\n- **80-100**: 평가자가 명확한 우수성을 발견했을 때만. 안 보이면 주지 마라. 대회 상위 5-10%.\n- **65-79**: 진지하게 작성됐고 핵심 강점이 텍스트로 명백히 드러날 때.\n- **50-64**: 평균. 기본기는 있으나 차별점·근거가 부족.\n- **35-49**: 정보·근거 부족. 추측으로 채워야 평가 가능한 수준.\n- **0-34**: 평가 기준 충족 불가. 정보 거의 없음, 일반 진술뿐, 또는 축 정의에서 벗어남.\n\n## 보수적 채점 규칙\n\n- 출품작 텍스트에 **명시적 근거** 가 있는 부분만 점수로 인정. 추측·확장 해석으로 점수 올리지 마라.\n- "이 정도 주제면 좋을 듯" 같은 토픽 자체에 대한 호감으로 점수 올리지 마라. 채점 대상은 **실제 출품된 텍스트의 내용**.\n- 정보가 부족해 anchor 와 매칭이 어려운 경우 → **하위 구간 (35-50)** 으로. 추측으로 메우지 마라.\n- 같은 도메인의 우수 사례를 기준으로 봤을 때 미치지 못하면 65 이상 주지 마라.\n\n## 출력\n\n다음 JSON 만 출력. 다른 텍스트 절대 금지.\n\n{ "score": 0~100 정수, "assessment": "1-2 문장 요약", "reasoning": "3-5 문장 채점 사유 — 어느 anchor 와 매칭됐는지 명시" }`
    : fallbackDraftPrompt(criterion);

  const roleLine = `너는 **${competition.name || "이 대회"}** 의 **${criterion.name}** 축 Draft (Pass 1/3) 다.`;
  const userInput = {
    competition: { name: competition.name, theme: competition.theme },
    criterion: {
      id: criterion.id,
      name: criterion.name,
      weight: criterion.weight,
      description: criterion.description,
    },
    proposal: {
      title: proposal.title,
      team: proposal.team,
      summary: proposal.summary,
    },
    evidence: evidence.map((e) => ({
      url: e.url,
      title: e.title,
      content: e.content.slice(0, 400),
    })),
  };
  const userContent = `${roleLine}\n\n[입력]\n${JSON.stringify(userInput, null, 2)}`;

  try {
    const res = await openai.chat.completions.create({
      model: SCORING_MODEL,
      // Draft 는 약간 관대 — 0.6 으로 시각 다양성 허용.
      temperature: 0.6,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
    });
    const text = res.choices[0]?.message?.content?.trim() ?? "{}";
    const parsed = JSON.parse(text) as Partial<DraftResult>;
    if (typeof parsed.score !== "number") return null;
    return {
      score: Math.max(0, Math.min(100, parsed.score)),
      assessment: typeof parsed.assessment === "string" ? parsed.assessment : "",
      reasoning: typeof parsed.reasoning === "string" ? parsed.reasoning : "",
    };
  } catch (err) {
    console.error(`[Draft ${criterion.id}]`, err);
    return null;
  }
}

function fallbackDraftPrompt(criterion: Criterion): string {
  return `당신은 한 평가 축의 **엄격한** 1차 평가자입니다.

평가 항목: ${criterion.name}
채점 기준: ${criterion.description || "(설명 없음)"}

한국 평가 문화 기준:
- 80-100: 명확한 우수성. 안 보이면 주지 마라.
- 50-64: 평균. 기본기 있으나 차별점 부족.
- 0-34: 정보·근거 부족. 평가 기준 미충족.

출품작 텍스트에 명시된 근거만 점수로 인정. 추측 금지. 정보 부족하면 35 이하.

출력은 다음 JSON 만:
{ "score": 0~100 정수, "assessment": "1-2 문장", "reasoning": "3-5 문장 사유" }`;
}

// ── Pass 2: Skeptic ───────────────────────────────────────────

async function runSkeptic(
  openai: OpenAI,
  skepticPrompt: string,
  competition: Competition,
  proposal: Proposal,
  criterion: Criterion,
  evidence: TavilyResult[],
  draft: DraftResult
): Promise<SkepticResult | null> {
  // rubric 을 system prompt 끝에 첨부 — Skeptic 이 Calibration Anchors 를 볼 수 있어야 함.
  const fullSystem = criterion.rubricMd
    ? `${skepticPrompt}\n\n---\n\n# 첨부: 이 축의 채점 rubric\n\n${criterion.rubricMd}`
    : skepticPrompt;

  const roleLine = `너는 **${competition.name || "이 대회"}** 의 **${criterion.name}** 축 Skeptic (Pass 2/3) 다.`;
  const userInput = {
    competition: { name: competition.name, theme: competition.theme },
    criterion: {
      id: criterion.id,
      name: criterion.name,
      weight: criterion.weight,
      description: criterion.description,
    },
    proposal: {
      title: proposal.title,
      team: proposal.team,
      summary: proposal.summary,
    },
    evidence: evidence.map((e) => ({
      url: e.url,
      title: e.title,
      content: e.content.slice(0, 400),
    })),
    draft,
  };
  const userContent = `${roleLine}\n\n[입력]\n${JSON.stringify(userInput, null, 2)}`;

  try {
    const res = await openai.chat.completions.create({
      model: SCORING_MODEL,
      // Skeptic 은 결정성 강조 — 같은 입력에 일관된 보정.
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: fullSystem },
        { role: "user", content: userContent },
      ],
    });
    const text = res.choices[0]?.message?.content?.trim() ?? "{}";
    const parsed = JSON.parse(text) as Partial<SkepticResult>;
    const suggested = typeof parsed.suggested_score === "number" ? parsed.suggested_score : null;
    if (suggested === null) return null;
    return {
      calibration: typeof parsed.calibration === "string" ? parsed.calibration : "",
      overstated: Array.isArray(parsed.overstated)
        ? (parsed.overstated as string[]).filter((s) => typeof s === "string")
        : [],
      understated: Array.isArray(parsed.understated)
        ? (parsed.understated as string[]).filter((s) => typeof s === "string")
        : [],
      suggested_score: Math.max(0, Math.min(100, suggested)),
      score_direction:
        parsed.score_direction === "lower" ||
        parsed.score_direction === "higher" ||
        parsed.score_direction === "unchanged"
          ? parsed.score_direction
          : "unchanged",
    };
  } catch (err) {
    console.error(`[Skeptic ${criterion.id}]`, err);
    return null;
  }
}

// ── Pass 3: Judge ─────────────────────────────────────────────

async function runJudge(
  openai: OpenAI,
  judgePrompt: string,
  competition: Competition,
  proposal: Proposal,
  criterion: Criterion,
  evidence: TavilyResult[],
  draft: DraftResult,
  skeptic: SkepticResult
): Promise<JudgeResult | null> {
  const fullSystem = criterion.rubricMd
    ? `${judgePrompt}\n\n---\n\n# 첨부: 이 축의 채점 rubric\n\n${criterion.rubricMd}`
    : judgePrompt;

  const roleLine = `너는 **${competition.name || "이 대회"}** 의 **${criterion.name}** 축 Judge (Pass 3/3) 다.`;
  const userInput = {
    competition: { name: competition.name, theme: competition.theme },
    criterion: {
      id: criterion.id,
      name: criterion.name,
      weight: criterion.weight,
      description: criterion.description,
    },
    proposal: {
      title: proposal.title,
      team: proposal.team,
      summary: proposal.summary,
    },
    evidence: evidence.map((e) => ({
      url: e.url,
      title: e.title,
      content: e.content.slice(0, 400),
    })),
    draft,
    skeptic,
  };
  const userContent = `${roleLine}\n\n[입력]\n${JSON.stringify(userInput, null, 2)}`;

  try {
    const res = await openai.chat.completions.create({
      model: SCORING_MODEL,
      // Judge 는 가장 결정적 — 결과 재현성 우선.
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: fullSystem },
        { role: "user", content: userContent },
      ],
    });
    const text = res.choices[0]?.message?.content?.trim() ?? "{}";
    const parsed = JSON.parse(text) as Partial<JudgeResult>;
    if (typeof parsed.score !== "number") return null;
    // citations URL 화이트리스트 검증 — evidence 에 있는 URL 만 허용.
    const evidenceUrls = new Set(evidence.map((e) => e.url));
    const citations = Array.isArray(parsed.citations)
      ? (parsed.citations as { url?: string; title?: string; excerpt?: string }[])
          .filter((c) => typeof c?.url === "string" && evidenceUrls.has(c.url))
          .map((c) => ({
            url: c.url!,
            title: typeof c.title === "string" ? c.title : "",
            excerpt: typeof c.excerpt === "string" ? c.excerpt : "",
          }))
      : [];
    return {
      score: Math.max(0, Math.min(100, parsed.score)),
      assessment: typeof parsed.assessment === "string" ? parsed.assessment : "",
      reasoning: typeof parsed.reasoning === "string" ? parsed.reasoning : "",
      citations,
    };
  } catch (err) {
    console.error(`[Judge ${criterion.id}]`, err);
    return null;
  }
}

// ── Stage 2: 항목별 심층 분석 ─────────────────────────────────

async function runAxisAnalysis(
  openai: OpenAI,
  systemPrompt: string,
  competition: Competition,
  proposal: Proposal,
  criterion: Criterion,
  scoringRuns: { score: number; reasoning: string }[],
  axis: AxisScore
): Promise<string> {
  const userInput = {
    competition: {
      name: competition.name,
      organizer: competition.organizer,
      theme: competition.theme,
      criterion: {
        id: criterion.id,
        name: criterion.name,
        weight: criterion.weight,
        description: criterion.description,
        rubric_summary: (criterion.rubricMd ?? "").slice(0, 1500),
      },
    },
    proposal: {
      title: proposal.title,
      team: proposal.team,
      summary: proposal.summary,
    },
    scoring_runs: scoringRuns,
    axis_stats: {
      mean: axis.mean,
      stddev: axis.stddev,
      needs_review: axis.needsReview,
    },
  };

  try {
    const res = await openai.chat.completions.create({
      model: ANALYSIS_MODEL,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify(userInput) },
      ],
    });
    const text = res.choices[0]?.message?.content?.trim() ?? "{}";
    const parsed = JSON.parse(text) as { markdown?: unknown };
    return typeof parsed.markdown === "string" ? parsed.markdown : "";
  } catch (err) {
    console.error("[runAxisAnalysis]", err);
    return "";
  }
}

// ── Stage 3: Synthesizer ──────────────────────────────────────

async function runSynthesizer(
  openai: OpenAI,
  systemPrompt: string,
  competition: Competition,
  proposal: Proposal,
  score: ProposalScore,
  axisAnalyses: { criterion: Criterion; markdown: string }[]
): Promise<string> {
  const axesPayload = competition.template.criteria.map((c) => {
    const axis = score.axes.find((a) => a.criterionId === c.id);
    const analysis = axisAnalyses.find((a) => a.criterion.id === c.id);
    return {
      criterion_id: c.id,
      criterion_name: c.name,
      weight: c.weight,
      mean: axis?.mean ?? 0,
      stddev: axis?.stddev ?? 0,
      needs_review: !!axis?.needsReview,
      axis_markdown: analysis?.markdown ?? "",
    };
  });

  const userInput = {
    competition: {
      name: competition.name,
      organizer: competition.organizer,
      theme: competition.theme,
      template_name: competition.template.name,
    },
    proposal: {
      title: proposal.title,
      team: proposal.team,
      summary: proposal.summary,
    },
    score: {
      composite: score.composite,
      runs: score.runs,
      axes: axesPayload,
    },
  };

  try {
    const res = await openai.chat.completions.create({
      model: SYNTH_MODEL,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify(userInput) },
      ],
    });
    const text = res.choices[0]?.message?.content?.trim() ?? "{}";
    const parsed = JSON.parse(text) as { report_md?: unknown };
    return typeof parsed.report_md === "string" ? parsed.report_md : "";
  } catch (err) {
    console.error("[runSynthesizer]", err);
    return "";
  }
}

// ── 프롬프트 로딩 ─────────────────────────────────────────────

async function loadPrompt(relativePath: string): Promise<string> {
  return readFile(
    path.join(process.cwd(), "prompts_competition", relativePath),
    "utf-8"
  );
}
