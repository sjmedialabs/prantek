const { MongoClient } = require('mongodb');

async function checkRoles() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('prantek');
    
    // Find roles with empty _id
    const badRoles = await db.collection('roles').find({ _id: '' }).toArray();
    console.log('Roles with empty _id:', badRoles.length);
    
    if (badRoles.length > 0) {
      console.log('Deleting bad records...');
      const result = await db.collection('roles').deleteMany({ _id: '' });
      console.log('Deleted:', result.deletedCount);
    }
  } finally {
    await client.close();
  }
}

checkRoles().catch(console.error);
