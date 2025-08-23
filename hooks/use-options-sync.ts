import { useState, useEffect, useCallback, useRef } from 'react'

interface EnginePackage {
  id: number
  name: string
  name_pt: string
  usd: number
  brl: number
  compatible_models?: string[]
  countries?: string[]
  display_order?: number
}

interface HullColor {
  id: number
  name: string
  name_pt: string
  usd: number
  brl: number
  compatible_models?: string[]
  display_order?: number
}

interface UpholsteryPackage {
  id: number
  name: string
  name_pt: string
  usd: number
  brl: number
  compatible_models?: string[]
  display_order?: number
}

interface AdditionalOption {
  id: number
  name: string
  name_pt: string
  usd: number
  brl: number
  compatible_models?: string[]
  countries?: string[]
  category?: string
  display_order?: number
}

interface OptionsData {
  enginePackages: EnginePackage[]
  hullColors: HullColor[]
  upholsteryPackages: UpholsteryPackage[]
  additionalOptions: AdditionalOption[]
}

interface SyncState {
  lastUpdate: number
  isLoading: boolean
  error: string | null
}

// Sistema de eventos para sincronização entre páginas
class OptionsSyncManager {
  private static instance: OptionsSyncManager
  private listeners: Set<() => void> = new Set()
  private state: SyncState = {
    lastUpdate: Date.now(),
    isLoading: false,
    error: null
  }
  private debounceTimer: NodeJS.Timeout | null = null

  static getInstance(): OptionsSyncManager {
    if (!this.instance) {
      this.instance = new OptionsSyncManager()
    }
    return this.instance
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    console.log(`🔔 OptionsSyncManager: Novo listener adicionado. Total: ${this.listeners.size}`)
    return () => {
      this.listeners.delete(listener)
      console.log(`🔔 OptionsSyncManager: Listener removido. Total: ${this.listeners.size}`)
    }
  }

  notifyOptionsUpdate(): void {
    console.log('🔔 OptionsSyncManager.notifyOptionsUpdate chamado')
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
          localStorage.setItem('optionsDataLastUpdate', this.state.lastUpdate.toString())
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
        const customEvent = new CustomEvent('optionsDataUpdate', {
          detail: { timestamp: this.state.lastUpdate }
        })
        window.dispatchEvent(customEvent)
        console.log('  - Evento customizado disparado com sucesso:', customEvent.detail)
      } catch (error) {
        console.error('❌ Erro ao disparar evento customizado:', error)
      }
      
      // Forçar detecção de storage mesmo na mesma aba (fallback)
      try {
        const storageEvent = new StorageEvent('storage', {
          key: 'optionsDataLastUpdate',
          newValue: this.state.lastUpdate.toString(),
          oldValue: '',
          url: window.location.href
        })
        setTimeout(() => {
          console.log('  - Disparando storage event como fallback...')
          window.dispatchEvent(storageEvent)
        }, 100)
      } catch (error) {
        console.error('❌ Erro ao disparar storage event fallback:', error)
      }
      
      console.log('✅ Notificação completa!')
    }, 300) // Debounce de 300ms
  }

  getState(): SyncState {
    return { ...this.state }
  }

  setLoading(loading: boolean): void {
    console.log(`🔄 OptionsSyncManager: Setting loading = ${loading}`)
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
    console.log(`❌ OptionsSyncManager: Setting error = ${error}`)
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
    console.log('🧹 OptionsSyncManager: Cleanup realizado')
  }
}

