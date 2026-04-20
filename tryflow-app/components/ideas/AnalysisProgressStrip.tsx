"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { useAnalysis } from "./AnalysisContext";

const DISPLAY = "'Oswald', sans-serif";
const SERIF = "'Playfair Display', serif";

// Rough per-agent time budget so the bar feels like it's doing something.
// Real backend doesn't stream progress, so this is a time-based simulation
// capped at 95% until the poll actually returns a report.
const TOTAL_ESTIMATE_MS = 45_000;
const AGENT_STAGES = [
  "Initializing 8-agent system",
  "Market size — TAM / SAM",
  "Competition — landscape mapping",
  "Timing — market window",
  "Monetization — revenue models",
  "Technical — build complexity",
  "Regulation — compliance",
  "Defensibility — moats",
  "Acquisition — GTM channels",
  "Synthesizing final report",
];

interface Props {
  submissionId: string;
}

/**
 * A prominent, narrative progress section that replaces the fragmented
 * per-component spinners. Shows:
 *   - A time-based progress bar that caps at 95% until the report truly arrives
 *   - A cycling stage label so the user knows the AI is actively working
 *   - An inline retry button when polling expired without a report
 *
 * Disappears (fades out) once status flips to "ready".
 */
export function AnalysisProgressStrip({ submissionId }: Props) {
  const { status } = useAnalysis();
  const [elapsedMs, setElapsedMs] = useState(0);
  const [retrying, setRetrying] = useState(false);
  const startedAt = useRef<number | null>(null);

  useEffect(() => {
    if (status !== "pending") return;
    startedAt.current = Date.now();
    const id = setInterval(() => {
      if (startedAt.current != null) {
        setElapsedMs(Date.now() - startedAt.current);
      }
    }, 250);
    return () => clearInterval(id);
  }, [status]);

  if (status === "ready") return null;

  // Time-based percent, capped at 95 until the API actually returns.
  const pct = Math.min(95, (elapsedMs / TOTAL_ESTIMATE_MS) * 100);
  const stageIdx = Math.min(
    AGENT_STAGES.length - 1,
    Math.floor((pct / 95) * AGENT_STAGES.length)
  );
  const stageLabel = AGENT_STAGES[stageIdx];

  const failed = status === "failed";

  async function handleRetry() {
    if (retrying) return;
    setRetrying(true);
    try {
      await fetch("/api/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId }),
      });
    } catch {
      /* ignore — we reload regardless so the context picks up fresh state */
    }
    // Reload so the shared context re-fetches and swaps from failed → pending.
    if (typeof window !== "undefined") window.location.reload();
  }

  return (
    <section
      aria-live="polite"
      className="border-y"
      style={{
        background: "var(--accent-soft)",
        borderColor: failed ? "var(--signal-danger)" : "var(--accent-ring)",
      }}
    >
      <div className="max-w-5xl mx-auto px-6 py-5">
        <div className="flex items-baseline gap-4 mb-3">
          <span
            className="inline-flex items-center gap-2.5 text-[13px] font-medium tracking-[0.35em] uppercase shrink-0"
            style={{
              fontFamily: DISPLAY,
              color: failed ? "var(--signal-danger)" : "var(--accent)",
            }}
          >
            <span
              className={failed ? "w-2 h-2 rounded-full" : "w-2 h-2 rounded-full animate-pulse"}
              style={{ background: failed ? "var(--signal-danger)" : "var(--accent)" }}
              aria-hidden
            />
            {failed ? "AI analysis didn’t finish" : "AI analysis in progress"}
          </span>
          <span
            className="flex-1 h-px"
            style={{ background: failed ? "var(--signal-danger)" : "var(--accent-ring)" }}
          />
          <span
            className="text-[13px] font-medium tracking-[0.3em] uppercase shrink-0"
            style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
          >
            {failed ? "Action needed" : "8 specialist agents"}
          </span>
        </div>

        <p
          className="text-[17px] leading-[1.45] mb-4 max-w-3xl"
          style={{
            fontFamily: SERIF,
            fontStyle: "italic",
            fontWeight: 400,
            color: "var(--text-primary)",
          }}
        >
          {failed
            ? "The 8-agent analysis didn’t complete — the score shown below is the preliminary heuristic reading. Run the full analysis to get the real AI verdict."
            : `${stageLabel}…`}
        </p>

        {failed ? (
          <button
            type="button"
            onClick={handleRetry}
            disabled={retrying}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-[13px] font-bold tracking-[0.25em] uppercase text-white transition-[filter] hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ fontFamily: DISPLAY, background: "var(--accent)" }}
          >
            {retrying ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Starting…
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                Run AI analysis now
              </>
            )}
          </button>
        ) : (
          <div
            className="relative w-full h-[3px] rounded-full overflow-hidden"
            style={{ background: "var(--t-border-subtle)" }}
          >
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-300 ease-out"
              style={{ width: `${pct}%`, background: "var(--accent)" }}
            />
          </div>
        )}
      </div>
    </section>
  );
}
