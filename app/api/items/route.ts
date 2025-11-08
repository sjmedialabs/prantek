import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { withAuth } from "@/lib/api-auth"


export const GET = withAuth(async (request: NextRequest, user: any) => {
  try {
    const db = await connectDB()

    // ✅ Always fetch all items belonging to logged-in user
    const filter = { userId: String(user.userId) }

    const items = await db
      .collection(Collections.ITEMS)
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({
      success: true,
      data: items,
      total: items.length,   // ✅ added (optional)
    })
  } catch (error) {
    console.error("GET /items error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch items" },
      { status: 500 }
    )
  }
})

// ✅ POST — create item

export const POST = withAuth(async (request: NextRequest, user: any) => {
  try {
    const db = await connectDB()
    const body = await request.json()

    const now = new Date()

    const newItem = {
      ...body,
      userId: String(user.userId),
      createdAt: now,
      updatedAt: now,
    }

    const result = await db.collection(Collections.ITEMS).insertOne(newItem)

    return NextResponse.json({
      success: true,
      data: { ...newItem, _id: result.insertedId },
    })
  } catch (error) {
    console.error("POST /items error:", error)
    return NextResponse.json({ success: false, error: "Failed to create item" }, { status: 500 })
  }
})