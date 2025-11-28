# Super Admin Authentication Setup

## Overview
Implemented super admin authentication functionality to enable system-wide administrative access.

## Changes Made

### 1. Environment Variables (.env)
Added super admin credentials:
```
SUPER_ADMIN_EMAIL=superadmin@prantek.com
SUPER_ADMIN_PASSWORD=SuperAdmin@2025
```

### 2. JWT Payload Interface (lib/jwt.ts)
Added `isSuperAdmin` field to distinguish super admin users:
```typescript
isSuperAdmin?: boolean // Distinguishes super admin from other users
```

### 3. Authentication Function (lib/auth-server.ts)
Implemented `authenticateSuperAdmin()` function:
- Validates credentials against environment variables
- Case-insensitive email matching
- Plain text password comparison (for simplicity)
- Generates JWT tokens with 30-minute access token and 7-day refresh token
- Returns full permissions with "*" wildcard

## Super Admin Credentials

**Email:** superadmin@prantek.com  
**Password:** SuperAdmin@2025

## Login URL
Access super admin portal at: `/super-admin` or `/(auth)/super-admin`

## Security Notes
- Password is stored in plain text in environment variables (consider hashing for production)
- Super admin has full permissions indicated by `permissions: ["*"]`
- JWT payload includes `isSuperAdmin: true` flag
- Access token expires in 30 minutes
- Refresh token expires in 7 days

## Testing
1. Navigate to the super admin login page
2. Enter email: superadmin@prantek.com
3. Enter password: SuperAdmin@2025
4. Should redirect to `/super-admin/dashboard` on successful login
