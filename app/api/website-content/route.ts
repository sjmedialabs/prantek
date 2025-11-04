import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { withAuth } from "@/lib/api-auth"

// GET is public - no authentication required for viewing website content
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

    return NextResponse.json(content)
  } catch (error) {
    console.error("[v0] Error fetching website content:", error)
    return NextResponse.json([], { status: 200 }) // Return empty array instead of error
  }
}

// POST requires authentication
export const POST = withAuth(async (req: NextRequest, user: any) => {
  const db = await connectDB()
  const data = await req.json()

  const content = {
    ...data,
    organizationId: user.organizationId,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const result = await db.collection(Collections.WEBSITE_CONTENT || "website_content").insertOne(content)

  return NextResponse.json({ ...content, _id: result.insertedId })
})
