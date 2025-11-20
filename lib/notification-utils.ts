import { getDb } from "@/lib/mongodb"
import type { Notification } from "@/lib/models/types"

/**
 * Get admin users for a tenant
 */
export async function getAdminUsers(tenantId?: string): Promise<string[]> {
  const db = await getDb()
  
  // Find users with admin role (those who have manage_roles permission)
  // In this system, we'll look for users with role "admin" or those who created the tenant
  const adminUsers = await db
    .collection("users")
    .find({ 
      role: { $ne: "super-admin" },
      isActive: true,
      ...(tenantId ? { companyId: tenantId } : {})
    })
    .toArray()

  // For now, return all active non-super-admin users
  // In a real system, you'd filter by actual admin permissions
  return adminUsers.map(user => user._id.toString())
}

/**
 * Get super admin users
 */
export async function getSuperAdminUsers(): Promise<string[]> {
  const db = await getDb()
  
  const superAdmins = await db
    .collection("users")
    .find({ 
      role: "super-admin",
      isActive: true
    })
    .toArray()

  return superAdmins.map(user => user._id.toString())
}

/**
 * Create notification for users
 */
export async function createNotification(
  userIds: string[],
  type: "quotation" | "receipt" | "payment" | "registration",
  title: string,
  message: string,
  entityId?: string,
  entityType?: string,
  link?: string
): Promise<void> {
  if (userIds.length === 0) return

  const db = await getDb()
  const now = new Date()

  const notifications: Partial<Notification>[] = userIds.map(userId => ({
    userId,
    type,
    title,
    message,
    entityId,
    entityType,
    link,
    isRead: false,
    createdAt: now,
    updatedAt: now,
  }))

  await db.collection<Notification>("notifications").insertMany(notifications as Notification[])
}

/**
 * Notify admins about new quotation
 */
export async function notifyAdminsNewQuotation(
  quotationId: string,
  quotationNumber: string,
  clientName: string,
  tenantId?: string
): Promise<void> {
  const adminIds = await getAdminUsers(tenantId)
  await createNotification(
    adminIds,
    "quotation",
    "New Quotation Created",
    `Quotation ${quotationNumber} has been created for ${clientName}`,
    quotationId,
    "quotation",
    `/dashboard/quotations`
  )
}

/**
 * Notify admins about new receipt
 */
export async function notifyAdminsNewReceipt(
  receiptId: string,
  receiptNumber: string,
  clientName: string,
  tenantId?: string
): Promise<void> {
  const adminIds = await getAdminUsers(tenantId)
  await createNotification(
    adminIds,
    "receipt",
    "New Receipt Created",
    `Receipt ${receiptNumber} has been created for ${clientName}`,
    receiptId,
    "receipt",
    `/dashboard/receipts`
  )
}

/**
 * Notify admins about new payment
 */
export async function notifyAdminsNewPayment(
  paymentId: string,
  paymentNumber: string,
  amount: number,
  tenantId?: string
): Promise<void> {
  const adminIds = await getAdminUsers(tenantId)
  await createNotification(
    adminIds,
    "payment",
    "New Payment Received",
    `Payment ${paymentNumber} of ₹${amount.toLocaleString()} has been received`,
    paymentId,
    "payment",
    `/dashboard/payments`
  )
}

/**
 * Notify super admins about new registration
 */
export async function notifySuperAdminsNewRegistration(
  userId: string,
  userName: string,
  userEmail: string
): Promise<void> {
  const superAdminIds = await getSuperAdminUsers()
  await createNotification(
    superAdminIds,
    "registration",
    "New User Registration",
    `${userName} (${userEmail}) has successfully registered`,
    userId,
    "user",
    `/super-admin/clients`
  )
}
