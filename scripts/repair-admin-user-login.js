const { MongoClient } = require("mongodb")
const bcrypt = require("bcryptjs")

const MONGODB_URI = process.env.MONGODB_URI
const DB_NAME = process.env.MONGODB_DB || "prantek"

async function main() {
  const emailArg = process.argv[2]
  const passwordArg = process.argv[3]

  if (!MONGODB_URI) {
    console.error("MONGODB_URI is not set")
    process.exit(1)
  }

  if (!emailArg || !passwordArg) {
    console.error("Usage: node scripts/repair-admin-user-login.js <email> <newPassword>")
    process.exit(1)
  }

  const normalizedEmail = String(emailArg).trim().toLowerCase()
  const newPasswordHash = await bcrypt.hash(String(passwordArg), 10)

  const client = new MongoClient(MONGODB_URI)
  await client.connect()

  try {
    const db = client.db(DB_NAME)
    const query = {
      $expr: {
        $eq: [{ $toLower: { $trim: { input: "$email" } } }, normalizedEmail],
      },
    }

    const now = new Date()
    const update = {
      $set: {
        email: normalizedEmail,
        password: newPasswordHash,
        isActive: true,
        updatedAt: now,
      },
    }

    // Repair in admin_users first (expected for admin-user login),
    // then users as fallback if this account exists there.
    const adminRes = await db.collection("admin_users").updateMany(query, update)
    const usersRes = await db.collection("users").updateMany(query, update)

    console.log("Repair completed")
    console.log("admin_users matched:", adminRes.matchedCount, "modified:", adminRes.modifiedCount)
    console.log("users matched:", usersRes.matchedCount, "modified:", usersRes.modifiedCount)
  } finally {
    await client.close()
  }
}

main().catch((error) => {
  console.error("Repair failed:", error)
  process.exit(1)
})
