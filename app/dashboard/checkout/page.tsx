"use client"

import { useState, useEffect } from "react"
import { useUser } from "@/components/auth/user-context"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2, Lock } from "lucide-react"
import { api } from "@/lib/api-client"
import Link from "next/link"
import { toast } from "@/lib/toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { SubscriptionPlan } from "@/lib/models/types"

declare global {
  interface Window {
    Razorpay: any
  }
}

export default function CheckoutPage() {
  const { user } = useUser()
  const router = useRouter()
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [error, setError] = useState("")
  const [amountFromPreviousSubscription, setAmountFromPreviousSubscription] = useState(0)
  const [previousPlan, setPreviousPlan] = useState<SubscriptionPlan | null>(null)
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly")
  const [loginedUserLocalStorage, setLoginedUserLocalStorage] = useState<any>(null)
  const [yearlyDiscount, setYearlyDiscount] = useState(17);
  const loginedUserLocalStorageString = localStorage.getItem("loginedUser");
  const loginedUserLocalStorageDetails = loginedUserLocalStorageString ? JSON.parse(loginedUserLocalStorageString) : null;
  const [isClient, setIsClient] = useState(false)
  // ReachPro topup state
  const [isReachProTopup, setIsReachProTopup] = useState(false)
  const [topupBase, setTopupBase] = useState(0)
  const [topupTax, setTopupTax] = useState(0)
  const [topupTotal, setTopupTotal] = useState(0)
  const [topupTaxIncluded, setTopupTaxIncluded] = useState(false)
  // 1️⃣ Mark client-side render finished
  useEffect(() => {
    setIsClient(true)
    // Read ReachPro topup params set by plans page
    const base = Number(localStorage.getItem("reachpro_topup_amount") || 0)
    const tax = Number(localStorage.getItem("reachpro_topup_tax") || 0)
    const total = Number(localStorage.getItem("reachpro_topup_total") || 0)
    const taxInc = localStorage.getItem("reachpro_topup_tax_included") === "true"
    if (base > 0) {
      setIsReachProTopup(true)
      setTopupBase(base)
      setTopupTax(tax)
      setTopupTotal(total)
      setTopupTaxIncluded(taxInc)
    }
  }, [])

  // 2️⃣ Load all localStorage values
  useEffect(() => {
    const loginString = localStorage.getItem("loginedUser")
    setLoginedUserLocalStorage(loginString ? JSON.parse(loginString) : null)
  }, [])
console.log("loginedUserLocalStorage:", loginedUserLocalStorage)

// billing cycle from local storage
useEffect(() => {
  const cycle = localStorage.getItem("selected_billing_cycle") as "monthly" | "yearly"
  if (cycle) {
    setBillingCycle(cycle)
  }
}, [])
  useEffect(() => {
    const loadPlan = async () => {
      try {
        const planId = localStorage.getItem("selected_plan_id");
        if (!planId) { router.push("/dashboard/plans"); return; }
        const selectedPlan = await api.subscriptionPlans.getById(planId);
        setPlan(selectedPlan);

        // If this is a ReachPro topup, skip previous plan balance logic
        const topupBase = Number(localStorage.getItem("reachpro_topup_amount") || 0)
        if (topupBase > 0 || selectedPlan?.isPayAsYouGo ||
            String(selectedPlan?.name || "").toLowerCase() === "reachpro") {
          setAmountFromPreviousSubscription(0);
          setLoading(false);
          return;
        }

        const subscriptionStatus = user?.subscriptionStatus;
        const subscriptionPlanId = user?.subscriptionPlanId || "";
        if (subscriptionStatus === "cancelled" || subscriptionStatus === "trial" || !subscriptionPlanId) {
          setPreviousPlan(null);
          setAmountFromPreviousSubscription(0);
        } else {
          const prevPlan = await api.subscriptionPlans.getById(subscriptionPlanId);
          setPreviousPlan(prevPlan);
          const subscriptionEndDate = new Date(loginedUserLocalStorageDetails.subscriptionEndDate);
          const subscriptionStartDate = new Date(loginedUserLocalStorageDetails.subscriptionStartDate);
          const currentDate = new Date();
          const totalDays = prevPlan.billingCycle === "monthly" ? 30 : prevPlan.billingCycle === "yearly" ? 365
            : Math.ceil((subscriptionEndDate.getTime() - subscriptionStartDate.getTime()) / (1000 * 60 * 60 * 24));
          const daysLeft = Math.max(Math.ceil((subscriptionEndDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)), 0);
          setAmountFromPreviousSubscription(Math.ceil(((prevPlan.price || 0) * daysLeft) / totalDays));
        }
      } catch (err) {
        console.error("Failed to load plan:", err);
      } finally {
        setLoading(false);
      }
    };
    const loadDiscount = async () => {
      const settingsResponse = await fetch('/api/system-settings');
      const settingsData = await settingsResponse.json();
      if (settingsData.success && settingsData.data.yearlyDiscountPercentage) {
        setYearlyDiscount(settingsData.data.yearlyDiscountPercentage);
      }
    }
    loadDiscount();
    loadPlan();
  }, [loginedUserLocalStorageDetails, router, user]);

// base price 
const basePrice =
  billingCycle === "yearly"
    ? Math.round(((plan?.price || 0) * 12) * (1 - yearlyDiscount / 100))
    : plan?.price
const priceWithGST = Math.round((basePrice || 0) * 1.18)
  useEffect(() => {
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.async = true
    script.onload = () => {
      console.log("[v0] Razorpay script loaded successfully")
      setScriptLoaded(true)
    }
    script.onerror = () => {
      console.error("[v0] Failed to load Razorpay script")
      setError("Failed to load payment gateway. Please refresh the page.")
    }
    document.body.appendChild(script)

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [])

  const handlePayment = async () => {
    if (!scriptLoaded) {
      setError("Payment gateway is still loading. Please wait.")
      return
    }

    if (!plan) return
    setProcessing(true)
    setError("")
    try {
      const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || ""
      if (!razorpayKey) {
        setError("Payment gateway is not configured.")
        setProcessing(false)
        return
      }
      // Determine amount to charge
      let totalAmount: number
      if (isReachProTopup) {
        totalAmount = topupTotal
      } else {
        const gross = Math.round((basePrice || 0) * 1.18)
        totalAmount = Math.max(gross - amountFromPreviousSubscription, Math.round((plan.price || 0) * 1.18))
      }
      const options = {
        key: razorpayKey,
        amount: totalAmount * 100,
        currency: "INR",
        name: "SaaS Platform",
        description: isReachProTopup ? "ReachPro Wallet Top-up" : `${plan.name} Plan Subscription`,
        image: "https://31.97.224.169:9080/images/prantek-logo.png",
        prefill: { name: user?.name || "", email: user?.email || "" },
        theme: { color: isReachProTopup ? "#7c3aed" : "#3b82f6" },
        handler: (response: any) => handlePaymentSuccess(response),
        modal: { ondismiss: () => setProcessing(false) },
      }
      const razorpay = new window.Razorpay(options)
      razorpay.on("payment.failed", (response: any) => {
        setError(`Payment failed: ${response.error.description}`)
        toast.error("Payment failed. Please try again.")
        setProcessing(false)
      })
      razorpay.open()
    } catch (err) {
      setError("Failed to initiate payment. Please try again.")
      toast.error("Failed to initiate payment. Please try again.")
      setProcessing(false)
    }
  }

  const handlePaymentSuccess = async (response: any) => {
    if (!user || !plan) { setProcessing(false); return }

    if (isReachProTopup) {
      // ReachPro topup — credit wallet via API
      const res = await fetch("/api/reachpro/recharge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amount: topupBase, paymentReference: response.razorpay_payment_id }),
      })
      const data = await res.json()
      if (data?.success) {
        toast.success("Wallet topped up successfully!")
        // Clean up topup keys
        localStorage.removeItem("reachpro_topup_amount")
        localStorage.removeItem("reachpro_topup_tax")
        localStorage.removeItem("reachpro_topup_total")
        localStorage.removeItem("reachpro_topup_tax_included")
        localStorage.removeItem("selected_plan_id")
        setTimeout(() => router.push("/dashboard/plans"), 1500)
      } else {
        setError(data?.error || "Wallet recharge failed. Contact support.")
        toast.error("Wallet recharge failed.")
      }
    } else {
      // Regular plan subscription
      const updatedUser = await api.users.update(user.id, {
        subscriptionPlanId: plan._id,
        subscriptionStatus: "active",
        subscriptionStartDate: new Date().toISOString(),
        subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      if (updatedUser) await api.auth.setCurrentUser(updatedUser)
      localStorage.setItem("subscriptionPaymentDetails", JSON.stringify({
        paymentId: response.razorpay_payment_id,
        planId: plan.id, planName: plan.name,
        amount: Math.round((basePrice || 0) * 1.18),
        timestamp: new Date().toISOString(),
      }))
      localStorage.setItem("loginedUser", JSON.stringify({
        ...loginedUserLocalStorageDetails,
        subscriptionPlanId: plan._id,
        subscriptionStatus: "active",
      }))
      toast.success("Payment successful! Your subscription is now active.")
      localStorage.removeItem("selected_plan_id")
      setTimeout(() => router.push("/dashboard/plans"), 1500)
    }
    setProcessing(false)
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading checkout...</p>
        </div>
      </div>
    )
  }

  if (!plan) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/dashboard/plans">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Plans
          </Button>
        </Link>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {/* Order Summary */}
          <Card className={isReachProTopup ? "border-purple-200" : ""}>
            <CardHeader>
              <CardTitle>{isReachProTopup ? "ReachPro Wallet Top-up" : "Order Summary"}</CardTitle>
              <CardDescription>
                {isReachProTopup ? "Review your wallet recharge details" : "Review your subscription details"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-b pb-4">
                <h3 className="font-semibold text-lg">
                  {isReachProTopup ? "ReachPro — Communication Add-on" : `${plan.name} Plan`}
                </h3>
                <p className="text-sm text-gray-600">
                  {isReachProTopup ? "Pay-as-you-go wallet for email & bulk messaging campaigns" : plan.description}
                </p>
              </div>
              {isReachProTopup ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Wallet top-up amount</span>
                    <span className="font-semibold">₹{topupBase.toLocaleString()}</span>
                  </div>
                  {topupTaxIncluded && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">GST (18%)</span>
                      <span className="font-semibold">₹{topupTax.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between text-lg font-bold">
                    <span>Total Payable</span>
                    <span>₹{topupTotal.toLocaleString()}</span>
                  </div>
                  {topupTaxIncluded && (
                    <p className="text-xs text-gray-400">
                      Your wallet will be credited ₹{topupBase.toLocaleString()} (excl. GST)
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold">₹{basePrice?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax (18% GST)</span>
                    <span className="font-semibold">₹{Math.round((basePrice || 0) * 0.18).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Previous plan Amount</span>
                    <span className="font-semibold">-₹{Math.round(((basePrice || 0) * 1.18)-amountFromPreviousSubscription)>0?amountFromPreviousSubscription:0}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>₹{(Math.round(((basePrice || 0) * 1.18)-amountFromPreviousSubscription)>0?Math.round(((basePrice || 0) * 1.18)-amountFromPreviousSubscription):Math.round((plan.price * 1.18)))}</span>
                  </div>
                </div>
              )}
              <div className={`p-4 rounded-lg ${isReachProTopup ? "bg-purple-50" : "bg-blue-50"}`}>
                <p className={`text-sm ${isReachProTopup ? "text-purple-900" : "text-blue-900"}`}>
                  <Lock className="inline h-4 w-4 mr-1" />
                  Secure payment powered by Razorpay
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Payment Section */}
          <Card>
            <CardHeader>
              <CardTitle>Complete Payment</CardTitle>
              <CardDescription>Secure checkout with Razorpay</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`p-6 rounded-lg border ${isReachProTopup ? "bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200" : "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200"}`}>
                <h3 className="font-semibold text-lg mb-2">
                  {isReachProTopup ? "Ready to top-up?" : "Ready to subscribe?"}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Click the button below to complete your payment securely through Razorpay.
                </p>
                <ul className="space-y-2 text-sm text-gray-600 mb-4">
                  <li className="flex items-center gap-2"><Lock className="h-4 w-4 text-blue-600" />256-bit SSL encryption</li>
                  <li className="flex items-center gap-2"><Lock className="h-4 w-4 text-blue-600" />PCI DSS compliant</li>
                  <li className="flex items-center gap-2"><Lock className="h-4 w-4 text-blue-600" />Multiple payment options</li>
                </ul>
              </div>
              <Button
                onClick={handlePayment}
                className={`w-full ${isReachProTopup ? "bg-purple-600 hover:bg-purple-700" : "bg-blue-600 hover:bg-blue-700"}`}
                size="lg"
                disabled={processing || !scriptLoaded}
              >
                {processing ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</>
                ) : !scriptLoaded ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading Payment Gateway...</>
                ) : isReachProTopup ? (
                  `Pay ₹${topupTotal.toLocaleString()} — Top-up Wallet`
                ) : (
                  `Pay ₹${((Math.round(((basePrice || 0) * 1.18)-amountFromPreviousSubscription)>0?Math.round(((basePrice || 0) * 1.18)-amountFromPreviousSubscription):Math.round(((basePrice || 0) * 1.18)))).toLocaleString()}`
                )}
              </Button>
              <p className="text-xs text-center text-gray-500">
                By completing this payment, you agree to our Terms of Service and Privacy Policy.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
