import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Only create client if environment variables are available (not during build)
const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null

export async function GET() {
  try {
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "Database not configured" },
        { status: 503 }
      )
    }

    const results: any = {}

    // Testar conexão básica
    const { error: connectionError } = await supabase.from("dealers").select("id").limit(1)

    if (connectionError) {
      return NextResponse.json({
        ok: false,
        connection: false,
        error: connectionError.message,
      })
    }

    results.connection = true

    // Testar cada tabela
    const tables = [
      { name: "engine_packages", label: "Pacotes de Motor" },
      { name: "hull_colors", label: "Cores de Casco" },
      { name: "additional_options", label: "Opções Adicionais" },
      { name: "boat_models", label: "Modelos de Barco" },
      { name: "dealers", label: "Dealers" },
      { name: "orders", label: "Pedidos" },
      { name: "service_requests", label: "Solicitações de Serviço" },
    ]

    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table.name).select("*").limit(3)

        if (error) {
          results[table.name] = {
            status: "❌ Erro",
            error: error.message,
            count: 0,
            data: [],
          }
        } else {
          // Para dealers, não mostrar senhas
          let displayData = data
          if (table.name === "dealers" && data) {
            displayData = data.map((d) => ({
              id: d.id,
              name: d.name,
              email: d.email,
            }))
          }

          results[table.name] = {
            status: "✅ Sucesso",
            count: data?.length || 0,
            data: displayData || [],
          }
        }
      } catch (err) {
        results[table.name] = {
          status: "❌ Erro",
          error: String(err),
          count: 0,
          data: [],
        }
      }
    }

    return NextResponse.json({
      ok: true,
      connection: true,
      results,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        connection: false,
        error: String(error),
      },
      { status: 500 },
    )
  }
}
