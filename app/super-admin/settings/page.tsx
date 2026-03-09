"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Settings, Save, Calendar, Percent } from "lucide-react"

export default function SuperAdminSettingsPage() {
  const [settings, setSettings] = useState({
    defaultTrialDays: "14",
    yearlyDiscountPercentage: "17",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Load trial period from API
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/system-settings')
        const data = await response.json()
        if (data.success && data.data.trialPeriodDays) {
          setSettings({
            defaultTrialDays: String(data.data.trialPeriodDays),
            yearlyDiscountPercentage: String(data.data.yearlyDiscountPercentage || 17),
          })
        }
      } catch (error) {
        console.error('Error loading settings:', error)
        toast.error('Failed to load settings')
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [])

  const handleSettingChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Validate input
      const trialDays = parseInt(settings.defaultTrialDays)
      const discount = parseInt(settings.yearlyDiscountPercentage)

      if (isNaN(trialDays) || trialDays < 1 || trialDays > 365) {
        toast.error('Trial period must be between 1 and 365 days')
        setSaving(false)
        return
      }

      if (isNaN(discount) || discount < 0 || discount > 100) {
        toast.error("Yearly discount must be between 0 and 100 percent")
        setSaving(false)
        return
      }

      // Save trial period to API (no auth header needed - accessed from super-admin route)
      const response = await fetch('/api/system-settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          trialPeriodDays: trialDays,
          yearlyDiscountPercentage: discount,
        })
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success('Settings saved successfully')
      } else {
        toast.error(data.error || 'Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Settings className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Super Admin Settings
        </h1>
        <p className="text-gray-600">
          Configure global system settings and preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* System Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Subscription Settings
            </CardTitle>
            <CardDescription>
              Configure trial period and billing discounts.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Default Trial Days */}
              <div className="space-y-2">
                <Label htmlFor="defaultTrialDays" className="flex items-center gap-2">
                  Default Trial Days
                  <span className="text-xs text-gray-500 font-normal">
                    (1-365 days)
                  </span>
                </Label>
                <Input
                  id="defaultTrialDays"
                  type="number"
                  min="1"
                  max="365"
                  value={settings.defaultTrialDays}
                  onChange={(e) => handleSettingChange("defaultTrialDays", e.target.value)}
                  className="max-w-xs"
                />
                <p className="text-sm text-gray-500">
                  Number of days for free trial period when users sign up.
                </p>
              </div>

              {/* Yearly Discount */}
              <div className="space-y-2">
                <Label htmlFor="yearlyDiscount" className="flex items-center gap-2">
                  <Percent className="h-4 w-4" />
                  Yearly Plan Discount (%)
                  <span className="text-xs text-gray-500 font-normal">(0-100%)</span>
                </Label>
                <Input
                  id="yearlyDiscount"
                  type="number"
                  min="0"
                  max="100"
                  value={settings.yearlyDiscountPercentage}
                  onChange={(e) => handleSettingChange("yearlyDiscountPercentage", e.target.value)}
                  className="max-w-xs"
                />
                <p className="text-sm text-gray-500">
                  Discount for users choosing a yearly billing cycle.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="min-w-[150px]"
            size="lg"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>

      {/* Info Footer */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Changes to system settings will take effect immediately for all new operations. 
          Existing user trials and subscriptions will not be affected.
        </p>
      </div>
    </div>
  )
}
