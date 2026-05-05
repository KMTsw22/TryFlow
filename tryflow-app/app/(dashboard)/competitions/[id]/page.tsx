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
import { ArrowLeft, ArrowRight, Calendar, Users, FileText } from "lucide-react";
import { findCompetition } from "@/lib/fastlane/mock";
import { ScoreChip } from "@/components/fastlane/ScoreChip";
import { FairnessBadge } from "@/components/fastlane/FairnessBadge";
import { FairnessExplainer } from "@/components/fastlane/FairnessExplainer";

const SERIF = "'Fraunces', serif";

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
  const competition = findCompetition(id);
  if (!competition) notFound();

  const { template, proposals } = competition;

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

  return (
    <div className="max-w-[1320px] mx-auto px-8 pt-10 pb-24">
      {/* Back nav — 미니멀 */}
      <Link
        href="/competitions"
        className="inline-flex items-center gap-1.5 text-[12.5px] font-medium mb-10 transition-colors hover:text-[color:var(--text-primary)]"
        style={{ color: "var(--text-tertiary)", letterSpacing: "0.04em" }}
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        대회 목록
      </Link>

      {/* Kicker rule */}
      <div className="flex items-center gap-4 mb-5">
        <span
          className="text-[12px] font-bold uppercase"
          style={{ color: "var(--accent)", letterSpacing: "0.16em" }}
        >
          {competition.organizer}
        </span>
        <span className="flex-1 h-px" style={{ background: "var(--t-border-subtle)" }} />
        <span
          className="text-[12px] font-medium tabular-nums"
          style={{ color: "var(--text-tertiary)", letterSpacing: "0.08em" }}
        >
          마감 D-{dDay}
        </span>
      </div>

      {/* H1 — 한글이라 ko-display 클래스 */}
      <h1
        className="ko-display mb-6"
        style={{
          fontFamily: SERIF,
          fontWeight: 800,
          fontSize: "clamp(2.4rem, 4.8vw, 3.6rem)",
          lineHeight: 1.05,
          color: "var(--text-primary)",
        }}
      >
        {competition.name}
      </h1>

      {/* 메타 strip — 4개 통계 카드. 인포메이션 디자인의 “기능적 헤더”. */}
      <div
        className="grid grid-cols-2 md:grid-cols-4 mb-12 border-y"
        style={{ borderColor: "var(--t-border-subtle)" }}
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

      {/* 리더보드 */}
      <section className="mb-16">
        <div className="flex items-end justify-between mb-5">
          <div>
            <p
              className="text-[11.5px] font-bold uppercase mb-1.5"
              style={{ color: "var(--text-tertiary)", letterSpacing: "0.16em" }}
            >
              AI 1차 평가
            </p>
            <h2
              className="ko-display"
              style={{
                fontFamily: SERIF,
                fontWeight: 800,
                fontSize: "clamp(1.6rem, 2.6vw, 2rem)",
                lineHeight: 1.15,
                color: "var(--text-primary)",
              }}
            >
              종합 점수 순위
            </h2>
          </div>
          <p
            className="text-[12px] tabular-nums hidden md:block"
            style={{ color: "var(--text-tertiary)", letterSpacing: "0.04em" }}
          >
            5회 실행 평균 · σ 표준편차 · 임계값 초과 시 검토 권고
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
                <Th align="left">제안서</Th>
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
                      아직 제출된 제안서가 없습니다.
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
          σ (시그마) = 동일 제안서를 5회 실행한 결과의 표준편차. 임계값을 넘는 항목은
          AI 의 평가가 흔들린다는 의미이므로 인간 심사위원의 검토를 권합니다.
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
      className="px-6 py-5 border-r last:border-r-0"
      style={{ borderColor: "var(--t-border-subtle)" }}
    >
      <div className="flex items-center gap-1.5 mb-2.5">
        {Icon && (
          <Icon
            className="w-3 h-3"
            style={{ color: "var(--text-tertiary)" }}
            strokeWidth={2}
          />
        )}
        <span
          className="text-[10.5px] font-bold uppercase"
          style={{ color: "var(--text-tertiary)", letterSpacing: "0.14em" }}
        >
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span
          className="num-display tabular-nums"
          style={{
            fontWeight: 800,
            fontSize: "1.7rem",
            letterSpacing: "-0.02em",
            lineHeight: 1,
            color: valueColor,
          }}
        >
          {value}
        </span>
        {unit && (
          <span
            className="text-[12px] font-medium"
            style={{ color: "var(--text-tertiary)" }}
          >
            {unit}
          </span>
        )}
      </div>
      {hint && (
        <p
          className="mt-1.5 text-[11.5px] truncate"
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
