// 분쟁 결정(DisputeResolution) + 사람 평가(JudgeReview) 결과를 AI axis 점수에
// 폴드해 최종 composite 를 재계산하는 순수 함수. 출처 데이터는 그대로 두고
// view-time 에 머지한다.
//
// 폴드 규칙 (3분법) — 2026-05
//   1) dispute resolution 에 final_score 있음          → source: "dispute"
//   2) 분쟁 axis (AI needsReview OR 사람 σ > 7)
//        - submitted 사람 ≥ 1, 사람 σ ≤ 7 → 사람 평균  → source: "human_consensus"
//        - 그 외                            → AI mean   → source: "ai"
//   3) 일반 axis 이지만 submitted 사람 중 override(acceptedAi=false)
//      가 1명 이상 있음 → submitted 사람 평균          → source: "weak_override"
//   4) 그 외 (사람 override 없음)              → AI mean → source: "ai"
//
// 의도:
//   - 강한 분쟁: 사람들이 자동 합의 or 결정 모달
//   - 약한 분쟁: 1명이라도 명시적으로 다르게 매기면 그 신호를 자동 반영.
//     심사위원 시간을 존중하고, 별도 결정자 없이 시스템 신뢰 유지.
//   - 무분쟁: 모두 AI 동의 → AI 그대로

import type {
  AxisReview,
  AxisScore,
  Criterion,
  DisputeResolution,
  JudgeReview,
  ProposalScore,
} from "./types";

/** 사람 점수 표준편차 임계 — 이 값을 넘으면 사람들도 갈렸다고 본다. */
export const HUMAN_STDDEV_WARN = 7;

/**
 * axis 점수가 어떻게 결정됐는지 표시. UI 가 시각적 분기에 사용.
 *   - ai             : AI mean 그대로 (분쟁 없거나 사람이 모두 AI 동의)
 *   - weak_override  : 일반 axis 인데 사람 1명 이상이 override — 사람 평균 자동 반영
 *   - human_consensus: 분쟁 axis 였지만 사람 σ≤7 합의로 사람 평균 자동 채택
 *   - dispute        : 분쟁 결정 모달에서 명시적으로 결정됨
 */
export type AxisSource =
  | "ai"
  | "weak_override"
  | "human_consensus"
  | "dispute";

export interface FoldedScore {
  /** 분쟁 결정·사람 합의 반영된 가중 평균 점수 (정수 0~100). */
  composite: number;
  /** axis 별로 머지된 점수 + 출처 표시. */
  axes: Array<AxisScore & { resolved: boolean; source: AxisSource }>;
  /** 자동 폴드 또는 수동 결정이 한 건이라도 반영됐는지 — UI 배지 분기용. */
  hasResolution: boolean;
}

/**
 * AI 점수 + 사람 평가 + 분쟁 결정 → 최종 composite.
 *
 * @param score        AI 의 ProposalScore (axes, composite 포함)
 * @param criteria     대회의 평가 항목들 (weight 가짐)
 * @param resolutions  분쟁 결정 기록들. 빈 배열이면 자동 폴드만 적용.
 * @param judgeReviews 사람 평가들. status=submitted 만 자동 폴드에 반영.
 */
