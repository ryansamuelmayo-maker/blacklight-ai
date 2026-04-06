// ── AI Reasoning Trace ──────────────────────────────────────────────────────
// Structured JSON attached to every AI-generated message for auditability.

export interface IntentSignal {
  label: string
  delta: number
}

export interface ReasoningTrace {
  /** Current composite intent score (0-100) */
  intentScore: number
  /** Net intent score change from this message */
  intentDelta: number
  /** Array of detected intent signals */
  intentSignals: IntentSignal[]
  /** Strategy name or negotiation tactic used */
  strategy: string | null
  /** Detected customer sentiment */
  sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE" | "AGGRESSIVE"
  /** Confidence in sentiment classification (0.0 - 1.0) */
  sentimentConfidence: number
  /** Which guardrails are active for this response */
  guardrailsActive: string[]
  /** Overall guardrail status */
  guardrailStatus: "CLEAR" | "WARNING" | "BLOCKED" | "OVERRIDE_APPROVED"
  /** Detected competitor name, if any */
  competitorDetected: string | null
  /** Competitor offer amount, if mentioned */
  competitorOfferAmount: number | null
  /** Claude model version used */
  modelUsed: string
  /** Total tokens consumed (input + output) */
  tokensUsed: number
  /** Time from request to response in milliseconds */
  responseTimeMs: number

  // Negotiation-specific fields (Axel only)
  /** Current negotiation round */
  negotiationRound?: number
  /** Offer amount presented in this message */
  offerPresented?: number
  /** Customer's counter-offer if stated */
  customerCounter?: number
  /** Percent of ceiling used */
  ceilingUtilization?: number
  /** Whether ceiling override was requested */
  ceilingOverrideRequested?: boolean
  /** Increment applied this round */
  incrementApplied?: number
}

export interface BuildReasoningTraceParams {
  intentScore?: number
  intentDelta?: number
  intentSignals?: IntentSignal[]
  strategy?: string | null
  sentiment?: ReasoningTrace["sentiment"]
  sentimentConfidence?: number
  guardrailsActive?: string[]
  guardrailStatus?: ReasoningTrace["guardrailStatus"]
  competitorDetected?: string | null
  competitorOfferAmount?: number | null
  modelUsed: string
  tokensUsed: number
  responseTimeMs: number
  negotiationRound?: number
  offerPresented?: number
  customerCounter?: number
  ceilingUtilization?: number
  ceilingOverrideRequested?: boolean
  incrementApplied?: number
}

export function buildReasoningTrace(
  params: BuildReasoningTraceParams
): ReasoningTrace {
  const trace: ReasoningTrace = {
    intentScore: clampScore(params.intentScore ?? 0),
    intentDelta: params.intentDelta ?? 0,
    intentSignals: params.intentSignals ?? [],
    strategy: params.strategy ?? null,
    sentiment: params.sentiment ?? "NEUTRAL",
    sentimentConfidence: clampConfidence(params.sentimentConfidence ?? 0.5),
    guardrailsActive: params.guardrailsActive ?? [],
    guardrailStatus: params.guardrailStatus ?? "CLEAR",
    competitorDetected: params.competitorDetected ?? null,
    competitorOfferAmount: params.competitorOfferAmount ?? null,
    modelUsed: params.modelUsed,
    tokensUsed: params.tokensUsed,
    responseTimeMs: params.responseTimeMs,
  }

  // Attach negotiation fields only when present
  if (params.negotiationRound !== undefined) {
    trace.negotiationRound = params.negotiationRound
  }
  if (params.offerPresented !== undefined) {
    trace.offerPresented = params.offerPresented
  }
  if (params.customerCounter !== undefined) {
    trace.customerCounter = params.customerCounter
  }
  if (params.ceilingUtilization !== undefined) {
    trace.ceilingUtilization = params.ceilingUtilization
  }
  if (params.ceilingOverrideRequested !== undefined) {
    trace.ceilingOverrideRequested = params.ceilingOverrideRequested
  }
  if (params.incrementApplied !== undefined) {
    trace.incrementApplied = params.incrementApplied
  }

  return trace
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)))
}

function clampConfidence(confidence: number): number {
  return Math.max(0, Math.min(1, Math.round(confidence * 100) / 100))
}
