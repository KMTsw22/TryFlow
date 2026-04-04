"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  FileText,
  Sparkles,
  BarChart3,
  ShieldCheck,
  TrendingUp,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { TwLogo } from "@/components/ui/TwLogo";

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

function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const [ref, inView] = useInView();
  return (
    <div ref={ref} className={className} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? "none" : "translateY(24px)",
      transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
    }}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const scrolled = useScrolled();

  return (
    <div className="min-h-screen bg-white font-['Inter']">

      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-200" style={{
        background: scrolled ? "rgba(255,255,255,0.98)" : "rgba(255,255,255,0.0)",
        backdropFilter: scrolled ? "blur(14px)" : "none",
        borderBottom: scrolled ? "1px solid #f0f0f0" : "1px solid transparent",
        boxShadow: scrolled ? "0 1px 16px rgba(0,0,0,0.06)" : "none",
      }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-[60px]">
          <Link href="/" className="flex items-center gap-2">
            <TwLogo className="w-7 h-7 rounded-lg" />
            <span className="font-bold text-white text-sm tracking-tight" style={{ color: scrolled ? "#0B1026" : "white" }}>Try.Wepp</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login" className="text-sm font-medium px-3 py-2 transition-colors"
              style={{ color: scrolled ? "#6b7280" : "rgba(255,255,255,0.7)" }}>
              Log in
            </Link>
            <Link href="/signup" className="bg-white text-[#0B1026] text-sm font-bold px-4 py-2 rounded-lg hover:bg-gray-100 transition-all duration-150 shadow-md"
              style={{ background: scrolled ? "#0B1026" : "white", color: scrolled ? "white" : "#0B1026" }}>
              Get early access →
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="bg-gradient-navy relative overflow-hidden min-h-screen flex items-center">
        {/* Background grid */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "60px 60px"
        }} />
        {/* Glow blobs */}
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(circle, #6366f1 0%, transparent 70%)" }} />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full opacity-8 pointer-events-none"
          style={{ background: "radial-gradient(circle, #818cf8 0%, transparent 70%)" }} />

        <div className="relative max-w-6xl mx-auto px-6 py-32 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 border border-indigo-400/30 bg-indigo-500/10 text-indigo-300 text-xs font-semibold px-3 py-1.5 rounded-full mb-10"
            style={{ animation: "fadeInUp 0.5s ease 0.1s both" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Anonymous Founder Idea Signals
          </div>

          {/* Headline */}
          <h1 className="text-[3.2rem] md:text-[5rem] font-extrabold text-white leading-[1.04] tracking-tight max-w-4xl mx-auto">
            <span style={{ animation: "fadeInUp 0.55s ease 0.15s both", display: "block" }}>Your anonymous idea</span>
            <span style={{ animation: "fadeInUp 0.55s ease 0.28s both", display: "block", color: "#818cf8" }}>becomes market intelligence.</span>
          </h1>

          <p className="mt-8 text-[1.1rem] text-gray-400 leading-relaxed max-w-[560px] mx-auto"
            style={{ animation: "fadeInUp 0.55s ease 0.42s both" }}>
            Submit your startup idea anonymously. AI clusters it with similar ideas, reveals market trends,
            and gives you a personal insight report — instantly.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mt-10"
            style={{ animation: "fadeInUp 0.55s ease 0.56s both" }}>
            <Link href="/signup" className="inline-flex items-center gap-2 bg-indigo-500 text-white font-bold px-7 py-3.5 rounded-xl text-sm hover:bg-indigo-400 transition-all duration-150 hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5">
              Submit your idea <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/login" className="inline-flex items-center gap-2 border border-white/15 text-gray-300 font-medium px-7 py-3.5 rounded-xl text-sm hover:border-white/35 hover:text-white hover:bg-white/5 transition-all duration-150">
              Sign in
            </Link>
          </div>

          <p className="mt-5 text-xs text-gray-600" style={{ animation: "fadeInUp 0.5s ease 0.7s both" }}>
            Free · No account required to submit · Takes 2 minutes
          </p>

          {/* Hero stat strip */}
          <div className="mt-20 flex flex-wrap justify-center gap-12"
            style={{ animation: "fadeIn 0.8s ease 0.9s both" }}>
            {[
              { num: "3", label: "steps to your insight report" },
              { num: "0", label: "public exposure — fully anonymous" },
              { num: "∞", label: "stronger as more ideas accumulate" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-extrabold text-white">{s.num}</div>
                <div className="text-xs text-gray-500 mt-1 max-w-[120px] mx-auto leading-tight">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-28 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <FadeUp className="text-center mb-16">
            <p className="text-xs font-bold tracking-widest text-indigo-500 uppercase mb-3">Product Overview</p>
            <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">Three steps. Real intelligence.</h2>
            <p className="mt-4 text-gray-500 text-base max-w-lg mx-auto">
              Submit your idea once, and let AI turn it into actionable market data — for you and for the market.
            </p>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Anonymous Submission",
                sub: "ANONYMOUS SUBMISSION",
                desc: "Just your category, target user, and a brief description. No account needed. No public exposure. Submit in under 2 minutes.",
                note: "The more submissions, the sharper the trends",
                icon: FileText,
                color: "indigo",
              },
              {
                step: "02",
                title: "AI Analysis & Clustering",
                sub: "AI ANALYSIS",
                desc: "AI groups similar ideas together, classifies market saturation, and identifies emerging trend directions in real time.",
                note: null,
                icon: Sparkles,
                color: "violet",
              },
              {
                step: "03",
                title: "Personal Insight + Trend Report",
                sub: "INSIGHT & TREND REPORT",
                desc: "Get immediate personal feedback — viability, saturation level, trend direction — plus a full aggregate market trend report.",
                note: null,
                icon: BarChart3,
                color: "blue",
              },
            ].map((item, i) => (
              <FadeUp key={item.step} delay={i * 120}>
                <div className="relative p-8 rounded-2xl border border-gray-100 bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full group">
                  <span className="text-7xl font-extrabold text-gray-50 absolute top-4 right-6 leading-none select-none group-hover:text-indigo-50 transition-colors">
                    {item.step}
                  </span>
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 ${item.color === "indigo" ? "bg-indigo-50" : item.color === "violet" ? "bg-violet-50" : "bg-blue-50"}`}>
                    <item.icon className={`w-5 h-5 ${item.color === "indigo" ? "text-indigo-500" : item.color === "violet" ? "text-violet-500" : "text-blue-500"}`} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-4">{item.sub}</p>
                  <div className="w-8 h-0.5 bg-indigo-200 mb-4" />
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                  {item.note && (
                    <p className="mt-4 text-xs text-indigo-400 font-medium">• {item.note}</p>
                  )}
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── Market Gap ── */}
      <section className="py-28 px-6" style={{ background: "#f8f8ff" }}>
        <div className="max-w-6xl mx-auto">
          <FadeUp className="text-center mb-16">
            <p className="text-xs font-bold tracking-widest text-indigo-500 uppercase mb-3">Market Research</p>
            <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">The data no one else has.</h2>
            <p className="mt-4 text-gray-500 text-base max-w-xl mx-auto">
              Every market intelligence tool relies on data that already exists. Try.Wepp captures the signal before anything is built.
            </p>
          </FadeUp>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Existing tools — problems */}
            <FadeUp>
              <div className="p-8 rounded-2xl border border-gray-200 bg-white h-full">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-6 h-6 rounded-full border-2 border-gray-200 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-gray-300" />
                  </div>
                  <span className="text-sm font-bold text-gray-400">Existing tools</span>
                </div>
                <div className="space-y-5">
                  {[
                    "Rely on company and investment data that already exists",
                    "Search-based trends only capture already-popular keywords",
                    "Early-stage 'idea consideration' data is nearly empty",
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <XCircle className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-bold text-gray-300 mr-2">0{i + 1}</span>
                        <span className="text-sm text-gray-500">{item}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </FadeUp>

            {/* Try.Wepp opportunity */}
            <FadeUp delay={120}>
              <div className="p-8 rounded-2xl border border-indigo-200 bg-indigo-50 h-full">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                  <span className="text-sm font-bold text-indigo-600">Try.Wepp's edge</span>
                </div>
                <div className="space-y-5">
                  {[
                    "Capture the earliest 'Founder Intent' data on the market",
                    "Create an entirely new 'idea-stage data' layer",
                    "Trends get stronger and more precise as submissions grow",
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-bold text-indigo-400 mr-2">0{i + 1}</span>
                        <span className="text-sm text-indigo-900 font-medium">{item}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-6 text-xs text-indigo-400 font-medium border-t border-indigo-200 pt-4">
                  B2B expansion potential: VCs, accelerators, and research institutions
                </p>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ── 4 Core Features ── */}
      <section className="py-28 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <FadeUp className="flex items-start justify-between mb-16 flex-wrap gap-6">
            <div>
              <p className="text-xs font-bold tracking-widest text-indigo-500 uppercase mb-3">Core MVP</p>
              <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">Four features. One flywheel.</h2>
            </div>
            <div className="bg-gray-900 text-white text-xs font-bold px-4 py-2 rounded-full flex items-center gap-2 self-start mt-1">
              4 core features
            </div>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: FileText,
                title: "Anonymous Submission",
                sub: "ANONYMOUS SUBMISSION",
                desc: "Collect anonymous founder ideas at scale. Each submission becomes a data point that trains the trend model — no noise, no bias.",
                color: "indigo",
              },
              {
                icon: Sparkles,
                title: "Personal Insight Report",
                sub: "PERSONAL INSIGHT",
                desc: "Every submitter receives immediate feedback: viability, market saturation, and trend direction — delivered as an incentive to contribute.",
                color: "violet",
              },
              {
                icon: TrendingUp,
                title: "Trend Dashboard",
                sub: "TREND DASHBOARD",
                desc: "Visualize growing categories and saturated areas in real time. Built on aggregated idea data that no other platform has.",
                color: "blue",
              },
              {
                icon: ShieldCheck,
                title: "Quality Filter",
                sub: "QUALITY FILTER",
                desc: "AI-powered duplicate detection and spam filtering ensures the dataset stays clean — protecting trend accuracy at scale.",
                color: "green",
              },
            ].map((f, i) => {
              const colors: Record<string, { bg: string; text: string; border: string }> = {
                indigo: { bg: "bg-indigo-50", text: "text-indigo-500", border: "border-indigo-100" },
                violet: { bg: "bg-violet-50", text: "text-violet-500", border: "border-violet-100" },
                blue: { bg: "bg-blue-50", text: "text-blue-500", border: "border-blue-100" },
                green: { bg: "bg-emerald-50", text: "text-emerald-500", border: "border-emerald-100" },
              };
              const c = colors[f.color];
              return (
                <FadeUp key={f.title} delay={i * 100}>
                  <div className={`p-8 rounded-2xl border ${c.border} bg-white hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 h-full`}>
                    <div className={`w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center mb-5`}>
                      <f.icon className={`w-5 h-5 ${c.text}`} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{f.title}</h3>
                    <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-4">{f.sub}</p>
                    <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                  </div>
                </FadeUp>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Competitive landscape ── */}
      <section className="py-28 px-6" style={{ background: "#f8f8ff" }}>
        <div className="max-w-6xl mx-auto">
          <FadeUp className="text-center mb-16">
            <p className="text-xs font-bold tracking-widest text-indigo-500 uppercase mb-3">Competitive Landscape</p>
            <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">A category of one.</h2>
            <p className="mt-4 text-gray-500 text-base max-w-lg mx-auto">
              Try.Wepp sits in the gap between trend tools and validation tools — owning the "aggregated idea data" category.
            </p>
          </FadeUp>

          <FadeUp>
            <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left p-5 text-xs font-bold text-gray-400 uppercase tracking-wider w-[220px]">Feature</th>
                    {[
                      { name: "Harmonic", type: "STARTUP DB" },
                      { name: "Exploding Topics", type: "TREND TOOL" },
                      { name: "ValidatorAI", type: "AI VALIDATOR" },
                      { name: "Try.Wepp", type: "IDEA SIGNALS", highlight: true },
                    ].map((col) => (
                      <th key={col.name} className={`p-5 text-center ${col.highlight ? "bg-indigo-500 text-white rounded-t-xl" : "text-gray-700"}`}>
                        <div className={`text-[10px] font-bold tracking-widest uppercase mb-1 ${col.highlight ? "text-indigo-200" : "text-gray-400"}`}>{col.type}</div>
                        <div className={`font-extrabold text-sm ${col.highlight ? "text-white" : "text-gray-800"}`}>{col.name}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "Idea-stage data", sub: "Idea-stage data", vals: [false, false, false, true] },
                    { label: "Anonymous input", sub: "Anonymous input", vals: [false, false, false, true] },
                    { label: "Personal report", sub: "Personal report", vals: [false, false, true, true] },
                    { label: "Trend report", sub: "Trend report", vals: [false, true, false, true] },
                    { label: "Pre-founding focus", sub: "Pre-founding focus", vals: [false, false, false, true] },
                  ].map((row, ri) => (
                    <tr key={row.label} className={`border-b border-gray-50 ${ri % 2 === 0 ? "" : "bg-gray-50/50"}`}>
                      <td className="p-5">
                        <div className="font-semibold text-gray-800 text-sm">{row.label}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{row.sub}</div>
                      </td>
                      {row.vals.map((v, vi) => (
                        <td key={vi} className={`p-5 text-center ${vi === 3 ? "bg-indigo-50" : ""}`}>
                          {v
                            ? <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${vi === 3 ? "bg-indigo-100" : "bg-gray-100"}`}>
                                <CheckCircle2 className={`w-3.5 h-3.5 ${vi === 3 ? "text-indigo-500" : "text-gray-400"}`} />
                              </span>
                            : <XCircle className="w-3.5 h-3.5 text-gray-200 mx-auto" />
                          }
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-5 text-xs text-gray-400 text-center">
              Try.Wepp creates the "aggregated idea data" category — between trend exploration and idea validation.
            </p>
          </FadeUp>
        </div>
      </section>

      {/* ── Key Takeaway / CTA ── */}
      <section className="bg-gradient-navy py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "60px 60px"
        }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(circle, #6366f1 0%, transparent 70%)" }} />

        <div className="relative max-w-4xl mx-auto text-center">
          <FadeUp>
            <p className="text-xs font-bold tracking-widest text-indigo-400 uppercase mb-5">Key Takeaway</p>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white leading-tight tracking-tight">
              Not idea sharing.{" "}
              <span style={{ color: "#818cf8" }}>
                Market intelligence<br />from anonymous founders.
              </span>
            </h2>
          </FadeUp>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-px bg-white/5 rounded-2xl overflow-hidden border border-white/10">
            {[
              {
                label: "PRODUCT",
                title: "Idea aggregation → trend report",
                desc: "Anonymous submission → clustering → insight generation",
              },
              {
                label: "MARKET",
                title: "Growing demand for early signal data",
                desc: "Pre-founding stage data is currently a blank space in the market",
              },
              {
                label: "EDGE",
                title: "Stronger trends as data grows",
                desc: "Network effects fill the gap between trend tools and validation tools",
              },
            ].map((item) => (
              <div key={item.label} className="p-8 bg-white/3 text-left hover:bg-white/6 transition-colors">
                <p className="text-[10px] font-bold tracking-widest text-indigo-400 mb-3">{item.label}</p>
                <div className="w-2 h-2 rounded-full bg-indigo-400 mb-3" />
                <h3 className="font-bold text-white text-sm mb-2 leading-snug">{item.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <FadeUp delay={200} className="mt-14">
            <p className="text-gray-500 text-sm mb-6">Starting from personal feedback — scaling to a Founder Signal Platform.</p>
            <Link href="/signup"
              className="inline-flex items-center gap-2 bg-indigo-500 text-white font-bold px-8 py-4 rounded-xl text-base hover:bg-indigo-400 transition-all duration-150 hover:shadow-2xl hover:shadow-indigo-500/30 hover:-translate-y-0.5">
              Submit your idea — it&apos;s free <ArrowRight className="w-4 h-4" />
            </Link>
          </FadeUp>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TwLogo className="w-7 h-7 rounded-lg" />
            <span className="text-sm font-bold text-gray-900">Try.Wepp</span>
          </div>
          <p className="text-xs text-gray-400">© 2026 Try.Wepp · Anonymous Founder Idea Signals</p>
        </div>
      </footer>
    </div>
  );
}