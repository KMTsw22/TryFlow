"use client";

import { cn } from "@/lib/utils";

export type TimeRange = "7d" | "30d" | "all";

const OPTIONS: { value: TimeRange; label: string }[] = [
  { value: "7d", label: "Week" },
  { value: "30d", label: "Month" },
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
      className={cn("inline-flex items-center gap-5", className)}
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
            className="text-[15px] font-medium tracking-[0.06em] uppercase transition-opacity hover:opacity-70"
            style={{
              fontFamily: "'Inter', sans-serif",
              color: active ? "var(--accent)" : "var(--text-tertiary)",
              borderBottom: active
                ? "1px solid var(--accent-ring)"
                : "1px solid transparent",
              paddingBottom: "4px",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
