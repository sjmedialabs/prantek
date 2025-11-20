const { MongoClient, ObjectId } = require('mongodb');

// Get URI from command line argument or environment variable
const uri = process.argv[2] || process.env.MONGODB_URI;

if (!uri) {
  console.error('Please provide MONGODB_URI as argument or environment variable');
  console.error('Usage: node remove-duplicate-payment-categories.js "mongodb+srv://..."');
  process.exit(1);
}

console.log('Using MongoDB URI:', uri.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:****@'));

async function removeDuplicatePaymentCategories() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('prantek');
    const collection = db.collection('payment_categories');
    
    // Check total count first
    const totalCount = await collection.countDocuments();
    console.log(`Total payment categories in database: ${totalCount}`);
    
    // Show all categories
    const allCategories = await collection.find({}).toArray();
    console.log('\nAll categories:');
    allCategories.forEach(cat => {
      console.log(`  - ${cat.name} (${cat._id}) - User: ${cat.userId} - Active: ${cat.isActive}`);
    });

    // Find all payment categories grouped by userId and name
    const pipeline = [
      {
        $group: {
          _id: { userId: '$userId', name: '$name' },
          docs: { $push: '$$ROOT' },
          count: { $sum: 1 }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ];

    const duplicates = await collection.aggregate(pipeline).toArray();

    console.log(`Found ${duplicates.length} sets of duplicates`);

    let totalDeleted = 0;

    for (const duplicate of duplicates) {
      const docs = duplicate.docs;
      console.log(`\nProcessing: ${duplicate._id.name} for user ${duplicate._id.userId}`);
      console.log(`  Found ${docs.length} duplicates`);

      // Sort by createdAt (keep the oldest one) or by _id
      docs.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return new Date(a.createdAt) - new Date(b.createdAt);
        }
        return a._id.toString().localeCompare(b._id.toString());
      });

      // Keep the first one (oldest), delete the rest
      const toKeep = docs[0];
      const toDelete = docs.slice(1);

      console.log(`  Keeping: ${toKeep._id} (created: ${toKeep.createdAt || 'unknown'})`);

      for (const doc of toDelete) {
        console.log(`  Deleting: ${doc._id} (created: ${doc.createdAt || 'unknown'})`);
        await collection.deleteOne({ _id: new ObjectId(doc._id) });
        totalDeleted++;
      }
    }

    console.log(`\n✅ Successfully removed ${totalDeleted} duplicate payment categories`);

    // Show final count
    const finalCount = await collection.countDocuments();
    console.log(`Final payment categories count: ${finalCount}`);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

removeDuplicatePaymentCategories();
