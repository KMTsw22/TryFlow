// 대회 상세 = 리더보드. 데모 클라이맥스.
//
// 디자인 결정 (2026-05 senior pass):
//   - 헤더: kicker rule + 큰 한글 제목 + 메타 strip (라이트한 정보 띠)
//   - 표: sticky 헤더, 셀별 ScoreChip, σ 셀에 좌측 amber accent
//   - 1/2/3등: rank pill 에 gold/silver/bronze 톤
//   - 행 호버: 전체 행에 accent-soft 틴트
//   - 하단: 공정성 3장치 — disclaimer 가 아니라 “심사 표준” 으로 격상

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Calendar, Users, FileText, Plus } from "lucide-react";
import { findCompetition } from "@/lib/fastlane/mock";
import { createClient } from "@/lib/supabase/server";
import {
  rowToCompetition,
  rowToProposal,
  type CompetitionRow,
  type ProposalRow,
} from "@/lib/fastlane/db";
import type { Competition } from "@/lib/fastlane/types";
import { ScoreChip } from "@/components/fastlane/ScoreChip";
import { FairnessBadge } from "@/components/fastlane/FairnessBadge";
import { FairnessExplainer } from "@/components/fastlane/FairnessExplainer";
import { RubricStatusBanner } from "@/components/fastlane/RubricStatusBanner";
import { CriterionRubricCard } from "@/components/fastlane/CriterionRubricCard";
import {
  StageStepper,
  type CompetitionStage,
} from "@/components/fastlane/StageStepper";

// 대회 운영 단계 추정 — DB 에 별도 stage 컬럼이 없으므로
// 출품/평가/검토종료 진척 상태에서 휴리스틱으로 산출.
function stageOf(comp: Competition): CompetitionStage {
  const props = comp.proposals;
  if (props.length === 0) return "intake";
  const allEvaluated = props.every((p) => !!p.score);
  if (!allEvaluated) return "ai-eval";
  const allClosed = props.every((p) => !!p.reviewClosedAt);
  if (allClosed) return "tally"; // 별도 published 플래그 없으므로 tally 로.
  return "human-review";
}

// uuid v4 모양인지 — DB 조회를 시도할지 결정.
function looksLikeUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

async function loadCompetition(id: string): Promise<{
  competition: Competition | null;
  isOwner: boolean;
  isMock: boolean;
  rubricError: string | null;
}> {
  // demo mock id 는 DB 조회 안 하고 바로 mock.
  if (!looksLikeUuid(id)) {
    const mock = findCompetition(id);
    return { competition: mock, isOwner: false, isMock: !!mock, rubricError: null };
  }

  const supabase = await createClient();
  const { data: comp } = await supabase
    .from("competitions")
    .select("*")
    .eq("id", id)
    .single();
  if (!comp) return { competition: null, isOwner: false, isMock: false, rubricError: null };

  const { data: propRows } = await supabase
    .from("proposals")
    .select("*")
    .eq("competition_id", id)
    .order("created_at", { ascending: false });

  const proposals = ((propRows ?? []) as ProposalRow[]).map((r) => rowToProposal(r));
  const competition = rowToCompetition(comp as CompetitionRow, proposals);

  const { data: { user } } = await supabase.auth.getUser();
  const isOwner = !!user && user.id === (comp as CompetitionRow).user_id;
  return {
    competition,
    isOwner,
    isMock: false,
    rubricError: (comp as CompetitionRow).rubric_error ?? null,
  };
}

const SERIF = "'Pretendard Variable', 'Pretendard', system-ui, sans-serif";

function rankAccent(rank: number): { bg: string; fg: string } | null {
  if (rank === 1) return { bg: "rgba(184, 134, 11, 0.10)", fg: "var(--rank-gold)" };
  if (rank === 2) return { bg: "rgba(113, 113, 122, 0.10)", fg: "var(--rank-silver)" };
  if (rank === 3) return { bg: "rgba(161, 98, 7, 0.10)", fg: "var(--rank-bronze)" };
  return null;
}

