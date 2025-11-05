"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, Loader2 } from "lucide-react"

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
  const email = searchParams.get("email") || ""
  const companyName = searchParams.get("company") || ""

  const planDetails = {
    standard: { name: "Standard Plan", price: 4900, displayPrice: "₹49" },
    premium: { name: "Premium Plan", price: 9900, displayPrice: "₹99" },
  }

  const selectedPlan = planDetails[plan as keyof typeof planDetails] || planDetails.standard

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
      // In production, you would create an order on your backend
      // For now, we'll use test mode with the provided credentials
      const options = {
        key: "rzp_test_RVhlVFbaKUJJDH", // Test Key ID
        amount: selectedPlan.price * 100, // Amount in paise (₹49 = 4900 paise)
        currency: "INR",
        name: "SaaS Platform",
        description: `${selectedPlan.name} Subscription`,
        image: "/images/prantek-logo.png",
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
    
    try {
      // Get pending signup data from localStorage
      const pendingSignupStr = localStorage.getItem("pending_signup")
      if (!pendingSignupStr) {
        console.error("[v0] No pending signup data found")
        setError("Signup data not found. Please try signing up again.")
        return
      }

      const signupData = JSON.parse(pendingSignupStr)
      console.log("[v0] Found pending signup data:", { email: signupData.email })

      // Call the account creation API
      const createAccountResponse = await fetch("/api/payment/verify-and-create-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          signupData,
          paymentId: response.razorpay_payment_id,
          razorpayOrderId: response.razorpay_order_id || "",
          razorpaySignature: response.razorpay_signature || "",
        }),
      })

      const result = await createAccountResponse.json()

      if (!result.success) {
        console.error("[v0] Account creation failed:", result.error)
        setError(result.error || "Failed to create account after payment")
        return
      }

      console.log("[v0] Account created successfully!")

      // Store tokens in localStorage
      if (result.accessToken) {
        localStorage.setItem("accessToken", result.accessToken)
      }
      if (result.refreshToken) {
        localStorage.setItem("refreshToken", result.refreshToken)
      }

      // Clear pending signup data
      localStorage.removeItem("pending_signup")

      // Store payment details for reference
      localStorage.setItem(
        "paymentDetails",
        JSON.stringify({
          paymentId: response.razorpay_payment_id,
          plan: plan,
          amount: selectedPlan.price,
          timestamp: new Date().toISOString(),
        }),
      )

      // Show success message and redirect to dashboard
      setTimeout(() => {
        router.push("/dashboard?signup=success")
      }, 2000)
    } catch (err) {
      console.error("[v0] Error processing payment success:", err)
      setError("Failed to complete account creation. Please contact support.")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100 p-4">
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
          <div className="bg-purple-50 rounded-lg p-4 space-y-2">
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
            <div className="border-t border-purple-200 pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total Amount</span>
                <span className="text-2xl font-bold text-purple-600">{selectedPlan.displayPrice}/month</span>
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
                Pay {selectedPlan.displayPrice}
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
            <button onClick={() => router.back()} className="text-purple-600 hover:underline">
              ← Back to signup
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
