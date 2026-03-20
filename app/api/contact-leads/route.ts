import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function sanitize(str: unknown, max: number): string {
  if (typeof str !== "string") return ""
  return str.trim().slice(0, max)
}

/** Public POST — contact form from /contact */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const name = sanitize(body.name, 200)
    const email = sanitize(body.email, 320).toLowerCase()
    const phone = sanitize(body.phone, 60)
    const message = sanitize(body.message, 10000)

    if (!name) {
      return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 })
    }
    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ success: false, error: "Valid email is required" }, { status: 400 })
    }
    if (!phone) {
      return NextResponse.json({ success: false, error: "Phone number is required" }, { status: 400 })
    }
    if (!message) {
      return NextResponse.json({ success: false, error: "Message is required" }, { status: 400 })
    }

    const db = await connectDB()
    const now = new Date()
    const doc = {
      name,
      email,
      phone,
      message,
      source: "contact_page" as const,
      createdAt: now,
      updatedAt: now,
    }
    const result = await db.collection(Collections.CONTACT_LEADS).insertOne(doc)
    return NextResponse.json({
      success: true,
      data: { id: result.insertedId.toString() },
    })
  } catch (error) {
    console.error("[contact-leads] POST", error)
    return NextResponse.json({ success: false, error: "Failed to submit" }, { status: 500 })
  }
}
