import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Plus, ArrowRight, BarChart3, FileText, GitCompare } from "lucide-react";
import { OnboardingChecklist } from "@/components/dashboard/OnboardingChecklist";
import { IdeaTable, type IdeaTableRow } from "@/components/ideas/IdeaTable";
import { PageHeader } from "@/components/ui/PageHeader";
import type { TrendDirection } from "@/components/ui/TrendLabel";
import type { IdeaStatus } from "@/components/ui/StatusBadge";

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

function toTableRow(idea: Idea): IdeaTableRow {
  const r = getReport(idea);
  return {
    id: idea.id,
    category: idea.category,
    target_user: idea.target_user,
    description: idea.description,
    created_at: idea.created_at,
    viability_score: r?.viability_score ?? null,
    trend_direction: (r?.trend_direction as TrendDirection | undefined) ?? null,
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

  // Derive row data + find highest-scored idea for subtle highlight
  const rows = ideas.map(toTableRow);
  const topScoringId = rows
    .filter((r) => r.viability_score !== null)
    .reduce<IdeaTableRow | null>(
      (best, cur) =>
        !best || (cur.viability_score ?? 0) > (best.viability_score ?? 0) ? cur : best,
      null,
    )?.id ?? null;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <PageHeader
        title="My Ideas"
        meta={hasIdeas ? `${ideas.length} total` : undefined}
        description="Your submitted ideas and the AI insight reports attached to them."
        action={
          <Link
            href="/submit"
            className="inline-flex items-center gap-1.5 bg-[color:var(--accent)] text-white font-semibold px-4 h-9 text-sm hover:brightness-110 transition-all"
          >
            <Plus className="w-4 h-4" /> Submit idea
          </Link>
        }
      />

      {/* Onboarding checklist (self-hides once all steps done or dismissed) */}
      <OnboardingChecklist
        hasIdeas={hasIdeas}
        hasReport={hasReport}
        firstIdeaId={firstReportIdeaId}
      />

      {/* Empty state */}
      {!hasIdeas && (
        <div
          className="border p-12 text-center"
          style={{ background: "var(--card-bg)", borderColor: "var(--t-border-card)" }}
        >
          <div
            className="w-12 h-12 flex items-center justify-center mx-auto mb-5"
            style={{ background: "var(--accent-soft)", border: "1px solid var(--accent-ring)" }}
          >
            <FileText className="w-5 h-5" style={{ color: "var(--accent)" }} />
          </div>
          <h2
            className="text-base font-semibold mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            No ideas yet
          </h2>
          <p
            className="text-sm max-w-sm mx-auto mb-6 leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            Submit your first startup idea anonymously. Get an instant insight report showing viability, market saturation, and trend direction.
          </p>
          <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto mb-8 text-left">
            {[
              { step: "01", label: "Submit",  desc: "Category, target, description" },
              { step: "02", label: "Analyze", desc: "AI clusters, scores, trends" },
              { step: "03", label: "Decide",  desc: "Viability report · next steps" },
            ].map((s) => (
              <div
                key={s.step}
                className="p-4 border"
                style={{ background: "var(--card-bg)", borderColor: "var(--t-border-subtle)" }}
              >
                <div
                  className="text-xs font-mono mb-1"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {s.step}
                </div>
                <div
                  className="text-sm font-semibold mb-0.5"
                  style={{ color: "var(--text-primary)" }}
                >
                  {s.label}
                </div>
                <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  {s.desc}
                </div>
              </div>
            ))}
          </div>
          <Link
            href="/submit"
            className="inline-flex items-center gap-1.5 bg-[color:var(--accent)] text-white font-semibold px-5 h-10 text-sm hover:brightness-110 transition-all"
          >
            Submit your first idea <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Ideas table */}
      {hasIdeas && (
        <>
          <div className="flex items-end justify-between mb-3">
            <div>
              <h2
                className="text-sm font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                All ideas
              </h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                {topScoringId
                  ? "Click a column header to sort · Top-scoring idea highlighted"
                  : "Click a column header to sort · Reports in progress"}
              </p>
            </div>
          </div>
          <IdeaTable rows={rows} highlightId={topScoringId} />
        </>
      )}

      {/* Bottom CTAs */}
      {hasIdeas && (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/explore"
            className="border p-4 flex items-center justify-between transition-colors hover:bg-[color:var(--t-border-subtle)]"
            style={{ background: "var(--card-bg)", borderColor: "var(--t-border-card)" }}
          >
            <div>
              <p
                className="text-sm font-semibold mb-0.5"
                style={{ color: "var(--text-primary)" }}
              >
                Explore market trends
              </p>
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                Live data from all anonymous submissions
              </p>
            </div>
            <BarChart3
              className="w-4 h-4 shrink-0"
              style={{ color: "var(--text-tertiary)" }}
            />
          </Link>
          {ideas.length >= 2 && (
            <Link
              href="/compare"
              className="border p-4 flex items-center justify-between transition-colors hover:bg-[color:var(--t-border-subtle)]"
              style={{ background: "var(--accent-soft)", borderColor: "var(--accent-ring)" }}
            >
              <div>
                <p
                  className="text-sm font-semibold mb-0.5"
                  style={{ color: "var(--text-primary)" }}
                >
                  Compare your ideas
                </p>
                <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  Pick 2 and see which to pursue
                </p>
              </div>
              <GitCompare className="w-4 h-4 shrink-0" style={{ color: "var(--accent)" }} />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
