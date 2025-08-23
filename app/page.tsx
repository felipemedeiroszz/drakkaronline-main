"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"

export default function HomePage() {
  const [selectedLang, setSelectedLang] = useState<string>("pt")
  const [showDealer, setShowDealer] = useState(false)

  const pageContent = {
    pt: {
      "main-title": "Portal Dealer",
      "click-instruction": "Clique em seu país para entrar no portal",
      "footer-text-1": "Legacy of the Vikings",
      "footer-text-2": "Shipyard of Fiber Boats & Br Tecnologia Náutica",
    },
    en: {
      "main-title": "Portal Dealer",
      "click-instruction": "Click on your country to enter the portal",
      "footer-text-1": "Legacy of the Vikings",
      "footer-text-2": "Shipyard of Fiber Boats & Br Nautical Technology",
    },
    es: {
      "main-title": "Portal Dealer",
      "click-instruction": "Haga clic en su país para entrar al portal",
      "footer-text-1": "Legado de los Vikingos",
      "footer-text-2": "Astilleros de Barcos de Fibra & Br Tecnología Náutica",
    },
  }

  useEffect(() => {
    const savedLang = localStorage.getItem("selectedLang") || "pt"
    setSelectedLang(savedLang)
  }, [])

  const handleFlagClick = (lang: string) => {
    setSelectedLang(lang)
    setShowDealer(true)
    localStorage.setItem("selectedLang", lang)
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100">
      <header className="bg-blue-900 text-white p-5 text-center w-full">
        <div className="flex items-center justify-center max-w-6xl mx-auto">
          <Image src="/images/logohome.png" alt="Drakkar Boats Logo" width={300} height={80} />
        </div>
      </header>

      <main className="p-15 my-12 text-center w-4/5 max-w-4xl">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          {pageContent[selectedLang as keyof typeof pageContent]["main-title"]}
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          {pageContent[selectedLang as keyof typeof pageContent]["click-instruction"]}
        </p>

        <div className="flex justify-center gap-8 mt-8 flex-wrap">
          <Image
            src="/images/estadosunidos.png"
            alt="United States Flag"
            width={150}
            height={100}
            className="cursor-pointer border-2 border-transparent hover:border-blue-500 transition-colors"
            onClick={() => handleFlagClick("en")}
          />
          <Image
            src="/images/brasil.png"
            alt="Brazil Flag"
            width={150}
            height={100}
            className="cursor-pointer border-2 border-transparent hover:border-blue-500 transition-colors"
            onClick={() => handleFlagClick("pt")}
          />
          <Image
            src="/images/espanha.jpg"
            alt="Spain Flag"
            width={150}
            height={100}
            className="cursor-pointer border-2 border-transparent hover:border-blue-500 transition-colors"
            onClick={() => handleFlagClick("es")}
          />
          <Image
            src="/images/australia.png"
            alt="Australia Flag"
            width={150}
            height={100}
            className="cursor-pointer border-2 border-transparent hover:border-blue-500 transition-colors"
            onClick={() => handleFlagClick("en")}
          />
        </div>

        {showDealer && (
          <Link href="/dealer">
            <button className="bg-gradient-to-r from-blue-500 to-blue-900 text-white text-xl font-bold border-none rounded-lg px-10 py-4 mt-6 cursor-pointer shadow-lg hover:shadow-xl transition-shadow">
              Dealer
            </button>
          </Link>
        )}
      </main>

      <footer className="bg-gray-100 text-gray-800 p-5 text-center w-full mt-auto">
        <Link href="/administrator">
          <Image
            src="/images/favicon-32x32.png"
            alt="Admin Access"
            width={32}
            height={32}
            className="mx-auto mb-5 cursor-pointer hover:opacity-80 transition-opacity"
          />
        </Link>
        <p className="font-semibold">{pageContent[selectedLang as keyof typeof pageContent]["footer-text-1"]}</p>
        <p>{pageContent[selectedLang as keyof typeof pageContent]["footer-text-2"]}</p>
      </footer>
    </div>
  )
}
