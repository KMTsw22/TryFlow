// POST /api/invitations/[token]/accept — 초대 수락
//
// 로그인된 user 가 token 으로 invitation 을 수락하면, RPC
// accept_competition_invitation 가 competition_judges 에 user 를 등록한다.
// 멱등 — 이미 judge 였어도 OK (was_already_judge 로 안내).
//
// body: { judgeName?, affiliation? } — 본인이 받는 사람 이름/소속 명시 가능.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface AcceptPayload {
  judgeName?: string;
  affiliation?: string;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "초대를 수락하려면 로그인해주세요." },
        { status: 401 }
      );
    }

    const body = (await req.json().catch(() => ({}))) as AcceptPayload;
    const judgeName =
      typeof body.judgeName === "string" ? body.judgeName.trim().slice(0, 100) : "";
    const affiliation =
      typeof body.affiliation === "string"
        ? body.affiliation.trim().slice(0, 200)
        : "";

    const { data, error } = await supabase.rpc("accept_competition_invitation", {
      p_token: token,
      p_judge_name: judgeName || null,
      p_affiliation: affiliation || null,
    });

    if (error) {
      // RPC 가 raise exception 한 메시지를 사용자 친화적으로 변환.
      const msg = String(error.message ?? "");
      if (msg.includes("INVITATION_NOT_FOUND")) {
        return NextResponse.json(
          { error: "유효하지 않은 초대 링크입니다." },
          { status: 404 }
        );
      }
      if (msg.includes("INVITATION_REVOKED")) {
        return NextResponse.json(
          { error: "이 초대 링크는 비활성화되었습니다." },
          { status: 410 }
        );
      }
      if (msg.includes("INVITATION_EXPIRED")) {
        return NextResponse.json(
          { error: "초대 링크가 만료되었습니다." },
          { status: 410 }
        );
      }
      if (msg.includes("INVITATION_LIMIT_REACHED")) {
        return NextResponse.json(
          { error: "초대 링크 사용 횟수가 한도에 도달했습니다." },
          { status: 410 }
        );
      }
      console.error("RPC accept_competition_invitation", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // RPC 가 jsonb 를 반환하도록 바꿔서 data 가 곧 object.
    // (옛 RETURNS TABLE 방식은 ambiguous column 에러를 계속 일으켰음.)
    const row = data as
      | { competition_id?: string; was_already_judge?: boolean }
      | null;
    const competitionId = row?.competition_id ?? null;
    const wasAlreadyJudge = !!row?.was_already_judge;

    return NextResponse.json({
      ok: true,
      competitionId,
      wasAlreadyJudge,
    });
  } catch (err) {
    console.error("POST /api/invitations/[token]/accept", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// 받은 사람이 페이지에서 미리 invitation 정보 조회. (메타데이터: 어느 대회인지 등)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("competition_invitations")
      .select(
        "token, competition_id, invited_by_name, role, expires_at, max_uses, used_count, revoked_at"
      )
      .eq("token", token)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ error: "초대 링크를 찾을 수 없습니다." }, { status: 404 });
    }

    // 유효성 — 만료/취소/한도.
    const row = data as {
      token: string;
      competition_id: string;
      invited_by_name: string;
      role: string;
      expires_at: string | null;
      max_uses: number | null;
      used_count: number;
      revoked_at: string | null;
    };
    let invalidReason: string | null = null;
    if (row.revoked_at) invalidReason = "초대 링크가 비활성화되었습니다.";
    else if (row.expires_at && new Date(row.expires_at) < new Date()) {
      invalidReason = "초대 링크가 만료되었습니다.";
    } else if (row.max_uses && row.used_count >= row.max_uses) {
      invalidReason = "사용 횟수가 한도에 도달했습니다.";
    }

    // 대회 이름 (UI 표시용) — RLS 가 누구나 select 허용한다는 가정 아래 단순 조회.
    const { data: compRow } = await supabase
      .from("competitions")
      .select("name, organizer")
      .eq("id", row.competition_id)
      .maybeSingle();

    return NextResponse.json({
      invitation: {
        token: row.token,
        competitionId: row.competition_id,
        competitionName: (compRow as { name?: string } | null)?.name ?? "대회",
        organizer:
          (compRow as { organizer?: string } | null)?.organizer ?? "",
        invitedByName: row.invited_by_name,
        role: row.role,
        invalidReason,
      },
    });
  } catch (err) {
    console.error("GET /api/invitations/[token]/accept", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
