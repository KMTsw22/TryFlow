"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

interface Props {
  userId: string;
  initialBio: string;
  initialLinkedin: string;
  initialTwitter: string;
  initialGithub: string;
  initialWebsite: string;
  initialAnonymous: boolean;
}

const BIO_MAX = 100;

const inputClass =
  "w-full border h-9 px-3 text-sm outline-none transition-colors focus:border-[color:var(--accent)]";

const inputStyle = {
  background: "var(--input-bg)",
  borderColor: "var(--t-input-border)",
  color: "var(--text-primary)",
};

const labelStyle = { color: "var(--text-tertiary)" };

/**
 * PublicProfileForm — settings/profile 의 공개 프로필 편집 섹션.
 *
 * 짧은 글자수 (한 줄 소개 100 chars) + URL 4개 슬롯 + 익명 토글.
 * 익명이 켜져있으면 공개 페이지 (/u/[id]) 에서 bio·SNS 링크 노출 안 됨.
 */
export function PublicProfileForm({
  userId,
  initialBio,
  initialLinkedin,
  initialTwitter,
  initialGithub,
  initialWebsite,
  initialAnonymous,
}: Props) {
  const [bio, setBio] = useState(initialBio);
  const [linkedin, setLinkedin] = useState(initialLinkedin);
  const [twitter, setTwitter] = useState(initialTwitter);
  const [github, setGithub] = useState(initialGithub);
  const [website, setWebsite] = useState(initialWebsite);
  const [anonymous, setAnonymous] = useState(initialAnonymous);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio,
          linkedin_url: linkedin,
          twitter_url: twitter,
          github_url: github,
          website_url: website,
          profile_anonymous: anonymous,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to save");
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const charsLeft = BIO_MAX - bio.length;
  const overLimit = charsLeft < 0;

  return (
    <div className="space-y-5">
      {/* Anonymity toggle — 가장 위에 둬서 결정 먼저 */}
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={!anonymous}
          onChange={(e) => setAnonymous(!e.target.checked)}
          className="mt-0.5 h-4 w-4 cursor-pointer accent-[color:var(--accent)]"
        />
        <div className="flex-1">
          <span
            className="block text-sm font-medium"
            style={{ color: "var(--text-primary)" }}
          >
            Show my public profile
          </span>
          <span
            className="block text-xs mt-0.5 leading-relaxed"
            style={{ color: "var(--text-tertiary)" }}
          >
            When off, the page at{" "}
            <Link
              href={`/u/${userId}`}
              className="underline hover:opacity-70"
              style={{ color: "var(--accent)" }}
            >
              /u/{userId.slice(0, 8)}…
            </Link>{" "}
            shows nothing but a placeholder. Your name, bio and links stay private.
          </span>
        </div>
      </label>

      {/* Bio */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-medium" style={labelStyle}>
            One-line bio
          </label>
          <span
            className="text-[11px] tabular-nums"
            style={{ color: overLimit ? "var(--signal-danger)" : "var(--text-tertiary)" }}
          >
            {charsLeft}
          </span>
        </div>
        <input
          type="text"
          value={bio}
          maxLength={BIO_MAX + 30}
          onChange={(e) => setBio(e.target.value)}
          placeholder="ex) Healthcare ops 3yrs · 2 failed SaaS · now building B2B coverage tools"
          className={inputClass}
          style={inputStyle}
        />
      </div>

      {/* SNS slots — 4개 정해진 슬롯 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <UrlSlot
          label="LinkedIn"
          placeholder="linkedin.com/in/yourname"
          value={linkedin}
          onChange={setLinkedin}
        />
        <UrlSlot
          label="Twitter / X"
          placeholder="x.com/yourname"
          value={twitter}
          onChange={setTwitter}
        />
        <UrlSlot
          label="GitHub"
          placeholder="github.com/yourname"
          value={github}
          onChange={setGithub}
        />
        <UrlSlot
          label="Website"
          placeholder="yourname.com"
          value={website}
          onChange={setWebsite}
        />
      </div>

      {/* Save bar */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-3">
          <Link
            href={`/u/${userId}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-70"
            style={{ color: "var(--text-tertiary)" }}
          >
            <ExternalLink className="w-3 h-3" strokeWidth={2} />
            Preview public page
          </Link>
          {saved && (
            <span className="text-xs" style={{ color: "var(--signal-success)" }}>
              Saved
            </span>
          )}
          {error && (
            <span className="text-xs" style={{ color: "var(--signal-danger)" }}>
              {error}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || overLimit}
          className="h-9 px-4 text-xs font-semibold text-white transition-opacity disabled:opacity-50 hover:opacity-90"
          style={{ background: "var(--accent)" }}
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

function UrlSlot({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={labelStyle}>
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={300}
        className={inputClass}
        style={inputStyle}
      />
    </div>
  );
}
