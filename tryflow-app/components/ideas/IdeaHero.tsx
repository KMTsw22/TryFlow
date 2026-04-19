"use client";

import { useEffect, useMemo, useState } from "react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import { ArrowRight } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

// ── Types ──────────────────────────────────────────────────────────────────
interface Props {
  submissionId: string;
  fallbackScore: number;
  fallbackSummary: string;
  trendDirection: string;
  saturationLevel: string;
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
  market_size: "Market",
  competition: "Competition",
  timing: "Timing",
  monetization: "Revenue",
  technical_difficulty: "Technical",
  regulation: "Regulation",
  defensibility: "Moat",
  user_acquisition: "Acquisition",
};

const AGENT_LABEL_FULL: Record<keyof Analysis, string> = {
  market_size: "Market size",
  competition: "Competition",
  timing: "Timing",
  monetization: "Monetization",
  technical_difficulty: "Technical",
  regulation: "Regulation",
  defensibility: "Defensibility",
  user_acquisition: "Acquisition",
};

function getVerdict(
  score: number,
  trend: string,
  saturation: string,
): { label: string; tone: "success" | "warning" | "danger" } {
  if (score >= 75) {
    if (trend === "Declining" && saturation === "High") {
      return { label: "Strong signal — but timing is tight", tone: "warning" };
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

const TONE_HEX = {
  success: "var(--signal-success)",
  warning: "var(--signal-warning)",
  danger: "var(--signal-danger)",
};

const SERIF = "'Playfair Display', serif";
const DISPLAY = "'Oswald', sans-serif";

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
  const toneHex = TONE_HEX[verdict.tone];

  const { strongest, weakest, radarData, maxScore } = useMemo(() => {
    if (!report?.analysis) {
      return {
        strongest: null,
        weakest: null,
        radarData: [] as { subject: string; value: number }[],
        maxScore: 100,
      };
    }
    const entries = (Object.keys(AGENT_LABEL_FULL) as (keyof Analysis)[])
      .map((key) => ({
        key,
        label: AGENT_LABEL_FULL[key],
        shortLabel: AGENT_LABEL[key],
        score: report.analysis[key]?.score ?? 0,
      }))
      .filter((e) => e.score > 0);

    const sorted = [...entries].sort((a, b) => b.score - a.score);
    const top = Math.max(...entries.map((e) => e.score), 100);
    return {
      strongest: sorted[0] ?? null,
      weakest: sorted[sorted.length - 1] ?? null,
      radarData: entries.map((e) => ({ subject: e.shortLabel, value: e.score })),
      maxScore: top,
    };
  }, [report]);

  return (
    <section
      className="relative py-10 mb-6"
      style={{
        borderTop: "1px solid var(--t-border-subtle)",
        borderBottom: "1px solid var(--t-border-subtle)",
      }}
      aria-label="Viability verdict"
    >
      {/* Kicker rule */}
      <div className="flex items-center gap-4 mb-8">
        <span
          className="text-[15px] font-medium tracking-[0.35em] uppercase"
          style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
        >
          The Verdict
        </span>
        <span className="flex-1 h-px" style={{ background: "var(--t-border-subtle)" }} />
        <span
          className="text-[15px] font-medium tracking-[0.25em] uppercase"
          style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
        >
          {trendDirection} · {saturationLevel} saturation
        </span>
      </div>

      {/* Top grid — Score+verdict (left) | Radar (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,auto)] gap-x-12 gap-y-10 items-center mb-8">
        {/* Left — score + verdict + summary */}
        <div className="min-w-0">
          <div className="flex items-baseline gap-3 mb-6">
            <span
              className="leading-[0.82] tabular-nums"
              style={{
                fontFamily: SERIF,
                fontWeight: 900,
                fontSize: "clamp(6rem, 11vw, 9rem)",
                letterSpacing: "-0.05em",
                color: toneHex,
              }}
            >
              {score}
            </span>
            <span
              className="pb-2 text-sm font-medium tracking-[0.3em] uppercase"
              style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
            >
              / 100
            </span>
          </div>

          <p
            className="leading-[1.15] mb-5"
            style={{
              fontFamily: SERIF,
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: "clamp(1.35rem, 2.4vw, 2rem)",
              letterSpacing: "-0.01em",
              color: "var(--text-primary)",
            }}
          >
            &ldquo;{verdict.label}.&rdquo;
          </p>

          <p
            className="text-[14.5px] leading-[1.75]"
            style={{ color: "var(--text-secondary)" }}
          >
            {summary}
          </p>
        </div>

        {/* Right — radar */}
        {radarData.length > 0 && (
          <div
            className="hidden lg:block w-[300px] h-[260px] shrink-0"
            aria-label="Balance across 8 analysis dimensions"
          >
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="68%" margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                <PolarGrid
                  stroke={isDark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.22)"}
                />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{
                    fill: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.65)",
                    fontSize: 12,
                    fontWeight: 500,
                    letterSpacing: "0.06em",
                  }}
                />
                <Radar
                  dataKey="value"
                  stroke={toneHex}
                  fill={toneHex}
                  fillOpacity={0.14}
                  strokeWidth={1.25}
                  isAnimationActive={false}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Strongest / Weakest — compact rows with bars, unified with CTA below */}
      <div
        className="border-t pt-5"
        style={{ borderColor: "var(--t-border-subtle)" }}
      >
        <DimensionRow label="Strongest" agent={strongest} loading={!report} max={maxScore} />
        <DimensionRow label="Weakest" agent={weakest} loading={!report} max={maxScore} />

        {/* CTA — inline with rows, right-aligned, no extra mt */}
        <div className="flex justify-end pt-4">
          <a
            href={`#${actionAnchor}`}
            className="group inline-flex items-center gap-2 text-[15px] font-medium tracking-[0.3em] uppercase transition-opacity hover:opacity-70"
            style={{ fontFamily: DISPLAY, color: "var(--accent)" }}
          >
            View next actions
            <ArrowRight
              className="w-3 h-3 transition-transform group-hover:translate-x-1"
              strokeWidth={2}
            />
          </a>
        </div>
      </div>
    </section>
  );
}

function DimensionRow({
  label,
  agent,
  loading,
  max,
}: {
  label: string;
  agent: { label: string; score: number } | null;
  loading: boolean;
  max: number;
}) {
  const scoreHex = agent
    ? agent.score >= 70
      ? "var(--signal-success)"
      : agent.score >= 50
      ? "var(--signal-warning)"
      : "var(--signal-danger)"
    : "var(--text-tertiary)";

  const fillPct = agent ? (agent.score / max) * 100 : 0;

  return (
    <div
      className="flex items-center gap-5 py-2.5 border-b"
      style={{ borderColor: "var(--t-border-subtle)" }}
    >
      <span
        className="text-[15px] font-medium tracking-[0.3em] uppercase shrink-0 w-36"
        style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
      >
        {label}
      </span>
      <span
        className="shrink-0 truncate"
        style={{
          fontFamily: SERIF,
          fontWeight: 700,
          fontSize: "1.15rem",
          letterSpacing: "-0.01em",
          color: loading || !agent ? "var(--text-tertiary)" : "var(--text-primary)",
          minWidth: 140,
        }}
      >
        {loading ? "Analysing…" : agent?.label ?? "—"}
      </span>

      {/* Bar */}
      <div
        className="flex-1 h-[2px]"
        style={{ background: "var(--t-border-subtle)" }}
      >
        <div
          className="h-full transition-all duration-700"
          style={{ width: `${fillPct}%`, background: scoreHex }}
        />
      </div>

      <span className="flex items-baseline gap-1 shrink-0 tabular-nums" style={{ minWidth: 56 }}>
        <span
          style={{
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: "1.25rem",
            letterSpacing: "-0.02em",
            color: scoreHex,
          }}
        >
          {agent?.score ?? "—"}
        </span>
        <span
          className="text-[14px] font-medium tracking-[0.2em] uppercase"
          style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
        >
          /100
        </span>
      </span>
    </div>
  );
}
