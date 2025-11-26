# Dynamic Permissions Implementation

## Overview
Converted hardcoded permissions to dynamic API-based permissions system.

## Changes Made

### 1. New API Endpoint
**File:** `app/api/permissions/route.ts`

Created a new API endpoint that serves all available permissions in the system:
- **URL:** `GET /api/permissions`
- **Authentication:** Required (admin/super-admin only)
- **Response Format:**
  ```json
  {
    "success": true,
    "permissions": [...],
    "groupedPermissions": {
      "Clients & Vendors": [...],
      "Quotations": [...],
      ...
    }
  }
  ```

### 2. Permission Structure
Each permission includes:
- `id`: Unique identifier (e.g., "view_clients")
- `label`: Display name (e.g., "View Clients & Vendors")
- `category`: Grouping category
- `description`: Brief description of the permission

### 3. Available Permissions

#### Clients & Vendors
- view_clients - View client and vendor information
- create_clients - Add new clients and vendors
- edit_clients - Modify client and vendor information
- delete_clients - Remove clients and vendors

#### Quotations
- view_quotations - View quotation records
- create_quotations - Create new quotations
- edit_quotations - Modify existing quotations
- delete_quotations - Remove quotations

#### Receipts
- view_receipts - View receipt records
- create_receipts - Create new receipts
- edit_receipts - Modify existing receipts
- delete_receipts - Remove receipts

#### Payments
- view_payments - View payment records
- create_payments - Create new payments
- edit_payments - Modify existing payments
- delete_payments - Remove payments

#### Reconciliation
- view_reconciliation - View reconciliation records
- manage_reconciliation - Perform reconciliation operations

#### Assets
- view_assets - View asset information
- manage_assets - Create, edit, and delete assets

#### Reports
- view_reports - Access and view reports
- export_reports - Export reports to various formats

#### Settings & Administration
- tenant_settings - Manage tenant configuration and settings
- manage_users - Create, edit, and delete admin users

### 4. Frontend Updates
**File:** `app/dashboard/hr/users/page.tsx`

- Removed hardcoded `AVAILABLE_PERMISSIONS` constant
- Added `availablePermissions` state
- Added `fetchPermissions()` function to fetch from API
- Updated all references to use dynamic `availablePermissions`

### 5. Benefits

1. **Centralized Management**: All permissions defined in one place (API)
2. **Easy Updates**: Add/remove/modify permissions without frontend changes
3. **Consistency**: Same permissions list across all admin interfaces
4. **Scalability**: Easy to extend with new modules and permissions
5. **Future-Ready**: Can be moved to database for UI-based permission management

### 6. Future Enhancements

Potential improvements:
- Store permissions in database for UI-based management
- Add permission hierarchy/dependencies
- Add role templates based on permission sets
- Add permission usage tracking and analytics
- Support for custom/tenant-specific permissions

## Usage

### Fetching Permissions
```typescript
const response = await fetch("/api/permissions")
const data = await response.json()
if (data.success) {
  const permissions = data.permissions
  const grouped = data.groupedPermissions
}
```

### Adding New Permissions
Edit `app/api/permissions/route.ts` and add to the `SYSTEM_PERMISSIONS` array:
```typescript
{
  id: "new_permission_id",
  label: "Permission Display Name",
  category: "Module Name",
  description: "What this permission allows"
}
```

The frontend will automatically pick up the new permission.
