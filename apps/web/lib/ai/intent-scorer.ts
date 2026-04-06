// ── Intent Scoring Engine ────────────────────────────────────────────────────
// Analyzes customer messages for buying/selling intent signals.

export interface IntentSignal {
  label: string
  delta: number
  matched: string // the text snippet that triggered this signal
}

export interface IntentScoreResult {
  signals: IntentSignal[]
  totalDelta: number
  compositeScore: number // clamped 0-100
}

// ── Signal Patterns ─────────────────────────────────────────────────────────

interface SignalPattern {
  label: string
  delta: number
  patterns: RegExp[]
}

const POSITIVE_SIGNALS: SignalPattern[] = [
  {
    label: "specific_vehicle_mention",
    delta: 20,
    patterns: [
      /\b(20\d{2})\s+([\w-]+)\s+([\w-]+)/i, // "2024 Toyota Camry"
      /\b(camry|accord|f-?150|silverado|rav4|cr-?v|civic|corolla|tacoma|wrangler|mustang|bronco|explorer|highlander|4runner|tundra|sierra|ram\s?\d{4}|telluride|palisade|tucson|outback|forester|mazda\s?cx-?\d|model\s?[3yxs])\b/i,
    ],
  },
  {
    label: "timeline_mention",
    delta: 15,
    patterns: [
      /\b(this week|this weekend|this month|next week|next month|asap|as soon as possible|right away|immediately|today|tomorrow|soon|ready to)\b/i,
      /\b(looking to buy|need a car|want to purchase|in the market)\b/i,
    ],
  },
  {
    label: "financing_question",
    delta: 15,
    patterns: [
      /\b(financ|monthly payment|apr|interest rate|credit|down payment|lease|loan|pre-?approv)\w*/i,
      /\bhow much.{0,15}(per month|monthly|payment)/i,
      /\bcan I (afford|finance|get approved)/i,
    ],
  },
  {
    label: "trade_in_mention",
    delta: 10,
    patterns: [
      /\b(trade.?in|trading in|trade my|trade the|what.{0,10}(worth|get for)|payoff|pay off|owe on)\b/i,
      /\b(current (car|vehicle|truck|suv))\b/i,
    ],
  },
  {
    label: "test_drive_request",
    delta: 20,
    patterns: [
      /\b(test drive|test-?drive|come (in|by|see|look)|visit|stop by|drive it|see it in person|come check)\b/i,
      /\bwhen (are you|can I).{0,15}(open|come|visit|stop)/i,
    ],
  },
  {
    label: "price_inquiry",
    delta: 10,
    patterns: [
      /\b(how much|what.{0,5}price|best price|lowest price|bottom line|otd|out the door|total cost|sticker)\b/i,
      /\b(deal|discount|off msrp|negotiate|negotiable)\b/i,
    ],
  },
  {
    label: "competitor_mention",
    delta: 5,
    patterns: [
      /\b(carmax|carvana|vroom|another dealer|other dealer|other offer|better offer|kbb|kelley blue|facebook marketplace|craigslist|private (sale|seller|party)|autotrader|cars\.com|cargurus)\b/i,
      /\b(was offered|got an offer|quoted me|they.{0,10}offer)\b/i,
    ],
  },
  {
    label: "availability_check",
    delta: 10,
    patterns: [
      /\b(in stock|available|do you have|still have|any.{0,10}(left|available)|on the lot|inventory)\b/i,
    ],
  },
  {
    label: "feature_interest",
    delta: 5,
    patterns: [
      /\b(leather|sunroof|awd|4wd|4x4|navigation|heated seats|tow(ing)? (package|capacity)|backup camera|blind spot|adaptive cruise|panoramic|premium|loaded)\b/i,
      /\b(what colors|color options|packages|trim levels)\b/i,
    ],
  },
]

