"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@/components/auth/user-context"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Bell, Settings, LogOut } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

interface Notification {
  _id?: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
  link?: string
}

export default function SuperAdminHeader() {
  const router = useRouter()
  const { user, logout } = useUser()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  useEffect(() => {
    if (user) {
      fetchNotifications()
      // Only poll for non-super-admin users
      if (user.role !== "super-admin") {
        const interval = setInterval(fetchNotifications, 30000)
        return () => clearInterval(interval)
      }
    }
  }, [user])

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/notifications", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setNotifications(data)
        setUnreadCount(data.filter((n: Notification) => !n.isRead).length)
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    try {
      if (!notification.isRead && notification._id) {
        const token = localStorage.getItem("token")
        await fetch("/api/notifications", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: JSON.stringify({
            notificationId: notification._id.toString(),
            isRead: true,
          }),
        })

        setNotifications(
          notifications.map((n) => (n._id === notification._id ? { ...n, isRead: true } : n))
        )
        setUnreadCount(Math.max(0, unreadCount - 1))
      }

      setDropdownOpen(false)

      if (notification.link) {
        let link = notification.link
        if (link.startsWith("/dashboard")) {
          link = link.replace("/dashboard", "/super-admin/dashboard")
        }
        router.push(link)
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const formatNotificationTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-end space-x-4">
        {/* Notifications */}
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="p-2 font-semibold">Notifications</div>
            <DropdownMenuSeparator />
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">No notifications</div>
              ) : (
                notifications.map((notification, index) => (
                  <DropdownMenuItem
                    key={index}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-3 cursor-pointer ${!notification.isRead ? "bg-blue-50" : ""}`}
                  >
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-start justify-between">
                        <span className="font-medium text-sm">{notification.title}</span>
                        {!notification.isRead && <div className="h-2 w-2 bg-blue-500 rounded-full" />}
                      </div>
                      <p className="text-xs text-gray-600">{notification.message}</p>
                      <span className="text-xs text-gray-400">
                        {formatNotificationTime(notification.createdAt)}
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-purple-600 text-white">
                  {user?.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{user?.name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push("/super-admin/settings")}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
