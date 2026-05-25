// AI 점수 + 사람 평가(JudgeReview) + 분쟁 결정(DisputeResolution) 을 폴드해
// 최종 composite 를 view-time 에 재계산하는 순수 함수.
//
// 정책 (2026-05) — "AI 는 1차 도구, 사람이 final"
//   1) 분쟁 결정 final_score 있음              → source: "dispute"  (감사 호환)
//   2) submitted 사람 평가 ≥ 1, 사람 σ ≤ NOISY → 사람 평균          → "human_consensus"
//   3) submitted 사람 평가 ≥ 1, 사람 σ > NOISY → 사람 평균 + 경고   → "noisy_consensus"
//   4) submitted 사람 평가 0명                  → AI mean           → "ai"
//
// 즉 "분쟁 결정 모달" 가정은 폐기. 심사위원이 점수만 제출하면 그게 final.
// σ 가 매우 클 때(>20) 만 운영자에게 정보 표시(추가 평가 권고).

import type {
  AxisReview,
  AxisScore,
  Criterion,
  DisputeResolution,
  JudgeReview,
  ProposalScore,
} from "./types";

/**
 * 사람 점수 σ 가 이 값을 넘으면 "격차 큰 axis" 로 보고 운영자에 경고 표시.
 * 평균은 그대로 적용하되, 추가 평가자 초대 등 사람의 능동 액션을 권고하는 신호.
 */
export const NOISY_STDDEV_THRESHOLD = 20;

/** 호환 — 이전 정책의 분쟁 임계. 현재는 사용 안 함. */
export const HUMAN_STDDEV_WARN = 7;

/**
 * axis 점수가 어떻게 결정됐는지 표시. UI 가 시각적 분기에 사용.
 *   - ai              : 사람 평가 0명 — AI mean 그대로
 *   - human_consensus : 사람 평가 1명+ σ≤20 — 사람 평균 채택
 *   - noisy_consensus : 사람 평가 1명+ σ>20 — 사람 평균 채택하되 격차 경고
 *   - dispute         : 분쟁 결정 모달의 명시 결정 (호환 — 기존 데이터)
 */
export type AxisSource =
  | "ai"
  | "human_consensus"
  | "noisy_consensus"
  | "dispute";

export interface FoldedScore {
  /** 사람 평가·분쟁 결정 반영된 가중 평균 점수 (정수 0~100). */
  composite: number;
  /** axis 별로 머지된 점수 + 출처 + 사람 점수 σ. */
  axes: Array<
    AxisScore & {
      resolved: boolean;
      source: AxisSource;
      /** 사람 점수 표준편차 — UI 경고 분기 용. 사람 평가 없으면 0. */
      humanStddev: number;
      /** 반영된 사람 평가자 수 (acceptedAi=true 포함). */
      humanCount: number;
    }
  >;
  /** 사람 평균이 반영된 axis 가 한 건이라도 있는지. */
  hasResolution: boolean;
  /** σ>NOISY axis 수 — 운영자에게 한눈에 보여줄 경고 카운트. */
  noisyCount: number;
}

export function foldFinalScore(
  score: ProposalScore,
  criteria: Criterion[],
  resolutions: DisputeResolution[],
  judgeReviews: JudgeReview[] = []
): FoldedScore {
  // criterionId → 분쟁 결정 final_score 빠르게 조회.
  const finalByCriterion = new Map<string, number>();
  for (const r of resolutions) {
    if (typeof r.finalScore === "number" && Number.isFinite(r.finalScore)) {
      finalByCriterion.set(r.criterionId, r.finalScore);
    }
  }

  // submitted 만 반영. draft 는 임시 저장이라 제외.
  const submittedReviews = judgeReviews.filter((r) => r.status === "submitted");

  let noisyCount = 0;

  const mergedAxes = score.axes.map((axis) => {
    // (1) 명시 분쟁 결정 — 호환을 위해 유지. 이전 정책에서 만든 row 가 있을 수 있음.
    const overridden = finalByCriterion.get(axis.criterionId);
    if (typeof overridden === "number") {
      return {
        ...axis,
        mean: overridden,
        resolved: true,
        source: "dispute" as const,
        humanStddev: 0,
        humanCount: 0,
      };
    }

    // (2)(3) 사람 평가 ≥ 1명 → 사람 평균 채택. σ 가 크면 경고만.
    const agg = humanAggregate(axis.criterionId, axis.mean, submittedReviews);
    if (agg) {
      const noisy = agg.stddev > NOISY_STDDEV_THRESHOLD;
      if (noisy) noisyCount += 1;
      return {
        ...axis,
        mean: agg.mean,
        resolved: true,
        source: (noisy ? "noisy_consensus" : "human_consensus") as
          | "noisy_consensus"
          | "human_consensus",
        humanStddev: agg.stddev,
        humanCount: agg.count,
      };
    }

    // (4) 사람 평가 0명 — AI mean 유지.
    return {
      ...axis,
      resolved: false,
      source: "ai" as const,
      humanStddev: 0,
      humanCount: 0,
    };
  });

  // 가중 평균 재계산.
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
        (a) =>
          a.source === "human_consensus" || a.source === "noisy_consensus"
      ),
    noisyCount,
  };
}

// ── 헬퍼 ───────────────────────────────────────────────────────

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

function humanAggregate(
  criterionId: string,
  aiMean: number,
  submittedReviews: JudgeReview[]
): { mean: number; stddev: number; count: number } | null {
  const scores = collectHumanScores(criterionId, aiMean, submittedReviews);
  if (scores.length === 0) return null;
  const mean = scores.reduce((s, x) => s + x, 0) / scores.length;
  const stddev =
    scores.length < 2
      ? 0
      : Math.sqrt(
          scores.reduce((s, x) => s + (x - mean) ** 2, 0) / scores.length
        );
  return { mean: Math.round(mean), stddev, count: scores.length };
}
