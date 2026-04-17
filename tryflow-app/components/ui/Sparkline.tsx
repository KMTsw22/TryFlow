import { cn } from "@/lib/utils";

interface Props {
  points: number[];
  /** Visual weight — subtle for dense tables, bold for emphasis */
  tone?: "muted" | "accent" | "positive" | "warning" | "danger";
  width?: number;
  height?: number;
  className?: string;
  /** Accessible label */
  ariaLabel?: string;
}

const TONE_COLOR: Record<NonNullable<Props["tone"]>, string> = {
  muted:    "var(--text-tertiary)",
  accent:   "var(--accent)",
  positive: "#10b981",
  warning:  "#f59e0b",
  danger:   "#ef4444",
};

export function Sparkline({
  points,
  tone = "muted",
  width = 80,
  height = 22,
  className,
  ariaLabel,
}: Props) {
  if (!points || points.length < 2) {
    return (
      <div
        className={cn("flex items-center", className)}
        style={{ width, height }}
        aria-hidden="true"
      >
        <div className="w-full h-px" style={{ background: "var(--t-border-subtle)" }} />
      </div>
    );
  }

  const color = TONE_COLOR[tone];
  const max = Math.max(...points, 1);
  const step = width / (points.length - 1);
  const coords = points.map((v, i) => [i * step, height - (v / max) * height] as const);
  const path = coords.map(([x, y]) => `${x},${y}`).join(" ");
  const last = coords[coords.length - 1];

  return (
    <svg
      width={width}
      height={height}
      className={cn("overflow-visible shrink-0", className)}
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel}
    >
      <polyline
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={path}
      />
      <circle cx={last[0]} cy={last[1]} r={2} fill={color} />
    </svg>
  );
}
