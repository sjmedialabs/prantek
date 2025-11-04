import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { withAuth } from "@/lib/api-auth"

export const GET = withAuth(async (req: NextRequest, user: any) => {
  const db = await connectDB()
  const memberTypes = await db
    .collection(Collections.MEMBER_TYPES)
    .find({ organizationId: user.organizationId })
    .toArray()

  return NextResponse.json(memberTypes)
})

export const POST = withAuth(async (req: NextRequest, user: any) => {
  const db = await connectDB()
  const data = await req.json()

  const memberType = {
    ...data,
    organizationId: user.organizationId,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const result = await db.collection(Collections.MEMBER_TYPES).insertOne(memberType)

  return NextResponse.json({ ...memberType, _id: result.insertedId })
})
