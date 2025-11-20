const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://prantek_db:Prantek123@prantek.vhvpmuu.mongodb.net/?appName=prantek';
const DB_NAME = 'prantek';

async function checkNumbers() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    
    console.log('Receipts:');
    const receipts = await db.collection('receipts').find().project({ receiptNumber: 1 }).limit(10).toArray();
    receipts.forEach(r => console.log(' ', r.receiptNumber));
    
    console.log('\nPayments:');
    const payments = await db.collection('payments').find().project({ paymentNumber: 1 }).limit(10).toArray();
    payments.forEach(p => console.log(' ', p.paymentNumber));
    
    console.log('\nQuotations:');
    const quotations = await db.collection('quotations').find().project({ quotationNumber: 1 }).limit(10).toArray();
    quotations.forEach(q => console.log(' ', q.quotationNumber));
    
  } finally {
    await client.close();
  }
}

checkNumbers();
