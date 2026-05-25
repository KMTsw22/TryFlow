"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Brand } from "@/components/layout/Brand";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [guestLoading, setGuestLoading] = useState(false);
  const [guestError, setGuestError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    const supabase = createClient();
    const next = searchParams?.get("next");
    const callback = `${location.origin}/auth/callback${
      next ? `?next=${encodeURIComponent(next)}` : ""
    }`;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callback },
    });
  };

  const handleGuestLogin = async () => {
    setGuestLoading(true);
    setGuestError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInAnonymously();
    if (error) {
      setGuestError(
        error.message ||
          "게스트 로그인을 사용할 수 없습니다. Google 로그인을 이용해주세요."
      );
      setGuestLoading(false);
      return;
    }
    const next = searchParams?.get("next") ?? "/competitions";
    router.push(next);
    router.refresh();
  };

  return (
    <div className="border p-8" style={{ background: "var(--card-bg)", borderColor: "var(--t-border-card)" }}>
      <h2 className="text-lg font-bold text-center" style={{ color: "var(--text-primary)" }}>로그인하고 시작하기</h2>
      <p className="text-sm text-center mt-1 mb-8" style={{ color: "var(--text-tertiary)" }}>
        처음이든 다시 오시든 — 아래 버튼 하나로 시작
      </p>

      <button
        onClick={handleGoogleLogin}
        className="w-full flex items-center justify-center gap-3 border font-semibold px-6 py-3 transition-colors text-sm hover:opacity-80"
        style={{
          borderColor: "var(--t-border-card)",
          background: "var(--input-bg)",
          color: "var(--text-primary)",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
          <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
        </svg>
        Google 계정으로 계속하기
      </button>

      <div className="flex items-center gap-3 my-5" aria-hidden>
        <span className="flex-1 h-px" style={{ background: "var(--t-border-subtle)" }} />
        <span
          className="text-[11px]"
          style={{ color: "var(--text-tertiary)" }}
        >
          또는
        </span>
        <span className="flex-1 h-px" style={{ background: "var(--t-border-subtle)" }} />
      </div>

      <button
        onClick={handleGuestLogin}
        disabled={guestLoading}
        className="w-full flex items-center justify-center gap-3 border font-semibold px-6 py-3 transition-colors text-sm hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          borderColor: "var(--t-border-card)",
          background: "transparent",
          color: "var(--text-secondary)",
        }}
      >
        {guestLoading ? "로그인 중…" : "게스트로 계속하기"}
      </button>

      {guestError && (
        <p
          role="alert"
          className="text-xs text-center mt-3"
          style={{ color: "var(--signal-danger)" }}
        >
          {guestError}
        </p>
      )}

      <p
        className="text-[11px] text-center mt-3 leading-relaxed"
        style={{ color: "var(--text-tertiary)" }}
      >
        이메일 없이도 시작할 수 있어요. 나중에 Google 계정을 연결하면 운영 기록이 그대로 이어집니다.
      </p>

      <p className="text-xs text-center mt-6 leading-relaxed" style={{ color: "var(--text-tertiary)" }}>
        로그인하면{" "}
        <a
          href="#"
          className="transition-[filter] hover:brightness-110"
          style={{ color: "var(--accent)" }}
        >
          이용약관
        </a>
        {" "}과{" "}
        <a
          href="#"
          className="transition-[filter] hover:brightness-110"
          style={{ color: "var(--accent)" }}
        >
          개인정보처리방침
        </a>
        에 동의한 것으로 봅니다.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--page-bg)" }}>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Brand size="lg" className="mb-2" />
          <p className="text-sm mt-2" style={{ color: "var(--text-tertiary)" }}>공모전·지원사업·경진대회 1차 심사 자동화</p>
        </div>

        <Suspense fallback={<div className="border p-8" style={{ background: "var(--card-bg)", borderColor: "var(--t-border-card)" }} />}>
          <LoginForm />
        </Suspense>

        <p className="text-center text-xs mt-6" style={{ color: "var(--text-tertiary)" }}>
          <Link href="/" className="transition-[filter] hover:brightness-125">← 홈으로 돌아가기</Link>
        </p>
      </div>
    </div>
  );
}
