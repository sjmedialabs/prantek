import { ObjectId } from "mongodb"
import { Collections } from "@/lib/db-config"
import { connectDB } from "@/lib/mongodb"

const REACHPRO_PLAN_NAME = "reachpro"
const DEFAULT_GST_RATE = 0.18

export type ReachProTransactionType = "recharge" | "email_campaign" | "bulk_message"

export function normalizePlanName(name?: string): string {
  return String(name || "").trim().toLowerCase()
}

export function isReachProPlan(plan?: { name?: string; isPayAsYouGo?: boolean } | null): boolean {
  if (!plan) return false
  return Boolean(plan.isPayAsYouGo) || normalizePlanName(plan.name) === REACHPRO_PLAN_NAME
}

export function calculateTaxBreakdown(amount: number, taxIncluded: boolean) {
  const safeAmount = Number(amount) || 0
  if (!taxIncluded) {
    return {
      baseAmount: safeAmount,
      taxAmount: 0,
      totalPayable: safeAmount,
    }
  }

  const taxAmount = Math.round(safeAmount * DEFAULT_GST_RATE)
  return {
    baseAmount: safeAmount,
    taxAmount,
    totalPayable: safeAmount + taxAmount,
  }
}

export async function getUserWithPlan(userId: string) {
  const db = await connectDB()
  const user = await db.collection(Collections.USERS).findOne({ _id: new ObjectId(userId) })
  if (!user?.subscriptionPlanId) {
    return { db, user, plan: null }
  }

  let plan = null
  if (ObjectId.isValid(String(user.subscriptionPlanId))) {
    plan = await db.collection(Collections.SUBSCRIPTION_PLANS).findOne({
      _id: new ObjectId(String(user.subscriptionPlanId)),
    })
  }

  return { db, user, plan }
}

export async function createReachProTransaction(input: {
  userId: string
  type: ReachProTransactionType
  amount: number
  taxAmount?: number
  balanceBefore: number
  balanceAfter: number
  referenceId?: string
}) {
  const db = await connectDB()
  await db.collection(Collections.REACHPRO_TRANSACTIONS).insertOne({
    userId: input.userId,
    type: input.type,
    amount: Number(input.amount) || 0,
    taxAmount: Number(input.taxAmount) || 0,
    balanceBefore: Number(input.balanceBefore) || 0,
    balanceAfter: Number(input.balanceAfter) || 0,
    referenceId: input.referenceId || "",
    createdAt: new Date(),
    updatedAt: new Date(),
  })
}
