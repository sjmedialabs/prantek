import type { ObjectId } from "mongodb"

export interface BaseDocument {
  _id?: ObjectId
  createdAt: Date
  updatedAt: Date
}

// Admin User - has dashboard access with roles and permissions
export interface AdminUser extends BaseDocument {
  email: string
  password: string
  name: string
  companyId?: string
  userType?: "subscriber" | "admin"  // Distinguish between account owners and admin users
  role: "super-admin" | "admin"  // admin users have specific roles
  roleId?: string  // Reference to Role collection (for backward compatibility)
  employeeId?: string  // Reference to Employee collection (new flow)
  permissions?: string[]  // Direct permissions array or cached from role
  phone?: string
  avatar?: string
  isActive: boolean
  lastLogin?: Date
}

export interface notificationSettings extends BaseDocument {
  userId: string,
  quotationNotifications: boolean,
  receiptNotifications: boolean,
  paymentNotifications: boolean, 
}

// Legacy User type for backward compatibility with subscription system
export interface User extends BaseDocument {
  email: string
  password: string
  name: string
  companyId?: string
  userType?: "subscriber" | "admin"  // Distinguish between account owners and admin users
  role: "user" | "admin" | "super-admin"
  phone?: string
  address?: string
  avatar?: string
  subscriptionPlanId?: string
  subscriptionStatus?: "active" | "inactive" | "trial" | "expired" | "cancelled"
  subscriptionStartDate?: Date
  subscriptionEndDate?: Date
  trialEndsAt?: Date
  stripeCustomerId?: string
  isActive: boolean
}

// Employee - no dashboard access, only designation/role
export interface Employee extends BaseDocument {
  userId: string  // Reference to the company/account owner
  employeeNumber: string
  employeeName: string
  surname: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  designation: string  // Executive, Manager, Senior Manager, etc.
  department?: string
  dateOfJoining?: string | Date
  dateOfBirth?: string | Date
  salary?: number
  bankAccountNumber?: string
  ifscCode?: string
  panNumber?: string
  aadharNumber?: string
  emergencyContact?: string
  emergencyContactName?: string
  employmentStatus: "active" | "inactive" | "terminated" | "resigned"
  notes?: string
  profileImage?: string
}

export interface Client extends BaseDocument {
  userId: string
  name: string
  type: string
  email: string
  phone?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  companyName?:string
  contactName?: string
  gst?: string
  pan?: string
  notes?: string
  status?: "active" | "inactive"
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
  userId?: string
  id?: string               // optional for frontend
  name: string
  description?: string
  category?: string

  type?: "product" | "service"
  unitType?: string
  unit?: string

  price: number
  hsnCode?: string
  applyTax?: boolean
  cgst?: number
  sgst?: number
  igst?: number
  isActive?: boolean

  taxRate?: number
}

export interface WebsiteContent {
  // Branding
  companyName: string
  tagline: string
  logo: string

  // Hero Section
  heroTitle: string
  heroSubtitle: string
  heroCtaText: string
  heroCtaLink: string
  heroRightImage: string
  heroBackgroundImage: string
  heroSecondaryCtaText: string
  heroSecondaryCtaLink: string
  heroDemoVideoUrl: string // Added YouTube demo video URL field

  // Trusted By Section
  trustedByTitle: string
  trustedByLogos: Array<{
    id: string
    name: string
    logo: string
  }>

  // About Section
  aboutTitle: string
  aboutDescription: string

  // Features (up to 9)
  featuresTitle: string
  featuresSubtitle: string
  features: Array<{
    id: string
    title: string
    description: string
    icon: string
  }>

  // Industries Section
  industriesTitle: string
  industriesSubtitle: string
  industries: Array<{
    id: string
    title: string
    description: string
    icon: string
    gradient: string
  }>

  // Dashboard Showcase Section
  showcaseTitle: string
  showcaseSubtitle: string
  showcaseDescription: string
  showcaseFeatures: string[]

