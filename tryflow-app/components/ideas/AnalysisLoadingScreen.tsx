"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw, Loader2, CheckCircle2, Circle } from "lucide-react";
import { useAnalysis } from "./AnalysisContext";
import { AGENT_IDS, type AgentId } from "@/lib/viability";
import { DIMENSION_META } from "@/lib/dimensions";

/**
 * AnalysisLoadingScreen — full-bleed loading takeover during AI analysis.
 *
 * 2026-04 교수님 피드백 대응:
 *   "분석된 페이지 형식이 보이는데 그 형식이 아예 안보이고
 *    아이디어 분석 중인 그 내용만 보여야한다"
 *
 * Design choices:
 *   - Replaces ALL report layout while pending — the underlying skeleton/template
 *     is never visible.
 *   - Uses real per-agent progress from AnalysisContext (SSE), not a time-based
 *     simulation. The 6 agent cards flip queued → running → done as events arrive.
 *   - Spotlight area shows the currently-active agent + a 1-line VC quote that
 *     justifies why we evaluate this axis (Andreessen for Market, Graham for
 *     Problem, etc.) — doubles as user education and credibility.
 *   - Reports cap visible progress at ~95% until the actual `complete` event
 *     arrives, so the bar never finishes early on a slow request.
 */

const DISPLAY = "'Inter', sans-serif";
const SERIF = "'Fraunces', serif";

// 1차 출처 인용. F 중간판의 핵심 근거 노출.
// See decisions/evaluation-axes-rationale.md for full citations.
const AXIS_QUOTES: Record<AgentId, { quote: string; author: string }> = {
  market_size: {
    quote:
      "When a great team meets a lousy market, market wins. The market pulls product out of the startup.",
    author: "Marc Andreessen — a16z",
  },
  problem_urgency: {
    quote:
      "Who wants this so much that they'll use it even when it's a crappy version one made by a two-person startup?",
    author: "Paul Graham — Y Combinator",
  },
  timing: {
    quote:
      "Why is now the right moment? Why couldn't this have been built three years ago?",
    author: "Sequoia — 'Why Now' template",
  },
  product: {
    quote:
      "A great company must offer a product 10x better than the closest substitute on a dimension users actually rank by.",
    author: "Peter Thiel — Zero to One",
  },
  defensibility: {
    quote:
      "Competition is for losers. The goal is a monopoly that can sustain itself for years.",
    author: "Peter Thiel — Zero to One",
  },
  business_model: {
    quote:
      "Healthy SaaS economics: CAC payback under 18 months, NRR above 110%, gross margin above 70%.",
    author: "Bessemer — 10 Laws of Cloud",
  },
};

interface Props {
  /** Submitted timestamp string for the header context line. */
  submittedDate?: string;
  /** Where the back link points (defaults to dashboard). */
  backHref?: string;
  /** Idea ID — used for "Edit submission" deep link in the failure state. */
  ideaId?: string;
}

