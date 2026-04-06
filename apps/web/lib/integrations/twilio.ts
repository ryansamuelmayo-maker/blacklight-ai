// ── Twilio SMS Integration ──────────────────────────────────────────────────
// Send and receive SMS messages via the Twilio API.

export interface TwilioConfig {
  accountSid: string
  authToken: string
  fromNumber: string
}

export interface SendSmsResult {
  success: boolean
  messageSid?: string
  error?: string
}

export interface InboundSmsPayload {
  MessageSid: string
  AccountSid: string
  From: string
  To: string
  Body: string
  NumMedia?: string
  MediaUrl0?: string
  MediaContentType0?: string
  FromCity?: string
  FromState?: string
  FromZip?: string
  FromCountry?: string
}

export interface ParsedInboundSms {
  messageSid: string
  from: string
  to: string
  body: string
  mediaUrls: string[]
  location?: {
    city?: string
    state?: string
    zip?: string
    country?: string
  }
}

function getConfig(): TwilioConfig {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromNumber = process.env.TWILIO_FROM_NUMBER

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error(
      "Missing Twilio configuration. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER."
    )
  }

  return { accountSid, authToken, fromNumber }
}

/**
 * Send an SMS message via Twilio REST API.
 *
 * @param to - Recipient phone number in E.164 format (+1XXXXXXXXXX)
 * @param body - Message text (max 1600 characters, auto-split by Twilio)
 * @param options - Optional overrides
 */
export async function sendSms(
  to: string,
  body: string,
  options?: {
    from?: string
    statusCallback?: string
    messagingServiceSid?: string
  }
): Promise<SendSmsResult> {
  const config = getConfig()

  const url = `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`

  const params = new URLSearchParams()
  params.set("To", to)
  params.set("Body", body)

  if (options?.messagingServiceSid) {
    params.set("MessagingServiceSid", options.messagingServiceSid)
  } else {
    params.set("From", options?.from || config.fromNumber)
  }

  if (options?.statusCallback) {
    params.set("StatusCallback", options.statusCallback)
  }

  const credentials = Buffer.from(
    `${config.accountSid}:${config.authToken}`
  ).toString("base64")

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.message || `Twilio API error: ${response.status}`,
      }
    }

    return {
      success: true,
      messageSid: data.sid,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return {
      success: false,
      error: `Failed to send SMS: ${message}`,
    }
  }
}

/**
 * Parse an inbound SMS webhook payload from Twilio.
 *
 * @param payload - The raw form data from Twilio's webhook
 */
export function handleInboundSms(payload: InboundSmsPayload): ParsedInboundSms {
  const mediaUrls: string[] = []
  const numMedia = parseInt(payload.NumMedia || "0", 10)

  for (let i = 0; i < numMedia; i++) {
    const url = (payload as unknown as Record<string, string>)[`MediaUrl${i}`]
    if (url) mediaUrls.push(url)
  }

  return {
    messageSid: payload.MessageSid,
    from: payload.From,
    to: payload.To,
    body: payload.Body || "",
    mediaUrls,
    location:
      payload.FromCity || payload.FromState
        ? {
            city: payload.FromCity,
            state: payload.FromState,
            zip: payload.FromZip,
            country: payload.FromCountry,
          }
        : undefined,
  }
}

/**
 * Validate that a Twilio webhook request is authentic.
 * Uses the X-Twilio-Signature header for HMAC validation.
 */
export async function validateTwilioSignature(
  signature: string,
  url: string,
  params: Record<string, string>
): Promise<boolean> {
  const config = getConfig()

  // Build the data string: URL + sorted params concatenated
  const sortedKeys = Object.keys(params).sort()
  let data = url
  for (const key of sortedKeys) {
    data += key + params[key]
  }

  // HMAC-SHA1 using Web Crypto API
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(config.authToken),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  )

  const signatureBytes = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(data)
  )

  const expectedSignature = btoa(
    String.fromCharCode(...new Uint8Array(signatureBytes))
  )

  return signature === expectedSignature
}
