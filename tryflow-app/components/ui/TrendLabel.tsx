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

const CONFIG: Record<TrendDirection, { icon: typeof TrendingUp; color: string }> = {
  Rising:    { icon: TrendingUp,   color: "text-emerald-600 dark:text-emerald-400" },
  Stable:    { icon: Minus,        color: "text-amber-600 dark:text-amber-400" },
  Declining: { icon: TrendingDown, color: "text-red-600 dark:text-red-400" },
};

export function TrendLabel({ direction, size = "sm", delta, className }: Props) {
  const { icon: Icon, color } = CONFIG[direction];
  const textSize = size === "md" ? "text-sm" : "text-xs";
  const iconSize = size === "md" ? "w-4 h-4" : "w-3.5 h-3.5";

  return (
    <span className={cn("inline-flex items-center gap-1 font-semibold", textSize, color, className)}>
      <Icon className={iconSize} />
      <span>{direction}</span>
      {delta && (
        <span className="font-mono tabular-nums ml-0.5">{delta}</span>
      )}
    </span>
  );
}
