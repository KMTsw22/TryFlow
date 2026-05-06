"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface Props {
  /** 사무톤 라이트 베이스에선 색 반전 없이 일관된 톤. scrolled 는 hover 강화에만 사용. */
  scrolled: boolean;
}

/**
 * Landing 상단 가로 nav (Fastlane).
 * 데모 단계: 로그인 게이트 제거 — 누구나 데모 동선 진입.
 * 한국 사무 SaaS 톤 — 라이트 베이스 위 진한 네이비 CTA.
 */
export function LandingTopNav({ scrolled: _scrolled }: Props) {
  const linkColor = "#334155";
  const ctaBg = "#1E3A8A";
  const ctaText = "#FFFFFF";

  return (
    <div className="flex items-center gap-1 md:gap-2">
      <div className="hidden md:flex items-center gap-0.5 mr-2">
        <Link
          href="/competitions"
          className="text-[13.5px] font-semibold px-3 py-2 transition-colors hover:text-[color:#0F172A]"
          style={{ color: linkColor, letterSpacing: "0.01em" }}
        >
          내 대회
        </Link>
        <Link
          href="/pricing"
          className="text-[13.5px] font-semibold px-3 py-2 transition-colors hover:text-[color:#0F172A]"
          style={{ color: linkColor, letterSpacing: "0.01em" }}
        >
          요금제
        </Link>
      </div>

      <Link
        href="/competitions"
        className="text-[13px] font-semibold px-4 h-9 transition-colors inline-flex items-center gap-1.5"
        style={{
          background: ctaBg,
          color: ctaText,
          letterSpacing: "0.02em",
        }}
      >
        앱 열기
        <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.4} />
      </Link>
    </div>
  );
}
