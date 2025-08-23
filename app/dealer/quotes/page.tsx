"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { Notification, useNotification } from "@/components/notification"

interface Quote {
  quoteId: string
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
  validUntil?: string
}

export default function QuotesPage() {
  const [lang, setLang] = useState("pt")
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isPrinting, setIsPrinting] = useState(false)
  const modalContentRef = useRef<HTMLDivElement>(null)
  const { notification, showNotification, hideNotification } = useNotification()

  const translations = {
    pt: {
      "Manage Quotes": "Gerenciar Orçamentos",
      "View and manage your customer quotes": "Visualize e gerencie os orçamentos dos seus clientes",
      "Back to Dashboard": "Voltar ao Painel",
      "New Quote": "Novo Orçamento",
      "Quote ID": "ID do Orçamento",
      Customer: "Cliente",
      "Boat Model": "Modelo do Barco",
      "Quote Date": "Data do Orçamento",
      Status: "Status",
      "Valid Until": "Válido Até",
      Actions: "Ações",
      "View Details": "Ver Detalhes",
      "Accept Quote": "Aceitar Orçamento",
      "No quotes yet": "Nenhum orçamento ainda",
      "Quote Details": "Detalhes do Orçamento",
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
      "Quote accepted and converted to order!": "Orçamento aceito e convertido em pedido!",
      "Error accepting quote": "Erro ao aceitar orçamento",
      "Generating PDF...": "Gerando PDF...",
      "PDF generated successfully!": "PDF gerado com sucesso!",
      "Error generating PDF": "Erro ao gerar PDF",
      "Not specified": "Não especificado",
      pending: "Pendente",
      accepted: "Aceito",
      rejected: "Rejeitado",
      expired: "Expirado",
    },
    en: {
      "Manage Quotes": "Manage Quotes",
      "View and manage your customer quotes": "View and manage your customer quotes",
      "Back to Dashboard": "Back to Dashboard",
      "New Quote": "New Quote",
      "Quote ID": "Quote ID",
      Customer: "Customer",
      "Boat Model": "Boat Model",
      "Quote Date": "Quote Date",
      Status: "Status",
      "Valid Until": "Valid Until",
      Actions: "Actions",
      "View Details": "View Details",
      "Accept Quote": "Accept Quote",
      "No quotes yet": "No quotes yet",
      "Quote Details": "Quote Details",
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
      "Quote accepted and converted to order!": "Quote accepted and converted to order!",
      "Error accepting quote": "Error accepting quote",
      "Generating PDF...": "Generating PDF...",
      "PDF generated successfully!": "PDF generated successfully!",
      "Error generating PDF": "Error generating PDF",
      "Not specified": "Not specified",
      pending: "Pending",
      accepted: "Accepted",
      rejected: "Rejected",
      expired: "Expired",
    },
    es: {
      "Manage Quotes": "Gestionar Cotizaciones",
      "View and manage your customer quotes": "Vea y gestione las cotizaciones de sus clientes",
      "Back to Dashboard": "Volver al Panel",
      "New Quote": "Nueva Cotización",
      "Quote ID": "ID de Cotización",
      Customer: "Cliente",
      "Boat Model": "Modelo de Barco",
      "Quote Date": "Fecha de Cotización",
      Status: "Estado",
      "Valid Until": "Válido Hasta",
      Actions: "Acciones",
      "View Details": "Ver Detalles",
      "Accept Quote": "Aceptar Cotización",
      "No quotes yet": "No hay cotizaciones aún",
      "Quote Details": "Detalles de la Cotización",
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
      "Quote accepted and converted to order!": "¡Cotización aceptada y convertida en pedido!",
      "Error accepting quote": "Error al aceptar cotización",
      "Generating PDF...": "Generando PDF...",
      "PDF generated successfully!": "¡PDF generado con éxito!",
      "Error generating PDF": "Error al generar PDF",
      "Not specified": "No especificado",
      pending: "Pendiente",
      accepted: "Aceptado",
      rejected: "Rechazado",
      expired: "Expirado",
    },
  }

  useEffect(() => {
    const savedLang = localStorage.getItem("selectedLang") || "pt"
    setLang(savedLang)
    loadQuotes()
  }, [])

  const loadQuotes = async () => {
    try {
      setLoading(true)
      const dealerId = localStorage.getItem("currentDealerId") || ""

      if (!dealerId) {
        console.error("ID do dealer não encontrado")
        setQuotes([])
        return
      }

      const response = await fetch(`/api/get-dealer-quotes?dealerId=${encodeURIComponent(dealerId)}`)
      const result = await response.json()

      if (result.success) {
        setQuotes(result.data)
        console.log(`✅ Carregados ${result.data.length} orçamentos do banco de dados`)
      } else {
        console.error("Erro ao carregar orçamentos:", result.error)
        setQuotes([])
      }
    } catch (error) {
      console.error("Erro ao carregar orçamentos:", error)
      setQuotes([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "accepted":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      case "expired":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const showQuoteDetails = (quote: Quote) => {
    setSelectedQuote(quote)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedQuote(null)
  }

  const handleAcceptQuote = async (quoteId: string) => {
    try {
      const response = await fetch("/api/accept-quote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quoteId }),
      })

      const result = await response.json()

      if (result.success) {
        showNotification(
          translations[lang as keyof typeof translations]["Quote accepted and converted to order!"],
          "success",
        )
        loadQuotes() // Reload quotes to update status
        closeModal()

        // Redirect to track orders after a delay
        setTimeout(() => {
          window.location.href = "/dealer/track-orders"
        }, 2000)
      } else {
        throw new Error(result.error || "Erro ao aceitar orçamento")
      }
    } catch (error) {
      console.error("Erro ao aceitar orçamento:", error)
      showNotification(translations[lang as keyof typeof translations]["Error accepting quote"], "error")
    }
  }

  const handlePrint = () => {
    // Hide action buttons before printing
    const actionButtons = document.querySelectorAll(".action-buttons")
    actionButtons.forEach((btn) => {
      ;(btn as HTMLElement).style.display = "none"
    })

    // Print
    window.print()

    // Show action buttons after printing
    setTimeout(() => {
      actionButtons.forEach((btn) => {
        ;(btn as HTMLElement).style.display = "block"
      })
    }, 1000)
  }

  const generatePDF = async () => {
    if (!selectedQuote) return

    try {
      setIsPrinting(true)
      showNotification(translations[lang as keyof typeof translations]["Generating PDF..."], "info")

      // Dynamically import the libraries
      const { default: jsPDF } = await import("jspdf")
      const { default: html2canvas } = await import("html2canvas")

      if (!modalContentRef.current) {
        throw new Error("Modal content not found")
      }

      // Hide action buttons before capturing
      const actionButtons = document.querySelectorAll(".action-buttons")
      actionButtons.forEach((btn) => {
        ;(btn as HTMLElement).style.display = "none"
      })

      // Wait a bit for the DOM to update
      await new Promise((resolve) => setTimeout(resolve, 100))

      const canvas = await html2canvas(modalContentRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        width: modalContentRef.current.scrollWidth,
        height: modalContentRef.current.scrollHeight,
        scrollX: 0,
        scrollY: 0,
      })

      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF("p", "mm", "a4")
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = pdfWidth
      const imgHeight = (canvas.height * pdfWidth) / canvas.width

      let heightLeft = imgHeight
      let position = 0

      // Add first page
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
      heightLeft -= pdfHeight

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
        heightLeft -= pdfHeight
      }

      pdf.save(`orcamento-${selectedQuote.quoteId}.pdf`)

      showNotification(translations[lang as keyof typeof translations]["PDF generated successfully!"], "success")

      // Show action buttons again
      actionButtons.forEach((btn) => {
        ;(btn as HTMLElement).style.display = "block"
      })
    } catch (error) {
      console.error("Erro ao gerar PDF:", error)
      showNotification(translations[lang as keyof typeof translations]["Error generating PDF"], "error")
    } finally {
      setIsPrinting(false)
    }
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

  const isQuoteExpired = (validUntil?: string) => {
    if (!validUntil) return false
    return new Date(validUntil) < new Date()
  }

  return (
    <>
      <div className="min-h-screen bg-gray-100 py-10 px-5">
        <Notification
          message={notification.message}
          type={notification.type}
          isVisible={notification.isVisible}
          onClose={hideNotification}
        />
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-5">
            <Link
              href="/dealer/dashboard"
              className="inline-flex items-center text-blue-900 font-semibold hover:underline"
            >
              ← {translations[lang as keyof typeof translations]["Back to Dashboard"]}
            </Link>
            <div className="flex space-x-4">
              <Link
                href="/dealer/quote-client"
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
              >
                {translations[lang as keyof typeof translations]["New Quote"]}
              </Link>
              <button
                onClick={loadQuotes}
                className="bg-blue-900 text-white px-4 py-2 rounded hover:bg-blue-800 transition-colors"
              >
                {translations[lang as keyof typeof translations]["Refresh"]}
              </button>
            </div>
          </div>

          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-blue-900 mb-4">
              {translations[lang as keyof typeof translations]["Manage Quotes"]}
            </h1>
            <p className="text-lg text-gray-600">
              {translations[lang as keyof typeof translations]["View and manage your customer quotes"]}
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
                        {translations[lang as keyof typeof translations]["Quote ID"]}
                      </th>
                      <th className="border border-gray-300 p-4 text-left font-semibold text-blue-900">
                        {translations[lang as keyof typeof translations]["Customer"]}
                      </th>
                      <th className="border border-gray-300 p-4 text-left font-semibold text-blue-900">
                        {translations[lang as keyof typeof translations]["Boat Model"]}
                      </th>
                      <th className="border border-gray-300 p-4 text-left font-semibold text-blue-900">
                        {translations[lang as keyof typeof translations]["Quote Date"]}
                      </th>
                      <th className="border border-gray-300 p-4 text-left font-semibold text-blue-900">
                        {translations[lang as keyof typeof translations]["Valid Until"]}
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
                    {quotes.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="border border-gray-300 p-8 text-center text-gray-500">
                          <div className="text-4xl mb-4">📋</div>
                          {translations[lang as keyof typeof translations]["No quotes yet"]}
                        </td>
                      </tr>
                    ) : (
                      quotes.map((quote, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="border border-gray-300 p-4 font-mono text-sm">{quote.quoteId}</td>
                          <td className="border border-gray-300 p-4">{quote.customer.name}</td>
                          <td className="border border-gray-300 p-4">{quote.model}</td>
                          <td className="border border-gray-300 p-4">{quote.date}</td>
                          <td className="border border-gray-300 p-4">
                            {quote.validUntil ? new Date(quote.validUntil).toLocaleDateString() : "N/A"}
                          </td>
                          <td className="border border-gray-300 p-4">
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(
                                isQuoteExpired(quote.validUntil) && quote.status === "pending"
                                  ? "expired"
                                  : quote.status,
                              )}`}
                            >
                              {
                                translations[lang as keyof typeof translations][
                                  (isQuoteExpired(quote.validUntil) && quote.status === "pending"
                                    ? "expired"
                                    : quote.status) as keyof (typeof translations)[typeof lang]
                                ]
                              }
                            </span>
                          </td>
                          <td className="border border-gray-300 p-4">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => showQuoteDetails(quote)}
                                className="bg-blue-900 text-white px-3 py-1 rounded text-sm hover:bg-blue-800 transition-colors"
                              >
                                {translations[lang as keyof typeof translations]["View Details"]}
                              </button>
                              {quote.status === "pending" && !isQuoteExpired(quote.validUntil) && (
                                <button
                                  onClick={() => handleAcceptQuote(quote.quoteId)}
                                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                                >
                                  {translations[lang as keyof typeof translations]["Accept Quote"]}
                                </button>
                              )}
                            </div>
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
      </div>

      {/* Quote Details Modal */}
      {showModal && selectedQuote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div ref={modalContentRef} className="p-6 print-content">
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
                  {translations[lang as keyof typeof translations]["Quote Details"]}
                </h2>
              </div>

              <button
                onClick={closeModal}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl action-buttons print:hidden"
              >
                ×
              </button>

              <div className="space-y-6">
                {/* Header Info */}
                <div className="grid md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <strong>{translations[lang as keyof typeof translations]["Quote ID"]}:</strong>
                    <br />
                    <span className="font-mono text-sm">{selectedQuote.quoteId}</span>
                  </div>
                  <div>
                    <strong>{translations[lang as keyof typeof translations]["Date"]}:</strong>
                    <br />
                    {selectedQuote.date}
                  </div>
                  <div>
                    <strong>{translations[lang as keyof typeof translations]["Status"]}:</strong>
                    <br />
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(
                        isQuoteExpired(selectedQuote.validUntil) && selectedQuote.status === "pending"
                          ? "expired"
                          : selectedQuote.status,
                      )}`}
                    >
                      {
                        translations[lang as keyof typeof translations][
                          (isQuoteExpired(selectedQuote.validUntil) && selectedQuote.status === "pending"
                            ? "expired"
                            : selectedQuote.status) as keyof (typeof translations)[typeof lang]
                        ]
                      }
                    </span>
                  </div>
                </div>

                {/* Valid Until Info */}
                {selectedQuote.validUntil && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <strong>{translations[lang as keyof typeof translations]["Valid Until"]}:</strong>{" "}
                    {new Date(selectedQuote.validUntil).toLocaleDateString()}
                    {isQuoteExpired(selectedQuote.validUntil) && (
                      <span className="ml-2 text-red-600 font-semibold">(Expirado)</span>
                    )}
                  </div>
                )}

                {/* Customer Info */}
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 mb-3">
                    {translations[lang as keyof typeof translations]["Customer"]}
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <strong>Nome:</strong> {selectedQuote.customer.name}
                    </div>
                    <div>
                      <strong>{translations[lang as keyof typeof translations]["Email"]}:</strong>{" "}
                      {selectedQuote.customer.email}
                    </div>
                    <div>
                      <strong>{translations[lang as keyof typeof translations]["Phone"]}:</strong>{" "}
                      {selectedQuote.customer.phone}
                    </div>
                    {selectedQuote.customerAddress && (
                      <div>
                        <strong>{translations[lang as keyof typeof translations]["Address"]}:</strong>{" "}
                        {selectedQuote.customerAddress}
                      </div>
                    )}
                    {selectedQuote.customerCity && (
                      <div>
                        <strong>{translations[lang as keyof typeof translations]["City"]}:</strong>{" "}
                        {selectedQuote.customerCity}
                      </div>
                    )}
                    {selectedQuote.customerState && (
                      <div>
                        <strong>{translations[lang as keyof typeof translations]["State"]}:</strong>{" "}
                        {selectedQuote.customerState}
                      </div>
                    )}
                    {selectedQuote.customerZip && (
                      <div>
                        <strong>{translations[lang as keyof typeof translations]["ZIP Code"]}:</strong>{" "}
                        {selectedQuote.customerZip}
                      </div>
                    )}
                    {selectedQuote.customerCountry && (
                      <div>
                        <strong>{translations[lang as keyof typeof translations]["Country"]}:</strong>{" "}
                        {selectedQuote.customerCountry}
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
                      {selectedQuote.model}
                    </div>
                    <div>
                      <strong>{translations[lang as keyof typeof translations]["Engine"]}:</strong>{" "}
                      {selectedQuote.engine}
                    </div>
                    <div>
                      <strong>{translations[lang as keyof typeof translations]["Hull Color"]}:</strong>{" "}
                      {selectedQuote.hull_color}
                    </div>
                    <div>
                      <strong>{translations[lang as keyof typeof translations]["Upholstery Package"]}:</strong>{" "}
                      {selectedQuote.upholstery_package ||
                        translations[lang as keyof typeof translations]["Not specified"]}
                    </div>
                    <div className="md:col-span-2">
                      <strong>{translations[lang as keyof typeof translations]["Selected Options"]}:</strong>
                      <div className="mt-2">{renderOptionsList(selectedQuote.options)}</div>
                    </div>
                  </div>
                </div>

                {/* Payment Info */}
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 mb-3">
                    {translations[lang as keyof typeof translations]["Payment Information"]}
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {selectedQuote.paymentMethod && (
                      <div>
                        <strong>{translations[lang as keyof typeof translations]["Payment Method"]}:</strong>{" "}
                        {selectedQuote.paymentMethod}
                      </div>
                    )}
                    {selectedQuote.depositAmount && (
                      <div>
                        <strong>{translations[lang as keyof typeof translations]["Deposit Amount"]}:</strong>{" "}
                        {formatCurrency(selectedQuote.depositAmount, lang === "pt" ? "BRL" : "USD")}
                      </div>
                    )}
                    <div className={`text-lg font-bold ${lang === "pt" ? "text-green-700" : "text-blue-900"}`}>
                      <strong>{translations[lang as keyof typeof translations]["Total"]}:</strong>{" "}
                      {formatCurrency(
                        lang === "pt" ? selectedQuote.totalBrl : selectedQuote.totalUsd,
                        lang === "pt" ? "BRL" : "USD",
                      )}
                    </div>
                  </div>
                </div>

                {/* Additional Notes */}
                {selectedQuote.additionalNotes && (
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900 mb-3">
                      {translations[lang as keyof typeof translations]["Additional Notes"]}
                    </h3>
                    <p className="bg-gray-50 p-4 rounded-lg">{selectedQuote.additionalNotes}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 text-center space-x-4 action-buttons print:hidden">
                <button
                  onClick={handlePrint}
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  {translations[lang as keyof typeof translations]["Print"]}
                </button>
                <button
                  onClick={generatePDF}
                  className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition-colors"
                  disabled={isPrinting}
                >
                  {isPrinting
                    ? translations[lang as keyof typeof translations]["Generating PDF..."]
                    : translations[lang as keyof typeof translations]["Generate PDF"]}
                </button>
                {selectedQuote.status === "pending" && !isQuoteExpired(selectedQuote.validUntil) && (
                  <button
                    onClick={() => handleAcceptQuote(selectedQuote.quoteId)}
                    className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition-colors"
                  >
                    {translations[lang as keyof typeof translations]["Accept Quote"]}
                  </button>
                )}
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

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-content,
          .print-content * {
            visibility: visible;
          }
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .action-buttons,
          .print\\:hidden {
            display: none !important;
          }
          .fixed {
            position: static !important;
          }
          .bg-black {
            background: white !important;
          }
          .max-h-\\[90vh\\] {
            max-height: none !important;
          }
          .overflow-y-auto {
            overflow: visible !important;
          }
        }
      `}</style>
    </>
  )
}
