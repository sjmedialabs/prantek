# Quick Start Guide - User & Employee Management

## Getting Started

### Step 1: Create Roles (Optional but Recommended)

1. Navigate to `/dashboard/roles`
2. Create roles with appropriate permissions:
   - **HR Manager**: manage_employees, view_reports
   - **Finance Manager**: manage_payments, manage_receipts, view_reports
   - **Accountant**: manage_clients, manage_quotations
   - **Viewer**: view_dashboard, view_reports

### Step 2: Create Your First Admin User

1. Navigate to `/dashboard/users`
2. Click "Add Admin User"
3. Fill in the form:
   - **Name**: Full name of the user
   - **Email**: Login email (must be unique)
   - **Password**: Strong password (min 8 characters)
   - **Access Level**: Admin or Super Admin
   - **Assign Role**: Select from created roles (optional)
4. Click "Create User"

**Result**: User can now login to dashboard with their email and password

### Step 3: Create Employee Records

1. Navigate to `/dashboard/settings/employee` or wherever employees are managed
2. Click "Add Employee"
3. Fill in employee details:
   - **Employee Name**: First name
   - **Surname**: Last name
   - **Designation**: Executive, Manager, Senior Manager, etc.
   - **Department**: Sales, HR, Finance, etc.
   - **Employment Status**: Active, Inactive, etc.
   - **Salary, Bank Details**: Optional financial information
4. Click "Create Employee"

**Important**: Employees CANNOT login to the dashboard. They are records only.

## Key Differences

| Feature | Admin Users | Employees |
|---------|-------------|-----------|
| Dashboard Login | ✅ Yes | ❌ No |
| Email & Password | ✅ Required | ❌ Not needed |
| Roles & Permissions | ✅ Yes | ❌ No (only designation) |
| Access Control | ✅ Based on role | ❌ No access |
| Purpose | System users | HR records |

## Testing the Setup

### Test 1: Admin User Login
1. Logout from current session
2. Go to login page
3. Login with admin user credentials
4. Verify dashboard access
5. Check that only allowed features are accessible based on role

### Test 2: Employee Cannot Login
1. Try to login with employee email (if added)
2. Should fail with "Invalid credentials"
3. Employees should not have any dashboard access

### Test 3: Role Permissions
1. Create a user with limited permissions (e.g., only view_dashboard)
2. Login as that user
3. Verify that management features are restricted
4. Try accessing restricted pages - should be blocked

## Common Tasks

### Reset Admin User Password
1. Go to `/dashboard/users`
2. Click edit on the user
3. Enter new password
4. Leave blank to keep current password
5. Click "Update User"

### Deactivate Admin User
1. Go to `/dashboard/users`
2. Click edit on the user
3. Uncheck "Active" checkbox
4. Click "Update User"
5. User can no longer login

### Update Employee Information
1. Go to employee management page
2. Find and edit the employee
3. Update designation, salary, or other details
4. Save changes

### Assign Role to Existing User
1. Go to `/dashboard/users`
2. Edit the user
3. Select a role from "Assign Role" dropdown
4. Click "Update User"
5. Permissions are updated immediately

## Security Notes

1. **Password Requirements**: Minimum 8 characters recommended
2. **Inactive Users**: Cannot login even with correct password
3. **Super Admin**: Has all permissions regardless of role
4. **Regular Admin**: Limited by assigned role permissions
5. **Audit Logs**: All user/employee changes are logged

## Troubleshooting

### Cannot Create Admin User
- Check if email already exists
- Verify all required fields are filled
- Ensure password meets requirements

### Admin User Cannot Login
- Verify account is Active
- Check password is correct
- Ensure user exists in admin_users collection

### Employee Can See Login Page
- This is normal - employees see login page
- They just cannot login (no credentials)
- Only admin users can authenticate

## Next Steps

1. ✅ Create roles for your organization
2. ✅ Create admin users for team members who need dashboard access
3. ✅ Create employee records for HR purposes
4. ✅ Test login with different users
5. ✅ Verify permission restrictions work
6. ✅ Setup regular backup of admin_users collection

## Support

For detailed documentation, see:
- `docs/USER_EMPLOYEE_SEPARATION.md` - Complete technical documentation
- `lib/models/types.ts` - Data structure definitions
- `lib/db-config.ts` - Database collections

## API Endpoints Reference

**Admin Users**:
- GET `/api/users` - List all admin users
- POST `/api/users` - Create admin user
- PUT `/api/users` - Update admin user
- DELETE `/api/users` - Delete admin user

**Employees**:
- GET `/api/employees` - List all employees
- POST `/api/employees` - Create employee
- PUT `/api/employees/[id]` - Update employee
- DELETE `/api/employees/[id]` - Delete employee

**Roles**:
- GET `/api/roles` - List all roles
- POST `/api/roles` - Create role
- PUT `/api/roles/[id]` - Update role
- DELETE `/api/roles/[id]` - Delete role
