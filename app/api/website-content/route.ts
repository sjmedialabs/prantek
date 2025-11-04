import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { withAuth } from "@/lib/api-auth"

export const GET = withAuth(async (req: NextRequest, user: any) => {
  const db = await connectDB()
  const content = await db
    .collection(Collections.WEBSITE_CONTENT)
    .find({ organizationId: user.organizationId })
    .toArray()

  return NextResponse.json(content)
})

export const POST = withAuth(async (req: NextRequest, user: any) => {
  const db = await connectDB()
  const data = await req.json()

  const content = {
    ...data,
    organizationId: user.organizationId,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const result = await db.collection(Collections.WEBSITE_CONTENT).insertOne(content)

  return NextResponse.json({ ...content, _id: result.insertedId })
})
