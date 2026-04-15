import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { BarChart3 } from "lucide-react";
import DeepAnalysis from "@/components/DeepAnalysis";
import { ContactSection } from "@/components/vc/ContactSection";

interface Report {
  viability_score: number;
  saturation_level: string;
  trend_direction: string;
  similar_count: number;
  summary: string;
  ai_description: string | null;
}

const STAGES_ORDER = ["idea", "prototype", "early_traction", "launched"] as const;

const STAGE_META: Record<string, { label: string; sub: string; color: string; fill: number }> = {
  idea:           { label: "Just an Idea",     sub: "Concept only",          color: "#60a5fa", fill: 0   },
  prototype:      { label: "Prototype / Demo", sub: "Something working",      color: "#a78bfa", fill: 33  },
  early_traction: { label: "Early Traction",   sub: "Live with some users",   color: "#fb923c", fill: 67  },
  launched:       { label: "Launched",          sub: "Fully deployed & active", color: "#ef4444", fill: 100 },
};

interface Idea {
  id: string;
  category: string;
  target_user: string;
  description: string;
  created_at: string;
  user_id: string | null;
  stage: string | null;
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
        id, category, target_user, description, created_at, user_id, stage,
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

  // 현재 유저 plan 캐시
  const { data: viewerProfile } = user
    ? await supabase
        .from("user_profiles")
        .select("viewer_plan, submitter_plan")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  // 제출자 연락정보
  const { data: submitterProfile } = idea.user_id
    ? await supabase
        .from("user_profiles")
        .select("allow_contact, contact_email, contact_phone, contact_linkedin, contact_other")
        .eq("id", idea.user_id)
        .maybeSingle()
    : { data: null };

  const isViewer = viewerProfile?.viewer_plan === "pro";
  const isSubmitterPro = viewerProfile?.submitter_plan === "pro";
  const isOwnIdea = !!user && user.id === idea.user_id;

  // Detailed 분석 공개 기준:
  //  - 자기 아이디어: Submitter Pro만
  //  - 남의 아이디어: Viewer Pro만 (보통 /explore 게이트를 통과한 사용자)
  const detailed = isOwnIdea ? isSubmitterPro : isViewer;

  const canContact = isViewer && !!submitterProfile?.allow_contact;
  const date = new Date(idea.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const hasAiScore = !!aiData?.viability_score;

  const Navbar = (
    <nav
      className="border-b px-6 h-[60px] flex items-center justify-between"
      style={{ background: "var(--nav-bg)", borderColor: "var(--t-border)", backdropFilter: "blur(12px)" }}
    >
      <Link href="/" className="flex items-center gap-2">
        <img src="/logo.png" className="w-7 h-7" alt="Try.Wepp" />
        <span className="font-bold text-gray-900 dark:text-white text-sm">Try.Wepp</span>
      </Link>
      <div className="flex items-center gap-3">
        <Link href="/explore" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-1.5">
          <BarChart3 className="w-4 h-4" /> Trends
        </Link>
        <Link href="/submit" className="bg-indigo-500 text-white text-sm font-bold px-4 py-2 hover:bg-indigo-400 transition-colors">
          Submit another →
        </Link>
      </div>
    </nav>
  );

  if (!report) {
    return (
      <div className="min-h-screen" style={{ background: "var(--page-bg)" }}>
        {Navbar}
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="w-16 h-16 flex items-center justify-center mx-auto mb-6"
            style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}>
            <span className="text-2xl animate-spin inline-block text-indigo-400">⟳</span>
          </div>
          <h1 className="text-xl font-extrabold text-white mb-2">Report is being generated</h1>
          <p className="text-sm text-gray-400 mb-8">Your idea was submitted on {date}. The insight report is being processed — check back shortly.</p>
          <Link href="/submit" className="inline-flex items-center gap-2 bg-indigo-500 text-white font-bold px-6 py-3 text-sm hover:bg-indigo-400 transition-colors">
            Submit another idea →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--page-bg)" }}>
      {Navbar}

      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 text-indigo-400 text-xs font-bold px-3 py-1.5 rounded-full mb-4"
            style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)" }}>
            Your Personal Insight Report
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Here&apos;s what we found.</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Submitted {date} · {idea.category}</p>
          {hasAiScore && (
            <p className="text-[11px] text-indigo-400 mt-1">✦ AI Deep Analysis applied</p>
          )}
        </div>

