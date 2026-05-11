"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Plus,
  Home,
  Tag,
  Trophy,
  ClipboardList,
  Gavel,
  FilePlus,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";

type NavItem = {
  label: string;
  icon: typeof Home;
  href: string;
  badgeKey?: "totalCompetitions" | "pendingReviewItems";
};
type NavSection = { id: string; title: string; items: NavItem[] };

interface SidebarStats {
  totalCompetitions: number;
  pendingReviewItems: number;
}

// 가장 길게 매칭되는 단 하나의 nav 항목 인덱스를 결정.
// 같은 href를 가진 항목이 여러 개여도 첫 번째만 active 로 잡혀 시각적 충돌 방지.
function findActiveItemKey(
  pathname: string,
  sections: NavSection[],
): string | null {
  let best: { key: string; len: number } | null = null;
  for (const section of sections) {
    for (let i = 0; i < section.items.length; i++) {
      const item = section.items[i];
      const matches =
        item.href === "/"
          ? pathname === "/"
          : pathname === item.href || pathname.startsWith(item.href + "/");
      if (!matches) continue;
      const len = item.href.length;
      if (best === null || len > best.len) {
        best = { key: `${section.id}:${i}`, len };
      }
    }
  }
  return best?.key ?? null;
}

// nav 구조 — badgeKey 가 있으면 /api/competitions/stats 결과로 카운트 표시.
// '검토 대기' 는 별도 페이지가 없고 분산 큰 항목이 있는 대회로 안내하는 의미라
// /competitions 로 동일하게 보내되 badge 로만 차별화.
const SECTIONS: NavSection[] = [
  {
    id: "workspace",
    title: "워크스페이스",
    items: [
      { label: "홈", icon: Home, href: "/" },
      {
        label: "내 대회",
        icon: Trophy,
        href: "/competitions",
        badgeKey: "totalCompetitions",
      },
      { label: "새 대회", icon: FilePlus, href: "/competitions/new" },
    ],
  },
  {
    id: "judge",
    title: "심사",
    items: [
      { label: "심사 큐", icon: Gavel, href: "/competitions" },
      {
        label: "검토 대기",
        icon: ClipboardList,
        href: "/competitions",
        badgeKey: "pendingReviewItems",
      },
    ],
  },
  {
    id: "info",
    title: "안내",
    items: [{ label: "요금제", icon: Tag, href: "/pricing" }],
  },
];

interface Props {
  /** 데모 단계라 인증 정보는 받기만 하고 무시 — 모든 사용자에게 동일 nav 노출. */
  isLoggedIn?: boolean;
  plan?: string | null;
  role?: "organizer" | "judge";
}

