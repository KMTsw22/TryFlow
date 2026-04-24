import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { IdeaCard } from "@/components/ideas/IdeaCard";
import { CATEGORIES } from "@/lib/categories";
import {
  AverageViabilityHero,
  MarketHealthStrip,
  TopInCategory,
} from "@/components/market/CategoryInsightPanel";
import { TopBar } from "@/components/layout/TopBar";

const SERIF = "'Fraunces', serif";
const DISPLAY = "'Inter', sans-serif";

interface InsightReport {
  viability_score: number;
  saturation_level: string;
  trend_direction: string;
  summary: string;
}

interface AnalysisReport {
  viability_score: number;
}

interface SubmitterProfile {
  allow_contact: boolean | null;
}

interface IdeaRow {
  id: string;
  category: string;
  target_user: string;
  description: string;
  created_at: string;
  user_id: string | null;
  stage: string | null;
  insight_reports: InsightReport | InsightReport[] | null;
  analysis_reports: AnalysisReport | AnalysisReport[] | null;
  user_profiles: SubmitterProfile | SubmitterProfile[] | null;
}

function getInsight(idea: IdeaRow): InsightReport | null {
  if (!idea.insight_reports) return null;
  if (Array.isArray(idea.insight_reports)) return idea.insight_reports[0] ?? null;
  return idea.insight_reports;
}

function getAiScore(idea: IdeaRow): number | null {
  if (!idea.analysis_reports) return null;
  const r = Array.isArray(idea.analysis_reports) ? idea.analysis_reports[0] : idea.analysis_reports;
  return r?.viability_score ?? null;
}

function getContactOpen(idea: IdeaRow): boolean | null {
  if (!idea.user_id) return null; // anonymous submission
  if (!idea.user_profiles) return null;
  const p = Array.isArray(idea.user_profiles) ? idea.user_profiles[0] : idea.user_profiles;
  if (!p || p.allow_contact === null || p.allow_contact === undefined) return null;
  return !!p.allow_contact;
}

function toCardData(idea: IdeaRow) {
  const insight = getInsight(idea);
  const aiScore = getAiScore(idea);
  return {
    id: idea.id,
    category: idea.category,
    target_user: idea.target_user,
    description: idea.description,
    created_at: idea.created_at,
    stage: idea.stage,
    viability_score: aiScore ?? insight?.viability_score ?? null,
    trend_direction: insight?.trend_direction ?? null,
    saturation_level: insight?.saturation_level ?? null,
    summary: insight?.summary ?? null,
    contactOpen: getContactOpen(idea),
  };
}

// 2026-04: 옛 keyword extraction (STOPWORDS / extractKeywords) 제거 — VC 의사결정에
// 도움 안 되는 단어 빈도 카운트라 인사이트 패널 재설계와 함께 폐기됨.

