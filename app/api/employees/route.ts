import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { withAuth } from "@/lib/api-auth"

export const GET = withAuth(async (req: NextRequest, user: any) => {
  const db = await connectDB()
  const employees = await db.collection(Collections.EMPLOYEES).find({ organizationId: user.organizationId }).toArray()

  return NextResponse.json(employees)
})

export const POST = withAuth(async (req: NextRequest, user: any) => {
  const db = await connectDB()
  const data = await req.json()

  const employee = {
    ...data,
    organizationId: user.organizationId,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const result = await db.collection(Collections.EMPLOYEES).insertOne(employee)

  return NextResponse.json({ ...employee, _id: result.insertedId })
})
