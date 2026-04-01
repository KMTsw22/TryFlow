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
  sliderPaymentType: "one-time" | "monthly";
  sliderMin: string;
  sliderMax: string;
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
    sliderPaymentType: "one-time",
    sliderMin: "5",
    sliderMax: "100",
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
      setError(`Insufficient credits. Balance: ${creditBalance.toLocaleString()} / Required: ${CREDIT_COST.toLocaleString()}`);
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
          pricingMode: "slider",
          pricingTiers: [],
          pricingSlider: { paymentType: form.sliderPaymentType, min: Number(form.sliderMin), max: Number(form.sliderMax) },
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
    <div className="min-h-screen bg-teal-50/40 flex flex-col">
      {/* Top nav */}
      <header className="bg-white border-b border-gray-100 px-8 py-3 flex items-center justify-between sticky top-0 z-10">
        <Link href="/dashboard" className="font-bold text-teal-600 text-sm">Try.Wepp</Link>
        <nav className="flex items-center gap-6 text-sm font-medium">
          {STEPS.map(s => (
            <button
              key={s.id}
              onClick={() => s.id < step && setStep(s.id)}
              className={`pb-0.5 transition-colors ${
                s.id === step ? "text-teal-700 border-b-2 border-teal-600" :
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
              {creditBalance.toLocaleString()} credits
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
                  step > s.id ? "bg-teal-600 text-white" :
                  step === s.id ? "bg-teal-600 text-white" :
                  "bg-gray-100 text-gray-400"
                }`}>
                  {step > s.id ? <Check className="w-4 h-4" /> : s.id}
                </div>
                <span className={`text-[10px] font-semibold mt-1.5 tracking-wider ${step >= s.id ? "text-teal-600" : "text-gray-300"}`}>
                  {s.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`w-24 h-0.5 mb-4 mx-1 transition-colors ${step > s.id ? "bg-teal-600" : "bg-gray-200"}`} />
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
              className="flex items-center gap-2 bg-teal-500 text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-teal-600 disabled:opacity-40 transition-colors"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleLaunch}
              disabled={loading || !hasEnoughCredits}
              className="flex items-center gap-2 bg-teal-500 text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-teal-600 disabled:opacity-50 transition-colors min-w-[200px] justify-center"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin shrink-0" />{launchMsg}</>
              ) : !hasEnoughCredits ? (
                <><AlertTriangle className="w-4 h-4 shrink-0" />Insufficient credits</>
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
        <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-xl">📋</div>
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
            className="w-full h-11 px-4 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
                    ? "border-teal-500 bg-teal-50 text-teal-700"
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
            className="w-full h-11 px-4 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
            className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Project Link <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 h-11 focus-within:ring-2 focus-within:ring-teal-500">
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
        <div className="flex items-start gap-3 bg-teal-50 rounded-xl p-4">
          <span className="text-teal-600 shrink-0">💡</span>
          <p className="text-sm text-teal-700">Your project will go live immediately after launch and appear on the Explore page.</p>
        </div>
      </div>
    </div>
  );
}

/* ── Step 2 ── */
function Step2({ form, setForm }: { form: FormData; setForm: React.Dispatch<React.SetStateAction<FormData>> }) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Pricing</h2>
        <p className="text-sm text-gray-500 mt-1">방문자가 슬라이더를 드래그해 얼마를 낼 의향이 있는지 답해요</p>
      </div>

      <div className="space-y-5">
        {/* Payment type */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">결제 방식</label>
          <div className="flex rounded-xl border border-gray-200 p-1">
            {(["one-time", "monthly"] as const).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setForm(f => ({ ...f, sliderPaymentType: type }))}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                  form.sliderPaymentType === type
                    ? "bg-teal-600 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {type === "one-time" ? "1회 결제" : "월 구독"}
              </button>
            ))}
          </div>
        </div>

        {/* Min / Max */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">최소 금액 ($)</label>
            <div className="flex items-center gap-1 border border-gray-200 rounded-lg px-3 h-11 focus-within:ring-2 focus-within:ring-teal-500">
              <span className="text-gray-400">$</span>
              <input
                type="number" min="0"
                value={form.sliderMin}
                onChange={e => setForm(f => ({ ...f, sliderMin: e.target.value }))}
                className="flex-1 text-sm outline-none"
                placeholder="0"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">최대 금액 ($)</label>
            <div className="flex items-center gap-1 border border-gray-200 rounded-lg px-3 h-11 focus-within:ring-2 focus-within:ring-teal-500">
              <span className="text-gray-400">$</span>
              <input
                type="number" min="0"
                value={form.sliderMax}
                onChange={e => setForm(f => ({ ...f, sliderMax: e.target.value }))}
                className="flex-1 text-sm outline-none"
                placeholder="100"
              />
            </div>
          </div>
        </div>

        <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 text-sm text-teal-700">
          방문자가 슬라이더로 금액을 선택하면, 응답 분포가 페이지에 실시간으로 표시돼요.
        </div>
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
            className="w-full h-11 px-4 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Hero Subtitle</label>
          <textarea value={form.heroSubtitle} onChange={e => setForm(f => ({ ...f, heroSubtitle: e.target.value }))}
            placeholder="Brief description of your value proposition..."
            rows={3}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">CTA Button Text</label>
          <input value={form.ctaText} onChange={e => setForm(f => ({ ...f, ctaText: e.target.value }))}
            placeholder="e.g., Join Waitlist"
            className="w-full h-11 px-4 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
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
            { k: "Pricing",       v: `$${form.sliderMin}–$${form.sliderMax} (${form.sliderPaymentType === "one-time" ? "1회 결제" : "월 구독"})` },
            { k: "CTA",           v: form.ctaText },
          ].map(row => (
            <div key={row.k} className="flex justify-between">
              <span className="text-gray-500">{row.k}</span>
              <span className="font-medium text-gray-900 text-right max-w-[260px] truncate">{row.v}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 bg-teal-50 rounded-xl p-4">
          <span className="text-teal-600">🔗</span>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Your public URL (after launch)</p>
            <p className="text-sm font-bold text-teal-700">Try.Wepp/{slug}</p>
          </div>
        </div>

        {/* 크레딧 비용 안내 */}
        <div className={`flex items-center justify-between rounded-xl p-4 ${hasEnough ? "bg-amber-50 border border-amber-200" : "bg-red-50 border border-red-200"}`}>
          <div className="flex items-center gap-2">
            <Coins className={`w-4 h-4 ${hasEnough ? "text-amber-500" : "text-red-500"}`} />
            <div>
              <p className={`text-sm font-semibold ${hasEnough ? "text-amber-700" : "text-red-700"}`}>
                Launch cost: 1,000 credits
              </p>
              <p className={`text-xs mt-0.5 ${hasEnough ? "text-amber-600" : "text-red-600"}`}>
                Visible for 7 days · Balance: {creditBalance !== null ? `${creditBalance.toLocaleString()} credits` : "Loading..."}
              </p>
            </div>
          </div>
          {!hasEnough && (
            <div className="flex items-center gap-1 text-xs text-red-600 font-semibold">
              <AlertTriangle className="w-3.5 h-3.5" />
              Not enough
            </div>
          )}
        </div>

        {!hasEnough && (
          <p className="text-xs text-red-500 text-center">
            Write 200+ character comments to earn +10 credits.
          </p>
        )}
      </div>
    </div>
  );
}
