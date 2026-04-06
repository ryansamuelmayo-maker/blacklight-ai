// ── Maximum Allowable Offer (MAO) Calculator ────────────────────────────────
// Calculates the maximum a dealership should offer for a vehicle acquisition.
// All monetary values are in cents (integer arithmetic to avoid float errors).

export interface MaoInput {
  /** Base anchor amount from appraisal source (cents) */
  anchorAmount: number
  /** Estimated reconditioning cost to deduct (cents) */
  reconBuffer: number
  /** Bonus for high-demand vehicles (cents, can be 0) */
  demandBonus: number
  /** Mileage-based adjustment — positive for low miles, negative for high (cents) */
  mileageAdjustment: number
  /** Category-based adjustment — e.g., trucks command premium (cents) */
  categoryAdjustment: number
}

export interface MaoResult {
  /** The calculated Maximum Allowable Offer (cents) */
  mao: number
  /** Breakdown of each component */
  breakdown: MaoBreakdown
}

export interface MaoBreakdown {
  anchorAmount: number
  reconBuffer: number
  afterRecon: number
  demandBonus: number
  mileageAdjustment: number
  categoryAdjustment: number
  totalAdjustments: number
  finalMao: number
}

/**
 * Calculate the Maximum Allowable Offer for a vehicle acquisition.
 *
 * Formula:
 *   MAO = (Anchor - Recon Buffer) + Demand Bonus + Mileage Adjustment + Category Adjustment
 *
 * The result is floored at 0 — we never produce a negative MAO.
 */
export function calculateMao(input: MaoInput): MaoResult {
  const afterRecon = input.anchorAmount - input.reconBuffer

  const totalAdjustments =
    input.demandBonus + input.mileageAdjustment + input.categoryAdjustment

  const finalMao = Math.max(0, afterRecon + totalAdjustments)

  return {
    mao: finalMao,
    breakdown: {
      anchorAmount: input.anchorAmount,
      reconBuffer: input.reconBuffer,
      afterRecon,
      demandBonus: input.demandBonus,
      mileageAdjustment: input.mileageAdjustment,
      categoryAdjustment: input.categoryAdjustment,
      totalAdjustments,
      finalMao,
    },
  }
}

/**
 * Calculate a suggested dealer ceiling based on the MAO and a margin target.
 *
 * @param mao - Maximum Allowable Offer (cents)
 * @param targetMarginPercent - Target gross margin percentage (e.g., 15 for 15%)
 * @returns Suggested ceiling that preserves the target margin
 */
export function suggestCeiling(mao: number, targetMarginPercent: number): number {
  // Ceiling = MAO so that when we sell at retail, we achieve the margin
  // This is simply the MAO — the ceiling IS the max we'd pay
  // The margin comes from the difference between retail price and acquisition cost
  return mao
}

/**
 * Calculate the opening offer based on anchor and opening percentage.
 */
export function calculateOpeningOffer(
  anchorAmount: number,
  openingOfferPercent: number
): number {
  return Math.round(anchorAmount * (openingOfferPercent / 100))
}

/**
 * Calculate expected gross profit if we acquire at a given amount
 * and the estimated retail value.
 */
export function estimateGrossProfit(
  acquisitionCost: number,
  estimatedRetailValue: number,
  reconCost: number
): number {
  return estimatedRetailValue - acquisitionCost - reconCost
}
