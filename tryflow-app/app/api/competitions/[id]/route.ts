import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  rowToCompetition,
  rowToProposal,
  type CompetitionRow,
  type ProposalRow,
} from "@/lib/fastlane/db";

// 대회 상세 + 제안서 목록. 누구나 read 가능 (RLS).
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: comp, error: compErr } = await supabase
      .from("competitions")
      .select("*")
      .eq("id", id)
      .single();

    if (compErr || !comp) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { data: proposalRows } = await supabase
      .from("proposals")
      .select("*")
      .eq("competition_id", id)
      .order("created_at", { ascending: false });

    const proposals = (proposalRows ?? []).map((r: ProposalRow) => rowToProposal(r));
    const competition = rowToCompetition(comp as CompetitionRow, proposals);

    // 주최자 여부 — UI 에서 제어 노출 여부 판단용.
    const { data: { user } } = await supabase.auth.getUser();
    const isOwner = !!user && user.id === (comp as CompetitionRow).user_id;

    return NextResponse.json({ competition, isOwner });
  } catch (err) {
    console.error("GET /api/competitions/[id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// 대회 정보/평가표 수정. 주최자만.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: existing } = await supabase
      .from("competitions")
      .select("user_id")
      .eq("id", id)
      .single();
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (existing.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const update: Record<string, unknown> = {};
    if (typeof body.name === "string") update.name = body.name.trim();
    if (typeof body.organizer === "string") update.organizer = body.organizer.trim();
    if (typeof body.deadline === "string" && !isNaN(Date.parse(body.deadline))) {
      update.deadline = body.deadline;
    }
    if (typeof body.status === "string" && ["open", "closed", "archived"].includes(body.status)) {
      update.status = body.status;
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const { error } = await supabase.from("competitions").update(update).eq("id", id);
    if (error) {
      console.error("PATCH /api/competitions/[id]", error);
      return NextResponse.json({ error: "수정에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PATCH /api/competitions/[id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// 대회 삭제 — 제안서까지 cascade.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: existing } = await supabase
      .from("competitions")
      .select("user_id")
      .eq("id", id)
      .single();
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (existing.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: deleted, error } = await supabase
      .from("competitions")
      .delete()
      .eq("id", id)
      .select("id");
    if (error || !deleted || deleted.length === 0) {
      console.error("DELETE /api/competitions/[id]", error);
      return NextResponse.json({ error: "삭제에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/competitions/[id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
