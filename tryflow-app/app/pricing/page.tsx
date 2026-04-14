import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Shield } from "lucide-react";
import { PricingCard } from "@/components/pricing/PricingCard";

const PLANS = [
  {
    id: "submitter",
    name: "Submitter Pro",
    price: "$15",
    period: "/month",
    description:
      "For founders: unlock the full multi-agent analysis of your own ideas and upload privately.",
    features: [
      "Full 8-agent deep analysis on your ideas",
      "Detailed per-agent assessments, risks & next steps",
      "Private idea uploads (excluded from public trends)",
      "7-day free trial",
    ],
    locked: [
      "Browse other founders' ideas",
      "Contact other submitters",
    ],
    highlighted: false,
    ctaLabel: "Subscribe to Submitter",
    ctaHref: null,
    plan: "submitter",
  },
  {
    id: "bundle",
    name: "Bundle Pro",
    price: "$25",
    period: "/month",
    description:
      "Everything in Submitter + Viewer. The best value if you both build and scout.",
    features: [
      "Everything in Submitter Pro",
      "Everything in Viewer Pro",
      "Save ~17% vs buying both separately",
      "7-day free trial",
    ],
    locked: [],
    highlighted: true,
    ctaLabel: "Subscribe to Bundle",
    ctaHref: null,
    plan: "bundle",
  },
  {
    id: "viewer",
    name: "Viewer Pro",
    price: "$20",
    period: "/month",
    description:
      "For investors & scouts: browse every public idea and reach out to submitters directly.",
    features: [
      "Browse all public submitted ideas",
      "Real-time trends dashboard across 9 categories",
      "Contact idea submitters via email (up to 10/day)",
      "7-day free trial",
    ],
    locked: [
      "Deep analysis on your own ideas",
      "Private idea uploads",
    ],
    highlighted: false,
    ctaLabel: "Subscribe to Viewer",
    ctaHref: null,
    plan: "viewer",
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 w-full">
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
