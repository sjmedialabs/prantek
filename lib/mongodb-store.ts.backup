import { BaseModel } from "./models/base.model"
import { UserModel } from "./models/user.model"
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
  private getModel(collection: string): BaseModel<any> | typeof UserModel | null {
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

export async function generateNextNumber(collection: string, prefix: string, userId: string): Promise<string> {
  const model = mongoStore.getModel(collection) as any
  if (!model) throw new Error(`Collection ${collection} not found`)

  const count = await model.count({ userId })
  const nextNumber = count + 1
  return `${prefix}${String(nextNumber).padStart(6, "0")}`
}
