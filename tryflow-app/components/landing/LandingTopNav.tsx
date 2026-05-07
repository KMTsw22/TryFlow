"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface Props {
  scrolled: boolean;
  /** 아날로그 랜딩(책상 톤)과 맞춘 색·그림자 */
  analog?: boolean;
}

export function LandingTopNav({ scrolled: _scrolled, analog }: Props) {
  const ink = analog ? "#1a1814" : "#000000";
  /** 기본: 공문용 남청(#2a4a72). analog: 책상 랜딩용 뮤트 블루 */
  const blue = analog ? "#3d4f62" : "#2a4a72";
  const paper = analog ? "#fffef8" : "#FFFFFF";

  return (
    <div className="flex items-center gap-1 md:gap-2">
      <div className="hidden md:flex items-center gap-0.5 mr-2">
        <Link
          href="/competitions"
          className="text-[13px] font-bold px-3 py-2 rounded-sm transition-opacity hover:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2a4a72]"
          style={{ color: ink, letterSpacing: "0.06em" }}
        >
          내 대회
        </Link>
        <Link
          href="/pricing"
          className="text-[13px] font-bold px-3 py-2 rounded-sm transition-opacity hover:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2a4a72]"
          style={{ color: ink, letterSpacing: "0.06em" }}
        >
          요금제
        </Link>
      </div>

      <Link
        href="/competitions"
        className={`text-[12.5px] font-bold px-4 h-9 inline-flex items-center gap-1.5 rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2a4a72] ${
          analog ? "shadow-[2px_3px_0_rgba(0,0,0,0.1)]" : "border border-black"
        }`}
        style={{
          background: blue,
          color: paper,
          letterSpacing: "0.08em",
          borderColor: analog ? "rgba(45,42,40,0.25)" : blue,
          borderWidth: 1,
          borderStyle: "solid",
          borderRadius: analog ? 2 : undefined,
        }}
      >
        앱 열기
        <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
      </Link>
    </div>
  );
}
