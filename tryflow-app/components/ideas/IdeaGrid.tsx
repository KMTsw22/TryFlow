"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { getCategoryTheme, timeAgo } from "@/lib/categories";
import type { TrendDirection } from "@/components/ui/TrendLabel";
import type { IdeaStatus } from "@/components/ui/StatusBadge";

export interface IdeaGridItem {
  id: string;
  category: string;
  target_user: string;
  description: string;
  created_at: string;
  stage?: string | null;
  viability_score: number | null;
  trend_direction: TrendDirection | null;
  saturation_level?: string | null;
  status: IdeaStatus;
}

type SortKey = "viability_score" | "created_at" | "category";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "viability_score", label: "Score" },
  { key: "created_at", label: "Newest" },
  { key: "category", label: "Category" },
];

const STAGE_LABEL: Record<string, string> = {
  idea: "Just an Idea",
  prototype: "Prototype",
  early_traction: "Early Traction",
  launched: "Launched",
};

const STATUS_LABEL: Record<IdeaStatus, string> = {
  live: "Public",
  private: "Private",
  analyzing: "Analyzing",
  draft: "Draft",
};

function scoreColor(score: number | null) {
  if (score === null) return "var(--text-tertiary)";
  if (score >= 70) return "var(--signal-success)";
  if (score >= 50) return "var(--signal-warning)";
  return "var(--signal-danger)";
}

interface Props {
  items: IdeaGridItem[];
  /** id of the idea to highlight (e.g. highest score). */
  highlightId?: string | null;
}

export function IdeaGrid({ items, highlightId }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("viability_score");

  const sorted = useMemo(() => {
    const copy = [...items];
    copy.sort((a, b) => {
      if (sortKey === "viability_score") {
        return (b.viability_score ?? -1) - (a.viability_score ?? -1);
      }
      if (sortKey === "created_at") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return a.category.localeCompare(b.category);
    });
    return copy;
  }, [items, sortKey]);

  return (
    <>
      <div className="flex items-center justify-end mb-4">
        <div className="relative">
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] tracking-wider uppercase font-semibold pointer-events-none"
            style={{ color: "var(--text-tertiary)" }}
          >
            Sort
          </span>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="appearance-none pl-14 pr-8 h-9 text-xs font-medium bg-transparent cursor-pointer focus:outline-none"
            style={{
              borderBottom: "1px solid var(--t-border-card)",
              color: "var(--text-primary)",
            }}
            aria-label="Sort ideas"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "var(--text-tertiary)" }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {sorted.map((item) => (
          <MyIdeaCard
            key={item.id}
            item={item}
            highlighted={item.id === highlightId}
          />
        ))}
      </div>
    </>
  );
}

function MyIdeaCard({
  item,
  highlighted,
}: {
  item: IdeaGridItem;
  highlighted: boolean;
}) {
  const theme = getCategoryTheme(item.category);
  const color = scoreColor(item.viability_score);
  const stage = item.stage && STAGE_LABEL[item.stage] ? STAGE_LABEL[item.stage] : null;
  const scoreStr = item.viability_score !== null ? item.viability_score.toString() : "—";

  return (
    <Link
      href={`/ideas/${item.id}`}
      className="group relative flex flex-col min-h-[210px] p-6 border transition-all duration-200 hover:-translate-y-0.5 hover:border-[color:var(--t-border-bright)]"
      style={{
        background: "var(--card-bg)",
        borderColor: "var(--t-border-card)",
      }}
    >
      {/* Top row — category (left) + score (right) */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <span
          className="inline-flex items-center gap-1.5 text-[14px] font-semibold tracking-wider uppercase"
          style={{ color: "var(--text-tertiary)" }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: theme.accent }}
            aria-hidden="true"
          />
          {item.category}
        </span>

        <div className="flex items-baseline gap-1 shrink-0">
          <span
            className="tabular-nums leading-none"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 900,
              fontSize: "1.75rem",
              letterSpacing: "-0.02em",
              color,
            }}
          >
            {scoreStr}
          </span>
          <span
            className="text-[13px] font-medium tracking-[0.15em] uppercase"
            style={{ fontFamily: "'Oswald', sans-serif", color: "var(--text-tertiary)" }}
          >
            /100
          </span>
        </div>
      </div>

      {/* Target user — main heading */}
      <h3
        className="text-[17px] font-semibold leading-snug mb-2 line-clamp-2"
        style={{ color: "var(--text-primary)" }}
      >
        For {item.target_user}
      </h3>

      {/* Description — muted, 2 lines max */}
      <p
        className="text-[13px] leading-relaxed line-clamp-2 flex-1"
        style={{ color: "var(--text-tertiary)" }}
      >
        {item.description}
      </p>

      {/* Footer — quiet meta, single line */}
      <div
        className="flex items-center justify-between mt-5 pt-4 text-[14px] border-t"
        style={{
          borderColor: "var(--t-border-subtle)",
          color: "var(--text-tertiary)",
        }}
      >
        <span className="truncate">
          {timeAgo(item.created_at)}
          {stage && <span className="mx-1.5 opacity-50">·</span>}
          {stage}
        </span>
        <span
          className="font-medium tracking-wider uppercase text-[10px] shrink-0 ml-3"
          style={{
            color:
              item.status === "private"
                ? "var(--text-tertiary)"
                : item.status === "analyzing"
                ? "var(--signal-warning)"
                : "var(--text-secondary)",
          }}
        >
          {STATUS_LABEL[item.status]}
        </span>
      </div>
    </Link>
  );
}
