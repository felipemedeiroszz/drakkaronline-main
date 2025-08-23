"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Notification, useNotification } from "@/components/notification"

export default function DealerDashboard() {
  const [lang, setLang] = useState("pt")
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const { notification, showNotification, hideNotification } = useNotification()

  useEffect(() => {
    const savedLang = localStorage.getItem("selectedLang") || "pt"
    setLang(savedLang)
  }, [])

  const translations = {
    pt: {
      "DEALER DASHBOARD": "PAINEL DO DISTRIBUIDOR",
      "Change Password": "Alterar Senha",
      "New Boat": "Novo Barco",
      "Create a new boat order for your customers": "Crie um novo pedido de barco para seus clientes",
      "Track Orders": "Acompanhar Pedidos",
      "View and manage your current boat orders": "Visualize e gerencie seus pedidos de barcos atuais",
      "After Sales": "Pós-Venda",
      "Manage after-sales service requests": "Gerencie solicitações de serviço pós-venda",
      "Factory Production": "Produção da Fábrica",
      "View boats currently in production": "Visualize barcos atualmente em produção",
      Inventory: "Estoque",
      "Manage your boat inventory": "Gerencie seu estoque de barcos",
      Sales: "Vendas",
      "Record and manage boat sales": "Registre e gerencie vendas de barcos",
      "Quote Client": "Orçar Cliente",
      "Create quotes for potential customers": "Crie orçamentos para clientes potenciais",
      Marketing: "Marketing & Garantia",
      "Access marketing materials and content": "Acesse materiais e conteúdo de marketing",
      "Current Password": "Senha Atual",
      "New Password": "Nova Senha",
      "Confirm New Password": "Confirmar Nova Senha",
      "Update Password": "Atualizar Senha",
      Cancel: "Cancelar",
      "Password changed successfully!": "Senha alterada com sucesso!",
      "Passwords do not match": "As senhas não coincidem",
      "Please fill all fields": "Por favor, preencha todos os campos",
    },
    en: {
      "DEALER DASHBOARD": "DEALER DASHBOARD",
      "Change Password": "Change Password",
      "New Boat": "New Boat",
      "Create a new boat order for your customers": "Create a new boat order for your customers",
      "Track Orders": "Track Orders",
      "View and manage your current boat orders": "View and manage your current boat orders",
      "After Sales": "After Sales",
      "Manage after-sales service requests": "Manage after-sales service requests",
      "Factory Production": "Factory Production",
      "View boats currently in production": "View boats currently in production",
      Inventory: "Inventory",
      "Manage your boat inventory": "Manage your boat inventory",
      Sales: "Sales",
      "Record and manage boat sales": "Record and manage boat sales",
      "Quote Client": "Quote Client",
      "Create quotes for potential customers": "Create quotes for potential customers",
      Marketing: "Marketing & Warranty",
      "Access marketing materials and content": "Access marketing materials and content",
      "Current Password": "Current Password",
      "New Password": "New Password",
      "Confirm New Password": "Confirm New Password",
      "Update Password": "Update Password",
      Cancel: "Cancel",
      "Password changed successfully!": "Password changed successfully!",
      "Passwords do not match": "Passwords do not match",
      "Please fill all fields": "Please fill all fields",
    },
    es: {
      "DEALER DASHBOARD": "PANEL DEL DISTRIBUIDOR",
      "Change Password": "Cambiar Contraseña",
      "New Boat": "Nuevo Barco",
      "Create a new boat order for your customers": "Cree un nuevo pedido de barco para sus clientes",
      "Track Orders": "Rastrear Pedidos",
      "View and manage your current boat orders": "Vea y gestione sus pedidos de barcos actuales",
      "After Sales": "Postventa",
      "Manage after-sales service requests": "Gestione solicitudes de servicio postventa",
      "Factory Production": "Producción de Fábrica",
      "View boats currently in production": "Ver barcos actualmente en producción",
      Inventory: "Inventario",
      "Manage your boat inventory": "Gestione su inventario de barcos",
      Sales: "Ventas",
      "Record and manage boat sales": "Registre y gestione ventas de barcos",
      "Quote Client": "Cotizar Cliente",
      "Create quotes for potential customers": "Cree cotizaciones para clientes potenciales",
      Marketing: "Marketing & Garantia",
      "Access marketing materials and content": "Acceda a materiais y contenido de marketing",
      "Current Password": "Contraseña Actual",
      "New Password": "Nueva Contraseña",
      "Confirm New Password": "Confirmar Nueva Contraseña",
      "Update Password": "Actualizar Contraseña",
      Cancel: "Cancelar",
      "Password changed successfully!": "¡Contraseña cambiada con éxito!",
      "Passwords do not match": "Las contraseñas no coinciden",
      "Please fill all fields": "Por favor, complete todos los campos",
    },
  }

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showNotification(translations[lang as keyof typeof translations]["Please fill all fields"], "error")
      return
    }

    if (newPassword !== confirmPassword) {
      showNotification(translations[lang as keyof typeof translations]["Passwords do not match"], "error")
      return
    }

    try {
      setIsChangingPassword(true)
      const dealerId = localStorage.getItem("currentDealerId")

      const response = await fetch("/api/change-dealer-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dealerId,
          currentPassword,
          newPassword,
        }),
      })

      const result = await response.json()

      if (result.success) {
        showNotification(translations[lang as keyof typeof translations]["Password changed successfully!"], "success")
        setShowPasswordModal(false)
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      } else {
        showNotification(result.error || "Erro ao alterar senha", "error")
      }
    } catch (error) {
      console.error("Erro ao alterar senha:", error)
      showNotification("Erro ao alterar senha", "error")
    } finally {
      setIsChangingPassword(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-blue-900 py-6 px-8">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex justify-center flex-1">
            <Image
              src="/images/logodashboard.png"
              alt="Drakkar Boats Logo"
              width={300}
              height={80}
              className="h-16 w-auto"
            />
          </div>
          <button
            onClick={() => setShowPasswordModal(true)}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-600 transition-colors"
          >
            {translations[lang as keyof typeof translations]["Change Password"]}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-12 px-8">
        <div className="max-w-7xl mx-auto">
          {/* Title */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              {translations[lang as keyof typeof translations]["DEALER DASHBOARD"]}
            </h1>
          </div>

          {/* First Row - 4 Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* New Boat Card */}
            <Link
              href="/dealer/new-boat"
              className="bg-blue-900 text-white p-6 rounded-lg shadow-lg hover:bg-blue-800 transition-colors group"
            >
              <div className="flex flex-col items-center text-center">
                <Image
                  src="/images/new-boats.png"
                  alt="New Boat"
                  width={80}
                  height={80}
                  className="mb-4 group-hover:scale-110 transition-transform"
                />
                <h3 className="text-xl font-bold mb-2">
                  {translations[lang as keyof typeof translations]["New Boat"]}
                </h3>
                <p className="text-sm opacity-90">
                  {translations[lang as keyof typeof translations]["Create a new boat order for your customers"]}
                </p>
              </div>
            </Link>

            {/* Track Orders Card */}
            <Link
              href="/dealer/track-orders"
              className="bg-blue-900 text-white p-6 rounded-lg shadow-lg hover:bg-blue-800 transition-colors group"
            >
              <div className="flex flex-col items-center text-center">
                <Image
                  src="/images/track-orders.png"
                  alt="Track Orders"
                  width={80}
                  height={80}
                  className="mb-4 group-hover:scale-110 transition-transform"
                />
                <h3 className="text-xl font-bold mb-2">
                  {translations[lang as keyof typeof translations]["Track Orders"]}
                </h3>
                <p className="text-sm opacity-90">
                  {translations[lang as keyof typeof translations]["View and manage your current boat orders"]}
                </p>
              </div>
            </Link>

            {/* After Sales Card */}
            <Link
              href="/dealer/after-sales"
              className="bg-blue-900 text-white p-6 rounded-lg shadow-lg hover:bg-blue-800 transition-colors group"
            >
              <div className="flex flex-col items-center text-center">
                <Image
                  src="/images/after-sales.png"
                  alt="After Sales"
                  width={80}
                  height={80}
                  className="mb-4 group-hover:scale-110 transition-transform"
                />
                <h3 className="text-xl font-bold mb-2">
                  {translations[lang as keyof typeof translations]["After Sales"]}
                </h3>
                <p className="text-sm opacity-90">
                  {translations[lang as keyof typeof translations]["Manage after-sales service requests"]}
                </p>
              </div>
            </Link>

            {/* Factory Production Card */}
            <Link
              href="/dealer/dashboard/factory-production"
              className="bg-blue-900 text-white p-6 rounded-lg shadow-lg hover:bg-blue-800 transition-colors group"
            >
              <div className="flex flex-col items-center text-center">
                <Image
                  src="/images/factory-production.svg"
                  alt="Factory Production"
                  width={80}
                  height={80}
                  className="mb-4 group-hover:scale-110 transition-transform"
                />
                <h3 className="text-xl font-bold mb-2">
                  {translations[lang as keyof typeof translations]["Factory Production"]}
                </h3>
                <p className="text-sm opacity-90">
                  {translations[lang as keyof typeof translations]["View boats currently in production"]}
                </p>
              </div>
            </Link>
          </div>

          {/* Second Row - 4 Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {/* Sales Card */}
            <Link
              href="/dealer/sales"
              className="bg-blue-900 text-white p-6 rounded-lg shadow-lg hover:bg-blue-800 transition-colors group"
            >
              <div className="flex flex-col items-center text-center">
                <Image
                  src="/images/venda.png"
                  alt="Sales"
                  width={80}
                  height={80}
                  className="mb-4 group-hover:scale-110 transition-transform"
                />
                <h3 className="text-xl font-bold mb-2">{translations[lang as keyof typeof translations]["Sales"]}</h3>
                <p className="text-sm opacity-90">
                  {translations[lang as keyof typeof translations]["Record and manage boat sales"]}
                </p>
              </div>
            </Link>

            {/* Quote Client Card */}
            <Link
              href="/dealer/quote-client"
              className="bg-blue-900 text-white p-6 rounded-lg shadow-lg hover:bg-blue-800 transition-colors group"
            >
              <div className="flex flex-col items-center text-center">
                <Image
                  src="/images/quoteclient.png"
                  alt="Quote Client"
                  width={80}
                  height={80}
                  className="mb-4 group-hover:scale-110 transition-transform"
                />
                <h3 className="text-xl font-bold mb-2">
                  {translations[lang as keyof typeof translations]["Quote Client"]}
                </h3>
                <p className="text-sm opacity-90">
                  {translations[lang as keyof typeof translations]["Create quotes for potential customers"]}
                </p>
              </div>
            </Link>

            {/* Marketing Card */}
            <Link
              href="/dealer/marketing"
              className="bg-blue-900 text-white p-6 rounded-lg shadow-lg hover:bg-blue-800 transition-colors group"
            >
              <div className="flex flex-col items-center text-center">
                <Image
                  src="/images/marketing.png"
                  alt="Marketing"
                  width={80}
                  height={80}
                  className="mb-4 group-hover:scale-110 transition-transform"
                />
                <div>
                  <h3 className="text-xl font-bold mb-2">
                    {translations[lang as keyof typeof translations]["Marketing"]}
                  </h3>
                  <p className="text-sm opacity-90">
                    {translations[lang as keyof typeof translations]["Access marketing materials and content"]}
                  </p>
                </div>
              </div>
            </Link>
          </div>

          {/* Dragon Image */}
          <div className="flex justify-end">
            <Image
              src="/images/dragon.png"
              alt="Dragon"
              width={200}
              height={200}
              className="opacity-20 hover:opacity-40 transition-opacity"
            />
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {translations[lang as keyof typeof translations]["Change Password"]}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {translations[lang as keyof typeof translations]["Current Password"]}
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  disabled={isChangingPassword}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {translations[lang as keyof typeof translations]["New Password"]}
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  disabled={isChangingPassword}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {translations[lang as keyof typeof translations]["Confirm New Password"]}
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  disabled={isChangingPassword}
                />
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => {
                  setShowPasswordModal(false)
                  setCurrentPassword("")
                  setNewPassword("")
                  setConfirmPassword("")
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={isChangingPassword}
              >
                {translations[lang as keyof typeof translations]["Cancel"]}
              </button>
              <button
                onClick={handlePasswordChange}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                disabled={isChangingPassword}
              >
                {isChangingPassword
                  ? "Atualizando..."
                  : translations[lang as keyof typeof translations]["Update Password"]}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      <Notification
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />
    </div>
  )
}
