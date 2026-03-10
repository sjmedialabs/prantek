/**
 * Subscription reminder job: send emails 3 days and 1 day before expiry.
 * Run via: GET /api/cron/subscription-reminder (with Authorization: Bearer CRON_SECRET)
 * Or schedule with node-cron in a worker:
 *   import cron from "node-cron"
 *   import { runSubscriptionReminders } from "@/lib/cron/subscriptionReminder"
 *   cron.schedule("0 9 * * *", runSubscriptionReminders)  // daily at 9:00
 */

import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { sendPaymentReminderEmail } from "@/lib/email"
import { ObjectId } from "mongodb"

function addDays(d: Date, days: number): Date {
  const out = new Date(d)
  out.setDate(out.getDate() + days)
  return out
}

function toDateOnly(d: Date): Date {
  const out = new Date(d)
  out.setHours(0, 0, 0, 0)
  return out
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}

export interface SubscriptionReminderResult {
  sent: number
  failed: number
  errors: string[]
}

export async function runSubscriptionReminders(): Promise<SubscriptionReminderResult> {
  const result: SubscriptionReminderResult = { sent: 0, failed: 0, errors: [] }
  const db = await connectDB()
  const usersCol = db.collection(Collections.USERS)
  const plansCol = db.collection(Collections.SUBSCRIPTION_PLANS)

  const today = toDateOnly(new Date())
  const in3Days = addDays(today, 3)
  const in1Day = addDays(today, 1)

  // Users whose subscription or trial expires in 3 days or 1 day (by date)
  const cursor = usersCol.find({
    userType: "subscriber",
    role: { $ne: "super-admin" },
    $or: [
      { subscriptionEndDate: { $gte: in3Days, $lt: addDays(in3Days, 1) } },
      { subscriptionEndDate: { $gte: in1Day, $lt: addDays(in1Day, 1) } },
      { trialEndsAt: { $gte: in3Days, $lt: addDays(in3Days, 1) } },
      { trialEndsAt: { $gte: in1Day, $lt: addDays(in1Day, 1) } },
    ],
  })

  const users = await cursor.toArray()

  for (const user of users) {
    const expiryDate = user.subscriptionEndDate || user.trialEndsAt
    if (!expiryDate) continue

    const expiry = new Date(expiryDate)
    const expiryDateOnly = toDateOnly(expiry)
    const daysLeft = Math.round((expiry.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))

    if (daysLeft !== 3 && daysLeft !== 1) continue

    const planId = user.subscriptionPlanId
    let planName = "Your plan"
    if (planId) {
      try {
        const plan = await plansCol.findOne({ _id: new ObjectId(planId) })
        if (plan?.name) planName = plan.name
      } catch (_) {}
    }

    const recipientName = user.name || user.email?.split("@")[0] || "User"
    const email = user.email
    if (!email) {
      result.errors.push(`User ${user._id} has no email`)
      result.failed++
      continue
    }

    const ok = await sendPaymentReminderEmail(email, {
      recipientName,
      planName,
      expiryDate: formatDate(expiryDateOnly),
      daysUntilExpiry: daysLeft,
    })
    if (ok) result.sent++
    else {
      result.failed++
      result.errors.push(`Failed to send reminder to ${email}`)
    }
  }

  if (result.sent > 0 || result.failed > 0) {
    console.log("[subscriptionReminder] Done:", result)
  }
  return result
}
