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
  const { data, error } = await supabase
    .from("comments")
    .insert({
      experiment_id: experimentId,
      author_name: authorName.trim(),
      content: content.trim(),
      parent_id: parentId ?? null,
    })
    .select("id, author_name, content, created_at, parent_id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ comment: data }, { status: 201 });
}
