"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PricingTier {
  name: string;
  price: string;
  features: string[];
  popular?: boolean;
}

interface PricingSectionProps {
  experimentId: string;
  tiers: PricingTier[];
}

export function PricingSection({ experimentId, tiers }: PricingSectionProps) {
  const handlePlanClick = async (planName: string) => {
    await fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        experimentId,
        eventType: "pricing_click",
        metadata: { planName },
      }),
    });
  };

  return (
    <section className="py-20 px-6" data-testid="pricing-section">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">
            Simple, transparent pricing
          </h2>
          <p className="text-gray-500 mt-3">
            Choose the plan that fits your needs
          </p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={cn(
                "rounded-2xl border p-8 flex flex-col",
                tier.popular
                  ? "border-primary-500 bg-primary-600 text-white shadow-xl scale-105"
                  : "border-gray-200 bg-white"
              )}
            >
              {tier.popular && (
                <span className="self-start text-xs font-bold uppercase tracking-wider bg-white/20 text-white px-3 py-1 rounded-full mb-4">
                  Most Popular
                </span>
              )}
              <h3
                className={cn(
                  "text-xl font-bold",
                  tier.popular ? "text-white" : "text-gray-900"
                )}
              >
                {tier.name}
              </h3>
              <div className="mt-3 mb-6">
                <span
                  className={cn(
                    "text-4xl font-bold",
                    tier.popular ? "text-white" : "text-gray-900"
                  )}
                >
                  ${tier.price}
                </span>
                <span
                  className={cn(
                    "text-sm ml-1",
                    tier.popular ? "text-primary-200" : "text-gray-500"
                  )}
                >
                  /mo
                </span>
              </div>

              <ul className="space-y-3 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check
                      className={cn(
                        "w-4 h-4 shrink-0",
                        tier.popular ? "text-primary-200" : "text-primary-600"
                      )}
                    />
                    <span
                      className={tier.popular ? "text-primary-100" : "text-gray-600"}
                    >
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                className={cn(
                  "mt-8 w-full",
                  tier.popular
                    ? "bg-white text-primary-700 hover:bg-primary-50"
                    : ""
                )}
                variant={tier.popular ? "outline" : "default"}
                onClick={() => handlePlanClick(tier.name)}
                data-testid={`pricing-btn-${tier.name.toLowerCase()}`}
                data-event="pricing_click"
                data-plan={tier.name}
              >
                Select {tier.name}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
