import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { withAuth } from "@/lib/api-auth"
import { ObjectId } from "mongodb"

/** POST: Match a bank statement row to one or more transactions (clear them and store bank ref/date). */
export const POST = withAuth(async (req: NextRequest, user: any) => {
  const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId
  const body = await req.json()
  const bankStatementId = body.bankStatementId ?? body.bank_statement_id
  const transactionIds = body.transactionIds as { id: string; type: "receipt" | "payment" }[]

  if (!bankStatementId || !Array.isArray(transactionIds) || transactionIds.length === 0) {
    return NextResponse.json(
      { success: false, error: "bankStatementId and transactionIds (array of { id, type }) are required" },
      { status: 400 }
    )
  }

  const db = await connectDB()
  const bankColl = db.collection(Collections.BANK_STATEMENTS)
  const bankRow = await bankColl.findOne({
    _id: new ObjectId(bankStatementId),
    userId: filterUserId,
  })
  if (!bankRow) {
    return NextResponse.json({ success: false, error: "Bank statement row not found" }, { status: 404 })
  }
  if (bankRow.status === "matched") {
    return NextResponse.json({ success: false, error: "Already matched" }, { status: 400 })
  }

  const receiptsCol = db.collection(Collections.RECEIPTS)
  const paymentsCol = db.collection(Collections.PAYMENTS)
  const bankDate = bankRow.date ?? new Date().toISOString().split("T")[0]
  const bankReference = bankRow.reference ?? ""

  for (const { id, type } of transactionIds) {
    if (!ObjectId.isValid(id)) continue
    const collection = type === "receipt" ? receiptsCol : paymentsCol
    await collection.updateOne(
      { _id: new ObjectId(id), userId: filterUserId },
      {
        $set: {
          status: "cleared",
          bankReference: bankReference,
          bankDate: bankDate,
          updatedAt: new Date(),
        },
      }
    )
  }

  await bankColl.updateOne(
    { _id: new ObjectId(bankStatementId), userId: filterUserId },
    {
      $set: {
        status: "matched",
        matched_transaction_ids: transactionIds,
        updatedAt: new Date(),
      },
    }
  )

  return NextResponse.json({ success: true, message: "Matched successfully" })
})
