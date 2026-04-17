import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Lock, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { MarketBoard, type CategoryRawData } from "@/components/market/MarketBoard";
import { LiveFeed } from "@/components/market/LiveFeed";

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

  // Fetch all non-private submissions with score so we can surface quality, not just volume.
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

  // ── Build per-category daily60 timeseries + score aggregates ──────────────
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

  // Fetch latest submissions for live feed (lightweight — 10 most recent)
  const { data: latestData } = await supabase
    .from("idea_submissions")
    .select("id, category, target_user, description, created_at")
    .eq("is_private", false)
    .order("created_at", { ascending: false })
    .limit(10);

  const latest = latestData ?? [];

  return (
    <div className="min-h-screen" style={{ background: "var(--page-bg)" }}>
      {/* Navbar */}
      <nav
        className="border-b px-6 h-[60px] flex items-center justify-between"
        style={{ background: "var(--nav-bg)", borderColor: "var(--t-border)", backdropFilter: "blur(12px)" }}
      >
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png" className="w-7 h-7" alt="Try.Wepp" />
          <span className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Try.Wepp</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="text-sm transition-colors"
            style={{ color: "var(--text-tertiary)" }}
          >
            Dashboard
          </Link>
          <Link
            href="/submit"
            className="inline-flex items-center gap-1.5 bg-[color:var(--accent)] text-white text-sm font-semibold px-3 h-8 hover:brightness-110 transition-all"
          >
            Submit idea
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <PageHeader
          title="Market"
          description="Where founders on TryWepp are placing bets — volume, momentum, and average viability across 9 categories. Reflects submissions on this platform, not real-world market data."
        />

        {/* Relative container so the paywall overlay can cover signal strip + table together */}
        <div className="relative">
          <MarketBoard rawData={rawData} isLocked={isLocked} />

          {/* Paywall overlay — only when locked */}
          {isLocked && (
            <div
              className="absolute inset-0 flex items-center justify-center p-6"
              style={{
                background: "linear-gradient(180deg, rgba(10,10,15,0.25) 0%, rgba(10,10,15,0.75) 60%)",
              }}
            >
              <div
                className="max-w-md w-full text-center border p-8"
                style={{
                  background: "var(--card-bg)",
                  borderColor: "var(--accent-ring)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <div
                  className="inline-flex items-center justify-center w-12 h-12 mb-4"
                  style={{ background: "var(--accent-soft)" }}
                >
                  <Lock className="w-5 h-5" style={{ color: "var(--accent)" }} />
                </div>
                <p
                  className="text-xs font-semibold tracking-widest uppercase mb-2"
                  style={{ color: "var(--accent)" }}
                >
                  Pro feature
                </p>
                <h3
                  className="text-xl font-bold mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  Unlock the full market dashboard
                </h3>
                <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
                  See every category&apos;s trend direction, saturation, and opportunity signal — refreshed in real time.
                </p>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-1.5 bg-[color:var(--accent)] text-white font-semibold px-5 h-10 text-sm hover:brightness-110 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  Upgrade to Pro
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <p className="mt-4 text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                  7-day free trial · Cancel anytime
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Live submissions feed — the living pulse of the market */}
        {!isLocked && latest.length > 0 && (
          <div className="mt-10">
            <LiveFeed items={latest} />
          </div>
        )}
      </div>
    </div>
  );
}
