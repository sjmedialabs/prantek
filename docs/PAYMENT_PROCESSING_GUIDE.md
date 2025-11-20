# Payment Processing Implementation Guide

## Overview

The cron job now uses real Razorpay API calls to charge users whose trial period has ended. This replaces the previous mock payment implementation.

## Architecture

### 1. **Razorpay Utility Module** (`lib/razorpay.ts`)
Provides a wrapper around the Razorpay SDK with the following functions:

- `createOrder()` - Create a new payment order
- `verifyPaymentSignature()` - Verify payment signatures
- `getPaymentDetails()` - Fetch payment details
- `chargeCustomerToken()` - Charge a customer using a saved token (recurring payment)
- `getCustomerTokens()` - Fetch saved payment methods for a customer
- `getCustomerDetails()` - Get customer information

### 2. **Cron Job** (`app/api/cron/process-trial-payments/route.ts`)

**When it runs:**
- Daily at 2 AM UTC (configurable in `vercel.json`)
- Triggered automatically by Vercel Cron or your VPS scheduler

**What it does:**
1. Finds all users whose trial ends today
2. For each user:
   - Validates that they have a Razorpay customer ID
   - Validates that their subscription plan exists
   - Charges their saved payment method via `chargeCustomerToken()`
3. On success:
   - Updates user subscription to "active"
   - Sets next payment date to 30 days from now
   - Creates a payment history record
4. On failure:
   - Sets subscription status to "payment_failed"
   - Records the failure reason
   - Creates a failed payment history record

## Required Database Fields

Update the User schema to include these fields:

```typescript
interface User {
  // ... existing fields
  
  // Razorpay integration
  razorpayCustomerId?: string      // Razorpay customer ID
  razorpayTokenId?: string         // Saved payment method token
  
  // Payment tracking
  trialEndDate?: Date              // When trial ends
  trialPaymentProcessed?: boolean  // Whether we've charged for the trial period
  lastPaymentDate?: Date           // Last successful payment
  nextPaymentDate?: Date           // When next payment is due
  subscriptionStatus?: "active" | "inactive" | "trial" | "payment_failed" | "expired"
  paymentFailedAt?: Date           // When payment last failed
  paymentFailureReason?: string    // Why payment failed
}
```

## Environment Variables

Add these to your `.env.local` and deployment configuration:

```env
# Razorpay API Keys
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx

# Cron Job Security
CRON_SECRET=your_secure_cron_secret_key
```

## Payment Flow

### Initial Signup/Payment
1. User signs up and makes initial payment
2. Razorpay returns a `customer_id` and optionally a `token_id`
3. Store both IDs in the user document:
   ```typescript
   {
     razorpayCustomerId: "cust_xxxx",
     razorpayTokenId: "token_xxxx"
   }
   ```

### Trial-to-Paid Conversion
1. Cron job runs at 2 AM daily
2. Queries for users where `trialEndDate` is today
3. Attempts to charge using the stored token
4. Updates user record based on success/failure

### Recurring Payments
Future payment cycles will work the same way - the cron job runs daily and charges users whose subscription renewal date matches.

## Error Handling

The implementation handles these Razorpay error scenarios:

1. **No Saved Payment Method**
   - Sets subscription to "payment_failed"
   - Error: "No valid payment method on file"
   
2. **Insufficient Funds**
   - Sets subscription to "payment_failed"
   - Error: "Insufficient funds in the account"
   
3. **Card Declined**
   - Sets subscription to "payment_failed"
   - Error: "Payment method declined by bank"

4. **Invalid Token/Customer ID**
   - Sets subscription to "payment_failed"
   - Error logged with full details

## Monitoring & Logging

Check cron execution logs with:
- **Vercel**: Vercel Dashboard > Logs
- **VPS**: Check `/var/log/pm2/` for application logs

Log messages include timestamps with `[Cron]` and `[Payment]` prefixes:
```
[Cron] Found 5 users with trial ending today
[Payment] Processing payment for user@example.com: ₹500
[Payment] Razorpay payment created: pay_xxxx
[Cron] Successfully charged user user@example.com - Amount: ₹500
```

## Testing

### Test Mode (Development)
Use Razorpay test keys:
```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=test_secret_xxxxxxxxxxxx
```

### Manual Trigger
```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-domain.com/api/cron/process-trial-payments
```

### Expected Response
```json
{
  "success": true,
  "message": "Processed 5 users",
  "results": {
    "total": 5,
    "successful": 4,
    "failed": 1,
    "errors": [
      {
        "userId": "user_id_123",
        "email": "user@example.com",
        "error": "Insufficient funds in the account"
      }
    ]
  }
}
```

## Implementing Payment Method Storage

When a user makes their initial payment, store their Razorpay customer and token IDs:

```typescript
// After successful Razorpay payment
const paymentDetails = await getPaymentDetails(paymentId)

await db.collection('users').updateOne(
  { _id: userId },
  {
    $set: {
      razorpayCustomerId: paymentDetails.customer_id,
      razorpayTokenId: paymentDetails.token_id, // If available
      subscriptionStatus: 'active'
    }
  }
)
```

## Next Steps

1. ✅ Update User schema with new fields
2. ✅ Set Razorpay environment variables
3. ✅ Install Razorpay SDK: `npm install razorpay`
4. ✅ Update payment signup flow to store customer ID and token
5. ✅ Test with Razorpay test credentials
6. ✅ Monitor first cron execution
7. ✅ Deploy to production with live Razorpay keys
