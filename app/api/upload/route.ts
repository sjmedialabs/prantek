import { type NextRequest, NextResponse } from "next/server"
import { uploadToGridFS } from "@/lib/gridfs-storage"

export async function POST(request: NextRequest) {
  try {
    console.log("[Upload] Upload API called")

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      console.error("[Upload] No file provided in request")
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    console.log("[Upload] File received:", {
      name: file.name,
      size: file.size,
      type: file.type,
    })

    // Generate unique filename to avoid collisions
    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const filename = `${timestamp}_${sanitizedName}`

    // Convert File to Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to MongoDB GridFS
    const { fileId, url } = await uploadToGridFS(buffer, filename, file.type)

    console.log("[Upload] File saved to GridFS successfully:", { fileId, url })

    return NextResponse.json({
      url,
      fileId,
      filename: file.name,
      size: file.size,
      type: file.type,
    })
  } catch (error) {
    console.error("[Upload] Upload error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload failed" }, { status: 500 })
  }
}
