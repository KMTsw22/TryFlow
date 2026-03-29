import { WaitlistForm } from "./WaitlistForm";

interface HeroSectionProps {
  experimentId: string;
  title: string;
  subtitle: string;
  ctaText?: string;
  badge?: string;
}

export function HeroSection({
  experimentId,
  title,
  subtitle,
  ctaText,
  badge,
}: HeroSectionProps) {
  return (
    <section
      className="gradient-hero min-h-[70vh] flex items-center justify-center px-6 py-24"
      data-testid="hero-section"
    >
      <div className="max-w-3xl mx-auto text-center">
        {badge && (
          <span className="inline-block bg-primary-100 text-primary-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
            {badge}
          </span>
        )}

        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
          {title}
        </h1>

        <p className="mt-6 text-lg text-gray-500 max-w-xl mx-auto leading-relaxed">
          {subtitle}
        </p>

        <div className="mt-10 flex justify-center">
          <WaitlistForm experimentId={experimentId} ctaText={ctaText} />
        </div>
      </div>
    </section>
  );
}
