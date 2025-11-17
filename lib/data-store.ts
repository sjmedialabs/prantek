// Comprehensive data management layer using localStorage
// This provides a simple but complete data persistence solution

export interface User {
  id: string
  email: string
  password: string
  name: string
  role: "super-admin" | "admin" | "employee"
  tenantId?: string // Added tenantId for data isolation - super-admin has no tenantId, others do
  phone?: string
  address?: string
  profilePicture?: string
  subscriptionPlanId?: string
  subscriptionStatus?: "active" | "inactive" | "trial" | "cancelled"
  subscriptionStartDate?: string
  subscriptionEndDate?: string
  trialEndsAt?: string
  createdAt: string
  updatedAt: string
}

export interface Client {
  id: string
  name: string
  email: string
  phone: string
  address: string
  status: "active" | "inactive"  
  createdAt: string
  updatedAt: string
}
 
export interface Vendor {
  id: string
  name: string
  email: string
  phone: string
  address: string
  category: string // e.g., "Supplier", "Service Provider", "Contractor"
  createdAt: string
  updatedAt: string
}

// Added BankAccount interface
export interface BankAccount {
  id: string
  bankName: string
  branchName: string
  accountName: string
  accountNumber: string
  ifscCode: string
  upiId: string
  upiScanner: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface TaxRate {
  id: string
  type: "CGST" | "SGST" | "IGST"
  rate: number
  description: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface TaxSettings {
  tanNumber: string
  tanDocument: string | null
  gstNumber: string
  gstDocument: string | null
  updatedAt: string
}

export interface Item {
  id: string
  name: string
  description: string
  price: number
  type: "product" | "service"
  unitType?: "gm" | "kg" | "liters" | "ml" | "qty" | "pcs" | "box" | "dozen"
  hsnCode?: string // Added HSN code field
  taxType?: "taxable" | "non-taxable" // Added tax type field
  cgstRate?: number // Added CGST rate
  sgstRate?: number // Added SGST rate
  igstRate?: number // Added IGST rate
  createdAt: string
  updatedAt: string
}

export interface QuotationItem {
  itemId: string
  itemName: string
  description: string
  quantity: number
  unitPrice: number
  taxRate: number
  amount: number
}

export interface Quotation {
  id: string
  quotationNumber: string
  projectName: string // Added to distinguish multiple quotations per client
  clientId: string
  clientName: string
  clientEmail: string
  clientPhone: string 
  clientAddress: string
  date: string
  validUntil: string
  items: QuotationItem[]
  subtotal: number
  taxAmount: number
  total: number
  amountPaid: number // Added to track total amount paid
  amountPending: number // Added to track remaining balance
  status: "pending" | "accepted" | "rejected"
  acceptedDate?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Receipt {
  id: string
  receiptNumber: string
  quotationId: string // Made mandatory - every receipt must reference a quotation
  quotationNumber: string
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
  status: "received" | "cleared" // Lowercase to match reconciliation
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface ClientTransaction {
  id: string
  clientId: string
  clientName: string
  quotationId: string
  quotationNumber: string
  receiptId?: string
  receiptNumber?: string
  transactionType: "quotation_created" | "payment_received" | "payment_cleared"
  amount: number
  balance: number // Running balance for this quotation
  date: string
  description: string
  createdAt: string
}

export interface Payment {
  id: string
  paymentNumber: string
  recipientType: "client" | "vendor" | "team" // Type of recipient
  recipientId: string // ID of the recipient (client, vendor, or team member)
  recipientName: string // Name of the recipient
  date: string
  amount: number
  paymentMethod: "cash" | "card" | "upi" | "bank-transfer" | "cheque"
  category: string
  description: string
  status: "completed" | "pending" | "failed"
  bankAccount?: string
  referenceNumber?: string
  createdAt: string
  updatedAt: string
}

export interface CompanyDetails {
  name: string
  email: string
  phone: string
  address: string
  website: string
  logo: string
  updatedAt: string
}

export interface SubscriptionPlan {
  id: string
  _id: string
  name: string
  description: string
  price: number
  billingCycle: "monthly" | "yearly"
  features: string[]
  maxUsers: number
  maxStorage: string
  isActive: boolean
  subscriberCount: number
  revenue: number
  createdAt: string
  updatedAt: string
}

// Website Content Management System Interface
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

export interface TeamMember {
  id: string
  name: string
  email: string
  phone: string
  role: string // Role name from roles system
  memberType: "employee" | "contract" | "student" | "other" // Added member type field
  department?: string
  joiningDate: string
  salary?: number // Now optional, only for employees
  assignedAssets: string[] // Array of asset IDs
  status: "active" | "inactive"
  createdAt: string
  updatedAt: string
}

export interface TeamPayment {
  id: string
  teamMemberId: string
  teamMemberName: string
  amount: number
  paymentDate: string
  paymentType: "salary" | "bonus" | "reimbursement" | "advance" | "other"
  paymentMethod: "cash" | "bank-transfer" | "cheque" | "upi"
  description: string
  status: "completed" | "pending"
  createdAt: string
  updatedAt: string
}

export interface MemberType {
  id: string
  name: string
  code: string // Unique code like "employee", "contract", "student", etc.
  description: string
  requiresSalary: boolean // Whether this type requires salary field
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ActivityLog {
  id: string
  userId: string
  userName: string
  userRole: "super-admin" | "admin" | "employee"
  action: string // e.g., "login", "logout", "create_client", "update_payment"
  entity?: string // e.g., "client", "payment", "quotation"
  entityId?: string
  description: string
  ipAddress?: string
  timestamp: string
}

export interface DocumentItem {
  id: string
  label: string // e.g., "Bachelor's Degree", "ABC Company - Offer Letter"
  url: string
  uploadedAt: string
}

export interface Employee {
  id: string
  employeeNumber: string
  employeeName: string
  surname: string
  photo: string
  mobileNo: string
  email: string
  address: string
  aadharNo: string
  aadharUpload: string
  joiningDate: string // Renamed from startDate
  relievingDate?: string // Added relieving date (optional)
  description: string
  memberType: string
  role: string
  resume?: string // Added resume field
  panCard?: string // Added PAN card field
  bankAccountDetails?: string // Added bank account details field
  educationCertificates: DocumentItem[] // Added education and experience certificate arrays
  experienceCertificates: DocumentItem[]
  isActive: boolean // Added isActive for soft delete
  createdAt: string
  updatedAt: string
}

// Data Store Class
class DataStore {
  private async getCurrentTenantId(): Promise<string | null> {
    if (typeof window === "undefined") return null

    try {
      const response = await fetch("/api/auth/me")
      if (!response.ok) return null

      const user = await response.json()

      // Super admin has no tenant ID (can see all data)
      if (user?.role === "super-admin") {
        return null
      }

      // Return the tenant ID for regular users
      return user?.tenantId || null
    } catch (error) {
      console.error("[v0] Error getting current tenant ID:", error)
      return null
    }
  }

  // Generic CRUD operations
  async getAll<T>(entity: string, tenantId?: string | null): Promise<T[]> {
    if (typeof window === "undefined") return []

    try {
      const params = new URLSearchParams()
      if (tenantId !== undefined) {
        params.append("tenantId", tenantId || "")
      }

      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null
      const headers: HeadersInit = { "Content-Type": "application/json" }
      if (token) headers.Authorization = `Bearer ${token}`
      const response = await fetch(`/api/${entity}?${params.toString()}`, { headers, credentials: "include" })
      if (!response.ok) {
        console.error(`[v0] Failed to fetch ${entity}:`, response.statusText)
        return []
      }

      const data = await response.json()
      return data.data || data || []
    } catch (error) {
      console.error(`[v0] Error fetching ${entity}:`, error)
      return []
    }
  }

  async getById<T extends { id: string }>(entity: string, id: string, tenantId?: string | null): Promise<T | null> {
    if (typeof window === "undefined") return null

    try {
      const params = new URLSearchParams()
      if (tenantId !== undefined) {
        params.append("tenantId", tenantId || "")
      }

      const response = await fetch(`/api/${entity}/${id}?${params.toString()}`)
      if (!response.ok) {
        console.error(`[v0] Failed to fetch ${entity} by ID:`, response.statusText)
        return null
      }

      const data = await response.json()
      return data.data || data || null
    } catch (error) {
      console.error(`[v0] Error fetching ${entity} by ID:`, error)
      return null
    }
  }

  async create<T extends { id: string; createdAt: string; updatedAt: string }>(
    entity: string,
    data: Omit<T, "id" | "createdAt" | "updatedAt">,
    tenantId?: string | null,
  ): Promise<T> {
    try {
      const response = await fetch(`/api/${entity}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, tenantId }),
      })

      if (!response.ok) {
        throw new Error(`Failed to create ${entity}`)
      }

      const result = await response.json()
      return result.data || result
    } catch (error) {
      console.error(`[v0] Error creating ${entity}:`, error)
      throw error
    }
  }

  async update<T extends { id: string; updatedAt: string }>(
    entity: string,
    id: string,
    data: Partial<T>,
    tenantId?: string | null,
  ): Promise<T | null> {
    try {
      const response = await fetch(`/api/${entity}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, tenantId }),
      })

      if (!response.ok) {
        console.error(`[v0] Failed to update ${entity}:`, response.statusText)
        return null
      }

      const result = await response.json()
      return result.data || result
    } catch (error) {
      console.error(`[v0] Error updating ${entity}:`, error)
      return null
    }
  }

  async delete(entity: string, id: string, tenantId?: string | null): Promise<boolean> {
    try {
      const response = await fetch(`/api/${entity}/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId }),
      })

      return response.ok
    } catch (error) {
      console.error(`[v0] Error deleting ${entity}:`, error)
      return false
    }
  }

  async saveAll<T>(entity: string, data: T[], tenantId?: string | null): Promise<void> {
    // Not needed for MongoDB - use create/update instead
    console.warn("[v0] saveAll is deprecated with MongoDB. Use create/update methods instead.")
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // Specialized methods
  async generateNumber(entity: string, prefix: string, tenantId?: string | null): Promise<string> {
    const items = await this.getAll(entity, tenantId)
    const number = items.length + 1
    return `${prefix}${String(number).padStart(5, "0")}`
  }

  // Company Details (singleton)
  async getCompanyDetails(tenantId?: string | null): Promise<CompanyDetails> {
    try {
      const params = new URLSearchParams()
      if (tenantId !== undefined) {
        params.append("tenantId", tenantId || "")
      }

      const response = await fetch(`/api/company?${params.toString()}`)
      if (!response.ok) {
        return this.getDefaultCompanyDetails()
      }

      const data = await response.json()
      return data.data || data || this.getDefaultCompanyDetails()
    } catch (error) {
      console.error("[v0] Error fetching company details:", error)
      return this.getDefaultCompanyDetails()
    }
  }

  private getDefaultCompanyDetails(): CompanyDetails {
    return {
      name: "",
      email: "",
      phone: "",
      address: "",
      website: "",
      logo: "",
      updatedAt: new Date().toISOString(),
    }
  }

  async saveCompanyDetails(details: Omit<CompanyDetails, "updatedAt">, tenantId?: string | null): Promise<void> {
    try {
      await fetch("/api/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...details, tenantId }),
      })
    } catch (error) {
      console.error("[v0] Error saving company details:", error)
    }
  }

  // Authentication
  async getCurrentUser(userType: "admin" | "super-admin" = "admin"): Promise<User | null> {
    if (typeof window === "undefined") return null

    try {
      const response = await fetch("/api/auth/me")
      if (!response.ok) return null

      const user = await response.json()

      // Filter by user type if needed
      if (userType === "super-admin" && user?.role !== "super-admin") {
        return null
      }
      if (userType === "admin" && user?.role === "super-admin") {
        return null
      }

      return user
    } catch (error) {
      console.error("[v0] Error getting current user:", error)
      return null
    }
  }

  async setCurrentUser(user: User | null, userType: "admin" | "super-admin" = "admin"): Promise<void> {
    // Not needed with JWT - tokens are managed by auth system
    if (user) {
      await this.logActivity({
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: "login",
        description: `${user.name} logged in as ${user.role}`,
      })
    }
  }

  async authenticate(
    email: string,
    password: string,
    userType: "admin" | "super-admin" = "admin",
  ): Promise<User | null> {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, userType }),
      })

      if (!response.ok) return null

      const data = await response.json()
      return data.user || null
    } catch (error) {
      console.error("[v0] Error authenticating:", error)
      return null
    }
  }

  async logout(userType: "admin" | "super-admin" = "admin"): Promise<void> {
    try {
      const user = await this.getCurrentUser(userType)
      if (user) {
        await this.logActivity({
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          action: "logout",
          description: `${user.name} logged out`,
        })
      }

      await fetch("/api/auth/logout", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      })
    } catch (error) {
      console.error("[v0] Error logging out:", error)
    }
  }

  async logActivity(data: Omit<ActivityLog, "id" | "timestamp">): Promise<ActivityLog> {
    try {
      const response = await fetch("/api/activity-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error("Failed to log activity")
      }

      const result = await response.json()
      return result.data || result
    } catch (error) {
      console.error("[v0] Error logging activity:", error)
      throw error
    }
  }

  async getAllActivityLogs(): Promise<ActivityLog[]> {
    const logs = await this.getAll<ActivityLog>("activity-logs")
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }

  async getActivityLogsByUser(userId: string): Promise<ActivityLog[]> {
    const logs = await this.getAllActivityLogs()
    return logs.filter((log) => log.userId === userId)
  }

  async clearOldActivityLogs(daysToKeep = 30): Promise<void> {
    try {
      await fetch("/api/activity-logs/cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ daysToKeep }),
      })
    } catch (error) {
      console.error("[v0] Error clearing old activity logs:", error)
    }
  }

  // Website Content Management Methods
  async getWebsiteContent(tenantId?: string | null): Promise<WebsiteContent> {
    if (typeof window === "undefined") {
      return this.getDefaultWebsiteContent()
    }
    try {
      const params = new URLSearchParams()
      if (tenantId !== undefined) {
        params.append("tenantId", tenantId || "")
      }

      const response = await fetch(`/api/website-content?${params.toString()}`)
      if (!response.ok) {
        return this.getDefaultWebsiteContent()
      }

      const data = await response.json()
      return (Array.isArray(data) && data.length === 0) ? this.getDefaultWebsiteContent() : (data.data || data || this.getDefaultWebsiteContent())
    } catch (error) {
      console.error("[v0] Error fetching website content:", error)
      return this.getDefaultWebsiteContent()
    }
  }

  async saveWebsiteContent(content: Omit<WebsiteContent, "updatedAt">, tenantId?: string | null): Promise<void> {
    try {
      await fetch("/api/website-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...content, tenantId }),
      })
    } catch (error) {
      console.error("[v0] Error saving website content:", error)
    }
  }

  private getDefaultWebsiteContent(): WebsiteContent {
    return {
      companyName: "Your SaaS Platform",
      tagline: "Streamline Your Business Operations",
      logo: "/generic-company-logo.png",

      heroTitle: "Transform Your Business with Smart Financial Management",
      heroSubtitle: "Manage quotations, receipts, payments, and more - all in one powerful platform",
      heroCtaText: "Get Started",
      heroCtaLink: "/signin",
      heroRightImage: "/financial-dashboard-mobile-app.jpg",
      heroBackgroundImage: "/abstract-financial-background.png",
      heroSecondaryCtaText: "Watch Demo",
      heroSecondaryCtaLink: "#demo",
      heroDemoVideoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Added default YouTube demo video URL

      trustedByTitle: "Trusted by 1000+ businesses",
      trustedByLogos: [
        { id: "1", name: "YoloBus", logo: "" },
        { id: "2", name: "PolicyBazaar", logo: "" },
        { id: "3", name: "Swiggy", logo: "" },
        { id: "4", name: "Zomato", logo: "" },
        { id: "5", name: "Flipkart", logo: "" },
        { id: "6", name: "Amazon", logo: "" },
        { id: "7", name: "Paytm", logo: "" },
        { id: "8", name: "PhonePe", logo: "" },
      ],

      aboutTitle: "About Our Platform",
      aboutDescription:
        "We provide comprehensive business management solutions to help you streamline operations, manage finances, and grow your business efficiently.",

      featuresTitle: "Built for Success",
      featuresSubtitle: "Everything you need to manage your business finances efficiently and grow with confidence",
      features: [
        {
          id: "1",
          title: "Secure & Certified",
          description:
            "Bank-grade security with 256-bit encryption. Your financial data is protected with industry-leading security standards.",
          icon: "Shield",
        },
        {
          id: "2",
          title: "Universal Acceptance",
          description:
            "Accept payments from all major payment methods. Seamlessly integrate with UPI, cards, and digital wallets.",
          icon: "Zap",
        },
        {
          id: "3",
          title: "Real-time Analytics",
          description:
            "Get instant insights into your cash flow, expenses, and revenue with powerful dashboards and reports.",
          icon: "BarChart3",
        },
        {
          id: "4",
          title: "Smart Invoicing",
          description:
            "Create professional quotations and invoices in seconds. Automated reminders and payment tracking included.",
          icon: "FileText",
        },
        {
          id: "5",
          title: "Team Collaboration",
          description:
            "Invite team members with custom roles and permissions. Work together seamlessly on financial operations.",
          icon: "Users",
        },
        {
          id: "6",
          title: "Save Time",
          description:
            "Automate repetitive tasks and reduce manual data entry. Focus on growing your business, not paperwork.",
          icon: "Clock",
        },
      ],

      industriesTitle: "Industries We Serve",
      industriesSubtitle: "Trusted by businesses across industries to streamline their financial operations",
      industries: [
        {
          id: "1",
          title: "Logistics",
          description: "Manage fleet expenses, driver payments, and fuel costs efficiently",
          icon: "Truck",
          gradient: "from-blue-500 via-blue-600 to-blue-700",
        },
        {
          id: "2",
          title: "Retail & E-Commerce",
          description: "Track inventory, sales, and vendor payments in real-time",
          icon: "ShoppingBag",
          gradient: "from-purple-500 via-purple-600 to-purple-700",
        },
        {
          id: "3",
          title: "Food & Beverage",
          description: "Streamline restaurant operations, supplier payments, and cash management",
          icon: "Utensils",
          gradient: "from-orange-500 via-orange-600 to-orange-700",
        },
        {
          id: "4",
          title: "Real Estate",
          description: "Manage property transactions, tenant payments, and maintenance costs",
          icon: "Building2",
          gradient: "from-green-500 via-green-600 to-green-700",
        },
        {
          id: "5",
          title: "Professional Services",
          description: "Handle client billing, project expenses, and team reimbursements",
          icon: "Briefcase",
          gradient: "from-indigo-500 via-indigo-600 to-indigo-700",
        },
        {
          id: "6",
          title: "Manufacturing",
          description: "Control production costs, supplier invoices, and inventory expenses",
          icon: "Store",
          gradient: "from-red-500 via-red-600 to-red-700",
        },
      ],

      showcaseTitle: "Complete Business Management Solution",
      showcaseSubtitle: "Financial & Operations SAAS Application",
      showcaseDescription:
        "Manage every aspect of your business from financial transactions to asset tracking, with powerful reporting and compliance features built for modern enterprises.",
      showcaseFeatures: [
        "Multi-tenant architecture with secure data isolation",
        "Role-based access control with custom permissions",
        "Real-time financial tracking and reporting",
        "Asset management with condition monitoring",
        "Automated compliance and audit trails",
      ],

      testimonialsTitle: "Testimonials",
      testimonialsSubtitle: "Don't just take our word for it - hear what our customers have to say",
      testimonials: [
        {
          id: "1",
          company: "YoloBus",
          logo: "YB",
          author: "Rohit Sharma",
          role: "Finance Manager",
          content:
            "Prantek has transformed how we manage our fleet expenses. The real-time tracking and automated reports save us hours every week. Highly recommended for logistics companies!",
          rating: 5,
        },
        {
          id: "2",
          company: "FreshMart",
          logo: "FM",
          author: "Priya Patel",
          role: "Store Owner",
          content:
            "Managing multiple store locations was a nightmare before Prantek. Now I can track all expenses, inventory, and payments from one dashboard. It's a game-changer for retail businesses.",
          rating: 5,
        },
        {
          id: "3",
          company: "TechConsult",
          logo: "TC",
          author: "Amit Kumar",
          role: "CEO",
          content:
            "The invoicing and payment tracking features are excellent. Our clients love the professional quotations, and we love how easy it is to manage everything. Worth every rupee!",
          rating: 5,
        },
      ],

      pricingTitle: "Choose the Perfect Plan to Suit Your Needs",
      pricingSubtitle:
        "Start with our Standard plan and upgrade as your business grows. All plans include core features with 14-day free trial.",
      pricingFooterText: "All plans include 14-day free trial • Cancel anytime",

      faqTitle: "FAQs",
      faqSubtitle: "Got questions? We've got answers",
      faqs: [
        {
          id: "1",
          question: "How is Prantek different from other accounting software?",
          answer:
            "Prantek is specifically designed for Indian businesses with features like GST compliance, multi-location support, and UPI integration. We focus on simplicity and ease of use while providing powerful financial management tools.",
        },
        {
          id: "2",
          question: "Is there a setup cost or long-term contract?",
          answer:
            "No setup costs and no long-term contracts required. You can start with our 14-day free trial and choose a monthly or annual subscription plan that suits your business needs. Cancel anytime without penalties.",
        },
        {
          id: "3",
          question: "How secure is my financial data?",
          answer:
            "We use bank-grade 256-bit encryption and follow industry best practices for data security. Your data is backed up daily and stored in secure data centers. We are SOC 2 Type II certified and fully compliant with Indian data protection regulations.",
        },
        {
          id: "4",
          question: "Can I import my existing data?",
          answer:
            "Yes! We support data import from Excel, CSV, and most popular accounting software. Our support team will help you migrate your data smoothly during the onboarding process.",
        },
        {
          id: "5",
          question: "Do employees need another ID or app?",
          answer:
            "No additional apps needed. Team members can access Prantek through their web browser or our mobile app using their email credentials. You can set custom permissions for each team member.",
        },
        {
          id: "6",
          question: "Can I integrate with Tally, Zoho or other tools?",
          answer:
            "Yes, we offer integrations with popular tools like Tally, Zoho, and various payment gateways. Our API also allows custom integrations with your existing business systems.",
        },
      ],

      ctaTitle: "Experience the Best Way to Manage Business Finances",
      ctaSubtitle: "Join thousands of businesses already using Prantek to streamline their financial operations",
      ctaPrimaryText: "Get Started Free",
      ctaPrimaryLink: "/signin",
      ctaSecondaryText: "Schedule a Demo",
      ctaSecondaryLink: "#demo",
      ctaFeatures: ["14-day free trial", "Cancel anytime"],

      contactEmail: "info@yourcompany.com",
      contactPhone: "+91 12345 67890",
      contactAddress: "123 Business Street, City, State - 123456",

      socialFacebook: "",
      socialTwitter: "",
      socialLinkedin: "",
      socialInstagram: "",

      footerText: "© 2025 Your Company. All rights reserved.",

      updatedAt: new Date().toISOString(),
    }
  }

  // Vendor Management
  async getAllVendors(tenantId?: string | null): Promise<Vendor[]> {
    return this.getAll<Vendor>("vendors", tenantId)
  }

  async getVendorById(id: string, tenantId?: string | null): Promise<Vendor | null> {
    return this.getById<Vendor>("vendors", id, tenantId)
  }

  async createVendor(data: Omit<Vendor, "id" | "createdAt" | "updatedAt">, tenantId?: string | null): Promise<Vendor> {
    return this.create<Vendor>("vendors", data, tenantId)
  }

  async updateVendor(id: string, data: Partial<Vendor>, tenantId?: string | null): Promise<Vendor | null> {
    return this.update<Vendor>("vendors", id, data, tenantId)
  }

  async deleteVendor(id: string, tenantId?: string | null): Promise<boolean> {
    return this.delete("vendors", id, tenantId)
  }

  // Team Member Management
  async getAllTeamMembers(tenantId?: string | null): Promise<TeamMember[]> {
    return this.getAll<TeamMember>("team-members", tenantId)
  }

  async getTeamMemberById(id: string, tenantId?: string | null): Promise<TeamMember | null> {
    return this.getById<TeamMember>("team-members", id, tenantId)
  }

  async createTeamMember(
    data: Omit<TeamMember, "id" | "createdAt" | "updatedAt">,
    tenantId?: string | null,
  ): Promise<TeamMember> {
    return this.create<TeamMember>("team-members", data, tenantId)
  }

  async updateTeamMember(id: string, data: Partial<TeamMember>, tenantId?: string | null): Promise<TeamMember | null> {
    return this.update<TeamMember>("team-members", id, data, tenantId)
  }

  async deleteTeamMember(id: string, tenantId?: string | null): Promise<boolean> {
    return this.delete("team-members", id, tenantId)
  }

  // Team Payment Management
  async getAllTeamPayments(tenantId?: string | null): Promise<TeamPayment[]> {
    return this.getAll<TeamPayment>("team-payments", tenantId)
  }

  async getTeamPaymentById(id: string, tenantId?: string | null): Promise<TeamPayment | null> {
    return this.getById<TeamPayment>("team-payments", id, tenantId)
  }

  async createTeamPayment(
    data: Omit<TeamPayment, "id" | "createdAt" | "updatedAt">,
    tenantId?: string | null,
  ): Promise<TeamPayment> {
    return this.create<TeamPayment>("team-payments", data, tenantId)
  }

  async updateTeamPayment(
    id: string,
    data: Partial<TeamPayment>,
    tenantId?: string | null,
  ): Promise<TeamPayment | null> {
    return this.update<TeamPayment>("team-payments", id, data, tenantId)
  }

  async deleteTeamPayment(id: string, tenantId?: string | null): Promise<boolean> {
    return this.delete("team-payments", id, tenantId)
  }

  // Member Type Management
  async getAllMemberTypes(tenantId?: string | null): Promise<MemberType[]> {
    return this.getAll<MemberType>("member-types", tenantId)
  }

  async getActiveMemberTypes(tenantId?: string | null): Promise<MemberType[]> {
    const allTypes = await this.getAll<MemberType>("member-types", tenantId)
    return allTypes.filter((type) => type.isActive)
  }

  async getMemberTypeById(id: string, tenantId?: string | null): Promise<MemberType | null> {
    return this.getById<MemberType>("member-types", id, tenantId)
  }

  async getMemberTypeByCode(code: string, tenantId?: string | null): Promise<MemberType | null> {
    const types = await this.getAll<MemberType>("member-types", tenantId)
    return types.find((type) => type.code === code) || null
  }

  async createMemberType(
    data: Omit<MemberType, "id" | "createdAt" | "updatedAt">,
    tenantId?: string | null,
  ): Promise<MemberType> {
    return this.create<MemberType>("member-types", data, tenantId)
  }

  async updateMemberType(id: string, data: Partial<MemberType>, tenantId?: string | null): Promise<MemberType | null> {
    return this.update<MemberType>("member-types", id, data, tenantId)
  }

  async deleteMemberType(id: string, tenantId?: string | null): Promise<boolean> {
    return this.delete("member-types", id, tenantId)
  }

  // Subscription Plan Management
  async getAllSubscriptionPlans(tenantId?: string | null): Promise<SubscriptionPlan[]> {
    return this.getAll<SubscriptionPlan>("subscription-plans", tenantId)
  }

  async getActiveSubscriptionPlans(tenantId?: string | null): Promise<SubscriptionPlan[]> {
    const allPlans = await this.getAllSubscriptionPlans(tenantId)
    return allPlans.filter((plan) => plan.isActive).sort((a, b) => a.price - b.price)
  }

  async getSubscriptionPlanById(id: string, tenantId?: string | null): Promise<SubscriptionPlan | null> {
    return this.getById<SubscriptionPlan>("subscription-plans", id, tenantId)
  }

  async createSubscriptionPlan(
    data: Omit<SubscriptionPlan, "id" | "createdAt" | "updatedAt">,
    tenantId?: string | null,
  ): Promise<SubscriptionPlan> {
    return this.create<SubscriptionPlan>("subscription-plans", data, tenantId)
  }

  async updateSubscriptionPlan(
    id: string,
    data: Partial<SubscriptionPlan>,
    tenantId?: string | null,
  ): Promise<SubscriptionPlan | null> {
    return this.update<SubscriptionPlan>("subscription-plans", id, data, tenantId)
  }

  async deleteSubscriptionPlan(id: string, tenantId?: string | null): Promise<boolean> {
    return this.delete("subscription-plans", id, tenantId)
  }

  async getTaxSettings(tenantId?: string | null): Promise<TaxSettings> {
    try {
      const params = new URLSearchParams()
      if (tenantId !== undefined) {
        params.append("tenantId", tenantId || "")
      }

      const response = await fetch(`/api/tax-settings?${params.toString()}`)
      if (!response.ok) {
        return this.getDefaultTaxSettings()
      }

      const data = await response.json()
      return data.data || data || this.getDefaultTaxSettings()
    } catch (error) {
      console.error("[v0] Error fetching tax settings:", error)
      return this.getDefaultTaxSettings()
    }
  }

  private getDefaultTaxSettings(): TaxSettings {
    return {
      tanNumber: "",
      tanDocument: null,
      gstNumber: "",
      gstDocument: null,
      updatedAt: new Date().toISOString(),
    }
  }

  async saveTaxSettings(settings: Omit<TaxSettings, "updatedAt">, tenantId?: string | null): Promise<void> {
    try {
      await fetch("/api/tax-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...settings, tenantId }),
      })
    } catch (error) {
      console.error("[v0] Error saving tax settings:", error)
    }
  }

  async getAllTaxRates(tenantId?: string | null): Promise<TaxRate[]> {
    return this.getAll<TaxRate>("tax-rates", tenantId)
  }

  async getActiveTaxRates(type?: "CGST" | "SGST" | "IGST", tenantId?: string | null): Promise<TaxRate[]> {
    const rates = await this.getAllTaxRates(tenantId)
    return rates.filter((rate) => rate.isActive && (!type || rate.type === type))
  }

  async createTaxRate(
    data: Omit<TaxRate, "id" | "createdAt" | "updatedAt">,
    tenantId?: string | null,
  ): Promise<TaxRate> {
    return this.create<TaxRate>("tax-rates", data, tenantId)
  }

  async updateTaxRate(id: string, data: Partial<TaxRate>, tenantId?: string | null): Promise<TaxRate | null> {
    return this.update<TaxRate>("tax-rates", id, data, tenantId)
  }

  async getOrCreateQuotationForClient(
    clientId: string,
    clientData: {
      clientName: string
      clientEmail: string
      clientPhone: string
      clientAddress: string
    },
    items: QuotationItem[],
    projectName: string, // Added projectName parameter
    tenantId?: string | null,
  ): Promise<Quotation> {
    const quotations = await this.getAll<Quotation>("quotations", tenantId)
    const existingQuotation = quotations.find(
      (q) =>
        q.clientId === clientId &&
        q.projectName === projectName &&
        (q.status === "pending" || q.status === "accepted") &&
        q.amountPending > 0, // Only return quotations with pending balance
    )

    if (existingQuotation) {
      return existingQuotation
    }

    // Create new quotation
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0)
    const taxAmount = items.reduce((sum, item) => sum + (item.amount * item.taxRate) / 100, 0)
    const total = subtotal + taxAmount

    const quotationData = {
      quotationNumber: await this.generateNumber("quotations", "QT-", tenantId),
      projectName, // Added projectName
      clientId,
      ...clientData,
      date: new Date().toISOString().split("T")[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 30 days validity
      items,
      subtotal,
      taxAmount,
      total,
      amountPaid: 0, // Initialize amountPaid to 0
      amountPending: total, // Initialize amountPending to total
      status: "accepted" as const,
      acceptedDate: new Date().toISOString().split("T")[0],
      notes: "Auto-generated from receipt",
    }

    const newQuotation = await this.create<Quotation>("quotations", quotationData, tenantId)

    // Log transaction
    await this.createClientTransaction(
      {
        clientId,
        clientName: clientData.clientName,
        quotationId: newQuotation.id,
        quotationNumber: newQuotation.quotationNumber,
        transactionType: "quotation_created",
        amount: total,
        balance: total,
        date: newQuotation.date,
        description: `Quotation ${newQuotation.quotationNumber} created for ${projectName}`,
      },
      tenantId,
    )

    return newQuotation
  }

  async createReceiptWithQuotation(
    receiptData: {
      clientId: string
      clientName: string
      clientEmail: string
      clientPhone: string
      clientAddress: string
      quotationId?: string
      projectName?: string // Added projectName parameter
      items?: QuotationItem[]
      amountPaid: number
      paymentType: "full" | "partial"
      paymentMethod: "cash" | "card" | "upi" | "bank-transfer" | "cheque"
      bankAccount?: string
      referenceNumber?: string
      screenshot?: string
      notes?: string
    },
    tenantId?: string | null,
  ): Promise<Receipt> {
    let quotation: Quotation

    // If quotation ID provided, use it
    if (receiptData.quotationId) {
      const existingQuotation = await this.getById<Quotation>("quotations", receiptData.quotationId, tenantId)
      if (!existingQuotation) {
        throw new Error("Quotation not found")
      }
      quotation = existingQuotation
    } else {
      // Create or get quotation for client
      if (!receiptData.items || receiptData.items.length === 0) {
        throw new Error("Items are required when creating receipt without quotation")
      }
      if (!receiptData.projectName) {
        throw new Error("Project name is required when creating receipt without quotation")
      }
      quotation = await this.getOrCreateQuotationForClient(
        receiptData.clientId,
        {
          clientName: receiptData.clientName,
          clientEmail: receiptData.clientEmail,
          clientPhone: receiptData.clientPhone,
          clientAddress: receiptData.clientAddress,
        },
        receiptData.items,
        receiptData.projectName,
        tenantId,
      )
    }

    const updatedAmountPaid = quotation.amountPaid + receiptData.amountPaid
    const updatedAmountPending = quotation.total - updatedAmountPaid

    await this.update<Quotation>(
      "quotations",
      quotation.id,
      {
        amountPaid: updatedAmountPaid,
        amountPending: updatedAmountPending,
      },
      tenantId,
    )

    // Calculate balance for this receipt
    const balanceAmount = updatedAmountPending

    // Determine status based on payment method
    const status = receiptData.paymentMethod === "cash" ? "cleared" : "received"

    // Create receipt
    const receipt = await this.create<Receipt>(
      "receipts",
      {
        receiptNumber: await this.generateNumber("receipts", "REC-", tenantId),
        quotationId: quotation.id,
        quotationNumber: quotation.quotationNumber,
        clientId: receiptData.clientId,
        clientName: receiptData.clientName,
        clientEmail: receiptData.clientEmail,
        clientPhone: receiptData.clientPhone,
        clientAddress: receiptData.clientAddress,
        date: new Date().toISOString().split("T")[0],
        items: quotation.items,
        subtotal: quotation.subtotal,
        taxAmount: quotation.taxAmount,
        total: quotation.total,
        amountPaid: receiptData.amountPaid,
        balanceAmount,
        paymentType: receiptData.paymentType,
        paymentMethod: receiptData.paymentMethod,
        bankAccount: receiptData.bankAccount,
        referenceNumber: receiptData.referenceNumber,
        screenshot: receiptData.screenshot,
        status,
        notes: receiptData.notes,
      },
      tenantId,
    )

    // Log transaction
    await this.createClientTransaction(
      {
        clientId: receiptData.clientId,
        clientName: receiptData.clientName,
        quotationId: quotation.id,
        quotationNumber: quotation.quotationNumber,
        receiptId: receipt.id,
        receiptNumber: receipt.receiptNumber,
        transactionType: status === "cleared" ? "payment_cleared" : "payment_received",
        amount: receiptData.amountPaid,
        balance: balanceAmount,
        date: receipt.date,
        description: `Payment ${receipt.receiptNumber} - ${receiptData.paymentMethod} (Pending: ₹${balanceAmount.toLocaleString()})`,
      },
      tenantId,
    )

    return receipt
  }

  async createClientTransaction(
    data: Omit<ClientTransaction, "id" | "createdAt">,
    tenantId?: string | null,
  ): Promise<ClientTransaction> {
    return this.create<ClientTransaction>("client-transactions", data, tenantId)
  }

  async getClientTransactions(clientId: string, tenantId?: string | null): Promise<ClientTransaction[]> {
    const transactions = await this.getAll<ClientTransaction>("client-transactions", tenantId)
    return transactions
      .filter((t) => t.clientId === clientId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  async getQuotationTransactions(quotationId: string, tenantId?: string | null): Promise<ClientTransaction[]> {
    const transactions = await this.getAll<ClientTransaction>("client-transactions", tenantId)
    return transactions
      .filter((t) => t.quotationId === quotationId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  async getReceiptsForReconciliation(tenantId?: string | null): Promise<Receipt[]> {
    const receipts = await this.getAll<Receipt>("receipts", tenantId)
    return receipts.filter((r) => r.status === "received") // Only non-cleared receipts
  }

  async clearReceipt(receiptId: string, tenantId?: string | null): Promise<Receipt | null> {
    const receipt = await this.update<Receipt>("receipts", receiptId, { status: "cleared" }, tenantId)

    if (receipt) {
      // Log transaction
      await this.createClientTransaction(
        {
          clientId: receipt.clientId,
          clientName: receipt.clientName,
          quotationId: receipt.quotationId,
          quotationNumber: receipt.quotationNumber,
          receiptId: receipt.id,
          receiptNumber: receipt.receiptNumber,
          transactionType: "payment_cleared",
          amount: receipt.amountPaid,
          balance: receipt.balanceAmount,
          date: new Date().toISOString().split("T")[0],
          description: `Payment ${receipt.receiptNumber} cleared in reconciliation`,
        },
        tenantId,
      )
    }

    return receipt
  }

  async getQuotationsByClient(clientId: string, tenantId?: string | null): Promise<Quotation[]> {
    const quotations = await this.getAll<Quotation>("quotations", tenantId)
    return quotations
      .filter((q) => q.clientId === clientId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  async getActiveQuotationsByClient(clientId: string, tenantId?: string | null): Promise<Quotation[]> {
    const quotations = await this.getQuotationsByClient(clientId, tenantId)
    return quotations.filter((q) => q.amountPending > 0 && (q.status === "accepted" || q.status === "pending"))
  }

  // Employee Management
  async getAllEmployees(tenantId?: string | null): Promise<Employee[]> {
    return this.getAll<Employee>("employees", tenantId)
  }

  async getEmployeeById(id: string, tenantId?: string | null): Promise<Employee | null> {
    return this.getById<Employee>("employees", id, tenantId)
  }

  async createEmployee(
    data: Omit<Employee, "id" | "createdAt" | "updatedAt">,
    tenantId?: string | null,
  ): Promise<Employee> {
    return this.create<Employee>("employees", data, tenantId)
  }

  async updateEmployee(id: string, data: Partial<Employee>, tenantId?: string | null): Promise<Employee | null> {
    return this.update<Employee>("employees", id, data, tenantId)
  }

  async deleteEmployee(id: string, tenantId?: string | null): Promise<boolean> {
    return this.delete("employees", id, tenantId)
  }
}

// Export singleton instance
export const dataStore = new DataStore()
