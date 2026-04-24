import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ArrowRight } from "lucide-react";
import { OnboardingChecklist } from "@/components/dashboard/OnboardingChecklist";
import { IdeaGrid, type IdeaGridItem } from "@/components/ideas/IdeaGrid";
import type { TrendDirection } from "@/components/ui/TrendLabel";
import type { IdeaStatus } from "@/components/ui/StatusBadge";
import { getCategoryTheme, timeAgo } from "@/lib/categories";

const SERIF = "'Fraunces', serif";
const DISPLAY = "'Inter', sans-serif";

interface Report {
  viability_score: number;
  saturation_level: string;
  trend_direction: string;
  similar_count: number;
  summary: string;
}

interface Idea {
  id: string;
  category: string;
  target_user: string;
  description: string;
  created_at: string;
  stage: string | null;
  is_private: boolean | null;
  save_count: number | null;
  insight_reports: Report | Report[] | null;
}

function getReport(idea: Idea): Report | null {
  if (!idea.insight_reports) return null;
  if (Array.isArray(idea.insight_reports)) return idea.insight_reports[0] ?? null;
  return idea.insight_reports;
}

function deriveStatus(idea: Idea, hasAi: boolean): IdeaStatus {
  const hasReport = !!getReport(idea);
  if (!hasReport) return "analyzing";
  if (!hasAi && !idea.is_private) return "analyzing";
  if (idea.is_private) return "private";
  return "live";
}

function toGridItem(idea: Idea, aiScore: number | null): IdeaGridItem {
  const r = getReport(idea);
  // AI 점수가 있으면 그것을 우선, 없으면 휴리스틱 insight_reports 점수를 사용
  const score = aiScore ?? r?.viability_score ?? null;
  return {
    id: idea.id,
    category: idea.category,
    target_user: idea.target_user,
    description: idea.description,
    created_at: idea.created_at,
    stage: idea.stage,
    viability_score: score,
    trend_direction: (r?.trend_direction as TrendDirection | undefined) ?? null,
    saturation_level: r?.saturation_level ?? null,
    status: deriveStatus(idea, aiScore !== null),
    save_count: idea.save_count ?? 0,
  };
}

// 점수 → 색상 (전역 임계값 규칙. 70/50)
function scoreColor(score: number | null): string {
  if (score === null) return "var(--text-tertiary)";
  if (score >= 70) return "var(--signal-success)";
  if (score >= 50) return "var(--signal-warning)";
  return "var(--signal-danger)";
}

// 점수 → 한 줄 verdict. 대시보드 히어로에서 쓸 편집자 톤.
function verdictLabel(score: number | null): string {
  if (score === null) return "Pending verdict";
  if (score >= 75) return "Strong signal";
  if (score >= 60) return "Worth refining";
  if (score >= 45) return "Needs sharper angle";
  return "Weak signal";
}

