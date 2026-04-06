// ── ADF/XML Parser ──────────────────────────────────────────────────────────
// Parses the Auto-lead Data Format (ADF/XML) into typed objects.
// Uses native string parsing to avoid heavy XML library dependencies.

import type { ParsedAdfLead, AdfCustomer, AdfVehicle, AdfProvider } from "./schemas"

/**
 * Parse an ADF/XML document into a structured lead object.
 * Handles common malformations gracefully — missing fields, extra whitespace,
 * CDATA sections, and encoding variations.
 */
export function parseAdfXml(xml: string): ParsedAdfLead {
  const cleaned = xml.trim()

  // Extract the prospect section
  const prospect = extractTag(cleaned, "prospect") || cleaned

  // Request metadata
  const requestDate = extractTag(prospect, "requestdate") || undefined
  const requestId = extractAttribute(prospect, "prospect", "requestdate") || undefined

  // Parse customer
  const customerXml = extractTag(prospect, "customer")
  const customer = parseCustomer(customerXml || "")

  // Parse vehicle(s)
  const vehicleXmls = extractAllTags(prospect, "vehicle")
  let vehicle: AdfVehicle = {
    year: 0,
    make: "Unknown",
    model: "Unknown",
  }
  let tradeVehicle: AdfVehicle | undefined

  for (const vXml of vehicleXmls) {
    const interest = extractAttribute(vXml, "vehicle", "interest") || "buy"
    const parsed = parseVehicle(vXml)

    if (interest.toLowerCase() === "trade" || interest.toLowerCase() === "trade-in") {
      tradeVehicle = parsed
    } else {
      vehicle = parsed
    }
  }

  // If no vehicle found in vehicle tags, try to parse from the root
  if (vehicle.year === 0 && vehicleXmls.length === 0) {
    vehicle = parseVehicle(prospect)
  }

  // Parse provider
  const providerXml = extractTag(prospect, "provider")
  const provider = providerXml ? parseProvider(providerXml) : undefined

  // Comments
  const comments = stripCdata(extractTag(prospect, "comments") || "") || undefined

  // Source
  const source =
    extractTag(prospect, "source") ||
    provider?.name ||
    undefined

  return {
    requestId,
    requestDate,
    customer,
    vehicle,
    tradeVehicle,
    provider,
    comments,
    source,
    rawXml: xml,
  }
}

// ── Section Parsers ─────────────────────────────────────────────────────────

function parseCustomer(xml: string): AdfCustomer {
  const contactXml = extractTag(xml, "contact") || xml

  const nameParts = extractTag(contactXml, "name")
  let firstName = ""
  let lastName = ""

  if (nameParts) {
    // Try structured name first
    firstName = extractTag(nameParts, "first") || extractTag(contactXml, "first") || ""
    lastName = extractTag(nameParts, "last") || extractTag(contactXml, "last") || ""

    // Fallback: split plain text name
    if (!firstName && !lastName) {
      const parts = stripCdata(nameParts).trim().split(/\s+/)
      firstName = parts[0] || ""
      lastName = parts.slice(1).join(" ")
    }
  } else {
    firstName = extractTag(contactXml, "first") || extractTag(xml, "first") || ""
    lastName = extractTag(contactXml, "last") || extractTag(xml, "last") || ""
  }

  // Email
  const email = extractTag(contactXml, "email") || extractTag(xml, "email") || undefined

  // Phone
  const phone = extractTag(contactXml, "phone") || extractTag(xml, "phone") || undefined
  const phoneType = extractAttribute(contactXml, "phone", "type") as
    | "voice"
    | "cellphone"
    | "fax"
    | undefined

  // Address
  const addressXml = extractTag(contactXml, "address") || extractTag(xml, "address")
  let address: AdfCustomer["address"] | undefined
  if (addressXml) {
    address = {
      street:
        extractTag(addressXml, "street") ||
        extractTag(addressXml, "streetaddress") ||
        undefined,
      city: extractTag(addressXml, "city") || undefined,
      state:
        extractTag(addressXml, "regioncode") ||
        extractTag(addressXml, "state") ||
        undefined,
      postalCode:
        extractTag(addressXml, "postalcode") ||
        extractTag(addressXml, "zip") ||
        undefined,
      country: extractTag(addressXml, "country") || undefined,
    }
  }

  return {
    firstName: stripCdata(firstName).trim(),
    lastName: stripCdata(lastName).trim(),
    email: email ? stripCdata(email).trim() : undefined,
    phone: phone ? stripCdata(phone).trim().replace(/[^\d+()-\s]/g, "") : undefined,
    phoneType,
    address,
  }
}

