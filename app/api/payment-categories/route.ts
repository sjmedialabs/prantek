import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { withAuth } from "@/lib/api-auth"

export const GET = withAuth(async (req: NextRequest, user: any) => {
  const db = await connectDB()
  const categories = await db
    .collection(Collections.PAYMENT_CATEGORIES)
    .find({ organizationId: user.organizationId })
    .toArray()

  return NextResponse.json(categories)
})

export const POST = withAuth(async (req: NextRequest, user: any) => {
  const db = await connectDB()
  const data = await req.json()

  const category = {
    ...data,
    organizationId: user.organizationId,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const result = await db.collection(Collections.PAYMENT_CATEGORIES).insertOne(category)

  return NextResponse.json({ ...category, _id: result.insertedId })
})
