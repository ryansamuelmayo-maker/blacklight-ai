import { type NextRequest } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    // TODO: Get dealershipId from session
    const dealershipId = "demo" // TODO: from session

    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get("type") // BUYER | SELLER | BOTH
    const status = searchParams.get("status") // LeadStatus
    const agent = searchParams.get("agent") // AgentType
    const search = searchParams.get("search") // free-text name/email/phone
    const page = parseInt(searchParams.get("page") ?? "1", 10)
    const limit = parseInt(searchParams.get("limit") ?? "25", 10)

    const where: Record<string, unknown> = {
      dealershipId,
      deletedAt: null,
    }

    if (type) where.type = type
    if (status) where.status = status
    if (agent) where.assignedAgent = agent
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ]
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: {
          vehicles: true,
          conversations: { select: { id: true, status: true, agent: true } },
          assignedUser: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.lead.count({ where }),
    ])

    return Response.json({
      leads,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error("GET /api/leads error:", error)
    return Response.json(
      { error: "Failed to fetch leads" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // TODO: Get dealershipId from session
    const dealershipId = "demo" // TODO: from session

    const body = await request.json()
    const { firstName, lastName, email, phone, type, source, channel, sourceDetail, locationId, metadata } = body

    if (!firstName || !lastName) {
      return Response.json(
        { error: "firstName and lastName are required" },
        { status: 400 }
      )
    }

    // Auto-assign agent based on lead type
    const leadType = type ?? "BUYER"
    let assignedAgent: "NOVA" | "AXEL" | "UNASSIGNED" = "UNASSIGNED"
    if (leadType === "BUYER") assignedAgent = "NOVA"
    else if (leadType === "SELLER") assignedAgent = "AXEL"
    else if (leadType === "BOTH") assignedAgent = "NOVA" // Buyers start with Nova

    const lead = await prisma.lead.create({
      data: {
        dealershipId,
        locationId: locationId ?? null,
        firstName,
        lastName,
        email: email ?? null,
        phone: phone ?? null,
        type: leadType,
        source: source ?? "OTHER",
        sourceDetail: sourceDetail ?? null,
        channel: channel ?? "MANUAL",
        status: "NEW",
        assignedAgent,
        metadata: metadata ?? {},
      },
      include: {
        vehicles: true,
        conversations: true,
      },
    })

    return Response.json(lead, { status: 201 })
  } catch (error) {
    console.error("POST /api/leads error:", error)
    return Response.json(
      { error: "Failed to create lead" },
      { status: 500 }
    )
  }
}
