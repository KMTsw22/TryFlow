import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import { MarketBoard, type CategoryRawData } from "@/components/market/MarketBoard";
import { LiveFeed } from "@/components/market/LiveFeed";

const SERIF = "'Playfair Display', serif";
const DISPLAY = "'Oswald', sans-serif";

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
    .limit(10);

  const latest = latestData ?? [];

  return (
    <div className="min-h-screen" style={{ background: "var(--page-bg)" }}>
      {/* Editorial navbar */}
      <nav
        className="border-b px-6 h-[64px] flex items-center justify-between"
        style={{
          background: "var(--nav-bg)",
          borderColor: "var(--t-border-subtle)",
          backdropFilter: "blur(12px)",
        }}
      >
        <Link href="/" className="flex items-center gap-2.5">
          <img src="/logo.png" className="w-6 h-6" alt="Try.Wepp" />
          <span
            style={{
              fontFamily: SERIF,
              fontWeight: 900,
              fontSize: "1rem",
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
            }}
          >
            Try.Wepp
          </span>
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="text-[15px] font-medium tracking-[0.3em] uppercase transition-opacity hover:opacity-70"
            style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
          >
            Dashboard
          </Link>
          <Link
            href="/submit"
            className="inline-flex items-center gap-2 text-[15px] font-medium tracking-[0.3em] uppercase transition-opacity hover:opacity-70"
            style={{ fontFamily: DISPLAY, color: "var(--accent)" }}
          >
            Submit idea
            <span aria-hidden>→</span>
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Editorial header */}
        <div className="flex items-center gap-4 mb-6">
          <span
            className="text-[15px] font-medium tracking-[0.35em] uppercase"
            style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
          >
            Market
          </span>
          <span className="flex-1 h-px" style={{ background: "var(--t-border-subtle)" }} />
          <span
            className="text-[15px] font-medium tracking-[0.25em] uppercase"
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

        {/* Board + paywall overlay */}
        <div className="relative">
          <MarketBoard rawData={rawData} isLocked={isLocked} />

          {isLocked && (
            <div
              className="absolute inset-0 flex items-center justify-center p-6"
              style={{
                background: "linear-gradient(180deg, rgba(10,10,15,0.35) 0%, rgba(10,10,15,0.85) 60%)",
                backdropFilter: "blur(4px)",
              }}
            >
              <div className="max-w-xl w-full">
                <div className="flex items-center gap-4 mb-6">
                  <span
                    className="inline-flex items-center gap-2 text-[15px] font-medium tracking-[0.35em] uppercase"
                    style={{ fontFamily: DISPLAY, color: "var(--accent)" }}
                  >
                    <Lock className="w-3 h-3" strokeWidth={2} /> Pro Feature
                  </span>
                  <span className="flex-1 h-px" style={{ background: "var(--accent-ring)" }} />
                </div>

                <h2
                  className="mb-5"
                  style={{
                    fontFamily: SERIF,
                    fontWeight: 900,
                    fontSize: "clamp(2rem, 4vw, 3rem)",
                    lineHeight: 1.05,
                    letterSpacing: "-0.03em",
                    color: "var(--text-primary)",
                  }}
                >
                  Unlock the full market.
                </h2>

                <p
                  className="text-[15px] leading-[1.7] mb-8"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Every category&apos;s trend direction, saturation, and opportunity signal &mdash; refreshed in real time. Compare across time ranges, drill into submissions, and watch newcomers land in real time.
                </p>

                <Link
                  href="/pricing"
                  className="group inline-flex items-center gap-3 text-[15px] font-medium tracking-[0.35em] uppercase transition-opacity hover:opacity-70"
                  style={{ fontFamily: DISPLAY, color: "var(--accent)" }}
                >
                  Upgrade to Pro
                  <ArrowRight
                    className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1"
                    strokeWidth={2}
                  />
                </Link>

                <p
                  className="mt-5 text-[14px] font-medium tracking-[0.3em] uppercase"
                  style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
                >
                  7-day free trial · Cancel anytime
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Live submissions feed */}
        {!isLocked && latest.length > 0 && (
          <div className="mt-16">
            <LiveFeed items={latest} />
          </div>
        )}
      </div>
    </div>
  );
}
