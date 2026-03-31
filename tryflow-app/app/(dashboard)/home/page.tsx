import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Heart } from "lucide-react";
import { ProjectCard } from "@/components/explore/ProjectCard";

export default async function HomePage() {
  const supabase = await createClient();

  // Top 5 liked comments
  const { data: topComments } = await supabase
    .from("comments")
    .select("id, author_name, content, likes_count, experiment_id")
    .gt("likes_count", 0)
    .order("likes_count", { ascending: false })
    .limit(5);

  // Resolve experiment names/slugs
  type TopComment = { id: string; author_name: string; content: string; likes_count: number; experiment_id: string; product_name: string; slug: string };
  const topCommentData: TopComment[] = [];
  if (topComments && topComments.length > 0) {
    const expIds = [...new Set(topComments.map((c: { experiment_id: string }) => c.experiment_id))];
    const { data: expRows } = await supabase
      .from("experiments")
      .select("id, product_name, slug")
      .in("id", expIds);
    const expMap: Record<string, { product_name: string; slug: string }> = {};
    (expRows ?? []).forEach((e: { id: string; product_name: string; slug: string }) => {
      expMap[e.id] = { product_name: e.product_name, slug: e.slug };
    });
    topComments.forEach((c: { id: string; author_name: string; content: string; likes_count: number; experiment_id: string }) => {
      const exp = expMap[c.experiment_id];
      if (exp) topCommentData.push({ ...c, product_name: exp.product_name, slug: exp.slug });
    });
  }

  // Running experiments grid
  const { data: dbExperiments } = await supabase
    .from("experiments")
    .select("id, slug, product_name, description, status, total_visitors, pricing_tiers, category, maker_name, project_url")
    .eq("status", "RUNNING")
    .order("total_visitors", { ascending: false });

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

      {/* ── Top 5 liked comments ── */}
      {topCommentData.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-4 h-4 text-rose-500 fill-current" />
            <h2 className="text-base font-bold text-gray-900">가장 많은 좋아요를 받은 피드백</h2>
          </div>
          <div className="space-y-2">
            {topCommentData.map((c, i) => (
              <Link
                key={c.id}
                href={`/${c.slug}`}
                className="flex items-start gap-4 bg-white border border-gray-100 rounded-xl px-5 py-3.5 hover:border-purple-200 hover:bg-purple-50/30 transition-all group"
              >
                <span className="text-sm font-black text-gray-200 w-5 shrink-0 mt-0.5">{i + 1}</span>
                <p className="flex-1 text-sm text-gray-700 leading-relaxed line-clamp-1 group-hover:text-gray-900">
                  &ldquo;{c.content}&rdquo;
                </p>
                <div className="flex items-center gap-3 shrink-0 ml-2">
                  <span className="text-xs text-gray-400 hidden sm:block">{c.author_name} · <span className="text-purple-600">{c.product_name}</span></span>
                  <div className="flex items-center gap-1 text-xs font-semibold text-rose-500">
                    <Heart className="w-3.5 h-3.5 fill-current" /> {c.likes_count}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Projects Grid ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900">지금 테스트 중인 프로젝트</h2>
          <span className="text-xs text-gray-400">{allProjects.length}개</span>
        </div>
        {allProjects.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            아직 진행 중인 프로젝트가 없어요.{" "}
            <Link href="/experiments/new" className="text-purple-600 font-medium hover:underline">첫 번째로 등록해보세요!</Link>
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
