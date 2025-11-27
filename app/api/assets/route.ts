import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { createNotification } from "@/lib/notification-utils"
import { withAuth } from "@/lib/api-auth"

// ------------------- GET (WITH AUTH) -------------------
export const GET = withAuth(async (req: NextRequest, user: any) => {
  const db = await connectDB()
  
  // Use company ID for admin users, user ID for account owners
  const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId

  const assets = await db
    .collection(Collections.ASSETS)
    .find({ userId: filterUserId })
    .toArray()

  return NextResponse.json({ assets })
})


// ------------------- POST (WITH AUTH) -------------------
export const POST = withAuth(async (req: NextRequest, user: any) => {
  try {
    const db = await connectDB()
    const data = await req.json()

    // Use company ID for admin users, user ID for account owners
    const userId = user.isAdminUser && user.companyId ? user.companyId : user.userId

    const { id, _id, ...cleanData } = data

    const asset = {
      ...cleanData,
      userId,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection(Collections.ASSETS).insertOne(asset)
    try{
     await createNotification({
        userId: userId,
        type: "asset",
        title: "New Asset Created",
        message: "A new asset has been created: " + data.name,
        link: `/dashboard/assets`
     })
    }catch(err){
      console.error("Error creating notification for new asset:", err)
    }

    return NextResponse.json({ ...asset, _id: result.insertedId, success: true })
  } catch (err: any) {
    console.error("Error creating asset", err)
    return NextResponse.json(
      { error: "Failed to create asset", message: err.message },
      { status: 500 }
    )
  }
})
