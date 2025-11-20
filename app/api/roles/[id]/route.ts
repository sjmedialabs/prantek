import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { withAuth } from "@/lib/api-auth"
import { ObjectId } from "mongodb"

// ✅ helper
function getIdFromRequest(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split("/")
  return segments[segments.length - 1]
}

// ✅ UPDATE ROLE (including active/inactive)
export const PUT = withAuth(async (req: NextRequest, user: any) => {
  const db = await connectDB()
  const data = await req.json()

  const id = getIdFromRequest(req)

  const updated = await db
    .collection(Collections.ROLES)
    .findOneAndUpdate(
      { _id: new ObjectId(id), userId: String(user.id) },
      { $set: { ...data, updatedAt: new Date() } },
      { returnDocument: "after" }
    )

  return NextResponse.json({ role: updated }, { status: 200 })
})
