import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { TrendingUp, TrendingDown, Minus, ArrowRight } from "lucide-react";

interface CategoryTrend {
  category: string;
  total: number;
  last30: number;
  direction: "Rising" | "Stable" | "Declining";
  saturation: "Low" | "Medium" | "High";
}

const TREND_ICON = {
  Rising:    { icon: TrendingUp,   color: "text-emerald-500", bg: "bg-emerald-50", pill: "bg-emerald-100 text-emerald-700" },
  Stable:    { icon: Minus,        color: "text-amber-500",   bg: "bg-amber-50",   pill: "bg-amber-100 text-amber-700" },
  Declining: { icon: TrendingDown, color: "text-red-500",     bg: "bg-red-50",     pill: "bg-red-100 text-red-700" },
};

const SAT_PILL = {
  Low:    "bg-indigo-100 text-indigo-700",
  Medium: "bg-violet-100 text-violet-700",
  High:   "bg-orange-100 text-orange-700",
};

const CATEGORIES = [
  "SaaS / B2B", "Consumer App", "Marketplace", "Dev Tools",
  "Health & Wellness", "Education", "Social / Community", "Fintech",
  "E-commerce", "AI / ML", "Hardware", "Other",
];

export default async function ExplorePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const now = new Date();
  const d7  = new Date(now); d7.setDate(now.getDate() - 7);
  const d14 = new Date(now); d14.setDate(now.getDate() - 14);
  const d30 = new Date(now); d30.setDate(now.getDate() - 30);

  const { data: allRows } = await supabase
    .from("idea_submissions")
    .select("category, created_at");

  const rows = allRows ?? [];

  const count = (cat: string, from?: Date, to?: Date) =>
    rows.filter((r) => {
      if (r.category !== cat) return false;
      const d = new Date(r.created_at);
      if (from && d < from) return false;
      if (to && d >= to) return false;
      return true;
    }).length;

  const trends: CategoryTrend[] = CATEGORIES.map((cat) => {
    const total  = count(cat);
    const last30 = count(cat, d30);
    const last7  = count(cat, d7);
    const prev7  = count(cat, d14, d7);

    let direction: "Rising" | "Stable" | "Declining";
    if (last7 > (prev7 || 0) * 1.25 || (prev7 === 0 && last7 >= 1)) direction = "Rising";
    else if (last7 < (prev7 || 1) * 0.75) direction = "Declining";
    else direction = "Stable";

    let saturation: "Low" | "Medium" | "High";
    if (last30 <= 4) saturation = "Low";
    else if (last30 <= 12) saturation = "Medium";
    else saturation = "High";

    return { category: cat, total, last30, direction, saturation };
  }).sort((a, b) => b.last30 - a.last30);

  const totalIdeas = rows.length;
  const risingCount = trends.filter((t) => t.direction === "Rising").length;
  const maxLast30 = Math.max(...trends.map((t) => t.last30), 1);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 px-6 h-[60px] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png" className="w-7 h-7 rounded-lg" alt="Try.Wepp" />
          <span className="font-bold text-gray-900 text-sm">Try.Wepp</span>
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">Dashboard</Link>
          ) : (
            <Link href="/login" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">Sign in</Link>
          )}
          <Link href="/submit" className="bg-indigo-500 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-indigo-400 transition-colors">
            Submit idea →
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <p className="text-xs font-bold tracking-widest text-indigo-500 uppercase mb-2">Live Market Intelligence</p>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Idea Trend Dashboard</h1>
          <p className="mt-3 text-gray-500 text-base max-w-xl">
            Aggregate data from anonymous founder submissions. Updated in real time as new ideas come in.
          </p>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { label: "Total Ideas Submitted", value: totalIdeas.toLocaleString() },
            { label: "Rising Categories", value: risingCount },
            { label: "Categories Tracked", value: CATEGORIES.length },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-5 text-center">
              <div className="text-3xl font-extrabold text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Category list */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900 text-sm">By Category — Last 30 Days</h2>
            <p className="text-xs text-gray-400">Sorted by submission volume</p>
          </div>

          <div className="divide-y divide-gray-50">
            {trends.map((t) => {
              const tConf = TREND_ICON[t.direction];
              const TIcon = tConf.icon;
              const barPct = maxLast30 > 0 ? (t.last30 / maxLast30) * 100 : 0;

              return (
                <div key={t.category} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
                  <div className={`w-9 h-9 rounded-xl ${tConf.bg} flex items-center justify-center shrink-0`}>
                    <TIcon className={`w-4 h-4 ${tConf.color}`} />
                  </div>

                  <div className="w-40 shrink-0">
                    <p className="text-sm font-semibold text-gray-800">{t.category}</p>
                  </div>

                  <div className="flex-1">
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-400 rounded-full"
                        style={{ width: `${barPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-sm font-bold text-gray-700 w-14 text-right shrink-0">
                    {t.last30}
                    <span className="text-xs font-normal text-gray-400 ml-0.5"> ideas</span>
                  </div>

                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${tConf.pill} shrink-0 w-20 text-center`}>
                    {t.direction}
                  </span>

                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${SAT_PILL[t.saturation]} shrink-0`}>
                    {t.saturation} sat.
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 bg-gradient-navy rounded-2xl p-8 text-center">
          <p className="text-xs font-bold tracking-widest text-indigo-400 uppercase mb-3">Add your signal</p>
          <h3 className="text-2xl font-extrabold text-white mb-3">
            The more ideas submitted, the sharper the trends.
          </h3>
          <p className="text-sm text-gray-400 mb-6 max-w-sm mx-auto">
            Your anonymous submission helps every founder see where the market is heading.
          </p>
          <Link href="/submit" className="inline-flex items-center gap-2 bg-indigo-500 text-white font-bold px-6 py-3 rounded-xl text-sm hover:bg-indigo-400 transition-colors">
            Submit your idea <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}