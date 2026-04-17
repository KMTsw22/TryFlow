import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { timeAgo } from "@/lib/categories";

export interface WeeklyBucket {
  /** ISO string for the oldest day in this 7-day bucket (inclusive). */
  startISO: string;
  count: number;
}

export interface InsightPanelData {
  /** Weekly buckets, oldest→newest. Typically length 4 (past 4 weeks). */
  weeklyBuckets: WeeklyBucket[];
  /** Total submissions across the weekly buckets. */
  totalThis: number;
  /** Total for the equivalent previous period (same number of weeks). */
  totalPrev: number;
  /** ISO timestamp of most recent submission in this category (any time). */
  lastActivityAt: string | null;
  /** Top extracted keywords from idea descriptions */
  topKeywords: { word: string; count: number }[];
}

interface Props {
  data: InsightPanelData;
}

const dateFmt = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });

export function CategoryInsightPanel({ data }: Props) {
  const { weeklyBuckets, totalThis, totalPrev, lastActivityAt, topKeywords } = data;

  const weeks = weeklyBuckets.length;
  const periodLabel = `${weeks} week${weeks === 1 ? "" : "s"}`;

  const deltaAbs = totalThis - totalPrev;
  const isNewPeriod = totalPrev === 0 && totalThis > 0;
  const deltaPct = totalPrev === 0
    ? 0
    : Math.round(((totalThis - totalPrev) / totalPrev) * 100);

  const trendDir: "up" | "down" | "flat" =
    deltaAbs > 0 ? "up" : deltaAbs < 0 ? "down" : "flat";

  const TIcon = trendDir === "up" ? TrendingUp : trendDir === "down" ? TrendingDown : Minus;
  const deltaColor =
    trendDir === "up" ? "text-emerald-600 dark:text-emerald-400"
    : trendDir === "down" ? "text-red-600 dark:text-red-400"
    : "text-zinc-500 dark:text-zinc-400";

  const deltaLabel = isNewPeriod
    ? `New vs previous ${periodLabel}`
    : deltaAbs === 0
      ? `No change vs previous ${periodLabel}`
      : `${deltaPct > 0 ? "+" : ""}${deltaPct}% vs previous ${periodLabel}`;

  // Peak week
  const peakBucket = weeklyBuckets.reduce<WeeklyBucket | null>((best, b) => {
    if (b.count === 0) return best;
    if (!best || b.count > best.count) return b;
    return best;
  }, null);
  const peakLabel = peakBucket
    ? `${peakBucket.count} ${peakBucket.count === 1 ? "idea" : "ideas"} · week of ${dateFmt.format(new Date(peakBucket.startISO))}`
    : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Volume card — span 2 */}
      <div
        className="md:col-span-2 border p-5"
        style={{
          background: "var(--card-bg)",
          borderColor: "var(--t-border-card)",
        }}
      >
        <div className="flex items-start justify-between mb-5">
          <p
            className="text-[11px] font-semibold tracking-widest uppercase"
            style={{ color: "var(--text-tertiary)" }}
          >
            Submissions · last {periodLabel}
          </p>
          <span className={`inline-flex items-center gap-1 text-xs font-semibold ${deltaColor}`}>
            <TIcon className="w-3.5 h-3.5" />
            {deltaLabel}
          </span>
        </div>

        {/* Big number */}
        <div className="flex items-baseline gap-2 mb-5">
          <span
            className="font-mono tabular-nums text-5xl font-bold leading-none"
            style={{ color: "var(--text-primary)" }}
          >
            {totalThis}
          </span>
          <span
            className="text-xs"
            style={{ color: "var(--text-tertiary)" }}
          >
            ideas this period
          </span>
        </div>

        {/* Weekly bar chart */}
        <WeeklyBars buckets={weeklyBuckets} />

        {/* Context lines */}
        <div
          className="mt-5 pt-4 border-t space-y-2 text-xs"
          style={{ borderColor: "var(--t-border-subtle)" }}
        >
          <ContextRow label="Most recent" value={lastActivityAt ? timeAgo(lastActivityAt) : "—"} />
          <ContextRow label="Peak week" value={peakLabel ?? "—"} />
          <ContextRow
            label={`Previous ${periodLabel}`}
            value={<span className="font-mono tabular-nums">{totalPrev}</span>}
          />
        </div>
      </div>

      {/* Top keywords — span 1 */}
      <div
        className="border p-5"
        style={{
          background: "var(--card-bg)",
          borderColor: "var(--t-border-card)",
        }}
      >
        <p
          className="text-[11px] font-semibold tracking-widest uppercase mb-4"
          style={{ color: "var(--text-tertiary)" }}
        >
          Top keywords
        </p>
        {topKeywords.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Not enough data yet.
          </p>
        ) : (
          <ul className="space-y-2.5">
            {topKeywords.map((kw, i) => (
              <li key={kw.word} className="flex items-center justify-between">
                <span className="flex items-center gap-2 min-w-0">
                  <span
                    className="text-[11px] font-mono tabular-nums w-4 shrink-0"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {i + 1}
                  </span>
                  <span
                    className="text-sm font-medium truncate"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {kw.word}
                  </span>
                </span>
                <span
                  className="text-xs font-mono tabular-nums font-semibold shrink-0 ml-3"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {kw.count}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ContextRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span style={{ color: "var(--text-tertiary)" }}>{label}</span>
      <span className="font-medium" style={{ color: "var(--text-primary)" }}>
        {value}
      </span>
    </div>
  );
}

/**
 * Weekly bar chart — a small number of wide bars (typically 4) with
 * a Y-axis max label and week-start labels underneath each bar.
 */
function WeeklyBars({ buckets }: { buckets: WeeklyBucket[] }) {
  const max = Math.max(...buckets.map((b) => b.count), 1);
  const chartPxHeight = 120;
  const BAR_MAX_WIDTH = 56; // keep bars readable, not chunky

  return (
    <div>
      <div className="flex items-stretch">
        {/* Y-axis scale */}
        <div
          className="flex flex-col justify-between items-end text-[10px] font-mono tabular-nums pr-3 shrink-0"
          style={{ color: "var(--text-tertiary)", height: chartPxHeight }}
          aria-hidden
        >
          <span className="flex items-center gap-1.5">
            <span
              className="text-[9px] font-sans font-medium tracking-wide uppercase"
              style={{ color: "var(--text-tertiary)", opacity: 0.7 }}
            >
              ideas / wk
            </span>
            <span>{max}</span>
          </span>
          <span>0</span>
        </div>

        {/* Bars */}
        <div
          className="flex-1 flex items-end border-b"
          style={{ height: chartPxHeight, borderColor: "var(--t-border)" }}
        >
          {buckets.map((b, i) => {
            const ratio = b.count / max;
            const isEmpty = b.count === 0;
            const startLabel = dateFmt.format(new Date(b.startISO));
            const label = `Week of ${startLabel}: ${b.count} ${b.count === 1 ? "idea" : "ideas"}`;
            return (
              <div
                key={i}
                className="flex-1 flex flex-col justify-end items-center relative"
                style={{ height: "100%" }}
                title={label}
              >
                <div
                  className="w-full flex flex-col justify-end items-center"
                  style={{ maxWidth: BAR_MAX_WIDTH, height: "100%" }}
                >
                  {!isEmpty && (
                    <span
                      className="text-[10px] font-mono tabular-nums font-semibold mb-1"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {b.count}
                    </span>
                  )}
                  <div
                    className="w-full"
                    style={{
                      height: isEmpty ? 2 : `${Math.max(ratio * 100, 4)}%`,
                      background: isEmpty ? "var(--t-border)" : "var(--accent)",
                      opacity: isEmpty ? 0.5 : 0.9,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* X-axis week-start labels */}
      <div
        className="flex mt-2"
        style={{ paddingLeft: "calc(5ch + 0.75rem)" }}
        aria-hidden
      >
        {buckets.map((b, i) => (
          <div
            key={i}
            className="flex-1 text-center text-[10px] font-medium"
            style={{ color: "var(--text-tertiary)" }}
          >
            {dateFmt.format(new Date(b.startISO))}
          </div>
        ))}
      </div>
    </div>
  );
}
