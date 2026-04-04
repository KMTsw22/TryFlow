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