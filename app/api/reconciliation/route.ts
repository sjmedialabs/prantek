import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { withAuth } from "@/lib/api-auth"
import { ObjectId } from "mongodb"

export const GET = withAuth(async (req: NextRequest, user: any) => {
  const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId
  const db = await connectDB()

  const receipts = await db.collection(Collections.RECEIPTS).find({ userId: filterUserId }).toArray()
  const payments = await db.collection(Collections.PAYMENTS).find({ userId: filterUserId }).toArray()

  const reconciliation = [
    ...receipts.map((r) => ({
      _id: r._id,
      type: "receipt",
      transactionNumber: r.receiptNumber,
      quotationNumber: r.quotationNumber,
      date: r.date,
      clientName: r.clientName,
      recipientName: r.clientName,
      bankAccount: r.bankAccount,
      paymentMethod: r.paymentMethod,
      referenceNumber: r.referenceNumber,
      amount: r.amountPaid || r.total || 0,
      status: r.status || "pending",
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    })),
    ...payments.map((p) => ({
      _id: p._id,
      type: "payment",
      transactionNumber: p.paymentNumber,
      date: p.date,
      recipientName: p.recipientName,
      recipientType: p.recipientType,
      bankAccount: p.bankAccount,
      paymentMethod: p.paymentMethod,
      referenceNumber: p.referenceNumber,
      amount: p.amount || 0,
      status: p.status === "completed" ? "cleared" : "pending",
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    })),
  ]

  return NextResponse.json(reconciliation)
})

export const PUT = withAuth(async (req: NextRequest, user: any) => {
  const db = await connectDB()
  const { id, type, cleared } = await req.json()

  const collection = type === "receipt" ? Collections.RECEIPTS : Collections.PAYMENTS
  
  // For receipts, set status to "cleared" or "pending"
  // For payments, set status to "completed" or "pending"
  const newStatus = cleared 
    ? (type === "receipt" ? "cleared" : "completed")
    : "pending"

  const result = await db
    .collection(collection)
    .findOneAndUpdate(
      { _id: new ObjectId(id), userId: filterUserId },
      { $set: { status: newStatus, updatedAt: new Date() } },
      { returnDocument: "after" },
    )

  if (!result) {
    return NextResponse.json({ error: "Record not found" }, { status: 404 })
  }

  return NextResponse.json(result)
})
