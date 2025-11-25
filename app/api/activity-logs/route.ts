import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { withAuth } from "@/lib/api-auth"

export const GET = withAuth(async (req: NextRequest, user: any) => {
  const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId
  const db = await connectDB()
  const { searchParams } = new URL(req.url)
  const page = Number.parseInt(searchParams.get("page") || "1")
  const limit = Number.parseInt(searchParams.get("limit") || "50")
  const skip = (page - 1) * limit

  const logs = await db
    .collection(Collections.ACTIVITY_LOGS)
    .find({ userId: filterUserId })
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit)
    .toArray()

  const total = await db.collection(Collections.ACTIVITY_LOGS).countDocuments({ userId: filterUserId })

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
