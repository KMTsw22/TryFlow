import Link from "next/link";
import { cn } from "@/lib/utils";

interface Props {
  /** Visual size. sm = nav rows, md = page navbars, lg = auth hero. */
  size?: "sm" | "md" | "lg";
  /**
   * Destination. Defaults to "/" (landing) so clicking anywhere jumps home,
   * which is the convention on every content page. Pass another href only
   * when you explicitly need to override that (e.g. /dashboard inside the
   * authenticated sidebar).
   */
  href?: string;
  /** Override the wordmark color (defaults to --text-primary). */
  color?: string;
  /** If true, renders just the mark + wordmark without wrapping Link. */
  asStatic?: boolean;
  className?: string;
}

const SIZE_TOKENS: Record<
  NonNullable<Props["size"]>,
  { icon: string; text: string; gap: string }
> = {
  sm: { icon: "w-6 h-6", text: "1rem", gap: "gap-2" },
  md: { icon: "w-7 h-7", text: "1.125rem", gap: "gap-2.5" },
  lg: { icon: "w-11 h-11", text: "1.75rem", gap: "gap-3" },
};

/**
 * Canonical brand mark used in every page header and auth surface.
 * Renders `/logo.png` next to "Try.Wepp" in Playfair Display Black
 * and links back to the landing page by default.
 */
export function Brand({
  size = "md",
  href = "/",
  color,
  asStatic = false,
  className,
}: Props) {
  const tokens = SIZE_TOKENS[size];

  const inner = (
    <span className={cn("inline-flex items-center", tokens.gap, className)}>
      <img src="/logo.png" className={cn(tokens.icon, "shrink-0")} alt="Try.Wepp" />
      <span
        style={{
          fontFamily: "'Playfair Display', serif",
          fontWeight: 900,
          fontSize: tokens.text,
          letterSpacing: "-0.02em",
          color: color ?? "var(--text-primary)",
        }}
      >
        Try.Wepp
      </span>
    </span>
  );

  if (asStatic) return inner;

  return (
    <Link
      href={href}
      aria-label="Try.Wepp — go to home"
      className="inline-flex items-center transition-opacity hover:opacity-80"
    >
      {inner}
    </Link>
  );
}
