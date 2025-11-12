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
  trialEndsAt?: Date
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
  itemName: string            // changed field name
  description?: string
  quantity: number
  price: number
  discount?: number           // add since FE sends it
  cgst?: number               // add
  sgst?: number               // add
  igst?: number               // add
  total?: number              // optional if you calculate later
}


export interface Quotation extends BaseDocument {
  userId: string
  clientId: string
  quotationNumber: string
  date: string | Date

  validity?: string | Date     // accept the field exactly as FE sends
  note?: string                // rename notes → note so FE works

  items: QuotationItem[]

  grandTotal: number           // replace subtotal + total → grandTotal
  status: string               // keep as is ("pending", "sent", etc.)
  isActive?:string,
  paidAmount?:number,
  balanceAmount?:number
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
  bankAccount?: string
  createdBy: string
  category?: string
  status: "pending" | "completed" | "failed" | "cancelled"
  description?: string
  referenceNumber?: string
}

export interface SubscriptionPlan extends BaseDocument {
  id?: string
  name: string
  price: number
  duration: number
  billingCycle: "monthly" | "yearly"
  features: string[]
  maxUsers: number
  maxClients: number
  maxReceipts: number
  isActive: boolean
  description?: string
  maxStorage?: string
  subscriberCount?: number
  revenue?: number
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

export interface Role extends BaseDocument {
  name: string
  permissions: string[]
  description?: string
  isActive: boolean
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
