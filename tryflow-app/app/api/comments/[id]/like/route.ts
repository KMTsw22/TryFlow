import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: commentId } = await params;
  const { voterId } = await request.json();

  if (!commentId || !voterId?.trim()) {
    return NextResponse.json({ error: "commentId and voterId required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("toggle_comment_like", {
    p_comment_id: commentId,
    p_voter_id: voterId.trim(),
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
