import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { withAuth } from "@/lib/api-auth"
import { ObjectId } from "mongodb"
import bcrypt from "bcryptjs"

/*************************************************************
 * Helper: Pick collection based on userType
 *************************************************************/
function getCollection(db: any, userType: string) {
  return userType === "admin-user"
    ? db.collection(Collections.ADMIN_USERS)
    : db.collection(Collections.USERS)
}

/*************************************************************
 * GET — Fetch Users / Admin-Users
 *************************************************************/
export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    const db = await connectDB()

    const userType = request.nextUrl.searchParams.get("userType") || "admin"  

    const collection = getCollection(db, userType)

    let filter: any = {}

    if (user.role !== "super-admin") {
      filter.companyId = user.companyId || user.userId
    }

    const adminUsers = await collection.find(filter).toArray()

    const usersWithDetails = await Promise.all(
      adminUsers.map(async (adminUser) => {
        let roleName = null
        let employeeData = null

        // Fetch role name if roleId exists (backward compatibility)
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

        // Fetch employee data if employeeId exists (new flow)
        if (adminUser.employeeId) {
          try {
            const employee = await db.collection(Collections.EMPLOYEES).findOne({
              _id: new ObjectId(adminUser.employeeId as string)
            })
            if (employee) {
              employeeData = {
                employeeId: employee._id?.toString(),
                employeeNumber: employee.employeeNumber,
                employeeName: employee.employeeName,
                surname: employee.surname,
                designation: employee.designation
              }
            }
          } catch (e) {
            console.error("Error fetching employee:", e)
          }
        }

        const { password, ...safe } = adminUser
        return {
          ...safe,
          id: adminUser._id?.toString(),
          _id: adminUser._id?.toString(),
          roleName,
          employee: employeeData
        }
      })
    )

    return NextResponse.json({ success: true, users: usersWithDetails })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch users" }, { status: 500 })
  }
})


/*************************************************************
 * POST — CREATE Admin User / Admin-User
 *************************************************************/
export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    const db = await connectDB()
    const body = await request.json()

    const userType = body.userType || "admin-user"
    const collection = getCollection(db, userType)

    // NEW FLOW: Using employeeId
    if (body.employeeId) {
      if (!body.password) {
        return NextResponse.json({
          success: false,
          error: "Password is required"
        }, { status: 400 })
      }

      // Fetch employee data
      const employee = await db.collection(Collections.EMPLOYEES).findOne({
        _id: new ObjectId(body.employeeId)
      })

      if (!employee) {
        return NextResponse.json({
          success: false,
          error: "Employee not found"
        }, { status: 404 })
      }

      if (!employee.email) {
        return NextResponse.json({
          success: false,
          error: "Employee does not have an email address"
        }, { status: 400 })
      }

      // Check if employee already has admin access
      const existingUser = await collection.findOne({ 
        employeeId: body.employeeId 
      })

      if (existingUser) {
        return NextResponse.json({
          success: false,
          error: "This employee already has admin access"
        }, { status: 409 })
      }

      // Check if email already exists
      const emailAlready = await collection.findOne({ 
        email: employee.email.toLowerCase() 
      })

      if (emailAlready) {
        return NextResponse.json({
          success: false,
          error: "Email already exists"
        }, { status: 409 })
      }

      const hashedPassword = await bcrypt.hash(body.password, 10)
      const companyId = user.companyId || user.userId

      const newUser = {
        email: employee.email.toLowerCase(),
        password: hashedPassword,
        name: `${employee.employeeName} ${employee.surname || ''}`.trim(),
        userType: "admin-user",
        companyId,
        employeeId: body.employeeId,
        permissions: body.permissions || [],
        phone: employee.phone || null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const result = await collection.insertOne(newUser)

      const { password: _, ...safe } = newUser

      return NextResponse.json({
        success: true,
        data: { ...safe, _id: result.insertedId.toString(), id: result.insertedId.toString() }
      })
    }

    // OLD FLOW: Manual entry with roleId (backward compatibility)
    if (!body.email || !body.password || !body.name) {
      return NextResponse.json({
        success: false,
        error: "Email, password, and name are required"
      }, { status: 400 })
    }

    const emailAlready = await collection.findOne({ email: body.email.toLowerCase() })
    if (emailAlready) {
      return NextResponse.json({
        success: false,
        error: "Email already exists"
      }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(body.password, 10)

    let permissions = []
    if (body.roleId) {
      const role = await db.collection(Collections.ROLES).findOne({
        _id: new ObjectId(body.roleId)
      })
      permissions = role?.permissions || []
    }

    const companyId = user.companyId || user.userId

    const newUser = {
      email: body.email.toLowerCase(),
      password: hashedPassword,
      name: body.name,
      userType: "admin-user",
      companyId,
      roleId: body.roleId || null,
      permissions,
      phone: body.phone || null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await collection.insertOne(newUser)

    const { password: _, ...safe } = newUser

    return NextResponse.json({
      success: true,
      data: { ...safe, _id: result.insertedId.toString(), id: result.insertedId.toString() }
    })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ success: false, error: "Failed to create user" }, { status: 500 })
  }
})


/*************************************************************
 * PUT — UPDATE Admin User / Admin-User
 *************************************************************/
export const PUT = withAuth(async (request: NextRequest, user) => {
  try {
    const db = await connectDB()
    const body = await request.json()

    const userType = body.userType || "admin-user"

    const collection = getCollection(db, userType)

    if (!body._id) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 })
    }

    const { _id, password, ...updateData } = body

    if (password) {
      updateData.password = await bcrypt.hash(password, 10)
    }

    // Handle permissions update
    // If permissions array is provided directly, use it
    if (body.permissions && Array.isArray(body.permissions)) {
      updateData.permissions = body.permissions
    }
    // Otherwise, get permissions from roleId (backward compatibility)
    else if (body.roleId) {
      const role = await db.collection(Collections.ROLES).findOne({
        _id: new ObjectId(body.roleId)
      })
      updateData.permissions = role?.permissions || []
    }

    updateData.updatedAt = new Date()

    await collection.updateOne(
      { _id: new ObjectId(_id) },
      { $set: updateData }
    )

    const updated = await collection.findOne({ _id: new ObjectId(_id) })
    if (!updated) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })

    const { password: _, ...safe } = updated

    return NextResponse.json({ success: true, data: safe })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ success: false, error: "Failed to update user" }, { status: 500 })
  }
})
