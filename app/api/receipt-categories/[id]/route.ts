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

  const cat = await db.collection(Collections.RECEIPT_CATEGORIES).findOne({
    _id: new ObjectId(id),
    userId: String(user.id),
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

  const updated = await db.collection(Collections.RECEIPT_CATEGORIES).findOneAndUpdate(
    { _id: new ObjectId(id), userId: String(user.id) },
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

  await db.collection(Collections.RECEIPT_CATEGORIES).deleteOne({
    _id: new ObjectId(id),
    userId: String(user.id),
  })

  return NextResponse.json({ message: "Deleted successfully" })
})
