import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { withSuperAdmin } from "@/lib/api-auth"
import { ObjectId } from "mongodb"

function getIdFromRequest(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split("/")
  return segments[segments.length - 1]
}

/** PUT - Update video category */
export const PUT = withSuperAdmin(async (req: NextRequest) => {
  const db = await connectDB()
  const id = getIdFromRequest(req)
  if (!id) return NextResponse.json({ success: false, error: "ID required" }, { status: 400 })
  const body = await req.json()
  const update: Record<string, unknown> = { updatedAt: new Date() }
  if (typeof body.name === "string" && body.name.trim()) update.name = body.name.trim()
  if (typeof body.order === "number") update.order = body.order
  const result = await db
    .collection(Collections.VIDEO_CATEGORIES)
    .findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: update },
      { returnDocument: "after" }
    )
  if (!result)
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 })
  return NextResponse.json({ success: true, data: result })
})

/** DELETE - Delete video category; videos in this category are unassigned */
export const DELETE = withSuperAdmin(async (req: NextRequest) => {
  const db = await connectDB()
  const id = getIdFromRequest(req)
  if (!id) return NextResponse.json({ success: false, error: "ID required" }, { status: 400 })
  const result = await db.collection(Collections.VIDEO_CATEGORIES).deleteOne({ _id: new ObjectId(id) })
  if (result.deletedCount === 0)
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 })
  await db.collection(Collections.VIDEOS).updateMany(
    { categoryId: id },
    { $unset: { categoryId: "" } }
  )
  return NextResponse.json({ success: true })
})
