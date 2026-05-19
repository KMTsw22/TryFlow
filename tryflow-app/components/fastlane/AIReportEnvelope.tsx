// AI 평가 리포트 봉투.
//
// 2026-05-17 톤 분리 도입: 운영 시스템 톤 ↔ AI 산출물 톤을 공간으로 쪼개기 위한
// 컨테이너. 봉투 바깥 = 행정 시스템 톤(sans, 차분), 봉투 안 = 우리 차별점인
// 에디토리얼 톤(큰 점수 / 8축 차트 / 서사형 리포트).
//
// 봉투 헤더에 명시되어야 할 4가지:
//   1) "AI가 만든 것" 이라는 명확한 시각 신호 (Sparkles 배지)
//   2) 어떤 모델인지 (책임 소재)
//   3) 언제 생성됐는지 (신선도 판단)
//   4) "최종 결정은 심사위원 권한" disclaimer (행정·법적 면책)
//
// 사용:
//   <AIReportEnvelope modelName="gpt-4o-mini" generatedAt="2026-05-17T...">
//     <Hero /> <AxisGrid /> <MarkdownReport />
//   </AIReportEnvelope>

import { Sparkles } from "lucide-react";

function formatDateTime(iso: string | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

export function AIReportEnvelope({
  modelName,
  generatedAt,
  children,
}: {
  modelName?: string | null;
  generatedAt?: string | null;
  children: React.ReactNode;
}) {
  const ts = formatDateTime(generatedAt ?? undefined);

  return (
    <section className="mb-14">
      {/* 봉투 헤더 — 회색 sans 톤. 명확히 "AI 산출물" 신호. */}
      <div
        className="flex flex-wrap items-center gap-x-4 gap-y-2 px-6 py-3"
        style={{
          background: "var(--surface-2)",
          border: "1px solid var(--t-border)",
          borderBottom: "none",
          borderRadius: "2px 2px 0 0",
        }}
      >
        <span
          className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11.5px] font-semibold"
          style={{
            background: "var(--accent-soft)",
            color: "var(--accent)",
            border: "1px solid var(--accent-ring)",
            borderRadius: 2,
          }}
        >
          <Sparkles className="w-3 h-3" strokeWidth={2.4} />
          AI 평가 결과
        </span>
        <span
          className="text-[12px] tabular-nums"
          style={{ color: "var(--text-secondary)" }}
        >
          {modelName ?? "—"}
          {ts && <span style={{ color: "var(--text-tertiary)" }}>{` · ${ts} 생성`}</span>}
        </span>
        <span
          className="text-[11.5px] sm:ml-auto"
          style={{ color: "var(--text-tertiary)", wordBreak: "keep-all" }}
        >
          이 리포트는 AI가 작성한 1차 참고용 평가입니다. 최종 결정은 심사위원의 권한입니다.
        </span>
      </div>

      {/* 봉투 본문 — 흰 종이. 안에서는 에디토리얼 톤(serif/큰숫자/▲▼) 자유. */}
      <div
        className="px-7 py-8 sm:px-10 sm:py-10"
        style={{
          background: "var(--surface-1)",
          border: "1px solid var(--t-border)",
          borderRadius: "0 0 2px 2px",
        }}
      >
        {children}
      </div>
    </section>
  );
}
