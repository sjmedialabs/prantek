const { MongoClient } = require('mongodb');

async function listUsers() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/prantek";
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db();
    
    const users = await db.collection('admin_users').find({}).limit(10).toArray();
    
    console.log(`Found ${users.length} admin users:`);
    users.forEach(user => {
      console.log('\n---');
      console.log('ID:', user._id);
      console.log('Name:', user.name);
      console.log('Email:', user.email);
      console.log('Role:', user.role);
      console.log('Permissions:', user.permissions);
      console.log('IsActive:', user.isActive);
    });
  } finally {
    await client.close();
  }
}

listUsers().catch(console.error);
