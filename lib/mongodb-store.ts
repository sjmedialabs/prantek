import { TermsModel } from "./models/terms.model"
import { BaseModel } from "./models/base.model"
import { getDb } from "./mongodb"
import { UserModel } from "./models/user.model"
import { counterModel } from "./models/counter.model"
import { COLLECTIONS } from "./db-config"
import type {
  Client,
  Vendor,
  Item,
  Receipt,
  Quotation,
  Payment,
  SubscriptionPlan,
  PaymentMethod,
  Category,
  TaxSetting,
  TaxRate,
  BankDetail,
  CompanySetting,
  TeamMember,
  MemberType,
  Role,
  ActivityLog,
  PurchaseInvoice,
} from "./models/types"

export const models = {
  users: UserModel,
  clients: new BaseModel<Client>(COLLECTIONS.CLIENTS),
  vendors: new BaseModel<Vendor>(COLLECTIONS.VENDORS),
  items: new BaseModel<Item>(COLLECTIONS.ITEMS),
  receipts: new BaseModel<Receipt>(COLLECTIONS.RECEIPTS),
  quotations: new BaseModel<Quotation>(COLLECTIONS.QUOTATIONS),
  payments: new BaseModel<Payment>(COLLECTIONS.PAYMENTS),
  subscriptionPlans: new BaseModel<SubscriptionPlan>(COLLECTIONS.SUBSCRIPTION_PLANS),
  paymentMethods: new BaseModel<PaymentMethod>(COLLECTIONS.PAYMENT_METHODS),
  salesCategories: new BaseModel<Category>(COLLECTIONS.SALES_CATEGORIES),
  purchaseInvoices: new BaseModel<PurchaseInvoice>(COLLECTIONS.PURCHASE_INVOICES),
  receiptCategories: new BaseModel<Category>(COLLECTIONS.RECEIPT_CATEGORIES),
  paymentCategories: new BaseModel<Category>(COLLECTIONS.PAYMENT_CATEGORIES),
  taxSettings: new BaseModel<TaxSetting>(COLLECTIONS.TAX_SETTINGS),
  taxRates: new BaseModel<TaxRate>(COLLECTIONS.TAX_RATES),
  bankDetails: new BaseModel<BankDetail>(COLLECTIONS.BANK_ACCOUNTS),
  companySettings: new BaseModel<CompanySetting>(COLLECTIONS.COMPANY_SETTINGS),
  teamMembers: new BaseModel<TeamMember>(COLLECTIONS.TEAM_MEMBERS),
  memberTypes: new BaseModel<MemberType>(COLLECTIONS.MEMBER_TYPES),
  roles: new BaseModel<Role>(COLLECTIONS.ROLES),
  activityLogs: new BaseModel<ActivityLog>(COLLECTIONS.ACTIVITY_LOGS),
  terms: TermsModel,

}

export class MongoDBStore {
  // Get all documents from a collection with optional filtering and pagination
  async getAll<T>(
    collection: string,
    filter: any = {},
    options: {
      skip?: number
      limit?: number
      sort?: any
    } = {},
  ): Promise<T[]> {
    const model = this.getModel(collection)
    if (!model) return []

    return await model.findAll(filter, options)
  }

  // Get a single document by ID
  async getById<T>(collection: string, id: string): Promise<T | null> {
    const model = this.getModel(collection)
    if (!model) return null

    return await model.findById(id)
  }

  // Create a new document
  async create<T>(collection: string, data: any): Promise<T> {
    const model = this.getModel(collection)
    if (!model) throw new Error(`Collection ${collection} not found`)

    return await model.create(data)
  }

  // Update a document by ID
  async update<T>(collection: string, id: string, updates: any): Promise<T | null> {
    const model = this.getModel(collection)
    if (!model) return null

    const success = await model.update(id, updates)
    if (!success) return null

    return await model.findById(id)
  }

  // Delete a document by ID
  async delete(collection: string, id: string): Promise<boolean> {
    const model = this.getModel(collection)
    if (!model) return false

    return await model.delete(id)
  }

  // Count documents in a collection
  async count(collection: string, filter: any = {}): Promise<number> {
    const model = this.getModel(collection)
    if (!model) return 0

    return await model.count(filter)
  }

  // Find one document matching filter
  async findOne<T>(collection: string, filter: any): Promise<T | null> {
    const model = this.getModel(collection)
    if (!model) return null

    return await model.findOne(filter)
  }

