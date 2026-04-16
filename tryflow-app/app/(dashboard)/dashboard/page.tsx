import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Plus, TrendingUp, TrendingDown, Minus, ArrowRight, BarChart3, FileText, GitCompare } from "lucide-react";
import { OnboardingChecklist } from "@/components/dashboard/OnboardingChecklist";

interface Report {
  viability_score: number;
  saturation_level: string;
  trend_direction: string;
  similar_count: number;
  summary: string;
}

interface Idea {
  id: string;
  category: string;
  target_user: string;
  description: string;
  created_at: string;
  stage: string | null;
  insight_reports: Report | Report[] | null;
}

const STAGE_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  idea:           { label: "Just an Idea",     color: "#60a5fa", bg: "rgba(96,165,250,0.10)",  border: "rgba(96,165,250,0.25)" },
  prototype:      { label: "Prototype / Demo", color: "#a78bfa", bg: "rgba(167,139,250,0.10)", border: "rgba(167,139,250,0.25)" },
  early_traction: { label: "Early Traction",   color: "#fb923c", bg: "rgba(251,146,60,0.10)",  border: "rgba(251,146,60,0.25)" },
  launched:       { label: "Launched",          color: "#ef4444", bg: "rgba(239,68,68,0.10)",   border: "rgba(239,68,68,0.25)" },
};

function getReport(idea: Idea): Report | null {
  if (!idea.insight_reports) return null;
  if (Array.isArray(idea.insight_reports)) return idea.insight_reports[0] ?? null;
  return idea.insight_reports;
}

const TREND_CONFIG = {
  Rising:    { icon: TrendingUp,   color: "text-emerald-400", bg: "bg-emerald-500/10" },
  Stable:    { icon: Minus,        color: "text-amber-400",   bg: "bg-amber-500/10"   },
  Declining: { icon: TrendingDown, color: "text-red-400",     bg: "bg-red-500/10"     },
};

