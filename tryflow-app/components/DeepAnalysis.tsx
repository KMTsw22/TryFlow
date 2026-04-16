"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import {
  Sparkles,
  Loader2,
  Target,
  Shield,
  Clock,
  DollarSign,
  Wrench,
  Scale,
  Rocket,
  Users,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface AgentAnalysis {
  score: number;
  assessment: string;
  detailed_assessment?: string;
  [key: string]: unknown;
}

interface AnalysisReport {
  viability_score: number;
  summary: string;
  analysis: {
    market_size: AgentAnalysis & { tam_estimate?: string; signals?: { tam_estimate?: string; sam_estimate?: string; segment?: string; buyer_type?: string } };
    competition: AgentAnalysis & { intensity?: string; key_players?: string[]; signals?: { feature_risk?: string; switching_cost?: string; consolidation_trend?: string } };
    regulation: AgentAnalysis & { risk_level?: string; key_concerns?: string[]; signals?: { key_concerns?: string[]; applicable_regulations?: string[]; compliance_cost?: string; time_to_compliance?: string; tailwind?: string } };
    technical_difficulty: AgentAnalysis & { level?: string; key_challenges?: string[]; signals?: { core_challenge?: string; integration_complexity?: string; ai_ml_required?: boolean; estimated_mvp_months?: number } };
    monetization: AgentAnalysis & { models?: string[]; signals?: { recommended_model?: string; estimated_acv?: string; nrr_potential?: string; margin_risk?: string; models?: string[] } };
    timing: AgentAnalysis & { signal?: string; signals?: { forcing_function?: string; tech_enabler?: string; buyer_readiness?: string } };
    defensibility: AgentAnalysis & { moats?: string[]; signals?: { primary_moat?: string; moats?: string[]; time_to_moat?: string; durability?: string } };
    user_acquisition: AgentAnalysis & { channels?: string[]; estimated_cac?: string; signals?: { primary_channel?: string; channels?: string[]; estimated_cac?: string; sales_cycle?: string; virality_potential?: string } };
  };
  cross_agent_insights: string[];
  opportunities: string[];
  risks: string[];
  next_steps: string[];
}

interface DeepAnalysisProps {
  submissionId: string;
  fallbackScore: number;
  fallbackSummary: string;
  trendDirection: string;
  saturationLevel: string;
  similarCount: number;
  // false면 free Submitter 뷰: radar + 요약만, 세부 섹션(detailed_assessment,
  // cross_agent_insights, opportunities, risks, next_steps)은 가려짐
  detailed?: boolean;
}

// ── Weights & scoring ─────────────────────────────────────────────────────────

const AGENT_WEIGHTS: Record<string, number> = {
  market_size: 0.20,
  competition: 0.15,
  timing: 0.10,
  monetization: 0.15,
  technical_difficulty: 0.15,
  regulation: 0.10,
  defensibility: 0.10,
  user_acquisition: 0.05,
};

function calcWeightedScore(analysis: AnalysisReport["analysis"]): number {
  let total = 0;
  for (const [key, weight] of Object.entries(AGENT_WEIGHTS)) {
    const agent = analysis?.[key as keyof typeof analysis];
    if (agent) total += agent.score * weight;
  }
  return Math.round(Math.min(95, Math.max(5, total)));
}

// ── Agent metadata ────────────────────────────────────────────────────────────

const AGENT_META: Record<
  string,
  { label: string; icon: typeof Target; color: string; bg: string; weight: string }
> = {
  market_size:          { label: "Market Size",   icon: Target,      color: "text-blue-400",   bg: "bg-blue-500/10",   weight: "20%" },
  competition:          { label: "Competition",   icon: Shield,      color: "text-purple-400", bg: "bg-purple-500/10", weight: "15%" },
  timing:               { label: "Timing",        icon: Clock,       color: "text-orange-400", bg: "bg-orange-500/10", weight: "10%" },
  monetization:         { label: "Monetization",  icon: DollarSign,  color: "text-emerald-400",bg: "bg-emerald-500/10",weight: "15%" },
  technical_difficulty: { label: "Technical",     icon: Wrench,      color: "text-red-400",    bg: "bg-red-500/10",    weight: "15%" },
  regulation:           { label: "Regulation",    icon: Scale,       color: "text-amber-400",  bg: "bg-amber-500/10",  weight: "10%" },
  defensibility:        { label: "Defensibility", icon: Rocket,      color: "text-indigo-400", bg: "bg-indigo-500/10", weight: "10%" },
  user_acquisition:     { label: "Acquisition",   icon: Users,       color: "text-teal-400",   bg: "bg-teal-500/10",   weight: "5%"  },
};

