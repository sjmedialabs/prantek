const { MongoClient } = require("mongodb")

const MONGODB_URI = process.env.MONGODB_URI
const DB_NAME = process.env.MONGODB_DB || "prantek"

if (!MONGODB_URI) {
  console.error("MONGODB_URI is not set.")
  process.exit(1)
}

function normalizeEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : ""
}

async function normalizeCollection(db, collectionName) {
  const collection = db.collection(collectionName)
  const cursor = collection.find({}, { projection: { _id: 1, email: 1 } })

  let scanned = 0
  let updated = 0

  while (await cursor.hasNext()) {
    const doc = await cursor.next()
    scanned += 1

    const current = doc?.email
    const normalized = normalizeEmail(current)

    if (!normalized || current === normalized) continue

    await collection.updateOne(
      { _id: doc._id },
      { $set: { email: normalized, updatedAt: new Date() } },
    )
    updated += 1
  }

  return { scanned, updated }
}

async function main() {
  const client = new MongoClient(MONGODB_URI)
  await client.connect()

  try {
    const db = client.db(DB_NAME)

    const usersResult = await normalizeCollection(db, "users")
    const adminUsersResult = await normalizeCollection(db, "admin_users")

    console.log("Email normalization complete.")
    console.log("users:", usersResult)
    console.log("admin_users:", adminUsersResult)
  } finally {
    await client.close()
  }
}

main().catch((error) => {
  console.error("Failed to normalize emails:", error)
  process.exit(1)
})