export function useOptionsSync() {
  const [syncState, setSyncState] = useState<SyncState>(() => 
    OptionsSyncManager.getInstance().getState()
  )
  const [optionsData, setOptionsData] = useState<OptionsData | null>(null)
  const loadingRef = useRef(false)
  const lastReloadRef = useRef(0)
  const componentMountedRef = useRef(true)

  const syncManager = OptionsSyncManager.getInstance()

  // Função para recarregar opções com debounce
  const reloadOptions = useCallback(async () => {
    if (!componentMountedRef.current) {
      console.log("🚫 OptionsSync: Componente desmontado, ignorando reload")
      return null
    }

    // Prevenir múltiplas chamadas simultâneas
    if (loadingRef.current) {
      console.log("⏳ OptionsSync: Já está carregando, ignorando nova chamada")
      return optionsData
    }

    // Debounce - só recarrega se passou tempo suficiente desde a última chamada
    const now = Date.now()
    if (now - lastReloadRef.current < 1000) { // 1 segundo de debounce
      console.log("⏱️ OptionsSync: Muito recente, ignorando reload")
      return optionsData
    }

    try {
      loadingRef.current = true
      lastReloadRef.current = now
      syncManager.setLoading(true)
      syncManager.setError(null)

      console.log(`🔄 OptionsSync: Iniciando reload de opções`)

      // Buscar dados atualizados do admin-data endpoint com force refresh
      const response = await fetch(`/api/get-admin-data?refresh=true&force=true&t=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
      
      const result = await response.json()
      
      if (result.success && result.data) {
        if (componentMountedRef.current) {
          const newOptionsData: OptionsData = {
            enginePackages: result.data.enginePackages || [],
            hullColors: result.data.hullColors || [],
            upholsteryPackages: result.data.upholsteryPackages || [],
            additionalOptions: result.data.additionalOptions || []
          }
          setOptionsData(newOptionsData)
          console.log("✅ OptionsSync: Opções sincronizadas", {
            enginePackages: newOptionsData.enginePackages.length,
            hullColors: newOptionsData.hullColors.length,
            upholsteryPackages: newOptionsData.upholsteryPackages.length,
            additionalOptions: newOptionsData.additionalOptions.length
          })
        }
        return result.data
      } else {
        throw new Error(result.error || 'Failed to load options data')
      }
    } catch (error) {
      console.error("❌ OptionsSync: Erro ao recarregar opções:", error)
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
  }, [syncManager, optionsData])

  // Função para notificar uma atualização de opções
  const notifyOptionsUpdate = useCallback(() => {
    console.log("🔄 Notificando atualização de opções (Engine Packages, Hull Colors, Upholstery, Additional Options)")
    syncManager.notifyOptionsUpdate()
  }, [syncManager])

  // Escutar mudanças no sync manager
  useEffect(() => {
    console.log("🎯 OptionsSync: Configurando listener do sync manager")
    const unsubscribe = syncManager.subscribe(() => {
      if (componentMountedRef.current) {
        setSyncState(syncManager.getState())
      }
    })
    return unsubscribe
  }, [syncManager])

  // Escutar eventos de sincronização
  useEffect(() => {
    console.log("🎯 OptionsSync: Configurando event listeners")
    let isMounted = true
    componentMountedRef.current = true

    const handleSyncUpdate = () => {
      if (!isMounted || !componentMountedRef.current) {
        console.log("🚫 handleSyncUpdate: Componente desmontado, ignorando")
        return
      }
      console.log("🔄 OptionsSync: Recebida notificação de atualização (via subscribe)")
      reloadOptions()
    }

    // Escutar nosso próprio evento customizado
    const handleCustomEvent = (event: CustomEvent) => {
      if (!isMounted || !componentMountedRef.current) {
        console.log("🚫 handleCustomEvent: Componente desmontado, ignorando")
        return
      }
      console.log("🔄 OptionsSync: Evento customizado recebido", event.detail)
      reloadOptions()
    }

    // Escutar mudanças no localStorage (sincronização entre abas)
    const handleStorageChange = (event: StorageEvent) => {
      if (!isMounted || !componentMountedRef.current) {
        console.log("🚫 handleStorageChange: Componente desmontado, ignorando")
        return
      }
      
      if (event.key === 'optionsDataLastUpdate') {
        console.log("🔄 OptionsSync: Mudança detectada no localStorage (de outra aba)")
        reloadOptions()
      }
    }

    // Escutar também o evento adminDataUpdate para sincronizar quando admin salva dados
    const handleAdminDataUpdate = (event: CustomEvent) => {
      if (!isMounted || !componentMountedRef.current) {
        console.log("🚫 handleAdminDataUpdate: Componente desmontado, ignorando")
        return
      }
      console.log("🔄 OptionsSync: Dados administrativos atualizados, recarregando opções")
      reloadOptions()
    }

    // Escutar evento de invalidação forçada de cache
    const handleForceCacheInvalidation = (event: CustomEvent) => {
      if (!isMounted || !componentMountedRef.current) {
        console.log("🚫 handleForceCacheInvalidation: Componente desmontado, ignorando")
        return
      }
      console.log("🧹 OptionsSync: Invalidação forçada de cache, recarregando opções")
      console.log("  - Reason:", event.detail.reason)
      reloadOptions()
    }

    const unsubscribe = syncManager.subscribe(handleSyncUpdate)
    
    // Adicionar event listeners
    window.addEventListener('optionsDataUpdate', handleCustomEvent as EventListener)
    window.addEventListener('adminDataUpdate', handleAdminDataUpdate as EventListener)
    window.addEventListener('forceCacheInvalidation', handleForceCacheInvalidation as EventListener)
    window.addEventListener('storage', handleStorageChange)
    
    console.log("✅ Event listeners configurados:")
    console.log("  - Sync manager subscription: ✅")
    console.log("  - Custom event listener: ✅")
    console.log("  - Admin data event listener: ✅")
    console.log("  - Storage event listener: ✅")

    // Carregar dados iniciais
    reloadOptions()

    return () => {
      console.log("🧹 OptionsSync: Removendo event listeners")
      isMounted = false
      componentMountedRef.current = false
      unsubscribe()
      window.removeEventListener('optionsDataUpdate', handleCustomEvent as EventListener)
      window.removeEventListener('adminDataUpdate', handleAdminDataUpdate as EventListener)
      window.removeEventListener('forceCacheInvalidation', handleForceCacheInvalidation as EventListener)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [reloadOptions, syncManager])

  // Cleanup quando o componente é desmontado
  useEffect(() => {
    return () => {
      console.log("🧹 OptionsSync: Componente sendo desmontado")
      componentMountedRef.current = false
      loadingRef.current = false
    }
  }, [])

  return {
    syncState,
    optionsData,
    reloadOptions,
    notifyOptionsUpdate,
    isLoading: syncState.isLoading,
    error: syncState.error,
    lastUpdate: syncState.lastUpdate,
    enginePackages: optionsData?.enginePackages || [],
    hullColors: optionsData?.hullColors || [],
    upholsteryPackages: optionsData?.upholsteryPackages || [],
    additionalOptions: optionsData?.additionalOptions || []
  }
}

export default useOptionsSync