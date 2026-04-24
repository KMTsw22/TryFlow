"use client";

import { useMemo } from "react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { ArrowRight, Heart } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { useAnalysis } from "./AnalysisContext";
import { HeartButton } from "./HeartButton";

// ── Types ──────────────────────────────────────────────────────────────────
// fallbackScore / fallbackSummary are nullable: parent passes null when no
// AI-grade data is available yet. In that case we render skeleton/error UI
// instead of leaking the heuristic insight score (교수님 피드백 #3).
interface Props {
  fallbackScore: number | null;
  fallbackSummary: string | null;
  trendDirection: string;
  saturationLevel: string;
  actionAnchor?: string;
  /** Idea ID — required when heart button is shown. */
  ideaId?: string;
  /** Initial saved (heart-filled) state for the current viewer. */
  isSaved?: boolean;
  /** True for logged-out viewers — heart click redirects to /login. */
  isAnonymous?: boolean;
  /** True when the viewer is the idea's owner — shows save count badge. */
  isOwner?: boolean;
  /** Total times this idea has been saved. Only displayed when isOwner=true. */
  saveCount?: number;
}

interface AgentResult {
  score: number;
  assessment?: string;
}

// 2026-04 refactor: 8 axes → 6. See decisions/evaluation-axes-rationale.md.
interface Analysis {
  market_size?: AgentResult;
  problem_urgency?: AgentResult;
  timing?: AgentResult;
  product?: AgentResult;
  defensibility?: AgentResult;
  business_model?: AgentResult;
}

interface ApiReport {
  viability_score: number;
  summary: string;
  analysis: Analysis;
}

const AGENT_LABEL: Record<keyof Analysis, string> = {
  market_size: "Market",
  problem_urgency: "Problem",
  timing: "Timing",
  product: "Product",
  defensibility: "Moat",
  business_model: "Model",
};

