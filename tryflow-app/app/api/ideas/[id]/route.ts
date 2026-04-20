import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("idea_submissions")
      .select(`
        id, category, target_user, description, created_at,
        insight_reports (id, viability_score, saturation_level, trend_direction, similar_count, summary, created_at)
      `)
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ idea: data });
  } catch (err) {
    console.error("GET /api/ideas/[id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Confirm ownership
    const { data: idea, error: fetchErr } = await supabase
      .from("idea_submissions")
      .select("id, user_id")
      .eq("id", id)
      .single();

    if (fetchErr || !idea) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (idea.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    // Whitelist — only a handful of fields are editable post-submission.
    const update: Record<string, unknown> = {};
    if (body.is_private !== undefined) update.is_private = !!body.is_private;

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const { error: updErr } = await supabase
      .from("idea_submissions")
      .update(update)
      .eq("id", id);

    if (updErr) {
      console.error("PATCH /api/ideas/[id]", updErr);
      return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PATCH /api/ideas/[id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Confirm the caller owns the idea before deleting.
    const { data: idea, error: fetchErr } = await supabase
      .from("idea_submissions")
      .select("id, user_id")
      .eq("id", id)
      .single();

    if (fetchErr || !idea) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (idea.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // .select() forces the query to return affected rows so we can detect
    // RLS-silent failures (no DELETE policy → 0 rows, no error).
    const { data: deleted, error: delErr } = await supabase
      .from("idea_submissions")
      .delete()
      .eq("id", id)
      .select("id");

    if (delErr) {
      console.error("DELETE /api/ideas/[id]", delErr);
      return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }
    if (!deleted || deleted.length === 0) {
      console.error("DELETE /api/ideas/[id] — 0 rows affected (likely missing RLS DELETE policy)");
      return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/ideas/[id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}