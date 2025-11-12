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

    const taxSetting = await db
      .collection(Collections.TAX_SETTINGS)
      .findOne({ userId: String(user.userId) })

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

    const existing = await db
      .collection(Collections.TAX_SETTINGS)
      .findOne({ userId: String(user.userId) })

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
      userId: String(user.userId),
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

  const now = new Date()

  const updated = await db
    .collection(Collections.TAX_SETTINGS)
    .findOneAndUpdate(
      { userId: String(user.id) },
      {
        $set: {
          ...data,
          updatedAt: now,
        },
        $setOnInsert: {
          userId: String(user.id),
          createdAt: now,
        },
      },
      { upsert: true, returnDocument: "after" }
    )

  return NextResponse.json({ company: updated })
})
