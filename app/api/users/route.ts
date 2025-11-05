import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { ObjectId } from "mongodb"
import bcrypt from "bcryptjs"

export async function GET() {
  try {
    const db = await connectDB()
    const users = await db.collection(Collections.USERS).find({}).toArray()
    
    // Remove passwords from response
    const safeUsers = users.map(({ password, ...user }) => user)
    
    return NextResponse.json({ 
      success: true, 
      data: safeUsers,
      users: safeUsers
    })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch users" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await connectDB()
    const data = await request.json()
    
    // Hash password if provided
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10)
    }
    
    const newUser = {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    
    const result = await db.collection(Collections.USERS).insertOne(newUser)
    
    // Remove password from response
    const { password, ...safeUser } = newUser
    
    return NextResponse.json({ 
      success: true, 
      data: { ...safeUser, _id: result.insertedId, id: result.insertedId.toString() },
      user: { ...safeUser, _id: result.insertedId, id: result.insertedId.toString() }
    })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ success: false, error: "Failed to create user" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const db = await connectDB()
    const data = await request.json()
    const { id, _id, password, ...updateData } = data
    
    const userId = _id || id
    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 })
    }
    
    // Hash password if being updated
    const finalUpdate: any = { ...updateData, updatedAt: new Date() }
    if (password) {
      finalUpdate.password = await bcrypt.hash(password, 10)
    }
    
    const result = await db.collection(Collections.USERS).updateOne(
      { _id: new ObjectId(userId) },
      { $set: finalUpdate }
    )
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }
    
    const updatedUser = await db.collection(Collections.USERS).findOne({ _id: new ObjectId(userId) })
    
    // Remove password from response
    if (updatedUser) {
      const { password: _, ...safeUser } = updatedUser
      return NextResponse.json({ 
        success: true, 
        data: safeUser,
        user: safeUser
      })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ success: false, error: "Failed to update user" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const db = await connectDB()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    
    if (!id) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 })
    }
    
    const result = await db.collection(Collections.USERS).deleteOne({ _id: new ObjectId(id) })
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }
    
    return NextResponse.json({ success: true, message: "User deleted successfully" })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ success: false, error: "Failed to delete user" }, { status: 500 })
  }
}
