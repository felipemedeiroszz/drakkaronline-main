import { createClient } from "@supabase/supabase-js"
import { createServerClient } from "./supabase"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Tipos para facilitar o uso
export interface EnginePackage {
  id?: number
  name: string
  name_pt: string
  usd: number
  brl: number
  compatible_models?: string[]
  countries?: string[]
  display_order?: number
  created_at?: string
}

export interface HullColor {
  id?: number
  name: string
  name_pt: string
  usd: number
  brl: number
  compatible_models?: string[]
  display_order?: number
  created_at?: string
}

export interface UpholsteryPackage {
  id?: number
  name: string
  name_pt: string
  usd: number
  brl: number
  compatible_models?: string[]
  display_order?: number
  created_at?: string
}

export interface AdditionalOption {
  id?: number
  name: string
  name_pt: string
  usd: number
  brl: number
  compatible_models?: string[]
  countries?: string[]
  category?: string
  display_order?: number
  created_at?: string
}

export interface BoatModel {
  id?: number
  name: string
  name_pt: string
  usd: number
  brl: number
  display_order?: number
  created_at?: string
}

export interface Dealer {
  id?: string
  name: string
  email: string
  password: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  country: string
  display_order?: number
  created_at?: string
}

export interface Order {
  id?: number
  order_id: string
  dealer_id: string // Changed from number to string for UUID
  customer_name: string
  customer_email: string
  customer_phone: string
  customer_address?: string
  customer_city?: string
  customer_state?: string
  customer_zip?: string
  customer_country?: string
  boat_model: string
  engine_package: string
  hull_color: string
  upholstery_package?: string
  additional_options: string[]
  payment_method: string
  deposit_amount: number
  additional_notes?: string
  total_usd: number
  total_brl: number
  status: string
  created_at?: string
}

export interface ServiceRequest {
  id?: number
  request_id: string
  dealer_id: string // Changed from number to string for UUID
  customer_name: string
  customer_email: string
  customer_phone: string
  customer_address?: string
  boat_model: string
  hull_id: string
  purchase_date: string
  engine_hours?: string
  request_type: string
  issues: any[]
  status: string
  created_at?: string
}

export interface Quote {
  id?: number
  quote_id: string
  dealer_id: string // Changed from number to string for UUID
  customer_name: string
  customer_email: string
  customer_phone: string
  customer_address?: string
  customer_city?: string
  customer_state?: string
  customer_zip?: string
  customer_country?: string
  boat_model: string
  engine_package: string
  hull_color: string
  upholstery_package?: string
  additional_options: string[]
  payment_method?: string
  deposit_amount?: number
  additional_notes?: string
  total_usd: number
  total_brl: number
  status: string
  valid_until?: string
  created_at?: string
  updated_at?: string
}

export interface MarketingManual {
  id?: number
  name_en: string
  name_pt: string
  url: string
  image_url?: string
  display_order: number
  created_at?: string
  updated_at?: string
}

export interface MarketingWarranty {
  id?: number
  name_en: string
  name_pt: string
  url: string
  image_url?: string
  display_order: number
  created_at?: string
  updated_at?: string
}

export class DatabaseService {
  private supabase

