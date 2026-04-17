"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUp, ArrowDown, ArrowUpDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sparkline } from "@/components/ui/Sparkline";
import { TrendLabel, type TrendDirection } from "@/components/ui/TrendLabel";

export interface CategoryRow {
  category: string;
  volume30d: number;
  volume7d: number;
  deltaPct: number;
  direction: TrendDirection;
  saturation: "Low" | "Medium" | "High";
  sparkline: number[];
  /** Average viability score across scored submissions in this category (null when unscored). */
  avgScore: number | null;
  /** How many submissions contributed to avgScore (used for small-sample treatment). */
  scoreSample: number;
}

type SortKey = "volume30d" | "volume7d" | "saturation" | "avgScore";
type SortDir = "asc" | "desc";

interface Props {
  rows: CategoryRow[];
  /** Controls column header labels and whether delta column shows values */
  rangeLabel?: "7d" | "30d" | "all";
}

const HEADER_LABELS: Record<NonNullable<Props["rangeLabel"]>, {
  primary: string;
  primaryTitle: string;
  secondary: string;
  secondaryTitle: string;
  sparkline: string;
  primarySortKey: SortKey;
}> = {
  "7d": {
    primary: "Last 7d",
    primaryTitle: "Submissions in the last 7 days",
    secondary: "Prev 7d",
    secondaryTitle: "Submissions in the 7 days before that (days 8–14 ago) — Δ% baseline",
    sparkline: "7-day activity",
    primarySortKey: "volume30d",
  },
  "30d": {
    primary: "Last 30d",
    primaryTitle: "Submissions in the last 30 days",
    secondary: "Prev 30d",
    secondaryTitle: "Submissions in the 30 days before that (days 31–60 ago) — Δ% baseline",
    sparkline: "30-day activity",
    primarySortKey: "volume30d",
  },
  "all": {
    primary: "Total",
    primaryTitle: "All-time submissions in this category",
    secondary: "Last 30d",
    secondaryTitle: "Submissions in the last 30 days (recency indicator; no Δ% comparison for all-time)",
    sparkline: "Recent activity",
    primarySortKey: "volume30d",
  },
};

const SATURATION_ORDER: Record<CategoryRow["saturation"], number> = {
  Low: 0,
  Medium: 1,
  High: 2,
};

const SAT_LABEL: Record<CategoryRow["saturation"], { text: string; color: string }> = {
  Low:    { text: "Low",    color: "text-emerald-600 dark:text-emerald-400" },
  Medium: { text: "Medium", color: "text-amber-600 dark:text-amber-400" },
  High:   { text: "High",   color: "text-orange-600 dark:text-orange-400" },
};

