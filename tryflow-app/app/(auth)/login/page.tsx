"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function LoginPage() {
  const handleGoogleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--page-bg)" }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-2.5 mb-4">
            <img src="/logo.png" className="w-11 h-11" alt="Try.Wepp" />
          </Link>
          <h1 className="text-2xl font-extrabold" style={{ color: "var(--text-primary)" }}>Try.Wepp</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>Anonymous Founder Idea Signals</p>
        </div>

        <div className="border p-8" style={{ background: "var(--card-bg)", borderColor: "var(--t-border-card)" }}>
          <h2 className="text-lg font-bold text-center" style={{ color: "var(--text-primary)" }}>Sign in to continue</h2>
          <p className="text-sm text-center mt-1 mb-8" style={{ color: "var(--text-tertiary)" }}>
            New or returning — just click below
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
            Continue with Google
          </button>

          <p className="text-xs text-center mt-6 leading-relaxed" style={{ color: "var(--text-tertiary)" }}>
            By signing in, you agree to our{" "}
            <a
              href="#"
              className="transition-[filter] hover:brightness-110"
              style={{ color: "var(--accent)" }}
            >
              Terms of Service
            </a>
            {" "}and{" "}
            <a
              href="#"
              className="transition-[filter] hover:brightness-110"
              style={{ color: "var(--accent)" }}
            >
              Privacy Policy
            </a>
          </p>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "var(--text-tertiary)" }}>
          <Link href="/" className="transition-[filter] hover:brightness-125">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
