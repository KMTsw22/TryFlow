import Link from "next/link";
import { Plus, Users, Target, MoreHorizontal, ArrowRight, Sparkles, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

const STATUS: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  RUNNING: { label: "Running", dot: "bg-green-500",  bg: "bg-green-50",  text: "text-green-700" },
  PAUSED:  { label: "Paused",  dot: "bg-amber-500",  bg: "bg-amber-50",  text: "text-amber-700" },
  ENDED:   { label: "Ended",   dot: "bg-gray-400",   bg: "bg-gray-100",  text: "text-gray-600" },
  DRAFT:   { label: "Draft",   dot: "bg-blue-400",   bg: "bg-blue-50",   text: "text-blue-600" },
};

const TYPE_LABEL: Record<string, string> = { A: "A", B: "B", H: "H" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: experiments } = await supabase
    .from("experiments")
    .select("id, product_name, status, total_visitors, pricing_tiers, created_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const totalVisitors = experiments?.reduce((sum, e) => sum + (e.total_visitors ?? 0), 0) ?? 0;
  const runningCount  = experiments?.filter(e => e.status === "RUNNING").length ?? 0;

  // 가장 방문자 많은 실험의 첫 번째 가격
  const topExp = experiments?.[0];
  const topPrice = topExp
    ? (topExp.pricing_tiers as { name: string; price: string }[])?.[1]?.price ?? "—"
    : "—";

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] ?? "there";

  return (
    <div className="max-w-[1100px] mx-auto space-y-7">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Welcome back, {firstName}. Here&apos;s what&apos;s happening with your experiments.
          </p>
        </div>
        <Link href="/experiments/new"
          className="flex items-center gap-2 bg-gradient-primary text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Create New Experiment
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 card-shadow">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-cyan-600" />
            </div>
            <span className="text-xs font-semibold text-green-600">↑ total</span>
          </div>
          <p className="text-xs text-gray-400 font-medium mt-3">Total Visitors</p>
          <p className="text-3xl font-bold text-gray-900 mt-0.5">{totalVisitors.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 card-shadow">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <Target className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-xs font-semibold text-green-600">{runningCount} active</span>
          </div>
          <p className="text-xs text-gray-400 font-medium mt-3">Running Experiments</p>
          <p className="text-3xl font-bold text-gray-900 mt-0.5">{experiments?.length ?? 0}</p>
        </div>

        <div className="bg-gradient-primary rounded-2xl p-5 text-white card-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-purple-200">Best Price Point</span>
            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
              <Trophy className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
          <div>
            <p className="text-xs text-purple-200 mt-3">Top Experiment</p>
            <p className="text-[28px] font-extrabold leading-none mt-1">
              {topPrice !== "—" ? `$${topPrice}` : "—"}<span className="text-base font-semibold">{topPrice !== "—" ? "/mo" : ""}</span>
            </p>
            <p className="text-[10px] text-purple-300 mt-1 truncate">{topExp?.product_name ?? "No experiments yet"}</p>
          </div>
        </div>
      </div>

      {/* Experiments Table */}
      <div className="bg-white rounded-2xl border border-gray-100 card-shadow overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Recent Experiments</h2>
          <Link href="/experiments" className="flex items-center gap-1 text-xs font-medium text-purple-600 hover:text-purple-700">
            View All <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-50">
              {["EXPERIMENT NAME","STATUS","VISITORS","PRICING","DATE",""].map(h => (
                <th key={h} className="text-left px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {experiments && experiments.length > 0 ? (
              experiments.map((exp, idx) => {
                const s = STATUS[exp.status] ?? STATUS.DRAFT;
                const tiers = (exp.pricing_tiers as { name: string; price: string }[]) ?? [];
                const date = new Date(exp.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                return (
                  <tr key={exp.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-700">
                          {exp.product_name[0].toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900">{exp.product_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                        {s.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{exp.total_visitors.toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-600 text-xs">
                      {tiers.map(t => `$${t.price}`).join(" / ") || "—"}
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-xs">{date}</td>
                    <td className="px-6 py-4">
                      <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <p className="text-gray-400 text-sm mb-3">No experiments yet</p>
                  <Link href="/experiments/new"
                    className="inline-flex items-center gap-2 bg-gradient-primary text-white text-xs font-semibold px-4 py-2 rounded-lg hover:opacity-90">
                    <Plus className="w-3.5 h-3.5" /> Create your first experiment
                  </Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 card-shadow">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">AI Insight of the Day</h3>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            Users who visited the <span className="text-purple-600 font-semibold">Pricing</span> page after viewing your{" "}
            <span className="text-purple-600 font-semibold">Case Study</span> video are 45% more likely to convert.
          </p>
          <button className="mt-4 bg-purple-50 text-purple-700 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-purple-100 transition-colors">
            Apply Strategy
          </button>
        </div>

        <div className="bg-gray-900 rounded-2xl p-6 text-white flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Weekly Trend</p>
            <p className="text-xl font-bold mt-1">Optimization Velocity</p>
          </div>
          <div className="flex items-end gap-1 h-16 mt-4">
            {[35,50,40,65,55,80,70,90,78,100,88,95].map((h, i) => (
              <div key={i} className="flex-1 rounded-sm" style={{ height: `${h}%`, background: i >= 7 ? '#7C3AED' : '#374151' }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
