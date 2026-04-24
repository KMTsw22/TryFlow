"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  /** Landing 의 scroll 상태 — 배경 흰색 vs 투명에 따라 텍스트 색 반전 */
  scrolled: boolean;
}

type NavItem = { label: string; href: string };

/**
 * Landing 상단 가로 nav.
 *
 * 2026-04: 사이드바에 있는 기능들 (My Ideas, Watchlist, Market 등) 을 랜딩의
 * 상단에 가로로 배치. 로그인 / 비로그인 상태별 다른 메뉴.
 *
 * 비로그인: Pricing | Log in | Get early access
 * Founder:  My Ideas · Watchlist · Market · Settings | Open app →
 * Investor: Market · Watchlist · Settings | Open app →
 */
export function LandingTopNav({ scrolled }: Props) {
  const [plan, setPlan] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let active = true;
    supabase.auth.getUser().then(async ({ data }) => {
      if (!active) return;
      if (data.user) {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("plan")
          .eq("id", data.user.id)
          .maybeSingle();
        if (!active) return;
        setIsLoggedIn(true);
        setPlan(profile?.plan ?? null);
      }
      setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const isInvestor = plan === "pro";
  const homeHref = isInvestor ? "/explore" : "/dashboard";

  const linkColor = scrolled ? "#6b7280" : "rgba(255,255,255,0.7)";
  const ctaBg = scrolled ? "#0B1026" : "white";
  const ctaText = scrolled ? "white" : "#0B1026";

  const items: NavItem[] = !isLoggedIn
    ? [{ label: "Pricing", href: "/pricing" }]
    : isInvestor
    ? [
        { label: "Market", href: "/explore" },
        { label: "Watchlist", href: "/watchlist" },
        { label: "Settings", href: "/settings" },
      ]
    : [
        { label: "My Ideas", href: "/dashboard" },
        { label: "Watchlist", href: "/watchlist" },
        { label: "Market", href: "/explore" },
        { label: "Settings", href: "/settings" },
      ];

  return (
    <div className="flex items-center gap-1 md:gap-2">
      {/* Left of CTAs: sidebar 기능 가로 nav */}
      {loaded && (
        <div className="hidden md:flex items-center gap-0.5 mr-2">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium px-3 py-2 transition-colors duration-300 hover:opacity-80"
              style={{ color: linkColor }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}

      {/* Right: auth 상태별 CTA */}
      {loaded ? (
        isLoggedIn ? (
          <Link
            href={homeHref}
            className="text-sm font-bold px-4 py-2 transition-all duration-300 inline-flex items-center gap-1.5"
            style={{ background: ctaBg, color: ctaText }}
          >
            Open app
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
          </Link>
        ) : (
          <>
            <Link
              href="/login"
              className="text-sm font-medium px-3 py-2 transition-colors duration-300"
              style={{ color: linkColor }}
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="text-sm font-bold px-4 py-2 transition-all duration-300"
              style={{ background: ctaBg, color: ctaText }}
            >
              Get early access →
            </Link>
          </>
        )
      ) : (
        // 로딩 중엔 default(비로그인) layout 으로 보여서 layout shift 최소화
        <>
          <Link
            href="/login"
            className="text-sm font-medium px-3 py-2 transition-colors duration-300"
            style={{ color: linkColor }}
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="text-sm font-bold px-4 py-2 transition-all duration-300"
            style={{ background: ctaBg, color: ctaText }}
          >
            Get early access →
          </Link>
        </>
      )}
    </div>
  );
}
