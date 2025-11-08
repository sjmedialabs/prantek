import { type NextRequest, NextResponse } from "next/server"
import { mongoStore, logActivity, generateNextNumber } from "@/lib/mongodb-store"
import { withAuth } from "@/lib/api-auth"

export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "100")
    const skip = (page - 1) * limit

    const quotations = await mongoStore.getAll("quotations", { userId:String( user.userId) }, { skip, limit, sort: { date: -1 } })
    console.log(quotations)
    const total = await mongoStore.count("quotations", { userId: user.userId })

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

    if (!body.quotationNumber) {
      body.quotationNumber = await generateNextNumber("quotations", "QT", user.userId)
    }

    const quotation = await mongoStore.create("quotations", { ...body, userId: user.id })

    await logActivity(user.userId, "create", "quotation", quotation._id?.toString(), {
      quotationNumber: body.quotationNumber,
    })

    return NextResponse.json({ success: true, data: quotation })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create quotation" }, { status: 500 })
  }
})
