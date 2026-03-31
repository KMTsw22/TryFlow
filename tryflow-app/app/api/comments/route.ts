import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_REACTIONS = [
  "⚡ Easy to understand", "💡 Innovative idea", "🎯 Solves a real problem",
  "💰 Would pay for this", "🚀 Would use this", "🤔 Needs more clarity",
  "🔧 Needs improvement", "📊 Strong market fit", "🏆 Better than alternatives",
  "👥 Built for my needs",
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const experimentId = searchParams.get("experimentId");
  const voterId = searchParams.get("voterId") ?? "";

  if (!experimentId) {
    return NextResponse.json({ error: "experimentId required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comments")
    .select("id, author_name, content, created_at, parent_id, credit_awarded, reactions, likes_count")
    .eq("experiment_id", experimentId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Annotate which comments this voter has already liked
  let likedIds = new Set<string>();
  if (voterId && data && data.length > 0) {
    const { data: likes } = await supabase
      .from("comment_likes")
      .select("comment_id")
      .eq("voter_id", voterId)
      .in("comment_id", data.map((c: { id: string }) => c.id));
    likedIds = new Set((likes ?? []).map((l: { comment_id: string }) => l.comment_id));
  }

  const comments = (data ?? []).map((c: {
    id: string; author_name: string; content: string; created_at: string;
    parent_id: string | null; credit_awarded: number; reactions: string[];
    likes_count: number;
  }) => ({
    ...c,
    reactions: c.reactions ?? [],
    liked: likedIds.has(c.id),
  }));

  return NextResponse.json({ comments });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { experimentId, authorName, content, parentId, reactions } = body;

  if (!experimentId || !authorName?.trim() || !content?.trim()) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }

  if (content.trim().length > 500) {
    return NextResponse.json({ error: "Comment must be 500 characters or less." }, { status: 400 });
  }

  const validReactions = Array.isArray(reactions)
    ? reactions.filter((r: string) => ALLOWED_REACTIONS.includes(r)).slice(0, 3)
    : [];

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Calculate credit before insert so we can store it in the row
  const trimmedLength = content.trim().length;
  const creditAwarded = user && trimmedLength >= 200 ? 10 : 0;

  const { data, error } = await supabase
    .from("comments")
    .insert({
      experiment_id: experimentId,
      author_name:   authorName.trim(),
      content:       content.trim(),
      parent_id:     parentId ?? null,
      user_id:       user?.id ?? null,
      credit_awarded: creditAwarded,
      reactions:     validReactions,
    })
    .select("id, author_name, content, created_at, parent_id, credit_awarded, reactions, likes_count")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (creditAwarded > 0) {
    await supabase.rpc("add_credits", {
      p_user_id: user!.id,
      p_amount: creditAwarded,
    });
  }

  return NextResponse.json({ comment: { ...data, liked: false }, creditAwarded }, { status: 201 });
}
