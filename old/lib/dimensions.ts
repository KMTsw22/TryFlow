/**
 * Shared glossary for the 6 AI-analysis dimensions.
 * Used by compare page radar, IdeaHero radar, and deep-analysis cards
 * so every surface explains the same thing the same way.
 *
 * Keys match the analysis JSON (agent IDs from the multi-agent orchestrator).
 * 2026-04 refactor: 8 axes → 6 axes. See decisions/evaluation-axes-rationale.md.
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
    full: "Market Size & Quality",
    description:
      "How big the addressable market is and whether it has the shape VCs want — large spend pools, growing, and with a beachhead you can dominate first.",
    highMeans: "Large, well-defined market with a winnable beachhead and room to expand.",
  },
  problem_urgency: {
    short: "Problem",
    full: "Problem & Urgency",
    description:
      "How painful and frequent the problem is for the target user — the 'hair on fire' test. A big market with mild pain still fails.",
    highMeans: "Acute, frequent pain users will pay to stop right now.",
  },
  timing: {
    short: "Timing",
    full: "Why Now / Timing",
    description:
      "Why this moment is right. Looks at tech enablers, regulatory shifts, behavior changes, and the forcing functions that open the window.",
    highMeans: "A real inflection — couldn't be built 3 years ago, shouldn't wait 3 more.",
  },
  product: {
    short: "Product",
    full: "Product (10x Solution)",
    description:
      "Whether the solution is meaningfully better than alternatives — ideally 10x on the dimension users care most about, not incremental polish.",
    highMeans: "Dramatically better than the status quo on a metric users actually rank by.",
  },
  defensibility: {
    short: "Moat",
    full: "Moat & Defensibility",
    description:
      "How hard it is for a competitor to catch up once you prove the market. Looks at network effects, switching costs, data advantages, and competitive intensity.",
    highMeans: "Durable advantages (network effects, data, switching costs) that compound with scale.",
  },
  business_model: {
    short: "Model",
    full: "Business Model & Unit Economics",
    description:
      "How value is captured. Evaluates pricing power, unit economics (CAC vs LTV potential), margin structure, scalability, and the path to distribution.",
    highMeans: "Scalable economics — healthy margins, a viable CAC/LTV story, and a clear GTM channel.",
  },
};

/** Lookup by short label (e.g. "Market"), used by chart tick components. */
export function getDimensionByShortLabel(short: string): DimensionMeta | null {
  for (const meta of Object.values(DIMENSION_META)) {
    if (meta.short === short) return meta;
  }
  return null;
}
