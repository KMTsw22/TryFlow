"use client";

// /competitions/[id]/judges — 심사위원 관리 + 진척 패널 (organizer 전용)
//
// 2026-05-17 확장: 단순 "심사위원 목록 + 초대 링크" 화면이었던 곳에
//   - 심사위원별 진척 테이블 (제출/임시저장/분쟁결정/마지막활동)
//   - 출품 × 심사위원 매트릭스 (한눈에 누락 파악)
//   를 추가. 운영자는 "지금 누가 얼마나 했나" 를 한 화면에서 본다.
//
// 세 영역의 톤:
//   1) 진척 요약 strip — 행정 톤 한 줄 (검토 필요/제출/분쟁/종료)
//   2) 심사위원 진척 테이블 — 행정 톤 표
//   3) 출품 × 심사위원 매트릭스 — 컴팩트 그리드, 셀에 점/체크 표시
//   4) 초대 링크 섹션 — 기존 유지, 운영 톤으로 살짝 다듬음
//
// 데이터 fetch: /api/competitions/[id]/review-progress 한 곳에서 진척·심사위원 통합 +
//   /api/competitions/[id]/invitations 에서 초대 링크.

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Link as LinkIcon,
  Copy,
  Check,
  X,
  Plus,
  Loader2,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import type { Invitation } from "@/lib/fastlane/types";

// API 페이로드 타입 — route.ts 와 동일 모양 (별도 import 안 함 — 라우트와 페이지가
// 같은 코드베이스라 type 일치는 코드 리뷰로 보장).
interface JudgeProgress {
  id: string;
  judgeId: string;
  judgeName: string;
  affiliation: string | null;
  invitedAt: string;
  submittedCount: number;
  draftCount: number;
  disputeDecisionCount: number;
  lastActivityAt: string | null;
}

interface ProposalLite {
  id: string;
  title: string;
  team: string;
  reviewClosedAt: string | null;
}

type CellStatus = "submitted" | "draft" | "none";

