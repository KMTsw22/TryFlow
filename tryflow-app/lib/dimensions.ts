/**
 * Shared glossary for the 8 AI-analysis dimensions.
 * Used by compare page radar, IdeaHero radar, and deep-analysis cards
 * so every surface explains the same thing the same way.
 *
 * Keys match the analysis JSON (agent IDs from the multi-agent orchestrator).
 */

export interface DimensionMeta {
  /** Short label used on charts (~8 chars). */
  short: string;
  /** Full name used in headings. */
  full: string;
  /** 1-sentence explanation for tooltips / hover cards. */
  description: string;
  /** What a high score means (the win condition). */
  highMeans: string;
}

export const DIMENSION_META: Record<string, DimensionMeta> = {
  market_size: {
    short: "Market",
    full: "Market Size",
    description:
      "How big the addressable market is. Considers total potential users, buyer segments, and spend pools.",
    highMeans: "Large, well-defined market with room to grow.",
  },
  competition: {
    short: "Competition",
    full: "Competition",
    description:
      "The intensity and shape of the competitive landscape — who else is playing here and how entrenched they are.",
    highMeans: "Weak or fragmented competition, or a real gap you can own.",
  },
  timing: {
    short: "Timing",
    full: "Market Timing",
    description:
      "Whether the market is ready now. Looks at tech enablers, buyer readiness, and forcing functions.",
    highMeans: "Right moment — demand is real and the window is open.",
  },
  monetization: {
    short: "Revenue",
    full: "Monetization",
    description:
      "How you'll make money. Evaluates pricing power, willingness to pay, and unit-economics potential.",
    highMeans: "Clear path to revenue with healthy margins.",
  },
  technical_difficulty: {
    short: "Technical",
    full: "Technical Difficulty",
    description:
      "Build complexity and technical risk. Considers MVP effort, integration difficulty, and engineering depth needed.",
    highMeans: "Feasible to build — or hard enough to deter copycats.",
  },
  regulation: {
    short: "Regulation",
    full: "Regulation",
    description:
      "Legal and compliance burden. Includes industry rules, data privacy, licensing, and policy risk.",
    highMeans: "Low regulatory friction — you can ship without a legal team.",
  },
  defensibility: {
    short: "Moat",
    full: "Defensibility",
    description:
      "How hard it is for a competitor to copy you once you've proven the market. Looks at moats, switching costs, and network effects.",
    highMeans: "Durable advantages that compound as you grow.",
  },
  user_acquisition: {
    short: "Acquisition",
    full: "User Acquisition",
    description:
      "How efficiently you can reach and convert your target user. Considers channels, CAC, and virality potential.",
    highMeans: "Clear, low-cost path to your first 1,000 users.",
  },
};

/** Lookup by short label (e.g. "Market"), used by chart tick components. */
export function getDimensionByShortLabel(short: string): DimensionMeta | null {
  for (const meta of Object.values(DIMENSION_META)) {
    if (meta.short === short) return meta;
  }
  return null;
}
