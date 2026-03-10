import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { withSuperAdmin } from "@/lib/api-auth"
import { ObjectId } from "mongodb"

/** GET - List all video categories (left menu items) */
export const GET = withSuperAdmin(async (_req: NextRequest) => {
  const db = await connectDB()
  const list = await db
    .collection(Collections.VIDEO_CATEGORIES)
    .find({})
    .sort({ order: 1 })
    .toArray()
  return NextResponse.json({ success: true, data: list })
})

/** POST - Create video category */
export const POST = withSuperAdmin(async (req: NextRequest) => {
  const db = await connectDB()
  const body = await req.json()
  const { name, order } = body
  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 })
  }
  const count = await db.collection(Collections.VIDEO_CATEGORIES).countDocuments()
  const doc = {
    name: name.trim(),
    order: typeof order === "number" ? order : count,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  const result = await db.collection(Collections.VIDEO_CATEGORIES).insertOne(doc)
  return NextResponse.json({
    success: true,
    data: { _id: result.insertedId, ...doc },
  })
})
