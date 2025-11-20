"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, Loader2 } from "lucide-react"
import { FeaturesSidebar } from "@/components/auth/features-sidebar"

declare global {
  interface Window {
    Razorpay: any
  }
}

export default function PaymentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [scriptLoaded, setScriptLoaded] = useState(false)

  const plan = searchParams.get("plan") || "standard"
  const planId = searchParams.get("planId") || ""
  const email = searchParams.get("email") || ""
  const companyName = searchParams.get("company") || ""
  const planAmount = searchParams.get("amount") || "0"
  const billingCycle = searchParams.get("billingCycle") || "monthly"

  // For trial period: charge only ₹1, but store the actual plan amount
  const trialAmount = 1 // ₹1 for trial
  const selectedPlan = {
    name: plan.charAt(0).toUpperCase() + plan.slice(1) + " Plan",
    trialPrice: trialAmount * 100, // ₹1 in paise for trial
    actualPrice: parseInt(planAmount) * 100, // Actual plan price in paise
    displayTrialPrice: `₹${trialAmount}`,
    displayActualPrice: `₹${planAmount}`,
    billingCycle: billingCycle === 'yearly' ? 'year' : 'month'
  }

  // Load Razorpay script
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
      document.body.removeChild(script)
    }
  }, [])

  const handlePayment = async () => {
    if (!scriptLoaded) {
      setError("Payment gateway is still loading. Please wait.")
      return
    }

    setLoading(true)
    setError("")

    try {
      // Charge only ₹1 for trial period
      const options = {
        key: "rzp_test_RVhlVFbaKUJJDH", // Test Key ID
        amount: selectedPlan.trialPrice, // ₹1 in paise (100 paise)
        currency: "INR",
        name: "Prantek Academy",
        description: `${selectedPlan.name} - 14 Day Trial (₹1)`,
        image: "https://31.97.224.169:9080/images/prantek-logo.png",
        prefill: {
          name: companyName,
          email: email,
        },
        theme: {
          color: "#9333ea", // Purple theme color
        },
        handler: (response: any) => {
          console.log("[v0] Payment successful:", response)
          // Payment successful
          handlePaymentSuccess(response)
        },
        modal: {
          ondismiss: () => {
            console.log("[v0] Payment modal closed")
            setLoading(false)
          },
        },
      }

      const razorpay = new window.Razorpay(options)
      razorpay.on("payment.failed", (response: any) => {
        console.error("[v0] Payment failed:", response.error)
        setError(`Payment failed: ${response.error.description}`)
        setLoading(false)
      })

      razorpay.open()
    } catch (err) {
      console.error("[v0] Payment error:", err)
      setError("Failed to initiate payment. Please try again.")
      setLoading(false)
    }
  }

  const handlePaymentSuccess = async (response: any) => {
    console.log("[v0] Processing payment success...")
    setLoading(true)
    
    try {
      // Get pending signup data
      const pendingSignupStr = localStorage.getItem("pending_signup")
      if (!pendingSignupStr) {
        console.error("[v0] No pending signup data found")
        setError("Signup data not found. Please try signing up again.")
        return
      }

      const signupData = JSON.parse(pendingSignupStr)
      console.log("[v0] Found pending signup data, creating account...")

      // Create account directly via register API
      const registerResponse = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signupData),
      })

      if (!registerResponse.ok) {
        const error = await registerResponse.json()
        setError(error.error || "Failed to create account")
        return
      }

      console.log("[v0] Account created successfully!")

      // Store payment details for reference
      localStorage.setItem(
        "paymentDetails",
        JSON.stringify({
          paymentId: response.razorpay_payment_id,
          orderId: response.razorpay_order_id || "",
          signature: response.razorpay_signature || "",
          plan: plan,
          timestamp: new Date().toISOString(),
        }),
      )

      // Clear all auth-related storage
      localStorage.removeItem("pending_signup")
      localStorage.removeItem("signup_state")
      sessionStorage.clear()
      
      // Remove any tokens that might have been set
      localStorage.removeItem("accessToken")
      localStorage.removeItem("refreshToken")
      localStorage.removeItem("auth_token")

      // Clear cookies
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({}),
        })
      } catch (logoutErr) {
        console.error("Error clearing cookies:", logoutErr)
      }

      // Single redirect to signin with success message
      console.log("[v0] Redirecting to signin...")
      window.location.replace("/signin?registered=true")
    } catch (err) {
      console.error("[v0] Error processing payment success:", err)
      setError("Failed to complete account creation. Please contact support.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      <FeaturesSidebar />
      
      {/* Right Side - Payment Form */}
      <div className="w-full lg:w-1/2 lg:ml-[50%] overflow-y-auto bg-white">
        <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">P</span>
          </div>
          <CardTitle className="text-2xl font-bold">Complete Your Payment</CardTitle>
          <CardDescription>Secure payment powered by Razorpay</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Plan Details */}
          <div className="bg-blue-50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Plan</span>
              <span className="font-semibold">{selectedPlan.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Company</span>
              <span className="font-semibold">{companyName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Email</span>
              <span className="font-semibold text-sm">{email}</span>
            </div>
            <div className="border-t border-blue-200 pt-3 mt-2">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-semibold text-green-800">Trial Payment (Today)</span>
                  <span className="text-xl font-bold text-green-600">{selectedPlan.displayTrialPrice}</span>
                </div>
                <p className="text-xs text-green-700">Start your 14-day free trial with just ₹1</p>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-sm font-semibold text-gray-700">Plan Amount</span>
                  <p className="text-xs text-gray-500">Auto-debit after trial ends</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-gray-900">{selectedPlan.displayActualPrice}</span>
                  <p className="text-xs text-gray-500">/{selectedPlan.billingCycle}</p>
                  {billingCycle === 'yearly' && (
                    <p className="text-xs text-green-600 font-semibold">
                      ₹{Math.round(parseInt(planAmount) / 12)}/month
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Button */}
          <Button onClick={handlePayment} className="w-full" disabled={loading || !scriptLoaded} size="lg">
            {loading ? (
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
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Pay {selectedPlan.displayTrialPrice} - Start Trial
              </>
            )}
          </Button>

          {/* Security Note */}
          <div className="text-center text-xs text-gray-500">
            <p>🔒 Secure payment powered by Razorpay</p>
            <p className="mt-1">Test Mode: Use test cards for payment</p>
          </div>

          {/* Back Link */}
          <div className="text-center text-sm">
            <button onClick={() => router.push('/signup')} className="text-purple-600 hover:underline">
              ← Back to plan selection
            </button>
          </div>
        </CardContent>
      </Card>
        </div>
      </div>
    </div>
  )
}
