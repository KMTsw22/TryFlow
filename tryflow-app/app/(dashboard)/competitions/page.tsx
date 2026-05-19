// 대회 목록.
//
// 2026-05-17 리톤: 카드 그리드 → 행정 시스템 테이블.
// 변경 이유: 운영 영역(목록)은 스코어러 플러스 류 실무 시스템 톤이 맞다.
//   - serif/큰숫자/uppercase/vertical stripe 제거
//   - 카드 행 → 테이블 행 (hairline border, 셀 안 컴팩트 정보)
//   - 단계(stage) 컬럼 추가 — 출품·평가 진척에서 추정해 4단계로 칩 표시
//   - 진행률은 작은 1px 막대 + 숫자 (큰 progress bar 아님)
//
// 데이터: 로그인 시 본인이 운영하는 competitions. 비로그인 = mock 데모.

import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  rowToCompetition,
  type CompetitionRow,
  type ProposalRow,
} from "@/lib/fastlane/db";
import { rowToProposal } from "@/lib/fastlane/db";
import { MOCK_COMPETITIONS } from "@/lib/fastlane/mock";
import type { Competition } from "@/lib/fastlane/types";

// 4단계 stage — 출품/평가 진척에서 추정. 별도 stage 컬럼이 DB 에 없어도
// 의미 있는 운영 신호를 줄 수 있도록 휴리스틱 적용.
type Stage = "intake" | "evaluating" | "reviewing" | "closed";

function stageOf(comp: Competition): Stage {
  const props = comp.proposals;
  if (props.length === 0) return "intake";
  const allEvaluated = props.every((p) => !!p.score);
  if (!allEvaluated) return "evaluating";
  const allClosed = props.every((p) => !!p.reviewClosedAt);
  if (allClosed) return "closed";
  return "reviewing";
}

function stageLabel(s: Stage): string {
  if (s === "intake") return "접수 중";
  if (s === "evaluating") return "AI 평가 중";
  if (s === "reviewing") return "심사 진행 중";
  return "검토 종료";
}

function stageColor(s: Stage): string {
  if (s === "intake") return "var(--text-tertiary)";
  if (s === "evaluating") return "var(--accent)";
  if (s === "reviewing") return "var(--signal-attention)";
  return "var(--signal-success)";
}

function daysUntil(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));
}

