import Link from "next/link";
import { Zap, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

const FILTERS = ["All", "SaaS", "Productivity", "Analytics", "Creative Tools", "Developer Experiment"];

// 상태별 배지 스타일
const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  RUNNING: { label: "Running", bg: "bg-green-50",  text: "text-green-700",  dot: "bg-green-500" },
  PAUSED:  { label: "Paused",  bg: "bg-amber-50",  text: "text-amber-700",  dot: "bg-amber-500" },
  ENDED:   { label: "Ended",   bg: "bg-gray-100",  text: "text-gray-600",   dot: "bg-gray-400" },
};

export default async function ExplorePage() {
  const supabase = await createClient();

  // RUNNING 상태의 실험만 공개 조회 (RLS: public read running experiments)
  const { data: experiments } = await supabase
    .from("experiments")
    .select("id, slug, product_name, description, status, total_visitors, pricing_tiers, created_at")
    .eq("status", "RUNNING")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-white font-['Inter']">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-sm">TryFlow</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-500 font-medium">
            <Link href="/explore" className="text-purple-700 font-semibold">Experiments</Link>
            <Link href="#"        className="hover:text-gray-900">Benchmarks</Link>
            <Link href="#"        className="hover:text-gray-900">Academy</Link>
            <Link href="/pricing" className="hover:text-gray-900">Pricing</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login"  className="text-sm font-medium text-gray-600 hover:text-gray-900">Log in</Link>
            <Link href="/signup" className="bg-gradient-primary text-white text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="pt-14 pb-10 px-6 text-center">
        <h1 className="text-4xl font-extrabold text-gray-900">Explore Pricing Experiments</h1>
        <p className="text-gray-500 mt-3 text-sm max-w-md mx-auto leading-relaxed">
          Test products and help founders improve pricing. Analyze tiered models, optimize conversions, and earn your insights.
        </p>
      </section>

      {/* Filters */}
      <div className="px-6 pb-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-2 flex-wrap">
          {FILTERS.map((f, i) => (
            <button
              key={f}
              className={`text-sm font-medium px-4 py-1.5 rounded-full border transition-colors ${
                i === 0
                  ? "bg-gray-900 text-white border-gray-900"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="max-w-6xl mx-auto px-6 pb-20">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Name</th>
                <th className="text-left px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Status</th>
                <th className="text-left px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Visitors</th>
                <th className="text-left px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Pricing Tiers</th>
                <th className="text-left px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Date</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {experiments && experiments.length > 0 ? (
                experiments.map((exp) => {
                  const s = STATUS_CONFIG[exp.status] ?? STATUS_CONFIG.RUNNING;
                  const tiers = (exp.pricing_tiers as { name: string; price: string }[]) ?? [];
                  const date = new Date(exp.created_at).toLocaleDateString("en-US", {
                    month: "short", day: "numeric", year: "numeric",
                  });

                  return (
                    <tr key={exp.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center">
                            <Zap className="w-3.5 h-3.5 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{exp.product_name}</p>
                            <p className="text-xs text-gray-400 mt-0.5 max-w-xs truncate">{exp.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                          {s.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">
                        {exp.total_visitors.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {tiers.slice(0, 3).map((t) => (
                            <div key={t.name} className="text-center">
                              <p className="text-[10px] text-gray-400">{t.name}</p>
                              <p className="text-xs font-bold text-gray-900">${t.price}</p>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-xs">{date}</td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/${exp.slug}`}
                          className="flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-700 whitespace-nowrap"
                          data-testid={`explore-test-${exp.slug}`}
                        >
                          Test Pricing <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-gray-400 text-sm">
                    No running experiments yet. Be the first to launch one!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Don't see your niche */}
        <div className="bg-gray-900 rounded-2xl p-12 mt-8 text-center">
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-white">Don&apos;t see your niche?</h2>
            <p className="text-gray-400 text-sm mt-2 leading-relaxed">
              We&apos;re constantly adding new experiments. Submit a product niche you&apos;re interested in testing.
            </p>
            <div className="flex gap-2 mt-6 max-w-sm mx-auto">
              <input
                placeholder="Enter your niche..."
                className="flex-1 h-11 px-4 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button className="bg-gradient-primary text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:opacity-90 whitespace-nowrap">
                Notify Me
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-6 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-gray-400">
          <span className="font-bold text-gray-700 text-sm">TryFlow Digital Curator</span>
          <div className="flex gap-5">
            {["Terms of Service","Privacy Policy","Custom Status","Security","Support"].map(l => (
              <Link key={l} href="#" className="hover:text-gray-600">{l}</Link>
            ))}
          </div>
          <span>© 2024 TryFlow Inc.</span>
        </div>
      </footer>
    </div>
  );
}
