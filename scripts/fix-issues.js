// This script fixes duplicate records and activates plans
const { MongoClient, ObjectId } = require('mongodb');

async function fixIssues() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db('prantek');
    
    // Fix recipient types duplicates
    console.log('\n=== Fixing Recipient Types Duplicates ===');
    const recipientTypes = await db.collection('recipientTypes').find({}).toArray();
    console.log('Total recipient types before:', recipientTypes.length);
    
    const recipientTypesByKey = {};
    recipientTypes.forEach(rt => {
      const key = `${rt.name}-${rt.value}-${rt.userId}`;
      if (!recipientTypesByKey[key]) {
        recipientTypesByKey[key] = [];
      }
      recipientTypesByKey[key].push(rt);
    });
    
    let recipientDuplicatesRemoved = 0;
    for (const [key, types] of Object.entries(recipientTypesByKey)) {
      if (types.length > 1) {
        // Keep the first one, delete the rest
        const [keep, ...remove] = types.sort((a, b) => 
          new Date(a.createdAt) - new Date(b.createdAt)
        );
        
        console.log(`\nRemoving ${remove.length} duplicate(s) of: ${key}`);
        for (const rt of remove) {
          await db.collection('recipientTypes').deleteOne({ _id: rt._id });
          console.log(`  - Deleted ID: ${rt._id}`);
          recipientDuplicatesRemoved++;
        }
      }
    }
    
    console.log(`\nTotal recipient type duplicates removed: ${recipientDuplicatesRemoved}`);
    
    // Fix payment categories duplicates
    console.log('\n=== Fixing Payment Categories Duplicates ===');
    const paymentCategories = await db.collection('paymentCategories').find({}).toArray();
    console.log('Total payment categories before:', paymentCategories.length);
    
    const categoriesByKey = {};
    paymentCategories.forEach(cat => {
      const key = `${cat.name}-${cat.userId}`;
      if (!categoriesByKey[key]) {
        categoriesByKey[key] = [];
      }
      categoriesByKey[key].push(cat);
    });
    
    let categoryDuplicatesRemoved = 0;
    for (const [key, cats] of Object.entries(categoriesByKey)) {
      if (cats.length > 1) {
        // Keep the first one, delete the rest
        const [keep, ...remove] = cats.sort((a, b) => 
          new Date(a.createdAt) - new Date(b.createdAt)
        );
        
        console.log(`\nRemoving ${remove.length} duplicate(s) of: ${key}`);
        for (const cat of remove) {
          await db.collection('paymentCategories').deleteOne({ _id: cat._id });
          console.log(`  - Deleted ID: ${cat._id}`);
          categoryDuplicatesRemoved++;
        }
      }
    }
    
    console.log(`\nTotal payment category duplicates removed: ${categoryDuplicatesRemoved}`);
    
    // Fix subscription plans - activate all plans
    console.log('\n=== Activating Subscription Plans ===');
    const plans = await db.collection('subscriptionPlans').find({}).toArray();
    console.log('Total plans:', plans.length);
    
    if (plans.length === 0) {
      console.log('No plans found. Please seed the database with subscription plans first.');
    } else {
      const inactivePlans = plans.filter(p => !p.isActive);
      console.log('Inactive plans:', inactivePlans.length);
      
      if (inactivePlans.length > 0) {
        for (const plan of inactivePlans) {
          await db.collection('subscriptionPlans').updateOne(
            { _id: plan._id },
            { $set: { isActive: true, updatedAt: new Date() } }
          );
          console.log(`  - Activated: ${plan.name} (${plan._id})`);
        }
      } else {
        console.log('All plans are already active!');
      }
    }
    
    console.log('\n=== Fix Complete ===');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

fixIssues();
