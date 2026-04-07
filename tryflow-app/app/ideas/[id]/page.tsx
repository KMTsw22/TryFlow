import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { BarChart3 } from "lucide-react";
import DeepAnalysis from "@/components/DeepAnalysis";

interface Report {
  viability_score: number;
  saturation_level: string;
  trend_direction: string;
  similar_count: number;
  summary: string;
  ai_description: string | null;
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
      insight_reports (viability_score, saturation_level, trend_direction, similar_count, summary, ai_description)
    `)
    .eq("id", id)
    .single();

  if (error || !data) notFound();

  const idea = data as unknown as Idea;
  const report = getReport(idea);
  const date = new Date(idea.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  // Navbar (shared)
  const Navbar = (
    <nav className="bg-white border-b border-gray-100 px-6 h-[60px] flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2">
        <img src="/logo.png" className="w-7 h-7 " alt="Try.Wepp" />
        <span className="font-bold text-gray-900 text-sm">Try.Wepp</span>
      </Link>
      <div className="flex items-center gap-3">
        <Link href="/explore" className="text-sm text-gray-500 hover:text-gray-800 transition-colors flex items-center gap-1.5">
          <BarChart3 className="w-4 h-4" /> Trends
        </Link>
        <Link href="/submit" className="bg-indigo-500 text-white text-sm font-bold px-4 py-2  hover:bg-indigo-400 transition-colors">
          Submit another →
        </Link>
      </div>
    </nav>
  );

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50">
        {Navbar}
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="w-16 h-16  bg-indigo-50 flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl animate-spin inline-block">⟳</span>
          </div>
          <h1 className="text-xl font-extrabold text-gray-900 mb-2">Report is being generated</h1>
          <p className="text-sm text-gray-400 mb-8">Your idea was submitted on {date}. The insight report is being processed — check back shortly.</p>
          <Link href="/submit" className="inline-flex items-center gap-2 bg-indigo-500 text-white font-bold px-6 py-3  text-sm hover:bg-indigo-400 transition-colors">
            Submit another idea →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {Navbar}

      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 text-xs font-bold px-3 py-1.5 rounded-full mb-4">
            Your Personal Insight Report
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">Here&apos;s what we found.</h1>
          <p className="text-sm text-gray-400 mt-2">Submitted {date} · {idea.category}</p>
        </div>

        {/* 1. Idea Summary */}
        <div className="bg-white  border border-gray-100 p-6 mb-4 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Idea Summary</p>

          {/* AI Description */}
          {report.ai_description && (
            <div className="bg-indigo-50 border border-indigo-100 p-4 mb-4">
              <div className="flex items-center gap-1.5 mb-2">
                <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">AI Description</span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{report.ai_description}</p>
            </div>
          )}

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

        {/* 2-7. Overall Signal + Deep Analysis */}
        <DeepAnalysis
          submissionId={idea.id}
          fallbackScore={report.viability_score}
          fallbackSummary={report.summary}
          trendDirection={report.trend_direction}
          saturationLevel={report.saturation_level}
          similarCount={report.similar_count}
        />

        {/* CTAs */}
        <div className="flex flex-col gap-3">
          <Link href="/explore" className="w-full bg-indigo-500 text-white font-bold py-3  text-sm text-center hover:bg-indigo-400 transition-colors flex items-center justify-center gap-2">
            <BarChart3 className="w-4 h-4" /> Explore market trends in {idea.category}
          </Link>
          <Link href="/submit" className="w-full border border-gray-200 text-gray-700 font-medium py-3  text-sm text-center hover:border-gray-300 hover:bg-gray-50 transition-colors">
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