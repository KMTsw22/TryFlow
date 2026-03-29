import Link from "next/link";
import { ArrowRight, Check, BarChart3, MousePointerClick, Mail, Zap, ShieldCheck, FlaskConical, ChevronRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white font-['Inter']">
      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-sm tracking-tight">TryFlow</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-500 font-medium">
            <Link href="/explore" className="hover:text-gray-900 transition-colors">Experiments</Link>
            <Link href="#" className="hover:text-gray-900 transition-colors">Academy</Link>
            <Link href="/pricing" className="hover:text-gray-900 transition-colors">Pricing</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-1.5">Log in</Link>
            <Link href="/signup" className="bg-gradient-primary text-white text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity" data-testid="nav-get-started">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="bg-gradient-hero pt-20 pb-28 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
              Pre-launch Validation Tool
            </div>
            <h1 className="text-5xl font-extrabold text-gray-900 leading-[1.1] tracking-tight">
              Stop guessing<br />your{" "}
              <span className="text-gradient">pricing</span>
            </h1>
            <p className="mt-5 text-base text-gray-500 leading-relaxed max-w-sm">
              Deploy a validation page in minutes. Measure real clicks, emails, and pricing preferences — before you write a single line of production code.
            </p>
            <div className="flex items-center gap-3 mt-8">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-gradient-primary text-white font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity text-sm"
                data-testid="hero-cta-primary"
              >
                Start for Free <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 border border-gray-200 bg-white text-gray-700 font-semibold px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                See Examples
              </Link>
            </div>
          </div>

          {/* Right — Pricing Card Mockup */}
          <div className="relative flex justify-center">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 w-72 relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-purple-600" />
                </div>
                <span className="text-sm font-semibold text-gray-900">Pro Plan</span>
                <span className="ml-auto text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">Popular</span>
              </div>
              <div className="mb-4">
                <span className="text-4xl font-extrabold text-gray-900">$49</span>
                <span className="text-gray-400 text-sm">/mo</span>
              </div>
              <ul className="space-y-2.5 mb-5">
                {["Unlimited experiments","Advanced analytics","Priority support","Custom integrations"].map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs text-gray-600">
                    <Check className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button className="w-full bg-gradient-primary text-white text-sm font-semibold py-2.5 rounded-lg">
                Get Started
              </button>
            </div>
            {/* Floating badge */}
            <div className="absolute -top-4 -right-4 bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
              +38% Conversion
            </div>
            {/* Blur bg circle */}
            <div className="absolute inset-0 bg-purple-200 rounded-full blur-3xl opacity-20 scale-75" />
          </div>
        </div>
      </section>

      {/* ── Problem Section ── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900">The problem with launching</h2>
          <p className="text-gray-500 mt-3 max-w-lg mx-auto text-sm leading-relaxed">
            Most founders spend months building — only to discover nobody wants it at their price point.
          </p>
          <div className="grid grid-cols-3 gap-6 mt-12">
            {[
              { emoji: "⏳", title: "Months wasted", desc: "Shipping features nobody asked for." },
              { emoji: "💸", title: "Wrong pricing", desc: "Leaving money on the table with bad price points." },
              { emoji: "📉", title: "No real data", desc: "Guessing instead of measuring actual demand." },
            ].map(item => (
              <div key={item.title} className="bg-gray-50 rounded-2xl p-6 text-left border border-gray-100">
                <span className="text-3xl">{item.emoji}</span>
                <h3 className="font-semibold text-gray-900 mt-3 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 px-6 bg-purple-50/60 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <span className="text-[200px] font-black text-purple-100 tracking-tighter">VALIDATE</span>
        </div>
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900">Everything you need to validate</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {[
              { icon: <FlaskConical className="w-5 h-5" />, label: "Fast Checkout Testing",    desc: "A/B test pricing, CTAs, and copy with real users." },
              { icon: <MousePointerClick className="w-5 h-5" />, label: "Click Tracking",       desc: "Every button tagged with data-testid for Analytics." },
              { icon: <Mail className="w-5 h-5" />,             label: "Waitlist Collection",   desc: "Capture emails and validate demand instantly." },
              { icon: <BarChart3 className="w-5 h-5" />,        label: "Variant Analysis",      desc: "See which price or headline resonates most." },
              { icon: <Zap className="w-5 h-5" />,              label: "Ready in Minutes",      desc: "Launch a validation page in under 5 minutes." },
              { icon: <ShieldCheck className="w-5 h-5" />,      label: "Secure & Private",      desc: "GDPR-friendly with full data export." },
            ].map(f => (
              <div key={f.label} className="bg-white rounded-2xl border border-gray-100 p-6 card-shadow hover:card-shadow-md transition-all">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 mb-4">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-gray-900 text-sm mb-1">{f.label}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Validate Before You Build ── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto grid grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-5">validate before you build</h2>
            <ul className="space-y-3">
              {[
                "Launch a fake pricing page in minutes",
                "Collect real email signups from interested users",
                "A/B test price points without writing code",
                "See which features users actually care about",
                "Export all data to CSV anytime",
              ].map(item => (
                <li key={item} className="flex items-start gap-3 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          {/* Dashboard preview */}
          <div className="bg-gray-900 rounded-2xl p-5 text-white">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Weekly Trend</span>
              <span className="text-xs text-purple-400 font-medium">↑ 12.5%</span>
            </div>
            <p className="text-lg font-bold mb-5">Optimization Velocity</p>
            <div className="flex items-end gap-1.5 h-24">
              {[30,45,35,60,50,75,65,85,72,95,88,100].map((h, i) => (
                <div key={i} className="flex-1 rounded-sm" style={{ height: `${h}%`, background: i >= 8 ? '#7C3AED' : '#374151' }} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-16 px-6 bg-gray-50 border-y border-gray-100">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center">
          {[
            { value: "15,000+", label: "Experiments Run" },
            { value: "2.4M",    label: "Users Tested" },
            { value: "89%",     label: "Saved Dev Time" },
          ].map(s => (
            <div key={s.label}>
              <p className="text-4xl font-extrabold text-gray-900">{s.value}</p>
              <p className="text-sm text-gray-500 mt-2 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-24 px-6 bg-gradient-primary">
        <div className="max-w-3xl mx-auto text-center text-white">
          <h2 className="text-4xl font-extrabold leading-tight">Test your idea before you build it</h2>
          <p className="mt-4 text-purple-200 text-base">Join 15,000+ founders who validated their product with TryFlow.</p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 mt-8 bg-white text-purple-700 font-bold px-8 py-4 rounded-xl hover:bg-purple-50 transition-colors text-sm"
            data-testid="bottom-cta"
          >
            Get Started Free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-gradient-primary flex items-center justify-center">
              <Zap className="w-2.5 h-2.5 text-white" />
            </div>
            <span className="font-bold text-gray-700 text-sm">TryFlow</span>
          </div>
          <div className="flex gap-5">
            {["Privacy Policy","Terms of Service","Security","Status"].map(l => (
              <Link key={l} href="#" className="hover:text-gray-600 transition-colors">{l}</Link>
            ))}
          </div>
          <span>© 2024 TryFlow Inc. Crafted for makers.</span>
        </div>
      </footer>
    </div>
  );
}
