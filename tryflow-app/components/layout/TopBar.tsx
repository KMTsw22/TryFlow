"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, GitCompare, LayoutDashboard } from "lucide-react";

interface TopBarProps {
  userName?: string;
  userImage?: string;
}

export function TopBar({ userName = "User", userImage }: TopBarProps) {
  const pathname = usePathname();
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const navLinks = [
    { href: "/dashboard", label: "My Ideas", icon: LayoutDashboard },
    { href: "/compare",   label: "Compare",  icon: GitCompare },
  ];

  return (
    <header
      className="h-14 border-b flex items-center px-6 gap-4 sticky top-0 z-20"
      style={{ background: "rgba(5,8,22,0.95)", borderColor: "rgba(255,255,255,0.06)", backdropFilter: "blur(12px)" }}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mr-4">
        <img src="/logo.png" className="w-6 h-6" alt="Try.Wepp" />
        <span className="font-bold text-white text-sm">Try.Wepp</span>
      </Link>

      {/* Nav links */}
      <nav className="flex items-center gap-1">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors rounded-sm ${
                active
                  ? "text-white bg-white/[0.08]"
                  : "text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-3 ml-auto">
        <Link
          href="/submit"
          className="inline-flex items-center gap-1.5 bg-indigo-500 text-white text-sm font-bold px-4 py-2 hover:bg-indigo-400 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Submit idea
        </Link>

        <div className="flex items-center gap-2.5 pl-3 ml-1 border-l" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          {userImage ? (
            <Image src={userImage} alt={userName} width={32} height={32} className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {initials}
            </div>
          )}
          <p className="text-sm font-semibold text-gray-300 max-w-[120px] truncate">{userName}</p>
        </div>
      </div>
    </header>
  );
}