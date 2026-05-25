// 대회 진행 단계 스텝퍼.
//
// 2026-05-17 도입: 스코어러 플러스 류 행정 시스템은 "지금 어느 단계에 있나"
// 를 상단에 고정으로 보여줌. 정부24·SaaS 사무톤의 표준 패턴.
//
// 5단계:
//   1. 접수    — 출품을 받는 중 (제출 0건이면 여기)
//   2. AI 1차  — AI 평가 진행 중 (출품은 있는데 score 가 다 안 채워짐)
//   3. 인간 심사 — AI 평가 완료, 심사위원 검토 진행 중
//   4. 집계    — 심사위원이 모든 출품에 reviewClosedAt 마킹 (또는 운영자 종료)
//   5. 공개    — 외부 공개 (현재 모델엔 별도 publish 플래그 없음, 4 와 동일 취급)
//
// 단계 표시:
//   ● 완료 (전 단계까지)
//   ◐ 진행 중 (현재)
//   ○ 미진입 (이후)
// 색상은 단일 accent — 행정 시스템 톤은 다채색 단계 피함.

import { Check } from "lucide-react";

export type CompetitionStage = "intake" | "ai-eval" | "human-review" | "tally" | "published";

const STEPS: { key: CompetitionStage; label: string; subLabel: string }[] = [
  { key: "intake", label: "접수", subLabel: "출품 수령" },
  { key: "ai-eval", label: "AI 1차", subLabel: "자동 평가" },
  { key: "human-review", label: "인간 심사", subLabel: "심사위원 검토" },
  { key: "tally", label: "집계", subLabel: "최종 점수 확정" },
  { key: "published", label: "공개", subLabel: "결과 공시" },
];

function stepIndex(s: CompetitionStage): number {
  return STEPS.findIndex((x) => x.key === s);
}

export function StageStepper({ current }: { current: CompetitionStage }) {
  const currentIdx = stepIndex(current);
  // 마지막 단계(published) 에 도달했으면 "완료" 상태로 보아 모든 단계를 done.
  // 즉 공개 단계가 active 가 아닌 완료로 보이게 — 사용자 인지: 끝났다.
  const allDone = currentIdx === STEPS.length - 1;

  return (
    <nav
      aria-label="대회 진행 단계"
      className="px-5 py-4 mb-6"
      style={{
        background: "var(--surface-1)",
        border: "1px solid var(--t-border)",
        borderRadius: 2,
      }}
    >
      <ol className="flex items-start gap-2 overflow-x-auto">
        {STEPS.map((step, idx) => {
          const state = allDone
            ? "done"
            : idx < currentIdx
            ? "done"
            : idx === currentIdx
            ? "active"
            : "pending";
          const isLast = idx === STEPS.length - 1;
          return (
            <li key={step.key} className="flex items-start gap-2 min-w-0">
              <StepDot state={state} index={idx + 1} />
              <div className="min-w-0 pt-0.5">
                <p
                  className="text-[12.5px] font-medium leading-tight whitespace-nowrap"
                  style={{
                    color:
                      state === "pending"
                        ? "var(--text-tertiary)"
                        : "var(--text-primary)",
                  }}
                >
                  {step.label}
                </p>
                <p
                  className="text-[11px] mt-0.5 whitespace-nowrap"
                  style={{
                    color:
                      state === "active"
                        ? "var(--accent)"
                        : "var(--text-tertiary)",
                    fontWeight: state === "active" ? 500 : 400,
                  }}
                >
                  {state === "active" ? "진행 중" : step.subLabel}
                </p>
              </div>
              {!isLast && (
                <span
                  aria-hidden
                  className="flex-1 h-px mt-3 mx-2"
                  style={{
                    background:
                      allDone || idx < currentIdx
                        ? "var(--accent)"
                        : "var(--t-border)",
                    minWidth: 28,
                  }}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function StepDot({
  state,
  index,
}: {
  state: "done" | "active" | "pending";
  index: number;
}) {
  if (state === "done") {
    return (
      <span
        className="inline-flex items-center justify-center w-5 h-5 shrink-0"
        style={{
          background: "var(--accent)",
          color: "#fff",
          borderRadius: 999,
        }}
        aria-label="완료"
      >
        <Check className="w-3 h-3" strokeWidth={3} />
      </span>
    );
  }
  if (state === "active") {
    return (
      <span
        className="inline-flex items-center justify-center w-5 h-5 shrink-0 tabular-nums text-[11px] font-semibold"
        style={{
          background: "var(--accent-soft)",
          color: "var(--accent)",
          border: "1.5px solid var(--accent)",
          borderRadius: 999,
        }}
        aria-current="step"
      >
        {index}
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center justify-center w-5 h-5 shrink-0 tabular-nums text-[11px]"
      style={{
        background: "var(--surface-1)",
        color: "var(--text-tertiary)",
        border: "1px solid var(--t-border)",
        borderRadius: 999,
      }}
    >
      {index}
    </span>
  );
}
