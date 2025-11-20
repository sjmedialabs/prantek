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

export const PUT = withAuth(async (req: NextRequest, user: any) => {
  const db = await connectDB()
  const data = await req.json()
  const id = getIdFromRequest(req)
  const result = await db
    .collection(Collections.PAYMENT_CATEGORIES)
    .findOneAndUpdate(
      { _id: new ObjectId(id), userId: user.userId },
      { $set: { ...data, updatedAt: new Date() } },
      { returnDocument: "after" },
    )

  if (!result) {
    return NextResponse.json({ error: "Payment category not found" }, { status: 404 })
  }

  return NextResponse.json(result)
})

// export const DELETE = withAuth(async (req: NextRequest, user: any) => {
//   const db = await connectDB()

//   const result = await db
//     .collection(Collections.PAYMENT_CATEGORIES)
//     .deleteOne({ _id: new ObjectId(params.id), userId: user.userId })

//   if (result.deletedCount === 0) {
//     return NextResponse.json({ error: "Payment category not found" }, { status: 404 })
//   }

//   return NextResponse.json({ success: true })
// })
