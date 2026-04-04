"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TwLogo } from "@/components/ui/TwLogo";
import { ArrowRight, Lock, ChevronDown } from "lucide-react";

const CATEGORIES = [
  "SaaS / B2B",
  "Consumer App",
  "Marketplace",
  "Dev Tools",
  "Health & Wellness",
  "Education",
  "Social / Community",
  "Fintech",
  "E-commerce",
  "AI / ML",
  "Hardware",
  "Other",
];

const STEPS = ["Category", "Target User", "Description"];

export default function SubmitPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ category: "", target_user: "", description: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canNext = () => {
    if (step === 0) return form.category !== "";
    if (step === 1) return form.target_user.trim().length >= 5;
    if (step === 2) return form.description.trim().length >= 30;
    return false;
  };

  const handleNext = () => {
    if (step < 2) { setStep(step + 1); return; }
    handleSubmit();
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || "Something went wrong"); setLoading(false); return; }
      router.push(`/ideas/${json.submissionId}`);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-navy flex flex-col">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 h-[60px] border-b border-white/5">
        <Link href="/" className="flex items-center gap-2">
          <TwLogo className="w-7 h-7 rounded-lg" />
          <span className="font-bold text-white text-sm">Try.Wepp</span>
        </Link>
        <span className="text-xs text-gray-500 font-medium">Anonymous · Secure · Free</span>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 border border-indigo-400/30 bg-indigo-500/10 text-indigo-300 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
              <Lock className="w-3 h-3" />
              100% anonymous — your identity is never shared
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Submit your idea</h1>
            <p className="mt-2 text-sm text-gray-400">Get an instant AI insight report. Takes 2 minutes.</p>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-2 mb-8">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`flex items-center gap-2 ${i <= step ? "opacity-100" : "opacity-30"}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                    ${i < step ? "bg-indigo-500 border-indigo-500 text-white" : i === step ? "border-indigo-400 text-indigo-400" : "border-gray-600 text-gray-600"}`}>
                    {i < step ? "✓" : i + 1}
                  </div>
                  <span className={`text-xs font-medium ${i === step ? "text-white" : "text-gray-500"}`}>{s}</span>
                </div>
                {i < 2 && <div className="flex-1 h-px bg-white/10 mx-2" />}
              </div>
            ))}
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-8">

            {/* Step 0: Category */}
            {step === 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">What category fits your idea?</h2>
                <p className="text-sm text-gray-400 mb-6">This determines which ideas yours gets compared to.</p>
                <div className="grid grid-cols-2 gap-3">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setForm({ ...form, category: cat })}
                      className={`text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all duration-150
                        ${form.category === cat
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                          : "border-gray-100 text-gray-600 hover:border-indigo-200 hover:bg-indigo-50/50"}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 1: Target User */}
            {step === 1 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Who is this for?</h2>
                <p className="text-sm text-gray-400 mb-6">Describe your target user in one sentence.</p>
                <div className="space-y-3">
                  {[
                    "Early-stage startup founders",
                    "Freelance designers and developers",
                    "SMB owners without in-house tech",
                    "College students managing coursework",
                  ].map((example) => (
                    <button
                      key={example}
                      onClick={() => setForm({ ...form, target_user: example })}
                      className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm transition-all duration-150
                        ${form.target_user === example
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700 font-medium"
                          : "border-gray-100 text-gray-500 hover:border-gray-200"}`}
                    >
                      {example}
                    </button>
                  ))}
                  <div className="relative mt-2">
                    <input
                      type="text"
                      value={form.target_user}
                      onChange={(e) => setForm({ ...form, target_user: e.target.value })}
                      placeholder="Or write your own..."
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-400 transition-colors"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Description */}
            {step === 2 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Describe your idea</h2>
                <p className="text-sm text-gray-400 mb-6">Brief and clear. What does it do? What problem does it solve?</p>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="e.g. A tool that automatically generates API docs from code comments, targeted at solo developers who hate writing documentation manually..."
                  rows={6}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-400 transition-colors resize-none leading-relaxed"
                />
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-gray-400">Min 30 characters</span>
                  <span className={`text-xs font-medium ${form.description.length >= 30 ? "text-green-500" : "text-gray-400"}`}>
                    {form.description.length} chars
                  </span>
                </div>
                {error && <p className="mt-3 text-xs text-red-500 font-medium">{error}</p>}
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8">
              <button
                onClick={() => setStep(Math.max(0, step - 1))}
                className={`text-sm text-gray-400 hover:text-gray-600 transition-colors px-2 py-1 ${step === 0 ? "invisible" : ""}`}
              >
                ← Back
              </button>
              <button
                onClick={handleNext}
                disabled={!canNext() || loading}
                className="inline-flex items-center gap-2 bg-indigo-500 text-white font-bold px-6 py-2.5 rounded-xl text-sm
                  hover:bg-indigo-400 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed
                  hover:shadow-lg hover:shadow-indigo-500/25"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analyzing...
                  </>
                ) : step === 2 ? (
                  <>Get my insight report <ArrowRight className="w-4 h-4" /></>
                ) : (
                  <>Next <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-gray-600 mt-6">
            Your idea is never made public. It only contributes to aggregate trend data.
          </p>
        </div>
      </div>
    </div>
  );
}