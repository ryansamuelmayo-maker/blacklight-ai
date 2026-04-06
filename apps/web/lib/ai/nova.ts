import Anthropic from "@anthropic-ai/sdk"
import { buildNovaSystemPrompt, type NovaSystemPromptParams } from "./prompts/nova-system"
import { buildReasoningTrace, type ReasoningTrace } from "./reasoning-trace"
import { analyzeMessage } from "./intent-scorer"
import { detectPrimaryCompetitor } from "./competitor-detector"

// ── Types ───────────────────────────────────────────────────────────────────

export interface NovaConversationMessage {
  role: "user" | "assistant"
  content: string
}

export interface NovaLeadData {
  leadId: string
  firstName: string
  lastName?: string
  email?: string
  phone?: string
  source?: string
  currentIntentScore?: number
  vehicleOfInterest?: {
    year: number
    make: string
    model: string
    trim?: string
  }
}

export interface NovaDealershipConfig {
  dealershipName: string
  dealershipPhone?: string
  dealershipAddress?: string
  dealershipWebsite?: string
  businessHours: string
  timezone: string
  channel: "SMS" | "EMAIL" | "WEBCHAT"
  specialOffers?: string
  inventoryNotes?: string
  customInstructions?: string
}

export interface NovaResponse {
  text: string
  aiReasoningTrace: ReasoningTrace
  toolResults: NovaToolResult[]
}

export interface NovaToolResult {
  toolName: string
  input: Record<string, unknown>
  output: Record<string, unknown>
}

// ── Tool Definitions ────────────────────────────────────────────────────────

const NOVA_TOOLS: Anthropic.Messages.Tool[] = [
  {
    name: "qualify_lead",
    description:
      "Update the lead's qualification data based on information gathered during conversation.",
    input_schema: {
      type: "object" as const,
      properties: {
        leadType: {
          type: "string",
          enum: ["BUYER", "SELLER", "BOTH"],
          description: "What the customer is looking to do",
        },
        timeline: {
          type: "string",
          description:
            "When the customer is looking to buy/sell (e.g., 'this week', 'within 30 days')",
        },
        budgetMin: {
          type: "number",
          description: "Minimum budget in dollars (if mentioned)",
        },
        budgetMax: {
          type: "number",
          description: "Maximum budget in dollars (if mentioned)",
        },
        hasTradeIn: {
          type: "boolean",
          description: "Whether the customer has a vehicle to trade in",
        },
        notes: {
          type: "string",
          description: "Additional qualification notes",
        },
      },
      required: ["leadType"],
    },
  },
  {
    name: "schedule_appointment",
    description:
      "Book an appointment for the customer to visit the dealership.",
    input_schema: {
      type: "object" as const,
      properties: {
        date: {
          type: "string",
          description: "Appointment date in ISO format (YYYY-MM-DD)",
        },
        time: {
          type: "string",
          description: "Appointment time (e.g., '2:00 PM')",
        },
        type: {
          type: "string",
          enum: ["TEST_DRIVE", "CONSULTATION", "TRADE_APPRAISAL", "GENERAL"],
          description: "Type of appointment",
        },
        notes: {
          type: "string",
          description: "Additional appointment notes",
        },
      },
      required: ["date", "time", "type"],
    },
  },
  {
    name: "capture_trade_in",
    description:
      "Record details about the customer's trade-in vehicle.",
    input_schema: {
      type: "object" as const,
      properties: {
        year: { type: "number", description: "Vehicle year" },
        make: { type: "string", description: "Vehicle make" },
        model: { type: "string", description: "Vehicle model" },
        trim: { type: "string", description: "Vehicle trim" },
        mileage: { type: "number", description: "Current mileage" },
        condition: {
          type: "string",
          enum: ["EXCELLENT", "GOOD", "FAIR", "POOR"],
          description: "Overall condition",
        },
        notes: { type: "string", description: "Additional notes about condition" },
      },
      required: ["year", "make", "model"],
    },
  },
  {
    name: "escalate_to_human",
    description:
      "Transfer the conversation to a human sales agent. Use when the customer requests it, or when escalation triggers are met.",
    input_schema: {
      type: "object" as const,
      properties: {
        reason: {
          type: "string",
          description: "Reason for escalation",
        },
        urgency: {
          type: "string",
          enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
          description: "How urgently a human needs to respond",
        },
        summary: {
          type: "string",
          description: "Brief summary of conversation for the human agent",
        },
      },
      required: ["reason", "urgency"],
    },
  },
  {
    name: "update_intent_score",
    description:
      "Record a detected intent signal and its score impact.",
    input_schema: {
      type: "object" as const,
      properties: {
        signal: {
          type: "string",
          description: "Name of the detected intent signal",
        },
        delta: {
          type: "number",
          description: "Score change (positive or negative)",
        },
        reason: {
          type: "string",
          description: "Why this signal was detected",
        },
      },
      required: ["signal", "delta"],
    },
  },
  {
    name: "check_inventory",
    description:
      "Search the dealership's inventory for vehicles matching criteria.",
    input_schema: {
      type: "object" as const,
      properties: {
        make: { type: "string", description: "Vehicle make" },
        model: { type: "string", description: "Vehicle model" },
        yearMin: { type: "number", description: "Minimum year" },
        yearMax: { type: "number", description: "Maximum year" },
        priceMax: { type: "number", description: "Maximum price in dollars" },
        bodyStyle: { type: "string", description: "Body style (sedan, SUV, truck, etc.)" },
        features: {
          type: "array",
          items: { type: "string" },
          description: "Desired features",
        },
      },
      required: [],
    },
  },
]

