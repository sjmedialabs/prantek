const { MongoClient, ObjectId } = require('mongodb')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017'
const DB_NAME = process.env.DB_NAME || 'prantek'

const DEFAULT_PLAN_FEATURES = {
  cashBook: true,
  clients: false,
  vendors: false,
  quotations: false,
  receipts: false,
  payments: false,
  reconciliation: false,
  assets: false,
  reports: false,
  settings: false,
  hrSettings: false
}

async function initializePlanFeatures() {
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    console.log('Connected to MongoDB')
    
    const db = client.db(DB_NAME)
    const plansCollection = db.collection('subscription_plans')
    
    // Get all plans
    const plans = await plansCollection.find({}).toArray()
    console.log(`Found ${plans.length} subscription plans`)
    
    for (const plan of plans) {
      if (!plan.planFeatures) {
        console.log(`\nInitializing features for plan: ${plan.name}`)
        
        // Set features based on plan price/name
        let planFeatures = { ...DEFAULT_PLAN_FEATURES }
        
        if (plan.price === 0 || plan.name.toLowerCase().includes('free') || plan.name.toLowerCase().includes('basic')) {
          // Free/Basic plan - only cashBook
          planFeatures = {
            cashBook: true,
            clients: false,
            vendors: false,
            quotations: false,
            receipts: false,
            payments: false,
            reconciliation: false,
            assets: false,
            reports: false,
            settings: false,
            hrSettings: false
          }
          console.log('  → Set as Basic plan (cashBook only)')
        } else if (plan.name.toLowerCase().includes('standard') || plan.name.toLowerCase().includes('professional')) {
          // Standard/Professional plan - most features
          planFeatures = {
            cashBook: true,
            clients: true,
            vendors: true,
            quotations: true,
            receipts: true,
            payments: true,
            reconciliation: true,
            assets: false,
            reports: true,
            settings: true,
            hrSettings: true
          }
          console.log('  → Set as Standard plan (most features)')
        } else if (plan.name.toLowerCase().includes('premium') || plan.name.toLowerCase().includes('enterprise')) {
          // Premium/Enterprise plan - all features
          planFeatures = {
            cashBook: true,
            clients: true,
            vendors: true,
            quotations: true,
            receipts: true,
            payments: true,
            reconciliation: true,
            assets: true,
            reports: true,
            settings: true,
            hrSettings: true
          }
          console.log('  → Set as Premium plan (all features)')
        }
        
        // Update the plan
        await plansCollection.updateOne(
          { _id: plan._id },
          { 
            $set: { 
              planFeatures,
              updatedAt: new Date()
            } 
          }
        )
        console.log('  ✓ Plan features initialized')
      } else {
        console.log(`\n${plan.name}: planFeatures already exist, skipping`)
      }
    }
    
    console.log('\n✅ Plan features initialization complete!')
    
  } catch (error) {
    console.error('Error initializing plan features:', error)
    process.exit(1)
  } finally {
    await client.close()
  }
}

initializePlanFeatures()
