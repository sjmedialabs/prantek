import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { withAuth } from "@/lib/api-auth"
import { ObjectId } from "mongodb"

export const PUT = withAuth(async (req: NextRequest, user: any) => {
  const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId
  const body = await req.json()

  const id = body.id
  const transaction_id = body.transaction_id
  const bank_statement_date = body.bank_statement_date
  const reference_no = body.reference_no
  const amount = body.amount

  if (!bank_statement_date) {
    return NextResponse.json(
      { success: false, error: "Bank statement date is required" },
      { status: 400 }
    )
  }
  if (amount != null && (amount === "" || Number(amount) <= 0)) {
    return NextResponse.json(
      { success: false, error: "Amount must be greater than 0" },
      { status: 400 }
    )
  }

  const db = await connectDB()
  const coll = db.collection(Collections.RECONCILIATION_ENTRIES)

  const filter: any = { userId: filterUserId }
  if (id) {
    try {
      filter._id = new ObjectId(id)
    } catch {
      return NextResponse.json({ success: false, error: "Invalid id" }, { status: 400 })
    }
  } else if (transaction_id) {
    filter.transaction_id = String(transaction_id)
  } else {
    return NextResponse.json(
      { success: false, error: "id or transaction_id is required" },
      { status: 400 }
    )
  }

  const update: any = {
    updatedAt: new Date(),
    bank_statement_date: new Date(bank_statement_date),
  }
  if (reference_no !== undefined) update.reference_no = String(reference_no)
  if (amount !== undefined) update.amount = Number(amount)

  const result = await coll.updateOne(filter, { $set: update })
  if (result.matchedCount === 0) {
    return NextResponse.json({ success: false, error: "Entry not found" }, { status: 404 })
  }
  const updated = await coll.findOne(filter)
  return NextResponse.json({ success: true, data: updated })
})
