import { withAuth } from "@/lib/api-auth"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { ObjectId } from "mongodb"
import { NextRequest, NextResponse } from "next/server"

function getIdFromRequest(req: NextRequest) {
  return req.nextUrl.pathname.split("/").pop()!
}

export const GET = withAuth(async (req: NextRequest, user: any) => {
  // For admin users, filter by companyId (parent account)
  // For regular users, filter by userId (their own account)
  const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId

  const db = await connectDB()
  const id = getIdFromRequest(req)

  const item = await db.collection(Collections.PAYMENT_METHODS).findOne({
    _id: new ObjectId(id),
    userId: String(filterUserId),
  })

  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json({ data: item })
})

export const PUT = withAuth(async (req: NextRequest, user: any) => {
  const db = await connectDB()
  const id = getIdFromRequest(req)
  const body = await req.json()

  // Required to avoid Mongo _id update crash
  delete body._id
  delete body.id

  const updated = await db.collection(Collections.PAYMENT_METHODS).findOneAndUpdate(
    { _id: new ObjectId(id), userId: String(filterUserId) },
    { $set: { ...body, updatedAt: new Date() } },
    { returnDocument: "after" }
  )

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json({ data: updated })
})

export const DELETE = withAuth(async (req: NextRequest, user: any) => {
  const db = await connectDB()
  const id = getIdFromRequest(req)

  await db.collection(Collections.PAYMENT_METHODS).deleteOne({
    _id: new ObjectId(id),
    userId: String(filterUserId),
  })

  return NextResponse.json({ message: "Deleted successfully" })
})
