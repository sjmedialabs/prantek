# ₹1 Payment Verification & Auto-Refund Implementation

## Overview
This system implements automatic refund of ₹1 verification payments after successful account creation. The ₹1 payment verifies the user's payment method and enables auto-pay for future billing.

## Flow Diagram
```
User Registration
    ↓
Select Plan (₹986 yearly with 17% discount)
    ↓
Payment Page: Charge ₹1 for verification
    ↓
User Pays ₹1 via Razorpay
    ↓
Payment Success → Verify & Create Account API
    ↓
1. Create User Account
2. Mark payment method as verified
3. Trigger Automatic Refund ← NEW!
    ↓
Refund API → Razorpay Refund
    ↓
Update User: paymentMethodVerified = true
            verificationPaymentRefunded = true
    ↓
User receives refund (instant in test mode, 5-7 days in production)
```

## Files Modified/Created

### 1. NEW: Refund API Route
**File**: `app/api/payment/refund/route.ts`

**POST /api/payment/refund**
- Processes refund via Razorpay API
- Logs refund in `payment_refunds` collection
- Returns refund ID and status

**GET /api/payment/refund?paymentId=xxx**
- Check refund status
- Query by paymentId or refundId

### 2. UPDATED: Payment Verification Route
**File**: `app/api/payment/verify-and-create-account/route.ts`

**Changes**:
- After creating user account, automatically calls refund API
- Updates user record with refund information
- Handles refund failures gracefully (account still created)

### 3. FIXED: Discount Calculation
**File**: `app/(auth)/signup/page.tsx`

**Changes**:
- Now correctly applies 17% discount before passing to payment
- Formula: `(price * 12) - ((price * 12) * 0.17)`
- Example: ₹1188 → ₹986

### 4. FIXED: Dynamic Trial Period
**File**: `app/(auth)/payment/page.tsx`

**Changes**:
- Uses `useTrialPeriod()` hook
- Shows "30-day free trial" instead of hardcoded "14-day"

## Database Collections

### payment_refunds
```json
{
  "paymentId": "pay_xxx",
  "refundId": "rfnd_xxx",
  "amount": 100,
  "status": "processed",
  "reason": "Verification payment refund",
  "razorpayResponse": { ... },
  "createdAt": ISODate(...)
}
```

### users (updated fields)
```json
{
  "paymentMethodVerified": true,
  "verificationPaymentRefunded": true,
  "refundId": "rfnd_xxx",
  "refundedAt": ISODate(...)
}
```

## Environment Variables

Add to `.env.local`:

```bash
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_RVhlVFbaKUJJDH
RAZORPAY_KEY_SECRET=your_secret_key_here

# App URL (for API calls)
NEXT_PUBLIC_APP_URL=http://localhost:9080
```

⚠️ **Important**: Replace `your_secret_key_here` with your actual Razorpay test secret key

## Testing Guide

### Test Mode (Razorpay Test Keys)

1. **Get Test Secret Key**:
   - Login to Razorpay Dashboard (test mode)
   - Go to Settings → API Keys
   - Copy Test Key Secret

2. **Test Payment Flow**:
   ```bash
   # Use test card
   Card: 4111 1111 1111 1111
   CVV: any 3 digits
   Expiry: any future date
   ```

3. **Verify Refund**:
   - Check Razorpay Dashboard → Payments → Refunds
   - Check database: `db.payment_refunds.find()`
   - Refund shows as "processed" immediately in test mode

4. **Check Logs**:
   ```bash
   # Look for
   ✅ Verification payment refunded successfully: rfnd_xxx
   ```

### Production Mode

1. **Switch to Live Keys**:
   ```bash
   RAZORPAY_KEY_ID=rzp_live_xxx
   RAZORPAY_KEY_SECRET=your_live_secret
   ```

2. **Real Refunds**:
   - Processed instantly to bank accounts
   - Takes 5-7 business days to reflect in user's account
   - Razorpay handles the banking process

3. **Monitor**:
   - Razorpay Dashboard → Refunds
   - Database: `payment_refunds` collection
   - Email notifications from Razorpay

## API Testing

### Test Refund API Directly
```bash
# Trigger refund
curl -X POST http://localhost:9080/api/payment/refund \
  -H "Content-Type: application/json" \
  -d '{
    "paymentId": "pay_xxx",
    "amount": 100,
    "reason": "Test refund"
  }'

# Check refund status
curl http://localhost:9080/api/payment/refund?paymentId=pay_xxx
```

## Error Handling

### Refund Failures
- **Account still created** - User can use the platform
- **Manual processing** - Admin can trigger refund manually
- **Logged in database** - Failed attempts are logged
- **User notification** - Can notify user of refund status

### Retry Mechanism
If refund fails, you can manually trigger:
```bash
curl -X POST /api/payment/refund \
  -d '{"paymentId": "pay_xxx"}'
```

## Security Considerations

1. **API Keys Protection**:
   - Never commit secret keys to git
   - Use environment variables
   - Different keys for test/production

2. **Refund Validation**:
   - Validates payment ID exists
   - Prevents duplicate refunds
   - Logs all refund attempts

3. **Amount Validation**:
   - Only allows ₹1 (100 paise) refund
   - Prevents arbitrary amounts

## User Experience

### What User Sees:
1. **At Payment**: "Start your 30-day free trial with just ₹1"
2. **After Payment**: "Account created successfully!"
3. **Email (from Razorpay)**: "Refund of ₹1 processed"
4. **Bank Statement**: ₹1 refunded within 5-7 days

### Benefits:
- ✅ Payment method verified
- ✅ Auto-pay enabled for future billing
- ✅ No cost to user (₹1 refunded)
- ✅ Seamless onboarding experience

## Troubleshooting

### Issue: Refund not processed
**Check**:
1. Razorpay secret key is correct
2. Payment ID is valid
3. Payment was actually captured (not just created)
4. Check server logs for error messages

**Solution**:
```bash
# Check payment status in Razorpay
# Manually trigger refund via API
```

### Issue: "Invalid API key"
**Check**:
1. Environment variables loaded correctly
2. Using correct key (test vs production)
3. Key has required permissions

### Issue: "Payment not found"
**Check**:
1. Payment was successfully captured
2. Using correct payment ID
3. Correct Razorpay account

## FAQ

**Q: Can I test refunds without real money?**
A: Yes! Use Razorpay test mode with test cards.

**Q: How long does refund take?**
A: Test mode: Instant. Production: 5-7 business days to user's bank.

**Q: What if refund fails?**
A: Account is still created. Refund can be processed manually later.

**Q: Is ₹1 charged to the user?**
A: Temporarily yes, but immediately refunded automatically.

**Q: Can user skip payment?**
A: No - payment verifies payment method for future auto-billing.

## Next Steps

1. ✅ Add Razorpay secret key to `.env.local`
2. ✅ Test complete flow with test card
3. ✅ Verify refund appears in Razorpay dashboard
4. ✅ Check database for refund records
5. 📧 Optional: Add email notification to user about refund

---

**Status**: ✅ Ready for Testing
**Last Updated**: November 27, 2025
