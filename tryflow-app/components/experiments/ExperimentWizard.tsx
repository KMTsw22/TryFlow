"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { X, Check, ChevronRight, Lock, Loader2, Coins, AlertTriangle } from "lucide-react";

const STEPS = [
  { id: 1, label: "BASIC INFO" },
  { id: 2, label: "PRICING" },
  { id: 3, label: "LANDING" },
  { id: 4, label: "LAUNCH" },
];

const CREDIT_COST = 1000;

interface FormData {
  productName: string;
  description: string;
  category: string;
  makerName: string;
  projectUrl: string;
  plans: { name: string; price: string; features: string }[];
  heroTitle: string;
  heroSubtitle: string;
  ctaText: string;
}

export function ExperimentWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [launchMsg, setLaunchMsg] = useState("");
  const [error, setError] = useState("");
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>({
    productName: "",
    description: "",
    category: "",
    makerName: "",
    projectUrl: "",
    plans: [
      { name: "Basic",   price: "9",  features: "" },
      { name: "Pro",     price: "19", features: "" },
      { name: "Premium", price: "29", features: "" },
    ],
    heroTitle: "",
    heroSubtitle: "",
    ctaText: "Join Waitlist",
  });

  useEffect(() => {
    fetch("/api/credits")
      .then(r => r.json())
      .then(d => setCreditBalance(d.balance ?? 0))
      .catch(() => setCreditBalance(null));
  }, []);

  const hasEnoughCredits = creditBalance === null || creditBalance >= CREDIT_COST;

  const handleLaunch = async () => {
    if (creditBalance !== null && creditBalance < CREDIT_COST) {
      setError(`크레딧이 부족합니다. 현재 잔액: ${creditBalance.toLocaleString()} / 필요 크레딧: ${CREDIT_COST.toLocaleString()}`);
      return;
    }

    setLoading(true);
    setError("");

    const msgs = ["Creating your page...", "Setting up pricing...", "Almost ready...", "Going live 🚀"];
    let i = 0;
    setLaunchMsg(msgs[0]);
    const ticker = setInterval(() => {
      i = Math.min(i + 1, msgs.length - 1);
      setLaunchMsg(msgs[i]);
    }, 700);

    try {
      const res = await fetch("/api/experiments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: form.productName,
          description: form.description,
          category: form.category || "Other",
          makerName: form.makerName,
          projectUrl: form.projectUrl,
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

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create experiment");

      clearInterval(ticker);
      router.push(`/${data.slug}`);
    } catch (e: unknown) {
      clearInterval(ticker);
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
      setLaunchMsg("");
    }
  };

  return (
    <div className="min-h-screen bg-purple-50/40 flex flex-col">
      {/* Top nav */}
      <header className="bg-white border-b border-gray-100 px-8 py-3 flex items-center justify-between sticky top-0 z-10">
        <Link href="/dashboard" className="font-bold text-purple-700 text-sm">try.wepp</Link>
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
          {/* 크레딧 잔액 표시 */}
          {creditBalance !== null && (
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${
              hasEnoughCredits ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-red-50 text-red-700 border border-red-200"
            }`}>
              <Coins className="w-3 h-3" />
              {creditBalance.toLocaleString()} 크레딧
            </div>
          )}
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
          {step === 4 && <Step4 form={form} creditBalance={creditBalance} />}
          {error && (
            <p className="mt-4 text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">{error}</p>
          )}
        </div>
      </div>

      {/* Footer bar */}
      <div className="bg-white border-t border-gray-100 px-8 py-4 flex items-center justify-end fixed bottom-0 left-0 right-0 z-10">
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
              disabled={loading || !hasEnoughCredits}
              className="flex items-center gap-2 bg-gradient-primary text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50 min-w-[200px] justify-center"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin shrink-0" />{launchMsg}</>
              ) : !hasEnoughCredits ? (
                <><AlertTriangle className="w-4 h-4 shrink-0" />크레딧 부족</>
              ) : (
                <>Launch Experiment 🚀 <span className="text-white/70 text-xs">(-{CREDIT_COST.toLocaleString()})</span></>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const CATEGORIES = ["SaaS", "Marketplace", "Consumer", "Dev Tools", "Health", "Education", "Social", "Other"];
const CATEGORY_EMOJI: Record<string, string> = {
  SaaS: "⚡", Marketplace: "🛒", Consumer: "📱", "Dev Tools": "🛠️",
  Health: "💚", Education: "📚", Social: "💬", Other: "🔬",
};

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
            placeholder="e.g., StudyMate"
            className="w-full h-11 px-4 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category</label>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setForm(f => ({ ...f, category: cat }))}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                  form.category === cat
                    ? "border-purple-500 bg-purple-50 text-purple-700"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span>{CATEGORY_EMOJI[cat]}</span> {cat}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Your Name <span className="text-gray-400 font-normal">(optional)</span></label>
          <input
            value={form.makerName}
            onChange={e => setForm(f => ({ ...f, makerName: e.target.value }))}
            placeholder="e.g., Alex · CS Junior"
            className="w-full h-11 px-4 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-400 mt-1.5">Shown on your project card so testers know who made it.</p>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Short Description</label>
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Describe what your product does in 1-2 sentences..."
            rows={3}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Project Link <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 h-11 focus-within:ring-2 focus-within:ring-purple-500">
            <span className="text-gray-400 text-sm shrink-0">🔗</span>
            <input
              type="url"
              value={form.projectUrl}
              onChange={e => setForm(f => ({ ...f, projectUrl: e.target.value }))}
              placeholder="https://your-demo.vercel.app"
              className="flex-1 text-sm outline-none placeholder:text-gray-400"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1.5">Deployed demo, GitHub link, etc. — shown as a &ldquo;View Demo&rdquo; button on the landing page.</p>
        </div>
        <div className="flex items-start gap-3 bg-purple-50 rounded-xl p-4">
          <span className="text-purple-600 shrink-0">💡</span>
          <p className="text-sm text-purple-700">Your project will go live immediately after launch and appear on the Explore page.</p>
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
function Step4({ form, creditBalance }: { form: FormData; creditBalance: number | null }) {
  const slug = form.productName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "your-product";
  const hasEnough = creditBalance === null || creditBalance >= CREDIT_COST;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Ready to Launch! 🚀</h2>
        <p className="text-sm text-gray-500 mt-1">Review your experiment and go live</p>
      </div>
      <div className="space-y-3">
        <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-sm">
          {[
            { k: "Product",       v: form.productName  || "—" },
            { k: "Category",      v: form.category     || "Other" },
            { k: "Maker",         v: form.makerName    || "—" },
            { k: "Project Link",  v: form.projectUrl   || "—" },
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
            <p className="text-sm font-bold text-purple-700">try.wepp/{slug}</p>
          </div>
        </div>

        {/* 크레딧 비용 안내 */}
        <div className={`flex items-center justify-between rounded-xl p-4 ${hasEnough ? "bg-amber-50 border border-amber-200" : "bg-red-50 border border-red-200"}`}>
          <div className="flex items-center gap-2">
            <Coins className={`w-4 h-4 ${hasEnough ? "text-amber-500" : "text-red-500"}`} />
            <div>
              <p className={`text-sm font-semibold ${hasEnough ? "text-amber-700" : "text-red-700"}`}>
                실험실 등록 비용: 1,000 크레딧
              </p>
              <p className={`text-xs mt-0.5 ${hasEnough ? "text-amber-600" : "text-red-600"}`}>
                노출 기간: 7일 · 현재 잔액: {creditBalance !== null ? `${creditBalance.toLocaleString()} 크레딧` : "로딩 중..."}
              </p>
            </div>
          </div>
          {!hasEnough && (
            <div className="flex items-center gap-1 text-xs text-red-600 font-semibold">
              <AlertTriangle className="w-3.5 h-3.5" />
              부족
            </div>
          )}
        </div>

        {!hasEnough && (
          <p className="text-xs text-red-500 text-center">
            댓글을 200자 이상 작성하면 +10 크레딧이 적립됩니다.
          </p>
        )}
      </div>
    </div>
  );
}
