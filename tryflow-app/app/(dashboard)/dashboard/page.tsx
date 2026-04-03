import Link from "next/link";
import { Plus, Users, MessageSquare, BarChart3, Sparkles, Trophy, ArrowRight, Coins } from "lucide-react";
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

  const { count: totalComments } = await supabase
    .from("comments")
    .select("*", { count: "exact", head: true })
    .in("experiment_id", (experiments ?? []).map(e => e.id));

  const totalVisitors = experiments?.reduce((sum, e) => sum + (e.total_visitors ?? 0), 0) ?? 0;
  const activeCount   = experiments?.filter(e => e.status === "RUNNING").length ?? 0;
  const topExp        = experiments?.[0];
  const firstName     = user?.user_metadata?.full_name?.split(" ")[0] ?? "there";
  const hasProjects   = (experiments?.length ?? 0) > 0;

  return (
    <div className="max-w-[1100px] mx-auto space-y-7">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Welcome back, {firstName}. Here&apos;s what&apos;s happening with your projects.
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

      {/* Onboarding — shown when no projects */}
      {!hasProjects && (
        <div className="bg-gradient-to-br from-teal-50 to-white rounded-2xl border border-teal-100 p-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-12 h-12 rounded-2xl bg-teal-500 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Welcome to Try.Wepp</h2>
            <p className="text-sm text-gray-500 mb-8 max-w-md mx-auto leading-relaxed">
              Get feedback from real builders before you launch. Here&apos;s how to get started:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 text-left">
              {[
                {
                  num: "01",
                  icon: "🚀",
                  title: "Submit your project",
                  desc: "Create a listing for your product and share it with the builder community.",
                  color: "bg-teal-50 border-teal-100",
                },
                {
                  num: "02",
                  icon: "🔍",
                  title: "Try other projects",
                  desc: "Browse and review other builders' products. Earn 2 credits per review.",
                  color: "bg-violet-50 border-violet-100",
                },
                {
                  num: "03",
                  icon: "🪙",
                  title: "Receive feedback",
                  desc: "Use your credits to unlock feedback from the community on your own project.",
                  color: "bg-amber-50 border-amber-100",
                },
              ].map((step) => (
                <div key={step.num} className={`rounded-xl border ${step.color} p-4`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{step.icon}</span>
                    <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">{step.num}</span>
                  </div>
                  <p className="text-sm font-bold text-gray-900 mb-1">{step.title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-3">
              <Link href="/experiments/new"
                className="inline-flex items-center gap-2 bg-teal-500 text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-teal-600 transition-colors">
                <Plus className="w-4 h-4" /> Submit my first project
              </Link>
              <Link href="/explore"
                className="inline-flex items-center gap-2 border border-gray-200 text-gray-600 text-sm font-semibold px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors">
                Browse projects <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Stats Row — shown when projects exist */}
      {hasProjects && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 card-shadow">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-cyan-600" />
              </div>
              <span className="text-xs font-semibold text-gray-400">all time</span>
            </div>
            <p className="text-xs text-gray-400 font-medium mt-3">Total Views</p>
            <p className="text-3xl font-bold text-gray-900 mt-0.5">{totalVisitors.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 card-shadow">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-teal-600" />
              </div>
              <span className="text-xs font-semibold text-teal-600">{activeCount} active</span>
            </div>
            <p className="text-xs text-gray-400 font-medium mt-3">Feedback Received</p>
            <p className="text-3xl font-bold text-gray-900 mt-0.5">{(totalComments ?? 0).toLocaleString()}</p>
          </div>

          <div className="bg-teal-500 rounded-2xl p-5 text-white card-shadow flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-teal-100">Top Project</span>
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                <Trophy className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
            <div>
              <p className="text-xs text-teal-100 mt-3">Most viewed</p>
              <p className="text-xl font-extrabold leading-tight mt-1 truncate">
                {topExp?.product_name ?? "No projects yet"}
              </p>
              <p className="text-[11px] text-teal-100 mt-1">
                {topExp ? `${topExp.total_visitors.toLocaleString()} views` : "Submit your first project"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Earn credits prompt — shown when projects exist */}
      {hasProjects && (
        <div className="bg-amber-50 rounded-2xl border border-amber-100 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-xl shrink-0">🪙</div>
            <div>
              <p className="text-sm font-bold text-gray-900">Earn more credits</p>
              <p className="text-xs text-gray-500 mt-0.5">Review other builders&apos; projects and earn 2 credits per review. Use them to get feedback on your own.</p>
            </div>
          </div>
          <Link href="/explore"
            className="shrink-0 inline-flex items-center gap-2 bg-amber-500 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-amber-600 transition-colors ml-4">
            <Coins className="w-3.5 h-3.5" /> Browse &amp; earn
          </Link>
        </div>
      )}

      {/* Projects Table */}
      {hasProjects && (
        <div className="bg-white rounded-2xl border border-gray-100 card-shadow">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">My Projects</h2>
            <span className="text-xs text-gray-400">{experiments?.length ?? 0} total</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50">
                {["PROJECT", "STATUS", "VIEWS", "FEEDBACK", "DATE", ""].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {experiments!.map((exp) => {
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
                    <td className="px-6 py-4 text-gray-600 font-medium">—</td>
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
                        cta_text:     exp.cta_text ?? "Join Waitlist",
                        pricing_slider: exp.pricing_slider ?? {},
                        status:       exp.status,
                      }} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}