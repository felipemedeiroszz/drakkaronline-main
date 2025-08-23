"use client"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, FileText, Shield, ImageIcon } from "lucide-react"
import { useState, useEffect } from "react"

export default function MarketingPage() {
  const [selectedLang, setSelectedLang] = useState("pt") // Default to Portuguese

  useEffect(() => {
    if (typeof window !== "undefined") {
      const lang = localStorage.getItem("selectedLang")
      if (lang) {
        setSelectedLang(lang)
      }
    }
  }, [])

  const translations = {
    pt: {
      backToDashboard: "Voltar ao Dashboard",
      marketingTitle: "Marketing",
      marketingSubtitle: "Acesse materiais de marketing e recursos promocionais",
      contentTitle: "Conteúdo de Marketing",
      contentDescription: "Imagens e conteúdo promocional para suas campanhas",
      manualsTitle: "Manuais",
      manualsDescription: "Manuais técnicos e guias de produtos",
      warrantiesTitle: "Informações de Garantia",
      warrantiesDescription: "Documentos e informações sobre garantias dos produtos",
    },
    en: {
      backToDashboard: "Back to Dashboard",
      marketingTitle: "Marketing",
      marketingSubtitle: "Access marketing materials and promotional resources",
      contentTitle: "Marketing Content",
      contentDescription: "Promotional images and content for your campaigns",
      manualsTitle: "Manuals",
      manualsDescription: "Technical manuals and product guides",
      warrantiesTitle: "Warranty Information",
      warrantiesDescription: "Documents and information about product warranties",
    },
  }

  const t = (key: keyof typeof translations.pt) => {
    return translations[selectedLang as keyof typeof translations][key] || translations.pt[key]
  }

  const marketingCards = [
    {
      title_pt: "Conteúdo de Marketing",
      description_pt: "Imagens e conteúdo promocional para suas campanhas",
      title_en: "Marketing Content",
      description_en: "Promotional images and content for your campaigns",
      icon: ImageIcon,
      href: "/dealer/marketing/content",
      color: "from-blue-500 to-blue-700",
      image: "/images/conteudo.png",
    },
    {
      title_pt: "Manuais",
      description_pt: "Manuais técnicos e guias de produtos",
      title_en: "Manuals",
      description_en: "Technical manuals and complete guides",
      icon: FileText,
      href: "/dealer/marketing/manuais",
      color: "from-green-500 to-green-700",
      image: "/images/manual.png",
    },
    {
      title_pt: "Informações de Garantia",
      description_pt: "Documentos e informações sobre garantias dos produtos",
      title_en: "Warranty Information",
      description_en: "Documents and information about product warranties",
      icon: Shield,
      href: "/dealer/marketing/garantias",
      color: "from-purple-500 to-purple-700",
      image: "/images/garantia.png",
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                href="/dealer/dashboard"
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                {t("backToDashboard")}
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{t("marketingTitle")}</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">{t("marketingSubtitle")}</p>
        </div>

        {/* Marketing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {marketingCards.map((card, index) => {
            const IconComponent = card.icon
            const cardTitle = selectedLang === "en" ? card.title_en : card.title_pt
            const cardDescription = selectedLang === "en" ? card.description_en : card.description_pt

            return (
              <Link key={index} href={card.href} className="group">
                <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden transform group-hover:scale-105">
                  {/* Card Image/Icon */}
                  <div className={`relative h-48 bg-gradient-to-br ${card.color}`}>
                    {card.image ? (
                      <Image
                        src={card.image || "/placeholder.svg"}
                        alt={cardTitle}
                        fill
                        className="object-cover opacity-80"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = "none"
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <IconComponent className="h-16 w-16 text-white opacity-80" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-30 transition-all duration-300"></div>
                    <div className="absolute bottom-4 left-4">
                      <IconComponent className="h-8 w-8 text-white" />
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {cardTitle}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{cardDescription}</p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
