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
        background: plan.highlighted
          ? "linear-gradient(160deg, rgba(99,102,241,0.18), rgba(139,92,246,0.12))"
          : "rgba(255,255,255,0.03)",
        border: plan.highlighted
          ? "1px solid rgba(129,140,248,0.4)"
          : "1px solid rgba(255,255,255,0.07)",
        position: "relative",
      }}
    >
      {plan.highlighted && (
        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-[10px] font-bold tracking-widest uppercase"
          style={{
            background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
            color: "white",
          }}
        >
          Most Popular
        </div>
      )}

      <div className="p-7 flex flex-col flex-1">
        {/* Name & price */}
        <div className="mb-6">
          <p className="text-xs font-bold tracking-widest text-gray-500 uppercase mb-2">
            {plan.name}
          </p>
          <div className="flex items-end gap-1 mb-3">
            <span className="text-4xl font-extrabold text-white">{plan.price}</span>
            {plan.period && (
              <span className="text-gray-500 text-sm mb-1">{plan.period}</span>
            )}
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">{plan.description}</p>
        </div>

        {/* Features */}
        <ul className="space-y-2.5 mb-6 flex-1">
          {plan.features.map((f) => (
            <li key={f} className="flex items-start gap-2.5">
              <Check
                className="w-4 h-4 shrink-0 mt-0.5"
                style={{ color: plan.highlighted ? "#818cf8" : "#34d399" }}
              />
              <span className="text-sm text-gray-300">{f}</span>
            </li>
          ))}
          {plan.locked.map((f) => (
            <li key={f} className="flex items-start gap-2.5 opacity-35">
              <Lock className="w-4 h-4 shrink-0 mt-0.5 text-gray-600" />
              <span className="text-sm text-gray-500 line-through">{f}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        {plan.plan ? (
          // Stripe checkout button
          <button
            onClick={handleStripeCheckout}
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{
              background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
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
            className="flex items-center justify-center gap-2 w-full py-3 text-sm font-semibold text-indigo-300 border transition-colors hover:text-white hover:border-indigo-400"
            style={{ borderColor: "rgba(129,140,248,0.3)" }}
          >
            {plan.ctaLabel}
            <ArrowRight className="w-4 h-4" />
          </a>
        ) : (
          <Link
            href={plan.ctaHref ?? "/"}
            className="flex items-center justify-center gap-2 w-full py-3 text-sm font-semibold text-gray-400 border transition-colors hover:text-gray-200 hover:border-gray-500"
            style={{ borderColor: "rgba(255,255,255,0.1)" }}
          >
            {plan.ctaLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
