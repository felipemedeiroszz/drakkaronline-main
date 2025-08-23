"use client"

// Force dynamic rendering and disable caching
export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { ConfirmationModal } from "@/components/confirmation-modal"
import { Notification, useNotification } from "@/components/notification"
import { MultiSelectDropdown } from "@/components/multi-select-dropdown"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"
import type { MarketingManual, MarketingWarranty } from "@/lib/database-service"
import { useAdminDataSync } from "@/hooks/use-admin-data-sync"
import { useAdminRealtimeSync } from "@/hooks/use-realtime-sync"
import { useAdminContinuousSync } from "@/hooks/use-admin-continuous-sync"

interface DataItem {
  name: string
  name_pt?: string
  usd?: number
  brl?: number
  email?: string
  password?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  id?: string | number // Allow string for UUIDs and number for auto-increment IDs
  country?: string
  countries?: string[] // For multiple countries selection
  compatible_models?: string[]
  category?: string
  display_order?: number // Add this new field
}

interface Order {
  id?: number
  order_id: string
  dealer_id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  customer_address: string
  customer_city: string
  customer_state: string
  customer_zip: string
  customer_country: string
  boat_model: string
  engine_package: string
  hull_color: string
  upholstery_package?: string
  additional_options: string[]
  payment_method: string
  deposit_amount: number
  total_usd: number
  total_brl: number
  notes: string
  status: string
  created_at: string
}

interface ServiceRequestIssue {
  text: string
  imageUrl?: string
}

interface ServiceRequest {
  id?: number
  request_id: string
  dealer_id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  customer_address: string
  boat_model: string
  hull_id: string
  purchase_date: string
  engine_hours: string
  request_type: string
  issues: ServiceRequestIssue[]
  status: string
  created_at: string
}

interface ServiceMessage {
  id: number
  service_request_id: string
  sender_type: "admin" | "dealer"
  sender_name: string
  message: string
  created_at: string
  read_at?: string
}

interface MarketingContent {
  id?: number
  title_en: string
  title_pt: string
  subtitle_en: string
  subtitle_pt: string
  image_url: string
  boat_model?: string
  created_at?: string
  updated_at?: string
}

interface FactoryProduction {
  id?: string
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
  display_order?: number
  created_at?: string
}

