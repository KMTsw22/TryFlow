"use client";

import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";

interface TopBarProps {
  userName?: string;
  userImage?: string;
}

export function TopBar({ userName = "User", userImage }: TopBarProps) {
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header
      className="h-14 border-b flex items-center px-6 gap-4 sticky top-0 z-20"
      style={{ background: "var(--nav-bg)", borderColor: "var(--t-border)", backdropFilter: "blur(12px)" }}
    >

      {/* Right side */}
      <div className="flex items-center gap-3 ml-auto">
        <Link
          href="/submit"
          className="inline-flex items-center gap-1.5 text-white text-sm font-bold px-4 py-2 transition-[filter] hover:brightness-110"
          style={{ background: "var(--accent)" }}
        >
          <Plus className="w-3.5 h-3.5" /> Submit idea
        </Link>

        <div className="flex items-center gap-2.5 pl-3 ml-1 border-l" style={{ borderColor: "var(--t-border-bright)" }}>
          {userImage ? (
            <Image src={userImage} alt={userName} width={32} height={32} className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ background: "var(--accent)" }}
            >
              {initials}
            </div>
          )}
          <p
            className="text-sm font-semibold max-w-[120px] truncate"
            style={{ color: "var(--text-secondary)" }}
          >
            {userName}
          </p>
        </div>
      </div>
    </header>
  );
}