  // Testimonials Section
  testimonialsTitle: string
  testimonialsSubtitle: string
  testimonials: Array<{
    id: string
    company: string
    logo: string
    author: string
    role: string
    content: string
    rating: number
  }>

  // Pricing Section
  pricingTitle: string
  pricingSubtitle: string
  pricingFooterText: string

  // FAQ Section
  faqTitle: string
  faqSubtitle: string
  faqs: Array<{
    id: string
    question: string
    answer: string
  }>

  // CTA Section
  ctaTitle: string
  ctaSubtitle: string
  ctaPrimaryText: string
  ctaPrimaryLink: string
  ctaSecondaryText: string
  ctaSecondaryLink: string
  ctaFeatures: string[]

  // Contact Info
  contactEmail: string
  contactPhone: string
  contactAddress: string

  // Social Media
  socialFacebook?: string
  socialTwitter?: string
  socialLinkedin?: string
  socialInstagram?: string

  // Footer
  footerText: string

  updatedAt: string
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
  id: string
  receiptNumber: string
  receiptType: "quotation" | "items" | "quick" // Type of receipt creation
  quotationId?: string // Optional - only for receipts from quotations
  quotationNumber?: string
  clientId: string
  clientName: string
  clientEmail: string
  clientPhone: string
  clientAddress: string
  date: string
  items: QuotationItem[]
  subtotal: number
  taxAmount: number
  total: number // Total amount from quotation
  amountPaid: number // Amount paid in this receipt
  balanceAmount: number // Remaining balance after this payment
  paymentType: "full" | "partial" | "advance"
  paymentMethod: "cash" | "card" | "upi" | "bank-transfer" | "cheque"
  bankAccount?: string
  referenceNumber?: string
  screenshot?: string
  status: "pending" | "cleared" // Lowercase to match reconciliation
  notes?: string
}

export interface QuotationItem {
  itemId?: string
  id: string
  type: "product" | "service"
  itemName: string
  description?: string

  quantity: number
  price: number
  discount: number

  cgst: number
  sgst: number
  igst: number

  // For printing compatibility
  taxName?: string
  taxRate?: number
}



export interface Quotation extends BaseDocument {
  userId: string
  clientId: string

  quotationNumber?: string
  date: string | Date
  validity?: string | Date
  note?: string

  clientName: string
  clientEmail: string
  clientAddress?: string
  clientContact?: string
  clientPhone?: string   // added for backward support

  items: QuotationItem[]

  grandTotal: number
  paidAmount: number
  balanceAmount: number

  status: "pending" | "accepted"

  acceptedDate?: string | Date

  isActive?: string
}



export interface Payment extends BaseDocument {
  recipientName: string
  userId: string
  recipientId: string
  recipientType: string
  paymentNumber: string
  date: string
  amount: number
  paymentMethod: string
  screenshotFile?: string
  billFile?: string
  bankAccount?: string
  createdBy: string
  category?: string
  status: "pending" | "completed" | "failed" | "cancelled"
  description?: string
  referenceNumber?: string
}

// Plan-specific feature flags for granular access control
export interface PlanFeatures {
  cashBook: boolean
  clients: boolean
  vendors: boolean
  quotations: boolean
  receipts: boolean
  payments: boolean
  reconciliation: boolean
  assets: boolean
  reports: boolean
  settings: boolean
  hrSettings: boolean
}

export const PLAN_FEATURE_KEYS = [
  'cashBook',
  'clients',
  'vendors',
  'quotations',
  'receipts',
  'payments',
  'reconciliation',
  'assets',
  'reports',
  'settings',
  'hrSettings',
] as const

export const PLAN_FEATURE_LABELS: Record<keyof PlanFeatures, string> = {
  cashBook: 'Cash Book',
  clients: 'Clients Management',
  vendors: 'Vendors Management',
  quotations: 'Quotations',
  receipts: 'Receipts',
  payments: 'Payments',
  reconciliation: 'Reconciliation',
  assets: 'Assets Management',
  reports: 'Reports',
  settings: 'Settings',
}

