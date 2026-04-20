"use client";

import { useState, useEffect } from "react";
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
  /** When a parent already renders a verdict/score hero, hide the internal OverallSignal block. */
  hideOverallSignal?: boolean;
  /** Hide internal Next Steps block (parent renders a hoisted NextStepsCard). */
  hideNextSteps?: boolean;
  /** Hide Cross-insight + Opportunities + Risks (parent renders WorkingBreakingBoard). */
  hideInsightsBlock?: boolean;
}

// ── Weights & scoring ─────────────────────────────────────────────────────────

// Shared viability scoring (weighted harmonic mean). Server mirror in route.ts.
import { VIABILITY_WEIGHTS as AGENT_WEIGHTS, computeViabilityScore } from "@/lib/viability";

function calcWeightedScore(analysis: AnalysisReport["analysis"]): number {
  const scores: Record<string, number | null> = {};
  for (const key of Object.keys(AGENT_WEIGHTS)) {
    const agent = analysis?.[key as keyof typeof analysis];
    scores[key] = agent ? agent.score : null;
  }
  return computeViabilityScore(scores);
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

// Real-time progress via SSE. Each step maps to a server-emitted event.
type StepState = "pending" | "active" | "done" | "failed";

type AgentCitation = {
  url: string;
  title: string;
  excerpt: string;
  relevance?: string;
};

type SseEvent =
  | { event: "hard_gate_done"; pass: boolean; hints?: string[] }
  | { event: "llm_gate_start" }
  | { event: "llm_gate_done"; pass: boolean; reason?: string; hints?: string[] }
  | { event: "agents_start"; ids: string[] }
  | { event: "agent_pass_done"; id: string; pass: 1 | 2 | 3; score?: number }
  | {
      event: "agent_done";
      id: string;
      score: number | null;
      assessment: string | null;
      citations: AgentCitation[];
    }
  | { event: "synthesizer_start" }
  | { event: "synthesizer_draft_done" }
  | { event: "synthesizer_critique_done" }
  | { event: "complete"; analysisId: string; viabilityScore: number; report: AnalysisReport }
  | { event: "failed"; stage: string; message: string; hints?: string[] };

function StepRow({
  label,
  state,
  trailing,
}: {
  label: string;
  state: StepState;
  trailing?: string;
}) {
  const color =
    state === "done"
      ? "var(--signal-success)"
      : state === "failed"
      ? "var(--signal-danger)"
      : state === "active"
      ? "var(--accent)"
      : "var(--text-tertiary)";
  return (
    <div
      className="flex items-center gap-2 text-xs py-0.5 transition-all duration-300"
      style={{ color, fontWeight: state === "active" ? 700 : 400 }}
    >
      {state === "done" ? (
        <span className="w-4 text-center">✓</span>
      ) : state === "failed" ? (
        <span className="w-4 text-center">✗</span>
      ) : state === "active" ? (
        <Loader2 className="w-3 h-3 animate-spin shrink-0" />
      ) : (
        <span className="w-4 text-center">·</span>
      )}
      <span className="flex-1">{label}</span>
      {trailing && (
        <span className="text-[11px] font-mono" style={{ color: "var(--text-primary)" }}>
          {trailing}
        </span>
      )}
    </div>
  );
}

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
    <div className="inline-flex items-center gap-1.5 px-2 py-1 text-[13px]"
      style={{ background: "var(--input-bg)", border: "1px solid var(--t-border-bright)" }}>
      <span style={{ color: "var(--text-tertiary)" }}>{label}</span>
      <span className="font-semibold" style={{ color: "var(--text-secondary)" }}>{value}</span>
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

  return (
    <div
      className="grid grid-cols-3 mb-14 border-t border-b"
      style={{ borderColor: "var(--t-border-subtle)" }}
    >
      <MetricCell label="Trend" value={trendDirection} valueColor={trend.color} />
      <MetricCell label="Saturation" value={saturationLevel} />
      <MetricCell
        label="Similar ideas"
        value={similarCount.toString()}
        hint="last 30 days"
      />
    </div>
  );
}

