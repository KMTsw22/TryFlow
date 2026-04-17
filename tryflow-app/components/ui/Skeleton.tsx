import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  /** Use a softer shade (for skeletons layered inside a card) */
  muted?: boolean;
}

/**
 * Skeleton block — uses surface-2 tint so it reads as "a placeholder for something".
 * Always has a subtle animate-pulse. Stack by using the `className` prop.
 */
export function Skeleton({ className, muted = false }: Props) {
  return (
    <div
      className={cn("animate-pulse", className)}
      style={{
        background: muted
          ? "var(--t-border-subtle)"
          : "var(--t-border-card)",
      }}
      aria-hidden="true"
    />
  );
}
