import { type NextRequest } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    // TODO: Get dealershipId from session
    const dealershipId = "demo" // TODO: from session

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status") // NegotiationStatus
    const leadId = searchParams.get("leadId")
    const vehicleId = searchParams.get("vehicleId")
    const page = parseInt(searchParams.get("page") ?? "1", 10)
    const limit = parseInt(searchParams.get("limit") ?? "25", 10)

    const where: Record<string, unknown> = {
      dealershipId,
      deletedAt: null,
    }

    if (status) where.status = status
    if (leadId) where.leadId = leadId
    if (vehicleId) where.vehicleId = vehicleId

    const [negotiations, total] = await Promise.all([
      prisma.negotiation.findMany({
        where,
        include: {
          lead: {
            select: { id: true, firstName: true, lastName: true, type: true },
          },
          vehicle: {
            select: { id: true, year: true, make: true, model: true, trim: true, vin: true },
          },
          strategyProfile: { select: { id: true, name: true, vehicleCategory: true } },
          approvals: {
            where: { status: "PENDING" },
            select: { id: true, type: true, requestedAmount: true, status: true },
          },
          rounds: {
            orderBy: { roundNumber: "desc" },
            take: 1,
          },
        },
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.negotiation.count({ where }),
    ])

    return Response.json({
      negotiations,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error("GET /api/negotiations error:", error)
    return Response.json(
      { error: "Failed to fetch negotiations" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // TODO: Get dealershipId from session
    const dealershipId = "demo" // TODO: from session

    const body = await request.json()
    const { leadId, vehicleId, strategyProfileId, locationId } = body

    if (!leadId || !vehicleId || !strategyProfileId) {
      return Response.json(
        { error: "leadId, vehicleId, and strategyProfileId are required" },
        { status: 400 }
      )
    }

    // Verify lead, vehicle, and strategy profile belong to this dealership
    const [lead, vehicle, profile] = await Promise.all([
      prisma.lead.findFirst({
        where: { id: leadId, dealershipId, deletedAt: null },
      }),
      prisma.vehicle.findFirst({
        where: { id: vehicleId, dealershipId, deletedAt: null },
        include: { appraisals: { orderBy: { createdAt: "desc" }, take: 1 } },
      }),
      prisma.negotiationProfile.findFirst({
        where: { id: strategyProfileId, dealershipId, deletedAt: null },
      }),
    ])

    if (!lead) {
      return Response.json({ error: "Lead not found" }, { status: 404 })
    }
    if (!vehicle) {
      return Response.json({ error: "Vehicle not found" }, { status: 404 })
    }
    if (!profile) {
      return Response.json({ error: "Strategy profile not found" }, { status: 404 })
    }

    // Calculate anchor from latest appraisal if available
    const latestAppraisal = vehicle.appraisals[0]
    const anchorAmount = latestAppraisal?.offerAmount ?? 0
    const anchorSource = latestAppraisal ? latestAppraisal.source as string : "MANUAL"

    // Calculate derived values from the strategy profile
    const dealerCeiling = anchorAmount + (profile.defaultCeilingAdjustment ?? 0)
    const openingOffer = Math.round(dealerCeiling * (profile.defaultOpeningPercent / 100))

    const negotiation = await prisma.negotiation.create({
      data: {
        leadId,
        vehicleId,
        dealershipId,
        locationId: locationId ?? null,
        strategyProfileId,
        status: "CONFIGURING",
        anchorSource: anchorSource as "KBB_ICO" | "ACCUTRADE" | "BLACK_BOOK" | "VAUTO" | "BLENDED" | "MANUAL",
        anchorAmount,
        dealerCeiling,
        openingOfferPercent: profile.defaultOpeningPercent,
        perRoundIncrement: profile.defaultIncrement,
        incrementCurve: profile.defaultCurve,
        maxRounds: profile.defaultMaxRounds,
        finalBump: profile.defaultFinalBump,
        reconBuffer: profile.defaultReconBuffer,
        demandBonus: profile.defaultDemandBonus,
        currentRound: 0,
        currentOffer: openingOffer,
      },
      include: {
        lead: { select: { id: true, firstName: true, lastName: true } },
        vehicle: { select: { id: true, year: true, make: true, model: true } },
        strategyProfile: { select: { id: true, name: true } },
      },
    })

    return Response.json(negotiation, { status: 201 })
  } catch (error) {
    console.error("POST /api/negotiations error:", error)
    return Response.json(
      { error: "Failed to create negotiation" },
      { status: 500 }
    )
  }
}
