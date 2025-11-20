# Employee Permissions & Credentials Feature

## Overview
This feature implements plan-based permission management and employee credential sending functionality.

## Key Features

### 1. **Plan-Based Permission Access Control**
- **Plan 1 (Basic)**: No access to role/permission management
- **Plan 2 & Plan 3**: Full access to role and permission management
- Users on Plan 1 can still create employees but cannot assign roles

### 2. **Employee Credential Management**
- Admins can send login credentials to employees with assigned roles
- Automatically generates secure temporary passwords
- Sends professional email with login instructions
- Creates user accounts for employees to access the dashboard
- Employees inherit subscription plan from their admin

## Files Created/Modified

### New Files Created:
1. **`lib/subscription-helper.ts`**
   - Helper functions to check subscription plan permissions
   - Functions:
     - `canManagePermissions(userId)`: Check if user's plan allows role management
     - `getUserSubscriptionPlan(userId)`: Get user's subscription plan details
     - `hasFeatureAccess(userId, featureName)`: Check specific feature access

2. **`app/api/employees/send-credentials/route.ts`**
   - API endpoint to send employee credentials via email
   - Creates user account with temporary password
   - Sends email with login instructions
   - Handles SMTP configuration gracefully

3. **`app/api/subscription/check-permissions/route.ts`**
   - API endpoint to check user's subscription permissions
   - Returns whether user can manage permissions based on plan

4. **`EMPLOYEE_PERMISSIONS_FEATURE.md`** (this file)
   - Feature documentation and testing guide

### Modified Files:
1. **`lib/email.ts`**
   - Added `sendEmployeeCredentials()` function
   - Sends professional email with login credentials
   - Includes temporary password and login URL

2. **`lib/api-client.ts`**
   - Added `sendCredentials(employeeId)` to employees API
   - Allows frontend to call credential sending endpoint

3. **`app/dashboard/settings/employee/page.tsx`**
   - Added plan permission checking
   - Shows/hides role selection based on subscription plan
   - Added "Send Credentials" button for each employee
   - Displays plan upgrade message for Plan 1 users
   - Validates role assignment based on plan

## How It Works

### Plan Restriction Flow:
1. User logs into admin dashboard
2. System checks user's subscription plan ID
3. Fetches plan details from database
4. If plan name contains "Plan 1", "Basic", or "Standard" → denies role management
5. If plan is "Plan 2", "Plan 3", or higher → allows role management
6. UI dynamically shows/hides role features based on permission

### Credential Sending Flow:
1. Admin creates employee with email and role (if Plan 2+)
2. Admin clicks "Send Credentials" button
3. System checks if user account exists for that email
4. If exists → Shows message that account already exists
5. If new:
   - Generates secure 10-character password (uppercase, lowercase, numbers, special chars)
   - Hashes password with bcrypt
   - Creates user account with employee's email
   - Links user to employee record
   - Assigns permissions from role
   - Sends email with credentials
6. Employee receives email with:
   - Login URL
   - Email address
   - Temporary password
   - Instructions to change password

## Email Template Features
- Professional branded design with company colors
- Clear credentials display in highlighted box
- Direct login button
- Warning to change password after first login
- Mobile-responsive HTML template

## Testing Guide

### Test Case 1: Plan 1 User Cannot Assign Roles
1. Create a test user with Plan 1 subscription
2. Log in as that user
3. Go to Settings → HR Settings → Employee Management
4. Click "Add Employee"
5. **Expected**: Role field shows alert message: "Role and permission management is not available in your current plan (Plan 1)"
6. **Expected**: Badge shows "Plan Upgrade Required"

### Test Case 2: Plan 2/3 User Can Assign Roles
1. Create/use a test user with Plan 2 or Plan 3
2. Log in as that user
3. Go to Settings → HR Settings → Employee Management
4. Click "Add Employee"
5. **Expected**: Role dropdown is visible and functional
6. **Expected**: Can select from available roles

