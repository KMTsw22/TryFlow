"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
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
    competition: AgentAnalysis & { intensity?: string; key_players?: string[]; signals?: { feature_risk?: string; oss_alternative?: string; switching_cost?: string; consolidation_trend?: string } };
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
}

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

const AGENT_META: Record<
  string,
  { label: string; icon: typeof Target; color: string; bg: string; weight: string }
> = {
  market_size: { label: "Market Size", icon: Target, color: "text-blue-600", bg: "bg-blue-50", weight: "20%" },
  competition: { label: "Competition", icon: Shield, color: "text-purple-600", bg: "bg-purple-50", weight: "15%" },
  timing: { label: "Timing", icon: Clock, color: "text-orange-600", bg: "bg-orange-50", weight: "10%" },
  monetization: { label: "Monetization", icon: DollarSign, color: "text-green-600", bg: "bg-green-50", weight: "15%" },
  technical_difficulty: { label: "Technical", icon: Wrench, color: "text-red-600", bg: "bg-red-50", weight: "15%" },
  regulation: { label: "Regulation", icon: Scale, color: "text-amber-600", bg: "bg-amber-50", weight: "10%" },
  defensibility: { label: "Defensibility", icon: Rocket, color: "text-indigo-600", bg: "bg-indigo-50", weight: "10%" },
  user_acquisition: { label: "Acquisition", icon: Users, color: "text-teal-600", bg: "bg-teal-50", weight: "5%" },
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

const TREND_CONFIG: Record<string, { icon: typeof TrendingUp; color: string; bg: string; border: string }> = {
  Rising:    { icon: TrendingUp,   color: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-200" },
  Stable:    { icon: Minus,        color: "text-amber-500",   bg: "bg-amber-50",   border: "border-amber-200" },
  Declining: { icon: TrendingDown, color: "text-red-500",     bg: "bg-red-50",     border: "border-red-200" },
};

const SAT_CONFIG: Record<string, { color: string; bg: string }> = {
  Low:    { color: "text-emerald-600", bg: "bg-emerald-50" },
  Medium: { color: "text-amber-600",   bg: "bg-amber-50" },
  High:   { color: "text-red-600",     bg: "bg-red-50" },
};

function SignalBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 bg-white border border-gray-200 px-2 py-1 text-[11px]">
      <span className="text-gray-400">{label}</span>
      <span className="font-semibold text-gray-700">{value}</span>
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
      {items.map((item, i) => (
        <SignalBadge key={i} label={item.label} value={item.value} />
      ))}
    </div>
  );
}

function ScoreBar({ score, color }: { score: number; color: string }) {
  const barColor =
    score >= 70 ? "bg-emerald-400" : score >= 50 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={`text-sm font-bold ${color} w-8 text-right`}>{score}</span>
    </div>
  );
}

function MetricsGrid({ trendDirection, saturationLevel, similarCount }: { trendDirection: string; saturationLevel: string; similarCount: number }) {
  const trend = TREND_CONFIG[trendDirection] ?? TREND_CONFIG.Stable;
  const sat = SAT_CONFIG[saturationLevel] ?? SAT_CONFIG.Medium;
  const TrendIcon = trend.icon;

  return (
    <div className="grid grid-cols-3 gap-4 mb-4">
      <div className={`bg-white  border ${trend.border} p-5 text-center shadow-sm`}>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Market Trend</p>
        <div className={`w-10 h-10  ${trend.bg} flex items-center justify-center mx-auto mb-2`}>
          <TrendIcon className={`w-5 h-5 ${trend.color}`} />
        </div>
        <p className={`text-sm font-bold ${trend.color}`}>{trendDirection}</p>
      </div>

      <div className="bg-white  border border-gray-200 p-5 text-center shadow-sm">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Saturation</p>
        <div className={`w-10 h-10  ${sat.bg} flex items-center justify-center mx-auto mb-2`}>
          <span className={`text-sm font-black ${sat.color}`}>{saturationLevel[0]}</span>
        </div>
        <p className={`text-sm font-bold ${sat.color}`}>{saturationLevel}</p>
      </div>

      <div className="bg-white  border border-gray-200 p-5 text-center shadow-sm">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Similar Ideas</p>
        <p className="text-3xl font-extrabold text-gray-900 mb-1">{similarCount}</p>
        <p className="text-xs text-gray-400">last 30 days</p>
      </div>
    </div>
  );
}

