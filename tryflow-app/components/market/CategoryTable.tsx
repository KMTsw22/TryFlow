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
  avgScore: number | null;
  scoreSample: number;
}

type SortKey = "volume30d" | "volume7d" | "saturation" | "avgScore";
type SortDir = "asc" | "desc";

interface Props {
  rows: CategoryRow[];
  rangeLabel?: "7d" | "30d" | "all";
}

const SERIF = "'Playfair Display', serif";
const DISPLAY = "'Oswald', sans-serif";

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
    secondaryTitle: "Submissions 8–14 days ago — Δ% baseline",
    sparkline: "7-day activity",
    primarySortKey: "volume30d",
  },
  "30d": {
    primary: "Last 30d",
    primaryTitle: "Submissions in the last 30 days",
    secondary: "Prev 30d",
    secondaryTitle: "Submissions 31–60 days ago — Δ% baseline",
    sparkline: "30-day activity",
    primarySortKey: "volume30d",
  },
  "all": {
    primary: "Total",
    primaryTitle: "All-time submissions in this category",
    secondary: "Last 30d",
    secondaryTitle: "Last-30-day recency",
    sparkline: "Recent activity",
    primarySortKey: "volume30d",
  },
};

const SATURATION_ORDER: Record<CategoryRow["saturation"], number> = {
  Low: 0,
  Medium: 1,
  High: 2,
};