export const PLAN_FEATURE_DESCRIPTIONS: Record<keyof PlanFeatures, string> = {
  cashBook: 'Access to cash book for tracking daily transactions',
  clients: 'Manage client database and relationships',
  vendors: 'Manage vendor database and relationships',
  quotations: 'Create and manage quotations',
  receipts: 'Create and manage receipts',
  payments: 'Process and track payments',
  reconciliation: 'Bank reconciliation features',
  assets: 'Manage company assets inventory',
  reports: 'Generate business reports',
  settings: 'Access to system settings and configuration',
}

export interface SubscriptionPlan extends BaseDocument {
  id?: string
  name: string
  price: number
  duration: number
  billingCycle: "monthly" | "yearly"
  features: string[] // Legacy feature list for backward compatibility
  planFeatures?: PlanFeatures // New granular feature flags
  maxUsers: number
  maxClients: number
  maxReceipts: number
  isActive: boolean
  description?: string
  maxStorage?: string
  subscriberCount?: number
  revenue?: number
  order?: number // Display order for sorting
}

export interface PaymentMethod extends BaseDocument {
  userId: string
  name: string
  isEnabled: boolean
}

export interface Category extends BaseDocument {
  userId: string
  name: string
  isEnabled: boolean
}

export interface TaxSetting extends BaseDocument {
  userId: string
  tan: string
  tanUrl: string
  gst: string
  gstUrl: string
}

export interface TaxRate extends BaseDocument {
  id: string
  userId: string
  type: "CGST" | "SGST" | "IGST"
  rate: number
  description: string
  isActive: boolean
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
  phone2?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  gstin?: string
  tan?: string
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
  userCount: number
  isSystem: boolean
  id: string
  userId: string
  name: string
  code: string
  description?: string
  requiresSalary: boolean
  isActive: boolean
}

// Role for Admin Users (dashboard access permissions)
export interface Role extends BaseDocument {
  userId?: string  // Owner of this role definition
  name: string
  code?: string  // Unique identifier like 'admin', 'manager', 'viewer'
  permissions: string[]  // Array of permission strings like 'view_reports', 'manage_users', etc.
  description?: string
  isActive: boolean
}

// Available permission options
export const AVAILABLE_PERMISSIONS = [
  'view_dashboard',
  'manage_users',
  'manage_employees',
  'manage_clients',
  'manage_vendors',
  'manage_quotations',
  'manage_receipts',
  'manage_payments',
  'manage_assets',
  'view_reports',
  'manage_settings',
  'manage_roles',
] as const

export type Permission = typeof AVAILABLE_PERMISSIONS[number]

export interface ActivityLog extends BaseDocument {
  userId: string
  action: string
  entity: string
  entityId?: string
  details?: Record<string, any>
  timestamp: Date
  ipAddress?: string
}

export interface Notification extends BaseDocument {
  userId: string
  type: "quotation" | "receipt" | "payment" | "registration"
  title: string
  message: string
  entityId?: string
  entityType?: string
  isRead: boolean
  link?: string
}

export interface AssignmentHistory {
  employeeId: string
  employeeName: string
  assignedDate: string
  submittedDate?: string
  assignedBy: string
}
export interface Asset {
  // Database identifiers
  _id?: string         // MongoDB ObjectId as string
  id?: string          // Client-side ID alias
  userId: string       // Owner admin user

  // Core details
  name?: string
  category?: String
  purchasePrice?: number
  currentValue?: number
  purchaseDate?: string
  condition?: String
  location?: string
  serialNumber?: string
  warranty?: string

  // Maintenance
  maintenanceSchedule?: string
  lastMaintenance?: string
  nextMaintenance?: string
  depreciationRate?: number

  // Assignment
  status: "active" | "maintenance" | "retired" | "sold"
  assignedTo?: string
  assignedToName?: string
  assignedDate?: string
  assignedBy?: string
  submittedDate?: string

  assignmentHistory?: AssignmentHistory[]

  // System fields
  createdAt?: string
  updatedAt?: string
}
