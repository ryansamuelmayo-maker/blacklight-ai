import Anthropic from "@anthropic-ai/sdk"
import { buildAxelSystemPrompt, type AxelSystemPromptParams } from "./prompts/axel-system"
import { buildReasoningTrace, type ReasoningTrace } from "./reasoning-trace"
import { detectPrimaryCompetitor } from "./competitor-detector"
import { checkGuardrails, type GuardrailResult } from "../negotiation/guardrails"
import { calculateRoundIncrement } from "../negotiation/strategy"

// ── Types ───────────────────────────────────────────────────────────────────

export interface AxelConversationMessage {
  role: "user" | "assistant"
  content: string
}

export interface AxelNegotiationState {
  negotiationId: string
  status: string
  anchorSource: string
  anchorAmount: number
  dealerCeiling: number
  openingOfferPercent: number
  perRoundIncrement: number
  incrementCurve: "FLAT" | "DECREASING" | "FRONT_LOADED" | "BACK_LOADED"
  maxRounds: number
  finalBump: number
  reconBuffer: number
  demandBonus: number
  mileageAdjustment: number
  categoryAdjustment: number
  currentRound: number
  currentOffer: number
  customerCounterOffer?: number
  competitorMentioned?: string
  competitorOfferAmount?: number
  hasApprovedCeilingOverride: boolean
  approvedOverrideAmount?: number
}

export interface AxelVehicleData {
  vehicleId: string
  year: number
  make: string
  model: string
  trim?: string
  vin?: string
  mileage?: number
  condition?: string
}

export interface AxelStrategyProfile {
  name: string
  vehicleCategory: string
  competitorResponseRules?: unknown[]
  escalationRules?: Record<string, unknown>
}

export interface AxelResponse {
  text: string
  aiReasoningTrace: ReasoningTrace
  toolResults: AxelToolResult[]
  /** The offer amount presented in this response, if any */
  offerPresented: number | null
  /** Whether a ceiling override was requested */
  ceilingOverrideRequested: boolean
}

export interface AxelToolResult {
  toolName: string
  input: Record<string, unknown>
  output: Record<string, unknown>
}

// ── Tool Definitions ────────────────────────────────────────────────────────

const AXEL_TOOLS: Anthropic.Messages.Tool[] = [
  {
    name: "calculate_offer",
    description:
      "Calculate the next offer amount based on the current round, strategy curve, and negotiation parameters. Returns the recommended offer amount.",
    input_schema: {
      type: "object" as const,
      properties: {
        roundNumber: {
          type: "number",
          description: "The round number to calculate for",
        },
        applyFinalBump: {
          type: "boolean",
          description: "Whether to apply the final bump (last resort offer)",
        },
      },
      required: ["roundNumber"],
    },
  },
  {
    name: "check_guardrails",
    description:
      "Check if a proposed offer amount is within the allowed ceiling and guardrails. MUST be called before presenting any offer.",
    input_schema: {
      type: "object" as const,
      properties: {
        proposedAmount: {
          type: "number",
          description: "The offer amount in cents to validate",
        },
        reason: {
          type: "string",
          description: "Why this amount is being proposed",
        },
      },
      required: ["proposedAmount"],
    },
  },
  {
    name: "request_manager_approval",
    description:
      "Request approval from a manager to exceed the ceiling or match a competitor offer. The conversation will pause until approval is received.",
    input_schema: {
      type: "object" as const,
      properties: {
        requestedAmount: {
          type: "number",
          description: "The amount being requested (in cents)",
        },
        currentCeiling: {
          type: "number",
          description: "The current ceiling amount (in cents)",
        },
        approvalType: {
          type: "string",
          enum: [
            "CEILING_OVERRIDE",
            "COMPETITOR_MATCH",
            "FINAL_BUMP_EXCEED",
            "MANUAL_REVIEW",
          ],
          description: "Type of approval needed",
        },
        reason: {
          type: "string",
          description: "Detailed justification for the approval request",
        },
      },
      required: ["requestedAmount", "currentCeiling", "approvalType", "reason"],
    },
  },
  {
    name: "detect_competitor",
    description:
      "Log a detected competitor mention from the customer's message.",
    input_schema: {
      type: "object" as const,
      properties: {
        competitorName: {
          type: "string",
          description: "Name of the competitor mentioned",
        },
        competitorOfferAmount: {
          type: "number",
          description: "Competitor's offer amount in cents (if stated)",
        },
        context: {
          type: "string",
          description: "Context of the mention",
        },
      },
      required: ["competitorName"],
    },
  },
  {
    name: "close_negotiation",
    description:
      "Close the negotiation with a final outcome.",
    input_schema: {
      type: "object" as const,
      properties: {
        outcome: {
          type: "string",
          enum: [
            "ACCEPTED",
            "DECLINED",
            "EXPIRED",
            "ESCALATED_TO_MANAGER",
            "COMPETITOR_WON",
          ],
          description: "Final outcome",
        },
        finalAmount: {
          type: "number",
          description: "Final agreed amount in cents (if accepted)",
        },
        notes: {
          type: "string",
          description: "Closing notes",
        },
      },
      required: ["outcome"],
    },
  },
  {
    name: "look_up_vehicle",
    description:
      "Look up additional vehicle data including market values and comparable sales.",
    input_schema: {
      type: "object" as const,
      properties: {
        vin: { type: "string", description: "VIN to look up" },
        year: { type: "number", description: "Vehicle year" },
        make: { type: "string", description: "Vehicle make" },
        model: { type: "string", description: "Vehicle model" },
        trim: { type: "string", description: "Vehicle trim" },
        mileage: { type: "number", description: "Current mileage" },
        dataSource: {
          type: "string",
          enum: ["KBB", "BLACK_BOOK", "NADA", "MARKET_COMPS"],
          description: "Data source to query",
        },
      },
      required: ["year", "make", "model"],
    },
  },
]

