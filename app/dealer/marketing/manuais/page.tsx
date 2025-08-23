"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import type { MarketingManual } from "@/lib/database-service"
import { ArrowLeft } from "lucide-react"

export default function ManuaisPage() {
  const [manuals, setManuals] = useState<MarketingManual[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lang, setLang] = useState("pt") // Add lang state

  useEffect(() => {
    const savedLang = localStorage.getItem("selectedLang") || "pt"
    setLang(savedLang)
    loadManuals()
  }, [])

  const translations = {
    pt: {
      "back-to-marketing": "Voltar ao Marketing",
      "manuals-title": "Manuais",
      "manuals-subtitle": "Acesse os manuais e documentação técnica",
      "loading-manuals": "Carregando manuais...",
      "no-manuals-available": "Nenhum manual disponível no momento.",
      "open-manual": "Abrir Manual",
    },
    en: {
      "back-to-marketing": "Back to Marketing",
      "manuals-title": "Manuals",
      "manuals-subtitle": "Access manuals and technical documentation",
      "loading-manuals": "Loading manuals...",
      "no-manuals-available": "No manuals available at the moment.",
      "open-manual": "Open Manual",
    },
    es: {
      "back-to-marketing": "Volver a Marketing",
      "manuals-title": "Manuales",
      "manuals-subtitle": "Acceda a manuales y documentación técnica",
      "loading-manuals": "Cargando manuales...",
      "no-manuals-available": "No hay manuales disponibles en este momento.",
      "open-manual": "Abrir Manual",
    },
  }

  const t = (key: keyof typeof translations.pt) => {
    return translations[lang as keyof typeof translations][key] || key
  }

  const getTranslatedManualName = (manual: MarketingManual) => {
    if (lang === "en") {
      return manual.name_en || manual.name_pt
    } else if (lang === "es") {
      // Assuming Spanish content might be in _pt if no _es field exists
      return manual.name_pt || manual.name_en
    }
    return manual.name_pt || manual.name_en
  }

  const loadManuals = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/marketing-manuals")
      const result = await response.json()

      if (result.success) {
        setManuals(result.data || [])
      } else {
        console.error("Error loading manuals:", result.error)
      }
    } catch (error) {
      console.error("Error loading manuals:", error)
    } finally {
      setIsLoading(false)
    }
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{t("manuals-title")}</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">{t("manuals-subtitle")}</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">{t("loading-manuals")}</span>
          </div>
        ) : manuals.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <Image src="/images/manual.png" alt="No manuals" width={48} height={48} className="opacity-50" />
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">{t("no-manuals-available")}</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {manuals.map((manual) => (
              <div
                key={manual.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
              >
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="flex-shrink-0">
                      <Image
                        src={manual.image_url || "/images/manual.png"}
                        alt={getTranslatedManualName(manual)}
                        width={48}
                        height={48}
                        className="rounded-lg"
                      />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">{getTranslatedManualName(manual)}</h3>
                    </div>
                  </div>

                  <div className="mt-4">
                    <a
                      href={manual.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center justify-center"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                      {t("open-manual")}
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
