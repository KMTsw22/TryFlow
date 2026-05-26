import { TrendingUp, Minus, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type TrendDirection = "Rising" | "Stable" | "Declining";

interface Props {
  direction: TrendDirection;
  /** sm = 테이블 row, md = 강조 위치 */
  size?: "sm" | "md";
  /** Optional delta percentage to display inline, e.g. "+240%" */
  delta?: string;
  className?: string;
}

// Text stays neutral. The direction icon carries a subtle tone so the trend
// still reads at a glance without flooding dense tables with color.
const ICON_COLOR: Record<TrendDirection, string> = {
  Rising: "var(--signal-success)",
  Stable: "var(--text-tertiary)",
  Declining: "var(--signal-danger)",
};

const ICON_MAP: Record<TrendDirection, typeof TrendingUp> = {
  Rising: TrendingUp,
  Stable: Minus,
  Declining: TrendingDown,
};

export function TrendLabel({ direction, size = "sm", delta, className }: Props) {
  const Icon = ICON_MAP[direction];
  const textSize = size === "md" ? "text-sm" : "text-xs";
  const iconSize = size === "md" ? "w-4 h-4" : "w-3.5 h-3.5";

  return (
    <span
      className={cn("inline-flex items-center gap-1.5 font-semibold", textSize, className)}
      style={{ color: "var(--text-secondary)" }}
    >
      <Icon className={iconSize} style={{ color: ICON_COLOR[direction] }} />
      <span>{direction}</span>
      {delta && (
        <span className="font-mono tabular-nums ml-0.5" style={{ color: "var(--text-tertiary)" }}>
          {delta}
        </span>
      )}
    </span>
  );
}
