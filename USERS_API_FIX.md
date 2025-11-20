# Users API Route Fix

## Problem
The HR Users page (`/dashboard/hr/users`) was showing errors when trying to update users:
- `PUT http://31.97.224.169:9080/api/users 405 (Method Not Allowed)`
- `SyntaxError: Unexpected end of JSON input`

## Root Causes

1. **Missing PUT Handler**: The `/api/users/route.ts` only had GET and POST handlers, but the frontend was calling PUT to update users.

2. **Wrong Collection**: The `/api/users/[id]/route.ts` was using the `USERS` collection instead of `ADMIN_USERS` collection for admin users.

3. **Missing Authentication**: The `/api/users/[id]/route.ts` didn't have authentication middleware.

## Solutions Applied

### 1. Added PUT Handler to `/api/users/route.ts`
- Added a `PUT` handler that accepts `_id` in the request body
- Hashes passwords if being updated
- Updates role permissions from the roles collection when roleId changes
- Uses the `ADMIN_USERS` collection
- Returns the updated user without password

### 2. Fixed `/api/users/[id]/route.ts`
- Changed from `USERS` collection to `ADMIN_USERS` collection
- Added `withAuth` middleware to all handlers (GET, PUT, DELETE)
- Added role permission syncing when roleId is updated
- Properly handles the `none` roleId case by clearing permissions

### 3. Maintained Consistency
- Both routes now properly work with admin users
- Password hashing is consistent
- Role permission syncing is implemented in both PUT handlers
- Authentication is enforced on all endpoints

## Files Modified

1. `/app/api/users/route.ts` - Added PUT handler
   - Backup: `/app/api/users/route.ts.backup2`

2. `/app/api/users/[id]/route.ts` - Fixed collection and added auth
   - Backup: `/app/api/users/[id]/route.ts.backup`

## Testing

After these changes:
1. Admin users can be created via POST to `/api/users`
2. Admin users can be updated via PUT to `/api/users` (with _id in body)
3. Admin users can be updated via PUT to `/api/users/[id]`
4. Admin users can be deleted via DELETE to `/api/users/[id]`
5. All operations properly use the `ADMIN_USERS` collection
6. Role permissions are automatically synced when roleId changes
7. Passwords are properly hashed when updated
8. All endpoints are protected by authentication middleware

## Frontend Compatibility

The HR Users page calls:
- `GET /api/users` - List all admin users ✓
- `POST /api/users` - Create new admin user ✓
- `PUT /api/users` - Update admin user (with _id in body) ✓ FIXED
- `DELETE /api/users?id={userId}` - Delete admin user (Note: should use /api/users/[id])

The update operation now works correctly with the added PUT handler.
