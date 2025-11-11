/**
 * Migration script to initialize counters collection
 * Run with: node migrate-counters.js
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://prantek_db:Prantek123@prantek.vhvpmuu.mongodb.net/?appName=prantek';
const DB_NAME = 'prantek';

async function extractNumber(str, prefix) {
  if (!str || !str.startsWith(prefix)) return 0;
  const numPart = str.replace(prefix, '');
  const num = parseInt(numPart, 10);
  return isNaN(num) ? 0 : num;
}

async function migrateCounters() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🚀 Starting counter migration...');
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const countersCollection = db.collection('counters');

    // Migrate receipts
    console.log('\n📝 Migrating receipt numbers...');
    const receiptsCollection = db.collection('receipts');
    const receipts = await receiptsCollection
      .find({ receiptNumber: { $regex: '^RC' } })
      .sort({ receiptNumber: -1 })
      .limit(1)
      .toArray();
    
    let maxReceiptNumber = 0;
    if (receipts.length > 0 && receipts[0].receiptNumber) {
      maxReceiptNumber = await extractNumber(receipts[0].receiptNumber, 'RC');
      console.log(`   Found max receipt number: RC${String(maxReceiptNumber).padStart(6, '0')}`);
    } else {
      console.log('   No existing receipts found, starting from 0');
    }
    
    await countersCollection.updateOne(
      { _id: 'receipt' },
      {
        $setOnInsert: {
          _id: 'receipt',
          prefix: 'RC',
          sequence: maxReceiptNumber,
          lastUpdated: new Date()
        }
      },
      { upsert: true }
    );
    console.log(`   ✅ Receipt counter initialized at ${maxReceiptNumber}`);

    // Migrate payments
    console.log('\n💳 Migrating payment numbers...');
    const paymentsCollection = db.collection('payments');
    const payments = await paymentsCollection
      .find({ paymentNumber: { $regex: '^PAY' } })
      .sort({ paymentNumber: -1 })
      .limit(1)
      .toArray();
    
    let maxPaymentNumber = 0;
    if (payments.length > 0 && payments[0].paymentNumber) {
      maxPaymentNumber = await extractNumber(payments[0].paymentNumber, 'PAY');
      console.log(`   Found max payment number: PAY${String(maxPaymentNumber).padStart(6, '0')}`);
    } else {
      console.log('   No existing payments found, starting from 0');
    }
    
    await countersCollection.updateOne(
      { _id: 'payment' },
      {
        $setOnInsert: {
          _id: 'payment',
          prefix: 'PAY',
          sequence: maxPaymentNumber,
          lastUpdated: new Date()
        }
      },
      { upsert: true }
    );
    console.log(`   ✅ Payment counter initialized at ${maxPaymentNumber}`);

    // Migrate quotations
    console.log('\n📄 Migrating quotation numbers...');
    const quotationsCollection = db.collection('quotations');
    const quotations = await quotationsCollection
      .find({ quotationNumber: { $regex: '^QT' } })
      .sort({ quotationNumber: -1 })
      .limit(1)
      .toArray();
    
    let maxQuotationNumber = 0;
    if (quotations.length > 0 && quotations[0].quotationNumber) {
      maxQuotationNumber = await extractNumber(quotations[0].quotationNumber, 'QT');
      console.log(`   Found max quotation number: QT${String(maxQuotationNumber).padStart(6, '0')}`);
    } else {
      console.log('   No existing quotations found, starting from 0');
    }
    
    await countersCollection.updateOne(
      { _id: 'quotation' },
      {
        $setOnInsert: {
          _id: 'quotation',
          prefix: 'QT',
          sequence: maxQuotationNumber,
          lastUpdated: new Date()
        }
      },
      { upsert: true }
    );
    console.log(`   ✅ Quotation counter initialized at ${maxQuotationNumber}`);

    // Verify counters
    console.log('\n🔍 Verifying counters...');
    const allCounters = await countersCollection.find().toArray();
    
    console.log('\nCurrent counter values:');
    allCounters.forEach(counter => {
      console.log(`   ${counter._id}: ${counter.prefix}${String(counter.sequence).padStart(6, '0')} (seq: ${counter.sequence})`);
    });

    console.log('\n✨ Migration completed successfully!');
    console.log('   All new receipts, payments, and quotations will use globally unique numbers.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n📡 Connection closed');
  }
}

// Run migration
migrateCounters();
