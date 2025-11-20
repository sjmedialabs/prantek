# Integration Code Snippets

## 1. Update `lib/models/types.ts` User Interface

Add these fields to the User interface:

```typescript
export interface User extends BaseDocument {
  email: string
  password: string
  name: string
  companyId?: string
  role: "user" | "super-admin"
  subscriptionPlanId?: string
  subscriptionStatus?: "active" | "inactive" | "trial" | "expired" | "payment_failed"  // Added payment_failed
  subscriptionStartDate?: Date
  subscriptionEndDate?: Date
  trialEndsAt?: Date
  trialEndDate?: Date                    // NEW
  trialPaymentProcessed?: boolean        // NEW
  stripeCustomerId?: string
  razorpayCustomerId?: string            // NEW
  razorpayTokenId?: string               // NEW
  lastPaymentDate?: Date                 // NEW
  nextPaymentDate?: Date                 // NEW
  paymentFailedAt?: Date                 // NEW
  paymentFailureReason?: string          // NEW
  isActive: boolean
}
```

---

## 2. Update Payment Verification to Store Razorpay IDs

Update `app/api/payment/verify-and-create-account/route.ts`:

```typescript
import { getPaymentDetails } from "@/lib/razorpay"  // ADD THIS

export async function POST(request: NextRequest) {
  try {
    const db = await connectDB()
    const { signupData, paymentId, razorpayOrderId, razorpaySignature } = await request.json()
    
    // ... existing validation code ...
    
    // ADD THIS: Fetch payment details from Razorpay
    let razorpayCustomerId = ""
    let razorpayTokenId = ""
    
    if (paymentId) {
      try {
        const paymentDetails = await getPaymentDetails(paymentId)
        razorpayCustomerId = paymentDetails.customer_id || ""
        razorpayTokenId = paymentDetails.token_id || ""
        console.log(`Stored Razorpay Customer: ${razorpayCustomerId}`)
      } catch (error) {
        console.error("Error fetching Razorpay payment details:", error)
      }
    }
    
    // Create new user
    const newUser = {
      email: signupData.email,
      password: hashedPassword,
      name: signupData.name,
      role: "admin",
      phone: signupData.phone || "",
      address: signupData.address || "",
      subscriptionPlanId: signupData.subscriptionPlanId || "",
      subscriptionStatus: subscriptionStatus,
      trialEndsAt: trialEndsAt,
      trialEndDate: trialEndsAt,  // ADD THIS
      trialPaymentProcessed: false,  // ADD THIS
      paymentId: paymentId || "",
      razorpayOrderId: razorpayOrderId || "",
      razorpayCustomerId: razorpayCustomerId,  // ADD THIS
      razorpayTokenId: razorpayTokenId,  // ADD THIS
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    
    // ... rest of the function remains the same ...
  }
}
```

---

## 3. Update `.env.local` (Development)

Add these Razorpay test credentials:

```env
# Razorpay (Test Mode)
RAZORPAY_KEY_ID=rzp_test_1DP5mmOlF5G5ag
RAZORPAY_KEY_SECRET=nxrHnLJh123456789example

# Cron Security
CRON_SECRET=your_super_secret_cron_key_12345
```

To get test credentials:
1. Go to https://dashboard.razorpay.com/
2. Sign in or create account
3. Go to Settings → API Keys
4. Copy test keys (they start with `rzp_test_`)

---

## 4. Update `.env.production` (or deployment config)

Add these Razorpay live credentials:

```env
# Razorpay (Live Mode)
RAZORPAY_KEY_ID=rzp_live_1A2B3C4D5E6F7G8H
RAZORPAY_KEY_SECRET=abcdef1234567890secretkey

# Cron Security (change to a very secure random value)
CRON_SECRET=your_production_secret_key_very_secure_random_string
```

---

## 5. Optional: Monitor Payment in Dashboard

Create a new dashboard page to monitor payments:

```typescript
// app/dashboard/payments/history/page.tsx
import { connectDB } from "@/lib/db-config"
import { getServerSession } from "next-auth/next"

export default async function PaymentHistoryPage() {
  const session = await getServerSession()
  const db = await connectDB()
  
  const payments = await db.collection("payment_history")
    .find({ userId: session?.user?.id })
    .sort({ createdAt: -1 })
    .limit(20)
    .toArray()
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Payment History</h1>
      
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Date</th>
            <th className="border p-2">Amount</th>
            <th className="border p-2">Type</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Razorpay ID</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment: any) => (
            <tr key={payment._id.toString()}>
              <td className="border p-2">
                {new Date(payment.paymentDate).toLocaleDateString()}
              </td>
              <td className="border p-2">₹{payment.amount}</td>
              <td className="border p-2">{payment.paymentType}</td>
              <td className="border p-2">
                <span className={payment.status === "success" ? "text-green-600" : "text-red-600"}>
                  {payment.status}
                </span>
              </td>
              <td className="border p-2 text-sm font-mono">
                {payment.razorpayPaymentId}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

---

## 6. Manual Testing Command

Test the cron job manually (with your actual credentials):

```bash
# Development
curl -H "Authorization: Bearer your_super_secret_cron_key_12345" \
  http://localhost:3000/api/cron/process-trial-payments

# Production
curl -H "Authorization: Bearer your_production_secret_key_very_secure_random_string" \
  https://yourdomain.com/api/cron/process-trial-payments
```

Expected success response:
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
        "userId": "65a1b2c3d4e5f6g7h8i9j0k1",
        "email": "user@example.com",
        "error": "Insufficient funds in the account"
      }
    ]
  }
}
```

---

## Implementation Order

1. ✅ **Already Done:**
   - Created `lib/razorpay.ts`
   - Updated `app/api/cron/process-trial-payments/route.ts`
   - Installed `razorpay` npm package

2. **You Need to Do:**
   - [ ] Update User interface in `lib/models/types.ts`
   - [ ] Update payment verification in `app/api/payment/verify-and-create-account/route.ts`
   - [ ] Add Razorpay environment variables
   - [ ] Test with development credentials
   - [ ] Verify cron works with test data
   - [ ] Deploy to production with live keys

---

## Troubleshooting

### Issue: "RAZORPAY_KEY_ID not found"
**Solution:** Add environment variables to `.env.local` and restart dev server

### Issue: "No Razorpay customer ID for user"
**Solution:** Make sure you updated the payment verification to store `razorpayCustomerId`

### Issue: Cron returns 401 Unauthorized
**Solution:** Check `Authorization` header matches your `CRON_SECRET` environment variable

### Issue: "Payment API returned no response"
**Solution:** Check that Razorpay test keys are valid and API is accessible

