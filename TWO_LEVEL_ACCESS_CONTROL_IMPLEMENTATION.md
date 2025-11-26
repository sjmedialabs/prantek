# Two-Level Access Control Implementation

## Overview
This document describes the implementation of two-level access control where:
1. **Level 1**: Plan Feature Access - What features are available in the subscription plan
2. **Level 2**: Admin Permissions - What specific permissions the admin user has within those features

## Changes Made

### 1. Plan Feature Matrix Component
**File**: `components/super-admin/plan-feature-matrix.tsx`

**Problem**: 
- Hardcoded logic that made Enterprise plans always show all features as enabled
- Features were not being read from the database for Enterprise plans

**Solution**:
```typescript
// OLD CODE (Hardcoded)
const getFeatureValue = (plan: Plan, featureKey: keyof PlanFeatures): boolean => {
  if (isEnterprisePlan(plan)) {
    return true;  // ❌ Always true for Enterprise
  }
  return plan.planFeatures?.[featureKey] ?? false;
}

// NEW CODE (Database-driven)
const getFeatureValue = (plan: Plan, featureKey: keyof PlanFeatures): boolean => {
  return plan.planFeatures?.[featureKey] === true;  // ✅ Always reads from DB
}
```

**Additional Changes**:
- Removed "All Features" badge for Enterprise plans
- Removed `isEnterprise` check from Switch component disabled state
- Updated description text to remove "Enterprise plans have all features enabled by default"

### 2. Dashboard Sidebar Access Control
**File**: `components/dashboard/dashboard-sidebar.tsx`

**Problem**:
- Access checks were in wrong order (permission before plan feature)
- Not clear what the hierarchy of checks should be

**Solution**:
Reordered the checks in `renderNavItem` function:

```typescript
const renderNavItem = (item: NavItem, level: number = 0, parentKey: string = "") => {
  // LEVEL 1: Check if user has active subscription
  // Only Dashboard and Cash Book are accessible without active subscription
  if (!hasActiveSubscription(user) && item.permission !== null) {
    return null;
  }

  // LEVEL 2: Check if feature is enabled in user's subscription plan
  // Dashboard and Cash Book are always accessible (no plan check needed)
  if (planFeatures && item.name && !hasFeatureAccess(item.name) && item.name !== 'Dashboard' && item.name !== 'Cash Book') {
    return null;
  }

  // LEVEL 3: Check admin user's specific permission for this feature
  // Even if feature is in the plan, admin user must have the specific permission
  if (item.permission && !hasPermission(item.permission)) {
    return null;
  }
  
  // ... rest of rendering logic
}
```

### 3. Database Updates
**Updated Basic Plan** to include clients feature:

```javascript
db.subscription_plans.updateOne(
  { name: 'Basic' },
  { $set: { 'planFeatures.clients': true } }
)
```

## Current Plan Configuration

### Basic Plan
- ✅ Cash Book
- ✅ Clients
- ❌ All other features

### Professional, Premium, Enterprise Plans
- ✅ All features enabled

## How Access Control Works

For each menu item in the sidebar, the system performs three checks **in order**:

1. **Active Subscription Check**
   - Verifies user has `subscriptionStatus` of "active" or "trial"
   - OR user is a super-admin
   - Exception: Dashboard and Cash Book are always accessible

2. **Plan Feature Check**
   - Reads `planFeatures` from the user's subscription plan
   - Checks if the specific feature is enabled in the plan
   - Maps menu names to feature keys:
     - "Clients" → `clients`
     - "Vendors" → `vendors`
     - "Quotation" → `quotations`
     - "Receipts" → `receipts`
     - "Payments" → `payments`
     - "Reconciliation" → `reconciliation`
     - "Assets" → `assets`
     - "Reports" → `reports`
     - "Settings" → `settings`
     - "HR Settings" → `hrSettings`
   - Exception: Dashboard and Cash Book skip this check

3. **Admin Permission Check**
   - Verifies the admin user has the specific permission
   - Permissions are stored in `admin_users.permissions` array
   - Example permissions:
     - `view_clients`, `create_clients`, `edit_clients`, `delete_clients`
     - `view_quotations`, `create_quotations`, etc.
   - Exception: Items with `permission: null` skip this check

