import { NextResponse } from "next/server"
import { runSubscriptionReminders } from "@/lib/cron/subscriptionReminder"

/**
 * GET /api/cron/subscription-reminder
 * Sends subscription reminder emails (3 days and 1 day before expiry).
 * Secure with: Authorization: Bearer CRON_SECRET
 *
 * Vercel cron (vercel.json):
 *   "crons": [{ "path": "/api/cron/subscription-reminder", "schedule": "0 9 * * *" }]
 */
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await runSubscriptionReminders()
    return NextResponse.json({
      success: true,
      sent: result.sent,
      failed: result.failed,
      errors: result.errors,
    })
  } catch (error) {
    console.error("[cron/subscription-reminder] Error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Cron failed" },
      { status: 500 }
    )
  }
}
