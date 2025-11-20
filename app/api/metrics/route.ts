import { metrics } from "@/lib/monitoring"
import { verifyToken } from "@/lib/jwt"

export async function GET(req: Request) {
  // Only allow authenticated super-admins to view metrics
  const token = req.headers.get("authorization")?.replace("Bearer ", "")

  if (!token) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  try {
    const payload = await verifyToken(token)
    if (payload.role !== "super-admin") {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      })
    }

    const allMetrics = metrics.getAllMetrics()

    return new Response(JSON.stringify(allMetrics), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }
}
