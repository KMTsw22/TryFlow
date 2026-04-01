import { createClient } from "@/lib/supabase/server";
import {
  Users, MousePointerClick, Mail, MessageSquare,
  ExternalLink, Clock, TrendingUp, Globe, Smartphone, Monitor,
} from "lucide-react";
import { DailyVisitorsChart } from "@/components/analytics/DailyVisitorsChart";
import { FeatureBreakdownChart } from "@/components/analytics/FeatureBreakdownChart";
import { ProjectSelector } from "@/components/analytics/ProjectSelector";
import { WTPDistributionChart } from "@/components/analytics/WTPDistributionChart";
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
    .select("id, product_name, status, total_visitors, created_at, pricing_slider")
    .eq("user_id", user!.id)
    .order("total_visitors", { ascending: false });

  const allIds = (experiments ?? []).map((e: { id: string }) => e.id);

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

  const events = allEvents ?? [];

  // ── Daily visitors chart ────────────────────────────────
  const pageViews = events.filter((e: { event_type: string }) => e.event_type === "page_view");
  const days = getLast14Days();
  const viewsByDay: Record<string, number> = Object.fromEntries(days.map(d => [d, 0]));
  pageViews.forEach((e: { created_at: string }) => {
    const day = e.created_at.slice(0, 10);
    if (viewsByDay[day] !== undefined) viewsByDay[day]++;
  });
  const dailyData = days.map(d => ({ date: d.slice(5), views: viewsByDay[d] }));

  // ── New vs Returning ────────────────────────────────────
  const newVisitors = pageViews.filter((e: { metadata: { is_return?: boolean } }) => !e.metadata?.is_return).length;
  const returningVisitors = pageViews.filter((e: { metadata: { is_return?: boolean } }) => !!e.metadata?.is_return).length;

  // ── Try It clicks ───────────────────────────────────────
  const tryItClicks = events.filter((e: { event_type: string }) => e.event_type === "try_it_click").length;

  // ── Avg time on page ────────────────────────────────────
  const exitEvents = events.filter((e: { event_type: string }) => e.event_type === "page_exit");
  const durations = exitEvents
    .map((e: { metadata: { duration_seconds?: number } }) => e.metadata?.duration_seconds ?? 0)
    .filter((d: number) => d > 0 && d < 3600); // ignore >1hr outliers
  const avgDuration = durations.length > 0
    ? Math.round(durations.reduce((a: number, b: number) => a + b, 0) / durations.length)
    : 0;
  const fmtDuration = avgDuration >= 60
    ? `${Math.floor(avgDuration / 60)}m ${avgDuration % 60}s`
    : `${avgDuration}s`;

  // ── Scroll depth ────────────────────────────────────────
  const scrollEvents = events.filter((e: { event_type: string }) => e.event_type === "scroll_depth");
  const scrollDepths: Record<number, number> = { 25: 0, 50: 0, 75: 0, 100: 0 };
  scrollEvents.forEach((e: { metadata: { depth?: number } }) => {
    const d = e.metadata?.depth;
    if (d && d in scrollDepths) scrollDepths[d]++;
  });
  const scrollBase = scrollDepths[25] || 1; // avoid /0

  // ── Device breakdown ────────────────────────────────────
  const deviceMap: Record<string, number> = {};
  pageViews.forEach((e: { metadata: { device?: string } }) => {
    const d = e.metadata?.device ?? "unknown";
    deviceMap[d] = (deviceMap[d] ?? 0) + 1;
  });
  const totalDevices = Object.values(deviceMap).reduce((a, b) => a + b, 0) || 1;

  // ── Country top 5 ───────────────────────────────────────
  const countryMap: Record<string, number> = {};
  pageViews.forEach((e: { metadata: { country?: string } }) => {
    const c = e.metadata?.country;
    if (c) countryMap[c] = (countryMap[c] ?? 0) + 1;
  });
  const topCountries = Object.entries(countryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxCountryCount = topCountries[0]?.[1] || 1;

  // ── Feature votes ────────────────────────────────────────
  const featureVotes = events.filter((e: { event_type: string }) => e.event_type === "feature_vote");
  const featureMap: Record<string, number> = {};
  featureVotes.forEach((e: { metadata: { featureTitle?: string; featureId?: string } }) => {
    const title = e.metadata?.featureTitle ?? e.metadata?.featureId ?? "Unknown";
    featureMap[title] = (featureMap[title] ?? 0) + 1;
  });
  const featureData = Object.entries(featureMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // ── WTP distribution ────────────────────────────────────
  const sliderEvents = events.filter((e: { event_type: string }) => e.event_type === "price_slider_response");
  const wtpValues: number[] = sliderEvents
    .map((e: { metadata: { value?: number } }) => e.metadata?.value)
    .filter((v): v is number => typeof v === "number");
  const sliderConfig = selectedExp?.pricing_slider as { min?: number; max?: number } | undefined;
  const wtpMin = sliderConfig?.min ?? (wtpValues.length > 0 ? Math.min(...wtpValues) : 0);
  const wtpMax = sliderConfig?.max ?? (wtpValues.length > 0 ? Math.max(...wtpValues) : 100);

  // ── Conversion funnel ────────────────────────────────────
  const priceVotes = events.filter((e: { event_type: string }) => e.event_type === "price_slider_response").length;
  const funnel = [
    { label: "Visitors", value: totalVisitors, color: "bg-teal-500" },
    { label: "Try It Clicks", value: tryItClicks, color: "bg-blue-500" },
    { label: "Price Votes", value: priceVotes, color: "bg-purple-500" },
    { label: "Comments", value: commentCount ?? 0, color: "bg-pink-500" },
    { label: "Waitlist", value: waitlistCount ?? 0, color: "bg-amber-500" },
  ];
  const funnelBase = funnel[0].value || 1;

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
          { icon: <Users className="w-5 h-5 text-teal-600" />,          bg: "bg-teal-50",   label: "Total Visitors",    value: totalVisitors.toLocaleString() },
          { icon: <ExternalLink className="w-5 h-5 text-blue-600" />,   bg: "bg-blue-50",   label: "Try It Clicks",     value: tryItClicks.toLocaleString() },
          { icon: <MessageSquare className="w-5 h-5 text-purple-600" />, bg: "bg-purple-50", label: "Comments",          value: (commentCount ?? 0).toLocaleString() },
          { icon: <Clock className="w-5 h-5 text-orange-600" />,         bg: "bg-orange-50", label: "Avg. Time on Page", value: avgDuration > 0 ? fmtDuration : "—" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5 card-shadow">
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>{s.icon}</div>
            <p className="text-xs text-gray-400 font-medium">{s.label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Daily Visitors */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 card-shadow">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Daily Visitors</h2>
            <p className="text-xs text-gray-400 mt-0.5">Page views over the last 14 days</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs bg-teal-50 text-teal-700 font-semibold px-3 py-1 rounded-full">
              {newVisitors} new
            </span>
            <span className="text-xs bg-gray-100 text-gray-600 font-semibold px-3 py-1 rounded-full">
              {returningVisitors} returning
            </span>
          </div>
        </div>
        <DailyVisitorsChart data={dailyData} />
      </div>

      {/* Conversion Funnel + Scroll Depth */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Conversion Funnel */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 card-shadow">
          <div className="mb-5">
            <h2 className="text-sm font-bold text-gray-900">Conversion Funnel</h2>
            <p className="text-xs text-gray-400 mt-0.5">How visitors move through your page</p>
          </div>
          <div className="space-y-3">
            {funnel.map((step) => {
              const pct = Math.round((step.value / funnelBase) * 100);
              return (
                <div key={step.label}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-600 font-medium">{step.label}</span>
                    <span className="font-bold text-gray-900">{step.value.toLocaleString()} <span className="text-gray-400 font-normal">({pct}%)</span></span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className={`h-2 rounded-full ${step.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Scroll Depth */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 card-shadow">
          <div className="mb-5">
            <h2 className="text-sm font-bold text-gray-900">Scroll Depth</h2>
            <p className="text-xs text-gray-400 mt-0.5">How far visitors scroll down your page</p>
          </div>
          <div className="space-y-3">
            {([25, 50, 75, 100] as const).map((d) => {
              const count = scrollDepths[d];
              const pct = Math.round((count / scrollBase) * 100);
              return (
                <div key={d}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-600 font-medium">{d}% scrolled</span>
                    <span className="font-bold text-gray-900">{count.toLocaleString()} <span className="text-gray-400 font-normal">({pct}%)</span></span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${pct}%`,
                        background: d === 100 ? "#0D9488" : d === 75 ? "#14B8A6" : d === 50 ? "#5EEAD4" : "#99F6E4",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Device + Country */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Device Breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 card-shadow">
          <div className="mb-5">
            <h2 className="text-sm font-bold text-gray-900">Device Breakdown</h2>
            <p className="text-xs text-gray-400 mt-0.5">What devices visitors use</p>
          </div>
          {Object.keys(deviceMap).length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-sm">No data yet</div>
          ) : (
            <div className="space-y-3">
              {[
                { key: "desktop", icon: <Monitor className="w-3.5 h-3.5" />, label: "Desktop" },
                { key: "mobile",  icon: <Smartphone className="w-3.5 h-3.5" />, label: "Mobile" },
                { key: "tablet",  icon: <Smartphone className="w-3.5 h-3.5" />, label: "Tablet" },
              ]
                .filter(({ key }) => deviceMap[key] > 0)
                .map(({ key, icon, label }) => {
                  const count = deviceMap[key] ?? 0;
                  const pct = Math.round((count / totalDevices) * 100);
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="flex items-center gap-1.5 text-gray-600 font-medium">{icon}{label}</span>
                        <span className="font-bold text-gray-900">{count} <span className="text-gray-400 font-normal">({pct}%)</span></span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="h-2 rounded-full bg-blue-400" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Country Top 5 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 card-shadow">
          <div className="mb-5">
            <h2 className="text-sm font-bold text-gray-900">Top Countries</h2>
            <p className="text-xs text-gray-400 mt-0.5">Where your visitors come from</p>
          </div>
          {topCountries.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-sm">No location data yet<br /><span className="text-xs">(Available in production)</span></div>
          ) : (
            <div className="space-y-3">
              {topCountries.map(([country, count]) => {
                const pct = Math.round((count / maxCountryCount) * 100);
                return (
                  <div key={country}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="flex items-center gap-1.5 text-gray-600 font-medium">
                        <Globe className="w-3 h-3" />{country}
                      </span>
                      <span className="font-bold text-gray-900">{count}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="h-2 rounded-full bg-indigo-400" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* WTP Distribution */}
      {(wtpValues.length > 0 || selectedExp?.pricing_slider) && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 card-shadow">
          <div className="mb-5">
            <h2 className="text-sm font-bold text-gray-900">Willingness to Pay</h2>
            <p className="text-xs text-gray-400 mt-0.5">Distribution of price responses from visitors</p>
          </div>
          <WTPDistributionChart values={wtpValues} min={wtpMin} max={wtpMax} />
        </div>
      )}

      {/* Feature Votes */}
      {featureData.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 card-shadow">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Feature Votes</h2>
              <p className="text-xs text-gray-400 mt-0.5">Which features users want most</p>
            </div>
            <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-3 py-1 rounded-full">
              {featureVotes.length} votes
            </span>
          </div>
          <FeatureBreakdownChart data={featureData} total={featureVotes.length} />
        </div>
      )}

      {/* Per-experiment table */}
      {!selectedExp && (
        <div className="bg-white rounded-2xl border border-gray-100 card-shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-teal-600" />
            <h2 className="text-sm font-bold text-gray-900">Projects Overview</h2>
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
                {(experiments ?? []).map((exp: { id: string; product_name: string; status: string; total_visitors: number }) => {
                  const pct = totalVisitors > 0 ? Math.round((exp.total_visitors / totalVisitors) * 100) : 0;
                  return (
                    <tr key={exp.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-teal-100 flex items-center justify-center text-xs font-bold text-teal-700">
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
                            <div className="h-full bg-teal-500 rounded-full" style={{ width: `${pct}%` }} />
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

      {/* Secondary stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { icon: <Mail className="w-5 h-5 text-green-600" />,  bg: "bg-green-50",  label: "Waitlist Signups",  value: (waitlistCount ?? 0).toLocaleString() },
          { icon: <MousePointerClick className="w-5 h-5 text-orange-600" />, bg: "bg-orange-50", label: "Feature Votes", value: featureVotes.length.toLocaleString() },
          { icon: <TrendingUp className="w-5 h-5 text-teal-600" />, bg: "bg-teal-50", label: "Price Responses", value: wtpValues.length.toLocaleString() },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5 card-shadow">
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>{s.icon}</div>
            <p className="text-xs text-gray-400 font-medium">{s.label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
