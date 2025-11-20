/**
 * Migration script to add userType field to existing users
 * Run with: node scripts/migrate-user-types.js
 */

const { MongoClient } = require('mongodb');

const DB_NAME = "prantek";
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";

async function migrateUserTypes() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log("Connected to MongoDB");
    
    const db = client.db(DB_NAME);
    const usersCollection = db.collection("users");
    
    // Count users before migration
    const totalUsers = await usersCollection.countDocuments({});
    console.log(`Total users in database: ${totalUsers}`);
    
    const usersWithoutType = await usersCollection.countDocuments({ 
      userType: { $exists: false } 
    });
    console.log(`Users without userType field: ${usersWithoutType}`);
    
    if (usersWithoutType === 0) {
      console.log("All users already have userType field. No migration needed.");
      return;
    }
    
    // First, handle super-admin users (they should not be counted as subscribers)
    const superAdminResult = await usersCollection.updateMany(
      { 
        role: "super-admin",
        userType: { $exists: false }
      },
      { $set: { userType: "subscriber" } } // Super-admins are technically subscribers but filtered out in UI
    );
    console.log(`\n✓ Updated ${superAdminResult.modifiedCount} super-admin users to userType: "subscriber"`);
    
    // Set userType = "subscriber" for users with subscriptionPlanId (excluding super-admins)
    const subscriberResult = await usersCollection.updateMany(
      { 
        subscriptionPlanId: { $exists: true, $ne: "" },
        role: { $ne: "super-admin" },
        userType: { $exists: false }
      },
      { $set: { userType: "subscriber" } }
    );
    console.log(`✓ Updated ${subscriberResult.modifiedCount} regular users to userType: "subscriber"`);
    
    // Set userType = "admin" for users with companyId but no subscriptionPlanId
    const adminResult = await usersCollection.updateMany(
      { 
        companyId: { $exists: true, $ne: "" },
        $or: [
          { subscriptionPlanId: { $exists: false } },
          { subscriptionPlanId: "" }
        ],
        userType: { $exists: false }
      },
      { $set: { userType: "admin" } }
    );
    console.log(`✓ Updated ${adminResult.modifiedCount} users to userType: "admin"`);
    
    // Check if there are any users still without userType
    const remainingUsers = await usersCollection.countDocuments({ 
      userType: { $exists: false } 
    });
    
    if (remainingUsers > 0) {
      console.log(`\n⚠ Warning: ${remainingUsers} users still don't have userType field`);
      console.log("These users may need manual review:");
      
      const unclassified = await usersCollection.find(
        { userType: { $exists: false } },
        { projection: { email: 1, role: 1, subscriptionPlanId: 1, companyId: 1 } }
      ).toArray();
      
      console.table(unclassified);
    } else {
      console.log("\n✓ All users have been classified successfully!");
    }
    
    // Summary
    console.log("\n=== Migration Summary ===");
    const subscribers = await usersCollection.countDocuments({ userType: "subscriber" });
    const admins = await usersCollection.countDocuments({ userType: "admin" });
    console.log(`Subscribers: ${subscribers}`);
    console.log(`Admin Users: ${admins}`);
    console.log(`Total: ${subscribers + admins}`);
    
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await client.close();
    console.log("\nDatabase connection closed");
  }
}

// Run migration
migrateUserTypes()
  .then(() => {
    console.log("\n✓ Migration completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n✗ Migration failed:", error);
    process.exit(1);
  });
