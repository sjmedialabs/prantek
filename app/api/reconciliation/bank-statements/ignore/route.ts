import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { withAuth } from "@/lib/api-auth"
import { ObjectId } from "mongodb"

/** POST: Mark a bank statement row as ignored. */
export const POST = withAuth(async (req: NextRequest, user: any) => {
  const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId
  const body = await req.json()
  const bankStatementId = body.bankStatementId ?? body.bank_statement_id

  if (!bankStatementId) {
    return NextResponse.json({ success: false, error: "bankStatementId is required" }, { status: 400 })
  }

  const db = await connectDB()
  const result = await db.collection(Collections.BANK_STATEMENTS).updateOne(
    { _id: new ObjectId(bankStatementId), userId: filterUserId },
    { $set: { status: "ignored", updatedAt: new Date() } }
  )

  if (result.matchedCount === 0) {
    return NextResponse.json({ success: false, error: "Bank statement row not found" }, { status: 404 })
  }

  return NextResponse.json({ success: true, message: "Ignored" })
})
