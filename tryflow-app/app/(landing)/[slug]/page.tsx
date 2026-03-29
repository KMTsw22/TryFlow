import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HeroSection } from "@/components/landing/HeroSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { FeatureVoteSection } from "@/components/landing/FeatureVoteSection";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function LandingPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: experiment } = await supabase
    .from("experiments")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!experiment || experiment.status === "DRAFT") notFound();

  // 방문자 카운트 증가
  await supabase
    .from("experiments")
    .update({ total_visitors: (experiment.total_visitors ?? 0) + 1 })
    .eq("id", experiment.id);

  return (
    <main>
      <HeroSection
        experimentId={experiment.id}
        title={experiment.hero_title ?? experiment.product_name}
        subtitle={experiment.hero_subtitle ?? experiment.description}
        ctaText={experiment.cta_text}
      />
      {experiment.pricing_tiers?.length > 0 && (
        <PricingSection experimentId={experiment.id} tiers={experiment.pricing_tiers} />
      )}
      {experiment.features?.length > 0 && (
        <FeatureVoteSection experimentId={experiment.id} features={experiment.features} />
      )}
      <footer className="py-8 border-t border-gray-200 text-center text-xs text-gray-400">
        Powered by <span className="font-semibold text-purple-600">TryFlow</span>
      </footer>
    </main>
  );
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("experiments").select("product_name, description").eq("slug", slug).single();
  return {
    title: data?.product_name ?? "TryFlow",
    description: data?.description ?? "",
  };
}
