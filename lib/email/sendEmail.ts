import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses"

const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY
const AWS_REGION = process.env.AWS_REGION || "ap-south-1"
const SES_FROM_EMAIL = process.env.SES_FROM_EMAIL || "noreply@example.com"

let sesClient: SESClient | null = null

function getSESClient(): SESClient | null {
  if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
    return null
  }
  if (!sesClient) {
    sesClient = new SESClient({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      },
    })
  }
  return sesClient
}

/**
 * Validate email format (server-side only).
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false
  const trimmed = email.trim().toLowerCase()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
}

export interface SendEmailParams {
  to: string
  subject: string
  html: string
  /** Optional plain text fallback */
  text?: string
}

export type SendEmailResult =
  | { success: true; messageId?: string }
  | { success: false; error: string }

/**
 * Send an email via Amazon SES.
 * Only call from server-side (API routes, server components, cron).
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const { to, subject, html, text } = params

  const normalizedTo = to?.trim?.()?.toLowerCase?.()
  if (!normalizedTo || !isValidEmail(normalizedTo)) {
    console.error("[SES] Invalid recipient email:", to)
    return { success: false, error: "Invalid recipient email" }
  }

  const client = getSESClient()
  if (!client) {
    // In non-production environments, silently succeed so local testing
    // and DB flows are not blocked by missing email configuration.
    if (process.env.NODE_ENV !== "production") {
      return { success: true }
    }
    return { success: false, error: "Email service not configured." }
  }

  const fromEmail = SES_FROM_EMAIL?.trim?.()
  if (!fromEmail) {
    console.error("[SES] SES_FROM_EMAIL is not set.")
    return { success: false, error: "SES_FROM_EMAIL is not configured." }
  }

  try {
    const command = new SendEmailCommand({
      Source: fromEmail,
      Destination: { ToAddresses: [normalizedTo] },
      Message: {
        Subject: { Data: subject, Charset: "UTF-8" },
        Body: {
          Html: { Data: html, Charset: "UTF-8" },
          ...(text ? { Text: { Data: text, Charset: "UTF-8" } } : {}),
        },
      },
    })
    const response = await client.send(command)
    const messageId = response.MessageId
    if (messageId) {
      console.log("[SES] Email sent successfully:", { to: normalizedTo, messageId })
    }
    return { success: true, messageId }
  } catch (error: unknown) {
    const err = error as { message?: string; name?: string }
    const message = err?.message || String(error)
    console.error("[SES] Failed to send email:", { to: normalizedTo, error: message })
    return { success: false, error: message }
  }
}
