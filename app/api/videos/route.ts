import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"

/** GET - Public: list all video categories with their videos (for /videos page) */
export async function GET() {
  try {
    const db = await connectDB()
    const categories = await db
      .collection(Collections.VIDEO_CATEGORIES)
      .find({})
      .sort({ order: 1 })
      .toArray()
    const videos = await db
      .collection(Collections.VIDEOS)
      .find({})
      .sort({ categoryId: 1, tab: 1, order: 1 })
      .toArray()
    const categoriesWithVideos = categories.map((cat: any) => {
      const catIdStr = cat._id?.toString?.() ?? String(cat._id)
      return {
      _id: catIdStr,
      id: catIdStr,
      name: cat.name,
      order: cat.order,
      videos: videos
        .filter((v: any) => (v.categoryId && String(v.categoryId)) === catIdStr)
        .map((v: any) => ({
          _id: v._id?.toString(),
          id: v._id?.toString(),
          title: v.title,
          description: v.description || "",
          youtubeUrl: v.youtubeUrl,
          tab: v.tab || "All",
          order: v.order,
          duration: v.duration || null,
        })),
    }
    })
    return NextResponse.json({ success: true, categories: categoriesWithVideos })
  } catch (error) {
    console.error("Error fetching videos:", error)
    return NextResponse.json({ success: true, categories: [] })
  }
}
