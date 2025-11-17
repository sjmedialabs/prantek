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
import { User, Mail, Phone, MapPin, Save, CreditCard, Check, Zap, Edit2, X } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { api } from "@/lib/api-client"
import { ImageUpload } from "@/components/ui/image-upload"
import { toast } from "@/lib/toast"

interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price: number
  billingCycle: "monthly" | "yearly"
  features: string[]
}

export default function ProfilePage() {
  const { user } = useUser()
  const [saved, setSaved] = useState(false)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
    avatar: user?.avatar || "",
  })

  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null)
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([])
  const [showPlanDialog, setShowPlanDialog] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPlans()
    // Update profile data when user changes
    if (user) {
      setProfileData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        avatar: user.avatar || "",
      })
    }
  }, [user])

  const loadPlans = async () => {
    try {
      console.log("[Profile] Loading subscription plans...")
      const plans = await api.subscriptionPlans.getAll()
      console.log("[Profile] Available plans:", plans)
      setAvailablePlans(plans || [])

      if (user?.subscriptionPlanId) {
        console.log("[Profile] User has subscription plan ID:", user.subscriptionPlanId)
        const plan = await api.subscriptionPlans.getById(user.subscriptionPlanId)
        console.log("[Profile] Current plan:", plan)
        setCurrentPlan(plan || null)
      } else {
        console.log("[Profile] User has no subscription plan")
      }
    } catch (error) {
      console.error("[Profile] Error loading plans:", error)
      toast({ title: "Error", description: "Failed to load subscription plans", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!user) return
    
    try {
      const updateData = {
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        address: profileData.address,
        avatar: profileData.avatar,
      }
      
      console.log("[Profile] Saving profile data:", updateData)
      
      // Save profile data to backend via API
      const result = await api.users.update(user.id, updateData)
      
      console.log("[Profile] Save result:", result)
      
      toast({ title: "Success", description: "Profile updated successfully" })
      setIsEditingProfile(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      
      // Note: Removed auto-reload - you may need to manually refresh to see avatar in sidebar/header
    } catch (error) {
      console.error("[Profile] Error saving profile:", error)
      toast({ title: "Error", description: "Failed to update profile", variant: "destructive" })
    }
  }

  const handleCancelEdit = () => {
    // Reset to original user data
    if (user) {
      setProfileData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        avatar: user.avatar || "",
      })
    }
    setIsEditingProfile(false)
  }

  const handlePlanSelection = async (plan: SubscriptionPlan) => {
    if (!user) return

    try {
      const startDate = new Date()
      const endDate = new Date()
      endDate.setMonth(endDate.getMonth() + (plan.billingCycle === "yearly" ? 12 : 1))

      // Update user subscription via API
      await api.users.update(user.id, {
        subscriptionPlanId: plan.id,
        subscriptionStartDate: startDate.toISOString(),
        subscriptionEndDate: endDate.toISOString(),
      })

      setCurrentPlan(plan)
      setShowPlanDialog(false)
      toast({ title: "Success", description: `Successfully subscribed to ${plan.name} plan` })

      // Reload page to update user context
      window.location.reload()
    } catch (error) {
      console.error("Error updating subscription:", error)
      toast({ title: "Error", description: "Failed to update subscription plan", variant: "destructive" })
    }
  }

  const handleRemovePlan = async () => {
    if (!user || !currentPlan) return

    try {
      // Remove subscription via API
      await api.users.update(user.id, {
        subscriptionPlanId: null,
        subscriptionStartDate: null,
        subscriptionEndDate: null,
      })

      setCurrentPlan(null)
      toast({ title: "Success", description: "Subscription cancelled successfully" })

      // Reload page to update user context
      window.location.reload()
    } catch (error) {
      console.error("Error removing subscription:", error)
      toast({ title: "Error", description: "Failed to cancel subscription", variant: "destructive" })
    }
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

      {/* Profile Overview with Edit */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Profile Overview</CardTitle>
              <CardDescription>Your account information and personal details</CardDescription>
            </div>
            {!isEditingProfile ? (
              <Button onClick={() => setIsEditingProfile(true)} variant="outline" size="sm">
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button onClick={handleSaveProfile} size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button onClick={handleCancelEdit} variant="outline" size="sm">
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Picture and Basic Info */}
          <div className="flex items-start space-x-6">
            {isEditingProfile ? (
              <div className="space-y-2">
                <Label>Profile Picture</Label>
                <ImageUpload
                  value={profileData.avatar}
                  onChange={(value) => {
                    console.log("[Profile] Avatar updated:", value)
                    setProfileData({ ...profileData, avatar: value })
                  }}
                  previewClassName="w-24 h-24 rounded-full"
                  description="Upload your profile picture"
                  maxSizeMB={2}
                  allowedTypes={["image/*"]}
                />
              </div>
            ) : (
              <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center overflow-hidden">
                {profileData.avatar ? (
                  <img src={profileData.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="h-12 w-12 text-purple-600" />
                )}
              </div>
            )}
            <div className="flex-1 space-y-4">
              {isEditingProfile ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-name">
                        <User className="inline h-4 w-4 mr-1" />
                        Full Name
                      </Label>
                      <Input
                        id="edit-name"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-email">
                        <Mail className="inline h-4 w-4 mr-1" />
                        Email Address
                      </Label>
                      <Input
                        id="edit-email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        placeholder="your.email@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-phone">
                        <Phone className="inline h-4 w-4 mr-1" />
                        Phone Number
                      </Label>
                      <Input
                        id="edit-phone"
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        placeholder="+91 12345 67890"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-address">
                        <MapPin className="inline h-4 w-4 mr-1" />
                        Address
                      </Label>
                      <Input
                        id="edit-address"
                        value={profileData.address}
                        onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                        placeholder="Your address"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{profileData.name}</h3>
                    <p className="text-gray-600">{profileData.email}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">{user?.role?.replace("-", " ") || "User"}</Badge>
                    {currentPlan && <Badge variant="outline">{currentPlan.name} Plan</Badge>}
                  </div>
                </>
              )}
            </div>
          </div>

          {!isEditingProfile && (
            <>
              <Separator />
              
              {/* Contact Information */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Contact Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start space-x-3">
                    <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Phone Number</p>
                      <p className="font-medium text-gray-900">{profileData.phone || "Not provided"}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Address</p>
                      <p className="font-medium text-gray-900">{profileData.address || "Not provided"}</p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />
              
              {/* Account Information */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Account Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">User ID</p>
                    <p className="font-medium text-gray-900 font-mono text-xs">{user?.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Account Role</p>
                    <p className="font-medium text-gray-900 capitalize">{user?.role?.replace("-", " ") || "User"}</p>
                  </div>
                  {user?.subscriptionEndDate && (
                    <div>
                      <p className="text-sm text-gray-600">Subscription Expires</p>
                      <p className="font-medium text-gray-900">
                        {new Date(user.subscriptionEndDate).toLocaleDateString("en-IN", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  )}
                  {user?.subscriptionStatus && (
                    <div>
                      <p className="text-sm text-gray-600">Subscription Status</p>
                      <Badge
                        variant={user.subscriptionStatus === "active" ? "default" : "secondary"}
                        className="mt-1"
                      >
                        {user.subscriptionStatus}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Only show subscription management for account owners */}
      {!user?.isAdminUser && (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Subscription Plan</CardTitle>
              <CardDescription>Manage your subscription and billing</CardDescription>
            </div>
            {currentPlan ? (
              <div className="flex space-x-2">
                <Button onClick={() => setShowPlanDialog(true)} variant="outline">
                  <Zap className="h-4 w-4 mr-2" />
                  Upgrade Plan
                </Button>
                <Button onClick={handleRemovePlan} variant="destructive">
                  Cancel Plan
                </Button>
              </div>
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
      )}


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
              <div key="no-plans" className="col-span-3 text-center py-8">
                <p className="text-gray-600 mb-2">No subscription plans available</p>
                <p className="text-sm text-gray-500">
                  Please contact the administrator or check the super admin panel to create subscription plans.
                </p>
              </div>
            ) : (
              availablePlans.map((plan) => {
                const planId = plan.id || plan._id?.toString()
                const currentPlanId = currentPlan?.id || currentPlan?._id?.toString()
                const isCurrentPlan = currentPlanId === planId
                const isUpgrade = currentPlan && plan.price > currentPlan.price

                return (
                  <Card
                    key={planId}
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
