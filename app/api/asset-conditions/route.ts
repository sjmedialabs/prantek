import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { verifyToken } from "@/lib/jwt"

const COLLECTION = "asset_conditions"

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userData = await verifyToken(token)
    if (!userData) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const db = await connectDB()
    const conditions = await db.collection(COLLECTION).find({ tenantId: userData.tenantId }).sort({ name: 1 }).toArray()

    return NextResponse.json(conditions)
  } catch (error: any) {
    console.error("Error fetching asset conditions:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch asset conditions" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userData = await verifyToken(token)
    if (!userData) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const body = await request.json()
    const db = await connectDB()

    const newCondition = {
      ...body,
      tenantId: userData.tenantId,
      isActive: body.isActive !== undefined ? body.isActive : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const result = await db.collection(COLLECTION).insertOne(newCondition)
    const condition = await db.collection(COLLECTION).findOne({ _id: result.insertedId })

    return NextResponse.json(condition, { status: 201 })
  } catch (error: any) {
    console.error("Error creating asset condition:", error)
    return NextResponse.json({ error: error.message || "Failed to create asset condition" }, { status: 500 })
  }
}
