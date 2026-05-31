import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rowToProposal, validateProposalPayload, type ProposalRow } from "@/lib/fastlane/db";

// 대회의 제안서 목록 — RLS 가 알아서 거름 (주최자/본인 제출 만 노출).
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("proposals")
      .select("*")
      .eq("competition_id", id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({
      proposals: (data ?? []).map((r: ProposalRow) => rowToProposal(r)),
    });
  } catch (err) {
    console.error("GET /api/competitions/[id]/proposals", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// 제안서 제출. 익명 허용 — 로그인 시 submitter_id 채움.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 대회 존재 + 마감 확인.
    const { data: comp, error: compErr } = await supabase
      .from("competitions")
      .select("id, deadline, status")
      .eq("id", id)
      .single();
    if (compErr || !comp) {
      return NextResponse.json({ error: "대회를 찾을 수 없습니다." }, { status: 404 });
    }
    if (comp.status !== "open") {
      return NextResponse.json({ error: "마감된 대회입니다." }, { status: 400 });
    }
    if (new Date(comp.deadline).getTime() < Date.now()) {
      return NextResponse.json({ error: "마감일이 지났습니다." }, { status: 400 });
    }

    const body = await req.json();
    const result = validateProposalPayload(body);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("proposals")
      .insert({
        competition_id: id,
        submitter_id: user?.id ?? null,
        title: result.payload.title,
        team: result.payload.team,
        summary: result.payload.summary,
        content: result.payload.content,
        evaluation_status: "pending",
      })
      .select("*")
      .single();

    if (error) {
      console.error("POST proposals insert", error);
      return NextResponse.json({ error: "제안서 제출에 실패했습니다." }, { status: 500 });
    }

    // deferEval=true 면 여기서 평가를 트리거하지 않는다. 일괄 제출이 모든 insert 후
    // /evaluate-pending 으로 동시성 제한을 두고 한 번에 처리하기 위함(fire-and-forget
    // 트리거 유실·떼거리 호출 문제 회피). 단건 제출은 기존대로 즉시 트리거.
    const deferEval = (body as { deferEval?: unknown })?.deferEval === true;

    // Fire-and-forget: AI 평가 트리거. 제출 후 사용자 응답을 막지 않음.
    const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "";
    if (origin && !deferEval) {
      const cookieHeader = req.headers.get("cookie") ?? "";
      fetch(`${origin}/api/competitions/${id}/proposals/${data.id}/evaluate`, {
        method: "POST",
        headers: { cookie: cookieHeader },
      }).catch((err) => console.error("[proposals] background evaluate trigger failed:", err));
    }

    return NextResponse.json({ proposal: rowToProposal(data as ProposalRow) }, { status: 201 });
  } catch (err) {
    console.error("POST /api/competitions/[id]/proposals", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
