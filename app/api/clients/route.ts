import { type NextRequest, NextResponse } from "next/server"
import { mongoStore } from "@/lib/mongodb-store"
import { logActivity } from "@/lib/mongodb-store"
import { withAuth } from "@/lib/api-auth"
import { createNotification } from "@/lib/notification-utils"

export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "100")
    const skip = (page - 1) * limit
 
    // For admin users, filter by companyId (parent account)
    // For regular users, filter by userId (their own account)
    const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId

    const clients = await mongoStore.getAll(
      "clients",
      { userId: String(filterUserId) },
      { skip, limit, sort: { createdAt: -1 } }
    )

    const total = await mongoStore.count("clients", { userId: filterUserId })

    return NextResponse.json({
      success: true,
      data: clients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch clients" }, { status: 500 })
  }
})

export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json()

    // For admin users, use companyId (parent account)
    // For regular users, use userId (their own account)
    const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId
    const userId = String(filterUserId)

    // ✅ Check if client with same email or name exists under same user
    const existingClient = await mongoStore.findOne("clients", {
      userId,
      $or: [
        { name: body.name },
        { email: body.email },
        {phone:body.phone}
      ]
    })

    if (existingClient) {
      return NextResponse.json({
        success: false,
        message: "Client name or email or mobile number already exists. Please use a different one."
      }, { status: 400 })
    }

    // ✅ Create new client
    const client = await mongoStore.create("clients", { 
      ...body, 
      userId 
    })

    await logActivity(userId, "create", "client", client._id?.toString(), { name: body.name })
    try{
        await createNotification({
        userId: user.userId,
        type: "client",
        title: "New Client Created",
        message: "A new client has been created: " + body.name,
        link: `/dashboard/clients/${client._id?.toString()}`
        })
    }catch(err){
      console.error("Error logging activity for client creation:", err)
    }

    return NextResponse.json({ success: true, data: client })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create client" }, { status: 500 })
  }
})
