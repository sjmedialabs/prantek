const { MongoClient, ObjectId } = require('mongodb')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017'
const DB_NAME = process.env.DB_NAME || 'prantek'

const ALL_FEATURES = {
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

async function enableAllFeatures() {
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    console.log('Connected to MongoDB')
    
    const db = client.db(DB_NAME)
    
    // Find all subscription plans
    const plansCollection = db.collection('subscription_plans')
    const plans = await plansCollection.find({}).toArray()
    
    console.log(`\nFound ${plans.length} subscription plans`)
    
    if (plans.length === 0) {
      console.log('\nNo plans found. Creating default Enterprise plan...')
      
      // Create an Enterprise plan with all features
      const enterprisePlan = {
        name: 'Enterprise',
        price: 4999,
        duration: 365,
        billingCycle: 'yearly',
        features: [
          'Cash Book Management',
          'Client Management',
          'Vendor Management',
          'Quotation Management',
          'Receipt Management',
          'Payment Management',
          'Reconciliation',
          'Asset Management',
          'Reports & Analytics',
          'Settings & Configuration',
          'HR Settings',
          'Unlimited Users',
          'Unlimited Clients',
          'Unlimited Receipts',
          'Priority Support'
        ],
        planFeatures: ALL_FEATURES,
        maxUsers: -1,
        maxClients: -1,
        maxReceipts: -1,
        isActive: true,
        description: 'Complete business management solution',
        maxStorage: '100GB',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      const result = await plansCollection.insertOne(enterprisePlan)
      console.log(`✓ Created Enterprise plan with ID: ${result.insertedId}`)
      
      // Update all users with this plan name to have the new plan ID
      const usersCollection = db.collection('users')
      const updateResult = await usersCollection.updateMany(
        { 
          $or: [
            { subscriptionStatus: 'trial' },
            { subscriptionStatus: 'active' }
          ]
        },
        { 
          $set: { 
            subscriptionPlanId: result.insertedId.toString(),
            updatedAt: new Date()
          } 
        }
      )
      console.log(`✓ Updated ${updateResult.modifiedCount} users with Enterprise plan`)
    } else {
      // Update existing plans
      for (const plan of plans) {
        console.log(`\nProcessing plan: ${plan.name}`)
        
        let planFeatures = ALL_FEATURES
        
        // Set features based on plan name or price
        if (plan.price === 0 || plan.name.toLowerCase().includes('basic') || plan.name.toLowerCase().includes('free')) {
          planFeatures = {
            ...ALL_FEATURES,
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
          planFeatures = {
            ...ALL_FEATURES,
            assets: false
          }
          console.log('  → Set as Standard plan (all except assets)')
        } else {
          console.log('  → Set as Premium/Enterprise plan (all features)')
        }
        
        await plansCollection.updateOne(
          { _id: plan._id },
          { 
            $set: { 
              planFeatures,
              updatedAt: new Date()
            } 
          }
        )
        console.log('  ✓ Plan features updated')
      }
    }
    
    console.log('\n✅ All features enabled successfully!')
    
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  } finally {
    await client.close()
  }
}

enableAllFeatures()
