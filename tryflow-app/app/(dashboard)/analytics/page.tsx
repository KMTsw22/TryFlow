import { createClient } from "@/lib/supabase/server";
import { Users, MousePointerClick, Mail, MessageSquare } from "lucide-react";
import { DailyVisitorsChart } from "@/components/analytics/DailyVisitorsChart";
import { PricingBreakdownChart } from "@/components/analytics/PricingBreakdownChart";
import { FeatureBreakdownChart } from "@/components/analytics/FeatureBreakdownChart";
import { ProjectSelector } from "@/components/analytics/ProjectSelector";
import { Suspense } from "react";

function getLast14Days(): string[] {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return d.toISOString().slice(0, 10);
  });
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const { project: projectId } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: experiments } = await supabase
    .from("experiments")
    .select("id, product_name, status, total_visitors, created_at")
    .eq("user_id", user!.id)
    .order("total_visitors", { ascending: false });

  const allIds = (experiments ?? []).map((e: { id: string }) => e.id);

  // If a specific project is selected and it belongs to user, use only that id
  const selectedExp = projectId && allIds.includes(projectId)
    ? (experiments ?? []).find((e: { id: string }) => e.id === projectId)
    : null;
  const expIds = selectedExp ? [selectedExp.id] : allIds;

  // All click events (last 30 days)
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const { data: allEvents } = expIds.length > 0
    ? await supabase
        .from("click_events")
        .select("event_type, metadata, created_at")
        .in("experiment_id", expIds)
        .gte("created_at", since.toISOString())
    : { data: [] };

  const { count: waitlistCount } = expIds.length > 0
    ? await supabase.from("waitlist_entries").select("*", { count: "exact", head: true }).in("experiment_id", expIds)
    : { count: 0 };

  const { count: commentCount } = expIds.length > 0
    ? await supabase.from("comments").select("*", { count: "exact", head: true }).in("experiment_id", expIds)
    : { count: 0 };

  const filteredExperiments = selectedExp ? [selectedExp] : (experiments ?? []);
  const totalVisitors = filteredExperiments.reduce(
    (s: number, e: { total_visitors: number }) => s + (e.total_visitors ?? 0), 0
  );

  // ── A) Daily visitors (page_view events) ───────────────
  const pageViews = (allEvents ?? []).filter((e: { event_type: string }) => e.event_type === "page_view");
  const days = getLast14Days();
  const viewsByDay: Record<string, number> = Object.fromEntries(days.map(d => [d, 0]));
  pageViews.forEach((e: { created_at: string }) => {
    const day = e.created_at.slice(0, 10);
    if (viewsByDay[day] !== undefined) viewsByDay[day]++;
  });
  const dailyData = days.map(d => ({
    date: d.slice(5), // MM-DD
    views: viewsByDay[d],
  }));

  // ── B-1) Pricing clicks ──────────────────────────────────
  const pricingClicks = (allEvents ?? []).filter((e: { event_type: string }) => e.event_type === "pricing_click");
  const planMap: Record<string, number> = {};
  pricingClicks.forEach((e: { metadata: { planName?: string } }) => {
    const plan = e.metadata?.planName ?? "Unknown";
    planMap[plan] = (planMap[plan] ?? 0) + 1;
  });
  const pricingData = Object.entries(planMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // ── B-2) Feature votes ───────────────────────────────────
  const featureVotes = (allEvents ?? []).filter((e: { event_type: string }) => e.event_type === "feature_vote");
  const featureMap: Record<string, number> = {};
  featureVotes.forEach((e: { metadata: { featureTitle?: string; featureId?: string } }) => {
    const title = e.metadata?.featureTitle ?? e.metadata?.featureId ?? "Unknown";
    featureMap[title] = (featureMap[title] ?? 0) + 1;
  });
  const featureData = Object.entries(featureMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const totalPricingClicks = pricingClicks.length;
  const totalFeatureVotes = featureVotes.length;

  const subtitle = selectedExp
    ? `${selectedExp.product_name} · Last 30 days`
    : `Last 30 days · ${(experiments ?? []).length} project${(experiments ?? []).length !== 1 ? "s" : ""}`;

  return (
    <div className="max-w-[1100px] mx-auto space-y-7">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        </div>
        {(experiments ?? []).length > 1 && (
          <Suspense>
            <ProjectSelector experiments={experiments ?? []} />
          </Suspense>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: <Users className="w-5 h-5 text-cyan-600" />,             bg: "bg-cyan-50",   label: "Total Visitors",    value: totalVisitors.toLocaleString() },
          { icon: <MousePointerClick className="w-5 h-5 text-purple-600" />, bg: "bg-purple-50", label: "Pricing Clicks",    value: totalPricingClicks.toLocaleString() },
          { icon: <Mail className="w-5 h-5 text-green-600" />,              bg: "bg-green-50",  label: "Waitlist Signups",  value: (waitlistCount ?? 0).toLocaleString() },
          { icon: <MessageSquare className="w-5 h-5 text-blue-600" />,      bg: "bg-blue-50",   label: "Comments Received", value: (commentCount ?? 0).toLocaleString() },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5 card-shadow">
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>{s.icon}</div>
            <p className="text-xs text-gray-400 font-medium">{s.label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>

      {/* A) Daily Visitors Chart */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 card-shadow">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Daily Visitors</h2>
            <p className="text-xs text-gray-400 mt-0.5">Page views tracked over the last 14 days</p>
          </div>
          <span className="text-xs bg-purple-50 text-purple-700 font-semibold px-3 py-1 rounded-full">
            {pageViews.length} total views
          </span>
        </div>
        <DailyVisitorsChart data={dailyData} />
      </div>

      {/* B) Pricing + Feature breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Pricing Tier Popularity */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 card-shadow">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Pricing Tier Interest</h2>
              <p className="text-xs text-gray-400 mt-0.5">Which plan visitors clicked most</p>
            </div>
            <span className="text-xs bg-purple-50 text-purple-700 font-semibold px-3 py-1 rounded-full">
              {totalPricingClicks} clicks
            </span>
          </div>
          {pricingData.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">No pricing clicks yet</div>
          ) : (
            <PricingBreakdownChart data={pricingData} total={totalPricingClicks} />
          )}
        </div>

        {/* Feature Vote Breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 card-shadow">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Feature Vote Breakdown</h2>
              <p className="text-xs text-gray-400 mt-0.5">Which features users want most</p>
            </div>
            <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-3 py-1 rounded-full">
              {totalFeatureVotes} votes
            </span>
          </div>
          {featureData.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">No feature votes yet</div>
          ) : (
            <FeatureBreakdownChart data={featureData} total={totalFeatureVotes} />
          )}
        </div>
      </div>

      {/* Per-experiment table (only shown in "all projects" view) */}
      {!selectedExp && (
        <div className="bg-white rounded-2xl border border-gray-100 card-shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900">Projects Performance</h2>
          </div>
          {!experiments || experiments.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">No projects yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50">
                  {["Project", "Status", "Visitors", "Share"].map(h => (
                    <th key={h} className="text-left px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {experiments.map((exp: { id: string; product_name: string; status: string; total_visitors: number }) => {
                  const pct = totalVisitors > 0 ? Math.round((exp.total_visitors / totalVisitors) * 100) : 0;
                  return (
                    <tr key={exp.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-700">
                            {exp.product_name[0]}
                          </div>
                          <span className="font-medium text-gray-900 text-xs">{exp.product_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${exp.status === "RUNNING" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {exp.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-gray-700 font-bold text-sm">{exp.total_visitors.toLocaleString()}</td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-primary rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-gray-400 w-8">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
