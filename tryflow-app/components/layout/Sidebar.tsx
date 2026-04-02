"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Home,
  LayoutDashboard,
  BarChart3,
  Settings,
  HelpCircle,
  LogOut,
  Plus,
  Compass,
  LogIn,
  Coins,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { TwLogo } from "@/components/ui/TwLogo";

const GUEST_NAV = [
  { label: "Home",    icon: Home,    href: "/" },
  { label: "Explore", icon: Compass, href: "/explore" },
];

const AUTH_NAV = [
  { label: "Home",      icon: Home,            href: "/home" },
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Analytics", icon: BarChart3,        href: "/analytics" },
  { label: "Settings",  icon: Settings,         href: "/settings" },
];

interface Props {
  isLoggedIn: boolean;
}

export function Sidebar({ isLoggedIn }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    if (!isLoggedIn) return;
    const fetchCredits = () =>
      fetch("/api/credits").then(r => r.json()).then(d => setCredits(d.balance ?? 0)).catch(() => {});
    fetchCredits();
    window.addEventListener("credits-updated", fetchCredits);
    return () => window.removeEventListener("credits-updated", fetchCredits);
  }, [isLoggedIn]);

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
        <Link href={isLoggedIn ? "/home" : "/"} className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center shrink-0">
            <TwLogo className="w-4 h-4" />
          </div>
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
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 whitespace-nowrap",
                active
                  ? "bg-teal-50 text-teal-700"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
              )}
            >
              <Icon className={cn("w-4 h-4 shrink-0", active ? "text-teal-600" : "text-gray-400")} />
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
            {credits !== null && (
              <div
                title={!expanded ? `${credits.toLocaleString()} credits` : undefined}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-100 overflow-hidden"
              >
                <Coins className="w-4 h-4 text-amber-500 shrink-0" />
                <span className={cn(
                  "text-xs font-bold text-amber-700 whitespace-nowrap transition-all duration-150",
                  expanded ? "opacity-100 delay-75" : "opacity-0 w-0"
                )}>
                  {credits.toLocaleString()} credits
                </span>
              </div>
            )}

            <Link
              href="/experiments/new"
              title={!expanded ? "New Experiment" : undefined}
              className="flex items-center justify-center gap-2 w-full bg-teal-500 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-teal-600 transition-colors overflow-hidden"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span className={cn(
                "whitespace-nowrap transition-all duration-150",
                expanded ? "opacity-100 delay-75" : "opacity-0 w-0"
              )}>
                New Experiment
              </span>
            </Link>

            <Link
              href="#"
              title={!expanded ? "Help Center" : undefined}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors whitespace-nowrap"
            >
              <HelpCircle className="w-4 h-4 text-gray-400 shrink-0" />
              <span className={cn("transition-all duration-150", expanded ? "opacity-100 delay-75" : "opacity-0 w-0")}>
                Help Center
              </span>
            </Link>

            <button
              onClick={handleLogout}
              title={!expanded ? "Logout" : undefined}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors w-full whitespace-nowrap"
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
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 transition-colors whitespace-nowrap"
          >
            <LogIn className="w-4 h-4 shrink-0 text-teal-600" />
            <span className={cn("transition-all duration-150", expanded ? "opacity-100 delay-75" : "opacity-0 w-0")}>
              Log in
            </span>
          </Link>
        )}
      </div>
    </aside>
  );
}
