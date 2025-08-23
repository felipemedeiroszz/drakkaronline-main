"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Notification, useNotification } from "@/components/notification"

interface FactoryProduction {
  id: string
  boat_model: string
  engine_package: string
  hull_color: string
  upholstery_package?: string
  additional_options: string[]
  total_value_usd: number
  total_value_brl: number
  status: string
  expected_completion_date: string
  notes?: string
  created_at: string
}

interface CustomerData {
  customer_name: string
  customer_email: string
  customer_phone: string
  customer_address: string
  customer_city: string
  customer_state: string
  customer_zip: string
  customer_country: string
  payment_method: string
  deposit_amount: string
  additional_notes: string
}

export default function FactoryProductionPage() {
  const [lang, setLang] = useState<"pt" | "en" | "es">("pt")
  const [factoryProduction, setFactoryProduction] = useState<FactoryProduction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [selectedBoat, setSelectedBoat] = useState<FactoryProduction | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [customerData, setCustomerData] = useState<CustomerData>({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    customer_address: "",
    customer_city: "",
    customer_state: "",
    customer_zip: "",
    customer_country: "",
    payment_method: "",
    deposit_amount: "",
    additional_notes: "",
  })
  const { notification, showNotification, hideNotification } = useNotification()

  useEffect(() => {
    const savedLang = localStorage.getItem("selectedLang")
    if (savedLang && ["pt", "en", "es"].includes(savedLang)) {
      setLang(savedLang as "pt" | "en" | "es")
    }
    loadFactoryProduction()
  }, [])

  const translations = {
    pt: {
      "FACTORY PRODUCTION": "PRODUÇÃO DA FÁBRICA",
      "Back to Dashboard": "Voltar ao Painel",
      Model: "Modelo",
      Engine: "Motor",
      Color: "Cor",
      Upholstery: "Estofamento",
      "Additional Options": "Opcionais",
      "Value (USD)": "Valor (USD)",
      "Value (BRL)": "Valor (BRL)",
      Status: "Status",
      "Expected Completion": "Previsão de Término",
      Notes: "Observações",
      Actions: "Ações",
      "Convert to Order": "Virar Pedido",
      "No boats in production": "Nenhum barco em produção",
      "Loading...": "Carregando...",
      "No options": "Sem opcionais",
      "Customer Information": "Informações do Cliente",
      "Customer Name": "Nome do Cliente",
      Email: "Email",
      Phone: "Telefone",
      Address: "Endereço",
      City: "Cidade",
      State: "Estado",
      "ZIP Code": "CEP",
      Country: "País",
      "Payment Method": "Método de Pagamento",
      "Deposit Amount": "Valor do Depósito",
      "Additional Notes": "Observações Adicionais",
      "Create Order": "Criar Pedido",
      Cancel: "Cancelar",
      Cash: "À Vista",
      Financing: "Financiamento",
      "Trade-in": "Troca",
      "For Plan": "Por Plano",
      "Order created successfully!": "Pedido criado com sucesso!",
      "Please fill all required fields": "Por favor, preencha todos os campos obrigatórios",
      "Fill with Dealer Info": "Preencher com Dados do Dealer",
      planning: "Planejamento",
      hull_construction: "Construção do Casco",
      engine_installation: "Instalação do Motor",
      interior_work: "Trabalho Interior",
      final_assembly: "Montagem Final",
      quality_control: "Controle de Qualidade",
      ready_for_delivery: "Pronto para Entrega",
      completed: "Concluído",
    },
    en: {
      "FACTORY PRODUCTION": "FACTORY PRODUCTION",
      "Back to Dashboard": "Back to Dashboard",
      Model: "Model",
      Engine: "Engine",
      Color: "Color",
      Upholstery: "Upholstery",
      "Additional Options": "Additional Options",
      "Value (USD)": "Value (USD)",
      "Value (BRL)": "Value (BRL)",
      Status: "Status",
      "Expected Completion": "Expected Completion",
      Notes: "Notes",
      Actions: "Actions",
      "Convert to Order": "Convert to Order",
      "No boats in production": "No boats in production",
      "Loading...": "Loading...",
      "No options": "No options",
      "Customer Information": "Customer Information",
      "Customer Name": "Customer Name",
      Email: "Email",
      Phone: "Phone",
      Address: "Address",
      City: "City",
      State: "State",
      "ZIP Code": "ZIP Code",
      Country: "Country",
      "Payment Method": "Payment Method",
      "Deposit Amount": "Deposit Amount",
      "Additional Notes": "Additional Notes",
      "Create Order": "Create Order",
      Cancel: "Cancel",
      Cash: "Cash",
      Financing: "Financing",
      "Trade-in": "Trade-in",
      "For Plan": "For Plan",
      "Order created successfully!": "Order created successfully!",
      "Please fill all required fields": "Please fill all required fields",
      "Fill with Dealer Info": "Fill with Dealer Info",
      planning: "Planning",
      hull_construction: "Hull Construction",
      engine_installation: "Engine Installation",
      interior_work: "Interior Work",
      final_assembly: "Final Assembly",
      quality_control: "Quality Control",
      ready_for_delivery: "Ready for Delivery",
      completed: "Completed",
    },
    es: {
      "FACTORY PRODUCTION": "PRODUCCIÓN DE FÁBRICA",
      "Back to Dashboard": "Volver al Panel",
      Model: "Modelo",
      Engine: "Motor",
      Color: "Color",
      Upholstery: "Tapicería",
      "Additional Options": "Opciones Adicionales",
      "Value (USD)": "Valor (USD)",
      "Value (BRL)": "Valor (BRL)",
      Status: "Estado",
      "Expected Completion": "Finalización Esperada",
      Notes: "Notas",
      Actions: "Acciones",
      "Convert to Order": "Convertir a Pedido",
      "No boats in production": "No hay barcos en producción",
      "Loading...": "Cargando...",
      "No options": "Sin opciones",
      "Customer Information": "Información del Cliente",
      "Customer Name": "Nombre del Cliente",
      Email: "Correo Electrónico",
      Phone: "Teléfono",
      Address: "Dirección",
      City: "Ciudad",
      State: "Estado",
      "ZIP Code": "Código Postal",
      Country: "País",
      "Payment Method": "Método de Pago",
      "Deposit Amount": "Monto del Depósito",
      "Additional Notes": "Notas Adicionales",
      "Create Order": "Crear Pedido",
      Cancel: "Cancelar",
      Cash: "Efectivo",
      Financing: "Financiamiento",
      "Trade-in": "Intercambio",
      "For Plan": "Por Plan",
      "Order created successfully!": "¡Pedido creado con éxito!",
      "Please fill all required fields": "Por favor, complete todos los campos requeridos",
      "Fill with Dealer Info": "Llenar con Datos del Distribuidor",
      planning: "Planificación",
      hull_construction: "Construcción del Casco",
      engine_installation: "Instalación del Motor",
      interior_work: "Trabajo Interior",
      final_assembly: "Ensamblaje Final",
      quality_control: "Control de Calidad",
      ready_for_delivery: "Listo para Entrega",
      completed: "Completado",
    },
  } as const

  const t = (key: keyof (typeof translations)["pt"]) => {
    return translations[lang][key] || key
  }

  const loadFactoryProduction = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/factory-production")
      const result = await response.json()

      if (result.success) {
        setFactoryProduction(result.data)
      } else {
        showNotification("❌ Erro ao carregar produção da fábrica", "error")
      }
    } catch (error) {
      console.error("Error loading factory production:", error)
      showNotification("❌ Erro ao conectar com o servidor", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status?.toLowerCase()) {
      case "planning":
        return "bg-gray-100 text-gray-800"
      case "hull_construction":
        return "bg-blue-100 text-blue-800"
      case "engine_installation":
        return "bg-yellow-100 text-yellow-800"
      case "interior_work":
        return "bg-purple-100 text-purple-800"
      case "final_assembly":
        return "bg-orange-100 text-orange-800"
      case "quality_control":
        return "bg-indigo-100 text-indigo-800"
      case "ready_for_delivery":
        return "bg-green-100 text-green-800"
      case "completed":
        return "bg-green-200 text-green-900"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatCurrency = (value: number, currency: "USD" | "BRL") => {
    return new Intl.NumberFormat(lang === "pt" ? "pt-BR" : "en-US", {
      style: "currency",
      currency: currency,
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString(lang === "pt" ? "pt-BR" : "en-US")
  }

  const handleConvertToOrder = (boat: FactoryProduction) => {
    setSelectedBoat(boat)
    setShowOrderModal(true)
  }

  const handleCloseModal = () => {
    setShowOrderModal(false)
    setSelectedBoat(null)
    setCustomerData({
      customer_name: "",
      customer_email: "",
      customer_phone: "",
      customer_address: "",
      customer_city: "",
      customer_state: "",
      customer_zip: "",
      customer_country: "",
      payment_method: "",
      deposit_amount: "",
      additional_notes: "",
    })
  }

  const handleInputChange = (field: keyof CustomerData, value: string) => {
    setCustomerData((prev) => ({ ...prev, [field]: value }))
  }

  const fillDealerInfo = async () => {
    const dealerId = localStorage.getItem("currentDealerId")

    if (!dealerId) {
      showNotification("ID do dealer não encontrado", "error")
      return
    }

    try {
      const response = await fetch("/api/get-dealer-details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ dealerId }),
      })
      const result = await response.json()

      if (result.success && result.data) {
        const dealer = result.data
        setCustomerData((prev) => ({
          ...prev,
          customer_name: dealer.name || "",
          customer_email: dealer.email || "",
          customer_phone: dealer.phone || "",
          customer_address: dealer.address || "",
          customer_city: dealer.city || "",
          customer_state: dealer.state || "",
          customer_zip: dealer.zip_code || "",
          customer_country: dealer.country || "",
        }))
        showNotification("Dados do dealer preenchidos com sucesso!", "success")
      } else {
        showNotification(result.error || "Erro ao buscar dados do dealer", "error")
      }
    } catch (error) {
      console.error("Erro ao buscar dados do dealer:", error)
      showNotification("Erro ao buscar dados do dealer", "error")
    }
  }

  const generateOrderId = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, "0")
    const day = String(today.getDate()).padStart(2, "0")
    const timestamp = Date.now().toString().slice(-4)
    return `ORD-${year}${month}${day}-${timestamp}`
  }

  const handleCreateOrder = async () => {
    if (
      !customerData.customer_name ||
      !customerData.customer_email ||
      !customerData.customer_phone ||
      !customerData.payment_method
    ) {
      showNotification(t("Please fill all required fields"), "error")
      return
    }

    if (!selectedBoat) return

    try {
      setIsSubmitting(true)
      const orderId = generateOrderId()

      const orderData = {
        order_id: orderId,
        dealer_id: localStorage.getItem("currentDealerId") || "",
        customer_name: customerData.customer_name,
        customer_email: customerData.customer_email,
        customer_phone: customerData.customer_phone,
        customer_address: customerData.customer_address,
        customer_city: customerData.customer_city,
        customer_state: customerData.customer_state,
        customer_zip: customerData.customer_zip,
        customer_country: customerData.customer_country,
        boat_model: selectedBoat.boat_model,
        engine_package: selectedBoat.engine_package,
        hull_color: selectedBoat.hull_color,
        upholstery_package: selectedBoat.upholstery_package || "",
        additional_options: selectedBoat.additional_options || [],
        payment_method: customerData.payment_method,
        deposit_amount: Number.parseFloat(customerData.deposit_amount) || 0,
        additional_notes: customerData.additional_notes,
        total_usd: selectedBoat.total_value_usd,
        total_brl: selectedBoat.total_value_brl,
        status: "pending",
        factoryProductionId: selectedBoat.id,
      }

      const response = await fetch("/api/save-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      })

      const result = await response.json()

      if (result.success) {
        showNotification(t("Order created successfully!"), "success")

        // Remove the boat from local state immediately for better UX
        setFactoryProduction((prev) => prev.filter((item) => item.id !== selectedBoat.id))

        handleCloseModal()

        // Redirect to track orders after a short delay
        setTimeout(() => {
          window.location.href = "/dealer/track-orders"
        }, 2000)
      } else {
        throw new Error(result.error || "Erro ao salvar pedido")
      }
    } catch (error) {
      console.error("Erro ao criar pedido:", error)
      showNotification("Erro ao criar pedido: " + String(error), "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-blue-900 py-6 px-8">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Image
              src="/images/logodashboard.png"
              alt="Drakkar Boats Logo"
              width={200}
              height={60}
              className="h-12 w-auto"
            />
            <div className="flex items-center gap-2 text-white">
              <Image
                src="/images/factory.svg"
                alt="Factory"
                width={32}
                height={32}
                className="w-8 h-8"
              />
              <h1 className="text-2xl font-bold">{t("FACTORY PRODUCTION")}</h1>
            </div>
          </div>
          <Link
            href="/dealer/dashboard"
            className="bg-white text-blue-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            ← {t("Back to Dashboard")}
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-8 px-8">
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <div className="bg-white p-8 rounded-lg shadow text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">{t("Loading...")}</p>
            </div>
          ) : factoryProduction.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow text-center">
              <Image
                src="/images/factory.svg"
                alt="Factory"
                width={64}
                height={64}
                className="w-16 h-16 mx-auto mb-4 opacity-50"
              />
              <p className="text-gray-600 text-lg">{t("No boats in production")}</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">{t("Model")}</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">{t("Engine")}</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">{t("Color")}</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">{t("Upholstery")}</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                        {t("Additional Options")}
                      </th>
                      {lang === "en" && (
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">{t("Value (USD)")}</th>
                      )}
                      {lang === "pt" && (
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">{t("Value (BRL)")}</th>
                      )}
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">{t("Status")}</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                        {t("Expected Completion")}
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">{t("Notes")}</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">{t("Actions")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {factoryProduction.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.boat_model}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{item.engine_package}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{item.hull_color}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{item.upholstery_package || "-"}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {item.additional_options && item.additional_options.length > 0 ? (
                            <div className="space-y-1">
                              {item.additional_options.slice(0, 2).map((option, index) => (
                                <div key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                  {option}
                                </div>
                              ))}
                              {item.additional_options.length > 2 && (
                                <div className="text-xs text-gray-500">+{item.additional_options.length - 2} more</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">{t("No options")}</span>
                          )}
                        </td>
                        {lang === "en" && (
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                            {formatCurrency(item.total_value_usd, "USD")}
                          </td>
                        )}
                        {lang === "pt" && (
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                            {formatCurrency(item.total_value_brl, "BRL")}
                          </td>
                        )}
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(item.status)}`}
                          >
                            {t(item.status as keyof typeof translations.pt)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{formatDate(item.expected_completion_date)}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{item.notes || "-"}</td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleConvertToOrder(item)}
                            className="bg-green-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-green-700 transition-colors"
                          >
                            {t("Convert to Order")}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Convert to Order Modal */}
      {showOrderModal && selectedBoat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{t("Convert to Order")}</h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                  disabled={isSubmitting}
                >
                  ×
                </button>
              </div>

              {/* Boat Summary */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Resumo do Barco</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Modelo:</span> {selectedBoat.boat_model}
                  </div>
                  <div>
                    <span className="font-medium">Motor:</span> {selectedBoat.engine_package}
                  </div>
                  <div>
                    <span className="font-medium">Cor:</span> {selectedBoat.hull_color}
                  </div>
                  <div>
                    <span className="font-medium">Estofamento:</span> {selectedBoat.upholstery_package || "-"}
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium">Valor Total:</span>{" "}
                    {formatCurrency(selectedBoat.total_value_usd, "USD")} /{" "}
                    {formatCurrency(selectedBoat.total_value_brl, "BRL")}
                  </div>
                </div>
              </div>

              {/* Customer Form */}
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">{t("Customer Information")}</h3>
                  <button
                    type="button"
                    onClick={fillDealerInfo}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-green-700 transition-colors"
                    disabled={isSubmitting}
                  >
                    {t("Fill with Dealer Info")}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t("Customer Name")} *</label>
                    <input
                      type="text"
                      value={customerData.customer_name}
                      onChange={(e) => handleInputChange("customer_name", e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t("Email")} *</label>
                    <input
                      type="email"
                      value={customerData.customer_email}
                      onChange={(e) => handleInputChange("customer_email", e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t("Phone")} *</label>
                    <input
                      type="tel"
                      value={customerData.customer_phone}
                      onChange={(e) => handleInputChange("customer_phone", e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t("Address")}</label>
                    <input
                      type="text"
                      value={customerData.customer_address}
                      onChange={(e) => handleInputChange("customer_address", e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t("City")}</label>
                    <input
                      type="text"
                      value={customerData.customer_city}
                      onChange={(e) => handleInputChange("customer_city", e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t("State")}</label>
                    <input
                      type="text"
                      value={customerData.customer_state}
                      onChange={(e) => handleInputChange("customer_state", e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t("ZIP Code")}</label>
                    <input
                      type="text"
                      value={customerData.customer_zip}
                      onChange={(e) => handleInputChange("customer_zip", e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t("Country")}</label>
                    <input
                      type="text"
                      value={customerData.customer_country}
                      onChange={(e) => handleInputChange("customer_country", e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t("Payment Method")} *</label>
                    <select
                      value={customerData.payment_method}
                      onChange={(e) => handleInputChange("payment_method", e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      required
                      disabled={isSubmitting}
                    >
                      <option value="">-- Selecionar --</option>
                      <option value="cash">{t("Cash")}</option>
                      <option value="financing">{t("Financing")}</option>
                      <option value="trade-in">{t("Trade-in")}</option>
                      <option value="for-plan">{t("For Plan")}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("Deposit Amount")} ({lang === "pt" ? "BRL" : "USD"})
                    </label>
                    <input
                      type="number"
                      value={customerData.deposit_amount}
                      onChange={(e) => handleInputChange("deposit_amount", e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      min="0"
                      step="0.01"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t("Additional Notes")}</label>
                  <textarea
                    value={customerData.additional_notes}
                    onChange={(e) => handleInputChange("additional_notes", e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    rows={3}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isSubmitting}
                >
                  {t("Cancel")}
                </button>
                <button
                  onClick={handleCreateOrder}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Criando..." : t("Create Order")}
                </button>
              </div>
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
