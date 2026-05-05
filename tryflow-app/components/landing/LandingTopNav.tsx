"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface Props {
  /** Landing 의 scroll 상태 — 배경 흰색 vs 투명에 따라 텍스트 색 반전 */
  scrolled: boolean;
}

/**
 * Landing 상단 가로 nav (Fastlane).
 * 데모 단계: 로그인 게이트 제거 — 누구나 데모 동선 진입.
 */
export function LandingTopNav({ scrolled }: Props) {
  const linkColor = scrolled ? "#6b7280" : "rgba(255,255,255,0.7)";
  const ctaBg = scrolled ? "#0B1026" : "white";
  const ctaText = scrolled ? "white" : "#0B1026";

  return (
    <div className="flex items-center gap-1 md:gap-2">
      <div className="hidden md:flex items-center gap-0.5 mr-2">
        <Link
          href="/competitions"
          className="text-sm font-medium px-3 py-2 transition-colors duration-300 hover:opacity-80"
          style={{ color: linkColor }}
        >
          내 대회
        </Link>
        <Link
          href="/pricing"
          className="text-sm font-medium px-3 py-2 transition-colors duration-300 hover:opacity-80"
          style={{ color: linkColor }}
        >
          요금제
        </Link>
      </div>

      <Link
        href="/competitions"
        className="text-sm font-bold px-4 py-2 transition-all duration-300 inline-flex items-center gap-1.5"
        style={{ background: ctaBg, color: ctaText }}
      >
        앱 열기
        <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
      </Link>
    </div>
  );
}
