import { useState, useEffect, useCallback, useRef } from 'react'
import { useDealerRealtimeSync } from './use-realtime-sync'

interface DealerPricingData {
  id?: number
  dealer_id: string
  item_type: string
  item_id: string | number
  item_name: string
  sale_price_usd: number
  sale_price_brl: number
  margin_percentage: number
}

interface SyncState {
  lastUpdate: number
  isLoading: boolean
  error: string | null
}

// Sistema de eventos para sincronização entre páginas
class DealerPricingSyncManager {
  private static instance: DealerPricingSyncManager
  private listeners: Set<() => void> = new Set()
  private state: SyncState = {
    lastUpdate: Date.now(),
    isLoading: false,
    error: null
  }
  private debounceTimer: NodeJS.Timeout | null = null

  static getInstance(): DealerPricingSyncManager {
    if (!this.instance) {
      this.instance = new DealerPricingSyncManager()
    }
    return this.instance
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    console.log(`🔔 DealerPricingSyncManager: Novo listener adicionado. Total: ${this.listeners.size}`)
    return () => {
      this.listeners.delete(listener)
      console.log(`🔔 DealerPricingSyncManager: Listener removido. Total: ${this.listeners.size}`)
    }
  }

  notifyPricingUpdate(dealerId: string): void {
    console.log('🔔 DealerPricingSyncManager.notifyPricingUpdate chamado')
    console.log('  - Dealer ID:', dealerId)
    console.log('  - Listeners ativos:', this.listeners.size)
    
    // Atualizar estado imediatamente para que listeners possam reagir
    this.state.lastUpdate = Date.now()
    console.log('  - Novo lastUpdate:', this.state.lastUpdate)
    
    // 🔧 OTIMIZADO: Notificar listeners internos apenas se necessário
    console.log(`🔔 Notificando ${this.listeners.size} listeners internos`)
    this.listeners.forEach((listener, index) => {
      try {
        listener()
      } catch (error) {
        console.error(`❌ Erro ao executar listener ${index + 1}:`, error)
      }
    })
    
    // Salvar no localStorage para sincronização entre abas
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('dealerPricingLastUpdate', this.state.lastUpdate.toString())
        localStorage.setItem('dealerPricingUpdatedBy', dealerId)
        console.log('✅ LocalStorage atualizado:', {
          lastUpdate: this.state.lastUpdate,
          updatedBy: dealerId
        })
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar localStorage:', error)
    }
    
    // 🔧 PRINCIPAL: Disparar evento customizado principal
    try {
      const customEvent = new CustomEvent('dealerPricingUpdate', {
        detail: { dealerId, timestamp: this.state.lastUpdate, immediate: true }
      })
      window.dispatchEvent(customEvent)
      console.log('✅ Evento dealerPricingUpdate disparado:', customEvent.detail)
    } catch (error) {
      console.error('❌ Erro ao disparar evento customizado:', error)
    }
    
    // 🔧 OTIMIZADO: Apenas um evento adicional essencial com pequeno delay
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }

    this.debounceTimer = setTimeout(() => {
      console.log('🔄 Executando evento de fallback (500ms)')
      
      // Evento de fallback para garantir que a sincronização aconteça
      try {
        const storageEvent = new StorageEvent('storage', {
          key: 'dealerPricingLastUpdate',
          newValue: this.state.lastUpdate.toString(),
          oldValue: '',
          url: window.location.href
        })
        window.dispatchEvent(storageEvent)
        console.log('✅ Storage event de fallback disparado')
      } catch (error) {
        console.error('❌ Erro ao disparar storage event:', error)
      }
      
      console.log('✅ Notificação otimizada concluída!')
    }, 500) // 🔧 OTIMIZADO: Delay maior para fallback
  }

  getState(): SyncState {
    return { ...this.state }
  }

  setLoading(loading: boolean): void {
    console.log(`🔄 DealerPricingSyncManager: Setting loading = ${loading}`)
    this.state.isLoading = loading
    this.listeners.forEach((listener) => {
      try {
        listener()
      } catch (error) {
        console.error(`❌ Erro ao executar listener (setLoading):`, error)
      }
    })
  }

  setError(error: string | null): void {
    console.log(`❌ DealerPricingSyncManager: Setting error = ${error}`)
    this.state.error = error
    this.listeners.forEach((listener) => {
      try {
        listener()
      } catch (error) {
        console.error(`❌ Erro ao executar listener (setError):`, error)
      }
    })
  }

  cleanup(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = null
    }
    this.listeners.clear()
    console.log('🧹 DealerPricingSyncManager: Cleanup realizado')
  }
}

