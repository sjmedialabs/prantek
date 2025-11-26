const { MongoClient } = require('mongodb')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017'
const DB_NAME = process.env.DB_NAME || 'prantek'

async function findAndUpdateUser() {
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    const db = client.db(DB_NAME)
    
    // Find the Enterprise plan
    const plan = await db.collection('subscription_plans').findOne({ name: 'Enterprise' })
    console.log(`Enterprise Plan ID: ${plan._id}`)
    
    // List all collections
    const collections = await db.listCollections().toArray()
    console.log('\nAvailable collections:')
    collections.forEach(c => console.log(`- ${c.name}`))
    
    // Try to find users in different collections
    const possibleCollections = ['users', 'admin_users', 'subscribers', 'accounts']
    
    for (const collName of possibleCollections) {
      try {
        const count = await db.collection(collName).countDocuments()
        if (count > 0) {
          console.log(`\nFound ${count} document(s) in '${collName}'`)
          const docs = await db.collection(collName).find({}).limit(5).toArray()
          docs.forEach(doc => {
            console.log(`  - ${doc.email || doc.name || doc._id}: role=${doc.role}, subscriptionStatus=${doc.subscriptionStatus}`)
          })
          
          // Update all in this collection
          const endDate = new Date()
          endDate.setDate(endDate.getDate() + 365)
          
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
          console.log(`  ✓ Updated ${result.modifiedCount} users in ${collName}`)
        }
      } catch (e) {
        // Collection doesn't exist, skip
      }
    }
    
    console.log('\n✅ Done! Please logout and login again.')
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.close()
  }
}

findAndUpdateUser()
