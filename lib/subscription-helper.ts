/**
 * Subscription Helper Utilities
 * Handles plan-based feature access control
 */

import { connectDB } from "./mongodb"
import { Collections } from "./db-config"
import { ObjectId } from "mongodb"

/**
 * Check if user has an active subscription
 * Returns false if:
 * - No subscription plan
 * - Status is "cancelled" and past end date
 * - Status is "expired"
 */
async function hasActiveSubscription(user: any): Promise<boolean> {
  // Super admins always have access
  if (user.role === "super-admin") {
    return true
  }

  // No subscription plan
  if (!user.subscriptionPlanId) {
    return false
  }

  // Check subscription status
  const status = user.subscriptionStatus

  // If cancelled, check if still within validity period
  if (status === "cancelled") {
    if (!user.subscriptionEndDate) {
      return false
    }
    const endDate = new Date(user.subscriptionEndDate)
    const now = new Date()
    return now <= endDate
  }

  // If expired, no access
  if (status === "expired" || status === "inactive") {
    return false
  }

  // Active or trial status
  return status === "active" || status === "trial"
}

/**
 * Check if a user's subscription plan allows role/permission management
 * Plan 1 (Basic) - No permission management
 * Plan 2 & Plan 3 - Has permission management
 */
export async function canManagePermissions(userId: string): Promise<boolean> {
  try {
    const db = await connectDB()
    
    // Get user with subscription details
    const user = await db.collection(Collections.USERS).findOne({
      _id: new ObjectId(userId)
    })

    if (!user) {
      return false
    }

    // Check if user has active subscription
    if (!await hasActiveSubscription(user)) {
      return false
    }

    // Get the subscription plan
    const plan = await db.collection(Collections.SUBSCRIPTION_PLANS).findOne({
      _id: new ObjectId(user.subscriptionPlanId)
    })

    if (!plan) {
      return false
    }

    // Check if plan name indicates it's a basic plan (Plan 1)
    // You can adjust this logic based on your actual plan naming
    const planName = (plan.name || "").toLowerCase()
    
    // Deny access for Plan 1, Basic, or similar names
    if (
      planName.includes("plan 1") ||
      planName.includes("basic") ||
      planName === "standard" // adjust as needed
    ) {
      return false
    }

    // Allow access for Plan 2, Plan 3, Premium, etc.
    return true
  } catch (error) {
    console.error("Error checking permission management access:", error)
    return false
  }
}

/**
 * Get user's subscription plan details
 * Returns null if subscription is not active
 */
export async function getUserSubscriptionPlan(userId: string) {
  try {
    const db = await connectDB()
    
    const user = await db.collection(Collections.USERS).findOne({
      _id: new ObjectId(userId)
    })

    if (!user) {
      return null
    }

    // Check if user has active subscription
    if (!await hasActiveSubscription(user)) {
      return null
    }

    if (!user.subscriptionPlanId) {
      return null
    }

    const plan = await db.collection(Collections.SUBSCRIPTION_PLANS).findOne({
      _id: new ObjectId(user.subscriptionPlanId)
    })

    return plan
  } catch (error) {
    console.error("Error fetching subscription plan:", error)
    return null
  }
}

/**
 * Check if a specific feature is available in user's plan
 */
export async function hasFeatureAccess(
  userId: string,
  featureName: string
): Promise<boolean> {
  try {
    const plan = await getUserSubscriptionPlan(userId)
    
    if (!plan) {
      return false
    }

    // Check if the feature is in the plan's features array
    const features = plan.features || []
    return features.some((f: string) => 
      f.toLowerCase().includes(featureName.toLowerCase())
    )
  } catch (error) {
    console.error("Error checking feature access:", error)
    return false
  }
}

/**
 * Check if a specific plan feature is enabled for the user
 * Uses the new granular planFeatures object
 * @param userId - User ID to check
 * @param featureKey - Feature key from PlanFeatures (e.g., 'userCreation', 'advancedAnalytics')
 * @returns Promise<boolean> - true if feature is enabled, false otherwise
 */
export async function checkPlanFeature(
  userId: string,
  featureKey: string
): Promise<boolean> {
  try {
    const db = await connectDB()
    
    const user = await db.collection(Collections.USERS).findOne({
      _id: new ObjectId(userId)
    })

    if (!user) {
      return false
    }

    // Super admins have access to all features
    if (user.role === "super-admin") {
      return true
    }

    // Check if user has active subscription
    if (!await hasActiveSubscription(user)) {
      return false
    }

    if (!user.subscriptionPlanId) {
      return false
    }

    const plan = await db.collection(Collections.SUBSCRIPTION_PLANS).findOne({
      _id: new ObjectId(user.subscriptionPlanId)
    })

    if (!plan) {
      return false
    }

    // Check the new planFeatures object
    if (plan.planFeatures && typeof plan.planFeatures === "object") {
      return plan.planFeatures[featureKey] === true
    }

    // Fallback: if planFeatures doesn't exist, deny access
    return false
  } catch (error) {
    console.error("Error checking plan feature:", error)
    return false
  }
}

/**
 * Get all enabled features for a user's plan
 * @param userId - User ID to check
 * @returns Promise<string[]> - Array of enabled feature keys
 */
export async function getUserEnabledFeatures(userId: string): Promise<string[]> {
  try {
    const plan = await getUserSubscriptionPlan(userId)
    
    if (!plan || !plan.planFeatures) {
      return []
    }

    // Return array of enabled feature keys
    return Object.entries(plan.planFeatures)
      .filter(([_, enabled]) => enabled === true)
      .map(([key, _]) => key)
  } catch (error) {
    console.error("Error getting enabled features:", error)
    return []
  }
}
