import type {
  Client,
  Item,
  Quotation,
  Receipt,
  Payment,
  User,
  CompanyDetails,
  TeamMember,
  TeamPayment,
  Vendor,
} from "./data-store"

// Helper function to make authenticated API calls
async function fetchAPI(url: string, options: RequestInit = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  })

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
      return data.clients || []
    },
    getById: async (id: string) => {
      const data = await fetchAPI(`/api/clients/${id}`)
      return data.client
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
      return data.items || []
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
      return data.quotations || []
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
      return data.quotation
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
}

export default api
