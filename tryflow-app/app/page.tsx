"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, TrendingUp, Minus, ChevronDown, Sparkles, BarChart3 } from "lucide-react";
import { ParticleBackground } from "@/components/ui/ParticleBackground";
import { IdeaBubbles } from "@/components/ui/IdeaBubbles";
import { ScrollSeeds } from "@/components/ui/ScrollSeeds";

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

function useScrollY() {
  const [y, setY] = useState(0);
  useEffect(() => {
    const fn = () => setY(window.scrollY);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);
  return y;
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

// Spring physics drop-in (replaces FadeUp)
function FallIn({ children, delay = 0, className = "", rotate = true }: { children: React.ReactNode; delay?: number; className?: string; rotate?: boolean }) {
  const [ref, inView] = useInView(0.08);
  return (
    <div ref={ref} className={className} style={{
      opacity: inView ? 1 : 0,
      transform: inView
        ? "translateY(0px) rotate(0deg) scale(1)"
        : `translateY(-38px) ${rotate ? "rotate(-1.5deg)" : ""} scale(0.96)`,
      transition: `opacity 0.45s ease ${delay}ms, transform 0.85s cubic-bezier(0.34,1.56,0.64,1) ${delay}ms`,
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

// ── Sparkline trend cards ──────────────────────────────────────────────────
const TREND_CARDS = [
  {
    category: "AI / ML", score: 82, direction: "Rising",
    points: [18, 22, 19, 28, 25, 35, 38, 33, 45, 52, 58, 65],
    color: "#818cf8", glow: "rgba(129,140,248,0.18)",
  },
  {
    category: "SaaS / B2B", score: 71, direction: "Stable",
    points: [38, 42, 36, 44, 40, 43, 38, 45, 41, 44, 40, 43],
    color: "#a78bfa", glow: "rgba(167,139,250,0.18)",
  },
  {
    category: "Dev Tools", score: 88, direction: "Rising",
    points: [12, 18, 15, 22, 20, 30, 28, 38, 42, 50, 55, 62],
    color: "#34d399", glow: "rgba(52,211,153,0.18)",
  },
];

function Sparkline({ points, color, animated }: { points: number[]; color: string; animated: boolean }) {
  const W = 120, H = 40;
  const min = Math.min(...points), max = Math.max(...points);
  const range = max - min || 1;
  const coords = points.map((v, i) => {
    const x = (i / (points.length - 1)) * W;
    const y = H - ((v - min) / range) * H * 0.85 - H * 0.08;
    return `${x},${y}`;
  }).join(" ");
  const totalLen = 300; // approximate

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none">
      <defs>
        <linearGradient id={`sg-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Area fill */}
      <polyline
        points={`0,${H} ${coords} ${W},${H}`}
        fill={`url(#sg-${color.replace("#","")})`}
      />
      {/* Line */}
      <polyline
        points={coords}
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        style={animated ? {
          strokeDasharray: totalLen,
          strokeDashoffset: 0,
          animation: `sparkDraw 1.4s cubic-bezier(0.4,0,0.2,1) forwards`,
        } : {}}
      />
      {/* End dot */}
      {(() => {
        const last = points[points.length - 1];
        const x = W;
        const y = H - ((last - min) / range) * H * 0.85 - H * 0.08;
        return (
          <circle cx={x} cy={y} r="3" fill={color}
            style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
        );
      })()}
    </svg>
  );
}

function SparkCard({ card, delay }: { card: typeof TREND_CARDS[0]; delay: number }) {
  const [ref, inView] = useInView(0.1);
  const isRising = card.direction === "Rising";
  const dirColor = isRising ? "#34d399" : card.direction === "Stable" ? "#fbbf24" : "#f87171";

  return (
    <div ref={ref} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? "translateY(0)" : "translateY(20px)",
      transition: `opacity 0.6s ease ${delay}ms, transform 0.8s cubic-bezier(0.34,1.56,0.64,1) ${delay}ms`,
    }}>
      <div className=" p-5 relative overflow-hidden"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
        {/* Glow bg */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at 50% 100%, ${card.glow} 0%, transparent 70%)` }} />

        <div className="relative">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full"
              style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)" }}>
              {card.category}
            </span>
            <span className="text-xs font-bold" style={{ color: dirColor }}>
              {isRising ? "↑" : card.direction === "Stable" ? "→" : "↓"} {card.direction}
            </span>
          </div>

          {/* Sparkline */}
          <div className="mb-4">
            <Sparkline points={card.points} color={card.color} animated={inView} />
          </div>

          {/* Score */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Viability</p>
              <div className="flex items-center gap-2">
                <div className="w-20 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: inView ? `${card.score}%` : "0%", background: card.color, transitionDelay: `${delay + 400}ms` }} />
                </div>
                <span className="text-xs font-bold" style={{ color: card.color }}>{card.score}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Interactive Demo ───────────────────────────────────────────────────────
const DEMO_DESC = "An AI copilot that auto-generates investor update emails from your product metrics — no manual writing needed.";
const ANALYSIS_ITEMS = [
  "Scanning 847 submitted ideas in AI / ML...",
  "Comparing target user overlap...",
  "Measuring market saturation level...",
  "Calculating 7-day trend velocity...",
  "Generating your insight report...",
];

function InteractiveDemo() {
  const [step, setStep] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const [analysisLine, setAnalysisLine] = useState(0);
  const [reportIn, setReportIn] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const S = 1 / 0.7; // 0.7x speed = 1/0.7 longer durations
    const t = (fn: () => void, ms: number) => { const id = setTimeout(fn, ms * S); timers.push(id); };

    if (step === 0) {
      setCharCount(0);
      let i = 0;
      const typeChar = () => {
        i++;
        setCharCount(i);
        if (i < DEMO_DESC.length) t(typeChar, 11 + Math.random() * 8);
        else t(() => setStep(1), 350);
      };
      t(typeChar, 200);
    }

    if (step === 1) {
      setProgress(0);
      setAnalysisLine(0);
      let p = 0;
      let line = 0;
      const tick = () => {
        p = Math.min(100, p + Math.random() * 18 + 10);
        setProgress(Math.floor(p));
        const newLine = Math.floor((p / 100) * ANALYSIS_ITEMS.length);
        if (newLine !== line) { line = newLine; setAnalysisLine(newLine); }
        if (p < 100) t(tick, 55 + Math.random() * 40);
        else t(() => setStep(2), 250);
      };
      t(tick, 200);
    }

    if (step === 2) {
      setReportIn(false);
      setScore(0);
      t(() => {
        setReportIn(true);
        let s = 0;
        const countUp = () => {
          s = Math.min(82, s + 8);
          setScore(s);
          if (s < 82) t(countUp, 25);
        };
        t(countUp, 150);
        t(() => setStep(0), 2800);
      }, 150);
    }

    return () => timers.forEach(clearTimeout);
  }, [step]);

  const STEP_LABELS = ["Submit idea", "AI analyzes", "Your report"];
  const STEP_URLS   = ["try-flow-ten.vercel.app/submit", "try-flow-ten.vercel.app/submit", "try-flow-ten.vercel.app/ideas/f3a2•••"];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Step indicator */}
      <div className="flex items-center justify-center mb-8 gap-0">
        {STEP_LABELS.map((label, i) => (
          <div key={label} className="flex items-center">
            <button onClick={() => setStep(i)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-400 cursor-pointer
                ${step === i ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/25" : "text-gray-400 hover:text-gray-600"}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                ${step === i ? "bg-white text-indigo-600" : step > i ? "bg-indigo-400 text-white" : "border-2 border-gray-300 text-gray-400"}`}>
                {step > i ? "✓" : i + 1}
              </span>
              <span className="text-xs font-semibold">{label}</span>
            </button>
            {i < 2 && (
              <div className={`w-10 h-px transition-all duration-500 ${step > i ? "bg-indigo-400" : "bg-gray-200"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Browser window */}
      <div className=" border border-gray-200 shadow-2xl overflow-hidden">
        {/* Chrome bar */}
        <div className="bg-gray-100 border-b border-gray-200 px-4 py-2.5 flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 bg-white border border-gray-200  px-3 py-1 text-[11px] text-gray-400 text-center font-mono truncate">
            {STEP_URLS[step]}
          </div>
        </div>

        {/* ── Step 0: Submit form ── */}
        {step === 0 && (
          <div className="bg-gradient-navy p-8 min-h-[360px]">
            <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-6">Step 2 of 3 — Describe your idea</p>

            {/* Pre-filled fields */}
            <div className="space-y-3 mb-5">
              <div className="bg-indigo-500/20 border border-indigo-400/30  px-4 py-2.5 flex items-center justify-between">
                <span className="text-xs text-indigo-300 font-medium">Category</span>
                <span className="text-xs font-bold text-indigo-200 bg-indigo-500/30 px-2 py-0.5 rounded-full">AI / ML ✓</span>
              </div>
              <div className="bg-indigo-500/20 border border-indigo-400/30  px-4 py-2.5 flex items-center justify-between">
                <span className="text-xs text-indigo-300 font-medium">Target user</span>
                <span className="text-xs font-bold text-indigo-200">Solo developers ✓</span>
              </div>
            </div>

            {/* Typing field */}
            <div className="bg-white/5 border border-white/10  p-4 mb-5 min-h-[90px]">
              <p className="text-xs text-gray-500 mb-2 font-medium">Description</p>
              <p className="text-sm text-white leading-relaxed">
                {DEMO_DESC.slice(0, charCount)}
                <span className="inline-block w-px h-4 bg-indigo-400 ml-0.5 animate-pulse" />
              </p>
            </div>

            {/* Submit button */}
            <button className={`w-full py-3  font-bold text-sm transition-all duration-300
              ${charCount >= DEMO_DESC.length
                ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 scale-[1.02]"
                : "bg-white/10 text-white/40 cursor-not-allowed"}`}>
              {charCount >= DEMO_DESC.length ? "✓ Get my insight report →" : "Get my insight report →"}
            </button>
            <p className="text-center text-[11px] text-gray-600 mt-3">100% anonymous · Never made public</p>
          </div>
        )}

        {/* ── Step 1: AI Analysis ── */}
        {step === 1 && (
          <div className="bg-white p-8 min-h-[360px] flex flex-col justify-center">
            <div className="text-center mb-8">
              <div className="w-14 h-14  bg-indigo-50 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-indigo-500 animate-pulse" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg">Analyzing your idea...</h3>
              <p className="text-sm text-gray-400 mt-1">AI is clustering and scoring your submission</p>
            </div>

            {/* Progress bar */}
            <div className="mb-6">
              <div className="flex justify-between text-xs text-gray-400 mb-2">
                <span>Processing</span>
                <span className="font-bold text-indigo-500">{progress}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-200"
                  style={{ width: `${progress}%` }} />
              </div>
            </div>

            {/* Analysis log */}
            <div className="space-y-2">
              {ANALYSIS_ITEMS.slice(0, Math.max(1, analysisLine)).map((item, i) => (
                <div key={i} className={`flex items-center gap-2.5 text-xs transition-all duration-300
                  ${i === analysisLine - 1 ? "opacity-100" : "opacity-40"}`}>
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0
                    ${i < analysisLine - 1 ? "bg-emerald-100" : "bg-indigo-100"}`}>
                    {i < analysisLine - 1
                      ? <span className="text-emerald-600 text-[9px]">✓</span>
                      : <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse block" />}
                  </div>
                  <span className={i < analysisLine - 1 ? "text-gray-400 line-through" : "text-gray-700 font-medium"}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 2: Report ── */}
        {step === 2 && (
          <div className={`min-h-[360px] transition-all duration-700 ${reportIn ? "opacity-100" : "opacity-0 translate-y-2"}`}>
            {/* Report header */}
            <div className="bg-gradient-navy p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10 pointer-events-none"
                style={{ background: "radial-gradient(circle, #818cf8, transparent)", transform: "translate(30%,-30%)" }} />
              <p className="text-indigo-300 text-[10px] font-bold uppercase tracking-widest mb-2">Personal Insight Report</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-bold text-sm">AI / ML · For: Solo developers</p>
                  <p className="text-gray-400 text-xs mt-0.5">Submitted anonymously · Just now</p>
                </div>
                <div className="text-center">
                  <div className={`text-4xl font-extrabold transition-colors duration-300 ${score >= 70 ? "text-emerald-400" : "text-amber-400"}`}>{score}</div>
                  <div className="text-[10px] text-gray-400">viability</div>
                </div>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100 bg-white">
              {[
                { label: "Market Trend", value: "Rising",   icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50" },
                { label: "Saturation",   value: "Low",      icon: Minus,      color: "text-indigo-500",  bg: "bg-indigo-50" },
                { label: "Similar Ideas",value: "3",        icon: Sparkles,   color: "text-violet-500",  bg: "bg-violet-50" },
              ].map((m) => (
                <div key={m.label} className="p-4 text-center">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{m.label}</p>
                  <div className={`w-8 h-8  ${m.bg} flex items-center justify-center mx-auto mb-1`}>
                    <m.icon className={`w-3.5 h-3.5 ${m.color}`} />
                  </div>
                  <p className={`text-xs font-bold ${m.color}`}>{m.value}</p>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="p-5 bg-white">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">AI Insight</p>
              <p className="text-xs text-gray-600 leading-relaxed">
                High-signal opportunity. The AI/ML space is gaining momentum with very few similar ideas —
                you may be <span className="font-semibold text-indigo-600">early to a genuine market gap</span>.
                Low saturation + rising trend = ideal timing.
              </p>
            </div>
          </div>
        )}
      </div>

      <p className="text-center text-xs text-gray-400 mt-4">
        Click the steps above to explore · Auto-plays on loop
      </p>
    </div>
  );
}

// ── Star field (deterministic to avoid hydration mismatch) ───────────────
const STARS = Array.from({ length: 80 }, (_, i) => ({
  top:     ((i * 17.31 + 5.13) % 88) + 2,
  left:    ((i * 23.71 + 8.37) % 98) + 1,
  size:    i % 5 === 0 ? 2.5 : i % 3 === 0 ? 1.8 : 1.2,
  opacity: 0.15 + (i % 7) * 0.08,
  delay:   (i % 6) * 0.9,
  dur:     2.5 + (i % 5) * 0.8,
  twinkle: i % 4 === 0,
}));

// ── Cloud layer data ──────────────────────────────────────────────────────
const CLOUDS = [
  // [bottom%, left%, width, height, opacity, blur, parallaxFactor]
  { bottom: 18, left:  -5, w: 420, h: 90,  op: 0.12, blur: 28, p: 0.12 },
  { bottom: 14, left:  30, w: 340, h: 70,  op: 0.09, blur: 24, p: 0.08 },
  { bottom: 22, left:  60, w: 500, h: 110, op: 0.14, blur: 32, p: 0.15 },
  { bottom: 10, left:  75, w: 280, h: 60,  op: 0.08, blur: 20, p: 0.06 },
  { bottom: 26, left:  15, w: 380, h: 80,  op: 0.10, blur: 26, p: 0.10 },
  { bottom: 8,  left:  45, w: 460, h: 85,  op: 0.11, blur: 30, p: 0.13 },
];

// ─────────────────────────────────────────────────────────────────────────
const STYLE_CYCLE = [
  { fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 900, fontStyle: "normal"  as const, letterSpacing: "-0.06em",  fontSize: "1em",    textTransform: "none"      as const },
  { fontFamily: "'Playfair Display', serif",       fontWeight: 400, fontStyle: "italic"  as const, letterSpacing: "0.01em",   fontSize: "1.05em", textTransform: "none"      as const },
  { fontFamily: "'Bebas Neue', sans-serif",        fontWeight: 400, fontStyle: "normal"  as const, letterSpacing: "0.12em",   fontSize: "1.15em", textTransform: "uppercase" as const },
  { fontFamily: "'Space Mono', monospace",         fontWeight: 400, fontStyle: "italic"  as const, letterSpacing: "-0.04em",  fontSize: "0.72em", textTransform: "none"      as const },
  { fontFamily: "'DM Serif Display', serif",       fontWeight: 400, fontStyle: "normal"  as const, letterSpacing: "-0.02em",  fontSize: "1.1em",  textTransform: "none"      as const },
  { fontFamily: "'Oswald', sans-serif",            fontWeight: 200, fontStyle: "normal"  as const, letterSpacing: "0.3em",    fontSize: "0.68em", textTransform: "uppercase" as const },
  { fontFamily: "'Caveat', cursive",               fontWeight: 700, fontStyle: "normal"  as const, letterSpacing: "0.02em",   fontSize: "1.18em", textTransform: "none"      as const },
  { fontFamily: "'Playfair Display', serif",       fontWeight: 900, fontStyle: "normal"  as const, letterSpacing: "-0.03em",  fontSize: "1.0em",  textTransform: "none"      as const },
  { fontFamily: "'Oswald', sans-serif",            fontWeight: 700, fontStyle: "normal"  as const, letterSpacing: "0.06em",   fontSize: "1.0em",  textTransform: "none"      as const },
  { fontFamily: "'Space Mono', monospace",         fontWeight: 700, fontStyle: "normal"  as const, letterSpacing: "-0.05em",  fontSize: "0.78em", textTransform: "none"      as const },
];

export default function HomePage() {
  const scrolled = useScrolled();
  const mouse = useMouse();
  const scrollY = useScrollY();
  const [revealed, setRevealed] = useState(false);
  const [styleIdx, setStyleIdx] = useState(0);
  const [flipState, setFlipState] = useState<"exit" | "enter">("enter");

  useEffect(() => {
    if (!revealed) return;
    const interval = setInterval(() => {
      setFlipState("exit");
      setTimeout(() => {
        setStyleIdx(i => (i + 1) % STYLE_CYCLE.length);
        setFlipState("enter");
      }, 110);
    }, 850);
    return () => clearInterval(interval);
  }, [revealed]);

  return (
    <div className="min-h-screen font-['Plus_Jakarta_Sans'] overflow-x-hidden" style={{ background: "linear-gradient(to bottom, #050816 0%, #050816 10%, #060d1f 18%, #0a1a3a 26%, #0d2550 34%, #123470 42%, #1a4a90 50%, #2a68b0 58%, #4a90c8 65%, #6ab8c0 71%, #6ab8a0 77%, #4a9878 83%, #2e7058 90%, #1e5040 100%)" }}>
      <ScrollSeeds />

      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300" style={{
        background: scrolled ? "rgba(255,255,255,0.97)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? "1px solid #f0f0f0" : "none",
        boxShadow: scrolled ? "0 1px 20px rgba(0,0,0,0.06)" : "none",
      }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-[60px]">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" className="w-7 h-7 " alt="Try.Wepp" />
            <span className="font-bold text-sm tracking-tight transition-colors duration-300"
              style={{ color: scrolled ? "#0B1026" : "white" }}>Try.Wepp</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login" className="text-sm font-medium px-3 py-2 transition-colors duration-300"
              style={{ color: scrolled ? "#6b7280" : "rgba(255,255,255,0.7)" }}>
              Log in
            </Link>
            <Link href="/signup" className="text-sm font-bold px-4 py-2  transition-all duration-300"
              style={{ background: scrolled ? "#0B1026" : "white", color: scrolled ? "white" : "#0B1026" }}>
              Get early access →
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex flex-col overflow-hidden" style={{ background: "#050816" }}>

        {/* Particle system */}
        <ParticleBackground />

        {/* Idea bubbles converging toward title */}
        <IdeaBubbles onReveal={() => setRevealed(true)} />

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

        {/* ── Star field — parallax upward on scroll ── */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ transform: `translateY(${-scrollY * 0.25}px)`, willChange: "transform" }}
        >
          {STARS.map((s, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                top: `${s.top}%`,
                left: `${s.left}%`,
                width: s.size,
                height: s.size,
                opacity: Math.max(0, s.opacity - scrollY * 0.001),
                animation: s.twinkle
                  ? `twinkle ${s.dur}s ease-in-out ${s.delay}s infinite`
                  : undefined,
              }}
            />
          ))}
        </div>

        {/* ── Satellite orbits — fade out as we descend ── */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "8%", right: "6%", width: 220, height: 100,
            opacity: Math.max(0, 1 - scrollY * 0.004),
            transform: `translateY(${-scrollY * 0.15}px)`,
          }}
        >
          <svg width="220" height="100" viewBox="0 0 220 100" style={{ overflow: "visible" }}>
            <defs>
              <path id="sat-path-1" d="M 215 50 A 105 42 0 1 0 215 50.001" fill="none" />
              <path id="sat-path-2" d="M 180 50 A 70 28 0 1 1 180 50.001" fill="none" />
            </defs>
            {/* Outer orbit ring */}
            <ellipse cx="110" cy="50" rx="105" ry="42"
              fill="none" stroke="rgba(165,180,252,0.10)" strokeWidth="1" strokeDasharray="3 7" />
            {/* Inner orbit ring */}
            <ellipse cx="110" cy="50" rx="70" ry="28"
              fill="none" stroke="rgba(165,180,252,0.07)" strokeWidth="1" strokeDasharray="2 8" />
            {/* Satellite 1 */}
            <g>
              <animateMotion dur="14s" repeatCount="indefinite">
                <mpath href="#sat-path-1" />
              </animateMotion>
              <circle r="2.5" fill="#a5b4fc" opacity="0.9" />
              <circle r="5" fill="rgba(165,180,252,0.18)" />
            </g>
            {/* Satellite 2 — slower, opposite */}
            <g>
              <animateMotion dur="9s" repeatCount="indefinite" keyPoints="1;0" keyTimes="0;1" calcMode="linear">
                <mpath href="#sat-path-2" />
              </animateMotion>
              <circle r="1.8" fill="#c4b5fd" opacity="0.7" />
            </g>
          </svg>
        </div>

        {/* ── Atmosphere glow band — intensifies on scroll ── */}
        <div
          className="absolute inset-x-0 pointer-events-none"
          style={{
            bottom: "28%",
            height: "160px",
            background: "linear-gradient(to bottom, transparent, rgba(56,120,200,0.06) 50%, transparent)",
            animation: "atmospherePulse 5s ease-in-out infinite",
            opacity: 0.4 + Math.min(0.6, scrollY * 0.002),
            transform: `translateY(${scrollY * 0.05}px)`,
          }}
        />

        {/* ── Cloud layer — appears as we enter atmosphere ── */}
        {CLOUDS.map((c, i) => {
          const cloudOpacity = Math.min(c.op, (scrollY / 300) * c.op);
          const translateY = -scrollY * c.p;
          return (
            <div
              key={i}
              className="absolute pointer-events-none rounded-full"
              style={{
                bottom: `${c.bottom}%`,
                left: `${c.left}%`,
                width: c.w,
                height: c.h,
                opacity: cloudOpacity,
                transform: `translateY(${translateY}px)`,
                background: "radial-gradient(ellipse at center, rgba(180,210,255,0.9) 0%, rgba(140,180,255,0.5) 40%, transparent 75%)",
                filter: `blur(${c.blur}px)`,
                willChange: "transform, opacity",
              }}
            />
          );
        })}

        {/* ── Earth curve arc — grows as we descend ── */}
        <div
          className="absolute bottom-0 left-0 right-0 pointer-events-none"
          style={{
            height: 220,
            zIndex: 1,
            transform: `translateY(${scrollY * 0.08}px) scaleY(${1 + scrollY * 0.0008})`,
            transformOrigin: "bottom center",
            opacity: Math.min(1, 0.5 + scrollY * 0.002),
          }}
        >
          <svg width="100%" height="220" viewBox="0 0 1440 220" preserveAspectRatio="none">
            <defs>
              <radialGradient id="earthAtmGrad" cx="50%" cy="110%" r="55%">
                <stop offset="0%"   stopColor="#3b82f6" stopOpacity="0.18" />
                <stop offset="45%"  stopColor="#1d4ed8" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#050816" stopOpacity="0" />
              </radialGradient>
              <filter id="earthBlur">
                <feGaussianBlur stdDeviation="6" />
              </filter>
            </defs>
            {/* Atmosphere halo fill */}
            <ellipse cx="720" cy="320" rx="900" ry="220"
              fill="url(#earthAtmGrad)" />
            {/* Atmosphere outer glow (blurred) */}
            <ellipse cx="720" cy="330" rx="860" ry="200"
              fill="none" stroke="rgba(96,165,250,0.12)" strokeWidth="18"
              filter="url(#earthBlur)" />
            {/* Earth surface arc — crisp line */}
            <ellipse cx="720" cy="340" rx="820" ry="180"
              fill="none" stroke="rgba(147,197,253,0.22)" strokeWidth="1.5" />
            {/* Second arc — inner atmosphere */}
            <ellipse cx="720" cy="360" rx="760" ry="155"
              fill="none" stroke="rgba(96,165,250,0.08)" strokeWidth="1" />
          </svg>
        </div>

        {/* Hero content */}
        <div className="relative flex-1 flex flex-col items-center justify-center px-6 pt-24 pb-8">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 border border-indigo-400/30 bg-indigo-500/10 text-indigo-300 text-xs font-semibold px-4 py-1.5 rounded-full mb-8"
            style={{ animation: "fadeInUp 0.5s ease 0.1s both" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Anonymous Founder Idea Signals
          </div>

          {/* Headline */}
          <h1 className="text-center text-[2.8rem] md:text-[5.2rem] font-extrabold text-white leading-[1.12] tracking-tight max-w-5xl">
            <span style={{
              display: "block",
              opacity: revealed ? 1 : 0.18,
              transition: "opacity 1.1s cubic-bezier(0.4,0,0.2,1)",
            }}>Before you build,</span>
            <span style={{
              display: "block",
              opacity: revealed ? 1 : 0,
              transform: revealed ? "translateY(0px)" : "translateY(10px)",
              transition: "opacity 0.9s cubic-bezier(0.4,0,0.2,1) 0.1s, transform 0.9s cubic-bezier(0.34,1.56,0.64,1) 0.1s",
            }}>find out if anyone</span>
            <span style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "1.6em",
              overflow: "visible",
              opacity: revealed ? 1 : 0,
              transform: revealed ? "translateY(0px)" : "translateY(14px)",
              transition: "opacity 1.1s cubic-bezier(0.4,0,0.2,1) 0.22s, transform 1.1s cubic-bezier(0.34,1.56,0.64,1) 0.22s",
            }}>
              <span style={{
                background: "linear-gradient(135deg, #818cf8, #a78bfa)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                display: "inline-block",
                transformOrigin: "center top",
                transform: flipState === "exit"
                  ? "perspective(700px) rotateX(90deg)"
                  : "perspective(700px) rotateX(0deg)",
                opacity: flipState === "exit" ? 0 : 1,
                transition: flipState === "exit"
                  ? "transform 0.1s ease-in, opacity 0.08s ease-in"
                  : "transform 0.2s cubic-bezier(0.34,1.56,0.64,1) 0.02s, opacity 0.12s ease-out 0.02s",
                ...STYLE_CYCLE[styleIdx],
              }}>actually cares.</span>
            </span>
          </h1>

          <p className="mt-7 text-center text-[1.05rem] text-gray-400 leading-relaxed max-w-[520px]"
            style={{ animation: "fadeInUp 0.6s ease 0.5s both" }}>
            Submit your startup idea in 2 minutes. AI clusters it, reveals where the market is heading, and gives you a personal insight report — instantly.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mt-9"
            style={{ animation: "fadeInUp 0.6s ease 0.64s both" }}>
            <Link href="/submit" className="group inline-flex items-center gap-2 bg-indigo-500 text-white font-bold px-7 py-3.5  text-sm hover:bg-indigo-400 transition-all duration-200 hover:shadow-2xl hover:shadow-indigo-500/30 hover:-translate-y-0.5">
              Submit your idea
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link href="/explore" className="inline-flex items-center gap-2 border border-white/15 text-gray-300 font-medium px-7 py-3.5  text-sm hover:border-white/35 hover:text-white hover:bg-white/5 transition-all duration-200">
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
        <div className="relative w-full px-4 pb-0" style={{ marginTop: "-20px", zIndex: 2 }}>
          <div className="max-w-5xl mx-auto">
            {/* Fade gradient over cards */}
            <div className="absolute inset-x-0 top-0 h-16 pointer-events-none z-10"
              style={{ background: "linear-gradient(to bottom, rgba(11,16,38,1), transparent)" }} />
            <div className="absolute inset-x-0 bottom-0 h-32 pointer-events-none z-10"
              style={{ background: "linear-gradient(to bottom, transparent, rgba(5,8,22,1))" }} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-8">
              {TREND_CARDS.map((card, i) => (
                <SparkCard key={card.category} card={card} delay={i * 120} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Signal strip ── */}
      <section className="py-24 px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="max-w-6xl mx-auto">
          <FallIn>
            <div className="flex flex-col md:flex-row items-start md:items-end gap-8 md:gap-20">
              {/* Big statement */}
              <div className="flex-1">
                <p className="text-[4rem] md:text-[7rem] font-black text-white leading-none tracking-tighter">
                  <Counter target={0} suffix="" />
                </p>
                <p className="text-lg font-bold text-white/60 mt-2 uppercase tracking-widest">founder ideas mapped</p>
              </div>
              {/* Details alongside */}
              <div className="flex-1 max-w-sm">
                <p className="text-white/40 text-sm leading-relaxed mb-6">
                  Every anonymous idea submitted becomes a data point. The more founders contribute, the sharper the collective signal becomes.
                </p>
                <div className="flex gap-8">
                  <div>
                    <p className="text-2xl font-extrabold text-white">3</p>
                    <p className="text-xs text-white/40 mt-0.5">steps to insight</p>
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold text-white">9</p>
                    <p className="text-xs text-white/40 mt-0.5">categories tracked</p>
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold text-white">∞</p>
                    <p className="text-xs text-white/40 mt-0.5">signal potential</p>
                  </div>
                </div>
              </div>
            </div>
          </FallIn>
        </div>
      </section>

      {/* ── How it works — editorial rows ── */}
      <section className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <FallIn className="mb-20">
            <p className="text-xs font-bold tracking-widest text-white/40 uppercase mb-4">How it works</p>
            <h2 className="text-[3.5rem] md:text-[6rem] font-black text-white leading-none tracking-tighter">
              The idea<br />descends.
            </h2>
          </FallIn>

          <div className="space-y-0">
            {[
              {
                step: "01",
                title: "You submit.",
                detail: "Anonymously.",
                body: "Category, target user, a short description. No account, no exposure. Under 2 minutes. Your identity stays in the sky.",
                extra: ["Category", "Target user", "Description", "Anonymous"]
              },
              {
                step: "02",
                title: "We read",
                detail: "the constellation.",
                body: "AI clusters your idea with similar ones across the network. Measures submission velocity — this week vs last. Counts the stars around yours.",
                extra: ["847 ideas analyzed", "7-day velocity", "Category saturation", "Pattern matching"]
              },
              {
                step: "03",
                title: "Your signal",
                detail: "lands.",
                body: "A viability score. Saturation level. Trend direction. A market intelligence snapshot that exists nowhere else — delivered instantly.",
                extra: ["Viability score", "Rising / Stable / Declining", "Saturation level", "Market snapshot"]
              },
            ].map((item, i) => {
              const right = i % 2 === 1;
              return (
                <FallIn key={item.step} delay={i * 80}>
                  <div className="py-10 border-t" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                    <div className={`flex items-center justify-between mb-4 ${right ? "flex-row-reverse" : ""}`}>
                      <span className="text-xs font-black tracking-widest text-white/20 uppercase">{item.step}</span>
                      <div className={`flex gap-5 ${right ? "flex-row-reverse" : ""}`}>
                        {item.extra.map(tag => (
                          <span key={tag} className="text-xs text-white/25 font-medium tracking-wide hidden md:block">{tag}</span>
                        ))}
                      </div>
                    </div>
                    <div className={right ? "text-right" : "text-left"}>
                      <h3 className="text-[2.8rem] md:text-[5rem] font-black text-white leading-none tracking-tight mb-1">{item.title}</h3>
                      <h3 className="text-[2.8rem] md:text-[5rem] font-black leading-none tracking-tight mb-6"
                        style={{ color: "rgba(255,255,255,0.28)" }}>{item.detail}</h3>
                      <p className={`text-white/45 text-base leading-relaxed max-w-xl ${right ? "ml-auto" : ""}`}>{item.body}</p>
                    </div>
                  </div>
                </FallIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Interactive Demo ── */}
      <section className="py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <FallIn className="text-center mb-14">
            <p className="text-xs font-bold tracking-widest text-indigo-400 uppercase mb-3">See how it works</p>
            <h2 className="text-4xl font-extrabold text-white tracking-tight">From idea to insight in 3 steps.</h2>
            <p className="mt-4 text-gray-400 max-w-md mx-auto text-sm">Watch the full journey — or click any step to explore it yourself.</p>
          </FallIn>
          <FallIn>
            <InteractiveDemo />
          </FallIn>
        </div>
      </section>

      {/* ── Market gap — editorial ── */}
      <section className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <FallIn className="mb-16">
            <p className="text-xs font-bold tracking-widest text-white/40 uppercase mb-4">The gap no one filled</p>
            <h2 className="text-[3.5rem] md:text-[6rem] font-black text-white leading-none tracking-tighter">
              The data<br />
              <span style={{ color: "rgba(255,255,255,0.35)" }}>no one else has.</span>
            </h2>
          </FallIn>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-px" style={{ background: "rgba(255,255,255,0.08)" }}>
            <FallIn>
              <div className="p-10" style={{ background: "rgba(0,0,0,0.2)" }}>
                <p className="text-xs font-bold tracking-widest text-white/30 uppercase mb-8">Before Try.Wepp</p>
                {[
                  ["Company data", "Only captures what already launched — too late."],
                  ["Search trends", "Tracks popularity, not pre-launch intent."],
                  ["No idea layer", "Zero data on the 'idea consideration' stage."],
                ].map(([title, desc]) => (
                  <div key={title} className="mb-8 pb-8" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <p className="text-sm font-bold text-white/30 mb-1 line-through">{title}</p>
                    <p className="text-sm text-white/20">{desc}</p>
                  </div>
                ))}
              </div>
            </FallIn>
            <FallIn delay={100}>
              <div className="p-10" style={{ background: "rgba(99,102,241,0.1)" }}>
                <p className="text-xs font-bold tracking-widest text-indigo-300/70 uppercase mb-8">Try.Wepp captures</p>
                {[
                  ["Founder Intent", "The earliest signal — before a company exists."],
                  ["Pre-founding data", "A category that never existed, now being built."],
                  ["Growing precision", "More submissions = sharper trend signal for all."],
                ].map(([title, desc]) => (
                  <div key={title} className="mb-8 pb-8" style={{ borderBottom: "1px solid rgba(129,140,248,0.15)" }}>
                    <p className="text-sm font-black text-white mb-1">{title}</p>
                    <p className="text-sm text-white/50">{desc}</p>
                  </div>
                ))}
                <p className="text-xs text-white/30">B2B expansion: VCs · accelerators · research institutions</p>
              </div>
            </FallIn>
          </div>
        </div>
      </section>

      {/* ── Features — what you actually get ── */}
      <section className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <FallIn className="mb-20">
            <p className="text-xs font-bold tracking-widest text-white/40 uppercase mb-4">What lands in your hands</p>
            <h2 className="text-[3.5rem] md:text-[6rem] font-black text-white leading-none tracking-tighter">
              Concrete.<br />
              <span style={{ color: "rgba(255,255,255,0.35)" }}>Immediate.</span>
            </h2>
          </FallIn>

          <div className="space-y-0">
            {[
              {
                label: "01 — Submission",
                title: "Your idea enters the system.",
                desc: "Category, target user, description. No account. No public record. What you share stays anonymous — forever.",
                detail: "2 min · Anonymous · No account",
              },
              {
                label: "02 — Insight Report",
                title: "A personal signal, just for you.",
                desc: "Viability score from 0–100. Saturation level: Low / Medium / High. Trend direction: Rising, Stable, or Declining. Delivered in seconds.",
                detail: "Viability · Saturation · Trend",
              },
              {
                label: "03 — Trend Dashboard",
                title: "See where the market is moving.",
                desc: "Real-time aggregated data across 9 categories. Watch which ideas are clustering, which markets are filling up, and where the gaps are.",
                detail: "9 categories · Real-time · Public",
              },
              {
                label: "04 — Quality Filter",
                title: "Signal, not noise.",
                desc: "AI detects duplicates and low-effort submissions. Keeps the trend data accurate. The more quality goes in, the more precision comes out.",
                detail: "AI filter · Spam detection · Accuracy",
              },
            ].map((f, i) => {
              const right = i % 2 === 1;
              return (
                <FallIn key={f.label} delay={i * 60}>
                  <div className="py-10 border-t" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                    <div className={`flex items-center justify-between mb-3 ${right ? "flex-row-reverse" : ""}`}>
                      <p className="text-xs font-bold tracking-widest text-white/25 uppercase">{f.label}</p>
                      <p className="text-xs text-white/20 font-medium tracking-wide">{f.detail}</p>
                    </div>
                    <div className={right ? "text-right" : "text-left"}>
                      <h3 className="text-[2rem] md:text-[3.2rem] font-black text-white leading-tight tracking-tight mb-3">{f.title}</h3>
                      <p className={`text-white/45 text-sm leading-relaxed max-w-2xl ${right ? "ml-auto" : ""}`}>{f.desc}</p>
                    </div>
                  </div>
                </FallIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Final CTA — earth landing ── */}
      <section className="py-40 px-6 relative overflow-hidden">
        {/* Subtle ground texture */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }} />

        <div className="relative max-w-6xl mx-auto text-center">
          <FallIn>
            <p className="text-xs font-bold tracking-widest text-white/40 uppercase mb-6">Your idea. Grounded.</p>
            <h2 className="text-[3.5rem] md:text-[7rem] font-black text-white leading-none tracking-tighter mb-10">
              Land your idea.
            </h2>
            <Link href="/submit"
              className="inline-flex items-center gap-3 font-black text-base px-10 py-5 transition-all duration-200 hover:-translate-y-0.5 mb-16"
              style={{ background: "rgba(255,255,255,0.95)", color: "#0d2040" }}>
              Submit anonymously — free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <div className="flex flex-wrap justify-center gap-x-12 gap-y-4 mt-2">
              {[
                ["Anonymous", "No account. No public record."],
                ["Free", "Always. No paywalls."],
                ["Instant", "Report in seconds."],
                ["Collective", "Your signal helps every founder."],
              ].map(([title, desc]) => (
                <div key={title} className="text-left" style={{ borderLeft: "2px solid rgba(255,255,255,0.15)", paddingLeft: "14px" }}>
                  <p className="text-sm font-black text-white">{title}</p>
                  <p className="text-xs text-white/40 mt-0.5">{desc}</p>
                </div>
              ))}
            </div>
          </FallIn>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" className="w-7 h-7" alt="Try.Wepp" />
            <span className="text-sm font-bold text-white">Try.Wepp</span>
          </Link>
          <p className="text-xs text-white/30">© 2026 Try.Wepp · Anonymous Founder Idea Signals</p>
        </div>
      </footer>
    </div>
  );
}