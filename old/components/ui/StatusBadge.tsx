import { cn } from "@/lib/utils";

export type IdeaStatus = "live" | "analyzing" | "draft" | "private";

interface Props {
  status: IdeaStatus;
  className?: string;
}

const CONFIG: Record<IdeaStatus, { label: string; dot: string; color: string }> = {
  // "live" now carries the meaning "Public on Market" — renamed for honesty.
  live:      { label: "Public",    dot: "#10b981", color: "text-emerald-600 dark:text-emerald-400" },
  analyzing: { label: "Analyzing", dot: "#f59e0b", color: "text-amber-600 dark:text-amber-400" },
  draft:     { label: "Draft",     dot: "#71717a", color: "text-zinc-600 dark:text-zinc-400" },
  private:   { label: "Private",   dot: "#8b5cf6", color: "text-violet-600 dark:text-violet-400" },
};

export function StatusBadge({ status, className }: Props) {
  const { label, dot, color } = CONFIG[status];

  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", color, className)}>
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full shrink-0",
          status === "analyzing" && "animate-pulse"
        )}
        style={{ background: dot }}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}