function MetricCell({
  label,
  value,
  valueColor,
  hint,
}: {
  label: string;
  value: string;
  valueColor?: string;
  hint?: string;
}) {
  return (
    <div
      className="py-8 px-6 border-r last:border-r-0"
      style={{ borderColor: "var(--t-border-subtle)" }}
    >
      <p
        className="text-[15px] font-medium tracking-[0.3em] uppercase mb-3"
        style={{ fontFamily: "'Oswald', sans-serif", color: "var(--text-tertiary)" }}
      >
        {label}
      </p>
      <p
        className={`leading-none ${valueColor ?? ""}`}
        style={{
          fontFamily: "'Playfair Display', serif",
          fontWeight: 700,
          fontSize: "1.75rem",
          letterSpacing: "-0.01em",
          color: valueColor ? undefined : "var(--text-primary)",
        }}
      >
        {value}
      </p>
      {hint && (
        <p
          className="mt-2 text-[15px] font-medium tracking-[0.25em] uppercase"
          style={{ fontFamily: "'Oswald', sans-serif", color: "var(--text-tertiary)" }}
        >
          {hint}
        </p>
      )}
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
  const vColor = score >= 70 ? "var(--signal-success)" : score >= 50 ? "var(--signal-warning)" : "var(--signal-danger)";
  const vBg = vColor;
  const verdict = getVerdict(score, trend, saturation);

  return (
    <div className="border p-8 mb-4 text-center"
      style={{ background: "var(--card-bg)", borderColor: "var(--t-border-card)" }}>
      <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--text-tertiary)" }}>Overall Signal</p>
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
          <span className="text-3xl font-extrabold" style={{ color: vColor }}>{score}</span>
          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>/100</span>
        </div>
      </div>
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-3"
        style={{ background: verdict.bg }}>
        <span className={`text-xs font-bold ${verdict.color}`}>{verdict.label}</span>
      </div>
      <p className="text-sm leading-relaxed max-w-md mx-auto" style={{ color: "var(--text-secondary)" }}>{summary}</p>
    </div>
  );
}

// ── Weighted breakdown (ranked bars + inline drill-down) ──────────────────────

interface WeightedEntry {
  key: string;
  meta: typeof AGENT_META[string];
  score: number;
  weight: number;
}

interface WeightedBreakdownProps {
  entries: WeightedEntry[];
  analysis: AnalysisReport["analysis"];
  expandedKey: string | null;
  onToggle: (key: string | null) => void;
  fullKey: string | null;
  onToggleFull: (key: string | null) => void;
  detailed?: boolean;
}

function WeightedBreakdown({
  entries,
  analysis,
  expandedKey,
  onToggle,
  fullKey,
  onToggleFull,
  detailed,
}: WeightedBreakdownProps) {
  if (entries.length === 0) return null;

  return (
    <ul
      className="border-t"
      style={{ borderColor: "var(--t-border-subtle)" }}
    >
      {entries.map((entry, i) => {
        const isExpanded = expandedKey === entry.key;
        return (
          <BreakdownRow
            key={entry.key}
            entry={entry}
            rank={i + 1}
            isExpanded={isExpanded}
            onToggle={() => onToggle(isExpanded ? null : entry.key)}
            analysis={analysis}
            fullKey={fullKey}
            onToggleFull={onToggleFull}
            detailed={detailed}
          />
        );
      })}
    </ul>
  );
}

