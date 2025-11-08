import type { ObjectId } from "mongodb"

export interface BaseDocument {
  _id?: ObjectId
  createdAt: Date
  updatedAt: Date
}

export interface User extends BaseDocument {
  email: string
  password: string
  name: string
  companyId?: string
  role: "user" | "super-admin"
  subscriptionPlanId?: string
  subscriptionStatus?: "active" | "inactive" | "trial" | "expired"
  subscriptionStartDate?: Date
  subscriptionEndDate?: Date
  stripeCustomerId?: string
  isActive: boolean
}

export interface Client extends BaseDocument {
  userId: string
  name: string
  email: string
  phone?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  gstin?: string
  pan?: string
  notes?: string
}

export interface Vendor extends BaseDocument {
  userId: string
  name: string
  email: string
  phone?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  gstin?: string
  pan?: string
  notes?: string
}

export interface Item extends BaseDocument {
  userId: string
  name: string
  description?: string
  category?: string
  unit?: string
  price: number
  taxRate?: number
  hsnCode?: string
}

export interface ReceiptItem {
  itemId: string
  name: string
  description?: string
  quantity: number
  unit?: string
  price: number
  taxRate?: number
  taxAmount?: number
  total: number
}

export interface Receipt extends BaseDocument {
  userId: string
  clientId: string
  receiptNumber: string
  date: Date
  dueDate?: Date
  items: ReceiptItem[]
  subtotal: number
  taxAmount: number
  total: number
  amountPaid?: number
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled"
  notes?: string
  terms?: string
  cleared?: boolean
}

export interface QuotationItem {
  itemId: string
  name: string
  description?: string
  quantity: number
  unit?: string
  price: number
  taxRate?: number
  taxAmount?: number
  total: number
}

export interface Quotation extends BaseDocument {
  userId: string
  clientId: string
  quotationNumber: string
  date: Date
  validUntil?: Date
  acceptedDate?: Date
  items: QuotationItem[]
  subtotal: number
  taxAmount: number
  total: number
  status: "draft" | "sent" | "accepted" | "rejected" | "expired"
  notes?: string
  terms?: string
}

export interface Payment extends BaseDocument {
  userId: string
  recipientId: string
  recipientType: "client" | "vendor" | "team"
  paymentNumber: string
  date: Date
  amount: number
  paymentMethod: string
  category?: string
  status: "pending" | "completed" | "failed" | "cancelled"
  notes?: string
  reference?: string
}

export interface SubscriptionPlan extends BaseDocument {
  name: string
  price: number
  duration: number
  features: string[]
  maxUsers: number
  maxClients: number
  maxReceipts: number
}

export interface PaymentMethod extends BaseDocument {
  userId: string
  name: string
  type: "bank" | "upi" | "card" | "cash"
  details: Record<string, string>
  isEnabled: boolean
}

export interface Category extends BaseDocument {
  userId: string
  name: string
  type: "receipt" | "payment"
  isEnabled: boolean
}

export interface TaxSetting extends BaseDocument {
  userId: string
  name: string
  rate: number
  isDefault: boolean
}

export interface BankDetail extends BaseDocument {
  userId: string
  bankName: string
  accountNumber: string
  ifscCode: string
  accountHolderName: string
  branch?: string
  isDefault: boolean
}

export interface CompanySetting extends BaseDocument {
  userId: string
  companyName: string
  email: string
  phone?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  gstin?: string
  pan?: string
  logo?: string
  website?: string
}

export interface TeamMember extends BaseDocument {
  userId: string
  name: string
  email: string
  phone?: string
  role?: string
  memberTypeId?: string
  isActive: boolean
}

export interface MemberType extends BaseDocument {
  userId: string
  name: string
  description?: string
}

export interface Role extends BaseDocument {
  name: string
  permissions: string[]
  description?: string
}

export interface ActivityLog extends BaseDocument {
  userId: string
  action: string
  entity: string
  entityId?: string
  details?: Record<string, any>
  timestamp: Date
  ipAddress?: string
}
