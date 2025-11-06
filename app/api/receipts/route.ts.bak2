import { type NextRequest, NextResponse } from "next/server"
import { mongoStore, logActivity, generateNextNumber } from "@/lib/mongodb-store"
import { withAuth } from "@/lib/api-auth"

export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "100")
    const skip = (page - 1) * limit

    const receipts = await mongoStore.getAll("receipts", { userId: user.id }, { skip, limit, sort: { date: -1 } })
    const total = await mongoStore.count("receipts", { userId: user.id })

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
      body.receiptNumber = await generateNextNumber("receipts", "RC", user.id)
    }

    const receipt = await mongoStore.create("receipts", { ...body, userId: user.id })

    await logActivity(user.id, "create", "receipt", receipt._id?.toString(), { receiptNumber: body.receiptNumber })

    return NextResponse.json({ success: true, data: receipt })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create receipt" }, { status: 500 })
  }
})
