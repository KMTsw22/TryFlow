import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rowToProposal, type ProposalRow } from "@/lib/fastlane/db";

interface PatchPayload {
  title?: string;
  team?: string;
  summary?: string;
  /** 파일 원문 전체. 채점이 판단하는 텍스트. 보내면 갱신 + 재평가 판단 기준이 됨. */
  content?: string;
}

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

// 제안서 수정 — organizer 본인만.
// title/team/summary 중 변경된 필드를 받아 업데이트. content(summary) 가 실제로
// 바뀌면 평가 결과(score / report / axis_reports)를 비우고 evaluation_status 를
// pending 으로 리셋해 자동 재평가가 가능한 상태로 만든다. 검토 종료된 출품은 거부.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; pid: string }> }
) {
  try {
    const { id, pid } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // organizer 본인 확인 — 정책 (Q3=A).
    const { data: comp } = await supabase
      .from("competitions")
      .select("user_id")
      .eq("id", id)
      .single();
    if (!comp || (comp as { user_id: string }).user_id !== user.id) {
      return NextResponse.json(
        { error: "출품 수정은 대회 주최자만 가능합니다." },
        { status: 403 }
      );
    }

    // 현재 출품 상태 조회 — content 변경 여부 비교 + 검토 종료 여부 확인.
    const { data: current } = await supabase
      .from("proposals")
      .select("title, team, summary, content, review_closed_at")
      .eq("id", pid)
      .eq("competition_id", id)
      .single();
    if (!current) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const cur = current as {
      title: string;
      team: string;
      summary: string;
      content: string | null;
      review_closed_at: string | null;
    };
    if (cur.review_closed_at) {
      return NextResponse.json(
        { error: "검토 종료된 출품은 수정할 수 없습니다." },
        { status: 409 }
      );
    }

    const body = (await req.json()) as PatchPayload;
    const title =
      typeof body.title === "string" ? body.title.trim() : cur.title;
    const team = typeof body.team === "string" ? body.team.trim() : cur.team;
    const summary =
      typeof body.summary === "string" ? body.summary.trim() : cur.summary;
    const content =
      typeof body.content === "string" ? body.content.trim() : (cur.content ?? "");

    if (title.length === 0) {
      return NextResponse.json({ error: "제목은 비울 수 없습니다." }, { status: 400 });
    }
    if (summary.length < 30) {
      return NextResponse.json(
        { error: "요약은 최소 30자 이상이어야 합니다." },
        { status: 400 }
      );
    }

    // 채점이 실제로 보는 텍스트 = content(원문) 있으면 그것, 없으면 summary.
    // 그 "채점 대상 텍스트" 가 바뀔 때만 평가 결과를 무효화하고 재평가한다.
    // → 원문(파일)은 그대로인데 요약만 손본 경우엔 점수가 안 바뀌므로 재평가 안 함.
    const oldScored = ((cur.content ?? "").trim() || cur.summary).trim();
    const newScored = (content.trim() || summary).trim();
    const contentChanged = newScored !== oldScored;

    const updatePayload: Record<string, unknown> = {
      title,
      team,
      summary,
      updated_at: new Date().toISOString(),
    };
    // content 를 명시적으로 보냈을 때만 갱신(요약만 수정하는 모달은 건드리지 않음).
    if (typeof body.content === "string") {
      updatePayload.content = content;
    }
    if (contentChanged) {
      updatePayload.score = null;
      updatePayload.evaluation_status = "pending";
      updatePayload.evaluation_error = null;
      updatePayload.evaluation_report_md = null;
      updatePayload.axis_reports = null;
    }

    const { error: updErr } = await supabase
      .from("proposals")
      .update(updatePayload)
      .eq("id", pid)
      .eq("competition_id", id);
    if (updErr) {
      console.error("PATCH proposal update", updErr);
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }

    // 자동 재평가 트리거 — content 가 바뀌었으면 fire-and-forget 으로 evaluate 호출.
    // 응답을 기다리지 않아 PATCH 자체는 빠르게 반환. evaluate 가 evaluation_status
    // 를 running → done/failed 로 순차 업데이트.
    if (contentChanged) {
      const url = new URL(
        `/api/competitions/${id}/proposals/${pid}/evaluate`,
        req.url
      ).toString();
      // headers 로 cookie 를 넘겨야 auth 가 유지되지만, evaluate 는 admin client
      // 를 쓰므로 비인증 호출도 OK. 그래도 일관성을 위해 cookie 전달.
      const cookie = req.headers.get("cookie") ?? "";
      void fetch(url, {
        method: "POST",
        headers: cookie ? { cookie } : {},
      }).catch((err) => {
        console.error("PATCH → evaluate trigger failed", err);
      });
    }

    return NextResponse.json({ ok: true, reevaluating: contentChanged });
  } catch (err) {
    console.error("PATCH proposal", err);
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
