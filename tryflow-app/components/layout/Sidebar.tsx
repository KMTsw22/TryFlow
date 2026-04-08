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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const GUEST_NAV = [
  { label: "Home",   icon: Home,     href: "/" },
  { label: "Trends", icon: BarChart3, href: "/explore" },
];

const AUTH_NAV = [
  { label: "My Ideas", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Trends",   icon: BarChart3,        href: "/explore" },
  { label: "Compare",  icon: GitCompare,        href: "/compare" },
  { label: "Settings", icon: Settings,          href: "/settings" },
];

interface Props {
  isLoggedIn: boolean;
}

export function Sidebar({ isLoggedIn }: Props) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);

  const NAV = isLoggedIn ? AUTH_NAV : GUEST_NAV;

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
        background: "#080d1e",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-3.5 py-4 shrink-0 h-[60px]"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <Link href={isLoggedIn ? "/dashboard" : "/"} className="flex items-center gap-2.5">
          <img src="/logo.png" className="w-8 h-8 shrink-0" alt="Try.Wepp" />
          <span className={cn(
            "font-bold text-white text-sm whitespace-nowrap transition-all duration-150",
            expanded ? "opacity-100 delay-75" : "opacity-0"
          )}>
            Try.Wepp
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-hidden">
        {NAV.map(({ label, icon: Icon, href }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              title={!expanded ? label : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-150 whitespace-nowrap rounded-sm",
                active
                  ? "text-indigo-300"
                  : "text-gray-500 hover:text-gray-300"
              )}
              style={active ? { background: "rgba(99,102,241,0.12)" } : undefined}
            >
              <Icon className={cn("w-4 h-4 shrink-0", active ? "text-indigo-400" : "text-gray-600")} />
              <span className={cn(
                "transition-all duration-150",
                expanded ? "opacity-100 delay-75" : "opacity-0 w-0"
              )}>
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-2 pb-4 pt-3 space-y-1 shrink-0"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        {isLoggedIn ? (
          <>
            <Link
              href="/submit"
              title={!expanded ? "Submit Idea" : undefined}
              className="flex items-center justify-center gap-2 w-full bg-indigo-500 text-white text-sm font-bold py-2.5 hover:bg-indigo-400 transition-colors overflow-hidden"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span className={cn(
                "whitespace-nowrap transition-all duration-150",
                expanded ? "opacity-100 delay-75" : "opacity-0 w-0"
              )}>
                Submit Idea
              </span>
            </Link>

            <button
              onClick={handleLogout}
              title={!expanded ? "Logout" : undefined}
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-600 hover:text-red-400 transition-colors w-full whitespace-nowrap rounded-sm"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span className={cn(
                "transition-all duration-150",
                expanded ? "opacity-100 delay-75" : "opacity-0 w-0"
              )}>
                Logout
              </span>
            </button>
          </>
        ) : (
          <Link
            href="/login"
            title={!expanded ? "Log in" : undefined}
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-indigo-400 transition-colors whitespace-nowrap rounded-sm"
            style={{ background: "rgba(99,102,241,0.1)" }}
          >
            <LogIn className="w-4 h-4 shrink-0" />
            <span className={cn(
              "transition-all duration-150",
              expanded ? "opacity-100 delay-75" : "opacity-0 w-0"
            )}>
              Log in
            </span>
          </Link>
        )}
      </div>
    </aside>
  );
}