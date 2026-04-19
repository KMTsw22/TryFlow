"use client";

import { useState } from "react";
import { Mail, Loader2, Lock } from "lucide-react";
import Link from "next/link";

interface Props {
  ideaId: string;
  category: string;
  canContact: boolean;   // 구독 중 + 제출자가 연락허용
  isSubscriber: boolean;
}

export function ContactSection({ ideaId, category, canContact, isSubscriber }: Props) {
  const [subject, setSubject] = useState(`[TryWepp] Interested in your ${category} idea`);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  if (!isSubscriber) {
    return (
      <div
        className="mt-6 p-6 border text-center"
        style={{ background: "var(--accent-soft)", borderColor: "var(--accent-ring)" }}
      >
        <Lock className="w-5 h-5 mx-auto mb-2" style={{ color: "var(--accent)" }} />
        <p className="text-sm font-bold mb-1" style={{ color: "var(--text-primary)" }}>Pro subscription required to contact submitters</p>
        <p className="text-xs mb-4" style={{ color: "var(--text-secondary)" }}>Subscribers can reach out directly to submitters of ideas they&apos;re interested in.</p>
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white transition-[filter] hover:brightness-110"
          style={{ background: "var(--accent)" }}
        >
          Upgrade to Pro →
        </Link>
      </div>
    );
  }

  if (!canContact) {
    return (
      <div
        className="mt-6 p-5 border"
        style={{ background: "var(--card-bg)", borderColor: "var(--t-border-card)" }}
      >
        <p className="text-xs text-center" style={{ color: "var(--text-tertiary)" }}>This submitter has not enabled contact.</p>
      </div>
    );
  }

  const handleOpenGmail = async () => {
    if (!subject.trim() || !message.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/vc/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideaId, subject, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "An error occurred.");
        return;
      }
      window.open(data.gmailUrl, "_blank");
      setSent(true);
    } catch {
      setError("A network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="mt-6 border"
      style={{ background: "var(--accent-soft)", borderColor: "var(--accent-ring)" }}
    >
      <div
        className="px-6 py-4 border-b flex items-center gap-2"
        style={{ borderColor: "var(--t-border-subtle)" }}
      >

        <Mail className="w-4 h-4" style={{ color: "var(--accent)" }} />
        <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Contact the Submitter</p>
      </div>

      <div className="px-6 py-5 space-y-4">
        {sent ? (
          <div className="text-center py-4">
            <p className="text-sm font-bold mb-1" style={{ color: "var(--signal-success)" }}>Gmail opened.</p>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>The recipient, subject, and message have been pre-filled.</p>
            <button
              onClick={() => setSent(false)}
              className="mt-4 text-xs transition-[filter] hover:brightness-110"
              style={{ color: "var(--accent)" }}
            >
              Write again
            </button>
          </div>
        ) : (
          <>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              Click <strong style={{ color: "var(--text-secondary)" }}>Open in Gmail</strong> after writing to open the Gmail compose window.
            </p>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-tertiary)" }}>Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-2.5 text-sm focus:outline-none"
                style={{ background: "var(--input-bg)", border: "1px solid var(--t-input-border)", color: "var(--text-primary)" }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-tertiary)" }}>Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="Hi, I'm [name] from [company]. I came across your idea and would love to connect..."
                className="w-full px-4 py-2.5 text-sm focus:outline-none resize-none"
                style={{ background: "var(--input-bg)", border: "1px solid var(--t-input-border)", color: "var(--text-primary)" }}
              />
            </div>
            {error && <p className="text-xs" style={{ color: "var(--signal-danger)" }}>{error}</p>}
            <div className="flex justify-end">
              <button
                onClick={handleOpenGmail}
                disabled={loading || !subject.trim() || !message.trim()}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white transition-[filter] hover:brightness-110 disabled:opacity-40 disabled:hover:brightness-100"
                style={{ background: "var(--accent)" }}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                Open in Gmail
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
