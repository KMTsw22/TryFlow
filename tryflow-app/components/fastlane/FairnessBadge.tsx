// 공정성 플래그 배지 — N회 다중 실행에서 표준편차가 임계값을 넘은 항목.
// 디자인 결정: 노란색 ⚠ 아이콘은 시끄러우니 글리프 위주 calm 톤.
// "검토 권고" 라는 메시지는 알람이 아니라 정보. 인터랙션 없이 정보 전달만.

interface Props {
  stddev: number;
  /** 좁은 공간 (테이블 셀 옆) 용 — σ 숫자만. */
  compact?: boolean;
}

export function FairnessBadge({ stddev, compact = false }: Props) {
  if (compact) {
    return (
      <span
        className="inline-flex items-center gap-1 px-1.5 h-[18px] tabular-nums"
        title={`표준편차 ${stddev.toFixed(1)} — 인간 심사위원 검토 권고`}
        style={{
          background: "var(--signal-attention-soft)",
          color: "var(--signal-attention)",
          fontSize: "10px",
          fontWeight: 700,
          letterSpacing: "0.04em",
          border: "1px solid var(--signal-attention-ring)",
        }}
      >
        검토
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-2 px-2.5 h-6 tabular-nums"
      style={{
        background: "var(--signal-attention-soft)",
        color: "var(--signal-attention)",
        border: "1px solid var(--signal-attention-ring)",
        fontSize: "11.5px",
        fontWeight: 600,
        letterSpacing: "0.02em",
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: "var(--signal-attention)" }}
      />
      검토 권고 · σ {stddev.toFixed(1)}
    </span>
  );
}
