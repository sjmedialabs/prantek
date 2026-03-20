import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { withSuperAdmin } from "@/lib/api-auth"

const MAX = 500

/** GET — list contact form leads (newest first) */
export const GET = withSuperAdmin(async (_req: NextRequest) => {
  try {
    const db = await connectDB()
    const rows = await db
      .collection(Collections.CONTACT_LEADS)
      .find({})
      .sort({ createdAt: -1 })
      .limit(MAX)
      .toArray()

    const data = rows.map((r) => ({
      id: r._id?.toString(),
      name: typeof r.name === "string" ? r.name : "",
      email: typeof r.email === "string" ? r.email : "",
      phone: typeof r.phone === "string" ? r.phone : "",
      message: typeof r.message === "string" ? r.message : "",
      source: r.source,
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
    }))

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("[super-admin/contact-leads] GET", error)
    return NextResponse.json({ success: false, error: "Failed to load leads" }, { status: 500 })
  }
})
