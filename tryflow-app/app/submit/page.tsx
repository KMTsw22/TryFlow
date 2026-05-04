"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Lock, EyeOff, Globe, Sparkles, RefreshCw, X, Upload, FileText, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Brand } from "@/components/layout/Brand";

const IDEA_STAGES = [
  { value: "idea",           label: "Just an idea",     sub: "Concept only",             color: "var(--text-tertiary)" },
  { value: "prototype",      label: "Prototype",        sub: "Something working",        color: "var(--accent)" },
  { value: "early_traction", label: "Early traction",   sub: "Some real users",          color: "var(--signal-warning)" },
  { value: "launched",       label: "Launched",         sub: "Fully deployed",           color: "var(--signal-success)" },
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

// 2026-04: 6개 evaluation axes 각각에 대해 1 질문씩.
// 의도적으로 구체성 강제하는 질문 설계 — GPT 가 generic answer 생성하기 어려움.
const AXIS_QUESTIONS = [
  {
    key: "axis_market",
    label: "Market",
    question: "Who feels this pain right now, and how many of them are there?",
    placeholder:
      "ex) B2B healthcare ops teams at 200–2000 employee hospitals — about 5,000 in US",
  },
  {
    key: "axis_problem",
    label: "Problem",
    question: "What is the user doing today instead, and why is that broken?",
    placeholder:
      "ex) They use Excel + 3 SaaS tools and copy-paste between them — costs ~5h/week per person, errors compound at month-end",
  },
  {
    key: "axis_timing",
    label: "Timing",
    question: "Why now? What changed in the last 12–24 months that makes this possible?",
    placeholder:
      "ex) GPT-4 made medical chart parsing affordable; 2024 CMS rule mandates structured billing data by Q3 2026",
  },
  {
    key: "axis_product",
    label: "Product",
    question: "What does the product actually do? Describe the core flow in one paragraph.",
    placeholder:
      "ex) User uploads a chart PDF → 30s parse → highlights billing codes → 1-click export to Epic EMR with audit trail",
  },
  {
    key: "axis_defensibility",
    label: "Defensibility",
    question: "What makes this hard to copy 12 months in?",
    placeholder:
      "ex) Proprietary dataset of 50k labeled charts; Epic integration requires their cert (6mo); switching cost: re-training the AI on new data",
  },
  {
    key: "axis_business_model",
    label: "Business model",
    question: "Who pays, how much, and why is it worth it to them?",
    placeholder:
      "ex) Hospital billing teams pay $500/seat/month. Replaces $5K/mo manual coder. ROI in <1 month.",
  },
] as const;

const AXIS_MIN = 30;
const AXIS_MAX = 500;

const INPUT_CLASS =
  "w-full border h-10 px-3 text-sm outline-none transition-colors focus:border-[color:var(--accent)]";
const INPUT_STYLE: React.CSSProperties = {
  background: "var(--input-bg)",
  borderColor: "var(--t-input-border)",
  color: "var(--text-primary)",
};

type AxisAnswers = Record<typeof AXIS_QUESTIONS[number]["key"], string>;
const emptyAxisAnswers: AxisAnswers = {
  axis_market: "",
  axis_problem: "",
  axis_timing: "",
  axis_product: "",
  axis_defensibility: "",
  axis_business_model: "",
};

export default function SubmitPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromId = searchParams.get("from");

  const [category, setCategory] = useState("");
  const [targetUser, setTargetUser] = useState("");
  const [axes, setAxes] = useState<AxisAnswers>(emptyAxisAnswers);
  const [stage, setStage] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [canPrivate, setCanPrivate] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [contact, setContact] = useState({
    allow_contact: false,
    contact_email: "",
    contact_phone: "",
    contact_linkedin: "",
    contact_other: "",
  });
  const [iteratingFrom, setIteratingFrom] = useState<{
    id: string;
    target_user: string;
    category: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState("");
  const [prefilled, setPrefilled] = useState(false);

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

  // Iterate prefill — when ?from=<id> is passed, load original idea + axes
  useEffect(() => {
    if (!fromId) return;
    const supabase = createClient();
    (async () => {
      try {
        const { data, error: err } = await supabase
          .from("idea_submissions")
          .select(
            "id, category, target_user, stage, axis_market, axis_problem, axis_timing, axis_product, axis_defensibility, axis_business_model"
          )
          .eq("id", fromId)
          .single();
        if (err || !data) return;
        setCategory(data.category ?? "");
        setTargetUser(data.target_user ?? "");
        setStage(data.stage ?? "");
        setAxes({
          axis_market: data.axis_market ?? "",
          axis_problem: data.axis_problem ?? "",
          axis_timing: data.axis_timing ?? "",
          axis_product: data.axis_product ?? "",
          axis_defensibility: data.axis_defensibility ?? "",
          axis_business_model: data.axis_business_model ?? "",
        });
        setIteratingFrom({
          id: data.id,
          target_user: data.target_user ?? "",
          category: data.category ?? "",
        });
      } catch {
        /* ignore */
      }
    })();
  }, [fromId]);

  const clearIteration = () => {
    setIteratingFrom(null);
    router.replace("/submit");
  };

  const updateAxis = (key: keyof AxisAnswers, value: string) => {
    setAxes((prev) => ({ ...prev, [key]: value }));
  };

  const handleFilePick = async (file: File) => {
    setExtractError("");
    const name = file.name.toLowerCase();
    const isPdf = name.endsWith(".pdf");
    const isMd = name.endsWith(".md") || name.endsWith(".markdown");
    if (!isPdf && !isMd) {
      setExtractError("Only .pdf and .md files are supported.");
      return;
    }
    const limit = isPdf ? 10 * 1024 * 1024 : 1 * 1024 * 1024;
    if (file.size > limit) {
      setExtractError(
        `File too large. Max ${isPdf ? "10MB" : "1MB"} for ${isPdf ? "PDF" : "Markdown"}.`
      );
      return;
    }

    setExtracting(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/extract-axes", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) {
        setExtractError(json.error || "Could not extract from this file.");
        return;
      }
      const incoming = json.axes as Partial<AxisAnswers> | undefined;
      if (!incoming) {
        setExtractError("AI returned no answers. Try a different file.");
        return;
      }
      setAxes((prev) => {
        const next = { ...prev };
        for (const q of AXIS_QUESTIONS) {
          const v = incoming[q.key];
          if (typeof v === "string" && v.trim().length > 0) next[q.key] = v;
        }
        return next;
      });
      setPrefilled(true);
    } catch {
      setExtractError("Network error while uploading.");
    } finally {
      setExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Validation — all 6 axes have minimum chars, category + target set
  const axesFilled = AXIS_QUESTIONS.every((q) => axes[q.key].trim().length >= AXIS_MIN);
  const canSubmit =
    category !== "" && targetUser.trim().length >= 5 && axesFilled && !loading;

  const handleSubmit = async () => {
    if (!canSubmit) {
      setAttemptedSubmit(true);
      return;
    }
    setLoading(true);
    setError("");
    try {
      // Persist contact prefs first (not blocking for failure)
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

      // Concat axes into a single description for backwards-compat with code paths
      // that read `description` directly (cards, market feed, old analysis fallback).
      const description = AXIS_QUESTIONS.map(
        (q) => `${q.label}: ${axes[q.key].trim()}`
      ).join("\n\n");

      const res = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          target_user: targetUser,
          description,
          stage: stage || null,
          is_private: isPrivate,
          axes, // server stores into axis_* columns
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Something went wrong");
        setLoading(false);
        return;
      }
      window.location.assign(`/ideas/${json.submissionId}`);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--page-bg)" }}>
      <nav
        className="flex items-center justify-between px-6 h-[60px] border-b"
        style={{ background: "var(--nav-bg)", borderColor: "var(--t-border)" }}
      >
        <Brand size="md" />
        <div
          className="inline-flex items-center gap-1.5 text-xs font-medium"
          style={{ color: "var(--text-tertiary)" }}
        >
          <Lock className="w-3 h-3" />
          Anonymous · Secure · Free
        </div>
      </nav>

      <div className="flex-1 px-4 py-12">
        <div className="w-full max-w-2xl mx-auto">
          {iteratingFrom && (
            <div
              className="flex items-start gap-3 p-3.5 mb-6 border"
              style={{
                background: "var(--accent-soft)",
                borderColor: "var(--accent-ring)",
              }}
            >
              <RefreshCw
                className="w-4 h-4 mt-0.5 shrink-0"
                style={{ color: "var(--accent)" }}
              />
              <div className="flex-1 min-w-0">
                <p
                  className="text-xs font-semibold tracking-wider uppercase"
                  style={{ color: "var(--accent)" }}
                >
                  Iterating from a previous idea
                </p>
                <p className="text-sm mt-0.5 truncate" style={{ color: "var(--text-primary)" }}>
                  For {iteratingFrom.target_user} · {iteratingFrom.category}
                </p>
                <p
                  className="text-[13px] mt-1 leading-relaxed"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Fields are prefilled. Edit anything, then submit as a new idea — your original stays untouched.
                </p>
              </div>
              <button
                type="button"
                onClick={clearIteration}
                aria-label="Clear iteration and start fresh"
                className="shrink-0 p-1 transition-colors hover:text-[color:var(--text-primary)]"
                style={{ color: "var(--text-tertiary)" }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="mb-8">
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              {iteratingFrom ? "Refine your idea" : "Submit your idea"}
            </h1>
            <p className="text-sm mt-1.5" style={{ color: "var(--text-secondary)" }}>
              Answer six short questions — one per evaluation axis. Be specific. Concrete details
              score higher than polished prose.
            </p>
          </div>

          <div
            className="border p-7"
            style={{
              background: "var(--surface-1, var(--card-bg))",
              borderColor: "var(--t-border-card)",
            }}
          >
            {/* Category */}
            <FieldGroup label="Category" required>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CATEGORIES.map((cat) => {
                  const active = category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className="text-left px-3 py-2.5 border text-sm font-medium transition-colors"
                      style={{
                        background: active ? "var(--accent-soft)" : "var(--input-bg)",
                        borderColor: active ? "var(--accent-ring)" : "var(--t-border-card)",
                        color: active ? "var(--accent)" : "var(--text-secondary)",
                      }}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </FieldGroup>

            {/* Target user */}
            <FieldGroup
              label="Target user"
              required
              helper="Who specifically will use this? One short sentence."
            >
              <input
                type="text"
                value={targetUser}
                onChange={(e) => setTargetUser(e.target.value)}
                placeholder="ex) Solo developers shipping side projects on weekends"
                className={INPUT_CLASS}
                style={INPUT_STYLE}
              />
              {targetUser.length > 0 && targetUser.trim().length < 5 && (
                <p
                  className="text-xs font-medium mt-1.5"
                  style={{ color: "var(--signal-warning)" }}
                >
                  At least 5 characters.
                </p>
              )}
            </FieldGroup>

            {/* 6 axis questions — single page, sectioned */}
            <div
              className="mt-8 pt-6 border-t"
              style={{ borderColor: "var(--t-border-subtle)" }}
            >
              <p
                className="text-[11px] font-bold tracking-[0.14em] uppercase mb-1"
                style={{ color: "var(--text-tertiary)" }}
              >
                Six axes
              </p>
              <p className="text-sm mb-1" style={{ color: "var(--text-secondary)" }}>
                Each question maps to one of the six axes our AI scores against. Be concrete —
                names, numbers, real workflows beat abstractions.
              </p>
              <p
                className="text-[12px] mb-4 leading-relaxed"
                style={{ color: "var(--text-tertiary)" }}
              >
                Min {AXIS_MIN} / Max {AXIS_MAX} characters per answer.
              </p>

              {/* Optional file upload — AI drafts answers from a deck/memo */}
              <div
                className="mb-5 border p-4"
                style={{
                  background: "var(--input-bg)",
                  borderColor: "var(--t-border-card)",
                }}
              >
                <div className="flex items-start gap-3">
                  <Sparkles
                    className="w-4 h-4 mt-0.5 shrink-0"
                    style={{ color: "var(--accent)" }}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-xs font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Have a deck or memo? Let AI draft the six answers.
                    </p>
                    <p
                      className="text-[12.5px] mt-0.5 leading-relaxed"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      Upload PDF (≤10MB) or Markdown (≤1MB). You&apos;ll review and edit before submitting.
                    </p>
                    <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.md,.markdown"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleFilePick(f);
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={extracting}
                        className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-semibold border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          background: "var(--card-bg, var(--input-bg))",
                          borderColor: "var(--t-border-card)",
                          color: "var(--text-primary)",
                        }}
                      >
                        {extracting ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Extracting…
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5" />
                            Upload file
                          </>
                        )}
                      </button>
                      <span
                        className="text-[11.5px]"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        .pdf · .md
                      </span>
                    </div>
                    {extractError && (
                      <p
                        className="text-[12px] mt-2 font-medium"
                        style={{ color: "var(--signal-danger)" }}
                      >
                        {extractError}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {prefilled && (
                <div
                  className="flex items-start gap-2.5 p-3 mb-5 border"
                  style={{
                    background: "var(--accent-soft)",
                    borderColor: "var(--accent-ring)",
                  }}
                >
                  <FileText
                    className="w-4 h-4 mt-0.5 shrink-0"
                    style={{ color: "var(--accent)" }}
                  />
                  <p
                    className="text-[12.5px] leading-relaxed"
                    style={{ color: "var(--text-primary)" }}
                  >
                    AI drafted these answers from your file. <strong>Review every one</strong> and rewrite in your own words —
                    the score only means something if the details are real.
                  </p>
                </div>
              )}

              {AXIS_QUESTIONS.map((q, i) => (
                <AxisField
                  key={q.key}
                  index={i + 1}
                  label={q.label}
                  question={q.question}
                  placeholder={q.placeholder}
                  value={axes[q.key]}
                  onChange={(v) => updateAxis(q.key, v)}
                  showError={attemptedSubmit}
                />
              ))}
            </div>

            {/* Stage */}
            <FieldGroup
              label="Stage of development"
              optional
              helper="Helps benchmark your idea against similar-stage submissions."
              spacing="lg"
            >
              <div className="grid grid-cols-2 gap-2">
                {IDEA_STAGES.map((s) => {
                  const active = stage === s.value;
                  return (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setStage(active ? "" : s.value)}
                      className="text-left px-3 py-2 border text-sm transition-colors"
                      style={{
                        background: active ? "var(--accent-soft)" : "var(--input-bg)",
                        borderColor: active ? "var(--accent-ring)" : "var(--t-border-card)",
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ background: s.color }}
                        />
                        <span
                          className="font-semibold text-xs"
                          style={{
                            color: active ? "var(--text-primary)" : "var(--text-secondary)",
                          }}
                        >
                          {s.label}
                        </span>
                      </div>
                      <p
                        className="text-[13px] mt-0.5 ml-3.5"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        {s.sub}
                      </p>
                    </button>
                  );
                })}
              </div>
            </FieldGroup>

            {/* Visibility */}
            {canPrivate ? (
              <FieldGroup label="Visibility">
                <div className="grid grid-cols-2 gap-2">
                  <VisibilityCard
                    icon={<Globe className="w-3.5 h-3.5" />}
                    title="Public"
                    desc="Appears in Market feed and contributes to trends."
                    active={!isPrivate}
                    onClick={() => setIsPrivate(false)}
                  />
                  <VisibilityCard
                    icon={<EyeOff className="w-3.5 h-3.5" />}
                    title="Private"
                    desc="Only you can see it. Hidden from feed."
                    active={isPrivate}
                    onClick={() => setIsPrivate(true)}
                  />
                </div>
              </FieldGroup>
            ) : (
              <div
                className="mt-6 flex items-start gap-3 p-3 border"
                style={{
                  background: "var(--input-bg)",
                  borderColor: "var(--t-border-card)",
                }}
              >
                <Sparkles
                  className="w-4 h-4 mt-0.5 shrink-0"
                  style={{ color: "var(--accent)" }}
                />
                <div className="flex-1">
                  <p
                    className="text-xs font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Want to upload privately?
                  </p>
                  <p
                    className="text-[13px] mt-0.5 leading-relaxed"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <Link
                      href="/pricing"
                      className="font-medium hover:underline"
                      style={{ color: "var(--accent)" }}
                    >
                      Upgrade to Plus
                    </Link>{" "}
                    to keep ideas hidden from the public feed.
                  </p>
                </div>
              </div>
            )}

            {/* Contact info */}
            {userId && (
              <FieldGroup
                label="Contact info"
                optional
                helper="Let Pro investors reach out about this idea."
              >
                <div
                  className="border p-4 space-y-3"
                  style={{
                    background: "var(--input-bg)",
                    borderColor: "var(--t-border-card)",
                  }}
                >
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={contact.allow_contact}
                      onClick={() =>
                        setContact({ ...contact, allow_contact: !contact.allow_contact })
                      }
                      className="w-9 h-5 rounded-full transition-colors shrink-0 relative"
                      style={{
                        background: contact.allow_contact
                          ? "var(--accent)"
                          : "var(--t-border-bright)",
                      }}
                    >
                      <span
                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                          contact.allow_contact ? "left-4" : "left-0.5"
                        }`}
                      />
                    </button>
                    <span
                      className="text-xs font-medium"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Allow others to contact me about this idea
                    </span>
                  </label>

                  {contact.allow_contact && (
                    <div className="space-y-2.5 pt-1">
                      {[
                        { key: "contact_email",    label: "Email",    type: "email", placeholder: "you@example.com" },
                        { key: "contact_phone",    label: "Phone",    type: "tel",   placeholder: "+1 (555) 000-0000", optional: true },
                        { key: "contact_linkedin", label: "LinkedIn", type: "url",   placeholder: "https://linkedin.com/in/yourname", optional: true },
                        { key: "contact_other",    label: "Other",    type: "text",  placeholder: "Twitter, Telegram, website…", optional: true },
                      ].map((f) => (
                        <div key={f.key}>
                          <label
                            className="block text-[13px] font-semibold mb-1"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {f.label}
                            {f.optional && (
                              <span
                                className="ml-1.5 font-normal"
                                style={{ color: "var(--text-tertiary)" }}
                              >
                                (optional)
                              </span>
                            )}
                          </label>
                          <input
                            type={f.type}
                            value={contact[f.key as keyof typeof contact] as string}
                            onChange={(e) =>
                              setContact({ ...contact, [f.key]: e.target.value })
                            }
                            placeholder={f.placeholder}
                            className="w-full border h-9 px-3 text-sm outline-none transition-colors focus:border-[color:var(--accent)]"
                            style={INPUT_STYLE}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </FieldGroup>
            )}

            {error && (
              <p
                className="mt-5 text-xs font-medium"
                style={{ color: "var(--signal-danger)" }}
              >
                {error}
              </p>
            )}

            {/* Submit */}
            <div className="flex items-center justify-end mt-8 pt-6 border-t"
              style={{ borderColor: "var(--t-border-subtle)" }}>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                aria-disabled={!canSubmit}
                className="inline-flex items-center gap-1.5 h-10 px-5 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:cursor-not-allowed aria-disabled:opacity-40"
                style={{ background: "var(--accent)" }}
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analyzing…
                  </>
                ) : (
                  <>
                    Get my insight report <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          <p
            className="text-center text-xs mt-5"
            style={{ color: "var(--text-tertiary)" }}
          >
            Your idea is never made public under your name. It only contributes to aggregate trend data.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function FieldGroup({
  label,
  required,
  optional,
  helper,
  children,
  spacing = "md",
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  helper?: string;
  children: React.ReactNode;
  spacing?: "md" | "lg";
}) {
  return (
    <div className={spacing === "lg" ? "mt-8" : "mt-6 first:mt-0"}>
      <div className="mb-2">
        <span
          className="text-xs font-semibold tracking-wider uppercase"
          style={{ color: "var(--text-secondary)" }}
        >
          {label}
          {optional && (
            <span
              className="ml-1.5 font-normal normal-case"
              style={{ color: "var(--text-tertiary)" }}
            >
              (optional)
            </span>
          )}
          {required && (
            <span
              className="ml-1.5 font-normal normal-case"
              style={{ color: "var(--signal-danger)" }}
            >
              *
            </span>
          )}
        </span>
        {helper && (
          <p
            className="text-[13px] mt-1 leading-relaxed"
            style={{ color: "var(--text-tertiary)" }}
          >
            {helper}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

function AxisField({
  index,
  label,
  question,
  placeholder,
  value,
  onChange,
  showError,
}: {
  index: number;
  label: string;
  question: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  showError: boolean;
}) {
  const len = value.length;
  const trimmedLen = value.trim().length;
  const belowMin = trimmedLen < AXIS_MIN;
  const over = len > AXIS_MAX;
  const showBelowMinError = showError && belowMin;
  const counterColor = over || showBelowMinError
    ? "var(--signal-danger)"
    : "var(--signal-success)";
  const textareaStyle: React.CSSProperties = showBelowMinError
    ? { ...INPUT_STYLE, borderColor: "var(--signal-danger)", color: "var(--signal-danger)" }
    : INPUT_STYLE;

  return (
    <div className="mb-5">
      <div className="flex items-baseline justify-between gap-3 mb-1.5">
        <label className="block text-[13px] font-semibold">
          <span
            className="inline-flex items-center gap-2"
            style={{ color: "var(--text-primary)" }}
          >
            <span
              className="inline-flex items-center justify-center w-5 h-5 text-[11px] font-bold tabular-nums"
              style={{
                background: "var(--accent-soft)",
                color: "var(--accent)",
                borderRadius: "9999px",
              }}
            >
              {index}
            </span>
            <span className="uppercase tracking-[0.08em] text-[11.5px]">{label}</span>
          </span>
        </label>
        <span
          className="text-[11px] tabular-nums shrink-0"
          style={{ color: counterColor }}
        >
          {len}/{AXIS_MAX}
        </span>
      </div>
      <p
        className="text-[13.5px] leading-[1.5] mb-2"
        style={{ color: "var(--text-secondary)" }}
      >
        {question}
      </p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        maxLength={AXIS_MAX + 50}
        className="w-full border px-3 py-2.5 text-sm outline-none transition-colors focus:border-[color:var(--accent)] resize-none leading-relaxed"
        style={textareaStyle}
      />
      {showBelowMinError && (
        <p
          className="text-[11px] font-medium mt-1"
          style={{ color: "var(--signal-danger)" }}
        >
          최소 {AXIS_MIN}자 이상 입력해 주세요. ({trimmedLen}/{AXIS_MIN})
        </p>
      )}
    </div>
  );
}

function VisibilityCard({
  icon,
  title,
  desc,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left p-3 border transition-colors"
      style={{
        background: active ? "var(--accent-soft)" : "var(--input-bg)",
        borderColor: active ? "var(--accent-ring)" : "var(--t-border-card)",
      }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span style={{ color: active ? "var(--accent)" : "var(--text-tertiary)" }}>
          {icon}
        </span>
        <span
          className="text-sm font-semibold"
          style={{ color: active ? "var(--accent)" : "var(--text-primary)" }}
        >
          {title}
        </span>
      </div>
      <p
        className="text-[13px] leading-snug"
        style={{ color: "var(--text-tertiary)" }}
      >
        {desc}
      </p>
    </button>
  );
}
