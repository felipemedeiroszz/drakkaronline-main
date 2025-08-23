"use client"

import { useState, useEffect } from "react"
import { useAdminRealtimeSync, useDealerRealtimeSync } from "@/hooks/use-realtime-sync"

export default function TestRealtimePage() {
  const [adminUpdates, setAdminUpdates] = useState<string[]>([])
  const [dealerUpdates, setDealerUpdates] = useState<string[]>([])
  const [dealerId, setDealerId] = useState("")

  // Test admin real-time sync
  useAdminRealtimeSync(() => {
    const update = `Admin update received at ${new Date().toLocaleTimeString()}`
    console.log("📡 Test page:", update)
    setAdminUpdates(prev => [...prev, update])
  })

  // Test dealer real-time sync
  useDealerRealtimeSync(dealerId || "test-dealer", () => {
    const update = `Dealer update received at ${new Date().toLocaleTimeString()}`
    console.log("📡 Test page:", update)
    setDealerUpdates(prev => [...prev, update])
  })

  useEffect(() => {
    // Get dealer ID from localStorage
    const savedDealerId = localStorage.getItem("currentDealerId") || ""
    setDealerId(savedDealerId)
  }, [])

  const triggerTestUpdate = async () => {
    try {
      // This will trigger a test update through the API
      const response = await fetch("/api/test-realtime", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test: true })
      })
      
      if (response.ok) {
        console.log("✅ Test update triggered")
      } else {
        console.error("❌ Failed to trigger test update")
      }
    } catch (error) {
      console.error("❌ Error triggering test update:", error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Real-time Sync Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
          <p className="text-gray-600 mb-4">
            Open this page in multiple tabs/windows to test real-time synchronization.
            Updates in the admin panel should appear here in real-time.
          </p>
          <button
            onClick={triggerTestUpdate}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Trigger Test Update
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Admin Updates</h2>
            <div className="space-y-2">
              {adminUpdates.length === 0 ? (
                <p className="text-gray-500">No updates yet. Make changes in the admin panel.</p>
              ) : (
                adminUpdates.map((update, index) => (
                  <div key={index} className="p-2 bg-blue-50 rounded text-sm">
                    {update}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Dealer Updates</h2>
            <p className="text-sm text-gray-600 mb-2">Dealer ID: {dealerId || "Not set"}</p>
            <div className="space-y-2">
              {dealerUpdates.length === 0 ? (
                <p className="text-gray-500">No updates yet. Make changes affecting this dealer.</p>
              ) : (
                dealerUpdates.map((update, index) => (
                  <div key={index} className="p-2 bg-green-50 rounded text-sm">
                    {update}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 bg-yellow-50 rounded-lg p-6">
          <h3 className="font-semibold mb-2">Instructions:</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Open the admin panel in one tab/window</li>
            <li>Open the dealer sales page in another tab/window</li>
            <li>Open this test page in a third tab/window</li>
            <li>Make any changes in the admin panel (add/edit/delete items)</li>
            <li>Watch for real-time updates in all tabs</li>
          </ol>
        </div>
      </div>
    </div>
  )
}