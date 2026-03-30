import Link from "next/link";
import { ArrowRight, Check, BarChart3, MousePointerClick, Mail, Zap, MessageSquare, Rocket } from "lucide-react";
// Zap used in hero mockup and footer
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const { count: liveCount } = await supabase
    .from("experiments")
    .select("*", { count: "exact", head: true })
    .eq("status", "RUNNING");
  const projectCount = liveCount ?? 0;

  return (
    <div className="min-h-screen bg-white font-['Inter']">
      {/* ── Hero ── */}
      <section className="bg-gradient-hero pt-16 pb-20 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
              Pre-launch market validation playground
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-[1.1] tracking-tight">
              See real reactions<br />
              <span className="text-gradient">before you build</span>
            </h1>
            <p className="mt-5 text-base text-gray-500 leading-relaxed max-w-sm">
              Launch a fake pricing page in minutes. Collect clicks, emails, and comments from real users — before writing a single line of production code.
            </p>
            <div className="flex items-center gap-3 mt-8">
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 bg-gradient-primary text-white font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity text-sm"
                data-testid="hero-cta-explore"
              >
                Explore Projects <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 border border-gray-200 bg-white text-gray-700 font-semibold px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                Submit My Idea
              </Link>
            </div>
          </div>

          {/* Right — Product mockup card */}
          <div className="relative flex justify-center">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-5 w-80 relative z-10 border-t-2 border-t-violet-400">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold bg-violet-100 text-violet-700 border border-violet-200 px-2.5 py-1 rounded-full">⚡ SaaS</span>
                <span className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />Live
                </span>
              </div>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center text-base shrink-0">⚡</div>
                <div>
                  <p className="text-sm font-bold text-gray-900">LaunchKit</p>
                  <p className="text-xs text-gray-400">Alex R. · Indie Maker</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                Ship your SaaS idea in a weekend. Templates, payments, and auth — pre-configured.
              </p>
              <div className="flex gap-2 mb-4">
                {[{n:"Free",p:"Free"},{n:"Pro",p:"$12"},{n:"Team",p:"$29"}].map((t, i) => (
                  <div key={t.n} className={`flex-1 rounded-lg border text-center py-1.5 text-xs font-semibold ${i === 1 ? "border-violet-300 bg-violet-50 text-violet-700" : "border-gray-200 text-gray-500"}`}>
                    <p className="text-[10px] text-gray-400 font-normal">{t.n}</p>
                    <p>{t.p}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-100 pt-3">
                <span className="flex items-center gap-1"><span>👥</span> {projectCount > 0 ? `${projectCount * 47 + 182}` : "182"} visitors</span>
                <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> 8 feedbacks</span>
              </div>
            </div>
            <div className="absolute -top-3 -right-3 bg-violet-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
              42% picked Pro
            </div>
            <div className="absolute inset-0 bg-violet-200 rounded-full blur-3xl opacity-20 scale-75" />
          </div>
        </div>
      </section>

      {/* ── Explore CTA Banner ── */}
      {projectCount > 0 && (
      <section className="py-12 px-6 bg-purple-50 border-y border-purple-100">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {projectCount} project{projectCount !== 1 ? "s" : ""} live right now
            </h2>
            <p className="text-gray-500 text-sm mt-1">Try them out and leave feedback — help shape what gets built next.</p>
          </div>
          <Link
            href="/explore"
            className="shrink-0 inline-flex items-center gap-2 bg-gradient-primary text-white font-semibold px-7 py-3.5 rounded-xl hover:opacity-90 transition-opacity text-sm whitespace-nowrap"
          >
            Browse All Projects <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
      )}

      {/* ── Two Journeys ── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Who is try.wepp for?</h2>
            <p className="text-gray-500 mt-3 text-sm">Both explorers and builders welcome.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Explorer */}
            <div className="bg-blue-50 rounded-2xl p-8 border border-blue-100">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-5">
                <MousePointerClick className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Explore & Give Feedback</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-5">
                Be the first to try products that don&apos;t exist yet. Your comments directly influence what gets built.
              </p>
              <ul className="space-y-2 mb-6">
                {[
                  "Try pre-launch products across categories",
                  "Interact with real pricing plans",
                  "Leave honest comments & feedback",
                  "No account needed to explore",
                ].map(item => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Browse Projects <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Creator */}
            <div className="bg-purple-50 rounded-2xl p-8 border border-purple-100">
              <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center mb-5">
                <Rocket className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Validate Your Idea</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-5">
                Post your idea before coding. Get click data, email signups, and comments from real potential users.
              </p>
              <ul className="space-y-2 mb-6">
                {[
                  "Generate a landing page in 5 minutes",
                  "A/B test pricing tiers with real clicks",
                  "Collect waitlist emails automatically",
                  "See insights on your creator dashboard",
                ].map(item => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-gradient-primary text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
              >
                Submit My Project <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-20 px-6 bg-gray-50 border-y border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">How it works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: "01", emoji: "✏️", title: "Describe your idea", desc: "Enter your product name, description, and pricing tiers. Your landing page is generated instantly." },
              { step: "02", emoji: "🚀", title: "Share the link", desc: "Drop it in communities, social media, or direct messages. Visitors try your product and leave feedback." },
              { step: "03", emoji: "📊", title: "Read the data", desc: "Track visitors, click rates, comments, and waitlist signups in your real-time creator dashboard." },
            ].map(item => (
              <div key={item.step} className="bg-white rounded-2xl p-6 border border-gray-100 card-shadow">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">{item.emoji}</span>
                  <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">Step {item.step}</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Everything you need to validate</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {[
              { icon: <MousePointerClick className="w-5 h-5" />, label: "Pricing Click Tracking", desc: "See which plan users click most in real time." },
              { icon: <MessageSquare className="w-5 h-5" />,    label: "Comment Feedback",       desc: "Collect honest user opinions directly on your page." },
              { icon: <Mail className="w-5 h-5" />,             label: "Waitlist Collection",    desc: "Capture emails from interested users automatically." },
              { icon: <BarChart3 className="w-5 h-5" />,        label: "Live Dashboard",         desc: "Visitors, conversion rate, and click distribution at a glance." },
              { icon: <Zap className="w-5 h-5" />,              label: "5-Minute Setup",         desc: "No code needed. Launch a validation page in minutes." },
              { icon: <Rocket className="w-5 h-5" />,           label: "Feature Voting",         desc: "Ask users which features matter most before you build them." },
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

      {/* ── CTA Banner ── */}
      <section className="py-24 px-6 bg-gradient-primary">
        <div className="max-w-3xl mx-auto text-center text-white">
          <h2 className="text-4xl font-extrabold leading-tight">Validate before you build</h2>
          <p className="mt-4 text-purple-200 text-base">Post your idea today. Get real feedback tomorrow.</p>
          <div className="flex items-center justify-center gap-4 mt-8">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-white text-purple-700 font-bold px-8 py-4 rounded-xl hover:bg-purple-50 transition-colors text-sm"
              data-testid="bottom-cta"
            >
              Submit My Project <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 border border-purple-400 text-white font-semibold px-8 py-4 rounded-xl hover:bg-purple-600 transition-colors text-sm"
            >
              Browse Projects
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-gradient-primary flex items-center justify-center">
              <Zap className="w-2.5 h-2.5 text-white" />
            </div>
            <span className="font-bold text-gray-700 text-sm">try.wepp</span>
          </div>
          <div className="flex gap-5">
            {["Privacy Policy", "Terms of Service", "Support"].map(l => (
              <Link key={l} href="#" className="hover:text-gray-600 transition-colors">{l}</Link>
            ))}
          </div>
          <span>© 2026 try.wepp</span>
        </div>
      </footer>
    </div>
  );
}
