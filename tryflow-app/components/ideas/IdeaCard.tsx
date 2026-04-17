import Link from "next/link";
import { ArrowUpRight, Clock, Mail, MailX } from "lucide-react";
import { getCategoryTheme, timeAgo } from "@/lib/categories";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { TrendLabel, type TrendDirection } from "@/components/ui/TrendLabel";

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

const STAGE_LABEL: Record<string, string> = {
  idea: "Just an Idea",
  prototype: "Prototype",
  early_traction: "Early Traction",
  launched: "Launched",
};

function truncate(text: string, max: number) {
  return text.length > max ? text.slice(0, max).trimEnd() + "…" : text;
}

export function IdeaCard({ idea, size = "default", href, showCategory = true }: Props) {
  const theme = getCategoryTheme(idea.category);
  const score = idea.viability_score ?? null;
  const trend = idea.trend_direction as TrendDirection | null | undefined;
  const sat = idea.saturation_level as "Low" | "Medium" | "High" | null | undefined;
  const targetHref = href ?? `/ideas/${idea.id}`;

  const isHero = size === "hero";

  return (
    <Link
      href={targetHref}
      className={`group relative flex flex-col overflow-hidden border transition-all duration-150 hover:-translate-y-0.5 hover:border-[color:var(--t-border-bright)] ${
        isHero ? "min-h-[240px]" : "min-h-[200px]"
      }`}
      style={{
        background: "var(--card-bg)",
        borderColor: "var(--t-border-card)",
      }}
    >
      <div className={`relative flex flex-col flex-1 ${isHero ? "p-6" : "p-5"}`}>
        {/* Header — category + time + score */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            {showCategory && (
              <span
                className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-semibold"
                style={{
                  background: "var(--card-bg)",
                  border: "1px solid var(--t-border-card)",
                  color: "var(--text-secondary)",
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: theme.accent }}
                  aria-hidden="true"
                />
                <span className="truncate">{idea.category}</span>
              </span>
            )}
            <span
              className="inline-flex items-center gap-1 text-[11px] font-medium"
              style={{ color: "var(--text-tertiary)" }}
            >
              <Clock className="w-3 h-3" />
              {timeAgo(idea.created_at)}
            </span>
          </div>

          {score !== null && <ScoreBadge score={score} size="hero" />}
        </div>

        {/* Target user — main heading */}
        <p
          className={`font-semibold leading-snug mb-1.5 ${
            isHero ? "text-xl" : "text-base"
          }`}
          style={{ color: "var(--text-primary)" }}
        >
          For {truncate(idea.target_user, isHero ? 80 : 50)}
        </p>

        {/* Description */}
        <p
          className={`leading-relaxed flex-1 ${
            isHero ? "text-[15px] line-clamp-4" : "text-sm line-clamp-2"
          }`}
          style={{ color: "var(--text-secondary)" }}
        >
          {idea.description}
        </p>

        {/* AI pull-quote — hero only */}
        {isHero && idea.summary && (
          <div
            className="mt-4 pl-3 border-l italic text-sm leading-relaxed"
            style={{
              borderColor: "var(--t-border-bright)",
              color: "var(--text-secondary)",
            }}
          >
            &ldquo;{truncate(idea.summary, 140)}&rdquo;
          </div>
        )}

        {/* Footer — meta row + CTA */}
        <div className="flex items-end justify-between gap-3 mt-4 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap text-xs">
            {idea.stage && STAGE_LABEL[idea.stage] && (
              <span
                className="font-medium"
                style={{ color: "var(--text-tertiary)" }}
              >
                {STAGE_LABEL[idea.stage]}
              </span>
            )}
            {trend && <TrendLabel direction={trend} />}
            {sat && (
              <span
                className="font-medium"
                style={{ color: "var(--text-tertiary)" }}
              >
                {sat} sat
              </span>
            )}
            {idea.contactOpen === true && (
              <span
                className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400"
                title="This submitter is open to investor contact"
              >
                <Mail className="w-3 h-3" />
                Open to contact
              </span>
            )}
            {idea.contactOpen === false && (
              <span
                className="inline-flex items-center gap-1 font-medium"
                style={{ color: "var(--text-tertiary)" }}
                title="This submitter has disabled contact"
              >
                <MailX className="w-3 h-3" />
                Contact off
              </span>
            )}
          </div>

          <span
            className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold transition-colors"
            style={{ color: "var(--text-tertiary)" }}
          >
            View
            <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
