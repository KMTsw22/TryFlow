"use client";

import { useState } from "react";

interface Props {
  initialEmail: string;
  initialPhone: string;
  initialLinkedin: string;
  initialOther: string;
  initialAllowContact: boolean;
}

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
      setError("저장에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Allow contact toggle */}
      <div className="flex items-center justify-between py-3 border-b border-gray-100">
        <div>
          <p className="text-sm font-medium text-gray-800">연락 허용</p>
          <p className="text-xs text-gray-500 mt-0.5">
            구독자(VC/기업)가 내 아이디어에 관심을 보일 때 연락할 수 있도록 허용합니다.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAllowContact((v) => !v)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
            allowContact ? "bg-indigo-500" : "bg-gray-200"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              allowContact ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {/* Contact fields */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">연락 이메일</label>
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="contact@example.com"
            className="w-full text-sm border border-gray-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">전화번호 (선택)</label>
          <input
            type="tel"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder="+82 10-0000-0000"
            className="w-full text-sm border border-gray-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">LinkedIn URL (선택)</label>
          <input
            type="url"
            value={contactLinkedin}
            onChange={(e) => setContactLinkedin(e.target.value)}
            placeholder="https://linkedin.com/in/yourname"
            className="w-full text-sm border border-gray-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">기타 연락처 (선택)</label>
          <input
            type="text"
            value={contactOther}
            onChange={(e) => setContactOther(e.target.value)}
            placeholder="카카오톡 ID, Discord 등"
            className="w-full text-sm border border-gray-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-xs font-semibold bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          {saving ? "저장 중..." : "저장"}
        </button>
        {saved && <span className="text-xs text-green-600">저장되었습니다.</span>}
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    </div>
  );
}
