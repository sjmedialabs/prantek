# Trial Period Testing Instructions

## Overview
Trial period expiry alerts have been implemented in the dashboard and plans page. This document explains how to test them.

## Changes Made

### 1. Dashboard Page (`app/dashboard/page.tsx`)
- ✅ Added prominent trial expiry alert card at the top of the dashboard
- ✅ Shows trial expiration date and days remaining
- ✅ Includes "Upgrade Now" button linking to plans page
- ✅ Only displays when `subscriptionStatus === 'trial'` and `trialEndsAt` is set

### 2. Plans Page (`app/dashboard/plans/page.tsx`)
- ✅ Removed hardcoded "14-Day Free Trial" badge from all plan cards
- ✅ Added "Trial Plan" badge (emerald color) for current plan when user is on trial
- ✅ Updated "Your Current Plan" card to show "(Trial Period)" when on trial
- ✅ Shows "Trial" badge instead of "Active" badge for trial users
- ✅ Displays trial expiry date with amber color for trial users

### 3. TypeScript Types (`lib/models/types.ts`)
- ✅ Enhanced `SubscriptionPlan` interface with `billingCycle` and `isActive` fields

### 4. Bug Fixes
- ✅ Fixed nested button hydration error in trial alert

## How to Test

### Option 1: Using the Test Page (Easiest)

1. Navigate to: `http://localhost:3001/dashboard/test-trial`

2. You'll see your current subscription status

3. Click one of the buttons to activate trial mode:
   - "3 Days Trial" - For urgent expiry testing
   - "7 Days Trial" - For near expiry testing  
   - "14 Days Trial" - For standard trial period

4. The page will reload automatically

5. Navigate to `/dashboard` to see the trial alert

6. Navigate to `/dashboard/plans` to see the trial indicators

### Option 2: Using API Directly

```bash
# Get your access token from browser localStorage or cookies
TOKEN="your_token_here"

# Set 14-day trial
curl -X POST http://localhost:3001/api/user/set-trial \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"days": 14}'
```

### Option 3: Database Update Script

```bash
cd /Users/alviongs/Documents/Projects/prantek-app

# Update script to set trial for users with subscription plans
MONGODB_URI="mongodb+srv://prantek_db:Prantek123@prantek.vhvpmuu.mongodb.net/?appName=prantek" \
MONGODB_DB="prantek" \
node scripts/update-user-trial.js
```

## What You Should See

### On Dashboard (`/dashboard`)
- Amber-colored alert card at the top showing:
  - "Trial Period Expiring Soon" heading
  - Expiration date
  - Days remaining
  - "Upgrade Now" button

### On Plans Page (`/dashboard/plans`)
- In "Your Current Plan" card:
  - "(Trial Period)" text in description
  - "Trial" badge (emerald color) instead of "Active"
  - "Trial expires on [date]" in amber color
  
- On plan cards:
  - "Trial Plan" badge on your current plan (if on trial)
  - No "14-Day Free Trial" badge on other plans
  - "Most Popular" badge still shows on Premium plan

## Debugging

Check the browser console for debug logs:
```
[DASHBOARD] User trial data: {
  subscriptionStatus: "trial",
  trialEndsAt: "2025-11-25T...",
  ...
}
```

## Files Created/Modified

### New Files:
- `/app/api/user/set-trial/route.ts` - API to set user to trial mode
- `/app/dashboard/test-trial/page.tsx` - Test page to activate trial
- `/scripts/update-user-trial.js` - Script to update users in bulk
- `/scripts/check-users.js` - Script to check user statuses

### Modified Files:
- `/app/dashboard/page.tsx` - Added trial alert
- `/app/dashboard/plans/page.tsx` - Updated trial indicators
- `/lib/models/types.ts` - Updated SubscriptionPlan interface

## Notes

- The trial alert only shows when BOTH conditions are met:
  1. `user.subscriptionStatus === "trial"`
  2. `user.trialEndsAt` exists and is a valid date

- New user registrations automatically get trial status if they select a plan

- Existing users need to be updated using one of the testing methods above

- The trial alert component in the layout (`components/dashboard/trial-alert.tsx`) still works but is less prominent than the dashboard card
