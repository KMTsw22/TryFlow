"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Plus,
  Home,
  Tag,
  Trophy,
  Gavel,
  FilePlus,
  Sparkles,
  AlertTriangle,
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";

// ── 역할(Role) 정의 ─────────────────────────────────────────────────────
// Fastlane 은 두 가지 시각의 사용자가 같은 데이터를 다르게 봄.
//   - organizer (주최자): 대회를 운영. 자기 대회의 모든 출품·심사 진척을 봄.
//   - judge (심사위원): 외부에서 초대받은 사람. 본인에게 배정된 대회만 봄.
//
// 데모 단계라 실제 권한 분리(RLS)는 없고, 사이드바 UI 만 역할 토글에 따라
// 다른 메뉴를 보여줌. localStorage 에 마지막 선택을 저장해 새로고침해도 유지.
type Role = "organizer" | "judge";
const ROLE_STORAGE_KEY = "fastlane_role";

// 토글 클릭 시 자동으로 이동할 각 역할의 '메인 페이지'.
// organizer 는 운영 중인 대회 목록, judge 는 배정된 대회 목록.
const ROLE_LANDING: Record<Role, string> = {
  organizer: "/competitions",
  judge: "/judge",
};

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

// ── 역할별 메뉴 분리 ─────────────────────────────────────────────────────
// 같은 데이터(/competitions 등)라도 두 역할이 들어오는 시각이 다르므로,
// 사이드바 라벨·구조 자체를 분리해 한 번에 한 역할만 보여준다.

