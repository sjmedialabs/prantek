import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await connectDB()
    const plan = await db.collection(Collections.SUBSCRIPTION_PLANS).findOne({ _id: new ObjectId(params.id) })
    
    if (!plan) {
      return NextResponse.json({ success: false, error: "Plan not found" }, { status: 404 })
    }
    
    return NextResponse.json({ 
      success: true, 
      data: plan,
      plan: plan
    })
  } catch (error) {
    console.error("Error fetching subscription plan:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch plan" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await connectDB()
    const data = await request.json()
    
    const result = await db.collection(Collections.SUBSCRIPTION_PLANS).updateOne(
      { _id: new ObjectId(params.id) },
      { $set: { ...data, updatedAt: new Date() } }
    )
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: "Plan not found" }, { status: 404 })
    }
    
    const updatedPlan = await db.collection(Collections.SUBSCRIPTION_PLANS).findOne({ _id: new ObjectId(params.id) })
    
    return NextResponse.json({ 
      success: true, 
      data: updatedPlan,
      plan: updatedPlan
    })
  } catch (error) {
    console.error("Error updating subscription plan:", error)
    return NextResponse.json({ success: false, error: "Failed to update plan" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await connectDB()
    
    const result = await db.collection(Collections.SUBSCRIPTION_PLANS).deleteOne({ _id: new ObjectId(params.id) })
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: "Plan not found" }, { status: 404 })
    }
    
    return NextResponse.json({ success: true, message: "Plan deleted successfully" })
  } catch (error) {
    console.error("Error deleting subscription plan:", error)
    return NextResponse.json({ success: false, error: "Failed to delete plan" }, { status: 500 })
  }
}
