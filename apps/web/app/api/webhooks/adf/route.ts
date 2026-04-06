import { type NextRequest } from "next/server"
import { prisma } from "@/lib/db"

/**
 * Parse a simple ADF/XML string and extract key fields.
 * A full implementation would use a proper XML parser library.
 */
function parseAdfXml(xml: string) {
  const getTag = (tag: string, src: string): string | null => {
    const match = src.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"))
    return match ? match[1].trim() : null
  }

  const getAttr = (tag: string, attr: string, src: string): string | null => {
    const tagMatch = src.match(new RegExp(`<${tag}[^>]*${attr}="([^"]*)"`, "i"))
    return tagMatch ? tagMatch[1].trim() : null
  }

  const customerSection = getTag("customer", xml) ?? ""
  const vehicleSection = getTag("vehicle", xml) ?? ""

  const firstName = getTag("name_first", customerSection) ?? getTag("first", customerSection) ?? "Unknown"
  const lastName = getTag("name_last", customerSection) ?? getTag("last", customerSection) ?? "Lead"
  const email = getTag("email", customerSection)
  const phone = getTag("phone", customerSection)

  const year = parseInt(getTag("year", vehicleSection) ?? "0", 10) || new Date().getFullYear()
  const make = getTag("make", vehicleSection) ?? "Unknown"
  const model = getTag("model", vehicleSection) ?? "Unknown"
  const trim = getTag("trim", vehicleSection)
  const vin = getTag("vin", vehicleSection)
  const mileage = parseInt(getTag("odometer", vehicleSection) ?? "0", 10) || null
  const interest = getAttr("vehicle", "interest", xml) // "buy" or "sell" or "trade-in"

  const source = getTag("source", xml)
  const sourceName = getTag("sourcename", source ?? xml) ?? getTag("name", source ?? xml)

  return { firstName, lastName, email, phone, year, make, model, trim, vin, mileage, interest, sourceName }
}

export async function POST(request: NextRequest) {
  try {
    // TODO: Authenticate inbound ADF source (API key, IP allowlist, etc.)
    const dealershipId = "demo" // TODO: from session / endpoint config

    const contentType = request.headers.get("content-type") ?? ""
    let adfXml: string

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData()
      // ADF may come as a file attachment or as a form field
      const adfField = formData.get("adf") ?? formData.get("xml") ?? formData.get("data")
      if (adfField instanceof Blob) {
        adfXml = await adfField.text()
      } else if (typeof adfField === "string") {
        adfXml = adfField
      } else {
        return Response.json(
          { error: "No ADF data found in form submission" },
          { status: 400 }
        )
      }
    } else {
      // Assume application/xml or text/xml
      adfXml = await request.text()
    }

    if (!adfXml || !adfXml.trim()) {
      return Response.json(
        { error: "Empty ADF payload" },
        { status: 400 }
      )
    }

    const parsed = parseAdfXml(adfXml)

    // Determine lead type from vehicle interest
    let leadType: "BUYER" | "SELLER" | "BOTH" = "BUYER"
    if (parsed.interest === "sell" || parsed.interest === "trade-in") {
      leadType = "SELLER"
    }

    // Determine source
    let leadSource: string = "EMAIL_ADF"
    const sourceMap: Record<string, string> = {
      "cars.com": "CARS_COM",
      cargurus: "CARGURUS",
      autotrader: "AUTOTRADER",
      facebook: "FACEBOOK",
    }
    if (parsed.sourceName) {
      const lower = parsed.sourceName.toLowerCase()
      for (const [key, value] of Object.entries(sourceMap)) {
        if (lower.includes(key)) {
          leadSource = value
          break
        }
      }
    }

    // Auto-assign agent
    const assignedAgent = leadType === "SELLER" ? "AXEL" : "NOVA"

    // Create lead
    const lead = await prisma.lead.create({
      data: {
        dealershipId,
        firstName: parsed.firstName,
        lastName: parsed.lastName,
        email: parsed.email,
        phone: parsed.phone,
        type: leadType,
        source: leadSource as any,
        sourceDetail: parsed.sourceName,
        channel: "EMAIL",
        status: "NEW",
        assignedAgent,
        adfPayload: adfXml,
      },
    })

    // Create vehicle record
    const vehicle = await prisma.vehicle.create({
      data: {
        dealershipId,
        leadId: lead.id,
        year: parsed.year,
        make: parsed.make,
        model: parsed.model,
        trim: parsed.trim,
        vin: parsed.vin,
        mileage: parsed.mileage,
        condition: "UNKNOWN",
      },
    })

    // Store ADF transaction
    // Find a default inbound endpoint or create a placeholder reference
    let endpointId: string | null = null
    const endpoint = await prisma.adfEndpoint.findFirst({
      where: { dealershipId, isActive: true },
    })
    if (endpoint) {
      endpointId = endpoint.id
      await prisma.adfTransaction.create({
        data: {
          dealershipId,
          leadId: lead.id,
          vehicleId: vehicle.id,
          endpointId: endpoint.id,
          direction: "INBOUND",
          adfXml,
          status: "RESPONSE_RECEIVED",
        },
      })
    }

    // TODO: Queue AI response / conversation creation based on agent assignment

    return Response.json(
      {
        received: true,
        leadId: lead.id,
        vehicleId: vehicle.id,
        assignedAgent,
        source: leadSource,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("POST /api/webhooks/adf error:", error)
    return Response.json(
      { error: "Failed to process ADF lead" },
      { status: 500 }
    )
  }
}
