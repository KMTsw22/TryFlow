import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const AGENT_IDS = [
  "market_size",
  "competition",
  "timing",
  "monetization",
  "technical_difficulty",
  "regulation",
  "defensibility",
  "user_acquisition",
] as const;

type AgentId = (typeof AGENT_IDS)[number];

// Category → prompt folder mapping
const CATEGORY_FOLDER: Record<string, string> = {
  "SaaS / B2B": "saas",
  "Consumer App": "consumer",
  "Marketplace": "marketplace",
  "Dev Tools": "devtools",
  "Health & Wellness": "health",
  "Education": "education",
  "Fintech": "fintech",
  "E-commerce": "ecommerce",
  "Hardware": "hardware",
  // Social / Community, AI / ML, Other → fallback to saas base
};

async function loadFile(filePath: string): Promise<string> {
  return readFile(path.join(process.cwd(), filePath), "utf-8");
}

/**
 * Load agent prompt: SaaS base (has JSON output format) + category-specific domain knowledge.
 * SaaS category uses its own agents directly.
 * Other categories combine SaaS base format + category domain knowledge.
 */
async function loadAgentPrompt(agentId: AgentId, category: string): Promise<string> {
  const folder = CATEGORY_FOLDER[category];
  const saasBase = await loadFile(`prompts/saas/agents/${agentId}.md`);

  // SaaS or unknown category → use SaaS prompt directly
  if (!folder || folder === "saas") return saasBase;

  // Check if category-specific prompt exists
  const categoryPath = path.join(process.cwd(), "prompts", folder, "agents", `${agentId}.md`);
  if (!existsSync(categoryPath)) return saasBase;

  const categoryPrompt = await loadFile(`prompts/${folder}/agents/${agentId}.md`);

  // Combine: category domain knowledge + SaaS base (for output format)
  return `${categoryPrompt}

---

# Output Format & Scoring Rules

Use the same JSON output format and scoring calibration rules below.
If the category-specific guidance above conflicts with the generic rules below, prefer the category-specific guidance for domain knowledge but ALWAYS use the JSON output format.

${saasBase.substring(saasBase.indexOf("## Output Format"))}`;
}

function buildUserMessage(input: {
  category: string;
  description: string;
  target_user: string;
  stats: {
    similar_count: number;
    saturation_level: string;
    trend_direction: string;
    last_7_count: number;
    prev_7_count: number;
  };
}): string {
  return `## Idea to Analyze
- **Category**: ${input.category}
- **Description**: ${input.description}
- **Target User**: ${input.target_user}

## Platform Stats
- Similar ideas (30d): ${input.stats.similar_count}
- Saturation: ${input.stats.saturation_level}
- Trend: ${input.stats.trend_direction}
- Last 7 days: ${input.stats.last_7_count} submissions
- Prior 7 days: ${input.stats.prev_7_count} submissions`;
}

async function runAgent(
  client: OpenAI,
  agentId: AgentId,
  category: string,
  userMessage: string
): Promise<{ agentId: AgentId; result: Record<string, unknown> | null; error?: string }> {
  try {
    const systemPrompt = await loadAgentPrompt(agentId, category);

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 1024,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    });

    const text = response.choices[0]?.message?.content ?? "";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { agentId, result: null, error: "No JSON found in response" };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return { agentId, result: parsed };
  } catch (err) {
    console.error(`Agent ${agentId} failed:`, err);
    return {
      agentId,
      result: {
        agent: agentId,
        score: 50,
        assessment: "Analysis unavailable — used neutral fallback.",
        signals: {},
      },
      error: String(err),
    };
  }
}

async function runSynthesizer(
  client: OpenAI,
  input: Record<string, unknown>,
  agentResults: Record<string, unknown>
): Promise<Record<string, unknown>> {
  // Synthesizer is shared across all categories
  const systemPrompt = await loadFile("prompts/synthesizer.md");

  const userMessage = JSON.stringify({ input, agent_results: agentResults }, null, 2);

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 2048,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
  });

  const text = response.choices[0]?.message?.content ?? "";

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Synthesizer returned no JSON");

  return JSON.parse(jsonMatch[0]);
}

