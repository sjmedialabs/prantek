import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses"

function getSesEnv() {
  const accessKeyId = process.env.AWS_SES_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.AWS_SES_SECRET_KEY || process.env.AWS_SECRET_ACCESS_KEY
  const region = process.env.AWS_SES_REGION || process.env.AWS_REGION || "ap-south-1"
  const fromEmail =
    (process.env.AWS_SES_FROM_EMAIL || process.env.SES_FROM_EMAIL || "noreply@example.com").trim()
  return { accessKeyId, secretAccessKey, region, fromEmail }
}

let sesClient: SESClient | null = null

function getSESClient(): SESClient | null {
  const { accessKeyId, secretAccessKey, region } = getSesEnv()
  if (!accessKeyId || !secretAccessKey) {
    return null
  }
  if (!sesClient) {
    sesClient = new SESClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    })
  }
  return sesClient
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

/** User-facing hint; full error is always logged server-side. */
function normalizeSesErrorMessage(raw: string): string {
  const t = raw.toLowerCase()
  if (
    t.includes("not authorized") ||
    t.includes("accessdenied") ||
    t.includes("access denied") ||
    t.includes("ses:sendemail")
  ) {
    return (
      "Amazon SES rejected the request (IAM). In IAM, attach a policy that allows ses:SendEmail and ses:SendRawEmail " +
      "for this region (e.g. Resource arn:aws:ses:ap-south-1:YOUR_ACCOUNT_ID:identity/*). " +
      "If SES is still in sandbox, also verify the recipient email in SES (or request production access)."
    )
  }
  if (t.includes("not verified") || t.includes("address is not verified")) {
    return (
      "That email address is not verified in Amazon SES. In sandbox mode, verify the recipient in SES (Verified identities), " +
      "or move the account out of sandbox and use a verified sending domain."
    )
  }
  return raw
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
    console.error(
      "[SES] Missing credentials. Set AWS_SES_ACCESS_KEY + AWS_SES_SECRET_KEY (or AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY), AWS_SES_REGION (or AWS_REGION), and AWS_SES_FROM_EMAIL (or SES_FROM_EMAIL).",
    )
    return { success: false, error: "Email service not configured." }
  }

  const { fromEmail } = getSesEnv()
  if (!fromEmail) {
    console.error("[SES] From address is not set.")
    return { success: false, error: "SES from address is not configured." }
  }

  const maxAttempts = 3
  let lastMessage = ""
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
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
      lastMessage = message
      const throttled =
        /throttl|rate exceed|too many requests/i.test(message) || err?.name === "ThrottlingException"
      if (throttled && attempt < maxAttempts) {
        await sleep(250 * attempt)
        continue
      }
      console.error("[SES] Failed to send email:", { to: normalizedTo, error: message })
      return { success: false, error: normalizeSesErrorMessage(message) }
    }
  }
  return { success: false, error: lastMessage || "Failed to send email" }
}

export type SendEmailBatchItem = SendEmailParams

export type SendEmailBatchResult = { index: number; to: string } & SendEmailResult

/**
 * Send many emails with optional concurrency (one recipient per SES call; avoids exposing addresses to each other).
 * Tune with SES_BULK_CONCURRENCY (default 5) for SES sending limits in your account/region.
 */
export async function sendEmailBatch(
  items: SendEmailBatchItem[],
  options?: { concurrency?: number },
): Promise<SendEmailBatchResult[]> {
  const defaultConc = Math.max(1, parseInt(process.env.SES_BULK_CONCURRENCY || "5", 10) || 5)
  const concurrency = Math.max(1, options?.concurrency ?? defaultConc)
  const results: SendEmailBatchResult[] = new Array(items.length)
  let next = 0

  async function worker() {
    for (;;) {
      const i = next++
      if (i >= items.length) break
      const item = items[i]
      const to = item.to?.trim?.()?.toLowerCase?.() || ""
      const r = await sendEmail(item)
      results[i] = { index: i, to, ...r }
    }
  }

  const n = Math.min(concurrency, Math.max(1, items.length))
  await Promise.all(Array.from({ length: n }, () => worker()))
  return results
}
