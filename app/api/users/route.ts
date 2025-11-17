import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { ObjectId } from "mongodb"
import bcrypt from "bcryptjs"

// GET - Fetch all admin users
export async function GET(request: NextRequest) {
  try {
    const db = await connectDB()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId") // Company/owner filter if needed
    
    const query = userId ? { companyId: userId } : {}
    const adminUsers = await db.collection(Collections.ADMIN_USERS).find(query).toArray()
    
    // Fetch associated roles for each user
    const usersWithRoles = await Promise.all(
      adminUsers.map(async (user) => {
        const { password, ...safeUser } = user as any
        if (user.roleId) {
          const role = await db.collection(Collections.ROLES).findOne({ _id: new ObjectId(user.roleId) })
          return { ...safeUser, roleName: role?.name, rolePermissions: role?.permissions }
        }
        return safeUser
      })
    )
    
    return NextResponse.json({ 
      success: true, 
      data: usersWithRoles,
      users: usersWithRoles
    })
  } catch (error) {
    console.error("Error fetching admin users:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch admin users" }, { status: 500 })
  }
}

// POST - Create new admin user with credentials
export async function POST(request: NextRequest) {
  try {
    const db = await connectDB()
    const data = await request.json()
    
    // Validate required fields
    if (!data.email || !data.password || !data.name) {
      return NextResponse.json(
        { success: false, error: "Email, password, and name are required" }, 
        { status: 400 }
      )
    }
    
    // Check if email already exists
    const existingUser = await db.collection(Collections.ADMIN_USERS).findOne({ email: data.email })
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "Email already exists" }, 
        { status: 409 }
      )
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10)
    
    // Fetch role permissions if roleId is provided
    let permissions = []
    if (data.roleId) {
      const role = await db.collection(Collections.ROLES).findOne({ _id: new ObjectId(data.roleId) })
      if (role) {
        permissions = role.permissions || []
      }
    }
    
    const newAdminUser = {
      email: data.email,
      password: hashedPassword,
      name: data.name,
      companyId: data.companyId || null,
      role: data.role || "admin",  // "admin" or "super-admin"
      roleId: data.roleId || null,
      permissions: permissions,
      phone: data.phone || null,
      avatar: data.avatar || null,
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: null,
    }
    
    const result = await db.collection(Collections.ADMIN_USERS).insertOne(newAdminUser)
    
    // Remove password from response
    const { password: _, ...safeUser } = newAdminUser
    
    return NextResponse.json({ 
      success: true, 
      data: { ...safeUser, _id: result.insertedId, id: result.insertedId.toString() },
      user: { ...safeUser, _id: result.insertedId, id: result.insertedId.toString() }
    })
  } catch (error) {
    console.error("Error creating admin user:", error)
    return NextResponse.json({ success: false, error: "Failed to create admin user" }, { status: 500 })
  }
}

// PUT - Update admin user
export async function PUT(request: NextRequest) {
  try {
    const db = await connectDB()
    const data = await request.json()
    const { id, _id, password, ...updateData } = data
    
    const userId = _id || id
    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 })
    }
    
    // Build update object
    const finalUpdate: any = { ...updateData, updatedAt: new Date() }
    
    // Hash password if being updated
    if (password && password.trim() !== "") {
      finalUpdate.password = await bcrypt.hash(password, 10)
    }
    
    // Update permissions if roleId changed
    if (updateData.roleId) {
      const role = await db.collection(Collections.ROLES).findOne({ _id: new ObjectId(updateData.roleId) })
      if (role) {
        finalUpdate.permissions = role.permissions || []
      }
    }
    
    const result = await db.collection(Collections.ADMIN_USERS).updateOne(
      { _id: new ObjectId(userId) },
      { $set: finalUpdate }
    )
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: "Admin user not found" }, { status: 404 })
    }
    
    const updatedUser = await db.collection(Collections.ADMIN_USERS).findOne({ _id: new ObjectId(userId) })
    
    // Remove password from response
    if (updatedUser) {
      const { password: _, ...safeUser } = updatedUser as any
      return NextResponse.json({ 
        success: true, 
        data: safeUser,
        user: safeUser
      })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating admin user:", error)
    return NextResponse.json({ success: false, error: "Failed to update admin user" }, { status: 500 })
  }
}

// DELETE - Delete admin user
export async function DELETE(request: NextRequest) {
  try {
    const db = await connectDB()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    
    if (!id) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 })
    }
    
    const result = await db.collection(Collections.ADMIN_USERS).deleteOne({ _id: new ObjectId(id) })
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: "Admin user not found" }, { status: 404 })
    }
    
    return NextResponse.json({ success: true, message: "Admin user deleted successfully" })
  } catch (error) {
    console.error("Error deleting admin user:", error)
    return NextResponse.json({ success: false, error: "Failed to delete admin user" }, { status: 500 })
  }
}
