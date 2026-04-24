import { timeAgo } from "@/lib/categories";

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

const DISPLAY = "'Inter', sans-serif";

/**
 * LiveFeed — 한 줄짜리 "플랫폼 활성화" 인디케이터.
 *
 * 2026-04 redesign 3 (옵션 A · 단일 요약줄):
 *   "Live — N recent · Category A, Category B, Category C · last Xm ago"
 *
 * 이전 버전(리스트형)이 공간을 차지하는 데 비해 정보 가치가 낮다는 지적 반영.
 * 개별 아이템을 보고 싶으면 New This Week (상단) 또는 Market Board 로 유도.
 * 이 컴포넌트는 순수 pulse — "플랫폼이 살아있다" 는 신호 1줄.
 */
export function LiveFeed({ items }: Props) {
  if (!items || items.length === 0) return null;

  // 카테고리별 빈도 → 상위 3개 나열 (사용자 관점에서 "어디에 활동이 몰리는지")
  const categoryCounts = new Map<string, number>();
  for (const item of items) {
    categoryCounts.set(item.category, (categoryCounts.get(item.category) ?? 0) + 1);
  }
  const topCategories = [...categoryCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat]) => cat);

  const lastItem = items[0];
  const lastAgo = lastItem ? timeAgo(lastItem.created_at) : null;

  return (
    <section
      aria-label="Platform activity indicator"
      className="flex items-center flex-wrap gap-x-3 gap-y-1 py-3 border-t"
      style={{ borderColor: "var(--t-border-subtle)" }}
    >
      {/* Pulse dot — 살아있다는 시각 신호 */}
      <span className="relative inline-flex items-center shrink-0" aria-hidden>
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: "var(--signal-success)" }}
        />
        <span
          className="absolute inline-flex w-1.5 h-1.5 rounded-full animate-ping"
          style={{ background: "var(--signal-success)", opacity: 0.4 }}
        />
      </span>

      {/* Label */}
      <span
        className="text-[11px] font-bold tracking-[0.08em] uppercase shrink-0"
        style={{ fontFamily: DISPLAY, color: "var(--signal-success)" }}
      >
        Live
      </span>

      {/* Separator */}
      <span
        className="text-[11px] shrink-0"
        style={{ color: "var(--text-tertiary)", opacity: 0.5 }}
        aria-hidden
      >
        ·
      </span>

      {/* Count + copy */}
      <span
        className="text-[12.5px] leading-[1.5]"
        style={{ fontFamily: DISPLAY, color: "var(--text-secondary)" }}
      >
        <span className="tabular-nums font-semibold" style={{ color: "var(--text-primary)" }}>
          {items.length}
        </span>{" "}
        recent submission{items.length === 1 ? "" : "s"}
        {topCategories.length > 0 && (
          <>
            {" across "}
            <span style={{ color: "var(--text-primary)" }}>
              {topCategories.join(", ")}
            </span>
          </>
        )}
      </span>

      {/* Last activity — 시각적 priority 낮게 (오른쪽 밀려서) */}
      {lastAgo && (
        <span
          className="ml-auto text-[11px] font-medium tracking-[0.06em] uppercase tabular-nums shrink-0"
          style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)", opacity: 0.7 }}
        >
          last {lastAgo}
        </span>
      )}
    </section>
  );
}
