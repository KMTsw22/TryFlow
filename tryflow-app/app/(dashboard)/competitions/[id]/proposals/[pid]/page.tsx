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

const SERIF = "'Pretendard Variable', 'Pretendard', system-ui, sans-serif";

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

      {/* 사무톤 페이지 헤더 */}
      <h1
        className="mb-2"
        style={{
          fontWeight: 700,
          fontSize: "1.625rem",
          lineHeight: 1.3,
          color: "var(--text-primary)",
          letterSpacing: "-0.01em",
        }}
      >
        {proposal.title}
      </h1>
      <div
        className="flex items-center gap-3 mb-5 text-[12.5px] flex-wrap"
        style={{ color: "var(--text-tertiary)", letterSpacing: "0.02em" }}
      >
        <span style={{ color: "var(--accent)", fontWeight: 600 }}>
          {competition.name}
        </span>
        <span style={{ color: "var(--t-border-bright)" }}>·</span>
        <span>제안 팀 {proposal.team}</span>
      </div>
      <p
        className="text-[13.5px] leading-[1.85] mb-12 max-w-xl"
        style={{ color: "var(--text-secondary)", wordBreak: "keep-all" }}
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
                  className="tabular-nums leading-[0.95]"
                  style={{
                    fontWeight: 700,
                    fontSize: "clamp(3rem, 5.6vw, 4rem)",
                    letterSpacing: "-0.03em",
                    color: scoreColor(score.composite),
                  }}
                >
                  {score.composite}
                </span>
                <span
                  className="text-[13px] font-medium tabular-nums"
                  style={{ color: "var(--text-tertiary)", letterSpacing: "0.04em" }}
                >
                  / 100
                </span>
              </div>
            </div>

            {/* 한 줄 verdict — 사무톤 단정 진술 */}
            <div className="md:pb-2 md:border-l md:pl-10" style={{ borderColor: "var(--t-border-subtle)" }}>
              <p
                className="text-[10.5px] font-bold uppercase mb-2"
                style={{ color: "var(--text-tertiary)", letterSpacing: "0.16em" }}
              >
                참고 의견
              </p>
              <p
                className="mb-2"
                style={{
                  fontWeight: 600,
                  fontSize: "clamp(1.05rem, 1.8vw, 1.25rem)",
                  lineHeight: 1.45,
                  letterSpacing: "-0.005em",
                  color: "var(--text-primary)",
                  wordBreak: "keep-all",
                }}
              >
                {verdict(score.composite)}.
              </p>
              <p
                className="text-[11.5px]"
                style={{ color: "var(--text-tertiary)", letterSpacing: "0.02em" }}
              >
                {score.runs}회 실행 평균 · 최종 결정은 심사위원의 권한입니다.
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
              style={{
                fontWeight: 700,
                fontSize: "1.125rem",
                lineHeight: 1.4,
                color: "var(--text-primary)",
                letterSpacing: "-0.005em",
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
