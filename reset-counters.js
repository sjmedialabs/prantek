const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://prantek_db:Prantek123@prantek.vhvpmuu.mongodb.net/?appName=prantek';
const DB_NAME = 'prantek';

async function resetCounters() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const countersCollection = db.collection('counters');
    
    console.log('🔄 Resetting counters with correct values...\n');
    
    // Count total receipts (they're already using RC format)
    const receiptCount = await db.collection('receipts').countDocuments();
    console.log(`📝 Receipts: Found ${receiptCount} receipts`);
    await countersCollection.updateOne(
      { _id: 'receipt' },
      {
        $set: {
          _id: 'receipt',
          prefix: 'RC',
          sequence: receiptCount,
          lastUpdated: new Date()
        }
      },
      { upsert: true }
    );
    console.log(`   ✅ Receipt counter set to ${receiptCount} (next will be RC${String(receiptCount + 1).padStart(6, '0')})`);
    
    // Count total payments (ignore old format, start fresh)
    const paymentCount = await db.collection('payments').countDocuments();
    console.log(`\n💳 Payments: Found ${paymentCount} payments`);
    await countersCollection.updateOne(
      { _id: 'payment' },
      {
        $set: {
          _id: 'payment',
          prefix: 'PAY',
          sequence: paymentCount,
          lastUpdated: new Date()
        }
      },
      { upsert: true }
    );
    console.log(`   ✅ Payment counter set to ${paymentCount} (next will be PAY${String(paymentCount + 1).padStart(6, '0')})`);
    
    // Count total quotations (they're already using QT format)
    const quotationCount = await db.collection('quotations').countDocuments();
    console.log(`\n📄 Quotations: Found ${quotationCount} quotations`);
    await countersCollection.updateOne(
      { _id: 'quotation' },
      {
        $set: {
          _id: 'quotation',
          prefix: 'QT',
          sequence: quotationCount,
          lastUpdated: new Date()
        }
      },
      { upsert: true }
    );
    console.log(`   ✅ Quotation counter set to ${quotationCount} (next will be QT${String(quotationCount + 1).padStart(6, '0')})`);
    
    // Verify
    console.log('\n🔍 Final counter values:');
    const allCounters = await countersCollection.find().toArray();
    allCounters.forEach(counter => {
      const nextNum = counter.sequence + 1;
      console.log(`   ${counter._id}: Current=${counter.sequence}, Next=${counter.prefix}${String(nextNum).padStart(6, '0')}`);
    });
    
    console.log('\n✨ Counters reset successfully!');
    
  } finally {
    await client.close();
  }
}

resetCounters();
