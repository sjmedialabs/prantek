import { type NextRequest, NextResponse } from "next/server"
import { mongoStore, logActivity, generateNextNumber } from "@/lib/mongodb-store"
import { withAuth } from "@/lib/api-auth"
import { createNotification, notifyAdminsNewPayment } from "@/lib/notification-utils"
import { Collections } from "@/lib/db-config"
import { connectDB } from "@/lib/mongodb"
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
    const userIdStr = String(filterUserId ?? "").trim()
    if (!userIdStr) {
      return NextResponse.json({ success: false, error: "User context required to create payment" }, { status: 400 })
    }

    // Generate unique payment number per user (PAY-YYYY-NNN) via atomic counter
    if (!body.paymentNumber || typeof body.paymentNumber !== "string" || !body.paymentNumber.trim()) {
      body.paymentNumber = await generateNextNumber("payments", "PAY", filterUserId)
    }

    let payment
    try {
      payment = await mongoStore.create("payments", { ...body, userId: userIdStr })
    } catch (createError: any) {
      // Self-heal: if DB still has legacy unique index on paymentNumber only, drop it and ensure compound index
      const isDuplicateKey = createError?.code === 11000 || createError?.codeName === "DuplicateKey"
      const msg = String(createError?.message ?? createError?.errmsg ?? "")
      const isPaymentNumberIndex =
        isDuplicateKey &&
        (createError?.keyPattern?.paymentNumber === 1 ||
          "paymentNumber" in (createError?.keyValue || {}) ||
          /paymentNumber_1|dup key.*paymentNumber/i.test(msg))
      if (isPaymentNumberIndex) {
        const db = await connectDB()
        const paymentsCol = db.collection(Collections.PAYMENTS)
        try {
          await paymentsCol.dropIndex("paymentNumber_1")
        } catch (e: any) {
          if (e?.code !== 27 && e?.codeName !== "IndexNotFound") {
            console.warn("[Payments] Drop legacy index:", e?.message || e)
          }
        }
        try {
          await paymentsCol.createIndex({ userId: 1, paymentNumber: 1 }, { unique: true, background: true })
        } catch (e: any) {
          if (e?.code !== 85 && e?.codeName !== "IndexOptionsConflict") {
            console.warn("[Payments] Create compound index:", e?.message || e)
          }
        }
        payment = await mongoStore.create("payments", { ...body, userId: userIdStr })
      } else {
        throw createError
      }
    }

    // Notify admins about new payment
    try {
      const db = await connectDB()
      const quotationSettings = await db.collection(Collections.NOTIFICATIONSETTINGS).findOne({ userId: userIdStr })
      if(quotationSettings?.paymentNotifications){
         await createNotification({
        userId: userIdStr,
        type: "payment",
        title: "New Payment Created",
        message: "A new payment has been created: " + body.paymentNumber,
        link: `/dashboard/payments/${payment?._id?.toString()}`
      })
      }
    } catch (notifError) {
      console.error("Failed to send notification:", notifError)
      // Don't fail the request if notification fails
    }

    return NextResponse.json({ success: true, data: payment })
  } catch (error: any) {
    const message = error?.message || "Failed to create payment"
    console.error("[Payments POST]", message, error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
})
