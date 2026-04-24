import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ArrowRight, Heart } from "lucide-react";
import { IdeaCard, type IdeaCardData } from "@/components/ideas/IdeaCard";
import { getCategoryTheme } from "@/lib/categories";

const SERIF = "'Fraunces', serif";
const DISPLAY = "'Inter', sans-serif";

/**
 * /watchlist — 사용자가 ❤️로 저장한 아이디어 관리 페이지.
 *
 * 2026-04 route split: 이전엔 /dashboard 안의 Saved 탭이었음. VC 피드백에서
 * "Pro는 My Ideas + Watchlist 둘 다 필요" 라는 지적에 따라 독립 라우트로 분리.
 * 모든 plan 에서 하트 저장은 허용되므로 Free/Plus 도 이 페이지 접근 가능.
 */

interface Report {
  viability_score: number;
  saturation_level: string;
  trend_direction: string;
  summary: string;
}

interface SavedRow {
  created_at: string;
  idea_submissions: {
    id: string;
    category: string;
    target_user: string;
    description: string;
    created_at: string;
    stage: string | null;
    save_count: number | null;
    insight_reports: Report | Report[] | null;
  };
}

function scoreColor(score: number | null): string {
  if (score === null) return "var(--text-tertiary)";
  if (score >= 70) return "var(--signal-success)";
  if (score >= 50) return "var(--signal-warning)";
  return "var(--signal-danger)";
}

function verdictLabel(score: number | null): string {
  if (score === null) return "Pending verdict";
  if (score >= 75) return "Strong signal";
  if (score >= 60) return "Worth refining";
  if (score >= 45) return "Needs sharper angle";
  return "Weak signal";
}

