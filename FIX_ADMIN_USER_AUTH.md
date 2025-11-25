# Fix: Admin User Authentication - isAdminUser Flag

## Problem
Admin users created by admin accounts were not able to see data because the authentication system was not setting the `isAdminUser` flag in the JWT token.

## Root Cause
In `lib/auth-server.ts`, the `authenticateAdminUser` function was creating JWT tokens with:
- ✅ `companyId` (correct - points to parent admin)
- ✅ `role: "admin-user"` (correct)
- ❌ **Missing `isAdminUser: true`** (this was the bug!)

All API routes check for `user.isAdminUser && user.companyId` to determine if they should use the companyId for filtering. Without this flag, the routes were falling back to using the admin user's own userId, which had no data.

## Solution Applied
Updated `lib/auth-server.ts` to explicitly set `isAdminUser` flag:

### For Admin Users (from ADMIN_USERS collection):
```typescript
const payload: Omit<JWTPayload, "exp" | "iat"> = {
  userId: adminUser._id.toString(),
  email: adminUser.email,
  role: "admin-user",
  userType: "admin-user",
  companyId: adminUser.companyId,
  isAdminUser: true, // ✅ CRITICAL FIX: Enables access to parent's data
  permissions: adminUser.permissions || [],
  roleId: adminUser.roleId || null,
  ...subscriptionData
}
```

### For Regular Admins (from USERS collection):
```typescript
const payload: Omit<JWTPayload, "exp" | "iat"> = {
  userId: user._id.toString(),
  email: user.email,
  role: user.role || "admin",
  userType: user.userType,
  companyId: user._id.toString(), // owner is root
  isAdminUser: false, // ✅ Regular admin, not an admin-user
  permissions: user.permissions || [],
  // ... subscription data
}
```

## How It Works Now

### Login Flow for Admin User:
1. User logs in with admin-user credentials
2. `authenticateAdminUser()` finds user in ADMIN_USERS collection
3. Creates JWT with `isAdminUser: true` and `companyId: <parent_admin_id>`
4. Token is sent to client

### API Request Flow:
1. Admin user makes API request (e.g., GET /api/quotations)
2. `withAuth` middleware verifies JWT and extracts payload
3. Route handler executes:
   ```typescript
   const filterUserId = user.isAdminUser && user.companyId 
     ? user.companyId  // ✅ Uses parent admin's ID
     : user.userId     // Regular user's own ID
   ```
4. Database query uses `filterUserId` to fetch data
5. Admin user sees parent admin's data ✅

## Testing Steps
1. **Create test admin account:**
   - Login to super admin
   - Create a new admin subscriber
   - Login as that admin
   - Create some test data (quotations, clients, etc.)

2. **Create admin user:**
   - While logged in as admin, go to HR/User Management
   - Create a new admin user
   - Note the credentials

3. **Test admin user login:**
   - Logout
   - Login with admin user credentials
   - **Expected:** Should see all the test data created by parent admin
   - Check various modules: quotations, payments, clients, vendors, etc.

4. **Verify data isolation:**
   - Create another admin account (Admin B)
   - Create an admin user under Admin B
   - Login as Admin B's admin user
   - **Expected:** Should NOT see Admin A's data

## Files Modified
- `lib/auth-server.ts` - Added `isAdminUser` flag to JWT payload

## No Additional Changes Required
- All 68 API route handlers already check for `user.isAdminUser`
- JWT structure already supported the field
- Refresh token automatically carries the flag forward

## Verification
To verify the fix is working, check the JWT token payload:
```javascript
// In browser console after login:
const token = localStorage.getItem('accessToken');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('isAdminUser:', payload.isAdminUser);
console.log('companyId:', payload.companyId);
```

For admin users, you should see:
- `isAdminUser: true`
- `companyId: <parent_admin_mongodb_id>`

## Date Applied
2025-11-25
