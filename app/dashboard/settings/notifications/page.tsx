"use client"

import { useState } from "react"
import { useUser } from "@/components/auth/user-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Bell, Save } from "lucide-react"

export default function NotificationsPage() {
  const { hasPermission, user } = useUser()
  const [saved, setSaved] = useState(false)
  const [settings, setSettings] = useState({
    quotationAlerts: true,
    paymentAlerts: true,
    receiptAlerts: true,
  })

  const handleSave = () => {
    // Save notification settings
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (!hasPermission("tenant_settings")) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to access this page.</p>
      </div>
    )
  }

  // Check if user is admin
  const isAdmin = hasPermission("manage_roles")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notification Preferences</h1>
          <p className="text-gray-600">Choose which alerts you want to receive</p>
        </div>
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      {saved && (
        <Alert>
          <AlertDescription>Notification settings saved successfully!</AlertDescription>
        </Alert>
      )}

      {isAdmin ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              Admin Notification Alerts
            </CardTitle>
            <CardDescription>Manage alerts for important events (Admin Only)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h4 className="font-medium">Quotation Alerts</h4>
                <p className="text-sm text-gray-600">Get notified about new quotations</p>
              </div>
              <Switch
                checked={settings.quotationAlerts}
                onCheckedChange={(checked) => setSettings({ ...settings, quotationAlerts: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h4 className="font-medium">Receipt Alerts</h4>
                <p className="text-sm text-gray-600">Get notified about new receipts</p>
              </div>
              <Switch
                checked={settings.receiptAlerts}
                onCheckedChange={(checked) => setSettings({ ...settings, receiptAlerts: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h4 className="font-medium">Payment Alerts</h4>
                <p className="text-sm text-gray-600">Get notified about payments received</p>
              </div>
              <Switch
                checked={settings.paymentAlerts}
                onCheckedChange={(checked) => setSettings({ ...settings, paymentAlerts: checked })}
              />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              Notifications
            </CardTitle>
            <CardDescription>Notification settings are managed by your administrator</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>
                Only administrators can configure notification preferences. Please contact your admin for assistance.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
