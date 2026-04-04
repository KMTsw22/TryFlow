"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, TrendingUp, Minus, CheckCircle2, XCircle, ChevronDown, Sparkles, BarChart3, FileText, ShieldCheck } from "lucide-react";

// ── Hooks ──────────────────────────────────────────────────────────────────
function useScrolled(threshold = 12) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > threshold);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, [threshold]);
  return scrolled;
}

function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView] as const;
}

function useMouse() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const fn = (e: MouseEvent) => setPos({ x: e.clientX / window.innerWidth - 0.5, y: e.clientY / window.innerHeight - 0.5 });
    window.addEventListener("mousemove", fn);
    return () => window.removeEventListener("mousemove", fn);
  }, []);
  return pos;
}

function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const [ref, inView] = useInView();
  return (
    <div ref={ref} className={className} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? "none" : "translateY(28px)",
      transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
    }}>{children}</div>
  );
}

function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [ref, inView] = useInView();
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / 40;
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 30);
    return () => clearInterval(timer);
  }, [inView, target]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// ── Sample idea cards (mock data) ──────────────────────────────────────────
const SAMPLE_IDEAS = [
  { category: "AI / ML", score: 82, trend: "Rising", color: "indigo", desc: "An AI copilot that auto-generates investor update emails from your metrics dashboard." },
  { category: "SaaS / B2B", score: 71, trend: "Stable", color: "violet", desc: "A single-click contract tool for freelancers that skips the legal jargon." },
  { category: "Dev Tools", score: 88, trend: "Rising", color: "blue", desc: "Auto-generated API docs from code comments — zero configuration required." },
];

const CARD_COLORS: Record<string, { bg: string; text: string; badge: string }> = {
  indigo: { bg: "bg-indigo-50", text: "text-indigo-600", badge: "bg-indigo-100 text-indigo-700" },
  violet: { bg: "bg-violet-50", text: "text-violet-600", badge: "bg-violet-100 text-violet-700" },
  blue:   { bg: "bg-blue-50",   text: "text-blue-600",   badge: "bg-blue-100 text-blue-700" },
};

