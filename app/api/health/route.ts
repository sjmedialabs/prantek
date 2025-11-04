import { getHealthStatus } from "@/lib/monitoring"

export async function GET() {
  const health = await getHealthStatus()

  const statusCode = health.status === "healthy" ? 200 : health.status === "degraded" ? 200 : 503

  return new Response(JSON.stringify(health), {
    status: statusCode,
    headers: { "Content-Type": "application/json" },
  })
}
