// ── Negotiation Increment Curve Calculators ─────────────────────────────────
// Calculate the per-round increment based on the selected strategy curve.
// All amounts are in cents (integer arithmetic).

export type CurveType = "FLAT" | "DECREASING" | "FRONT_LOADED" | "BACK_LOADED"

/**
 * Calculate the increment for a specific round based on the curve type.
 *
 * @param curve - The increment curve strategy
 * @param baseIncrement - The base per-round increment in cents
 * @param roundNumber - Current round (1-indexed)
 * @param maxRounds - Maximum number of rounds
 * @returns The increment amount in cents for this round
 */
export function calculateRoundIncrement(
  curve: CurveType,
  baseIncrement: number,
  roundNumber: number,
  maxRounds: number
): number {
  if (roundNumber < 1 || roundNumber > maxRounds) return 0
  if (baseIncrement <= 0) return 0

  switch (curve) {
    case "FLAT":
      return flatCurve(baseIncrement)
    case "DECREASING":
      return decreasingCurve(baseIncrement, roundNumber, maxRounds)
    case "FRONT_LOADED":
      return frontLoadedCurve(baseIncrement, roundNumber, maxRounds)
    case "BACK_LOADED":
      return backLoadedCurve(baseIncrement, roundNumber, maxRounds)
    default:
      return flatCurve(baseIncrement)
  }
}

/**
 * FLAT: Same increment every round.
 * Round 1: $250, Round 2: $250, Round 3: $250, etc.
 */
function flatCurve(baseIncrement: number): number {
  return baseIncrement
}

/**
 * DECREASING: Each round's increment is smaller than the last.
 * Uses a linear decrease so the total budget is preserved.
 *
 * Example with base=$300, 5 rounds:
 *   Round 1: $500, Round 2: $400, Round 3: $300, Round 4: $200, Round 5: $100
 *
 * The total sum equals baseIncrement * maxRounds.
 */
function decreasingCurve(
  baseIncrement: number,
  roundNumber: number,
  maxRounds: number
): number {
  if (maxRounds === 1) return baseIncrement

  // Linear weights: maxRounds, maxRounds-1, ..., 1
  const totalWeight = (maxRounds * (maxRounds + 1)) / 2
  const totalBudget = baseIncrement * maxRounds
  const weight = maxRounds - roundNumber + 1
  return Math.round((weight / totalWeight) * totalBudget)
}

/**
 * FRONT_LOADED: Large first increment, then smaller consistent ones.
 * 50% of total budget in round 1, remainder split evenly.
 *
 * Example with base=$250, 5 rounds (total budget $1250):
 *   Round 1: $625, Rounds 2-5: ~$156 each
 */
function frontLoadedCurve(
  baseIncrement: number,
  roundNumber: number,
  maxRounds: number
): number {
  if (maxRounds === 1) return baseIncrement

  const totalBudget = baseIncrement * maxRounds
  const firstRoundShare = 0.5 // 50% in round 1

  if (roundNumber === 1) {
    return Math.round(totalBudget * firstRoundShare)
  }

  const remaining = totalBudget - Math.round(totalBudget * firstRoundShare)
  return Math.round(remaining / (maxRounds - 1))
}

/**
 * BACK_LOADED: Small early increments, large final increment.
 * Remaining rounds split 30% of budget evenly, last round gets 70%.
 * This creates urgency — "I'm really stretching to get you this number."
 *
 * Example with base=$250, 5 rounds (total budget $1250):
 *   Rounds 1-4: ~$94 each, Round 5: $875
 */
function backLoadedCurve(
  baseIncrement: number,
  roundNumber: number,
  maxRounds: number
): number {
  if (maxRounds === 1) return baseIncrement

  const totalBudget = baseIncrement * maxRounds
  const lastRoundShare = 0.5 // 50% in final round

  if (roundNumber === maxRounds) {
    return Math.round(totalBudget * lastRoundShare)
  }

  const earlyBudget = totalBudget - Math.round(totalBudget * lastRoundShare)
  return Math.round(earlyBudget / (maxRounds - 1))
}

/**
 * Get all increments for a full negotiation as a preview.
 */
export function previewCurve(
  curve: CurveType,
  baseIncrement: number,
  maxRounds: number
): Array<{ round: number; increment: number; cumulative: number }> {
  const rounds: Array<{ round: number; increment: number; cumulative: number }> = []
  let cumulative = 0

  for (let i = 1; i <= maxRounds; i++) {
    const increment = calculateRoundIncrement(curve, baseIncrement, i, maxRounds)
    cumulative += increment
    rounds.push({ round: i, increment, cumulative })
  }

  return rounds
}
