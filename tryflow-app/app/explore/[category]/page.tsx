import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TrendingUp, TrendingDown, Minus, ArrowLeft, ArrowRight } from "lucide-react";

const CATEGORIES = [
  "SaaS / B2B", "Consumer App", "Marketplace", "Dev Tools",
  "Health & Wellness", "Education", "Fintech", "E-commerce", "Hardware",
];

const TREND_PILL = {
  Rising:    "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
  Stable:    "bg-amber-500/15 text-amber-400 border border-amber-500/20",
  Declining: "bg-red-500/15 text-red-400 border border-red-500/20",
};

const SAT_PILL = {
  Low:    "bg-indigo-500/15 text-indigo-300 border border-indigo-500/20",
  Medium: "bg-violet-500/15 text-violet-300 border border-violet-500/20",
  High:   "bg-orange-500/15 text-orange-300 border border-orange-500/20",
};

interface InsightReport {
  viability_score: number;
  saturation_level: string;
  trend_direction: string;
  summary: string;
}

interface IdeaRow {
  id: string;
  category: string;
  target_user: string;
  description: string;
  created_at: string;
  insight_reports: InsightReport | InsightReport[] | null;
}

function getReport(idea: IdeaRow): InsightReport | null {
  if (!idea.insight_reports) return null;
  if (Array.isArray(idea.insight_reports)) return idea.insight_reports[0] ?? null;
  return idea.insight_reports;
}

function truncate(text: string, max: number) {
  return text.length > max ? text.slice(0, max) + "…" : text;
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

  const { data } = await supabase
    .from("idea_submissions")
    .select(`
      id, category, target_user, description, created_at,
      insight_reports (viability_score, saturation_level, trend_direction, summary)
    `)
    .eq("category", category)
    .order("created_at", { ascending: false });

  const ideas = (data ?? []) as IdeaRow[];

  return (
    <div className="min-h-screen" style={{ background: "#050816" }}>
      {/* Navbar */}
      <nav
        className="border-b px-6 h-[60px] flex items-center justify-between"
        style={{ background: "rgba(5,8,22,0.95)", borderColor: "rgba(255,255,255,0.06)", backdropFilter: "blur(12px)" }}
      >
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png" className="w-7 h-7" alt="Try.Wepp" />
          <span className="font-bold text-white text-sm">Try.Wepp</span>
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">Dashboard</Link>
          ) : (
            <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">Sign in</Link>
          )}
          <Link href="/submit" className="bg-indigo-500 text-white text-sm font-bold px-4 py-2 hover:bg-indigo-400 transition-colors">
            Submit idea →
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Back + header */}
        <div className="mb-10">
          <Link
            href="/explore"
            className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors mb-6"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Trends
          </Link>
          <p className="text-xs font-bold tracking-widest text-indigo-400 uppercase mb-2">Anonymous Ideas</p>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">{category}</h1>
          <p className="mt-3 text-gray-400 text-base">
            {ideas.length} idea{ideas.length !== 1 ? "s" : ""} submitted · All anonymous · Newest first
          </p>
        </div>

        {/* Grid */}
        {ideas.length === 0 ? (
          <div
            className="text-center py-20 border"
            style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)" }}
          >
            <p className="text-gray-500 text-sm mb-5">No ideas in this category yet.</p>
            <Link
              href="/submit"
              className="inline-flex items-center gap-2 bg-indigo-500 text-white font-bold px-5 py-2.5 text-sm hover:bg-indigo-400 transition-colors"
            >
              Be the first <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ideas.map((idea) => {
              const report = getReport(idea);

              const vScore = report?.viability_score ?? null;
              const vColor =
                vScore === null ? "text-gray-500"
                : vScore >= 70 ? "text-emerald-400"
                : vScore >= 50 ? "text-amber-400"
                : "text-red-400";
              const vRing =
                vScore === null ? "border-gray-700/40 bg-gray-700/10"
                : vScore >= 70 ? "border-emerald-500/30 bg-emerald-500/10"
                : vScore >= 50 ? "border-amber-500/30 bg-amber-500/10"
                : "border-red-500/30 bg-red-500/10";

              const trendPill = report
                ? TREND_PILL[report.trend_direction as keyof typeof TREND_PILL] ?? TREND_PILL.Stable
                : null;
              const satPill = report
                ? SAT_PILL[report.saturation_level as keyof typeof SAT_PILL] ?? SAT_PILL.Low
                : null;

              return (
                <Link
                  key={idea.id}
                  href={`/ideas/${idea.id}`}
                  className="group flex flex-col border p-5 hover:border-indigo-500/40 transition-all duration-200 hover:bg-white/[0.04] cursor-pointer"
                  style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.07)" }}
                >
                  {/* Top row: score + anonymous badge */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-full border ${vRing}`}>
                      {vScore !== null ? (
                        <>
                          <span className={`text-base font-extrabold leading-none ${vColor}`}>{vScore}</span>
                          <span className="text-[9px] text-gray-600 leading-none mt-0.5">/100</span>
                        </>
                      ) : (
                        <span className="text-gray-600 text-xs">—</span>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider pt-1">Anonymous</span>
                  </div>

                  {/* Target user */}
                  <p className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider mb-1.5">
                    For: {truncate(idea.target_user, 45)}
                  </p>

                  {/* Description */}
                  <p className="text-sm text-gray-300 leading-relaxed flex-1 mb-4">
                    {truncate(idea.description, 130)}
                  </p>

                  {/* Bottom: pills + arrow */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {trendPill && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${trendPill}`}>
                        {report!.trend_direction}
                      </span>
                    )}
                    {satPill && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${satPill}`}>
                        {report!.saturation_level} sat.
                      </span>
                    )}
                    <span className="ml-auto text-[11px] text-indigo-500 group-hover:text-indigo-300 flex items-center gap-0.5 transition-colors">
                      View report <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* CTA */}
        <div
          className="mt-10 p-8 text-center border"
          style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))", borderColor: "rgba(129,140,248,0.2)" }}
        >
          <p className="text-xs font-bold tracking-widest text-indigo-400 uppercase mb-3">Add your signal</p>
          <h3 className="text-xl font-extrabold text-white mb-2">
            The more ideas submitted, the sharper the trends.
          </h3>
          <p className="text-sm text-gray-400 mb-5 max-w-sm mx-auto">
            Your anonymous submission helps every founder see where the market is heading.
          </p>
          <Link
            href="/submit"
            className="inline-flex items-center gap-2 bg-indigo-500 text-white font-bold px-6 py-3 text-sm hover:bg-indigo-400 transition-colors"
          >
            Submit your idea <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}