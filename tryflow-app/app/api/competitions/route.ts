import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  rowToCompetition,
  validateCompetitionPayload,
  type CompetitionRow,
} from "@/lib/fastlane/db";

// 내 대회 목록 — 로그인한 사용자가 소유한 대회만.
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("competitions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // 각 대회의 제안서 수 + 평가 결과 합쳐서 반환 (리스트 화면에서 사용).
    const competitionIds = (data ?? []).map((c) => c.id);
    const proposalsByComp = new Map<string, { count: number; evaluated: number; reviewItems: number }>();
    for (const id of competitionIds) {
      proposalsByComp.set(id, { count: 0, evaluated: 0, reviewItems: 0 });
    }

    if (competitionIds.length > 0) {
      const { data: proposals } = await supabase
        .from("proposals")
        .select("competition_id, score")
        .in("competition_id", competitionIds);
      for (const p of proposals ?? []) {
        const stats = proposalsByComp.get(p.competition_id);
        if (!stats) continue;
        stats.count += 1;
        const score = p.score as { axes?: { needsReview?: boolean }[] } | null;
        if (score?.axes) {
          stats.evaluated += 1;
          stats.reviewItems += score.axes.filter((a) => a.needsReview).length;
        }
      }
    }

    const competitions = (data ?? []).map((row: CompetitionRow) => {
      const stats = proposalsByComp.get(row.id) ?? { count: 0, evaluated: 0, reviewItems: 0 };
      return {
        ...rowToCompetition(row),
        proposalCount: stats.count,
        evaluatedCount: stats.evaluated,
        reviewItemCount: stats.reviewItems,
      };
    });

    return NextResponse.json({ competitions });
  } catch (err) {
    console.error("GET /api/competitions", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// 새 대회 생성.
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = validateCompetitionPayload(body);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const { name, organizer, theme, deadline, template } = result.payload;
    const { data, error } = await supabase
      .from("competitions")
      .insert({
        user_id: user.id,
        name,
        organizer,
        theme,
        deadline,
        template,
        status: "open",
        rubric_status: "pending",
      })
      .select("*")
      .single();

    if (error) {
      console.error("POST /api/competitions insert", error);
      return NextResponse.json({ error: "대회 생성에 실패했습니다." }, { status: 500 });
    }

    // Fire-and-forget: 백그라운드로 평가 항목별 rubric 생성 트리거.
    // 클라이언트는 즉시 detail 페이지로 이동, status 폴링으로 완료 감지.
    const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "";
    if (origin) {
      fetch(`${origin}/api/competitions/${data.id}/generate-rubrics`, {
        method: "POST",
      }).catch((err) =>
        console.error("[competitions] background rubric trigger failed:", err)
      );
    }

    return NextResponse.json({ competition: rowToCompetition(data) }, { status: 201 });
  } catch (err) {
    console.error("POST /api/competitions", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
