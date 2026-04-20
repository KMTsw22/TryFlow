import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Shield } from "lucide-react";
import { PricingCard } from "@/components/pricing/PricingCard";
import { Brand } from "@/components/layout/Brand";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "",
    description:
      "Submit your ideas and get a basic viability score. All submissions are public.",
    features: [
      "Submit your own ideas (public only)",
      "Basic AI viability score & summary",
      "Access your submission history",
    ],
    locked: [
      "Detailed 8-agent analysis",
      "Private idea uploads",
      "Compare your ideas side-by-side",
      "Browse other founders' public ideas",
    ],
    highlighted: false,
    ctaLabel: "Get started free",
    ctaHref: "/dashboard",
    plan: null,
  },
  {
    id: "plus",
    name: "Plus",
    price: "$10",
    period: "/month",
    description:
      "For founders shipping multiple ideas: deep analysis, private uploads, and own-vs-own compare.",
    features: [
      "Everything in Free",
      "Full 8-agent deep analysis on your ideas",
      "Detailed per-agent assessments, risks & next steps",
      "Private idea uploads (excluded from public trends)",
      "Compare your own ideas side-by-side",
      "7-day free trial",
    ],
    locked: [
      "Browse other founders' public ideas",
      "Compare against other founders' ideas",
      "Contact other submitters",
    ],
    highlighted: false,
    ctaLabel: "Subscribe to Plus",
    ctaHref: null,
    plan: "plus",
  },
  {
    id: "pro",
    name: "Pro",
    price: "$20",
    period: "/month",
    description:
      "Everything in Plus, plus full access to every public idea — compare, analyze, and reach out.",
    features: [
      "Everything in Plus",
      "Browse all public submitted ideas",
      "Real-time trends dashboard across 9 categories",
      "Compare any ideas — yours, theirs, or mixed",
      "Contact idea submitters via email",
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
    <div className="min-h-screen" style={{ background: "var(--page-bg)" }}>
      {/* Navbar */}
      <nav
        className="border-b px-6 h-[60px] flex items-center justify-between"
        style={{
          background: "var(--nav-bg)",
          borderColor: "var(--t-border)",
          backdropFilter: "blur(12px)",
        }}
      >
        <Brand size="md" />
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="text-sm transition-colors hover:text-[color:var(--text-primary)]"
              style={{ color: "var(--text-tertiary)" }}
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              className="text-sm transition-colors hover:text-[color:var(--text-primary)]"
              style={{ color: "var(--text-tertiary)" }}
            >
              Sign in
            </Link>
          )}
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-14">
          <p
            className="text-xs font-bold tracking-widest uppercase mb-3"
            style={{ color: "var(--accent)" }}
          >
            Subscription Plans
          </p>
          <h1
            className="text-4xl font-extrabold tracking-tight mb-4"
            style={{ color: "var(--text-primary)" }}
          >
            Subscribe to Market Intelligence
          </h1>
          <p
            className="text-base max-w-lg mx-auto"
            style={{ color: "var(--text-secondary)" }}
          >
            Analyze idea trends submitted anonymously by aspiring founders in real time.
            Available exclusively to VC and corporate subscribers.
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-16 w-full max-w-4xl mx-auto">
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
          className="border p-8 mb-10 max-w-6xl"
          style={{
            background: "var(--card-bg)",
            borderColor: "var(--t-border)",
          }}
        >
          <h2
            className="text-lg font-bold mb-6 text-center"
            style={{ color: "var(--text-primary)" }}
          >
            What you get with Pro
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                color: "var(--accent)",
                title: "Real-time Trends Dashboard",
                desc: "Monitor idea flows across 9 categories in real time. See Rising · Stable · Declining directions and market saturation at a glance.",
              },
              {
                color: "var(--signal-success)",
                title: "Opportunity Signal Indicators",
                desc: "Capture the right investment timing with 9 signals — Hot Gap · Heating Up · Competitive and more — combining trend and saturation data.",
              },
              {
                color: "var(--signal-warning)",
                title: "Contact Idea Submitters",
                desc: "Reach up to 10 idea submitters per day. Submitter emails are never directly exposed.",
              },
            ].map(({ color, title, desc }) => (
              <div key={title} className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                  <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{title}</h3>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Security note */}
        <div className="flex items-center gap-3 justify-center">
          <Shield className="w-4 h-4 shrink-0" style={{ color: "var(--text-tertiary)" }} />
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            Payments are securely processed via Stripe. You can cancel anytime,
            and your access continues until the end of the current billing period.
          </p>
        </div>
      </div>
    </div>
  );
}
