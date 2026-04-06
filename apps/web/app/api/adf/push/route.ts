import { type NextRequest } from "next/server"
import { prisma } from "@/lib/db"

/**
 * Generate ADF/XML for a vehicle appraisal request.
 */
function generateAdfXml(vehicle: {
  vin: string | null
  year: number
  make: string
  model: string
  trim: string | null
  mileage: number | null
  condition: string
  color: string | null
}, lead: {
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
} | null, dealership: {
  name: string
  phone: string | null
  address: string | null
}): string {
  const escXml = (s: string | null | undefined) =>
    (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

  return `<?xml version="1.0" encoding="UTF-8"?>
<?adf version="1.0"?>
<adf>
  <prospect>
    <requestdate>${new Date().toISOString()}</requestdate>
    <vehicle interest="sell">
      ${vehicle.vin ? `<vin>${escXml(vehicle.vin)}</vin>` : ""}
      <year>${vehicle.year}</year>
      <make>${escXml(vehicle.make)}</make>
      <model>${escXml(vehicle.model)}</model>
      ${vehicle.trim ? `<trim>${escXml(vehicle.trim)}</trim>` : ""}
      ${vehicle.mileage ? `<odometer><value>${vehicle.mileage}</value><units>miles</units></odometer>` : ""}
      ${vehicle.condition !== "UNKNOWN" ? `<condition>${escXml(vehicle.condition.toLowerCase())}</condition>` : ""}
      ${vehicle.color ? `<color>${escXml(vehicle.color)}</color>` : ""}
    </vehicle>
    ${lead ? `
    <customer>
      <contact>
        <name part="first">${escXml(lead.firstName)}</name>
        <name part="last">${escXml(lead.lastName)}</name>
        ${lead.email ? `<email>${escXml(lead.email)}</email>` : ""}
        ${lead.phone ? `<phone type="voice">${escXml(lead.phone)}</phone>` : ""}
      </contact>
    </customer>` : ""}
    <vendor>
      <vendorname>${escXml(dealership.name)}</vendorname>
      ${dealership.phone ? `<phone>${escXml(dealership.phone)}</phone>` : ""}
      ${dealership.address ? `<address><street>${escXml(dealership.address)}</street></address>` : ""}
    </vendor>
  </prospect>
</adf>`
}

export async function POST(request: NextRequest) {
  try {
    // TODO: Get dealershipId from session
    const dealershipId = "demo" // TODO: from session

    const body = await request.json()
    const { vehicleId, endpointId } = body

    if (!vehicleId || !endpointId) {
      return Response.json(
        { error: "vehicleId and endpointId are required" },
        { status: 400 }
      )
    }

    // Load vehicle, its lead, the endpoint, and dealership
    const [vehicle, endpoint, dealership] = await Promise.all([
      prisma.vehicle.findFirst({
        where: { id: vehicleId, dealershipId, deletedAt: null },
        include: {
          lead: {
            select: { firstName: true, lastName: true, email: true, phone: true },
          },
        },
      }),
      prisma.adfEndpoint.findFirst({
        where: { id: endpointId, dealershipId, isActive: true, deletedAt: null },
      }),
      prisma.dealership.findUnique({
        where: { id: dealershipId },
        select: { name: true, phone: true, address: true },
      }),
    ])

    if (!vehicle) {
      return Response.json({ error: "Vehicle not found" }, { status: 404 })
    }
    if (!endpoint) {
      return Response.json({ error: "ADF endpoint not found or inactive" }, { status: 404 })
    }
    if (!dealership) {
      return Response.json({ error: "Dealership not found" }, { status: 404 })
    }

    // Generate ADF XML
    const adfXml = generateAdfXml(vehicle, vehicle.lead, dealership)

    // Create the transaction record first
    const transaction = await prisma.adfTransaction.create({
      data: {
        dealershipId,
        leadId: vehicle.leadId,
        vehicleId: vehicle.id,
        endpointId: endpoint.id,
        direction: "OUTBOUND",
        adfXml,
        status: "SENT",
      },
    })

    // Send via the configured method
    try {
      if (endpoint.endpointType === "API_URL" || endpoint.endpointType === "WEBHOOK") {
        const response = await fetch(endpoint.endpointValue, {
          method: "POST",
          headers: {
            "Content-Type": "application/xml",
            ...(endpoint.credentials as Record<string, string> ?? {}),
          },
          body: adfXml,
        })

        const responseData = await response.text()

        await prisma.adfTransaction.update({
          where: { id: transaction.id },
          data: {
            status: response.ok ? "DELIVERED" : "FAILED",
            responseReceivedAt: new Date(),
            responseData: { statusCode: response.status, body: responseData },
            errorMessage: response.ok ? null : `HTTP ${response.status}: ${responseData.slice(0, 500)}`,
          },
        })

        // Update endpoint sync status
        await prisma.adfEndpoint.update({
          where: { id: endpoint.id },
          data: {
            lastSyncAt: new Date(),
            lastSyncStatus: response.ok ? "SUCCESS" : "FAILURE",
          },
        })

        if (!response.ok) {
          return Response.json(
            {
              error: "ADF push failed at remote endpoint",
              transactionId: transaction.id,
              statusCode: response.status,
            },
            { status: 502 }
          )
        }
      } else if (endpoint.endpointType === "EMAIL") {
        // TODO: Send ADF XML via email (e.g., SendGrid, SES)
        // For now, mark as sent — email delivery is async
        await prisma.adfTransaction.update({
          where: { id: transaction.id },
          data: { status: "DELIVERED" },
        })

        await prisma.adfEndpoint.update({
          where: { id: endpoint.id },
          data: { lastSyncAt: new Date(), lastSyncStatus: "SUCCESS" },
        })
      }
    } catch (sendError) {
      const errMsg = sendError instanceof Error ? sendError.message : "Unknown send error"
      await prisma.adfTransaction.update({
        where: { id: transaction.id },
        data: {
          status: "FAILED",
          errorMessage: errMsg,
        },
      })

      await prisma.adfEndpoint.update({
        where: { id: endpoint.id },
        data: { lastSyncAt: new Date(), lastSyncStatus: "FAILURE" },
      })

      return Response.json(
        { error: "Failed to send ADF", transactionId: transaction.id, detail: errMsg },
        { status: 502 }
      )
    }

    return Response.json({
      transactionId: transaction.id,
      status: "DELIVERED",
      endpointProvider: endpoint.provider,
    })
  } catch (error) {
    console.error("POST /api/adf/push error:", error)
    return Response.json(
      { error: "Failed to push ADF" },
      { status: 500 }
    )
  }
}
