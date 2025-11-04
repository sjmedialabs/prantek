import { logger } from "./logger"

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode = 500,
    public code?: string,
    public context?: Record<string, any>,
  ) {
    super(message)
    this.name = "AppError"
    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 400, "VALIDATION_ERROR", context)
    this.name = "ValidationError"
  }
}

export class AuthenticationError extends AppError {
  constructor(message = "Authentication required") {
    super(message, 401, "AUTHENTICATION_ERROR")
    this.name = "AuthenticationError"
  }
}

export class AuthorizationError extends AppError {
  constructor(message = "Insufficient permissions") {
    super(message, 403, "AUTHORIZATION_ERROR")
    this.name = "AuthorizationError"
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, "NOT_FOUND")
    this.name = "NotFoundError"
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 500, "DATABASE_ERROR", context)
    this.name = "DatabaseError"
  }
}

export function handleError(error: unknown, userId?: string): Response {
  if (error instanceof AppError) {
    logger.error(error.message, error, error.context, userId)

    return new Response(
      JSON.stringify({
        error: error.message,
        code: error.code,
        ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
      }),
      {
        status: error.statusCode,
        headers: { "Content-Type": "application/json" },
      },
    )
  }

  if (error instanceof Error) {
    logger.error("Unexpected error", error, undefined, userId)

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        ...(process.env.NODE_ENV === "development" && {
          message: error.message,
          stack: error.stack,
        }),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }

  logger.error("Unknown error", undefined, { error }, userId)

  return new Response(JSON.stringify({ error: "Internal server error" }), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  })
}

export function asyncHandler(handler: (req: Request, context?: any) => Promise<Response>) {
  return async (req: Request, context?: any): Promise<Response> => {
    try {
      return await handler(req, context)
    } catch (error) {
      return handleError(error)
    }
  }
}
