"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"

const STORAGE_KEY = "prantek-super-admin-sidebar-collapsed"

type SuperAdminSidebarCollapsedValue = {
  collapsed: boolean
  setCollapsed: (next: boolean) => void
  toggleCollapsed: () => void
}

const SuperAdminSidebarCollapsedContext = createContext<SuperAdminSidebarCollapsedValue | null>(null)

export function SuperAdminSidebarCollapsedProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsedState] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") setCollapsedState(true)
    } catch {
      /* ignore */
    }
  }, [])

  const setCollapsed = useCallback((next: boolean) => {
    setCollapsedState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0")
    } catch {
      /* ignore */
    }
  }, [])

  const toggleCollapsed = useCallback(() => {
    setCollapsedState((c) => {
      const next = !c
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0")
      } catch {
        /* ignore */
      }
      return next
    })
  }, [])

  return (
    <SuperAdminSidebarCollapsedContext.Provider value={{ collapsed, setCollapsed, toggleCollapsed }}>
      {children}
    </SuperAdminSidebarCollapsedContext.Provider>
  )
}

export function useSuperAdminSidebarCollapsed() {
  const ctx = useContext(SuperAdminSidebarCollapsedContext)
  if (!ctx) {
    throw new Error("useSuperAdminSidebarCollapsed must be used within SuperAdminSidebarCollapsedProvider")
  }
  return ctx
}
