import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Try with analysis field; fall back without it if the column doesn't exist
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let data: any[] | null = null;
    let error: unknown = null;

    ({ data, error } = await supabase
      .from("idea_submissions")
      .select(`
        id, category, target_user, description, created_at,
        insight_reports (viability_score, saturation_level, trend_direction, similar_count, summary, analysis)
      `)
      .eq("is_private", false)
      .order("created_at", { ascending: false })
      .limit(200) as any);

    if (error) {
      ({ data, error } = await supabase
        .from("idea_submissions")
        .select(`
          id, category, target_user, description, created_at,
          insight_reports (viability_score, saturation_level, trend_direction, similar_count, summary)
        `)
        .eq("is_private", false)
        .order("created_at", { ascending: false })
        .limit(200) as any);
    }

    if (error) throw error;

    return NextResponse.json({ ideas: data ?? [] });
  } catch (err) {
    console.error("GET /api/ideas/all", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}