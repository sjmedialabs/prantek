import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { withAuth } from "@/lib/api-auth"
import { ObjectId } from "mongodb"

// ✅ helper
function getIdFromRequest(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split("/")
  return segments[segments.length - 1]
}


export const PUT =  withAuth(async (req: NextRequest, user: any) => {
  const db = await connectDB()
  const data = await req.json()
  const id = getIdFromRequest(req)

  // For admin users, filter by companyId (parent account)
  // For regular users, filter by userId (their own account)
  const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId

  const result = await db
    .collection(Collections.TAX_RATES)
    .findOneAndUpdate(
      { _id: new ObjectId(id), userId: String(filterUserId) },
      { $set: { ...data, updatedAt: new Date() } },
      { returnDocument: "after" },
    )

  // if (!result) {
  //   return NextResponse.json({ error: "Tax rate not found" }, { status: 404 })
  // }

  return NextResponse.json({ role: result }, { status: 200 })
})

export const DELETE = withAuth(async (req: NextRequest, user: any) => {
  const db = await connectDB()
  const id = getIdFromRequest(req)

  // For admin users, filter by companyId (parent account)
  // For regular users, filter by userId (their own account)
  const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId

  const result = await db
    .collection(Collections.TAX_RATES)
    .deleteOne(      { _id: new ObjectId(id), userId: String(filterUserId) },)

  if (result.deletedCount === 0) {
    return NextResponse.json({ error: "Tax rate not found" }, { status: 404 })
  }

  return NextResponse.json({ success: true })
})
