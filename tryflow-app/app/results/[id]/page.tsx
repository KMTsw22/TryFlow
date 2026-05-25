// /results/[id] — 공개 결과 페이지.
//
// 비로그인 사용자도 외부 URL 로 접근 가능. service_role 클라이언트로 RLS 우회.
// 운영자가 대회 상세에서 "결과 공유" 클릭 → 이 URL 을 외부에 공유 → 누구나 결과 확인.
//
// 표시 조건 — 모든 출품이 검토 종료(reviewClosedAt) 된 대회에 한해 결과 공개.
// 그 외에는 "아직 결과가 공개되지 않았습니다" 안내.
//
// 톤: dashboard 톤과 분리. sidebar 없는 공개 페이지. 행정 시스템 톤은 유지.

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trophy } from "lucide-react";
import { Brand } from "@/components/layout/Brand";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  rowToCompetition,
  rowToDisputeResolution,
  rowToJudgeReview,
  rowToProposal,
  type CompetitionRow,
  type DisputeResolutionRow,
  type ProposalRow,
  type ProposalReviewRow,
} from "@/lib/fastlane/db";
import { foldFinalScore } from "@/lib/fastlane/score";
import type {
  Competition,
  DisputeResolution,
  JudgeReview,
} from "@/lib/fastlane/types";

interface Loaded {
  competition: Competition;
  publishedAt: string;
  totalProposals: number;
}

async function loadPublicResults(id: string): Promise<Loaded | null> {
  // uuid 패턴이 아니면 결과 페이지 의미 없음.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return null;
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return null; // service_role 키 없는 환경.
  }

  const [{ data: compRow }, { data: propRows }] = await Promise.all([
    admin.from("competitions").select("*").eq("id", id).maybeSingle(),
    admin
      .from("proposals")
      .select("*")
      .eq("competition_id", id)
      .order("created_at", { ascending: false }),
  ]);
  if (!compRow) return null;

  const propRowsTyped = (propRows ?? []) as ProposalRow[];
  if (propRowsTyped.length === 0) return null;

  // 분쟁 결정 + 사람 평가를 함께 가져온다. score.ts 의 foldFinalScore 가
  // (1) 분쟁 final_score, (2) 사람 합의(σ≤7) 평균 을 axis 점수에 자동 폴드.
  const proposalIds = propRowsTyped.map((r) => r.id);
  const [{ data: disputeRows }, { data: reviewRows }] = await Promise.all([
    admin
      .from("proposal_dispute_resolutions")
      .select("*")
      .in("proposal_id", proposalIds),
    admin
      .from("proposal_reviews")
      .select("*")
      .in("proposal_id", proposalIds),
  ]);
  const disputesByProposal = new Map<string, DisputeResolution[]>();
  const reviewsByProposal = new Map<string, JudgeReview[]>();
  for (const r of (disputeRows ?? []) as DisputeResolutionRow[]) {
    const list = disputesByProposal.get(r.proposal_id) ?? [];
    list.push(rowToDisputeResolution(r));
    disputesByProposal.set(r.proposal_id, list);
  }
  for (const r of (reviewRows ?? []) as ProposalReviewRow[]) {
    const list = reviewsByProposal.get(r.proposal_id) ?? [];
    list.push(rowToJudgeReview(r));
    reviewsByProposal.set(r.proposal_id, list);
  }

  const proposals = propRowsTyped.map((r) =>
    rowToProposal(r, {
      disputeResolutions: disputesByProposal.get(r.id),
      judgeReviews: reviewsByProposal.get(r.id),
    })
  );

  // 모든 출품이 검토 종료된 경우만 공개. 한 건이라도 미종료면 결과 비공개.
  const allClosed = proposals.every((p) => !!p.reviewClosedAt);
  if (!allClosed) return null;

  // 공개 시각 = 가장 마지막에 검토 종료된 출품의 시각.
  const publishedAt = proposals
    .map((p) => p.reviewClosedAt ?? "")
    .filter(Boolean)
    .sort()
    .reverse()[0];

  const competition = rowToCompetition(compRow as CompetitionRow, proposals);
  return {
    competition,
    publishedAt,
    totalProposals: proposals.length,
  };
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
}

