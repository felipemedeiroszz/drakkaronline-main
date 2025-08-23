"use client"

import { useState, useEffect } from "react"

export default function TestServiceRequests() {
  const [dealerInfo, setDealerInfo] = useState<any>(null)
  const [serviceRequests, setServiceRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      // Get dealer info from localStorage
      const dealerName = localStorage.getItem("currentDealerName")
      const dealerId = localStorage.getItem("currentDealerId")
      
      setDealerInfo({ dealerName, dealerId })

      // Try to fetch service requests
      if (dealerId) {
        try {
          const response = await fetch(`/api/get-dealer-service-requests?dealerId=${encodeURIComponent(dealerId)}`)
          const result = await response.json()
          setServiceRequests(result.data || [])
        } catch (error) {
          console.error("Error fetching service requests:", error)
        }
      }

      setLoading(false)
    }

    loadData()
  }, [])

  const testCreateRequest = async () => {
    const testData = {
      requestId: `TEST-${Date.now()}`,
      dealerName: dealerInfo.dealerName,
      dealer_id: dealerInfo.dealerId,
      customer_name: "Test Customer",
      customer_email: "test@example.com",
      customer_phone: "123456789",
      customer_address: "Test Address",
      boat_model: "Test Model",
      hull_id: "TEST123",
      purchase_date: new Date().toISOString().split('T')[0],
      engine_hours: "100",
      request_type: "warranty",
      issues: [{ text: "Test issue", imageUrl: null }],
      status: "Open",
    }

    try {
      const response = await fetch("/api/save-service-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testData),
      })

      const result = await response.json()
      alert(result.success ? "Test request created!" : `Error: ${result.error}`)
      
      // Reload the page to see the new request
      window.location.reload()
    } catch (error) {
      alert(`Error: ${error}`)
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Service Requests Debug Page</h1>
      
      <div className="mb-8 p-4 bg-gray-100 rounded">
        <h2 className="text-xl font-semibold mb-2">Dealer Info</h2>
        <p>Name: {dealerInfo.dealerName || "Not set"}</p>
        <p>ID: {dealerInfo.dealerId || "Not set"}</p>
      </div>

      <div className="mb-8">
        <button
          onClick={testCreateRequest}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          disabled={!dealerInfo.dealerName}
        >
          Create Test Request
        </button>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Service Requests ({serviceRequests.length})</h2>
        {serviceRequests.length === 0 ? (
          <p>No service requests found</p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2">Request ID</th>
                <th className="border p-2">Customer</th>
                <th className="border p-2">Model</th>
                <th className="border p-2">Type</th>
                <th className="border p-2">Status</th>
                <th className="border p-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {serviceRequests.map((req) => (
                <tr key={req.id}>
                  <td className="border p-2">{req.id}</td>
                  <td className="border p-2">{req.customer}</td>
                  <td className="border p-2">{req.model}</td>
                  <td className="border p-2">{req.type}</td>
                  <td className="border p-2">{req.status}</td>
                  <td className="border p-2">{req.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-8 text-sm text-gray-600">
        <p>Check the browser console for debug logs</p>
      </div>
    </div>
  )
}