function formatDeadline(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

async function loadUserCompetitions(): Promise<{
  competitions: Competition[];
  isAuthenticated: boolean;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
  const { competitions: userCompetitions, isAuthenticated } =
    await loadUserCompetitions();

  const useDemoFallback = !isAuthenticated;
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
    <div className="max-w-[1400px] mx-auto px-10 pt-8 pb-20">
      {/* 헤더 — 행정 톤 */}
      <div
        className="pb-5 mb-6 border-b flex items-start justify-between gap-6 flex-wrap"
        style={{ borderColor: "var(--t-border)" }}
      >
        <div>
          <p
            className="text-[12px] mb-1.5"
            style={{ color: "var(--text-tertiary)" }}
          >
            대회 운영
          </p>
          <h1
            className="text-[20px] font-semibold"
            style={{ color: "var(--text-primary)", letterSpacing: "-0.005em" }}
          >
            내 대회
          </h1>
          <p
            className="text-[13px] mt-2 max-w-2xl"
            style={{ color: "var(--text-secondary)", wordBreak: "keep-all" }}
          >
            평가표를 입력하면 AI가 도메인 특화 rubric을 자동 생성해 1차 채점합니다.
            의견이 갈리는 항목은 심사위원에게 넘깁니다.
          </p>
        </div>
        <Link
          href="/competitions/new"
          className="inline-flex items-center gap-1.5 px-3.5 h-9 text-[13px] font-medium transition-colors hover:brightness-110"
          style={{
            background: "var(--accent)",
            color: "#fff",
            borderRadius: 2,
          }}
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2.4} />
          새 대회
        </Link>
      </div>

      {/* 비로그인 안내 */}
      {!isAuthenticated && (
        <div
          className="px-5 py-3 mb-4 text-[13px]"
          style={{
            background: "var(--accent-soft)",
            border: "1px solid var(--accent-ring)",
            borderRadius: 2,
            color: "var(--text-secondary)",
          }}
        >
          아래는 미리보기 샘플입니다.{" "}
          <Link
            href="/login"
            className="font-medium underline-offset-2 hover:underline"
            style={{ color: "var(--accent)" }}
          >
            로그인
          </Link>{" "}
          하면 본인이 운영하는 대회만 표시됩니다.
        </div>
      )}

      {/* 한 줄 요약 strip */}
      <div
        className="flex flex-wrap items-baseline gap-x-5 gap-y-1.5 px-5 py-3 mb-4 text-[13px]"
        style={{
          background: "var(--surface-2)",
          border: "1px solid var(--t-border)",
          borderRadius: 2,
          color: "var(--text-secondary)",
        }}
      >
        <span style={{ color: "var(--text-tertiary)" }}>
          운영{" "}
          <strong
            className="tabular-nums"
            style={{ color: "var(--text-primary)", fontWeight: 600 }}
          >
            {competitions.length}
          </strong>
          건
        </span>
        <Divider />
        <span style={{ color: "var(--text-tertiary)" }}>
          누적 출품{" "}
          <strong
            className="tabular-nums"
            style={{ color: "var(--text-primary)", fontWeight: 600 }}
          >
            {totalProposals}
          </strong>
          건
        </span>
        <Divider />
        <span style={{ color: "var(--text-tertiary)" }}>
          검토 권고{" "}
          <strong
            className="tabular-nums"
            style={{
              color:
                totalReview > 0
                  ? "var(--signal-attention)"
                  : "var(--text-primary)",
              fontWeight: totalReview > 0 ? 700 : 600,
            }}
          >
            {totalReview}
          </strong>
          개 항목
        </span>
      </div>

      {/* 데이터 테이블 */}
      {competitions.length === 0 ? (
        <div
          className="px-6 py-12 text-center"
          style={{
            background: "var(--surface-1)",
            border: "1px solid var(--t-border)",
            borderRadius: 2,
          }}
        >
          <p
            className="text-[14px] font-medium mb-1.5"
            style={{ color: "var(--text-primary)" }}
          >
            아직 운영 중인 대회가 없습니다.
          </p>
          <p
            className="text-[12.5px] leading-[1.7]"
            style={{ color: "var(--text-tertiary)", wordBreak: "keep-all" }}
          >
            우측 상단{" "}
            <span style={{ fontWeight: 600 }}>새 대회</span> 버튼으로 첫 평가표를
            만들어보세요.
          </p>
        </div>
      ) : (
        <div
          className="overflow-x-auto"
          style={{
            background: "var(--surface-1)",
            border: "1px solid var(--t-border)",
            borderRadius: 2,
          }}
        >
          <table className="w-full min-w-[1040px] text-[13px]">
            <thead>
              <tr
                style={{
                  background: "var(--surface-2)",
                  borderBottom: "1px solid var(--t-border)",
                }}
              >
                <Th width="auto">대회</Th>
                <Th width="12%">평가표</Th>
                <Th width="12%">단계</Th>
                <Th width="8%" align="right">
                  출품
                </Th>
                <Th width="14%">평가 진행률</Th>
                <Th width="9%" align="right">
                  검토 권고
                </Th>
                <Th width="11%">마감</Th>
                <Th width="6%" align="right">
                  &nbsp;
                </Th>
              </tr>
            </thead>
            <tbody>
              {competitions.map((comp, idx) => {
                const d = daysUntil(comp.deadline);
                const proposalCount = comp.proposals.length;
                const evaluated = comp.proposals.filter((p) => !!p.score).length;
                const reviewCount = comp.proposals.reduce(
                  (s, p) =>
                    s +
                    (p.score?.axes.filter((a) => a.needsReview).length ?? 0),
                  0
                );
                const stage = stageOf(comp);
                const dDanger = d <= 7;
                const isLast = idx === competitions.length - 1;

                return (
                  <tr
                    key={comp.id}
                    style={{
                      borderBottom: isLast
                        ? "none"
                        : "1px solid var(--t-border-subtle)",
                      background: "var(--surface-1)",
                    }}
                    className="hover:bg-[color:var(--accent-soft)] transition-colors"
                  >
                    {/* 대회 (이름 + 주최) */}
                    <Td>
                      <Link
                        href={`/competitions/${comp.id}`}
                        className="block group min-w-0"
                      >
                        <div
                          className="text-[11.5px] mb-0.5"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          {comp.organizer}
                        </div>
                        <div
                          className="font-medium truncate group-hover:underline underline-offset-2"
                          style={{
                            fontSize: "13.5px",
                            color: "var(--text-primary)",
                          }}
                          title={comp.name}
                        >
                          {comp.name}
                        </div>
                      </Link>
                    </Td>

                    {/* 평가표 */}
                    <Td>
                      <div
                        className="truncate"
                        style={{ color: "var(--text-secondary)" }}
                        title={comp.template.name}
                      >
                        {comp.template.name}
                      </div>
                      <div
                        className="text-[11.5px] mt-0.5"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        {comp.template.criteria.length}개 항목
                      </div>
                    </Td>

                    {/* 단계 */}
                    <Td>
                      <StageChip stage={stage} />
                    </Td>

                    {/* 출품 */}
                    <Td align="right">
                      <span
                        className="tabular-nums"
                        style={{
                          color: "var(--text-primary)",
                          fontWeight: 600,
                        }}
                      >
                        {proposalCount}
                      </span>
                    </Td>

                    {/* 평가 진행률 */}
                    <Td>
                      {proposalCount > 0 ? (
                        <div>
                          <div
                            className="relative h-1 mb-1 overflow-hidden"
                            style={{ background: "var(--t-border-subtle)" }}
                          >
                            <div
                              className="absolute top-0 bottom-0 left-0"
                              style={{
                                width: `${
                                  (evaluated / proposalCount) * 100
                                }%`,
                                background: "var(--accent)",
                              }}
                            />
                          </div>
                          <p
                            className="text-[11.5px] tabular-nums"
                            style={{ color: "var(--text-tertiary)" }}
                          >
                            {evaluated}/{proposalCount}
                          </p>
                        </div>
                      ) : (
                        <span style={{ color: "var(--text-tertiary)" }}>—</span>
                      )}
                    </Td>

                    {/* 검토 권고 */}
                    <Td align="right">
                      {reviewCount > 0 ? (
                        <span
                          className="tabular-nums"
                          style={{
                            color: "var(--signal-attention)",
                            fontWeight: 600,
                          }}
                        >
                          {reviewCount}
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-tertiary)" }}>—</span>
                      )}
                    </Td>

                    {/* 마감 */}
                    <Td>
                      <div
                        className="leading-tight"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        <div className="tabular-nums">
                          {formatDeadline(comp.deadline)}
                        </div>
                        <div
                          className="text-[11.5px] tabular-nums mt-0.5"
                          style={{
                            color: dDanger
                              ? "var(--signal-danger)"
                              : "var(--text-tertiary)",
                            fontWeight: dDanger ? 600 : 400,
                          }}
                        >
                          D-{d}
                        </div>
                      </div>
                    </Td>

                    {/* 액션 */}
                    <Td align="right">
                      <Link
                        href={`/competitions/${comp.id}`}
                        className="inline-flex items-center justify-center px-3 py-1 text-[12px] font-medium transition-colors"
                        style={{
                          color: "var(--text-primary)",
                          background: "var(--surface-1)",
                          border: "1px solid var(--t-input-border)",
                          borderRadius: 2,
                          minWidth: 56,
                        }}
                      >
                        열기
                      </Link>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── primitives ────────────────────────────────────────────────

function Th({
  children,
  width,
  align = "left",
}: {
  children: React.ReactNode;
  width?: string;
  align?: "left" | "right" | "center";
}) {
  return (
    <th
      className="px-3 py-2.5 text-[11.5px] font-semibold"
      style={{
        width,
        textAlign: align,
        color: "var(--text-tertiary)",
        letterSpacing: "0",
      }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right" | "center";
}) {
  return (
    <td
      className="px-3 py-3 align-middle"
      style={{
        textAlign: align,
        verticalAlign: "middle",
      }}
    >
      {children}
    </td>
  );
}

function StageChip({ stage }: { stage: Stage }) {
  const color = stageColor(stage);
  const label = stageLabel(stage);
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11.5px]"
      style={{
        color,
        border: `1px solid ${color}33`,
        borderRadius: 2,
        fontWeight: 500,
      }}
    >
      <span
        aria-hidden
        className="inline-block w-1.5 h-1.5 rounded-full"
        style={{ background: color }}
      />
      {label}
    </span>
  );
}

function Divider() {
  return (
    <span
      aria-hidden
      className="inline-block w-px h-3.5"
      style={{ background: "var(--t-border-bright)" }}
    />
  );
}
