import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ArrowRight } from "lucide-react";
import { OnboardingChecklist } from "@/components/dashboard/OnboardingChecklist";
import { IdeaGrid, type IdeaGridItem } from "@/components/ideas/IdeaGrid";
import type { TrendDirection } from "@/components/ui/TrendLabel";
import type { IdeaStatus } from "@/components/ui/StatusBadge";

const SERIF = "'Playfair Display', serif";
const DISPLAY = "'Oswald', sans-serif";

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
  stage: string | null;
  is_private: boolean | null;
  insight_reports: Report | Report[] | null;
}

function getReport(idea: Idea): Report | null {
  if (!idea.insight_reports) return null;
  if (Array.isArray(idea.insight_reports)) return idea.insight_reports[0] ?? null;
  return idea.insight_reports;
}

function deriveStatus(idea: Idea): IdeaStatus {
  const hasReport = !!getReport(idea);
  if (!hasReport) return "analyzing";
  if (idea.is_private) return "private";
  return "live";
}

function toGridItem(idea: Idea): IdeaGridItem {
  const r = getReport(idea);
  return {
    id: idea.id,
    category: idea.category,
    target_user: idea.target_user,
    description: idea.description,
    created_at: idea.created_at,
    stage: idea.stage,
    viability_score: r?.viability_score ?? null,
    trend_direction: (r?.trend_direction as TrendDirection | undefined) ?? null,
    saturation_level: r?.saturation_level ?? null,
    status: deriveStatus(idea),
  };
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: rawIdeas } = await supabase
    .from("idea_submissions")
    .select(`
      id, category, target_user, description, created_at, stage, is_private,
      insight_reports (viability_score, saturation_level, trend_direction, similar_count, summary)
    `)
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const ideas = (rawIdeas ?? []) as unknown as Idea[];
  const hasIdeas = ideas.length > 0;

  const hasReport = ideas.some((i) => !!getReport(i));
  const firstReportIdeaId = ideas.find((i) => !!getReport(i))?.id
    ?? ideas[0]?.id
    ?? null;

  const items = ideas.map(toGridItem);
  const topScoringId = items
    .filter((r) => r.viability_score !== null)
    .reduce<IdeaGridItem | null>(
      (best, cur) =>
        !best || (cur.viability_score ?? 0) > (best.viability_score ?? 0) ? cur : best,
      null,
    )?.id ?? null;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Editorial header */}
      <div className="flex items-center gap-4 mb-6">
        <span
          className="text-[15px] font-medium tracking-[0.35em] uppercase"
          style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
        >
          My Ideas
        </span>
        <span className="flex-1 h-px" style={{ background: "var(--t-border-subtle)" }} />
        {hasIdeas && (
          <span
            className="text-[15px] font-medium tracking-[0.25em] uppercase shrink-0"
            style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
          >
            {ideas.length} total
          </span>
        )}
      </div>

      <div className="flex items-start justify-between gap-8 mb-4 flex-wrap">
        <h1
          style={{
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: "clamp(2.5rem, 5vw, 4rem)",
            lineHeight: 1.02,
            letterSpacing: "-0.03em",
            color: "var(--text-primary)",
          }}
        >
          Your signals.
        </h1>
        <Link
          href="/submit"
          className="group inline-flex items-center gap-2 mt-4 text-[15px] font-medium tracking-[0.3em] uppercase transition-opacity hover:opacity-70 shrink-0"
          style={{ fontFamily: DISPLAY, color: "var(--accent)" }}
        >
          Submit idea
          <ArrowRight
            className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1"
            strokeWidth={2}
          />
        </Link>
      </div>

      <div
        className="text-[17px] leading-[1.6] mb-10 space-y-1"
        style={{ color: "var(--text-secondary)" }}
      >
        <p>Every idea you&apos;ve submitted, with its viability score and AI insight attached.</p>
        <p>Click any to open the full report.</p>
      </div>

      {/* Onboarding checklist */}
      <OnboardingChecklist
        hasIdeas={hasIdeas}
        hasReport={hasReport}
        firstIdeaId={firstReportIdeaId}
      />

      {/* Empty state — editorial */}
      {!hasIdeas && <EmptyState />}

      {/* Ideas grid */}
      {hasIdeas && <IdeaGrid items={items} highlightId={topScoringId} />}

      {/* Bottom — secondary navigation, editorial link row */}
      {hasIdeas && (
        <div className="mt-16 pt-8 border-t flex flex-wrap items-center justify-between gap-4"
          style={{ borderColor: "var(--t-border-subtle)" }}
        >
          <span
            className="text-[15px] font-medium tracking-[0.3em] uppercase"
            style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
          >
            Keep going
          </span>
          <div className="flex items-center gap-6 flex-wrap">
            <Link
              href="/explore"
              className="group inline-flex items-center gap-2 text-[15px] font-medium tracking-[0.3em] uppercase transition-opacity hover:opacity-70"
              style={{ fontFamily: DISPLAY, color: "var(--text-secondary)" }}
            >
              Explore the market
              <ArrowRight
                className="w-3 h-3 transition-transform group-hover:translate-x-1"
                strokeWidth={2}
              />
            </Link>
            {ideas.length >= 2 && (
              <>
                <span aria-hidden style={{ color: "var(--t-border-bright)" }}>·</span>
                <Link
                  href="/compare"
                  className="group inline-flex items-center gap-2 text-[15px] font-medium tracking-[0.3em] uppercase transition-opacity hover:opacity-70"
                  style={{ fontFamily: DISPLAY, color: "var(--text-secondary)" }}
                >
                  Compare two ideas
                  <ArrowRight
                    className="w-3 h-3 transition-transform group-hover:translate-x-1"
                    strokeWidth={2}
                  />
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div
      className="py-20 border-t border-b"
      style={{ borderColor: "var(--t-border-subtle)" }}
    >
      <p
        className="text-[14px] font-medium tracking-[0.35em] uppercase mb-5"
        style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
      >
        Nothing yet
      </p>

      <p
        className="leading-[1.15] mb-5 max-w-2xl"
        style={{
          fontFamily: SERIF,
          fontStyle: "italic",
          fontWeight: 400,
          fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
          letterSpacing: "-0.01em",
          color: "var(--text-primary)",
        }}
      >
        &ldquo;Submit your first idea. Get a signal before you build.&rdquo;
      </p>

      <p
        className="text-[15px] leading-[1.75] mb-10 max-w-2xl"
        style={{ color: "var(--text-secondary)" }}
      >
        Anonymous submission, 8 specialist agents, one viability score in under two minutes. No commitment, no email dance.
      </p>

      {/* 3-step editorial */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-10 gap-y-8 mb-10 max-w-3xl">
        {[
          { step: "01", label: "Submit", desc: "Category, target user, short description." },
          { step: "02", label: "Analyze", desc: "8 AI agents read the signal across dimensions." },
          { step: "03", label: "Decide", desc: "Viability score, pros, cons, next steps." },
        ].map((s) => (
          <div key={s.step}>
            <span
              className="tabular-nums leading-none block mb-3"
              style={{
                fontFamily: SERIF,
                fontWeight: 900,
                fontSize: "2.25rem",
                letterSpacing: "-0.03em",
                color: "var(--text-tertiary)",
              }}
            >
              {s.step}
            </span>
            <p
              className="text-[14px] font-medium tracking-[0.3em] uppercase mb-2"
              style={{ fontFamily: DISPLAY, color: "var(--text-primary)" }}
            >
              {s.label}
            </p>
            <p
              className="text-[13.5px] leading-[1.65]"
              style={{ color: "var(--text-tertiary)" }}
            >
              {s.desc}
            </p>
          </div>
        ))}
      </div>

      <Link
        href="/submit"
        className="group inline-flex items-center gap-3 text-[15px] font-medium tracking-[0.3em] uppercase transition-opacity hover:opacity-70"
        style={{ fontFamily: DISPLAY, color: "var(--accent)" }}
      >
        Submit your first idea
        <ArrowRight
          className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1"
          strokeWidth={2}
        />
      </Link>
    </div>
  );
}
