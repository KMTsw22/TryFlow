// /judge — 심사위원 시각의 평가 대시보드.
//
// 2026-05-17 리톤: 잡지 에디토리얼 톤 → 행정 시스템 톤.
// 변경 이유: 운영 영역은 스코어러 플러스 류 "실무 시스템" 신호를 줘야 함.
//   - 카드 좌측 vertical accent stripe 제거
//   - serif/큰 숫자 strip 제거 → 한 줄 텍스트 요약
//   - uppercase letter-spacing 0.14em 라벨 제거 → 보통 sans
//   - 출품 행을 카드 → 테이블 행으로 변환 (border-bottom hairline)
//   - "평가하기 →" 텍스트 CTA → 표준 버튼 ([평가])
//   - 상태는 카드 데코가 아니라 테이블 셀 안의 작은 칩
//
// 분산 기반 분류 유지:
//   - priority: 본인 평가 X + AI needsReview axis ≥ 1 → 검토 필요
//   - draft:    본인이 임시 저장 중
//   - submitted: 본인이 제출 완료
//   - optional: 본인 평가 X + 분쟁 axis 0 (AI 합의) → 검토 생략 가능
// 정렬: priority → draft → submitted → optional

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  rowToJudgeReview,
  rowToProposal,
  type CompetitionRow,
  type JudgeAssignmentRow,
  type ProposalReviewRow,
  type ProposalRow,
} from "@/lib/fastlane/db";
import type { JudgeReview, Proposal } from "@/lib/fastlane/types";

// ── types ─────────────────────────────────────────────────────

interface JudgeItem {
  proposal: Proposal;
  competitionId: string;
  competitionName: string;
  organizer: string;
  myReview: JudgeReview | null;
}

type Status = "priority" | "draft" | "submitted" | "optional";

