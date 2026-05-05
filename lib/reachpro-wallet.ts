import { ObjectId } from "mongodb"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"

export const REACHPRO_FEATURES = [
  "clientGrouping",
  "bulkEmail",
  "bulkWhatsapp",
  "scheduledMessaging",
  "messageTemplates",
  "deliveryTracking",
  "communicationMetrics",
] as const

export async function getReachProConfig() {
  const db = await connectDB()
  return db.collection(Collections.SUBSCRIPTION_PLANS).findOne({
    $or: [
      { isReachPro: true },
      { isPayAsYouGo: true },
      { name: { $regex: /^reachpro$/i } }
    ],
    isActive: true,
  })
}

export type ReachProPricingRange = {
  minAmount: number
  maxAmount: number
  costPerMail: number
}

export function normalizeRanges(ranges: unknown): ReachProPricingRange[] {
  if (!Array.isArray(ranges)) return []
  return ranges
    .map((r: any) => ({
      minAmount: Number(r?.minAmount || 0),
      maxAmount: Number(r?.maxAmount || 0),
      costPerMail: Number(r?.costPerMail || 0),
    }))
    .filter((r) => r.minAmount > 0 && r.maxAmount >= r.minAmount && r.costPerMail > 0)
    .sort((a, b) => a.minAmount - b.minAmount)
}

export function validateRanges(ranges: ReachProPricingRange[]) {
  for (let i = 0; i < ranges.length; i++) {
    const current = ranges[i]
    if (!(current.minAmount < current.maxAmount) || current.costPerMail <= 0) {
      return { valid: false, error: "Invalid ReachPro pricing ranges." }
    }
    const prev = ranges[i - 1]
    if (prev && current.minAmount <= prev.maxAmount) {
      return { valid: false, error: "ReachPro pricing ranges must not overlap." }
    }
  }
  return { valid: true as const }
}

export function getMatchingRange(amount: number, ranges: ReachProPricingRange[]) {
  const safeAmount = Number(amount || 0)
  return ranges.find((r) => safeAmount >= r.minAmount && safeAmount <= r.maxAmount) || null
}

export async function getReachProWallet(userId: string) {
  const db = await connectDB()
  const wallet = await db.collection(Collections.REACHPRO_WALLETS).findOne({ userId: String(userId) })
  if (!wallet) return null

  // Backfill legacy wallets: balance exists but credits/rate were never initialized.
  const balance = Number(wallet.balance || 0)
  const currentCostPerMail = Number(wallet.currentCostPerMail || 0)
  const remainingMailCredits = Number(wallet.remainingMailCredits || 0)
  if (balance > 0 && (currentCostPerMail <= 0 || remainingMailCredits <= 0)) {
    const config = await getReachProConfig()
    const ranges = normalizeRanges((config as any)?.reachProPricingRanges || [])
    const matched = getMatchingRange(balance, ranges)
    const inferredRate = Number(matched?.costPerMail || 0)
    if (inferredRate > 0) {
      const inferredCredits = Math.floor(balance / inferredRate)
      await db.collection(Collections.REACHPRO_WALLETS).updateOne(
        { _id: wallet._id },
        {
          $set: {
            currentCostPerMail: inferredRate,
            remainingMailCredits: inferredCredits,
            totalPurchasedMailCredits: Math.max(Number(wallet.totalPurchasedMailCredits || 0), inferredCredits),
            activePricingRange: matched,
            isActive: balance > 0,
            updatedAt: new Date(),
          },
        },
      )
      return {
        ...wallet,
        currentCostPerMail: inferredRate,
        remainingMailCredits: inferredCredits,
        totalPurchasedMailCredits: Math.max(Number(wallet.totalPurchasedMailCredits || 0), inferredCredits),
        activePricingRange: matched,
      }
    }
  }

  return wallet
}

export async function ensureReachProWallet(userId: string) {
  const db = await connectDB()
  const existing = await db.collection(Collections.REACHPRO_WALLETS).findOne({ userId: String(userId) })
  if (existing) return existing
  const doc = {
    userId: String(userId),
    balance: 0,
    totalRecharge: 0,
    isActive: false,
    lastRechargeAt: null,
    currentCostPerMail: 0,
    remainingMailCredits: 0,
    totalPurchasedMailCredits: 0,
    activePricingRange: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  await db.collection(Collections.REACHPRO_WALLETS).insertOne(doc)
  return doc
}

export async function hasReachProAccess(userId: string) {
  const wallet = await getReachProWallet(userId)
  return Boolean(wallet?.isActive && Number(wallet.balance || 0) > 0)
}

export async function deductReachProBalance(input: {
  userId: string
  amount: number
  emailsDeducted?: number
  costPerMail?: number
  type: "email_campaign" | "whatsapp_campaign"
  referenceId?: string
}) {
  const db = await connectDB()
  const wallet = await getReachProWallet(input.userId)
  if (!wallet) return { success: false as const, error: "ReachPro top-up required to use communication features." }

  const amount = Number(input.amount || 0)
  const balanceBefore = Number(wallet.balance || 0)
  const fallbackRate = Number(input.costPerMail || wallet.currentCostPerMail || 0)
  const inferredCreditsFromBalance = fallbackRate > 0 ? Math.floor(balanceBefore / fallbackRate) : 0
  const creditsBefore = Math.max(Number(wallet.remainingMailCredits || 0), inferredCreditsFromBalance)
  const emailsDeducted = Number(input.emailsDeducted || 0)
  const costPerMail = fallbackRate
  if (balanceBefore < amount) {
    return { success: false as const, error: "Insufficient ReachPro balance. Please recharge." }
  }

  const balanceAfter = balanceBefore - amount
  const creditsAfter = Math.max(0, creditsBefore - emailsDeducted)
  await db.collection(Collections.REACHPRO_WALLETS).updateOne(
    { _id: wallet._id },
    {
      $set: {
        balance: balanceAfter,
        isActive: balanceAfter > 0,
        remainingMailCredits: creditsAfter,
        updatedAt: new Date(),
      },
    },
  )
  await db.collection(Collections.REACHPRO_TRANSACTIONS).insertOne({
    userId: String(input.userId),
    type: input.type,
    amount,
    emailsDeducted,
    costPerMail,
    taxAmount: 0,
    balanceBefore,
    balanceAfter,
    creditsBefore,
    creditsAfter,
    referenceId: input.referenceId || "",
    createdAt: new Date(),
    updatedAt: new Date(),
  })
  return { success: true as const, balanceAfter, creditsAfter }
}

export function canUseCommunicationFeature(planFeatures: Record<string, boolean> | null | undefined, key: string) {
  if (!planFeatures) return false
  return planFeatures[key] === true
}
