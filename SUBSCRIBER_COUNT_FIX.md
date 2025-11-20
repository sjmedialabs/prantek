# Subscriber Count Implementation

## Overview
Implemented a `userType` field to distinguish between subscription account owners and admin users created within those accounts. This ensures that only actual subscribers are counted in the super admin dashboard, not admin users who inherit the client admin's subscription.

## Changes Made

### 1. Type Definitions (`lib/models/types.ts`)
- Added `userType?: "subscriber" | "admin"` field to both `User` and `AdminUser` interfaces
- Updated `User` interface role field to include `"admin"`: `role: "user" | "admin" | "super-admin"`

### 2. User Registration (`app/api/auth/register/route.ts`)
- Set `userType: "subscriber"` for all newly registered users
- These are account owners with subscriptions

### 3. Admin User Creation (`app/api/users/route.ts`)
- Set `userType: "admin"` for admin users created via HR management
- These users inherit the parent account's subscription

### 4. Super Admin Dashboard (`app/super-admin/dashboard/page.tsx`)
Updated all counting logic to filter by `userType === "subscriber"`:
- **Active Clients**: Changed from filtering by `role === "admin"` to `userType === "subscriber"`
- **Total Subscribers**: Changed from `users.slice(1).filter(user => user.subscriptionPlanId)` to `users.filter(user => user.userType === "subscriber" && user.subscriptionPlanId)`
- **Revenue Calculation**: Now only counts revenue from subscriber-type users

### 5. Super Admin Clients Page (`app/super-admin/clients/page.tsx`)
- Updated client listing to filter by `userType === "subscriber"` instead of `role === "admin"`
- Updated comment to reflect "Only subscriber users are clients"

### 6. Super Admin Subscriptions Page (`app/super-admin/subscriptions/page.tsx`)
- Updated subscriber counting in `loadPlans()` function to use `userType === "subscriber"`
- Updated `calculateTotalRevenue()` to only count subscribers
- Updated chart calculations to filter by `userType === "subscriber"`
- Updated `totalSubscribers` calculation

### 7. Super Admin Sales Page (`app/super-admin/sales/page.tsx`)
- Updated user filtering from `role === "admin"` to `userType === "subscriber"`
- Ensures metrics accurately reflect actual subscribers

## Data Migration Note

### For Existing Data
Existing users in the database do not have the `userType` field. To handle this:

**Option 1: Backward Compatibility (Current Implementation)**
The current code uses optional chaining (`userType?`), so existing users without this field will:
- Not be counted if they rely on the new filter
- Need data migration for accurate counts

**Option 2: Migration Script (Recommended)**
Create a migration script to set `userType` for existing users:

```javascript
// Migration script to add userType to existing users
const { connectDB } = require('./lib/mongodb');
const { Collections } = require('./lib/db-config');

async function migrateUserTypes() {
  const db = await connectDB();
  
  // Set userType = "subscriber" for users with subscriptionPlanId
  await db.collection(Collections.USERS).updateMany(
    { subscriptionPlanId: { $exists: true, $ne: "" } },
    { $set: { userType: "subscriber" } }
  );
  
  // Set userType = "admin" for users with companyId and no subscriptionPlanId
  await db.collection(Collections.USERS).updateMany(
    { 
      companyId: { $exists: true, $ne: "" },
      subscriptionPlanId: { $or: [{ $exists: false }, { $eq: "" }] }
    },
    { $set: { userType: "admin" } }
  );
  
  console.log("Migration complete");
}

migrateUserTypes();
```

**Option 3: Fallback Logic**
Update filtering logic to handle missing `userType`:

```typescript
// Filter for subscribers with fallback
users.filter(user => 
  user.userType === "subscriber" || 
  (!user.userType && user.subscriptionPlanId) // Fallback for old data
)

// Filter for admin users with fallback
users.filter(user => 
  user.userType === "admin" || 
  (!user.userType && user.companyId && !user.subscriptionPlanId) // Fallback
)
```

## Testing Checklist

- [ ] Register a new user with a subscription plan - should be marked as `userType: "subscriber"`
- [ ] Create an admin user from HR management - should be marked as `userType: "admin"`
- [ ] Verify super admin dashboard shows correct subscriber count (excluding admin users)
- [ ] Verify super admin clients page only shows subscriber accounts
- [ ] Verify super admin subscriptions page counts only subscribers
- [ ] Verify revenue calculations exclude admin users
- [ ] Run migration script for existing data (if applicable)

## Benefits

1. **Accurate Metrics**: Super admin now sees true subscriber count, not inflated by admin users
2. **Clear Separation**: Explicit distinction between account owners and admin users
3. **Scalability**: Easy to add more user types in the future if needed
4. **Data Integrity**: Ensures subscription-related metrics reflect actual paying customers

## Update: Super-Admin Exclusion

### Additional Change
All super admin pages now explicitly exclude users with `role === "super-admin"` from subscriber counts and lists. This ensures that the super-admin account itself is never shown in subscriber metrics.

### Updated Filter Logic
All subscriber filters now use:
```typescript
user.userType === "subscriber" && user.role !== "super-admin"
```

This ensures:
- Only actual subscriber accounts are counted
- Admin users created within companies are excluded
- The super-admin account itself is excluded from all subscriber metrics

### Files Updated (Additional)
- All super admin dashboard pages now filter out super-admin role
- Migration script updated to handle super-admin users appropriately

### Expected Behavior
- Super admin dashboard: Shows only actual paying subscriber accounts
- Clients page: Shows only subscriber accounts (no admin users, no super-admin)
- Subscriptions page: Counts only subscribers (no admin users, no super-admin)
- Sales page: Metrics reflect only actual subscribers
