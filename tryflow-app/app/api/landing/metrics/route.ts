// GET /api/landing/metrics
//
// 랜딩 페이지 Live Metrics Strip 의 데이터 소스.
// reference 부족을 "실제 운영 신호" 로 보완하기 위해, 전체 플랫폼의
// 운영 현황을 실시간 카운트로 반환.
//
// service_role 로 RLS 우회 — 공개 카운트만 반환하므로 행 내용은 노출 안 됨.
// service_role 키가 없는 dev 환경에서는 0 fallback.
//
// 캐시: 60초 (Next.js fetch revalidate / route segment config).
// 빈번한 새로고침 비용 ↓, "실시간성" 은 분 단위면 충분.

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const revalidate = 60;

export interface LandingMetrics {
  activeCompetitions: number;     // 현재 운영 중 대회 수
  totalProposals: number;         // 누적 출품 수
  aiEvaluated: number;            // AI 1차 평가 완료된 출품 수
  judgesActive: number;           // 등록된 심사위원 수 (전체)
}

const EMPTY: LandingMetrics = {
  activeCompetitions: 0,
  totalProposals: 0,
  aiEvaluated: 0,
  judgesActive: 0,
};

export async function GET() {
  try {
    let admin;
    try {
      admin = createAdminClient();
    } catch {
      // service_role 키 없는 환경 (dev / preview) — 0 으로 반환.
      return NextResponse.json(EMPTY);
    }

    // 4-way 병렬 카운트. count: 'exact' + head: true 로 행을 받지 않고 숫자만.
    const [
      { count: activeCompetitions },
      { count: totalProposals },
      { count: aiEvaluated },
      { count: judgesActive },
    ] = await Promise.all([
      admin.from("competitions").select("*", { count: "exact", head: true }),
      admin.from("proposals").select("*", { count: "exact", head: true }),
      admin
        .from("proposals")
        .select("*", { count: "exact", head: true })
        .eq("evaluation_status", "done"),
      admin.from("competition_judges").select("*", { count: "exact", head: true }),
    ]);

    const body: LandingMetrics = {
      activeCompetitions: activeCompetitions ?? 0,
      totalProposals: totalProposals ?? 0,
      aiEvaluated: aiEvaluated ?? 0,
      judgesActive: judgesActive ?? 0,
    };
    return NextResponse.json(body);
  } catch (err) {
    console.error("GET /api/landing/metrics", err);
    return NextResponse.json(EMPTY);
  }
}