export function CategoryTable({ rows, rangeLabel = "30d" }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("volume30d");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const labels = HEADER_LABELS[rangeLabel];

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sorted = [...rows].sort((a, b) => {
    let diff = 0;
    if (sortKey === "saturation") {
      diff = SATURATION_ORDER[a.saturation] - SATURATION_ORDER[b.saturation];
    } else if (sortKey === "avgScore") {
      // Push nulls to the end regardless of sort direction.
      const aScore = a.avgScore ?? -1;
      const bScore = b.avgScore ?? -1;
      diff = aScore - bScore;
    } else {
      diff = (a[sortKey] as number) - (b[sortKey] as number);
    }
    return sortDir === "asc" ? diff : -diff;
  });

  // Column grid template — reused between header and rows.
  const gridTemplate =
    "minmax(0, 1.2fr) 70px 70px 75px 105px minmax(0, 1fr) 85px 24px";

  return (
    <div
      className="border overflow-hidden"
      style={{ background: "var(--card-bg)", borderColor: "var(--t-border-card)" }}
    >
      {/* Table header */}
      <div
        className="grid items-center gap-4 px-5 py-3 border-b text-[11px] font-semibold tracking-wider uppercase"
        style={{
          borderColor: "var(--t-border)",
          gridTemplateColumns: gridTemplate,
          color: "var(--text-tertiary)",
        }}
      >
        <div>Category</div>
        <SortHeader label={labels.primary}   active={sortKey === "volume30d"} dir={sortDir} onClick={() => handleSort("volume30d")} align="right" title={labels.primaryTitle} />
        <SortHeader label={labels.secondary} active={sortKey === "volume7d"}  dir={sortDir} onClick={() => handleSort("volume7d")}  align="right" title={labels.secondaryTitle} />
        <SortHeader
          label="Avg"
          active={sortKey === "avgScore"}
          dir={sortDir}
          onClick={() => handleSort("avgScore")}
          align="right"
          title="Average viability score across scored submissions"
        />
        <div>Trend</div>
        <div>{labels.sparkline}</div>
        <SortHeader
          label="Density"
          active={sortKey === "saturation"}
          dir={sortDir}
          onClick={() => handleSort("saturation")}
          align="left"
          title="Submission density on TryWepp — not real-world market saturation"
        />
        <div />
      </div>

      {/* Rows */}
      {sorted.length === 0 ? (
        <div
          className="px-5 py-12 text-center text-sm"
          style={{ color: "var(--text-tertiary)" }}
        >
          No category data yet.
        </div>
      ) : (
        <ul className="divide-y" style={{ borderColor: "var(--t-border-subtle)" }}>
          {sorted.map((r) => {
            const sat = SAT_LABEL[r.saturation];
            const sparkTone: "positive" | "danger" | "muted" =
              r.direction === "Rising" ? "positive"
                : r.direction === "Declining" ? "danger"
                : "muted";

            // Quality — needs ≥2 samples to be trustworthy
            const avgAvailable = r.avgScore !== null && r.scoreSample > 0;
            const avgNoisy = avgAvailable && r.scoreSample < 2;
            const avgHex = !avgAvailable
              ? null
              : r.avgScore! >= 70 ? "#10b981"
                : r.avgScore! >= 50 ? "#f59e0b"
                : "#ef4444";
            const avgText = !avgAvailable
              ? null
              : r.avgScore! >= 70 ? "text-emerald-600 dark:text-emerald-400"
                : r.avgScore! >= 50 ? "text-amber-600 dark:text-amber-400"
                : "text-red-600 dark:text-red-400";

            return (
              <li key={r.category}>
                <Link
                  href={`/explore/${encodeURIComponent(r.category)}`}
                  className="grid items-center gap-4 px-5 py-4 text-sm transition-colors group hover:bg-[color:var(--t-border-subtle)]"
                  style={{ gridTemplateColumns: gridTemplate }}
                >
                  {/* Category name */}
                  <div className="min-w-0">
                    <p
                      className="font-semibold truncate"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {r.category}
                    </p>
                  </div>

                  {/* 30d */}
                  <div
                    className="text-right font-mono tabular-nums font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {r.volume30d}
                  </div>

                  {/* 7d */}
                  <div
                    className="text-right font-mono tabular-nums"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {r.volume7d}
                  </div>

                  {/* Avg score */}
                  <div
                    className="flex items-center justify-end gap-1.5"
                    title={
                      !avgAvailable
                        ? "No scored submissions yet"
                        : avgNoisy
                          ? `Based on only ${r.scoreSample} submission — may be noisy`
                          : `Avg of ${r.scoreSample} scored submission${r.scoreSample === 1 ? "" : "s"}`
                    }
                  >
                    {avgAvailable ? (
                      <>
                        <span
                          className={cn(
                            "font-mono tabular-nums font-semibold text-[13px]",
                            avgText,
                            avgNoisy && "opacity-60"
                          )}
                        >
                          {r.avgScore}
                          {avgNoisy && <span className="ml-0.5">*</span>}
                        </span>
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ background: avgHex!, opacity: avgNoisy ? 0.6 : 1 }}
                        />
                      </>
                    ) : (
                      <span
                        className="font-mono text-[13px]"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        —
                      </span>
                    )}
                  </div>

                  {/* Trend */}
                  <div>
                    <TrendLabel direction={r.direction} />
                  </div>

                  {/* Sparkline */}
                  <div className="min-w-0">
                    <Sparkline
                      points={r.sparkline}
                      tone={sparkTone}
                      width={95}
                      height={22}
                      ariaLabel={`Submission trend for ${r.category}`}
                    />
                  </div>

                  {/* Density (formerly Saturation) */}
                  <div className={cn("font-medium text-[13px]", sat.color)}>
                    {sat.text}
                  </div>

                  {/* Chevron */}
                  <ChevronRight
                    className="w-4 h-4 justify-self-end transition-all group-hover:translate-x-0.5"
                    style={{ color: "var(--text-tertiary)" }}
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {/* Footnote for the small-sample asterisk in the Avg column */}
      {sorted.some((r) => r.avgScore !== null && r.scoreSample < 2) && (
        <div
          className="px-5 py-2 text-[11px] border-t"
          style={{
            borderColor: "var(--t-border-subtle)",
            color: "var(--text-tertiary)",
          }}
        >
          * Based on fewer than 2 scored submissions — may be noisy.
        </div>
      )}
    </div>
  );
}

function SortHeader({
  label,
  active,
  dir,
  onClick,
  align = "left",
  title,
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
  align?: "left" | "right";
  title?: string;
}) {
  const Icon = !active ? ArrowUpDown : dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "inline-flex items-center gap-1 transition-colors select-none",
        align === "right" ? "justify-end" : "justify-start",
        active
          ? "text-[color:var(--text-primary)]"
          : "text-[color:var(--text-tertiary)] hover:text-[color:var(--text-secondary)]"
      )}
    >
      {label}
      <Icon className="w-3 h-3 opacity-70" />
    </button>
  );
}
