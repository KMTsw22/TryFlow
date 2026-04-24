import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ArrowRight, Mail } from "lucide-react";
import { InboxList, type InboxRequest } from "@/components/inbox/InboxList";
import { getCategoryTheme, timeAgo } from "@/lib/categories";

const SERIF = "'Fraunces', serif";
const DISPLAY = "'Inter', sans-serif";

/**
 * /inbox — Founder 의 받은 VC intro 요청 리스트.
 *
 * 2026-04 포지셔닝: TryFlow 는 "아이디어 단계 VC-Founder 매칭 플랫폼".
 * Founder 는 여기서 "어느 VC 가 내 아이디어에 관심 가졌는지" 확인하고 답장 가능.
 *
 * 설계:
 *   - 에디토리얼 톤 (매거진 스타일) 유지
 *   - Unread 카드: 상단 좌측에 작은 액센트 색 인디케이터
 *   - Read: 옅은 톤
 *   - Archive: 목록에서 숨김 (필터로 복구 가능)
 *   - 각 카드 클릭 → 확장 (accordion), "Reply via Gmail" CTA
 */

interface RawRow {
  id: string;
  vc_user_id: string;
  submission_id: string;
  subject: string;
  message: string;
  status: "unread" | "read" | "archived";
  created_at: string;
  read_at: string | null;
  archived_at: string | null;
}

interface VcProfile {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
}

interface IdeaStub {
  id: string;
  category: string;
  target_user: string;
}

export default async function InboxPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/inbox");

  // Archived 제외, 최신순으로
  const { data: rawRequests } = await supabase
    .from("contact_requests")
    .select("id, vc_user_id, submission_id, subject, message, status, created_at, read_at, archived_at")
    .eq("founder_user_id", user.id)
    .neq("status", "archived")
    .order("created_at", { ascending: false })
    .limit(100);

  const requests = (rawRequests ?? []) as RawRow[];

  // 보낸 VC 프로필들 + 관련 아이디어 스텁 병렬 조회 (N+1 방지)
  const vcIds = Array.from(new Set(requests.map((r) => r.vc_user_id)));
  const submissionIds = Array.from(new Set(requests.map((r) => r.submission_id)));

  const [{ data: vcProfiles }, { data: ideas }] = await Promise.all([
    vcIds.length > 0
      ? supabase
          .from("user_profiles")
          .select("id, full_name, email, avatar_url")
          .in("id", vcIds)
      : Promise.resolve({ data: [] as VcProfile[] }),
    submissionIds.length > 0
      ? supabase
          .from("idea_submissions")
          .select("id, category, target_user")
          .in("id", submissionIds)
      : Promise.resolve({ data: [] as IdeaStub[] }),
  ]);

  const vcMap = new Map<string, VcProfile>();
  for (const p of vcProfiles ?? []) vcMap.set((p as VcProfile).id, p as VcProfile);

  const ideaMap = new Map<string, IdeaStub>();
  for (const i of ideas ?? []) ideaMap.set((i as IdeaStub).id, i as IdeaStub);

  const enriched: InboxRequest[] = requests.map((r) => {
    const vc = vcMap.get(r.vc_user_id);
    const idea = ideaMap.get(r.submission_id);
    return {
      id: r.id,
      status: r.status,
      subject: r.subject,
      message: r.message,
      createdAt: r.created_at,
      createdAgo: timeAgo(r.created_at),
      vc: {
        id: r.vc_user_id,
        name: vc?.full_name ?? "Anonymous investor",
        email: vc?.email ?? null,
        avatarUrl: vc?.avatar_url ?? null,
      },
      idea: idea
        ? {
            id: idea.id,
            category: idea.category,
            categoryAccent: getCategoryTheme(idea.category).accent,
            targetUser: idea.target_user,
          }
        : null,
    };
  });

  const unreadCount = enriched.filter((r) => r.status === "unread").length;

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* Editorial kicker */}
      <div className="flex items-center gap-4 mb-6">
        <span
          className="inline-flex items-center gap-2 text-[15px] font-medium tracking-[0.08em] uppercase"
          style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
        >
          <Mail className="w-3.5 h-3.5" style={{ color: "var(--accent)" }} strokeWidth={2} />
          Inbox
        </span>
        <span className="flex-1 h-px" style={{ background: "var(--t-border-subtle)" }} />
        {unreadCount > 0 ? (
          <span
            className="text-[15px] font-medium tracking-[0.06em] uppercase shrink-0"
            style={{ fontFamily: DISPLAY, color: "var(--accent)" }}
          >
            {unreadCount} unread
          </span>
        ) : (
          <span
            className="text-[15px] font-medium tracking-[0.06em] uppercase shrink-0"
            style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
          >
            {enriched.length} total
          </span>
        )}
      </div>

      <h1
        className="mb-4"
        style={{
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: "clamp(2.5rem, 5vw, 4rem)",
          lineHeight: 1.02,
          letterSpacing: "-0.03em",
          color: "var(--text-primary)",
        }}
      >
        {enriched.length === 0
          ? "No conversations yet."
          : unreadCount > 0
          ? "Investors want to talk."
          : "Your conversations."}
      </h1>

      <p
        className="text-[15.5px] leading-[1.7] mb-10 max-w-2xl"
        style={{ color: "var(--text-secondary)" }}
      >
        {enriched.length === 0
          ? "When a Pro investor reaches out about one of your ideas, you'll see the request here. Make sure your contact setting is open in any idea's Visibility panel."
          : `Every time a Pro investor expresses interest in one of your ideas, the request lands here. Reply via your email, mark as read, or archive.`}
      </p>

      {enriched.length === 0 ? (
        <EmptyState />
      ) : (
        <InboxList requests={enriched} />
      )}
    </div>
  );
}

