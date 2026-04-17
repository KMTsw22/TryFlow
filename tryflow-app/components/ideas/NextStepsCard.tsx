"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

interface Props {
  submissionId: string;
  /** Hide the card until the analysis is loaded and has next_steps */
  fallbackVisible?: boolean;
}

interface ApiReport {
  next_steps: string[];
}

/**
 * Hoisted "This week's next 3 actions" card.
 * Rendered above the Analysis section so decision-makers see action before deep dive.
 * Fetches the same /api/analysis endpoint as DeepAnalysis (cheap, cached on the server).
 */
export function NextStepsCard({ submissionId }: Props) {
  const [steps, setSteps] = useState<string[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/analysis?submissionId=${submissionId}`);
        const data = await res.json();
        if (!cancelled && data.report?.next_steps) {
          setSteps(data.report.next_steps as string[]);
        } else if (!cancelled) {
          setSteps([]);
        }
      } catch {
        if (!cancelled) setSteps([]);
      }
    })();
    return () => { cancelled = true; };
  }, [submissionId]);

  // Hide the block entirely until we know there's something to show.
  if (steps === null) {
    return (
      <div
        className="border p-5 mb-6"
        style={{ background: "var(--card-bg)", borderColor: "var(--t-border-card)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="h-3 w-40 animate-pulse" style={{ background: "var(--t-border-subtle)" }} />
          <div className="h-3 w-16 animate-pulse" style={{ background: "var(--t-border-subtle)" }} />
        </div>
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-11 animate-pulse"
              style={{ background: "var(--t-border-subtle)" }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (steps.length === 0) return null;

  // Heuristic effort labels based on index — simple surface, no backend change.
  const EFFORT_BY_INDEX = ["2h", "1d", "1w", "2w", "—"];
  const topSteps = steps.slice(0, 3);

  return (
    <section
      className="border p-5 mb-6"
      style={{
        background: "linear-gradient(135deg, var(--accent-soft) 0%, var(--card-bg) 100%)",
        borderColor: "var(--accent-ring)",
      }}
      aria-label="Recommended next actions"
    >
      <div className="flex items-baseline justify-between mb-4">
        <h2
          className="text-sm font-semibold inline-flex items-center gap-1.5"
          style={{ color: "var(--text-primary)" }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "var(--accent)" }}
            aria-hidden="true"
          />
          This week&apos;s next actions
        </h2>
        <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
          Top {topSteps.length}
        </p>
      </div>

      <ol className="space-y-2">
        {topSteps.map((step, i) => (
          <li
            key={i}
            className="flex items-start gap-3 p-3 border"
            style={{
              background: "var(--card-bg)",
              borderColor: "var(--t-border-card)",
            }}
          >
            <span
              className="w-6 h-6 flex items-center justify-center text-[11px] font-bold font-mono shrink-0"
              style={{
                background: "var(--accent)",
                color: "#fff",
              }}
            >
              {i + 1}
            </span>
            <p
              className="flex-1 text-sm leading-relaxed"
              style={{ color: "var(--text-primary)" }}
            >
              {step}
            </p>
            <span
              className="shrink-0 text-[10px] font-mono tabular-nums font-semibold px-2 py-0.5 border"
              style={{
                color: "var(--text-tertiary)",
                borderColor: "var(--t-border-card)",
              }}
              title="Rough effort estimate"
            >
              {EFFORT_BY_INDEX[i] ?? "—"}
            </span>
          </li>
        ))}
      </ol>

      {steps.length > 3 && (
        <p
          className="text-[11px] mt-3 inline-flex items-center gap-1"
          style={{ color: "var(--text-tertiary)" }}
        >
          {steps.length - 3} more steps in the full analysis below
          <ArrowRight className="w-3 h-3" />
        </p>
      )}
    </section>
  );
}
