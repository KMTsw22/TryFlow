// 제안서 상세 리포트.
//
// 2026-05-17 톤 분리 리팩토:
//   페이지 = 운영 시스템(상단 메타 + 하단 심사 작업) + AI 봉투(중간)
//
//   상단/하단은 행정 톤(sans, 차분, 표 톤). AI 산출물(큰 점수 / 8축 / 리포트)은
//   <AIReportEnvelope> 봉투 안에 가둠 — 봉투 안에서만 에디토리얼 톤 자유.
//   이렇게 분리하면 행정실/심사위원에게 "이건 정식 시스템이고, 가운데 봉투가
//   AI 1차 평가다" 라는 신호가 시각적으로 명확해진다.

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { findProposal } from "@/lib/fastlane/mock";
import { createClient } from "@/lib/supabase/server";
import {
  rowToCompetition,
  rowToDisputeResolution,
  rowToJudgeAssignment,
  rowToJudgeReview,
  rowToProposal,
  type CompetitionRow,
  type DisputeResolutionRow,
  type JudgeAssignmentRow,
  type ProposalReviewRow,
  type ProposalRow,
} from "@/lib/fastlane/db";
import type { Competition, Proposal } from "@/lib/fastlane/types";
import { AxisScoreBar } from "@/components/fastlane/AxisScoreBar";
import { FairnessExplainer } from "@/components/fastlane/FairnessExplainer";
import { EvaluationStatusCard } from "@/components/fastlane/EvaluationStatusCard";
import { MarkdownReport } from "@/components/fastlane/MarkdownReport";
import { JudgeReviewSection } from "@/components/fastlane/JudgeReviewSection";
import { AIReportEnvelope } from "@/components/fastlane/AIReportEnvelope";

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
  evaluatedAt: string | null;
  reportMd: string | null;
  axisReports: AxisReportsMap;
} | null> {
  if (!looksLikeUuid(competitionId)) {
    const found = findProposal(competitionId, proposalId);
    if (!found) return null;
    return {
      competition: found.competition,
      proposal: found.proposal,
      evaluationStatus: found.proposal.score ? "done" : "pending",
      evaluationError: null,
      evaluatedAt: null,
      reportMd: null,
      axisReports: {},
    };
  }

  const supabase = await createClient();
  const [
    { data: compRow },
    { data: propRow },
    { data: judgeRows },
    { data: reviewRows },
    { data: disputeRows },
  ] = await Promise.all([
    supabase.from("competitions").select("*").eq("id", competitionId).single(),
    supabase
      .from("proposals")
      .select("*")
      .eq("id", proposalId)
      .eq("competition_id", competitionId)
      .single(),
    supabase
      .from("competition_judges")
      .select("*")
      .eq("competition_id", competitionId),
    supabase.from("proposal_reviews").select("*").eq("proposal_id", proposalId),
    supabase
      .from("proposal_dispute_resolutions")
      .select("*")
      .eq("proposal_id", proposalId),
  ]);
  if (!compRow) return null;
  if (!propRow) return null;

  const row = propRow as ProposalRow;

  const judgeReviews = ((reviewRows ?? []) as ProposalReviewRow[]).map(
    rowToJudgeReview
  );
  const disputeResolutions = ((disputeRows ?? []) as DisputeResolutionRow[]).map(
    rowToDisputeResolution
  );

  const proposal = rowToProposal(row, { judgeReviews, disputeResolutions });
  const competition = rowToCompetition(compRow as CompetitionRow, [proposal]);
  competition.judges = ((judgeRows ?? []) as JudgeAssignmentRow[]).map(
    rowToJudgeAssignment
  );
  const status = row.evaluation_status as
    | "pending"
    | "running"
    | "done"
    | "failed";

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
    // 별도 evaluation_completed_at 컬럼이 없어, 평가 완료 시점에 갱신되는
    // updated_at 을 그대로 사용. score 가 있으면 그때가 평가 완료 시각.
    evaluatedAt: status === "done" ? row.updated_at : null,
    reportMd:
      typeof row.evaluation_report_md === "string" && row.evaluation_report_md.trim().length > 0
        ? row.evaluation_report_md
        : null,
    axisReports,
  };
}

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

