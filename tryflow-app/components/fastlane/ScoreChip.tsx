// ScoreChip — 점수 시각화의 단일 진실. 리더보드 셀, 상세 페이지, 카드에서 모두 사용.
//
// 디자인 결정:
//   - 큰 숫자는 Fraunces (display serif). 데이터를 “인용” 처럼 다룬다.
//   - 색은 3-band (strong/mid/weak) 계열로 톤다운 — 채도 낮은 emerald/amber/rose.
//   - σ 가 임계값 초과면 셀 배경에 미세 amber 틴트 + 좌측 세로 액센트.
//     배지 아이콘은 옵션. 표 셀처럼 좁은 곳에서는 액센트만으로도 충분.
//   - 절대 빨갛게 번쩍이지 않는다. ‘검토 필요’ 는 “주목 권고” 톤.

import type { CSSProperties } from "react";

type Size = "sm" | "md" | "lg";

interface Props {
  /** 평균 점수 (0~100). */
  mean: number;
  /** 표준편차. 없으면 σ 표기 생략. */
  stddev?: number;
  /** σ 임계값 초과 — 검토 필요 시각화. */
  needsReview?: boolean;
  /** 셀 크기. */
  size?: Size;
  /** 가운데 정렬 여부 (셀에서는 true, 카드에서는 false). */
  centered?: boolean;
  /** 추가 클래스. */
  className?: string;
}

const SIZE_TOKENS: Record<Size, { num: string; sigma: string; padX: string; padY: string }> = {
  sm: { num: "1.05rem", sigma: "10px", padX: "0.4rem", padY: "0.25rem" },
  md: { num: "1.5rem", sigma: "11px", padX: "0.6rem", padY: "0.35rem" },
  lg: { num: "2.25rem", sigma: "12px", padX: "0.85rem", padY: "0.5rem" },
};

function bandColor(mean: number) {
  if (mean >= 75) return { fg: "var(--signal-success)", soft: "var(--score-strong-soft)" };
  if (mean >= 55) return { fg: "var(--signal-warning)", soft: "var(--score-mid-soft)" };
  return { fg: "var(--signal-danger)", soft: "var(--score-weak-soft)" };
}

export function ScoreChip({
  mean,
  stddev,
  needsReview = false,
  size = "md",
  centered = true,
  className = "",
}: Props) {
  const tokens = SIZE_TOKENS[size];
  const { fg } = bandColor(mean);

  const containerStyle: CSSProperties = {
    padding: `${tokens.padY} ${tokens.padX}`,
    background: needsReview ? "var(--signal-attention-soft)" : "transparent",
    boxShadow: needsReview
      ? "inset 2px 0 0 var(--signal-attention)"
      : undefined,
  };

  return (
    <div
      className={`inline-flex items-baseline gap-1.5 ${centered ? "justify-center" : ""} ${className}`}
      style={containerStyle}
    >
      <span
        className="num-display tabular-nums leading-none"
        style={{
          fontWeight: 800,
          fontSize: tokens.num,
          letterSpacing: "-0.02em",
          color: fg,
        }}
      >
        {Math.round(mean)}
      </span>
      {typeof stddev === "number" && (
        <span
          className="tabular-nums"
          style={{
            fontSize: tokens.sigma,
            color: needsReview
              ? "var(--signal-attention)"
              : "var(--text-tertiary)",
            letterSpacing: "0.01em",
            fontWeight: needsReview ? 600 : 500,
          }}
          title={`표준편차 ${stddev.toFixed(1)}`}
        >
          σ {stddev.toFixed(1)}
        </span>
      )}
    </div>
  );
}
