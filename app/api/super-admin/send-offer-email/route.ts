import { NextRequest, NextResponse } from "next/server"
import { withSuperAdmin } from "@/lib/api-auth"
import { sendOfferEmail } from "@/lib/email"
import { isValidEmail } from "@/lib/email/sendEmail"

/**
 * POST /api/super-admin/send-offer-email
 * Body: { to: string, subject?: string, title: string, bodyHtml: string, recipientName?: string, ctaText?: string, ctaUrl?: string }
 * Send a promotional/offer email via SES (super-admin only).
 */
export const POST = withSuperAdmin(async (req: NextRequest) => {
  try {
    const body = await req.json()
    const { to, subject, title, bodyHtml, recipientName, ctaText, ctaUrl } = body

    const normalizedTo = to?.trim?.()?.toLowerCase?.()
    if (!normalizedTo || !isValidEmail(normalizedTo)) {
      return NextResponse.json({ success: false, error: "Valid 'to' email is required" }, { status: 400 })
    }
    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ success: false, error: "Title is required" }, { status: 400 })
    }
    if (!bodyHtml || typeof bodyHtml !== "string") {
      return NextResponse.json({ success: false, error: "bodyHtml is required" }, { status: 400 })
    }

    const ok = await sendOfferEmail(normalizedTo, {
      recipientName: recipientName?.trim?.() || undefined,
      title: title.trim(),
      bodyHtml: bodyHtml.trim(),
      ctaText: ctaText?.trim?.() || undefined,
      ctaUrl: ctaUrl?.trim?.() || undefined,
      subject: subject?.trim?.() || undefined,
    })
    if (!ok) {
      return NextResponse.json({ success: false, error: "Failed to send email (check SES configuration)" }, { status: 503 })
    }
    return NextResponse.json({ success: true, message: "Offer email sent" })
  } catch (e) {
    console.error("[send-offer-email] Error:", e)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
})
