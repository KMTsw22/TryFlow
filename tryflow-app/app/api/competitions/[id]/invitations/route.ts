// POST   /api/competitions/[id]/invitations — 새 초대 링크 생성 (organizer 만)
// GET    /api/competitions/[id]/invitations — 이 대회의 invitation 목록
// DELETE /api/competitions/[id]/invitations?token=xxx — 비활성화
//
// 슬랙 스타일 초대 링크. POST 결과로 받은 token 을 /invite/[token] URL 에
// 끼워서 공유한다. revoke 는 row 를 지우는 게 아니라 revoked_at 만 채움 — 감사
// 추적용.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rowToInvitation, type InvitationRow } from "@/lib/fastlane/db";

interface CreateInvitationPayload {
  expiresAt?: string | null; // ISO. null/undefined 면 영구.
  maxUses?: number | null;   // null/undefined 면 무제한.
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // organizer 본인 확인 — RLS 의 select 정책이 'using true' 라 누구나
    // 읽을 수 있게 열려 있어도, API 라우트가 명시적으로 organizer 만 list 응답.
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ invitations: [] });

    const { data: comp } = await supabase
      .from("competitions")
      .select("user_id")
      .eq("id", id)
      .single();
    if (!comp || (comp as { user_id: string }).user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("competition_invitations")
      .select("*")
      .eq("competition_id", id)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("GET invitations select", error);
      return NextResponse.json({ invitations: [] });
    }

    return NextResponse.json({
      invitations: (data ?? []).map((r) => rowToInvitation(r as InvitationRow)),
    });
  } catch (err) {
    console.error("GET /api/competitions/[id]/invitations", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // organizer 검증.
    const { data: comp } = await supabase
      .from("competitions")
      .select("user_id, name")
      .eq("id", id)
      .single();
    if (!comp || (comp as { user_id: string }).user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // body 가 없어도 동작. expires/maxUses 둘 다 옵셔널.
    const body = (await req.json().catch(() => ({}))) as CreateInvitationPayload;

    const expiresAt =
      typeof body.expiresAt === "string" && body.expiresAt.length > 0
        ? body.expiresAt
        : null;
    const maxUses =
      typeof body.maxUses === "number" && body.maxUses > 0
        ? Math.min(Math.floor(body.maxUses), 1000)
        : null;

    // 발급자 표시 이름 — email 로컬-파트로 fallback. (실 운영에선 profiles 연동.)
    const invitedByName = user.email?.split("@")[0] ?? "주최자";

    const { data, error } = await supabase
      .from("competition_invitations")
      .insert({
        competition_id: id,
        invited_by: user.id,
        invited_by_name: invitedByName,
        role: "judge",
        expires_at: expiresAt,
        max_uses: maxUses,
      })
      .select()
      .single();

    if (error) {
      console.error("POST invitations insert", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      invitation: rowToInvitation(data as InvitationRow),
    });
  } catch (err) {
    console.error("POST /api/competitions/[id]/invitations", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// 비활성화 — row 삭제가 아니라 revoked_at 만 채움.
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = new URL(req.url).searchParams.get("token");
    if (!token) {
      return NextResponse.json({ error: "token 파라미터가 필요합니다." }, { status: 400 });
    }

    // organizer 검증.
    const { data: comp } = await supabase
      .from("competitions")
      .select("user_id")
      .eq("id", id)
      .single();
    if (!comp || (comp as { user_id: string }).user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await supabase
      .from("competition_invitations")
      .update({ revoked_at: new Date().toISOString() })
      .eq("token", token)
      .eq("competition_id", id);
    if (error) {
      console.error("DELETE invitations revoke", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/competitions/[id]/invitations", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