function getVerdict(score: number, trend: string, saturation: string): { label: string; color: string; bg: string } {
  // High score
  if (score >= 75) {
    if (saturation === "Low") return { label: "Strong early opportunity", color: "text-emerald-700", bg: "bg-emerald-50" };
    if (saturation === "High") return { label: "Promising but crowded", color: "text-amber-700", bg: "bg-amber-50" };
    return { label: "Strong signal — move fast", color: "text-emerald-700", bg: "bg-emerald-50" };
  }
  // Mid-high score
  if (score >= 60) {
    if (trend === "Rising" && saturation === "Low") return { label: "Early opportunity — validate quickly", color: "text-emerald-700", bg: "bg-emerald-50" };
    if (trend === "Rising" && saturation === "High") return { label: "Hot space — differentiation is key", color: "text-amber-700", bg: "bg-amber-50" };
    if (trend === "Declining") return { label: "Timing risk — watch momentum", color: "text-amber-700", bg: "bg-amber-50" };
    if (saturation === "High") return { label: "Competitive — needs sharper positioning", color: "text-amber-700", bg: "bg-amber-50" };
    return { label: "Moderate potential — refine your angle", color: "text-amber-700", bg: "bg-amber-50" };
  }
  // Mid score
  if (score >= 45) {
    if (saturation === "Low") return { label: "Unproven space — high risk, high reward", color: "text-amber-700", bg: "bg-amber-50" };
    if (trend === "Declining") return { label: "Fading interest — consider pivoting", color: "text-red-700", bg: "bg-red-50" };
    return { label: "Needs sharper positioning", color: "text-amber-700", bg: "bg-amber-50" };
  }
  // Low score
  if (trend === "Declining" && saturation === "High") return { label: "Crowded and cooling — rethink approach", color: "text-red-700", bg: "bg-red-50" };
  if (saturation === "High") return { label: "Saturated market — major pivot needed", color: "text-red-700", bg: "bg-red-50" };
  return { label: "Weak signal — explore adjacent angles", color: "text-red-700", bg: "bg-red-50" };
}

function OverallSignal({ score, summary, trend, saturation }: { score: number; summary: string; trend: string; saturation: string }) {
  const vColor = score >= 70 ? "text-emerald-600" : score >= 50 ? "text-amber-600" : "text-red-600";
  const vBg = score >= 70 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";
  const verdict = getVerdict(score, trend, saturation);

  return (
    <div className="bg-white  border border-gray-200 p-8 mb-4 text-center shadow-sm">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Overall Signal</p>
      <div className="relative w-32 h-32 mx-auto mb-4">
        <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="52" fill="none" stroke="#f3f4f6" strokeWidth="12" />
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
          <span className="text-xs text-gray-400">/100</span>
        </div>
      </div>
      {/* Verdict badge */}
      <div className={`inline-flex items-center gap-1.5 ${verdict.bg} px-3 py-1.5 rounded-full mb-3`}>
        <span className={`text-xs font-bold ${verdict.color}`}>{verdict.label}</span>
      </div>
      <p className="text-sm text-gray-600 leading-relaxed max-w-sm mx-auto">{summary}</p>
    </div>
  );
}

