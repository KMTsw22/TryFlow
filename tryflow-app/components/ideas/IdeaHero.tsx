"use client";

import { useEffect, useMemo, useState } from "react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import { useTheme } from "@/components/ThemeProvider";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────
interface Props {
  submissionId: string;
  fallbackScore: number;
  fallbackSummary: string;
  trendDirection: string;
  saturationLevel: string;
  /** Jump target id for "View next actions" link (e.g. action-dock id on the page) */
  actionAnchor?: string;
}

interface AgentResult {
  score: number;
  assessment?: string;
}

interface Analysis {
  market_size?: AgentResult;
  competition?: AgentResult;
  timing?: AgentResult;
  monetization?: AgentResult;
  technical_difficulty?: AgentResult;
  regulation?: AgentResult;
  defensibility?: AgentResult;
  user_acquisition?: AgentResult;
}

interface ApiReport {
  viability_score: number;
  summary: string;
  analysis: Analysis;
}

const AGENT_LABEL: Record<keyof Analysis, string> = {
  market_size: "Market size",
  competition: "Competition",
  timing: "Timing",
  monetization: "Monetization",
  technical_difficulty: "Technical",
  regulation: "Regulation",
  defensibility: "Defensibility",
  user_acquisition: "Acquisition",
};

// ── Verdict mapping ─────────────────────────────────────────────────────────
function getVerdict(
  score: number,
  trend: string,
  saturation: string,
): { label: string; tone: "success" | "warning" | "danger" } {
  if (score >= 75) {
    if (trend === "Declining" && saturation === "High") {
      return { label: "Strong signal — but timing tight", tone: "warning" };
    }
    return { label: "Strong signal — move fast", tone: "success" };
  }
  if (score >= 60) {
    if (trend === "Rising" && saturation === "Low") {
      return { label: "Early opportunity — validate quickly", tone: "success" };
    }
    if (trend === "Declining") {
      return { label: "Timing risk — watch momentum", tone: "warning" };
    }
    return { label: "Moderate potential — refine your angle", tone: "warning" };
  }
  if (score >= 45) {
    if (trend === "Declining") {
      return { label: "Fading interest — consider pivoting", tone: "danger" };
    }
    return { label: "Needs sharper positioning", tone: "warning" };
  }
  if (trend === "Declining" && saturation === "High") {
    return { label: "Crowded and cooling — rethink", tone: "danger" };
  }
  return { label: "Weak signal — explore adjacent angles", tone: "danger" };
}

const TONE_COLOR = {
  success: { text: "text-emerald-600 dark:text-emerald-400", hex: "#10b981", bg: "rgba(16,185,129,0.12)", ring: "rgba(16,185,129,0.3)" },
  warning: { text: "text-amber-600 dark:text-amber-400",     hex: "#f59e0b", bg: "rgba(245,158,11,0.12)", ring: "rgba(245,158,11,0.3)" },
  danger:  { text: "text-red-600 dark:text-red-400",         hex: "#ef4444", bg: "rgba(239,68,68,0.12)",  ring: "rgba(239,68,68,0.3)" },
};