export function useDealerPricingSync() {
  const [syncState, setSyncState] = useState<SyncState>(() => 
    DealerPricingSyncManager.getInstance().getState()
  )
  const [dealerConfig, setDealerConfig] = useState<any>(null)
  const loadingRef = useRef(false)
  const lastReloadRef = useRef(0)
  const componentMountedRef = useRef(true)

  const syncManager = DealerPricingSyncManager.getInstance()

  // Função para recarregar configurações do dealer com debounce
  const reloadDealerConfig = useCallback(async (dealerId?: string) => {
    if (!componentMountedRef.current) {
      console.log("🚫 DealerPricingSync: Componente desmontado, ignorando reload")
      return null
    }

    if (!dealerId) {
      if (typeof window !== 'undefined' && window.localStorage) {
        dealerId = localStorage.getItem("currentDealerId") || undefined
      }
    }
    
    if (!dealerId) {
      console.warn("⚠️ DealerPricingSync: No dealer ID available")
      return null
    }

    // Prevenir múltiplas chamadas simultâneas
    if (loadingRef.current) {
      console.log("⏳ DealerPricingSync: Já está carregando, ignorando nova chamada")
      return dealerConfig
    }

    // 🔧 OTIMIZADO: Debounce mais conservador para evitar sobrecarga
    const now = Date.now()
    const timeSinceLastReload = now - lastReloadRef.current
    
    // 🔧 NOVO: Verificar se é uma atualização MSRP crítica
    const isMSRPUpdate = checkMSRPUpdateRecent()
    
    // 🔧 MELHORADO: Debounce mais inteligente
    if (!isMSRPUpdate && timeSinceLastReload < 1000) {
      console.log("⏱️ DealerPricingSync: Muito recente para reload, aguardando...")
      return dealerConfig
    }

    try {
      loadingRef.current = true
      lastReloadRef.current = now
      syncManager.setLoading(true)
      syncManager.setError(null)

      console.log(`🔄 DealerPricingSync: Iniciando reload para dealer ${dealerId}${isMSRPUpdate ? ' (MSRP UPDATE)' : ''}`)

      // 🔧 OTIMIZADO: Cache busting mais conservador
      const timestamp = Date.now()
      const uniqueId = Math.random().toString(36).substr(2, 6) // Reduzido
      
      // 🔧 CONSERVADOR: Apenas limpeza de cache para MSRP updates críticos
      if (isMSRPUpdate && 'caches' in window) {
        try {
          const cacheNames = await caches.keys()
          const relevantCaches = cacheNames.filter(name => 
            name.includes('dealer-config') || name.includes('pricing')
          )
          if (relevantCaches.length > 0) {
            await Promise.all(relevantCaches.map(name => caches.delete(name)))
            console.log(`🧹 DealerPricingSync: ${relevantCaches.length} caches relevantes limpos`)
          }
        } catch (error) {
          console.warn("⚠️ Erro ao limpar caches:", error)
        }
      }
      
      // 🔧 CONSERVADOR: Parâmetros de cache busting mais simples
      const queryParams = new URLSearchParams({
        dealer_id: dealerId,
        refresh: 'true',
        t: timestamp.toString(),
        cb: uniqueId,
        ...(isMSRPUpdate && { msrp_update: 'true', force: 'true' })
      })
      
      const url = `/api/get-dealer-config?${queryParams.toString()}`
      
      console.log(`🔄 DealerPricingSync: Request: ${url}`)
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          // 🔧 CONSERVADOR: Headers essenciais apenas
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'X-Requested-With': 'XMLHttpRequest',
          'X-Cache-Buster': uniqueId,
          'X-Timestamp': timestamp.toString(),
          ...(isMSRPUpdate && { 'X-MSRP-Update': 'true' })
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      if (result.success) {
        if (componentMountedRef.current) {
          const previousCount = dealerConfig?.dealerPricingCount || 0
          const newCount = result.data.dealerPricingCount || 0
          
          setDealerConfig(result.data)
          console.log("✅ DealerPricingSync: Dados sincronizados com sucesso!")
          console.log(`  - Preços MSRP: ${previousCount} → ${newCount}`)
          
          // 🔧 CONSERVADOR: Evento adicional apenas para MSRP updates importantes
          if (isMSRPUpdate && newCount !== previousCount) {
            const freshEvent = new CustomEvent('msrpDataUpdated', {
              detail: {
                dealerId,
                timestamp: now,
                pricingCount: newCount
              }
            })
            window.dispatchEvent(freshEvent)
            console.log("📡 DealerPricingSync: Evento MSRP update disparado")
          }
        }
        return result.data
      } else {
        throw new Error(result.error || 'Failed to load dealer config')
      }
    } catch (error) {
      console.error("❌ DealerPricingSync: Erro ao recarregar configurações:", error)
      if (componentMountedRef.current) {
        syncManager.setError(error instanceof Error ? error.message : 'Unknown error')
      }
      return null
    } finally {
      loadingRef.current = false
      if (componentMountedRef.current) {
        syncManager.setLoading(false)
      }
    }
  }, [syncManager])

// 🔧 NOVO: Função para verificar se há atualizações MSRP recentes
function checkMSRPUpdateRecent(): boolean {
  if (typeof window === 'undefined') return false
  
  try {
    const lastUpdate = localStorage.getItem('lastSalesPriceUpdate')
    if (!lastUpdate) return false
    
    const updateData = JSON.parse(lastUpdate)
    const timeDiff = Date.now() - updateData.timestamp
    
    // 🔧 OTIMIZADO: Considerar recente apenas se foi nos últimos 5 segundos (mais conservador)
    const isRecent = timeDiff < 5000
    if (isRecent) {
      console.log(`🔄 MSRP update recente detectado: ${Math.round(timeDiff/1000)}s atrás`)
    }
    return isRecent
  } catch (error) {
    return false
  }
}

  // Função para notificar uma atualização de preços
  const notifyPricingUpdate = useCallback((dealerId?: string) => {
    let currentDealerId = dealerId
    if (!currentDealerId && typeof window !== 'undefined' && window.localStorage) {
      currentDealerId = localStorage.getItem("currentDealerId") || undefined
    }
    if (currentDealerId) {
      console.log("🔄 Notificando atualização de preços para dealer:", currentDealerId)
      syncManager.notifyPricingUpdate(currentDealerId)
    } else {
      console.warn("⚠️ Não foi possível notificar atualização: dealer ID não encontrado")
    }
  }, [syncManager])

  // Escutar mudanças no sync manager
  useEffect(() => {
    console.log("🎯 DealerPricingSync: Configurando listener do sync manager")
    const unsubscribe = syncManager.subscribe(() => {
      if (componentMountedRef.current) {
        setSyncState(syncManager.getState())
      }
    })
    return unsubscribe
  }, [syncManager])

  // Escutar eventos de sincronização
  useEffect(() => {
    console.log("🎯 DealerPricingSync: Configurando event listeners")
    let isMounted = true
    componentMountedRef.current = true

    const handleSyncUpdate = () => {
      if (!isMounted || !componentMountedRef.current) {
        console.log("🚫 handleSyncUpdate: Componente desmontado, ignorando")
        return
      }
      console.log("🔄 DealerPricingSync: Recebida notificação de atualização (via subscribe)")
      reloadDealerConfig()
    }

    // Escutar nosso próprio evento customizado
    const handleCustomEvent = (event: CustomEvent) => {
      if (!isMounted || !componentMountedRef.current) {
        console.log("🚫 handleCustomEvent: Componente desmontado, ignorando")
        return
      }
      console.log("🔄 DealerPricingSync: Evento customizado recebido", event.detail)
      console.log("  - Tipo de evento:", event.type)
      console.log("  - Dealer ID:", event.detail.dealerId)
      console.log("  - Timestamp:", event.detail.timestamp)
      reloadDealerConfig(event.detail.dealerId)
    }
    
    // Event listener específico para reload de configurações (filtros por país)
    const handleDealerConfigReload = (event: CustomEvent) => {
      if (!isMounted || !componentMountedRef.current) {
        console.log("🚫 handleDealerConfigReload: Componente desmontado, ignorando")
        return
      }
      console.log("🔄 DealerPricingSync: Evento de reload de configuração recebido", event.detail)
      console.log("  - Reason:", event.detail.reason)
      console.log("  - Timestamp:", event.detail.timestamp)
      reloadDealerConfig()
    }

    // Escutar mudanças no localStorage (sincronização entre abas)
    const handleStorageChange = (event: StorageEvent) => {
      if (!isMounted || !componentMountedRef.current) {
        console.log("🚫 handleStorageChange: Componente desmontado, ignorando")
        return
      }
      console.log("🔄 DealerPricingSync: StorageEvent recebido")
      console.log("  - Key:", event.key)
      console.log("  - OldValue:", event.oldValue)
      console.log("  - NewValue:", event.newValue)
      console.log("  - URL:", event.url)
      
      if (event.key === 'dealerPricingLastUpdate') {
        console.log("🔄 DealerPricingSync: Mudança detectada no localStorage (de outra aba)")
        let dealerId: string | undefined
        if (typeof window !== 'undefined' && window.localStorage) {
          dealerId = localStorage.getItem('dealerPricingUpdatedBy') || undefined
        }
        if (dealerId) {
          console.log("  - Dealer ID encontrado:", dealerId)
          reloadDealerConfig(dealerId)
        } else {
          console.warn("  - ⚠️ Dealer ID não encontrado no localStorage")
        }
      }
    }

    // Escutar evento de invalidação forçada de cache
    const handleForceCacheInvalidation = (event: CustomEvent) => {
      if (!isMounted || !componentMountedRef.current) {
        console.log("🚫 handleForceCacheInvalidation: Componente desmontado, ignorando")
        return
      }
      console.log("🧹 DealerPricingSync: Invalidação forçada de cache, recarregando configuração")
      console.log("  - Reason:", event.detail.reason)
      reloadDealerConfig()
    }

    const unsubscribe = syncManager.subscribe(handleSyncUpdate)
    
    // Adicionar event listeners
    window.addEventListener('dealerPricingUpdate', handleCustomEvent as EventListener)
    window.addEventListener('dealerConfigReload', handleDealerConfigReload as EventListener)
    window.addEventListener('forceCacheInvalidation', handleForceCacheInvalidation as EventListener)
    window.addEventListener('storage', handleStorageChange)
    
    console.log("✅ Event listeners configurados:")
    console.log("  - Sync manager subscription: ✅")
    console.log("  - Custom event listener: ✅")
    console.log("  - Dealer config reload listener: ✅")
    console.log("  - Storage event listener: ✅")

    return () => {
      console.log("🧹 DealerPricingSync: Removendo event listeners")
      isMounted = false
      componentMountedRef.current = false
      unsubscribe()
      window.removeEventListener('dealerPricingUpdate', handleCustomEvent as EventListener)
      window.removeEventListener('dealerConfigReload', handleDealerConfigReload as EventListener)
      window.removeEventListener('forceCacheInvalidation', handleForceCacheInvalidation as EventListener)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [reloadDealerConfig, syncManager])

  // Cleanup quando o componente é desmontado
  useEffect(() => {
    return () => {
      console.log("🧹 DealerPricingSync: Componente sendo desmontado")
      componentMountedRef.current = false
      loadingRef.current = false
    }
  }, [])

  // Setup Supabase real-time sync
  const [currentDealerId, setCurrentDealerId] = useState<string>("")
  
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const dealerId = localStorage.getItem("currentDealerId") || ""
      setCurrentDealerId(dealerId)
    }
  }, [])
  
  useDealerRealtimeSync(currentDealerId, () => {
    console.log("📡 DealerPricingSync: Real-time update detected via Supabase")
    if (componentMountedRef.current && !loadingRef.current) {
      reloadDealerConfig(currentDealerId)
    }
  })

  return {
    syncState,
    dealerConfig,
    reloadDealerConfig,
    notifyPricingUpdate,
    isLoading: syncState.isLoading,
    error: syncState.error,
    lastUpdate: syncState.lastUpdate
  }
}

export default useDealerPricingSync