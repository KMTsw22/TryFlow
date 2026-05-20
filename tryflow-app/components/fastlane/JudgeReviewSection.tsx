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
import { DisputeResolutionModal } from "./DisputeResolutionModal";

const SERIF = "'Pretendard Variable', 'Pretendard', system-ui, sans-serif";

// 다인 심사 합의의 분산 임계. 사람 점수 stddev 가 이 값을 넘으면 분쟁으로 본다.
// AI 분산 임계(STDDEV_REVIEW_THRESHOLD=8)와 별도로 관리.
const HUMAN_STDDEV_WARN = 7;

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

  // 현재 결정 진척 — UI 모든 곳에서 같은 값 공유.
  const decidedCount = resolutions.length;
  const disputeCount = disputeAxes.length;
  const allDecided = disputeCount > 0 && decidedCount >= disputeCount;
  const reviewClosed = !!closedAt;

  // 결정 모달 상태.
  const [modalCriterion, setModalCriterion] = useState<Criterion | null>(null);

  // 백엔드 호출 in-flight 표시 — 버튼 비활성화·로딩 스피너 토글에 사용.
  const [busy, setBusy] = useState<"resolve" | "close" | "reopen" | null>(null);

  // 평가가 0건이면 빈 안내.
  if (reviews.length === 0) {
    return <EmptyReviews />;
  }

  // 낙관적 UI — 백엔드 응답 전에 화면을 즉시 갱신해 시연 흐름이 끊기지 않게.
  // 실패 시 setResolutions 를 이전 상태로 롤백.
  async function handleResolve(resolution: DisputeResolution) {
    const prev = resolutions;
    setResolutions((p) => {
      const filtered = p.filter((r) => r.criterionId !== resolution.criterionId);
      return [...filtered, resolution];
    });

    if (!usingBackend) return; // mock 데모는 client state 만.

    setBusy("resolve");
    try {
      const res = await fetch(
        `/api/competitions/${competitionId}/proposals/${proposalId}/disputes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            criterionId: resolution.criterionId,
            action: resolution.action,
            finalScore: resolution.finalScore,
            reason: resolution.reason,
            decidedByName: resolution.decidedBy.judgeName,
          }),
        }
      );
      if (!res.ok) {
        const { error } = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(error ?? `HTTP ${res.status}`);
      }
      router.refresh(); // 다른 곳(예: pending 카드 진행률)도 갱신되게.
    } catch (err) {
      console.error("dispute resolve failed", err);
      alert(`결정 저장 실패: ${(err as Error).message}`);
      setResolutions(prev); // 롤백.
    } finally {
      setBusy(null);
    }
  }

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

  // 모달에 전달할 컨텍스트 계산 — 현재 선택된 criterion 기준.
  const modalContext = modalCriterion
    ? buildModalContext(modalCriterion, aiAxes, reviews)
    : null;

  // 결정자(decidedBy) — 데모에서는 첫 심사위원이 심사위원장 역할.
  const decidedBy = {
    judgeId: reviews[0].judgeId,
    judgeName: reviews[0].judgeName,
  };

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
          {reviews.length}명 제출
          {disputeCount > 0 && ` · 분쟁 ${decidedCount}/${disputeCount} 결정`}
        </p>
      </div>

      <p
        className="text-[12.5px] mb-4 max-w-2xl"
        style={{ color: "var(--text-tertiary)", letterSpacing: "0.02em", wordBreak: "keep-all" }}
      >
        AI 1차 점수 위에 각 심사위원이 매긴 점수와 코멘트입니다. 분쟁(사람 분산
        σ &gt; {HUMAN_STDDEV_WARN} 또는 AI 분산 임계 초과) 항목은 행 끝의{" "}
        <strong>결정 →</strong> 버튼으로 처리합니다.
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
              <span style={{ color: "var(--text-tertiary)" }}>· {r.affiliation}</span>
            )}
          </span>
        ))}
      </div>

      <ComparisonTable
        criteria={criteria}
        aiAxes={aiAxes}
        reviews={reviews}
        resolutions={resolutions}
        disputeIds={new Set(disputeAxes.map((c) => c.id))}
        onOpenDecide={(c) => setModalCriterion(c)}
        disabled={reviewClosed}
      />

      <OverallComments reviews={reviews} />

      <MyReviewDraft
        criteria={criteria}
        aiAxes={aiAxes}
        competitionId={competitionId}
        proposalId={proposalId}
        usingBackend={usingBackend}
      />

      {/* 검토 종료 영역 — proposal 단위 마무리 액션. 모든 분쟁 결정되어야 활성화. */}
      <CloseReviewArea
        disputeCount={disputeCount}
        decidedCount={decidedCount}
        allDecided={allDecided}
        reviewClosed={reviewClosed}
        closedAt={closedAt}
        onClose={handleCloseReview}
        onReopen={handleReopenReview}
      />

      {/* 분쟁 결정 모달 */}
      {modalContext && (
        <DisputeResolutionModal
          open={!!modalCriterion}
          onClose={() => setModalCriterion(null)}
          criterionName={modalContext.criterionName}
          criterionId={modalContext.criterionId}
          aiMean={modalContext.aiMean}
          humanAverage={modalContext.humanAverage}
          humanStddev={modalContext.humanStddev}
          decidedBy={decidedBy}
          onResolve={handleResolve}
        />
      )}
    </section>
  );
}

// ── 비교 표 ─────────────────────────────────────────────────────────────
interface ComparisonTableProps {
  criteria: Criterion[];
  aiAxes: AxisScore[];
  reviews: JudgeReview[];
  resolutions: DisputeResolution[];
  disputeIds: Set<string>;
  onOpenDecide: (c: Criterion) => void;
  disabled: boolean;
}
function ComparisonTable({
  criteria,
  aiAxes,
  reviews,
  resolutions,
  disputeIds,
  onOpenDecide,
  disabled,
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
                  {!isDispute ? (
                    <span style={{ color: "var(--text-tertiary)" }}>—</span>
                  ) : resolved ? (
                    // 결정 완료 — 액션 + 최종 점수 + 결정자 inline 표시
                    <ResolvedBadge resolution={resolution!} />
                  ) : (
                    <button
                      type="button"
                      onClick={() => onOpenDecide(c)}
                      disabled={disabled}
                      className="inline-flex items-center gap-1 px-2.5 h-7 text-[11.5px] font-semibold text-white transition-[filter] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background: "var(--signal-attention)",
                        letterSpacing: "0.02em",
                      }}
                    >
                      결정 →
                    </button>
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
function MyReviewDraft({
  criteria,
  aiAxes,
  competitionId,
  proposalId,
  usingBackend,
}: {
  criteria: Criterion[];
  aiAxes: AxisScore[];
  competitionId: string;
  proposalId: string;
  usingBackend: boolean;
}) {
  const router = useRouter();
  const [overrides, setOverrides] = useState<Record<string, number | undefined>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [overallComment, setOverallComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
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
        <span
          className="text-[10.5px] font-bold uppercase"
          style={{ color: "var(--accent)", letterSpacing: "0.14em" }}
        >
          데모 — 저장 안 됨
        </span>
      </div>
      <p
        className="text-[12px] mb-5"
        style={{ color: "var(--text-tertiary)", letterSpacing: "0.02em" }}
      >
        AI 점수를 그대로 두려면 비워두고, 다르게 매기고 싶으면 0~100 사이로
        입력하세요. 항목별·전체 코멘트도 함께 남길 수 있습니다.
      </p>

      <div className="space-y-3 mb-5">
        {criteria.map((c) => {
          const ai = aiAxes.find((a) => a.criterionId === c.id);
          const myScore = overrides[c.id];
          return (
            <div
              key={c.id}
              className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 py-3"
              style={{ borderBottom: "1px solid var(--t-border-subtle)" }}
            >
              <div className="min-w-0">
                <p
                  className="text-[13px] font-semibold mb-0.5"
                  style={{ color: "var(--text-primary)" }}
                >
                  {c.name}
                </p>
                <p
                  className="text-[11.5px] truncate"
                  style={{ color: "var(--text-tertiary)" }}
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
                disabled={submitted}
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
                disabled={submitted}
                className="w-full px-3 h-9 text-[12.5px] outline-none disabled:opacity-60"
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--t-border-subtle)",
                  color: "var(--text-primary)",
                }}
              />
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
        disabled={submitted}
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
              : "데모: 제출 흐름만 시연됩니다 (mock URL — 저장 X)."
            : usingBackend
            ? "제출 시 axes·코멘트가 DB 에 저장됩니다 (upsert)."
            : "제출 전까지 다른 심사위원에게 공개되지 않습니다."}
        </p>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitted || submitting}
          className="inline-flex items-center gap-2 px-5 h-10 text-[13px] font-semibold text-white transition-[filter] hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: "var(--accent)", letterSpacing: "0.01em" }}
        >
          {submitting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              저장 중…
            </>
          ) : submitted ? (
            <>
              <Check className="w-3.5 h-3.5" strokeWidth={2.4} />
              제출됨{!usingBackend && " (데모)"}
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
  disputeCount,
  decidedCount,
  allDecided,
  reviewClosed,
  closedAt,
  onClose,
  onReopen,
}: {
  disputeCount: number;
  decidedCount: number;
  allDecided: boolean;
  reviewClosed: boolean;
  closedAt: string | undefined;
  onClose: () => void;
  onReopen: () => void;
}) {
  // 분쟁이 아예 없는 케이스 — 검토 종료 액션 의미가 약하므로 표시 안 함.
  if (disputeCount === 0) return null;

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
            모든 분쟁 항목({disputeCount}개)이 결정되었고, 본 출품에 대한 심사가
            종료되었습니다. {closedAt && `· ${new Date(closedAt).toLocaleString("ko-KR")}`}
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

  // 진행 중 — 진척도 + 종료 버튼(모든 분쟁 결정되어야 활성화).
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
          style={{
            color: allDecided ? "var(--signal-success)" : "var(--text-tertiary)",
            letterSpacing: "0.14em",
          }}
        >
          분쟁 결정 {decidedCount} / {disputeCount}
        </span>
      </div>

      {/* 진척 막대 */}
      <div
        className="relative h-1 mb-4 overflow-hidden"
        style={{ background: "var(--t-border-subtle)" }}
      >
        <div
          className="absolute inset-y-0 left-0 transition-all"
          style={{
            width: `${disputeCount === 0 ? 0 : (decidedCount / disputeCount) * 100}%`,
            background: allDecided ? "var(--signal-success)" : "var(--accent)",
          }}
        />
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p
          className="text-[12px] leading-[1.6] max-w-md"
          style={{ color: "var(--text-secondary)", wordBreak: "keep-all" }}
        >
          {allDecided
            ? "모든 분쟁 항목이 결정되었습니다. 검토를 종료하면 이 출품이 검토 대기 리스트에서 빠지고, 본심 단계로 넘어갈 준비가 됩니다."
            : `${disputeCount - decidedCount}건이 남아 있습니다. 모든 분쟁이 결정되어야 검토를 종료할 수 있습니다.`}
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
      className="mb-14 px-7 py-10 text-center"
      style={{
        background: "var(--surface-1)",
        border: "1px dashed var(--t-border-subtle)",
      }}
    >
      <p
        className="mb-1.5 text-[14.5px] font-semibold"
        style={{ color: "var(--text-primary)" }}
      >
        아직 심사위원 평가가 없습니다.
      </p>
      <p
        className="text-[12.5px] leading-[1.7] max-w-md mx-auto"
        style={{ color: "var(--text-tertiary)", wordBreak: "keep-all" }}
      >
        AI 1차 평가는 끝났지만 사람 심사가 시작되지 않은 상태입니다. 심사위원이
        평가를 제출하면 항목별로 AI 점수와 비교한 표가 이 자리에 나타납니다.
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

// 모달에 전달할 컨텍스트 빌드 — 모달 내부에서 다시 계산하지 않게.
function buildModalContext(
  criterion: Criterion,
  aiAxes: AxisScore[],
  reviews: JudgeReview[]
) {
  const ai = aiAxes.find((a) => a.criterionId === criterion.id);
  const aiMean = ai?.mean ?? 0;
  const humanScores = reviews
    .map((r) => {
      const a = r.axes.find((x) => x.criterionId === criterion.id);
      if (!a) return null;
      if (a.acceptedAiScore) return aiMean;
      return a.overrideScore ?? null;
    })
    .filter((s): s is number => s !== null);
  const humanAverage =
    humanScores.length === 0
      ? null
      : Math.round(humanScores.reduce((s, x) => s + x, 0) / humanScores.length);
  const humanStddev = computeHumanStddev(criterion.id, aiMean, reviews);
  return {
    criterionId: criterion.id,
    criterionName: criterion.name,
    aiMean,
    humanAverage,
    humanStddev,
  };
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
