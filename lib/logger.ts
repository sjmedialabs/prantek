// Production-ready logging system

type LogLevel = "info" | "warn" | "error" | "debug"

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: Record<string, any>
  error?: Error
  userId?: string
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development"

  private formatLog(entry: LogEntry): string {
    const { level, message, timestamp, context, error, userId } = entry
    let log = `[${timestamp}] [${level.toUpperCase()}]`

    if (userId) {
      log += ` [User: ${userId}]`
    }

    log += ` ${message}`

    if (context) {
      log += ` ${JSON.stringify(context)}`
    }

    if (error) {
      log += `\n${error.stack}`
    }

    return log
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error, userId?: string) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error,
      userId,
    }

    const formattedLog = this.formatLog(entry)

    // Console output
    switch (level) {
      case "error":
        console.error(formattedLog)
        break
      case "warn":
        console.warn(formattedLog)
        break
      case "debug":
        if (this.isDevelopment) {
          console.debug(formattedLog)
        }
        break
      default:
        console.log(formattedLog)
    }

    // In production, you would send logs to a service like:
    // - Datadog
    // - New Relic
    // - Sentry
    // - CloudWatch
    if (!this.isDevelopment && level === "error") {
      // Example: Send to external logging service
      // this.sendToExternalService(entry)
    }
  }

  info(message: string, context?: Record<string, any>, userId?: string) {
    this.log("info", message, context, undefined, userId)
  }

  warn(message: string, context?: Record<string, any>, userId?: string) {
    this.log("warn", message, context, undefined, userId)
  }

  error(message: string, error?: Error, context?: Record<string, any>, userId?: string) {
    this.log("error", message, context, error, userId)
  }

  debug(message: string, context?: Record<string, any>) {
    this.log("debug", message, context)
  }
}

export const logger = new Logger()