### Test Case 3: Send Credentials - New Employee
1. Create an employee with a unique email (not in users table)
2. Assign a role to the employee
3. Save the employee
4. Click "Send Credentials" button
5. **Expected**: Success message appears
6. **Expected**: Employee receives email with credentials
7. **Expected**: Email contains temporary password
8. Check database: new user record should exist with hashed password

### Test Case 4: Send Credentials - Existing User
1. Create an employee with an email that already exists in users table
2. Click "Send Credentials" button
3. **Expected**: Message: "An account already exists for this employee"
4. **Expected**: No duplicate user created

### Test Case 5: Employee Login
1. After receiving credentials, employee opens email
2. Employee clicks "Login to Dashboard" button
3. Employee enters email and temporary password
4. **Expected**: Successfully logs in
5. **Expected**: Can access features based on assigned role permissions
6. Employee should change password in Profile Settings

### Test Case 6: SMTP Not Configured
1. Remove SMTP configuration (unset SMTP_USER and SMTP_PASS)
2. Try to send credentials
3. **Expected**: Success message with warning
4. **Expected**: Temporary password displayed in toast for manual sharing
5. **Expected**: Console logs credentials for admin to manually share

## Configuration Requirements

### Environment Variables Needed:
```bash
# SMTP Configuration (for email sending)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourcompany.com

# App Configuration
NEXT_PUBLIC_APP_NAME=Prantek
NEXT_PUBLIC_APP_URL=https://yourapp.com
```

### Database Collections Used:
- `users` - Stores user accounts and authentication
- `employees` - Stores employee details
- `roles` - Stores role definitions and permissions
- `subscription_plans` - Stores plan details and pricing

## Security Considerations

1. **Password Generation**: 
   - 10 characters minimum
   - Includes uppercase, lowercase, numbers, special characters
   - Randomly shuffled for additional security

2. **Password Storage**:
   - Hashed using bcrypt before storing
   - Never stored in plain text

3. **Email Security**:
   - Uses secure SMTP connection
   - Temporary passwords are one-time use
   - Users forced to change password after first login

4. **Plan Verification**:
   - Server-side validation prevents bypassing UI restrictions
   - API endpoints check permissions before allowing operations

## API Endpoints

### `POST /api/employees/send-credentials`
**Request Body:**
```json
{
  "employeeId": "507f1f77bcf86cd799439011"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Employee account created and credentials sent successfully",
  "emailSent": true,
  "isNewAccount": true
}
```

**Response (Email Not Configured):**
```json
{
  "success": true,
  "message": "Employee account created successfully",
  "emailSent": false,
  "tempPassword": "Abc123!@#X",
  "warning": "Email service is not configured. Please share these credentials manually."
}
```

### `GET /api/subscription/check-permissions`
**Response:**
```json
{
  "canManagePermissions": true,
  "plan": {
    "name": "Premium Plan",
    "price": 2999,
    "features": ["Role Management", "Unlimited Users", "Advanced Reports"]
  }
}
```

## Future Enhancements

1. **Password Reset Link**: Instead of sending password, send a reset link
2. **Bulk Credential Sending**: Send credentials to multiple employees at once
3. **Custom Email Templates**: Allow admins to customize email content
4. **Password Policies**: Configurable password complexity requirements
5. **2FA Support**: Add two-factor authentication for employees
6. **Audit Trail**: Log all credential sending activities
7. **Plan Feature Matrix**: UI showing what features are available in each plan

## Troubleshooting

### Issue: Email not being sent
- **Solution**: Check SMTP configuration in environment variables
- **Workaround**: System will display password in toast for manual sharing

### Issue: Employee can't login
- **Check**: Verify user account was created in users collection
- **Check**: Ensure employee is marked as active
- **Check**: Verify email address matches exactly

### Issue: Plan restrictions not working
- **Check**: User has correct subscriptionPlanId in users collection
- **Check**: Plan name in subscription_plans collection matches expected format
- **Check**: Browser cache cleared after plan changes

## Support

For questions or issues with this feature:
1. Check console logs for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure database collections have correct indexes
4. Test SMTP connection independently

---

**Feature Status**: ✅ Complete and Ready for Testing

**Version**: 1.0.0

**Last Updated**: 2025-11-12