const ANALYSIS_STEPS = [
  "Initializing multi-agent system...",
  "Market Size agent analyzing TAM/SAM...",
  "Competition agent mapping landscape...",
  "Timing agent evaluating market window...",
  "Monetization agent assessing revenue models...",
  "Technical agent evaluating build complexity...",
  "Regulation agent checking compliance...",
  "Defensibility agent analyzing moats...",
  "User Acquisition agent planning GTM...",
  "Synthesizer merging 8 agent results...",
  "Generating final report...",
];

// ── Dark-themed configs ───────────────────────────────────────────────────────

const TREND_CONFIG: Record<string, { icon: typeof TrendingUp; color: string; bg: string; border: string; label: string }> = {
  Rising:    { icon: TrendingUp,   color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", label: "Rising" },
  Stable:    { icon: Minus,        color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/20",   label: "Stable" },
  Declining: { icon: TrendingDown, color: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/20",     label: "Declining" },
};

const SAT_CONFIG: Record<string, { color: string; bg: string; bar: string }> = {
  Low:    { color: "text-emerald-400", bg: "bg-emerald-500/10", bar: "#34d399" },
  Medium: { color: "text-amber-400",   bg: "bg-amber-500/10",   bar: "#fbbf24" },
  High:   { color: "text-red-400",     bg: "bg-red-500/10",     bar: "#f87171" },
};

// ── Signal badges ─────────────────────────────────────────────────────────────

function SignalBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 text-[11px]"
      style={{ background: "var(--input-bg)", border: "1px solid var(--t-border-bright)" }}>
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-gray-600 dark:text-gray-300">{value}</span>
    </div>
  );
}

function AgentSignals({ agentKey, data }: { agentKey: string; data: AgentAnalysis }) {
  const signals = (data.signals ?? {}) as Record<string, unknown>;
  const items: { label: string; value: string }[] = [];

  switch (agentKey) {
    case "market_size":
      if (signals.tam_estimate || data.tam_estimate) items.push({ label: "TAM", value: String(signals.tam_estimate || data.tam_estimate) });
      if (signals.sam_estimate) items.push({ label: "SAM", value: String(signals.sam_estimate) });
      if (signals.segment) items.push({ label: "Segment", value: String(signals.segment) });
      if (signals.buyer_type) items.push({ label: "Buyer", value: String(signals.buyer_type) });
      break;
    case "competition": {
      const d = data as AnalysisReport["analysis"]["competition"];
      if (d.intensity) items.push({ label: "Intensity", value: d.intensity });
      if (d.key_players?.length) items.push({ label: "Key Players", value: d.key_players.join(", ") });
      if (signals.switching_cost) items.push({ label: "Switching Cost", value: String(signals.switching_cost) });
      if (signals.consolidation_trend) items.push({ label: "Consolidation", value: String(signals.consolidation_trend) });
      break;
    }
    case "timing": {
      const d = data as AnalysisReport["analysis"]["timing"];
      if (d.signal) items.push({ label: "Signal", value: d.signal });
      if (signals.forcing_function) items.push({ label: "Forcing Function", value: String(signals.forcing_function) });
      if (signals.tech_enabler) items.push({ label: "Tech Enabler", value: String(signals.tech_enabler) });
      if (signals.buyer_readiness) items.push({ label: "Buyer Readiness", value: String(signals.buyer_readiness) });
      break;
    }
    case "monetization": {
      const d = data as AnalysisReport["analysis"]["monetization"];
      const models = d.models || (signals.models as string[] | undefined);
      if (signals.recommended_model) items.push({ label: "Model", value: String(signals.recommended_model) });
      else if (models?.length) items.push({ label: "Models", value: models.join(", ") });
      if (signals.estimated_acv) items.push({ label: "Est. ACV", value: String(signals.estimated_acv) });
      if (signals.nrr_potential) items.push({ label: "NRR Potential", value: String(signals.nrr_potential) });
      if (signals.margin_risk) items.push({ label: "Margin Risk", value: String(signals.margin_risk) });
      break;
    }
    case "technical_difficulty": {
      const d = data as AnalysisReport["analysis"]["technical_difficulty"];
      if (d.level) items.push({ label: "Level", value: d.level });
      if (signals.estimated_mvp_months) items.push({ label: "MVP", value: `${signals.estimated_mvp_months}mo` });
      if (signals.core_challenge) items.push({ label: "Core Challenge", value: String(signals.core_challenge) });
      if (signals.integration_complexity) items.push({ label: "Integration", value: String(signals.integration_complexity) });
      if (d.key_challenges?.length) items.push({ label: "Challenges", value: d.key_challenges.join(", ") });
      break;
    }
    case "regulation": {
      const d = data as AnalysisReport["analysis"]["regulation"];
      if (d.risk_level) items.push({ label: "Risk Level", value: d.risk_level });
      if (signals.compliance_cost) items.push({ label: "Compliance Cost", value: String(signals.compliance_cost) });
      if (signals.time_to_compliance) items.push({ label: "Time to Comply", value: String(signals.time_to_compliance) });
      if (signals.tailwind) items.push({ label: "Tailwind", value: String(signals.tailwind) });
      const concerns = d.key_concerns || (signals.key_concerns as string[] | undefined);
      if (concerns?.length) items.push({ label: "Key Concerns", value: concerns.join(", ") });
      break;
    }
    case "defensibility": {
      const d = data as AnalysisReport["analysis"]["defensibility"];
      const moats = d.moats || (signals.moats as string[] | undefined);
      if (signals.primary_moat) items.push({ label: "Primary Moat", value: String(signals.primary_moat) });
      else if (moats?.length) items.push({ label: "Moats", value: moats.join(", ") });
      if (signals.time_to_moat) items.push({ label: "Time to Moat", value: String(signals.time_to_moat) });
      if (signals.durability) items.push({ label: "Durability", value: String(signals.durability) });
      break;
    }
    case "user_acquisition": {
      const d = data as AnalysisReport["analysis"]["user_acquisition"];
      const channels = d.channels || (signals.channels as string[] | undefined);
      const cac = d.estimated_cac || (signals.estimated_cac as string | undefined);
      if (signals.primary_channel) items.push({ label: "Primary Channel", value: String(signals.primary_channel) });
      else if (channels?.length) items.push({ label: "Channels", value: channels.join(", ") });
      if (cac) items.push({ label: "Est. CAC", value: cac });
      if (signals.sales_cycle) items.push({ label: "Sales Cycle", value: String(signals.sales_cycle) });
      if (signals.virality_potential) items.push({ label: "Virality", value: String(signals.virality_potential) });
      break;
    }
  }

  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mb-2">
      {items.map((item, i) => <SignalBadge key={i} label={item.label} value={item.value} />)}
    </div>
  );
}

