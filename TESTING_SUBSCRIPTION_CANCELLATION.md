# Testing Guide - Subscription Cancellation

## Quick Test Steps

### 1. Test Cancellation (User Retains Access Until End Date)

1. **Login** to beta.skcmines.com as a user with an active subscription
2. **Navigate** to Profile page
3. **Note** the subscription end date displayed
4. **Click** "Cancel Plan" button
5. **Verify** success message: "Subscription cancelled. You can use your plan until the end date."
6. **Check** that all features are still accessible:
   - Dashboard ✓
   - Cashbook ✓
   - Clients ✓
   - Quotations ✓
   - Receipts ✓
   - Payments ✓
   - Settings ✓
   - etc.

### 2. Test Access After End Date (Restricted Access)

**Option A: Wait for end date to pass naturally**
**Option B: Manually update end date in database (faster)**

#### Option B Steps:
```bash
# Connect to MongoDB
mongosh

# Switch to your database
use your_database_name

# Find your user
db.users.findOne({ email: "test@example.com" })

# Update end date to past date
db.users.updateOne(
  { email: "test@example.com" },
  { 
    $set: { 
      subscriptionEndDate: new Date("2024-01-01"),
      subscriptionStatus: "cancelled"
    }
  }
)
```

Then:
1. **Refresh** the page or logout/login
2. **Verify** only Dashboard and Cashbook are visible in sidebar
3. **Try to access** other pages directly (e.g., /dashboard/clients)
4. **Verify** subscription prompt appears with:
   - Lock icon
   - Message: "This feature requires an active subscription plan..."
   - "View Subscription Plans" button
   - "Back to Dashboard" button

### 3. Test Resubscription

1. **Click** "View Subscription Plans" button
2. **Select** a plan
3. **Complete** subscription process
4. **Verify** full access is restored
5. **Check** all menu items are visible again

## Manual Database Verification

```bash
# Check user's subscription status
mongosh
use your_database_name

db.users.findOne(
  { email: "test@example.com" },
  { 
    subscriptionPlanId: 1,
    subscriptionStatus: 1,
    subscriptionStartDate: 1,
    subscriptionEndDate: 1
  }
)
```

Expected results:
- **After cancellation**: status = "cancelled", dates preserved
- **After end date**: status = "cancelled", endDate < current date
- **After resubscription**: status = "active", new dates set

## Edge Cases to Test

1. **Super Admin**: Should always have full access regardless of subscription
2. **Multiple Tabs**: Cancel in one tab, verify other tabs update on refresh
3. **Direct URL Access**: Try accessing restricted pages by typing URL
4. **API Endpoints**: Verify backend also restricts access (use browser dev tools)

## Troubleshooting

### Issue: Still have access after end date
- Clear browser cache
- Logout and login again
- Check user's subscriptionEndDate in database

### Issue: Lost access immediately after cancellation
- Check subscriptionStatus is "cancelled" not "expired"
- Check subscriptionEndDate is in the future
- Check user context is loaded correctly (React DevTools)

### Issue: Subscription prompt not showing
- Check browser console for errors
- Verify RequireSubscription component is imported correctly
- Check user context provides subscriptionStatus and subscriptionEndDate

## Files to Check If Issues Occur

1. `app/dashboard/profile/page.tsx` - Cancellation logic
2. `lib/subscription-helper.ts` - Backend permission checks
3. `components/dashboard/dashboard-sidebar.tsx` - Menu filtering
4. `components/subscription/subscription-prompt.tsx` - Subscription prompt UI
5. `components/auth/user-context.tsx` - User data loading

## Test Script

Run the automated test:
```bash
node test-subscription-cancellation.js
```

This tests the subscription logic without needing the full app running.
