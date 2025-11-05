import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { ObjectId } from "mongodb"

export async function GET() {
  try {
    const db = await connectDB()
    const plans = await db.collection(Collections.SUBSCRIPTION_PLANS).find({}).toArray()
    
    return NextResponse.json({ 
      success: true, 
      data: plans,
      subscriptionPlans: plans,
      plans: plans
    })
  } catch (error) {
    console.error("Error fetching subscription plans:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch plans" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await connectDB()
    const data = await request.json()
    
    const newPlan = {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    
    const result = await db.collection(Collections.SUBSCRIPTION_PLANS).insertOne(newPlan)
    
    return NextResponse.json({ 
      success: true, 
      data: { ...newPlan, _id: result.insertedId },
      plan: { ...newPlan, _id: result.insertedId }
    })
  } catch (error) {
    console.error("Error creating subscription plan:", error)
    return NextResponse.json({ success: false, error: "Failed to create plan" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const db = await connectDB()
    const data = await request.json()
    const { id, ...updateData } = data
    
    if (!id) {
      return NextResponse.json({ success: false, error: "Plan ID is required" }, { status: 400 })
    }
    
    const result = await db.collection(Collections.SUBSCRIPTION_PLANS).updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...updateData, updatedAt: new Date() } }
    )
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: "Plan not found" }, { status: 404 })
    }
    
    const updatedPlan = await db.collection(Collections.SUBSCRIPTION_PLANS).findOne({ _id: new ObjectId(id) })
    
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

export async function DELETE(request: NextRequest) {
  try {
    const db = await connectDB()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    
    if (!id) {
      return NextResponse.json({ success: false, error: "Plan ID is required" }, { status: 400 })
    }
    
    const result = await db.collection(Collections.SUBSCRIPTION_PLANS).deleteOne({ _id: new ObjectId(id) })
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: "Plan not found" }, { status: 404 })
    }
    
    return NextResponse.json({ success: true, message: "Plan deleted successfully" })
  } catch (error) {
    console.error("Error deleting subscription plan:", error)
    return NextResponse.json({ success: false, error: "Failed to delete plan" }, { status: 500 })
  }
}
