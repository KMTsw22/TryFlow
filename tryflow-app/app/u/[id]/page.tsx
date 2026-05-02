import Link from "next/link";
import { notFound } from "next/navigation";
import { Linkedin, Twitter, Github, Globe, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCategoryTheme, timeAgo } from "@/lib/categories";

const SERIF = "'Fraunces', serif";
const DISPLAY = "'Inter', sans-serif";

interface ProfileRow {
  id: string;
  full_name: string | null;
  bio: string | null;
  contact_linkedin: string | null;
  twitter_url: string | null;
  github_url: string | null;
  website_url: string | null;
  profile_anonymous: boolean | null;
  intro_video_url: string | null;
  intro_video_duration_seconds: number | null;
}

type ScoreRel =
  | { viability_score: number | null }
  | { viability_score: number | null }[]
  | null;

interface IdeaRow {
  id: string;
  category: string;
  target_user: string;
  description: string;
  created_at: string;
  is_private: boolean | null;
  insight_reports: ScoreRel;
  analysis_reports: ScoreRel;
}

/**
 * Public founder profile (`/u/[id]`).
 *
 * 2026-04: Anyone (logged in or out) can view. Anonymous toggle in the owner's
 * settings hides bio + name + links — public ideas list still shows but the
 * top of the page becomes a placeholder.
 *
 * Anonymous users still get a working page (so links don't break) — just
 * stripped of personally-identifying details.
 */
