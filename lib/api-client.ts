import { cookies } from "next/headers"
import type {
  Client,
  Item,
  Quotation,
  Receipt,
  Payment,
  User,
  
  TeamMember,
  
  Vendor,
} from "./models/types"

import { tokenStorage } from "./token-storage"
//import { cookies } from 'next/headers'
// Helper function to make authenticated API calls
async function fetchAPI(url: string, options: RequestInit = {}) {
  const token = tokenStorage.getAccessToken()
//     const cookieStore = await cookies()
// const token = cookieStore.get("accessToken")
  console.log("access token",token);
  const response = await fetch(url, {
    ...options,
    credentials:"include",
    headers: {
      "Content-Type": "application/json",
      // ...(token ? { Authorization: `Bearer ` } : {}),
      // ...options.headers,
      Authorization:`Bearer ${token}`
    },
  })
  //console.log(response.json());

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }))
    throw new Error(error.message || `HTTP error! status: ${response.status}`)
  }

  return response.json()
}

export const api = {
  // Clients
  clients: {
    getAll: async () => {
      const data = await fetchAPI("/api/clients")
      return data.data || []
    },
    getById: async (id: string) => {
      const data = await fetchAPI(`/api/clients/${id}`)
      // console.log("Get client the based on the id:::",data)
      return data.data
    },
    create: async (clientData: Omit<Client, "id" | "createdAt" | "updatedAt">) => {
      const data = await fetchAPI("/api/clients", {
        method: "POST",
        body: JSON.stringify(clientData),
      })
      return data.client
    },
    update: async (id: string, clientData: Partial<Client>) => {
      const data = await fetchAPI(`/api/clients/${id}`, {
        method: "PUT",
        body: JSON.stringify(clientData),
      })
      return data.client
    },
    updateStatus:async(id: string, status: "active" | "inactive")=> {
      const data=await fetchAPI(`/api/clients/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status })
     })
     return data.client
    },

    delete: async (id: string) => {
      await fetchAPI(`/api/clients/${id}`, {
        method: "DELETE",
      })
    },
  },

  // Vendors
  vendors: {
    getAll: async () => {
      const data = await fetchAPI("/api/vendors")
      return data.vendors || []
    },
    getById: async (id: string) => {
      const data = await fetchAPI(`/api/vendors/${id}`)
      return data.vendor
    },
    create: async (vendorData: Omit<Vendor, "id" | "createdAt" | "updatedAt">) => {
      const data = await fetchAPI("/api/vendors", {
        method: "POST",
        body: JSON.stringify(vendorData),
      })
      return data.vendor
    },
    update: async (id: string, vendorData: Partial<Vendor>) => {
      const data = await fetchAPI(`/api/vendors/${id}`, {
        method: "PUT",
        body: JSON.stringify(vendorData),
      })
      return data.vendor
    },
    delete: async (id: string) => {
      await fetchAPI(`/api/vendors/${id}`, {
        method: "DELETE",
      })
    },
  },

  // Items (Products/Services)
  items: {
    getAll: async () => {
      const data = await fetchAPI("/api/items")
      return data.data || []
    },
    getById: async (id: string) => {
      const data = await fetchAPI(`/api/items/${id}`)
      return data.item
    },
    create: async (itemData: Omit<Item, "id" | "createdAt" | "updatedAt">) => {
      const data = await fetchAPI("/api/items", {
        method: "POST",
        body: JSON.stringify(itemData),
      })
      return data.item
    },
    update: async (id: string, itemData: Partial<Item>) => {
      const data = await fetchAPI(`/api/items/${id}`, {
        method: "PUT",
        body: JSON.stringify(itemData),
      })
      return data.item
    },
    delete: async (id: string) => {
      await fetchAPI(`/api/items/${id}`, {
        method: "DELETE",
      })
    },
  },

  // Quotations
  quotations: {
    getAll: async () => {
      const data = await fetchAPI("/api/quotations")
      return data.data || []
    },
    getById: async (id: string) => {
      const data = await fetchAPI(`/api/quotations/${id}`)
      return data.quotation
    },
    create: async (quotationData: Omit<Quotation, "id" | "createdAt" | "updatedAt" | "quotationNumber">) => {
      const data = await fetchAPI("/api/quotations", {
        method: "POST",
        body: JSON.stringify(quotationData),
      })
      return data.quotation
    },
    update: async (id: string, quotationData: Partial<Quotation>) => {
      const data = await fetchAPI(`/api/quotations/${id}`, {
        method: "PUT",
        body: JSON.stringify(quotationData),
      })
      console.log("qutation update request ::",data)
      return data.data
    },
    delete: async (id: string) => {
      await fetchAPI(`/api/quotations/${id}`, {
        method: "DELETE",
      })
    },
    accept: async (id: string) => {
      const data = await fetchAPI(`/api/quotations/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          status: "accepted",
          acceptedDate: new Date().toISOString(),
        }),
      })
      return data.quotation
    },
  },

  // Receipts
  receipts: {
    getAll: async () => {
      const data = await fetchAPI("/api/receipts")
      return data.receipts || []
    },
    getById: async (id: string) => {
      const data = await fetchAPI(`/api/receipts/${id}`)
      return data.receipt
    },
    create: async (receiptData: Omit<Receipt, "id" | "createdAt" | "updatedAt" | "receiptNumber">) => {
      const data = await fetchAPI("/api/receipts", {
        method: "POST",
        body: JSON.stringify(receiptData),
      })
      return data.receipt
    },
    update: async (id: string, receiptData: Partial<Receipt>) => {
      const data = await fetchAPI(`/api/receipts/${id}`, {
        method: "PUT",
        body: JSON.stringify(receiptData),
      })
      return data.receipt
    },
    delete: async (id: string) => {
      await fetchAPI(`/api/receipts/${id}`, {
        method: "DELETE",
      })
    },
  },

  // Payments
  payments: {
    getAll: async () => {
      const data = await fetchAPI("/api/payments")
      return data.payments || []
    },
    getById: async (id: string) => {
      const data = await fetchAPI(`/api/payments/${id}`)
      return data.payment
    },
    create: async (paymentData: Omit<Payment, "id" | "createdAt" | "updatedAt" | "paymentNumber">) => {
      const data = await fetchAPI("/api/payments", {
        method: "POST",
        body: JSON.stringify(paymentData),
      })
      return data.payment
    },
    update: async (id: string, paymentData: Partial<Payment>) => {
      const data = await fetchAPI(`/api/payments/${id}`, {
        method: "PUT",
        body: JSON.stringify(paymentData),
      })
      return data.payment
    },
    delete: async (id: string) => {
      await fetchAPI(`/api/payments/${id}`, {
        method: "DELETE",
      })
    },
  },

  // Users
  users: {
    getAll: async () => {
      const data = await fetchAPI("/api/users")
      return data.users || []
    },
    getById: async (id: string) => {
      const data = await fetchAPI(`/api/users/${id}`)
      return data.user
    },
    create: async (userData: Omit<User, "id" | "createdAt" | "updatedAt">) => {
      const data = await fetchAPI("/api/users", {
        method: "POST",
        body: JSON.stringify(userData),
      })
      return data.user
    },
    update: async (id: string, userData: Partial<User>) => {
      const data = await fetchAPI(`/api/users/${id}`, {
        method: "PUT",
        body: JSON.stringify(userData),
      })
      return data.user
    },
    delete: async (id: string) => {
      await fetchAPI(`/api/users/${id}`, {
        method: "DELETE",
      })
    },
  },

  // Company
  company: {
    get: async () => {
      const data = await fetchAPI("/api/company")
      return data.company
    },
    update: async (companyData: Omit<CompanyDetails, "updatedAt">) => {
      const data = await fetchAPI("/api/company", {
        method: "PUT",
        body: JSON.stringify(companyData),
      })
      return data.company
    },
  },

  // Auth - Keep these as they use JWT now
  auth: {
    login: async (email: string, password: string) => {
      const data = await fetchAPI("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      })
      return data.user
    },
    logout: async () => {
      await fetchAPI("/api/auth/logout", {
        method: "POST",
      })
    },
    getCurrentUser: async () => {
      const data = await fetchAPI("/api/auth/me")
      return data.user
    },
  },

  // Team Members API
  teamMembers: {
    getAll: async () => {
      const data = await fetchAPI("/api/team-members")
      return data.teamMembers || []
    },
    getById: async (id: string) => {
      const data = await fetchAPI(`/api/team-members/${id}`)
      return data.teamMember
    },
    create: async (memberData: Omit<TeamMember, "id" | "createdAt" | "updatedAt">) => {
      const data = await fetchAPI("/api/team-members", {
        method: "POST",
        body: JSON.stringify(memberData),
      })
      return data.teamMember
    },
    update: async (id: string, memberData: Partial<TeamMember>) => {
      const data = await fetchAPI(`/api/team-members/${id}`, {
        method: "PUT",
        body: JSON.stringify(memberData),
      })
      return data.teamMember
    },
    delete: async (id: string) => {
      await fetchAPI(`/api/team-members/${id}`, {
        method: "DELETE",
      })
    },
  },

  // Team Payments API
  teamPayments: {
    getAll: async () => {
      const data = await fetchAPI("/api/team-payments")
      return data.teamPayments || []
    },
    getById: async (id: string) => {
      const data = await fetchAPI(`/api/team-payments/${id}`)
      return data.teamPayment
    },
    create: async (paymentData: Omit<TeamPayment, "id" | "createdAt" | "updatedAt">) => {
      const data = await fetchAPI("/api/team-payments", {
        method: "POST",
        body: JSON.stringify(paymentData),
      })
      return data.teamPayment
    },
    update: async (id: string, paymentData: Partial<TeamPayment>) => {
      const data = await fetchAPI(`/api/team-payments/${id}`, {
        method: "PUT",
        body: JSON.stringify(paymentData),
      })
      return data.teamPayment
    },
    delete: async (id: string) => {
      await fetchAPI(`/api/team-payments/${id}`, {
        method: "DELETE",
      })
    },
  },

  // Subscription Plans
  subscriptionPlans: {
    getAll: async () => {
      const data = await fetchAPI("/api/subscription-plans")
      return data.data || data.subscriptionPlans || data.plans || []
    },
    getById: async (id: string) => {
      const data = await fetchAPI(`/api/subscription-plans/${id}`)
      return data.data || data.plan
    },
    create: async (planData: any) => {
      const data = await fetchAPI("/api/subscription-plans", {
        method: "POST",
        body: JSON.stringify(planData),
      })
      return data.data || data.plan
    },
    update: async (id: string, planData: any) => {
      const data = await fetchAPI(`/api/subscription-plans/${id}`, {
        method: "PUT",
        body: JSON.stringify(planData),
      })
      return data.data || data.plan
    },
    delete: async (id: string) => {
      await fetchAPI(`/api/subscription-plans/${id}`, {
        method: "DELETE",
      })
    },
  },

  // Website Content (CMS)
  websiteContent: {
    getAll: async () => {
      const data = await fetchAPI("/api/website-content")
      return data.data || data.content || []
    },
    getById: async (id: string) => {
      const data = await fetchAPI(`/api/website-content/${id}`)
      return data.data || data.content
    },
    create: async (contentData: any) => {
      const data = await fetchAPI("/api/website-content", {
        method: "POST",
        body: JSON.stringify(contentData),
      })
      return data.data || data.content
    },
    update: async (id: string, contentData: any) => {
      const data = await fetchAPI(`/api/website-content/${id}`, {
        method: "PUT",
        body: JSON.stringify(contentData),
      })
      return data.data || data.content
    },
    delete: async (id: string) => {
      await fetchAPI(`/api/website-content/${id}`, {
        method: "DELETE",
      })
    },
  },

  // Bank Accounts
  bankAccounts: {
    getAll: async () => {
      const data = await fetchAPI("/api/bank-accounts")
      return data.data || data.bankAccounts || []
    },
    create: async (accountData: any) => {
      const data = await fetchAPI("/api/bank-accounts", {
        method: "POST",
        body: JSON.stringify(accountData),
      })
      return data.data || data.account
    },
    update: async (id: string, accountData: any) => {
      const data = await fetchAPI(`/api/bank-accounts/${id}`, {
        method: "PUT",
        body: JSON.stringify(accountData),
      })
      return data.data || data.account
    },
    delete: async (id: string) => {
      await fetchAPI(`/api/bank-accounts/${id}`, {
        method: "DELETE",
      })
    },
  },

  // Tax Rates
  taxRates: {
    getAll: async () => {
      const data = await fetchAPI("/api/tax-rates")
      return data.data || data.taxRates || []
    },
    create: async (taxData: any) => {
      const data = await fetchAPI("/api/tax-rates", {
        method: "POST",
        body: JSON.stringify(taxData),
      })
      return data.data || data.taxRate
    },
    update: async (id: string, taxData: any) => {
      const data = await fetchAPI(`/api/tax-rates/${id}`, {
        method: "PUT",
        body: JSON.stringify(taxData),
      })
      return data.data || data.taxRate
    },
    delete: async (id: string) => {
      await fetchAPI(`/api/tax-rates/${id}`, {
        method: "DELETE",
      })
    },
  },

  // Member Types
  memberTypes: {
    getAll: async () => {
      const data = await fetchAPI("/api/member-types")
      return data.data || data.memberTypes || []
    },
    create: async (memberTypeData: any) => {
      const data = await fetchAPI("/api/member-types", {
        method: "POST",
        body: JSON.stringify(memberTypeData),
      })
      return data.data || data.memberType
    },
    update: async (id: string, memberTypeData: any) => {
      const data = await fetchAPI(`/api/member-types/${id}`, {
        method: "PUT",
        body: JSON.stringify(memberTypeData),
      })
      return data.data || data.memberType
    },
    delete: async (id: string) => {
      await fetchAPI(`/api/member-types/${id}`, {
        method: "DELETE",
      })
    },
  },

  // Payment Categories
  paymentCategories: {
    getAll: async () => {
      const data = await fetchAPI("/api/payment-categories")
      return data.data || data.paymentCategories || []
    },
    create: async (categoryData: any) => {
      const data = await fetchAPI("/api/payment-categories", {
        method: "POST",
        body: JSON.stringify(categoryData),
      })
      return data.data || data.category
    },
    update: async (id: string, categoryData: any) => {
      const data = await fetchAPI(`/api/payment-categories/${id}`, {
        method: "PUT",
        body: JSON.stringify(categoryData),
      })
      return data.data || data.category
    },
    delete: async (id: string) => {
      await fetchAPI(`/api/payment-categories/${id}`, {
        method: "DELETE",
      })
    },
  },

  // Employees
  employees: {
    getAll: async () => {
      const data = await fetchAPI("/api/employees")
      return data.data || data.employees || []
    },
    create: async (employeeData: any) => {
      const data = await fetchAPI("/api/employees", {
        method: "POST",
        body: JSON.stringify(employeeData),
      })
      return data.data || data.employee
    },
    update: async (id: string, employeeData: any) => {
      const data = await fetchAPI(`/api/employees/${id}`, {
        method: "PUT",
        body: JSON.stringify(employeeData),
      })
      return data.data || data.employee
    },
    delete: async (id: string) => {
      await fetchAPI(`/api/employees/${id}`, {
        method: "DELETE",
      })
    },
  },

  // Roles
  roles: {
    getAll: async () => {
      const data = await fetchAPI("/api/roles")
      return data.data || data.roles || []
    },
    create: async (roleData: any) => {
      const data = await fetchAPI("/api/roles", {
        method: "POST",
        body: JSON.stringify(roleData),
      })
      return data.data || data.role
    },
    update: async (id: string, roleData: any) => {
      const data = await fetchAPI(`/api/roles/${id}`, {
        method: "PUT",
        body: JSON.stringify(roleData),
      })
      return data.data || data.role
    },
    delete: async (id: string) => {
      await fetchAPI(`/api/roles/${id}`, {
        method: "DELETE",
      })
    },
  },
}

export default api
