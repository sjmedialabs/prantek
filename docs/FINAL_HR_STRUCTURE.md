# Final HR Management Structure

## Overview
Reorganized HR management with clear separation between **User Management** (admin with dashboard access) and **Employee Management** (staff records without access).

## Navigation Structure

### Settings > HR Settings
```
HR Settings
├── User Management
│   ├── User List (/dashboard/hr/users)
│   └── User Roles (/dashboard/hr/user-roles)
└── Employee Management
    ├── Employee List (/dashboard/hr/employees)
    ├── Employee Roles (/dashboard/hr/employee-roles)
    └── Employment Type (/dashboard/hr/member-types)
```

## Module Breakdown

### 1. User Management
**Purpose:** Manage admin users who can login to dashboard

#### User List (`/dashboard/hr/users`)
- Create admin users with credentials (email + password)
- Assign user roles with permissions
- Activate/deactivate accounts
- Reset passwords
- Track last login

#### User Roles (`/dashboard/hr/user-roles`)
- Define roles with **dashboard permissions**
- Permissions control dashboard access (e.g., manage_users, view_reports)
- Assign these roles to admin users
- Examples: HR Manager, Finance Manager, Accountant

**Key Feature:** User roles have **permissions** for dashboard access control

### 2. Employee Management
**Purpose:** Manage employee records for HR purposes (NO dashboard access)

#### Employee List (`/dashboard/hr/employees`)
- Employee information (name, designation, department)
- Employment status tracking
- Salary and financial details
- **NO login credentials**
- **NO dashboard access**

#### Employee Roles (`/dashboard/hr/employee-roles`)
- Define employee designations (Executive, Manager, Director, etc.)
- **NO permissions** (simple role names only)
- Used for organizational hierarchy
- Examples: Executive, Senior Manager, Vice President

**Key Feature:** Employee roles are **designations only**, no permissions

#### Employment Type (`/dashboard/hr/member-types`)
- Define employment types
- Examples: Full-time, Part-time, Contract, Intern

## Critical Differences

| Aspect | User Roles | Employee Roles |
|--------|------------|----------------|
| **Location** | `/dashboard/hr/user-roles` | `/dashboard/hr/employee-roles` |
| **Purpose** | Dashboard access control | Job designations |
| **Has Permissions** | ✅ Yes | ❌ No |
| **Assigned To** | Admin Users | Employees |
| **Controls** | Dashboard features | Nothing (just labels) |
| **Examples** | "HR Manager" with manage_employees permission | "Senior Manager" (just a title) |

## API Endpoints

### User Management APIs
```
GET/POST /api/users - Admin user CRUD
GET/POST /api/roles - User roles with permissions (existing)
```

### Employee Management APIs
```
GET/POST /api/employees - Employee records
GET/POST /api/employee-roles - Employee roles (NEW)
GET/POST /api/employee-roles/[id] - Update/delete employee roles (NEW)
```

## Collections

### Database Collections
- `admin_users` - Admin users with credentials
- `roles` - User roles with permissions array
- `employees` - Employee records
- `employee_roles` - Employee designations (NEW)
- `member_types` - Employment types

## Usage Flow

### Setting Up User Management
1. **Create User Roles** (`/dashboard/hr/user-roles`)
   - Name: "HR Manager"
   - Permissions: [manage_employees, view_reports]
   - These roles control dashboard access

2. **Create Admin Users** (`/dashboard/hr/users`)
   - Email + Password (for login)
   - Assign a user role
   - User gets permissions from assigned role

### Setting Up Employee Management
1. **Create Employee Roles** (`/dashboard/hr/employee-roles`)
   - Name: "Senior Manager"
   - Code: "senior_manager"
   - Description: "Department management position"
   - NO permissions needed

2. **Create Employees** (`/dashboard/hr/employees`)
   - Basic info (name, email, phone)
   - Assign employee role (designation)
   - NO credentials needed

## Key Concepts

### User vs Employee
- **Users** = System administrators with dashboard login
- **Employees** = HR records without any system access

### User Roles vs Employee Roles
- **User Roles** = Permission-based roles for dashboard access
- **Employee Roles** = Simple designations for organizational structure

## Folder Structure
```
app/dashboard/hr/
├── users/              # User List page
├── user-roles/         # User Roles page (with permissions)
├── employees/          # Employee List page
├── employee-roles/     # Employee Roles page (no permissions)
├── member-types/       # Employment Types
└── roles/             # (Old page, can be removed)
```

## Migration Notes

### Changes from Previous Structure
1. **Split roles into two types:**
   - User Roles (with permissions) → `/dashboard/hr/user-roles`
   - Employee Roles (without permissions) → `/dashboard/hr/employee-roles`

2. **Nested navigation:**
   - User Management dropdown → User List + User Roles
   - Employee Management dropdown → Employee List + Employee Roles + Employment Type

3. **Removed:**
   - "Roles" from direct submenu (now split into User/Employee roles)
   - Permissions from employee roles

### What Stays the Same
- User List functionality (create, edit, delete admin users)
- Employee List functionality (manage employee records)
- Employment Type functionality (member types)

## Testing Checklist

- [ ] Navigate to Settings > HR Settings
- [ ] Expand User Management dropdown
  - [ ] Access User List
  - [ ] Access User Roles (with permissions)
- [ ] Expand Employee Management dropdown
  - [ ] Access Employee List
  - [ ] Access Employee Roles (no permissions)
  - [ ] Access Employment Type
- [ ] Create a user role with permissions
- [ ] Assign role to admin user
- [ ] Create employee role (designation only)
- [ ] Assign designation to employee
- [ ] Verify user can login, employee cannot

## Benefits

1. **Clear Separation** - Users vs Employees well differentiated
2. **Logical Grouping** - Related items grouped in dropdowns
3. **Permission Clarity** - Only user roles have permissions
4. **Scalability** - Easy to add more sub-items to each management area
5. **User-Friendly** - Clear navigation hierarchy

---

**Updated:** November 17, 2024  
**Status:** Complete  
**Collections Added:** `employee_roles`
