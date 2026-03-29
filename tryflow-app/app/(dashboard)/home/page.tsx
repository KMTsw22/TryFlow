import Link from "next/link";
import { Zap, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

const FILTERS = ["All", "SaaS", "Productivity", "Analytics", "Creative Tools", "Developer Experience"];

const TIER_COLORS = [
  "text-gray-500",
  "text-purple-600 font-bold",
  "text-gray-500",
];

const BADGE_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  0: { label: "TRENDING",    bg: "bg-red-500",    text: "text-white" },
  1: { label: "HIGH PAYING", bg: "bg-purple-600", text: "text-white" },
  2: { label: "NEW",         bg: "bg-gray-200",   text: "text-gray-700" },
};

const ICON_COLORS = [
  "bg-purple-100 text-purple-600",
  "bg-blue-100 text-blue-600",
  "bg-orange-100 text-orange-500",
  "bg-green-100 text-green-600",
  "bg-pink-100 text-pink-600",
  "bg-cyan-100 text-cyan-600",
];

export default async function HomePage() {
  const supabase = await createClient();

  const { data: experiments } = await supabase
    .from("experiments")
    .select("id, slug, product_name, description, status, total_visitors, pricing_tiers, created_at")
    .eq("status", "RUNNING")
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-[1100px] mx-auto space-y-7">
      {/* Header */}
      <div>
        <h1 className="text-[28px] font-bold text-gray-900">Explore Experiments</h1>
        <p className="text-sm text-gray-500 mt-1">
          Test products and help founders improve pricing. Analyze tiered models and optimize conversions.
        </p>
      </div>

      {/* Filters */}
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

      {/* Card Grid */}
      {experiments && experiments.length > 0 ? (
        <div className="grid grid-cols-3 gap-5">
          {experiments.map((exp, idx) => {
            const tiers = (exp.pricing_tiers as { name: string; price: string }[]) ?? [];
            const iconColor = ICON_COLORS[idx % ICON_COLORS.length];
            const badge = BADGE_CONFIG[idx % 3];
            const initial = exp.product_name[0]?.toUpperCase() ?? "?";

            return (
              <div key={exp.id} className="bg-white rounded-2xl border border-gray-100 p-5 card-shadow flex flex-col gap-4 relative">
                {/* Badge */}
                <span className={`absolute top-4 right-4 text-[10px] font-bold px-2.5 py-1 rounded-full ${badge.bg} ${badge.text}`}>
                  {badge.label}
                </span>

                {/* Icon + Name */}
                <div className="flex items-start gap-3 pr-20">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${iconColor}`}>
                    {initial}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm leading-tight">{exp.product_name}</p>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed line-clamp-2">{exp.description || "No description provided."}</p>
                  </div>
                </div>

                {/* Pricing Tiers */}
                {tiers.length > 0 && (
                  <div className="flex items-center gap-4 border-t border-gray-50 pt-3">
                    {tiers.slice(0, 3).map((t, ti) => (
                      <div key={t.name} className="flex flex-col items-center">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">{t.name}</span>
                        <span className={`text-sm mt-0.5 ${TIER_COLORS[ti] ?? "text-gray-600"}`}>${t.price}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* CTA */}
                <Link
                  href={`/${exp.slug}`}
                  className="flex items-center justify-center gap-2 w-full bg-gradient-primary text-white text-sm font-semibold py-2.5 rounded-xl hover:opacity-90 transition-opacity"
                >
                  Test Pricing <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 card-shadow py-20 text-center">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto mb-4">
            <Zap className="w-6 h-6 text-purple-400" />
          </div>
          <p className="text-gray-500 text-sm font-medium">No running experiments yet</p>
          <p className="text-gray-400 text-xs mt-1">Be the first to launch one!</p>
          <Link href="/experiments/new"
            className="inline-flex items-center gap-2 mt-5 bg-gradient-primary text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-90">
            Create Experiment
          </Link>
        </div>
      )}

      {/* Don't see your niche */}
      <div className="bg-gray-900 rounded-2xl p-10 text-center">
        <h2 className="text-xl font-bold text-white">Don&apos;t see your niche?</h2>
        <p className="text-gray-400 text-sm mt-2 leading-relaxed">
          We&apos;re constantly adding new experiments. Submit a product niche you&apos;re interested in testing.
        </p>
        <div className="flex gap-2 mt-5 max-w-sm mx-auto">
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
  );
}
