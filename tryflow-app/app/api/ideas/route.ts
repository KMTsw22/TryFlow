import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";
import { readFile } from "fs/promises";
import path from "path";

export const CATEGORIES = [
  "SaaS / B2B",
  "Consumer App",
  "Marketplace",
  "Dev Tools",
  "Health & Wellness",
  "Education",
  "Fintech",
  "E-commerce",
  "Hardware",
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

  // Count ideas in this category last 30 days (saturation) — public only
  const { count: totalMonth } = await supabase
    .from("idea_submissions")
    .select("*", { count: "exact", head: true })
    .eq("category", category)
    .eq("is_private", false)
    .gte("created_at", d30.toISOString());

  // Trend: last 7 days vs prior 7 days — public only
  const { count: last7 } = await supabase
    .from("idea_submissions")
    .select("*", { count: "exact", head: true })
    .eq("category", category)
    .eq("is_private", false)
    .gte("created_at", d7.toISOString());

  const { count: prev7 } = await supabase
    .from("idea_submissions")
    .select("*", { count: "exact", head: true })
    .eq("category", category)
    .eq("is_private", false)
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

// ── AI Description ───────────────────────────────────────────────────────────

async function generateAiDescription(
  category: string,
  targetUser: string,
  description: string
): Promise<string | null> {
  if (!process.env.OPENAI_API_KEY) return null;

  try {
    const systemPrompt = await readFile(
      path.join(process.cwd(), "prompts/idea_summarizer.md"),
      "utf-8"
    );

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 80,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Category: ${category}\nTarget User: ${targetUser}\nDescription: ${description}`,
        },
      ],
    });

    return res.choices[0]?.message?.content?.trim() ?? null;
  } catch (err) {
    console.error("AI description failed:", err);
    return null;
  }
}

// ── Gibberish / spam gatekeeper ───────────────────────────────────────────────

/**
 * Fast heuristic check. Rejects obvious keyboard mashing without calling GPT.
 * Permissive — only flags text that's clearly not a real idea:
 *   - low ratio of unique characters (e.g. "asdfasdfasdf")
 *   - almost no whitespace (no word boundaries)
 *   - dominated by punctuation / symbol / jamo runs
 *
 * Returns true if the text passes the cheap heuristic (i.e. *might* be valid).
 * The real judgement happens in the GPT step.
 */
function passesHeuristic(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 30) return false;

  // At least 3 whitespace-separated tokens — real ideas have phrases.
  const tokens = trimmed.split(/\s+/).filter((t) => t.length > 0);
  if (tokens.length < 3) return false;

  // Character diversity — randomly mashed jamo has low diversity relative to length.
  const uniqueChars = new Set(trimmed.toLowerCase().replace(/\s/g, ""));
  const nonSpaceLen = trimmed.replace(/\s/g, "").length;
  const diversity = uniqueChars.size / Math.max(1, nonSpaceLen);
  if (nonSpaceLen >= 40 && diversity < 0.12) return false;

  // Reject if >30% of non-whitespace characters are punctuation/symbols.
  const symbolMatches = trimmed.match(/[!@#$%^&*()_+\-=[\]{};:'"\\|,.<>/?~`;ㅣㅡㅏㅓㅗㅜㅑㅕㅛㅠ]/g);
  const symbolRatio = (symbolMatches?.length ?? 0) / Math.max(1, nonSpaceLen);
  if (symbolRatio > 0.3) return false;

  return true;
}

/**
 * GPT-powered gatekeeper. Uses gpt-4o-mini (fast/cheap) to decide if the
 * submission is a good-faith startup idea vs. gibberish/spam/test text.
 *
 * Accepts: short ideas, broken English, non-English, rough sketches.
 * Rejects: random keyboard mashing, obvious jokes, test submissions like "asdf".
 *
 * On API error, returns { valid: true } — don't block legitimate users because
 * OpenAI is flaky.
 */
