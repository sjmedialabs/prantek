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
  const[amountFromPreviousSubscription,setAmountFromPreviousSubscription]=useState(0);
   const loginedUserLocalStorageString = localStorage.getItem("loginedUser");

  const loginedUserLocalStorage = loginedUserLocalStorageString
  ? JSON.parse(loginedUserLocalStorageString)
  : null;

  useEffect(() => {
    const loadPlan = async () => {
      if (typeof window !== "undefined") {
        const planId = localStorage.getItem("selected_plan_id")
        // console.log("local stored planId is",loginedUserLocalStorage.subscriptionPlanId)
        if (!planId) {
          router.push("/dashboard/plans")
          return
        }

        try {
          const selectedPlan = await api.subscriptionPlans.getById(planId)
          const previousPlan=await api.subscriptionPlans.getById(loginedUserLocalStorage.subscriptionPlanId)
          console.log("Current Plan is:::",selectedPlan)
          if(loginedUserLocalStorage.subscriptionStatus!="trial"){
            // 2️⃣ Parse dates
            const subscriptionEndDate = new Date(loginedUserLocalStorage.subscriptionEndDate);
            const subscriptionStartDate = new Date(loginedUserLocalStorage.subscriptionStartDate);
            const currentDate = new Date();

            // 3️⃣ Calculate total days based on billingCycle (for fallback)
            let totalDays;
            if (previousPlan.billingCycle === "monthly") {
              totalDays = 30;
            } else if (previousPlan.billingCycle === "yearly") {
              totalDays = 365;
            } else {
              // default fallback
              totalDays = Math.ceil(
                (subscriptionEndDate - subscriptionStartDate) / (1000 * 60 * 60 * 24)
              );
            }

            // 4️⃣ Calculate days left in current plan
            const daysLeft = Math.max(
              Math.ceil((subscriptionEndDate - currentDate) / (1000 * 60 * 60 * 24)),
              0
            );

            console.log("Days that are left from the current plan:::",daysLeft)
            // 5️⃣ Calculate remaining balance
            const remainingBalance = Math.ceil((previousPlan.price * daysLeft) / totalDays);
            console.log("Saved amount from the previous plan:::",remainingBalance);
            setAmountFromPreviousSubscription(remainingBalance);
            // 6️⃣ Fetch new plan details
            // const newPlan = await api.subscriptionPlans.getById(selectedNewPlanId);

            // // 7️⃣ Final payable amount (cannot be negative)
            // const finalPayableAmount = Math.max(newPlan.price - remainingBalance, 0);

          }
          if (selectedPlan) {
            setPlan(selectedPlan)
          }
        } catch (error) {
          console.error("Failed to load plan:", error)
        } finally {
          setLoading(false)
        }
      }
    }
    loadPlan()
  }, [router])

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
      const totalAmount = Math.round(plan.price * 1.18)

      const options = {
        key: "rzp_test_RVhlVFbaKUJJDH", // Test Key ID
        amount: totalAmount * 100, // Amount in paise
        currency: "INR",
        name: "SaaS Platform",
        description: `${plan.name} Plan Subscription`,
        image: "https://31.97.224.169:9080/images/prantek-logo.png",
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
        },
        theme: {
          color: "#3b82f6", // Blue theme color
        },
        handler: (response: any) => {
          console.log("[v0] Payment successful:", response)
          handlePaymentSuccess(response)
        },
        modal: {
          ondismiss: () => {
            console.log("[v0] Payment modal closed")
            setProcessing(false)
          },
        },
      }

      const razorpay = new window.Razorpay(options)
      razorpay.on("payment.failed", (response: any) => {
        console.error("[v0] Payment failed:", response.error)
        setError(`Payment failed: ${response.error.description}`)
        toast.error("Payment failed. Please try again.")
        setProcessing(false)
      })

      razorpay.open()
    } catch (err) {
      console.error("[v0] Payment error:", err)
      setError("Failed to initiate payment. Please try again.")
      toast.error("Failed to initiate payment. Please try again.")
      setProcessing(false)
    }
  }

  const handlePaymentSuccess = async (response: any) => {
    if (user && plan) {
      const updatedUser = await api.users.update( user.id, {
        subscriptionPlanId: plan.id,
        subscriptionStatus: "active",
        subscriptionStartDate: new Date().toISOString(),
        subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })

      if (updatedUser) {
        await api.auth.setCurrentUser(updatedUser)
      }

      localStorage.setItem(
        "subscriptionPaymentDetails",
        JSON.stringify({
          paymentId: response.razorpay_payment_id,
          planId: plan.id,
          planName: plan.name,
          amount: Math.round(plan.price * 1.18),
          timestamp: new Date().toISOString(),
        }),
      )

      toast.success("Payment successful! Your subscription is now active.")
      localStorage.removeItem("selected_plan_id")

      setTimeout(() => {
        router.push("/dashboard/settings")
      }, 1500)
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
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
              <CardDescription>Review your subscription details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-b pb-4">
                <h3 className="font-semibold text-lg">{plan.name} Plan</h3>
                <p className="text-sm text-gray-600">{plan.description}</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">₹{plan.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax (18% GST)</span>
                  <span className="font-semibold">₹{Math.round(plan.price * 0.18).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Previous plan Amount</span>
                  <span className="font-semibold">-₹{amountFromPreviousSubscription}</span>
                </div>
                <div className="border-t pt-2 flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>₹{Math.round((plan.price * 1.18)-amountFromPreviousSubscription).toLocaleString()}</span>
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-900">
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
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-lg mb-2">Ready to subscribe?</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Click the button below to complete your payment securely through Razorpay.
                </p>
                <ul className="space-y-2 text-sm text-gray-600 mb-4">
                  <li className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-blue-600" />
                    256-bit SSL encryption
                  </li>
                  <li className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-blue-600" />
                    PCI DSS compliant
                  </li>
                  <li className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-blue-600" />
                    Multiple payment options
                  </li>
                </ul>
              </div>

              <Button
                onClick={handlePayment}
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
                disabled={processing || !scriptLoaded}
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : !scriptLoaded ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading Payment Gateway...
                  </>
                ) : (
                  `Pay ₹${Math.round(plan.price * 1.18).toLocaleString()}`
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
