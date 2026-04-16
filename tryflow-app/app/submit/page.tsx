"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Lock, EyeOff, Globe, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const IDEA_STAGES = [
  { value: "idea",           label: "Just an Idea",     sub: "Concept only, nothing built",  color: "#60a5fa" },
  { value: "prototype",      label: "Prototype / Demo", sub: "Something working to show",     color: "#a78bfa" },
  { value: "early_traction", label: "Early Traction",   sub: "Live with some real users",     color: "#fb923c" },
  { value: "launched",       label: "Launched",          sub: "Fully deployed & active",       color: "#ef4444" },
] as const;

const CATEGORIES = [
  "SaaS / B2B",
  "Consumer App",
  "Marketplace",
  "Dev Tools",
  "Health & Wellness",
  "Education",
  "Fintech",
  "E-commerce",
  "Hardware",
];

const STEPS = ["Category", "Target User", "Description"];

export default function SubmitPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    category: "",
    target_user: "",
    description: "",
    is_private: false,
    stage: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [canPrivate, setCanPrivate] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [contactOpen, setContactOpen] = useState(false);
  const [contact, setContact] = useState({
    allow_contact: false,
    contact_email: "",
    contact_phone: "",
    contact_linkedin: "",
    contact_other: "",
  });

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("plan, allow_contact, contact_email, contact_phone, contact_linkedin, contact_other")
        .eq("id", user.id)
        .maybeSingle();
      if (profile?.plan === "plus" || profile?.plan === "pro") setCanPrivate(true);
      if (profile) {
        setContact({
          allow_contact: profile.allow_contact ?? false,
          contact_email: profile.contact_email ?? "",
          contact_phone: profile.contact_phone ?? "",
          contact_linkedin: profile.contact_linkedin ?? "",
          contact_other: profile.contact_other ?? "",
        });
      }
    })();
  }, []);

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
      // Save contact info to user_profiles if user is logged in
      if (userId) {
        const supabase = createClient();
        await supabase
          .from("user_profiles")
          .update({
            allow_contact: contact.allow_contact,
            contact_email: contact.contact_email || null,
            contact_phone: contact.contact_phone || null,
            contact_linkedin: contact.contact_linkedin || null,
            contact_other: contact.contact_other || null,
          })
          .eq("id", userId);
      }

      const res = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, stage: form.stage || null }),
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
      <nav className="flex items-center justify-between px-8 h-[60px] border-b"
        style={{ borderColor: "var(--t-border)" }}>
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png" className="w-7 h-7" alt="Try.Wepp" />
          <span className="font-bold text-gray-900 dark:text-white text-sm">Try.Wepp</span>
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
          <div className="bg-white  shadow-2xl p-8">

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
                      className={`text-left px-4 py-3  border-2 text-sm font-medium transition-all duration-150
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
                      className={`w-full text-left px-4 py-3  border-2 text-sm transition-all duration-150
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
                      className="w-full border-2 border-gray-200  px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-400 transition-colors"
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
                  className="w-full border-2 border-gray-200  px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-400 transition-colors resize-none leading-relaxed"
                />
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-gray-400">Min 30 characters</span>
                  <span className={`text-xs font-medium ${form.description.length >= 30 ? "text-green-500" : "text-gray-400"}`}>
                    {form.description.length} chars
                  </span>
                </div>
                {/* Stage of development — vertical thermometer */}
                {(() => {
                  const idx = IDEA_STAGES.findIndex(s => s.value === form.stage);
                  // fill heights per stage (% from bottom of tube)
                  const fillHeights = [-1, 0, 33, 67, 100];
                  const fillH = fillHeights[idx + 1]; // -1→0%, 0→0%, ...
                  const tubeH = 132; // px — tube only, not bulb
                  const bulbD = 28;  // bulb diameter px
                  return (
                    <div className="mt-5">
                      <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-4">
                        Stage of development <span className="font-normal text-gray-400 normal-case">(optional)</span>
                      </p>

                      <div className="flex gap-5" style={{ height: tubeH + bulbD }}>

                        {/* ── Thermometer ── */}
                        <div className="flex flex-col items-center shrink-0" style={{ width: bulbD }}>
                          {/* Tube */}
                          <div
                            className="relative overflow-hidden"
                            style={{
                              width: 14,
                              height: tubeH,
                              background: "#f1f5f9",
                              borderRadius: "999px 999px 0 0",
                              border: "2px solid #e2e8f0",
                              borderBottom: "none",
                            }}
                          >
                            {/* Mercury fill — rises from bottom */}
                            <div
                              className="absolute bottom-0 left-0 right-0"
                              style={{
                                height: `${fillH}%`,
                                background: "linear-gradient(to top, #ef4444 0%, #fb923c 40%, #a78bfa 75%, #60a5fa 100%)",
                                transition: "height 0.5s cubic-bezier(0.34,1.56,0.64,1)",
                              }}
                            />
                            {/* Tick lines */}
                            {[33, 67, 100].map(p => (
                              <div
                                key={p}
                                className="absolute left-0 right-0"
                                style={{
                                  bottom: `${p}%`,
                                  height: 1,
                                  background: "rgba(0,0,0,0.08)",
                                }}
                              />
                            ))}
                          </div>

                          {/* Bulb */}
                          <div
                            style={{
                              width: bulbD,
                              height: bulbD,
                              borderRadius: "50%",
                              marginTop: -2,
                              background: idx >= 0 ? "#ef4444" : "#e2e8f0",
                              border: "2px solid",
                              borderColor: idx >= 0 ? "#dc2626" : "#cbd5e1",
                              boxShadow: idx >= 0 ? "0 0 0 4px #ef444425, 0 2px 8px #ef444440" : "none",
                              transition: "all 0.4s ease",
                            }}
                          />
                        </div>

                        {/* ── Stage labels (top = Launched, bottom = Idea) ── */}
                        <div className="flex flex-col justify-between flex-1 py-px">
                          {[...IDEA_STAGES].reverse().map((s, ri) => {
                            const i = IDEA_STAGES.length - 1 - ri;
                            const isActive = idx === i;
                            const isPast   = idx > i;
                            return (
                              <button
                                key={s.value}
                                type="button"
                                onClick={() => setForm({ ...form, stage: form.stage === s.value ? "" : s.value })}
                                className="flex items-center gap-2.5 text-left group"
                              >
                                {/* Tick connector */}
                                <div
                                  className="h-px w-3 shrink-0 transition-all duration-300"
                                  style={{ background: isActive || isPast ? s.color : "#e2e8f0" }}
                                />
                                <div>
                                  <p
                                    className="text-sm font-bold leading-tight transition-colors duration-200"
                                    style={{ color: isActive ? s.color : isPast ? "#94a3b8" : "#cbd5e1" }}
                                  >
                                    {s.label}
                                  </p>
                                  <p
                                    className="text-[10px] mt-0.5 transition-colors duration-200"
                                    style={{ color: isActive ? "#94a3b8" : "#cbd5e1" }}
                                  >
                                    {s.sub}
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                        </div>

                      </div>
                    </div>
                  );
                })()}

                {/* Visibility selection — Plus/Pro only */}
                {canPrivate ? (
                  <div className="mt-5">
                    <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Visibility
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, is_private: false })}
                        className={`text-left p-3 border-2 transition-all duration-150 ${
                          !form.is_private
                            ? "border-indigo-500 bg-indigo-50"
                            : "border-gray-100 bg-white hover:border-gray-200"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <Globe
                            className={`w-3.5 h-3.5 ${
                              !form.is_private ? "text-indigo-500" : "text-gray-400"
                            }`}
                          />
                          <span
                            className={`text-sm font-bold ${
                              !form.is_private ? "text-indigo-700" : "text-gray-600"
                            }`}
                          >
                            Public
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 leading-snug">
                          Appears in the Explore feed and contributes to category trends.
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, is_private: true })}
                        className={`text-left p-3 border-2 transition-all duration-150 ${
                          form.is_private
                            ? "border-indigo-500 bg-indigo-50"
                            : "border-gray-100 bg-white hover:border-gray-200"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <EyeOff
                            className={`w-3.5 h-3.5 ${
                              form.is_private ? "text-indigo-500" : "text-gray-400"
                            }`}
                          />
                          <span
                            className={`text-sm font-bold ${
                              form.is_private ? "text-indigo-700" : "text-gray-600"
                            }`}
                          >
                            Private
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 leading-snug">
                          Only you can see it. Hidden from feed and trends.
                        </p>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-5 flex items-start gap-3 p-3 border-2 border-gray-100 bg-gray-50/50">
                    <Sparkles className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <span className="text-xs font-bold text-gray-500">
                        Want to upload privately?
                      </span>
                      <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">
                        <Link href="/pricing" className="text-indigo-500 font-medium hover:underline">
                          Upgrade to Plus
                        </Link>{" "}
                        to keep your ideas hidden from the public feed.
                      </p>
                    </div>
                  </div>
                )}

                {/* Contact info — logged-in users only */}
                {userId && (
                  <div className="mt-5">
                    <button
                      type="button"
                      onClick={() => setContactOpen(!contactOpen)}
                      className="w-full flex items-center justify-between px-4 py-3 border-2 border-gray-100 bg-gray-50/50 text-left transition-colors hover:border-gray-200"
                    >
                      <div>
                        <span className="text-xs font-bold text-gray-600">Contact info <span className="font-normal text-gray-400">(optional)</span></span>
                        <p className="text-[11px] text-gray-400 mt-0.5">Let interested investors or collaborators reach out to you.</p>
                      </div>
                      {contactOpen ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
                    </button>

                    {contactOpen && (
                      <div className="border-2 border-t-0 border-gray-100 px-4 py-4 space-y-3">
                        {/* Allow contact toggle */}
                        <label className="flex items-center gap-3 cursor-pointer select-none">
                          <div
                            onClick={() => setContact({ ...contact, allow_contact: !contact.allow_contact })}
                            className={`w-9 h-5 rounded-full transition-colors shrink-0 relative ${contact.allow_contact ? "bg-indigo-500" : "bg-gray-200"}`}
                          >
                            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${contact.allow_contact ? "left-4" : "left-0.5"}`} />
                          </div>
                          <span className="text-xs font-medium text-gray-600">Allow others to contact me about this idea</span>
                        </label>

                        {contact.allow_contact && (
                          <div className="space-y-2.5 pt-1">
                            <div>
                              <label className="block text-[11px] font-semibold text-gray-500 mb-1">Email</label>
                              <input
                                type="email"
                                value={contact.contact_email}
                                onChange={(e) => setContact({ ...contact, contact_email: e.target.value })}
                                placeholder="you@example.com"
                                className="w-full border border-gray-200 px-3 py-2 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-indigo-400 transition-colors"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-gray-500 mb-1">Phone <span className="font-normal text-gray-400">(optional)</span></label>
                              <input
                                type="tel"
                                value={contact.contact_phone}
                                onChange={(e) => setContact({ ...contact, contact_phone: e.target.value })}
                                placeholder="+1 (555) 000-0000"
                                className="w-full border border-gray-200 px-3 py-2 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-indigo-400 transition-colors"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-gray-500 mb-1">LinkedIn <span className="font-normal text-gray-400">(optional)</span></label>
                              <input
                                type="url"
                                value={contact.contact_linkedin}
                                onChange={(e) => setContact({ ...contact, contact_linkedin: e.target.value })}
                                placeholder="https://linkedin.com/in/yourname"
                                className="w-full border border-gray-200 px-3 py-2 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-indigo-400 transition-colors"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-gray-500 mb-1">Other <span className="font-normal text-gray-400">(optional)</span></label>
                              <input
                                type="text"
                                value={contact.contact_other}
                                onChange={(e) => setContact({ ...contact, contact_other: e.target.value })}
                                placeholder="Twitter, Telegram, website..."
                                className="w-full border border-gray-200 px-3 py-2 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-indigo-400 transition-colors"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

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
                className="inline-flex items-center gap-2 bg-indigo-500 text-white font-bold px-6 py-2.5  text-sm
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