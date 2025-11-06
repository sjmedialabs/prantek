import { type NextRequest, NextResponse } from "next/server"
import { mongoStore, logActivity, generateNextNumber } from "@/lib/mongodb-store"
import { withAuth } from "@/lib/api-auth"

export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "100")
    const skip = (page - 1) * limit

    const payments = await mongoStore.getAll("payments", { userId: user.userId }, { skip, limit, sort: { date: -1 } })
    const total = await mongoStore.count("payments", { userId: user.userId })

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

    if (!body.paymentNumber) {
      body.paymentNumber = await generateNextNumber("payments", "PAY", user.userId)
    }

    const payment = await mongoStore.create("payments", { ...body, userId: user.id })

    await logActivity(user.userId, "create", "payment", payment._id?.toString(), { paymentNumber: body.paymentNumber })

    return NextResponse.json({ success: true, data: payment })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create payment" }, { status: 500 })
  }
})
