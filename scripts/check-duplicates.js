// This script checks for duplicate records in the database
const { MongoClient } = require('mongodb');

async function checkDuplicates() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db('prantek');
    
    // Check recipient types
    console.log('\n=== Checking Recipient Types ===');
    const recipientTypes = await db.collection('recipientTypes').find({}).toArray();
    console.log('Total recipient types:', recipientTypes.length);
    
    const recipientTypesByName = {};
    recipientTypes.forEach(rt => {
      const key = `${rt.name}-${rt.value}-${rt.userId}`;
      if (!recipientTypesByName[key]) {
        recipientTypesByName[key] = [];
      }
      recipientTypesByName[key].push(rt);
    });
    
    let hasDuplicates = false;
    Object.entries(recipientTypesByName).forEach(([key, types]) => {
      if (types.length > 1) {
        console.log(`\nDuplicate found: ${key}`);
        types.forEach(t => console.log(`  - ID: ${t._id}, Created: ${t.createdAt}`));
        hasDuplicates = true;
      }
    });
    
    if (!hasDuplicates) {
      console.log('No duplicates found in recipient types');
    }
    
    // Check payment categories
    console.log('\n=== Checking Payment Categories ===');
    const paymentCategories = await db.collection('paymentCategories').find({}).toArray();
    console.log('Total payment categories:', paymentCategories.length);
    
    const categoriesByName = {};
    paymentCategories.forEach(cat => {
      const key = `${cat.name}-${cat.userId}`;
      if (!categoriesByName[key]) {
        categoriesByName[key] = [];
      }
      categoriesByName[key].push(cat);
    });
    
    hasDuplicates = false;
    Object.entries(categoriesByName).forEach(([key, cats]) => {
      if (cats.length > 1) {
        console.log(`\nDuplicate found: ${key}`);
        cats.forEach(c => console.log(`  - ID: ${c._id}, Created: ${c.createdAt}`));
        hasDuplicates = true;
      }
    });
    
    if (!hasDuplicates) {
      console.log('No duplicates found in payment categories');
    }
    
    // Check subscription plans
    console.log('\n=== Checking Subscription Plans ===');
    const plans = await db.collection('subscriptionPlans').find({}).toArray();
    console.log('Total plans:', plans.length);
    console.log('Active plans:', plans.filter(p => p.isActive).length);
    
    if (plans.length > 0) {
      plans.forEach(plan => {
        console.log(`  - ${plan.name}: ${plan.isActive ? 'ACTIVE' : 'INACTIVE'} (${plan._id})`);
      });
    } else {
      console.log('No subscription plans found in database!');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkDuplicates();
