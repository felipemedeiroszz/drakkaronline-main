"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, ExternalLink, FileText } from "lucide-react"

interface MarketingWarranty {
  id: number
  name_en: string
  name_pt: string
  url: string
  image_url?: string
  display_order: number
  created_at: string
  updated_at?: string
}

export default function WarrantiesPage() {
  const [warranties, setWarranties] = useState<MarketingWarranty[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lang, setLang] = useState("pt") // Add lang state

  useEffect(() => {
    const savedLang = localStorage.getItem("selectedLang") || "pt"
    setLang(savedLang)
    loadWarranties()
  }, [])

  const translations = {
    pt: {
      "back-to-marketing": "Voltar ao Marketing",
      "warranties-title": "Informações de Garantia",
      "warranties-subtitle": "Acesse as informações de garantia dos produtos Drakkar",
      "loading-warranties": "Carregando garantias...",
      "error-loading-warranties": "Erro ao carregar garantias. Tente novamente mais tarde.",
      "try-again": "Tentar Novamente",
      "no-warranties-available": "Nenhuma garantia disponível no momento.",
      "open-warranty": "Abrir Garantia",
    },
    en: {
      "back-to-marketing": "Back to Marketing",
      "warranties-title": "Warranty Information",
      "warranties-subtitle": "Access warranty information for Drakkar products",
      "loading-warranties": "Loading warranties...",
      "error-loading-warranties": "Error loading warranties. Please try again later.",
      "try-again": "Try Again",
      "no-warranties-available": "No warranties available at the moment.",
      "open-warranty": "Open Warranty",
    },
    es: {
      "back-to-marketing": "Volver a Marketing",
      "warranties-title": "Información de Garantía",
      "warranties-subtitle": "Acceda a la información de garantía de los productos Drakkar",
      "loading-warranties": "Cargando garantías...",
      "error-loading-warranties": "Error al cargar garantías. Inténtelo de nuevo más tarde.",
      "try-again": "Intentar de Nuevo",
      "no-warranties-available": "No hay garantías disponibles en este momento.",
      "open-warranty": "Abrir Garantía",
    },
  }

  const t = (key: keyof typeof translations.pt) => {
    return translations[lang as keyof typeof translations][key] || key
  }

  const getTranslatedWarrantyName = (warranty: MarketingWarranty) => {
    if (lang === "en") {
      return warranty.name_en || warranty.name_pt
    } else if (lang === "es") {
      // Assuming Spanish content might be in _pt if no _es field exists
      return warranty.name_pt || warranty.name_en
    }
    return warranty.name_pt || warranty.name_en
  }

  const loadWarranties = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/marketing-warranties")
      const result = await response.json()

      if (result.success) {
        setWarranties(result.data || [])
      } else {
        setError(result.error || "Failed to load warranties")
      }
    } catch (error) {
      console.error("Error loading warranties:", error)
      setError("Network error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t("loading-warranties")}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <p className="text-red-600 mb-4">{t("error-loading-warranties")}</p>
          <button onClick={loadWarranties} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            {t("try-again")}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{t("warranties-title")}</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">{t("warranties-subtitle")}</p>
        </div>

        {/* Warranties Grid */}
        {warranties.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-xl text-gray-600">{t("no-warranties-available")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {warranties.map((warranty) => (
              <div
                key={warranty.id}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden"
              >
                {/* Warranty Image */}
                <div className="relative h-48 bg-gradient-to-br from-purple-500 to-purple-700">
                  {warranty.image_url ? (
                    <Image
                      src={warranty.image_url || "/placeholder.svg"}
                      alt={getTranslatedWarrantyName(warranty)}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = "none"
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <FileText className="h-16 w-16 text-white opacity-80" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                </div>

                {/* Warranty Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 line-clamp-2">
                    {getTranslatedWarrantyName(warranty)}
                  </h3>

                  {/* Action Button */}
                  <div className="flex justify-center">
                    <a
                      href={warranty.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors duration-200 shadow-md hover:shadow-lg"
                    >
                      <ExternalLink className="h-5 w-5 mr-2" />
                      {t("open-warranty")}
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
