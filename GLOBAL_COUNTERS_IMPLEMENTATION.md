# Global Counters Implementation Summary

## Overview
Successfully implemented globally unique sequential numbering system for receipts, payments, and quotations across all subscribers in the SaaS application.

## Problems Solved

### 1. **Non-Unique Numbers Across Subscribers**
   - **Issue**: Receipt, payment, and quotation numbers were unique per user, not globally
   - **Solution**: Created a centralized counters collection with atomic operations

### 2. **Receipt Number Not Displaying**
   - **Issue**: New receipt page showed "Auto-generated" instead of the actual next number
   - **Solution**: Added API endpoints to preview next numbers before form submission

### 3. **Potential Race Conditions**
   - **Issue**: Multiple concurrent requests could generate duplicate numbers
   - **Solution**: Used MongoDB's `findOneAndUpdate` with atomic `$inc` operations

## Implementation Details

### Files Created/Modified

#### New Files
1. **`lib/models/counter.model.ts`** - Counter model with atomic operations
   - `getNextSequence()` - Atomically increments and returns next number
   - `initializeCounter()` - Initialize counter with starting value
   - `getCounter()` - Peek at current counter state

2. **`migrate-counters.js`** - Migration script to initialize counters
   - Analyzes existing data to set appropriate starting values
   - Current state after migration:
     - Receipts: RC000014 (13 existing + 1)
     - Payments: PAY000015 (14 existing + 1)
     - Quotations: QT000005 (4 existing + 1)

3. **API Endpoints for Preview**
   - `/api/receipts/next-number/route.ts`
   - `/api/payments/next-number/route.ts`
   - `/api/quotations/next-number/route.ts`

#### Modified Files
1. **`lib/db-config.ts`**
   - Added `COUNTERS` collection
   - Added index for counters collection

2. **`lib/mongodb-store.ts`**
   - Updated `generateNextNumber()` to use global counters
   - Added `peekNextNumber()` for displaying next number without incrementing

3. **`lib/api-client.ts`**
   - Added `getNextNumber()` method to receipts, payments, and quotations API

4. **Frontend Pages**
   - `app/dashboard/receipts/new/page.tsx` - Fetches and displays next receipt number
   - `app/dashboard/quotations/new/page.tsx` - Fetches and displays next quotation number

## How It Works

### Number Generation Flow
```
1. User opens "New Receipt" form
   ↓
2. Frontend calls /api/receipts/next-number
   ↓
3. Backend calls peekNextNumber() - returns current + 1 without incrementing
   ↓
4. User sees "RC000014" in the form (disabled field)
   ↓
5. User submits form
   ↓
6. Backend calls generateNextNumber()
   ↓
7. MongoDB atomically: $inc sequence, return new value
   ↓
8. Receipt saved with globally unique number
```

### Atomic Operation
```javascript
await collection.findOneAndUpdate(
  { _id: counterType },           // Find counter
  { 
    $inc: { sequence: 1 },        // Atomically increment
    $set: { lastUpdated: new Date() }
  },
  { 
    upsert: true,                 // Create if doesn't exist
    returnDocument: 'after'       // Return incremented value
  }
)
```

## Number Format

All numbers follow the format: `PREFIX + 6-digit-padded-number`

- **Receipts**: `RC000001`, `RC000002`, ..., `RC999999`
- **Payments**: `PAY000001`, `PAY000002`, ..., `PAY999999`
- **Quotations**: `QT000001`, `QT000002`, ..., `QT999999`

## Database Schema

### Counters Collection
```javascript
{
  _id: "receipt",              // Counter type (receipt/payment/quotation)
  prefix: "RC",                // Number prefix
  sequence: 13,                // Current sequence number
  lastUpdated: ISODate(...)    // Last update timestamp
}
```

## Benefits

1. **Globally Unique**: No duplicates across all users/subscribers
2. **Thread-Safe**: Atomic operations prevent race conditions
3. **Scalable**: MongoDB handles concurrent requests efficiently
4. **User-Friendly**: Users see next number before submitting
5. **Auditable**: `lastUpdated` field tracks counter usage
6. **Maintainable**: Centralized counter logic in one model

## Testing

### Verify Current State
```bash
node check-numbers.js
```

### Reset Counters (if needed)
```bash
node reset-counters.js
```

### Monitor Counter Usage
```javascript
// In MongoDB shell or Compass
db.counters.find()
```

## Important Notes

⚠️ **Do NOT** manually edit counter values in production without proper migration
⚠️ **Backup** the counters collection before any reset operations
✅ **The system is idempotent** - running migration multiple times is safe (uses $setOnInsert)

## Future Enhancements

1. Add counter analytics dashboard
2. Implement number reservation for draft documents
3. Add counter reset/rollback functionality with admin approval
4. Support custom number formats per organization
5. Add number series expiry (e.g., yearly reset with year prefix)

## Deployment Checklist

- [x] Counter model created
- [x] Migration script executed
- [x] API endpoints tested
- [x] Frontend pages updated
- [x] Application restarted
- [x] Documentation completed

## Maintenance

### Regular Checks
- Monitor counter growth rate
- Verify no gaps in sequences (optional audit script)
- Check for any duplicate numbers (should be impossible, but verify)

### Backup Strategy
```bash
# Backup counters collection
mongodump --uri="mongodb+srv://..." --collection=counters --out=backup/
```

---

**Implementation Date**: November 11, 2025  
**Status**: ✅ Complete and Deployed  
**Next Review**: Check counter values after 1 week of production use
