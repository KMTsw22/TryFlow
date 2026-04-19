"use client";

import { useState } from "react";

interface Props {
  initialEmail: string;
  initialPhone: string;
  initialLinkedin: string;
  initialOther: string;
  initialAllowContact: boolean;
}

const inputClass =
  "w-full border h-9 px-3 text-sm outline-none transition-colors focus:border-[color:var(--accent)]";

const inputStyle = {
  background: "var(--input-bg)",
  borderColor: "var(--t-input-border)",
  color: "var(--text-primary)",
};

export function ContactInfoForm({
  initialEmail,
  initialPhone,
  initialLinkedin,
  initialOther,
  initialAllowContact,
}: Props) {
  const [contactEmail, setContactEmail] = useState(initialEmail);
  const [contactPhone, setContactPhone] = useState(initialPhone);
  const [contactLinkedin, setContactLinkedin] = useState(initialLinkedin);
  const [contactOther, setContactOther] = useState(initialOther);
  const [allowContact, setAllowContact] = useState(initialAllowContact);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const res = await fetch("/api/profile/contact", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact_email: contactEmail,
          contact_phone: contactPhone,
          contact_linkedin: contactLinkedin,
          contact_other: contactOther,
          allow_contact: allowContact,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Allow contact toggle */}
      <div
        className="flex items-center justify-between gap-4 pb-4 border-b"
        style={{ borderColor: "var(--t-border-subtle)" }}
      >
        <div>
          <p
            className="text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Allow contact
          </p>
          <p
            className="text-xs mt-0.5 leading-relaxed"
            style={{ color: "var(--text-tertiary)" }}
          >
            Let Pro investors reach out when they&apos;re interested in your idea.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={allowContact}
          onClick={() => setAllowContact((v) => !v)}
          className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none shrink-0"
          style={{
            background: allowContact ? "var(--accent)" : "var(--t-border-bright)",
          }}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              allowContact ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {/* Fields */}
      <div className="space-y-3">
        {[
          { label: "Contact email", value: contactEmail, set: setContactEmail, type: "email", placeholder: "contact@example.com" },
          { label: "Phone",         value: contactPhone, set: setContactPhone, type: "tel",   placeholder: "+82 10-0000-0000", optional: true },
          { label: "LinkedIn URL",  value: contactLinkedin, set: setContactLinkedin, type: "url", placeholder: "https://linkedin.com/in/yourname", optional: true },
          { label: "Other",         value: contactOther, set: setContactOther, type: "text",  placeholder: "KakaoTalk ID, Discord, website…", optional: true },
        ].map(({ label, value, set, type, placeholder, optional }) => (
          <div key={label}>
            <label
              className="block text-xs font-semibold mb-1.5"
              style={{ color: "var(--text-secondary)" }}
            >
              {label}
              {optional && (
                <span
                  className="ml-1.5 font-normal"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  (optional)
                </span>
              )}
            </label>
            <input
              type={type}
              value={value}
              onChange={(e) => set(e.target.value)}
              placeholder={placeholder}
              className={inputClass}
              style={inputStyle}
            />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="h-9 px-4 text-sm font-semibold text-white transition-all disabled:opacity-50 hover:brightness-110"
          style={{ background: "var(--accent)" }}
        >
          {saving ? "Saving…" : "Save"}
        </button>
        {saved && (
          <span className="text-xs font-medium" style={{ color: "var(--signal-success)" }}>
            Saved
          </span>
        )}
        {error && (
          <span className="text-xs" style={{ color: "var(--signal-danger)" }}>
            {error}
          </span>
        )}
      </div>
    </div>
  );
}
