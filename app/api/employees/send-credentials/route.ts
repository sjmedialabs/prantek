import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { withAuth } from "@/lib/api-auth"
import { sendEmployeeCredentials } from "@/lib/email"
import { ObjectId } from "mongodb"
import bcrypt from "bcryptjs"

/**
 * Generate a random temporary password
 */
function generateTempPassword(): string {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  const lowercase = "abcdefghijklmnopqrstuvwxyz"
  const numbers = "0123456789"
  const special = "!@#$%"
  
  // Ensure at least one of each type
  let password = ""
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += special[Math.floor(Math.random() * special.length)]
  
  // Fill the rest randomly (total 10 characters)
  const allChars = uppercase + lowercase + numbers + special
  for (let i = password.length; i < 10; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

/**
 * POST /api/employees/send-credentials
 * Send login credentials to an employee
 */
export const POST = withAuth(async (req: NextRequest, user: any) => {
  try {
    const db = await connectDB()
    const { employeeId } = await req.json()

    if (!employeeId) {
      return NextResponse.json(
        { error: "Employee ID is required" },
        { status: 400 }
      )
    }

    // Get employee details
    const employee = await db.collection(Collections.EMPLOYEES).findOne({
      _id: new ObjectId(employeeId),
      userId: user.userId
    })

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      )
    }

    // Check if user account already exists
    const existingUser = await db.collection(Collections.USERS).findOne({
      email: employee.email
    })

    let tempPassword = ""
    let isNewAccount = false

    if (existingUser) {
      // Account already exists - inform admin
      return NextResponse.json(
        { 
          error: "An account already exists for this employee. They can use the 'Forgot Password' feature if needed.",
          accountExists: true
        },
        { status: 400 }
      )
    } else {
      // Create new user account for employee
      tempPassword = generateTempPassword()
      const hashedPassword = await bcrypt.hash(tempPassword, 10)

      // Get role details for permissions
      const role = await db.collection(Collections.ROLES).findOne({
        _id: new ObjectId(employee.role)
      })

      const newUser = {
        email: employee.email,
        password: hashedPassword,
        name: `${employee.employeeName} ${employee.surname}`,
        role: "user", // Regular user, not super-admin
        employeeId: employee._id,
        permissions: role?.permissions || [],
        subscriptionPlanId: user.subscriptionPlanId, // Inherit from admin
        subscriptionStatus: user.subscriptionStatus || "active",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await db.collection(Collections.USERS).insertOne(newUser)
      isNewAccount = true
    }

    // Get company name if available
    const admin = await db.collection(Collections.USERS).findOne({
      _id: new ObjectId(user.userId)
    })
    const companyName = admin?.companyName || admin?.name

    // Send credentials email
    const emailSent = await sendEmployeeCredentials(
      employee.email,
      `${employee.employeeName} ${employee.surname}`,
      tempPassword,
      companyName
    )

    if (!emailSent) {
      console.warn("[CREDENTIALS] Email not sent - SMTP not configured")
      // Still return success but indicate email wasn't sent
      return NextResponse.json({
        success: true,
        message: "Employee account created successfully",
        emailSent: false,
        tempPassword, // Return password for manual sharing
        isNewAccount,
        warning: "Email service is not configured. Please share these credentials manually."
      })
    }

    return NextResponse.json({
      success: true,
      message: isNewAccount 
        ? "Employee account created and credentials sent successfully"
        : "Credentials resent successfully",
      emailSent: true,
      isNewAccount
    })

  } catch (error: any) {
    console.error("Error sending employee credentials:", error)
    return NextResponse.json(
      { error: "Failed to send credentials", message: error.message },
      { status: 500 }
    )
  }
})
