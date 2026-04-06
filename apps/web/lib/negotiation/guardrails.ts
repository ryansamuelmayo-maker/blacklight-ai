// ── Ceiling Enforcement & Guardrails ────────────────────────────────────────
// Validates proposed offers against dealer ceiling and negotiation constraints.

export interface GuardrailInput {
  /** The absolute dealer ceiling (cents) */
  dealerCeiling: number
  /** Whether a ceiling override has been approved */
  hasApprovedOverride: boolean
  /** Approved override amount if any (cents) */
  approvedOverrideAmount?: number
  /** Current negotiation round (0-indexed or 1-indexed) */
  currentRound: number
  /** Maximum rounds allowed */
  maxRounds: number
  /** Final bump amount (cents) */
  finalBump: number
  /** Current standing offer (cents) */
  currentOffer: number
}

export interface GuardrailResult {
  /** Whether the proposed offer is allowed */
  allowed: boolean
  /** Human-readable reason */
  reason: string
  /** Whether manager approval is required before proceeding */
  requiresApproval: boolean
  /** The effective ceiling (including any approved override) */
  effectiveCeiling: number
  /** How much of the ceiling this offer would consume (percentage) */
  ceilingUtilization: number
  /** Warnings that don't block but should be noted */
  warnings: string[]
}

/**
 * Check whether a proposed offer amount passes all guardrails.
 *
 * Rules enforced:
 * 1. HARD CEILING: Offer must not exceed dealerCeiling (or approved override)
 * 2. ROUND LIMIT: Cannot exceed maxRounds
 * 3. MONOTONIC: Offer must be >= currentOffer (no decreasing offers)
 * 4. FINAL BUMP: Final bump can only be applied in the last round
 */
export function checkGuardrails(
  proposedAmount: number,
  state: GuardrailInput
): GuardrailResult {
  const warnings: string[] = []
  const effectiveCeiling = state.hasApprovedOverride && state.approvedOverrideAmount
    ? state.approvedOverrideAmount
    : state.dealerCeiling

  const ceilingUtilization = effectiveCeiling > 0
    ? Math.round((proposedAmount / effectiveCeiling) * 100)
    : 0

  // Rule 1: Hard ceiling enforcement
  if (proposedAmount > effectiveCeiling) {
    return {
      allowed: false,
      reason: `Proposed offer $${formatCents(proposedAmount)} exceeds the ${
        state.hasApprovedOverride ? "approved override ceiling" : "dealer ceiling"
      } of $${formatCents(effectiveCeiling)}. Manager approval required.`,
      requiresApproval: true,
      effectiveCeiling,
      ceilingUtilization,
      warnings,
    }
  }

  // Rule 2: Round limit check
  if (state.currentRound > state.maxRounds) {
    return {
      allowed: false,
      reason: `Maximum rounds (${state.maxRounds}) exceeded. Negotiation must be closed or escalated.`,
      requiresApproval: false,
      effectiveCeiling,
      ceilingUtilization,
      warnings,
    }
  }

  // Rule 3: Monotonic offers (no decreasing)
  if (proposedAmount < state.currentOffer) {
    return {
      allowed: false,
      reason: `Proposed offer $${formatCents(proposedAmount)} is less than current offer $${formatCents(state.currentOffer)}. Offers must not decrease.`,
      requiresApproval: false,
      effectiveCeiling,
      ceilingUtilization,
      warnings,
    }
  }

  // Warnings (non-blocking)
  if (ceilingUtilization >= 95) {
    warnings.push(
      `Offer is at ${ceilingUtilization}% of ceiling. Very little room remaining.`
    )
  } else if (ceilingUtilization >= 85) {
    warnings.push(
      `Offer is at ${ceilingUtilization}% of ceiling. Approaching limit.`
    )
  }

  // Check if this appears to include a final bump outside the last round
  const incrementFromCurrent = proposedAmount - state.currentOffer
  if (
    state.finalBump > 0 &&
    incrementFromCurrent >= state.finalBump &&
    state.currentRound < state.maxRounds
  ) {
    warnings.push(
      "This increment appears to include the final bump. Final bump should typically be reserved for the last round."
    )
  }

  // Check for unreasonably large single-round jump
  if (state.currentOffer > 0 && incrementFromCurrent > 0) {
    const jumpPercent = Math.round((incrementFromCurrent / state.currentOffer) * 100)
    if (jumpPercent > 15) {
      warnings.push(
        `Large single-round increase of ${jumpPercent}% ($${formatCents(incrementFromCurrent)}). Consider smaller increments to preserve negotiation leverage.`
      )
    }
  }

  return {
    allowed: true,
    reason: "Offer is within all guardrails.",
    requiresApproval: false,
    effectiveCeiling,
    ceilingUtilization,
    warnings,
  }
}

/**
 * Validate that a final bump is appropriate to apply.
 */
export function validateFinalBump(state: GuardrailInput): {
  canApply: boolean
  reason: string
} {
  if (state.finalBump <= 0) {
    return { canApply: false, reason: "No final bump configured for this negotiation." }
  }

  if (state.currentRound < state.maxRounds) {
    return {
      canApply: false,
      reason: `Final bump should only be applied in the last round (${state.maxRounds}). Current round: ${state.currentRound}.`,
    }
  }

  const offerWithBump = state.currentOffer + state.finalBump
  const effectiveCeiling = state.hasApprovedOverride && state.approvedOverrideAmount
    ? state.approvedOverrideAmount
    : state.dealerCeiling

  if (offerWithBump > effectiveCeiling) {
    return {
      canApply: false,
      reason: `Final bump would bring offer to $${formatCents(offerWithBump)}, exceeding ceiling of $${formatCents(effectiveCeiling)}. Request manager approval.`,
    }
  }

  return {
    canApply: true,
    reason: `Final bump of $${formatCents(state.finalBump)} is available. New offer would be $${formatCents(offerWithBump)}.`,
  }
}

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}
