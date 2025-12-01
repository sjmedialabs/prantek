"use client"

import { useEffect, useState } from "react"
import { useUser } from "@/components/auth/user-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Bell, Save } from "lucide-react"
import { set } from "date-fns"
import { toast } from "@/lib/toast"

export default function NotificationsPage() {
  const { hasPermission, user } = useUser()
  const [saved, setSaved] = useState(false)
  const [settings, setSettings] = useState<any>()
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    const loadNotificationSettings= async()=>{
      setLoading(true)
     try{
       const response = await fetch('/api/notification-settings', {
        method:'GET',
        headers:{
          'Content-Type':'application/json'
        }
      })
      const data = await response.json()
       setLoading(false)
       setSettings(data)
      console.log("loaded notification settings",data);
     }catch(error){
      setLoading(false)
      console.error("Error loading notification settings:", error)
     }

    }
    loadNotificationSettings()
  },[])
   

  const handleSave = async() => {
    // Save notification settings
    // setSaved(true)
    // setTimeout(() => setSaved(false), 3000)
   
    
    try{
        console.log("sending data to backend:",settings);
        const payloadTosend={
          quotationNotifications:settings.quotationNotifications,
          receiptNotifications:settings.receiptNotifications,
          paymentNotifications:settings.paymentNotifications
        }
        const response= await fetch('/api/notification-settings', {
          method:'PUT',
          headers:{
            'Content-Type':'application/json'
          },
          body:JSON.stringify(payloadTosend)
        })
        const data = await response.json()
        console.log("save response",data);
        if(response.ok){
          toast.success("Notification settings saved successfully")
        }
    }catch(error){
      console.error("Error saving notification settings:", error)
      toast.error("Failed to save notification settings")
    }
   
    // const getresponse = await fetch('/api/notification-settings', {
    //   method:'GET',
    //   headers:{
    //     'Content-Type':'application/json'
    //   }
    // })     
    // console.log("fetched settings",await getresponse.json());
  }
    if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
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
                checked={settings.quotationNotifications}
                onCheckedChange={(checked) => setSettings({ ...settings, quotationNotifications: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h4 className="font-medium">Receipt Alerts</h4>
                <p className="text-sm text-gray-600">Get notified about new receipts</p>
              </div>
              <Switch
                checked={settings.receiptNotifications}
                onCheckedChange={(checked) => setSettings({ ...settings, receiptNotifications: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h4 className="font-medium">Payment Alerts</h4>
                <p className="text-sm text-gray-600">Get notified about payments received</p>
              </div>
              <Switch
                checked={settings.paymentNotifications}
                onCheckedChange={(checked) => setSettings({ ...settings, paymentNotifications: checked })}
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
      <div className="text-end mt-5">
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  )
}
