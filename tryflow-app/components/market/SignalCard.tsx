import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type SignalType = "rising" | "crowded" | "open";

interface Props {
  type: SignalType;
  category: string | null;
  primaryMetric: string;
  secondaryMetric?: string;
  href?: string;
  className?: string;
  label?: string;
  /** Position in the 3-col grid — controls left border (hairline separator between cells). */
  position?: "first" | "middle" | "last";
}

const SERIF = "'Fraunces', serif";
const DISPLAY = "'Inter', sans-serif";

const ACCENT_BY_TYPE: Record<SignalType, string> = {
  rising: "var(--signal-success)",
  crowded: "var(--signal-warning)",
  open: "var(--accent)",
};

const DEFAULT_LABEL: Record<SignalType, string> = {
  rising: "Gaining Momentum",
  crowded: "Highest Quality",
  open: "Underexplored",
};

export function SignalCard({
  type,
  category,
  primaryMetric,
  secondaryMetric,
  href,
  className,
  label,
  position = "middle",
}: Props) {
  const isEmpty = !category;
  const resolvedLabel = label ?? DEFAULT_LABEL[type];
  const accent = ACCENT_BY_TYPE[type];

  const inner = (
    <div
      className={cn(
        "relative flex flex-col h-full p-7 min-h-[180px] transition-opacity",
        position !== "first" && "md:border-l",
        !isEmpty && "hover:opacity-80",
        className,
      )}
      style={{ borderColor: "var(--t-border-subtle)" }}
    >
      {/* Kicker label + arrow */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <span
          className="text-[15px] font-medium tracking-[0.08em] uppercase"
          style={{ fontFamily: DISPLAY, color: accent }}
        >
          {resolvedLabel}
        </span>
        {!isEmpty && (
          <ArrowUpRight
            className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            style={{ color: "var(--text-tertiary)" }}
            strokeWidth={1.75}
          />
        )}
      </div>

      {/* Category name */}
      <h3
        className="mb-3 leading-[1.1]"
        style={{
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: "1.75rem",
          letterSpacing: "-0.02em",
          color: isEmpty ? "var(--text-tertiary)" : "var(--text-primary)",
        }}
      >
        {category ?? "No signal yet"}
      </h3>

      {/* Primary metric */}
      <p
        className="tabular-nums mb-1"
        style={{
          fontFamily: SERIF,
          fontWeight: 700,
          fontSize: "1rem",
          letterSpacing: "-0.005em",
          color: isEmpty ? "var(--text-tertiary)" : "var(--text-secondary)",
        }}
      >
        {isEmpty ? "—" : primaryMetric}
      </p>

      {/* Secondary context */}
      {secondaryMetric && (
        <p
          className="text-[13px] leading-[1.5] mt-auto pt-3"
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
