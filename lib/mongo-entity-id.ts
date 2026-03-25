/**
 * Normalize MongoDB _id from JSON/API (string, Extended JSON { $oid }, or ObjectId-like).
 */
export function toMongoIdString(value: unknown): string | undefined {
  if (value == null) return undefined
  if (typeof value === "string") {
    const t = value.trim()
    return t || undefined
  }
  if (typeof value === "object" && value !== null && "$oid" in value) {
    const o = (value as { $oid?: string }).$oid
    return typeof o === "string" && o.trim() ? o.trim() : undefined
  }
  return undefined
}
