import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { logActivity } from "@/lib/mongodb-store"
import { Collections } from "@/lib/db-config"
import { withAuth } from "@/lib/api-auth"

export const GET = withAuth(async (req: NextRequest, user: any) => {
  const db = await connectDB()
  
  // Super admins can see all employees, others see only their own
  const query = user.role === "super-admin" ? {} : { userId: user.userId }
  const employees = await db.collection(Collections.EMPLOYEES).find(query).toArray()

  return NextResponse.json(employees)
})

async function generateUniqueEmployeeNumber(db: any, userId: string): Promise<string> {
  const year = new Date().getFullYear()
  
  // Get the count of employees for this user
  const employeeCount = await db.collection(Collections.EMPLOYEES).countDocuments({ userId })
  
  // Try generating unique employee numbers with incrementing counters
  let attempts = 0
  const maxAttempts = 100
  
  while (attempts < maxAttempts) {
    const number = (employeeCount + attempts + 1).toString().padStart(4, "0")
    const employeeNumber = `EMP-${year}-${number}`
    
    // Check if this number already exists
    const existing = await db.collection(Collections.EMPLOYEES).findOne({ 
      userId, 
      employeeNumber 
    })
    
    if (!existing) {
      return employeeNumber
    }
    
    attempts++
  }
  
  // Fallback: use timestamp-based unique ID
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 6)
  return `EMP-${year}-${timestamp}${random}`.toUpperCase()
}

export const POST = withAuth(async (req: NextRequest, user: any) => {
  try {
    const db = await connectDB()
    const data = await req.json()

    // Validate required fields for employee
    if (!data.employeeName || !data.role && !data.designation) {
      return NextResponse.json(
        { error: "Employee name and designation are required" },
        { status: 400 }
      )
    }

    // Remove empty id and _id fields that come from the frontend
    const { id, _id, ...cleanData } = data

    // Generate unique employee number
    const uniqueEmployeeNumber = await generateUniqueEmployeeNumber(db, user.userId)
    // Map role to designation if designation is not provided
    if (!cleanData.designation && data.role) {
      cleanData.designation = data.role
    }


    const employee = {
      ...cleanData,
      employeeNumber: uniqueEmployeeNumber,
      userId: user.userId,
      employmentStatus: data.employmentStatus || "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection(Collections.EMPLOYEES).insertOne(employee)
    
    await logActivity(user.userId, "create", "employee", result.insertedId?.toString(), { 
      name: `${employee.employeeName} ${employee.surname || ''}`.trim(), 
      employeeNumber: employee.employeeNumber,
      designation: employee.designation
    })

    return NextResponse.json({ ...employee, _id: result.insertedId })
  } catch (error: any) {
    console.error("Error creating employee:", error)
    return NextResponse.json(
      { error: "Failed to create employee", message: error.message },
      { status: 500 }
    )
  }
})
