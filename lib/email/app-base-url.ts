/**
 * Base URL for absolute links in transactional emails.
 * Trims whitespace (common .env mistake) and removes trailing slashes.
 */
export function getAppBaseUrl(fallback = "http://localhost:3000"): string {
  const raw = String(process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || fallback).trim()
  const base = raw.length > 0 ? raw : String(fallback).trim()
  return base.replace(/\/+$/, "")
}