export default async function WatchlistPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Pro 한정은 아님 — 하트는 모든 plan 에서 쓸 수 있으므로 Free/Plus 도 접근 가능.
  // (미들웨어가 로그인은 강제함.)
  if (!user) return null;

  // 7일 컷오프 — 최근 저장한 아이디어 카운트
  const sevenDaysAgoISO = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: rawSaved }, { data: rawAi }, { data: profile }] = await Promise.all([
    supabase
      .from("saved_ideas")
      .select(`
        created_at,
        idea_submissions!inner (
          id, category, target_user, description, created_at, stage, save_count,
          insight_reports (viability_score, saturation_level, trend_direction, summary)
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("analysis_reports")
      .select("submission_id, viability_score"),
    supabase
      .from("user_profiles")
      .select("plan")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  const isPro = profile?.plan === "pro";

  const aiScoreBySubmission = new Map<string, number>();
  for (const row of rawAi ?? []) {
    if (row.submission_id && typeof row.viability_score === "number") {
      aiScoreBySubmission.set(row.submission_id, row.viability_score);
    }
  }

  // saved_ideas → IdeaCardData 로 정규화
  const savedRows = (rawSaved ?? []) as unknown as SavedRow[];
  const savedItems: IdeaCardData[] = savedRows
    .map((row) => {
      const idea = row.idea_submissions;
      if (!idea) return null;
      const r = idea.insight_reports
        ? Array.isArray(idea.insight_reports)
          ? idea.insight_reports[0] ?? null
          : idea.insight_reports
        : null;
      const aiScore = aiScoreBySubmission.get(idea.id) ?? null;
      const score = aiScore ?? r?.viability_score ?? null;
      return {
        id: idea.id,
        category: idea.category,
        target_user: idea.target_user,
        description: idea.description,
        created_at: idea.created_at,
        stage: idea.stage,
        viability_score: score,
        trend_direction: r?.trend_direction ?? null,
        saturation_level: r?.saturation_level ?? null,
        summary: r?.summary ?? null,
        save_count: idea.save_count ?? 0,
      } as IdeaCardData;
    })
    .filter((x): x is IdeaCardData => x !== null);

  const hasSaved = savedItems.length > 0;

  // 2026-04 layout simplification: rail 제거하면서 stats 도 대부분 불필요해짐.
  // 남은 건 hero 용 latestSaved + 페이지 subtitle 의 addedThisWeek 뿐.
  // savedItems / savedRows 는 이미 created_at desc 정렬 → [0] 가 가장 최근.
  const latestSaved = savedItems[0] ?? null;
  const latestSavedAt = savedRows[0]?.created_at ?? null;
  const latestSavedDaysAgo = latestSavedAt
    ? Math.floor((Date.now() - new Date(latestSavedAt).getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const addedThisWeek = savedRows.filter(
    (r) => new Date(r.created_at).toISOString() >= sevenDaysAgoISO
  ).length;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Editorial kicker */}
      <div className="flex items-center gap-4 mb-6">
        <span
          className="inline-flex items-center gap-2 text-[15px] font-medium tracking-[0.08em] uppercase"
          style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
        >
          <Heart
            className="w-3 h-3"
            style={{ color: "#ef4444" }}
            fill="currentColor"
            strokeWidth={1.5}
          />
          Watchlist
        </span>
        <span className="flex-1 h-px" style={{ background: "var(--t-border-subtle)" }} />
        {hasSaved && (
          <span
            className="text-[15px] font-medium tracking-[0.06em] uppercase shrink-0"
            style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
          >
            {savedItems.length} saved
          </span>
        )}
      </div>

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
          {hasSaved ? "Your watchlist." : "Start your watchlist."}
        </h1>
        <Link
          href="/explore"
          className="group inline-flex items-center gap-2 mt-4 text-[15px] font-medium tracking-[0.08em] uppercase transition-opacity hover:opacity-70 shrink-0"
          style={{ fontFamily: DISPLAY, color: "var(--accent)" }}
        >
          Browse Market
          <ArrowRight
            className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1"
            strokeWidth={2}
          />
        </Link>
      </div>

      <p
        className="text-[15px] leading-[1.6] mb-10 max-w-2xl"
        style={{ color: "var(--text-secondary)" }}
      >
        {hasSaved
          ? `${savedItems.length} idea${savedItems.length === 1 ? "" : "s"} you're tracking${
              addedThisWeek > 0 ? ` · ${addedThisWeek} added this week` : ""
            }.`
          : "Save promising ideas as you browse the Market. They'll appear here for quick review and comparison."}
      </p>

      {/* Empty state — 아직 저장한 거 없을 때 */}
      {!hasSaved && <EmptyState isPro={isPro} />}

      {/* Saved content — 2026-04: Rail 제거, 풀폭 단일 컬럼.
          Watchlist 는 단순 컬렉션 뷰라 stats panel 무의미 (avg score 는 misleading,
          나머지는 page 상단 subtitle 에서 이미 노출됨). Quick actions 는 사이드바와
          중복이라 제거. 그리드를 풀폭으로 펴서 카드 더 많이 보이게. */}
      {hasSaved && (
        <>
          {latestSaved && (
            <RecentActivityHero
              item={latestSaved}
              daysAgo={latestSavedDaysAgo ?? 0}
            />
          )}

          <section aria-label="Saved ideas" className="mt-2">
            <div className="flex items-center gap-4 mb-5">
              <span
                className="text-[13px] font-medium tracking-[0.08em] uppercase"
                style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
              >
                All saved
              </span>
              <span className="flex-1 h-px" style={{ background: "var(--t-border-subtle)" }} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedItems.map((item) => (
                <IdeaCard key={item.id} idea={item} isSaved showCategory />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

// ── RecentActivityHero — "가장 최근에 내가 움직인 것" ──────────────────
// Dashboard 의 LatestSignalHero 와 쌍을 이룸: 거기선 내가 *만든* 최신,
// 여기선 내가 *담은* 최신. 점수 1등이 아니라 시간축으로 고른 항목.
function RecentActivityHero({
  item,
  daysAgo,
}: {
  item: IdeaCardData;
  daysAgo: number;
}) {
  const theme = getCategoryTheme(item.category);
  const hasScore = item.viability_score !== null;
  const color = scoreColor(item.viability_score ?? null);
  const verdict = verdictLabel(item.viability_score ?? null);
  const watchers = item.save_count ?? 0;

  const timeLabel =
    daysAgo === 0 ? "Today" : daysAgo === 1 ? "Yesterday" : `${daysAgo} days ago`;

  return (
    <section
      aria-label="Most recent in your watchlist"
      className="mb-14 border-t border-b"
      style={{ borderColor: "var(--t-border-subtle)" }}
    >
      {/* Kicker — 시간 축이 1등 시그널 */}
      <div
        className="flex items-center justify-between py-3.5 border-b"
        style={{ borderColor: "var(--t-border-subtle)" }}
      >
        <span
          className="text-[11.5px] font-medium tracking-[0.14em] uppercase"
          style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
        >
          Most recently saved · {timeLabel}
        </span>
        <span className="inline-flex items-center gap-4">
          {watchers > 0 && (
            <span
              className="inline-flex items-center gap-2 text-[11.5px] font-medium tracking-[0.14em] uppercase"
              style={{ fontFamily: DISPLAY, color: "#ef4444" }}
              title={`${watchers} ${watchers === 1 ? "investor" : "investors"} watching`}
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
        <div className="flex flex-col">
          {hasScore ? (
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
          ) : (
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
                Report pending
              </span>
            </>
          )}
        </div>

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
            &ldquo;{hasScore ? `${verdict}.` : "Watching for a signal."}&rdquo;
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
          <div className="flex items-center gap-8 flex-wrap">
            <Link
              href={`/ideas/${item.id}`}
              className="group inline-flex items-center gap-2 text-[12.5px] font-medium tracking-[0.16em] uppercase transition-opacity hover:opacity-70"
              style={{ fontFamily: DISPLAY, color: "var(--text-primary)" }}
            >
              Open report
              <ArrowRight
                className="w-3 h-3 transition-transform group-hover:translate-x-1"
                strokeWidth={2}
              />
            </Link>
            <Link
              href={`/compare?pick=${item.id}`}
              className="group inline-flex items-center gap-2 text-[12.5px] font-medium tracking-[0.16em] uppercase transition-opacity hover:opacity-70"
              style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
            >
              Compare with yours
              <ArrowRight
                className="w-3 h-3 transition-transform group-hover:translate-x-1"
                strokeWidth={2}
              />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── EmptyState — 저장한 거 하나도 없을 때 ────────────────────────────────
// Pro(investor) vs non-Pro(founder) 메시지가 달라야 함. Founder 에게
// "Browse Market" 은 기만이지 — 그들은 애초에 Market 을 못 쓰니까.
function EmptyState({ isPro }: { isPro: boolean }) {
  return (
    <div
      className="py-16 border-t border-b"
      style={{ borderColor: "var(--t-border-subtle)" }}
    >
      <div className="max-w-xl">
        <Heart
          className="w-6 h-6 mb-5"
          style={{ color: "var(--text-tertiary)" }}
          strokeWidth={1.5}
        />

        {isPro ? (
          <>
            <p
              className="leading-[1.2] mb-5"
              style={{
                fontFamily: SERIF,
                fontStyle: "italic",
                fontWeight: 400,
                fontSize: "clamp(1.35rem, 2.5vw, 1.85rem)",
                letterSpacing: "-0.01em",
                color: "var(--text-primary)",
              }}
            >
              &ldquo;Save an idea to start tracking it here.&rdquo;
            </p>
            <p
              className="text-[14.5px] leading-[1.7] mb-7"
              style={{ color: "var(--text-secondary)" }}
            >
              Browse the Market and click the heart on any idea. Watchlist is
              your private shortlist — review, compare, and reach out when the
              time is right.
            </p>
            <Link
              href="/explore"
              className="group inline-flex items-center gap-2 text-[14px] font-medium tracking-[0.08em] uppercase transition-opacity hover:opacity-70"
              style={{ fontFamily: DISPLAY, color: "var(--accent)" }}
            >
              Browse Market
              <ArrowRight
                className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1"
                strokeWidth={2}
              />
            </Link>
          </>
        ) : (
          <>
            <p
              className="leading-[1.2] mb-5"
              style={{
                fontFamily: SERIF,
                fontStyle: "italic",
                fontWeight: 400,
                fontSize: "clamp(1.35rem, 2.5vw, 1.85rem)",
                letterSpacing: "-0.01em",
                color: "var(--text-primary)",
              }}
            >
              &ldquo;Watchlist is for tracking other founders&apos; ideas.&rdquo;
            </p>
            <p
              className="text-[14.5px] leading-[1.7] mb-7"
              style={{ color: "var(--text-secondary)" }}
            >
              This space fills up when you save ideas from the Market — which
              lives behind the Pro tier. If you&apos;re here to build, your
              real work lives in My Ideas. If you&apos;re here to invest,
              unlock the Market.
            </p>
            <div className="flex items-center gap-8 flex-wrap">
              <Link
                href="/dashboard"
                className="group inline-flex items-center gap-2 text-[14px] font-medium tracking-[0.08em] uppercase transition-opacity hover:opacity-70"
                style={{ fontFamily: DISPLAY, color: "var(--text-primary)" }}
              >
                Go to My Ideas
                <ArrowRight
                  className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1"
                  strokeWidth={2}
                />
              </Link>
              <Link
                href="/pricing"
                className="group inline-flex items-center gap-2 text-[14px] font-medium tracking-[0.08em] uppercase transition-opacity hover:opacity-70"
                style={{ fontFamily: DISPLAY, color: "var(--accent)" }}
              >
                Unlock Market
                <ArrowRight
                  className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1"
                  strokeWidth={2}
                />
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
