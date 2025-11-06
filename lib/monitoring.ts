// Application monitoring and health checks

interface HealthCheck {
  status: "healthy" | "degraded" | "unhealthy"
  timestamp: string
  checks: {
    database: boolean
    memory: {
      used: number
      total: number
      percentage: number
    }
  }
  uptime: number
}

export async function getHealthStatus(): Promise<HealthCheck> {
  const startTime = Date.now()

  // Check database connection
  let databaseHealthy = false
  try {
    const { connectDB } = await import("./mongodb")
    const db = await connectDB()
    await db.admin().ping()
    databaseHealthy = true
  } catch (error) {
    console.error("Database health check failed:", error)
  }

  // Memory usage
  const memoryUsage = process.memoryUsage()
  const memoryPercentage = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100

  const status: HealthCheck["status"] = !databaseHealthy ? "unhealthy" : memoryPercentage > 90 ? "degraded" : "healthy"

  return {
    status,
    timestamp: new Date().toISOString(),
    checks: {
      database: databaseHealthy,
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        percentage: Math.round(memoryPercentage),
      },
    },
    uptime: process.uptime(),
  }
}

// Metrics collection
class MetricsCollector {
  private metrics: Map<string, number[]> = new Map()

  record(metric: string, value: number) {
    if (!this.metrics.has(metric)) {
      this.metrics.set(metric, [])
    }
    this.metrics.get(metric)!.push(value)

    // Keep only last 1000 entries
    const values = this.metrics.get(metric)!
    if (values.length > 1000) {
      values.shift()
    }
  }

  getStats(metric: string) {
    const values = this.metrics.get(metric) || []
    if (values.length === 0) return null

    const sorted = [...values].sort((a, b) => a - b)
    const sum = values.reduce((a, b) => a + b, 0)

    return {
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / values.length,
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    }
  }

  getAllMetrics() {
    const result: Record<string, any> = {}
    for (const [metric, _] of this.metrics) {
      result[metric] = this.getStats(metric)
    }
    return result
  }
}

export const metrics = new MetricsCollector()
