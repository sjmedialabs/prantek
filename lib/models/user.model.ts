import { getDb } from "../mongodb"
import { COLLECTIONS } from "../db-config"
import type { User } from "./types"
import { ObjectId } from "mongodb"
import bcrypt from "bcryptjs"

export class UserModel {
  static async create(userData: Omit<User, "_id" | "createdAt" | "updatedAt">): Promise<User> {
    const db = await getDb()
    const collection = db.collection<User>(COLLECTIONS.USERS)

    const hashedPassword = await bcrypt.hash(userData.password, 10)

    const user: Omit<User, "_id"> = {
      ...userData,
      password: hashedPassword,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await collection.insertOne(user as User)
    return { ...user, _id: result.insertedId } as User
  }

  static async findById(id: string): Promise<User | null> {
    const db = await getDb()
    const collection = db.collection<User>(COLLECTIONS.USERS)
    return await collection.findOne({ _id: new ObjectId(id) })
  }

  static async findByEmail(email: string): Promise<User | null> {
    const db = await getDb()
    const collection = db.collection<User>(COLLECTIONS.USERS)
    return await collection.findOne({ email })
  }

  static async update(id: string, updates: Partial<User>): Promise<boolean> {
    const db = await getDb()
    const collection = db.collection<User>(COLLECTIONS.USERS)

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...updates, updatedAt: new Date() } },
    )

    return result.modifiedCount > 0
  }

  static async verifyPassword(user: User, password: string): Promise<boolean> {
    return await bcrypt.compare(password, user.password)
  }

  static async findAll(filter: any = {}, options: any = {}): Promise<User[]> {
    const db = await getDb()
    const collection = db.collection<User>(COLLECTIONS.USERS)

    const { skip = 0, limit = 100, sort = { createdAt: -1 } } = options

    return await collection.find(filter).sort(sort).skip(skip).limit(limit).toArray()
  }

  static async count(filter: any = {}): Promise<number> {
    const db = await getDb()
    const collection = db.collection<User>(COLLECTIONS.USERS)
    return await collection.countDocuments(filter)
  }
}
