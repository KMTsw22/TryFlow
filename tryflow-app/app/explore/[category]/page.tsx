import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { IdeaCard } from "@/components/ideas/IdeaCard";
import { CATEGORIES } from "@/lib/categories";
import { PageHeader } from "@/components/ui/PageHeader";
import { CategoryInsightPanel } from "@/components/market/CategoryInsightPanel";

interface InsightReport {
  viability_score: number;
  saturation_level: string;
  trend_direction: string;
  summary: string;
}

interface AnalysisReport {
  viability_score: number;
}

interface SubmitterProfile {
  allow_contact: boolean | null;
}

interface IdeaRow {
  id: string;
  category: string;
  target_user: string;
  description: string;
  created_at: string;
  user_id: string | null;
  stage: string | null;
  insight_reports: InsightReport | InsightReport[] | null;
  analysis_reports: AnalysisReport | AnalysisReport[] | null;
  user_profiles: SubmitterProfile | SubmitterProfile[] | null;
}

function getInsight(idea: IdeaRow): InsightReport | null {
  if (!idea.insight_reports) return null;
  if (Array.isArray(idea.insight_reports)) return idea.insight_reports[0] ?? null;
  return idea.insight_reports;
}

function getAiScore(idea: IdeaRow): number | null {
  if (!idea.analysis_reports) return null;
  const r = Array.isArray(idea.analysis_reports) ? idea.analysis_reports[0] : idea.analysis_reports;
  return r?.viability_score ?? null;
}

function getContactOpen(idea: IdeaRow): boolean | null {
  if (!idea.user_id) return null; // anonymous submission
  if (!idea.user_profiles) return null;
  const p = Array.isArray(idea.user_profiles) ? idea.user_profiles[0] : idea.user_profiles;
  if (!p || p.allow_contact === null || p.allow_contact === undefined) return null;
  return !!p.allow_contact;
}

function toCardData(idea: IdeaRow) {
  const insight = getInsight(idea);
  const aiScore = getAiScore(idea);
  return {
    id: idea.id,
    category: idea.category,
    target_user: idea.target_user,
    description: idea.description,
    created_at: idea.created_at,
    stage: idea.stage,
    viability_score: aiScore ?? insight?.viability_score ?? null,
    trend_direction: insight?.trend_direction ?? null,
    saturation_level: insight?.saturation_level ?? null,
    summary: insight?.summary ?? null,
    contactOpen: getContactOpen(idea),
  };
}

// ── Keyword extraction ──────────────────────────────────────────────────────
const STOPWORDS = new Set([
  "the", "and", "for", "that", "this", "with", "from", "have", "has", "had",
  "are", "was", "were", "been", "being", "will", "would", "could", "should",
  "can", "our", "your", "their", "they", "them", "its", "you", "all", "any",
  "but", "not", "who", "how", "why", "what", "when", "where", "which",
  "about", "into", "over", "than", "then", "some", "such", "also", "just",
  "like", "want", "need", "use", "using", "make", "makes", "made", "get",
  "users", "user", "people", "someone", "anyone", "everyone", "thing",
  "things", "way", "ways", "service", "services", "product", "products",
  "tool", "tools", "app", "apps", "platform", "solution", "solutions",
  "help", "helps", "helping", "lets", "let", "allows", "allow", "provides",
  "provide", "provides", "based", "new", "one", "two", "three", "more",
  "most", "very", "really", "quick", "quickly", "easy", "easily",
  "through", "across", "without", "within",
]);

