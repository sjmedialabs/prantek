import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { processCampaignSend } from "@/lib/campaigns/processCampaignSend"

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET || "your-secret-key"
    const vercelCronHeader = request.headers.get("x-vercel-cron")
    const isAuthorizedBySecret = authHeader === `Bearer ${cronSecret}`
    const isAuthorizedByVercelCron = Boolean(vercelCronHeader)
    if (!isAuthorizedBySecret && !isAuthorizedByVercelCron) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const db = await connectDB()
    console.log("Checking scheduled campaigns")

    const pendingCampaigns = await db.collection(Collections.CAMPAIGNS).countDocuments({
      status: "scheduled",
      scheduledAt: { $lte: new Date() },
    })
    console.log("Pending campaigns:", pendingCampaigns)

    let processed = 0
    while (true) {
      const now = new Date()
      const claimedCampaign = await db.collection(Collections.CAMPAIGNS).findOneAndUpdate(
        { status: "scheduled", scheduledAt: { $lte: now } },
        { $set: { status: "processing", failureReason: null, updatedAt: now } },
        { sort: { scheduledAt: 1 }, returnDocument: "after" },
      )

      const campaign = claimedCampaign
      if (!campaign) break
      console.log("Processing campaign:", String(campaign._id))

      try {
        await processCampaignSend(db, campaign)
        console.log("Campaign sent successfully")
        processed++
      } catch (error: any) {
        await db.collection(Collections.CAMPAIGNS).updateOne(
          { _id: campaign._id },
          {
            $set: {
              status: "failed",
              failureReason: error?.message || "Scheduled campaign processing failed",
              updatedAt: new Date(),
            },
          },
        )
        console.error(error)
      }
    }

    return NextResponse.json({ success: true, processed })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ success: false, error: "Failed to process scheduled campaigns" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return POST(request)
}
