import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import {
  createCustomer,
  createPlan,
  createSubscription,
  getRazorpayInstance,
} from "@/lib/razorpay"
import { ObjectId } from "mongodb"

/**
 * POST /api/razorpay/create-subscription
 * Body: { planId: string, userId?: string, name: string, email: string, contact?: string }
 * Creates Razorpay customer (if needed), plan (if not exists), subscription.
 * Returns { subscriptionId, shortUrl } for frontend to open Checkout with subscription.
 * Used when you want subscription-based checkout instead of one-time order.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { planId, userId, name, email, contact } = body
    if (!planId || !name || !email) {
      return NextResponse.json(
        { success: false, error: "planId, name, and email are required" },
        { status: 400 }
      )
    }

    const db = await connectDB()
    const plan = await db.collection(Collections.SUBSCRIPTION_PLANS).findOne({
      _id: new ObjectId(planId),
    })
    if (!plan) {
      return NextResponse.json({ success: false, error: "Plan not found" }, { status: 404 })
    }

    let customerId: string
    const existingUser = userId
      ? await db.collection(Collections.USERS).findOne({ _id: new ObjectId(userId) })
      : null
    if (existingUser?.razorpayCustomerId) {
      customerId = existingUser.razorpayCustomerId
    } else {
      const customer = await createCustomer({
        name,
        email,
        contact: contact || "",
      })
      customerId = (customer as any).id
      if (userId) {
        await db.collection(Collections.USERS).updateOne(
          { _id: new ObjectId(userId) },
          { $set: { razorpayCustomerId: customerId, updatedAt: new Date() } }
        )
      }
    }

    let razorpayPlanId = plan.razorpayPlanId
    if (!razorpayPlanId) {
      const period = plan.billingCycle === "yearly" ? "yearly" : "monthly"
      const rpPlan = await createPlan({
        name: plan.name || plan.planName || "Plan",
        period,
        interval: 1,
        amount: Math.round((plan.price || 0) * 100),
        currency: "INR",
      })
      razorpayPlanId = (rpPlan as any).id
      await db.collection(Collections.SUBSCRIPTION_PLANS).updateOne(
        { _id: new ObjectId(planId) },
        { $set: { razorpayPlanId, updatedAt: new Date() } }
      )
    }

    const now = Math.floor(Date.now() / 1000)
    const sub = await createSubscription({
      planId: razorpayPlanId,
      customerId,
      totalCount: 12,
      startAt: now,
      customerNotify: 1,
      notes: userId ? { user_id: userId, plan_id: planId } : { plan_id: planId },
    })

    const subId = (sub as any).id
    const shortUrl = (sub as any).short_url

    if (userId) {
      await db.collection(Collections.SUBSCRIPTIONS).insertOne({
        userId,
        planId,
        razorpayCustomerId: customerId,
        razorpaySubscriptionId: subId,
        status: "created",
        autoDebitEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      await db.collection(Collections.USERS).updateOne(
        { _id: new ObjectId(userId) },
        { $set: { razorpaySubscriptionId: subId, updatedAt: new Date() } }
      )
    }

    return NextResponse.json({
      success: true,
      subscriptionId: subId,
      shortUrl,
    })
  } catch (err: any) {
    console.error("[create-subscription]", err)
    return NextResponse.json(
      { success: false, error: err?.message ?? "Failed to create subscription" },
      { status: 500 }
    )
  }
}
