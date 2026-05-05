import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { sendEmailBatch } from "@/lib/email/sendEmail"
import { ObjectId } from "mongodb"
import { deductReachProBalance, getReachProWallet } from "@/lib/reachpro-wallet"

async function processCampaign(db: any, campaign: any) {
  const userId = String(campaign.userId)
  let recipients: any[] = []

  if (campaign.audience === "group" && campaign.groupId) {
    const group = await db.collection(Collections.CLIENT_GROUPS).findOne({ _id: new ObjectId(campaign.groupId) })
    if (group) {
      if (group.filters) {
        const filter: any = { userId }
        if (group.filters.location) filter.address = { $regex: group.filters.location, $options: "i" }
        recipients = await db.collection("clients").find(filter).project({ email: 1, name: 1 }).toArray()
      }
      if (Array.isArray(group.emails) && group.emails.length > 0) {
        const seen = new Set(recipients.map((r: any) => String(r.email || "").trim().toLowerCase()).filter(Boolean))
        for (const e of group.emails) {
          const email = String(e?.email || "").trim().toLowerCase()
          if (!email || seen.has(email)) continue
          seen.add(email)
          recipients.push({ email, name: e?.name || "" })
        }
      }
    }
  } else {
    recipients = await db.collection("clients").find({ userId }).project({ email: 1, name: 1 }).toArray()
  }

  const withEmail = recipients.filter((r) => r.email)
  const items = withEmail.map((r) => {
    const personalizedContent = String(campaign.content || "").replace(/\{\{name\}\}/g, r.name || "Customer")
    return {
      to: r.email,
      subject: campaign.subject || campaign.name,
      html: personalizedContent,
      text: personalizedContent.replace(/<[^>]*>/g, ""),
    }
  })

  const batchResults = await sendEmailBatch(items)
  let sentCount = 0
  let failedCount = recipients.length - withEmail.length
  for (let i = 0; i < withEmail.length; i++) {
    const r = withEmail[i]
    const emailResult = batchResults[i]
    await db.collection(Collections.CAMPAIGN_RECIPIENTS).insertOne({
      campaignId: campaign._id,
      recipientEmail: r.email,
      recipientName: r.name || "",
      status: emailResult.success ? "sent" : "failed",
      sentAt: new Date(),
      failedReason: emailResult.success ? null : (emailResult as { error?: string }).error ?? null,
    })
    if (emailResult.success) sentCount++
    else failedCount++
  }

  const wallet = await getReachProWallet(userId)
  const costPerMail = Number(wallet?.currentCostPerMail || 0)
  if (costPerMail > 0 && sentCount > 0) {
    const deduction = await deductReachProBalance({
      userId,
      amount: Number((sentCount * costPerMail).toFixed(2)),
      emailsDeducted: sentCount,
      costPerMail,
      type: campaign.type === "bulk_message" ? "whatsapp_campaign" : "email_campaign",
      referenceId: String(campaign._id),
    })
    if (!deduction.success) {
      await db.collection(Collections.CAMPAIGNS).updateOne(
        { _id: campaign._id },
        { $set: { status: "failed", failedCount: recipients.length, updatedAt: new Date() } },
      )
      return
    }
  }

  await db.collection(Collections.CAMPAIGNS).updateOne(
    { _id: campaign._id },
    {
      $set: {
        status: "sent",
        sentAt: new Date(),
        totalRecipients: recipients.length,
        sentCount,
        failedCount,
        updatedAt: new Date(),
      },
    },
  )
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET || "your-secret-key"
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const db = await connectDB()
    const now = new Date()
    const due = await db.collection(Collections.CAMPAIGNS)
      .find({ status: "scheduled", scheduledAt: { $lte: now } })
      .toArray()

    let processed = 0
    for (const campaign of due) {
      await processCampaign(db, campaign)
      processed++
    }

    return NextResponse.json({ success: true, processed })
  } catch (error) {
    console.error("[CRON][process-scheduled-campaigns] Error:", error)
    return NextResponse.json({ success: false, error: "Failed to process scheduled campaigns" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return POST(request)
}