function extractKeywords(texts: string[], topN = 6): { word: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const text of texts) {
    const matches = text.toLowerCase().match(/\b[a-z][a-z-]{2,}\b/g) ?? [];
    const seenInDoc = new Set<string>();
    for (const raw of matches) {
      const word = raw.replace(/-+$/, "");
      if (word.length < 3) continue;
      if (STOPWORDS.has(word)) continue;
      // Count each word once per idea (document frequency) to reduce boilerplate repetition
      if (seenInDoc.has(word)) continue;
      seenInDoc.add(word);
      counts.set(word, (counts.get(word) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([word, count]) => ({ word, count }));
}

export default async function CategoryIdeasPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: rawCategory } = await params;
  const category = decodeURIComponent(rawCategory);

  if (!CATEGORIES.includes(category)) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/explore");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("plan")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.plan !== "pro") redirect("/pricing");

  const { data } = await supabase
    .from("idea_submissions")
    .select(`
      id, category, target_user, description, created_at, user_id, stage,
      insight_reports (viability_score, saturation_level, trend_direction, summary),
      analysis_reports (viability_score),
      user_profiles (allow_contact)
    `)
    .eq("category", category)
    .eq("is_private", false)
    .order("created_at", { ascending: false });

  const ideas = (data ?? []) as unknown as IdeaRow[];

  // ── Compute insight panel data ────────────────────────────────────────────
  const now = new Date();
  const msInDay = 24 * 60 * 60 * 1000;

  // Weekly rollup: 4 buckets × 7 days, oldest → newest
  const WEEKS = 4;
  const DAYS_PER_WEEK = 7;
  const periodDays = WEEKS * DAYS_PER_WEEK;

  const weeklyCounts: number[] = Array(WEEKS).fill(0);
  let totalThis = 0;
  let totalPrev = 0;

  for (const idea of ideas) {
    const submitted = new Date(idea.created_at).getTime();
    const ageDays = Math.floor((now.getTime() - submitted) / msInDay);
    if (ageDays < periodDays) {
      const weekFromNow = Math.floor(ageDays / DAYS_PER_WEEK); // 0 = this week, WEEKS-1 = oldest
      const bucket = WEEKS - 1 - weekFromNow;
      if (bucket >= 0 && bucket < WEEKS) weeklyCounts[bucket]++;
      totalThis++;
    } else if (ageDays < periodDays * 2) {
      totalPrev++;
    }
  }

  // For each bucket, compute the start date (oldest day of the 7-day window)
  const weeklyBuckets = weeklyCounts.map((count, i) => {
    const startAgeDays = (WEEKS - i) * DAYS_PER_WEEK - 1;
    const start = new Date(now.getTime() - startAgeDays * msInDay);
    return { startISO: start.toISOString(), count };
  });

  // Extract top keywords from descriptions
  const topKeywords = extractKeywords(
    ideas.map((i) => i.description ?? ""),
    6,
  );

  // Most recent activity — ideas are ordered created_at desc, so [0] is latest
  const lastActivityAt = ideas[0]?.created_at ?? null;

  return (
    <div className="min-h-screen" style={{ background: "var(--page-bg)" }}>
      {/* Navbar */}
      <nav
        className="border-b px-6 h-[60px] flex items-center justify-between"
        style={{ background: "var(--nav-bg)", borderColor: "var(--t-border)", backdropFilter: "blur(12px)" }}
      >
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png" className="w-7 h-7" alt="Try.Wepp" />
          <span className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Try.Wepp</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="text-sm transition-colors"
            style={{ color: "var(--text-tertiary)" }}
          >
            Dashboard
          </Link>
          <Link
            href="/submit"
            className="inline-flex items-center gap-1.5 bg-[color:var(--accent)] text-white text-sm font-semibold px-3 h-8 hover:brightness-110 transition-all"
          >
            Submit idea
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Back link */}
        <Link
          href="/explore"
          className="inline-flex items-center gap-1.5 text-xs font-medium mb-6 transition-colors hover:text-[color:var(--text-primary)]"
          style={{ color: "var(--text-tertiary)" }}
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Market
        </Link>

        <PageHeader
          title={category}
          meta={`${ideas.length} ${ideas.length === 1 ? "idea" : "ideas"}`}
          description="Anonymous submissions in this category. Below, the past 4 weeks of activity and recurring themes from founder descriptions."
        />

        {/* Insight panel */}
        {ideas.length > 0 && (
          <div className="mb-10">
            <CategoryInsightPanel
              data={{
                weeklyBuckets,
                totalThis,
                totalPrev,
                lastActivityAt,
                topKeywords,
              }}
            />
          </div>
        )}

        {/* Ideas list */}
        {ideas.length === 0 ? (
          <div
            className="text-center py-20 border"
            style={{ borderColor: "var(--t-border-card)", background: "var(--card-bg)" }}
          >
            <p
              className="text-base font-semibold mb-1"
              style={{ color: "var(--text-primary)" }}
            >
              No {category} ideas yet.
            </p>
            <p
              className="text-sm mb-6 max-w-sm mx-auto"
              style={{ color: "var(--text-secondary)" }}
            >
              Be the first founder to stake a claim in this category.
            </p>
            <Link
              href="/submit"
              className="inline-flex items-center gap-1.5 bg-[color:var(--accent)] text-white font-semibold px-5 h-10 text-sm hover:brightness-110 transition-all"
            >
              Submit the first idea <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-baseline justify-between mb-4">
              <h2
                className="text-sm font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                All submissions
              </h2>
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                Newest first
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {ideas.map((idea) => (
                <IdeaCard key={idea.id} idea={toCardData(idea)} showCategory={false} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
