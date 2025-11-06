import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { withAuth } from "@/lib/api-auth"
import { ObjectId } from "mongodb"

export const GET = withAuth(async (req: NextRequest, user: any) => {
  const db = await connectDB()

  const receipts = await db.collection(Collections.RECEIPTS).find({ userId: user.userId }).toArray()

  const payments = await db.collection(Collections.PAYMENTS).find({ userId: user.userId }).toArray()

  const reconciliation = [...receipts, ...payments].map((item) => ({
    ...item,
    type: "receiptNumber" in item ? "receipt" : "payment",
  }))

  return NextResponse.json(reconciliation)
})

export const PUT = withAuth(async (req: NextRequest, user: any) => {
  const db = await connectDB()
  const { id, type, cleared } = await req.json()

  const collection = type === "receipt" ? Collections.RECEIPTS : Collections.PAYMENTS

  const result = await db
    .collection(collection)
    .findOneAndUpdate(
      { _id: new ObjectId(id), userId: user.userId },
      { $set: { cleared, updatedAt: new Date() } },
      { returnDocument: "after" },
    )

  if (!result) {
    return NextResponse.json({ error: "Record not found" }, { status: 404 })
  }

  return NextResponse.json(result)
})
