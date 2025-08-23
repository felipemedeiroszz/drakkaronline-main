import { useState, useEffect, useCallback, useRef } from 'react'

interface BoatModel {
  id?: number
  name: string
  name_pt: string
  usd: number
  brl: number
}

interface SyncState {
  lastUpdate: number
  isLoading: boolean
  error: string | null
}

// Sistema de eventos para sincronização de boat models entre páginas
class BoatModelsSyncManager {
  private static instance: BoatModelsSyncManager
  private listeners: Set<() => void> = new Set()
  private state: SyncState = {
    lastUpdate: Date.now(),
    isLoading: false,
    error: null
  }
  private debounceTimer: NodeJS.Timeout | null = null

  static getInstance(): BoatModelsSyncManager {
    if (!this.instance) {
      this.instance = new BoatModelsSyncManager()
    }
    return this.instance
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    console.log(`🚢 BoatModelsSyncManager: Novo listener adicionado. Total: ${this.listeners.size}`)
    return () => {
      this.listeners.delete(listener)
      console.log(`🚢 BoatModelsSyncManager: Listener removido. Total: ${this.listeners.size}`)
    }
  }

  notifyBoatModelsUpdate(): void {
    console.log('🚢 BoatModelsSyncManager.notifyBoatModelsUpdate chamado')
    console.log('  - Listeners ativos:', this.listeners.size)
    
    // Prevenir múltiplas notificações rápidas com debounce
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
      console.log('  - Debounce timer resetado')
    }

    this.debounceTimer = setTimeout(() => {
      console.log('  - Executando notificação após debounce (300ms)')
      this.state.lastUpdate = Date.now()
      
      // Salvar no localStorage para sincronização entre abas
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem('boatModelsLastUpdate', this.state.lastUpdate.toString())
          console.log('  - LocalStorage atualizado:', {
            lastUpdate: this.state.lastUpdate
          })
        }
      } catch (error) {
        console.error('❌ Erro ao atualizar localStorage:', error)
      }
      
      // Notificar todos os listeners
      console.log(`  - Notificando ${this.listeners.size} listeners internos`)
      this.listeners.forEach((listener, index) => {
        try {
          console.log(`    - Executando listener ${index + 1}/${this.listeners.size}`)
          listener()
        } catch (error) {
          console.error(`❌ Erro ao executar listener ${index + 1}:`, error)
        }
      })
      
      // Disparar evento customizado para sincronização entre abas do navegador
      try {
        const customEvent = new CustomEvent('boatModelsUpdate', {
          detail: { timestamp: this.state.lastUpdate }
        })
        window.dispatchEvent(customEvent)
        console.log('  - Evento customizado disparado com sucesso:', customEvent.detail)
      } catch (error) {
        console.error('❌ Erro ao disparar evento customizado:', error)
      }
      
      console.log('✅ Notificação de boat models completa!')
    }, 300) // Debounce de 300ms
  }

  getState(): SyncState {
    return { ...this.state }
  }

  setLoading(loading: boolean): void {
    console.log(`🚢 BoatModelsSyncManager: Setting loading = ${loading}`)
    this.state.isLoading = loading
    this.listeners.forEach((listener, index) => {
      try {
        listener()
      } catch (error) {
        console.error(`❌ Erro ao executar listener ${index + 1} (setLoading):`, error)
      }
    })
  }

  setError(error: string | null): void {
    console.log(`❌ BoatModelsSyncManager: Setting error = ${error}`)
    this.state.error = error
    this.listeners.forEach((listener, index) => {
      try {
        listener()
      } catch (error) {
        console.error(`❌ Erro ao executar listener ${index + 1} (setError):`, error)
      }
    })
  }

  cleanup(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = null
    }
    this.listeners.clear()
    console.log('🧹 BoatModelsSyncManager: Cleanup realizado')
  }
}