const AGENT_LABEL_FULL: Record<keyof Analysis, string> = {
  market_size: "Market size",
  problem_urgency: "Problem & urgency",
  timing: "Timing",
  product: "Product (10x)",
  defensibility: "Moat & defensibility",
  business_model: "Business model",
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

const SERIF = "'Fraunces', serif";
const DISPLAY = "'Inter', sans-serif";

// ── Component ──────────────────────────────────────────────────────────────
export function IdeaHero({
  fallbackScore,
  fallbackSummary,
  trendDirection,
  saturationLevel,
  actionAnchor = "next-actions",
  ideaId,
  isSaved = false,
  isAnonymous = false,
  isOwner = false,
  saveCount = 0,
}: Props) {
  const { isDark } = useTheme();
  const { report, status } = useAnalysis();
  const isPending = status === "pending";
  const isFailed = status === "failed";

  // Prefer AI-graded score; fall back to the (nullable) heuristic only when
  // the parent explicitly passes one. When score is null → we render skeleton/
  // error instead of a fake number.
  const score: number | null = report?.viability_score ?? fallbackScore;
  const summary: string | null = report?.summary ?? fallbackSummary;
  const hasScore = typeof score === "number";
  // verdict/scoreHex only make sense when we have a real number. Guarded here
  // so downstream render code can stay simple.
  const verdict = hasScore
    ? getVerdict(score, trendDirection, saturationLevel)
    : null;
  // The big numeric score follows the project-wide threshold convention so
  // the same score displays the same color everywhere (dashboard cards,
  // detail hero, deep-analysis ring, compare, etc).
  //   ≥70 → success, ≥50 → warning, <50 → danger
  const scoreHex = !hasScore
    ? "var(--text-tertiary)"
    : score >= 70
    ? "var(--signal-success)"
    : score >= 50
    ? "var(--signal-warning)"
    : "var(--signal-danger)";
  // Verdict label (italic quote) keeps its contextual phrasing — a 49 in a
  // low-saturation rising market reads differently than a 49 in a crowded
  // declining market — but the score color itself stays consistent with the
  // rest of the app.

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
      aria-label="Signal verdict"
    >
      {/* Kicker rule */}
      <div className="flex items-center gap-4 mb-8">
        <span
          className="text-[15px] font-medium tracking-[0.08em] uppercase"
          style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
        >
          The Verdict
        </span>
        <span className="flex-1 h-px" style={{ background: "var(--t-border-subtle)" }} />

        {/* Owner-only save count — "N VCs saved this" 동기부여 신호 */}
        {isOwner && saveCount > 0 && (
          <span
            className="inline-flex items-center gap-1.5 text-[13px] font-medium tracking-[0.06em] uppercase shrink-0"
            style={{ fontFamily: DISPLAY, color: "#ef4444" }}
            title="Number of users who saved your idea"
          >
            <Heart className="w-3.5 h-3.5" fill="currentColor" strokeWidth={1.5} />
            {saveCount} saved
          </span>
        )}

        {/* Heart toggle — visible to non-owners (and to owner without count badge) */}
        {ideaId && !isOwner && (
          <HeartButton
            ideaId={ideaId}
            initialSaved={isSaved}
            isAnonymous={isAnonymous}
            variant="ghost"
            size="md"
          />
        )}

        <span
          className="text-[15px] font-medium tracking-[0.06em] uppercase"
          style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
        >
          {trendDirection} · {saturationLevel} saturation
        </span>
      </div>

      {/* Top grid — Score+verdict (left) | Radar (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,auto)] gap-x-12 gap-y-10 items-center mb-8">
        {/* Left — score + verdict + summary.
            Skeletonized not only while pending but also when the analysis
            failed or no real score is available, so the heuristic fallback
            never leaks into the hero (교수님 피드백 #3). The top-of-page
            AnalysisProgressStrip carries the retry CTA in failed state. */}
        <div className="min-w-0">
          {(isPending || isFailed || !hasScore) ? (
            <>
              <div className="flex items-baseline gap-3 mb-6">
                <span
                  className="block rounded-md animate-pulse"
                  style={{
                    background: "var(--t-border-subtle)",
                    width: "clamp(9rem, 16vw, 14rem)",
                    height: "clamp(5rem, 9vw, 7.5rem)",
                  }}
                  aria-label="Score loading"
                />
                <span
                  className="pb-2 text-sm font-medium tracking-[0.08em] uppercase"
                  style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)", opacity: 0.6 }}
                >
                  / 100
                </span>
              </div>
              <div className="space-y-3 mb-5">
                <span
                  className="block h-6 rounded-sm animate-pulse"
                  style={{ background: "var(--t-border-subtle)", width: "72%" }}
                />
                <span
                  className="block h-6 rounded-sm animate-pulse"
                  style={{ background: "var(--t-border-subtle)", width: "48%" }}
                />
              </div>
              <div className="space-y-2">
                <span
                  className="block h-3 rounded-sm animate-pulse"
                  style={{ background: "var(--t-border-subtle)", width: "96%" }}
                />
                <span
                  className="block h-3 rounded-sm animate-pulse"
                  style={{ background: "var(--t-border-subtle)", width: "88%" }}
                />
                <span
                  className="block h-3 rounded-sm animate-pulse"
                  style={{ background: "var(--t-border-subtle)", width: "64%" }}
                />
              </div>
            </>
          ) : (
            <>
              <div className="flex items-baseline gap-3 mb-6">
                <span
                  className="leading-[0.82] tabular-nums"
                  style={{
                    fontFamily: SERIF,
                    fontWeight: 900,
                    fontSize: "clamp(6rem, 11vw, 9rem)",
                    letterSpacing: "-0.05em",
                    color: scoreHex,
                  }}
                >
                  {score}
                </span>
                <span
                  className="pb-2 text-sm font-medium tracking-[0.08em] uppercase"
                  style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
                >
                  / 100
                </span>
              </div>

              {verdict && (
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
              )}

              <p
                className="text-[14.5px] leading-[1.75]"
                style={{ color: "var(--text-secondary)" }}
              >
                {summary}
              </p>
            </>
          )}
        </div>

        {/* Right — radar */}
        {radarData.length > 0 && (
          <div
            className="hidden lg:block w-[300px] h-[260px] shrink-0"
            aria-label="Balance across 6 analysis dimensions"
          >
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="68%" margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                <PolarGrid
                  stroke={isDark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.22)"}
                />
                {/* Fix: recharts auto-scales radius to dataMax by default,
                    which made an 85점 chart look as "full" as a 40점 chart
                    (교수님 피드백 #1). Pinning the domain to [0, 100] makes
                    the polygon area reflect the actual 0-100 score. */}
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  axisLine={false}
                  tick={false}
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
                  stroke={scoreHex}
                  fill={scoreHex}
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
        <DimensionRow label="Strongest" agent={strongest} loading={isPending} max={maxScore} />
        <DimensionRow label="Weakest" agent={weakest} loading={isPending} max={maxScore} />

        {/* CTA — inline with rows, right-aligned, no extra mt */}
        <div className="flex justify-end pt-4">
          <a
            href={`#${actionAnchor}`}
            className="group inline-flex items-center gap-2 text-[15px] font-medium tracking-[0.08em] uppercase transition-opacity hover:opacity-70"
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
        className="text-[15px] font-medium tracking-[0.08em] uppercase shrink-0 w-36"
        style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
      >
        {label}
      </span>
      {loading ? (
        <span
          className="shrink-0 h-3 rounded-sm animate-pulse"
          style={{ background: "var(--t-border-subtle)", width: 120, minWidth: 120 }}
          aria-label={`${label} loading`}
        />
      ) : (
        <span
          className="shrink-0 truncate"
          style={{
            fontFamily: SERIF,
            fontWeight: 700,
            fontSize: "1.15rem",
            letterSpacing: "-0.01em",
            color: agent ? "var(--text-primary)" : "var(--text-tertiary)",
            minWidth: 140,
          }}
        >
          {agent?.label ?? "—"}
        </span>
      )}

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
          {agent?.score ?? (loading ? "" : "—")}
        </span>
        {!loading && (
          <span
            className="text-[14px] font-medium tracking-[0.06em] uppercase"
            style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
          >
            /100
          </span>
        )}
      </span>
    </div>
  );
}
