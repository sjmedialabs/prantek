import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { withAuth } from "@/lib/api-auth"
import { ObjectId } from "mongodb"

export const POST = withAuth(async (req: NextRequest, user: any) => {
  const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId
  const body = await req.json()

  const transaction_id = body.transaction_id
  const transaction_type = body.transaction_type
  const bank_statement_date = body.bank_statement_date
  const reference_no = body.reference_no ?? ""
  const amount = body.amount

  if (!transaction_id || !transaction_type) {
    return NextResponse.json(
      { success: false, error: "transaction_id and transaction_type are required" },
      { status: 400 }
    )
  }
  if (!bank_statement_date) {
    return NextResponse.json(
      { success: false, error: "Bank statement date is required" },
      { status: 400 }
    )
  }
  if (amount == null || amount === "" || Number(amount) <= 0) {
    return NextResponse.json(
      { success: false, error: "Amount is required and must be greater than 0" },
      { status: 400 }
    )
  }

  const db = await connectDB()
  const coll = db.collection(Collections.RECONCILIATION_ENTRIES)

  const existing = await coll.findOne({
    transaction_id: String(transaction_id),
    userId: filterUserId,
  })
  if (existing) {
    return NextResponse.json(
      { success: false, error: "Entry already exists for this transaction. Use update instead." },
      { status: 400 }
    )
  }

  const doc = {
    transaction_id: String(transaction_id),
    transaction_type: transaction_type === "receipt" ? "receipt" : "payment",
    bank_statement_date: new Date(bank_statement_date),
    reference_no: String(reference_no ?? ""),
    amount: Number(amount),
    created_by: filterUserId,
    userId: filterUserId,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  const result = await coll.insertOne(doc)
  const inserted = await coll.findOne({ _id: result.insertedId })

  return NextResponse.json({ success: true, data: inserted })
})
