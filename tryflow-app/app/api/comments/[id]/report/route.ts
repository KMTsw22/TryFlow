import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: commentId } = await params;
  const { reporterId } = await request.json();

  if (!commentId || !reporterId?.trim()) {
    return NextResponse.json({ error: "commentId and reporterId required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("report_comment", {
    p_comment_id: commentId,
    p_reporter_id: reporterId.trim(),
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
