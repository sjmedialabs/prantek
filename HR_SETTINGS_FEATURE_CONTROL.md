# HR Settings Feature Control

## Change Request
HR Settings should not be available for Basic plan users, but should be available for Standard and Premium plans.

## Implementation

### 1. Added `hrSettings` to PlanFeatures
**File:** `lib/models/types.ts`

Updated the `PlanFeatures` interface to include:
```typescript
export interface PlanFeatures {
  cashBook: boolean
  clients: boolean
  vendors: boolean
  quotations: boolean
  receipts: boolean
  payments: boolean
  reconciliation: boolean
  assets: boolean
  reports: boolean
  settings: boolean
  hrSettings: boolean  // NEW
}
```

Also updated:
- `PLAN_FEATURE_KEYS` array
- `PLAN_FEATURE_LABELS` mapping

### 2. Updated Sidebar Feature Mapping
**File:** `components/dashboard/dashboard-sidebar.tsx`

Added HR Settings to the feature map:
```typescript
const featureMap: Record<string, string> = {
  'Clients': 'clients',
  'Vendors': 'vendors',
  'Quotation': 'quotations',
  'Receipts': 'receipts',
  'Payments': 'payments',
  'Reconciliation': 'reconciliation',
  'Assets': 'assets',
  'Reports': 'reports',
  'Settings': 'settings',
  'HR Settings': 'hrSettings'  // NEW
};
```

Now the sidebar will hide the entire "HR Settings" menu (including User Management and Employee Management) if `hrSettings: false` in the plan.

### 3. Updated User Plan Features API
**File:** `app/api/user/plan-features/route.ts`

Added `hrSettings` to all plan feature objects:
- Super admin: `hrSettings: true`
- No subscription: `hrSettings: false`
- Fallback default: `hrSettings: false`

### 4. Updated Initialization Script
**File:** `scripts/initialize-plan-features.js`

Updated plan initialization logic:

**Basic Plan** (free/price = 0):
```javascript
{
  cashBook: true,
  clients: false,
  vendors: false,
  quotations: false,
  receipts: false,
  payments: false,
  reconciliation: false,
  assets: false,
  reports: false,
  settings: false,
  hrSettings: false  // Not available
}
```

**Standard Plan**:
```javascript
{
  cashBook: true,
  clients: true,
  vendors: true,
  quotations: true,
  receipts: true,
  payments: true,
  reconciliation: true,
  assets: false,
  reports: true,
  settings: true,
  hrSettings: true  // Available
}
```

**Premium Plan**:
```javascript
{
  cashBook: true,
  clients: true,
  vendors: true,
  quotations: true,
  receipts: true,
  payments: true,
  reconciliation: true,
  assets: true,
  reports: true,
  settings: true,
  hrSettings: true  // Available
}
```

### 5. Updated Plans Display Page
**File:** `app/dashboard/plans/page.tsx`

Added HR Settings to the feature list display:
```typescript
if (pf.hrSettings) features.push('HR Settings')
```

## Result

### Basic Plan Users See:
- ✓ Dashboard
- ✓ Cash Book
- ✓ Plans (for upgrades)
- ✗ HR Settings (hidden)

### Standard/Premium Plan Users See:
- ✓ Dashboard
- ✓ Cash Book
- ✓ All enabled features
- ✓ HR Settings
  - User Management
    - User List
  - Employee Management
    - Employment Type
    - Employee Roles
    - Employee List

## HR Settings Menu Structure

The "HR Settings" menu in the sidebar contains:
- **User Management**
  - User List (admin user management)
- **Employee Management**
  - Employment Type
  - Employee Roles
  - Employee List

When `hrSettings: false`, the entire submenu is hidden from the sidebar.

## Testing

1. **Basic Plan User**:
   - Login with basic plan
   - Verify HR Settings menu is NOT visible
   - Verify only Dashboard and Cash Book are accessible

2. **Standard Plan User**:
   - Login with standard plan
   - Verify HR Settings menu IS visible
   - Verify all submenus are accessible

3. **Premium Plan User**:
   - Login with premium plan
   - Verify HR Settings menu IS visible
   - Verify all features including assets are accessible

## Migration

Run the initialization script to update existing plans:
```bash
node scripts/initialize-plan-features.js
```

This will set `hrSettings: false` for Basic plans and `hrSettings: true` for Standard/Premium plans.
