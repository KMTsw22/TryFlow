// 심사 큐 — 사용자가 운영하는 모든 대회의 출품(proposal)을 평면 리스트로 보여줌.
//
// 디자인 결정 (2026-05):
//   - "내 대회" 페이지가 대회 카드 단위라면, 이 페이지는 출품(proposal) 단위.
//     심사위원 입장에서 "내가 봐야 할 항목들의 받은 편지함" 같은 톤.
//   - 항목 카드에 좌측 vertical accent (hover 시 자라남) — 기존 /competitions
//     카드 스타일을 그대로 차용해 시각 일관성 유지.
//   - 검토 권고(needsReview)가 있는 axis 가 1개라도 있으면 amber dot + 카운트로
//     시선을 끔. 별도 /competitions/pending 페이지에서는 그 항목만 필터링.
//
// 데이터: 본인이 운영하는 competitions 의 모든 proposals 를 가져와 flat 하게 정렬.
//        비로그인 또는 데이터 없을 때 데모 mock 으로 fallback.

import Link from "next/link";
import { ArrowRight, Inbox, LogIn, Trophy, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  rowToCompetition,
  rowToProposal,
  type CompetitionRow,
  type ProposalRow,
} from "@/lib/fastlane/db";
import { MOCK_COMPETITIONS } from "@/lib/fastlane/mock";
import type { Competition, Proposal } from "@/lib/fastlane/types";

const SERIF = "'Pretendard Variable', 'Pretendard', system-ui, sans-serif";

