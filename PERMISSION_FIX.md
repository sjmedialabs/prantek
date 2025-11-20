# Admin User Permission Enforcement Fix

## Problem
Admin users created via HR User Management were showing all menu items and had full access to all features, regardless of the permissions assigned to them during creation.

## Root Cause
1. Authentication system was checking `ADMIN_USERS` collection, but all users are in `USERS` collection
2. `isAdminUser` flag was not being properly set
3. When `isAdminUser` was false/undefined, all permissions were granted

## Changes Made

### 1. Authentication Server (lib/auth-server.ts)
- Updated `authenticateAdminUser()` to query `USERS` collection with `userType: "admin"` filter
- Updated `authenticate()` to query `USERS` collection with `userType: "subscriber"` filter
- Both functions now use the `userType` field to distinguish user types

### 2. Auth Verify Endpoint (app/api/auth/verify/route.ts)
- Now queries only `USERS` collection
- Sets `isAdminUser` based on `user.userType === "admin"`
- Properly identifies admin users for permission enforcement

### 3. Permission Check (components/auth/user-context.tsx)
Existing logic already correct:
- Super-admin: Full access
- isAdminUser = false (subscribers): Full access
- isAdminUser = true (admin users): Check permissions array

## How It Works Now

### Subscriber Users (Account Owners)
1. Login with userType: "subscriber"
2. isAdminUser: false in token
3. hasPermission() returns true for everything
4. Result: Full dashboard access

### Admin Users (Created via HR)
1. Login with userType: "admin"
2. isAdminUser: true + permissions array in token
3. hasPermission() checks permissions array
4. Sidebar filters menu items
5. Result: Only granted permissions accessible

## Testing

1. Run migration: `node /www/wwwroot/prantek/scripts/migrate-user-types.js`
2. Login as subscriber → Full access
3. Create admin user with limited permissions
4. Login as admin → Only see granted menu items
5. Try accessing restricted URL → Should be blocked

## Files Modified
- lib/auth-server.ts
- app/api/auth/verify/route.ts
- app/api/users/route.ts (already done - sets userType: "admin")
- app/api/auth/register/route.ts (already done - sets userType: "subscriber")
