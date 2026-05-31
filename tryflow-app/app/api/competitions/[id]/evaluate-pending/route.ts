// POST /api/competitions/[id]/evaluate-pending
//
// 대회의 "아직 평가되지 않은" 출품을 서버에서 동시성 제한을 두고 안정적으로 처리.
//
// 기존 문제(2026-05):
//   제출 시 POST /proposals 가 평가를 fire-and-forget 으로 던지면서
//   (1) 트리거가 유실되어 일부 출품이 pending 에 영원히 멈추고
//   (2) N건이 동시에 시작되어 OpenAI 레이트리밋으로 일부가 실패했다.
//
// 이 엔드포인트는:
//   - score 가 없고 status 가 'failed' 가 아닌 출품 = 평가 대상으로 모은다.
//   - POOL 개씩만 await 하며 순차 처리(fire-and-forget 아님 → 유실 없음, 레이트리밋 회피).
//   - 처리 후 남은 미평가 개수(remaining)를 리턴 → 클라이언트가 다시 호출해 이어서
//     처리할 수 있다(maxDuration 타임아웃에도 안전, 재개 가능).
//
// 각 출품의 실제 채점은 기존 /proposals/[pid]/evaluate 를 그대로 재사용한다
// (admin client 라 비인증 self-call 도 동작).

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

// 동시에 평가할 출품 수. 한 출품당 축 병렬 호출이 있으므로(6축),
// 너무 키우면 OpenAI 레이트리밋에 걸린다. 3 이면 동시 ~18 호출 수준.
const POOL = 3;

interface TargetRow {
  id: string;
  evaluation_status: string;
  score: unknown;
}

function isPending(r: TargetRow): boolean {
  // 점수가 아직 없고, hard-gate 등으로 'failed' 처리된 것도 아닌 출품.
  return !r.score && r.evaluation_status !== "failed";
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let supabase;
  try {
    supabase = createAdminClient();
  } catch (err) {
    console.error("[evaluate-pending] admin client unavailable", err);
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY 가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  const { data: rows, error } = await supabase
    .from("proposals")
    .select("id, evaluation_status, score")
    .eq("competition_id", id);
  if (error) {
    console.error("[evaluate-pending] load proposals", error);
    return NextResponse.json({ error: "출품 목록을 불러오지 못했습니다." }, { status: 500 });
  }

  const targets = (rows ?? []).filter((r) => isPending(r as TargetRow)) as TargetRow[];
  if (targets.length === 0) {
    return NextResponse.json({ total: 0, done: 0, failed: 0, remaining: 0 });
  }

  // self-call origin — 들어온 요청의 Origin 헤더 우선, 없으면 env, 그래도 없으면 req URL.
  const origin =
    req.headers.get("origin") ??
    process.env.NEXT_PUBLIC_APP_URL ??
    new URL(req.url).origin;
  const cookie = req.headers.get("cookie") ?? "";

  let done = 0;
  let failed = 0;
  const queue = [...targets];

  // 동시성 풀 — POOL 개의 워커가 큐를 비울 때까지 한 건씩 await 처리.
  async function worker() {
    for (;;) {
      const t = queue.shift();
      if (!t) return;
      try {
        const res = await fetch(
          `${origin}/api/competitions/${id}/proposals/${t.id}/evaluate`,
          { method: "POST", headers: cookie ? { cookie } : {} }
        );
        if (res.ok) done += 1;
        else failed += 1;
      } catch (err) {
        console.error(`[evaluate-pending] evaluate ${t.id} failed`, err);
        failed += 1;
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(POOL, targets.length) }, () => worker())
  );

  // 처리 후 남은 미평가 개수 재확인(타임아웃 등으로 못 끝낸 것). >0 이면 재호출로 이어서 처리.
  const { data: after } = await supabase
    .from("proposals")
    .select("id, evaluation_status, score")
    .eq("competition_id", id);
  const remaining = (after ?? []).filter((r) => isPending(r as TargetRow)).length;

  return NextResponse.json({ total: targets.length, done, failed, remaining });
}
