import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ChevronDown } from "lucide-react";
import DeepAnalysis from "@/components/DeepAnalysis";
import { PendingReportView } from "@/components/ideas/PendingReportView";
import { IdeaHero } from "@/components/ideas/IdeaHero";
import { IdeaActionDock } from "@/components/ideas/IdeaActionDock";
import { NextStepsCard } from "@/components/ideas/NextStepsCard";
import { WorkingBreakingBoard } from "@/components/ideas/WorkingBreakingBoard";
import { OwnerVisibilityCard } from "@/components/ideas/OwnerVisibilityCard";
import { AnalysisProvider, type AnalysisReport } from "@/components/ideas/AnalysisContext";
import { ReportShell } from "@/components/ideas/ReportShell";
import { Brand } from "@/components/layout/Brand";
import { getCategoryTheme, timeAgo } from "@/lib/categories";

// Force fresh render on every request — we need the latest analysis_reports row
// so the hero score doesn't flash from heuristic → AI on client-side refetch.
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface Report {
  viability_score: number;
  saturation_level: string;
  trend_direction: string;
  similar_count: number;
  summary: string;
  ai_description: string | null;
}

const STAGE_LABEL: Record<string, string> = {
  idea: "Just an Idea",
  prototype: "Prototype",
  early_traction: "Early Traction",
  launched: "Launched",
};

interface Idea {
  id: string;
  category: string;
  target_user: string;
  description: string;
  created_at: string;
  user_id: string | null;
  stage: string | null;
  is_private: boolean | null;
  save_count: number | null;
  insight_reports: Report | Report[] | null;
}

function getReport(idea: Idea): Report | null {
  if (!idea.insight_reports) return null;
  if (Array.isArray(idea.insight_reports)) return idea.insight_reports[0] ?? null;
  return idea.insight_reports;
}

