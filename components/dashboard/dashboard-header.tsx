"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/components/auth/user-context";
import { useSidebar } from "@/components/layout/sidebar-context";
import { Button } from "@/components/ui/button";
import { tokenStorage } from "@/lib/token-storage";
import {
  DropdownMenu, 
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, User, LogOut, UserCircle, Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Notification } from "@/lib/models/types";
import Link from "next/link";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Prantek";

export default function DashboardHeader() {
  const { user, logout } = useUser();
  const { openMobile } = useSidebar();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationOpen, setNotificationOpen] = useState(false);
 const loginedUserLocalStorageString = localStorage.getItem("loginedUser");

  const loginedUserLocalStorage = loginedUserLocalStorageString
    ? JSON.parse(loginedUserLocalStorageString)
    : null;
  const handleLogout = () => {
    logout();
  };

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = tokenStorage.getAccessToken();
        const response = await fetch("/api/notifications", {
          credentials: "include",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          const filteredData = data.filter((eachItem:any)=>eachItem.isRead===false);
          setNotifications(filteredData);
          setUnreadCount(data.filter((n: Notification) => !n.isRead).length);
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      }
    };

    if (user) {
      fetchNotifications();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      try {
        const token = tokenStorage.getAccessToken();
        await fetch("/api/notifications", {
          method: "PATCH",
          credentials: "include",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            notificationId: notification._id?.toString(),
            isRead: true,
          }),
        });

        // Update local state
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notification._id ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
    }

    // Close dropdown before navigation
    setNotificationOpen(false);

    // Navigate to link if provided
    if (notification.link) {
      router.push(notification.link);
    }
  };
  const handleMarkAllAsRead = async () => {
  try {
    const token = tokenStorage.getAccessToken();

    await fetch("/api/notifications/mark-all-read", {
      method: "PATCH",
      credentials: "include",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    // Update UI instantly
    setNotifications([]); // because you show only unread
    setUnreadCount(0);
  } catch (error) {
    console.error("Failed to mark all notifications as read:", error);
  }
};
const handleClearAllNotifications = async () => {
  try {
    const token = tokenStorage.getAccessToken();

    await fetch("/api/notifications/clear-all", {
      method: "PATCH", // or DELETE depending on backend
      credentials: "include",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    // Clear locally
    setNotifications([]);
    setUnreadCount(0);
  } catch (error) {
    console.error("Failed to clear notifications:", error);
  }
};
  const formatNotificationTime = (date: Date) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffMs = now.getTime() - notifDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return notifDate.toLocaleDateString();
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shrink-0">
      <div className="flex items-center justify-between gap-3 px-4 py-2 sm:px-6 sm:py-2 min-h-[56px]">
        <div className="flex items-center gap-2 min-w-0 relative z-10">
          <button
            type="button"
            onClick={() => openMobile()}
            className="lg:hidden min-h-[48px] min-w-[48px] shrink-0 rounded-lg touch-manipulation inline-flex items-center justify-center hover:bg-gray-100 active:bg-gray-200 transition-colors cursor-pointer"
            aria-label="Open menu"
            aria-expanded={false}
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/dashboard" className="hidden sm:block text-lg font-semibold text-foreground truncate hover:opacity-90">
            {APP_NAME}
          </Link>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {
            !loginedUserLocalStorage?.isAdminUser && (
              <DropdownMenu
            open={notificationOpen}
            onOpenChange={setNotificationOpen}
          >
            <DropdownMenuTrigger asChild>
              <button className="relative px-2 py-2 rounded hover:bg-gray-100 transition-colors">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="flex items-center justify-between px-2 py-1.5">
  <DropdownMenuLabel className="p-0">
    Notifications
  </DropdownMenuLabel>

  {notifications.length > 0 && (
    <button
      onClick={handleMarkAllAsRead}
      className="text-xs text-blue-600 hover:underline"
    >
      Mark all as read
    </button>
  )}
</div>
              <DropdownMenuSeparator />
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-sm text-gray-500">
                    No notifications
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification._id?.toString()}
                      onSelect={() => handleNotificationClick(notification)}
                      className={`flex flex-col items-start p-3 cursor-pointer ${
                        !notification.isRead ? "bg-blue-50" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between w-full">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatNotificationTime(notification.createdAt)}
                          </p>
                        </div>
                        {!notification.isRead && (
                          <span className="ml-2 h-2 w-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></span>
                        )}
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
              </div>
              {/* <div className="flex justify-end">
                {notifications.length > 0 && (
    <button
      onClick={handleClearAllNotifications}
      className="text-xs text-red-600 hover:underline"
    >
      Clear All
    </button>
  )}
  </div> */}
            </DropdownMenuContent>
          </DropdownMenu>
            )
          }

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center space-x-2 min-h-[48px] px-2 sm:px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer touch-manipulation">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden shrink-0">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="h-4 w-4 text-primary" />
                  )}
                </div>
                <span className="text-sm font-medium truncate max-w-[120px] sm:max-w-[180px]">{user?.name}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => router.push("/dashboard/profile")}
              >
                <UserCircle className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