async function validateIdeaWithAI(
  category: string,
  targetUser: string,
  description: string
): Promise<{ valid: boolean; reason?: string }> {
  if (!process.env.OPENAI_API_KEY) return { valid: true };

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 120,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a gatekeeper for a startup idea submission platform.
Decide if the submission below is a GOOD-FAITH attempt to describe a product, service, or startup idea.

ACCEPT (valid=true):
- Ideas in any language, with typos, rough sketches, or incomplete thoughts
- Short but coherent descriptions
- Unusual or niche ideas
- Partial phrases if they convey intent

REJECT (valid=false):
- Random keyboard mashing (e.g. "asdfasdf", "ㅁㄴㅇㄹ", "qwerty123")
- Obvious jokes or troll submissions
- Test strings ("test", "hello", "lorem ipsum")
- Nonsense that no human could interpret as an idea
- Empty content padded with filler

When valid=false, provide a "reason" field with a short, friendly English sentence explaining what was wrong so the user can fix it.

Return ONLY strict JSON: {"valid": boolean, "reason"?: string}`,
        },
        {
          role: "user",
          content: `Category: ${category}\nTarget User: ${targetUser}\nDescription: ${description}`,
        },
      ],
    });

    const text = res.choices[0]?.message?.content?.trim() ?? "";
    const parsed = JSON.parse(text) as { valid?: boolean; reason?: string };
    if (typeof parsed.valid !== "boolean") return { valid: true };
    return { valid: parsed.valid, reason: parsed.reason };
  } catch (err) {
    console.error("[ideas] AI validation failed, allowing through:", err);
    return { valid: true };
  }
}

// ── POST /api/ideas ───────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { category, target_user, description, is_private, stage } = await req.json();

    if (!category || !target_user || !description) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    if (description.length < 30) {
      return NextResponse.json({ error: "Description too short (min 30 chars)" }, { status: 400 });
    }
    if (!CATEGORIES.includes(category as typeof CATEGORIES[number])) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    // 2-stage gatekeeper: cheap heuristic first, then GPT for borderline cases.
    if (!passesHeuristic(description)) {
      return NextResponse.json(
        {
          error:
            "This doesn't look like an idea description. Try a sentence or two in plain language describing what you're building.",
          code: "invalid_idea",
        },
        { status: 400 }
      );
    }

    const gate = await validateIdeaWithAI(category, target_user, description);
    if (!gate.valid) {
      return NextResponse.json(
        {
          error:
            gate.reason ??
            "We couldn't interpret this as a real idea. Try describing it in a clearer sentence.",
          code: "invalid_idea",
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // private 업로드는 Plus/Pro만 허용 (Free는 무조건 public)
    let allowPrivate = false;
    if (is_private && user) {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("plan")
        .eq("id", user.id)
        .maybeSingle();
      allowPrivate = profile?.plan === "plus" || profile?.plan === "pro";
    }

    // Insert submission
    const submissionId = crypto.randomUUID();
    const VALID_STAGES = ["idea", "prototype", "early_traction", "launched"];
    const { error: subErr } = await supabase.from("idea_submissions").insert({
      id: submissionId,
      user_id: user?.id ?? null,
      category,
      target_user,
      description,
      is_private: allowPrivate,
      stage: VALID_STAGES.includes(stage) ? stage : null,
    });
    if (subErr) throw subErr;

    // Generate insight + AI description in parallel
    const [insight, aiDescription] = await Promise.all([
      generateInsight(category, description, supabase),
      generateAiDescription(category, target_user, description),
    ]);

    // Insert report (map camelCase → snake_case for DB columns)
    const reportId = crypto.randomUUID();
    const { error: repErr } = await supabase.from("insight_reports").insert({
      id: reportId,
      submission_id: submissionId,
      viability_score: insight.viabilityScore,
      saturation_level: insight.saturationLevel,
      trend_direction: insight.trendDirection,
      similar_count: insight.similarCount,
      summary: insight.summary,
      ai_description: aiDescription,
    });
    if (repErr) throw repErr;

    // Fire-and-forget: kick off the 8-agent AI deep analysis in the background.
    // The client redirects to the detail page immediately and polls for completion.
    // We intentionally don't await so the submit flow stays snappy.
    const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "";
    if (origin) {
      fetch(`${origin}/api/analysis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId }),
      }).catch((err) => console.error("[ideas] background analysis trigger failed:", err));
    }

    return NextResponse.json({ submissionId, report: { ...insight, aiDescription } }, { status: 201 });
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
        id, category, target_user, description, created_at, user_id,
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