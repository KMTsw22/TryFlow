import { WaitlistForm } from "./WaitlistForm";

const CATEGORY_THEME: Record<string, {
  bg: string; badge: string; badgeText: string; emoji: string;
}> = {
  SaaS:        { bg: "bg-gradient-to-br from-purple-600 via-violet-700 to-purple-800", badge: "bg-purple-500/30",  badgeText: "text-purple-100",  emoji: "⚡" },
  Marketplace: { bg: "bg-gradient-to-br from-orange-500 via-amber-600 to-orange-700",  badge: "bg-orange-400/30",  badgeText: "text-orange-100",  emoji: "🛒" },
  Consumer:    { bg: "bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800",     badge: "bg-blue-500/30",    badgeText: "text-blue-100",    emoji: "📱" },
  "Dev Tools": { bg: "bg-gradient-to-br from-slate-600 via-slate-700 to-slate-900",    badge: "bg-slate-500/30",   badgeText: "text-slate-100",   emoji: "🛠️" },
  Health:      { bg: "bg-gradient-to-br from-green-500 via-emerald-600 to-teal-700",   badge: "bg-green-500/30",   badgeText: "text-green-100",   emoji: "💚" },
  Education:   { bg: "bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-800",   badge: "bg-indigo-500/30",  badgeText: "text-indigo-100",  emoji: "📚" },
  Social:      { bg: "bg-gradient-to-br from-pink-500 via-rose-600 to-pink-700",       badge: "bg-pink-400/30",    badgeText: "text-pink-100",    emoji: "💬" },
  Other:       { bg: "bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900",       badge: "bg-gray-500/30",    badgeText: "text-gray-100",    emoji: "🔬" },
};

interface HeroSectionProps {
  experimentId: string;
  title: string;
  subtitle: string;
  ctaText?: string;
  badge?: string;
  category?: string;
  projectUrl?: string;
}

export function HeroSection({ experimentId, title, subtitle, ctaText, badge, category, projectUrl: _projectUrl }: HeroSectionProps) {
  const theme = CATEGORY_THEME[category ?? ""] ?? {
    bg: "bg-gradient-to-br from-purple-600 via-violet-700 to-purple-900",
    badge: "bg-purple-500/30",
    badgeText: "text-purple-100",
    emoji: "🚀",
  };

  return (
    <section
      className={`${theme.bg} min-h-[70vh] flex items-center justify-center px-6 py-24 relative overflow-hidden`}
      data-testid="hero-section"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[200px] font-black text-white/5 select-none leading-none">
          {theme.emoji}
        </div>
      </div>

      <div className="max-w-3xl mx-auto text-center relative z-10">
        {/* Category / custom badge */}
        {(badge ?? category) && (
          <span className={`inline-block ${theme.badge} ${theme.badgeText} text-xs font-semibold px-4 py-1.5 rounded-full mb-6 backdrop-blur-sm`}>
            {badge ?? `${theme.emoji} ${category}`}
          </span>
        )}

        <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight drop-shadow-sm">
          {title}
        </h1>

        <p className="mt-6 text-lg text-white/80 max-w-xl mx-auto leading-relaxed">
          {subtitle}
        </p>

        <div className="mt-10 flex justify-center">
          <WaitlistForm experimentId={experimentId} ctaText={ctaText} />
        </div>
      </div>
    </section>
  );
}
