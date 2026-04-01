"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { ProjectCard, type ProjectData } from "./ProjectCard";

const FILTERS = ["All", "SaaS", "Marketplace", "Consumer", "Dev Tools", "Health", "Education", "Social"];
const FILTER_EMOJI: Record<string, string> = {
  SaaS: "⚡", Marketplace: "🛒", Consumer: "📱", "Dev Tools": "🛠️",
  Health: "💚", Education: "📚", Social: "💬",
};
const FILTER_STYLE: Record<string, string> = {
  SaaS:        "bg-violet-600 text-white border-violet-600",
  Marketplace: "bg-orange-500 text-white border-orange-500",
  Consumer:    "bg-blue-500 text-white border-blue-500",
  "Dev Tools": "bg-slate-600 text-white border-slate-600",
  Health:      "bg-emerald-500 text-white border-emerald-500",
  Education:   "bg-indigo-500 text-white border-indigo-500",
  Social:      "bg-pink-500 text-white border-pink-500",
};

// Map legacy category names to canonical ones for filtering
const CATEGORY_ALIAS: Record<string, string> = {
  HealthTech: "Health",
  EdTech:     "Education",
  FoodTech:   "Marketplace",
  Community:  "Social",
};

interface Props {
  projects: ProjectData[];
}

export function ExploreGrid({ projects }: Props) {
  const [active, setActive] = useState("All");

  const filtered = active === "All"
    ? projects
    : projects.filter(p => {
        const cat = CATEGORY_ALIAS[p.category] ?? p.category;
        return cat === active;
      });

  return (
    <>
      {/* Filters */}
      <div className="px-6 pb-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-2 flex-wrap">
          {FILTERS.map((f) => {
            const isActive = f === active;
            const colorClass = isActive
              ? (f === "All" ? "bg-gray-900 text-white border-gray-900" : FILTER_STYLE[f])
              : "border-gray-200 text-gray-600 hover:bg-gray-50 bg-white";
            return (
              <button
                key={f}
                onClick={() => setActive(f)}
                className={`text-sm font-semibold px-4 py-1.5 rounded-full border transition-all ${colorClass}`}
              >
                {FILTER_EMOJI[f] && <span className="mr-1">{FILTER_EMOJI[f]}</span>}
                {f}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto px-6 pb-20">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <Sparkles className="w-10 h-10 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">No {active} projects yet</p>
            <p className="text-gray-400 text-sm mt-1">Be the first to submit one!</p>
            <Link href="/signup" className="inline-flex items-center gap-2 mt-5 bg-teal-500 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-teal-600">
              Submit My Project <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}

        {filtered.length > 0 && (
          <div className="bg-gray-900 rounded-2xl p-10 mt-8 text-center">
            <h2 className="text-2xl font-bold text-white">Have an idea to validate?</h2>
            <p className="text-gray-400 text-sm mt-2 max-w-sm mx-auto leading-relaxed">
              Build a landing page in 5 minutes and get real user feedback before writing a single line of code.
            </p>
            <Link href="/signup" className="inline-flex items-center gap-2 mt-6 bg-teal-500 text-white text-sm font-semibold px-6 py-3 rounded-lg hover:bg-teal-600">
              Submit Your Project Free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
