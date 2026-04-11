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
  const [subject, setSubject] = useState(`[TryWepp] ${category} 아이디어에 관심이 있습니다`);
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
        setError(data.error ?? "오류가 발생했습니다. 다시 시도해주세요.");
        return;
      }
      setContactInfo(data.contactInfo);
      window.open(data.gmailUrl, "_blank");
    } catch {
      setError("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
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
        style={{ background: "#0d1225", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div>
            <p className="text-xs font-bold tracking-widest text-indigo-400 uppercase mb-0.5">연락하기</p>
            <h2 className="text-sm font-bold text-white">{category}</h2>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-4">
          {contactInfo ? (
            /* 연락처 확인 단계 */
            <div className="space-y-4">
              <p className="text-xs text-gray-400 leading-relaxed">
                Gmail이 열렸습니다. 아래의 추가 연락수단도 확인할 수 있습니다.
              </p>
              <div className="space-y-2">
                {contactInfo.email && (
                  <a
                    href={`mailto:${contactInfo.email}`}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:text-white transition-colors"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <Mail className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span className="truncate">{contactInfo.email}</span>
                  </a>
                )}
                {contactInfo.phone && (
                  <a
                    href={`tel:${contactInfo.phone}`}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:text-white transition-colors"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
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
                    className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:text-white transition-colors"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <Linkedin className="w-4 h-4 text-blue-400 shrink-0" />
                    <span className="truncate">{contactInfo.linkedin}</span>
                  </a>
                )}
                {contactInfo.other && (
                  <div
                    className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <Link className="w-4 h-4 text-pink-400 shrink-0" />
                    <span>{contactInfo.other}</span>
                  </div>
                )}
              </div>
              <div className="flex justify-end pt-1">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          ) : (
            /* 메시지 작성 단계 */
            <>
              <p className="text-xs text-gray-500 leading-relaxed">
                제목과 내용을 작성 후 <strong className="text-gray-400">Gmail로 열기</strong>를 누르면
                Gmail 작성 창이 열립니다. 받는 사람·제목·내용이 자동으로 채워집니다.
              </p>

              {/* Subject */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">제목</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">내용</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  placeholder="안녕하세요. 저는 [회사명]의 [이름]입니다. 귀하의 아이디어에 관심이 있어 연락드립니다..."
                  className="w-full px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                />
              </div>

              {error && <p className="text-xs text-red-400 font-medium">{error}</p>}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
                >
                  취소
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
                      Gmail로 열기
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