  constructor() {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase configuration is missing")
    }
    this.supabase = createClient(supabaseUrl, supabaseKey)
  }

  // Helper method to handle Supabase errors
  private static handleSupabaseError(error: any, operation: string) {
    console.error(`Error in ${operation}:`, error)

    // Handle rate limiting
    if (error?.message?.includes("Too Many") || error?.message?.includes("rate limit")) {
      throw new Error("Rate limit exceeded. Please try again later.")
    }

    // Handle network errors
    if (error?.message?.includes("fetch")) {
      throw new Error("Network error. Please check your connection.")
    }

    // Handle JSON parsing errors
    if (error?.message?.includes("Unexpected token")) {
      throw new Error("Server response error. Please try again.")
    }

    // Default error
    throw new Error(error?.message || `Error in ${operation}`)
  }

  // Testar conexão
  static async testConnection(): Promise<boolean> {
    const supabase = createServerClient()
    try {
      const { error } = await supabase.from("dealers").select("id").limit(1)

      if (error) {
        console.error("❌ Erro na conexão:", error)
        return false
      }

      console.log("✅ Conexão com Supabase funcionando!")
      return true
    } catch (error) {
      console.error("❌ Erro ao conectar com Supabase:", error)
      return false
    }
  }

  // CRUD para Engine Packages
  static async getEnginePackages(): Promise<EnginePackage[]> {
    const supabase = createServerClient()
    try {
      const { data, error } = await supabase
        .from("engine_packages")
        .select("*")
        .order("display_order", { ascending: true, nullsFirst: false })
        .order("id", { ascending: true })

      if (error) {
        DatabaseService.handleSupabaseError(error, "getEnginePackages")
      }

      return data || []
    } catch (error) {
      DatabaseService.handleSupabaseError(error, "getEnginePackages")
      return []
    }
  }

  static async saveEnginePackages(packages: EnginePackage[]) {
    const supabase = createServerClient()
    try {
      console.log(
        "💾 Salvando pacotes de motor com países:",
        packages.map((p) => ({ name: p.name, countries: p.countries, display_order: p.display_order })),
      )

      const newItems = packages
        .filter((item) => !item.id)
        .map((item) => ({
          name: item.name,
          name_pt: item.name_pt,
          usd: item.usd,
          brl: item.brl,
          compatible_models: item.compatible_models || [],
          countries: item.countries && item.countries.length > 0 ? item.countries : ["All"],
          display_order: item.display_order,
        }))

      const existingItems = packages
        .filter((item) => item.id)
        .map((item) => ({
          id: item.id,
          name: item.name,
          name_pt: item.name_pt,
          usd: item.usd,
          brl: item.brl,
          compatible_models: item.compatible_models || [],
          countries: item.countries,
          display_order: item.display_order,
        }))

      if (newItems.length > 0) {
        console.log("📝 Inserindo novos pacotes:", newItems)
        const { error: insertError } = await supabase.from("engine_packages").insert(newItems)
        if (insertError) {
          DatabaseService.handleSupabaseError(insertError, "saveEnginePackages - insert")
        }
      }

      for (const item of existingItems) {
        console.log(`🔄 Atualizando pacote ID ${item.id} com países:`, item.countries)
        const { error: updateError } = await supabase
          .from("engine_packages")
          .update({
            name: item.name,
            name_pt: item.name_pt,
            usd: item.usd,
            brl: item.brl,
            compatible_models: item.compatible_models,
            countries: item.countries,
            display_order: item.display_order,
          })
          .eq("id", item.id!)

        if (updateError) {
          DatabaseService.handleSupabaseError(updateError, `saveEnginePackages - update ${item.id}`)
        }
      }

      console.log("✅ Pacotes de motor salvos com sucesso!")
    } catch (error) {
      DatabaseService.handleSupabaseError(error, "saveEnginePackages")
    }
  }

  // CRUD para Hull Colors
  static async getHullColors(): Promise<HullColor[]> {
    const supabase = createServerClient()
    try {
      const { data, error } = await supabase
        .from("hull_colors")
        .select("*")
        .order("display_order", { ascending: true, nullsFirst: false })
        .order("id", { ascending: true })

      if (error) {
        DatabaseService.handleSupabaseError(error, "getHullColors")
      }

      return data || []
    } catch (error) {
      DatabaseService.handleSupabaseError(error, "getHullColors")
      return []
    }
  }

  static async saveHullColors(colors: HullColor[]) {
    const supabase = createServerClient()
    try {
      const newItems = colors
        .filter((item) => !item.id)
        .map((item) => ({
          name: item.name,
          name_pt: item.name_pt,
          usd: item.usd,
          brl: item.brl,
          compatible_models: item.compatible_models || [],
          display_order: item.display_order,
        }))

      const existingItems = colors
        .filter((item) => item.id)
        .map((item) => ({
          id: item.id,
          name: item.name,
          name_pt: item.name_pt,
          usd: item.usd,
          brl: item.brl,
          compatible_models: item.compatible_models || [],
          display_order: item.display_order,
        }))

      if (newItems.length > 0) {
        const { error: insertError } = await supabase.from("hull_colors").insert(newItems)
        if (insertError) {
          DatabaseService.handleSupabaseError(insertError, "saveHullColors - insert")
        }
      }

      for (const item of existingItems) {
        const { error: updateError } = await supabase
          .from("hull_colors")
          .update({
            name: item.name,
            name_pt: item.name_pt,
            usd: item.usd,
            brl: item.brl,
            compatible_models: item.compatible_models,
            display_order: item.display_order,
          })
          .eq("id", item.id!)

        if (updateError) {
          DatabaseService.handleSupabaseError(updateError, `saveHullColors - update ${item.id}`)
        }
      }

      console.log("✅ Cores de casco salvas com sucesso!")
    } catch (error) {
      DatabaseService.handleSupabaseError(error, "saveHullColors")
    }
  }

  // CRUD para Upholstery Packages
  static async getUpholsteryPackages(): Promise<UpholsteryPackage[]> {
    const supabase = createServerClient()
    try {
      const { data, error } = await supabase
        .from("upholstery_packages")
        .select("*")
        .order("display_order", { ascending: true, nullsFirst: false })
        .order("id", { ascending: true })

      if (error) {
        DatabaseService.handleSupabaseError(error, "getUpholsteryPackages")
      }

      return data || []
    } catch (error) {
      DatabaseService.handleSupabaseError(error, "getUpholsteryPackages")
      return []
    }
  }

  static async saveUpholsteryPackages(packages: UpholsteryPackage[]) {
    const supabase = createServerClient()
    try {
      const newItems = packages
        .filter((item) => !item.id)
        .map((item) => ({
          name: item.name,
          name_pt: item.name_pt,
          usd: item.usd,
          brl: item.brl,
          compatible_models: item.compatible_models || [],
          display_order: item.display_order,
        }))

      const existingItems = packages
        .filter((item) => item.id)
        .map((item) => ({
          id: item.id,
          name: item.name,
          name_pt: item.name_pt,
          usd: item.usd,
          brl: item.brl,
          compatible_models: item.compatible_models || [],
          display_order: item.display_order,
        }))

      if (newItems.length > 0) {
        const { error: insertError } = await supabase.from("upholstery_packages").insert(newItems)
        if (insertError) {
          DatabaseService.handleSupabaseError(insertError, "saveUpholsteryPackages - insert")
        }
      }

      for (const item of existingItems) {
        const { error: updateError } = await supabase
          .from("upholstery_packages")
          .update({
            name: item.name,
            name_pt: item.name_pt,
            usd: item.usd,
            brl: item.brl,
            compatible_models: item.compatible_models,
            display_order: item.display_order,
          })
          .eq("id", item.id!)

        if (updateError) {
          DatabaseService.handleSupabaseError(updateError, `saveUpholsteryPackages - update ${item.id}`)
        }
      }

      console.log("✅ Pacotes de estofamento salvos com sucesso!")
    } catch (error) {
      DatabaseService.handleSupabaseError(error, "saveUpholsteryPackages")
    }
  }

  // CRUD para Additional Options
  static async getAdditionalOptions(): Promise<AdditionalOption[]> {
    const supabase = createServerClient()
    try {
      const { data, error } = await supabase
        .from("additional_options")
        .select("*")
        .order("display_order", { ascending: true, nullsFirst: false })
        .order("id", { ascending: true })

      if (error) {
        DatabaseService.handleSupabaseError(error, "getAdditionalOptions")
      }

      return data || []
    } catch (error) {
      DatabaseService.handleSupabaseError(error, "getAdditionalOptions")
      return []
    }
  }

  static async saveAdditionalOptions(options: AdditionalOption[]) {
    const supabase = createServerClient()
    try {
      const newItems = options
        .filter((option) => !option.id)
        .map((option) => ({
          name: option.name,
          name_pt: option.name_pt,
          usd: option.usd,
          brl: option.brl,
          compatible_models: option.compatible_models || [],
          countries: option.countries && option.countries.length > 0 ? option.countries : ["All"],
          category: option.category || "deck_equipment_comfort",
          display_order: option.display_order,
        }))

      const existingItems = options
        .filter((option) => option.id)
        .map((option) => ({
          id: option.id,
          name: option.name,
          name_pt: option.name_pt,
          usd: option.usd,
          brl: option.brl,
          compatible_models: option.compatible_models || [],
          countries: option.countries,
          category: option.category || "deck_equipment_comfort",
          display_order: option.display_order,
        }))

      if (newItems.length > 0) {
        const { error: insertError } = await supabase.from("additional_options").insert(newItems)
        if (insertError) {
          DatabaseService.handleSupabaseError(insertError, "saveAdditionalOptions - insert")
        }
      }

      for (const item of existingItems) {
        const { error: updateError } = await supabase
          .from("additional_options")
          .update({
            name: item.name,
            name_pt: item.name_pt,
            usd: item.usd,
            brl: item.brl,
            compatible_models: item.compatible_models,
            countries: item.countries,
            category: item.category,
            display_order: item.display_order,
          })
          .eq("id", item.id)

        if (updateError) {
          DatabaseService.handleSupabaseError(updateError, `saveAdditionalOptions - update ${item.id}`)
        }
      }

      console.log("✅ Opções adicionais salvas com sucesso!")
    } catch (error) {
      DatabaseService.handleSupabaseError(error, "saveAdditionalOptions")
    }
  }

  // CRUD para Boat Models
  static async getBoatModels(): Promise<BoatModel[]> {
    const supabase = createServerClient()
    try {
      const { data, error } = await supabase
        .from("boat_models")
        .select("*")
        .order("display_order", { ascending: true, nullsFirst: false })
        .order("id", { ascending: true })

      if (error) {
        DatabaseService.handleSupabaseError(error, "getBoatModels")
      }

      return data || []
    } catch (error) {
      DatabaseService.handleSupabaseError(error, "getBoatModels")
      return []
    }
  }

  static async saveBoatModels(models: BoatModel[]) {
    const supabase = createServerClient()
    try {
      const newItems = models
        .filter((model) => !model.id)
        .map((model) => ({
          name: model.name,
          name_pt: model.name_pt,
          usd: model.usd || 0,
          brl: model.brl || 0,
          display_order: model.display_order,
        }))

      const existingItems = models
        .filter((model) => model.id)
        .map((model) => ({
          id: model.id,
          name: model.name,
          name_pt: model.name_pt,
          usd: model.usd || 0,
          brl: model.brl || 0,
          display_order: model.display_order,
        }))

      if (newItems.length > 0) {
        const { error: insertError } = await supabase.from("boat_models").insert(newItems)
        if (insertError) {
          DatabaseService.handleSupabaseError(insertError, "saveBoatModels - insert")
        }
      }

      for (const item of existingItems) {
        const { error: updateError } = await supabase
          .from("boat_models")
          .update({
            name: item.name,
            name_pt: item.name_pt,
            usd: item.usd || 0,
            brl: item.brl || 0,
            display_order: item.display_order,
          })
          .eq("id", item.id)

        if (updateError) {
          DatabaseService.handleSupabaseError(updateError, `saveBoatModels - update ${item.id}`)
        }
      }

      console.log("✅ Modelos de barco salvos com sucesso!")
    } catch (error) {
      DatabaseService.handleSupabaseError(error, "saveBoatModels")
    }
  }

  // CRUD para Dealers
  static async getDealers(): Promise<Dealer[]> {
    const supabase = createServerClient()
    try {
      const { data, error } = await supabase
        .from("dealers")
        .select("*")
        .order("display_order", { ascending: true, nullsFirst: false })
        .order("id", { ascending: true })

      if (error) {
        DatabaseService.handleSupabaseError(error, "getDealers")
      }

      return data || []
    } catch (error) {
      DatabaseService.handleSupabaseError(error, "getDealers")
      return []
    }
  }

  static async getDealerById(dealerId: string): Promise<Dealer | null> {
    const supabase = createServerClient()
    try {
      const { data, error } = await supabase.from("dealers").select("*").eq("id", dealerId).single()

      if (error) {
        DatabaseService.handleSupabaseError(error, `getDealerById - ${dealerId}`)
      }
      return data
    } catch (error) {
      DatabaseService.handleSupabaseError(error, `getDealerById - ${dealerId}`)
      return null
    }
  }

  static async updateDealerPassword(dealerId: string, newPassword: string): Promise<void> {
    const supabase = createServerClient()
    try {
      const { error } = await supabase.from("dealers").update({ password: newPassword }).eq("id", dealerId)

      if (error) {
        DatabaseService.handleSupabaseError(error, "updateDealerPassword")
      }

      console.log("✅ Senha do dealer atualizada com sucesso!")
    } catch (error) {
      DatabaseService.handleSupabaseError(error, "updateDealerPassword")
    }
  }

  static async saveDealers(dealers: Dealer[]) {
    const supabase = createServerClient()
    try {
      console.log("🔄 Iniciando salvamento de dealers:", dealers.length)
      const uniqueByEmail = Array.from(new Map(dealers.map((d) => [d.email?.toLowerCase().trim(), d])).values())
      console.log("📧 Dealers únicos por email:", uniqueByEmail.length)

      // First, get all existing dealers from the database to check for email conflicts
      console.log("🔍 Buscando dealers existentes...")
      const { data: existingDealers, error: fetchError } = await supabase.from("dealers").select("id, email")

      if (fetchError) {
        DatabaseService.handleSupabaseError(fetchError, "saveDealers - fetch existing")
      }

      console.log("✅ Dealers existentes encontrados:", existingDealers?.length || 0)

      const existingEmails = new Set(existingDealers?.map((d) => d.email?.toLowerCase().trim()) || [])
      const existingEmailToId = new Map(existingDealers?.map((d) => [d.email?.toLowerCase().trim(), d.id]) || [])

      // Separate dealers into new and existing based on email existence in database
      const newDealers = uniqueByEmail.filter((d) => !existingEmails.has(d.email?.toLowerCase().trim()))
      const existingDealersToUpdate = uniqueByEmail.filter((d) => existingEmails.has(d.email?.toLowerCase().trim()))

      console.log("📝 Novos dealers para inserir:", newDealers.length)
      console.log("🔄 Dealers existentes para atualizar:", existingDealersToUpdate.length)

      // Insert new dealers (without id field)
      if (newDealers.length > 0) {
        console.log(
          "📝 Inserindo novos dealers:",
          newDealers.map((d) => d.email),
        )

        const { error: insertError } = await supabase.from("dealers").insert(
          newDealers.map((d) => ({
            name: d.name,
            email: d.email,
            password: d.password,
            phone: d.phone || null,
            address: d.address || null,
            city: d.city || null,
            state: d.state || null,
            zip_code: d.zip_code || null,
            country: d.country,
            display_order: d.display_order || null,
          })),
        )

        if (insertError) {
          DatabaseService.handleSupabaseError(insertError, "saveDealers - insert new")
        }
        console.log("✅ Novos dealers inseridos com sucesso!")
      }

      // Update existing dealers
      if (existingDealersToUpdate.length > 0) {
        console.log(
          "🔄 Atualizando dealers existentes:",
          existingDealersToUpdate.map((d) => d.email),
        )

        for (const dealer of existingDealersToUpdate) {
          const existingId = existingEmailToId.get(dealer.email?.toLowerCase().trim())
          console.log(`🔄 Atualizando dealer ${dealer.email} (ID: ${existingId})`)

          const { error: updateError } = await supabase
            .from("dealers")
            .update({
              name: dealer.name,
              password: dealer.password,
              phone: dealer.phone || null,
              address: dealer.address || null,
              city: dealer.city || null,
              state: dealer.state || null,
              zip_code: dealer.zip_code || null,
              country: dealer.country,
              display_order: dealer.display_order || null,
            })
            .eq("id", existingId)

          if (updateError) {
            DatabaseService.handleSupabaseError(updateError, `saveDealers - update ${dealer.email}`)
          }
          console.log(`✅ Dealer ${dealer.email} atualizado com sucesso!`)
        }
      }

      console.log("✅ Todos os dealers foram salvos/atualizados com sucesso!")
    } catch (error) {
      DatabaseService.handleSupabaseError(error, "saveDealers")
    }
  }

  // Autenticação de dealer
  static async authenticateDealer(email: string, password: string): Promise<Dealer | null> {
    const supabase = createServerClient()
    try {
      const { data, error } = await supabase
        .from("dealers")
        .select("*")
        .eq("email", email)
        .eq("password", password)
        .single()

      if (error) return null
      return data
    } catch (error) {
      console.error("Erro na autenticação:", error)
      return null
    }
  }

  // CRUD para Orders
  static async getOrders(): Promise<Order[]> {
    const supabase = createServerClient()
    try {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false })

      if (error) {
        DatabaseService.handleSupabaseError(error, "getOrders")
      }
      return data || []
    } catch (error) {
      DatabaseService.handleSupabaseError(error, "getOrders")
      return []
    }
  }

  static async saveOrders(orders: Pick<Order, "order_id" | "status">[]) {
    const supabase = createServerClient()
    try {
      for (const order of orders) {
        const { error } = await supabase.from("orders").update({ status: order.status }).eq("order_id", order.order_id)

        if (error) {
          console.error(`Erro ao atualizar o pedido ${order.order_id}:`, error)
        }
      }
      console.log("✅ Status dos pedidos atualizados com sucesso!")
    } catch (error) {
      DatabaseService.handleSupabaseError(error, "saveOrders")
    }
  }

  static async getOrdersByDealer(dealerId: string): Promise<Order[]> {
    const supabase = createServerClient()
    console.log("🔍 Debug - getOrdersByDealer - Buscando pedidos para dealer_id:", dealerId)
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("dealer_id", dealerId)
        .order("created_at", { ascending: false })

      if (error) {
        DatabaseService.handleSupabaseError(error, "getOrdersByDealer")
      }

      return data || []
    } catch (error) {
      DatabaseService.handleSupabaseError(error, "getOrdersByDealer")
      return []
    }
  }

  static async createOrder(orderData: Omit<Order, "id" | "created_at">) {
    const supabase = createServerClient()
    try {
      const { data, error } = await supabase.from("orders").insert([orderData]).select().single()

      if (error) {
        DatabaseService.handleSupabaseError(error, "createOrder")
      }

      console.log("✅ Pedido criado com sucesso!")
      return data
    } catch (error) {
      DatabaseService.handleSupabaseError(error, "createOrder")
    }
  }

  static async updateOrderStatus(orderId: string, status: string) {
    const supabase = createServerClient()
    try {
      const { error } = await supabase.from("orders").update({ status }).eq("order_id", orderId)

      if (error) {
        DatabaseService.handleSupabaseError(error, "updateOrderStatus")
      }

      console.log("✅ Status do pedido atualizado!")
    } catch (error) {
      DatabaseService.handleSupabaseError(error, "updateOrderStatus")
    }
  }

  // CRUD para Service Requests
  static async getServiceRequests(): Promise<ServiceRequest[]> {
    const supabase = createServerClient()
    try {
      const { data, error } = await supabase
        .from("service_requests")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        DatabaseService.handleSupabaseError(error, "getServiceRequests")
      }
      return data || []
    } catch (error) {
      DatabaseService.handleSupabaseError(error, "getServiceRequests")
      return []
    }
  }

  static async getServiceRequestsByDealer(dealerId: string): Promise<ServiceRequest[]> {
    const supabase = createServerClient()
    try {
      const { data, error } = await supabase
        .from("service_requests")
        .select("*")
        .eq("dealer_id", dealerId)
        .order("created_at", { ascending: false })

      if (error) {
        DatabaseService.handleSupabaseError(error, "getServiceRequestsByDealer")
      }

      return data || []
    } catch (error) {
      DatabaseService.handleSupabaseError(error, "getServiceRequestsByDealer")
      return []
    }
  }

  static async createServiceRequest(requestData: Omit<ServiceRequest, "id" | "created_at">) {
    const supabase = createServerClient()
    try {
      requestData.status = requestData.status?.toLowerCase() ?? "open"

      const { data, error } = await supabase
        .from("service_requests")
        .upsert([requestData], { onConflict: "request_id" })
        .select()
        .single()

      if (error) {
        DatabaseService.handleSupabaseError(error, "createServiceRequest")
      }

      console.log("✅ Solicitação criada/atualizada com sucesso!")
      return data
    } catch (error) {
      DatabaseService.handleSupabaseError(error, "createServiceRequest")
    }
  }

  static async updateServiceRequestStatus(requestId: string, status: string) {
    const supabase = createServerClient()
    try {
      const { error } = await supabase.from("service_requests").update({ status }).eq("request_id", requestId)

      if (error) {
        DatabaseService.handleSupabaseError(error, "updateServiceRequestStatus")
      }

      console.log("✅ Status da solicitação atualizado!")
    } catch (error) {
      DatabaseService.handleSupabaseError(error, "updateServiceRequestStatus")
    }
  }

  static async deleteServiceRequest(requestId: string) {
    const supabase = createServerClient()
    try {
      const { error } = await supabase.from("service_requests").delete().eq("request_id", requestId)
      if (error) {
        DatabaseService.handleSupabaseError(error, "deleteServiceRequest")
      }
      console.log("✅ Solicitação deletada com sucesso!")
    } catch (error) {
      DatabaseService.handleSupabaseError(error, "deleteServiceRequest")
    }
  }

  // CRUD para Quotes
  static async getQuotes(): Promise<Quote[]> {
    const supabase = createServerClient()
    try {
      const { data, error } = await supabase.from("quotes").select("*").order("created_at", { ascending: false })

      if (error) {
        if (error.code === "42P01") {
          console.warn("quotes table not found – run scripts/create-quotes-table-fixed.sql to create it.")
          return []
        }
        DatabaseService.handleSupabaseError(error, "getQuotes")
      }
      return data || []
    } catch (error) {
      DatabaseService.handleSupabaseError(error, "getQuotes")
      return []
    }
  }

  static async getQuotesByDealer(dealerId: string): Promise<Quote[]> {
    const supabase = createServerClient()
    try {
      console.log("Buscando orçamentos para dealer ID:", dealerId)

      const { data, error } = await supabase
        .from("quotes")
        .select("*")
        .eq("dealer_id", dealerId)
        .order("created_at", { ascending: false })

      if (error) {
        if (error.code === "42P01") {
          console.warn("quotes table not found – run scripts/create-quotes-table-fixed.sql to create it.")
          return []
        }
        DatabaseService.handleSupabaseError(error, "getQuotesByDealer")
      }

      console.log("Orçamentos encontrados no banco:", data?.length || 0)
      return data || []
    } catch (error) {
      DatabaseService.handleSupabaseError(error, "getQuotesByDealer")
      return []
    }
  }

  static async getQuoteById(quoteId: string): Promise<Quote | null> {
    const supabase = createServerClient()
    try {
      const { data, error } = await supabase.from("quotes").select("*").eq("quote_id", quoteId).single()

      if (error) {
        if (error.code === "PGRST116") {
          console.log("Orçamento não encontrado:", quoteId)
          return null
        }
        DatabaseService.handleSupabaseError(error, "getQuoteById")
      }

      return data
    } catch (error) {
      DatabaseService.handleSupabaseError(error, "getQuoteById")
      return null
    }
  }

  static async createQuote(quoteData: Omit<Quote, "id" | "created_at" | "updated_at">) {
    const supabase = createServerClient()
    try {
      console.log("Criando orçamento com dados:", quoteData)

      // Validate that dealer_id is not null
      if (!quoteData.dealer_id) {
        throw new Error("dealer_id é obrigatório para criar um orçamento")
      }

      // Ensure additional_options is properly formatted for JSONB
      const cleanData = {
        ...quoteData,
        additional_options: Array.isArray(quoteData.additional_options) ? quoteData.additional_options : [],
      }

      console.log("Dados limpos para inserção:", cleanData)

      const { data, error } = await supabase.from("quotes").insert([cleanData]).select().single()

      if (error) {
        DatabaseService.handleSupabaseError(error, "createQuote")
      }

      console.log("✅ Orçamento criado com sucesso!")
      return data
    } catch (error) {
      DatabaseService.handleSupabaseError(error, "createQuote")
    }
  }

  static async updateQuoteStatus(quoteId: string, status: string) {
    const supabase = createServerClient()
    try {
      console.log("Atualizando status do orçamento:", quoteId, "para:", status)

      const { error } = await supabase.from("quotes").update({ status }).eq("quote_id", quoteId)

      if (error) {
        DatabaseService.handleSupabaseError(error, "updateQuoteStatus")
      }

      console.log("✅ Status do orçamento atualizado!")
    } catch (error) {
      DatabaseService.handleSupabaseError(error, "updateQuoteStatus")
    }
  }

  // Funções utilitárias
  static generateOrderId(): string {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const day = String(now.getDate()).padStart(2, "0")
    const timestamp = now.getTime().toString().slice(-4)

    return `ORD-${year}${month}${day}-${timestamp}`
  }

  static generateServiceRequestId(): string {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const day = String(now.getDate()).padStart(2, "0")
    const timestamp = now.getTime().toString().slice(-4)

    return `SR-${year}${month}${day}-${timestamp}`
  }

  static generateQuoteId(): string {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const day = String(now.getDate()).padStart(2, "0")
    const timestamp = now.getTime().toString().slice(-4)

    return `QUO-${year}${month}${day}-${timestamp}`
  }

  // Subscrições em tempo real
  static subscribeToOrders(callback: (orders: Order[]) => void) {
    const supabase = createServerClient()
    return supabase
      .channel("orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        DatabaseService.getOrders().then(callback)
      })
      .subscribe()
  }

  static subscribeToServiceRequests(callback: (requests: ServiceRequest[]) => void) {
    const supabase = createServerClient()
    return supabase
      .channel("service_requests")
      .on("postgres_changes", { event: "*", schema: "public", table: "service_requests" }, () => {
        DatabaseService.getServiceRequests().then(callback)
      })
      .subscribe()
  }

  // Funções de Delete
  static async deleteEnginePackage(id: number) {
    const supabase = createServerClient()
    try {
      const { error } = await supabase.from("engine_packages").delete().eq("id", id)
      if (error) {
        DatabaseService.handleSupabaseError(error, "deleteEnginePackage")
      }
      console.log("✅ Pacote de motor deletado com sucesso!")
    } catch (error) {
      DatabaseService.handleSupabaseError(error, "deleteEnginePackage")
    }
  }

  static async deleteHullColor(id: number) {
    const supabase = createServerClient()
    try {
      const { error } = await supabase.from("hull_colors").delete().eq("id", id)
      if (error) {
        DatabaseService.handleSupabaseError(error, "deleteHullColor")
      }
      console.log("✅ Cor de casco deletada com sucesso!")
    } catch (error) {
      DatabaseService.handleSupabaseError(error, "deleteHullColor")
    }
  }

  static async deleteUpholsteryPackage(id: number) {
    const supabase = createServerClient()
    try {
      const { error } = await supabase.from("upholstery_packages").delete().eq("id", id)
      if (error) {
        DatabaseService.handleSupabaseError(error, "deleteUpholsteryPackage")
      }
      console.log("✅ Pacote de estofamento deletado com sucesso!")
    } catch (error) {
      DatabaseService.handleSupabaseError(error, "deleteUpholsteryPackage")
    }
  }

  static async deleteAdditionalOption(id: number) {
    const supabase = createServerClient()
    try {
      const { error } = await supabase.from("additional_options").delete().eq("id", id)
      if (error) {
        DatabaseService.handleSupabaseError(error, "deleteAdditionalOption")
      }
      console.log("✅ Opção adicional deletada com sucesso!")
    } catch (error) {
      DatabaseService.handleSupabaseError(error, "deleteAdditionalOption")
    }
  }

  static async deleteBoatModel(id: number) {
    const supabase = createServerClient()
    try {
      const { error } = await supabase.from("boat_models").delete().eq("id", id)
      if (error) {
        DatabaseService.handleSupabaseError(error, "deleteBoatModel")
      }
      console.log("✅ Modelo de barco deletado com sucesso!")
    } catch (error) {
      DatabaseService.handleSupabaseError(error, "deleteBoatModel")
    }
  }

  static async deleteDealer(id: string) {
    const supabase = createServerClient()
    try {
      const { error } = await supabase.from("dealers").delete().eq("id", id)
      if (error) {
        DatabaseService.handleSupabaseError(error, "deleteDealer")
      }
      console.log("✅ Dealer deletado com sucesso!")
    } catch (error) {
      DatabaseService.handleSupabaseError(error, "deleteDealer")
    }
  }

  // New delete functions for orders and service requests
  static async deleteOrder(orderId: string) {
    const supabase = createServerClient()
    try {
      const { error } = await supabase.from("orders").delete().eq("order_id", orderId)
      if (error) {
        DatabaseService.handleSupabaseError(error, "deleteOrder")
      }
      console.log("✅ Pedido deletado com sucesso!")
    } catch (error) {
      DatabaseService.handleSupabaseError(error, "deleteOrder")
    }
  }

  // Funções para senha do Admin
  static async getAdminPassword(): Promise<string | null> {
    const supabase = createServerClient()
    try {
      const { data, error } = await supabase.from("admin_settings").select("value").eq("key", "admin_password").single()

      if (error) {
        if (error.code === "PGRST116") {
          console.warn("Senha do admin não encontrada no banco. Usando padrão 'drakkar'.")
          return "drakkar"
        }
        DatabaseService.handleSupabaseError(error, "getAdminPassword")
      }
      return data?.value || "drakkar"
    } catch (error) {
      console.error("❌ Erro ao buscar senha do admin:", error)
      return "drakkar"
    }
  }

  static async updateAdminPassword(newPassword: string): Promise<void> {
    const supabase = createServerClient()
    try {
      const { error } = await supabase.from("admin_settings").update({ value: newPassword }).eq("key", "admin_password")

      if (error) {
        DatabaseService.handleSupabaseError(error, "updateAdminPassword")
      }
      console.log("✅ Senha do admin atualizada com sucesso!")
    } catch (error) {
      DatabaseService.handleSupabaseError(error, "updateAdminPassword")
    }
  }

  // Funções para email de notificação
  static async getNotificationEmail(): Promise<string | null> {
    const supabase = createServerClient()
    try {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("value")
        .eq("key", "notification_email")
        .single()

      if (error) {
        if (error.code === "PGRST116") {
          console.warn("Email de notificação não encontrado no banco.")
          return null
        }
        DatabaseService.handleSupabaseError(error, "getNotificationEmail")
      }
      return data?.value || null
    } catch (error) {
      DatabaseService.handleSupabaseError(error, "getNotificationEmail")
      return null
    }
  }

  static async updateNotificationEmail(email: string): Promise<void> {
    const supabase = createServerClient()
    try {
      const { error } = await supabase.from("admin_settings").upsert({ key: "notification_email", value: email })

      if (error) {
        DatabaseService.handleSupabaseError(error, "updateNotificationEmail")
      }
      console.log("✅ Email de notificação atualizado com sucesso!")
    } catch (error) {
      DatabaseService.handleSupabaseError(error, "updateNotificationEmail")
    }
  }

  static async updateDisplayOrder(tableName: string, items: { id: string | number; display_order: number }[]) {
    const supabase = createServerClient()
    try {
      console.log(`🔄 Atualizando ordem da tabela ${tableName}:`, items)

      for (const item of items) {
        const { error } = await supabase.from(tableName).update({ display_order: item.display_order }).eq("id", item.id)

        if (error) {
          DatabaseService.handleSupabaseError(error, `updateDisplayOrder - ${tableName} - ${item.id}`)
        }
      }

      console.log(`✅ Ordem da tabela ${tableName} atualizada com sucesso!`)
    } catch (error) {
      DatabaseService.handleSupabaseError(error, `updateDisplayOrder - ${tableName}`)
    }
  }

  // CRUD for Marketing Manuals
  async getMarketingManuals(): Promise<MarketingManual[]> {
    try {
      const { data, error } = await this.supabase
        .from("marketing_manuals")
        .select("*")
        .order("display_order", { ascending: true })

      if (error) {
        DatabaseService.handleSupabaseError(error, "getMarketingManuals")
      }

      return data || []
    } catch (error) {
      DatabaseService.handleSupabaseError(error, "getMarketingManuals")
      return []
    }
  }

  async saveMarketingManual(manual: MarketingManual): Promise<MarketingManual> {
    try {
      if (manual.id) {
        // Update existing manual
        const { data, error } = await this.supabase
          .from("marketing_manuals")
          .update({
            name_en: manual.name_en,
            name_pt: manual.name_pt,
            url: manual.url,
            image_url: manual.image_url,
            display_order: manual.display_order,
            updated_at: new Date().toISOString(),
          })
          .eq("id", manual.id)
          .select()
          .single()

        if (error) {
          DatabaseService.handleSupabaseError(error, "saveMarketingManual - update")
        }

        return data
      } else {
        // Create new manual
        const { data, error } = await this.supabase
          .from("marketing_manuals")
          .insert({
            name_en: manual.name_en,
            name_pt: manual.name_pt,
            url: manual.url,
            image_url: manual.image_url,
            display_order: manual.display_order,
          })
          .select()
          .single()

        if (error) {
          DatabaseService.handleSupabaseError(error, "saveMarketingManual - create")
        }

        return data
      }
    } catch (error) {
      DatabaseService.handleSupabaseError(error, "saveMarketingManual")
      throw error
    }
  }

  async deleteMarketingManual(id: number): Promise<void> {
    try {
      const { error } = await this.supabase.from("marketing_manuals").delete().eq("id", id)

      if (error) {
        DatabaseService.handleSupabaseError(error, "deleteMarketingManual")
      }
    } catch (error) {
      DatabaseService.handleSupabaseError(error, "deleteMarketingManual")
    }
  }

  // CRUD for Marketing Warranties
  async getMarketingWarranties(): Promise<MarketingWarranty[]> {
    try {
      const { data, error } = await this.supabase
        .from("marketing_warranties")
        .select("*")
        .order("display_order", { ascending: true })

      if (error) {
        DatabaseService.handleSupabaseError(error, "getMarketingWarranties")
      }

      return data || []
    } catch (error) {
      DatabaseService.handleSupabaseError(error, "getMarketingWarranties")
      return []
    }
  }

  async saveMarketingWarranty(warranty: MarketingWarranty): Promise<MarketingWarranty> {
    try {
      if (warranty.id) {
        // Update existing warranty
        const { data, error } = await this.supabase
          .from("marketing_warranties")
          .update({
            name_en: warranty.name_en,
            name_pt: warranty.name_pt,
            url: warranty.url,
            image_url: warranty.image_url,
            display_order: warranty.display_order,
            updated_at: new Date().toISOString(),
          })
          .eq("id", warranty.id)
          .select()
          .single()

        if (error) {
          DatabaseService.handleSupabaseError(error, "saveMarketingWarranty - update")
        }

        return data
      } else {
        // Create new warranty
        const { data, error } = await this.supabase
          .from("marketing_warranties")
          .insert({
            name_en: warranty.name_en,
            name_pt: warranty.name_pt,
            url: warranty.url,
            image_url: warranty.image_url,
            display_order: warranty.display_order,
          })
          .select()
          .single()

        if (error) {
          DatabaseService.handleSupabaseError(error, "saveMarketingWarranty - create")
        }

        return data
      }
    } catch (error) {
      DatabaseService.handleSupabaseError(error, "saveMarketingWarranty")
      throw error
    }
  }

  async deleteMarketingWarranty(id: number): Promise<void> {
    try {
      const { error } = await this.supabase.from("marketing_warranties").delete().eq("id", id)

      if (error) {
        DatabaseService.handleSupabaseError(error, "deleteMarketingWarranty")
      }
    } catch (error) {
      DatabaseService.handleSupabaseError(error, "deleteMarketingWarranty")
    }
  }
}
