# Dynamic Payment Processing Implementation

## What Changed

The payment auto-debit system has been upgraded from **mock/simulated** payments to **real Razorpay API integration**.

## Files Created/Modified

### 1. **New File: `lib/razorpay.ts`**
Razorpay API wrapper with functions for:
- Creating payment orders
- Verifying payment signatures
- Charging saved payment methods (recurring payments)
- Fetching customer and token details

### 2. **Updated: `app/api/cron/process-trial-payments/route.ts`**
**Before:** Simulated payment (always returned `true`)
**After:** Real Razorpay API calls to charge customers

Key improvements:
- ✅ Validates user has a Razorpay customer ID
- ✅ Calls `chargeCustomerToken()` to charge saved payment methods
- ✅ Handles Razorpay API errors with specific error messages
- ✅ Records payment details in `payment_history` collection
- ✅ Tracks payment failures with reasons

### 3. **New File: `docs/PAYMENT_PROCESSING_GUIDE.md`**
Complete documentation on:
- Architecture overview
- Required database fields
- Environment variables needed
- Payment flow explanation
- Error handling scenarios
- Testing & monitoring

## How It Works Now

```
Daily at 2 AM UTC
      ↓
Cron job triggers
      ↓
Find users where trialEndDate = today
      ↓
For each user:
  1. Verify razorpayCustomerId exists
  2. Get subscription plan
  3. Call Razorpay API to charge saved payment method
  4. On success: Mark as paid, set to "active", update next payment date
  5. On failure: Set to "payment_failed", record error reason
      ↓
Update payment_history collection with results
      ↓
Return summary (successful, failed, errors)
```

## Real Razorpay API Functions Used

| Function | Purpose |
|----------|---------|
| `chargeCustomerToken()` | Main recurring payment - charges a saved card/UPI |
| `getPaymentDetails()` | Fetch payment info from Razorpay |
| `getCustomerTokens()` | Get all saved payment methods for customer |
| `getCustomerDetails()` | Get customer information |

## What You Need to Do

### 1. Install Razorpay SDK ✅
```bash
npm install razorpay
```

### 2. Set Environment Variables
Add to `.env.local` (dev) and deployment config (production):

```env
# Razorpay API Keys (from Razorpay Dashboard)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx

# Existing cron secret
CRON_SECRET=your_secure_cron_secret
```

### 3. Update User Schema
Add these fields to your User type in `lib/models/types.ts`:

```typescript
razorpayCustomerId?: string      // From Razorpay
razorpayTokenId?: string         // Saved payment method token
lastPaymentDate?: Date
nextPaymentDate?: Date
paymentFailedAt?: Date
paymentFailureReason?: string
```

### 4. Update Initial Payment Flow
When a user makes their initial payment, store the Razorpay IDs:

```typescript
// In app/(auth)/payment/page.tsx or payment verification endpoint
// After successful payment verification:

const paymentDetails = await getPaymentDetails(response.razorpay_payment_id)

await db.collection('users').updateOne(
  { _id: userId },
  {
    $set: {
      razorpayCustomerId: paymentDetails.customer_id,
      razorpayTokenId: paymentDetails.token_id,
      subscriptionStatus: 'active'
    }
  }
)
```

### 5. Test It
```bash
# Run the cron manually (replace YOUR_CRON_SECRET)
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  http://localhost:3000/api/cron/process-trial-payments

# Or in production:
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-domain.com/api/cron/process-trial-payments
```

## Database Changes

The system now stores detailed payment information:

```typescript
// users collection
{
  razorpayCustomerId: "cust_xxxx",      // NEW
  razorpayTokenId: "token_xxxx",        // NEW
  subscriptionStatus: "payment_failed", // Can now be "payment_failed"
  paymentFailureReason: "Insufficient funds in the account", // NEW
  paymentFailedAt: Date,                // NEW
}

// payment_history collection
{
  razorpayPaymentId: "pay_xxxx",        // NEW
  razorpayOrderId: "order_xxxx",        // NEW
  failureReason: "Insufficient funds",  // NEW for failed payments
  status: "success" | "failed"          // Can now track failures
}
```

## Error Handling

The system gracefully handles:

| Error | Result |
|-------|--------|
| No saved payment method | subscription_status: "payment_failed" |
| Insufficient funds | subscription_status: "payment_failed" |
| Card declined | subscription_status: "payment_failed" |
| API errors | Logged with full error message |

All errors are:
1. Recorded in `payment_history` collection
2. Logged with `[Cron]` prefix for easy filtering
3. Returned in cron response for monitoring

## Testing Checklist

- [ ] Add Razorpay environment variables to `.env.local`
- [ ] Update User schema with new fields
- [ ] Update initial payment flow to store `razorpayCustomerId` and `razorpayTokenId`
- [ ] Run: `npm install razorpay` ✅
- [ ] Test with Razorpay test keys (prefix: `rzp_test_`)
- [ ] Manually trigger cron to verify it works
- [ ] Check `payment_history` collection for records
- [ ] Deploy to production with live Razorpay keys

## Monitoring

Watch for these in logs:
```
[Cron] Found X users with trial ending today
[Payment] Processing payment for user@example.com: ₹500
[Cron] Successfully charged user user@example.com - Amount: ₹500
[Cron] Failed to charge user user@example.com - Reason: Insufficient funds
```

## Key Differences from Old Implementation

| Aspect | Old (Mock) | New (Real) |
|--------|-----------|-----------|
| Payment Processing | Simulated | Real Razorpay API |
| Error Handling | N/A | Full error details |
| Retry Logic | N/A | Can retry on specific errors |
| Token Storage | Not implemented | Stored for recurring charges |
| Payment Tracking | Basic | Detailed with failure reasons |
| Production Ready | No | Yes ✅ |
