import Link from "next/link";
import { getCategoryTheme, timeAgo } from "@/lib/categories";

export interface IdeaCardData {
  id: string;
  category: string;
  target_user: string;
  description: string;
  created_at: string;
  stage?: string | null;
  viability_score?: number | null;
  trend_direction?: string | null;
  saturation_level?: string | null;
  summary?: string | null;
  /** Whether the submitter currently accepts investor contact (null = anonymous / unknown). */
  contactOpen?: boolean | null;
}

type Size = "hero" | "default";

interface Props {
  idea: IdeaCardData;
  size?: Size;
  href?: string;
  /** Show category chip (true by default). Hide when rendered inside a category-filtered view. */
  showCategory?: boolean;
}

const SERIF = "'Playfair Display', serif";
const DISPLAY = "'Oswald', sans-serif";

const STAGE_LABEL: Record<string, string> = {
  idea: "Just an Idea",
  prototype: "Prototype",
  early_traction: "Early Traction",
  launched: "Launched",
};

function truncate(text: string, max: number) {
  return text.length > max ? text.slice(0, max).trimEnd() + "…" : text;
}

function scoreColor(score: number | null) {
  if (score === null) return "var(--text-tertiary)";
  if (score >= 70) return "var(--signal-success)";
  if (score >= 50) return "var(--signal-warning)";
  return "var(--signal-danger)";
}

export function IdeaCard({
  idea,
  size = "default",
  href,
  showCategory = true,
}: Props) {
  const theme = getCategoryTheme(idea.category);
  const score = idea.viability_score ?? null;
  const color = scoreColor(score);
  const targetHref = href ?? `/ideas/${idea.id}`;
  const stage =
    idea.stage && STAGE_LABEL[idea.stage] ? STAGE_LABEL[idea.stage] : null;
  const isHero = size === "hero";

  const scoreDisplay = score !== null ? score.toString() : "—";
  const scoreSize = isHero ? "2.5rem" : "1.75rem";

  return (
    <Link
      href={targetHref}
      className={`group relative flex flex-col p-6 border transition-all duration-200 hover:-translate-y-0.5 hover:border-[color:var(--t-border-bright)] ${
        isHero ? "min-h-[260px]" : "min-h-[210px]"
      }`}
      style={{
        background: "var(--card-bg)",
        borderColor: "var(--t-border-card)",
      }}
    >
      {/* Top row — category or stage (left) + score (right) */}
      <div className="flex items-start justify-between gap-4 mb-5">
        {showCategory ? (
          <span
            className="inline-flex items-center gap-1.5 text-[14px] font-semibold tracking-wider uppercase"
            style={{ color: "var(--text-tertiary)" }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: theme.accent }}
              aria-hidden="true"
            />
            {idea.category}
          </span>
        ) : stage ? (
          <span
            className="text-[13px] font-medium tracking-[0.3em] uppercase truncate"
            style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
          >
            {stage}
          </span>
        ) : (
          <span />
        )}

        <div className="flex items-baseline gap-1 shrink-0">
          <span
            className="tabular-nums leading-none"
            style={{
              fontFamily: SERIF,
              fontWeight: 900,
              fontSize: scoreSize,
              letterSpacing: "-0.02em",
              color,
            }}
          >
            {scoreDisplay}
          </span>
          <span
            className="text-[13px] font-medium tracking-[0.15em] uppercase"
            style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
          >
            /100
          </span>
        </div>
      </div>

      {/* Target user */}
      <h3
        className={`leading-snug mb-2 line-clamp-2 ${isHero ? "text-[19px]" : "text-[17px]"}`}
        style={{
          fontFamily: SERIF,
          fontWeight: 700,
          letterSpacing: "-0.01em",
          color: "var(--text-primary)",
        }}
      >
        For {truncate(idea.target_user, isHero ? 80 : 60)}
      </h3>

      {/* Description */}
      <p
        className={`leading-relaxed flex-1 ${isHero ? "text-[14px] line-clamp-3" : "text-[13px] line-clamp-2"}`}
        style={{ color: "var(--text-secondary)" }}
      >
        {idea.description}
      </p>

      {/* Hero only: AI pull-quote */}
      {isHero && idea.summary && (
        <p
          className="mt-4 pl-3 border-l italic text-[13.5px] leading-[1.55] line-clamp-3"
          style={{
            borderColor: "var(--t-border-bright)",
            color: "var(--text-secondary)",
            fontFamily: SERIF,
          }}
        >
          &ldquo;{truncate(idea.summary, 160)}&rdquo;
        </p>
      )}

      {/* Footer — meta (left) + contact indicator (right) */}
      <div
        className="flex items-center justify-between mt-5 pt-4 text-[13px] border-t"
        style={{
          borderColor: "var(--t-border-subtle)",
          color: "var(--text-tertiary)",
        }}
      >
        <span className="truncate">
          {timeAgo(idea.created_at)}
          {/* Stage already shown in top-left for showCategory=false, so avoid duplication */}
          {showCategory && stage && (
            <>
              <span className="mx-1.5 opacity-50">·</span>
              {stage}
            </>
          )}
        </span>

        {idea.contactOpen === true && (
          <span
            className="shrink-0 text-[11px] font-medium tracking-[0.3em] uppercase"
            style={{ fontFamily: DISPLAY, color: "var(--signal-success)" }}
            title="Open to investor contact"
          >
            Open
          </span>
        )}
        {idea.contactOpen === false && (
          <span
            className="shrink-0 text-[11px] font-medium tracking-[0.3em] uppercase"
            style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
            title="Contact disabled"
          >
            Contact off
          </span>
        )}
      </div>
    </Link>
  );
}
