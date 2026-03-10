import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { withSuperAdmin } from "@/lib/api-auth"

// Return users with upcoming or recently ended trials and their auto-debit state
export const GET = withSuperAdmin(async (req: NextRequest) => {
  const db = await connectDB()

  const { searchParams } = new URL(req.url)
  const daysParam = searchParams.get("days") || "30"
  const days = Number.parseInt(daysParam, 10) || 30
  const showAll = searchParams.get("showAll") === "true"

  const usersCol = db.collection(Collections.USERS)
  const subscriptionsCol = db.collection(Collections.SUBSCRIPTIONS)
  const paymentHistoryCol = db.collection(Collections.PAYMENT_HISTORY)

  let users: any[]

  if (showAll) {
    users = await usersCol
      .find({
        subscriptionPlanId: { $exists: true, $ne: "", $ne: null },
        role: { $ne: "super-admin" },
      })
      .sort({ trialEndDate: -1, trialEndsAt: -1, subscriptionEndDate: -1, createdAt: -1 })
      .limit(200)
      .toArray()
  } else {
    const start = new Date()
    start.setDate(start.getDate() - 1)
    const end = new Date()
    end.setDate(end.getDate() + days)

    users = await usersCol
      .find({
        $and: [
          { subscriptionPlanId: { $exists: true, $ne: "", $ne: null } },
          {
            $or: [
              { trialEndDate: { $gte: start, $lte: end } },
              { trialEndsAt: { $gte: start, $lte: end } },
              { subscriptionEndDate: { $gte: start, $lte: end } },
            ],
          },
        ],
      })
      .sort({ trialEndDate: 1, trialEndsAt: 1, subscriptionEndDate: 1 })
      .limit(200)
      .toArray()
  }

  const userIds = users.map((u: any) => u._id?.toString()).filter(Boolean)

  // Subscriptions by userId for next payment
  const subsByUser = new Map<string, any>()
  if (userIds.length > 0) {
    const subs = await subscriptionsCol.find({ userId: { $in: userIds } }).toArray()
    for (const s of subs) {
      const uid = s.userId
      if (uid && (!subsByUser.has(uid) || (s.nextBillingDate && !subsByUser.get(uid).nextBillingDate)))
        subsByUser.set(uid, s)
    }
  }

  // Latest payment per user from payment_history
  const lastPaymentByUser = new Map<string, Date>()
  if (userIds.length > 0) {
    const latestPayments = await paymentHistoryCol
      .aggregate([
        { $match: { userId: { $in: userIds } } },
        { $sort: { paymentDate: -1 } },
        { $group: { _id: "$userId", paymentDate: { $first: "$paymentDate" } } },
      ])
      .toArray()
    for (const p of latestPayments) {
      if (p._id && p.paymentDate) lastPaymentByUser.set(p._id, p.paymentDate)
    }
  }

  const toIso = (d: Date | undefined | null) =>
    d == null ? null : d instanceof Date ? d.toISOString() : new Date(d).toISOString()

  /** Next payment = last payment + 1 billing period (monthly or yearly) */
  function addPeriod(date: Date, billingCycle: string | undefined): Date {
    const d = new Date(date)
    const cycle = (billingCycle || "monthly").toLowerCase()
    if (cycle === "yearly") {
      d.setFullYear(d.getFullYear() + 1)
    } else {
      d.setMonth(d.getMonth() + 1)
    }
    return d
  }

  const result = users.map((u: any) => {
    const uid = u._id?.toString()
    const sub = uid ? subsByUser.get(uid) : null
    const lastFromHistory = uid ? lastPaymentByUser.get(uid) : null

    const lastPaymentDate =
      u.lastPaymentDate != null
        ? toIso(u.lastPaymentDate)
        : lastFromHistory
          ? toIso(lastFromHistory)
          : u.paymentId
            ? toIso(u.createdAt)
            : null

    const lastPaymentAsDate =
      u.lastPaymentDate != null
        ? new Date(u.lastPaymentDate)
        : lastFromHistory
          ? new Date(lastFromHistory)
          : u.paymentId && u.createdAt
            ? new Date(u.createdAt)
            : null

    let nextPaymentDate: string | null =
      u.nextPaymentDate != null
        ? toIso(u.nextPaymentDate)
        : sub?.nextBillingDate != null
          ? toIso(sub.nextBillingDate)
          : sub?.currentPeriodEnd != null
            ? toIso(sub.currentPeriodEnd)
            : null

    if (nextPaymentDate == null && lastPaymentAsDate != null) {
      nextPaymentDate = toIso(addPeriod(lastPaymentAsDate, u.billingCycle))
    }
    if (nextPaymentDate == null && (u.trialEndDate || u.trialEndsAt || u.subscriptionEndDate) != null) {
      nextPaymentDate = toIso(u.trialEndDate || u.trialEndsAt || u.subscriptionEndDate)
    }

    return {
      id: uid,
      email: u.email,
      name: u.name,
      subscriptionPlanId: u.subscriptionPlanId || null,
      subscriptionStatus: u.subscriptionStatus || null,
      trialEndDate: u.trialEndDate || u.trialEndsAt || null,
      trialPaymentProcessed: u.trialPaymentProcessed || false,
      razorpayCustomerId: u.razorpayCustomerId || null,
      razorpayTokenId: u.razorpayTokenId || null,
      lastPaymentDate,
      nextPaymentDate,
      paymentFailedAt: u.paymentFailedAt || null,
      paymentFailureReason: u.paymentFailureReason || null,
    }
  })

  return NextResponse.json({ success: true, users: result })
})

