import { NextRequest, NextResponse } from "next/server"
import { mongoStore, logActivity } from "@/lib/mongodb-store"
import { withAuth } from "@/lib/api-auth"

export const GET = withAuth(async (_: NextRequest, user, { params }: any) => {
  try {
    const invoice = await mongoStore.getById("purchaseInvoice", params.id)

    return NextResponse.json({ success: true, data: invoice })
  } catch {
    return NextResponse.json({ success: false }, { status: 500 })
  }
})
export const PUT = withAuth(async (request: NextRequest, user, { params }: any) => {
  try {
    const body = await request.json()

    const paidAmount = body.paidAmount || 0
    const expenseAdjustment = body.expenseAdjustment || 0
    const invoiceTotalAmount = body.invoiceTotalAmount || 0

    body.paymentStatus =
      paidAmount >= invoiceTotalAmount ? "Paid" : "Unpaid"

    body.invoiceStatus =
      paidAmount + expenseAdjustment >= invoiceTotalAmount
        ? "Closed"
        : "Open"

    const updated = await mongoStore.update("purchaseInvoice", params.id, body)

    const filterUserId =
      user.isAdminUser && user.companyId ? user.companyId : user.userId

    await logActivity(filterUserId, "update", "purchaseInvoice", params.id)

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
})
export const DELETE = withAuth(async (_: NextRequest, user, { params }: any) => {
  try {
    await mongoStore.delete("purchaseInvoice", params.id)

    const filterUserId =
      user.isAdminUser && user.companyId ? user.companyId : user.userId

    await logActivity(filterUserId, "delete", "purchaseInvoice", params.id)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false }, { status: 500 })
  }
})