// 2026-04: state-based dynamic 헤드라인.
// "Welcome back" 같은 generic 카피 대신 매일 다른 정보로 말 걸기.
// 우선순위: empty > pending > stale (>=14d) > strong (>=70 fresh) > weak (<50 fresh) > default.
function getHeroCopy(args: {
  hasIdeas: boolean;
  totalIdeas: number;
  latestItem: IdeaGridItem | null;
  latestDaysAgo: number | null;
  bestScore: number | null;
}): { h1: string; intro: string } {
  const { hasIdeas, totalIdeas, latestItem, latestDaysAgo, bestScore } = args;

  if (!hasIdeas || !latestItem) {
    return {
      h1: "Your signals.",
      intro:
        "Every idea you've submitted, with its viability score and AI insight attached.",
    };
  }

  const latestScore = latestItem.viability_score ?? null;
  const pending = latestItem.status === "analyzing" || latestScore === null;

  if (pending) {
    return {
      h1: "Analysis underway.",
      intro:
        totalIdeas === 1
          ? "Your first idea is being scored. Hang tight — first signal in under a minute."
          : `Latest idea still scoring. Meanwhile, ${totalIdeas} ideas in your workbench.`,
    };
  }

  // Stale — last submission ≥14d ago. Push toward iteration / new submission.
  if ((latestDaysAgo ?? 0) >= 14) {
    return {
      h1: `It's been ${latestDaysAgo} days.`,
      intro: `Your last signal: ${latestScore} for ${latestItem.target_user}. Iterate the angle, or start something new.`,
    };
  }

  // Strong — latest scored ≥70.
  if (latestScore >= 70) {
    return {
      h1: "Strong signal.",
      intro: `Latest scored ${latestScore} — ${verdictLabel(latestScore).toLowerCase()}. ${
        totalIdeas === 1 ? "Push it forward." : `${totalIdeas} ideas in the workbench.`
      }`,
    };
  }

  // Weak — latest scored <50. Push iteration loop.
  if (latestScore < 50) {
    return {
      h1: "Needs sharper angle.",
      intro: `Latest scored ${latestScore}. Iteration lives below — fix one weakness, resubmit.`,
    };
  }

  // Default — medium fresh idea (50-69). Surface best signal as a comparison.
  const bestLine =
    bestScore !== null && bestScore !== latestScore
      ? `Best so far: ${bestScore}. Latest: ${latestScore}.`
      : `Latest signal: ${latestScore}.`;
  return {
    h1: "Where you left off.",
    intro: `${totalIdeas} ${totalIdeas === 1 ? "idea" : "ideas"} in your workbench. ${bestLine}`,
  };
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 2026-04 route split:
  //   - Saved / Watchlist → /watchlist 로 이동
  //   - New This Week → /explore 로 이동
  // 이 페이지는 순수하게 "내가 제출한 아이디어" 관리용. Pro VC 라도 Watchlist 는
  // 별도 경로에서 관리함.
  const [{ data: rawIdeas }, { data: rawAi }] = await Promise.all([
    supabase
      .from("idea_submissions")
      .select(`
        id, category, target_user, description, created_at, stage, is_private, save_count,
        insight_reports (viability_score, saturation_level, trend_direction, similar_count, summary)
      `)
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("analysis_reports")
      .select("submission_id, viability_score"),
  ]);

  const ideas = (rawIdeas ?? []) as unknown as Idea[];
  const hasIdeas = ideas.length > 0;

  // submission_id → AI 점수 맵 (O(1) 조회)
  const aiScoreBySubmission = new Map<string, number>();
  for (const row of rawAi ?? []) {
    if (row.submission_id && typeof row.viability_score === "number") {
      aiScoreBySubmission.set(row.submission_id, row.viability_score);
    }
  }

  const hasReport = ideas.some((i) => !!getReport(i));
  const firstReportIdeaId = ideas.find((i) => !!getReport(i))?.id
    ?? ideas[0]?.id
    ?? null;

  const items = ideas.map((i) => toGridItem(i, aiScoreBySubmission.get(i.id) ?? null));

  // ── 개인화 섹션용 파생 데이터 ──────────────────────────────────────
  // 2026-04 identity split: 대시보드는 "내 작업대(workbench)" — TIME 축을 1등
  // 시그널로 쓴다. 점수 1등이 아니라 "가장 최근에 건드린 것" 을 앞세워서
  // What-now 프롬프트로 동작하도록.
  const scored = items.filter((r) => r.viability_score !== null);

  // 1) 최신 제출 — "What now" 히어로 대상. items 는 이미 created_at desc 정렬됨.
  const latestItem = items[0] ?? null;
  const latestDaysAgo = latestItem
    ? Math.floor(
        (Date.now() - new Date(latestItem.created_at).getTime()) / (1000 * 60 * 60 * 24)
      )
    : null;

  // 2) 작업대 통계 — "내 작업 상태" 중심.
  // 2026-04 layout: 우측 rail 제거하고 hero 위 가로 strip 으로 압축.
  // "Strong signals: 0" 대신 "Best signal: N → idea" 으로 motivation 살림.
  const bestItem =
    scored.length > 0
      ? scored.reduce((best, cur) =>
          (cur.viability_score ?? 0) > (best.viability_score ?? 0) ? cur : best
        )
      : null;
  const uniqueCategories = new Set(items.map((i) => i.category));

  // Dynamic 헤드라인 — 매일 다른 정보로 시작.
  const hero = getHeroCopy({
    hasIdeas,
    totalIdeas: ideas.length,
    latestItem,
    latestDaysAgo,
    bestScore: bestItem?.viability_score ?? null,
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Editorial header */}
      <div className="flex items-center gap-4 mb-6">
        <span
          className="text-[15px] font-medium tracking-[0.08em] uppercase"
          style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
        >
          Your Desk
        </span>
        <span className="flex-1 h-px" style={{ background: "var(--t-border-subtle)" }} />
        {hasIdeas && (
          <span
            className="text-[15px] font-medium tracking-[0.06em] uppercase shrink-0"
            style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
          >
            {ideas.length} total
          </span>
        )}
      </div>

      {/* H1 + primary CTA — Pro 는 watchlist-centric 톤, 그외는 founder-centric */}
      <div className="flex items-start justify-between gap-8 mb-4 flex-wrap">
        <h1
          style={{
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: "clamp(2.5rem, 5vw, 4rem)",
            lineHeight: 1.02,
            letterSpacing: "-0.03em",
            color: "var(--text-primary)",
          }}
        >
          {hero.h1}
        </h1>
        <Link
          href="/submit"
          className="group inline-flex items-center gap-2 mt-4 text-[15px] font-medium tracking-[0.08em] uppercase transition-opacity hover:opacity-70 shrink-0"
          style={{ fontFamily: DISPLAY, color: "var(--accent)" }}
        >
          Submit idea
          <ArrowRight
            className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1"
            strokeWidth={2}
          />
        </Link>
      </div>

      <p
        className="text-[15px] leading-[1.6] mb-8 max-w-2xl"
        style={{ color: "var(--text-secondary)" }}
      >
        {hero.intro}
      </p>

      {/* Onboarding checklist — full width above the main grid */}
      <OnboardingChecklist
        hasIdeas={hasIdeas}
        hasReport={hasReport}
        firstIdeaId={firstReportIdeaId}
      />

      {/* Empty state — when no ideas at all, skip the rest */}
      {!hasIdeas && <EmptyState />}

      {/* 2026-04 layout: Rail 제거, 풀폭 단일 컬럼.
          Workbench stats 는 hero 위 가로 strip 으로 압축. Recent 는 IdeaGrid 의
          sort=Newest 로 흡수. Quick actions 는 사이드바와 중복이라 제거. */}
      {hasIdeas && (
        <>
          <WorkbenchStrip
            latestDaysAgo={latestDaysAgo}
            totalIdeas={items.length}
            scoredIdeas={scored.length}
            bestItem={bestItem}
            uniqueCategories={uniqueCategories.size}
          />

          {latestItem && (
            <LatestSignalHero item={latestItem} daysAgo={latestDaysAgo ?? 0} />
          )}

          <section aria-label="All my ideas">
            <div className="flex items-center gap-4 mb-5">
              <span
                className="text-[13px] font-medium tracking-[0.08em] uppercase"
                style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
              >
                All my ideas
              </span>
              <span className="flex-1 h-px" style={{ background: "var(--t-border-subtle)" }} />
            </div>
            <IdeaGrid items={items} highlightId={latestItem?.id ?? null} />
          </section>
        </>
      )}

      {/* Bottom secondary navigation */}
      {hasIdeas && (
        <div
          className="mt-16 pt-8 border-t flex flex-wrap items-center justify-between gap-4"
          style={{ borderColor: "var(--t-border-subtle)" }}
        >
          <span
            className="text-[15px] font-medium tracking-[0.08em] uppercase"
            style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
          >
            Keep going
          </span>
          <div className="flex items-center gap-6 flex-wrap">
            <Link
              href="/explore"
              className="group inline-flex items-center gap-2 text-[15px] font-medium tracking-[0.08em] uppercase transition-opacity hover:opacity-70"
              style={{ fontFamily: DISPLAY, color: "var(--text-secondary)" }}
            >
              Explore the market
              <ArrowRight
                className="w-3 h-3 transition-transform group-hover:translate-x-1"
                strokeWidth={2}
              />
            </Link>
            {ideas.length >= 2 && (
              <>
                <span aria-hidden style={{ color: "var(--t-border-bright)" }}>·</span>
                <Link
                  href="/compare"
                  className="group inline-flex items-center gap-2 text-[15px] font-medium tracking-[0.08em] uppercase transition-opacity hover:opacity-70"
                  style={{ fontFamily: DISPLAY, color: "var(--text-secondary)" }}
                >
                  Compare up to 3 ideas
                  <ArrowRight
                    className="w-3 h-3 transition-transform group-hover:translate-x-1"
                    strokeWidth={2}
                  />
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── LatestSignalHero — "What now" 프롬프트 ─────────────────────────────
// 점수 1등이 아니라 "가장 최근에 건드린 아이디어" 를 앞세운다.
// 3가지 상태로 카피 + CTA 가 바뀜:
//   - pending: 분석 중
//   - fresh   (< 14일): "Your latest signal" + 리포트 열기
//   - stale   (≥ 14일): "Time for another angle?" + Iterate (re-submit)
function LatestSignalHero({ item, daysAgo }: { item: IdeaGridItem; daysAgo: number }) {
  const theme = getCategoryTheme(item.category);
  const hasScore = item.viability_score !== null;
  const pending = item.status === "analyzing" || !hasScore;
  const isStale = !pending && daysAgo >= 14;
  const color = scoreColor(item.viability_score ?? null);
  const verdict = verdictLabel(item.viability_score ?? null);
  const watchers = item.save_count ?? 0;

  const timeLabel =
    daysAgo === 0 ? "Today" : daysAgo === 1 ? "Yesterday" : `${daysAgo} days ago`;

  const kicker = pending
    ? "Analyzing now"
    : isStale
    ? "Your last signal"
    : "Your latest signal";

  const quote = pending
    ? "Analysis underway."
    : isStale
    ? "Time for another angle?"
    : `${verdict}.`;

  const cta = pending
    ? { label: "Check progress", href: `/ideas/${item.id}` }
    : isStale
    ? { label: "Iterate on this", href: `/submit?from=${item.id}` }
    : { label: "Open report", href: `/ideas/${item.id}` };

  return (
    <section
      aria-label="Your latest signal"
      className="mb-14 border-t border-b"
      style={{ borderColor: "var(--t-border-subtle)" }}
    >
      {/* Kicker row — 좌: 섹션 라벨 + 경과 시간, 우: watchers + 카테고리
          Watchers 를 카테고리와 쌍으로 두어 "시간 + 관심" = 내 아이디어의 맥락 */}
      <div
        className="flex items-center justify-between py-3.5 border-b"
        style={{ borderColor: "var(--t-border-subtle)" }}
      >
        <span
          className="text-[11.5px] font-medium tracking-[0.14em] uppercase"
          style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
        >
          {kicker} · {timeLabel}
        </span>
        <span className="inline-flex items-center gap-4">
          {watchers > 0 && (
            <span
              className="inline-flex items-center gap-2 text-[11.5px] font-medium tracking-[0.14em] uppercase"
              style={{ fontFamily: DISPLAY, color: "#ef4444" }}
              title={`${watchers} ${watchers === 1 ? "investor" : "investors"} watching this idea`}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "#ef4444" }}
                aria-hidden
              />
              {watchers} watching
            </span>
          )}
          <span
            className="inline-flex items-center gap-2 text-[11.5px] font-medium tracking-[0.14em] uppercase"
            style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: theme.accent }}
              aria-hidden
            />
            {item.category}
          </span>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-x-14 gap-y-8 py-12 md:py-14">
        {/* 좌: 스코어 또는 pending 인디케이터 */}
        <div className="flex flex-col">
          {pending ? (
            <>
              <span
                className="leading-[0.9]"
                style={{
                  fontFamily: SERIF,
                  fontStyle: "italic",
                  fontWeight: 400,
                  fontSize: "clamp(3rem, 6vw, 4.5rem)",
                  letterSpacing: "-0.03em",
                  color: "var(--text-tertiary)",
                }}
              >
                …
              </span>
              <span
                className="mt-4 text-[10.5px] font-medium tracking-[0.18em] uppercase"
                style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
              >
                Scoring in progress
              </span>
            </>
          ) : (
            <>
              <span
                className="tabular-nums leading-[0.8]"
                style={{
                  fontFamily: SERIF,
                  fontWeight: 900,
                  fontSize: "clamp(5rem, 10vw, 7.5rem)",
                  letterSpacing: "-0.055em",
                  color,
                }}
              >
                {item.viability_score}
              </span>
              <span
                className="mt-4 text-[10.5px] font-medium tracking-[0.18em] uppercase"
                style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
              >
                Signal · of 100
              </span>
            </>
          )}
        </div>

        {/* 우: 편집자 본문 */}
        <div className="min-w-0 self-center">
          <p
            className="leading-[1.1] mb-6"
            style={{
              fontFamily: SERIF,
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: "clamp(1.5rem, 2.8vw, 2.1rem)",
              letterSpacing: "-0.015em",
              color: "var(--text-primary)",
            }}
          >
            &ldquo;{quote}&rdquo;
          </p>
          <p
            className="mb-3 truncate"
            style={{
              fontFamily: SERIF,
              fontWeight: 600,
              fontSize: "1.05rem",
              letterSpacing: "-0.005em",
              color: "var(--text-primary)",
            }}
          >
            For {item.target_user}
          </p>
          <p
            className="text-[14.5px] leading-[1.65] line-clamp-3 max-w-xl mb-8"
            style={{ color: "var(--text-secondary)" }}
          >
            {item.description}
          </p>
          <Link
            href={cta.href}
            className="group inline-flex items-center gap-2 text-[12.5px] font-medium tracking-[0.16em] uppercase transition-opacity hover:opacity-70"
            style={{ fontFamily: DISPLAY, color: "var(--text-primary)" }}
          >
            {cta.label}
            <ArrowRight
              className="w-3 h-3 transition-transform group-hover:translate-x-1"
              strokeWidth={2}
            />
          </Link>
        </div>
      </div>
    </section>
  );
}


// ── WorkbenchStrip — hero 위 가로 stats strip ────────────────────────────
// 2026-04: 우측 rail (WorkbenchCard) 제거하고 가로 strip 으로 압축.
// 4 stats: Last submission · Signal reports · Best signal · Categories.
// "Strong signals: 0" 같은 빵점 표시 대신 항상 best score + 그 idea 로 link.
function WorkbenchStrip({
  latestDaysAgo,
  totalIdeas,
  scoredIdeas,
  bestItem,
  uniqueCategories,
}: {
  latestDaysAgo: number | null;
  totalIdeas: number;
  scoredIdeas: number;
  bestItem: IdeaGridItem | null;
  uniqueCategories: number;
}) {
  const timeLabel =
    latestDaysAgo === null
      ? "—"
      : latestDaysAgo === 0
      ? "Today"
      : latestDaysAgo === 1
      ? "1d ago"
      : `${latestDaysAgo}d ago`;

  const bestScore = bestItem?.viability_score ?? null;
  const bestColor = scoreColor(bestScore);

  type Cell = {
    label: string;
    value: React.ReactNode;
    valueColor?: string;
    href?: string;
  };

  const cells: Cell[] = [
    { label: "Last submission", value: timeLabel },
    {
      label: "Signal reports",
      value: (
        <>
          <span style={{ color: "var(--text-primary)" }}>{scoredIdeas}</span>
          <span style={{ color: "var(--text-tertiary)" }}> / {totalIdeas}</span>
        </>
      ),
    },
    {
      label: "Best signal",
      value: bestScore !== null ? `${bestScore}` : "—",
      valueColor: bestColor,
      href: bestItem ? `/ideas/${bestItem.id}` : undefined,
    },
    { label: "Categories tried", value: `${uniqueCategories}` },
  ];

  return (
    <section
      aria-label="Workbench summary"
      className="mb-12 border-t border-b py-5"
      style={{ borderColor: "var(--t-border-subtle)" }}
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4">
        {cells.map((cell, i) => {
          const inner = (
            <>
              <span
                className="block text-[10.5px] font-medium tracking-[0.16em] uppercase mb-2"
                style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
              >
                {cell.label}
              </span>
              <span
                className="block tabular-nums leading-none"
                style={{
                  fontFamily: SERIF,
                  fontWeight: 700,
                  fontSize: "1.5rem",
                  letterSpacing: "-0.015em",
                  color: cell.valueColor ?? "var(--text-primary)",
                }}
              >
                {cell.value}
                {cell.href && (
                  <ArrowRight
                    className="inline-block w-3.5 h-3.5 ml-1.5 align-middle transition-transform group-hover:translate-x-0.5"
                    strokeWidth={2}
                    style={{ color: "var(--text-tertiary)" }}
                  />
                )}
              </span>
            </>
          );

          if (cell.href) {
            return (
              <Link
                key={i}
                href={cell.href}
                className="group block transition-opacity hover:opacity-80"
              >
                {inner}
              </Link>
            );
          }
          return <div key={i}>{inner}</div>;
        })}
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <div
      className="py-20 border-t border-b"
      style={{ borderColor: "var(--t-border-subtle)" }}
    >
      <p
        className="text-[14px] font-medium tracking-[0.08em] uppercase mb-5"
        style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
      >
        Nothing yet
      </p>

      <p
        className="leading-[1.15] mb-5 max-w-2xl"
        style={{
          fontFamily: SERIF,
          fontStyle: "italic",
          fontWeight: 400,
          fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
          letterSpacing: "-0.01em",
          color: "var(--text-primary)",
        }}
      >
        &ldquo;Submit your first idea. Get a signal before you build.&rdquo;
      </p>

      <p
        className="text-[15px] leading-[1.75] mb-10 max-w-2xl"
        style={{ color: "var(--text-secondary)" }}
      >
        Anonymous submission, 6 specialist agents, one signal score in under two minutes. If Pro investors see potential, they reach out — before the product exists.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-10 gap-y-8 mb-10 max-w-3xl">
        {[
          { step: "01", label: "Submit", desc: "Category, target user, short description." },
          { step: "02", label: "Analyze", desc: "6 AI agents score across VC-backed axes." },
          { step: "03", label: "Get matched", desc: "Pro investors reach out via your inbox." },
        ].map((s) => (
          <div key={s.step}>
            <span
              className="tabular-nums leading-none block mb-3"
              style={{
                fontFamily: SERIF,
                fontWeight: 900,
                fontSize: "2.25rem",
                letterSpacing: "-0.03em",
                color: "var(--text-tertiary)",
              }}
            >
              {s.step}
            </span>
            <p
              className="text-[14px] font-medium tracking-[0.08em] uppercase mb-2"
              style={{ fontFamily: DISPLAY, color: "var(--text-primary)" }}
            >
              {s.label}
            </p>
            <p
              className="text-[13.5px] leading-[1.65]"
              style={{ color: "var(--text-tertiary)" }}
            >
              {s.desc}
            </p>
          </div>
        ))}
      </div>

      <Link
        href="/submit"
        className="group inline-flex items-center gap-3 text-[15px] font-medium tracking-[0.08em] uppercase transition-opacity hover:opacity-70"
        style={{ fontFamily: DISPLAY, color: "var(--accent)" }}
      >
        Submit your first idea
        <ArrowRight
          className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1"
          strokeWidth={2}
        />
      </Link>
    </div>
  );
}
