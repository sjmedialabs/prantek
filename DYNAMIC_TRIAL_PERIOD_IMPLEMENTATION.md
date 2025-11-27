# Dynamic Trial Period Implementation

## Overview
This implementation allows Super Admins to configure the trial period duration dynamically through the admin interface. The trial period is stored in the database and applied consistently across the entire application and website.

## What Was Implemented

### 1. Database Configuration
**Collection**: `system_settings`  
**Document ID**: `global_config`

```javascript
{
  _id: "global_config",
  trialPeriodDays: 14,  // Configurable (1-365 days)
  createdAt: ISODate(...),
  updatedAt: ISODate(...)
}
```

### 2. Backend Components

#### Helper Functions (`lib/trial-helper.ts`)
```typescript
// Get trial period with caching (1-minute cache)
getTrialPeriodDays(): Promise<number>

// Calculate trial end date based on configured period
calculateTrialEndDate(): Promise<Date>

// Invalidate cache after updates
invalidateTrialCache(): void
```

**Features**:
- ✅ 1-minute cache to reduce database queries
- ✅ Fallback to default 14 days if database unavailable
- ✅ Automatic cache invalidation on updates

#### API Endpoints (`app/api/system-settings/route.ts`)

**GET `/api/system-settings`**
- Returns current trial period configuration
- Accessible to all authenticated users
- Response:
```json
{
  "success": true,
  "data": {
    "trialPeriodDays": 14
  }
}
```

**PATCH `/api/system-settings`**
- Updates trial period (Super Admin only)
- Validation: 1-365 days
- Invalidates cache after update
- Request:
```json
{
  "trialPeriodDays": 30
}
```

### 3. Frontend Components

#### Custom Hook (`lib/hooks/useTrialPeriod.ts`)
```typescript
const { trialDays, loading } = useTrialPeriod()
```

Used in:
- ✅ `components/pricing-section.tsx` - Displays trial period in pricing cards
- ✅ `components/cta-section.tsx` - Call-to-action text
- ✅ `components/hero-section.tsx` - Hero section messaging (if applicable)

#### Super Admin UI (`app/super-admin/settings/page.tsx`)
- **Location**: Super Admin → Settings → System Settings
- **Field**: "Default Trial Days"
- **Features**:
  - Loads current value on page load
  - Real-time validation (1-365 days)
  - Save button with loading state
  - Toast notifications for success/error

### 4. Updated Application Logic

#### Registration Flow (`app/api/auth/register/route.ts`)
**Before**:
```typescript
// Hardcoded 14 days
const trialEndDate = new Date()
trialEndDate.setDate(trialEndDate.getDate() + 14)
```

**After**:
```typescript
// Dynamic trial period
const trialEndDate = await calculateTrialEndDate()
```

## How It Works

### Flow Diagram
```
User Registration
    ↓
Register API calls calculateTrialEndDate()
    ↓
Helper checks cache (1-min expiry)
    ↓
If cache miss → Fetch from database
    ↓
Calculate end date: today + trialPeriodDays
    ↓
User created with subscriptionEndDate
```

### Configuration Flow
```
Super Admin → Settings Page
    ↓
Changes "Default Trial Days" to 30
    ↓
Clicks "Save All Settings"
    ↓
PATCH /api/system-settings
    ↓
Validates (1-365 days)
    ↓
Updates database
    ↓
Invalidates cache
    ↓
Success toast shown
    ↓
New registrations use 30-day trial
```

## Testing Instructions

### 1. Change Trial Period (Super Admin)
1. Login as Super Admin
2. Navigate to: Super Admin → Settings
3. Find "Default Trial Days" field
4. Change value to `30`
5. Click "Save All Settings"
6. ✅ Should see success toast
7. Refresh page - value should persist

### 2. Verify Registration Uses New Value
1. Logout
2. Go to signup page
3. Register a new user with a plan
4. Check database:
```javascript
db.users.findOne({ email: "test@example.com" }, {
  subscriptionEndDate: 1,
  subscriptionStartDate: 1
})
```
5. ✅ `subscriptionEndDate` should be 30 days from `subscriptionStartDate`

### 3. Verify Website Displays Correctly
1. Visit homepage (not logged in)
2. Check pricing section
3. ✅ Should display "30-day free trial" (not "14-day")
4. Check CTA section
5. ✅ Should display "30-day" in all relevant places

