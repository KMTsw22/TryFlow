// GET  /api/competitions/[id]/proposals/[pid]/reviews — 이 출품의 심사위원 평가 목록
// POST /api/competitions/[id]/proposals/[pid]/reviews — 내 평가 제출/갱신 (upsert)
//
// RLS:
//   - 읽기: organizer + 배정된 judge.
//   - 쓰기: 본인 judge_id 만.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  rowToJudgeReview,
  type AxisReview,
  type ProposalReviewRow,
} from "@/lib/fastlane/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; pid: string }> }
) {
  try {
    const { pid } = await params;
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("proposal_reviews")
      .select("*")
      .eq("proposal_id", pid)
      .order("submitted_at", { ascending: false, nullsFirst: false });
    if (error) {
      console.error("GET reviews select", error);
      return NextResponse.json({ reviews: [] });
    }
    const reviews = (data ?? []).map((r) => rowToJudgeReview(r as ProposalReviewRow));
    return NextResponse.json({ reviews });
  } catch (err) {
    console.error("GET /api/.../reviews", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

interface ReviewPayload {
  judgeName?: string;
  affiliation?: string;
  axes?: AxisReview[];
  overallComment?: string;
  status?: "draft" | "submitted";
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; pid: string }> }
) {
  try {
    const { id, pid } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 본인이 이 대회에 배정된 judge 인지 확인 (없으면 RLS 가 막지만, 더 친절한 에러용).
    const { data: assignment } = await supabase
      .from("competition_judges")
      .select("judge_name, affiliation")
      .eq("competition_id", id)
      .eq("judge_id", user.id)
      .maybeSingle();
    if (!assignment) {
      return NextResponse.json(
        { error: "이 대회의 심사위원으로 배정되어 있지 않습니다." },
        { status: 403 }
      );
    }

    const body = (await req.json()) as ReviewPayload;
    const axes = Array.isArray(body.axes) ? body.axes : [];

    // axes 검증 — 0~100 점수 범위, criterionId 필수.
    const cleanAxes = axes
      .filter((a): a is AxisReview => !!a && typeof a.criterionId === "string")
      .map((a) => ({
        criterionId: a.criterionId,
        acceptedAiScore: !!a.acceptedAiScore,
        overrideScore:
          a.acceptedAiScore || a.overrideScore == null
            ? null
            : Math.max(0, Math.min(100, Number(a.overrideScore))),
        comment:
          typeof a.comment === "string" && a.comment.trim().length > 0
            ? a.comment.trim().slice(0, 1000)
            : null,
      }));

    const status = body.status === "draft" ? "draft" : "submitted";
    const a = assignment as { judge_name: string; affiliation: string | null };
    const overall =
      typeof body.overallComment === "string"
        ? body.overallComment.trim().slice(0, 5000)
        : null;

    const { data, error } = await supabase
      .from("proposal_reviews")
      .upsert(
        {
          proposal_id: pid,
          judge_id: user.id,
          judge_name: a.judge_name,
          affiliation: a.affiliation,
          axes: cleanAxes,
          overall_comment: overall,
          status,
          submitted_at: status === "submitted" ? new Date().toISOString() : null,
        },
        { onConflict: "proposal_id,judge_id" }
      )
      .select()
      .single();

    if (error) {
      console.error("POST reviews upsert", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ review: rowToJudgeReview(data as ProposalReviewRow) });
  } catch (err) {
    console.error("POST /api/.../reviews", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
