"use client";

import { useEffect, useMemo, useState } from "react";

interface Props {
  submissionId: string;
}

interface ApiReport {
  cross_agent_insights: string[];
  opportunities: string[];
  risks: string[];
}

type Signal = { text: string; source: "opportunity" | "cross" | "risk" };

/**
 * Unified "What's working / What's breaking" view.
 *
 * Merges three concepts that used to live as separate sections:
 *  - Opportunities → Working
 *  - Risks → Breaking
 *  - Cross-agent insights → split into Working or Breaking by simple keyword cue
 *
 * Shows a balanced 2-column at-a-glance list.
 */
export function WorkingBreakingBoard({ submissionId }: Props) {
  const [report, setReport] = useState<ApiReport | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
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
    })();
    return () => { cancelled = true; };
  }, [submissionId]);

  const { working, breaking } = useMemo(() => {
    if (!report) return { working: [] as Signal[], breaking: [] as Signal[] };

    const working: Signal[] = report.opportunities.map((t) => ({ text: t, source: "opportunity" }));
    const breaking: Signal[] = report.risks.map((t) => ({ text: t, source: "risk" }));

    // Split cross-agent insights by lightweight negative-tone heuristic.
    const NEG = /\b(risk|risks|challenge|challenges|concern|concerns|problem|issue|hurdle|barrier|threat|weak|weakness|fragile|difficult|hard|expensive|costly|lack|missing|without|no moat|unclear|uncertain|regulated|compliance|saturated|crowded|competitive|commoditized|losing|declining|fading|slow|limited|limitation)\b/i;

    for (const t of report.cross_agent_insights) {
      if (NEG.test(t)) breaking.push({ text: t, source: "cross" });
      else working.push({ text: t, source: "cross" });
    }

    return { working, breaking };
  }, [report]);

  // Loading: render an aligned skeleton so layout doesn't jump
  if (!report) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="border p-5"
            style={{ background: "var(--card-bg)", borderColor: "var(--t-border-card)" }}
          >
            <div className="h-3 w-24 mb-4 animate-pulse" style={{ background: "var(--t-border-subtle)" }} />
            <div className="space-y-2">
              {[0, 1, 2].map((j) => (
                <div key={j} className="h-4 animate-pulse" style={{ background: "var(--t-border-subtle)" }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (working.length === 0 && breaking.length === 0) return null;

  return (
    <section
      aria-label="What's working and what's breaking"
      className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"
    >
      <Column
        kind="working"
        title="What's working"
        items={working}
        emptyText="No positive signals surfaced yet."
      />
      <Column
        kind="breaking"
        title="What's breaking"
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
  const accent =
    kind === "working"
      ? { hex: "#10b981", soft: "rgba(16,185,129,0.06)", ring: "rgba(16,185,129,0.2)", text: "text-emerald-600 dark:text-emerald-400" }
      : { hex: "#ef4444", soft: "rgba(239,68,68,0.04)", ring: "rgba(239,68,68,0.2)",  text: "text-red-600 dark:text-red-400" };

  const symbol = kind === "working" ? "+" : "−";

  return (
    <div
      className="border p-5"
      style={{ background: accent.soft, borderColor: accent.ring }}
    >
      <div className="flex items-baseline justify-between mb-4">
        <h3 className={`text-xs font-bold tracking-widest uppercase ${accent.text}`}>
          {title}
        </h3>
        <span className="text-[11px] font-mono tabular-nums" style={{ color: "var(--text-tertiary)" }}>
          {items.length}
        </span>
      </div>

      {items.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
          {emptyText}
        </p>
      ) : (
        <ul className="space-y-2.5">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span
                className={`shrink-0 font-mono font-bold leading-tight w-3.5 text-center ${accent.text}`}
                aria-hidden="true"
              >
                {symbol}
              </span>
              <p
                className="flex-1 text-sm leading-relaxed"
                style={{ color: "var(--text-primary)" }}
              >
                {item.text}
                {item.source === "cross" && (
                  <span
                    className="ml-2 text-[10px] font-semibold tracking-wider uppercase align-middle"
                    style={{ color: "var(--text-tertiary)" }}
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
