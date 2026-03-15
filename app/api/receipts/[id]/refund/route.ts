import { type NextRequest, NextResponse } from "next/server"
import { connectDB, getMongoClient } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { withAuth } from "@/lib/api-auth"
import { generateNextNumber } from "@/lib/mongodb-store"
import { ObjectId } from "mongodb"

function getReceiptIdFromRequest(req: NextRequest): string | null {
  const segments = req.nextUrl.pathname.split("/")
  const idx = segments.indexOf("receipts")
  if (idx === -1 || idx + 1 >= segments.length) return null
  const id = segments[idx + 1]
  return id && id !== "refund" ? id : null
}

/**
 * POST /api/receipts/[id]/refund
 * Body: { amount: number }
 * Creates a refund payment and updates the receipt (balance_amount, refunded_amount, status).
 * Only for advance receipts that are cleared and have balance > 0.
 */
export const POST = withAuth(async (req: NextRequest, user: any) => {
  const receiptId = getReceiptIdFromRequest(req)
  if (!receiptId || !ObjectId.isValid(receiptId)) {
    return NextResponse.json({ success: false, error: "Invalid receipt ID" }, { status: 400 })
  }

  const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId
  let body: { amount?: number }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 })
  }

  const amount = typeof body.amount === "number" ? body.amount : Number(body.amount)
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json(
      { success: false, error: "Refund amount must be greater than 0" },
      { status: 400 }
    )
  }

  const db = await connectDB()
  const receiptsCol = db.collection(Collections.RECEIPTS)
  const paymentsCol = db.collection(Collections.PAYMENTS)

  const receipt = await receiptsCol.findOne({
    _id: new ObjectId(receiptId),
    userId: filterUserId,
  })

  if (!receipt) {
    return NextResponse.json({ success: false, error: "Receipt not found" }, { status: 404 })
  }

  const isAdvance =
    receipt.receiptType === "advance" || receipt.paymentType === "advance"
  if (!isAdvance) {
    return NextResponse.json(
      { success: false, error: "Refund is only allowed for advance receipts" },
      { status: 400 }
    )
  }

  if ((receipt.status || "").toLowerCase() !== "cleared") {
    return NextResponse.json(
      { success: false, error: "Receipt must be cleared before refund" },
      { status: 400 }
    )
  }

  const balance = Number(receipt.balanceAmount ?? receipt.ReceiptAmount ?? 0)
  if (balance <= 0) {
    return NextResponse.json(
      { success: false, error: "Receipt balance is already zero; no refund allowed" },
      { status: 400 }
    )
  }

  if (amount > balance) {
    return NextResponse.json(
      { success: false, error: "Refund amount cannot exceed receipt balance" },
      { status: 400 }
    )
  }

  const newBalance = balance - amount
  const currentRefunded = Number(receipt.refundedAmount ?? 0)
  const newRefundedAmount = currentRefunded + amount
  const isFullRefund = newBalance <= 0
  const newStatus = isFullRefund ? "refunded" : "partially_refunded"

  const paymentNumber = await generateNextNumber("payments", "PAY", filterUserId)
  const paymentDoc = {
    userId: filterUserId,
    recipientType: "client",
    recipientId: receipt.clientId,
    recipientName: receipt.clientName ?? "",
    recipientEmail: receipt.clientEmail,
    recipientPhone: receipt.clientPhone,
    recipientAddress: receipt.clientAddress,
    paymentNumber,
    paymentType: "refund",
    category: "Refund",
    date: new Date().toISOString().split("T")[0],
    amount,
    paymentMethod: receipt.paymentMethod ?? "cash",
    bankAccount: receipt.bankAccount,
    referenceNumber: receipt.referenceNumber,
    referenceReceiptId: receiptId,
    createdBy: user.email ?? user.userId ?? "",
    status: "Paid",
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const client = await getMongoClient()

  try {
    await client.withSession(async (session) => {
      await session.withTransaction(async () => {
        const insertResult = await paymentsCol.insertOne(paymentDoc, { session })
        if (!insertResult.acknowledged) {
          throw new Error("Failed to create refund payment")
        }
        const updateResult = await receiptsCol.updateOne(
          { _id: new ObjectId(receiptId), userId: filterUserId },
          {
            $set: {
              balanceAmount: newBalance,
              refundedAmount: newRefundedAmount,
              status: newStatus,
              updatedAt: new Date(),
            },
          },
          { session }
        )
        if (updateResult.matchedCount === 0) {
          throw new Error("Failed to update receipt")
        }
      })
    })
  } catch (txErr: any) {
    if (txErr.message?.includes("Transaction numbers are only allowed on a replica set")) {
      try {
        const insertResult = await paymentsCol.insertOne(paymentDoc)
        if (!insertResult.acknowledged) {
          return NextResponse.json(
            { success: false, error: "Failed to create refund payment" },
            { status: 500 }
          )
        }
        const updateResult = await receiptsCol.updateOne(
          { _id: new ObjectId(receiptId), userId: filterUserId },
          {
            $set: {
              balanceAmount: newBalance,
              refundedAmount: newRefundedAmount,
              status: newStatus,
              updatedAt: new Date(),
            },
          }
        )
        if (updateResult.matchedCount === 0) {
          return NextResponse.json(
            {
              success: false,
              error: "Refund payment was created but receipt update failed. Please contact support.",
            },
            { status: 500 }
          )
        }
      } catch (fallbackErr: any) {
        console.error("[Receipt Refund]", fallbackErr)
        return NextResponse.json(
          { success: false, error: fallbackErr?.message ?? "Refund failed" },
          { status: 500 }
        )
      }
    } else {
      console.error("[Receipt Refund]", txErr)
      return NextResponse.json(
        { success: false, error: txErr?.message ?? "Refund failed" },
        { status: 500 }
      )
    }
  }

  const updatedReceipt = await receiptsCol.findOne({
    _id: new ObjectId(receiptId),
    userId: filterUserId,
  })

  return NextResponse.json({
    success: true,
    data: { receipt: updatedReceipt, refundAmount: amount },
  })
})