function BreakdownRow({
  entry,
  rank,
  isExpanded,
  onToggle,
  analysis,
  fullKey,
  onToggleFull,
  detailed,
}: {
  entry: WeightedEntry;
  rank: number;
  isExpanded: boolean;
  onToggle: () => void;
  analysis: AnalysisReport["analysis"];
  fullKey: string | null;
  onToggleFull: (key: string | null) => void;
  detailed?: boolean;
}) {
  const { key, meta, score } = entry;
  const barColor =
    score >= 70 ? "var(--signal-success)" : score >= 50 ? "var(--signal-warning)" : "var(--signal-danger)";

  return (
    <li
      className="transition-opacity border-b"
      style={{ borderColor: "var(--t-border-subtle)" }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        className="w-full flex items-center gap-5 py-3.5 text-left focus:outline-none group transition-opacity hover:opacity-80"
      >
        {/* Rank */}
        <span
          className="shrink-0 tabular-nums leading-none text-right w-7"
          style={{
            fontFamily: "'Oswald', sans-serif",
            fontWeight: 500,
            fontSize: "0.85rem",
            letterSpacing: "0.15em",
            color: "var(--text-tertiary)",
          }}
        >
          {String(rank).padStart(2, "0")}
        </span>

        {/* Agent label */}
        <span
          className="shrink-0"
          style={{
            fontFamily: "'Playfair Display', serif",
            fontWeight: 700,
            fontSize: "1rem",
            letterSpacing: "-0.01em",
            color: "var(--text-primary)",
            minWidth: 150,
          }}
        >
          {meta.label}
        </span>

        {/* Bar */}
        <div
          className="flex-1 h-[2px]"
          style={{ background: "var(--t-border-subtle)" }}
        >
          <div
            className="h-full transition-all duration-700"
            style={{ width: `${score}%`, background: barColor }}
          />
        </div>

        {/* Score */}
        <span className="flex items-baseline gap-1 shrink-0 tabular-nums" style={{ minWidth: 44 }}>
          <span
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 900,
              fontSize: "1.1rem",
              letterSpacing: "-0.02em",
              color: barColor,
            }}
          >
            {score}
          </span>
        </span>

        {/* Chevron */}
        <span
          className="shrink-0 transition-transform"
          style={{
            color: "var(--text-tertiary)",
            transform: isExpanded ? "rotate(180deg)" : undefined,
          }}
        >
          <ChevronDown className="w-3 h-3" strokeWidth={1.75} />
        </span>
      </button>

      {/* Inline detail panel */}
      {isExpanded && (
        <RowDetail
          agentKey={key}
          analysis={analysis}
          fullKey={fullKey}
          onToggleFull={onToggleFull}
          detailed={detailed}
        />
      )}
    </li>
  );
}

