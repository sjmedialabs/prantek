/**
 * Migration script to initialize counters collection with current max values
 * This ensures existing receipt/payment/quotation numbers are respected
 * 
 * Run this script once after deploying the counter system:
 * npx ts-node lib/migrate-counters.ts
 */

import { getDb } from './mongodb'
import { counterModel } from './models/counter.model'
import { COLLECTIONS } from './db-config'

interface DocumentWithNumber {
  receiptNumber?: string
  paymentNumber?: string
  quotationNumber?: string
}

async function extractNumber(str: string, prefix: string): Promise<number> {
  if (!str || !str.startsWith(prefix)) return 0
  const numPart = str.replace(prefix, '')
  const num = parseInt(numPart, 10)
  return isNaN(num) ? 0 : num
}

async function migrateCounters() {
  try {
    console.log('🚀 Starting counter migration...')
    const db = await getDb()

    // Migrate receipts
    console.log('\n📝 Migrating receipt numbers...')
    const receiptsCollection = db.collection<DocumentWithNumber>(COLLECTIONS.RECEIPTS)
    const receipts = await receiptsCollection
      .find({ receiptNumber: { $regex: '^RC' } })
      .sort({ receiptNumber: -1 })
      .limit(1)
      .toArray()
    
    let maxReceiptNumber = 0
    if (receipts.length > 0 && receipts[0].receiptNumber) {
      maxReceiptNumber = await extractNumber(receipts[0].receiptNumber, 'RC')
      console.log(`   Found max receipt number: RC${String(maxReceiptNumber).padStart(6, '0')}`)
    } else {
      console.log('   No existing receipts found, starting from 0')
    }
    
    await counterModel.initializeCounter('receipt', 'RC', maxReceiptNumber)
    console.log(`   ✅ Receipt counter initialized at ${maxReceiptNumber}`)

    // Migrate payments
    console.log('\n💳 Migrating payment numbers...')
    const paymentsCollection = db.collection<DocumentWithNumber>(COLLECTIONS.PAYMENTS)
    const payments = await paymentsCollection
      .find({ paymentNumber: { $regex: '^PAY' } })
      .sort({ paymentNumber: -1 })
      .limit(1)
      .toArray()
    
    let maxPaymentNumber = 0
    if (payments.length > 0 && payments[0].paymentNumber) {
      maxPaymentNumber = await extractNumber(payments[0].paymentNumber, 'PAY')
      console.log(`   Found max payment number: PAY${String(maxPaymentNumber).padStart(6, '0')}`)
    } else {
      console.log('   No existing payments found, starting from 0')
    }
    
    await counterModel.initializeCounter('payment', 'PAY', maxPaymentNumber)
    console.log(`   ✅ Payment counter initialized at ${maxPaymentNumber}`)

    // Migrate quotations
    console.log('\n📄 Migrating quotation numbers...')
    const quotationsCollection = db.collection<DocumentWithNumber>(COLLECTIONS.QUOTATIONS)
    const quotations = await quotationsCollection
      .find({ quotationNumber: { $regex: '^QT' } })
      .sort({ quotationNumber: -1 })
      .limit(1)
      .toArray()
    
    let maxQuotationNumber = 0
    if (quotations.length > 0 && quotations[0].quotationNumber) {
      maxQuotationNumber = await extractNumber(quotations[0].quotationNumber, 'QT')
      console.log(`   Found max quotation number: QT${String(maxQuotationNumber).padStart(6, '0')}`)
    } else {
      console.log('   No existing quotations found, starting from 0')
    }
    
    await counterModel.initializeCounter('quotation', 'QT', maxQuotationNumber)
    console.log(`   ✅ Quotation counter initialized at ${maxQuotationNumber}`)

    // Verify counters
    console.log('\n🔍 Verifying counters...')
    const countersCollection = db.collection('counters')
    const allCounters = await countersCollection.find().toArray()
    
    console.log('\nCurrent counter values:')
    allCounters.forEach(counter => {
      console.log(`   ${counter._id}: ${counter.prefix}${String(counter.sequence).padStart(6, '0')} (seq: ${counter.sequence})`)
    })

    console.log('\n✨ Migration completed successfully!')
    console.log('   All new receipts, payments, and quotations will use globally unique numbers.')
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

// Run migration
migrateCounters()
