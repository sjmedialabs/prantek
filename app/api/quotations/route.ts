import { type NextRequest, NextResponse } from "next/server"
import { mongoStore, logActivity, generateNextNumber } from "@/lib/mongodb-store"
import { withAuth } from "@/lib/api-auth"
import { notifyAdminsNewQuotation } from "@/lib/notification-utils"

export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "100")
    const skip = (page - 1) * limit

    // For admin users, filter by companyId (parent account)
    // For regular users, filter by userId (their own account)
    const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId

    const quotations = await mongoStore.getAll("quotations", { userId: String(filterUserId) }, { skip, limit, sort: { date: -1 } })
    console.log(quotations)
    const total = await mongoStore.count("quotations", { userId: filterUserId })

    return NextResponse.json({
      success: true,
      data: quotations, 
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch quotations" }, { status: 500 })
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
    if (body.clientId) {
      try {
        const client = await mongoStore.getById("clients", body.clientId)
        clientName = client?.name || "Unknown"
      } catch (err) {
        console.error("Error fetching client for number generation:", err)
      }
    }

    if (!body.quotationNumber) {
      body.quotationNumber = await generateNextNumber("quotations", "QT", filterUserId, clientName)
    }

    console.log("user id is :::", filterUserId)
    const quotation = await mongoStore.create("quotations", { ...body, userId: filterUserId })

    await logActivity(filterUserId, "create", "quotation", quotation._id?.toString(), {
      quotationNumber: body.quotationNumber,
    })

    // Notify admins about new quotation
    try {
      await notifyAdminsNewQuotation(
        quotation._id?.toString() || "",
        body.quotationNumber,
        clientName,
        filterUserId
      )
    } catch (notifError) {
      console.error("Failed to send notification:", notifError)
      // Don't fail the request if notification fails
    }

    return NextResponse.json({ success: true, data: quotation })
  } catch (error) {
    console.error("[Quotation Create Error]:", error)
    return NextResponse.json({ success: false, error: "Failed to create quotation" }, { status: 500 })
  }
})
