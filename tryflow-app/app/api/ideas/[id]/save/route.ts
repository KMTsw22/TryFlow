import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Toggle save (heart) state for an idea.
 *
 * POST /api/ideas/[id]/save        → save (insert)
 * DELETE /api/ideas/[id]/save      → unsave (delete)
 *
 * RLS on `saved_ideas` enforces user_id = auth.uid() for both insert and delete,
 * so this route is mostly a thin auth-gated wrapper.
 */

export async function POST(
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

    // Confirm the idea exists and is visible to this user (RLS on idea_submissions
    // already filters private ideas to their owner). 404 on miss to avoid leaking
    // existence of private ideas.
    const { data: idea, error: fetchErr } = await supabase
      .from("idea_submissions")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (fetchErr || !idea) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Idempotent insert. ignoreDuplicates skips UPDATE on conflict — we don't have
    // an UPDATE RLS policy (intentional: there's nothing to update on a save row),
    // and the default upsert behavior would attempt UPDATE and trip on RLS.
    const { error: insErr } = await supabase
      .from("saved_ideas")
      .upsert(
        { user_id: user.id, submission_id: id },
        { onConflict: "user_id,submission_id", ignoreDuplicates: true }
      );

    if (insErr) {
      console.error("POST /api/ideas/[id]/save — supabase error:", insErr);
      // Surface the actual error to the client during development so the user can
      // see *why* it failed (missing table, RLS, trigger, etc.).
      return NextResponse.json(
        { error: "Failed to save", details: insErr.message, code: insErr.code },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, saved: true });
  } catch (err) {
    console.error("POST /api/ideas/[id]/save", err);
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

    const { error: delErr } = await supabase
      .from("saved_ideas")
      .delete()
      .eq("user_id", user.id)
      .eq("submission_id", id);

    if (delErr) {
      console.error("DELETE /api/ideas/[id]/save — supabase error:", delErr);
      return NextResponse.json(
        { error: "Failed to unsave", details: delErr.message, code: delErr.code },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, saved: false });
  } catch (err) {
    console.error("DELETE /api/ideas/[id]/save", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
