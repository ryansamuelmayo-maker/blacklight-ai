import { type NextRequest } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    // TODO: Validate Twilio webhook signature using X-Twilio-Signature header
    const formData = await request.formData()

    const from = formData.get("From") as string | null
    const body = formData.get("Body") as string | null
    const messageSid = formData.get("MessageSid") as string | null
    const to = formData.get("To") as string | null

    if (!from || !body) {
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
        { status: 200, headers: { "Content-Type": "text/xml" } }
      )
    }

    // Normalize phone number (strip formatting, keep +1XXXXXXXXXX)
    const normalizedPhone = from.replace(/[^\d+]/g, "")

    // Try to find an existing lead by phone number
    let lead = await prisma.lead.findFirst({
      where: {
        phone: { contains: normalizedPhone.replace("+1", "").slice(-10) },
        deletedAt: null,
      },
      include: {
        conversations: {
          where: { channel: "SMS", status: { in: ["ACTIVE", "PAUSED"] } },
          orderBy: { updatedAt: "desc" },
          take: 1,
        },
      },
    })

    // If no lead found, create a new one
    if (!lead) {
      // TODO: Determine dealershipId from the "To" number mapping
      const dealershipId = "demo" // TODO: from session / phone-number lookup

      lead = await prisma.lead.create({
        data: {
          dealershipId,
          firstName: "Unknown",
          lastName: "Caller",
          phone: normalizedPhone,
          type: "BUYER",
          source: "SMS_INBOUND",
          channel: "SMS",
          status: "NEW",
          assignedAgent: "NOVA",
        },
        include: {
          conversations: {
            where: { channel: "SMS", status: { in: ["ACTIVE", "PAUSED"] } },
            orderBy: { updatedAt: "desc" },
            take: 1,
          },
        },
      })
    }

    // Find or create a conversation
    let conversation = lead.conversations[0] ?? null
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          leadId: lead.id,
          dealershipId: lead.dealershipId,
          agent: lead.assignedAgent === "UNASSIGNED" ? "NOVA" : lead.assignedAgent,
          channel: "SMS",
          status: "ACTIVE",
        },
      })
    }

    // Store the inbound message
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "CUSTOMER",
        content: body,
        channel: "SMS",
        externalMessageId: messageSid,
      },
    })

    // Update lead status if still NEW
    if (lead.status === "NEW") {
      await prisma.lead.update({
        where: { id: lead.id },
        data: { status: "AI_ENGAGED" },
      })
    }

    // TODO: Queue AI response generation (e.g., via a background job / queue)
    // For now, return empty TwiML — the AI response will be sent asynchronously
    // via the Twilio API rather than synchronously in the TwiML response.

    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
      { status: 200, headers: { "Content-Type": "text/xml" } }
    )
  } catch (error) {
    console.error("POST /api/webhooks/twilio error:", error)
    // Always return valid TwiML even on error so Twilio doesn't retry aggressively
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
      { status: 200, headers: { "Content-Type": "text/xml" } }
    )
  }
}
