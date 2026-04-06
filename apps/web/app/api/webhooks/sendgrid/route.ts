import { type NextRequest } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    // TODO: Validate SendGrid webhook authenticity
    const formData = await request.formData()

    const from = formData.get("from") as string | null
    const subject = formData.get("subject") as string | null
    const text = formData.get("text") as string | null
    const html = formData.get("html") as string | null
    const to = formData.get("to") as string | null
    const envelope = formData.get("envelope") as string | null

    if (!from) {
      return Response.json(
        { error: "Missing sender information" },
        { status: 400 }
      )
    }

    // Extract email address from "Name <email@example.com>" format
    const emailMatch = from.match(/<([^>]+)>/)
    const senderEmail = emailMatch ? emailMatch[1] : from.trim()
    const senderName = emailMatch
      ? from.replace(/<[^>]+>/, "").trim()
      : senderEmail.split("@")[0]

    // Use the text body, or strip HTML tags as fallback
    const messageBody = text ?? html?.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() ?? ""

    if (!messageBody) {
      return Response.json({ received: true, message: "Empty body ignored" })
    }

    // Try to find an existing lead by email
    let lead = await prisma.lead.findFirst({
      where: {
        email: { equals: senderEmail, mode: "insensitive" },
        deletedAt: null,
      },
      include: {
        conversations: {
          where: { channel: "EMAIL", status: { in: ["ACTIVE", "PAUSED"] } },
          orderBy: { updatedAt: "desc" },
          take: 1,
        },
      },
    })

    // If no lead found, create a new one
    if (!lead) {
      // TODO: Determine dealershipId from the "To" address mapping
      const dealershipId = "demo" // TODO: from session / email-address lookup

      // Split name into first/last
      const nameParts = senderName.split(/\s+/)
      const firstName = nameParts[0] || "Unknown"
      const lastName = nameParts.slice(1).join(" ") || "Contact"

      lead = await prisma.lead.create({
        data: {
          dealershipId,
          firstName,
          lastName,
          email: senderEmail,
          type: "BUYER",
          source: "OTHER",
          sourceDetail: "SendGrid Inbound Parse",
          channel: "EMAIL",
          status: "NEW",
          assignedAgent: "NOVA",
        },
        include: {
          conversations: {
            where: { channel: "EMAIL", status: { in: ["ACTIVE", "PAUSED"] } },
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
          channel: "EMAIL",
          status: "ACTIVE",
        },
      })
    }

    // Store the inbound message
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "CUSTOMER",
        content: subject ? `[Subject: ${subject}]\n\n${messageBody}` : messageBody,
        channel: "EMAIL",
        metadata: {
          subject: subject ?? null,
          hasHtml: !!html,
          envelope: envelope ? JSON.parse(envelope) : null,
        },
      },
    })

    // Update lead status if still NEW
    if (lead.status === "NEW") {
      await prisma.lead.update({
        where: { id: lead.id },
        data: { status: "AI_ENGAGED" },
      })
    }

    // TODO: Queue AI response generation

    return Response.json({ received: true, leadId: lead.id, conversationId: conversation.id })
  } catch (error) {
    console.error("POST /api/webhooks/sendgrid error:", error)
    return Response.json(
      { error: "Failed to process inbound email" },
      { status: 500 }
    )
  }
}
