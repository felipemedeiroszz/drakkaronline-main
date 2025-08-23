import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// ESTA rota só roda no servidor – a Service Role Key nunca vai para o cliente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Only create client if environment variables are available (not during build)
const supabaseAdmin = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null

export async function POST() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: "Database not configured" },
        { status: 503 }
      )
    }

    // ---------- sample data ----------
    const sample = {
      engine_packages: [
        { name: "Mercury 150HP", name_pt: "Mercury 150HP", usd: 15000, brl: 75000 },
        { name: "Yamaha 200HP", name_pt: "Yamaha 200HP", usd: 18000, brl: 90000 },
        { name: "Suzuki 250HP", name_pt: "Suzuki 250HP", usd: 22000, brl: 110000 },
      ],
      hull_colors: [
        { name: "White", name_pt: "Branco", usd: 0, brl: 0 },
        { name: "Blue", name_pt: "Azul", usd: 500, brl: 2500 },
        { name: "Red", name_pt: "Vermelho", usd: 500, brl: 2500 },
      ],
      additional_options: [
        { name: "GPS Navigation", name_pt: "Navegação GPS", usd: 2000, brl: 10000 },
        { name: "Sound System", name_pt: "Sistema de Som", usd: 1500, brl: 7500 },
        { name: "Fishing Package", name_pt: "Pacote de Pesca", usd: 3000, brl: 15000 },
      ],
      boat_models: [
        { name: "Drakkar 25", name_pt: "Drakkar 25", usd: 45000, brl: 225000 },
        { name: "Drakkar 30", name_pt: "Drakkar 30", usd: 55000, brl: 275000 },
        { name: "Drakkar 35", name_pt: "Drakkar 35", usd: 65000, brl: 325000 },
      ],
      dealers: [
        { name: "Marina Santos", email: "dealer1@drakkar.com", password: "123456" },
        { name: "Náutica Rio", email: "dealer2@drakkar.com", password: "123456" },
        { name: "Boat Center SP", email: "dealer3@drakkar.com", password: "123456" },
      ],
    }

    // ---------- mapa das colunas únicas ----------
    // apenas dealers.email tem UNIQUE – o resto não
    const conflicts: Record<string, string> = {
      dealers: "email",
    }

    // ---------- inserir (upsert) tabela a tabela ----------
    for (const [table, rows] of Object.entries(sample)) {
      const conflictCol = conflicts[table]

      let error
      if (conflictCol) {
        // usa upsert quando há coluna única declarada
        ;({ error } = await supabaseAdmin
          .from(table)
          .upsert(rows as any, { onConflict: conflictCol, ignoreDuplicates: true }))
      } else {
        // sem UNIQUE: apenas insere ignorando duplicatas
        ;({ error } = await supabaseAdmin.from(table).insert(rows as any, { ignoreDuplicates: true }))
      }

      if (error) {
        console.error(`erro em ${table}:`, error)
        return NextResponse.json({ ok: false, table, message: error.message }, { status: 500 })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error("erro inesperado:", err)
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 })
  }
}
