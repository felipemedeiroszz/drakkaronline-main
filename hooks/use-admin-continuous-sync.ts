import { useEffect, useCallback, useRef } from 'react'

interface SyncEvent {
  timestamp: number
  dataTypes: string[]
  action: string
  immediate?: boolean
}

interface AdminContinuousSyncOptions {
  onUpdate: (event: SyncEvent) => void
  dealerId?: string
  enableHeartbeat?: boolean
  heartbeatInterval?: number
}

/**
 * Hook para garantir sincronização contínua e robusta entre Admin e Dealer
 * Resolve o problema onde eventos de sincronização param de funcionar após o primeiro uso
 */
export function useAdminContinuousSync({
  onUpdate,
  dealerId,
  enableHeartbeat = true,
  heartbeatInterval = 10000
}: AdminContinuousSyncOptions) {
  const lastEventTimestamp = useRef<number>(0)
  const eventBuffer = useRef<SyncEvent[]>([])
  const processingRef = useRef<boolean>(false)
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null)

  // Função para processar eventos de forma sequencial e robusta
  const processEvent = useCallback((event: SyncEvent) => {
    // Prevenir processamento duplicado de eventos
    if (event.timestamp <= lastEventTimestamp.current) {
      console.log('🔄 Sync: Evento duplicado ignorado', event.timestamp)
      return
    }

    // Adicionar ao buffer e processar
    eventBuffer.current.push(event)
    lastEventTimestamp.current = event.timestamp

    // Processar apenas se não estiver já processando
    if (!processingRef.current) {
      processingRef.current = true

      setTimeout(() => {
        try {
          // Processar todos os eventos no buffer
          const events = [...eventBuffer.current]
          eventBuffer.current = []

          if (events.length > 0) {
            console.log(`🔄 Sync: Processando ${events.length} eventos em buffer`)
            
            // Processar o evento mais recente (mais importante)
            const latestEvent = events[events.length - 1]
            onUpdate(latestEvent)
          }
        } catch (error) {
          console.error('❌ Erro ao processar eventos de sincronização:', error)
        } finally {
          processingRef.current = false
        }
      }, 50) // Pequeno delay para agrupar eventos simultâneos
    }
  }, [onUpdate])

  // Escutar eventos específicos do admin
  useEffect(() => {
    console.log('🎯 AdminContinuousSync: Configurando listeners robustos')

    // Listener para atualizações gerais do admin
    const handleAdminUpdate = (event: CustomEvent) => {
      const detail = event.detail || {}
      console.log('📡 AdminSync: Evento admin recebido:', detail)
      
      processEvent({
        timestamp: detail.timestamp || Date.now(),
        dataTypes: detail.dataTypes || [],
        action: detail.action || 'update',
        immediate: detail.immediate || false
      })
    }

    // Listener para atualizações de opções
    const handleOptionsUpdate = (event: CustomEvent) => {
      const detail = event.detail || {}
      console.log('📡 AdminSync: Evento opções recebido:', detail)
      
      processEvent({
        timestamp: detail.timestamp || Date.now(),
        dataTypes: detail.dataType ? [detail.dataType] : [],
        action: detail.action || 'options_update',
        immediate: detail.immediate || false
      })
    }

    // Listener para modelos de barco
    const handleBoatModelsUpdate = (event: CustomEvent) => {
      const detail = event.detail || {}
      console.log('📡 AdminSync: Evento modelos de barco recebido:', detail)
      
      processEvent({
        timestamp: detail.timestamp || Date.now(),
        dataTypes: ['boatModels'],
        action: 'boat_models_update',
        immediate: detail.immediate || false
      })
    }

    // Listener para ping direto do admin
    const handleAdminToSalesSync = (event: CustomEvent) => {
      const detail = event.detail || {}
      console.log('📡 AdminSync: Ping direto recebido:', detail)
      
      processEvent({
        timestamp: detail.timestamp || Date.now(),
        dataTypes: detail.dataTypes || [],
        action: 'admin_ping',
        immediate: detail.immediate || true
      })
    }

    // Listener para mudanças no localStorage (sincronização entre abas)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'adminLastSave' || event.key === 'adminDataLastUpdate') {
        console.log('📡 AdminSync: Mudança localStorage detectada:', event.key)
        
        try {
          let eventData: SyncEvent = {
            timestamp: Date.now(),
            dataTypes: [],
            action: 'storage_sync'
          }

          if (event.key === 'adminLastSave' && event.newValue) {
            const data = JSON.parse(event.newValue)
            eventData = {
              timestamp: data.timestamp || Date.now(),
              dataTypes: data.dataTypes || [],
              action: data.action || 'storage_sync',
              immediate: data.immediate || false
            }
          }

          processEvent(eventData)
        } catch (error) {
          console.error('❌ Erro ao processar evento de localStorage:', error)
        }
      }
    }

    // Registrar todos os listeners
    window.addEventListener('adminDataUpdate', handleAdminUpdate as EventListener)
    window.addEventListener('optionsDataUpdate', handleOptionsUpdate as EventListener)
    window.addEventListener('boatModelsUpdate', handleBoatModelsUpdate as EventListener)
    window.addEventListener('adminToSalesSync', handleAdminToSalesSync as EventListener)
    window.addEventListener('storage', handleStorageChange)

    console.log('✅ AdminContinuousSync: Listeners configurados com sucesso')

    // Heartbeat para detectar e resolver problemas de sincronização
    if (enableHeartbeat) {
      console.log(`💓 AdminContinuousSync: Iniciando heartbeat (${heartbeatInterval}ms)`)
      
      heartbeatRef.current = setInterval(() => {
        console.log('💓 AdminSync: Heartbeat - verificando localStorage')
        
        try {
          const adminLastSave = localStorage.getItem('adminLastSave')
          if (adminLastSave) {
            const data = JSON.parse(adminLastSave)
            const timeDiff = Date.now() - data.timestamp
            
            // Se há dados salvos há menos de 30 segundos e não processamos ainda
            if (timeDiff < 30000 && data.timestamp > lastEventTimestamp.current) {
              console.log('💓 AdminSync: Heartbeat detectou dados não processados, sincronizando...')
              
              processEvent({
                timestamp: data.timestamp,
                dataTypes: data.dataTypes || [],
                action: 'heartbeat_sync',
                immediate: true
              })
            }
          }
        } catch (error) {
          console.error('❌ Erro no heartbeat:', error)
        }
      }, heartbeatInterval)
    }

    // Cleanup
    return () => {
      console.log('🧹 AdminContinuousSync: Removendo listeners')
      
      window.removeEventListener('adminDataUpdate', handleAdminUpdate as EventListener)
      window.removeEventListener('optionsDataUpdate', handleOptionsUpdate as EventListener)
      window.removeEventListener('boatModelsUpdate', handleBoatModelsUpdate as EventListener)
      window.removeEventListener('adminToSalesSync', handleAdminToSalesSync as EventListener)
      window.removeEventListener('storage', handleStorageChange)
      
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current)
        heartbeatRef.current = null
      }
      
      processingRef.current = false
      eventBuffer.current = []
    }
  }, [processEvent, enableHeartbeat, heartbeatInterval])

  // Função para notificar atualização (para uso no admin)
  const notifyUpdate = useCallback((dataTypes: string[], action: string = 'manual_update', immediate: boolean = true) => {
    console.log('🔔 AdminContinuousSync: Notificando atualização:', { dataTypes, action, immediate })
    
    const event: SyncEvent = {
      timestamp: Date.now(),
      dataTypes,
      action,
      immediate
    }

    // Disparar eventos personalizados
    const adminUpdateEvent = new CustomEvent('adminDataUpdate', {
      detail: { ...event, source: 'admin_panel' }
    })
    window.dispatchEvent(adminUpdateEvent)

    const salesPingEvent = new CustomEvent('adminToSalesSync', {
      detail: { 
        ...event, 
        message: 'Dados administrativos atualizados',
        dataTypes
      }
    })
    window.dispatchEvent(salesPingEvent)

    // Atualizar localStorage
    try {
      localStorage.setItem('adminDataLastUpdate', event.timestamp.toString())
      localStorage.setItem('adminLastSave', JSON.stringify(event))
    } catch (error) {
      console.error('❌ Erro ao atualizar localStorage:', error)
    }

    console.log('✅ AdminContinuousSync: Notificação enviada com sucesso')
  }, [])

  return {
    notifyUpdate,
    lastEventTimestamp: lastEventTimestamp.current
  }
}