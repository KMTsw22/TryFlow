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
        style={{ background: "rgba(99,102,241,0.05)", borderColor: "rgba(99,102,241,0.2)" }}
      >
        <Lock className="w-5 h-5 text-indigo-400 mx-auto mb-2" />
        <p className="text-sm font-bold text-white mb-1">Pro subscription required to contact submitters</p>
        <p className="text-xs text-gray-500 mb-4">Subscribers can reach out directly to submitters of ideas they&apos;re interested in.</p>
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white"
          style={{ background: "linear-gradient(90deg, #6366f1, #8b5cf6)" }}
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
        <p className="text-xs text-gray-400 text-center">This submitter has not enabled contact.</p>
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
      style={{ background: "rgba(99,102,241,0.04)", borderColor: "rgba(129,140,248,0.25)" }}
    >
      <div
        className="px-6 py-4 border-b flex items-center gap-2"
        style={{ borderColor: "rgba(129,140,248,0.15)" }}
      >

        <Mail className="w-4 h-4 text-indigo-400" />
        <p className="text-sm font-bold text-gray-900 dark:text-white">Contact the Submitter</p>
      </div>

      <div className="px-6 py-5 space-y-4">
        {sent ? (
          <div className="text-center py-4">
            <p className="text-sm font-bold text-emerald-400 mb-1">Gmail opened.</p>
            <p className="text-xs text-gray-500 dark:text-gray-500">The recipient, subject, and message have been pre-filled.</p>
            <button
              onClick={() => setSent(false)}
              className="mt-4 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Write again
            </button>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Click <strong className="text-gray-600 dark:text-gray-400">Open in Gmail</strong> after writing to open the Gmail compose window.
            </p>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-2.5 text-sm text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none"
                style={{ background: "var(--input-bg)", border: "1px solid var(--t-input-border)" }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="Hi, I'm [name] from [company]. I came across your idea and would love to connect..."
                className="w-full px-4 py-2.5 text-sm text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none resize-none"
                style={{ background: "var(--input-bg)", border: "1px solid var(--t-input-border)" }}
              />
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <div className="flex justify-end">
              <button
                onClick={handleOpenGmail}
                disabled={loading || !subject.trim() || !message.trim()}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                style={{ background: "linear-gradient(90deg, #6366f1, #8b5cf6)" }}
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
