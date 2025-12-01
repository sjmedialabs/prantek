import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { logActivity } from "@/lib/mongodb-store"
import { Collections } from "@/lib/db-config"
import { withAuth } from "@/lib/api-auth"
export const POST = withAuth(async (req: NextRequest, user: any) => {
  try {
    const db = await connectDB()
    const data = await req.json()

    const result = await db.collection(Collections.NOTIFICATIONSETTINGS).insertOne(data)
    
   

    return NextResponse.json({ ...data, _id: result.insertedId })
  } catch (error: any) {
    console.error("Error creating employee:", error)
    return NextResponse.json(
      { error: "Failed to create employee", message: error.message },
      { status: 500 }
    )
  }
})
export const GET = withAuth(async (req: NextRequest, user: any) => {
  try {
    const db = await connectDB()

    // user.userId comes from withAuth
    const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId
    const filter = { userId: String(filterUserId) }

    if (!filter) {
      return NextResponse.json(
        { error: "User ID missing in token" },
        { status: 400 }
      )
    }

    const result = await db
      .collection(Collections.NOTIFICATIONSETTINGS)
      .findOne(filter)

    return NextResponse.json(result || {})
  } catch (error: any) {
    console.error("Error fetching notification settings:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch notification settings",
        message: error.message,
      },
      { status: 500 }
    )
  }
})
export const PUT = withAuth(async (req: NextRequest, user: any) => {
  try {
    const db = await connectDB()
    const data = await req.json()
    
    console.log("updating notification settings with data:", data);
    // Determine which user ID to use
    const filterUserId =
      user.isAdminUser && user.companyId ? user.companyId : user.userId

    const filter = { userId: String(filterUserId) }

    if (!filter.userId) {
      return NextResponse.json(
        { error: "User ID missing in token" },
        { status: 400 }
      )
    }

    // Update the document
    const result = await db
      .collection(Collections.NOTIFICATIONSETTINGS)
      .findOneAndUpdate(
        filter,
        { $set: data },
        { returnDocument: "after", upsert: true } // create if not exist
      )
    //   console.log("updated notification settings:", result)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Error updating notification settings:", error)
    return NextResponse.json(
      {
        error: "Failed to update notification settings",
        message: error.message,
      },
      { status: 500 }
    )
  }
})
