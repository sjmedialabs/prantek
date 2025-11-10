import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { withAuth } from "@/lib/api-auth"

export const GET = withAuth(async (req: NextRequest, user: any) => {
  const db = await connectDB()
  const recipientTypes = await db
    .collection(Collections.RECIPIENT_TYPES)
    .find({ userId: user.userId })
    .toArray()

  return NextResponse.json(recipientTypes)
})

export const POST = withAuth(async (req: NextRequest, user: any) => {
  const db = await connectDB()
  const data = await req.json()

  const recipientType = {
    ...data,
    userId: user.userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const result = await db.collection(Collections.RECIPIENT_TYPES).insertOne(recipientType)

  return NextResponse.json({ ...recipientType, _id: result.insertedId })
})