// ── POST /api/analysis ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { submissionId } = await req.json();
    if (!submissionId) {
      return NextResponse.json({ error: "Missing submissionId" }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY not configured" }, { status: 500 });
    }

    const supabase = await createClient();

    // Fetch the idea submission
    const { data: idea, error: ideaErr } = await supabase
      .from("idea_submissions")
      .select("id, category, target_user, description")
      .eq("id", submissionId)
      .single();

    if (ideaErr || !idea) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    // Check if analysis already exists
    const { data: existing } = await supabase
      .from("analysis_reports")
      .select("id")
      .eq("submission_id", submissionId)
      .single();

    if (existing) {
      return NextResponse.json({ error: "Analysis already exists", analysisId: existing.id }, { status: 409 });
    }

    // Gather platform stats
    const now = new Date();
    const d30 = new Date(now); d30.setDate(now.getDate() - 30);
    const d7 = new Date(now); d7.setDate(now.getDate() - 7);
    const d14 = new Date(now); d14.setDate(now.getDate() - 14);

    const [r30, r7, r14] = await Promise.all([
      supabase.from("idea_submissions").select("*", { count: "exact", head: true })
        .eq("category", idea.category).gte("created_at", d30.toISOString()),
      supabase.from("idea_submissions").select("*", { count: "exact", head: true })
        .eq("category", idea.category).gte("created_at", d7.toISOString()),
      supabase.from("idea_submissions").select("*", { count: "exact", head: true })
        .eq("category", idea.category).gte("created_at", d14.toISOString())
        .lt("created_at", d7.toISOString()),
    ]);

    const similarCount = r30.count ?? 0;
    const last7 = r7.count ?? 0;
    const prev7 = r14.count ?? 0;

    let saturationLevel: string;
    if (similarCount <= 4) saturationLevel = "Low";
    else if (similarCount <= 12) saturationLevel = "Medium";
    else saturationLevel = "High";

    let trendDirection: string;
    if (last7 > (prev7 || 0) * 1.25 || (prev7 === 0 && last7 >= 1)) {
      trendDirection = "Rising";
    } else if (last7 < (prev7 || 1) * 0.75) {
      trendDirection = "Declining";
    } else {
      trendDirection = "Stable";
    }

    const input = {
      category: idea.category,
      description: idea.description,
      target_user: idea.target_user,
      stats: {
        similar_count: similarCount,
        saturation_level: saturationLevel,
        trend_direction: trendDirection,
        last_7_count: last7,
        prev_7_count: prev7,
      },
    };

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const userMessage = buildUserMessage(input);

    // Run all 8 agents in parallel (with category-specific prompts)
    const agentPromises = AGENT_IDS.map((id) => runAgent(openai, id, idea.category, userMessage));
    const agentResponses = await Promise.all(agentPromises);

    // Check for failures
    const failures = agentResponses.filter((r) => r.error && r.result?.score === 50);
    if (failures.length >= 3) {
      return NextResponse.json(
        { error: "Too many agent failures", failedAgents: failures.map((f) => f.agentId) },
        { status: 500 }
      );
    }

    // Collect results
    const agentResults: Record<string, unknown> = {};
    for (const r of agentResponses) {
      agentResults[r.agentId] = r.result;
    }

    // Run synthesizer
    const finalReport = await runSynthesizer(openai, input, agentResults);

    // Store in DB
    const analysisId = crypto.randomUUID();
    const { error: insertErr } = await supabase.from("analysis_reports").insert({
      id: analysisId,
      submission_id: submissionId,
      viability_score: finalReport.viability_score,
      summary: finalReport.summary,
      analysis: finalReport.analysis,
      cross_agent_insights: finalReport.cross_agent_insights,
      opportunities: finalReport.opportunities,
      risks: finalReport.risks,
      next_steps: finalReport.next_steps,
      agent_results: agentResults,
    });

    if (insertErr) throw insertErr;

    return NextResponse.json({ analysisId, report: finalReport }, { status: 201 });
  } catch (err) {
    console.error("POST /api/analysis", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── GET /api/analysis?submissionId=xxx ──────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const submissionId = req.nextUrl.searchParams.get("submissionId");
    if (!submissionId) {
      return NextResponse.json({ error: "Missing submissionId" }, { status: 400 });
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("analysis_reports")
      .select("*")
      .eq("submission_id", submissionId)
      .single();

    if (error || !data) {
      return NextResponse.json({ report: null });
    }

    return NextResponse.json({ report: data });
  } catch (err) {
    console.error("GET /api/analysis", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