const SCORE_COLOR = (s: number) =>
  s >= 70 ? "text-emerald-400" : s >= 50 ? "text-amber-400" : "text-red-400";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: rawIdeas } = await supabase
    .from("idea_submissions")
    .select(`
      id, category, target_user, description, created_at, stage,
      insight_reports (viability_score, saturation_level, trend_direction, similar_count, summary)
    `)
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const ideas = (rawIdeas ?? []) as unknown as Idea[];
  const hasIdeas = ideas.length > 0;

  const avgScore = hasIdeas
    ? Math.round(
        ideas.reduce((sum, i) => {
          const r = getReport(i);
          return sum + (r?.viability_score ?? 0);
        }, 0) / ideas.length
      )
    : null;

  const hasReport = ideas.some((i) => !!getReport(i));
  const firstReportIdeaId = ideas.find((i) => !!getReport(i))?.id
    ?? ideas[0]?.id
    ?? null;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">My Ideas</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your anonymous submissions and insight reports</p>
        </div>
        <Link href="/submit"
          className="inline-flex items-center gap-2 bg-indigo-500 text-white font-bold px-4 py-2.5 text-sm hover:bg-indigo-400 transition-colors">
          <Plus className="w-4 h-4" /> New idea
        </Link>
      </div>

      {/* Onboarding checklist (self-hides once all steps done or dismissed) */}
      <OnboardingChecklist
        hasIdeas={hasIdeas}
        hasReport={hasReport}
        firstIdeaId={firstReportIdeaId}
      />

      {/* Stats */}
      {hasIdeas && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Ideas Submitted",    value: ideas.length },
            { label: "Avg. Viability Score", value: avgScore ?? "—" },
            { label: "Latest Category",    value: ideas[0]?.category ?? "—" },
          ].map((s) => (
            <div key={s.label} className="border p-4 text-center"
              style={{ background: "var(--card-bg)", borderColor: "var(--t-border-card)" }}>
              <div className="text-2xl font-extrabold text-gray-900 dark:text-white">{s.value}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!hasIdeas && (
        <div className="border p-12 text-center"
          style={{ background: "var(--card-bg)", borderColor: "var(--t-border-card)" }}>
          <div className="w-16 h-16 flex items-center justify-center mx-auto mb-5"
            style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}>
            <FileText className="w-7 h-7 text-indigo-400" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No ideas yet</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6 leading-relaxed">
            Submit your first startup idea anonymously. Get an instant insight report showing viability, market saturation, and trend direction.
          </p>
          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mb-8 text-center">
            {[
              { step: "01", label: "Submit anonymously",      desc: "Category, target user, brief description" },
              { step: "02", label: "AI analyzes & clusters",  desc: "Groups similar ideas, identifies trends" },
              { step: "03", label: "Get your report",         desc: "Viability score, saturation, trend direction" },
            ].map((s) => (
              <div key={s.step} className="p-4 border"
                style={{ background: "var(--card-bg)", borderColor: "var(--t-border)" }}>
                <div className="text-2xl font-black text-gray-400 dark:text-gray-500 mb-2">{s.step}</div>
                <div className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{s.label}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{s.desc}</div>
              </div>
            ))}
          </div>
          <Link href="/submit"
            className="inline-flex items-center gap-2 bg-indigo-500 text-white font-bold px-6 py-3 text-sm hover:bg-indigo-400 transition-colors">
            Submit your first idea <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Ideas list */}
      {hasIdeas && (
        <div className="space-y-3">
          {ideas.map((idea) => {
            const report = getReport(idea);
            const trend = report
              ? TREND_CONFIG[report.trend_direction as keyof typeof TREND_CONFIG] ?? TREND_CONFIG.Stable
              : null;
            const TIcon = trend?.icon ?? Minus;
            const date = new Date(idea.created_at).toLocaleDateString("en-US", {
              month: "short", day: "numeric", year: "numeric",
            });

            return (
              <Link
                key={idea.id}
                href={`/ideas/${idea.id}`}
                className="block border p-5 hover:border-indigo-500/30 transition-all duration-200 group"
                style={{ background: "var(--card-bg)", borderColor: "var(--t-border-card)" }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.2)" }}>
                        {idea.category}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{date}</span>
                      {idea.stage && STAGE_META[idea.stage] && (() => {
                        const s = STAGE_META[idea.stage!]!;
                        return (
                          <span
                            className="text-[10px] font-bold px-2 py-0.5"
                            style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}
                          >
                            {s.label}
                          </span>
                        );
                      })()}
                    </div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">For: {idea.target_user}</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-2">{idea.description}</p>
                  </div>

                  {report && (
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className={`text-2xl font-extrabold ${SCORE_COLOR(report.viability_score)}`}>
                          {report.viability_score}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">score</p>
                      </div>
                      <div className={`w-9 h-9 ${trend?.bg} flex items-center justify-center`}>
                        <TIcon className={`w-4 h-4 ${trend?.color}`} />
                      </div>
                      <div className="text-gray-400 dark:text-gray-500 group-hover:text-indigo-400 transition-colors">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Bottom CTAs */}
      {hasIdeas && (
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="border p-5 flex items-center justify-between"
            style={{ background: "var(--card-bg)", borderColor: "var(--t-border)" }}>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white mb-0.5">Explore market trends</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Live data from all anonymous submissions</p>
            </div>
            <Link href="/explore"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-500 dark:text-indigo-400 hover:text-indigo-400 dark:hover:text-indigo-300 transition-colors shrink-0">
              <BarChart3 className="w-4 h-4" /> View
            </Link>
          </div>
          {ideas.length >= 2 && (
            <div className="border p-5 flex items-center justify-between"
              style={{ background: "rgba(99,102,241,0.05)", borderColor: "rgba(99,102,241,0.2)" }}>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white mb-0.5">Compare your ideas</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Pick 2 and see which to pursue</p>
              </div>
              <Link href="/compare"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-500 dark:text-indigo-400 hover:text-indigo-400 dark:hover:text-indigo-300 transition-colors shrink-0">
                <GitCompare className="w-4 h-4" /> Compare
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
