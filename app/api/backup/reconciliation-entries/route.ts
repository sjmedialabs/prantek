import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { withAuth } from "@/lib/api-auth"

export const GET = withAuth(async (_req, user: any) => {
  try {
    const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId
    const db = await connectDB()
    const entries = await db
      .collection(Collections.RECONCILIATION_ENTRIES)
      .find({ userId: filterUserId })
      .toArray()
    const data = entries.map((e) => ({
      ...e,
      _id: e._id?.toString(),
    }))
    return NextResponse.json(data)
  } catch (error) {
    console.error("Backup reconciliation entries failed:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch reconciliation entries" },
      { status: 500 }
    )
  }
})
