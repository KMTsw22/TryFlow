import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ArrowRight, Users, MousePointerClick, Mail, Plus, Sparkles } from "lucide-react";
import { ProjectCard } from "@/components/explore/ProjectCard";
import { MyProjectsList } from "@/components/dashboard/MyProjectsList";

export default async function HomePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // Creator's own experiments
  const { data: myExperiments } = await supabase
    .from("experiments")
    .select("id, slug, product_name, status, total_visitors, created_at")
    .eq("user_id", user?.id ?? "")
    .order("created_at", { ascending: false });

  // Stats for creator's experiments
  let totalVisitors = 0;
  let totalClicks = 0;
  let totalWaitlist = 0;

  if (myExperiments && myExperiments.length > 0) {
    const ids = myExperiments.map((e: { id: string }) => e.id);

    totalVisitors = myExperiments.reduce(
      (sum: number, e: { total_visitors: number }) => sum + (e.total_visitors ?? 0), 0
    );

    const { count: clickCount } = await supabase
      .from("click_events")
      .select("*", { count: "exact", head: true })
      .in("experiment_id", ids);
    totalClicks = clickCount ?? 0;

    const { count: waitlistCount } = await supabase
      .from("waitlist_entries")
      .select("*", { count: "exact", head: true })
      .in("experiment_id", ids);
    totalWaitlist = waitlistCount ?? 0;
  }

  // Public explore grid
  const { data: dbExperiments } = await supabase
    .from("experiments")
    .select("id, slug, product_name, description, status, total_visitors, pricing_tiers, category, maker_name, project_url")
    .eq("status", "RUNNING")
    .order("total_visitors", { ascending: false });

  // Fetch comment counts for all running experiments
  const runningIds = (dbExperiments ?? []).map((e: { id: string }) => e.id);
  const commentCountMap: Record<string, number> = {};
  if (runningIds.length > 0) {
    const { data: commentRows } = await supabase
      .from("comments")
      .select("experiment_id")
      .in("experiment_id", runningIds);
    (commentRows ?? []).forEach((r: { experiment_id: string }) => {
      commentCountMap[r.experiment_id] = (commentCountMap[r.experiment_id] ?? 0) + 1;
    });
  }

  const allProjects = (dbExperiments ?? []).map((e: {
    id: string; slug: string; product_name: string; description: string;
    total_visitors: number; pricing_tiers: { name: string; price: string }[];
    category?: string; maker_name?: string; project_url?: string;
  }) => ({
    id: e.id, slug: e.slug, product_name: e.product_name, description: e.description,
    category: e.category ?? "Other", maker_name: e.maker_name ?? "",
    project_url: e.project_url ?? "",
    total_visitors: e.total_visitors,
    comment_count: commentCountMap[e.id] ?? 0,
    pricing_tiers: e.pricing_tiers ?? [],
  }));

  return (
    <div className="max-w-[1100px] mx-auto space-y-8">

      {/* ── Creator Stats Banner ── */}
      {myExperiments && myExperiments.length > 0 ? (
        <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-purple-300" />
                <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider">My Projects</span>
              </div>
              <h2 className="text-xl font-bold">
                {myExperiments.length === 1
                  ? myExperiments[0].product_name
                  : `${myExperiments.length} projects live`}
              </h2>
            </div>
            <Link
              href="/experiments/new"
              className="inline-flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> New Project
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: <Users className="w-4 h-4" />, label: "Total Visitors", value: totalVisitors.toLocaleString() },
              { icon: <MousePointerClick className="w-4 h-4" />, label: "Pricing Clicks", value: totalClicks.toLocaleString() },
              { icon: <Mail className="w-4 h-4" />, label: "Waitlist Signups", value: totalWaitlist.toLocaleString() },
            ].map((s) => (
              <div key={s.label} className="bg-white/10 rounded-xl p-4">
                <div className="flex items-center gap-1.5 text-purple-300 mb-2">
                  {s.icon}
                  <span className="text-xs font-medium">{s.label}</span>
                </div>
                <p className="text-2xl font-bold">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <MyProjectsList experiments={myExperiments} />
          </div>
          <div className="mt-3 flex justify-end">
            <Link href="/dashboard/analytics" className="flex items-center gap-1 text-xs text-purple-300 hover:text-white transition-colors">
              Full analytics <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-violet-600 to-purple-800 rounded-2xl p-8 text-white">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/15 text-white/90 text-xs font-semibold px-3 py-1 rounded-full mb-4">
                <Sparkles className="w-3 h-3" /> Welcome to try.wepp!
              </div>
              <h2 className="text-xl font-bold mb-2">Launch your first validation page</h2>
              <p className="text-white/70 text-sm leading-relaxed max-w-md">
                No coding needed. Describe your idea, set pricing tiers, and get a shareable page in under 5 minutes.
                Collect real feedback before writing a single line of code.
              </p>
              <div className="flex items-center gap-6 mt-5">
                {[
                  { emoji: "✏️", text: "Describe idea" },
                  { emoji: "🔗", text: "Share link" },
                  { emoji: "📊", text: "Read reactions" },
                ].map(s => (
                  <div key={s.text} className="flex items-center gap-2 text-sm text-white/80">
                    <span>{s.emoji}</span> {s.text}
                  </div>
                ))}
              </div>
            </div>
            <Link
              href="/experiments/new"
              className="shrink-0 inline-flex items-center gap-2 bg-white text-purple-700 text-sm font-bold px-6 py-3 rounded-xl hover:bg-purple-50 transition-colors shadow-lg"
            >
              <Plus className="w-4 h-4" /> Submit My Project
            </Link>
          </div>
        </div>
      )}

      {/* ── Explore Grid ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Explore Projects</h2>
          <span className="text-xs text-gray-400">{allProjects.length} live projects</span>
        </div>
        {allProjects.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            No projects live yet. <Link href="/experiments/new" className="text-purple-600 font-medium hover:underline">Be the first!</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {allProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
