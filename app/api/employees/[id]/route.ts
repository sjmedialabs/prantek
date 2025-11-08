import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { withAuth } from "@/lib/api-auth"
import { ObjectId } from "mongodb"

function getIdFromRequest(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split("/")
  return segments[segments.length - 1]
}


export const GET = withAuth(async (req: NextRequest, user: any) => {
  const db = await connectDB()
    const id = getIdFromRequest(req)
  const employee = await db

    .collection(Collections.EMPLOYEES)
    .findOne({ _id: new ObjectId(id), userId: String(user.id) },)

  if (!employee) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 })
  }

  return NextResponse.json(employee)
})

export const PUT = withAuth(async (req: NextRequest, user: any) => {
  const db = await connectDB()
  const data = await req.json()
  const id = getIdFromRequest(req)

  delete data._id      // ✅ <—
  delete data.id       // ✅ <—

  const result = await db
    .collection(Collections.EMPLOYEES)
    .findOneAndUpdate(
      { _id: new ObjectId(id), userId: String(user.id) },
      { $set: { ...data, updatedAt: new Date() } },
      { returnDocument: "after" }
    )

  return NextResponse.json({ data: result?.value }, { status: 200 })
})



export const DELETE = withAuth(async (req: NextRequest, user: any) => {
  const db = await connectDB()
  const id = getIdFromRequest(req)
  const result = await db
    .collection(Collections.EMPLOYEES)
    .deleteOne({ _id: new ObjectId(id), userId: String(user.id) },)

  if (result.deletedCount === 0) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 })
  }

  return NextResponse.json({ success: true })
})
