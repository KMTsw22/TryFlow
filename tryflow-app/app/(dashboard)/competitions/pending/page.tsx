// 검토 대기 — AI 3-Pass 채점에서 분산(stddev)이 임계를 넘어 사람 판단이 필요한
// 출품만 모아 보여주는 페이지.
//
// 2026-05-21 행정 톤 리톤: serif/큰숫자/uppercase letter-spacing/vertical stripe 제거.
// 카드 구조는 유지 — axis chip 이 정보 핵심(어디를 봐야 하나)이라 테이블 셀에
// 넣으면 가독성 깨짐. 운영 톤 토큰만 일괄 교체.
//
// 임계 기준: STDDEV_REVIEW_THRESHOLD (types.ts). 그 값을 넘는 axis 가 1개라도
// 있는 proposal 만 이 페이지에 나타난다.

import Link from "next/link";
import { ArrowRight, AlertTriangle, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  rowToCompetition,
  rowToProposal,
  type CompetitionRow,
  type ProposalRow,
} from "@/lib/fastlane/db";
import { MOCK_COMPETITIONS } from "@/lib/fastlane/mock";
import {
  STDDEV_REVIEW_THRESHOLD,
  type Competition,
  type Proposal,
} from "@/lib/fastlane/types";

// 평면 검토대기 항목 — proposal 본체 + 대회 메타 + 분쟁 axis 정보 + 결정 진척.
interface PendingItem {
  proposal: Proposal;
  competitionId: string;
  competitionName: string;
  organizer: string;
  reviewAxes: { name: string; stddev: number }[];
  decidedCount: number;
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

async function loadUserCompetitions(): Promise<{
  competitions: Competition[];
  isAuthenticated: boolean;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { competitions: [], isAuthenticated: false };

  // organizer 가 만든 대회 + 심사위원으로 초대된 대회 둘 다 가져온다.
  // 기존엔 organizer 본인 대회만 봐서, 일반 심사위원은 검토 대기 페이지가
  // 항상 비어 보이는 버그가 있었음.
  const [{ data: ownedRows }, { data: judgeAssignRows }] = await Promise.all([
    supabase.from("competitions").select("*").eq("user_id", user.id),
    supabase
      .from("competition_judges")
      .select("competition_id")
      .eq("judge_id", user.id),
  ]);

  const ownedCompRows = (ownedRows ?? []) as CompetitionRow[];
  const judgedIds = ((judgeAssignRows ?? []) as Array<{
    competition_id: string;
  }>)
    .map((r) => r.competition_id)
    .filter((id) => !ownedCompRows.some((c) => c.id === id));

  let judgedRows: CompetitionRow[] = [];
  if (judgedIds.length > 0) {
    const { data } = await supabase
      .from("competitions")
      .select("*")
      .in("id", judgedIds);
    judgedRows = (data ?? []) as CompetitionRow[];
  }

  // 합치고 created_at 내림차순 정렬.
  const compRows = [...ownedCompRows, ...judgedRows].sort((a, b) =>
    (b.created_at ?? "").localeCompare(a.created_at ?? "")
  );

  const ids = compRows.map((c) => c.id);
  const pRows: ProposalRow[] = [];
  if (ids.length > 0) {
    const { data: rows } = await supabase
      .from("proposals")
      .select("*")
      .in("competition_id", ids);
    pRows.push(...((rows ?? []) as ProposalRow[]));
  }

  const proposalsByComp = new Map<string, ProposalRow[]>();
  for (const p of pRows) {
    const arr = proposalsByComp.get(p.competition_id) ?? [];
    arr.push(p);
    proposalsByComp.set(p.competition_id, arr);
  }

  const competitions = compRows.map((row) =>
    rowToCompetition(
      row,
      (proposalsByComp.get(row.id) ?? []).map((r) => rowToProposal(r))
    )
  );

  return { competitions, isAuthenticated: true };
}

// 검토 종료된 출품은 pending 에서 빠짐. 분산이 큰 것 우선 정렬.
function collectPending(competitions: Competition[]): PendingItem[] {
  const items: PendingItem[] = [];
  for (const comp of competitions) {
    const criterionNameById = new Map(
      comp.template.criteria.map((c) => [c.id, c.name])
    );
    for (const p of comp.proposals) {
      if (p.reviewClosedAt) continue;
      const axes = p.score?.axes ?? [];
      const needs = axes.filter((a) => a.needsReview);
      if (needs.length === 0) continue;
      const decidedCount = (p.disputeResolutions ?? []).filter((r) =>
        needs.some((n) => n.criterionId === r.criterionId)
      ).length;
      items.push({
        proposal: p,
        competitionId: comp.id,
        competitionName: comp.name,
        organizer: comp.organizer,
        reviewAxes: needs.map((a) => ({
          name: criterionNameById.get(a.criterionId) ?? a.criterionId,
          stddev: a.stddev,
        })),
        decidedCount,
      });
    }
  }
  items.sort((a, b) => {
    const maxA = Math.max(...a.reviewAxes.map((r) => r.stddev));
    const maxB = Math.max(...b.reviewAxes.map((r) => r.stddev));
    if (maxA !== maxB) return maxB - maxA;
    return (
      new Date(b.proposal.submittedAt).getTime() -
      new Date(a.proposal.submittedAt).getTime()
    );
  });
  return items;
}

export default async function PendingPage() {
  const { competitions: userComps, isAuthenticated } =
    await loadUserCompetitions();
  const useDemoFallback = !isAuthenticated;
  const competitions = useDemoFallback ? MOCK_COMPETITIONS : userComps;

  const items = collectPending(competitions);

  const totalPending = items.length;
  const totalAxes = items.reduce((s, it) => s + it.reviewAxes.length, 0);
  const totalDecided = items.reduce((s, it) => s + it.decidedCount, 0);
  const avgStddev =
    totalAxes === 0
      ? 0
      : items.reduce(
          (s, it) => s + it.reviewAxes.reduce((ss, a) => ss + a.stddev, 0),
          0
        ) / totalAxes;

  return (
    <div className="max-w-[1400px] mx-auto px-10 pt-8 pb-20">
      {/* 헤더 — 운영 톤 */}
      <div
        className="pb-5 mb-6 border-b flex items-start justify-between gap-6 flex-wrap"
        style={{ borderColor: "var(--t-border)" }}
      >
        <div>
          <p
            className="text-[12px] mb-1.5"
            style={{ color: "var(--text-tertiary)" }}
          >
            대회 진행 · 검토 대기
          </p>
          <h1
            className="text-[20px] font-semibold"
            style={{
              color: "var(--text-primary)",
              letterSpacing: "-0.005em",
            }}
          >
            AI 분쟁 항목
          </h1>
          <p
            className="text-[13px] mt-2 max-w-2xl"
            style={{ color: "var(--text-secondary)", wordBreak: "keep-all" }}
          >
            AI 3단계 평가에서 점수 분산(σ)이 임계{" "}
            <strong style={{ color: "var(--text-primary)" }}>
              {STDDEV_REVIEW_THRESHOLD}
            </strong>
            을 넘은 항목들입니다. 의견이 갈리는 지점만 모아두었으니, 그 항목만
            확인하면 됩니다.
          </p>
        </div>
        <Link
          href="/competitions/queue"
          className="inline-flex items-center gap-1.5 px-3.5 h-9 text-[13px] font-medium transition-colors hover:bg-[color:var(--surface-2)]"
          style={{
            border: "1px solid var(--t-input-border)",
            color: "var(--text-primary)",
            borderRadius: 2,
          }}
        >
          심사 큐로
          <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.2} />
        </Link>
      </div>

      {/* 비로그인 안내 */}
      {!isAuthenticated && (
        <div
          className="px-5 py-3 mb-4 text-[13px]"
          style={{
            background: "var(--accent-soft)",
            border: "1px solid var(--accent-ring)",
            borderRadius: 2,
            color: "var(--text-secondary)",
          }}
        >
          아래는 미리보기 샘플입니다.{" "}
          <Link
            href="/login"
            className="font-medium underline-offset-2 hover:underline"
            style={{ color: "var(--accent)" }}
          >
            로그인
          </Link>{" "}
          하면 본인이 운영하는 대회의 검토 대기만 표시됩니다.
        </div>
      )}

      {/* 한 줄 요약 strip */}
      <div
        className="flex flex-wrap items-baseline gap-x-5 gap-y-1.5 px-5 py-3 mb-4 text-[13px]"
        style={{
          background: "var(--surface-2)",
          border: "1px solid var(--t-border)",
          borderRadius: 2,
          color: "var(--text-secondary)",
        }}
      >
        <SummaryStat label="대기 출품" value={totalPending} unit="건" tone={totalPending > 0 ? "attention" : "neutral"} strong />
        <Divider />
        <SummaryStat label="검토 권고 축" value={totalAxes} unit="개" tone={totalAxes > 0 ? "attention" : "neutral"} />
        <Divider />
        <SummaryStat label="결정 완료" value={`${totalDecided}/${totalAxes}`} />
        <Divider />
        <span style={{ color: "var(--text-tertiary)" }}>
          평균 분산 σ{" "}
          <strong
            className="tabular-nums"
            style={{ color: "var(--text-primary)", fontWeight: 600 }}
          >
            {avgStddev > 0 ? avgStddev.toFixed(1) : "—"}
          </strong>
        </span>
      </div>

      {/* 결과 — 0건이면 healthy empty state */}
      {items.length === 0 ? (
        <HealthyEmptyState />
      ) : (
        <div className="space-y-2.5">
          {items.map((it) => (
            <PendingRow
              key={`${it.competitionId}:${it.proposal.id}`}
              item={it}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── 한 행 (카드 유지, 운영 톤) ──────────────────────────────────

function PendingRow({ item }: { item: PendingItem }) {
  const {
    proposal,
    competitionId,
    competitionName,
    organizer,
    reviewAxes,
    decidedCount,
  } = item;
  const composite = proposal.score?.composite ?? null;
  const maxStddev = Math.max(...reviewAxes.map((a) => a.stddev));
  const disputeTotal = reviewAxes.length;
  const allDecided = decidedCount > 0 && decidedCount === disputeTotal;

  return (
    <Link
      href={`/competitions/${competitionId}/proposals/${proposal.id}`}
      className="group grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 px-6 py-4 transition-colors hover:bg-[color:var(--accent-soft)]"
      style={{
        background: "var(--surface-1)",
        border: "1px solid var(--t-border)",
        borderRadius: 2,
      }}
    >
      <div className="min-w-0">
        {/* 대회 메타 — uppercase letter-spacing 제거 */}
        <div
          className="text-[11px] mb-1 truncate"
          style={{ color: "var(--text-tertiary)" }}
        >
          {organizer} · {competitionName}
        </div>

        <h2
          className="font-medium mb-1 truncate"
          style={{
            fontSize: "14px",
            color: "var(--text-primary)",
            letterSpacing: "-0.005em",
          }}
          title={proposal.title}
        >
          {proposal.title}
        </h2>

        <p
          className="text-[12px] leading-[1.6] mb-3 line-clamp-1"
          style={{ color: "var(--text-tertiary)" }}
        >
          {proposal.summary}
        </p>

        {/* 분쟁 axis chip + 결정 진척 chip */}
        <div className="flex items-center flex-wrap gap-1.5 mb-2.5">
          {disputeTotal > 0 && (
            <span
              className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] tabular-nums"
              style={{
                background: allDecided
                  ? "transparent"
                  : "var(--surface-2)",
                border: `1px solid ${
                  allDecided
                    ? "var(--signal-success)"
                    : "var(--t-border)"
                }`,
                color: allDecided
                  ? "var(--signal-success)"
                  : "var(--text-secondary)",
                fontWeight: 500,
                borderRadius: 2,
              }}
              title={
                allDecided
                  ? "모든 분쟁 결정 완료 — 검토 종료만 남음"
                  : `${disputeTotal}개 분쟁 중 ${decidedCount}개 결정`
              }
            >
              결정 {decidedCount}/{disputeTotal}
            </span>
          )}
          {reviewAxes.map((axis) => (
            <span
              key={axis.name}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] tabular-nums"
              style={{
                background: "var(--accent-soft)",
                border: "1px solid var(--accent-ring)",
                color: "var(--signal-attention)",
                fontWeight: 500,
                borderRadius: 2,
              }}
            >
              <AlertTriangle className="w-3 h-3" strokeWidth={2.2} />
              {axis.name}
              <span style={{ color: "var(--text-tertiary)", fontWeight: 400 }}>
                편차 {axis.stddev.toFixed(1)}
              </span>
            </span>
          ))}
        </div>

        {/* 부가 메타 */}
        <div
          className="flex items-center flex-wrap gap-x-4 gap-y-1 text-[12px]"
          style={{ color: "var(--text-tertiary)" }}
        >
          <span>
            팀{" "}
            <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>
              {proposal.team}
            </span>
          </span>
          <span style={{ color: "var(--t-border-bright)" }}>·</span>
          <span>{timeAgo(proposal.submittedAt)} 제출</span>
          {composite !== null && (
            <>
              <span style={{ color: "var(--t-border-bright)" }}>·</span>
              <span>
                AI 종합{" "}
                <span
                  className="tabular-nums"
                  style={{ color: "var(--text-secondary)", fontWeight: 600 }}
                >
                  {composite}
                </span>
              </span>
            </>
          )}
        </div>
      </div>

      {/* 우측 — 최대 σ + 액션. serif 큰 숫자 제거, 일관 톤 */}
      <div className="md:text-right md:min-w-[100px] flex md:flex-col items-end gap-3 self-stretch justify-between">
        <div className="md:text-right">
          <p
            className="text-[11px] mb-0.5"
            style={{ color: "var(--text-tertiary)" }}
          >
            최대 분산
          </p>
          <p
            className="tabular-nums"
            style={{
              fontWeight: 600,
              fontSize: "1.25rem",
              lineHeight: 1.1,
              letterSpacing: "-0.01em",
              color: "var(--signal-attention)",
            }}
          >
            편차 {maxStddev.toFixed(1)}
          </p>
        </div>
        <ArrowRight
          className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
          style={{ color: "var(--signal-attention)" }}
        />
      </div>
    </Link>
  );
}

// ── primitives ────────────────────────────────────────────────

function SummaryStat({
  label,
  value,
  unit,
  tone = "neutral",
  strong = false,
}: {
  label: string;
  value: number | string;
  unit?: string;
  tone?: "neutral" | "attention";
  strong?: boolean;
}) {
  const color =
    tone === "attention" ? "var(--signal-attention)" : "var(--text-primary)";
  return (
    <span style={{ color: "var(--text-tertiary)" }}>
      {label}{" "}
      <strong
        className="tabular-nums"
        style={{
          color,
          fontWeight: strong && Number(value) > 0 ? 700 : 600,
        }}
      >
        {value}
      </strong>
      {unit && (
        <span style={{ color: "var(--text-tertiary)" }}> {unit}</span>
      )}
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

// 검토 대기 0건 = 건강 상태. 단순 empty 가 아니라 긍정 신호.
function HealthyEmptyState() {
  return (
    <div
      className="px-6 py-16 text-center"
      style={{
        background: "var(--surface-1)",
        border: "1px solid var(--t-border)",
        borderRadius: 2,
      }}
    >
      <ShieldCheck
        className="w-7 h-7 mx-auto mb-3"
        style={{ color: "var(--signal-success)" }}
        strokeWidth={1.8}
      />
      <p
        className="text-[14px] font-medium mb-1"
        style={{ color: "var(--text-primary)" }}
      >
        검토할 항목이 없습니다.
      </p>
      <p
        className="text-[12px] leading-[1.7] max-w-md mx-auto"
        style={{ color: "var(--text-tertiary)", wordBreak: "keep-all" }}
      >
        모든 출품이 AI 3단계 합의 임계({STDDEV_REVIEW_THRESHOLD}σ) 안에
        들어왔습니다. 새 출품이 임계를 넘으면 여기에 자동으로 표시됩니다.
      </p>
    </div>
  );
}