export default async function CompetitionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { competition, isMock, isOwner, rubricError } = await loadCompetition(id);
  if (!competition) notFound();

  const { template, proposals } = competition;
  const rubricsGenerated = template.criteria.filter(
    (c) => !!c.rubricMd && c.rubricMd.trim().length > 0
  ).length;

  const ranked = [...proposals].sort((a, b) => {
    const sa = a.score?.composite ?? -1;
    const sb = b.score?.composite ?? -1;
    return sb - sa;
  });

  const reviewItems = proposals.reduce(
    (sum, p) => sum + (p.score?.axes.filter((a) => a.needsReview).length ?? 0),
    0
  );

  const dDay = Math.max(
    0,
    Math.ceil((new Date(competition.deadline).getTime() - Date.now()) / 86_400_000)
  );

  const stage = stageOf(competition);

  return (
    <div className="max-w-[1400px] mx-auto px-10 pt-8 pb-20">
      {/* Back nav */}
      <Link
        href="/competitions"
        className="inline-flex items-center gap-1.5 text-[12.5px] mb-6 transition-colors hover:text-[color:var(--text-primary)]"
        style={{ color: "var(--text-tertiary)" }}
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        대회 목록
      </Link>

      {/* 운영 톤 페이지 헤더: 제목 + 메타 + CTA */}
      <div className="flex items-start justify-between gap-6 mb-2 flex-wrap">
        <h1
          style={{
            fontWeight: 600,
            fontSize: "22px",
            lineHeight: 1.3,
            color: "var(--text-primary)",
            letterSpacing: "-0.005em",
          }}
        >
          {competition.name}
        </h1>
        {!isMock && (
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {isOwner && (
              <Link
                href={`/competitions/${competition.id}/judges`}
                className="inline-flex items-center gap-1.5 px-3.5 h-9 text-[13px] font-medium transition-colors hover:bg-[color:var(--surface-2)]"
                style={{
                  border: "1px solid var(--t-input-border)",
                  color: "var(--text-primary)",
                  borderRadius: 2,
                }}
              >
                심사위원 관리
              </Link>
            )}
            <Link
              href={`/competitions/${competition.id}/proposals/new`}
              className="inline-flex items-center gap-1.5 px-3.5 h-9 text-[13px] font-medium transition-colors hover:brightness-110"
              style={{
                background: "var(--accent)",
                color: "#fff",
                borderRadius: 2,
              }}
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2.4} />
              출품 제출
            </Link>
          </div>
        )}
      </div>
      <div
        className="flex items-center gap-3 mb-6 text-[12.5px] tabular-nums flex-wrap"
        style={{ color: "var(--text-tertiary)" }}
      >
        <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>
          {competition.organizer}
        </span>
        {competition.theme && (
          <>
            <span style={{ color: "var(--t-border-bright)" }}>·</span>
            <span>{competition.theme}</span>
          </>
        )}
        <span style={{ color: "var(--t-border-bright)" }}>·</span>
        <span>마감 D-{dDay}</span>
      </div>

      {/* 단계 스텝퍼 — 행정 시스템 표준 시그널 */}
      <StageStepper current={stage} />

      {/* Rubric 자동 생성 상태 — DB 대회만. mock 은 status 무관. */}
      {!isMock && (
        <RubricStatusBanner
          competitionId={competition.id}
          status={competition.rubricStatus}
          error={rubricError}
          isOwner={isOwner}
          generatedCount={rubricsGenerated}
          totalCount={template.criteria.length}
        />
      )}

      {/* 메타 strip — 4개 통계 셀. 운영 톤으로 줄여 잡은 정보 띠. */}
      <div
        className="grid grid-cols-2 md:grid-cols-4 mb-10"
        style={{
          background: "var(--surface-1)",
          border: "1px solid var(--t-border)",
          borderRadius: 2,
        }}
      >
        <MetaCell
          label="제출"
          value={`${proposals.length}`}
          unit="건"
          icon={Users}
        />
        <MetaCell
          label="평가 항목"
          value={`${template.criteria.length}`}
          unit="개"
          icon={FileText}
          hint={template.name}
        />
        <MetaCell
          label="검토 권고"
          value={`${reviewItems}`}
          unit="개 항목"
          tone={reviewItems > 0 ? "attention" : "neutral"}
        />
        <MetaCell
          label="마감"
          value={new Date(competition.deadline).toLocaleDateString("ko-KR", {
            month: "long",
            day: "numeric",
          })}
          icon={Calendar}
        />
      </div>

      {/* 평가 항목별 rubric — DB 대회만. mock 은 rubric 없음. */}
      {!isMock && (
        <section className="mb-16">
          <div className="flex items-end justify-between mb-5 gap-4 flex-wrap">
            <div>
              <h2
                style={{
                  fontWeight: 700,
                  fontSize: "1.125rem",
                  lineHeight: 1.4,
                  color: "var(--text-primary)",
                  letterSpacing: "-0.005em",
                }}
              >
                평가표
              </h2>
              <p
                className="mt-1 text-[12px] font-medium"
                style={{ color: "var(--text-tertiary)", letterSpacing: "0.04em" }}
              >
                항목별 채점 기준 · {rubricsGenerated}/{template.criteria.length} rubric 생성됨
              </p>
            </div>
            <p
              className="text-[12px] tabular-nums"
              style={{ color: "var(--text-tertiary)", letterSpacing: "0.04em" }}
            >
              모든 제안서가 동일한 rubric 으로 채점됩니다
            </p>
          </div>
          <div className="space-y-3">
            {template.criteria.map((c, i) => (
              <CriterionRubricCard key={c.id} criterion={c} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* 리더보드 */}
      <section className="mb-16">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2
              style={{
                fontWeight: 700,
                fontSize: "1.125rem",
                lineHeight: 1.4,
                color: "var(--text-primary)",
                letterSpacing: "-0.005em",
              }}
            >
              종합 점수 순위
            </h2>
            <p
              className="mt-1 text-[12px] font-medium"
              style={{ color: "var(--text-tertiary)", letterSpacing: "0.04em" }}
            >
              AI 1차 평가
            </p>
          </div>
          <p
            className="text-[12px] tabular-nums hidden md:block"
            style={{ color: "var(--text-tertiary)", letterSpacing: "0.04em" }}
          >
            3-Pass (Draft·Skeptic·Judge) · σ 분기점 분산 · 임계값 초과 시 검토 권고
          </p>
        </div>

        <div
          className="overflow-x-auto border"
          style={{
            borderColor: "var(--t-border-subtle)",
            background: "var(--surface-1)",
          }}
        >
          <table className="w-full border-collapse" style={{ minWidth: 940 }}>
            <thead
              className="sticky top-0 z-10"
              style={{
                background: "var(--surface-2)",
                borderBottom: "1px solid var(--t-border)",
              }}
            >
              <tr>
                <Th width={56} align="center">
                  순위
                </Th>
                <Th align="left">출품작</Th>
                <Th width={92} align="right">
                  종합
                </Th>
                {template.criteria.map((c) => (
                  <Th
                    key={c.id}
                    align="center"
                    minWidth={92}
                    title={`${c.name} · 가중치 ${Math.round(c.weight * 100)}%`}
                  >
                    <span className="block">{c.name}</span>
                    <span
                      className="block tabular-nums mt-0.5"
                      style={{
                        fontSize: "10px",
                        fontWeight: 500,
                        color: "var(--text-tertiary)",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {Math.round(c.weight * 100)}%
                    </span>
                  </Th>
                ))}
                <Th width={36} />
              </tr>
            </thead>
            <tbody>
              {ranked.map((p, i) => {
                const score = p.score;
                const composite = score?.composite ?? null;
                const reviewCount =
                  score?.axes.filter((a) => a.needsReview).length ?? 0;
                const rank = i + 1;
                const accent = rankAccent(rank);

                return (
                  <tr
                    key={p.id}
                    className="group transition-colors hover:bg-[color:var(--accent-soft)]"
                    style={{ borderBottom: "1px solid var(--t-border-subtle)" }}
                  >
                    {/* 순위 */}
                    <td className="py-4 text-center">
                      <span
                        className="inline-flex items-center justify-center w-8 h-8 tabular-nums text-[13px] font-bold"
                        style={{
                          background: accent?.bg ?? "transparent",
                          color: accent?.fg ?? "var(--text-tertiary)",
                          border: accent
                            ? `1px solid ${accent.fg}33`
                            : "1px solid var(--t-border-subtle)",
                          borderRadius: 999,
                        }}
                      >
                        {rank}
                      </span>
                    </td>

                    {/* 제안서 */}
                    <td className="py-4 pr-3">
                      <Link
                        href={`/competitions/${competition.id}/proposals/${p.id}`}
                        className="block group/link"
                      >
                        <p
                          className="ko-display text-[15px] font-bold leading-tight mb-0.5 group-hover/link:underline"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {p.title}
                        </p>
                        <p
                          className="text-[12.5px]"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          {p.team}
                          {reviewCount > 0 && (
                            <>
                              <span className="mx-2" aria-hidden style={{ color: "var(--t-border-bright)" }}>
                                ·
                              </span>
                              <span
                                style={{
                                  color: "var(--signal-attention)",
                                  fontWeight: 600,
                                }}
                              >
                                {reviewCount}개 항목 검토 권고
                              </span>
                            </>
                          )}
                        </p>
                      </Link>
                    </td>

                    {/* 종합 점수 */}
                    <td className="py-4 pr-3 text-right">
                      {composite !== null ? (
                        <div className="inline-flex items-baseline justify-end gap-1">
                          <span
                            className="num-display tabular-nums leading-none"
                            style={{
                              fontWeight: 800,
                              fontSize: "1.8rem",
                              letterSpacing: "-0.025em",
                              color:
                                composite >= 75
                                  ? "var(--signal-success)"
                                  : composite >= 55
                                  ? "var(--signal-warning)"
                                  : "var(--signal-danger)",
                            }}
                          >
                            {composite}
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: "var(--text-tertiary)" }}>—</span>
                      )}
                    </td>

                    {/* 항목별 셀 */}
                    {template.criteria.map((c) => {
                      const axis = score?.axes.find((a) => a.criterionId === c.id);
                      if (!axis) {
                        return (
                          <td
                            key={c.id}
                            className="py-4 px-1 text-center"
                            style={{ color: "var(--text-tertiary)" }}
                          >
                            —
                          </td>
                        );
                      }
                      return (
                        <td key={c.id} className="py-3 px-1 text-center align-middle">
                          <div className="flex flex-col items-center gap-0.5">
                            <ScoreChip
                              mean={axis.mean}
                              size="sm"
                              centered
                              className="!gap-0"
                            />
                            <div className="flex items-center gap-1">
                              <span
                                className="text-[10px] tabular-nums"
                                style={{
                                  color: axis.needsReview
                                    ? "var(--signal-attention)"
                                    : "var(--text-tertiary)",
                                  fontWeight: axis.needsReview ? 600 : 500,
                                  letterSpacing: "0.02em",
                                }}
                              >
                                σ {axis.stddev.toFixed(1)}
                              </span>
                              {axis.needsReview && (
                                <FairnessBadge stddev={axis.stddev} compact />
                              )}
                            </div>
                          </div>
                        </td>
                      );
                    })}

                    {/* 화살표 */}
                    <td className="py-4 pr-4 text-right">
                      <Link
                        href={`/competitions/${competition.id}/proposals/${p.id}`}
                        aria-label={`${p.title} 상세`}
                        className="inline-flex items-center justify-center w-7 h-7 transition-opacity opacity-30 group-hover:opacity-100"
                        style={{ color: "var(--accent)" }}
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {ranked.length === 0 && (
                <tr>
                  <td
                    colSpan={4 + template.criteria.length}
                    className="py-20 text-center"
                  >
                    <p
                      className="text-[14px] italic"
                      style={{
                        fontFamily: SERIF,
                        color: "var(--text-tertiary)",
                      }}
                    >
                      아직 제출된 출품작이 없습니다.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 하단 캡션 */}
        <p
          className="mt-4 text-[11.5px] leading-[1.65]"
          style={{ color: "var(--text-tertiary)", letterSpacing: "0.02em" }}
        >
          σ (시그마) = Draft·Skeptic·Judge 세 agent 점수의 표준편차. 임계값을 넘는 항목은
          AI 의 평가가 흔들린다는 의미이므로 심사위원의 검토를 권합니다.
        </p>
      </section>

      {/* 공정성 3장치 — 표준 절차 */}
      <FairnessExplainer />
    </div>
  );
}

// ── 메타 셀 — 4-up 스트립 ─────────────────────────────────────
function MetaCell({
  label,
  value,
  unit,
  icon: Icon,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string;
  unit?: string;
  icon?: typeof Calendar;
  hint?: string;
  tone?: "neutral" | "attention";
}) {
  const valueColor =
    tone === "attention" ? "var(--signal-attention)" : "var(--text-primary)";
  return (
    <div
      className="px-5 py-4 border-r last:border-r-0"
      style={{ borderColor: "var(--t-border)" }}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        {Icon && (
          <Icon
            className="w-3 h-3"
            style={{ color: "var(--text-tertiary)" }}
            strokeWidth={2}
          />
        )}
        <span
          className="text-[11.5px]"
          style={{ color: "var(--text-tertiary)" }}
        >
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <span
          className="tabular-nums"
          style={{
            fontWeight: 600,
            fontSize: "1.25rem",
            letterSpacing: "-0.01em",
            lineHeight: 1.1,
            color: valueColor,
          }}
        >
          {value}
        </span>
        {unit && (
          <span
            className="text-[12px]"
            style={{ color: "var(--text-tertiary)" }}
          >
            {unit}
          </span>
        )}
      </div>
      {hint && (
        <p
          className="mt-1 text-[11.5px] truncate"
          style={{ color: "var(--text-tertiary)" }}
          title={hint}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

function Th({
  children,
  align = "left",
  width,
  minWidth,
  title,
}: {
  children?: React.ReactNode;
  align?: "left" | "center" | "right";
  width?: number;
  minWidth?: number;
  title?: string;
}) {
  return (
    <th
      className="py-3 px-2 text-[10.5px] font-bold uppercase"
      style={{
        color: "var(--text-tertiary)",
        letterSpacing: "0.14em",
        width,
        minWidth,
        textAlign: align,
      }}
      title={title}
    >
      {children}
    </th>
  );
}
