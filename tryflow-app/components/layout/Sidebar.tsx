"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  LayoutDashboard,
  FlaskConical,
  BarChart3,
  Settings,
  HelpCircle,
  LogOut,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  { label: "Home",        icon: Home,            href: "/home" },
  { label: "Dashboard",   icon: LayoutDashboard, href: "/dashboard" },
  { label: "Experiments", icon: FlaskConical,     href: "/experiments" },
  { label: "Analytics",   icon: BarChart3,        href: "/analytics" },
  { label: "Settings",    icon: Settings,         href: "/settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <aside className="fixed left-0 top-0 z-30 flex flex-col w-[220px] h-screen bg-white border-r border-gray-100">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100">
        {/* Icon: 2×2 grid squares — matching the UI image */}
        <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center shrink-0">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="1" y="1" width="6" height="6" rx="1.5" fill="white" fillOpacity=".9"/>
            <rect x="9" y="1" width="6" height="6" rx="1.5" fill="white" fillOpacity=".6"/>
            <rect x="1" y="9" width="6" height="6" rx="1.5" fill="white" fillOpacity=".6"/>
            <rect x="9" y="9" width="6" height="6" rx="1.5" fill="white" fillOpacity=".4"/>
          </svg>
        </div>
        <div>
          <p className="font-bold text-gray-900 text-sm leading-none">TryFlow</p>
          <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-widest mt-0.5">
            Optimization Engine
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ label, icon: Icon, href }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                active
                  ? "bg-purple-50 text-purple-700"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
              )}
            >
              <Icon className={cn("w-4 h-4 shrink-0", active ? "text-purple-600" : "text-gray-400")} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom — New Experiment + Help + Logout */}
      <div className="px-3 pb-4 space-y-1 border-t border-gray-100 pt-3">
        <Link
          href="/experiments/new"
          className="flex items-center justify-center gap-2 w-full bg-gradient-primary text-white text-sm font-semibold py-2.5 rounded-xl hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          New Experiment
        </Link>
        <Link href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors">
          <HelpCircle className="w-4 h-4 text-gray-400" />
          Help Center
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors w-full"
        >
          <LogOut className="w-4 h-4 text-gray-400" />
          Logout
        </button>
      </div>
    </aside>
  );
}
