"use client";

import { useState } from "react";
import { ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: string;
}

interface FeatureVoteSectionProps {
  experimentId: string;
  features: Feature[];
}

export function FeatureVoteSection({
  experimentId,
  features,
}: FeatureVoteSectionProps) {
  const [voted, setVoted] = useState<Set<string>>(new Set());

  const handleVote = async (featureId: string) => {
    if (voted.has(featureId)) return;
    setVoted((prev) => new Set(prev).add(featureId));

    await fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        experimentId,
        eventType: "feature_vote",
        metadata: { featureId },
      }),
    });
  };

  return (
    <section className="py-20 px-6 bg-primary-50" data-testid="features-section">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">
            Which features matter most?
          </h2>
          <p className="text-gray-500 mt-3">
            Vote for the features you&apos;d find most valuable
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {features.map((feature) => {
            const isVoted = voted.has(feature.id);
            return (
              <button
                key={feature.id}
                onClick={() => handleVote(feature.id)}
                data-testid={`feature-vote-${feature.id}`}
                data-event="feature_vote"
                className={cn(
                  "rounded-2xl border p-6 text-left transition-all hover:shadow-md",
                  isVoted
                    ? "border-primary-400 bg-primary-600 text-white"
                    : "border-gray-200 bg-white hover:border-primary-300"
                )}
              >
                <span className="text-2xl mb-3 block">{feature.icon}</span>
                <h3
                  className={cn(
                    "font-semibold text-sm mb-1",
                    isVoted ? "text-white" : "text-gray-900"
                  )}
                >
                  {feature.title}
                </h3>
                <p
                  className={cn(
                    "text-xs",
                    isVoted ? "text-primary-200" : "text-gray-500"
                  )}
                >
                  {feature.description}
                </p>
                <div
                  className={cn(
                    "flex items-center gap-1 mt-3 text-xs font-medium",
                    isVoted ? "text-primary-200" : "text-primary-600"
                  )}
                >
                  <ThumbsUp className="w-3 h-3" />
                  {isVoted ? "Voted!" : "Vote"}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
