"use client";

import { useEffect, useState, useMemo } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  TrendingUp, TrendingDown, Minus, ArrowRight,
  GitCompare, Trophy, ArrowLeft, Search, Lock,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { TrendLabel, type TrendDirection } from "@/components/ui/TrendLabel";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ResponsiveContainer, Legend,
} from "recharts";

interface AgentScore {
  score: number;
  reasoning?: string;
}

interface Analysis {
  market_size?: AgentScore;
  competition?: AgentScore;
  timing?: AgentScore;
  monetization?: AgentScore;
  technical_difficulty?: AgentScore;
  regulation?: AgentScore;
  defensibility?: AgentScore;
  user_acquisition?: AgentScore;
}

interface Report {
  viability_score: number;
  saturation_level: string;
  trend_direction: string;
  similar_count: number;
  summary: string;
  analysis?: Analysis;
}

const AGENT_LABELS: Record<string, string> = {
  market_size:          "Market",
  competition:          "Competition",
  timing:               "Timing",
  monetization:         "Monetization",
  technical_difficulty: "Technical",
  regulation:           "Regulation",
  defensibility:        "Defensibility",
  user_acquisition:     "Acquisition",
};

// Custom axis tick: label + A score (indigo) · B score (emerald)
function DualAxisTick(props: {
  x?: number; y?: number; payload?: { value: string };
  textAnchor?: "inherit" | "end" | "start" | "middle";
  data: { subject: string; A: number; B: number }[];
  isDark?: boolean;
}) {
  const { x = 0, y = 0, payload, textAnchor = "middle", data, isDark = true } = props;
  const entry = data.find((d) => d.subject === payload?.value);
  const labelFill = isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.55)";
  const sepFill = isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.25)";
  return (
    <g>
      <text x={x} y={y} textAnchor={textAnchor}
        fill={labelFill} fontSize={11} fontWeight={700}>
        {payload?.value}
      </text>
      <text x={x} y={y + 16} textAnchor={textAnchor} fontSize={11} fontWeight={800}>
        <tspan fill="#818cf8">{entry?.A ?? 0}</tspan>
        <tspan fill={sepFill}> · </tspan>
        <tspan fill="#34d399">{entry?.B ?? 0}</tspan>
      </text>
    </g>
  );
}

