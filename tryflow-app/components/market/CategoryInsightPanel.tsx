import Link from "next/link";
import { ArrowRight, TrendingUp, TrendingDown, Minus } from "lucide-react";

/**
 * Market category insights — VC-actionable widgets for the Market category page.
 *
 * 2026-04 layout refactor:
 *   MarketHealthCard    — compact card shown in the header rail (right of title)
 *                         so "어디 왔는지" + "시장 상태" 가 한 블록에 묶임.
 *   TopInCategory       — main content below header, full width so Top 5 쉽게 스캔.
 *
 * Previous (Jan 2026): single panel with sparkline + keyword frequency — both
 * flagged as "어떻게든 도움 되겠지" noise by the professor.
 */

const SERIF = "'Fraunces', serif";
const DISPLAY = "'Inter', sans-serif";

export interface TopIdeaRow {
  id: string;
  category: string;
  target_user: string;
  viability_score: number | null;
}

function scoreColor(score: number | null): string {
  if (score === null) return "var(--text-tertiary)";
  if (score >= 70) return "var(--signal-success)";
  if (score >= 50) return "var(--signal-warning)";
  return "var(--signal-danger)";
}

const SAT_CONFIG: Record<string, { color: string; tone: string }> = {
  Low: { color: "var(--signal-success)", tone: "Open territory" },
  Medium: { color: "var(--signal-warning)", tone: "Some competition" },
  High: { color: "var(--signal-danger)", tone: "Crowded space" },
};

const TREND_CONFIG: Record<string, { color: string; Icon: typeof TrendingUp }> = {
  Rising: { color: "var(--signal-success)", Icon: TrendingUp },
  Stable: { color: "var(--text-tertiary)", Icon: Minus },
  Declining: { color: "var(--signal-danger)", Icon: TrendingDown },
};

// ── AverageViabilityHero — 헤더 우측에 놓는 hero 점수 블록 ──────────────
// 타이틀 "SaaS/B2B." 와 인트로 오른쪽에 놓여 "카테고리 아이덴티티 + 점수"가
// 좌우 대조로 매거진 커버 느낌을 냄.
export function AverageViabilityHero({ avgScore }: { avgScore: number | null }) {
  return (
    <div className="lg:text-right">
      <p
        className="text-[10.5px] font-medium tracking-[0.1em] uppercase mb-3"
        style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
      >
        Average viability
      </p>
      <div className="flex items-baseline gap-2.5 lg:justify-end">
        <span
          className="tabular-nums leading-[0.8]"
          style={{
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: "clamp(5rem, 10vw, 7.5rem)",
            letterSpacing: "-0.055em",
            color: scoreColor(avgScore),
          }}
        >
          {avgScore ?? "—"}
        </span>
        <span
          className="text-[11px] font-medium tracking-[0.1em] uppercase shrink-0 pb-2"
          style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)", opacity: 0.7 }}
        >
          / 100
        </span>
      </div>
    </div>
  );
}

// ── MarketHealthStrip — 헤더 아래 전체 폭 4 metric strip ────────────────
// AverageViability 는 이미 헤더 우측에서 hero 로 표시되므로 여기엔 포함 안 함.
interface MarketHealthStripProps {
  modalSaturation: "Low" | "Medium" | "High" | null;
  modalTrend: "Rising" | "Stable" | "Declining" | null;
  topScore: number | null;
  newThisWeekCount: number;
}

export function MarketHealthStrip({
  modalSaturation,
  modalTrend,
  topScore,
  newThisWeekCount,
}: MarketHealthStripProps) {
  return (
    <section
      aria-label="Market health indicators"
      className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-6 py-7 border-y"
      style={{ borderColor: "var(--t-border-subtle)" }}
    >
      <Metric
        label="Saturation"
        value={modalSaturation ?? "—"}
        valueColor={
          modalSaturation ? SAT_CONFIG[modalSaturation]?.color : "var(--text-primary)"
        }
        hint={modalSaturation ? SAT_CONFIG[modalSaturation]?.tone : undefined}
      />
      <Metric
        label="Trend"
        value={modalTrend ?? "—"}
        valueColor={
          modalTrend ? TREND_CONFIG[modalTrend]?.color : "var(--text-primary)"
        }
        icon={
          modalTrend && (() => {
            const I = TREND_CONFIG[modalTrend].Icon;
            return (
              <I
                className="w-3.5 h-3.5 shrink-0"
                style={{ color: TREND_CONFIG[modalTrend].color }}
                strokeWidth={2}
              />
            );
          })()
        }
        hint={
          modalTrend === "Rising"
            ? "Growing demand"
            : modalTrend === "Stable"
            ? "Steady interest"
            : modalTrend === "Declining"
            ? "Cooling off"
            : undefined
        }
      />
      <Metric
        label="Top score"
        value={topScore !== null ? topScore.toString() : "—"}
        valueColor={scoreColor(topScore)}
        hint={topScore !== null ? "Best in category" : undefined}
      />
      <Metric
        label="This week"
        value={newThisWeekCount.toString()}
        valueColor={
          newThisWeekCount > 0 ? "var(--text-primary)" : "var(--text-tertiary)"
        }
        hint={newThisWeekCount > 0 ? "New submissions" : "No activity"}
      />
    </section>
  );
}

