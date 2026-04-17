"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { SignalCard } from "@/components/market/SignalCard";
import { CategoryTable, type CategoryRow } from "@/components/market/CategoryTable";
import { TimeRangeToggle, type TimeRange } from "@/components/market/TimeRangeToggle";

/**
 * Raw per-category timeseries data prepared on the server.
 * daily60[0] = 59 days ago, daily60[59] = today. Length always 60.
 */
export interface CategoryRawData {
  category: string;
  daily60: number[];
  allTime: number;
  /** Average viability score across all submissions in this category (null when no scored reports). */
  avgScore: number | null;
  /** Number of scored reports contributing to avgScore. Used to gate quality signals. */
  scoreSample: number;
}

type Direction = "Rising" | "Stable" | "Declining";
type Saturation = "Low" | "Medium" | "High";

interface SignalRow extends CategoryRow {
  /** used for "most crowded" ranking under 'all' range */
  allTime: number;
  /** carried through for quality-driven signals */
  avgScore: number | null;
  scoreSample: number;
}

interface Props {
  rawData: CategoryRawData[];
  isLocked: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function sumTail(arr: number[], n: number): number {
  return arr.slice(Math.max(0, arr.length - n)).reduce((a, b) => a + b, 0);
}

function sumRange(arr: number[], start: number, end: number): number {
  return arr.slice(start, end).reduce((a, b) => a + b, 0);
}

function computeRow(
  raw: CategoryRawData,
  range: TimeRange,
): SignalRow {
  const { daily60, allTime, avgScore, scoreSample } = raw;

  if (range === "7d") {
    const last7  = sumTail(daily60, 7);
    const prev7  = sumRange(daily60, 46, 53); // days 14 ago → 7 ago
    const deltaPct = prev7 === 0
      ? (last7 > 0 ? 100 : 0)
      : Math.round(((last7 - prev7) / prev7) * 100);
    const spark = daily60.slice(-7);
    return {
      category: raw.category,
      volume30d: last7,
      volume7d: prev7,
      deltaPct,
      direction: directionFromDelta(last7, prev7, deltaPct),
      saturation: saturationFromVolume(last7, "7d"),
      sparkline: spark,
      avgScore,
      scoreSample,
      allTime,
    };
  }

  if (range === "30d") {
    const last30 = sumTail(daily60, 30);
    const prev30 = sumRange(daily60, 0, 30);
    const deltaPct = prev30 === 0
      ? (last30 > 0 ? 100 : 0)
      : Math.round(((last30 - prev30) / prev30) * 100);
    const spark = daily60.slice(-30);
    return {
      category: raw.category,
      volume30d: last30,
      // Comparison baseline for Δ% — the 30 days before the "last 30d" window.
      volume7d: prev30,
      deltaPct,
      direction: directionFromDelta(last30, prev30, deltaPct),
      saturation: saturationFromVolume(last30, "30d"),
      sparkline: spark,
      avgScore,
      scoreSample,
      allTime,
    };
  }

  // range === "all" — no comparison baseline; show recency (last 30d) in secondary.
  const last30 = sumTail(daily60, 30);
  const prev30 = sumRange(daily60, 0, 30);
  return {
    category: raw.category,
    volume30d: allTime,
    volume7d: last30,
    deltaPct: 0,
    direction: directionFromDelta(last30, prev30, 0),
    saturation: saturationFromVolume(allTime, "all"),
    sparkline: daily60.slice(-30),
    avgScore,
    scoreSample,
    allTime,
  };
}

function directionFromDelta(current: number, prev: number, deltaPct: number): Direction {
  if (prev === 0 && current >= 1) return "Rising";
  if (current > prev * 1.25 || deltaPct >= 25) return "Rising";
  if (current < prev * 0.75 || deltaPct <= -25) return "Declining";
  return "Stable";
}

function saturationFromVolume(vol: number, range: TimeRange): Saturation {
  // Thresholds scale roughly with the range window
  const [low, mid] = range === "7d" ? [2, 5]
                    : range === "30d" ? [4, 12]
                    : [10, 30];
  if (vol <= low) return "Low";
  if (vol <= mid) return "Medium";
  return "High";
}

// ── Component ──────────────────────────────────────────────────────────────

export function MarketBoard({ rawData, isLocked }: Props) {
  const [range, setRange] = useState<TimeRange>("30d");

  const { rows, momentum, quality, underexplored } = useMemo(() => {
    const rows = rawData
      .map((r) => computeRow(r, range))
      .sort((a, b) => b.volume30d - a.volume30d);

    // Gaining momentum — largest positive period-over-period delta (not 'all' range).
    const momentumCandidate = [...rows]
      .filter((r) => r.volume30d >= 1 && r.deltaPct > 0 && range !== "all")
      .sort((a, b) => b.deltaPct - a.deltaPct)[0] ?? null;

    // Highest quality — best avg viability score (requires ≥2 scored submissions to avoid noise).
    const MIN_QUALITY_SAMPLE = 2;
    const qualityCandidate = [...rows]
      .filter((r) => r.scoreSample >= MIN_QUALITY_SAMPLE && r.avgScore !== null)
      .sort((a, b) => (b.avgScore ?? 0) - (a.avgScore ?? 0))[0] ?? null;

    // Underexplored — high avg score + low volume + not declining.
    // This is the sharpest "real opportunity" signal: quality is good but few founders are here.
    const underexploredCandidate = [...rows]
      .filter(
        (r) =>
          r.scoreSample >= MIN_QUALITY_SAMPLE &&
          (r.avgScore ?? 0) >= 60 &&
          r.saturation === "Low" &&
          r.direction !== "Declining"
      )
      .sort((a, b) => (b.avgScore ?? 0) - (a.avgScore ?? 0))[0] ?? null;

    // Dedupe across signal cards — always prefer showing 3 distinct categories.
    const taken = new Set<string>();
    const pick = (c: SignalRow | null): SignalRow | null => {
      if (!c) return null;
      if (taken.has(c.category)) return null;
      taken.add(c.category);
      return c;
    };

    return {
      rows,
      momentum:      pick(momentumCandidate),
      quality:       pick(qualityCandidate),
      underexplored: pick(underexploredCandidate),
    };
  }, [rawData, range]);

  const rangeLabel = range === "7d" ? "7d" : range === "30d" ? "30d" : "all time";

  return (
    <>
      {/* Signal strip */}
      <section
        aria-label="Market signals"
        className={cn(
          "mb-8 transition-all",
          isLocked && "blur-sm pointer-events-none select-none"
        )}
        aria-hidden={isLocked ? "true" : undefined}
      >
        <div className="flex items-center justify-between mb-3">
          <p
            className="text-[11px] font-semibold tracking-widest uppercase"
            style={{ color: "var(--text-tertiary)" }}
          >
            Key signals
          </p>
          <TimeRangeToggle value={range} onChange={setRange} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. Gaining momentum — period-over-period submission growth */}
          <SignalCard
            type="rising"
            category={momentum?.category ?? null}
            primaryMetric={
              momentum
                ? `${momentum.deltaPct > 0 ? "+" : ""}${momentum.deltaPct}% · ${momentum.volume30d} new`
                : "—"
            }
            secondaryMetric={
              range === "all"
                ? "Switch to 7d or 30d to see momentum"
                : momentum
                  ? `Founder activity vs previous ${rangeLabel}`
                  : `No gaining category this ${rangeLabel}`
            }
            href={momentum ? `/explore/${encodeURIComponent(momentum.category)}` : undefined}
            label="Gaining momentum"
          />

          {/* 2. Highest quality — best avg viability score (≥2 reports) */}
          <SignalCard
            type="crowded"
            category={quality?.category ?? null}
            primaryMetric={
              quality && quality.avgScore !== null
                ? `${quality.avgScore} avg · ${quality.scoreSample} scored`
                : "—"
            }
            secondaryMetric={
              quality
                ? "Highest avg viability across categories"
                : "Need at least 2 scored ideas per category"
            }
            href={quality ? `/explore/${encodeURIComponent(quality.category)}` : undefined}
            label="Highest quality"
          />

          {/* 3. Underexplored — high quality + low volume (the real opportunity) */}
          <SignalCard
            type="open"
            category={underexplored?.category ?? null}
            primaryMetric={
              underexplored && underexplored.avgScore !== null
                ? `${underexplored.avgScore} avg · ${underexplored.volume30d} submitted`
                : "—"
            }
            secondaryMetric={
              underexplored
                ? "Strong quality, few founders here — room to enter"
                : "No underexplored space detected"
            }
            href={underexplored ? `/explore/${encodeURIComponent(underexplored.category)}` : undefined}
            label="Underexplored"
          />
        </div>

        {/* Honest disclaimer about data source */}
        <p
          className="text-[11px] mt-3"
          style={{ color: "var(--text-tertiary)" }}
        >
          * Based on anonymous TryWepp submissions — reflects founder activity on this platform, not real-world market data.
        </p>
      </section>

      {/* Category breakdown table */}
      <div className="relative">
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2
              className="text-sm font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Category breakdown
            </h2>
            <p
              className="text-xs mt-0.5"
              style={{ color: "var(--text-tertiary)" }}
            >
              {range === "all"
                ? "All-time totals · sort by any column · click a row to drill down"
                : `Submissions over the last ${rangeLabel} · sort by any column · click a row to drill down`}
            </p>
          </div>
          {isLocked && (
            <p className="text-xs font-semibold" style={{ color: "var(--text-tertiary)" }}>
              Pro members only
            </p>
          )}
        </div>

        <div
          className={cn(
            "transition-all",
            isLocked && "blur-md pointer-events-none select-none"
          )}
          aria-hidden={isLocked ? "true" : undefined}
        >
          <CategoryTable rows={rows} rangeLabel={range} />
        </div>
      </div>
    </>
  );
}
