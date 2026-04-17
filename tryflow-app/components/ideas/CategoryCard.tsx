import Link from "next/link";
import { TrendingUp, TrendingDown, Minus, ArrowUpRight } from "lucide-react";
import { getCategoryTheme } from "@/lib/categories";

export interface CategoryCardData {
  category: string;
  total: number;
  last30: number;
  direction: "Rising" | "Stable" | "Declining";
  saturation: "Low" | "Medium" | "High";
  sparkline?: number[];
  opportunityLabel?: string;
}

interface Props {
  data: CategoryCardData;
}

const TREND_ICON = {
  Rising: TrendingUp,
  Stable: Minus,
  Declining: TrendingDown,
};

const TREND_META = {
  Rising:    { label: "Rising",    color: "text-emerald-500 dark:text-emerald-400" },
  Stable:    { label: "Stable",    color: "text-amber-500 dark:text-amber-400" },
  Declining: { label: "Declining", color: "text-red-500 dark:text-red-400" },
};

export function CategoryCard({ data }: Props) {
  const theme = getCategoryTheme(data.category);
  const TIcon = TREND_ICON[data.direction];
  const trendMeta = TREND_META[data.direction];

  return (
    <Link
      href={`/explore/${encodeURIComponent(data.category)}`}
      className="group relative flex flex-col overflow-hidden border p-5 transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background: "var(--card-bg)",
        borderColor: "var(--t-border-card)",
      }}
    >
      {/* Subtle hover glow tied to category color */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `radial-gradient(500px circle at 0% 0%, rgba(${theme.accentRgb}, 0.06), transparent 60%)`,
        }}
      />

      <div className="relative">
        {/* Header: emoji + title + arrow */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className="shrink-0 w-10 h-10 flex items-center justify-center text-xl rounded-md"
            style={{
              background: theme.softBg,
              border: `1px solid ${theme.borderTint}`,
            }}
          >
            {theme.emoji}
          </div>
          <h3 className="flex-1 text-lg font-bold text-gray-900 dark:text-white tracking-tight truncate">
            {data.category}
          </h3>
          <ArrowUpRight className="shrink-0 w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </div>

        {/* Big number */}
        <div className="flex items-baseline gap-1.5 mb-3">
          <span className="text-3xl font-extrabold text-gray-900 dark:text-white leading-none">
            {data.last30}
          </span>
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
            ideas in last 30 days
          </span>
        </div>

        {/* Trend + saturation — single clean row */}
        <div className="flex items-center gap-3 text-sm">
          <span className={`inline-flex items-center gap-1 font-semibold ${trendMeta.color}`}>
            <TIcon className="w-3.5 h-3.5" />
            {trendMeta.label}
          </span>
          <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
          <span className="text-gray-600 dark:text-gray-300 font-medium">
            {data.saturation} saturation
          </span>
        </div>

        {/* Opportunity signal — subtle, single line */}
        {data.opportunityLabel && (
          <p
            className="mt-3 pt-3 border-t text-xs font-semibold tracking-wide"
            style={{
              borderColor: "var(--t-border-subtle)",
              color: theme.accent,
            }}
          >
            ◆ {data.opportunityLabel}
            <span className="text-gray-500 dark:text-gray-400 font-normal ml-1.5">
              · {data.total} total submissions
            </span>
          </p>
        )}
      </div>
    </Link>
  );
}
