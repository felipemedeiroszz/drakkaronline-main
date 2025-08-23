"use client"

import { useState } from "react"

export default function TestUploadPage() {
  const [uploading, setUploading] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString()}: ${message}`])
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setImageUrl(null)
    setUploading(true)
    setLogs([])

    addLog(`File selected: ${file.name} (${file.size} bytes, ${file.type})`)

    try {
      const formData = new FormData()
      formData.append("file", file)

      addLog("Sending request to /api/upload-image...")

      const response = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      })

      addLog(`Response status: ${response.status}`)

      const contentType = response.headers.get("content-type")
      addLog(`Response content-type: ${contentType}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      addLog(`Response data: ${JSON.stringify(data)}`)

      if (data.success && data.url) {
        setImageUrl(data.url)
        addLog(`Upload successful! URL: ${data.url}`)
      } else {
        throw new Error(data.error || "Upload failed")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      setError(errorMessage)
      addLog(`Error: ${errorMessage}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Test Uploadcare Upload</h1>

      <div className="mb-6">
        <label className="block mb-2">
          Select an image to upload:
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="block mt-2 p-2 border rounded"
          />
        </label>
      </div>

      {uploading && (
        <div className="mb-4 p-4 bg-blue-100 rounded">
          <p>Uploading...</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          <p>Error: {error}</p>
        </div>
      )}

      {imageUrl && (
        <div className="mb-4">
          <p className="mb-2 text-green-600">Upload successful!</p>
          <p className="mb-2 text-sm">URL: {imageUrl}</p>
          <img src={imageUrl} alt="Uploaded" className="max-w-md border rounded" />
        </div>
      )}

      {logs.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Debug Logs:</h2>
          <div className="bg-gray-100 p-4 rounded font-mono text-sm">
            {logs.map((log, index) => (
              <div key={index} className="mb-1">
                {log}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}