"use client";

import { useMemo } from "react";
import { useAnalysis } from "./AnalysisContext";

type Signal = { text: string; source: "opportunity" | "cross" | "risk" };

const SERIF = "'Playfair Display', serif";
const DISPLAY = "'Oswald', sans-serif";

/**
 * Editorial "Working / Breaking" board.
 *
 * Merges opportunities, risks, and cross-agent insights (split by keyword tone).
 * Rendered as two editorial columns with kicker rules and typographic list rows,
 * no background tints or heavy borders.
 */
<<<<<<< Updated upstream
export function WorkingBreakingBoard({ submissionId }: Props) {
  const [report, setReport] = useState<ApiReport | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchReport = async () => {
      try {
        const res = await fetch(`/api/analysis?submissionId=${submissionId}`);
        const data = await res.json();
        if (!cancelled && data.report) {
          setReport({
            cross_agent_insights: data.report.cross_agent_insights ?? [],
            opportunities: data.report.opportunities ?? [],
            risks: data.report.risks ?? [],
          });
        } else if (!cancelled) {
          setReport({ cross_agent_insights: [], opportunities: [], risks: [] });
        }
      } catch {
        if (!cancelled) setReport({ cross_agent_insights: [], opportunities: [], risks: [] });
      }
    };

    fetchReport();

    const onComplete = (e: Event) => {
      const detail = (e as CustomEvent<{ submissionId?: string }>).detail;
      if (detail?.submissionId === submissionId) fetchReport();
    };
    window.addEventListener("tryflow:analysis_complete", onComplete);

    return () => {
      cancelled = true;
      window.removeEventListener("tryflow:analysis_complete", onComplete);
    };
  }, [submissionId]);
=======
export function WorkingBreakingBoard() {
  const { report, status } = useAnalysis();
>>>>>>> Stashed changes

  const { working, breaking } = useMemo(() => {
    if (!report) return { working: [] as Signal[], breaking: [] as Signal[] };

    const working: Signal[] = report.opportunities.map((t) => ({ text: t, source: "opportunity" }));
    const breaking: Signal[] = report.risks.map((t) => ({ text: t, source: "risk" }));

    const NEG = /\b(risk|risks|challenge|challenges|concern|concerns|problem|issue|hurdle|barrier|threat|weak|weakness|fragile|difficult|hard|expensive|costly|lack|missing|without|no moat|unclear|uncertain|regulated|compliance|saturated|crowded|competitive|commoditized|losing|declining|fading|slow|limited|limitation)\b/i;

    for (const t of report.cross_agent_insights) {
      if (NEG.test(t)) breaking.push({ text: t, source: "cross" });
      else working.push({ text: t, source: "cross" });
    }

    return { working, breaking };
  }, [report]);

  if (status === "pending") {
    return (
      <section
        aria-label="Loading insights"
        className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 mb-14"
      >
        {(["working", "breaking"] as const).map((kind) => (
          <div key={kind}>
            <div className="flex items-center gap-4 mb-6">
              <span
                className="text-[15px] font-medium tracking-[0.35em] uppercase"
                style={{
                  fontFamily: DISPLAY,
                  color: kind === "working" ? "var(--signal-success)" : "var(--signal-danger)",
                  opacity: 0.5,
                }}
              >
                What&apos;s {kind === "working" ? "Working" : "Breaking"}
              </span>
              <span className="flex-1 h-px" style={{ background: "var(--t-border-subtle)" }} />
            </div>
            <ul className="space-y-4">
              {[0, 1, 2].map((j) => (
                <li key={j} className="flex items-start gap-4">
                  <span
                    className="shrink-0 font-mono text-base font-bold w-3 text-center"
                    style={{
                      color: kind === "working" ? "var(--signal-success)" : "var(--signal-danger)",
                      opacity: 0.4,
                    }}
                    aria-hidden
                  >
                    {kind === "working" ? "+" : "−"}
                  </span>
                  <div className="flex-1 space-y-2">
                    <span
                      className="block h-3 rounded-sm animate-pulse"
                      style={{
                        background: "var(--t-border-subtle)",
                        width: j === 0 ? "92%" : j === 1 ? "78%" : "84%",
                      }}
                    />
                    <span
                      className="block h-3 rounded-sm animate-pulse"
                      style={{ background: "var(--t-border-subtle)", width: j === 2 ? "56%" : "64%" }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    );
  }

  if (working.length === 0 && breaking.length === 0) return null;

  return (
    <section
      aria-label="What's working and what's breaking"
      className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 mb-14"
    >
      <Column
        kind="working"
        title="Working"
        items={working}
        emptyText="No positive signals surfaced yet."
      />
      <Column
        kind="breaking"
        title="Breaking"
        items={breaking}
        emptyText="No risks surfaced yet."
      />
    </section>
  );
}

function Column({
  kind,
  title,
  items,
  emptyText,
}: {
  kind: "working" | "breaking";
  title: string;
  items: Signal[];
  emptyText: string;
}) {
  const color = kind === "working" ? "var(--signal-success)" : "var(--signal-danger)";
  const symbol = kind === "working" ? "+" : "−";

  return (
    <div>
      {/* Kicker rule — title in signal color, hairline, count */}
      <div className="flex items-center gap-4 mb-6">
        <span
          className="text-[15px] font-medium tracking-[0.35em] uppercase"
          style={{ fontFamily: DISPLAY, color }}
        >
          What&apos;s {title}
        </span>
        <span className="flex-1 h-px" style={{ background: "var(--t-border-subtle)" }} />
        <span
          className="text-[15px] font-medium tabular-nums tracking-[0.2em] uppercase"
          style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
        >
          {String(items.length).padStart(2, "0")}
        </span>
      </div>

      {items.length === 0 ? (
        <p
          className="text-[15px] italic leading-[1.6]"
          style={{ fontFamily: SERIF, color: "var(--text-tertiary)" }}
        >
          {emptyText}
        </p>
      ) : (
        <ul className="space-y-4">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-4">
              <span
                className="shrink-0 font-mono text-base font-bold leading-[1.4] w-3 text-center"
                style={{ color }}
                aria-hidden="true"
              >
                {symbol}
              </span>
              <p
                className="flex-1 text-[14.5px] leading-[1.65]"
                style={{ color: "var(--text-primary)" }}
              >
                {item.text}
                {item.source === "cross" && (
                  <span
                    className="ml-2 align-middle text-[14px] font-medium tracking-[0.25em] uppercase"
                    style={{
                      fontFamily: DISPLAY,
                      color: "var(--text-tertiary)",
                    }}
                  >
                    cross
                  </span>
                )}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
