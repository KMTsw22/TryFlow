import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rowToProposal, type ProposalRow } from "@/lib/fastlane/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; pid: string }> }
) {
  try {
    const { id, pid } = await params;
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("proposals")
      .select("*")
      .eq("competition_id", id)
      .eq("id", pid)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ proposal: rowToProposal(data as ProposalRow) });
  } catch (err) {
    console.error("GET proposal", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// 제안서 삭제 — 주최자 또는 제출자 본인.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; pid: string }> }
) {
  try {
    const { id, pid } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // RLS 가 정책 적용 — 권한 없으면 0 rows.
    const { data: deleted, error } = await supabase
      .from("proposals")
      .delete()
      .eq("competition_id", id)
      .eq("id", pid)
      .select("id");

    if (error || !deleted || deleted.length === 0) {
      return NextResponse.json({ error: "삭제에 실패했습니다." }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE proposal", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
