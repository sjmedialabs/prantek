/**
 * Migration script to add phone index to users collection
 * Run this script once to optimize phone validation queries
 * 
 * Usage:
 * 1. Set your MongoDB connection string in .env.local:
 *    MONGODB_URI=your_mongodb_connection_string
 * 2. Run: node scripts/add-phone-index.js
 * 
 * Or run directly from MongoDB shell:
 * db.users.createIndex({ phone: 1 }, { background: true, sparse: true })
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Read .env or .env.local file manually
const envLocalPath = path.join(__dirname, '..', '.env.local');
const envPath = path.join(__dirname, '..', '.env');
let MONGODB_URI = process.env.MONGODB_URI;
let DB_NAME = process.env.MONGODB_DB || 'saas_platform';

const envFileToUse = fs.existsSync(envLocalPath) ? envLocalPath : envPath;

if (fs.existsSync(envFileToUse)) {
  const envContent = fs.readFileSync(envFileToUse, 'utf8');
  const lines = envContent.split('\n');
  lines.forEach(line => {
    const match = line.match(/^MONGODB_URI=(.+)$/);
    if (match) MONGODB_URI = match[1].trim();
    const dbMatch = line.match(/^MONGODB_DB=(.+)$/);
    if (dbMatch) DB_NAME = dbMatch[1].trim();
  });
}

if (!MONGODB_URI) {
  console.error('❌ Error: MONGODB_URI not found');
  console.log('Please set MONGODB_URI in your .env.local file or as an environment variable');
  process.exit(1);
}

async function addPhoneIndex() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('Connecting to database...');
    await client.connect();
    
    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');
    
    console.log('Adding phone index to users collection...');
    
    // Create index on phone field for faster lookups
    await usersCollection.createIndex(
      { phone: 1 },
      { 
        background: true,
        sparse: true // Sparse index since phone is optional
      }
    );
    
    console.log('✅ Phone index added successfully!');
    
    // List all indexes for verification
    const indexes = await usersCollection.indexes();
    console.log('\nCurrent indexes on users collection:');
    indexes.forEach((index) => {
      console.log(`  - ${JSON.stringify(index.key)}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding phone index:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

addPhoneIndex();
