import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Shield } from "lucide-react";
import { PricingCard } from "@/components/pricing/PricingCard";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "",
    description: "Submit your ideas and get AI-powered insights.",
    features: [
      "Anonymous idea submission",
      "AI insights on your submission",
    ],
    locked: [
      "Trends dashboard access",
      "In-depth category trend analysis",
      "Contact from investors & companies",
    ],
    highlighted: false,
    ctaLabel: "Get Started",
    ctaHref: "/submit",
    plan: null,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$20",
    period: "/month",
    description: "다른 사람의 아이디어를 보고, 관심 있는 제출자에게 바로 연락할 수 있습니다.",
    features: [
      "다른 창업자들의 아이디어 열람",
      "아이디어 제출자에게 연락 이메일 발송 (하루 10건)",
      "7-day free trial",
    ],
    locked: [],
    highlighted: true,
    ctaLabel: "Subscribe to Pro",
    ctaHref: null,
    plan: "pro",
  },
];

export default async function PricingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  return (
    <div className="min-h-screen" style={{ background: "#050816" }}>
      {/* Navbar */}
      <nav
        className="border-b px-6 h-[60px] flex items-center justify-between"
        style={{
          background: "rgba(5,8,22,0.95)",
          borderColor: "rgba(255,255,255,0.06)",
          backdropFilter: "blur(12px)",
        }}
      >
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png" className="w-7 h-7" alt="Try.Wepp" />
          <span className="font-bold text-white text-sm">Try.Wepp</span>
        </Link>
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">
              Dashboard
            </Link>
          ) : (
            <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
              Sign in
            </Link>
          )}
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-xs font-bold tracking-widest text-indigo-400 uppercase mb-3">
            Subscription Plans
          </p>
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-4">
            Subscribe to Market Intelligence
          </h1>
          <p className="text-gray-400 text-base max-w-lg mx-auto">
            Analyze idea trends submitted anonymously by aspiring founders in real time.
            Available exclusively to VC and corporate subscribers.
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16 max-w-3xl mx-auto w-full">
          {PLANS.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              isLoggedIn={isLoggedIn}
            />
          ))}
        </div>

        {/* Features breakdown */}
        <div
          className="border p-8 mb-10"
          style={{
            background: "rgba(255,255,255,0.02)",
            borderColor: "rgba(255,255,255,0.06)",
          }}
        >
          <h2 className="text-lg font-bold text-white mb-6 text-center">
            What you get with Pro
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                color: "#818cf8",
                title: "Real-time Trends Dashboard",
                desc: "Monitor idea flows across 9 categories in real time. See Rising · Stable · Declining directions and market saturation at a glance.",
              },
              {
                color: "#34d399",
                title: "Opportunity Signal Indicators",
                desc: "Capture the right investment timing with 9 signals — Hot Gap · Heating Up · Competitive and more — combining trend and saturation data.",
              },
              {
                color: "#f472b6",
                title: "Contact Idea Submitters",
                desc: "Reach up to 10 idea submitters per day. Submitter emails are never directly exposed.",
              },
            ].map(({ color, title, desc }) => (
              <div key={title} className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                  <h3 className="text-sm font-bold text-white">{title}</h3>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Security note */}
        <div className="flex items-center gap-3 justify-center">
          <Shield className="w-4 h-4 text-gray-600 shrink-0" />
          <p className="text-xs text-gray-600">
            Payments are securely processed via Stripe. You can cancel anytime,
            and your access continues until the end of the current billing period.
          </p>
        </div>
      </div>
    </div>
  );
}
