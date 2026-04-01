import Link from "next/link";
import { Plus, FlaskConical } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  RUNNING: { label: "Running", bg: "bg-green-50",  text: "text-green-700",  dot: "bg-green-500" },
  PAUSED:  { label: "Paused",  bg: "bg-amber-50",  text: "text-amber-700",  dot: "bg-amber-500" },
  ENDED:   { label: "Ended",   bg: "bg-gray-100",  text: "text-gray-600",   dot: "bg-gray-400" },
  DRAFT:   { label: "Draft",   bg: "bg-blue-50",   text: "text-blue-600",   dot: "bg-blue-400" },
};

export default async function ExperimentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: experiments } = await supabase
    .from("experiments")
    .select("id, slug, product_name, status, total_visitors, pricing_tiers, created_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Experiments</h1>
          <p className="text-gray-500 mt-1">Manage and monitor all your validation experiments</p>
        </div>
        <Link href="/experiments/new"
          className="flex items-center gap-2 bg-teal-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-teal-600 transition-colors">
          <Plus className="w-4 h-4" /> New Experiment
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Name</th>
              <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
              <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Visitors</th>
              <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Pricing</th>
              <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Date</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody>
            {experiments && experiments.length > 0 ? (
              experiments.map((exp) => {
                const s = STATUS_CONFIG[exp.status] ?? STATUS_CONFIG.DRAFT;
                const tiers = (exp.pricing_tiers as { name: string; price: string }[]) ?? [];
                const date = new Date(exp.created_at).toLocaleDateString("en-US", {
                  month: "short", day: "numeric", year: "numeric",
                });
                return (
                  <tr key={exp.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-teal-100 flex items-center justify-center">
                          <FlaskConical className="w-3.5 h-3.5 text-teal-600" />
                        </div>
                        <Link href={`/experiments/${exp.id}`} className="font-medium text-gray-900 hover:text-teal-600 transition-colors">
                          {exp.product_name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                        {s.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{exp.total_visitors.toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-600 text-xs">
                      {tiers.map(t => `$${t.price}`).join(" / ") || "—"}
                    </td>
                    <td className="px-6 py-4 text-gray-500">{date}</td>
                    <td className="px-6 py-4">
                      <Link href={`/experiments/${exp.id}`} className="text-xs text-teal-600 font-medium hover:underline">
                        View →
                      </Link>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center">
                  <p className="text-gray-400 text-sm mb-3">No experiments yet</p>
                  <Link href="/experiments/new"
                    className="inline-flex items-center gap-2 bg-teal-500 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-teal-600">
                    <Plus className="w-3.5 h-3.5" /> Create your first experiment
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
