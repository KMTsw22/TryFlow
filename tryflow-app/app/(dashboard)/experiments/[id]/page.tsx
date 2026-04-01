import { ArrowLeft, Download, Users, Mail, MousePointerClick, ThumbsUp } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const STATUS_LABEL: Record<string, string> = {
  RUNNING: "Running", PAUSED: "Paused", ENDED: "Ended", DRAFT: "Draft",
};

export default async function ExperimentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: exp } = await supabase
    .from("experiments")
    .select("id, product_name, status, total_visitors, pricing_tiers")
    .eq("id", id)
    .single();

  const tiers = (exp?.pricing_tiers as { name: string; price: string }[]) ?? [];
  const expTitle = exp?.product_name ?? "Experiment";
  const expStatus = STATUS_LABEL[exp?.status ?? "DRAFT"] ?? "Draft";

  const TIER_COLORS = ["bg-teal-400", "bg-teal-600", "bg-teal-300"];
  const PLAN_CLICKS = tiers.length > 0
    ? tiers.map((t, i) => ({ name: t.name, rate: [8.2, 34.7, 12.1][i] ?? 10, clicks: [210, 890, 311][i] ?? 100, color: TIER_COLORS[i] ?? "bg-teal-500" }))
    : [
        { name: "Basic",   rate: 8.2,  clicks: 210, color: "bg-teal-400" },
        { name: "Pro",     rate: 34.7, clicks: 890, color: "bg-teal-600" },
        { name: "Premium", rate: 12.1, clicks: 311, color: "bg-teal-300" },
      ];

  const CLICK_BY_PRICE = tiers.length > 0
    ? tiers.map((t, i) => ({ price: `$${t.price}`, rate: [8.2, 34.7, 12.1][i] ?? 10 }))
    : [
        { price: "$9",  rate: 8.2  },
        { price: "$19", rate: 34.7 },
        { price: "$29", rate: 12.1 },
      ];

  const HEATMAP_ROWS = [
    { label: "Hero CTA",      value: 1240, width: "80%" },
    { label: "Pricing Click", value: 890,  width: "57%" },
    { label: "Feature Vote",  value: 640,  width: "41%" },
    { label: "Scroll Depth",  value: 440,  width: "28%" },
  ];

  const PERF_TABLE = [
    { tier: "Basic Tier",   visitors: "890",   cvr: "8.2%",  revenue: "$7.4K", color: "bg-teal-300" },
    { tier: "Pro Tier",     visitors: "2,450", cvr: "34.7%", revenue: "$28.3K", color: "bg-teal-600" },
    { tier: "Premium Tier", visitors: "375",   cvr: "12.1%", revenue: "$3.2K", color: "bg-teal-400" },
  ];

  return (
    <div className="max-w-[1100px] mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link href="/experiments" className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 mb-3 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Experiments
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{expTitle}</h1>
            <p className="text-sm text-gray-400 mt-0.5">{expTitle} • {expStatus}</p>
          </div>
          <button className="flex items-center gap-2 border border-gray-200 text-sm font-medium text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: "Total Visitors",  value: "2,715", icon: <Users className="w-4 h-4" />,             color: "bg-cyan-50 text-cyan-600",    change: "+12.5%" },
          { label: "Signups",         value: "163",   icon: <Mail className="w-4 h-4" />,               color: "bg-green-50 text-green-600",  change: "+8.1%" },
          { label: "Conversion Rate", value: "20.8%", icon: <MousePointerClick className="w-4 h-4" />,  color: "bg-teal-50 text-teal-600", change: "+3.2%" },
          { label: "Total Clicks",    value: "1,411", icon: <MousePointerClick className="w-4 h-4" />,  color: "bg-blue-50 text-blue-600",    change: "+5.4%" },
          { label: "Feature Votes",   value: "959",   icon: <ThumbsUp className="w-4 h-4" />,           color: "bg-amber-50 text-amber-600",  change: "+2.1%" },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-2xl border border-gray-100 p-4 card-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${c.color}`}>{c.icon}</div>
              <span className="text-[10px] font-semibold text-green-600">{c.change}</span>
            </div>
            <p className="text-xs text-gray-400 font-medium">{c.label}</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Winner Banner */}
      <div className="bg-teal-500 rounded-2xl p-6 text-white flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-teal-100">🏆 AI Winner</span>
          <p className="text-2xl font-extrabold mt-1">Pro Plan at $19/mo outperforms others</p>
          <p className="text-teal-100 text-sm mt-1">34.7% click rate — 4× higher than Basic Tier</p>
        </div>
        <div className="bg-white/15 rounded-xl px-8 py-5 text-center shrink-0">
          <p className="text-4xl font-black">$19</p>
          <p className="text-teal-100 text-xs mt-1">Optimal Price</p>
          <button className="mt-3 bg-white text-teal-700 text-xs font-bold px-4 py-1.5 rounded-lg hover:bg-teal-50 transition-colors">
            Set as Winner
          </button>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-5">
        {/* Conversion by Tier */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 card-shadow">
          <h3 className="text-sm font-semibold text-gray-900 mb-5">Conversion Rate by Pricing Tier</h3>
          <div className="space-y-4">
            {PLAN_CLICKS.map(p => (
              <div key={p.name} className="flex items-center gap-3">
                <span className="w-16 text-xs font-medium text-gray-600">{p.name}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${p.color}`} style={{ width: `${p.rate * 2.5}%` }} />
                </div>
                <span className="text-xs font-bold text-gray-900 w-10 text-right">{p.rate}%</span>
                <span className="text-xs text-gray-400 w-16 text-right">{p.clicks} clicks</span>
              </div>
            ))}
          </div>
        </div>

        {/* Click Rate by Price */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 card-shadow">
          <h3 className="text-sm font-semibold text-gray-900 mb-5">Click Rate by Price</h3>
          <div className="flex items-end gap-6 h-28 px-4">
            {CLICK_BY_PRICE.map(p => (
              <div key={p.price} className="flex flex-col items-center gap-1 flex-1">
                <span className="text-xs font-bold text-gray-700">{p.rate}%</span>
                <div
                  className="w-full bg-teal-600 rounded-t-lg"
                  style={{ height: `${(p.rate / 40) * 80}px` }}
                />
                <span className="text-xs text-gray-400">{p.price}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Heatmap + Sentiment Row */}
      <div className="grid grid-cols-2 gap-5">
        {/* User Heatmap */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 card-shadow">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-gray-900">User Heatmap Analysis</h3>
            <span className="text-xs text-teal-600 font-medium bg-teal-50 px-2.5 py-1 rounded-full">LIVE</span>
          </div>
          <div className="space-y-3">
            {HEATMAP_ROWS.map(r => (
              <div key={r.label}>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span className="font-medium">{r.label}</span>
                  <span>{r.value.toLocaleString()}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-500 rounded-full" style={{ width: r.width }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sentiment Donut */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 card-shadow flex flex-col items-center justify-center">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 self-start">Sentiment Distribution</h3>
          {/* Simple donut using CSS */}
          <div className="relative w-28 h-28">
            <svg viewBox="0 0 36 36" className="w-28 h-28 -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#0D9488" strokeWidth="3"
                strokeDasharray="72 28" strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-extrabold text-gray-900">72%</span>
              <span className="text-[10px] text-gray-400">Positive</span>
            </div>
          </div>
          <div className="flex gap-4 mt-4">
            {[
              { label: "Positive", pct: "72%", color: "bg-teal-600" },
              { label: "Neutral",  pct: "19%", color: "bg-gray-300" },
              { label: "Negative", pct: "9%",  color: "bg-red-400" },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-1.5 text-xs">
                <span className={`w-2 h-2 rounded-full ${s.color}`} />
                <span className="text-gray-500">{s.label}</span>
                <span className="font-semibold text-gray-900">{s.pct}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Summary Table */}
      <div className="bg-white rounded-2xl border border-gray-100 card-shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Performance Summary by Tier</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-50">
              {["Tier","Visitors","Conv. Rate","Est. Revenue"].map(h => (
                <th key={h} className="text-left px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERF_TABLE.map(row => (
              <tr key={row.tier} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2 h-6 rounded-full ${row.color}`} />
                    <span className="font-medium text-gray-800">{row.tier}</span>
                  </div>
                </td>
                <td className="px-6 py-3 text-gray-600">{row.visitors}</td>
                <td className="px-6 py-3 font-semibold text-gray-900">{row.cvr}</td>
                <td className="px-6 py-3 font-semibold text-gray-900">{row.revenue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tier Drop-off */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 card-shadow">
        <h3 className="text-sm font-semibold text-gray-900 mb-5">Tier Drop-off Analysis</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Basic → Pro",    pct: "42%", color: "text-green-600",  bar: "bg-green-500" },
            { label: "Pro → Premium",  pct: "16%", color: "text-amber-600",  bar: "bg-amber-500" },
            { label: "Total Drop-off", pct: "64%", color: "text-red-600",    bar: "bg-red-400" },
          ].map(d => (
            <div key={d.label} className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-2">{d.label}</p>
              <p className={`text-2xl font-extrabold ${d.color}`}>{d.pct}</p>
              <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${d.bar}`} style={{ width: d.pct }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
