import Link from "next/link";
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

const SERIF = "'Playfair Display', serif";
const DISPLAY = "'Oswald', sans-serif";

function truncate(text: string, max: number) {
  return text.length > max ? text.slice(0, max).trimEnd() + "…" : text;
}

export function LiveFeed({ items }: Props) {
  if (!items || items.length === 0) return null;

  return (
    <section aria-label="Recent submissions">
      {/* Editorial kicker */}
      <div className="flex items-center gap-4 mb-8">
        <span
          className="inline-flex items-center gap-2 text-[15px] font-medium tracking-[0.35em] uppercase"
          style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "var(--signal-success)" }}
            aria-hidden
          />
          Live Submissions
        </span>
        <span className="flex-1 h-px" style={{ background: "var(--t-border-subtle)" }} />
        <span
          className="text-[15px] font-medium tracking-[0.25em] uppercase shrink-0"
          style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
        >
          Last {items.length} · newest first
        </span>
      </div>

      <ul
        className="border-t"
        style={{ borderColor: "var(--t-border-subtle)" }}
      >
        {items.map((item) => {
          const theme = getCategoryTheme(item.category);
          return (
            <li
              key={item.id}
              className="border-b"
              style={{ borderColor: "var(--t-border-subtle)" }}
            >
              <Link
                href={`/ideas/${item.id}`}
                className="grid items-center gap-4 py-2 transition-opacity group hover:opacity-80"
                style={{
                  gridTemplateColumns: "140px minmax(0, 1.2fr) minmax(0, 2fr) 90px",
                }}
              >
                {/* Category */}
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: theme.accent }}
                    aria-hidden
                  />
                  <span
                    className="text-[14px] font-medium tracking-[0.3em] uppercase truncate"
                    style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
                  >
                    {item.category}
                  </span>
                </div>

                {/* Target user */}
                <p
                  className="truncate"
                  style={{
                    fontFamily: SERIF,
                    fontWeight: 700,
                    fontSize: "1.05rem",
                    letterSpacing: "-0.01em",
                    color: "var(--text-primary)",
                  }}
                >
                  For {item.target_user}
                </p>

                {/* Description */}
                <p
                  className="hidden md:block text-[13.5px] leading-[1.5] truncate"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {truncate(item.description, 100)}
                </p>

                {/* Time */}
                <p
                  className="text-right text-[14px] font-medium tracking-[0.2em] uppercase tabular-nums"
                  style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
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
