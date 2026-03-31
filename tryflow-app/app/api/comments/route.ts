import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const experimentId = searchParams.get("experimentId");

  if (!experimentId) {
    return NextResponse.json({ error: "experimentId required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comments")
    .select("id, author_name, content, created_at, parent_id")
    .eq("experiment_id", experimentId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ comments: data ?? [] });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { experimentId, authorName, content, parentId } = body;

  if (!experimentId || !authorName?.trim() || !content?.trim()) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }

  if (content.trim().length > 500) {
    return NextResponse.json({ error: "Comment must be 500 characters or less." }, { status: 400 });
  }

  const supabase = await createClient();

  // 로그인 유저 확인 (크레딧 지급을 위해)
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("comments")
    .insert({
      experiment_id: experimentId,
      author_name: authorName.trim(),
      content: content.trim(),
      parent_id: parentId ?? null,
      user_id: user?.id ?? null,
    })
    .select("id, author_name, content, created_at, parent_id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 로그인 유저 + 최소 200자 이상 댓글 → +10 크레딧 지급
  const trimmedLength = content.trim().length;
  const creditAwarded = user && trimmedLength >= 200 ? 10 : 0;

  if (creditAwarded > 0) {
    await supabase.rpc("add_credits", {
      p_user_id: user!.id,
      p_amount: creditAwarded,
    });
  }

  return NextResponse.json({ comment: data, creditAwarded }, { status: 201 });
}