function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "방금 전";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}일 전`;
  return `${Math.floor(d / 30)}개월 전`;
}

export default async function ProposalDetailPage({
  params,
}: {
  params: Promise<{ id: string; pid: string }>;
}) {
  const { id, pid } = await params;
  const ctx = await loadProposalContext(id, pid);
  if (!ctx) notFound();

  const {
    competition,
    proposal,
    evaluationStatus,
    evaluationError,
    evaluatedAt,
    reportMd,
    axisReports,
  } = ctx;
  const score = proposal.score;
  const reviewAxes = score?.axes.filter((a) => a.needsReview) ?? [];
  const reviewClosed = !!proposal.reviewClosedAt;
  const judgeCount = competition.judges?.length ?? 0;
  const submittedReviews =
    proposal.judgeReviews?.filter((r) => r.status === "submitted").length ?? 0;

  return (
    <div className="max-w-[1400px] mx-auto px-10 pt-8 pb-20">
      {/* ── Breadcrumb (운영 톤) ─────────────────────────────── */}
      <Link
        href={`/competitions/${competition.id}`}
        className="inline-flex items-center gap-1.5 text-[12.5px] mb-6 transition-colors hover:text-[color:var(--text-primary)]"
        style={{ color: "var(--text-tertiary)" }}
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        {competition.name}
      </Link>

      {/* ── 운영 패널: 출품 메타 (행정 톤) ──────────────────── */}
      <section
        className="pb-6 mb-6 border-b"
        style={{ borderColor: "var(--t-border)" }}
      >
        <div className="flex items-center flex-wrap gap-2 mb-3">
          <StatusChip
            status={evaluationStatus}
            reviewClosed={reviewClosed}
          />
          {evaluationStatus === "done" && judgeCount > 0 && (
            <span
              className="text-[12px]"
              style={{ color: "var(--text-tertiary)" }}
            >
              심사위원 제출{" "}
              <span
                className="tabular-nums"
                style={{ color: "var(--text-secondary)", fontWeight: 600 }}
              >
                {submittedReviews}/{judgeCount}
              </span>
            </span>
          )}
        </div>

        <h1
          className="mb-2"
          style={{
            fontWeight: 600,
            fontSize: "20px",
            lineHeight: 1.3,
            color: "var(--text-primary)",
            letterSpacing: "-0.005em",
          }}
        >
          {proposal.title}
        </h1>

        {/* 인라인 메타 — 행정 시스템 식별 정보 */}
        <div
          className="flex items-center flex-wrap gap-x-4 gap-y-1 text-[12.5px] mb-4"
          style={{ color: "var(--text-tertiary)" }}
        >
          <MetaItem label="대회" value={competition.name} />
          <Bullet />
          <MetaItem label="주최" value={competition.organizer} />
          {proposal.team && (
            <>
              <Bullet />
              <MetaItem label="출품" value={proposal.team} />
            </>
          )}
          <Bullet />
          <MetaItem
            label="제출"
            value={`${timeAgo(proposal.submittedAt)}`}
          />
        </div>

        <p
          className="text-[13px] leading-[1.75]"
          style={{ color: "var(--text-secondary)", wordBreak: "keep-all" }}
        >
          {proposal.summary}
        </p>
      </section>

      {/* ── 평가 진행 중/실패 안내 ──────────────────────────── */}
      {!score && evaluationStatus !== "done" && (
        <EvaluationStatusCard status={evaluationStatus} error={evaluationError} />
      )}

      {/* ── AI 봉투 (에디토리얼 톤) ─────────────────────────── */}
      {score && (
        <AIReportEnvelope modelName="gpt-4o-mini" generatedAt={evaluatedAt}>
          {/* Hero — 큰 점수 + verdict + 검토 권고 */}
          <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-x-10 gap-y-6 items-end pb-8 mb-8 border-b" style={{ borderColor: "var(--t-border-subtle)" }}>
            <div>
              <p
                className="text-[10.5px] font-bold uppercase mb-3"
                style={{ color: "var(--text-tertiary)", letterSpacing: "0.16em" }}
              >
                종합 점수
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

            <div
              className="md:pb-2 md:border-l md:pl-10"
              style={{ borderColor: "var(--t-border-subtle)" }}
            >
              <p
                className="text-[10.5px] font-bold uppercase mb-2"
                style={{ color: "var(--text-tertiary)", letterSpacing: "0.16em" }}
              >
                참고 의견
              </p>
              <p
                className="mb-2"
                style={{
                  fontWeight: 700,
                  fontSize: "clamp(1.5rem, 2.8vw, 2rem)",
                  lineHeight: 1.3,
                  letterSpacing: "-0.015em",
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
                Draft → Skeptic → Judge 3-Pass 검증
              </p>
            </div>

            {reviewAxes.length > 0 && (
              <div
                className="px-5 py-4 min-w-[170px]"
                style={{
                  background: "var(--signal-attention-soft)",
                  border: "1px solid var(--signal-attention-ring)",
                  borderRadius: 2,
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
                  <span className="text-[12px] ml-1" style={{ fontWeight: 500 }}>
                    개 항목
                  </span>
                </p>
                <p
                  className="text-[11.5px] mt-1"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  의견 분산 임계값 초과
                </p>
              </div>
            )}
          </div>

          {/* 항목별 평가 */}
          <div className="mb-10">
            <h2
              className="mb-2"
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
            <p
              className="text-[12.5px] mb-4"
              style={{ color: "var(--text-tertiary)", letterSpacing: "0.02em" }}
            >
              3-Pass (Draft → Skeptic → Judge) · σ = 세 agent 점수 표준편차. 임계값 초과 시 검토 권고.
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
          </div>

          {/* 서사형 리포트 */}
          {reportMd && (
            <div>
              <h2
                className="mb-2"
                style={{
                  fontWeight: 700,
                  fontSize: "1.125rem",
                  lineHeight: 1.4,
                  color: "var(--text-primary)",
                  letterSpacing: "-0.005em",
                }}
              >
                심층 평가 리포트
              </h2>
              <p
                className="text-[12.5px] mb-6"
                style={{ color: "var(--text-tertiary)", letterSpacing: "0.02em" }}
              >
                3-Pass 검증 결과를 종합하여 항목별 심층 분석 후 통합 작성.
              </p>
              <MarkdownReport source={reportMd} />
            </div>
          )}
        </AIReportEnvelope>
      )}

      {/* ── 운영 영역: 심사 작업 (행정 톤) ──────────────────── */}
      {score && proposal.judgeReviews !== undefined && (
        <section className="mb-14">
          <div
            className="pb-3 mb-5 border-b"
            style={{ borderColor: "var(--t-border)" }}
          >
            <h2
              className="text-[16px] font-semibold"
              style={{
                color: "var(--text-primary)",
                letterSpacing: "-0.003em",
              }}
            >
              심사 작업
            </h2>
            <p
              className="text-[12.5px] mt-1"
              style={{ color: "var(--text-tertiary)" }}
            >
              AI 평가는 참고용입니다. 본인의 평가·코멘트·분쟁 결정을 아래에서 진행합니다.
            </p>
          </div>
          <JudgeReviewSection
            competitionId={competition.id}
            proposalId={proposal.id}
            criteria={competition.template.criteria}
            aiAxes={score.axes}
            reviews={proposal.judgeReviews}
            initialResolutions={proposal.disputeResolutions}
            initialClosedAt={proposal.reviewClosedAt}
          />
        </section>
      )}

      <FairnessExplainer compact />
    </div>
  );
}

// ── 운영 패널용 primitives ────────────────────────────────────

function StatusChip({
  status,
  reviewClosed,
}: {
  status: "pending" | "running" | "done" | "failed";
  reviewClosed: boolean;
}) {
  if (reviewClosed) {
    return (
      <Chip label="검토 종료" color="var(--text-tertiary)" subtle />
    );
  }
  if (status === "done") {
    return <Chip label="AI 1차 평가 완료" color="var(--signal-success)" dot />;
  }
  if (status === "running") {
    return <Chip label="AI 평가 진행 중" color="var(--accent)" dot />;
  }
  if (status === "pending") {
    return <Chip label="평가 대기" color="var(--text-tertiary)" dot />;
  }
  return <Chip label="평가 실패" color="var(--signal-danger)" dot />;
}

function Chip({
  label,
  color,
  dot = false,
  subtle = false,
}: {
  label: string;
  color: string;
  dot?: boolean;
  subtle?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11.5px]"
      style={{
        color,
        background: "transparent",
        border: subtle ? "1px solid var(--t-border)" : `1px solid ${color}33`,
        borderRadius: 2,
        fontWeight: 500,
      }}
    >
      {dot && (
        <span
          className="inline-block w-1.5 h-1.5 rounded-full"
          style={{ background: color }}
          aria-hidden
        />
      )}
      {label}
    </span>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <span>
      <span style={{ color: "var(--text-tertiary)" }}>{label} </span>
      <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>
        {value}
      </span>
    </span>
  );
}

function Bullet() {
  return (
    <span aria-hidden style={{ color: "var(--t-border-bright)" }}>
      ·
    </span>
  );
}
