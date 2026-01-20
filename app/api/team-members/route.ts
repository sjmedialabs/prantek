import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { withAuth } from "@/lib/api-auth"

export const GET = withAuth(async (req: NextRequest, user: any) => {
  const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId
  const db = await connectDB()
  const teamMembers = await db
    .collection(Collections.TEAM_MEMBERS)
    .find({ userId: filterUserId })
    .toArray()

  return NextResponse.json(teamMembers)
})

export const POST = withAuth(async (req: NextRequest, user: any) => {
  const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId
  const db = await connectDB()
  const data = await req.json()

  const teamMember = {
    ...data,
    userId: filterUserId,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const result = await db.collection(Collections.TEAM_MEMBERS).insertOne(teamMember)

  return NextResponse.json({ ...teamMember, _id: result.insertedId })
})
