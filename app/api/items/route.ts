import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { withAuth } from "@/lib/api-auth"
import { logActivity } from "@/lib/mongodb-store"


export const GET = withAuth(async (request: NextRequest, user: any) => {
  try {
    const db = await connectDB()

    // For admin users, filter by companyId (parent account)
    // For regular users, filter by userId (their own account)
    const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId
    const filter = { userId: String(filterUserId) }

    const items = await db
      .collection(Collections.ITEMS)
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({
      success: true,
      data: items,
      total: items.length,
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

    // For admin users, use companyId (parent account)
    // For regular users, use userId (their own account)
    const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId

    const now = new Date()

    const newItem = {
      ...body,
      userId: String(filterUserId),
      createdAt: now,
      updatedAt: now,
    }

    const result = await db.collection(Collections.ITEMS).insertOne(newItem)
    
    await logActivity(filterUserId, "create", "item", result.insertedId?.toString(), { 
      name: body.name || body.description,
      quantity: body.quantity 
    })

    return NextResponse.json({
      success: true,
      data: { ...newItem, _id: result.insertedId },
    })
  } catch (error) {
    console.error("POST /items error:", error)
    return NextResponse.json({ success: false, error: "Failed to create item" }, { status: 500 })
  }
})
