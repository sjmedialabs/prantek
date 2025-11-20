import { type NextRequest, NextResponse } from "next/server"
import { readFile } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

/**
 * Backward compatibility route for old file uploads
 * Serves files from /public/uploads/ directory
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const filePath = params.path.join("/")
    const fullPath = join(process.cwd(), "public", "uploads", filePath)

    console.log("[Uploads] Legacy file request:", { filePath, fullPath })

    // Security check: ensure the path is within uploads directory
    if (!fullPath.includes(join(process.cwd(), "public", "uploads"))) {
      console.error("[Uploads] Path traversal attempt:", fullPath)
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 })
    }

    // Check if file exists
    if (!existsSync(fullPath)) {
      console.error("[Uploads] File not found:", fullPath)
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Read and return the file
    const fileBuffer = await readFile(fullPath)
    
    // Determine content type from extension
    const ext = filePath.split(".").pop()?.toLowerCase()
    const contentTypeMap: Record<string, string> = {
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      gif: "image/gif",
      webp: "image/webp",
      svg: "image/svg+xml",
      pdf: "application/pdf",
    }
    const contentType = contentTypeMap[ext || ""] || "application/octet-stream"

    console.log("[Uploads] Serving file:", { filePath, contentType, size: fileBuffer.length })

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${filePath.split("/").pop()}"`,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch (error) {
    console.error("[Uploads] Error serving file:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to serve file" },
      { status: 500 }
    )
  }
}
