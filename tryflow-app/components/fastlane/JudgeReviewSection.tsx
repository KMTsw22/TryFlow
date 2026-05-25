"use client";

// 심사위원 평가 섹션 — proposal 상세 페이지의 "사람 평가 + 분쟁 결정" 영역.
//
// 이 컴포넌트가 담는 4가지 영역:
//   1) 헤더 + 심사위원 chip — 누가 평가했는지
//   2) 비교 표 — AI vs 각 심사위원 vs 사람 평균 + 분쟁 axis 결정 버튼
//   3) 종합 코멘트 카드
//   4) 내 평가 작성 (mock 입력)
//   5) 검토 종료 영역 — 모든 분쟁이 결정되어야 활성화되는 마무리 액션
//
// 분쟁 결정(DisputeResolution) 흐름:
//   - 비교 표의 needsReview axis 행에 "결정 →" 버튼
//   - 클릭 시 DisputeResolutionModal 띄움
//   - 결정 시 로컬 state 에 추가 + 행이 즉시 "결정됨" 표시로 전환
//   - 모든 분쟁 axis 가 결정되면 검토 종료 버튼 활성화
//   - mock 단계라 결정 + 종료 모두 컴포넌트 로컬 state — 새로고침 시 초기화.

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Pencil,
  AlertTriangle,
  MessageSquare,
  Send,
  Cpu,
  Repeat,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import type {
  AxisReview,
  AxisScore,
  Criterion,
  DisputeAction,
  DisputeResolution,
  JudgeReview,
} from "@/lib/fastlane/types";
import { HUMAN_STDDEV_WARN } from "@/lib/fastlane/score";

const SERIF = "'Pretendard Variable', 'Pretendard', system-ui, sans-serif";

interface Props {
  /** 백엔드 API 호출에 필요한 식별자. mock URL(=non-uuid) 이면 fetch 안 함. */
  competitionId: string;
  proposalId: string;
  criteria: Criterion[];
  aiAxes: AxisScore[];
  reviews: JudgeReview[];
  /** DB 에서 로드한 분쟁 결정 (없으면 빈 배열). */
  initialResolutions?: DisputeResolution[];
  /** DB 에서 로드한 검토 종료 시각 (없으면 undefined — 진행 중). */
  initialClosedAt?: string;
  /** 본인의 기존 평가 — MyReviewDraft 폼 prefill 용. 없으면 빈 상태. */
  myExistingReview?: JudgeReview;
}

