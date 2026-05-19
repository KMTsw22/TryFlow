// GET   /api/competitions/[id]/judges — 이 대회에 배정된 심사위원 목록
// POST  /api/competitions/[id]/judges — 새 심사위원 배정 (organizer 전용)
//
// RLS 가 권한을 막아주지만, POST 는 user_id 매칭 흐름이 필요하므로
// 라우트 안에서 입력 검증을 한 번 더 한다.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  rowToJudgeAssignment,
  type JudgeAssignmentRow,
} from "@/lib/fastlane/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("competition_judges")
      .select("*")
      .eq("competition_id", id)
      .order("invited_at", { ascending: true });
    if (error) {
      console.error("GET judges select", error);
      return NextResponse.json({ judges: [] });
    }
    const judges = (data ?? []).map((r) => rowToJudgeAssignment(r as JudgeAssignmentRow));
    return NextResponse.json({ judges });
  } catch (err) {
    console.error("GET /api/competitions/[id]/judges", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

interface JudgePayload {
  judgeId?: string;     // auth.users.id (현재 같은 워크스페이스 사용자만 가능)
  judgeName?: string;   // 표시용
  affiliation?: string;
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

    // organizer 본인인지 확인.
    const { data: comp } = await supabase
      .from("competitions")
      .select("user_id")
      .eq("id", id)
      .single();
    if (!comp || (comp as { user_id: string }).user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await req.json()) as JudgePayload;
    const judgeId = typeof body.judgeId === "string" ? body.judgeId.trim() : "";
    const judgeName = typeof body.judgeName === "string" ? body.judgeName.trim() : "";
    const affiliation =
      typeof body.affiliation === "string" ? body.affiliation.trim() : null;

    if (!judgeId) return NextResponse.json({ error: "judgeId 가 필요합니다." }, { status: 400 });
    if (!judgeName) {
      return NextResponse.json({ error: "judgeName 이 필요합니다." }, { status: 400 });
    }

    // upsert 로 중복 방지 — (competition_id, judge_id) unique 제약.
    const { data, error } = await supabase
      .from("competition_judges")
      .upsert(
        {
          competition_id: id,
          judge_id: judgeId,
          judge_name: judgeName,
          affiliation,
          scope: "all",
        },
        { onConflict: "competition_id,judge_id" }
      )
      .select()
      .single();

    if (error) {
      console.error("POST judges upsert", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      judge: rowToJudgeAssignment(data as JudgeAssignmentRow),
    });
  } catch (err) {
    console.error("POST /api/competitions/[id]/judges", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
