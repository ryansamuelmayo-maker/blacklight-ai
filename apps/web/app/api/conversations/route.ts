import { type NextRequest } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    // TODO: Get dealershipId from session
    const dealershipId = "demo" // TODO: from session

    const searchParams = request.nextUrl.searchParams
    const agent = searchParams.get("agent") // AgentType
    const status = searchParams.get("status") // ConversationStatus
    const channel = searchParams.get("channel") // Channel
    const leadId = searchParams.get("leadId")
    const page = parseInt(searchParams.get("page") ?? "1", 10)
    const limit = parseInt(searchParams.get("limit") ?? "25", 10)

    const where: Record<string, unknown> = {
      dealershipId,
      deletedAt: null,
    }

    if (agent) where.agent = agent
    if (status) where.status = status
    if (channel) where.channel = channel
    if (leadId) where.leadId = leadId

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        include: {
          lead: {
            select: { id: true, firstName: true, lastName: true, phone: true, email: true },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1, // latest message preview
          },
          humanTakeoverUser: { select: { id: true, name: true } },
        },
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.conversation.count({ where }),
    ])

    return Response.json({
      conversations,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error("GET /api/conversations error:", error)
    return Response.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // TODO: Get dealershipId from session
    const dealershipId = "demo" // TODO: from session

    const body = await request.json()
    const { leadId, agent, channel } = body

    if (!leadId) {
      return Response.json(
        { error: "leadId is required" },
        { status: 400 }
      )
    }

    // Verify the lead belongs to this dealership
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, dealershipId, deletedAt: null },
    })

    if (!lead) {
      return Response.json(
        { error: "Lead not found" },
        { status: 404 }
      )
    }

    const conversation = await prisma.conversation.create({
      data: {
        leadId,
        dealershipId,
        agent: agent ?? lead.assignedAgent ?? "NOVA",
        channel: channel ?? lead.channel ?? "SMS",
        status: "ACTIVE",
      },
      include: {
        lead: {
          select: { id: true, firstName: true, lastName: true, phone: true, email: true },
        },
        messages: true,
      },
    })

    return Response.json(conversation, { status: 201 })
  } catch (error) {
    console.error("POST /api/conversations error:", error)
    return Response.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    )
  }
}
