// Shared viability-scoring logic. Imported by both the API route
// (`app/api/analysis/route.ts`) and the client-side report renderer
// (`components/DeepAnalysis.tsx`) so server and client stay in sync.

export const AGENT_IDS = [
  "market_size",
  "competition",
  "timing",
  "monetization",
  "technical_difficulty",
  "regulation",
  "defensibility",
  "user_acquisition",
] as const;

export type AgentId = (typeof AGENT_IDS)[number];

// Weights must sum to 1.0.
// 2026-04 rebalance: regulation 0.10 → 0.05 (over-weighted for most B2C ideas),
// redistributed to market_size (+0.02) and monetization (+0.03).
export const VIABILITY_WEIGHTS: Record<AgentId, number> = {
  market_size: 0.22,
  competition: 0.15,
  regulation: 0.05,
  technical_difficulty: 0.15,
  monetization: 0.18,
  timing: 0.10,
  defensibility: 0.10,
  user_acquisition: 0.05,
};

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * Weighted Harmonic Mean — the weakest-link principle.
 *
 * Widely used: F-score (ML), P/E aggregation (finance), parallel resistance (EE),
 * average speed (physics). A low sub-score contributes a large reciprocal and
 * dominates the denominator, so a single weak axis pulls the composite down
 * sharply without any ad-hoc penalty.
 *
 *   H = 1 / Σ(w_i / x_i),   assuming Σw_i = 1.
 *
 * - scores are clamped to [1, 100] (0 would produce an infinite denominator)
 * - missing scores fall back to 50 (neutral)
 * - final result clamped to [5, 95]
 */
export function computeViabilityScore(
  agentScores: Record<string, number | null | undefined>
): number {
  let denom = 0;
  for (const id of AGENT_IDS) {
    const raw = agentScores[id];
    const score = typeof raw === "number" && Number.isFinite(raw) ? clamp(raw, 1, 100) : 50;
    denom += VIABILITY_WEIGHTS[id] / score;
  }
  const hm = 1 / denom;
  return clamp(Math.round(hm), 5, 95);
}
