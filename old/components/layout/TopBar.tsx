"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

interface TopBarProps {
  userName?: string;
  userImage?: string;
}

// 데모 단계: 사용자 아바타·이름 영역 제거. CTA 만 노출.
export function TopBar(_props: TopBarProps) {
  return (
    <header
      className="h-14 border-b flex items-center px-6 gap-4 sticky top-0 z-20"
      style={{
        background: "var(--nav-bg)",
        borderColor: "var(--t-border)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="flex items-center gap-3 ml-auto">
        <Link
          href="/competitions/new"
          className="inline-flex items-center gap-1.5 text-white text-sm font-bold px-4 py-2 transition-[filter] hover:brightness-110"
          style={{ background: "var(--accent)" }}
        >
          <Plus className="w-3.5 h-3.5" /> 새 대회
        </Link>
      </div>
    </header>
  );
}
