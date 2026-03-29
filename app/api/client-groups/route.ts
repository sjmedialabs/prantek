import { type NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/api-auth"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { ObjectId } from "mongodb"

export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    const db = await connectDB()
    const userId = user.isAdminUser && user.companyId ? user.companyId : user.userId
    const groups = await db.collection(Collections.CLIENT_GROUPS)
      .find({ userId: String(userId) }).sort({ createdAt: -1 }).toArray()
    return NextResponse.json({ success: true, data: groups })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch groups" }, { status: 500 })
  }
})

export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    const db = await connectDB()
    const userId = user.isAdminUser && user.companyId ? user.companyId : user.userId
    const body = await request.json()
    const { name, description, filters } = body
    if (!name) return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 })
    const doc = {
      name, description: description || "", filters: filters || {},
      userId: String(userId), createdAt: new Date(), updatedAt: new Date(),
    }
    const result = await db.collection(Collections.CLIENT_GROUPS).insertOne(doc)
    return NextResponse.json({ success: true, data: { ...doc, _id: result.insertedId } })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create group" }, { status: 500 })
  }
})

export const PUT = withAuth(async (request: NextRequest, user) => {
  try {
    const db = await connectDB()
    const body = await request.json()
    const { id, ...update } = body
    if (!id) return NextResponse.json({ success: false, error: "ID required" }, { status: 400 })
    await db.collection(Collections.CLIENT_GROUPS).updateOne(
      { _id: new ObjectId(id) }, { $set: { ...update, updatedAt: new Date() } }
    )
    const updated = await db.collection(Collections.CLIENT_GROUPS).findOne({ _id: new ObjectId(id) })
    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update group" }, { status: 500 })
  }
})

export const DELETE = withAuth(async (request: NextRequest, user) => {
  try {
    const db = await connectDB()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ success: false, error: "ID required" }, { status: 400 })
    await db.collection(Collections.CLIENT_GROUPS).deleteOne({ _id: new ObjectId(id) })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete group" }, { status: 500 })
  }
})