// ── Main Processing Function ────────────────────────────────────────────────

const client = new Anthropic()

const MODEL = "claude-sonnet-4-20250514"

export async function processNovaMessage(params: {
  conversationHistory: NovaConversationMessage[]
  latestCustomerMessage: string
  leadData: NovaLeadData
  dealershipConfig: NovaDealershipConfig
  onToolCall?: (toolName: string, input: Record<string, unknown>) => Promise<Record<string, unknown>>
}): Promise<NovaResponse> {
  const startTime = Date.now()
  const toolResults: NovaToolResult[] = []

  // Build the system prompt
  const systemPromptParams: NovaSystemPromptParams = {
    dealershipName: params.dealershipConfig.dealershipName,
    dealershipPhone: params.dealershipConfig.dealershipPhone,
    dealershipAddress: params.dealershipConfig.dealershipAddress,
    dealershipWebsite: params.dealershipConfig.dealershipWebsite,
    businessHours: params.dealershipConfig.businessHours,
    timezone: params.dealershipConfig.timezone,
    channel: params.dealershipConfig.channel,
    customerFirstName: params.leadData.firstName,
    customerLastName: params.leadData.lastName,
    leadSource: params.leadData.source,
    currentIntentScore: params.leadData.currentIntentScore,
    vehicleOfInterest: params.leadData.vehicleOfInterest,
    specialOffers: params.dealershipConfig.specialOffers,
    inventoryNotes: params.dealershipConfig.inventoryNotes,
    customInstructions: params.dealershipConfig.customInstructions,
  }

  const systemPrompt = buildNovaSystemPrompt(systemPromptParams)

  // Build messages array
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
      tools: NOVA_TOOLS,
    })

    totalTokens += (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0)

    // Extract text blocks
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
      let toolOutput: Record<string, unknown>

      if (params.onToolCall) {
        toolOutput = await params.onToolCall(
          toolUse.name,
          toolUse.input as Record<string, unknown>
        )
      } else {
        // Default tool responses
        toolOutput = getDefaultToolResponse(toolUse.name, toolUse.input as Record<string, unknown>)
      }

      toolResults.push({
        toolName: toolUse.name,
        input: toolUse.input as Record<string, unknown>,
        output: toolOutput,
      })

      toolResultContents.push({
        type: "tool_result",
        tool_use_id: toolUse.id,
        content: JSON.stringify(toolOutput),
      })
    }

    // Append assistant message + tool results for next iteration
    currentMessages = [
      ...currentMessages,
      { role: "assistant", content: response.content },
      { role: "user", content: toolResultContents },
    ]
  }

  // Analyze the customer message for intent scoring
  const intentResult = analyzeMessage(params.latestCustomerMessage, {
    previousScore: params.leadData.currentIntentScore,
  })

  // Detect competitors
  const competitor = detectPrimaryCompetitor(params.latestCustomerMessage)

  const responseTimeMs = Date.now() - startTime

  // Build reasoning trace
  const aiReasoningTrace = buildReasoningTrace({
    intentScore: intentResult.compositeScore,
    intentDelta: intentResult.totalDelta,
    intentSignals: intentResult.signals.map((s) => ({
      label: s.label,
      delta: s.delta,
    })),
    strategy: "nova_engagement",
    sentiment: inferSentiment(params.latestCustomerMessage),
    sentimentConfidence: 0.75,
    guardrailsActive: ["no_exact_pricing", "compliance"],
    guardrailStatus: "CLEAR",
    competitorDetected: competitor?.competitor ?? null,
    competitorOfferAmount: competitor?.estimatedAmount ?? null,
    modelUsed: MODEL,
    tokensUsed: totalTokens,
    responseTimeMs,
  })

  return {
    text: finalText,
    aiReasoningTrace,
    toolResults,
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function getDefaultToolResponse(
  toolName: string,
  input: Record<string, unknown>
): Record<string, unknown> {
  switch (toolName) {
    case "qualify_lead":
      return { success: true, message: "Lead qualification updated" }
    case "schedule_appointment":
      return {
        success: true,
        appointmentId: `apt_${Date.now()}`,
        confirmed: true,
        message: `Appointment scheduled for ${input.date} at ${input.time}`,
      }
    case "capture_trade_in":
      return {
        success: true,
        message: `Trade-in recorded: ${input.year} ${input.make} ${input.model}`,
      }
    case "escalate_to_human":
      return {
        success: true,
        message: "Conversation escalated to human agent",
        estimatedResponseTime: "5 minutes",
      }
    case "update_intent_score":
      return {
        success: true,
        signal: input.signal,
        delta: input.delta,
      }
    case "check_inventory":
      return {
        success: true,
        results: [],
        message: "Inventory search completed",
      }
    default:
      return { success: false, error: `Unknown tool: ${toolName}` }
  }
}

function inferSentiment(
  message: string
): "POSITIVE" | "NEUTRAL" | "NEGATIVE" | "AGGRESSIVE" {
  const lower = message.toLowerCase()

  const aggressivePatterns = [
    /\b(scam|rip\s*off|waste|terrible|horrible|worst|fraud|liar)\b/,
    /\b(f+u+c+k|s+h+i+t|damn|hell|ass)\b/,
    /!!{2,}/,
  ]
  for (const p of aggressivePatterns) {
    if (p.test(lower)) return "AGGRESSIVE"
  }

  const negativePatterns = [
    /\b(disappointed|frustrated|upset|unhappy|annoyed|ridiculous|unacceptable)\b/,
    /\b(too (high|much|expensive)|overpriced|not worth)\b/,
    /\b(no thanks|not interested|don't want|won't|can't)\b/,
  ]
  for (const p of negativePatterns) {
    if (p.test(lower)) return "NEGATIVE"
  }

  const positivePatterns = [
    /\b(thanks|thank you|great|awesome|perfect|excellent|love|excited|interested|sounds good)\b/,
    /\b(yes|yeah|yep|sure|absolutely|definitely)\b/,
    /\b(looking forward|can't wait)\b/,
  ]
  for (const p of positivePatterns) {
    if (p.test(lower)) return "POSITIVE"
  }

  return "NEUTRAL"
}
