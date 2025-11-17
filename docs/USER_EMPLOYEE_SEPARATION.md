# User and Employee Separation Implementation

## Overview
The HR application now has a clear separation between **Admin Users** (who can login to dashboard) and **Employees** (staff records without dashboard access).

## Key Concepts

### 1. Admin Users
- **Collection**: `admin_users`
- **Purpose**: Users with dashboard access and login credentials
- **Fields**:
  - `email`, `password` (authentication)
  - `name`, `phone`, `avatar`
  - `role`: "admin" or "super-admin"
  - `roleId`: Reference to Role collection
  - `permissions`: Array of permission strings
  - `isActive`: Account status
  - `lastLogin`: Last login timestamp
  - `createdAt`, `updatedAt`

### 2. Employees
- **Collection**: `employees`
- **Purpose**: Employee records for HR management (NO dashboard access)
- **Fields**:
  - `employeeNumber`: Unique identifier (EMP-YYYY-XXXX)
  - `employeeName`, `surname`
  - `designation`: Executive, Manager, Senior Manager, etc.
  - `department`, `email`, `phone`, `address`
  - `dateOfJoining`, `dateOfBirth`
  - `salary`, `bankAccountNumber`, `ifscCode`
  - `panNumber`, `aadharNumber`
  - `employmentStatus`: active, inactive, terminated, resigned
  - `createdAt`, `updatedAt`

### 3. Roles
- **Collection**: `roles`
- **Purpose**: Define dashboard permissions for admin users
- **Fields**:
  - `name`: Role name (e.g., "HR Manager", "Finance Manager")
  - `code`: Unique identifier
  - `permissions`: Array of permission strings
  - `description`
  - `isActive`

## Available Permissions

```typescript
'view_dashboard'
'manage_users'          // Manage admin users
'manage_employees'      // Manage employee records
'manage_clients'
'manage_vendors'
'manage_quotations'
'manage_receipts'
'manage_payments'
'manage_assets'
'view_reports'
'manage_settings'
'manage_roles'
```

## Authentication Flow

1. **Login**: User provides email and password
2. **Check Admin Users**: System checks `admin_users` collection first
3. **Validate**: Verify password and check `isActive` status
4. **Generate Token**: Create JWT with user info and permissions
5. **Update Last Login**: Update `lastLogin` timestamp

## API Endpoints

### Admin Users
- `GET /api/users` - List all admin users
- `POST /api/users` - Create new admin user with credentials
- `PUT /api/users` - Update admin user (including password reset)
- `DELETE /api/users` - Delete admin user

### Employees
- `GET /api/employees` - List all employees
- `POST /api/employees` - Create new employee record
- `PUT /api/employees/[id]` - Update employee record
- `DELETE /api/employees/[id]` - Delete employee record

### Roles
- `GET /api/roles` - List all roles
- `POST /api/roles` - Create new role with permissions
- `PUT /api/roles/[id]` - Update role permissions
- `DELETE /api/roles/[id]` - Delete role

## Dashboard Pages

### Admin Users Page (`/dashboard/users`)
- Create admin users with email and password
- Assign roles with permissions
- Activate/deactivate accounts
- Reset passwords
- View last login

### Employees Page (`/dashboard/settings/employee`)
- Create employee records (no credentials)
- Assign designations (Executive, Manager, etc.)
- Track employment status
- Store employee personal and financial details

## Implementation Notes

### Creating Admin Users
```typescript
const newAdminUser = {
  email: "admin@example.com",
  password: "hashedPassword",
  name: "John Doe",
  role: "admin",
  roleId: "role_id_here",
  permissions: ["view_dashboard", "manage_employees"],
  isActive: true
}
```

### Creating Employees
```typescript
const newEmployee = {
  employeeNumber: "EMP-2024-0001",
  employeeName: "Jane",
  surname: "Smith",
  designation: "Senior Manager",
  department: "Sales",
  employmentStatus: "active"
  // No email/password - cannot login
}
```

### Checking Permissions
```typescript
// In middleware or route handlers
if (user.permissions?.includes('manage_employees')) {
  // Allow access
}
```

## Migration Guide

If you have existing data:

1. **Migrate existing users with login access** to `admin_users` collection
2. **Keep employee records** in `employees` collection (remove any auth fields)
3. **Create default roles** for common positions
4. **Assign roles to admin users** based on their responsibilities

## Security Best Practices

1. **Strong Passwords**: Enforce minimum 8 characters with complexity
2. **Active Status**: Inactive users cannot login
3. **Permission Checks**: Always verify permissions before allowing actions
4. **Audit Logging**: Log all user and employee changes
5. **Password Hashing**: Use bcrypt with salt rounds of 10+

## Example Roles

### System Administrator
- All permissions

### HR Manager
- `view_dashboard`
- `manage_employees`
- `manage_users` (limited)
- `view_reports`

### Finance Manager
- `view_dashboard`
- `manage_payments`
- `manage_receipts`
- `view_reports`

### Accountant
- `view_dashboard`
- `manage_clients`
- `manage_quotations`
- `manage_receipts`

### Viewer (Read-only)
- `view_dashboard`
- `view_reports`