export function Sidebar(_props: Props) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const [stats, setStats] = useState<SidebarStats>({
    totalCompetitions: 0,
    pendingReviewItems: 0,
  });

  // pathname 이 /competitions 영역에서 바뀌면 stats 재조회 — 새 대회 만들거나
  // 평가가 끝나서 검토 권고 수가 변할 수 있으므로.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/competitions/stats", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: SidebarStats | null) => {
        if (cancelled || !data) return;
        setStats({
          totalCompetitions: data.totalCompetitions ?? 0,
          pendingReviewItems: data.pendingReviewItems ?? 0,
        });
      })
      .catch(() => {
        /* 무시 — 사이드바 뱃지가 없어도 nav 자체는 동작 */
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const activeKey = findActiveItemKey(pathname, SECTIONS);

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className={cn(
        "fixed left-0 top-0 z-40 flex flex-col h-screen transition-all duration-200 ease-in-out overflow-hidden",
        expanded ? "w-[200px]" : "w-[64px]"
      )}
      style={{
        background: "var(--sidebar-bg)",
        borderRight: "1px solid var(--t-border)",
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-2.5 px-3.5 py-4 shrink-0 h-[60px]"
        style={{ borderBottom: "1px solid var(--t-border)" }}
      >
        <Link
          href="/"
          aria-label="Fastlane — 홈으로"
          className="flex items-center gap-2.5"
        >
          <img src="/logo.png" className="w-7 h-7 shrink-0" alt="Fastlane" />
          <span
            className={cn(
              "whitespace-nowrap transition-all duration-150",
              expanded ? "opacity-100 delay-75" : "opacity-0"
            )}
            style={{
              fontFamily: "'Fraunces', serif",
              fontWeight: 900,
              fontSize: "1rem",
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
            }}
          >
            Fastlane
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 overflow-hidden">
        {SECTIONS.map((section, sectionIdx) => (
          <div key={section.id} className={cn(sectionIdx > 0 && "mt-5")}>
            {section.title && (
              <div
                className={cn(
                  "px-3 mb-2 text-[10px] font-bold uppercase transition-all duration-150 overflow-hidden whitespace-nowrap",
                  expanded ? "opacity-100 h-3 delay-75" : "opacity-0 h-0"
                )}
                style={{
                  color: "var(--text-tertiary)",
                  letterSpacing: "0.18em",
                }}
              >
                {section.title}
              </div>
            )}
            <div className="space-y-0.5">
              {section.items.map(({ label, icon: Icon, href, badgeKey }, itemIdx) => {
                const active = activeKey === `${section.id}:${itemIdx}`;
                const badgeCount = badgeKey ? stats[badgeKey] : 0;
                const showBadge = badgeCount > 0;
                return (
                  <Link
                    key={`${section.id}:${itemIdx}`}
                    href={href}
                    title={!expanded ? `${label}${showBadge ? ` (${badgeCount})` : ""}` : undefined}
                    className={cn(
                      "relative flex items-center gap-3 px-3 h-9 text-[13px] font-medium transition-colors whitespace-nowrap",
                      // 키보드 탭 사용자에게는 focus ring 유지, 마우스 클릭 후엔 안 보이도록.
                      "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--accent)] focus-visible:-outline-offset-2",
                      active && "text-[color:var(--text-primary)]",
                      !active && "hover:bg-[color:var(--t-border-subtle)]"
                    )}
                    style={{
                      background: active ? "var(--accent-soft)" : undefined,
                      color: active ? "var(--text-primary)" : "var(--text-secondary)",
                    }}
                  >
                    {/* active 일 때 좌측 vertical accent — 카드/리더보드와 일관된 시그니처 */}
                    {active && (
                      <span
                        aria-hidden
                        className="absolute left-0 top-1.5 bottom-1.5 w-[2px]"
                        style={{ background: "var(--accent)" }}
                      />
                    )}
                    <span className="relative shrink-0">
                      <Icon
                        className="w-4 h-4"
                        style={{
                          color: active ? "var(--accent)" : "var(--text-tertiary)",
                        }}
                      />
                      {showBadge && !expanded && (
                        <span
                          className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full"
                          style={{ background: "var(--accent)" }}
                          aria-hidden
                        />
                      )}
                    </span>
                    <span
                      className={cn(
                        "flex-1 transition-all duration-150",
                        expanded ? "opacity-100 delay-75" : "opacity-0 w-0"
                      )}
                    >
                      {label}
                    </span>
                    {showBadge && (
                      <span
                        className={cn(
                          "inline-flex items-center justify-center px-1.5 h-5 rounded-sm text-[10.5px] font-bold tabular-nums transition-all duration-150",
                          expanded ? "opacity-100 delay-75" : "opacity-0 w-0 h-0 px-0"
                        )}
                        style={{
                          background: "var(--accent)",
                          color: "#fff",
                          fontFamily: "'Inter', sans-serif",
                          minWidth: expanded ? "1.25rem" : "0",
                        }}
                        aria-label={`${badgeCount} new`}
                      >
                        {badgeCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom — 데모 단계: 새 대회 만들기 CTA + 테마 토글만 노출. */}
      <div
        className="px-2 pb-4 pt-3 space-y-1.5 shrink-0"
        style={{ borderTop: "1px solid var(--t-border)" }}
      >
        <Link
          href="/competitions/new"
          title={!expanded ? "새 대회" : undefined}
          className={cn(
            "flex items-center h-9 text-sm font-semibold text-white transition-all overflow-hidden hover:brightness-110",
            expanded ? "justify-start gap-2 px-3" : "justify-center"
          )}
          style={{ background: "var(--accent)" }}
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span
            className={cn(
              "whitespace-nowrap transition-all duration-150",
              expanded ? "opacity-100 delay-75" : "opacity-0 w-0"
            )}
          >
            새 대회
          </span>
        </Link>

        <Link
          href="/"
          title={!expanded ? "랜딩으로" : undefined}
          className="flex items-center gap-3 px-3 h-9 text-sm font-medium transition-colors whitespace-nowrap rounded-sm hover:bg-[color:var(--t-border-subtle)]"
          style={{ color: "var(--text-tertiary)" }}
        >
          <Sparkles className="w-4 h-4 shrink-0" />
          <span
            className={cn(
              "transition-all duration-150",
              expanded ? "opacity-100 delay-75" : "opacity-0 w-0"
            )}
          >
            랜딩으로
          </span>
        </Link>

        <ThemeToggle expanded={expanded} />
      </div>
    </aside>
  );
}
