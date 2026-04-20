"use client";

import { ArrowRight } from "lucide-react";
import { useAnalysis } from "./AnalysisContext";

const SERIF = "'Playfair Display', serif";
const DISPLAY = "'Oswald', sans-serif";

/**
 * Editorial "This week's actions" — numbered rows separated by hairline rules.
 * Reads next_steps from shared AnalysisContext.
 */
export function NextStepsCard() {
  const { report, status } = useAnalysis();

<<<<<<< Updated upstream
  useEffect(() => {
    let cancelled = false;
    const fetchSteps = async () => {
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
    };

    fetchSteps();

    const onComplete = (e: Event) => {
      const detail = (e as CustomEvent<{ submissionId?: string }>).detail;
      if (detail?.submissionId === submissionId) fetchSteps();
    };
    window.addEventListener("tryflow:analysis_complete", onComplete);

    return () => {
      cancelled = true;
      window.removeEventListener("tryflow:analysis_complete", onComplete);
    };
  }, [submissionId]);

  if (steps === null) {
=======
  if (status === "pending") {
>>>>>>> Stashed changes
    return (
      <section className="mb-14" aria-label="Loading next actions">
        <KickerRule title="This Week" />
        <div>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex items-baseline gap-6 py-6 border-b"
              style={{ borderColor: "var(--t-border-subtle)" }}
            >
              <span
                className="shrink-0"
                style={{
                  fontFamily: SERIF,
                  fontWeight: 900,
                  fontSize: "2.5rem",
                  letterSpacing: "-0.03em",
                  color: "var(--text-tertiary)",
                  width: "3.5rem",
                  opacity: 0.5,
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="flex-1 space-y-2">
                <span
                  className="block h-3 rounded-sm animate-pulse"
                  style={{ background: "var(--t-border-subtle)", width: "90%" }}
                />
                <span
                  className="block h-3 rounded-sm animate-pulse"
                  style={{ background: "var(--t-border-subtle)", width: "60%" }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  const steps = report?.next_steps ?? [];
  if (steps.length === 0) return null;

  const EFFORT_BY_INDEX = ["2 hours", "1 day", "1 week", "2 weeks", "—"];
  const topSteps = steps.slice(0, 3);

  return (
    <section className="mb-14" aria-label="Recommended next actions">
      <KickerRule
        title="This Week"
        right={`${topSteps.length} ${topSteps.length === 1 ? "action" : "actions"}`}
      />

      <ol>
        {topSteps.map((step, i) => (
          <li
            key={i}
            className="flex items-baseline gap-6 py-6 border-b"
            style={{ borderColor: "var(--t-border-subtle)" }}
          >
            <span
              className="shrink-0 tabular-nums leading-none"
              style={{
                fontFamily: SERIF,
                fontWeight: 900,
                fontSize: "2.5rem",
                letterSpacing: "-0.03em",
                color: "var(--text-tertiary)",
                width: "3.5rem",
              }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <p
              className="flex-1 text-[15.5px] leading-[1.7]"
              style={{ color: "var(--text-primary)" }}
            >
              {step}
            </p>
            <span
              className="shrink-0 text-[15px] font-medium tracking-[0.3em] uppercase"
              style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
              title="Rough effort estimate"
            >
              {EFFORT_BY_INDEX[i] ?? "—"}
            </span>
          </li>
        ))}
      </ol>

      {steps.length > 3 && (
        <p
          className="mt-5 inline-flex items-center gap-2 text-[15px] font-medium tracking-[0.3em] uppercase"
          style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
        >
          {steps.length - 3} more in the full analysis
          <ArrowRight className="w-3 h-3" />
        </p>
      )}
    </section>
  );
}

function KickerRule({ title, right }: { title: string; right?: string | null }) {
  return (
    <div className="flex items-center gap-4 mb-8">
      <span
        className="text-[15px] font-medium tracking-[0.35em] uppercase"
        style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
      >
        {title}
      </span>
      <span className="flex-1 h-px" style={{ background: "var(--t-border-subtle)" }} />
      {right && (
        <span
          className="text-[15px] font-medium tracking-[0.25em] uppercase shrink-0"
          style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
        >
          {right}
        </span>
      )}
    </div>
  );
}
