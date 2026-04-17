import Link from "next/link";
import { TrendingUp, Award, Target, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Visual "tone" for the signal card. The names stay for backward-compat,
 * but the labels passed from MarketBoard describe the actual signal
 * (e.g. "Gaining momentum", "Highest quality", "Underexplored").
 */
export type SignalType = "rising" | "crowded" | "open";

interface Props {
  type: SignalType;
  /** The category being spotlighted by this signal, e.g. "Dev Tools" */
  category: string | null;
  /** Primary metric line, e.g. "+240% · 12 new" */
  primaryMetric: string;
  /** Supporting context, e.g. "vs last 7 days" */
  secondaryMetric?: string;
  /** Click destination (category drill-down) */
  href?: string;
  className?: string;
  /** Overrides the default META label for honest, caller-provided copy. */
  label?: string;
}

const META: Record<SignalType, {
  label: string;
  icon: typeof TrendingUp;
  accentClass: string;
}> = {
  rising: {
    label: "Gaining momentum",
    icon: TrendingUp,
    accentClass: "text-emerald-600 dark:text-emerald-400",
  },
  crowded: {
    label: "Highest quality",
    icon: Award,
    accentClass: "text-amber-600 dark:text-amber-400",
  },
  open: {
    label: "Underexplored",
    icon: Target,
    accentClass: "text-indigo-600 dark:text-indigo-400",
  },
};

export function SignalCard({
  type,
  category,
  primaryMetric,
  secondaryMetric,
  href,
  className,
  label,
}: Props) {
  const meta = META[type];
  const Icon = meta.icon;
  const isEmpty = !category;
  const resolvedLabel = label ?? meta.label;

  const inner = (
    <div
      className={cn(
        "flex flex-col p-5 border h-full transition-all duration-150",
        !isEmpty && "hover:border-[color:var(--t-border-bright)]",
        className
      )}
      style={{
        background: "var(--card-bg)",
        borderColor: "var(--t-border-card)",
      }}
    >
      {/* Label row */}
      <div className="flex items-center justify-between mb-4">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-widest uppercase",
            meta.accentClass
          )}
        >
          <Icon className="w-3.5 h-3.5" />
          {resolvedLabel}
        </span>
        {!isEmpty && (
          <ArrowUpRight
            className="w-4 h-4 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            style={{ color: "var(--text-tertiary)" }}
          />
        )}
      </div>

      {/* Category name */}
      <h3
        className="text-xl font-bold tracking-tight mb-2"
        style={{
          color: isEmpty ? "var(--text-tertiary)" : "var(--text-primary)",
        }}
      >
        {category ?? "No signal yet"}
      </h3>

      {/* Metrics */}
      <p
        className="font-mono text-sm font-semibold tabular-nums"
        style={{ color: "var(--text-secondary)" }}
      >
        {isEmpty ? "—" : primaryMetric}
      </p>
      {secondaryMetric && (
        <p
          className="text-xs mt-1"
          style={{ color: "var(--text-tertiary)" }}
        >
          {secondaryMetric}
        </p>
      )}
    </div>
  );

  if (isEmpty || !href) {
    return <div className={cn("block", className)}>{inner}</div>;
  }

  return (
    <Link href={href} className="group block">
      {inner}
    </Link>
  );
}
