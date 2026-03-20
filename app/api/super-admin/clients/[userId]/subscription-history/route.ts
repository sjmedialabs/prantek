import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { withSuperAdmin } from "@/lib/api-auth"
import { ObjectId } from "mongodb"

function iso(d: unknown): string | null {
  if (!d) return null
  const t = new Date(d as Date)
  return Number.isNaN(t.getTime()) ? null : t.toISOString()
}

function getClientUserIdFromPath(req: NextRequest): string | null {
  const segments = req.nextUrl.pathname.split("/").filter(Boolean)
  const i = segments.indexOf("clients")
  if (i >= 0 && segments[i + 1] && segments[i + 1] !== "subscription-history") {
    return segments[i + 1]
  }
  return null
}

export const GET = withSuperAdmin(async (req: NextRequest) => {
  try {
    const userId = getClientUserIdFromPath(req)
    if (!userId || !ObjectId.isValid(userId)) {
      return NextResponse.json({ success: false, error: "Invalid user id" }, { status: 400 })
    }

    const db = await connectDB()
    const u = await db.collection(Collections.USERS).findOne({ _id: new ObjectId(userId) })
    if (!u) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    const fromDoc = Array.isArray((u as any).subscriptionHistory) ? (u as any).subscriptionHistory : []

    const payments = await db
      .collection(Collections.PAYMENT_HISTORY)
      .find({
        $or: [{ userId }, { userId: new ObjectId(userId) }],
      })
      .sort({ paymentDate: -1 })
      .limit(100)
      .toArray()

    const paymentEntries = payments.map((p: any) => ({
      planName: "Payment",
      startDate: iso(p.paymentDate),
      endDate: null as string | null,
      status: p.status || "paid",
      amount: typeof p.amount === "number" ? p.amount : Number(p.amount) || 0,
      assignedAt: iso(p.paymentDate),
      source: "payment" as const,
    }))

    const adminEntries = fromDoc.map((e: any) => ({
      planId: e.planId,
      planName: e.planName || "—",
      startDate: e.startDate || null,
      endDate: e.endDate || null,
      status: e.status || "—",
      amount: typeof e.amount === "number" ? e.amount : Number(e.amount) || 0,
      assignedAt: e.assignedAt || null,
      source: (e.source || "admin") as "admin" | "payment",
    }))

    const combined = [...adminEntries, ...paymentEntries].sort((a, b) => {
      const ta = new Date(a.assignedAt || a.startDate || 0).getTime()
      const tb = new Date(b.assignedAt || b.startDate || 0).getTime()
      return tb - ta
    })

    return NextResponse.json({ success: true, entries: combined })
  } catch (e) {
    console.error("[subscription-history]", e)
    return NextResponse.json({ success: false, error: "Failed to load history" }, { status: 500 })
  }
})
