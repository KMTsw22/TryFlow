"use client";

import { useState } from "react";
import { Mail, Loader2, Lock, Send, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";

const SERIF = "'Fraunces', serif";
const DISPLAY = "'Inter', sans-serif";

interface Props {
  ideaId: string;
  category: string;
  canContact: boolean; // Pro + 제출자 연락 허용
  isSubscriber: boolean;
}

/**
 * ContactSection — VC 가 Founder 에게 intro 메시지를 보내는 섹션.
 *
 * 2026-04 update:
 *   - API 가 contact_requests 테이블에 INSERT → Founder /inbox 에서 확인 가능
 *   - Gmail URL 은 보조 (실제 전송은 Gmail 통해서)
 *   - 에디토리얼 톤 + 토스트 피드백
 *   - 메시지 3–20–4000 자 유효성 (서버 mirrored)
 */
export function ContactSection({ ideaId, category, canContact, isSubscriber }: Props) {
  const toast = useToast();
  const [subject, setSubject] = useState(`Interested in your ${category} idea`);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  // Non-Pro 사용자 — 업그레이드 유도 paywall
  if (!isSubscriber) {
    return (
      <section
        aria-label="Contact submitter — Pro required"
        className="mt-6 px-6 py-7 border"
        style={{ background: "var(--accent-soft)", borderColor: "var(--accent-ring)" }}
      >
        <div className="flex items-center gap-3 mb-4">
          <Lock className="w-3.5 h-3.5" style={{ color: "var(--accent)" }} strokeWidth={2} />
          <span
            className="text-[11px] font-bold tracking-[0.08em] uppercase"
            style={{ fontFamily: DISPLAY, color: "var(--accent)" }}
          >
            Pro only
          </span>
          <span className="flex-1 h-px" style={{ background: "var(--accent-ring)" }} />
        </div>
        <p
          className="leading-[1.3] mb-3 max-w-lg"
          style={{
            fontFamily: SERIF,
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: "clamp(1.2rem, 2.2vw, 1.5rem)",
            letterSpacing: "-0.01em",
            color: "var(--text-primary)",
          }}
        >
          &ldquo;Reach the founder before the product exists.&rdquo;
        </p>
        <p
          className="text-[14px] leading-[1.65] mb-5 max-w-lg"
          style={{ color: "var(--text-secondary)" }}
        >
          Pro unlocks direct contact with submitters. Reach out with a short note,
          and your request goes to their inbox.
        </p>
        <Link
          href="/pricing"
          className="group inline-flex items-center gap-2 px-5 py-2.5 text-[12.5px] font-bold tracking-[0.08em] uppercase text-white transition-[filter] hover:brightness-110"
          style={{ fontFamily: DISPLAY, background: "var(--accent)" }}
        >
          Upgrade to Pro
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
        </Link>
      </section>
    );
  }

  // Founder가 연락 닫아둔 경우
  if (!canContact) {
    return (
      <section
        aria-label="Contact unavailable"
        className="mt-6 px-6 py-5 border"
        style={{ background: "var(--card-bg)", borderColor: "var(--t-border-card)" }}
      >
        <div className="flex items-center gap-3">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "var(--text-tertiary)" }}
            aria-hidden
          />
          <p
            className="text-[13px]"
            style={{ color: "var(--text-tertiary)" }}
          >
            This founder is not accepting contact right now.
          </p>
        </div>
      </section>
    );
  }

  const subjectOk = subject.trim().length >= 3 && subject.trim().length <= 160;
  const messageOk = message.trim().length >= 20 && message.trim().length <= 4000;
  const canSubmit = subjectOk && messageOk && !loading;

  const handleSend = async () => {
    if (!canSubmit) return;
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
        setError(data.error ?? "Could not send. Please try again.");
        toast.show({
          message: data.error ?? "Could not send. Please try again.",
          tone: "danger",
        });
        return;
      }
      // Gmail compose 창을 열고 상태 전환
      window.open(data.gmailUrl, "_blank", "noopener,noreferrer");
      setSent(true);
      toast.show({
        message: "Request logged — Gmail opened for sending.",
        tone: "success",
      });
    } catch {
      setError("Network error. Please try again.");
      toast.show({ message: "Network error. Please try again.", tone: "danger" });
    } finally {
      setLoading(false);
    }
  };

  const handleAnother = () => {
    setSent(false);
    setMessage("");
    setError("");
  };

  return (
    <section
      aria-label="Contact the founder"
      className="mt-6 border"
      style={{ background: "var(--accent-soft)", borderColor: "var(--accent-ring)" }}
    >
      {/* Editorial kicker */}
      <header
        className="px-6 py-4 border-b flex items-center gap-3"
        style={{ borderColor: "var(--accent-ring)" }}
      >
        <Mail className="w-3.5 h-3.5" style={{ color: "var(--accent)" }} strokeWidth={2} />
        <span
          className="text-[11px] font-bold tracking-[0.08em] uppercase"
          style={{ fontFamily: DISPLAY, color: "var(--accent)" }}
        >
          Reach the founder
        </span>
        <span
          className="flex-1 h-px"
          style={{ background: "var(--accent-ring)" }}
        />
        <span
          className="text-[11px] font-medium tracking-[0.06em] uppercase shrink-0"
          style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
        >
          Pro · goes to their inbox
        </span>
      </header>

      {sent ? (
        <div className="px-6 py-8 text-center">
          <CheckCircle2
            className="w-7 h-7 mx-auto mb-3"
            style={{ color: "var(--signal-success)" }}
            strokeWidth={1.75}
          />
          <p
            className="leading-[1.2] mb-2"
            style={{
              fontFamily: SERIF,
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: "clamp(1.15rem, 2vw, 1.4rem)",
              letterSpacing: "-0.01em",
              color: "var(--text-primary)",
            }}
          >
            &ldquo;Sent.&rdquo;
          </p>
          <p
            className="text-[13.5px] leading-[1.6] mb-5 max-w-md mx-auto"
            style={{ color: "var(--text-secondary)" }}
          >
            Your request was logged in the founder&apos;s inbox and Gmail opened
            a compose window with the message pre-filled. Send from Gmail to
            finish the intro.
          </p>
          <button
            type="button"
            onClick={handleAnother}
            className="text-[12px] font-medium tracking-[0.06em] uppercase transition-opacity hover:opacity-70"
            style={{ fontFamily: DISPLAY, color: "var(--accent)" }}
          >
            Write another
          </button>
        </div>
      ) : (
        <div className="px-6 py-5 space-y-4">
          <p
            className="text-[13px] leading-[1.6]"
            style={{ color: "var(--text-secondary)" }}
          >
            Introduce yourself in a line or two. What caught your attention?
            Why might you be useful to this founder? Your note lands in their
            inbox here and opens in Gmail for sending.
          </p>

          <div>
            <label
              className="block text-[11px] font-bold tracking-[0.08em] uppercase mb-1.5"
              style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
            >
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={160}
              className="w-full px-4 py-2.5 text-[14px] focus:outline-none"
              style={{
                background: "var(--input-bg)",
                border: "1px solid var(--t-input-border)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <label
                className="text-[11px] font-bold tracking-[0.08em] uppercase"
                style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
              >
                Message
              </label>
              <span
                className="text-[11px] tabular-nums"
                style={{
                  color:
                    message.trim().length < 20
                      ? "var(--text-tertiary)"
                      : message.trim().length > 4000
                      ? "var(--signal-danger)"
                      : "var(--signal-success)",
                }}
              >
                {message.trim().length} / 4000
                {message.trim().length < 20 && (
                  <span style={{ opacity: 0.7 }}> · min 20</span>
                )}
              </span>
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              maxLength={4000}
              placeholder="Hi — I'm [name] at [firm]. Your approach to [specific thing] caught my eye because..."
              className="w-full px-4 py-3 text-[14px] leading-[1.6] focus:outline-none resize-none"
              style={{
                background: "var(--input-bg)",
                border: "1px solid var(--t-input-border)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          {error && (
            <p className="text-[12px]" style={{ color: "var(--signal-danger)" }}>
              {error}
            </p>
          )}

          <div className="flex items-center justify-between gap-3">
            <p
              className="text-[11.5px]"
              style={{ color: "var(--text-tertiary)" }}
            >
              The founder sees you by name once you send from Gmail.
            </p>
            <button
              type="button"
              onClick={handleSend}
              disabled={!canSubmit}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-[12.5px] font-bold tracking-[0.08em] uppercase text-white transition-[filter] hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ fontFamily: DISPLAY, background: "var(--accent)" }}
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2} />
              ) : (
                <Send className="w-3.5 h-3.5" strokeWidth={2} />
              )}
              Send intro
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
