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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const GUEST_NAV = [
  { label: "Home",   icon: Home,    href: "/" },
  { label: "Trends", icon: BarChart3, href: "/explore" },
];

const AUTH_NAV = [
  { label: "My Ideas",  icon: LayoutDashboard, href: "/dashboard" },
  { label: "Trends",    icon: BarChart3,        href: "/explore" },
  { label: "Settings",  icon: Settings,         href: "/settings" },
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
        "fixed left-0 top-0 z-40 flex flex-col h-screen bg-white border-r border-gray-100 shadow-sm transition-all duration-200 ease-in-out overflow-hidden",
        expanded ? "w-[220px]" : "w-[64px]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-gray-100 shrink-0 h-[60px]">
        <Link href={isLoggedIn ? "/dashboard" : "/"} className="flex items-center gap-2.5">
          <img src="/logo.png" className="w-8 h-8 shrink-0 " alt="Try.Wepp" />
          <span className={cn(
            "font-bold text-gray-900 text-sm whitespace-nowrap transition-all duration-150",
            expanded ? "opacity-100 delay-75" : "opacity-0"
          )}>
            Try.Wepp
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-hidden">
        {NAV.map(({ label, icon: Icon, href }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              title={!expanded ? label : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5  text-sm font-medium transition-all duration-150 whitespace-nowrap",
                active
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
              )}
            >
              <Icon className={cn("w-4 h-4 shrink-0", active ? "text-indigo-600" : "text-gray-400")} />
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
      <div className="px-2 pb-4 space-y-1 border-t border-gray-100 pt-3 shrink-0">
        {isLoggedIn ? (
          <>
            <Link
              href="/submit"
              title={!expanded ? "Submit Idea" : undefined}
              className="flex items-center justify-center gap-2 w-full bg-indigo-500 text-white text-sm font-bold py-2.5  hover:bg-indigo-400 transition-colors overflow-hidden"
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
              className="flex items-center gap-3 px-3 py-2.5  text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors w-full whitespace-nowrap"
            >
              <LogOut className="w-4 h-4 text-gray-400 shrink-0" />
              <span className={cn("transition-all duration-150", expanded ? "opacity-100 delay-75" : "opacity-0 w-0")}>
                Logout
              </span>
            </button>
          </>
        ) : (
          <Link
            href="/login"
            title={!expanded ? "Log in" : undefined}
            className="flex items-center gap-3 px-3 py-2.5  text-sm font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors whitespace-nowrap"
          >
            <LogIn className="w-4 h-4 shrink-0 text-indigo-600" />
            <span className={cn("transition-all duration-150", expanded ? "opacity-100 delay-75" : "opacity-0 w-0")}>
              Log in
            </span>
          </Link>
        )}
      </div>
    </aside>
  );
}