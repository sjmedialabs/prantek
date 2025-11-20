import { getDb } from "./mongodb"
import { COLLECTIONS, INDEXES } from "./db-config"

export async function initializeDatabase() {
  try {
    const db = await getDb()

    // Create indexes for all collections
    for (const [collectionKey, indexes] of Object.entries(INDEXES)) {
      const collectionName = COLLECTIONS[collectionKey as keyof typeof COLLECTIONS]
      const collection = db.collection(collectionName)

      for (const index of indexes) {
        try {
          await collection.createIndex(index.key, {
            unique: index.unique || false,
            background: true,
          })
        } catch (error) {
          console.error(`Error creating index for ${collectionName}:`, error)
        }
      }
    }

    // Initialize default subscription plans if they don't exist
    const plansCollection = db.collection(COLLECTIONS.SUBSCRIPTION_PLANS)
    const existingPlans = await plansCollection.countDocuments()

    if (existingPlans === 0) {
      await plansCollection.insertMany([
        {
          name: "Free Trial",
          price: 0,
          duration: 7,
          features: ["Basic features", "Limited storage", "Email support"],
          maxUsers: 1,
          maxClients: 10,
          maxReceipts: 50,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Starter",
          price: 999,
          duration: 30,
          features: ["All basic features", "10GB storage", "Priority support", "Custom branding"],
          maxUsers: 3,
          maxClients: 100,
          maxReceipts: 500,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Professional",
          price: 2999,
          duration: 30,
          features: ["All starter features", "50GB storage", "24/7 support", "Advanced analytics", "API access"],
          maxUsers: 10,
          maxClients: 1000,
          maxReceipts: 5000,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Enterprise",
          price: 9999,
          duration: 30,
          features: [
            "All professional features",
            "Unlimited storage",
            "Dedicated support",
            "Custom integrations",
            "SLA guarantee",
          ],
          maxUsers: -1,
          maxClients: -1,
          maxReceipts: -1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ])
    }

    return { success: true, message: "Database initialized successfully" }
  } catch (error) {
    console.error("Database initialization error:", error)
    return { success: false, message: "Database initialization failed", error }
  }
}
