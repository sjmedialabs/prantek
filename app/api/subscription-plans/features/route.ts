import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { ObjectId } from "mongodb"
import { PLAN_FEATURE_KEYS } from "@/lib/models/types"

export async function PATCH(request: NextRequest) {
  try {
    const db = await connectDB()
    const data = await request.json()
    
    const { planId, featureKey, enabled } = data
    
    if (!planId) {
      return NextResponse.json({ success: false, error: "Plan ID is required" }, { status: 400 })
    }
    
    if (!featureKey) {
      return NextResponse.json({ success: false, error: "Feature key is required" }, { status: 400 })
    }
    
    if (typeof enabled !== "boolean") {
      return NextResponse.json({ success: false, error: "Enabled must be a boolean" }, { status: 400 })
    }
    
    if (!PLAN_FEATURE_KEYS.includes(featureKey as any)) {
      return NextResponse.json({ 
        success: false, 
        error: `Invalid feature key. Must be one of: ${PLAN_FEATURE_KEYS.join(", ")}` 
      }, { status: 400 })
    }
    
    const existingPlan = await db.collection(Collections.SUBSCRIPTION_PLANS).findOne({
      _id: new ObjectId(planId)
    })
    
    if (!existingPlan) {
      return NextResponse.json({ success: false, error: "Plan not found" }, { status: 404 })
    }
    
    const currentPlanFeatures = existingPlan.planFeatures || {
      userCreation: false,
      advancedAnalytics: false,
      exportReports: false,
      apiAccess: false,
      customBranding: false,
      rbac: false,
    }
    
    currentPlanFeatures[featureKey] = enabled
    
    const result = await db.collection(Collections.SUBSCRIPTION_PLANS).updateOne(
      { _id: new ObjectId(planId) },
      { 
        $set: { 
          planFeatures: currentPlanFeatures,
          updatedAt: new Date() 
        } 
      }
    )
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: "Plan not found" }, { status: 404 })
    }
    
    const updatedPlan = await db.collection(Collections.SUBSCRIPTION_PLANS).findOne({ 
      _id: new ObjectId(planId) 
    })
    
    return NextResponse.json({ 
      success: true, 
      data: updatedPlan,
      message: `Feature '${featureKey}' ${enabled ? 'enabled' : 'disabled'} for plan successfully`
    })
  } catch (error) {
    console.error("Error updating plan features:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Failed to update plan features" 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await connectDB()
    const data = await request.json()
    
    const { planId, planFeatures } = data
    
    if (!planId) {
      return NextResponse.json({ success: false, error: "Plan ID is required" }, { status: 400 })
    }
    
    if (!planFeatures || typeof planFeatures !== "object") {
      return NextResponse.json({ success: false, error: "Plan features object is required" }, { status: 400 })
    }
    
    for (const key of Object.keys(planFeatures)) {
      if (!PLAN_FEATURE_KEYS.includes(key as any)) {
        return NextResponse.json({ 
          success: false, 
          error: `Invalid feature key: ${key}. Must be one of: ${PLAN_FEATURE_KEYS.join(", ")}` 
        }, { status: 400 })
      }
      
      if (typeof planFeatures[key] !== "boolean") {
        return NextResponse.json({ 
          success: false, 
          error: `Feature value for '${key}' must be a boolean` 
        }, { status: 400 })
      }
    }
    
    const result = await db.collection(Collections.SUBSCRIPTION_PLANS).updateOne(
      { _id: new ObjectId(planId) },
      { 
        $set: { 
          planFeatures,
          updatedAt: new Date() 
        } 
      }
    )
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: "Plan not found" }, { status: 404 })
    }
    
    const updatedPlan = await db.collection(Collections.SUBSCRIPTION_PLANS).findOne({ 
      _id: new ObjectId(planId) 
    })
    
    return NextResponse.json({ 
      success: true, 
      data: updatedPlan,
      message: "Plan features updated successfully"
    })
  } catch (error) {
    console.error("Error updating plan features:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Failed to update plan features" 
    }, { status: 500 })
  }
}
