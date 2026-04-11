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
  const [subject, setSubject] = useState(`[TryWepp] ${category} 아이디어에 관심이 있습니다`);
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
        <p className="text-sm font-bold text-white mb-1">제출자에게 연락하려면 Pro 구독이 필요합니다</p>
        <p className="text-xs text-gray-500 mb-4">구독자는 관심 있는 아이디어 제출자에게 바로 연락할 수 있습니다.</p>
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white"
          style={{ background: "linear-gradient(90deg, #6366f1, #8b5cf6)" }}
        >
          Pro 구독하기 →
        </Link>
      </div>
    );
  }

  if (!canContact) {
    return (
      <div
        className="mt-6 p-5 border"
        style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.07)" }}
      >
        <p className="text-xs text-gray-600 text-center">이 제출자는 연락을 허용하지 않았습니다.</p>
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
        setError(data.error ?? "오류가 발생했습니다.");
        return;
      }
      window.open(data.gmailUrl, "_blank");
      setSent(true);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
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
        <p className="text-sm font-bold text-white">제출자에게 연락하기</p>
      </div>

      <div className="px-6 py-5 space-y-4">
        {sent ? (
          <div className="text-center py-4">
            <p className="text-sm font-bold text-emerald-400 mb-1">Gmail이 열렸습니다.</p>
            <p className="text-xs text-gray-500">받는 사람·제목·내용이 자동으로 채워집니다.</p>
            <button
              onClick={() => setSent(false)}
              className="mt-4 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              다시 작성하기
            </button>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-500">
              작성 후 <strong className="text-gray-400">Gmail로 열기</strong>를 누르면 Gmail 작성 창이 열립니다.
            </p>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">제목</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">내용</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="안녕하세요. 저는 [회사명]의 [이름]입니다. 귀하의 아이디어에 관심이 있어 연락드립니다..."
                className="w-full px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none resize-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
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
                Gmail로 열기
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
