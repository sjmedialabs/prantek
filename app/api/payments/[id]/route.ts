import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { withAuth } from "@/lib/api-auth"
import { ObjectId } from "mongodb"

// ✅ helper: extract last segment (/api/payments/ID)
function getIdFromRequest(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split("/")
  return segments[segments.length - 1]
}

/*  
==================================================
✅ GET — Get payment detail
==================================================
*/
export const GET = withAuth(async (req: NextRequest, user: any) => {
  const db = await connectDB()

  const id = getIdFromRequest(req)

  const payment = await db
    .collection(Collections.PAYMENTS)
    .findOne({
      _id: new ObjectId(id),
      userId: user.userId,
    })

  if (!payment) {
    return NextResponse.json(
      { error: "Payment not found" },
      { status: 404 }
    )
  }

  return NextResponse.json({ payment }, { status: 200 })
})

/*  
==================================================
✅ PUT — Update payment
==================================================
*/
export const PUT = withAuth(async (req: NextRequest, user: any) => {
  const db = await connectDB()
  const data = await req.json()

  const id = getIdFromRequest(req)

  const updated = await db
    .collection(Collections.PAYMENTS)
    .findOneAndUpdate(
      {
        _id: new ObjectId(id),
        userId: user.userId,
      },
      { $set: { ...data, updatedAt: new Date() } },
      { returnDocument: "after" }
    )

  if (!updated) {
    return NextResponse.json(
      { error: "Payment not found or update failed" },
      { status: 404 }
    )
  }

  return NextResponse.json(
    { payment: updated, message: "Payment updated successfully" },
    { status: 200 }
  )
})
