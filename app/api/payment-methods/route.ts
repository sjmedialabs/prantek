import { withAuth } from "@/lib/api-auth"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { NextRequest, NextResponse } from "next/server"

export const GET = withAuth(async (req: NextRequest, user: any) => {
  const db = await connectDB()

  // For admin users, filter by companyId (parent account)
  // For regular users, filter by userId (their own account)
  const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId

  const paymentMethods = await db
    .collection(Collections.PAYMENT_METHODS)
    .find({ userId: String(filterUserId) })
    .sort({ createdAt: -1 })
    .toArray()

  return NextResponse.json({ data: paymentMethods })
})

export const POST = withAuth(async (req: NextRequest, user: any) => {
  const db = await connectDB()
  const body = await req.json()

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 })
  }

  // For admin users, use companyId (parent account)
  // For regular users, use userId (their own account)
  const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId

  const now = new Date()
  const payload = {
    userId: String(filterUserId),
    name: body.name.trim(),
    isEnabled: body.isEnabled ?? true,
    createdAt: now,
    updatedAt: now,
  }

  const inserted = await db.collection(Collections.PAYMENT_METHODS).insertOne(payload)

  return NextResponse.json({ data: { _id: inserted.insertedId, ...payload } })
})
