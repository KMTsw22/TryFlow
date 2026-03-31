import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  MousePointerClick,
  Zap,
  TrendingUp,
  Shield,
  BrainCircuit,
  Globe,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white font-['Inter']">
      {/* ── Top Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-10">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-teal-500 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold text-gray-900 text-sm">TryFlow</span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              {["Product", "Use Cases", "Resources", "Pricing"].map((item) => (
                <Link
                  key={item}
                  href="#"
                  className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="bg-[#0B1026] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#161f3d] transition-colors"
            >
              Sign up
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="bg-gradient-navy pt-32 pb-24 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div>
            <p className="text-teal-400 text-xs font-semibold tracking-widest uppercase mb-6">
              Pricing intelligence platform for founders
            </p>
            <h1 className="text-4xl md:text-[3.5rem] font-extrabold text-white leading-[1.08] tracking-tight">
              Launch with
              <br />
              the price
              <br />
              users actually
              <br />
              choose.
            </h1>
            <p className="mt-6 text-base text-gray-400 leading-relaxed max-w-md">
              Stop guessing. Use high-fidelity behavior data to validate your
              pricing strategy before you ever push to production.
            </p>
            <div className="flex items-center gap-3 mt-8">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-teal-500 text-white font-semibold px-6 py-3 rounded-lg hover:bg-teal-600 transition-colors text-sm"
              >
                Get started
              </Link>
              <Link
                href="#"
                className="inline-flex items-center gap-2 border border-gray-600 text-gray-300 font-semibold px-6 py-3 rounded-lg hover:border-gray-400 hover:text-white transition-colors text-sm"
              >
                Book a demo
              </Link>
            </div>
          </div>

          {/* Right — Dashboard mockup (tilted overlapping screens) */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-[480px] h-[380px]">
              {/* Back screen (tilted) */}
              <div
                className="absolute top-0 left-0 w-[360px] bg-[#0E1630] rounded-xl border border-white/10 shadow-2xl overflow-hidden"
                style={{ transform: "perspective(1200px) rotateY(-8deg) rotateX(4deg)" }}
              >
                {/* Top bar */}
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-400/60" />
                    <div className="w-2 h-2 rounded-full bg-yellow-400/60" />
                    <div className="w-2 h-2 rounded-full bg-green-400/60" />
                  </div>
                  <div className="flex-1 bg-white/5 rounded h-3 mx-8" />
                </div>
                {/* Sidebar + content */}
                <div className="flex">
                  <div className="w-12 border-r border-white/5 p-2 space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className={`w-full h-1.5 rounded ${i === 1 ? "bg-teal-500/60" : "bg-white/10"}`} />
                    ))}
                  </div>
                  <div className="flex-1 p-4 space-y-3">
                    {/* Mini table rows */}
                    <div className="flex gap-2">
                      <div className="h-2 bg-white/10 rounded flex-[2]" />
                      <div className="h-2 bg-white/10 rounded flex-1" />
                      <div className="h-2 bg-teal-500/30 rounded flex-1" />
                    </div>
                    <div className="flex gap-2">
                      <div className="h-2 bg-white/10 rounded flex-[2]" />
                      <div className="h-2 bg-white/10 rounded flex-1" />
                      <div className="h-2 bg-purple-500/30 rounded flex-1" />
                    </div>
                    <div className="flex gap-2">
                      <div className="h-2 bg-white/10 rounded flex-[2]" />
                      <div className="h-2 bg-white/10 rounded flex-1" />
                      <div className="h-2 bg-teal-500/30 rounded flex-1" />
                    </div>
                    {/* Mini bar chart */}
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

              {/* Front screen (overlapping, tilted) */}
              <div
                className="absolute top-8 left-28 w-[340px] bg-[#131B3A] rounded-xl border border-white/10 shadow-2xl overflow-hidden"
                style={{ transform: "perspective(1200px) rotateY(-5deg) rotateX(2deg)" }}
              >
                {/* Top bar */}
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-400/60" />
                    <div className="w-2 h-2 rounded-full bg-yellow-400/60" />
                    <div className="w-2 h-2 rounded-full bg-green-400/60" />
                  </div>
                </div>
                <div className="p-4">
                  {/* Stats row */}
                  <div className="flex gap-3 mb-4">
                    {[
                      { label: "Visitors", value: "12.4K", color: "text-white" },
                      { label: "Conversions", value: "1,847", color: "text-teal-400" },
                      { label: "Revenue", value: "$48.2K", color: "text-white" },
                    ].map((s) => (
                      <div key={s.label} className="flex-1 bg-white/5 rounded-lg p-2.5">
                        <p className="text-[9px] text-gray-500">{s.label}</p>
                        <p className={`text-xs font-bold ${s.color} mt-0.5`}>{s.value}</p>
                      </div>
                    ))}
                  </div>
                  {/* Line chart */}
                  <div className="relative h-20 mb-3">
                    <svg viewBox="0 0 300 80" className="w-full h-full" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="heroLine" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#a855f7" stopOpacity="0.2" />
                          <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path d="M0,60 C30,55 60,40 90,45 C120,50 150,30 180,25 C210,20 240,15 270,18 L300,12 L300,80 L0,80Z" fill="url(#heroLine)" />
                      <path d="M0,60 C30,55 60,40 90,45 C120,50 150,30 180,25 C210,20 240,15 270,18 L300,12" fill="none" stroke="#a855f7" strokeWidth="2" />
                      <path d="M0,50 C30,48 60,52 90,35 C120,18 150,22 180,15 C210,10 240,12 270,8 L300,5" fill="none" stroke="#14B8A6" strokeWidth="2" />
                    </svg>
                  </div>
                  {/* Toggle pills */}
                  <div className="flex gap-2">
                    {["7D", "30D", "90D", "1Y"].map((p, i) => (
                      <span key={p} className={`text-[9px] px-2.5 py-1 rounded-full ${i === 1 ? "bg-teal-500/20 text-teal-400" : "bg-white/5 text-gray-500"}`}>
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating +18.4% card */}
              <div className="absolute bottom-4 left-4 bg-white rounded-xl shadow-lg px-4 py-3 z-10">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-teal-500 flex items-center justify-center">
                    <TrendingUp className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-medium">Conversion Lift</p>
                    <p className="text-base font-bold text-gray-900">+18.4%</p>
                  </div>
                </div>
                <p className="text-[9px] text-gray-400 mt-1">Confidence above 99.2%</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Logo Bar ── */}
      <section className="py-10 px-6 border-b border-gray-100 bg-gray-50/50">
        <div className="max-w-5xl mx-auto flex items-center justify-center gap-12 md:gap-16 flex-wrap">
          {["Stripe", "Revolut", "Vercel", "Linear", "Optimizely"].map(
            (name) => (
              <span
                key={name}
                className="text-sm font-semibold text-gray-300 tracking-wide uppercase"
              >
                {name}
              </span>
            )
          )}
        </div>
      </section>

      {/* ── Feature 1: Fake Checkout Testing ── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left — Text */}
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">
              Fake Checkout
              <br />
              Testing
            </h2>
            <p className="mt-5 text-base text-gray-500 leading-relaxed max-w-md">
              Create high-fidelity checkout simulations. Measure intent before a
              single line of backend billing code. Users select a plan and
              enter info — all on safe, non-billing pages.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Customizable templates",
                "Real-time tracking data",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2.5 text-sm text-gray-600"
                >
                  <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Right — Phone mockup */}
          <div className="flex justify-center">
            <div className="bg-gray-900 rounded-[2rem] p-3 shadow-2xl w-[260px]">
              <div className="bg-white rounded-[1.5rem] overflow-hidden">
                <div className="bg-gray-50 px-5 pt-6 pb-4">
                  <p className="text-xs font-semibold text-gray-900">
                    Checkout
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Select your plan
                  </p>
                </div>
                <div className="px-4 py-3 space-y-2">
                  {[
                    { name: "Basic", price: "$9/mo", active: false },
                    { name: "Pro", price: "$29/mo", active: true },
                    { name: "Enterprise", price: "$99/mo", active: false },
                  ].map((plan) => (
                    <div
                      key={plan.name}
                      className={`rounded-xl border p-3 text-xs ${
                        plan.active
                          ? "border-teal-400 bg-teal-50"
                          : "border-gray-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-900">
                          {plan.name}
                        </span>
                        <span
                          className={
                            plan.active
                              ? "text-teal-600 font-bold"
                              : "text-gray-500"
                          }
                        >
                          {plan.price}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 pb-5 pt-2">
                  <div className="bg-teal-500 text-white text-xs font-semibold text-center py-2.5 rounded-lg">
                    Continue to Payment
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature 2: Pricing Experiments ── */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left — Dashboard mockup */}
          <div className="flex justify-center order-2 lg:order-1">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 w-full max-w-[420px]">
              <div className="flex items-center justify-between mb-5">
                <span className="text-sm font-semibold text-gray-900">
                  Experiment: Pricing A/B
                </span>
                <span className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-medium">
                  Running
                </span>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Plan A — $19/mo", pct: 34 },
                  { label: "Plan B — $29/mo", pct: 52 },
                  { label: "Plan C — $49/mo", pct: 14 },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-600">{item.label}</span>
                      <span className="font-semibold text-gray-900">
                        {item.pct}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${item.pct}%`,
                          background:
                            item.pct > 40
                              ? "linear-gradient(90deg, #0D9488, #14B8A6)"
                              : "#d1d5db",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                <span>1,284 total responses</span>
                <span className="text-teal-600 font-semibold">
                  View full report
                </span>
              </div>
            </div>
          </div>

          {/* Right — Text */}
          <div className="order-1 lg:order-2">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">
              Pricing
              <br />
              Experiments
            </h2>
            <p className="mt-5 text-base text-gray-500 leading-relaxed max-w-md">
              A/B test different price points, models, or usage tiers.
              TryFlow manages the traffic split and tracks every user
              interaction to find the best option.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 mt-6 text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors"
            >
              Start an experiment <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Feature 3: Decision Recommendations ── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left — Text */}
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">
              Decision
              <br />
              Recommendations
            </h2>
            <p className="mt-5 text-base text-gray-500 leading-relaxed max-w-md">
              We analyze conversion signals to predict which price point
              maximizes revenue or signups. Data-backed recommendations, so
              you can skip the guessing game.
            </p>
            <div className="mt-6 inline-flex items-baseline gap-1 bg-gray-900 text-white rounded-xl px-5 py-3">
              <span className="text-2xl font-extrabold">$29</span>
              <span className="text-xs text-gray-400">/mo recommended</span>
            </div>
          </div>

          {/* Right — Analytics chart mockup */}
          <div className="flex justify-center">
            <div className="bg-[#0B1026] rounded-2xl p-6 w-full max-w-[420px] shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-medium text-gray-400">
                  Revenue Projection
                </span>
                <BarChart3 className="w-4 h-4 text-teal-400" />
              </div>
              {/* Mock line chart */}
              <div className="relative h-40 flex items-end">
                <svg
                  viewBox="0 0 400 150"
                  className="w-full h-full"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient
                      id="chartGrad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.3" />
                      <stop
                        offset="100%"
                        stopColor="#14B8A6"
                        stopOpacity="0"
                      />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0,120 C40,110 80,100 120,80 C160,60 200,70 240,45 C280,20 320,30 360,10 L400,5 L400,150 L0,150Z"
                    fill="url(#chartGrad)"
                  />
                  <path
                    d="M0,120 C40,110 80,100 120,80 C160,60 200,70 240,45 C280,20 320,30 360,10 L400,5"
                    fill="none"
                    stroke="#14B8A6"
                    strokeWidth="2.5"
                  />
                </svg>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                <span>Week 1</span>
                <span>Week 4</span>
                <span>Week 8</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Conversion Confidence CTA ── */}
      <section className="bg-gradient-navy py-24 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">
            Conversion confidence.
            <br />
            Behavior-based validation.
          </h2>
          <p className="mt-4 text-gray-400 text-base max-w-xl mx-auto">
            Skip the guesswork of surveys. Measure what users actually do when
            they&apos;re asked to pay.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-14">
            {[
              {
                icon: <Zap className="w-6 h-6" />,
                color: "bg-blue-500",
                title: "Zero Implementation",
                desc: "Create testing experiments at your pace. No coding required.",
              },
              {
                icon: <Shield className="w-6 h-6" />,
                color: "bg-purple-500",
                title: "99% Confidence",
                desc: "Statistical significance before you make any big decisions.",
              },
              {
                icon: <BrainCircuit className="w-6 h-6" />,
                color: "bg-teal-500",
                title: "Behavior Modeling",
                desc: "Map customers and optimize for long-term revenue growth.",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-left"
              >
                <div
                  className={`w-11 h-11 ${card.color} rounded-xl flex items-center justify-center text-white mb-4`}
                >
                  {card.icon}
                </div>
                <h3 className="font-bold text-white text-base mb-2">
                  {card.title}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Designed for Precision ── */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-16">
            Designed for precision.
          </h2>
          {/* iMac-style mockup */}
          <div className="relative mx-auto max-w-3xl">
            <div className="bg-gray-900 rounded-2xl p-4 pt-8 shadow-2xl">
              {/* Screen dots */}
              <div className="absolute top-3 left-7 flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
              </div>
              {/* Screen content — world map placeholder */}
              <div className="bg-[#0E1630] rounded-lg overflow-hidden p-8 min-h-[300px] flex items-center justify-center">
                <div className="text-center">
                  <Globe className="w-16 h-16 text-teal-500/40 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm">
                    Global pricing intelligence dashboard
                  </p>
                  <div className="flex items-center justify-center gap-8 mt-6">
                    {[
                      { label: "Countries", value: "42" },
                      { label: "Experiments", value: "1.2K" },
                      { label: "Data Points", value: "3.4M" },
                    ].map((stat) => (
                      <div key={stat.label}>
                        <p className="text-xl font-bold text-white">
                          {stat.value}
                        </p>
                        <p className="text-xs text-gray-500">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {/* Stand */}
            <div className="mx-auto w-24 h-6 bg-gray-300 rounded-b-lg" />
            <div className="mx-auto w-40 h-2 bg-gray-200 rounded-b-xl" />
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="bg-gradient-cta-green py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">
            Start your first pricing experiment.
          </h2>
          <p className="mt-4 text-teal-100 text-sm">
            Free 14-day trial. No credit card required.
          </p>
          <div className="flex items-center justify-center gap-4 mt-8">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-white text-teal-700 font-bold px-8 py-4 rounded-xl hover:bg-teal-50 transition-colors text-sm"
            >
              Get Started Free
            </Link>
            <Link
              href="#"
              className="inline-flex items-center gap-2 border border-white/40 text-white font-semibold px-8 py-4 rounded-xl hover:bg-white/10 transition-colors text-sm"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#0B1026] py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-teal-500 flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-bold text-white text-sm">TryFlow</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Pricing intelligence
                <br />
                for modern teams.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Product
              </h4>
              <ul className="space-y-2.5">
                {["Features", "Pricing", "Integrations", "Changelog"].map(
                  (item) => (
                    <li key={item}>
                      <Link
                        href="#"
                        className="text-sm text-gray-500 hover:text-white transition-colors"
                      >
                        {item}
                      </Link>
                    </li>
                  )
                )}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Resources
              </h4>
              <ul className="space-y-2.5">
                {["Documentation", "Blog", "Case Studies", "API"].map(
                  (item) => (
                    <li key={item}>
                      <Link
                        href="#"
                        className="text-sm text-gray-500 hover:text-white transition-colors"
                      >
                        {item}
                      </Link>
                    </li>
                  )
                )}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Support
              </h4>
              <ul className="space-y-2.5">
                {["Help Center", "Contact", "Privacy Policy", "Terms"].map(
                  (item) => (
                    <li key={item}>
                      <Link
                        href="#"
                        className="text-sm text-gray-500 hover:text-white transition-colors"
                      >
                        {item}
                      </Link>
                    </li>
                  )
                )}
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/10 flex items-center justify-between text-xs text-gray-600">
            <span>&copy; 2026 TryFlow Inc. All rights reserved.</span>
            <div className="flex gap-4">
              <Link href="#" className="hover:text-gray-400 transition-colors">
                Privacy
              </Link>
              <Link href="#" className="hover:text-gray-400 transition-colors">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
