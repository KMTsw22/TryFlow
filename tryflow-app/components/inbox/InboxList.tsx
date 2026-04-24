"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Archive,
  CheckCheck,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

const SERIF = "'Fraunces', serif";
const DISPLAY = "'Inter', sans-serif";

export interface InboxRequest {
  id: string;
  status: "unread" | "read" | "archived";
  subject: string;
  message: string;
  createdAt: string;
  createdAgo: string;
  vc: {
    id: string;
    name: string;
    email: string | null;
    avatarUrl: string | null;
  };
  idea: {
    id: string;
    category: string;
    categoryAccent: string;
    targetUser: string;
  } | null;
}

interface Props {
  requests: InboxRequest[];
}

/**
 * InboxList — Founder 가 받은 contact_requests 를 보여주는 리스트.
 *
 * 상호작용:
 *   - 카드 클릭 → 확장 (message 전체 + actions)
 *   - 확장 시 자동으로 unread → read (API PATCH)
 *   - "Reply via email" → Gmail 작성창 (mailto 또는 Gmail URL)
 *   - "Archive" → API PATCH + 목록에서 optimistic 제거
 */
export function InboxList({ requests: initial }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [requests, setRequests] = useState<InboxRequest[]>(initial);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function patchStatus(id: string, status: "read" | "archived" | "unread") {
    try {
      const res = await fetch(`/api/contact-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
    } catch (err) {
      console.error("Inbox PATCH failed:", err);
      toast.show({ message: "Couldn't update — please try again.", tone: "danger" });
    }
  }

  function handleExpand(req: InboxRequest) {
    const next = expandedId === req.id ? null : req.id;
    setExpandedId(next);
    // 펼치는 순간 unread → read (optimistic + async PATCH)
    if (next && req.status === "unread") {
      setRequests((prev) =>
        prev.map((r) => (r.id === req.id ? { ...r, status: "read" as const } : r))
      );
      startTransition(async () => {
        await patchStatus(req.id, "read");
        router.refresh();
      });
    }
  }

  async function handleArchive(req: InboxRequest) {
    // optimistic 목록에서 제거
    setRequests((prev) => prev.filter((r) => r.id !== req.id));
    if (expandedId === req.id) setExpandedId(null);
    await patchStatus(req.id, "archived");
    toast.show({ message: "Archived.", tone: "info" });
    router.refresh();
  }

  function handleReply(req: InboxRequest) {
    if (!req.vc.email) {
      toast.show({
        message: "Can't find a reply address for this investor.",
        tone: "danger",
      });
      return;
    }
    const quoted = req.message
      .split("\n")
      .slice(0, 6)
      .map((line) => `> ${line}`)
      .join("\n");
    const body = `\n\n---\nOn ${new Date(req.createdAt).toLocaleString()}, ${req.vc.name} wrote:\n${quoted}`;
    const gmailUrl =
      `https://mail.google.com/mail/?view=cm` +
      `&to=${encodeURIComponent(req.vc.email)}` +
      `&su=${encodeURIComponent(`Re: ${req.subject}`)}` +
      `&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, "_blank", "noopener,noreferrer");
    toast.show({ message: "Opened reply in Gmail.", tone: "success" });
  }

  if (requests.length === 0) {
    return (
      <p
        className="text-[14px] py-8 italic"
        style={{ color: "var(--text-tertiary)", fontFamily: SERIF }}
      >
        All caught up — no active conversations.
      </p>
    );
  }

  return (
    <ol
      className="border-t"
      style={{ borderColor: "var(--t-border-subtle)" }}
    >
      {requests.map((req) => {
        const isExpanded = expandedId === req.id;
        const isUnread = req.status === "unread";
        return (
          <li
            key={req.id}
            className="border-b transition-colors"
            style={{
              borderColor: "var(--t-border-subtle)",
              background: isExpanded ? "var(--accent-soft)" : "transparent",
            }}
          >
            {/* Collapsed row (clickable) */}
            <button
              type="button"
              onClick={() => handleExpand(req)}
              aria-expanded={isExpanded}
              className="w-full grid grid-cols-[auto_1fr_auto] items-center gap-5 text-left py-4 px-4"
            >
              {/* Unread indicator — 좌측 작은 dot */}
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{
                  background: isUnread ? "var(--accent)" : "transparent",
                  boxShadow: isUnread ? "0 0 0 2px var(--accent-ring)" : "none",
                }}
                aria-label={isUnread ? "Unread" : "Read"}
              />

              {/* Content */}
              <div className="min-w-0">
                <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                  <span
                    className="truncate"
                    style={{
                      fontFamily: SERIF,
                      fontWeight: isUnread ? 700 : 600,
                      fontSize: "1.05rem",
                      letterSpacing: "-0.01em",
                      color: "var(--text-primary)",
                      opacity: isUnread ? 1 : 0.85,
                    }}
                  >
                    {req.vc.name}
                  </span>
                  {req.idea && (
                    <span
                      className="inline-flex items-center gap-1.5 text-[11.5px] font-medium tracking-[0.06em] uppercase shrink-0"
                      style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
                    >
                      <span
                        className="w-1 h-1 rounded-full"
                        style={{ background: req.idea.categoryAccent }}
                        aria-hidden
                      />
                      {req.idea.category} · For {truncate(req.idea.targetUser, 32)}
                    </span>
                  )}
                </div>
                <p
                  className="truncate text-[13.5px]"
                  style={{ color: "var(--text-secondary)", opacity: isUnread ? 1 : 0.75 }}
                >
                  <span style={{ fontWeight: isUnread ? 600 : 500 }}>{req.subject}</span>
                  <span className="mx-2" style={{ color: "var(--t-border-bright)" }}>
                    ·
                  </span>
                  {truncate(req.message, 110)}
                </p>
              </div>

              {/* Time + chevron */}
              <div className="flex items-center gap-3 shrink-0">
                <span
                  className="text-[11.5px] font-medium tracking-[0.06em] uppercase tabular-nums"
                  style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
                >
                  {req.createdAgo}
                </span>
                <ChevronDown
                  className="w-3.5 h-3.5 transition-transform"
                  strokeWidth={2}
                  style={{
                    color: "var(--text-tertiary)",
                    transform: isExpanded ? "rotate(180deg)" : undefined,
                  }}
                />
              </div>
            </button>

            {/* Expanded panel */}
            {isExpanded && (
              <div className="px-4 pb-6" style={{ paddingLeft: 44 /* dot offset 맞춤 */ }}>
                <p
                  className="text-[15px] leading-[1.75] whitespace-pre-line mb-6"
                  style={{ color: "var(--text-primary)" }}
                >
                  {req.message}
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleReply(req)}
                    disabled={!req.vc.email}
                    className="inline-flex items-center gap-2 px-4 py-2 text-[12.5px] font-bold tracking-[0.08em] uppercase text-white transition-[filter] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ fontFamily: DISPLAY, background: "var(--accent)" }}
                  >
                    <ExternalLink className="w-3.5 h-3.5" strokeWidth={2.25} />
                    Reply via Gmail
                  </button>

                  {req.idea && (
                    <Link
                      href={`/ideas/${req.idea.id}`}
                      className="inline-flex items-center gap-1.5 text-[12.5px] font-medium tracking-[0.06em] uppercase transition-opacity hover:opacity-70"
                      style={{ fontFamily: DISPLAY, color: "var(--text-secondary)" }}
                    >
                      Open idea
                      <ArrowRight className="w-3 h-3" strokeWidth={2} />
                    </Link>
                  )}

                  <span aria-hidden style={{ color: "var(--t-border-bright)" }}>·</span>

                  <button
                    type="button"
                    onClick={() => {
                      setRequests((prev) =>
                        prev.map((r) =>
                          r.id === req.id ? { ...r, status: "unread" as const } : r
                        )
                      );
                      startTransition(async () => {
                        await patchStatus(req.id, "unread");
                      });
                    }}
                    className="inline-flex items-center gap-1.5 text-[12.5px] font-medium tracking-[0.06em] uppercase transition-opacity hover:opacity-70"
                    style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
                  >
                    <CheckCheck className="w-3.5 h-3.5" strokeWidth={2} />
                    Mark unread
                  </button>
                  <button
                    type="button"
                    onClick={() => handleArchive(req)}
                    className="inline-flex items-center gap-1.5 text-[12.5px] font-medium tracking-[0.06em] uppercase transition-opacity hover:opacity-70"
                    style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
                  >
                    <Archive className="w-3.5 h-3.5" strokeWidth={2} />
                    Archive
                  </button>
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function truncate(text: string, max: number) {
  return text.length > max ? text.slice(0, max).trimEnd() + "…" : text;
}
