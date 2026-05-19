// 검토 대기 — AI 3-Pass 채점에서 분산(stddev)이 임계를 넘어 사람 판단이 필요한
// 출품만 모아 보여주는 페이지.
//
// 디자인 결정 (2026-05):
//   - /competitions/queue 와 데이터 소스는 동일하나, needsReview axis 가 1개라도
//     있는 proposal 만 필터해서 보여줌. 이게 사이드바 "검토 대기" 의 본질.
//   - 카드에 "어느 축이 검토 필요한지" 를 chip 으로 명시 — 한눈에 어디를
//     봐야 하는지 알게 함. (단순 카운트만 보여주면 '몇 개' 만 알지 '뭘 봐야 할지'
//     모른다.)
//   - 통계 strip 도 검토 필요 관점으로 재구성: 대기 항목 수 / 누적 검토 권고 축 /
//     평균 분산(σ). 톤은 attention 색을 일관되게.
//   - 검토 대기가 0건일 때 healthy empty state 로 안내 — "모든 항목이 합의 임계
//     안에 들어왔다" 는 긍정 메시지.
//
// 임계 기준: STDDEV_REVIEW_THRESHOLD = 8 (types.ts). Draft / Skeptic / Judge 세
// 점수의 stddev 가 이 값을 넘는 axis 만 needsReview=true 로 표시되고, 그게 1개
// 이상인 proposal 만 이 페이지에 나타난다.

import Link from "next/link";
import { ArrowRight, Gavel, LogIn, ShieldCheck, AlertTriangle } from "lucide-react";
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

const SERIF = "'Pretendard Variable', 'Pretendard', system-ui, sans-serif";

// 평면 검토대기 항목 — proposal 본체 + 어느 대회 소속인지 + 어떤 criterion 들이
// 분쟁 상태인지(이름 + stddev) 미리 합쳐서 카드에서 바로 렌더링하기 쉽게 만듦.
// decidedCount 는 이미 결정된 분쟁 axis 수 (시연 mock 의 preseeded resolutions 기준).
interface PendingItem {
  proposal: Proposal;
  competitionId: string;
  competitionName: string;
  organizer: string;
  /** 검토 필요한 axis 마다 criterion 이름과 stddev 를 함께 보관. */
  reviewAxes: { name: string; stddev: number }[];
  /** 이미 결정된 분쟁 axis 수 — 진행률 표시용. */
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
  const mo = Math.floor(d / 30);
  return `${mo}개월 전`;
}

