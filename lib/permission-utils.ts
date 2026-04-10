/**
 * Expand permissions - now independent: return as-is
 */
export function expandPermissions(permissions: string[]): string[] {
  return permissions
}

/**
 * Normalize arbitrary DB values to a string[] for RBAC (avoids JWT/cookie crashes from BSON or bad data).
 */
export function coercePermissionStrings(perms: unknown): string[] {
  if (!perms) return []
  if (!Array.isArray(perms)) return []
  return perms.filter((p): p is string => typeof p === "string" && p.length > 0)
}
