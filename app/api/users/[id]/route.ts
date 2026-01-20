import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { ObjectId } from "mongodb"
import bcrypt from "bcryptjs"
import { withAuth, hasPermission } from "@/lib/api-auth"
import { createNotification } from "@/lib/notification-utils"
import { sub } from "date-fns"

// ✅ helper
function getIdFromRequest(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split("/")
  return segments[segments.length - 1]
}

/**
 * GET /api/users/:id
 * Get a specific user by ID
 */
export const GET = withAuth(async (req: NextRequest, user) => {
  // Check manage_users permission
  if (!hasPermission(user, "manage_users")) {
    return NextResponse.json({ success: false, error: "Forbidden - manage_users permission required" }, { status: 403 })
  }

  const id = getIdFromRequest(req)
  
  if (!id || !ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
  }

  try {
    const db = await connectDB()
    
    // Try to find user in admin_users collection first
    let adminUser = await db.collection(Collections.ADMIN_USERS).findOne({ _id: new ObjectId(id) })
    
    // If not found, try users collection (for account owners with subscriptions)
    if (!adminUser) {
      adminUser = await db.collection(Collections.USERS).findOne({ _id: new ObjectId(id) })
    }

    if (!adminUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Remove password from response
    const { password, ...safeUser } = adminUser as any

    return NextResponse.json({ success: true, data: safeUser, user: safeUser })
  } catch (error: any) {
    console.error("Error fetching user:", error)
    return NextResponse.json(
      { error: "Failed to fetch user", message: error.message },
      { status: 500 }
    )
  }
})
/**
 * PUT /api/users/:id
 * Update a user
 */
export const PUT = withAuth(async (req: NextRequest, user) => {
  // Check manage_users permission
  if (!hasPermission(user, "manage_users")) {
    return NextResponse.json({ success: false, error: "Forbidden - manage_users permission required" }, { status: 403 })
  }
  const id = getIdFromRequest(req)
  
  if (!id || !ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
  }

  try {
    const body = await req.json()
    const { password, _id, ...updateData } = body
    console.log("Update data for user:", id, updateData);

    // Set updated timestamp
    updateData.updatedAt = new Date()

    // If password is being updated, hash it
    if (password) {
      const salt = await bcrypt.genSalt(10)
      updateData.password = await bcrypt.hash(password, salt)
    }

    // Handle role permissions if roleId is provided
    if (updateData.roleId) {
      if (updateData.roleId === "none") {
        // Clear role and permissions
        updateData.roleId = null
        updateData.permissions = []
      } else {
        // Fetch role and copy its permissions
        try {
          const db = await connectDB()
          const role = await db.collection(Collections.ROLES).findOne({ _id: new ObjectId(updateData.roleId) })
          if (role) {
            updateData.permissions = role.permissions || []
          }
        } catch (roleError) {
          console.error("Error fetching role permissions:", roleError)
        }
      }
    }

    //update subscription details if provided


    const db = await connectDB()
    
    // Try to find user in admin_users collection first
    let collection = Collections.ADMIN_USERS
    let user = await db.collection(collection).findOne({ _id: new ObjectId(id) })
    
    
    // If not found, try users collection (for account owners with subscriptions)
    if (!user) {
      collection = Collections.USERS
      user = await db.collection(collection).findOne({ _id: new ObjectId(id) })
    }
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    
    // Update the user in the appropriate collection
    const result = await db.collection(collection).updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )

    if(updateData.subscriptionPlanId){
      
      let subscriptionPlans= await db.collection(Collections.SUBSCRIPTION_PLANS).find().toArray();
      let filteredPlans=subscriptionPlans?.filter((eachItem:any)=>eachItem._id.toString()===updateData.subscriptionPlanId);
      console.log("Subscription plan details for notification:",filteredPlans)
      let superAdmindetails= await db.collection(Collections.USERS).findOne({role:"super-admin"});
      await createNotification({
         userId:superAdmindetails?._id.toString()||"",
          type:"subscription-updated",
          title:"Subscription Updated",
          message:`User with email ${user?.email} has updated subscription to plan ${filteredPlans[0]?.name}`,
          link:"/super-admin/clients"
      })
      
    }

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Fetch updated user
    const updatedUser = await db.collection(collection).findOne({ _id: new ObjectId(id) })

    // Remove password from response
    const { password: _, ...safeUser } = updatedUser as any

    return NextResponse.json({ success: true, data: safeUser })
  } catch (error: any) {
    console.error("Error updating user:", error)
    return NextResponse.json(
      { error: "Failed to update user", message: error.message },
      { status: 500 }
    )
  }
})

/**
 * DELETE /api/users/:id
 * Delete a user
 */
export const DELETE = withAuth(async (req: NextRequest, user) => {
  // Check manage_users permission
  if (!hasPermission(user, "manage_users")) {
    return NextResponse.json({ success: false, error: "Forbidden - manage_users permission required" }, { status: 403 })
  }
  const id = getIdFromRequest(req)
  
  if (!id || !ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
  }

  try {
    const db = await connectDB()
    
    // Try to delete from admin_users first
    let result = await db.collection(Collections.ADMIN_USERS).deleteOne({ _id: new ObjectId(id) })
    
    // If not found in admin_users, try users collection
    if (result.deletedCount === 0) {
      result = await db.collection(Collections.USERS).deleteOne({ _id: new ObjectId(id) })
    }

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "User deleted successfully" })
  } catch (error: any) {
    console.error("Error deleting user:", error)
    return NextResponse.json(
      { error: "Failed to delete user", message: error.message },
      { status: 500 }
    )
  }
})
