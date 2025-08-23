import { useState, useEffect, useCallback, useRef } from 'react'
import { useAdminRealtimeSync } from './use-realtime-sync'

interface AdminData {
  enginePackages: any[]
  hullColors: any[]
  upholsteryPackages: any[]
  additionalOptions: any[]
  boatModels: any[]
  dealers: any[]
  orders: any[]
  serviceRequests: any[]
  marketingContent: any[]
  marketingManuals: any[]
  marketingWarranties: any[]
  factoryProduction: any[]
}

interface SyncState {
  lastUpdate: number
  isLoading: boolean
  error: string | null
}

// Sistema de eventos para sincronização entre páginas
class AdminDataSyncManager {
  private static instance: AdminDataSyncManager
  private listeners: Set<() => void> = new Set()
  private state: SyncState = {
    lastUpdate: Date.now(),
    isLoading: false,
    error: null
  }
  private debounceTimer: NodeJS.Timeout | null = null

  static getInstance(): AdminDataSyncManager {
    if (!this.instance) {
      this.instance = new AdminDataSyncManager()
    }
    return this.instance
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    console.log(`🔔 AdminDataSyncManager: Novo listener adicionado. Total: ${this.listeners.size}`)
    return () => {
      this.listeners.delete(listener)
      console.log(`🔔 AdminDataSyncManager: Listener removido. Total: ${this.listeners.size}`)
    }
  }

  notifyDataUpdate(): void {
    console.log('🔔 AdminDataSyncManager.notifyDataUpdate chamado')
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
        localStorage.setItem('adminDataLastUpdate', this.state.lastUpdate.toString())
        console.log('  - LocalStorage atualizado:', {
          lastUpdate: this.state.lastUpdate
        })
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
        const customEvent = new CustomEvent('adminDataUpdate', {
          detail: { timestamp: this.state.lastUpdate }
        })
        window.dispatchEvent(customEvent)
        console.log('  - Evento customizado disparado com sucesso:', customEvent.detail)
      } catch (error) {
        console.error('❌ Erro ao disparar evento customizado:', error)
      }
      
      console.log('✅ Notificação completa!')
    }, 300) // Debounce de 300ms
  }

  getState(): SyncState {
    return { ...this.state }
  }

  setLoading(loading: boolean): void {
    console.log(`🔄 AdminDataSyncManager: Setting loading = ${loading}`)
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
    console.log(`❌ AdminDataSyncManager: Setting error = ${error}`)
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
    console.log('🧹 AdminDataSyncManager: Cleanup realizado')
  }
}