        {/* Submitted idea card */}
        <div className="border p-6 mb-4"
          style={{ background: "var(--card-bg)", borderColor: "var(--t-border-card)" }}>
          <div className="flex items-start justify-between mb-4">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">Your Submitted Idea</p>
            {idea.stage && STAGE_META[idea.stage] && (() => {
              const s = STAGE_META[idea.stage!]!;
              const tubeH = 64;
              const bulbD = 20;
              return (
                <div className="flex items-center gap-2.5 shrink-0">
                  {/* Mini thermometer */}
                  <div className="flex flex-col items-center" style={{ width: bulbD }}>
                    {/* Tube */}
                    <div
                      className="relative overflow-hidden"
                      style={{
                        width: 10,
                        height: tubeH,
                        background: "var(--t-border-card)",
                        borderRadius: "999px 999px 0 0",
                        border: "1.5px solid var(--t-border-bright)",
                        borderBottom: "none",
                      }}
                    >
                      {/* Mercury fill */}
                      <div
                        style={{
                          position: "absolute",
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: `${s.fill === 0 ? 6 : s.fill}%`,
                          background: "linear-gradient(to top, #ef4444 0%, #fb923c 40%, #a78bfa 75%, #60a5fa 100%)",
                          transition: "height 0.5s cubic-bezier(0.34,1.56,0.64,1)",
                        }}
                      />
                      {/* Tick lines */}
                      {[33, 67].map(p => (
                        <div key={p} style={{ position: "absolute", bottom: `${p}%`, left: 0, right: 0, height: 1, background: "rgba(127,127,127,0.15)" }} />
                      ))}
                    </div>
                    {/* Bulb */}
                    <div style={{
                      width: bulbD,
                      height: bulbD,
                      borderRadius: "50%",
                      marginTop: -1,
                      background: s.color,
                      border: "1.5px solid var(--t-border-bright)",
                      boxShadow: `0 0 0 3px ${s.color}30`,
                    }} />
                  </div>
                  {/* Label */}
                  <div>
                    <p className="text-xs font-bold leading-tight" style={{ color: s.color }}>{s.label}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{s.sub}</p>
                    {/* Step dots */}
                    <div className="flex gap-1 mt-1.5">
                      {STAGES_ORDER.map((key) => (
                        <div
                          key={key}
                          style={{
                            width: 5,
                            height: 5,
                            borderRadius: "50%",
                            background: STAGE_META[key].fill <= s.fill ? s.color : "var(--t-border-bright)",
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Target user</p>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{idea.target_user}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Description</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{idea.description}</p>
            </div>
            {report.ai_description && (
              <div className="pt-3 border-t" style={{ borderColor: "var(--t-border)" }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <svg className="w-3 h-3 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">AI Summary</p>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">{report.ai_description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Deep Analysis — handles score, metrics, radar, agents, CTA */}
        <DeepAnalysis
          submissionId={idea.id}
          fallbackScore={report.viability_score}
          fallbackSummary={report.summary}
          trendDirection={report.trend_direction}
          saturationLevel={report.saturation_level}
          similarCount={report.similar_count}
          detailed={detailed}
        />

        {/* Contact Section */}
        <ContactSection
          ideaId={idea.id}
          category={idea.category}
          canContact={canContact}
          isSubscriber={isViewer}
        />

        {/* CTAs */}
        <div className="flex flex-col gap-3 mt-4">
          <Link href="/explore" className="w-full bg-indigo-500 text-white font-bold py-3 text-sm text-center hover:bg-indigo-400 transition-colors flex items-center justify-center gap-2">
            <BarChart3 className="w-4 h-4" /> Explore market trends in {idea.category}
          </Link>
          <Link href="/submit" className="w-full text-gray-500 dark:text-gray-400 font-medium py-3 text-sm text-center hover:text-gray-800 dark:hover:text-gray-200 transition-colors border"
            style={{ borderColor: "var(--t-border-bright)" }}>
            Submit another idea →
          </Link>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          This report is accessible via this link.
        </p>
      </div>
    </div>
  );
}