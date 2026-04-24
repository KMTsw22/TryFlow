import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Lock, Sparkles } from "lucide-react";
import { MarketBoard, type CategoryRawData } from "@/components/market/MarketBoard";
import { LiveFeed } from "@/components/market/LiveFeed";
import { TopBar } from "@/components/layout/TopBar";
import { IdeaCard, type IdeaCardData } from "@/components/ideas/IdeaCard";

const SERIF = "'Fraunces', serif";
const DISPLAY = "'Inter', sans-serif";

const CATEGORIES = [
  "SaaS / B2B", "Consumer App", "Marketplace", "Dev Tools",
  "Health & Wellness", "Education", "Fintech",
  "E-commerce", "Hardware",
];

export default async function ExplorePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/explore");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("plan")
    .eq("id", user.id)
    .maybeSingle();

  const isLocked = profile?.plan !== "pro";

  const { data: allRows } = await supabase
    .from("idea_submissions")
    .select("category, created_at, insight_reports (viability_score)")
    .eq("is_private", false);

  type Row = {
    category: string;
    created_at: string;
    insight_reports:
      | { viability_score: number | null }
      | { viability_score: number | null }[]
      | null;
  };
  const rows = (allRows ?? []) as unknown as Row[];

  function pickScore(r: Row): number | null {
    const ir = r.insight_reports;
    if (!ir) return null;
    if (Array.isArray(ir)) return ir[0]?.viability_score ?? null;
    return ir.viability_score ?? null;
  }

  const now = new Date();
  const msInDay = 24 * 60 * 60 * 1000;

  const rawData: CategoryRawData[] = CATEGORIES.map((cat) => {
    const daily60 = Array(60).fill(0) as number[];
    let allTime = 0;
    let scoreSum = 0;
    let scoreSample = 0;
    for (const r of rows) {
      if (r.category !== cat) continue;
      allTime++;
      const age = Math.floor((now.getTime() - new Date(r.created_at).getTime()) / msInDay);
      if (age >= 0 && age < 60) {
        daily60[59 - age]++;
      }
      const score = pickScore(r);
      if (score !== null && score !== undefined) {
        scoreSum += score;
        scoreSample++;
      }
    }
    const avgScore = scoreSample > 0 ? Math.round(scoreSum / scoreSample) : null;
    return { category: cat, daily60, allTime, avgScore, scoreSample };
  });

  const { data: latestData } = await supabase
    .from("idea_submissions")
    .select("id, category, target_user, description, created_at")
    .eq("is_private", false)
    .order("created_at", { ascending: false })
    .limit(6);

  const latest = latestData ?? [];

  // ── New This Week — 지난 7일 공개 아이디어(다른 사람) 중 최신 6개 ────────
  // 교수님/VC 피드백: VC 멘탈 모델상 "신규 매물" 은 Market 소속.
  // /explore 는 이미 Pro-only 이므로 plan 체크 불필요.
  const sevenDaysAgoISO = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  type NewWeekRow = {
    id: string;
    category: string;
    target_user: string;
    description: string;
    created_at: string;
    stage: string | null;
    save_count: number | null;
    insight_reports:
      | {
          viability_score: number | null;
          saturation_level: string | null;
          trend_direction: string | null;
          summary: string | null;
        }
      | null
      | Array<{
          viability_score: number | null;
          saturation_level: string | null;
          trend_direction: string | null;
          summary: string | null;
        }>;
  };

  let newThisWeekItems: IdeaCardData[] = [];
  const newWeekSavedIdSet = new Set<string>();

  if (!isLocked) {
    const { data: newWeekData } = await supabase
      .from("idea_submissions")
      .select(`
        id, category, target_user, description, created_at, stage, save_count,
        insight_reports (viability_score, saturation_level, trend_direction, summary)
      `)
      .eq("is_private", false)
      .neq("user_id", user.id)
      .gte("created_at", sevenDaysAgoISO)
      .order("created_at", { ascending: false })
      .limit(6);

    const rowsNew = (newWeekData ?? []) as unknown as NewWeekRow[];
    newThisWeekItems = rowsNew.map((i) => {
      const r = Array.isArray(i.insight_reports)
        ? i.insight_reports[0] ?? null
        : i.insight_reports;
      return {
        id: i.id,
        category: i.category,
        target_user: i.target_user,
        description: i.description,
        created_at: i.created_at,
        stage: i.stage,
        viability_score: r?.viability_score ?? null,
        trend_direction: r?.trend_direction ?? null,
        saturation_level: r?.saturation_level ?? null,
        summary: r?.summary ?? null,
        save_count: i.save_count ?? 0,
      } as IdeaCardData;
    });

    if (newThisWeekItems.length > 0) {
      const { data: saved } = await supabase
        .from("saved_ideas")
        .select("submission_id")
        .eq("user_id", user.id)
        .in("submission_id", newThisWeekItems.map((i) => i.id));
      for (const s of saved ?? []) {
        if (typeof s.submission_id === "string") newWeekSavedIdSet.add(s.submission_id);
      }
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--page-bg)" }}>
      <TopBar
        userName={user.user_metadata?.full_name ?? user.email ?? "User"}
        userImage={user.user_metadata?.avatar_url}
      />
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Editorial header */}
        <div className="flex items-center gap-4 mb-6">
          <span
            className="text-[15px] font-medium tracking-[0.08em] uppercase"
            style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
          >
            Market
          </span>
          <span className="flex-1 h-px" style={{ background: "var(--t-border-subtle)" }} />
          <span
            className="text-[15px] font-medium tracking-[0.06em] uppercase"
            style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
          >
            9 categories · live
          </span>
        </div>

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
          Where founders bet.
        </h1>

        <div
          className="text-[17px] leading-[1.6] mb-12 space-y-1"
          style={{ color: "var(--text-secondary)" }}
        >
          <p>Volume, momentum, and average viability across nine categories.</p>
          <p>Every number reflects anonymous submissions on this platform &mdash; not real-world market data.</p>
        </div>

        {/* Board — preview for Free/Plus (signals visible, table muted), full for Pro */}
        <MarketBoard rawData={rawData} isLocked={isLocked} />

        {/* 2026-04 paywall softening:
            이전엔 전체 블러 오버레이 → Free/Plus 에게 "못 쓴다" 인상.
            새 패턴: Signal strip 은 풀 공개 (제품의 모양을 보여줌), Category
            breakdown 만 dim 처리, 그 아래에 에디토리얼 CTA 로 전환 유도. */}
        {isLocked && (
          <section
            aria-label="Upgrade to Pro"
            className="mt-6 border-t border-b py-14"
            style={{ borderColor: "var(--t-border-subtle)" }}
          >
            <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-x-12 gap-y-6 items-center">
              {/* 좌: Pro 인디케이터 */}
              <div className="flex flex-col">
                <span
                  className="inline-flex items-center gap-2 text-[11.5px] font-medium tracking-[0.14em] uppercase"
                  style={{ fontFamily: DISPLAY, color: "var(--accent)" }}
                >
                  <Lock className="w-3 h-3" strokeWidth={2} />
                  Pro access
                </span>
                <span
                  className="mt-4 tabular-nums leading-[0.9]"
                  style={{
                    fontFamily: SERIF,
                    fontWeight: 900,
                    fontSize: "clamp(3.5rem, 7vw, 5rem)",
                    letterSpacing: "-0.04em",
                    color: "var(--accent)",
                  }}
                >
                  $20
                </span>
                <span
                  className="mt-2 text-[11px] font-medium tracking-[0.14em] uppercase"
                  style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
                >
                  / month · 7-day trial
                </span>
              </div>

              {/* 중앙: 편집자 본문 */}
              <div className="min-w-0">
                <h2
                  className="mb-5 leading-[1.05]"
                  style={{
                    fontFamily: SERIF,
                    fontWeight: 900,
                    fontSize: "clamp(1.75rem, 3.2vw, 2.5rem)",
                    letterSpacing: "-0.025em",
                    color: "var(--text-primary)",
                  }}
                >
                  The signals are the preview. The deal flow is the product.
                </h2>
                <p
                  className="text-[15px] leading-[1.7] max-w-2xl"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Above: three live market signals, anyone can see.
                  Pro unlocks the category breakdown, direct access to every
                  submission, the new-this-week feed, and the ability to
                  contact founders — before the product exists.
                </p>
              </div>

              {/* 우: CTA */}
              <Link
                href="/pricing"
                className="group inline-flex items-center gap-3 text-[13px] font-medium tracking-[0.16em] uppercase transition-opacity hover:opacity-70 shrink-0"
                style={{ fontFamily: DISPLAY, color: "var(--accent)" }}
              >
                Upgrade to Pro
                <ArrowRight
                  className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1"
                  strokeWidth={2}
                />
              </Link>
            </div>
          </section>
        )}

        {/* New This Week — MarketBoard 아래, LiveFeed 위.
            카테고리 먼저 파악한 뒤 "이번 주 볼만한 스코어드 6개" 를 actionable 카드로.
            VC의 리뷰 큐 역할. LiveFeed 와는 시각적으로 차별화됨 (풀 카드 vs 컴팩트 row).
            Pro 전용 라우트라 locked 체크는 위에서 이미 처리됨. */}
        {!isLocked && newThisWeekItems.length > 0 && (
          <section aria-label="New this week" className="mt-16">
            <div className="flex items-center gap-4 mb-6">
              <Sparkles className="w-3.5 h-3.5" style={{ color: "var(--accent)" }} strokeWidth={2} />
              <span
                className="text-[13px] font-medium tracking-[0.08em] uppercase"
                style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
              >
                New this week
              </span>
              <span className="flex-1 h-px" style={{ background: "var(--t-border-subtle)" }} />
              <span
                className="text-[12px] font-medium tracking-[0.06em] uppercase shrink-0"
                style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
              >
                {newThisWeekItems.length} new
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {newThisWeekItems.map((item) => (
                <IdeaCard
                  key={item.id}
                  idea={item}
                  isSaved={newWeekSavedIdSet.has(item.id)}
                  showCategory
                />
              ))}
            </div>
          </section>
        )}

        {/* Live submissions feed — 컴팩트 ledger */}
        {!isLocked && latest.length > 0 && (
          <div className="mt-16">
            <LiveFeed items={latest} />
          </div>
        )}
      </div>
    </div>
  );
}
