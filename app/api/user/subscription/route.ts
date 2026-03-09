import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { withAuth } from "@/lib/api-auth"
import { ObjectId } from "mongodb"

/**
 * GET /api/user/subscription
 * Returns current subscription for the authenticated user.
 * Uses subscriptions collection when available, else falls back to user fields.
 */
export const GET = withAuth(async (request: NextRequest, user) => {
  const db = await connectDB()
  const userId = user.userId

  const subscriptionDoc = await db.collection(Collections.SUBSCRIPTIONS).findOne({
    userId,
    status: { $in: ["active", "created", "pending"] },
  })

  const userDoc = await db.collection(Collections.USERS).findOne({
    _id: new ObjectId(userId),
  })

  const planId = subscriptionDoc?.planId || userDoc?.subscriptionPlanId
  let planName = "—"
  if (planId) {
    const plan = await db.collection(Collections.SUBSCRIPTION_PLANS).findOne({
      _id: new ObjectId(planId),
    })
    planName = plan?.name ?? plan?.planName ?? "—"
  }

  const status = subscriptionDoc?.status ?? userDoc?.subscriptionStatus ?? "inactive"
  const nextBillingDate = subscriptionDoc?.nextBillingDate ?? userDoc?.subscriptionEndDate ?? userDoc?.nextPaymentDate
  const nextDate = nextBillingDate ? new Date(nextBillingDate) : null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const daysRemaining = nextDate && nextDate >= today ? Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : 0

  const autoDebit = subscriptionDoc?.autoDebitEnabled ?? !!(userDoc?.razorpayCustomerId && userDoc?.razorpayTokenId)

  const paymentHistory = await db
    .collection(Collections.PAYMENT_HISTORY)
    .find({ $or: [{ userId }, { userId: new ObjectId(userId) }] })
    .sort({ paymentDate: -1 })
    .limit(10)
    .project({ razorpayPaymentId: 1, amount: 1, currency: 1, status: 1, paymentDate: 1 })
    .toArray()

  return NextResponse.json({
    success: true,
    plan: planName,
    status,
    autoDebit,
    nextBillingDate: nextDate ? nextDate.toISOString().slice(0, 10) : null,
    daysRemaining,
    razorpaySubscriptionId: subscriptionDoc?.razorpaySubscriptionId ?? userDoc?.razorpaySubscriptionId ?? null,
    paymentHistory: paymentHistory.map((p: any) => ({
      id: p.razorpayPaymentId,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      date: p.paymentDate,
    })),
  })
})
