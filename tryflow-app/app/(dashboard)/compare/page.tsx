"use client";

import { Fragment, useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { ArrowRight, ArrowLeft, Search, Lock, Sparkles, GitCompare } from "lucide-react";
import { getCategoryTheme } from "@/lib/categories";
import { getDimensionByShortLabel } from "@/lib/dimensions";
import { useCompareTray } from "@/components/compare/CompareTrayContext";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

// ── Typography tokens ───────────────────────────────────────────────────
const SERIF = "'Fraunces', serif";
const DISPLAY = "'Inter', sans-serif";

// ── Slot accents ────────────────────────────────────────────────────────
// 2026-04 교수님 피드백 — Compare 는 2개 말고 3개까지 가능해야 함.
// 슬롯 색도 3개로 확장: A=indigo, B=emerald, C=amber. 색상은 각 리포트
// 카드 보더/아바타/레이더 폴리곤/리더 뱃지 등 모든 곳에서 같이 쓰여
// "Idea A = 이 색" 이라는 시각적 앵커가 일관되게 유지된다.
const SLOT_ACCENTS = ["#818cf8", "#34d399", "#f59e0b"] as const;
const SLOT_LETTERS = ["A", "B", "C"] as const;
const MAX_SLOTS = 3;
const MIN_SLOTS = 2; // Compare 는 최소 2개부터 유효.

// ── Types ───────────────────────────────────────────────────────────────
interface AgentScore {
  score: number;
  reasoning?: string;
}

// 2026-04 refactor: 8 axes → 6. See decisions/evaluation-axes-rationale.md.
interface Analysis {
  market_size?: AgentScore;
  problem_urgency?: AgentScore;
  timing?: AgentScore;
  product?: AgentScore;
  defensibility?: AgentScore;
  business_model?: AgentScore;
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
  problem_urgency: "Problem",
  timing: "Timing",
  product: "Product",
  defensibility: "Moat",
  business_model: "Model",
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
        className="text-[15px] font-medium tracking-[0.08em] uppercase"
        style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
      >
        {title}
      </span>
      <span className="flex-1 h-px" style={{ background: "var(--t-border-subtle)" }} />
      {right && (
        <span
          className="text-[15px] font-medium tracking-[0.06em] uppercase shrink-0"
          style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
        >
          {right}
        </span>
      )}
    </div>
  );
}

