// ── Negotiation State Machine ────────────────────────────────────────────────
// Manages the lifecycle of vehicle acquisition negotiations.
// States: CONFIGURING -> ACTIVE -> (rounds) -> CLOSED / ESCALATED

import { calculateRoundIncrement, type CurveType } from "./strategy"
import { calculateMao, type MaoInput } from "./mao-calculator"
import { checkGuardrails, validateFinalBump, type GuardrailInput } from "./guardrails"

// ── Types ───────────────────────────────────────────────────────────────────

export type NegotiationStatus =
  | "CONFIGURING"
  | "ACTIVE"
  | "PENDING_APPROVAL"
  | "CLOSED_WON"
  | "CLOSED_LOST"
  | "EXPIRED"
  | "ESCALATED"

export type ClosedReason =
  | "ACCEPTED"
  | "DECLINED"
  | "EXPIRED"
  | "ESCALATED_TO_MANAGER"
  | "COMPETITOR_WON"

export interface NegotiationConfig {
  negotiationId: string
  leadId: string
  vehicleId: string
  dealershipId: string
  strategyProfileId: string

  anchorSource: string
  anchorAmount: number
  openingOfferPercent: number
  perRoundIncrement: number
  incrementCurve: CurveType
  maxRounds: number
  finalBump: number

  // MAO components
  reconBuffer: number
  demandBonus: number
  mileageAdjustment: number
  categoryAdjustment: number
}

export interface NegotiationState {
  status: NegotiationStatus
  dealerCeiling: number
  currentRound: number
  currentOffer: number
  customerCounterOffer: number | null
  competitorMentioned: string | null
  competitorOfferAmount: number | null
  finalOffer: number | null
  closedAt: Date | null
  closedReason: ClosedReason | null
  grossProfit: number | null
  guardianSavings: number | null
  rounds: RoundRecord[]

  // Override state
  hasApprovedOverride: boolean
  approvedOverrideAmount: number | null
}

export interface RoundRecord {
  roundNumber: number
  offerAmount: number
  incrementApplied: number
  percentOfCeiling: number
  customerResponse: string | null
  customerSentiment: string | null
  competitorDetected: boolean
  timestamp: Date
}

export interface ProcessRoundResult {
  newOffer: number
  incrementApplied: number
  roundNumber: number
  percentOfCeiling: number
  guardrailResult: {
    allowed: boolean
    reason: string
    requiresApproval: boolean
    warnings: string[]
  }
}

// ── State Machine Functions ─────────────────────────────────────────────────

/**
 * Initialize a new negotiation from configuration.
 * Calculates the MAO (dealer ceiling) and opening offer.
 */
export function initializeNegotiation(config: NegotiationConfig): NegotiationState {
  // Calculate MAO which becomes the dealer ceiling
  const maoInput: MaoInput = {
    anchorAmount: config.anchorAmount,
    reconBuffer: config.reconBuffer,
    demandBonus: config.demandBonus,
    mileageAdjustment: config.mileageAdjustment,
    categoryAdjustment: config.categoryAdjustment,
  }
  const maoResult = calculateMao(maoInput)

  // Opening offer
  const openingOffer = Math.round(
    config.anchorAmount * (config.openingOfferPercent / 100)
  )

  return {
    status: "ACTIVE",
    dealerCeiling: maoResult.mao,
    currentRound: 1,
    currentOffer: openingOffer,
    customerCounterOffer: null,
    competitorMentioned: null,
    competitorOfferAmount: null,
    finalOffer: null,
    closedAt: null,
    closedReason: null,
    grossProfit: null,
    guardianSavings: null,
    rounds: [
      {
        roundNumber: 1,
        offerAmount: openingOffer,
        incrementApplied: 0,
        percentOfCeiling: maoResult.mao > 0
          ? Math.round((openingOffer / maoResult.mao) * 100)
          : 0,
        customerResponse: null,
        customerSentiment: null,
        competitorDetected: false,
        timestamp: new Date(),
      },
    ],
    hasApprovedOverride: false,
    approvedOverrideAmount: null,
  }
}

/**
 * Process the next round of negotiation.
 * Calculates the new offer based on the curve and validates against guardrails.
 */
