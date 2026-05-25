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
import { Plus, ArrowRight, FileText, Users, Inbox } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { OperationGuide } from "@/components/dashboard/OperationGuide";
import type { JudgeAssignmentRow } from "@/lib/fastlane/db";
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
  return "결과 공개";
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

// 통합 대회 항목 — organizer 본인 대회 + judge 로 배정된 대회를 하나의 리스트로.
// 같은 대회를 양쪽에서 갖는 경우(보통: owner 가 자동으로 judge 도 등록됨)
// asOrganizer 와 asJudge 가 둘 다 true. 표시상 "운영" 으로 통합 표기.
interface CompetitionWithRole {
  competition: Competition;
  asOrganizer: boolean;
  asJudge: boolean;
  /** 정렬용. Competition 타입에 노출 안 돼서 별도 보존. */
  createdAt: string;
}

async function loadUserCompetitions(): Promise<{
  items: CompetitionWithRole[];
  isAuthenticated: boolean;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { items: [], isAuthenticated: false };

  // 1) organizer 로서 본인 대회 + 2) judge 로 배정된 대회 ID 병렬 조회.
  const [{ data: ownRows }, { data: judgeRows }] = await Promise.all([
    supabase
      .from("competitions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("competition_judges")
      .select("competition_id")
      .eq("judge_id", user.id),
  ]);

  const ownCompRows = (ownRows ?? []) as CompetitionRow[];
  const ownIds = new Set(ownCompRows.map((c) => c.id));
  const judgeIds = new Set(
    ((judgeRows ?? []) as Pick<JudgeAssignmentRow, "competition_id">[]).map(
      (r) => r.competition_id
    )
  );

  // judge 인데 organizer 가 아닌 대회 id 만 추가 조회 — 데이터 중복 방지.
  const extraIds = [...judgeIds].filter((id) => !ownIds.has(id));
  let extraRows: CompetitionRow[] = [];
  if (extraIds.length > 0) {
    const { data } = await supabase
      .from("competitions")
      .select("*")
      .in("id", extraIds);
    extraRows = (data ?? []) as CompetitionRow[];
  }

  const allCompRows: CompetitionRow[] = [...ownCompRows, ...extraRows];
  const allIds = allCompRows.map((c) => c.id);

  // proposals 한 번에 가져오기.
  const proposalRows: ProposalRow[] = [];
  if (allIds.length > 0) {
    const { data: pRows } = await supabase
      .from("proposals")
      .select("*")
      .in("competition_id", allIds);
    proposalRows.push(...((pRows ?? []) as ProposalRow[]));
  }
  const proposalsByComp = new Map<string, ProposalRow[]>();
  for (const p of proposalRows) {
    const arr = proposalsByComp.get(p.competition_id) ?? [];
    arr.push(p);
    proposalsByComp.set(p.competition_id, arr);
  }

  const items: CompetitionWithRole[] = allCompRows.map((row) => ({
    competition: rowToCompetition(
      row,
      (proposalsByComp.get(row.id) ?? []).map((r) => rowToProposal(r))
    ),
    asOrganizer: ownIds.has(row.id),
    asJudge: judgeIds.has(row.id),
    createdAt: row.created_at,
  }));

  // 정렬: 운영 대회 우선 → 최신순.
  items.sort((a, b) => {
    if (a.asOrganizer !== b.asOrganizer) return a.asOrganizer ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return { items, isAuthenticated: true };
}

export default async function CompetitionsPage() {
  const { items: userItems, isAuthenticated } = await loadUserCompetitions();

  const useDemoFallback = !isAuthenticated;
  // 본문 렌더는 평탄한 Competition[] 로. 역할 정보는 별도 map 으로.
  const competitions: Competition[] = useDemoFallback
    ? MOCK_COMPETITIONS
    : userItems.map((it) => it.competition);
  const roleByCompId = new Map<string, { asOrganizer: boolean; asJudge: boolean }>();
  if (!useDemoFallback) {
    for (const it of userItems) {
      roleByCompId.set(it.competition.id, {
        asOrganizer: it.asOrganizer,
        asJudge: it.asJudge,
      });
    }
  }

  const organizerCount = useDemoFallback
    ? competitions.length
    : userItems.filter((it) => it.asOrganizer).length;
  const judgeCount = useDemoFallback
    ? 0
    : userItems.filter((it) => it.asJudge && !it.asOrganizer).length;
  const totalProposals = competitions.reduce(
    (s, c) => s + c.proposals.length,
    0
  );
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
            평가표를 만들면 AI가 도메인에 맞춘 채점 기준을 자동으로 작성해 1차 채점합니다.
            의견이 갈리는 항목만 심사위원에게 넘어갑니다.
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
            {organizerCount}
          </strong>
          건
        </span>
        {!useDemoFallback && (
          <>
            <Divider />
            <span style={{ color: "var(--text-tertiary)" }}>
              심사{" "}
              <strong
                className="tabular-nums"
                style={{ color: "var(--text-primary)", fontWeight: 600 }}
              >
                {judgeCount}
              </strong>
              건
            </span>
          </>
        )}
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

      {/* 데이터 테이블 또는 Onboarding Checklist (빈 상태) */}
      {competitions.length === 0 ? (
        <OnboardingChecklist />
      ) : (
        <div
          className="overflow-x-auto"
          style={{
            background: "var(--surface-1)",
            border: "1px solid var(--t-border)",
            borderRadius: 2,
          }}
        >
          <table className="w-full min-w-[1100px] text-[13px]">
            <thead>
              <tr
                style={{
                  background: "var(--surface-2)",
                  borderBottom: "1px solid var(--t-border)",
                }}
              >
                <Th width="auto">대회</Th>
                <Th width="10%">내 역할</Th>
                <Th width="12%">단계</Th>
                <Th width="7%" align="right">
                  출품
                </Th>
                <Th width="13%">평가 진행률</Th>
                <Th width="8%" align="right">
                  검토 권고
                </Th>
                <Th width="10%">마감</Th>
                <Th width="14%" align="right">
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

                    {/* 내 역할 — demo fallback 인 경우는 "운영" 으로 표시 */}
                    <Td>
                      <RoleChip
                        role={
                          useDemoFallback
                            ? { asOrganizer: true, asJudge: false }
                            : roleByCompId.get(comp.id) ?? {
                                asOrganizer: false,
                                asJudge: false,
                              }
                        }
                      />
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

                    {/* 액션 — 운영자에게만 심사위원 관리 바로가기 노출 */}
                    <Td align="right">
                      <div className="inline-flex items-center gap-1.5 justify-end flex-nowrap">
                        {(useDemoFallback ||
                          roleByCompId.get(comp.id)?.asOrganizer) && (
                          <Link
                            href={`/competitions/${comp.id}/judges`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[12px] font-medium whitespace-nowrap transition-colors hover:bg-[color:var(--surface-2)]"
                            style={{
                              color: "var(--text-secondary)",
                              background: "var(--surface-1)",
                              border: "1px solid var(--t-input-border)",
                              borderRadius: 2,
                            }}
                            title="심사위원 관리"
                          >
                            <Users className="w-3 h-3 shrink-0" strokeWidth={2.2} />
                            심사위원
                          </Link>
                        )}
                        <Link
                          href={`/competitions/${comp.id}`}
                          className="inline-flex items-center justify-center px-3 py-1 text-[12px] font-medium whitespace-nowrap transition-colors hover:bg-[color:var(--surface-2)]"
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
                      </div>
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

// 사용자 역할 칩 — "운영" 이 상위 권한이므로 둘 다일 때는 "운영" 표기.
// 외부 초대로 들어온 judge-only 인 경우만 "심사" 로 구분.
function RoleChip({
  role,
}: {
  role: { asOrganizer: boolean; asJudge: boolean };
}) {
  if (role.asOrganizer) {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 text-[11.5px]"
        style={{
          color: "var(--accent)",
          border: "1px solid var(--accent-ring)",
          background: "var(--accent-soft)",
          borderRadius: 2,
          fontWeight: 500,
        }}
      >
        운영
      </span>
    );
  }
  if (role.asJudge) {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 text-[11.5px]"
        style={{
          color: "var(--text-secondary)",
          border: "1px solid var(--t-border)",
          background: "transparent",
          borderRadius: 2,
          fontWeight: 500,
        }}
      >
        심사
      </span>
    );
  }
  return <span style={{ color: "var(--text-tertiary)" }}>—</span>;
}

// ── Onboarding Checklist ─────────────────────────────────────
//
// 첫 진입 사용자(대회 0건) 가 무엇부터 해야 할지 명확히 보여주는 3단계 가이드.
// "아직 운영 중인 대회가 없습니다" 같은 단순 안내 대신, 실제로 클릭 가능한
// 단계별 작업 카드. 첫 5분 안에 첫 대회 생성 → 심사위원 초대 → 출품 받기까지
// 도달하도록 lead by hand.

function OnboardingChecklist() {
  // step 1 = 페이지 이동 (실제 작업 시작)
  // step 2, 3 = drawer (운영자 컨텍스트 유지하며 매뉴얼만 확인)
  const steps: Array<{
    n: number;
    icon: typeof FileText;
    title: string;
    body: string;
    cta: string;
    // 둘 중 하나: 페이지 이동 href 또는 drawer topic
    href?: string;
    guide?: "invite" | "submission";
  }> = [
    {
      n: 1,
      icon: FileText,
      title: "첫 평가표 만들기",
      body: "주제·항목·가중치 입력 → AI가 채점 가이드 자동 생성.",
      cta: "평가표 만들기",
      href: "/competitions/new",
    },
    {
      n: 2,
      icon: Users,
      title: "심사위원 초대",
      body: "슬랙 스타일 링크 1개로 자동 등록.",
      cta: "초대 방법 보기",
      guide: "invite",
    },
    {
      n: 3,
      icon: Inbox,
      title: "출품 받기 + AI 평가",
      body: "PDF 업로드 → 3-Pass 평가 자동 실행.",
      cta: "접수 가이드 보기",
      guide: "submission",
    },
  ];

  return (
    <div
      style={{
        background: "var(--surface-1)",
        border: "1px solid var(--t-border)",
        borderRadius: 2,
      }}
    >
      {/* 안내 헤더 */}
      <div
        className="px-6 py-5 border-b"
        style={{ borderColor: "var(--t-border)" }}
      >
        <p
          className="text-[12px] mb-1"
          style={{ color: "var(--accent)", fontWeight: 500 }}
        >
          시작하기
        </p>
        <h2
          className="text-[16px] font-semibold mb-1"
          style={{ color: "var(--text-primary)", letterSpacing: "-0.005em" }}
        >
          3단계로 첫 대회를 운영해보세요
        </h2>
        <p
          className="text-[13px] leading-[1.7]"
          style={{ color: "var(--text-secondary)", wordBreak: "keep-all" }}
        >
          평가표 만들기 → 심사위원 초대 → 출품 받기. 카드 정보 없이, 가입
          즉시 시작할 수 있습니다.
        </p>
      </div>

      {/* 3단계 카드 */}
      <ol>
        {steps.map((s, i) => (
          <li
            key={s.n}
            className="grid grid-cols-[56px_1fr_auto] gap-5 px-6 py-5 items-start"
            style={{
              borderBottom:
                i === steps.length - 1
                  ? "none"
                  : "1px solid var(--t-border-subtle)",
            }}
          >
            {/* Step number */}
            <span
              className="inline-flex items-center justify-center w-8 h-8 text-[13px] font-semibold tabular-nums mt-0.5"
              style={{
                background: "var(--accent-soft)",
                color: "var(--accent)",
                border: "1px solid var(--accent-ring)",
                borderRadius: 2,
              }}
            >
              {s.n}
            </span>

            {/* Body */}
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <s.icon
                  className="w-3.5 h-3.5"
                  style={{ color: "var(--text-tertiary)" }}
                  strokeWidth={2}
                />
                <h3
                  className="text-[14px] font-semibold"
                  style={{
                    color: "var(--text-primary)",
                    letterSpacing: "-0.005em",
                  }}
                >
                  {s.title}
                </h3>
              </div>
              <p
                className="text-[12.5px] leading-[1.7]"
                style={{
                  color: "var(--text-secondary)",
                  wordBreak: "keep-all",
                }}
              >
                {s.body}
              </p>
            </div>

            {/* CTA — step 1 은 페이지 이동, 2/3 은 drawer */}
            <CtaButton step={s} />
          </li>
        ))}
      </ol>

    </div>
  );
}

// step 1 (페이지 이동) vs step 2/3 (drawer) 분기 — JSX 가독성 유지용 분리.
function CtaButton({
  step,
}: {
  step: {
    n: number;
    cta: string;
    href?: string;
    guide?: "invite" | "submission";
  };
}) {
  const isPrimary = step.n === 1;
  const className =
    "inline-flex items-center gap-1.5 px-3.5 h-9 text-[13px] font-medium transition-colors self-start cursor-pointer";
  const style: React.CSSProperties = {
    background: isPrimary ? "var(--accent)" : "var(--surface-1)",
    color: isPrimary ? "#fff" : "var(--text-primary)",
    border: isPrimary
      ? "1px solid var(--accent)"
      : "1px solid var(--t-input-border)",
    borderRadius: 2,
  };

  if (step.href) {
    return (
      <Link href={step.href} className={className} style={style}>
        {step.cta}
        <ArrowRight className="w-3 h-3" strokeWidth={2.4} />
      </Link>
    );
  }
  if (step.guide) {
    return (
      <OperationGuide
        topic={step.guide}
        trigger={
          <button type="button" className={className} style={style}>
            {step.cta}
            <ArrowRight className="w-3 h-3" strokeWidth={2.4} />
          </button>
        }
      />
    );
  }
  return null;
}