const SAT_COLOR: Record<CategoryRow["saturation"], string> = {
  Low: "var(--signal-success)",
  Medium: "var(--signal-warning)",
  High: "var(--signal-danger)",
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
      const aScore = a.avgScore ?? -1;
      const bScore = b.avgScore ?? -1;
      diff = aScore - bScore;
    } else {
      diff = (a[sortKey] as number) - (b[sortKey] as number);
    }
    return sortDir === "asc" ? diff : -diff;
  });

  const gridTemplate =
    "minmax(0, 1.2fr) 72px 72px 80px 110px minmax(0, 1fr) 90px 20px";

  const noisyAvgPresent = sorted.some(
    (r) => r.avgScore !== null && r.scoreSample < 2,
  );

  return (
    <div>
      {/* Table header */}
      <div
        className="grid items-baseline gap-4 py-3 border-t border-b"
        style={{
          borderColor: "var(--t-border-subtle)",
          gridTemplateColumns: gridTemplate,
        }}
      >
        <div
          className="text-[14px] font-medium tracking-[0.3em] uppercase"
          style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
        >
          Category
        </div>
        <SortHeader
          label={labels.primary}
          active={sortKey === "volume30d"}
          dir={sortDir}
          onClick={() => handleSort("volume30d")}
          align="right"
          title={labels.primaryTitle}
        />
        <SortHeader
          label={labels.secondary}
          active={sortKey === "volume7d"}
          dir={sortDir}
          onClick={() => handleSort("volume7d")}
          align="right"
          title={labels.secondaryTitle}
        />
        <SortHeader
          label="Avg"
          active={sortKey === "avgScore"}
          dir={sortDir}
          onClick={() => handleSort("avgScore")}
          align="right"
          title="Average viability score across scored submissions"
        />
        <div
          className="text-[14px] font-medium tracking-[0.3em] uppercase"
          style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
        >
          Trend
        </div>
        <div
          className="text-[14px] font-medium tracking-[0.3em] uppercase"
          style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
        >
          Activity
        </div>
        <SortHeader
          label="Density"
          active={sortKey === "saturation"}
          dir={sortDir}
          onClick={() => handleSort("saturation")}
          align="left"
          title="Submission density on TryWepp — not real-world saturation"
        />
        <div />
      </div>

      {/* Rows */}
      {sorted.length === 0 ? (
        <div
          className="py-16 text-center text-[15px] italic"
          style={{ fontFamily: SERIF, color: "var(--text-tertiary)" }}
        >
          No category data yet.
        </div>
      ) : (
        <ul>
          {sorted.map((r) => {
            // Sparkline intentionally uses a muted neutral tone — trend is already
            // communicated by the TrendLabel's directional icon in the next column.
            // Coloring the sparkline too turns the whole table into a sea of green.
            const avgAvailable = r.avgScore !== null && r.scoreSample > 0;
            const avgNoisy = avgAvailable && r.scoreSample < 2;

            return (
              <li
                key={r.category}
                className="border-b"
                style={{ borderColor: "var(--t-border-subtle)" }}
              >
                <Link
                  href={`/explore/${encodeURIComponent(r.category)}`}
                  className="grid items-center gap-4 py-2 transition-opacity group hover:opacity-80"
                  style={{ gridTemplateColumns: gridTemplate }}
                >
                  {/* Category */}
                  <div className="min-w-0">
                    <p
                      className="truncate"
                      style={{
                        fontFamily: SERIF,
                        fontWeight: 700,
                        fontSize: "1.1rem",
                        letterSpacing: "-0.01em",
                        color: "var(--text-primary)",
                      }}
                    >
                      {r.category}
                    </p>
                  </div>

                  {/* Primary volume */}
                  <div
                    className="text-right tabular-nums"
                    style={{
                      fontFamily: SERIF,
                      fontWeight: 700,
                      fontSize: "1.15rem",
                      letterSpacing: "-0.01em",
                      color: "var(--text-primary)",
                    }}
                  >
                    {r.volume30d}
                  </div>

                  {/* Secondary volume */}
                  <div
                    className="text-right tabular-nums"
                    style={{
                      fontFamily: SERIF,
                      fontWeight: 500,
                      fontSize: "1rem",
                      color: "var(--text-tertiary)",
                    }}
                  >
                    {r.volume7d}
                  </div>

                  {/* Avg score */}
                  <div
                    className="flex items-baseline justify-end gap-1.5"
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
                          className={cn("tabular-nums", avgNoisy && "opacity-60")}
                          style={{
                            fontFamily: SERIF,
                            fontWeight: 900,
                            fontSize: "1.15rem",
                            letterSpacing: "-0.02em",
                            color: "var(--text-primary)",
                          }}
                        >
                          {r.avgScore}
                          {avgNoisy && (
                            <span className="ml-0.5 text-[0.6em]">*</span>
                          )}
                        </span>
                      </>
                    ) : (
                      <span
                        className="text-[13px]"
                        style={{
                          fontFamily: DISPLAY,
                          color: "var(--text-tertiary)",
                        }}
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
                      tone="muted"
                      width={100}
                      height={22}
                      ariaLabel={`Submission trend for ${r.category}`}
                    />
                  </div>

                  {/* Density */}
                  <div className="inline-flex items-center gap-2">
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: SAT_COLOR[r.saturation] }}
                      aria-hidden
                    />
                    <span
                      className="text-[15px] font-medium tracking-[0.2em] uppercase"
                      style={{
                        fontFamily: DISPLAY,
                        color: "var(--text-secondary)",
                      }}
                    >
                      {r.saturation}
                    </span>
                  </div>

                  {/* Chevron */}
                  <ChevronRight
                    className="w-3.5 h-3.5 justify-self-end transition-transform group-hover:translate-x-0.5"
                    style={{ color: "var(--text-tertiary)" }}
                    strokeWidth={1.75}
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {noisyAvgPresent && (
        <p
          className="mt-3 text-[14px] font-medium tracking-[0.25em] uppercase"
          style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
        >
          * Fewer than 2 scored submissions — may be noisy
        </p>
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
        "inline-flex items-center gap-1.5 text-[14px] font-medium tracking-[0.3em] uppercase transition-colors select-none",
        align === "right" ? "justify-end" : "justify-start",
      )}
      style={{
        fontFamily: DISPLAY,
        color: active ? "var(--text-primary)" : "var(--text-tertiary)",
      }}
    >
      {label}
      <Icon className="w-3 h-3 opacity-70" strokeWidth={2} />
    </button>
  );
}
