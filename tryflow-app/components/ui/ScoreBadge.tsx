import { cn } from "@/lib/utils";

interface Props {
  score: number | null | undefined;
  /** inline = 숫자+dot (테이블, 리스트), hero = 원형 링 (detail 등 강조) */
  size?: "inline" | "hero";
  className?: string;
}

function resolveColor(score: number | null | undefined) {
  if (score === null || score === undefined) {
    return { hex: "#71717a", text: "text-zinc-600 dark:text-zinc-400" };
  }
  // 점수는 양적 정보 — 빨강은 위험 액션 한정. 우수만 초록, 그 외는 회색 위계.
  if (score >= 70) return { hex: "#10b981", text: "text-emerald-600 dark:text-emerald-400" };
  if (score >= 50) return { hex: "#52525b", text: "text-zinc-700 dark:text-zinc-300" };
  return { hex: "#a1a1aa", text: "text-zinc-500 dark:text-zinc-400" };
}

export function ScoreBadge({ score, size = "inline", className }: Props) {
  const { hex, text } = resolveColor(score);
  const display = score ?? "—";

  if (size === "hero") {
    return (
      <div
        className={cn(
          "shrink-0 flex flex-col items-center justify-center w-12 h-12 rounded-full border-2",
          className
        )}
        style={{ borderColor: `${hex}55`, background: `${hex}12` }}
        aria-label={score !== null && score !== undefined ? `Signal score ${score} of 100` : "Score pending"}
      >
        <span
          className={cn("font-mono text-base font-bold tabular-nums leading-none", text)}
        >
          {display}
        </span>
        <span className="text-[11px] font-semibold leading-none mt-0.5" style={{ color: "var(--text-tertiary)" }}>
          /100
        </span>
      </div>
    );
  }

  // inline: number + dot
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className={cn("font-mono text-sm font-semibold tabular-nums", text)}>
        {display}
      </span>
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ background: hex }}
        aria-hidden="true"
      />
    </span>
  );
}
