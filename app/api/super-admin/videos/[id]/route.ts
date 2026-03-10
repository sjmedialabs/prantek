import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { withSuperAdmin } from "@/lib/api-auth"
import { ObjectId } from "mongodb"

function getIdFromRequest(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split("/")
  return segments[segments.length - 1]
}

/** PUT - Update video */
export const PUT = withSuperAdmin(async (req: NextRequest) => {
  const db = await connectDB()
  const id = getIdFromRequest(req)
  if (!id) return NextResponse.json({ success: false, error: "ID required" }, { status: 400 })
  const body = await req.json()
  const update: Record<string, unknown> = { updatedAt: new Date() }
  if (typeof body.title === "string" && body.title.trim()) update.title = body.title.trim()
  if (typeof body.description === "string") update.description = body.description.trim()
  if (typeof body.youtubeUrl === "string" && body.youtubeUrl.trim()) update.youtubeUrl = body.youtubeUrl.trim()
  if (body.categoryId !== undefined) update.categoryId = body.categoryId ? String(body.categoryId) : null
  if (typeof body.tab === "string") update.tab = body.tab.trim() || "All"
  if (typeof body.order === "number") update.order = body.order
  if (body.duration !== undefined) update.duration = body.duration ? String(body.duration) : null
  const result = await db
    .collection(Collections.VIDEOS)
    .findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: update },
      { returnDocument: "after" }
    )
  if (!result)
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 })
  return NextResponse.json({ success: true, data: result })
})

/** DELETE - Delete video */
export const DELETE = withSuperAdmin(async (req: NextRequest) => {
  const db = await connectDB()
  const id = getIdFromRequest(req)
  if (!id) return NextResponse.json({ success: false, error: "ID required" }, { status: 400 })
  const result = await db.collection(Collections.VIDEOS).deleteOne({ _id: new ObjectId(id) })
  if (result.deletedCount === 0)
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 })
  return NextResponse.json({ success: true })
})
