"use client";

import { useState } from "react";

interface Props {
  initialEmail: string;
  initialPhone: string;
  initialLinkedin: string;
  initialOther: string;
  initialAllowContact: boolean;
}

const inputClass = "w-full border px-3 py-2.5 text-sm text-gray-300 placeholder-gray-600 outline-none focus:border-indigo-500/50 transition-colors";
const inputStyle = { background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" };

export function ContactInfoForm({ initialEmail, initialPhone, initialLinkedin, initialOther, initialAllowContact }: Props) {
  const [contactEmail, setContactEmail] = useState(initialEmail);
  const [contactPhone, setContactPhone] = useState(initialPhone);
  const [contactLinkedin, setContactLinkedin] = useState(initialLinkedin);
  const [contactOther, setContactOther] = useState(initialOther);
  const [allowContact, setAllowContact] = useState(initialAllowContact);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setSaving(true); setSaved(false); setError("");
    try {
      const res = await fetch("/api/profile/contact", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact_email: contactEmail, contact_phone: contactPhone, contact_linkedin: contactLinkedin, contact_other: contactOther, allow_contact: allowContact }),
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
    <div className="space-y-4">
      {/* Allow contact toggle */}
      <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <div>
          <p className="text-sm font-medium text-gray-300">Allow Contact</p>
          <p className="text-xs text-gray-600 mt-0.5">Let subscribers (VCs/companies) contact you when interested in your idea.</p>
        </div>
        <button type="button" onClick={() => setAllowContact((v) => !v)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none shrink-0 ml-4 ${allowContact ? "bg-indigo-500" : "bg-gray-700"}`}>
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${allowContact ? "translate-x-6" : "translate-x-1"}`} />
        </button>
      </div>

      {/* Fields */}
      <div className="space-y-3">
        {[
          { label: "Contact Email", value: contactEmail, set: setContactEmail, type: "email", placeholder: "contact@example.com" },
          { label: "Phone (optional)", value: contactPhone, set: setContactPhone, type: "tel", placeholder: "+82 10-0000-0000" },
          { label: "LinkedIn URL (optional)", value: contactLinkedin, set: setContactLinkedin, type: "url", placeholder: "https://linkedin.com/in/yourname" },
          { label: "Other (optional)", value: contactOther, set: setContactOther, type: "text", placeholder: "KakaoTalk ID, Discord, etc." },
        ].map(({ label, value, set, type, placeholder }) => (
          <div key={label}>
            <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
            <input type={type} value={value} onChange={(e) => set(e.target.value)}
              placeholder={placeholder} className={inputClass} style={inputStyle} />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button onClick={handleSave} disabled={saving}
          className="text-sm font-bold bg-indigo-500 text-white px-5 py-2.5 hover:bg-indigo-400 transition-colors disabled:opacity-50">
          {saving ? "Saving..." : "Save"}
        </button>
        {saved && <span className="text-xs text-emerald-400 font-medium">Saved!</span>}
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>
    </div>
  );
}
