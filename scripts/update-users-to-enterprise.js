const { MongoClient } = require('mongodb')

const MONGODB_URI = process.env.MONGODB_URI
const DB_NAME = process.env.DB_NAME || 'prantek'

async function updateUsers() {
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    console.log('Connected to MongoDB Atlas')
    
    const db = client.db(DB_NAME)
    
    // Find the Enterprise plan
    const plan = await db.collection('subscription_plans').findOne({ name: 'Enterprise plan' })
    
    if (!plan) {
      console.log('Enterprise plan not found! Available plans:')
      const plans = await db.collection('subscription_plans').find({}).toArray()
      plans.forEach(p => console.log(`  - ${p.name} (ID: ${p._id})`))
      return
    }
    
    console.log(`Found Enterprise Plan: ${plan._id}`)
    console.log(`Plan Features:`, plan.planFeatures)
    
    // List collections
    const collections = await db.listCollections().toArray()
    console.log('\nAvailable collections:')
    collections.forEach(c => console.log(`  - ${c.name}`))
    
    // Calculate end date
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + 365)
    
    // Update users in different collections
    const userCollections = ['users', 'admin_users']
    
    for (const collName of userCollections) {
      try {
        const count = await db.collection(collName).countDocuments()
        if (count > 0) {
          console.log(`\nUpdating ${count} user(s) in '${collName}'...`)
          
          const result = await db.collection(collName).updateMany(
            {},
            {
              $set: {
                subscriptionPlanId: plan._id.toString(),
                subscriptionStatus: 'trial',
                subscriptionStartDate: new Date(),
                subscriptionEndDate: endDate,
                updatedAt: new Date()
              }
            }
          )
          
          console.log(`  ✓ Updated ${result.modifiedCount} users`)
          
          // Show updated users
          const users = await db.collection(collName).find({}).limit(3).toArray()
          users.forEach(u => {
            console.log(`    - ${u.email}: Plan=${u.subscriptionPlanId}`)
          })
        }
      } catch (e) {
        // Skip if collection doesn't exist
      }
    }
    
    console.log('\n✅ Done! Please logout and login again to see all features.')
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.close()
  }
}

updateUsers()
