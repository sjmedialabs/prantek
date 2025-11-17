# Tenant-Aware Data Filtering Fix

## Problem
When admin users (created under a tenant account with permissions) logged in, they were unable to see any data (receipts, payments, quotations, clients, etc.) that belonged to the parent tenant account. The data was showing as empty even though they had the proper permissions assigned.

## Root Cause
The API routes were filtering data by `user.userId` (the admin user's own ID) instead of `user.companyId` (the parent tenant account ID). 

When an admin user is created:
- They have their own `userId` 
- They have a `companyId` that points to the parent account owner
- All business data (receipts, payments, clients, etc.) is stored with the parent account's `userId`
- The `isAdminUser` flag is set to `true` in the JWT token

## Solution
Updated all API routes to use tenant-aware filtering:

```typescript
// For admin users, filter by companyId (parent account)
// For regular users, filter by userId (their own account)
const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId
```

This ensures:
- Admin users see data belonging to their parent tenant account
- Regular account owners see their own data
- Data isolation is maintained between different tenants

## Files Updated

### Core Business Data Routes
1. `/app/api/receipts/route.ts` - Receipts listing and creation
2. `/app/api/payments/route.ts` - Payments listing and creation
3. `/app/api/quotations/route.ts` - Quotations listing and creation
4. `/app/api/clients/route.ts` - Clients listing and creation

### Settings & Configuration Routes
5. `/app/api/items/route.ts` - Items/products management
6. `/app/api/vendors/route.ts` - Vendors management
7. `/app/api/bank-accounts/route.ts` - Bank accounts management
8. `/app/api/payment-methods/route.ts` - Payment methods configuration
9. `/app/api/payment-categories/route.ts` - Payment categories configuration
10. `/app/api/receipt-categories/route.ts` - Receipt categories configuration
11. `/app/api/recipient-types/route.ts` - Recipient types configuration
12. `/app/api/member-types/route.ts` - Member types configuration
13. `/app/api/tax-rates/route.ts` - Tax rates configuration

## Authentication Flow
The JWT token generated during login (in `/lib/auth-server.ts`) includes:
- `userId` - The admin user's ID
- `companyId` - The parent account ID (when `isAdminUser` is true)
- `isAdminUser` - Boolean flag indicating if user is an admin
- `permissions` - Array of permissions assigned to the admin user

## Testing
After these changes:
1. Admin users should see all tenant data when they log in
2. They can create new records that are properly associated with the tenant
3. Regular account owners continue to see only their own data
4. Data isolation between different tenants is maintained

## Notes
- Backup files were created with `.backup` extension for all modified routes
- The `assets` route needs authentication middleware update (currently accepts userId from frontend)
- Individual item routes (GET/PUT/DELETE by ID) may need similar updates
