const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DATABASE_NAME = process.env.MONGODB_DB || 'prantek_db';

async function updateUserTrial() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(DATABASE_NAME);
    const usersCollection = db.collection('users');
    
    // Find users with a subscription plan but no trial data
    const usersToUpdate = await usersCollection.find({
      subscriptionPlanId: { $exists: true, $ne: null, $ne: '' },
      $or: [
        { trialEndsAt: { $exists: false } },
        { trialEndsAt: null },
        { subscriptionStatus: { $exists: false } },
        { subscriptionStatus: null },
        { subscriptionStatus: 'inactive' }
      ]
    }).toArray();
    
    console.log(`Found ${usersToUpdate.length} users to update`);
    
    for (const user of usersToUpdate) {
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 14);
      
      await usersCollection.updateOne(
        { _id: user._id },
        {
          $set: {
            subscriptionStatus: 'trial',
            trialEndsAt: trialEndDate,
            subscriptionStartDate: new Date(),
            subscriptionEndDate: trialEndDate,
            updatedAt: new Date()
          }
        }
      );
      
      console.log(`Updated user ${user.email} with trial period until ${trialEndDate.toISOString()}`);
    }
    
    console.log('✅ All users updated successfully');
    
    // Display all users with their trial status
    const allUsers = await usersCollection.find({}).toArray();
    console.log('\n📋 Current user statuses:');
    for (const user of allUsers) {
      console.log(`- ${user.email}: ${user.subscriptionStatus || 'no status'} (trial ends: ${user.trialEndsAt ? new Date(user.trialEndsAt).toLocaleDateString() : 'N/A'})`);
    }
    
  } catch (error) {
    console.error('Error updating users:', error);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

updateUserTrial();