interface ReviewProgress {
  judges: JudgeProgress[];
  proposals: ProposalLite[];
  matrix: Record<string, Record<string, CellStatus>>;
  totals: {
    judgeCount: number;
    proposalCount: number;
    submittedReviews: number;
    possibleReviews: number;
    disputeDecisions: number;
    closedProposals: number;
  };
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

export default function JudgesManagementPage() {
  const params = useParams<{ id: string }>();
  const competitionId = params.id;
  const { show: toast } = useToast();

  const [progress, setProgress] = useState<ReviewProgress | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, iRes] = await Promise.all([
        fetch(`/api/competitions/${competitionId}/review-progress`).then((r) =>
          r.json()
        ),
        fetch(`/api/competitions/${competitionId}/invitations`).then((r) =>
          r.json()
        ),
      ]);
      if (pRes && Array.isArray(pRes.judges) && Array.isArray(pRes.proposals)) {
        setProgress(pRes as ReviewProgress);
      } else {
        setProgress({
          judges: [],
          proposals: [],
          matrix: {},
          totals: {
            judgeCount: 0,
            proposalCount: 0,
            submittedReviews: 0,
            possibleReviews: 0,
            disputeDecisions: 0,
            closedProposals: 0,
          },
        });
      }
      setInvitations(Array.isArray(iRes?.invitations) ? iRes.invitations : []);
    } catch (err) {
      console.error("load progress/invitations", err);
    } finally {
      setLoading(false);
    }
  }, [competitionId]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const activeInvitations = useMemo(
    () =>
      invitations.filter((inv) => {
        if (inv.revoked) return false;
        if (inv.expiresAt && new Date(inv.expiresAt) < new Date()) return false;
        if (inv.maxUses && inv.usedCount >= inv.maxUses) return false;
        return true;
      }),
    [invitations]
  );
  const inactiveInvitations = invitations.filter(
    (inv) => !activeInvitations.includes(inv)
  );

  async function handleCreate() {
    if (creating) return;
    setCreating(true);
    try {
      const res = await fetch(
        `/api/competitions/${competitionId}/invitations`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({
          message: data?.error ?? "초대 링크 생성에 실패했습니다.",
          tone: "danger",
        });
        return;
      }
      setInvitations((prev) => [data.invitation, ...prev]);
      toast({ message: "초대 링크가 생성되었습니다.", tone: "success" });
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(token: string) {
    if (
      !confirm(
        "이 초대 링크를 비활성화하시겠어요? 이미 받은 사람도 더는 가입할 수 없습니다."
      )
    ) {
      return;
    }
    try {
      const res = await fetch(
        `/api/competitions/${competitionId}/invitations?token=${encodeURIComponent(
          token
        )}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast({
          message: data?.error ?? "비활성화에 실패했습니다.",
          tone: "danger",
        });
        return;
      }
      setInvitations((prev) =>
        prev.map((inv) =>
          inv.token === token ? { ...inv, revoked: true } : inv
        )
      );
      toast({ message: "초대 링크가 비활성화되었습니다.", tone: "success" });
    } catch (err) {
      console.error("revoke invitation", err);
    }
  }

  async function handleCopy(token: string) {
    const url = `${window.location.origin}/invite/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2000);
      toast({ message: "링크를 복사했습니다.", tone: "success" });
    } catch {
      prompt("아래 링크를 복사해서 공유하세요:", url);
    }
  }

  const totals = progress?.totals;
  const completion =
    totals && totals.possibleReviews > 0
      ? Math.round((totals.submittedReviews / totals.possibleReviews) * 100)
      : 0;

  return (
    <div className="max-w-[1400px] mx-auto px-10 pt-8 pb-20">
      <Link
        href={`/competitions/${competitionId}`}
        className="inline-flex items-center gap-1.5 text-[12.5px] mb-6 transition-colors hover:text-[color:var(--text-primary)]"
        style={{ color: "var(--text-tertiary)" }}
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        대회로 돌아가기
      </Link>

      {/* 헤더 — 운영 톤 */}
      <div
        className="pb-5 mb-6 border-b"
        style={{ borderColor: "var(--t-border)" }}
      >
        <p
          className="text-[12px] mb-1.5"
          style={{ color: "var(--text-tertiary)" }}
        >
          대회 운영 · 심사위원
        </p>
        <h1
          className="text-[20px] font-semibold"
          style={{ color: "var(--text-primary)", letterSpacing: "-0.005em" }}
        >
          심사위원 관리
        </h1>
        <p
          className="text-[13px] mt-2 max-w-2xl"
          style={{ color: "var(--text-secondary)", wordBreak: "keep-all" }}
        >
          초대 링크로 심사위원을 모집하고, 각자의 진행 상황을 한눈에 확인합니다.
          링크를 받은 사람이 로그인 후 자동으로 이 대회의 심사위원으로 등록됩니다.
        </p>
      </div>

      {loading ? (
        <div
          className="px-6 py-10 text-center"
          style={{
            background: "var(--surface-1)",
            border: "1px solid var(--t-border)",
            borderRadius: 2,
          }}
        >
          <Loader2
            className="w-5 h-5 animate-spin mx-auto mb-3"
            style={{ color: "var(--accent)" }}
          />
          <p className="text-[12.5px]" style={{ color: "var(--text-tertiary)" }}>
            불러오는 중…
          </p>
        </div>
      ) : (
        <>
          {/* ── 1) 진척 요약 strip ──────────────────────────── */}
          {totals && (
            <div
              className="flex flex-wrap items-baseline gap-x-5 gap-y-1.5 px-5 py-3 mb-6 text-[13px]"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--t-border)",
                borderRadius: 2,
                color: "var(--text-secondary)",
              }}
            >
              <Stat label="심사위원" value={`${totals.judgeCount}`} unit="명" />
              <Divider />
              <Stat label="출품" value={`${totals.proposalCount}`} unit="건" />
              <Divider />
              <Stat
                label="제출"
                value={`${totals.submittedReviews}/${totals.possibleReviews}`}
                hint={totals.possibleReviews > 0 ? `${completion}%` : undefined}
                tone={completion === 100 ? "success" : "neutral"}
              />
              <Divider />
              <Stat
                label="분쟁 결정"
                value={`${totals.disputeDecisions}`}
                unit="건"
              />
              <Divider />
              <Stat
                label="검토 종료"
                value={`${totals.closedProposals}/${totals.proposalCount}`}
                tone={
                  totals.closedProposals === totals.proposalCount &&
                  totals.proposalCount > 0
                    ? "success"
                    : "neutral"
                }
              />
            </div>
          )}

          {/* ── 2) 심사위원 진척 테이블 ─────────────────────── */}
          <section className="mb-8">
            <SectionHeader
              title="심사위원 진척"
              hint={
                progress && progress.judges.length > 0
                  ? `${progress.judges.length}명`
                  : undefined
              }
            />
            {progress && progress.judges.length === 0 ? (
              <EmptyBox
                title="아직 심사위원이 없습니다."
                body="아래에서 초대 링크를 만들어 공유하세요."
              />
            ) : (
              <div
                className="overflow-x-auto"
                style={{
                  background: "var(--surface-1)",
                  border: "1px solid var(--t-border)",
                  borderRadius: 2,
                }}
              >
                <table className="w-full min-w-[820px] text-[13px]">
                  <thead>
                    <tr
                      style={{
                        background: "var(--surface-2)",
                        borderBottom: "1px solid var(--t-border)",
                      }}
                    >
                      <Th width="22%">심사위원</Th>
                      <Th width="auto">진행률</Th>
                      <Th width="11%" align="right">
                        임시저장
                      </Th>
                      <Th width="11%" align="right">
                        분쟁 결정
                      </Th>
                      <Th width="14%">마지막 활동</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {progress?.judges.map((j, idx) => {
                      const total = progress.totals.proposalCount;
                      const ratio =
                        total > 0 ? j.submittedCount / total : 0;
                      const isLast = idx === progress.judges.length - 1;
                      return (
                        <tr
                          key={j.id}
                          style={{
                            borderBottom: isLast
                              ? "none"
                              : "1px solid var(--t-border-subtle)",
                            background: "var(--surface-1)",
                          }}
                          className="hover:bg-[color:var(--accent-soft)] transition-colors"
                        >
                          <Td>
                            <div
                              className="font-medium truncate"
                              style={{ color: "var(--text-primary)" }}
                              title={j.judgeName}
                            >
                              {j.judgeName}
                            </div>
                            <div
                              className="text-[11.5px] mt-0.5 truncate"
                              style={{ color: "var(--text-tertiary)" }}
                            >
                              {j.affiliation ?? "—"}
                            </div>
                          </Td>
                          <Td>
                            <div
                              className="relative h-1 mb-1.5 overflow-hidden"
                              style={{
                                background: "var(--t-border-subtle)",
                              }}
                            >
                              <div
                                className="absolute top-0 bottom-0 left-0"
                                style={{
                                  width: `${ratio * 100}%`,
                                  background:
                                    ratio === 1
                                      ? "var(--signal-success)"
                                      : "var(--accent)",
                                }}
                              />
                            </div>
                            <p
                              className="text-[11.5px] tabular-nums"
                              style={{ color: "var(--text-tertiary)" }}
                            >
                              {j.submittedCount}/{total} 제출
                            </p>
                          </Td>
                          <Td align="right">
                            {j.draftCount > 0 ? (
                              <span
                                className="tabular-nums"
                                style={{
                                  color: "var(--accent)",
                                  fontWeight: 600,
                                }}
                              >
                                {j.draftCount}
                              </span>
                            ) : (
                              <span style={{ color: "var(--text-tertiary)" }}>
                                —
                              </span>
                            )}
                          </Td>
                          <Td align="right">
                            {j.disputeDecisionCount > 0 ? (
                              <span
                                className="tabular-nums"
                                style={{
                                  color: "var(--text-primary)",
                                  fontWeight: 600,
                                }}
                              >
                                {j.disputeDecisionCount}
                              </span>
                            ) : (
                              <span style={{ color: "var(--text-tertiary)" }}>
                                —
                              </span>
                            )}
                          </Td>
                          <Td>
                            <span
                              className="text-[12px]"
                              style={{
                                color: j.lastActivityAt
                                  ? "var(--text-secondary)"
                                  : "var(--text-tertiary)",
                              }}
                            >
                              {timeAgo(j.lastActivityAt)}
                            </span>
                          </Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* ── 3) 출품 × 심사위원 매트릭스 ─────────────────── */}
          {progress &&
            progress.judges.length > 0 &&
            progress.proposals.length > 0 && (
              <section className="mb-8">
                <SectionHeader
                  title="출품 × 심사위원 매트릭스"
                  hint={`${progress.proposals.length}건 × ${progress.judges.length}명`}
                />
                <p
                  className="text-[11.5px] mb-3"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  ● 제출 완료 · ◐ 임시 저장 · ○ 미평가
                </p>
                <Matrix
                  proposals={progress.proposals}
                  judges={progress.judges}
                  matrix={progress.matrix}
                  competitionId={competitionId}
                />
              </section>
            )}

          {/* ── 4) 초대 링크 ─────────────────────────────── */}
          <section>
            <div className="flex items-center justify-between gap-3 mb-3">
              <SectionHeader
                title="초대 링크"
                icon={
                  <LinkIcon
                    className="w-3.5 h-3.5"
                    style={{ color: "var(--text-tertiary)" }}
                    strokeWidth={2.2}
                  />
                }
                noBottomMargin
              />
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating}
                className="inline-flex items-center gap-1.5 px-3.5 h-9 text-[13px] font-medium text-white transition-[filter] hover:brightness-110 disabled:opacity-60"
                style={{ background: "var(--accent)", borderRadius: 2 }}
              >
                {creating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    만드는 중…
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" strokeWidth={2.4} />새 링크
                  </>
                )}
              </button>
            </div>

            {activeInvitations.length === 0 ? (
              <EmptyBox
                title="활성 초대 링크가 없습니다."
                body={
                  <>
                    상단 <strong>새 링크</strong> 버튼으로 만들고 공유하세요.
                  </>
                }
              />
            ) : (
              <div className="space-y-2">
                {activeInvitations.map((inv) => (
                  <InvitationCard
                    key={inv.token}
                    inv={inv}
                    copied={copiedToken === inv.token}
                    onCopy={() => handleCopy(inv.token)}
                    onRevoke={() => handleRevoke(inv.token)}
                  />
                ))}
              </div>
            )}

            {inactiveInvitations.length > 0 && (
              <details className="mt-5">
                <summary
                  className="text-[11.5px] cursor-pointer inline-block"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  비활성 {inactiveInvitations.length}건 보기
                </summary>
                <div className="space-y-1.5 mt-3">
                  {inactiveInvitations.map((inv) => (
                    <InactiveInvitationRow key={inv.token} inv={inv} />
                  ))}
                </div>
              </details>
            )}
          </section>
        </>
      )}
    </div>
  );
}

