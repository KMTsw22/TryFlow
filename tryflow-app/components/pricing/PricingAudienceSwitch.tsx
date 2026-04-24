"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { PricingCard } from "./PricingCard";

// Matches the Plan shape used in app/pricing/page.tsx.
interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  locked: string[];
  highlighted: boolean;
  ctaLabel: string;
  ctaHref: string | null;
  plan: string | null;
}

interface Props {
  plans: Plan[];
  isLoggedIn: boolean;
}

type Audience = "founder" | "investor";

const SERIF = "'Fraunces', serif";
const DISPLAY = "'Inter', sans-serif";

/**
 * Dual-audience pricing switch (2026-04).
 *
 * 전에는 3 plan 이 일렬로 나와 Founder 도 Pro 를 보고 Investor 도 Free 를 봄.
 * 결과: 누가 뭘 사야 하는지 불명확. Score 광고처럼 보였음.
 *
 * 새 구조:
 *   - 상단 segmented toggle (For Founders · For Investors)
 *   - Founder 뷰: Free + Plus 강조, Pro 는 "if you're an investor" footer link
 *   - Investor 뷰: Pro 만 강조 (scale up), Founder plan 은 footer link
 *
 * 효과: plan 개수가 줄어 보이면서 각 persona 에게 의사결정이 쉬워짐.
 */
export function PricingAudienceSwitch({ plans, isLoggedIn }: Props) {
  const [audience, setAudience] = useState<Audience>("founder");

  const freePlan = plans.find((p) => p.id === "free");
  const plusPlan = plans.find((p) => p.id === "plus");
  const proPlan = plans.find((p) => p.id === "pro");

  return (
    <>
      {/* Segmented toggle — editorial minimal */}
      <div className="flex justify-center mb-12">
        <div
          role="tablist"
          aria-label="Pick your audience"
          className="inline-flex border"
          style={{ borderColor: "var(--t-border-card)" }}
        >
          <AudienceTab
            active={audience === "founder"}
            onClick={() => setAudience("founder")}
            label="For Founders"
          />
          <AudienceTab
            active={audience === "investor"}
            onClick={() => setAudience("investor")}
            label="For Investors"
          />
        </div>
      </div>

      {/* Hero copy — persona-specific */}
      <div className="text-center mb-14 max-w-2xl mx-auto">
        <h2
          className="mb-4 leading-[1.05]"
          style={{
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: "clamp(2rem, 4vw, 3rem)",
            letterSpacing: "-0.025em",
            color: "var(--text-primary)",
          }}
        >
          {audience === "founder"
            ? "Ship signals before you ship product."
            : "Back founders before the product exists."}
        </h2>
        <p
          className="text-[15.5px] leading-[1.7] mx-auto"
          style={{ color: "var(--text-secondary)" }}
        >
          {audience === "founder"
            ? "Submit anonymous ideas. Get scored across six VC-backed axes. If Pro investors see signal, they land in your inbox — no product required."
            : "Nine categories, live signals, pre-product deal flow. Reach founders the moment their idea hits the market, before any other VC has seen it."}
        </p>
      </div>

      {/* Cards — different layouts per audience */}
      {audience === "founder" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto mb-10">
          {freePlan && <PricingCard plan={freePlan} isLoggedIn={isLoggedIn} />}
          {plusPlan && <PricingCard plan={plusPlan} isLoggedIn={isLoggedIn} />}
        </div>
      ) : (
        <div className="grid grid-cols-1 max-w-lg mx-auto mb-10">
          {proPlan && <PricingCard plan={proPlan} isLoggedIn={isLoggedIn} />}
        </div>
      )}

      {/* Cross-link footer — the "other side" lives here, one click away */}
      <div className="flex justify-center mb-10">
        <button
          type="button"
          onClick={() =>
            setAudience(audience === "founder" ? "investor" : "founder")
          }
          className="group inline-flex items-center gap-2 text-[13px] font-medium tracking-[0.14em] uppercase transition-opacity hover:opacity-70"
          style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
        >
          {audience === "founder"
            ? "Looking for deal flow? See the Investor plan"
            : "Building something yourself? See Founder plans"}
          <ArrowRight
            className="w-3 h-3 transition-transform group-hover:translate-x-1"
            strokeWidth={2}
          />
        </button>
      </div>
    </>
  );
}

function AudienceTab({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className="px-6 py-2.5 text-[12.5px] font-medium tracking-[0.16em] uppercase transition-colors"
      style={{
        fontFamily: DISPLAY,
        background: active ? "var(--text-primary)" : "transparent",
        color: active ? "var(--page-bg)" : "var(--text-tertiary)",
      }}
    >
      {label}
    </button>
  );
}