function parseVehicle(xml: string): AdfVehicle {
  const yearStr = extractTag(xml, "year")
  const year = yearStr ? parseInt(stripCdata(yearStr), 10) : 0

  const make = stripCdata(extractTag(xml, "make") || "").trim() || "Unknown"
  const model = stripCdata(extractTag(xml, "model") || "").trim() || "Unknown"
  const trim = extractTag(xml, "trim")
    ? stripCdata(extractTag(xml, "trim")!).trim()
    : undefined
  const vin = extractTag(xml, "vin")
    ? stripCdata(extractTag(xml, "vin")!).trim().toUpperCase()
    : undefined
  const stock = extractTag(xml, "stock")
    ? stripCdata(extractTag(xml, "stock")!).trim()
    : undefined

  const mileageStr = extractTag(xml, "odometer") || extractTag(xml, "mileage")
  const mileage = mileageStr ? parseInt(stripCdata(mileageStr).replace(/[^\d]/g, ""), 10) : undefined

  const color =
    extractTag(xml, "colorcombination")
      ? extractTag(extractTag(xml, "colorcombination")!, "colorname") || undefined
      : extractTag(xml, "color") || undefined

  const conditionStr = extractAttribute(xml, "vehicle", "status") ||
    extractTag(xml, "condition")
  const condition = conditionStr
    ? normalizeCondition(stripCdata(conditionStr).trim())
    : undefined

  const priceStr = extractTag(xml, "price")
  let price: number | undefined
  let priceType: AdfVehicle["priceType"] | undefined
  if (priceStr) {
    const priceVal = stripCdata(priceStr).replace(/[^\d.]/g, "")
    price = priceVal ? parseFloat(priceVal) : undefined
    priceType = (extractAttribute(xml, "price", "type") as AdfVehicle["priceType"]) || undefined
  }

  return {
    year: isNaN(year) ? 0 : year,
    make,
    model,
    trim,
    vin,
    stock,
    mileage: mileage && !isNaN(mileage) ? mileage : undefined,
    color: color ? stripCdata(color).trim() : undefined,
    condition,
    price,
    priceType,
  }
}

function parseProvider(xml: string): AdfProvider {
  const name = stripCdata(extractTag(xml, "name") || "").trim() || "Unknown"
  const service = extractTag(xml, "service")
    ? stripCdata(extractTag(xml, "service")!).trim()
    : undefined
  const url = extractTag(xml, "url")
    ? stripCdata(extractTag(xml, "url")!).trim()
    : undefined
  const email = extractTag(xml, "email")
    ? stripCdata(extractTag(xml, "email")!).trim()
    : undefined
  const phone = extractTag(xml, "phone")
    ? stripCdata(extractTag(xml, "phone")!).trim()
    : undefined
  const contactName = extractTag(xml, "contact")
    ? stripCdata(extractTag(xml, "contact")!).trim()
    : undefined

  return { name, service, url, email, phone, contactName }
}

// ── XML Utilities ───────────────────────────────────────────────────────────

/**
 * Extract the inner content of the first occurrence of a tag (case-insensitive).
 */
function extractTag(xml: string, tagName: string): string | null {
  const regex = new RegExp(
    `<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`,
    "i"
  )
  const match = xml.match(regex)
  return match ? match[1] : null
}

/**
 * Extract all occurrences of a tag including the tag itself.
 */
function extractAllTags(xml: string, tagName: string): string[] {
  const regex = new RegExp(
    `<${tagName}[^>]*>[\\s\\S]*?<\\/${tagName}>`,
    "gi"
  )
  return xml.match(regex) || []
}

/**
 * Extract an attribute value from a tag.
 */
function extractAttribute(
  xml: string,
  tagName: string,
  attrName: string
): string | null {
  const tagRegex = new RegExp(`<${tagName}\\s+[^>]*${attrName}=["']([^"']*)["']`, "i")
  const match = xml.match(tagRegex)
  return match ? match[1] : null
}

/**
 * Strip CDATA wrappers and decode common XML entities.
 */
function stripCdata(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .trim()
}

function normalizeCondition(
  condition: string
): "new" | "used" | "certified" | undefined {
  const lower = condition.toLowerCase()
  if (lower === "new") return "new"
  if (lower === "used" || lower === "pre-owned") return "used"
  if (lower.includes("certified") || lower === "cpo") return "certified"
  return undefined
}