export default async function PublicProfilePage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const supabase = await createClient();

  const { data: rawProfile } = await supabase
    .from("user_profiles")
    .select(
      "id, full_name, bio, contact_linkedin, twitter_url, github_url, website_url, profile_anonymous, intro_video_url, intro_video_duration_seconds"
    )
    .eq("id", id)
    .maybeSingle();

  if (!rawProfile) notFound();

  const profile = rawProfile as ProfileRow;
  const isAnonymous = profile.profile_anonymous ?? true;

  // Public ideas (anyone, even non-anonymous owners get their public ideas listed)
  const { data: rawIdeas } = await supabase
    .from("idea_submissions")
    .select(
      "id, category, target_user, description, created_at, is_private, insight_reports (viability_score), analysis_reports (viability_score)"
    )
    .eq("user_id", id)
    .eq("is_private", false)
    .order("created_at", { ascending: false })
    .limit(20);

  const ideas = (rawIdeas ?? []) as unknown as IdeaRow[];

  const links = isAnonymous
    ? []
    : ([
        profile.contact_linkedin && {
          icon: Linkedin,
          href: profile.contact_linkedin,
          label: "LinkedIn",
        },
        profile.twitter_url && { icon: Twitter, href: profile.twitter_url, label: "Twitter" },
        profile.github_url && { icon: Github, href: profile.github_url, label: "GitHub" },
        profile.website_url && { icon: Globe, href: profile.website_url, label: "Website" },
      ].filter(Boolean) as { icon: typeof Linkedin; href: string; label: string }[]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Header — name + bio + links, OR anonymous placeholder */}
      <header
        className="mb-12 pb-10 border-b"
        style={{ borderColor: "var(--t-border-subtle)" }}
      >
        <span
          className="text-[11.5px] font-medium tracking-[0.14em] uppercase mb-4 block"
          style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
        >
          Founder
        </span>

        {isAnonymous ? (
          <>
            <h1
              className="leading-[1.05] mb-4"
              style={{
                fontFamily: SERIF,
                fontWeight: 900,
                fontSize: "clamp(2rem, 4vw, 3rem)",
                letterSpacing: "-0.025em",
                color: "var(--text-tertiary)",
              }}
            >
              Anonymous founder
            </h1>
            <p
              className="text-[15px] leading-[1.65] max-w-xl"
              style={{ color: "var(--text-secondary)" }}
            >
              This founder has chosen to keep their identity private. Their
              public ideas appear below.
            </p>
          </>
        ) : (
          <>
            <h1
              className="leading-[1.05] mb-4"
              style={{
                fontFamily: SERIF,
                fontWeight: 900,
                fontSize: "clamp(2.25rem, 4.5vw, 3.5rem)",
                letterSpacing: "-0.025em",
                color: "var(--text-primary)",
              }}
            >
              {profile.full_name ?? "Founder"}
            </h1>
            {profile.bio && (
              <p
                className="text-[16px] leading-[1.7] max-w-2xl mb-6"
                style={{ color: "var(--text-secondary)" }}
              >
                {profile.bio}
              </p>
            )}
            {links.length > 0 && (
              <div className="flex items-center gap-5 flex-wrap">
                {links.map(({ icon: Icon, href, label }) => (
                  <a
                    key={href}
                    href={normalizeUrl(href)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-[13px] font-medium transition-opacity hover:opacity-70"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
                    {label}
                  </a>
                ))}
              </div>
            )}

            {profile.intro_video_url && (
              <div
                className="mt-8 border overflow-hidden max-w-2xl"
                style={{ borderColor: "var(--t-border-card)", background: "#000" }}
              >
                <video
                  src={profile.intro_video_url}
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full"
                />
              </div>
            )}
          </>
        )}
      </header>

      {/* Ideas section */}
      <section>
        <div className="flex items-center gap-4 mb-6">
          <span
            className="text-[11.5px] font-medium tracking-[0.14em] uppercase"
            style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
          >
            Public ideas
          </span>
          <span className="flex-1 h-px" style={{ background: "var(--t-border-subtle)" }} />
          <span
            className="text-[11.5px] font-medium tracking-[0.14em] uppercase"
            style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
          >
            {ideas.length} total
          </span>
        </div>

        {ideas.length === 0 ? (
          <p
            className="text-[15px] italic leading-[1.65] py-12"
            style={{ fontFamily: SERIF, color: "var(--text-tertiary)" }}
          >
            &ldquo;No public ideas yet.&rdquo;
          </p>
        ) : (
          <ul className="divide-y" style={{ borderColor: "var(--t-border-subtle)" }}>
            {ideas.map((idea) => (
              <IdeaRowItem key={idea.id} idea={idea} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function IdeaRowItem({ idea }: { idea: IdeaRow }) {
  const theme = getCategoryTheme(idea.category);
  const score = pickScore(idea);
  const color = scoreColor(score);

  return (
    <li
      className="py-6 border-t first:border-t-0"
      style={{ borderColor: "var(--t-border-subtle)" }}
    >
      <Link
        href={`/ideas/${idea.id}`}
        className="group flex items-baseline gap-6 transition-opacity hover:opacity-80"
      >
        {/* Score */}
        <span
          className="tabular-nums shrink-0 leading-none"
          style={{
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: "2.25rem",
            letterSpacing: "-0.03em",
            color,
            minWidth: "3rem",
          }}
        >
          {score ?? "—"}
        </span>

        {/* Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: theme.accent }}
              aria-hidden
            />
            <span
              className="text-[11px] font-medium tracking-[0.12em] uppercase"
              style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
            >
              {idea.category} · {timeAgo(idea.created_at)}
            </span>
          </div>
          <p
            className="text-[15px] truncate mb-1"
            style={{
              fontFamily: SERIF,
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            For {idea.target_user}
          </p>
          <p
            className="text-[13.5px] leading-[1.55] line-clamp-2"
            style={{ color: "var(--text-secondary)" }}
          >
            {idea.description}
          </p>
        </div>

        <ArrowRight
          className="w-3.5 h-3.5 shrink-0 self-center transition-transform group-hover:translate-x-1"
          style={{ color: "var(--text-tertiary)" }}
          strokeWidth={2}
        />
      </Link>
    </li>
  );
}

function relScore(rel: ScoreRel): number | null {
  if (!rel) return null;
  if (Array.isArray(rel)) return rel[0]?.viability_score ?? null;
  return rel.viability_score ?? null;
}

// AI 점수가 있으면 그것을 우선 — 상세 페이지(IdeaHero)와 동일한 우선순위.
function pickScore(idea: IdeaRow): number | null {
  return relScore(idea.analysis_reports) ?? relScore(idea.insight_reports);
}

function scoreColor(score: number | null): string {
  if (score === null) return "var(--text-tertiary)";
  if (score >= 70) return "var(--signal-success)";
  if (score >= 50) return "var(--signal-warning)";
  return "var(--signal-danger)";
}

function normalizeUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}
