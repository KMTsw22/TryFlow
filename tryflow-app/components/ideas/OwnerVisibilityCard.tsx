"use client";

import { useState } from "react";
import { Loader2, Eye, EyeOff, Mail, MailX } from "lucide-react";
import Link from "next/link";

interface Props {
  ideaId: string;
  initialIsPrivate: boolean;
  initialAllowContact: boolean;
  hasContactEmail: boolean;
}

export function OwnerVisibilityCard({
  ideaId,
  initialIsPrivate,
  initialAllowContact,
  hasContactEmail,
}: Props) {
  const [isPrivate, setIsPrivate] = useState(initialIsPrivate);
  const [allowContact, setAllowContact] = useState(initialAllowContact);
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [savingContact, setSavingContact] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function togglePrivacy() {
    if (savingPrivacy) return;
    const next = !isPrivate;
    setIsPrivate(next);
    setSavingPrivacy(true);
    setError(null);
    try {
      const res = await fetch(`/api/ideas/${ideaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_private: next }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
    } catch (e) {
      setIsPrivate(!next); // revert
      setError(e instanceof Error ? e.message : "Failed to update privacy");
    } finally {
      setSavingPrivacy(false);
    }
  }

  async function toggleContact() {
    if (savingContact) return;
    const next = !allowContact;
    setAllowContact(next);
    setSavingContact(true);
    setError(null);
    try {
      const res = await fetch(`/api/profile/contact`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allow_contact: next }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
    } catch (e) {
      setAllowContact(!next);
      setError(e instanceof Error ? e.message : "Failed to update contact setting");
    } finally {
      setSavingContact(false);
    }
  }

  return (
    <div
      className="mb-6 border"
      style={{ background: "var(--card-bg)", borderColor: "var(--t-border-card)" }}
    >
      <div
        className="px-5 py-3 border-b"
        style={{ borderColor: "var(--t-border-subtle)" }}
      >
        <p
          className="text-[11px] font-semibold tracking-wider uppercase"
          style={{ color: "var(--text-tertiary)" }}
        >
          Idea settings
        </p>
      </div>

      <div className="divide-y" style={{ borderColor: "var(--t-border-subtle)" }}>
        {/* Visibility */}
        <Row
          icon={isPrivate ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          title={isPrivate ? "Private" : "Public"}
          subtitle={
            isPrivate
              ? "Only you can see this idea. It won't appear in the market."
              : "Anyone can discover this idea in the market."
          }
          on={!isPrivate}
          saving={savingPrivacy}
          onToggle={togglePrivacy}
          toggleLabel={isPrivate ? "Make public" : "Make private"}
        />

        {/* Contact */}
        <Row
          icon={allowContact ? <Mail className="w-4 h-4" /> : <MailX className="w-4 h-4" />}
          title={allowContact ? "Contact on" : "Contact off"}
          subtitle={
            allowContact
              ? "Pro investors can reach out to you via email about your ideas."
              : "Investors can see your ideas but cannot contact you."
          }
          meta="Applies to all your ideas"
          on={allowContact}
          saving={savingContact}
          onToggle={toggleContact}
          toggleLabel={allowContact ? "Disable contact" : "Enable contact"}
          warning={
            !hasContactEmail && !allowContact
              ? (
                <span>
                  You don&apos;t have a contact email on file —{" "}
                  <Link href="/settings" className="underline text-indigo-400 hover:text-indigo-300">
                    add one in settings
                  </Link>{" "}
                  before enabling contact.
                </span>
              )
              : null
          }
          disabled={!hasContactEmail && !allowContact}
        />
      </div>

      {error && (
        <p className="px-5 py-2 text-xs text-red-400 border-t" style={{ borderColor: "var(--t-border-subtle)" }}>
          {error}
        </p>
      )}
    </div>
  );
}

function Row({
  icon,
  title,
  subtitle,
  meta,
  on,
  saving,
  onToggle,
  toggleLabel,
  warning,
  disabled,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  meta?: string;
  on: boolean;
  saving: boolean;
  onToggle: () => void;
  toggleLabel: string;
  warning?: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <div className="px-5 py-4 flex items-start gap-4">
      <div
        className="w-8 h-8 flex items-center justify-center shrink-0"
        style={{ background: "var(--t-border-subtle)", color: on ? "var(--accent)" : "var(--text-tertiary)" }}
      >
        {icon}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          {title}
        </p>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
          {subtitle}
        </p>
        {meta && (
          <p className="text-[11px] mt-1" style={{ color: "var(--text-tertiary)" }}>
            {meta}
          </p>
        )}
        {warning && (
          <p className="text-[11px] mt-2 text-amber-500 dark:text-amber-400">{warning}</p>
        )}
      </div>

      <button
        type="button"
        onClick={onToggle}
        disabled={saving || disabled}
        aria-pressed={on}
        className="shrink-0 inline-flex items-center gap-1.5 h-7 px-3 text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: on ? "var(--accent-soft)" : "transparent",
          border: "1px solid var(--t-border)",
          color: on ? "var(--accent)" : "var(--text-secondary)",
        }}
      >
        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
        {toggleLabel}
      </button>
    </div>
  );
}
