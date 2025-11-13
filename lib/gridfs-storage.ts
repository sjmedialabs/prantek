import { connectDB } from "./mongodb"
import { GridFSBucket, ObjectId } from "mongodb"
import type { Readable } from "stream"

let bucket: GridFSBucket | null = null

export async function getGridFSBucket(): Promise<GridFSBucket> {
  if (bucket) return bucket

  const db = await connectDB()
  bucket = new GridFSBucket(db, {
    bucketName: "uploads",
  })

  return bucket
}

export async function uploadToGridFS(
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<{ fileId: string; url: string }> {
  const bucket = await getGridFSBucket()

  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(filename, {
      contentType,
      metadata: {
        uploadedAt: new Date(),
      },
    })

    uploadStream.on("error", (error) => {
      console.error("[GridFS] Upload error:", error)
      reject(error)
    })

    uploadStream.on("finish", () => {
      const fileId = uploadStream.id.toString()
      const url = `/api/files/${fileId}`
      console.log("[GridFS] File uploaded successfully:", { fileId, filename })
      resolve({ fileId, url })
    })

    // Write buffer to stream
    uploadStream.end(buffer)
  })
}

export async function downloadFromGridFS(fileId: string): Promise<{
  stream: Readable
  contentType: string
  filename: string
}> {
  const bucket = await getGridFSBucket()

  // Find file metadata
  const files = await bucket.find({ _id: new ObjectId(fileId) }).toArray()
  
  if (files.length === 0) {
    throw new Error("File not found")
  }

  const file = files[0]
  const stream = bucket.openDownloadStream(new ObjectId(fileId))

  return {
    stream,
    contentType: file.contentType || "application/octet-stream",
    filename: file.filename,
  }
}

export async function deleteFromGridFS(fileId: string): Promise<void> {
  const bucket = await getGridFSBucket()
  await bucket.delete(new ObjectId(fileId))
  console.log("[GridFS] File deleted:", fileId)
}