function rankAccent(rank: number): { bg: string; fg: string } | null {
  if (rank === 1)
    return { bg: "rgba(184, 134, 11, 0.10)", fg: "var(--rank-gold)" };
  if (rank === 2)
    return { bg: "rgba(113, 113, 122, 0.10)", fg: "var(--rank-silver)" };
  if (rank === 3)
    return { bg: "rgba(161, 98, 7, 0.10)", fg: "var(--rank-bronze)" };
  return null;
}

export default async function PublicResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const loaded = await loadPublicResults(id);
  if (!loaded) notFound();

  const { competition, publishedAt, totalProposals } = loaded;
  const { proposals, template } = competition;

  // 분쟁 결정 + 사람 합의(σ≤7) 자동 폴드를 반영한 최종 점수.
  // 이후 정렬과 표 표시 모두 이 값을 사용한다.
  const foldedByProposal = new Map(
    proposals.map((p) => {
      if (!p.score) return [p.id, null] as const;
      return [
        p.id,
        foldFinalScore(
          p.score,
          template.criteria,
          p.disputeResolutions ?? [],
          p.judgeReviews ?? []
        ),
      ] as const;
    })
  );

  const ranked = [...proposals].sort((a, b) => {
    const sa = foldedByProposal.get(a.id)?.composite ?? -1;
    const sb = foldedByProposal.get(b.id)?.composite ?? -1;
    return sb - sa;
  });

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--page-bg)", color: "var(--text-primary)" }}
    >
      {/* 가벼운 nav — 로고 + 홈 */}
      <header
        className="sticky top-0 z-10"
        style={{
          background: "rgba(255,255,255,0.94)",
          borderBottom: "1px solid var(--t-border)",
          backdropFilter: "blur(6px)",
        }}
      >
        <div className="max-w-[1100px] mx-auto px-8 h-14 flex items-center justify-between">
          <Brand size="sm" />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[12.5px]"
            style={{ color: "var(--text-tertiary)" }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            홈으로
          </Link>
        </div>
      </header>

      <main className="max-w-[1100px] mx-auto px-8 pt-10 pb-20">
        {/* 헤더 */}
        <div className="mb-8">
          <p
            className="text-[12px] mb-2 inline-flex items-center gap-1.5"
            style={{ color: "var(--text-tertiary)" }}
          >
            <Trophy className="w-3 h-3" strokeWidth={2.2} />
            결과 공개
          </p>
          <h1
            className="font-semibold"
            style={{
              fontSize: "clamp(22px, 2.4vw, 28px)",
              lineHeight: 1.3,
              letterSpacing: "-0.01em",
              color: "var(--text-primary)",
            }}
          >
            {competition.name}
          </h1>
          <div
            className="flex items-center flex-wrap gap-x-3 gap-y-1 text-[12.5px] mt-2"
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
            <span>
              출품{" "}
              <strong
                className="tabular-nums"
                style={{ color: "var(--text-secondary)", fontWeight: 600 }}
              >
                {totalProposals}
              </strong>
              건
            </span>
            <span style={{ color: "var(--t-border-bright)" }}>·</span>
            <span className="tabular-nums">결과 확정 {formatDate(publishedAt)}</span>
          </div>
        </div>

        {/* 리더보드 */}
        <section>
          <div
            className="overflow-x-auto"
            style={{
              background: "var(--surface-1)",
              border: "1px solid var(--t-border)",
              borderRadius: 2,
            }}
          >
            <table className="w-full min-w-[760px] text-[13px]">
              <thead>
                <tr
                  style={{
                    background: "var(--surface-2)",
                    borderBottom: "1px solid var(--t-border)",
                  }}
                >
                  <th
                    className="px-3 py-2.5 text-center text-[11.5px] font-semibold"
                    style={{ color: "var(--text-tertiary)", width: 56 }}
                  >
                    순위
                  </th>
                  <th
                    className="px-3 py-2.5 text-left text-[11.5px] font-semibold"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    출품작
                  </th>
                  <th
                    className="px-3 py-2.5 text-right text-[11.5px] font-semibold"
                    style={{ color: "var(--text-tertiary)", width: 90 }}
                  >
                    종합 점수
                  </th>
                  {template.criteria.map((c) => (
                    <th
                      key={c.id}
                      className="px-2 py-2.5 text-center text-[11px] font-semibold"
                      style={{ color: "var(--text-tertiary)", minWidth: 76 }}
                      title={`${c.name} · 가중치 ${Math.round(c.weight * 100)}%`}
                    >
                      <span className="block">{c.name}</span>
                      <span
                        className="block tabular-nums mt-0.5 text-[10px]"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        {Math.round(c.weight * 100)}%
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ranked.map((p, i) => {
                  const folded = foldedByProposal.get(p.id) ?? null;
                  const composite = folded?.composite ?? null;
                  const rank = i + 1;
                  const accent = rankAccent(rank);
                  return (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom: "1px solid var(--t-border-subtle)",
                      }}
                    >
                      <td className="py-3 text-center">
                        <span
                          className="inline-flex items-center justify-center w-7 h-7 tabular-nums text-[12.5px] font-bold"
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
                      <td className="py-3 pr-3">
                        <div
                          className="font-medium leading-tight mb-0.5"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {p.title}
                        </div>
                        <div
                          className="text-[12px]"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          {p.team}
                        </div>
                      </td>
                      <td
                        className="py-3 pr-3 text-right tabular-nums"
                        style={{
                          fontWeight: 700,
                          fontSize: "1.05rem",
                          color:
                            composite == null
                              ? "var(--text-tertiary)"
                              : composite >= 75
                              ? "var(--signal-success)"
                              : composite >= 55
                              ? "var(--signal-warning)"
                              : "var(--signal-danger)",
                        }}
                      >
                        {composite ?? "—"}
                      </td>
                      {template.criteria.map((c) => {
                        const axis = folded?.axes.find(
                          (a) => a.criterionId === c.id
                        );
                        const resolved =
                          axis?.source === "dispute" ||
                          axis?.source === "human_consensus" ||
                          axis?.source === "noisy_consensus";
                        const title =
                          axis?.source === "dispute"
                            ? "분쟁 결정으로 확정된 최종 점수"
                            : axis?.source === "human_consensus"
                            ? "심사위원 평균 채택"
                            : axis?.source === "noisy_consensus"
                            ? `심사위원 평균 채택 — 격차 큼(σ ${axis.humanStddev.toFixed(1)})`
                            : "AI 평가 결과";
                        return (
                          <td
                            key={c.id}
                            className="px-2 py-3 text-center align-middle"
                          >
                            {axis ? (
                              <span
                                title={title}
                                className="tabular-nums text-[13px]"
                                style={{
                                  color: resolved
                                    ? "var(--accent)"
                                    : "var(--text-primary)",
                                  fontWeight: resolved ? 700 : 500,
                                }}
                              >
                                {axis.mean}
                                {resolved ? "*" : ""}
                              </span>
                            ) : (
                              <span
                                className="text-[12px]"
                                style={{ color: "var(--text-tertiary)" }}
                              >
                                —
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* 주석 — 결과 산출 방식 */}
        <p
          className="text-[11.5px] mt-5"
          style={{ color: "var(--text-tertiary)", wordBreak: "keep-all" }}
        >
          AI 1차 평가(3-Pass: Draft·Skeptic·Judge)와 심사위원 검토를 거쳐 확정된
          결과입니다. 분쟁이 있던 항목은 심사위원의 결정으로 마무리되었습니다.
        </p>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 h-9 text-[13px] font-medium transition-colors hover:bg-[color:var(--surface-2)]"
            style={{
              border: "1px solid var(--t-input-border)",
              color: "var(--text-primary)",
              borderRadius: 2,
            }}
          >
            Fastlane 알아보기 →
          </Link>
        </div>
      </main>
    </div>
  );
}
