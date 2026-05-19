// POST /api/competitions/[id]/proposals/[pid]/disputes — 분쟁 axis 결정 (upsert)
// DELETE /api/competitions/[id]/proposals/[pid]/disputes?criterion=xxx — 결정 취소
//
// RLS 가 organizer 만 쓰기 허용. POST body 에서 action / final_score / reason 검증.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  rowToDisputeResolution,
  type DisputeResolutionRow,
} from "@/lib/fastlane/db";
import type { DisputeAction } from "@/lib/fastlane/types";

const VALID_ACTIONS = new Set<DisputeAction>([
  "accept_ai",
  "accept_human_avg",
  "manual_override",
  "request_rereview",
]);

interface DisputePayload {
  criterionId?: string;
  action?: DisputeAction;
  finalScore?: number | null;
  reason?: string;
  // 결정자 표시 이름 (server 가 user_profiles 에서 가져오는 게 정석이지만,
  // 단순화를 위해 클라이언트가 같이 보냄. 없으면 email 의 local-part 로 fallback.)
  decidedByName?: string;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; pid: string }> }
) {
  try {
    const { pid } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await req.json()) as DisputePayload;
    const criterionId =
      typeof body.criterionId === "string" ? body.criterionId.trim() : "";
    if (!criterionId) {
      return NextResponse.json(
        { error: "criterionId 가 필요합니다." },
        { status: 400 }
      );
    }
    if (!body.action || !VALID_ACTIONS.has(body.action)) {
      return NextResponse.json({ error: "잘못된 action." }, { status: 400 });
    }
    // request_rereview 가 아니면 finalScore 필수.
    let finalScore: number | null = null;
    if (body.action !== "request_rereview") {
      const n = Number(body.finalScore);
      if (!Number.isFinite(n) || n < 0 || n > 100) {
        return NextResponse.json(
          { error: "finalScore 는 0~100 사이여야 합니다." },
          { status: 400 }
        );
      }
      finalScore = n;
    }

    // 결정자 이름 — body 우선, 없으면 email 에서 추출.
    const decidedByName =
      (typeof body.decidedByName === "string" && body.decidedByName.trim()) ||
      user.email?.split("@")[0] ||
      "심사위원";

    const reason =
      typeof body.reason === "string" && body.reason.trim().length > 0
        ? body.reason.trim().slice(0, 2000)
        : null;

    const { data, error } = await supabase
      .from("proposal_dispute_resolutions")
      .upsert(
        {
          proposal_id: pid,
          criterion_id: criterionId,
          action: body.action,
          final_score: finalScore,
          decided_by: user.id,
          decided_by_name: decidedByName,
          decided_at: new Date().toISOString(),
          reason,
        },
        { onConflict: "proposal_id,criterion_id" }
      )
      .select()
      .single();

    if (error) {
      console.error("POST disputes upsert", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      resolution: rowToDisputeResolution(data as DisputeResolutionRow),
    });
  } catch (err) {
    console.error("POST /api/.../disputes", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; pid: string }> }
) {
  try {
    const { pid } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const criterion = new URL(req.url).searchParams.get("criterion");
    if (!criterion) {
      return NextResponse.json(
        { error: "criterion 쿼리 파라미터가 필요합니다." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("proposal_dispute_resolutions")
      .delete()
      .eq("proposal_id", pid)
      .eq("criterion_id", criterion);

    if (error) {
      console.error("DELETE disputes", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/.../disputes", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
