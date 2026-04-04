import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const CATEGORIES = [
  "SaaS / B2B",
  "Consumer App",
  "Marketplace",
  "Dev Tools",
  "Health & Wellness",
  "Education",
  "Social / Community",
  "Fintech",
  "E-commerce",
  "AI / ML",
  "Hardware",
  "Other",
] as const;

// ── Insight generation (heuristic) ───────────────────────────────────────────

async function generateInsight(
  category: string,
  description: string,
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  const now = new Date();
  const d30 = new Date(now); d30.setDate(now.getDate() - 30);
  const d7  = new Date(now); d7.setDate(now.getDate() - 7);
  const d14 = new Date(now); d14.setDate(now.getDate() - 14);

  // Count ideas in this category last 30 days (saturation)
  const { count: totalMonth } = await supabase
    .from("idea_submissions")
    .select("*", { count: "exact", head: true })
    .eq("category", category)
    .gte("created_at", d30.toISOString());

  // Trend: last 7 days vs prior 7 days
  const { count: last7 } = await supabase
    .from("idea_submissions")
    .select("*", { count: "exact", head: true })
    .eq("category", category)
    .gte("created_at", d7.toISOString());

  const { count: prev7 } = await supabase
    .from("idea_submissions")
    .select("*", { count: "exact", head: true })
    .eq("category", category)
    .gte("created_at", d14.toISOString())
    .lt("created_at", d7.toISOString());

  const similarCount = totalMonth ?? 0;
  const recent = last7 ?? 0;
  const previous = prev7 ?? 0;

  // Saturation level
  let saturationLevel: "Low" | "Medium" | "High";
  let satMod: number;
  if (similarCount <= 4)       { saturationLevel = "Low";    satMod =  15; }
  else if (similarCount <= 12) { saturationLevel = "Medium"; satMod =   0; }
  else                         { saturationLevel = "High";   satMod = -10; }

  // Trend direction
  let trendDirection: "Rising" | "Stable" | "Declining";
  let trendMod: number;
  if (recent > (previous || 0) * 1.25 || (previous === 0 && recent >= 1)) {
    trendDirection = "Rising";   trendMod =  10;
  } else if (recent < (previous || 1) * 0.75) {
    trendDirection = "Declining"; trendMod = -5;
  } else {
    trendDirection = "Stable";   trendMod =   0;
  }

  // Viability score (base 55, capped 20–95)
  const descBonus = Math.min(10, Math.floor(description.length / 40));
  const viabilityScore = Math.max(20, Math.min(95, 55 + satMod + trendMod + descBonus));

  // Template summary
  const summaryMap: Record<string, string> = {
    "Rising_Low":      `High-signal opportunity. The ${category} space is gaining momentum with very few similar ideas submitted yet — you may be early to a genuine market gap.`,
    "Rising_Medium":   `The ${category} space is picking up speed with a healthy but not saturated volume of ideas. Good timing with room to differentiate.`,
    "Rising_High":     `${category} is trending heavily. Strong market interest exists, but you'll need a sharp differentiator to stand out from a crowded field.`,
    "Stable_Low":      `The ${category} space is underexplored. Low submission volume suggests a timing opportunity — early movers in stable markets often define the category.`,
    "Stable_Medium":   `A balanced opportunity in ${category}. The space is active but not saturated, giving you room to carve a focused niche.`,
    "Stable_High":     `${category} is well-covered territory. Success here will require a very specific angle, an underserved segment, or novel distribution.`,
    "Declining_Low":   `${category} activity is cooling, but low saturation keeps the door open. A patient builder could find whitespace here as the cycle resets.`,
    "Declining_Medium":`Interest in ${category} appears to be tapering. Consider whether your timing is right or if an adjacent angle has stronger momentum.`,
    "Declining_High":  `${category} is both declining in interest and heavily crowded. A major rethink of positioning or category pivot may be worth exploring.`,
  };

  const summary = summaryMap[`${trendDirection}_${saturationLevel}`]
    ?? `Your idea in ${category} shows promise. Continue refining your positioning and target user clarity.`;

  return { viabilityScore, saturationLevel, trendDirection, similarCount, summary };
}

// ── POST /api/ideas ───────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { category, target_user, description } = await req.json();

    if (!category || !target_user || !description) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    if (description.length < 30) {
      return NextResponse.json({ error: "Description too short (min 30 chars)" }, { status: 400 });
    }
    if (!CATEGORIES.includes(category as typeof CATEGORIES[number])) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Insert submission
    const submissionId = crypto.randomUUID();
    const { error: subErr } = await supabase.from("idea_submissions").insert({
      id: submissionId,
      user_id: user?.id ?? null,
      category,
      target_user,
      description,
    });
    if (subErr) throw subErr;

    // Generate insight
    const insight = await generateInsight(category, description, supabase);

    // Insert report
    const reportId = crypto.randomUUID();
    const { error: repErr } = await supabase.from("insight_reports").insert({
      id: reportId,
      submission_id: submissionId,
      ...insight,
    });
    if (repErr) throw repErr;

    return NextResponse.json({ submissionId, report: insight }, { status: 201 });
  } catch (err) {
    console.error("POST /api/ideas", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── GET /api/ideas — user's own submissions (auth required) ───────────────────

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("idea_submissions")
      .select(`
        id, category, target_user, description, created_at,
        insight_reports (viability_score, saturation_level, trend_direction, similar_count, summary)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ ideas: data ?? [] });
  } catch (err) {
    console.error("GET /api/ideas", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}