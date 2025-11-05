import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"

// GET - public access
export async function GET(req: NextRequest) {
  try {
    const db = await connectDB()
    const { searchParams } = new URL(req.url)
    const section = searchParams.get("section")
    
    const query = section ? { section } : {}
    const content = await db
      .collection(Collections.WEBSITE_CONTENT || "website_content")
      .find(query)
      .toArray()

    return NextResponse.json({ success: true, data: content, content })
  } catch (error) {
    console.error("Error fetching website content:", error)
    return NextResponse.json({ success: true, data: [], content: [] })
  }
}

// POST - create new content
export async function POST(req: NextRequest) {
  try {
    const db = await connectDB()
    const data = await req.json()

    const content = {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db
      .collection(Collections.WEBSITE_CONTENT || "website_content")
      .insertOne(content)

    return NextResponse.json({ 
      success: true, 
      data: { ...content, _id: result.insertedId },
      content: { ...content, _id: result.insertedId }
    })
  } catch (error) {
    console.error("Error creating website content:", error)
    return NextResponse.json({ success: false, error: "Failed to create content" }, { status: 500 })
  }
}

// PUT - update content
export async function PUT(req: NextRequest) {
  try {
    const db = await connectDB()
    const data = await req.json()
    const { _id, id, ...updateData } = data
    
    const contentId = _id || id
    if (!contentId) {
      return NextResponse.json({ success: false, error: "Content ID required" }, { status: 400 })
    }

    const { ObjectId } = await import("mongodb")
    const result = await db
      .collection(Collections.WEBSITE_CONTENT || "website_content")
      .updateOne(
        { _id: new ObjectId(contentId) },
        { $set: { ...updateData, updatedAt: new Date() } }
      )

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: "Content not found" }, { status: 404 })
    }

    const updatedContent = await db
      .collection(Collections.WEBSITE_CONTENT || "website_content")
      .findOne({ _id: new ObjectId(contentId) })

    return NextResponse.json({ 
      success: true, 
      data: updatedContent,
      content: updatedContent
    })
  } catch (error) {
    console.error("Error updating website content:", error)
    return NextResponse.json({ success: false, error: "Failed to update content" }, { status: 500 })
  }
}
