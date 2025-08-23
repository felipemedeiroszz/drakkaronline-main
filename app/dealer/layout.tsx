"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"

export default function DealerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [lang, setLang] = useState("pt")
  const pathname = usePathname()
  const isDashboard = pathname === "/dealer/dashboard"

  useEffect(() => {
    const savedLang = localStorage.getItem("selectedLang") || "pt"
    setLang(savedLang)
  }, [])

  const translations = {
    pt: { EXIT: "Sair" },
    en: { EXIT: "Exit" },
    es: { EXIT: "Salir" },
  }

  const t = (key: keyof typeof translations.pt) => {
    return translations[lang as keyof typeof translations][key] || key
  }

  const handleExit = () => {
    localStorage.removeItem("currentDealerName")
    localStorage.removeItem("currentDealerId")
    localStorage.removeItem("selectedLang")
    window.location.href = "/"
  }

  return (
    <div className="min-h-screen bg-gray-100 relative">
      {/* Exit Button - Always show exit button for all dealer pages */}
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={handleExit}
          className="bg-blue-900 hover:bg-blue-950 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 shadow-lg"
        >
          {t("EXIT")}
        </button>
      </div>

      {children}
    </div>
  )
}
