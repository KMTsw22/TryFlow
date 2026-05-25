// POST /api/competitions/[id]/reset-review
//
// 데모/시연 용도: 이 대회를 "AI 1차 평가 완료" 상태로 되돌림.
//   - 모든 출품의 review_closed_at / review_closed_by 해제
//   - proposal_reviews 전체 삭제
//   - proposal_dispute_resolutions 전체 삭제
//
// 출품 자체와 AI score, rubric 은 보존. 인간이 만든 흔적만 제거.
// organizer 본인만 호출 가능. RLS 정책이 한 번 더 막아줌.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // organizer 본인 확인.
    const { data: comp } = await supabase
      .from("competitions")
      .select("user_id")
      .eq("id", id)
      .single();
    if (!comp || (comp as { user_id: string }).user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 이 대회의 proposal id 목록.
    const { data: propRows } = await supabase
      .from("proposals")
      .select("id")
      .eq("competition_id", id);
    const proposalIds = (propRows ?? []).map(
      (r) => (r as { id: string }).id
    );

    if (proposalIds.length > 0) {
      // 분쟁 결정 삭제.
      const { error: e1 } = await supabase
        .from("proposal_dispute_resolutions")
        .delete()
        .in("proposal_id", proposalIds);
      if (e1) {
        console.error("reset disputes", e1);
        return NextResponse.json({ error: e1.message }, { status: 500 });
      }

      // 심사위원 평가 삭제.
      const { error: e2 } = await supabase
        .from("proposal_reviews")
        .delete()
        .in("proposal_id", proposalIds);
      if (e2) {
        console.error("reset reviews", e2);
        return NextResponse.json({ error: e2.message }, { status: 500 });
      }
    }

    // 검토 종료 마킹 해제.
    const { error: e3 } = await supabase
      .from("proposals")
      .update({ review_closed_at: null, review_closed_by: null })
      .eq("competition_id", id);
    if (e3) {
      console.error("reset closed_at", e3);
      return NextResponse.json({ error: e3.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      proposalsCount: proposalIds.length,
    });
  } catch (err) {
    console.error("POST /api/.../reset-review", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
