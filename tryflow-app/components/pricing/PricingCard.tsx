"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Lock, ArrowRight, Loader2 } from "lucide-react";

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
  plan: Plan;
  isLoggedIn: boolean;
}

export function PricingCard({ plan, isLoggedIn }: Props) {
  const [loading, setLoading] = useState(false);

  const handleStripeCheckout = async () => {
    if (!isLoggedIn) {
      window.location.href = "/login?next=/pricing";
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: plan.plan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("결제 페이지 연결에 실패했습니다. 잠시 후 다시 시도해주세요.");
      }
    } catch {
      alert("오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex flex-col"
      style={{
        background: plan.highlighted ? "var(--accent-soft)" : "var(--card-bg)",
        border: plan.highlighted
          ? "1px solid var(--accent-ring)"
          : "1px solid var(--t-border-card)",
        position: "relative",
      }}
    >
      {plan.highlighted && (
        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-[12px] font-bold tracking-widest uppercase"
          style={{
            background: "var(--accent)",
            color: "white",
          }}
        >
          추천
        </div>
      )}

      <div className="p-7 flex flex-col flex-1">
        {/* Name & price */}
        <div className="mb-6">
          <p
            className="text-xs font-bold tracking-widest uppercase mb-2"
            style={{ color: "var(--text-tertiary)" }}
          >
            {plan.name}
          </p>
          <div className="flex items-end gap-1 mb-3">
            <span
              className="text-4xl font-extrabold"
              style={{ color: "var(--text-primary)" }}
            >
              {plan.price}
            </span>
            {plan.period && (
              <span className="text-sm mb-1" style={{ color: "var(--text-tertiary)" }}>
                {plan.period}
              </span>
            )}
          </div>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {plan.description}
          </p>
        </div>

        {/* Features */}
        <ul className="space-y-2.5 mb-6 flex-1">
          {plan.features.map((f) => (
            <li key={f} className="flex items-start gap-2.5">
              <Check
                className="w-4 h-4 shrink-0 mt-0.5"
                style={{ color: plan.highlighted ? "var(--accent)" : "var(--signal-success)" }}
              />
              <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{f}</span>
            </li>
          ))}
          {plan.locked.map((f) => (
            <li key={f} className="flex items-start gap-2.5 opacity-35">
              <Lock className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--text-tertiary)" }} />
              <span className="text-sm line-through" style={{ color: "var(--text-tertiary)" }}>{f}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        {plan.plan ? (
          // Stripe checkout button
          <button
            onClick={handleStripeCheckout}
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full py-3 text-sm font-bold text-white transition-[filter] hover:brightness-110 disabled:opacity-60"
            style={{
              background: "var(--accent)",
            }}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                {plan.ctaLabel}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        ) : plan.ctaHref?.startsWith("mailto:") ? (
          <a
            href={plan.ctaHref}
            className="flex items-center justify-center gap-2 w-full py-3 text-sm font-semibold border transition-colors"
            style={{
              color: "var(--accent)",
              borderColor: "var(--accent-ring)",
            }}
          >
            {plan.ctaLabel}
            <ArrowRight className="w-4 h-4" />
          </a>
        ) : plan.id === "free" ? (
          <Link
            href={plan.ctaHref ?? "/"}
            className="flex items-center justify-center gap-2 w-full py-3 text-sm font-bold border transition-[filter] hover:brightness-110"
            style={{
              color: "var(--accent)",
              borderColor: "var(--accent-ring)",
            }}
          >
            {plan.ctaLabel}
            <ArrowRight className="w-4 h-4" />
          </Link>
        ) : (
          <Link
            href={plan.ctaHref ?? "/"}
            className="flex items-center justify-center gap-2 w-full py-3 text-sm font-semibold border transition-colors"
            style={{
              color: "var(--text-secondary)",
              borderColor: "var(--t-input-border)",
            }}
          >
            {plan.ctaLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
