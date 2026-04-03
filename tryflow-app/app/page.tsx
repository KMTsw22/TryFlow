"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  MessageSquare,
  Star,
  Zap,
  Users,
  Sparkles,
  ChevronRight,
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

function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const [ref, inView] = useInView();
  return (
    <div ref={ref} className={className} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? "none" : "translateY(20px)",
      transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
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
        background: scrolled ? "rgba(255,255,255,0.98)" : "rgba(255,255,255,0.92)",
        backdropFilter: "blur(14px)",
        borderBottom: scrolled ? "1px solid #f0f0f0" : "1px solid transparent",
        boxShadow: scrolled ? "0 1px 16px rgba(0,0,0,0.06)" : "none",
      }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-[60px]">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <img src="/logo.png" className="w-7 h-7" alt="Try.Wepp" />
              <span className="font-bold text-gray-900 text-sm tracking-tight">Try.Wepp</span>
            </Link>
            <Link href="/explore" className="text-sm text-gray-500 hover:text-gray-900 transition-colors duration-150">
              Explore
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900 transition-colors px-3 py-2">
              Log in
            </Link>
            <Link href="/signup" className="bg-[#0B1026] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#161f3d] transition-all duration-150 hover:shadow-md">
              Start free →
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="bg-gradient-navy pt-28 pb-24 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center min-h-[540px]">

          {/* Left — Copy */}
          <div>
            <div
              className="inline-flex items-center gap-2 border border-teal-500/30 bg-teal-500/10 text-teal-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-8"
              style={{ animation: "fadeInUp 0.5s ease 0.1s both" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              Builder feedback exchange
            </div>

            <h1 className="text-[3rem] md:text-[3.75rem] font-extrabold text-white leading-[1.06] tracking-tight">
              <span style={{ animation: "fadeInUp 0.55s ease 0.2s both", display: "block" }}>Get real feedback</span>
              <span style={{ animation: "fadeInUp 0.55s ease 0.32s both", display: "block" }}>before you</span>
              <span className="text-gradient" style={{ animation: "fadeInUp 0.55s ease 0.44s both", display: "block" }}>launch.</span>
            </h1>

            <p className="mt-7 text-[15px] text-gray-400 leading-relaxed max-w-[420px]"
              style={{ animation: "fadeInUp 0.55s ease 0.58s both" }}>
              Share your project. Try other builders&apos; products. Leave feedback, earn credits, and use them to get feedback on your own project.
            </p>

            <div className="flex flex-wrap items-center gap-3 mt-9"
              style={{ animation: "fadeInUp 0.55s ease 0.72s both" }}>
              <Link href="/explore" className="inline-flex items-center gap-2 bg-teal-500 text-white font-semibold px-6 py-3 rounded-lg text-sm hover:bg-teal-400 transition-all duration-150 hover:shadow-lg hover:shadow-teal-500/30 hover:-translate-y-px">
                Explore projects <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/signup" className="inline-flex items-center gap-2 border border-white/15 text-gray-300 font-medium px-6 py-3 rounded-lg text-sm hover:border-white/35 hover:text-white hover:bg-white/5 transition-all duration-150">
                Start free
              </Link>
            </div>

            <p className="mt-5 text-xs text-gray-700" style={{ animation: "fadeInUp 0.5s ease 0.86s both" }}>
              Free to join · No credit card required
            </p>
          </div>

          {/* Right — Product mockup */}
          <div className="relative flex justify-center lg:justify-end" style={{ animation: "fadeIn 0.7s ease 0.35s both" }}>
            <div className="relative w-[500px] h-[420px]">

              {/* Back card — project listing */}
              <div
                className="absolute top-0 left-0 w-[300px] bg-white rounded-2xl border border-gray-200 shadow-2xl p-4 overflow-hidden"
                style={{ transform: "perspective(1200px) rotateY(-8deg) rotateX(4deg)", animation: "fadeInUp 0.6s ease 0.5s both" }}
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center text-base shrink-0">⚡</div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 leading-tight">FlowBase</p>
                    <p className="text-[10px] text-gray-400">by @alex_builds</p>
                  </div>
                  <span className="ml-auto text-[9px] bg-green-50 text-green-600 font-semibold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-green-500" />Live
                  </span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed mb-3">A no-code workflow builder for indie makers. Automate your stack without writing code.</p>
                <div className="flex items-center gap-3 text-[10px] text-gray-400 mb-3">
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />2.4K</span>
                  <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />18 reviews</span>
                  <span className="bg-violet-50 text-violet-600 font-semibold px-1.5 py-0.5 rounded">SaaS</span>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 py-1.5 rounded-lg bg-gray-900 text-white text-[10px] font-semibold text-center">Try it</div>
                  <div className="flex-1 py-1.5 rounded-lg bg-violet-50 text-violet-700 text-[10px] font-semibold text-center">Give feedback</div>
                </div>
              </div>

              {/* Front card — feedback thread */}
              <div
                className="absolute top-10 left-32 w-[310px] bg-white rounded-2xl border border-gray-200 shadow-2xl p-4 overflow-hidden"
                style={{ animation: "floatSlow 5s ease-in-out infinite, fadeInUp 0.65s ease 0.68s both" }}
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-gray-900">Feedback · FlowBase</p>
                  <span className="text-[9px] bg-teal-50 text-teal-600 font-semibold px-2 py-0.5 rounded-full">3 new</span>
                </div>
                <div className="space-y-2.5">
                  {[
                    { initials: "MK", text: "Love the onboarding! Step 3 is a bit confusing.", time: "2m ago", color: "bg-teal-500" },
                    { initials: "JL", text: "Would 100% pay for this. Missing mobile view.", time: "5m ago", color: "bg-violet-500" },
                    { initials: "SR", text: "Dashboard feels cluttered but the idea is great.", time: "12m ago", color: "bg-orange-500" },
                  ].map((c) => (
                    <div key={c.initials} className="flex items-start gap-2">
                      <div className={`w-6 h-6 rounded-full ${c.color} flex items-center justify-center text-white text-[9px] font-bold shrink-0`}>
                        {c.initials}
                      </div>
                      <div className="flex-1 bg-gray-50 rounded-xl px-2.5 py-2">
                        <p className="text-[10px] text-gray-700 leading-snug">{c.text}</p>
                        <p className="text-[9px] text-gray-400 mt-0.5">{c.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating credit badge */}
              <div
                className="absolute bottom-2 left-0 bg-white rounded-2xl shadow-xl px-4 py-3 z-10 border border-gray-100"
                style={{ animation: "fadeInUp 0.6s ease 0.9s both" }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-base">🪙</div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-medium">Credits earned</p>
                    <p className="text-lg font-extrabold text-gray-900 leading-tight">+2 credits</p>
                  </div>
                </div>
                <p className="text-[9px] text-gray-400 mt-1.5 border-t border-gray-100 pt-1.5">For reviewing FlowBase · Use to get feedback</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Logo bar ── */}
      <section className="py-9 px-6 border-b border-gray-100">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-5">Builders from</p>
          <div className="flex items-center justify-center gap-10 md:gap-16 flex-wrap">
            {["Product Hunt", "Y Combinator", "Indie Hackers", "Buildspace", "Peerlist"].map((name) => (
              <span key={name} className="text-sm font-semibold text-gray-200 tracking-wide">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-28 px-6 bg-[#FAFAFA]">
        <div className="max-w-5xl mx-auto text-center">
          <FadeUp>
            <p className="text-xs font-semibold text-teal-600 uppercase tracking-widest mb-4">How it works</p>
          </FadeUp>
          <FadeUp delay={70}>
            <h2 className="text-3xl md:text-[2.6rem] font-extrabold text-gray-900 leading-tight tracking-tight mb-14">
              Builders helping builders.
            </h2>
          </FadeUp>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: "🚀",
                title: "Submit your project",
                desc: "Create a listing for your product — an app, a website, a tool, or just an idea. Share it with the community.",
                color: "bg-teal-50 border-teal-100",
                num: "text-teal-500",
              },
              {
                step: "02",
                icon: "🔍",
                title: "Try & review others",
                desc: "Explore projects from other builders. Try them out, leave honest feedback, and earn credits for every review.",
                color: "bg-violet-50 border-violet-100",
                num: "text-violet-500",
              },
              {
                step: "03",
                icon: "🪙",
                title: "Use credits, get feedback",
                desc: "Spend the credits you earned to receive quality feedback on your own project. Improve before launch.",
                color: "bg-amber-50 border-amber-100",
                num: "text-amber-500",
              },
            ].map((item, i) => (
              <FadeUp key={item.step} delay={i * 100}>
                <div className={`rounded-2xl border ${item.color} p-6 text-left`}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl">{item.icon}</span>
                    <span className={`text-xs font-extrabold ${item.num} uppercase tracking-widest`}>{item.step}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-base mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature 1: Explore early products ── */}
      <section className="py-28 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div>
            <FadeUp>
              <p className="text-xs font-semibold text-teal-600 uppercase tracking-widest mb-4">Explore</p>
            </FadeUp>
            <FadeUp delay={70}>
              <h2 className="text-3xl md:text-[2.6rem] font-extrabold text-gray-900 leading-[1.1] tracking-tight">
                Discover products<br />before anyone else.
              </h2>
            </FadeUp>
            <FadeUp delay={140}>
              <p className="mt-5 text-[15px] text-gray-500 leading-relaxed max-w-[420px]">
                Browse early-stage products from real builders. Try them out, leave honest feedback, and help makers improve before their public launch.
              </p>
            </FadeUp>
            <ul className="mt-8 space-y-4">
              {[
                { text: "New projects added daily", sub: "SaaS, apps, tools, and more" },
                { text: "Filter by category", sub: "Find products relevant to you" },
                { text: "Leave structured feedback", sub: "Help builders improve faster" },
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
            <FadeUp delay={420}>
              <Link href="/explore" className="inline-flex items-center gap-1.5 mt-8 text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors group">
                Browse all projects <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </FadeUp>
          </div>

          {/* Right — project card stack */}
          <FadeUp delay={80} className="flex justify-center">
            <div className="space-y-3 w-full max-w-[360px]">
              {[
                { emoji: "⚡", name: "FlowBase", maker: "@alex", cat: "SaaS", catColor: "bg-violet-100 text-violet-700", views: "2.4K", reviews: 18, desc: "No-code workflow automation for indie makers." },
                { emoji: "📱", name: "Nestly", maker: "@ji_woo", cat: "Consumer", catColor: "bg-blue-100 text-blue-700", views: "1.1K", reviews: 9, desc: "Find and save your next apartment with AI search." },
                { emoji: "🛠️", name: "DevDeck", maker: "@sam_builds", cat: "Dev Tools", catColor: "bg-slate-100 text-slate-700", views: "834", reviews: 14, desc: "Terminal dashboard for monitoring your side projects." },
              ].map((p, i) => (
                <div key={p.name} style={{ opacity: 1 - i * 0.08, transform: `scale(${1 - i * 0.02})` }}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl ${p.catColor.split(" ")[0]} flex items-center justify-center text-base shrink-0`}>{p.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-gray-900">{p.name}</p>
                        <span className="text-[9px] bg-green-50 text-green-600 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-green-500" />Live
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5">by {p.maker}</p>
                      <p className="text-xs text-gray-500 mt-1.5 line-clamp-1">{p.desc}</p>
                      <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-400">
                        <span>{p.views} views</span>
                        <span>{p.reviews} reviews</span>
                        <span className={`${p.catColor} font-semibold px-1.5 py-0.5 rounded text-[9px]`}>{p.cat}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── Feature 2: Earn credits ── */}
      <section className="py-28 px-6 bg-[#FAFAFA]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">

          {/* Left — credit mockup */}
          <FadeUp className="flex justify-center order-2 lg:order-1">
            <div className="w-full max-w-[400px] space-y-4">
              {/* Credit balance */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Your Credits</p>
                  <span className="text-[10px] bg-teal-50 text-teal-700 font-semibold px-2 py-0.5 rounded-full">Updated live</span>
                </div>
                <div className="flex items-end gap-2 mb-4">
                  <p className="text-4xl font-extrabold text-gray-900">12</p>
                  <p className="text-sm text-gray-400 mb-1">credits available</p>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                  <div className="h-2 rounded-full bg-gradient-to-r from-teal-400 to-teal-600" style={{ width: "60%" }} />
                </div>
                <p className="text-[10px] text-gray-400">8 more to unlock Premium feedback slot</p>
              </div>

              {/* Recent activity */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Recent activity</p>
                <div className="space-y-3">
                  {[
                    { action: "Reviewed FlowBase", credit: "+2", color: "text-teal-600 bg-teal-50", time: "2m ago" },
                    { action: "Reviewed Nestly", credit: "+2", color: "text-teal-600 bg-teal-50", time: "1h ago" },
                    { action: "Used credits for feedback", credit: "-5", color: "text-red-500 bg-red-50", time: "3h ago" },
                    { action: "Reviewed DevDeck", credit: "+2", color: "text-teal-600 bg-teal-50", time: "1d ago" },
                  ].map((a) => (
                    <div key={a.action + a.time} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${a.credit.startsWith("+") ? "bg-teal-400" : "bg-red-400"}`} />
                        <p className="text-xs text-gray-700">{a.action}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${a.color}`}>{a.credit}</span>
                        <span className="text-[10px] text-gray-400">{a.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </FadeUp>

          {/* Right — Copy */}
          <div className="order-1 lg:order-2">
            <FadeUp>
              <p className="text-xs font-semibold text-teal-600 uppercase tracking-widest mb-4">Credits</p>
            </FadeUp>
            <FadeUp delay={70}>
              <h2 className="text-3xl md:text-[2.6rem] font-extrabold text-gray-900 leading-[1.1] tracking-tight">
                Give feedback.<br />Earn credits.
              </h2>
            </FadeUp>
            <FadeUp delay={140}>
              <p className="mt-5 text-[15px] text-gray-500 leading-relaxed max-w-[420px]">
                Every review you leave earns you credits. Use those credits to unlock feedback on your own project from the community.
              </p>
            </FadeUp>
            <ul className="mt-8 space-y-4">
              {[
                { text: "Earn 2 credits per review", sub: "Quality reviews earn bonus credits" },
                { text: "Spend credits to receive feedback", sub: "Get real input from fellow builders" },
                { text: "Credits never expire", sub: "Save up for your next project" },
              ].map((item, i) => (
                <FadeUp key={item.text} delay={210 + i * 70}>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center mt-0.5 shrink-0">
                      <Star className="w-3 h-3 text-amber-500" />
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
        </div>
      </section>

      {/* ── Feature 3: Get feedback on your project ── */}
      <section className="py-28 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div>
            <FadeUp>
              <p className="text-xs font-semibold text-teal-600 uppercase tracking-widest mb-4">For builders</p>
            </FadeUp>
            <FadeUp delay={70}>
              <h2 className="text-3xl md:text-[2.6rem] font-extrabold text-gray-900 leading-[1.1] tracking-tight">
                Share your project.<br />Improve before launch.
              </h2>
            </FadeUp>
            <FadeUp delay={140}>
              <p className="mt-5 text-[15px] text-gray-500 leading-relaxed max-w-[420px]">
                Get honest, structured feedback from real builders who understand what it's like to be pre-launch. Fix real problems before you go public.
              </p>
            </FadeUp>
            <FadeUp delay={210}>
              <div className="mt-8 inline-flex items-center gap-3 bg-gray-900 text-white rounded-2xl px-5 py-4">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Average response time</p>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-2xl font-extrabold">4h</span>
                    <span className="text-xs text-gray-400">from first feedback</span>
                  </div>
                </div>
              </div>
            </FadeUp>
          </div>

          {/* Right — feedback received mockup */}
          <FadeUp delay={80} className="flex justify-center">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 w-full max-w-[420px]">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">Your project</p>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">My SaaS App · v1</p>
                </div>
                <span className="text-xs bg-teal-50 text-teal-700 px-2.5 py-1 rounded-full font-semibold border border-teal-100">
                  ● Accepting feedback
                </span>
              </div>
              <div className="space-y-3">
                {[
                  { initials: "AK", label: "Onboarding", text: "The signup flow is confusing. Too many steps.", rating: 3, color: "bg-violet-500" },
                  { initials: "MJ", label: "UI / Design", text: "Looks clean! The dashboard needs better hierarchy.", rating: 4, color: "bg-teal-500" },
                  { initials: "PL", label: "Core value", text: "Love the idea. Would pay $29/mo for this easily.", rating: 5, color: "bg-orange-500" },
                ].map((fb) => (
                  <div key={fb.initials} className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full ${fb.color} flex items-center justify-center text-white text-[9px] font-bold`}>{fb.initials}</div>
                        <span className="text-[10px] font-semibold text-gray-500">{fb.label}</span>
                      </div>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-2.5 h-2.5 ${i < fb.rating ? "text-amber-400 fill-amber-400" : "text-gray-200"}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 leading-snug">{fb.text}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                <span>3 feedbacks received · 5 credits used</span>
                <span className="text-teal-600 font-semibold cursor-pointer">View all</span>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── Why Try.Wepp ── */}
      <section className="bg-gradient-navy py-28 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <FadeUp>
            <p className="text-xs font-semibold text-teal-400 uppercase tracking-widest mb-4">Why Try.Wepp</p>
          </FadeUp>
          <FadeUp delay={70}>
            <h2 className="text-3xl md:text-[2.6rem] font-extrabold text-white leading-tight tracking-tight">
              Built for builders,<br />by builders.
            </h2>
          </FadeUp>
          <FadeUp delay={140}>
            <p className="mt-4 text-gray-400 text-[15px] max-w-xl mx-auto leading-relaxed">
              Stop launching blind. Get real feedback from people who actually build products.
            </p>
          </FadeUp>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-14">
            {[
              {
                icon: <Zap className="w-5 h-5" />,
                color: "bg-blue-500",
                title: "Pre-launch ready",
                desc: "Share your product before it's finished. Get input while it still matters — before you're locked in.",
              },
              {
                icon: <Users className="w-5 h-5" />,
                color: "bg-teal-500",
                title: "Real builder feedback",
                desc: "Reviews from people who build things. Not generic responses — structured, honest, specific.",
              },
              {
                icon: <Sparkles className="w-5 h-5" />,
                color: "bg-purple-500",
                title: "Community loop",
                desc: "The more you give, the more you get. Credits create a healthy feedback exchange that benefits everyone.",
              },
            ].map((card, i) => (
              <FadeUp key={card.title} delay={80 + i * 90}>
                <div className="bg-white/[0.04] border border-white/8 rounded-2xl p-6 text-left hover:bg-white/[0.07] hover:border-white/15 transition-all duration-200 group cursor-default h-full">
                  <div className={`w-10 h-10 ${card.color} rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-105 transition-transform duration-200`}>
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

      {/* ── Social proof / activity ── */}
      <section className="py-28 px-6 bg-[#FAFAFA]">
        <div className="max-w-5xl mx-auto text-center">
          <FadeUp>
            <p className="text-xs font-semibold text-teal-600 uppercase tracking-widest mb-4">Community</p>
          </FadeUp>
          <FadeUp delay={70}>
            <h2 className="text-3xl md:text-[2.6rem] font-extrabold text-gray-900 tracking-tight mb-14">
              A platform builders trust.
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
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {[
                      { label: "Projects", value: "1,284", sub: "Listed & active" },
                      { label: "Reviews given", value: "8.4K", sub: "Real builder feedback" },
                      { label: "Credits exchanged", value: "42K", sub: "All time" },
                    ].map((s) => (
                      <div key={s.label} className="bg-white/5 rounded-xl p-4 border border-white/5 text-left">
                        <p className="text-xl font-extrabold text-white">{s.value}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                        <p className="text-[10px] text-teal-500 mt-1">{s.sub}</p>
                      </div>
                    ))}
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-3">Top categories</p>
                    <div className="space-y-2.5">
                      {[
                        { name: "SaaS tools", pct: 42, emoji: "⚡" },
                        { name: "Consumer apps", pct: 28, emoji: "📱" },
                        { name: "Dev Tools", pct: 18, emoji: "🛠️" },
                        { name: "Education", pct: 12, emoji: "📚" },
                      ].map((c) => (
                        <div key={c.name} className="flex items-center gap-3">
                          <span className="text-sm">{c.emoji}</span>
                          <span className="text-xs text-gray-400 w-28">{c.name}</span>
                          <div className="flex-1 bg-white/5 rounded-full h-1.5">
                            <div className="h-1.5 rounded-full bg-teal-500/60" style={{ width: `${c.pct}%` }} />
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

      {/* ── Final CTA ── */}
      <section className="bg-gradient-cta-green py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <FadeUp>
            <h2 className="text-3xl md:text-[2.6rem] font-extrabold text-white leading-tight tracking-tight">
              Join the builder community.<br />Get feedback before launch.
            </h2>
          </FadeUp>
          <FadeUp delay={80}>
            <p className="mt-4 text-teal-100/80 text-sm">
              Free to join · Earn credits immediately · No credit card required
            </p>
          </FadeUp>
          <FadeUp delay={180}>
            <div className="flex flex-wrap items-center justify-center gap-4 mt-9">
              <Link href="/signup" className="inline-flex items-center gap-2 bg-white text-teal-700 font-bold px-8 py-4 rounded-xl hover:bg-teal-50 transition-all duration-150 hover:shadow-xl hover:-translate-y-px text-sm">
                Start free <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/explore" className="inline-flex items-center gap-2 border border-white/30 text-white font-semibold px-8 py-4 rounded-xl hover:bg-white/10 transition-all duration-150 text-sm">
                Explore projects
              </Link>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#0B1026] py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src="/logo.png" className="w-7 h-7" alt="Try.Wepp" />
                <span className="font-bold text-white text-sm">Try.Wepp</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Feedback exchange<br />for builders.
              </p>
            </div>
            {[
              { title: "Product", items: ["Explore", "How it works", "Credits", "Changelog"] },
              { title: "Community", items: ["Submit a project", "Give feedback", "Leaderboard", "Blog"] },
              { title: "Support", items: ["Contact", "Privacy Policy", "Terms", "Status"] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.items.map((item) => (
                    <li key={item}>
                      <Link href="#" className="text-sm text-gray-500 hover:text-white transition-colors duration-150">{item}</Link>
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