export default async function IdeaReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const [{ data, error }, { data: aiData }, { data: savedRow }] = await Promise.all([
    supabase
      .from("idea_submissions")
      .select(`
        id, category, target_user, description, created_at, user_id, stage, is_private, save_count,
        insight_reports (viability_score, saturation_level, trend_direction, similar_count, summary, ai_description)
      `)
      .eq("id", id)
      .single(),
    supabase
      .from("analysis_reports")
      .select("viability_score, summary, analysis, cross_agent_insights, opportunities, risks, next_steps")
      .eq("submission_id", id)
      .maybeSingle(),
    // 현재 사용자가 이 아이디어를 이미 저장했는지 — 하트 채움 상태 결정.
    // 비로그인 시엔 빈 결과 → not saved.
    user
      ? supabase
          .from("saved_ideas")
          .select("id")
          .eq("user_id", user.id)
          .eq("submission_id", id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  if (error || !data) notFound();

  const idea = data as unknown as Idea;
  const report = getReport(idea);

  // Viewer plan
  const { data: viewerProfile } = user
    ? await supabase
        .from("user_profiles")
        .select("plan")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  // Submitter contact settings
  const { data: submitterProfile } = idea.user_id
    ? await supabase
        .from("user_profiles")
        .select("allow_contact, contact_email, contact_phone, contact_linkedin, contact_other")
        .eq("id", idea.user_id)
        .maybeSingle()
    : { data: null };

  const plan = (viewerProfile?.plan ?? "free") as "free" | "plus" | "pro";
  const isPro = plan === "pro";
  const isPlusOrPro = plan === "plus" || plan === "pro";
  const isOwnIdea = !!user && user.id === idea.user_id;

  // Detailed view access: own idea → Plus+; others' idea → Pro only
  const detailed = isOwnIdea ? isPlusOrPro : isPro;
  const canContact = isPro && !!submitterProfile?.allow_contact;

  const submittedAgo = timeAgo(idea.created_at);
  const theme = getCategoryTheme(idea.category);
  const stageLabel = idea.stage ? STAGE_LABEL[idea.stage] : null;

  const Navbar = (
    <nav
      className="border-b px-6 h-[64px] flex items-center justify-between"
      style={{
        background: "var(--nav-bg)",
        borderColor: "var(--t-border-subtle)",
        backdropFilter: "blur(12px)",
      }}
    >
      <Brand size="sm" />
      <div className="flex items-center gap-6">
        <Link
          href="/dashboard"
          className="text-[15px] font-medium tracking-[0.08em] uppercase transition-opacity hover:opacity-70"
          style={{
            fontFamily: "'Inter', sans-serif",
            color: "var(--text-tertiary)",
          }}
        >
          My ideas
        </Link>
        <Link
          href="/submit"
          className="inline-flex items-center gap-2 text-[15px] font-medium tracking-[0.08em] uppercase transition-opacity hover:opacity-70"
          style={{
            fontFamily: "'Inter', sans-serif",
            color: "var(--accent)",
          }}
        >
          Submit idea
          <span aria-hidden>→</span>
        </Link>
      </div>
    </nav>
  );

  if (!report) {
    return (
      <div className="min-h-screen" style={{ background: "var(--page-bg)" }}>
        {Navbar}
        <PendingReportView submittedDate={submittedAgo} />
      </div>
    );
  }

  const initialAnalysisReport: AnalysisReport | null = aiData
    ? {
        viability_score: aiData.viability_score,
        summary: aiData.summary,
        analysis: (aiData.analysis ?? {}) as AnalysisReport["analysis"],
        cross_agent_insights: ((aiData as unknown) as { cross_agent_insights?: string[] }).cross_agent_insights ?? [],
        opportunities: ((aiData as unknown) as { opportunities?: string[] }).opportunities ?? [],
        risks: ((aiData as unknown) as { risks?: string[] }).risks ?? [],
        next_steps: ((aiData as unknown) as { next_steps?: string[] }).next_steps ?? [],
      }
    : null;

  return (
    <AnalysisProvider submissionId={idea.id} initialReport={initialAnalysisReport}>
    <div className="min-h-screen" style={{ background: "var(--page-bg)" }}>
      {Navbar}
      {/* ReportShell: hides the entire report layout while AI analysis is pending,
          replacing it with a full-bleed AnalysisLoadingScreen that shows real
          per-agent progress (교수님 피드백 — 분석된 페이지 형식이 절대 비치지 않게). */}
      <ReportShell
        submittedDate={submittedAgo}
        backHref={isOwnIdea ? "/dashboard" : "/explore"}
        ideaId={idea.id}
      >
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Breadcrumb / back link */}
        <Link
          href={isOwnIdea ? "/dashboard" : "/explore"}
          className="inline-flex items-center gap-1.5 text-[15px] font-medium tracking-[0.06em] uppercase mb-10 transition-colors hover:text-[color:var(--text-primary)]"
          style={{
            fontFamily: "'Inter', sans-serif",
            color: "var(--text-tertiary)",
          }}
        >
          <ArrowLeft className="w-3 h-3" />
          {isOwnIdea ? "Back to my ideas" : "Back to market"}
        </Link>

        {/* Editorial kicker — category · report · meta */}
        <div className="flex items-center gap-4 mb-6">
          <span className="inline-flex items-center gap-2 shrink-0">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: theme.accent }}
            />
            <span
              className="text-[15px] font-medium tracking-[0.08em] uppercase"
              style={{
                fontFamily: "'Inter', sans-serif",
                color: "var(--text-tertiary)",
              }}
            >
              {idea.category} · Signal Report
            </span>
          </span>
          <span
            className="flex-1 h-px"
            style={{ background: "var(--t-border-subtle)" }}
          />
          {/* "Open to contact" — VC(non-owner) 에게 최상단에서 강조. Founder 가
              연락 허용한 아이디어는 reach out 가능하다는 시그널. */}
          {!isOwnIdea && submitterProfile?.allow_contact && (
            <span
              className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[0.08em] uppercase shrink-0 px-2 py-0.5"
              style={{
                fontFamily: "'Inter', sans-serif",
                color: "var(--signal-success)",
                background: "rgba(16, 185, 129, 0.10)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
              }}
              title="Founder is open to investor contact"
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "var(--signal-success)" }}
                aria-hidden
              />
              Open to contact
            </span>
          )}
          <span
            className="text-[15px] font-medium tracking-[0.06em] uppercase shrink-0"
            style={{
              fontFamily: "'Inter', sans-serif",
              color: "var(--text-tertiary)",
            }}
          >
            {submittedAgo}
            {stageLabel ? ` · ${stageLabel}` : ""}
          </span>
        </div>

        {/* H1 — editorial display */}
        <h1
          className="mb-6"
          style={{
            fontFamily: "'Fraunces', serif",
            fontWeight: 900,
            fontSize: "clamp(2.5rem, 5vw, 4rem)",
            lineHeight: 1.02,
            letterSpacing: "-0.03em",
            color: "var(--text-primary)",
          }}
        >
          For {idea.target_user}.
        </h1>

        {/* Dek — full-width prose to match kicker/H1 right edge */}
        <p
          className="text-[17px] leading-[1.75] mb-4"
          style={{ color: "var(--text-secondary)" }}
        >
          {report.ai_description ?? idea.description}
        </p>

        {/* Hero — 2-col verdict + score + strongest/weakest. AI data flows
            in via AnalysisProvider. fallbackScore/Summary are passed as null
            so the heuristic insight_reports score never leaks into the hero
            — while AI is pending/failed the hero renders a skeleton, and
            the AnalysisProgressStrip above carries the status + retry.
            (교수님 피드백 #3 — "하드코딩 66점 fallback 노출" 차단) */}
        <IdeaHero
          fallbackScore={null}
          fallbackSummary={null}
          trendDirection={report.trend_direction}
          saturationLevel={report.saturation_level}
          actionAnchor="next-actions"
          ideaId={idea.id}
          isSaved={!!savedRow}
          isAnonymous={!user}
          isOwner={isOwnIdea}
          saveCount={idea.save_count ?? 0}
        />

        {/* Original submission — full-width kicker rule, expandable */}
        <details className="mb-14 group">
          <summary
            className="py-3 cursor-pointer list-none flex items-center gap-4 transition-opacity hover:opacity-80"
          >
            <span
              className="text-[15px] font-medium tracking-[0.08em] uppercase"
              style={{
                fontFamily: "'Inter', sans-serif",
                color: "var(--text-tertiary)",
              }}
            >
              Original Submission
            </span>
            <span
              className="flex-1 h-px"
              style={{ background: "var(--t-border-subtle)" }}
            />
            <span
              className="inline-flex items-center gap-2 text-[15px] font-medium tracking-[0.08em] uppercase"
              style={{
                fontFamily: "'Inter', sans-serif",
                color: "var(--text-tertiary)",
              }}
            >
              <span className="group-open:hidden">Expand</span>
              <span className="hidden group-open:inline">Collapse</span>
              <ChevronDown
                className="w-3 h-3 transition-transform group-open:rotate-180"
                strokeWidth={2.25}
              />
            </span>
          </summary>
          <div
            className="mt-6 pl-5 space-y-5 border-l max-w-3xl"
            style={{ borderColor: "var(--t-border-subtle)" }}
          >
            <div>
              <p
                className="text-[15px] font-medium tracking-[0.08em] uppercase mb-2"
                style={{ fontFamily: "'Inter', sans-serif", color: "var(--text-tertiary)" }}
              >
                Target user
              </p>
              <p className="text-[15px]" style={{ color: "var(--text-primary)" }}>
                {idea.target_user}
              </p>
            </div>
            <div>
              <p
                className="text-[15px] font-medium tracking-[0.08em] uppercase mb-2"
                style={{ fontFamily: "'Inter', sans-serif", color: "var(--text-tertiary)" }}
              >
                Your description
              </p>
              <p
                className="text-[15px] leading-[1.75]"
                style={{ color: "var(--text-secondary)" }}
              >
                {idea.description}
              </p>
            </div>
          </div>
        </details>

        {/* Next Steps — hoisted above Analysis so action follows decision */}
        {detailed && <NextStepsCard />}

        {/* What's working / What's breaking — unified insight view */}
        {detailed && <WorkingBreakingBoard />}

        {/* Deep Analysis — hides OverallSignal/Next Steps/Insights (rendered above),
            limits agent grid to top-3 with collapse for the rest */}
        <DeepAnalysis
          submissionId={idea.id}
          fallbackScore={null}
          fallbackSummary={null}
          trendDirection={report.trend_direction}
          saturationLevel={report.saturation_level}
          similarCount={report.similar_count}
          detailed={detailed}
          hideOverallSignal
          hideNextSteps
          hideInsightsBlock
        />

        {/* Action dock — "Decide what to do with this idea", placed after the
            report so the reader has full context before choosing. */}
        <IdeaActionDock
          ideaId={idea.id}
          category={idea.category}
          isOwner={isOwnIdea}
          canContact={canContact}
          id="next-actions"
        />

        {/* Owner-only visibility & contact controls */}
        {isOwnIdea && (
          <OwnerVisibilityCard
            ideaId={idea.id}
            initialIsPrivate={!!idea.is_private}
            initialAllowContact={!!submitterProfile?.allow_contact}
            hasContactEmail={!!submitterProfile?.contact_email}
          />
        )}

        {/* Footer — minimal colophon */}
        <div
          className="mt-14 pt-6 flex flex-wrap items-center justify-between gap-4 border-t"
          style={{ borderColor: "var(--t-border-subtle)" }}
        >
          <p
            className="text-[13px] leading-[1.6]"
            style={{ color: "var(--text-tertiary)" }}
          >
            {idea.is_private
              ? "Private report · Only you can open this."
              : "Public report · Anyone with this link can open it."}
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/submit"
              className="group inline-flex items-center gap-2 text-[13px] font-medium tracking-[0.08em] uppercase transition-opacity hover:opacity-70"
              style={{
                fontFamily: "'Inter', sans-serif",
                color: "var(--text-tertiary)",
              }}
            >
              Submit another idea
              <ArrowRight
                className="w-3 h-3 transition-transform group-hover:translate-x-0.5"
                strokeWidth={2}
              />
            </Link>
          </div>
        </div>

      </div>
      </ReportShell>
    </div>
    </AnalysisProvider>
  );
}
