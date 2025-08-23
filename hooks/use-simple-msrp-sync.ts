import { useState, useEffect, useCallback, useRef } from 'react'

interface MSRPSyncState {
  isLoading: boolean
  lastUpdate: number
  error: string | null
}

// Sistema simplificado de sincronização MSRP
export function useSimpleMSRPSync() {
  const [syncState, setSyncState] = useState<MSRPSyncState>({
    isLoading: false,
    lastUpdate: Date.now(),
    error: null
  })
  const [dealerConfig, setDealerConfig] = useState<any>(null)
  const loadingRef = useRef(false)
  const lastReloadRef = useRef(0)
  const componentMountedRef = useRef(true)

  // Função simplificada para recarregar configuração
  const reloadDealerConfig = useCallback(async (dealerId?: string) => {
    if (!componentMountedRef.current || loadingRef.current) {
      return null
    }

    if (!dealerId) {
      dealerId = localStorage.getItem("currentDealerId") || undefined
    }
    
    if (!dealerId) {
      console.warn("⚠️ SimpleMSRPSync: No dealer ID available")
      return null
    }

    // Debounce simples - máximo uma chamada por segundo
    const now = Date.now()
    if (now - lastReloadRef.current < 1000) {
      console.log("⏱️ SimpleMSRPSync: Debounce ativo, ignorando reload")
      return dealerConfig
    }

    try {
      loadingRef.current = true
      lastReloadRef.current = now
      setSyncState(prev => ({ ...prev, isLoading: true, error: null }))

      console.log(`🔄 SimpleMSRPSync: Recarregando dados para dealer ${dealerId}`)

      // Parâmetros simples para forçar dados frescos
      const timestamp = Date.now()
      const url = `/api/get-dealer-config?dealer_id=${dealerId}&t=${timestamp}&fresh=true`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'X-Timestamp': timestamp.toString()
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      if (result.success && componentMountedRef.current) {
        const newTimestamp = Date.now()
        setDealerConfig(result.data)
        setSyncState({
          isLoading: false,
          lastUpdate: newTimestamp,
          error: null
        })
        
        console.log("✅ SimpleMSRPSync: Dados atualizados com sucesso")
        console.log(`  - Preços MSRP: ${result.data.dealerPricingCount || 0}`)
        
        return result.data
      } else {
        throw new Error(result.error || 'Failed to load dealer config')
      }
    } catch (error) {
      console.error("❌ SimpleMSRPSync: Erro ao recarregar:", error)
      if (componentMountedRef.current) {
        setSyncState(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }))
      }
      return null
    } finally {
      loadingRef.current = false
    }
  }, [dealerConfig])

  // Sistema simplificado de notificação
  const notifyMSRPUpdate = useCallback((dealerId: string) => {
    console.log("📢 SimpleMSRPSync: Notificando atualização MSRP para:", dealerId)
    
    // 1. Atualizar localStorage
    localStorage.setItem('msrpLastUpdate', Date.now().toString())
    localStorage.setItem('msrpUpdatedBy', dealerId)
    
    // 2. Disparar evento simples
    const event = new CustomEvent('simpleMSRPUpdate', {
      detail: { dealerId, timestamp: Date.now() }
    })
    window.dispatchEvent(event)
    
    console.log("✅ SimpleMSRPSync: Notificação enviada")
  }, [])

  // Listener simplificado
  useEffect(() => {
    if (!componentMountedRef.current) return

    console.log("🎯 SimpleMSRPSync: Configurando listener simplificado")

    const handleMSRPUpdate = (event: CustomEvent) => {
      console.log("📡 SimpleMSRPSync: Evento recebido:", event.detail)
      const { dealerId } = event.detail
      
      if (dealerId && !loadingRef.current) {
        console.log("🔄 SimpleMSRPSync: Executando reload por evento")
        reloadDealerConfig(dealerId)
      }
    }

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'msrpLastUpdate' && event.newValue) {
        console.log("📦 SimpleMSRPSync: Storage change detectado")
        const dealerId = localStorage.getItem('msrpUpdatedBy')
        if (dealerId && !loadingRef.current) {
          console.log("🔄 SimpleMSRPSync: Executando reload por storage")
          reloadDealerConfig(dealerId)
        }
      }
    }

    // Adicionar listeners
    window.addEventListener('simpleMSRPUpdate', handleMSRPUpdate as EventListener)
    window.addEventListener('storage', handleStorageChange)

    console.log("✅ SimpleMSRPSync: Listeners configurados")

    return () => {
      console.log("🧹 SimpleMSRPSync: Removendo listeners")
      window.removeEventListener('simpleMSRPUpdate', handleMSRPUpdate as EventListener)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [reloadDealerConfig])

  // Cleanup
  useEffect(() => {
    componentMountedRef.current = true
    return () => {
      componentMountedRef.current = false
      loadingRef.current = false
    }
  }, [])

  return {
    dealerConfig,
    reloadDealerConfig,
    notifyMSRPUpdate,
    isLoading: syncState.isLoading,
    lastUpdate: syncState.lastUpdate,
    error: syncState.error
  }
}