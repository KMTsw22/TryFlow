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
  stage: string | null;
  insight_reports: InsightReport | InsightReport[] | null;
  analysis_reports: AnalysisReport | AnalysisReport[] | null;
}

// Stage colors map to semantic signals where possible; neutral for early.
const STAGE_META: Record<string, { label: string; fg: string; bg: string; border: string }> = {
  idea:           { label: "Just an Idea",     fg: "var(--text-tertiary)",  bg: "var(--t-border-subtle)", border: "var(--t-border)" },
  prototype:      { label: "Prototype / Demo", fg: "var(--accent)",         bg: "var(--accent-soft)",      border: "var(--accent-ring)" },
  early_traction: { label: "Early Traction",   fg: "var(--signal-warning)", bg: "rgba(245,158,11,0.10)",   border: "rgba(245,158,11,0.25)" },
  launched:       { label: "Launched",         fg: "var(--signal-success)", bg: "rgba(16,185,129,0.10)",   border: "rgba(16,185,129,0.25)" },
};

interface Props {
  idea: IdeaRow;
  isSubscriber: boolean; // kept for future use
}

type PillStyle = { fg: string; bg: string; border: string };

const TREND_PILL: Record<string, PillStyle> = {
  Rising:    { fg: "var(--signal-success)", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.25)" },
  Stable:    { fg: "var(--signal-warning)", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.25)" },
  Declining: { fg: "var(--signal-danger)",  bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.25)" },
};

// Saturation: low = good (less competition), high = bad.
const SAT_PILL: Record<string, PillStyle> = {
  Low:    { fg: "var(--signal-success)", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.25)" },
  Medium: { fg: "var(--signal-warning)", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.25)" },
  High:   { fg: "var(--signal-danger)",  bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.25)" },
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

function scoreHex(score: number | null) {
  if (score === null) return "var(--text-tertiary)";
  if (score >= 70) return "var(--signal-success)";
  if (score >= 50) return "var(--signal-warning)";
  return "var(--signal-danger)";
}

export function IdeaCardWithContact({ idea }: Props) {
  const report = getReport(idea);
  const aiScore = getAiScore(idea);
  const vScore = aiScore ?? report?.viability_score ?? null;
  const hasAiScore = aiScore !== null;

  const vColor = scoreHex(vScore);

  const trendPill = report ? TREND_PILL[report.trend_direction] ?? TREND_PILL.Stable : null;
  const satPill = report ? SAT_PILL[report.saturation_level] ?? SAT_PILL.Low : null;
  const stageMeta = idea.stage ? STAGE_META[idea.stage] : null;

  return (
    <Link
      href={`/ideas/${idea.id}`}
      className="flex flex-col border p-5 transition-colors cursor-pointer hover:[border-color:var(--accent-ring)]"
      style={{
        background: "var(--card-bg)",
        borderColor: idea.allow_contact ? "var(--accent-ring)" : "var(--t-border-card)",
      }}
    >
      {/* Top row: score + anonymous badge */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex flex-col items-start gap-1">
          <div
            className="flex flex-col items-center justify-center w-12 h-12 rounded-full border"
            style={{
              borderColor: vScore === null ? "var(--t-border-card)" : vColor,
              background: vScore === null ? "var(--card-bg)" : "color-mix(in srgb, " + vColor + " 10%, transparent)",
            }}
          >
            {vScore !== null ? (
              <>
                <span className="text-base font-extrabold leading-none" style={{ color: vColor }}>{vScore}</span>
                <span className="text-[11px] leading-none mt-0.5" style={{ color: "var(--text-tertiary)" }}>/100</span>
              </>
            ) : (
              <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>—</span>
            )}
          </div>
          {hasAiScore && (
            <span className="text-[11px] font-bold" style={{ color: "var(--accent)" }}>✦ AI</span>
          )}
        </div>
        <span
          className="text-[12px] font-bold uppercase tracking-wider pt-1"
          style={{ color: "var(--text-tertiary)" }}
        >
          Anonymous
        </span>
      </div>

      {/* Target user */}
      <p
        className="text-[13px] font-semibold uppercase tracking-wider mb-1.5"
        style={{ color: "var(--accent)" }}
      >
        For: {truncate(idea.target_user, 45)}
      </p>

      {/* Description */}
      <p
        className="text-sm leading-relaxed flex-1 mb-4"
        style={{ color: "var(--text-secondary)" }}
      >
        {truncate(idea.description, 130)}
      </p>

      {/* Bottom row */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {stageMeta && (
          <span
            className="text-[12px] font-bold px-2 py-0.5"
            style={{ color: stageMeta.fg, background: stageMeta.bg, border: `1px solid ${stageMeta.border}` }}
          >
            {stageMeta.label}
          </span>
        )}
        {trendPill && (
          <span
            className="text-[12px] font-bold px-2 py-0.5 rounded-full"
            style={{ color: trendPill.fg, background: trendPill.bg, border: `1px solid ${trendPill.border}` }}
          >
            {report!.trend_direction}
          </span>
        )}
        {satPill && (
          <span
            className="text-[12px] font-bold px-2 py-0.5 rounded-full"
            style={{ color: satPill.fg, background: satPill.bg, border: `1px solid ${satPill.border}` }}
          >
            {report!.saturation_level} sat.
          </span>
        )}
        <span
          className="ml-auto text-[13px] flex items-center gap-0.5"
          style={{ color: "var(--text-tertiary)" }}
        >
          View details <ArrowRight className="w-3 h-3" />
        </span>
      </div>
    </Link>
  );
}