function EmptyState() {
  // 2026-04: 공급 현실을 정직하게 말함. "그냥 기다리세요" 가 아니라 3가지
  // 구체적 액션을 준다 — visibility · 제출 cadence · 연락 가능 세팅.
  const steps: { num: string; title: string; desc: string }[] = [
    {
      num: "01",
      title: "Make it public",
      desc: "Private ideas never reach investors. Flip Visibility to public from any idea's report.",
    },
    {
      num: "02",
      title: "Open to contact",
      desc: "In any idea's settings, turn Contact on. Without it, investors see you but cannot reach you.",
    },
    {
      num: "03",
      title: "Submit again",
      desc: "Investors scan the Market daily. More signals, more surface area — iterate, don't just wait.",
    },
  ];

  return (
    <div
      className="border-t border-b py-14"
      style={{ borderColor: "var(--t-border-subtle)" }}
    >
      <p
        className="leading-[1.15] mb-6 max-w-xl"
        style={{
          fontFamily: SERIF,
          fontStyle: "italic",
          fontWeight: 400,
          fontSize: "clamp(1.35rem, 2.5vw, 1.9rem)",
          letterSpacing: "-0.01em",
          color: "var(--text-primary)",
        }}
      >
        &ldquo;Your ideas are silent until they&apos;re seen.&rdquo;
      </p>
      <p
        className="text-[14.5px] leading-[1.7] mb-10 max-w-xl"
        style={{ color: "var(--text-secondary)" }}
      >
        Inbox fills up when Pro investors find your idea compelling. That
        depends on three things you control:
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-10 gap-y-8 mb-12 max-w-3xl">
        {steps.map((s) => (
          <div key={s.num}>
            <span
              className="tabular-nums leading-none block mb-3"
              style={{
                fontFamily: SERIF,
                fontWeight: 900,
                fontSize: "2.25rem",
                letterSpacing: "-0.03em",
                color: "var(--text-tertiary)",
              }}
            >
              {s.num}
            </span>
            <p
              className="text-[14px] font-medium tracking-[0.08em] uppercase mb-2"
              style={{ fontFamily: DISPLAY, color: "var(--text-primary)" }}
            >
              {s.title}
            </p>
            <p
              className="text-[13.5px] leading-[1.65]"
              style={{ color: "var(--text-tertiary)" }}
            >
              {s.desc}
            </p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-8 flex-wrap">
        <Link
          href="/dashboard"
          className="group inline-flex items-center gap-2 text-[13px] font-medium tracking-[0.16em] uppercase transition-opacity hover:opacity-70"
          style={{ fontFamily: DISPLAY, color: "var(--text-primary)" }}
        >
          Open my ideas
          <ArrowRight
            className="w-3 h-3 transition-transform group-hover:translate-x-1"
            strokeWidth={2}
          />
        </Link>
        <Link
          href="/submit"
          className="group inline-flex items-center gap-2 text-[13px] font-medium tracking-[0.16em] uppercase transition-opacity hover:opacity-70"
          style={{ fontFamily: DISPLAY, color: "var(--accent)" }}
        >
          Submit a new idea
          <ArrowRight
            className="w-3 h-3 transition-transform group-hover:translate-x-1"
            strokeWidth={2}
          />
        </Link>
      </div>
    </div>
  );
}
