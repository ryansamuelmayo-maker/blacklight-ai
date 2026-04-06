// ── Competitor Detection ────────────────────────────────────────────────────
// Detects mentions of competing buyers/platforms in customer messages.

export interface CompetitorDetection {
  /** Normalized competitor name */
  competitor: string
  /** The raw text that matched */
  matchedText: string
  /** Estimated offer amount if mentioned, in cents */
  estimatedAmount: number | null
  /** Confidence level of the detection */
  confidence: "HIGH" | "MEDIUM" | "LOW"
}

interface CompetitorPattern {
  name: string
  patterns: RegExp[]
  confidence: "HIGH" | "MEDIUM" | "LOW"
}

const COMPETITORS: CompetitorPattern[] = [
  {
    name: "CarMax",
    patterns: [/\bcarmax\b/i, /\bcar\s*max\b/i],
    confidence: "HIGH",
  },
  {
    name: "Carvana",
    patterns: [/\bcarvana\b/i],
    confidence: "HIGH",
  },
  {
    name: "Vroom",
    patterns: [/\bvroom\b/i],
    confidence: "HIGH",
  },
  {
    name: "KBB",
    patterns: [
      /\bkbb\b/i,
      /\bkelley\s*blue\s*book\b/i,
      /\bkbb\s+(says|value|offer|instant|ico)\b/i,
    ],
    confidence: "HIGH",
  },
  {
    name: "Facebook Marketplace",
    patterns: [
      /\bfacebook\s*marketplace\b/i,
      /\bfb\s*marketplace\b/i,
      /\bmarketplace\b/i,
    ],
    confidence: "MEDIUM",
  },
  {
    name: "Craigslist",
    patterns: [/\bcraigslist\b/i, /\bcraigs\s*list\b/i],
    confidence: "HIGH",
  },
  {
    name: "Private Sale",
    patterns: [
      /\bprivate\s*(sale|seller|party|buyer)\b/i,
      /\bsell(ing)?\s*(it\s+)?(myself|privately|on my own)\b/i,
    ],
    confidence: "MEDIUM",
  },
  {
    name: "Another Dealer",
    patterns: [
      /\banother\s*dealer(ship)?\b/i,
      /\bother\s*dealer(ship)?\b/i,
      /\bdealer\s*(down|up|across)\s*(the\s*)?(street|road|town)\b/i,
      /\blocal\s*dealer\b/i,
    ],
    confidence: "MEDIUM",
  },
  {
    name: "Competing Offer",
    patterns: [
      /\bbetter\s*offer\b/i,
      /\bhigher\s*offer\b/i,
      /\bother\s*offer\b/i,
      /\bI\s*(was|got|have|received)\s*(an?\s*)?offer/i,
      /\boffered\s*(me\s*)?\$?\d/i,
      /\bquoted\s*(me\s*)?\$?\d/i,
      /\bthey.{0,15}offer(ed|ing)?\s*(me\s*)?\$?\d/i,
    ],
    confidence: "HIGH",
  },
  {
    name: "AutoTrader",
    patterns: [/\bautotrader\b/i, /\bauto\s*trader\b/i],
    confidence: "HIGH",
  },
  {
    name: "Cars.com",
    patterns: [/\bcars\.com\b/i],
    confidence: "HIGH",
  },
  {
    name: "CarGurus",
    patterns: [/\bcargurus\b/i, /\bcar\s*gurus\b/i],
    confidence: "HIGH",
  },
  {
    name: "Edmunds",
    patterns: [/\bedmunds\b/i],
    confidence: "HIGH",
  },
  {
    name: "TrueCar",
    patterns: [/\btruecar\b/i, /\btrue\s*car\b/i],
    confidence: "HIGH",
  },
]

// Pattern to extract dollar amounts from surrounding text
const AMOUNT_PATTERNS = [
  /\$\s?([\d,]+(?:\.\d{2})?)/,
  /(\d{1,3}(?:,\d{3})+)\s*(?:dollars|bucks)/i,
  /(\d{4,6})\s*(?:dollars|bucks|\$)/i,
  /(?:offered?|quoted?|gave?)\s*(?:me\s*)?\$?\s*([\d,]+)/i,
]

/**
 * Detect competitor mentions in a message.
 * Returns all detected competitors with estimated amounts if found.
 */
export function detectCompetitors(content: string): CompetitorDetection[] {
  const detections: CompetitorDetection[] = []
  const seen = new Set<string>()

  for (const competitor of COMPETITORS) {
    for (const pattern of competitor.patterns) {
      const match = content.match(pattern)
      if (match && !seen.has(competitor.name)) {
        seen.add(competitor.name)

        // Try to extract an offer amount from the surrounding context
        const estimatedAmount = extractAmount(content)

        detections.push({
          competitor: competitor.name,
          matchedText: match[0],
          estimatedAmount,
          confidence: competitor.confidence,
        })
        break // one match per competitor is enough
      }
    }
  }

  return detections
}

/**
 * Extract a dollar amount from message text.
 * Returns amount in cents, or null if no amount found.
 */
function extractAmount(content: string): number | null {
  for (const pattern of AMOUNT_PATTERNS) {
    const match = content.match(pattern)
    if (match) {
      const amountStr = (match[1] || match[0]).replace(/[$,\s]/g, "")
      const amount = parseFloat(amountStr)
      if (!isNaN(amount) && amount > 0) {
        // If the number looks like it's already in dollars (has decimal or > 100)
        // convert to cents. If it looks like cents already (very large), leave it.
        if (amount < 1_000_000) {
          return Math.round(amount * 100) // dollars to cents
        }
        return Math.round(amount)
      }
    }
  }
  return null
}

/**
 * Convenience: detect the primary competitor (highest confidence, first match).
 */
export function detectPrimaryCompetitor(
  content: string
): CompetitorDetection | null {
  const detections = detectCompetitors(content)
  if (detections.length === 0) return null

  // Sort by confidence (HIGH > MEDIUM > LOW)
  const confidenceOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 }
  detections.sort(
    (a, b) => confidenceOrder[b.confidence] - confidenceOrder[a.confidence]
  )

  return detections[0]
}
