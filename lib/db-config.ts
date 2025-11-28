export const DB_NAME = "prantek"

export const COLLECTIONS = {
  USERS: "users",  // Legacy user collection for subscription/account owners
  ADMIN_USERS: "admin_users",  // New collection for admin users with dashboard access
  SUPER_ADMINS: "super_admins",  // Super admin accounts
  CLIENTS: "clients",
  VENDORS: "vendors",
  ITEMS: "items",
  RECEIPTS: "receipts",
  QUOTATIONS: "quotations",
  PAYMENTS: "payments",
  SUBSCRIPTION_PLANS: "subscription_plans",
  EMPLOYEES: "employees",  // Employee records without login access
  PAYMENT_METHODS: "payment_methods",
  RECEIPT_CATEGORIES: "receipt_categories",
  PAYMENT_CATEGORIES: "payment_categories",
  RECIPIENT_TYPES: "recipient_types",
  TAX_SETTINGS: "tax_settings",
  TAX_RATES: "tax_rates",
  BANK_ACCOUNTS: "bank_accounts",
  COMPANY_SETTINGS: "company_settings",
  TEAM_MEMBERS: "team_members",
  MEMBER_TYPES: "member_types",
  ROLES: "roles",  // Roles for admin users (dashboard permissions)
  ACTIVITY_LOGS: "activity_logs",
  WEBSITE_CONTENT: "website_content",
  ASSETS: "assets",
  COUNTERS: "counters", // New collection for global sequences
} as const

export const INDEXES = {
  USERS: [
    { key: { email: 1 }, unique: true },
    { key: { phone: 1 }, unique: false }, // Add index for phone lookups
    { key: { companyId: 1 } },
    { key: { subscriptionPlanId: 1 } },
    { key: { createdAt: -1 } },
  ],
  ADMIN_USERS: [
    { key: { email: 1 }, unique: true },
    { key: { roleId: 1 } },
    { key: { companyId: 1 } },
    { key: { isActive: 1 } },
    { key: { createdAt: -1 } },
  ],
  SUPER_ADMINS: [
    { key: { email: 1 }, unique: true },
    { key: { isActive: 1 } },
    { key: { createdAt: -1 } },
  ],
  CLIENTS: [{ key: { userId: 1 } }, { key: { email: 1 } }, { key: { name: 1 } }, { key: { createdAt: -1 } }],
  VENDORS: [{ key: { userId: 1 } }, { key: { email: 1 } }, { key: { name: 1 } }, { key: { createdAt: -1 } }],
  ITEMS: [{ key: { userId: 1 } }, { key: { name: 1 } }, { key: { category: 1 } }, { key: { createdAt: -1 } }],
  RECEIPTS: [
    { key: { userId: 1 } },
    { key: { clientId: 1 } },
    { key: { receiptNumber: 1 }, unique: true },
    { key: { status: 1 } },
    { key: { date: -1 } },
    { key: { createdAt: -1 } },
  ],
  QUOTATIONS: [
    { key: { userId: 1 } },
    { key: { clientId: 1 } },
    { key: { quotationNumber: 1 }, unique: true },
    { key: { status: 1 } },
    { key: { date: -1 } },
    { key: { createdAt: -1 } },
  ],
  PAYMENTS: [
    { key: { userId: 1 } },
    { key: { recipientId: 1 } },
    { key: { paymentNumber: 1 }, unique: true },
    { key: { status: 1 } },
    { key: { date: -1 } },
    { key: { createdAt: -1 } },
  ],
  SUBSCRIPTION_PLANS: [{ key: { name: 1 }, unique: true }, { key: { price: 1 } }],
  EMPLOYEES: [
    { key: { userId: 1 } },
    { key: { employeeNumber: 1 }, unique: true },
    { key: { email: 1 } },
    { key: { designation: 1 } },
    { key: { employmentStatus: 1 } },
    { key: { createdAt: -1 } },
  ],
  TEAM_MEMBERS: [{ key: { userId: 1 } }, { key: { email: 1 } }, { key: { createdAt: -1 } }],
  ROLES: [
    { key: { userId: 1 } },
    { key: { code: 1 } },
    { key: { isActive: 1 } },
  ],
  ACTIVITY_LOGS: [{ key: { userId: 1 } }, { key: { action: 1 } }, { key: { timestamp: -1 } }],
  WEBSITE_CONTENT: [{ key: { key: 1 }, unique: true }],
  ASSETS: [{ key: { userId: 1 }, unique: true }],
  COUNTERS: [{ key: { _id: 1 }, unique: true }], // Index for counters collection
}

// Alias for backward compatibility
export { COLLECTIONS as Collections }
