import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { withAuth } from "@/lib/api-auth"

export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    // Only super-admin can access this endpoint
    if (user.role !== "super-admin") {
      return NextResponse.json({ 
        success: false, 
        error: "Unauthorized" 
      }, { status: 403 })
    }

    const db = await connectDB()

    // Aggregate admin users by companyId
    const adminUserCounts = await db.collection(Collections.ADMIN_USERS)
      .aggregate([
        {
          $group: {
            _id: "$companyId",
            count: { $sum: 1 }
          }
        }
      ])
      .toArray()

    // Convert to a map for easy lookup
    const countMap: Record<string, number> = {}
    adminUserCounts.forEach(item => {
      if (item._id) {
        countMap[item._id.toString()] = item.count
      }
    })

    return NextResponse.json({ 
      success: true, 
      data: countMap
    })
  } catch (error) {
    console.error("Error fetching admin user counts:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Failed to fetch admin user counts" 
    }, { status: 500 })
  }
})
