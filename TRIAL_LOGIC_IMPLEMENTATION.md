# 14-Day Free Trial Implementation

## Overview
Implemented automatic 14-day free trial system where clients select a plan during signup and are automatically charged after the trial period ends.

## How It Works

### 1. User Registration
When a user signs up and selects a plan:
- **subscriptionStatus** is set to `"trial"`
- **subscriptionStartDate** is set to current date
- **trialEndsAt** is set to 14 days from now
- **subscriptionEndDate** is set to trial end date
- User gets full access to their chosen plan for 14 days

### 2. Trial Period
During the 14-day trial:
- User has `subscriptionStatus: "trial"`
- Can access all features of their selected plan
- Shows as "trial" status in Client Accounts page

### 3. After Trial Expires
Automated process (cron job) runs daily to:
- Find users with `subscriptionStatus: "trial"` and `trialEndsAt <= current date`
- Update their status to `"active"`
- Set billing dates (30-day subscription cycle)
- Charge their payment method (integration needed)

## Files Modified

### 1. `/app/api/auth/register/route.ts`
- Updated to automatically assign 14-day trial when `subscriptionPlanId` is provided
- Removes dependency on `freeTrial` flag
- Sets proper trial dates and subscription status

### 2. `/app/api/cron/process-trials/route.ts` (NEW)
- Cron job endpoint to process expired trials
- Converts trial users to active subscriptions
- Calculates next billing date (30 days)
- Ready for payment gateway integration

## Database Fields

### User Document
```javascript
{
  subscriptionStatus: "trial" | "active" | "inactive",
  subscriptionPlanId: ObjectId,
  subscriptionStartDate: Date,
  subscriptionEndDate: Date,
  trialEndsAt: Date,        // Only set during trial
  lastBillingDate: Date,    // Set after trial ends
  nextBillingDate: Date     // Set after trial ends
}
```

## Setting Up Cron Job

### Option 1: System Cron (Recommended for Production)
Add to crontab to run daily at 2 AM:
```bash
0 2 * * * curl -X POST http://localhost:9080/api/cron/process-trials -H "Authorization: Bearer your-secret-key"
```

### Option 2: External Cron Service
Use services like:
- **cron-job.org**
- **EasyCron**
- **Vercel Cron** (if deployed on Vercel)

Set up to call: `POST http://your-domain/api/cron/process-trials`
With header: `Authorization: Bearer your-secret-key`

### Option 3: PM2 Cron
```bash
pm2 start /path/to/cron-script.js --cron "0 2 * * *"
```

## Environment Variables

Add to `.env`:
```
CRON_SECRET=your-secret-key-here
```

## Payment Gateway Integration

In `/app/api/cron/process-trials/route.ts`, add payment processing at the TODO section:

```typescript
// TODO: Integrate with payment gateway to charge the user
// Example for Razorpay:
// const payment = await razorpay.payments.create({
//   amount: plan.price * 100,
//   currency: "INR",
//   email: user.email,
//   description: `Subscription for ${plan.name}`
// })
```

## Testing

### Test Trial Creation
1. Register a new user with a plan selected
2. Check database: `subscriptionStatus` should be "trial"
3. Check `trialEndsAt` is 14 days in future

### Test Trial Expiration
Manually trigger the cron:
```bash
curl -X POST http://localhost:9080/api/cron/process-trials \
  -H "Authorization: Bearer your-secret-key"
```

Or manually set a user's `trialEndsAt` to past date and run the cron.

## Client Status Display

In Client Accounts page, status will show:
- **trial** - User is in 14-day trial period
- **active** - Paying customer (trial expired and converted)
- **inactive** - No subscription or expired

## Next Steps

1. **Set up cron job** to run daily
2. **Integrate payment gateway** (Razorpay/Stripe) in the trial processing endpoint
3. **Add email notifications** for:
   - Trial started
   - Trial ending soon (e.g., 3 days before)
   - Trial converted to active subscription
   - Payment failed

## Security Notes

- Cron endpoint is protected with Authorization Bearer token
- Set strong `CRON_SECRET` in environment variables
- Consider IP whitelisting for cron endpoint in production
