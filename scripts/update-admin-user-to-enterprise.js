const { MongoClient, ObjectId } = require('mongodb')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017'
const DB_NAME = process.env.DB_NAME || 'prantek'

async function updateAdminUser() {
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
    
    // Calculate end date (365 days from now for trial)
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + 365)
    
    // Update admin users
    const adminUsersCollection = db.collection('admin_users')
    
    const result = await adminUsersCollection.updateMany(
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
    
    console.log(`✓ Updated ${result.modifiedCount} admin user(s) to Enterprise plan`)
    
    // Show updated users
    const users = await adminUsersCollection.find({}).toArray()
    console.log('\nUpdated admin users:')
    users.forEach(u => {
      console.log(`- ${u.email}: Plan=${u.subscriptionPlanId}, Status=${u.subscriptionStatus}`)
    })
    
    console.log('\n✅ Done! Please logout and login again, or refresh your browser.')
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.close()
  }
}

updateAdminUser()
