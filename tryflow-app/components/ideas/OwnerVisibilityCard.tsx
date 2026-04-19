"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import Link from "next/link";

interface Props {
  ideaId: string;
  initialIsPrivate: boolean;
  initialAllowContact: boolean;
  hasContactEmail: boolean;
}

const SERIF = "'Playfair Display', serif";
const DISPLAY = "'Oswald', sans-serif";

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
      setIsPrivate(!next);
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

  const contactDisabled = !hasContactEmail && !allowContact;

  return (
    <section aria-label="Idea settings" className="mb-14">
      <div className="flex items-center gap-4 mb-8">
        <span
          className="text-[15px] font-medium tracking-[0.35em] uppercase"
          style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
        >
          Settings
        </span>
        <span className="flex-1 h-px" style={{ background: "var(--t-border-subtle)" }} />
        <span
          className="text-[14px] font-medium tracking-[0.25em] uppercase shrink-0"
          style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
        >
          Owner only
        </span>
      </div>

      <div className="max-w-3xl">
        <SettingRow
          label="Visibility"
          title={isPrivate ? "Private" : "Public"}
          desc={
            isPrivate
              ? "Only you can open this report."
              : "Anyone with this link can open it. Won't be indexed on the market."
          }
          on={!isPrivate}
          saving={savingPrivacy}
          onToggle={togglePrivacy}
        />

        <SettingRow
          label="Contact"
          title={allowContact ? "Open to contact" : "Contact off"}
          desc={
            allowContact
              ? "Pro investors can email you about your ideas."
              : "Investors can see your ideas but cannot reach out."
          }
          meta="Applies to all your ideas"
          on={allowContact}
          saving={savingContact}
          onToggle={toggleContact}
          disabled={contactDisabled}
          warning={
            contactDisabled ? (
              <>
                Add a{" "}
                <Link
                  href="/settings"
                  className="underline transition-opacity hover:opacity-70"
                  style={{ color: "var(--accent)" }}
                >
                  contact email
                </Link>{" "}
                in settings before enabling.
              </>
            ) : null
          }
        />

        {error && (
          <p
            className="mt-5 text-[13px] font-medium tracking-[0.2em] uppercase"
            style={{ fontFamily: DISPLAY, color: "var(--signal-danger)" }}
          >
            {error}
          </p>
        )}
      </div>
    </section>
  );
}

function SettingRow({
  label,
  title,
  desc,
  meta,
  on,
  saving,
  onToggle,
  disabled,
  warning,
}: {
  label: string;
  title: string;
  desc: string;
  meta?: string;
  on: boolean;
  saving: boolean;
  onToggle: () => void;
  disabled?: boolean;
  warning?: React.ReactNode;
}) {
  return (
    <div
      className="grid grid-cols-[120px_1fr_auto] gap-x-6 items-start py-6 border-b"
      style={{ borderColor: "var(--t-border-subtle)" }}
    >
      {/* Column 1 — Label */}
      <span
        className="pt-1 text-[14px] font-medium tracking-[0.3em] uppercase"
        style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
      >
        {label}
      </span>

      {/* Column 2 — State title + description */}
      <div className="min-w-0">
        <h3
          className="leading-tight"
          style={{
            fontFamily: SERIF,
            fontWeight: 700,
            fontSize: "1.35rem",
            letterSpacing: "-0.015em",
            color: on ? "var(--text-primary)" : "var(--text-secondary)",
          }}
        >
          {title}
        </h3>
        <p
          className="mt-1.5 text-[14px] leading-[1.6]"
          style={{ color: "var(--text-secondary)" }}
        >
          {desc}
        </p>
        {meta && (
          <p
            className="mt-2 text-[12px] font-medium tracking-[0.25em] uppercase"
            style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
          >
            {meta}
          </p>
        )}
        {warning && (
          <p
            className="mt-3 text-[13px] leading-[1.5]"
            style={{ color: "var(--signal-warning)" }}
          >
            {warning}
          </p>
        )}
      </div>

      {/* Column 3 — Toggle switch */}
      <ToggleSwitch on={on} saving={saving} onClick={onToggle} disabled={disabled} />
    </div>
  );
}

function ToggleSwitch({
  on,
  saving,
  onClick,
  disabled,
}: {
  on: boolean;
  saving: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onClick}
      disabled={saving || disabled}
      className="relative inline-flex items-center w-11 h-6 shrink-0 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-80 mt-1"
      style={{
        background: on ? "var(--accent)" : "var(--t-border-card)",
        borderRadius: "9999px",
      }}
    >
      <span
        className="absolute transition-transform duration-200"
        style={{
          left: 3,
          width: 18,
          height: 18,
          borderRadius: "9999px",
          background: "#fff",
          transform: on ? "translateX(20px)" : "translateX(0)",
        }}
      />
      {saving && (
        <Loader2
          className="absolute left-1/2 -translate-x-1/2 w-3 h-3 animate-spin"
          style={{ color: "var(--text-primary)" }}
        />
      )}
    </button>
  );
}
