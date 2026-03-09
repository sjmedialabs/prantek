/**
 * Subscription guard for protecting premium APIs.
 * Use with withAuth: requireActiveSubscription(handler) or check in handler and return 403.
 */

import { NextResponse } from "next/server"
import { connectDB } from "./mongodb"
import { Collections } from "./db-config"
import { ObjectId } from "mongodb"

export const SUBSCRIPTION_REQUIRED_MESSAGE = "Subscription required"

/**
 * Returns true if the user has an active subscription (status active/trial and period not ended).
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const db = await connectDB()
  const user = await db.collection(Collections.USERS).findOne({
    _id: new ObjectId(userId),
  })
  if (!user) return false
  if (user.role === "super-admin") return true

  const status = user.subscriptionStatus
  if (!status || status === "inactive" || status === "expired" || status === "payment_failed") return false
  if (status === "cancelled" || status === "past_due") {
    const end = user.subscriptionEndDate ? new Date(user.subscriptionEndDate) : null
    if (!end) return false
    return new Date() <= end
  }

  if (status === "active" || status === "trial") {
    const end = user.subscriptionEndDate ? new Date(user.subscriptionEndDate) : null
    if (end && new Date() > end) return false
    return true
  }

  const subDoc = await db.collection(Collections.SUBSCRIPTIONS).findOne({
    userId,
    status: "active",
  })
  if (subDoc) {
    if (subDoc.currentPeriodEnd && new Date(subDoc.currentPeriodEnd) < new Date()) return false
    return true
  }

  return false
}

/**
 * Use in API route: if (!(await hasActiveSubscription(user.userId))) return subscriptionRequiredResponse()
 */
export function subscriptionRequiredResponse() {
  return NextResponse.json(
    { error: SUBSCRIPTION_REQUIRED_MESSAGE },
    { status: 403 }
  )
}