**Result**: A menu item is only visible if **ALL THREE** checks pass!

## Test Scenarios

### Scenario 1: Basic Plan + Full Admin Permissions
- **User**: satya@gmail.com
- **Plan**: Basic (cashBook + clients only)
- **Admin Permissions**: All permissions
- **Visible**: Dashboard, Cash Book, Clients
- **Hidden**: Vendors, Quotations, Receipts, Payments, Reconciliation, Assets, Reports, Settings, HR Settings
- **Why**: Plan limits features to cashBook and clients, even though admin has all permissions

### Scenario 2: Enterprise Plan + Limited Admin Permissions
- **User**: venu@sjmedialabs.com  
- **Plan**: Enterprise (all features)
- **Admin Permissions**: Only `view_clients`
- **Visible**: Dashboard, Cash Book, Clients
- **Hidden**: All other features
- **Why**: Even though plan allows all features, admin permissions limit to clients only

### Scenario 3: Enterprise Plan + Full Admin Permissions
- **User**: venu@sjmedialabs.com
- **Plan**: Enterprise (all features)
- **Admin Permissions**: All permissions
- **Visible**: All menu items
- **Hidden**: None
- **Why**: Both plan AND permissions allow full access

### Scenario 4: No Active Subscription
- **Any User** with expired/cancelled subscription
- **Visible**: Dashboard, Cash Book
- **Hidden**: All other features
- **Why**: Only Dashboard and Cash Book are accessible without active subscription

## API Endpoints

### Get Plan Features
**Endpoint**: `GET /api/user/plan-features`

Returns the `planFeatures` object for the authenticated user's subscription plan:

```json
{
  "success": true,
  "planFeatures": {
    "cashBook": true,
    "clients": true,
    "vendors": false,
    "quotations": false,
    "receipts": false,
    "payments": false,
    "reconciliation": false,
    "assets": false,
    "reports": false,
    "settings": false,
    "hrSettings": false
  }
}
```

### Get Permissions
**Endpoint**: `GET /api/permissions`

Returns the complete list of available permissions grouped by category.

### Update Plan Features
**Endpoint**: `PATCH /api/subscription-plans/features`

Super Admin can toggle individual features for each plan:

```json
{
  "planId": "690b23d84608ee2e1a71868c",
  "featureKey": "vendors",
  "enabled": true
}
```

## Files Modified

1. `components/super-admin/plan-feature-matrix.tsx`
   - Removed hardcoded Enterprise plan logic
   - Always reads features from database
   
2. `components/dashboard/dashboard-sidebar.tsx`
   - Reordered access control checks
   - Added detailed comments explaining each level
   
3. MongoDB `subscription_plans` collection
   - Updated Basic plan to enable `clients` feature

## Testing Checklist

- [ ] Login as satya@gmail.com (Basic plan)
  - [ ] Verify only Dashboard, Cash Book, and Clients are visible
  
- [ ] Login as venu@sjmedialabs.com (Enterprise plan)
  - [ ] If admin permissions are limited, verify only permitted features visible
  - [ ] If admin has all permissions, verify all features visible
  
- [ ] Access Super Admin → Subscriptions → Plan Feature Configuration
  - [ ] Verify Basic plan shows only cashBook and clients enabled
  - [ ] Verify Enterprise plan shows all features as configured in database
  - [ ] Toggle features and verify changes persist
  
- [ ] Create new admin user with limited permissions
  - [ ] Verify sidebar respects both plan features AND admin permissions

## Notes

- Dashboard and Cash Book are **always accessible** to authenticated users
- Plan features are loaded on component mount via `/api/user/plan-features`
- Admin permissions are loaded from user context during authentication
- Changes to plan features in Super Admin are immediately reflected
- Changes to admin permissions require logout/login to take effect

## Related Documents

- Plan Feature Configuration: `/app/super-admin/subscriptions/page.tsx`
- Admin User Management: `/app/dashboard/hr/users/page.tsx`
- Permission Definitions: `/app/api/permissions/route.ts`
- User Context: `/components/auth/user-context.tsx`
