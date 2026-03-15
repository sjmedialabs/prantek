import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { withAuth } from "@/lib/api-auth"

export const GET = withAuth(async (_req, user: any) => {
  try {
    const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId
    const db = await connectDB()
    const statements = await db
      .collection(Collections.BANK_STATEMENTS)
      .find({ userId: filterUserId })
      .toArray()
    const data = statements.map((s) => ({
      ...s,
      _id: s._id?.toString(),
    }))
    return NextResponse.json(data)
  } catch (error) {
    console.error("Backup bank statements failed:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch bank statements" },
      { status: 500 }
    )
  }
})
