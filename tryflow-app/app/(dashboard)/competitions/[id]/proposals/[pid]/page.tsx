// 제안서 상세 리포트.
//
// 디자인 결정 (2026-05 senior pass):
//   - Hero: 거대한 종합 점수 + 한 줄 verdict (큰 인용 톤). σ 검토 권고는 우측 카드.
//   - 항목별: AxisScoreBar 로 통일. 각 행 사이 hairline 만.
//   - 채점 기준 텍스트: AxisScoreBar 안에 인용 형태로 — 제목과 일체.

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { findProposal } from "@/lib/fastlane/mock";
import { AxisScoreBar } from "@/components/fastlane/AxisScoreBar";
import { FairnessExplainer } from "@/components/fastlane/FairnessExplainer";

const SERIF = "'Fraunces', serif";

function scoreColor(score: number) {
  if (score >= 75) return "var(--signal-success)";
  if (score >= 55) return "var(--signal-warning)";
  return "var(--signal-danger)";
}

function verdict(score: number): string {
  if (score >= 80) return "통과 권고";
  if (score >= 65) return "본심 검토 권고";
  if (score >= 50) return "보완 후 재검토";
  return "통과 부적합";
}

export default async function ProposalDetailPage({
  params,
}: {
  params: Promise<{ id: string; pid: string }>;
}) {
  const { id, pid } = await params;
  const found = findProposal(id, pid);
  if (!found) notFound();

  const { competition, proposal } = found;
  const score = proposal.score;
  const reviewAxes = score?.axes.filter((a) => a.needsReview) ?? [];

  return (
    <div className="max-w-3xl mx-auto px-8 pt-10 pb-24">
      <Link
        href={`/competitions/${competition.id}`}
        className="inline-flex items-center gap-1.5 text-[12.5px] font-medium mb-10 transition-colors hover:text-[color:var(--text-primary)]"
        style={{ color: "var(--text-tertiary)", letterSpacing: "0.04em" }}
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        리더보드
      </Link>

      {/* 메타 */}
      <p
        className="text-[12px] font-bold uppercase mb-3"
        style={{ color: "var(--accent)", letterSpacing: "0.16em" }}
      >
        {competition.name}
      </p>

      {/* 제목 */}
      <h1
        className="ko-display mb-3"
        style={{
          fontFamily: SERIF,
          fontWeight: 800,
          fontSize: "clamp(2rem, 4vw, 2.8rem)",
          lineHeight: 1.1,
          color: "var(--text-primary)",
        }}
      >
        {proposal.title}
      </h1>
      <p
        className="text-[13.5px] mb-2"
        style={{ color: "var(--text-tertiary)", letterSpacing: "0.04em" }}
      >
        제안 팀 · {proposal.team}
      </p>
      <p
        className="text-[15px] leading-[1.8] mb-12 max-w-xl"
        style={{ color: "var(--text-secondary)" }}
      >
        {proposal.summary}
      </p>

      {/* Hero — 종합 점수 */}
      {score && (
        <section
          className="mb-14 py-10 border-y"
          style={{ borderColor: "var(--t-border-subtle)" }}
        >
          <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-x-10 gap-y-6 items-end">
            {/* 큰 점수 */}
            <div>
              <p
                className="text-[10.5px] font-bold uppercase mb-3"
                style={{ color: "var(--text-tertiary)", letterSpacing: "0.16em" }}
              >
                AI 1차 평가 · 종합
              </p>
              <div className="flex items-baseline gap-2">
                <span
                  className="num-display tabular-nums leading-[0.85]"
                  style={{
                    fontWeight: 800,
                    fontSize: "clamp(4.5rem, 8vw, 6.5rem)",
                    letterSpacing: "-0.05em",
                    color: scoreColor(score.composite),
                  }}
                >
                  {score.composite}
                </span>
                <span
                  className="text-[13px] font-medium"
                  style={{ color: "var(--text-tertiary)", letterSpacing: "0.08em" }}
                >
                  / 100
                </span>
              </div>
            </div>

            {/* 한 줄 verdict */}
            <div className="md:pb-4 md:border-l md:pl-10" style={{ borderColor: "var(--t-border-subtle)" }}>
              <p
                className="text-[10.5px] font-bold uppercase mb-2.5"
                style={{ color: "var(--text-tertiary)", letterSpacing: "0.16em" }}
              >
                참고 의견
              </p>
              <p
                className="ko-display leading-[1.2] mb-3"
                style={{
                  fontFamily: SERIF,
                  fontStyle: "italic",
                  fontSize: "clamp(1.4rem, 2.6vw, 1.9rem)",
                  letterSpacing: "-0.01em",
                  color: "var(--text-primary)",
                }}
              >
                “{verdict(score.composite)}.”
              </p>
              <p
                className="text-[12px]"
                style={{ color: "var(--text-tertiary)", letterSpacing: "0.02em" }}
              >
                {score.runs}회 실행 평균 · 최종 결정은 인간 심사위원의 권한입니다.
              </p>
            </div>

            {/* 검토 권고 카드 */}
            {reviewAxes.length > 0 && (
              <div
                className="px-5 py-4 min-w-[170px]"
                style={{
                  background: "var(--signal-attention-soft)",
                  border: "1px solid var(--signal-attention-ring)",
                }}
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <AlertTriangle
                    className="w-3.5 h-3.5"
                    style={{ color: "var(--signal-attention)" }}
                    strokeWidth={2.2}
                  />
                  <span
                    className="text-[10px] font-bold uppercase"
                    style={{ color: "var(--signal-attention)", letterSpacing: "0.14em" }}
                  >
                    검토 권고
                  </span>
                </div>
                <p
                  className="num-display tabular-nums"
                  style={{
                    fontWeight: 800,
                    fontSize: "1.7rem",
                    letterSpacing: "-0.02em",
                    color: "var(--signal-attention)",
                  }}
                >
                  {reviewAxes.length}
                  <span
                    className="text-[12px] ml-1"
                    style={{ fontWeight: 500 }}
                  >
                    개 항목
                  </span>
                </p>
                <p className="text-[11.5px] mt-1" style={{ color: "var(--text-tertiary)" }}>
                  AI 분산이 임계값을 초과
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 항목별 평가 */}
      {score && (
        <section className="mb-14">
          <div className="flex items-center gap-4 mb-2">
            <h2
              className="ko-display"
              style={{
                fontFamily: SERIF,
                fontWeight: 800,
                fontSize: "1.5rem",
                lineHeight: 1.15,
                color: "var(--text-primary)",
              }}
            >
              항목별 평가
            </h2>
          </div>
          <p
            className="text-[12.5px] mb-4"
            style={{ color: "var(--text-tertiary)", letterSpacing: "0.02em" }}
          >
            5회 실행 평균 ± 표준편차. 임계값 초과 시 검토 권고.
          </p>

          <div className="border-t" style={{ borderColor: "var(--t-border-subtle)" }}>
            {competition.template.criteria.map((c) => {
              const axis = score.axes.find((a) => a.criterionId === c.id);
              if (!axis) return null;
              return (
                <div
                  key={c.id}
                  className="border-b"
                  style={{ borderColor: "var(--t-border-subtle)" }}
                >
                  <AxisScoreBar
                    axis={axis}
                    criterionName={c.name}
                    weight={c.weight}
                  />
                  <p
                    className="pb-3.5 -mt-2 text-[12px] leading-[1.65]"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    채점 기준: {c.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <FairnessExplainer compact />
    </div>
  );
}
