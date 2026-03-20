/**
 * Central rules for excluding subscribers from MRR / revenue aggregates
 * (free plans, comped assignments, or explicit plan flag).
 */

export type PlanForRevenue = {
  price?: number | string
  isFreePlan?: boolean
} | null | undefined

export type UserForRevenue = {
  billingCycle?: string
  subscriptionRevenueExcluded?: boolean
}

export function isPlanFreeForRevenue(plan: PlanForRevenue): boolean {
  if (!plan) return false
  if (plan.isFreePlan === true) return true
  const p = Number(plan.price ?? 0)
  return !Number.isFinite(p) || p === 0
}

/** If true, subscriber should not contribute to dashboard/sales/subscription revenue figures */
export function shouldExcludeSubscriberFromMRR(user: UserForRevenue, plan: PlanForRevenue): boolean {
  if (user?.subscriptionRevenueExcluded === true) return true
  return isPlanFreeForRevenue(plan)
}

/**
 * Monthly-equivalent recurring amount for one subscriber (0 when waived / free plan).
 */
export function subscriberMRRAmount(
  user: UserForRevenue,
  plan: PlanForRevenue,
  yearlyDiscountPercent: number,
): number {
  if (shouldExcludeSubscriberFromMRR(user, plan)) return 0
  const planPrice = Number(plan && (plan as { price?: number | string }).price != null ? (plan as any).price : 0)
  if (!planPrice || !Number.isFinite(planPrice)) return 0

  if (user.billingCycle === "yearly") {
    const yearlyPrice = planPrice * 12
    const discountAmount = Math.round(yearlyPrice * (yearlyDiscountPercent / 100))
    return yearlyPrice - discountAmount
  }
  return planPrice
}