export default function AdministratorPage() {
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [showAddEmail, setShowAddEmail] = useState(false)
  const [notificationEmail, setNotificationEmail] = useState("")
  const [currentNotificationEmail, setCurrentNotificationEmail] = useState("")

  const [password, setPassword] = useState("")
  const [activeTab, setActiveTab] = useState("engines")
  const [lang, setLang] = useState("en")

  const { notification, showNotification, hideNotification } = useNotification()
  const { notifyDataUpdate } = useAdminDataSync()
  
  // ✅ NOVO: Hook para sincronização contínua com Dealer
  const { notifyUpdate } = useAdminContinuousSync({
    onUpdate: () => {
      // Admin não precisa reagir a seus próprios eventos
      console.log("🔄 Admin: Evento de sincronização detectado (ignorado)")
    },
    enableHeartbeat: false // Admin não precisa de heartbeat
  })

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{ type: string; id: string | number; index: number } | null>(null)

  // New state for problems modal
  const [showProblemsModal, setShowProblemsModal] = useState(false)
  const [selectedProblems, setSelectedProblems] = useState<ServiceRequestIssue[]>([])

  // New state for messaging
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [selectedServiceRequest, setSelectedServiceRequest] = useState<ServiceRequest | null>(null)
  const [messages, setMessages] = useState<ServiceMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isSendingMessage, setIsSendingMessage] = useState(false)

  // State for email sending
  const [isSendingEmail, setIsSendingEmail] = useState(false)

  // State for image upload
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  const [enginePackages, setEnginePackages] = useState<DataItem[]>([])
  const [hullColors, setHullColors] = useState<DataItem[]>([])
  const [upholsteryPackages, setUpholsteryPackages] = useState<DataItem[]>([])
  const [additionalOptions, setAdditionalOptions] = useState<DataItem[]>([])
  const [boatModels, setBoatModels] = useState<DataItem[]>([])
  const [dealers, setDealers] = useState<DataItem[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([])
  const [marketingContent, setMarketingContent] = useState<MarketingContent[]>([])
  const [marketingManuals, setMarketingManuals] = useState<MarketingManual[]>([])
  const [marketingWarranties, setMarketingWarranties] = useState<MarketingWarranty[]>([])
  const [factoryProduction, setFactoryProduction] = useState<FactoryProduction[]>([])

  const [orderToPrint, setOrderToPrint] = useState<Order | null>(null)
  const [serviceRequestToPrint, setServiceRequestToPrint] = useState<ServiceRequest | null>(null)

  // State to track if we're loading/saving
  const [isLoading, setIsLoading] = useState(false)
  const [isSavingOrder, setIsSavingOrder] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const statusOptions = [
    { value: "pending", label: "Pendente" },
    { value: "production", label: "Em produção" },
    { value: "finishing", label: "Acabamento" },
    { value: "assembly", label: "Montagem" },
    { value: "final_inspection", label: "Inspeção final" },
    { value: "shipped", label: "Enviado" },
    { value: "delivered", label: "Entregue" },
    { value: "sold", label: "Vendido" },
    { value: "canceled", label: "Cancelado" },
  ]

  const categoryOptions = [
    { value: "deck_equipment_comfort", label: "Deck Equipment & Comfort" },
    { value: "electronics_navigation_sound", label: "Electronics, Navigation and Sound System" },
    { value: "transport_logistics", label: "Transport & Logistics" },
  ]

  // Country options for engine packages
  const countryOptions = [
    { value: "All", label: "All Countries" },
    { value: "Brazil", label: "Brazil" },
    { value: "USA", label: "USA" },
    { value: "Spain", label: "Spain" },
    { value: "Australia", label: "Australia" },
  ]

  const factoryStatusOptions = [
    { value: "planning", label: "Planejamento" },
    { value: "hull_construction", label: "Construção do Casco" },
    { value: "engine_installation", label: "Instalação do Motor" },
    { value: "interior_work", label: "Trabalho Interior" },
    { value: "final_assembly", label: "Montagem Final" },
    { value: "quality_control", label: "Controle de Qualidade" },
    { value: "ready_for_delivery", label: "Pronto para Entrega" },
    { value: "completed", label: "Concluído" },
  ]

  const getStatusLabel = (value: string) => statusOptions.find((o) => o.value === value)?.label || value

  const getCategoryLabel = (value: string) => categoryOptions.find((o) => o.value === value)?.label || value

  const handleStatusChange = (orderId: string, newValue: string) => {
    setOrders((prev) => prev.map((o) => (o.order_id === orderId ? { ...o, status: newValue } : o)))
  }

  const translations = {
    pt: {
      Login: "Login",
      Password: "Senha",
      Enter: "Entrar",
      "Invalid password": "Senha inválida",
      "Engine Packages": "Pacotes de Motor",
      "Hull Colors": "Cores de Casco",
      "Upholstery Packages": "Pacotes de Estofamento",
      "Additional Options": "Opcionais Adicionais",
      Dealers: "Concessionárias",
      "Boat Models": "Modelos de Barco",
      "Track Orders": "Acompanhar Pedidos",
      "Sold Boats": "Barcos Vendidos",
      "Canceled Boats": "Barcos Cancelados",
      "No sold boats found": "Nenhum barco vendido encontrado",
      "No canceled boats found": "Nenhum barco cancelado encontrado",
      "After Sales": "Pós-Venda",
      "Save All": "Salvar Tudo",
      "Add Row": "Adicionar Linha",
      "Name (EN)": "Nome (EN)",
      "Name (PT)": "Nome (PT)",
      "Order ID": "ID do Pedido",
      Dealer: "Concessionária",
      Customer: "Cliente",
      Model: "Modelo",
      Date: "Data",
      Status: "Status",
      Email: "Email",
      Country: "País",
      "Order Details": "Detalhes do Pedido",
      Phone: "Telefone",
      Address: "Endereço",
      City: "Cidade",
      State: "Estado",
      "ZIP Code": "CEP",
      "Boat Information": "Informações do Barco",
      "Boat Model": "Modelo do Barco",
      "Boat Name": "Nome do Barco",
      Engine: "Motor",
      "Hull Color": "Cor do Casco",
      "Upholstery Package": "Pacote de Estofamento",
      Color: "Cor",
      "Selected Options": "Opcionais Selecionados",
      "Additional Options": "Opcionais Adicionais",
      "No options selected": "Nenhum opcional selecionado",
      "Payment Information": "Informações de Pagamento",
      "Payment Method": "Método de Pagamento",
      "Deposit Amount": "Valor do Depósito",
      "Cost Price": "Preço de Custo",
      "Sale Price": "Preço de Venda",
      Total: "Total",
      "Additional Notes": "Observações Adicionais",
      Notes: "Observações",
      "Service Request Details": "Detalhes da Solicitação de Serviço",
      ID: "ID",
      "Hull ID": "ID do Casco",
      "Purchase Date": "Data da Compra",
      "Engine Hours": "Horas do Motor",
      "Request Type": "Tipo de Solicitação",
      Issues: "Problemas",
      Actions: "Ações",
      "Download PDF": "Baixar PDF",
      "Send Message": "Enviar Mensagem",
      "Message Dealer": "Mensagem para Dealer",
      "Type your message...": "Digite sua mensagem...",
      Send: "Enviar",
      Cancel: "Cancelar",
      Messages: "Mensagens",
      "No messages yet": "Nenhuma mensagem ainda",
      Administrator: "Administrador",
      "Send Email": "Enviar Email",
      Delete: "Excluir",
      Category: "Categoria",
      "Electronics, Navigation and Sound System": "Eletrônicos, Navegação e Sistema de Som",
      "Not specified": "Não especificado",
      "Refresh Data": "Atualizar Dados",
    },
    en: {
      Login: "Login",
      Password: "Password",
      Enter: "Enter",
      "Invalid password": "Invalid password",
      "Engine Packages": "Engine Packages",
      "Hull Colors": "Hull Colors",
      "Upholstery Packages": "Upholstery Packages",
      "Additional Options": "Additional Options",
      Dealers: "Dealers",
      "Boat Models": "Boat Models",
      "Track Orders": "Track Orders",
      "Sold Boats": "Sold Boats",
      "Canceled Boats": "Canceled Boats",
      "No sold boats found": "No sold boats found",
      "No canceled boats found": "No canceled boats found",
      "After Sales": "After Sales",
      "Save All": "Save All",
      "Add Row": "Add Row",
      "Name (EN)": "Name (EN)",
      "Name (PT)": "Name (PT)",
      "Order ID": "Order ID",
      Dealer: "Dealer",
      Customer: "Customer",
      Model: "Model",
      Date: "Date",
      Status: "Status",
      Email: "Email",
      Country: "Country",
      "Order Details": "Order Details",
      Phone: "Phone",
      Address: "Address",
      City: "City",
      State: "State",
      "ZIP Code": "ZIP Code",
      "Boat Information": "Boat Information",
      "Boat Model": "Boat Model",
      "Boat Name": "Boat Name",
      Engine: "Engine",
      "Hull Color": "Hull Color",
      "Upholstery Package": "Upholstery Package",
      Color: "Color",
      "Selected Options": "Selected Options",
      "Additional Options": "Additional Options",
      "No options selected": "No options selected",
      "Payment Information": "Payment Information",
      "Payment Method": "Payment Method",
      "Deposit Amount": "Deposit Amount",
      "Cost Price": "Cost Price",
      "Sale Price": "Sale Price",
      Total: "Total",
      "Additional Notes": "Additional Notes",
      Notes: "Notes",
      "Service Request Details": "Service Request Details",
      ID: "ID",
      "Hull ID": "Hull ID",
      "Purchase Date": "Purchase Date",
      "Engine Hours": "Engine Hours",
      "Request Type": "Request Type",
      Issues: "Issues",
      Actions: "Actions",
      "Download PDF": "Download PDF",
      "Send Message": "Send Message",
      "Message Dealer": "Message Dealer",
      "Type your message...": "Type your message...",
      Send: "Send",
      Cancel: "Cancel",
      Messages: "Messages",
      "No messages yet": "No messages yet",
      Administrator: "Administrator",
      "Send Email": "Send Email",
      Delete: "Delete",
      Category: "Category",
      "Electronics, Navigation and Sound System": "Electronics, Navigation and Sound System",
      "Not specified": "Not specified",
      "Refresh Data": "Refresh Data",
    },
    es: {
      Login: "Acceder",
      Password: "Contraseña",
      Enter: "Entrar",
      "Invalid password": "Contraseña inválida",
      "Engine Packages": "Paquetes de Motor",
      "Hull Colors": "Colores de Casco",
      "Upholstery Packages": "Paquetes de Tapicería",
      "Additional Options": "Opciones Adicionales",
      Dealers: "Concesionarios",
      "Boat Models": "Modelos de Barcos",
      "Track Orders": "Rastrear Pedidos",
      "Sold Boats": "Barcos Vendidos",
      "Canceled Boats": "Barcos Cancelados",
      "No sold boats found": "No se encontraron barcos vendidos",
      "No canceled boats found": "No se encontraron barcos cancelados",
      "After Sales": "Postventa",
      "Save All": "Guardar Todo",
      "Add Row": "Agregar Fila",
      "Name (EN)": "Nombre (EN)",
      "Name (PT)": "Nombre (PT)",
      "Order ID": "ID de Pedido",
      Dealer: "Concesionario",
      Customer: "Cliente",
      Model: "Modelo",
      Date: "Fecha",
      Status: "Estado",
      Email: "Email",
      Country: "País",
      "Order Details": "Detalles del Pedido",
      Phone: "Teléfono",
      Address: "Dirección",
      City: "Ciudad",
      State: "Estado",
      "ZIP Code": "Código Postal",
      "Boat Information": "Información del Barco",
      "Boat Model": "Modelo de Barco",
      "Boat Name": "Nombre del Barco",
      Engine: "Motor",
      "Hull Color": "Color del Casco",
      "Upholstery Package": "Paquete de Tapicería",
      Color: "Color",
      "Selected Options": "Opciones Seleccionadas",
      "Additional Options": "Opciones Adicionales",
      "No options selected": "No hay opciones seleccionadas",
      "Payment Information": "Información de Pago",
      "Payment Method": "Método de Pago",
      "Deposit Amount": "Monto del Depósito",
      "Cost Price": "Precio de Costo",
      "Sale Price": "Precio de Venta",
      Total: "Total",
      "Additional Notes": "Notas Adicionales",
      Notes: "Notas",
      "Service Request Details": "Detalles de la Solicitud de Servicio",
      ID: "ID",
      "Hull ID": "ID de Casco",
      "Purchase Date": "Fecha de Compra",
      "Engine Hours": "Horas del Motor",
      "Request Type": "Tipo de Solicitud",
      Issues: "Problemas",
      Actions: "Acciones",
      "Download PDF": "Descargar PDF",
      "Send Message": "Enviar Mensaje",
      "Message Dealer": "Mensaje al Concesionario",
      "Type your message...": "Escriba su mensaje...",
      Send: "Send",
      Cancel: "Cancelar",
      Messages: "Mensajes",
      "No messages yet": "No hay mensajes aún",
      Administrator: "Administrador",
      "Send Email": "Enviar Email",
      Delete: "Eliminar",
      Category: "Categoría",
      "Electronics, Navigation and Sistema de Sonido": "Electrónica, Navegação y Sistema de Sonido",
      "Not specified": "No especificado",
      "Refresh Data": "Actualizar Datos",
    },
  }

  const t = (key: keyof (typeof translations)["en"]) => {
    return translations[lang as keyof typeof translations][key] || key
  }

  const formatCurrency = (value: number | undefined, currency: "BRL" | "USD") => {
    if (value === undefined) return "N/A"
    return new Intl.NumberFormat(lang === "pt" ? "pt-BR" : "en-US", {
      style: "currency",
      currency: currency,
    }).format(value)
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "production":
        return "bg-blue-100 text-blue-800"
      case "finishing":
        return "bg-blue-100 text-blue-800"
      case "assembly":
        return "bg-blue-100 text-blue-800"
      case "final_inspection":
        return "bg-blue-100 text-blue-800"
      case "shipped":
        return "bg-green-100 text-green-800"
      case "delivered":
        return "bg-gray-100 text-gray-800"
      case "available":
        return "bg-green-100 text-green-800"
      case "sold":
        return "bg-red-100 text-red-800"
      case "canceled":
        return "bg-red-200 text-red-900"
      case "reserved":
        return "bg-yellow-100 text-yellow-800"
      case "maintenance":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const loadNotificationEmail = async () => {
    try {
      const response = await fetch("/api/notification-email")

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Failed to load notification email:", errorText)

        if (response.status === 429) {
          showNotification("❌ Muitas solicitações. Aguarde um momento.", "error")
        } else {
          showNotification("❌ Erro ao carregar email de notificação", "error")
        }
        return
      }

      const result = await response.json()

      if (result.success) {
        setCurrentNotificationEmail(result.email || "")
        setNotificationEmail(result.email || "")
      } else {
        showNotification(`❌ Erro: ${result.error}`, "error")
      }
    } catch (error) {
      console.error("Erro ao carregar email de notificação:", error)
      showNotification("❌ Erro de conexão ao carregar email", "error")
    }
  }

  const handleSaveNotificationEmail = async () => {
    if (!notificationEmail.trim()) {
      showNotification("Email é obrigatório.", "error")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(notificationEmail)) {
      showNotification("Email inválido.", "error")
      return
    }

    try {
      const response = await fetch("/api/notification-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: notificationEmail }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Failed to save notification email:", errorText)

        if (response.status === 429) {
          showNotification("❌ Muitas solicitações. Aguarde um momento.", "error")
        } else {
          showNotification("❌ Erro ao salvar email de notificação", "error")
        }
        return
      }

      const result = await response.json()

      if (result.success) {
        showNotification("✅ Email de notificação salvo com sucesso!", "success")
        setCurrentNotificationEmail(notificationEmail)
        setShowAddEmail(false)
      } else {
        showNotification(`❌ Erro: ${result.error}`, "error")
      }
    } catch (error) {
      console.error("Erro ao salvar email:", error)
      showNotification("❌ Erro ao conectar com o servidor.", "error")
    }
  }

  const handleSendEmail = async (type: "order" | "service_request", id: string) => {
    if (!currentNotificationEmail) {
      showNotification("❌ Configure um email de notificação primeiro!", "error")
      return
    }

    setIsSendingEmail(true)
    try {
      const response = await fetch("/api/send-email-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id }),
      })

      const result = await response.json()

      if (result.success) {
        showNotification("✅ Email enviado com sucesso!", "success")
      } else {
        showNotification(`❌ Erro ao enviar email: ${result.error}`, "error")
      }
    } catch (error) {
      console.error("Erro ao enviar email:", error)
      showNotification("❌ Erro ao enviar email", "error")
    } finally {
      setIsSendingEmail(false)
    }
  }

  const [isBrowser, setIsBrowser] = useState(false)

  useEffect(() => {
    setIsBrowser(true)
  }, [])

  const handleDragEnd = async (result: any, type: string) => {
    if (!result.destination || isSavingOrder) return

    const items = getItemsByType(type)
    const reorderedItems = Array.from(items)
    const [removed] = reorderedItems.splice(result.source.index, 1)
    reorderedItems.splice(result.destination.index, 0, removed)

    // Update the display_order field for each item
    const updatedItems = reorderedItems.map((item, index) => ({
      ...item,
      display_order: index + 1,
    }))

    updateItemsByType(type, updatedItems)

    // Auto-save the changes
    setIsSavingOrder(true)
    try {
      await saveDisplayOrder(type, updatedItems)
    } finally {
      setIsSavingOrder(false)
    }
  }

  const saveDisplayOrder = async (type: string, items: DataItem[]) => {
    try {
      const response = await fetch("/api/save-display-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: getTableName(type),
          items: items.map((item) => ({ id: item.id, display_order: item.display_order })),
        }),
      })

      const result = await response.json()
      if (result.success) {
        console.log("✅ Ordem atualizada no banco!")
      } else {
        console.error("❌ Erro ao salvar ordem:", result.error)
        showNotification("❌ Erro ao salvar ordem", "error")
      }
    } catch (error) {
      console.error("Erro ao salvar ordem:", error)
      showNotification("❌ Erro ao salvar ordem", "error")
    }
  }

  const getItemsByType = (type: string) => {
    switch (type) {
      case "engines":
        return enginePackages
      case "hulls":
        return hullColors
      case "upholstery":
        return upholsteryPackages
      case "options":
        return additionalOptions
      case "models":
        return boatModels
      case "dealers":
        return dealers
      default:
        return []
    }
  }

  const updateItemsByType = (type: string, items: DataItem[]) => {
    switch (type) {
      case "engines":
        setEnginePackages(items)
        break
      case "hulls":
        setHullColors(items)
        break
      case "upholstery":
        setUpholsteryPackages(items)
        break
      case "options":
        setAdditionalOptions(items)
        break
      case "models":
        setBoatModels(items)
        break
      case "dealers":
        setDealers(items)
        break
    }
  }

  const moveItemUp = async (type: string, index: number) => {
    if (index === 0 || isSavingOrder) return

    const items = getItemsByType(type)
    const newItems = [...items]
    const temp = newItems[index]
    newItems[index] = newItems[index - 1]
    newItems[index - 1] = temp

    // Update display_order
    newItems[index].display_order = index + 1
    newItems[index - 1].display_order = index

    updateItemsByType(type, newItems)

    // Auto-save the changes
    setIsSavingOrder(true)
    try {
      await saveDisplayOrder(type, newItems)
    } finally {
      setIsSavingOrder(false)
    }
  }

  const moveItemDown = async (type: string, index: number) => {
    const items = getItemsByType(type)
    if (index === items.length - 1 || isSavingOrder) return

    const newItems = [...items]
    const temp = newItems[index]
    newItems[index] = newItems[index + 1]
    newItems[index + 1] = temp

    // Update display_order
    newItems[index].display_order = index + 1
    newItems[index + 1].display_order = index + 2

    updateItemsByType(type, newItems)

    // Auto-save the changes
    setIsSavingOrder(true)
    try {
      await saveDisplayOrder(type, newItems)
    } finally {
      setIsSavingOrder(false)
    }
  }

  const handleImageUpload = async (file: File, index: number): Promise<string | null> => {
    if (!file) return null

    // Validate file type
    if (!file.type.startsWith("image/")) {
      showNotification("❌ Por favor, selecione apenas arquivos de imagem.", "error")
      return null
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showNotification("❌ A imagem deve ter no máximo 5MB.", "error")
      return null
    }

    setIsUploadingImage(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      })

      // Check if response is JSON
      const contentType = response.headers.get("content-type")

      if (!contentType || !contentType.includes("application/json")) {
        // Handle non-JSON responses (like rate limit errors)
        const textResponse = await response.text()
        console.error("Non-JSON response:", textResponse)

        if (textResponse.includes("Too Many") || textResponse.includes("rate limit")) {
          showNotification("❌ Muitas solicitações. Aguarde um momento e tente novamente.", "error")
        } else {
          showNotification(`❌ Erro no servidor: ${textResponse.slice(0, 100)}`, "error")
        }
        return null
      }

      const result = await response.json()

      if (result.success && result.url) {
        showNotification("✅ Imagem enviada com sucesso!", "success")
        return result.url
      } else {
        const errorMessage = result.error || "Erro desconhecido"

        // Handle specific error types
        if (response.status === 429) {
          showNotification("❌ Limite de upload atingido. Aguarde um momento e tente novamente.", "error")
        } else if (response.status === 507) {
          showNotification("❌ Cota de armazenamento excedida. Contate o administrador.", "error")
        } else if (errorMessage.includes("compatibility issue")) {
          showNotification("❌ Problema de compatibilidade com o arquivo. Tente converter a imagem para PNG ou JPEG e envie novamente.", "error")
        } else if (errorMessage.includes("File must be a valid image format")) {
          showNotification("❌ Formato de arquivo inválido. Use apenas JPEG, PNG, GIF ou WebP.", "error")
        } else if (errorMessage.includes("configuration error")) {
          showNotification("❌ Erro de configuração do serviço. Contate o administrador.", "error")
        } else {
          showNotification(`❌ Erro ao enviar imagem: ${errorMessage}`, "error")
        }
        return null
      }
    } catch (error: any) {
      console.error("Erro ao enviar imagem:", error)

      // Handle network errors
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        showNotification("❌ Erro de conexão. Verifique sua internet e tente novamente.", "error")
      } else {
        showNotification("❌ Erro inesperado ao enviar imagem", "error")
      }
      return null
    } finally {
      setIsUploadingImage(false)
    }
  }

  useEffect(() => {
    const savedLang = localStorage.getItem("selectedLang") || "en"
    setLang(savedLang)
    if (isLoggedIn) {
      loadDataFromDatabase()
      loadNotificationEmail()
    }
  }, [isLoggedIn])

  // Setup real-time sync
  useAdminRealtimeSync(() => {
    console.log("📡 Real-time update detected in admin panel, reloading data...")
    if (isLoggedIn) {
      loadDataFromDatabase()
    }
  })

  const handleLogin = async () => {
    try {
      const response = await fetch("/api/admin-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
      const result = await response.json()

      if (result.success) {
        setIsLoggedIn(true)
      } else {
        showNotification(t("Invalid password"), "error")
      }
    } catch (error) {
      console.error("Login error:", error)
      showNotification("Error during login.", "error")
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      showNotification("As novas senhas não coincidem.", "error")
      return
    }
    if (newPassword.length < 4) {
      showNotification("A nova senha deve ter pelo menos 4 caracteres.", "error")
      return
    }

    try {
      const response = await fetch("/api/change-admin-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      const result = await response.json()

      if (result.success) {
        showNotification("✅ Senha alterada com sucesso!", "success")
        setShowChangePassword(false)
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      } else {
        showNotification(`❌ Erro: ${result.error}`, "error")
      }
    } catch (error) {
      console.error("Change password error:", error)
      showNotification("❌ Erro ao conectar com o servidor.", "error")
    }
  }

  const addRow = (type: string) => {
    const currentItems = getItemsByType(type)
    const nextOrder = Math.max(...currentItems.map((item) => item.display_order || 0), 0) + 1

    const newItem: DataItem =
      type === "dealers"
        ? {
            name: "",
            email: "",
            password: "",
            phone: "",
            address: "",
            city: "",
            state: "",
            zip_code: "",
            country: "Brazil",
            display_order: nextOrder,
          }
        : {
            name: "",
            name_pt: "",
            usd: 0,
            brl: 0,
            compatible_models: [],
            countries: type === "engines" || type === "options" ? ["All"] : undefined,
            category: type === "options" ? "deck_equipment_comfort" : undefined,
            display_order: nextOrder,
          }

    switch (type) {
      case "engines":
        setEnginePackages([...enginePackages, newItem])
        break
      case "hulls":
        setHullColors([...hullColors, newItem])
        break
      case "upholstery":
        setUpholsteryPackages([...upholsteryPackages, newItem])
        break
      case "options":
        setAdditionalOptions([...additionalOptions, newItem])
        break
      case "models":
        setBoatModels([...boatModels, newItem])
        // 🔄 ADICIONADO: Notificar imediatamente sobre nova linha de modelo de barco
        console.log("🚢 Admin: Nova linha de modelo de barco adicionada, notificando páginas dealer")
        setTimeout(() => {
          try {
            const boatModelsEvent = new CustomEvent('boatModelsUpdate', {
              detail: { 
                timestamp: Date.now(),
                action: 'add_row'
              }
            })
            window.dispatchEvent(boatModelsEvent)
            console.log("✅ Evento boatModelsUpdate disparado para nova linha de modelo")
          } catch (error) {
            console.error("❌ Erro ao disparar evento boatModelsUpdate:", error)
          }
        }, 100)
        break
      case "dealers":
        setDealers([...dealers, newItem])
        break
    }
  }

  const removeRow = (type: string, index: number) => {
    switch (type) {
      case "engines":
        const newEngines = enginePackages.filter((_, i) => i !== index)
        setEnginePackages(newEngines.map((item, i) => ({ ...item, display_order: i + 1 })))
        break
      case "hulls":
        const newHulls = hullColors.filter((_, i) => i !== index)
        setHullColors(newHulls.map((item, i) => ({ ...item, display_order: i + 1 })))
        break
      case "upholstery":
        const newUpholstery = upholsteryPackages.filter((_, i) => i !== index)
        setUpholsteryPackages(newUpholstery.map((item, i) => ({ ...item, display_order: i + 1 })))
        break
      case "options":
        const newOptions = additionalOptions.filter((_, i) => i !== index)
        setAdditionalOptions(newOptions.map((item, i) => ({ ...item, display_order: i + 1 })))
        break
      case "models":
        const newModels = boatModels.filter((_, i) => i !== index)
        setBoatModels(newModels.map((item, i) => ({ ...item, display_order: i + 1 })))
        break
      case "dealers":
        const newDealers = dealers.filter((_, i) => i !== index)
        setDealers(newDealers.map((item, i) => ({ ...item, display_order: i + 1 })))
        break
      case "orders":
        setOrders(orders.filter((_, i) => i !== index))
        break
      case "service_requests":
        setServiceRequests(serviceRequests.filter((_, i) => i !== index))
        break
    }
  }

  const updateItem = (type: string, index: number, field: string, value: string | number | string[]) => {
    const updateArray = (arr: DataItem[]) => {
      const newArr = [...arr]
      newArr[index] = { ...newArr[index], [field]: value }
      return newArr
    }

    switch (type) {
      case "engines":
        setEnginePackages(updateArray(enginePackages))
        // 🔄 ADICIONADO: Notificar imediatamente sobre mudanças em engine packages
        console.log("🔧 Admin: Engine package atualizado, notificando páginas dealer")
        setTimeout(() => {
          try {
            const engineEvent = new CustomEvent('optionsDataUpdate', {
              detail: { 
                timestamp: Date.now(),
                dataType: 'enginePackages',
                action: 'update'
              }
            })
            window.dispatchEvent(engineEvent)
            console.log("✅ Evento optionsDataUpdate disparado para engine packages")
          } catch (error) {
            console.error("❌ Erro ao disparar evento optionsDataUpdate para engines:", error)
          }
        }, 100)
        break
      case "hulls":
        setHullColors(updateArray(hullColors))
        // 🔄 ADICIONADO: Notificar imediatamente sobre mudanças em hull colors
        console.log("🎨 Admin: Hull color atualizado, notificando páginas dealer")
        setTimeout(() => {
          try {
            const hullEvent = new CustomEvent('optionsDataUpdate', {
              detail: { 
                timestamp: Date.now(),
                dataType: 'hullColors',
                action: 'update'
              }
            })
            window.dispatchEvent(hullEvent)
            console.log("✅ Evento optionsDataUpdate disparado para hull colors")
          } catch (error) {
            console.error("❌ Erro ao disparar evento optionsDataUpdate para hulls:", error)
          }
        }, 100)
        break
      case "upholstery":
        setUpholsteryPackages(updateArray(upholsteryPackages))
        // 🔄 ADICIONADO: Notificar imediatamente sobre mudanças em upholstery packages
        console.log("🪑 Admin: Upholstery package atualizado, notificando páginas dealer")
        setTimeout(() => {
          try {
            const upholsteryEvent = new CustomEvent('optionsDataUpdate', {
              detail: { 
                timestamp: Date.now(),
                dataType: 'upholsteryPackages',
                action: 'update'
              }
            })
            window.dispatchEvent(upholsteryEvent)
            console.log("✅ Evento optionsDataUpdate disparado para upholstery packages")
          } catch (error) {
            console.error("❌ Erro ao disparar evento optionsDataUpdate para upholstery:", error)
          }
        }, 100)
        break
      case "options":
        setAdditionalOptions(updateArray(additionalOptions))
        // 🔄 ADICIONADO: Notificar imediatamente sobre mudanças em additional options
        console.log("⚙️ Admin: Additional option atualizado, notificando páginas dealer")
        setTimeout(() => {
          try {
            const optionsEvent = new CustomEvent('optionsDataUpdate', {
              detail: { 
                timestamp: Date.now(),
                dataType: 'additionalOptions',
                action: 'update'
              }
            })
            window.dispatchEvent(optionsEvent)
            console.log("✅ Evento optionsDataUpdate disparado para additional options")
          } catch (error) {
            console.error("❌ Erro ao disparar evento optionsDataUpdate para options:", error)
          }
        }, 100)
        break
      case "models":
        setBoatModels(updateArray(boatModels))
        // 🔄 ADICIONADO: Notificar imediatamente sobre mudanças em boat models
        console.log("🚢 Admin: Boat model atualizado, notificando páginas dealer")
        setTimeout(() => {
          try {
            const boatModelsEvent = new CustomEvent('boatModelsUpdate', {
              detail: { 
                timestamp: Date.now(),
                action: 'update'
              }
            })
            window.dispatchEvent(boatModelsEvent)
            console.log("✅ Evento boatModelsUpdate disparado para boat models")
          } catch (error) {
            console.error("❌ Erro ao disparar evento boatModelsUpdate:", error)
          }
        }, 100)
        break
      case "dealers":
        setDealers(updateArray(dealers))
        break
    }
  }

  const deleteItem = (type: string, index: number, id: string | number) => {
    setItemToDelete({ type, index, id })
    setIsConfirmModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return

    const { type, index, id } = itemToDelete

    try {
      const response = await fetch("/api/delete-admin-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: getTableName(type),
          id: id,
        }),
      })

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error)
      }

      // Update state based on type and ID for immediate UI refresh
      switch (type) {
        case "orders":
        case "sold-boats":
        case "canceled-boats":
          setOrders((prev) => prev.filter((order) => order.order_id !== id))
          break
        case "service":
          setServiceRequests((prev) => prev.filter((req) => req.request_id !== id))
          break
        default:
          // For other types (engines, hulls, options, models, dealers),
          // the index-based removal is still fine as they are not filtered/sorted dynamically in the UI
          removeRow(type, index)
          break
      }

      // Notify other pages about data changes
      console.log("🔔 Notificando outras páginas sobre exclusão de dados do tipo:", type)
      notifyDataUpdate()
      
      // Also notify dealer pages about options changes if relevant
      if (['hull-colors', 'upholstery', 'additional-options'].includes(type)) {
        console.log("🔔 Notificando páginas dealer sobre exclusão de opções do tipo:", type)
        setTimeout(() => {
          try {
            const customEvent = new CustomEvent('adminDataUpdate', {
              detail: { 
                timestamp: Date.now(),
                dataTypes: [type],
                action: 'delete'
              }
            })
            window.dispatchEvent(customEvent)
            console.log("✅ Evento adminDataUpdate disparado para exclusão em dealer")
          } catch (error) {
            console.error("❌ Erro ao disparar evento adminDataUpdate:", error)
          }
        }, 100)
      }

      // 🔄 ADICIONADO: Notificar dealer pages sobre exclusão de modelos de barco
      if (type === 'models') {
        console.log("🔔 Notificando páginas dealer sobre exclusão de modelos de barco")
        setTimeout(() => {
          try {
            const boatModelsEvent = new CustomEvent('boatModelsUpdate', {
              detail: { 
                timestamp: Date.now(),
                action: 'delete'
              }
            })
            window.dispatchEvent(boatModelsEvent)
            console.log("✅ Evento boatModelsUpdate disparado para exclusão de modelo")
          } catch (error) {
            console.error("❌ Erro ao disparar evento boatModelsUpdate:", error)
          }
        }, 100)
      }

      showNotification("✅ Item deletado com sucesso!", "success")
    } catch (error) {
      console.error("Erro ao deletar item:", error)
      showNotification("❌ Erro ao deletar item: " + String(error), "error")
    } finally {
      setIsConfirmModalOpen(false)
      setItemToDelete(null)
    }
  }

  const getTableName = (type: string) => {
    const tableMap: { [key: string]: string } = {
      engines: "engine_packages",
      hulls: "hull_colors",
      upholstery: "upholstery_packages",
      options: "additional_options",
      models: "boat_models",
      dealers: "dealers",
      orders: "orders",
      "sold-boats": "orders",
      "canceled-boats": "orders",
      service: "service_requests",
      manuals: "marketing_manuals",
      warranties: "marketing_warranties",
      factory: "factory_production",
    }
    return tableMap[type] || type
  }

  const saveAll = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/save-admin-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enginePackages,
          hullColors,
          upholsteryPackages,
          additionalOptions,
          boatModels,
          dealers,
          orders: orders.map(({ order_id, status }) => ({ order_id, status })),
          mode: "upsert",
        }),
      })

      const result = await response.json()

      if (result.success) {
        showNotification("✅ Dados salvos no banco de dados com sucesso!", "success")
        // Don't reload from database to preserve the current order
        
        // Notify other pages about data changes
        console.log("🔔 Notificando outras páginas sobre salvamento de dados administrativos")
        notifyDataUpdate()
        
        // Force complete cache invalidation and refresh
        console.log("🧹 Forçando invalidação completa de cache após salvamento")
        setTimeout(() => {
          try {
            const cacheInvalidationEvent = new CustomEvent('forceCacheInvalidation', {
              detail: { 
                timestamp: Date.now(),
                reason: 'admin_data_save'
              }
            })
            window.dispatchEvent(cacheInvalidationEvent)
            console.log("✅ Evento forceCacheInvalidation disparado")
          } catch (error) {
            console.error("❌ Erro ao disparar evento forceCacheInvalidation:", error)
          }
        }, 50)
        
        // 🔄 MELHORADO: Sistema de notificação aprimorado com fallback garantido
        const dispatchSyncEvents = () => {
          console.log("🔄 Admin: Iniciando notificação aprimorada para sincronização Sales")
          
          // Identificar quais tipos de dados foram atualizados
          const dataTypesToNotify: string[] = []
          
          if (boatModels) {
            dataTypesToNotify.push('boatModels')
            console.log("🔔 Notificando páginas dealer sobre atualização de modelos de barco")
            // Trigger boat models sync specifically
            setTimeout(() => {
              try {
                const boatModelsEvent = new CustomEvent('boatModelsUpdate', {
                  detail: { timestamp: Date.now() }
                })
                window.dispatchEvent(boatModelsEvent)
                console.log("✅ Evento boatModelsUpdate disparado para sincronização com dealer")
              } catch (error) {
                console.error("❌ Erro ao disparar evento boatModelsUpdate:", error)
              }
            }, 50)
          }

          // Notify about options data update (hull colors, engines, upholstery, additional options)
          if (enginePackages || hullColors || upholsteryPackages || additionalOptions) {
            if (enginePackages) dataTypesToNotify.push('enginePackages')
            if (hullColors) dataTypesToNotify.push('hullColors')
            if (upholsteryPackages) dataTypesToNotify.push('upholsteryPackages')
            if (additionalOptions) dataTypesToNotify.push('additionalOptions')
            console.log("🔔 Notificando páginas dealer sobre atualização de opções")
            // This will trigger the optionsSync hook that dealer pages use
            setTimeout(() => {
              try {
                const optionsEvent = new CustomEvent('optionsDataUpdate', {
                  detail: { timestamp: Date.now() }
                })
                window.dispatchEvent(optionsEvent)
                console.log("✅ Evento optionsDataUpdate disparado para sincronização com dealer")
                
                // If engine packages or additional options were updated, also trigger dealer config reload for country filtering
                if (enginePackages || additionalOptions) {
                  const dealerConfigReloadEvent = new CustomEvent('dealerConfigReload', {
                    detail: { 
                      timestamp: Date.now(),
                      reason: 'optionsCountryUpdate'
                    }
                  })
                  window.dispatchEvent(dealerConfigReloadEvent)
                  console.log("✅ Evento dealerConfigReload disparado para atualização de filtros de opções por país")
                }
                
                // If engine packages were updated, also trigger dealer pricing update
                if (enginePackages) {
                  const dealerPricingEvent = new CustomEvent('dealerPricingUpdate', {
                    detail: { 
                      timestamp: Date.now(),
                      reason: 'enginePackagesUpdate'
                    }
                  })
                  window.dispatchEvent(dealerPricingEvent)
                  console.log("✅ Evento dealerPricingUpdate disparado para atualização de preços por mudança em engine packages")
                }
              } catch (error) {
                console.error("❌ Erro ao disparar eventos de opções:", error)
              }
            }, 50)
          }

          // ✅ MELHORADO: Sistema de sincronização IMEDIATA e CONTÍNUA para Sales page
          // Executar IMEDIATAMENTE (sem timeout) para garantir que seja a primeira prioridade
          console.log("🚀 Admin: Executando sincronização IMEDIATA para garantir que Sales seja notificada")
          
          // 1. Evento geral IMEDIATO de atualização administrativa
          const adminUpdateEvent = new CustomEvent('adminDataUpdate', {
            detail: {
              timestamp: Date.now(),
              dataTypes: dataTypesToNotify,
              action: 'bulk_save',
              source: 'admin_panel',
              immediate: true
            }
          })
          window.dispatchEvent(adminUpdateEvent)
          console.log("✅ Evento adminDataUpdate IMEDIATO disparado")

          // 2. Ping IMEDIATO específico para Sales page
          const salesPingEvent = new CustomEvent('adminToSalesSync', {
            detail: {
              timestamp: Date.now(),
              message: 'Dados administrativos atualizados',
              dataTypes: dataTypesToNotify,
              immediate: true
            }
          })
          window.dispatchEvent(salesPingEvent)
          console.log("✅ Evento adminToSalesSync IMEDIATO disparado para Sales")

          // 3. Forçar atualização IMEDIATA via localStorage para sincronização entre abas
          try {
            const syncData = {
              timestamp: Date.now(),
              dataTypes: dataTypesToNotify,
              action: 'bulk_save',
              immediate: true
            }
            localStorage.setItem('adminDataLastUpdate', Date.now().toString())
            localStorage.setItem('adminLastSave', JSON.stringify(syncData))
            console.log("✅ LocalStorage atualizado IMEDIATAMENTE para sincronização entre abas")
          } catch (error) {
            console.error("❌ Erro ao atualizar localStorage:", error)
          }

          // 4. Sistema de redundância/fallback para garantir recebimento
          setTimeout(() => {
            console.log("🔄 Admin: Executando fallback secundário para garantir sincronização contínua")
            
            // Disparar eventos novamente em caso de falha do primeiro
            window.dispatchEvent(new CustomEvent('adminDataUpdate', {
              detail: {
                timestamp: Date.now(),
                dataTypes: dataTypesToNotify,
                action: 'bulk_save_fallback',
                source: 'admin_panel'
              }
            }))
            
            window.dispatchEvent(new CustomEvent('adminToSalesSync', {
              detail: {
                timestamp: Date.now(),
                message: 'Fallback - dados administrativos atualizados',
                dataTypes: dataTypesToNotify
              }
            }))
            
            console.log("✅ Eventos de fallback disparados para garantir sincronização contínua")
          }, 200) // Timeout menor para fallback rápido
        }

        // ✅ NOVO: Usar sistema de sincronização contínua
        console.log("🚀 Admin: Usando novo sistema de sincronização contínua")
        
        // Identificar tipos de dados atualizados
        const updatedDataTypes: string[] = []
        if (boatModels) updatedDataTypes.push('boatModels')
        if (enginePackages) updatedDataTypes.push('enginePackages')
        if (hullColors) updatedDataTypes.push('hullColors')
        if (upholsteryPackages) updatedDataTypes.push('upholsteryPackages')
        if (additionalOptions) updatedDataTypes.push('additionalOptions')
        
        // Notificar usando o novo sistema
        notifyUpdate(updatedDataTypes, 'bulk_save', true)
        
        // ✅ MANTIDO: Sistema legado como fallback
        dispatchSyncEvents()
      } else {
        showNotification("❌ Erro ao salvar: " + result.error, "error")
      }
    } catch (error) {
      console.error("Erro ao salvar:", error)
      showNotification("❌ Erro ao conectar com o banco", "error")
    } finally {
      setIsLoading(false)
    }

    // Save marketing content - only save items that have at least a title and image
    if (marketingContent.length > 0) {
      for (const content of marketingContent) {
        // Only save if we have at least one title and an image URL
        if ((content.title_en?.trim() || content.title_pt?.trim()) && content.image_url?.trim()) {
          try {
            const response = await fetch("/api/marketing-content", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...content,
                title_en: content.title_en?.trim() || content.title_pt?.trim() || "",
                title_pt: content.title_pt?.trim() || content.title_en?.trim() || "",
                subtitle_en: content.subtitle_en?.trim() || "",
                subtitle_pt: content.subtitle_pt?.trim() || "",
                image_url: content.image_url?.trim() || "",
                boat_model: content.boat_model || "All Models",
              }),
            })

            const result = await response.json()
            if (!result.success) {
              console.error("Error saving marketing content:", result.error)
              showNotification(`❌ Erro ao salvar conteúdo de marketing: ${result.error}`, "error")
            }
          } catch (error) {
            console.error("Error saving marketing content:", error)
            showNotification("❌ Erro ao salvar conteúdo de marketing", "error")
          }
        }
      }
    }

    // Save marketing manuals
    if (marketingManuals.length > 0) {
      for (const manual of marketingManuals) {
        if (manual.name_en && manual.name_pt && manual.url) {
          try {
            await fetch("/api/marketing-manuals", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(manual),
            })
          } catch (error) {
            console.error("Error saving marketing manual:", error)
          }
        }
      }
    }

    // Save marketing warranties
    if (marketingWarranties.length > 0) {
      for (const warranty of marketingWarranties) {
        if (warranty.name_en && warranty.name_pt && warranty.url) {
          try {
            await fetch("/api/marketing-warranties", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(warranty),
            })
          } catch (error) {
            console.error("Error saving marketing warranty:", error)
          }
        }
      }
    }

    // Save factory production
    if (factoryProduction.length > 0) {
      for (const item of factoryProduction) {
        if (item.boat_model && item.engine_package) {
          try {
            await fetch("/api/factory-production", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(item),
            })
          } catch (error) {
            console.error("Error saving factory production:", error)
          }
        }
      }
    }

    // Na função saveAll, vamos adicionar um log específico para engine packages:
    console.log(
      "🔧 Salvando engine packages com países:",
      enginePackages.map((pkg) => ({
        name: pkg.name,
        countries: pkg.countries,
      })),
    )
  }

  const handleViewProblems = (issues: ServiceRequestIssue[]) => {
    setSelectedProblems(issues)
    setShowProblemsModal(true)
  }

  const handleMessageDealer = async (request: ServiceRequest) => {
    setSelectedServiceRequest(request)
    setShowMessageModal(true)
    await loadMessages(request.request_id)
  }

  const loadMessages = async (serviceRequestId: string) => {
    setIsLoadingMessages(true)
    try {
      const response = await fetch(`/api/service-messages?serviceRequestId=${encodeURIComponent(serviceRequestId)}`)

      if (response.ok) {
        const result = (await response.json()) as { messages: ServiceMessage[] }
        setMessages(result.messages ?? [])
      } else {
        const err = await response.json()
        console.error("Error loading messages:", err.error ?? err)
        setMessages([])
      }
    } catch (error) {
      console.error("Error loading messages:", error)
      setMessages([])
    } finally {
      setIsLoadingMessages(false)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedServiceRequest) return

    setIsSendingMessage(true)
    try {
      const response = await fetch("/api/service-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceRequestId: selectedServiceRequest.request_id,
          senderType: "admin",
          senderName: "Administrator",
          message: newMessage.trim(),
        }),
      })

      if (response.ok) {
        const result = (await response.json()) as { data: ServiceMessage }
        setMessages((prev) => [...prev, result.data])
        setNewMessage("")
        showNotification("✅ Mensagem enviada com sucesso!", "success")
      } else {
        const err = await response.json()
        showNotification("❌ Erro ao enviar mensagem: " + (err.error ?? "unknown error"), "error")
      }
    } catch (error) {
      console.error("Error sending message:", error)
      showNotification("❌ Erro ao enviar mensagem", "error")
    } finally {
      setIsSendingMessage(false)
    }
  }

  // New function to refresh data from database
  const handleRefreshData = async () => {
    setIsRefreshing(true)
    try {
      await loadDataFromDatabase()
      showNotification("✅ Dados atualizados com sucesso!", "success")
    } catch (error) {
      console.error("Erro ao atualizar dados:", error)
      showNotification("❌ Erro ao atualizar dados", "error")
    } finally {
      setIsRefreshing(false)
    }
  }

  const renderTable = (data: DataItem[], type: string) => {
    const isDealer = type === "dealers"
    const isEngine = type === "engines"
    const isHull = type === "hulls"
    const isUpholstery = type === "upholstery"
    const isOption = type === "options"

    return (
      <div className="overflow-x-auto">
        {isBrowser ? (
          <DragDropContext onDragEnd={(result) => handleDragEnd(result, type)}>
            <table className="w-full border-collapse border border-gray-300 rounded-lg">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 p-3 text-left w-20">
                    Ordem
                    {isSavingOrder && <div className="text-xs text-blue-600 mt-1">Salvando...</div>}
                  </th>
                  {isDealer ? (
                    <>
                      <th className="border border-gray-300 p-3 text-left">{t("Name (EN)")}</th>
                      <th className="border border-gray-300 p-3 text-left">Email</th>
                      <th className="border border-gray-300 p-3 text-left">Password</th>
                      <th className="border border-gray-300 p-3 text-left">Phone</th>
                      <th className="border border-gray-300 p-3 text-left">Address</th>
                      <th className="border border-gray-300 p-3 text-left">City</th>
                      <th className="border border-gray-300 p-3 text-left">State</th>
                      <th className="border border-gray-300 p-3 text-left">ZIP Code</th>
                      <th className="border border-gray-300 p-3 text-left">{t("Country")}</th>
                    </>
                  ) : (
                    <>
                      <th className="border border-gray-300 p-3 text-left">{t("Name (EN)")}</th>
                      <th className="border border-gray-300 p-3 text-left">{t("Name (PT)")}</th>
                      <th className="border border-gray-300 p-3 text-left">USD</th>
                      <th className="border border-gray-300 p-3 text-left">BRL</th>
                      {isEngine && <th className="border border-gray-300 p-3 text-left w-48">Países</th>}
                      {isOption && <th className="border border-gray-300 p-3 text-left w-48">Países</th>}
                      {isOption && <th className="border border-gray-300 p-3 text-left">{t("Category")}</th>}
                      {(isEngine || isHull || isUpholstery || isOption) && (
                        <th className="border border-gray-300 p-3 text-left">Modelos Compatíveis</th>
                      )}
                    </>
                  )}
                  <th className="border border-gray-300 p-3 text-left">Actions</th>
                </tr>
              </thead>
              <Droppable droppableId={type}>
                {(provided) => (
                  <tbody {...provided.droppableProps} ref={provided.innerRef}>
                    {data.map((item, index) => (
                      <Draggable
                        key={`${item.id || index}-${type}`}
                        draggableId={`${item.id || index}-${type}`}
                        index={index}
                        isDragDisabled={isSavingOrder}
                      >
                        {(provided, snapshot) => (
                          <tr
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`hover:bg-gray-50 ${snapshot.isDragging ? "bg-blue-50 shadow-lg" : ""} ${
                              isSavingOrder ? "opacity-70" : ""
                            }`}
                          >
                            <td className="border border-gray-300 p-2">
                              <div className="flex flex-col items-center gap-1">
                                <div
                                  {...provided.dragHandleProps}
                                  className={`cursor-grab active:cursor-grabbing p-1 text-gray-500 hover:text-gray-700 ${
                                    isSavingOrder ? "cursor-not-allowed opacity-50" : ""
                                  }`}
                                >
                                  ⋮⋮
                                </div>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => moveItemUp(type, index)}
                                    disabled={index === 0 || isSavingOrder}
                                    className="text-xs bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed px-1 py-0.5 rounded"
                                    title="Mover para cima"
                                  >
                                    ↑
                                  </button>
                                  <button
                                    onClick={() => moveItemDown(type, index)}
                                    disabled={index === data.length - 1 || isSavingOrder}
                                    className="text-xs bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed px-1 py-0.5 rounded"
                                    title="Mover para baixo"
                                  >
                                    ↓
                                  </button>
                                </div>
                                <span className="text-xs text-gray-500 font-medium">
                                  #{item.display_order || index + 1}
                                </span>
                              </div>
                            </td>
                            {isDealer ? (
                              <>
                                <td className="border border-gray-300 p-2">
                                  <input
                                    type="text"
                                    value={item.name || ""}
                                    onChange={(e) => updateItem(type, index, "name", e.target.value)}
                                    className="w-full p-1 border rounded"
                                  />
                                </td>
                                <td className="border border-gray-300 p-2">
                                  <input
                                    type="email"
                                    value={item.email || ""}
                                    onChange={(e) => updateItem(type, index, "email", e.target.value)}
                                    className="w-full p-1 border rounded"
                                  />
                                </td>
                                <td className="border border-gray-300 p-2">
                                  <input
                                    type="password"
                                    value={item.password || ""}
                                    onChange={(e) => updateItem(type, index, "password", e.target.value)}
                                    className="w-full p-1 border rounded"
                                  />
                                </td>
                                <td className="border border-gray-300 p-2">
                                  <input
                                    type="tel"
                                    value={item.phone || ""}
                                    onChange={(e) => updateItem(type, index, "phone", e.target.value)}
                                    className="w-full p-1 border rounded"
                                    placeholder="Phone"
                                  />
                                </td>
                                <td className="border border-gray-300 p-2">
                                  <input
                                    type="text"
                                    value={item.address || ""}
                                    onChange={(e) => updateItem(type, index, "address", e.target.value)}
                                    className="w-full p-1 border rounded"
                                    placeholder="Address"
                                  />
                                </td>
                                <td className="border border-gray-300 p-2">
                                  <input
                                    type="text"
                                    value={item.city || ""}
                                    onChange={(e) => updateItem(type, index, "city", e.target.value)}
                                    className="w-full p-1 border rounded"
                                    placeholder="City"
                                  />
                                </td>
                                <td className="border border-gray-300 p-2">
                                  <input
                                    type="text"
                                    value={item.state || ""}
                                    onChange={(e) => updateItem(type, index, "state", e.target.value)}
                                    className="w-full p-1 border rounded"
                                    placeholder="State"
                                  />
                                </td>
                                <td className="border border-gray-300 p-2">
                                  <input
                                    type="text"
                                    value={item.zip_code || ""}
                                    onChange={(e) => updateItem(type, index, "zip_code", e.target.value)}
                                    className="w-full p-1 border rounded"
                                    placeholder="ZIP"
                                  />
                                </td>
                                <td className="border border-gray-300 p-2">
                                  <select
                                    value={item.country || ""}
                                    onChange={(e) => updateItem(type, index, "country", e.target.value)}
                                    className="w-full p-1.5 border rounded bg-white"
                                  >
                                    <option value="All">All</option>
                                    <option value="Brazil">Brazil</option>
                                    <option value="USA">USA</option>
                                    <option value="Spain">Spain</option>
                                    <option value="Australia">Australia</option>
                                  </select>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="border border-gray-300 p-2">
                                  <input
                                    type="text"
                                    value={item.name || ""}
                                    onChange={(e) => updateItem(type, index, "name", e.target.value)}
                                    className="w-full p-1 border rounded"
                                  />
                                </td>
                                <td className="border border-gray-300 p-2">
                                  <input
                                    type="text"
                                    value={item.name_pt || ""}
                                    onChange={(e) => updateItem(type, index, "name_pt", e.target.value)}
                                    className="w-full p-1 border rounded"
                                  />
                                </td>
                                <td className="border border-gray-300 p-2">
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={item.usd || 0}
                                    onChange={(e) => updateItem(type, index, "usd", Number.parseFloat(e.target.value))}
                                    className="w-full p-1 border rounded"
                                  />
                                </td>
                                <td className="border border-gray-300 p-2">
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={item.brl || 0}
                                    onChange={(e) => updateItem(type, index, "brl", Number.parseFloat(e.target.value))}
                                    className="w-full p-1 border rounded"
                                  />
                                </td>
                                {isEngine && (
                                  <td className="border border-gray-300 p-2 w-48">
                                    <MultiSelectDropdown
                                      options={countryOptions}
                                      selected={item.countries || ["All"]}
                                      onChange={(selected) => updateItem(type, index, "countries", selected)}
                                      placeholder="Selecionar países..."
                                    />
                                  </td>
                                )}
                                {isOption && (
                                  <td className="border border-gray-300 p-2 w-48">
                                    <MultiSelectDropdown
                                      options={countryOptions}
                                      selected={item.countries || ["All"]}
                                      onChange={(selected) => updateItem(type, index, "countries", selected)}
                                      placeholder="Selecionar países..."
                                    />
                                  </td>
                                )}
                                {isOption && (
                                  <td className="border border-gray-300 p-2">
                                    <select
                                      value={item.category || "deck_equipment_comfort"}
                                      onChange={(e) => updateItem(type, index, "category", e.target.value)}
                                      className="w-full p-1.5 border rounded bg-white"
                                    >
                                      {categoryOptions.map(({ value, label }) => (
                                        <option key={value} value={value}>
                                          {label}
                                        </option>
                                      ))}
                                    </select>
                                  </td>
                                )}
                                {(isEngine || isHull || isUpholstery || isOption) && (
                                  <td className="border border-gray-300 p-2">
                                    <MultiSelectDropdown
                                      options={boatModels.map((model) => ({ value: model.name, label: model.name }))}
                                      selected={item.compatible_models || []}
                                      onChange={(selected) => updateItem(type, index, "compatible_models", selected)}
                                      placeholder="Selecionar modelos..."
                                    />
                                  </td>
                                )}
                              </>
                            )}
                            <td className="border border-gray-300 p-2">
                              <button
                                onClick={() => deleteItem(type, index, item.id!)}
                                className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                                title="Deletar permanentemente"
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </tbody>
                )}
              </Droppable>
            </table>
          </DragDropContext>
        ) : (
          // Fallback table without drag and drop for SSR
          <table className="w-full border-collapse border border-gray-300 rounded-lg">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 p-3 text-left w-20">Ordem</th>
                {isDealer ? (
                  <>
                    <th className="border border-gray-300 p-3 text-left">{t("Name (EN)")}</th>
                    <th className="border border-gray-300 p-3 text-left">Email</th>
                    <th className="border border-gray-300 p-3 text-left">Password</th>
                    <th className="border border-gray-300 p-3 text-left">Phone</th>
                    <th className="border border-gray-300 p-3 text-left">Address</th>
                    <th className="border border-gray-300 p-3 text-left">City</th>
                    <th className="border border-gray-300 p-3 text-left">State</th>
                    <th className="border border-gray-300 p-3 text-left">ZIP Code</th>
                    <th className="border border-gray-300 p-3 text-left">{t("Country")}</th>
                  </>
                ) : (
                  <>
                    <th className="border border-gray-300 p-3 text-left">{t("Name (EN)")}</th>
                    <th className="border border-gray-300 p-3 text-left">{t("Name (PT)")}</th>
                    <th className="border border-gray-300 p-3 text-left">USD</th>
                    <th className="border border-gray-300 p-3 text-left">BRL</th>
                    {isEngine && <th className="border border-gray-300 p-3 text-left w-48">Países</th>}
                    {isOption && <th className="border border-gray-300 p-3 text-left w-48">Países</th>}
                    {isOption && <th className="border border-gray-300 p-3 text-left">{t("Category")}</th>}
                    {(isEngine || isHull || isUpholstery || isOption) && (
                      <th className="border border-gray-300 p-3 text-left">Modelos Compatíveis</th>
                    )}
                  </>
                )}
                <th className="border border-gray-300 p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr key={item.id || index} className="hover:bg-gray-50">
                  <td className="border border-gray-300 p-2">
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex gap-1">
                        <button
                          onClick={() => moveItemUp(type, index)}
                          disabled={index === 0}
                          className="text-xs bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed px-1 py-0.5 rounded"
                          title="Mover para cima"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveItemDown(type, index)}
                          disabled={index === data.length - 1}
                          className="text-xs bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed px-1 py-0.5 rounded"
                          title="Mover para baixo"
                        >
                          ↓
                        </button>
                      </div>
                      <span className="text-xs text-gray-500 font-medium">#{item.display_order || index + 1}</span>
                    </div>
                  </td>
                  {isDealer ? (
                    <>
                      <td className="border border-gray-300 p-2">
                        <input
                          type="text"
                          value={item.name || ""}
                          onChange={(e) => updateItem(type, index, "name", e.target.value)}
                          className="w-full p-1 border rounded"
                        />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <input
                          type="email"
                          value={item.email || ""}
                          onChange={(e) => updateItem(type, index, "email", e.target.value)}
                          className="w-full p-1 border rounded"
                        />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <input
                          type="password"
                          value={item.password || ""}
                          onChange={(e) => updateItem(type, index, "password", e.target.value)}
                          className="w-full p-1 border rounded"
                        />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <input
                          type="tel"
                          value={item.phone || ""}
                          onChange={(e) => updateItem(type, index, "phone", e.target.value)}
                          className="w-full p-1 border rounded"
                          placeholder="Phone"
                        />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <input
                          type="text"
                          value={item.address || ""}
                          onChange={(e) => updateItem(type, index, "address", e.target.value)}
                          className="w-full p-1 border rounded"
                          placeholder="Address"
                        />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <input
                          type="text"
                          value={item.city || ""}
                          onChange={(e) => updateItem(type, index, "city", e.target.value)}
                          className="w-full p-1 border rounded"
                          placeholder="City"
                        />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <input
                          type="text"
                          value={item.state || ""}
                          onChange={(e) => updateItem(type, index, "state", e.target.value)}
                          className="w-full p-1 border rounded"
                          placeholder="State"
                        />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <input
                          type="text"
                          value={item.zip_code || ""}
                          onChange={(e) => updateItem(type, index, "zip_code", e.target.value)}
                          className="w-full p-1 border rounded"
                          placeholder="ZIP"
                        />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <select
                          value={item.country || ""}
                          onChange={(e) => updateItem(type, index, "country", e.target.value)}
                          className="w-full p-1.5 border rounded bg-white"
                        >
                          <option value="All">All</option>
                          <option value="Brazil">Brazil</option>
                          <option value="USA">USA</option>
                          <option value="Spain">Spain</option>
                          <option value="Australia">Australia</option>
                        </select>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="border border-gray-300 p-2">
                        <input
                          type="text"
                          value={item.name || ""}
                          onChange={(e) => updateItem(type, index, "name", e.target.value)}
                          className="w-full p-1 border rounded"
                        />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <input
                          type="text"
                          value={item.name_pt || ""}
                          onChange={(e) => updateItem(type, index, "name_pt", e.target.value)}
                          className="w-full p-1 border rounded"
                        />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <input
                          type="number"
                          step="0.01"
                          value={item.usd || 0}
                          onChange={(e) => updateItem(type, index, "usd", Number.parseFloat(e.target.value))}
                          className="w-full p-1 border rounded"
                        />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <input
                          type="number"
                          step="0.01"
                          value={item.brl || 0}
                          onChange={(e) => updateItem(type, index, "brl", Number.parseFloat(e.target.value))}
                          className="w-full p-1 border rounded"
                        />
                      </td>
                      {isEngine && (
                        <td className="border border-gray-300 p-2 w-48">
                          <MultiSelectDropdown
                            options={countryOptions}
                            selected={item.countries || ["All"]}
                            onChange={(selected) => updateItem(type, index, "countries", selected)}
                            placeholder="Selecionar países..."
                          />
                        </td>
                      )}
                      {isOption && (
                        <td className="border border-gray-300 p-2 w-48">
                          <MultiSelectDropdown
                            options={countryOptions}
                            selected={item.countries || ["All"]}
                            onChange={(selected) => updateItem(type, index, "countries", selected)}
                            placeholder="Selecionar países..."
                          />
                        </td>
                      )}
                      {isOption && (
                        <td className="border border-gray-300 p-2">
                          <select
                            value={item.category || "deck_equipment_comfort"}
                            onChange={(e) => updateItem(type, index, "category", e.target.value)}
                            className="w-full p-1.5 border rounded bg-white"
                          >
                            {categoryOptions.map(({ value, label }) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </td>
                      )}
                      {(isEngine || isHull || isUpholstery || isOption) && (
                        <td className="border border-gray-300 p-2">
                          <MultiSelectDropdown
                            options={boatModels.map((model) => ({ value: model.name, label: model.name }))}
                            selected={item.compatible_models || []}
                            onChange={(selected) => updateItem(type, index, "compatible_models", selected)}
                            placeholder="Selecionar modelos..."
                          />
                        </td>
                      )}
                    </>
                  )}
                  <td className="border border-gray-300 p-2">
                    <button
                      onClick={() => deleteItem(type, index, item.id!)}
                      className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                      title="Deletar permanentemente"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <button
          onClick={() => addRow(type)}
          className="mt-3 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
        >
          {t("Add Row")}
        </button>
      </div>
    )
  }

  const loadDataFromDatabase = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/get-admin-data", {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })

      if (!response.ok) {
        const fallbackText = await response.text()
        console.error("Falha no GET /api/get-admin-data:", fallbackText)
        showNotification(
          `❌ Erro ${response.status}: ${fallbackText?.slice(0, 120) || "Falha ao carregar dados do servidor."}`,
          "error",
        )
        return
      }

      const contentType = response.headers.get("content-type") || ""
      if (!contentType.includes("application/json")) {
        const fallbackText = await response.text()
        console.error("Resposta não-JSON:", fallbackText)
        showNotification("❌ O servidor respondeu com conteúdo inesperado.", "error")
        return
      }

      const result = await response.json()

      if (result.success) {
        const { data } = result
        setEnginePackages(data.enginePackages || [])
        setHullColors(data.hullColors || [])
        setUpholsteryPackages(data.upholsteryPackages || [])
        setAdditionalOptions(data.additionalOptions || [])
        setBoatModels(data.boatModels || [])
        setDealers(data.dealers || [])
        setOrders(data.orders || [])
        setServiceRequests(data.serviceRequests || [])

        // Process marketing content to ensure no null values
        const processedMarketingContent = (data.marketingContent || []).map((item: any) => ({
          ...item,
          title_en: item.title_en || "",
          title_pt: item.title_pt || "",
          subtitle_en: item.subtitle_en || "",
          subtitle_pt: item.subtitle_pt || "",
          image_url: item.image_url || "",
          boat_model: item.boat_model || "All Models",
        }))
        setMarketingContent(processedMarketingContent)

        // Add this line in the loadDataFromDatabase function where other data is set
        setMarketingManuals(data.marketingManuals || [])

        // Add marketing warranties
        setMarketingWarranties(data.marketingWarranties || [])

        // Add this to the loadDataFromDatabase function
        setFactoryProduction(data.factoryProduction || [])

        showNotification("✅ Dados carregados do banco de dados!", "success")
      } else {
        showNotification(`❌ Erro ao carregar dados: ${result.error}`, "error")
      }
    } catch (error) {
      console.error("Erro ao carregar dados do banco:", error)
      showNotification("❌ Erro inesperado ao conectar com o servidor.", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setPassword("")
    window.location.href = "/"
  }

  const updateMarketingContent = (index: number, field: keyof MarketingContent, value: string) => {
    const newContent = [...marketingContent]
    newContent[index] = { ...newContent[index], [field]: value }
    setMarketingContent(newContent)
  }

  const addMarketingContent = () => {
    const newContent: MarketingContent = {
      title_en: "",
      title_pt: "",
      subtitle_en: "",
      subtitle_pt: "",
      image_url: "",
      boat_model: "All Models",
    }
    setMarketingContent([...marketingContent, newContent])
  }

  const deleteMarketingContent = async (index: number, id: number) => {
    if (!id) {
      // If no ID, just remove from local state
      setMarketingContent(marketingContent.filter((_, i) => i !== index))
      return
    }

    try {
      const response = await fetch(`/api/marketing-content?id=${id}`, {
        method: "DELETE",
      })

      const result = await response.json()
      if (result.success) {
        setMarketingContent(marketingContent.filter((_, i) => i !== index))
        showNotification("✅ Conteúdo deletado com sucesso!", "success")
      } else {
        showNotification("❌ Erro ao deletar conteúdo", "error")
      }
    } catch (error) {
      console.error("Error deleting marketing content:", error)
      showNotification("❌ Erro ao deletar conteúdo", "error")
    }
  }

  const updateMarketingManual = (index: number, field: keyof MarketingManual, value: string | number) => {
    const newManuals = [...marketingManuals]
    newManuals[index] = { ...newManuals[index], [field]: value }
    setMarketingManuals(newManuals)
  }

  const addMarketingManual = () => {
    const newManual: MarketingManual = {
      name_en: "",
      name_pt: "",
      url: "",
      image_url: "",
      display_order: marketingManuals.length + 1,
    }
    setMarketingManuals([...marketingManuals, newManual])
  }

  const deleteMarketingManual = async (index: number, id: number) => {
    if (!id) {
      // If no ID, just remove from local state
      setMarketingManuals(marketingManuals.filter((_, i) => i !== index))
      return
    }

    try {
      const response = await fetch(`/api/marketing-manuals?id=${id}`, {
        method: "DELETE",
      })

      const result = await response.json()
      if (result.success) {
        setMarketingManuals(marketingManuals.filter((_, i) => i !== index))
        showNotification("✅ Manual deletado com sucesso!", "success")
      } else {
        showNotification("❌ Erro ao deletar manual", "error")
      }
    } catch (error) {
      console.error("Error deleting marketing manual:", error)
      showNotification("❌ Erro ao deletar manual", "error")
    }
  }

  const updateMarketingWarranty = (index: number, field: keyof MarketingWarranty, value: string | number) => {
    const newWarranties = [...marketingWarranties]
    newWarranties[index] = { ...newWarranties[index], [field]: value }
    setMarketingWarranties(newWarranties)
  }

  const addMarketingWarranty = () => {
    const newWarranty: MarketingWarranty = {
      name_en: "",
      name_pt: "",
      url: "",
      image_url: "",
      display_order: marketingWarranties.length + 1,
    }
    setMarketingWarranties([...marketingWarranties, newWarranty])
  }

  const deleteMarketingWarranty = async (index: number, id: number) => {
    if (!id) {
      // If no ID, just remove from local state
      setMarketingWarranties(marketingWarranties.filter((_, i) => i !== index))
      return
    }

    try {
      const response = await fetch(`/api/marketing-warranties?id=${id}`, {
        method: "DELETE",
      })

      const result = await response.json()
      if (result.success) {
        setMarketingWarranties(marketingWarranties.filter((_, i) => i !== index))
        showNotification("✅ Garantia deletada com sucesso!", "success")
      } else {
        showNotification("❌ Erro ao deletar garantia", "error")
      }
    } catch (error) {
      console.error("Error deleting marketing warranty:", error)
      showNotification("❌ Erro ao deletar garantia", "error")
    }
  }

  const updateFactoryProduction = (
    index: number,
    field: keyof FactoryProduction,
    value: string | number | string[],
  ) => {
    const newProduction = [...factoryProduction]
    newProduction[index] = { ...newProduction[index], [field]: value }
    setFactoryProduction(newProduction)
  }

  const addFactoryProduction = () => {
    const newItem: FactoryProduction = {
      boat_model: "",
      engine_package: "",
      hull_color: "",
      upholstery_package: "",
      additional_options: [],
      total_value_usd: 0,
      total_value_brl: 0,
      status: "planning",
      expected_completion_date: "",
      notes: "",
      display_order: factoryProduction.length + 1,
    }
    setFactoryProduction([...factoryProduction, newItem])
  }

  const deleteFactoryProduction = async (index: number, id: string) => {
    if (!id) {
      setFactoryProduction(factoryProduction.filter((_, i) => i !== index))
      return
    }

    try {
      const response = await fetch(`/api/factory-production?id=${id}`, {
        method: "DELETE",
      })

      const result = await response.json()
      if (result.success) {
        setFactoryProduction(factoryProduction.filter((_, i) => i !== index))
        showNotification("✅ Item de produção deletado com sucesso!", "success")
      } else {
        showNotification("❌ Erro ao deletar item de produção", "error")
      }
    } catch (error) {
      console.error("Error deleting factory production:", error)
      showNotification("❌ Erro ao deletar item de produção", "error")
    }
  }

  const activeOrders = orders.filter((order) => order.status !== "sold" && order.status !== "canceled")
  const soldOrders = orders.filter((order) => order.status === "sold")
  const canceledOrders = orders.filter((order) => order.status === "canceled")

  const refreshFactoryProduction = async () => {
    try {
      const response = await fetch("/api/factory-production")
      const result = await response.json()

      if (result.success) {
        setFactoryProduction(result.data || [])
      }
    } catch (error) {
      console.error("Error refreshing factory production:", error)
    }
  }



  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <Image src="/images/logo.png" alt="Drakkar Logo" width={200} height={80} className="mx-auto mb-6" />
          <h5 className="text-xl font-semibold mb-6">{t("Login")}</h5>
          <div className="mb-4">
            <label className="block text-left mb-2 font-medium">{t("Password")}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border rounded-lg"
              onKeyPress={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>
          <button onClick={handleLogin} className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700">
            {t("Enter")}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white p-4 rounded-lg shadow mb-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Image src="/images/logo.png" alt="Drakkar Logo" width={150} height={40} />
            {(isLoading || isSavingOrder || isRefreshing) && (
              <div className="flex items-center gap-2 text-blue-600">
                <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                <span className="text-sm">
                  {isRefreshing ? "Atualizando dados..." : isSavingOrder ? "Salvando ordem..." : "Carregando..."}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleRefreshData}
              disabled={isLoading || isRefreshing}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🔄 {t("Refresh Data")}
            </button>
            <button
              onClick={() => setShowChangePassword(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
            >
              🔑 Alterar Senha
            </button>
            <button
              onClick={() => setShowAddEmail(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium flex items-center gap-2"
            >
              📧 {currentNotificationEmail ? "Editar Email" : "Adicionar Email"}
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-medium flex items-center gap-2"
            >
              🚪 Logout
            </button>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex flex-wrap gap-2 border-b">
            {[
              { key: "engines", label: t("Engine Packages") },
              { key: "hulls", label: t("Hull Colors") },
              { key: "upholstery", label: t("Upholstery Packages") },
              { key: "options", label: t("Additional Options") },
              { key: "dealers", label: t("Dealers") },
              { key: "models", label: t("Boat Models") },
              { key: "orders", label: t("Track Orders") },
              { key: "sold-boats", label: t("Sold Boats") },
              { key: "canceled-boats", label: t("Canceled Boats") },
              { key: "service", label: t("After Sales") },
              { key: "marketing", label: "Marketing Content" },
              { key: "manuals", label: "Marketing Manuals" },
              { key: "warranties", label: "Marketing Warranties" },
              { key: "factory", label: "Factory Production" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 font-medium ${
                  activeTab === tab.key
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading && (
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando dados...</p>
          </div>
        )}

        {!isLoading && (
          <div className="bg-white p-6 rounded-lg shadow">
            {activeTab === "engines" && renderTable(enginePackages, "engines")}
            {activeTab === "hulls" && renderTable(hullColors, "hulls")}
            {activeTab === "upholstery" && renderTable(upholsteryPackages, "upholstery")}
            {activeTab === "options" && renderTable(additionalOptions, "options")}
            {activeTab === "models" && renderTable(boatModels, "models")}
            {activeTab === "dealers" && renderTable(dealers, "dealers")}

            {activeTab === "orders" && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border border-gray-300 p-3 text-left">ID do Pedido</th>
                      <th className="border border-gray-300 p-3 text-left">Dealer</th>
                      <th className="border border-gray-300 p-3 text-left">Cliente</th>
                      <th className="border border-gray-300 p-3 text-left">Email</th>
                      <th className="border border-gray-300 p-3 text-left">Telefone</th>
                      <th className="border border-gray-300 p-3 text-left">Modelo</th>
                      <th className="border border-gray-300 p-3 text-left">Motor</th>
                      <th className="border border-gray-300 p-3 text-left">Cor</th>
                      <th className="border border-gray-300 p-3 text-left">Estofamento</th>
                      <th className="border border-gray-300 p-3 text-left">Total USD</th>
                      <th className="border border-gray-300 p-3 text-left">Status</th>
                      <th className="border border-gray-300 p-3 text-left">Data</th>
                      <th className="border border-gray-300 p-3 text-left">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeOrders.length === 0 ? (
                      <tr>
                        <td colSpan={13} className="border border-gray-300 p-4 text-center text-gray-500">
                          Nenhum pedido encontrado
                        </td>
                      </tr>
                    ) : (
                      activeOrders.map((order, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="border border-gray-300 p-3 font-mono text-sm">{order.order_id}</td>
                          <td className="border border-gray-300 p-3">
                            {dealers.find((d) => d.id === order.dealer_id)?.name || `ID: ${order.dealer_id}`}
                          </td>
                          <td className="border border-gray-300 p-3">{order.customer_name}</td>
                          <td className="border border-gray-300 p-3">{order.customer_email}</td>
                          <td className="border border-gray-300 p-3">{order.customer_phone}</td>
                          <td className="border border-gray-300 p-3">{order.boat_model}</td>
                          <td className="border border-gray-300 p-3 text-sm">{order.engine_package}</td>
                          <td className="border border-gray-300 p-3">{order.hull_color}</td>
                          <td className="border border-gray-300 p-3">{order.upholstery_package || "-"}</td>
                          <td className="border border-gray-300 p-3 font-semibold">
                            ${order.total_usd?.toLocaleString() || "0"}
                          </td>
                          <td className="border border-gray-300 p-2">
                            <select
                              value={order.status}
                              onChange={(e) => handleStatusChange(order.order_id, e.target.value)}
                              className="w-full p-1.5 border rounded bg-white"
                            >
                              {statusOptions.map(({ value, label }) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="border border-gray-300 p-3 text-sm">
                            {order.created_at ? new Date(order.created_at).toLocaleDateString("pt-BR") : "-"}
                          </td>
                          <td className="border border-gray-300 p-3">
                            <div className="flex gap-1">
                              <button
                                onClick={() => setOrderToPrint(order)}
                                className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 text-xs"
                              >
                                {t("Download PDF")}
                              </button>
                              <button
                                onClick={() => handleSendEmail("order", order.order_id)}
                                disabled={isSendingEmail || !currentNotificationEmail}
                                className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                                title={
                                  !currentNotificationEmail
                                    ? "Configure um email de notificação primeiro"
                                    : "Enviar por email"
                                }
                              >
                                {isSendingEmail ? "..." : "📧"}
                              </button>
                              <button
                                onClick={() => deleteItem("orders", index, order.order_id)}
                                className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 text-xs"
                                title={t("Delete")}
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "sold-boats" && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border border-gray-300 p-3 text-left">ID do Pedido</th>
                      <th className="border border-gray-300 p-3 text-left">Dealer</th>
                      <th className="border border-gray-300 p-3 text-left">Cliente</th>
                      <th className="border border-gray-300 p-3 text-left">Email</th>
                      <th className="border border-gray-300 p-3 text-left">Telefone</th>
                      <th className="border border-gray-300 p-3 text-left">Modelo</th>
                      <th className="border border-gray-300 p-3 text-left">Motor</th>
                      <th className="border border-gray-300 p-3 text-left">Cor</th>
                      <th className="border border-gray-300 p-3 text-left">Estofamento</th>
                      <th className="border border-gray-300 p-3 text-left">Total USD</th>
                      <th className="border border-gray-300 p-3 text-left">Status</th>
                      <th className="border border-gray-300 p-3 text-left">Data</th>
                      <th className="border border-gray-300 p-3 text-left">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {soldOrders.length === 0 ? (
                      <tr>
                        <td colSpan={13} className="border border-gray-300 p-4 text-center text-gray-500">
                          {t("No sold boats found")}
                        </td>
                      </tr>
                    ) : (
                      soldOrders.map((order, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="border border-gray-300 p-3 font-mono text-sm">{order.order_id}</td>
                          <td className="border border-gray-300 p-3">
                            {dealers.find((d) => d.id === order.dealer_id)?.name || `ID: ${order.dealer_id}`}
                          </td>
                          <td className="border border-gray-300 p-3">{order.customer_name}</td>
                          <td className="border border-gray-300 p-3">{order.customer_email}</td>
                          <td className="border border-gray-300 p-3">{order.customer_phone}</td>
                          <td className="border border-gray-300 p-3">{order.boat_model}</td>
                          <td className="border border-gray-300 p-3 text-sm">{order.engine_package}</td>
                          <td className="border border-gray-300 p-3">{order.hull_color}</td>
                          <td className="border border-gray-300 p-3">{order.upholstery_package || "-"}</td>
                          <td className="border border-gray-300 p-3 font-semibold">
                            ${order.total_usd?.toLocaleString() || "0"}
                          </td>
                          <td className="border border-gray-300 p-2">
                            <select
                              value={order.status}
                              onChange={(e) => handleStatusChange(order.order_id, e.target.value)}
                              className="w-full p-1.5 border rounded bg-white"
                            >
                              {statusOptions.map(({ value, label }) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="border border-gray-300 p-3 text-sm">
                            {order.created_at ? new Date(order.created_at).toLocaleDateString("pt-BR") : "-"}
                          </td>
                          <td className="border border-gray-300 p-3">
                            <div className="flex gap-1">
                              <button
                                onClick={() => setOrderToPrint(order)}
                                className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 text-xs"
                              >
                                {t("Download PDF")}
                              </button>
                              <button
                                onClick={() => handleSendEmail("order", order.order_id)}
                                disabled={isSendingEmail || !currentNotificationEmail}
                                className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                                title={
                                  !currentNotificationEmail
                                    ? "Configure um email de notificação primeiro"
                                    : "Enviar por email"
                                }
                              >
                                {isSendingEmail ? "..." : "📧"}
                              </button>
                              <button
                                onClick={() => deleteItem("sold-boats", index, order.order_id)}
                                className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 text-xs"
                                title={t("Delete")}
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "canceled-boats" && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border border-gray-300 p-3 text-left">ID do Pedido</th>
                      <th className="border border-gray-300 p-3 text-left">Dealer</th>
                      <th className="border border-gray-300 p-3 text-left">Cliente</th>
                      <th className="border border-gray-300 p-3 text-left">Email</th>
                      <th className="border border-gray-300 p-3 text-left">Telefone</th>
                      <th className="border border-gray-300 p-3 text-left">Modelo</th>
                      <th className="border border-gray-300 p-3 text-left">Motor</th>
                      <th className="border border-gray-300 p-3 text-left">Cor</th>
                      <th className="border border-gray-300 p-3 text-left">Estofamento</th>
                      <th className="border border-gray-300 p-3 text-left">Total USD</th>
                      <th className="border border-gray-300 p-3 text-left">Status</th>
                      <th className="border border-gray-300 p-3 text-left">Data</th>
                      <th className="border border-gray-300 p-3 text-left">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {canceledOrders.length === 0 ? (
                      <tr>
                        <td colSpan={13} className="border border-gray-300 p-4 text-center text-gray-500">
                          {t("No canceled boats found")}
                        </td>
                      </tr>
                    ) : (
                      canceledOrders.map((order, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="border border-gray-300 p-3 font-mono text-sm">{order.order_id}</td>
                          <td className="border border-gray-300 p-3">
                            {dealers.find((d) => d.id === order.dealer_id)?.name || `ID: ${order.dealer_id}`}
                          </td>
                          <td className="border border-gray-300 p-3">{order.customer_name}</td>
                          <td className="border border-gray-300 p-3">{order.customer_email}</td>
                          <td className="border border-gray-300 p-3">{order.customer_phone}</td>
                          <td className="border border-gray-300 p-3">{order.boat_model}</td>
                          <td className="border border-gray-300 p-3 text-sm">{order.engine_package}</td>
                          <td className="border border-gray-300 p-3">{order.hull_color}</td>
                          <td className="border border-gray-300 p-3">{order.upholstery_package || "-"}</td>
                          <td className="border border-gray-300 p-3 font-semibold">
                            ${order.total_usd?.toLocaleString() || "0"}
                          </td>
                          <td className="border border-gray-300 p-2">
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(order.status)}`}
                            >
                              {getStatusLabel(order.status)}
                            </span>
                          </td>
                          <td className="border border-gray-300 p-3 text-sm">
                            {order.created_at ? new Date(order.created_at).toLocaleDateString("pt-BR") : "-"}
                          </td>
                          <td className="border border-gray-300 p-3">
                            <div className="flex gap-1">
                              <button
                                onClick={() => setOrderToPrint(order)}
                                className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 text-xs"
                              >
                                {t("Download PDF")}
                              </button>
                              <button
                                onClick={() => handleSendEmail("order", order.order_id)}
                                disabled={isSendingEmail || !currentNotificationEmail}
                                className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                                title={
                                  !currentNotificationEmail
                                    ? "Configure um email de notificação primeiro"
                                    : "Enviar por email"
                                }
                              >
                                {isSendingEmail ? "..." : "📧"}
                              </button>
                              <button
                                onClick={() => deleteItem("canceled-boats", index, order.order_id)}
                                className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 text-xs"
                                title={t("Delete")}
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "service" && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border border-gray-300 p-3 text-left">ID</th>
                      <th className="border border-gray-300 p-3 text-left">Dealer</th>
                      <th className="border border-gray-300 p-3 text-left">Cliente</th>
                      <th className="border border-gray-300 p-3 text-left">Email</th>
                      <th className="border border-gray-300 p-3 text-left">Telefone</th>
                      <th className="border border-gray-300 p-3 text-left">Modelo</th>
                      <th className="border border-gray-300 p-3 text-left">Hull ID</th>
                      <th className="border border-gray-300 p-3 text-left">Tipo</th>
                      <th className="border border-gray-300 p-3 text-left">Problemas</th>
                      <th className="border border-gray-300 p-3 text-left">Status</th>
                      <th className="border border-gray-300 p-3 text-left">Data</th>
                      <th className="border border-gray-300 p-3 text-left">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {serviceRequests.length === 0 ? (
                      <tr>
                        <td colSpan={13} className="border border-gray-300 p-4 text-center text-gray-500">
                          Nenhuma solicitação de serviço encontrada
                        </td>
                      </tr>
                    ) : (
                      serviceRequests.map((request, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="border border-gray-300 p-3 font-mono text-sm">{request.request_id}</td>
                          <td className="border border-gray-300 p-3">
                            {dealers.find((d) => d.id === request.dealer_id)?.name || `ID: ${request.dealer_id}`}
                          </td>
                          <td className="border border-gray-300 p-3">{request.customer_name}</td>
                          <td className="border border-gray-300 p-3">{request.customer_email}</td>
                          <td className="border border-gray-300 p-3">{request.customer_phone}</td>
                          <td className="border border-gray-300 p-3">{request.boat_model}</td>
                          <td className="border border-gray-300 p-3 font-mono text-sm">{request.hull_id}</td>
                          <td className="border border-gray-300 p-3">{request.request_type}</td>
                          <td className="border border-gray-300 p-3">
                            <button
                              onClick={() => handleViewProblems(request.issues)}
                              className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
                            >
                              👁️ Visualizar
                            </button>
                          </td>
                          <td className="border border-gray-300 p-3">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                              {request.status}
                            </span>
                          </td>
                          <td className="border border-gray-300 p-3 text-sm">
                            {request.created_at ? new Date(request.created_at).toLocaleDateString("pt-BR") : "-"}
                          </td>
                          <td className="border border-gray-300 p-3">
                            <div className="flex gap-1">
                              <button
                                onClick={() => setServiceRequestToPrint(request)}
                                className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 text-xs"
                              >
                                {t("Download PDF")}
                              </button>
                              <button
                                onClick={() => handleMessageDealer(request)}
                                className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 text-xs"
                              >
                                💬 {t("Send Message")}
                              </button>
                              <button
                                onClick={() => handleSendEmail("service_request", request.request_id)}
                                disabled={isSendingEmail || !currentNotificationEmail}
                                className="bg-orange-600 text-white px-2 py-1 rounded hover:bg-orange-700 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                                title={
                                  !currentNotificationEmail
                                    ? "Configure um email de notificação primeiro"
                                    : "Enviar por email"
                                }
                              >
                                {isSendingEmail ? "..." : "📧"}
                              </button>
                              <button
                                onClick={() => deleteItem("service", index, request.request_id)}
                                className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 text-xs"
                                title={t("Delete")}
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "marketing" && (
              <div className="space-y-6">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-gray-300 p-3 text-left">ID</th>
                        <th className="border border-gray-300 p-3 text-left">Título (EN)</th>
                        <th className="border border-gray-300 p-3 text-left">Título (PT)</th>
                        <th className="border border-gray-300 p-3 text-left">Subtítulo (EN)</th>
                        <th className="border border-gray-300 p-3 text-left">Subtítulo (PT)</th>
                        <th className="border border-gray-300 p-3 text-left">Modelo do Barco</th>
                        <th className="border border-gray-300 p-3 text-left">Imagem</th>
                        <th className="border border-gray-300 p-3 text-left">Data</th>
                        <th className="border border-gray-300 p-3 text-left">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {marketingContent.map((item, index) => (
                        <tr key={item.id || index} className="hover:bg-gray-50">
                          <td className="border border-gray-300 p-3">{item.id}</td>
                          <td className="border border-gray-300 p-3">
                            <input
                              type="text"
                              value={item.title_en || ""}
                              onChange={(e) => updateMarketingContent(index, "title_en", e.target.value)}
                              className="w-full p-2 border rounded"
                              placeholder="English title"
                            />
                          </td>
                          <td className="border border-gray-300 p-3">
                            <input
                              type="text"
                              value={item.title_pt || ""}
                              onChange={(e) => updateMarketingContent(index, "title_pt", e.target.value)}
                              className="w-full p-2 border rounded"
                              placeholder="Título em português"
                            />
                          </td>
                          <td className="border border-gray-300 p-3">
                            <textarea
                              value={item.subtitle_en || ""}
                              onChange={(e) => updateMarketingContent(index, "subtitle_en", e.target.value)}
                              className="w-full p-2 border rounded resize-none"
                              rows={2}
                              placeholder="English subtitle"
                            />
                          </td>
                          <td className="border border-gray-300 p-3">
                            <textarea
                              value={item.subtitle_pt || ""}
                              onChange={(e) => updateMarketingContent(index, "subtitle_pt", e.target.value)}
                              className="w-full p-2 border rounded resize-none"
                              rows={2}
                              placeholder="Subtítulo em português"
                            />
                          </td>
                          <td className="border border-gray-300 p-3">
                            <select
                              value={item.boat_model || "All Models"}
                              onChange={(e) => updateMarketingContent(index, "boat_model", e.target.value)}
                              className="w-full p-2 border rounded bg-white"
                            >
                              <option value="All Models">Todos os Modelos</option>
                              {boatModels.map((model) => (
                                <option key={model.name} value={model.name}>
                                  {model.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="border border-gray-300 p-3">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <input
                                  type="url"
                                  value={item.image_url || ""}
                                  onChange={(e) => updateMarketingContent(index, "image_url", e.target.value)}
                                  className="flex-1 p-2 border rounded text-sm"
                                  placeholder="URL da imagem ou faça upload"
                                />
                                {item.image_url && (
                                  <div className="relative">
                                    <Image
                                      src={item.image_url || "/placeholder.svg"}
                                      alt="Preview"
                                      width={40}
                                      height={40}
                                      className="rounded border object-cover"
                                      onError={(e) => {
                                        console.error("Error loading image:", item.image_url)
                                        const target = e.target as HTMLImageElement
                                        target.src = "/placeholder.svg?height=40&width=40&text=Error"
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file) {
                                      handleImageUpload(file, index).then((url) => {
                                        if (url) {
                                          updateMarketingContent(index, "image_url", url)
                                        }
                                      })
                                    }
                                  }}
                                  className="hidden"
                                  id={`image-upload-${index}`}
                                  disabled={isUploadingImage}
                                />
                                <label
                                  htmlFor={`image-upload-${index}`}
                                  className={`flex-1 bg-blue-500 text-white px-3 py-2 rounded text-sm cursor-pointer hover:bg-blue-600 text-center transition-colors ${
                                    isUploadingImage ? "opacity-50 cursor-not-allowed bg-gray-400" : ""
                                  }`}
                                >
                                  {isUploadingImage ? "Enviando..." : "📁 Escolher Imagem"}
                                </label>
                              </div>
                              {item.image_url && (
                                <div className="text-xs text-gray-500 break-all">
                                  {item.image_url.length > 50
                                    ? `${item.image_url.substring(0, 50)}...`
                                    : item.image_url}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="border border-gray-300 p-3 text-sm">
                            {item.created_at ? new Date(item.created_at).toLocaleDateString("pt-BR") : "-"}
                          </td>
                          <td className="border border-gray-300 p-3">
                            <button
                              onClick={() => deleteMarketingContent(index, item.id!)}
                              className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 text-xs"
                              title="Deletar"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button
                    onClick={addMarketingContent}
                    className="mt-3 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                  >
                    Adicionar Conteúdo
                  </button>
                </div>
              </div>
            )}

            {activeTab === "manuals" && (
              <div className="space-y-6">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-gray-300 p-3 text-left">Ordem</th>
                        <th className="border border-gray-300 p-3 text-left">ID</th>
                        <th className="border border-gray-300 p-3 text-left">Nome (EN)</th>
                        <th className="border border-gray-300 p-3 text-left">Nome (PT)</th>
                        <th className="border border-gray-300 p-3 text-left">URL</th>
                        <th className="border border-gray-300 p-3 text-left">Imagem</th>
                        <th className="border border-gray-300 p-3 text-left">Data</th>
                        <th className="border border-gray-300 p-3 text-left">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {marketingManuals.map((manual, index) => (
                        <tr key={manual.id || index} className="hover:bg-gray-50">
                          <td className="border border-gray-300 p-2">
                            <div className="flex flex-col items-center gap-1">
                              <div className="flex gap-1">
                                <button
                                  onClick={() => {
                                    if (index > 0) {
                                      const newManuals = [...marketingManuals]
                                      const temp = newManuals[index]
                                      newManuals[index] = newManuals[index - 1]
                                      newManuals[index - 1] = temp
                                      // Update display_order
                                      newManuals[index].display_order = index + 1
                                      newManuals[index - 1].display_order = index
                                      setMarketingManuals(newManuals)
                                    }
                                  }}
                                  disabled={index === 0}
                                  className="text-xs bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed px-1 py-0.5 rounded"
                                  title="Mover para cima"
                                >
                                  ↑
                                </button>
                                <button
                                  onClick={() => {
                                    if (index < marketingManuals.length - 1) {
                                      const newManuals = [...marketingManuals]
                                      const temp = newManuals[index]
                                      newManuals[index] = newManuals[index + 1]
                                      newManuals[index + 1] = temp
                                      // Update display_order
                                      newManuals[index].display_order = index + 1
                                      newManuals[index + 1].display_order = index + 2
                                      setMarketingManuals(newManuals)
                                    }
                                  }}
                                  disabled={index === marketingManuals.length - 1}
                                  className="text-xs bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed px-1 py-0.5 rounded"
                                  title="Mover para baixo"
                                >
                                  ↓
                                </button>
                              </div>
                              <span className="text-xs text-gray-500 font-medium">
                                #{manual.display_order || index + 1}
                              </span>
                            </div>
                          </td>
                          <td className="border border-gray-300 p-3">{manual.id}</td>
                          <td className="border border-gray-300 p-3">
                            <input
                              type="text"
                              value={manual.name_en || ""}
                              onChange={(e) => updateMarketingManual(index, "name_en", e.target.value)}
                              className="w-full p-2 border rounded"
                              placeholder="English name"
                            />
                          </td>
                          <td className="border border-gray-300 p-3">
                            <input
                              type="text"
                              value={manual.name_pt || ""}
                              onChange={(e) => updateMarketingManual(index, "name_pt", e.target.value)}
                              className="w-full p-2 border rounded"
                              placeholder="Nome em português"
                            />
                          </td>
                          <td className="border border-gray-300 p-3">
                            <input
                              type="url"
                              value={manual.url || ""}
                              onChange={(e) => updateMarketingManual(index, "url", e.target.value)}
                              className="w-full p-2 border rounded"
                              placeholder="https://..."
                            />
                          </td>
                          <td className="border border-gray-300 p-3">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <input
                                  type="url"
                                  value={manual.image_url || ""}
                                  onChange={(e) => updateMarketingManual(index, "image_url", e.target.value)}
                                  className="flex-1 p-2 border rounded text-sm"
                                  placeholder="URL da imagem ou faça upload"
                                />
                                {manual.image_url && (
                                  <div className="relative">
                                    <Image
                                      src={manual.image_url || "/placeholder.svg"}
                                      alt="Preview"
                                      width={40}
                                      height={40}
                                      className="rounded border object-cover"
                                      onError={(e) => {
                                        console.error("Error loading image:", manual.image_url)
                                        const target = e.target as HTMLImageElement
                                        target.src = "/placeholder.svg?height=40&width=40&text=Error"
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file) {
                                      handleImageUpload(file, index).then((url) => {
                                        if (url) {
                                          updateMarketingManual(index, "image_url", url)
                                        }
                                      })
                                    }
                                  }}
                                  className="hidden"
                                  id={`manual-image-upload-${index}`}
                                  disabled={isUploadingImage}
                                />
                                <label
                                  htmlFor={`manual-image-upload-${index}`}
                                  className={`flex-1 bg-blue-500 text-white px-3 py-2 rounded text-sm cursor-pointer hover:bg-blue-600 text-center transition-colors ${
                                    isUploadingImage ? "opacity-50 cursor-not-allowed bg-gray-400" : ""
                                  }`}
                                >
                                  {isUploadingImage ? "Enviando..." : "📁 Escolher Imagem"}
                                </label>
                              </div>
                              {manual.image_url && (
                                <div className="text-xs text-gray-500 break-all">
                                  {manual.image_url.length > 50
                                    ? `${manual.image_url.substring(0, 50)}...`
                                    : manual.image_url}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="border border-gray-300 p-3 text-sm">
                            {manual.created_at ? new Date(manual.created_at).toLocaleDateString("pt-BR") : "-"}
                          </td>
                          <td className="border border-gray-300 p-3">
                            <button
                              onClick={() => deleteMarketingManual(index, manual.id!)}
                              className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 text-xs"
                              title="Deletar"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button
                    onClick={addMarketingManual}
                    className="mt-3 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                  >
                    Adicionar Manual
                  </button>
                </div>
              </div>
            )}

            {activeTab === "warranties" && (
              <div className="space-y-6">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-gray-300 p-3 text-left">Ordem</th>
                        <th className="border border-gray-300 p-3 text-left">ID</th>
                        <th className="border border-gray-300 p-3 text-left">Nome (EN)</th>
                        <th className="border border-gray-300 p-3 text-left">Nome (PT)</th>
                        <th className="border border-gray-300 p-3 text-left">URL</th>
                        <th className="border border-gray-300 p-3 text-left">Imagem</th>
                        <th className="border border-gray-300 p-3 text-left">Data</th>
                        <th className="border border-gray-300 p-3 text-left">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {marketingWarranties.map((warranty, index) => (
                        <tr key={warranty.id || index} className="hover:bg-gray-50">
                          <td className="border border-gray-300 p-2">
                            <div className="flex flex-col items-center gap-1">
                              <div className="flex gap-1">
                                <button
                                  onClick={() => {
                                    if (index > 0) {
                                      const newWarranties = [...marketingWarranties]
                                      const temp = newWarranties[index]
                                      newWarranties[index] = newWarranties[index - 1]
                                      newWarranties[index - 1] = temp
                                      // Update display_order
                                      newWarranties[index].display_order = index + 1
                                      newWarranties[index - 1].display_order = index
                                      setMarketingWarranties(newWarranties)
                                    }
                                  }}
                                  disabled={index === 0}
                                  className="text-xs bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed px-1 py-0.5 rounded"
                                  title="Mover para cima"
                                >
                                  ↑
                                </button>
                                <button
                                  onClick={() => {
                                    if (index < marketingWarranties.length - 1) {
                                      const newWarranties = [...marketingWarranties]
                                      const temp = newWarranties[index]
                                      newWarranties[index] = newWarranties[index + 1]
                                      newWarranties[index + 1] = temp
                                      // Update display_order
                                      newWarranties[index].display_order = index + 1
                                      newWarranties[index + 1].display_order = index + 2
                                      setMarketingWarranties(newWarranties)
                                    }
                                  }}
                                  disabled={index === marketingWarranties.length - 1}
                                  className="text-xs bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed px-1 py-0.5 rounded"
                                  title="Mover para baixo"
                                >
                                  ↓
                                </button>
                              </div>
                              <span className="text-xs text-gray-500 font-medium">
                                #{warranty.display_order || index + 1}
                              </span>
                            </div>
                          </td>
                          <td className="border border-gray-300 p-3">{warranty.id}</td>
                          <td className="border border-gray-300 p-3">
                            <input
                              type="text"
                              value={warranty.name_en || ""}
                              onChange={(e) => updateMarketingWarranty(index, "name_en", e.target.value)}
                              className="w-full p-2 border rounded"
                              placeholder="English name"
                            />
                          </td>
                          <td className="border border-gray-300 p-3">
                            <input
                              type="text"
                              value={warranty.name_pt || ""}
                              onChange={(e) => updateMarketingWarranty(index, "name_pt", e.target.value)}
                              className="w-full p-2 border rounded"
                              placeholder="Nome em português"
                            />
                          </td>
                          <td className="border border-gray-300 p-3">
                            <input
                              type="url"
                              value={warranty.url || ""}
                              onChange={(e) => updateMarketingWarranty(index, "url", e.target.value)}
                              className="w-full p-2 border rounded"
                              placeholder="https://..."
                            />
                          </td>
                          <td className="border border-gray-300 p-3">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <input
                                  type="url"
                                  value={warranty.image_url || ""}
                                  onChange={(e) => updateMarketingWarranty(index, "image_url", e.target.value)}
                                  className="flex-1 p-2 border rounded text-sm"
                                  placeholder="URL da imagem ou faça upload"
                                />
                                {warranty.image_url && (
                                  <div className="relative">
                                    <Image
                                      src={warranty.image_url || "/placeholder.svg"}
                                      alt="Preview"
                                      width={40}
                                      height={40}
                                      className="rounded border object-cover"
                                      onError={(e) => {
                                        console.error("Error loading image:", warranty.image_url)
                                        const target = e.target as HTMLImageElement
                                        target.src = "/placeholder.svg?height=40&width=40&text=Error"
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file) {
                                      handleImageUpload(file, index).then((url) => {
                                        if (url) {
                                          updateMarketingWarranty(index, "image_url", url)
                                        }
                                      })
                                    }
                                  }}
                                  className="hidden"
                                  id={`warranty-image-upload-${index}`}
                                  disabled={isUploadingImage}
                                />
                                <label
                                  htmlFor={`warranty-image-upload-${index}`}
                                  className={`flex-1 bg-blue-500 text-white px-3 py-2 rounded text-sm cursor-pointer hover:bg-blue-600 text-center transition-colors ${
                                    isUploadingImage ? "opacity-50 cursor-not-allowed bg-gray-400" : ""
                                  }`}
                                >
                                  {isUploadingImage ? "Enviando..." : "📁 Escolher Imagem"}
                                </label>
                              </div>
                              {warranty.image_url && (
                                <div className="text-xs text-gray-500 break-all">
                                  {warranty.image_url.length > 50
                                    ? `${warranty.image_url.substring(0, 50)}...`
                                    : warranty.image_url}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="border border-gray-300 p-3 text-sm">
                            {warranty.created_at ? new Date(warranty.created_at).toLocaleDateString("pt-BR") : "-"}
                          </td>
                          <td className="border border-gray-300 p-3">
                            <button
                              onClick={() => deleteMarketingWarranty(index, warranty.id!)}
                              className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 text-xs"
                              title="Deletar"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button
                    onClick={addMarketingWarranty}
                    className="mt-3 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                  >
                    Adicionar Garantia
                  </button>
                </div>
              </div>
            )}

            {activeTab === "factory" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Factory Production</h3>
                  <button
                    onClick={refreshFactoryProduction}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    disabled={isLoading}
                  >
                    🔄 Atualizar
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-gray-300 p-3 text-left w-20 min-w-[80px]">Ordem</th>
                        <th className="border border-gray-300 p-3 text-left w-40 min-w-[160px]">Modelo</th>
                        <th className="border border-gray-300 p-3 text-left w-40 min-w-[160px]">Motor</th>
                        <th className="border border-gray-300 p-3 text-left w-32 min-w-[128px]">Cor</th>
                        <th className="border border-gray-300 p-3 text-left w-40 min-w-[160px]">Estofamento</th>
                        <th className="border border-gray-300 p-3 text-left w-64 min-w-[256px]">Opcionais</th>
                        <th className="border border-gray-300 p-3 text-left w-32 min-w-[128px]">Valor USD</th>
                        <th className="border border-gray-300 p-3 text-left w-32 min-w-[128px]">Valor BRL</th>
                        <th className="border border-gray-300 p-3 text-left w-36 min-w-[144px]">Status</th>
                        <th className="border border-gray-300 p-3 text-left w-36 min-w-[144px]">Data Prevista</th>
                        <th className="border border-gray-300 p-3 text-left w-64 min-w-[256px]">Observações</th>
                        <th className="border border-gray-300 p-3 text-left w-28 min-w-[112px]">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {factoryProduction.map((item, index) => (
                        <tr key={item.id || index} className="hover:bg-gray-50">
                          <td className="border border-gray-300 p-2 w-20 min-w-[80px]">
                            <span className="text-xs text-gray-500 font-medium">
                              #{item.display_order || index + 1}
                            </span>
                          </td>
                          <td className="border border-gray-300 p-2 w-40 min-w-[160px]">
                            <select
                              value={item.boat_model || ""}
                              onChange={(e) => updateFactoryProduction(index, "boat_model", e.target.value)}
                              className="w-full p-1.5 border rounded bg-white"
                            >
                              <option value="">Selecionar modelo</option>
                              {boatModels.map((model) => (
                                <option key={model.name} value={model.name}>
                                  {model.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="border border-gray-300 p-2 w-40 min-w-[160px]">
                            <select
                              value={item.engine_package || ""}
                              onChange={(e) => updateFactoryProduction(index, "engine_package", e.target.value)}
                              className="w-full p-1.5 border rounded bg-white"
                            >
                              <option value="">Selecionar motor</option>
                              {enginePackages.map((engine) => (
                                <option key={engine.name} value={engine.name}>
                                  {engine.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="border border-gray-300 p-2 w-32 min-w-[128px]">
                            <select
                              value={item.hull_color || ""}
                              onChange={(e) => updateFactoryProduction(index, "hull_color", e.target.value)}
                              className="w-full p-1.5 border rounded bg-white"
                            >
                              <option value="">Selecionar cor</option>
                              {hullColors.map((color) => (
                                <option key={color.name} value={color.name}>
                                  {color.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="border border-gray-300 p-2 w-40 min-w-[160px]">
                            <select
                              value={item.upholstery_package || ""}
                              onChange={(e) => updateFactoryProduction(index, "upholstery_package", e.target.value)}
                              className="w-full p-1.5 border rounded bg-white"
                            >
                              <option value="">Selecionar estofamento</option>
                              {upholsteryPackages.map((upholstery) => (
                                <option key={upholstery.name} value={upholstery.name}>
                                  {upholstery.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="border border-gray-300 p-2 w-64 min-w-[256px]">
                            <MultiSelectDropdown
                              options={additionalOptions.map((option) => ({ value: option.name, label: option.name }))}
                              selected={item.additional_options || []}
                              onChange={(selected) => updateFactoryProduction(index, "additional_options", selected)}
                              placeholder="Selecionar opcionais..."
                            />
                          </td>
                          <td className="border border-gray-300 p-2 w-32 min-w-[128px]">
                            <input
                              type="number"
                              step="0.01"
                              value={item.total_value_usd || 0}
                              onChange={(e) =>
                                updateFactoryProduction(index, "total_value_usd", Number.parseFloat(e.target.value))
                              }
                              className="w-full p-1 border rounded"
                            />
                          </td>
                          <td className="border border-gray-300 p-2 w-32 min-w-[128px]">
                            <input
                              type="number"
                              step="0.01"
                              value={item.total_value_brl || 0}
                              onChange={(e) =>
                                updateFactoryProduction(index, "total_value_brl", Number.parseFloat(e.target.value))
                              }
                              className="w-full p-1 border rounded"
                            />
                          </td>
                          <td className="border border-gray-300 p-2 w-36 min-w-[144px]">
                            <select
                              value={item.status || "planning"}
                              onChange={(e) => updateFactoryProduction(index, "status", e.target.value)}
                              className="w-full p-1.5 border rounded bg-white"
                            >
                              {factoryStatusOptions.map(({ value, label }) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="border border-gray-300 p-2 w-36 min-w-[144px]">
                            <input
                              type="date"
                              value={item.expected_completion_date || ""}
                              onChange={(e) =>
                                updateFactoryProduction(index, "expected_completion_date", e.target.value)
                              }
                              className="w-full p-1 border rounded"
                            />
                          </td>
                          <td className="border border-gray-300 p-2 w-64 min-w-[256px]">
                            <textarea
                              value={item.notes || ""}
                              onChange={(e) => updateFactoryProduction(index, "notes", e.target.value)}
                              className="w-full p-1 border rounded resize-none"
                              rows={2}
                              placeholder="Observações"
                            />
                          </td>
                          <td className="border border-gray-300 p-2 w-28 min-w-[112px]">
                            <button
                              onClick={() => deleteFactoryProduction(index, item.id!)}
                              className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 text-xs"
                              title="Deletar"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button
                    onClick={addFactoryProduction}
                    className="mt-3 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                  >
                    Adicionar Item de Produção
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex gap-4">
          <button
            onClick={saveAll}
            disabled={isLoading || isSavingOrder}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Salvando..." : t("Save All")}
          </button>
        </div>
      </div>

      {orderToPrint && (
        <OrderPDFGenerator
          order={orderToPrint}
          onGenerated={() => setOrderToPrint(null)}
          t={t}
          lang={lang}
          getStatusBadgeClass={getStatusBadgeClass}
          formatCurrency={formatCurrency}
        />
      )}

      {serviceRequestToPrint && (
        <ServiceRequestPDFGenerator
          request={serviceRequestToPrint}
          onGenerated={() => setServiceRequestToPrint(null)}
          t={t}
        />
      )}

      {/* Message Modal */}
      {showMessageModal && selectedServiceRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">
                  {t("Message Dealer")} - {selectedServiceRequest.request_id}
                </h2>
                <button
                  onClick={() => setShowMessageModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <h3 className="text-lg font-semibold mb-4">{t("Messages")}</h3>
              {isLoadingMessages ? (
                <div className="text-center py-4">Carregando mensagens...</div>
              ) : messages.length === 0 ? (
                <div className="text-center py-4 text-gray-500">{t("No messages yet")}</div>
              ) : (
                <div className="space-y-4 max-h-60 overflow-y-auto">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-3 rounded-lg ${
                        message.sender_type === "admin" ? "bg-blue-100 ml-8" : "bg-gray-100 mr-8"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold text-sm">
                          {message.sender_type === "admin" ? t("Administrator") : message.sender_name}
                        </span>
                        <span className="text-xs text-gray-500">{new Date(message.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-sm">{message.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t">
              <div className="flex gap-4">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={t("Type your message...")}
                  className="flex-1 p-3 border border-gray-300 rounded-lg resize-none"
                  rows={3}
                />
                <div className="flex flex-col gap-2">
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || isSendingMessage}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSendingMessage ? "..." : t("Send")}
                  </button>
                  <button
                    onClick={() => setShowMessageModal(false)}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                  >
                    {t("Cancel")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddEmail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-2xl font-bold mb-6">
              {currentNotificationEmail ? "Editar Email de Notificação" : "Adicionar Email de Notificação"}
            </h2>
            <p className="text-gray-600 mb-4">
              Este email receberá notificações sobre pedidos (Track Orders) e solicitações de pós-venda (After Sales).
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email de Notificação</label>
                <input
                  type="email"
                  value={notificationEmail}
                  onChange={(e) => setNotificationEmail(e.target.value)}
                  placeholder="exemplo@empresa.com"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {currentNotificationEmail && (
                <div className="text-sm text-gray-500">
                  Email atual: <span className="font-medium">{currentNotificationEmail}</span>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowAddEmail(false)
                  setNotificationEmail(currentNotificationEmail)
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveNotificationEmail}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                {currentNotificationEmail ? "Atualizar Email" : "Salvar Email"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showProblemsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Detalhes dos Problemas</h2>
                <button
                  onClick={() => setShowProblemsModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              <div className="space-y-4">
                {Array.isArray(selectedProblems) ? (
                  selectedProblems.length > 0 ? (
                    selectedProblems.map((issue, i) => (
                      <div key={i} className="border border-gray-200 rounded-lg p-4">
                        <div className="space-y-3">
                          <p className="text-gray-800 font-medium">{issue.text}</p>
                          {issue.imageUrl && (
                            <div className="flex justify-center">
                              <Image
                                src={issue.imageUrl || "/placeholder.svg"}
                                alt={issue.text || "Imagem do problema"}
                                width={300}
                                height={200}
                                className="rounded-lg border border-gray-300 object-cover"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-8">Nenhum problema reportado</p>
                  )
                ) : (
                  <p className="text-gray-500 text-center py-8">Formato de problema não reconhecido</p>
                )}
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowProblemsModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showChangePassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-2xl font-bold mb-6">Alterar Senha do Administrador</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Senha Atual</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Nova Senha</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Confirmar Nova Senha</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-4">
              <button
                onClick={() => setShowChangePassword(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleChangePassword}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Exclusão"
        message="Tem certeza que deseja deletar este item? Esta ação não pode ser desfeita."
      />
      <Notification
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />
    </div>
  )
}

const OrderPDFGenerator = ({
  order,
  onGenerated,
  t,
  lang,
  getStatusBadgeClass,
  formatCurrency,
}: {
  order: Order
  onGenerated: () => void
  t: (key: string) => string
  lang: string
  getStatusBadgeClass: (status: string) => string
  formatCurrency: (value: number | undefined, currency: "BRL" | "USD") => string
}) => {
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (order && contentRef.current) {
      const input = contentRef.current
      html2canvas(input, { scale: 2, useCORS: true, allowTaint: true }).then((canvas) => {
        const imgData = canvas.toDataURL("image/png")
        const pdf = new jsPDF("p", "mm", "a4")
        const pdfWidth = pdf.internal.pageSize.getWidth()
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight > 297 ? 297 : pdfHeight)
        pdf.save(`pedido-${order.order_id}.pdf`)
        onGenerated()
      })
    }
  }, [order, onGenerated])

  if (!order) return null

  const renderOptionsList = (options: string[]) => {
    if (!options || options.length === 0) {
      return <p>{t("No options selected")}</p>
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

  return (
    <div style={{ position: "fixed", left: -9999, top: -9999, width: "210mm" }} className="bg-white" ref={contentRef}>
      <style jsx>{`
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
        .issues-list {
          background-color: #f9fafb;
          padding: 15px;
          border-radius: 8px;
          margin-top: 10px;
        }
        .issues-list .issue-item {
          margin-bottom: 10px;
          padding: 8px;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
        }
        .issues-list .issue-item img {
          max-width: 100%;
          height: auto;
          display: block;
          margin-top: 10px;
          border-radius: 4px;
        }
        .full-width {
          grid-column: 1 / -1;
        }
      `}</style>
      <div className="p-6">
        <div className="logo-header">
          <Image src="/images/logo_drakkar.png" alt="Drakkar Boats" width={300} height={80} className="mx-auto mb-2" />
        </div>

        <div className="header">
          <h1>{t("Order Details")}</h1>
        </div>

        <div className="info-grid">
          <div>
            <strong>{t("Order ID")}:</strong>
            <br />
            <span style={{ fontFamily: "monospace", fontSize: "14px" }}>{order.order_id}</span>
          </div>
          <div>
            <strong>{t("Date")}:</strong>
            <br />
            {new Date(order.created_at).toLocaleDateString()}
          </div>
          <div>
            <strong>{t("Status")}:</strong>
            <br />
            <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
          </div>
        </div>

        <div className="info-section">
          <h3>{t("Customer")}</h3>
          <div className="info-row">
            <div className="info-item">
              <strong>{t("Name (EN)")}:</strong> {order.customer_name}
            </div>
            <div className="info-item">
              <strong>{t("Email")}:</strong> {order.customer_email}
            </div>
          </div>
          <div className="info-row">
            <div className="info-item">
              <strong>{t("Phone")}:</strong> {order.customer_phone}
            </div>
            <div className="info-item">
              <strong>{t("Country")}:</strong> {order.customer_country}
            </div>
          </div>
          <div className="info-row">
            <div className="info-item">
              <strong>{t("Address")}:</strong> {order.customer_address}
            </div>
            <div className="info-item">
              <strong>{t("City")}:</strong> {order.customer_city}
            </div>
          </div>
          <div className="info-row">
            <div className="info-item">
              <strong>{t("State")}:</strong> {order.customer_state}
            </div>
            <div className="info-item">
              <strong>{t("ZIP Code")}:</strong> {order.customer_zip}
            </div>
          </div>
        </div>

        <div className="info-section">
          <h3>{t("Boat Information")}</h3>
          <div className="info-row">
            <div className="info-item">
              <strong>{t("Boat Model")}:</strong> {order.boat_model}
            </div>
            <div className="info-item">
              <strong>{t("Engine")}:</strong> {order.engine_package}
            </div>
          </div>
          <div className="info-row">
            <div className="info-item">
              <strong>{t("Hull Color")}:</strong> {order.hull_color}
            </div>
            <div className="info-item">
              <strong>{t("Upholstery Package")}:</strong> {order.upholstery_package || "-"}
            </div>
          </div>
          <div className="full-width">
            <div className="info-item">
              <strong>{t("Additional Options")}:</strong>
              {renderOptionsList(order.additional_options)}
            </div>
          </div>
        </div>

        <div className="info-section">
          <h3>{t("Payment Information")}</h3>
          <div className="info-row">
            <div className="info-item">
              <strong>{t("Payment Method")}:</strong> {order.payment_method}
            </div>
            <div className="info-item">
              <strong>{t("Deposit Amount")}:</strong> {formatCurrency(order.deposit_amount, "USD")}
            </div>
          </div>
          <div className="info-row">
            <div className="info-item">
              <strong>{t("Total")} (USD):</strong> {formatCurrency(order.total_usd, "USD")}
            </div>
            <div className="info-item">
              <strong>{t("Total")} (BRL):</strong> {formatCurrency(order.total_brl, "BRL")}
            </div>
          </div>
        </div>

        {order.notes && (
          <div className="info-section">
            <h3>{t("Additional Notes")}</h3>
            <div className="issues-list">
              <p>{order.notes}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const ServiceRequestPDFGenerator = ({
  request,
  onGenerated,
  t,
}: {
  request: ServiceRequest
  onGenerated: () => void
  t: (key: string) => string
}) => {
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (request && contentRef.current) {
      const input = contentRef.current
      html2canvas(input, { scale: 2, useCORS: true, allowTaint: true }).then((canvas) => {
        const imgData = canvas.toDataURL("image/png")
        const pdf = new jsPDF("p", "mm", "a4")
        const pdfWidth = pdf.internal.pageSize.getWidth()
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight > 297 ? 297 : pdfHeight)
        pdf.save(`service-request-${request.request_id}.pdf`)
        onGenerated()
      })
    }
  }, [request, onGenerated])

  if (!request) return null

  return (
    <div style={{ position: "fixed", left: -9999, top: -9999, width: "210mm" }} className="bg-white" ref={contentRef}>
      <style jsx>{`
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
        .issues-list {
          background-color: #f9fafb;
          padding: 15px;
          border-radius: 8px;
          margin-top: 10px;
        }
        .issues-list .issue-item {
          margin-bottom: 10px;
          padding: 8px;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
        }
        .issues-list .issue-item img {
          max-width: 100%;
          height: auto;
          display: block;
          margin-top: 10px;
          border-radius: 4px;
        }
        .full-width {
          grid-column: 1 / -1;
        }
      `}</style>
      <div className="p-6">
        <div className="logo-header">
          <Image src="/images/logo_drakkar.png" alt="Drakkar Boats" width={300} height={80} className="mx-auto mb-2" />
        </div>

        <div className="header">
          <h1>{t("Service Request Details")}</h1>
        </div>

        <div className="info-grid">
          <div>
            <strong>{t("ID")}:</strong>
            <br />
            <span style={{ fontFamily: "monospace", fontSize: "14px" }}>{request.request_id}</span>
          </div>
          <div>
            <strong>{t("Date")}:</strong>
            <br />
            {new Date(request.created_at).toLocaleDateString()}
          </div>
          <div>
            <strong>{t("Status")}:</strong>
            <br />
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">{request.status}</span>
          </div>
        </div>

        <div className="info-section">
          <h3>{t("Customer")}</h3>
          <div className="info-row">
            <div className="info-item">
              <strong>{t("Name (EN)")}:</strong> {request.customer_name}
            </div>
            <div className="info-item">
              <strong>{t("Email")}:</strong> {request.customer_email}
            </div>
          </div>
          <div className="info-row">
            <div className="info-item">
              <strong>{t("Phone")}:</strong> {request.customer_phone}
            </div>
            <div className="info-item">
              <strong>{t("Address")}:</strong> {request.customer_address}
            </div>
          </div>
        </div>

        <div className="info-section">
          <h3>{t("Boat Information")}</h3>
          <div className="info-row">
            <div className="info-item">
              <strong>{t("Boat Model")}:</strong> {request.boat_model}
            </div>
            <div className="info-item">
              <strong>{t("Hull ID")}:</strong> {request.hull_id}
            </div>
          </div>
          <div className="info-row">
            <div className="info-item">
              <strong>{t("Purchase Date")}:</strong> {request.purchase_date}
            </div>
            <div className="info-item">
              <strong>{t("Engine Hours")}:</strong> {request.engine_hours}
            </div>
          </div>
          <div className="info-row">
            <div className="info-item">
              <strong>{t("Request Type")}:</strong> {request.request_type}
            </div>
          </div>
        </div>

        <div className="info-section">
          <h3>{t("Issues")}</h3>
          <div className="issues-list">
            {Array.isArray(request.issues) && request.issues.length > 0 ? (
              request.issues.map((issue, index) => (
                <div key={index} className="issue-item">
                  <p>{issue.text}</p>
                  {issue.imageUrl && (
                    <Image
                      src={issue.imageUrl || "/placeholder.svg"}
                      alt={`Issue ${index + 1}`}
                      width={300}
                      height={200}
                      className="rounded border object-cover"
                    />
                  )}
                </div>
              ))
            ) : (
              <p>No issues reported</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