// ── MetricsGrid ───────────────────────────────────────────────────────────────

function MetricsGrid({ trendDirection, saturationLevel, similarCount }: { trendDirection: string; saturationLevel: string; similarCount: number }) {
  const trend = TREND_CONFIG[trendDirection] ?? TREND_CONFIG.Stable;
  const sat = SAT_CONFIG[saturationLevel] ?? SAT_CONFIG.Medium;
  const TrendIcon = trend.icon;

  return (
    <div className="grid grid-cols-3 gap-3 mb-4">
      <div className={`border p-5 text-center ${trend.border}`}
        style={{ background: "var(--card-bg)" }}>
        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">Market Trend</p>
        <div className={`w-10 h-10 ${trend.bg} flex items-center justify-center mx-auto mb-2`}>
          <TrendIcon className={`w-5 h-5 ${trend.color}`} />
        </div>
        <p className={`text-sm font-bold ${trend.color}`}>{trendDirection}</p>
      </div>

      <div className="border p-5 text-center"
        style={{ background: "var(--card-bg)", borderColor: "var(--t-border-card)" }}>
        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">Saturation</p>
        <div className={`w-10 h-10 ${sat.bg} flex items-center justify-center mx-auto mb-2`}>
          <span className={`text-sm font-black ${sat.color}`}>{saturationLevel[0]}</span>
        </div>
        <p className={`text-sm font-bold ${sat.color}`}>{saturationLevel}</p>
      </div>

      <div className="border p-5 text-center"
        style={{ background: "var(--card-bg)", borderColor: "var(--t-border-card)" }}>
        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">Similar Ideas</p>
        <p className="text-3xl font-extrabold text-gray-900 dark:text-white mb-1">{similarCount}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">last 30 days</p>
      </div>
    </div>
  );
}

