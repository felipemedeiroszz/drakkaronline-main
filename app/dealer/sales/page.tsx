"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Notification, useNotification } from "@/components/notification"
import { useDealerPricingSync } from "@/hooks/use-dealer-pricing-sync"
import { useDealerRealtimeSync } from "@/hooks/use-realtime-sync"
import { useAdminContinuousSync } from "@/hooks/use-admin-continuous-sync"
import { useSimpleMSRPSync } from "@/hooks/use-simple-msrp-sync"

interface CostItem {
  id: number
  name: string
  name_pt: string
  usd: number
  brl: number
  type: "boat_model" | "engine_package" | "hull_color" | "upholstery_package" | "additional_option"
}

interface PricingItem {
  id?: number
  dealer_id: string
  item_type: string
  item_id: string | number // Pode ser string ou number, mas será convertido para string para o DB
  item_name: string
  sale_price_usd: number
  sale_price_brl: number
  margin_percentage: number
}

export default function SalesPage() {
  const [lang, setLang] = useState("pt")
  const [loading, setLoading] = useState(true)
  const [costItems, setCostItems] = useState<CostItem[]>([])
  const [pricingItems, setPricingItems] = useState<PricingItem[]>([])
  const [dealerId, setDealerId] = useState<string>("")
  const [activeTab, setActiveTab] = useState<
    "boat_model" | "engine_package" | "hull_color" | "upholstery_package" | "additional_option"
  >("boat_model")
  const [editingItem, setEditingItem] = useState<PricingItem | null>(null)
  const [isUpdating, setIsUpdating] = useState(false) // 🔄 ADICIONADO: Estado para indicar atualizações em tempo real
  const [isSaving, setIsSaving] = useState(false) // 🔄 NOVO: Estado para indicar quando está salvando

  // 🔧 CORREÇÃO CRÍTICA: Usar useRef para que o debounceTimer persista entre re-renders
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  // 🔧 ADICIONADO: Timer separado para real-time sync para evitar conflitos
  const realtimeTimerRef = useRef<NodeJS.Timeout | null>(null)

  const { notification, showNotification, hideNotification } = useNotification()
  const { notifyPricingUpdate } = useDealerPricingSync()
  const { notifyMSRPUpdate } = useSimpleMSRPSync()

  // ✅ NOVO: Sincronização contínua e robusta com o Admin
  useAdminContinuousSync({
    onUpdate: (event) => {
      console.log("🚀 Sales: Sincronização contínua ativada:", event)
      
      if (dealerId && !loading && !isUpdating) {
        if (event.immediate) {
          // Para eventos imediatos, executar sem debounce
          console.log("⚡ Sales: Evento imediato - executando reload direto")
          loadData(dealerId, true)
          
          // Mensagem personalizada baseada no tipo de dados
          let message = "📡 Dados sincronizados"
          if (event.dataTypes.includes('boatModels')) {
            message = "🚢 Modelos de barco atualizados"
          } else if (event.dataTypes.some(type => ['enginePackages', 'hullColors', 'upholsteryPackages', 'additionalOptions'].includes(type))) {
            message = "⚙️ Opções atualizadas pelo admin"
          }
          
          showNotification(message, "info")
        } else {
          // Para eventos normais, usar debounce mínimo
          if (realtimeTimerRef.current) {
            clearTimeout(realtimeTimerRef.current)
          }
          realtimeTimerRef.current = setTimeout(() => {
            loadData(dealerId, true)
            showNotification("🔄 Dados atualizados automaticamente", "info")
            realtimeTimerRef.current = null
          }, 100) // Timeout muito reduzido
        }
      } else {
        console.log(`⏸️ Sales: Sincronização cancelada (dealerId: ${dealerId}, loading: ${loading}, isUpdating: ${isUpdating})`)
      }
    },
    dealerId,
    enableHeartbeat: true,
    heartbeatInterval: 15000 // Heartbeat a cada 15 segundos
  })

  // 🔄 MANTIDO: Sincronização real-time do Supabase como backup
  useDealerRealtimeSync(dealerId, () => {
    console.log("📡 Supabase real-time update detected in Sales page...")
    if (dealerId && !loading && !isUpdating) {
      // 🔧 CORRIGIDO: Usar timer separado para real-time sync
      if (realtimeTimerRef.current) {
        console.log("📡 Sales: Cancelando timer real-time anterior")
        clearTimeout(realtimeTimerRef.current)
      }
      realtimeTimerRef.current = setTimeout(() => {
        console.log("🔄 Sales: Executando reload via Supabase real-time sync")
        loadData(dealerId, true) // 🔄 Marcar como atualização em tempo real
        showNotification("📡 Dados sincronizados via banco", "info")
        // 🔧 IMPORTANTE: Limpar o timer após execução para permitir novos eventos
        realtimeTimerRef.current = null
      }, 500) // Timeout um pouco maior para Supabase
    } else {
      console.log(`⏸️ Sales: Supabase real-time sync cancelado (dealerId: ${dealerId}, loading: ${loading}, isUpdating: ${isUpdating})`)
    }
  })

  const translations = {
    pt: {
      "Back to Dashboard": "Voltar ao Painel",
      "Sales Configuration": "Configuração de Vendas",
      "Configure your sale prices and margins": "Configure seus preços de venda e margens",
      "Boat Models": "Modelos de Barco",
      "Engine Packages": "Pacotes de Motor",
      "Hull Colors": "Cores de Casco",
      "Upholstery Packages": "Pacotes de Estofamento",
      "Additional Options": "Opções Adicionais",
      Item: "Item",
      "Dealer Price": "Preço Dealer",
      "MSRP Price": "Preço MSRP",
      Margin: "Margem",
      Actions: "Ações",
      Edit: "Editar",
      Save: "Salvar",
      Cancel: "Cancelar",
      "Loading...": "Carregando...",
      "No items configured": "Nenhum item configurado",
      "Configure Sale Price": "Configurar Preço de Venda",
      "Sale Price (BRL)": "Preço de Venda (BRL)",
      "Margin (%)": "Margem (%)",
      "Price saved successfully!": "Preço salvo com sucesso!",
      "Error saving price": "Erro ao salvar preço",
      "Based on margin": "Baseado na margem",
      "Dealer specific pricing": "Preços específicos do dealer",
      "Sale Price (BRL)": "Preço de Venda (BRL)",
      "Sale Price (USD)": "Preço de Venda (USD)",
    },
    en: {
      "Back to Dashboard": "Back to Dashboard",
      "Sales Configuration": "Sales Configuration",
      "Configure your sale prices and margins": "Configure your sale prices and margins",
      "Boat Models": "Boat Models",
      "Engine Packages": "Engine Packages",
      "Hull Colors": "Hull Colors",
      "Upholstery Packages": "Upholstery Packages",
      "Additional Options": "Additional Options",
      Item: "Item",
      "Dealer Price": "Dealer Price",
      "MSRP Price": "MSRP Price",
      Margin: "Margin",
      Actions: "Actions",
      Edit: "Edit",
      Save: "Save",
      Cancel: "Cancel",
      "Loading...": "Loading...",
      "No items configured": "No items configured",
      "Configure Sale Price": "Configure Sale Price",
      "Sale Price (USD)": "Sale Price (USD)",
      "Margin (%)": "Margin (%)",
      "Price saved successfully!": "Price saved successfully!",
      "Error saving price": "Error saving price",
      "Based on margin": "Based on margin",
      "Dealer specific pricing": "Dealer specific pricing",
      "Sale Price (BRL)": "Sale Price (BRL)",
      "Sale Price (USD)": "Sale Price (USD)",
    },
    es: {
      "Back to Dashboard": "Volver al Panel",
      "Sales Configuration": "Configuración de Ventas",
      "Configure your sale prices and margins": "Configure sus precios de venta y márgenes",
      "Boat Models": "Modelos de Barco",
      "Engine Packages": "Paquetes de Motor",
      "Hull Colors": "Colores de Casco",
      "Upholstery Packages": "Paquetes de Tapicería",
      "Additional Options": "Opciones Adicionales",
      Item: "Artículo",
      "Dealer Price": "Precio Distribuidor",
      "MSRP Price": "Precio MSRP",
      Margin: "Margen",
      Actions: "Acciones",
      Edit: "Editar",
      Save: "Guardar",
      Cancel: "Cancelar",
      "Loading...": "Cargando...",
      "No items configured": "No hay artículos configurados",
      "Configure Sale Price": "Configurar Precio de Venta",
      "Sale Price (USD)": "Precio de Venda (USD)",
      "Margin (%)": "Margen (%)",
      "Price saved successfully!": "¡Precio guardado con éxito!",
      "Error saving price": "Error al guardar precio",
      "Based on margin": "Basado en el margen",
      "Dealer specific pricing": "Precios específicos del distribuidor",
      "Sale Price (BRL)": "Precio de Venta (BRL)",
      "Sale Price (USD)": "Precio de Venda (USD)",
    },
  }

  // Função para obter moeda baseada no idioma
  const getCurrency = () => {
    return lang === "pt" ? "BRL" : "USD"
  }

  // Função para obter preço baseado no idioma
  const getPrice = (item: CostItem | PricingItem, type: "cost" | "sale") => {
    if (type === "cost") {
      const costItem = item as CostItem
      return lang === "pt" ? costItem.brl : costItem.usd
    } else {
      const pricingItem = item as PricingItem
      return lang === "pt" ? pricingItem.sale_price_brl : pricingItem.sale_price_usd
    }
  }

  useEffect(() => {
    const savedLang = localStorage.getItem("selectedLang") || "pt"
    setLang(savedLang)

    const currentDealerId = localStorage.getItem("currentDealerId")
    if (currentDealerId) {
      setDealerId(currentDealerId)
      loadData(currentDealerId)
    } else {
      showNotification("Dealer não identificado. Faça login novamente.", "error")
      setLoading(false)
    }
  }, [])

  // 🔄 MELHORADO: Event listeners aprimorados para sincronização em tempo real com admin panel
  useEffect(() => {
    if (!dealerId) return

    console.log("🎯 Sales: Configurando event listeners aprimorados para sincronização com admin")

    // Função de debounce aprimorada para evitar múltiplas chamadas
    const debouncedReload = (message: string, delay: number = 300) => {
      console.log(`🔄 Sales: debouncedReload chamada - ${message} (delay: ${delay}ms)`)
      
      if (debounceTimerRef.current) {
        console.log("🔄 Sales: Cancelando timer anterior")
        clearTimeout(debounceTimerRef.current)
      }
      
      debounceTimerRef.current = setTimeout(() => {
        if (!loading && !isUpdating) {
          console.log(`🔄 Sales: Executando reload: ${message}`)
          loadData(dealerId, true) // 🔄 Marcar como atualização em tempo real
          showNotification(message, "info")
        } else {
          console.log(`⏸️ Sales: Reload cancelado (loading: ${loading}, isUpdating: ${isUpdating})`)
        }
        // 🔧 IMPORTANTE: Limpar o timer após execução para permitir novos eventos
        debounceTimerRef.current = null
      }, delay)
    }

    // ✅ MELHORADO: Escutar mudanças específicas de dados de opções com resposta imediata
    const handleOptionsUpdate = (event: CustomEvent) => {
      const { dataType, action, timestamp, immediate } = event.detail || {}
      console.log("🔄 Sales: Recebida atualização de opções do admin:", event.detail)
      
      let message = "Dados atualizados pelo administrador"
      
      // Mensagens específicas por tipo de dado
      switch (dataType) {
        case 'enginePackages':
          message = "🔧 Pacotes de motor atualizados"
          break
        case 'hullColors':
          message = "🎨 Cores de casco atualizadas"
          break
        case 'upholsteryPackages':
          message = "🪑 Pacotes de estofamento atualizados"
          break
        case 'additionalOptions':
          message = "⚙️ Opções adicionais atualizadas"
          break
        default:
          message = "📦 Opções atualizadas pelo administrador"
      }

      // ✅ Para eventos imediatos ou salvamento de item, executar SEM debounce
      if (immediate || action === 'save_item') {
        console.log("🚀 Sales: Atualização de opções IMEDIATA detectada - executando reload SEM debounce")
        if (!loading && !isUpdating) {
          loadData(dealerId, true)
          showNotification(message, "info")
        } else {
          console.log("⏸️ Sales: Reload imediato de opções cancelado devido a loading/updating em andamento")
        }
      } else {
        // Para eventos normais, usar debounce muito reduzido
        debouncedReload(message, 50) // Reduzido de 200ms para 50ms
      }
    }

    // 🔄 MELHORADO: Escutar mudanças específicas de modelos de barco
    const handleBoatModelsUpdate = (event: CustomEvent) => {
      console.log("🚢 Sales: Recebida atualização de modelos de barco do admin:", event.detail)
      debouncedReload("🚢 Modelos de barco atualizados", 200)
    }

    // 🔄 ADICIONADO: Escutar mudanças de pricing específicas
    const handleDealerPricingUpdate = (event: CustomEvent) => {
      console.log("💰 Sales: Recebida atualização de preços:", event.detail)
      if (!loading && !isUpdating) {
        // Para pricing updates, reload imediato sem debounce
        loadData(dealerId, true) // 🔄 Marcar como atualização em tempo real
        showNotification("💰 Preços atualizados", "info")
      }
    }

    // 🔄 ADICIONADO: Escutar mudanças administrativas gerais
    const handleAdminDataUpdate = (event: CustomEvent) => {
      console.log("🔄 Sales: Recebida atualização administrativa geral:", event.detail)
      debouncedReload("📊 Dados administrativos atualizados", 400)
    }

    // Escutar invalidação forçada de cache
    const handleCacheInvalidation = (event: CustomEvent) => {
      console.log("🧹 Sales: Cache invalidado, recarregando dados:", event.detail)
      if (!loading && !isUpdating) {
        loadData(dealerId, true) // 🔄 Marcar como atualização em tempo real
        showNotification("🔄 Dados atualizados automaticamente", "info")
      }
    }

    // 🔄 NOVO: Listener específico para mudanças no localStorage (sincronização entre abas)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'adminDataLastUpdate' || event.key === 'adminLastSave') {
        console.log("🔄 Sales: Detectada mudança em outra aba, sincronizando...")
        debouncedReload("📱 Sincronizado com outras abas", 300)
      }
    }

    // ✅ MELHORADO: Listener específico para eventos diretos do admin com priorização
    const handleAdminToSalesSync = (event: CustomEvent) => {
      console.log("🎯 Sales: Recebido ping direto do Admin Panel:", event.detail)
      const { message, dataTypes, immediate } = event.detail || {}
      
      let notificationMessage = message || "📡 Dados atualizados pelo administrador"
      
      // Personalizar mensagem baseada nos tipos de dados atualizados
      if (dataTypes && dataTypes.length > 0) {
        if (dataTypes.includes('boatModels')) {
          notificationMessage = "🚢 Modelos de barco atualizados pelo admin"
        } else if (dataTypes.some((type: string) => ['enginePackages', 'hullColors', 'upholsteryPackages', 'additionalOptions'].includes(type))) {
          notificationMessage = "⚙️ Opções atualizadas pelo admin"
        }
      }
      
      // ✅ Para eventos imediatos, executar reload SEM debounce
      if (immediate) {
        console.log("🚀 Sales: Evento IMEDIATO detectado - executando reload SEM debounce")
        if (!loading && !isUpdating) {
          loadData(dealerId, true)
          showNotification(notificationMessage, "info")
        } else {
          console.log("⏸️ Sales: Reload imediato cancelado devido a loading/updating em andamento")
        }
      } else {
        // Para eventos normais, usar debounce reduzido
        debouncedReload(notificationMessage, 50) // Reduzido de 100ms para 50ms
      }
    }

    // 🔄 MELHORADO: Heartbeat para verificar e manter conexão ativa dos event listeners
    const setupHeartbeat = () => {
      const heartbeatInterval = setInterval(() => {
        console.log("💓 Sales: Heartbeat - verificando conexão e event listeners")
        
        // Verificar conexão de rede
        if (window.navigator.onLine) {
          console.log("🌐 Sales: Conexão online detectada")
          
          // 🔧 NOVO: Teste ativo dos event listeners
          const testEvent = new CustomEvent('salesHeartbeatTest', {
            detail: { 
              timestamp: Date.now(), 
              source: 'heartbeat',
              dealerId: dealerId 
            }
          })
          window.dispatchEvent(testEvent)
          
          // 🔧 NOVO: Verificar se há dados pendentes no localStorage
          try {
            const adminLastSave = localStorage.getItem('adminLastSave')
            if (adminLastSave) {
              const saveData = JSON.parse(adminLastSave)
              const timeDiff = Date.now() - saveData.timestamp
              // Se há dados do admin salvos há menos de 5 minutos, sincronizar
              if (timeDiff < 300000 && !loading && !isUpdating) {
                console.log("🔄 Sales: Heartbeat detectou dados recentes do admin, sincronizando...")
                debouncedReload("🔄 Sincronização via heartbeat", 100)
              }
            }
          } catch (error) {
            console.log("⚠️ Sales: Erro ao verificar localStorage no heartbeat:", error)
          }
          
        } else {
          console.log("🔌 Sales: Conexão offline detectada")
          showNotification("🔌 Conectando...", "info")
        }
      }, 15000) // 🔧 OTIMIZADO: Reduzido para 15 segundos para maior responsividade

      return () => clearInterval(heartbeatInterval)
    }

    // Adicionar todos os event listeners
    window.addEventListener('optionsDataUpdate', handleOptionsUpdate as EventListener)
    window.addEventListener('boatModelsUpdate', handleBoatModelsUpdate as EventListener)
    window.addEventListener('dealerPricingUpdate', handleDealerPricingUpdate as EventListener)
    window.addEventListener('adminDataUpdate', handleAdminDataUpdate as EventListener)
    window.addEventListener('forceCacheInvalidation', handleCacheInvalidation as EventListener)
    window.addEventListener('adminToSalesSync', handleAdminToSalesSync as EventListener)
    window.addEventListener('storage', handleStorageChange)

    // Configurar heartbeat
    const clearHeartbeat = setupHeartbeat()

    console.log("✅ Sales: Event listeners aprimorados configurados")

    // 🔄 NOVO: Testar conectividade imediatamente
    setTimeout(() => {
      console.log("🧪 Sales: Testando conectividade de eventos...")
      const testEvent = new CustomEvent('salesSyncTest', {
        detail: { timestamp: Date.now(), source: 'sales-page' }
      })
      window.dispatchEvent(testEvent)
    }, 1000)

    // Cleanup aprimorado
    return () => {
      console.log("🧹 Sales: Removendo event listeners aprimorados")
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      // 🔧 ADICIONADO: Limpar também o timer do real-time sync
      if (realtimeTimerRef.current) {
        clearTimeout(realtimeTimerRef.current)
      }
      window.removeEventListener('optionsDataUpdate', handleOptionsUpdate as EventListener)
      window.removeEventListener('boatModelsUpdate', handleBoatModelsUpdate as EventListener)
      window.removeEventListener('dealerPricingUpdate', handleDealerPricingUpdate as EventListener)
      window.removeEventListener('adminDataUpdate', handleAdminDataUpdate as EventListener)
      window.removeEventListener('forceCacheInvalidation', handleCacheInvalidation as EventListener)
      window.removeEventListener('adminToSalesSync', handleAdminToSalesSync as EventListener)
      window.removeEventListener('storage', handleStorageChange)
      clearHeartbeat()
    }
  }, [dealerId, loading, isUpdating])

  const loadData = async (dealerId: string, isRealTimeUpdate: boolean = false) => {
    try {
      // 🔄 MELHORADO: Usar indicador de atualização diferente para atualizações em tempo real
      if (isRealTimeUpdate) {
        setIsUpdating(true)
      } else {
        setLoading(true)
      }

      // 🔧 CORRIGIDO: Melhor sistema de cache busting e invalidação para garantir dados frescos
      const timestamp = Date.now()
      const cacheBuster = `t=${timestamp}&cb=${Math.random()}`
      const refreshParam = isRealTimeUpdate ? '&refresh=true&clear_cache=true' : '&refresh=true'
      const url = `/api/get-dealer-config?dealer_id=${dealerId}&${cacheBuster}${refreshParam}&invalidate_cache=true`
      
      console.log(`🔄 Sales: Fazendo request para: ${url}`)
      
      const configResponse = await fetch(url, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'If-Modified-Since': 'Thu, 01 Jan 1970 00:00:00 GMT',
          'X-Cache-Buster': timestamp.toString(),
          'X-Real-Time-Update': isRealTimeUpdate ? 'true' : 'false'
        }
      })
      const configResult = await configResponse.json()

      if (configResult.success) {
        const allItems: CostItem[] = [
          ...configResult.data.boatModels.map((item: any) => ({
            ...item,
            type: "boat_model" as const,
            // 🔧 CORRIGIDO: Manter sempre os preços dealer originais (usd/brl)
            // não sobrescrever com price_usd/price_brl que são preços MSRP
            usd: item.usd || 0,
            brl: item.brl || 0,
          })),
          ...configResult.data.enginePackages.map((item: any) => ({
            ...item,
            type: "engine_package" as const,
            // 🔧 CORRIGIDO: Manter sempre os preços dealer originais (usd/brl)
            usd: item.usd || 0,
            brl: item.brl || 0,
          })),
          ...configResult.data.hullColors.map((item: any) => ({
            ...item,
            type: "hull_color" as const,
            // 🔧 CORRIGIDO: Manter sempre os preços dealer originais (usd/brl)
            usd: item.usd || 0,
            brl: item.brl || 0,
          })),
          ...configResult.data.upholsteryPackages.map((item: any) => ({
            ...item,
            type: "upholstery_package" as const,
            // 🔧 CORRIGIDO: Manter sempre os preços dealer originais (usd/brl)
            usd: item.usd || 0,
            brl: item.brl || 0,
          })),
          ...configResult.data.additionalOptions.map((item: any) => ({
            ...item,
            type: "additional_option" as const,
            // 🔧 CORRIGIDO: Manter sempre os preços dealer originais (usd/brl)
            usd: item.usd || 0,
            brl: item.brl || 0,
          })),
        ]
        setCostItems(allItems)
      }

      // 🔧 CORRIGIDO: Carregar preços específicos com invalidação garantida de cache
      const pricingUrl = `/api/dealer-pricing?dealer_id=${dealerId}&${cacheBuster}${refreshParam}&invalidate_cache=true`
      
      console.log(`🔄 Sales: Fazendo request de pricing para: ${pricingUrl}`)
      
      const pricingResponse = await fetch(pricingUrl, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Cache-Buster': timestamp.toString(),
          'X-Real-Time-Update': isRealTimeUpdate ? 'true' : 'false'
        }
      })
      const pricingResult = await pricingResponse.json()

      if (pricingResult.success) {
        setPricingItems(pricingResult.data)
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      showNotification("Erro ao carregar dados", "error")
    } finally {
      // 🔄 MELHORADO: Limpar ambos os estados de loading
      setLoading(false)
      setIsUpdating(false)
    }
  }

  const getItemsForTab = () => {
    return costItems.filter((item) => item.type === activeTab)
  }

  const getPricingForItem = (itemId: number, itemType: string) => {
    // Busca preço específico DESTE dealer
    // CONVERSÃO PARA STRING: Garante que a comparação de item_id funcione corretamente
    // pois item_id na tabela dealer_pricing é TEXT (string) e itemId aqui é number.
    return pricingItems.find(
      (p) => String(p.item_id) === String(itemId) && p.item_type === itemType && p.dealer_id === dealerId,
    )
  }

  const handleEditItem = (costItem: CostItem) => {
    const existingPricing = getPricingForItem(costItem.id, costItem.type)

    if (existingPricing) {
      // Editar preço existente deste dealer
      setEditingItem({
        ...existingPricing,
        cost_price_usd: costItem.usd,
        cost_price_brl: costItem.brl,
      } as any)
    } else {
      // Criar novo preço específico para este dealer
      const newPricingItem: PricingItem = {
        dealer_id: dealerId, // Específico para este dealer
        item_type: costItem.type,
        item_id: costItem.id,
        item_name: lang === "pt" ? costItem.name_pt : costItem.name,
        sale_price_usd: costItem.usd,
        sale_price_brl: costItem.brl,
        margin_percentage: 0,
      }
      setEditingItem({
        ...newPricingItem,
        cost_price_usd: costItem.usd,
        cost_price_brl: costItem.brl,
      } as any)
    }
  }

  const calculateMargin = (costPrice: number, salePrice: number) => {
    if (costPrice === 0) return 0
    return ((salePrice - costPrice) / costPrice) * 100
  }

  const calculateSalePrice = (costPrice: number, margin: number) => {
    return costPrice * (1 + margin / 100)
  }

  const handleMarginChange = (margin: number) => {
    if (!editingItem) return

    const costPrice = lang === "pt" ? (editingItem as any).cost_price_brl : (editingItem as any).cost_price_usd
    const newSalePrice = calculateSalePrice(costPrice, margin)

    if (lang === "pt") {
      setEditingItem({
        ...editingItem,
        margin_percentage: margin,
        sale_price_brl: Number(newSalePrice.toFixed(2)),
      })
    } else {
      setEditingItem({
        ...editingItem,
        margin_percentage: margin,
        sale_price_usd: Number(newSalePrice.toFixed(2)),
      })
    }
  }

  const handleSalePriceChange = (value: number) => {
    if (!editingItem) return

    const costPrice = lang === "pt" ? (editingItem as any).cost_price_brl : (editingItem as any).cost_price_usd
    const margin = calculateMargin(costPrice, value)

    if (lang === "pt") {
      setEditingItem({
        ...editingItem,
        sale_price_brl: value,
        margin_percentage: Number(margin.toFixed(2)),
      })
    } else {
      setEditingItem({
        ...editingItem,
        sale_price_usd: value,
        margin_percentage: Number(margin.toFixed(2)),
      })
    }
  }

  const handleSaveItem = async () => {
    if (!editingItem || isSaving) return // 🔄 Prevenir múltiplos saves simultâneos

    // dealerId precisa existir
    if (!dealerId) {
      showNotification("Dealer não identificado – faça login novamente.", "error")
      return
    }

    // item_id deve ser string não vazia (pode ser UUID ou número)
    const itemId = String(editingItem.item_id).trim()
    if (!itemId) {
      showNotification("Erro interno: ID do item inválido", "error")
      return
    }

    // item_type e item_name obrigatórios
    if (!editingItem.item_type?.trim() || !editingItem.item_name?.trim()) {
      showNotification("Campos obrigatórios estão faltando", "error")
      return
    }

    try {
      setIsSaving(true) // 🔄 NOVO: Indicar que está salvando
      
      const payload = {
        dealer_id: dealerId.trim(),
        item_type: editingItem.item_type.trim(),
        item_id: itemId, // ✅ string (uuid ou número)
        item_name: editingItem.item_name.trim(),
        sale_price_usd: Number(editingItem.sale_price_usd) || 0,
        sale_price_brl: Number(editingItem.sale_price_brl) || 0,
        margin_percentage: Number(editingItem.margin_percentage) || 0,
      }

      console.log("💰 Sales: Salvando preço MSRP:", payload)

      const response = await fetch("/api/dealer-pricing", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-MSRP-Update": "true",
          "X-Force-Sync": "true",
          "X-Dealer-ID": dealerId
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()
      console.log("💰 Sales: Resposta completa da API:", result)

      if (result.success) {
        showNotification(translations[lang as keyof typeof translations]["Price saved successfully!"], "success")
        setEditingItem(null)
        
        // ✅ OTIMIZAÇÃO: Atualizar apenas o item específico ao invés de recarregar tudo
        const updatedPricingItem = result.data[0] || { 
          ...payload, 
          id: Date.now() 
        }
        
        setPricingItems(prev => {
          const filtered = prev.filter(
            p => !(String(p.item_id) === String(itemId) && 
                   p.item_type === editingItem.item_type && 
                   p.dealer_id === dealerId)
          )
          return [...filtered, updatedPricingItem]
        })
        
        // 🔔 CRÍTICO: Sistema de notificação MSRP simplificado e confiável
        console.log("🚀 Sales: Iniciando notificação SIMPLIFICADA de atualização MSRP")
        
        // 🔥 NOVO: Usar sistema simplificado
        notifyMSRPUpdate(dealerId)
        console.log("✅ Sales: Sistema simplificado notificado")
        
        // 🔧 MANTIDO: Sistema antigo como backup
        notifyPricingUpdate(dealerId)
        console.log("✅ Sales: Hook antigo como backup executado")
        
        // 2. 🔥 MELHORADO: Disparar evento customizado MSRP IMEDIATAMENTE (sem debounce)
        const immediateUpdateEvent = new CustomEvent('salesPriceUpdate', {
          detail: {
            dealerId,
            itemId,
            itemType: editingItem.item_type,
            itemName: editingItem.item_name,
            priceUsd: payload.sale_price_usd,
            priceBrl: payload.sale_price_brl,
            margin: payload.margin_percentage,
            timestamp: Date.now(),
            immediate: true, // Flag para processamento imediato
            msrpUpdate: true, // 🔥 NOVO: Flag específica para MSRP
            apiMetadata: result.syncMetadata, // 🔥 NOVO: Metadados da API
            forceSync: true // 🔥 NOVO: Forçar sincronização imediata
          }
        })
        window.dispatchEvent(immediateUpdateEvent)
        console.log("✅ Sales: Evento salesPriceUpdate MSRP imediato disparado:", immediateUpdateEvent.detail)
        
        // 3. 🔧 ULTRA-CRÍTICO: Marcar localStorage para indicar update MSRP recente
        localStorage.setItem('lastSalesPriceUpdate', JSON.stringify({
          dealerId,
          timestamp: Date.now(),
          item: {
            id: itemId,
            type: editingItem.item_type,
            name: editingItem.item_name,
            priceUsd: payload.sale_price_usd,
            priceBrl: payload.sale_price_brl
          }
        }))
        console.log("✅ Sales: localStorage MSRP update marcado")
        
        // 4. 🔧 NOVO: Invalidar cache de forma agressiva
        const cacheInvalidationEvent = new CustomEvent('forceCacheInvalidation', {
          detail: { 
            reason: 'msrp_price_update', 
            timestamp: Date.now(),
            dealerId,
            itemType: editingItem.item_type,
            itemId
          }
        })
        window.dispatchEvent(cacheInvalidationEvent)
        console.log("✅ Sales: Cache invalidation event disparado")
        
        // 5. 🔧 MÚLTIPLOS EVENTOS para garantir detecção
        setTimeout(() => {
          // Evento 1: dealerPricingUpdate
          const dealerPricingEvent = new CustomEvent('dealerPricingUpdate', {
            detail: { dealerId, timestamp: Date.now(), immediate: true }
          })
          window.dispatchEvent(dealerPricingEvent)
          console.log("✅ Sales: Evento dealerPricingUpdate disparado (delayed 50ms)")
          
          // Evento 2: Storage event manual
          try {
            const storageEvent = new StorageEvent('storage', {
              key: 'dealerPricingLastUpdate',
              newValue: Date.now().toString(),
              oldValue: '',
              url: window.location.href
            })
            window.dispatchEvent(storageEvent)
            console.log("✅ Sales: Storage event manual disparado")
          } catch (error) {
            console.warn("⚠️ Erro ao disparar storage event manual:", error)
          }
          
          // Evento 3: Evento personalizado adicional
          const additionalEvent = new CustomEvent('msrpPriceUpdated', {
            detail: {
              dealerId,
              itemId,
              itemType: editingItem.item_type,
              itemName: editingItem.item_name,
              timestamp: Date.now()
            }
          })
          window.dispatchEvent(additionalEvent)
          console.log("✅ Sales: Evento msrpPriceUpdated adicional disparado")
          
        }, 50)
        
        // 6. 🔧 GARANTIA FINAL: Evento ultra-tardio como fallback absoluto
        setTimeout(() => {
          const fallbackEvent = new CustomEvent('salesPriceFallback', {
            detail: {
              dealerId,
              timestamp: Date.now(),
              message: "Fallback final para garantir sincronização"
            }
          })
          window.dispatchEvent(fallbackEvent)
          console.log("✅ Sales: Evento fallback final disparado")
        }, 1000)
        
        console.log("🎉 Sales: Todos os eventos de sincronização MSRP disparados com sucesso!")
        
      } else {
        console.error("Erro da API:", result)
        showNotification(result.error || "Erro desconhecido", "error")
      }
    } catch (error) {
      console.error("Erro ao salvar preço:", error)
      showNotification(translations[lang as keyof typeof translations]["Error saving price"], "error")
    } finally {
      setIsSaving(false) // 🔄 NOVO: Limpar estado de salvamento
    }
  }

  const formatCurrency = (value: number, currency: "BRL" | "USD") => {
    return new Intl.NumberFormat(lang === "pt" ? "pt-BR" : "en-US", {
      style: "currency",
      currency: currency,
    }).format(value)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto mb-4"></div>
          <p className="text-gray-600">{translations[lang as keyof typeof translations]["Loading..."]}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-5">
      <Notification
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />

      <div className="max-w-7xl mx-auto">
        <Link
          href="/dealer/dashboard"
          className="inline-flex items-center text-blue-900 font-semibold mb-5 hover:underline"
        >
          ← {translations[lang as keyof typeof translations]["Back to Dashboard"]}
        </Link>

        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-blue-900 mb-4">
            {translations[lang as keyof typeof translations]["Sales Configuration"]}
          </h1>
          <p className="text-lg text-gray-600">
            {translations[lang as keyof typeof translations]["Configure your sale prices and margins"]}
          </p>
          <p className="text-sm text-blue-600 mt-2">
            {translations[lang as keyof typeof translations]["Dealer specific pricing"]}
          </p>
          {/* 🔄 ADICIONADO: Indicador visual de atualizações em tempo real */}
          {isUpdating && (
            <div className="flex items-center justify-center gap-2 mt-4 text-blue-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm font-medium">🔄 Sincronizando dados em tempo real...</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-lg mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { key: "boat_model", label: translations[lang as keyof typeof translations]["Boat Models"] },
                { key: "engine_package", label: translations[lang as keyof typeof translations]["Engine Packages"] },
                { key: "hull_color", label: translations[lang as keyof typeof translations]["Hull Colors"] },
                {
                  key: "upholstery_package",
                  label: translations[lang as keyof typeof translations]["Upholstery Packages"],
                },
                {
                  key: "additional_option",
                  label: translations[lang as keyof typeof translations]["Additional Options"],
                },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.key
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Table */}
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {translations[lang as keyof typeof translations]["Item"]}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {translations[lang as keyof typeof translations]["Dealer Price"]} ({getCurrency()})
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {translations[lang as keyof typeof translations]["MSRP Price"]} ({getCurrency()})
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {translations[lang as keyof typeof translations]["Margin"]}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {translations[lang as keyof typeof translations]["Actions"]}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getItemsForTab().map((item) => {
                    const pricing = getPricingForItem(item.id, item.type)
                    const costPrice = getPrice(item, "cost")
                    const salePrice = pricing ? getPrice(pricing, "sale") : null

                    return (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {lang === "pt" ? item.name_pt : item.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatCurrency(costPrice, getCurrency() as "BRL" | "USD")}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {salePrice !== null ? (
                            <div className="text-sm font-medium text-green-600">
                              {formatCurrency(salePrice, getCurrency() as "BRL" | "USD")}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-400">
                              {translations[lang as keyof typeof translations]["No items configured"]}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {pricing ? (
                            <div className="text-sm font-medium text-blue-600">
                              {pricing.margin_percentage.toFixed(1)}%
                            </div>
                          ) : (
                            <div className="text-sm text-gray-400">-</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button onClick={() => handleEditItem(item)} className="text-blue-600 hover:text-blue-900">
                            {translations[lang as keyof typeof translations]["Edit"]}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Edit Modal */}
        {editingItem && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {translations[lang as keyof typeof translations]["Configure Sale Price"]}
                </h3>
                <div className="text-sm text-gray-600 mb-4">
                  <strong>{editingItem.item_name}</strong>
                  <br />
                  <span className="text-xs text-blue-600">
                    {translations[lang as keyof typeof translations]["Dealer specific pricing"]}
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {translations[lang as keyof typeof translations]["Margin (%)"]}
                    </label>
                    <input
                      type="number"
                      value={editingItem.margin_percentage}
                      onChange={(e) => handleMarginChange(Number(e.target.value))}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      step="0.1"
                      min="0"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {translations[lang as keyof typeof translations]["Based on margin"]}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {lang === "pt"
                        ? translations[lang as keyof typeof translations]["Sale Price (BRL)"]
                        : translations[lang as keyof typeof translations]["Sale Price (USD)"]}
                    </label>
                    <input
                      type="number"
                      value={lang === "pt" ? editingItem.sale_price_brl : editingItem.sale_price_usd}
                      onChange={(e) => handleSalePriceChange(Number(e.target.value))}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      step="0.01"
                      min="0"
                    />
                    <div className="text-xs text-gray-500">
                      {translations[lang as keyof typeof translations]["Dealer Price"]}:{" "}
                      {formatCurrency(
                        lang === "pt" ? (editingItem as any).cost_price_brl : (editingItem as any).cost_price_usd,
                        getCurrency() as "BRL" | "USD",
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setEditingItem(null)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                    disabled={isSaving}
                  >
                    {translations[lang as keyof typeof translations]["Cancel"]}
                  </button>
                  <button
                    onClick={handleSaveItem}
                    className={`px-4 py-2 text-white rounded-md transition-all ${
                      isSaving 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <span className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        {lang === "pt" ? "Salvando..." : lang === "es" ? "Guardando..." : "Saving..."}
                      </span>
                    ) : (
                      translations[lang as keyof typeof translations]["Save"]
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
