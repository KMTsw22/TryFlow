"use client";

import { useState } from "react";
import { X, Loader2, Mail, Phone, Linkedin, Link } from "lucide-react";

interface ContactInfo {
  email: string;
  phone: string | null;
  linkedin: string | null;
  other: string | null;
}

interface Props {
  ideaId: string;
  category: string;
  onClose: () => void;
}

export function ContactModal({ ideaId, category, onClose }: Props) {
  const [subject, setSubject] = useState(`[TryWepp] Interested in your ${category} idea`);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);

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
        setError(data.error ?? "An error occurred. Please try again.");
        return;
      }
      setContactInfo(data.contactInfo);
      window.open(data.gmailUrl, "_blank");
    } catch {
      setError("A network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-lg"
        style={{ background: "var(--sidebar-bg)", border: "1px solid var(--t-border-bright)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid var(--t-border)" }}
        >
          <div>
            <p className="text-xs font-bold tracking-widest text-indigo-400 uppercase mb-0.5">Contact</p>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">{category}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-4">
          {contactInfo ? (
            <div className="space-y-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Gmail has been opened. You can also reach out through the additional channels below.
              </p>
              <div className="space-y-2">
                {contactInfo.email && (
                  <a
                    href={`mailto:${contactInfo.email}`}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                    style={{ background: "var(--input-bg)", border: "1px solid var(--t-input-border)" }}
                  >
                    <Mail className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span className="truncate">{contactInfo.email}</span>
                  </a>
                )}
                {contactInfo.phone && (
                  <a
                    href={`tel:${contactInfo.phone}`}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                    style={{ background: "var(--input-bg)", border: "1px solid var(--t-input-border)" }}
                  >
                    <Phone className="w-4 h-4 text-green-400 shrink-0" />
                    <span>{contactInfo.phone}</span>
                  </a>
                )}
                {contactInfo.linkedin && (
                  <a
                    href={contactInfo.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-4 py-3 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                    style={{ background: "var(--input-bg)", border: "1px solid var(--t-input-border)" }}
                  >
                    <Linkedin className="w-4 h-4 text-blue-400 shrink-0" />
                    <span className="truncate">{contactInfo.linkedin}</span>
                  </a>
                )}
                {contactInfo.other && (
                  <div
                    className="flex items-center gap-3 px-4 py-3 text-sm text-gray-600 dark:text-gray-300"
                    style={{ background: "var(--input-bg)", border: "1px solid var(--t-input-border)" }}
                  >
                    <Link className="w-4 h-4 text-pink-400 shrink-0" />
                    <span>{contactInfo.other}</span>
                  </div>
                )}
              </div>
              <div className="flex justify-end pt-1">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Write your message and click <strong className="text-gray-600 dark:text-gray-300">Open in Gmail</strong> to open the Gmail compose window with everything pre-filled.
              </p>

              {/* Subject */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  style={{ background: "var(--input-bg)", border: "1px solid var(--t-input-border)" }}
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  placeholder="Hi, I'm [name] from [company]. I came across your idea and would love to connect..."
                  className="w-full px-4 py-2.5 text-sm text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                  style={{ background: "var(--input-bg)", border: "1px solid var(--t-input-border)" }}
                />
              </div>

              {error && <p className="text-xs text-red-400 font-medium">{error}</p>}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleOpenGmail}
                  disabled={loading || !subject.trim() || !message.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                  style={{ background: "linear-gradient(90deg, #6366f1, #8b5cf6)" }}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      Open in Gmail
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
