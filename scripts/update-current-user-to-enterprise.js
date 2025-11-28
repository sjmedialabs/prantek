const { MongoClient, ObjectId } = require('mongodb')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017'
const DB_NAME = process.env.DB_NAME || 'prantek'

async function updateUser() {
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    console.log('Connected to MongoDB')
    
    const db = client.db(DB_NAME)
    
    // Find the Enterprise plan
    const plan = await db.collection('subscription_plans').findOne({ name: 'Enterprise' })
    
    if (!plan) {
      console.log('Enterprise plan not found!')
      return
    }
    
    console.log(`Found Enterprise plan: ${plan._id}`)
    
    // Update all users (especially those with trial status) to use this plan
    const usersCollection = db.collection('users')
    
    const result = await usersCollection.updateMany(
      {},  // Update all users for now
      { 
        $set: { 
          subscriptionPlanId: plan._id.toString(),
          subscriptionStatus: 'trial',
          updatedAt: new Date()
        } 
      }
    )
    
    console.log(`✓ Updated ${result.modifiedCount} user(s) to Enterprise plan`)
    
    // Show updated users
    const users = await usersCollection.find({}).toArray()
    console.log('\nUpdated users:')
    users.forEach(u => {
      console.log(`- ${u.email}: Plan=${u.subscriptionPlanId}, Status=${u.subscriptionStatus}`)
    })
    
    console.log('\n✅ Done! Please refresh your browser.')
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.close()
  }
}

updateUser()
