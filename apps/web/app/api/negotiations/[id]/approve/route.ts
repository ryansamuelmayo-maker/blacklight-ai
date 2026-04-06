import { type NextRequest } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // TODO: Get dealershipId and userId from session
    const dealershipId = "demo" // TODO: from session
    const userId = "demo-user" // TODO: from session

    const { id: negotiationId } = await params
    const body = await request.json()
    const { approvalId, action, counterOfferAmount, notes } = body

    if (!approvalId || !action) {
      return Response.json(
        { error: "approvalId and action are required" },
        { status: 400 }
      )
    }

    const validActions = ["APPROVED", "DENIED", "COUNTER_OFFERED"]
    if (!validActions.includes(action)) {
      return Response.json(
        { error: `action must be one of: ${validActions.join(", ")}` },
        { status: 400 }
      )
    }

    if (action === "COUNTER_OFFERED" && (counterOfferAmount == null || counterOfferAmount <= 0)) {
      return Response.json(
        { error: "counterOfferAmount is required for COUNTER_OFFERED action" },
        { status: 400 }
      )
    }

    // Verify the negotiation belongs to this dealership
    const negotiation = await prisma.negotiation.findFirst({
      where: { id: negotiationId, dealershipId, deletedAt: null },
    })

    if (!negotiation) {
      return Response.json(
        { error: "Negotiation not found" },
        { status: 404 }
      )
    }

    // Verify the approval belongs to this negotiation and is pending
    const approval = await prisma.negotiationApproval.findFirst({
      where: { id: approvalId, negotiationId, status: "PENDING" },
    })

    if (!approval) {
      return Response.json(
        { error: "Pending approval not found for this negotiation" },
        { status: 404 }
      )
    }

    // Update the approval
    const updatedApproval = await prisma.negotiationApproval.update({
      where: { id: approvalId },
      data: {
        status: action,
        respondedByUserId: userId,
        respondedAt: new Date(),
        counterOfferAmount: action === "COUNTER_OFFERED" ? counterOfferAmount : null,
        notes: notes ?? null,
      },
    })

    // If approved, update the negotiation ceiling to the requested amount
    if (action === "APPROVED") {
      await prisma.negotiation.update({
        where: { id: negotiationId },
        data: {
          dealerCeiling: approval.requestedAmount,
          status: "ACTIVE",
        },
      })
    }

    // If counter-offered, update ceiling to the counter amount
    if (action === "COUNTER_OFFERED") {
      await prisma.negotiation.update({
        where: { id: negotiationId },
        data: {
          dealerCeiling: counterOfferAmount,
          status: "ACTIVE",
        },
      })
    }

    // If denied, escalate the negotiation
    if (action === "DENIED") {
      await prisma.negotiation.update({
        where: { id: negotiationId },
        data: { status: "ESCALATED" },
      })
    }

    return Response.json({
      approval: updatedApproval,
      message: `Approval ${action.toLowerCase()} successfully`,
    })
  } catch (error) {
    console.error("POST /api/negotiations/[id]/approve error:", error)
    return Response.json(
      { error: "Failed to process approval" },
      { status: 500 }
    )
  }
}
