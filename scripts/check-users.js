const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DATABASE_NAME = process.env.MONGODB_DB || 'prantek';

console.log('Using MongoDB URI:', MONGODB_URI.substring(0, 20) + '...');
console.log('Using Database:', DATABASE_NAME);

async function checkUsers() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(DATABASE_NAME);
    const usersCollection = db.collection('users');
    
    const allUsers = await usersCollection.find({}).toArray();
    
    console.log(`\n📋 Found ${allUsers.length} users in database:\n`);
    
    for (const user of allUsers) {
      console.log(`Email: ${user.email}`);
      console.log(`Name: ${user.name}`);
      console.log(`Role: ${user.role}`);
      console.log(`Subscription Plan ID: ${user.subscriptionPlanId || 'N/A'}`);
      console.log(`Subscription Status: ${user.subscriptionStatus || 'N/A'}`);
      console.log(`Trial Ends At: ${user.trialEndsAt ? new Date(user.trialEndsAt).toLocaleString() : 'N/A'}`);
      console.log(`Subscription Start: ${user.subscriptionStartDate ? new Date(user.subscriptionStartDate).toLocaleString() : 'N/A'}`);
      console.log(`Subscription End: ${user.subscriptionEndDate ? new Date(user.subscriptionEndDate).toLocaleString() : 'N/A'}`);
      console.log('---');
    }
    
  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

checkUsers();
