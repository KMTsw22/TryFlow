import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { IdeaCard } from "@/components/ideas/IdeaCard";
import { CATEGORIES } from "@/lib/categories";
import { CategoryInsightPanel } from "@/components/market/CategoryInsightPanel";

const SERIF = "'Playfair Display', serif";
const DISPLAY = "'Oswald', sans-serif";

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

  const { data, error } = await supabase
    .from("idea_submissions")
    .select(`
      id, category, target_user, description, created_at, user_id, stage,
      insight_reports (viability_score, saturation_level, trend_direction, summary),
      analysis_reports (viability_score)
    `)
    .eq("category", category)
    .eq("is_private", false)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Category ideas query failed:", error);
  }

  const ideasBase = (data ?? []) as unknown as Omit<IdeaRow, "user_profiles">[];

  // Fetch submitter profiles separately (no FK between idea_submissions.user_id
  // and user_profiles.id — both only share a FK to auth.users).
  const submitterIds = Array.from(
    new Set(ideasBase.map((i) => i.user_id).filter((x): x is string => !!x)),
  );

  const profileMap = new Map<string, { allow_contact: boolean | null }>();
  if (submitterIds.length > 0) {
    const { data: profiles } = await supabase
      .from("user_profiles")
      .select("id, allow_contact")
      .in("id", submitterIds);
    for (const p of profiles ?? []) {
      profileMap.set(p.id as string, { allow_contact: p.allow_contact ?? null });
    }
  }

  const ideas: IdeaRow[] = ideasBase.map((i) => ({
    ...i,
    user_profiles: i.user_id
      ? profileMap.get(i.user_id) ?? null
      : null,
  }));

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
      {/* Editorial navbar */}
      <nav
        className="border-b px-6 h-[64px] flex items-center justify-between"
        style={{
          background: "var(--nav-bg)",
          borderColor: "var(--t-border-subtle)",
          backdropFilter: "blur(12px)",
        }}
      >
        <Link href="/" className="flex items-center gap-2.5">
          <img src="/logo.png" className="w-6 h-6" alt="Try.Wepp" />
          <span
            style={{
              fontFamily: SERIF,
              fontWeight: 900,
              fontSize: "1rem",
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
            }}
          >
            Try.Wepp
          </span>
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="text-[15px] font-medium tracking-[0.3em] uppercase transition-opacity hover:opacity-70"
            style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
          >
            Dashboard
          </Link>
          <Link
            href="/submit"
            className="inline-flex items-center gap-2 text-[15px] font-medium tracking-[0.3em] uppercase transition-opacity hover:opacity-70"
            style={{ fontFamily: DISPLAY, color: "var(--accent)" }}
          >
            Submit idea
            <span aria-hidden>→</span>
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Back link */}
        <Link
          href="/explore"
          className="inline-flex items-center gap-1.5 text-[15px] font-medium tracking-[0.2em] uppercase mb-10 transition-colors hover:text-[color:var(--text-primary)]"
          style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
        >
          <ArrowLeft className="w-3 h-3" /> Back to Market
        </Link>

        {/* Editorial kicker */}
        <div className="flex items-center gap-4 mb-6">
          <span
            className="text-[15px] font-medium tracking-[0.35em] uppercase"
            style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
          >
            Category · Market
          </span>
          <span className="flex-1 h-px" style={{ background: "var(--t-border-subtle)" }} />
          <span
            className="text-[15px] font-medium tracking-[0.25em] uppercase"
            style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
          >
            {ideas.length} {ideas.length === 1 ? "idea" : "ideas"}
          </span>
        </div>

        <h1
          className="mb-4"
          style={{
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: "clamp(2.5rem, 5vw, 4rem)",
            lineHeight: 1.02,
            letterSpacing: "-0.03em",
            color: "var(--text-primary)",
          }}
        >
          {category}.
        </h1>

        <div
          className="text-[17px] leading-[1.6] mb-14 space-y-1"
          style={{ color: "var(--text-secondary)" }}
        >
          <p>Anonymous submissions in this category.</p>
          <p>Four weeks of activity, recurring themes pulled from founder descriptions, and every live idea below.</p>
        </div>

        {/* Insight panel */}
        {ideas.length > 0 && (
          <div className="mb-14">
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
            className="py-20 border-t border-b"
            style={{ borderColor: "var(--t-border-subtle)" }}
          >
            <p
              className="text-[15px] font-medium tracking-[0.35em] uppercase mb-5"
              style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
            >
              Nothing yet
            </p>
            <p
              className="leading-[1.15] mb-5 max-w-2xl"
              style={{
                fontFamily: SERIF,
                fontStyle: "italic",
                fontWeight: 400,
                fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
                letterSpacing: "-0.01em",
                color: "var(--text-primary)",
              }}
            >
              &ldquo;No {category} ideas yet. Be the first to stake a claim.&rdquo;
            </p>
            <Link
              href="/submit"
              className="group inline-flex items-center gap-3 text-[15px] font-medium tracking-[0.3em] uppercase transition-opacity hover:opacity-70"
              style={{ fontFamily: DISPLAY, color: "var(--accent)" }}
            >
              Submit the first idea
              <ArrowRight
                className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1"
                strokeWidth={2}
              />
            </Link>
          </div>
        ) : (
          <section aria-label="All submissions">
            <div className="flex items-center gap-4 mb-8">
              <span
                className="text-[15px] font-medium tracking-[0.35em] uppercase"
                style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
              >
                All Submissions
              </span>
              <span
                className="flex-1 h-px"
                style={{ background: "var(--t-border-subtle)" }}
              />
              <span
                className="text-[15px] font-medium tracking-[0.25em] uppercase"
                style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
              >
                Newest first
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {ideas.map((idea) => (
                <IdeaCard key={idea.id} idea={toCardData(idea)} showCategory={false} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
