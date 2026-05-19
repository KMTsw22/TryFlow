// GET /api/judge/assignments — 현재 로그인 사용자가 심사위원으로 배정된 대회 목록.
//
// 응답 구조: { competitions: Competition[] }
//   각 Competition 은 proposals + judges 가 nested 로 채워져 있어
//   /judge 페이지에서 추가 fetch 없이 카드 렌더링이 가능하다.
//
// RLS:
//   - competition_judges 의 'judge reads own assignments' 정책으로 본인 배정만 조회.
//   - 그 다음 in() 으로 competitions / proposals / 다른 judges 조회.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  rowToCompetition,
  rowToJudgeAssignment,
  rowToProposal,
  type CompetitionRow,
  type JudgeAssignmentRow,
  type ProposalRow,
} from "@/lib/fastlane/db";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ competitions: [] });

    // 1) 내가 배정된 row 들 → competition_id 추출
    const { data: myAssignments } = await supabase
      .from("competition_judges")
      .select("*")
      .eq("judge_id", user.id);

    const competitionIds = (myAssignments ?? []).map(
      (a: JudgeAssignmentRow) => a.competition_id
    );
    if (competitionIds.length === 0) {
      return NextResponse.json({ competitions: [] });
    }

    // 2) 배정된 대회들 + 3) 그 대회들의 proposals + 4) 모든 judges 병렬 조회.
    const [{ data: compRows }, { data: pRows }, { data: allJudges }] =
      await Promise.all([
        supabase
          .from("competitions")
          .select("*")
          .in("id", competitionIds)
          .order("created_at", { ascending: false }),
        supabase.from("proposals").select("*").in("competition_id", competitionIds),
        supabase
          .from("competition_judges")
          .select("*")
          .in("competition_id", competitionIds),
      ]);

    const proposalsByComp = new Map<string, ProposalRow[]>();
    for (const p of (pRows ?? []) as ProposalRow[]) {
      const arr = proposalsByComp.get(p.competition_id) ?? [];
      arr.push(p);
      proposalsByComp.set(p.competition_id, arr);
    }
    const judgesByComp = new Map<string, JudgeAssignmentRow[]>();
    for (const j of (allJudges ?? []) as JudgeAssignmentRow[]) {
      const arr = judgesByComp.get(j.competition_id) ?? [];
      arr.push(j);
      judgesByComp.set(j.competition_id, arr);
    }

    const competitions = ((compRows ?? []) as CompetitionRow[]).map((row) => {
      const proposals = (proposalsByComp.get(row.id) ?? []).map((r) => rowToProposal(r));
      const c = rowToCompetition(row, proposals);
      c.judges = (judgesByComp.get(row.id) ?? []).map(rowToJudgeAssignment);
      return c;
    });

    return NextResponse.json({ competitions });
  } catch (err) {
    console.error("GET /api/judge/assignments", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
