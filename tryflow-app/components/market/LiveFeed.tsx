import Link from "next/link";
import { Radio } from "lucide-react";
import { timeAgo, getCategoryTheme } from "@/lib/categories";

export interface LiveFeedItem {
  id: string;
  category: string;
  target_user: string;
  description: string;
  created_at: string;
}

interface Props {
  items: LiveFeedItem[];
}

function truncate(text: string, max: number) {
  return text.length > max ? text.slice(0, max).trimEnd() + "…" : text;
}

export function LiveFeed({ items }: Props) {
  if (!items || items.length === 0) return null;

  return (
    <section aria-label="Recent submissions">
      <div className="flex items-end justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            {/* Pulse indicator */}
            <span className="relative flex w-2 h-2">
              <span
                className="absolute inline-flex w-full h-full rounded-full opacity-75 animate-ping"
                style={{ background: "var(--signal-success, #10b981)" }}
              />
              <span
                className="relative inline-flex w-2 h-2 rounded-full"
                style={{ background: "var(--signal-success, #10b981)" }}
              />
            </span>
            <h2
              className="text-sm font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Live submissions
            </h2>
          </div>
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            The pulse of the market · newest first
          </p>
        </div>
        <p
          className="hidden sm:flex items-center gap-1 text-[11px] font-medium"
          style={{ color: "var(--text-tertiary)" }}
        >
          <Radio className="w-3 h-3" /> Last {items.length}
        </p>
      </div>

      <ul
        className="border divide-y overflow-hidden"
        style={{
          background: "var(--card-bg)",
          borderColor: "var(--t-border-card)",
        }}
      >
        {items.map((item) => {
          const theme = getCategoryTheme(item.category);
          return (
            <li key={item.id}>
              <Link
                href={`/ideas/${item.id}`}
                className="grid items-center gap-4 px-5 py-3.5 transition-colors group hover:bg-[color:var(--t-border-subtle)]"
                style={{
                  borderColor: "var(--t-border-subtle)",
                  gridTemplateColumns: "110px minmax(0, 1.3fr) minmax(0, 2fr) 80px",
                }}
              >
                {/* Category dot + label */}
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: theme.accent }}
                  />
                  <span
                    className="text-[11px] font-semibold uppercase tracking-wider truncate"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {item.category}
                  </span>
                </div>

                {/* Target user */}
                <p
                  className="text-sm font-medium truncate"
                  style={{ color: "var(--text-primary)" }}
                >
                  For {item.target_user}
                </p>

                {/* Description snippet — hidden on small screens */}
                <p
                  className="hidden md:block text-sm truncate"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {truncate(item.description, 90)}
                </p>

                {/* Relative time */}
                <p
                  className="text-xs font-mono tabular-nums text-right"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {timeAgo(item.created_at)}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