export default async function CategoryIdeasPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ open?: string }>;
}) {
  const { category: rawCategory } = await params;
  const { open } = await searchParams;
  const onlyOpen = open === "1";
  const category = decodeURIComponent(rawCategory);

  if (!CATEGORIES.includes(category)) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/explore");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("plan")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.plan !== "pro") redirect("/pricing");

  const { data, error } = await supabase
    .from("idea_submissions")
    .select(`
      id, category, target_user, description, created_at, user_id, stage,
      insight_reports (viability_score, saturation_level, trend_direction, summary),
      analysis_reports (viability_score)
    `)
    .eq("category", category)
    .eq("is_private", false)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Category ideas query failed:", error);
  }

  const ideasBase = (data ?? []) as unknown as Omit<IdeaRow, "user_profiles">[];

  // Fetch submitter profiles separately (no FK between idea_submissions.user_id
  // and user_profiles.id — both only share a FK to auth.users).
  const submitterIds = Array.from(
    new Set(ideasBase.map((i) => i.user_id).filter((x): x is string => !!x)),
  );

  const profileMap = new Map<string, { allow_contact: boolean | null }>();
  if (submitterIds.length > 0) {
    const { data: profiles } = await supabase
      .from("user_profiles")
      .select("id, allow_contact")
      .in("id", submitterIds);
    for (const p of profiles ?? []) {
      profileMap.set(p.id as string, { allow_contact: p.allow_contact ?? null });
    }
  }

  // 어떤 아이디어가 이미 저장(❤️)됐는지 조회 — 카드 하트 채움 상태 결정
  const ideaIds = ideasBase.map((i) => i.id);
  const savedIdSet = new Set<string>();
  if (ideaIds.length > 0) {
    const { data: saved } = await supabase
      .from("saved_ideas")
      .select("submission_id")
      .eq("user_id", user.id)
      .in("submission_id", ideaIds);
    for (const s of saved ?? []) {
      if (typeof s.submission_id === "string") savedIdSet.add(s.submission_id);
    }
  }

  const allIdeas: IdeaRow[] = ideasBase.map((i) => ({
    ...i,
    user_profiles: i.user_id
      ? profileMap.get(i.user_id) ?? null
      : null,
  }));

  // "Open only" 필터 — VC 가 연락 가능한 founder 만 보고 싶을 때
  const ideas = onlyOpen
    ? allIdeas.filter((i) => getContactOpen(i) === true)
    : allIdeas;
  const openCount = allIdeas.filter((i) => getContactOpen(i) === true).length;

  // ── Compute insight panel data ────────────────────────────────────────────
  // 2026-04 redesign: VC 가 카테고리 들어왔을 때 actionable 한 정보만.
  //   • Top 3 by viability score → 바로 클릭 가능한 베스트 후보
  //   • Market Health (avg / saturation / trend / total) → 컨텍스트
  // 기존 weekly chart + top keywords 는 폐기 (VC 의사결정에 도움 안 됨).

  type ScoredIdea = { id: string; category: string; target_user: string; viability_score: number };
  const scoredIdeas: ScoredIdea[] = ideas
    .map((i) => {
      const score = getAiScore(i) ?? getInsight(i)?.viability_score ?? null;
      if (score === null) return null;
      return {
        id: i.id,
        category: i.category,
        target_user: i.target_user,
        viability_score: score,
      };
    })
    .filter((x): x is ScoredIdea => x !== null);

  // Top 5 by score (descending) — 스캔하기 편하면서 충분한 후보 보기
  const topIdeas = [...scoredIdeas]
    .sort((a, b) => b.viability_score - a.viability_score)
    .slice(0, 5);

  // Avg viability — only across ideas that actually have a score
  const avgScore =
    scoredIdeas.length > 0
      ? Math.round(
          scoredIdeas.reduce((s, x) => s + x.viability_score, 0) / scoredIdeas.length
        )
      : null;

  // Top score — 카테고리 최고 점수 (VC benchmark)
  const topScore =
    scoredIdeas.length > 0 ? Math.max(...scoredIdeas.map((x) => x.viability_score)) : null;

  // Fresh count — 최근 7일 이내 제출 (activity signal)
  const sevenDaysAgoMs = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const newThisWeekCount = ideas.filter(
    (i) => new Date(i.created_at).getTime() > sevenDaysAgoMs
  ).length;

  // Modal saturation / trend — most common value across category reports.
  function modalOf<T extends string>(values: T[]): T | null {
    if (values.length === 0) return null;
    const counts = new Map<T, number>();
    for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
    let best: T | null = null;
    let bestCount = 0;
    for (const [v, c] of counts) {
      if (c > bestCount) {
        best = v;
        bestCount = c;
      }
    }
    return best;
  }
  const saturationValues = ideas
    .map((i) => getInsight(i)?.saturation_level)
    .filter((x): x is "Low" | "Medium" | "High" =>
      x === "Low" || x === "Medium" || x === "High"
    );
  const trendValues = ideas
    .map((i) => getInsight(i)?.trend_direction)
    .filter((x): x is "Rising" | "Stable" | "Declining" =>
      x === "Rising" || x === "Stable" || x === "Declining"
    );
  const modalSaturation = modalOf(saturationValues);
  const modalTrend = modalOf(trendValues);

  return (
    <div className="min-h-screen" style={{ background: "var(--page-bg)" }}>
      <TopBar
        userName={user?.user_metadata?.full_name ?? user?.email ?? "User"}
        userImage={user?.user_metadata?.avatar_url}
      />
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Back link */}
        <Link
          href="/explore"
          className="inline-flex items-center gap-1.5 text-[15px] font-medium tracking-[0.06em] uppercase mb-10 transition-colors hover:text-[color:var(--text-primary)]"
          style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
        >
          <ArrowLeft className="w-3 h-3" /> Back to Market
        </Link>

        {/* Full-width kicker — "Category · Market ──── N ideas" 가 페이지 실제 오른쪽 끝까지 */}
        <div className="flex items-center gap-4 mb-6">
          <span
            className="text-[15px] font-medium tracking-[0.08em] uppercase"
            style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
          >
            Category · Market
          </span>
          <span className="flex-1 h-px" style={{ background: "var(--t-border-subtle)" }} />
          <span
            className="text-[15px] font-medium tracking-[0.06em] uppercase"
            style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
          >
            {ideas.length} {ideas.length === 1 ? "idea" : "ideas"}
          </span>
        </div>

        {/* Header 2-column: 좌측 타이틀+인트로, 우측 Average Viability hero.
            카테고리 정체성 + 점수가 매거진 커버처럼 좌우 대조로 배치. */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] items-end gap-x-12 gap-y-8 mb-10">
          <div className="min-w-0">
            <h1
              className="mb-4"
              style={{
                fontFamily: SERIF,
                fontWeight: 900,
                fontSize: "clamp(2.5rem, 5vw, 4rem)",
                lineHeight: 1.02,
                letterSpacing: "-0.03em",
                color: "var(--text-primary)",
              }}
            >
              {category}.
            </h1>

            <div
              className="text-[17px] leading-[1.6] space-y-1"
              style={{ color: "var(--text-secondary)" }}
            >
              <p>Anonymous submissions in this category.</p>
              <p>Top scoring ideas, market health at a glance, and every live idea below.</p>
            </div>
          </div>

          {/* Average Viability hero — 헤더 우측 */}
          {ideas.length > 0 && <AverageViabilityHero avgScore={avgScore} />}
        </div>

        {/* Market Health Strip — 4 메트릭 가로 한 줄, 전체 폭 */}
        {ideas.length > 0 && (
          <div className="mb-14">
            <MarketHealthStrip
              modalSaturation={modalSaturation}
              modalTrend={modalTrend}
              topScore={topScore}
              newThisWeekCount={newThisWeekCount}
            />
          </div>
        )}

        {/* Top in Category — 전체 폭, 메인 액션 섹션 */}
        {ideas.length > 0 && topIdeas.length > 0 && (
          <div className="mb-14">
            <TopInCategory topIdeas={topIdeas} />
          </div>
        )}

        {/* Ideas list */}
        {ideas.length === 0 ? (
          <div
            className="py-20 border-t border-b"
            style={{ borderColor: "var(--t-border-subtle)" }}
          >
            <p
              className="text-[15px] font-medium tracking-[0.08em] uppercase mb-5"
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
              &ldquo;No {category} ideas yet. Be the first to stake a claim.&rdquo;
            </p>
            <Link
              href="/submit"
              className="group inline-flex items-center gap-3 text-[15px] font-medium tracking-[0.08em] uppercase transition-opacity hover:opacity-70"
              style={{ fontFamily: DISPLAY, color: "var(--accent)" }}
            >
              Submit the first idea
              <ArrowRight
                className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1"
                strokeWidth={2}
              />
            </Link>
          </div>
        ) : (
          <section aria-label="All submissions">
            <div className="flex items-center gap-4 mb-5 flex-wrap">
              <span
                className="text-[15px] font-medium tracking-[0.08em] uppercase"
                style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
              >
                All Submissions
              </span>
              <span
                className="flex-1 h-px"
                style={{ background: "var(--t-border-subtle)" }}
              />
              {/* Filter toggle — "Open only" for VC */}
              {openCount > 0 && (
                <Link
                  href={
                    onlyOpen
                      ? `/explore/${encodeURIComponent(category)}`
                      : `/explore/${encodeURIComponent(category)}?open=1`
                  }
                  className="inline-flex items-center gap-2 px-3 py-1 text-[11.5px] font-bold tracking-[0.08em] uppercase transition-colors shrink-0"
                  style={{
                    fontFamily: DISPLAY,
                    color: onlyOpen ? "var(--signal-success)" : "var(--text-tertiary)",
                    background: onlyOpen ? "rgba(16, 185, 129, 0.10)" : "transparent",
                    border: onlyOpen
                      ? "1px solid rgba(16, 185, 129, 0.3)"
                      : "1px solid var(--t-border-card)",
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      background: onlyOpen ? "var(--signal-success)" : "var(--text-tertiary)",
                    }}
                    aria-hidden
                  />
                  {onlyOpen ? `Showing open only · ${ideas.length}` : `Open only · ${openCount}`}
                </Link>
              )}
              <span
                className="text-[13px] font-medium tracking-[0.06em] uppercase shrink-0"
                style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
              >
                Newest first
              </span>
            </div>

            {ideas.length === 0 ? (
              <p
                className="py-8 text-[14.5px] italic"
                style={{ fontFamily: SERIF, color: "var(--text-tertiary)" }}
              >
                No ideas match this filter. {onlyOpen && (
                  <Link
                    href={`/explore/${encodeURIComponent(category)}`}
                    className="underline"
                    style={{ color: "var(--accent)" }}
                  >
                    Show all
                  </Link>
                )}
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {ideas.map((idea) => (
                  <IdeaCard
                    key={idea.id}
                    idea={toCardData(idea)}
                    showCategory={false}
                    isSaved={savedIdSet.has(idea.id)}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
