# HR Module Restructuring

## Changes Made

### 1. Folder Structure
Created a dedicated HR module at `/app/dashboard/hr/` with the following pages:

- **`/dashboard/hr/users`** - User Management (Admin users with dashboard access)
- **`/dashboard/hr/roles`** - Role Management (Dashboard permission roles)
- **`/dashboard/hr/employees`** - Employee Management (Staff records without login)
- **`/dashboard/hr/member-types`** - Employment Types

### 2. Navigation Update
**Removed:** "Users" from main sidebar menu

**Added:** "HR Settings" submenu in Settings section with:
- Roles
- User Management
- Employment Type
- Employee Management

### 3. Access Structure

#### Users (Admin Users)
- **Location**: `/dashboard/hr/users`
- **Purpose**: Manage admin users who can login to dashboard
- **Features**:
  - Create users with email/password credentials
  - Assign roles with permissions
  - Activate/deactivate accounts
  - Reset passwords
  - View last login

#### Roles
- **Location**: `/dashboard/hr/roles`
- **Purpose**: Define dashboard access roles with permissions
- **Usage**: Roles created here can be assigned to admin users
- **Permissions**: Controls what admin users can access in the dashboard

#### Employees
- **Location**: `/dashboard/hr/employees`
- **Purpose**: Manage employee records for HR purposes
- **Features**:
  - Employee information (name, designation, department)
  - Employment status tracking
  - Salary and financial details
  - **NO dashboard login credentials**

#### Employment Types
- **Location**: `/dashboard/hr/member-types`
- **Purpose**: Define employment types (Full-time, Part-time, Contract, etc.)

## Key Concepts

### User vs Employee

| Aspect | Admin Users | Employees |
|--------|-------------|-----------|
| Location | `/dashboard/hr/users` | `/dashboard/hr/employees` |
| Login Access | ✅ Yes | ❌ No |
| Credentials | Email + Password | None |
| Role Assignment | Dashboard roles with permissions | Designation only |
| Purpose | System administrators | HR records |

### Role-Based Access

1. **Create Roles** at `/dashboard/hr/roles`
   - Define role name (e.g., "HR Manager", "Accountant")
   - Select permissions from available options
   - Activate the role

2. **Assign Roles** at `/dashboard/hr/users`
   - Create or edit admin user
   - Select role from dropdown
   - Permissions are automatically applied

3. **Access Control**
   - Users can only access features allowed by their role
   - Super admins have all permissions automatically
   - Inactive users cannot login

## Migration from Old Structure

### Old Paths → New Paths
- `/dashboard/users` → `/dashboard/hr/users`
- `/dashboard/roles` → `/dashboard/hr/roles`
- `/dashboard/settings/employee` → `/dashboard/hr/employees`
- `/dashboard/settings/member-types` → `/dashboard/hr/member-types`

### Sidebar Navigation
- Removed "Users" from main menu
- All HR functions now under **Settings > HR Settings**

## Available Permissions

Admin user roles can have these permissions:
- `view_dashboard` - Access dashboard
- `manage_users` - Manage admin users
- `manage_employees` - Manage employee records
- `manage_clients` - Manage clients
- `manage_vendors` - Manage vendors
- `manage_quotations` - Manage quotations
- `manage_receipts` - Manage receipts
- `manage_payments` - Manage payments
- `manage_assets` - Manage assets
- `view_reports` - View reports
- `manage_settings` - Access settings
- `manage_roles` - Manage roles

## Usage Flow

1. **Setup Roles First**
   - Go to Settings > HR Settings > Roles
   - Create roles like "HR Manager", "Finance Manager", etc.
   - Assign appropriate permissions to each role

2. **Create Admin Users**
   - Go to Settings > HR Settings > User Management
   - Click "Add Admin User"
   - Fill in name, email, password
   - Assign a role
   - User can now login with their credentials

3. **Manage Employees**
   - Go to Settings > HR Settings > Employee Management
   - Add employee records (no credentials needed)
   - Assign designations and track employment status

## Benefits of New Structure

1. **Better Organization** - All HR functions in one place
2. **Clear Separation** - Users (login) vs Employees (records)
3. **Granular Permissions** - Role-based access control
4. **Simplified Navigation** - Under Settings > HR Settings
5. **Scalability** - Easy to add more HR features

## Testing

After these changes, test:
- [ ] Navigate to Settings > HR Settings
- [ ] Access all 4 submenu items
- [ ] Create a new role with permissions
- [ ] Create an admin user with that role
- [ ] Login as that user and verify permissions
- [ ] Create employee records
- [ ] Verify employees cannot login

---

**Updated:** November 2024  
**Status:** Complete