export default function DeepAnalysis({ submissionId, fallbackScore, fallbackSummary, trendDirection, saturationLevel, similarCount }: DeepAnalysisProps) {
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [detailedAgent, setDetailedAgent] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  // Check if analysis already exists on mount
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
      } catch {
        // Ignore — just means no existing analysis
      } finally {
        setChecked(true);
      }
    }
    check();
  }, [submissionId]);

  // Animate loading steps
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
          if (getData.report) {
            setReport({
              viability_score: getData.report.viability_score,
              summary: getData.report.summary,
              analysis: getData.report.analysis,
              cross_agent_insights: getData.report.cross_agent_insights,
              opportunities: getData.report.opportunities,
              risks: getData.report.risks,
              next_steps: getData.report.next_steps,
            });
            setLoading(false);
            return;
          }
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

  // Loading state
  if (loading) {
    return (
      <div className="bg-white  border border-indigo-200 p-8 shadow-sm mb-4">
        <div className="text-center">
          <div className="w-16 h-16  bg-indigo-50 flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
          <h3 className="text-lg font-extrabold text-gray-900 mb-2">
            AI Deep Analysis in Progress
          </h3>
          <p className="text-sm text-gray-400 mb-6">
            8 specialist agents are analyzing your idea in parallel
          </p>

          <div className="max-w-sm mx-auto space-y-2">
            {ANALYSIS_STEPS.map((step, i) => (
              <div
                key={step}
                className={`flex items-center gap-2 text-xs transition-all duration-300 ${
                  i < stepIndex
                    ? "text-emerald-500"
                    : i === stepIndex
                    ? "text-indigo-600 font-bold"
                    : "text-gray-300"
                }`}
              >
                {i < stepIndex ? (
                  <span className="w-4 text-center">&#10003;</span>
                ) : i === stepIndex ? (
                  <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                ) : (
                  <span className="w-4 text-center">&#8226;</span>
                )}
                {step}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show results with new hierarchy
  if (report) {
    const weightedScore = calcWeightedScore(report.analysis);

    return (
      <div className="space-y-4 mb-4">
        {/* 2. Overall Signal — weighted average from 8 agents */}
        <OverallSignal score={weightedScore} summary={report.summary} trend={trendDirection} saturation={saturationLevel} />

        {/* 3. Why This Result */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600  p-6 text-white shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-widest opacity-80">
              Why This Result
            </span>
          </div>
          <p className="text-sm leading-relaxed opacity-90 mb-4">{report.summary}</p>
          {report.cross_agent_insights?.length > 0 && (
            <ul className="space-y-2">
              {report.cross_agent_insights.map((insight, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-white/20 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-xs leading-relaxed opacity-90">{insight}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 4. Trend / Saturation / Similar Ideas */}
        <MetricsGrid trendDirection={trendDirection} saturationLevel={saturationLevel} similarCount={similarCount} />

        {/* 5. Top Opportunities & Top Risks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {report.opportunities?.length > 0 && (
            <div className="bg-white  border border-emerald-200 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-4 h-4 text-emerald-500" />
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
                  Top Opportunities
                </p>
              </div>
              <ul className="space-y-3">
                {report.opportunities.map((opp, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5 shrink-0">+</span>
                    <p className="text-xs text-gray-600 leading-relaxed">{opp}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {report.risks?.length > 0 && (
            <div className="bg-white  border border-red-200 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <p className="text-xs font-bold text-red-600 uppercase tracking-widest">
                  Top Risks
                </p>
              </div>
              <ul className="space-y-3">
                {report.risks.map((risk, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-red-400 mt-0.5 shrink-0">!</span>
                    <p className="text-xs text-gray-600 leading-relaxed">{risk}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* 6. Next Steps */}
        {report.next_steps?.length > 0 && (
          <div className="bg-white  border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <ArrowRight className="w-4 h-4 text-indigo-500" />
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Next Steps This Week
              </p>
            </div>
            <ul className="space-y-2">
              {report.next_steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3 p-2 bg-indigo-50 ">
                  <span className="w-5 h-5 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-xs text-gray-700 leading-relaxed">{step}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 7. Detailed Breakdown (collapsible) */}
        <div className="bg-white  border border-gray-200 shadow-sm overflow-hidden">
          <button
            onClick={() => setDetailOpen(!detailOpen)}
            className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Detailed Breakdown — 8 Agents
              </p>
            </div>
            {detailOpen ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>
          {detailOpen && (
            <div className="px-6 pb-6 space-y-3">
              {Object.entries(AGENT_META).map(([key, meta]) => {
                const agentData = report.analysis?.[key as keyof typeof report.analysis];
                if (!agentData) return null;

                const Icon = meta.icon;
                const isExpanded = expandedAgent === key;

                return (
                  <div key={key} className="border border-gray-100  overflow-hidden">
                    <button
                      onClick={() => setExpandedAgent(isExpanded ? null : key)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className={`w-8 h-8  ${meta.bg} flex items-center justify-center shrink-0`}>
                        <Icon className={`w-4 h-4 ${meta.color}`} />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-gray-700">{meta.label}</span>
                          <span className="text-[10px] text-gray-400">{meta.weight}</span>
                        </div>
                        <ScoreBar score={agentData.score} color={meta.color} />
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                      )}
                    </button>
                    {isExpanded && (
                      <div className="px-3 pb-3 pt-0">
                        <div className="bg-gray-50  p-3 space-y-2">
                          <AgentSignals agentKey={key} data={agentData} />
                          <p className="text-xs text-gray-600 leading-relaxed">
                            {detailedAgent === key && agentData.detailed_assessment
                              ? agentData.detailed_assessment
                              : agentData.assessment}
                          </p>
                          {agentData.detailed_assessment && (
                            <button
                              onClick={() => setDetailedAgent(detailedAgent === key ? null : key)}
                              className="text-[11px] text-indigo-500 font-semibold hover:text-indigo-700 transition-colors cursor-pointer"
                            >
                              {detailedAgent === key ? "← 요약 보기" : "상세히 보기 →"}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default: show fallback score + metrics + analysis button
  return (
    <>
      {/* Overall Signal — fallback from quick insight */}
      <OverallSignal score={fallbackScore} summary={fallbackSummary} trend={trendDirection} saturation={saturationLevel} />

      {/* Trend / Saturation / Similar — always visible */}
      <MetricsGrid trendDirection={trendDirection} saturationLevel={saturationLevel} similarCount={similarCount} />

      <div className="bg-gradient-to-br from-indigo-50 to-purple-50  border border-indigo-200 p-8 text-center shadow-sm mb-4">
        <div className="w-14 h-14  bg-indigo-100 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-7 h-7 text-indigo-500" />
        </div>
        <h3 className="text-lg font-extrabold text-gray-900 mb-2">
          Want a deeper analysis?
        </h3>
        <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
          Our AI system runs 8 specialist agents in parallel to analyze market size,
          competition, timing, monetization, technical complexity, regulation,
          defensibility, and user acquisition.
        </p>
        <button
          onClick={startAnalysis}
          className="inline-flex items-center gap-2 bg-indigo-500 text-white font-bold px-6 py-3  text-sm hover:bg-indigo-400 transition-colors cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          Run AI Deep Analysis
        </button>
        {error && (
          <p className="mt-4 text-xs text-red-500">{error}</p>
        )}
      </div>
    </>
  );
}
