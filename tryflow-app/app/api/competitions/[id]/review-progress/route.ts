// GET /api/competitions/[id]/review-progress
//
// Organizer 전용 진척 패널 데이터.
// 한 번에 다음을 종합해 반환:
//   1) 심사위원별 진행률 (submitted / draft / dispute 결정 / 마지막 활동)
//   2) 출품 × 심사위원 매트릭스 (셀 = submitted / draft / none)
//   3) 요약 통계
//
// 권한: 본인 대회의 organizer 만. 다른 사람은 403.
// (judge 도 진척을 보고 싶을 수 있지만 그건 별도 화면 필요 — 지금은 organizer 한정.)

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type {
  CompetitionRow,
  DisputeResolutionRow,
  JudgeAssignmentRow,
  ProposalReviewRow,
  ProposalRow,
} from "@/lib/fastlane/db";

interface JudgeProgress {
  id: string;
  judgeId: string;
  judgeName: string;
  affiliation: string | null;
  invitedAt: string;
  submittedCount: number;
  draftCount: number;
  disputeDecisionCount: number;
  lastActivityAt: string | null;
}

interface ProposalLite {
  id: string;
  title: string;
  team: string;
  reviewClosedAt: string | null;
}

type CellStatus = "submitted" | "draft" | "none";

interface ReviewProgressResponse {
  judges: JudgeProgress[];
  proposals: ProposalLite[];
  matrix: Record<string, Record<string, CellStatus>>;
  totals: {
    judgeCount: number;
    proposalCount: number;
    submittedReviews: number;
    possibleReviews: number;
    disputeDecisions: number;
    closedProposals: number;
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // organizer 본인인지 확인.
    const { data: comp } = await supabase
      .from("competitions")
      .select("user_id")
      .eq("id", id)
      .single();
    if (!comp || (comp as Pick<CompetitionRow, "user_id">).user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 4-way 병렬 조회. RLS 가 organizer 한테 모든 행 select 허용하므로 잘 동작.
    const [
      { data: judgeRows },
      { data: propRows },
      { data: reviewRows },
      { data: disputeRows },
    ] = await Promise.all([
      supabase
        .from("competition_judges")
        .select("*")
        .eq("competition_id", id)
        .order("invited_at", { ascending: true }),
      supabase
        .from("proposals")
        .select("id,title,team,review_closed_at,created_at")
        .eq("competition_id", id)
        .order("created_at", { ascending: false }),
      // proposal_reviews 는 proposal_id 컬럼만 있어서 competition 필터를 직접 못 검.
      // 대신 proposal_ids 목록으로 in() 필터 — 출품 0건일 때는 빈 in() 가 빈 결과 반환.
      // proposalIds 가 결정된 뒤 별도 쿼리하는 게 정상이지만, 한 번에 받기 위해
      // 일단 그 대회의 모든 reviews 가져오는 방법 = inner join 흉내. 단순화를 위해
      // proposalIds 알아낸 다음 in() 으로 두 번째 라운드 진행.
      // → 여기서는 두 번째 라운드를 위한 placeholder. 아래에서 다시 가져옴.
      Promise.resolve({ data: null as ProposalReviewRow[] | null }),
      Promise.resolve({ data: null as DisputeResolutionRow[] | null }),
    ]);

    const judges = (judgeRows ?? []) as JudgeAssignmentRow[];
    const proposals = ((propRows ?? []) as Array<
      Pick<ProposalRow, "id" | "title" | "team" | "review_closed_at" | "created_at">
    >).map<ProposalLite>((p) => ({
      id: p.id,
      title: p.title,
      team: p.team,
      reviewClosedAt: p.review_closed_at ?? null,
    }));

    // proposal id 가 결정된 뒤 reviews / disputes 한 번에.
    const proposalIds = proposals.map((p) => p.id);
    let reviews: ProposalReviewRow[] = [];
    let disputes: DisputeResolutionRow[] = [];
    if (proposalIds.length > 0) {
      const [{ data: rRows }, { data: dRows }] = await Promise.all([
        supabase
          .from("proposal_reviews")
          .select("*")
          .in("proposal_id", proposalIds),
        supabase
          .from("proposal_dispute_resolutions")
          .select("*")
          .in("proposal_id", proposalIds),
      ]);
      reviews = (rRows ?? []) as ProposalReviewRow[];
      disputes = (dRows ?? []) as DisputeResolutionRow[];
    }
    // 위에서 placeholder 로 두었으므로 reviewRows/disputeRows 변수는 무시.
    void reviewRows;
    void disputeRows;

    // judges 별 집계.
    const byJudge: Map<string, JudgeProgress> = new Map();
    for (const j of judges) {
      byJudge.set(j.judge_id, {
        id: j.id,
        judgeId: j.judge_id,
        judgeName: j.judge_name,
        affiliation: j.affiliation,
        invitedAt: j.invited_at,
        submittedCount: 0,
        draftCount: 0,
        disputeDecisionCount: 0,
        lastActivityAt: null,
      });
    }

    // matrix 초기화 — 모든 (proposal, judge) 셀을 "none" 으로.
    const matrix: Record<string, Record<string, CellStatus>> = {};
    for (const p of proposals) {
      matrix[p.id] = {};
      for (const j of judges) matrix[p.id][j.judge_id] = "none";
    }

    // reviews 반영.
    let submittedReviews = 0;
    for (const r of reviews) {
      const cell = matrix[r.proposal_id];
      if (!cell) continue; // proposal 이 다른 곳에 속함 (방어)
      const status: CellStatus = r.status === "submitted" ? "submitted" : "draft";
      cell[r.judge_id] = status;
      const jp = byJudge.get(r.judge_id);
      if (jp) {
        if (status === "submitted") {
          jp.submittedCount += 1;
          submittedReviews += 1;
        } else {
          jp.draftCount += 1;
        }
        // lastActivityAt = max(updated_at, submitted_at).
        const candidate = r.submitted_at ?? r.updated_at ?? r.created_at;
        if (candidate && (!jp.lastActivityAt || candidate > jp.lastActivityAt)) {
          jp.lastActivityAt = candidate;
        }
      }
    }

    // disputes 반영 — judge 가 결정한 분쟁 카운트.
    for (const d of disputes) {
      if (!d.decided_by) continue;
      const jp = byJudge.get(d.decided_by);
      if (!jp) continue;
      jp.disputeDecisionCount += 1;
      if (
        d.decided_at &&
        (!jp.lastActivityAt || d.decided_at > jp.lastActivityAt)
      ) {
        jp.lastActivityAt = d.decided_at;
      }
    }

    const closedProposals = proposals.filter((p) => !!p.reviewClosedAt).length;

    const body: ReviewProgressResponse = {
      judges: [...byJudge.values()],
      proposals,
      matrix,
      totals: {
        judgeCount: judges.length,
        proposalCount: proposals.length,
        submittedReviews,
        possibleReviews: judges.length * proposals.length,
        disputeDecisions: disputes.length,
        closedProposals,
      },
    };
    return NextResponse.json(body);
  } catch (err) {
    console.error("GET /api/competitions/[id]/review-progress", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