export function processRound(
  state: NegotiationState,
  config: NegotiationConfig,
  customerCounter?: number,
  customerResponse?: string,
  customerSentiment?: string,
  competitorDetected?: boolean
): ProcessRoundResult {
  const nextRound = state.currentRound + 1

  // Record the customer's counter on the current round
  if (customerCounter !== undefined) {
    state.customerCounterOffer = customerCounter
    // Update the current round record
    const currentRoundRecord = state.rounds[state.rounds.length - 1]
    if (currentRoundRecord) {
      currentRoundRecord.customerResponse = customerResponse ?? null
      currentRoundRecord.customerSentiment = customerSentiment ?? null
      currentRoundRecord.competitorDetected = competitorDetected ?? false
    }
  }

  // Calculate the increment for this round
  const increment = calculateRoundIncrement(
    config.incrementCurve,
    config.perRoundIncrement,
    nextRound,
    config.maxRounds
  )

  const proposedOffer = state.currentOffer + increment

  // Check guardrails
  const guardrailInput: GuardrailInput = {
    dealerCeiling: state.dealerCeiling,
    hasApprovedOverride: state.hasApprovedOverride,
    approvedOverrideAmount: state.approvedOverrideAmount ?? undefined,
    currentRound: nextRound,
    maxRounds: config.maxRounds,
    finalBump: config.finalBump,
    currentOffer: state.currentOffer,
  }

  const guardrailResult = checkGuardrails(proposedOffer, guardrailInput)

  // Cap the offer at the effective ceiling if needed
  const effectiveCeiling = state.hasApprovedOverride && state.approvedOverrideAmount
    ? state.approvedOverrideAmount
    : state.dealerCeiling
  const newOffer = guardrailResult.allowed
    ? proposedOffer
    : Math.min(proposedOffer, effectiveCeiling)

  const actualIncrement = newOffer - state.currentOffer
  const percentOfCeiling = effectiveCeiling > 0
    ? Math.round((newOffer / effectiveCeiling) * 100)
    : 0

  // Update state if the offer is allowed
  if (guardrailResult.allowed) {
    state.currentRound = nextRound
    state.currentOffer = newOffer

    state.rounds.push({
      roundNumber: nextRound,
      offerAmount: newOffer,
      incrementApplied: actualIncrement,
      percentOfCeiling,
      customerResponse: null,
      customerSentiment: null,
      competitorDetected: false,
      timestamp: new Date(),
    })
  } else if (guardrailResult.requiresApproval) {
    state.status = "PENDING_APPROVAL"
  }

  return {
    newOffer: guardrailResult.allowed ? newOffer : state.currentOffer,
    incrementApplied: actualIncrement,
    roundNumber: nextRound,
    percentOfCeiling,
    guardrailResult: {
      allowed: guardrailResult.allowed,
      reason: guardrailResult.reason,
      requiresApproval: guardrailResult.requiresApproval,
      warnings: guardrailResult.warnings,
    },
  }
}

/**
 * Apply the final bump as a last-resort offer.
 */
export function applyFinalBump(
  state: NegotiationState,
  config: NegotiationConfig
): ProcessRoundResult {
  const guardrailInput: GuardrailInput = {
    dealerCeiling: state.dealerCeiling,
    hasApprovedOverride: state.hasApprovedOverride,
    approvedOverrideAmount: state.approvedOverrideAmount ?? undefined,
    currentRound: state.currentRound,
    maxRounds: config.maxRounds,
    finalBump: config.finalBump,
    currentOffer: state.currentOffer,
  }

  const bumpCheck = validateFinalBump(guardrailInput)

  if (!bumpCheck.canApply) {
    return {
      newOffer: state.currentOffer,
      incrementApplied: 0,
      roundNumber: state.currentRound,
      percentOfCeiling: state.dealerCeiling > 0
        ? Math.round((state.currentOffer / state.dealerCeiling) * 100)
        : 0,
      guardrailResult: {
        allowed: false,
        reason: bumpCheck.reason,
        requiresApproval: false,
        warnings: [],
      },
    }
  }

  const newOffer = state.currentOffer + config.finalBump
  const effectiveCeiling = state.hasApprovedOverride && state.approvedOverrideAmount
    ? state.approvedOverrideAmount
    : state.dealerCeiling
  const percentOfCeiling = effectiveCeiling > 0
    ? Math.round((newOffer / effectiveCeiling) * 100)
    : 0

  state.currentOffer = newOffer
  state.finalOffer = newOffer

  // Update the last round record
  const lastRound = state.rounds[state.rounds.length - 1]
  if (lastRound) {
    lastRound.offerAmount = newOffer
    lastRound.incrementApplied += config.finalBump
    lastRound.percentOfCeiling = percentOfCeiling
  }

  return {
    newOffer,
    incrementApplied: config.finalBump,
    roundNumber: state.currentRound,
    percentOfCeiling,
    guardrailResult: {
      allowed: true,
      reason: bumpCheck.reason,
      requiresApproval: false,
      warnings: [],
    },
  }
}

/**
 * Close the negotiation with a final outcome.
 */
export function closeNegotiation(
  state: NegotiationState,
  reason: ClosedReason,
  finalAmount?: number
): NegotiationState {
  const now = new Date()

  switch (reason) {
    case "ACCEPTED":
      state.status = "CLOSED_WON"
      state.finalOffer = finalAmount ?? state.currentOffer
      state.grossProfit = state.dealerCeiling - (finalAmount ?? state.currentOffer)
      state.guardianSavings = state.dealerCeiling - (finalAmount ?? state.currentOffer)
      break

    case "DECLINED":
    case "EXPIRED":
    case "COMPETITOR_WON":
      state.status = "CLOSED_LOST"
      break

    case "ESCALATED_TO_MANAGER":
      state.status = "ESCALATED"
      break
  }

  state.closedAt = now
  state.closedReason = reason

  return state
}

/**
 * Apply an approved ceiling override.
 */
export function applyOverride(
  state: NegotiationState,
  approvedAmount: number
): NegotiationState {
  state.hasApprovedOverride = true
  state.approvedOverrideAmount = approvedAmount

  // If we were pending approval, return to active
  if (state.status === "PENDING_APPROVAL") {
    state.status = "ACTIVE"
  }

  return state
}
