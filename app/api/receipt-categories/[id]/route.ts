import { withAuth } from "@/lib/api-auth"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { ObjectId } from "mongodb"
import { NextRequest, NextResponse } from "next/server"

function getId(req: NextRequest) {
  return req.nextUrl.pathname.split("/").pop()!
}

export const GET = withAuth(async (req: NextRequest, user: any) => {
  const db = await connectDB()
  const id = getId(req)

  // For admin users, filter by companyId (parent account)
  // For regular users, filter by userId (their own account)
  const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId

  const cat = await db.collection(Collections.RECEIPT_CATEGORIES).findOne({
    _id: new ObjectId(id),
    userId: String(filterUserId),
  })

  if (!cat) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json({ data: cat })
})

export const PUT = withAuth(async (req: NextRequest, user: any) => {
  const db = await connectDB()
  const id = getId(req)
  const body = await req.json()

  delete body._id
  delete body.id

  // For admin users, filter by companyId (parent account)
  // For regular users, filter by userId (their own account)
  const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId

  const updated = await db.collection(Collections.RECEIPT_CATEGORIES).findOneAndUpdate(
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
  const id = getId(req)

  // For admin users, filter by companyId (parent account)
  // For regular users, filter by userId (their own account)
  const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId

  await db.collection(Collections.RECEIPT_CATEGORIES).deleteOne({
    _id: new ObjectId(id),
    userId: String(filterUserId),
  })

  return NextResponse.json({ message: "Deleted successfully" })
})
