import { NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"

// Extract ID from URL
function getId(req: NextRequest) {
  return req.nextUrl.pathname.split("/").pop()!
}

/* ============================
      GET /api/receipts/:id
   ============================ */
export async function GET(req: NextRequest) {
  try {
    const db = await connectDB()
    const id = getId(req)

    const receipt = await db
      .collection(Collections.RECEIPTS)
      .findOne({ _id: new ObjectId(id) })

    if (!receipt) {
      return NextResponse.json(
        { error: "Receipt not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ receipt }, { status: 200 })
  } catch (error: any) {
    console.error("GET receipt error:", error)
    return NextResponse.json(
      { error: "Failed to fetch receipt", message: error.message },
      { status: 500 }
    )
  }
}

/* ============================
      PUT /api/receipts/:id
   ============================ */
export async function PUT(req: NextRequest) {
  try {
    const db = await connectDB()
    const id = getId(req)
    const payload = await req.json()

    // Auto update timestamp
    payload.updatedAt = new Date()

    const updated = await db
      .collection(Collections.RECEIPTS)
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: payload },
        { returnDocument: "after" }
      )

    if (!updated) {
      return NextResponse.json(
        { error: "Receipt not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ receipt: updated }, { status: 200 })
  } catch (error: any) {
    console.error("PUT receipt error:", error)
    return NextResponse.json(
      { error: "Failed to update receipt", message: error.message },
      { status: 500 }
    )
  }
}
