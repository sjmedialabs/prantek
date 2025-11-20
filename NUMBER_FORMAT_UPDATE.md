# Document Number Format Update

## Summary
Updated the numbering system for quotations, receipts, and payments to include client/recipient identification codes.

## New Format
**Format:** `PREFIX-CC-YYYY-###`

Where:
- `PREFIX` = Document type (QT, RC, PAY)
- `CC` = First two letters of client/recipient name (uppercase)
- `YYYY` = Current year
- `###` = 3-digit sequence number (padded with zeros)

### Examples
- **Quotation:** `QT-AC-2025-001` (Acme Corp, 1st quotation)
- **Receipt:** `RC-BL-2025-042` (Blue Sky Industries, 42nd receipt)
- **Payment:** `PAY-TE-2025-399` (Tech Solutions, 399th payment)

## Previous Format
**Old Format:** `PREFIX######` (e.g., `QT000005`, `RC000001`, `PAY000399`)

## Changes Made

### 1. Counter Model (`lib/models/counter.model.ts`)
- Added `getClientCode()` method to extract 2-letter code from client/recipient names
- Updated `getNextSequence()` to accept optional `clientName` parameter
- Modified number format generation to include client code and year

### 2. MongoDB Store (`lib/mongodb-store.ts`)
- Updated `generateNextNumber()` to accept optional `clientName` parameter
- Updated `peekNextNumber()` to accept optional `clientName` parameter and generate preview with client code

### 3. API Routes
Updated the following routes to fetch and pass client/recipient information:

#### Quotations (`app/api/quotations/route.ts`)
- Fetches client name from `body.clientId`
- Passes client name to `generateNextNumber()`

#### Receipts (`app/api/receipts/route.ts`)
- Fetches client name from `body.clientId` or `body.selectedClientId`
- Passes client name to `generateNextNumber()`

#### Payments (`app/api/payments/route.ts`)
- Uses `body.recipientName` directly (payments don't have client objects)
- Passes recipient name to `generateNextNumber()`

### 4. Next-Number Preview Routes
Updated preview endpoints to accept client/recipient information:

- **Quotations:** `app/api/quotations/next-number/route.ts`
  - Accepts `clientId` query parameter
  - Fetches client name and generates preview

- **Receipts:** `app/api/receipts/next-number/route.ts`
  - Accepts `clientId` query parameter
  - Fetches client name and generates preview

- **Payments:** `app/api/payments/next-number/route.ts`
  - Accepts `recipientName` query parameter
  - Uses recipient name directly for preview

## Client Code Extraction Rules

The `getClientCode()` function:
1. Removes all non-alphabetic characters
2. Converts to uppercase
3. Takes first 2 letters
4. If name has only 1 letter, pads with 'X'
5. If name is empty/null, returns 'XX'

### Examples
- "Acme Corp" → "AC"
- "Blue Sky Industries" → "BL"
- "123 Tech Solutions" → "TE"
- "A" → "AX"
- "" (empty) → "XX"
- "Unknown" → "UN"

## Usage Notes

### For Frontend Developers
When calling the next-number preview API, pass the client/recipient information:

```typescript
// Quotations & Receipts
const response = await fetch(`/api/quotations/next-number?clientId=${clientId}`)

// Payments
const response = await fetch(`/api/payments/next-number?recipientName=${encodeURIComponent(recipientName)}`)
```

### Backward Compatibility
- Old format numbers will continue to work
- New documents will automatically use the new format
- The counter sequence continues from existing values

## Testing
All changes have been verified with:
- TypeScript compilation (no new errors)
- Logic testing with sample client names
- Format generation examples

## Date Updated
2025-11-11
