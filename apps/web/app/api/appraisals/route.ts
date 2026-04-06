import { type NextRequest } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    // TODO: Get dealershipId from session
    const dealershipId = "demo" // TODO: from session

    const searchParams = request.nextUrl.searchParams
    const vehicleId = searchParams.get("vehicleId")

    if (!vehicleId) {
      return Response.json(
        { error: "vehicleId query parameter is required" },
        { status: 400 }
      )
    }

    // Verify vehicle belongs to this dealership
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, dealershipId, deletedAt: null },
    })

    if (!vehicle) {
      return Response.json(
        { error: "Vehicle not found" },
        { status: 404 }
      )
    }

    const appraisals = await prisma.appraisal.findMany({
      where: { vehicleId, dealershipId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    })

    return Response.json({ appraisals, vehicleId })
  } catch (error) {
    console.error("GET /api/appraisals error:", error)
    return Response.json(
      { error: "Failed to fetch appraisals" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // TODO: Get dealershipId from session
    const dealershipId = "demo" // TODO: from session

    const body = await request.json()
    const { vehicleId, source, offerAmount, offerType, confidence, expiresAt, rawData } = body

    if (!vehicleId || !source || offerAmount == null) {
      return Response.json(
        { error: "vehicleId, source, and offerAmount are required" },
        { status: 400 }
      )
    }

    if (typeof offerAmount !== "number" || offerAmount <= 0) {
      return Response.json(
        { error: "offerAmount must be a positive number" },
        { status: 400 }
      )
    }

    const validSources = [
      "KBB_ICO", "ACCUTRADE", "BLACK_BOOK", "VAUTO",
      "CARMAX", "CARVANA", "MANUAL", "OTHER",
    ]
    if (!validSources.includes(source)) {
      return Response.json(
        { error: `source must be one of: ${validSources.join(", ")}` },
        { status: 400 }
      )
    }

    // Verify vehicle belongs to this dealership
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, dealershipId, deletedAt: null },
    })

    if (!vehicle) {
      return Response.json(
        { error: "Vehicle not found" },
        { status: 404 }
      )
    }

    const appraisal = await prisma.appraisal.create({
      data: {
        vehicleId,
        dealershipId,
        source,
        offerAmount,
        offerType: offerType ?? "INSTANT_OFFER",
        confidence: confidence ?? "MEDIUM",
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        rawData: rawData ?? {},
        retrievalMethod: "MANUAL_ENTRY",
      },
    })

    return Response.json(appraisal, { status: 201 })
  } catch (error) {
    console.error("POST /api/appraisals error:", error)
    return Response.json(
      { error: "Failed to create appraisal" },
      { status: 500 }
    )
  }
}