// ─────────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const scrolled = useScrolled();
  const mouse = useMouse();

  return (
    <div className="min-h-screen bg-white font-['Inter'] overflow-x-hidden">

      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300" style={{
        background: scrolled ? "rgba(255,255,255,0.97)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? "1px solid #f0f0f0" : "none",
        boxShadow: scrolled ? "0 1px 20px rgba(0,0,0,0.06)" : "none",
      }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-[60px]">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" className="w-7 h-7 rounded-lg" alt="Try.Wepp" />
            <span className="font-bold text-sm tracking-tight transition-colors duration-300"
              style={{ color: scrolled ? "#0B1026" : "white" }}>Try.Wepp</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login" className="text-sm font-medium px-3 py-2 transition-colors duration-300"
              style={{ color: scrolled ? "#6b7280" : "rgba(255,255,255,0.7)" }}>
              Log in
            </Link>
            <Link href="/signup" className="text-sm font-bold px-4 py-2 rounded-lg transition-all duration-300"
              style={{ background: scrolled ? "#0B1026" : "white", color: scrolled ? "white" : "#0B1026" }}>
              Get early access →
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex flex-col bg-gradient-navy overflow-hidden">

        {/* Geometric background */}
        {/* Dot grid */}
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: "radial-gradient(circle, #a5b4fc 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          transform: `translate(${mouse.x * -12}px, ${mouse.y * -12}px)`,
          transition: "transform 0.3s ease",
        }} />

        {/* Large ring 1 */}
        <div className="absolute top-[-200px] left-[-200px] w-[700px] h-[700px] rounded-full border border-indigo-500/10 pointer-events-none"
          style={{ transform: `translate(${mouse.x * 20}px, ${mouse.y * 20}px)`, transition: "transform 0.5s ease" }} />
        <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] rounded-full border border-indigo-500/10 pointer-events-none"
          style={{ transform: `translate(${mouse.x * 15}px, ${mouse.y * 15}px)`, transition: "transform 0.5s ease" }} />

        {/* Large ring 2 */}
        <div className="absolute bottom-[-300px] right-[-300px] w-[800px] h-[800px] rounded-full border border-violet-500/10 pointer-events-none"
          style={{ transform: `translate(${mouse.x * -25}px, ${mouse.y * -25}px)`, transition: "transform 0.6s ease" }} />

        {/* Glow blobs */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)", transform: `translate(calc(-50% + ${mouse.x * 30}px), calc(-50% + ${mouse.y * 30}px))`, transition: "transform 0.4s ease" }} />
        <div className="absolute top-2/3 right-1/4 w-[300px] h-[300px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)" }} />

        {/* Diagonal line */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-5" preserveAspectRatio="none">
          <line x1="0" y1="100%" x2="100%" y2="0" stroke="#818cf8" strokeWidth="1" />
          <line x1="0" y1="80%" x2="80%" y2="0" stroke="#818cf8" strokeWidth="0.5" />
        </svg>

        {/* Hero content */}
        <div className="relative flex-1 flex flex-col items-center justify-center px-6 pt-24 pb-8">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 border border-indigo-400/30 bg-indigo-500/10 text-indigo-300 text-xs font-semibold px-4 py-1.5 rounded-full mb-8"
            style={{ animation: "fadeInUp 0.5s ease 0.1s both" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Anonymous Founder Idea Signals
          </div>

          {/* Headline */}
          <h1 className="text-center text-[3rem] md:text-[5.5rem] font-extrabold text-white leading-[1.03] tracking-tight max-w-5xl">
            <span style={{ animation: "fadeInUp 0.6s ease 0.2s both", display: "block" }}>Your anonymous idea</span>
            <span style={{ animation: "fadeInUp 0.6s ease 0.35s both", display: "block", background: "linear-gradient(135deg, #818cf8, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              becomes market intelligence.
            </span>
          </h1>

          <p className="mt-7 text-center text-[1.05rem] text-gray-400 leading-relaxed max-w-[520px]"
            style={{ animation: "fadeInUp 0.6s ease 0.5s both" }}>
            Submit your startup idea in 2 minutes. AI clusters it, reveals where the market is heading, and gives you a personal insight report — instantly.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mt-9"
            style={{ animation: "fadeInUp 0.6s ease 0.64s both" }}>
            <Link href="/submit" className="group inline-flex items-center gap-2 bg-indigo-500 text-white font-bold px-7 py-3.5 rounded-xl text-sm hover:bg-indigo-400 transition-all duration-200 hover:shadow-2xl hover:shadow-indigo-500/30 hover:-translate-y-0.5">
              Submit your idea
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link href="/explore" className="inline-flex items-center gap-2 border border-white/15 text-gray-300 font-medium px-7 py-3.5 rounded-xl text-sm hover:border-white/35 hover:text-white hover:bg-white/5 transition-all duration-200">
              <BarChart3 className="w-4 h-4" /> View live trends
            </Link>
          </div>

          <p className="mt-5 text-xs text-gray-600" style={{ animation: "fadeInUp 0.5s ease 0.78s both" }}>
            Free · Anonymous · No account needed
          </p>

          {/* Scroll cue */}
          <div className="mt-10 flex flex-col items-center gap-2 opacity-40"
            style={{ animation: "fadeIn 1s ease 1.2s both" }}>
            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">See live ideas</span>
            <ChevronDown className="w-4 h-4 text-gray-400 animate-bounce" />
          </div>
        </div>

        {/* ── Peek cards at bottom ── */}
        <div className="relative w-full px-4 pb-0" style={{ marginTop: "-20px" }}>
          <div className="max-w-5xl mx-auto">
            {/* Fade gradient over cards */}
            <div className="absolute inset-x-0 top-0 h-16 pointer-events-none z-10"
              style={{ background: "linear-gradient(to bottom, rgba(11,16,38,1), transparent)" }} />
            <div className="absolute inset-x-0 bottom-0 h-32 pointer-events-none z-10"
              style={{ background: "linear-gradient(to bottom, transparent, rgba(255,255,255,1))" }} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-8"
              style={{ animation: "fadeInUp 0.8s ease 0.9s both" }}>
              {SAMPLE_IDEAS.map((idea, i) => {
                const c = CARD_COLORS[idea.color];
                return (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-xl p-5 relative overflow-hidden"
                    style={{ transform: `translateY(${i % 2 === 1 ? "16px" : "0px"})` }}>
                    {/* Top accent line */}
                    <div className={`absolute top-0 left-0 right-0 h-0.5 ${idea.color === "indigo" ? "bg-indigo-400" : idea.color === "violet" ? "bg-violet-400" : "bg-blue-400"}`} />

                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${c.badge}`}>{idea.category}</span>
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-xs font-bold text-emerald-600">{idea.trend}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed mb-4 line-clamp-2">{idea.desc}</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Viability</p>
                        <div className="flex items-center gap-1.5">
                          <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${idea.score >= 80 ? "bg-emerald-400" : "bg-amber-400"}`} style={{ width: `${idea.score}%` }} />
                          </div>
                          <span className={`text-xs font-bold ${idea.score >= 80 ? "text-emerald-600" : "text-amber-600"}`}>{idea.score}</span>
                        </div>
                      </div>
                      <div className={`w-8 h-8 rounded-xl ${c.bg} flex items-center justify-center`}>
                        <Sparkles className={`w-3.5 h-3.5 ${c.text}`} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="border-y border-gray-100 py-10 bg-white">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-3 gap-8 text-center">
          {[
            { target: 0, suffix: " ideas", label: "submitted so far", prefix: "" },
            { target: 3, suffix: " steps", label: "to your insight report", prefix: "" },
            { target: 12, suffix: " categories", label: "tracked in real time", prefix: "" },
          ].map((s, i) => (
            <FadeUp key={i} delay={i * 100}>
              <div className="text-3xl font-extrabold text-gray-900">
                {s.prefix}<Counter target={s.target} suffix={s.suffix} />
              </div>
              <div className="text-xs text-gray-400 mt-1">{s.label}</div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-28 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <FadeUp className="text-center mb-16">
            <p className="text-xs font-bold tracking-widest text-indigo-500 uppercase mb-3">How it works</p>
            <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">Three steps. Real intelligence.</h2>
          </FadeUp>

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Connector line */}
            <div className="hidden md:block absolute top-10 left-1/3 right-1/3 h-px bg-gradient-to-r from-indigo-200 via-violet-200 to-indigo-200" />

            {[
              { step: "01", icon: FileText, title: "Submit anonymously", sub: "Category + target user + brief description. Under 2 minutes. Zero public exposure.", color: "indigo" },
              { step: "02", icon: Sparkles, title: "AI analyzes & clusters", sub: "Groups your idea with similar ones. Measures saturation, trend velocity, market timing.", color: "violet" },
              { step: "03", icon: BarChart3, title: "Get your report", sub: "Viability score, saturation level, trend direction, and a full market intelligence snapshot.", color: "blue" },
            ].map((item, i) => (
              <FadeUp key={item.step} delay={i * 140}>
                <div className="relative p-8 rounded-2xl border border-gray-100 bg-white hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 group">
                  <span className="absolute top-4 right-5 text-7xl font-black text-gray-50 leading-none select-none group-hover:text-indigo-50 transition-colors">{item.step}</span>
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 ${item.color === "indigo" ? "bg-indigo-50" : item.color === "violet" ? "bg-violet-50" : "bg-blue-50"}`}>
                    <item.icon className={`w-5 h-5 ${item.color === "indigo" ? "text-indigo-500" : item.color === "violet" ? "text-violet-500" : "text-blue-500"}`} />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.sub}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── Live insight preview ── */}
      <section className="py-28 px-6" style={{ background: "linear-gradient(135deg, #fafafe 0%, #f5f3ff 100%)" }}>
        <div className="max-w-5xl mx-auto">
          <FadeUp className="text-center mb-14">
            <p className="text-xs font-bold tracking-widest text-indigo-500 uppercase mb-3">What you get</p>
            <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">Your insight report, instantly.</h2>
            <p className="mt-4 text-gray-500 max-w-md mx-auto text-sm">Every submission gets a full intelligence breakdown. Here&apos;s what it looks like.</p>
          </FadeUp>

          <FadeUp>
            <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl overflow-hidden max-w-2xl mx-auto">
              {/* Report header */}
              <div className="bg-gradient-navy p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10"
                  style={{ background: "radial-gradient(circle, #818cf8, transparent)", transform: "translate(30%, -30%)" }} />
                <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-2">Personal Insight Report</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-bold">AI / ML · For: Solo developers</p>
                    <p className="text-gray-400 text-xs mt-1">Submitted anonymously · Just now</p>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-extrabold text-emerald-400">82</div>
                    <div className="text-xs text-gray-400">viability</div>
                  </div>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
                {[
                  { label: "Market Trend", value: "Rising", icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50" },
                  { label: "Saturation", value: "Low", icon: Minus, color: "text-indigo-500", bg: "bg-indigo-50" },
                  { label: "Similar Ideas", value: "3", icon: Sparkles, color: "text-violet-500", bg: "bg-violet-50" },
                ].map((m) => (
                  <div key={m.label} className="p-5 text-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{m.label}</p>
                    <div className={`w-9 h-9 rounded-xl ${m.bg} flex items-center justify-center mx-auto mb-1.5`}>
                      <m.icon className={`w-4 h-4 ${m.color}`} />
                    </div>
                    <p className={`text-sm font-bold ${m.color}`}>{m.value}</p>
                  </div>
                ))}
              </div>

              {/* AI summary */}
              <div className="p-6">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">AI Insight</p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  High-signal opportunity. The AI/ML space is gaining momentum with very few similar ideas submitted yet — you may be <span className="font-semibold text-indigo-600">early to a genuine market gap</span>. Low saturation combined with a rising trend makes this an ideal time to move.
                </p>
                <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                  <span className="text-xs text-gray-400">Report ID: •••-••••-8f2a</span>
                  <span className="text-xs font-semibold text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full">Private link only</span>
                </div>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── Market gap ── */}
      <section className="py-28 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <FadeUp className="text-center mb-14">
            <p className="text-xs font-bold tracking-widest text-indigo-500 uppercase mb-3">Market Research</p>
            <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">The data no one else has.</h2>
          </FadeUp>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <FadeUp>
              <div className="p-8 rounded-2xl border border-gray-200 h-full">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                  </div>
                  <span className="text-sm font-bold text-gray-400">Existing tools</span>
                </div>
                {["Rely on company & investment data that already exists", "Search trends only capture already-popular keywords", "Zero data on the early 'idea consideration' stage"].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 mb-4">
                    <XCircle className="w-4 h-4 text-gray-200 shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-400">{item}</p>
                  </div>
                ))}
              </div>
            </FadeUp>

            <FadeUp delay={120}>
              <div className="p-8 rounded-2xl border border-indigo-200 bg-indigo-50 h-full relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-20"
                  style={{ background: "radial-gradient(circle, #818cf8, transparent)", transform: "translate(30%, -30%)" }} />
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                  <span className="text-sm font-bold text-indigo-600">Try.Wepp&apos;s edge</span>
                </div>
                {["Captures the earliest 'Founder Intent' data on the market", "Creates a new 'idea-stage data' layer that never existed", "Trends get stronger and more precise as submissions grow"].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 mb-4">
                    <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-indigo-800 font-medium">{item}</p>
                  </div>
                ))}
                <p className="mt-2 text-xs text-indigo-400 border-t border-indigo-200 pt-4 font-medium">B2B expansion: VCs, accelerators, research institutions</p>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-28 px-6" style={{ background: "linear-gradient(135deg, #fafafe 0%, #f5f3ff 100%)" }}>
        <div className="max-w-5xl mx-auto">
          <FadeUp className="text-center mb-14">
            <p className="text-xs font-bold tracking-widest text-indigo-500 uppercase mb-3">Core MVP</p>
            <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">Four features. One flywheel.</h2>
          </FadeUp>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              { icon: FileText, title: "Anonymous Submission", sub: "ANONYMOUS SUBMISSION", desc: "Category, target user, brief description. No account needed. No public exposure.", color: "indigo" },
              { icon: Sparkles, title: "Personal Insight Report", sub: "PERSONAL INSIGHT", desc: "Immediate feedback on viability, saturation, and trend direction — delivered as an incentive to submit.", color: "violet" },
              { icon: BarChart3, title: "Trend Dashboard", sub: "TREND DASHBOARD", desc: "Visualize growing categories and saturated areas based on aggregated idea data no platform else has.", color: "blue" },
              { icon: ShieldCheck, title: "Quality Filter", sub: "QUALITY FILTER", desc: "AI-powered duplicate detection and spam filtering keeps the trend data accurate at scale.", color: "emerald" },
            ].map((f, i) => {
              const configs = {
                indigo:  { bg: "bg-indigo-50",  text: "text-indigo-500",  border: "hover:border-indigo-200" },
                violet:  { bg: "bg-violet-50",  text: "text-violet-500",  border: "hover:border-violet-200" },
                blue:    { bg: "bg-blue-50",    text: "text-blue-500",    border: "hover:border-blue-200" },
                emerald: { bg: "bg-emerald-50", text: "text-emerald-500", border: "hover:border-emerald-200" },
              };
              const c = configs[f.color as keyof typeof configs];
              return (
                <FadeUp key={f.title} delay={i * 90}>
                  <div className={`p-8 rounded-2xl border border-gray-100 bg-white hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 h-full ${c.border}`}>
                    <div className={`w-11 h-11 rounded-xl ${c.bg} flex items-center justify-center mb-5`}>
                      <f.icon className={`w-5 h-5 ${c.text}`} />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">{f.title}</h3>
                    <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-4">{f.sub}</p>
                    <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                  </div>
                </FadeUp>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Competitive table ── */}
      <section className="py-28 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <FadeUp className="text-center mb-14">
            <p className="text-xs font-bold tracking-widest text-indigo-500 uppercase mb-3">Competitive Landscape</p>
            <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">A category of one.</h2>
          </FadeUp>
          <FadeUp>
            <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
              <table className="w-full text-sm bg-white">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left p-5 text-xs font-bold text-gray-400 uppercase tracking-wider w-[200px]">Feature</th>
                    {[
                      { name: "Harmonic", type: "STARTUP DB" },
                      { name: "Exploding Topics", type: "TREND TOOL" },
                      { name: "ValidatorAI", type: "AI VALIDATOR" },
                      { name: "Try.Wepp", type: "IDEA SIGNALS", highlight: true },
                    ].map((col) => (
                      <th key={col.name} className={`p-5 text-center ${col.highlight ? "bg-indigo-500" : ""}`}>
                        <div className={`text-[10px] font-bold tracking-widest uppercase mb-1 ${col.highlight ? "text-indigo-200" : "text-gray-400"}`}>{col.type}</div>
                        <div className={`font-extrabold text-sm ${col.highlight ? "text-white" : "text-gray-800"}`}>{col.name}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "Idea-stage data", vals: [false, false, false, true] },
                    { label: "Anonymous input", vals: [false, false, false, true] },
                    { label: "Personal report", vals: [false, false, true, true] },
                    { label: "Trend report", vals: [false, true, false, true] },
                    { label: "Pre-founding focus", vals: [false, false, false, true] },
                  ].map((row, ri) => (
                    <tr key={row.label} className={`border-b border-gray-50 ${ri % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                      <td className="p-5 text-sm font-semibold text-gray-700">{row.label}</td>
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
          </FadeUp>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="bg-gradient-navy py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.05]" style={{
          backgroundImage: "radial-gradient(circle, #a5b4fc 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)" }} />

        <div className="relative max-w-3xl mx-auto text-center">
          <FadeUp>
            <p className="text-xs font-bold tracking-widest text-indigo-400 uppercase mb-5">Join the early wave</p>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white leading-tight tracking-tight mb-4">
              Your idea is a <span style={{ color: "#818cf8" }}>market signal.</span><br />
              Start contributing.
            </h2>
            <p className="text-gray-400 text-base mb-10 max-w-md mx-auto">
              Anonymous. Free. Instant results. The more founders submit, the smarter the platform gets for everyone.
            </p>
            <Link href="/submit" className="inline-flex items-center gap-2 bg-indigo-500 text-white font-bold px-9 py-4 rounded-xl text-base hover:bg-indigo-400 transition-all duration-200 hover:shadow-2xl hover:shadow-indigo-500/30 hover:-translate-y-0.5">
              Submit your idea — it&apos;s free <ArrowRight className="w-5 h-5" />
            </Link>
          </FadeUp>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 py-8 px-6 bg-white">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" className="w-7 h-7 rounded-lg" alt="Try.Wepp" />
            <span className="text-sm font-bold text-gray-900">Try.Wepp</span>
          </Link>
          <p className="text-xs text-gray-400">© 2026 Try.Wepp · Anonymous Founder Idea Signals</p>
        </div>
      </footer>
    </div>
  );
}