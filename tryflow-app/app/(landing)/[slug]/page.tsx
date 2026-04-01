import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CommentSection } from "@/components/landing/CommentSection";
import { FeatureVoteSection } from "@/components/landing/FeatureVoteSection";
import { PricingSliderSection } from "@/components/landing/PricingSliderSection";
import { FullPageTracker } from "@/components/landing/FullPageTracker";
import { TryItButton } from "@/components/landing/TryItButton";
import { ShareButtons } from "@/components/landing/ShareButtons";
import Link from "next/link";
import { Zap, Users, Tag, ArrowLeft } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

const CATEGORY_STYLE: Record<string, { bg: string; text: string; border: string; emoji: string; heroBg: string }> = {
  SaaS:        { bg: "bg-purple-50",  text: "text-purple-700",  border: "border-purple-200",  emoji: "⚡", heroBg: "from-purple-600 to-violet-800" },
  Marketplace: { bg: "bg-orange-50",  text: "text-orange-700",  border: "border-orange-200",  emoji: "🛒", heroBg: "from-orange-500 to-amber-600" },
  Consumer:    { bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200",    emoji: "📱", heroBg: "from-blue-600 to-indigo-700" },
  "Dev Tools": { bg: "bg-slate-100",  text: "text-slate-700",   border: "border-slate-200",   emoji: "🛠️", heroBg: "from-slate-600 to-slate-800" },
  Health:      { bg: "bg-green-50",   text: "text-green-700",   border: "border-green-200",   emoji: "💚", heroBg: "from-green-500 to-teal-700" },
  Education:   { bg: "bg-indigo-50",  text: "text-indigo-700",  border: "border-indigo-200",  emoji: "📚", heroBg: "from-indigo-600 to-blue-700" },
  Social:      { bg: "bg-pink-50",    text: "text-pink-700",    border: "border-pink-200",    emoji: "💬", heroBg: "from-pink-500 to-rose-600" },
  Other:       { bg: "bg-gray-100",   text: "text-gray-600",    border: "border-gray-200",    emoji: "🔬", heroBg: "from-gray-700 to-gray-900" },
};

export default async function CommunityPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: experiment } = await supabase
    .from("experiments")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!experiment || experiment.status === "DRAFT") notFound();

  const { data: { user } } = await supabase.auth.getUser();
  const profileName: string = user
    ? (user.user_metadata?.full_name || user.email?.split("@")[0] || "Anonymous")
    : "";

  const pricingMode = (experiment as { pricing_mode?: string }).pricing_mode ?? "tiers";
  const pricingSlider = (experiment as { pricing_slider?: { paymentType?: string; min?: number; max?: number } }).pricing_slider ?? {};

  // Slider responses
  const { data: sliderEvents } = await supabase
    .from("click_events")
    .select("metadata")
    .eq("experiment_id", experiment.id)
    .eq("event_type", "price_slider_response");

  const sliderResponses: number[] = (sliderEvents ?? [])
    .map((e: { metadata: { value?: number } }) => e.metadata?.value)
    .filter((v): v is number => typeof v === "number");

  const makerName  = (experiment as { maker_name?: string }).maker_name ?? "";
  const category   = (experiment as { category?: string }).category ?? "Other";
  const projectUrl = (experiment as { project_url?: string }).project_url ?? "";
  const cat = CATEGORY_STYLE[category] ?? CATEGORY_STYLE.Other;

  return (
    <main className="min-h-screen bg-[#FAFAFA]">
      <FullPageTracker experimentId={experiment.id} />
      {/* try.wepp top banner */}
      <div className="bg-[#0B1026] text-white text-xs py-2 px-4 text-center">
        <span className="opacity-60">Pre-launch validation on </span>
        <span className="font-semibold text-teal-400">Try.Wepp</span>
        <span className="opacity-60"> · Share your honest feedback! </span>
        <Link href="/explore" className="underline underline-offset-2 font-medium text-teal-400 hover:text-teal-300">
          Browse other projects →
        </Link>
      </div>

      {/* Project header */}
      <div className={`bg-gradient-to-br ${cat.heroBg} px-6 py-10`}>
        <div className="max-w-3xl mx-auto">
          <Link
            href="/explore"
            className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-xs mb-6 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Explore
          </Link>

          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl shrink-0">
              {cat.emoji}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1 text-xs font-semibold bg-white/20 text-white px-2.5 py-1 rounded-full">
                  <Tag className="w-3 h-3" /> {category}
                </span>
                <span className="inline-flex items-center gap-1 text-xs bg-green-400/20 text-green-200 px-2.5 py-1 rounded-full font-medium">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" /> Live testing
                </span>
              </div>

              <h1 className="text-3xl font-bold text-white mt-2">
                {experiment.product_name}
              </h1>

              {makerName && (
                <p className="flex items-center gap-1.5 text-white/60 text-sm mt-1">
                  <Users className="w-3.5 h-3.5" /> {makerName}
                </p>
              )}

              <p className="text-white/80 text-sm mt-3 leading-relaxed max-w-xl">
                {experiment.hero_subtitle ?? experiment.description}
              </p>

              {/* Try button */}
              {projectUrl && (
                <TryItButton
                  href={projectUrl}
                  productName={experiment.product_name}
                  experimentId={experiment.id}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-10">

        {/* Feature voting (if available) */}
        {experiment.features?.length > 0 && (
          <div>
            <h2 className="text-base font-bold text-gray-900 mb-4">Vote on Features</h2>
            <FeatureVoteSection experimentId={experiment.id} features={experiment.features} />
          </div>
        )}

        {/* Pricing feedback */}
        {pricingSlider.min !== undefined && pricingSlider.max !== undefined && (
          <div>
            <h2 className="text-base font-bold text-gray-900 mb-4">How much would you pay?</h2>
            <PricingSliderSection
              experimentId={experiment.id}
              config={{
                paymentType: (pricingSlider.paymentType as "one-time" | "monthly") ?? "one-time",
                min: pricingSlider.min,
                max: pricingSlider.max,
              }}
              initialResponses={sliderResponses}
            />
          </div>
        )}

        {/* Community comments */}
        <div>
          <CommentSection experimentId={experiment.id} profileName={profileName} />
        </div>
      </div>

      {/* Share + Footer */}
      <footer className="py-8 border-t border-gray-200">
        <div className="max-w-3xl mx-auto px-6 space-y-4">
          <ShareButtons
            title={experiment.product_name}
            description={experiment.hero_subtitle ?? experiment.description}
          />
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded bg-teal-500 flex items-center justify-center">
                <Zap className="w-2.5 h-2.5 text-white" />
              </div>
              <span>
                Powered by <span className="font-semibold text-teal-600">Try.Wepp</span>
                {makerName && <span className="text-gray-400"> · by {makerName}</span>}
              </span>
            </div>
            <Link href="/explore" className="text-teal-600 font-medium hover:text-teal-700">
              Browse more projects →
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("experiments")
    .select("product_name, description")
    .eq("slug", slug)
    .single();
  const title = data ? `${data.product_name} · Try.Wepp` : "Try.Wepp";
  const description = data?.description ?? "Pre-launch market validation on Try.Wepp";
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "Try.Wepp",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}
