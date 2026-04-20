"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  BarChart3,
  Settings,
  LogOut,
  Plus,
  LogIn,
  Home,
  GitCompare,
  Sparkles,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";

type NavItem = { label: string; icon: typeof Home; href: string };
type NavSection = { id: string; title: string; items: NavItem[] };

const GUEST_SECTIONS: NavSection[] = [
  {
    id: "main",
    title: "",
    items: [
      { label: "Home",    icon: Home, href: "/" },
      { label: "Pricing", icon: Tag,  href: "/pricing" },
    ],
  },
];

const AUTH_SECTIONS: NavSection[] = [
  {
    id: "create",
    title: "Create",
    items: [
      { label: "My Ideas", icon: LayoutDashboard, href: "/dashboard" },
    ],
  },
  {
    id: "explore",
    title: "Explore",
    items: [
      { label: "Market",  icon: BarChart3,  href: "/explore" },
      { label: "Compare", icon: GitCompare, href: "/compare" },
    ],
  },
  {
    id: "account",
    title: "Account",
    items: [
      { label: "Settings", icon: Settings, href: "/settings" },
    ],
  },
];

interface Props {
  isLoggedIn: boolean;
  plan?: string | null;
}

export function Sidebar({ isLoggedIn, plan }: Props) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);

  const SECTIONS = isLoggedIn ? AUTH_SECTIONS : GUEST_SECTIONS;

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

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
          aria-label="Try.Wepp — go to home"
          className="flex items-center gap-2.5"
        >
          <img src="/logo.png" className="w-7 h-7 shrink-0" alt="Try.Wepp" />
          <span
            className={cn(
              "whitespace-nowrap transition-all duration-150",
              expanded ? "opacity-100 delay-75" : "opacity-0"
            )}
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 900,
              fontSize: "1rem",
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
            }}
          >
            Try.Wepp
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
                  "px-3 mb-1.5 text-[12px] font-semibold tracking-widest uppercase transition-all duration-150 overflow-hidden whitespace-nowrap",
                  expanded ? "opacity-100 h-4 delay-75" : "opacity-0 h-0"
                )}
                style={{ color: "var(--text-tertiary)" }}
              >
                {section.title}
              </div>
            )}
            <div className="space-y-0.5">
              {section.items.map(({ label, icon: Icon, href }) => {
                const active =
                  pathname === href || (href !== "/" && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    title={!expanded ? label : undefined}
                    className={cn(
                      "flex items-center gap-3 px-3 h-9 text-sm font-medium transition-colors whitespace-nowrap rounded-sm",
                      active && "text-[color:var(--text-primary)]",
                      !active && "hover:bg-[color:var(--t-border-subtle)]"
                    )}
                    style={{
                      background: active ? "var(--accent-soft)" : undefined,
                      color: active ? "var(--text-primary)" : "var(--text-secondary)",
                    }}
                  >
                    <Icon
                      className="w-4 h-4 shrink-0"
                      style={{
                        color: active ? "var(--accent)" : "var(--text-tertiary)",
                      }}
                    />
                    <span
                      className={cn(
                        "transition-all duration-150",
                        expanded ? "opacity-100 delay-75" : "opacity-0 w-0"
                      )}
                    >
                      {label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div
        className="px-2 pb-4 pt-3 space-y-1.5 shrink-0"
        style={{ borderTop: "1px solid var(--t-border)" }}
      >
        {isLoggedIn ? (
          <>
            {/* Primary CTA — Submit idea */}
            <Link
              href="/submit"
              title={!expanded ? "Submit idea" : undefined}
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
                Submit idea
              </span>
            </Link>

            {/* Upgrade to Pro — subtle, only for non-Pro */}
            {plan !== "pro" && (
              <Link
                href="/pricing"
                title={!expanded ? "Upgrade to Pro" : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 h-9 text-sm font-medium transition-colors whitespace-nowrap rounded-sm border",
                  "hover:bg-[color:var(--accent-soft)]"
                )}
                style={{
                  borderColor: "var(--accent-ring)",
                  color: "var(--accent)",
                }}
              >
                <Sparkles className="w-4 h-4 shrink-0" />
                <span
                  className={cn(
                    "flex-1 transition-all duration-150",
                    expanded ? "opacity-100 delay-75" : "opacity-0 w-0"
                  )}
                >
                  Upgrade
                </span>
                <span
                  className={cn(
                    "text-[12px] font-bold uppercase tracking-widest transition-all duration-150",
                    expanded ? "opacity-100 delay-75" : "opacity-0 w-0"
                  )}
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Pro
                </span>
              </Link>
            )}

            <ThemeToggle expanded={expanded} />

            <button
              onClick={handleLogout}
              title={!expanded ? "Logout" : undefined}
              className="flex items-center gap-3 px-3 h-9 text-sm font-medium transition-colors w-full whitespace-nowrap rounded-sm hover:bg-[color:var(--t-border-subtle)]"
              style={{ color: "var(--text-tertiary)" }}
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span
                className={cn(
                  "transition-all duration-150",
                  expanded ? "opacity-100 delay-75" : "opacity-0 w-0"
                )}
              >
                Logout
              </span>
            </button>
          </>
        ) : (
          <>
            <ThemeToggle expanded={expanded} />
            <Link
              href="/login"
              title={!expanded ? "Log in" : undefined}
              className="flex items-center gap-3 px-3 h-9 text-sm font-semibold transition-colors whitespace-nowrap rounded-sm"
              style={{
                background: "var(--accent-soft)",
                color: "var(--accent)",
              }}
            >
              <LogIn className="w-4 h-4 shrink-0" />
              <span
                className={cn(
                  "transition-all duration-150",
                  expanded ? "opacity-100 delay-75" : "opacity-0 w-0"
                )}
              >
                Log in
              </span>
            </Link>
          </>
        )}
      </div>
    </aside>
  );
}
