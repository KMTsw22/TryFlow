import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { TwLogo } from "@/components/ui/TwLogo";
import { TrendingUp, TrendingDown, Minus, ArrowRight, BarChart3, Share2 } from "lucide-react";

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
  Rising:   { icon: TrendingUp,   color: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-200", label: "Rising" },
  Stable:   { icon: Minus,        color: "text-amber-500",   bg: "bg-amber-50",   border: "border-amber-200",   label: "Stable" },
  Declining:{ icon: TrendingDown, color: "text-red-500",     bg: "bg-red-50",     border: "border-red-200",     label: "Declining" },
};

const SAT_CONFIG = {
  Low:    { color: "text-emerald-600", bg: "bg-emerald-50", bar: "bg-emerald-400", width: "w-1/3" },
  Medium: { color: "text-amber-600",   bg: "bg-amber-50",   bar: "bg-amber-400",   width: "w-2/3" },
  High:   { color: "text-red-600",     bg: "bg-red-50",     bar: "bg-red-400",     width: "w-full" },
};

export default async function IdeaReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("idea_submissions")
    .select(`
      id, category, target_user, description, created_at,
      insight_reports (viability_score, saturation_level, trend_direction, similar_count, summary)
    `)
    .eq("id", id)
    .single();

  if (error || !data) notFound();

  const idea = data as unknown as Idea;
  const report = getReport(idea);
  if (!report) notFound();

  const trend = TREND_CONFIG[report.trend_direction as keyof typeof TREND_CONFIG] ?? TREND_CONFIG.Stable;
  const sat   = SAT_CONFIG[report.saturation_level as keyof typeof SAT_CONFIG] ?? SAT_CONFIG.Medium;
  const TrendIcon = trend.icon;

  // Viability color
  const vColor = report.viability_score >= 70 ? "text-emerald-600" : report.viability_score >= 50 ? "text-amber-600" : "text-red-600";
  const vBg    = report.viability_score >= 70 ? "#10b981" : report.viability_score >= 50 ? "#f59e0b" : "#ef4444";

  const date = new Date(idea.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 px-6 h-[60px] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <TwLogo className="w-7 h-7 rounded-lg" />
          <span className="font-bold text-gray-900 text-sm">Try.Wepp</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/explore" className="text-sm text-gray-500 hover:text-gray-800 transition-colors flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4" /> Trends
          </Link>
          <Link href="/submit" className="bg-indigo-500 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-indigo-400 transition-colors">
            Submit another →
          </Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 text-xs font-bold px-3 py-1.5 rounded-full mb-4">
            Your Personal Insight Report
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">Here&apos;s what we found.</h1>
          <p className="text-sm text-gray-400 mt-2">Submitted {date} · {idea.category}</p>
        </div>

        {/* Viability score */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-4 text-center shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Viability Score</p>
          <div className="relative w-32 h-32 mx-auto mb-4">
            <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="#f3f4f6" strokeWidth="12" />
              <circle
                cx="60" cy="60" r="52" fill="none"
                stroke={vBg} strokeWidth="12"
                strokeDasharray={`${2 * Math.PI * 52}`}
                strokeDashoffset={`${2 * Math.PI * 52 * (1 - report.viability_score / 100)}`}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 1s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-extrabold ${vColor}`}>{report.viability_score}</span>
              <span className="text-xs text-gray-400">/100</span>
            </div>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed max-w-sm mx-auto">{report.summary}</p>
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          {/* Trend */}
          <div className={`bg-white rounded-2xl border ${trend.border} p-5 text-center shadow-sm`}>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Market Trend</p>
            <div className={`w-10 h-10 rounded-xl ${trend.bg} flex items-center justify-center mx-auto mb-2`}>
              <TrendIcon className={`w-5 h-5 ${trend.color}`} />
            </div>
            <p className={`text-sm font-bold ${trend.color}`}>{report.trend_direction}</p>
          </div>

          {/* Saturation */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Saturation</p>
            <div className={`w-10 h-10 rounded-xl ${sat.bg} flex items-center justify-center mx-auto mb-2`}>
              <span className={`text-sm font-black ${sat.color}`}>{report.saturation_level[0]}</span>
            </div>
            <p className={`text-sm font-bold ${sat.color}`}>{report.saturation_level}</p>
          </div>

          {/* Similar ideas */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Similar Ideas</p>
            <p className="text-3xl font-extrabold text-gray-900 mb-1">{report.similar_count}</p>
            <p className="text-xs text-gray-400">last 30 days</p>
          </div>
        </div>

        {/* Idea summary */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Your Submitted Idea</p>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-400 mb-1">Target user</p>
              <p className="text-sm font-medium text-gray-700">{idea.target_user}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Description</p>
              <p className="text-sm text-gray-600 leading-relaxed">{idea.description}</p>
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-3">
          <Link href="/explore" className="w-full bg-indigo-500 text-white font-bold py-3 rounded-xl text-sm text-center hover:bg-indigo-400 transition-colors flex items-center justify-center gap-2">
            <BarChart3 className="w-4 h-4" /> Explore market trends in {idea.category}
          </Link>
          <Link href="/submit" className="w-full border border-gray-200 text-gray-700 font-medium py-3 rounded-xl text-sm text-center hover:border-gray-300 hover:bg-gray-50 transition-colors">
            Submit another idea →
          </Link>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          This report is private — only accessible via this link.
        </p>
      </div>
    </div>
  );
}