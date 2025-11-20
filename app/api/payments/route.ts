import { type NextRequest, NextResponse } from "next/server"
import { mongoStore, logActivity, generateNextNumber } from "@/lib/mongodb-store"
import { withAuth } from "@/lib/api-auth"
import { notifyAdminsNewPayment } from "@/lib/notification-utils"

export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "100")
    const skip = (page - 1) * limit

    // For admin users, filter by companyId (parent account)
    // For regular users, filter by userId (their own account)
    const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId

    const payments = await mongoStore.getAll("payments", { userId: filterUserId }, { skip, limit, sort: { date: -1 } })
    const total = await mongoStore.count("payments", { userId: filterUserId })

    return NextResponse.json({
      success: true,
      data: payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch payments" }, { status: 500 })
  }
})

export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json()

    // For admin users, use companyId (parent account)
    // For regular users, use userId (their own account)
    const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId

    // Use recipient name for client code (payments are made to vendors/recipients)
    const recipientName = body.recipientName || "Unknown"

    if (!body.paymentNumber) {
      body.paymentNumber = await generateNextNumber("payments", "PAY", filterUserId, recipientName)
    }

    const payment = await mongoStore.create("payments", { ...body, userId: filterUserId })

    await logActivity(filterUserId, "create", "payment", payment._id?.toString(), { paymentNumber: body.paymentNumber })

    // Notify admins about new payment
    try {
      await notifyAdminsNewPayment(
        payment._id?.toString() || "",
        body.paymentNumber,
        body.amount,
        user.companyId
      )
    } catch (notifError) {
      console.error("Failed to send notification:", notifError)
      // Don't fail the request if notification fails
    }

    return NextResponse.json({ success: true, data: payment })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create payment" }, { status: 500 })
  }
})
