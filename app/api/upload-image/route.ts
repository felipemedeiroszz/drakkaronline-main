import { type NextRequest, NextResponse } from "next/server"

const UPLOADCARE_PUBLIC_KEY = process.env.NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY

console.log("Uploadcare Config:", {
  public_key: UPLOADCARE_PUBLIC_KEY,
})

export async function POST(request: NextRequest) {
  console.log("Upload request received")

  if (!UPLOADCARE_PUBLIC_KEY) {
    console.error("Uploadcare public key not properly configured")
    return NextResponse.json(
      {
        success: false,
        error: "Upload service configuration error. Please contact administrator.",
      },
      { status: 500 },
    )
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      console.log("No file provided in request")
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 })
    }

    console.log("File received:", file.name, "Size:", file.size, "Type:", file.type)

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!file.type.startsWith("image/") || !allowedTypes.includes(file.type.toLowerCase())) {
      console.log("Invalid file type:", file.type)
      return NextResponse.json({
        success: false,
        error: "File must be a valid image format (JPEG, PNG, GIF, or WebP)"
      }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      console.log("File too large:", file.size, "bytes")
      return NextResponse.json({
        success: false,
        error: "File size must be less than 5MB"
      }, { status: 400 })
    }

    if (!file.name || file.name.trim() === '') {
      console.log("Invalid file name:", file.name)
      return NextResponse.json({
        success: false,
        error: "File must have a valid name"
      }, { status: 400 })
    }

    // Use direct Uploadcare REST API instead of upload-client SDK
    const uploadFormData = new FormData()
    uploadFormData.append('UPLOADCARE_PUB_KEY', UPLOADCARE_PUBLIC_KEY)
    uploadFormData.append('UPLOADCARE_STORE', 'auto')
    uploadFormData.append('file', file, file.name)

    console.log("Uploading to Uploadcare via REST API...")

    const uploadResponse = await fetch('https://upload.uploadcare.com/base/', {
      method: 'POST',
      body: uploadFormData,
    })

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      console.error("Uploadcare upload failed:", uploadResponse.status, errorText)
      
      // Try to parse error message
      let errorMessage = "Upload failed"
      try {
        const errorData = JSON.parse(errorText)
        errorMessage = errorData.error?.message || errorData.error || errorMessage
      } catch {
        errorMessage = errorText || errorMessage
      }

      return NextResponse.json({
        success: false,
        error: `Upload failed: ${errorMessage}`
      }, { status: uploadResponse.status })
    }

    const uploadResult = await uploadResponse.json()
    console.log("Upload successful:", uploadResult)

    if (!uploadResult.file) {
      console.error("Upload response missing file UUID:", uploadResult)
      return NextResponse.json({
        success: false,
        error: "Upload failed: Invalid response from upload service"
      }, { status: 500 })
    }

    const cdnUrl = `https://ucarecdn.com/${uploadResult.file}/`

    return NextResponse.json({
      success: true,
      url: cdnUrl,
      filename: uploadResult.file,
      originalFilename: file.name,
    })

  } catch (error: any) {
    console.error("Upload error:", error)

    // Handle specific error types
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return NextResponse.json({
        success: false,
        error: "Network error: Unable to connect to upload service"
      }, { status: 503 })
    }

    if (error.message?.includes("rate limit") || error.message?.includes("Too Many")) {
      return NextResponse.json({
        success: false,
        error: "Upload rate limit exceeded. Please wait a moment and try again."
      }, { status: 429 })
    }

    if (error.message?.includes("quota") || error.message?.includes("storage")) {
      return NextResponse.json({
        success: false,
        error: "Storage quota exceeded. Please contact administrator."
      }, { status: 507 })
    }

    return NextResponse.json({
      success: false,
      error: `Upload failed: ${error.message || "Unknown error"}`
    }, { status: 500 })
  }
}