export function AnalysisLoadingScreen({
  submittedDate,
  backHref = "/dashboard",
  ideaId,
}: Props) {
  const router = useRouter();
  const { status, agentProgress, currentStage, spotlightAgent, failureHints } =
    useAnalysis();
  const [retrying, setRetrying] = useState(false);

  // ── Smooth time-based progress for visual continuity ───────────────────────
  // Real per-agent state comes from SSE; the bar's pixel-smooth motion is
  // interpolated so it doesn't jitter between events. Capped at 95 until ready.
  const startedAt = useRef<number>(Date.now());
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (status !== "pending") return;
    const id = setInterval(() => setTick((t) => t + 1), 250);
    return () => clearInterval(id);
  }, [status]);

  const doneCount = AGENT_IDS.filter(
    (id) => agentProgress[id]?.state === "done"
  ).length;
  const runningCount = AGENT_IDS.filter(
    (id) => agentProgress[id]?.state === "running"
  ).length;

  // Real progress (event-driven) takes priority; time fills the gap between
  // events so the bar always advances slightly.
  const eventPct =
    currentStage === "complete"
      ? 100
      : currentStage === "synthesizer"
      ? 90
      : currentStage === "agents"
      ? 15 + (doneCount / AGENT_IDS.length) * 70
      : currentStage === "gate"
      ? 8
      : 3;
  const elapsedMs = Date.now() - startedAt.current;
  const timeBoost = Math.min(2, (tick * 0.05) % 3); // never more than +2 nudge
  const pct = status === "ready" ? 100 : Math.min(95, eventPct + timeBoost);

  const failed = status === "failed";
  // Hints from the LLM quality gate mean the input was rejected for being too
  // vague — that's a content problem, not a system error. Reframe accordingly
  // so the user doesn't feel like they hit a bug.
  const isContentProblem = failed && failureHints.length > 0;
  const stageLabel = STAGE_LABEL[currentStage] ?? "Working…";

  // VC 인용구 — 현재 spotlight agent 가 있으면 그 축의 인용구, 없으면 default.
  const quote = spotlightAgent ? AXIS_QUOTES[spotlightAgent] : null;
  const spotlightMeta = spotlightAgent ? DIMENSION_META[spotlightAgent] : null;

  async function handleRetry() {
    if (retrying) return;
    setRetrying(true);
    try {
      // Reload page; the provider re-attaches and re-opens the SSE stream.
      if (typeof window !== "undefined") window.location.reload();
    } finally {
      setTimeout(() => setRetrying(false), 1500);
    }
  }

  if (status === "ready") return null;

  return (
    <div
      className="relative min-h-[calc(100vh-64px)] overflow-hidden"
      aria-label={failed ? "Analysis failed" : "Analysis in progress"}
      aria-busy={!failed}
    >
      {/* 배경 — 은은한 글로우 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(80% 60% at 50% 0%, var(--accent-soft) 0%, transparent 70%), linear-gradient(180deg, var(--page-bg) 0%, var(--page-bg) 100%)",
        }}
        aria-hidden
      />
      <div
        className="absolute -top-40 left-1/2 -translate-x-1/2 w-[680px] h-[680px] rounded-full blur-3xl opacity-25 pointer-events-none"
        style={{
          background:
            "conic-gradient(from 0deg, var(--accent), transparent 60%, var(--accent))",
          animation: failed ? "none" : "loading-orbit 22s linear infinite",
        }}
        aria-hidden
      />

      <div className="relative max-w-4xl mx-auto px-6 pt-16 pb-16">
        {/* Editorial kicker */}
        <div className="flex items-center gap-4 mb-10">
          <span
            className="inline-flex items-center gap-2.5 text-[13px] font-medium tracking-[0.08em] uppercase shrink-0"
            style={{
              fontFamily: DISPLAY,
              color: failed
                ? isContentProblem
                  ? "var(--signal-warning)"
                  : "var(--signal-danger)"
                : "var(--accent)",
            }}
          >
            <span
              className={
                failed ? "w-2 h-2 rounded-full" : "w-2 h-2 rounded-full animate-pulse"
              }
              style={{
                background: failed
                  ? isContentProblem
                    ? "var(--signal-warning)"
                    : "var(--signal-danger)"
                  : "var(--accent)",
              }}
              aria-hidden
            />
            {failed
              ? isContentProblem
                ? "Needs more detail"
                : "Analysis failed"
              : "AI analysis in progress"}
          </span>
          <span
            className="flex-1 h-px"
            style={{ background: "var(--t-border-subtle)" }}
          />
          <span
            className="text-[12px] font-medium tracking-[0.08em] uppercase shrink-0"
            style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
          >
            6 specialist agents
          </span>
        </div>

        {/* H1 + sublede */}
        <h1
          className="mb-4"
          style={{
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: "clamp(2rem, 4vw, 3rem)",
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
            color: "var(--text-primary)",
          }}
        >
          {failed
            ? isContentProblem
              ? "Your idea needs a bit more detail."
              : "Something went wrong."
            : status === "pending"
            ? stageLabel
            : "Reading your idea."}
        </h1>
        <p
          className="text-[16px] leading-[1.7] mb-10 max-w-2xl"
          style={{ color: "var(--text-secondary)" }}
        >
          {failed
            ? isContentProblem
              ? "Our AI couldn't extract enough information to analyze your idea. Add the missing details below and resubmit — your original submission stays intact."
              : "The AI analysis couldn't complete. You can try again — usually a transient hiccup."
            : `Six specialist agents are reading your submission from six angles${
                submittedDate ? ` · submitted ${submittedDate}` : ""
              }.`}
        </p>

        {/* Progress bar */}
        {!failed && (
          <div className="mb-12">
            <div className="flex items-baseline justify-between mb-2">
              <span
                className="text-[12px] font-medium tracking-[0.08em] uppercase"
                style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
              >
                {currentStage === "agents"
                  ? `${doneCount} of ${AGENT_IDS.length} agents complete`
                  : currentStage === "synthesizer"
                  ? "Synthesizing the verdict"
                  : currentStage === "gate"
                  ? "Quality check"
                  : "Starting"}
              </span>
              <span
                className="text-[12px] font-mono tabular-nums"
                style={{ color: "var(--text-tertiary)" }}
              >
                {Math.floor(pct)}%
              </span>
            </div>
            <div
              className="relative w-full h-[3px] overflow-hidden"
              style={{ background: "var(--t-border-subtle)" }}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.floor(pct)}
            >
              <div
                className="absolute inset-y-0 left-0 transition-[width] duration-500 ease-out"
                style={{ width: `${pct}%`, background: "var(--accent)" }}
              />
            </div>
          </div>
        )}

        {/* Spotlight — currently-active agent + VC quote */}
        {!failed && quote && spotlightMeta && (
          <section
            aria-label="Currently analyzing"
            className="border p-6 mb-10"
            style={{
              background: "var(--accent-soft)",
              borderColor: "var(--accent-ring)",
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Loader2
                className="w-3.5 h-3.5 animate-spin"
                style={{ color: "var(--accent)" }}
                strokeWidth={2}
              />
              <span
                className="text-[12px] font-medium tracking-[0.08em] uppercase"
                style={{ fontFamily: DISPLAY, color: "var(--accent)" }}
              >
                Now analyzing — {spotlightMeta.full}
              </span>
            </div>
            <p
              className="leading-[1.4] mb-3"
              style={{
                fontFamily: SERIF,
                fontStyle: "italic",
                fontWeight: 400,
                fontSize: "clamp(1.1rem, 2vw, 1.4rem)",
                letterSpacing: "-0.01em",
                color: "var(--text-primary)",
              }}
            >
              &ldquo;{quote.quote}&rdquo;
            </p>
            <p
              className="text-[12px] font-medium tracking-[0.06em] uppercase"
              style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
            >
              — {quote.author}
            </p>
          </section>
        )}

        {/* 6-agent grid — live state */}
        {!failed && (
          <section aria-label="Agent pipeline" className="mb-12">
            <div className="flex items-center gap-4 mb-5">
              <span
                className="text-[12px] font-medium tracking-[0.08em] uppercase"
                style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
              >
                The Pipeline
              </span>
              <span
                className="flex-1 h-px"
                style={{ background: "var(--t-border-subtle)" }}
              />
              {runningCount > 0 && (
                <span
                  className="text-[11px] font-medium tracking-[0.06em] uppercase tabular-nums shrink-0"
                  style={{ fontFamily: DISPLAY, color: "var(--accent)" }}
                >
                  {runningCount} running
                </span>
              )}
            </div>

            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {AGENT_IDS.map((id) => (
                <AgentCard
                  key={id}
                  agentId={id}
                  progress={agentProgress[id]}
                  isSpotlight={spotlightAgent === id}
                />
              ))}
            </ul>
          </section>
        )}

        {/* Failed state hints + actions */}
        {failed && (
          <div className="mb-10">
            {failureHints.length > 0 && (
              <div className="mb-6">
                <p
                  className="text-[12px] font-bold tracking-[0.06em] uppercase mb-3"
                  style={{ fontFamily: DISPLAY, color: "var(--signal-warning)" }}
                >
                  Add to your description
                </p>
                <ul
                  className="space-y-2 border-l pl-4"
                  style={{ borderColor: "var(--signal-warning)" }}
                >
                  {failureHints.map((h, i) => (
                    <li
                      key={i}
                      className="text-[14px] leading-[1.6]"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-3">
              {/* Primary action depends on failure type:
                  - Content problem (gate hints present) → Edit submission (prefilled)
                  - Other failure → Try again (just reload, re-runs analysis) */}
              {isContentProblem && ideaId ? (
                <Link
                  href={`/submit?from=${ideaId}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-[13px] font-bold tracking-[0.06em] uppercase text-white transition-[filter] hover:brightness-110"
                  style={{ fontFamily: DISPLAY, background: "var(--accent)" }}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Edit my submission
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={handleRetry}
                  disabled={retrying}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-[13px] font-bold tracking-[0.06em] uppercase text-white transition-[filter] hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ fontFamily: DISPLAY, background: "var(--accent)" }}
                >
                  {retrying ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Retrying…
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      Try again
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Footer — back link */}
        <div className="flex items-center gap-6">
          <Link
            href={backHref}
            className="group inline-flex items-center gap-2 text-[13px] font-medium tracking-[0.08em] uppercase transition-opacity hover:opacity-70"
            style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
          >
            <ArrowLeft
              className="w-3 h-3 transition-transform group-hover:-translate-x-0.5"
              strokeWidth={2}
            />
            Back to dashboard
          </Link>
          {!failed && (
            <p
              className="text-[12px] leading-[1.5]"
              style={{ color: "var(--text-tertiary)" }}
            >
              Reports typically finish within 60–90 seconds. We&apos;ll switch in
              the moment it&apos;s ready.
            </p>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes loading-orbit {
          from {
            transform: translateX(-50%) rotate(0deg);
          }
          to {
            transform: translateX(-50%) rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

const STAGE_LABEL: Record<string, string> = {
  starting: "Reading your idea.",
  gate: "Checking the input.",
  agents: "Running specialist agents.",
  synthesizer: "Drafting the verdict.",
  complete: "Done.",
  failed: "Something went wrong.",
};

// ── AgentCard ────────────────────────────────────────────────────────────────

function AgentCard({
  agentId,
  progress,
  isSpotlight,
}: {
  agentId: AgentId;
  progress: { state: string; passesDone: number; score?: number } | undefined;
  isSpotlight: boolean;
}) {
  const meta = DIMENSION_META[agentId];
  const state = progress?.state ?? "queued";
  const passesDone = progress?.passesDone ?? 0;

  const stateColor =
    state === "done"
      ? "var(--signal-success)"
      : state === "failed"
      ? "var(--signal-danger)"
      : state === "running"
      ? "var(--accent)"
      : "var(--text-tertiary)";

  const stateLabel =
    state === "done"
      ? "Done"
      : state === "failed"
      ? "Failed"
      : state === "running"
      ? `Pass ${Math.max(passesDone, 1)} of 3`
      : "Queued";

  const Icon =
    state === "done" ? CheckCircle2 : state === "running" ? Loader2 : Circle;

  return (
    <li
      className="flex items-start gap-4 p-4 border transition-colors"
      style={{
        background: isSpotlight ? "var(--accent-soft)" : "var(--card-bg)",
        borderColor: isSpotlight
          ? "var(--accent-ring)"
          : "var(--t-border-card)",
        opacity: state === "queued" && !isSpotlight ? 0.55 : 1,
      }}
    >
      <span
        className="shrink-0 mt-0.5"
        style={{ color: stateColor }}
        aria-hidden
      >
        <Icon
          className={`w-4 h-4 ${state === "running" ? "animate-spin" : ""}`}
          strokeWidth={1.75}
          fill={state === "done" ? "currentColor" : "none"}
        />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3 mb-1">
          <span
            className="truncate"
            style={{
              fontFamily: SERIF,
              fontWeight: 700,
              fontSize: "0.95rem",
              letterSpacing: "-0.01em",
              color: "var(--text-primary)",
            }}
          >
            {meta?.full ?? agentId}
          </span>
          <span
            className="text-[10px] font-medium tracking-[0.06em] uppercase shrink-0"
            style={{ fontFamily: DISPLAY, color: stateColor }}
          >
            {stateLabel}
          </span>
        </div>
        <p
          className="text-[12px] leading-[1.5] line-clamp-2"
          style={{ color: "var(--text-tertiary)" }}
        >
          {meta?.description ?? ""}
        </p>
        {/* 2-pass dots (2026-04: Skeptic 을 Judge 에 흡수해서 3→2 passes) */}
        <div className="flex items-center gap-1 mt-2">
          {[1, 2].map((p) => {
            const filled = passesDone >= p;
            const passColor =
              state === "done"
                ? "var(--signal-success)"
                : state === "failed"
                ? "var(--signal-danger)"
                : filled
                ? "var(--accent)"
                : "var(--t-border-bright)";
            return (
              <span
                key={p}
                className="w-1.5 h-1.5 rounded-full transition-colors"
                style={{ background: passColor }}
                aria-hidden
              />
            );
          })}
          <span
            className="ml-1.5 text-[10px] tracking-[0.06em] uppercase tabular-nums"
            style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
          >
            draft · judge
          </span>
        </div>
      </div>
    </li>
  );
}
