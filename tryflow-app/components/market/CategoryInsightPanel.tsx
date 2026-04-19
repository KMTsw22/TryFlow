import { timeAgo } from "@/lib/categories";

export interface WeeklyBucket {
  startISO: string;
  count: number;
}

export interface InsightPanelData {
  weeklyBuckets: WeeklyBucket[];
  totalThis: number;
  totalPrev: number;
  lastActivityAt: string | null;
  topKeywords: { word: string; count: number }[];
}

interface Props {
  data: InsightPanelData;
}

const SERIF = "'Playfair Display', serif";
const DISPLAY = "'Oswald', sans-serif";

const dateFmt = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });

export function CategoryInsightPanel({ data }: Props) {
  const { weeklyBuckets, totalThis, totalPrev, lastActivityAt, topKeywords } = data;

  const weeks = weeklyBuckets.length;
  const periodLabel = `${weeks} week${weeks === 1 ? "" : "s"}`;

  const deltaAbs = totalThis - totalPrev;
  const isNewPeriod = totalPrev === 0 && totalThis > 0;
  const deltaPct =
    totalPrev === 0 ? 0 : Math.round(((totalThis - totalPrev) / totalPrev) * 100);

  const trendDir: "up" | "down" | "flat" =
    deltaAbs > 0 ? "up" : deltaAbs < 0 ? "down" : "flat";

  const deltaHex =
    trendDir === "up" ? "var(--signal-success)" : trendDir === "down" ? "var(--signal-danger)" : "var(--text-tertiary)";

  const deltaCopy = isNewPeriod
    ? `+${totalThis} new`
    : deltaAbs === 0
    ? "No change"
    : `${deltaPct > 0 ? "+" : ""}${deltaPct}% vs prev`;

  const peakBucket = weeklyBuckets.reduce<WeeklyBucket | null>((best, b) => {
    if (b.count === 0) return best;
    if (!best || b.count > best.count) return b;
    return best;
  }, null);
  const peakLabel = peakBucket
    ? `${peakBucket.count} · week of ${dateFmt.format(new Date(peakBucket.startISO))}`
    : "—";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-10">
      {/* Submissions section */}
      <section>
        <div className="flex items-center gap-4 mb-8">
          <span
            className="text-[15px] font-medium tracking-[0.35em] uppercase"
            style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
          >
            Submissions · {periodLabel}
          </span>
          <span className="flex-1 h-px" style={{ background: "var(--t-border-subtle)" }} />
          <span
            className="text-[14px] font-medium tracking-[0.25em] uppercase shrink-0"
            style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
          >
            Last {periodLabel}
          </span>
        </div>

        {/* Hero row: big number + delta on top, sparkline below */}
        <div className="flex flex-col gap-8 mb-10">
          <div>
            <div className="flex items-baseline gap-4 mb-2">
              <span
                className="tabular-nums leading-[0.82]"
                style={{
                  fontFamily: SERIF,
                  fontWeight: 900,
                  fontSize: "clamp(4.5rem, 9vw, 7rem)",
                  letterSpacing: "-0.045em",
                  color: "var(--text-primary)",
                }}
              >
                {totalThis}
              </span>
              <span
                className="pb-2 text-[14px] font-medium tracking-[0.25em] uppercase tabular-nums"
                style={{ fontFamily: DISPLAY, color: deltaHex }}
              >
                {deltaCopy}
              </span>
            </div>
            <p
              className="text-[14px] font-medium tracking-[0.3em] uppercase"
              style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
            >
              ideas this period
            </p>
          </div>

          {/* Sparkline area chart */}
          <div>
            <WeeklySpark buckets={weeklyBuckets} accentHex={deltaHex} />
          </div>
        </div>

        {/* Stat strip — 3 inline stats, no vertical rows */}
        <div
          className="grid grid-cols-3 border-t"
          style={{ borderColor: "var(--t-border-subtle)" }}
        >
          <StatCell label="Most Recent" value={lastActivityAt ? timeAgo(lastActivityAt) : "—"} />
          <StatCell label="Peak Week" value={peakLabel} />
          <StatCell label={`Prev ${periodLabel}`} value={totalPrev.toString()} last />
        </div>
      </section>

      {/* Top keywords section */}
      <section>
        <div className="flex items-center gap-4 mb-8">
          <span
            className="text-[15px] font-medium tracking-[0.35em] uppercase"
            style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
          >
            Top Keywords
          </span>
          <span className="flex-1 h-px" style={{ background: "var(--t-border-subtle)" }} />
          {topKeywords.length > 0 && (
            <span
              className="text-[14px] font-medium tracking-[0.25em] uppercase shrink-0"
              style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
            >
              From descriptions
            </span>
          )}
        </div>

        {topKeywords.length === 0 ? (
          <p
            className="text-[15px] italic"
            style={{ fontFamily: SERIF, color: "var(--text-tertiary)" }}
          >
            Not enough data yet.
          </p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-x-10">
            {topKeywords.map((kw, i) => (
              <li
                key={kw.word}
                className="flex items-baseline gap-4 py-3 border-b"
                style={{ borderColor: "var(--t-border-subtle)" }}
              >
                <span
                  className="tabular-nums leading-none shrink-0 w-8"
                  style={{
                    fontFamily: SERIF,
                    fontWeight: 900,
                    fontSize: "1.1rem",
                    letterSpacing: "-0.02em",
                    color: "var(--text-tertiary)",
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className="flex-1 truncate"
                  style={{
                    fontFamily: SERIF,
                    fontWeight: 700,
                    fontSize: "1.1rem",
                    letterSpacing: "-0.01em",
                    color: "var(--text-primary)",
                  }}
                >
                  {kw.word}
                </span>
                <span
                  className="shrink-0 tabular-nums text-[14px] font-medium tracking-[0.2em] uppercase"
                  style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
                >
                  {kw.count}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCell({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div
      className={`py-4 px-4 first:pl-0 ${last ? "" : "border-r"}`}
      style={{ borderColor: "var(--t-border-subtle)" }}
    >
      <p
        className="text-[11px] font-medium tracking-[0.18em] uppercase mb-1.5 whitespace-nowrap"
        style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
      >
        {label}
      </p>
      <p
        className="leading-tight"
        style={{
          fontFamily: SERIF,
          fontWeight: 700,
          fontSize: "0.95rem",
          letterSpacing: "-0.01em",
          color: "var(--text-primary)",
        }}
      >
        {value}
      </p>
    </div>
  );
}

// ── Weekly sparkline — editorial area chart ──────────────────────────────
function WeeklySpark({
  buckets,
  accentHex,
}: {
  buckets: WeeklyBucket[];
  accentHex: string;
}) {
  const W = 560;
  const H = 120;
  const PAD_X = 20;
  const PAD_Y = 14;

  if (buckets.length === 0) return null;

  const counts = buckets.map((b) => b.count);
  const max = Math.max(...counts, 1);
  const n = buckets.length;

  // Even spacing across width
  const xAt = (i: number) =>
    n === 1 ? W / 2 : PAD_X + ((W - PAD_X * 2) / (n - 1)) * i;
  const yAt = (v: number) => H - PAD_Y - (v / max) * (H - PAD_Y * 2);
  const baselineY = H - PAD_Y;

  const points = buckets.map((b, i) => ({
    x: xAt(i),
    y: yAt(b.count),
    count: b.count,
    date: dateFmt.format(new Date(b.startISO)),
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaPath =
    `M${points[0].x},${baselineY} ` +
    points.map((p) => `L${p.x},${p.y}`).join(" ") +
    ` L${points[points.length - 1].x},${baselineY} Z`;

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto overflow-visible"
        preserveAspectRatio="none"
        role="img"
        aria-label="Weekly submission trend"
      >
        {/* Baseline */}
        <line
          x1={PAD_X}
          x2={W - PAD_X}
          y1={baselineY}
          y2={baselineY}
          stroke="var(--t-border-subtle)"
          strokeWidth={1}
        />

        {/* Filled area */}
        <path d={areaPath} fill={accentHex} fillOpacity={0.12} />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke={accentHex}
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Point markers + count labels above */}
        {points.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.x}
              cy={p.y}
              r={p.count === 0 ? 2.5 : 4}
              fill={p.count === 0 ? "var(--t-border-bright)" : accentHex}
              stroke="var(--page-bg)"
              strokeWidth={p.count === 0 ? 0 : 2}
            />
            {p.count > 0 && (
              <text
                x={p.x}
                y={p.y - 10}
                textAnchor="middle"
                fontSize={13}
                fontWeight={700}
                style={{ fontFamily: SERIF, letterSpacing: "-0.01em" }}
                fill="var(--text-primary)"
              >
                {p.count}
              </text>
            )}
          </g>
        ))}
      </svg>

      {/* Date labels below */}
      <div
        className="flex justify-between mt-2"
        style={{ paddingLeft: PAD_X, paddingRight: PAD_X }}
      >
        {points.map((p, i) => (
          <span
            key={i}
            className="text-[14px] font-medium tracking-[0.2em] uppercase"
            style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
          >
            {p.date}
          </span>
        ))}
      </div>
    </div>
  );
}
