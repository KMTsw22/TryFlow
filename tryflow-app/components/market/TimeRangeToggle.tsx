"use client";

import { cn } from "@/lib/utils";

export type TimeRange = "7d" | "30d" | "all";

const OPTIONS: { value: TimeRange; label: string }[] = [
  { value: "7d",  label: "This week" },
  { value: "30d", label: "This month" },
  { value: "all", label: "All time" },
];

interface Props {
  value: TimeRange;
  onChange: (next: TimeRange) => void;
  className?: string;
}

export function TimeRangeToggle({ value, onChange, className }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Time range"
      className={cn(
        "inline-flex p-0.5 border",
        className
      )}
      style={{
        background: "var(--card-bg)",
        borderColor: "var(--t-border-card)",
      }}
    >
      {OPTIONS.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "px-3 h-7 text-xs font-semibold transition-all"
            )}
            style={{
              background: active ? "var(--accent)" : "transparent",
              color: active ? "#ffffff" : "var(--text-tertiary)",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