export function foldFinalScore(
  score: ProposalScore,
  criteria: Criterion[],
  resolutions: DisputeResolution[],
  judgeReviews: JudgeReview[] = []
): FoldedScore {
  // criterionId → resolution(finalScore 있는 것만) 빠르게 조회.
  const finalByCriterion = new Map<string, number>();
  for (const r of resolutions) {
    if (typeof r.finalScore === "number" && Number.isFinite(r.finalScore)) {
      finalByCriterion.set(r.criterionId, r.finalScore);
    }
  }

  // submitted 평가만 사람 합의 자동 폴드에 반영. draft 는 임시저장이라 제외.
  const submittedReviews = judgeReviews.filter((r) => r.status === "submitted");

  // axis 머지.
  const mergedAxes = score.axes.map((axis) => {
    // (1) 수동 결정 우선.
    const overridden = finalByCriterion.get(axis.criterionId);
    if (typeof overridden === "number") {
      return {
        ...axis,
        mean: overridden,
        resolved: true,
        source: "dispute" as const,
      };
    }

    // (2) 강한 분쟁 axis 이고 사람 합의 있으면 사람 평균 자동 채택.
    const isDispute =
      axis.needsReview || isHumanDisputed(axis, submittedReviews);
    if (isDispute) {
      const humanAgg = humanAggregate(
        axis.criterionId,
        axis.mean,
        submittedReviews
      );
      if (humanAgg && humanAgg.stddev <= HUMAN_STDDEV_WARN) {
        return {
          ...axis,
          mean: humanAgg.mean,
          resolved: true,
          source: "human_consensus" as const,
        };
      }
      // 사람들끼리도 σ 가 크거나 평가자 0명 → AI mean 유지 (수동 결정 필요).
      return { ...axis, resolved: false, source: "ai" as const };
    }

    // (3) 약한 분쟁 — 일반 axis 이지만 사람 1명 이상이 명시적 override.
    // override = acceptedAiScore=false 이고 overrideScore 가 있는 review.
    // 그런 사람이 한 명이라도 있으면 그 axis 의 submitted 사람 평균을 채택.
    if (hasExplicitOverride(axis.criterionId, submittedReviews)) {
      const humanAgg = humanAggregate(
        axis.criterionId,
        axis.mean,
        submittedReviews
      );
      if (humanAgg) {
        return {
          ...axis,
          mean: humanAgg.mean,
          resolved: true,
          source: "weak_override" as const,
        };
      }
    }

    return { ...axis, resolved: false, source: "ai" as const };
  });

  // 가중 평균 재계산. weight 합 0 이면 단순 평균으로 fallback (분모 0 방지).
  let weightSum = 0;
  let weighted = 0;
  for (const axis of mergedAxes) {
    const w = criteria.find((c) => c.id === axis.criterionId)?.weight ?? 0;
    weightSum += w;
    weighted += axis.mean * w;
  }
  const rawComposite =
    weightSum > 0
      ? weighted / weightSum
      : mergedAxes.reduce((sum, a) => sum + a.mean, 0) /
        Math.max(mergedAxes.length, 1);

  const composite = Math.max(0, Math.min(100, Math.round(rawComposite)));

  return {
    composite,
    axes: mergedAxes,
    hasResolution:
      finalByCriterion.size > 0 ||
      mergedAxes.some(
        (a) => a.source === "human_consensus" || a.source === "weak_override"
      ),
  };
}

// ── 헬퍼 ───────────────────────────────────────────────────────

/** 한 axis 에서 submitted 사람 점수 추출. acceptedAiScore=true 면 AI mean 으로 환산. */
function collectHumanScores(
  criterionId: string,
  aiMean: number,
  submittedReviews: JudgeReview[]
): number[] {
  const out: number[] = [];
  for (const r of submittedReviews) {
    const a: AxisReview | undefined = r.axes.find(
      (x) => x.criterionId === criterionId
    );
    if (!a) continue;
    if (a.acceptedAiScore) out.push(aiMean);
    else if (typeof a.overrideScore === "number") out.push(a.overrideScore);
  }
  return out;
}

/** 사람 점수의 평균·표준편차. 평가자 0명이면 null. */
function humanAggregate(
  criterionId: string,
  aiMean: number,
  submittedReviews: JudgeReview[]
): { mean: number; stddev: number; count: number } | null {
  const scores = collectHumanScores(criterionId, aiMean, submittedReviews);
  if (scores.length === 0) return null;
  const mean = scores.reduce((s, x) => s + x, 0) / scores.length;
  // 평가자 1명이면 stddev=0 (혼자라 분산 없음 — 단일 의견으로 합의 간주).
  const stddev =
    scores.length < 2
      ? 0
      : Math.sqrt(
          scores.reduce((s, x) => s + (x - mean) ** 2, 0) / scores.length
        );
  return { mean: Math.round(mean), stddev, count: scores.length };
}

/** 사람 점수 σ 가 임계를 넘으면 분쟁으로 본다. */
function isHumanDisputed(
  axis: AxisScore,
  submittedReviews: JudgeReview[]
): boolean {
  const agg = humanAggregate(axis.criterionId, axis.mean, submittedReviews);
  return !!agg && agg.stddev > HUMAN_STDDEV_WARN;
}

/**
 * 약한 분쟁 감지 — submitted 사람 중 acceptedAiScore=false 이고
 * overrideScore 가 있는 평가자가 한 명이라도 있는지.
 * acceptedAi=true 인 사람은 AI 점수 동의로 본다 — override 신호 아님.
 */
function hasExplicitOverride(
  criterionId: string,
  submittedReviews: JudgeReview[]
): boolean {
  for (const r of submittedReviews) {
    const a: AxisReview | undefined = r.axes.find(
      (x) => x.criterionId === criterionId
    );
    if (a && !a.acceptedAiScore && typeof a.overrideScore === "number") {
      return true;
    }
  }
  return false;
}
