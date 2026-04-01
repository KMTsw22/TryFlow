import Link from "next/link";
import { Plus, Users, Target, BarChart3, Sparkles, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ExperimentActionsMenu } from "@/components/dashboard/ExperimentActionsMenu";
import { StatusBadge } from "@/components/dashboard/StatusBadge";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: experiments } = await supabase
    .from("experiments")
    .select("id, slug, product_name, description, status, total_visitors, pricing_slider, category, maker_name, project_url, hero_title, hero_subtitle, cta_text, created_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const totalVisitors = experiments?.reduce((sum, e) => sum + (e.total_visitors ?? 0), 0) ?? 0;
  const runningCount  = experiments?.filter(e => e.status === "RUNNING").length ?? 0;

  const topExp = experiments?.[0];
  const firstName = user?.user_metadata?.full_name?.split(" ")[0] ?? "there";

  return (
    <div className="max-w-[1100px] mx-auto space-y-7">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Welcome back, {firstName}. Here&apos;s how your projects are performing.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/analytics"
            className="flex items-center gap-2 border border-gray-200 text-gray-600 text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
            <BarChart3 className="w-4 h-4" /> Analytics
          </Link>
          <Link href="/experiments/new"
            className="flex items-center gap-2 bg-teal-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-teal-600 transition-colors">
            <Plus className="w-4 h-4" /> New Project
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 card-shadow">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-cyan-600" />
            </div>
            <span className="text-xs font-semibold text-gray-400">all time</span>
          </div>
          <p className="text-xs text-gray-400 font-medium mt-3">Total Visitors</p>
          <p className="text-3xl font-bold text-gray-900 mt-0.5">{totalVisitors.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 card-shadow">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <Target className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-xs font-semibold text-green-600">{runningCount} running</span>
          </div>
          <p className="text-xs text-gray-400 font-medium mt-3">Total Projects</p>
          <p className="text-3xl font-bold text-gray-900 mt-0.5">{experiments?.length ?? 0}</p>
        </div>

        <div className="bg-teal-500 rounded-2xl p-5 text-white card-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-teal-100">Top Project</span>
            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
              <Trophy className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
          <div>
            <p className="text-xs text-teal-100 mt-3">Most visitors</p>
            <p className="text-xl font-extrabold leading-tight mt-1 truncate">
              {topExp?.product_name ?? "No projects yet"}
            </p>
            <p className="text-[11px] text-teal-100 mt-1">
              {topExp ? `${topExp.total_visitors.toLocaleString()} visitors` : "Submit your first project"}
            </p>
          </div>
        </div>
      </div>

      {/* Projects Table — full list */}
      <div className="bg-white rounded-2xl border border-gray-100 card-shadow">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">My Projects</h2>
          <span className="text-xs text-gray-400">{experiments?.length ?? 0} total</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-50">
              {["PROJECT", "STATUS", "VISITORS", "DATE", ""].map(h => (
                <th key={h} className="text-left px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {experiments && experiments.length > 0 ? (
              experiments.map((exp) => {
                const date = new Date(exp.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                return (
                  <tr key={exp.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-teal-100 flex items-center justify-center text-xs font-bold text-teal-700">
                          {exp.product_name[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{exp.product_name}</p>
                          {exp.category && (
                            <p className="text-[10px] text-gray-400">{exp.category}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge experimentId={exp.id} status={exp.status} />
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-medium">{exp.total_visitors.toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-400 text-xs">{date}</td>
                    <td className="px-6 py-4">
                      <ExperimentActionsMenu experiment={{
                        id:           exp.id,
                        slug:         exp.slug,
                        product_name: exp.product_name,
                        description:  exp.description ?? "",
                        category:     exp.category ?? "Other",
                        maker_name:   exp.maker_name ?? "",
                        project_url:  exp.project_url ?? "",
                        hero_title:   exp.hero_title ?? "",
                        hero_subtitle:exp.hero_subtitle ?? "",
                        cta_text:      exp.cta_text ?? "Join Waitlist",
                        pricing_slider: exp.pricing_slider ?? {},
                        status:        exp.status,
                      }} />
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center">
                  <Sparkles className="w-8 h-8 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-400 text-sm mb-3">No projects yet</p>
                  <Link href="/experiments/new"
                    className="inline-flex items-center gap-2 bg-teal-500 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-teal-600">
                    <Plus className="w-3.5 h-3.5" /> Create your first project
                  </Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
