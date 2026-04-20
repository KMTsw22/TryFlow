"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { ArrowRight, ArrowLeft, Search, Lock } from "lucide-react";
import { getCategoryTheme } from "@/lib/categories";
import { getDimensionByShortLabel } from "@/lib/dimensions";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";

// ── Typography tokens ───────────────────────────────────────────────────
const SERIF = "'Playfair Display', serif";
const DISPLAY = "'Oswald', sans-serif";
const ACCENT_A = "#818cf8"; // indigo for Idea A
const ACCENT_B = "#34d399"; // emerald for Idea B

// ── Types ───────────────────────────────────────────────────────────────
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

interface Idea {
  id: string;
  category: string;
  target_user: string;
  description: string;
  created_at: string;
  insight_reports: Report | Report[] | null;
}

type Plan = "free" | "plus" | "pro";

const AGENT_LABELS: Record<string, string> = {
  market_size: "Market",
  competition: "Competition",
  timing: "Timing",
  monetization: "Revenue",
  technical_difficulty: "Technical",
  regulation: "Regulation",
  defensibility: "Moat",
  user_acquisition: "Acquisition",
};

const CATEGORIES = [
  "All",
  "SaaS / B2B",
  "Consumer App",
  "Marketplace",
  "Dev Tools",
  "Health & Wellness",
  "Education",
  "Fintech",
  "E-commerce",
  "Hardware",
];

// ── Helpers ─────────────────────────────────────────────────────────────
function getReport(idea: Idea): Report | null {
  if (!idea.insight_reports) return null;
  if (Array.isArray(idea.insight_reports)) return idea.insight_reports[0] ?? null;
  return idea.insight_reports;
}

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

function truncate(text: string, max: number) {
  return text.length > max ? text.slice(0, max) + "…" : text;
}

function scoreHex(score: number): string {
  if (score >= 70) return "#10b981";
  if (score >= 50) return "#f59e0b";
  return "#ef4444";
}

// ── Shared editorial KickerRule ────────────────────────────────────────
function KickerRule({ title, right }: { title: string; right?: string }) {
  return (
    <div className="flex items-center gap-4 mb-8">
      <span
        className="text-[15px] font-medium tracking-[0.35em] uppercase"
        style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
      >
        {title}
      </span>
      <span className="flex-1 h-px" style={{ background: "var(--t-border-subtle)" }} />
      {right && (
        <span
          className="text-[15px] font-medium tracking-[0.25em] uppercase shrink-0"
          style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
        >
          {right}
        </span>
      )}
    </div>
  );
}