// ── Verdict & OverallSignal ───────────────────────────────────────────────────

function getVerdict(score: number, trend: string, saturation: string): { label: string; color: string; bg: string } {
  if (score >= 75) {
    if (saturation === "Low") return { label: "Strong early opportunity", color: "text-emerald-400", bg: "rgba(16,185,129,0.12)" };
    if (saturation === "High") return { label: "Promising but crowded", color: "text-amber-400", bg: "rgba(245,158,11,0.12)" };
    return { label: "Strong signal — move fast", color: "text-emerald-400", bg: "rgba(16,185,129,0.12)" };
  }
  if (score >= 60) {
    if (trend === "Rising" && saturation === "Low") return { label: "Early opportunity — validate quickly", color: "text-emerald-400", bg: "rgba(16,185,129,0.12)" };
    if (trend === "Rising" && saturation === "High") return { label: "Hot space — differentiation is key", color: "text-amber-400", bg: "rgba(245,158,11,0.12)" };
    if (trend === "Declining") return { label: "Timing risk — watch momentum", color: "text-amber-400", bg: "rgba(245,158,11,0.12)" };
    return { label: "Moderate potential — refine your angle", color: "text-amber-400", bg: "rgba(245,158,11,0.12)" };
  }
  if (score >= 45) {
    if (saturation === "Low") return { label: "Unproven space — high risk, high reward", color: "text-amber-400", bg: "rgba(245,158,11,0.12)" };
    if (trend === "Declining") return { label: "Fading interest — consider pivoting", color: "text-red-400", bg: "rgba(239,68,68,0.12)" };
    return { label: "Needs sharper positioning", color: "text-amber-400", bg: "rgba(245,158,11,0.12)" };
  }
  if (trend === "Declining" && saturation === "High") return { label: "Crowded and cooling — rethink approach", color: "text-red-400", bg: "rgba(239,68,68,0.12)" };
  return { label: "Weak signal — explore adjacent angles", color: "text-red-400", bg: "rgba(239,68,68,0.12)" };
}

function OverallSignal({ score, summary, trend, saturation }: { score: number; summary: string; trend: string; saturation: string }) {
  const vColor = score >= 70 ? "text-emerald-400" : score >= 50 ? "text-amber-400" : "text-red-400";
  const vBg = score >= 70 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";
  const verdict = getVerdict(score, trend, saturation);

  return (
    <div className="border p-8 mb-4 text-center"
      style={{ background: "var(--card-bg)", borderColor: "var(--t-border-card)" }}>
      <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">Overall Signal</p>
      <div className="relative w-32 h-32 mx-auto mb-4">
        <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="52" fill="none" stroke="var(--t-border-card)" strokeWidth="12" />
          <circle
            cx="60" cy="60" r="52" fill="none"
            stroke={vBg} strokeWidth="12"
            strokeDasharray={`${2 * Math.PI * 52}`}
            strokeDashoffset={`${2 * Math.PI * 52 * (1 - score / 100)}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-extrabold ${vColor}`}>{score}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">/100</span>
        </div>
      </div>
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-3"
        style={{ background: verdict.bg }}>
        <span className={`text-xs font-bold ${verdict.color}`}>{verdict.label}</span>
      </div>
      <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed max-w-md mx-auto">{summary}</p>
    </div>
  );
}

// ── Radar custom tick ─────────────────────────────────────────────────────────