function RowDetail({
  agentKey,
  analysis,
  fullKey,
  onToggleFull,
  detailed,
}: {
  agentKey: string;
  analysis: AnalysisReport["analysis"];
  fullKey: string | null;
  onToggleFull: (key: string | null) => void;
  detailed?: boolean;
}) {
  const agentData = analysis?.[agentKey as keyof typeof analysis];
  if (!agentData) return null;

  const isFull = fullKey === agentKey;
  const SHORT_LIMIT = 180;
  const isLong = agentData.assessment.length > SHORT_LIMIT;
  const shortText = isLong
    ? agentData.assessment.slice(0, SHORT_LIMIT).trimEnd() + "…"
    : agentData.assessment;

  return (
    <div className="px-3 pb-4" style={{ paddingLeft: 52 /* icon width + gap */ }}>
      {/* Signals */}
      <AgentSignals agentKey={agentKey} data={agentData} />

      {/* Assessment */}
      <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        {shortText}
      </p>
      {isFull && isLong && (
        <p className="text-sm leading-relaxed mt-2" style={{ color: "var(--text-secondary)" }}>
          {agentData.assessment.slice(SHORT_LIMIT)}
        </p>
      )}

      {/* Detailed (Pro only) */}
      {detailed && isFull && agentData.detailed_assessment && (
        <div
          className="mt-3 pt-3 border-t"
          style={{ borderColor: "var(--t-border-bright)" }}
        >
          <p className="text-[13px] font-bold mb-1 tracking-wider uppercase" style={{ color: "var(--accent)" }}>
            Detailed Analysis
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {agentData.detailed_assessment}
          </p>
        </div>
      )}

      {/* Citations (only when Tavily evidence grounding was active) */}
      {(() => {
        const cits = (agentData as { citations?: AgentCitation[] }).citations;
        if (!Array.isArray(cits) || cits.length === 0) return null;
        return (
          <div
            className="mt-3 pt-3 border-t"
            style={{ borderColor: "var(--t-border-bright)" }}
          >
            <p
              className="text-[11px] font-bold mb-2 tracking-[0.2em] uppercase"
              style={{ color: "var(--text-tertiary)" }}
            >
              Evidence · {cits.length}
            </p>
            <ul className="space-y-1.5">
              {cits.map((c, i) => (
                <li key={i} className="text-[12px] leading-relaxed">
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium hover:underline break-all"
                    style={{ color: "var(--accent)" }}
                  >
                    {c.title || c.url}
                  </a>
                  {c.excerpt && (
                    <span className="block mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                      &ldquo;{c.excerpt}&rdquo;
                    </span>
                  )}
                  {c.relevance && (
                    <span className="block text-[11px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                      → {c.relevance}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        );
      })()}

      {/* Read full toggle */}
      {detailed && (isLong || agentData.detailed_assessment) && (
        <button
          type="button"
          onClick={() => onToggleFull(isFull ? null : agentKey)}
          className="mt-3 text-[13px] font-bold transition-[filter] hover:brightness-110 inline-flex items-center gap-1"
          style={{ color: "var(--accent)" }}
        >
          {isFull ? "Show less ↑" : "Read full analysis ↓"}
        </button>
      )}
    </div>
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
  hideOverallSignal = false,
  hideNextSteps = false,
  hideInsightsBlock = false,
}: DeepAnalysisProps) {
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [fullAgent, setFullAgent] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  // SSE progression state
  const [hardGate, setHardGate] = useState<StepState>("pending");
  const [llmGate, setLlmGate] = useState<StepState>("pending");
  const [agentProg, setAgentProg] = useState<
    Record<
      string,
      {
        state: StepState;
        score?: number;
        citations?: AgentCitation[];
        pass?: 1 | 2 | 3;
      }
    >
  >({});
  const [synthDraft, setSynthDraft] = useState<StepState>("pending");
  const [synthCritique, setSynthCritique] = useState<StepState>("pending");
  const [gateHints, setGateHints] = useState<string[]>([]);

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

  function handleSseEvent(evt: SseEvent) {
    switch (evt.event) {
      case "hard_gate_done":
        setHardGate(evt.pass ? "done" : "failed");
        if (!evt.pass && evt.hints) setGateHints(evt.hints);
        break;
      case "llm_gate_start":
        setLlmGate("active");
        break;
      case "llm_gate_done":
        setLlmGate(evt.pass ? "done" : "failed");
        if (!evt.pass && evt.hints) setGateHints(evt.hints);
        break;
      case "agents_start":
        setAgentProg(
          Object.fromEntries(evt.ids.map((id) => [id, { state: "active" as StepState, pass: 1 as const }]))
        );
        break;
      case "agent_pass_done":
        setAgentProg((prev) => ({
          ...prev,
          [evt.id]: {
            ...prev[evt.id],
            state: "active",
            pass: evt.pass,
            // Show draft score during passes 1-2; final score overrides on agent_done.
            score: typeof evt.score === "number" ? evt.score : prev[evt.id]?.score,
          },
        }));
        break;
      case "agent_done":
        setAgentProg((prev) => ({
          ...prev,
          [evt.id]: {
            state: "done",
            score: evt.score ?? prev[evt.id]?.score,
            citations: evt.citations,
            pass: 3,
          },
        }));
        break;
      case "synthesizer_start":
        setSynthDraft("active");
        break;
      case "synthesizer_draft_done":
        setSynthDraft("done");
        setSynthCritique("active");
        break;
      case "synthesizer_critique_done":
        setSynthCritique("done");
        break;
      case "complete":
        setReport(evt.report);
        // Notify sibling components (IdeaHero, NextStepsCard, WorkingBreakingBoard)
        // that a fresh analysis exists for this submission so they can refetch.
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("tryflow:analysis_complete", { detail: { submissionId } })
          );
        }
        break;
      case "failed":
        setError(evt.message);
        if (evt.hints) setGateHints(evt.hints);
        break;
    }
  }

  async function startAnalysis() {
    setLoading(true);
    setError(null);
    setHardGate("pending");
    setLlmGate("pending");
    setAgentProg({});
    setSynthDraft("pending");
    setSynthCritique("pending");
    setGateHints([]);

    try {
      const res = await fetch("/api/analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({ submissionId }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 409 && data.analysisId) {
          const getRes = await fetch(`/api/analysis?submissionId=${submissionId}`);
          const getData = await getRes.json();
          if (getData.report) {
            setReport(getData.report);
            setLoading(false);
            return;
          }
        }
        throw new Error(data.error || "Analysis failed");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() ?? "";
        for (const chunk of chunks) {
          const dataLine = chunk.split("\n").find((l) => l.startsWith("data: "));
          if (!dataLine) continue;
          try {
            const evt = JSON.parse(dataLine.slice(6)) as SseEvent;
            handleSseEvent(evt);
          } catch {
            /* skip malformed */
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (!checked) return null;

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (loading) {
    const doneAgents = Object.values(agentProg).filter((s) => s.state === "done").length;
    return (
      <div
        className="border p-8"
        style={{ background: "var(--accent-soft)", borderColor: "var(--accent-ring)" }}
      >
        <div className="text-center mb-6">
          <div
            className="w-16 h-16 flex items-center justify-center mx-auto mb-4"
            style={{ background: "var(--accent-soft)", border: "1px solid var(--accent-ring)" }}
          >
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--accent)" }} />
          </div>
          <h3 className="text-lg font-extrabold mb-1" style={{ color: "var(--text-primary)" }}>
            AI Deep Analysis in Progress
          </h3>
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            실시간 스트리밍 · {doneAgents}/8 agents done
          </p>
        </div>

        <div className="max-w-sm mx-auto space-y-5">
          <div>
            <div
              className="text-[10px] tracking-[0.3em] uppercase mb-1.5"
              style={{ color: "var(--text-tertiary)" }}
            >
              Quality Gates
            </div>
            <StepRow label="Hard filter" state={hardGate} />
            <StepRow label="LLM effort check" state={llmGate} />
          </div>

          <div>
            <div
              className="text-[10px] tracking-[0.3em] uppercase mb-1.5"
              style={{ color: "var(--text-tertiary)" }}
            >
              Agents
            </div>
            {(Object.keys(AGENT_META) as (keyof typeof AGENT_META)[]).map((id) => {
              const meta = AGENT_META[id];
              const prog = agentProg[id as string];
              const citCount = prog?.citations?.length ?? 0;
              const scoreStr = typeof prog?.score === "number" ? String(prog.score) : "";
              // While active, show pass progress. When done, show score + citations.
              const passStr =
                prog?.state === "active" && prog.pass ? `${prog.pass}/3` : "";
              const parts: string[] = [];
              if (passStr) parts.push(passStr);
              if (scoreStr) parts.push(scoreStr);
              if (citCount > 0) parts.push(`📎${citCount}`);
              const trailing = parts.length > 0 ? parts.join(" · ") : undefined;
              return (
                <StepRow
                  key={id as string}
                  label={meta.label}
                  state={prog?.state ?? "pending"}
                  trailing={trailing}
                />
              );
            })}
          </div>

          <div>
            <div
              className="text-[10px] tracking-[0.3em] uppercase mb-1.5"
              style={{ color: "var(--text-tertiary)" }}
            >
              Synthesizer
            </div>
            <StepRow label="Draft" state={synthDraft} />
            <StepRow label="Critique & revise" state={synthCritique} />
          </div>
        </div>

        {gateHints.length > 0 && (
          <div
            className="max-w-sm mx-auto mt-6 p-3"
            style={{
              background: "var(--surface-subtle)",
              border: "1px solid var(--t-border-subtle)",
            }}
          >
            <div className="text-xs font-bold mb-1" style={{ color: "var(--text-primary)" }}>
              개선 제안
            </div>
            <ul className="text-xs space-y-1" style={{ color: "var(--text-secondary)" }}>
              {gateHints.map((h, i) => (
                <li key={i}>· {h}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // ── Results ───────────────────────────────────────────────────────────────────
  if (report) {
    const weightedScore = calcWeightedScore(report.analysis);

    // Unified entry list — used both by the weighted-bar ranking above and the
    // agent cards grid below. Keep AGENT_META order for deterministic keys.
    const allAgentEntries = (Object.entries(AGENT_META) as [keyof typeof AGENT_META, typeof AGENT_META[keyof typeof AGENT_META]][])
      .map(([key, meta]) => {
        const agentData = report.analysis?.[key as keyof typeof report.analysis];
        if (!agentData) return null;
        return {
          key,
          meta,
          score: agentData.score,
          weight: AGENT_WEIGHTS[key as keyof typeof AGENT_WEIGHTS] ?? 0,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    // Ranking — heaviest-weighted first, score desc as tie-breaker.
    const rankedEntries = [...allAgentEntries].sort(
      (a, b) => b.weight - a.weight || b.score - a.score,
    );

    return (
      <div className="space-y-4">

        {/* Overall Signal — weighted score from 8 agents. Skipped when a parent hero shows it. */}
        {!hideOverallSignal && (
          <OverallSignal score={weightedScore} summary={report.summary} trend={trendDirection} saturation={saturationLevel} />
        )}

        {/* 8-agent breakdown — editorial section */}
        <section className="mb-14">
          <div className="flex items-center gap-4 mb-8">
            <span
              className="text-[15px] font-medium tracking-[0.35em] uppercase"
              style={{ fontFamily: "'Oswald', sans-serif", color: "var(--text-tertiary)" }}
            >
              The Agents
            </span>
            <span className="flex-1 h-px" style={{ background: "var(--t-border-subtle)" }} />
            <span
              className="text-[15px] font-medium tracking-[0.25em] uppercase shrink-0"
              style={{ fontFamily: "'Oswald', sans-serif", color: "var(--text-tertiary)" }}
            >
              8 dimensions · ranked
            </span>
          </div>

          <WeightedBreakdown
            entries={rankedEntries}
            analysis={report.analysis}
            expandedKey={expandedAgent}
            onToggle={(key) => {
              setExpandedAgent(key);
              setFullAgent(null);
            }}
            fullKey={fullAgent}
            onToggleFull={setFullAgent}
            detailed={detailed}
          />
        </section>

        {/* Submitter Pro upsell — shown instead of detail sections for free users */}
        {!detailed && (
          <section className="mb-14">
            <div className="flex items-center gap-4 mb-8">
              <span
                className="text-[15px] font-medium tracking-[0.35em] uppercase"
                style={{ fontFamily: "'Oswald', sans-serif", color: "var(--accent)" }}
              >
                Summary View
              </span>
              <span className="flex-1 h-px" style={{ background: "var(--t-border-subtle)" }} />
            </div>
            <div className="max-w-3xl">
              <p
                className="mb-6 leading-[1.2]"
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontStyle: "italic",
                  fontWeight: 400,
                  fontSize: "1.5rem",
                  letterSpacing: "-0.01em",
                  color: "var(--text-primary)",
                }}
              >
                &ldquo;Unlock detailed per-agent assessments.&rdquo;
              </p>
              <p
                className="text-[14.5px] leading-[1.75] mb-6"
                style={{ color: "var(--text-secondary)" }}
              >
                You&apos;re seeing the summarized score and radar. Upgrade to Plus to unlock cross-agent insights, opportunities, risks, and recommended next steps on your own ideas.
              </p>
              <a
                href="/pricing"
                className="inline-flex items-center gap-2 text-[15px] font-medium tracking-[0.3em] uppercase transition-opacity hover:opacity-70"
                style={{ fontFamily: "'Oswald', sans-serif", color: "var(--accent)" }}
              >
                Upgrade to Plus
                <ArrowRight className="w-3 h-3" strokeWidth={1.75} />
              </a>
            </div>
          </section>
        )}

        {/* Cross-agent insights — Submitter Pro only */}
        {!hideInsightsBlock && detailed && report.cross_agent_insights?.length > 0 && (
          <div className="border p-6"
            style={{ background: "var(--card-bg)", borderColor: "var(--t-border-card)" }}>
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-4 h-4" style={{ color: "var(--accent)" }} />
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-tertiary)" }}>Cross-Agent Insights</p>
            </div>
            <ul className="space-y-2">
              {report.cross_agent_insights.map((insight, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full text-[15px] font-bold flex items-center justify-center shrink-0 mt-0.5"
                    style={{ color: "var(--accent)", background: "var(--accent-soft)", border: "1px solid var(--accent-ring)" }}>
                    {i + 1}
                  </span>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{insight}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Opportunities & Risks — Submitter Pro only */}
        {!hideInsightsBlock && detailed && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {report.opportunities?.length > 0 && (
              <div className="border p-6"
                style={{ background: "rgba(16,185,129,0.04)", borderColor: "rgba(16,185,129,0.2)" }}>
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="w-4 h-4" style={{ color: "var(--signal-success)" }} />
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--signal-success)" }}>Opportunities</p>
                </div>
                <ul className="space-y-3">
                  {report.opportunities.map((opp, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-0.5 shrink-0 font-bold" style={{ color: "var(--signal-success)" }}>+</span>
                      <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{opp}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {report.risks?.length > 0 && (
              <div className="border p-6"
                style={{ background: "rgba(239,68,68,0.04)", borderColor: "rgba(239,68,68,0.2)" }}>
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-4 h-4" style={{ color: "var(--signal-danger)" }} />
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--signal-danger)" }}>Risks</p>
                </div>
                <ul className="space-y-3">
                  {report.risks.map((risk, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-0.5 shrink-0 font-bold" style={{ color: "var(--signal-danger)" }}>!</span>
                      <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{risk}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Next Steps — Submitter Pro only */}
        {!hideNextSteps && detailed && report.next_steps?.length > 0 && (
          <div className="border p-6"
            style={{ background: "var(--card-bg)", borderColor: "var(--t-border-card)" }}>
            <div className="flex items-center gap-2 mb-4">
              <ArrowRight className="w-4 h-4" style={{ color: "var(--accent)" }} />
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-tertiary)" }}>Next Steps This Week</p>
            </div>
            <ul className="space-y-2">
              {report.next_steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3 p-2"
                  style={{ background: "var(--accent-soft)", border: "1px solid var(--accent-ring)" }}>
                  <span className="w-5 h-5 rounded-full text-white text-[15px] font-bold flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: "var(--accent)" }}>
                    {i + 1}
                  </span>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{step}</p>
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
      {/* Show fallback score while no AI analysis — skipped when parent hero handles it */}
      {!hideOverallSignal && (
        <OverallSignal score={fallbackScore} summary={fallbackSummary} trend={trendDirection} saturation={saturationLevel} />
      )}

      {/* Metrics */}
      <MetricsGrid trendDirection={trendDirection} saturationLevel={saturationLevel} similarCount={similarCount} />

      <div className="border p-8 text-center"
        style={{ background: "var(--accent-soft)", borderColor: "var(--accent-ring)" }}>
        <div className="w-14 h-14 flex items-center justify-center mx-auto mb-4"
          style={{ background: "var(--accent-soft)", border: "1px solid var(--accent-ring)" }}>
          <Sparkles className="w-7 h-7" style={{ color: "var(--accent)" }} />
        </div>
        <h3 className="text-lg font-extrabold mb-2" style={{ color: "var(--text-primary)" }}>Want a deeper analysis?</h3>
        <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: "var(--text-tertiary)" }}>
          Our AI system runs 8 specialist agents in parallel to analyze market size,
          competition, timing, monetization, technical complexity, regulation,
          defensibility, and user acquisition.
        </p>
        <button
          onClick={startAnalysis}
          className="inline-flex items-center gap-2 text-white font-bold px-6 py-3 text-sm transition-[filter] hover:brightness-110 cursor-pointer"
          style={{ background: "var(--accent)" }}
        >
          <Sparkles className="w-4 h-4" />
          Run AI Deep Analysis
        </button>
        {error && (
          <div className="mt-4 max-w-md mx-auto">
            <p className="text-xs mb-2" style={{ color: "var(--signal-danger)" }}>{error}</p>
            {gateHints.length > 0 && (
              <div
                className="p-3 text-left"
                style={{
                  background: "var(--surface-subtle)",
                  border: "1px solid var(--t-border-subtle)",
                }}
              >
                <div
                  className="text-[10px] tracking-[0.2em] uppercase mb-1.5"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  개선 제안
                </div>
                <ul className="text-xs space-y-1" style={{ color: "var(--text-secondary)" }}>
                  {gateHints.map((h, i) => (
                    <li key={i}>· {h}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}