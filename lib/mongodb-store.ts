import { BaseModel } from "./models/base.model"
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
 * @param prefix - The prefix for the number ('RC', 'PAY', 'QT')
 * @param userId - User ID (not used in global counter but kept for backward compatibility)
 * @returns Promise<string> - The generated number (e.g., 'RC000001')
 */
export async function generateNextNumber(collection: string, prefix: string, userId?: string, clientName?: string): Promise<string> {
  try {
    // Map collection name to counter type
    const counterType = collection === 'receipts' ? 'receipt' : 
                       collection === 'quotations' ? 'quotation' : 
                       collection === 'payments' ? 'payment' : collection
    
    // Use the counter model to get the next globally unique sequence
    const nextNumber = await counterModel.getNextSequence(counterType, prefix, clientName)
    
    console.log(`[Counter] Generated ${counterType} number: ${nextNumber}`)
    
    return nextNumber
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
 * @param clientName - Optional client name for generating the code
 * @returns Promise<string> - The next number that will be generated
 */
export async function peekNextNumber(collection: string, prefix: string, clientName?: string): Promise<string> {
  try {
    const counterType = collection === 'receipts' ? 'receipt' : 
                       collection === 'quotations' ? 'quotation' : 
                       collection === 'payments' ? 'payment' : collection
    
    const counter = await counterModel.getCounter(counterType)
    const currentYear = new Date().getFullYear()
    
    // Extract client code
    const getClientCode = (name?: string): string => {
      if (!name || name.length === 0) return 'XX'
      const cleaned = name.replace(/[^a-zA-Z]/g, '').toUpperCase()
      return cleaned.length >= 2 ? cleaned.substring(0, 2) : cleaned.padEnd(2, 'X')
    }
    const clientCode = getClientCode(clientName)
    
    if (!counter) {
      // Counter doesn't exist yet, return the first number
      return `${prefix}-${clientCode}-${currentYear}-${String(1).padStart(3, '0')}`
    }
    
    // Return the next number that will be generated
    const nextSequence = counter.sequence + 1
    return `${prefix}-${clientCode}-${currentYear}-${String(nextSequence).padStart(3, '0')}`
  } catch (error) {
    console.error(`[Counter] Error peeking next number for ${collection}:`, error)
    const currentYear = new Date().getFullYear()
    const clientCode = 'XX'
    return `${prefix}-${clientCode}-${currentYear}-${String(1).padStart(3, '0')}`
  }
}