function DualRadar({ analysisA, analysisB }: { analysisA: Analysis | null; analysisB: Analysis | null }) {
  const [visible, setVisible] = useState(false);
  const { isDark } = useTheme();

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  const data = Object.keys(AGENT_LABELS).map((key) => ({
    subject: AGENT_LABELS[key],
    A: analysisA?.[key as keyof Analysis]?.score ?? 0,
    B: analysisB?.[key as keyof Analysis]?.score ?? 0,
  }));

  const hasData = data.some((d) => d.A > 0 || d.B > 0);
  if (!hasData) return null;

  const avgA = Math.round(data.reduce((s, d) => s + d.A, 0) / data.length);
  const avgB = Math.round(data.reduce((s, d) => s + d.B, 0) / data.length);

  return (
    <div className="border mb-6 overflow-hidden"
      style={{
        background: "var(--card-bg)",
        borderColor: "var(--t-border-bright)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        transition: "opacity 0.5s ease, transform 0.5s ease",
      }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-3"
        style={{ borderBottom: "1px solid var(--t-border-subtle)" }}>
        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
          8-Agent Radar Comparison
        </p>
        {/* Avg score badges */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
            <span className="text-xs text-gray-400 dark:text-gray-500">A avg</span>
            {analysisA
              ? <span className="text-xs font-extrabold text-indigo-500 dark:text-indigo-300">{avgA}</span>
              : <span className="text-xs text-gray-400 dark:text-gray-600 italic">no analysis</span>}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-xs text-gray-400 dark:text-gray-500">B avg</span>
            {analysisB
              ? <span className="text-xs font-extrabold text-emerald-500 dark:text-emerald-300">{avgB}</span>
              : <span className="text-xs text-gray-400 dark:text-gray-600 italic">no analysis</span>}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: 400 }} className="px-4 py-4">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} margin={{ top: 28, right: 72, bottom: 28, left: 72 }}>
            <defs>
              <radialGradient id="gradA2" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#818cf8" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0.08} />
              </radialGradient>
              <radialGradient id="gradB2" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#34d399" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.08} />
              </radialGradient>
            </defs>
            <PolarGrid stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)"} gridType="polygon" />
            <PolarAngleAxis
              dataKey="subject"
              tick={(tickProps) => <DualAxisTick {...tickProps} data={data} isDark={isDark} />}
              tickLine={false}
            />
            <PolarRadiusAxis
              domain={[0, 100]}
              tick={{ fill: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)", fontSize: 9 }}
              axisLine={false}
              tickCount={4}
              angle={30}
            />
            <Radar name="Idea A" dataKey="A"
              stroke="#818cf8" strokeWidth={2.5}
              fill="url(#gradA2)" fillOpacity={1}
              isAnimationActive={true}
              animationBegin={100}
              animationDuration={900}
              animationEasing="ease-out"
              dot={{ fill: "#818cf8", r: 4, stroke: "#0c1228", strokeWidth: 1.5 }}
            />
            <Radar name="Idea B" dataKey="B"
              stroke="#34d399" strokeWidth={2.5}
              fill="url(#gradB2)" fillOpacity={1}
              isAnimationActive={true}
              animationBegin={300}
              animationDuration={900}
              animationEasing="ease-out"
              dot={{ fill: "#34d399", r: 4, stroke: "#0c1228", strokeWidth: 1.5 }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12, color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)", paddingTop: 12 }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
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

function timeAgo(iso: string): string {
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function ScoreCircle({ score }: { score: number }) {
  const color = score >= 70 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";
  const textColor = score >= 70 ? "text-emerald-400" : score >= 50 ? "text-amber-400" : "text-red-400";
  const r = 38;
  const circ = 2 * Math.PI * r;
  return (
    <div className="relative w-24 h-24 mx-auto">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(127,127,127,0.15)" strokeWidth="8" />
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

function octPoints(cx: number, cy: number, r: number) {
  return Array.from({ length: 8 }, (_, i) => {
    const a = ((i * 45 + 22.5) * Math.PI) / 180;
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
  }).join(" ");
}

function OctagonCompare({
  scoreA, scoreB, labelA, labelB, categoryA, categoryB, winner,
}: {
  scoreA: number; scoreB: number;
  labelA: string; labelB: string;
  categoryA: string; categoryB: string;
  winner: "a" | "b" | null;
}) {
  const W = 480, H = 220, R = 90, OVERLAP = 70;
  const cxA = W / 2 - R + OVERLAP / 2;
  const cxB = W / 2 + R - OVERLAP / 2;
  const cy  = H / 2;

  const colorA = "#6366f1";
  const colorB = "#10b981";
  const scoreColorA = scoreA >= 70 ? "#10b981" : scoreA >= 50 ? "#f59e0b" : "#ef4444";
  const scoreColorB = scoreB >= 70 ? "#10b981" : scoreB >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <div className="flex flex-col items-center gap-2 py-6">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
        <defs>
          <clipPath id="octA"><polygon points={octPoints(cxA, cy, R)} /></clipPath>
          <clipPath id="octB"><polygon points={octPoints(cxB, cy, R)} /></clipPath>
        </defs>

        {/* Octagon A fill */}
        <polygon points={octPoints(cxA, cy, R)}
          fill={colorA} fillOpacity={winner === "b" ? 0.08 : 0.13}
          stroke={colorA} strokeWidth={winner === "a" ? 2 : 1} strokeOpacity={0.6} />

        {/* Octagon B fill */}
        <polygon points={octPoints(cxB, cy, R)}
          fill={colorB} fillOpacity={winner === "a" ? 0.08 : 0.13}
          stroke={colorB} strokeWidth={winner === "b" ? 2 : 1} strokeOpacity={0.6} />

        {/* Overlap: B clipped to A's region */}
        <g clipPath="url(#octA)">
          <polygon points={octPoints(cxB, cy, R)}
            fill="rgba(255,255,255,0.06)" />
        </g>

        {/* Score A */}
        <text x={cxA - 18} y={cy - 8} textAnchor="middle" fill={scoreColorA}
          fontSize={32} fontWeight={800} fontFamily="monospace">{scoreA}</text>
        <text x={cxA - 18} y={cy + 12} textAnchor="middle" fill="rgba(127,127,127,0.5)"
          fontSize={10}>/100</text>
        <text x={cxA - 18} y={cy + 30} textAnchor="middle" fill={colorA}
          fontSize={9} fontWeight={700} letterSpacing={1}>{categoryA.toUpperCase().slice(0, 12)}</text>

        {/* Label A badge */}
        <circle cx={cxA - 18} cy={cy - 52} r={12} fill={colorA} fillOpacity={0.9} />
        <text x={cxA - 18} y={cy - 47} textAnchor="middle" fill="white"
          fontSize={11} fontWeight={800}>A</text>

        {/* Score B */}
        <text x={cxB + 18} y={cy - 8} textAnchor="middle" fill={scoreColorB}
          fontSize={32} fontWeight={800} fontFamily="monospace">{scoreB}</text>
        <text x={cxB + 18} y={cy + 12} textAnchor="middle" fill="rgba(127,127,127,0.5)"
          fontSize={10}>/100</text>
        <text x={cxB + 18} y={cy + 30} textAnchor="middle" fill={colorB}
          fontSize={9} fontWeight={700} letterSpacing={1}>{categoryB.toUpperCase().slice(0, 12)}</text>

        {/* Label B badge */}
        <circle cx={cxB + 18} cy={cy - 52} r={12} fill={colorB} fillOpacity={0.9} />
        <text x={cxB + 18} y={cy - 47} textAnchor="middle" fill="white"
          fontSize={11} fontWeight={800}>B</text>

        {/* Overlap label */}
        {winner && (
          <>
            <text x={W / 2} y={cy - 6} textAnchor="middle"
              fill="rgba(127,127,127,0.7)" fontSize={9} fontWeight={700} letterSpacing={1}>
              VS
            </text>
            <text x={W / 2} y={cy + 10} textAnchor="middle"
              fill="rgba(127,127,127,0.5)" fontSize={8}>
              {Math.abs(scoreA - scoreB)}pts
            </text>
          </>
        )}
      </svg>

      {/* Winner label */}
      {winner && (
        <div className="flex items-center gap-1.5 text-xs font-bold"
          style={{ color: winner === "a" ? colorA : colorB }}>
          <Trophy className="w-3.5 h-3.5" />
          Idea {winner === "a" ? "A" : "B"} leads
        </div>
      )}
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
    <div className="grid grid-cols-[140px_1fr_1fr] border-b" style={{ borderColor: "var(--t-border-subtle)" }}>
      <div className="px-4 py-3.5 flex items-center">
        <span className="text-xs font-bold text-gray-400 dark:text-gray-600 uppercase tracking-wider">{label}</span>
      </div>
      <div className={`px-4 py-3.5 flex items-center border-l min-w-0 overflow-hidden ${winner === "a" ? "bg-emerald-500/5" : ""}`}
        style={{ borderColor: "var(--t-border-subtle)" }}>
        <div className="flex items-center gap-2 w-full min-w-0">
          {a}
          {winner === "a" && <Trophy className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-auto" />}
        </div>
      </div>
      <div className={`px-4 py-3.5 flex items-center border-l min-w-0 overflow-hidden ${winner === "b" ? "bg-emerald-500/5" : ""}`}
        style={{ borderColor: "var(--t-border-subtle)" }}>
        <div className="flex items-center gap-2 w-full min-w-0">
          {b}
          {winner === "b" && <Trophy className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-auto" />}
        </div>
      </div>
    </div>
  );
}

type Plan = "free" | "plus" | "pro";

export default function ComparePage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [comparing, setComparing] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [analysisA, setAnalysisA] = useState<Analysis | null>(null);
  const [analysisB, setAnalysisB] = useState<Analysis | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setPlan("free");
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("plan")
        .eq("id", user.id)
        .maybeSingle();

      const userPlan = ((profile?.plan as Plan | undefined) ?? "free");
      setPlan(userPlan);

      if (userPlan === "free") {
        setLoading(false);
        return;
      }

      // Plus: only own ideas. Pro: own + all public ideas.
      try {
        const ownRes = await fetch("/api/ideas").then((r) => r.json()).catch(() => ({ ideas: [] }));
        const ownIdeas: Idea[] = ownRes.ideas ?? [];

        if (userPlan === "pro") {
          const allRes = await fetch("/api/ideas/all").then((r) => r.json()).catch(() => ({ ideas: [] }));
          const allIdeas: Idea[] = allRes.ideas ?? [];
          // Merge own first (so own privates appear), then fill with public ones we don't already have
          const seen = new Set(ownIdeas.map((i) => i.id));
          const merged = [...ownIdeas, ...allIdeas.filter((i) => !seen.has(i.id))];
          setIdeas(merged);
        } else {
          setIdeas(ownIdeas);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function startCompare() {
    setComparing(true);
    setAnalysisA(null);
    setAnalysisB(null);
    const [resA, resB] = await Promise.all([
      fetch(`/api/analysis?submissionId=${selected[0]}`).then((r) => r.json()).catch(() => null),
      fetch(`/api/analysis?submissionId=${selected[1]}`).then((r) => r.json()).catch(() => null),
    ]);
    setAnalysisA(resA?.report?.analysis ?? null);
    setAnalysisB(resB?.report?.analysis ?? null);
  }

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

  // Free users can't compare at all
  if (plan === "free") {
    return (
      <div className="max-w-xl mx-auto py-20">
        <div
          className="border p-10 text-center"
          style={{ background: "var(--card-bg)", borderColor: "rgba(99,102,241,0.25)" }}
        >
          <div
            className="w-14 h-14 mx-auto mb-5 flex items-center justify-center rounded-full"
            style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)" }}
          >
            <Lock className="w-6 h-6 text-indigo-400" />
          </div>
          <h1 className="text-xl font-extrabold text-gray-900 dark:text-white mb-2">
            Compare is a paid feature
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
            Upgrade to <span className="font-bold text-indigo-400">Plus</span> to compare
            your own ideas side-by-side, or <span className="font-bold text-indigo-400">Pro</span>{" "}
            to also compare against every public idea on the platform.
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white"
            style={{ background: "linear-gradient(90deg, #6366f1, #8b5cf6)" }}
          >
            See plans <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
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
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Idea Comparison</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Side-by-side analysis of two ideas</p>
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
          style={{ background: "var(--card-bg)", borderColor: "var(--t-border-card)" }}>
          {/* Column headers */}
          <div className="grid grid-cols-[140px_1fr_1fr] border-b"
            style={{ borderColor: "var(--t-border-card)", background: "var(--card-bg)" }}>
            <div className="px-4 py-3" />
            {([["A", ideaA], ["B", ideaB]] as [string, Idea][]).map(([label, idea]) => (
              <div key={label} className="px-4 py-3 border-l min-w-0 overflow-hidden" style={{ borderColor: "var(--t-border-subtle)" }}>
                <div className="flex items-center gap-2 mb-0.5 min-w-0">
                  <span className="w-5 h-5 rounded-full bg-indigo-500 text-white text-[10px] font-extrabold flex items-center justify-center shrink-0">
                    {label}
                  </span>
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider truncate">{idea.category}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{idea.target_user}</p>
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
            a={<span className="text-lg font-extrabold text-gray-900 dark:text-white">{reportA?.similar_count ?? "—"}<span className="text-xs text-gray-400 dark:text-gray-600 font-normal ml-1">/ 30d</span></span>}
            b={<span className="text-lg font-extrabold text-gray-900 dark:text-white">{reportB?.similar_count ?? "—"}<span className="text-xs text-gray-400 dark:text-gray-600 font-normal ml-1">/ 30d</span></span>}
            winner={
              (reportA?.similar_count ?? 0) < (reportB?.similar_count ?? 0) ? "a"
              : (reportB?.similar_count ?? 0) < (reportA?.similar_count ?? 0) ? "b"
              : null
            }
          />
          <div className="grid grid-cols-[140px_1fr_1fr]">
            <div className="px-4 py-4" />
            {([ideaA, ideaB] as Idea[]).map((idea, idx) => (
              <div key={idea.id} className="px-4 py-4 border-l" style={{ borderColor: "var(--t-border-subtle)" }}>
                <Link href={`/ideas/${idea.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
                  View full report {idx === 0 ? "A" : "B"} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Dual radar — two ideas overlaid on same chart */}
        <DualRadar analysisA={analysisA} analysisB={analysisB} />

        {winner && (
          <div className="mt-6 p-5 border"
            style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.07))", borderColor: "rgba(129,140,248,0.2)" }}>
            <div className="flex items-start gap-3">
              <Trophy className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                  Idea {winner === "a" ? "A" : "B"} shows stronger potential
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
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
  const bothSelected = selected.length === 2;

  return (
    <div className="max-w-5xl mx-auto p-8">
      <PageHeader
        title="Compare ideas"
        meta={`${ideas.length} available`}
        description={
          plan === "plus"
            ? "Pick two of your own ideas to place side-by-side. Upgrade to Pro to compare against any public idea."
            : "Pick two ideas to place side-by-side. We'll analyze signals across 8 agents."
        }
        action={
          plan === "plus" ? (
            <Link
              href="/pricing"
              className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 text-xs font-semibold border transition-colors"
              style={{
                color: "var(--accent)",
                borderColor: "var(--accent-ring)",
                background: "var(--accent-soft)",
              }}
            >
              Upgrade to Pro →
            </Link>
          ) : undefined
        }
      />

      {/* Static A/B dock — always visible at the top of the page */}
      <section
        aria-label="Comparison slots"
        className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 mb-6"
      >
        {[0, 1].map((i) => {
          const selIdea = ideas.find((x) => x.id === selected[i]);
          const letter = String.fromCharCode(65 + i);
          const filled = !!selIdea;
          return (
            <div
              key={i}
              className="flex items-center gap-3 p-3.5 border min-h-[68px] transition-all duration-150"
              style={{
                borderColor: filled ? "var(--accent-ring)" : "var(--t-border-card)",
                background: filled ? "var(--accent-soft)" : "var(--card-bg)",
              }}
            >
              <span
                className="w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0 border"
                style={{
                  color: filled ? "#fff" : "var(--text-tertiary)",
                  background: filled ? "var(--accent)" : "transparent",
                  borderColor: filled ? "var(--accent)" : "var(--t-border-card)",
                }}
              >
                {letter}
              </span>
              {filled ? (
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[11px] font-semibold uppercase tracking-widest truncate"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {selIdea!.category} · {timeAgo(selIdea!.created_at)}
                    </p>
                    <p
                      className="text-sm font-semibold truncate"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {selIdea!.target_user}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleSelect(selIdea!.id)}
                    aria-label={`Remove idea ${letter}`}
                    className="shrink-0 text-xs font-medium px-2 h-7 border transition-colors hover:bg-[color:var(--t-border-subtle)]"
                    style={{
                      color: "var(--text-tertiary)",
                      borderColor: "var(--t-border-card)",
                    }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <span className="text-sm font-medium" style={{ color: "var(--text-tertiary)" }}>
                  Pick an idea below as {letter}
                </span>
              )}
            </div>
          );
        })}

        {/* Compare action */}
        <button
          onClick={startCompare}
          disabled={!bothSelected}
          className="inline-flex items-center justify-center gap-1.5 h-[68px] md:h-auto px-6 text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: bothSelected ? "var(--accent)" : "var(--card-bg)",
            color: bothSelected ? "#fff" : "var(--text-tertiary)",
            border: bothSelected ? "none" : "1px solid var(--t-border-card)",
          }}
        >
          <GitCompare className="w-4 h-4" />
          {bothSelected ? "Compare" : `${selected.length}/2`}
          {bothSelected && <ArrowRight className="w-4 h-4" />}
        </button>
      </section>

      {/* Search + category filter */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
            style={{ color: "var(--text-tertiary)" }}
          />
          <input
            type="text"
            placeholder="Search ideas by description, target, or category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 h-9 text-sm border outline-none transition-colors focus:border-[color:var(--accent)]"
            style={{
              background: "var(--card-bg)",
              borderColor: "var(--t-border-card)",
              color: "var(--text-primary)",
            }}
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-9 px-3 text-sm font-medium border outline-none transition-colors focus:border-[color:var(--accent)] cursor-pointer"
          style={{
            background: "var(--card-bg)",
            borderColor: "var(--t-border-card)",
            color: "var(--text-primary)",
            minWidth: 160,
          }}
          aria-label="Filter by category"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat === "All" ? "All categories" : cat}
            </option>
          ))}
        </select>
      </div>

      {/* Result count */}
      <p
        className="text-xs mb-3"
        style={{ color: "var(--text-tertiary)" }}
      >
        {filtered.length} {filtered.length === 1 ? "idea" : "ideas"}
        {(search || category !== "All") && ` match your filter`}
      </p>

      {/* Ideas grid — compact, 2-col on md+, click to select */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 border"
          style={{ borderColor: "var(--t-border)", background: "var(--card-bg)" }}>
          <p className="text-gray-500 dark:text-gray-400 text-sm">No ideas match your filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((idea) => {
            const report = getReport(idea);
            const isSelected = selected.includes(idea.id);
            const selIdx = selected.indexOf(idea.id);
            const selLetter = isSelected ? String.fromCharCode(65 + selIdx) : null;
            const vScore = report?.viability_score ?? null;
            const trendLabel = report?.trend_direction as TrendDirection | null;
            const satLabel = report?.saturation_level ?? null;

            return (
              <button
                key={idea.id}
                onClick={() => toggleSelect(idea.id)}
                aria-pressed={isSelected}
                className="relative text-left border p-4 transition-all duration-150 hover:-translate-y-0.5 overflow-hidden group"
                style={{
                  background: isSelected ? "var(--accent-soft)" : "var(--card-bg)",
                  borderColor: isSelected ? "var(--accent-ring)" : "var(--t-border-card)",
                }}
              >
                {/* A/B floating badge when selected */}
                {selLetter && (
                  <span
                    className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center text-xs font-bold z-10"
                    style={{ background: "var(--accent)", color: "#fff" }}
                  >
                    {selLetter}
                  </span>
                )}

                {/* Header row: score + category + time */}
                <div className="flex items-center gap-3 mb-3">
                  <ScoreBadge score={vScore} size="hero" />
                  <div className="flex-1 min-w-0 pr-8">
                    <p
                      className="text-[10px] font-semibold uppercase tracking-widest truncate"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {idea.category}
                    </p>
                    <p
                      className="text-[11px] font-medium mt-0.5"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {timeAgo(idea.created_at)}
                    </p>
                  </div>
                </div>

                {/* Target + description */}
                <p
                  className="text-sm font-semibold mb-1 line-clamp-1"
                  style={{ color: "var(--text-primary)" }}
                >
                  For {idea.target_user}
                </p>
                <p
                  className="text-sm leading-relaxed line-clamp-2 mb-3 min-h-[40px]"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {idea.description}
                </p>

                {/* Meta row: trend + saturation (plain text, no pills) */}
                {(trendLabel || satLabel) && (
                  <div className="flex items-center gap-3 text-xs">
                    {trendLabel && <TrendLabel direction={trendLabel} />}
                    {satLabel && (
                      <span className="font-medium" style={{ color: "var(--text-tertiary)" }}>
                        {satLabel} sat
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}