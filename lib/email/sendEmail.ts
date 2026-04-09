/**
 * Transactional email via Mailchimp Transactional (Mandrill).
 * Server-side only (API routes, server components, cron).
 */
// Default export is callable: (apiKey: string) => client
import mailchimpInit from "@mailchimp/mailchimp_transactional"

type MandrillClient = ReturnType<typeof mailchimpInit>

function getMailFromEmail(): string {
  return (
    process.env.MAIL_FROM_EMAIL ||
    process.env.AWS_SES_FROM_EMAIL ||
    process.env.SES_FROM_EMAIL ||
    "noreply@example.com"
  ).trim()
}

let mandrillClient: MandrillClient | null = null

function getMandrillClient(): MandrillClient | null {
  const key = process.env.MANDRILL_API_KEY?.trim()
  if (!key) return null
  if (!mandrillClient) mandrillClient = mailchimpInit(key)
  return mandrillClient
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function isTransportError(data: unknown): data is { message?: string; response?: { data?: unknown } } {
  if (typeof data !== "object" || data === null) return false
  const o = data as Record<string, unknown>
  return o.isAxiosError === true || o.name === "AxiosError" || o.code === "ECONNABORTED"
}

function transportErrorMessage(err: { message?: string; response?: { data?: unknown } }): string {
  const d = err.response?.data
  if (d && typeof d === "object" && d !== null) {
    const msg = (d as Record<string, unknown>).message
    if (typeof msg === "string" && msg) return msg
    const name = (d as Record<string, unknown>).name
    if (typeof name === "string" && name) return name
  }
  return err.message || "Network error sending email."
}

/** User-facing hint; full error is always logged server-side. */
function normalizeEmailProviderError(raw: string): string {
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
  if (t.includes("invalid_key") || t.includes("invalid api key") || t.includes("payment required")) {
    return "Email service rejected the request. Check MANDRILL_API_KEY and your Mailchimp Transactional account."
  }
  if (t === "unsigned" || t.includes("unsigned")) {
    return (
      "Your sending domain is not verified for Mailchimp Transactional (DKIM/SPF or domain approval). " +
      "In Transactional settings, verify the domain used by MAIL_FROM_EMAIL, publish DKIM DNS records, then try again."
    )
  }
  if (t.includes("invalid-sender") || t === "invalid") {
    return (
      "MAIL_FROM_EMAIL is not allowed as a sender. Verify that address or its domain in Mailchimp Transactional " +
      "and use a matching from address."
    )
  }
  if (t.includes("recipient-domain-mismatch")) {
    return (
      "Mailchimp Transactional rejected this recipient domain for your account/pool. " +
      "In Mailchimp Transactional, verify your sender domain and check outbound domain restrictions, " +
      "sending domains, and dedicated/shared IP pool rules. If your account is in a restricted/trial state, " +
      "send only to allowed recipient domains or request full sending access."
    )
  }
  return raw
}

function parseMandrillSendResponse(
  data: unknown,
): { ok: true; messageId?: string } | { ok: false; error: string } {
  if (data == null) {
    return { ok: false, error: "Empty response from email provider." }
  }
  if (isTransportError(data)) {
    return { ok: false, error: transportErrorMessage(data) }
  }
  if (typeof data === "object" && data !== null && "status" in data && (data as { status: string }).status === "error") {
    const e = data as { message?: string; name?: string }
    return { ok: false, error: e.message || e.name || "Mailchimp Transactional API error." }
  }
  if (!Array.isArray(data) || data.length === 0) {
    return { ok: false, error: "Unexpected response from email provider." }
  }
  const row = data[0] as { email?: string; status?: string; reject_reason?: string | null; _id?: string }
  const st = (row.status || "").toLowerCase()
  if (st === "sent" || st === "queued" || st === "scheduled") {
    return { ok: true, messageId: row._id }
  }
  const reason = row.reject_reason || row.status || "Message not sent."
  const errStr = String(reason)
  console.error("[Mandrill] Message not accepted:", {
    recipient: row.email,
    status: row.status,
    reject_reason: row.reject_reason,
    _id: row._id,
  })
  return { ok: false, error: errStr }
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
 * Send an email via Mailchimp Transactional (Mandrill).
 * Only call from server-side (API routes, server components, cron).
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const { to, subject, html, text } = params

  const normalizedTo = to?.trim?.()?.toLowerCase?.()
  if (!normalizedTo || !isValidEmail(normalizedTo)) {
    console.error("[sendEmail] Invalid recipient email:", to)
    return { success: false, error: "Invalid recipient email" }
  }

  const client = getMandrillClient()
  if (!client) {
    console.error(
      "[Mandrill] Missing API key. Set MANDRILL_API_KEY (and MAIL_FROM_EMAIL or legacy AWS_SES_FROM_EMAIL / SES_FROM_EMAIL).",
    )
    return { success: false, error: "Email service not configured." }
  }

  const fromEmail = getMailFromEmail()
  if (!fromEmail) {
    console.error("[Mandrill] From address is not set.")
    return { success: false, error: "SES from address is not configured." }
  }

  const maxAttempts = 3
  let lastMessage = ""
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const raw = await client.messages.send({
        message: {
          from_email: fromEmail,
          subject,
          html,
          ...(text ? { text } : {}),
          to: [{ email: normalizedTo, type: "to" }],
        },
        async: false,
      })

      const parsed = parseMandrillSendResponse(raw)
      if (parsed.ok) {
        if (parsed.messageId) {
          console.log("[Mandrill] Email sent successfully:", { to: normalizedTo, messageId: parsed.messageId })
        }
        return { success: true, messageId: parsed.messageId }
      }

      const message = parsed.error
      lastMessage = message
      const throttled =
        /throttl|rate exceed|too many requests|limit exceeded/i.test(message) ||
        /slow down/i.test(message.toLowerCase())
      if (throttled && attempt < maxAttempts) {
        await sleep(250 * attempt)
        continue
      }
      console.error("[Mandrill] Failed to send email:", { to: normalizedTo, error: message })
      return { success: false, error: normalizeEmailProviderError(message) }
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
      console.error("[Mandrill] Failed to send email:", { to: normalizedTo, error: message })
      return { success: false, error: normalizeEmailProviderError(message) }
    }
  }
  return { success: false, error: lastMessage || "Failed to send email" }
}

export type SendEmailBatchItem = SendEmailParams

export type SendEmailBatchResult = { index: number; to: string } & SendEmailResult

/**
 * Send many emails with optional concurrency (one recipient per API call; avoids exposing addresses to each other).
 * Tune with SES_BULK_CONCURRENCY (default 5) for provider rate limits.
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
