import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { withAuth } from "@/lib/api-auth"

export const GET = withAuth(async (req: NextRequest, user: any) => {
  const db = await connectDB()
  const roles = await db
    .collection(Collections.ROLES)
    .find({ userId: String(user.id) })   // ✅ FIXED
    .toArray()

  return NextResponse.json({ roles })
})

export const POST = withAuth(async (req: NextRequest, user: any) => {
  const db = await connectDB()
  const data = await req.json()

  const role = {
    ...data,
    userId: user.id,
      isActive: data?.isActive ?? true, 
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const result = await db.collection(Collections.ROLES).insertOne(role)

  return NextResponse.json({ ...role, _id: result.insertedId })
})
