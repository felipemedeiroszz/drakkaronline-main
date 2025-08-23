"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Download, Copy } from "lucide-react" // Import Download and Copy icons
import { Button } from "@/components/ui/button" // Import Button component

interface MarketingContent {
  id: number
  title_en: string
  title_pt: string
  subtitle_en: string
  subtitle_pt: string
  image_url: string
  boat_model: string
  created_at: string
}

export default function MarketingContentPage() {
  const [content, setContent] = useState<MarketingContent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedModel, setSelectedModel] = useState("Todos os Modelos")
  const [lang, setLang] = useState("pt") // Add lang state
  const [copyStatus, setCopyStatus] = useState<{ [key: number]: string }>({}) // State for copy feedback
  const router = useRouter()

  useEffect(() => {
    const savedLang = localStorage.getItem("selectedLang") || "pt"
    setLang(savedLang)
    loadContent()
  }, [])

  const translations = {
    pt: {
      "back-to-marketing": "Voltar ao Marketing",
      "marketing-content-title": "Conteúdo de Marketing",
      "marketing-content-subtitle": "Imagens e conteúdo promocional para suas campanhas",
      "filter-by-model": "Filtrar por Modelo:",
      "all-models": "Todos os Modelos",
      "no-content-available": "Nenhum conteúdo disponível",
      "image-not-found": "Imagem Não Encontrada",
      "loading-content": "Carregando...",
      "download-image": "Baixar Imagem",
      "copy-title": "Copiar Título",
      "copy-subtitle": "Copiar Subtítulo",
      copied: "Copiado!",
    },
    en: {
      "back-to-marketing": "Back to Marketing",
      "marketing-content-title": "Marketing Content",
      "marketing-content-subtitle": "Promotional images and content for your campaigns",
      "filter-by-model": "Filter by Model:",
      "all-models": "All Models",
      "no-content-available": "No content available",
      "image-not-found": "Image Not Found",
      "loading-content": "Loading...",
      "download-image": "Download Image",
      "copy-title": "Copy Title",
      "copy-subtitle": "Copy Subtitle",
      copied: "Copied!",
    },
    es: {
      "back-to-marketing": "Volver a Marketing",
      "marketing-content-title": "Contenido de Marketing",
      "marketing-content-subtitle": "Imágenes y contenido promocional para sus campañas",
      "filter-by-model": "Filtrar por Modelo:",
      "all-models": "Todos los Modelos",
      "no-content-available": "Ningún contenido disponible",
      "image-not-found": "Imagen No Encontrada",
      "loading-content": "Cargando...",
      "download-image": "Descargar Imagen",
      "copy-title": "Copiar Título",
      "copy-subtitle": "Copiar Subtítulo",
      copied: "¡Copiado!",
    },
  }

  const t = (key: keyof typeof translations.pt) => {
    return translations[lang as keyof typeof translations][key] || key
  }

  const getTranslatedContent = (item: MarketingContent, field: "title" | "subtitle") => {
    if (lang === "en") {
      return item[`${field}_en`] || item[`${field}_pt`]
    } else if (lang === "es") {
      // Assuming Spanish content might be in _pt if no _es field exists
      return item[`${field}_pt`] || item[`${field}_en`]
    }
    return item[`${field}_pt`] || item[`${field}_en`]
  }

  const loadContent = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/marketing-content")
      const result = await response.json()

      if (result.success) {
        setContent(result.data || [])
      } else {
        console.error("Error loading marketing content:", result.error)
      }
    } catch (error) {
      console.error("Error loading marketing content:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadImage = async (imageUrl: string, title: string) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${title.replace(/\s/g, "_")}.jpg` // Sanitize title for filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error downloading image:", error)
      alert("Failed to download image.")
    }
  }

  const handleCopyText = (id: number, text: string, type: "title" | "subtitle") => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopyStatus((prev) => ({ ...prev, [`${id}-${type}`]: t("copied") }))
        setTimeout(() => {
          setCopyStatus((prev) => ({ ...prev, [`${id}-${type}`]: "" }))
        }, 2000)
      })
      .catch((err) => {
        console.error("Failed to copy text:", err)
      })
  }

  const filteredContent = content.filter(
    (item) =>
      selectedModel === t("all-models") || item.boat_model === selectedModel || item.boat_model === "All Models",
  )

  // Get unique boat models from content
  const boatModels = Array.from(new Set(content.map((item) => item.boat_model).filter(Boolean)))

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">{t("loading-content")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                href="/dealer/marketing"
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                {t("back-to-marketing")}
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Image src="/images/logo.png" alt="Drakkar Logo" width={120} height={40} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-12 mt-8">
          {" "}
          {/* Added mt-8 for spacing after the new header */}
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{t("marketing-content-title")}</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">{t("marketing-content-subtitle")}</p>
        </div>

        {/* Filter */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex items-center gap-4">
            <label className="font-medium text-gray-700">{t("filter-by-model")}</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white"
            >
              <option value="Todos os Modelos">{t("all-models")}</option>
              {boatModels.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContent.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 text-lg">{t("no-content-available")}</p>
            </div>
          ) : (
            filteredContent.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="relative h-48">
                  <Image
                    src={item.image_url || "/placeholder.svg?height=200&width=400"}
                    alt={getTranslatedContent(item, "title")}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = `/placeholder.svg?height=200&width=400&text=${t("image-not-found")}`
                    }}
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{getTranslatedContent(item, "title")}</h3>
                  {(item.subtitle_pt || item.subtitle_en) && (
                    <p className="text-gray-600 mb-4 line-clamp-3">{getTranslatedContent(item, "subtitle")}</p>
                  )}
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>{item.boat_model}</span>
                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="mt-4 flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadImage(item.image_url, getTranslatedContent(item, "title"))}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      {t("download-image")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyText(item.id, getTranslatedContent(item, "title"), "title")}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      {copyStatus[`${item.id}-title`] || t("copy-title")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyText(item.id, getTranslatedContent(item, "subtitle"), "subtitle")}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      {copyStatus[`${item.id}-subtitle`] || t("copy-subtitle")}
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