function RadarTick({
  x, y, cx, cy, payload, scoreMap, isDark = true,
}: {
  x: number; y: number; cx: number; cy: number;
  payload: { value: string };
  scoreMap: Record<string, number>;
  isDark?: boolean;
  [k: string]: unknown;
}) {
  const score = scoreMap[payload.value] ?? 0;
  const scoreColor = score >= 70 ? "#34d399" : score >= 50 ? "#fbbf24" : "#f87171";
  const labelColor = isDark ? "#9ca3af" : "#6b7280";
  const dx = x - cx;
  const anchor: "start" | "middle" | "end" = dx > 8 ? "start" : dx < -8 ? "end" : "middle";
  const dy = y - cy;
  const nameY = dy <= 0 ? y - 10 : y + 2;
  const scoreY = dy <= 0 ? y + 6 : y + 18;

  return (
    <g>
      <text x={x} y={nameY} textAnchor={anchor} fill={labelColor} fontSize={11} fontWeight="600">
        {payload.value}
      </text>
      <text x={x} y={scoreY} textAnchor={anchor} fill={scoreColor} fontSize={16} fontWeight="800">
        {score}
      </text>
    </g>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function DeepAnalysis({
  submissionId,
  fallbackScore,
  fallbackSummary,
  trendDirection,
  saturationLevel,
  similarCount,
  detailed = true,
}: DeepAnalysisProps) {
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [fullAgent, setFullAgent] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const { isDark } = useTheme();

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch(`/api/analysis?submissionId=${submissionId}`);
        const data = await res.json();
        if (data.report) {
          setReport({
            viability_score: data.report.viability_score,
            summary: data.report.summary,
            analysis: data.report.analysis,
            cross_agent_insights: data.report.cross_agent_insights,
            opportunities: data.report.opportunities,
            risks: data.report.risks,
            next_steps: data.report.next_steps,
          });
        }
      } catch { /* no existing analysis */ }
      finally { setChecked(true); }
    }
    check();
  }, [submissionId]);

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setStepIndex((i) => (i < ANALYSIS_STEPS.length - 1 ? i + 1 : i));
    }, 3500);
    return () => clearInterval(interval);
  }, [loading]);

  async function startAnalysis() {
    setLoading(true);
    setError(null);
    setStepIndex(0);
    try {
      const res = await fetch("/api/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409 && data.analysisId) {
          const getRes = await fetch(`/api/analysis?submissionId=${submissionId}`);
          const getData = await getRes.json();
          if (getData.report) { setReport(getData.report); setLoading(false); return; }
        }
        throw new Error(data.error || "Analysis failed");
      }
      setReport(data.report);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (!checked) return null;

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="border p-8"
        style={{ background: "rgba(99,102,241,0.05)", borderColor: "rgba(99,102,241,0.2)" }}>
        <div className="text-center">
          <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}>
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          </div>
          <h3 className="text-lg font-extrabold text-white mb-2">AI Deep Analysis in Progress</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">8 specialist agents analyzing in parallel</p>
          <div className="max-w-sm mx-auto space-y-2">
            {ANALYSIS_STEPS.map((step, i) => (
              <div key={step}
                className={`flex items-center gap-2 text-xs transition-all duration-300 ${
                  i < stepIndex ? "text-emerald-400" : i === stepIndex ? "text-indigo-300 font-bold" : "text-gray-500"
                }`}>
                {i < stepIndex ? <span className="w-4 text-center">✓</span>
                  : i === stepIndex ? <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                  : <span className="w-4 text-center">·</span>}
                {step}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Results ───────────────────────────────────────────────────────────────────
  if (report) {
    const weightedScore = calcWeightedScore(report.analysis);
    const radarData = Object.entries(AGENT_META).map(([key, meta]) => ({
      subject: meta.label,
      key,
      score: report.analysis?.[key as keyof typeof report.analysis]?.score ?? 0,
    }));
    const scoreMap = Object.fromEntries(radarData.map((d) => [d.subject, d.score]));

    return (
      <div className="space-y-4">

        {/* Overall Signal — weighted score from 8 agents */}
        <OverallSignal score={weightedScore} summary={report.summary} trend={trendDirection} saturation={saturationLevel} />

        {/* Metrics — trend / saturation / similar count */}
        <MetricsGrid trendDirection={trendDirection} saturationLevel={saturationLevel} similarCount={similarCount} />

        {/* Radar + agent cards */}
        <div className="border p-6"
          style={{ background: "var(--card-bg)", borderColor: "var(--t-border-card)" }}>
          <div className="flex items-center gap-2 mb-5">
            <Brain className="w-4 h-4 text-indigo-400" />
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">8-Agent Analysis Breakdown</p>
          </div>

          {/* Radar */}
          <div style={{ height: 340 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} margin={{ top: 28, right: 48, bottom: 28, left: 48 }}>
                <PolarGrid stroke={isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)"} gridType="polygon" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={(props) => <RadarTick {...props} scoreMap={scoreMap} isDark={isDark} />}
                  tickLine={false}
                />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} tickCount={5} />
                <Radar
                  dataKey="score"
                  stroke="#818cf8"
                  strokeWidth={2}
                  fill="url(#radarGrad)"
                  fillOpacity={1}
                  dot={{ fill: "#818cf8", r: 3, strokeWidth: 0 }}
                />
                <defs>
                  <radialGradient id="radarGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.1} />
                  </radialGradient>
                </defs>
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Agent cards 4×2 */}
          <div className="grid grid-cols-4 gap-2 mt-5">
            {Object.entries(AGENT_META).map(([key, meta]) => {
              const agentData = report.analysis?.[key as keyof typeof report.analysis];
              if (!agentData) return null;
              const Icon = meta.icon;
              const score = agentData.score;
              const isExpanded = expandedAgent === key;
              const scoreColor = score >= 70 ? "text-emerald-400" : score >= 50 ? "text-amber-400" : "text-red-400";

              return (
                <div key={key}>
                  <button
                    onClick={() => { setExpandedAgent(isExpanded ? null : key); setFullAgent(null); }}
                    className="w-full border p-3 text-left transition-all duration-150 hover:bg-white/[0.04] flex flex-col gap-2"
                    style={{
                      background: isExpanded ? "rgba(99,102,241,0.08)" : "var(--card-bg)",
                      borderColor: isExpanded ? "rgba(99,102,241,0.35)" : "var(--t-border)",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`w-6 h-6 ${meta.bg} flex items-center justify-center`}>
                        <Icon className={`w-3 h-3 ${meta.color}`} />
                      </div>
                      <span className="text-[10px] font-bold text-gray-400">{meta.weight}</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-1">
                        {meta.label}
                      </p>
                      <div className="flex items-end gap-1">
                        <span className={`text-xl font-extrabold leading-none ${scoreColor}`}>{score}</span>
                        <span className="text-[10px] text-gray-400 mb-0.5">/100</span>
                      </div>
                    </div>
                    <div className="h-0.5 w-full rounded-full overflow-hidden" style={{ background: "var(--t-border-bright)" }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${score}%`, background: score >= 70 ? "#34d399" : score >= 50 ? "#fbbf24" : "#f87171" }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-400">Details</span>
                      {isExpanded ? <ChevronUp className="w-3 h-3 text-gray-400" /> : <ChevronDown className="w-3 h-3 text-gray-400" />}
                    </div>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Expanded assessment panel */}
          {expandedAgent && (() => {
            const agentData = report.analysis?.[expandedAgent as keyof typeof report.analysis];
            const meta = AGENT_META[expandedAgent];
            if (!agentData || !meta) return null;
            const Icon = meta.icon;
            const isFull = fullAgent === expandedAgent;
            const SHORT_LIMIT = 110;
            const isLong = agentData.assessment.length > SHORT_LIMIT;
            const shortText = isLong
              ? agentData.assessment.slice(0, SHORT_LIMIT).trimEnd() + "…"
              : agentData.assessment;

            return (
              <div className="mt-3 p-4 border"
                style={{ background: "rgba(99,102,241,0.05)", borderColor: "rgba(99,102,241,0.2)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-6 h-6 ${meta.bg} flex items-center justify-center`}>
                    <Icon className={`w-3 h-3 ${meta.color}`} />
                  </div>
                  <span className="text-xs font-bold text-gray-300">{meta.label} — Agent Assessment</span>
                </div>
                {/* Signal badges */}
                <AgentSignals agentKey={expandedAgent} data={agentData} />
                {/* Short summary — always visible */}
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{shortText}</p>
                {/* Full text — shown when expanded */}
                {isFull && isLong && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mt-2">
                    {agentData.assessment.slice(SHORT_LIMIT)}
                  </p>
                )}
                {/* Detailed assessment — if available, Submitter Pro only */}
                {detailed && isFull && agentData.detailed_assessment && (
                  <div className="mt-2 pt-2 border-t" style={{ borderColor: "var(--t-border-bright)" }}>
                    <p className="text-[11px] text-indigo-500 dark:text-indigo-400 font-bold mb-1 tracking-wider uppercase">Detailed Analysis</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{agentData.detailed_assessment}</p>
                  </div>
                )}
                {detailed && (isLong || agentData.detailed_assessment) && (
                  <button
                    onClick={() => setFullAgent(isFull ? null : expandedAgent)}
                    className="mt-2 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
                  >
                    {isFull ? "Show less ↑" : "Read full analysis ↓"}
                  </button>
                )}
              </div>
            );
          })()}
        </div>

        {/* Submitter Pro upsell — shown instead of detail sections for free users */}
        {!detailed && (
          <div className="border p-6"
            style={{
              background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.06))",
              borderColor: "rgba(99,102,241,0.25)",
            }}>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest">Summary view</p>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed mb-4">
              You&apos;re seeing the summarized score and radar. Upgrade to{" "}
              <span className="font-bold text-white">Plus</span> to unlock
              detailed per-agent assessments, cross-agent insights, opportunities,
              risks, and recommended next steps on your own ideas.
            </p>
            <a
              href="/pricing"
              className="inline-flex items-center gap-2 bg-indigo-500 text-white font-bold px-4 py-2 text-xs hover:bg-indigo-400 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Upgrade to Plus
            </a>
          </div>
        )}

        {/* Cross-agent insights — Submitter Pro only */}
        {detailed && report.cross_agent_insights?.length > 0 && (
          <div className="border p-6"
            style={{ background: "var(--card-bg)", borderColor: "var(--t-border-card)" }}>
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-4 h-4 text-indigo-400" />
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Cross-Agent Insights</p>
            </div>
            <ul className="space-y-2">
              {report.cross_agent_insights.map((insight, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full text-indigo-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.2)" }}>
                    {i + 1}
                  </span>
                  <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">{insight}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Opportunities & Risks — Submitter Pro only */}
        {detailed && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {report.opportunities?.length > 0 && (
              <div className="border p-6"
                style={{ background: "rgba(16,185,129,0.04)", borderColor: "rgba(16,185,129,0.2)" }}>
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="w-4 h-4 text-emerald-400" />
                  <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Opportunities</p>
                </div>
                <ul className="space-y-3">
                  {report.opportunities.map((opp, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5 shrink-0 font-bold">+</span>
                      <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">{opp}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {report.risks?.length > 0 && (
              <div className="border p-6"
                style={{ background: "rgba(239,68,68,0.04)", borderColor: "rgba(239,68,68,0.2)" }}>
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <p className="text-xs font-bold text-red-500 uppercase tracking-widest">Risks</p>
                </div>
                <ul className="space-y-3">
                  {report.risks.map((risk, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-red-400 mt-0.5 shrink-0 font-bold">!</span>
                      <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">{risk}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Next Steps — Submitter Pro only */}
        {detailed && report.next_steps?.length > 0 && (
          <div className="border p-6"
            style={{ background: "var(--card-bg)", borderColor: "var(--t-border-card)" }}>
            <div className="flex items-center gap-2 mb-4">
              <ArrowRight className="w-4 h-4 text-indigo-400" />
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Next Steps This Week</p>
            </div>
            <ul className="space-y-2">
              {report.next_steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3 p-2"
                  style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)" }}>
                  <span className="w-5 h-5 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">{step}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // ── CTA (no analysis yet) ─────────────────────────────────────────────────────
  return (
    <>
      {/* Show fallback score while no AI analysis */}
      <OverallSignal score={fallbackScore} summary={fallbackSummary} trend={trendDirection} saturation={saturationLevel} />

      {/* Metrics */}
      <MetricsGrid trendDirection={trendDirection} saturationLevel={saturationLevel} similarCount={similarCount} />

      <div className="border p-8 text-center"
        style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.06))", borderColor: "rgba(99,102,241,0.2)" }}>
        <div className="w-14 h-14 flex items-center justify-center mx-auto mb-4"
          style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.2)" }}>
          <Sparkles className="w-7 h-7 text-indigo-400" />
        </div>
        <h3 className="text-lg font-extrabold text-white mb-2">Want a deeper analysis?</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
          Our AI system runs 8 specialist agents in parallel to analyze market size,
          competition, timing, monetization, technical complexity, regulation,
          defensibility, and user acquisition.
        </p>
        <button
          onClick={startAnalysis}
          className="inline-flex items-center gap-2 bg-indigo-500 text-white font-bold px-6 py-3 text-sm hover:bg-indigo-400 transition-colors cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          Run AI Deep Analysis
        </button>
        {error && <p className="mt-4 text-xs text-red-400">{error}</p>}
      </div>
    </>
  );
}