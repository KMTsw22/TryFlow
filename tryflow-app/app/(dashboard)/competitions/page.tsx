// 대회 목록.
//
// 디자인 결정 (2026-05 senior pass):
//   - 카드 안에 mini-summary: 제출 N건 / 평가 N건 / 검토 권고 N개.
//     검토 권고가 있으면 amber dot + 카운트로 시선 끌기.
//   - 우측 큰 D-day 숫자 — 마감 임박 (D-7 이하) 시 rose tint.
//   - hover: 카드가 살짝 떠오르는 게 아니라 좌측 vertical accent 가 자라남 (calm).
//
// 데이터: 로그인 시 본인이 운영하는 competitions 테이블 데이터를 표시.
// 비로그인 시엔 demo mock 으로 fallback (로그인 유도 배너 포함).

import Link from "next/link";
import { ArrowRight, LogIn, Plus, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  rowToCompetition,
  type CompetitionRow,
  type ProposalRow,
} from "@/lib/fastlane/db";
import { rowToProposal } from "@/lib/fastlane/db";
import { MOCK_COMPETITIONS } from "@/lib/fastlane/mock";
import type { Competition } from "@/lib/fastlane/types";

const SERIF = "'Pretendard Variable', 'Pretendard', system-ui, sans-serif";

function daysUntil(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));
}

