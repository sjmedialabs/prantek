import { getDb } from '../mongodb'
import { COLLECTIONS } from '../db-config'
import type { Collection, Document } from 'mongodb'

export interface Counter extends Document {
  _id: string // The counter name/type (e.g., 'receipt', 'payment', 'quotation')
  prefix: string // The prefix (e.g., 'RC', 'PAY', 'QT')
  sequence: number // Current sequence number
  lastUpdated: Date
}

export class CounterModel {
  private collectionName = 'counters'

  private async getCollection(): Promise<Collection<Counter>> {
    const db = await getDb()
    return db.collection<Counter>(this.collectionName)
  }

  /**
   * Extract first two letters from client name (uppercase)
   */
  private getClientCode(clientName?: string): string {
    if (!clientName || clientName.length === 0) {
      return 'XX' // Default if no client name provided
    }
    // Remove special characters and get first two letters
    const cleaned = clientName.replace(/[^a-zA-Z]/g, '').toUpperCase()
    return cleaned.length >= 2 ? cleaned.substring(0, 2) : cleaned.padEnd(2, 'X')
  }

  /**
   * Get the next sequence number for a counter type (globally unique)
   * Uses atomic findOneAndUpdate to prevent race conditions
   * Format: PREFIX-CC-YYYY-### (e.g., PAY-AB-2025-001)
   * @param counterType - Type of counter (e.g., 'receipt', 'payment', 'quotation')
   * @param prefix - Prefix for the number (e.g., 'RC', 'PAY', 'QT')
   * @param clientName - Optional client name to extract 2-letter code from
   */
  async getNextSequence(counterType: string, prefix: string, clientName?: string): Promise<string> {
    const collection = await this.getCollection()
    const currentYear = new Date().getFullYear()
    const clientCode = this.getClientCode(clientName)
    
    const result = await collection.findOneAndUpdate(
      { _id: counterType },
      { 
        $inc: { sequence: 1 },
        $set: { lastUpdated: new Date() },
        $setOnInsert: { prefix }
      },
      { 
        upsert: true,
        returnDocument: 'after'
      }
    )

    if (!result) {
      throw new Error(`Failed to generate sequence for ${counterType}`)
    }

    const sequence = result.sequence
    return `${prefix}-${clientCode}-${currentYear}-${String(sequence).padStart(3, '0')}`
  }

  /**
   * Initialize a counter with a starting value
   */
  async initializeCounter(counterType: string, prefix: string, startingValue: number = 0): Promise<void> {
    const collection = await this.getCollection()
    
    await collection.updateOne(
      { _id: counterType },
      {
        $setOnInsert: {
          _id: counterType,
          prefix,
          sequence: startingValue,
          lastUpdated: new Date()
        }
      },
      { upsert: true }
    )
  }

  /**
   * Get current counter information
   */
  async getCounter(counterType: string): Promise<Counter | null> {
    const collection = await this.getCollection()
    return await collection.findOne({ _id: counterType })
  }

  /**
   * Reset a counter to a specific value (use with caution!)
   */
  async resetCounter(counterType: string, value: number): Promise<void> {
    const collection = await this.getCollection()
    
    await collection.updateOne(
      { _id: counterType },
      {
        $set: {
          sequence: value,
          lastUpdated: new Date()
        }
      }
    )
  }
}

export const counterModel = new CounterModel()