export function useBoatModelsSync() {
  const [syncState, setSyncState] = useState<SyncState>(() => 
    BoatModelsSyncManager.getInstance().getState()
  )
  const [boatModels, setBoatModels] = useState<BoatModel[]>([])
  const loadingRef = useRef(false)
  const lastReloadRef = useRef(0)
  const componentMountedRef = useRef(true)

  const syncManager = BoatModelsSyncManager.getInstance()

  // Função para recarregar boat models com debounce
  const reloadBoatModels = useCallback(async () => {
    if (!componentMountedRef.current) {
      console.log("🚫 BoatModelsSync: Componente desmontado, ignorando reload")
      return []
    }

    // Prevenir múltiplas chamadas simultâneas
    if (loadingRef.current) {
      console.log("⏳ BoatModelsSync: Já está carregando, ignorando nova chamada")
      return boatModels
    }

    // Debounce - só recarrega se passou tempo suficiente desde a última chamada
    const now = Date.now()
    if (now - lastReloadRef.current < 1000) { // 1 segundo de debounce
      console.log("⏱️ BoatModelsSync: Muito recente, ignorando reload")
      return boatModels
    }

    try {
      loadingRef.current = true
      lastReloadRef.current = now
      syncManager.setLoading(true)
      syncManager.setError(null)

      console.log(`🚢 BoatModelsSync: Iniciando reload de modelos de barco`)

      const response = await fetch(`/api/get-admin-data?refresh=true&force=true&t=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
      
      const result = await response.json()
      
      if (result.success && result.data) {
        const models = result.data.boatModels || []
        if (componentMountedRef.current) {
          setBoatModels(models)
          console.log(`✅ BoatModelsSync: ${models.length} modelos de barco sincronizados`)
        }
        return models
      } else {
        throw new Error(result.error || 'Failed to load boat models')
      }
    } catch (error) {
      console.error("❌ BoatModelsSync: Erro ao recarregar modelos:", error)
      if (componentMountedRef.current) {
        syncManager.setError(error instanceof Error ? error.message : 'Unknown error')
      }
      return []
    } finally {
      loadingRef.current = false
      if (componentMountedRef.current) {
        syncManager.setLoading(false)
      }
    }
  }, [syncManager, boatModels])

  // Função para notificar uma atualização de boat models
  const notifyBoatModelsUpdate = useCallback(() => {
    console.log("🚢 Notificando atualização de modelos de barco")
    syncManager.notifyBoatModelsUpdate()
  }, [syncManager])

  // Escutar mudanças no sync manager
  useEffect(() => {
    console.log("🎯 BoatModelsSync: Configurando listener do sync manager")
    const unsubscribe = syncManager.subscribe(() => {
      if (componentMountedRef.current) {
        setSyncState(syncManager.getState())
      }
    })
    return unsubscribe
  }, [syncManager])

  // Escutar eventos de sincronização
  useEffect(() => {
    console.log("🎯 BoatModelsSync: Configurando event listeners")
    let isMounted = true
    componentMountedRef.current = true

    // Carregar dados iniciais
    reloadBoatModels()

    const handleSyncUpdate = () => {
      if (!isMounted || !componentMountedRef.current) {
        console.log("🚫 handleSyncUpdate: Componente desmontado, ignorando")
        return
      }
      console.log("🚢 BoatModelsSync: Recebida notificação de atualização (via subscribe)")
      reloadBoatModels()
    }

    // Escutar nosso próprio evento customizado
    const handleCustomEvent = (event: CustomEvent) => {
      if (!isMounted || !componentMountedRef.current) {
        console.log("🚫 handleCustomEvent: Componente desmontado, ignorando")
        return
      }
      console.log("🚢 BoatModelsSync: Evento customizado recebido", event.detail)
      reloadBoatModels()
    }

    // Escutar mudanças no localStorage (sincronização entre abas)
    const handleStorageChange = (event: StorageEvent) => {
      if (!isMounted || !componentMountedRef.current) {
        console.log("🚫 handleStorageChange: Componente desmontado, ignorando")
        return
      }
      
      if (event.key === 'boatModelsLastUpdate') {
        console.log("🚢 BoatModelsSync: Mudança detectada no localStorage (de outra aba)")
        reloadBoatModels()
      }
    }

    // Escutar também o evento geral de admin data (para compatibilidade)
    const handleAdminDataUpdate = (event: CustomEvent) => {
      if (!isMounted || !componentMountedRef.current) {
        console.log("🚫 handleAdminDataUpdate: Componente desmontado, ignorando")
        return
      }
      console.log("🚢 BoatModelsSync: Evento adminDataUpdate recebido", event.detail)
      reloadBoatModels()
    }

    // Escutar evento de invalidação forçada de cache
    const handleForceCacheInvalidation = (event: CustomEvent) => {
      if (!isMounted || !componentMountedRef.current) {
        console.log("🚫 handleForceCacheInvalidation: Componente desmontado, ignorando")
        return
      }
      console.log("🧹 BoatModelsSync: Invalidação forçada de cache, recarregando modelos")
      console.log("  - Reason:", event.detail.reason)
      reloadBoatModels()
    }

    const unsubscribe = syncManager.subscribe(handleSyncUpdate)
    
    // Adicionar event listeners
    window.addEventListener('boatModelsUpdate', handleCustomEvent as EventListener)
    window.addEventListener('adminDataUpdate', handleAdminDataUpdate as EventListener)
    window.addEventListener('forceCacheInvalidation', handleForceCacheInvalidation as EventListener)
    window.addEventListener('storage', handleStorageChange)
    
    console.log("✅ Event listeners configurados:")
    console.log("  - Sync manager subscription: ✅")
    console.log("  - Custom event listener (boatModelsUpdate): ✅")
    console.log("  - Custom event listener (adminDataUpdate): ✅")
    console.log("  - Storage event listener: ✅")

    return () => {
      console.log("🧹 BoatModelsSync: Removendo event listeners")
      isMounted = false
      componentMountedRef.current = false
      unsubscribe()
      window.removeEventListener('boatModelsUpdate', handleCustomEvent as EventListener)
      window.removeEventListener('adminDataUpdate', handleAdminDataUpdate as EventListener)
      window.removeEventListener('forceCacheInvalidation', handleForceCacheInvalidation as EventListener)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [reloadBoatModels, syncManager])

  // Cleanup quando o componente é desmontado
  useEffect(() => {
    return () => {
      console.log("🧹 BoatModelsSync: Componente sendo desmontado")
      componentMountedRef.current = false
      loadingRef.current = false
    }
  }, [])

  return {
    syncState,
    boatModels,
    reloadBoatModels,
    notifyBoatModelsUpdate,
    isLoading: syncState.isLoading,
    error: syncState.error,
    lastUpdate: syncState.lastUpdate
  }
}

export default useBoatModelsSync