### 4. Verify API Endpoint
```bash
# Get current settings
curl http://localhost:3000/api/system-settings

# Update (requires super-admin token)
curl -X PATCH http://localhost:3000/api/system-settings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"trialPeriodDays": 21}'
```

## Files Modified

### Backend
1. ✅ `lib/trial-helper.ts` - **NEW** - Helper functions
2. ✅ `app/api/system-settings/route.ts` - **NEW** - API endpoints
3. ✅ `app/api/auth/register/route.ts` - Updated to use dynamic trial period

### Frontend
4. ✅ `lib/hooks/useTrialPeriod.ts` - **NEW** - Custom React hook
5. ✅ `app/super-admin/settings/page.tsx` - Connected to API
6. ✅ `components/pricing-section.tsx` - Dynamic trial period display
7. ✅ `components/cta-section.tsx` - Dynamic trial period display

### Database
8. ✅ `system_settings` collection - **NEW** - Stores configuration

## Configuration Options

### Valid Range
- **Minimum**: 1 day
- **Maximum**: 365 days
- **Default**: 14 days

### Validation Rules
- Must be a positive integer
- Must be between 1 and 365
- API returns 400 error if validation fails

## Caching Strategy

**Cache Duration**: 60 seconds (1 minute)

**Why Caching?**
- Reduces database load for high-traffic registration
- Trial period rarely changes, so cache is safe
- Short duration ensures updates propagate quickly

**Cache Invalidation**:
- Automatic after 1 minute
- Manual via `invalidateTrialCache()` after updates

## Error Handling

### Database Unavailable
- Falls back to default 14 days
- Logs warning to console
- Application continues to function

### Invalid Input
- API returns 400 with clear error message
- Frontend shows validation error
- Database not updated

### Authentication Errors
- 401 for missing/invalid token
- 403 for non-super-admin users
- Clear error messages returned

## Security Considerations

### Access Control
- ✅ GET endpoint: Accessible to all (read-only configuration)
- ✅ PATCH endpoint: Super Admin only
- ✅ JWT token validation required
- ✅ Role check: `decoded.role === "super-admin"`

### Input Validation
- ✅ Type checking: Must be number
- ✅ Range validation: 1-365 days
- ✅ Server-side validation (never trust client)

## Future Enhancements

### Possible Additions
1. **Plan-Specific Trial Periods**
   - Different trial durations for Basic vs Premium plans
   - Store `trialPeriodDays` in `subscription_plans` collection

2. **Trial Period Analytics**
   - Track conversion rates by trial duration
   - A/B testing different trial periods

3. **Email Notifications**
   - Send trial expiry reminders based on configured duration
   - Dynamic email templates with trial period

4. **Promotional Trial Extensions**
   - Allow super admin to set temporary promotional trial periods
   - Time-based overrides (e.g., "30 days for December only")

## Troubleshooting

### Issue: Website still shows "14-day trial"
**Solution**: 
- Clear browser cache (Ctrl+Shift+R)
- Check if component is using `useTrialPeriod()` hook
- Verify API endpoint returns correct value

### Issue: Registration still creates 14-day trials
**Solution**:
- Check `calculateTrialEndDate()` is imported and called
- Verify database has `system_settings` collection
- Check server logs for errors

### Issue: "Forbidden" error when updating
**Solution**:
- Ensure logged in as super-admin
- Check token is valid and not expired
- Verify `role` field in JWT token

## API Documentation

### Endpoint Summary

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/api/system-settings` | No* | Get current settings |
| PATCH | `/api/system-settings` | Super Admin | Update settings |

*Technically no auth required, but only returns public settings

### Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Invalid input (out of range) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (not super-admin) |
| 500 | Server error |

## Migration Notes

### Existing Installations
If deploying to an existing installation:

1. **Database Migration**:
```javascript
db.system_settings.insertOne({
  _id: "global_config",
  trialPeriodDays: 14,  // Keep existing behavior
  createdAt: new Date(),
  updatedAt: new Date()
})
```

2. **No User Impact**:
   - Existing users keep their current trial end dates
   - Only affects new registrations
   - Website content updates immediately

3. **Rollback Plan**:
   - Keep backup of original files
   - Can revert to hardcoded 14 days if needed
   - No database changes to user data

## Support

For issues or questions:
1. Check console logs for errors
2. Verify database connection
3. Test API endpoints directly (curl/Postman)
4. Check token validity and permissions

---

**Last Updated**: November 26, 2025  
**Version**: 1.0  
**Status**: ✅ Production Ready
