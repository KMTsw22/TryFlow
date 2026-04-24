import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { NavigationProgress } from "@/components/layout/NavigationProgress";
import { SidebarWrapper } from "@/components/layout/SidebarWrapper";
import { ContentWrapper } from "@/components/layout/ContentWrapper";
import { ThemeProvider } from "@/components/ThemeProvider";
import { CompareTrayProvider } from "@/components/compare/CompareTrayContext";
import { CompareTray } from "@/components/compare/CompareTray";
import { ToastProvider } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Try.Wepp — Where Ideas Meet Investors",
  description:
    "The earliest deal flow. Founders submit ideas, AI scores them on 6 VC-backed axes, and Pro investors reach out — before the product is built.",
};

// Runs before React hydrates. Applies saved theme early to prevent a flash
// of the wrong theme (FOUC). Kept tiny and never throws.
const FOUC_SCRIPT = `(function(){try{var t=localStorage.getItem('trywepp_theme')||'dark';if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  let isLoggedIn = false;
  let plan: string | null = null;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    isLoggedIn = !!user;
    if (user) {
      // 2026-04: Inbox 사이드바 제거되어 contact_requests count 쿼리 불필요해짐.
      // /inbox 페이지/API/DB 는 그대로 유지되지만 nav 진입점은 사라짐 (Gmail 통일).
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("plan")
        .eq("id", user.id)
        .maybeSingle();
      plan = profile?.plan ?? null;
    }
  } catch {
    // Auth or profile query failed — render as logged-out rather than crash the whole app.
  }

  // 2026-04 Role foundation: plan 을 proxy 로 사용해 founder/investor 를 추론.
  //   Pro 구독 = investor 역할 (deal flow 가 목적)
  //   그 외    = founder (빌드 중)
  // 명시적 role 컬럼은 나중에 추가 — 지금은 구독 행동이 의도를 충분히 드러냄.
  const role: "founder" | "investor" = plan === "pro" ? "investor" : "founder";

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* 2026-04 폰트 시스템 재설계 (교수님 피드백 + 경쟁사 리서치):
            - Inter — 본문/UI/카드/라벨 (Linear, Notion, Wellfound, Crunchbase 표준)
            - Fraunces — Hero 헤드라인 한정 (a16z/Sequoia/First Round 패턴, Playfair 대체)
            Plus Jakarta Sans / Playfair Display / Oswald 는 완전 폐기. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700;9..144,900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {/* FOUC prevention — rendered via next/script beforeInteractive so Next
            emits it into the <head> early and React never tries to hydrate it. */}
        <Script id="trywepp-theme-fouc" strategy="beforeInteractive">
          {FOUC_SCRIPT}
        </Script>

        <ThemeProvider>
          <ToastProvider>
            <CompareTrayProvider>
              <NavigationProgress />
              <SidebarWrapper isLoggedIn={isLoggedIn} plan={plan} role={role} />
              <CompareTray />
              <ContentWrapper>{children}</ContentWrapper>
            </CompareTrayProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
