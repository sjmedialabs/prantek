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
import { User, Mail, Phone, MapPin, Save, CreditCard, Check, Zap, Edit2, X, History, PlusCircle, Info, MessageSquare, AlertCircle } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { api } from "@/lib/api-client"
import { ImageUpload } from "@/components/ui/image-upload"
import { toast } from "@/lib/toast"
import { useRouter } from "next/navigation"
import Link from "next/link"

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
  const router = useRouter()
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null)
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([])
  const [showPlanDialog, setShowPlanDialog] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [yearlyDiscount, setYearlyDiscount] = useState(17);
  const loginedUserLocalStorageString = localStorage.getItem("loginedUser");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const loginedUserLocalStorage = loginedUserLocalStorageString
    ? JSON.parse(loginedUserLocalStorageString)
    : null;
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    plan: string
    status: string
    autoDebit: boolean
    nextBillingDate: string | null
    daysRemaining: number
    paymentHistory: { id: string; amount: number; currency: string; status: string; date: string }[]
  } | null>(null)
  const [cancelling, setCancelling] = useState(false)

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
    console.log("[Profile] User data loaded:", user)
  }, [user])

  const [reachProPlan, setReachProPlan] = useState<any>(null)

  const loadPlans = async () => {
    try {
      console.log("[Profile] Loading subscription plans...")
      const plans = await api.subscriptionPlans.getAll()
      console.log("[Profile] Available plans:", plans)
      setAvailablePlans(plans || [])

      const activeUser = await api.users.getById(loginedUserLocalStorage.id);
      setCurrentUser(activeUser);

      // Separate ReachPro plan from regular plans
      const rpPlan = (plans || []).find((p: any) =>
        String(p.name || "").toLowerCase() === "reachpro" || p.isPayAsYouGo
      ) || null
      setReachProPlan(rpPlan)

      if (user?.subscriptionPlanId) {
        console.log("[Profile] User has subscription plan ID:", user.subscriptionPlanId, user.id)
        const plan = await api.subscriptionPlans.getById(user.subscriptionPlanId)
        console.log("[Profile] Current plan:", plan)
        setCurrentPlan(plan || null)
      } else {
        console.log("[Profile] User has no subscription plan")
      }

      // Fetch system settings for discount
      const settingsResponse = await fetch('/api/system-settings');
      const settingsData = await settingsResponse.json();
      if (settingsData.success && settingsData.data.yearlyDiscountPercentage) {
        setYearlyDiscount(settingsData.data.yearlyDiscountPercentage);
      }

    } catch (error) {
      console.error("[Profile] Error loading plans:", error)
      toast({ title: "Error", description: "Failed to load subscription plans", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const [reachProTransactions, setReachProTransactions] = useState<any[]>([])
  const [reachProMeta, setReachProMeta] = useState<any>(null)

  useEffect(() => {
    fetch("/api/reachpro/transactions", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setReachProMeta(data)
          setReachProTransactions(data.data || [])
        }
      })
      .catch((err) => console.error("Error fetching transactions:", err))
  }, [])

  useEffect(() => {
    if (!user?.id) return
    fetch("/api/user/subscription", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setSubscriptionStatus(data)
      })
      .catch(() => setSubscriptionStatus(null))
  }, [user?.id])

  const handleCancelSubscription = async () => {
    if (!confirm("Cancel subscription? You will retain access until the end of the current billing period.")) return
    setCancelling(true)
    try {
      const res = await fetch("/api/user/subscription/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ cancelAtCycleEnd: true }),
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: "Success", description: data.message })
        setSubscriptionStatus((prev) => (prev ? { ...prev, status: "cancelled", autoDebit: false } : null))
        loadPlans()
      } else toast({ title: "Error", description: data.error || "Failed to cancel", variant: "destructive" })
    } catch {
      toast({ title: "Error", description: "Failed to cancel subscription", variant: "destructive" })
    } finally {
      setCancelling(false)
    }
  }

  const isSubscriptionExpired = () => {
    if (!user || !user.subscriptionPlanId) {
      return false; // Don't show if no plan was ever selected
    }
    const status = user.subscriptionStatus
    const now = new Date()

    if (status === "trial") {
      if (!user.trialEndsAt) return false // Not expired, just invalid data
      return new Date(user.trialEndsAt) < now
    }

    if (status === "active" || status === "cancelled") {
      if (!user.subscriptionEndDate) return false // Not expired, just invalid data
      return new Date(user.subscriptionEndDate) < now
    }

    if (status === 'expired' || status === 'inactive') {
      return true;
    }

    return false
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
      console.log("[PLANS] Selected plan:", plan._id)
      // Store selected plan and redirect to payment
      if (typeof window !== "undefined") {
        localStorage.setItem("selected_plan_id", plan._id)
        console.log("Stored selected_plan_id in localStorage:", localStorage.getItem("selected_plan_id"))
        router.push("/dashboard/checkout")
      }
    } catch (error) {
      console.error("Error updating subscription:", error)
      toast({ title: "Error", description: "Failed to update subscription plan", variant: "destructive" })
    }
  }

  const handleRemovePlan = async () => {
    if (!user || !currentPlan) return

    try {
      // Cancel subscription but maintain access until end date
      await api.users.update(user.id, {
        subscriptionStatus: "cancelled",
      })

      toast({ title: "Success", description: "Subscription cancelled. You can use your plan until the end date." })

      setCurrentPlan(null)

    } catch (error) {
      console.error("Error removing subscription:", error)
      toast({ title: "Error", description: "Failed to cancel subscription", variant: "destructive" })
    }
  }


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-600">Manage your personal information and preferences</p>
      </div>

      {isSubscriptionExpired() && (
        <Alert variant="destructive">
          <AlertDescription>
            Your trial or subscription has ended. Please select a new plan to continue using all features.
          </AlertDescription>
        </Alert>
      )}

      {saved && (
        <Alert>
          <AlertDescription>Profile updated successfully!</AlertDescription>
        </Alert>
      )}

      {/* Profile Overview with Edit */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center gap-2 items-start justify-between">
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
          <div className="flex flex-col md:flex-row items-start space-x-6">
            {isEditingProfile ? (
              <div className="space-y-2 w-65 md:w-auto">
                <Label>Profile Picture</Label>
                <ImageUpload
                  value={profileData.avatar}
                  onChange={(value) => {
                    console.log("[Profile] Avatar updated:", value)
                    setProfileData({ ...profileData, avatar: value })
                  }}
                  previewClassName="w-16 md:w-24 h-24 rounded-full"
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

      {/* ReachPro Communication Wallet Section */}
      {(currentUser?.reachProEnabled || (currentUser?.walletBalance ?? 0) > 0) && (
        <Card className="border-emerald-200">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <CardTitle>ReachPro Communication Wallet</CardTitle>
                  <CardDescription>Manage your communication credits and campaign settings</CardDescription>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => {
                  const element = document.getElementById('reachpro-transactions');
                  element?.scrollIntoView({ behavior: 'smooth' });
                }}>
                  <History className="h-4 w-4 mr-2" />
                  View History
                </Button>
                <Link href="/dashboard/plans">
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Recharge Wallet
                  </Button>
                </Link>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Wallet Status Alerts */}
            {(currentUser?.walletBalance ?? 0) === 0 ? (
              <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
                <Info className="h-4 w-4" />
                <AlertDescription className="font-semibold">
                  Recharge Required: Your wallet balance is zero. All communication features (Email/WhatsApp) are currently disabled.
                </AlertDescription>
              </Alert>
            ) : (currentUser?.walletBalance ?? 0) < Math.max(reachProPlan?.costPerEmailCampaign ?? 1, reachProPlan?.costPerBulkMessageCampaign ?? 1) && (
              <Alert className="bg-amber-50 border-amber-200 text-amber-800">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="font-semibold">
                  Low ReachPro Balance: Your balance is insufficient for some campaign types. Please recharge to avoid service interruption.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border bg-gradient-to-br from-emerald-50 to-white shadow-sm">
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">Current Balance</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-gray-900">₹{Number(reachProMeta?.walletBalance ?? currentUser?.walletBalance ?? 0).toLocaleString()}</span>
                  <Badge variant={Number(reachProMeta?.remainingMailCredits || 0) > 200 ? "secondary" : "destructive"} className="ml-2">
                    {Number(reachProMeta?.remainingMailCredits || 0) <= 0 ? "Empty" : Number(reachProMeta?.remainingMailCredits || 0) < 200 ? "Low" : "Active"}
                  </Badge>
                </div>
              </div>
              <div className="p-4 rounded-xl border bg-white shadow-sm">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Remaining Mail Credits</p>
                <p className="text-2xl font-bold text-gray-900">{Number(reachProMeta?.remainingMailCredits || 0).toLocaleString()}</p>
              </div>
              <div className="p-4 rounded-xl border bg-white shadow-sm">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Recharged</p>
                <p className="text-2xl font-bold text-gray-900">₹{(currentUser?.totalRechargeAmount ?? 0).toLocaleString()}</p>
                {/* <p className="text-[10px] text-gray-500 mt-1">Initial: ₹{(currentUser?.reachProTopupAmount ?? 0).toLocaleString()}</p> */}
              </div>
              <div className="p-4 rounded-xl border bg-white shadow-sm">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Campaign Costs</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Current Rate:</span>
                    <span className="font-bold">₹{Number(reachProMeta?.currentCostPerMail || 0)}/mail</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Purchased Credits:</span>
                    <span className="font-bold">{Number(reachProMeta?.totalPurchasedMailCredits || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-xl border bg-white shadow-sm">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Wallet Settings</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax Included:</span>
                    <Badge variant="outline" className="text-[10px] h-4">
                      {reachProPlan?.taxIncluded ? "Yes" : "No"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Min Top-up:</span>
                    <span className="font-medium text-emerald-700">₹{reachProPlan?.minTopupAmount ?? 300}</span>
                  </div>
                  <div className="flex justify-between mt-1 pt-1 border-t border-gray-100">
                    <span className="text-gray-600">Last Recharge:</span>
                    <span className="font-medium">{currentUser?.lastRechargeAt ? new Date(currentUser.lastRechargeAt).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ReachPro Transactions Section */}
            <div id="reachpro-transactions" className="pt-4">
              <div className="flex items-center gap-2 mb-4">
                <History className="h-4 w-4 text-gray-500" />
                <h4 className="text-sm font-semibold text-gray-900">ReachPro Transaction History</h4>
              </div>
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left p-3 font-semibold">Date</th>
                      <th className="text-left p-3 font-semibold">Type</th>
                      <th className="text-left p-3 font-semibold">Amount</th>
                      <th className="text-left p-3 font-semibold">Tax</th>
                      <th className="text-left p-3 font-semibold">Balance After</th>
                      <th className="text-left p-3 font-semibold">Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {reachProTransactions.length > 0 ? (
                      reachProTransactions.map((tx: any, idx: number) => (
                        <tr key={tx._id || idx} className="hover:bg-gray-50 transition-colors">
                          <td className="p-3 text-gray-600">{new Date(tx.createdAt).toLocaleDateString()}</td>
                          <td className="p-3">
                            <Badge variant="outline" className={
                              tx.type === 'recharge' ? 'bg-emerald-50 text-emerald-700' :
                                tx.type?.includes('email') ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                            }>
                              {String(tx.type || "").replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                            </Badge>
                          </td>
                          <td className={`p-3 font-medium ${tx.type === 'recharge' ? 'text-emerald-600' : 'text-gray-900'}`}>
                            {tx.type === 'recharge' ? '+' : '-'}₹{Number(tx.amount || 0).toLocaleString()}
                          </td>
                          <td className="p-3 text-gray-500">₹{Number(tx.taxAmount || 0).toLocaleString()}</td>
                          <td className="p-3 font-semibold">₹{Number(tx.balanceAfter || 0).toLocaleString()}</td>
                          <td className="p-3 text-xs font-mono text-gray-400">{tx.referenceId || tx.reference || 'N/A'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-500">
                          No ReachPro transactions found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Only show subscription management for account owners */}
      {!user?.isAdminUser && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Subscription Plan</CardTitle>
                <CardDescription>Manage your subscription and billing</CardDescription>
              </div>
              {currentPlan && user?.subscriptionStatus === "active" ? (
                <div className="flex space-x-2">
                  <Link href="/dashboard/plans">
                    <Button variant="outline">
                      <Zap className="h-4 w-4 mr-2" />
                      Upgrade Plan
                    </Button>
                  </Link>
                  {/* <Button onClick={handleRemovePlan} variant="destructive">
                  Cancel Plan
                </Button> */}
                </div>
              ) : (
                <Link href="/dashboard/plans">
                  <Button>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Buy Plan
                  </Button>
                </Link>
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
                      <Badge variant="default">{user?.subscriptionStatus}</Badge>
                    </div>
                    <p className="text-sm text-gray-600">{currentPlan.description}</p>
                    {(() => {
                      if (!currentPlan) return null

                      const userCycle = currentUser?.billingCycle || "monthly";
                      const isYearly = userCycle === "yearly";
                      // Use stored values if available, else calculate based on current plan and cycle
                      const price = user?.subscriptionPrice ?? (isYearly ? currentPlan.price * 12 : currentPlan.price);
                      const paid = user?.paidAmount ?? (isYearly ? Math.round(price * (1 - yearlyDiscount / 100)) : price);
                      const discount = user?.discountPercentage ?? (isYearly ? yearlyDiscount : 0);

                      return (
                        <>
                          {isYearly ? (
                            <div>
                              <div className="mb-1">
                                <span className="text-sm line-through text-gray-400">
                                  ₹{price.toLocaleString()}
                                </span>
                                {discount > 0 && <span className="ml-2 text-xs text-green-600">({discount}% off)</span>}
                              </div>
                              <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-gray-900">₹{paid.toLocaleString()}</span>
                                <span className="text-gray-600">/year</span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-bold text-gray-900">₹{paid.toLocaleString()}</span>
                              <span className="text-gray-600">/month</span>
                            </div>
                          )}
                        </>
                      )
                    })()}
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

                {subscriptionStatus && (
                  <>
                    <Separator className="my-4" />
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Billing & auto-debit</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">Status</span>
                        <p className="font-medium capitalize">{subscriptionStatus.status}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Billing type</span>
                        <p className="font-medium">{subscriptionStatus.autoDebit ? "Auto Debit" : "Manual"}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Next billing date</span>
                        <p className="font-medium">
                          {subscriptionStatus.nextBillingDate
                            ? new Date(subscriptionStatus.nextBillingDate).toLocaleDateString("en-IN")
                            : "—"}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Days remaining</span>
                        <p className="font-medium">{subscriptionStatus.daysRemaining ?? "—"}</p>
                      </div>
                    </div>
                    {subscriptionStatus.paymentHistory && subscriptionStatus.paymentHistory.length > 0 && (
                      <>
                        <h4 className="text-sm font-semibold text-gray-900 mt-4 mb-2">Payment history</h4>
                        <div className="border rounded-md overflow-hidden">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-gray-50 border-b">
                                <th className="text-left p-2">Date</th>
                                <th className="text-left p-2">Amount</th>
                                <th className="text-left p-2">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {subscriptionStatus.paymentHistory.map((p) => (
                                <tr key={p.id} className="border-b last:border-0">
                                  <td className="p-2">
                                    {p.date ? new Date(p.date).toLocaleDateString("en-IN") : "—"}
                                  </td>
                                  <td className="p-2">
                                    {p.currency === "INR" ? "₹" : p.currency}{" "}
                                    {Number(p.amount).toLocaleString()}
                                  </td>
                                  <td className="p-2">
                                    <Badge variant={p.status === "success" ? "default" : "secondary"}>
                                      {p.status}
                                    </Badge>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                    {(subscriptionStatus.status === "active" || subscriptionStatus.status === "trial") &&
                      subscriptionStatus.autoDebit && (
                        <div className="mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCancelSubscription}
                            disabled={cancelling}
                          >
                            {cancelling ? "Cancelling…" : "Cancel subscription"}
                          </Button>
                        </div>
                      )}
                  </>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Plan</h3>
                <p className="text-gray-600 mb-4">Subscribe to a plan to unlock premium features</p>
                <Link href="/dashboard/plans">
                  <Button>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Browse Plans
                  </Button>
                </Link>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