function statusOf(item: JudgeItem): Status {
  if (!item.myReview) {
    const disputed =
      item.proposal.score?.axes.filter((a) => a.needsReview).length ?? 0;
    return disputed > 0 ? "priority" : "optional";
  }
  return item.myReview.status === "submitted" ? "submitted" : "draft";
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "방금 전";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}일 전`;
  return `${Math.floor(d / 30)}개월 전`;
}

// 본인 review 의 axes 에서 평균 점수
function myAverage(review: JudgeReview, aiAxes: Proposal["score"] | undefined): number | null {
  if (!aiAxes || !review.axes.length) return null;
  const scores: number[] = [];
  for (const a of review.axes) {
    if (a.acceptedAiScore) {
      const ai = aiAxes.axes.find((x) => x.criterionId === a.criterionId);
      if (ai) scores.push(ai.mean);
    } else if (a.overrideScore !== undefined) {
      scores.push(a.overrideScore);
    }
  }
  if (scores.length === 0) return null;
  return Math.round(scores.reduce((s, x) => s + x, 0) / scores.length);
}

// ── data load ─────────────────────────────────────────────────

async function loadJudgeWork(): Promise<{
  items: JudgeItem[];
  isAuthenticated: boolean;
  judgeName: string | null;
  affiliation: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { items: [], isAuthenticated: false, judgeName: null, affiliation: null };
  }

  const { data: assignments } = await supabase
    .from("competition_judges")
    .select("*")
    .eq("judge_id", user.id);
  const assignRows = (assignments ?? []) as JudgeAssignmentRow[];
  const compIds = assignRows.map((a) => a.competition_id);

  if (compIds.length === 0) {
    return {
      items: [],
      isAuthenticated: true,
      judgeName: assignRows[0]?.judge_name ?? null,
      affiliation: assignRows[0]?.affiliation ?? null,
    };
  }

  const [{ data: comps }, { data: proposals }, { data: myReviews }] =
    await Promise.all([
      supabase.from("competitions").select("*").in("id", compIds),
      supabase
        .from("proposals")
        .select("*")
        .in("competition_id", compIds)
        .order("created_at", { ascending: false }),
      supabase.from("proposal_reviews").select("*").eq("judge_id", user.id),
    ]);

  const compById = new Map<string, CompetitionRow>();
  for (const c of (comps ?? []) as CompetitionRow[]) compById.set(c.id, c);

  const reviewByProposal = new Map<string, ProposalReviewRow>();
  for (const r of (myReviews ?? []) as ProposalReviewRow[]) {
    reviewByProposal.set(r.proposal_id, r);
  }

  const items: JudgeItem[] = ((proposals ?? []) as ProposalRow[]).map((p) => {
    const c = compById.get(p.competition_id);
    const myReviewRow = reviewByProposal.get(p.id);
    return {
      proposal: rowToProposal(p),
      competitionId: p.competition_id,
      competitionName: c?.name ?? "이름 없음",
      organizer: c?.organizer ?? "",
      myReview: myReviewRow ? rowToJudgeReview(myReviewRow) : null,
    };
  });

  // 정렬: priority → draft → submitted → optional
  const order: Record<Status, number> = {
    priority: 0,
    draft: 1,
    submitted: 2,
    optional: 3,
  };
  items.sort((a, b) => {
    const sa = order[statusOf(a)];
    const sb = order[statusOf(b)];
    if (sa !== sb) return sa - sb;
    return (
      new Date(b.proposal.submittedAt).getTime() -
      new Date(a.proposal.submittedAt).getTime()
    );
  });

  return {
    items,
    isAuthenticated: true,
    judgeName: assignRows[0]?.judge_name ?? null,
    affiliation: assignRows[0]?.affiliation ?? null,
  };
}

// ── page ──────────────────────────────────────────────────────

export default async function JudgePage() {
  const { items, isAuthenticated, judgeName, affiliation } = await loadJudgeWork();

  const total = items.length;
  const submitted = items.filter((i) => statusOf(i) === "submitted").length;
  const drafts = items.filter((i) => statusOf(i) === "draft").length;
  const priority = items.filter((i) => statusOf(i) === "priority").length;
  const optional = items.filter((i) => statusOf(i) === "optional").length;
  const reviewClosed = items.filter((i) => !!i.proposal.reviewClosedAt).length;

  return (
    <div className="max-w-[1400px] mx-auto px-10 pt-8 pb-20">
      {/* 페이지 헤더 — 행정 톤. serif/uppercase 안 씀. */}
      <div
        className="pb-5 mb-6 border-b"
        style={{ borderColor: "var(--t-border)" }}
      >
        <p
          className="text-[12px] mb-1.5"
          style={{ color: "var(--text-tertiary)" }}
        >
          심사위원 워크스페이스
          {judgeName ? ` · ${judgeName}` : ""}
          {affiliation ? ` (${affiliation})` : ""}
        </p>
        <h1
          className="text-[20px] font-semibold"
          style={{ color: "var(--text-primary)", letterSpacing: "-0.005em" }}
        >
          내가 평가할 출품
        </h1>
        <p
          className="text-[13px] mt-2"
          style={{ color: "var(--text-secondary)", wordBreak: "keep-all" }}
        >
          AI가 자신감을 보인 출품은 자동으로 뒤로 빠지고, 평가가 갈리는 항목이 있는
          출품(=검토 필요)이 가장 위에 모입니다.
        </p>
      </div>

      {!isAuthenticated && <SigninPrompt />}

      {isAuthenticated && total === 0 && <EmptyState />}

      {/* 한 줄 요약 strip — 잡지형 큰 숫자 strip 제거 */}
      {isAuthenticated && total > 0 && (
        <div
          className="flex flex-wrap items-baseline gap-x-5 gap-y-1.5 px-5 py-3 mb-4 text-[13px]"
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--t-border)",
            borderRadius: 2,
            color: "var(--text-secondary)",
          }}
        >
          <span style={{ color: "var(--text-tertiary)" }}>
            전체{" "}
            <strong
              className="tabular-nums"
              style={{ color: "var(--text-primary)", fontWeight: 600 }}
            >
              {total}
            </strong>
            건
          </span>
          <Divider />
          <SummaryStat
            label="검토 필요"
            value={priority}
            tone="attention"
            strong
          />
          <SummaryStat label="임시 저장" value={drafts} tone="accent" />
          <SummaryStat
            label="제출 완료"
            value={submitted}
            tone={submitted === total ? "success" : "neutral"}
          />
          <SummaryStat label="AI 합의" value={optional} tone="muted" />
          {reviewClosed > 0 && (
            <>
              <Divider />
              <span style={{ color: "var(--text-tertiary)" }}>
                검토 종료{" "}
                <strong
                  className="tabular-nums"
                  style={{ color: "var(--text-primary)", fontWeight: 600 }}
                >
                  {reviewClosed}
                </strong>
                건
              </span>
            </>
          )}
        </div>
      )}

      {/* 데이터 테이블 */}
      {items.length > 0 && (
        <div
          className="overflow-x-auto"
          style={{
            background: "var(--surface-1)",
            border: "1px solid var(--t-border)",
            borderRadius: 2,
          }}
        >
          <table className="w-full min-w-[1080px] text-[13px]">
            <thead>
              <tr
                style={{
                  background: "var(--surface-2)",
                  borderBottom: "1px solid var(--t-border)",
                }}
              >
                <Th width="20%">대회</Th>
                <Th width="auto">출품</Th>
                <Th width="10%">팀</Th>
                <Th width="8%" align="right">
                  AI 종합
                </Th>
                <Th width="7%" align="right">
                  분쟁
                </Th>
                <Th width="8%" align="right">
                  내 평균
                </Th>
                <Th width="10%">상태</Th>
                <Th width="8%" align="right">
                  &nbsp;
                </Th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <ProposalTr key={it.proposal.id} item={it} isLast={idx === items.length - 1} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── 테이블 행 ──────────────────────────────────────────────────

function ProposalTr({ item, isLast }: { item: JudgeItem; isLast: boolean }) {
  const { proposal, competitionId, competitionName, organizer, myReview } = item;
  const status = statusOf(item);
  const reviewClosed = !!proposal.reviewClosedAt;
  const composite = proposal.score?.composite ?? null;
  const myAvg = myReview ? myAverage(myReview, proposal.score) : null;
  const disputeCount =
    proposal.score?.axes.filter((a) => a.needsReview).length ?? 0;
  const href = `/competitions/${competitionId}/proposals/${proposal.id}`;
  const isMuted = status === "optional";

  return (
    <tr
      style={{
        borderBottom: isLast ? "none" : "1px solid var(--t-border-subtle)",
        background: isMuted ? "var(--surface-2)" : "var(--surface-1)",
      }}
      className="hover:bg-[color:var(--accent-soft)] transition-colors"
    >
      {/* 대회 */}
      <Td muted={isMuted}>
        <div className="leading-tight">
          <div
            className="text-[11px] mb-0.5"
            style={{ color: "var(--text-tertiary)" }}
          >
            {organizer || "—"}
          </div>
          <div
            className="truncate"
            style={{ color: "var(--text-secondary)" }}
            title={competitionName}
          >
            {competitionName}
          </div>
        </div>
      </Td>

      {/* 출품 (제목 + 요약 한 줄) */}
      <Td muted={isMuted}>
        <Link
          href={href}
          className="block group min-w-0"
          style={{ color: "var(--text-primary)" }}
        >
          <div
            className="font-medium truncate group-hover:underline underline-offset-2"
            style={{ fontSize: "13.5px" }}
            title={proposal.title}
          >
            {proposal.title}
          </div>
          <div
            className="text-[12px] truncate mt-0.5"
            style={{ color: "var(--text-tertiary)" }}
            title={proposal.summary}
          >
            {proposal.summary}
          </div>
        </Link>
      </Td>

      {/* 팀 */}
      <Td muted={isMuted}>
        <div className="leading-tight">
          <div
            className="truncate"
            style={{ color: "var(--text-secondary)" }}
            title={proposal.team}
          >
            {proposal.team}
          </div>
          <div
            className="text-[11px] mt-0.5"
            style={{ color: "var(--text-tertiary)" }}
          >
            {timeAgo(proposal.submittedAt)}
          </div>
        </div>
      </Td>

      {/* AI 종합 */}
      <Td muted={isMuted} align="right">
        {composite !== null ? (
          <span
            className="tabular-nums"
            style={{ color: "var(--text-primary)", fontWeight: 600 }}
          >
            {composite}
          </span>
        ) : (
          <span style={{ color: "var(--text-tertiary)" }}>—</span>
        )}
      </Td>

      {/* 분쟁 */}
      <Td muted={isMuted} align="right">
        {disputeCount > 0 ? (
          <span
            className="tabular-nums"
            style={{ color: "var(--signal-attention)", fontWeight: 600 }}
          >
            {disputeCount}
          </span>
        ) : (
          <span style={{ color: "var(--text-tertiary)" }}>—</span>
        )}
      </Td>

      {/* 내 평균 */}
      <Td muted={isMuted} align="right">
        {myAvg !== null ? (
          <span
            className="tabular-nums"
            style={{ color: "var(--signal-success)", fontWeight: 600 }}
          >
            {myAvg}
          </span>
        ) : (
          <span style={{ color: "var(--text-tertiary)" }}>—</span>
        )}
      </Td>

      {/* 상태 */}
      <Td muted={isMuted}>
        <StatusBadge status={status} reviewClosed={reviewClosed} />
      </Td>

      {/* 액션 */}
      <Td muted={isMuted} align="right">
        <Link
          href={href}
          className="inline-flex items-center justify-center px-3 py-1 text-[12px] font-medium transition-colors"
          style={{
            color: status === "priority" ? "#FFFFFF" : "var(--text-primary)",
            background: status === "priority" ? "var(--accent)" : "var(--surface-1)",
            border: `1px solid ${
              status === "priority" ? "var(--accent)" : "var(--t-input-border)"
            }`,
            borderRadius: 2,
            minWidth: 64,
          }}
        >
          {status === "priority"
            ? "평가"
            : status === "draft"
            ? "이어쓰기"
            : status === "submitted"
            ? "보기"
            : "확인"}
        </Link>
      </Td>
    </tr>
  );
}

// ── primitives ────────────────────────────────────────────────

function Th({
  children,
  width,
  align = "left",
}: {
  children: React.ReactNode;
  width?: string;
  align?: "left" | "right" | "center";
}) {
  return (
    <th
      className="px-3 py-2.5 text-[11px] font-semibold"
      style={{
        width,
        textAlign: align,
        color: "var(--text-tertiary)",
        letterSpacing: "0",
      }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align = "left",
  muted = false,
}: {
  children: React.ReactNode;
  align?: "left" | "right" | "center";
  muted?: boolean;
}) {
  return (
    <td
      className="px-3 py-3 align-middle"
      style={{
        textAlign: align,
        verticalAlign: "middle",
        opacity: muted ? 0.72 : 1,
      }}
    >
      {children}
    </td>
  );
}

function StatusBadge({
  status,
  reviewClosed,
}: {
  status: Status;
  reviewClosed: boolean;
}) {
  if (reviewClosed) {
    return (
      <Badge label="검토 종료" color="var(--text-tertiary)" subtle />
    );
  }
  if (status === "priority") {
    return <Badge label="검토 필요" color="var(--signal-attention)" dot />;
  }
  if (status === "draft") {
    return <Badge label="임시 저장" color="var(--accent)" dot />;
  }
  if (status === "submitted") {
    return <Badge label="제출 완료" color="var(--signal-success)" dot />;
  }
  return <Badge label="AI 합의" color="var(--text-tertiary)" subtle />;
}

function Badge({
  label,
  color,
  dot = false,
  subtle = false,
}: {
  label: string;
  color: string;
  dot?: boolean;
  subtle?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px]"
      style={{
        color,
        background: subtle ? "transparent" : "transparent",
        border: subtle ? "1px solid var(--t-border)" : `1px solid ${color}33`,
        borderRadius: 2,
        fontWeight: 500,
      }}
    >
      {dot && (
        <span
          className="inline-block w-1.5 h-1.5 rounded-full"
          style={{ background: color }}
          aria-hidden
        />
      )}
      {label}
    </span>
  );
}

function SummaryStat({
  label,
  value,
  tone,
  strong = false,
}: {
  label: string;
  value: number;
  tone: "attention" | "accent" | "success" | "muted" | "neutral";
  strong?: boolean;
}) {
  const color =
    tone === "attention"
      ? "var(--signal-attention)"
      : tone === "accent"
      ? "var(--accent)"
      : tone === "success"
      ? "var(--signal-success)"
      : tone === "muted"
      ? "var(--text-tertiary)"
      : "var(--text-primary)";
  return (
    <span style={{ color: "var(--text-tertiary)" }}>
      {label}{" "}
      <strong
        className="tabular-nums"
        style={{
          color,
          fontWeight: strong && value > 0 ? 700 : 600,
        }}
      >
        {value}
      </strong>
    </span>
  );
}

function Divider() {
  return (
    <span
      aria-hidden
      className="inline-block w-px h-3.5"
      style={{ background: "var(--t-border-bright)" }}
    />
  );
}

// ── empty / signin ────────────────────────────────────────────

function EmptyState() {
  return (
    <div
      className="px-6 py-12 text-center"
      style={{
        background: "var(--surface-1)",
        border: "1px solid var(--t-border)",
        borderRadius: 2,
      }}
    >
      <p
        className="text-[14px] font-medium mb-1.5"
        style={{ color: "var(--text-primary)" }}
      >
        아직 평가할 출품이 없습니다.
      </p>
      <p
        className="text-[12px] leading-[1.7] max-w-md mx-auto"
        style={{ color: "var(--text-tertiary)", wordBreak: "keep-all" }}
      >
        본인이 배정된 대회에 출품이 접수되고 AI 1차 평가가 끝나면 여기에 표시됩니다.
        또는 본인이 직접{" "}
        <Link
          href="/competitions/new"
          className="font-medium underline-offset-2 hover:underline"
          style={{ color: "var(--accent)" }}
        >
          새 대회
        </Link>
        를 만들면 본인이 자동으로 심사위원으로도 등록됩니다.
      </p>
    </div>
  );
}

function SigninPrompt() {
  return (
    <div
      className="px-5 py-4 mb-6 text-[13px]"
      style={{
        background: "var(--accent-soft)",
        border: "1px solid var(--accent-ring)",
        borderRadius: 2,
        color: "var(--text-secondary)",
      }}
    >
      심사 작업을 시작하려면{" "}
      <Link
        href="/login?next=/judge"
        className="font-medium underline-offset-2 hover:underline"
        style={{ color: "var(--accent)" }}
      >
        로그인
      </Link>
      해주세요.
    </div>
  );
}
