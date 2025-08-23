"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"

export default function DealerLoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [lang, setLang] = useState("pt")

  const translations = {
    pt: {
      "Dealer Login": "Login do Dealer",
      Username: "Usuário",
      Password: "Senha",
      Login: "Entrar",
      "Invalid username or password": "Usuário ou senha inválidos",
      "Restricted access to this portal": "Acesso restrito a este portal",
      Email: "Email",
    },
    en: {
      "Dealer Login": "Dealer Login",
      Username: "Username",
      Password: "Password",
      Login: "Login",
      "Invalid username or password": "Invalid username or password",
      "Restricted access to this portal": "Restricted access to this portal",
      Email: "Email",
    },
    es: {
      "Dealer Login": "Acceso del Distribuidor",
      Username: "Usuario",
      Password: "Contraseña",
      Login: "Entrar",
      "Invalid username or password": "Usuario o contraseña inválidos",
      "Restricted access to this portal": "Acceso restringido a este portal",
      Email: "Email",
    },
  }

  useEffect(() => {
    const savedLang = localStorage.getItem("selectedLang") || "pt"
    setLang(savedLang)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    try {
      const response = await fetch("/api/dealer-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: username, password, lang }),
      })

      const result = await response.json()

      if (result.success && result.dealer) {
        console.log("Debug - Login successful, dealer info:", result.dealer)
        localStorage.setItem("currentDealerName", result.dealer.name)
        localStorage.setItem("currentDealerId", result.dealer.id.toString())
        localStorage.setItem("currentDealerEmail", result.dealer.email)
        window.location.href = "/dealer/dashboard"
      } else {
        const errorMessageKey =
          result.message === "Restricted access to this portal"
            ? "Restricted access to this portal"
            : "Invalid username or password"
        setError(translations[lang as keyof typeof translations][errorMessageKey])
      }
    } catch (error) {
      console.error("Erro no login:", error)
      setError(translations[lang as keyof typeof translations]["Invalid username or password"])
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-10 rounded-lg shadow-lg max-w-md w-full">
        <div className="text-center mb-8">
          <Image src="/images/logo.png" alt="Drakkar Boats Logo" width={200} height={80} className="mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-blue-900">
            {translations[lang as keyof typeof translations]["Dealer Login"]}
          </h1>
        </div>

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <input
              type="email"
              placeholder={translations[lang as keyof typeof translations]["Email"] || "Email"}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-base"
              required
            />
          </div>

          <div className="mb-6">
            <input
              type="password"
              placeholder={translations[lang as keyof typeof translations]["Password"]}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-base"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-900 text-white p-3 rounded-lg text-base font-semibold hover:bg-blue-800 transition-colors"
          >
            {translations[lang as keyof typeof translations]["Login"]}
          </button>
        </form>

        {error && <div className="mt-4 text-red-600 text-center">{error}</div>}
      </div>
    </div>
  )
}
