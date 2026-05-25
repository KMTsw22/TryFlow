// 분쟁 결정(DisputeResolution) 결과를 AI axis 점수에 폴드해 최종 composite 를
// 재계산하는 순수 함수. 출처 데이터는 그대로 두고 view-time 에 머지한다.
//
// 동작 원칙:
//   - 각 axis 마다 dispute resolution 이 있고 finalScore 가 숫자면 그 값을 사용.
//   - 그 외 (resolution 없음 / action=request_rereview 라 finalScore 미정) 은
//     기존 AI mean 을 그대로 사용.
//   - 가중 평균은 Criterion.weight 합이 1 이 아닐 수도 있어 정규화 후 계산.
//   - 결과 composite 는 0~100 으로 클램프 후 정수 반올림.

import type {
  AxisScore,
  Criterion,
  DisputeResolution,
  ProposalScore,
} from "./types";

export interface FoldedScore {
  /** 분쟁 결정 반영된 가중 평균 점수 (정수 0~100). */
  composite: number;
  /** axis 별로 머지된 점수 — AI mean 또는 dispute final_score. */
  axes: Array<AxisScore & { resolved: boolean; source: "ai" | "dispute" }>;
  /** 분쟁 결정이 한 건이라도 반영됐는지 — UI 배지 분기용. */
  hasResolution: boolean;
}

/**
 * AI 점수 + 분쟁 결정 → 최종 composite.
 *
 * @param score      AI 의 ProposalScore (axes, composite 포함)
 * @param criteria   대회의 평가 항목들 (weight 가짐)
 * @param resolutions 분쟁 결정 기록들. 빈 배열이면 원본 그대로 반환.
 */
export function foldFinalScore(
  score: ProposalScore,
  criteria: Criterion[],
  resolutions: DisputeResolution[]
): FoldedScore {
  // criterionId → resolution(finalScore 있는 것만) 빠르게 조회.
  const finalByCriterion = new Map<string, number>();
  for (const r of resolutions) {
    if (typeof r.finalScore === "number" && Number.isFinite(r.finalScore)) {
      finalByCriterion.set(r.criterionId, r.finalScore);
    }
  }

  // axis 머지 — AI mean 을 기본으로, 분쟁 결정 있으면 그 점수로 교체.
  const mergedAxes = score.axes.map((axis) => {
    const overridden = finalByCriterion.get(axis.criterionId);
    if (typeof overridden === "number") {
      return {
        ...axis,
        mean: overridden,
        resolved: true,
        source: "dispute" as const,
      };
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
    hasResolution: finalByCriterion.size > 0,
  };
}
