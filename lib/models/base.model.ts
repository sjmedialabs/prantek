import { getDb } from "../mongodb"
import { ObjectId, type Filter, type UpdateFilter } from "mongodb"
import type { BaseDocument } from "./types"

export class BaseModel<T extends BaseDocument> {
  constructor(private collectionName: string) {}

  async create(data: Omit<T, "_id" | "createdAt" | "updatedAt">): Promise<T> {
    const db = await getDb()
    const collection = db.collection<T>(this.collectionName)

    const document: Omit<T, "_id"> = {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Omit<T, "_id">

    const result = await collection.insertOne(document as T)
    return { ...document, _id: result.insertedId } as T
  }

  async findById(id: string): Promise<T | null> {
    const db = await getDb()
    const collection = db.collection<T>(this.collectionName)
    return await collection.findOne({ _id: new ObjectId(id) } as Filter<T>)
  }

  async findOne(filter: Filter<T>): Promise<T | null> {
    const db = await getDb()
    const collection = db.collection<T>(this.collectionName)
    return await collection.findOne(filter)
  }

  async findAll(
    filter: Filter<T> = {},
    options: {
      skip?: number
      limit?: number
      sort?: any
    } = {},
  ): Promise<T[]> {
    const db = await getDb()
    const collection = db.collection<T>(this.collectionName)

    const { skip = 0, limit = 100, sort = { createdAt: -1 } } = options

    return await collection.find(filter).sort(sort).skip(skip).limit(limit).toArray()
  }

  async update(id: string, updates: Partial<T>): Promise<boolean> {
    const db = await getDb()
    const collection = db.collection<T>(this.collectionName)

    const result = await collection.updateOne(
      { _id: new ObjectId(id) } as Filter<T>,
      { $set: { ...updates, updatedAt: new Date() } } as UpdateFilter<T>,
    )

    return result.modifiedCount > 0
  }

  async delete(id: string): Promise<boolean> {
    const db = await getDb()
    const collection = db.collection<T>(this.collectionName)

    const result = await collection.deleteOne({ _id: new ObjectId(id) } as Filter<T>)
    return result.deletedCount > 0
  }

  async count(filter: Filter<T> = {}): Promise<number> {
    const db = await getDb()
    const collection = db.collection<T>(this.collectionName)
    return await collection.countDocuments(filter)
  }

  async exists(filter: Filter<T>): Promise<boolean> {
    const count = await this.count(filter)
    return count > 0
  }
}
