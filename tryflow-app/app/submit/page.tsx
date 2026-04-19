"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Lock, EyeOff, Globe, Sparkles, RefreshCw, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

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

const STEPS = ["Category", "Target user", "Description"];

const INPUT_CLASS =
  "w-full border h-10 px-3 text-sm outline-none transition-colors focus:border-[color:var(--accent)]";
const INPUT_STYLE: React.CSSProperties = {
  background: "var(--input-bg)",
  borderColor: "var(--t-input-border)",
  color: "var(--text-primary)",
};

export default function SubmitPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromId = searchParams.get("from");
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
  const [contact, setContact] = useState({
    allow_contact: false,
    contact_email: "",
    contact_phone: "",
    contact_linkedin: "",
    contact_other: "",
  });
  // Iterate mode — when ?from=<id> is present, prefill from the original idea
  const [iteratingFrom, setIteratingFrom] = useState<{
    id: string;
    target_user: string;
    category: string;
  } | null>(null);
  const [prefilling, setPrefilling] = useState(!!fromId);

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

  // Iterate prefill — when ?from=<id> is passed, load the original idea
  // and prefill category/target/description/stage so the user can edit.
  useEffect(() => {
    if (!fromId) return;
    const supabase = createClient();
    (async () => {
      try {
        const { data, error: err } = await supabase
          .from("idea_submissions")
          .select("id, category, target_user, description, stage")
          .eq("id", fromId)
          .single();
        if (err || !data) {
          setPrefilling(false);
          return;
        }
        setForm((f) => ({
          ...f,
          category: data.category ?? f.category,
          target_user: data.target_user ?? f.target_user,
          description: data.description ?? f.description,
          stage: data.stage ?? f.stage,
        }));
        setIteratingFrom({
          id: data.id,
          target_user: data.target_user ?? "",
          category: data.category ?? "",
        });
      } catch {
        /* ignore */
      } finally {
        setPrefilling(false);
      }
    })();
  }, [fromId]);

  const clearIteration = () => {
    setIteratingFrom(null);
    router.replace("/submit");
  };

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
    <div className="min-h-screen flex flex-col" style={{ background: "var(--page-bg)" }}>
      {/* Navbar — system-aligned */}
      <nav
        className="flex items-center justify-between px-6 h-[60px] border-b"
        style={{ background: "var(--nav-bg)", borderColor: "var(--t-border)" }}
      >
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png" className="w-7 h-7" alt="Try.Wepp" />
          <span className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
            Try.Wepp
          </span>
        </Link>
        <div
          className="inline-flex items-center gap-1.5 text-xs font-medium"
          style={{ color: "var(--text-tertiary)" }}
        >
          <Lock className="w-3 h-3" />
          Anonymous · Secure · Free
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-14">
        <div className="w-full max-w-xl">
          {/* Iterating banner — visible when ?from=<id> prefills */}
          {iteratingFrom && (
            <div
              className="flex items-start gap-3 p-3.5 mb-5 border"
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
                <p
                  className="text-sm mt-0.5 truncate"
                  style={{ color: "var(--text-primary)" }}
                >
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

          {/* Header */}
          <div className="mb-8">
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              {iteratingFrom ? "Refine your idea" : "Submit your idea"}
            </h1>
            <p className="text-sm mt-1.5" style={{ color: "var(--text-secondary)" }}>
              {iteratingFrom
                ? "Adjust what needs sharpening. Submitting creates a new insight report."
                : "Get an instant AI insight report. Takes about 2 minutes."}
            </p>
          </div>

          {/* Progress — 3 segmented steps */}
          <div
            className="flex items-center border overflow-hidden mb-6"
            style={{
              background: "var(--card-bg)",
              borderColor: "var(--t-border-card)",
            }}
          >
            {STEPS.map((s, i) => {
              const done = i < step;
              const active = i === step;
              return (
                <div
                  key={s}
                  className={cn(
                    "flex-1 px-4 py-2.5 text-xs font-semibold flex items-center gap-2 transition-colors",
                    i < STEPS.length - 1 && "border-r"
                  )}
                  style={{
                    borderColor: "var(--t-border-subtle)",
                    background: active ? "var(--accent-soft)" : "transparent",
                    color: active
                      ? "var(--accent)"
                      : done
                        ? "var(--text-primary)"
                        : "var(--text-tertiary)",
                  }}
                >
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 transition-all"
                    style={{
                      background: active
                        ? "var(--accent)"
                        : done
                          ? "var(--text-primary)"
                          : "transparent",
                      color: active || done ? "#ffffff" : "var(--text-tertiary)",
                      border: !active && !done
                        ? "1px solid var(--t-border-bright)"
                        : "none",
                    }}
                  >
                    {done ? "✓" : i + 1}
                  </span>
                  <span className="truncate">{s}</span>
                </div>
              );
            })}
          </div>

          {/* Card — uses surface-1 (adapts to theme) */}
          <div
            className="border p-7"
            style={{
              background: "var(--surface-1, var(--card-bg))",
              borderColor: "var(--t-border-card)",
            }}
          >
            {/* Step 0: Category */}
            {step === 0 && (
              <div>
                <h2
                  className="text-base font-semibold mb-1"
                  style={{ color: "var(--text-primary)" }}
                >
                  What category fits your idea?
                </h2>
                <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>
                  Determines which ideas yours gets compared to.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map((cat) => {
                    const active = form.category === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setForm({ ...form, category: cat })}
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
              </div>
            )}

            {/* Step 1: Target user */}
            {step === 1 && (
              <div>
                <h2
                  className="text-base font-semibold mb-1"
                  style={{ color: "var(--text-primary)" }}
                >
                  Who is this for?
                </h2>
                <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>
                  Describe your target user in one sentence.
                </p>
                <div className="space-y-2">
                  {[
                    "Early-stage startup founders",
                    "Freelance designers and developers",
                    "SMB owners without in-house tech",
                    "College students managing coursework",
                  ].map((example) => {
                    const active = form.target_user === example;
                    return (
                      <button
                        key={example}
                        onClick={() => setForm({ ...form, target_user: example })}
                        className="w-full text-left px-3 py-2.5 border text-sm transition-colors"
                        style={{
                          background: active ? "var(--accent-soft)" : "var(--input-bg)",
                          borderColor: active ? "var(--accent-ring)" : "var(--t-border-card)",
                          color: active ? "var(--accent)" : "var(--text-secondary)",
                          fontWeight: active ? 600 : 400,
                        }}
                      >
                        {example}
                      </button>
                    );
                  })}
                  <input
                    type="text"
                    value={form.target_user}
                    onChange={(e) => setForm({ ...form, target_user: e.target.value })}
                    placeholder="Or write your own…"
                    className={INPUT_CLASS + " mt-2"}
                    style={INPUT_STYLE}
                  />
                  {form.target_user.length > 0 && form.target_user.trim().length < 5 && (
                    <p className="text-xs font-medium mt-2" style={{ color: "var(--signal-warning)" }}>
                      Need at least 5 characters — you have {form.target_user.trim().length}.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Description + stage + visibility + contact */}
            {step === 2 && (
              <div>
                <h2
                  className="text-base font-semibold mb-1"
                  style={{ color: "var(--text-primary)" }}
                >
                  Describe your idea
                </h2>
                <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>
                  Brief and clear. What does it do? What problem does it solve?
                </p>

                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="e.g. A tool that automatically generates API docs from code comments, targeted at solo developers who hate writing documentation…"
                  rows={6}
                  className="w-full border px-3 py-3 text-sm outline-none transition-colors focus:border-[color:var(--accent)] resize-none leading-relaxed"
                  style={INPUT_STYLE}
                />
                <div className="flex justify-between mt-2">
                  <span
                    className="text-xs font-medium"
                    style={{
                      color:
                        form.description.length === 0
                          ? "var(--text-tertiary)"
                          : form.description.length >= 30
                            ? "var(--signal-success)"
                            : "var(--signal-warning)",
                    }}
                  >
                    {form.description.length === 0
                      ? "Min 30 characters"
                      : form.description.length >= 30
                        ? "Looks good"
                        : `Need ${30 - form.description.length} more characters`}
                  </span>
                  <span
                    className="text-xs font-mono tabular-nums"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {form.description.length}
                  </span>
                </div>

                {/* Stage chips */}
                <Section
                  label="Stage of development"
                  optional
                  helper="Helps benchmark your idea against similar-stage submissions."
                >
                  <div className="grid grid-cols-2 gap-2">
                    {IDEA_STAGES.map((s) => {
                      const active = form.stage === s.value;
                      return (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() => setForm({ ...form, stage: active ? "" : s.value })}
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
                </Section>

                {/* Visibility */}
                {canPrivate ? (
                  <Section label="Visibility">
                    <div className="grid grid-cols-2 gap-2">
                      <VisibilityCard
                        icon={<Globe className="w-3.5 h-3.5" />}
                        title="Public"
                        desc="Appears in Market feed and contributes to trends."
                        active={!form.is_private}
                        onClick={() => setForm({ ...form, is_private: false })}
                      />
                      <VisibilityCard
                        icon={<EyeOff className="w-3.5 h-3.5" />}
                        title="Private"
                        desc="Only you can see it. Hidden from feed."
                        active={form.is_private}
                        onClick={() => setForm({ ...form, is_private: true })}
                      />
                    </div>
                  </Section>
                ) : (
                  <div
                    className="mt-5 flex items-start gap-3 p-3 border"
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
                  <Section
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
                  </Section>
                )}

                {error && (
                  <p
                    className="mt-4 text-xs font-medium"
                    style={{ color: "var(--signal-danger)" }}
                  >
                    {error}
                  </p>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-7">
              <button
                onClick={() => setStep(Math.max(0, step - 1))}
                className={cn(
                  "text-sm transition-colors px-2 py-1",
                  step === 0 && "invisible"
                )}
                style={{ color: "var(--text-tertiary)" }}
              >
                ← Back
              </button>
              <button
                onClick={handleNext}
                disabled={!canNext() || loading}
                className="inline-flex items-center gap-1.5 h-10 px-5 text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110"
                style={{ background: "var(--accent)" }}
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analyzing…
                  </>
                ) : step === 2 ? (
                  <>
                    Get my insight report <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Next <ArrowRight className="w-4 h-4" />
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

function Section({
  label,
  optional,
  helper,
  children,
}: {
  label: string;
  optional?: boolean;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-6">
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
