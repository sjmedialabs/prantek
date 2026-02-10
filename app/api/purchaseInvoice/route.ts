import { type NextRequest, NextResponse } from "next/server"
import { mongoStore, generateNextNumber, logActivity } from "@/lib/mongodb-store"
import { withAuth } from "@/lib/api-auth"

export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url)

    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "100")
    const skip = (page - 1) * limit

    const filterUserId =
      user.isAdminUser && user.companyId ? user.companyId : user.userId

    const invoices = await mongoStore.getAll(
      "purchaseInvoice",
      { userId: String(filterUserId) },
      { skip, limit, sort: { date: -1 } }
    )

    const total = await mongoStore.count("purchaseInvoice", {
      userId: String(filterUserId),
    })

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
    console.error("Failed to fetch purchase invoices:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch purchase invoices" },
      { status: 500 }
    )
  }
})

export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json()
    const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId

    // Ensure userId is set
    body.userId = filterUserId
    // body.createdBy = user.userId

    // Generate number if missing
    if (!body.purchaseInvoiceNumber) {
      body.purchaseInvoiceNumber = await generateNextNumber("purchaseInvoice", "PI", filterUserId)
    }

    const newInvoice = await mongoStore.create("purchaseInvoice", body)

    await logActivity(filterUserId, "create", "purchaseInvoice", newInvoice._id.toString())

    return NextResponse.json({ success: true, data: newInvoice })
  } catch (error) {
    console.error("Failed to create purchase invoice:", error)
    return NextResponse.json(
      { success: false, error: "Failed to create purchase invoice" },
      { status: 500 }
    )
  }
})