// ── Multi-Radar (supports 2 or 3 ideas) ────────────────────────────────
// 교수님 피드백: 2개만 비교하면 비슷한 아이디어일 때 폴리곤이 거의 겹쳐서 무의미.
// 3개까지 허용하면 축별 상대 포지션이 훨씬 더 잘 읽힌다.
interface MultiRadarProps {
  entries: { letter: string; accent: string; analysis: Analysis | null }[];
}
function MultiRadar({ entries }: MultiRadarProps) {
  const [hovered, setHovered] = useState<{
    subject: string;
    x: number;
    y: number;
  } | null>(null);

  // 데이터를 { subject, A, B, [C] } 형태로 평탄화 — recharts Radar 는
  // dataKey 에 "A"/"B"/"C" 처럼 정적 키가 필요하다.
  const data = Object.keys(AGENT_LABELS).map((key) => {
    const row: { subject: string } & Record<string, number | string> = {
      subject: AGENT_LABELS[key],
    };
    for (const e of entries) {
      row[e.letter] = e.analysis?.[key as keyof Analysis]?.score ?? 0;
    }
    return row;
  });

  const hasData = data.some((d) =>
    entries.some((e) => (d[e.letter] as number) > 0)
  );
  if (!hasData) return null;

  const avgs = entries.map((e) => {
    const sum = data.reduce((s, d) => s + ((d[e.letter] as number) ?? 0), 0);
    return Math.round(sum / data.length);
  });

  return (
    <section className="mb-14" aria-label="Balance across 8 analysis dimensions">
      <KickerRule title="8-Dimension Balance" right="Where each idea wins" />

      {/* Avg indicators — 각 아이디어당 한 줄 */}
      <div className="flex items-center flex-wrap gap-x-10 gap-y-3 mb-6">
        {entries.map((e, i) => (
          <div key={e.letter} className="flex items-baseline gap-3">
            <span className="w-2 h-2 rounded-full" style={{ background: e.accent }} />
            <span
              className="text-[14px] font-medium tracking-[0.08em] uppercase"
              style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
            >
              Idea {e.letter}
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
              {avgs[i]}
            </span>
            <span
              className="text-[10px] font-medium tracking-[0.06em] uppercase"
              style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
            >
              avg
            </span>
          </div>
        ))}
      </div>

      <div className="relative" style={{ height: 460 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} margin={{ top: 24, right: 80, bottom: 24, left: 80 }}>
            <PolarGrid stroke="var(--t-border-bright)" gridType="polygon" />
            {/* 반경을 [0,100] 으로 고정 — 교수님 피드백 #1 (팔각형/총점 불일치) */}
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              axisLine={false}
              tick={false}
            />
            <PolarAngleAxis
              dataKey="subject"
              tick={(tickProps) => (
                <EditorialTick
                  {...tickProps}
                  data={data}
                  entries={entries}
                  onHover={setHovered}
                />
              )}
              tickLine={false}
            />
            {entries.map((e) => (
              <Radar
                key={e.letter}
                name={e.letter}
                dataKey={e.letter}
                stroke={e.accent}
                strokeWidth={1.5}
                fill={e.accent}
                fillOpacity={0.14}
                isAnimationActive={false}
                dot={{ fill: e.accent, r: 3, stroke: "transparent" }}
              />
            ))}
          </RadarChart>
        </ResponsiveContainer>

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
          className="text-[12px] font-medium tracking-[0.08em] uppercase mb-1.5"
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
  data: ({ subject: string } & Record<string, number | string>)[];
  entries: { letter: string; accent: string }[];
  onHover?: (hover: { subject: string; x: number; y: number } | null) => void;
}) {
  const { x = 0, y = 0, payload, textAnchor = "middle", data, entries, onHover } = props;
  const entry = data.find((d) => d.subject === payload?.value);
  const subject = payload?.value ?? "";

  return (
    <g
      style={{ cursor: "help" }}
      onMouseEnter={() => onHover?.({ subject, x, y })}
      onMouseLeave={() => onHover?.(null)}
    >
      <rect
        x={x - 80}
        y={y - 12}
        width={160}
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
        style={{ fontFamily: "'Inter', sans-serif", letterSpacing: "0.04em" }}
      >
        {subject}
        {entries.map((e, i) => (
          <Fragment key={e.letter}>
            <tspan
              dx={i === 0 ? 8 : 3}
              fill={e.accent}
              style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, letterSpacing: "0.1em" }}
            >
              {(entry?.[e.letter] as number) ?? 0}
            </tspan>
            {i < entries.length - 1 && (
              <tspan dx={3} fill="var(--text-tertiary)">
                ·
              </tspan>
            )}
          </Fragment>
        ))}
      </text>
    </g>
  );
}

