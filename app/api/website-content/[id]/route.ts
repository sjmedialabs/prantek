import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { withAuth } from "@/lib/api-auth"
import { ObjectId } from "mongodb"
function getIdFromRequest(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split("/")
  return segments[segments.length - 1]
}

export const PUT = withAuth(async (req: NextRequest, user: any) => {
  const db = await connectDB()
  const data = await req.json()
  const id = getIdFromRequest(req)
  
  // Build filter - super-admin can update any content
  const filter: any = { _id: new ObjectId(id) }
  if (user.role !== "super-admin") {
    filter.userId = String(user.id)
  }
  
  const contentData = await db
    .collection(Collections.WEBSITE_CONTENT)
    .findOneAndUpdate(
      filter,
      { $set: { ...data, updatedAt: new Date() } },
      { returnDocument: "after" },
    )

  if (!contentData) {
    return NextResponse.json({ error: "Content not found" }, { status: 404 })
  }

  return NextResponse.json(contentData)
})

export const DELETE = withAuth(async (req: NextRequest, user: any) => {
  const db = await connectDB()
  const id = getIdFromRequest(req)
  
  // Build filter - super-admin can delete any content
  const filter: any = { _id: new ObjectId(id) }
  if (user.role !== "super-admin") {
    filter.userId = user.userId
  }
  
  const result = await db
    .collection(Collections.WEBSITE_CONTENT)
    .deleteOne(filter)

  if (result.deletedCount === 0) {
    return NextResponse.json({ error: "Content not found" }, { status: 404 })
  }

  return NextResponse.json({ success: true })
})
