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
import { createClient } from "@/lib/supabase/server";
import {
  rowToCompetition,
  rowToProposal,
  type CompetitionRow,
  type ProposalRow,
} from "@/lib/fastlane/db";
import type { Competition, Proposal } from "@/lib/fastlane/types";
import { AxisScoreBar } from "@/components/fastlane/AxisScoreBar";
import { FairnessExplainer } from "@/components/fastlane/FairnessExplainer";
import { EvaluationStatusCard } from "@/components/fastlane/EvaluationStatusCard";
import { MarkdownReport } from "@/components/fastlane/MarkdownReport";

function looksLikeUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

type AxisReportsMap = Record<string, { markdown: string; generatedAt?: string }>;

async function loadProposalContext(
  competitionId: string,
  proposalId: string
): Promise<{
  competition: Competition;
  proposal: Proposal;
  evaluationStatus: "pending" | "running" | "done" | "failed";
  evaluationError: string | null;
  reportMd: string | null;
  axisReports: AxisReportsMap;
} | null> {
  // mock fallback — demo 인 경우.
  if (!looksLikeUuid(competitionId)) {
    const found = findProposal(competitionId, proposalId);
    if (!found) return null;
    return {
      competition: found.competition,
      proposal: found.proposal,
      evaluationStatus: found.proposal.score ? "done" : "pending",
      evaluationError: null,
      reportMd: null,
      axisReports: {},
    };
  }

  const supabase = await createClient();
  const { data: compRow } = await supabase
    .from("competitions")
    .select("*")
    .eq("id", competitionId)
    .single();
  if (!compRow) return null;

  const { data: propRow } = await supabase
    .from("proposals")
    .select("*")
    .eq("id", proposalId)
    .eq("competition_id", competitionId)
    .single();
  if (!propRow) return null;

  const row = propRow as ProposalRow;
  const proposal = rowToProposal(row);
  const competition = rowToCompetition(compRow as CompetitionRow, [proposal]);
  const status = row.evaluation_status as
    | "pending"
    | "running"
    | "done"
    | "failed";

  // axis_reports jsonb 를 안전하게 파싱.
  const axisReports: AxisReportsMap = {};
  if (row.axis_reports && typeof row.axis_reports === "object") {
    for (const [key, val] of Object.entries(row.axis_reports as Record<string, unknown>)) {
      if (val && typeof val === "object") {
        const r = val as Record<string, unknown>;
        const md = typeof r.markdown === "string" ? r.markdown : "";
        if (md.trim().length > 0) {
          axisReports[key] = {
            markdown: md,
            generatedAt:
              typeof r.generatedAt === "string" ? r.generatedAt : undefined,
          };
        }
      }
    }
  }

  return {
    competition,
    proposal,
    evaluationStatus: status,
    evaluationError: row.evaluation_error,
    reportMd:
      typeof row.evaluation_report_md === "string" && row.evaluation_report_md.trim().length > 0
        ? row.evaluation_report_md
        : null,
    axisReports,
  };
}

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
  const ctx = await loadProposalContext(id, pid);
  if (!ctx) notFound();

  const { competition, proposal, evaluationStatus, evaluationError, reportMd, axisReports } = ctx;
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
        {proposal.team && (
          <>
            <span style={{ color: "var(--t-border-bright)" }}>·</span>
            <span>출품 {proposal.team}</span>
          </>
        )}
      </div>
      <p
        className="text-[13.5px] leading-[1.85] mb-12 max-w-xl"
        style={{ color: "var(--text-secondary)", wordBreak: "keep-all" }}
      >
        {proposal.summary}
      </p>

      {/* 평가 진행 중 또는 실패 상태 — score 가 없을 때만 표시. */}
      {!score && evaluationStatus !== "done" && (
        <EvaluationStatusCard
          status={evaluationStatus}
          error={evaluationError}
        />
      )}

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
                Draft → Skeptic → Judge 3-Pass 검증 · 최종 결정은 심사위원의 권한입니다.
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
                  Draft·Skeptic·Judge 의견 분산이 임계값을 초과
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
            3-Pass (Draft → Skeptic → Judge) 검증 · σ = 세 agent 점수 표준편차. 임계값 초과 시 검토 권고.
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
                    axisMarkdown={axisReports[c.id]?.markdown}
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

      {/* AI 종합 평가 리포트 — synthesizer 가 생성한 markdown.
          항목별 평가는 위에서 score chart 로 보여주고, 여기는 서사형 분석. */}
      {reportMd && (
        <section
          className="mb-14 px-7 py-8"
          style={{
            background: "var(--surface-1)",
            border: "1px solid var(--t-border-subtle)",
          }}
        >
          <div className="flex items-baseline justify-between mb-2 gap-4 flex-wrap">
            <h2
              style={{
                fontWeight: 700,
                fontSize: "1.125rem",
                lineHeight: 1.4,
                color: "var(--text-primary)",
                letterSpacing: "-0.005em",
              }}
            >
              AI 심층 평가 리포트
            </h2>
            <p
              className="text-[10.5px] font-bold uppercase"
              style={{ color: "var(--text-tertiary)", letterSpacing: "0.14em" }}
            >
              심사위원 검토용
            </p>
          </div>
          <p
            className="text-[12.5px] mb-6"
            style={{ color: "var(--text-tertiary)", letterSpacing: "0.02em" }}
          >
            3-Pass 검증 결과를 종합하여 항목별 심층 분석 후 통합 작성.
          </p>
          <MarkdownReport source={reportMd} />
        </section>
      )}

      <FairnessExplainer compact />
    </div>
  );
}