// ── Component ──────────────────────────────────────────────────────────────
export function IdeaHero({
  submissionId,
  fallbackScore,
  fallbackSummary,
  trendDirection,
  saturationLevel,
  actionAnchor = "next-actions",
}: Props) {
  const { isDark } = useTheme();
  const [report, setReport] = useState<ApiReport | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/analysis?submissionId=${submissionId}`);
        const data = await res.json();
        if (!cancelled && data.report) {
          setReport({
            viability_score: data.report.viability_score,
            summary: data.report.summary,
            analysis: data.report.analysis,
          });
        }
      } catch {
        /* fall back to server-provided summary/score */
      }
    })();
    return () => { cancelled = true; };
  }, [submissionId]);

  const score = report?.viability_score ?? fallbackScore;
  const summary = report?.summary ?? fallbackSummary;
  const verdict = getVerdict(score, trendDirection, saturationLevel);
  const tone = TONE_COLOR[verdict.tone];

  // Derive strongest / weakest agents if analysis is loaded
  const { strongest, weakest, radarData } = useMemo(() => {
    if (!report?.analysis) {
      return { strongest: null, weakest: null, radarData: [] as { subject: string; value: number }[] };
    }
    const entries = (Object.keys(AGENT_LABEL) as (keyof Analysis)[])
      .map((key) => ({
        key,
        label: AGENT_LABEL[key],
        score: report.analysis[key]?.score ?? 0,
      }))
      .filter((e) => e.score > 0);

    const sorted = [...entries].sort((a, b) => b.score - a.score);
    return {
      strongest: sorted[0] ?? null,
      weakest: sorted[sorted.length - 1] ?? null,
      radarData: entries.map((e) => ({ subject: e.label, value: e.score })),
    };
  }, [report]);

  return (
    <div className="mb-6">
      {/* 2-col hero */}
      <div
        className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-px border overflow-hidden"
        style={{
          background: "var(--t-border-card)",
          borderColor: "var(--t-border-card)",
        }}
      >
        {/* LEFT — verdict + score + summary + CTA */}
        <div
          className="p-7 flex flex-col gap-4"
          style={{ background: "var(--card-bg)" }}
        >
          {/* Verdict pill */}
          <div>
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-sm"
              style={{
                background: tone.bg,
                color: tone.hex,
                border: `1px solid ${tone.ring}`,
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: tone.hex }}
              />
              {verdict.label}
            </span>
          </div>

          {/* Score + summary */}
          <div className="flex items-start gap-5">
            <div className="shrink-0">
              <div className="flex items-baseline gap-1">
                <span
                  className={cn("text-6xl font-extrabold font-mono tabular-nums leading-none", tone.text)}
                >
                  {score}
                </span>
                <span
                  className="text-sm font-semibold"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  /100
                </span>
              </div>
              <p
                className="text-[11px] font-semibold tracking-widest uppercase mt-2"
                style={{ color: "var(--text-tertiary)" }}
              >
                Viability score
              </p>
            </div>

            <div className="flex-1 min-w-0">
              <p
                className="text-[15px] leading-relaxed"
                style={{ color: "var(--text-primary)" }}
              >
                {summary}
              </p>
            </div>
          </div>

          {/* CTA — jumps to action dock */}
          <div className="mt-auto pt-3">
            <a
              href={`#${actionAnchor}`}
              className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors"
              style={{ color: "var(--accent)" }}
            >
              View next actions
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </a>
          </div>
        </div>

        {/* RIGHT — mini radar + strongest/weakest */}
        <div
          className="p-6 flex flex-col"
          style={{ background: "var(--card-bg)" }}
        >
          <p
            className="text-[11px] font-semibold tracking-widest uppercase mb-3"
            style={{ color: "var(--text-tertiary)" }}
          >
            8-Dimension balance
          </p>

          {/* Mini radar */}
          <div className="h-[150px] -mx-2" aria-label="Balance of 8 analysis dimensions">
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius="75%">
                  <PolarGrid
                    stroke={isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}
                  />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)", fontSize: 9 }}
                  />
                  <Radar
                    dataKey="value"
                    stroke={tone.hex}
                    fill={tone.hex}
                    fillOpacity={0.2}
                    strokeWidth={1.5}
                    isAnimationActive={false}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div
                className="h-full flex items-center justify-center text-xs animate-pulse"
                style={{ color: "var(--text-tertiary)" }}
              >
                Loading dimensions…
              </div>
            )}
          </div>

          {/* Strongest / Weakest */}
          <div className="mt-4 space-y-2 text-sm">
            <DimensionRow
              label="Strongest"
              agent={strongest}
              arrow="up"
              loading={!report}
            />
            <DimensionRow
              label="Weakest"
              agent={weakest}
              arrow="down"
              loading={!report}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function DimensionRow({
  label,
  agent,
  arrow,
  loading,
}: {
  label: string;
  agent: { label: string; score: number } | null;
  arrow: "up" | "down";
  loading: boolean;
}) {
  const arrowColor =
    arrow === "up"
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-red-600 dark:text-red-400";

  if (loading) {
    return (
      <div className="flex items-center justify-between">
        <span
          className="text-[11px] font-semibold tracking-wider uppercase"
          style={{ color: "var(--text-tertiary)" }}
        >
          {label}
        </span>
        <span
          className="animate-pulse h-3 w-20"
          style={{ background: "var(--t-border-subtle)" }}
        />
      </div>
    );
  }
  if (!agent) {
    return (
      <div className="flex items-center justify-between">
        <span
          className="text-[11px] font-semibold tracking-wider uppercase"
          style={{ color: "var(--text-tertiary)" }}
        >
          {label}
        </span>
        <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
          —
        </span>
      </div>
    );
  }

  const scoreHex =
    agent.score >= 70 ? "#10b981" : agent.score >= 50 ? "#f59e0b" : "#ef4444";
  const scoreText =
    agent.score >= 70 ? "text-emerald-600 dark:text-emerald-400"
      : agent.score >= 50 ? "text-amber-600 dark:text-amber-400"
      : "text-red-600 dark:text-red-400";

  return (
    <div className="flex items-center justify-between">
      <span className="inline-flex items-center gap-1.5">
        <svg
          className={cn("w-3 h-3", arrowColor)}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          {arrow === "up" ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          )}
        </svg>
        <span
          className="text-[11px] font-semibold tracking-wider uppercase"
          style={{ color: "var(--text-tertiary)" }}
        >
          {label}
        </span>
        <span
          className="text-sm font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          {agent.label}
        </span>
      </span>
      <span className="inline-flex items-center gap-1.5 shrink-0">
        <span className={cn("font-mono text-sm font-bold tabular-nums", scoreText)}>
          {agent.score}
        </span>
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: scoreHex }} />
      </span>
    </div>
  );
}