export function useAdminDataSync() {
  const [syncState, setSyncState] = useState<SyncState>(() => 
    AdminDataSyncManager.getInstance().getState()
  )
  const [adminData, setAdminData] = useState<AdminData | null>(null)
  const loadingRef = useRef(false)
  const lastReloadRef = useRef(0)
  const componentMountedRef = useRef(true)

  const syncManager = AdminDataSyncManager.getInstance()

  // Função para recarregar dados administrativos com debounce
  const reloadAdminData = useCallback(async () => {
    if (!componentMountedRef.current) {
      console.log("🚫 AdminDataSync: Componente desmontado, ignorando reload")
      return null
    }

    // Prevenir múltiplas chamadas simultâneas
    if (loadingRef.current) {
      console.log("⏳ AdminDataSync: Já está carregando, ignorando nova chamada")
      return adminData
    }

    // Debounce - só recarrega se passou tempo suficiente desde a última chamada
    const now = Date.now()
    if (now - lastReloadRef.current < 1000) { // 1 segundo de debounce
      console.log("⏱️ AdminDataSync: Muito recente, ignorando reload")
      return adminData
    }

    try {
      loadingRef.current = true
      lastReloadRef.current = now
      syncManager.setLoading(true)
      syncManager.setError(null)

      console.log(`🔄 AdminDataSync: Iniciando reload de dados administrativos`)

      const response = await fetch(`/api/get-admin-data?refresh=true&force=true&t=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
      
      // Check if data was recently updated based on response headers
      const dataUpdated = response.headers.get('X-Data-Updated')
      if (dataUpdated) {
        console.log(`📡 Dados foram atualizados em: ${new Date(parseInt(dataUpdated)).toLocaleString()}`)
      }
      
      const result = await response.json()
      
      if (result.success) {
        if (componentMountedRef.current) {
          setAdminData(result.data)
          console.log("✅ AdminDataSync: Dados administrativos sincronizados")
        }
        return result.data
      } else {
        throw new Error(result.error || 'Failed to load admin data')
      }
    } catch (error) {
      console.error("❌ AdminDataSync: Erro ao recarregar dados:", error)
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
  }, [syncManager, adminData])

  // Função para notificar uma atualização de dados
  const notifyDataUpdate = useCallback(() => {
    console.log("🔄 Notificando atualização de dados administrativos")
    syncManager.notifyDataUpdate()
  }, [syncManager])

  // Escutar mudanças no sync manager
  useEffect(() => {
    console.log("🎯 AdminDataSync: Configurando listener do sync manager")
    const unsubscribe = syncManager.subscribe(() => {
      if (componentMountedRef.current) {
        setSyncState(syncManager.getState())
      }
    })
    return unsubscribe
  }, [syncManager])

  // Escutar eventos de sincronização
  useEffect(() => {
    console.log("🎯 AdminDataSync: Configurando event listeners")
    let isMounted = true
    componentMountedRef.current = true

    const handleSyncUpdate = () => {
      if (!isMounted || !componentMountedRef.current) {
        console.log("🚫 handleSyncUpdate: Componente desmontado, ignorando")
        return
      }
      console.log("🔄 AdminDataSync: Recebida notificação de atualização (via subscribe)")
      reloadAdminData()
    }

    // Escutar nosso próprio evento customizado
    const handleCustomEvent = (event: CustomEvent) => {
      if (!isMounted || !componentMountedRef.current) {
        console.log("🚫 handleCustomEvent: Componente desmontado, ignorando")
        return
      }
      console.log("🔄 AdminDataSync: Evento customizado recebido", event.detail)
      reloadAdminData()
    }

    // Escutar mudanças no localStorage (sincronização entre abas)
    const handleStorageChange = (event: StorageEvent) => {
      if (!isMounted || !componentMountedRef.current) {
        console.log("🚫 handleStorageChange: Componente desmontado, ignorando")
        return
      }
      
      if (event.key === 'adminDataLastUpdate') {
        console.log("🔄 AdminDataSync: Mudança detectada no localStorage (de outra aba)")
        reloadAdminData()
      }
    }

    const unsubscribe = syncManager.subscribe(handleSyncUpdate)
    
    // Adicionar event listeners
    window.addEventListener('adminDataUpdate', handleCustomEvent as EventListener)
    window.addEventListener('storage', handleStorageChange)
    
    console.log("✅ Event listeners configurados:")
    console.log("  - Sync manager subscription: ✅")
    console.log("  - Custom event listener: ✅")
    console.log("  - Storage event listener: ✅")

    return () => {
      console.log("🧹 AdminDataSync: Removendo event listeners")
      isMounted = false
      componentMountedRef.current = false
      unsubscribe()
      window.removeEventListener('adminDataUpdate', handleCustomEvent as EventListener)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [reloadAdminData, syncManager])

  // Cleanup quando o componente é desmontado
  useEffect(() => {
    return () => {
      console.log("🧹 AdminDataSync: Componente sendo desmontado")
      componentMountedRef.current = false
      loadingRef.current = false
    }
  }, [])

  // Setup Supabase real-time sync
  useAdminRealtimeSync(() => {
    console.log("📡 AdminDataSync: Real-time update detected via Supabase")
    if (componentMountedRef.current && !loadingRef.current) {
      reloadAdminData()
    }
  })

  return {
    syncState,
    adminData,
    reloadAdminData,
    notifyDataUpdate,
    isLoading: syncState.isLoading,
    error: syncState.error,
    lastUpdate: syncState.lastUpdate
  }
}

export default useAdminDataSync