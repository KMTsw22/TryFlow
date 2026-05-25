// Shared viability-scoring logic. Imported by both the API route
// (`app/api/analysis/route.ts`) and the client-side report renderer
// (`components/DeepAnalysis.tsx`) so server and client stay in sync.
//
// 2026-04 refactor: 8 axes → 6 axes, grounded in primary VC sources
// (Sequoia BP template, a16z, Thiel 7 Questions, NFX, YC, Gompers et al. JFE 2020).
// See decisions/evaluation-axes-rationale.md for the full justification.
//
//   Removed: regulation (no primary-source support as standalone axis)
//   Absorbed: competition → defensibility (Thiel: "competition is for losers")
//   Absorbed: user_acquisition → business_model (unit economics includes CAC)
//   Renamed : technical_difficulty → product (now "10x solution", not build cost)
//   Renamed : monetization → business_model (now includes unit economics + GTM)
//   New     : problem_urgency (pain intensity — Graham "hair on fire", Sequoia "Problem")

export const AGENT_IDS = [
  "market_size",
  "problem_urgency",
  "timing",
  "product",
  "defensibility",
  "business_model",
] as const;

export type AgentId = (typeof AGENT_IDS)[number];

// Weights must sum to 1.0. Rationale per axis:
//   market_size    0.22 — Andreessen: "market matters most"
//   problem_urgency 0.18 — Graham/Blank: without pain, market is theoretical
//   product        0.18 — Thiel #1 (10x better) + Sequoia "Solution"
//   defensibility  0.17 — NFX + Thiel #6 (Durability)
//   business_model 0.15 — Sequoia + Bessemer (unit economics + GTM)
//   timing         0.10 — Sequoia "Why Now" + Thiel #2 (lower weight: binary-ish)
export const VIABILITY_WEIGHTS: Record<AgentId, number> = {
  market_size: 0.22,
  problem_urgency: 0.18,
  product: 0.18,
  defensibility: 0.17,
  business_model: 0.15,
  timing: 0.10,
};

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * Weighted arithmetic mean. Replaces the previous harmonic mean (2026-04).
 *
 * Why the change: harmonic mean over-penalized ideas with one weak axis,
 * producing composites that visually contradicted the radar chart (octagon
 * near-full, score ~40). Professor flagged this as a user-trust issue.
 *
 * The weakest-link signal is preserved via `findWeakAxes()` so the UI can
 * still surface vulnerable axes — just not via silent score deflation.
 *
 *   Score = Σ(w_i * x_i),   assuming Σw_i = 1.
 *
 * - scores are clamped to [1, 100]
 * - missing scores fall back to 50 (neutral)
 * - final result clamped to [5, 95]
 */
export function computeViabilityScore(
  agentScores: Record<string, number | null | undefined>
): number {
  let sum = 0;
  for (const id of AGENT_IDS) {
    const raw = agentScores[id];
    const score = typeof raw === "number" && Number.isFinite(raw) ? clamp(raw, 1, 100) : 50;
    sum += VIABILITY_WEIGHTS[id] * score;
  }
  return clamp(Math.round(sum), 5, 95);
}

/**
 * Returns axis IDs that score notably below the composite — the "weakest links"
 * for highlighting in the UI. An axis is weak if it scores >= 15 points under
 * the composite. Preserves the conjunctive-evaluation spirit (Thiel: "answer
 * all 7") without deflating the headline score.
 */
export function findWeakAxes(
  agentScores: Record<string, number | null | undefined>,
  composite: number
): AgentId[] {
  const threshold = composite - 15;
  const weak: AgentId[] = [];
  for (const id of AGENT_IDS) {
    const raw = agentScores[id];
    if (typeof raw !== "number" || !Number.isFinite(raw)) continue;
    if (raw < threshold) weak.push(id);
  }
  return weak;
}
