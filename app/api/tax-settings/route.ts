import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { withAuth } from "@/lib/api-auth"
import { Collections } from "@/lib/db-config"

/**
 * ✅ GET — Fetch Tax Setting
 */
export const GET = withAuth(async (req: NextRequest, user: any) => {
  try {
    const db = await connectDB()

    // For admin users, filter by companyId (parent account)
    // For regular users, filter by userId (their own account)
    const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId

    const taxSetting = await db
      .collection(Collections.TAX_SETTINGS)
      .findOne({ userId: String(filterUserId) })

    return NextResponse.json({
      success: true,
      data: taxSetting ?? null,
    })
  } catch (err) {
    console.error("GET /tax-setting error:", err)
    return NextResponse.json(
      { success: false, error: "Failed to fetch" },
      { status: 500 }
    )
  }
})


/**
 * ✅ POST — Create Tax Setting (only one)
 * If exists → update instead.
 */
export const POST = withAuth(async (req: NextRequest, user: any) => {
  try {
    const db = await connectDB()
    const data = await req.json()

    // For admin users, use companyId (parent account)
    // For regular users, use userId (their own account)
    const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId

    const existing = await db
      .collection(Collections.TAX_SETTINGS)
      .findOne({ userId: String(filterUserId) })

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message: "Tax setting already exists. Use PUT instead.",
        },
        { status: 400 }
      )
    }

    const doc = {
      userId: String(filterUserId),
      tan: data.tan,
      tanUrl: data.tanUrl,
      gst: data.gst,
      gstUrl: data.gstUrl,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await db.collection(Collections.TAX_SETTINGS).insertOne(doc)

    return NextResponse.json({ success: true, data: doc }, { status: 201 })
  } catch (err) {
    console.error("POST /tax-setting error:", err)
    return NextResponse.json(
      { success: false, error: "Failed to create" },
      { status: 500 }
    )
  }
})


/**
 * ✅ PUT — Update Tax Setting
 */
export const PUT = withAuth(async (req: NextRequest, user: any) => {
  const db = await connectDB()
  const data = await req.json()

  // For admin users, use companyId (parent account)
  // For regular users, use userId (their own account)
  const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId

  const now = new Date()

  const updated = await db
    .collection(Collections.TAX_SETTINGS)
    .findOneAndUpdate(
      { userId: String(filterUserId) },
      {
        $set: {
          ...data,
          updatedAt: now,
        },
        $setOnInsert: {
          userId: String(filterUserId),
          createdAt: now,
        },
      },
      { upsert: true, returnDocument: "after" }
    )

  return NextResponse.json({ company: updated })
})
