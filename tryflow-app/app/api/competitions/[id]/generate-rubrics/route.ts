// 대회 생성 직후 호출되는 rubric 자동 생성 라우트.
//
// 각 평가 항목 (criterion) 마다 1번씩 OpenAI 를 호출해 도메인 특화된
// 평가 rubric (markdown) 을 생성하고, competitions.template.criteria[i].rubricMd
// 에 저장한다. 모든 항목이 생성되면 rubric_status = 'ready'.
//
// 한 항목이라도 실패하면 전체 status = 'failed' (개별 항목은 빈 채로 둠 — 나중에
// 같은 라우트를 다시 호출하면 다시 생성 시도).

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { readFile } from "fs/promises";
import path from "path";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  rowToCompetition,
  type CompetitionRow,
} from "@/lib/fastlane/db";
import type { Criterion } from "@/lib/fastlane/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const RUBRIC_MODEL = "gpt-4o-mini";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let supabase;
  try {
    supabase = createAdminClient();
  } catch (err) {
    console.error("[generate-rubrics] admin client unavailable", err);
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY 가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  const { data: row, error: rowErr } = await supabase
    .from("competitions")
    .select("*")
    .eq("id", id)
    .single();
  if (rowErr || !row) {
    return NextResponse.json({ error: "대회를 찾을 수 없습니다." }, { status: 404 });
  }
  const competition = rowToCompetition(row as CompetitionRow);

  if (!process.env.OPENAI_API_KEY) {
    await supabase
      .from("competitions")
      .update({
        rubric_status: "failed",
        rubric_error: "OPENAI_API_KEY 가 설정되지 않았습니다.",
      })
      .eq("id", id);
    return NextResponse.json(
      { error: "OPENAI_API_KEY 가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  // 진행 중 표시.
  await supabase
    .from("competitions")
    .update({ rubric_status: "generating", rubric_error: null })
    .eq("id", id);

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const systemPrompt = await readFile(
      path.join(process.cwd(), "fastlane/prompts/shared/rubric_generator.md"),
      "utf-8"
    );

    // 항목별 병렬 생성. 한 항목 실패 시 그 항목만 빈 결과 — UI 가 표시 + 재시도 가능.
    //
    // 2026-05-14: competitionType 이 있는 대회는 먼저 정적 rubric 파일을 시도한다.
    //   - fastlane/prompts/{competitionType}/{criterion.id}.md 존재 시 그 내용을 그대로 사용
    //   - 없으면 AI rubric_generator 로 fallback
    // 게임 9축 + 금융 9기준처럼 미리 작성된 도메인 prompt 가 있는 경우 OpenAI 호출
    // 비용·지연 0 + 일관성 보장.
    const competitionType = competition.template.competitionType;
    const generated = await Promise.all(
      competition.template.criteria.map(async (c) => {
        try {
          const staticRubric = await tryLoadStaticRubric(competitionType, c.id);
          if (staticRubric) {
            return { criterion: c, rubric: staticRubric, source: "static" as const };
          }
          const rubric = await generateRubric(
            openai,
            systemPrompt,
            competition.name,
            competition.theme,
            competitionType,
            c
          );
          return { criterion: c, rubric, source: "ai" as const };
        } catch (err) {
          console.error(`[generate-rubrics] axis ${c.id} failed`, err);
          return { criterion: c, rubric: "", source: "failed" as const };
        }
      })
    );

    // template 에 rubricMd 채워서 다시 저장.
    const newCriteria = competition.template.criteria.map((c) => {
      const found = generated.find((g) => g.criterion.id === c.id);
      return {
        ...c,
        rubricMd: found?.rubric || c.rubricMd || undefined,
      };
    });

    const newTemplate = {
      ...competition.template,
      criteria: newCriteria,
    };

    const successCount = generated.filter((g) => g.rubric.length > 0).length;
    const totalCount = generated.length;
    const allOk = successCount === totalCount && totalCount > 0;

    const { error: updErr } = await supabase
      .from("competitions")
      .update({
        template: newTemplate,
        rubric_status: allOk ? "ready" : "failed",
        rubric_error: allOk
          ? null
          : `${totalCount - successCount}/${totalCount} 항목의 rubric 생성에 실패했습니다.`,
      })
      .eq("id", id);
    if (updErr) throw updErr;

    const staticCount = generated.filter((g) => g.source === "static").length;
    const aiCount = generated.filter((g) => g.source === "ai").length;

    return NextResponse.json({
      ok: allOk,
      generated: successCount,
      total: totalCount,
      sources: { static: staticCount, ai: aiCount, failed: totalCount - successCount },
    });
  } catch (err) {
    console.error("[generate-rubrics] failed", err);
    const message = err instanceof Error ? err.message : "rubric 생성 실패";
    await supabase
      .from("competitions")
      .update({
        rubric_status: "failed",
        rubric_error: message.slice(0, 500),
      })
      .eq("id", id);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── 정적 rubric 로딩 ───────────────────────────────────────
//
// competitionType 이 지정된 대회는 fastlane/prompts/{type}/{criterionId}.md 를
// 먼저 확인한다. 미리 작성된 도메인 prompt 가 있으면 OpenAI 호출 없이 그대로 사용.
//
// 현재 지원:
//   - game: fastlane/prompts/game/{fun,game_design,...}.md
//   - finance: fastlane/prompts/finance/{A1_problem_validity,...}.md
//   - literature: fastlane/prompts/literature/{01_structure_narrative,...}.md
//
// 파일이 없으면 null 반환 → 호출자가 AI fallback 결정.
//
// 보안: criterionId 가 사용자 입력에서 유래하므로 path traversal 차단.
// '/', '\\', '..' 포함된 id 는 거부. 단편소설 항목명이 한글이므로 Unicode letter 허용.

async function tryLoadStaticRubric(
  competitionType: string | undefined,
  criterionId: string
): Promise<string | null> {
  if (!competitionType) return null;
  // path traversal 방어 — Unicode letter/number + '_' + '-' 만 허용
  // (criterion id 예: 01_structure_narrative, A1_problem_validity, fun 모두 통과.
  //  Unicode letter 허용은 향후 비ASCII id 대비 — 현재 빌트인 id는 모두 ASCII).
  // 경로 구분자(/, \) 와 점(.) 명시적 배제.
  if (!/^[\p{L}\p{N}_\-]+$/u.test(criterionId)) return null;
  if (criterionId.includes("..") || criterionId.includes("/") || criterionId.includes("\\")) return null;
  if (!/^[a-z]+$/.test(competitionType)) return null;

  const filePath = path.join(
    process.cwd(),
    "fastlane/prompts",
    competitionType,
    `${criterionId}.md`
  );
  try {
    const content = await readFile(filePath, "utf-8");
    return content.trim().length > 0 ? content : null;
  } catch {
    // ENOENT 등 — 정적 파일 없음. AI fallback 이 처리.
    return null;
  }
}

// ── 단일 항목 rubric 생성 ───────────────────────────────────

async function generateRubric(
  openai: OpenAI,
  systemPrompt: string,
  competitionName: string,
  theme: string,
  competitionType: string | undefined,
  criterion: Criterion
): Promise<string> {
  // user 메시지는 두 부분으로 구성:
  //   1) 역할(role) 한 줄 — LLM 에게 "너는 이 대회의 이 축 담당 평가 agent" 정체성 부여.
  //      이후 출품작 채점 단계에서도 이 rubric 이 system prompt 로 그대로 쓰이기 때문에,
  //      rubric 을 작성하는 자아 = 채점하는 자아 임을 명시해 일관성 강화.
  //   2) JSON payload — competition.name/theme/competitionType + criterion 정의.
  //      competitionType 은 rubric_generator.md 의 도메인 모드 분기 (game/finance/literature/일반)
  //      에 직접 영향. 없으면 일반 모드로 빠져 theme 어휘를 그대로 받는다.
  const roleLine =
    `너는 **${competitionName || "이 대회"}** 의 **${criterion.name}** 축을 전담하는 평가 agent 다. ` +
    `지금 너의 임무는 이 축에 대해 **너 자신이 이후 출품작을 채점할 때 사용할** ` +
    `채점 매뉴얼(rubric) 을 한국어 markdown 으로 작성하는 것이다.`;

  const userInput = {
    competition: {
      name: competitionName,
      theme: theme || "",
      competitionType: competitionType ?? null,
    },
    criterion: {
      id: criterion.id,
      name: criterion.name,
      weight: criterion.weight,
      description: criterion.description,
    },
  };

  const userContent = `${roleLine}\n\n[입력]\n${JSON.stringify(userInput, null, 2)}`;

  const res = await openai.chat.completions.create({
    model: RUBRIC_MODEL,
    // rubric 작성은 결정성 + 일관성이 중요. 너무 낮으면 같은 입력에 동일한 결과만,
    // 너무 높으면 anchor 가 산만. 0.3 으로 적당히 고정.
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
  });

  const text = res.choices[0]?.message?.content?.trim() ?? "{}";
  const parsed = JSON.parse(text) as { rubric_md?: unknown };
  return typeof parsed.rubric_md === "string" ? parsed.rubric_md : "";
}
