"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
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
  badgeCount?: number;
};
type NavSection = { id: string; title: string; items: NavItem[] };

// Fastlane 데모 단계: 로그인 없이 누구나 들어와서 데모 동선만 확인.
// nav 는 mock 기반 데모 페이지만 노출 (실제 DB 의존 페이지는 발표 후 정리).
const DEMO_SECTIONS: NavSection[] = [
  {
    id: "workspace",
    title: "데모",
    items: [
      { label: "홈", icon: Home, href: "/" },
      { label: "내 대회", icon: Trophy, href: "/competitions" },
      { label: "새 대회", icon: FilePlus, href: "/competitions/new" },
    ],
  },
  {
    id: "judge",
    title: "심사",
    items: [
      { label: "심사 큐", icon: Gavel, href: "/competitions" },
      { label: "검토 대기", icon: ClipboardList, href: "/competitions/demo-2026-spring" },
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

  const SECTIONS = DEMO_SECTIONS;

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
              {section.items.map(({ label, icon: Icon, href, badgeCount }) => {
                const active =
                  pathname === href || (href !== "/" && pathname.startsWith(href));
                const showBadge = typeof badgeCount === "number" && badgeCount > 0;
                return (
                  <Link
                    key={href}
                    href={href}
                    title={!expanded ? `${label}${showBadge ? ` (${badgeCount})` : ""}` : undefined}
                    className={cn(
                      "relative flex items-center gap-3 px-3 h-9 text-[13px] font-medium transition-colors whitespace-nowrap",
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
