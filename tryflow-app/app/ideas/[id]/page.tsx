import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ChevronDown } from "lucide-react";
import DeepAnalysis from "@/components/DeepAnalysis";
import { ContactSection } from "@/components/vc/ContactSection";
import { PendingReportView } from "@/components/ideas/PendingReportView";
import { IdeaHero } from "@/components/ideas/IdeaHero";
import { IdeaActionDock } from "@/components/ideas/IdeaActionDock";
import { NextStepsCard } from "@/components/ideas/NextStepsCard";
import { WorkingBreakingBoard } from "@/components/ideas/WorkingBreakingBoard";
import { OwnerVisibilityCard } from "@/components/ideas/OwnerVisibilityCard";
import { getCategoryTheme, timeAgo } from "@/lib/categories";

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

  const [{ data, error }, { data: aiData }] = await Promise.all([
    supabase
      .from("idea_submissions")
      .select(`
        id, category, target_user, description, created_at, user_id, stage, is_private,
        insight_reports (viability_score, saturation_level, trend_direction, similar_count, summary, ai_description)
      `)
      .eq("id", id)
      .single(),
    supabase
      .from("analysis_reports")
      .select("viability_score, summary")
      .eq("submission_id", id)
      .maybeSingle(),
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
      <Link href="/" className="flex items-center gap-2.5">
        <img src="/logo.png" className="w-6 h-6" alt="Try.Wepp" />
        <span
          style={{
            fontFamily: "'Playfair Display', serif",
            fontWeight: 900,
            fontSize: "1rem",
            letterSpacing: "-0.02em",
            color: "var(--text-primary)",
          }}
        >
          Try.Wepp
        </span>
      </Link>
      <div className="flex items-center gap-6">
        <Link
          href="/dashboard"
          className="text-[15px] font-medium tracking-[0.3em] uppercase transition-opacity hover:opacity-70"
          style={{
            fontFamily: "'Oswald', sans-serif",
            color: "var(--text-tertiary)",
          }}
        >
          My ideas
        </Link>
        <Link
          href="/submit"
          className="inline-flex items-center gap-2 text-[15px] font-medium tracking-[0.3em] uppercase transition-opacity hover:opacity-70"
          style={{
            fontFamily: "'Oswald', sans-serif",
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

  return (
    <div className="min-h-screen" style={{ background: "var(--page-bg)" }}>
      {Navbar}

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Breadcrumb / back link */}
        <Link
          href={isOwnIdea ? "/dashboard" : "/explore"}
          className="inline-flex items-center gap-1.5 text-[15px] font-medium tracking-[0.2em] uppercase mb-10 transition-colors hover:text-[color:var(--text-primary)]"
          style={{
            fontFamily: "'Oswald', sans-serif",
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
              className="text-[15px] font-medium tracking-[0.3em] uppercase"
              style={{
                fontFamily: "'Oswald', sans-serif",
                color: "var(--text-tertiary)",
              }}
            >
              {idea.category} · Viability Report
            </span>
          </span>
          <span
            className="flex-1 h-px"
            style={{ background: "var(--t-border-subtle)" }}
          />
          <span
            className="text-[15px] font-medium tracking-[0.25em] uppercase shrink-0"
            style={{
              fontFamily: "'Oswald', sans-serif",
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
            fontFamily: "'Playfair Display', serif",
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

        {/* Hero — 2-col verdict + score + strongest/weakest */}
        <IdeaHero
          submissionId={idea.id}
          fallbackScore={report.viability_score}
          fallbackSummary={report.summary}
          trendDirection={report.trend_direction}
          saturationLevel={report.saturation_level}
          actionAnchor="next-actions"
        />

        {/* Original submission — full-width kicker rule, expandable */}
        <details className="mb-14 group">
          <summary
            className="py-3 cursor-pointer list-none flex items-center gap-4 transition-opacity hover:opacity-80"
          >
            <span
              className="text-[15px] font-medium tracking-[0.35em] uppercase"
              style={{
                fontFamily: "'Oswald', sans-serif",
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
              className="inline-flex items-center gap-2 text-[15px] font-medium tracking-[0.3em] uppercase"
              style={{
                fontFamily: "'Oswald', sans-serif",
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
                className="text-[15px] font-medium tracking-[0.3em] uppercase mb-2"
                style={{ fontFamily: "'Oswald', sans-serif", color: "var(--text-tertiary)" }}
              >
                Target user
              </p>
              <p className="text-[15px]" style={{ color: "var(--text-primary)" }}>
                {idea.target_user}
              </p>
            </div>
            <div>
              <p
                className="text-[15px] font-medium tracking-[0.3em] uppercase mb-2"
                style={{ fontFamily: "'Oswald', sans-serif", color: "var(--text-tertiary)" }}
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
        {detailed && <NextStepsCard submissionId={idea.id} />}

        {/* What's working / What's breaking — unified insight view */}
        {detailed && <WorkingBreakingBoard submissionId={idea.id} />}

        {/* Deep Analysis — hides OverallSignal/Next Steps/Insights (rendered above),
            limits agent grid to top-3 with collapse for the rest */}
        <DeepAnalysis
          submissionId={idea.id}
          fallbackScore={report.viability_score}
          fallbackSummary={report.summary}
          trendDirection={report.trend_direction}
          saturationLevel={report.saturation_level}
          similarCount={report.similar_count}
          detailed={detailed}
          hideOverallSignal
          hideNextSteps
          hideInsightsBlock
        />

        {/* Contact section — only renders for Pro viewers on others' ideas */}
        {!isOwnIdea && (
          <div id="contact">
            <ContactSection
              ideaId={idea.id}
              category={idea.category}
              canContact={canContact}
              isSubscriber={isPro}
            />
          </div>
        )}

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
              className="group inline-flex items-center gap-2 text-[13px] font-medium tracking-[0.3em] uppercase transition-opacity hover:opacity-70"
              style={{
                fontFamily: "'Oswald', sans-serif",
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

        {/* Silence unused-variable warnings without removing feature flags */}
        <span className="hidden" data-ai-score={aiData?.viability_score} />
      </div>
    </div>
  );
}