async function loadUserCompetitions(): Promise<{ competitions: Competition[]; isAuthenticated: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { competitions: [], isAuthenticated: false };

  const { data: rows } = await supabase
    .from("competitions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const competitionRows = (rows ?? []) as CompetitionRow[];
  const ids = competitionRows.map((c) => c.id);
  const proposalRows: ProposalRow[] = [];
  if (ids.length > 0) {
    const { data: pRows } = await supabase
      .from("proposals")
      .select("*")
      .in("competition_id", ids);
    proposalRows.push(...((pRows ?? []) as ProposalRow[]));
  }

  const proposalsByComp = new Map<string, ProposalRow[]>();
  for (const p of proposalRows) {
    const arr = proposalsByComp.get(p.competition_id) ?? [];
    arr.push(p);
    proposalsByComp.set(p.competition_id, arr);
  }

  const competitions = competitionRows.map((row) =>
    rowToCompetition(
      row,
      (proposalsByComp.get(row.id) ?? []).map((r) => rowToProposal(r))
    )
  );

  return { competitions, isAuthenticated: true };
}

export default async function CompetitionsPage() {
  const { competitions: userCompetitions, isAuthenticated } = await loadUserCompetitions();

  // 로그인 + 본인 대회 있으면 그것만 표시. 그 외엔 demo mock 으로 미리보기.
  const useDemoFallback = !isAuthenticated || userCompetitions.length === 0;
  const competitions = useDemoFallback ? MOCK_COMPETITIONS : userCompetitions;

  const totalProposals = competitions.reduce((s, c) => s + c.proposals.length, 0);
  const totalReview = competitions.reduce(
    (sum, c) =>
      sum +
      c.proposals.reduce(
        (s, p) => s + (p.score?.axes.filter((a) => a.needsReview).length ?? 0),
        0
      ),
    0
  );

  return (
    <div className="max-w-5xl mx-auto px-8 pt-10 pb-24">
      {/* 사무 SaaS 페이지 헤더 — 제목 + 부제 + 우측 primary CTA. */}
      <div className="flex items-start justify-between gap-8 mb-3 flex-wrap">
        <div>
          <h1
            style={{
              fontWeight: 700,
              fontSize: "1.625rem",
              lineHeight: 1.3,
              color: "var(--text-primary)",
              letterSpacing: "-0.01em",
            }}
          >
            내 대회
          </h1>
          <p
            className="mt-1 text-[12.5px] tabular-nums"
            style={{ color: "var(--text-tertiary)", letterSpacing: "0.02em" }}
          >
            {useDemoFallback
              ? `${MOCK_COMPETITIONS.length}건 데모 표시 중`
              : `${competitions.length}건 운영 중`}
          </p>
        </div>
        <Link
          href="/competitions/new"
          className="group inline-flex items-center gap-2 px-4 h-10 text-[13px] font-semibold transition-colors hover:brightness-110"
          style={{
            background: "var(--accent)",
            color: "#fff",
            letterSpacing: "0.01em",
          }}
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2.4} />
          새 대회
        </Link>
      </div>

      <p
        className="text-[13.5px] leading-[1.8] mb-10 max-w-xl"
        style={{ color: "var(--text-secondary)", wordBreak: "keep-all" }}
      >
        창업·미술·글쓰기·과학·디자인 등 어떤 대회든 평가표를 입력하면 AI가
        도메인 특화 rubric을 자동 생성해 1차 채점합니다. 항목마다
        Draft → Skeptic → Judge 3-Pass 검증으로 점수를 산출하고, 의견이
        갈리는 항목은 심사위원에게 넘깁니다.
      </p>

      {/* 비로그인 안내 — 데모 데이터 표시 중임을 알림 */}
      {!isAuthenticated && (
        <div
          className="flex items-start gap-3 px-5 py-4 mb-10"
          style={{
            background: "var(--accent-soft)",
            border: "1px solid var(--accent-ring)",
          }}
        >
          <LogIn
            className="w-4 h-4 mt-0.5 shrink-0"
            style={{ color: "var(--accent)" }}
            strokeWidth={2.2}
          />
          <div className="text-[13px] leading-[1.7]" style={{ color: "var(--text-secondary)" }}>
            아래는 미리보기 샘플입니다.{" "}
            <Link
              href="/login"
              className="font-semibold underline-offset-2 hover:underline"
              style={{ color: "var(--accent)" }}
            >
              로그인
            </Link>{" "}
            하면 본인이 운영하는 대회만 표시됩니다.
          </div>
        </div>
      )}

      {isAuthenticated && userCompetitions.length === 0 && (
        <div
          className="flex items-start gap-3 px-5 py-4 mb-10"
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--t-border-subtle)",
          }}
        >
          <Trophy
            className="w-4 h-4 mt-0.5 shrink-0"
            style={{ color: "var(--text-tertiary)" }}
            strokeWidth={2.2}
          />
          <div className="text-[13px] leading-[1.7]" style={{ color: "var(--text-secondary)" }}>
            아직 운영 중인 대회가 없어 데모 샘플을 보여드립니다. 우측{" "}
            <span style={{ fontWeight: 600 }}>새 대회</span> 버튼으로 첫 평가표를
            만들어보세요.
          </div>
        </div>
      )}

      {/* 통계 strip */}
      <div
        className="grid grid-cols-3 mb-12 border-y"
        style={{ borderColor: "var(--t-border-subtle)" }}
      >
        <Stat label="운영 중 대회" value={`${competitions.length}`} />
        <Stat label="누적 출품" value={`${totalProposals}`} />
        <Stat
          label="검토 권고"
          value={`${totalReview}`}
          tone={totalReview > 0 ? "attention" : "neutral"}
        />
      </div>

      {/* 카드 그리드 */}
      <div className="space-y-3.5">
        {competitions.map((comp) => {
          const d = daysUntil(comp.deadline);
          const proposalCount = comp.proposals.length;
          const reviewCount = comp.proposals.reduce(
            (s, p) =>
              s + (p.score?.axes.filter((a) => a.needsReview).length ?? 0),
            0
          );
          const evaluatedCount = comp.proposals.filter((p) => !!p.score).length;
          const evalProgress =
            proposalCount === 0 ? 0 : evaluatedCount / proposalCount;
          const dDanger = d <= 7;

          return (
            <Link
              key={comp.id}
              href={`/competitions/${comp.id}`}
              className="group relative grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 px-7 py-6 transition-all hover:bg-[color:var(--accent-soft)]"
              style={{
                background: "var(--surface-1)",
                border: "1px solid var(--t-border-subtle)",
              }}
            >
              {/* 좌측 vertical accent — hover 시 자라남 */}
              <span
                aria-hidden
                className="absolute left-0 top-0 bottom-0 w-[3px] origin-top transition-transform duration-200 group-hover:scale-y-100 scale-y-0"
                style={{ background: "var(--accent)" }}
              />

              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-2.5">
                  <Trophy
                    className="w-3.5 h-3.5"
                    style={{ color: "var(--accent)" }}
                    strokeWidth={2}
                  />
                  <span
                    className="text-[11px] font-bold uppercase"
                    style={{
                      color: "var(--text-tertiary)",
                      letterSpacing: "0.14em",
                    }}
                  >
                    {comp.organizer}
                  </span>
                </div>
                <h2
                  className="ko-display mb-3 truncate"
                  style={{
                    fontFamily: SERIF,
                    fontWeight: 800,
                    fontSize: "1.5rem",
                    lineHeight: 1.2,
                    color: "var(--text-primary)",
                  }}
                >
                  {comp.name}
                </h2>

                {/* 정보 행 */}
                <div
                  className="flex items-center flex-wrap gap-x-5 gap-y-1.5 text-[12.5px]"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <span>
                    평가표:{" "}
                    <span
                      style={{ color: "var(--text-primary)", fontWeight: 600 }}
                    >
                      {comp.template.name}
                    </span>
                    <span style={{ color: "var(--text-tertiary)" }}>
                      {" · "}
                      {comp.template.criteria.length}개 항목
                    </span>
                  </span>
                  <span style={{ color: "var(--t-border-bright)" }}>·</span>
                  <span>
                    출품{" "}
                    <span
                      className="tabular-nums"
                      style={{
                        color: "var(--text-primary)",
                        fontWeight: 700,
                      }}
                    >
                      {proposalCount}
                    </span>
                    건
                  </span>
                  {reviewCount > 0 && (
                    <>
                      <span style={{ color: "var(--t-border-bright)" }}>·</span>
                      <span
                        className="inline-flex items-center gap-1.5"
                        style={{ color: "var(--signal-attention)", fontWeight: 600 }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: "var(--signal-attention)" }}
                        />
                        검토 권고 {reviewCount}개
                      </span>
                    </>
                  )}
                </div>

                {/* 평가 진척도 */}
                {proposalCount > 0 && (
                  <div className="mt-4 max-w-md">
                    <div
                      className="relative h-1 overflow-hidden"
                      style={{ background: "var(--t-border-subtle)" }}
                    >
                      <div
                        className="absolute top-0 bottom-0 left-0 transition-all"
                        style={{
                          width: `${evalProgress * 100}%`,
                          background: "var(--accent)",
                        }}
                      />
                    </div>
                    <p
                      className="mt-1.5 text-[10.5px] tabular-nums"
                      style={{
                        color: "var(--text-tertiary)",
                        letterSpacing: "0.04em",
                      }}
                    >
                      평가 완료 {evaluatedCount}/{proposalCount}
                    </p>
                  </div>
                )}
              </div>

              {/* 우측: D-day + 화살표 */}
              <div className="md:text-right md:min-w-[100px] flex md:block items-center gap-3 self-stretch">
                <div>
                  <span
                    className="num-display tabular-nums leading-none"
                    style={{
                      fontFamily: SERIF,
                      fontWeight: 800,
                      fontSize: "2.4rem",
                      letterSpacing: "-0.04em",
                      color: dDanger
                        ? "var(--signal-danger)"
                        : "var(--text-primary)",
                    }}
                  >
                    D-{d}
                  </span>
                  <p
                    className="mt-1 text-[10.5px] font-bold uppercase"
                    style={{
                      color: "var(--text-tertiary)",
                      letterSpacing: "0.14em",
                    }}
                  >
                    마감
                  </p>
                </div>
                <ArrowRight
                  className="md:absolute md:bottom-6 md:right-7 w-4 h-4 transition-transform group-hover:translate-x-1"
                  style={{ color: "var(--accent)" }}
                />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "attention";
}) {
  return (
    <div
      className="px-5 py-5 border-r last:border-r-0"
      style={{ borderColor: "var(--t-border-subtle)" }}
    >
      <p
        className="text-[10.5px] font-bold uppercase mb-2"
        style={{ color: "var(--text-tertiary)", letterSpacing: "0.14em" }}
      >
        {label}
      </p>
      <p
        className="num-display tabular-nums leading-none"
        style={{
          fontFamily: SERIF,
          fontWeight: 800,
          fontSize: "1.8rem",
          letterSpacing: "-0.025em",
          color:
            tone === "attention"
              ? "var(--signal-attention)"
              : "var(--text-primary)",
        }}
      >
        {value}
      </p>
    </div>
  );
}
