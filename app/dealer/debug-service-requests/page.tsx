"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DebugServiceRequestsPage() {
  const [dealerInfo, setDealerInfo] = useState<any>(null)
  const [serviceRequests, setServiceRequests] = useState<any[]>([])
  const [allDealers, setAllDealers] = useState<any[]>([])
  const [debugLogs, setDebugLogs] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const addLog = (message: string) => {
    setDebugLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  useEffect(() => {
    // Carregar informações do dealer do localStorage
    const dealerName = localStorage.getItem("currentDealerName")
    const dealerId = localStorage.getItem("currentDealerId")
    const dealerEmail = localStorage.getItem("currentDealerEmail")
    
    setDealerInfo({
      name: dealerName,
      id: dealerId,
      email: dealerEmail
    })
    
    addLog(`Dealer info from localStorage: ${JSON.stringify({ dealerName, dealerId, dealerEmail })}`)
    
    // Carregar lista de todos os dealers
    loadAllDealers()
    
    // Carregar service requests
    if (dealerName) {
      loadServiceRequests(dealerName)
    }
  }, [])

  const loadAllDealers = async () => {
    try {
      const response = await fetch("/api/dealers")
      const data = await response.json()
      if (data.success) {
        setAllDealers(data.data)
        addLog(`Loaded ${data.data.length} dealers from database`)
      }
    } catch (error) {
      addLog(`Error loading dealers: ${error}`)
    }
  }

  const loadServiceRequests = async (dealerName: string) => {
    try {
      setIsLoading(true)
      addLog(`Loading service requests for dealer: ${dealerName}`)
      
      const response = await fetch(`/api/get-dealer-service-requests?dealerId=${encodeURIComponent(dealerId)}`)
      const result = await response.json()
      
      addLog(`API Response: ${JSON.stringify(result)}`)
      
      if (result.success) {
        setServiceRequests(result.data)
        addLog(`Found ${result.data.length} service requests`)
      } else {
        addLog(`Error from API: ${result.error}`)
      }
    } catch (error) {
      addLog(`Error loading service requests: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const createTestRequest = async () => {
    try {
      const requestData = {
        requestId: `TEST-${Date.now()}`,
        dealerName: dealerInfo?.name,
        dealer_id: dealerInfo?.id,
        customer_name: "Test Customer",
        customer_email: "test@example.com",
        customer_phone: "123456789",
        customer_address: "Test Address",
        boat_model: "Test Model",
        hull_id: "TEST-HULL-123",
        purchase_date: new Date().toISOString().split('T')[0],
        engine_hours: "100",
        request_type: "warranty",
        issues: [{ text: "Test issue", imageUrl: undefined }],
        status: "Open"
      }
      
      addLog(`Sending test request: ${JSON.stringify(requestData)}`)
      
      const response = await fetch("/api/save-service-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      })
      
      const result = await response.json()
      addLog(`Save response: ${JSON.stringify(result)}`)
      
      if (result.success) {
        // Recarregar lista
        loadServiceRequests(dealerInfo?.name)
      }
    } catch (error) {
      addLog(`Error creating test request: ${error}`)
    }
  }

  const findDealerMatch = () => {
    if (!dealerInfo?.name || !allDealers.length) return null
    
    // Busca exata
    const exactMatch = allDealers.find(d => d.name === dealerInfo.name)
    if (exactMatch) return { type: "exact", dealer: exactMatch }
    
    // Busca case-insensitive
    const caseInsensitiveMatch = allDealers.find(d => 
      d.name.toLowerCase() === dealerInfo.name.toLowerCase()
    )
    if (caseInsensitiveMatch) return { type: "case-insensitive", dealer: caseInsensitiveMatch }
    
    // Busca com trim
    const trimMatch = allDealers.find(d => 
      d.name.trim().toLowerCase() === dealerInfo.name.trim().toLowerCase()
    )
    if (trimMatch) return { type: "trim", dealer: trimMatch }
    
    // Busca parcial
    const partialMatch = allDealers.find(d => 
      d.name.toLowerCase().includes(dealerInfo.name.toLowerCase()) ||
      dealerInfo.name.toLowerCase().includes(d.name.toLowerCase())
    )
    if (partialMatch) return { type: "partial", dealer: partialMatch }
    
    return null
  }

  const dealerMatch = findDealerMatch()

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Debug Service Requests</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Informações do Dealer */}
        <Card>
          <CardHeader>
            <CardTitle>Dealer Info (localStorage)</CardTitle>
          </CardHeader>
          <CardContent>
            {dealerInfo ? (
              <div className="space-y-2">
                <p><strong>Name:</strong> {dealerInfo.name || "Not found"}</p>
                <p><strong>ID:</strong> {dealerInfo.id || "Not found"}</p>
                <p><strong>Email:</strong> {dealerInfo.email || "Not found"}</p>
              </div>
            ) : (
              <p>No dealer info in localStorage</p>
            )}
          </CardContent>
        </Card>

        {/* Match do Dealer */}
        <Card>
          <CardHeader>
            <CardTitle>Dealer Match in Database</CardTitle>
          </CardHeader>
          <CardContent>
            {dealerMatch ? (
              <div className="space-y-2">
                <p><strong>Match Type:</strong> {dealerMatch.type}</p>
                <p><strong>DB Name:</strong> {dealerMatch.dealer.name}</p>
                <p><strong>DB ID:</strong> {dealerMatch.dealer.id}</p>
                <p><strong>DB Email:</strong> {dealerMatch.dealer.email}</p>
              </div>
            ) : (
              <p className="text-red-600">No matching dealer found in database!</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ações */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={createTestRequest}
            disabled={!dealerInfo?.name}
          >
            Create Test Service Request
          </Button>
          
          <Button 
            onClick={() => loadServiceRequests(dealerInfo?.name)}
            disabled={!dealerInfo?.name || isLoading}
            variant="outline"
          >
            Reload Service Requests
          </Button>
        </CardContent>
      </Card>

      {/* Service Requests */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Service Requests ({serviceRequests.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {serviceRequests.length > 0 ? (
            <div className="space-y-2">
              {serviceRequests.map((req, index) => (
                <div key={index} className="p-3 border rounded">
                  <p><strong>ID:</strong> {req.id}</p>
                  <p><strong>Customer:</strong> {req.customer}</p>
                  <p><strong>Model:</strong> {req.model}</p>
                  <p><strong>Type:</strong> {req.type}</p>
                  <p><strong>Status:</strong> {req.status}</p>
                  <p><strong>Date:</strong> {req.date}</p>
                </div>
              ))}
            </div>
          ) : (
            <p>No service requests found</p>
          )}
        </CardContent>
      </Card>

      {/* Todos os Dealers */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>All Dealers in Database ({allDealers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-64 overflow-y-auto">
            {allDealers.map((dealer, index) => (
              <div key={index} className="p-2 border-b">
                <p><strong>{dealer.name}</strong> (ID: {dealer.id})</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Debug Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Debug Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-100 p-4 rounded max-h-96 overflow-y-auto">
            {debugLogs.map((log, index) => (
              <div key={index} className="font-mono text-sm">{log}</div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}