const NEGATIVE_SIGNALS: SignalPattern[] = [
  {
    label: "just_looking",
    delta: -10,
    patterns: [
      /\b(just (looking|browsing|wondering|curious)|not sure|no rush|no hurry|window shopping)\b/i,
      /\bmaybe (later|next year|someday|eventually)\b/i,
    ],
  },
  {
    label: "not_ready",
    delta: -10,
    patterns: [
      /\b(not ready|not in a hurry|few months|not right now|not yet|down the road)\b/i,
      /\b(still (researching|thinking|considering|deciding))\b/i,
    ],
  },
  {
    label: "appointment_declined",
    delta: -20,
    patterns: [
      /\b(can't come|won't come|not able to come|don't want to come|no (thanks|thank you).{0,20}(appointment|visit|come in))\b/i,
      /\b(too far|not convenient|busy|can't make it)\b/i,
    ],
  },
  {
    label: "opt_out",
    delta: -100, // effectively zeroes the score
    patterns: [
      /\b(stop|unsubscribe|remove me|opt out|don't (text|contact|message|call|email) me)\b/i,
      /\b(leave me alone|not interested|take me off)\b/i,
    ],
  },
]

// ── Scoring Functions ───────────────────────────────────────────────────────

/**
 * Analyze a single message for intent signals.
 */
export function analyzeMessage(
  content: string,
  options?: {
    responseTimeSeconds?: number
    previousScore?: number
  }
): IntentScoreResult {
  const signals: IntentSignal[] = []

  // Check positive signals
  for (const signal of POSITIVE_SIGNALS) {
    for (const pattern of signal.patterns) {
      const match = content.match(pattern)
      if (match) {
        signals.push({
          label: signal.label,
          delta: signal.delta,
          matched: match[0],
        })
        break // only count each signal type once per message
      }
    }
  }

  // Check negative signals
  for (const signal of NEGATIVE_SIGNALS) {
    for (const pattern of signal.patterns) {
      const match = content.match(pattern)
      if (match) {
        signals.push({
          label: signal.label,
          delta: signal.delta,
          matched: match[0],
        })
        break
      }
    }
  }

  // Quick response bonus
  if (
    options?.responseTimeSeconds !== undefined &&
    options.responseTimeSeconds < 300 // within 5 minutes
  ) {
    signals.push({
      label: "quick_response",
      delta: 5,
      matched: `${options.responseTimeSeconds}s response time`,
    })
  }

  const totalDelta = signals.reduce((sum, s) => sum + s.delta, 0)
  const previousScore = options?.previousScore ?? 50 // default starting score
  const compositeScore = clamp(previousScore + totalDelta, 0, 100)

  return {
    signals,
    totalDelta,
    compositeScore,
  }
}

/**
 * Score an entire conversation history and return the cumulative result.
 */
export function scoreConversation(
  messages: Array<{
    content: string
    role: string
    createdAt: Date
  }>
): IntentScoreResult {
  let currentScore = 50 // start at neutral
  const allSignals: IntentSignal[] = []

  const customerMessages = messages.filter((m) => m.role === "CUSTOMER")

  for (let i = 0; i < customerMessages.length; i++) {
    const msg = customerMessages[i]

    // Calculate response time if there was a previous AI message
    let responseTimeSeconds: number | undefined
    if (i > 0) {
      const prevIndex = messages.findIndex(
        (m) =>
          m.role === "AI" &&
          m.createdAt > (customerMessages[i - 1]?.createdAt ?? new Date(0)) &&
          m.createdAt < msg.createdAt
      )
      if (prevIndex !== -1) {
        responseTimeSeconds = Math.round(
          (msg.createdAt.getTime() - messages[prevIndex].createdAt.getTime()) /
            1000
        )
      }
    }

    const result = analyzeMessage(msg.content, {
      responseTimeSeconds,
      previousScore: currentScore,
    })

    currentScore = result.compositeScore
    allSignals.push(...result.signals)
  }

  // Check for no-response decay (if last customer message was >24h ago)
  if (customerMessages.length > 0) {
    const lastMessage = customerMessages[customerMessages.length - 1]
    const hoursSinceLastMessage =
      (Date.now() - lastMessage.createdAt.getTime()) / (1000 * 60 * 60)

    if (hoursSinceLastMessage >= 24) {
      const decaySignal: IntentSignal = {
        label: "no_response_24h",
        delta: -15,
        matched: `${Math.round(hoursSinceLastMessage)}h since last message`,
      }
      allSignals.push(decaySignal)
      currentScore = clamp(currentScore - 15, 0, 100)
    }
  }

  return {
    signals: allSignals,
    totalDelta: allSignals.reduce((sum, s) => sum + s.delta, 0),
    compositeScore: currentScore,
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)))
}