// ── Main Processing Function ────────────────────────────────────────────────

const client = new Anthropic()

const MODEL = "claude-sonnet-4-20250514"

export async function processAxelMessage(params: {
  conversationHistory: AxelConversationMessage[]
  latestCustomerMessage: string
  negotiationState: AxelNegotiationState
  vehicleData: AxelVehicleData
  strategyProfile: AxelStrategyProfile
  dealershipName: string
  channel: "SMS" | "EMAIL" | "WEBCHAT"
  customerFirstName: string
  customerLastName?: string
  customInstructions?: string
  onToolCall?: (toolName: string, input: Record<string, unknown>) => Promise<Record<string, unknown>>
}): Promise<AxelResponse> {
  const startTime = Date.now()
  const toolResults: AxelToolResult[] = []
  let offerPresented: number | null = null
  let ceilingOverrideRequested = false

  const neg = params.negotiationState

  // Build system prompt
  const systemPromptParams: AxelSystemPromptParams = {
    dealershipName: params.dealershipName,
    channel: params.channel,
    customerFirstName: params.customerFirstName,
    customerLastName: params.customerLastName,
    vehicleYear: params.vehicleData.year,
    vehicleMake: params.vehicleData.make,
    vehicleModel: params.vehicleData.model,
    vehicleTrim: params.vehicleData.trim,
    vehicleMileage: params.vehicleData.mileage,
    vehicleCondition: params.vehicleData.condition,
    vehicleVin: params.vehicleData.vin,
    anchorAmount: neg.anchorAmount,
    anchorSource: neg.anchorSource,
    dealerCeiling: neg.dealerCeiling,
    openingOfferPercent: neg.openingOfferPercent,
    perRoundIncrement: neg.perRoundIncrement,
    incrementCurve: neg.incrementCurve,
    maxRounds: neg.maxRounds,
    finalBump: neg.finalBump,
    reconBuffer: neg.reconBuffer,
    currentRound: neg.currentRound,
    currentOffer: neg.currentOffer,
    customerCounterOffer: neg.customerCounterOffer,
    competitorMentioned: neg.competitorMentioned,
    competitorOfferAmount: neg.competitorOfferAmount,
    strategyProfileName: params.strategyProfile.name,
    vehicleCategory: params.strategyProfile.vehicleCategory,
    competitorResponseRules: params.strategyProfile.competitorResponseRules,
    escalationRules: params.strategyProfile.escalationRules,
    hasApprovedCeilingOverride: neg.hasApprovedCeilingOverride,
    approvedOverrideAmount: neg.approvedOverrideAmount,
    customInstructions: params.customInstructions,
  }

  const systemPrompt = buildAxelSystemPrompt(systemPromptParams)

  // Build messages
  const messages: Anthropic.Messages.MessageParam[] = [
    ...params.conversationHistory.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    })),
    { role: "user", content: params.latestCustomerMessage },
  ]

  // Tool call loop
  let totalTokens = 0
  let currentMessages = messages
  let finalText = ""

  for (let iteration = 0; iteration < 10; iteration++) {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: currentMessages,
      tools: AXEL_TOOLS,
    })

    totalTokens += (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0)

    // Extract text
    const textBlocks = response.content.filter(
      (block): block is Anthropic.Messages.TextBlock => block.type === "text"
    )
    if (textBlocks.length > 0) {
      finalText = textBlocks.map((b) => b.text).join("")
    }

    // Check for tool use
    const toolUseBlocks = response.content.filter(
      (block): block is Anthropic.Messages.ToolUseBlock => block.type === "tool_use"
    )

    if (toolUseBlocks.length === 0 || response.stop_reason === "end_turn") {
      break
    }

    // Process tool calls
    const toolResultContents: Anthropic.Messages.ToolResultBlockParam[] = []

    for (const toolUse of toolUseBlocks) {
      const input = toolUse.input as Record<string, unknown>
      let toolOutput: Record<string, unknown>

      if (params.onToolCall) {
        toolOutput = await params.onToolCall(toolUse.name, input)
      } else {
        toolOutput = getDefaultAxelToolResponse(toolUse.name, input, neg)
      }

      // Track offers and ceiling override requests
      if (toolUse.name === "check_guardrails" && typeof input.proposedAmount === "number") {
        const guardrailResult = toolOutput as unknown as GuardrailResult
        if (guardrailResult.allowed) {
          offerPresented = input.proposedAmount as number
        }
      }
      if (toolUse.name === "request_manager_approval") {
        ceilingOverrideRequested = true
      }

      toolResults.push({
        toolName: toolUse.name,
        input,
        output: toolOutput,
      })

      toolResultContents.push({
        type: "tool_result",
        tool_use_id: toolUse.id,
        content: JSON.stringify(toolOutput),
      })
    }

    currentMessages = [
      ...currentMessages,
      { role: "assistant", content: response.content },
      { role: "user", content: toolResultContents },
    ]
  }

  // Detect competitors
  const competitor = detectPrimaryCompetitor(params.latestCustomerMessage)

  // Determine sentiment
  const sentiment = inferNegotiationSentiment(params.latestCustomerMessage)

  // Calculate ceiling utilization
  const effectiveCeiling = neg.hasApprovedCeilingOverride && neg.approvedOverrideAmount
    ? neg.approvedOverrideAmount
    : neg.dealerCeiling
  const ceilingUtilization = effectiveCeiling > 0
    ? Math.round((neg.currentOffer / effectiveCeiling) * 100)
    : 0

  const responseTimeMs = Date.now() - startTime

  // Active guardrails
  const guardrailsActive: string[] = ["ceiling_enforcement"]
  if (neg.currentRound >= neg.maxRounds) guardrailsActive.push("max_rounds_reached")
  if (competitor) guardrailsActive.push("competitor_detected")

  let guardrailStatus: "CLEAR" | "WARNING" | "BLOCKED" | "OVERRIDE_APPROVED" = "CLEAR"
  if (ceilingOverrideRequested) guardrailStatus = "BLOCKED"
  if (neg.hasApprovedCeilingOverride) guardrailStatus = "OVERRIDE_APPROVED"
  if (ceilingUtilization >= 90) guardrailStatus = "WARNING"

  const aiReasoningTrace = buildReasoningTrace({
    intentScore: 0, // Axel doesn't use intent scoring
    intentDelta: 0,
    intentSignals: [],
    strategy: `${neg.incrementCurve}_round_${neg.currentRound}`,
    sentiment,
    sentimentConfidence: 0.7,
    guardrailsActive,
    guardrailStatus,
    competitorDetected: competitor?.competitor ?? neg.competitorMentioned ?? null,
    competitorOfferAmount: competitor?.estimatedAmount ?? neg.competitorOfferAmount ?? null,
    modelUsed: MODEL,
    tokensUsed: totalTokens,
    responseTimeMs,
    negotiationRound: neg.currentRound,
    offerPresented: offerPresented ?? undefined,
    customerCounter: neg.customerCounterOffer ?? undefined,
    ceilingUtilization,
    ceilingOverrideRequested,
    incrementApplied: neg.currentRound > 0
      ? calculateRoundIncrement(neg.incrementCurve, neg.perRoundIncrement, neg.currentRound, neg.maxRounds)
      : 0,
  })

  return {
    text: finalText,
    aiReasoningTrace,
    toolResults,
    offerPresented,
    ceilingOverrideRequested,
  }
}

