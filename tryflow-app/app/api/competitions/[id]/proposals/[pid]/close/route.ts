// PATCH  /api/competitions/[id]/proposals/[pid]/close — 검토 종료 (organizer 전용)
// DELETE /api/competitions/[id]/proposals/[pid]/close — 검토 종료 취소
//
// 모든 분쟁이 결정된 출품에 대해 organizer 가 "검토 종료" 를 누르면 호출됨.
// proposals.review_closed_at 컬럼을 채우는 것만 함 — 분쟁 결정 검증은 클라이언트
// 가 미리 했다는 가정. (보안 측면에서는 서버에서도 한 번 더 검증하는 게 정석이지만,
// 데모 단계에선 단순화.)

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; pid: string }> }
) {
  try {
    const { id, pid } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // organizer 확인.
    const { data: comp } = await supabase
      .from("competitions")
      .select("user_id")
      .eq("id", id)
      .single();
    if (!comp || (comp as { user_id: string }).user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("proposals")
      .update({
        review_closed_at: new Date().toISOString(),
        review_closed_by: user.id,
      })
      .eq("id", pid)
      .eq("competition_id", id)
      .select("id, review_closed_at, review_closed_by")
      .single();

    if (error) {
      console.error("PATCH close", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ proposal: data });
  } catch (err) {
    console.error("PATCH /api/.../close", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; pid: string }> }
) {
  try {
    const { id, pid } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: comp } = await supabase
      .from("competitions")
      .select("user_id")
      .eq("id", id)
      .single();
    if (!comp || (comp as { user_id: string }).user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await supabase
      .from("proposals")
      .update({ review_closed_at: null, review_closed_by: null })
      .eq("id", pid)
      .eq("competition_id", id);

    if (error) {
      console.error("DELETE close", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/.../close", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