// ── TL;DR synthesis — "빠르게 보고 싶은 VC" 를 위한 한 줄 정리 ──────────
// 교수님 피드백: 2개만 비교해도 겹쳐서 무의미, 비슷한 케이스엔 요약이 필요함.
// AI 호출을 새로 붙이지 않고 이미 있는 점수/지표로 결정론적으로 만든다 —
// "어느 축에서 누가 이기는지" 만 정확히 보여줘도 VC 입장에서는 충분히 유용.
interface TldrProps {
  entries: {
    letter: string;
    accent: string;
    idea: Idea;
    report: Report | null;
    analysis: Analysis | null;
  }[];
}
function TldrCard({ entries }: TldrProps) {
  // 총점 1등 / 꼴찌
  const scored = entries
    .map((e) => ({ letter: e.letter, score: e.report?.viability_score ?? 0 }))
    .sort((a, b) => b.score - a.score);
  const leader = scored[0];
  const trail = scored[scored.length - 1];
  const gap = leader.score - trail.score;

  // 축별 리더: 각 에이전트 축에서 가장 높은 점수를 가진 아이디어
  const axisLeaders = Object.keys(AGENT_LABELS).map((key) => {
    const best = entries
      .map((e) => ({
        letter: e.letter,
        accent: e.accent,
        score: e.analysis?.[key as keyof Analysis]?.score ?? 0,
      }))
      .sort((a, b) => b.score - a.score)[0];
    return { axis: AGENT_LABELS[key], ...best };
  });

  // 각 아이디어가 몇 축에서 이기는지 집계 — "누가 넓게 이기는지"
  const winsByLetter = new Map<string, number>();
  for (const l of axisLeaders) winsByLetter.set(l.letter, (winsByLetter.get(l.letter) ?? 0) + 1);

  // 유사도 — 총점 차이가 5점 이하면 "Tight race" 라벨 추가
  const tightRace = gap <= 5;

  return (
    <section
      className="relative mb-10 px-7 py-7 border"
      style={{
        background: "var(--accent-soft)",
        borderColor: "var(--accent-ring)",
      }}
      aria-label="TL;DR synthesis"
    >
      {/* Kicker */}
      <div className="flex items-center gap-3 mb-5">
        <Sparkles className="w-3.5 h-3.5" style={{ color: "var(--accent)" }} strokeWidth={2} />
        <span
          className="text-[12px] font-medium tracking-[0.08em] uppercase"
          style={{ fontFamily: DISPLAY, color: "var(--accent)" }}
        >
          TL;DR
        </span>
        <span className="flex-1 h-px" style={{ background: "var(--accent-ring)" }} />
        <span
          className="text-[11px] font-medium tracking-[0.08em] uppercase shrink-0"
          style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
        >
          {entries.length}-way · {tightRace ? "Tight race" : `+${gap} pt gap`}
        </span>
      </div>

      {/* Hero sentence — 에디토리얼 인용 톤. 점수 차이 기반으로 문구 톤 조절. */}
      <p
        className="leading-[1.2] mb-6 max-w-4xl"
        style={{
          fontFamily: SERIF,
          fontWeight: 400,
          fontStyle: "italic",
          fontSize: "clamp(1.35rem, 2.3vw, 1.9rem)",
          letterSpacing: "-0.01em",
          color: "var(--text-primary)",
        }}
      >
        &ldquo;Idea {leader.letter} leads the pack
        {tightRace
          ? `, but it's a photo finish — only ${gap} point${gap === 1 ? "" : "s"} separates them.`
          : ` by ${gap} point${gap === 1 ? "" : "s"}.`}
        &rdquo;
      </p>

      {/* Axis wins — "누가 어디에서 이기는지" 한 줄 정리 */}
      <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-x-8 gap-y-4 mb-4">
        <span
          className="text-[12px] font-medium tracking-[0.08em] uppercase pt-1 shrink-0"
          style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
        >
          Who wins where
        </span>
        <div className="flex flex-wrap gap-x-3 gap-y-2">
          {axisLeaders.map((a) => (
            <span
              key={a.axis}
              className="inline-flex items-center gap-2 px-3 py-1 text-[12.5px]"
              style={{
                background: "var(--surface-1)",
                border: "1px solid var(--t-border-subtle)",
                color: "var(--text-primary)",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: a.accent }} aria-hidden />
              <span
                className="font-medium tracking-[0.06em] uppercase"
                style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)", fontSize: "11px" }}
              >
                {a.axis}
              </span>
              <span style={{ fontFamily: DISPLAY, fontWeight: 600, color: a.accent }}>
                {a.letter}
              </span>
              <span className="tabular-nums" style={{ color: "var(--text-tertiary)", fontSize: "11px" }}>
                {a.score}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* 8축 리더 분포 — 몇 축에서 이겼나 */}
      <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-x-8 gap-y-2">
        <span
          className="text-[12px] font-medium tracking-[0.08em] uppercase shrink-0"
          style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
        >
          Axis wins
        </span>
        <div className="flex flex-wrap gap-x-5 gap-y-1">
          {entries.map((e) => {
            const wins = winsByLetter.get(e.letter) ?? 0;
            return (
              <span key={e.letter} className="inline-flex items-baseline gap-2">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: e.accent }} aria-hidden />
                <span
                  className="text-[12px] font-medium tracking-[0.06em] uppercase"
                  style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
                >
                  Idea {e.letter}
                </span>
                <span
                  className="tabular-nums"
                  style={{
                    fontFamily: SERIF,
                    fontWeight: 700,
                    fontSize: "1.1rem",
                    color: "var(--text-primary)",
                  }}
                >
                  {wins}
                </span>
                <span
                  className="text-[11px]"
                  style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
                >
                  / 8
                </span>
              </span>
            );
          })}
        </div>
      </div>

      {/* 작은 주석 — AI 가 한 게 아니라 점수 기반이라는 정직한 라벨 */}
      <p
        className="mt-5 pt-4 text-[11px] leading-[1.5] border-t"
        style={{ borderColor: "var(--accent-ring)", color: "var(--text-tertiary)" }}
      >
        Derived from the 8-agent scores above. A high axis-win count means the idea is strong across many
        dimensions, not just the total.
      </p>
    </section>
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
          className="text-[14px] font-medium tracking-[0.08em] uppercase truncate"
          style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
        >
          {idea.category}
        </span>
        {isWinner && (
          <span
            className="text-[10px] font-medium tracking-[0.08em] uppercase shrink-0"
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
            fontSize: "clamp(4rem, 7vw, 6rem)",
            letterSpacing: "-0.05em",
            color: numColor,
          }}
        >
          {score}
        </span>
        <span
          className="pb-1 text-sm font-medium tracking-[0.08em] uppercase"
          style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
        >
          / 100
        </span>
      </div>

      <p
        className="text-[15px] leading-[1.4]"
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

// ── Editorial face-off rows — dynamic 2/3 columns ──────────────────────
interface FaceoffRowProps {
  label: string;
  values: (string | number | null | undefined)[];
  winnerIdx: number | null;
  accents: readonly string[];
}
function FaceoffRow({ label, values, winnerIdx, accents }: FaceoffRowProps) {
  const cols = values.length;
  // 그리드 템플릿을 슬롯 수에 맞춰 동적으로 생성 — 2/3 모두 지원
  const gridTemplate = `140px ${Array.from({ length: cols }).map(() => "1fr").join(" ")}`;
  return (
    <div
      className="grid gap-x-8 py-5 border-b items-baseline"
      style={{
        borderColor: "var(--t-border-subtle)",
        gridTemplateColumns: gridTemplate,
      }}
    >
      <span
        className="text-[14px] font-medium tracking-[0.08em] uppercase"
        style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
      >
        {label}
      </span>
      {values.map((v, i) => (
        <FaceoffValue
          key={i}
          value={v}
          active={winnerIdx === i}
          accent={accents[i]}
        />
      ))}
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
    <div className="flex items-baseline gap-3 min-w-0">
      <span
        className="truncate"
        style={{
          fontFamily: SERIF,
          fontWeight: 700,
          fontSize: "1.2rem",
          letterSpacing: "-0.01em",
          color: active ? "var(--text-primary)" : "var(--text-secondary)",
        }}
      >
        {value ?? "—"}
      </span>
      {active && (
        <span
          className="text-[10px] font-medium tracking-[0.06em] uppercase shrink-0"
          style={{ fontFamily: DISPLAY, color: accent }}
        >
          Leads
        </span>
      )}
    </div>
  );
}

function FaceoffTextRow({ label, values }: { label: string; values: string[] }) {
  const cols = values.length;
  const gridTemplate = `140px ${Array.from({ length: cols }).map(() => "1fr").join(" ")}`;
  return (
    <div
      className="grid gap-x-8 py-5 border-b"
      style={{
        borderColor: "var(--t-border-subtle)",
        gridTemplateColumns: gridTemplate,
      }}
    >
      <span
        className="pt-1 text-[14px] font-medium tracking-[0.08em] uppercase"
        style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
      >
        {label}
      </span>
      {values.map((v, i) => (
        <p
          key={i}
          className="text-[13.5px] leading-[1.65]"
          style={{ color: "var(--text-secondary)" }}
        >
          {v}
        </p>
      ))}
    </div>
  );
}

// ── Main Compare page ──────────────────────────────────────────────────
export default function ComparePage() {
  const searchParams = useSearchParams();
  const tray = useCompareTray();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<Plan | null>(null);
  // 최대 3개까지 선택 가능 (교수님 피드백)
  const [selected, setSelected] = useState<string[]>([]);
  const [comparing, setComparing] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  // 선택된 슬롯 각각의 AI 분석 결과 (순서는 selected 와 동일)
  const [analyses, setAnalyses] = useState<(Analysis | null)[]>([]);

  // 진입 시 selection 우선순위:
  //   1) URL params (?pick=id1&pick=id2) — 공유 링크나 트레이의 "Compare Now"
  //   2) localStorage 트레이 (사용자가 다른 페이지에서 골라둔 것)
  //   3) 빈 상태 — 안내 화면 표시
  // 결정된 selection 은 트레이와 양방향 sync.
  useEffect(() => {
    const picks = searchParams?.getAll("pick") ?? [];
    if (picks.length > 0) {
      setSelected(picks.slice(0, MAX_SLOTS));
      return;
    }
    if (tray.isHydrated && tray.ids.length > 0) {
      setSelected(tray.ids.slice(0, MAX_SLOTS));
    }
  }, [searchParams, tray.isHydrated, tray.ids]);

  // "Compare Now" 로 넘어왔을 때 자동 시작:
  //   URL 에 ?pick=... 이 있고, 아이디어 로딩이 끝나서 picks 가 실제로
  //   유효(사용자가 접근 가능한 것) 한 게 2개 이상이면 바로 비교 뷰로 전환.
  //   사용자가 수동으로 "Start Compare" 다시 누를 필요 없음.
  useEffect(() => {
    if (loading) return;
    if (comparing) return;
    const hasUrlPicks = (searchParams?.getAll("pick") ?? []).length > 0;
    if (!hasUrlPicks) return;
    if (selected.length < MIN_SLOTS) return;
    // 선택된 id 가 실제 접근 가능한 ideas 목록에 있는지 확인 (RLS 로 차단된 것 제외)
    const ideaIdSet = new Set(ideas.map((i) => i.id));
    const validPicks = selected.filter((id) => ideaIdSet.has(id));
    if (validPicks.length >= MIN_SLOTS) {
      startCompare();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, ideas, selected]);

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
    setAnalyses(new Array(selected.length).fill(null));
    // 선택된 아이디어들의 분석을 병렬로 가져옴 — 3개여도 2개 케이스와 동일한 구조
    const results = await Promise.all(
      selected.map((id) =>
        fetch(`/api/analysis?submissionId=${id}`)
          .then((r) => r.json())
          .catch(() => null)
      )
    );
    setAnalyses(results.map((r) => r?.report?.analysis ?? null));
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
    // 페이지 로컬 selection 과 글로벌 tray 양쪽 동시 업데이트 — 사용자가
    // 다른 페이지로 갔다 돌아와도 같은 선택이 유지됨.
    tray.toggle(id);
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_SLOTS) return [...prev.slice(1), id];
      return [...prev, id];
    });
    setComparing(false);
  }

  function clearAll() {
    tray.clear();
    setSelected([]);
    setComparing(false);
    setAnalyses([]);
  }

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
            className="text-[15px] font-medium tracking-[0.08em] uppercase"
            style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
          >
            Compare
          </span>
          <span className="flex-1 h-px" style={{ background: "var(--t-border-subtle)" }} />
          <span
            className="text-[15px] font-medium tracking-[0.06em] uppercase inline-flex items-center gap-2"
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
          Upgrade to <span style={{ color: "var(--accent)" }}>Plus</span> to compare up to three
          of your own ideas side-by-side, or <span style={{ color: "var(--accent)" }}>Pro</span>{" "}
          to also compare against every public idea on the platform.
        </p>

        <Link
          href="/pricing"
          className="group inline-flex items-center gap-3 text-[15px] font-medium tracking-[0.08em] uppercase transition-opacity hover:opacity-70"
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

  // ── Comparison view (2 또는 3 아이디어) ────────────────────────────
  const selectedIdeas = selected
    .map((id) => ideas.find((i) => i.id === id))
    .filter((x): x is Idea => !!x);

  if (comparing && selectedIdeas.length >= MIN_SLOTS) {
    const reports = selectedIdeas.map((i) => getReport(i));
    const scores = reports.map((r) => r?.viability_score ?? 0);
    const maxScore = Math.max(...scores);
    const leaderIdx =
      scores.filter((s) => s === maxScore).length === 1
        ? scores.indexOf(maxScore)
        : -1; // 동점이면 리더 없음

    // entries — MultiRadar / TLDR / ScoreFaceoff 가 모두 공유하는 정규화된 구조
    const entries = selectedIdeas.map((idea, i) => ({
      letter: SLOT_LETTERS[i],
      accent: SLOT_ACCENTS[i],
      idea,
      report: reports[i],
      analysis: analyses[i] ?? null,
    }));

    // 축별 row winner 계산 — Trend/Saturation/Similar 각각 "어느 인덱스가 이기는지"
    function idxWinner(scores: number[], higherWins: boolean): number | null {
      const best = higherWins ? Math.max(...scores) : Math.min(...scores);
      const winners = scores
        .map((s, i) => (s === best ? i : -1))
        .filter((x) => x >= 0);
      return winners.length === 1 ? winners[0] : null;
    }

    // Trend — Rising=2, Flat=1, Declining=0 으로 정규화해서 최대값이 승
    const trendScores = reports.map((r) => {
      if (r?.trend_direction === "Rising") return 2;
      if (r?.trend_direction === "Declining") return 0;
      return 1;
    });
    const trendWinner = idxWinner(trendScores, true);

    // Saturation — Low=2, Medium=1, High=0 으로 정규화 (낮을수록 좋음)
    const satScores = reports.map((r) => {
      if (r?.saturation_level === "Low") return 2;
      if (r?.saturation_level === "High") return 0;
      return 1;
    });
    const satWinner = idxWinner(satScores, true);

    // Similar — 낮을수록 좋음 (차별화)
    const simScores = reports.map((r) => r?.similar_count ?? Infinity);
    const simWinner = idxWinner(simScores, false);

    const ordinal =
      selectedIdeas.length === 2
        ? "Head-to-head"
        : "Three-way shootout";
    const titleLetters =
      selectedIdeas.length === 2
        ? "Idea A vs Idea B"
        : "Idea A vs B vs C";

    const leaderLabel =
      leaderIdx >= 0
        ? `Idea ${SLOT_LETTERS[leaderIdx]} · +${maxScore - Math.min(...scores)} pts`
        : "Tied";

    return (
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Back link */}
        <button
          onClick={() => setComparing(false)}
          className="inline-flex items-center gap-1.5 text-[15px] font-medium tracking-[0.06em] uppercase mb-10 transition-colors hover:text-[color:var(--text-primary)]"
          style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
        >
          <ArrowLeft className="w-3 h-3" /> Back to selection
        </button>

        {/* Editorial kicker */}
        <div className="flex items-center gap-4 mb-6">
          <span
            className="text-[15px] font-medium tracking-[0.08em] uppercase"
            style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
          >
            The {ordinal}
          </span>
          <span className="flex-1 h-px" style={{ background: "var(--t-border-subtle)" }} />
          <span
            className="text-[15px] font-medium tracking-[0.06em] uppercase shrink-0"
            style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
          >
            {leaderLabel}
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
          {titleLetters}.
        </h1>

        {/* TL;DR 종합 요약 카드 — VC 빠르게 읽기 */}
        <TldrCard entries={entries} />

        {/* Head-to-head hero — dynamic 2/3 columns */}
        <section
          className="relative py-10 mb-6"
          style={{
            borderTop: "1px solid var(--t-border-subtle)",
            borderBottom: "1px solid var(--t-border-subtle)",
          }}
        >
          <div
            className="grid gap-x-12 gap-y-10 mb-8"
            style={{
              gridTemplateColumns:
                selectedIdeas.length === 2
                  ? "repeat(2, minmax(0,1fr))"
                  : "repeat(3, minmax(0,1fr))",
            }}
          >
            {entries.map((e, i) => (
              <ScoreFaceoff
                key={e.letter}
                letter={e.letter}
                idea={e.idea}
                score={scores[i]}
                isWinner={leaderIdx === i}
                accent={e.accent}
              />
            ))}
          </div>

          {leaderIdx >= 0 && (
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
              &ldquo;Idea {SLOT_LETTERS[leaderIdx]} leads by{" "}
              {maxScore - Math.min(...scores)} points.&rdquo;
            </p>
          )}

          <p
            className="text-[14.5px] leading-[1.75] max-w-3xl"
            style={{ color: "var(--text-secondary)" }}
          >
            {leaderIdx >= 0
              ? reports[leaderIdx]?.summary
              : "All ideas score evenly on the overall viability index. The detail rows below may tip the balance."}
          </p>
        </section>

        {/* 8-Dimension radar — 2 또는 3개 폴리곤 */}
        <MultiRadar
          entries={entries.map((e) => ({
            letter: e.letter,
            accent: e.accent,
            analysis: e.analysis,
          }))}
        />

        {/* Detail rows — dynamic columns */}
        <section className="mb-14">
          <KickerRule title="The Breakdown" right="Row by row" />
          <div className="border-t" style={{ borderColor: "var(--t-border-subtle)" }}>
            <FaceoffRow
              label="Market Trend"
              values={reports.map((r) => r?.trend_direction)}
              winnerIdx={trendWinner}
              accents={SLOT_ACCENTS}
            />
            <FaceoffRow
              label="Saturation"
              values={reports.map((r) => r?.saturation_level)}
              winnerIdx={satWinner}
              accents={SLOT_ACCENTS}
            />
            <FaceoffRow
              label="Similar / 30d"
              values={reports.map((r) => r?.similar_count)}
              winnerIdx={simWinner}
              accents={SLOT_ACCENTS}
            />
            <FaceoffTextRow
              label="AI Summary"
              values={reports.map((r) => r?.summary ?? "—")}
            />
            <FaceoffTextRow
              label="Idea"
              values={selectedIdeas.map((i) => truncate(i.description, 160))}
            />
          </div>
        </section>

        {/* Inline secondary actions — "각 리포트 전체 보기" */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {entries.map((e, i) => (
            <span key={e.letter} className="inline-flex items-center">
              <Link
                href={`/ideas/${e.idea.id}`}
                className="group inline-flex items-center gap-2 text-[15px] font-medium tracking-[0.08em] uppercase transition-opacity hover:opacity-70"
                style={{ fontFamily: DISPLAY, color: e.accent }}
              >
                View full report {e.letter}
                <ArrowRight
                  className="w-3 h-3 transition-transform group-hover:translate-x-1"
                  strokeWidth={2}
                />
              </Link>
              {i < entries.length - 1 && (
                <span
                  aria-hidden
                  className="mx-3"
                  style={{ color: "var(--t-border-bright)" }}
                >
                  ·
                </span>
              )}
            </span>
          ))}
        </div>
      </div>
    );
  }

  // ── Selection view ──────────────────────────────────────────────────
  const enoughSelected = selected.length >= MIN_SLOTS;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Editorial header */}
      <div className="flex items-center gap-4 mb-6">
        <span
          className="text-[15px] font-medium tracking-[0.08em] uppercase"
          style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
        >
          Compare
        </span>
        <span className="flex-1 h-px" style={{ background: "var(--t-border-subtle)" }} />
        <span
          className="text-[15px] font-medium tracking-[0.06em] uppercase"
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
        Up to three ideas, head-to-head.
      </h1>

      <div
        className="text-[17px] leading-[1.6] mb-6 space-y-1"
        style={{ color: "var(--text-secondary)" }}
      >
        {plan === "plus" ? (
          <>
            <p>Pick two or three of your own ideas to place side-by-side.</p>
            <p>Upgrade to Pro to compare against any public idea.</p>
          </>
        ) : (
          <>
            <p>Pick two or three ideas to place side-by-side.</p>
            <p>We&apos;ll read them across 6 agents and summarize who wins where.</p>
          </>
        )}
      </div>

      {/* Empty-state guidance — shown only when nothing selected yet.
          Helps the user discover that they can pick ideas from anywhere on the
          site (cards everywhere have a [+] Compare button) or from the list
          below. Removes the "what do I do here?" friction the professor flagged. */}
      {selected.length === 0 && (
        <div
          className="mb-10 p-5 border flex items-start gap-4"
          style={{
            background: "var(--accent-soft)",
            borderColor: "var(--accent-ring)",
          }}
        >
          <GitCompare
            className="w-5 h-5 mt-0.5 shrink-0"
            style={{ color: "var(--accent)" }}
            strokeWidth={2}
          />
          <div className="flex-1">
            <p
              className="text-[12px] font-bold tracking-[0.06em] uppercase mb-2"
              style={{ fontFamily: DISPLAY, color: "var(--accent)" }}
            >
              How to add ideas
            </p>
            <p
              className="text-[14.5px] leading-[1.65] mb-3"
              style={{ color: "var(--text-secondary)" }}
            >
              Click the <span className="inline-flex items-center justify-center w-5 h-5 align-middle border" style={{ borderColor: "var(--accent-ring)", color: "var(--accent)" }}>+</span> icon on any idea card to add it to the compare tray —
              {plan === "pro" ? (
                <> on your dashboard, in <Link href="/explore" className="underline" style={{ color: "var(--accent)" }}>Market</Link>, or from the list below.</>
              ) : (
                <> on your <Link href="/dashboard" className="underline" style={{ color: "var(--accent)" }}>dashboard</Link> or the list below.</>
              )}
            </p>
            {plan === "pro" && (
              <Link
                href="/explore"
                className="group inline-flex items-center gap-1.5 text-[12px] font-medium tracking-[0.06em] uppercase transition-opacity hover:opacity-70"
                style={{ fontFamily: DISPLAY, color: "var(--accent)" }}
              >
                Browse Market
                <ArrowRight
                  className="w-3 h-3 transition-transform group-hover:translate-x-0.5"
                  strokeWidth={2}
                />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* A/B/C dock — 동적 3슬롯 */}
      <section
        aria-label="Comparison slots"
        className="grid grid-cols-1 md:grid-cols-[repeat(3,1fr)_auto] gap-3 mb-6"
      >
        {[0, 1, 2].map((i) => {
          const selIdea = ideas.find((x) => x.id === selected[i]);
          const letter = SLOT_LETTERS[i];
          const filled = !!selIdea;
          const accent = SLOT_ACCENTS[i];
          const isOptional = i === 2; // 3번째는 선택사항
          return (
            <div
              key={i}
              className="flex items-center gap-4 px-5 py-4 border min-h-[72px]"
              style={{
                borderColor: filled ? "var(--accent-ring)" : "var(--t-border-subtle)",
                background: "var(--card-bg)",
                borderStyle: !filled && isOptional ? "dashed" : "solid",
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
                      className="text-[14px] font-medium tracking-[0.08em] uppercase truncate"
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
                    className="shrink-0 text-[10px] font-medium tracking-[0.08em] uppercase transition-opacity hover:opacity-70"
                    style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <span
                  className="text-[14px] italic"
                  style={{ fontFamily: SERIF, color: "var(--text-tertiary)" }}
                >
                  {isOptional ? `Optional — add a third` : `Pick an idea as ${letter}`}
                </span>
              )}
            </div>
          );
        })}

        <button
          onClick={startCompare}
          disabled={!enoughSelected}
          className="inline-flex items-center justify-center gap-3 h-[72px] md:h-auto px-8 text-[14px] font-medium tracking-[0.08em] uppercase transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
          style={{
            fontFamily: DISPLAY,
            background: enoughSelected ? "var(--accent)" : "transparent",
            color: enoughSelected ? "#fff" : "var(--text-tertiary)",
            border: enoughSelected ? "none" : "1px solid var(--t-border-subtle)",
          }}
        >
          {enoughSelected ? (
            <>
              Compare {selected.length}
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
            </>
          ) : (
            `${selected.length}/${MIN_SLOTS}+`
          )}
        </button>
      </section>

      {/* Clear-all — 카운트가 1 이상일 때만 */}
      {selected.length > 0 && (
        <div className="flex justify-end mb-6 -mt-2">
          <button
            onClick={clearAll}
            className="text-[11px] font-medium tracking-[0.08em] uppercase transition-opacity hover:opacity-70"
            style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Search + filter */}
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
          className="h-9 pl-3 pr-3 text-[14px] font-medium tracking-[0.06em] uppercase bg-transparent cursor-pointer outline-none"
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
        className="text-[14px] font-medium tracking-[0.08em] uppercase mb-6"
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
            const selLetter = isSelected ? SLOT_LETTERS[selIdx] : null;
            const selAccent = isSelected ? SLOT_ACCENTS[selIdx] : null;
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
                    ? selAccent ?? "var(--accent-ring)"
                    : "var(--t-border-card)",
                }}
              >
                {isSelected && (
                  <span
                    aria-hidden
                    className="absolute left-0 top-0 bottom-0 w-[3px]"
                    style={{ background: selAccent ?? "var(--accent)" }}
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
                      className="text-[13px] font-medium tracking-[0.04em] uppercase"
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

                {/* Footer — time + slot indicator */}
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
                      style={{ background: selAccent ?? "var(--accent)", color: "#fff" }}
                    >
                      {selLetter}
                    </span>
                  ) : (
                    <span
                      className="tracking-wider uppercase text-[14px] font-medium shrink-0 ml-3 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {selected.length >= MAX_SLOTS ? "Replaces oldest" : "Select"}
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
