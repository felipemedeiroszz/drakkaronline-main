"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Notification, useNotification } from "@/components/notification"
import { useDealerPricingSync } from "@/hooks/use-dealer-pricing-sync"
import { useBoatModelsSync } from "@/hooks/use-boat-models-sync"
import { useOptionsSync } from "@/hooks/use-options-sync"
import type { BoatModel } from "@/lib/database-service"

interface EnginePackage {
  id: number
  name: string
  name_pt: string
  usd: number
  brl: number
  compatible_models?: string[]
}

interface HullColor {
  id: number
  name: string
  name_pt: string
  usd: number
  brl: number
  compatible_models?: string[]
}

interface UpholsteryPackage {
  id: number
  name: string
  name_pt: string
  usd: number
  brl: number
  compatible_models?: string[]
}

interface AdditionalOption {
  id: number
  name: string
  name_pt: string
  usd: number
  brl: number
  compatible_models?: string[] // Adicionado para compatibilidade de modelos
  category?: string // Adicionado para categorização
}

interface DealerConfig {
  enginePackages: EnginePackage[]
  hullColors: HullColor[]
  upholsteryPackages: UpholsteryPackage[]
  additionalOptions: AdditionalOption[]
  boatModels: BoatModel[]
}

export default function NewBoatPage() {
  const [lang, setLang] = useState("pt")
  const [config, setConfig] = useState<DealerConfig>({
    enginePackages: [],
    hullColors: [],
    upholsteryPackages: [],
    additionalOptions: [],
    boatModels: [],
  })
  const [loading, setLoading] = useState(true)
  const [filteredEngines, setFilteredEngines] = useState<EnginePackage[]>([])
  const [filteredHullColors, setFilteredHullColors] = useState<HullColor[]>([])
  const [filteredUpholsteryPackages, setFilteredUpholsteryPackages] = useState<UpholsteryPackage[]>([])

  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    customer_address: "",
    customer_city: "",
    customer_state: "",
    customer_zip: "",
    customer_country: "",
    boat_model: "",
    engine_package: "",
    hull_color: "",
    upholstery_package: "",
    additional_options: [] as string[],
    payment_method: "",
    deposit_amount: "",
    additional_notes: "",
  })

  const categories = [
    {
      key: "deck_equipment_comfort",
      name_pt: "Equipamentos de Convés e Conforto",
      name_en: "Deck Equipment & Comfort",
      name_es: "Equipo de Cubierta y Confort",
    },
    {
      key: "electronics_navigation_sound",
      name_pt: "Eletrônicos, Navegação e Sistema de Som",
      name_en: "Electronics, Navigation and Sound System",
      name_es: "Electrónica, Navegación y Sistema de Sonido",
    },
    {
      key: "transport_logistics",
      name_pt: "Transporte e Logística",
      name_en: "Transport & Logistics",
      name_es: "Transporte y Logística",
    },
  ]

  const translations = {
    pt: {
      "New Boat Order": "Novo Pedido de Barco",
      "Create a new boat order for your customers": "Crie um novo pedido de barco para seus clientes",
      "Back to Dashboard": "Voltar ao Painel",
      "Customer Information": "Informações do Cliente",
      "Customer Name": "Nome do Cliente",
      Email: "Email",
      Phone: "Telefone",
      Address: "Endereço",
      City: "Cidade",
      State: "Estado",
      "ZIP Code": "CEP",
      Country: "País",
      "Boat Configuration": "Configuração do Barco",
      "Boat Model": "Modelo do Barco",
      "Engine Package": "Pacote de Motor",
      "Hull Color": "Cor do Casco",
      "Upholstery Package": "Pacote de Estofamento",
      "Additional Options": "Opções Adicionais",
      "Payment Information": "Informações de Pagamento",
      "Payment Method": "Método de Pagamento",
      "Deposit Amount": "Valor do Depósito",
      "Additional Notes": "Observações Adicionais",
      "Order Summary": "Resumo do Pedido",
      "Base Price": "Preço Base",
      Engine: "Motor",
      Hull: "Casco",
      Upholstery: "Estofamento",
      Options: "Opções",
      Total: "Total (BRL)",
      "Submit Order": "Enviar Pedido",
      Cancel: "Cancelar",
      "Loading configurations...": "Carregando configurações...",
      "Error loading configurations": "Erro ao carregar configurações",
      "Order submitted successfully!": "Pedido enviado com sucesso!",
      "Please fill all required fields": "Por favor, preencha todos os campos obrigatórios",
      Cash: "À Vista",
      Financing: "Financiamento",
      "Trade-in": "Troca",
      "For Plan": "Por Plano",
      "Fill with Dealer Info": "Preencher com Dados do Dealer",
      "Error fetching dealer info": "Erro ao buscar dados do dealer",
      "Dealer ID not found": "ID do dealer não encontrado",
      Incompatible: " (Incompatível)",
      "Deck Equipment & Comfort": "Equipamentos de Convés e Conforto",
      "Electronics, Navigation and Sound System": "Eletrônicos, Navegação e Sistema de Som",
      "Transport & Logistics": "Transporte e Logística",
    },
    en: {
      "New Boat Order": "New Boat Order",
      "Create a new boat order for your customers": "Create a new boat order for your customers",
      "Back to Dashboard": "Back to Dashboard",
      "Customer Information": "Customer Information",
      "Customer Name": "Customer Name",
      Email: "Email",
      Phone: "Phone",
      Address: "Address",
      City: "City",
      State: "State",
      "ZIP Code": "ZIP Code",
      Country: "Country",
      "Boat Configuration": "Boat Configuration",
      "Boat Model": "Boat Model",
      "Engine Package": "Engine Package",
      "Hull Color": "Hull Color",
      "Upholstery Package": "Upholstery Package",
      "Additional Options": "Additional Options",
      "Payment Information": "Payment Information",
      "Payment Method": "Payment Method",
      "Deposit Amount": "Deposit Amount",
      "Additional Notes": "Additional Notes",
      "Order Summary": "Order Summary",
      "Base Price": "Base Price",
      Engine: "Engine",
      Hull: "Hull",
      Upholstery: "Upholstery",
      Options: "Options",
      Total: "Total (USD)",
      "Submit Order": "Submit Order",
      Cancel: "Cancel",
      "Loading configurations...": "Loading configurations...",
      "Error loading configurations": "Error loading configurations",
      "Order submitted successfully!": "Order submitted successfully!",
      "Please fill all required fields": "Please fill all required fields",
      Cash: "Cash",
      Financing: "Financing",
      "Trade-in": "Trade-in",
      "For Plan": "For Plan",
      "Fill with Dealer Info": "Fill with Dealer Info",
      "Error fetching dealer info": "Error fetching dealer info",
      "Dealer ID not found": "Dealer ID not found",
      Incompatible: " (Incompatible)",
      "Deck Equipment & Comfort": "Deck Equipment & Comfort",
      "Electronics, Navigation and Sound System": "Electronics, Navigation and Sound System",
      "Transport & Logistics": "Transport & Logistics",
    },
    es: {
      "New Boat Order": "Nuevo Pedido de Barco",
      "Create a new boat order for your customers": "Cree un nuevo pedido de barco para sus clientes",
      "Back to Dashboard": "Volver al Panel",
      "Customer Information": "Información del Cliente",
      "Customer Name": "Nombre del Cliente",
      Email: "Correo Electrónico",
      Phone: "Teléfono",
      Address: "Dirección",
      City: "Ciudad",
      State: "Estado",
      "ZIP Code": "Código Postal",
      Country: "País",
      "Boat Configuration": "Configuración del Barco",
      "Boat Model": "Modelo del Barco",
      "Engine Package": "Paquete de Motor",
      "Hull Color": "Color del Casco",
      "Upholstery Package": "Paquete de Tapicería",
      "Additional Options": "Opciones Adicionales",
      "Payment Information": "Información de Pago",
      "Payment Method": "Monto del Depósito",
      "Deposit Amount": "Notas Adicionales",
      "Additional Notes": "Resumen del Pedido",
      "Order Summary": "Precio Base",
      "Base Price": "Motor",
      Engine: "Casco",
      Hull: "Tapicería",
      Upholstery: "Opciones",
      Options: "Total (USD)",
      Total: "Enviar Pedido",
      "Submit Order": "Cancelar",
      Cancel: "Cancelar",
      "Loading configurations...": "Cargando configuraciones...",
      "Error loading configurations": "Error al cargar configuraciones",
      "Order submitted successfully!": "¡Pedido enviado con éxito!",
      "Please fill all required fields": "Por favor, complete todos los campos requeridos",
      Cash: "Efectivo",
      Financing: "Financiamiento",
      "Trade-in": "Intercambio",
      "For Plan": "Por Plan",
      "Fill with Dealer Info": "Llenar con Datos del Distribuidor",
      "Error fetching dealer info": "Error al buscar datos del distribuidor",
      "Dealer ID not found": "ID del distribuidor no encontrado",
      Incompatible: " (Incompatible)",
      "Deck Equipment & Comfort": "Equipo de Cubierta y Confort",
      "Electronics, Navigation and Sound System": "Electrónica, Navegación y Sistema de Sonido",
      "Transport & Logistics": "Transporte y Logística",
    },
  }

  const { notification, showNotification, hideNotification } = useNotification()
  const { 
    dealerConfig: syncedConfig, 
    reloadDealerConfig, 
    isLoading: isSyncing,
    lastUpdate 
  } = useDealerPricingSync()
  
  const {
    boatModels: syncedBoatModels,
    reloadBoatModels,
    isLoading: isLoadingBoatModels,
    lastUpdate: boatModelsLastUpdate
  } = useBoatModelsSync()
  
  const {
    enginePackages: syncedEnginePackages,
    hullColors: syncedHullColors,
    upholsteryPackages: syncedUpholsteryPackages,
    additionalOptions: syncedAdditionalOptions,
    isLoading: isLoadingOptions,
    lastUpdate: optionsLastUpdate
  } = useOptionsSync()
  
  console.log("📊 New Boat - Hook useDealerPricingSync inicializado")
  console.log("  - syncedConfig:", syncedConfig)
  console.log("  - isSyncing:", isSyncing)
  console.log("  - lastUpdate:", lastUpdate)
  console.log("🚢 New Boat - Hook useBoatModelsSync inicializado")
  console.log("  - syncedBoatModels:", syncedBoatModels)
  console.log("  - isLoadingBoatModels:", isLoadingBoatModels)
  console.log("  - boatModelsLastUpdate:", boatModelsLastUpdate)
  console.log("🎨 New Boat - Hook useOptionsSync inicializado")
  console.log("  - syncedEnginePackages:", syncedEnginePackages?.length || 0)
  console.log("  - syncedHullColors:", syncedHullColors?.length || 0)
  console.log("  - syncedUpholsteryPackages:", syncedUpholsteryPackages?.length || 0)
  console.log("  - syncedAdditionalOptions:", syncedAdditionalOptions?.length || 0)
  console.log("  - optionsLastUpdate:", optionsLastUpdate)

  useEffect(() => {
    const savedLang = localStorage.getItem("selectedLang") || "pt"
    setLang(savedLang)
    loadDealerConfig()
  }, [])

  // Reagir a mudanças de sincronização automaticamente
  useEffect(() => {
    console.log("🔍 New Boat - useEffect syncedConfig triggered")
    console.log("  - syncedConfig:", syncedConfig)
    console.log("  - lastUpdate:", lastUpdate)
    console.log("  - Current config:", config)
    
    if (syncedConfig) {
      console.log("🔄 Atualizando configuração devido à sincronização de preços")
      console.log("  - Número de preços do dealer:", syncedConfig.dealerPricingCount)
      console.log("  - Dados atualizados:", {
        boatModels: syncedConfig.boatModels?.length || 0,
        enginePackages: syncedConfig.enginePackages?.length || 0,
        hullColors: syncedConfig.hullColors?.length || 0,
        upholsteryPackages: syncedConfig.upholsteryPackages?.length || 0,
        additionalOptions: syncedConfig.additionalOptions?.length || 0
      })
      
      setConfig(syncedConfig)
      
      // REMOVIDO: showNotification("Dados atualizados automaticamente", "info")
      console.log("✅ New Boat - Configuração sincronizada com sucesso!")
    } else {
      console.log("⚠️ New Boat - syncedConfig é null/undefined")
    }
  }, [syncedConfig, lastUpdate])

  // Reagir a mudanças nos modelos de barco sincronizados
  useEffect(() => {
    console.log("🚀 New Boat - useEffect syncedBoatModels triggered")
    console.log("  - syncedBoatModels:", syncedBoatModels)
    console.log("  - boatModelsLastUpdate:", boatModelsLastUpdate)
    
    if (syncedBoatModels && syncedBoatModels.length > 0) {
      console.log("🔄 Atualizando modelos de barco devido à sincronização")
      
      // Atualizar apenas os modelos de barco no config
      setConfig(prevConfig => ({
        ...prevConfig,
        boatModels: syncedBoatModels
      }))
      
      // Se o modelo selecionado foi removido, limpar a seleção
      if (formData.boat_model && !syncedBoatModels.find(m => m.name === formData.boat_model)) {
        setFormData(prev => ({ ...prev, boat_model: "" }))
        showNotification("Modelo de barco selecionado foi removido", "warning")
      }
      
      // REMOVIDO: showNotification("Modelos de barco atualizados automaticamente", "info")
      console.log("✅ New Boat - Modelos de barco sincronizados com sucesso!")
    }
  }, [syncedBoatModels, boatModelsLastUpdate])

  // Reagir a mudanças nas opções sincronizadas (Engine Packages, Hull Colors, Upholstery, Additional Options)
  useEffect(() => {
    console.log("🎨 New Boat - useEffect syncedOptions triggered")
    console.log("  - syncedEnginePackages:", syncedEnginePackages?.length || 0)
    console.log("  - syncedHullColors:", syncedHullColors?.length || 0)
    console.log("  - syncedUpholsteryPackages:", syncedUpholsteryPackages?.length || 0)
    console.log("  - syncedAdditionalOptions:", syncedAdditionalOptions?.length || 0)
    console.log("  - optionsLastUpdate:", optionsLastUpdate)
    
    if (syncedEnginePackages || syncedHullColors || syncedUpholsteryPackages || syncedAdditionalOptions) {
      console.log("🔄 Atualizando opções devido à sincronização")
      
      // Atualizar as opções no config
      setConfig(prevConfig => ({
        ...prevConfig,
        enginePackages: syncedEnginePackages || prevConfig.enginePackages,
        hullColors: syncedHullColors || prevConfig.hullColors,
        upholsteryPackages: syncedUpholsteryPackages || prevConfig.upholsteryPackages,
        additionalOptions: syncedAdditionalOptions || prevConfig.additionalOptions
      }))
      
      // Verificar se as seleções atuais ainda são válidas
      if (formData.engine_package && syncedEnginePackages && !syncedEnginePackages.find(e => e.name === formData.engine_package)) {
        setFormData(prev => ({ ...prev, engine_package: "" }))
        showNotification("Pacote de motor selecionado foi removido", "warning")
      }
      
      if (formData.hull_color && syncedHullColors && !syncedHullColors.find(h => h.name === formData.hull_color)) {
        setFormData(prev => ({ ...prev, hull_color: "" }))
        showNotification("Cor de casco selecionada foi removida", "warning")
      }
      
      if (formData.upholstery_package && syncedUpholsteryPackages && !syncedUpholsteryPackages.find(u => u.name === formData.upholstery_package)) {
        setFormData(prev => ({ ...prev, upholstery_package: "" }))
        showNotification("Pacote de estofamento selecionado foi removido", "warning")
      }
      
      if (formData.additional_options.length > 0 && syncedAdditionalOptions) {
        const validOptions = formData.additional_options.filter(opt => 
          syncedAdditionalOptions.find(a => a.name === opt)
        )
        if (validOptions.length !== formData.additional_options.length) {
          setFormData(prev => ({ ...prev, additional_options: validOptions }))
          showNotification("Algumas opções adicionais selecionadas foram removidas", "warning")
        }
      }
      
      // REMOVIDO: showNotification("Opções atualizadas automaticamente", "info")
      console.log("✅ New Boat - Opções sincronizadas com sucesso!")
    }
  }, [syncedEnginePackages, syncedHullColors, syncedUpholsteryPackages, syncedAdditionalOptions, optionsLastUpdate])

  useEffect(() => {
    if (formData.boat_model && config.enginePackages.length > 0) {
      const compatibleEngines = config.enginePackages.filter((engine) =>
        engine.compatible_models?.includes(formData.boat_model),
      )
      setFilteredEngines(compatibleEngines)
    } else {
      setFilteredEngines([])
    }
  }, [formData.boat_model, config.enginePackages])

  useEffect(() => {
    if (formData.boat_model && config.hullColors.length > 0) {
      const compatibleColors = config.hullColors.filter(
        (color) =>
          !color.compatible_models ||
          color.compatible_models.length === 0 ||
          color.compatible_models.includes(formData.boat_model),
      )
      setFilteredHullColors(compatibleColors)
    } else {
      setFilteredHullColors(config.hullColors)
    }
  }, [formData.boat_model, config.hullColors])

  useEffect(() => {
    if (formData.boat_model && config.upholsteryPackages.length > 0) {
      const compatibleUpholstery = config.upholsteryPackages.filter(
        (upholstery) =>
          !upholstery.compatible_models ||
          upholstery.compatible_models.length === 0 ||
          upholstery.compatible_models.includes(formData.boat_model),
      )
      setFilteredUpholsteryPackages(compatibleUpholstery)
    } else {
      setFilteredUpholsteryPackages(config.upholsteryPackages)
    }
  }, [formData.boat_model, config.upholsteryPackages])

  // Novo useEffect para lidar com a compatibilidade das opções adicionais
  useEffect(() => {
    if (formData.boat_model && config.additionalOptions.length > 0) {
      const currentSelectedOptions = formData.additional_options
      const newSelectedOptions = currentSelectedOptions.filter((optionName) => {
        const option = config.additionalOptions.find((opt) => opt.name === optionName)
        return (
          option &&
          (!option.compatible_models ||
            option.compatible_models.length === 0 ||
            option.compatible_models.includes(formData.boat_model))
        )
      })
      if (newSelectedOptions.length !== currentSelectedOptions.length) {
        setFormData((prev) => ({ ...prev, additional_options: newSelectedOptions }))
      }
    } else if (!formData.boat_model && formData.additional_options.length > 0) {
      // Se nenhum modelo de barco for selecionado, desmarcar todas as opções adicionais
      setFormData((prev) => ({ ...prev, additional_options: [] }))
    }
  }, [formData.boat_model, config.additionalOptions])

  const loadDealerConfig = async () => {
    try {
      setLoading(true)
      
      // REMOVIDO: const dealerId = localStorage.getItem("currentDealerId")
      // REMOVIDO: if (!dealerId) { ... }

      // MODIFICADO: Remover o dealer_id da URL para obter preços básicos
      const url = `/api/get-dealer-config`  // SEM ?dealer_id=${dealerId}
      const response = await fetch(url)
      const result = await response.json()

      if (result.success) {
        // Os preços agora vêm SEM valores MSRP configurados pelo dealer
        setConfig(result.data)
        console.log("✅ Configurações carregadas com preços BÁSICOS:", result.data)

        // REMOVIDO: Notificações sobre preços MSRP
        // ADICIONADO: Notificação simples
        showNotification("Configurações carregadas com preços básicos", "info")
      } else {
        showNotification(translations[lang as keyof typeof translations]["Error loading configurations"], "error")
      }
    } catch (error) {
      console.error("Erro ao carregar configurações:", error)
      showNotification(translations[lang as keyof typeof translations]["Error loading configurations"], "error")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleOptionToggle = (optionName: string) => {
    const currentOptions = formData.additional_options
    const isSelected = currentOptions.includes(optionName)

    // Verifica se a opção é compatível antes de permitir a seleção/desseleção
    const option = config.additionalOptions.find((opt) => opt.name === optionName)
    const isCompatible =
      option &&
      (!option.compatible_models ||
        option.compatible_models.length === 0 ||
        option.compatible_models.includes(formData.boat_model))

    if (!isCompatible && !isSelected) {
      // Não permite selecionar uma opção incompatível
      return
    }

    if (isSelected) {
      handleInputChange(
        "additional_options",
        currentOptions.filter((opt) => opt !== optionName),
      )
    } else {
      handleInputChange("additional_options", [...currentOptions, optionName])
    }
  }

  const handleBoatModelChange = (modelName: string) => {
    setFormData((prev) => ({
      ...prev,
      boat_model: modelName,
      engine_package: "", // Reset engine selection
      hull_color: "", // Reset hull color selection
      upholstery_package: "", // Reset upholstery selection
      additional_options: [], // Reset additional options on model change
    }))
  }

  const getSelectedBoatModel = () => {
    return config.boatModels.find((model) => model.name === formData.boat_model)
  }

  const getSelectedEngine = () => {
    return config.enginePackages.find((engine) => engine.name === formData.engine_package)
  }

  const getSelectedHullColor = () => {
    return config.hullColors.find((color) => color.name === formData.hull_color)
  }

  const getSelectedUpholsteryPackage = () => {
    return config.upholsteryPackages.find((upholstery) => upholstery.name === formData.upholstery_package)
  }

  const getSelectedOptions = () => {
    return config.additionalOptions.filter((option) => formData.additional_options.includes(option.name))
  }

  const calculateTotals = () => {
    const boatModel = getSelectedBoatModel()
    const engine = getSelectedEngine()
    const hullColor = getSelectedHullColor()
    const upholsteryPackage = getSelectedUpholsteryPackage()
    const options = getSelectedOptions()

    const baseUsd = boatModel?.usd || 0
    const engineUsd = engine?.usd || 0
    const hullUsd = hullColor?.usd || 0
    const upholsteryUsd = upholsteryPackage?.usd || 0
    const optionsUsd = options.reduce((sum, opt) => sum + opt.usd, 0)

    const baseBrl = boatModel?.brl || 0
    const engineBrl = engine?.brl || 0
    const hullBrl = hullColor?.brl || 0
    const upholsteryBrl = upholsteryPackage?.brl || 0
    const optionsBrl = options.reduce((sum, opt) => sum + opt.brl, 0)

    return {
      totalUsd: baseUsd + engineUsd + hullUsd + upholsteryUsd + optionsUsd,
      totalBrl: baseBrl + engineBrl + hullBrl + upholsteryBrl + optionsBrl,
      breakdown: {
        base: { usd: baseUsd, brl: baseBrl },
        engine: { usd: engineUsd, brl: engineBrl },
        hull: { usd: hullUsd, brl: hullBrl },
        upholstery: { usd: upholsteryUsd, brl: upholsteryBrl },
        options: { usd: optionsUsd, brl: optionsBrl },
      },
    }
  }

  const formatCurrency = (value: number, currency: "BRL" | "USD") => {
    return new Intl.NumberFormat(lang === "pt" ? "pt-BR" : "en-US", {
      style: "currency",
      currency: currency,
    }).format(value)
  }

  const generateOrderId = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, "0")
    const day = String(today.getDate()).padStart(2, "0")
    const timestamp = Date.now().toString().slice(-4)
    return `ORD-${year}${month}${day}-${timestamp}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (
      !formData.customer_name ||
      !formData.customer_email ||
      !formData.customer_phone ||
      !formData.boat_model ||
      !formData.engine_package ||
      !formData.hull_color ||
      !formData.payment_method
    ) {
      showNotification(translations[lang as keyof typeof translations]["Please fill all required fields"], "error")
      return
    }

    try {
      const totals = calculateTotals()
      const orderId = generateOrderId()
      
      // Debug logs
      const currentDealerId = localStorage.getItem("currentDealerId")
      const currentDealerName = localStorage.getItem("currentDealerName")
      
      console.log("🔍 Debug - Criando novo pedido:")
      console.log("- Dealer ID:", currentDealerId)
      console.log("- Dealer Name:", currentDealerName)
      
      if (!currentDealerId) {
        showNotification("Erro: ID do dealer não encontrado. Por favor, faça login novamente.", "error")
        setTimeout(() => {
          window.location.href = "/dealer"
        }, 2000)
        return
      }

      // Definir idioma atual para salvar os textos no idioma correto
      const isPt = lang === "pt"
      const boatModel = getSelectedBoatModel()
      const engine = getSelectedEngine()
      const hullColor = getSelectedHullColor()
      const upholstery = getSelectedUpholsteryPackage()

      const orderData = {
        order_id: orderId,
        dealer_id: currentDealerId,
        dealer_name: currentDealerName || "", // Adicionar dealer_name para debug
        customer_name: formData.customer_name,
        customer_email: formData.customer_email,
        customer_phone: formData.customer_phone,
        customer_address: formData.customer_address,
        customer_city: formData.customer_city,
        customer_state: formData.customer_state,
        customer_zip: formData.customer_zip,
        customer_country: formData.customer_country,
        // Salvar campos de exibição no idioma selecionado
        boat_model: (isPt ? boatModel?.name_pt : boatModel?.name) || formData.boat_model,
        engine_package: (isPt ? engine?.name_pt : engine?.name) || formData.engine_package,
        hull_color: (isPt ? hullColor?.name_pt : hullColor?.name) || formData.hull_color,
        upholstery_package: (isPt ? upholstery?.name_pt : upholstery?.name) || formData.upholstery_package,
        additional_options: formData.additional_options.map((optName) => {
          const opt = config.additionalOptions.find((o) => o.name === optName)
          return (isPt ? opt?.name_pt : opt?.name) || optName
        }),
        payment_method: formData.payment_method,
        deposit_amount: Number.parseFloat(formData.deposit_amount) || 0,
        additional_notes: formData.additional_notes,
        total_usd: totals.totalUsd,
        total_brl: totals.totalBrl,
        status: "pending",
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
        const localOrders = JSON.parse(localStorage.getItem("orders") || "[]")
        localOrders.push(orderData)
        localStorage.setItem("orders", JSON.stringify(localOrders))

        setFormData({
          customer_name: "",
          customer_email: "",
          customer_phone: "",
          customer_address: "",
          customer_city: "",
          customer_state: "",
          customer_zip: "",
          customer_country: "",
          boat_model: "",
          engine_package: "",
          hull_color: "",
          upholstery_package: "",
          additional_options: [],
          payment_method: "",
          deposit_amount: "",
          additional_notes: "",
        })

        showNotification(translations[lang as keyof typeof translations]["Order submitted successfully!"], "success")
        
        setTimeout(() => {
          window.location.href = "/dealer/track-orders"
        }, 1500) // Reduced delay for faster navigation
      } else {
        throw new Error(result.error || "Erro ao salvar pedido")
      }
    } catch (error) {
      console.error("Erro ao enviar pedido:", error)
      showNotification("Erro ao enviar pedido: " + String(error), "error")
    }
  }

  const fillDealerInfo = async () => {
    const dealerId = localStorage.getItem("currentDealerId")

    if (!dealerId) {
      showNotification(translations[lang as keyof typeof translations]["Dealer ID not found"], "error")
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
        setFormData((prev) => ({
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
        showNotification(
          result.error || translations[lang as keyof typeof translations]["Error fetching dealer info"],
          "error",
        )
      }
    } catch (error) {
      console.error("Erro ao buscar dados do dealer:", error)
      showNotification(translations[lang as keyof typeof translations]["Error fetching dealer info"], "error")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {translations[lang as keyof typeof translations]["Loading configurations..."]}
          </p>
        </div>
      </div>
    )
  }

  const totals = calculateTotals()
  const isPt = lang === "pt"

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-5">
      <Notification
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />
      <div className="max-w-6xl mx-auto">
        <Link
          href="/dealer/dashboard"
          className="inline-flex items-center text-blue-900 font-semibold mb-5 hover:underline"
        >
          ← {translations[lang as keyof typeof translations]["Back to Dashboard"]}
        </Link>

        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-blue-900 mb-4">
            {translations[lang as keyof typeof translations]["New Boat Order"]}
          </h1>
          <p className="text-lg text-gray-600">
            {translations[lang as keyof typeof translations]["Create a new boat order for your customers"]}
          </p>
          {isSyncing && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg inline-block">
              <div className="flex items-center space-x-2 text-blue-700">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700"></div>
                <span className="text-sm font-medium">Sincronizando dados atualizados...</span>
              </div>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Customer Information */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-blue-900">
                    {translations[lang as keyof typeof translations]["Customer Information"]}
                  </h2>
                  <button
                    type="button"
                    onClick={fillDealerInfo}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors text-sm"
                  >
                    {translations[lang as keyof typeof translations]["Fill with Dealer Info"] || "Preencher"}
                  </button>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-2">
                      {translations[lang as keyof typeof translations]["Customer Name"]} *
                    </label>
                    <input
                      type="text"
                      value={formData.customer_name}
                      onChange={(e) => handleInputChange("customer_name", e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-2">
                      {translations[lang as keyof typeof translations]["Email"]} *
                    </label>
                    <input
                      type="email"
                      value={formData.customer_email}
                      onChange={(e) => handleInputChange("customer_email", e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-2">
                      {translations[lang as keyof typeof translations]["Phone"]} *
                    </label>
                    <input
                      type="tel"
                      value={formData.customer_phone}
                      onChange={(e) => handleInputChange("customer_phone", e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-2">
                      {translations[lang as keyof typeof translations]["Address"]}
                    </label>
                    <input
                      type="text"
                      value={formData.customer_address}
                      onChange={(e) => handleInputChange("customer_address", e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-2">
                      {translations[lang as keyof typeof translations]["City"]}
                    </label>
                    <input
                      type="text"
                      value={formData.customer_city}
                      onChange={(e) => handleInputChange("customer_city", e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-2">
                      {translations[lang as keyof typeof translations]["State"]}
                    </label>
                    <input
                      type="text"
                      value={formData.customer_state}
                      onChange={(e) => handleInputChange("customer_state", e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-2">
                      {translations[lang as keyof typeof translations]["ZIP Code"]}
                    </label>
                    <input
                      type="text"
                      value={formData.customer_zip}
                      onChange={(e) => handleInputChange("customer_zip", e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-2">
                      {translations[lang as keyof typeof translations]["Country"]}
                    </label>
                    <input
                      type="text"
                      value={formData.customer_country}
                      onChange={(e) => handleInputChange("customer_country", e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Boat Configuration */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-blue-900 mb-6">
                  {translations[lang as keyof typeof translations]["Boat Configuration"]}
                </h2>
                <div className="space-y-6">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-2">
                      {translations[lang as keyof typeof translations]["Boat Model"]} *
                    </label>
                    <select
                      value={formData.boat_model}
                      onChange={(e) => handleBoatModelChange(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg"
                      required
                    >
                      <option value="">-- Select Model --</option>
                      {config.boatModels.map((model) => (
                        <option key={model.id} value={model.name}>
                          {isPt ? model.name_pt : model.name} -{" "}
                          {formatCurrency(isPt ? model.brl : model.usd, isPt ? "BRL" : "USD")}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-2">
                      {translations[lang as keyof typeof translations]["Engine Package"]} *
                    </label>
                    <select
                      value={formData.engine_package}
                      onChange={(e) => handleInputChange("engine_package", e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg"
                      required
                      disabled={!formData.boat_model || filteredEngines.length === 0}
                    >
                      <option value="">
                        {!formData.boat_model
                          ? "-- Select a Boat Model First --"
                          : filteredEngines.length === 0
                            ? "-- No compatible engines --"
                            : "-- Select Engine --"}
                      </option>
                      {filteredEngines.map((engine) => (
                        <option key={engine.id} value={engine.name}>
                          {isPt ? engine.name_pt : engine.name} -{" "}
                          {formatCurrency(isPt ? engine.brl : engine.usd, isPt ? "BRL" : "USD")}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-2">
                      {translations[lang as keyof typeof translations]["Hull Color"]} *
                    </label>
                    <select
                      value={formData.hull_color}
                      onChange={(e) => handleInputChange("hull_color", e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg"
                      required
                      disabled={!formData.boat_model}
                    >
                      <option value="">
                        {!formData.boat_model
                          ? "-- Select a Boat Model First --"
                          : filteredHullColors.length === 0 && config.hullColors.length > 0
                            ? "-- No compatible colors for this model --"
                            : "-- Select Color --"}
                      </option>
                      {filteredHullColors.map((color) => (
                        <option key={color.id} value={color.name}>
                          {isPt ? color.name_pt : color.name} -{" "}
                          {formatCurrency(isPt ? color.brl : color.usd, isPt ? "BRL" : "USD")}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-2">
                      {translations[lang as keyof typeof translations]["Upholstery Package"]}
                    </label>
                    <select
                      value={formData.upholstery_package}
                      onChange={(e) => handleInputChange("upholstery_package", e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg"
                      disabled={!formData.boat_model}
                    >
                      <option value="">
                        {!formData.boat_model
                          ? "-- Select a Boat Model First --"
                          : filteredUpholsteryPackages.length === 0 && config.upholsteryPackages.length > 0
                            ? "-- No compatible upholstery for this model --"
                            : "-- Select Upholstery --"}
                      </option>
                      {filteredUpholsteryPackages.map((upholstery) => (
                        <option key={upholstery.id} value={upholstery.name}>
                          {isPt ? upholstery.name_pt : upholstery.name} -{" "}
                          {formatCurrency(isPt ? upholstery.brl : upholstery.usd, isPt ? "BRL" : "USD")}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-2">
                      {translations[lang as keyof typeof translations]["Additional Options"]}
                    </label>
                    <div className="space-y-6">
                      {" "}
                      {/* Use space-y-6 for spacing between categories */}
                      {categories.map((category) => {
                        const categoryOptions = config.additionalOptions.filter(
                          (option) => option.category === category.key,
                        )
                        if (categoryOptions.length === 0) return null // Don't render category if no options

                        return (
                          <div key={category.key}>
                            <h3 className="text-lg font-bold text-blue-800 mb-3">
                              {translations[lang as keyof typeof translations][category.name_en] ||
                                (isPt ? category.name_pt : category.name_en)}
                            </h3>
                            <div className="grid md:grid-cols-2 gap-3">
                              {categoryOptions.map((option) => {
                                const isCompatible = formData.boat_model
                                  ? !option.compatible_models ||
                                    option.compatible_models.length === 0 ||
                                    option.compatible_models.includes(formData.boat_model)
                                  : false // Se nenhum modelo de barco for selecionado, nenhuma opção é compatível para seleção
                                const isDisabled = !formData.boat_model || !isCompatible

                                return (
                                  <label
                                    key={option.id}
                                    className={`flex items-center space-x-3 cursor-pointer ${isDisabled ? "text-gray-400 cursor-not-allowed" : ""}`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={formData.additional_options.includes(option.name)}
                                      onChange={() => handleOptionToggle(option.name)}
                                      className="w-4 h-4 text-blue-600"
                                      disabled={isDisabled}
                                    />
                                    <span className="text-sm">
                                      {isPt ? option.name_pt : option.name} -{" "}
                                      {formatCurrency(isPt ? option.brl : option.usd, isPt ? "BRL" : "USD")}
                                      {isDisabled &&
                                        formData.boat_model &&
                                        !isCompatible &&
                                        translations[lang as keyof typeof translations]["Incompatible"]}
                                    </span>
                                  </label>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-blue-900 mb-6">
                  {translations[lang as keyof typeof translations]["Payment Information"]}
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-2">
                      {translations[lang as keyof typeof translations]["Payment Method"]} *
                    </label>
                    <select
                      value={formData.payment_method}
                      onChange={(e) => handleInputChange("payment_method", e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg"
                      required
                    >
                      <option value="">-- Select Payment Method --</option>
                      <option value="cash">{translations[lang as keyof typeof translations]["Cash"]}</option>
                      <option value="financing">{translations[lang as keyof typeof translations]["Financing"]}</option>
                      <option value="trade-in">{translations[lang as keyof typeof translations]["Trade-in"]}</option>
                      <option value="for-plan">{translations[lang as keyof typeof translations]["For Plan"]}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-2">
                      {translations[lang as keyof typeof translations]["Deposit Amount"]} ({isPt ? "BRL" : "USD"})
                    </label>
                    <input
                      type="number"
                      value={formData.deposit_amount}
                      onChange={(e) => handleInputChange("deposit_amount", e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                <div className="mt-6">
                  <label className="block font-semibold text-gray-700 mb-2">
                    {translations[lang as keyof typeof translations]["Additional Notes"]}
                  </label>
                  <textarea
                    value={formData.additional_notes}
                    onChange={(e) => handleInputChange("additional_notes", e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    rows={4}
                    placeholder="Any special requests or notes..."
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-between">
                <Link
                  href="/dealer/dashboard"
                  className="bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
                >
                  {translations[lang as keyof typeof translations]["Cancel"]}
                </Link>
                <button
                  type="submit"
                  className="bg-blue-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors"
                >
                  {translations[lang as keyof typeof translations]["Submit Order"]}
                </button>
              </div>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-6">
              <h2 className="text-xl font-bold text-blue-900 mb-6">
                {translations[lang as keyof typeof translations]["Order Summary"]}
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>{translations[lang as keyof typeof translations]["Base Price"]}:</span>
                  <span>
                    {formatCurrency(isPt ? totals.breakdown.base.brl : totals.breakdown.base.usd, isPt ? "BRL" : "USD")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{translations[lang as keyof typeof translations]["Engine"]}:</span>
                  <span>
                    {formatCurrency(
                      isPt ? totals.breakdown.engine.brl : totals.breakdown.engine.usd,
                      isPt ? "BRL" : "USD",
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{translations[lang as keyof typeof translations]["Hull"]}:</span>
                  <span>
                    {formatCurrency(isPt ? totals.breakdown.hull.brl : totals.breakdown.hull.usd, isPt ? "BRL" : "USD")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{translations[lang as keyof typeof translations]["Upholstery"]}:</span>
                  <span>
                    {formatCurrency(
                      isPt ? totals.breakdown.upholstery.brl : totals.breakdown.upholstery.usd,
                      isPt ? "BRL" : "USD",
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{translations[lang as keyof typeof translations]["Options"]}:</span>
                  <span>
                    {formatCurrency(
                      isPt ? totals.breakdown.options.brl : totals.breakdown.options.usd,
                      isPt ? "BRL" : "USD",
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{translations[lang as keyof typeof translations]["Total"]}:</span>
                  <span>{formatCurrency(isPt ? totals.totalBrl : totals.totalUsd, isPt ? "BRL" : "USD")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
