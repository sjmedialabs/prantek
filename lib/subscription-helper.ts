/**
 * Subscription Helper Utilities
 * Handles plan-based feature access control
 */

import { connectDB } from "./mongodb"
import { Collections } from "./db-config"
import { ObjectId } from "mongodb"

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

    // Super admins always have access
    if (user.role === "super-admin") {
      return true
    }

    // If no subscription plan, deny access
    if (!user.subscriptionPlanId) {
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
 */
export async function getUserSubscriptionPlan(userId: string) {
  try {
    const db = await connectDB()
    
    const user = await db.collection(Collections.USERS).findOne({
      _id: new ObjectId(userId)
    })

    if (!user || !user.subscriptionPlanId) {
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
