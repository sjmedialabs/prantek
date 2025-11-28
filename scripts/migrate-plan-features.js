#!/usr/bin/env node

const { MongoClient } = require('mongodb')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017'
const DB_NAME = 'prantek'
const COLLECTION_NAME = 'subscription_plans'

const PLAN_TIERS = {
  basic: {
    cashBook: true,
    clients: true,
    vendors: false,
    quotations: true,
    receipts: true,
    payments: false,
    reconciliation: false,
    assets: false,
    reports: false,
    settings: true,
  },
  standard: {
    cashBook: true,
    clients: true,
    vendors: true,
    quotations: true,
    receipts: true,
    payments: true,
    reconciliation: true,
    assets: true,
    reports: true,
    settings: true,
  },
  premium: {
    cashBook: true,
    clients: true,
    vendors: true,
    quotations: true,
    receipts: true,
    payments: true,
    reconciliation: true,
    assets: true,
    reports: true,
    settings: true,
  },
}

function determinePlanTier(plan) {
  const planName = (plan.name || '').toLowerCase()
  const price = plan.price || 0

  if (planName.includes('basic') || planName.includes('plan 1')) {
    return 'basic'
  } else if (planName.includes('premium') || planName.includes('enterprise') || planName.includes('plan 3')) {
    return 'premium'
  } else if (planName.includes('standard') || planName.includes('pro') || planName.includes('plan 2') || planName.includes('professional')) {
    return 'standard'
  }

  if (price === 0) {
    return 'basic'
  } else if (price <= 500) {
    return 'basic'
  } else if (price <= 1500) {
    return 'standard'
  } else {
    return 'premium'
  }
}

async function migratePlanFeatures() {
  const client = new MongoClient(MONGODB_URI)

  try {
    console.log('🚀 Starting migration: Initialize planFeatures for subscription plans')
    console.log('📡 Connecting to MongoDB...')
    
    await client.connect()
    console.log('✅ Connected to MongoDB')

    const db = client.db(DB_NAME)
    const collection = db.collection(COLLECTION_NAME)

    const plans = await collection.find({}).toArray()
    console.log(`📊 Found ${plans.length} subscription plans`)

    if (plans.length === 0) {
      console.log('⚠️  No plans found. Nothing to migrate.')
      return
    }

    let updatedCount = 0
    let skippedCount = 0

    for (const plan of plans) {
      const planId = plan._id
      const planName = plan.name

      if (plan.planFeatures && typeof plan.planFeatures === 'object') {
        console.log(`⏭️  Skipping "${planName}" - planFeatures already exists`)
        skippedCount++
        continue
      }

      const tier = determinePlanTier(plan)
      const planFeatures = PLAN_TIERS[tier]

      console.log(`📝 Updating "${planName}" (${tier} tier)...`)

      await collection.updateOne(
        { _id: planId },
        {
          $set: {
            planFeatures: planFeatures,
            updatedAt: new Date(),
          },
        }
      )

      console.log(`✅ Updated "${planName}" with ${tier} tier features`)
      updatedCount++
    }

    console.log('\n📊 Migration Summary:')
    console.log(`   Total plans: ${plans.length}`)
    console.log(`   Updated: ${updatedCount}`)
    console.log(`   Skipped: ${skippedCount}`)
    console.log('\n✨ Migration completed successfully!')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await client.close()
    console.log('👋 MongoDB connection closed')
  }
}

migratePlanFeatures()
  .then(() => {
    console.log('✅ Script execution completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script execution failed:', error)
    process.exit(1)
  })
