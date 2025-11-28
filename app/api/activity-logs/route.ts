import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { withAuth } from "@/lib/api-auth"

export const GET = withAuth(async (req: NextRequest, user: any) => {
  const db = await connectDB()
  const { searchParams } = new URL(req.url)
  const page = Number.parseInt(searchParams.get("page") || "1")
  const limit = Number.parseInt(searchParams.get("limit") || "50")
  const skip = (page - 1) * limit
  const category = searchParams.get("category") || ""

  // Build query filter
  let query: any = {}
  
  // For super admin, show all logs; for regular users, filter by userId
  if (user.role !== "super-admin") {
    const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId
    query.userId = filterUserId
  }
  
  // Add category filter if specified
  if (category) {
    query.category = category
  }

  const logs = await db
    .collection(Collections.ACTIVITY_LOGS)
    .find(query)
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit)
    .toArray()

  const total = await db.collection(Collections.ACTIVITY_LOGS).countDocuments(query)

  return NextResponse.json({
    data: logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
})
