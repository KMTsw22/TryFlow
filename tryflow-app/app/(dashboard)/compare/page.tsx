"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  TrendingUp, TrendingDown, Minus, ArrowRight,
  CheckCircle2, Circle, GitCompare, Trophy, ArrowLeft, Search,
} from "lucide-react";

interface Report {
  viability_score: number;
  saturation_level: string;
  trend_direction: string;
  similar_count: number;
  summary: string;
}

interface Idea {
  id: string;
  category: string;
  target_user: string;
  description: string;
  created_at: string;
  insight_reports: Report | Report[] | null;
}

function getReport(idea: Idea): Report | null {
  if (!idea.insight_reports) return null;
  if (Array.isArray(idea.insight_reports)) return idea.insight_reports[0] ?? null;
  return idea.insight_reports;
}

const TREND_PILL: Record<string, string> = {
  Rising:    "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
  Stable:    "bg-amber-500/15 text-amber-400 border border-amber-500/20",
  Declining: "bg-red-500/15 text-red-400 border border-red-500/20",
};

const SAT_PILL: Record<string, string> = {
  Low:    "bg-indigo-500/15 text-indigo-300 border border-indigo-500/20",
  Medium: "bg-violet-500/15 text-violet-300 border border-violet-500/20",
  High:   "bg-orange-500/15 text-orange-300 border border-orange-500/20",
};

const TREND_ICON: Record<string, typeof TrendingUp> = {
  Rising: TrendingUp, Stable: Minus, Declining: TrendingDown,
};

const CATEGORIES = [
  "All", "SaaS / B2B", "Consumer App", "Marketplace", "Dev Tools",
  "Health & Wellness", "Education", "Fintech", "E-commerce", "Hardware",
];

