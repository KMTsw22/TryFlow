"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface InsightReport {
  viability_score: number;
  saturation_level: string;
  trend_direction: string;
  summary: string;
}

interface AnalysisReport {
  viability_score: number;
}

interface IdeaRow {
  id: string;
  category: string;
  target_user: string;
  description: string;
  created_at: string;
  allow_contact: boolean;
  insight_reports: InsightReport | InsightReport[] | null;
  analysis_reports: AnalysisReport | AnalysisReport[] | null;
}

interface Props {
  idea: IdeaRow;
  isSubscriber: boolean; // kept for future use
}

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

function truncate(text: string, max: number) {
  return text.length > max ? text.slice(0, max) + "…" : text;
}

function getReport(idea: IdeaRow): InsightReport | null {
  if (!idea.insight_reports) return null;
  if (Array.isArray(idea.insight_reports)) return idea.insight_reports[0] ?? null;
  return idea.insight_reports;
}

function getAiScore(idea: IdeaRow): number | null {
  if (!idea.analysis_reports) return null;
  const r = Array.isArray(idea.analysis_reports) ? idea.analysis_reports[0] : idea.analysis_reports;
  return r?.viability_score ?? null;
}

export function IdeaCardWithContact({ idea }: Props) {
  const report = getReport(idea);
  const aiScore = getAiScore(idea);
  const vScore = aiScore ?? report?.viability_score ?? null;
  const hasAiScore = aiScore !== null;

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
      href={`/ideas/${idea.id}`}
      className="flex flex-col border p-5 transition-all duration-200 hover:bg-white/[0.04] hover:border-indigo-500/30 cursor-pointer"
      style={{
        background: "rgba(255,255,255,0.03)",
        borderColor: idea.allow_contact ? "rgba(129,140,248,0.2)" : "rgba(255,255,255,0.07)",
      }}
    >
      {/* Top row: score + anonymous badge */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex flex-col items-start gap-1">
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
          {hasAiScore && (
            <span className="text-[9px] font-bold text-indigo-400">✦ AI</span>
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

      {/* Bottom row */}
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
        <span className="ml-auto text-[11px] text-gray-500 flex items-center gap-0.5">
          자세히 보기 <ArrowRight className="w-3 h-3" />
        </span>
      </div>
    </Link>
  );
}
