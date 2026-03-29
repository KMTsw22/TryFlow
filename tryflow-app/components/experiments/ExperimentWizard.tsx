"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { X, Check, ChevronRight, Save, Lock, Loader2 } from "lucide-react";

const STEPS = [
  { id: 1, label: "BASIC INFO" },
  { id: 2, label: "PRICING" },
  { id: 3, label: "LANDING" },
  { id: 4, label: "LAUNCH" },
];

interface FormData {
  productName: string;
  description: string;
  plans: { name: string; price: string; features: string }[];
  heroTitle: string;
  heroSubtitle: string;
  ctaText: string;
}

export function ExperimentWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<FormData>({
    productName: "",
    description: "",
    plans: [
      { name: "Basic",   price: "9",  features: "" },
      { name: "Pro",     price: "19", features: "" },
      { name: "Premium", price: "29", features: "" },
    ],
    heroTitle: "",
    heroSubtitle: "",
    ctaText: "Join Waitlist",
  });

  const handleLaunch = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/experiments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: form.productName,
          description: form.description,
          pricingTiers: form.plans.map(p => ({
            name: p.name,
            price: p.price,
            features: p.features.split(",").map(f => f.trim()).filter(Boolean),
          })),
          heroTitle: form.heroTitle || form.productName,
          heroSubtitle: form.heroSubtitle || form.description,
          ctaText: form.ctaText,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create experiment");
      }

      router.push("/experiments");
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-purple-50/40 flex flex-col">
      {/* Top nav */}
      <header className="bg-white border-b border-gray-100 px-8 py-3 flex items-center justify-between sticky top-0 z-10">
        <Link href="/dashboard" className="font-bold text-purple-700 text-sm">TryFlow</Link>
        <nav className="flex items-center gap-6 text-sm font-medium">
          {STEPS.map(s => (
            <button
              key={s.id}
              onClick={() => s.id < step && setStep(s.id)}
              className={`pb-0.5 transition-colors ${
                s.id === step ? "text-purple-700 border-b-2 border-purple-600" :
                s.id < step  ? "text-gray-600 cursor-pointer" :
                               "text-gray-300 cursor-default"
              }`}
            >
              {s.label.charAt(0) + s.label.slice(1).toLowerCase()}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500">
            <X className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Step progress */}
      <div className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-center">
        <div className="flex items-center gap-0">
          {STEPS.map((s, idx) => (
            <div key={s.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                  step > s.id ? "bg-purple-600 text-white" :
                  step === s.id ? "bg-purple-600 text-white" :
                  "bg-gray-100 text-gray-400"
                }`}>
                  {step > s.id ? <Check className="w-4 h-4" /> : s.id}
                </div>
                <span className={`text-[10px] font-semibold mt-1.5 tracking-wider ${step >= s.id ? "text-purple-600" : "text-gray-300"}`}>
                  {s.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`w-24 h-0.5 mb-4 mx-1 transition-colors ${step > s.id ? "bg-purple-600" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 flex items-start justify-center pt-10 pb-32 px-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm w-full max-w-lg p-8">
          {step === 1 && <Step1 form={form} setForm={setForm} />}
          {step === 2 && <Step2 form={form} setForm={setForm} />}
          {step === 3 && <Step3 form={form} setForm={setForm} />}
          {step === 4 && <Step4 form={form} />}
          {error && (
            <p className="mt-4 text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">{error}</p>
          )}
        </div>
      </div>

      {/* Footer bar */}
      <div className="bg-white border-t border-gray-100 px-8 py-4 flex items-center justify-between fixed bottom-0 left-0 right-0 z-10">
        <button className="flex items-center gap-1.5 text-sm text-gray-500 font-medium hover:text-gray-700">
          <Save className="w-3.5 h-3.5" /> Save Draft
        </button>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Lock className="w-3 h-3" /> Your data is stored securely
          </div>
          <span className="text-sm text-gray-400">Step {step} of {STEPS.length}</span>
          {step > 1 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="border border-gray-200 text-gray-700 text-sm font-semibold px-5 py-2 rounded-lg hover:bg-gray-50"
            >
              Back
            </button>
          )}
          {step < 4 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={step === 1 && !form.productName.trim()}
              className="flex items-center gap-2 bg-gradient-primary text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:opacity-90 disabled:opacity-40"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleLaunch}
              disabled={loading}
              className="flex items-center gap-2 bg-gradient-primary text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:opacity-90 disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? "Launching..." : "Launch Experiment 🚀"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Step 1 ── */
function Step1({ form, setForm }: { form: FormData; setForm: React.Dispatch<React.SetStateAction<FormData>> }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-xl">📋</div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Basic Information</h2>
          <p className="text-sm text-gray-500">Tell us about the product you&apos;re testing</p>
        </div>
      </div>
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Product Name</label>
          <input
            value={form.productName}
            onChange={e => setForm(f => ({ ...f, productName: e.target.value }))}
            placeholder="e.g., CloudSync Pro"
            className="w-full h-11 px-4 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-400 mt-1.5">What&apos;s the name of your product or service?</p>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Short Description</label>
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Describe what your product does in 1-2 sentences..."
            rows={4}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          />
        </div>
        <div className="flex items-start gap-3 bg-purple-50 rounded-xl p-4">
          <span className="text-purple-600 shrink-0">💡</span>
          <p className="text-sm text-purple-700">Tip: A clear product description helps testers understand your value proposition better.</p>
        </div>
      </div>
    </div>
  );
}

/* ── Step 2 ── */
function Step2({ form, setForm }: { form: FormData; setForm: React.Dispatch<React.SetStateAction<FormData>> }) {
  const update = (i: number, k: keyof FormData["plans"][0], v: string) =>
    setForm(f => ({ ...f, plans: f.plans.map((p, idx) => idx === i ? { ...p, [k]: v } : p) }));
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Pricing Tiers</h2>
        <p className="text-sm text-gray-500 mt-1">Set up price points to test with your audience</p>
      </div>
      <div className="space-y-3">
        {form.plans.map((plan, i) => (
          <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-700">{plan.name[0]}</div>
              <input value={plan.name} onChange={e => update(i, "name", e.target.value)}
                className="flex-1 h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Plan name" />
              <div className="flex items-center gap-1 border border-gray-200 rounded-lg px-3 h-9">
                <span className="text-gray-400 text-sm">$</span>
                <input type="number" value={plan.price} onChange={e => update(i, "price", e.target.value)}
                  className="w-12 text-sm outline-none text-gray-900" placeholder="0" />
                <span className="text-gray-400 text-xs">/mo</span>
              </div>
            </div>
            <input value={plan.features} onChange={e => update(i, "features", e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Features, comma-separated (e.g. 10GB Storage, 3 Users)" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Step 3 ── */
function Step3({ form, setForm }: { form: FormData; setForm: React.Dispatch<React.SetStateAction<FormData>> }) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Landing Page</h2>
        <p className="text-sm text-gray-500 mt-1">Customize your landing page content</p>
      </div>
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Hero Title</label>
          <input value={form.heroTitle} onChange={e => setForm(f => ({ ...f, heroTitle: e.target.value }))}
            placeholder={`e.g., The best ${form.productName || "tool"} for your team`}
            className="w-full h-11 px-4 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Hero Subtitle</label>
          <textarea value={form.heroSubtitle} onChange={e => setForm(f => ({ ...f, heroSubtitle: e.target.value }))}
            placeholder="Brief description of your value proposition..."
            rows={3}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">CTA Button Text</label>
          <input value={form.ctaText} onChange={e => setForm(f => ({ ...f, ctaText: e.target.value }))}
            placeholder="e.g., Join Waitlist"
            className="w-full h-11 px-4 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
        </div>
      </div>
    </div>
  );
}

/* ── Step 4 ── */
function Step4({ form }: { form: FormData }) {
  const slug = form.productName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "your-product";
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Ready to Launch! 🚀</h2>
        <p className="text-sm text-gray-500 mt-1">Review your experiment and go live</p>
      </div>
      <div className="space-y-3">
        <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-sm">
          {[
            { k: "Product",       v: form.productName || "—" },
            { k: "Description",   v: form.description  || "—" },
            { k: "Pricing Tiers", v: form.plans.map(p => `$${p.price}`).join(" / ") },
            { k: "CTA",           v: form.ctaText },
          ].map(row => (
            <div key={row.k} className="flex justify-between">
              <span className="text-gray-500">{row.k}</span>
              <span className="font-medium text-gray-900 text-right max-w-[260px] truncate">{row.v}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 bg-purple-50 rounded-xl p-4">
          <span className="text-purple-600">🔗</span>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Your public URL (after launch)</p>
            <p className="text-sm font-bold text-purple-700">tryflow.io/e/{slug}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
