"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Pencil, Power, PowerOff, Search, TrendingUp, Users, DollarSign, CheckCircle, XCircle } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/api-client"
import PlanFeatureMatrix from "@/components/super-admin/plan-feature-matrix"

export default function SubscriptionPlansPage() {
  const [plans, setPlans] = useState<any[]>([])
  const [editingPlan, setEditingPlan] = useState<any>(null)
  const [newPlan, setNewPlan] = useState({
    name: "",
    price: 0,
    billingCycle: "monthly",
    maxUsers: 0,
    maxStorage: "",
    features: [] as string[],
    isActive: true,
  })
  const [newFeature, setNewFeature] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [users,setUsers]=useState<any>([]);
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    const data = await api.subscriptionPlans.getAll()
    const loadusers = await api.users.getAll()
    
    // Enrich plans with subscriber count and revenue
    const enrichedPlans = data.map((plan: any) => {
      // Count subscribers for this plan (only subscriber-type users)
      const subscribers = loadusers.filter(
        (user: any) => user.userType === "subscriber" && user.role !== "super-admin" && user.subscriptionPlanId === (plan._id || plan.id)
      )
      
      const subscriberCount = subscribers.length
      const revenue = subscriberCount * Number(plan.price || 0)
      
      return {
        ...plan,
        subscriberCount,
        revenue
      }
    })
    
    setPlans(enrichedPlans)
    setUsers(loadusers)
    setLoading(false)
  }
  const calculateTotalRevenue = () => {
  if (!plans.length || !users.length) return 0;

  // Only count revenue from subscribers, not admin users
  const subscriberUsers = users.filter((user: any) => user.userType === "subscriber" && user.role !== "super-admin");

  let total = 0;

  subscriberUsers.forEach((user: any) => {
    const userPlan = plans.find((plan: any) => plan._id === user.subscriptionPlanId);
    if (userPlan && userPlan.price) {
      total += Number(userPlan.price);
    }
  });

  return total;
};


  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!newPlan.name.trim()) newErrors.name = "Plan name is required"
    if (!newPlan.price || newPlan.price <= 0) newErrors.price = "Price must be greater than 0"
    if (!newPlan.billingCycle) newErrors.billingCycle = "Billing cycle is required"
    if (!newPlan.maxUsers || newPlan.maxUsers <= 0) newErrors.maxUsers = "Max users must be greater than 0"
    if (!newPlan.maxStorage || !newPlan.maxStorage.trim()) newErrors.maxStorage = "Storage limit is required"
    if (newPlan.features.length === 0) newErrors.features = "At least one feature is required"
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleCreatePlan = async () => {
    if (!validateForm()) {
      toast.error("Please fix the errors in the form")
      return
    }

    const plan = await api.subscriptionPlans.create({
      ...newPlan,
      subscriberCount: 0,
      revenue: 0,
    })
    
    setPlans([...plans, plan])
    resetForm()
    toast.success("Subscription plan created successfully")
  }

  const handleEditPlan = (plan: any) => {
    setEditingPlan(plan)
    setNewPlan({
      name: plan.name,
      price: plan.price,
      billingCycle: plan.billingCycle,
      maxUsers: plan.maxUsers,
      maxStorage: plan.maxStorage,
      features: plan.features || [],
      isActive: plan.isActive,
    })
    setErrors({})
    setIsCreateDialogOpen(true)
  }

  const handleUpdatePlan = async () => {
    if (!validateForm()) {
      toast.error("Please fix the errors in the form")
      return
    }

    const id = editingPlan._id || editingPlan.id
    await api.subscriptionPlans.update(id, newPlan)
    setPlans(plans.map(p => (p._id || p.id) === id ? { ...newPlan, _id: id, id, subscriberCount: p.subscriberCount, revenue: p.revenue } : p))
    resetForm()
    toast.success("Subscription plan updated successfully")
  }

  const handleTogglePlanStatus = async (planId: string) => {
    const plan = plans.find((p) => p.id === planId || p._id === planId)
    if (plan) {
      const id = plan._id || plan.id
      await api.subscriptionPlans.update(id, { isActive: !plan.isActive })
      setPlans(plans.map((p) => (p._id === id || p.id === planId ? { ...p, isActive: !p.isActive } : p)))
      toast.success(`Plan ${plan.isActive ? "disabled" : "enabled"} successfully`)
    }
  }

  const resetForm = () => {
    setNewPlan({
      name: "",
      price: 0,
      billingCycle: "monthly",
      maxUsers: 0,
      maxStorage: "",
      features: [],
      isActive: true,
    })
    setEditingPlan(null)
    setErrors({})
    setIsCreateDialogOpen(false)
  }

  const addFeature = () => {
    if (newFeature.trim()) {
      setNewPlan({ ...newPlan, features: [...newPlan.features, newFeature.trim()] })
      setNewFeature("")
      if (errors.features) setErrors({ ...errors, features: "" })
    }
  }

  const removeFeature = (index: number) => {
    setNewPlan({ ...newPlan, features: newPlan.features.filter((_, i) => i !== index) })
  }

  const filteredPlans = plans.filter(
    (plan) =>
      plan.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalRevenue = calculateTotalRevenue()

  const totalSubscribers = users.filter((user: any) => user.userType === "subscriber" && user.role !== "super-admin" && user.subscriptionPlanId).length;

  const activePlans = plans.filter((plan) => plan.isActive).length

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscription Plans</h1>
          <p className="text-sm text-gray-500">Manage your subscription plans and pricing</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => { setIsCreateDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPlan ? "Edit Plan" : "Create New Plan"}</DialogTitle>
              <DialogDescription>
                {editingPlan ? "Update the subscription plan details" : "Add a new subscription plan for your customers"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Plan Name *</Label>
                <Input
                  placeholder="Plan Name"
                  value={newPlan.name}
                  onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Price (₹) *</Label>
                  <Input
                    type="number"
                    placeholder="Price"
                    value={newPlan.price || ""}
                    onChange={(e) => setNewPlan({ ...newPlan, price: Number(e.target.value) })}
                    className={errors.price ? "border-red-500" : ""}
                  />
                  {errors.price && <p className="text-sm text-red-500 mt-1">{errors.price}</p>}
                </div>
                <div>
                  <Label>Billing Cycle *</Label>
                  <Select
                    value={newPlan.billingCycle}
                    onValueChange={(value) => setNewPlan({ ...newPlan, billingCycle: value })}
                  >
                    <SelectTrigger className={errors.billingCycle ? "border-red-500" : ""}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.billingCycle && <p className="text-sm text-red-500 mt-1">{errors.billingCycle}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Max Users *</Label>
                  <Input
                    type="number"
                    placeholder="Max Users"
                    value={newPlan.maxUsers || ""}
                    onChange={(e) => setNewPlan({ ...newPlan, maxUsers: Number(e.target.value) })}
                    className={errors.maxUsers ? "border-red-500" : ""}
                  />
                  {errors.maxUsers && <p className="text-sm text-red-500 mt-1">{errors.maxUsers}</p>}
                </div>
                <div>
                  <Label>Storage Limit *</Label>
                  <Input
                    placeholder="e.g., 10GB"
                    value={newPlan.maxStorage}
                    onChange={(e) => setNewPlan({ ...newPlan, maxStorage: e.target.value })}
                    className={errors.maxStorage ? "border-red-500" : ""}
                  />
                  {errors.maxStorage && <p className="text-sm text-red-500 mt-1">{errors.maxStorage}</p>}
                </div>
              </div>
              <div>
                <Label>Features *</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a feature"
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())}
                  />
                  <Button type="button" onClick={addFeature} variant="outline">
                    Add
                  </Button>
                </div>
                {errors.features && <p className="text-sm text-red-500 mt-1">{errors.features}</p>}
                <div className="flex flex-wrap gap-2 mt-2">
                  {newPlan.features.map((feature, index) => (
                    <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeFeature(index)}>
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label>Active Plan</Label>
                <Switch
                  checked={newPlan.isActive}
                  onCheckedChange={(checked) => setNewPlan({ ...newPlan, isActive: checked })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button onClick={editingPlan ? handleUpdatePlan : handleCreatePlan}>
                  {editingPlan ? "Update Plan" : "Create Plan"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSubscribers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Plans</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePlans}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Plans</TabsTrigger>
          <TabsTrigger value="features">Feature Management</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search plans..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Subscribers</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Features</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlans.map((plan) => (
                  <TableRow key={plan._id || plan.id}>
                    <TableCell>
                      <div className="font-medium">{plan.name}</div>
                    </TableCell>
                    <TableCell>
                      <div>₹{plan.price}</div>
                      <div className="text-sm text-gray-500">per {plan.billingCycle}</div>
                    </TableCell>
                    <TableCell>{plan.subscriberCount || 0}</TableCell>
                    <TableCell>₹{(plan.revenue || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={plan.isActive ? "default" : "secondary"}>
                        {plan.isActive ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Inactive
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {plan.features?.slice(0, 2).join(", ")}
                        {plan.features?.length > 2 && ` +${plan.features.length - 2} more`}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEditPlan(plan)}>
                          <Pencil className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTogglePlanStatus(plan._id || plan.id)}
                          className={plan.isActive ? "text-red-600" : "text-green-600"}
                        >
                          {plan.isActive ? (
                            <>
                              <PowerOff className="h-4 w-4 mr-1" />
                              Disable
                            </>
                          ) : (
                            <>
                              <Power className="h-4 w-4 mr-1" />
                              Enable
                            </>
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <PlanFeatureMatrix />
        </TabsContent>
      </Tabs>
    </div>
  )
}
