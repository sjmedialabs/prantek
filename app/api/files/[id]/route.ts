import { type NextRequest, NextResponse } from "next/server"
import { downloadFromGridFS } from "@/lib/gridfs-storage"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      console.error("[Files] No file ID provided")
      return NextResponse.json({ error: "File ID is required" }, { status: 400 })
    }

    console.log("[Files] Fetching file from GridFS:", id)

    const { stream, contentType, filename } = await downloadFromGridFS(id)

    // Convert stream to buffer
    const chunks: Buffer[] = []
    for await (const chunk of stream) {
      chunks.push(chunk)
    }
    const buffer = Buffer.concat(chunks)

    // Return file with proper headers
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch (error) {
    console.error("[Files] Error fetching file:", error)
    
    if (error instanceof Error && error.message === "File not found") {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch file" },
      { status: 500 }
    )
  }
}
