// 공정성 3장치 — 발표 Q&A 통일 답변과 같은 구조.
//
// 디자인 결정 (2026-05 senior pass):
//   - "심사 절차 표준" 처럼 격상. disclaimer 톤이 아니라 “이렇게 평가합니다” 톤.
//   - 좌측에 큰 라벨, 우측에 3-step 카드. editorial column layout.
//   - 카드는 절제된 — 색은 accent 한 톤만. 아이콘은 작고 텍스트는 분명하게.

import { Lock, Repeat, AlertTriangle } from "lucide-react";

const SERIF = "'Fraunces', serif";

const STEPS = [
  {
    icon: Lock,
    title: "결정성 고정",
    body: "temperature 0, seed 고정. 같은 입력에 가능한 한 같은 답이 나오도록 호출 자체를 결정적으로 만듭니다.",
  },
  {
    icon: Repeat,
    title: "다중 실행 평균",
    body: "동일 제안서를 5회 병렬 실행. 평균을 점수로, 표준편차로 변동성을 측정합니다.",
  },
  {
    icon: AlertTriangle,
    title: "분산 플래그",
    body: "표준편차가 임계값을 넘는 항목은 ‘검토 권고’ 로 표시. AI 가 흔들리는 영역은 사람에게 넘깁니다.",
  },
];

export function FairnessExplainer({ compact = false }: { compact?: boolean }) {
  return (
    <section
      className={`grid grid-cols-1 md:grid-cols-[200px_1fr] gap-x-12 gap-y-6 ${
        compact ? "py-10" : "py-16"
      } border-t`}
      style={{ borderColor: "var(--t-border-subtle)" }}
      aria-label="공정성 보장 절차"
    >
      <div>
        <p
          className="text-[11px] font-bold uppercase mb-3"
          style={{ color: "var(--accent)", letterSpacing: "0.16em" }}
        >
          심사 절차 표준
        </p>
        <h3
          className="ko-display mb-3"
          style={{
            fontFamily: SERIF,
            fontWeight: 800,
            fontSize: "1.6rem",
            lineHeight: 1.15,
            color: "var(--text-primary)",
          }}
        >
          공정성<br />3장치
        </h3>
        <p
          className="text-[12.5px] leading-[1.7]"
          style={{ color: "var(--text-tertiary)" }}
        >
          AI 는 1차 스코어링까지. 최종 심사 권한은 항상 인간 심사위원에게 있습니다.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-px" style={{ background: "var(--t-border-subtle)" }}>
        {STEPS.map((s, i) => (
          <div
            key={s.title}
            className="p-6"
            style={{ background: "var(--surface-1)" }}
          >
            <div className="flex items-center gap-2.5 mb-4">
              <span
                className="text-[10.5px] font-bold tabular-nums"
                style={{
                  color: "var(--text-tertiary)",
                  letterSpacing: "0.12em",
                }}
              >
                0{i + 1}
              </span>
              <span
                className="flex-1 h-px"
                style={{ background: "var(--t-border-subtle)" }}
              />
              <s.icon
                className="w-3.5 h-3.5"
                style={{ color: "var(--accent)" }}
                strokeWidth={2}
              />
            </div>
            <h4
              className="ko-display mb-2"
              style={{
                fontFamily: SERIF,
                fontWeight: 700,
                fontSize: "1.1rem",
                lineHeight: 1.25,
                color: "var(--text-primary)",
              }}
            >
              {s.title}
            </h4>
            <p
              className="text-[13px] leading-[1.7]"
              style={{ color: "var(--text-secondary)" }}
            >
              {s.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
