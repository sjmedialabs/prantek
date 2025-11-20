"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, Shield, Database, Bell, Server, Activity, Save, AlertTriangle, CheckCircle } from "lucide-react"

export default function SuperAdminSettingsPage() {
  const [settings, setSettings] = useState({
    // Platform Configuration
    newTenantRegistration: true,
    maintenanceMode: false,
    apiRateLimit: "1000",
    backupFrequency: "daily",

    // Feature Flags
    advancedAnalytics: true,
    aiInsights: false,
    multiCurrency: true,
    mobileIntegration: false,

    // Security Settings
    twoFactorRequired: false,
    sessionTimeout: "24",
    passwordComplexity: "medium",

    // Notification Settings
    systemAlerts: true,
    emailNotifications: true,
    slackIntegration: false,

    // System Settings
    maxTenantsPerPlan: "100",
    defaultTrialDays: "14",
    systemTimezone: "UTC",
  })

  const handleSettingChange = (key: string, value: boolean | string) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    // In a real app, this would save to the backend
    console.log("Saving settings:", settings)
    // Show success message
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Platform Settings</h1>
          <p className="text-slate-400">Configure global platform settings and features</p>
        </div>
        <Button
          onClick={handleSave}
          className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="platform" className="space-y-6">
        <TabsList className="bg-gradient-to-r from-slate-800 to-slate-900 border-2 border-slate-700 p-1.5 rounded-xl shadow-lg">
          <TabsTrigger
            value="platform"
            className="text-slate-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg transition-all duration-200 font-medium"
          >
            <Settings className="h-4 w-4 mr-2" />
            Platform Config
          </TabsTrigger>
          <TabsTrigger
            value="features"
            className="text-slate-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-700 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg transition-all duration-200 font-medium"
          >
            <Activity className="h-4 w-4 mr-2" />
            Feature Flags
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="text-slate-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-green-700 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg transition-all duration-200 font-medium"
          >
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="text-slate-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-orange-700 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg transition-all duration-200 font-medium"
          >
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger
            value="system"
            className="text-slate-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-indigo-700 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg transition-all duration-200 font-medium"
          >
            <Server className="h-4 w-4 mr-2" />
            System
          </TabsTrigger>
        </TabsList>

        <TabsContent value="platform" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Platform Configuration
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Core platform settings and operational controls
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">New Tenant Registration</Label>
                    <p className="text-sm text-slate-400">Allow new organizations to sign up</p>
                  </div>
                  <Switch
                    checked={settings.newTenantRegistration}
                    onCheckedChange={(checked) => handleSettingChange("newTenantRegistration", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Maintenance Mode</Label>
                    <p className="text-sm text-slate-400">Temporarily disable platform access</p>
                  </div>
                  <Switch
                    checked={settings.maintenanceMode}
                    onCheckedChange={(checked) => handleSettingChange("maintenanceMode", checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">API Rate Limit (per hour)</Label>
                  <Input
                    value={settings.apiRateLimit}
                    onChange={(e) => handleSettingChange("apiRateLimit", e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="1000"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Backup Frequency</Label>
                  <select
                    value={settings.backupFrequency}
                    onChange={(e) => handleSettingChange("backupFrequency", e.target.value)}
                    className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white"
                  >
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  System Status
                </CardTitle>
                <CardDescription className="text-slate-400">Current platform health and status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-white">Platform Status</span>
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Operational
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white">Database Status</span>
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Healthy
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white">API Status</span>
                  <Badge className="bg-yellow-100 text-yellow-800">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Slow Response
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white">Storage Usage</span>
                  <Badge variant="outline" className="text-slate-300">
                    78% Used
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Feature Flags
              </CardTitle>
              <CardDescription className="text-slate-400">
                Control feature availability across the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Advanced Analytics</Label>
                      <p className="text-sm text-slate-400">Enhanced reporting and insights</p>
                    </div>
                    <Switch
                      checked={settings.advancedAnalytics}
                      onCheckedChange={(checked) => handleSettingChange("advancedAnalytics", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">AI-Powered Insights</Label>
                      <p className="text-sm text-slate-400">Machine learning recommendations</p>
                    </div>
                    <Switch
                      checked={settings.aiInsights}
                      onCheckedChange={(checked) => handleSettingChange("aiInsights", checked)}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Multi-Currency Support</Label>
                      <p className="text-sm text-slate-400">International payment processing</p>
                    </div>
                    <Switch
                      checked={settings.multiCurrency}
                      onCheckedChange={(checked) => handleSettingChange("multiCurrency", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Mobile App Integration</Label>
                      <p className="text-sm text-slate-400">Native mobile app features</p>
                    </div>
                    <Switch
                      checked={settings.mobileIntegration}
                      onCheckedChange={(checked) => handleSettingChange("mobileIntegration", checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Security Settings
              </CardTitle>
              <CardDescription className="text-slate-400">Platform-wide security configurations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Require Two-Factor Auth</Label>
                      <p className="text-sm text-slate-400">Mandatory 2FA for all users</p>
                    </div>
                    <Switch
                      checked={settings.twoFactorRequired}
                      onCheckedChange={(checked) => handleSettingChange("twoFactorRequired", checked)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Session Timeout (hours)</Label>
                    <Input
                      value={settings.sessionTimeout}
                      onChange={(e) => handleSettingChange("sessionTimeout", e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="24"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-white">Password Complexity</Label>
                    <select
                      value={settings.passwordComplexity}
                      onChange={(e) => handleSettingChange("passwordComplexity", e.target.value)}
                      className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Notification Settings
              </CardTitle>
              <CardDescription className="text-slate-400">Configure system alerts and notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">System Alerts</Label>
                      <p className="text-sm text-slate-400">Critical system notifications</p>
                    </div>
                    <Switch
                      checked={settings.systemAlerts}
                      onCheckedChange={(checked) => handleSettingChange("systemAlerts", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Email Notifications</Label>
                      <p className="text-sm text-slate-400">Send alerts via email</p>
                    </div>
                    <Switch
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) => handleSettingChange("emailNotifications", checked)}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Slack Integration</Label>
                      <p className="text-sm text-slate-400">Send alerts to Slack channels</p>
                    </div>
                    <Switch
                      checked={settings.slackIntegration}
                      onCheckedChange={(checked) => handleSettingChange("slackIntegration", checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Server className="h-5 w-5 mr-2" />
                System Configuration
              </CardTitle>
              <CardDescription className="text-slate-400">Core system settings and limits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-white">Max Tenants Per Plan</Label>
                    <Input
                      value={settings.maxTenantsPerPlan}
                      onChange={(e) => handleSettingChange("maxTenantsPerPlan", e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="100"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Default Trial Days</Label>
                    <Input
                      value={settings.defaultTrialDays}
                      onChange={(e) => handleSettingChange("defaultTrialDays", e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="14"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-white">System Timezone</Label>
                    <select
                      value={settings.systemTimezone}
                      onChange={(e) => handleSettingChange("systemTimezone", e.target.value)}
                      className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white"
                    >
                      <option value="UTC">UTC</option>
                      <option value="EST">Eastern Time</option>
                      <option value="PST">Pacific Time</option>
                      <option value="GMT">Greenwich Mean Time</option>
                    </select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
