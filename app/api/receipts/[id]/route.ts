import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { withAuth } from "@/lib/api-auth"
import { ObjectId } from "mongodb"

// Helper: extract last segment (/api/receipts/ID)
function getIdFromRequest(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split("/")
  return segments[segments.length - 1]
}

/**
 * GET — Get receipt detail
 */
export const GET = withAuth(async (req: NextRequest, user: any) => {
  const db = await connectDB()

  const id = getIdFromRequest(req)

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid receipt ID" }, { status: 400 })
  }

  // For admin users, filter by companyId (parent account)
  // For regular users, filter by userId (their own account)
  const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId

  const receipt = await db
    .collection(Collections.RECEIPTS)
    .findOne({
      _id: new ObjectId(id),
      userId: filterUserId,
    })

  if (!receipt) {
    return NextResponse.json({ error: "Receipt not found" }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: receipt })
})

/**
 * PUT — Update receipt
 */
export const PUT = withAuth(async (req: NextRequest, user: any) => {
  const db = await connectDB()

  const id = getIdFromRequest(req)

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid receipt ID" }, { status: 400 })
  }

  const body = await req.json()
  const { _id, ...updateData } = body

  // For admin users, filter by companyId (parent account)
  // For regular users, filter by userId (their own account)
  const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId

  const result = await db
    .collection(Collections.RECEIPTS)
    .updateOne(
      { _id: new ObjectId(id), userId: filterUserId },
      { $set: { ...updateData, updatedAt: new Date() } }
    )

  if (result.matchedCount === 0) {
    return NextResponse.json({ error: "Receipt not found" }, { status: 404 })
  }

  const updatedReceipt = await db
    .collection(Collections.RECEIPTS)
    .findOne({ _id: new ObjectId(id) })

  return NextResponse.json({ success: true, data: updatedReceipt })
})

/**
 * DELETE — Delete receipt
 */
export const DELETE = withAuth(async (req: NextRequest, user: any) => {
  const db = await connectDB()

  const id = getIdFromRequest(req)

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid receipt ID" }, { status: 400 })
  }

  // For admin users, filter by companyId (parent account)
  // For regular users, filter by userId (their own account)
  const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId

  const result = await db
    .collection(Collections.RECEIPTS)
    .deleteOne({ _id: new ObjectId(id), userId: filterUserId })

  if (result.deletedCount === 0) {
    return NextResponse.json({ error: "Receipt not found" }, { status: 404 })
  }

  return NextResponse.json({ success: true, message: "Receipt deleted successfully" })
})
