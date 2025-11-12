const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DATABASE_NAME = process.env.MONGODB_DB || 'prantek';
const USER_EMAIL = process.env.USER_EMAIL || 'sandhya@sjmedialabs.com';
const TRIAL_DAYS = parseInt(process.env.TRIAL_DAYS || '14', 10);

async function setUserTrial() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    console.log('Database:', DATABASE_NAME);
    console.log('Looking for user:', USER_EMAIL);
    
    const db = client.db(DATABASE_NAME);
    const usersCollection = db.collection('users');
    
    // Find user by email (case-insensitive)
    const user = await usersCollection.findOne({
      email: { $regex: new RegExp(`^${USER_EMAIL}$`, 'i') }
    });
    
    if (!user) {
      console.error(`❌ User not found: ${USER_EMAIL}`);
      return;
    }
    
    console.log(`✓ Found user: ${user.email} (${user.name})`);
    console.log(`  Current status: ${user.subscriptionStatus || 'N/A'}`);
    console.log(`  Current trial ends: ${user.trialEndsAt ? new Date(user.trialEndsAt).toLocaleString() : 'N/A'}`);
    
    // Calculate trial end date
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + TRIAL_DAYS);
    
    // Update user with trial data
    const result = await usersCollection.updateOne(
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
    
    if (result.modifiedCount > 0) {
      console.log(`\n✅ Successfully updated user to trial mode!`);
      console.log(`   Trial period: ${TRIAL_DAYS} days`);
      console.log(`   Trial expires: ${trialEndDate.toLocaleString()}`);
      console.log(`   Status: trial`);
    } else {
      console.log(`\n⚠️  No changes made (user may already have this data)`);
    }
    
    // Verify the update
    const updatedUser = await usersCollection.findOne({ _id: user._id });
    console.log('\n📋 Updated user details:');
    console.log(`   Email: ${updatedUser.email}`);
    console.log(`   Name: ${updatedUser.name}`);
    console.log(`   Subscription Status: ${updatedUser.subscriptionStatus}`);
    console.log(`   Trial Ends At: ${new Date(updatedUser.trialEndsAt).toLocaleString()}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
    console.log('\nMongoDB connection closed');
  }
}

setUserTrial();