// '홈' 메뉴는 좌상단 로고 클릭으로 대체 — 사이드바 정보 밀도 ↓ + 진입점 통일.
const ORGANIZER_SECTIONS: NavSection[] = [
  {
    id: "workspace",
    title: "워크스페이스",
    items: [
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
    id: "manage",
    title: "대회 진행",
    items: [
      // '전체 출품'(=/competitions/queue) 은 '내 대회' 와 단위만 다르고 같은
      // 데이터의 다른 뷰라 사용자 혼란을 일으켜 사이드바에서 제거.
      // 페이지 파일은 코드에 남겨둠 — 추후 다대회 시나리오 시 부활 쉽게.
      {
        // 'AI 분쟁 항목' — 사람 손이 필요한 항목만 모아 즉시 액션 유도.
        label: "AI 분쟁 항목",
        icon: AlertTriangle,
        href: "/competitions/pending",
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

const JUDGE_SECTIONS: NavSection[] = [
  {
    id: "workspace",
    title: "워크스페이스",
    items: [
      // judge 정체성 — Gavel(의사봉) 아이콘으로 통일.
      // '홈' 메뉴는 좌상단 로고 클릭으로 대체.
      { label: "내 심사 대회", icon: Gavel, href: "/judge" },
    ],
  },
  {
    id: "info",
    title: "안내",
    items: [{ label: "요금제", icon: Tag, href: "/pricing" }],
  },
];

// 가장 길게 매칭되는 단 하나의 nav 항목 인덱스 결정.
function findActiveItemKey(
  pathname: string,
  sections: NavSection[]
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

// 현재 URL 로부터 어느 role 에 속하는지 추론. 토글이 명시적으로 바뀐 게 아니라도,
// 사용자가 URL 을 직접 친 경우 사이드바가 그 페이지의 역할로 자동 동기화되도록.
function inferRoleFromPath(pathname: string): Role | null {
  if (pathname.startsWith("/judge")) return "judge";
  if (pathname.startsWith("/competitions")) return "organizer";
  return null;
}

interface Props {
  /** 데모 단계라 인증 정보는 받기만 하고 무시 — 모든 사용자에게 동일 nav 노출. */
  isLoggedIn?: boolean;
  plan?: string | null;
}

export function Sidebar(_props: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [stats, setStats] = useState<SidebarStats>({
    totalCompetitions: 0,
    pendingReviewItems: 0,
  });

  // role: SSR 시 항상 organizer 로 기본. mount 후 localStorage / 현재 URL 에서
  // 진짜 값을 동기화 — hydration mismatch 방지.
  const [role, setRole] = useState<Role>("organizer");
  const [hydrated, setHydrated] = useState(false);

  // 1) mount 직후: localStorage 저장값 우선, 없으면 현재 URL 에서 추론.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(ROLE_STORAGE_KEY);
      if (saved === "organizer" || saved === "judge") {
        setRole(saved);
      } else {
        const inferred = inferRoleFromPath(pathname);
        if (inferred) setRole(inferred);
      }
    } catch {
      /* localStorage 차단된 환경(SSR 가짜·일부 incognito)은 default 유지 */
    }
    setHydrated(true);
    // pathname 은 의도적으로 deps 에서 제외 — 첫 mount 시점의 URL 만 본다.
    // 이후 URL 변경은 아래 다른 effect 에서 처리.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2) URL 이 다른 역할 영역으로 바뀌면 role 도 같이 sync.
  //    (예: organizer 모드에서 /judge 링크를 직접 클릭한 경우 메뉴도 따라감.)
  useEffect(() => {
    if (!hydrated) return;
    const inferred = inferRoleFromPath(pathname);
    if (inferred && inferred !== role) {
      setRole(inferred);
      try {
        localStorage.setItem(ROLE_STORAGE_KEY, inferred);
      } catch {}
    }
  }, [pathname, role, hydrated]);

  // pathname 이 /competitions 영역에서 바뀌면 stats 재조회.
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

  function switchRole(next: Role) {
    if (next === role) return;
    setRole(next);
    try {
      localStorage.setItem(ROLE_STORAGE_KEY, next);
    } catch {}
    // 발표 임팩트 — 토글 클릭하면 메뉴만 바뀌는 게 아니라 그 역할의 메인
    // 페이지로 함께 이동해 "역할이 바뀐 게 시각적으로 확실히" 보이게.
    router.push(ROLE_LANDING[next]);
  }

  const sections = role === "organizer" ? ORGANIZER_SECTIONS : JUDGE_SECTIONS;
  const activeKey = findActiveItemKey(pathname, sections);

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
              fontWeight: 700,
              fontSize: "15px",
              letterSpacing: "-0.01em",
              color: "var(--text-primary)",
            }}
          >
            Fastlane
          </span>
        </Link>
      </div>

      {/* Role Toggle — 로고 바로 아래. 확장됐을 땐 segmented control,
          접혔을 땐 활성 role 아이콘 한 개(클릭하면 반대로 토글). */}
      <RoleToggle role={role} onChange={switchRole} expanded={expanded} />

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 overflow-hidden">
        {sections.map((section, sectionIdx) => (
          <div key={section.id} className={cn(sectionIdx > 0 && "mt-5")}>
            {section.title && (
              <div
                className={cn(
                  "px-3 mb-1.5 text-[11px] font-medium transition-all duration-150 overflow-hidden whitespace-nowrap",
                  expanded ? "opacity-100 h-3.5 delay-75" : "opacity-0 h-0"
                )}
                style={{
                  color: "var(--text-tertiary)",
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
                      "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--accent)] focus-visible:-outline-offset-2",
                      active && "text-[color:var(--text-primary)]",
                      !active && "hover:bg-[color:var(--t-border-subtle)]"
                    )}
                    style={{
                      background: active ? "var(--accent-soft)" : undefined,
                      color: active ? "var(--text-primary)" : "var(--text-secondary)",
                    }}
                  >
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

      {/* Bottom — '새 대회' CTA 는 organizer 한정.
          심사위원은 대회를 만들 권한이 없으므로 노출 자체를 안 함. */}
      <div
        className="px-2 pb-4 pt-3 space-y-1.5 shrink-0"
        style={{ borderTop: "1px solid var(--t-border)" }}
      >
        {role === "organizer" && (
          <Link
            href="/competitions/new"
            title={!expanded ? "새 대회" : undefined}
            className={cn(
              "flex items-center h-9 text-[13px] font-medium text-white transition-all overflow-hidden hover:brightness-110",
              expanded ? "justify-start gap-2 px-3" : "justify-center"
            )}
            style={{ background: "var(--accent)", borderRadius: 2 }}
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
        )}

        <Link
          href="/"
          title={!expanded ? "랜딩으로" : undefined}
          className="flex items-center gap-3 px-3 h-9 text-[13px] font-medium transition-colors whitespace-nowrap rounded-sm hover:bg-[color:var(--t-border-subtle)]"
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

// ── Role Toggle 컴포넌트 ──────────────────────────────────────────────────
// 확장: segmented control (주최자 / 심사위원 두 버튼, 활성 쪽 진하게)
// 접힘: 활성 role 아이콘 한 개만 — 클릭하면 반대로 토글.
//
// 두 경우 모두 같은 onChange 콜백을 사용해 사이드바와 메뉴 / URL 동기화.
function RoleToggle({
  role,
  onChange,
  expanded,
}: {
  role: Role;
  onChange: (next: Role) => void;
  expanded: boolean;
}) {
  if (expanded) {
    return (
      <div
        className="mx-2 my-3 grid grid-cols-2 overflow-hidden"
        style={{
          border: "1px solid var(--t-border-subtle)",
          background: "var(--surface-2)",
        }}
        role="tablist"
        aria-label="사용자 역할 전환"
      >
        <RoleButton
          icon={<Briefcase className="w-3.5 h-3.5" strokeWidth={2.2} />}
          label="주최자"
          active={role === "organizer"}
          onClick={() => onChange("organizer")}
        />
        <RoleButton
          icon={<Gavel className="w-3.5 h-3.5" strokeWidth={2.2} />}
          label="심사위원"
          active={role === "judge"}
          onClick={() => onChange("judge")}
        />
      </div>
    );
  }

  // 접힌 상태 — 활성 role 아이콘 하나만. 클릭하면 반대로.
  const next: Role = role === "organizer" ? "judge" : "organizer";
  const Icon = role === "organizer" ? Briefcase : Gavel;
  const nextLabel = next === "organizer" ? "주최자로 전환" : "심사위원으로 전환";
  return (
    <div className="flex justify-center my-3">
      <button
        type="button"
        onClick={() => onChange(next)}
        title={nextLabel}
        aria-label={nextLabel}
        className="inline-flex items-center justify-center w-9 h-9 transition-colors hover:bg-[color:var(--t-border-subtle)]"
        style={{
          background: "var(--accent-soft)",
          border: "1px solid var(--accent-ring)",
          color: "var(--accent)",
        }}
      >
        <Icon className="w-4 h-4" strokeWidth={2.2} />
      </button>
    </div>
  );
}

function RoleButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 h-8 text-[12px] font-semibold transition-colors",
        active ? "" : "hover:bg-[color:var(--t-border-subtle)]"
      )}
      style={{
        background: active ? "var(--accent)" : "transparent",
        color: active ? "#fff" : "var(--text-tertiary)",
        letterSpacing: "0.02em",
      }}
    >
      {icon}
      {label}
    </button>
  );
}
