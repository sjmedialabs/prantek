import { withAuth } from "@/lib/api-auth"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { NextRequest, NextResponse } from "next/server"

export const GET = withAuth(async (req: NextRequest, user: any) => {
  const db = await connectDB()

  // For admin users, filter by companyId (parent account)
  // For regular users, filter by userId (their own account)
  const filterUserId =
    user.isAdminUser && user.companyId ? user.companyId : user.userId

  const taxRates = await db
    .collection(Collections.TAX_RATES)
    .find({ userId: String(filterUserId) })
    .sort({ createdAt: -1 })
    .toArray()

  return NextResponse.json({ data: taxRates })
})

export const POST = withAuth(async (req: NextRequest, user: any) => {
  const db = await connectDB()
  const body = await req.json()

  // For admin users, use companyId (parent account)
  // For regular users, use userId (their own account)
  const filterUserId =
    user.isAdminUser && user.companyId ? user.companyId : user.userId

  const now = new Date()

  const payload = {
    ...body,
    userId: String(filterUserId),
    createdAt: now,
    updatedAt: now,
  }

  const created = await db.collection(Collections.TAX_RATES).insertOne(payload)

  return NextResponse.json({
    data: { _id: created.insertedId, ...payload },
  })
})