function ScoreCircle({ score }: { score: number }) {
  const color = score >= 70 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";
  const textColor = score >= 70 ? "text-emerald-400" : score >= 50 ? "text-amber-400" : "text-red-400";
  const r = 38;
  const circ = 2 * Math.PI * r;
  return (
    <div className="relative w-24 h-24 mx-auto">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - score / 100)} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-2xl font-extrabold leading-none ${textColor}`}>{score}</span>
        <span className="text-[10px] text-gray-600">/100</span>
      </div>
    </div>
  );
}

function truncate(text: string, max: number) {
  return text.length > max ? text.slice(0, max) + "…" : text;
}

function CompareRow({
  label, a, b, winner,
}: {
  label: string;
  a: React.ReactNode;
  b: React.ReactNode;
  winner?: "a" | "b" | null;
}) {
  return (
    <div className="grid grid-cols-[140px_1fr_1fr] border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
      <div className="px-4 py-3.5 flex items-center">
        <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">{label}</span>
      </div>
      <div className={`px-4 py-3.5 flex items-center border-l ${winner === "a" ? "bg-emerald-500/5" : ""}`}
        style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <div className="flex items-center gap-2 w-full">
          {a}
          {winner === "a" && <Trophy className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-auto" />}
        </div>
      </div>
      <div className={`px-4 py-3.5 flex items-center border-l ${winner === "b" ? "bg-emerald-500/5" : ""}`}
        style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <div className="flex items-center gap-2 w-full">
          {b}
          {winner === "b" && <Trophy className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-auto" />}
        </div>
      </div>
    </div>
  );
}

export default function ComparePage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [comparing, setComparing] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    fetch("/api/ideas/all")
      .then((r) => r.json())
      .then((d) => setIdeas(d.ideas ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return ideas.filter((idea) => {
      if (category !== "All" && idea.category !== category) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          idea.description.toLowerCase().includes(q) ||
          idea.target_user.toLowerCase().includes(q) ||
          idea.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [ideas, category, search]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
    setComparing(false);
  }

  const ideaA = ideas.find((i) => i.id === selected[0]);
  const ideaB = ideas.find((i) => i.id === selected[1]);
  const reportA = ideaA ? getReport(ideaA) : null;
  const reportB = ideaB ? getReport(ideaB) : null;
  const scoreA = reportA?.viability_score ?? 0;
  const scoreB = reportB?.viability_score ?? 0;
  const winner: "a" | "b" | null = scoreA > scoreB ? "a" : scoreB > scoreA ? "b" : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Comparison view ──────────────────────────────────────────────────────────
  if (comparing && ideaA && ideaB) {
    const TIconA = TREND_ICON[reportA?.trend_direction ?? "Stable"] ?? Minus;
    const TIconB = TREND_ICON[reportB?.trend_direction ?? "Stable"] ?? Minus;

    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <button onClick={() => setComparing(false)}
              className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors mb-3">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to selection
            </button>
            <h1 className="text-2xl font-extrabold text-white">Idea Comparison</h1>
            <p className="text-sm text-gray-500 mt-1">Side-by-side analysis of two ideas</p>
          </div>
          {winner && (
            <div className="flex items-center gap-2 px-4 py-2 border"
              style={{ background: "rgba(16,185,129,0.08)", borderColor: "rgba(16,185,129,0.2)" }}>
              <Trophy className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-bold text-emerald-400">
                Idea {winner === "a" ? "A" : "B"} leads by {Math.abs(scoreA - scoreB)} pts
              </span>
            </div>
          )}
        </div>

        <div className="border overflow-hidden"
          style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.07)" }}>
          {/* Column headers */}
          <div className="grid grid-cols-[140px_1fr_1fr] border-b"
            style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
            <div className="px-4 py-3" />
            {([["A", ideaA], ["B", ideaB]] as [string, Idea][]).map(([label, idea]) => (
              <div key={label} className="px-4 py-3 border-l" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-500 text-white text-[10px] font-extrabold flex items-center justify-center">
                    {label}
                  </span>
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">{idea.category}</span>
                </div>
                <p className="text-xs text-gray-400 truncate">{idea.target_user}</p>
              </div>
            ))}
          </div>

          <CompareRow label="Viability Score"
            a={<ScoreCircle score={scoreA} />}
            b={<ScoreCircle score={scoreB} />}
            winner={winner}
          />
          <CompareRow label="AI Summary"
            a={<p className="text-xs text-gray-400 leading-relaxed">{reportA?.summary ?? "—"}</p>}
            b={<p className="text-xs text-gray-400 leading-relaxed">{reportB?.summary ?? "—"}</p>}
          />
          <CompareRow label="Idea"
            a={<p className="text-xs text-gray-400 leading-relaxed">{truncate(ideaA.description, 120)}</p>}
            b={<p className="text-xs text-gray-400 leading-relaxed">{truncate(ideaB.description, 120)}</p>}
          />
          <CompareRow label="Market Trend"
            a={
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${TREND_PILL[reportA?.trend_direction ?? "Stable"] ?? TREND_PILL.Stable}`}>
                <TIconA className="w-3 h-3 inline mr-1" />{reportA?.trend_direction ?? "—"}
              </span>
            }
            b={
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${TREND_PILL[reportB?.trend_direction ?? "Stable"] ?? TREND_PILL.Stable}`}>
                <TIconB className="w-3 h-3 inline mr-1" />{reportB?.trend_direction ?? "—"}
              </span>
            }
            winner={
              reportA?.trend_direction === "Rising" && reportB?.trend_direction !== "Rising" ? "a"
              : reportB?.trend_direction === "Rising" && reportA?.trend_direction !== "Rising" ? "b"
              : null
            }
          />
          <CompareRow label="Saturation"
            a={<span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${SAT_PILL[reportA?.saturation_level ?? "Low"] ?? SAT_PILL.Low}`}>{reportA?.saturation_level ?? "—"}</span>}
            b={<span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${SAT_PILL[reportB?.saturation_level ?? "Low"] ?? SAT_PILL.Low}`}>{reportB?.saturation_level ?? "—"}</span>}
            winner={
              reportA?.saturation_level === "Low" && reportB?.saturation_level !== "Low" ? "a"
              : reportB?.saturation_level === "Low" && reportA?.saturation_level !== "Low" ? "b"
              : null
            }
          />
          <CompareRow label="Similar Ideas"
            a={<span className="text-lg font-extrabold text-white">{reportA?.similar_count ?? "—"}<span className="text-xs text-gray-600 font-normal ml-1">/ 30d</span></span>}
            b={<span className="text-lg font-extrabold text-white">{reportB?.similar_count ?? "—"}<span className="text-xs text-gray-600 font-normal ml-1">/ 30d</span></span>}
            winner={
              (reportA?.similar_count ?? 0) < (reportB?.similar_count ?? 0) ? "a"
              : (reportB?.similar_count ?? 0) < (reportA?.similar_count ?? 0) ? "b"
              : null
            }
          />
          <div className="grid grid-cols-[140px_1fr_1fr]">
            <div className="px-4 py-4" />
            {([ideaA, ideaB] as Idea[]).map((idea, idx) => (
              <div key={idea.id} className="px-4 py-4 border-l" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                <Link href={`/ideas/${idea.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
                  View full report {idx === 0 ? "A" : "B"} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>

        {winner && (
          <div className="mt-6 p-5 border"
            style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.07))", borderColor: "rgba(129,140,248,0.2)" }}>
            <div className="flex items-start gap-3">
              <Trophy className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-white mb-1">
                  Idea {winner === "a" ? "A" : "B"} shows stronger potential
                </p>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {winner === "a" ? reportA?.summary : reportB?.summary}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Selection view ───────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Compare Ideas</h1>
          <p className="text-sm text-gray-500 mt-1">
            {ideas.length} ideas available · Select 2 to compare
          </p>
        </div>
        {selected.length === 2 && (
          <button onClick={() => setComparing(true)}
            className="inline-flex items-center gap-2 bg-indigo-500 text-white font-bold px-5 py-2.5 text-sm hover:bg-indigo-400 transition-colors">
            <GitCompare className="w-4 h-4" /> Compare now
          </button>
        )}
      </div>

      {/* Selection bar */}
      <div className="flex items-center gap-3 mb-5">
        {[0, 1].map((i) => {
          const selIdea = ideas.find((x) => x.id === selected[i]);
          return (
            <div key={i} className="flex items-center gap-2 px-3 py-2 border flex-1"
              style={{ borderColor: selIdea ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.07)", background: selIdea ? "rgba(99,102,241,0.08)" : "rgba(255,255,255,0.02)" }}>
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold text-white shrink-0"
                style={{ background: selIdea ? "#6366f1" : "rgba(255,255,255,0.1)" }}>
                {String.fromCharCode(65 + i)}
              </span>
              {selIdea ? (
                <span className="text-xs font-medium text-gray-300 truncate">{truncate(selIdea.description, 45)}</span>
              ) : (
                <span className="text-xs text-gray-600">Pick idea {String.fromCharCode(65 + i)}</span>
              )}
            </div>
          );
        })}
        {selected.length === 2 ? (
          <button onClick={() => setComparing(true)}
            className="shrink-0 inline-flex items-center gap-2 bg-indigo-500 text-white font-bold px-4 py-2 text-sm hover:bg-indigo-400 transition-colors">
            <GitCompare className="w-4 h-4" /> Compare
          </button>
        ) : (
          <div className="shrink-0 px-4 py-2 text-xs text-gray-600 border" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            {selected.length}/2 selected
          </div>
        )}
      </div>

      {/* Search + category filter */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
          <input
            type="text"
            placeholder="Search ideas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm text-gray-300 placeholder-gray-600 border outline-none focus:border-indigo-500/50 transition-colors"
            style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.07)" }}
          />
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`px-2.5 py-1 text-[11px] font-bold border transition-colors ${
                category === cat
                  ? "text-indigo-300 border-indigo-500/40 bg-indigo-500/10"
                  : "text-gray-600 border-transparent hover:text-gray-400"
              }`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Ideas list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 border"
          style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
          <p className="text-gray-600 text-sm">No ideas match your filter.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((idea) => {
            const report = getReport(idea);
            const isSelected = selected.includes(idea.id);
            const selIdx = selected.indexOf(idea.id);
            const vScore = report?.viability_score ?? null;
            const vColor = !vScore ? "text-gray-500"
              : vScore >= 70 ? "text-emerald-400"
              : vScore >= 50 ? "text-amber-400" : "text-red-400";
            const vRing = !vScore ? "border-gray-700/40 bg-gray-700/10"
              : vScore >= 70 ? "border-emerald-500/30 bg-emerald-500/10"
              : vScore >= 50 ? "border-amber-500/30 bg-amber-500/10"
              : "border-red-500/30 bg-red-500/10";
            const date = new Date(idea.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });

            return (
              <button key={idea.id} onClick={() => toggleSelect(idea.id)}
                className="w-full text-left border p-4 transition-all duration-150 hover:bg-white/[0.04]"
                style={{
                  background: isSelected ? "rgba(99,102,241,0.06)" : "rgba(255,255,255,0.03)",
                  borderColor: isSelected ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.07)",
                }}>
                <div className="flex items-center gap-4">
                  {/* Select indicator */}
                  <div className="shrink-0">
                    {isSelected ? (
                      <div className="relative">
                        <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-indigo-500 text-white text-[9px] font-extrabold flex items-center justify-center">
                          {String.fromCharCode(65 + selIdx)}
                        </span>
                      </div>
                    ) : (
                      <Circle className="w-5 h-5 text-gray-700" />
                    )}
                  </div>

                  {/* Score badge */}
                  <div className={`flex flex-col items-center justify-center w-11 h-11 rounded-full border shrink-0 ${vRing}`}>
                    {vScore !== null ? (
                      <>
                        <span className={`text-sm font-extrabold leading-none ${vColor}`}>{vScore}</span>
                        <span className="text-[8px] text-gray-600 leading-none mt-0.5">/100</span>
                      </>
                    ) : (
                      <span className="text-gray-600 text-xs">—</span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">{idea.category}</span>
                      <span className="text-[10px] text-gray-600">{date}</span>
                      {report && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${TREND_PILL[report.trend_direction] ?? TREND_PILL.Stable}`}>
                          {report.trend_direction}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-gray-300 mb-0.5">For: {idea.target_user}</p>
                    {/* 1-line differentiation */}
                    <p className="text-xs text-gray-600 truncate">{idea.description}</p>
                  </div>

                  {/* AI summary 1-liner (md+) */}
                  {report?.summary && (
                    <div className="hidden lg:block w-56 shrink-0">
                      <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2">{report.summary}</p>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}