// ── Dual Radar — editorial octagon ──────────────────────────────────────
function DualRadar({
  analysisA,
  analysisB,
}: {
  analysisA: Analysis | null;
  analysisB: Analysis | null;
}) {
  // Hover state for the dimension tooltip. We track which label is hovered
  // and where to place the tooltip — the tick component reports its anchor
  // position up to the container so the tooltip renders as a single HTML
  // overlay (SVG-native tooltips are ugly; this keeps the editorial voice).
  const [hovered, setHovered] = useState<{
    subject: string;
    x: number;
    y: number;
  } | null>(null);

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
    <section className="mb-14" aria-label="Balance across 8 analysis dimensions">
      <KickerRule title="8-Dimension Balance" right="Where each idea wins" />

      {/* Avg indicators */}
      <div className="flex items-center gap-10 mb-6">
        <div className="flex items-baseline gap-3">
          <span className="w-2 h-2 rounded-full" style={{ background: ACCENT_A }} />
          <span
            className="text-[14px] font-medium tracking-[0.3em] uppercase"
            style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
          >
            Idea A
          </span>
          <span
            className="tabular-nums"
            style={{
              fontFamily: SERIF,
              fontWeight: 900,
              fontSize: "1.75rem",
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
            }}
          >
            {avgA}
          </span>
          <span
            className="text-[10px] font-medium tracking-[0.2em] uppercase"
            style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
          >
            avg
          </span>
        </div>
        <div className="flex items-baseline gap-3">
          <span className="w-2 h-2 rounded-full" style={{ background: ACCENT_B }} />
          <span
            className="text-[14px] font-medium tracking-[0.3em] uppercase"
            style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
          >
            Idea B
          </span>
          <span
            className="tabular-nums"
            style={{
              fontFamily: SERIF,
              fontWeight: 900,
              fontSize: "1.75rem",
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
            }}
          >
            {avgB}
          </span>
          <span
            className="text-[10px] font-medium tracking-[0.2em] uppercase"
            style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
          >
            avg
          </span>
        </div>
      </div>

      {/* Radar — solid octagon grid, editorial feel. Wrapped in relative
          container so the dimension tooltip can overlay it absolutely. */}
      <div className="relative" style={{ height: 460 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} margin={{ top: 24, right: 80, bottom: 24, left: 80 }}>
            <PolarGrid
              stroke="var(--t-border-bright)"
              gridType="polygon"
            />
            <PolarAngleAxis
              dataKey="subject"
              tick={(tickProps) => (
                <EditorialTick
                  {...tickProps}
                  data={data}
                  onHover={setHovered}
                />
              )}
              tickLine={false}
            />
            <Radar
              name="A"
              dataKey="A"
              stroke={ACCENT_A}
              strokeWidth={1.5}
              fill={ACCENT_A}
              fillOpacity={0.16}
              isAnimationActive={false}
              dot={{ fill: ACCENT_A, r: 3, stroke: "transparent" }}
            />
            <Radar
              name="B"
              dataKey="B"
              stroke={ACCENT_B}
              strokeWidth={1.5}
              fill={ACCENT_B}
              fillOpacity={0.16}
              isAnimationActive={false}
              dot={{ fill: ACCENT_B, r: 3, stroke: "transparent" }}
            />
          </RadarChart>
        </ResponsiveContainer>

        {/* Hover tooltip — explains what each dimension actually measures.
            Positioned above the hovered label using the tick's reported
            SVG anchor point. */}
        {hovered && <DimensionTooltip subject={hovered.subject} x={hovered.x} y={hovered.y} />}
      </div>
    </section>
  );
}

function DimensionTooltip({
  subject,
  x,
  y,
}: {
  subject: string;
  x: number;
  y: number;
}) {
  const meta = getDimensionByShortLabel(subject);
  if (!meta) return null;

  return (
    <div
      role="tooltip"
      className="absolute z-30 pointer-events-none"
      style={{
        left: x,
        top: y,
        transform: "translate(-50%, calc(-100% - 14px))",
        maxWidth: 280,
      }}
    >
      <div
        className="px-4 py-3 text-left shadow-lg"
        style={{
          background: "var(--surface-3)",
          border: "1px solid var(--t-border-bright)",
        }}
      >
        <p
          className="text-[12px] font-medium tracking-[0.3em] uppercase mb-1.5"
          style={{ fontFamily: DISPLAY, color: "var(--accent)" }}
        >
          {meta.full}
        </p>
        <p
          className="text-[13px] leading-[1.6] mb-2"
          style={{ color: "var(--text-primary)" }}
        >
          {meta.description}
        </p>
        <p
          className="text-[12px] leading-[1.5] italic"
          style={{ fontFamily: SERIF, color: "var(--text-tertiary)" }}
        >
          High score: {meta.highMeans}
        </p>
      </div>
    </div>
  );
}

function EditorialTick(props: {
  x?: number;
  y?: number;
  payload?: { value: string };
  textAnchor?: "inherit" | "end" | "start" | "middle";
  data: { subject: string; A: number; B: number }[];
  onHover?: (hover: { subject: string; x: number; y: number } | null) => void;
}) {
  const { x = 0, y = 0, payload, textAnchor = "middle", data, onHover } = props;
  const entry = data.find((d) => d.subject === payload?.value);
  const subject = payload?.value ?? "";

  // Transparent hit-target rectangle behind the label so the entire glyph
  // row (including the score tspans) is a comfortable hover zone.
  return (
    <g
      style={{ cursor: "help" }}
      onMouseEnter={() => onHover?.({ subject, x, y })}
      onMouseLeave={() => onHover?.(null)}
    >
      <rect
        x={x - 70}
        y={y - 12}
        width={140}
        height={22}
        fill="transparent"
      />
      <text
        x={x}
        y={y}
        textAnchor={textAnchor}
        fill="var(--text-secondary)"
        fontSize={13}
        fontWeight={500}
        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "0.04em" }}
      >
        {subject}
        <tspan
          dx={8}
          fill={ACCENT_A}
          style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 600, letterSpacing: "0.1em" }}
        >
          {entry?.A ?? 0}
        </tspan>
        <tspan
          dx={3}
          fill="var(--text-tertiary)"
        >
          ·
        </tspan>
        <tspan
          dx={3}
          fill={ACCENT_B}
          style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 600, letterSpacing: "0.1em" }}
        >
          {entry?.B ?? 0}
        </tspan>
      </text>
    </g>
  );
}