// Deprecated alias — 하위 호환 (기존 import 을 깨지 않도록). 다음 정리 때 제거.
export function MarketHealthCard(props: MarketHealthStripProps & { avgScore: number | null }) {
  return (
    <>
      <AverageViabilityHero avgScore={props.avgScore} />
      <MarketHealthStrip {...props} />
    </>
  );
}

/**
 * Metric — editorial supporting cell.
 * 라벨(작은 디스플레이 타입, 10.5px, tracking wide) 위에, 값(serif 700, 1.5rem) 아래,
 * hint(12px, 톤 있는 tertiary) 한 줄. 세로 divider 없음 — baseline 정렬로 통일감.
 */
function Metric({
  label,
  value,
  valueColor,
  icon,
  hint,
}: {
  label: string;
  value: string;
  valueColor: string;
  icon?: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="min-w-0 text-center">
      <p
        className="text-[10.5px] font-medium tracking-[0.1em] uppercase mb-2.5"
        style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
      >
        {label}
      </p>
      <div className="flex items-baseline justify-center gap-1.5 mb-1">
        {icon}
        <p
          className="truncate leading-none"
          style={{
            fontFamily: SERIF,
            fontWeight: 700,
            fontSize: "1.5rem",
            letterSpacing: "-0.02em",
            color: valueColor,
          }}
        >
          {value}
        </p>
      </div>
      {hint && (
        <p
          className="text-[11.5px] leading-[1.35] truncate"
          style={{ color: "var(--text-tertiary)", opacity: 0.75 }}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

// ── TopInCategory — 전체 폭 actionable 리스트 ─────────────────────────
interface TopInCategoryProps {
  topIdeas: TopIdeaRow[];
}

export function TopInCategory({ topIdeas }: TopInCategoryProps) {
  return (
    <section aria-label="Top ideas in category">
      <div className="flex items-center gap-4 mb-6">
        <span
          className="text-[15px] font-medium tracking-[0.08em] uppercase"
          style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
        >
          Top in Category
        </span>
        <span className="flex-1 h-px" style={{ background: "var(--t-border-subtle)" }} />
        <span
          className="text-[14px] font-medium tracking-[0.06em] uppercase shrink-0"
          style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
        >
          By viability
        </span>
      </div>

      {topIdeas.length === 0 ? (
        <p
          className="text-[15px] italic"
          style={{ fontFamily: SERIF, color: "var(--text-tertiary)" }}
        >
          No scored ideas yet — check back as analyses complete.
        </p>
      ) : (
        <ol>
          {topIdeas.map((idea, i) => (
            <li
              key={idea.id}
              className="border-b last:border-b-0"
              style={{ borderColor: "var(--t-border-subtle)" }}
            >
              <Link
                href={`/ideas/${idea.id}`}
                className="group grid grid-cols-[auto_1fr_auto_auto] items-baseline gap-x-5 py-4 transition-opacity hover:opacity-80"
              >
                {/* Rank */}
                <span
                  className="tabular-nums leading-none w-8 text-right"
                  style={{
                    fontFamily: SERIF,
                    fontWeight: 900,
                    fontSize: "1.25rem",
                    letterSpacing: "-0.02em",
                    color: "var(--text-tertiary)",
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>

                {/* Target user — headline */}
                <span
                  className="truncate"
                  style={{
                    fontFamily: SERIF,
                    fontWeight: 700,
                    fontSize: "1.15rem",
                    letterSpacing: "-0.01em",
                    color: "var(--text-primary)",
                  }}
                >
                  For {idea.target_user}
                </span>

                {/* Score */}
                <span className="flex items-baseline gap-1 shrink-0 tabular-nums" style={{ minWidth: 60 }}>
                  <span
                    style={{
                      fontFamily: SERIF,
                      fontWeight: 900,
                      fontSize: "1.35rem",
                      letterSpacing: "-0.02em",
                      color: scoreColor(idea.viability_score),
                    }}
                  >
                    {idea.viability_score ?? "—"}
                  </span>
                  <span
                    className="text-[12px] font-medium tracking-[0.06em] uppercase"
                    style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
                  >
                    /100
                  </span>
                </span>

                <ArrowRight
                  className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 shrink-0"
                  strokeWidth={2}
                  style={{ color: "var(--text-tertiary)" }}
                />
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
