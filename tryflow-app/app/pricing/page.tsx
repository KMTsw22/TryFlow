"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Zap, Lock, ChevronRight } from "lucide-react";

const PLANS = [
  {
    name: "Basic",
    price: "$9",
    period: "/mo",
    features: ["10GB Storage","Up to 3 Team Members","Standard Support"],
    disabled: ["Advanced Analytics"],
    popular: false,
    cta: "Select Basic",
  },
  {
    name: "Pro",
    price: "$19",
    period: "/mo",
    features: ["100GB Storage","Up to 10 Team Members","Priority Support","Advanced Analytics"],
    disabled: [],
    popular: true,
    cta: "Selected Plan",
  },
  {
    name: "Premium",
    price: "$29",
    period: "/mo",
    features: ["Unlimited Storage","Unlimited Team Members","24/7 Dedicated Support","Custom Integrations"],
    disabled: [],
    popular: false,
    cta: "Select Premium",
  },
];

export default function PricingPage() {
  const [selected, setSelected] = useState("Pro");

  const selectedPlan = PLANS.find(p => p.name === selected)!;
  const price = parseFloat(selectedPlan.price.replace("$", ""));
  const tax = +(price * 0.05).toFixed(2);
  const total = +(price + tax).toFixed(2);

  return (
    <div className="min-h-screen bg-white font-['Inter']">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal-500 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-sm">Try.Wepp</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-500 font-medium">
            {["Platform","Pricing","Enterprise","Docs"].map(l => (
              <Link key={l} href="#" className={l === "Pricing" ? "text-gray-900 font-semibold" : "hover:text-gray-900"}>{l}</Link>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">Log in</Link>
            <Link href="/signup" className="bg-teal-500 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-teal-600">Get Started</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 pt-12 pb-20">
        {/* Header + Step indicator */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900">Select Plan</h1>
            <p className="text-gray-500 text-sm mt-2 max-w-sm leading-relaxed">
              Find the perfect flow for your team&apos;s curation needs. Switch plans anytime as your data grows.
            </p>
          </div>
          {/* Step indicator */}
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs font-bold">1</div>
              <span className="font-semibold text-gray-900">Select Plan</span>
            </div>
            <div className="w-8 h-0.5 bg-gray-200" />
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs font-bold">2</div>
              <span className="text-gray-400">Payment</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_320px] gap-8">
          {/* Plans */}
          <div className="grid grid-cols-3 gap-4">
            {PLANS.map(plan => {
              const isSelected = selected === plan.name;
              return (
                <div
                  key={plan.name}
                  onClick={() => setSelected(plan.name)}
                  className={`relative rounded-2xl border-2 p-6 cursor-pointer transition-all flex flex-col ${
                    isSelected
                      ? "border-teal-600 bg-teal-600 text-white shadow-lg"
                      : "border-gray-200 bg-white hover:border-teal-200"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
                      Most Popular
                    </div>
                  )}
                  <h3 className={`text-lg font-bold ${isSelected ? "text-white" : "text-gray-900"}`}>{plan.name}</h3>
                  <div className="mt-2 mb-5">
                    <span className={`text-4xl font-extrabold ${isSelected ? "text-white" : "text-gray-900"}`}>{plan.price}</span>
                    <span className={`text-sm ${isSelected ? "text-teal-200" : "text-gray-400"}`}>{plan.period}</span>
                  </div>
                  <ul className="space-y-2.5 flex-1">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-xs">
                        <Check className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-teal-200" : "text-teal-600"}`} />
                        <span className={isSelected ? "text-teal-100" : "text-gray-600"}>{f}</span>
                      </li>
                    ))}
                    {plan.disabled.map(f => (
                      <li key={f} className="flex items-center gap-2 text-xs opacity-40">
                        <Check className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                        <span className="text-gray-400 line-through">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    className={`mt-6 w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      isSelected
                        ? "bg-white text-teal-700 hover:bg-teal-50"
                        : "border border-gray-200 text-gray-700 hover:border-teal-400 hover:text-teal-700"
                    }`}
                  >
                    {isSelected ? "Selected Plan ✓" : plan.cta}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 h-fit card-shadow">
            <h3 className="text-base font-bold text-gray-900 mb-5">Order Summary</h3>

            {/* Product */}
            <div className="flex items-center gap-3 pb-5 border-b border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-teal-500 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Try.Wepp {selectedPlan.name}</p>
                <p className="text-xs text-gray-400">Monthly Subscription</p>
                <p className="text-xs font-bold text-teal-700 mt-0.5">{selectedPlan.price}.00</p>
              </div>
            </div>

            {/* Breakdown */}
            <div className="space-y-3 py-5 border-b border-gray-100 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Plan Subtotal</span>
                <span className="font-medium text-gray-900">${price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Processing Fee</span>
                <span className="font-medium text-gray-900">$0.00</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Estimated Tax (5%)</span>
                <span className="font-medium text-gray-900">${tax.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-between py-4 text-base font-bold text-gray-900">
              <span>Total</span>
              <span className="text-teal-700">${total.toFixed(2)}</span>
            </div>

            {/* Promo */}
            <div className="flex gap-2 mb-4">
              <input
                placeholder="Promo code"
                className="flex-1 h-9 px-3 rounded-lg border border-gray-200 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              <button className="px-4 h-9 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                Apply
              </button>
            </div>

            <Link
              href="/signup"
              className="flex items-center justify-center gap-2 w-full bg-teal-500 text-white text-sm font-bold py-3 rounded-xl hover:bg-teal-600 transition-colors"
              data-testid="continue-to-payment"
            >
              Continue to Payment <ChevronRight className="w-4 h-4" />
            </Link>

            <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-gray-400">
              <Lock className="w-3 h-3" /> Secure checkout
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-6 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-gray-400">
          <span className="font-bold text-gray-700 text-sm">Try.Wepp</span>
          <div className="flex gap-5">
            {["Privacy Policy","Terms of Service","Security","Status"].map(l => (
              <Link key={l} href="#" className="hover:text-gray-600">{l}</Link>
            ))}
          </div>
          <span>© 2026 Try.Wepp Inc. Crafted for makers.</span>
        </div>
      </footer>
    </div>
  );
}