// 평면 리스트 항목 — 카드 한 행에 필요한 모든 정보를 미리 합쳐둠.
// proposal 자체에는 어느 대회 소속인지 정보가 없어서 join 결과로 합친다.
interface QueueItem {
  proposal: Proposal;
  competitionId: string;
  competitionName: string;
  organizer: string;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "방금 전";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}일 전`;
  const mo = Math.floor(d / 30);
  return `${mo}개월 전`;
}

async function loadUserQueue(): Promise<{
  competitions: Competition[];
  isAuthenticated: boolean;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { competitions: [], isAuthenticated: false };

  const { data: cRows } = await supabase
    .from("competitions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const compRows = (cRows ?? []) as CompetitionRow[];
  const ids = compRows.map((c) => c.id);
  const pRows: ProposalRow[] = [];
  if (ids.length > 0) {
    const { data: rows } = await supabase
      .from("proposals")
      .select("*")
      .in("competition_id", ids);
    pRows.push(...((rows ?? []) as ProposalRow[]));
  }

  const proposalsByComp = new Map<string, ProposalRow[]>();
  for (const p of pRows) {
    const arr = proposalsByComp.get(p.competition_id) ?? [];
    arr.push(p);
    proposalsByComp.set(p.competition_id, arr);
  }

  const competitions = compRows.map((row) =>
    rowToCompetition(
      row,
      (proposalsByComp.get(row.id) ?? []).map((r) => rowToProposal(r))
    )
  );

  return { competitions, isAuthenticated: true };
}

// competitions 배열을 평면 큐 아이템으로 풀어서 최신 제출순 정렬.
// (대회를 가로지르는 단일 받은편지함 시각화를 위해 필요)
function flatten(competitions: Competition[]): QueueItem[] {
  const items: QueueItem[] = [];
  for (const comp of competitions) {
    for (const p of comp.proposals) {
      items.push({
        proposal: p,
        competitionId: comp.id,
        competitionName: comp.name,
        organizer: comp.organizer,
      });
    }
  }
  items.sort(
    (a, b) =>
      new Date(b.proposal.submittedAt).getTime() -
      new Date(a.proposal.submittedAt).getTime()
  );
  return items;
}

export default async function QueuePage() {
  const { competitions: userComps, isAuthenticated } = await loadUserQueue();
  // 비로그인일 때만 mock 미리보기. 로그인 + 0건은 EmptyState 가 처리.
  const useDemoFallback = !isAuthenticated;
  const competitions = useDemoFallback ? MOCK_COMPETITIONS : userComps;

  const items = flatten(competitions);

  // 집계 — 통계 strip 용. evaluated = score 있음, review = needsReview axis 있음.
  const total = items.length;
  const evaluated = items.filter((i) => !!i.proposal.score).length;
  const reviewCount = items.filter(
    (i) =>
      i.proposal.score?.axes.some((a) => a.needsReview) ?? false
  ).length;

  return (
    <div className="max-w-[1400px] mx-auto px-12 pt-10 pb-24">
      {/* 페이지 헤더 — 사무 SaaS 스타일, /competitions 와 동일 톤. */}
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
            심사 큐
          </h1>
          <p
            className="mt-1 text-[12px] tabular-nums"
            style={{ color: "var(--text-tertiary)", letterSpacing: "0.02em" }}
          >
            {useDemoFallback
              ? `${total}건 데모 표시 중`
              : `${total}건 접수`}
          </p>
        </div>
        <Link
          href="/competitions"
          className="group inline-flex items-center gap-2 px-4 h-10 text-[13px] font-medium transition-colors hover:bg-[color:var(--surface-2)]"
          style={{
            border: "1px solid var(--t-border-subtle)",
            color: "var(--text-secondary)",
            letterSpacing: "0.01em",
          }}
        >
          내 대회로
          <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.2} />
        </Link>
      </div>

      <p
        className="text-[13px] leading-[1.8] mb-10 max-w-xl"
        style={{ color: "var(--text-secondary)", wordBreak: "keep-all" }}
      >
        운영 중인 모든 대회의 출품을 한 곳에서 봅니다. 최신 제출 순으로
        정렬되며, 검토 권고가 붙은 출품은 별도의{" "}
        <Link
          href="/competitions/pending"
          className="font-semibold underline-offset-2 hover:underline"
          style={{ color: "var(--accent)" }}
        >
          검토 대기
        </Link>{" "}
        화면에서 따로 확인할 수 있습니다.
      </p>

      {/* 비로그인 안내 */}
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
            하면 본인이 운영하는 대회의 출품만 표시됩니다.
          </div>
        </div>
      )}

      {isAuthenticated && userComps.length === 0 && (
        <div
          className="flex items-start gap-3 px-5 py-4 mb-10"
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--t-border-subtle)",
          }}
        >
          <Inbox
            className="w-4 h-4 mt-0.5 shrink-0"
            style={{ color: "var(--text-tertiary)" }}
            strokeWidth={2.2}
          />
          <div className="text-[13px] leading-[1.7]" style={{ color: "var(--text-secondary)" }}>
            아직 운영 중인 대회가 없어 데모 샘플을 보여드립니다. 먼저{" "}
            <Link
              href="/competitions/new"
              className="font-semibold underline-offset-2 hover:underline"
              style={{ color: "var(--accent)" }}
            >
              새 대회
            </Link>
            를 만들고 출품을 받으면 이 큐에 쌓입니다.
          </div>
        </div>
      )}

      {/* 통계 strip — 사무 표 톤, /competitions 와 일관된 박스 형식. */}
      <div
        className="grid grid-cols-3 mb-12 border-y"
        style={{ borderColor: "var(--t-border-subtle)" }}
      >
        <Stat label="전체 출품" value={`${total}`} />
        <Stat label="평가 완료" value={`${evaluated}`} />
        <Stat
          label="검토 권고"
          value={`${reviewCount}`}
          tone={reviewCount > 0 ? "attention" : "neutral"}
        />
      </div>

      {/* 카드 리스트 — 출품 단위. 대회별 그룹화 X (이건 /competitions 의 역할). */}
      {items.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {items.map((it) => (
            <ProposalRow key={`${it.competitionId}:${it.proposal.id}`} item={it} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProposalRow({ item }: { item: QueueItem }) {
  const { proposal, competitionId, competitionName, organizer } = item;
  const score = proposal.score;
  const composite = score?.composite ?? null;
  const reviewAxes = score?.axes.filter((a) => a.needsReview) ?? [];
  const evaluated = !!score;

  // 점수 색 — 70+ 양호, 50~70 주의, 50- 위험. 평가 전이면 회색.
  const scoreColor = !evaluated
    ? "var(--text-tertiary)"
    : composite! >= 70
    ? "var(--signal-success)"
    : composite! >= 50
    ? "var(--signal-warning)"
    : "var(--signal-danger)";

  return (
    <Link
      href={`/competitions/${competitionId}/proposals/${proposal.id}`}
      className="group relative grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 px-7 py-5 transition-all hover:bg-[color:var(--accent-soft)]"
      style={{
        background: "var(--surface-1)",
        border: "1px solid var(--t-border-subtle)",
      }}
    >
      {/* hover 시 자라나는 좌측 accent */}
      <span
        aria-hidden
        className="absolute left-0 top-0 bottom-0 w-[3px] origin-top transition-transform duration-200 group-hover:scale-y-100 scale-y-0"
        style={{ background: "var(--accent)" }}
      />

      <div className="min-w-0">
        {/* 어느 대회 소속인지 chip — 큐가 대회를 가로지르므로 필수 정보 */}
        <div className="flex items-center gap-2 mb-2.5">
          <Trophy
            className="w-3.5 h-3.5 shrink-0"
            style={{ color: "var(--accent)" }}
            strokeWidth={2}
          />
          <span
            className="text-[11px] font-bold uppercase truncate"
            style={{
              color: "var(--text-tertiary)",
              letterSpacing: "0.14em",
            }}
          >
            {organizer} · {competitionName}
          </span>
        </div>

        <h2
          className="ko-display mb-1.5 truncate"
          style={{
            fontFamily: SERIF,
            fontWeight: 800,
            fontSize: "1.2rem",
            lineHeight: 1.25,
            color: "var(--text-primary)",
          }}
        >
          {proposal.title}
        </h2>

        <p
          className="text-[13px] leading-[1.6] mb-3 line-clamp-1"
          style={{ color: "var(--text-secondary)" }}
        >
          {proposal.summary}
        </p>

        {/* 메타 정보 행: 팀 · 제출시각 · 검토권고 */}
        <div
          className="flex items-center flex-wrap gap-x-4 gap-y-1.5 text-[12px]"
          style={{ color: "var(--text-secondary)" }}
        >
          <span>
            팀:{" "}
            <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
              {proposal.team}
            </span>
          </span>
          <span style={{ color: "var(--t-border-bright)" }}>·</span>
          <span style={{ color: "var(--text-tertiary)" }}>
            {timeAgo(proposal.submittedAt)} 제출
          </span>
          {!evaluated && (
            <>
              <span style={{ color: "var(--t-border-bright)" }}>·</span>
              <span
                className="inline-flex items-center gap-1"
                style={{ color: "var(--text-tertiary)" }}
              >
                평가 전
              </span>
            </>
          )}
          {reviewAxes.length > 0 && (
            <>
              <span style={{ color: "var(--t-border-bright)" }}>·</span>
              <span
                className="inline-flex items-center gap-1.5"
                style={{ color: "var(--signal-attention)", fontWeight: 600 }}
              >
                <AlertTriangle className="w-3 h-3" strokeWidth={2.4} />
                검토 권고 {reviewAxes.length}개
              </span>
            </>
          )}
        </div>
      </div>

      {/* 우측 — 종합 점수 + 화살표 */}
      <div className="md:text-right md:min-w-[100px] flex md:block items-center gap-3 self-stretch">
        <div>
          <span
            className="num-display tabular-nums leading-none"
            style={{
              fontFamily: SERIF,
              fontWeight: 800,
              fontSize: "2.2rem",
              letterSpacing: "-0.03em",
              color: scoreColor,
            }}
          >
            {evaluated ? composite : "—"}
          </span>
          <p
            className="mt-1 text-[11px] font-bold uppercase"
            style={{
              color: "var(--text-tertiary)",
              letterSpacing: "0.14em",
            }}
          >
            {evaluated ? "종합 점수" : "평가 전"}
          </p>
        </div>
        <ArrowRight
          className="md:absolute md:bottom-5 md:right-7 w-4 h-4 transition-transform group-hover:translate-x-1"
          style={{ color: "var(--accent)" }}
        />
      </div>
    </Link>
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
        className="text-[11px] font-bold uppercase mb-2"
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

function EmptyState() {
  return (
    <div
      className="px-7 py-20 text-center"
      style={{
        background: "var(--surface-1)",
        border: "1px dashed var(--t-border-subtle)",
      }}
    >
      <Inbox
        className="w-8 h-8 mx-auto mb-4"
        style={{ color: "var(--text-tertiary)" }}
        strokeWidth={1.6}
      />
      <p
        className="text-[15px] font-semibold mb-1.5"
        style={{ color: "var(--text-primary)" }}
      >
        아직 도착한 출품이 없습니다.
      </p>
      <p
        className="text-[13px] leading-[1.7]"
        style={{ color: "var(--text-tertiary)" }}
      >
        출품이 접수되면 이 큐에 최신 순으로 쌓입니다.
      </p>
    </div>
  );
}
