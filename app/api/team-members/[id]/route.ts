import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { withAuth } from "@/lib/api-auth"
import { ObjectId } from "mongodb"

export const PUT = withAuth(async (req: NextRequest, user: any, { params }: { params: { id: string } }) => {
  const db = await connectDB()
  const data = await req.json()

  const result = await db
    .collection(Collections.TEAM_MEMBERS)
    .findOneAndUpdate(
      { _id: new ObjectId(params.id), userId: user.userId },
      { $set: { ...data, updatedAt: new Date() } },
      { returnDocument: "after" },
    )

  if (!result) {
    return NextResponse.json({ error: "Team member not found" }, { status: 404 })
  }

  return NextResponse.json(result)
})

export const DELETE = withAuth(async (req: NextRequest, user: any, { params }: { params: { id: string } }) => {
  const db = await connectDB()

  const result = await db
    .collection(Collections.TEAM_MEMBERS)
    .deleteOne({ _id: new ObjectId(params.id), userId: user.userId })

  if (result.deletedCount === 0) {
    return NextResponse.json({ error: "Team member not found" }, { status: 404 })
  }

  return NextResponse.json({ success: true })
})
