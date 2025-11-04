"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api-client"
import { dataStore, type SubscriptionPlan } from "@/lib/data-store"
import { Check, Zap, Eye, EyeOff } from "lucide-react"
import { generateAccessToken, generateRefreshToken } from "@/lib/jwt"
import { tokenStorage } from "@/lib/token-storage"

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    address: "",
    freeTrial: false,
  })
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([])
  const [selectedPlan, setSelectedPlan] = useState<string>("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const plans = await dataStore.getActiveSubscriptionPlans()
        setAvailablePlans(plans)
        if (plans.length > 0) {
          setSelectedPlan(plans[0].id)
        }
      } catch (error) {
        console.error("Failed to load plans:", error)
      }
    }
    loadPlans()
  }, [])

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // Validate passwords match
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match")
        return
      }

      if (!selectedPlan) {
        setError("Please select a subscription plan")
        return
      }

      // Check if user already exists
      const existingUsers = await api.users.getAll()
      const userExists = existingUsers.some((u) => u.email === formData.email)

      if (userExists) {
        setError("An account with this email already exists")
        return
      }

      const plan = availablePlans.find((p) => p.id === selectedPlan)

      // Create new user with admin role
      const newUser = await api.users.create({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: "admin",
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        subscriptionPlanId: selectedPlan,
        subscriptionStatus: formData.freeTrial ? "trial" : "inactive",
        trialEndsAt: formData.freeTrial ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() : undefined,
      })

      const tokenPayload = {
        userId: newUser.id,
        email: newUser.email,
        role: "user" as const,
      }
      const accessToken = await generateAccessToken(tokenPayload)
      const refreshToken = await generateRefreshToken(tokenPayload)

      // Store tokens
      tokenStorage.setAccessToken(accessToken)
      tokenStorage.setRefreshToken(refreshToken)

      if (formData.freeTrial) {
        // Free trial flow: redirect to trial payment verification (₹1)
        router.push(`/trial-payment?email=${encodeURIComponent(formData.email)}`)
      } else {
        // Paid plan flow: redirect to payment page with selected plan
        router.push(
          `/payment?plan=${plan?.name.toLowerCase()}&email=${encodeURIComponent(formData.email)}&company=${encodeURIComponent(formData.name)}`,
        )
      }
    } catch (err) {
      setError("Failed to create account. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">P</span>
          </div>
          <CardTitle className="text-2xl font-bold">Create your account</CardTitle>
          <CardDescription>Start your financial management journey</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              <Label className="text-base font-semibold">Select Your Plan</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availablePlans.map((plan) => {
                  const isSelected = selectedPlan === plan.id
                  const isPopular = plan.name === "Premium"

                  return (
                    <Card
                      key={plan.id}
                      className={`relative cursor-pointer transition-all ${
                        isSelected ? "border-blue-600 border-2 shadow-md" : "border-gray-200 hover:border-blue-300"
                      }`}
                      onClick={() => setSelectedPlan(plan.id)}
                    >
                      {isPopular && <Badge className="absolute -top-2 -right-2 bg-blue-600 text-white">Popular</Badge>}
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-lg">{plan.name}</h3>
                            <p className="text-sm text-gray-600">{plan.description}</p>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              isSelected ? "border-blue-600 bg-blue-600" : "border-gray-300"
                            }`}
                          >
                            {isSelected && <Check className="h-3 w-3 text-white" />}
                          </div>
                        </div>
                        <div className="flex items-baseline space-x-1 mb-3">
                          <span className="text-2xl font-bold text-gray-900">₹{plan.price.toLocaleString()}</span>
                          <span className="text-gray-600 text-sm">/{plan.billingCycle}</span>
                        </div>
                        <div className="space-y-1">
                          {plan.features.slice(0, 3).map((feature, index) => (
                            <div key={index} className="flex items-start space-x-2">
                              <Check className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                              <span className="text-xs text-gray-700">{feature}</span>
                            </div>
                          ))}
                          {plan.features.length > 3 && (
                            <p className="text-xs text-gray-500 mt-1">+{plan.features.length - 3} more features</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="freeTrial"
                  checked={formData.freeTrial}
                  onCheckedChange={(checked) => setFormData({ ...formData, freeTrial: checked as boolean })}
                />
                <div className="flex-1">
                  <Label htmlFor="freeTrial" className="text-sm font-semibold cursor-pointer flex items-center">
                    <Zap className="h-4 w-4 mr-1 text-blue-600" />
                    Start with 14-day free trial (Optional)
                  </Label>
                  <p className="text-xs text-gray-600 mt-1">
                    Try all features free for 14 days. Only ₹1 verification required, refunded instantly.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={6}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading} size="lg">
              {loading ? "Creating account..." : "Create Account"}
            </Button>

            <div className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/signin" className="text-blue-600 hover:underline">
                Sign in
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
