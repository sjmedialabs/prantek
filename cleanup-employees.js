const { MongoClient } = require('mongodb');

async function checkEmployees() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('prantek');
    
    // Find employees with empty _id
    const badEmployees = await db.collection('employees').find({ _id: '' }).toArray();
    console.log('Employees with empty _id:', badEmployees.length);
    
    if (badEmployees.length > 0) {
      console.log('Deleting bad records...');
      const result = await db.collection('employees').deleteMany({ _id: '' });
      console.log('Deleted:', result.deletedCount);
    }
  } finally {
    await client.close();
  }
}

checkEmployees().catch(console.error);
