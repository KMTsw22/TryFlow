import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Plus, TrendingUp, TrendingDown, Minus, ArrowRight, BarChart3, FileText } from "lucide-react";

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
  insight_reports: Report | Report[] | null;
}

function getReport(idea: Idea): Report | null {
  if (!idea.insight_reports) return null;
  if (Array.isArray(idea.insight_reports)) return idea.insight_reports[0] ?? null;
  return idea.insight_reports;
}

const TREND_CONFIG = {
  Rising:    { icon: TrendingUp,   color: "text-emerald-500", bg: "bg-emerald-50" },
  Stable:    { icon: Minus,        color: "text-amber-500",   bg: "bg-amber-50" },
  Declining: { icon: TrendingDown, color: "text-red-500",     bg: "bg-red-50" },
};

const SCORE_COLOR = (s: number) =>
  s >= 70 ? "text-emerald-600" : s >= 50 ? "text-amber-600" : "text-red-600";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: rawIdeas } = await supabase
    .from("idea_submissions")
    .select(`
      id, category, target_user, description, created_at,
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

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">My Ideas</h1>
          <p className="text-sm text-gray-400 mt-1">Your anonymous submissions and insight reports</p>
        </div>
        <Link href="/submit" className="inline-flex items-center gap-2 bg-indigo-500 text-white font-bold px-4 py-2.5  text-sm hover:bg-indigo-400 transition-colors">
          <Plus className="w-4 h-4" /> New idea
        </Link>
      </div>

      {/* Stats (when ideas exist) */}
      {hasIdeas && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Ideas Submitted", value: ideas.length },
            { label: "Avg. Viability Score", value: avgScore ?? "—" },
            { label: "Latest Category", value: ideas[0]?.category ?? "—" },
          ].map((s) => (
            <div key={s.label} className="bg-white  border border-gray-200 p-4 text-center">
              <div className="text-2xl font-extrabold text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!hasIdeas && (
        <div className="bg-white  border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-indigo-50  flex items-center justify-center mx-auto mb-5">
            <FileText className="w-7 h-7 text-indigo-400" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">No ideas yet</h2>
          <p className="text-sm text-gray-400 max-w-sm mx-auto mb-6 leading-relaxed">
            Submit your first startup idea anonymously. Get an instant insight report showing viability, market saturation, and trend direction.
          </p>
          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mb-8 text-center">
            {[
              { step: "01", label: "Submit anonymously", desc: "Category, target user, brief description" },
              { step: "02", label: "AI analyzes & clusters", desc: "Groups similar ideas, identifies trends" },
              { step: "03", label: "Get your report", desc: "Viability score, saturation, trend direction" },
            ].map((s) => (
              <div key={s.step} className="p-4 bg-gray-50 ">
                <div className="text-2xl font-black text-gray-200 mb-2">{s.step}</div>
                <div className="text-xs font-bold text-gray-700 mb-1">{s.label}</div>
                <div className="text-xs text-gray-400">{s.desc}</div>
              </div>
            ))}
          </div>
          <Link href="/submit" className="inline-flex items-center gap-2 bg-indigo-500 text-white font-bold px-6 py-3  text-sm hover:bg-indigo-400 transition-colors">
            Submit your first idea <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Ideas list */}
      {hasIdeas && (
        <div className="space-y-4">
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
                className="block bg-white  border border-gray-200 p-6 hover:shadow-md hover:border-indigo-200 transition-all duration-200 group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                        {idea.category}
                      </span>
                      <span className="text-xs text-gray-400">{date}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-700 mb-1">For: {idea.target_user}</p>
                    <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">{idea.description}</p>
                  </div>

                  {report && (
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className={`text-2xl font-extrabold ${SCORE_COLOR(report.viability_score)}`}>
                          {report.viability_score}
                        </p>
                        <p className="text-xs text-gray-400">score</p>
                      </div>
                      <div className={`w-9 h-9  ${trend?.bg} flex items-center justify-center`}>
                        <TIcon className={`w-4 h-4 ${trend?.color}`} />
                      </div>
                      <div className="text-gray-300 group-hover:text-indigo-400 transition-colors">
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

      {/* Explore trends CTA */}
      {hasIdeas && (
        <div className="mt-6 bg-indigo-50  border border-indigo-100 p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-indigo-800 mb-0.5">See how your ideas compare</p>
            <p className="text-xs text-indigo-500">Live trend data from all anonymous submissions</p>
          </div>
          <Link href="/explore" className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:text-indigo-500 transition-colors">
            <BarChart3 className="w-4 h-4" /> View trends
          </Link>
        </div>
      )}
    </div>
  );
}