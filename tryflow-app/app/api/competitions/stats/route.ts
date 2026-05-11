// Sidebar 가 뱃지 표시용으로 호출하는 가벼운 stats 엔드포인트.
// 로그인 안 했거나 데이터 없으면 모두 0 반환 — 사이드바는 0 이면 뱃지 미표시.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const empty = NextResponse.json({ totalCompetitions: 0, pendingReviewItems: 0 });

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return empty;

    // 1) 본인이 운영하는 대회 개수.
    const { count: totalCompetitions } = await supabase
      .from("competitions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    // 2) 검토 권고가 1개라도 있는 제안서 수.
    //    score.axes[].needsReview === true 가 한 axis 라도 있으면 1건으로 카운트.
    //    jsonb 안의 array 를 직접 필터하기 어려우므로, 본인 대회의 모든 proposal
    //    score 만 가져와 메모리에서 집계. (대회 규모가 수십~수백 건 수준 가정)
    let pendingReviewItems = 0;
    if (totalCompetitions && totalCompetitions > 0) {
      const { data: competitions } = await supabase
        .from("competitions")
        .select("id")
        .eq("user_id", user.id);
      const compIds = (competitions ?? []).map((c) => c.id);
      if (compIds.length > 0) {
        const { data: proposals } = await supabase
          .from("proposals")
          .select("score")
          .in("competition_id", compIds);
        for (const p of proposals ?? []) {
          const s = p.score as { axes?: { needsReview?: boolean }[] } | null;
          if (s?.axes?.some((a) => a.needsReview)) pendingReviewItems += 1;
        }
      }
    }

    return NextResponse.json({
      totalCompetitions: totalCompetitions ?? 0,
      pendingReviewItems,
    });
  } catch (err) {
    console.error("GET /api/competitions/stats", err);
    return empty;
  }
}
