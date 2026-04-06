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
} from "lucide-react";

interface AgentAnalysis {
  score: number;
  assessment: string;
  [key: string]: unknown;
}

interface AnalysisReport {
  viability_score: number;
  summary: string;
  analysis: {
    market_size: AgentAnalysis & { signals?: { tam_estimate?: string } };
    competition: AgentAnalysis & { intensity?: string; key_players?: string[] };
    regulation: AgentAnalysis & { risk_level?: string; signals?: { key_concerns?: string[] } };
    technical_difficulty: AgentAnalysis & { level?: string; signals?: { key_challenges?: string[] } };
    monetization: AgentAnalysis & { signals?: { models?: string[]; recommended_model?: string } };
    timing: AgentAnalysis & { signal?: string };
    defensibility: AgentAnalysis & { signals?: { moats?: string[]; primary_moat?: string } };
    user_acquisition: AgentAnalysis & { signals?: { channels?: string[]; estimated_cac?: string } };
  };
  cross_agent_insights: string[];
  opportunities: string[];
  risks: string[];
  next_steps: string[];
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

export default function DeepAnalysis({ submissionId }: { submissionId: string }) {
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

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
          // Already exists, re-fetch
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
      <div className="bg-white  border border-indigo-200 p-8 shadow-sm">
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

          {/* Progress steps */}
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

  // Show results
  if (report) {
    const vColor =
      report.viability_score >= 70
        ? "text-emerald-600"
        : report.viability_score >= 50
        ? "text-amber-600"
        : "text-red-600";
    const vBg =
      report.viability_score >= 70
        ? "#10b981"
        : report.viability_score >= 50
        ? "#f59e0b"
        : "#ef4444";

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600  p-6 text-white shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-widest opacity-80">
              AI Deep Analysis
            </span>
          </div>
          <div className="flex items-start gap-6">
            {/* Score circle */}
            <div className="relative w-24 h-24 shrink-0">
              <svg className="w-24 h-24 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="10" />
                <circle
                  cx="60" cy="60" r="52" fill="none"
                  stroke="white" strokeWidth="10"
                  strokeDasharray={`${2 * Math.PI * 52}`}
                  strokeDashoffset={`${2 * Math.PI * 52 * (1 - report.viability_score / 100)}`}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 1s ease" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-extrabold">{report.viability_score}</span>
                <span className="text-[10px] opacity-60">/100</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm leading-relaxed opacity-90">{report.summary}</p>
            </div>
          </div>
        </div>

        {/* Agent scores grid */}
        <div className="bg-white  border border-gray-200 p-6 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
            8-Agent Analysis Breakdown
          </p>
          <div className="space-y-3">
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
                      <div className="bg-gray-50  p-3">
                        <p className="text-xs text-gray-600 leading-relaxed">
                          {agentData.assessment}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Cross-agent insights */}
        {report.cross_agent_insights?.length > 0 && (
          <div className="bg-white  border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-4 h-4 text-indigo-500" />
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Cross-Agent Insights
              </p>
            </div>
            <ul className="space-y-2">
              {report.cross_agent_insights.map((insight, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-xs text-gray-600 leading-relaxed">{insight}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Opportunities & Risks side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Opportunities */}
          {report.opportunities?.length > 0 && (
            <div className="bg-white  border border-emerald-200 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-4 h-4 text-emerald-500" />
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
                  Opportunities
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

          {/* Risks */}
          {report.risks?.length > 0 && (
            <div className="bg-white  border border-red-200 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <p className="text-xs font-bold text-red-600 uppercase tracking-widest">
                  Risks
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

        {/* Next Steps */}
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
      </div>
    );
  }

  // Default: show analysis button
  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50  border border-indigo-200 p-8 text-center shadow-sm">
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
  );
}
