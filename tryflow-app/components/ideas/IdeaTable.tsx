"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { TrendLabel, type TrendDirection } from "@/components/ui/TrendLabel";
import { StatusBadge, type IdeaStatus } from "@/components/ui/StatusBadge";
import { SortHeader, type SortDir } from "@/components/ui/SortHeader";
import { timeAgo, getCategoryTheme } from "@/lib/categories";

export interface IdeaTableRow {
  id: string;
  category: string;
  target_user: string;
  description: string;
  created_at: string;
  viability_score: number | null;
  trend_direction: TrendDirection | null;
  status: IdeaStatus;
}

type SortKey = "created_at" | "viability_score" | "category";

interface Props {
  rows: IdeaTableRow[];
  /** id of the idea to highlight (e.g. highest score). Subtle accent. */
  highlightId?: string | null;
}

const GRID_TEMPLATE =
  "minmax(0, 1fr) 140px 80px 100px 110px 90px 20px";

export function IdeaTable({ rows, highlightId }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      // Sensible defaults: dates + score start at desc (newest/highest first), category starts asc
      setSortDir(key === "category" ? "asc" : "desc");
    }
  };

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      let diff = 0;
      if (sortKey === "created_at") {
        diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortKey === "viability_score") {
        // Push nulls to the end regardless of direction
        const aScore = a.viability_score ?? -1;
        const bScore = b.viability_score ?? -1;
        diff = aScore - bScore;
      } else if (sortKey === "category") {
        diff = a.category.localeCompare(b.category);
      }
      return sortDir === "asc" ? diff : -diff;
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  return (
    <div
      className="border overflow-hidden"
      style={{ background: "var(--card-bg)", borderColor: "var(--t-border-card)" }}
    >
      {/* Header */}
      <div
        className="grid items-center gap-4 px-5 py-3 border-b text-[11px] font-semibold tracking-wider uppercase"
        style={{
          borderColor: "var(--t-border)",
          gridTemplateColumns: GRID_TEMPLATE,
          color: "var(--text-tertiary)",
        }}
      >
        <div>Idea</div>
        <SortHeader
          label="Category"
          active={sortKey === "category"}
          dir={sortDir}
          onClick={() => handleSort("category")}
          align="left"
        />
        <SortHeader
          label="Score"
          active={sortKey === "viability_score"}
          dir={sortDir}
          onClick={() => handleSort("viability_score")}
          align="right"
        />
        <div>Trend</div>
        <div title="Public = visible in Market feed · Private = hidden · Analyzing = AI report still running">
          Visibility
        </div>
        <SortHeader
          label="Updated"
          active={sortKey === "created_at"}
          dir={sortDir}
          onClick={() => handleSort("created_at")}
          align="right"
        />
        <div />
      </div>

      {/* Rows */}
      <ul className="divide-y" style={{ borderColor: "var(--t-border-subtle)" }}>
        {sorted.map((r) => {
          const highlighted = r.id === highlightId;
          const theme = getCategoryTheme(r.category);
          return (
            <li key={r.id} className="relative">
              {highlighted && (
                <span
                  aria-hidden
                  className="absolute left-0 top-0 bottom-0 w-[2px]"
                  style={{ background: "var(--accent)" }}
                />
              )}
              <Link
                href={`/ideas/${r.id}`}
                className={cn(
                  "grid items-center gap-4 px-5 py-4 text-sm transition-colors group",
                  "hover:bg-[color:var(--t-border-subtle)]"
                )}
                style={{
                  gridTemplateColumns: GRID_TEMPLATE,
                  background: highlighted ? "var(--accent-soft)" : undefined,
                }}
              >
                {/* Idea — target + description */}
                <div className="min-w-0">
                  <p
                    className="text-sm font-semibold truncate"
                    style={{ color: "var(--text-primary)" }}
                  >
                    For {r.target_user}
                  </p>
                  <p
                    className="text-xs truncate mt-0.5"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {r.description}
                  </p>
                </div>

                {/* Category */}
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: theme.accent }}
                  />
                  <span
                    className="text-xs font-medium truncate"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {r.category}
                  </span>
                </div>

                {/* Score */}
                <div className="flex justify-end">
                  <ScoreBadge score={r.viability_score} />
                </div>

                {/* Trend */}
                <div>
                  {r.trend_direction ? (
                    <TrendLabel direction={r.trend_direction} />
                  ) : (
                    <span
                      className="text-xs"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      —
                    </span>
                  )}
                </div>

                {/* Visibility (renamed from Status) */}
                <div>
                  <StatusBadge status={r.status} />
                </div>

                {/* Updated */}
                <div
                  className="text-right font-mono tabular-nums text-xs"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {timeAgo(r.created_at)}
                </div>

                <ChevronRight
                  className="w-4 h-4 justify-self-end transition-all group-hover:translate-x-0.5"
                  style={{ color: "var(--text-tertiary)" }}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
