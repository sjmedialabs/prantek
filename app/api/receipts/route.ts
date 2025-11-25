import { type NextRequest, NextResponse } from "next/server"
import { mongoStore, logActivity, generateNextNumber } from "@/lib/mongodb-store"
import { withAuth } from "@/lib/api-auth"
import { createNotification, notifyAdminsNewReceipt } from "@/lib/notification-utils"

export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "100")
    const skip = (page - 1) * limit

    // For admin users, filter by companyId (parent account)
    // For regular users, filter by userId (their own account)
    const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId

    const receipts = await mongoStore.getAll("receipts", { userId: filterUserId }, { skip, limit, sort: { date: -1 } })
    const total = await mongoStore.count("receipts", { userId: filterUserId })

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

    // For admin users, use companyId (parent account)
    // For regular users, use userId (their own account)
    const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId

    // Get client name for generating unique number with client code
    let clientName = "Unknown"
    if (body.clientId || body.selectedClientId) {
      try {
        const client = await mongoStore.getById("clients", body.clientId || body.selectedClientId)
        clientName = client?.name || "Unknown"
      } catch (err) {
        console.error("Error fetching client for number generation:", err)
      }
    }

    if (!body.receiptNumber) {
      body.receiptNumber = await generateNextNumber("receipts", "RC", filterUserId, clientName)
    }

    const receipt = await mongoStore.create("receipts", { ...body, userId: filterUserId })

    await logActivity(filterUserId, "create", "receipt", receipt._id?.toString(), { receiptNumber: body.receiptNumber })

    // Notify admins about new receipt
    try {
   const result=await createNotification({
                userId: user.userId,
                type: "receipt",
                title: "New Receipt Created",
                message: "A new receipt has been created: " + body.receiptNumber,
                link: `/dashboard/receipts/${receipt?._id?.toString()}`
              });

        console.log("Notification creation result:", result);

    } catch (notifError) {
      console.error("Failed to send notification:", notifError)
      // Don't fail the request if notification fails
    }

    return NextResponse.json({ success: true, data: receipt })
  } catch (error) {
    console.error("Receipt creation error:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Failed to create receipt", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 })
  }
})
