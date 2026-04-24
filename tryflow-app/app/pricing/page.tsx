import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Shield } from "lucide-react";
import { PricingAudienceSwitch } from "@/components/pricing/PricingAudienceSwitch";
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
      "Reach founders at the earliest possible stage — before the product is built.",
    features: [
      "Everything in Plus",
      "Browse all public submitted ideas across 9 categories",
      "Real-time market signals + per-category health",
      "Save founders' ideas to your Watchlist",
      "Compare ideas side-by-side (yours, theirs, or mixed)",
      "Send direct intro messages — requests land in founder's inbox",
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

      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Editorial kicker */}
        <div className="flex items-center gap-4 mb-8 max-w-3xl mx-auto">
          <span
            className="text-[11.5px] font-medium tracking-[0.16em] uppercase"
            style={{ fontFamily: "'Inter', sans-serif", color: "var(--text-tertiary)" }}
          >
            Pricing
          </span>
          <span className="flex-1 h-px" style={{ background: "var(--t-border-subtle)" }} />
        </div>

        <h1
          className="text-center mb-4 mx-auto max-w-3xl leading-[1.03]"
          style={{
            fontFamily: "'Fraunces', serif",
            fontWeight: 900,
            fontSize: "clamp(2.75rem, 6vw, 4.5rem)",
            letterSpacing: "-0.035em",
            color: "var(--text-primary)",
          }}
        >
          Where ideas meet investors.
        </h1>
        <p
          className="text-center text-[17px] leading-[1.65] mb-14 max-w-xl mx-auto"
          style={{ color: "var(--text-secondary)" }}
        >
          Two sides, one marketplace. Pick the side you're on — we'll show you
          the plans that matter.
        </p>

        {/* Dual-audience switch handles plan emphasis + cross-link */}
        <PricingAudienceSwitch plans={PLANS} isLoggedIn={isLoggedIn} />

        {/* Security note */}
        <div className="flex items-center gap-3 justify-center mt-16 pt-10 border-t"
          style={{ borderColor: "var(--t-border-subtle)" }}>
          <Shield className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-tertiary)" }} />
          <p
            className="text-[12px] font-medium tracking-[0.08em] uppercase"
            style={{ fontFamily: "'Inter', sans-serif", color: "var(--text-tertiary)" }}
          >
            Payments via Stripe · Cancel anytime
          </p>
        </div>
      </div>
    </div>
  );
}
