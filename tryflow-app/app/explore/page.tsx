import Link from "next/link";
import { Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { type ProjectData } from "@/components/explore/ProjectCard";
import { ExploreGrid } from "@/components/explore/ExploreGrid";

export default async function ExplorePage() {
  const supabase = await createClient();

  const { data: dbExperiments } = await supabase
    .from("experiments")
    .select("id, slug, product_name, description, status, total_visitors, pricing_tiers, category, maker_name, project_url")
    .eq("status", "RUNNING")
    .order("total_visitors", { ascending: false });

  const projects: ProjectData[] = (dbExperiments ?? []).map((e: {
    id: string; slug: string; product_name: string; description: string;
    total_visitors: number; pricing_tiers: { name: string; price: string }[];
    category?: string; maker_name?: string; project_url?: string;
  }) => ({
    id: e.id, slug: e.slug, product_name: e.product_name, description: e.description,
    category: e.category ?? "Other", maker_name: e.maker_name ?? "",
    project_url: e.project_url ?? "",
    total_visitors: e.total_visitors, comment_count: 0, pricing_tiers: e.pricing_tiers ?? [],
  }));

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-['Inter']">
      {/* Header */}
      <section className="pt-12 pb-8 px-6 text-center">
        <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
          <Sparkles className="w-3 h-3" />
          Pre-launch playground
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900">Try student projects before they launch</h1>
        <p className="text-gray-500 mt-3 text-sm max-w-lg mx-auto leading-relaxed">
          These products haven&apos;t shipped yet. Try them out and leave honest feedback — it directly helps the maker improve.
        </p>
      </section>

      <ExploreGrid projects={projects} />

      {/* Footer */}
      <footer className="border-t border-gray-100 py-6 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-gray-400">
          <Link href="/" className="font-bold text-gray-700 text-sm hover:text-gray-900">try.wepp</Link>
          <div className="flex gap-5">
            {["Terms", "Privacy", "Support"].map(l => (
              <Link key={l} href="#" className="hover:text-gray-600">{l}</Link>
            ))}
          </div>
          <span>© 2026 try.wepp</span>
        </div>
      </footer>
    </div>
  );
}
