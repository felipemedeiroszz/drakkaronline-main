import { useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export interface RealtimeUpdate {
  table: string
  action: 'INSERT' | 'UPDATE' | 'DELETE'
  data?: any
  old_data?: any
  timestamp: number
}

export function useRealtimeSync(
  tables: string[],
  onUpdate: (update: RealtimeUpdate) => void
) {
  useEffect(() => {
    if (!supabase) {
      console.warn('Supabase client not initialized')
      return
    }

    console.log('🔄 Setting up realtime subscriptions for tables:', tables)

    // Create a channel for all table updates
    const channel = supabase.channel('admin-dealer-sync')

    // Subscribe to changes for each table
    tables.forEach(table => {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table
        },
        (payload) => {
          console.log(`📡 Realtime update received for ${table}:`, payload)
          
          const update: RealtimeUpdate = {
            table: table,
            action: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            data: payload.new,
            old_data: payload.old,
            timestamp: Date.now()
          }
          
          onUpdate(update)
        }
      )
    })

    // Subscribe to the channel
    channel.subscribe((status) => {
      console.log('🔌 Realtime subscription status:', status)
    })

    // Cleanup function
    return () => {
      console.log('🔌 Cleaning up realtime subscriptions')
      supabase.removeChannel(channel)
    }
  }, [tables, onUpdate])
}

// Hook specifically for admin data sync
export function useAdminRealtimeSync(onUpdate: () => void) {
  const adminTables = [
    'engine_packages',
    'hull_colors',
    'upholstery_packages',
    'additional_options',
    'boat_models',
    'dealers',
    'orders',
    'service_requests',
    'marketing_content',
    'marketing_manuals',
    'marketing_warranties',
    'factory_production'
  ]

  const handleUpdate = useCallback((update: RealtimeUpdate) => {
    console.log('🔄 Admin realtime update:', update)
    
    // Trigger the update callback
    onUpdate()
    
    // Also dispatch custom events for backward compatibility
    const event = new CustomEvent('adminRealtimeUpdate', {
      detail: update
    })
    window.dispatchEvent(event)
  }, [onUpdate])

  useRealtimeSync(adminTables, handleUpdate)
}

// Hook specifically for dealer pricing sync
export function useDealerRealtimeSync(dealerId: string, onUpdate: () => void) {
  const dealerTables = [
    'dealer_pricing',
    'engine_packages',
    'hull_colors', 
    'upholstery_packages',
    'additional_options',
    'boat_models'
  ]

  const handleUpdate = useCallback((update: RealtimeUpdate) => {
    console.log('🔄 Dealer realtime update:', update)
    
    // For dealer_pricing, only trigger if it's for this dealer
    if (update.table === 'dealer_pricing') {
      const isRelevant = 
        (update.data && update.data.dealer_id === dealerId) ||
        (update.old_data && update.old_data.dealer_id === dealerId)
      
      if (!isRelevant) {
        console.log('📡 Update not relevant for this dealer, skipping')
        return
      }
    }
    
    // Trigger the update callback
    onUpdate()
    
    // Also dispatch custom events for backward compatibility
    const event = new CustomEvent('dealerRealtimeUpdate', {
      detail: update
    })
    window.dispatchEvent(event)
  }, [dealerId, onUpdate])

  useRealtimeSync(dealerTables, handleUpdate)
}