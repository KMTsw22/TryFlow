"use client";

import { useState } from "react";
import { Check, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface Tier {
  name: string;
  price: string;
  description?: string;
  features?: string[];
}

interface Props {
  experimentId: string;
  tiers: Tier[];
  initialVotes: Record<string, number>; // planName → count
}

export function PricingVoteSection({ experimentId, tiers, initialVotes }: Props) {
  const [votes, setVotes] = useState<Record<string, number>>(initialVotes);
  const [voted, setVoted] = useState<string | null>(null); // selected plan name

  const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0);

  async function handleVote(planName: string) {
    if (voted !== null) return; // already voted
    setVoted(planName);
    setVotes(prev => ({ ...prev, [planName]: (prev[planName] ?? 0) + 1 }));

    await fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        experimentId,
        eventType: "pricing_vote",
        metadata: { planName },
      }),
    });
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-500">
          {voted
            ? `You voted for ${voted} · ${totalVotes} total vote${totalVotes !== 1 ? "s" : ""}`
            : "Which plan would you choose?"}
        </p>
        {totalVotes > 0 && !voted && (
          <span className="text-xs text-gray-400">{totalVotes} vote{totalVotes !== 1 ? "s" : ""} so far</span>
        )}
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 gap-3">
        {tiers.map((tier) => {
          const count = votes[tier.name] ?? 0;
          const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
          const isVoted = voted === tier.name;
          const isFree = parseFloat(tier.price) === 0;

          return (
            <button
              key={tier.name}
              onClick={() => handleVote(tier.name)}
              disabled={voted !== null}
              className={cn(
                "relative w-full text-left rounded-2xl border-2 p-4 transition-all overflow-hidden",
                voted !== null
                  ? isVoted
                    ? "border-purple-500 bg-purple-50"
                    : "border-gray-100 bg-white opacity-80 cursor-default"
                  : "border-gray-200 bg-white hover:border-purple-300 hover:shadow-sm cursor-pointer"
              )}
            >
              {/* Vote result background bar */}
              {voted !== null && totalVotes > 0 && (
                <div
                  className={cn(
                    "absolute inset-0 left-0 top-0 h-full rounded-2xl transition-all duration-500",
                    isVoted ? "bg-purple-100/60" : "bg-gray-50/80"
                  )}
                  style={{ width: `${pct}%` }}
                />
              )}

              <div className="relative flex items-center gap-4">
                {/* Plan info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">{tier.name}</span>
                    {isVoted && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-purple-600 text-white px-2 py-0.5 rounded-full">
                        <Check className="w-2.5 h-2.5" /> Your vote
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-extrabold text-gray-900 mt-0.5">
                    {isFree ? "Free" : `$${tier.price}`}
                    {!isFree && <span className="text-sm font-normal text-gray-400">/mo</span>}
                  </p>
                  {tier.description && (
                    <p className="text-xs text-gray-500 mt-1">{tier.description}</p>
                  )}
                  {tier.features && tier.features.length > 0 && (
                    <ul className="mt-2 space-y-0.5">
                      {tier.features.slice(0, 3).map((f) => (
                        <li key={f} className="flex items-center gap-1.5 text-xs text-gray-600">
                          <Check className="w-3 h-3 text-purple-500 shrink-0" /> {f}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Right side: button before vote, percentage after */}
                <div className="shrink-0 text-right">
                  {voted !== null ? (
                    <div>
                      <p className="text-2xl font-black text-gray-900">{pct}%</p>
                      <p className="text-xs text-gray-400">{count} vote{count !== 1 ? "s" : ""}</p>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-2 rounded-lg">
                      <ThumbsUp className="w-3.5 h-3.5" />
                      Vote
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
