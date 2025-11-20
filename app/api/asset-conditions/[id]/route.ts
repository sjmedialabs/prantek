import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { verifyToken } from "@/lib/jwt"
import { ObjectId } from "mongodb"

const COLLECTION = "asset_conditions"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
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

    const updateData = {
      ...body,
      updatedAt: new Date().toISOString(),
    }

    const result = await db.collection(COLLECTION).findOneAndUpdate(
      { _id: new ObjectId(params.id), tenantId: userData.tenantId },
      { $set: updateData },
      { returnDocument: "after" }
    )

    if (!result) {
      return NextResponse.json({ error: "Condition not found" }, { status: 404 })
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Error updating asset condition:", error)
    return NextResponse.json({ error: error.message || "Failed to update asset condition" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
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

    const result = await db.collection(COLLECTION).deleteOne({
      _id: new ObjectId(params.id),
      tenantId: userData.tenantId,
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Condition not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Condition deleted successfully" })
  } catch (error: any) {
    console.error("Error deleting asset condition:", error)
    return NextResponse.json({ error: error.message || "Failed to delete asset condition" }, { status: 500 })
  }
}