  // Check if a document exists
  async exists(collection: string, filter: any): Promise<boolean> {
    const model = this.getModel(collection)
    if (!model) return false

    return await model.exists(filter)
  }

  // Get the appropriate model for a collection
  getModel(collection: string): BaseModel<any> | typeof UserModel | null {
    const modelMap: Record<string, any> = {
      users: models.users,
      clients: models.clients,
      vendors: models.vendors,
      items: models.items,
      receipts: models.receipts,
      quotations: models.quotations,
      payments: models.payments,
      subscriptionPlans: models.subscriptionPlans,
      paymentMethods: models.paymentMethods,
      receiptCategories: models.receiptCategories,
      paymentCategories: models.paymentCategories,
      taxSettings: models.taxSettings,
      "tax-rates": models.taxRates,
      bankDetails: models.bankDetails,
      companySettings: models.companySettings,
      teamMembers: models.teamMembers,
      memberTypes: models.memberTypes,
      roles: models.roles,
      activityLogs: models.activityLogs,
      terms: models.terms,
      salesInvoice: models.salesCategories,
      purchaseInvoice: models.purchaseInvoices,
    }

    return modelMap[collection] || null
  }
}

export const mongoStore = new MongoDBStore()

export async function logActivity(
  userId: string,
  action: string,
  entity: string,
  entityId?: string,
  details?: Record<string, any>,
) {
  try {
    await models.activityLogs.create({
      userId,
      action,
      entity,
      entityId,
      details,
      timestamp: new Date(),
    } as any)
  } catch (error) {
    console.error("Failed to log activity:", error)
  }
}

/**
 * Generate globally unique sequential numbers for receipts, payments, quotations, etc.
 * This function uses atomic operations to ensure no duplicates across all users.
 * 
 * @param collection - The collection type ('receipts', 'payments', 'quotations')
 * @param prefix - The prefix for the number (e.g., 'RC', 'SI', 'QT')
 * @param userId - The ID of the user/company for whom the number is generated.
 * @returns Promise<string> - The generated number (e.g., 'RC000001')
 */
export async function generateNextNumber(collection: string, prefix: string, userId: string): Promise<string> {
  try {
    const db = await getDb()
    const counters = db.collection(COLLECTIONS.COUNTERS)

    const getFinancialYear = () => {
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth() + 1 // Jan = 1
      return month >= 4 ? year + 1 : year
    }
    const financialYear = getFinancialYear()

    // Map collection name to counter type
    const counterType =
      collection === "receipts"
        ? "receipt"
        : collection === "quotations"
        ? "quotation"
        : collection === "salesInvoice"
        ? "salesInvoice"
        : collection === "payments"
        ? "payment"
        : collection

    const counterId = `${counterType}_${userId}_${financialYear}`

    const result = await counters.findOneAndUpdate(
      { _id: counterId },
      {
        $inc: { sequence: 1 },
        $setOnInsert: { prefix, userId, financialYear, counterType },
      },
      { upsert: true, returnDocument: "after" },
    )

    const sequence = result?.sequence || 1
    const sequenceString = String(sequence).padStart(3, "0")

    const newNumber = `${prefix}-${financialYear}-${sequenceString}`
    console.log(`[Counter] Generated ${counterType} number for user ${userId}: ${newNumber}`)
    return newNumber
  } catch (error) {
    console.error(`[Counter] Error generating number for ${collection}:`, error)
    throw new Error(`Failed to generate unique number for ${collection}`)
  }
}

/**
 * Get the next number without incrementing (for display purposes)
 * 
 * @param collection - The collection type
 * @param prefix - The prefix for the number
 * @param userId - The ID of the user/company to get the next number for.
 * @returns Promise<string> - The next number that will be generated
 */
export async function peekNextNumber(collection: string, prefix: string, userId: string) {
  const db = await getDb()
  const counters = db.collection(COLLECTIONS.COUNTERS)

  const counterType =
    collection === "receipts"
      ? "receipt"
      : collection === "quotations"
      ? "quotation"
      : collection === "salesInvoice"
      ? "salesInvoice"
      : collection === "payments"
      ? "payment"
      : collection

  const now = new Date()
  const fy = now.getMonth() + 1 >= 4 ? now.getFullYear() + 1 : now.getFullYear()

  const counterId = `${counterType}_${userId}_${fy}`
  const counter = await counters.findOne({ _id: counterId })

  const sequence = (counter?.sequence || 0) + 1
  const sequenceString = String(sequence).padStart(3, "0")

  return `${prefix}-${fy}-${sequenceString}`
}
