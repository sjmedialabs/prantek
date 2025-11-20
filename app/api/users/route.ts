import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { withAuth } from "@/lib/api-auth"
import { ObjectId } from "mongodb"
import bcrypt from "bcryptjs"

export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    const db = await connectDB()

    let filter = {}
    
    // If not super-admin, filter by companyId
    if (user.role !== "super-admin") {
      // For admin users, use their companyId
      // For regular users, use their userId as companyId
      const filterCompanyId = user.companyId || user.userId
      filter = { companyId: filterCompanyId }
    }

    const adminUsers = await db.collection(Collections.USERS).find(filter).toArray()

    // Fetch role names for each user
    const usersWithRoles = await Promise.all(
      adminUsers.map(async (adminUser) => {
        let roleName = null
        if (adminUser.roleId) {
          try {
            const role = await db.collection(Collections.ROLES).findOne({
              _id: new ObjectId(adminUser.roleId as string)
            })
            roleName = role?.name || null
          } catch (e) {
            console.error("Error fetching role:", e)
          }
        }

        const { password, ...userWithoutPassword } = adminUser
        return {
          ...userWithoutPassword,
          id: adminUser._id?.toString(),
          _id: adminUser._id?.toString(),
          roleName
        }
      })
    )

    return NextResponse.json({ 
      success: true, 
      data: usersWithRoles,
      users: usersWithRoles 
    })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch users" }, { status: 500 })
  }
})

export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    const db = await connectDB()
    const body = await request.json()

    if (!body.email || !body.password || !body.name) {
      return NextResponse.json({ 
        success: false, 
        error: "Email, password, and name are required" 
      }, { status: 400 })
    }

    // Check if email exists in users
    const existingAdminUser = await db.collection(Collections.USERS).findOne({ 
      email: body.email.toLowerCase() 
    })
    
    if (existingAdminUser) {
      return NextResponse.json({ 
        success: false, 
        error: "Email already exists" 
      }, { status: 409 })
    }

    // Also check in regular users collection
    const existingUser = await db.collection(Collections.USERS).findOne({ 
      email: body.email.toLowerCase() 
    })
    
    if (existingUser) {
      return NextResponse.json({ 
        success: false, 
        error: "Email already exists in the system" 
      }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(body.password, 10)
    
    // Get permissions from role if roleId is provided
    let permissions = body.permissions || []
    if (body.roleId) {
      try {
        const role = await db.collection(Collections.ROLES).findOne({
          _id: new ObjectId(body.roleId)
        })
        if (role?.permissions) {
          permissions = role.permissions
        }
      } catch (e) {
        console.error("Error fetching role permissions:", e)
      }
    }

    // Use companyId from request or from the user
    const companyId = body.companyId || user.companyId || user.userId

    const newUser = {
      email: body.email.toLowerCase(),
      password: hashedPassword,
      name: body.name,
      companyId,
      role: body.role || "admin",
      roleId: body.roleId || null,
      permissions,
      phone: body.phone || null,
      avatar: body.avatar || null,
      isActive: body.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: null
    }

    const result = await db.collection(Collections.USERS).insertOne(newUser)

    const { password: _, ...userWithoutPassword } = newUser

    return NextResponse.json({ 
      success: true, 
      data: { 
        ...userWithoutPassword, 
        _id: result.insertedId,
        id: result.insertedId.toString()
      } 
    })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ success: false, error: "Failed to create user" }, { status: 500 })
  }
})

export const PUT = withAuth(async (request: NextRequest, user) => {
  try {
    const db = await connectDB()
    const body = await request.json()

    if (!body._id) {
      return NextResponse.json({ 
        success: false, 
        error: "User ID is required" 
      }, { status: 400 })
    }

    if (!ObjectId.isValid(body._id)) {
      return NextResponse.json({ 
        success: false, 
        error: "Invalid user ID" 
      }, { status: 400 })
    }

    const { _id, password, ...updateData } = body

    // Hash password if being updated
    const finalUpdate: any = { ...updateData, updatedAt: new Date() }
    if (password && password.trim() !== "") {
      finalUpdate.password = await bcrypt.hash(password, 10)
    }

    // Get permissions from role if roleId is provided
    if (updateData.roleId && updateData.roleId !== "none") {
      try {
        const role = await db.collection(Collections.ROLES).findOne({
          _id: new ObjectId(updateData.roleId)
        })
        if (role?.permissions) {
          finalUpdate.permissions = role.permissions
        }
      } catch (e) {
        console.error("Error fetching role permissions:", e)
      }
    } else if (updateData.roleId === "none") {
      finalUpdate.roleId = null
      finalUpdate.permissions = []
    }

    const result = await db.collection(Collections.USERS).updateOne(
      { _id: new ObjectId(_id) },
      { $set: finalUpdate }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "User not found" 
      }, { status: 404 })
    }

    const updatedUser = await db.collection(Collections.USERS).findOne({ 
      _id: new ObjectId(_id) 
    })

    if (updatedUser) {
      const { password: _, ...safeUser } = updatedUser
      return NextResponse.json({ 
        success: true, 
        data: {
          ...safeUser,
          id: safeUser._id?.toString(),
          _id: safeUser._id?.toString()
        },
        user: {
          ...safeUser,
          id: safeUser._id?.toString(),
          _id: safeUser._id?.toString()
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Failed to update user" 
    }, { status: 500 })
  }
})