// ── Score face-off column (for head-to-head hero) ──────────────────────
function ScoreFaceoff({
  letter,
  idea,
  score,
  isWinner,
  accent,
}: {
  letter: string;
  idea: Idea;
  score: number;
  isWinner: boolean;
  accent: string;
}) {
  const numColor = scoreHex(score);

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <span
          className="inline-flex items-center justify-center w-6 h-6 shrink-0"
          style={{
            background: accent,
            color: "#fff",
            fontFamily: DISPLAY,
            fontSize: "0.72rem",
            fontWeight: 600,
            letterSpacing: "0.1em",
          }}
        >
          {letter}
        </span>
        <span
          className="text-[14px] font-medium tracking-[0.3em] uppercase truncate"
          style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
        >
          {idea.category}
        </span>
        {isWinner && (
          <span
            className="text-[10px] font-medium tracking-[0.3em] uppercase shrink-0"
            style={{ fontFamily: DISPLAY, color: "#10b981" }}
          >
            Leads
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-4">
        <span
          className="leading-[0.82] tabular-nums"
          style={{
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: "clamp(5rem, 9vw, 7.5rem)",
            letterSpacing: "-0.05em",
            color: numColor,
          }}
        >
          {score}
        </span>
        <span
          className="pb-1 text-sm font-medium tracking-[0.3em] uppercase"
          style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
        >
          / 100
        </span>
      </div>

      <p
        className="text-[17px] leading-[1.4]"
        style={{
          fontFamily: SERIF,
          fontWeight: 700,
          letterSpacing: "-0.01em",
          color: "var(--text-primary)",
        }}
      >
        For {idea.target_user}
      </p>
    </div>
  );
}

// ── Editorial face-off rows ────────────────────────────────────────────
function FaceoffRow({
  label,
  a,
  b,
  winner,
}: {
  label: string;
  a: string | number | null | undefined;
  b: string | number | null | undefined;
  winner: "a" | "b" | null;
}) {
  return (
    <div
      className="grid grid-cols-[140px_1fr_1fr] gap-x-8 py-5 border-b items-baseline"
      style={{ borderColor: "var(--t-border-subtle)" }}
    >
      <span
        className="text-[14px] font-medium tracking-[0.3em] uppercase"
        style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
      >
        {label}
      </span>
      <FaceoffValue value={a} active={winner === "a"} accent={ACCENT_A} />
      <FaceoffValue value={b} active={winner === "b"} accent={ACCENT_B} />
    </div>
  );
}

function FaceoffValue({
  value,
  active,
  accent,
}: {
  value: string | number | null | undefined;
  active: boolean;
  accent: string;
}) {
  return (
    <div className="flex items-baseline gap-3">
      <span
        style={{
          fontFamily: SERIF,
          fontWeight: 700,
          fontSize: "1.35rem",
          letterSpacing: "-0.01em",
          color: active ? "var(--text-primary)" : "var(--text-secondary)",
        }}
      >
        {value ?? "—"}
      </span>
      {active && (
        <span
          className="text-[10px] font-medium tracking-[0.25em] uppercase"
          style={{ fontFamily: DISPLAY, color: accent }}
        >
          Leads
        </span>
      )}
    </div>
  );
}

function FaceoffTextRow({
  label,
  a,
  b,
}: {
  label: string;
  a: string;
  b: string;
}) {
  return (
    <div
      className="grid grid-cols-[140px_1fr_1fr] gap-x-8 py-5 border-b"
      style={{ borderColor: "var(--t-border-subtle)" }}
    >
      <span
        className="pt-1 text-[14px] font-medium tracking-[0.3em] uppercase"
        style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
      >
        {label}
      </span>
      <p
        className="text-[13.5px] leading-[1.65]"
        style={{ color: "var(--text-secondary)" }}
      >
        {a}
      </p>
      <p
        className="text-[13.5px] leading-[1.65]"
        style={{ color: "var(--text-secondary)" }}
      >
        {b}
      </p>
    </div>
  );
}

// ── Main Compare page ──────────────────────────────────────────────────
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

      try {
        const ownRes = await fetch("/api/ideas").then((r) => r.json()).catch(() => ({ ideas: [] }));
        const ownIdeas: Idea[] = ownRes.ideas ?? [];

        if (userPlan === "pro") {
          const allRes = await fetch("/api/ideas/all").then((r) => r.json()).catch(() => ({ ideas: [] }));
          const allIdeas: Idea[] = allRes.ideas ?? [];
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
  const winner: "a" | "b" | null =
    scoreA > scoreB ? "a" : scoreB > scoreA ? "b" : null;

  // ── Loading ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-6 h-6 border-2 border-[color:var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Free — locked ──────────────────────────────────────────────────
  if (plan === "free") {
    return (
      <div className="max-w-6xl mx-auto px-6 py-10 pt-24">
        <div className="flex items-center gap-4 mb-8">
          <span
            className="text-[15px] font-medium tracking-[0.35em] uppercase"
            style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
          >
            Compare
          </span>
          <span className="flex-1 h-px" style={{ background: "var(--t-border-subtle)" }} />
          <span
            className="text-[15px] font-medium tracking-[0.25em] uppercase inline-flex items-center gap-2"
            style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
          >
            <Lock className="w-3 h-3" /> Locked
          </span>
        </div>

        <h1
          className="mb-6"
          style={{
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: "clamp(2.25rem, 4vw, 3.5rem)",
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
            color: "var(--text-primary)",
          }}
        >
          A paid feature.
        </h1>

        <p
          className="text-[16px] leading-[1.75] mb-10 max-w-xl"
          style={{ color: "var(--text-secondary)" }}
        >
          Upgrade to <span style={{ color: "var(--accent)" }}>Plus</span> to compare your own
          ideas side-by-side, or <span style={{ color: "var(--accent)" }}>Pro</span> to also
          compare against every public idea on the platform.
        </p>

        <Link
          href="/pricing"
          className="group inline-flex items-center gap-3 text-[15px] font-medium tracking-[0.3em] uppercase transition-opacity hover:opacity-70"
          style={{ fontFamily: DISPLAY, color: "var(--accent)" }}
        >
          See plans
          <ArrowRight
            className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1"
            strokeWidth={2}
          />
        </Link>
      </div>
    );
  }

  // ── Comparison view ─────────────────────────────────────────────────
  if (comparing && ideaA && ideaB) {
    const trendWinner: "a" | "b" | null =
      reportA?.trend_direction === "Rising" && reportB?.trend_direction !== "Rising"
        ? "a"
        : reportB?.trend_direction === "Rising" && reportA?.trend_direction !== "Rising"
        ? "b"
        : null;
    const satWinner: "a" | "b" | null =
      reportA?.saturation_level === "Low" && reportB?.saturation_level !== "Low"
        ? "a"
        : reportB?.saturation_level === "Low" && reportA?.saturation_level !== "Low"
        ? "b"
        : null;
    const simWinner: "a" | "b" | null =
      (reportA?.similar_count ?? 0) < (reportB?.similar_count ?? 0)
        ? "a"
        : (reportB?.similar_count ?? 0) < (reportA?.similar_count ?? 0)
        ? "b"
        : null;

    return (
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Back link */}
        <button
          onClick={() => setComparing(false)}
          className="inline-flex items-center gap-1.5 text-[15px] font-medium tracking-[0.2em] uppercase mb-10 transition-colors hover:text-[color:var(--text-primary)]"
          style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
        >
          <ArrowLeft className="w-3 h-3" /> Back to selection
        </button>

        {/* Editorial kicker */}
        <div className="flex items-center gap-4 mb-6">
          <span
            className="text-[15px] font-medium tracking-[0.35em] uppercase"
            style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
          >
            The Head-to-Head
          </span>
          <span className="flex-1 h-px" style={{ background: "var(--t-border-subtle)" }} />
          <span
            className="text-[15px] font-medium tracking-[0.25em] uppercase shrink-0"
            style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
          >
            {winner
              ? `Idea ${winner === "a" ? "A" : "B"} · +${Math.abs(scoreA - scoreB)} pts`
              : "Tied"}
          </span>
        </div>

        <h1
          className="mb-8"
          style={{
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: "clamp(2.5rem, 5vw, 4rem)",
            lineHeight: 1.02,
            letterSpacing: "-0.03em",
            color: "var(--text-primary)",
          }}
        >
          Idea A vs Idea B.
        </h1>

        {/* Head-to-head hero */}
        <section
          className="relative py-10 mb-6"
          style={{
            borderTop: "1px solid var(--t-border-subtle)",
            borderBottom: "1px solid var(--t-border-subtle)",
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 mb-8">
            <ScoreFaceoff
              letter="A"
              idea={ideaA}
              score={scoreA}
              isWinner={winner === "a"}
              accent={ACCENT_A}
            />
            <ScoreFaceoff
              letter="B"
              idea={ideaB}
              score={scoreB}
              isWinner={winner === "b"}
              accent={ACCENT_B}
            />
          </div>

          {winner && (
            <p
              className="leading-[1.15] mb-5 max-w-3xl"
              style={{
                fontFamily: SERIF,
                fontStyle: "italic",
                fontWeight: 400,
                fontSize: "clamp(1.35rem, 2.4vw, 2rem)",
                letterSpacing: "-0.01em",
                color: "var(--text-primary)",
              }}
            >
              &ldquo;Idea {winner === "a" ? "A" : "B"} leads by{" "}
              {Math.abs(scoreA - scoreB)} points.&rdquo;
            </p>
          )}

          <p
            className="text-[14.5px] leading-[1.75] max-w-3xl"
            style={{ color: "var(--text-secondary)" }}
          >
            {winner === "a"
              ? reportA?.summary
              : winner === "b"
              ? reportB?.summary
              : "Both ideas score evenly on the overall viability index. The detail rows below may tip the balance."}
          </p>
        </section>

        {/* 8-Dimension radar */}
        <DualRadar analysisA={analysisA} analysisB={analysisB} />

        {/* Detail rows */}
        <section className="mb-14">
          <KickerRule title="The Breakdown" right="Row by row" />
          <div
            className="border-t"
            style={{ borderColor: "var(--t-border-subtle)" }}
          >
            <FaceoffRow
              label="Market Trend"
              a={reportA?.trend_direction}
              b={reportB?.trend_direction}
              winner={trendWinner}
            />
            <FaceoffRow
              label="Saturation"
              a={reportA?.saturation_level}
              b={reportB?.saturation_level}
              winner={satWinner}
            />
            <FaceoffRow
              label="Similar / 30d"
              a={reportA?.similar_count}
              b={reportB?.similar_count}
              winner={simWinner}
            />
            <FaceoffTextRow
              label="AI Summary"
              a={reportA?.summary ?? "—"}
              b={reportB?.summary ?? "—"}
            />
            <FaceoffTextRow
              label="Idea"
              a={truncate(ideaA.description, 160)}
              b={truncate(ideaB.description, 160)}
            />
          </div>
        </section>

        {/* Inline secondary actions */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <Link
            href={`/ideas/${ideaA.id}`}
            className="group inline-flex items-center gap-2 text-[15px] font-medium tracking-[0.3em] uppercase transition-opacity hover:opacity-70"
            style={{ fontFamily: DISPLAY, color: ACCENT_A }}
          >
            View full report A
            <ArrowRight
              className="w-3 h-3 transition-transform group-hover:translate-x-1"
              strokeWidth={2}
            />
          </Link>
          <span aria-hidden style={{ color: "var(--t-border-bright)" }}>
            ·
          </span>
          <Link
            href={`/ideas/${ideaB.id}`}
            className="group inline-flex items-center gap-2 text-[15px] font-medium tracking-[0.3em] uppercase transition-opacity hover:opacity-70"
            style={{ fontFamily: DISPLAY, color: ACCENT_B }}
          >
            View full report B
            <ArrowRight
              className="w-3 h-3 transition-transform group-hover:translate-x-1"
              strokeWidth={2}
            />
          </Link>
        </div>
      </div>
    );
  }

  // ── Selection view ──────────────────────────────────────────────────
  const bothSelected = selected.length === 2;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Editorial header */}
      <div className="flex items-center gap-4 mb-6">
        <span
          className="text-[15px] font-medium tracking-[0.35em] uppercase"
          style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
        >
          Compare
        </span>
        <span className="flex-1 h-px" style={{ background: "var(--t-border-subtle)" }} />
        <span
          className="text-[15px] font-medium tracking-[0.25em] uppercase"
          style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
        >
          {ideas.length} available
        </span>
      </div>

      <h1
        className="mb-4"
        style={{
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: "clamp(2.5rem, 5vw, 4rem)",
          lineHeight: 1.02,
          letterSpacing: "-0.03em",
          color: "var(--text-primary)",
        }}
      >
        Two ideas, head-to-head.
      </h1>

      <div
        className="text-[17px] leading-[1.6] mb-10 space-y-1"
        style={{ color: "var(--text-secondary)" }}
      >
        {plan === "plus" ? (
          <>
            <p>Pick two of your own ideas to place side-by-side.</p>
            <p>Upgrade to Pro to compare against any public idea.</p>
          </>
        ) : (
          <>
            <p>Pick two ideas to place side-by-side.</p>
            <p>We&apos;ll read them across 8 agents.</p>
          </>
        )}
      </div>

      {/* A/B dock */}
      <section
        aria-label="Comparison slots"
        className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 mb-12"
      >
        {[0, 1].map((i) => {
          const selIdea = ideas.find((x) => x.id === selected[i]);
          const letter = String.fromCharCode(65 + i);
          const filled = !!selIdea;
          const accent = i === 0 ? ACCENT_A : ACCENT_B;
          return (
            <div
              key={i}
              className="flex items-center gap-4 px-5 py-4 border min-h-[72px]"
              style={{
                borderColor: filled ? "var(--accent-ring)" : "var(--t-border-subtle)",
                background: "var(--card-bg)",
              }}
            >
              <span
                className="inline-flex items-center justify-center w-7 h-7 shrink-0"
                style={{
                  background: filled ? accent : "transparent",
                  color: filled ? "#fff" : "var(--text-tertiary)",
                  border: filled ? "none" : "1px solid var(--t-border-subtle)",
                  fontFamily: DISPLAY,
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                }}
              >
                {letter}
              </span>
              {filled ? (
                <div className="flex-1 min-w-0 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[14px] font-medium tracking-[0.3em] uppercase truncate"
                      style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
                    >
                      {selIdea!.category} · {timeAgo(selIdea!.created_at)}
                    </p>
                    <p
                      className="truncate mt-0.5"
                      style={{
                        fontFamily: SERIF,
                        fontWeight: 700,
                        fontSize: "1.05rem",
                        letterSpacing: "-0.01em",
                        color: "var(--text-primary)",
                      }}
                    >
                      {selIdea!.target_user}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleSelect(selIdea!.id)}
                    aria-label={`Remove idea ${letter}`}
                    className="shrink-0 text-[10px] font-medium tracking-[0.3em] uppercase transition-opacity hover:opacity-70"
                    style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <span
                  className="text-[15px] italic"
                  style={{ fontFamily: SERIF, color: "var(--text-tertiary)" }}
                >
                  Pick an idea as {letter}
                </span>
              )}
            </div>
          );
        })}

        <button
          onClick={startCompare}
          disabled={!bothSelected}
          className="inline-flex items-center justify-center gap-3 h-[72px] md:h-auto px-8 text-[14px] font-medium tracking-[0.3em] uppercase transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
          style={{
            fontFamily: DISPLAY,
            background: bothSelected ? "var(--accent)" : "transparent",
            color: bothSelected ? "#fff" : "var(--text-tertiary)",
            border: bothSelected ? "none" : "1px solid var(--t-border-subtle)",
          }}
        >
          {bothSelected ? (
            <>
              Compare
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
            </>
          ) : (
            `${selected.length}/2`
          )}
        </button>
      </section>

      {/* Search + filter — minimal editorial bar */}
      <div
        className="flex items-center gap-4 mb-6 pb-4 border-b"
        style={{ borderColor: "var(--t-border-subtle)" }}
      >
        <div className="relative flex-1">
          <Search
            className="absolute left-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
            style={{ color: "var(--text-tertiary)" }}
          />
          <input
            type="text"
            placeholder="Search by target, description, or category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-6 pr-3 h-9 text-[14px] bg-transparent outline-none"
            style={{ color: "var(--text-primary)" }}
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-9 pl-3 pr-3 text-[14px] font-medium tracking-[0.25em] uppercase bg-transparent cursor-pointer outline-none"
          style={{ fontFamily: DISPLAY, color: "var(--text-primary)" }}
          aria-label="Filter by category"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat === "All" ? "All Categories" : cat}
            </option>
          ))}
        </select>
      </div>

      <p
        className="text-[14px] font-medium tracking-[0.3em] uppercase mb-6"
        style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
      >
        {filtered.length} {filtered.length === 1 ? "idea" : "ideas"}
        {(search || category !== "All") && " match"}
      </p>

      {/* Ideas grid */}
      {filtered.length === 0 ? (
        <div
          className="text-center py-20"
          style={{ borderTop: "1px solid var(--t-border-subtle)", borderBottom: "1px solid var(--t-border-subtle)" }}
        >
          <p
            className="text-[15px] italic"
            style={{ fontFamily: SERIF, color: "var(--text-tertiary)" }}
          >
            No ideas match your filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((idea) => {
            const report = getReport(idea);
            const isSelected = selected.includes(idea.id);
            const selIdx = selected.indexOf(idea.id);
            const selLetter = isSelected ? String.fromCharCode(65 + selIdx) : null;
            const vScore = report?.viability_score ?? null;
            const theme = getCategoryTheme(idea.category);
            const scoreColor =
              vScore === null
                ? "var(--text-tertiary)"
                : vScore >= 70
                ? "#10b981"
                : vScore >= 50
                ? "#f59e0b"
                : "#ef4444";

            return (
              <button
                key={idea.id}
                onClick={() => toggleSelect(idea.id)}
                aria-pressed={isSelected}
                className="group relative text-left flex flex-col min-h-[210px] p-6 border transition-all duration-200 hover:-translate-y-0.5 hover:border-[color:var(--t-border-bright)] focus:outline-none focus-visible:border-[color:var(--accent-ring)]"
                style={{
                  background: "var(--card-bg)",
                  borderColor: isSelected
                    ? "var(--accent-ring)"
                    : "var(--t-border-card)",
                }}
              >
                {isSelected && (
                  <span
                    aria-hidden
                    className="absolute left-0 top-0 bottom-0 w-[3px]"
                    style={{ background: "var(--accent)" }}
                  />
                )}

                {/* Top row — category + score */}
                <div className="flex items-start justify-between gap-4 mb-5">
                  <span
                    className="inline-flex items-center gap-1.5 text-[15px] font-semibold tracking-wider uppercase"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: theme.accent }}
                      aria-hidden="true"
                    />
                    {idea.category}
                  </span>

                  <div className="flex items-baseline gap-1 shrink-0">
                    <span
                      className="tabular-nums leading-none"
                      style={{
                        fontFamily: SERIF,
                        fontWeight: 900,
                        fontSize: "1.75rem",
                        letterSpacing: "-0.02em",
                        color: scoreColor,
                      }}
                    >
                      {vScore ?? "—"}
                    </span>
                    <span
                      className="text-[13px] font-medium tracking-[0.15em] uppercase"
                      style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
                    >
                      /100
                    </span>
                  </div>
                </div>

                <h3
                  className="text-[17px] font-semibold leading-snug mb-2 line-clamp-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  For {idea.target_user}
                </h3>

                <p
                  className="text-[13px] leading-relaxed line-clamp-2 flex-1"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {idea.description}
                </p>

                {/* Footer — time + A/B indicator */}
                <div
                  className="flex items-center justify-between mt-5 pt-4 text-[15px] border-t"
                  style={{
                    borderColor: "var(--t-border-subtle)",
                    color: "var(--text-tertiary)",
                  }}
                >
                  <span className="truncate">{timeAgo(idea.created_at)}</span>
                  {selLetter ? (
                    <span
                      className="inline-flex items-center justify-center w-5 h-5 text-[15px] font-bold shrink-0 ml-3"
                      style={{ background: "var(--accent)", color: "#fff" }}
                    >
                      {selLetter}
                    </span>
                  ) : (
                    <span
                      className="tracking-wider uppercase text-[14px] font-medium shrink-0 ml-3 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      Select
                    </span>
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
