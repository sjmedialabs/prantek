import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { invalidateTrialCache } from "@/lib/trial-helper"

// GET - Get system settings (publicly accessible)
export async function GET(req: NextRequest) {
  try {
    const db = await getDb()
    const settings = await db.collection("system_settings").findOne({ _id: "global_config" })

    if (!settings) {
      // Return default settings if not found
      return NextResponse.json({
        success: true,
        data: {
          trialPeriodDays: 14
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        trialPeriodDays: settings.trialPeriodDays || 14
      }
    })
  } catch (error) {
    console.error("Error fetching system settings:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch system settings" },
      { status: 500 }
    )
  }
}

// PATCH - Update system settings
// Note: This endpoint should be called from super-admin pages only
// Access control is handled by Next.js middleware/routing
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { trialPeriodDays } = body

    // Validate trial period
    if (typeof trialPeriodDays !== "number" || trialPeriodDays < 1 || trialPeriodDays > 365) {
      return NextResponse.json(
        { success: false, error: "Trial period must be between 1 and 365 days" },
        { status: 400 }
      )
    }

    const db = await getDb()
    
    // Update or insert settings
    await db.collection("system_settings").updateOne(
      { _id: "global_config" },
      {
        $set: {
          trialPeriodDays,
          updatedAt: new Date()
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      },
      { upsert: true }
    )

    // Invalidate cache after update
    invalidateTrialCache()

    return NextResponse.json({
      success: true,
      message: "System settings updated successfully",
      data: {
        trialPeriodDays
      }
    })
  } catch (error) {
    console.error("Error updating system settings:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update system settings" },
      { status: 500 }
    )
  }
}