// ── 매트릭스 ──────────────────────────────────────────────────

function Matrix({
  proposals,
  judges,
  matrix,
  competitionId,
}: {
  proposals: ProposalLite[];
  judges: JudgeProgress[];
  matrix: Record<string, Record<string, CellStatus>>;
  competitionId: string;
}) {
  return (
    <div
      className="overflow-x-auto"
      style={{
        background: "var(--surface-1)",
        border: "1px solid var(--t-border)",
        borderRadius: 2,
      }}
    >
      <table className="text-[12.5px]" style={{ minWidth: "100%" }}>
        <thead>
          <tr
            style={{
              background: "var(--surface-2)",
              borderBottom: "1px solid var(--t-border)",
            }}
          >
            <th
              className="px-3 py-2.5 text-left text-[11.5px] font-semibold"
              style={{
                color: "var(--text-tertiary)",
                minWidth: 220,
                position: "sticky",
                left: 0,
                background: "var(--surface-2)",
                borderRight: "1px solid var(--t-border)",
              }}
            >
              출품
            </th>
            {judges.map((j) => (
              <th
                key={j.judgeId}
                className="px-2 py-2.5 text-center text-[11.5px] font-semibold whitespace-nowrap"
                style={{
                  color: "var(--text-tertiary)",
                  minWidth: 88,
                }}
                title={j.affiliation ? `${j.judgeName} · ${j.affiliation}` : j.judgeName}
              >
                {j.judgeName}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {proposals.map((p, idx) => {
            const isLast = idx === proposals.length - 1;
            const closed = !!p.reviewClosedAt;
            return (
              <tr
                key={p.id}
                style={{
                  borderBottom: isLast
                    ? "none"
                    : "1px solid var(--t-border-subtle)",
                  background: "var(--surface-1)",
                  opacity: closed ? 0.72 : 1,
                }}
              >
                <td
                  className="px-3 py-2.5 align-middle"
                  style={{
                    position: "sticky",
                    left: 0,
                    background: "var(--surface-1)",
                    borderRight: "1px solid var(--t-border-subtle)",
                  }}
                >
                  <Link
                    href={`/competitions/${competitionId}/proposals/${p.id}`}
                    className="block min-w-0 hover:underline underline-offset-2"
                  >
                    <div
                      className="font-medium truncate"
                      style={{
                        color: "var(--text-primary)",
                        fontSize: "13px",
                      }}
                      title={p.title}
                    >
                      {p.title}
                    </div>
                    <div
                      className="text-[11.5px] truncate"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {p.team}
                      {closed && " · 검토 종료"}
                    </div>
                  </Link>
                </td>
                {judges.map((j) => {
                  const status = matrix[p.id]?.[j.judgeId] ?? "none";
                  return (
                    <td
                      key={j.judgeId}
                      className="px-2 py-2.5 text-center align-middle"
                    >
                      <CellMark status={status} />
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CellMark({ status }: { status: CellStatus }) {
  if (status === "submitted") {
    return (
      <span
        aria-label="제출 완료"
        title="제출 완료"
        className="inline-block w-2.5 h-2.5 rounded-full"
        style={{ background: "var(--signal-success)" }}
      />
    );
  }
  if (status === "draft") {
    return (
      <span
        aria-label="임시 저장"
        title="임시 저장"
        className="inline-block w-2.5 h-2.5 rounded-full"
        style={{
          background: "var(--accent-soft)",
          border: "1.5px solid var(--accent)",
        }}
      />
    );
  }
  return (
    <span
      aria-label="미평가"
      title="미평가"
      className="inline-block w-2.5 h-2.5 rounded-full"
      style={{
        background: "transparent",
        border: "1.5px solid var(--t-border-bright)",
      }}
    />
  );
}

// ── primitives ────────────────────────────────────────────────

function SectionHeader({
  title,
  hint,
  icon,
  noBottomMargin,
}: {
  title: string;
  hint?: string;
  icon?: React.ReactNode;
  noBottomMargin?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-3 ${
        noBottomMargin ? "" : "mb-3"
      }`}
    >
      <h2
        className="inline-flex items-center gap-2 text-[15px] font-semibold"
        style={{
          color: "var(--text-primary)",
          letterSpacing: "-0.003em",
        }}
      >
        {icon}
        {title}
      </h2>
      {hint && (
        <span
          className="text-[12px] tabular-nums"
          style={{ color: "var(--text-tertiary)" }}
        >
          {hint}
        </span>
      )}
    </div>
  );
}

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
      style={{ textAlign: align, verticalAlign: "middle" }}
    >
      {children}
    </td>
  );
}

function Stat({
  label,
  value,
  unit,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string;
  unit?: string;
  hint?: string;
  tone?: "neutral" | "success";
}) {
  const color =
    tone === "success" ? "var(--signal-success)" : "var(--text-primary)";
  return (
    <span style={{ color: "var(--text-tertiary)" }}>
      {label}{" "}
      <strong
        className="tabular-nums"
        style={{ color, fontWeight: 600 }}
      >
        {value}
      </strong>
      {unit && (
        <span style={{ color: "var(--text-tertiary)" }}>
          {" "}
          {unit}
        </span>
      )}
      {hint && (
        <span
          className="ml-1.5 tabular-nums"
          style={{ color: "var(--text-tertiary)" }}
        >
          ({hint})
        </span>
      )}
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

function EmptyBox({
  title,
  body,
}: {
  title: string;
  body: React.ReactNode;
}) {
  return (
    <div
      className="px-6 py-10 text-center"
      style={{
        background: "var(--surface-1)",
        border: "1px solid var(--t-border)",
        borderRadius: 2,
      }}
    >
      <p
        className="text-[13.5px] font-medium mb-1"
        style={{ color: "var(--text-primary)" }}
      >
        {title}
      </p>
      <p
        className="text-[12.5px] leading-[1.7]"
        style={{ color: "var(--text-tertiary)", wordBreak: "keep-all" }}
      >
        {body}
      </p>
    </div>
  );
}

// ── 초대 링크 카드 (운영 톤으로 정리) ──────────────────────────

function InvitationCard({
  inv,
  copied,
  onCopy,
  onRevoke,
}: {
  inv: Invitation;
  copied: boolean;
  onCopy: () => void;
  onRevoke: () => void;
}) {
  const path = `/invite/${inv.token}`;
  const meta: string[] = [];
  if (inv.expiresAt) {
    meta.push(`만료 ${new Date(inv.expiresAt).toLocaleDateString("ko-KR")}`);
  } else {
    meta.push("만료 없음");
  }
  if (inv.maxUses) {
    meta.push(`${inv.usedCount}/${inv.maxUses} 사용`);
  } else {
    meta.push(`${inv.usedCount}회 사용 · 무제한`);
  }

  return (
    <div
      className="flex items-center justify-between gap-3 px-4 py-3 flex-wrap"
      style={{
        background: "var(--surface-1)",
        border: "1px solid var(--t-border)",
        borderRadius: 2,
      }}
    >
      <div className="min-w-0 flex-1">
        <p
          className="font-mono text-[12.5px] truncate"
          style={{ color: "var(--text-primary)" }}
          title={path}
        >
          {path}
        </p>
        <p
          className="text-[11px] mt-1"
          style={{ color: "var(--text-tertiary)" }}
        >
          발급: {inv.invitedByName} · {meta.join(" · ")}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center gap-1.5 px-3 h-8 text-[12px] font-medium transition-colors hover:bg-[color:var(--surface-2)]"
          style={{
            border: "1px solid var(--t-input-border)",
            color: "var(--text-primary)",
            borderRadius: 2,
          }}
        >
          {copied ? (
            <>
              <Check
                className="w-3 h-3"
                style={{ color: "var(--signal-success)" }}
                strokeWidth={2.4}
              />
              복사됨
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" strokeWidth={2.2} />
              복사
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onRevoke}
          aria-label="이 링크 비활성화"
          className="inline-flex items-center justify-center w-8 h-8 transition-colors hover:bg-[color:var(--surface-2)]"
          style={{ color: "var(--text-tertiary)", borderRadius: 2 }}
        >
          <X className="w-3.5 h-3.5" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

function InactiveInvitationRow({ inv }: { inv: Invitation }) {
  const reason = inv.revoked
    ? "비활성화됨"
    : inv.expiresAt && new Date(inv.expiresAt) < new Date()
    ? "만료됨"
    : inv.maxUses && inv.usedCount >= inv.maxUses
    ? "한도 도달"
    : "비활성";
  return (
    <div
      className="flex items-center justify-between gap-3 px-3 py-2 text-[11.5px]"
      style={{
        background: "var(--surface-2)",
        border: "1px solid var(--t-border-subtle)",
        borderRadius: 2,
        opacity: 0.72,
      }}
    >
      <p
        className="font-mono truncate flex-1"
        style={{ color: "var(--text-tertiary)" }}
      >
        /invite/{inv.token}
      </p>
      <span style={{ color: "var(--text-tertiary)" }}>
        {reason} · {inv.usedCount}회 사용됨
      </span>
    </div>
  );
}
