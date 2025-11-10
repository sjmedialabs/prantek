import { type NextRequest, NextResponse } from "next/server"
import { mongoStore, logActivity, generateNextNumber } from "@/lib/mongodb-store"
import { withAuth } from "@/lib/api-auth"
import { notifyAdminsNewReceipt } from "@/lib/notification-utils"

export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "100")
    const skip = (page - 1) * limit

    const receipts = await mongoStore.getAll("receipts", { userId: user.userId }, { skip, limit, sort: { date: -1 } })
    const total = await mongoStore.count("receipts", { userId: user.userId })

    return NextResponse.json({
      success: true,
      data: receipts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch receipts" }, { status: 500 })
  }
})

export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json()

    if (!body.receiptNumber) {
      body.receiptNumber = await generateNextNumber("receipts", "RC", user.userId)
    }

    const receipt = await mongoStore.create("receipts", { ...body, userId: user.userId })

    await logActivity(user.userId, "create", "receipt", receipt._id?.toString(), { receiptNumber: body.receiptNumber })

    // Notify admins about new receipt
    try {
      // Get client info for notification
      const client = await mongoStore.getById("clients", body.clientId)
      const clientName = client?.name || "Unknown Client"
      
      await notifyAdminsNewReceipt(
        receipt._id?.toString() || "",
        body.receiptNumber,
        clientName,
        user.userId
      )
    } catch (notifError) {
      console.error("Failed to send notification:", notifError)
      // Don't fail the request if notification fails
    }

    return NextResponse.json({ success: true, data: receipt })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create receipt" }, { status: 500 })
  }
})
