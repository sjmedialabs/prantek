import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { withSuperAdmin } from "@/lib/api-auth"
import { ObjectId } from "mongodb"

/** GET - List videos; optional ?categoryId= to filter by category */
export const GET = withSuperAdmin(async (req: NextRequest) => {
  const db = await connectDB()
  const categoryId = req.nextUrl.searchParams.get("categoryId")
  const query = categoryId ? { categoryId } : {}
  const list = await db
    .collection(Collections.VIDEOS)
    .find(query)
    .sort({ categoryId: 1, tab: 1, order: 1 })
    .toArray()
  return NextResponse.json({ success: true, data: list })
})

/** POST - Create video (title, description, youtubeUrl, categoryId, tab, order, duration?) */
export const POST = withSuperAdmin(async (req: NextRequest) => {
  const db = await connectDB()
  const body = await req.json()
  const { title, description, youtubeUrl, categoryId, tab, order, duration } = body
  if (!title || typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ success: false, error: "Title is required" }, { status: 400 })
  }
  if (!youtubeUrl || typeof youtubeUrl !== "string" || !youtubeUrl.trim()) {
    return NextResponse.json({ success: false, error: "YouTube URL is required" }, { status: 400 })
  }
  const count = await db.collection(Collections.VIDEOS).countDocuments(categoryId ? { categoryId } : {})
  const doc = {
    title: title.trim(),
    description: typeof description === "string" ? description.trim() : "",
    youtubeUrl: youtubeUrl.trim(),
    categoryId: categoryId && String(categoryId).trim() ? String(categoryId).trim() : null,
    tab: typeof tab === "string" && tab.trim() ? tab.trim() : "All",
    order: typeof order === "number" ? order : count,
    duration: typeof duration === "string" ? duration.trim() : null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  const result = await db.collection(Collections.VIDEOS).insertOne(doc)
  return NextResponse.json({
    success: true,
    data: { _id: result.insertedId, ...doc },
  })
})
