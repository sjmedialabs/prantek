# Plan-Based Feature Access Control

## Problem
Basic plan users were seeing all features in the sidebar even though their plan should only include Cash Book access.

## Root Cause
The sidebar was only checking if the user had an active subscription (`hasActiveSubscription`) but wasn't checking which specific features were enabled in their plan's `planFeatures`.

## Solution Implemented

### 1. Created User Plan Features API
**File:** `app/api/user/plan-features/route.ts`
**Endpoint:** `GET /api/user/plan-features`

This endpoint:
- Returns the logged-in user's plan features based on their `subscriptionPlanId`
- Checks subscription status (active, trial, cancelled but within validity)
- Returns default features (cashBook only) if no active subscription
- Super admins get all features enabled

**Response:**
```json
{
  "success": true,
  "planFeatures": {
    "cashBook": true,
    "clients": false,
    "vendors": false,
    "quotations": false,
    "receipts": false,
    "payments": false,
    "reconciliation": false,
    "assets": false,
    "reports": false,
    "settings": false
  },
  "hasActiveSubscription": true,
  "planName": "Basic Plan"
}
```

### 2. Updated Sidebar Component
**File:** `components/dashboard/dashboard-sidebar.tsx`

Changes made:
- Added `planFeatures` state to store user's plan features
- Added `useEffect` to fetch plan features on component mount
- Added `hasFeatureAccess()` function to check if a menu item's feature is enabled
- Updated `renderNavItem()` to hide menu items not included in user's plan

**Feature Mapping:**
```typescript
{
  'Clients': 'clients',
  'Vendors': 'vendors',
  'Quotation': 'quotations',
  'Receipts': 'receipts',
  'Payments': 'payments',
  'Reconciliation': 'reconciliation',
  'Assets': 'assets',
  'Reports': 'reports',
  'Settings': 'settings'
}
```

**Always Visible:**
- Dashboard (no plan restriction)
- Cash Book (included in all plans)

## How It Works

1. **User logs in** with a Basic plan
2. **Sidebar loads** and fetches `/api/user/plan-features`
3. **API checks** user's `subscriptionPlanId` and fetches plan from database
4. **Returns planFeatures** showing only `cashBook: true`, all others `false`
5. **Sidebar renders** only:
   - Dashboard
   - Cash Book
   - (Plans menu if user wants to upgrade)

6. **Premium user** sees all enabled features in their plan

## Plan Feature Configuration

Plans should be created/updated with proper `planFeatures`:

**Basic Plan:**
```json
{
  "name": "Basic",
  "price": 0,
  "planFeatures": {
    "cashBook": true,
    "clients": false,
    "vendors": false,
    "quotations": false,
    "receipts": false,
    "payments": false,
    "reconciliation": false,
    "assets": false,
    "reports": false,
    "settings": false
  }
}
```

**Standard Plan:**
```json
{
  "name": "Standard",
  "price": 999,
  "planFeatures": {
    "cashBook": true,
    "clients": true,
    "vendors": true,
    "quotations": true,
    "receipts": true,
    "payments": true,
    "reconciliation": true,
    "assets": false,
    "reports": true,
    "settings": true
  }
}
```

**Premium Plan:**
```json
{
  "name": "Premium",
  "price": 2999,
  "planFeatures": {
    "cashBook": true,
    "clients": true,
    "vendors": true,
    "quotations": true,
    "receipts": true,
    "payments": true,
    "reconciliation": true,
    "assets": true,
    "reports": true,
    "settings": true
  }
}
```

## Benefits

1. **Accurate Feature Display**: Users only see features included in their plan
2. **Clear Plan Differentiation**: Each tier shows different features
3. **Upgrade Motivation**: Users see limited features, encouraging upgrades
4. **Dynamic Control**: Features can be toggled per plan via API
5. **Server-Side Validation**: Feature access controlled at API level, not just UI

## Testing

1. Create a Basic plan user → Should only see Dashboard and Cash Book
2. Create a Standard plan user → Should see most features except Assets
3. Create a Premium plan user → Should see all features
4. Cancel a subscription → User should keep access until end date, then revert to basic
5. Verify super-admin sees all features regardless of subscription

## Related Files
- `/app/api/user/plan-features/route.ts` - Feature access API
- `/components/dashboard/dashboard-sidebar.tsx` - Sidebar with feature filtering
- `/app/api/subscription-plans/features/route.ts` - Plan feature toggle API
- `/scripts/initialize-plan-features.js` - Script to initialize plan features
