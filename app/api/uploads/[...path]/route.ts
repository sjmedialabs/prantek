import { type NextRequest, NextResponse } from "next/server"
import { readFile } from "fs/promises"
import { join, normalize } from "path"
import { existsSync } from "fs"

/**
 * Serves ANY file under /public/uploads/**
 * Works for:
 * - Bulk upload images
 * - Single product images
 * - Nested folders /uploads/items/folder/subfolder/img.png
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const requestedPath = params.path.join("/")

    // Build absolute file path inside uploads only
    const uploadsRoot = join(process.cwd(), "public", "uploads")
    const fullPath = normalize(join(uploadsRoot, requestedPath))

    console.log("[Uploads] File requested:", { requestedPath, fullPath })

    // Prevent path traversal: ensure fullPath starts with uploadsRoot
    if (!fullPath.startsWith(uploadsRoot)) {
      console.error("[Uploads] Path traversal attempt:", fullPath)
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 })
    }

    if (!existsSync(fullPath)) {
      console.error("[Uploads] File not found:", fullPath)
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    const fileBuffer = await readFile(fullPath)

    // Determine content type
    const ext = requestedPath.split(".").pop()?.toLowerCase()
    const contentTypeMap: Record<string, string> = {
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      gif: "image/gif",
      webp: "image/webp",
      svg: "image/svg+xml",
      pdf: "application/pdf",
      txt: "text/plain",
      json: "application/json"
    }
    const contentType = contentTypeMap[ext || ""] || "application/octet-stream"

    console.log("[Uploads] Serving file:", {
      requestedPath,
      contentType,
      size: fileBuffer.length
    })

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${requestedPath.split("/").pop()}"`,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch (error) {
    console.error("[Uploads] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to serve file" },
      { status: 500 }
    )
  }
}
