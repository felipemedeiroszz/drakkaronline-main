"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import Image from "next/image"

interface Order {
  orderId: string
  dealer: string
  customer: { name: string; email: string; phone: string }
  model: string
  engine: string
  hull_color: string
  upholstery_package?: string
  options: string[]
  date: string
  status: string
  totalUsd?: number
  totalBrl?: number
  customerAddress?: string
  customerCity?: string
  customerState?: string
  customerZip?: string
  customerCountry?: string
  paymentMethod?: string
  depositAmount?: number
  additionalNotes?: string
}

// Force dynamic rendering and disable caching
export const dynamic = 'force-dynamic'

export default function TrackOrdersPage() {
  const [lang, setLang] = useState("pt")
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const modalContentRef = useRef<HTMLDivElement>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const translations = {
    pt: {
      "Track Orders": "Acompanhar Pedidos",
      "View and manage your current boat orders and their production status.":
        "Visualize e gerencie seus pedidos de barcos atuais e o status de produção.",
      "Back to Dashboard": "Voltar ao Painel",
      "Order ID": "ID do Pedido",
      Customer: "Cliente",
      "Boat Model": "Modelo do Barco",
      "Order Date": "Data do Pedido",
      Status: "Status",
      Actions: "Ações",
      "View Details": "Ver Detalhes",
      "No orders yet": "Nenhum pedido ainda",
      "Order Details": "Detalhes do Pedido",
      Date: "Data",
      Email: "Email",
      Phone: "Telefone",
      Engine: "Motor",
      "Hull Color": "Cor do Casco",
      "Upholstery Package": "Pacote de Estofamento",
      Options: "Opções",
      "Selected Options": "Opcionais Selecionados",
      Total: "Total (BRL)",
      Close: "Fechar",
      None: "Nenhum",
      Loading: "Carregando...",
      Address: "Endereço",
      City: "Cidade",
      State: "Estado",
      "ZIP Code": "CEP",
      Country: "País",
      "Payment Method": "Método de Pagamento",
      "Deposit Amount": "Valor do Depósito",
      "Additional Notes": "Observações",
      Refresh: "Atualizar",
      Print: "Imprimir",
      "Generate PDF": "Gerar PDF",
      "Boat Information": "Informações do Barco",
      "Payment Information": "Informações de Pagamento",
      "No options selected": "Nenhum opcional selecionado",
      "Not specified": "Não especificado",
      "Last update": "Última atualização",
      "Auto-refresh every 30s": "Atualização automática a cada 30s",
    },
    en: {
      "Track Orders": "Track Orders",
      "View and manage your current boat orders and their production status.":
        "View and manage your current boat orders and their production status.",
      "Back to Dashboard": "Back to Dashboard",
      "Order ID": "Order ID",
      Customer: "Customer",
      "Boat Model": "Boat Model",
      "Order Date": "Order Date",
      Status: "Status",
      Actions: "Actions",
      "View Details": "View Details",
      "No orders yet": "No orders yet",
      "Order Details": "Order Details",
      Date: "Date",
      Email: "Email",
      Phone: "Phone",
      Engine: "Engine",
      "Hull Color": "Hull Color",
      "Upholstery Package": "Upholstery Package",
      Options: "Options",
      "Selected Options": "Selected Options",
      Total: "Total (USD)",
      Close: "Close",
      None: "None",
      Loading: "Loading...",
      Address: "Address",
      City: "City",
      State: "State",
      "ZIP Code": "ZIP Code",
      Country: "Country",
      "Payment Method": "Payment Method",
      "Deposit Amount": "Deposit Amount",
      "Additional Notes": "Additional Notes",
      Refresh: "Refresh",
      Print: "Print",
      "Generate PDF": "Generate PDF",
      "Boat Information": "Boat Information",
      "Payment Information": "Payment Information",
      "No options selected": "No options selected",
      "Not specified": "Not specified",
      "Last update": "Last update",
      "Auto-refresh every 30s": "Auto-refresh every 30s",
    },
    es: {
      "Track Orders": "Rastrear Pedidos",
      "View and manage your current boat orders and their production status.":
        "Vea y gestione sus pedidos de barcos actuales y su estado de producción.",
      "Back to Dashboard": "Volver al Panel",
      "Order ID": "ID de Pedido",
      Customer: "Cliente",
      "Boat Model": "Modelo de Barco",
      "Order Date": "Fecha del Pedido",
      Status: "Estado",
      Actions: "Acciones",
      "View Details": "Ver Detalles",
      "No orders yet": "No hay pedidos aún",
      "Order Details": "Detalles del Pedido",
      Date: "Fecha",
      Email: "Correo Electrónico",
      Phone: "Teléfono",
      Engine: "Motor",
      "Hull Color": "Color del Casco",
      "Upholstery Package": "Paquete de Tapicería",
      Options: "Opciones",
      "Selected Options": "Opciones Seleccionadas",
      Total: "Total (USD)",
      Close: "Cerrar",
      None: "Ninguno",
      Loading: "Cargando...",
      Address: "Dirección",
      City: "Ciudad",
      State: "Estado",
      "ZIP Code": "Código Postal",
      Country: "País",
      "Payment Method": "Método de Pago",
      "Deposit Amount": "Monto del Depósito",
      "Additional Notes": "Notas Adicionales",
      Refresh: "Actualizar",
      Print: "Imprimir",
      "Generate PDF": "Generar PDF",
      "Boat Information": "Información del Barco",
      "Payment Information": "Información de Pago",
      "No options selected": "No hay opciones seleccionadas",
      "Not specified": "No especificado",
      "Last update": "Última actualización",
      "Auto-refresh every 30s": "Actualización automática cada 30s",
    },
  }

  useEffect(() => {
    const savedLang = localStorage.getItem("selectedLang") || "pt"
    setLang(savedLang)
    loadOrders()
    
    // Set up automatic polling every 30 seconds
    pollingIntervalRef.current = setInterval(() => {
      loadOrders(false) // false means don't show loading state
    }, 30000)
    
    // Handle visibility change - reload when tab becomes active
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadOrders(false)
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Handle focus event - reload when window gets focus
    const handleFocus = () => {
      loadOrders(false)
    }
    
    window.addEventListener('focus', handleFocus)
    
    // Cleanup on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  const loadOrders = async (showLoadingState = true) => {
    try {
      if (showLoadingState) {
        setLoading(true)
      }
      const dealerId = localStorage.getItem("currentDealerId") || ""

      console.log("🔍 Debug - Track Orders - Dealer ID:", dealerId)

      if (!dealerId) {
        console.error("Dealer ID não encontrado")
        setOrders([])
        return
      }

      const queryParam = `dealerId=${encodeURIComponent(dealerId)}`
      
      // Add timestamp to break cache
      const timestamp = new Date().getTime()
      const urlWithTimestamp = `/api/get-dealer-orders?${queryParam}&_t=${timestamp}`
      
      const response = await fetch(urlWithTimestamp, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
      const result = await response.json()

      if (result.success) {
        // Check if there are new orders by comparing lengths
        const newOrdersCount = result.data.length
        const currentOrdersCount = orders.length
        
        if (newOrdersCount > currentOrdersCount && !showLoadingState) {
          // Show a subtle notification that new orders were found
          console.log(`🔄 Novos pedidos detectados: ${newOrdersCount - currentOrdersCount}`)
        }
        
        setOrders(result.data)
        setLastUpdate(new Date())
        console.log(`✅ Carregados ${result.data.length} pedidos do banco de dados`)
      } else {
        console.error("Erro ao carregar pedidos:", result.error)
        setOrders([])
      }
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error)
      setOrders([])
    } finally {
      if (showLoadingState) {
        setLoading(false)
      }
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "production":
        return "bg-blue-100 text-blue-800"
      case "shipping":
        return "bg-green-100 text-green-800"
      case "delivered":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const showOrderDetails = (order: Order) => {
    setSelectedOrder(order)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedOrder(null)
  }

  const formatCurrency = (value: number | undefined, currency: "BRL" | "USD") => {
    if (value === undefined) return "N/A"
    return new Intl.NumberFormat(lang === "pt" ? "pt-BR" : "en-US", {
      style: "currency",
      currency: currency,
    }).format(value)
  }

  const renderOptionsList = (options: string[]) => {
    if (!options || options.length === 0) {
      return translations[lang as keyof typeof translations]["No options selected"]
    }

    return (
      <ul className="list-disc list-inside space-y-1 bg-gray-50 p-3 rounded-lg">
        {options.map((option, index) => (
          <li key={index} className="text-sm">
            {option}
          </li>
        ))}
      </ul>
    )
  }

  const renderOptionsListForPrint = (options: string[]) => {
    if (!options || options.length === 0) {
      return translations[lang as keyof typeof translations]["No options selected"]
    }

    return options.map((option, index) => `<li>${option}</li>`).join("")
  }

  const handlePrint = () => {
    const printWindow = window.open("", "_blank")
    if (printWindow && selectedOrder) {
      const printContent = generatePrintableContent()
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
      printWindow.close()
    }
  }

  const generatePrintableContent = () => {
    if (!selectedOrder) return ""
    const isPt = lang === "pt"

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Pedido ${selectedOrder.orderId}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              color: #333;
              line-height: 1.6;
            }
            .logo-header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #1e40af;
            }
            .logo-header img {
              max-width: 300px;
              height: auto;
              margin-bottom: 10px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .header h1 {
              color: #1e40af;
              margin: 10px 0 0 0;
              font-size: 28px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr 1fr;
              gap: 20px;
              margin-bottom: 30px;
              padding: 20px;
              background-color: #f9fafb;
              border-radius: 8px;
            }
            .info-section {
              margin-bottom: 30px;
            }
            .info-section h3 {
              color: #1e40af;
              font-size: 18px;
              margin-bottom: 15px;
              border-bottom: 1px solid #e5e7eb;
              padding-bottom: 5px;
            }
            .info-row {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 10px;
            }
            .info-item {
              margin-bottom: 10px;
            }
            .info-item strong {
              color: #374151;
            }
            .status-badge {
              display: inline-block;
              padding: 6px 12px;
              border-radius: 50px;
              font-size: 14px;
              font-weight: 600;
            }
            .status-pending {
              background-color: #fef3c7;
              color: #92400e;
            }
            .status-production {
              background-color: #dbeafe;
              color: #1e40af;
            }
            .status-shipping {
              background-color: #d1fae5;
              color: #065f46;
            }
            .status-delivered {
              background-color: #e5e7eb;
              color: #374151;
            }
            .total-highlight {
              font-size: 18px;
              font-weight: bold;
              color: ${isPt ? "#059669" : "#1e40af"};
            }
            .notes {
              background-color: #f9fafb;
              padding: 15px;
              border-radius: 8px;
              margin-top: 10px;
            }
            .options-list {
              background-color: #f9fafb;
              padding: 15px;
              border-radius: 8px;
              margin-top: 10px;
            }
            .options-list ul {
              margin: 0;
              padding-left: 20px;
            }
            .options-list li {
              margin-bottom: 5px;
              font-size: 14px;
            }
            .full-width {
              grid-column: 1 / -1;
            }
          </style>
        </head>
        <body>
          <div class="logo-header">
            <img src="/images/logo_drakkar.png" alt="Drakkar Boats" />
          </div>
          
          <div class="header">
            <h1>${translations[lang as keyof typeof translations]["Order Details"]}</h1>
          </div>

          <div class="info-grid">
            <div>
              <strong>${translations[lang as keyof typeof translations]["Order ID"]}:</strong><br>
              <span style="font-family: monospace; font-size: 14px;">${selectedOrder.orderId}</span>
            </div>
            <div>
              <strong>${translations[lang as keyof typeof translations]["Date"]}:</strong><br>
              ${selectedOrder.date}
            </div>
            <div>
              <strong>${translations[lang as keyof typeof translations]["Status"]}:</strong><br>
              <span class="status-badge status-${selectedOrder.status.toLowerCase()}">
                ${selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
              </span>
            </div>
          </div>

          <div class="info-section">
            <h3>${translations[lang as keyof typeof translations]["Customer"]}</h3>
            <div class="info-row">
              <div class="info-item">
                <strong>Nome:</strong> ${selectedOrder.customer.name}
              </div>
              <div class="info-item">
                <strong>${translations[lang as keyof typeof translations]["Email"]}:</strong> ${selectedOrder.customer.email}
              </div>
              <div class="info-item">
                <strong>${translations[lang as keyof typeof translations]["Phone"]}:</strong> ${selectedOrder.customer.phone}
              </div>
              ${
                selectedOrder.customerAddress
                  ? `
                <div class="info-item">
                  <strong>${translations[lang as keyof typeof translations]["Address"]}:</strong> ${selectedOrder.customerAddress}
                </div>
              `
                  : ""
              }
              ${
                selectedOrder.customerCity
                  ? `
                <div class="info-item">
                  <strong>${translations[lang as keyof typeof translations]["City"]}:</strong> ${selectedOrder.customerCity}
                </div>
              `
                  : ""
              }
              ${
                selectedOrder.customerState
                  ? `
                <div class="info-item">
                  <strong>${translations[lang as keyof typeof translations]["State"]}:</strong> ${selectedOrder.customerState}
                </div>
              `
                  : ""
              }
              ${
                selectedOrder.customerZip
                  ? `
                <div class="info-item">
                  <strong>${translations[lang as keyof typeof translations]["ZIP Code"]}:</strong> ${selectedOrder.customerZip}
                </div>
              `
                  : ""
              }
              ${
                selectedOrder.customerCountry
                  ? `
                <div class="info-item">
                  <strong>${translations[lang as keyof typeof translations]["Country"]}:</strong> ${selectedOrder.customerCountry}
                </div>
              `
                  : ""
              }
            </div>
          </div>

          <div class="info-section">
            <h3>${translations[lang as keyof typeof translations]["Boat Information"]}</h3>
            <div class="info-row">
              <div class="info-item">
                <strong>${translations[lang as keyof typeof translations]["Boat Model"]}:</strong> ${selectedOrder.model}
              </div>
              <div class="info-item">
                <strong>${translations[lang as keyof typeof translations]["Engine"]}:</strong> ${selectedOrder.engine}
              </div>
              <div class="info-item">
                <strong>${translations[lang as keyof typeof translations]["Hull Color"]}:</strong> ${selectedOrder.hull_color}
              </div>
              <div class="info-item">
                <strong>${translations[lang as keyof typeof translations]["Upholstery Package"]}:</strong> ${selectedOrder.upholstery_package || translations[lang as keyof typeof translations]["Not specified"]}
              </div>
              <div class="info-item full-width">
                <strong>${translations[lang as keyof typeof translations]["Selected Options"]}:</strong>
                <div class="options-list">
                  ${
                    selectedOrder.options && selectedOrder.options.length > 0
                      ? `<ul>${renderOptionsListForPrint(selectedOrder.options)}</ul>`
                      : `<p>${translations[lang as keyof typeof translations]["No options selected"]}</p>`
                  }
                </div>
              </div>
            </div>
          </div>

          <div class="info-section">
            <h3>${translations[lang as keyof typeof translations]["Payment Information"]}</h3>
            <div class="info-row">
              ${
                selectedOrder.paymentMethod
                  ? `
                <div class="info-item">
                  <strong>${translations[lang as keyof typeof translations]["Payment Method"]}:</strong> ${selectedOrder.paymentMethod}
                </div>
              `
                  : ""
              }
              ${
                selectedOrder.depositAmount
                  ? `
                <div class="info-item">
                  <strong>${translations[lang as keyof typeof translations]["Deposit Amount"]}:</strong> ${formatCurrency(selectedOrder.depositAmount, isPt ? "BRL" : "USD")}
                </div>
              `
                  : ""
              }
              <div class="info-item total-highlight">
                <strong>${translations[lang as keyof typeof translations]["Total"]}:</strong> ${formatCurrency(isPt ? selectedOrder.totalBrl : selectedOrder.totalUsd, isPt ? "BRL" : "USD")}
              </div>
            </div>
          </div>

          ${
            selectedOrder.additionalNotes
              ? `
            <div class="info-section">
              <h3>${translations[lang as keyof typeof translations]["Additional Notes"]}</h3>
              <div class="notes">${selectedOrder.additionalNotes}</div>
            </div>
          `
              : ""
          }
        </body>
      </html>
    `
  }

  const handleGeneratePdf = () => {
    const input = modalContentRef.current
    if (input && selectedOrder) {
      const buttons = input.querySelectorAll(".action-buttons")
      buttons.forEach((btn) => ((btn as HTMLElement).style.display = "none"))

      html2canvas(input, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
      }).then((canvas) => {
        const imgData = canvas.toDataURL("image/png")
        const pdf = new jsPDF("p", "mm", "a4")
        const pdfWidth = pdf.internal.pageSize.getWidth()
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width

        if (pdfHeight > pdf.internal.pageSize.getHeight()) {
          const ratio = pdf.internal.pageSize.getHeight() / pdfHeight
          pdf.addImage(imgData, "PNG", 0, 0, pdfWidth * ratio, pdf.internal.pageSize.getHeight())
        } else {
          pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight)
        }

        pdf.save(`pedido-${selectedOrder.orderId}.pdf`)

        buttons.forEach((btn) => ((btn as HTMLElement).style.display = "block"))
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-5">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-5">
          <Link
            href="/dealer/dashboard"
            className="inline-flex items-center text-blue-900 font-semibold hover:underline"
          >
            ← {translations[lang as keyof typeof translations]["Back to Dashboard"]}
          </Link>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>
                {translations[lang as keyof typeof translations]["Last update"]}: {lastUpdate.toLocaleTimeString()}
              </span>
              <span className="text-xs">
                ({translations[lang as keyof typeof translations]["Auto-refresh every 30s"]})
              </span>
            </div>
            <button
              onClick={() => loadOrders(true)}
              className="bg-blue-900 text-white px-4 py-2 rounded hover:bg-blue-800 transition-colors"
            >
              {translations[lang as keyof typeof translations]["Refresh"]}
            </button>
          </div>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-blue-900 mb-4">
            {translations[lang as keyof typeof translations]["Track Orders"]}
          </h1>
          <p className="text-lg text-gray-600">
            {
              translations[lang as keyof typeof translations][
                "View and manage your current boat orders and their production status."
              ]
            }
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">⏳</div>
              <p className="text-gray-600">{translations[lang as keyof typeof translations]["Loading"]}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-4 text-left font-semibold text-blue-900">
                      {translations[lang as keyof typeof translations]["Order ID"]}
                    </th>
                    <th className="border border-gray-300 p-4 text-left font-semibold text-blue-900">
                      {translations[lang as keyof typeof translations]["Customer"]}
                    </th>
                    <th className="border border-gray-300 p-4 text-left font-semibold text-blue-900">
                      {translations[lang as keyof typeof translations]["Boat Model"]}
                    </th>
                    <th className="border border-gray-300 p-4 text-left font-semibold text-blue-900">
                      {translations[lang as keyof typeof translations]["Order Date"]}
                    </th>
                    <th className="border border-gray-300 p-4 text-left font-semibold text-blue-900">
                      {translations[lang as keyof typeof translations]["Status"]}
                    </th>
                    <th className="border border-gray-300 p-4 text-left font-semibold text-blue-900">
                      {translations[lang as keyof typeof translations]["Actions"]}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="border border-gray-300 p-8 text-center text-gray-500">
                        <div className="text-4xl mb-4">📋</div>
                        {translations[lang as keyof typeof translations]["No orders yet"]}
                      </td>
                    </tr>
                  ) : (
                    orders.map((order, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-4 font-mono text-sm">{order.orderId}</td>
                        <td className="border border-gray-300 p-4">{order.customer.name}</td>
                        <td className="border border-gray-300 p-4">{order.model}</td>
                        <td className="border border-gray-300 p-4">{order.date}</td>
                        <td className="border border-gray-300 p-4">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(
                              order.status,
                            )}`}
                          >
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </td>
                        <td className="border border-gray-300 p-4">
                          <button
                            onClick={() => showOrderDetails(order)}
                            className="bg-blue-900 text-white px-4 py-2 rounded hover:bg-blue-800 transition-colors"
                          >
                            {translations[lang as keyof typeof translations]["View Details"]}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div ref={modalContentRef} className="p-6">
              {/* Logo Header for PDF */}
              <div className="text-center mb-6 pb-4 border-b-2 border-blue-900">
                <Image
                  src="/images/logo_drakkar.png"
                  alt="Drakkar Boats"
                  width={300}
                  height={80}
                  className="mx-auto mb-2"
                />
                <h2 className="text-2xl font-bold text-blue-900 mt-2">
                  {translations[lang as keyof typeof translations]["Order Details"]}
                </h2>
              </div>

              <button
                onClick={closeModal}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl action-buttons"
              >
                ×
              </button>

              <div className="space-y-6">
                {/* Header Info */}
                <div className="grid md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <strong>{translations[lang as keyof typeof translations]["Order ID"]}:</strong>
                    <br />
                    <span className="font-mono text-sm">{selectedOrder.orderId}</span>
                  </div>
                  <div>
                    <strong>{translations[lang as keyof typeof translations]["Date"]}:</strong>
                    <br />
                    {selectedOrder.date}
                  </div>
                  <div>
                    <strong>{translations[lang as keyof typeof translations]["Status"]}:</strong>
                    <br />
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(
                        selectedOrder.status,
                      )}`}
                    >
                      {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                    </span>
                  </div>
                </div>

                {/* Customer Info */}
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 mb-3">
                    {translations[lang as keyof typeof translations]["Customer"]}
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <strong>Nome:</strong> {selectedOrder.customer.name}
                    </div>
                    <div>
                      <strong>{translations[lang as keyof typeof translations]["Email"]}:</strong>{" "}
                      {selectedOrder.customer.email}
                    </div>
                    <div>
                      <strong>{translations[lang as keyof typeof translations]["Phone"]}:</strong>{" "}
                      {selectedOrder.customer.phone}
                    </div>
                    {selectedOrder.customerAddress && (
                      <div>
                        <strong>{translations[lang as keyof typeof translations]["Address"]}:</strong>{" "}
                        {selectedOrder.customerAddress}
                      </div>
                    )}
                    {selectedOrder.customerCity && (
                      <div>
                        <strong>{translations[lang as keyof typeof translations]["City"]}:</strong>{" "}
                        {selectedOrder.customerCity}
                      </div>
                    )}
                    {selectedOrder.customerState && (
                      <div>
                        <strong>{translations[lang as keyof typeof translations]["State"]}:</strong>{" "}
                        {selectedOrder.customerState}
                      </div>
                    )}
                    {selectedOrder.customerZip && (
                      <div>
                        <strong>{translations[lang as keyof typeof translations]["ZIP Code"]}:</strong>{" "}
                        {selectedOrder.customerZip}
                      </div>
                    )}
                    {selectedOrder.customerCountry && (
                      <div>
                        <strong>{translations[lang as keyof typeof translations]["Country"]}:</strong>{" "}
                        {selectedOrder.customerCountry}
                      </div>
                    )}
                  </div>
                </div>

                {/* Boat Info */}
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 mb-3">
                    {translations[lang as keyof typeof translations]["Boat Information"]}
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <strong>{translations[lang as keyof typeof translations]["Boat Model"]}:</strong>{" "}
                      {selectedOrder.model}
                    </div>
                    <div>
                      <strong>{translations[lang as keyof typeof translations]["Engine"]}:</strong>{" "}
                      {selectedOrder.engine}
                    </div>
                    <div>
                      <strong>{translations[lang as keyof typeof translations]["Hull Color"]}:</strong>{" "}
                      {selectedOrder.hull_color}
                    </div>
                    <div>
                      <strong>{translations[lang as keyof typeof translations]["Upholstery Package"]}:</strong>{" "}
                      {selectedOrder.upholstery_package ||
                        translations[lang as keyof typeof translations]["Not specified"]}
                    </div>
                    <div className="md:col-span-2">
                      <strong>{translations[lang as keyof typeof translations]["Selected Options"]}:</strong>
                      <div className="mt-2">{renderOptionsList(selectedOrder.options)}</div>
                    </div>
                  </div>
                </div>

                {/* Payment Info */}
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 mb-3">
                    {translations[lang as keyof typeof translations]["Payment Information"]}
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {selectedOrder.paymentMethod && (
                      <div>
                        <strong>{translations[lang as keyof typeof translations]["Payment Method"]}:</strong>{" "}
                        {selectedOrder.paymentMethod}
                      </div>
                    )}
                    {selectedOrder.depositAmount && (
                      <div>
                        <strong>{translations[lang as keyof typeof translations]["Deposit Amount"]}:</strong>{" "}
                        {formatCurrency(selectedOrder.depositAmount, lang === "pt" ? "BRL" : "USD")}
                      </div>
                    )}
                    <div className={`text-lg font-bold ${lang === "pt" ? "text-green-700" : "text-blue-900"}`}>
                      <strong>{translations[lang as keyof typeof translations]["Total"]}:</strong>{" "}
                      {formatCurrency(
                        lang === "pt" ? selectedOrder.totalBrl : selectedOrder.totalUsd,
                        lang === "pt" ? "BRL" : "USD",
                      )}
                    </div>
                  </div>
                </div>

                {/* Additional Notes */}
                {selectedOrder.additionalNotes && (
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900 mb-3">
                      {translations[lang as keyof typeof translations]["Additional Notes"]}
                    </h3>
                    <p className="bg-gray-50 p-4 rounded-lg">{selectedOrder.additionalNotes}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 text-center space-x-4 action-buttons">
                <button
                  onClick={handlePrint}
                  className="bg-blue-900 text-white px-6 py-2 rounded hover:bg-blue-800 transition-colors"
                >
                  {translations[lang as keyof typeof translations]["Print"]}
                </button>
                <button
                  onClick={handleGeneratePdf}
                  className="bg-green-700 text-white px-6 py-2 rounded hover:bg-green-800 transition-colors"
                >
                  {translations[lang as keyof typeof translations]["Generate PDF"]}
                </button>
                <button
                  onClick={closeModal}
                  className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600 transition-colors"
                >
                  {translations[lang as keyof typeof translations]["Close"]}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
