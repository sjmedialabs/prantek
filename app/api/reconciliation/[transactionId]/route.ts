import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { withAuth } from "@/lib/api-auth"

export const GET = withAuth(async (req: NextRequest, user: any, context?: { params?: Promise<{ transactionId: string }> }) => {
  const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId
  const params = context?.params != null ? await context.params : undefined
  const transactionId = params?.transactionId
  if (!transactionId) {
    return NextResponse.json({ success: false, error: "transactionId required" }, { status: 400 })
  }

  const db = await connectDB()
  const entry = await db.collection(Collections.RECONCILIATION_ENTRIES).findOne({
    transaction_id: transactionId,
    userId: filterUserId,
  })

  if (!entry) {
    return NextResponse.json({ success: true, data: null })
  }
  const data = {
    _id: entry._id,
    transaction_id: entry.transaction_id,
    transaction_type: entry.transaction_type,
    bank_statement_date: entry.bank_statement_date,
    reference_no: entry.reference_no,
    amount: entry.amount,
    created_by: entry.created_by,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  }
  if (data.bank_statement_date && typeof data.bank_statement_date.toISOString === "function") {
    (data as any).bank_statement_date = (data.bank_statement_date as Date).toISOString().split("T")[0]
  }
  return NextResponse.json({ success: true, data })
})
