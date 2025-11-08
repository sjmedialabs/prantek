"use client"

import { useEffect, useState } from "react"
import { tokenStorage } from "@/lib/token-storage"

export default function TestNotifications() {
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string>("")

  const testFetch = async () => {
    try {
      const token = tokenStorage.getAccessToken()
      console.log("Token:", token)
      
      const response = await fetch("/api/notifications", {
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      
      console.log("Response status:", response.status)
      const data = await response.json()
      console.log("Response data:", data)
      
      if (response.ok) {
        setResult(data)
        setError("")
      } else {
        setError(`Error ${response.status}: ${JSON.stringify(data)}`)
      }
    } catch (err: any) {
      console.error("Fetch error:", err)
      setError(err.message)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Notifications API</h1>
      
      <button 
        onClick={testFetch}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
      >
        Test Fetch
      </button>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {result && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          <h2 className="font-bold mb-2">Success! Found {result.length} notifications:</h2>
          <pre className="text-sm overflow-auto">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
