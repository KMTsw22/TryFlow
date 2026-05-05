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

export const metadata: Metadata = {
  title: "Fastlane — AI 기반 창업 평가 플랫폼",
  description:
    "정부 사업·창업 경진대회의 1차 평가를 AI가 공정하게. 주최 측이 평가표를 입력하면 AI가 다중 실행 + 평균/표준편차로 점수를 산출하고, 분산 큰 항목은 인간 심사위원에게 넘깁니다.",
};

// Runs before React hydrates. Applies saved theme early to prevent a flash
// of the wrong theme (FOUC). Kept tiny and never throws.
const FOUC_SCRIPT = `(function(){try{var t=localStorage.getItem('fastlane_theme')||'dark';if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fastlane 데모 단계: 로그인 게이트 제거. 사이드바도 인증 무관 단일 nav.
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        {/* 2026-05 Korean-first 타이포 시스템:
            - Pretendard Variable — 본문/UI/대부분 (한글·영문 모두 자연스럽게 처리)
            - Fraunces            — display 한정 (Brand mark, 큰 점수, 인용)
            Inter 는 폴백 체인에만 둠. */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700;9..144,800;9..144,900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {/* FOUC prevention — rendered via next/script beforeInteractive so Next
            emits it into the <head> early and React never tries to hydrate it. */}
        <Script id="fastlane-theme-fouc" strategy="beforeInteractive">
          {FOUC_SCRIPT}
        </Script>

        <ThemeProvider>
          <ToastProvider>
            <CompareTrayProvider>
              <NavigationProgress />
              <SidebarWrapper />
              <CompareTray />
              <ContentWrapper>{children}</ContentWrapper>
            </CompareTrayProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
