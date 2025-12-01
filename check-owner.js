const { MongoClient, ObjectId } = require('mongodb');

async function checkUser() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/prantek";
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db();
    
    const user = await db.collection('users').findOne({
      _id: new ObjectId('6926f0a15987e02f2ae60a51')
    });
    
    if (user) {
      console.log('User found in users collection:');
      console.log('ID:', user._id);
      console.log('Name:', user.name);
      console.log('Email:', user.email);
      console.log('Role:', user.role);
      console.log('UserType:', user.userType);
      console.log('Permissions:', user.permissions);
      console.log('SubscriptionPlanId:', user.subscriptionPlanId);
      console.log('SubscriptionStatus:', user.subscriptionStatus);
    } else {
      console.log('User not found');
    }
  } finally {
    await client.close();
  }
}

checkUser().catch(console.error);
