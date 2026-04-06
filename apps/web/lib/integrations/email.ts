// ── Email Integration (SendGrid) ────────────────────────────────────────────
// Send and receive email via the SendGrid API.

export interface SendGridConfig {
  apiKey: string
  fromEmail: string
  fromName: string
}

export interface SendEmailResult {
  success: boolean
  messageId?: string
  error?: string
}

export interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
  replyTo?: string
  categories?: string[]
  customArgs?: Record<string, string>
  attachments?: Array<{
    content: string // base64 encoded
    filename: string
    type: string
    disposition?: "attachment" | "inline"
  }>
}

export interface InboundEmailPayload {
  /** Sender email address */
  from: string
  /** Recipient email address(es) */
  to: string
  /** Email subject */
  subject: string
  /** Plain text body */
  text: string
  /** HTML body */
  html: string
  /** Sender IP */
  sender_ip?: string
  /** SPF verification result */
  SPF?: string
  /** DKIM verification */
  dkim?: string
  /** Number of attachments */
  attachments?: string
  /** Envelope JSON */
  envelope?: string
  /** Message headers JSON */
  headers?: string
}

export interface ParsedInboundEmail {
  from: string
  fromName: string | null
  to: string
  subject: string
  textBody: string
  htmlBody: string
  isAuthenticated: boolean
  attachmentCount: number
  inReplyTo: string | null
}

function getConfig(): SendGridConfig {
  const apiKey = process.env.SENDGRID_API_KEY
  const fromEmail = process.env.SENDGRID_FROM_EMAIL
  const fromName = process.env.SENDGRID_FROM_NAME || "Blacklight AI"

  if (!apiKey || !fromEmail) {
    throw new Error(
      "Missing SendGrid configuration. Set SENDGRID_API_KEY and SENDGRID_FROM_EMAIL."
    )
  }

  return { apiKey, fromEmail, fromName }
}

/**
 * Send an email via SendGrid v3 API.
 */
export async function sendEmail(
  options: SendEmailOptions
): Promise<SendEmailResult> {
  const config = getConfig()

  const payload: Record<string, unknown> = {
    personalizations: [
      {
        to: [{ email: options.to }],
        ...(options.customArgs ? { custom_args: options.customArgs } : {}),
      },
    ],
    from: {
      email: config.fromEmail,
      name: config.fromName,
    },
    subject: options.subject,
    content: [
      ...(options.text
        ? [{ type: "text/plain", value: options.text }]
        : []),
      { type: "text/html", value: options.html },
    ],
  }

  if (options.replyTo) {
    payload.reply_to = { email: options.replyTo }
  }

  if (options.categories?.length) {
    payload.categories = options.categories
  }

  if (options.attachments?.length) {
    payload.attachments = options.attachments.map((a) => ({
      content: a.content,
      filename: a.filename,
      type: a.type,
      disposition: a.disposition || "attachment",
    }))
  }

  try {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      return {
        success: false,
        error: `SendGrid API error (${response.status}): ${errorBody}`,
      }
    }

    // SendGrid returns 202 Accepted with X-Message-Id header
    const messageId = response.headers.get("X-Message-Id") || undefined

    return {
      success: true,
      messageId,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return {
      success: false,
      error: `Failed to send email: ${message}`,
    }
  }
}

/**
 * Parse an inbound email webhook payload from SendGrid Inbound Parse.
 */
export function handleInboundEmail(
  payload: InboundEmailPayload
): ParsedInboundEmail {
  // Parse the from field to extract name and email
  const fromMatch = payload.from.match(/^(?:"?(.+?)"?\s+)?<?([^\s>]+)>?$/)
  const fromName = fromMatch?.[1] || null
  const fromEmail = fromMatch?.[2] || payload.from

  // Check authentication
  const spfPass = payload.SPF?.toLowerCase().includes("pass") ?? false
  const dkimPass = payload.dkim?.toLowerCase().includes("pass") ?? false
  const isAuthenticated = spfPass || dkimPass

  // Count attachments
  const attachmentCount = parseInt(payload.attachments || "0", 10)

  // Extract In-Reply-To header if present
  let inReplyTo: string | null = null
  if (payload.headers) {
    try {
      const headers = JSON.parse(payload.headers)
      inReplyTo = headers["In-Reply-To"] || headers["in-reply-to"] || null
    } catch {
      // Malformed headers JSON
    }
  }

  return {
    from: fromEmail,
    fromName,
    to: payload.to,
    subject: payload.subject || "",
    textBody: payload.text || "",
    htmlBody: payload.html || "",
    isAuthenticated,
    attachmentCount,
    inReplyTo,
  }
}

/**
 * Send a templated email using a SendGrid dynamic template.
 */
export async function sendTemplateEmail(params: {
  to: string
  templateId: string
  dynamicData: Record<string, unknown>
  categories?: string[]
}): Promise<SendEmailResult> {
  const config = getConfig()

  const payload = {
    personalizations: [
      {
        to: [{ email: params.to }],
        dynamic_template_data: params.dynamicData,
      },
    ],
    from: {
      email: config.fromEmail,
      name: config.fromName,
    },
    template_id: params.templateId,
    ...(params.categories?.length ? { categories: params.categories } : {}),
  }

  try {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      return {
        success: false,
        error: `SendGrid API error (${response.status}): ${errorBody}`,
      }
    }

    return {
      success: true,
      messageId: response.headers.get("X-Message-Id") || undefined,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return {
      success: false,
      error: `Failed to send template email: ${message}`,
    }
  }
}
