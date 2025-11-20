/**
 * Migration script to identify documents with legacy /uploads/ URLs
 * 
 * This script scans the database for documents that reference files in the old
 * /uploads/ path and reports them. The new system uses GridFS with /api/files/{id}.
 * 
 * Usage:
 *   npx tsx scripts/check-legacy-uploads.ts
 */

import { connectDB } from "../lib/mongodb"

async function checkLegacyUploads() {
  try {
    console.log("🔍 Checking for legacy upload URLs...")
    
    const db = await connectDB()
    
    // Collections that might have file URLs
    const collectionsToCheck = [
      { name: "company", fields: ["logo"] },
      { name: "users", fields: ["profilePicture"] },
      { name: "clients", fields: ["logo"] },
      { name: "items", fields: ["image"] },
    ]
    
    let totalFound = 0
    
    for (const { name, fields } of collectionsToCheck) {
      const collection = db.collection(name)
      
      for (const field of fields) {
        // Find documents with /uploads/ in the field
        const query = { [field]: { $regex: /^\/uploads\// } }
        const docs = await collection.find(query).toArray()
        
        if (docs.length > 0) {
          console.log(`\n📦 Collection: ${name}`)
          console.log(`   Field: ${field}`)
          console.log(`   Found: ${docs.length} document(s) with legacy URLs`)
          
          docs.forEach((doc, i) => {
            console.log(`   [${i + 1}] ${doc._id}: ${doc[field]}`)
          })
          
          totalFound += docs.length
        }
      }
    }
    
    console.log(`\n✅ Scan complete. Found ${totalFound} document(s) with legacy upload URLs.`)
    
    if (totalFound > 0) {
      console.log("\n💡 What to do:")
      console.log("   1. The new /api/uploads/[...path]/route.ts will serve these files automatically")
      console.log("   2. Users can re-upload files to use the new GridFS storage")
      console.log("   3. Old files will continue to work via backward compatibility")
    }
    
    process.exit(0)
  } catch (error) {
    console.error("❌ Error:", error)
    process.exit(1)
  }
}

checkLegacyUploads()
