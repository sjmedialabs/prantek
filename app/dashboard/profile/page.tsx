"use client"
import { useState, useEffect } from "react"
import { useUser } from "@/components/auth/user-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { User, Mail, Phone, MapPin, Save, CreditCard, Check, Zap } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { dataStore, type SubscriptionPlan } from "@/lib/data-store"
import { ImageUpload } from "@/components/ui/image-upload"

export default function ProfilePage() {
  const { user } = useUser()
  const [saved, setSaved] = useState(false)
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    address: "",
    avatar: "",
  })

  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null)
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([])
  const [showPlanDialog, setShowPlanDialog] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)

  useEffect(() => {
    const loadPlans = async () => {
      console.log("[v0] Profile page: Loading subscription plans...")
      const plans = await dataStore.getActiveSubscriptionPlans()
      console.log("[v0] Profile page: Available plans:", plans)
      console.log("[v0] Profile page: Number of plans:", plans.length)
      setAvailablePlans(plans)

      if (user?.subscriptionPlanId) {
        console.log("[v0] Profile page: User has subscription plan ID:", user.subscriptionPlanId)
        const plan = await dataStore.getById<SubscriptionPlan>("subscription_plans", user.subscriptionPlanId)
        console.log("[v0] Profile page: Current plan:", plan)
        setCurrentPlan(plan)
      } else {
        console.log("[v0] Profile page: User has no subscription plan")
      }
    }
    loadPlans()
  }, [user])

  const handleSave = async () => {
    // Save to backend
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handlePlanSelection = async (plan: SubscriptionPlan) => {
    if (!user) return

    const startDate = new Date()
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + (plan.billingCycle === "yearly" ? 12 : 1))

    await dataStore.update<any>("users", user.id, {
      subscriptionPlanId: plan.id,
      subscriptionStartDate: startDate.toISOString(),
      subscriptionEndDate: endDate.toISOString(),
    })

    setCurrentPlan(plan)
    setShowPlanDialog(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)

    // Reload page to update user context
    window.location.reload()
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-600">Manage your personal information and preferences</p>
      </div>

      {saved && (
        <Alert>
          <AlertDescription>Profile updated successfully!</AlertDescription>
        </Alert>
      )}

      {/* Profile Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Overview</CardTitle>
          <CardDescription>Your account information and role</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start space-x-6">
            <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center">
              <User className="h-12 w-12 text-purple-600" />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{user?.name}</h3>
                <p className="text-gray-600">{user?.email}</p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">{user?.role?.replace("-", " ") || "User"}</Badge>
                {currentPlan && <Badge variant="outline">{currentPlan.name} Plan</Badge>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Subscription Plan</CardTitle>
              <CardDescription>Manage your subscription and billing</CardDescription>
            </div>
            {currentPlan ? (
              <Button onClick={() => setShowPlanDialog(true)} variant="outline">
                <Zap className="h-4 w-4 mr-2" />
                Upgrade Plan
              </Button>
            ) : (
              <Button onClick={() => setShowPlanDialog(true)}>
                <CreditCard className="h-4 w-4 mr-2" />
                Buy Plan
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentPlan ? (
            <>
              <div className="flex items-start justify-between p-4 border rounded-lg bg-gradient-to-br from-purple-50 to-blue-50">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-semibold text-gray-900">{currentPlan.name} Plan</h3>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <p className="text-sm text-gray-600">{currentPlan.description}</p>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-2xl font-bold text-gray-900">₹{currentPlan.price.toLocaleString()}</span>
                    <span className="text-gray-600">/{currentPlan.billingCycle}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Plan Features</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {currentPlan.features.map((feature, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {user?.subscriptionEndDate && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-gray-600">
                    Subscription renews on:{" "}
                    <span className="font-semibold">
                      {new Date(user.subscriptionEndDate).toLocaleDateString("en-IN")}
                    </span>
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Plan</h3>
              <p className="text-gray-600 mb-4">Subscribe to a plan to unlock premium features</p>
              <Button onClick={() => setShowPlanDialog(true)}>
                <CreditCard className="h-4 w-4 mr-2" />
                Browse Plans
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </div>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <ImageUpload
            label="Profile Picture"
            value={profileData.avatar}
            onChange={(value) => setProfileData({ ...profileData, avatar: value })}
            description="Upload a profile picture (PNG, JPG) or provide a URL"
            previewClassName="w-20 h-20 rounded-full"
          />

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                <User className="inline h-4 w-4 mr-1" />
                Full Name
              </Label>
              <Input
                id="name"
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                placeholder="Enter your full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                <Mail className="inline h-4 w-4 mr-1" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                placeholder="your.email@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">
                <Phone className="inline h-4 w-4 mr-1" />
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                placeholder="+91 12345 67890"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">
                <MapPin className="inline h-4 w-4 mr-1" />
                Address
              </Label>
              <Input
                id="address"
                value={profileData.address}
                onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                placeholder="Your address"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your account details and permissions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">User ID</p>
              <p className="font-semibold">{user?.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Role</p>
              <p className="font-semibold">{user?.role?.replace("-", " ") || "User"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{currentPlan ? "Upgrade Your Plan" : "Choose Your Plan"}</DialogTitle>
            <DialogDescription>
              {currentPlan ? "Select a plan to upgrade your subscription" : "Select a plan that best fits your needs"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {availablePlans.length === 0 ? (
              <div className="col-span-3 text-center py-8">
                <p className="text-gray-600 mb-2">No subscription plans available</p>
                <p className="text-sm text-gray-500">
                  Please contact the administrator or check the super admin panel to create subscription plans.
                </p>
              </div>
            ) : (
              availablePlans.map((plan) => {
                const isCurrentPlan = currentPlan?.id === plan.id
                const isUpgrade = currentPlan && plan.price > currentPlan.price

                return (
                  <Card
                    key={plan.id}
                    className={`relative ${isCurrentPlan ? "border-purple-500 border-2" : ""} ${isUpgrade ? "shadow-lg" : ""}`}
                  >
                    {isCurrentPlan && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge variant="default">Current Plan</Badge>
                      </div>
                    )}
                    {isUpgrade && !isCurrentPlan && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-gradient-to-r from-purple-600 to-blue-600">Recommended</Badge>
                      </div>
                    )}

                    <CardHeader>
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                      <div className="flex items-baseline space-x-1 mt-4">
                        <span className="text-3xl font-bold text-gray-900">₹{plan.price.toLocaleString()}</span>
                        <span className="text-gray-600">/{plan.billingCycle}</span>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        {plan.features.map((feature, index) => (
                          <div key={index} className="flex items-start space-x-2">
                            <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-700">{feature}</span>
                          </div>
                        ))}
                      </div>

                      <Button
                        className="w-full"
                        variant={isCurrentPlan ? "outline" : isUpgrade ? "default" : "secondary"}
                        disabled={isCurrentPlan}
                        onClick={() => handlePlanSelection(plan)}
                      >
                        {isCurrentPlan ? "Current Plan" : isUpgrade ? "Upgrade Now" : "Select Plan"}
                      </Button>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