/** uuid 형식만 진짜 API 호출. mock 데모 데이터는 client state 로만. */
function isRealId(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export function JudgeReviewSection({
  competitionId,
  proposalId,
  criteria,
  aiAxes,
  reviews,
  initialResolutions = [],
  initialClosedAt,
  myExistingReview,
}: Props) {
  const router = useRouter();
  const usingBackend = isRealId(competitionId) && isRealId(proposalId);
  // 분쟁 axis 들 — needsReview true 인 axis 또는 사람 stddev 가 임계 초과인 axis.
  // 두 조건 중 하나만 만족해도 분쟁. (AI 분산 + 사람 분산 모두 추적.)
  const disputeAxes = useMemo(() => {
    return criteria.filter((c) => {
      const ai = aiAxes.find((a) => a.criterionId === c.id);
      if (ai?.needsReview) return true;
      const humanStddev = computeHumanStddev(c.id, ai?.mean ?? 0, reviews);
      return humanStddev > HUMAN_STDDEV_WARN;
    });
  }, [criteria, aiAxes, reviews]);

  // 결정 상태 — initialResolutions 로 시작 + 모달에서 결정 시 추가.
  const [resolutions, setResolutions] = useState<DisputeResolution[]>(initialResolutions);

  // 검토 종료 — initialClosedAt 이 있으면 그대로, 없으면 사용자가 버튼 클릭해서 종료.
  const [closedAt, setClosedAt] = useState<string | undefined>(initialClosedAt);

  // submitted 평가만 점수에 반영. draft 는 제외.
  const submittedReviews = useMemo(
    () => reviews.filter((r) => r.status === "submitted"),
    [reviews]
  );

  // 사람 평가 1명+ 가 들어온 axis 수 — 자동으로 사람 평균이 final 이 됨.
  // 그중 σ > 20 인 것은 격차 큰 axis 로 따로 카운트해 운영자에게 경고.
  const { humanFinalizedCount, noisyAxesCount } = useMemo(() => {
    let humanCnt = 0;
    let noisyCnt = 0;
    for (const c of criteria) {
      const ai = aiAxes.find((a) => a.criterionId === c.id);
      const aiMean = ai?.mean ?? 0;
      const scores = submittedReviews
        .map((r) => {
          const a = r.axes.find((x) => x.criterionId === c.id);
          if (!a) return null;
          if (a.acceptedAiScore) return aiMean;
          return a.overrideScore ?? null;
        })
        .filter((s): s is number => s !== null);
      if (scores.length === 0) continue;
      humanCnt += 1;
      if (scores.length >= 2) {
        const m = scores.reduce((s, x) => s + x, 0) / scores.length;
        const sd = Math.sqrt(
          scores.reduce((s, x) => s + (x - m) ** 2, 0) / scores.length
        );
        if (sd > 20) noisyCnt += 1;
      }
    }
    return { humanFinalizedCount: humanCnt, noisyAxesCount: noisyCnt };
  }, [criteria, aiAxes, submittedReviews]);

  // 호환 — 이전 정책의 명시 분쟁 결정이 있는 axis 의 수. 모두 결정되어야 종료 가능.
  const pendingLegacyDisputeCount = useMemo(() => {
    return disputeAxes.filter(
      (c) => !resolutions.some((r) => r.criterionId === c.id)
    ).length;
  }, [disputeAxes, resolutions]);

  // 검토 종료 활성화: legacy 분쟁 결정이 없거나 모두 결정됐으면 OK.
  const allDecided = pendingLegacyDisputeCount === 0;
  const reviewClosed = !!closedAt;

  // 백엔드 호출 in-flight 표시.
  const [busy, setBusy] = useState<"resolve" | "close" | "reopen" | null>(null);

  // 다른 심사위원 평가 0건이어도 본인 평가 작성 영역은 보여야 한다.
  // 본인이 첫 평가자가 되는 경우가 흔하므로 early return 금지 — 아래에서
  // hasReviews 분기로 비교 테이블/코멘트만 가리고 MyReviewDraft 는 그대로.
  const hasReviews = reviews.length > 0;

  async function handleCloseReview() {
    const optimistic = new Date().toISOString();
    setClosedAt(optimistic);

    if (!usingBackend) return;

    setBusy("close");
    try {
      const res = await fetch(
        `/api/competitions/${competitionId}/proposals/${proposalId}/close`,
        { method: "PATCH" }
      );
      if (!res.ok) {
        const { error } = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(error ?? `HTTP ${res.status}`);
      }
      router.refresh();
    } catch (err) {
      console.error("close review failed", err);
      alert(`검토 종료 저장 실패: ${(err as Error).message}`);
      setClosedAt(undefined); // 롤백.
    } finally {
      setBusy(null);
    }
  }

  async function handleReopenReview() {
    const prevClosedAt = closedAt;
    setClosedAt(undefined);

    if (!usingBackend) return;

    setBusy("reopen");
    try {
      const res = await fetch(
        `/api/competitions/${competitionId}/proposals/${proposalId}/close`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const { error } = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(error ?? `HTTP ${res.status}`);
      }
      router.refresh();
    } catch (err) {
      console.error("reopen review failed", err);
      alert(`종료 취소 실패: ${(err as Error).message}`);
      setClosedAt(prevClosedAt);
    } finally {
      setBusy(null);
    }
  }


  return (
    <section className="mb-14" aria-labelledby="judge-review-heading">
      <div className="flex items-baseline justify-between gap-3 flex-wrap mb-2">
        <h2
          id="judge-review-heading"
          style={{
            fontWeight: 700,
            fontSize: "1.125rem",
            lineHeight: 1.4,
            color: "var(--text-primary)",
            letterSpacing: "-0.005em",
          }}
        >
          심사위원 평가
        </h2>
        <p
          className="text-[10.5px] font-bold uppercase"
          style={{ color: "var(--text-tertiary)", letterSpacing: "0.14em" }}
        >
          {hasReviews ? `${reviews.length}명 제출` : "아직 제출 없음"}
          {humanFinalizedCount > 0 &&
            ` · 사람 합의 ${humanFinalizedCount}개`}
          {noisyAxesCount > 0 && ` · 격차 큼 ${noisyAxesCount}개`}
        </p>
      </div>

      {hasReviews ? (
        <>
          <p
            className="text-[12.5px] mb-4 max-w-2xl"
            style={{
              color: "var(--text-tertiary)",
              letterSpacing: "0.02em",
              wordBreak: "keep-all",
            }}
          >
            AI 1차 점수 위에 각 심사위원이 매긴 점수와 코멘트입니다. 사람이
            제출한 axis 는 그 평균이 자동으로 최종 점수가 됩니다.
          </p>

          {/* 심사위원 chip 리스트 */}
          <div className="flex items-center flex-wrap gap-x-2 gap-y-2 mb-7">
            {reviews.map((r, i) => (
              <span
                key={r.judgeId}
                className="inline-flex items-center gap-2 px-2.5 py-1 text-[12px]"
                style={{
                  background: "var(--surface-1)",
                  border: "1px solid var(--t-border-subtle)",
                  color: "var(--text-primary)",
                  letterSpacing: "0.01em",
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: judgeColor(i) }}
                  aria-hidden
                />
                <span style={{ fontWeight: 600 }}>{r.judgeName}</span>
                {r.affiliation && (
                  <span style={{ color: "var(--text-tertiary)" }}>
                    · {r.affiliation}
                  </span>
                )}
              </span>
            ))}
          </div>

          {/* 격차 경고 — σ>20 인 axis 가 있으면 운영자에게 알림. 점수는 평균으로
              이미 반영됨. 추가 평가자 초대 같은 능동 액션을 권고. */}
          {noisyAxesCount > 0 && (
            <div
              className="flex items-start gap-2.5 px-4 py-3 mb-3 text-[12.5px]"
              style={{
                background: "var(--signal-attention-soft)",
                border: "1px solid var(--signal-attention-ring)",
                borderRadius: 2,
                color: "var(--text-secondary)",
                wordBreak: "keep-all",
              }}
            >
              <AlertTriangle
                className="w-3.5 h-3.5 mt-0.5 shrink-0"
                style={{ color: "var(--signal-attention)" }}
                strokeWidth={2.4}
              />
              <span>
                심사위원 점수 격차가 큰 항목{" "}
                <strong style={{ color: "var(--signal-attention)" }}>
                  {noisyAxesCount}개
                </strong>
                가 있습니다 (σ &gt; 20). 평균은 반영되었지만 추가 평가자 초대를
                권고합니다.
              </span>
            </div>
          )}

          <ComparisonTable
            criteria={criteria}
            aiAxes={aiAxes}
            reviews={reviews}
            resolutions={resolutions}
            disputeIds={new Set(disputeAxes.map((c) => c.id))}
            disabled={reviewClosed}
          />

          <OverallComments reviews={reviews} />
        </>
      ) : (
        <EmptyReviews />
      )}

      <MyReviewDraft
        criteria={criteria}
        aiAxes={aiAxes}
        competitionId={competitionId}
        proposalId={proposalId}
        usingBackend={usingBackend}
        existingReview={myExistingReview}
      />

      {/* 검토 종료 영역 — 사람 합의 axis 수 / 격차 큰 axis 수 요약 + 종료 액션. */}
      <CloseReviewArea
        humanFinalizedCount={humanFinalizedCount}
        noisyAxesCount={noisyAxesCount}
        legacyPendingCount={pendingLegacyDisputeCount}
        allDecided={allDecided}
        reviewClosed={reviewClosed}
        closedAt={closedAt}
        onClose={handleCloseReview}
        onReopen={handleReopenReview}
      />
    </section>
  );
}

// ── 비교 표 ─────────────────────────────────────────────────────────────
interface ComparisonTableProps {
  criteria: Criterion[];
  aiAxes: AxisScore[];
  reviews: JudgeReview[];
  resolutions: DisputeResolution[];
  /** 강한 분쟁 axis id — 시각 강조 용도(점수 결정엔 영향 없음). */
  disputeIds: Set<string>;
  /** 검토 종료 후엔 일부 인터랙션을 막기 위함 — 현재 미사용. 호환 유지. */
  disabled: boolean;
}
function ComparisonTable({
  criteria,
  aiAxes,
  reviews,
  resolutions,
  disputeIds,
}: ComparisonTableProps) {
  return (
    <div
      className="mb-10 overflow-x-auto border"
      style={{ borderColor: "var(--t-border-subtle)" }}
    >
      <table className="w-full text-[12.5px] tabular-nums" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "var(--surface-2)" }}>
            <Th align="left" minW={120}>항목</Th>
            <Th align="right">AI</Th>
            {reviews.map((r, i) => (
              <Th key={r.judgeId} align="right">
                <span className="inline-flex items-center gap-1.5 justify-end">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: judgeColor(i) }}
                    aria-hidden
                  />
                  {r.judgeName}
                </span>
              </Th>
            ))}
            <Th align="right" subtle>사람 평균</Th>
            <Th align="right" subtle>σ</Th>
            <Th align="right" subtle>결정</Th>
          </tr>
        </thead>
        <tbody>
          {criteria.map((c) => {
            const ai = aiAxes.find((a) => a.criterionId === c.id);
            const humanScores = reviews.map((r) => {
              const review = r.axes.find((a) => a.criterionId === c.id);
              if (!review) return null;
              if (review.acceptedAiScore) return ai?.mean ?? null;
              return review.overrideScore ?? null;
            });
            const valid = humanScores.filter((s): s is number => s !== null);
            const humanMean =
              valid.length === 0
                ? null
                : Math.round(valid.reduce((s, x) => s + x, 0) / valid.length);
            const humanStddev =
              valid.length < 2
                ? 0
                : Math.sqrt(
                    valid.reduce((s, x) => s + (x - (humanMean ?? 0)) ** 2, 0) /
                      valid.length
                  );

            const isDispute = disputeIds.has(c.id);
            const resolution = resolutions.find((r) => r.criterionId === c.id);
            const resolved = !!resolution;

            // A안 자동 합의 — 분쟁이지만 submitted 평가자 ≥ 1, 사람 σ ≤ 7 이면
            // 사람 평균이 자동 채택되어 별도 결정이 필요 없다.
            // (score.ts 의 foldFinalScore 와 동일한 규칙.)
            const submittedHumanScores = reviews
              .filter((r) => r.status === "submitted")
              .map((r) => {
                const review = r.axes.find((a) => a.criterionId === c.id);
                if (!review) return null;
                if (review.acceptedAiScore) return ai?.mean ?? null;
                return review.overrideScore ?? null;
              })
              .filter((s): s is number => s !== null);
            const submittedMean =
              submittedHumanScores.length === 0
                ? null
                : Math.round(
                    submittedHumanScores.reduce((s, x) => s + x, 0) /
                      submittedHumanScores.length
                  );
            const submittedStddev =
              submittedHumanScores.length < 2
                ? 0
                : Math.sqrt(
                    submittedHumanScores.reduce(
                      (s, x) => s + (x - (submittedMean ?? 0)) ** 2,
                      0
                    ) / submittedHumanScores.length
                  );
            const autoConsensus =
              !resolved &&
              isDispute &&
              submittedHumanScores.length >= 1 &&
              submittedStddev <= HUMAN_STDDEV_WARN;

            // 행 배경: 결정 안 된 분쟁만 강조. 결정 끝났으면 차분하게.
            const rowBg = isDispute
              ? resolved
                ? "var(--surface-1)"
                : "var(--accent-soft)"
              : undefined;

            return (
              <tr
                key={c.id}
                style={{
                  borderBottom: "1px solid var(--t-border-subtle)",
                  background: rowBg,
                }}
              >
                <td className="px-4 py-3" style={{ color: "var(--text-primary)" }}>
                  <span style={{ fontWeight: 600 }}>{c.name}</span>
                  <span
                    className="ml-1.5 text-[10.5px]"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    (w {Math.round(c.weight * 100)}%)
                  </span>
                </td>
                <td
                  className="text-right px-3 py-3"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {ai?.mean ?? "—"}
                </td>
                {reviews.map((r, i) => {
                  const review = r.axes.find((a) => a.criterionId === c.id);
                  const accepted = review?.acceptedAiScore ?? false;
                  const score = accepted ? ai?.mean : review?.overrideScore;
                  return (
                    <td
                      key={r.judgeId}
                      className="text-right px-3 py-3"
                      style={{ color: "var(--text-primary)" }}
                    >
                      <span className="inline-flex items-center gap-1.5 justify-end">
                        {accepted ? (
                          <>
                            <Check
                              className="w-3 h-3"
                              style={{ color: judgeColor(i) }}
                              strokeWidth={2.4}
                              aria-label="AI 점수 수용"
                            />
                            <span style={{ color: "var(--text-tertiary)" }}>
                              {score ?? "—"}
                            </span>
                          </>
                        ) : (
                          <>
                            <Pencil
                              className="w-3 h-3"
                              style={{ color: judgeColor(i) }}
                              strokeWidth={2.2}
                              aria-label="점수 수정"
                            />
                            <span style={{ fontWeight: 700 }}>{score ?? "—"}</span>
                          </>
                        )}
                      </span>
                    </td>
                  );
                })}
                <td
                  className="text-right px-3 py-3"
                  style={{
                    color: "var(--text-primary)",
                    fontWeight: 700,
                    background: "var(--surface-1)",
                  }}
                >
                  {humanMean ?? "—"}
                </td>
                <td
                  className="text-right px-3 py-3"
                  style={{
                    background: "var(--surface-1)",
                    color: isDispute
                      ? "var(--signal-attention)"
                      : "var(--text-tertiary)",
                    fontWeight: isDispute ? 700 : 500,
                  }}
                >
                  <span className="inline-flex items-center gap-1 justify-end">
                    {isDispute && !resolved && (
                      <AlertTriangle className="w-3 h-3" strokeWidth={2.4} />
                    )}
                    {humanStddev.toFixed(1)}
                  </span>
                </td>
                <td
                  className="text-right px-3 py-3"
                  style={{ background: "var(--surface-1)" }}
                >
                  {resolved ? (
                    // 호환 — 이전 정책에서 만든 분쟁 결정 row 가 있으면 표시.
                    <ResolvedBadge resolution={resolution!} />
                  ) : submittedHumanScores.length === 0 ? (
                    // 사람 제출 0명 — AI 점수가 final.
                    <span style={{ color: "var(--text-tertiary)" }}>—</span>
                  ) : submittedStddev > 20 ? (
                    // σ>20 — 사람 평균 채택하되 격차 큼 경고.
                    <NoisyBadge mean={submittedMean ?? 0} stddev={submittedStddev} />
                  ) : (
                    // 사람 평균 자동 채택.
                    <ConsensusBadge mean={submittedMean ?? 0} />
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Th({
  children,
  align,
  minW,
  subtle,
}: {
  children: React.ReactNode;
  align: "left" | "right";
  minW?: number;
  subtle?: boolean;
}) {
  return (
    <th
      className="px-3 py-2.5 font-bold uppercase"
      style={{
        color: "var(--text-tertiary)",
        letterSpacing: "0.14em",
        fontSize: "10.5px",
        borderBottom: "1px solid var(--t-border-subtle)",
        textAlign: align,
        background: subtle ? "var(--surface-1)" : undefined,
        minWidth: minW,
      }}
    >
      {children}
    </th>
  );
}

// 사람 평균이 자동 final 인 axis — σ ≤ 20.
function ConsensusBadge({ mean }: { mean: number }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-1 text-[11px] font-semibold"
      style={{
        background: "var(--surface-2)",
        border: "1px solid var(--t-border-subtle)",
        color: "var(--signal-success)",
        letterSpacing: "0.02em",
      }}
      title="심사위원 평균이 자동으로 최종 점수가 됩니다."
    >
      <Check
        className="w-3 h-3"
        style={{ color: "var(--signal-success)" }}
        strokeWidth={2.4}
      />
      합의 {mean}
    </span>
  );
}

// σ > 20 — 사람 평균은 채택하되 격차 큼 경고. 운영자에게 정보 신호.
function NoisyBadge({ mean, stddev }: { mean: number; stddev: number }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-1 text-[11px] font-semibold"
      style={{
        background: "var(--signal-attention-soft)",
        border: "1px solid var(--signal-attention-ring)",
        color: "var(--signal-attention)",
        letterSpacing: "0.02em",
      }}
      title={`심사위원 점수 격차가 큽니다 (σ ${stddev.toFixed(
        1
      )}). 평균은 반영되지만 추가 평가자 초대를 권고합니다.`}
    >
      <AlertTriangle
        className="w-3 h-3"
        style={{ color: "var(--signal-attention)" }}
        strokeWidth={2.4}
      />
      격차 {mean}
    </span>
  );
}

// 결정된 분쟁의 inline 표시 — 아이콘 + 최종 점수 + 결정 시각.
function ResolvedBadge({ resolution }: { resolution: DisputeResolution }) {
  const Icon = actionIcon(resolution.action);
  const label = actionLabel(resolution.action);
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-1 text-[11px] font-semibold"
      style={{
        background: "var(--surface-2)",
        border: "1px solid var(--t-border-subtle)",
        color: "var(--signal-success)",
        letterSpacing: "0.02em",
      }}
      title={`${label} · ${resolution.decidedBy.judgeName}`}
    >
      <Icon
        className="w-3 h-3"
        style={{ color: "var(--signal-success)" }}
        strokeWidth={2.4}
      />
      {resolution.finalScore !== undefined ? resolution.finalScore : "재평가"}
    </span>
  );
}

// ── 종합 코멘트 카드 ─────────────────────────────────────────────────────
function OverallComments({ reviews }: { reviews: JudgeReview[] }) {
  const withComments = reviews.filter(
    (r) => r.overallComment && r.overallComment.trim().length > 0
  );
  if (withComments.length === 0) return null;

  return (
    <div className="mb-10">
      <h3
        className="mb-3 text-[12.5px] font-bold uppercase"
        style={{ color: "var(--text-tertiary)", letterSpacing: "0.14em" }}
      >
        종합 코멘트
      </h3>
      <div className="space-y-2.5">
        {withComments.map((r) => {
          const i = reviews.findIndex((rr) => rr.judgeId === r.judgeId);
          return (
            <div
              key={r.judgeId}
              className="grid grid-cols-[auto_1fr] gap-x-4 px-5 py-3.5"
              style={{
                background: "var(--surface-1)",
                border: "1px solid var(--t-border-subtle)",
              }}
            >
              <span
                className="inline-flex items-center gap-2 shrink-0 text-[12px] font-semibold pt-0.5"
                style={{ color: "var(--text-primary)" }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: judgeColor(i) }}
                  aria-hidden
                />
                {r.judgeName}
              </span>
              <p
                className="text-[13px] leading-[1.7]"
                style={{ color: "var(--text-secondary)", wordBreak: "keep-all" }}
              >
                {r.overallComment}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── 내 평가 작성 — 본인이 심사위원으로서 axis 별 점수/코멘트 + 종합 코멘트 ─────
//
// usingBackend=true 이면 POST /api/.../reviews 로 서버에 저장 (upsert).
// false 이면 console.log 만 (mock URL 로 들어온 데모 케이스).
//
// existingReview 가 있으면 폼을 그 값으로 채워두고 "이미 제출됨" 모드로 시작.
// 사용자가 "수정하기" 누르면 편집 가능 상태로 전환되고 다시 제출하면 덮어쓰기.
function MyReviewDraft({
  criteria,
  aiAxes,
  competitionId,
  proposalId,
  usingBackend,
  existingReview,
}: {
  criteria: Criterion[];
  aiAxes: AxisScore[];
  competitionId: string;
  proposalId: string;
  usingBackend: boolean;
  existingReview?: JudgeReview;
}) {
  const router = useRouter();

  // 폼 초기값을 existingReview 기반으로 셋업. acceptedAi=true 이면 비워두고
  // (placeholder=AI 점수), false 이면 본인의 overrideScore 를 prefill.
  const initialOverrides: Record<string, number | undefined> = {};
  const initialComments: Record<string, string> = {};
  if (existingReview) {
    for (const a of existingReview.axes) {
      if (!a.acceptedAiScore && typeof a.overrideScore === "number") {
        initialOverrides[a.criterionId] = a.overrideScore;
      }
      if (a.comment) initialComments[a.criterionId] = a.comment;
    }
  }

  const [overrides, setOverrides] =
    useState<Record<string, number | undefined>>(initialOverrides);
  const [comments, setComments] = useState<Record<string, string>>(initialComments);
  const [overallComment, setOverallComment] = useState(
    existingReview?.overallComment ?? ""
  );
  // 이미 submitted 된 review 가 있으면 처음엔 잠겨있고 "수정하기" 버튼으로 풀림.
  const [editing, setEditing] = useState(
    !existingReview || existingReview.status !== "submitted"
  );
  const [submitted, setSubmitted] = useState(
    existingReview?.status === "submitted"
  );
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function setOverride(cid: string, val: string) {
    if (val.trim() === "") {
      setOverrides((prev) => {
        const n = { ...prev };
        delete n[cid];
        return n;
      });
      return;
    }
    const n = Number(val);
    if (Number.isFinite(n) && n >= 0 && n <= 100) {
      setOverrides((prev) => ({ ...prev, [cid]: n }));
    }
  }

  async function handleSubmit() {
    setErrorMsg(null);

    // axes 구성 — 각 axis 마다 점수 입력 여부에 따라 acceptedAiScore / overrideScore 결정.
    const axes: AxisReview[] = criteria.map((c) => {
      const override = overrides[c.id];
      const comment = comments[c.id]?.trim() || undefined;
      if (override === undefined) {
        return { criterionId: c.id, acceptedAiScore: true, comment };
      }
      return { criterionId: c.id, acceptedAiScore: false, overrideScore: override, comment };
    });

    if (!usingBackend) {
      // 데모 모드 — 콘솔에만 찍고 submitted 상태로.
      console.log("[Fastlane demo] 내 평가 (mock URL — 저장 X):", {
        axes,
        overallComment,
      });
      setSubmitted(true);
      setEditing(false);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/competitions/${competitionId}/proposals/${proposalId}/reviews`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            axes,
            overallComment: overallComment.trim() || undefined,
            status: "submitted",
          }),
        }
      );
      if (!res.ok) {
        const { error } = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(error ?? `HTTP ${res.status}`);
      }
      setSubmitted(true);
      setEditing(false);
      router.refresh(); // 상위 페이지가 새 review 를 다시 로드하도록.
    } catch (err) {
      console.error("submit review failed", err);
      setErrorMsg((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="px-7 py-7 mb-10"
      style={{
        background: "var(--surface-1)",
        border: "1px solid var(--accent-ring)",
      }}
    >
      <div className="flex items-baseline justify-between gap-3 flex-wrap mb-2">
        <h3
          className="inline-flex items-center gap-2"
          style={{
            fontWeight: 700,
            fontSize: "1rem",
            color: "var(--text-primary)",
            letterSpacing: "-0.005em",
          }}
        >
          <MessageSquare
            className="w-4 h-4"
            style={{ color: "var(--accent)" }}
            strokeWidth={2.2}
          />
          내 평가 작성
        </h3>
        <div className="inline-flex items-center gap-2">
          {/* mock 데모(competitionId 가 UUID 아님)에서만 "저장 안 됨" 경고. */}
          {!usingBackend && (
            <span
              className="text-[10.5px] font-medium"
              style={{ color: "var(--signal-attention)" }}
            >
              데모 — 저장 안 됨
            </span>
          )}
          {/* 이미 제출된 평가가 있고 잠긴 상태 — "수정하기" 로 편집 모드 진입. */}
          {existingReview?.status === "submitted" && !editing && (
            <button
              type="button"
              onClick={() => {
                setEditing(true);
                setSubmitted(false);
              }}
              className="inline-flex items-center gap-1 px-2.5 h-7 text-[11.5px] font-medium transition-colors hover:bg-[color:var(--surface-2)]"
              style={{
                border: "1px solid var(--t-border-subtle)",
                color: "var(--text-secondary)",
                background: "var(--surface-1)",
              }}
            >
              <Pencil className="w-3 h-3" strokeWidth={2.2} />
              수정하기
            </button>
          )}
        </div>
      </div>

      {/* 이미 제출된 평가 — 잠금 상태 안내. 수정하기 누르기 전까지 편집 불가. */}
      {existingReview?.status === "submitted" && !editing && (
        <div
          className="flex items-center gap-2 px-3 py-2 mb-4 text-[12px]"
          style={{
            background: "var(--accent-soft)",
            border: "1px solid var(--accent-ring)",
            borderRadius: 2,
            color: "var(--text-secondary)",
          }}
        >
          <Check
            className="w-3.5 h-3.5"
            style={{ color: "var(--signal-success)" }}
            strokeWidth={2.4}
          />
          <span>
            이미 평가를 제출하셨습니다
            {existingReview.submittedAt &&
              ` · ${new Date(existingReview.submittedAt).toLocaleString("ko-KR")}`}
            . 수정하려면 우측 <strong>수정하기</strong> 버튼을 누르세요.
          </span>
        </div>
      )}
      <p
        className="text-[12px] mb-4"
        style={{ color: "var(--text-tertiary)", letterSpacing: "0.02em" }}
      >
        AI 점수를 그대로 두려면 비워두고, 다르게 매기고 싶으면 0~100 사이로
        입력하세요. 항목별·전체 코멘트도 함께 남길 수 있습니다.
      </p>

      {/* AI 점수 전부 동의 — 분쟁 axis 0개 + 본인 override 0개일 때만 노출.
          심사위원이 "이 출품 다 동의야" 의사를 한 번에 표현하고 제출하도록.
          매트릭스의 ● 제출 완료 셀을 채우는 가장 빠른 경로. */}
      {(() => {
        const disputedCount = aiAxes.filter((a) => a.needsReview).length;
        const hasAnyOverride = Object.values(overrides).some(
          (v) => v !== undefined
        );
        if (disputedCount > 0) {
          return (
            <div
              className="flex items-start gap-2.5 px-4 py-3 mb-5 text-[12.5px]"
              style={{
                background: "var(--signal-attention-soft)",
                border: "1px solid var(--signal-attention-ring)",
                borderRadius: 2,
                color: "var(--text-secondary)",
                wordBreak: "keep-all",
              }}
            >
              <AlertTriangle
                className="w-3.5 h-3.5 mt-0.5 shrink-0"
                style={{ color: "var(--signal-attention)" }}
                strokeWidth={2.4}
              />
              <span>
                AI 의 판단이 갈리는 항목{" "}
                <strong style={{ color: "var(--signal-attention)" }}>
                  {disputedCount}개
                </strong>
                가 있습니다 — 그 항목만 우선 점수를 매겨주세요. 나머지는
                비워두고 제출하면 AI 점수가 그대로 반영됩니다.
              </span>
            </div>
          );
        }
        // 분쟁 0개 — 빠른 동의 액션
        return (
          <div
            className="flex items-center justify-between gap-3 px-4 py-3 mb-5 flex-wrap"
            style={{
              background: "var(--accent-soft)",
              border: "1px solid var(--accent-ring)",
              borderRadius: 2,
            }}
          >
            <div className="flex items-start gap-2.5 min-w-0">
              <Check
                className="w-3.5 h-3.5 mt-0.5 shrink-0"
                style={{ color: "var(--accent)" }}
                strokeWidth={2.4}
              />
              <p
                className="text-[12.5px] leading-[1.6]"
                style={{ color: "var(--text-secondary)", wordBreak: "keep-all" }}
              >
                AI 가 모든 항목에 자신감을 보였습니다 — 분쟁 항목 없음. 모두 AI
                점수에 동의하시나요?
              </p>
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !editing || hasAnyOverride}
              title={
                hasAnyOverride
                  ? "입력한 점수가 있어 빠른 동의를 사용할 수 없습니다. 일반 제출 버튼을 사용하세요."
                  : undefined
              }
              className="inline-flex items-center gap-1.5 px-3.5 h-9 text-[13px] font-medium text-white shrink-0 transition-[filter] hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: "var(--accent)", borderRadius: 2 }}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  제출 중…
                </>
              ) : submitted ? (
                <>
                  <Check className="w-3.5 h-3.5" strokeWidth={2.4} />
                  제출 완료
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" strokeWidth={2.4} />
                  모두 동의하고 제출
                </>
              )}
            </button>
          </div>
        );
      })()}

      <div className="space-y-3 mb-5">
        {criteria.map((c) => {
          const ai = aiAxes.find((a) => a.criterionId === c.id);
          const myScore = overrides[c.id];
          // AI 분산이 임계를 넘는 axis 는 시각적으로 강조해 심사위원이 우선
          // 검토하게 한다. needsReview 는 AI 평가 시점에 STDDEV_REVIEW_THRESHOLD
          // (현재 8) 기준으로 미리 계산된 플래그.
          const needsAttention = ai?.needsReview === true;
          return (
            <div
              key={c.id}
              className="px-4 py-3"
              style={{
                borderBottom: "1px solid var(--t-border-subtle)",
                background: needsAttention
                  ? "var(--signal-attention-soft)"
                  : undefined,
                borderLeft: needsAttention
                  ? "3px solid var(--signal-attention)"
                  : "3px solid transparent",
              }}
            >
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                    <p
                      className="text-[13px] font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {c.name}
                    </p>
                    {needsAttention && (
                      <span
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold uppercase"
                        style={{
                          background: "var(--signal-attention)",
                          color: "#fff",
                          letterSpacing: "0.06em",
                          borderRadius: 2,
                        }}
                        title="AI 의 3-Pass 점수 분산이 임계(σ>8)를 넘었습니다. 사람 검토를 권장합니다."
                      >
                        <AlertTriangle className="w-2.5 h-2.5" strokeWidth={2.6} />
                        임계 초과
                      </span>
                    )}
                  </div>
                  <p
                    className="text-[11.5px] truncate"
                    style={{
                      color: needsAttention
                        ? "var(--signal-attention)"
                        : "var(--text-tertiary)",
                      fontWeight: needsAttention ? 600 : 500,
                    }}
                  >
                    AI {ai?.mean ?? "—"} · σ {ai?.stddev.toFixed(1) ?? "—"}
                  </p>
                </div>
                <input
                  type="number"
                  min={0}
                  max={100}
                  placeholder={String(ai?.mean ?? "—")}
                  value={myScore ?? ""}
                  onChange={(e) => setOverride(c.id, e.target.value)}
                  aria-label={`${c.name} 내 점수`}
                  disabled={!editing}
                  className="w-20 px-2.5 h-9 text-[14px] font-semibold text-right tabular-nums outline-none disabled:opacity-60"
                  style={{
                    background: "var(--surface-2)",
                    border: "1px solid var(--t-border-subtle)",
                    color: "var(--text-primary)",
                  }}
                />
                <input
                  type="text"
                  placeholder="이 항목에 대한 코멘트 (선택)"
                  value={comments[c.id] ?? ""}
                  onChange={(e) =>
                    setComments((prev) => ({ ...prev, [c.id]: e.target.value }))
                  }
                  aria-label={`${c.name} 코멘트`}
                  disabled={!editing}
                  className="w-full px-3 h-9 text-[12.5px] outline-none disabled:opacity-60"
                  style={{
                    background: "var(--surface-2)",
                    border: "1px solid var(--t-border-subtle)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              {/* AI 의 axis 별 근거 — Judge 의 1-2 문장 assessment. 점수 매기는
                  바로 그 자리에서 보여 anchoring 줄이고 신뢰 형성. */}
              {ai?.reasoning && (
                <p
                  className="mt-2 text-[12.5px] leading-[1.65]"
                  style={{
                    color: "var(--text-secondary)",
                    fontStyle: "italic",
                    fontFamily: "'Fraunces', serif",
                    wordBreak: "keep-all",
                  }}
                >
                  <span
                    className="inline-block mr-1.5 text-[10px] font-bold uppercase tracking-wider not-italic align-middle px-1.5 py-0.5"
                    style={{
                      background: "var(--surface-2)",
                      border: "1px solid var(--t-border-subtle)",
                      color: "var(--text-tertiary)",
                      letterSpacing: "0.12em",
                      fontFamily: "var(--font-sans, system-ui)",
                      borderRadius: 2,
                    }}
                  >
                    AI 근거
                  </span>
                  &ldquo;{ai.reasoning}&rdquo;
                </p>
              )}
            </div>
          );
        })}
      </div>

      <label
        className="block text-[11px] font-bold uppercase mb-2"
        style={{ color: "var(--text-tertiary)", letterSpacing: "0.14em" }}
      >
        종합 코멘트
      </label>
      <textarea
        value={overallComment}
        onChange={(e) => setOverallComment(e.target.value)}
        placeholder="이 출품에 대한 전반적인 의견을 짧게 적어주세요."
        rows={3}
        disabled={!editing}
        className="w-full px-3 py-2.5 text-[13px] leading-[1.6] outline-none mb-5 disabled:opacity-60 resize-none"
        style={{
          background: "var(--surface-2)",
          border: "1px solid var(--t-border-subtle)",
          color: "var(--text-primary)",
          wordBreak: "keep-all",
        }}
      />

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p
          className="text-[11.5px]"
          style={{
            color: errorMsg ? "var(--signal-danger)" : "var(--text-tertiary)",
          }}
        >
          {errorMsg
            ? `저장 실패: ${errorMsg}`
            : submitted
            ? usingBackend
              ? "제출되었습니다. 다른 심사위원의 평가와 함께 위 표에 반영됩니다."
              : "데모 모드 — 흐름만 시연되고 저장은 되지 않습니다."
            : usingBackend
            ? "제출하면 본인의 점수·코멘트가 저장됩니다."
            : "제출 전까지 다른 심사위원에게 공개되지 않습니다."}
        </p>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!editing || submitting}
          className="inline-flex items-center gap-2 px-5 h-10 text-[13px] font-semibold text-white transition-[filter] hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: "var(--accent)", letterSpacing: "0.01em" }}
        >
          {submitting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              저장 중…
            </>
          ) : submitted && !editing ? (
            <>
              <Check className="w-3.5 h-3.5" strokeWidth={2.4} />
              제출됨{!usingBackend && " (데모)"}
            </>
          ) : existingReview?.status === "submitted" ? (
            <>
              <Send className="w-3.5 h-3.5" strokeWidth={2.2} />
              수정 저장
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" strokeWidth={2.2} />
              평가 제출
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ── 검토 종료 영역 — proposal 단위 마무리 액션 ─────────────────────────────
function CloseReviewArea({
  humanFinalizedCount,
  noisyAxesCount,
  legacyPendingCount,
  allDecided,
  reviewClosed,
  closedAt,
  onClose,
  onReopen,
}: {
  /** 사람 평가 1명+ 가 들어와 사람 평균이 final 인 axis 수. */
  humanFinalizedCount: number;
  /** σ>20 격차 큰 axis 수 — 운영자에게 경고 표시 용. */
  noisyAxesCount: number;
  /** 이전 정책의 명시 분쟁 결정 row 가 있는데 아직 결정 안 된 axis 수 (보통 0). */
  legacyPendingCount: number;
  allDecided: boolean;
  reviewClosed: boolean;
  closedAt: string | undefined;
  onClose: () => void;
  onReopen: () => void;
}) {
  // 종료된 상태 — 차분한 success 카드 + 종료 취소 버튼.
  if (reviewClosed) {
    return (
      <div
        className="grid grid-cols-[auto_1fr_auto] items-center gap-5 px-7 py-5"
        style={{
          background: "var(--surface-1)",
          border: "1px solid var(--signal-success)",
        }}
      >
        <ShieldCheck
          className="w-6 h-6"
          style={{ color: "var(--signal-success)" }}
          strokeWidth={1.8}
        />
        <div className="min-w-0">
          <p
            className="text-[13px] font-bold mb-0.5"
            style={{ color: "var(--signal-success)", letterSpacing: "0.04em" }}
          >
            검토 종료됨
          </p>
          <p
            className="text-[12px]"
            style={{ color: "var(--text-tertiary)" }}
          >
            본 출품에 대한 심사가 종료되었습니다.
            {closedAt && ` · ${new Date(closedAt).toLocaleString("ko-KR")}`}
          </p>
        </div>
        <button
          type="button"
          onClick={onReopen}
          className="px-4 h-9 text-[12px] font-medium transition-colors hover:bg-[color:var(--surface-2)]"
          style={{
            border: "1px solid var(--t-border-subtle)",
            color: "var(--text-tertiary)",
          }}
        >
          종료 취소
        </button>
      </div>
    );
  }

  // 진행 중 — 사람 합의 / 격차 요약 + 종료 버튼.
  return (
    <div
      className="px-7 py-5"
      style={{
        background: "var(--surface-1)",
        border: "1px solid var(--t-border-subtle)",
      }}
    >
      <div className="flex items-baseline justify-between gap-3 flex-wrap mb-3">
        <h3
          className="text-[13px] font-bold"
          style={{ color: "var(--text-primary)", letterSpacing: "0.02em" }}
        >
          검토 종료
        </h3>
        <span
          className="text-[10.5px] font-bold uppercase tabular-nums"
          style={{ color: "var(--text-tertiary)", letterSpacing: "0.14em" }}
        >
          사람 합의 {humanFinalizedCount}개
          {noisyAxesCount > 0 ? ` · 격차 큼 ${noisyAxesCount}개` : ""}
        </span>
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p
          className="text-[12px] leading-[1.6] max-w-md"
          style={{ color: "var(--text-secondary)", wordBreak: "keep-all" }}
        >
          {legacyPendingCount > 0
            ? `이전 정책에서 만든 분쟁 결정 row ${legacyPendingCount}개가 아직 미결정 상태입니다. 모두 결정되거나 정리되어야 종료 가능합니다.`
            : noisyAxesCount > 0
            ? "격차가 큰 항목이 있습니다. 평균은 반영되었으니 그대로 종료하거나, 추가 평가자를 초대한 뒤 종료할 수 있습니다."
            : humanFinalizedCount === 0
            ? "아직 사람 평가가 한 건도 들어오지 않았습니다. 그대로 종료하면 AI 점수가 그대로 최종이 됩니다."
            : "사람 평가가 반영된 상태입니다. 종료하면 이 출품이 검토 대기에서 빠지고 결과 페이지에 반영됩니다."}
        </p>
        <button
          type="button"
          onClick={onClose}
          disabled={!allDecided}
          className="inline-flex items-center gap-2 px-5 h-10 text-[13px] font-semibold text-white transition-[filter] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: "var(--accent)", letterSpacing: "0.01em" }}
        >
          <ShieldCheck className="w-3.5 h-3.5" strokeWidth={2.2} />
          검토 종료
        </button>
      </div>
    </div>
  );
}

function EmptyReviews() {
  return (
    <section
      className="mb-8 px-7 py-8 text-center"
      style={{
        background: "var(--surface-1)",
        border: "1px dashed var(--t-border-subtle)",
      }}
    >
      <p
        className="mb-1 text-[13.5px] font-semibold"
        style={{ color: "var(--text-primary)" }}
      >
        다른 심사위원 평가가 아직 없습니다.
      </p>
      <p
        className="text-[12.5px] leading-[1.7] max-w-md mx-auto"
        style={{ color: "var(--text-tertiary)", wordBreak: "keep-all" }}
      >
        아래 <strong>내 평가 작성</strong> 에서 본인이 첫 평가자가 될 수 있습니다.
        다른 위원들이 제출하면 항목별로 AI 점수와 비교한 표가 이 자리에 나타납니다.
      </p>
    </section>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────

// 한 axis 에서 심사위원들의 점수 표준편차 계산.
// acceptedAiScore=true 인 심사위원은 AI mean 을 자신의 점수로 본다.
function computeHumanStddev(
  criterionId: string,
  aiMean: number,
  reviews: JudgeReview[]
): number {
  const scores: number[] = [];
  for (const r of reviews) {
    const a = r.axes.find((x) => x.criterionId === criterionId);
    if (!a) continue;
    if (a.acceptedAiScore) scores.push(aiMean);
    else if (a.overrideScore !== undefined) scores.push(a.overrideScore);
  }
  if (scores.length < 2) return 0;
  const mean = scores.reduce((s, x) => s + x, 0) / scores.length;
  return Math.sqrt(
    scores.reduce((s, x) => s + (x - mean) ** 2, 0) / scores.length
  );
}

// 액션 → 아이콘 매핑 (ResolvedBadge 와 모달에서 공유)
function actionIcon(action: DisputeAction) {
  switch (action) {
    case "accept_ai":
      return Cpu;
    case "accept_human_avg":
      return Check;
    case "manual_override":
      return Pencil;
    case "request_rereview":
      return Repeat;
  }
}

function actionLabel(action: DisputeAction): string {
  switch (action) {
    case "accept_ai":
      return "AI 점수 채택";
    case "accept_human_avg":
      return "심사위원 평균 채택";
    case "manual_override":
      return "직접 결정";
    case "request_rereview":
      return "재평가 회부";
  }
}

// 심사위원별 색 — 3명까지 시연 기준.
function judgeColor(i: number): string {
  const palette = ["#6366f1", "#0d9488", "#b24c28"]; // indigo · teal · 차선 액센트
  return palette[i] ?? "var(--text-tertiary)";
}