// ── Default Tool Responses ──────────────────────────────────────────────────

function getDefaultAxelToolResponse(
  toolName: string,
  input: Record<string, unknown>,
  neg: AxelNegotiationState
): Record<string, unknown> {
  switch (toolName) {
    case "calculate_offer": {
      const roundNumber = (input.roundNumber as number) || neg.currentRound + 1
      const applyFinalBump = input.applyFinalBump === true

      let baseOffer: number
      if (roundNumber === 1) {
        baseOffer = Math.round(neg.anchorAmount * neg.openingOfferPercent / 100)
      } else {
        const increment = calculateRoundIncrement(
          neg.incrementCurve,
          neg.perRoundIncrement,
          roundNumber,
          neg.maxRounds
        )
        baseOffer = neg.currentOffer + increment
      }

      if (applyFinalBump) {
        baseOffer += neg.finalBump
      }

      // Enforce ceiling
      const effectiveCeiling = neg.hasApprovedCeilingOverride && neg.approvedOverrideAmount
        ? neg.approvedOverrideAmount
        : neg.dealerCeiling

      const cappedOffer = Math.min(baseOffer, effectiveCeiling)

      return {
        success: true,
        calculatedOffer: cappedOffer,
        roundNumber,
        incrementApplied: cappedOffer - neg.currentOffer,
        percentOfCeiling: Math.round((cappedOffer / effectiveCeiling) * 100),
        cappedByCeiling: baseOffer > effectiveCeiling,
      }
    }

    case "check_guardrails": {
      const proposedAmount = input.proposedAmount as number
      const result = checkGuardrails(proposedAmount, {
        dealerCeiling: neg.dealerCeiling,
        hasApprovedOverride: neg.hasApprovedCeilingOverride,
        approvedOverrideAmount: neg.approvedOverrideAmount,
        currentRound: neg.currentRound,
        maxRounds: neg.maxRounds,
        finalBump: neg.finalBump,
        currentOffer: neg.currentOffer,
      })
      return result as unknown as Record<string, unknown>
    }

    case "request_manager_approval":
      return {
        success: true,
        status: "PENDING",
        message: "Approval request submitted to manager. Awaiting response.",
        requestId: `apr_${Date.now()}`,
      }

    case "detect_competitor":
      return {
        success: true,
        logged: true,
        competitor: input.competitorName,
        amount: input.competitorOfferAmount ?? null,
      }

    case "close_negotiation":
      return {
        success: true,
        outcome: input.outcome,
        finalAmount: input.finalAmount ?? null,
        negotiationId: neg.negotiationId,
      }

    case "look_up_vehicle":
      return {
        success: true,
        message: "Vehicle lookup completed",
        data: {
          year: input.year,
          make: input.make,
          model: input.model,
          estimatedValue: null,
          comparables: [],
        },
      }

    default:
      return { success: false, error: `Unknown tool: ${toolName}` }
  }
}

function inferNegotiationSentiment(
  message: string
): "POSITIVE" | "NEUTRAL" | "NEGATIVE" | "AGGRESSIVE" {
  const lower = message.toLowerCase()

  if (/\b(deal|accept|agree|works|sold|let'?s do it|sounds good|i'?ll take)\b/.test(lower)) {
    return "POSITIVE"
  }
  if (/\b(ridiculous|insult|joke|waste|lowball|rip\s*off|scam)\b/.test(lower)) {
    return "AGGRESSIVE"
  }
  if (/\b(too low|not enough|more than that|can'?t accept|no way|not fair|disappoint)\b/.test(lower)) {
    return "NEGATIVE"
  }
  if (/\b(think about|consider|maybe|let me|not sure|hmm)\b/.test(lower)) {
    return "NEUTRAL"
  }

  return "NEUTRAL"
}