async function loadUserCompetitions(): Promise<{
  competitions: Competition[];
  isAuthenticated: boolean;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { competitions: [], isAuthenticated: false };

  const { data: cRows } = await supabase
    .from("competitions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const compRows = (cRows ?? []) as CompetitionRow[];
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

// competitions 에서 needsReview axis 가 있는 proposal 만 추려서 평면 리스트로.
// axis 이름은 template.criteria 와 join 해서 사람이 읽을 수 있는 한글 이름으로.
// 이미 검토 종료된 proposal (reviewClosedAt 있음) 은 제외 — pending 정의상.
function collectPending(competitions: Competition[]): PendingItem[] {
  const items: PendingItem[] = [];
  for (const comp of competitions) {
    const criterionNameById = new Map(
      comp.template.criteria.map((c) => [c.id, c.name])
    );
    for (const p of comp.proposals) {
      if (p.reviewClosedAt) continue; // 검토 종료된 출품은 pending 에서 빠짐.
      const axes = p.score?.axes ?? [];
      const needs = axes.filter((a) => a.needsReview);
      if (needs.length === 0) continue;
      // 이미 결정된 분쟁 axis 수 — mock 의 preseeded resolutions 가 있는 경우만.
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
  // 분산이 큰(즉 합의가 더 어긋난) 것부터 위로. 같은 분산이면 최신 제출 우선.
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
  const { competitions: userComps, isAuthenticated } = await loadUserCompetitions();
  // 비로그인일 때만 mock 미리보기. 로그인 + 0건은 HealthyEmptyState 가 처리.
  const useDemoFallback = !isAuthenticated;
  const competitions = useDemoFallback ? MOCK_COMPETITIONS : userComps;

  const items = collectPending(competitions);

  // 통계 — 대기 항목 수 / 누적 검토 권고 축 수 / 평균 분산.
  const totalPending = items.length;
  const totalAxes = items.reduce((s, it) => s + it.reviewAxes.length, 0);
  const avgStddev =
    totalAxes === 0
      ? 0
      : items.reduce(
          (s, it) =>
            s + it.reviewAxes.reduce((ss, a) => ss + a.stddev, 0),
          0
        ) / totalAxes;

  return (
    <div className="max-w-[1400px] mx-auto px-12 pt-10 pb-24">
      {/* 헤더 — /competitions, /queue 와 동일 톤 유지. */}
      <div className="flex items-start justify-between gap-8 mb-3 flex-wrap">
        <div>
          <h1
            style={{
              fontWeight: 700,
              fontSize: "1.625rem",
              lineHeight: 1.3,
              color: "var(--text-primary)",
              letterSpacing: "-0.01em",
            }}
          >
            검토 대기
          </h1>
          <p
            className="mt-1 text-[12.5px] tabular-nums"
            style={{ color: "var(--text-tertiary)", letterSpacing: "0.02em" }}
          >
            {useDemoFallback
              ? `${totalPending}건 데모 표시 중`
              : `${totalPending}건 대기`}
          </p>
        </div>
        <Link
          href="/competitions/queue"
          className="group inline-flex items-center gap-2 px-4 h-10 text-[13px] font-medium transition-colors hover:bg-[color:var(--surface-2)]"
          style={{
            border: "1px solid var(--t-border-subtle)",
            color: "var(--text-secondary)",
            letterSpacing: "0.01em",
          }}
        >
          심사 큐로
          <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.2} />
        </Link>
      </div>

      <p
        className="text-[13.5px] leading-[1.8] mb-10 max-w-2xl"
        style={{ color: "var(--text-secondary)", wordBreak: "keep-all" }}
      >
        AI가 같은 출품을 같은 조건으로 5회 반복한 결과, 점수 분산(σ)이 임계{" "}
        <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>
          {STDDEV_REVIEW_THRESHOLD}
        </span>
        을 넘은 항목들입니다. 의견이 갈리는 지점만 모았으니, 심사위원이
        해당 축의 평가만 보면 됩니다.
      </p>

      {/* 비로그인 안내 — queue 와 동일 톤. */}
      {!isAuthenticated && (
        <div
          className="flex items-start gap-3 px-5 py-4 mb-10"
          style={{
            background: "var(--accent-soft)",
            border: "1px solid var(--accent-ring)",
          }}
        >
          <LogIn
            className="w-4 h-4 mt-0.5 shrink-0"
            style={{ color: "var(--accent)" }}
            strokeWidth={2.2}
          />
          <div className="text-[13px] leading-[1.7]" style={{ color: "var(--text-secondary)" }}>
            아래는 미리보기 샘플입니다.{" "}
            <Link
              href="/login"
              className="font-semibold underline-offset-2 hover:underline"
              style={{ color: "var(--accent)" }}
            >
              로그인
            </Link>{" "}
            하면 본인이 운영하는 대회의 검토 대기만 표시됩니다.
          </div>
        </div>
      )}

      {/* 통계 strip */}
      <div
        className="grid grid-cols-3 mb-12 border-y"
        style={{ borderColor: "var(--t-border-subtle)" }}
      >
        <Stat
          label="대기 출품"
          value={`${totalPending}`}
          tone={totalPending > 0 ? "attention" : "neutral"}
        />
        <Stat
          label="누적 검토 권고 축"
          value={`${totalAxes}`}
          tone={totalAxes > 0 ? "attention" : "neutral"}
        />
        <Stat
          label="평균 분산 σ"
          value={avgStddev > 0 ? avgStddev.toFixed(1) : "—"}
        />
      </div>

      {/* 결과 — 0건이면 healthy empty state */}
      {items.length === 0 ? (
        <HealthyEmptyState />
      ) : (
        <div className="space-y-3">
          {items.map((it) => (
            <PendingRow key={`${it.competitionId}:${it.proposal.id}`} item={it} />
          ))}
        </div>
      )}
    </div>
  );
}

function PendingRow({ item }: { item: PendingItem }) {
  const { proposal, competitionId, competitionName, organizer, reviewAxes, decidedCount } = item;
  const composite = proposal.score?.composite ?? null;
  // 가장 큰 분산 — 카드 우측 큰 숫자로 표시. "어디가 가장 흔들리는지" 한눈에.
  const maxStddev = Math.max(...reviewAxes.map((a) => a.stddev));
  const disputeTotal = reviewAxes.length;
  const allDecided = decidedCount > 0 && decidedCount === disputeTotal;

  return (
    <Link
      href={`/competitions/${competitionId}/proposals/${proposal.id}`}
      className="group relative grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 px-7 py-5 transition-all hover:bg-[color:var(--accent-soft)]"
      style={{
        background: "var(--surface-1)",
        border: "1px solid var(--t-border-subtle)",
      }}
    >
      {/* hover 좌측 accent — attention 색으로 (검토대기 페이지 정체성) */}
      <span
        aria-hidden
        className="absolute left-0 top-0 bottom-0 w-[3px] origin-top transition-transform duration-200 group-hover:scale-y-100 scale-y-0"
        style={{ background: "var(--signal-attention)" }}
      />

      <div className="min-w-0">
        {/* 어느 대회 — chip */}
        <div className="flex items-center gap-2 mb-2.5">
          <Gavel
            className="w-3.5 h-3.5 shrink-0"
            style={{ color: "var(--signal-attention)" }}
            strokeWidth={2}
          />
          <span
            className="text-[11px] font-bold uppercase truncate"
            style={{
              color: "var(--text-tertiary)",
              letterSpacing: "0.14em",
            }}
          >
            {organizer} · {competitionName}
          </span>
        </div>

        <h2
          className="ko-display mb-1.5 truncate"
          style={{
            fontFamily: SERIF,
            fontWeight: 800,
            fontSize: "1.2rem",
            lineHeight: 1.25,
            color: "var(--text-primary)",
          }}
        >
          {proposal.title}
        </h2>

        <p
          className="text-[13px] leading-[1.6] mb-3 line-clamp-1"
          style={{ color: "var(--text-secondary)" }}
        >
          {proposal.summary}
        </p>

        {/* 검토 필요 axis chip 리스트 — 단순 카운트가 아니라 이름 + σ 명시.
            결정 진행률 chip 도 함께 — "어느 항목을 보면 되는지" + "얼마나 끝났는지". */}
        <div className="flex items-center flex-wrap gap-x-2 gap-y-2 mb-2">
          {/* 결정 진행률 chip — disputes 0개일 땐 표시 X */}
          {disputeTotal > 0 && (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11.5px] font-semibold tabular-nums"
              style={{
                background: allDecided
                  ? "var(--surface-2)"
                  : "var(--surface-1)",
                border: `1px solid ${
                  allDecided ? "var(--signal-success)" : "var(--t-border-subtle)"
                }`,
                color: allDecided
                  ? "var(--signal-success)"
                  : "var(--text-tertiary)",
                letterSpacing: "0.02em",
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
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11.5px] font-semibold tabular-nums"
              style={{
                background: "var(--accent-soft)",
                border: "1px solid var(--accent-ring)",
                color: "var(--signal-attention)",
                letterSpacing: "0.02em",
              }}
            >
              <AlertTriangle className="w-3 h-3" strokeWidth={2.4} />
              {axis.name}
              <span style={{ color: "var(--text-tertiary)" }}>· σ {axis.stddev.toFixed(1)}</span>
            </span>
          ))}
        </div>

        {/* 부가 메타 */}
        <div
          className="flex items-center flex-wrap gap-x-4 gap-y-1.5 text-[12px]"
          style={{ color: "var(--text-secondary)" }}
        >
          <span>
            팀:{" "}
            <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
              {proposal.team}
            </span>
          </span>
          <span style={{ color: "var(--t-border-bright)" }}>·</span>
          <span style={{ color: "var(--text-tertiary)" }}>
            {timeAgo(proposal.submittedAt)} 제출
          </span>
          {composite !== null && (
            <>
              <span style={{ color: "var(--t-border-bright)" }}>·</span>
              <span>
                AI 종합{" "}
                <span
                  className="tabular-nums"
                  style={{ color: "var(--text-primary)", fontWeight: 700 }}
                >
                  {composite}
                </span>
              </span>
            </>
          )}
        </div>
      </div>

      {/* 우측 — 가장 큰 σ 값 강조 */}
      <div className="md:text-right md:min-w-[120px] flex md:block items-center gap-3 self-stretch">
        <div>
          <span
            className="num-display tabular-nums leading-none"
            style={{
              fontFamily: SERIF,
              fontWeight: 800,
              fontSize: "2.2rem",
              letterSpacing: "-0.03em",
              color: "var(--signal-attention)",
            }}
          >
            σ {maxStddev.toFixed(1)}
          </span>
          <p
            className="mt-1 text-[10.5px] font-bold uppercase"
            style={{
              color: "var(--text-tertiary)",
              letterSpacing: "0.14em",
            }}
          >
            최대 분산
          </p>
        </div>
        <ArrowRight
          className="md:absolute md:bottom-5 md:right-7 w-4 h-4 transition-transform group-hover:translate-x-1"
          style={{ color: "var(--signal-attention)" }}
        />
      </div>
    </Link>
  );
}

function Stat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "attention";
}) {
  return (
    <div
      className="px-5 py-5 border-r last:border-r-0"
      style={{ borderColor: "var(--t-border-subtle)" }}
    >
      <p
        className="text-[10.5px] font-bold uppercase mb-2"
        style={{ color: "var(--text-tertiary)", letterSpacing: "0.14em" }}
      >
        {label}
      </p>
      <p
        className="num-display tabular-nums leading-none"
        style={{
          fontFamily: SERIF,
          fontWeight: 800,
          fontSize: "1.8rem",
          letterSpacing: "-0.025em",
          color:
            tone === "attention"
              ? "var(--signal-attention)"
              : "var(--text-primary)",
        }}
      >
        {value}
      </p>
    </div>
  );
}

// 검토 대기 0건일 때 — 단순 empty 가 아니라 "건강한 상태" 라는 긍정 메시지.
// 분산이 임계 안에 들어왔다는 건 AI 합의가 안정적이라는 신호이므로.
function HealthyEmptyState() {
  return (
    <div
      className="px-7 py-20 text-center"
      style={{
        background: "var(--surface-1)",
        border: "1px dashed var(--t-border-subtle)",
      }}
    >
      <ShieldCheck
        className="w-8 h-8 mx-auto mb-4"
        style={{ color: "var(--signal-success)" }}
        strokeWidth={1.6}
      />
      <p
        className="text-[15px] font-semibold mb-1.5"
        style={{ color: "var(--text-primary)" }}
      >
        검토할 항목이 없습니다.
      </p>
      <p
        className="text-[13px] leading-[1.7] max-w-md mx-auto"
        style={{ color: "var(--text-tertiary)" }}
      >
        모든 출품이 AI 3-Pass 합의 임계({STDDEV_REVIEW_THRESHOLD}σ) 안에
        들어왔습니다. 새 출품이 임계를 넘으면 이 화면에 자동으로 회부됩니다.
      </p>
    </div>
  );
}
