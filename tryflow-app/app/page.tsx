"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  BarChart3,
  Zap,
  TrendingUp,
  Shield,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
} from "lucide-react";

// ── Hooks ─────────────────────────────────────────────────────────────────
function useScrolled(threshold = 12) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > threshold);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, [threshold]);
  return scrolled;
}

function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => setInView(e.isIntersecting),
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView] as const;
}

// ── Scroll-reveal wrapper ─────────────────────────────────────────────────
function FadeUp({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "none" : "translateY(20px)",
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ── Animated progress bar ─────────────────────────────────────────────────
function AnimatedBar({ pct, active }: { pct: number; active: boolean }) {
  const [ref, inView] = useInView(0.2);
  return (
    <div ref={ref} className="w-full bg-gray-100 rounded-full h-2">
      <div
        className="h-2 rounded-full transition-all duration-700 ease-out"
        style={{
          width: inView ? `${pct}%` : "0%",
          background: active
            ? "linear-gradient(90deg, #0D9488, #14B8A6)"
            : "#e5e7eb",
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const scrolled = useScrolled();

  return (
    <div className="min-h-screen bg-white font-['Inter']">

      {/* ── Navbar ───────────────────────────────────────────────────────── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-200"
        style={{
          background: scrolled ? "rgba(255,255,255,0.98)" : "rgba(255,255,255,0.92)",
          backdropFilter: "blur(14px)",
          borderBottom: scrolled ? "1px solid #f0f0f0" : "1px solid transparent",
          boxShadow: scrolled ? "0 1px 16px rgba(0,0,0,0.06)" : "none",
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-[60px]">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <img src="/logo.png" className="w-7 h-7" alt="Try.Wepp" />
              <span className="font-bold text-gray-900 text-sm tracking-tight">Try.Wepp</span>
            </Link>
            <Link
              href="/explore"
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors duration-150"
            >
              Explore
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors px-3 py-2"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="bg-[#0B1026] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#161f3d] transition-all duration-150 hover:shadow-md"
            >
              Sign up free →
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-navy pt-28 pb-24 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center min-h-[540px]">

          {/* Left — Copy */}
          <div>
            {/* Eyebrow */}
            <div
              className="inline-flex items-center gap-2 border border-teal-500/30 bg-teal-500/10 text-teal-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-8"
              style={{ animation: "fadeInUp 0.5s ease 0.1s both" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              Pricing intelligence for founders
            </div>

            {/* Headline */}
            <h1 className="text-[3rem] md:text-[3.75rem] font-extrabold text-white leading-[1.06] tracking-tight">
              <span style={{ animation: "fadeInUp 0.55s ease 0.2s both", display: "block" }}>
                Launch with
              </span>
              <span style={{ animation: "fadeInUp 0.55s ease 0.32s both", display: "block" }}>
                the price users
              </span>
              <span
                className="text-gradient"
                style={{ animation: "fadeInUp 0.55s ease 0.44s both", display: "block" }}
              >
                actually choose.
              </span>
            </h1>

            {/* Description */}
            <p
              className="mt-7 text-[15px] text-gray-400 leading-relaxed max-w-[420px]"
              style={{ animation: "fadeInUp 0.55s ease 0.58s both" }}
            >
              Stop guessing. Use high-fidelity behavior data to validate your
              pricing strategy — before you ever push to production.
            </p>

            {/* CTAs */}
            <div
              className="flex flex-wrap items-center gap-3 mt-9"
              style={{ animation: "fadeInUp 0.55s ease 0.72s both" }}
            >
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-teal-500 text-white font-semibold px-6 py-3 rounded-lg text-sm hover:bg-teal-400 transition-all duration-150 hover:shadow-lg hover:shadow-teal-500/30 hover:-translate-y-px"
              >
                Start free <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 border border-white/15 text-gray-300 font-medium px-6 py-3 rounded-lg text-sm hover:border-white/35 hover:text-white hover:bg-white/5 transition-all duration-150"
              >
                See live experiments
              </Link>
            </div>

            <p
              className="mt-5 text-xs text-gray-700"
              style={{ animation: "fadeInUp 0.5s ease 0.86s both" }}
            >
              Free 14-day trial · No credit card required
            </p>
          </div>

          {/* Right — Dashboard mockup */}
          <div
            className="relative flex justify-center lg:justify-end"
            style={{ animation: "fadeIn 0.7s ease 0.35s both" }}
          >
            <div className="relative w-[500px] h-[420px]">

              {/* Back screen */}
              <div
                className="absolute top-0 left-0 w-[370px] bg-[#0E1630] rounded-xl border border-white/10 shadow-2xl overflow-hidden"
                style={{
                  transform: "perspective(1200px) rotateY(-8deg) rotateX(4deg)",
                  animation: "fadeInUp 0.6s ease 0.5s both",
                }}
              >
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-400/60" />
                    <div className="w-2 h-2 rounded-full bg-yellow-400/60" />
                    <div className="w-2 h-2 rounded-full bg-green-400/60" />
                  </div>
                  <div className="flex-1 bg-white/5 rounded h-3 mx-8" />
                </div>
                <div className="flex">
                  <div className="w-12 border-r border-white/5 p-2 space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className={`w-full h-1.5 rounded ${i === 1 ? "bg-teal-500/60" : "bg-white/10"}`} />
                    ))}
                  </div>
                  <div className="flex-1 p-4 space-y-3">
                    {[
                      "bg-teal-500/30",
                      "bg-purple-500/30",
                      "bg-teal-500/30",
                    ].map((c, i) => (
                      <div key={i} className="flex gap-2">
                        <div className="h-2 bg-white/10 rounded flex-[2]" />
                        <div className="h-2 bg-white/10 rounded flex-1" />
                        <div className={`h-2 ${c} rounded flex-1`} />
                      </div>
                    ))}
                    <div className="mt-4 flex items-end gap-1 h-16">
                      {[30, 45, 25, 60, 40, 55, 70, 50, 65, 80].map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-sm"
                          style={{
                            height: `${h}%`,
                            background: i >= 7 ? "#14B8A6" : "rgba(255,255,255,0.08)",
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Front screen — floats */}
              <div
                className="absolute top-10 left-32 w-[340px] bg-[#131B3A] rounded-xl border border-white/10 shadow-2xl overflow-hidden"
                style={{ animation: "floatSlow 5s ease-in-out infinite, fadeInUp 0.65s ease 0.68s both" }}
              >
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-400/60" />
                    <div className="w-2 h-2 rounded-full bg-yellow-400/60" />
                    <div className="w-2 h-2 rounded-full bg-green-400/60" />
                  </div>
                  <span className="text-[9px] text-gray-600">Analytics · Pricing A/B</span>
                </div>
                <div className="p-4">
                  {/* Stat cards */}
                  <div className="flex gap-2.5 mb-4">
                    {[
                      { label: "Visitors", value: "12.4K", color: "text-white" },
                      { label: "Conversions", value: "1,847", color: "text-teal-400" },
                      { label: "Revenue", value: "$48.2K", color: "text-white" },
                    ].map((s) => (
                      <div key={s.label} className="flex-1 bg-white/5 rounded-lg p-2.5 border border-white/5">
                        <p className="text-[8px] text-gray-500 uppercase tracking-wider">{s.label}</p>
                        <p className={`text-xs font-bold ${s.color} mt-1`}>{s.value}</p>
                      </div>
                    ))}
                  </div>
                  {/* Chart */}
                  <div className="relative h-20 mb-3">
                    <svg viewBox="0 0 300 80" className="w-full h-full" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#a855f7" stopOpacity="0.18" />
                          <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path d="M0,60 C30,55 60,40 90,45 C120,50 150,30 180,25 C210,20 240,15 270,18 L300,12 L300,80 L0,80Z" fill="url(#heroGrad)" />
                      <path d="M0,60 C30,55 60,40 90,45 C120,50 150,30 180,25 C210,20 240,15 270,18 L300,12" fill="none" stroke="#a855f7" strokeWidth="1.8" />
                      <path d="M0,50 C30,48 60,52 90,35 C120,18 150,22 180,15 C210,10 240,12 270,8 L300,5" fill="none" stroke="#14B8A6" strokeWidth="1.8" />
                    </svg>
                  </div>
                  {/* Toggle pills */}
                  <div className="flex gap-1.5">
                    {["7D", "30D", "90D", "1Y"].map((p, i) => (
                      <span
                        key={p}
                        className={`text-[9px] px-2.5 py-1 rounded-full cursor-pointer transition-colors ${
                          i === 1 ? "bg-teal-500/20 text-teal-400" : "bg-white/5 text-gray-500 hover:bg-white/10"
                        }`}
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating metric badge */}
              <div
                className="absolute bottom-2 left-0 bg-white rounded-2xl shadow-xl px-4 py-3 z-10 border border-gray-100"
                style={{ animation: "fadeInUp 0.6s ease 0.9s both" }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-medium">Conversion Lift</p>
                    <p className="text-lg font-extrabold text-gray-900 leading-tight">+18.4%</p>
                  </div>
                </div>
                <p className="text-[9px] text-gray-400 mt-1.5 border-t border-gray-100 pt-1.5">99.2% confidence · Plan B wins</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Logo bar ─────────────────────────────────────────────────────── */}
      <section className="py-9 px-6 border-b border-gray-100">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-5">
            Trusted by teams from
          </p>
          <div className="flex items-center justify-center gap-10 md:gap-16 flex-wrap">
            {["Stripe", "Revolut", "Vercel", "Linear", "Optimizely"].map((name) => (
              <span key={name} className="text-sm font-semibold text-gray-200 tracking-wide">
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature 1: Fake Checkout Testing ─────────────────────────────── */}
      <section className="py-28 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">

          {/* Left — Copy */}
          <div>
            <FadeUp>
              <p className="text-xs font-semibold text-teal-600 uppercase tracking-widest mb-4">
                Fake Checkout Testing
              </p>
            </FadeUp>
            <FadeUp delay={70}>
              <h2 className="text-3xl md:text-[2.6rem] font-extrabold text-gray-900 leading-[1.1] tracking-tight">
                Test payment intent<br />before billing exists.
              </h2>
            </FadeUp>
            <FadeUp delay={140}>
              <p className="mt-5 text-[15px] text-gray-500 leading-relaxed max-w-[420px]">
                Create high-fidelity checkout simulations. Measure real user intent
                before a single line of backend billing code is written.
              </p>
            </FadeUp>
            <ul className="mt-8 space-y-4">
              {[
                { text: "Customizable pricing templates", sub: "Match your brand and flow exactly" },
                { text: "Real-time conversion tracking", sub: "Per plan, per variant, per user" },
                { text: "Zero backend required", sub: "No billing logic, no infrastructure" },
              ].map((item, i) => (
                <FadeUp key={item.text} delay={210 + i * 70}>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center mt-0.5 shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{item.text}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>
                    </div>
                  </li>
                </FadeUp>
              ))}
            </ul>
          </div>

          {/* Right — Phone mockup */}
          <FadeUp delay={80} className="flex justify-center">
            <div className="relative">
              <div className="bg-gray-900 rounded-[2.5rem] p-3 shadow-2xl w-[270px] ring-1 ring-white/10">
                <div className="bg-white rounded-[2rem] overflow-hidden">
                  {/* Header */}
                  <div className="bg-gray-50 px-5 pt-5 pb-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-gray-900">Checkout</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Select your plan</p>
                      </div>
                      <div className="w-5 h-5 rounded-full bg-teal-500/15 border border-teal-400/30 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-teal-500" />
                      </div>
                    </div>
                  </div>
                  {/* Plans */}
                  <div className="px-4 pt-3 pb-2 space-y-2">
                    {[
                      { name: "Starter", price: "$9/mo", active: false, desc: "" },
                      { name: "Pro", price: "$29/mo", active: true, desc: "Unlimited · A/B testing" },
                      { name: "Scale", price: "$79/mo", active: false, desc: "" },
                    ].map((plan) => (
                      <div
                        key={plan.name}
                        className={`rounded-xl border p-3 text-xs transition-all ${
                          plan.active
                            ? "border-teal-400 bg-teal-50 shadow-sm shadow-teal-100/50"
                            : "border-gray-200 bg-gray-50/40"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-3 h-3 rounded-full border-2 ${
                                plan.active ? "border-teal-500 bg-teal-500" : "border-gray-300 bg-white"
                              }`}
                            />
                            <span className="font-semibold text-gray-900">{plan.name}</span>
                          </div>
                          <span className={plan.active ? "text-teal-700 font-bold" : "text-gray-400 font-medium"}>
                            {plan.price}
                          </span>
                        </div>
                        {plan.active && (
                          <p className="text-[9px] text-teal-600 mt-1 ml-5">{plan.desc}</p>
                        )}
                      </div>
                    ))}
                  </div>
                  {/* Card fields */}
                  <div className="px-4 pb-2 space-y-1.5">
                    <div className="h-7 rounded-lg border border-gray-200 bg-gray-50 flex items-center px-2.5 gap-2">
                      <div className="h-1.5 w-24 bg-gray-200 rounded" />
                    </div>
                    <div className="flex gap-1.5">
                      <div className="flex-1 h-7 rounded-lg border border-gray-200 bg-gray-50" />
                      <div className="w-14 h-7 rounded-lg border border-gray-200 bg-gray-50" />
                    </div>
                  </div>
                  {/* CTA */}
                  <div className="px-4 pb-5 pt-2">
                    <div className="bg-teal-500 text-white text-xs font-bold text-center py-3 rounded-xl">
                      Continue to Payment
                    </div>
                  </div>
                </div>
              </div>
              {/* Floating conversion badge */}
              <div className="absolute -right-6 top-14 bg-white rounded-xl shadow-lg border border-gray-100 px-3 py-2 text-left">
                <p className="text-[9px] text-gray-400 font-medium">Plan selection</p>
                <p className="text-xs font-bold text-gray-900 mt-0.5">73% choose Pro</p>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── Feature 2: Pricing Experiments ───────────────────────────────── */}
      <section className="py-28 px-6 bg-[#FAFAFA]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">

          {/* Left — Experiment card mockup */}
          <FadeUp className="flex justify-center order-2 lg:order-1">
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-lg p-6 w-full max-w-[420px]">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">Active experiment</p>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">Pricing A/B Test · v3</p>
                </div>
                <span className="text-xs bg-teal-50 text-teal-700 px-2.5 py-1 rounded-full font-semibold border border-teal-100">
                  ● Running
                </span>
              </div>
              {/* Progress bars */}
              <div className="space-y-4">
                {[
                  { label: "Plan A — $19/mo", pct: 34, active: false },
                  { label: "Plan B — $29/mo", pct: 52, active: true },
                  { label: "Plan C — $49/mo", pct: 14, active: false },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">{item.label}</span>
                        {item.active && (
                          <span className="text-[9px] text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded font-semibold">
                            Best
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-gray-900">{item.pct}%</span>
                    </div>
                    <AnimatedBar pct={item.pct} active={item.active} />
                  </div>
                ))}
              </div>
              {/* Footer stats */}
              <div className="mt-5 pt-4 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
                {[
                  { label: "Responses", value: "1,284" },
                  { label: "Confidence", value: "97.4%" },
                  { label: "Duration", value: "8 days" },
                ].map((s) => (
                  <div key={s.label}>
                    <p className="text-xs font-bold text-gray-900">{s.value}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </FadeUp>

          {/* Right — Copy */}
          <div className="order-1 lg:order-2">
            <FadeUp>
              <p className="text-xs font-semibold text-teal-600 uppercase tracking-widest mb-4">
                Pricing Experiments
              </p>
            </FadeUp>
            <FadeUp delay={70}>
              <h2 className="text-3xl md:text-[2.6rem] font-extrabold text-gray-900 leading-[1.1] tracking-tight">
                A/B test prices.<br />Know what converts.
              </h2>
            </FadeUp>
            <FadeUp delay={140}>
              <p className="mt-5 text-[15px] text-gray-500 leading-relaxed max-w-[420px]">
                Test different price points, billing models, and usage tiers.
                Try.Wepp manages the traffic split and tracks every interaction — no engineer required.
              </p>
            </FadeUp>
            <FadeUp delay={210}>
              <Link
                href="/signup"
                className="inline-flex items-center gap-1.5 mt-7 text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors group"
              >
                Start an experiment
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-150" />
              </Link>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ── Feature 3: Decision Recommendations ──────────────────────────── */}
      <section className="py-28 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">

          {/* Left — Copy */}
          <div>
            <FadeUp>
              <p className="text-xs font-semibold text-teal-600 uppercase tracking-widest mb-4">
                Decision Intelligence
              </p>
            </FadeUp>
            <FadeUp delay={70}>
              <h2 className="text-3xl md:text-[2.6rem] font-extrabold text-gray-900 leading-[1.1] tracking-tight">
                Data-backed<br />price recommendations.
              </h2>
            </FadeUp>
            <FadeUp delay={140}>
              <p className="mt-5 text-[15px] text-gray-500 leading-relaxed max-w-[420px]">
                We analyze conversion signals to predict which price point
                maximizes revenue — and tell you exactly why, with confidence intervals.
              </p>
            </FadeUp>
            <FadeUp delay={210}>
              <div className="mt-8 inline-flex items-center gap-4 bg-gray-900 text-white rounded-2xl px-5 py-4">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Recommended price</p>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-2xl font-extrabold">$29</span>
                    <span className="text-xs text-gray-400">/mo · +31% MRR vs $19</span>
                  </div>
                </div>
              </div>
            </FadeUp>
          </div>

          {/* Right — Chart */}
          <FadeUp delay={80} className="flex justify-center">
            <div className="bg-[#0B1026] rounded-2xl p-6 w-full max-w-[420px] shadow-2xl border border-white/5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Revenue Projection</p>
                  <p className="text-sm font-semibold text-white mt-0.5">Plan B · $29/mo scenario</p>
                </div>
                <BarChart3 className="w-4 h-4 text-teal-400" />
              </div>
              <div className="relative h-36">
                <svg viewBox="0 0 400 140" className="w-full h-full" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#14B8A6" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {[35, 70, 105].map((y, i) => (
                    <line key={i} x1="0" y1={y} x2="400" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                  ))}
                  <path d="M0,120 C40,110 80,100 120,80 C160,60 200,70 240,45 C280,20 320,30 360,10 L400,5 L400,140 L0,140Z" fill="url(#chartGrad)" />
                  <path d="M0,120 C40,110 80,100 120,80 C160,60 200,70 240,45 C280,20 320,30 360,10 L400,5" fill="none" stroke="#14B8A6" strokeWidth="2.5" strokeLinejoin="round" />
                  <circle cx="400" cy="5" r="4" fill="#14B8A6" />
                  <circle cx="400" cy="5" r="8" fill="#14B8A6" fillOpacity="0.2" />
                </svg>
              </div>
              <div className="flex items-center justify-between text-[10px] text-gray-600 mt-1 pb-4 border-b border-white/5">
                <span>Week 1</span><span>Week 4</span><span>Week 8</span>
              </div>
              <div className="flex items-center justify-between pt-4">
                {[
                  { label: "Projected MRR", value: "$22.4K" },
                  { label: "Lift vs. baseline", value: "+31%" },
                ].map((s) => (
                  <div key={s.label}>
                    <p className="text-[10px] text-gray-500">{s.label}</p>
                    <p className="text-sm font-bold text-white mt-0.5">{s.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── Why Try.Wepp cards ───────────────────────────────────────────── */}
      <section className="bg-gradient-navy py-28 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <FadeUp>
            <p className="text-xs font-semibold text-teal-400 uppercase tracking-widest mb-4">Why Try.Wepp</p>
          </FadeUp>
          <FadeUp delay={70}>
            <h2 className="text-3xl md:text-[2.6rem] font-extrabold text-white leading-tight tracking-tight">
              Conversion confidence.<br />Behavior-based validation.
            </h2>
          </FadeUp>
          <FadeUp delay={140}>
            <p className="mt-4 text-gray-400 text-[15px] max-w-xl mx-auto leading-relaxed">
              Skip the guesswork of surveys. Measure what users actually do when they're asked to pay.
            </p>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-14">
            {[
              {
                icon: <Zap className="w-5 h-5" />,
                color: "bg-blue-500",
                title: "Zero Implementation",
                desc: "Launch experiments at your pace. No engineering sprints. No billing logic needed.",
              },
              {
                icon: <Shield className="w-5 h-5" />,
                color: "bg-purple-500",
                title: "99% Confidence",
                desc: "Statistical significance before every major pricing decision. Not just gut feeling.",
              },
              {
                icon: <BrainCircuit className="w-5 h-5" />,
                color: "bg-teal-500",
                title: "Behavior Modeling",
                desc: "Map purchase intent and optimize for long-term revenue — not just surface clicks.",
              },
            ].map((card, i) => (
              <FadeUp key={card.title} delay={80 + i * 90}>
                <div className="bg-white/[0.04] border border-white/8 rounded-2xl p-6 text-left hover:bg-white/[0.07] hover:border-white/15 transition-all duration-200 group cursor-default h-full">
                  <div
                    className={`w-10 h-10 ${card.color} rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-105 transition-transform duration-200`}
                  >
                    {card.icon}
                  </div>
                  <h3 className="font-bold text-white text-sm mb-2">{card.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{card.desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── Designed for precision (iMac) ────────────────────────────────── */}
      <section className="py-28 px-6 bg-[#FAFAFA]">
        <div className="max-w-5xl mx-auto text-center">
          <FadeUp>
            <p className="text-xs font-semibold text-teal-600 uppercase tracking-widest mb-4">Global intelligence</p>
          </FadeUp>
          <FadeUp delay={70}>
            <h2 className="text-3xl md:text-[2.6rem] font-extrabold text-gray-900 tracking-tight mb-14">
              Designed for precision.
            </h2>
          </FadeUp>
          <FadeUp delay={140}>
            <div className="relative mx-auto max-w-3xl">
              <div className="bg-gray-900 rounded-2xl p-4 pt-10 shadow-2xl ring-1 ring-white/5">
                <div className="absolute top-3.5 left-5 flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                </div>
                <div className="bg-[#0E1630] rounded-xl overflow-hidden p-6">
                  {/* Stat cards */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {[
                      { label: "Countries", value: "42", sub: "+3 this month" },
                      { label: "Experiments", value: "1,284", sub: "Active now" },
                      { label: "Data Points", value: "3.4M", sub: "Collected" },
                    ].map((s) => (
                      <div key={s.label} className="bg-white/5 rounded-xl p-4 border border-white/5 text-left">
                        <p className="text-xl font-extrabold text-white">{s.value}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                        <p className="text-[10px] text-teal-500 mt-1">{s.sub}</p>
                      </div>
                    ))}
                  </div>
                  {/* Country breakdown */}
                  <div className="text-left">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-3">Top markets</p>
                    <div className="space-y-2.5">
                      {[
                        { country: "United States", pct: 68, flag: "🇺🇸" },
                        { country: "United Kingdom", pct: 14, flag: "🇬🇧" },
                        { country: "Germany", pct: 9, flag: "🇩🇪" },
                        { country: "Canada", pct: 6, flag: "🇨🇦" },
                      ].map((c) => (
                        <div key={c.country} className="flex items-center gap-3">
                          <span className="text-sm">{c.flag}</span>
                          <span className="text-xs text-gray-400 w-28">{c.country}</span>
                          <div className="flex-1 bg-white/5 rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full bg-teal-500/60"
                              style={{ width: `${c.pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 w-8 text-right">{c.pct}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mx-auto w-24 h-5 bg-gray-300 rounded-b-lg" />
              <div className="mx-auto w-40 h-2 bg-gray-200 rounded-b-xl" />
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className="bg-gradient-cta-green py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <FadeUp>
            <h2 className="text-3xl md:text-[2.6rem] font-extrabold text-white leading-tight tracking-tight">
              Start your first<br />pricing experiment.
            </h2>
          </FadeUp>
          <FadeUp delay={80}>
            <p className="mt-4 text-teal-100/80 text-sm">
              Free 14-day trial · No credit card required · Cancel anytime
            </p>
          </FadeUp>
          <FadeUp delay={180}>
            <div className="flex flex-wrap items-center justify-center gap-4 mt-9">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-white text-teal-700 font-bold px-8 py-4 rounded-xl hover:bg-teal-50 transition-all duration-150 hover:shadow-xl hover:-translate-y-px text-sm"
              >
                Get Started Free <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="#"
                className="inline-flex items-center gap-2 border border-white/30 text-white font-semibold px-8 py-4 rounded-xl hover:bg-white/10 transition-all duration-150 text-sm"
              >
                Contact Sales
              </Link>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="bg-[#0B1026] py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src="/logo.png" className="w-7 h-7" alt="Try.Wepp" />
                <span className="font-bold text-white text-sm">Try.Wepp</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Pricing intelligence<br />for modern teams.
              </p>
            </div>
            {[
              { title: "Product", items: ["Features", "Pricing", "Integrations", "Changelog"] },
              { title: "Resources", items: ["Documentation", "Blog", "Case Studies", "API"] },
              { title: "Support", items: ["Contact", "Privacy Policy", "Terms", "Status"] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                  {col.title}
                </h4>
                <ul className="space-y-2.5">
                  {col.items.map((item) => (
                    <li key={item}>
                      <Link
                        href="#"
                        className="text-sm text-gray-500 hover:text-white transition-colors duration-150"
                      >
                        {item}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-12 pt-8 border-t border-white/8 flex items-center justify-between text-xs text-gray-600">
            <span>© 2026 Try.Wepp Inc. All rights reserved.</span>
            <div className="flex gap-4">
              <Link href="#" className="hover:text-gray-400 transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-gray-400 transition-colors">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}