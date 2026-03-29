import { type NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/api-auth"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { ObjectId } from "mongodb"

export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    const url = new URL(request.url)
    const segments = url.pathname.split("/")
    const campaignId = segments[segments.indexOf("campaigns") + 1]
    if (!campaignId) return NextResponse.json({ success: false, error: "Campaign ID required" }, { status: 400 })

    const db = await connectDB()
    const recipients = await db.collection(Collections.CAMPAIGN_RECIPIENTS)
      .find({ campaignId: new ObjectId(campaignId) }).sort({ sentAt: -1 }).toArray()
    return NextResponse.json({ success: true, data: recipients })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch recipients" }, { status: 500 })
  }
})
