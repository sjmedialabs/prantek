const { MongoClient, ObjectId } = require('mongodb');

async function checkUserPermissions() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/prantek";
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db();
    
    // Find the user by email
    const user = await db.collection('admin_users').findOne({
      email: 'sudheer@sjmedialabs.com'
    });
    
    if (user) {
      console.log('User found:');
      console.log('ID:', user._id);
      console.log('Name:', user.name);
      console.log('Email:', user.email);
      console.log('Role:', user.role);
      console.log('Permissions:', user.permissions);
      console.log('IsActive:', user.isActive);
      console.log('CompanyId:', user.companyId);
    } else {
      console.log('User not found');
    }
  } finally {
    await client.close();
  }
}

checkUserPermissions().catch(console.error);
