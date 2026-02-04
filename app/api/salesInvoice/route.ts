import { type NextRequest, NextResponse } from "next/server"
import { mongoStore, generateNextNumber, logActivity } from "@/lib/mongodb-store"
import { withAuth } from "@/lib/api-auth"

export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url)
    // const userId = searchParams.get("userId")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "100")
    const skip = (page - 1) * limit

    // if (!userId) {
    //   return NextResponse.json({ success: false, error: "User ID required" }, { status: 400 })
    // }
    const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId
    const invoices = await mongoStore.getAll(
      "salesInvoice", 
      { userId: String(filterUserId) }, 
      { skip, limit, sort: { date: -1 } }
    )
    const total = await mongoStore.count("salesInvoice", { userId: String(filterUserId) })

    return NextResponse.json({
      success: true,
      data: invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Failed to fetch invoices:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch invoices" }, { status: 500 })
  }
})

export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const body = await request.json()

        const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId
    // if (!userId) {
    //   return NextResponse.json({ success: false, error: "User ID required" }, { status: 400 })
    // }

    // Generate invoice number if not provided
    if (!body.salesInvoiceNumber) {
      body.salesInvoiceNumber = await generateNextNumber("salesInvoice", "INV", filterUserId, body.clientName)
    }

    const invoice = await mongoStore.create("salesInvoice", { ...body, userId: filterUserId })

    await logActivity(filterUserId, "create", "salesInvoice", invoice._id?.toString(), {
      salesInvoiceNumber: body.salesInvoiceNumber,
    })
    await mongoStore.update("quotations", body.sourceQuotationId, {
  salesInvoiceId: invoice._id.toString(),
  convertedAt: new Date(),
})
    return NextResponse.json({ success: true, data: invoice })
  } catch (error) {
    console.error("Failed to create invoice:", error)
    return NextResponse.json({ success: false, error: "Failed to create invoice" }, { status: 500 })
  }
})
