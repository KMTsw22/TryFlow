"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, MessageSquare, ArrowRight, Loader2, ExternalLink } from "lucide-react";

const CATEGORY_STYLE: Record<string, { bg: string; text: string; border: string; emoji: string; cardAccent: string; accent: string }> = {
  SaaS:        { bg: "bg-violet-100", text: "text-violet-700", border: "border-violet-300", emoji: "⚡", cardAccent: "from-violet-50 to-white",  accent: "border-t-2 border-t-violet-400" },
  Marketplace: { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-300", emoji: "🛒", cardAccent: "from-orange-50 to-white",  accent: "border-t-2 border-t-orange-400" },
  Consumer:    { bg: "bg-blue-100",   text: "text-blue-700",   border: "border-blue-300",   emoji: "📱", cardAccent: "from-blue-50 to-white",    accent: "border-t-2 border-t-blue-400" },
  "Dev Tools": { bg: "bg-slate-100",  text: "text-slate-700",  border: "border-slate-300",  emoji: "🛠️", cardAccent: "from-slate-50 to-white",   accent: "border-t-2 border-t-slate-400" },
  Health:      { bg: "bg-emerald-100",text: "text-emerald-700",border: "border-emerald-300",emoji: "💚", cardAccent: "from-emerald-50 to-white", accent: "border-t-2 border-t-emerald-400" },
  Education:   { bg: "bg-indigo-100", text: "text-indigo-700", border: "border-indigo-300", emoji: "📚", cardAccent: "from-indigo-50 to-white",  accent: "border-t-2 border-t-indigo-400" },
  Social:      { bg: "bg-pink-100",   text: "text-pink-700",   border: "border-pink-300",   emoji: "💬", cardAccent: "from-pink-50 to-white",    accent: "border-t-2 border-t-pink-400" },
  Other:       { bg: "bg-gray-100",   text: "text-gray-600",   border: "border-gray-300",   emoji: "🔬", cardAccent: "from-gray-50 to-white",    accent: "border-t-2 border-t-gray-300" },
  HealthTech:  { bg: "bg-emerald-100",text: "text-emerald-700",border: "border-emerald-300",emoji: "💚", cardAccent: "from-emerald-50 to-white", accent: "border-t-2 border-t-emerald-400" },
  EdTech:      { bg: "bg-indigo-100", text: "text-indigo-700", border: "border-indigo-300", emoji: "📚", cardAccent: "from-indigo-50 to-white",  accent: "border-t-2 border-t-indigo-400" },
  FoodTech:    { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-300", emoji: "🛒", cardAccent: "from-orange-50 to-white",  accent: "border-t-2 border-t-orange-400" },
  Community:   { bg: "bg-pink-100",   text: "text-pink-700",   border: "border-pink-300",   emoji: "💬", cardAccent: "from-pink-50 to-white",    accent: "border-t-2 border-t-pink-400" },
};

export interface ProjectData {
  id: string;
  slug: string;
  product_name: string;
  description: string;
  category: string;
  maker_name: string;
  project_url?: string;
  total_visitors: number;
  comment_count: number;
  pricing_slider?: { paymentType?: string; min?: number; max?: number };
}

export function ProjectCard({ project }: { project: ProjectData }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const cat = CATEGORY_STYLE[project.category] ?? CATEGORY_STYLE.Other;
  const slider = project.pricing_slider;
  const hasSlider = slider && slider.min !== undefined && slider.max !== undefined;
  const suffix = slider?.paymentType === "monthly" ? "/mo" : "";

  function handleCommunity() {
    setLoading(true);
    router.push(`/${project.slug}`);
  }

  return (
    <div className={`bg-gradient-to-b ${cat.cardAccent} rounded-2xl border border-gray-200 ${cat.accent} p-5 flex flex-col gap-4 hover:shadow-md transition-all shadow-sm`}>

      {/* Top row */}
      <div className="flex items-center justify-between">
        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${cat.bg} ${cat.text} ${cat.border}`}>
          <span>{cat.emoji}</span> {project.category}
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          Live
        </span>
      </div>

      {/* Name + maker + description */}
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg ${cat.bg}`}>
          {cat.emoji}
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-gray-900 text-base leading-tight">{project.product_name}</h3>
          {project.maker_name && (
            <p className="text-xs text-gray-400 mt-0.5">{project.maker_name}</p>
          )}
          {project.description && (
            <p className="text-xs text-gray-500 leading-relaxed mt-1.5 line-clamp-2">
              {project.description}
            </p>
          )}
        </div>
      </div>

      {/* Pricing visual */}
      {hasSlider ? (
        <div className={`rounded-xl border ${cat.border} ${cat.bg} px-4 py-3`}>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
            Willingness to Pay
          </p>
          <div className="flex items-center justify-between">
            <span className={`text-lg font-extrabold ${cat.text}`}>${slider!.min}</span>
            <div className="flex-1 mx-3 relative h-1.5 bg-white/60 rounded-full overflow-hidden">
              <div className={`absolute inset-y-0 left-0 w-1/2 rounded-full opacity-50 ${cat.bg}`} style={{ background: "currentColor" }} />
            </div>
            <span className={`text-lg font-extrabold ${cat.text}`}>${slider!.max}{suffix}</span>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white/50 px-4 py-3">
          <p className="text-[10px] font-semibold text-gray-300 uppercase tracking-wider mb-1">No pricing set</p>
          <p className="text-xs text-gray-300">—</p>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-gray-100 pt-3 space-y-2">
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{project.total_visitors.toLocaleString()}</span>
          <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{project.comment_count}</span>
        </div>
        <div className="flex items-center gap-2">
          {project.project_url ? (
            <a
              href={project.project_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-700 transition-colors"
            >
              <ExternalLink className="w-3 h-3" /> Try it
            </a>
          ) : (
            <div className="flex-1" />
          )}
          <button
            onClick={handleCommunity}
            disabled={loading}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-all border ${
              loading
                ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                : `${cat.bg} ${cat.text} ${cat.border} hover:opacity-80`
            }`}
          >
            {loading
              ? <><Loader2 className="w-3 h-3 animate-spin" /> Loading...</>
              : <><MessageSquare className="w-3 h-3" /> Community <ArrowRight className="w-3 h-3" /></>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
