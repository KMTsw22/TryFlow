import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { IdeaCardWithContact } from "@/components/vc/IdeaCardWithContact";

const CATEGORIES = [
  "SaaS / B2B", "Consumer App", "Marketplace", "Dev Tools",
  "Health & Wellness", "Education", "Fintech", "E-commerce", "Hardware",
];

interface InsightReport {
  viability_score: number;
  saturation_level: string;
  trend_direction: string;
  summary: string;
}

interface AnalysisReport {
  viability_score: number;
}

interface IdeaRow {
  id: string;
  category: string;
  target_user: string;
  description: string;
  created_at: string;
  user_id: string | null;
  allow_contact: boolean;
  insight_reports: InsightReport | InsightReport[] | null;
  analysis_reports: AnalysisReport | AnalysisReport[] | null;
}

export default async function CategoryIdeasPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: rawCategory } = await params;
  const category = decodeURIComponent(rawCategory);

  if (!CATEGORIES.includes(category)) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Guard: require active subscription
  if (!user) redirect("/login?next=/explore");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("viewer_plan")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.viewer_plan !== "pro") redirect("/pricing");

  const { data } = await supabase
    .from("idea_submissions")
    .select(`
      id, category, target_user, description, created_at, user_id,
      insight_reports (viability_score, saturation_level, trend_direction, summary),
      analysis_reports (viability_score)
    `)
    .eq("category", category)
    .eq("is_private", false)
    .order("created_at", { ascending: false });

  const rawIdeas = (data ?? []) as Omit<IdeaRow, "allow_contact">[];

  // Fetch allow_contact from user_profiles for each submitter
  const userIds = [...new Set(rawIdeas.map((i) => i.user_id).filter(Boolean))] as string[];
  const { data: profiles } = userIds.length > 0
    ? await supabase
        .from("user_profiles")
        .select("id, allow_contact")
        .in("id", userIds)
    : { data: [] };

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.allow_contact]));

  const ideas: IdeaRow[] = rawIdeas.map((idea) => ({
    ...idea,
    allow_contact: idea.user_id ? (profileMap.get(idea.user_id) ?? false) : false,
  }));

  return (
    <div className="min-h-screen" style={{ background: "#050816" }}>
      {/* Navbar */}
      <nav
        className="border-b px-6 h-[60px] flex items-center justify-between"
        style={{ background: "rgba(5,8,22,0.95)", borderColor: "rgba(255,255,255,0.06)", backdropFilter: "blur(12px)" }}
      >
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png" className="w-7 h-7" alt="Try.Wepp" />
          <span className="font-bold text-white text-sm">Try.Wepp</span>
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">Dashboard</Link>
          ) : (
            <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">Sign in</Link>
          )}
          <Link href="/submit" className="bg-indigo-500 text-white text-sm font-bold px-4 py-2 hover:bg-indigo-400 transition-colors">
            Submit idea →
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Back + header */}
        <div className="mb-10">
          <Link
            href="/explore"
            className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors mb-6"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Trends
          </Link>
          <p className="text-xs font-bold tracking-widest text-indigo-400 uppercase mb-2">Anonymous Ideas</p>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">{category}</h1>
          <p className="mt-3 text-gray-400 text-base">
            {ideas.length} idea{ideas.length !== 1 ? "s" : ""} submitted · All anonymous · Newest first
          </p>
        </div>

        {/* Grid */}
        {ideas.length === 0 ? (
          <div
            className="text-center py-20 border"
            style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)" }}
          >
            <p className="text-gray-500 text-sm mb-5">No ideas in this category yet.</p>
            <Link
              href="/submit"
              className="inline-flex items-center gap-2 bg-indigo-500 text-white font-bold px-5 py-2.5 text-sm hover:bg-indigo-400 transition-colors"
            >
              Be the first <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ideas.map((idea) => (
              <IdeaCardWithContact
                key={idea.id}
                idea={idea}
                isSubscriber={true}
              />
            ))}
          </div>
        )}

        {/* CTA */}
        <div
          className="mt-10 p-8 text-center border"
          style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))", borderColor: "rgba(129,140,248,0.2)" }}
        >
          <p className="text-xs font-bold tracking-widest text-indigo-400 uppercase mb-3">Add your signal</p>
          <h3 className="text-xl font-extrabold text-white mb-2">
            The more ideas submitted, the sharper the trends.
          </h3>
          <p className="text-sm text-gray-400 mb-5 max-w-sm mx-auto">
            Your anonymous submission helps every founder see where the market is heading.
          </p>
          <Link
            href="/submit"
            className="inline-flex items-center gap-2 bg-indigo-500 text-white font-bold px-6 py-3 text-sm hover:bg-indigo-400 transition-colors"
          >
            Submit your idea <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}