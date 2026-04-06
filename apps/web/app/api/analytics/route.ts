import { type NextRequest } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    // TODO: Get dealershipId from session
    const dealershipId = "demo" // TODO: from session

    const searchParams = request.nextUrl.searchParams
    const startDateParam = searchParams.get("startDate")
    const endDateParam = searchParams.get("endDate")

    // Default to last 30 days
    const endDate = endDateParam ? new Date(endDateParam) : new Date()
    const startDate = startDateParam
      ? new Date(startDateParam)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return Response.json(
        { error: "Invalid date format. Use ISO 8601 (YYYY-MM-DD)." },
        { status: 400 }
      )
    }

    // Fetch aggregated daily metrics for the date range
    const dailyMetrics = await prisma.dailyMetrics.findMany({
      where: {
        dealershipId,
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: "asc" },
    })

    // Aggregate KPIs from daily metrics
    const kpis = dailyMetrics.reduce(
      (acc, day) => {
        acc.totalLeadsIn += day.totalLeadsIn
        acc.buyerLeads += day.buyerLeads
        acc.sellerLeads += day.sellerLeads
        acc.aiEngaged += day.aiEngaged
        acc.appointmentsSet += day.appointmentsSet
        acc.showed += day.showed
        acc.closedWon += day.closedWon
        acc.closedLost += day.closedLost
        acc.totalGrossProfit += day.totalGrossProfit
        acc.guardianSavingsTotal += day.guardianSavingsTotal
        acc.novaLeadsHandled += day.novaLeadsHandled
        acc.axelNegotiationsRun += day.axelNegotiationsRun
        acc.humanEscalations += day.humanEscalations
        acc.approvalRequests += day.approvalRequests
        return acc
      },
      {
        totalLeadsIn: 0,
        buyerLeads: 0,
        sellerLeads: 0,
        aiEngaged: 0,
        appointmentsSet: 0,
        showed: 0,
        closedWon: 0,
        closedLost: 0,
        totalGrossProfit: 0,
        guardianSavingsTotal: 0,
        novaLeadsHandled: 0,
        axelNegotiationsRun: 0,
        humanEscalations: 0,
        approvalRequests: 0,
      }
    )

    // Calculate derived KPIs
    const avgGrossPerDeal = kpis.closedWon > 0
      ? Math.round(kpis.totalGrossProfit / kpis.closedWon)
      : 0
    const closeRate = kpis.totalLeadsIn > 0
      ? Math.round((kpis.closedWon / kpis.totalLeadsIn) * 10000) / 100
      : 0
    const showRate = kpis.appointmentsSet > 0
      ? Math.round((kpis.showed / kpis.appointmentsSet) * 10000) / 100
      : 0
    const appointmentRate = kpis.totalLeadsIn > 0
      ? Math.round((kpis.appointmentsSet / kpis.totalLeadsIn) * 10000) / 100
      : 0

    // Funnel data
    const funnel = [
      { stage: "Leads In", count: kpis.totalLeadsIn },
      { stage: "AI Engaged", count: kpis.aiEngaged },
      { stage: "Appointments Set", count: kpis.appointmentsSet },
      { stage: "Showed", count: kpis.showed },
      { stage: "Closed Won", count: kpis.closedWon },
    ]

    // Agent metrics — fetch live counts for the date range
    const [novaLeads, axelNegotiations, humanEscalated] = await Promise.all([
      prisma.lead.count({
        where: {
          dealershipId,
          assignedAgent: "NOVA",
          createdAt: { gte: startDate, lte: endDate },
          deletedAt: null,
        },
      }),
      prisma.negotiation.count({
        where: {
          dealershipId,
          createdAt: { gte: startDate, lte: endDate },
          deletedAt: null,
        },
      }),
      prisma.conversation.count({
        where: {
          dealershipId,
          humanTakeover: true,
          humanTakeoverAt: { gte: startDate, lte: endDate },
          deletedAt: null,
        },
      }),
    ])

    const agentMetrics = {
      nova: {
        leadsHandled: kpis.novaLeadsHandled || novaLeads,
        description: "Buy-side AI agent",
      },
      axel: {
        negotiationsRun: kpis.axelNegotiationsRun || axelNegotiations,
        description: "Sell-side negotiation AI agent",
      },
      humanEscalations: kpis.humanEscalations || humanEscalated,
      approvalRequests: kpis.approvalRequests,
    }

    return Response.json({
      dateRange: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        daysIncluded: dailyMetrics.length,
      },
      kpis: {
        ...kpis,
        avgGrossPerDeal,
        closeRate,
        showRate,
        appointmentRate,
      },
      funnel,
      agentMetrics,
      dailyMetrics, // raw daily data for charting
    })
  } catch (error) {
    console.error("GET /api/analytics error:", error)
    return Response.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    )
  }
}
